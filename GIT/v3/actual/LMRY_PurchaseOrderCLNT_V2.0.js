/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_PurchaseOrderCLNT_V2.0.js			        ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     16 Ago 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/log', 'N/search', 'N/url', 'N/runtime', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', './Latam_Library/LMRY_libNumberInWordsLBRY_V2.0', './Latam_Library/LMRY_WebService_LBRY_v2.0.js', './Latam_Library/LMRY_Custom_ExchangeRate_LBRY_V2.0.js'],

  function (log, search, url, runtime, Library_Mail, Library_Number, LR_webService, Library_ExchangeRate) {

    var LMRY_script = 'LatamReady Purchase Order CLNT V2.0';
    var LMRY_access = false;
    var LMRY_countr = [];
    var featuresubs = false;
    var recordObj = '';
    var type = '';
    var licenses = [];
    //POPUP
    var current_sublist = '';
    var current_line = '';
    // obtiene el tipo de Rol.
    var nameroce = runtime.getCurrentUser().roleCenter;

    function pageInit(scriptContext) {
      // Solo One World Edition
      featuresubs = runtime.isFeatureInEffect({
        feature: 'SUBSIDIARIES'
      });

      recordObj = scriptContext.currentRecord;
      type = scriptContext.mode;
      try {
        if (type != 'print' && type != 'email') {
          var subsidiary = recordObj.getValue('subsidiary');
          licenses = Library_Mail.getLicenses(subsidiary);

          if (type == 'create' || type == 'copy') {
            var lmry_exchange_rate_field = recordObj.getField('custpage_lmry_exchange_rate');
            var lmry_basecurrency = recordObj.getField('custpage_lmry_basecurrency');
            if (lmry_exchange_rate_field != null && lmry_exchange_rate_field != '' && lmry_basecurrency != null && lmry_basecurrency != '') {
              lmry_exchange_rate_field.isDisplay = false;
              lmry_basecurrency.isDisplay = false;

              if (recordObj.getValue('entity') != '' && recordObj.getValue('entity') != null) {
                Library_ExchangeRate.ws_exchange_rate(recordObj, licenses);
              }
            }
          }

          // Valida el Acceso
          ValidateAccessPO(subsidiary); //LLena las variables de LMRY_access,LMRY_countr
          // Desactiva el campo
          var field_country = recordObj.getField({
            fieldId: 'custbody_lmry_subsidiary_country'
          })

          if (field_country) {
            field_country.isDisabled = true;
          }
        }


        if (type == 'create' || type == 'copy') {
          recordObj.setValue({
            fieldId: 'custbody_lmry_scheduled_process',
            value: false
          });
        }

        //BR CFOP        
        if (LMRY_countr[0] == 'BR' && LMRY_access && (scriptContext.mode == 'create' || scriptContext.mode == 'copy' || scriptContext.mode == 'edit')) {

          var createdFrom = recordObj.getValue('createdfrom');
          var transactionType = recordObj.getValue('custbody_lmry_br_transaction_type');

          if (!transactionType || scriptContext.mode == 'copy') {
            var typeStandard = recordObj.getValue('type');
            if (typeStandard) {
              var searchTransactionType = search.create({ type: 'customrecord_lmry_trantype', filters: [{ name: 'name', operator: 'is', values: typeStandard }] });
              searchTransactionType = searchTransactionType.run().getRange({ start: 0, end: 1 });

              if (searchTransactionType && searchTransactionType.length) {
                recordObj.setValue('custbody_lmry_br_transaction_type', searchTransactionType[0].id);
              }

            }
          }

        }//FIN BR CFOP


      } catch (errmsg) {
        Library_Mail.sendemail2(' [ pageInit ] ' + errmsg, LMRY_script, recordObj, 'tranid', 'entity');
      }
    }

    function saveRecord(scriptContext) {
      recordObj = scriptContext.currentRecord;
      try {

        //MANEJO DE POPUPS AL GUARDAR EL PURCHASE ORDER
        if (window['custBody'] != null) {
          if (!window['custBody'].closed) {
            alert('Debe cerrar el popup del BR Transaction Fields');
            return false;
          }
        }

        if (window['custCol'] != null) {
          if (!window['custCol'].closed) {
            alert('Debe cerrar el popup del Tax Result');
            recordObj.selectLine({
              sublistId: current_sublist,
              line: current_line
            });
            return false;
          }
        }

        // Solo para subsidiria de Bolivia y Paraguaya
        if (LMRY_countr[0] == 'PY' && LMRY_access == true) {
          // Fecha en Letras Parametros: Fecha
          var dateletras = Library_Number.stringdate(recordObj.getValue({
            fieldId: 'trandate'
          }));
          recordObj.setValue({
            fieldId: 'custbody_lmry_date_letter',
            value: dateletras,
            ignoreFieldChange: true
          });

          //	Se obtiene el id de la moneda
          var tipoMoneda = recordObj.getValue({
            fieldId: 'currency'
          });
          //	Se realiza la busqueda de los campos symbol y name por el id de la moneda
          var monesymb = search.lookupFields({
            type: 'currency',
            id: tipoMoneda,
            columns: ['symbol', 'name']
          });
          var mon_symb = monesymb.symbol;
          var mon_name = monesymb.name;

          // Aplica la retencion.
          var imptotal = 0.00;
          imptotal = parseFloat(recordObj.getValue({
            fieldId: 'total'
          }));
          imptotal = imptotal.toFixed(2);

          // Monto en Letras Parametros: Importe, Moneda, Simbolo y concadenador
          var impletras = Library_Number.ConvNumeroLetraESP(imptotal, mon_name, mon_symb, 'CON');
          recordObj.setValue({
            fieldId: 'custbody_lmry_pa_monto_letras',
            value: impletras,
            ignoreFieldChange: true
          });
        }

      } catch (err) {
        Library_Mail.sendemail2(' [ saveRecord ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }

      return true;
    }

    function fieldChanged(scriptContext) {
      recordObj = scriptContext.currentRecord;
      var name = scriptContext.fieldId;
      //type = recordObj.mode;

      var record_type = recordObj.getValue('baserecordtype');
      var fieldId = scriptContext.fieldId;

      try {

        if (name == 'currency' && (type == 'create' || type == 'copy')) {

          var lmry_exchange_rate_field = recordObj.getField('custpage_lmry_exchange_rate');
          if (lmry_exchange_rate_field != null && lmry_exchange_rate_field != '') {
            Library_ExchangeRate.ws_exchange_rate(recordObj, licenses);
          }
          return true;
        }

        if (name == 'custpage_lmry_exchange_rate' && (type == 'create' || type == 'copy')) {

          var lmry_exchange_rate = recordObj.getValue('custpage_lmry_exchange_rate');
          if (lmry_exchange_rate != ' ' && lmry_exchange_rate != '' && lmry_exchange_rate != null) {
            recordObj.setValue('exchangerate', lmry_exchange_rate);
          }
          return true;
        }

        if (name == 'trandate' && (type == 'create' || type == 'copy')) {
          if (recordObj.getValue('entity') != '' && recordObj.getValue('entity') != null) {
            Library_ExchangeRate.ws_exchange_rate(recordObj, licenses);
          }
          return true;
        }

        // Solo One World Edition
        if (featuresubs == true || featuresubs == 'T') {
          // if (fieldId == 'entity' && type == 'create') {
          //     var idForm = recordObj.getValue('customform');
          //     var idEntity = recordObj.getValue('entity');

          //     //* ****************************** */
          //     /* Cambio realizado el 2020.11.04  */
          //     /* En el if se agrego nameroce     */
          //     /* type: entity por vendor         */
          //     //* ****************************** */
          //     log.debug('Name Rol Center', nameroce);
          //     if (idEntity && idEntity != -1 && idForm && idForm != -1 && nameroce != 'EMPLOYEE') {
          //         var objSearch = search.lookupFields({
          //             type: 'vendor',
          //             id: idEntity,
          //             columns: ['subsidiary']
          //         });
          //         log.debug('objSearch', objSearch);
          //         var sub = objSearch.subsidiary[0].value;

          //         setWindowChanged(window, false);
          //         window.location.href = window.location.href.split('?')[0] + '?whence=&cf=' + idForm + '&entity=' + idEntity + '&subsidiary=' + sub;
          //     }
          // }

          if (fieldId == 'subsidiary' && type == 'create') {
            var cf = recordObj.getValue('customform');
            var ent = recordObj.getValue('entity');
            var sub = recordObj.getValue('subsidiary');

            if (ent != '' && ent != null && ent != -1 && cf != '' && cf != null && cf != -1 && sub != '' && sub != null && sub != -1) {

              setWindowChanged(window, false);
              window.location.href = window.location.href.split('?')[0] + '?whence=&cf=' + cf + '&entity=' + ent + '&subsidiary=' + sub;
            }
            return true;
          }
        } // Solo One World Edition

        //POP-UP BRAZIL
        if ((name == 'custcol_lmry_br_popup' || name == 'custbody_lmry_br_popup') && (type == 'create' || type == 'edit' || type == 'copy')) {
          //290, brazil

          if (!Library_Mail.getAuthorization(432, licenses)) {
            return true;
          }

          var n_country = recordObj.getText('custbody_lmry_subsidiary_country');

          if (n_country == null || n_country == '') {
            return true;
          }

          n_country = n_country.substring(0, 3).toUpperCase();

          if (n_country == 'BRA') {

            if (name == 'custcol_lmry_br_popup') {
              var current_sublist_check = scriptContext.sublistId;
              if (validate_open_window(scriptContext, 'custCol')) {
                current_sublist = scriptContext.sublistId;
                current_line = scriptContext.line;
                new_window(scriptContext, 'custCol', current_sublist, record_type, n_country);
              }

              recordObj.setCurrentSublistValue({
                sublistId: current_sublist_check,
                fieldId: 'custcol_lmry_br_popup',
                value: false,
                ignoreFieldChange: true
              });

            } else {
              if (validate_open_window(scriptContext, 'custBody')) {
                new_window(scriptContext, 'custBody', '', record_type, n_country);
              }
              recordObj.setValue({
                fieldId: 'custbody_lmry_br_popup',
                value: false,
                ignoreFieldChange: true
              });

            }

          }
        }

        if (LMRY_countr[0] == 'BR' && LMRY_access == true) {

          var flagCFOP = true;
          // Validacion para la SubLista Item - Field Item
          if (scriptContext.sublistId == 'item' && scriptContext.fieldId == 'item') {

            var idItem = recordObj.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'item'
            });

            if (idItem) {
              var typeTransaction = recordObj.getValue('type');
              var itemCFOP = search.lookupFields({
                type: 'item',
                id: idItem,
                columns: ['custitem_lmry_br_cfop_inc', 'custitem_lmry_br_cfop_display_inc', 'custitem_lmry_br_cfop_out', 'custitem_lmry_br_cfop_display_out']
              });

              var currentCFOPDisplay = recordObj.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_lmry_br_tran_outgoing_cfop_di'
              });
              var currentCFOP = recordObj.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_lmry_br_tran_outgoing_cfop'
              });

              if (!currentCFOPDisplay && itemCFOP.custitem_lmry_br_cfop_display_inc != null && itemCFOP.custitem_lmry_br_cfop_display_inc != '') {
                recordObj.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_lmry_br_tran_outgoing_cfop_di',
                  value: itemCFOP.custitem_lmry_br_cfop_display_inc,
                  ignoreFieldChange: true
                });
              }

              if (!currentCFOP && itemCFOP['custitem_lmry_br_cfop_inc'] && itemCFOP['custitem_lmry_br_cfop_inc'].length > 0) {
                flagCFOP = false;

                var nameCFOP = search.lookupFields({
                  type: 'customrecord_lmry_br_cfop_codes',
                  id: itemCFOP.custitem_lmry_br_cfop_inc[0].value,
                  columns: ['custrecord_lmry_br_cfop_description']
                });

                nameCFOP = nameCFOP.custrecord_lmry_br_cfop_description;

                if (nameCFOP) {
                  recordObj.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_lmry_br_tran_outgoing_cfop_di',
                    value: nameCFOP,
                    ignoreFieldChange: true
                  });
                }

                recordObj.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_lmry_br_tran_outgoing_cfop',
                  value: itemCFOP.custitem_lmry_br_cfop_inc[0].value,
                  ignoreFieldChange: true
                });

              }


            }
          }

          if (scriptContext.sublistId == 'item' && scriptContext.fieldId == 'custcol_lmry_br_tran_outgoing_cfop' && flagCFOP == true) {
            var cfop = recordObj.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_lmry_br_tran_outgoing_cfop'
            });
            if (cfop) {
              var nameCFOP = search.lookupFields({
                type: 'customrecord_lmry_br_cfop_codes',
                id: cfop,
                columns: ['custrecord_lmry_br_cfop_description']
              });
              nameCFOP = nameCFOP.custrecord_lmry_br_cfop_description;
              if (nameCFOP) {
                recordObj.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_lmry_br_tran_outgoing_cfop_di',
                  value: nameCFOP,
                  ignoreFieldChange: true
                });
              }
              recordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_lmry_br_tran_outgoing_cfop',
                value: cfop,
                ignoreFieldChange: true
              });
            }
          }

          flagCFOP = true;
          return true;

        }


      } catch (err) {
        Library_Mail.sendemail2(' [ fieldChanged ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }

      return true;
    }

    function validate_open_window(scriptContext, section) {
      if (window[section] == null) {
        return true;
      } else {
        if (!window[section].closed) {
          alert('The window is open.');
          return false;
        } else {
          return true;
        }
      }
    }

    function new_window(scriptContext, section, currentSublist, recordType, country) {

      if (section == 'custCol') {

        var new_suitelet = url.resolveScript({
          scriptId: 'customscript_lmry_taxpurchase_stlt',
          deploymentId: 'customdeploy_lmry_taxpurchase_stlt',
          params: {
            'param_sublist': currentSublist,
            'param_recordtype': recordType
          }
        });

      } else {

        new_suitelet = url.resolveScript({
          scriptId: 'customscript_lmry_taxpurchase_body_stlt',
          deploymentId: 'customdeploy_lmry_taxpurchase_body_stlt',
          params: {
            'param_recordtype': recordType,
            'param_country': country
          }
        });
      }

      window[section] = window.open(new_suitelet);

    }


    function validateField(scriptContext) {
      var recordObj = scriptContext.currentRecord;
      var fieldId = scriptContext.fieldId;
      try {
        if (fieldId == 'subsidiary') {
          // Valida el Acceso
          var subsidiary = recordObj.getValue({
            fieldId: 'subsidiary'
          });
          ValidateAccessPO(subsidiary);

        }
        // Solo para subsidiaria el Brasil y Paraguay - Transaccion Invoice
        else if ((LMRY_countr[0] == 'BR' || LMRY_countr[0] == 'PY') && LMRY_access) {
          // Campos
          if (fieldId == 'custbody_lmry_document_type' ||
            fieldId == 'custbody_lmry_serie_doc_cxp' ||
            fieldId == 'custbody_lmry_num_preimpreso') {
            var lmry_DocTip = recordObj.getValue({
              fieldId: 'custbody_lmry_document_type'
            });
            var lmry_DocSer = recordObj.getValue({
              fieldId: 'custbody_lmry_serie_doc_cxp'
            });
            var lmry_DocNum = recordObj.getValue({
              fieldId: 'custbody_lmry_num_preimpreso'
            });

            var texto = '';
            // Concatenado
            if (lmry_DocTip && lmry_DocSer && lmry_DocNum) {
              // Iniciales de la serie
              var TipDocDes = search.lookupFields({
                type: 'customrecord_lmry_tipo_doc',
                id: lmry_DocTip,
                columns: ['custrecord_lmry_doc_initials', 'custrecord_lmry_es_autofactura']
              });
              // Iniciales del documento
              var initials = TipDocDes.custrecord_lmry_doc_initials;
              if (initials) {
                texto = initials + ' ' + lmry_DocSer + '-' + lmry_DocNum;
              } else {
                texto = lmry_DocSer + '-' + lmry_DocNum;
              } // Iniciales del documento

              // Brasil
              if (LMRY_countr[0] == 'BR') {
                recordObj.setValue({
                  fieldId: 'tranid',
                  value: texto,
                  ignoreFieldChange: true
                });
                // Paraguay
              } else if (LMRY_countr[0] == 'PY') {
                var autofact = TipDocDes.custrecord_lmry_es_autofactura;
                if (autofact == 'T' || autofact == true) {
                  recordObj.setValue({
                    fieldId: 'otherrefnum',
                    value: texto,
                    ignoreFieldChange: true
                  });
                } // autofact
              } // Paraguay
            } // Concatenado
          } // Campos
        }


      } catch (error) {
        Library_Mail.sendemail2(' [ POClnt_ValidateField ] ' + error, LMRY_script, recordObj, 'tranid', 'entity');
      }

      return true;
    }

    function validateLine(scriptContext) {

      try {

        var recordObj = scriptContext.currentRecord;
        var form = scriptContext.sublistId;

        //VALIDACION POPUP: ADD A LA LINEA ESTE CERRADO EL POPUP
        if (Library_Mail.getAuthorization(432, licenses) == true && LMRY_countr[0] == 'BR' && window['custCol'] != null) {
          //var objRecord = scriptContext.currentRecord;
          var lineActual = recordObj.getCurrentSublistIndex(form);

          if (lineActual == current_line && form == current_sublist && !window['custCol'].closed) {
            alert('Debe cerrar el popup del Tax Result');
            return false;
          }

        }

      } catch (err) {
        Library_Mail.sendemail2(' [ POClnt_ValidateLine ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }

      return true;

    }


    function ValidateAccessPO(idSubsidiary) {
      try {
        LMRY_access = false;
        LMRY_countr = [];


        if (idSubsidiary) {
          LMRY_countr = Library_Mail.Get_Country_STLT(idSubsidiary);
        }

        if (!LMRY_countr.length) {
          return;
        }

        LMRY_access = Library_Mail.getCountryOfAccess(LMRY_countr, licenses);
      } catch (err) {
        throw '[ ValidateAccessPO ]' + err;
      }
    }

    return {
      pageInit: pageInit,
      validateField: validateField,
      validateLine: validateLine,
      saveRecord: saveRecord,
      fieldChanged: fieldChanged
    };
  });