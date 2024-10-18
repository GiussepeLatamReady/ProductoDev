/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Transaction Item Fulfillment               ||
||                                                              ||
||  File Name: LMRY_ItemFulfillmentURET_V2.0.js                 ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 25 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */
define(['N/runtime', 'N/log', 'N/search', 'N/record', 'N/ui/serverWidget', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0',
  './Latam_Library/LMRY_HideViewLBRY_V2.0', './Latam_Library/LMRY_GLImpact_LBRY_V2.0', './Latam_Library/LMRY_UniversalSetting_Fulfillment_Receipt_LBRY',
  './Latam_Library/LMRY_BR_LatamTax_Purchase_LBRY_V2.0', './Latam_Library/LMRY_BR_ValidateDuplicate_LBRY_V2.0', './Latam_Library/LMRY_ValidateClosePeriod_LBRY_V2.0', './Latam_Library/LMRY_libToolsFunctionsLBRY_V2.0','./Latam_Library/LMRY_second_Entity_LBRY_V2.0', 'N/format','./Latam_Library/LMRY_AR_Unit_Price_LBRY_V2.0'],
  function (runtime, log, search, record, serverWidget, library_mail, library_HideView, libraryGLImpact, library_Uni_Setting, library_taxPurchase, Library_BRDup, LibraryValidatePeriod, libtools,librarySecondClient, format,libraryUnitPrice) {
    var LMRY_script = 'LatamReady - Item Fulfillment URET V2.0';
    var licenses = [];

    function beforeLoad(context) {

      var type = context.type;
      var recordObj = context.newRecord;
      var OBJ_FORM = context.form;

      try {
        if (type == 'print' || type == 'email') {
          return true;
        }
        // Obtiene la interface que se esta ejecutando
        var type_interface = runtime.executionContext;
        if (type_interface == 'MAPREDUCE') {
          return true;
        }

        /* Validacion 04/02/22 */
        // Campo - Valida Periodo cerrado
        var LockedPeriodField = OBJ_FORM.addField({
          id: 'custpage_lockedperiod',
          label: 'Locked Period',
          type: serverWidget.FieldType.CHECKBOX
        });
        LockedPeriodField.defaultValue = 'F';
        LockedPeriodField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN
        });
        /* Fin validacion 04/02/22 */

        if (type != 'print' && type != 'email') {
          var subsidiary = recordObj.getValue({
            fieldId: 'subsidiary'
          });

          // 08.09.2021 - La logica se paso al script Cliente

          if (!subsidiary) {
            subsidiary = runtime.getCurrentUser().subsidiary;
          }

          licenses = library_mail.getLicenses(subsidiary);

          var LMRY_Result = ValidateAccessIFU(subsidiary);
          var country = LMRY_Result[1];
          var hasAccess = LMRY_Result[2];

          hideandViewFields(context, country, hasAccess);

          if (context.type == 'create') {
            OBJ_FORM.addField({
              id: 'custpage_uni_set_status',
              label: 'Set Estatus',
              type: serverWidget.FieldType.CHECKBOX
            }).defaultValue = 'F';
          }


        }//FIN DE NO PRINT Y NO EMAIL


        // Lógica GL Impact
        if (context.type == 'view') {
          // Obtiene el idioma del entorno
          var featurelang = runtime.getCurrentScript().getParameter({
            name: 'LANGUAGE'
          });
          featurelang = featurelang.substring(0, 2);

          var btnGl = libraryGLImpact.featureGLImpact(recordObj, 'itemfulfillment');

          if (btnGl == 1) {
            if (featurelang == 'es') {
              OBJ_FORM.addButton({
                id: 'custpage_id_button_imp',
                label: 'IMPRIMIR GL',
                functionName: 'onclick_event_gl_impact()'
              });
            } else {
              OBJ_FORM.addButton({
                id: 'custpage_id_button_imp',
                label: 'PRINT GL',
                functionName: 'onclick_event_gl_impact()'
              });
            }
            OBJ_FORM.clientScriptModulePath = './Latam_Library/LMRY_GLImpact_CLNT_V2.0.js';
          }

          //Botón MX Pediments
          var recordID = recordObj.id;
          if (library_mail.getAuthorization(521, licenses) && LMRY_Result[0] == 'MX') {

            var shipvalidate = false;
            var featureSHIP = runtime.isFeatureInEffect({ feature: 'PICKPACKSHIP' });

            //Verifica si está libre de Pedimentos o cuenta con Carta porte
            if (libtools.searchPediments(recordID)) {
              OBJ_FORM.addButton({
                id: 'custpage_button_fulfill_pediments',
                label: 'MX - PEDIMENTS',
                functionName: 'onclick_fulfill_pediments()'
              });

              OBJ_FORM.clientScriptModulePath = './Latam_Library/LMRY_GLImpact_CLNT_V2.0.js';
            } else if (libtools.cartaPorteLock(recordID)) {
              if (featureSHIP) {
                var shipstatus = recordObj.getValue('shipstatus');
                if (shipstatus == 'C') {
                  shipvalidate = true;
                }
              } else {
                shipvalidate = true;
              }
              if (shipvalidate) OBJ_FORM.removeButton('edit');
            }

          }
        }

        if (LMRY_Result[0]=='BR' && (context.type=="create"||context.type=="edit"||context.type=="view"||context.type=="copy")) {
          librarySecondClient.setSecondClient(recordObj,OBJ_FORM,context.type);
        }

        if (context.type != 'print' && context.type != 'email') {

          //SETEO DEL CUSTBODY LATAMREADY - BR TRANSACTION TYPE PARA FILTRAR LA COLUMNA CFOP
          if (LMRY_Result[0] == 'BR' && LMRY_Result[2] == true && (context.type == 'create' || context.type == 'edit' || context.type == 'copy')) {
            var transactionType = recordObj.getValue('custbody_lmry_br_transaction_type');
            var createdFrom = recordObj.getValue('createdfrom');
            if (!transactionType || (createdFrom != '' && createdFrom != null)) {
              var typeStandard = recordObj.getValue('type');
              if (typeStandard != null && typeStandard != '') {
                var searchTransactionType = search.create({ type: 'customrecord_lmry_trantype', columns: ['internalid'], filters: [{ name: 'name', operator: 'is', values: typeStandard }] });
                var resultTransactionType = searchTransactionType.run().getRange({ start: 0, end: 1 });
                if (resultTransactionType != null && resultTransactionType.length > 0) {
                  recordObj.setValue({ fieldId: 'custbody_lmry_br_transaction_type', value: resultTransactionType[0].getValue('internalid') });
                }

              }
            }
          }


        }//FIN PRINT & EMAIL


      }
      catch (err) {
        log.error('BeforeLoad', err);
        library_mail.sendemail2(' [ BeforeLoad ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }
    }

    function hideandViewFields(context, country, hasAccess) {
      try {
        var type = context.type;
        var recordObj = context.newRecord;
        var form = context.form;
        var typeTrans = recordObj.type;

        if (form) {
          library_HideView.HideColumn(form, country, typeTrans, licenses);
          library_HideView.HideSubTab(form, country, typeTrans, licenses);
          if (type == 'view') {
            library_mail.onFieldsHide([2], form, true);

            if (hasAccess == true) {
              library_mail.onFieldsDisplayBody(form, country, 'custrecord_lmry_on_item_fulfillment', true);
            }
          }
        }
      } catch (err) {
        throw ' [ hideandViewFields ] ' + err
      }

    }

    function beforeSubmit(context) {
      var recordObj = context.oldRecord;
      var RCD = context.newRecord;

      try {

        // Obtiene la interface que se esta ejecutando
        var type_interface = runtime.executionContext;
        if (type_interface == 'MAPREDUCE') {
          return true;
        }

        var formulario = context.form;
        var type = context.type;

        var subsidiary = '';

        if (type == 'create') {
          var newrecordObj = context.newRecord;
          subsidiary = newrecordObj.getValue('subsidiary');
        } else {
          subsidiary = recordObj.getValue('subsidiary');
        }

        licenses = library_mail.getLicenses(subsidiary);
        var LMRY_Result = ValidateAccessIFU(subsidiary);

        /* Validacion 04/02/22 */
        // Libreria - Valida Periodo cerrado
        if (LibraryValidatePeriod.validatePeriod(RCD.getValue('postingperiod'), licenses, LMRY_Result[0], 'sales')) return true;
        /* Fin validacion 04/02/22 */

        //Seteo Automático

        //Universal Setting se realiza solo al momento de crear
        if (type == 'create' && type_interface == 'USERINTERFACE') {
          var type_document = RCD.getValue('custbody_lmry_document_type');

          if (library_Uni_Setting.auto_universal_setting(licenses, false)) {
            //Solo si el campo LATAM - LEGAL DOCUMENT TYPE se encuentra vacío

            if (RCD.getValue('custpage_uni_set_status') == 'F' && (type_document == '' || type_document == null)) {
              //Seteo campos cabecera, numero pre impreso y template
              library_Uni_Setting.automatic_setfield(RCD, false);
              library_Uni_Setting.set_preimpreso(RCD, LMRY_Result, licenses);
              library_Uni_Setting.set_template(RCD, licenses);
              RCD.setValue('custpage_uni_set_status', 'T');
            }
          }
        }

        //Se actualizan los campos para la factura
        var tranid = RCD.getValue({
          fieldId: 'tranid'
        });
        var trandate = RCD.getValue({
          fieldId: 'trandate'
        });
        trandate = format.format({ value: trandate, type: format.Type.DATE });
        RCD.setValue({
          fieldId: 'custbody_lmry_ref_guia_numero',
          value: tranid,
          ignoreFieldChange: true
        });
        RCD.setValue({
          fieldId: 'custbody_lmry_ref_guia_fecha',
          value: trandate,
          ignoreFieldChange: true
        });

        if (type == 'delete') {
          var country = LMRY_Result[0];
          if ((country == 'PE' || country == 'SV' || country == 'PY') && LMRY_Result[2] == true) {
            var id_so = recordObj.getValue({
              fieldId: 'createdfrom'
            });

            if (id_so) {
              //Campos de referencia del despacho
              var nro_guia = recordObj.getValue({
                fieldId: 'custbody_lmry_ref_guia_numero'
              });

              var fecha_guia = recordObj.getValue({
                fieldId: 'custbody_lmry_ref_guia_fecha'
              });

              var sales_order = search.lookupFields({
                type: 'salesorder',
                id: id_so,
                columns: ['custbody_lmry_ref_guia_numero', 'custbody_lmry_ref_guia_fecha']
              });

              var so_nro_guia = sales_order.custbody_lmry_ref_guia_numero || "";
              so_nro_guia = so_nro_guia.replace(', ' + nro_guia, '');
              so_nro_guia = so_nro_guia.replace(nro_guia, '');

              var so_fecha_guia = sales_order.custbody_lmry_ref_guia_fecha || "";
              so_fecha_guia = so_fecha_guia.replace(', ' + fecha_guia, '');
              so_fecha_guia = so_fecha_guia.replace(fecha_guia, '');

              if (so_nro_guia && so_fecha_guia) {
                record.submitFields({
                  type: 'salesorder',
                  id: id_so,
                  values: {
                    'custbody_lmry_ref_guia_numero': so_nro_guia,
                    'custbody_lmry_ref_guia_fecha': so_fecha_guia
                  },
                  options: {
                    disableTriggers: true
                  }
                });
              }

            }
          }
        }

        if (["create", "edit", "copy"].indexOf(type) != -1) {
          var country = LMRY_Result[0];
          if (country == "BR") {
            setLinePosition(RCD);
          }
          if (country == 'AR') {
            var feaUnitPrice = library_mail.getAuthorization(1089, licenses);
            if (feaUnitPrice) {
              libraryUnitPrice.saveUnitPrice(RCD);
            }
          }
        }



      } catch (err) {
        library_mail.sendemail2(' [ beforeSubmit ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }
    }

    function afterSubmit(context) {
      try {
        // Obtiene la interface que se esta ejecutando
        var type_interface = runtime.executionContext;
        if (type_interface == 'MAPREDUCE') {
          return true;
        }
        var RCD = context.newRecord;
        var OLDRCD = context.oldRecord;
        var subsidiary = RCD.getValue('subsidiary');
        var type = context.type;


        licenses = library_mail.getLicenses(subsidiary);
        var LMRY_Result = ValidateAccessIFU(subsidiary);

        /* Validacion 04/02/22 */
        // Libreria - Valida Periodo cerrado
        if (LibraryValidatePeriod.validatePeriod(RCD.getValue('postingperiod'), licenses, LMRY_Result[0], 'sales')) return true;
        /* Fin validacion 04/02/22 */

        //Universal Setting se realiza solo al momento de crear
        if (type == 'create' && type_interface == 'USERINTERFACE') {
          var type_document = RCD.getValue('custbody_lmry_document_type');

          //Mediante el custpage se conoce que el seteo de cabecera fue realizado por Universal Setting
          if (RCD.getValue('custpage_uni_set_status') == 'T') {
            //Seteo de campos perteneciente a record anexado
            library_Uni_Setting.automatic_setfieldrecord(RCD);
          }
        }

        if (["create", "edit", "copy"].indexOf(type) != -1) {
          var country = LMRY_Result[0];
          if (country == "BR") {
            if ('create' == type) {
              Library_BRDup.assignPreprinted(RCD, licenses);
            }

            var TaxCalObj = search.create({
              type: 'customrecord_lmry_br_transaction',
              columns: ['internalid'],
              filters: [
                ['custrecord_lmry_total_item', 'is', 'Tax Calculator'], 'AND',
                ['custrecord_lmry_br_transaction', 'is', RCD.id]
              ]
            });
            TaxCalObj = TaxCalObj.run().getRange(0, 1);
            if (TaxCalObj == null || TaxCalObj == '') {
              record.submitFields({
                type: "itemfulfillment",
                id: RCD.id,
                values: {
                  'custbody_lmry_scheduled_process': false,
                },
                options: {
                  disableTriggers: true
                }
              });
              if (type == "edit") {
                library_taxPurchase.deleteTaxResults(RCD.id);
              }
            }
            librarySecondClient.saveSecondClient(RCD);
          }
        }

        if (country == 'PE' && ["create", "edit"].indexOf(type) != -1 && LMRY_Result[2]) {
          setSerialLotNumber(RCD);
          /* ******************************************
          * 23.06.2021 - Se movio la validacion del
          * Cliente al User Events
          * ****************************************** */
          updateSalesOrder(RCD, OLDRCD);
        }

      } catch (err) {
        library_mail.sendemail2(' [ afterSubmit ] ' + err, LMRY_script, RCD, 'tranid', 'entity');
      }

    }

    function updateSalesOrder(recordObj, oldRecordObj) {
      var id_so = recordObj.getValue({ fieldId: 'createdfrom' });
      var featstate = runtime.isFeatureInEffect({ feature: 'PICKPACKSHIP' });
      var shipstatus = recordObj.getValue('shipstatus');
      var featShipping = library_mail.getAuthorization(850, licenses)
      if (featShipping) {
        if (id_so && featstate && shipstatus == 'C') {
          updateSalesOrderBody(recordObj, oldRecordObj)
        }
      }
      else if (id_so) {
        updateSalesOrderBody(recordObj, oldRecordObj);
      }
    }
    function updateSalesOrderBody(recordObj, oldRecordObj) {
      var id_so = recordObj.getValue({ fieldId: 'createdfrom' });
      var nro_guia = recordObj.getValue({ fieldId: 'custbody_lmry_ref_guia_numero' });
      var fecha_guia = recordObj.getValue({ fieldId: 'custbody_lmry_ref_guia_fecha' });
      var sales_order = search.lookupFields({
        type: 'transaction',
        id: id_so,
        columns: ['type', 'custbody_lmry_ref_guia_numero', 'custbody_lmry_ref_guia_fecha']
      });
      if (sales_order && nro_guia) {
        var so_type = sales_order.type[0].value;
        // Solo para Sales Order
        if (so_type == 'SalesOrd') {
          var so_nro_guia = sales_order.custbody_lmry_ref_guia_numero;
          var so_fech_guia = sales_order.custbody_lmry_ref_guia_fecha;
          // Actualiza cuando este vacio
          if (!so_nro_guia) {
            record.submitFields({
              type: 'salesorder',
              id: id_so,
              values: {
                'custbody_lmry_ref_guia_numero': nro_guia,
                'custbody_lmry_ref_guia_fecha': fecha_guia
              },
              options: {
                disableTriggers: true
              }
            });
          } else if (so_nro_guia) {
            // Valida que no existe en la cadena
            if (so_nro_guia.indexOf(nro_guia) == -1) {
              //si cambio el tranid y el feature esta activo
              var nroguiaold = oldRecordObj ? oldRecordObj.getValue({ fieldId: 'custbody_lmry_ref_guia_numero' }) : nro_guia
              var nroguia = recordObj.getValue({ fieldId: 'custbody_lmry_ref_guia_numero' });
              //solo se reemplaza la guia no se agrega nada
              if (nroguiaold != nroguia) {
                so_nro_guia = so_nro_guia.replace(nroguiaold, nroguia);
                //verificar si las fechas son distintas
                var fechaold = oldRecordObj ? oldRecordObj.getValue({ fieldId: 'custbody_lmry_ref_guia_fecha' }) : fecha_guia;
                if (fechaold != fecha_guia) {
                  var array = so_nro_guia.split(",");
                  //quitamos el espacio de las guias
                  for (var i = 1; i < array.length; i++) {
                    array[i] = array[i].substring(1);
                  }
                  //obtenemos la pos del nroguia
                  var pos = array.indexOf(nroguia)
                  //volvemos array las fechas
                  var arrayfecha = so_fech_guia.split(",");
                  //cambiamos el valor de la pos
                  if (pos != 0) fecha_guia = " " + fecha_guia;
                  arrayfecha[pos] = fecha_guia;
                  so_fech_guia = arrayfecha.join(',');
                }
                record.submitFields({
                  type: 'salesorder',
                  id: id_so,
                  values: {
                    'custbody_lmry_ref_guia_numero': so_nro_guia,
                    'custbody_lmry_ref_guia_fecha': so_fech_guia
                  },
                  options: {
                    disableTriggers: true
                  }
                });
              } else {
                //concatenamos
                record.submitFields({
                  type: 'salesorder',
                  id: id_so,
                  values: {
                    'custbody_lmry_ref_guia_numero': so_nro_guia + ", " + nroguia,
                    'custbody_lmry_ref_guia_fecha': so_fech_guia + ", " + fecha_guia
                  },
                  options: {
                    disableTriggers: true
                  }
                });
              }

            }
          }
        }
      }
    }
    function ValidateAccessIFU(idSubsidiary) {
      var LMRY_access = false;
      var LMRY_countr = [];
      var LMRY_Result = [];
      try {
        LMRY_countr = library_mail.Validate_Country(idSubsidiary);

        if (!LMRY_countr.length) {
          LMRY_Result[2] = false;
          return LMRY_Result;
        }

        LMRY_access = library_mail.getCountryOfAccess(LMRY_countr, licenses);

        LMRY_Result = [LMRY_countr[0], LMRY_countr[1], LMRY_access];
      }
      catch (err) {
        throw ' [ ValidateAccessIFU ] ' + err;
      }

      return LMRY_Result;
    }

    function setLinePosition(recordObj) {
      var numItems = recordObj.getLineCount({ sublistId: "item" });
      for (var i = 0; i < numItems; i++) {
        recordObj.setSublistValue({ sublistId: "item", fieldId: "custcol_lmry_item_posicion", value: String(i), line: i });
      }
    }

    function setSerialLotNumber(currentRCD) {

      var recordObj = record.load({ type: currentRCD.type, id: currentRCD.id });

      var numItems = recordObj.getLineCount({ sublistId: "item" });

      for (var i = 0; i < numItems; i++) {

        var itemReceive = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'itemreceive', line: i });
        var inventoryDetail = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'inventorydetail', line: i });

        if (itemReceive && inventoryDetail) {

          var objSubrecord = recordObj.getSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: i });

          var cLineas = objSubrecord.getLineCount({ sublistId: 'inventoryassignment' });

          var lotes = [];

          for (var j = 0; j < cLineas; j++) {

            var loteText = objSubrecord.getSublistText({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: j });

            if (loteText) {
              lotes.push(loteText);
            }

          }

          if (lotes.length) {
            recordObj.setSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_item_serie', line: i, value: lotes.join(",") });
          }

        }

      }

      recordObj.save({ disableTriggers: true, ignoreMandatoryFields: true });

    }

    return {
      beforeLoad: beforeLoad,
      beforeSubmit: beforeSubmit,
      afterSubmit: afterSubmit
    }
  });