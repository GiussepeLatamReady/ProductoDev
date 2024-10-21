/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_UniversalSetting_LBRY.js				    ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 20 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
 define(['N/search', 'N/log', 'N/runtime', 'N/record', 'N/url', 'N/https', './LMRY_libSendingEmailsLBRY_V2.0', 'N/format', 'N/file', 'N/config', 'N/suiteAppInfo', './LMRY_Log_LBRY_V2.0'], function(search, log, runtime, record, url, https, library_Mail, format, file, config, suiteAppInfo, logLbry) {
    var LMRY_script = 'LMRY_UniversalSetting_LBRY';
    var subsiOW = false;
  
    function auto_universal_setting(licenses, type_event) {
      //Consulta de features necesarios para realizar Universal Setting
      try {
        var type_interface = runtime.executionContext;
        var arrayFeat2 = [];
        /*Feature EI-Setup (General Functions)
          'AR': 220,'BO': 221,'BR': 222,'CL': 224,'CO': 223,
          'CR': 225,'EC': 226,'MX': 227,'PA': 440,'PE': 228,'UY': 229, 'GT': 638, 'PY': 963, 'RD': 858
        };*/
        //Feature EI-Setup (General Functions)
        var arrayFeat1 = [220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 440, 638, 963, 858];
        if(!returnFeature(arrayFeat1, licenses)) {
          return false;
        }
        if(!type_event) {
          if(type_interface == 'CSVIMPORT') {
            /*FEATURES AUTOMATIC SET FIELD CSV
            'AR': 433,'BO': 592,'BR': 431,'CL': 434,'CO': 435,'CR': 593,
            'EC': 594,'MX': 436,'PA': 442,'PE': 437,'UY': 595, 'GT': 705, 'PY': 957
            'RD': 854
            */
            arrayFeat2 = [433, 592, 431, 434, 435, 593, 594, 436, 442, 437, 595, 705, 957, 854];
          } else {
            /*Features Automatic Set Field (A/R)
                         'AR': 323,'BO': 324,'BR': 325,'CL': 326,'CO': 327,'CR': 328,'EC': 329,
                         'SV': 330,'GT': 331,'MX': 332,'PA': 333,'PY': 334,'PE': 335,'UY': 336,
                         'RD': 853
                    */
            arrayFeat2 = [323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 853];
          }
        }
        if(!returnFeature(arrayFeat2, licenses)) {
          return false;
        }
        return true;
      } catch (err) {
        logLbry.doLog({
          tittle: '[auto_universal_setting]',
          message: err,
          relatedScript: LMRY_script
        });
        library_Mail.sendemail('[auto_universal_setting] ' + err, LMRY_script);
      }
    }
    /* ------------------------------------------------------------------------------------------------------
     * Funcion para el seteo automatico - Automatic Setfield - After Submit (D0952)
     * --------------------------------------------------------------------------------------------------- */
    function automaticSetFieldDocument(recordObj) {
      var data_automatic_search = automatic_search(recordObj);
      var relatedFields = ['custbody_lmry_document_type', 'custbody_lmry_serie_doc_cxc', 'custbody_lmry_modification_reason', 'custbody_lmry_serie_doc_loc_cxc'];
      var id_country = recordObj.getValue('custbody_lmry_subsidiary_country');
      var type_transaction = recordObj.type;
      if(data_automatic_search != '' && data_automatic_search != null) {
        var data = data_automatic_search[0].getValue('custrecord_lmry_setup_us_data');
        if(data != null && data != '') {
          var set_data = JSON.parse(data_automatic_search[0].getValue('custrecord_lmry_setup_us_data'));
          var valuesObj = {};
          for(var i = 0; i < set_data.length; i++) {
            var fieldIndex = relatedFields.indexOf(set_data[i].field);
            if(fieldIndex != -1) {
              //recordObj.setValue(set_data[i].field, set_data[i].value);
              var value = set_data[i].value;
              if(value) {
                valuesObj[set_data[i].field] = value;
                recordObj.setValue(set_data[i].field, value);
              }
            }
          }
          if(Object.keys(valuesObj).length) {
            record.submitFields({
              type: recordObj.type,
              id: recordObj.id,
              values: valuesObj,
              options: {
                disableTriggers: true,
                enableSourcing: false,
                ignoreMandatoryFields: true
              }
            });
          }
          /* ******************************** */
          // 2022.01.13 :Solo para Mexico
          // 157: Mexico               (MX)
          /* ******************************** */
          if(id_country == '157' && (type_transaction == "invoice" || type_transaction == 'creditmemo' || type_transaction == 'customerpayment' || type_transaction == 'customtransaction_lmry_payment_complemnt')) {
            // Latam - Serie CxC (No debe estar vacio la seria)
            var serie_id = recordObj.getValue('custbody_lmry_serie_doc_cxc');
            // Latam - MX Document Design (Debe estar vacio el campo)
            var docum_sg = recordObj.getValue('custbody_lmry_mx_document_design');
            if(serie_id && !docum_sg) {
              // LatamReady - Print Series
              var diseno_id = search.lookupFields({
                type: 'customrecord_lmry_serie_impresion_cxc',
                id: serie_id,
                columns: ['custrecord_lmry_diseno_pdf']
              }).custrecord_lmry_diseno_pdf;
              if(diseno_id && diseno_id.length) {
                diseno_id = diseno_id[0].value;
              } else {
                diseno_id = "";
              }
              // Latam - MX Document Design
              //recordObj.setValue('custbody_lmry_mx_document_design', diseno_id);
              record.submitFields({
                type: recordObj.type,
                id: recordObj.id,
                values: {
                  'custbody_lmry_mx_document_design': diseno_id
                }
              });
            }
          } // 2022.01.13 :Solo para Mexico
        }
      }
    }
    /* ------------------------------------------------------------------------------------------------------
     * Funcion para el seteo automatico - Automatic Setfield
     * --------------------------------------------------------------------------------------------------- */
    function automatic_setfield(currentRCD, interface) {
      //Seteo de campos cabecera de acuerdo a configuración Automatic Set
      try {
        //variable interface, si es true es setea los campos IU , USERVENT, CSVIMPORT
        var data_automatic_search = automatic_search(currentRCD);
        var validateFieldsAR = ['custbody_lmry_document_type_validate', 'custbody_lmry_serie_doc_cxc_validate'];
        var typeTransactionError = ['creditmemo', 'customerpayment', 'invoice'];
        var relatedFields = ['custbody_lmry_document_type', 'custbody_lmry_serie_doc_cxc', 'custbody_lmry_modification_reason', 'custbody_lmry_serie_doc_loc_cxc'];
        var id_country = currentRCD.getValue('custbody_lmry_subsidiary_country');
        var type_transaction = currentRCD.type;
        var fieldReplace = {
          'custbody_lmry_document_type': 'custpage_document_type',
          'custbody_lmry_serie_doc_cxc': 'custpage_serie_doc'
        }
        if(data_automatic_search != '' && data_automatic_search != null) {
          var data = data_automatic_search[0].getValue('custrecord_lmry_setup_us_data');
          if(data != null && data != '') {
            var set_data = JSON.parse(data_automatic_search[0].getValue('custrecord_lmry_setup_us_data'));
            if(typeTransactionError.indexOf(type_transaction) != -1 && interface) {
              for(var i = 0; i < set_data.length; i++) {
                if(set_data[i].value != '' && set_data[i].value != null) {
                  if(validateFieldsAR.indexOf(set_data[i].field) != -1) continue;
                  var fieldIndex = relatedFields.indexOf(set_data[i].field);
                  if(fieldIndex == -1) {
                    currentRCD.setValue(set_data[i].field, set_data[i].value);
                  }
                }
              }
            } else {
              for(var i = 0; i < set_data.length; i++) {
                if(set_data[i].value != '' && set_data[i].value != null) {
                  if(validateFieldsAR.indexOf(set_data[i].field) != -1) continue;
                  if(type_transaction == 'customtransaction_lmry_payment_complemnt') {
                    if(fieldReplace[set_data[i].field]) {
                      currentRCD.setValue(fieldReplace[set_data[i].field], set_data[i].value)
                    } else {
                      currentRCD.setValue(set_data[i].field, set_data[i].value);
                    }
                  } else {
                    currentRCD.setValue(set_data[i].field, set_data[i].value);
                  }
                }
              }
            }
            // 11:  Argentina            (AR)
            if(id_country == '11' && type_transaction == "invoice") validateDocument(currentRCD, set_data, validateFieldsAR);
            /* ******************************** */
            // 2022.01.13 :Solo para Mexico
            // 157: Mexico               (MX)
            /* ******************************** */
            if(id_country == '157' && (type_transaction == "invoice" || type_transaction == 'creditmemo' || type_transaction == 'customerpayment' || type_transaction == 'customtransaction_lmry_payment_complemnt')) {
              // Latam - Serie CxC (No debe estar vacio la seria)
              var serie_id = currentRCD.getValue('custbody_lmry_serie_doc_cxc');
              // Latam - MX Document Design (Debe estar vacio el campo)
              var docum_sg = currentRCD.getValue('custbody_lmry_mx_document_design');
              if(serie_id && !docum_sg) {
                // LatamReady - Print Series
                var diseno_id = search.lookupFields({
                  type: 'customrecord_lmry_serie_impresion_cxc',
                  id: serie_id,
                  columns: ['custrecord_lmry_diseno_pdf']
                }).custrecord_lmry_diseno_pdf;
                if(diseno_id && diseno_id.length) {
                  diseno_id = diseno_id[0].value;
                } else {
                  diseno_id = "";
                }
                // Latam - MX Document Design
                currentRCD.setValue('custbody_lmry_mx_document_design', diseno_id);
              }
            } // 2022.01.13 :Solo para Mexico
          } else {
            log.error(LMRY_script, ' [ automatic_set_field ] - Configuración incorrecta ');
          }
        }
      } catch (err) {
        logLbry.doLog({
          tittle: '[ automatic_set_field ]',
          message: err,
          relatedScript: LMRY_script
        });
        library_Mail.sendemail(' [ automatic_set_field ] ' + err, LMRY_script);
      }
    }
    /* ------------------------------------------------------------------------------------------------------
     * Funcion para el seteo automatico - Automatic Setfield Record
     * --------------------------------------------------------------------------------------------------- */
    function automatic_setfieldrecord(currentRCD) {
      try {
        //Seteo de campos pertenecientes a record anexado Transaction Fields para AR, BR y CO
        var data_automatic_search = automatic_search(currentRCD);
        var id_country = currentRCD.getValue('custbody_lmry_subsidiary_country');
        var subsidiary = currentRCD.getValue('subsidiary');
        var check_hibrid = currentRCD.getValue('custbody_lmry_tax_tranf_gratu');
        var type_transaction = currentRCD.type;
        var paymentMethod = currentRCD.getValue('custbody_lmry_paymentmethod');
        var licenses = [];
        licenses = library_Mail.getLicenses(subsidiary);
        if(data_automatic_search != '' && data_automatic_search != null) {
          var id_record = '';
          var id_record_key = '';
          switch(id_country) {
            case '11':
              id_record = 'customrecord_lmry_ar_transaction_fields';
              id_record_key = 'custrecord_lmry_ar_transaction_related';
              break;
            case '30':
              id_record = 'customrecord_lmry_br_transaction_fields';
              id_record_key = 'custrecord_lmry_br_related_transaction';
              break;
            case '48':
              id_record = 'customrecord_lmry_co_transaction_fields';
              id_record_key = 'custrecord_lmry_co_related_transaction';
              break;
            case '231':
              id_record = 'customrecord_lmry_uy_transaction_fields';
              id_record_key = 'custrecord_lmry_uy_transaction_related';
              break;
            case '29':
              id_record = 'customrecord_lmry_bo_transaction_fields';
              id_record_key = 'custrecord_lmry_bo_transaction';
              break;
            case '91':
              id_record = 'customrecord_lmry_gt_transaction_fields';
              id_record_key = 'custrecord_lmry_gt_related_transaction';
              break;
              //23-02-2022
            case '173':
              id_record = 'customrecord_lmry_pa_transaction_fields';
              id_record_key = 'custrecord_lmry_pa_transaction';
              break;
            case '186':
              id_record = 'customrecord_lmry_py_transaction_fields';
              id_record_key = 'custrecord_lmry_py_transaction';
              break;
            case '61':
              id_record = 'customrecord_lmry_do_transaction_fields';
              id_record_key = 'custrecord_lmry_do_transaction_related';
              break;
            default:
              return true;
          }
          var data_record = data_automatic_search[0].getValue('custrecord_lmry_setup_us_data_record');
          if(data_record != null && data_record != '') {
            var set_data_record = JSON.parse(data_automatic_search[0].getValue('custrecord_lmry_setup_us_data_record'));
            var filters = new Array();
            filters[0] = search.createFilter({
              name: 'isinactive',
              operator: search.Operator.IS,
              values: ['F']
            });
            filters[1] = search.createFilter({
              name: id_record_key,
              operator: search.Operator.ANYOF,
              values: currentRCD.id
            });
            var columns = new Array();
            columns[0] = search.createColumn({
              name: 'internalid'
            });
            var data_replicada = search.create({
              type: id_record,
              columns: columns,
              filters: filters
            });
            data_replicada = data_replicada.run().getRange(0, 1);
            //D1256: Mejora BR - Validacion Create & Update BR transaction fields
            var idBRTransaction = '';
            if(id_country == 30) {
              if(data_replicada.length > 0) {
                idBRTransaction = data_replicada[0].getValue('internalid');
              }
            }
            if(data_replicada != '' && data_replicada != null && id_country != 30) {
              return true;
            } else {
              var isBRBoletoBancario = false;
              if(type_transaction == "invoice" && Number(id_country) == 30) {
                isBRBoletoBancario = checkIsBRBoletoBancario(currentRCD);
              }
              if(type_transaction == "invoice" && Number(id_country) == 30) {
                if(idBRTransaction) {
                  var new_setrecord = record.load({
                    type: "customrecord_lmry_br_transaction_fields",
                    id: idBRTransaction,
                  });
                } else {
                  var new_setrecord = record.create({
                    type: id_record,
                    isDynamic: true
                  });
                }
              } else {
                var new_setrecord = record.create({
                  type: id_record,
                  isDynamic: true
                });
              }
              new_setrecord.setValue(id_record_key, currentRCD.id);
              if(type_transaction == 'invoice' && id_country == '30') {
                if(isBRBoletoBancario) {
                  new_setrecord.setValue('custrecord_lmry_br_bb_status', 1);
                }
                if(library_Mail.getAuthorization(722, licenses)) {
                  if(check_hibrid == true) {
                    //Seteo del documento electrónico a Latam - BR Transaction fields
                    new_setrecord.setValue('custrecord_lmry_br_doc_type', currentRCD.getValue('custbody_lmry_document_type'));
                    setear_documento_hibrido(currentRCD, id_record, id_record_key);
                  }
                }
              }
            }
            for(var i = 0; i < set_data_record.length; i++) {
              //Caso Argentina
              if(set_data_record[i].field == 'custrecord_lmry_ar_servdate_initial' || set_data_record[i].field == 'custrecord_lmry_ar_servdate_end' || set_data_record[i].field == 'custrecord_lmry_ar_due_date') {
                if(set_data_record[i].value != '' && set_data_record[i].value != null) {
                  var date_value = new Date(set_data_record[i].value);
                  new_setrecord.setValue(set_data_record[i].field, date_value);
                }
              } else {
                if(set_data_record[i].field == "custrecord_lmry_br_config_bank_ticket") {
                  if(set_data_record[i].value && isBRBoletoBancario) {
                    new_setrecord.setValue(set_data_record[i].field, set_data_record[i].value);
                  }
                } else if(set_data_record[i].value != '' && set_data_record[i].value != null) {
                  //Brasil
                  if(id_country == 30) {
                    if(set_data_record[i].field == "custrecord_lmry_br_payment_m_description") {
                      if(paymentMethod == 373) {
                        new_setrecord.setValue(set_data_record[i].field, set_data_record[i].value);
                      }
                    } else {
                      new_setrecord.setValue(set_data_record[i].field, set_data_record[i].value);
                    }
                  }
                  //Otros países
                  else {
                    new_setrecord.setValue(set_data_record[i].field, set_data_record[i].value);
                  }
                }
              }
            }
            var save_record = new_setrecord.save({
              ignoreMandatoryFields: true,
              disableTriggers: true,
              enableSourcing: true
            });
            //C1183
            updateConstructionFieldsBR(currentRCD);
          } else {
            log.error(LMRY_script, ' [automatic_setfieldrecord] - Configuración incorrecta: ' + id_record);
          }
        }
      } catch (err) {
        logLbry.doLog({
          tittle: '[ automatic_setfieldrecord ]',
          message: err,
          relatedScript: LMRY_script
        });
        library_Mail.sendemail(' [ automatic_setfieldrecord ] ' + err, LMRY_script);
      }
    }
    //Busqueda generica
    function automatic_search(currentRCD) {
      try {
        var licenses = [];
        var id_country = currentRCD.getValue('custbody_lmry_subsidiary_country');
        var type_transaction = currentRCD.type;
        var id_subsidiary = currentRCD.getValue('subsidiary');
        var check_fact = currentRCD.getValue('custbody_lmry_processed_transaction');
        var check_hibrid = currentRCD.getValue('custbody_lmry_tax_tranf_gratu');
        if((check_fact == null || check_fact == '') && (type_transaction == 'creditmemo' || type_transaction == 'invoice' || type_transaction == 'cashsale' || type_transaction == 'customtransaction_lmry_payment_complemnt')) {
          return null;
        }
        var id_entity = '';
        if(type_transaction == 'customerpayment') {
          id_entity = currentRCD.getValue('customer');
        } else if(type_transaction == 'customtransaction_lmry_payment_complemnt') {
          id_entity = currentRCD.getValue('custpage_customer');
        } else {
          id_entity = currentRCD.getValue('entity');
        }
        //Caso brazil debe verificar si el item tiene catalogo (conocer si es de tipo servicio o inventario)
        if(id_country == 30) {
          var sublistFieldValue = currentRCD.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_lmry_br_service_catalog',
            line: 0
          });
          var rate = currentRCD.getValue('discountrate');
        }
        var filters = [
          ['isinactive', 'is', 'F']
        ];
        filters.push('AND', ['custrecord_lmry_us_country', 'anyof', id_country]);
        filters.push('AND', ['custrecord_lmry_us_subsidiary', 'anyof', id_subsidiary]);
        switch(type_transaction) {
          case 'invoice':
            filters.push('AND', ['custrecord_lmry_us_transaction', 'anyof', 7]);
            //Validación de documentos electrónicos para Credit Memo e Invoice
            if(check_fact == 1) {
              filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'F']);
            } else if(check_fact == 2) {
              filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'T']);
            }
            break;
          case 'customerpayment':
            filters.push('AND', ['custrecord_lmry_us_transaction', 'anyof', 9]);
            if(check_fact == 1) {
              filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'F']);
            } else if(check_fact == 2) {
              filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'T']);
            }
            break;
          case 'creditmemo':
            filters.push('AND', ['custrecord_lmry_us_transaction', 'anyof', 10]);
            //Validación de documentos electrónicos para Credit Memo e Invoice
            if(check_fact == 1) {
              filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'F']);
            } else if(check_fact == 2) {
              filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'T']);
            }
            break;
          case 'customtransaction_lmry_payment_complemnt':
            filters.push('AND', ['custrecord_lmry_us_transaction', 'anyof', 9]);
            if(check_fact == 1) {
              filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'F']);
            } else if(check_fact == 2) {
              filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'T']);
            }
            break;
            //10-03-2022
          case 'cashsale':
            filters.push('AND', ['custrecord_lmry_us_transaction', 'anyof', 5]);
            if(check_fact == 1) {
              filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'F']);
            } else if(check_fact == 2) {
              filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'T']);
            }
            break;
        }
        //Caso Brazil - servicio o inventario
        if(id_country == 30) {
          if(rate == -100) {
            //Bonificación
            filters.push('AND', ["custrecord_set_bonus", "is", 'T']);
          } else {
            if(check_hibrid == true) {
              //Hibrido
              filters.push('AND', ['custrecord_set_hibrid', 'is', 'T']);
            } else {
              if(sublistFieldValue != '' && sublistFieldValue != null) {
                //Servicio
                filters.push('AND', ['custrecord_set_service', 'is', 'T']);
              } else {
                //Inventario
                filters.push('AND', ['custrecord_set_inventory', 'is', 'T']);
              }
            }
          }
        }
        var data_search_subsid = search.create({
          type: 'customrecord_lmry_universal_setting_v2',
          filters: filters
        });
        if(id_entity != null && id_entity != '') {
          // Verifica si esta activo el Feature Proyectos
          var featjobs = runtime.isFeatureInEffect({
            feature: "JOBS"
          });
          if(featjobs == true) {
            var ajobs = search.lookupFields({
              type: search.Type.JOB,
              id: id_entity,
              columns: ['customer']
            });
            if(ajobs.customer) {
              id_entity = ajobs.customer[0].value;
            }
          }
          filters.push('AND', ['custrecord_lmry_us_entity', 'anyof', id_entity]);
        } else {
          return null;
        }
        var columns = new Array();
        columns[0] = search.createColumn({
          name: 'custrecord_lmry_setup_us_data'
        });
        columns[1] = search.createColumn({
          name: 'custrecord_lmry_setup_us_data_record'
        });
        columns[2] = search.createColumn({
          name: 'custrecord_lmry_setup_us_data_record_id'
        });
        var data_search = search.create({
          type: 'customrecord_lmry_universal_setting_v2',
          columns: columns,
          filters: filters
        });
        data_search = data_search.run().getRange(0, 10);
        if(data_search != '' && data_search != null) {
          return data_search;
        } else {
          licenses = library_Mail.getLicenses(id_subsidiary);
          /*C0665 - Features Automatic Set Field Subsidiary
          'MX': 975
          */
          var arrayFeatSubsid = [975,1110]; //CO D1653
          log.error("US Valid","antes de la validacion")
          if(
              (id_country == 157 && returnFeature(arrayFeatSubsid, licenses)) ||
              (id_country == 48 && returnFeature(arrayFeatSubsid, licenses))
            ) {
              log.error("US Valid","entro a la validacion")
            var setupTaxSubsidiarySearch = search.create({
              type: "customrecord_lmry_setup_tax_subsidiary",
              filters: [
                ["isinactive", "is", "F"], "AND",
                ["custrecord_lmry_setuptax_subsidiary", "anyof", id_subsidiary]
              ],
              columns: ["internalid"]
            });
            setupTaxSubsidiarySearch = setupTaxSubsidiarySearch.run().getRange(0, 1);
            var setupTaxSubsid = setupTaxSubsidiarySearch[0].getValue('internalid');
            data_search_subsid.filters.push(search.createFilter({
              name: 'custrecord_lmry_us_entity',
              operator: search.Operator.ANYOF,
              values: "@NONE@"
            }));
            data_search_subsid.filters.push(search.createFilter({
              name: 'custrecord_lmry_us_setuptax',
              operator: search.Operator.ANYOF,
              values: setupTaxSubsid
            }));
            data_search_subsid.columns = columns;
            data_search_subsid = data_search_subsid.run().getRange(0, 10);
            if(data_search_subsid != '' && data_search_subsid != null) {
              return data_search_subsid;
            }
          }
        }
      } catch (err) {
        logLbry.doLog({
          tittle: '[ automatic_search ]',
          message: err,
          relatedScript: LMRY_script
        });
        library_Mail.sendemail(' [ automatic_search ] ' + err, LMRY_script);
      }
    }
  
    function setear_datos_invoice(recordCreditMemo) {
      try {
        var id_country = recordCreditMemo.getValue('custbody_lmry_subsidiary_country');
        var type_transaction = recordCreditMemo.type;
        var idTrans = '';
        var cont = 0;
        /*
              11:  Argentina            (AR)
              29:  Bolivia              (BO)
              30:  Brazil               (BR)
              45:  Chile                (CL)
              48:  Colombia             (CO)
              49:  Costa Rica           (CR)
              61:  Republica Dominicana (DO)
              63:  Ecuador              (EC)
              91:  Guatemala            (GT)
              157: Mexico               (MX)
              173: Panama               (PA)
              174: Peru                 (PE)
              186: Paraguay             (PY)
           */
        //23-02-2022
        if(type_transaction != 'creditmemo' || (id_country != 157 && id_country != 29 && id_country != 48 && id_country != 91 && id_country != 173 && id_country != 174 && id_country != 49 && id_country != 45 && id_country != 63 && id_country != 11 && id_country != 30 && id_country != 186 && id_country != 61)) {
          return false;
        }
        idTrans = recordCreditMemo.getValue('createdfrom');
        if(idTrans != '' && idTrans != null) {
          var invoiceID = '';
          var type = search.lookupFields({
            type: "transaction",
            id: idTrans,
            columns: ['type', 'createdfrom', 'createdfrom.type']
          });
          if(type.type[0].value == 'CustInvc') {
            //Para CO, BO, MX y PA
            invoiceID = idTrans;
          } else if(type.type[0].value == 'RtnAuth' && type['createdfrom'][0]) {
            //Solo para CO
            var createdFrom = '';
            createdFrom = type['createdfrom.type'][0].value;
            invoiceID = type['createdfrom'][0].value;
            if(id_country != 48 || createdFrom != 'CustInvc') {
              return false;
            }
          } else {
            return false;
          }
          if(invoiceID != '') {
            var dataInvoice = search.lookupFields({
              type: 'invoice',
              id: invoiceID,
              columns: ['custbody_lmry_document_type', 'trandate', 'custbody_lmry_serie_doc_cxc', 'custbody_lmry_num_preimpreso', 'custbody_lmry_foliofiscal', 'fxamount']
            });
            var document_folio_ref = dataInvoice.custbody_lmry_foliofiscal;
            if(document_folio_ref != null && document_folio_ref != '') {
              recordCreditMemo.setValue('custbody_lmry_foliofiscal_doc_ref', document_folio_ref);
            }
            if(id_country != 157 && id_country != 29 && id_country != 48 && id_country != 91 && id_country != 173 && id_country != 174 && id_country != 49 && id_country != 45 && id_country != 63 && id_country != 11 && id_country != 61) {
              return false;
            }
            //Lógica solo para MX, BO, GT y PA
            if(dataInvoice.custbody_lmry_document_type[0] != '' && dataInvoice.custbody_lmry_document_type[0] != null) {
              var document_type_ref = dataInvoice.custbody_lmry_document_type[0].value;
              recordCreditMemo.setValue('custbody_lmry_doc_ref_type', document_type_ref);
            }
            if(dataInvoice.custbody_lmry_serie_doc_cxc[0] != '' && dataInvoice.custbody_lmry_serie_doc_cxc[0] != null) {
              var document_series_ref = dataInvoice.custbody_lmry_serie_doc_cxc[0].text;
              recordCreditMemo.setValue('custbody_lmry_doc_serie_ref', document_series_ref);
            }
            var document_date_ref = dataInvoice.trandate;
            var document_number_ref = dataInvoice.custbody_lmry_num_preimpreso;
            var document_amt_ref = dataInvoice.fxamount;
            var tranDate = format.parse({
              value: document_date_ref,
              type: format.Type.DATE
            });
            recordCreditMemo.setValue('custbody_lmry_doc_ref_date', tranDate);
            recordCreditMemo.setValue('custbody_lmry_num_doc_ref', document_number_ref);
            //Solo para el caso de Bolivia se seteará el campo Latam - Documento Monto Total Ref
            if(id_country == 29) recordCreditMemo.setValue('custbody_lmry_amt_doc_ref', document_amt_ref);
          }
        }
      } catch (err) {
        logLbry.doLog({
          tittle: '[ setear_datos_invoice ]',
          message: err,
          relatedScript: LMRY_script
        });
        library_Mail.sendemail(' [ setear_datos_invoice ] ' + err, LMRY_script);
      }
    }
  
    function set_template(currentRCD, licenses) {
      //Seteo de template configurado en el customer
      try {
        var subsi_fe = currentRCD.getValue('custbody_lmry_subsidiary_country');
        var subsidiary = currentRCD.getValue('subsidiary');
        /*Feature EI-Setup
          'AR': 220,'BO': 221,'BR': 222,'CL': 224,'CO': 223,
          'CR': 225,'EC': 226,'MX': 227,'PA': 440,'PE': 228,'UY': 229,
          'GT': 638, 'PY': 963, 'RD': 858
        };*/
        //Feature EI-Setup
        var arrayFeat1 = [220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 440, 638, 963, 858];
        if(!returnFeature(arrayFeat1, licenses)) {
          return false;
        }
        var band = suiteAppInfo.isBundleInstalled({
          bundleId: 116076
        });
        //Electronic Invoicing: 116076(ID Antiguo)436209 (ID Nuevo)
        var band2 = suiteAppInfo.isBundleInstalled({
          bundleId: 436209
        });
        if(!band && !band2) {
          return false;
        }
        var type = currentRCD.type;
        var json_trans = {
          'invoice': 7,
          'creditmemo': 10,
          'customerpayment': 9,
          'cashsale': 5
        };
        var trans_type = json_trans[type];
        if(!trans_type) {
          return false;
        }
        var doc_type = currentRCD.getValue('custbody_lmry_document_type');
        var doc_subsi = currentRCD.getValue('subsidiary');
        var entityid = currentRCD.getValue('entity');
        var entitytype = currentRCD.getValue('custbody_4601_entitytype');
        if(entitytype == 2) {
          var customerid = currentRCD.getValue('customer');
        }
        var template = currentRCD.getValue('custbody_psg_ei_template');
        var method = currentRCD.getValue('custbody_psg_ei_sending_method');
        if(!entityid && !customerid) {
          return false;
        }
        if(!entityid) {
          if(entitytype == 2) {
            entityid = customerid;
          }
        }
        var data_customer = search.lookupFields({
          type: 'entity',
          id: entityid,
          columns: ['custentity_psg_ei_entity_edoc_standard']
        });
        var ei_entity = data_customer.custentity_psg_ei_entity_edoc_standard;
        if(ei_entity && ei_entity.length && ei_entity[0] != '' && ei_entity[0] != null) {
          var package_customer_id = data_customer.custentity_psg_ei_entity_edoc_standard[0].value;
          if(doc_type != '' && doc_type != null) {
            /* Registro Personalizado LatamReady - EI Template by Document */
            var busqTempDoc = search.create({
              type: 'customrecord_lmry_ei_template_doc',
              columns: ['custrecord_lmry_ei_td_doc_type', 'custrecord_lmry_ei_td_template', 'custrecord_lmry_ei_td_sending_method', 'custrecord_lmry_ei_td_package'],
              filters: [
                ['isinactive', 'is', 'F'], 'and', ['custrecord_lmry_ei_td_subsi', 'anyof', doc_subsi], 'and', ['custrecord_lmry_ei_td_doc_type', 'equalto', doc_type], 'and', ['custrecord_lmry_ei_td_trans_type', 'anyof', trans_type]
              ]
            });
            var resultTempDoc = busqTempDoc.run().getRange(0, 30);
            if(resultTempDoc != null && resultTempDoc.length != 0) {
              var row = resultTempDoc[0].columns;
              var package_id = resultTempDoc[0].getValue(row[3]);
              if(package_customer_id == package_id) {
                var template = resultTempDoc[0].getValue(row[1]);
                var method = resultTempDoc[0].getValue(row[2]);
                try {
                  currentRCD.setValue('custbody_psg_ei_trans_edoc_standard', package_id);
                  currentRCD.setValue('custbody_psg_ei_template', template);
                  currentRCD.setValue('custbody_psg_ei_sending_method', method);
                } catch (err) {
                  log.error(LMRY_script + ' [set_template] Configuración erronea ', err);
                }
              } else {
                log.error(LMRY_script, ' - [set_template] Configuración erronea');
              }
            }
          }
        }
      } catch (err) {
        logLbry.doLog({
          tittle: '[ set_template ]',
          message: err,
          relatedScript: LMRY_script
        });
        library_Mail.sendemail(' [ set_template ] ' + err, LMRY_script);
      }
    }
  
    function set_inv_identifier(RCD) {
      //Seteo de campo de columna Invoice Identifier
      try {
        var country_m = RCD.getValue('custbody_lmry_subsidiary_country');
        var id_subsidiary = RCD.getValue('subsidiary');
        var tax_code_invid = [];
        var inv_id = [];
        var inv_id_code = [];
        //Solo para MX,CO, CR, CL, AR, UY, PE, BR, PA, EC, BO, GT y RD
        if(country_m == 157 || country_m == 48 || country_m == 49 || country_m == 45 || country_m == 231 || country_m == 11 || country_m == 174 || country_m == 30 || country_m == 173 || country_m == 63 || country_m == 29 || country_m == 91 || country_m == 61) {
          if(country_m != '' && country_m != null) {
            var filters = new Array();
            filters[0] = search.createFilter({
              name: 'isinactive',
              operator: search.Operator.IS,
              values: 'F'
            });
            filters[1] = search.createFilter({
              name: 'custrecord_lmry_taxtype_country',
              operator: search.Operator.ANYOF,
              values: country_m
            });
            var columns = new Array();
            columns[0] = search.createColumn({
              name: "custrecord_lmry_inv_id"
            });
            columns[1] = search.createColumn({
              name: "custrecord_lmry_inv_id_code"
            });
            columns[2] = search.createColumn({
              name: "custrecord_lmry_tax_code_invid"
            });
            var getmatchline = search.create({
              type: 'customrecord_lmry_taxtype_by_invoicingid',
              columns: columns,
              filters: filters
            });
            var resgetmatchline = getmatchline.run().getRange(0, 100);
            if(resgetmatchline != '' && resgetmatchline != null) {
              for(var i = 0; i < resgetmatchline.length; i++) {
                tax_code_invid.push(resgetmatchline[i].getValue('custrecord_lmry_tax_code_invid'));
                inv_id.push(resgetmatchline[i].getValue('custrecord_lmry_inv_id'));
                inv_id_code.push(resgetmatchline[i].getValue('custrecord_lmry_inv_id_code'));
              }
              var numLines = RCD.getLineCount({
                sublistId: 'item'
              });
              //Caso Mexico seteo de tax code - identifier
              if(country_m == 157) {
                var arrayEITaxes = new Array();
                arrayEITaxes = EITaxes(id_subsidiary);
                var must_have_invid;
                for(var i = 0; i < numLines; i++) {
                  var invoicing_id = RCD.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_lmry_invoicing_id',
                    line: i
                  });
                  if(invoicing_id == '' || invoicing_id == null) {
                    must_have_invid = true;
                    var item_type = RCD.getSublistValue({
                      sublistId: 'item',
                      fieldId: 'itemtype',
                      line: i
                    });
                    if(item_type == 'Group') {
                      var sublistFieldValue = RCD.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        line: i + 1
                      });
                    } else if(item_type == 'EndGroup') {
                      continue;
                    } else {
                      var item_taxcode = RCD.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        line: i,
                      });
                    }
                    var pos_taxcode = tax_code_invid.indexOf(item_taxcode);
                    if(arrayEITaxes.indexOf(item_taxcode) == -1) {
                      RCD.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_lmry_invoicing_id',
                        line: i,
                        value: inv_id[pos_taxcode]
                      });
                      RCD.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_lmry_invoicing_id_code',
                        line: i,
                        value: inv_id_code[pos_taxcode]
                      });
                    }
                  }
                }
              } else {
                //Caso Colombia
              if(country_m == 48) {
                for (var i = 0; i < numLines; i++) {

                  var invoicing_id = RCD.getSublistValue({
                      sublistId: 'item',
                      fieldId: 'custcol_lmry_invoicing_id',
                      line: i
                  });

                  // 2021.05.04 Validacion de Item Group
                  var internal_id = RCD.getSublistValue({
                      sublistId: 'item',
                      fieldId: 'item',
                      line: i
                  });

                  if(internal_id > 0) {
                      // Capturamos estos 2 datos para verificar si el item es de tipo 'Discount' y el taxrate1 es 0.0%
                    var item_type = RCD.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemtype',
                        line: i
                    });
                    var taxrate1 = RCD.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxrate1',
                        line: i
                    });

                    if (item_type !== 'Discount' && Number(taxrate1) !== 0) {
                      // Proceder con el seteo automático si no es un descuento global
                      if (invoicing_id === '' || invoicing_id === null) {
                        var sublistFieldValue;
                        if (item_type == 'Group') {
                            sublistFieldValue = RCD.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxcode',
                                line: i + 1
                            });
                        } else if (item_type == 'EndGroup') {
                            continue;
                        } else {
                            sublistFieldValue = RCD.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxcode',
                                line: i
                            });
                        }

                        var pos_taxcode = tax_code_invid.indexOf(sublistFieldValue);

                        if (pos_taxcode > -1) {
                          RCD.setSublistValue({
                              sublistId: 'item',
                              fieldId: 'custcol_lmry_invoicing_id',
                              line: i,
                              value: inv_id[pos_taxcode]
                          });
                          RCD.setSublistValue({
                              sublistId: 'item',
                              fieldId: 'custcol_lmry_invoicing_id_code',
                              line: i,
                              value: inv_id_code[pos_taxcode]
                          });
                        }
                      }
                    }
                  }
                }
              } else { 
                //EC - MEJORA DE SETEO DE IMPUESTOS: 0, 12 Y 14% [26-07-21]
                var jsonECTaxCode = {};
                var jsonECBaseAmounts = {
                  1: {
                    field: 'custbody_lmry_ec_base_rate0',
                    amount: 0
                  },
                  2: {
                    field: 'custbody_lmry_ec_base_rate12',
                    amount: 0
                  },
                  3: {
                    field: 'custbody_lmry_ec_base_rate14',
                    amount: 0
                  }
                };
                if(country_m == 63) {
                  subsiOW = runtime.isFeatureInEffect({
                    feature: "SUBSIDIARIES"
                  });
                  var baseFilters = [];
                  baseFilters[0] = search.createFilter({
                    name: 'isinactive',
                    operator: 'is',
                    values: 'F'
                  });
                  baseFilters[1] = search.createFilter({
                    name: 'custrecord_lmry_ec_taxcode_apply_to',
                    operator: 'anyof',
                    values: '2'
                  });
                  if(subsiOW) {
                    baseFilters[2] = search.createFilter({
                      name: 'custrecord_lmry_ec_taxcode_subsidiary',
                      operator: 'is',
                      values: id_subsidiary
                    });
                  }
                  var searchECBases = search.create({
                    type: 'customrecord_lmry_ec_base_amount_taxcode',
                    columns: ['custrecord_lmry_ec_taxcode', 'custrecord_lmry_ec_base_amount'],
                    filters: baseFilters
                  });
                  searchECBases = searchECBases.run().getRange(0, 1000);
                  if(searchECBases && searchECBases.length) {
                    for(var i = 0; i < searchECBases.length; i++) {
                      var baseEC = searchECBases[i].getValue('custrecord_lmry_ec_base_amount');
                      var taxcodeEC = searchECBases[i].getValue('custrecord_lmry_ec_taxcode');
                      if(!jsonECTaxCode[baseEC]) {
                        jsonECTaxCode[baseEC] = {};
                      }
                      jsonECTaxCode[baseEC][taxcodeEC] = taxcodeEC;
                    }
                  }
                }
                for(var i = 0; i < numLines; i++) {
                  //EC MEJORA DE SETEO DE IMPUESTOS: 0, 12 Y 14% [26-07-21]
                  if(country_m == 63 && Object.keys(jsonECTaxCode).length) {
                    var taxCode = RCD.getSublistValue('item', 'taxcode', i); // taxcode
                    var amount = RCD.getSublistValue('item', 'amount', i); // taxamount
                    for(var j in jsonECTaxCode) {
                      for(var k in jsonECTaxCode[j]) {
                        if(jsonECTaxCode[j][k] == taxCode) {
                          jsonECBaseAmounts[j]['amount'] += parseFloat(amount);
                        }
                      }
                    }
                  }
                  //
                  var invoicing_id = RCD.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_lmry_invoicing_id',
                    line: i
                  });
                  // 2021.05.04 Validacion de Item Group
                  var internal_id = RCD.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                  });
                  if(internal_id > 0 && (invoicing_id == '' || invoicing_id == null)) {
                    var item_type = RCD.getSublistValue({
                      sublistId: 'item',
                      fieldId: 'itemtype',
                      line: i
                    });
                    if(item_type == 'Group') {
                      var sublistFieldValue = RCD.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        line: i + 1
                      });
                    } else if(item_type == 'EndGroup') {
                      continue;
                    } else {
                      var sublistFieldValue = RCD.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        line: i
                      });
                    }
                    var pos_taxcode = tax_code_invid.indexOf(sublistFieldValue);
                    if(pos_taxcode > -1) {
                      RCD.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_lmry_invoicing_id',
                        line: i,
                        value: inv_id[pos_taxcode]
                      });
                      RCD.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_lmry_invoicing_id_code',
                        line: i,
                        value: inv_id_code[pos_taxcode]
                      });
                    }
                  }
                }
                //EC MEJORA DE SETEO DE IMPUESTOS: 0, 12 Y 14% [26-07-21]
                if(Object.keys(jsonECBaseAmounts).length) {
                  for(var i in jsonECBaseAmounts) {
                    RCD.setValue({
                      fieldId: jsonECBaseAmounts[i]['field'],
                      value: jsonECBaseAmounts[i]['amount']
                    });
                  }
                }
                //
              }
              }
            }
          }
        }
      } catch (err) {
        logLbry.doLog({
          tittle: '[ set_inv_identifier ]',
          message: err,
          relatedScript: LMRY_script
        });
        library_Mail.sendemail(' [ set_inv_identifier ] ' + err, LMRY_script);
      }
    }
  
    function search_entity(licenses) {
      //Features necesarios para que aparezca tab LatamReady- Settings en el Customer
      try {
        /*Features Automatic Set Field
          'AR': 323,'BO': 324,'BR': 325,'CL': 326,'CO': 327,'CR': 328,'EC': 329,
          'SV': 330,'GT': 331,'MX': 332,'PA': 333,'PY': 334,'PE': 335,'UY': 336,
          'RD': 853
        */
        //Feature Automatic Set Field
        var arrayFeat1 = [323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 853];
        if(!returnFeature(arrayFeat1, licenses)) {
          return false;
        }
        /*Feature EI-Setup (General Functions)
          'AR': 220,'BO': 221,'BR': 222,'CL': 224,'CO': 223,
          'CR': 225,'EC': 226,'MX': 227,'PA': 440,'PE': 228,'UY': 229,
          'GT': 638,'PY': 963,'RD': 858
        };*/
        //Feature EI-Setup (General Functions)
        var arrayFeat2 = [220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 440, 638, 963, 858];
        if(!returnFeature(arrayFeat2, licenses)) {
          return false;
        }
        return true;
      } catch (err) {
        logLbry.doLog({
          tittle: '[ search_entity ]',
          message: err,
          relatedScript: LMRY_script
        });
        library_Mail.sendemail('[search_entity] ' + err, LMRY_script);
      }
    }
  
    function EITaxes(id_subsi) {
      var array_taxes = new Array();
      //Busqueda de LatamReady - EI Taxes
      var busqTax = search.create({
        type: 'customrecord_lmry_ei_taxes',
        columns: ['custrecord_lmry_ei_tax_code'],
        filters: [
          ['isinactive', 'is', 'F'], "AND",
          ['custrecord_lmry_ei_tax_subsi', 'anyof', id_subsi]
        ]
      });
      var resultTax = busqTax.run().getRange(0, 100);
      if(resultTax != null && resultTax.length != 0) {
        for(var k = 0; k < resultTax.length; k++) {
          row = resultTax[k].columns;
          array_taxes.push(resultTax[k].getValue(row[0]));
        }
        array_taxes = eliminaDuplicados(array_taxes);
      }
      return array_taxes;
    }
    /***************************************************
     * Funcion para eliminar duplicados en un arreglo
     ***************************************************/
    function eliminaDuplicados(arr) {
      var i,
        len = arr.length,
        out = [],
        obj = {};
      for(i = 0; i < len; i++) {
        obj[arr[i]] = 0;
      }
      for(i in obj) {
        out.push(i);
      }
      return out;
    }
  
    function set_preimpreso(currentRCD, LMRY_Result, licenses, processAfterSubmit) {
      //Seteo de número preimpreso y modificación de tranid MX, CO, BR (Inventarios)
      //Se maneja a partir de features version 3.0
      try {
        var type_transaction = currentRCD.type;
        // Solo para subsidiaria con acceso - Transaction Number Invoice
        var lmry_DocNum = currentRCD.getValue('custbody_lmry_num_preimpreso');
        if(lmry_DocNum == '' || lmry_DocNum == null) {
          if((LMRY_Result[0] == 'MX' || LMRY_Result[0] == 'BR' || LMRY_Result[0] == 'CO' || LMRY_Result[0] == 'UY' || LMRY_Result[0] == 'BO' || LMRY_Result[0] == 'GT' || LMRY_Result[0] == 'PA' || LMRY_Result[0] == 'PE' || LMRY_Result[0] == 'PY' || LMRY_Result[0] == 'DO') && LMRY_Result[2]) {
            // Verifica que no este vacio el numero de serie
            var lmry_DocSer = '';
            if(type_transaction == 'customtransaction_lmry_payment_complemnt') {
              lmry_DocSer = currentRCD.getValue('custpage_serie_doc');
            } else {
              lmry_DocSer = currentRCD.getValue('custbody_lmry_serie_doc_cxc');
            }
            if(lmry_DocSer != '' && lmry_DocSer != null && lmry_DocSer != 0) {
              switch(type_transaction) {
                case 'invoice':
                  switch(LMRY_Result[0]) {
                    case 'MX':
                      if(library_Mail.getAuthorization(132, licenses) == false) {
                        return true;
                      }
                      break;
                    case 'CO':
                      if(library_Mail.getAuthorization(387, licenses) == false) {
                        return true;
                      }
                      break;
                    case 'BR':
                      if(library_Mail.getAuthorization(305, licenses) == false) {
                        return true;
                      }
                      var sublistFieldValue = currentRCD.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_lmry_br_service_catalog',
                        line: 0
                      });
                      //Si el el campo esta vacio es inventario
                      if(sublistFieldValue != '' && sublistFieldValue != null) {
                        return true;
                      }
                      break;
                    case 'UY':
                      if(library_Mail.getAuthorization(392, licenses) == false) {
                        return true;
                      }
                      break;
                    case 'BO':
                      if(library_Mail.getAuthorization(101, licenses) == false) {
                        return true;
                      }
                      break;
                    case 'GT':
                      if(library_Mail.getAuthorization(390, licenses) == false) {
                        return true;
                      }
                      break;
                      //23-02-2022
                    case 'PA':
                      if(library_Mail.getAuthorization(391, licenses) == false) {
                        return true;
                      }
                      break;
                    case 'PY':
                      if(library_Mail.getAuthorization(108, licenses) == false) {
                        return true;
                      }
                      break;
                      //01-06-2022
                    case 'DO':
                      if(library_Mail.getAuthorization(524, licenses) == false) {
                        return true;
                      }
                      break;
                  }
                  break;
                case 'creditmemo':
                  switch(LMRY_Result[0]) {
                    case 'MX':
                      if(library_Mail.getAuthorization(425, licenses) == false) {
                        return true;
                      }
                      break;
                    case 'CO':
                      if(library_Mail.getAuthorization(419, licenses) == false) {
                        return true;
                      }
                      break;
                    case 'UY':
                      if(library_Mail.getAuthorization(429, licenses) == false) {
                        return true;
                      }
                      break;
                    case 'BO':
                      if(library_Mail.getAuthorization(417, licenses) == false) {
                        return true;
                      }
                      break;
                    case 'GT':
                      if(library_Mail.getAuthorization(423, licenses) == false) {
                        return true;
                      }
                      break;
                      //23-02-2022
                    case 'PA':
                      if(library_Mail.getAuthorization(427, licenses) == false) {
                        return true;
                      }
                      break;
                    case 'BR':
                      if(library_Mail.getAuthorization(668, licenses) == false) {
                        return true;
                      }
                      break;
                    case 'PY':
                      if(library_Mail.getAuthorization(110, licenses) == false) {
                        return true;
                      }
                      break;
                      //01-06-2022
                    case 'DO':
                      if(library_Mail.getAuthorization(525, licenses) == false) {
                        return true;
                      }
                      break;
                  }
                  break;
                case 'customerpayment':
                  switch(LMRY_Result[0]) {
                    case 'MX':
                      if(library_Mail.getAuthorization(146, licenses) == false) {
                        return true;
                      }
                      break;
                    case 'UY':
                      if(library_Mail.getAuthorization(939, licenses) == false) {
                        return true;
                      }
                      break;
                  }
                  break;
                case 'cashsale':
                  //10-03-2022
                  switch(LMRY_Result[0]) {
                    case 'PE':
                      if(library_Mail.getAuthorization(849, licenses) == false) {
                        return true;
                      }
                      break;
                  }
                  break;
                case 'customtransaction_lmry_payment_complemnt':
                  switch(LMRY_Result[0]) {
                    case 'MX':
                      if(library_Mail.getAuthorization(870, licenses) == false) {
                        return true;
                      }
                      break;
                  }
                  break;
                default:
                  return true;
              }
              // Trae el ultimo numero pre-impreso
              var wtax_type = search.create({
                type: "customrecord_lmry_serie_impresion_cxc",
                filters: [
                  ["internalid", "anyof", lmry_DocSer]
                ],
                columns: [
                  search.createColumn({
                    name: "formulanumeric",
                    formula: "{custrecord_lmry_serie_numero_impres}"
                  }), "custrecord_lmry_serie_rango_fin", "custrecord_lmry_serie_num_digitos", "name"
                ]
              });
              var results = wtax_type.run().getRange(0, 1);
              if(!results || !results.length) {
                return;
              }
              var columns = wtax_type.columns;
              var nroConse = parseInt(results[0].getValue(columns[0])) + 1;
              var maxPermi = parseInt(results[0].getValue(columns[1]));
              var digitos = parseInt(results[0].getValue(columns[2]));
              var lmry_DocSerText = results[0].getValue(columns[3]);
              // Valida el numero de digitos
              if(digitos == '' || digitos == null) {
                return true;
              }
              // Crea el numero consecutivo
              if(nroConse > maxPermi) {
                // Asigna el numero pre-impreso
                if(processAfterSubmit) {
                  record.submitFields({
                    type: currentRCD.type,
                    id: currentRCD.id,
                    values: {
                      'custbody_lmry_num_preimpreso': ''
                    }
                  });
                } else {
                  currentRCD.setValue('custbody_lmry_num_preimpreso', '');
                }
              } else {
                var longNumeroConsec = parseInt((nroConse + '').length);
                var llenarCeros = '';
                for(var i = 0; i < (digitos - longNumeroConsec); i++) {
                  llenarCeros += '0';
                }
                nroConse = llenarCeros + nroConse;
                // Asigna el numero pre-impero
                if(processAfterSubmit) {
                  record.submitFields({
                    type: currentRCD.type,
                    id: currentRCD.id,
                    values: {
                      'custbody_lmry_num_preimpreso': nroConse
                    }
                  });
                  currentRCD.setValue('custbody_lmry_num_preimpreso', nroConse);
                } else {
                  currentRCD.setValue('custbody_lmry_num_preimpreso', nroConse);
                }
                // Llama a la funcion de seteo del Tranid
                actualizar_serie(currentRCD);
                switch(LMRY_Result[0]) {
                  case 'MX':
                    if(type_transaction != 'customerpayment') {
                      if(library_Mail.getAuthorization(25, licenses) == false) {
                        return true;
                      }
                    } else {
                      if(library_Mail.getAuthorization(535, licenses) == false) {
                        return true;
                      }
                    }
                    break;
                  case 'BR':
                    if(library_Mail.getAuthorization(10, licenses) == false) {
                      return true;
                    }
                    break;
                  case 'CO':
                    if(library_Mail.getAuthorization(65, licenses) == false) {
                      return true;
                    }
                    break;
                  case 'UY':
                    if(type_transaction != 'customerpayment') {
                      if(library_Mail.getAuthorization(131, licenses) == false) {
                        return true;
                      }
                    } else {
                      if(library_Mail.getAuthorization(940, licenses) == false) {
                        return true;
                      }
                    }
                    break;
                  case 'BO':
                    if(library_Mail.getAuthorization(49, licenses) == false) {
                      return true;
                    }
                    break;
                  case 'GT':
                    if(library_Mail.getAuthorization(23, licenses) == false) {
                      return true;
                    }
                    break;
                  case 'PA':
                    if(library_Mail.getAuthorization(59, licenses) == false) {
                      return true;
                    }
                    break;
                  case 'PE': //10-03-2022
                    if(library_Mail.getAuthorization(9, licenses) == false) {
                      return true;
                    }
                    break;
                  case 'PY':
                    if(library_Mail.getAuthorization(40, licenses) == false) {
                      return true;
                    }
                    break;
                    //01-06-2022
                  case 'DO':
                    if(library_Mail.getAuthorization(522, licenses) == false) {
                      return true;
                    }
                    break;
                  default:
                    return true;
                }
                //Seteo de tranid
                set_tranid(currentRCD, LMRY_Result, lmry_DocSerText, licenses, processAfterSubmit);
              }
            }
          }
        }
      } catch (err) {
        logLbry.doLog({
          tittle: '[ set_preimpreso ]',
          message: err,
          relatedScript: LMRY_script
        });
        library_Mail.sendemail('[set_preimpreso] ' + err, LMRY_script);
      }
    }
  
    function set_tranid(currentRCD, LMRY_Result, lmry_DocSerText, licenses, processAfterSubmit) {
      try {
        // Seteo de tranid con la concatenación de número prefijo de la subsidiaria, iniciales del tipo de documento, número preimpreso y serie
        var type_transaction = currentRCD.type;
        var subsidiaria = currentRCD.getValue('subsidiary');
        var lmry_DocTip = '';
        var lmry_DocSer = lmry_DocSerText;
        var lmry_DocNum = currentRCD.getValue('custbody_lmry_num_preimpreso');
        if(type_transaction == 'customtransaction_lmry_payment_complemnt') {
          lmry_DocTip = currentRCD.getValue('custpage_document_type');
        } else {
          lmry_DocTip = currentRCD.getValue('custbody_lmry_document_type');
        }
        var tranprefix = '';
        var texto = '';
        if(subsidiaria != '' && subsidiaria != null) {
          if(lmry_DocTip != '' && lmry_DocTip != null && lmry_DocSer != '' && lmry_DocSer != null && lmry_DocNum != '' && lmry_DocNum != null) {
            /* *********************************************
             * Verifica que este activo el feature Numerar
             * Transaction Number Invoice
             **********************************************/
            switch(type_transaction) {
              case 'invoice':
                tranprefix = library_Mail.suitelet_get_country(subsidiaria, 'INV', LMRY_Result[0], licenses);
                break;
              case 'creditmemo':
                tranprefix = library_Mail.suitelet_get_country(subsidiaria, 'CDM', LMRY_Result[0], licenses);
                break;
              case 'customerpayment':
                tranprefix = library_Mail.suitelet_get_country(subsidiaria, 'PAY', LMRY_Result[0], licenses);
                break;
            }
            tranprefix = tranprefix.tranprefix;
            // Iniciales del tipo de documento
            var tipini = search.lookupFields({
              type: 'customrecord_lmry_tipo_doc',
              id: lmry_DocTip,
              columns: ['custrecord_lmry_doc_initials']
            });
            tipini = tipini.custrecord_lmry_doc_initials;
            if(tipini == '' || tipini == null) {
              tipini = '';
            }
            if(tranprefix != '' && tranprefix != null) {
              texto = tranprefix + ' ' + tipini.toUpperCase() + ' ' + lmry_DocSerText + '-' + currentRCD.getValue('custbody_lmry_num_preimpreso');
            } else {
              texto = tipini.toUpperCase() + ' ' + lmry_DocSerText + '-' + currentRCD.getValue('custbody_lmry_num_preimpreso');
            }
            if(processAfterSubmit) {
              record.submitFields({
                type: currentRCD.type,
                id: currentRCD.id,
                values: {
                  'tranid': texto
                }
              });
            } else {
              currentRCD.setValue({
                fieldId: 'tranid',
                value: texto
              });
            }
          }
        }
        return true;
      } catch (err) {
        logLbry.doLog({
          tittle: '[ set_tranid ]',
          message: err,
          relatedScript: LMRY_script
        });
        library_Mail.sendemail('[set_tranid] ' + err, LMRY_script);
      }
    }
  
    function actualizar_serie(currentRCD) {
      var type_transaction = currentRCD.type;
      var Auxserie = '';
      if(type_transaction == 'customtransaction_lmry_payment_complemnt') {
        Auxserie = currentRCD.getValue('custpage_serie_doc');
      } else {
        Auxserie = currentRCD.getValue('custbody_lmry_serie_doc_cxc');
      }
      var Auxnumer = currentRCD.getValue('custbody_lmry_num_preimpreso');
      if(Auxserie != null && Auxserie != '' && Auxnumer != null && Auxnumer != '') {
        var wtax_type = search.create({
          type: "customrecord_lmry_serie_impresion_cxc",
          filters: [
            ["internalid", "anyof", Auxserie]
          ],
          columns: [
            search.createColumn({
              name: "formulanumeric",
              formula: "{custrecord_lmry_serie_numero_impres}"
            }), "custrecord_lmry_serie_rango_fin", "custrecord_lmry_serie_num_digitos", "name"
          ]
        });
        var results = wtax_type.run().getRange(0, 1);
        if(!results || !results.length) {
          return;
        }
        var columns = wtax_type.columns;
        var nroConse = parseInt(results[0].getValue(columns[0]));
        if(parseFloat(Auxnumer) > parseFloat(nroConse)) {
          var id = record.submitFields({
            type: 'customrecord_lmry_serie_impresion_cxc',
            id: Auxserie,
            values: {
              'custrecord_lmry_serie_numero_impres': parseFloat(Auxnumer)
            }
          });
        }
      }
    }
  
    function path_file(name_file) {
      //Ubica la ruta de determinado script
      try {
        var path = '';
        var busqueda_file = search.create({
          type: 'file',
          filters: ['name', 'is', name_file],
          columns: ['internalid']
        });
        busqueda_file = busqueda_file.run().getRange(0, 1);
        if(busqueda_file != '' && busqueda_file != null) {
          var id_file = busqueda_file[0].getValue('internalid');
          var file_Record = file.load({
            id: id_file
          });
          path = file_Record.path;
        }
        return path;
      } catch (err) {
        library_Mail.sendemail('[path_file] ' + err, LMRY_script);
      }
    }
  
    function tax_calculator(currentRCD) {
      //Cálculo de impuestos para BR inventarios
      try {
        var apply_wht = currentRCD.getValue('custbody_lmry_apply_wht_code');
        var id_country = currentRCD.getValue('custbody_lmry_subsidiary_country');
        var type_transaction = currentRCD.type;
        var name_file = 'LMRY_BR_EI_TAXC_LBRY_V2.0.js';
        if(id_country == 30 && type_transaction == 'invoice') {
          var sublistFieldValue = currentRCD.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_lmry_br_service_catalog',
            line: 0
          });
          if(sublistFieldValue == '' || sublistFieldValue == null) {
            if(apply_wht == true || apply_wht == 'T') {
              var path = path_file(name_file);
              require([path], function(library_Taxcal) {
                library_Taxcal.calculateTaxes(currentRCD);
              });
            }
          }
        }
      } catch (err) {
        logLbry.doLog({
          tittle: '[ tax_calculator ]',
          message: err,
          relatedScript: LMRY_script
        });
        library_Mail.sendemail('[tax_calculator] ' + err, LMRY_script);
      }
    }
  
    function checkIsBRBoletoBancario(currentRCD) {
      var subsidiary = currentRCD.getValue("subsidiary");
      var paymentMethod = currentRCD.getValue("custbody_lmry_paymentmethod");
      if(subsidiary) {
        //busqueda de setup tax subsidiary
        var searchSetupTax = search.create({
          type: "customrecord_lmry_setup_tax_subsidiary",
          filters: [
            ["isinactive", "is", "F"], "AND",
            ["custrecord_lmry_setuptax_subsidiary", "anyof", subsidiary]
          ],
          columns: ["internalid", "custrecord_lmry_setuptax_br_paymt_method"]
        });
        var results = searchSetupTax.run().getRange(0, 1);
        if(results && results.length) {
          var setupPaymentMethod = results[0].getValue("custrecord_lmry_setuptax_br_paymt_method");
          if(setupPaymentMethod && Number(setupPaymentMethod) == Number(paymentMethod)) {
            return true;
          }
        }
      }
      return false;
    }
  
    function setear_documento_hibrido(currentRCD, id_record, id_record_key) {
      var entity_id = currentRCD.getValue('entity');
      var subsidiary_id = currentRCD.getValue('subsidiary');
      var country_id = currentRCD.getValue('custbody_lmry_subsidiary_country');
      var check_fact = currentRCD.getValue('custbody_lmry_processed_transaction');
      var record_br_transaction_id = id_record;
      var record_br_transaction_key = id_record_key;
      if(country_id == 30) {
        var new_filters = [
          ["isinactive", "is", "F"]
        ];
        if(check_fact == 2) {
          new_filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'F']);
        } else if(check_fact == 1) {
          new_filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'T']);
        }
        new_filters.push('AND', ["custrecord_lmry_us_country", "anyof", country_id]);
        new_filters.push('AND', ["custrecord_lmry_us_entity", "anyof", entity_id]);
        new_filters.push('AND', ["custrecord_lmry_us_subsidiary", "anyof", subsidiary_id]);
        new_filters.push('AND', ["custrecord_lmry_us_transaction", "anyof", "7"]);
        new_filters.push('AND', ["custrecord_set_hibrid", "is", "T"]);
        var customrecord_lmry_universal_setting_v2SearchObj = search.create({
          type: "customrecord_lmry_universal_setting_v2",
          filters: new_filters,
          columns: [
            search.createColumn({
              name: "custrecord_lmry_document_type",
              label: "Latam - Legal Document Type (Set)"
            }),
            search.createColumn({
              name: "custrecord_lmry_serie_doc_cxc",
              label: "Latam - Serie CxC (Set)"
            }),
            search.createColumn({
              name: "formulanumeric",
              formula: "{custrecord_lmry_serie_doc_cxc.custrecord_lmry_serie_numero_impres}",
              label: "Formula (Numeric)"
            }),
            search.createColumn({
              name: "custrecord_set_br_comercial_document",
              label: "Latam - BR Comercial Document Number (Set)"
            }),
            search.createColumn({
              name: "custrecord_set_br_tlf_terminal",
              label: "Latam - BR Telephone Terminal Number (Set)"
            })
          ]
        });
        data_result = customrecord_lmry_universal_setting_v2SearchObj.run().getRange(0, 1);
        if(data_result) {
          var new_doc_type_id = data_result[0].getValue({
            name: 'custrecord_lmry_document_type'
          });
          var new_id_serie_doc = data_result[0].getValue({
            name: 'custrecord_lmry_serie_doc_cxc'
          });
          var new_serie_preimpreso = parseInt(data_result[0].getValue({
            name: "formulanumeric",
            formula: "{custrecord_lmry_serie_doc_cxc.custrecord_lmry_serie_numero_impres}"
          })) + 1;
          var new_comercial_document = data_result[0].getValue({
            name: 'custrecord_set_br_comercial_document'
          });
          var new_tlf_terminal = data_result[0].getValue({
            name: 'custrecord_set_br_tlf_terminal'
          });
          if(new_doc_type_id != null && new_doc_type_id != '' && new_id_serie_doc != null && new_id_serie_doc != '' && new_serie_preimpreso != null && new_serie_preimpreso != '' && new_comercial_document != null && new_comercial_document != '' && new_tlf_terminal != null && new_tlf_terminal != '') {
            var new_setrecord2 = record.create({
              type: record_br_transaction_id,
              isDynamic: true
            });
            new_setrecord2.setValue(record_br_transaction_key, currentRCD.id);
            //Seteo de los campos documento, serie y preimpreso de Brasil
            new_setrecord2.setValue('custrecord_lmry_br_doc_type', new_doc_type_id);
            new_setrecord2.setValue('custrecord_lmry_br_serie_doc_cxc', new_id_serie_doc);
            new_setrecord2.setValue('custrecord_lmry_br_num_preimpreso', String(new_serie_preimpreso));
            new_setrecord2.setValue('custrecord_lmry_br_comercial_document', new_comercial_document);
            new_setrecord2.setValue('custrecord_lmry_br_tlf_terminal', new_tlf_terminal);
            var save_record2 = new_setrecord2.save({
              ignoreMandatoryFields: true,
              disableTriggers: true,
              enableSourcing: true
            });
            //Incremento de serie preimpreso
            var aux_new_serie_preimpreso = new_serie_preimpreso;
            record.submitFields({
              type: 'customrecord_lmry_serie_impresion_cxc',
              id: new_id_serie_doc,
              values: {
                'custrecord_lmry_serie_numero_impres': parseFloat(aux_new_serie_preimpreso)
              }
            });
          }
        }
      }
    }
  
    function returnFeature(arrayFeatures, licenses) {
      for(var i = 0; i < licenses.length; i++) {
        if(arrayFeatures.indexOf(licenses[i]) > -1) {
          return true;
          break;
        }
      }
    }
    /**
     * Code: C0623-S0038
     * Summary: Validate Legal Document type in Automatic Set
     * Date: 27/07/2022
     */
    function validateDocument(currentRCD, set_data, validateFieldsAR) {
      try {
        var featSubsidiary = runtime.isFeatureInEffect({
          feature: "SUBSIDIARIES"
        });
        var filters = [];
        if(featSubsidiary == true) filters.push(search.createFilter({
          name: 'custrecord_lmry_setuptax_subsidiary',
          operator: search.Operator.ANYOF,
          values: currentRCD.getValue('subsidiary')
        }));
        var setupTaxSrch = search.create({
          type: "customrecord_lmry_setup_tax_subsidiary",
          filters: filters,
          columns: ["custrecord_lmry_setuptax_currency", "custrecord_lmry_setuptax_ar_doc_type_val", "custrecord_lmry_setuptax_ar_min_amount"]
        });
        setupTaxSrch = setupTaxSrch.run().getRange(0, 1);
        if(!setupTaxSrch || setupTaxSrch.length == 0) return null;
        var setupTaxCurrency = setupTaxSrch[0].getValue('custrecord_lmry_setuptax_currency');
        var setupTaxDocument = setupTaxSrch[0].getValue('custrecord_lmry_setuptax_ar_doc_type_val');
        var setupTaxMinAmount = setupTaxSrch[0].getValue('custrecord_lmry_setuptax_ar_min_amount');
        if(!setupTaxCurrency || !setupTaxDocument || !setupTaxMinAmount || setupTaxCurrency == '' || setupTaxDocument == '' || setupTaxMinAmount == '') return null;
        var total = currentRCD.getValue('total');
        if(setupTaxCurrency != currentRCD.getValue('currency')) {
          total = parseFloat((getExchangeRate(currentRCD, setupTaxCurrency) * total).toPrecision(10));
        }
        if(currentRCD.getValue('custbody_lmry_document_type') == setupTaxDocument && total < setupTaxMinAmount)
          for(var j = 0; j < set_data.length; j++) {
            if(validateFieldsAR.indexOf(set_data[j].field) == -1) continue;
            if((set_data[j].value == '' || set_data[j].value == null) && set_data[j].field == validateFieldsAR[0]) break;
            var fieldAR = set_data[j].field;
            fieldAR = fieldAR.replace('_validate', '');
            currentRCD.setValue(fieldAR, set_data[j].value);
          }
      } catch (error) {
        logLbry.doLog({
          tittle: '[ validateDocument ]',
          message: error,
          relatedScript: LMRY_script
        });
        library_Mail.sendemail(' [ validateDocument ] ' + error, LMRY_script);
      }
    }
  
    function getExchangeRate(recordObj, currencySetup) {
      try {
        var exchangerate = 1;
        var featureSUB = runtime.isFeatureInEffect({
          feature: "SUBSIDIARIES"
        });
        var featureMB = runtime.isFeatureInEffect({
          feature: "MULTIBOOK"
        });
        if(featureSUB && featureMB) {
          var subsidiary = recordObj.getValue('subsidiary');
          var tran_exchangerate = recordObj.getValue({
            fieldId: 'exchangerate'
          });
          var currencySubs = search.lookupFields({
            type: 'subsidiary',
            id: subsidiary,
            columns: ['currency']
          }).currency[0].value;
          var numLines = recordObj.getLineCount({
            sublistId: 'accountingbookdetail'
          });
          if(currencySetup && currencySetup != currencySubs) {
            if(numLines) {
              for(var i = 0; i < numLines; i++) {
                var currencyMB = recordObj.getSublistValue({
                  sublistId: 'accountingbookdetail',
                  fieldId: 'currency',
                  line: i
                });
                if(currencyMB == currencySetup) {
                  exchangerate = recordObj.getSublistValue({
                    sublistId: 'accountingbookdetail',
                    fieldId: 'exchangerate',
                    line: i
                  });
                  break;
                }
              }
            }
          } else {
            exchangerate = tran_exchangerate;
          }
        } else {
          exchangerate = tran_exchangerate;
        }
        return exchangerate;
      } catch (error) {
        logLbry.doLog({
          tittle: '[ getExchangeRate ]',
          message: error,
          relatedScript: LMRY_script
        });
        library_Mail.sendemail(' [ getExchangeRate ] ' + error, LMRY_script);
      }
    }

    function updateConstructionFieldsBR(currentRCD){
      var type_interface = runtime.executionContext;
      var createdFrom = currentRCD.getValue('createdfrom');

      if((["USERINTERFACE", "USEREVENT", "MAPREDUCE"].indexOf(type_interface) != -1) && createdFrom!=''){
        // Variables para asignar valores de los campos
        var construction;
        var art;

        var fieldSearch = search.create({
            type: 'customrecord_lmry_br_transaction_fields',
            filters: [
                ['isinactive', 'is', 'F'],
                'AND',
                ['custrecord_lmry_br_related_transaction', 'is', createdFrom]
            ],
            columns: ['custrecord_lmry_br_project_code', 'custrecord_lmry_br_art'] 
        });

        var searchResult = fieldSearch.run().getRange({ start: 0, end: 1 });
        if (searchResult && searchResult.length) {
          construction = searchResult[0].getValue('custrecord_lmry_br_project_code') || "";
          art = searchResult[0].getValue('custrecord_lmry_br_art') || "";
        }

        // Valida si los campos relacionados al Sale Order fueron configurados y actualiza datos.
        if (construction || art) {
          var invoiceID = currentRCD.id;
          var recordSearch = search.create({
            type: 'customrecord_lmry_br_transaction_fields',
            filters: [
                ['isinactive', 'is', 'F'],
                'AND',
                ['custrecord_lmry_br_related_transaction', 'is', invoiceID],
                'AND',
                ['custrecord_lmry_br_doc_type','anyof','@NONE@']
            ]
          });
          var recordResult = recordSearch.run().getRange({ start: 0, end: 1 });

          if (recordResult.length > 0) {
            var recordId = recordResult[0].id;
            record.submitFields({
              type: 'customrecord_lmry_br_transaction_fields', // Tipo de record
              id: recordId, // ID del registro a modificar
              values: {
                  'custrecord_lmry_br_project_code': construction, // Nuevo valor para Project Code
                  'custrecord_lmry_br_art': art // Nuevo valor para Art
              },
              options: {
                  enableSourcing: false,
                  ignoreMandatoryFields: true
              }
            });
          } else {
            var customRecord = record.create({
              type: 'customrecord_lmry_br_transaction_fields',
              isDynamic: true 
            });
            
            customRecord.setValue({
              fieldId: 'custrecord_lmry_br_related_transaction',
              value: invoiceID
            });

            customRecord.setValue({
              fieldId: 'custrecord_lmry_br_project_code',
              value: construction
            });

            customRecord.setValue({
              fieldId: 'custrecord_lmry_br_art',
              value: art
            });

            // Guardar el record
            var recordId = customRecord.save({
              enableSourcing: true,
              ignoreMandatoryFields: false
            });

          }
        } else {
          //Se detiene al no encontrar datos configurados
          log.debug('OJO','Se detuvo por no haber campos llenos')
        }
      }
    }
    return {
      set_inv_identifier: set_inv_identifier,
      automatic_setfield: automatic_setfield,
      automatic_setfieldrecord: automatic_setfieldrecord,
      auto_universal_setting: auto_universal_setting,
      setear_datos_invoice: setear_datos_invoice,
      set_template: set_template,
      search_entity: search_entity,
      set_preimpreso: set_preimpreso,
      tax_calculator: tax_calculator,
      path_file: path_file,
      automaticSetFieldDocument: automaticSetFieldDocument
    };
  });