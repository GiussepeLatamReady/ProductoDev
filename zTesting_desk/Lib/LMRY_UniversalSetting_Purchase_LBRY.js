/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_UniversalSetting_Purchase_LBRY.js		    ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Feb 24 2022  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
define(['N/search', 'N/log', 'N/runtime', 'N/record', 'N/url', 'N/https', './LMRY_libSendingEmailsLBRY_V2.0', 'N/format', 'N/file', 'N/config', 'N/suiteAppInfo', './LMRY_Log_LBRY_V2.0'],

    function (search, log, runtime, record, url, https, library_Mail, format, file, config, suiteAppInfo, logLbry) {

        var LMRY_script = 'LMRY_UniversalSetting_LBRY_Purchase';

        //VendorBill

        /* ------------------------------------------------------------------------------------------------------
         * Funcion sobre los features para Automatic Setfield
         * --------------------------------------------------------------------------------------------------- */

        function auto_universal_setting_purchase(licenses, type_event) {
            //Consulta de features necesarios para realizar Universal Setting
            try {
                var type_interface = runtime.executionContext;
                var arrayFeat2 = [];

                /*Feature EI-Setup (General Functions)
                  'BR': 222
                };*/

                //Array de Features: Feature EI-Setup (General Functions)
                var arrayFeat1 = [222];

                if (!returnFeature(arrayFeat1, licenses)) {
                    return false;
                }

                if (!type_event) {
                    //CSV
                    if (type_interface == 'CSVIMPORT') {

                        /*FEATURES AUTOMATIC SET FIELD CSV
                        'BR': 431
                        */
                        arrayFeat2 = [431];

                    } else { //NOTA: SE DEBEN CREAR FEATURES PARA AUTOMATIC COMPRAS

                        /*Features Automatic Set Field (A/P)
                          'BR': 825
                        */
                        arrayFeat2 = [825];
                    }
                }

                if (!returnFeature(arrayFeat2, licenses)) {
                    return false;
                }

                return true;

            } catch (err) {
                logLbry.doLog({ tittle: '[auto_universal_setting_purchase]', message: err, relatedScript: LMRY_script });
                library_Mail.sendemail('[auto_universal_setting_purchase] ' + err, LMRY_script);
            }
        }

        /* ------------------------------------------------------------------------------------------------------
         * Funcion para el seteo automatico - Automatic Setfield
         * --------------------------------------------------------------------------------------------------- */

        function automatic_setfield_purchase(currentRCD, interface) {
            //Seteo de campos cabecera de acuerdo a configuración Automatic Set
            try {
                //variable interface, si es true es cabecera si es false es despues de guardar
                var data_automatic_search = automatic_search(currentRCD);
                var typeTransactionError = ['creditmemo','customerpayment','vendorcredit'];
                var relatedFields = ['custbody_lmry_document_type','custbody_lmry_serie_doc_cxc','custbody_lmry_modification_reason','custbody_lmry_serie_doc_loc_cxc'];
                var type_transaction = currentRCD.type;
                
                if (data_automatic_search != '' && data_automatic_search != null) {
                    var data = data_automatic_search[0].getValue('custrecord_lmry_setup_us_data');
                    if (data != null && data != '') {
                        var set_data = JSON.parse(data_automatic_search[0].getValue('custrecord_lmry_setup_us_data'));
                        if (typeTransactionError.indexOf(type_transaction)!=-1 && interface) {
                            for (var i = 0; i < set_data.length; i++) {
                                if (set_data[i].value != '' && set_data[i].value != null) {
                                    var fieldIndex = relatedFields.indexOf(set_data[i].field);
                                    if (fieldIndex==-1) {
                                        currentRCD.setValue(set_data[i].field, set_data[i].value);
                                    }
                                    
                                }
                            }
                        } else{
                            for (var i = 0; i < set_data.length; i++) {
                                if (set_data[i].value != '' && set_data[i].value != null) {                               
                                    currentRCD.setValue(set_data[i].field, set_data[i].value);                                                                   
                                }
                            }
                        }
                        
                    } else {
                        log.error(LMRY_script, ' [ automatic_set_field_purchase ] - Configuración incorrecta ');
                    }
                }

            } catch (err) {
                logLbry.doLog({ tittle: '[automatic_set_field_purchase]', message: err, relatedScript: LMRY_script });
                library_Mail.sendemail(' [ automatic_set_field_purchase ] ' + err, LMRY_script);
            }
        }

         /* ------------------------------------------------------------------------------------------------------
         * Funcion para el seteo automatico - Automatic Setfield - After Submit (D0952)
         * --------------------------------------------------------------------------------------------------- */

        function automaticSetfieldPurchaseDocument(recordObj) {
            //Seteo de campos cabecera de acuerdo a configuración Automatic Set en la funcion afterSubmit

            try {
                //variable interface, si es true es cabecera si es false es despues de guardar
                var data_automatic_search = automatic_search(recordObj);
                var relatedFields = ['custbody_lmry_document_type', 'custbody_lmry_serie_doc_cxc', 'custbody_lmry_modification_reason', 'custbody_lmry_serie_doc_loc_cxc'];

                if (data_automatic_search != '' && data_automatic_search != null) {
                    var data = data_automatic_search[0].getValue('custrecord_lmry_setup_us_data');
                    if (data != null && data != '') {
                        var set_data = JSON.parse(data_automatic_search[0].getValue('custrecord_lmry_setup_us_data'));
                        for (var i = 0; i < set_data.length; i++) {
                            var fieldIndex = relatedFields.indexOf(set_data[i].field);
                            log.debug("field - value :", set_data[i].field + " - " + set_data[i].value);
                            log.debug("fieldIndex :", fieldIndex);
                            if (fieldIndex != -1) {
                                //recordObj.setValue(set_data[i].field, set_data[i].value);
                                log.debug("field - value :", set_data[i].field + " - " + set_data[i].value);
                                log.debug("recordObj.type :", recordObj.type);
                                if (set_data[i].value != '' && set_data[i].value != null) {
                                    var valuesObj = {};
                                    valuesObj[set_data[i].field] = set_data[i].value;
                                    record.submitFields({
                                        type: recordObj.type,
                                        id: recordObj.id,
                                        values: valuesObj,
                                        options: {
                                            disableTriggers: true
                                        }
                                    });
                                }
                            }
                            
                        }
                    } else {
                        log.error(LMRY_script, ' [ automatic_set_field_purchase ] - Configuración incorrecta ');
                    }
                }

            } catch (err) {
                logLbry.doLog({ tittle: '[automaticSetfieldPurchaseDocument]', message: err, relatedScript: LMRY_script });
                library_Mail.sendemail(' [ automaticSetfieldPurchaseDocument ] ' + err, LMRY_script);
            }
        }

        /* ------------------------------------------------------------------------------------------------------
         * Funcion para el seteo automatico - Automatic Setfield Record
         * --------------------------------------------------------------------------------------------------- */

        function automatic_setfieldrecord_purchase(currentRCD) {
            try {
                //Seteo de campos pertenecientes a record anexado Transaction Fields para BR

                var data_automatic_search = automatic_search(currentRCD);
                var id_country = currentRCD.getValue('custbody_lmry_subsidiary_country');
                var subsidiary = currentRCD.getValue('subsidiary');
                var paymentMethod = currentRCD.getValue('custbody_lmry_paymentmethod');
                var licenses = [];
                licenses = library_Mail.getLicenses(subsidiary);

                if (data_automatic_search != '' && data_automatic_search != null) {

                    var id_record = '';
                    var id_record_key = '';

                    switch (id_country) {
                        case '30':
                            id_record = 'customrecord_lmry_br_transaction_fields';
                            id_record_key = 'custrecord_lmry_br_related_transaction';
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

                        var save_record = new_setrecord.save({
                            ignoreMandatoryFields: true,
                            disableTriggers: true,
                            enableSourcing: true
                        });
                    } else {
                        log.error(LMRY_script, ' [automatic_setfieldrecord_purchase] - Configuración incorrecta: ' + id_record);
                    }

                }
            } catch (err) {
                logLbry.doLog({ tittle: '[automatic_setfieldrecord_purchase]', message: err, relatedScript: LMRY_script });
                library_Mail.sendemail(' [ automatic_setfieldrecord_purchase ] ' + err, LMRY_script);
            }
        }

        //Busqueda generica
        function automatic_search(currentRCD) {
            try {
                var id_country = currentRCD.getValue('custbody_lmry_subsidiary_country');
                var type_transaction = currentRCD.type;
                var id_subsidiary = currentRCD.getValue('subsidiary');

                var check_fact = currentRCD.getValue('custbody_lmry_processed_transaction');

                if ((check_fact == null || check_fact == '') && (type_transaction == 'vendorbill' || type_transaction == 'vendorcredit')) {
                    return null;
                }

                //Entidad Vendor
                var id_entity = currentRCD.getValue('entity');
                //Caso brazil debe verificar si el item tiene catalogo (conocer si es de tipo servicio o inventario)
                if (id_country == 30) {
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

                switch (type_transaction) {
                    case 'vendorbill':
                        filters.push('AND', ['custrecord_lmry_us_transaction', 'anyof', 17]);
                        if (check_fact == 1) {
                            filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'F']);
                        } else if (check_fact == 2) {
                            filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'T']);
                        }
                        break;
                    case 'vendorcredit':
                        filters.push('AND', ['custrecord_lmry_us_transaction', 'anyof', 20]);
                        if (check_fact == 1) {
                            filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'F']);
                        } else if (check_fact == 2) {
                            filters.push('AND', ['custrecord_lmry_document_type.custrecord_lmry_fact_electronica', 'is', 'T']);
                        }
                        break;
                }

                //Caso Brazil - servicio o inventario
                if (id_country == 30) {
                    if (rate == -100) {
                        //Bonificación
                        filters.push('AND', ["custrecord_set_bonus", "is", 'T']);
                    } else {
                        if (sublistFieldValue != '' && sublistFieldValue != null) {
                            //Servicio
                            filters.push('AND', ['custrecord_set_service', 'is', 'T']);
                        } else {
                            //Inventario
                            filters.push('AND', ['custrecord_set_inventory', 'is', 'T']);
                        }
                    }
                }

                if (id_entity != null && id_entity != '') {
                    filters.push('AND', ['custrecord_lmry_us_entity', 'anyof', id_entity]);
                }
                else {
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
                if (data_search != '' && data_search != null) {
                    return data_search;
                }

            } catch (err) {
                logLbry.doLog({ tittle: '[automatic_search_purchase]', message: err, relatedScript: LMRY_script });
                library_Mail.sendemail(' [ automatic_search_purchase ] ' + err, LMRY_script);
            }
        }

        function setear_datos_bill(recordBill) {
            try {

                var id_country = recordBill.getValue('custbody_lmry_subsidiary_country');
                var type_transaction = recordBill.type;
                var idTrans = '';
                var cont = 0;

                if (type_transaction != 'vendorcredit' || (id_country != 30)) {
                    return false;
                }

                idTrans = recordBill.getValue('createdfrom');
                if (idTrans != '' && idTrans != null) {
                    var billID = '';
                    var type = search.lookupFields({
                        type: "transaction",
                        id: idTrans,
                        columns: ['type', 'createdfrom', 'createdfrom.type']
                    });
                    if (type.type[0].value == 'VendBill') {
                        //Para BR
                        billID = idTrans;
                    } else {
                        return false;
                    }
                    if (billID != '') {
                        var dataBill = search.lookupFields({
                            type: 'vendorbill',
                            id: billID,
                            columns: ['custbody_lmry_foliofiscal']
                        });
                        var document_folio_ref = dataBill.custbody_lmry_foliofiscal;
                        if (document_folio_ref != null && document_folio_ref != '') {
                            recordBill.setValue('custbody_lmry_foliofiscal_doc_ref', document_folio_ref);
                        }
                    }
                }

            } catch (err) {
                logLbry.doLog({ tittle: '[setear_datos_bill]', message: err, relatedScript: LMRY_script });
                library_Mail.sendemail(' [ setear_datos_bill ] ' + err, LMRY_script);
            }
        }

        function set_template_purchase(currentRCD, licenses) {
            //Seteo de template configurado en el vendor

            try {
                var subsi_fe = currentRCD.getValue('custbody_lmry_subsidiary_country');
                var subsidiary = currentRCD.getValue('subsidiary');

                /*Feature EI-Setup (General Functions)
                  'BR': 222
                };*/

                //Array de Features: Feature EI-Setup (General Functions)
                var arrayFeat1 = [222];

                if (!returnFeature(arrayFeat1, licenses)) {
                    return false;
                }

                var band = suiteAppInfo.isBundleInstalled({
                    bundleId: 116076
                });

                if (!band) {
                    return false;
                }

                var type = currentRCD.type;

                var json_trans = {
                    'vendorbill': 17,
                    'vendorcredit': 20
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
                var template = currentRCD.getValue('custbody_psg_ei_template');
                var method = currentRCD.getValue('custbody_psg_ei_sending_method');
                if (!entityid && !vendorid) {
                    return false;
                }

                if (!entityid) {
                    if (entitytype == 1) {
                        entityid = vendorid
                    }
                }

                var data_vendor = search.lookupFields({
                    type: 'entity',
                    id: entityid,
                    columns: ['custentity_psg_ei_entity_edoc_standard']
                });
                var ei_entity = data_vendor.custentity_psg_ei_entity_edoc_standard;

                if (ei_entity && ei_entity.length && ei_entity[0] != '' && ei_entity[0] != null) {

                    var package_customer_id = data_vendor.custentity_psg_ei_entity_edoc_standard[0].value;

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
                                    log.error(LMRY_script + ' [set_template_purchase] Configuración erronea ', err);
                                }
                            } else {
                                log.error(LMRY_script, ' - [set_template_purchase] Configuración erronea');
                            }
                        }
                    }
                }
            } catch (err) {
                logLbry.doLog({ tittle: '[set_template_purchase]', message: err, relatedScript: LMRY_script });
                library_Mail.sendemail(' [ set_template_purchase ] ' + err, LMRY_script);
            }
        }


        function set_inv_identifier_purchase(RCD) {
            //Seteo de campo de columna Invoice Identifier

            try {

                var country_m = RCD.getValue('custbody_lmry_subsidiary_country');
                var id_subsidiary = RCD.getValue('subsidiary');
                var tax_code_invid = [];
                var inv_id = [];
                var inv_id_code = [];

                //Solo para BR
                if (country_m == 30) {

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

                                    var item_type = RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'itemtype',
                                        line: i
                                    });

                                    if (item_type == 'Group') {
                                        var sublistFieldValue = RCD.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'taxcode',
                                            line: i + 1
                                        });
                                    }
                                    else if (item_type == 'EndGroup') {
                                        continue;
                                    }
                                    else {
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
                                    RCD.setValue({
                                        fieldId: jsonECBaseAmounts[i]['field'],
                                        value: jsonECBaseAmounts[i]['amount']
                                    });
                                }
                            }
                        }
                    }
                }

            } catch (err) {
                logLbry.doLog({ tittle: '[set_inv_identifier_purchase]', message: err, relatedScript: LMRY_script });
                library_Mail.sendemail(' [ set_inv_identifier_purchase ] ' + err, LMRY_script);
            }
        }

        function search_entity_purchase(licenses) {
            //Features necesarios para que aparezca tab LatamReady- Settings en el Vendor

            try {

                /*Features Automatic Set Field (A/P)
                  'BR': 825
                */

                //Feature Automatic Set Field (A/P)
                var arrayFeat1 = [825];

                if (!returnFeature(arrayFeat1, licenses)) {
                    return false;
                }

                /*Feature EI-Setup (General Functions)
                  'BR': 222
                };*/

                //Array de Features: Feature EI-Setup (General Functions)
                var arrayFeat2 = [222];

                if (!returnFeature(arrayFeat2, licenses)) {
                    return false;
                }

                return true;

            } catch (err) {
                logLbry.doLog({ tittle: '[search_entity_purchase]', message: err, relatedScript: LMRY_script });
                library_Mail.sendemail('[search_entity_purchase] ' + err, LMRY_script);
            }
        }

        function set_preimpreso_purchase(currentRCD, LMRY_Result, licenses,isProcessAfterSubmit) {
            //Seteo de número preimpreso y modificación de tranid BR (Inventarios)
            //Se maneja a partir de features version 3.0
            try {
                var type_transaction = currentRCD.type;

                // Solo para subsidiaria con acceso - Transaction Number Invoice
                var lmry_DocNum = currentRCD.getValue('custbody_lmry_num_preimpreso');

                if (lmry_DocNum == '' || lmry_DocNum == null) {

                    if ((LMRY_Result[0] == 'BR') && LMRY_Result[2]) {
                        // Verifica que no este vacio el numero de serie
                        var lmry_DocSer = currentRCD.getValue('custbody_lmry_serie_doc_cxc');

                        if (lmry_DocSer != '' && lmry_DocSer != null) {
                            switch (type_transaction) {
                                case 'vendorbill':
                                    switch (LMRY_Result[0]) {
                                        case 'BR':
                                            if (library_Mail.getAuthorization(650, licenses) == false) {
                                                return true;
                                            }
                                            break;
                                    }
                                    break;
                                case 'vendorcredit':
                                    switch (LMRY_Result[0]) {
                                        case 'BR':
                                            if (library_Mail.getAuthorization(667, licenses) == false) {
                                                return true;
                                            }
                                            break;
                                    }
                                    break;

                                default:
                                    return true;
                                    break;
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
                                if (isProcessAfterSubmit) {
                                    record.submitFields({
                                        type: currentRCD.type,
                                        id: currentRCD.id,
                                        values: {
                                            'custbody_lmry_num_preimpreso': ''
                                        },
                                        options: {
                                            disableTriggers: true
                                        }
                                    });
                                }else{
                                    currentRCD.setValue('custbody_lmry_num_preimpreso', '');
                                }
                                
                            } else {
                                var longNumeroConsec = parseInt((nroConse + '').length);
                                var llenarCeros = '';
                                for (var i = 0; i < (digitos - longNumeroConsec); i++) {
                                    llenarCeros += '0';
                                }
                                nroConse = llenarCeros + nroConse;
                                // Asigna el numero pre-impero
                                if (isProcessAfterSubmit) {
                                    record.submitFields({
                                        type: currentRCD.type,
                                        id: currentRCD.id,
                                        values: {
                                            'custbody_lmry_num_preimpreso': nroConse
                                        },
                                        options: {
                                            disableTriggers: true
                                        }
                                    });
                                }else{
                                    currentRCD.setValue('custbody_lmry_num_preimpreso', nroConse);
                                }

                                // Llama a la funcion de seteo del Tranid
                                actualizar_serie(currentRCD);

                                switch (LMRY_Result[0]) {
                                    case 'BR':
                                        if (library_Mail.getAuthorization(10, licenses) == false) {
                                            return true;
                                        }
                                        break;
                                    default:
                                        return true;

                                        break;
                                }

                                //Seteo de tranid
                                set_tranid(currentRCD, LMRY_Result, lmry_DocSerText, licenses, isProcessAfterSubmit);

                            }
                        }
                    }
                }
            } catch (err) {
                logLbry.doLog({ tittle: '[set_preimpreso_purchase]', message: err, relatedScript: LMRY_script });
                library_Mail.sendemail('[set_preimpreso_purchase] ' + err, LMRY_script);
            }
        }

        function set_tranid(currentRCD, LMRY_Result, lmry_DocSerText, licenses, isProcessAfterSubmit) {
            try {
                // Seteo de tranid con la concatenación de número prefijo de la subsidiaria, iniciales del tipo de documento, número preimpreso y serie
                var subsidiaria = currentRCD.getValue('subsidiary');
                var lmry_DocTip = currentRCD.getValue('custbody_lmry_document_type');
                var lmry_DocSer = lmry_DocSerText;
                var lmry_DocNum = currentRCD.getValue('custbody_lmry_num_preimpreso');
                var tranprefix = '';
                var texto = '';

                if (subsidiaria != '' && subsidiaria != null) {
                    if (lmry_DocTip != '' && lmry_DocTip != null && lmry_DocSer != '' && lmry_DocSer != null && lmry_DocNum != '' && lmry_DocNum != null) {
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

                        if (isProcessAfterSubmit) {
                            log.debug("validacion 3:","Entro");
                            record.submitFields({
                                type: currentRCD.type,
                                id: currentRCD.id,
                                values: {
                                    'tranid': texto
                                }
                            });
                        }else{
                            currentRCD.setValue({
                                fieldId: 'tranid',
                                value: texto
                            });
                        }             
                    }
                }
                return true;
            } catch (err) {
                logLbry.doLog({ tittle: '[set_tranid]', message: err, relatedScript: LMRY_script });
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

        function returnFeature(arrayFeatures, licenses) {

            for (var i = 0; i < licenses.length; i++) {
                if (arrayFeatures.indexOf(licenses[i]) > -1) {
                    return true;
                    break;
                }
            }
        }

        return {
            set_inv_identifier_purchase: set_inv_identifier_purchase,
            automatic_setfield_purchase: automatic_setfield_purchase,
            automatic_setfieldrecord_purchase: automatic_setfieldrecord_purchase,
            auto_universal_setting_purchase: auto_universal_setting_purchase,
            setear_datos_bill: setear_datos_bill,
            set_template_purchase: set_template_purchase,
            search_entity_purchase: search_entity_purchase,
            set_preimpreso_purchase: set_preimpreso_purchase,
            automaticSetfieldPurchaseDocument: automaticSetfieldPurchaseDocument
        };

    });