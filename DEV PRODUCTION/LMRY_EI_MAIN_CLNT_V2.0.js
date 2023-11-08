/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_EI_MAIN_CLNT_V2.0.js                        ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Dec 22 2018  LatamReady    Use Script 2.0           ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(["N/format", "N/currency", "N/record", "N/search", "N/runtime", 'N/ui/message', "N/url", "N/log", "N/https", './EI_Library/LMRY_EI_libSendingEmailsLBRY_V2.0', './EI_Library/LMRY_AnulacionInvoice_LBRY_V2.0.js'],

  function (format, currencyApi, record, search, runtime, message, url, log, https, ei_library, library_AnulacionInvoice) {
    var jsonLanguage = {
      'alertaEIStatus': {
        'en': 'Are you sure you want to generate the callback?',
        'es': '¿Está seguro que desea generar el Rellamado?',
        'pt': 'Tem certeza de que deseja gerar o retorno de chamada?'
      },
      'alertaEIVoidMX': {
        'en': 'Are you sure you want to cancel the transaction? ',
        'es': '¿Esta seguro de que desea eliminar la transaccion?',
        'pt': 'Tem certeza de que deseja excluir a transação?'
      },
      'alertaEIVoidPE': {
        'en': 'Are you sure you want to cancel the document?',
        'es': '¿Esta seguro de que desea cancelar el documento?',
        'pt': 'Tem certeza de que deseja cancelar o documento?'
      },
      'alertaEIVoidEC': {
        'en': 'Are you sure you want to cancel the document?',
        'es': '¿Esta seguro de que desea cancelar el documento?',
        'pt': 'Tem certeza de que deseja cancelar o documento?'
      },
      'alertaEIVoidGT': {
        'en': 'Are you sure you want to cancel the document?',
        'es': '¿Esta seguro de que desea cancelar el documento?',
        'pt': 'Tem certeza de que deseja cancelar o documento?'
      },
      'alertaEIVoidBO': {
        'en': 'Are you sure you want to cancel the tax document?',
        'es': '¿Esta seguro de que desea cancelar el documento?',
        'pt': 'Tem certeza de que deseja cancelar o documento? '
      },
      'alertaEIVoidBR': {
        'en': 'Are you sure you want to cancel the tax document?',
        'es': '¿Esta seguro de que desea cancelar el documento fiscal?',
        'pt': 'Tem certeza de que deseja cancelar o documento fiscal? '
      },
      'alertaCartaCorrecionBR': {
        'en': 'Are you sure you want to execute a Correction Letter to the tax document?',
        'es': '¿Está seguro de que desea ejecutar una Carta Corrección al documento fiscal?',
        'pt': 'Tem certeza de que deseja executar uma Carta de Correção ao documento fiscal?'
      },
      'alertaEIStatusRejected': {
        'en': 'Are you sure you want to update the status of your invoice whose cancellation has been rejected?',
        'es': '¿Está seguro que desea actualizar el estado de su factura cuya cancelación ha sido rechazada?',
        'pt': 'Tem certeza de que deseja atualizar o status de sua fatura cujo cancelamento foi rejeitado?'
      },
      'alertaEIStatusConcurrente': {
        'en': 'A callback is currently running, do you want to continue?',
        'es': 'Se está ejecutando un rellamado en este instante, ¿desea continuar?',
        'pt': 'Um retorno de chamada está em execução. Deseja continuar?'
      },
      'alertaEIRemoveTransactions': {
        'en': 'Are you sure you want to remove related transactions?',
        'es': '¿Está seguro que desea eliminar las transacciones relacionadas?',
        'pt': 'Tem certeza de que deseja excluir transações relacionadas?'
      },
      'alertaEsperar': {
        'en': 'The process is running.',
        'es': 'Se está ejecutando el proceso.',
        'pt': 'O processo está em execução.'
      },
    };
    var licencias = []
    var LMRY_script = 'LMRY EI Invoice CLNT';
    var FEATURE_SETUP = '';
    var subsi = runtime.isFeatureInEffect({
      feature: "SUBSIDIARIES"
    });
    var F_REVERSALVOIDING = runtime.getCurrentScript().getParameter({
      name: 'REVERSALVOIDING'
    });
    var typeDoc = '';
    var serieDoc = '';
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
        var mode = scriptContext.mode;
        var type_trans = scriptContext.currentRecord.type;

        if (type_trans == 'invoice' || type_trans == 'creditmemo' || type_trans == 'vendorbill' || type_trans == 'vendorcredit' || type_trans == 'customtransaction_lmry_payment_complemnt') {
          block_lmry_cl_ei_exchangerate(scriptContext.currentRecord);
        }

        if (mode == 'copy' || mode == 'create') {
          // log.error('Mode', mode)
          var rec = scriptContext.currentRecord;
          var doc_subsi = rec.getValue('subsidiary');
          var country = ei_library.getCountryID(doc_subsi).code;

          if (country == 'MX') {
            rec.setValue('custbody_lmry_pe_estado_sf', '');
            rec.setValue('custbody_lmry_webserviceresponse', '');
          } else if (country == 'PE') {
            rec.setValue('custbody_lmry_pe_identificador_comfiar', '');
            rec.setValue('custbody_lmry_pe_num_aut_comfiar', '');
            rec.setValue('custbody_lmry_pe_estado_comfiar', '');
          } else if (country == 'EC') {
            rec.setValue('custbody_lmry_identificador_comfiar_ec', '');
            rec.setValue('custbody_lmry_num_aut_comfiar_ec', '');
          } else if (country == 'BR') {
            rec.setValue('custbody_lmry_webserviceresponse', '');
          } else if (country == 'CL') {
            rec.setValue('custbody_lmry_webserviceresponse', '');
          } else if (country == 'AR') {
            rec.setValue('custbody_lmry_webserviceresponse', '');
          } else if (country == 'CO') {
            rec.setValue('custbody_lmry_webserviceresponse', '');
          }

        }

      } catch (e) {
        log.error('Error', '[pageInit]: ' + e)
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
    function fieldChanged(scriptContext) {

      var currentRCD = scriptContext.currentRecord;
      var name = scriptContext.fieldId;

      if (name == 'custbody_lmry_serie_doc_cxc') {
        var doc_subsi = currentRCD.getValue('subsidiary');
        var objCountry = ei_library.getCountryID(doc_subsi);
        var doc_country = objCountry.code;
        //log.error("doc_country_fieldchange", doc_country);
        var serie_id = currentRCD.getValue({ fieldId: name })
        if (doc_country == 'MX') {
          if (serie_id) {
            search.create({
              type: 'customrecord_lmry_serie_impresion_cxc',
              filters: [['internalid', 'anyof', serie_id], 'and', ['isinactive', 'is', 'F']],
              columns: ['custrecord_lmry_diseno_pdf']
            }).run().each(function (result) {
              var diseno_id = result.getValue('custrecord_lmry_diseno_pdf')

              diseno_id
                ? currentRCD.setValue({ fieldId: 'custbody_lmry_mx_document_design', value: diseno_id })
                : currentRCD.setValue({ fieldId: 'custbody_lmry_mx_document_design', value: '' })

              return true
            })
          } else currentRCD.setValue({ fieldId: 'custbody_lmry_mx_document_design', value: '' })
        }
      }

      if (name == 'currency' || name == 'subsidiary' || name == 'trandate') {
        //Bloquear el campo custbody_lmry_cl_ei_exchangerate y setear valor 1 o 0
        if (currentRCD.type == 'invoice' || currentRCD.type == 'creditmemo') {
          block_lmry_cl_ei_exchangerate(scriptContext.currentRecord);
        }
        return true;
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
      try {
        var currentRecord = scriptContext.currentRecord;
        var doc_subsi = currentRecord.getValue('subsidiary');
        var objCountry = ei_library.getCountryID(doc_subsi);
        log.debug("objCountry", objCountry);
        if (objCountry.code == 'BR') {

          var sublistId = scriptContext.sublistId;

          if (sublistId == 'item') {

            var current_cfop = currentRecord.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_lmry_br_tran_outgoing_cfop'
            });

            /**
             * 1-3 is Incoming
             * 5-7 is Outgoing
             */
            if (current_cfop != null && current_cfop != '') {

              var busqCFOP = search.create({
                type: 'customrecord_lmry_br_cfop_codes',
                columns: ['name'],
                filters: [
                  ["internalid", "anyof", current_cfop]
                ]
              });

              var resultCFOP = busqCFOP.run().getRange(0, 100);

              if (resultCFOP != null && resultCFOP.length != 0) {
                var row = resultCFOP[0].columns;
                var cfop_value = resultCFOP[0].getValue(row[0]);
                log.debug("cfop_value", cfop_value);
                if (cfop_value != null && cfop_value != '') {
                  // cfop_value = cfop_value.replace(/\./g, '');
                  if ((/^[1-3]/.test(cfop_value)) && (currentRecord.type == 'invoice' || currentRecord.type == 'salesorder' || currentRecord.type == 'estimate' || currentRecord.type == 'itemfulfillment')) {
                    alert("Incoming CFOP was selected for an Outgoing or Sales transaction.");
                    return false;
                  } else if ((/^[5-7]/.test(cfop_value)) && (currentRecord.type == 'vendorbill' || currentRecord.type == 'purchaseorder')) {
                    alert("Outgoing CFOP was selected for an Incoming or Purchase transaction.");
                    return false;
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        log.error("Error", "[ validateLine ] " + err);
      }
      return true;
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
        //log.error('INICIO saveRecord', 'INICIO saveRecord');
        // log.error('subsi', subsi);
        var rec = scriptContext.currentRecord;


        //var trans_type = rec.getValue('type').toLowerCase();
        var ntype = rec.getValue('ntype');
        // log.error("ntype", ntype);
        var doc_type = rec.getValue('custbody_lmry_document_type');
        var doc_subsi = rec.getValue('subsidiary');

        objCountry = ei_library.getCountryID(doc_subsi);
        // log.error("objCountry", objCountry);
        doc_country = objCountry.code;
        licencias = ei_library.getLicenses(doc_subsi)
        FEATURE_SETUP = featurePais(doc_country)
        // log.error("doc_type", doc_type);

        var doc_tranType = rec.getValue('custbody_lmry_transaction_type_doc')
        if (doc_tranType != '' && doc_tranType != null && doc_country == 'EC') {
          // Busqueda en record LatamReady - Tipo Transaccion
          var srch_tranType = search.lookupFields({
            type: 'customrecord_lmry_transaction_type',
            id: doc_tranType,
            columns: ['custrecord_lmry_code_type_transaction']
          })
          if (srch_tranType != null && srch_tranType != '') {
            cod_tranType = srch_tranType.custrecord_lmry_code_type_transaction
            if (cod_tranType == '07') doc_type = '513';
          }
        }

        if (doc_type != '' && doc_type != null) {
          if (ei_library.getAuthorization(FEATURE_SETUP, licencias)) {
            // Registro Personalizado LatamReady - EI Template by Document
            var busqTempDoc = search.create({
              type: 'customrecord_lmry_ei_template_doc',
              columns: ['custrecord_lmry_ei_td_doc_type', 'custrecord_lmry_ei_td_template', 'custrecord_lmry_ei_td_sending_method', 'custrecord_lmry_ei_td_trans_type'],
              filters: [
                ['custrecord_lmry_ei_td_subsi', 'anyof', doc_subsi], 'and', ['custrecord_lmry_ei_td_doc_type', 'equalto', doc_type], 'and', ['isinactive', 'is', 'F']
              ]
            });
            var resultTempDoc = busqTempDoc.run().getRange(0, 30);
            // log.error('resultTempDoc', resultTempDoc);

            if (resultTempDoc != null && resultTempDoc.length != 0) {
              var _template = '';
              var _method = '';
              var k = 0;
              if (resultTempDoc.length > 1) {

                for (var i = 0; i < resultTempDoc.length; i++) {
                  row = resultTempDoc[i].columns;
                  if (resultTempDoc[i].getValue(row[3]) == ntype) {
                    k = i;
                    _template = resultTempDoc[k].getValue(row[1]);
                    _method = resultTempDoc[k].getValue(row[2]);
                    break;
                  } else {
                    _template = '';
                    _method = '';
                  }
                }
              } else {
                row = resultTempDoc[0].columns;
                _template = resultTempDoc[0].getValue(row[1]);
                _method = resultTempDoc[0].getValue(row[2]);
              }

              var template = _template;
              var method = _method;

              rec.setValue('custbody_psg_ei_template', template);
              rec.setValue('custbody_psg_ei_sending_method', method);
            }
          }
        }

        /*if (doc_country == 'MX' && rec.type == 'invoice' && rec.getValue('createdfrom') != null && rec.getValue('createdfrom') != '' && rec.getValue('custbody_lmry_webserviceerror') == '') {
            rec.setValue('custbody_lmry_webserviceerror', setShipSourceId());
        }*/

        if (ntype == '7' && doc_country == 'PE') {
          var busqObj_Rec = search.create({
            type: 'customrecordtype',
            filters: [{
              name: 'scriptid',
              operator: 'is',
              values: 'customrecord_lmry_pe_fel_enable_feature'
            }]
          });
          resultObj_Rec = busqObj_Rec.run().getRange(0, 10);

          if (resultObj_Rec != null && resultObj_Rec != '') {
            // Busqueda Registro LatamReady - PE FEL Enable Feature
            var busqAutoDetra = search.create({
              type: 'customrecord_lmry_pe_fel_enable_feature',
              columns: ['custrecord_lmry_pe_auto_detra'],
              filters: [
                ['custrecord_lmry_pe_fel_subsidi', 'anyof', doc_subsi]
              ]
            });

            resultAutoDetra = busqAutoDetra.run().getRange(0, 10);
            // log.error('resultAutoDetra', resultAutoDetra);

            var autoDetra = '';
            if (resultAutoDetra != null && resultAutoDetra.length != 0) {
              fila = resultAutoDetra[0].columns;
              autoDetra = resultAutoDetra[0].getValue(fila[0]);
            }

            // log.error('autoDetra', autoDetra);

            if (autoDetra == false || autoDetra == 'F') {
              var detra = rec.getValue('custbody_lmry_concepto_detraccion');
              var detra_text = rec.getText('custbody_lmry_concepto_detraccion');
              var porcentaje1 = rec.getValue('custbody_lmry_porcentaje_detraccion');
              var winrate = rec.getValue('custpage_4601_witaxrate');
              var porcentaje2 = winrate;

              if (porcentaje2 == null || porcentaje2 == 'null') {
                porcentaje2 = '';
              }

              if (porcentaje1 == '0.0%') {
                porcentaje1 = '';
              }

              // log.error('porcentaje1', porcentaje1);
              // log.error('porcentaje2', porcentaje2);

              if ((detra != '' && detra != null) && detra_text != 'SIN DETRACCIÓN') {
                if ("" + porcentaje1 != "" + porcentaje2) {
                  alert('Los porcentajes de LATAM - PE PORCENTAJE DETRACCION y TAX RATE deben coincidir');
                  return false;
                }
              }
            }
          }
        }

        // log.error('FIN saveRecord', 'FIN saveRecord');

      } catch (err) {
        log.error("Error", "[ saveRecord ] " + err);
      }
      return true;
    }

    function PE_Void_EI(internal_Id, type_Rec, id_subsi) {
      try {
        var script_name = 'customscript_lmry_pe_ei_void_stlt';
        var script_deploy = 'customdeploy_lmry_pe_ei_void_stlt';
        var busq_setuptax = search.create({
          type: "customrecord_lmry_setup_tax_subsidiary",
          columns: ['custrecord_lmry_setuptax_ei_language'],
          filters: ['custrecord_lmry_setuptax_subsidiary', 'anyof', id_subsi]
        });
        var result_setuptax = busq_setuptax.run().getRange(0, 10);
        var languageSubsid = ""
        if (result_setuptax != null && result_setuptax.length != 0) {
          row = result_setuptax[0].columns;
          languageSubsid = result_setuptax[0].getText(row[0]);
        }
        switch (languageSubsid) {
          case "Español":
            languageSubsid = "es";
            break;
          case "Português":
            languageSubsid = "pt";
            break;
          default:
            languageSubsid = "en";
        }

        if (window["ei_void"]) {
          alert(jsonLanguage['alertaEsperar'][languageSubsid]);
        } else {
          var message = jsonLanguage['alertaEIVoidPE'][languageSubsid];
          window["ei_void"] = true;
          button_Logic(internal_Id, type_Rec, script_name, script_deploy, message, '', "cancelacion", "", "");
        }


      } catch (err) {
        log.error("Error", "[ PE_Void_EI ] " + err);
      }

    }

    function Addendas_Aut(invoiceId, recordType) {
      try {
        var language = runtime.getCurrentScript().getParameter({
          name: 'LANGUAGE'
        });
        language = language.substring(0, 2);
        //log.error('error log',invoiceId);
        if (invoiceId) {
          if (language == 'en') {
            var msg = 'The items in the addenda will be generated.';
          } else if (language == 'es') {
            var msg = 'Se generaran los items en la addenda.';
          } else if (language == 'pt') {
            var msg = 'Os itens nos adendos serão gerados.';
          } else {
            var msg = 'The items in the addenda will be generated.';
          }
          var flag = confirm(msg);
          if (flag) {
            var urlStlt = url.resolveScript({
              scriptId: "customscript_lmry_mx_gen_addendaaut_stlt",
              deploymentId: "customdeploy_lmry_mx_gen_addendaaut_stlt",
              returnExternalUrl: false,
              params: {
                "invoiceid": invoiceId,
                "recordType": recordType
              }
            });
            var domain = url.resolveDomain({
              hostType: url.HostType.APPLICATION
            });
            var objResponse = https.get("https://" + domain + urlStlt);
            if (objResponse.body != 'false') {
              var myMsg = message.create({
                title: "EI ADDENDA MX ITEMS - Executing",
                message: "Successful creation",
                type: message.Type.CONFIRMATION
              });
              myMsg.show({
                duration: 20000
              });
              window.location.reload();
            } else {
              var myMsg = message.create({
                title: "EI ADDENDA MX ITEMS - Executing",
                message: "Unsuccessful creation",
                type: message.Type.ERROR
              });
              myMsg.show({
                duration: 20000
              });
            }
          }

        }

      } catch (err) {
        alert("[ Addendas_Aut ]\n" + err);
        log.error("Error", "[ Addendas_Aut ] " + err);
        //console.error(err);
      }
    }

    function Button_Remove_Trans(recordId, recordType, id_subsi) {
      try {
        var busq_setuptax = search.create({
          type: "customrecord_lmry_setup_tax_subsidiary",
          columns: ['custrecord_lmry_setuptax_ei_language'],
          filters: [
            ['custrecord_lmry_setuptax_subsidiary', 'anyof', id_subsi], 'AND',
            ['isinactive', 'is', 'F']
          ]
        });
        var result_setuptax = busq_setuptax.run().getRange(0, 10);
        var languageSubsid = ""
        if (result_setuptax != null && result_setuptax.length != 0) {
          row = result_setuptax[0].columns;
          languageSubsid = result_setuptax[0].getText(row[0]);
        }
        switch (languageSubsid) {
          case "Español":
            languageSubsid = "es";
            break;
          case "Português":
            languageSubsid = "pt";
            break;
          default:
            languageSubsid = "en";
        }
        var message = jsonLanguage['alertaEIRemoveTransactions'][languageSubsid];
        var flag = confirm(message);
        if (flag) {
          Remove_Trans(recordId, recordType)
        }
      } catch (err) {
        log.error("Error", "[ Button_Remove_Trans ] " + err);
      }

    }

    function Remove_Trans(recordId, recordType) {
      if (recordType == 'customtransaction_lmry_payment_complemnt') {
        var rec_payment = record.load({
          type: recordType,
          id: recordId,
          isDynamic: false
        });

        var count_invoice = rec_payment.getLineCount({
          sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_cust'
        });
        for (var i = 0; i < count_invoice; i++) {
          rec_payment.setSublistValue({
            sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_cust',
            fieldId: 'custrecord_lmry_factoring_apply_compensa',
            line: i,
            value: false
          });
          rec_payment.setSublistValue({
            sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_cust',
            fieldId: 'custrecord_lmry_factoring_apply_invoice',
            line: i,
            value: false
          });
        }

        var count_bills = rec_payment.getLineCount({
          sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_vend'
        });
        for (var i = 0; i < count_bills; i++) {
          rec_payment.setSublistValue({
            sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_vend',
            fieldId: 'custrecord_lmry_factoring_apply_bill',
            line: i,
            value: false
          });
        }
        rec_payment.setValue('custpage_amount_deposited', 0)
        rec_payment.setValue('custpage_vendor_subtotal', 0);
        rec_payment.setValue('custpage_vendor_total', 0);
        rec_payment.setValue('custpage_apply_total', 0);

        var count_accounts = rec_payment.getLineCount({
          sublistId: 'line'
        });
        for (var i = 0; i < count_accounts; i++) {
          rec_payment.setSublistValue('line', 'credit', i, 0);
          rec_payment.setSublistValue('line', 'debit', i, 0);
        }
        rec_payment.save({
          ignoreMandatoryFields: true,
          enableSourcing: true
        });

      } else if (recordType == 'customerpayment') {
        var validJournal = true, journalId = "";
        if (F_REVERSALVOIDING == true || F_REVERSALVOIDING == 'T') {
          var resultJournal = library_AnulacionInvoice.reversalJournal(recordId);
          log.debug('resultJournal', resultJournal);
          validJournal = (resultJournal.fields.length == 0);
          journalId = resultJournal.trans || "";
        }

        if (validJournal) {
          var rec_payment = record.load({
            type: "customerpayment",
            id: recordId
          });

          var count_invoice = rec_payment.getLineCount({
            sublistId: 'apply'
          });
          for (i = 0; i < count_invoice; i++) {
            if (rec_payment.getSublistValue('apply', 'apply', i)) {
              rec_payment.setSublistValue({
                sublistId: 'apply',
                fieldId: 'apply',
                line: i,
                value: false
              });
            }
            if (journalId) {
              var transactionId = rec_payment.getSublistValue("apply", "internalid", i);
              if (transactionId == journalId) {
                rec_payment.setSublistValue({
                  sublistId: "apply",
                  fieldId: "apply",
                  line: i,
                  value: true
                })
              }
            }
          }
          rec_payment.save({
            ignoreMandatoryFields: true,
            enableSourcing: true
          });
        }
      }


      var myMsg = message.create({
        title: "REMOVE TRANSACTIONS - Executing",
        message: "Successful removal",
        type: message.Type.CONFIRMATION
      });
      myMsg.show({
        duration: 10000
      });
      window.location.reload();
    }

    function GT_Void_EI(internal_Id, type_Rec, id_subsi) {
      try {
        var script_name = 'customscript_lmry_gt_ei_void_stlt';
        var script_deploy = 'customdeploy_lmry_gt_ei_void_stlt';
        var busq_setuptax = search.create({
          type: "customrecord_lmry_setup_tax_subsidiary",
          columns: ['custrecord_lmry_setuptax_ei_language'],
          filters: ['custrecord_lmry_setuptax_subsidiary', 'anyof', id_subsi]
        });
        var result_setuptax = busq_setuptax.run().getRange(0, 10);
        var languageSubsid = ""
        if (result_setuptax != null && result_setuptax.length != 0) {
          row = result_setuptax[0].columns;
          languageSubsid = result_setuptax[0].getText(row[0]);
        }
        switch (languageSubsid) {
          case "Español":
            languageSubsid = "es";
            break;
          case "Português":
            languageSubsid = "pt";
            break;
          default:
            languageSubsid = "en";
        }
        if (window["ei_void"]) {
          alert(jsonLanguage['alertaEsperar'][languageSubsid]);
        } else {
          var message = jsonLanguage['alertaEIVoidGT'][languageSubsid];
          window["ei_void"] = true;
          button_Logic(internal_Id, type_Rec, script_name, script_deploy, message, '', "cancelacion", "", "");
        }

      } catch (err) {
        log.error("Error", "[ GT_Void_EI ] " + err);
      }

    }

    function EC_Void_EI(internal_Id, type_Rec, id_subsi) {
      try {
        var script_name = 'customscript_lmry_ec_ei_void_stlt';
        var script_deploy = 'customdeploy_lmry_ec_ei_void_stlt';

        var busq_setuptax = search.create({
          type: "customrecord_lmry_setup_tax_subsidiary",
          columns: ['custrecord_lmry_setuptax_ei_language'],
          filters: ['custrecord_lmry_setuptax_subsidiary', 'anyof', id_subsi]
        });
        var result_setuptax = busq_setuptax.run().getRange(0, 10);

        var languageSubsid = ""
        if (result_setuptax != null && result_setuptax.length != 0) {
          row = result_setuptax[0].columns;
          languageSubsid = result_setuptax[0].getText(row[0]);
        }
        switch (languageSubsid) {
          case "Español":
            languageSubsid = "es";
            break;
          case "Português":
            languageSubsid = "pt";
            break;
          default:
            languageSubsid = "en";
        }

        console.log('Se esta ejecutando bien')
        console.log('parametros', internal_Id, type_Rec, script_name, script_deploy, message)
        if (window["ei_void"]) {
          alert(jsonLanguage['alertaEsperar'][languageSubsid]);
        } else {
          var message = jsonLanguage['alertaEIVoidEC'][languageSubsid];
          window["ei_void"] = true;
          button_Logic(internal_Id, type_Rec, script_name, script_deploy, message, '', "cancelacion");
        }
      } catch (err) {
        log.error('Error', '[ EC_Void_EI ]' + err)
      }
    }

    function BR_Void_EI(internal_Id, type_Rec, id_subsi) {
      try {
        var script_name = 'customscript_lmry_br_ei_void_stlt';
        var script_deploy = 'customdeploy_lmry_br_ei_void_stlt';
        var busq_setuptax = search.create({
          type: "customrecord_lmry_setup_tax_subsidiary",
          columns: ['custrecord_lmry_setuptax_ei_language'],
          filters: ['custrecord_lmry_setuptax_subsidiary', 'anyof', id_subsi]
        });
        var result_setuptax = busq_setuptax.run().getRange(0, 10);
        var languageSubsid = ""
        if (result_setuptax != null && result_setuptax.length != 0) {
          row = result_setuptax[0].columns;
          languageSubsid = result_setuptax[0].getText(row[0]);
        }
        switch (languageSubsid) {
          case "Español":
            languageSubsid = "es";
            break;
          case "Português":
            languageSubsid = "pt";
            break;
          default:
            languageSubsid = "en";
        }
        if (window["ei_void"]) {
          alert(jsonLanguage['alertaEsperar'][languageSubsid]);
        } else {
          var message = jsonLanguage['alertaEIVoidBR'][languageSubsid];
          window["ei_void"] = true;
          button_Logic(internal_Id, type_Rec, script_name, script_deploy, message, '', "cancelacion", "", "");
        }
      } catch (err) {
        log.error("Error", "[ BR_Void_EI ] " + err);
      }

    }

    function BR_CartaCorreccion_EI(internal_Id, type_Rec, id_subsi) {
      try {
        var script_name = 'customscript_lmry_br_ei_correction_stlt';
        var script_deploy = 'customdeploy_lmry_br_ei_correction_stlt';
        var busq_setuptax = search.create({
          type: "customrecord_lmry_setup_tax_subsidiary",
          columns: ['custrecord_lmry_setuptax_ei_language'],
          filters: ['custrecord_lmry_setuptax_subsidiary', 'anyof', id_subsi]
        });
        var result_setuptax = busq_setuptax.run().getRange(0, 10);
        var languageSubsid = ""
        if (result_setuptax != null && result_setuptax.length != 0) {
          row = result_setuptax[0].columns;
          languageSubsid = result_setuptax[0].getText(row[0]);
        }
        switch (languageSubsid) {
          case "Español":
            languageSubsid = "es";
            break;
          case "Português":
            languageSubsid = "pt";
            break;
          default:
            languageSubsid = "en";
        }
        var message = jsonLanguage['alertaCartaCorrecionBR'][languageSubsid];

        button_Logic(internal_Id, type_Rec, script_name, script_deploy, message, '', "correccion", "", "");

      } catch (err) {
        log.error("Error", "[ BR_CartaCorreccion_EI ] " + err);
      }
    }

    function MX_Void_EI(internal_Id, type_Rec, serie_doc, type_doc, id_subsi, cod_modification) {
      try {
        var scriptObj = '';
        scriptObj = runtime.getCurrentScript();
        // log.error("Antes del load " + scriptObj.getRemainingUsage());
        // log.error("type_Rec", type_Rec);
        objCountry = ei_library.getCountryID(id_subsi);
        doc_country = objCountry.code;

        if (type_Rec == 'invoice') {

          var _rec = search.lookupFields({
            type: record.Type.INVOICE,
            id: internal_Id,
            columns: ['amountpaid']
          });

          var _nMontoPagado = Number(_rec.amountpaid);

          // log.error("_nMontoPagado", _nMontoPagado);
          if (parseFloat(_nMontoPagado) > 0) {
            alert('No se puede eliminar esta transaccion debido a que tienen transacciones relacionadas');
            return true;
          }
        }
        typeDoc = type_doc;
        serieDoc = serie_doc;
        var script_name = 'customscript_lmry_mx_ei_void_stlt';
        var script_deploy = 'customdeploy_lmry_mx_ei_void_stlt';
        var busq_setuptax = search.create({
          type: "customrecord_lmry_setup_tax_subsidiary",
          columns: ['custrecord_lmry_setuptax_ei_language'],
          filters: ['custrecord_lmry_setuptax_subsidiary', 'anyof', id_subsi]
        });
        var result_setuptax = busq_setuptax.run().getRange(0, 10);
        var languageSubsid = ""
        if (result_setuptax != null && result_setuptax.length != 0) {
          row = result_setuptax[0].columns;
          languageSubsid = result_setuptax[0].getText(row[0]);
        }
        switch (languageSubsid) {
          case "Español":
            languageSubsid = "es";
            break;
          case "Português":
            languageSubsid = "pt";
            break;
          default:
            languageSubsid = "en";
        }
        if (window["ei_void"]) {
          alert(jsonLanguage['alertaEsperar'][languageSubsid]);
        } else {
          var message = jsonLanguage['alertaEIVoidMX'][languageSubsid];
          window["ei_void"] = true;
          button_Logic(internal_Id, type_Rec, script_name, script_deploy, message, '', "cancelacion", doc_country, cod_modification);
        }
      } catch (err) {
        log.error("Error", "[ MX_Void_EI ] " + err);
      }

    }

    function BO_Void_EI(internal_Id, type_Rec, id_subsi) {
      try {
        var script_name = 'customscript_lmry_bo_ei_void_stlt';
        var script_deploy = 'customdeploy_lmry_bo_ei_void_stlt';
        var busq_setuptax = search.create({
          type: "customrecord_lmry_setup_tax_subsidiary",
          columns: ['custrecord_lmry_setuptax_ei_language'],
          filters: ['custrecord_lmry_setuptax_subsidiary', 'anyof', id_subsi]
        });
        var result_setuptax = busq_setuptax.run().getRange(0, 10);
        var languageSubsid = ""
        if (result_setuptax != null && result_setuptax.length != 0) {
          row = result_setuptax[0].columns;
          languageSubsid = result_setuptax[0].getText(row[0]);
        }
        switch (languageSubsid) {
          case "Español":
            languageSubsid = "es";
            break;
          case "Português":
            languageSubsid = "pt";
            break;
          default:
            languageSubsid = "en";
        }
        if (window["ei_void"]) {
          alert(jsonLanguage['alertaEsperar'][languageSubsid]);
        } else {
          var message = jsonLanguage['alertaEIVoidBO'][languageSubsid];
          window["ei_void"] = true;
          button_Logic(internal_Id, type_Rec, script_name, script_deploy, message, '', "cancelacion");
        }
      } catch (err) {
        log.error("Error", "[ BO_Void_EI ] " + err);
      }

    }

    function button_Logic(nInternalId, sTypeRec, script_name, script_deploy, msg, action, Typevento, docCountry, codModification) {
      try {
        var flag = confirm(msg);
        if (flag) {
          if (typeDoc != '' && serieDoc != '') {
            var _CadUrl = url.resolveScript({
              scriptId: script_name,
              deploymentId: script_deploy,
              returnExternalUrl: false
            }) + '&internalid=' + nInternalId + '&typerec=' + sTypeRec + '&typedoc=' + typeDoc +
              '   &seriedoc=' + serieDoc + '&action=' + action;
          } else {
            var _CadUrl = url.resolveScript({
              scriptId: script_name,
              deploymentId: script_deploy,
              returnExternalUrl: false
            }) + '&internalid=' + nInternalId + '&typerec=' + sTypeRec + '&action=' + action;
          }

          var host = url.resolveDomain({
            hostType: url.HostType.APPLICATION,
            accountId: runtime.accountId
          });

          var objResponse = https.get("https://" + host + _CadUrl);

          // log.error(host + _CadUrl);
          // log.error(objResponse.body);
          if (Typevento == 'cancelacion') {
            if (objResponse.body == 'true') {
              var myMsg = message.create({
                title: "EI VOID CANCELATION - Executing",
                message: "Successful cancellation",
                type: message.Type.CONFIRMATION
              });
              myMsg.show({
                duration: 20000
              });
            } else if (objResponse.body == 'Parcial') {
              var myMsg = message.create({
                title: "EI VOID CANCELATION - Executing",
                message: "Unsuccessful cancellation in NetSuite.",
                type: message.Type.WARNING
              });
              myMsg.show({
                duration: 20000
              });
            } else {
              var myMsg = message.create({
                title: "EI VOID CANCELATION - Executing",
                message: "Unsuccessful cancellation",
                type: message.Type.ERROR
              });
              myMsg.show({
                duration: 20000
              });
            }
          } else if (Typevento == 'correccion') {
            if (objResponse.body == 'true') {
              var myMsg = message.create({
                title: "EI BR CORRECTION LETTER - Send",
                message: "Success Sending",
                type: message.Type.CONFIRMATION
              });
              myMsg.show({
                duration: 20000
              });
            } else {
              var myMsg = message.create({
                title: "EI BR CORRECTION LETTER  - Send",
                message: "Sending Error",
                type: message.Type.ERROR
              });
              myMsg.show({
                duration: 20000
              });
            }
          }

          window.location.reload();
        }
      } catch (err) {
        log.error("Error", "[ button_Logic ] " + err);
      }
    }

    function Print_PDF_EI(internal_Id, _country, _typeRec, _id_subsi) {
      try {
        var flag = confirm('¿Está seguro que desea generar el PDF?');
        // flag = true;
        var rps = '';
        var _scriptId = '';
        var _deploymentId = '';
        if (_country == 'CO' && _typeRec != "salesorder") {
          _scriptId = 'customscript_lmry_ei_print_pdf_stlt';
          _deploymentId = 'customdeploy_lmry_ei_print_pdf_stlt';
        } else if (_country == 'US' || (_country == 'CO' && _typeRec == "salesorder")) {
          if (_country == 'CO') {
            _typeRec = "invoice";
          }
          /* VERIFICA SI EXISTEN PLANTILLAS EN EL PDF */
          var verPDF = search.create({
            type: 'customrecord_versiones_pdf_customize',
            columns: ['custrecord_template_pdf_customize'],
            filters: [
              ['isinactive', 'is', 'F'],
              'AND',
              ['custrecord_subsi_pdf_customize', 'anyof', _id_subsi],
              "AND",
              ["custrecord_tipotran_pdf_customize", "is", _typeRec]
            ]
          });
          verPDF = verPDF.run().getRange(0, 1); // trae la plantilla

          if (verPDF != '' && verPDF != null) {
            /* VERIFICA SI SE HA GENERADO UN PDF ALMACENADO COMO USER NOTES*/
            var busqnotes = search.create({
              type: 'note',
              columns: ['title', 'note', 'direction'],
              filters: [
                ["transaction.mainline", "is", "T"],
                "AND",
                ['transaction.internalid', 'anyof', internal_Id]
              ]
            });
            var resultnotes = busqnotes.run().getRange(0, 10);
            if (resultnotes == null || resultnotes.length == 0) {
              _scriptId = 'customscript_lmry_ei_pdf_split_stlt';
              _deploymentId = 'customdeploy_lmry_ei_pdf_split_stlt';
            } else if (flag) {
              rps = confirm("Ya tiene un PDF Generado. ¿Desea volver a generar?");
              if (rps) {
                _scriptId = 'customscript_lmry_ei_pdf_split_stlt';
                _deploymentId = 'customdeploy_lmry_ei_pdf_split_stlt';
              }
            }
          } else {
            alert('Debe configurar un PDF para esta transacción');
          }
        }

        if (flag) {
          var host = url.resolveDomain({
            hostType: url.HostType.APPLICATION,
            accountId: runtime.accountId
          });
          var url_stlt = url.resolveScript({
            scriptId: _scriptId,
            deploymentId: _deploymentId,
            returnExternalUrl: false
          });
          url_stlt = 'https://' + host + url_stlt + '&custpage_internalid=' + internal_Id;
          window.open(url_stlt, '_blank');
        }
      } catch (e) {
        log.error("Error", "[ Print_PDF_EI ] " + e);
      }
    }

    function Status_EI(internal_Id, id_subsi, rechazar) {
      try {
        var busq_setuptax = search.create({
          type: "customrecord_lmry_setup_tax_subsidiary",
          columns: ['custrecord_lmry_setuptax_ei_language'],
          filters: ['custrecord_lmry_setuptax_subsidiary', 'anyof', id_subsi]
        });
        var result_setuptax = busq_setuptax.run().getRange(0, 10);
        var languageSubsid = ""
        if (result_setuptax != null && result_setuptax.length != 0) {
          row = result_setuptax[0].columns;
          languageSubsid = result_setuptax[0].getText(row[0]);
        }
        switch (languageSubsid) {
          case "Español":
            languageSubsid = "es";
            break;
          case "Português":
            languageSubsid = "pt";
            break;
          default:
            languageSubsid = "en";
        }

        if (rechazar == true) {
          var flag = confirm(jsonLanguage['alertaEIStatusRejected'][languageSubsid]);
        } else {
          var flag = confirm(jsonLanguage['alertaEIStatus'][languageSubsid]);
        }
        var country = ei_library.getCountryID(id_subsi).code;
        var SCHDL_RELLAMADO = '';
        var flagRellamadoConcurrente = true;
        if (country == 'EC') {
          SCHDL_RELLAMADO = 'customscript_lmry_ec_ei_schdl';
          if (SCHDL_RELLAMADO != '' && flag) {
            var busq_scheduledstatus = search.create({
              type: "scheduledscriptinstance",
              columns: ['status', 'scriptdeployment.scriptid', 'startdate'],
              filters: [
                ['script.scriptid', 'startswith', SCHDL_RELLAMADO],
                'AND',
                ['status', 'is', 'PROCESSING'],
                'AND',
                ['startdate', 'onorafter', 'yesterday'],
              ]
            });
            var result_scheduledstatus = busq_scheduledstatus.run().getRange(0, 10);
            if (result_scheduledstatus.length > 0) {
              flagRellamadoConcurrente = confirm(jsonLanguage['alertaEIStatusConcurrente'][languageSubsid])
            }
          }
        }
        if (flag && flagRellamadoConcurrente) {
          BR_EmptyFolioFiscal(internal_Id, country);
          var obj_json = {};
          obj_json.custpage_doctype = '';
          obj_json.custpage_start_date = '';
          obj_json.custpage_end_date = '';

          var host = url.resolveDomain({
            hostType: url.HostType.APPLICATION,
            accountId: runtime.accountId
          });
          var url_stlt = url.resolveScript({
            scriptId: 'customscript_lmry_ei_confirm_status_stlt',
            deploymentId: 'customdeploy_lmry_ei_confirm_status_stlt',
            returnExternalUrl: false
          });
          url_stlt = 'https://' + host + url_stlt + '&custpage_subsi=' + id_subsi + '&custpage_trandata=' + internal_Id + '&custpage_origen=transaccion' + '&rec_canc=' + rechazar;
          console.log(url_stlt);

          var objRellamado = '';
          var retorno = '';

          objRellamado =
            https.post({
              url: url_stlt,
              body: obj_json
            });
          retorno = objRellamado.body;
          //log.error('retornoSTLT', retorno);

          switch (retorno) {
            case 'PENDING':
              var myMsg = message.create({
                title: "EI - Status",
                message: "Pending Status Updating - Check Log of documents and Reload the page.",
                type: message.Type.WARNING
              });
              myMsg.show({
                duration: 20000
              });
              break;
            case 'PROCESSING':
              var myMsg = message.create({
                title: "EI - Status",
                message: "Status Update in process - Check Log of documents and Reload the page.",
                type: message.Type.INFORMATION
              });
              myMsg.show({
                duration: 20000
              });
              break;
            case 'FAILED':
              var myMsg = message.create({
                title: "EI - Status",
                message: "Failed Status Updating - Check Log of documents and Reload the page.",
                type: message.Type.ERROR
              });
              myMsg.show({
                duration: 20000
              });
              break;
            default:
              var myMsg = message.create({
                title: "EI - Status",
                message: "Status Update in process - Check Log of documents and Reload the page.",
                type: message.Type.INFORMATION
              });
              myMsg.show({
                duration: 20000
              });
              break;
          }
          window.location.reload();
        }
      } catch (err) {
        log.error("Error", "[ Status_EI ] " + err);
      }

    }

    function BR_EmptyFolioFiscal(internal_Id, country) {
      var transactionSearchObj = search.create({
        type: "transaction",
        filters:
          [
            ["internalidnumber", "equalto", internal_Id],
            "AND",
            ["mainline", "is", "T"]
          ],
        columns:
          [
            "custbody_lmry_foliofiscal",
            search.createColumn({
              name: "custrecord_lmry_ei_ds_doc_status",
              join: "CUSTRECORD_LMRY_EI_DS_DOC"
            }),
            search.createColumn({
              name: "internalid",
              join: "CUSTRECORD_LMRY_EI_DS_DOC"
            })
          ]
      });
      var resultSearchObj = transactionSearchObj.run().getRange(0, 1);
      if (resultSearchObj != null && resultSearchObj.length != 0) {
        var columns = resultSearchObj[0].columns;
        var folio = resultSearchObj[0].getValue(columns[0]);
        var status = resultSearchObj[0].getValue(columns[1]);
        var statusRecId = resultSearchObj[0].getValue(columns[2]);
      }
      if ((country == 'BR' || country == 'CR') && (folio == '' || folio == null) && (status == 'Autorizado' || status == 'Observado' || status == 'Aprobado')) {
        record.submitFields({
          type: 'customrecord_lmry_ei_docs_status',
          id: statusRecId,
          values: {
            'custrecord_lmry_ei_ds_doc_status': 'Procesando'
          },
          options: {
            ignoreMandatoryFields: true,
            enableSourcing: true,
            disableTriggers: true
          }
        });
      }
    }

    function Send_Customer(par_country, inv_id, user) {

      try {

        var flag = confirm("Do you want to send the email to the customer?");
        if (flag) {
          var http_get = https.post.promise({
            url: obtenerUrlScript(),
            body: JSON.stringify({
              id: inv_id,
              user: user
            })
          });

          var json_consum = http_get.body;
        }

      } catch (err) {
        log.error("Error", "[ Send_Customer ] " + err);
      }

    }

    function obtenerUrlScript() {
      var scheme = 'https://';
      var host = url.resolveDomain({
        hostType: url.HostType.APPLICATION,
        accountId: runtime.accountId
      });

      var output = url.resolveScript({
        scriptId: 'customscript_lmry_generate_message',
        deploymentId: 'customdeploy_lmry_generate_message',
        // returnExternalUrl: true
      });
      var urlScript = scheme + host + output;
      return urlScript;
    }

    /*function setShipSourceId() {
        var id_itemShip = '';
        var itemShip = window.location.href.split('?')[1];
        var pos = itemShip.indexOf('itemship=');
        if (pos !== -1) {
            var final = itemShip.indexOf('&', pos);
            if (final !== -1) {
                id_itemShip = itemShip.substring(pos + 9, final);
            }
        }
        return id_itemShip;
    }*/

    function featurePais(pais) {
      switch (pais) {
        case 'AR':
          return 220
        case 'BO':
          return 221
        case 'BR':
          return 222
        case 'CO':
          return 223
        case 'CL':
          return 224
        case 'CR':
          return 225
        case 'EC':
          return 226
        case 'MX':
          return 227
        case 'PE':
          return 228
        case 'UY':
          return 229
        case 'PA':
          return 440
        case 'GT':
          return 638
        case 'PY':
          return 963
      }
    }

    function block_lmry_cl_ei_exchangerate(currentRCD) {

      try {

        var featureMB = runtime.isFeatureInEffect({
          feature: "MULTIBOOK"
        });

        var featureOWE = runtime.isFeatureInEffect({
          feature: 'SUBSIDIARIES'
        });

        if (!featureMB || !featureOWE) {
          currentRCD.setValue('custbody_lmry_cl_ei_exchangerate', '');
        } else if (currentRCD.getValue('subsidiary') != '' && currentRCD.getValue('subsidiary') != null && currentRCD.getValue('currency') != '' && currentRCD.getValue('currency') != null) {
          currentRCD.setValue('custbody_lmry_cl_ei_exchangerate', getExchangeRate(currentRCD));
        }

      } catch (e) {
        log.error('Error', '[ei exchange rate]: ' + e)
      }

    }

    function getExchangeRate(currentRCD) {

      var localmoneda = localCurrency(currentRCD);
      if (subsi) {
        var subsimoneda = subsiCurrency(currentRCD);
      } else {
        var doc_subsi = currentRCD.getValue('subsidiary');
        var objCountry = ei_library.getCountryID(doc_subsi);
        var subsimoneda = objCountry.currency;
      }
      log.error("subsi-localmoneda-subsimoneda", subsi + '-' + localmoneda + '-' + subsimoneda)
      if (subsimoneda == localmoneda) {
        return '';
      } else if (currentRCD.getValue('currency') == localmoneda) {
        return 1;
      } else {
        var bookExchangeRate = '';
        if (localmoneda != '') {
          var trandate = format.parse({
          value: currentRCD.getValue('trandate'),
          type: format.Type.DATE
        });

        bookExchangeRate = currencyApi.exchangeRate({
          date: trandate,
          source: currentRCD.getValue('currency'),
          target: localmoneda
        });
       }
        return bookExchangeRate;
      }
    }

    function localCurrency(currentRCD) {
      var localcu = search.create({
        type: "customrecord_lmry_setup_tax_subsidiary",
        columns: [
          "custrecord_lmry_setuptax_currency"
        ],
        filters: [
          ["custrecord_lmry_setuptax_subsidiary", "anyof", currentRCD.getValue('subsidiary')], "AND",
          ["isinactive", "is", "F"],
        ]
      });

      localcu = localcu.run().getRange(0, 1);

      if (localcu.length > 0) {
        return localcu[0].getValue('custrecord_lmry_setuptax_currency');
      }else {
       return "";
     }
    }

    function subsiCurrency(currentRCD) {
      var subsicu = search.create({
        type: "subsidiary",
        columns: [
          "currency"
        ],
        filters: [
          ["internalid", "anyof", currentRCD.getValue('subsidiary')], "AND",
          ["isinactive", "is", "F"],
        ]
      });

      subsicu = subsicu.run().getRange(0, 1);

      if (subsicu.length > 0) {
        return subsicu[0].getValue('currency');
      }
    }

    function onclick_event_preprintedNumber(invoice_id, serie, subsid) {
      try {
        var objRecord = record.create({
          type: 'customrecord_lmry_number_preprinted',
          isDynamic: true
        });
        objRecord.setValue({
          fieldId: 'custrecord_lmry_preprint_transaction',
          value: invoice_id
        });
        objRecord.setValue({
          fieldId: 'custrecord_lmry_preprint_serie',
          value: serie
        });
        objRecord.setValue({
          fieldId: 'custrecord_lmry_preprint_subsid',
          value: subsid
        });
        var saveRecord = objRecord.save({
          enableSourcing: true,
          ignoreMandatoryFields: false
          //disableTriggers: false
        });
        var output = url.resolveRecord({
          recordType: 'INVOICE',
          recordId: invoice_id,
          isEditMode: false
        });
        window.location.href = output;
      } catch (err) {
        log.error("Error", "[ onclick_event_preprintedNumber ] " + err);
      }
    }

    function onclick_event_updateTranid(invoice_id, tranid, number) {
      try {
        var recordInv = record.submitFields({
          type: "INVOICE",
          id: invoice_id,
          values: {
            'tranid': tranid,
            'custbody_lmry_num_preimpreso': number
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true
          }
        });
        var output = url.resolveRecord({
          recordType: 'INVOICE',
          recordId: invoice_id,
          isEditMode: false
        });
        window.location.href = output;
      } catch (err) {
        log.error("Error", "[ onclick_event_updateTranid ] " + err);
      }
    }

    return {
      pageInit: pageInit,
      fieldChanged: fieldChanged,
      //postSourcing: postSourcing,
      //sublistChanged: sublistChanged,
      //lineInit: lineInit,
      //validateField: validateField,
      validateLine: validateLine,
      //validateInsert: validateInsert,
      BR_CartaCorreccion_EI: BR_CartaCorreccion_EI,
      MX_Void_EI: MX_Void_EI,
      BR_Void_EI: BR_Void_EI,
      PE_Void_EI: PE_Void_EI,
      GT_Void_EI: GT_Void_EI,
      BO_Void_EI: BO_Void_EI,
      EC_Void_EI: EC_Void_EI,
      Print_PDF_EI: Print_PDF_EI,
      Status_EI: Status_EI,
      Send_Customer: Send_Customer,
      saveRecord: saveRecord,
      Addendas_Aut: Addendas_Aut,
      Button_Remove_Trans: Button_Remove_Trans,
      onclick_event_preprintedNumber: onclick_event_preprintedNumber,
      onclick_event_updateTranid: onclick_event_updateTranid
    };

  });