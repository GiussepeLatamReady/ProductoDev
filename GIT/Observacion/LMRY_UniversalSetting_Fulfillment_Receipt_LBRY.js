/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_UniversalSetting_Fulfillment_Receipt_LBRY.js||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 20 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

 define(['N/search', 'N/log', 'N/runtime', 'N/record', 'N/url', 'N/https', './LMRY_libSendingEmailsLBRY_V2.0', 'N/format', 'N/file', 'N/config', 'N/suiteAppInfo', './LMRY_Log_LBRY_V2.0'],

 function (search, log, runtime, record, url, https, library_Mail, format, file, config, suiteAppInfo, logLbry) {

     var LMRY_script = 'LMRY_UniversalSetting_Fulfillment_Receipt_LBRY';

     var subsiOW = false;

     function auto_universal_setting(licenses, type_event) {
         //Consulta de features necesarios para realizar Universal Setting
         try {
             var type_interface = runtime.executionContext;
             var arrayFeat2 = [];

             /*Feature EI-Setup
               'BR': 222,'MX': 227,'PE': 228, 'CL':224, 'AR': 220
             };*/

             //Feature EI-Setup
             var arrayFeat1 = [222, 227, 228, 224, 220];

             if (!returnFeature(arrayFeat1, licenses)) {
                 return false;
             }

             if (!type_event) {
                 if (type_interface == 'CSVIMPORT') {

                     /*FEATURES AUTOMATIC SET FIELD CSV
                     'BR': 431,'MX': 436,'PE': 437, 'CL': 434, 'AR': 433
                     */
                     arrayFeat2 = [431, 436, 437, 434, 433];

                 } else {

                     /*Features Automatic Set Field
                       'BR': 325,'MX': 332,'PE': 335, 'CL': 326, 'AR': 323
                     */
                     arrayFeat2 = [325, 332, 335, 326, 323];
                 }
             }

             if (!returnFeature(arrayFeat2, licenses)) {
                 return false;
             }

             return true;

         } catch (err) {
             logLbry.doLog({ tittle: '[auto_universal_setting]', message: err, relatedScript: LMRY_script });
             library_Mail.sendemail('[auto_universal_setting] ' + err, LMRY_script);
         }
     }

     /* ------------------------------------------------------------------------------------------------------
      * Funcion para el seteo automatico - Automatic Setfield
      * --------------------------------------------------------------------------------------------------- */

     function automatic_setfield(currentRCD, interface) {
         //Seteo de campos cabecera de acuerdo a configuración Automatic Set

         try {

             //variable interface, si es true es cabecera si es false es despues de guardar
             var id_country = currentRCD.getValue('custbody_lmry_subsidiary_country');
             var check_initial_load = currentRCD.getValue('custbody_lmry_carga_inicial');
             var data_automatic_search = automatic_search(currentRCD);
             var type_transaction = currentRCD.getValue('type');
             var createfromID = currentRCD.getValue('createdfrom');
             if (createfromID != null && createfromID != '') {
                 var typeCreatefromSearch = search.lookupFields({ type: search.Type.TRANSACTION, id: createfromID, columns: ['type'] });
                 var typeCreatefrom = typeCreatefromSearch.type[0].value;
             }

             if (data_automatic_search != '' && data_automatic_search != null) {
                 var data = data_automatic_search[0].getValue('custrecord_lmry_setup_us_data');
                 if (data != null && data != '') {
                     var set_data = JSON.parse(data_automatic_search[0].getValue('custrecord_lmry_setup_us_data'));
                     if (id_country == 157) {
                         if (type_transaction == 'itemship' && typeCreatefrom == 'SalesOrd') {
                             if (check_initial_load == true) {
                                 for (var i = 0; i < set_data.length; i++) {
                                     if (set_data[i].value != '' && set_data[i].value != null) {
                                         currentRCD.setValue(set_data[i].field, set_data[i].value);
                                     }
                                 }
                             }
                         }
                         else {
                             for (var i = 0; i < set_data.length; i++) {
                                 if (set_data[i].value != '' && set_data[i].value != null) {
                                     currentRCD.setValue(set_data[i].field, set_data[i].value);
                                 }
                             }
                         }
                     }
                     else {
                         for (var i = 0; i < set_data.length; i++) {
                             if (set_data[i].value != '' && set_data[i].value != null) {
                                 currentRCD.setValue(set_data[i].field, set_data[i].value);
                             }
                         }
                     }
                 } else {
                     log.error(LMRY_script, ' [ automatic_set_field ] - Configuración incorrecta ');
                 }
             }

         } catch (err) {
             logLbry.doLog({ tittle: '[ automatic_set_field ]', message: err, relatedScript: LMRY_script });
             library_Mail.sendemail(' [ automatic_set_field ] ' + err, LMRY_script);
         }
     }

     /* ------------------------------------------------------------------------------------------------------
      * Funcion para el seteo automatico - Automatic Setfield Record
      * --------------------------------------------------------------------------------------------------- */

     function automatic_setfieldrecord(currentRCD) {
         try {
             //Seteo de campos pertenecientes a record anexado Transaction Fields para BR

             var data_automatic_search = automatic_search(currentRCD);
             var id_country = currentRCD.getValue('custbody_lmry_subsidiary_country');
             var subsidiary = currentRCD.getValue('subsidiary');
             var check_hibrid = currentRCD.getValue('custbody_lmry_tax_tranf_gratu');
             var type_transaction = currentRCD.type;
             var paymentMethod = currentRCD.getValue('custbody_lmry_paymentmethod');
             var licenses = [];
             licenses = library_Mail.getLicenses(subsidiary);
             var createfromID = currentRCD.getValue('createdfrom');
             if (createfromID != null && createfromID != '') {
              var typeCreatefromSearch = search.lookupFields({ type: search.Type.TRANSACTION, id: createfromID, columns: ['type'] });
              var typeCreatefrom = typeCreatefromSearch.type[0].value;
             }

             if (data_automatic_search != '' && data_automatic_search != null) {

                 var id_record = '';
                 var id_record_key = '';

                 switch (id_country) {
                     case '30':
                         id_record = 'customrecord_lmry_br_transaction_fields';
                         id_record_key = 'custrecord_lmry_br_related_transaction';
                         break;
                     case '11':
                         id_record = 'customrecord_lmry_ar_transaction_fields';
                         id_record_key = 'custrecord_lmry_ar_transaction_related';
                         break;
                     default:
                         return true;

                 }

                 var data_record = data_automatic_search[0].getValue('custrecord_lmry_setup_us_data_record');
                 if (data_record != null && data_record != '') {
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

                     var data_replicada = search.create({
                         type: id_record,
                         columns: columns,
                         filters: filters
                     });

                     data_replicada = data_replicada.run().getRange(0, 10);


                     if (data_replicada != '' && data_replicada != null) {
                         return true;
                     } else {
                         var new_setrecord = record.create({
                             type: id_record,
                             isDynamic: true
                         });
                         new_setrecord.setValue(id_record_key, currentRCD.id);
                     }

                     for (var i = 0; i < set_data_record.length; i++) {
                         if (set_data_record[i].value != '' && set_data_record[i].value != null) {
                             //Brasil
                             if (id_country == 30) {
                                 if (set_data_record[i].field == "custrecord_lmry_br_payment_m_description") {
                                     if (paymentMethod == 373) {
                                         new_setrecord.setValue(set_data_record[i].field, set_data_record[i].value);
                                     }
                                 }
                                 else {
                                     new_setrecord.setValue(set_data_record[i].field, set_data_record[i].value);
                                 }
                             }
                             //Otros países
                             else if (id_country == 11) {
                                if (typeCreatefrom == 'TrnfrOrd') {
                                    new_setrecord.setValue(set_data_record[i].field, set_data_record[i].value);
                                }
                                else if (typeCreatefrom == 'SalesOrd') {
                                    if (set_data_record[i].field == 'custrecord_lmry_ar_ent_dom_orig') {
                                        new_setrecord.setValue(set_data_record[i].field, set_data_record[i].value);
                                    }
                                }
                             }
                         }
                     }

                     var save_record = new_setrecord.save({
                         ignoreMandatoryFields: true,
                         disableTriggers: true,
                         enableSourcing: true
                     });
                 } else {
                     log.error(LMRY_script, ' [automatic_setfieldrecord] - Configuración incorrecta: ' + id_record);
                 }

             }
         } catch (err) {
             logLbry.doLog({ tittle: '[ automatic_setfieldrecord ]', message: err, relatedScript: LMRY_script });
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
             var createfromID = currentRCD.getValue('createdfrom');

             if (createfromID != null && createfromID != '') {
                 var typeCreatefromSearch = search.lookupFields({ type: search.Type.TRANSACTION, id: createfromID, columns: ['type'] });
                 var typeCreatefrom = typeCreatefromSearch.type[0].value;
             }

             if ((check_fact == null || check_fact == '') && (type_transaction == 'itemfulfillment' || type_transaction == 'itemreceipt')) {
                 return null;
             }
             var id_entity = '';
             if (typeCreatefrom == 'TrnfrOrd' && (type_transaction == 'itemfulfillment' || type_transaction == 'itemreceipt') && (id_country == 30 || id_country == 45)) {
                 id_entity = returnEntidadTransferOrder(currentRCD);
             }
             else {
                 id_entity = currentRCD.getValue('entity');
             }
             log.debug('id_entity', id_entity);
             //Caso brazil debe verificar si el item tiene catalogo (conocer si es de tipo servicio o inventario)
             if (id_country == 30) {
                 var sublistFieldValue = currentRCD.getSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_lmry_br_service_catalog',
                     line: 0
                 });
             }

             var filters = [
                 ['isinactive', 'is', 'F']
             ];

             filters.push('AND', ['custrecord_lmry_us_country', 'anyof', id_country]);
             filters.push('AND', ['custrecord_lmry_us_subsidiary', 'anyof', id_subsidiary]);

             switch (type_transaction) {
                 case 'itemfulfillment':
                     filters.push('AND', ['custrecord_lmry_us_transaction', 'anyof', 32]);
                     if (check_fact == 1) {
                         filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'F']);
                     } else if (check_fact == 2) {
                         filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'T']);
                     }
                     break;
                 //15-12-2021
                 case 'itemreceipt':
                     filters.push('AND', ['custrecord_lmry_us_transaction', 'anyof', 16]);
                     if (check_fact == 1) {
                         filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'F']);
                     } else if (check_fact == 2) {
                         filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'T']);
                     }
                     break;
                 default:
                     return true;
             }

             //Caso Brazil - Servicio / Inventario
             if (id_country == 30) {
                 if (sublistFieldValue != '' && sublistFieldValue != null) {
                     //Servicio
                     filters.push('AND', ['custrecord_set_service', 'is', 'T']);
                 } else {
                     //Inventario
                     filters.push('AND', ['custrecord_set_inventory', 'is', 'T']);
                 }
             }
             var data_search_subsid = search.create({
                 type: 'customrecord_lmry_universal_setting_v2',
                 filters: filters
             });

             if (typeCreatefrom == 'TrnfrOrd' && id_country == 11) {
                var setupTaxSubsidiarySearch = search.create({
                    type: "customrecord_lmry_setup_tax_subsidiary",
                    filters:
                        [
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
                data_search_subsid.columns = columns;
                data_search_subsid = data_search_subsid.run().getRange(0, 10);
                log.debug('data_search solo Argentina', data_search_subsid);
                if (data_search_subsid != '' && data_search_subsid != null) {
                    return data_search_subsid;
                }
             } else {
                 if (id_entity != null && id_entity != '') {
                     // Verifica si esta activo el Feature Proyectos
                     var featjobs = runtime.isFeatureInEffect({ feature: "JOBS" });
                     if (featjobs == true) {
                         var ajobs = search.lookupFields({ type: search.Type.JOB, id: id_entity, columns: ['customer'] });
                         if (ajobs.customer) {
                             id_entity = ajobs.customer[0].value;
                         }
                     }
    
                     filters.push('AND', ['custrecord_lmry_us_entity', 'anyof', id_entity]);
                 }
                 else {
                     return null;
                 }
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
             log.debug('data_search', data_search);
             if (data_search != '' && data_search != null) {
                 return data_search;
             } else {
                 licenses = library_Mail.getLicenses(id_subsidiary);
                 /*C0665 - Features Automatic Set Field Subsidiary
                 'MX': 975
                 */
                 var arrayFeatSubsid = [975];
                 if (id_country == 157 && returnFeature(arrayFeatSubsid, licenses)) {
                     var setupTaxSubsidiarySearch = search.create({
                         type: "customrecord_lmry_setup_tax_subsidiary",
                         filters:
                             [
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
                     log.debug('data_search', data_search_subsid);
                     if (data_search_subsid != '' && data_search_subsid != null) {
                         return data_search_subsid;
                     }
                 }
             }

         } catch (err) {
             logLbry.doLog({ tittle: '[ automatic_search ]', message: err, relatedScript: LMRY_script });
             library_Mail.sendemail(' [ automatic_search ] ' + err, LMRY_script);
         }
     }

     function set_template(currentRCD, licenses) {
         //Seteo de template configurado en el customer

         try {
             var subsi_fe = currentRCD.getValue('custbody_lmry_subsidiary_country');
             var subsidiary = currentRCD.getValue('subsidiary');

             /*Feature EI-Setup
               'BR': 222,'MX': 227,'PE': 228
             };*/

             //Feature EI-Setup
             var arrayFeat1 = [222, 227, 228];

             if (!returnFeature(arrayFeat1, licenses)) {
                 return false;
             }

             var band = suiteAppInfo.isBundleInstalled({ bundleId: 116076 });

             //Electronic Invoicing: 116076(ID Antiguo)436209 (ID Nuevo)
             var band2 = suiteAppInfo.isBundleInstalled({
                 bundleId: 436209
             });

             if (!band && !band2) {
                 return false;
             }

             var type = currentRCD.type;
             var json_trans = {
                 'itemfulfillment': 32,
                 'itemreceipt': 16
             };

             var trans_type = json_trans[type];
             if (!trans_type) {
                 return false;
             }

             var doc_type = currentRCD.getValue('custbody_lmry_document_type');
             var doc_subsi = currentRCD.getValue('subsidiary');
             var entityid = currentRCD.getValue('entity');
             var entitytype = currentRCD.getValue('custbody_4601_entitytype');
             if (entitytype == 1) {
                 var vendorid = currentRCD.getValue('vendor');
             }
             else {
                 var customerid = currentRCD.getValue('customer');
             }
             var template = currentRCD.getValue('custbody_psg_ei_template');
             var method = currentRCD.getValue('custbody_psg_ei_sending_method');
             if (!entityid && (!customerid || !vendorid)) {
                 return false;
             }

             if (!entityid) {
                 if (entitytype == 1) {
                     entityid = vendorid
                 }
                 else {
                     entityid = customerid
                 }
             }

             var data_customer = search.lookupFields({
                 type: 'entity',
                 id: entityid,
                 columns: ['custentity_psg_ei_entity_edoc_standard']
             });
             var ei_entity = data_customer.custentity_psg_ei_entity_edoc_standard;
             if (ei_entity && ei_entity.length && ei_entity[0] != '' && ei_entity[0] != null) {

                 var package_customer_id = data_customer.custentity_psg_ei_entity_edoc_standard[0].value;
                 if (doc_type != '' && doc_type != null) {

                     /* Registro Personalizado LatamReady - EI Template by Document */
                     var busqTempDoc = search.create({
                         type: 'customrecord_lmry_ei_template_doc',
                         columns: ['custrecord_lmry_ei_td_doc_type', 'custrecord_lmry_ei_td_template', 'custrecord_lmry_ei_td_sending_method', 'custrecord_lmry_ei_td_package'],
                         filters: [
                             ['isinactive', 'is', 'F'], 'and', ['custrecord_lmry_ei_td_subsi', 'anyof', doc_subsi], 'and', ['custrecord_lmry_ei_td_doc_type', 'equalto', doc_type], 'and', ['custrecord_lmry_ei_td_trans_type', 'anyof', trans_type]
                         ]
                     });
                     var resultTempDoc = busqTempDoc.run().getRange(0, 30);
                     if (resultTempDoc != null && resultTempDoc.length != 0) {
                         var row = resultTempDoc[0].columns;
                         var package_id = resultTempDoc[0].getValue(row[3]);
                         if (package_customer_id == package_id) {
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
             logLbry.doLog({ tittle: '[ set_template ]', message: err, relatedScript: LMRY_script });
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

             /*
              MX(157) = si (invoice, creditmemo, itemfull)
              CO(48)  = si (invoice, creditmemo, bill)
              CR(49)  = si (invoice, creditmemo)
              CL(45)  = si (invoice, creditmemo, itemfull, bill)
              AR(11) = si (invoice, creditmemo)
              UY(231)  = si (invoice, creditmemo)
              PE(174) = si (invoice, creditmemo. cash sales, itemfull)
              BR(30)  = no necesita
              PA(173) = si (invoice, creditmemo)
              EC(63)  = si (invoice, creditmemo, itemfull, bill)
              BO(29)  = si (invoice, creditmemo )
              GT(91)  = si (invoice, credtimemo, bill)
             */
             //Solo para MX, PE, BR
             if (country_m == 157 || country_m == 174) {

                 if (country_m != '' && country_m != null) {
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
                     if (resgetmatchline != '' && resgetmatchline != null) {
                         for (var i = 0; i < resgetmatchline.length; i++) {

                             tax_code_invid.push(resgetmatchline[i].getValue('custrecord_lmry_tax_code_invid'));
                             inv_id.push(resgetmatchline[i].getValue('custrecord_lmry_inv_id'));
                             inv_id_code.push(resgetmatchline[i].getValue('custrecord_lmry_inv_id_code'));

                         }

                         var numLines = RCD.getLineCount({
                             sublistId: 'item'
                         });

                         //Caso Mexico seteo de tax code - identifier
                         if (country_m == 157) {

                             var arrayEITaxes = new Array();
                             arrayEITaxes = EITaxes(id_subsidiary);
                             var must_have_invid;
                             for (var i = 0; i < numLines; i++) {

                                 var invoicing_id = RCD.getSublistValue({
                                     sublistId: 'item',
                                     fieldId: 'custcol_lmry_invoicing_id',
                                     line: i
                                 });

                                 if (invoicing_id == '' || invoicing_id == null) {
                                     must_have_invid = true;

                                     var item_type = RCD.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });

                                     if (item_type == 'Group') {
                                         var sublistFieldValue = RCD.getSublistValue({
                                             sublistId: 'item',
                                             fieldId: 'taxcode',
                                             line: i + 1
                                         });
                                     } else {
                                         var item_taxcode = RCD.getSublistValue({
                                             sublistId: 'item',
                                             fieldId: 'taxcode',
                                             line: i,
                                         });
                                     }

                                     var pos_taxcode = tax_code_invid.indexOf(item_taxcode);

                                     if (arrayEITaxes.indexOf(item_taxcode) == -1) {
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

                             //EC MEJORA DE SETEO DE IMPUESTOS: 0, 12 Y 14% [26-07-21]
                             var jsonECTaxCode = {};
                             var jsonECBaseAmounts = { 1: { field: 'custbody_lmry_ec_base_rate0', amount: 0 }, 2: { field: 'custbody_lmry_ec_base_rate12', amount: 0 }, 3: { field: 'custbody_lmry_ec_base_rate14', amount: 0 } };

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

                                 if (internal_id > 0 && (invoicing_id == '' || invoicing_id == null)) {

                                     var item_type = RCD.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });

                                     if (item_type == 'Group') {
                                         var sublistFieldValue = RCD.getSublistValue({
                                             sublistId: 'item',
                                             fieldId: 'taxcode',
                                             line: i + 1
                                         });
                                     } else {
                                         var sublistFieldValue = RCD.getSublistValue({
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


                             //EC MEJORA DE SETEO DE IMPUESTOS: 0, 12 Y 14% [26-07-21]
                             if (Object.keys(jsonECBaseAmounts).length) {
                                 for (var i in jsonECBaseAmounts) {
                                     RCD.setValue({ fieldId: jsonECBaseAmounts[i]['field'], value: jsonECBaseAmounts[i]['amount'] });
                                 }
                             }

                             //

                         }
                     }
                 }
             }

         } catch (err) {
             library_Mail.sendemail(' [ set_inv_identifier ] ' + err, LMRY_script);
         }
     }

     function search_entity(licenses) {
         //Features necesarios para que aparezca tab LatamReady- Settings en el Customer

         try {

             /*Features Automatic Set Field
               'AR': 323,'BO': 324,'BR': 325,'CL': 326,'CO': 327,'CR': 328,'EC': 329,
               'SV': 330,'GT': 331,'MX': 332,'PA': 333,'PY': 334,'PE': 335,'UY': 336
             */

             //Feature Automatic Set Field
             var arrayFeat1 = [323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336];

             if (!returnFeature(arrayFeat1, licenses)) {
                 return false;
             }

             /*Feature EI-Setup
               'AR': 220,'BO': 221,'BR': 222,'CL': 224,'CO': 223,
               'CR': 225,'EC': 226,'MX': 227,'PA': 440,'PE': 228,'UY': 229,
               'GT': 638
             };*/

             //Feature EI-Setup
             var arrayFeat2 = [220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 440, 638];

             if (!returnFeature(arrayFeat2, licenses)) {
                 return false;
             }

             return true;

         } catch (err) {
             logLbry.doLog({ tittle: '[ search_entity ]', message: err, relatedScript: LMRY_script });
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
         if (resultTax != null && resultTax.length != 0) {
             for (var k = 0; k < resultTax.length; k++) {

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

         for (i = 0; i < len; i++) {
             obj[arr[i]] = 0;
         }
         for (i in obj) {
             out.push(i);
         }
         return out;
     }
     /*
        MX(157), CO(48), CR(49), CL(45), AR(231), UY(11), PE(174), BR(30), PA(173), EC(63), BO(29) ,GT(91)
     */
     function set_preimpreso(currentRCD, LMRY_Result, licenses) {
         //Seteo de número preimpreso y modificación de tranid MX, PE, BR (Inventarios)
         //Se maneja a partir de features version 3.0
         try {
             var type_transaction = currentRCD.type;

             // Solo para subsidiaria con acceso - Transaction Number Invoice
             var lmry_DocNum = currentRCD.getValue('custbody_lmry_num_preimpreso');

             if (lmry_DocNum == '' || lmry_DocNum == null) {

                 if ((LMRY_Result[0] == 'MX' || LMRY_Result[0] == 'BR' || LMRY_Result[0] == 'PE' || LMRY_Result[0] == 'CL') && LMRY_Result[2]) {
                     // Verifica que no este vacio el numero de serie
                     var lmry_DocSer = currentRCD.getValue('custbody_lmry_serie_doc_cxc');

                     if (lmry_DocSer != '' && lmry_DocSer != null) {
                         switch (type_transaction) {
                             case 'itemfulfillment':

                                 switch (LMRY_Result[0]) {
                                     case 'BR':
                                         if (library_Mail.getAuthorization(526, licenses) == false) {
                                             return true;
                                         }
                                         break;
                                     case 'MX':
                                         if (library_Mail.getAuthorization(426, licenses) == false) {
                                             return true;
                                         }
                                         break;
                                     case 'PE':
                                         if (library_Mail.getAuthorization(68, licenses) == false) {
                                             return true;
                                         }
                                         break;
                                     case 'CL':
                                         if (library_Mail.getAuthorization(112, licenses) == false) {
                                             return true;
                                         }
                                 }
                                 break;
                             //15-12-2021
                             case 'itemreceipt':

                                 switch (LMRY_Result[0]) {
                                     case 'BR':
                                         if (library_Mail.getAuthorization(734, licenses) == false) {
                                             return true;
                                         }
                                         break;
                                     case 'PE':
                                         if (library_Mail.getAuthorization(1106, licenses) == false) {
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
                                 }),
                                 "custrecord_lmry_serie_rango_fin", "custrecord_lmry_serie_num_digitos", "name"
                             ]
                         });
                         var results = wtax_type.run().getRange(0, 1);

                         if (!results || !results.length) {
                             return;
                         }

                         var columns = wtax_type.columns;

                         var nroConse = parseInt(results[0].getValue(columns[0])) + 1;

                         var maxPermi = parseInt(results[0].getValue(columns[1]));

                         var digitos = parseInt(results[0].getValue(columns[2]));

                         var lmry_DocSerText = results[0].getValue(columns[3]);

                         // Valida el numero de digitos
                         if (digitos == '' || digitos == null) {
                             return true;
                         }
                         // Crea el numero consecutivo
                         if (nroConse > maxPermi) {
                             // Asigna el numero pre-impreso
                             currentRCD.setValue('custbody_lmry_num_preimpreso', '');
                         } else {
                             var longNumeroConsec = parseInt((nroConse + '').length);
                             var llenarCeros = '';
                             for (var i = 0; i < (digitos - longNumeroConsec); i++) {
                                 llenarCeros += '0';
                             }
                             nroConse = llenarCeros + nroConse;
                             // Asigna el numero pre-impero
                             currentRCD.setValue('custbody_lmry_num_preimpreso', nroConse);


                             // Llama a la funcion de seteo del Tranid
                             actualizar_serie(currentRCD);

                             switch (LMRY_Result[0]) {
                                 case 'MX':
                                     if (library_Mail.getAuthorization(535, licenses) == false) {
                                         return true;
                                     }
                                     break;
                                 case 'BR':
                                     if (library_Mail.getAuthorization(10, licenses) == false) {
                                         return true;
                                     }
                                     break;
                                 case 'PE': //10-03-2022
                                     if (library_Mail.getAuthorization(9, licenses) == false) {
                                         return true;
                                     }
                                     break;
                                 case 'CL':
                                     if (library_Mail.getAuthorization(11, licenses) == false) {
                                         return true;
                                     }
                                     break;
                                 default:
                                     return true;
                             }

                             //Seteo de tranid
                             set_tranid(currentRCD, LMRY_Result, lmry_DocSerText, licenses);

                         }
                     }
                 }
             }
         } catch (err) {
             logLbry.doLog({ tittle: '[ set_preimpreso ]', message: err, relatedScript: LMRY_script });
             library_Mail.sendemail('[set_preimpreso] ' + err, LMRY_script);
         }
     }

     function set_tranid(currentRCD, LMRY_Result, lmry_DocSerText, licenses) {
         try {
             // Seteo de tranid con la concatenación de número prefijo de la subsidiaria, iniciales del tipo de documento, número preimpreso y serie
             var type_transaction = currentRCD.type;
             var subsidiaria = currentRCD.getValue('subsidiary');
             var lmry_DocTip = currentRCD.getValue('custbody_lmry_document_type');
             var lmry_DocSer = lmry_DocSerText;
             var lmry_DocNum = currentRCD.getValue('custbody_lmry_num_preimpreso');
             var tranprefix = '';
             var texto = '';

             if (subsidiaria != '' && subsidiaria != null) {
                 if (lmry_DocTip != '' && lmry_DocTip != null && lmry_DocSer != '' && lmry_DocSer != null && lmry_DocNum != '' && lmry_DocNum != null) {
                     /* *********************************************
                      * Verifica que este activo el feature Numerar
                      * Transaction Number Invoice
                      **********************************************/

                     switch (type_transaction) {
                         case 'itemfulfillment':
                             tranprefix = library_Mail.suitelet_get_country(subsidiaria, 'ISP', LMRY_Result[0], licenses);
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

                     if (tipini == '' || tipini == null) {
                         tipini = '';
                     }
                     if (tranprefix != '' && tranprefix != null) {
                         texto = tranprefix + ' ' + tipini.toUpperCase() + ' ' + lmry_DocSerText + '-' + currentRCD.getValue('custbody_lmry_num_preimpreso');
                     } else {
                         texto = tipini.toUpperCase() + ' ' + lmry_DocSerText + '-' + currentRCD.getValue('custbody_lmry_num_preimpreso');
                     }

                     currentRCD.setValue({
                         fieldId: 'tranid',
                         value: texto
                     });
                 }
             }
             return true;
         } catch (err) {
             logLbry.doLog({ tittle: '[ set_tranid ]', message: err, relatedScript: LMRY_script });
             library_Mail.sendemail('[set_tranid] ' + err, LMRY_script);
         }
     }

     function actualizar_serie(currentRCD) {

         var Auxserie = currentRCD.getValue('custbody_lmry_serie_doc_cxc');
         var Auxnumer = currentRCD.getValue('custbody_lmry_num_preimpreso');

         if (Auxserie != null && Auxserie != '' && Auxnumer != null && Auxnumer != '') {

             var wtax_type = search.create({
                 type: "customrecord_lmry_serie_impresion_cxc",
                 filters: [
                     ["internalid", "anyof", Auxserie]
                 ],
                 columns: [
                     search.createColumn({
                         name: "formulanumeric",
                         formula: "{custrecord_lmry_serie_numero_impres}"
                     })
                 ]
             });
             var results = wtax_type.run().getRange(0, 1);
             if (!results || !results.length) {
                 return;
             }

             var columns = wtax_type.columns;

             var nroConse = parseInt(results[0].getValue(columns[0]));

             if (parseFloat(Auxnumer) > parseFloat(nroConse)) {
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

             if (busqueda_file != '' && busqueda_file != null) {
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

     function returnEntidadTransferOrder(currentRCD) {
         var type_transaction = currentRCD.type;
         var id_subsidiary = currentRCD.getValue('subsidiary');
         var id_entity = 0;
         var id_country = currentRCD.getValue('custbody_lmry_subsidiary_country');
         var columns = [];

         if (id_country == 30) {
             columns[0] = search.createColumn({ name: "custrecord_lmry_entity_fulfillment" })
             columns[1] = search.createColumn({ name: "custrecord_lmry_entity_receipt" })
         } else if (id_country == 45) {
             columns[0] = search.createColumn({ name: "custrecord_lmry_cl_as_entity_fulfillment" })
         }

         var searchEntitiesTaxSubsidiary = search.create({
             type: "customrecord_lmry_setup_tax_subsidiary",
             filters:
                 [
                     ["isinactive", "is", "F"],
                     "AND",
                     ["custrecord_lmry_setuptax_subsidiary", "anyof", id_subsidiary]
                 ],
             columns: columns
         });
         var data_result = searchEntitiesTaxSubsidiary.run().getRange(0, 1);
         if (data_result) {
             if (type_transaction == 'itemfulfillment') {
                 if (id_country == 30) {
                     id_entity = data_result[0].getValue({ name: 'custrecord_lmry_entity_fulfillment' });
                 } else if (id_country == 45) {
                     id_entity = data_result[0].getValue({ name: 'custrecord_lmry_cl_as_entity_fulfillment' });
                 }
             }
             if (type_transaction == 'itemreceipt') {
                 id_entity = data_result[0].getValue({ name: 'custrecord_lmry_entity_receipt' });
             }
         }
         return id_entity;
     }

     function returnFeature(arrayFeatures, licenses) {

         for (var i = 0; i < licenses.length; i++) {
             if (arrayFeatures.indexOf(licenses[i]) > -1) {
                 return true;
                 break;
             }
         }
     }

     return {
         set_inv_identifier: set_inv_identifier,
         automatic_setfield: automatic_setfield,
         automatic_setfieldrecord: automatic_setfieldrecord,
         auto_universal_setting: auto_universal_setting,
         set_template: set_template,
         search_entity: search_entity,
         set_preimpreso: set_preimpreso,
         path_file: path_file
     };

 });