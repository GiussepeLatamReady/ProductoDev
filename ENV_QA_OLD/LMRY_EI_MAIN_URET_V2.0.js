/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_EI_MAIN_URET_V2.0.js                        ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 12 2019  LatamReady    Use Script 2.0           ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/***********************************************************************************************************
  24/08/2021 : RICHARD GALVEZ LOPEZ
  - Se Agrego funcionalidad a la funcion "afterSubmit", solo se ejecutara cuando la transaccion sea
    Item Fulfillment y actualmente solo funciona para Peru.
/***********************************************************************************************************/
define([
    'N/record',
    'N/config',
    'N/log',
    'N/task',
    'N/search',
    'N/runtime',
    'N/ui/serverWidget',
    'SuiteBundles/Bundle 243159/EI_Library/LMRY_EI_libSendingEmailsLBRY_V2.0',
    './EI_Library/LMRY_EI_createInvoiceByItemFul_LBRY_v2.0.js',
    './EI_Library/LMRY_NumberPreprinted_LBRY_V2.0.js',
    'SuiteBundles/Bundle 243159/EI_OWN/LMRY_BR_RPS_LBRY.js'
],

    function (
        record,
        config,
        log,
        task,
        search,
        runtime,
        ui,
        ei_library,
        itemFulFillmentLibrary,
        Library_NumberPreprinted,
        library_num_rps
    ) {

        var FEATURE_SENDCUSTOMER = '';
        var doc_country = '';
        var type_doc = '';
        var Flag_Carta_Correction = false;
        var cod_tranType = ''
        //PAGE
        var country_codes = ['AR', 'CL', 'CO', 'PE', 'MX', 'CR', 'EC', 'BR', 'UY', 'PA', 'US', 'GT', 'BO', 'DO', 'PY'];
        var arr_codDocs_EC = ['02', '05', '12', '19', '20', '41', '01', '03'];
        // STATUS BY COUNTRY
        RECORD_STATUS = 'customrecord_lmry_ei_docs_status';
        COLUMN_STATUS = ['custrecord_lmry_ei_ds_doc_status'];
        FILTER_STATUS = [];
        // SCRIPT - DEPLOY BY COUNTRY
        SCRIPT_ID = '';
        DEPLOY_ID = '';
        var issued_stat = '';
        var correc_stat = '';
        // Licencias
        var all_Licenses = []
        // General Features
        var FEAT_SUBSIDIARY = false;

        // OWN
        var id_con;
        var flag = false;
        var FEATURE_OWN = '';
        var cod_tranType = '';
        var flagColombia = false;
        var flagBrasil = false;

        function beforeLoad(scriptContext) {
            try {

                //log.error("INICIO beforeLoad", "INICIO beforeLoad");
                var type_interface = runtime.executionContext;
                var type_event = scriptContext.type;
                var currentRecord = scriptContext.newRecord;
                var form = scriptContext.form;
                var doc_subsi = currentRecord.getValue('subsidiary');
                all_Licenses = ei_library.getLicenses(doc_subsi);
                doc_country = ei_library.getCountryID(doc_subsi).code;
                //Oculta el check box para todas las transacciones que tengan habilitado el campo
                var eIAutoField = form.getField({
                    id: 'custbody_lmry_mx_ei_automatic'
                })
                if (eIAutoField) eIAutoField.updateDisplayType({ displayType: 'hidden' });
                /********************** Envio de correo Customer BI **********************************/
                if (type_event == 'view') {
                    type_doc = currentRecord.type;
                    var mail_doc_id = currentRecord.id;
                    var statusBeforeLoad = getStatusByCountry(doc_country, mail_doc_id, currentRecord);
                    sendEmailCustomer(currentRecord, form);
                }
                /*********************** MODIFICACION 08/01/2020 ************************/
                //ELIMINA EL BOTÓN EDIT
                if (type_event == 'view') {
                    removeButtonEdit(currentRecord, form, doc_subsi, all_Licenses);
                }
                /********************** FIN MODIFICACIÓN **********************************/
                // Solo para subsidiaria con acceso - Transaction Number Invoice Massive
                var ST_FEATURE = runtime.isFeatureInEffect({
                    feature: "tax_overhauling"
                });
                if (scriptContext.type == 'view' && currentRecord.type == 'invoice') {
                    if (ST_FEATURE == false || ST_FEATURE == "F") {
                        buttonNumberPreprinted(currentRecord, form);
                    }
                }

                if (scriptContext.type == scriptContext.UserEventType.DELETE) return

                // Todo este if corresponde a la lógica del Own
                if (scriptContext.type == scriptContext.UserEventType.VIEW) {
                    var currentRecord = scriptContext.newRecord;
                    var featureGenerate = runtime.getCurrentScript().getParameter({
                        name: 'custscript_block_approval_status_button'
                    });
                    type_doc = currentRecord.type;
                    log.debug('type_doc', type_doc);
                    // log.debug("currentRecord.custbody_cust_priority - currentRecord.type", currentRecord.getValue('custbody_cust_priority')+' - '+currentRecord.type);
                    if (validarSubsidiaryCountry() && (type_doc == 'invoice' || type_doc == 'creditmemo' || type_doc == 'vendorcredit' || type_doc == 'customerpayment' || type_doc == 'itemfulfillment' || type_doc == 'itemreceipt' || type_doc == 'vendorbill' || type_doc == 'cashsale' || type_doc == 'purchaseorder' || type_doc == 'customtransaction_lmry_payment_complemnt' || type_doc == 'customerdeposit' || type_doc == 'inventorytransfer' || type_doc == 'vendorpayment' )) {

                        var doc_id = currentRecord.id;
                        var idDocFiscal = currentRecord.getValue('custbody_lmry_document_type');
                        if (type_doc == 'customtransaction_lmry_payment_complemnt') {
                            idDocFiscal = currentRecord.getValue('custpage_document_type');
                        }
                        var doc_tranType = currentRecord.getValue('custbody_lmry_transaction_type_doc')
                        if (doc_tranType != '' && doc_tranType != null && doc_country == 'EC') {
                            // Busqueda en record LatamReady - Tipo Transaccion
                            var srch_tranType = search.lookupFields({
                                type: 'customrecord_lmry_transaction_type',
                                id: doc_tranType,
                                columns: ['custrecord_lmry_code_type_transaction']
                            })
                            if (srch_tranType != null && srch_tranType != '') {
                                cod_tranType = srch_tranType.custrecord_lmry_code_type_transaction
                                if (cod_tranType == '07') idDocFiscal = '513';
                            }
                        }
                        var ntype = currentRecord.getValue('ntype');

                        log.debug("currentRecord.id - currentRecord.subsidiary - idDocFiscal", doc_id+' - '+doc_subsi+' - '+idDocFiscal);
                        FEATURE_OWN = paisFeatureOwn(doc_country)

                        if (ei_library.getAuthorization(FEATURE_OWN, all_Licenses)) {
                            if (idDocFiscal != null && idDocFiscal != '' && !(type_doc == 'vendorbill' && doc_country == 'UY')) {

                                /*Busqueda : LatamReady - EI Package */
                                var objbusqPrueba = search.create({
                                    type: 'customrecord_lmry_ei_pckg',
                                    columns: ['custrecord_lmry_ei_pckg_subsi', 'custrecord_lmry_ei_pckg_doc_type',
                                        'custrecord_lmry_ei_pckg_template', 'custrecord_lmry_ei_pckg_sm', 'custrecord_lmry_ei_pckg_trans_type'
                                    ],
                                    filters: [
                                        ['custrecord_lmry_ei_pckg_subsi', 'anyof', doc_subsi],
                                        'and', ['custrecord_lmry_ei_pckg_doc_type', 'equalto', idDocFiscal],
                                        'and', ['custrecord_lmry_ei_pckg_subsi.isinactive', 'is', false],
                                        'and', ["isinactive", "is", "F"]
                                    ]
                                });
                                resultadoPrueba = objbusqPrueba.run().getRange(0, 50);
                                //AGARRA EL VALOR DE ACUERDO AL TIPO DE TRANSACCION (custrecord_lmry_ei_pckg_trans_type)
                                if (resultadoPrueba != null && resultadoPrueba.length != 0) {
                                    var k = 0;
                                    var _subsi = '';
                                    var _fiscal_doc = ''
                                    var _template = '';
                                    var _method = '';

                                    if (resultadoPrueba.length > 1) {

                                        for (var i = 0; i < resultadoPrueba.length; i++) {
                                            row = resultadoPrueba[i].columns;
                                            if (resultadoPrueba[i].getValue(row[4]) == ntype) {
                                                k = i;
                                                _subsi = resultadoPrueba[k].getValue(row[0]);
                                                _fiscal_doc = resultadoPrueba[k].getValue(row[1]);
                                                _template = resultadoPrueba[k].getValue(row[2]);
                                                _method = resultadoPrueba[k].getValue(row[3]);
                                                break;
                                            } else {
                                                _subsi = '';
                                                _fiscal_doc = '';
                                                _template = '';
                                                _method = '';
                                            }
                                        }
                                    } else {
                                        row = resultadoPrueba[0].columns;
                                        if (resultadoPrueba[0].getValue(row[4]) == ntype || doc_country != 'BR') {
                                            _subsi = resultadoPrueba[0].getValue(row[0]);
                                            _fiscal_doc = resultadoPrueba[0].getValue(row[1]);
                                            _template = resultadoPrueba[0].getValue(row[2]);
                                            _method = resultadoPrueba[0].getValue(row[3]);
                                        } else {
                                            _subsi = '';
                                            _fiscal_doc = '';
                                            _template = '';
                                            _method = '';
                                        }
                                    }
                                    subsi = _subsi;
                                    _doc_fiscal = _fiscal_doc;
                                    template = _template;
                                    send_method = _method
                                    //tipo_transac = resultadoPrueba[k].getText(row[4]);
                                    //log.debug('tipo_transac', tipo_transac);

                                    if ((template != null && template != '') && (send_method != null && send_method != '')) {

                                        /* RECORD: LatamReady - EI Connection Status*/
                                        busqeiprint = search.create({
                                            type: 'customrecord_lmry_ei_con_status',
                                            columns: ['custrecord_lmry_ei_con_rel_txn', 'custrecord_lmry_ei_con_subsidiary', 'custrecord_lmry_ei_con_doc', 'custrecord_lmry_ei_con_temp',
                                                'custrecord_lmry_ei_con_sm', 'custrecord_lmry_ei_con_status'
                                            ],
                                            filters: [
                                                ['custrecord_lmry_ei_con_rel_txn', 'anyof', doc_id]
                                            ]
                                        });
                                        resultprint = busqeiprint.run().getRange(0, 1000);

                                        var connectionprint;
                                        if (resultprint == null || resultprint.length == 0) {
                                            /*Llenado de tabla: LatamReady - EI Connection Status*/
                                            connectionprint = record.create({
                                                type: 'customrecord_lmry_ei_con_status'
                                            });
                                            connectionprint.setValue('custrecord_lmry_ei_con_rel_txn', doc_id);
                                            connectionprint.setValue('custrecord_lmry_ei_con_status', 1);
                                        } else {
                                            connectionprint = record.load({
                                                type: 'customrecord_lmry_ei_con_status',
                                                id: resultprint[0].id
                                            })
                                        }
                                        connectionprint.setValue('custrecord_lmry_ei_con_subsidiary', subsi);
                                        connectionprint.setValue('custrecord_lmry_ei_con_doc', _doc_fiscal);
                                        connectionprint.setValue('custrecord_lmry_ei_con_temp', template);
                                        connectionprint.setValue('custrecord_lmry_ei_con_sm', send_method);
                                        id_con = connectionprint.save();
                                        flag = true;
                                        //AGREGAR
                                        // id = connectionprint.save();
                                        log.debug('id_con', id_con);

                                    } else {
                                        log.debug('Setup Error', 'No se encontró en el EI Package los parámetros Template y Sending Method');
                                        return true;
                                    }

                                } else {
                                    log.debug('Setup Error', 'No se encontró un EI Package configurado para los parámetros Subsidiaria: ' + doc_subsi + ' y Tipo de Documento Fiscal: ' + idDocFiscal);
                                    return true;
                                }

                                form.clientScriptModulePath = "./LMRY_EI_MAIN_CLNT_V2.0.js"
                                if (flagColombia) {

                                    //TODO obtener feature de enable features.
                                    var hasSemaforoService = false;
                                    try {
                                        var busqEnabFeat = search.create({
                                            type: 'customrecord_lmry_co_ei_enable_features',
                                            columns: ['custrecord_lmry_co_ei_dian_status'],
                                            filters: ['custrecord_lmry_co_ei_subsi', 'anyof', subsi]
                                        });
                                        var resultEnabFet = busqEnabFeat.run().getRange(0, 1);
                                        if (resultEnabFet != null && resultEnabFet.length != 0) {
                                            row = resultEnabFet[0].columns;
                                            if (resultEnabFet[0].getValue(row[0])) hasSemaforoService = true;
                                            else hasSemaforoService = false;
                                        }
                                    }
                                    catch (e) {
                                        if (e.message.toString().indexOf('custrecord_lmry_co_ei_dian_status') != -1) {
                                            log.debug('Error en busqueda de feature para semaforo', 'No se tiene el campo dian status, no se usara feature');
                                        }
                                        else {
                                            log.error(e.valueOf().toString());
                                        }
                                    }
                                    if(hasSemaforoService){
                                        var language = runtime.getCurrentScript().getParameter({
                                            name: 'LANGUAGE'
                                        });
                                        language = language.substring(0, 2);
                                        var nameBoton = '';
                                        if (language == 'en') {
                                            nameBoton = 'DIAN Status';
                                        } else if (language == 'es') {
                                            nameBoton = 'Estado de DIAN';
                                        } else if (language == 'pt') {
                                            nameBoton = 'Status da DIAN'
                                        }
                                        form.addButton({
                                            id: 'custpage_ei_connection_dian',
                                            label: nameBoton,
                                            functionName: 'checkDianStatus(' + doc_subsi + ','+doc_id+')' //'ei_generate(' + doc_id + ', "' + type_doc + '", "' + id_con + '")'
                                        });
                                    }

                                }

                                if (doc_country == 'EC' && type_doc == 'vendorbill') {
                                    var codDoc = '';
                                    var idDocFiscal = currentRecord.getValue('custbody_lmry_document_type');
                                    if (type_doc == 'customtransaction_lmry_payment_complemnt') {
                                        idDocFiscal = currentRecord.getValue('custpage_document_type');
                                    }

                                    if (idDocFiscal != null && idDocFiscal != '') {
                                        var busqDocFiscal = search.lookupFields({
                                            type: 'customrecord_lmry_tipo_doc',
                                            id: idDocFiscal,
                                            columns: ['custrecord_lmry_codigo_doc']
                                        });
                                        codDoc = busqDocFiscal.custrecord_lmry_codigo_doc;
                                    }
                                }

                                if (flag) {
                                    if (doc_country == 'EC' && type_doc == 'vendorbill') {
                                        if (arr_codDocs_EC.indexOf(codDoc) != -1) {
                                            form.addButton({
                                                id: 'custpage_ei_generate',
                                                label: 'EI Generate',
                                                functionName: 'ei_generate(' + doc_id + ', "' + type_doc + '", "' + id_con + '","' + doc_subsi + '", "' + doc_country + '")'
                                            });
                                        }

                                    } else {
                                        form.addButton({
                                            id: 'custpage_ei_generate',
                                            label: 'EI Generate',
                                            functionName: 'ei_generate(' + doc_id + ', "' + type_doc + '", "' + id_con + '","' + doc_subsi + '", "' + doc_country + '")'
                                        });
                                    }
                                }

                                var objbusq = search.create({
                                    type: 'customrecord_lmry_ei_con_status',
                                    filters: [
                                        ['custrecord_lmry_ei_con_rel_txn', 'anyof', doc_id],
                                        'and', ['custrecord_lmry_ei_con_status', 'anyof', 2]
                                    ]
                                });
                                resultado = objbusq.run().getRange(0, 50);

                                if (resultado.length != 0) {
                                    form.addButton({
                                        id: 'custpage_ei_send',
                                        label: 'EI Sending',
                                        functionName: 'ei_sending(' + doc_id + ', "' + type_doc + '", "' + id_con + '","' + doc_subsi + '", "' + doc_country + '")'
                                    });
                                }
                            } else if (type_doc == 'vendorbill' && doc_country == 'UY') {

                                /*Busqueda : LatamReady - EI Package */
                                var objbusqPrueba = search.create({
                                    type: 'customrecord_lmry_ei_pckg',
                                    columns: ['custrecord_lmry_ei_pckg_subsi', 'custrecord_lmry_ei_pckg_doc_type',
                                        'custrecord_lmry_ei_pckg_template', 'custrecord_lmry_ei_pckg_sm', 'custrecord_lmry_ei_pckg_trans_type'
                                    ],
                                    filters: [
                                        ['custrecord_lmry_ei_pckg_subsi', 'anyof', doc_subsi],
                                        'and', ['custrecord_lmry_ei_pckg_trans_type', 'anyof', ntype],
                                        'and', ['custrecord_lmry_ei_pckg_subsi.isinactive', 'is', false],
                                        'and', ["isinactive", "is", "F"]
                                    ]
                                });
                                resultadoPrueba = objbusqPrueba.run().getRange(0, 50);
                                log.debug("Cantidad Package", resultadoPrueba.length);
                                if (resultadoPrueba != null && resultadoPrueba.length != 0) {
                                    if (resultadoPrueba.length > 1) {
                                        for (var i = 0; i < resultadoPrueba.length; i++) {
                                            row = resultadoPrueba[i].columns;
                                            if (doc_subsi == resultadoPrueba[i].getValue(row[0])) {
                                                _subsi = resultadoPrueba[i].getValue(row[0]);
                                                _fiscal_doc = resultadoPrueba[i].getValue(row[1]);
                                                _template = resultadoPrueba[i].getValue(row[2]);
                                                _method = resultadoPrueba[i].getValue(row[3]);
                                                break;
                                            } else {
                                                _subsi = "";
                                                _fiscal_doc = "";
                                                _template = "";
                                                _method = "";
                                            }

                                        }
                                    } else {
                                        row = resultadoPrueba[0].columns;
                                        _subsi = resultadoPrueba[0].getValue(row[0]);
                                        _fiscal_doc = resultadoPrueba[0].getValue(row[1]);
                                        _template = resultadoPrueba[0].getValue(row[2]);
                                        _method = resultadoPrueba[0].getValue(row[3]); // sending method
                                    }
                                    if ((_template != null && _template != '') && (_method != null && _method != '')) {

                                        /* RECORD: LatamReady - EI Connection Status*/
                                        busqeiprint = search.create({
                                            type: 'customrecord_lmry_ei_con_status',
                                            columns: ['custrecord_lmry_ei_con_rel_txn', 'custrecord_lmry_ei_con_subsidiary', 'custrecord_lmry_ei_con_doc', 'custrecord_lmry_ei_con_temp',
                                                'custrecord_lmry_ei_con_sm', 'custrecord_lmry_ei_con_status'
                                            ],
                                            filters: [
                                                ['custrecord_lmry_ei_con_rel_txn', 'anyof', doc_id]
                                            ]
                                        });
                                        resultprint = busqeiprint.run().getRange(0, 1000);

                                        var connectionprint;
                                        if (resultprint == null || resultprint.length == 0) {
                                            /*Llenado de tabla: LatamReady - EI Connection Status*/
                                            connectionprint = record.create({
                                                type: 'customrecord_lmry_ei_con_status'
                                            });
                                            connectionprint.setValue('custrecord_lmry_ei_con_rel_txn', doc_id);
                                            connectionprint.setValue('custrecord_lmry_ei_con_status', 1);
                                        } else {
                                            connectionprint = record.load({
                                                type: 'customrecord_lmry_ei_con_status',
                                                id: resultprint[0].id
                                            })
                                        }
                                        connectionprint.setValue('custrecord_lmry_ei_con_subsidiary', _subsi);
                                        connectionprint.setValue('custrecord_lmry_ei_con_doc', _fiscal_doc);
                                        connectionprint.setValue('custrecord_lmry_ei_con_temp', _template);
                                        connectionprint.setValue('custrecord_lmry_ei_con_sm', _method);
                                        id_con = connectionprint.save();
                                        flag = true;
                                        //AGREGAR
                                        // id = connectionprint.save();
                                        log.debug('id_con', id_con);
                                        form.clientScriptModulePath = "./LMRY_EI_MAIN_CLNT_V2.0.js";
                                        if (flag) {
                                            log.debug('entra flag', flag);
                                            form.addButton({
                                                id: 'custpage_ei_generate',
                                                label: 'EI Generate',
                                                functionName: 'ei_generate(' + doc_id + ', "' + type_doc + '", "' + id_con + '","' + doc_subsi + '", "' + doc_country + '")'
                                            });
                                        }

                                        var objbusq = search.create({
                                            type: 'customrecord_lmry_ei_con_status',
                                            filters: [
                                                ['custrecord_lmry_ei_con_rel_txn', 'anyof', doc_id],
                                                'and', ['custrecord_lmry_ei_con_status', 'anyof', 2]
                                            ]
                                        });
                                        resultado = objbusq.run().getRange(0, 50);

                                        if (resultado.length != 0) {
                                            form.addButton({
                                                id: 'custpage_ei_send',
                                                label: 'EI Sending',
                                                functionName: 'ei_sending(' + doc_id + ', "' + type_doc + '", "' + id_con + '","' + doc_subsi + '", "' + doc_country + '")'
                                            });
                                        }

                                    } else {
                                        log.debug('Setup Error', 'No se encontró en el EI Package los parámetros Template y Sending Method');
                                        return true;
                                    }



                                } else {
                                    log.debug('Setup Error', 'No se encontró un EI Package configurado para los parámetros Subsidiaria: ' + doc_subsi + ' y Tipo de Documento Fiscal: e-Resguardo');
                                    return true;
                                }
                            }

                            /**+++++++++++++++++++++++++++++++++++
                             * Deshabilitar el Botón EI - Sending
                             *************************************/
                            var statusCountry = ['Aprobado', 'Observado', 'EMITIDO', 'APROBADO POR SII', 'APROBADO', 'AUTORIZADO', 'Autorizado', 'ACEPTADO', 'Generado', 'Procesando', 'PROCESANDO', 'Cancelado', 'Cancelada', 'Denegada', 'No Cancelada', 'Cancelando', 'No Cancelado', 'EMILOCAL', 'ANULADO', 'Caida por Intermitencia'];
                            var statusBeforeLoad = getStatusByCountry(doc_country, doc_id, currentRecord);
                            log.debug("statusBeforeLoad", statusBeforeLoad);
                            var billappo = currentRecord.getValue('approvalstatus');
                            var codDoc = '';
                            var status_retencion = '';
                            var idDocFiscal = currentRecord.getValue('custbody_lmry_document_type');
                            if (type_doc == 'customtransaction_lmry_payment_complemnt') {
                                idDocFiscal = currentRecord.getValue('custpage_document_type');
                            }
                            if (idDocFiscal != null && idDocFiscal != '') {
                                var busqDocFiscal = search.lookupFields({
                                    type: 'customrecord_lmry_tipo_doc',
                                    id: idDocFiscal,
                                    columns: ['custrecord_lmry_codigo_doc']
                                });
                                codDoc = busqDocFiscal.custrecord_lmry_codigo_doc;
                            }
                            var serie_Retencion = currentRecord.getValue('custbody_lmry_serie_retencion');
                            var auth_retencion = currentRecord.getValue('custbody_lmry_ec_wht_authorization');
                            var wtax_retencion = currentRecord.getValue('custbody_lmry_preimpreso_retencion');
                            log.debug('cod_tranType - serie_Retencion - wtax_retencion - auth_retencion', cod_tranType + '-' + serie_Retencion + ' - ' + wtax_retencion + ' - ' + auth_retencion);
                            if (cod_tranType != null && cod_tranType != '' && serie_Retencion != null && serie_Retencion != '' && doc_country == 'EC') {
                                busqEIStatus = search.create({
                                    type: 'customrecord_lmry_ei_docs_status',
                                    columns: ['custrecord_lmry_ei_ds_doc', 'custrecord_lmry_ei_ds_doc_status', 'custrecord_lmry_ei_ds_generated_key'],
                                    filters: [
                                        ['custrecord_lmry_ei_ds_doc', 'anyof', doc_id], 'and', ['custrecord_lmry_ei_ds_generated_key', 'is', cod_tranType]
                                    ]
                                });
                                resultEIStatus = busqEIStatus.run().getRange(0, 1000);
                                if (resultEIStatus != null && resultEIStatus.length != 0) {
                                    row = resultEIStatus[0].columns;
                                    status_retencion = resultEIStatus[0].getValue(row[1]);
                                    log.debug('status_retencion', status_retencion);
                                }
                            }
                            log.debug('cod_tranType - codDoc', cod_tranType + ' - ' + codDoc);
                            if (statusCountry.indexOf(statusBeforeLoad) != -1 || (doc_country == 'EC' && type_doc == 'vendorbill' && billappo != 2 && featureGenerate)) {
                                if (doc_country == 'EC' && cod_tranType == '07' && codDoc == '03' && statusBeforeLoad == 'AUTORIZADO') {

                                    var btn_generate = form.getButton({
                                        id: 'custpage_ei_generate'
                                    });
                                    if (btn_generate != null && btn_generate != '') {
                                        btn_generate.isDisabled = true;
                                    }

                                    if ((wtax_retencion != null && wtax_retencion != '') && (auth_retencion != null && auth_retencion != '')) {
                                        var btn_send = form.getButton({
                                            id: 'custpage_ei_send'
                                        });
                                        if (btn_send != null && btn_send != '') {
                                            btn_send.isDisabled = true;
                                        }
                                        var btn_generate = form.getButton({
                                            id: 'custpage_ei_generate'
                                        });
                                        if (btn_generate != null && btn_generate != '') {
                                            btn_generate.isDisabled = true;
                                        }
                                    } else if (status_retencion == 'PROCESANDO' || status_retencion == 'Procesando') {
                                        var btn_send = form.getButton({
                                            id: 'custpage_ei_send'
                                        });
                                        if (btn_send != null && btn_send != '') {
                                            btn_send.isDisabled = true;
                                        }
                                        var btn_generate = form.getButton({
                                            id: 'custpage_ei_generate'
                                        });
                                        if (btn_generate != null && btn_generate != '') {
                                            btn_generate.isDisabled = true;
                                        }

                                    } else if (status_retencion == 'RECHAZADO' || status_retencion == '' || status_retencion == null || status_retencion == 'ERROR' || status_retencion == 'Error') {
                                        var btn_generate = form.getButton({
                                            id: 'custpage_ei_generate'
                                        });
                                        if (btn_generate != null && btn_generate != '') {
                                            btn_generate.isDisabled = false;
                                        }

                                    }
                                } else {
                                    var btn_send = form.getButton({
                                        id: 'custpage_ei_send'
                                    });
                                    if (btn_send != null && btn_send != '') {
                                        btn_send.isDisabled = true;
                                    }
                                    var btn_generate = form.getButton({
                                        id: 'custpage_ei_generate'
                                    });
                                    if (btn_generate != null && btn_generate != '') {
                                        btn_generate.isDisabled = true;
                                    }
                                }
                            }
                            var voidedFlag = currentRecord.getValue('voided');
                            if (featureGenerate && ((billappo != 2 && billappo != null) || voidedFlag == 'T')) {
                                var btn_generate = form.getButton({
                                    id: 'custpage_ei_generate'
                                });
                                if (btn_generate != null && btn_generate != '') {
                                    btn_generate.isDisabled = true;
                                }
                            }
                        }
                    }

                }

                if (type_event == scriptContext.UserEventType.VIEW && type_interface == 'USERINTERFACE') {

                    type_doc = currentRecord.type;
                    var doc_id = currentRecord.id;
                    var billappo = currentRecord.getValue('approvalstatus');
                    var featureGenerate = runtime.getCurrentScript().getParameter({
                        name: 'custscript_block_approval_status_button'
                    });
                    var codDoc = '';
                    var status_retencion = '';
                    var statusBeforeLoad = getStatusByCountry(doc_country, doc_id, currentRecord);
                    var idDocFiscal = currentRecord.getValue('custbody_lmry_document_type');
                    if (idDocFiscal != null && idDocFiscal != '') {
                        var busqDocFiscal = search.lookupFields({
                            type: 'customrecord_lmry_tipo_doc',
                            id: idDocFiscal,
                            columns: ['custrecord_lmry_codigo_doc']
                        });
                        codDoc = busqDocFiscal.custrecord_lmry_codigo_doc;
                    }
                    var doc_tranType = currentRecord.getValue('custbody_lmry_transaction_type_doc')
                    if (doc_tranType != '' && doc_tranType != null && doc_country == 'EC') {
                        // Busqueda en record LatamReady - Tipo Transaccion
                        var srch_tranType = search.lookupFields({
                            type: 'customrecord_lmry_transaction_type',
                            id: doc_tranType,
                            columns: ['custrecord_lmry_code_type_transaction']
                        })
                        if (srch_tranType != null && srch_tranType != '') {
                            cod_tranType = srch_tranType.custrecord_lmry_code_type_transaction
                        }
                    }
                    var auth_retencion = currentRecord.getValue('custbody_lmry_ec_wht_authorization');
                    var wtax_retencion = currentRecord.getValue('custbody_lmry_preimpreso_retencion');
                    // log.error('serie_Retencion - wtax_retencion - auth_retencion', serie_Retencion + ' - ' + wtax_retencion + ' - ' + auth_retencion);
                    if (doc_tranType != null && doc_tranType != '' && doc_country == 'EC') {

                        busqEIStatus = search.create({
                            type: 'customrecord_lmry_ei_docs_status',
                            columns: ['custrecord_lmry_ei_ds_doc', 'custrecord_lmry_ei_ds_doc_status', 'custrecord_lmry_ei_ds_generated_key'],
                            filters: [
                                ['custrecord_lmry_ei_ds_doc', 'anyof', doc_id], 'and', ['custrecord_lmry_ei_ds_generated_key', 'is', cod_tranType]
                            ]
                        });
                        resultEIStatus = busqEIStatus.run().getRange(0, 1000);
                        if (resultEIStatus != null && resultEIStatus.length != 0) {
                            row = resultEIStatus[0].columns;
                            status_retencion = resultEIStatus[0].getValue(row[1]);
                            // log.error('status_retencion', status_retencion);
                        }
                    }

                    if (doc_country == 'CO') {
                        try {
                            var busqEIStatus_Timestamp = search.create({
                                type: 'customrecord_lmry_ei_docs_status',
                                columns: ['custrecord_lmry_ei_ds_timestamp'],
                                filters: [
                                    ['custrecord_lmry_ei_ds_doc', 'anyof', doc_id]
                                ]
                            });
                            var resultEIStatus_Timestamp = busqEIStatus_Timestamp.run().getRange(0, 1);

                            if (resultEIStatus_Timestamp.length > 0) {
                                var timestamp = resultEIStatus_Timestamp[0].getValue('custrecord_lmry_ei_ds_timestamp')

                                if (timestamp != '' && timestamp != null) {
                                    var f_timestamp = form.addField({
                                        id: 'custpage_ei_last_status_timestamp',
                                        type: ui.FieldType.TEXT,
                                        label: 'Latam - Last Status Timestamp'
                                    });
                                    f_timestamp.defaultValue = timestamp

                                    form.insertField({
                                        field: f_timestamp,
                                        nextfield: 'memo'
                                    });
                                }
                            }

                        } catch (e) {
                            log.error('Fallo al cargar el timestamp', e)
                        }
                    }

                    if (doc_country == 'MX' && (currentRecord.type == 'invoice' || currentRecord.type == 'creditmemo')) {
                        var addenda_btn = form.addButton({
                            id: 'custpage_ei_addendas_mx',
                            label: 'Addenda Items',
                            functionName: 'Addendas_Aut(' + currentRecord.id + ',"' + currentRecord.type + '")',
                        });
                        form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                    } else if (doc_country == 'MX' && statusBeforeLoad == 'Generado' && (currentRecord.type == 'customtransaction_lmry_payment_complemnt' || currentRecord.type == 'customerpayment')) {
                        var codModificacion = "";
                        if (currentRecord.type == 'customtransaction_lmry_payment_complemnt') {
                            var vendor_tot = currentRecord.getValue("custpage_vendor_total");
                            var apply_tot = currentRecord.getValue("custpage_apply_total");
                            var searchModification = search.create({
                                type: 'customrecord_lmry_complem_paymnt_fields',
                                columns: ['custrecord_lmry_pycomp_modification_reas.custrecord_lmry_cod_modification_reason'],
                                filters: [
                                    ['custrecord_lmry_related_complmnt_paym', 'anyof', currentRecord.id]

                                ]
                            });
                            var resultModification = searchModification.run().getRange(0, 1000);
                            if (resultModification != null && resultModification.length != 0) {
                                row = resultModification[0].columns;
                                codModificacion = resultModification[0].getValue(row[0]);
                            }
                        } else {
                            var count_apply = currentRecord.getLineCount({
                                sublistId: 'apply'
                            });
                            var count_invoice = 0;
                            for (var i = 0; i < count_apply; i++) {
                                if (currentRecord.getSublistValue('apply', 'apply', i) && currentRecord.getSublistValue('apply', 'trantype', i) != 'Journal') {
                                    count_invoice++;
                                }
                            }
                            var searchModificacion = search.lookupFields({
                                type: type_doc,
                                id: currentRecord.id,
                                columns: ['custbody_lmry_modification_reason.custrecord_lmry_cod_modification_reason']
                            });
                            codModificacion = searchModificacion["custbody_lmry_modification_reason.custrecord_lmry_cod_modification_reason"];
                        }

                        if (codModificacion == '01') {
                            var cancel_btn = form.addButton({
                                id: 'custpage_ei_remove_mx',
                                label: 'Remove Transactions',
                                functionName: 'Button_Remove_Trans(' + currentRecord.id + ',"' + currentRecord.type + '","' + doc_subsi + '")'
                            });
                            form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                            if (count_invoice > 0 || vendor_tot > 0 || apply_tot > 0) {
                                cancel_btn.isDisabled = false;
                            } else {
                                cancel_btn.isDisabled = true;
                            }
                        }
                    }
                    if (doc_country == 'BR' && codDoc == 55) {
                        // If PO Import active, EI allowed from PO
                        // If PO Import inactive, EI allowed from Bill unless the PO was previously issued
                        if (currentRecord.type == 'vendorbill' || currentRecord.type == 'purchaseorder') {
                            var flagFeat = getAuthTxnVal(all_Licenses, '432');
                            var status_relRec = false;
                            if (currentRecord.type == 'vendorbill') {
                                var id_relRec = currentRecord.getSublistValue({
                                    sublistId: 'purchaseorders',
                                    fieldId: 'id',
                                    line: 0
                                });

                                if (id_relRec != null && id_relRec != '') {
                                    var recPO = record.load({
                                        type: record.Type.PURCHASE_ORDER,
                                        id: id_relRec,
                                    });
                                    getStatusByCountry(doc_country, id_relRec, recPO);
                                    if (issued_stat != '') {
                                        status_relRec = true;
                                    }
                                    // log.error("PO InternalID - PO status", id_relRec + ' - ' + status_relRec);
                                    // WATCH OUT. Se llama de nuevo para volvear a setear las variables globales en base a la transacción misma.
                                    getStatusByCountry(doc_country, doc_id, currentRecord);
                                }
                            }

                            // con status_relRec != null asumimos que el PO relacionado tiene un status y por eso el Bill no deberia mostrar botones
                            if ((currentRecord.type == 'vendorbill' && flagFeat) || (currentRecord.type == 'vendorbill' && !flagFeat && status_relRec) || (currentRecord.type == 'purchaseorder' && !flagFeat)) {
                                // log.error("PurchaseOrder and Bill conditions disables the generate and send button");
                                var btn_gene = form.getButton({
                                    id: 'custpage_generate_ei_button'
                                });
                                if (btn_gene != null && btn_gene != '') {
                                    btn_gene.isDisabled = true;
                                }
                                var btn_snd = form.getButton({
                                    id: 'custpage_send_ei_button'
                                });
                                if (btn_snd != null && btn_snd != '') {
                                    btn_snd.isDisabled = true;
                                }
                            }
                        }
                        if (currentRecord.type == 'invoice' || currentRecord.type == 'vendorbill' || currentRecord.type == 'itemfulfillment') {

                            var form = scriptContext.form;

                            if (issued_stat != 'cancelada' && correc_stat != 'corregido') {
                                var correcion_btn = form.addButton({
                                    id: 'custpage_ei_carta_correcion',
                                    label: 'Carta de Correção',
                                    functionName: 'BR_CartaCorreccion_EI(' + currentRecord.id + ', "' + currentRecord.type + '","' + doc_subsi + '")',
                                });
                                var arr_allowedStat = ['autorizado', 'no cancelada', 'no corregido'];
                                Flag_Carta_Correction = true;
                                if (ShowButton(arr_allowedStat, currentRecord)) {
                                    form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                                } else {
                                    if (correcion_btn != null && correcion_btn != '') {
                                        correcion_btn.isDisabled = true;
                                    }
                                }
                            }

                        }

                    }

                    if (scriptContext.type == scriptContext.UserEventType.VIEW) {
                        if (doc_country == 'EC' && currentRecord.type == 'vendorbill') {
                            var codDoc = '';
                            var idDocFiscal = currentRecord.getValue('custbody_lmry_document_type');
                            if (currentRecord.type == 'customtransaction_lmry_payment_complemnt') {
                                idDocFiscal = currentRecord.getValue('custpage_document_type');
                            }

                            if (idDocFiscal != null && idDocFiscal != '') {
                                var busqDocFiscal = search.lookupFields({
                                    type: 'customrecord_lmry_tipo_doc',
                                    id: idDocFiscal,
                                    columns: ['custrecord_lmry_codigo_doc']
                                });
                                codDoc = busqDocFiscal.custrecord_lmry_codigo_doc;
                            }
                        }

                        if (doc_country == 'EC' && currentRecord.type == 'vendorbill') {
                            if (arr_codDocs_EC.indexOf(codDoc) == -1) {
                                form.removeButton('custpage_generate_ei_button');
                            }

                        }
                    }

                    // log.error('codDocRET - codDoc', codDocRET + ' - ' + codDoc);
                    if ((country_codes.indexOf(doc_country) != -1) && (currentRecord.type == 'invoice' || currentRecord.type == 'creditmemo' || currentRecord.type == 'vendorcredit' || currentRecord.type == 'vendorbill' || currentRecord.type == 'purchaseorder' || currentRecord.type == 'customerpayment' || currentRecord.type == 'itemfulfillment' || currentRecord.type == 'itemreceipt' || currentRecord.type == 'cashsale' || currentRecord.type == 'salesorder' || currentRecord.type == 'customtransaction_lmry_payment_complemnt' || currentRecord.type == 'customerdeposit' || currentRecord.type == 'vendorpayment')) {
                        var statusCountry = ['Aprobado', 'Observado', 'EMITIDO', 'APROBADO POR SII', 'APROBADO', 'AUTORIZADO', 'Autorizado', 'ACEPTADO', 'Generado', 'Procesando', 'PROCESANDO', 'Cancelado', 'Cancelada', 'Denegada', 'No Cancelada', 'Cancelando', 'No Cancelado', 'EMILOCAL', 'Caida por Intermitencia', 'ANULADO'];
                        
                        var br_issuanceStatus = ['autorizado', 'procesando', 'cancelada', 'no cancelada'];
                        if ((doc_country == 'BR' && br_issuanceStatus.indexOf(issued_stat) != -1) || (statusCountry.indexOf(statusBeforeLoad) != -1) || (doc_country == 'EC' && currentRecord.type == 'vendorbill' && billappo != 2 && featureGenerate)) {
                            if (doc_country == 'EC' && cod_tranType == '07' && codDoc == '03' && statusBeforeLoad == 'AUTORIZADO') {

                                var btn_generate = form.getButton({
                                    id: 'custpage_generate_ei_button'
                                });
                                if (btn_generate != null && btn_generate != '') {
                                    btn_generate.isDisabled = true;
                                }

                                if ((wtax_retencion != null && wtax_retencion != '') && (auth_retencion != null && auth_retencion != '')) {
                                    var btn_send = form.getButton({
                                        id: 'custpage_send_ei_button'
                                    });
                                    if (btn_send != null && btn_send != '') {
                                        btn_send.isDisabled = true;
                                    }

                                    var btn_generate = form.getButton({
                                        id: 'custpage_generate_ei_button'
                                    });
                                    if (btn_generate != null && btn_generate != '') {
                                        btn_generate.isDisabled = true;
                                    }

                                } else if (status_retencion == 'PROCESANDO' || status_retencion == 'Procesando') {
                                    var btn_send = form.getButton({
                                        id: 'custpage_send_ei_button'
                                    });
                                    if (btn_send != null && btn_send != '') {
                                        btn_send.isDisabled = true;
                                    }

                                    var btn_generate = form.getButton({
                                        id: 'custpage_generate_ei_button'
                                    });
                                    if (btn_generate != null && btn_generate != '') {
                                        btn_generate.isDisabled = true;
                                    }

                                } else if (status_retencion == 'RECHAZADO' || status_retencion == '' || status_retencion == null || status_retencion == 'ERROR' || status_retencion == 'Error') {

                                    var btn_generate = form.getButton({
                                        id: 'custpage_generate_ei_button'
                                    });
                                    if (btn_generate != null && btn_generate != '') {
                                        btn_generate.isDisabled = false;
                                    }
                                }
                            } else {
                                var btn_send = form.getButton({
                                    id: 'custpage_send_ei_button'
                                });
                                if (btn_send != null && btn_send != '') {
                                    btn_send.isDisabled = true;
                                }
                                var btn_generate = form.getButton({
                                    id: 'custpage_generate_ei_button'
                                });
                                if (btn_generate != null && btn_generate != '') {
                                    btn_generate.isDisabled = true;
                                }
                            }

                            var _folio = currentRecord.getValue('custbody_lmry_foliofiscal');
                            if (
                                (statusBeforeLoad == 'PROCESANDO' || statusBeforeLoad == 'Procesando' || statusBeforeLoad == 'ACEPTADO' || statusBeforeLoad == 'Aceptado' || statusBeforeLoad == 'Cancelando' || statusBeforeLoad == 'Caida por Intermitencia' ||
                                    (doc_country == 'EC' && (status_retencion == 'PROCESANDO' || status_retencion == 'Procesando' || status_retencion == 'ACEPTADO' || status_retencion == 'Aceptado'))) ||
                                (doc_country == 'BR' && ((issued_stat == 'procesando' || correc_stat == 'procesando') || ((issued_stat == 'autorizado' || correc_stat == 'autorizado') && (!_folio || !hasPDF(doc_id))))) ||
                                (doc_country == 'CO' && statusBeforeLoad == 'AUTORIZADO' && !_folio) ||
                                (doc_country == 'CR' && (statusBeforeLoad == 'Aprobado' || statusBeforeLoad == 'Observado') && !_folio) ||
                                (doc_country == 'MX' && ((statusBeforeLoad == 'PROCESANDO' || statusBeforeLoad == 'Procesando') || ((statusBeforeLoad == 'GENERADO' || statusBeforeLoad == 'Generado') && !hasPDF(doc_id)))) ||
                                (doc_country == 'PE' && ((statusBeforeLoad == 'PROCESANDO' || statusBeforeLoad == 'ACEPTADO') || (statusBeforeLoad == 'AUTORIZADO' && !hasPDF(doc_id)))) ||
                                (doc_country == 'CL' && ((statusBeforeLoad == 'PROCESANDO' || statusBeforeLoad == 'Procesando' || statusBeforeLoad == 'ENVIADO AL SII' || statusBeforeLoad == 'RECIBIDO POR SII' || statusBeforeLoad == 'XFIRMAR' || statusBeforeLoad == 'AUTORIZADO SIN EMITIR') ||
                                    ((statusBeforeLoad == 'EMITIDO' || statusBeforeLoad == 'EMILOCAL' || statusBeforeLoad == 'APROBADO POR SII' || statusBeforeLoad == 'REPARADO POR SII') && !hasPDF(doc_id)))) ||
                                (doc_country == 'AR' && ((statusBeforeLoad == 'PROCESANDO' || statusBeforeLoad == 'Procesando') || ((statusBeforeLoad == 'Observado' || statusBeforeLoad == 'Aprobado') && !hasPDF(doc_id))))
                            ) {
                                if ((doc_country != 'BO') || (doc_country == 'BO' && statusBeforeLoad == 'PROCESANDO')) {
                                    var functionName = 'Status_EI(' + currentRecord.id + ',"' + doc_subsi + '",' + "false"

                                    // Cuarto parámetro que indica si el documento tiene el PDF lleno (Por ahora solo se valida en PE, CL, MX y AR)
                                    if ((doc_country == 'PE' || doc_country == 'CL' || doc_country == 'MX' || doc_country == 'AR' || doc_country == 'BR') && !hasPDF(doc_id)) functionName += ', false)'
                                    else functionName += ', true)'
                                    var status_btn = form.addButton({
                                        id: 'custpage_lmry_Status_Button',
                                        label: 'EI-Status',
                                        functionName: functionName
                                    });

                                    if (doc_country == 'MX' && statusBeforeLoad == 'Cancelando') {
                                        var rechazar_cancelacion = form.addButton({
                                            id: 'custpage_lmry_rechazar_cancelacion_Button',
                                            label: 'EI- Status Rejected',
                                            functionName: 'Status_EI(' + currentRecord.id + ',"' + doc_subsi + '",' + "true" + ')'
                                        });
                                    }

                                    form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                                }
                            }
                        }

                        var serie_cxp = currentRecord.getValue('custbody_lmry_serie_doc_cxc');
                        if ((doc_country == 'CO' && (currentRecord.type == 'vendorbill') && serie_cxp != null && serie_cxp != '') ||
                            (doc_country == 'US' && (currentRecord.type == 'invoice' || currentRecord.type == 'creditmemo' || currentRecord.type == 'salesorder')) ||
                            (doc_country == 'CO' && currentRecord.type == 'salesorder')) {

                            var function_name = '';
                            if (doc_country == 'CO') {
                                function_name = 'Print_PDF_EI(' + currentRecord.id + ', "CO", "' + currentRecord.type + '","' + doc_subsi + '")';
                            } else if (doc_country == 'US') {
                                function_name = 'Print_PDF_EI(' + currentRecord.id + ', "US", "' + currentRecord.type + '","' + doc_subsi + '")';
                            }

                            var pdf_btn = form.addButton({
                                id: 'custpage_lmry_pdf_button',
                                label: 'EI-Print PDF',
                                functionName: function_name
                            });
                            form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                        }
                    }
                    //}
                    var appStat = currentRecord.getValue('approvalstatus');
                    var voidedFlag = currentRecord.getValue('voided');
                    if (featureGenerate && ((appStat != 2 && appStat != null) || voidedFlag == 'T')) {
                        var btn_gene = form.getButton({
                            id: 'custpage_generate_ei_button'
                        });
                        if (btn_gene != null && btn_gene != '') {
                            btn_gene.isDisabled = true;
                        }
                    }
                }
                if (type_event == scriptContext.UserEventType.EDIT && type_interface == 'USERINTERFACE') {
                    var fromTransfOrder = false;
                    if (currentRecord.type == 'itemreceipt' && currentRecord.getValue('ordertype') == 'TrnfrOrd' && doc_country == 'BR') {
                        var isTOSearch = search.lookupFields({
                            type: 'transaction',
                            id: currentRecord.id,
                            columns: ['createdfrom.multisubsidiary']
                        });

                        fromTransfOrder = !isTOSearch['createdfrom.multisubsidiary'];
                    }
                    if (
                        validarSubsidiaryCountry() &&
                        (doc_country == 'BR' || doc_country == 'PE' || doc_country == 'MX' || doc_country == 'GT' || doc_country == 'EC' || doc_country == 'BO') &&
                        (
                            currentRecord.type == 'invoice' ||
                            (currentRecord.type == 'creditmemo' && (doc_country == 'PE' || doc_country == 'MX' || doc_country == 'GT' || doc_country == 'BO')) ||
                            ((currentRecord.type == 'customerpayment' || currentRecord.type == 'customtransaction_lmry_payment_complemnt' || currentRecord.type == 'customerdeposit' || currentRecord.type == 'itemfulfillment') && doc_country == 'MX') ||
                            ((currentRecord.type == 'vendorcredit' || currentRecord.type == 'itemfulfillment' || currentRecord.type == 'vendorbill') && doc_country == 'BR') ||
                            (currentRecord.type == 'vendorbill' && (doc_country == 'GT' || doc_country == 'EC')) ||
                            (currentRecord.type == 'itemreceipt' && doc_country == 'BR' && fromTransfOrder)
                        )
                    ) {
                        type_doc = currentRecord.type;
                        getStatusByCountry(doc_country, currentRecord.id, currentRecord);
                        var is_voided = currentRecord.getValue('voided');
                        if (is_voided == 'F' || is_voided == false) {
                            if (doc_country == 'BR') {
                                if (issued_stat != 'cancelada') {
                                    var void_btn = form.addButton({
                                        id: 'custpage_lmry_Void_Button',
                                        label: 'Void EI-BR',
                                        functionName: 'BR_Void_EI(' + currentRecord.id + ',"' + currentRecord.type + '","' + doc_subsi + '")'
                                    });
                                    var arr_allowedStat = ['autorizado', 'no cancelada'];
                                    if (ShowButton(arr_allowedStat, currentRecord)) {
                                        form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                                    } else {
                                        if (void_btn != null && void_btn != '') {
                                            void_btn.isDisabled = true;
                                        }
                                    }
                                }
                            } else if (doc_country == 'MX') {
                                if (issued_stat != 'cancelado') {
                                    var codModificacion = "";
                                    if (type_doc == 'customtransaction_lmry_payment_complemnt') {
                                        var searchModification = search.create({
                                            type: 'customrecord_lmry_complem_paymnt_fields',
                                            columns: ['custrecord_lmry_pycomp_modification_reas.custrecord_lmry_cod_modification_reason'],
                                            filters: [
                                                ['custrecord_lmry_related_complmnt_paym', 'anyof', currentRecord.id]

                                            ]
                                        });
                                        var resultModification = searchModification.run().getRange(0, 1000);

                                        if (resultModification != null && resultModification.length != 0) {
                                            row = resultModification[0].columns;
                                            codModificacion = resultModification[0].getValue(row[0]);
                                        }
                                        var void_btn = form.addButton({
                                            id: 'custpage_lmry_Void_Button',
                                            label: 'Void EI-MX',
                                            functionName: 'MX_Void_EI(' + currentRecord.id + ',"' + currentRecord.type + '","' +
                                                currentRecord.getValue("custpage_serie_doc") + '","' +
                                                currentRecord.getValue("custpage_document_type") + '","' +
                                                doc_subsi + '","' + codModificacion + '")'
                                        });
                                    } else {
                                        if (type_doc == 'customerpayment') {
                                            var searchModificacion = search.lookupFields({
                                                type: type_doc,
                                                id: currentRecord.id,
                                                columns: ['custbody_lmry_modification_reason.custrecord_lmry_cod_modification_reason']
                                            });
                                            codModificacion = searchModificacion["custbody_lmry_modification_reason.custrecord_lmry_cod_modification_reason"];
                                        }
                                        var void_btn = form.addButton({
                                            id: 'custpage_lmry_Void_Button',
                                            label: 'Void EI-MX',
                                            functionName: 'MX_Void_EI(' + currentRecord.id + ',"' + currentRecord.type + '","","","' + doc_subsi + '","' + codModificacion + '")'
                                        });
                                    }
                                    var arr_allowedStat = ['generado', 'no cancelado'];
                                    if (ShowButton(arr_allowedStat, currentRecord)) {
                                        form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                                    } else {
                                        if (void_btn != null && void_btn != '') {
                                            void_btn.isDisabled = true;
                                        }
                                    }
                                } else if (issued_stat == 'cancelado') {
                                    if (currentRecord.type == 'invoice' || currentRecord.type == 'creditmemo') {
                                        form.removeButton('refund');
                                    }
                                }

                            } else if (doc_country == 'PE') {
                                var fechaEmision = currentRecord.getValue('trandate').getTime();
                                var fechaActual = new Date().getTime();
                                // The number of milliseconds in one day
                                var ONE_DAY = 1000 * 60 * 60 * 24;
                                var difference_ms = Math.abs(fechaActual - fechaEmision);
                                var diferenciaFechas = Math.round(difference_ms / ONE_DAY)
                                // log.error('fechaEmision - fechaActual - diferenciaFechas', fechaEmision + ' - ' + fechaActual + ' - ' + diferenciaFechas);
                                var void_btn = form.addButton({
                                    id: 'custpage_lmry_pe_Void_Button',
                                    label: 'Void EI-PE',
                                    functionName: 'PE_Void_EI(' + currentRecord.id + ',"' + currentRecord.type + '","' + doc_subsi + '")'
                                });
                                var arr_allowedStat = ['autorizado', 'no cancelada'];
                                if (ShowButton(arr_allowedStat, currentRecord) && diferenciaFechas <= 8) {
                                    form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                                } else {
                                    if (void_btn != null && void_btn != '') {
                                        void_btn.isDisabled = true;
                                    }
                                }
                            } else if (doc_country == 'GT') {
                                if (issued_stat != 'cancelado') {
                                    var void_btn = form.addButton({
                                        id: 'custpage_lmry_Void_Button',
                                        label: 'Void EI-GT',
                                        functionName: 'GT_Void_EI(' + currentRecord.id + ',"' + currentRecord.type + '","' + doc_subsi + '")'
                                    });
                                    var arr_allowedStat = ['autorizado', 'no cancelada'];
                                    if (ShowButton(arr_allowedStat, currentRecord)) {
                                        form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                                    } else {
                                        if (void_btn != null && void_btn != '') {
                                            void_btn.isDisabled = true;
                                        }
                                    }
                                }
                            } else if (doc_country == 'EC') {
                                if (type_doc == 'vendorbill' && issued_stat != 'anulado') {

                                    // Busqueda en record LatamReady - Tipo Transaccion
                                    var srch_tranType = search.lookupFields({
                                        type: 'customrecord_lmry_transaction_type',
                                        id: currentRecord.getValue("custbody_lmry_transaction_type_doc"),
                                        columns: ['custrecord_lmry_code_type_transaction']
                                    })
                                    if (srch_tranType != null && srch_tranType != '') {
                                        cod_tranType = srch_tranType.custrecord_lmry_code_type_transaction
                                    }

                                    // Comprueba si el documento es un Comprobante de Retencion
                                    if (cod_tranType == '07') {
                                        var taxPeriod = search.lookupFields({
                                            type: 'vendorbill',
                                            id: currentRecord.id,
                                            columns: ['taxperiod']
                                        })
                                        taxPeriod = taxPeriod.taxperiod[0].value
                                        var taxPeriodClosed = search.lookupFields({
                                            type: 'taxperiod',
                                            id: taxPeriod,
                                            columns: ['closed']
                                        })
                                        taxPeriodClosed = taxPeriodClosed.closed

                                        // Comprueba si el periodo contable del bill esta abierto
                                        // El boton solo se muestra si el periodo esta abierto
                                        if (!taxPeriodClosed) {
                                            var void_btn = form.addButton({
                                                id: 'custpage_lmry_Void_Button',
                                                label: 'Void EI-EC',
                                                functionName: 'EC_Void_EI(' + currentRecord.id + ',"' + currentRecord.type + '","' + doc_subsi + '")'
                                            });
                                            var arr_allowedStat = ['autorizado', 'no cancelada'];

                                            if (ShowButton(arr_allowedStat, currentRecord)) {
                                                form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                                            } else {
                                                if (void_btn != null && void_btn != '') {
                                                    void_btn.isDisabled = true;
                                                }
                                            }
                                        }
                                    }

                                }
                            } else if (doc_country == 'BO') {
                                if (issued_stat != 'cancelado') {
                                    var void_btn = form.addButton({
                                        id: 'custpage_lmry_Void_Button',
                                        label: 'Void EI-BO',
                                        functionName: 'BO_Void_EI(' + currentRecord.id + ',"' + currentRecord.type + '","' + doc_subsi + '")'
                                    });
                                    var arr_allowedStat = ['aceptado', 'no cancelada'];
                                    if (ShowButton(arr_allowedStat, currentRecord)) {
                                        form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                                    } else {
                                        if (void_btn != null && void_btn != '') {
                                            void_btn.isDisabled = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (type_event == scriptContext.UserEventType.CREATE || type_event == scriptContext.UserEventType.EDIT || type_event == scriptContext.UserEventType.COPY || type_event == scriptContext.UserEventType.VIEW) {
                    getAutoEiAuthorization(form, currentRecord);
                    if (doc_country == '') {
                        doc_country = ei_library.getCountryID(doc_subsi).code;
                    }
                    var timbre_cl = currentRecord.getValue('custbody_lmry_timbre_electronico_cl');
                    if (doc_country == 'MX' && (currentRecord.type == 'invoice' || currentRecord.type == 'creditmemo')) {
                        var cad_mx = form.addField({
                            id: 'custpage_addenda_items',
                            type: ui.FieldType.SELECT,
                            label: 'Latam - Addenda Type',
                            source: 'customlist_lmry_mx_addendas_tipo'
                        });
                        form.insertField({
                            field: cad_mx,
                            nextfield: 'custbody_lmry_processed_transaction'
                        });
                        if (timbre_cl != '' && timbre_cl != null) {
                            cad_mx.defaultValue = timbre_cl;
                        }
                    }
                }
                if (type_event == scriptContext.UserEventType.CREATE || type_event == scriptContext.UserEventType.EDIT) {
                    // doc_country = ei_library.getCountryID(doc_subsi).code;
                    if (doc_country == 'MX' && currentRecord.type == 'invoice' && currentRecord.getValue('createdfrom') != '' && currentRecord.getValue('createdfrom') != null) {
                        var ship = form.addField({
                            id: 'custpage_idship',
                            type: ui.FieldType.TEXT,
                            label: 'Id ship'
                        })
                        ship.updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });
                        // Añadiendo un campo para guardar el id del itemship recibido en el parametro
                        var itemship = '';
                        if (type_interface != 'WORKFLOW') {
                            if (scriptContext.request.parameters != null && scriptContext.request.parameters != '') {
                                itemship = scriptContext.request.parameters.itemship;
                                if (itemship != null && itemship != '') {
                                    ship.defaultValue = itemship;
                                }
                            }
                        }
                        if (itemship == null || itemship == '') {
                            var sales_order = record.load({
                                type: record.Type.SALES_ORDER,
                                id: currentRecord.getValue('createdfrom')
                            });
                            var numLines = sales_order.getLineCount({
                                sublistId: 'links'
                            });
                            var itemship_used = [];
                            for (var i = 0; i < numLines; i++) {
                                var type = sales_order.getSublistValue({
                                    sublistId: 'links',
                                    fieldId: 'type',
                                    line: i
                                });
                                if (type == "Invoice" || type == "invoice") {
                                    var id_inv = sales_order.getSublistValue({
                                        sublistId: 'links',
                                        fieldId: 'id',
                                        line: i
                                    });
                                    var ids_itemf = search.lookupFields({
                                        type: record.Type.INVOICE,
                                        id: id_inv,
                                        columns: ['custbody_lmry_webserviceerror']
                                    });
                                    var wsError = ids_itemf.custbody_lmry_webserviceerror.split(",");
                                    itemship_used = itemship_used.concat(wsError);
                                }
                            }
                            var itemship = [];
                            for (var i = 0; i < numLines; i++) {
                                var type = sales_order.getSublistValue({
                                    sublistId: 'links',
                                    fieldId: 'type',
                                    line: i
                                });
                                if (type == "Item Fulfillment" || type == "Item Shipment") {
                                    var id_itemf = sales_order.getSublistValue({
                                        sublistId: 'links',
                                        fieldId: 'id',
                                        line: i
                                    });
                                    if (itemship_used.indexOf(id_itemf) == -1) {
                                        itemship.push(id_itemf);
                                    }
                                }
                            }
                            var ids = itemship.join(",")
                            ship.defaultValue = ids;
                        }
                    }
                }

                // log.error(name_script + " | FIN beforeLoad", "FIN beforeLoad");
                //log.error("FIN beforeLoad", "FIN beforeLoad");
            } catch (err) {
                log.error("Error", "[ beforeLoad ] " + err);
            }

        }

        function beforeSubmit(scriptContext) {
            var rec = scriptContext.newRecord;
            var type_event = scriptContext.type;
            var type_interface = runtime.executionContext;
            var doc_subsi = rec.getValue('subsidiary');
            doc_country = ei_library.getCountryID(doc_subsi).code;
            var id_itemShip = rec.getValue('custpage_idship');
            var addenda_select = rec.getValue('custpage_addenda_items') || ' ';

            if (type_interface != 'USERINTERFACE') {
                if (doc_country == "MX" && (rec.type == "invoice" || rec.type == "creditmemo") && (type_event == "create" || type_event == "edit" || type_event == "copy")) {
                    if (rec.type == "invoice") {
                        removeDecimalLine(rec);
                    } else if (rec.type == "creditmemo") {
                        var createdfrom = rec.getValue("createdfrom");
                        if (!Number(createdfrom)) {
                            removeDecimalLine(rec);
                        }
                    }
                }
            }
            if (doc_country == 'MX' && (rec.type == 'invoice' || rec.type == 'creditmemo') && (addenda_select != '' && addenda_select != null)) {
                rec.setValue('custbody_lmry_timbre_electronico_cl', addenda_select);
            }
            // Añadiendo el id del itemship al LATAM - MEMO
            if (doc_country == 'MX' && rec.type == 'invoice' &&
                rec.getValue('createdfrom') != null &&
                rec.getValue('createdfrom') != '' &&
                rec.getValue('custbody_lmry_webserviceerror') == '') {
                rec.setValue('custbody_lmry_webserviceerror', id_itemShip);
            }

            if (doc_country == 'MX') {
                var design = rec.getValue('custbody_lmry_mx_document_design');
                var serie = rec.getValue('custbody_lmry_serie_doc_cxc');

                if (!design) {
                    if (serie) {
                        var design = search.lookupFields({
                            type: 'customrecord_lmry_serie_impresion_cxc',
                            id: serie,
                            columns: ['custrecord_lmry_diseno_pdf']
                        })
                        if (design.custrecord_lmry_diseno_pdf[0]) {
                            rec.setValue('custbody_lmry_mx_document_design', design.custrecord_lmry_diseno_pdf[0].value)
                        }
                    }
                }
            }
            if (doc_country == 'PE' && rec.type == 'itemreceipt' && (rec.getValue('custbody_lmry_guia_peso_items') == '' || rec.getValue('custbody_lmry_guia_peso_items') == null)) {
                var totalWeight = 0;
                var numLines = rec.getLineCount({ sublistId: 'item' });
                for (var j = 0; j < numLines; j++) {

                    var itemWeight = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemweight',
                        line: j
                    });
                    var itemQuantity = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: j
                    });
                    itemWeight = Math.round(itemWeight * 10000) / 10000;
                    itemQuantity = Math.round(itemQuantity * 10000) / 10000;
                    totalWeight += itemWeight * itemQuantity;
                }
                totalWeight = parseFloat(totalWeight.toFixed(2));
                rec.setValue('custbody_lmry_guia_peso_items', totalWeight);
            }
            //D1714: Decimales - Cálculo interno para balance real
            if (doc_country == "MX" && (rec.type == "invoice" || rec.type == "creditmemo") && (type_event == "create" || type_event == "edit" || type_event == "copy")) {
                if (rec.type == "invoice") {
                    addDecimalLine(rec);
                } else if (rec.type == "creditmemo") {
                    var createdfrom = rec.getValue("createdfrom");
                    if (!Number(createdfrom)) {
                        addDecimalLine(rec);
                    }
                }
            }
        }

        function afterSubmit(scriptContext) {

            try {
                var ST_FEATURE = runtime.isFeatureInEffect({
                    feature: "tax_overhauling"
                });
                var RCD = scriptContext.newRecord;
                var subsidiary = RCD.getValue('subsidiary');
                var documentType = RCD.getValue('custbody_lmry_document_type');
                var serie = RCD.getValue('custbody_lmry_serie_doc_cxc');
                var country = RCD.getValue('custbody_lmry_subsidiary_country');
                var flagInvoicing = RCD.getValue('custbody_lmry_mx_ei_automatic');
                // 45-Chile, 157-Mexico, 11-Argentina, 30-brasil 
                var paises = ['30', '157', '45', '11'];

                if (scriptContext.type == 'copy' || scriptContext.type == 'create' || scriptContext.type == 'edit') {
                    itemFulFillmentLibrary.executeSalesFlow_EI(scriptContext.newRecord);
                }

                // Solo para subsidiaria con acceso - Transaction Number Invoice Massive
                if (scriptContext.type == 'create' && RCD.type == 'invoice') {
                    if (ST_FEATURE == false || ST_FEATURE == "F") {
                        numberPreprintedMassive(RCD);
                    }
                }

                var doc_country = ei_library.getCountryID(subsidiary).code;
                var all_Licenses = ei_library.getLicenses(subsidiary);
                var autoEiLicenses = { 'BR': 1084, 'MX': 1083, 'AR': 1086, 'CL': 1087 };
                if (ei_library.getAuthorization(autoEiLicenses[doc_country], all_Licenses) && ['create', 'copy', 'edit'].indexOf(scriptContext.type) != -1) {
                    if ((paises.indexOf(country) != -1) && flagInvoicing && validateTransactions(RCD, country) && documentType && statusFacturacion(RCD, country) && !(country != '45' && !serie)) {
                        var isElectronic = search.lookupFields({
                            type: 'customrecord_lmry_tipo_doc',
                            id: documentType,
                            columns: ['custrecord_lmry_fact_electronica']
                        });
                        isElectronic = isElectronic.custrecord_lmry_fact_electronica;
                        var nameDeploy = getDeploy(RCD, country);
                        if (isElectronic && nameDeploy) {
                            createLog(RCD, nameDeploy);
                            if (validateDeploy(nameDeploy, country)) {
                                submit(nameDeploy, country);
                            }
                        }
                    }
                }

                // Lógica para el Automatic Sending CSV de Brasil
                if (scriptContext.type == 'create' && runtime.executionContext == 'CSVIMPORT') {
                    var doc_id = RCD.id;
                    var ntype = RCD.getValue('ntype');
                    type_doc = RCD.type;

                    if (documentType != 861) // Solo para NFSe
                        return
                    if (!ei_library.getAuthorization(848, all_Licenses))
                        return
                    if (validarSubsidiaryCountry() && (type_doc == 'invoice')) {
                        if(flagBrasil){
                            FEATURE_OWN = paisFeatureOwn(doc_country)

                            if (ei_library.getAuthorization(FEATURE_OWN, all_Licenses)) {
                                if (documentType != null && documentType != '') {
                                    /*Busqueda : LatamReady - EI Package */
                                    var objbusqPrueba = search.create({
                                        type: 'customrecord_lmry_ei_pckg',
                                        columns: ['custrecord_lmry_ei_pckg_subsi', 'custrecord_lmry_ei_pckg_doc_type',
                                            'custrecord_lmry_ei_pckg_template', 'custrecord_lmry_ei_pckg_sm', 'custrecord_lmry_ei_pckg_trans_type'
                                        ],
                                        filters: [
                                            ['custrecord_lmry_ei_pckg_subsi', 'anyof', subsidiary],
                                            'and', ['custrecord_lmry_ei_pckg_doc_type', 'equalto', documentType],
                                            'and', ['custrecord_lmry_ei_pckg_subsi.isinactive', 'is', false],
                                            'and', ["isinactive", "is", "F"]
                                        ]
                                    });
                                    resultadoPrueba = objbusqPrueba.run().getRange(0, 50);
                                    //AGARRA EL VALOR DE ACUERDO AL TIPO DE TRANSACCION (custrecord_lmry_ei_pckg_trans_type)

                                    if (resultadoPrueba != null && resultadoPrueba.length != 0) {
                                        var k = 0;
                                        var _subsi = '';
                                        var _fiscal_doc = ''
                                        var _template = '';
                                        var _method = '';

                                        if (resultadoPrueba.length > 1) {
    
                                            for (var i = 0; i < resultadoPrueba.length; i++) {
                                                row = resultadoPrueba[i].columns;
                                                if (resultadoPrueba[i].getValue(row[4]) == ntype) {
                                                    k = i;
                                                    _subsi = resultadoPrueba[k].getValue(row[0]);
                                                    _fiscal_doc = resultadoPrueba[k].getValue(row[1]);
                                                    _template = resultadoPrueba[k].getValue(row[2]);
                                                    _method = resultadoPrueba[k].getValue(row[3]);
                                                    break;
                                                } else {
                                                    _subsi = '';
                                                    _fiscal_doc = '';
                                                    _template = '';
                                                    _method = '';
                                                }
                                            }
                                        } else {
                                            row = resultadoPrueba[0].columns;
                                            _subsi = resultadoPrueba[0].getValue(row[0]);
                                            _fiscal_doc = resultadoPrueba[0].getValue(row[1]);
                                            _template = resultadoPrueba[0].getValue(row[2]);
                                            _method = resultadoPrueba[0].getValue(row[3]);
                                        }

                                        subsi = _subsi;
                                        _doc_fiscal = _fiscal_doc;
                                        template = _template;
                                        send_method = _method

                                        if ((template != null && template != '') && (send_method != null && send_method != '')) {
                                            /* RECORD: LatamReady - EI Connection Status*/
                                            busqeiprint = search.create({
                                                type: 'customrecord_lmry_ei_con_status',
                                                columns: ['custrecord_lmry_ei_con_rel_txn', 'custrecord_lmry_ei_con_subsidiary', 'custrecord_lmry_ei_con_doc', 'custrecord_lmry_ei_con_temp',
                                                    'custrecord_lmry_ei_con_sm', 'custrecord_lmry_ei_con_status'
                                                ],
                                                filters: [
                                                    ['custrecord_lmry_ei_con_rel_txn', 'anyof', doc_id]
                                                ]
                                            });
                                            resultprint = busqeiprint.run().getRange(0, 1000);
    
                                            var connectionprint;
                                            if (resultprint == null || resultprint.length == 0) {
                                                /*Llenado de tabla: LatamReady - EI Connection Status*/
                                                connectionprint = record.create({
                                                    type: 'customrecord_lmry_ei_con_status'
                                                });
                                                connectionprint.setValue('custrecord_lmry_ei_con_rel_txn', doc_id);
                                                connectionprint.setValue('custrecord_lmry_ei_con_status', 1);
                                            } else {
                                                connectionprint = record.load({
                                                    type: 'customrecord_lmry_ei_con_status',
                                                    id: resultprint[0].id
                                                })
                                            }

                                            connectionprint.setValue('custrecord_lmry_ei_con_subsidiary', subsi);
                                            connectionprint.setValue('custrecord_lmry_ei_con_doc', _doc_fiscal);
                                            connectionprint.setValue('custrecord_lmry_ei_con_temp', template);
                                            connectionprint.setValue('custrecord_lmry_ei_con_sm', send_method);
                                            id_con = connectionprint.save();

                                            //GENERACION Y ENVIO DE FACTURA ELECTRONICA
                                            var numero_rps = library_num_rps.getRPS(doc_id);

                                            require(
                                                ['SuiteBundles/Bundle 245881/OWN_Libraries_BR/library_gene_BR.js'],
                                                function (LIBRARY_GENE_BR) {
                                                    LIBRARY_GENE_BR.own_generate(doc_id, type_doc, id_con, true, numero_rps);
                                                });

                                        } else {
                                            log.error('Setup Error', 'No se encontró en el EI Package los parámetros Template y Sending Method');
                                            return true;
                                        }

                                    } else {
                                        log.error('Setup Error', 'No se encontró un EI Package configurado para los parámetros Subsidiaria: ' + subsidiary + ' y Tipo de Documento Fiscal: ' + documentType);
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                log.error("Error", "[ afterSubmit ] " + err);
            }
            return true;
        }
        function getDeploy(recordObj, country) {
            var nameDeploy = '';
            var filtros = [];
            filtros.push(search.createFilter({ name: 'isinactive', operator: 'is', values: 'F' }));
            filtros.push(search.createFilter({ name: 'custrecord_lmry_auto_inv_subsidiary', operator: 'is', values: recordObj.getValue('subsidiary') }));
            filtros.push(search.createFilter({ name: 'custrecord_lmry_auto_inv_document', operator: 'is', values: recordObj.getValue('custbody_lmry_document_type') }));
            if (country != '45') {
                filtros.push(search.createFilter({ name: 'custrecord_lmry_auto_inv_serie', operator: 'is', values: recordObj.getValue('custbody_lmry_serie_doc_cxc') }));
            }
            var searchDeploy = search.create({
                type: 'customrecord_lmry_auto_inv_multithread',
                filters: filtros,
                columns: ['custrecord_lmry_auto_inv_deploy']
            });
            searchDeploy = searchDeploy.run().getRange(0, 1);
            if (searchDeploy && searchDeploy.length) {
                nameDeploy = searchDeploy[0].getValue('custrecord_lmry_auto_inv_deploy');
            }
            return nameDeploy;


        }

        function createLog(recordObj, nameDeploy) {
            var currentUser = runtime.getCurrentUser().id;
            if (parseInt(currentUser) < 0 || !currentUser) {
                currentUser = '';
            }
            var idLog = record.create({ type: 'customrecord_lmry_auto_inv_log' });
            idLog.setValue('custrecord_lmry_log_subsidiary', recordObj.getValue('subsidiary'));
            idLog.setValue('custrecord_lmry_log_transaction', recordObj.id);
            idLog.setValue('custrecord_lmry_log_user', currentUser);
            idLog.setValue('custrecord_lmry_log_status', '4');
            idLog.setValue('custrecord_lmry_log_deploy', nameDeploy);
            idLog.setValue('custrecord_lmry_log_transaction_type', recordObj.getValue('ntype'));
            idLog = idLog.save();
        }

        function validateDeploy(nameDeploy, country) {
            var idMprd = '';
            switch (country) {
                case '11': idMprd = 'customscript_lmry_ar_auto_ei_mprd'; break;
                case '30': idMprd = 'customscript_lmry_br_auto_ei_mprd'; break;
                case '45': idMprd = 'customscript_lmry_cl_auto_ei_mprd'; break;
                case '157': idMprd = 'customscript_lmry_mx_auto_ei_mprd'; break;
            }
            var searchDeploys = search.create({
                type: 'scheduledscriptinstance',
                filters: [
                    ["scriptdeployment.scriptid", "is", nameDeploy], "AND", ["status", "anyof", "PENDING", "PROCESSING"], "AND",
                    ["script.scriptid", "is", idMprd]
                ]
            });
            searchDeploys = searchDeploys.run().getRange({ start: 0, end: 1 });
            return !searchDeploys.length;

        }

        function submit(nameDeploy, country) {
            var idMprd = '';
            switch (country) {
                case '11': idMprd = 'customscript_lmry_ar_auto_ei_mprd'; break;
                case '30': idMprd = 'customscript_lmry_br_auto_ei_mprd'; break;
                case '45': idMprd = 'customscript_lmry_cl_auto_ei_mprd'; break;
                case '157': idMprd = 'customscript_lmry_mx_auto_ei_mprd'; break;
            }
            var mprdInvoicing = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: idMprd,
                deploymentId: nameDeploy
            }).submit();
        }

        function statusFacturacion(recordObj, country) {
            var statusExitosos = ['Error', 'Rechazado'];
            var searchDS = search.create({
                type: 'customrecord_lmry_ei_docs_status',
                filters: [
                    { name: 'isinactive', operator: 'is', values: 'F' },
                    { name: 'custrecord_lmry_ei_ds_doc', operator: 'anyof', values: recordObj.id }
                ],
                columns: ['custrecord_lmry_ei_ds_doc_status']
            });
            searchDS = searchDS.run().getRange(0, 1);
            if (searchDS && searchDS.length) {
                var currentStatus = searchDS[0].getValue('custrecord_lmry_ei_ds_doc_status');
                if (statusExitosos.indexOf(currentStatus) != -1) {
                    return true;
                }
                return false;
            }
            return true;
        }

        function validateTransactions(recordObj, country) {
            var transactions = [];
            switch (country) {
                case '11': transactions = ['invoice', 'creditmemo', 'itemfulfillment']; break;
                case '30': transactions = ['invoice']; break;
                case '45': transactions = ['invoice', 'creditmemo']; break;
                case '157': transactions = ['invoice', 'creditmemo', 'customerpayment']; break;
            }
            if (transactions.indexOf(recordObj.type) != -1) {
                return true;
            }
            return false;
        }
        function getAutoEiAuthorization(form, currentRecord) {
            var autoEiLicenses = {
                'BR': 1084,
                'MX': 1083,
                'AR': 1086,
                'CL': 1087
            };
            var validTransactions = {
                'BR': ['invoice'],
                'MX': ['invoice', 'creditmemo', 'customerpayment'],
                'AR': ['invoice', 'creditmemo', 'itemfulfillment'],
                'CL': ['invoice', 'creditmemo']
            }
            if (autoEiLicenses[doc_country]) {
                if (ei_library.getAuthorization(autoEiLicenses[doc_country], all_Licenses)) {
                    if (validTransactions[doc_country].indexOf(currentRecord.type) != -1) {
                        form.getField({
                            id: 'custbody_lmry_mx_ei_automatic'
                        }).updateDisplayType({ displayType: 'normal' });
                    }
                }
            }
        }
        function getStatusByCountry(doc_country, doc_id, recordStatus) {
            try {

                var status = '';
                var status_country = '';

                if (country_codes.indexOf(doc_country) != -1) {
                    FILTER_STATUS = ['custrecord_lmry_ei_ds_doc', 'anyof', doc_id]
                    switch (doc_country) {
                        case 'AR':
                            // Aprobado || Observado
                            // SCRIPT - DEPLOY
                            SCRIPT_ID = 'customscript_lmry_ar_ei_own_gene_stlt';
                            DEPLOY_ID = 'customdeploy_lmry_ar_ei_own_gene_stlt';
                            break;
                        case 'CL':
                            // EMITIDO || APROBADO POR SII
                            // SCRIPT - DEPLOY
                            SCRIPT_ID = 'customscript_lmry_cl_ei_own_gene_stlt';
                            DEPLOY_ID = 'customdeploy_lmry_cl_ei_own_gene_stlt';
                            break;
                        case 'CO':
                            // ACEPTADO || AUTORIZADO
                            // SCRIPT - DEPLOY
                            SCRIPT_ID = 'customscript_lmry_co_ei_own_gene_stlt';
                            DEPLOY_ID = 'customdeploy_lmry_co_ei_own_gene_stlt';
                            break;
                        case 'PE':
                            // ACEPTADO || AUTORIZADO
                            // SCRIPT - DEPLOY
                            SCRIPT_ID = 'customscript_lmry_pe_ei_own_gene_stlt';
                            DEPLOY_ID = 'customdeploy_lmry_pe_ei_own_gene_stlt';
                            break;
                        case 'EC':
                            // ACEPTADO || AUTORIZADO || PROCESANDO
                            break;
                        case 'CR':
                            // Aprobado || Observado || Procesando
                            break;
                        case 'MX':
                            // Generado
                            COLUMN_STATUS = 'custbody_lmry_pe_estado_sf';
                            break;
                        case 'BR':
                            // Autorizado || Procesando
                            break;
                        case 'UY':
                            // Generado
                            break;
                        case 'PA':
                            // Autorizado || Procesando
                            break;
                        case 'GT':
                            // Autorizado || Procesando
                            break;
                        case 'PY':
                            // Autorizado || Procesando
                            break;
                        case 'BO':
                            SCRIPT_ID = 'customscript_lmry_bo_ei_own_gene_stlt';
                            DEPLOY_ID = 'customdeploy_lmry_bo_ei_own_gene_stlt';
                            break;
                    }

                    if (doc_country == 'MX') {
                        var flagCampo = recordStatus.getField(COLUMN_STATUS);
                        if (flagCampo != null && flagCampo != '') {
                            var rec_doc = search.lookupFields({
                                type: type_doc,
                                id: doc_id,
                                columns: COLUMN_STATUS
                            });
                            status = rec_doc.custbody_lmry_pe_estado_sf;
                            issued_stat = status.toLowerCase();
                        }
                    } else {
                        if (doc_country == 'BR') {
                            COLUMN_STATUS.push('custrecord_lmry_ei_ds_process');
                        }
                        var busqEIEstadoCountry = search.create({
                            type: RECORD_STATUS,
                            columns: COLUMN_STATUS,
                            filters: [FILTER_STATUS]
                        });

                        var resultEIEstadoCountry = busqEIEstadoCountry.run().getRange(0, 1000);
                        if (resultEIEstadoCountry != null && resultEIEstadoCountry.length != 0) {
                            if (doc_country == 'BR') {
                                for (var i = 0; i < resultEIEstadoCountry.length; i++) {
                                    var row = resultEIEstadoCountry[i].columns;
                                    var aux_status = resultEIEstadoCountry[i].getValue(row[0]);
                                    aux_status = aux_status.toLowerCase();
                                    var process_id = resultEIEstadoCountry[i].getValue(row[1]);
                                    // Si hay errores de tipo 503, las variables quedan vacias.
                                    if (['autorizado', 'procesando', 'rechazado', 'cancelada', 'no cancelada', 'corregido', 'procesando', 'no corregido'].indexOf(aux_status) != -1) {
                                        if (process_id == '0' || process_id == '1') {
                                            issued_stat = aux_status.toLowerCase();
                                        } else if (process_id == '') {
                                            correc_stat = aux_status.toLowerCase();
                                        }
                                    }
                                }
                            } else {
                                var row = resultEIEstadoCountry[0].columns;
                                status_country = resultEIEstadoCountry[0].getValue(row[0]);
                                issued_stat = status_country.toLowerCase();
                                status = status_country;
                            }
                        }
                    }

                }
                // log.error(name_script + " | SCRIPT_ID - DEPLOY_ID", SCRIPT_ID + ' - ' + DEPLOY_ID);

                return status;

            } catch (err) {
                log.error("Error", "[ getStatusByCountry ] " + err);
            }
        }

        function hasPDF(doc_id) {
            try {
                var doc_PDF = search.lookupFields({
                    type: type_doc,
                    id: doc_id,
                    columns: ['custrecord_lmry_document_transaction.custrecord_lmry_print_pdf']
                })['custrecord_lmry_document_transaction.custrecord_lmry_print_pdf']

                return (doc_PDF == '' || doc_PDF == null)
                    ? false
                    : true
            } catch (e) {
                log.error('[hasPDF]', e)
                return false
            }
        }

        function validarSubsidiaryCountry() {
            try {
                if (country_codes.indexOf(doc_country) == -1) {
                    return false;
                }

                if (doc_country == 'CO') {
                    flagColombia = true;
                }

                if (doc_country == 'BR') {
                    flagBrasil = true
                }

                return true;

            } catch (err) {
                log.error("Error", "[ validarSubsidiaryCountry ] " + err);
            }
        }

        function ShowButton(arr_status, curr_record) {
            try {
                // log.error(name_script + " | Country - Doc Status", doc_country + ' - ' + issued_stat + '/' + correc_stat);

                if (Flag_Carta_Correction) {
                    //var arr_allowedStat = ['autorizado', 'no cancelada', 'no corregido'];
                    if (arr_status.indexOf(issued_stat) == -1 || (correc_stat != '' && arr_status.indexOf(correc_stat) == -1)) {
                        return false;
                    }
                } else {

                    var approvalStatus = true;
                    var relatedPayment = false;

                    if (curr_record.type == 'invoice') {
                        var appRouting = runtime.getCurrentScript().getParameter({
                            name: 'CUSTOMAPPROVALCUSTINVC'
                        });
                        if (appRouting == 'T' || appRouting == true) {
                            var appStat = curr_record.getValue('approvalstatus');
                            if (appStat != 2) {
                                approvalStatus = false;
                            }
                        }
                        // log.error(name_script + " | Approval Routing Feat - appStat document", appRouting + ' - ' + appStat);

                        var busqrelPayment = search.create({
                            type: "invoice",
                            filters: [
                                ["type", "anyof", "CustInvc"],
                                "AND",
                                ["mainline", "is", "T"],
                                "AND",
                                ["applyingtransaction.type", "anyof", "CustPymt"],
                                "AND",
                                ["internalidnumber", "equalto", curr_record.id]
                            ]
                        });

                        var resultRelPayment = busqrelPayment.run().getRange(0, 1000);
                        // log.error("resultRelPayment", resultRelPayment);
                        if (resultRelPayment != null && resultRelPayment.length != 0) {
                            relatedPayment = true;
                        }
                    }
                    // log.error("relatedPayment", relatedPayment);
                    //var arr_allowedStat = ['autorizado', 'no cancelada'];
                    if (!approvalStatus || arr_status.indexOf(issued_stat) == -1 || correc_stat == 'procesando' || relatedPayment) {
                        return false;
                    }
                }

                return true;
            } catch (err) {
                log.error("Error", "[ ShowButton ] " + err);
            }
        }

        /* --------------------------------------------------------------------------------------------------
         * Elimina el Botón Edit
         * --------------------------------------------------------------------------------------------------- */
        function removeButtonEdit(RCD_OBJ, OBJ_FORM, _docSubsi, _arrLicen) {
            try {
                var id_transaccion = RCD_OBJ.id;
                var typeTransaction = RCD_OBJ.type;
                // var objCountry = ei_library.getCountryID(_docSubsi);
                var _userObj = runtime.getCurrentUser();

                if (['invoice', 'creditmemo', 'customerpayment', 'vendorcredit', 'itemfulfillment', 'customtransaction_lmry_payment_complemnt', 'customerdeposit'].indexOf(typeTransaction) == -1 || ['MX', 'BR', 'PE', 'CO'].indexOf(doc_country) == -1 || ((typeTransaction == 'vendorcredit' || typeTransaction == 'itemfulfillment') && doc_country != 'BR') || ((typeTransaction == 'customerpayment' || typeTransaction == 'customerdeposit') && doc_country != 'MX') || (doc_country == 'CO' && (_userObj.role == 3 || _userObj.role != 3 && !getAuthTxnVal(_arrLicen, '569')))) {
                    return false;
                }

                var eiDocumentStatus = '';
                var eiDocumentClave = '';
                var internalIDDs = '';
                //PRUEBA SEARCH DOCUMENT STATUS GENERAL
                var searchEIDocumentStatus = search.create({
                    type: RECORD_STATUS,
                    columns: ['custrecord_lmry_ei_ds_doc_status', 'custrecord_lmry_ei_ds_doc_proc_status'],
                    filters: [
                        ['custrecord_lmry_ei_ds_doc', 'is', id_transaccion]
                    ]
                });
                var searchResult = searchEIDocumentStatus.run().getRange(0, 1);

                if (searchResult != '' && searchResult != null) {
                    internalIDDs = searchResult[0].id;
                    eiDocumentStatus = searchResult[0].getValue({
                        name: 'custrecord_lmry_ei_ds_doc_status'
                    });
                    eiDocumentClave = searchResult[0].getValue({
                        name: 'custrecord_lmry_ei_ds_doc_proc_status'
                    });
                }

                var memo = '';
                if (RCD_OBJ.getText('memo')) {
                    memo = RCD_OBJ.getText('memo');
                    memo = memo.substring(0, 14);
                }

                if ((typeTransaction == 'creditmemo' && memo == 'Reference VOID' && doc_country != 'CO') || (doc_country == 'CO' && eiDocumentStatus.toLowerCase() == 'autorizado')) {
                    hideButtons(OBJ_FORM);
                } else if (id_transaccion && doc_country != 'CO') {
                    var status_Transaccion = RCD_OBJ.getValue('status');
                    var flagVoided = RCD_OBJ.getValue('voided');
                    var codigo = '';
                    //PRUEBA ANULACION PARCIAL
                    if (status_Transaccion == 'Voided' || (flagVoided == 'T' && (typeTransaction == 'customerpayment' || typeTransaction == 'customtransaction_lmry_payment_complemnt' || typeTransaction == 'customerdeposit'))) {
                        if (eiDocumentClave != null && eiDocumentClave != '') {
                            eiDocumentClave = JSON.parse(eiDocumentClave);
                            codigo = eiDocumentClave.voidedType;
                            if (codigo == '1') {
                                // log.error('El estado de la anulación esta en voided, se modificará su valor a 0');
                                eiDocumentClave.voidedType = '0';
                                // log.error('eiDocumentClave general', eiDocumentClave);
                                record.submitFields({
                                    type: RECORD_STATUS,
                                    id: internalIDDs,
                                    values: {
                                        'custrecord_lmry_ei_ds_doc_proc_status': JSON.stringify(eiDocumentClave)
                                    },
                                    options: {
                                        ignoreMandatoryFields: true,
                                        enableSourcing: true,
                                        disableTriggers: true
                                    }
                                });
                            }
                        }
                    }
                    //FIN PRUEBA ANULACION PARCIAL
                    if (internalIDDs != '' && internalIDDs != null) {
                        var recDocStatus = search.lookupFields({
                            type: RECORD_STATUS,
                            id: internalIDDs,
                            columns: 'custrecord_lmry_ei_ds_doc_proc_status'
                        });
                        eiDocumentClave = recDocStatus.custrecord_lmry_ei_ds_doc_proc_status;
                        if (eiDocumentClave != null && eiDocumentClave != '') {
                            eiDocumentClave = JSON.parse(eiDocumentClave);
                            codigo = eiDocumentClave.voidedType;
                        }
                    }
                    //Si es eiDocumentClave es 1, se refiere a que es una anulación parcial, si se da el caso, si podría editarse
                    if ((eiDocumentStatus == 'Cancelado' || eiDocumentStatus == 'Cancelada') && codigo != '1') {
                        hideButtons(OBJ_FORM);
                    }
                }
            } catch (err) {
                log.error('ERROR - beforeLoad: Remove Button Edit', err);
            }
            return true;
        }

        function getAuthTxnVal(_all_Licenses, _featID) {
            return ei_library.getAuthorization(_featID, _all_Licenses)
        }

        function hideButtons(currentForm) {
            currentForm.removeButton('edit');
            var btn_send = currentForm.getButton({
                id: 'custpage_send_ei_button'
            });
            if (btn_send != null && btn_send != '') {
                btn_send.isDisabled = true;
            }
        }

        function sendEmailCustomer(currentRecord, form) {

            try {

                if (valSendemailStandar(currentRecord) && (currentRecord.type == 'invoice' || currentRecord.type == 'creditmemo' || currentRecord.type == 'customerpayment' || currentRecord.type == 'vendorbill' || currentRecord.type == 'vendorcredit' || currentRecord.type == 'itemfulfillment' || currentRecord.type == 'customtransaction_lmry_payment_complemnt' || currentRecord.type == 'customerdeposit')) {

                    var par_country = currentRecord.getValue('custbody_lmry_subsidiary_country');
                    var par_doctype = currentRecord.getValue('custbody_lmry_document_type');

                    if (currentRecord.type != 'customerpayment' && currentRecord.type != 'customtransaction_lmry_payment_complemnt' && currentRecord.type != 'customerdeposit') {
                        var par_customer = currentRecord.getValue('entity');
                    } else {
                        var par_customer = currentRecord.getValue('customer');
                    }

                    if ((par_country != '' && par_country != null) && (par_doctype != '' && par_doctype != null)) {


                        var code_country = {
                            11: 'AR',
                            30: 'BR',
                            174: 'PE',
                            157: 'MX',
                            48: 'CO',
                            45: 'CL',
                            29: 'BO',
                            49: 'CR',
                            63: 'EC',
                            173: 'PA',
                            231: 'UY',
                            91: 'GT',
                            29: 'BO',
                            61: 'DO',
                            186: 'PY'
                        };

                        if (code_country === undefined) {
                            return false;
                        }

                        var banderita = false
                        if (currentRecord.type == 'itemfulfillment' && currentRecord.getValue('ordertype') == 'TrnfrOrd') {
                            banderita = true;
                        }

                        FEATURE_SENDCUSTOMER = paisFeatureSendCustomer(code_country[par_country])
                        if (getAuthTxnVal(all_Licenses, FEATURE_SENDCUSTOMER)) {
                            var user = runtime.getCurrentUser()

                            if (valSendCustomer(par_country, currentRecord.id) && tieneContactos(code_country[par_country], par_customer, currentRecord.type, banderita, currentRecord)) {
                                // if ((doc_country == 'MX' && issued_stat != 'cancelando') || doc_country != 'MX') {
                                var send_customer = form.addButton({
                                    id: 'custpage_ei_send_customer',
                                    label: 'EI-MAIL',
                                    functionName: 'Send_Customer(' + par_country + ',' + currentRecord.id + ',' + user.id + ')',
                                });
                                //}

                                form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                            }
                        }
                    }
                }

            } catch (err) {
                log.error("Error", "[ sendEmailCustomer ] " + err);
            }

        }

        function valSendCustomer(par_country, inv_id) {

            try {
                var filters = [];
                var columns = [];

                filters[0] = search.createFilter({
                    name: 'isinactive',
                    operator: search.Operator.IS,
                    values: ['F']
                });

                filters[1] = search.createFilter({
                    name: 'custrecord_lmry_ei_fs_country',
                    operator: search.Operator.IS,
                    values: par_country
                });

                columns[0] = search.createColumn({
                    name: 'custrecord_lmry_ei_fs_status'
                });

                var country_status = search.create({
                    type: 'customrecord_lmry_ei_final_status',
                    columns: columns,
                    filters: filters
                });

                country_status = country_status.run().getRange(0, 10);

                if (country_status != '' && country_status != null) {

                    var filters = [];
                    var columns = [];

                    filters[0] = search.createFilter({
                        name: 'isinactive',
                        operator: search.Operator.IS,
                        values: ['F']
                    });

                    filters[1] = search.createFilter({
                        name: 'custrecord_lmry_ei_ds_doc',
                        operator: search.Operator.IS,
                        values: inv_id
                    });

                    columns[0] = search.createColumn({
                        name: 'custrecord_lmry_ei_ds_doc_status'
                    });

                    var inv_status = search.create({
                        type: 'customrecord_lmry_ei_docs_status',
                        columns: columns,
                        filters: filters
                    });

                    inv_status = inv_status.run().getRange(0, 10);

                    if (inv_status != '' && inv_status != null) {
                        if (inv_status.length > 0) {
                            for (var i = 0; i < country_status.length; i++) {
                                if (country_status[i].getValue('custrecord_lmry_ei_fs_status').toUpperCase() == inv_status[0].getValue('custrecord_lmry_ei_ds_doc_status').toUpperCase()) {
                                    return true;
                                }
                            }
                        }
                    }
                }

            } catch (err) {
                log.error("Error", "[ valSendCustomer ] " + err);
            }

            return false;

        }

        function tieneContactos(country, customerID, idtypetran, banderita, currentRecord) {

            try {

                if (!banderita) {
                    var cust_type = customerType(country, customerID, idtypetran);

                    if (cust_type.individual == true) {
                        if (cust_type.email != '' && cust_type.email != null) {
                            return true;
                        }

                    } else if (cust_type.individual == false) {

                        if (idtypetran == 'invoice' || idtypetran == 'creditmemo' || idtypetran == 'customerpayment' || idtypetran == 'itemfulfillment' || idtypetran == 'cashsale' || idtypetran == 'customerdeposit') {
                            var val_job = search.lookupFields({
                                type: 'customer',
                                id: customerID,
                                columns: ['parent', 'custentity_lmry_entityrelated']
                            });

                            var has_parent = !(customerID == val_job.parent[0].value) // Cuando no tiene padre, el internal ID del customer es igual al de su parent
                            var is_related = val_job.custentity_lmry_entityrelated

                            if(country == 'CL' && has_parent && is_related) customerID = val_job.parent[0].value;
                        }

                        var objSearch = search.create({
                            type: 'contact',
                            columns: [
                                "email",
                                "internalid"
                            ],
                            filters: [
                                ["custentity_lmry_send_email", "is", "T"],
                                "AND",
                                ["company.internalidnumber", "equalto", customerID]
                            ]
                        }).run().getRange(0, 1);

                        if (objSearch != '' && objSearch != null) {
                            if (objSearch.length > 0) {
                                return true;
                            }
                        }
                    }
                } else {
                    var contacts_IDs = [];
                    var subsi_ID = currentRecord.getValue('subsidiary');

                    var contactsSubsi = search.lookupFields({
                        type: 'subsidiary',
                        id: subsi_ID,
                        columns: 'custrecord_lmry_notificar_guia_a'
                    });

                    var contacts_Subsi = contactsSubsi.custrecord_lmry_notificar_guia_a;

                    if (contacts_Subsi != '' && contacts_Subsi != null) {
                        for (var x = 0; x < contacts_Subsi.length; x++) {
                            contacts_IDs.push(contacts_Subsi[x].value);
                        }
                    }

                    if (contacts_IDs.length != 0) {
                        var objSearch = search.create({
                            type: 'contact',
                            columns: [
                                "email",
                                "internalid"
                            ],
                            filters: [
                                ["custentity_lmry_send_email", "is", "T"],
                                "AND",
                                ["internalid", "anyof", contacts_IDs]
                            ]
                        }).run().getRange(0, 10);

                        if (objSearch != '' && objSearch != null) {
                            if (objSearch.length > 0) {
                                return true;
                            }
                        }
                    }
                }

            } catch (err) {
                log.error("Error", "[ tieneContactos ] " + err);
            }

            return false;
        }

        function customerType(country, idcustomer, idtypetran) {

            try {
                if (idtypetran == 'vendorbill' || idtypetran == 'vendorcredit') {
                    var searchcustomer = search.lookupFields({
                        type: 'vendor',
                        id: idcustomer,
                        columns: ['isperson', 'email']
                    });
                } else if (idtypetran == 'invoice' || idtypetran == 'customerpayment' || idtypetran == 'creditmemo' || idtypetran == 'itemfulfillment' || idtypetran == 'customtransaction_lmry_payment_complemnt' || idtypetran == 'customerdeposit') {
                    var val_job = search.lookupFields({
                        type: 'customer',
                        id: idcustomer,
                        columns: ['parent', 'custentity_lmry_entityrelated']
                    });

                    var has_parent = !(idcustomer == val_job.parent[0].value) // Cuando no tiene padre, el internal ID del customer es igual al de su parent
                    var is_related = val_job.custentity_lmry_entityrelated

                    if(country == 'CL' && has_parent && is_related) idcustomer = val_job.parent[0].value

                    var searchcustomer = search.lookupFields({
                        type: 'customer',
                        id: idcustomer,
                        columns: ['isperson', 'email']
                    });

                }

                var obj = {
                    individual: searchcustomer.isperson,
                    email: searchcustomer.email
                }

                return obj;

            } catch (err) {
                log.error("Error", "[ customerType ] " + err);
                var obj = {
                    individual: '',
                    email: ''
                }
            }
        }

        function paisFeatureSendCustomer(pais) {
            switch (pais) {
                case 'AR':
                    return '581'
                case 'BR':
                    return '582'
                case 'PE':
                    return '583'
                case 'MX':
                    return '584'
                case 'CO':
                    return '585'
                case 'CL':
                    return '586'
                case 'BO':
                    return '587'
                case 'CR':
                    return '588'
                case 'EC':
                    return '589'
                case 'PA':
                    return '590'
                case 'UY':
                    return '591'
                case 'GT':
                    return '636'
                case 'BO':
                    return '587'
                case 'DO':
                    return '856'
                case 'PY':
                    return '962'
            }
        }

        function paisFeatureOwn(pais) {
            // Devuelve el id correspondiente al pais para el feature Latam EI Module (Setup), se usa para activar el Own
            switch (pais) {
                case 'AR':
                    return '291'
                case 'BO':
                    return '292'
                case 'BR':
                    return '293'
                case 'CL':
                    return '294'
                case 'CO':
                    return '295'
                case 'CR':
                    return '296'
                case 'EC':
                    return '297'
                case 'MX':
                    return '300'
                case 'PE':
                    return '303'
                case 'UY':
                    return '304'
                case 'PA':
                    return '301'
                case 'GT':
                    return '626'
                case 'DO':
                    return '861'
                case 'PY':
                    return '966'
            }
        }

        function valSendemailStandar(rec) {
            var template_id = search.create({
                type: "customrecord_lmry_ei_cu_msg_t",
                columns: [
                    "internalid"
                ],
                filters: [
                    ["custrecord_lmry_ei_cu_subsi", "anyof", rec.getValue('subsidiary')], "AND",
                    ["custrecord_lmry_ei_cu_doc", "contains", '\"' + rec.getValue('custbody_lmry_document_type') + '\"'], "AND",
                    ["isinactive", "is", "F"],
                ]
            });

            template_id = template_id.run().getRange(0, 1000);

            if (template_id.length > 0) {
                return true;
            } else {

                var feature_templatestandar = config.load({
                    type: config.Type.COMPANY_PREFERENCES
                }).getValue('custscript_lmry_blocksendemail');

                return !feature_templatestandar;

            }
        }

        /* ******************************************************************** * 
         * Preprinted Number Massive (Invoice) C0559 - C0587 - D0466
         * Date: 15/08/2022
         * ******************************************************************** */
        function numberPreprintedMassive(RCD) {
            var subsidiary = RCD.getValue({
                fieldId: 'subsidiary'
            });
            all_Licenses = ei_library.getLicenses(subsidiary);
            doc_country = ei_library.getCountryID(subsidiary).code;
            var LMRY_Intern = RCD.id;
            var featuresByCountry = {
                'CO': {
                    'tranId': 65,
                    'number': 387,
                    'numberMassive': 876
                },
                'MX': {
                    'tranId': 25,
                    'number': 132,
                    'numberMassive': 889
                },
                'PA': {
                    'tranId': 59,
                    'number': 391,
                    'numberMassive': 891
                }
            }
            var featureId = featuresByCountry[doc_country];
            if (featureId) {
                var type_document = RCD.getValue('custbody_lmry_document_type');
                var type_serie = RCD.getValue('custbody_lmry_serie_doc_cxc');
                if (type_document && type_document != -1 && type_serie && type_serie != -1) {
                    if (ei_library.getAuthorization(featureId.number, all_Licenses) == false &&
                        ei_library.getAuthorization(featureId.tranId, all_Licenses) == true &&
                        ei_library.getAuthorization(featureId.numberMassive, all_Licenses) == true) {
                        Library_NumberPreprinted.setPreprintedNumber(LMRY_Intern, type_serie, subsidiary, doc_country);
                    }
                }
            }
        }

        function buttonNumberPreprinted(RCD, obj_form) {
            var subsidiary = RCD.getValue({
                fieldId: 'subsidiary'
            });
            all_Licenses = ei_library.getLicenses(subsidiary);
            // doc_country = ei_library.getCountryID(subsidiary).code;
            var LMRY_Intern = RCD.id;
            var featuresByCountry = {
                'CO': {
                    'tranId': 65,
                    'number': 387,
                    'numberMassive': 876
                },
                'MX': {
                    'tranId': 25,
                    'number': 132,
                    'numberMassive': 889
                },
                'PA': {
                    'tranId': 59,
                    'number': 391,
                    'numberMassive': 891
                }
            }
            var featureId = featuresByCountry[doc_country];
            if (featureId) {
                var type_document = RCD.getValue('custbody_lmry_document_type');
                var type_serie = RCD.getValue('custbody_lmry_serie_doc_cxc');
                if (type_document && type_document != -1 && type_serie && type_serie != -1) {
                    if (ei_library.getAuthorization(featureId.number, all_Licenses) == false &&
                        ei_library.getAuthorization(featureId.tranId, all_Licenses) == true &&
                        ei_library.getAuthorization(featureId.numberMassive, all_Licenses) == true) {
                        var num_Search = search.create({
                            type: 'customrecord_lmry_number_preprinted',
                            columns: ['internalid', 'custrecord_lmry_preprint_tranid', 'custrecord_lmry_preprint_number'],
                            filters: [
                                ['custrecord_lmry_preprint_transaction', 'is', LMRY_Intern]
                            ]
                        });
                        num_Search = num_Search.run().getRange(0, 1);
                        if (num_Search != '' && num_Search != null && num_Search.length > 0) {
                            var tranid = RCD.getValue('tranid');
                            var newTranid = num_Search[0].getValue('custrecord_lmry_preprint_tranid');
                            var newNumber = num_Search[0].getValue('custrecord_lmry_preprint_number');
                            if (tranid != newTranid && newTranid != '' && newTranid != null) {
                                obj_form.addButton({
                                    id: 'custpage_button_preprinted',
                                    label: 'Generate Preprinted Number',
                                    functionName: 'onclick_event_updateTranid(' + LMRY_Intern + ',"' + newTranid + '","' + newNumber + '")'
                                });
                                obj_form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                            }
                        } else {
                            obj_form.addButton({
                                id: 'custpage_button_preprinted',
                                label: 'Generate Preprinted Number',
                                functionName: 'onclick_event_preprintedNumber(' + LMRY_Intern + ',"' + type_serie + '","' + subsidiary + '")'
                            });
                            obj_form.clientScriptModulePath = './LMRY_EI_MAIN_CLNT_V2.0.js';
                        }
                    }
                }
            }
        }

        function removeDecimalLine(recordObj) {
            var numLines = recordObj.getLineCount({ sublistId: "item" });
            var lineDecimal = 0;
            for (var i = 0; i < numLines; i++) {
                var flagDecimal = recordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_lmry_col_exclude_line',
                    line: i
                });
                if (flagDecimal == true || flagDecimal == "T") {
                    lineDecimal = i;
                    break;
                }
            }
            if (lineDecimal != 0) {
                recordObj.removeLine({
                    sublistId: "item",
                    line: lineDecimal,
                    ignoreRecalc: true
                });
            }
        }

        function addDecimalLine(recordObj) {
            var subsidiary = recordObj.getValue("subsidiary");
            var taxtotal = recordObj.getValue("taxtotal");
            var numLines = recordObj.getLineCount({ sublistId: "item" });
            var taxTotalReal = 0;
            var amountBalance = 0;
            //MX Fel Enabled Features
            var setupMXFel = getMXFelEnabledFeature(subsidiary);
            if(setupMXFel["success"]){
                if (!setupMXFel.hasOwnProperty("adjItem") || !setupMXFel.hasOwnProperty("adjTaxCode") || !setupMXFel.hasOwnProperty("adjCheck")) {
                    return true;
                }
                if (setupMXFel["adjCheck"] == "F" || setupMXFel["adjCheck"] == false) {
                    return true;
                }
                if (!setupMXFel["adjItem"] || !setupMXFel["adjTaxCode"]) {
                    return true;
                }
                for (var i = 0; i < numLines; i++) {
                    var itemType = recordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemtype',
                        line: i
                    });
                    if (itemType == "Group" || itemType == "EndGroup") {
                        continue;
                    }
                    var itemQuantity = recordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i
                    });
                    var itemRate = parseFloat(recordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxrate1',
                        line: i
                    })) / 100;
                    var taxamount = round4(itemQuantity * itemRate);
                    taxTotalReal = taxTotalReal + taxamount;
                }
                amountBalance = round4(taxTotalReal - taxtotal);
                if (amountBalance != 0) {
                    recordObj.insertLine({ sublistId: "item", line: numLines });
                    recordObj.setSublistValue({ sublistId: "item", fieldId: "item", line: numLines, value: setupMXFel["adjItem"] });
                    recordObj.setSublistValue({ sublistId: "item", fieldId: "price", line: numLines, value: -1, });
                    recordObj.setSublistValue({ sublistId: "item", fieldId: "rate", line: numLines, value: amountBalance });
                    recordObj.setSublistValue({ sublistId: "item", fieldId: "taxcode", line: numLines, value: setupMXFel["adjTaxCode"] });
                    recordObj.setSublistValue({ sublistId: "item", fieldId: "custcol_lmry_col_exclude_line", line: numLines, value: true });
                    recordObj.setSublistValue({ sublistId: "item", fieldId: "custcol_lmry_apply_wht_tax", line: numLines, value: false });
                    recordObj.setSublistValue({ sublistId: "item", fieldId: "custcol_4601_witaxapplies", line: numLines, value: false });
                }
            }
        }

        function round4(num) {
            var e = (num >= 0) ? 1e-6 : -1e-6;
            return parseFloat(Math.round(parseFloat(num) * 1e4 + e) / 1e4);
        }

        function getMXFelEnabledFeature(subsidiary) {
            try{
                var setupMXFelObj = {};
                FEAT_SUBSIDIARY = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                var searchMXFel = search.create({
                    type: "customrecord_lmry_mx_fel_enable_feature",
                    filters: [
                        ["isinactive", "is", "F"]
                    ],
                    columns: ["custrecord_lmry_mx_fel_tax_calc_item", "custrecord_lmry_mx_fel_tax_calc_taxcode", "custrecord_lmry_mx_fel_tax_calc_enable"]
                });
                if (FEAT_SUBSIDIARY == true || FEAT_SUBSIDIARY == "T") {
                    searchMXFel.filters.push(search.createFilter({
                        name: "custrecord_lmry_mx_fel_subsi",
                        operator: search.Operator.ANYOF,
                        values: subsidiary
                    }));
                }
                var resultMXFel = searchMXFel.run().getRange(0, 1);
                if (resultMXFel.length > 0) {
                    setupMXFelObj = {
                        "success": true,
                        "adjItem": resultMXFel[0].getValue("custrecord_lmry_mx_fel_tax_calc_item"),
                        "adjTaxCode": resultMXFel[0].getValue("custrecord_lmry_mx_fel_tax_calc_taxcode"),
                        "adjCheck": resultMXFel[0].getValue("custrecord_lmry_mx_fel_tax_calc_enable"),
                    }
                }
                return setupMXFelObj;
            } catch (e) {
                log.error('[getMXFelEnabledFeature]', e)
                return {"success":false}
            }
        }

        return {
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit,
            beforeSubmit: beforeSubmit
        };

    });