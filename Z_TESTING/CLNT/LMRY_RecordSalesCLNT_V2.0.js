/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Transacctions Sales                        ||
||                                                              ||
||  File Name: LMRY_RecordSalesCLNT_V2.0.js                     ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     16 Ago 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define(['./Latam_Library/LMRY_Custom_ExchangeRate_LBRY_V2.0.js', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', './Latam_Library/LMRY_libNumberInWordsLBRY_V2.0', 'N/currency', 'N/record', 'N/log', 'N/currentRecord', 'N/search', 'N/runtime', 'N/url', 'N/https', './Latam_Library/LMRY_FormPopup_Desarrollo_LBRY','./Latam_Library/LMRY_AR_Unit_Price_LBRY_V2.0'],

  function (Library_ExchangeRate, Library_Mail, Library_Number, currency, record, log, currentRecord, search, runtime, url, https, libraryPopup, libraryUnitPrice) {

    var LMRY_script = 'LMRY Record Sales CLNT V2.0';
    var LMRY_access = false;
    var LMRY_countr = new Array();
    var featuresubs = false;
    var currentRCD = '';
    var mode_type = '';
    var licenses = [];
    //json global para setear los columnas de forma automatica para CHILE
    var jsonTxCode = {}
    var featureMB = runtime.isFeatureInEffect({
      feature: "MULTIBOOK"
    });

    var Val_Campos = new Array();

    //CL CHANGE CURRENCY UF
    var jsonCurrencies = {};
    var fieldRateUF = '';

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
      try {
        // Solo One World Edition
        featuresubs = runtime.isFeatureInEffect({
          feature: 'SUBSIDIARIES'
        });

        mode_type = scriptContext.mode;
        currentRCD = scriptContext.currentRecord;
        var subsidiary = currentRCD.getValue('subsidiary');

        // Desactiva el campo
        currentRCD.getField({
          fieldId: 'custbody_lmry_subsidiary_country'
        }).isDisabled = true;

        licenses = Library_Mail.getLicenses(subsidiary);

        if (mode_type == 'create' || mode_type == 'copy') {
          var lmry_exchange_rate_field = currentRCD.getField('custpage_lmry_exchange_rate');
          var lmry_basecurrency = currentRCD.getField('custpage_lmry_basecurrency');
          if (lmry_exchange_rate_field != null && lmry_exchange_rate_field != '' && lmry_basecurrency != null && lmry_basecurrency != '') {
            lmry_exchange_rate_field.isDisplay = false;
            lmry_basecurrency.isDisplay = false;

            if (currentRCD.getValue('entity') != '' && currentRCD.getValue('entity') != null) {
              Library_ExchangeRate.ws_exchange_rate(currentRCD, licenses);
            }
          }
        }

        // Valida el Acceso
        ValidateAccess(subsidiary);

        // Solo para cuando es nuevo y se copia
        if (mode_type == 'create' || mode_type == 'copy') {

          // Campos de Panama
          currentRCD.setValue({
            fieldId: 'custbody_lmry_pa_batch_number',
            value: ''
          });
          currentRCD.setValue({
            fieldId: 'custbody_lmry_pa_monto_letras',
            value: ''
          });
          // Campos para El Salvador
          currentRCD.setValue({
            fieldId: 'custbody_lmry_wtax_wamt',
            value: 0.00
          });
          currentRCD.setValue({
            fieldId: 'custbody_lmry_sv_not_taxable_total_sal',
            value: 0.00
          });
          currentRCD.setValue({
            fieldId: 'custbody_lmry_sv_exempt_total_sales',
            value: 0.00
          });
          currentRCD.setValue({
            fieldId: 'custbody_lmry_sv_taxable_total_sales',
            value: 0.00
          });
          // Documentos de Referencia
          currentRCD.setValue({
            fieldId: 'custbody_lmry_doc_serie_ref',
            value: ''
          });
          currentRCD.setValue({
            fieldId: 'custbody_lmry_num_doc_ref',
            value: ''
          });
          currentRCD.setValue({
            fieldId: 'custbody_lmry_doc_ref_date',
            value: ''
          });
          currentRCD.setValue({
            fieldId: 'custbody_lmry_ref_guia_numero',
            value: ''
          });
          currentRCD.setValue({
            fieldId: 'custbody_lmry_ref_guia_fecha',
            value: ''
          });
          currentRCD.setValue({
            fieldId: 'custbody_lmry_scheduled_process',
            value: false
          });
          // Aplicar Latam WHT Code
          currentRCD.setValue({
            fieldId: 'custbody_lmry_apply_wht_code',
            value: true
          });

        }

        if (mode_type == 'copy') {
          // Solo One World Edition
          if (featuresubs == true || featuresubs == 'T') {
            // Validamos la subsidiaria del Cliente
            var idsubsid = currentRCD.getValue('subsidiary');
            var idcontry = '';
            // Consultamos el pais de la subsidiaria
            var filters = new Array();

            filters[0] = search.createFilter({
              name: 'internalid',
              operator: search.Operator.IS,
              values: idsubsid
            });
            var columns = new Array();

            columns[0] = search.createColumn({
              name: 'country'
            });


            var recsubsi = search.create({
              type: 'subsidiary',
              columns: columns,
              filters: filters
            });

            recsubsi = recsubsi.run().getRange(0, 1000);

            if (recsubsi != '' && recsubsi != null) {
              idcontry = recsubsi[0].getText('country');
            }
            var socontry = '';

            if (currentRCD.getValue('custbody_lmry_subsidiary_country') != null && currentRCD.getValue('custbody_lmry_subsidiary_country') != '') {
              socontry = currentRCD.getText('custbody_lmry_subsidiary_country');
            }

            if (socontry != idcontry) {
              currentRCD.setText('custbody_lmry_subsidiary_country', idcontry);
              currentRCD.getField({
                fieldId: 'custbody_lmry_subsidiary_country'
              }).isDisabled = true;
            }
          } else {
            // Desactiva el campo
            var sub_country = currentRCD.getValue('custbody_lmry_subsidiary_country');
            if (sub_country == '' || sub_country == null) {
              currentRCD.getField({
                fieldId: 'custbody_lmry_subsidiary_country'
              }).isDisabled = false;
            }
          }
        } else {
          // Desactiva el campo
          var sub_country = currentRCD.getValue('custbody_lmry_subsidiary_country');
          if (sub_country == '' || sub_country == null) {
            currentRCD.getField({
              fieldId: 'custbody_lmry_subsidiary_country'
            }).isDisabled = false;
          }
        }

        //CL CHANGE CURRENCY UF
        if (LMRY_countr[0] == 'CL') {
          var type = currentRCD.getValue('baserecordtype');
          if (mode_type !== 'view' && type == 'salesorder') {
              //BUSQUEDA PARA LLENADO DE CAMPOS AUTOMATICOS PARA FACTURACION
              var searchTxCode = search.create({
                type: "customrecord_lmry_taxtype_by_invoicingid",
                filters:
                [
                  ["custrecord_lmry_taxtype_country", "anyof", "45"], 
                  "AND", 
                  ["isinactive", "is", "F"]
                ],
                columns:
                [
                  search.createColumn({ name: "custrecord_lmry_tax_code_invid", label: "Latam - Tax Code by Inv ID" }),
                  search.createColumn({ name: "custrecord_lmry_inv_id", label: "Latam - Invoicing ID" })
                ]
              });

              var runSearch = searchTxCode.run().getRange(0, 1000);
              for (var i = 0; i < runSearch.length; i++) {
                 var columns = runSearch[i].columns
                 jsonTxCode[runSearch[i].getValue(columns[0])] = runSearch[i].getValue(columns[1]);
              }
          }
          
          if (Library_Mail.getAuthorization(604, licenses) && (mode_type == 'edit' || mode_type == 'create' || mode_type == 'copy')) {
            var searchCurrencies = search.create({
              type: 'currency',
              columns: ['symbol', 'internalid', 'name'],
              filters: [{
                name: 'isinactive',
                operator: 'is',
                values: 'F'
              }]
            });
  
            searchCurrencies = searchCurrencies.run().getRange(0, 1000);
  
            for (var i = 0; i < searchCurrencies.length; i++) {
              var idCurrency = searchCurrencies[i].getValue('internalid');
              var name = searchCurrencies[i].getValue('name');
              var symbol = searchCurrencies[i].getValue('symbol');
              symbol = symbol.toUpperCase();
  
              jsonCurrencies[idCurrency] = {
                'symbol': symbol,
                'name': name
              };
  
            }
  
            var searchSetupTax = search.create({
              type: 'customrecord_lmry_setup_tax_subsidiary',
              columns: ['custrecord_lmry_setuptax_cl_rate_uf'],
              filters: [{
                name: 'isinactive',
                operator: 'is',
                values: 'F'
              }, {
                name: 'custrecord_lmry_setuptax_subsidiary',
                operator: 'is',
                values: subsidiary
              }]
            });
  
            searchSetupTax = searchSetupTax.run().getRange(0, 1);
  
            if (searchSetupTax && searchSetupTax.length && searchSetupTax[0].getValue('custrecord_lmry_setuptax_cl_rate_uf')) {
              fieldRateUF = searchSetupTax[0].getValue('custrecord_lmry_setuptax_cl_rate_uf');
            }
  
            var currencyTransaction = currentRCD.getValue('currency');
  
            //SOLO SI ES PESO CHILENO: CLP Y EXISTE EL CAMPO
            if (jsonCurrencies[currencyTransaction]['symbol'] == 'CLP' && fieldRateUF && currentRCD.getField(fieldRateUF) && mode_type != 'copy') {
  
              var rateUF = currentRCD.getValue(fieldRateUF);
              var createdFrom = currentRCD.getValue('createdfrom');
              var tranDate = currentRCD.getValue('trandate');
  
              if (!(parseFloat(rateUF) > 0)) {
  
                var rateUF = currency.exchangeRate({
                  source: 'CLF',
                  target: 'CLP',
                  date: tranDate
                });
                currentRCD.setValue({
                  fieldId: fieldRateUF,
                  value: parseFloat(rateUF),
                  ignoreFieldChange: true
                });
  
              }
  
            } // FIN SOLO SI ES PESO CHILENO
          }//FIN CL CHANGE CURRENCY UF
        } 


        //BR CFOP        
        if (LMRY_countr[0] == 'BR' && LMRY_access && (mode_type == 'create' || mode_type == 'copy' || mode_type == 'edit')) {

          var createdFrom = currentRCD.getValue('createdfrom');
          var transactionType = currentRCD.getValue('custbody_lmry_br_transaction_type');

          if (!transactionType || mode_type == 'copy') {
            var typeStandard = currentRCD.getValue('type');
            if (typeStandard) {
              var searchTransactionType = search.create({ type: 'customrecord_lmry_trantype', filters: [{ name: 'name', operator: 'is', values: typeStandard }] });
              searchTransactionType = searchTransactionType.run().getRange({ start: 0, end: 1 });

              if (searchTransactionType && searchTransactionType.length) {
                currentRCD.setValue('custbody_lmry_br_transaction_type', searchTransactionType[0].id);
              }

            }
          }

        }//FIN BR CFOP


        if (LMRY_countr[0] == 'AR') {  
          libraryUnitPrice.disabledField();   
        }

      } catch (errmsg) {
        Library_Mail.sendemail(' [ RSCLNT_PageInit ] ' + errmsg, LMRY_script);
      }
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */

    /* ------------------------------------------------------------------------------------------------------
     * Al momento de cambiar el campo entity se va hacer una recarga a la paguina pasando de datos
     * subsidiary, customform y entity.
     * --------------------------------------------------------------------------------------------------- */
    function fieldChanged(scriptContext) {
      try {
        var recordObj = scriptContext.currentRecord;
        var name = scriptContext.fieldId;
        var sublistName = scriptContext.sublistId;

        if (name == 'currency' && (mode_type == 'create' || mode_type == 'copy')) {

          var lmry_exchange_rate_field = recordObj.getField('custpage_lmry_exchange_rate');
          if (lmry_exchange_rate_field != null && lmry_exchange_rate_field != '') {
            Library_ExchangeRate.ws_exchange_rate(recordObj, licenses);
          }
        }

        if (name == 'custpage_lmry_exchange_rate' && (mode_type == 'create' || mode_type == 'copy')) {

          var lmry_exchange_rate = recordObj.getValue('custpage_lmry_exchange_rate');
          if (lmry_exchange_rate != ' ' && lmry_exchange_rate != '' && lmry_exchange_rate != null) {
            recordObj.setValue('exchangerate', lmry_exchange_rate);
          }
        }

        if (name == 'trandate' && (mode_type == 'create' || mode_type == 'copy')) {
          if (recordObj.getValue('entity') != '' && recordObj.getValue('entity') != null) {
            Library_ExchangeRate.ws_exchange_rate(recordObj, licenses);
          }
        }

        if (name == 'subsidiary' && (mode_type == 'create' || mode_type == 'copy')) {
          if (recordObj.getValue('entity') != '' && recordObj.getValue('entity') != null) {
            Library_ExchangeRate.ws_exchange_rate(recordObj, licenses);
          }
        }

        // Solo One World Edition
        if (featuresubs == true || featuresubs == 'T') {
          /*if (name == 'entity' && mode_type == 'create') {

            var cf = recordObj.getValue('customform');
            var ent = recordObj.getValue('entity');

            if (ent != '' && ent != null && ent != -1 && cf != '' && cf != null && cf != -1) {
              var subs = "";

              try {
                subs = search.lookupFields({
                  type: 'entity',
                  id: ent,
                  columns: ['subsidiary']
                });
                if (subs.subsidiary == null || subs.subsidiary == '' || subs.subsidiary == undefined) {
                  return true;
                }
                subs = subs.subsidiary[0].value;

              } catch (err) {
                console.log(err);
                subs = getWsSubsidiary(ent);
              }

              console.log(subs);

              setWindowChanged(window, false);
              window.location.href = window.location.href.split('?')[0] + '?whence=&cf=' + cf + '&entity=' + ent + '&subsidiary=' + subs;
            }
          }*/

          if (name == 'subsidiary' && mode_type == 'create') {
            var cf = recordObj.getValue('customform');
            var ent = recordObj.getValue('entity');
            var sub = recordObj.getValue('subsidiary');

            if (ent != '' && ent != null && ent != -1 && cf != '' && cf != null && cf != -1 && sub != '' && sub != null && sub != -1) {

              setWindowChanged(window, false);
              window.location.href = window.location.href.split('?')[0] + '?whence=&cf=' + cf + '&entity=' + ent + '&subsidiary=' + sub;
            }
          }
        }

        //SETEO DE CFOP AUTOMATICO CUANDO ESTA LLENO EN EL ITEM
        if (LMRY_countr[0] == 'BR' && LMRY_access == true) {
          var flagCFOP = true;
          if (sublistName == 'item' && name == 'item') {
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

              if (!currentCFOPDisplay && itemCFOP.custitem_lmry_br_cfop_display_out != null && itemCFOP.custitem_lmry_br_cfop_display_out != '') {
                recordObj.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_lmry_br_tran_outgoing_cfop_di',
                  value: itemCFOP.custitem_lmry_br_cfop_display_out,
                  ignoreFieldChange: true
                });
              }
              if (!currentCFOP && itemCFOP['custitem_lmry_br_cfop_out'] && itemCFOP['custitem_lmry_br_cfop_out'].length > 0) {
                flagCFOP = false;

                var nameCFOP = search.lookupFields({
                  type: 'customrecord_lmry_br_cfop_codes',
                  id: itemCFOP.custitem_lmry_br_cfop_out[0].value,
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
                  value: itemCFOP.custitem_lmry_br_cfop_out[0].value,
                  ignoreFieldChange: true
                });

              }

            }
          }

          if (sublistName == 'item' && name == 'custcol_lmry_br_tran_outgoing_cfop' && flagCFOP == true) {
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

        }

        //SETEO DE COLUMNAS PARA FACTURACION - CHILE
        var type = recordObj.getValue('baserecordtype');
        if (LMRY_countr[0] == 'CL' && LMRY_access == true && type == 'salesorder') {
          if (name == 'taxcode') {      
             var txcode = recordObj.getCurrentSublistValue(scriptContext.sublistId, name)
             if (jsonTxCode[txcode]) { recordObj.setCurrentSublistValue(scriptContext.sublistId, 'custcol_lmry_invoicing_id', jsonTxCode[txcode], false) }
             else { recordObj.setCurrentSublistValue(scriptContext.sublistId, 'custcol_lmry_invoicing_id', '', false) }
             return true;
          }
        }
      } catch (err) {
        console.log(err);
        alert("[ fieldChanged ]\n" + JSON.stringify({ name: err.name, message: err.message }));
        return false;
      }

      return true;
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

      var currentRCD = scriptContext.currentRecord;
      var name = scriptContext.fieldId;
      var sublistName = scriptContext.sublistId;

      if (scriptContext.fieldId == 'subsidiary') {
        // Valida el Acceso
        ValidateAccess(currentRCD.getValue('subsidiary'));
      }

      if (name == 'custbody_lmry_document_type' && LMRY_access == true) {
        Library_Mail.onFieldsHide(2, currentRCD);

        // Visualiza campos LMRY
        Library_Mail.onFieldsDisplayS(currentRCD, LMRY_countr[1], '@NONE@');
        // Tipo de Documento - Parent
        var lmry_DocSer = currentRCD.getValue('custbody_lmry_document_type');
        if (lmry_DocSer != '' && lmry_DocSer != null) {
          // Visualiza campos LMRY
          Library_Mail.onFieldsDisplayS(currentRCD, LMRY_countr[1], lmry_DocSer);
        }
      }

      // Solo para subsidiaria el Peru y El Salvador - Transaccion Invoice
      if ((LMRY_countr[0] == 'PE' || LMRY_countr[0] == 'SV') && LMRY_access) {
        // Solo para facturas
        if (currentRCD.type != 'invoice' && currentRCD.type != 'creditmemo') {
          return true;
        }

        // Serie de impresion
        if (name == 'custbody_lmry_serie_doc_cxc') {
          var lmry_DocSer = currentRCD.getValue('custbody_lmry_serie_doc_cxc');
          var lmry_DocNum = currentRCD.getValue('custbody_lmry_num_preimpreso');

          if (lmry_DocSer != '' && lmry_DocSer != null) {
            if (lmry_DocNum == '' || lmry_DocNum == null) {

              var rdSerie = search.lookupFields({
                type: 'customrecord_lmry_serie_impresion_cxc',
                id: lmry_DocSer,
                columns: ['custrecord_lmry_serie_numero_impres', 'custrecord_lmry_serie_rango_fin', 'custrecord_lmry_serie_num_digitos']
              });

              var nroConse = parseInt(rdSerie.custrecord_lmry_serie_numero_impres) + 1;
              var maxPermi = parseInt(rdSerie.custrecord_lmry_serie_rango_fin);
              var digitos = parseInt(rdSerie.custrecord_lmry_serie_num_digitos);
              if (nroConse > maxPermi) {
                alert('El ultimo numero para esta serie (' + maxPermi + ') ha sido utilizado. Verificar si existen numeros disponibles en esta serie');
                currentRCD.setValue('custbody_lmry_num_preimpreso', '');
              } else {
                var longNumeroConsec = parseInt((nroConse + '').length);
                var llenarCeros = '';
                for (var i = 0; i < (digitos - longNumeroConsec); i++) {
                  llenarCeros += '0';
                }
                nroConse = llenarCeros + nroConse;
                currentRCD.setValue('custbody_lmry_num_preimpreso', nroConse);
              }
            }
            return true;
          }
        }

        // Tipo de Documento, Serie de impresion y Numero Preimpreso
        if (name == 'custbody_lmry_document_type' ||
          name == 'custbody_lmry_serie_doc_cxc' ||
          name == 'custbody_lmry_num_preimpreso') {

          // Subsidiaria
          var subsidiaria = currentRCD.getValue('subsidiary');
          var lmry_DocTip = currentRCD.getText('custbody_lmry_document_type');

          var lmry_DocSer = currentRCD.getText('custbody_lmry_serie_doc_cxc');
          var lmry_DocNum = currentRCD.getValue('custbody_lmry_num_preimpreso');
          var tranprefix = '';
          var texto = '';
          if (subsidiaria != '' && subsidiaria != null) {
            // Pre - Fijo de la subsidiaria

            tranprefix = search.lookupFields({
              type: 'subsidiary',
              id: subsidiaria,
              columns: ['tranprefix']
            });
            if (lmry_DocTip != '' && lmry_DocTip != null &&
              lmry_DocSer != '' && lmry_DocSer != null &&
              lmry_DocNum != '' && lmry_DocNum != null) {
              if (tranprefix != '' && tranprefix != null) {
                texto = tranprefix.tranprefix + ' ' + (lmry_DocTip.substring(0, 2)).toUpperCase() + ' ' + currentRCD.getText('custbody_lmry_serie_doc_cxc') + '-' + currentRCD.getValue('custbody_lmry_num_preimpreso');
              } else {
                texto = (lmry_DocTip.substring(0, 2)).toUpperCase() + ' ' + currentRCD.getText('custbody_lmry_serie_doc_cxc') + '-' + currentRCD.getValue('custbody_lmry_num_preimpreso');
              }
              currentRCD.setValue('tranid', texto);
              return true;
            }
          }
        }
      }


      //CL CHANGE CURRENCY UF
      if (LMRY_countr[0] == 'CL' && Library_Mail.getAuthorization(604, licenses) && Object.keys(jsonCurrencies).length) {

        var currencyTransaction = currentRCD.getValue('currency');
        var tranDate = currentRCD.getValue('trandate');

        //SOLO SI EL CAMPO EXISTE
        if (fieldRateUF && currentRCD.getField(fieldRateUF)) {

          //SOLO PARA PESO CHILENO
          if (jsonCurrencies[currencyTransaction]['symbol'] == 'CLP') {

            //SETEO DE COLUMNA
            if (sublistName == 'item' && name == 'custcol_lmry_prec_unit_so') {

              var exchangeRateUF = currentRCD.getValue(fieldRateUF);
              var amountUF = currentRCD.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_lmry_prec_unit_so'
              });

              if (parseFloat(exchangeRateUF) > 0 && parseFloat(amountUF) > 0) {
                var rate = parseFloat(exchangeRateUF) * parseFloat(amountUF);
                rate = parseFloat(rate).toFixed(0);

                currentRCD.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'rate',
                  value: rate
                });

              }

            }

            //SETEO DEL TIPO DE CAMBIO AL CAMBIAR FECHA Y/O MONEDA
            if ((name == 'currency' || name == 'trandate') && tranDate) {

              var rateUF = currency.exchangeRate({
                source: 'CLF',
                target: 'CLP',
                date: tranDate
              });

              currentRCD.setValue({
                fieldId: fieldRateUF,
                value: parseFloat(rateUF),
                ignoreFieldChange: true
              });

            }

          } else {
            //CUANDO NO ES MONEDA PESO CHILENO
            currentRCD.setValue({
              fieldId: fieldRateUF,
              value: 0,
              ignoreFieldChange: true
            });

          }

        } //SOLO SI EL CAMPO EXISTE


      } //FIN CL CHANGE CURRENCY UF


      return true;

    }

    /* ------------------------------------------------------------------------------------------------------
     * Funcion que actualiza los campos de cabecera Totales Venta
     * --------------------------------------------------------------------------------------------------- */
    function UpdateTotalSales() {

      var currentRCD = currentRecord.get();
      try {
        if (!LMRY_access) {
          return true;
        }

        // Subsidiria de Panama y Mexico
        if (LMRY_countr[0] == 'PA' || LMRY_countr[0] == 'MX') {
          // Guarda Monto en Letras
          var imptotal = currentRCD.getValue('total');
          var impletras = Library_Number.ConvNumeroLetraESP(imptotal, '', '', 'Y');
          currentRCD.setValue('custbody_lmry_pa_monto_letras', impletras);
        }

        // Solo para subsidiria de Panama
        // if (LMRY_countr[0] == 'PA') {
        //   // Guia de Remision
        //   DocumentRef();
        // }

        // Subsidiaria de El Salvador
        if (LMRY_countr[0] != 'SV') {
          return true;
        }

        // Inicializa Variables
        if (currentRCD.type != 'estimate' && currentRCD.type != 'salesorder' &&
          currentRCD.type != 'invoice' && currentRCD.type != 'creditmemo') {
          return true;
        }

        // Item Tax Code
        var tv_tc = runtime.getCurrentScript().getParameter({
          name: 'custscript_lmry_item_discount_sv'
        });

        // LMRY Total Ventas No Sujetas
        var tv_ns = 0;
        // LMRY Total Ventas Exentas
        var tv_ex = 0;
        // LMRY Total Ventas Afectas
        var tv_af = 0;
        // LMRY Retenciones
        var tv_wt = 0;

        // Se suma los mismos codigos de impuesto
        var recQY = currentRCD.getLineCount('item');
        for (var pos = 0; pos < recQY; pos++) {
          var linite = currentRCD.getSublistValue('item', 'item', pos);
          var lintax = currentRCD.getSublistText('item', 'taxcode', pos);
          var linamo = currentRCD.getSublistValue('item', 'amount', pos);
          var linqty = currentRCD.getSublistValue('item', 'quantity', pos);

          switch (lintax) {
            case 'VAT_SV:NS-SV':
              tv_ns = parseFloat(tv_ns) + parseFloat(linamo);
              break;
            case 'VAT_SV:E-SV':
              if (linqty != 0) {
                tv_ex = parseFloat(tv_ex) + parseFloat(linamo);
                break;
              }
            case 'VAT_SV:UNDEF_SV':
              // Solo para Retenciones
              if (currentRCD.type == 'creditmemo' && linite == tv_tc) {
                tv_wt = parseFloat(tv_wt) + parseFloat(linamo);
              } else {
                if (linqty != 0) {
                  tv_ex = parseFloat(tv_ex) + parseFloat(linamo);
                }
              }
              break;
            case 'VAT_SV:S-SV':
              tv_af = parseFloat(tv_af) + parseFloat(linamo);
              break;
            case 'VAT_SV:X-SV':
              tv_af = parseFloat(tv_af) + parseFloat(linamo);
              break;
          }

        }

        // Para las retenciones
        var wtax_wamt = 0;
        var wtax_wcod = currentRCD.getText('custpage_4601_witaxcode');
        if (wtax_wcod != null && wtax_wcod != '') {
          if (wtax_wcod.substring(wtax_wcod.length - 3) == '_GC') {
            wtax_wamt = currentRCD.getText('custpage_4601_witaxamount');
          }
        }
        // Solo para Retenciones
        if (currentRCD.type == 'creditmemo') {
          currentRCD.setValue({
            fieldId: 'custbody_lmry_wtax_wamt',
            value: Math.abs(tv_wt)
          });
        } else {
          currentRCD.setValue({
            fieldId: 'custbody_lmry_wtax_wamt',
            value: wtax_wamt
          });
        }

        // Asigna los valores a los campos
        currentRCD.setValue('custbody_lmry_sv_not_taxable_total_sal', tv_ns);
        currentRCD.setValue('custbody_lmry_sv_exempt_total_sales', tv_ex);
        currentRCD.setValue('custbody_lmry_sv_taxable_total_sales', tv_af);


        //	Se obtiene el id de la moneda
        var tipoMoneda = currentRCD.getValue('currency');
        //	Se realiza la busqueda de los campos symbol y name por el id de la moneda


        var monedaText = search.lookupFields({
          type: 'currency',
          id: tipoMoneda,
          columns: ['symbol', 'name']
        });

        // Restamos el custbody_lmry_wtax_wamt al monto Total por que NS despues de grabar el documento recien le
        // Aplica la retencion.
        var imptotal = 0.00;
        if (currentRCD.type == 'creditmemo') {
          imptotal = parseFloat(currentRCD.getValue('total'));
        } else {
          imptotal = parseFloat(currentRCD.getValue('total')) - parseFloat(currentRCD.getValue('custbody_lmry_wtax_wamt'));
          imptotal = imptotal.toFixed(2);
        }

        // Monto en Letras Parametros: Importe, Moneda, Simbolo y concadenador

        var impletras = Library_Number.ConvNumeroLetraESP(imptotal, monedaText.name, monedaText.symbol, 'CON');
        currentRCD.setValue('custbody_lmry_pa_monto_letras', impletras);

      } catch (errmsg) {
        Library_Mail.sendemail(' [ UpdateTotalSales ] ' + errmsg, LMRY_script);
      }

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

      try {

        currentRCD = scriptContext.currentRecord;

        // Valida el Acceso
        ValidateAccess(currentRCD.getValue('subsidiary'));

        // Solo para las facturas
        UpdateTotalSales();

      } catch (errmsg) {
        Library_Mail.sendemail(' [ UpdateTotalSales ] ' + errmsg, LMRY_script);
      }

      return true;
    }

    /* ------------------------------------------------------------------------------------------------------
     * A la variable featureId se le asigna el valore que le corresponde
     * --------------------------------------------------------------------------------------------------- */
    function ValidateAccess(ID) {
      try {

        // Inicializa variables Locales y Globales
        LMRY_access = false;
        LMRY_countr = Library_Mail.Get_Country_STLT(ID);

        // Verifica que el arreglo este lleno
        if (LMRY_countr.length < 1) {
          LMRY_countr = ['', '-None-'];
          return true;
        }
        LMRY_access = Library_Mail.getCountryOfAccess(LMRY_countr, licenses);

      } catch (err) {
        Library_Mail.sendemail(' [ ValidateAccess ] ' + err, LMRY_script);
      }

      return true;
    }

    function transformCLP() {
      try {
        var recordObj = currentRecord.get();

        var transaction = recordObj.type;
        console.log(transaction);

        var subsidiary = 1;
        if (runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' })) {
          subsidiary = recordObj.getValue('subsidiary');
        }
        console.log(subsidiary);

        var searchObj = search.create({
          type: 'customrecord_lmry_setup_tax_subsidiary',
          columns: ['custrecord_lmry_setuptax_currency'],
          filters: [
            ['isinactive', 'is', 'F'], 'AND', ['custrecord_lmry_setuptax_subsidiary', 'is', subsidiary]
          ]
        });
        searchObj = searchObj.run().getRange(0, 1);

        if (searchObj != null && searchObj != '') {
          var currency = searchObj[0].getValue('custrecord_lmry_setuptax_currency');
          var urlText = url.resolveScript({
            scriptId: 'customscript_lmry_salesorder_clp_stlt',
            deploymentId: 'customdeploy_lmry_salesorder_clp_stlt',
            returnExternalUrl: false
          });
          urlText += '&internalid=' + recordObj.id + '&currency=' + currency + '&type=' + transaction;

          console.log(urlText);

          var get = https.get({
            url: 'https://' + window.location.host + urlText
          });

          var idNewRecord = get.body;

          var output = url.resolveRecord({
            recordType: 'salesorder',
            recordId: idNewRecord,
            isEditMode: false
          });

          window.location.href = output;
        } else {
          return true;
        }

      } catch (err) {
        Library_Mail.sendemail(' [ transformCLP ] ' + err, LMRY_script);
      }
      return true;
    }

    function onclick_event_purchaseorder() {
      try {
        var recordObj = currentRecord.get();
        var subsidiary = recordObj.getValue('subsidiary');
        var urlTransaction = url.resolveRecord({
          recordType: "purchaseorder",
          isEditMode: true
        });
        urlTransaction += '&salesorder=' + recordObj.id + '&sub=' + subsidiary;
        setWindowChanged(window, false);
        window.location.href = urlTransaction;

      } catch (err) {
        Library_Mail.sendemail(' [ onclick_event_purchaseorder ] ' + err, LMRY_script);
      }
    }

    function onclick_event_changecurrency(currBaseValue, currBaseText) {

      try {

        //FORMULARIO

        var objForm = libraryPopup.createForm('Change Currency', 350, 250);

        objForm.addButton('btn_lmry_save', 'Save', 'submit');
        objForm.addButton('btn_lmry_cancel', 'Cancel', 'cancel');

        objForm.addField('fld_lmry_currency', 'Currency', 'select', '', [{
          value: currBaseValue,
          text: currBaseText
        }], 'disabled', false);

        objForm.addField('fld_lmry_rate', 'Exchange Rate', 'number');

        objForm.writeForm();

        objForm.addClick('btn_lmry_save', function () {

          try {

            var rate = objForm.getValue('fld_lmry_rate');
            var currencyValue = objForm.getValue('fld_lmry_currency');

            var objRecord = currentRecord.get();
            var recordSO = record.load({
              type: 'salesorder',
              id: objRecord.id
            });

            var beforeCurrency = recordSO.getValue('currency');

            recordSO.setValue('currency', currencyValue);

            //ACTUALIZA LINEAS
            var cItems = recordSO.getLineCount({
              sublistId: 'item'
            });
            for (var i = 0; i < cItems; i++) {

              var rateItem = recordSO.getSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                line: i
              });

              if (parseFloat(rateItem) > 0) {

                rateItem = parseFloat(rateItem) * parseFloat(rate);
                //rateItem = parseFloat(rateItem).toFixed(2);
                recordSO.setSublistValue({
                  sublistId: 'item',
                  fieldId: 'rate',
                  line: i,
                  value: rateItem
                });

              } else {

                var amountItem = recordSO.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'amount',
                  line: i
                });
                amountItem = parseFloat(amountItem) * parseFloat(rate);
                amountItem = parseFloat(amountItem).toFixed(2);
                recordSO.setSublistValue({
                  sublistId: 'item',
                  fieldId: 'amount',
                  line: i,
                  value: amountItem
                });

              }

            }

            //ACTUALIZA LIBROS CONTABLES
            if (featureMB) {

              var currencySub = search.lookupFields({
                type: 'subsidiary',
                id: recordSO.getValue('subsidiary'),
                columns: ['currency']
              });
              currencySub = currencySub.currency[0].value;

              var cBook = recordSO.getLineCount({
                sublistId: 'accountingbookdetail'
              });

              for (var i = 0; i < cBook; i++) {
                var currencyBook = recordSO.getSublistValue({
                  sublistId: 'accountingbookdetail',
                  fieldId: 'currency',
                  line: i
                });

                if (currencySub == currBaseValue) {
                  if (currencyBook == beforeCurrency) {
                    recordSO.setSublistValue({
                      sublistId: 'accountingbookdetail',
                      fieldId: 'exchangerate',
                      line: i,
                      value: 1 / parseFloat(rate)
                    });
                  }
                } else {
                  if (currencyBook == currBaseValue) {
                    recordSO.setSublistValue({
                      sublistId: 'accountingbookdetail',
                      fieldId: 'exchangerate',
                      line: i,
                      value: rate
                    });
                  }
                }

              }

            }

            //SAVE
            recordSO.save({
              ignoreMandatoryFields: true,
              disableTriggers: true
            });

            libraryPopup.closePopup();

            location.reload();

          } catch (err) {
            alert('OCURRIO UN ERROR');
            console.log(err);
          }



        });


      } catch (err) {
        alert('OCURRIO UN ERROR AL CARGAR EL POPUP');
        console.log(err);
        Library_Mail.sendemail(' [ onclick_event_changecurrency ] ' + err, LMRY_script);
      }
    }

    function getWsSubsidiary(entityId) {
      var domain = url.resolveDomain({
        hostType: url.HostType.APPLICATION
      });
      var urlStlt = url.resolveScript({
        scriptId: 'customscript_lmry_get_country_stlt',
        deploymentId: 'customdeploy_lmry_get_country_stlt',
        returnExternalUrl: false,
        params: {
          ent: entityId
        }
      });

      //corregir hard code falta url
      var response = https.get({
        url: 'https://' + domain + urlStlt
      });

      return response.body || "";
    }

    return {
      pageInit: pageInit,
      fieldChanged: fieldChanged,
      // postSourcing: postSourcing,
      // sublistChanged: sublistChanged,
      // lineInit: lineInit,
      validateField: validateField,
      // validateLine: validateLine,
      // validateInsert: validateInsert,
      // validateDelete: validateDelete,
      saveRecord: saveRecord,
      transformCLP: transformCLP,
      onclick_event_purchaseorder: onclick_event_purchaseorder,
      onclick_event_changecurrency: onclick_event_changecurrency
    };

  });