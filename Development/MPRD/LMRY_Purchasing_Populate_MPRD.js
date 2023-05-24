/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for EI Avance Flow & Universal Setting         ||
||                                                              ||
||  File Name: LMRY_Purchasing_Populate_MPRD.js                 ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 01 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
* @NApiVersion 2.0
* @NScriptType MapReduceScript
* @NModuleScope Public
*/
define(['N/config', 'N/email', 'N/log', 'N/url', 'N/record', 'N/search', 'N/runtime', 'N/file',
    './EI_Library/LMRY_IP_libSendingEmailsLBRY_V2.0', './EI_Library/LMRY_EI_libSendingEmailsLBRY_V2.0',
    './EI_Conection/LMRY_EI_Conection_handler_LBRY_v2.0',
    '/SuiteBundles/Bundle 37714/Latam_Library/LMRY_UniversalSetting_Purchase_LBRY',
    '/SuiteBundles/Bundle 37714/WTH_Library/LMRY_BR_Massive_WTH_TXR_LBRY_V2.0',
    '/SuiteBundles/Bundle 37714/Latam_Library/LMRY_Log_LBRY_V2.0'
],

    function (config, email, log, url, record, search, runtime, file, libraryEmail, libraryFeature, libraryHandler, libraryUS, libraryBRWthTxr, logLbry) {


        //245636 : DESARROLLO
        //243159 : QA
        var scriptObj = runtime.getCurrentScript();
        var LMRY_script = 'Latamready - Purchasing Populate MPRD';

        var userId = scriptObj.getParameter({ name: 'custscript_lmry_ip_params_user_purchase' });
        var stateId = scriptObj.getParameter({ name: 'custscript_lmry_ip_params_state_purchase' });

        var subsiOW = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });

        var Language = runtime.getCurrentScript().getParameter({ name: 'LANGUAGE' });
        Language = Language.substring(0, 2);

        /**
        * Input Data for processing
        *
        * @return Array,Object,Search,File
        *
        * @since 2016.1
        */
        function getInputData() {

            try {

                var scriptObj = runtime.getCurrentScript();

                log.debug('user y state', userId + "-" + stateId);

                var currentLog = search.lookupFields({ type: 'customrecord_lmry_invoicing_populate', id: stateId, columns: ['custrecord_lmry_ip_transactions', 'custrecord_lmry_ip_subsidiary.country', 'custrecord_lmry_ip_subsidiary'] });

                if (subsiOW) {
                    var country = currentLog['custrecord_lmry_ip_subsidiary.country'][0].text;
                    country = country.substring(0, 3).toUpperCase();
                    var country_without = country;
                    country = validarAcentos(country);

                    var licenses = libraryFeature.getLicenses(currentLog.custrecord_lmry_ip_subsidiary[0].value);

                } else {
                    var countryConfig = config.load({ type: config.Type.COMPANY_INFORMATION });
                    var country = countryConfig.getText({ fieldId: 'country' });
                    country = country.substring(0, 3).toUpperCase();

                    var country_without = country;
                    country = validarAcentos(country);

                    var allLicenses = libraryFeature.getAllLicenses();
                    var keyMid = Object.keys(allLicenses)[0];
                    var licenses = libraryFeature.getLicenses(keyMid);

                }

                var subsidiariaGet = currentLog['custrecord_lmry_ip_subsidiary'][0].value;

                var idFeature = {
                    'AR': 341, 'BO': 704, 'BR': 339, 'CL': 342, 'CO': 343, 'CR': 523, 'EC': 601, 'GT': 706, 'MX': 338, 'PA': 441, 'PE': 344, 'UY': 647
                };

                //FUNCIONES OPTIMIZAR: SOLO UNA VEZ
                var fVip = false, fPreimpreso = false;

                if (subsiOW) {
                    fVip = libraryFeature.getAuthorization(idFeature[currentLog['custrecord_lmry_ip_subsidiary.country'][0].value], licenses);
                    fPreimpreso = validarPreimpreso(licenses, currentLog['custrecord_lmry_ip_subsidiary.country'][0].value);
                } else {
                    fVip = libraryFeature.getAuthorization(idFeature[countryConfig.getValue('country')], licenses);
                    fPreimpreso = validarPreimpreso(licenses, countryConfig.getValue('country'));
                }

                //UNIVERSAL SETTING
                var fUniversalSetting = libraryUS.auto_universal_setting_purchase(licenses, false);

                //TRANID
                var fTranid = false;
                if (country == 'BRA') {
                    if (libraryFeature.getAuthorization(140, licenses) && libraryFeature.getAuthorization(308, licenses)) {
                        fTranid = true;
                    }
                }

                log.debug('Features: Vip - US - Tranid', [fVip, fUniversalSetting, fTranid].join('-'));

                //FEATURES DE DESARROLLOS
                var fWthTxrBR = false, fDifalAuto = false;

                switch (country) {
                    case 'BRA':
                        fWthTxrBR = libraryFeature.getAuthorization(670, licenses);
                        fDifalAuto = libraryFeature.getAuthorization(648, licenses);
                        break;
                }

                //JSON DE TRANSACCIONES
                var idTransacciones = currentLog.custrecord_lmry_ip_transactions;
                idTransacciones = idTransacciones.split('|');

                //SOLO BRAZIL: RPS
                if (subsiOW) {
                    var jsonRPS = allGetRps(idTransacciones, currentLog.custrecord_lmry_ip_subsidiary[0].value, country);
                } else {
                    var jsonRPS = allGetRps(idTransacciones, '', country);
                }

                idTransacciones.push('');

                //JSON PARA LOS MAPS
                var pruebaJson = [];
                for (var i = 0; i < idTransacciones.length - 1; i++) {

                    pruebaJson.push({
                        key: i,
                        values: {
                            IDcurrentTransaction: idTransacciones[i],
                            country: country,
                            subsidiaryGet: subsidiariaGet,
                            state: stateId,
                            countryWithout: country_without,
                            fVip: fVip,
                            fPreimpresoB: fPreimpreso[1],
                            fPreimpresoBC: fPreimpreso[2],
                            fTranid: fTranid,
                            cantidadTransacciones: idTransacciones.length - 1,
                            countCurrentTransaction: i + 1,
                            fUniversalSetting: fUniversalSetting,
                            fWthTxrBR: fWthTxrBR,
                            fDifalAuto: fDifalAuto,
                            licenses: licenses,
                            rps: jsonRPS[idTransacciones[i]]
                        }
                    });
                }

                var id = record.submitFields({
                    type: 'customrecord_lmry_invoicing_populate', id: stateId,
                    values: { custrecord_lmry_ip_state: '1', custrecord_lmry_ip_user: userId, custrecord_lmry_ip_count: ("" + parseInt(idTransacciones.length - 1)) },
                    options: { enableSourcing: false, ignoreMandatoryFields: true, disableTriggers: true }
                });

                return pruebaJson;

            } catch (error) {

                var id = record.submitFields({
                    type: 'customrecord_lmry_invoicing_populate', id: stateId,
                    values: { custrecord_lmry_ip_state: '2' },
                    options: { enableSourcing: false, ignoreMandatoryFields: true, disableTriggers: true }
                });
                logLbry.doLog({ tittle: '[getInputData Context]', message: error, relatedScript: LMRY_script });
                libraryEmail.sendemail(' [ getInputData ] ' + error, LMRY_script);

            }

        }


        /**
        * If this entry point is used, the map function is invoked one time for each key/value.
        *
        * @param {Object} context
        * @param {boolean} context.isRestarted - Indicates whether the current invocation represents a restart
        * @param {number} context.executionNo - Version of the bundle being installed
        * @param {Iterator} context.errors - This param contains a "iterator().each(parameters)" function
        * @param {string} context.key - The key to be processed during the current invocation
        * @param {string} context.value - The value to be processed during the current invocation
        * @param {function} context.write - This data is passed to the reduce stage
        *
        * @since 2016.1
        */
        function map(context) {

        }


        /**
        * If this entry point is used, the reduce function is invoked one time for
        * each key and list of values provided..
        *
        * @param {Object} context
        * @param {boolean} context.isRestarted - Indicates whether the current invocation represents a restart
        * @param {number} context.executionNo - Version of the bundle being installed
        * @param {Iterator} context.errors - This param contains a "iterator().each(parameters)" function
        * @param {string} context.key - The key to be processed during the current invocation
        * @param {string} context.value - The value to be processed during the current invocation
        * @param {function} context.write - This data is passed to the reduce stage
        *
        * @since 2016.1
        */
        function reduce(context) {

            try {

                var isFact = false;
                var posible_error = 'Populado';

                var currenData = context.values;
                currenData = JSON.parse(currenData[0]);

                var current_transaction = currenData.values.IDcurrentTransaction;
                var country = currenData.values.country;
                var subsidiaryMap = currenData.values.subsidiaryGet;
                var state = currenData.values.state;
                var country_acento = currenData.values.countryWithout;
                var feature_vip = currenData.values.fVip;
                var featurePreimpresoB = currenData.values.fPreimpresoB;
                var featurePreimpresoBC = currenData.values.fPreimpresoBC;
                var feature_tranid = currenData.values.fTranid;
                var totalTransacciones = currenData.values.cantidadTransacciones;
                var numeroTransaccionActual = currenData.values.countCurrentTransaction;
                var featureUniversalSetting = currenData.values.fUniversalSetting;
                var featureWthTxrBR = currenData.values.fWthTxrBR;
                var featureDifalAuto = currenData.values.fDifalAuto;
                var currentRPS = currenData.values.rps;
                var licensesSub = currenData.values.licenses;
                //ACTUALIZACION PORCENTAJE
                setPercentage();

                if (context.isRestarted && context.executionNo > 1) {
                    posible_error = 'Reinicio';
                    var status_search = search.create({
                        type: search.Type.TRANSACTION,
                        columns: [
                            "custbody_lmry_processed_transaction",
                            search.createColumn({ name: "internalid", join: "CUSTRECORD_LMRY_EI_DS_DOC" })
                        ],
                        filters: [
                            { name: 'internalid', operator: 'anyof', values: [current_transaction] },
                            { name: 'mainline', operator: 'is', values: 'T' }
                        ]
                    }).run().getRange(0, 1);
                    var isFactura = (status_search[0].getValue('custbody_lmry_processed_transaction') == 2) ? true : false;
                    var idDocStatus = status_search[0].getValue({ name: "internalid", join: "CUSTRECORD_LMRY_EI_DS_DOC" });
                    if (idDocStatus) {
                        record.submitFields({
                            type: "customrecord_lmry_ei_docs_status",
                            id: idDocStatus,
                            values: {
                                custrecord_lmry_ei_ds_restart: "1"
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    }
                    else {
                        var objRecord = record.create({
                            type: "customrecord_lmry_ei_docs_status",
                            isDynamic: true
                        });
                        objRecord.setValue({
                            fieldId: 'custrecord_lmry_ei_ds_doc',
                            value: current_transaction
                        });
                        objRecord.setValue({
                            fieldId: 'custrecord_lmry_ei_ds_subsi',
                            value: subsidiaryMap
                        });
                        objRecord.setValue({
                            fieldId: 'custrecord_lmry_ei_ds_restart',
                            value: "1"
                        });
                        objRecord.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        });
                    }
                    context.write({
                        key: current_transaction,
                        value: [state, 'R', country, posible_error, feature_vip, isFactura, totalTransacciones]
                    });
                    return false;
                }

                var search_transaction = search.lookupFields({ type: search.Type.TRANSACTION, columns: ['type'], id: current_transaction });
                search_transaction = search_transaction.type[0].value;

                var type_transaction = '', featurePreimpresoTransaction = false;
                var idTransaction = 17;

                if (search_transaction == 'VendBill') {
                    type_transaction = 'vendorbill';
                    featurePreimpresoTransaction = featurePreimpresoB;
                }
                if (search_transaction == 'VendCred') {
                    type_transaction = 'vendorcredit';
                    featurePreimpresoTransaction = featurePreimpresoBC;
                    idTransaction = 20;
                }

                // **************************************
                // load para Actualizacion de Campos
                // **************************************
                var id_load = record.load({ type: type_transaction, id: current_transaction });

                isFact = (id_load.getValue('custbody_lmry_processed_transaction') == 2) ? true : false;

                // Populado Set Automatic Setting
                var document_type = id_load.getValue({ fieldId: 'custbody_lmry_document_type' });
                var seteoUS = false;

                if (featureUniversalSetting == true) {
                    libraryUS.set_inv_identifier_purchase(id_load);
                    if (document_type == null || document_type == '') {
                        libraryUS.automatic_setfield_purchase(id_load, false);
                        libraryUS.automatic_setfieldrecord_purchase(id_load);
                        libraryUS.set_template_purchase(id_load, licensesSub);
                        seteoUS = true;
                    }
                }

                //Campos de facturacion : E-Document Template y E-Document Sending Methods
                var ei_sending_templa = id_load.getValue({ fieldId: 'custbody_psg_ei_template' });
                var ei_sending_method = id_load.getValue({ fieldId: 'custbody_psg_ei_sending_method' });

                //Si existe template y sending method se cambio el estado For generation
                if (ei_sending_templa && ei_sending_method) {
                    // Se cambia el valor de :E-Document Status
                    id_load.setValue({ fieldId: 'custbody_psg_ei_status', value: 1 });
                }

                var sw_Continue = true;

                // Se valida si el tipo de documento fiscal no esta vacio
                var document_type = id_load.getValue({ fieldId: 'custbody_lmry_document_type' });
                if (document_type != null && document_type != '') {

                    var search_doc_cod = '';
                    if (country == 'BRA') {
                        search_doc_cod = search.lookupFields({ type: 'customrecord_lmry_tipo_doc', id: document_type, columns: ['custrecord_lmry_codigo_doc'] });
                        search_doc_cod = search_doc_cod.custrecord_lmry_codigo_doc;
                        //Feature de preimpreso para los documentos con código 55 y 57

                        if (search_doc_cod != '55' && search_doc_cod != '57') {
                            featurePreimpresoTransaction = false;
                        }
                    }

                    // Seteo del Pre-impreso en la transaccion
                    var serie_cxc = id_load.getValue({ fieldId: 'custbody_lmry_serie_doc_cxc' });
                    if (serie_cxc != null && serie_cxc != '' && serie_cxc != -1 && featurePreimpresoTransaction == true) {
                        setearPreImpreso(id_load, country, feature_tranid);
                    }

                    // Para el automático OWN
                    var ei_automatic = false;
                    if (feature_vip == true) {
                        ei_automatic = true;
                    }

                    // Se cambia el valor de : Latam - EI Automatic
                    id_load.setValue({ fieldId: 'custbody_lmry_mx_ei_automatic', value: ei_automatic });

                    if (country == 'BRA') {

                        //Log de ayuda
                        log.debug('Cantidad de lineas', current_transaction + ": " + id_load.getLineCount({ sublistId: 'item' }));

                        // Se cambia el valor de : Latam - Applied WHT CODE
                        id_load.setValue({ fieldId: 'custbody_lmry_apply_wht_code', value: true });

                        // Logica para Inventariable
                        if (search_doc_cod == '55') {
                            posible_error = 'Tax Calculator';
                            log.debug('TAX CALCULATOR INICIO', 'TAX CALCULATOR INICIO');
                            //SETEO DEL CAMPO OCULTO BR TRANSACTION TYPE SI ESTA VACIO: CARGAS CSV SIN CHECK
                            if (!id_load.getValue('custbody_lmry_br_transaction_type')) {
                                setTransactionType(id_load);
                            }

                            if (id_load.getValue('custbody_lmry_br_transaction_type')) {
                                var id_con = idConnectionStatus(id_load, document_type, current_transaction, idTransaction);

                                if (type_transaction == 'vendorbill' || type_transaction == 'vendorcredit') {
                                    // Transaction , tax_purchase, pop_up
                                    var jsonTC = getCountJsonTC(id_load, true, true);
                                    if (jsonTC == 0) {
                                        //Llama a la libreria Tax Calculator
                                        //'/SuiteBundles/Bundle 247582/EI Tax Calculator 2.0 Brasil/LMRY_BR_EI_TAXC_LBRY_V2.0.js',library_taxcalc
                                        require(['/SuiteBundles/Bundle 247582/EI Tax Calculator 2.0 Brasil/LMRY_BR_EI_TAXC_LBRY_V2.0.js'],
                                            function (library_taxcalc) {

                                                sw_Continue = library_taxcalc.calculateTaxes(id_load);
                                            });
                                        //sw_Continue = library_taxcalc.calculateTaxes(id_load);
                                    }
                                }
                            }
                        }
                    }

                    //SETEO DE CAMPOS DE E-DOCUMENT EN BLANCO CUANDO ES EL VIP
                    if (feature_vip) {
                        id_load.setValue({ fieldId: 'custbody_psg_ei_template', value: '' });
                        id_load.setValue({ fieldId: 'custbody_psg_ei_sending_method', value: '' });
                        id_load.setValue({ fieldId: 'custbody_psg_ei_status', value: '' });
                    }

                }

                // Graba la transaccion actualizada
                //CAMBIAR ESTADO WTH//
                if (country == 'BRA' && type_transaction == 'vendorbill') {
                    if (id_load.getValue('custbody_lmry_scheduled_process') == false || id_load.getValue('custbody_lmry_scheduled_process') == 'F') {
                        id_load.setValue({ fieldId: 'custbody_lmry_apply_wht_code', value: false });
                    }
                }
                id_load.save({ ignoreMandatoryFields: true, disableTriggers: true });

                if (country == 'BRA' && seteoUS == true && type_transaction == 'vendorbill') {
                    if (id_load.getValue('custbody_lmry_scheduled_process') == false || id_load.getValue('custbody_lmry_scheduled_process') == 'F') {
                        // Transaction , tax_purchase, pop_up
                        var jsonTC = getCountJsonTC(id_load, false, true);
                        if (jsonTC == 0) {
                            var featureMassBill = featureWthTxrBR;
                            var featureDifalAutomatic = featureDifalAuto;
                            //TAX RESULT Calculo de Impuestos BR LatamTax
                            libraryBRWthTxr.getTaxPurchaseMassive(id_load, featureDifalAutomatic);
                            //TAX RESULT Retenciones BR LatamWHT
                            libraryBRWthTxr.getWithholdingTaxMassive(id_load, userId, featureMassBill);
                        }
                    }
                }

                // **************************************
                // Fin para Actualizacion de Campos
                // **************************************

                if (document_type != null && document_type != '') {
                    //AUTOFACT
                    if (feature_vip == true && sw_Continue) {
                        posible_error = 'Generacion y Envio';
                        var id_load4 = '';
                        if (country == 'BRA') {
                            var search_br_tran = search.create({
                                type: 'customrecord_lmry_br_transaction_fields',
                                filters: [{ name: 'custrecord_lmry_br_related_transaction', operator: 'is', values: current_transaction }],
                                columns: ['internalid']
                            });

                            var result_br_tran = search_br_tran.run().getRange({ start: 0, end: 1 });
                            if (result_br_tran != null && result_br_tran.length > 0) {
                                id_load4 = record.load({ type: 'customrecord_lmry_br_transaction_fields', id: result_br_tran[0].getValue('internalid') });
                            }

                        }
                        // Valida que continue con el proceso
                        if (id_load4 != '' && sw_Continue) {

                            //BUSQUEDA TIPO DE DOCUMENTO
                            var filtros_document = [], json_document = {};
                            filtros_document[0] = search.createFilter({ name: 'isinactive', operator: 'is', values: 'F' });
                            filtros_document[1] = search.createFilter({ name: 'custrecord_lmry_fact_electronica', operator: 'is', values: 'T' });
                            filtros_document[2] = search.createFilter({ name: 'formulatext', formula: '{custrecord_lmry_country_applied}', operator: 'startswith', values: country_acento });

                            var search_document = search.create({ type: 'customrecord_lmry_tipo_doc', columns: ['internalid'], filters: filtros_document });
                            var result_document = search_document.run().getRange({ start: 0, end: 1000 });
                            if (result_document != null && result_document.length > 0) {
                                for (var i = 0; i < result_document.length; i++) {
                                    json_document[result_document[i].getValue('internalid')] = result_document[i].getValue('internalid');
                                }
                            }
                            if (json_document[document_type]) {
                                try {
                                    libraryHandler.generate_and_send(country, id_load4, currentRPS);
                                } catch (error) {
                                    log.error('error', error);
                                    libraryEmail.sendemail(' [ generate_and_send Reduce] ' + error, LMRY_script);
                                }
                            }

                        }
                    }
                    // }
                }

                posible_error = '';
                context.write({ key: current_transaction, value: [state, 'T', country, posible_error, feature_vip, isFact, totalTransacciones] });

            } catch (err) {

                log.error('Error catch [REDUCE]', err.valueOf().toString());
                logLbry.doLog({ tittle: '[reduce Context]', message: err, relatedScript: LMRY_script });
                record.submitFields({
                    type: 'customrecord_lmry_invoicing_populate', id: state,
                    values: { custrecord_lmry_ip_count: totalTransacciones + "|" + numeroTransaccionActual },
                    options: { enableSourcing: false, ignoreMandatoryFields: true, disableTriggers: true }
                });

                if (err.valueOf().toString().indexOf("SSS_REQUEST_TIME_EXCEEDED") == -1) {
                    context.write({ key: current_transaction, value: [state, 'F', country, posible_error, feature_vip, isFact, totalTransacciones] });
                } else {
                    context.write({ key: current_transaction, value: [state, 'T', country, posible_error, feature_vip, isFact, totalTransacciones] });
                }

            }

        }

        /**
        * If this entry point is used, the reduce function is invoked one time for
        * each key and list of values provided..
        *
        * @param {Object} context
        * @param {boolean} context.isRestarted - Indicates whether the current invocation of the represents a restart.
        * @param {number} context.concurrency - The maximum concurrency number when running the map/reduce script.
        * @param {Date} context.datecreated - The time and day when the script began running.
        * @param {number} context.seconds - The total number of seconds that elapsed during the processing of the script.
        * @param {number} context.usage - TThe total number of usage units consumed during the processing of the script.
        * @param {number} context.yields - The total number of yields that occurred during the processing of the script.
        * @param {Object} context.inputSummary - Object that contains data about the input stage.
        * @param {Object} context.mapSummary - Object that contains data about the map stage.
        * @param {Object} context.reduceSummary - Object that contains data about the reduce stage.
        * @param {Iterator} context.ouput - This param contains a "iterator().each(parameters)" function
        *
        * @since 2016.1
        */
        function summarize(context) {

            try {

                var state = '';
                var transaction_f = '';
                var c1 = 0, c2 = 0;
                var country = '';
                var posible_error = '';
                var lista_invoices = [];
                var feature_vip = '';
                var isFact = [];
                var totalTransacciones = 0;

                context.output.iterator().each(function (key, value) {
                    value = JSON.parse(value);
                    state = value[0];
                    country = value[2];
                    feature_vip = value[4];
                    isFact.push(value[5]);
                    totalTransacciones = value[6];

                    c1++;
                    lista_invoices.push(key);

                    if (value[1] == 'F' || value[1] == 'R') {
                        transaction_f = transaction_f + key + "|";
                        posible_error = posible_error + value[3] + "|";
                        c2++;
                    }

                    return true;
                });

                var link = url.resolveScript({ scriptId: 'customscript_lmry_ei_mass_edocument_stlt', deploymentId: 'customdeploy_lmry_ei_mass_edocument_stlt', returnExternalUrl: false });

                var r_load = record.load({ type: 'customrecord_lmry_invoicing_populate', id: stateId });

                var subsidiary = subsiOW ? r_load.getText({ fieldId: 'custrecord_lmry_ip_subsidiary' }) : '';

                if (c1 != c2 && feature_vip == false) {
                    r_load.setValue({ fieldId: 'custrecord_lmry_ip_url', value: link });
                }

                //SETEAR SIEMPRE EL 100%
                /*if(totalTransacciones == lista_invoices.length){
                }*/

                if (lista_invoices.length > 0) {
                    r_load.setValue({ fieldId: 'custrecord_lmry_ip_count', value: (lista_invoices.length + "|" + lista_invoices.length) });
                }

                if (transaction_f == '') {
                    r_load.setValue({ fieldId: 'custrecord_lmry_ip_state', value: '3' });
                } else {
                    r_load.setValue({ fieldId: 'custrecord_lmry_ip_state', value: '4-' + transaction_f });
                    r_load.setValue({ fieldId: 'custrecord_lmry_ip_error', value: posible_error });
                }

                r_load.save({ disableTriggers: true, ignoreMandatoryFields: true });

                //ENVIO DE CORREO EXITOSOS
                if (feature_vip == true) {
                    sleep(10000);
                    status(country, lista_invoices, subsidiary, isFact);
                }

            } catch (error) {
                logLbry.doLog({ tittle: '[Summarize Context]', message: error, relatedScript: LMRY_script });
                libraryEmail.sendemail(' [ Summarize ] ' + error, LMRY_script);
                log.error('Summarize', error);
            }

        }

        function validarPreimpreso(licenses, country) {
            var devolver = [false, false];

            //Localizacion - Transaction Number Bill - TN Bill Credit
            var features = {
                'BR': [140, 650, 667]
            };

            if (features[country]) {
                for (var i = 0; i < features[country].length; i++) {
                    if (!libraryFeature.getAuthorization(features[country][0], licenses)) {
                        break;
                    }
                    devolver[i] = libraryFeature.getAuthorization(features[country][i], licenses);
                }
            }

            return devolver;

        }


        function setearPreImpreso(invoice, country, feature_tranid) {
            var preImpreso = invoice.getValue('custbody_lmry_num_preimpreso');
            if (country == 'BRA') {

                var serieCxc = invoice.getValue('custbody_lmry_serie_doc_cxc');
                if (preImpreso == null || preImpreso == '') {
                    // Trae el ultimo numero pre-impreso
                    var wtax_type = search.create({
                        type: "customrecord_lmry_serie_impresion_cxc",
                        filters: [
                            ["internalid", "anyof", serieCxc]
                        ],
                        columns: [
                            search.createColumn({
                                name: "formulanumeric",
                                formula: "{custrecord_lmry_serie_numero_impres}"
                            }),
                            "custrecord_lmry_serie_rango_fin",
                            "custrecord_lmry_serie_num_digitos"
                        ]
                    });
                    var results = wtax_type.run().getRange(0, 1);
                    var columns = wtax_type.columns;
                    var nroConse = parseInt(results[0].getValue(columns[0])) + 1;
                    var nroConse_2 = nroConse;
                    var maxPermi = parseInt(results[0].getValue(columns[1]));
                    var digitos = parseInt(results[0].getValue(columns[2]));

                    if (digitos != null && digitos != '' && nroConse <= maxPermi) {
                        var longNumeroConsec = parseInt((nroConse + '').length);
                        var llenarCeros = '';
                        for (var i = 0; i < (digitos - longNumeroConsec); i++) {
                            llenarCeros += '0';
                        }
                        nroConse = llenarCeros + nroConse;

                        if (nroConse != null && nroConse != '') {
                            invoice.setValue({ fieldId: 'custbody_lmry_num_preimpreso', value: nroConse });

                            // Actualiza el numero Correlativo en las series de impresion
                            var upd_serie = record.submitFields({
                                type: 'customrecord_lmry_serie_impresion_cxc', id: serieCxc,
                                values: { 'custrecord_lmry_serie_numero_impres': nroConse_2 }, options: { disableTriggers: true, ignoreMandatoryFields: true }
                            });
                        }

                        // Valida Feature y actualiza la transaccion
                        setearTranId(invoice, country, feature_tranid);
                    }
                }

            }// NO ES MX


        }

        function setearTranId(invoice, country, feature_tranid) {

            if (feature_tranid == true) {

                posible_error = 'Tranid';

                var urlpais = runtime.getCurrentScript().getParameter('custscript_lmry_netsuite_location');

                var tranprefix = '';
                if (subsiOW) {
                    var subsidiaria = invoice.getValue({ fieldId: 'subsidiary' });
                    tranprefix = getPrefijo(subsidiaria);
                }

                var DocuTipo = invoice.getValue({ fieldId: 'custbody_lmry_document_type' });
                if (DocuTipo != null && DocuTipo != '') {
                    DocuTipo = search.lookupFields({ type: 'customrecord_lmry_tipo_doc', id: DocuTipo, columns: ['custrecord_lmry_doc_initials'] });
                    DocuTipo = DocuTipo.custrecord_lmry_doc_initials;
                }
                if (DocuTipo == '' || DocuTipo == null) {
                    DocuTipo = '';
                }
                var DocuSeri = invoice.getValue({ fieldId: 'custbody_lmry_serie_doc_cxc' });
                if (DocuSeri != null && DocuSeri != '') {
                    DocuSeri = search.lookupFields({ type: 'customrecord_lmry_serie_impresion_cxc', id: DocuSeri, columns: ['name'] });
                    DocuSeri = DocuSeri.name;
                }
                var DocuPrei = invoice.getValue({ fieldId: 'custbody_lmry_num_preimpreso' });

                var texto = '';
                if (tranprefix != '' && tranprefix != null) {
                    texto = tranprefix + ' ' + DocuTipo.toUpperCase() + ' ' + DocuSeri + '-' + DocuPrei;
                } else {
                    texto = DocuTipo.toUpperCase() + ' ' + DocuSeri + '-' + DocuPrei;
                }

                if (texto != '' && texto != null) {
                    invoice.setValue({ fieldId: 'tranid', value: texto });
                }
            }
        }

        // Prefijo de la Subsidiaria
        function getPrefijo(subsidiaria) {

            var featuresubs = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            var strdata = '';

            if (featuresubs == true || featuresubs == 'T') {
                strdata = search.lookupFields({ type: 'subsidiary', id: subsidiaria, columns: ['tranprefix'] });
                strdata = strdata.tranprefix;
            }

            return strdata;

        }

        function sleep(milliseconds) {
            var start = new Date().getTime();
            for (var i = 0; i < 1e7; i++) {
                if ((new Date().getTime() - start) > milliseconds) {
                    break;
                }
            }
        }

        function idConnectionStatus(id_load_2, document_type, current_transaction, idTransaction) {

            var id_con = '';

            var filtrosPackage = [];
            filtrosPackage[0] = search.createFilter({ name: 'custrecord_lmry_ei_pckg_doc_type', operator: 'equalto', values: document_type });
            filtrosPackage[1] = search.createFilter({ name: 'custrecord_lmry_ei_pckg_trans_type', operator: 'anyof', values: idTransaction });
            if (subsiOW) {
                filtrosPackage[2] = search.createFilter({ name: 'custrecord_lmry_ei_pckg_subsi', operator: 'anyof', values: id_load_2.getValue('subsidiary') });
            }

            var objbusqPrueba = search.create({
                type: 'customrecord_lmry_ei_pckg',
                columns: ['custrecord_lmry_ei_pckg_subsi', 'custrecord_lmry_ei_pckg_doc_type',
                    'custrecord_lmry_ei_pckg_template', 'custrecord_lmry_ei_pckg_sm'],
                filters: filtrosPackage
            });

            var resultadoPrueba = objbusqPrueba.run().getRange(0, 50);

            //SOLO AGARRA EL PRIMER VALOR YA QUE DEBE IR DENTRO DE UN FOR
            if (resultadoPrueba != null && resultadoPrueba.length != 0) {
                var row = resultadoPrueba[0].columns;
                var subsi = resultadoPrueba[0].getValue(row[0]);
                var _doc_fiscal = resultadoPrueba[0].getValue(row[1]);
                var template = resultadoPrueba[0].getValue(row[2]);
                var send_method = resultadoPrueba[0].getValue(row[3]);

                if ((template != null && template != '') && (send_method != null && send_method != '')) {

                    /* RECORD: LatamReady - EI Connection Status*/
                    var busqeiprint = search.create({
                        type: 'customrecord_lmry_ei_con_status',
                        columns: ['custrecord_lmry_ei_con_rel_txn', 'custrecord_lmry_ei_con_subsidiary', 'custrecord_lmry_ei_con_doc', 'custrecord_lmry_ei_con_temp',
                            'custrecord_lmry_ei_con_sm', 'custrecord_lmry_ei_con_status'
                        ],
                        filters: [
                            ['custrecord_lmry_ei_con_rel_txn', 'anyof', current_transaction]
                        ]
                    });

                    var resultprint = busqeiprint.run().getRange(0, 1000);

                    var connectionprint = '';
                    if (resultprint == null || resultprint.length == 0) {
                        /*Llenado de tabla: LatamReady - EI Connection Status*/
                        connectionprint = record.create({ type: 'customrecord_lmry_ei_con_status' });
                        connectionprint.setValue('custrecord_lmry_ei_con_rel_txn', current_transaction);
                        connectionprint.setValue('custrecord_lmry_ei_con_status', 1);
                    } else {
                        connectionprint = record.load({ type: 'customrecord_lmry_ei_con_status', id: resultprint[0].id })
                    }

                    if (subsiOW) {
                        connectionprint.setValue('custrecord_lmry_ei_con_subsidiary', subsi);
                    }

                    connectionprint.setValue('custrecord_lmry_ei_con_doc', _doc_fiscal);
                    connectionprint.setValue('custrecord_lmry_ei_con_temp', template);
                    connectionprint.setValue('custrecord_lmry_ei_con_sm', send_method);
                    id_con = connectionprint.save({ disableTriggers: true, ignoreMandatoryFields: true });

                } else {
                    return true;
                }

            }

            return id_con;
        }

        // Se realiza la validacion para Mexico
        function validarAcentos(s) {
            var AccChars = "ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ&°–—ªº·";
            var RegChars = "SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyyo--ao.";

            s = s.toString();
            for (var c = 0; c < s.length; c++) {
                for (var special = 0; special < AccChars.length; special++) {
                    if (s.charAt(c) == AccChars.charAt(special)) {
                        s = s.substring(0, c) + RegChars.charAt(special) + s.substring(c + 1, s.length);
                    }
                }
            }
            return s;
        }

        function status(country, arregloInvoice, subsidiary, isFact) {

            //STATUS, STATUS-COUNTRY, HORA-COUNTRY, STATUS-GLOBAL, HORA-GLOBAL
            var json_full = {};

            for (var j = 0; j < arregloInvoice.length; j++) {
                json_full[arregloInvoice[j]] = [];
                json_full[arregloInvoice[j]].push('No');
                json_full[arregloInvoice[j]].push('No');
                json_full[arregloInvoice[j]].push('No');
                json_full[arregloInvoice[j]].push('No');
                json_full[arregloInvoice[j]].push(isFact[j]);
            }

            var posicion = -1;

            //BRAZIL, ARGENTINA, CHILE, COLOMBIA, PANAMA: LatamReady - EI Documents Status
            //var record = ['customrecord_lmry_ar_fel_estado','customrecord_lmry_ei_docs_status','customrecord_lmry_cl_ei_docs_status','customrecord_lmry_co_ei_docs_status'];
            var record = ['customrecord_lmry_ei_docs_status'];
            //STATUS
            /*var columnas = ['custrecord_lmry_ar_estado_comfiar','custrecord_lmry_ei_ds_doc_status','custrecord_lmry_cl_ei_doc_status','custrecord_lmry_co_ei_doc_status',
            'custbody_lmry_pe_estado_sf','custbody_lmry_pe_estado_comfiar'];*/
            var columnas = ['custrecord_lmry_ei_ds_doc_status', 'custbody_lmry_pe_estado_sf', 'custbody_lmry_pe_estado_comfiar', 'custrecord_lmry_ei_ds_restart'];
            //IDS
            //var columnas2 = ['custrecord_lmry_ar_fel_transac','custrecord_lmry_ei_ds_doc','custrecord_lmry_cl_ei_doc','custrecord_lmry_co_ei_doc'];
            var columnas2 = ['custrecord_lmry_ei_ds_doc'];

            switch (country) {
                // case 'ARG': posicion = 0; break;
                // case 'BOL': posicion = 0; break;
                case 'BRA': posicion = 0; break;
                // case 'CHI': posicion = 0; break;
                // case 'COL': posicion = 0; break;
                // case 'MEX': posicion = 1; break;
                // case 'PER': posicion = 2; break;
                // case 'PAN': posicion = 0; break;
                // case 'COS': posicion = 0; break;
                // case 'ECU': posicion = 0; break;
                // case 'URU': posicion = 0; break;
                // case 'GUA': posicion = 0; break;
            }

            var c = 0, bandera = true;
            while (bandera) {
                var aux = arregloInvoice.slice(c, c + 900);

                if (aux.length == 900) {
                    c = c + 900;
                } else {
                    bandera = false;
                }

                //custrecord_lmry_ar_fel_transac,custrecord_lmry_cl_ei_doc,custrecord_lmry_co_ei_doc

                var filtros = [
                    search.createFilter({ name: 'custrecord_lmry_ei_ds_doc', operator: 'anyof', values: aux })
                ]

                //RECORD COUNTRY
                var search_r_status = search.create({ type: record[posicion], columns: [columnas[posicion], columnas2[posicion], 'lastmodified', columnas[3]], filters: [filtros[posicion]] });
                var result_r_status = search_r_status.run().getRange({ start: 0, end: 900 });

                // Visualiza el resultado de una busqueda

                if (result_r_status != null && result_r_status.length > 0) {
                    for (var i = 0; i < result_r_status.length; i++) {
                        json_full[result_r_status[i].getValue(columnas2[posicion])][0] = result_r_status[i].getValue(columnas[posicion]);
                        json_full[result_r_status[i].getValue(columnas2[posicion])][5] = result_r_status[i].getValue(columnas[3]);
                    }
                }
            }

            var ei_status_Countries = {
                'BRA': {
                    "Aprobado": ['Observado', 'OBSERVADO', 'Autorizado', 'AUTORIZADO'],
                    "Procesando": ['Procesando', 'PROCESANDO']
                }
            }

            var status_aprobado = ei_status_Countries[country]["Aprobado"];
            var status_procesando = ei_status_Countries[country]["Procesando"];

            // var status_countries = ['Aprobado', 'Observado', 'EMITIDO', 'APROBADO POR SII', 'APROBADO', 'AUTORIZADO', 'Autorizado', 'Generado','ACEPTADO','Cancelada','Cancelado','Denegada','Cancelando','No Cancelado','No Cancelada','EMILOCAL'];
            // var status_countries_error = ['Error','ERROR','Rechazado','RECHAZADO'];

            var aprobados = [];
            var fallidos = [];
            var procesando = [];
            var reiniciados = [];
            var error = [];

            log.debug('jsonFull', json_full);

            for (var i = 0; i < arregloInvoice.length; i++) {
                if (json_full[arregloInvoice[i]][5] == "1") {
                    reiniciados.push(arregloInvoice[i]);
                    json_full[arregloInvoice[i]][1] = 'Reiniciado';
                } else if (status_aprobado.indexOf(json_full[arregloInvoice[i]][0]) != -1) {
                    aprobados.push(arregloInvoice[i]);
                    json_full[arregloInvoice[i]][1] = 'Aprobado';
                } else if (status_procesando.indexOf(json_full[arregloInvoice[i]][0]) != -1 || json_full[arregloInvoice[i]][0] == '') {
                    procesando.push(arregloInvoice[i]);
                    json_full[arregloInvoice[i]][1] = 'Procesando';
                } else {
                    fallidos.push(arregloInvoice[i]);
                    json_full[arregloInvoice[i]][1] = 'Rechazado';
                }
            }

            json_full = tranid_json(json_full, arregloInvoice);

            c = 0;
            bandera = true;

            //FALLIDOS
            //ARGENTINA-BRAZIL-CHILE-COLOMBIA-MEXICO-PERU: LatamReady - EI Log of Documents
            //var record_f = ['customrecord_lmry_ar_fel_lote_envio','customrecord_lmry_ei_log_docs','customrecord_lmry_cl_ei_log_docs','customrecord_lmry_co_ei_log_docs','customrecord_lmry_mx_fel_log_docs','customrecord_lmry_pe_fel_lote_envio'];
            //var response_f = ['custrecord_lmry_ar_envio_resp','custrecord_lmry_ei_ld_response','custrecord_lmry_cl_ei_response','custrecord_lmry_co_ei_response','custrecord_lmry_mx_fel_response','custrecord_lmry_pe_envio_resp'];
            var formula_f = ['{custrecord_lmry_ar_envio_transac.internalid}', '{customrecord_lmry_ei_log_docs.internalid}', '{custrecord_lmry_cl_ei_document.internalid}', '{custrecord_lmry_co_ei_document.internalid}', '{custrecord_lmry_mx_fel_document.internalid}', '{custrecord_lmry_pe_envio_transac.internalid}'];
            //var invoice_f = ['custrecord_lmry_ar_envio_transac','custrecord_lmry_ei_ld_doc','custrecord_lmry_cl_ei_document','custrecord_lmry_co_ei_document','custrecord_lmry_mx_fel_document','custrecord_lmry_pe_envio_transac'];

            log.debug('Fallidos', fallidos);
            log.debug('Cantidad de fallidos', fallidos.length);

            if (fallidos.length > 0) {

                var aux = [];
                var aux_id = [];
                var aux2 = [];
                while (bandera) {
                    var fallidos_c = fallidos.slice(c, c + 900);
                    if (fallidos_c.length == 900) {
                        c = c + 900;
                    } else {
                        bandera = false;
                    }

                    var search_fallidos = search.create({
                        type: 'customrecord_lmry_ei_log_docs', filters: [{ name: 'custrecord_lmry_ei_ld_doc', operator: 'anyof', values: fallidos_c }],
                        columns: [{ name: 'custrecord_lmry_ei_ld_doc', sort: search.Sort.DESC }, { name: 'internalid', sort: search.Sort.DESC }]
                    });

                    var c2 = 0;

                    var run_fallidos = search_fallidos.run();
                    var run_fallidos2 = run_fallidos.getRange({ start: c2, end: c2 + 900 });

                    var bandera2 = true;

                    if (run_fallidos2 != null && run_fallidos2.length > 0) {
                        while (bandera2) {
                            var run_fallidos2 = run_fallidos.getRange({ start: c2, end: c2 + 900 });
                            for (var i = 0; i < run_fallidos2.length; i++) {
                                var columnas_run = run_fallidos2[0].columns;
                                aux.push(run_fallidos2[i].getValue(columnas_run[1]));
                                aux_id.push(run_fallidos2[i].getValue(columnas_run[0]));
                            }

                            if (run_fallidos2.length == 900) {
                                c2 = c2 + 900;
                            } else {
                                bandera2 = false;
                            }

                        }

                        for (var a = 0; a < aux_id.length; a++) {
                            if (a == 0) { aux2.push(aux[a]); }
                            if (a > 0) {
                                if (aux_id[a] != aux_id[a - 1]) {
                                    aux2.push(aux[a]);
                                }
                            }

                        }

                    }

                    if (aux2.length > 0) {
                        var search_fallidos2 = search.create({
                            type: 'customrecord_lmry_ei_log_docs', filters: [{ name: 'internalid', operator: 'anyof', values: aux2 }],
                            columns: ['custrecord_lmry_ei_ld_response', 'custrecord_lmry_ei_ld_doc']
                        });

                        var result_fallidos = search_fallidos2.run().getRange({ start: 0, end: 900 });
                        for (var j = 0; j < result_fallidos.length; j++) {
                            json_full[result_fallidos[j].getValue('custrecord_lmry_ei_ld_doc')][3] = result_fallidos[j].getValue('custrecord_lmry_ei_ld_response');
                        }
                    }

                }
            }

            var tran_aceptados = [];
            var tran_fallidos = [];
            var tran_procesando = [];
            var tranNoFact = [];
            var tran_reiniciados = [];
            var errores = [];

            for (var i in json_full) {
                if (json_full[i][1] == 'Aprobado') {
                    tran_aceptados.push(json_full[i][2]);
                } else if (json_full[i][1] == 'Procesando') {
                    if (!json_full[i][4]) {
                        tranNoFact.push(json_full[i][2]);
                    } else {
                        tran_procesando.push(json_full[i][2]);
                    }
                } else if (json_full[i][1] == 'Reiniciado') {
                    tran_reiniciados.push(json_full[i][2]);
                } else {
                    tran_fallidos.push(json_full[i][2]);
                    if (json_full[i][3] == 'No' || json_full[i][3] == '' || json_full[i][3] == null) {
                        errores.push('No hay detalles del error');
                    } else {
                        errores.push(json_full[i][3]);
                    }
                    //errores.push(json_full[i][3]);
                }
            }

            var employee = search.lookupFields({ type: search.Type.EMPLOYEE, columns: ['email', 'firstname'], id: userId });
            var employee_email = employee.email;
            var employee_name = employee.firstname;

            var body = messageBody(tran_aceptados, tran_fallidos, errores, subsidiary, employee_name, tran_procesando, tranNoFact, tran_reiniciados);
            //log.debug('Cantidad de caracteres correo',body.length);

            email.send({ author: userId, recipients: employee_email, subject: 'LatamReady - Advanced Purchase Flow', body: body });

        }

        function tranid_json(json_invoice, arreglo) {

            if (arreglo.length > 0) {
                var aux_x = [];
                var x = 0;
                var bandera = true;
                while (bandera) {
                    aux_x = arreglo.slice(x, x + 900);

                    if (aux_x.length == 900) {
                        x = x + 900;
                    } else {
                        bandera = false;
                    }
                    // 2020.01.08 - Se agrego el fitro MainLine = 'T'
                    var search_invoice = search.create({ type: 'transaction', columns: ['internalid', 'tranid'], filters: [{ name: 'internalid', operator: 'anyof', values: aux_x }, { name: 'mainline', operator: 'is', values: 'T' }] });
                    var result_invoice = search_invoice.run().getRange({ start: 0, end: 900 });

                    if (result_invoice != null && result_invoice.length > 0) {
                        for (var a = 0; a < result_invoice.length; a++) {
                            json_invoice[result_invoice[a].getValue('internalid')][2] = result_invoice[a].getValue('tranid');
                        }
                    }

                }
            }

            return json_invoice;

        }

        function messageBody(tranSent, tranFail, respond, subsidiary, name, tranProc, tranNoFact, tranRestart) {

            var body = '<body text="#333333" link="#014684" vlink="#014684" alink="#014684">';
            body += '<table width="642" border="0" align="center" cellpadding="0" cellspacing="0">';
            body += '<tr>';
            body += '<td width="100%" valign="top">';
            body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
            body += '<tr>';
            body += '<td width="100%" colspan="2"><img style="display: block;" src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=921&c=TSTDRV1038915&h=c493217843d184e7f054" width="645" alt="main banner"/></td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
            body += '<tr>';
            body += '<td bgcolor="#d50303" width="15%">&nbsp;</td>';
            body += '<td bgcolor="#d50303" width="85%">';
            body += '<font style="color:#FFFFFF; line-height:130%; font-family:Arial, Helvetica, sans-serif; font-size:19px">';
            body += 'Estimado(a) ' + name + ':<br>';
            body += '</font>';
            body += '</td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td width="100%" bgcolor="#d50303" colspan="2" align="right"><a href="http://www.latamready.com/#contac"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=923&c=TSTDRV1038915&h=3c7406d759735a1e791d" width="94" style="margin-right:45px" /></a></td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td width="100%" bgcolor="#FFF" colspan="2" align="right">';
            body += '<a href="https://www.linkedin.com/company/9207808"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=924&c=TSTDRV1038915&h=c135e74bcb8d5e1ac356" width="15" style="margin:5px 1px 5px 0px" /></a>';
            body += '<a href="https://www.facebook.com/LatamReady-337412836443120/"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=919&c=TSTDRV1038915&h=9c937774d04fb76747f7" width="15" style="margin:5px 1px 5px 0px" /></a>';
            body += '<a href="https://twitter.com/LatamReady"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=928&c=TSTDRV1038915&h=fc69b39a8e7210c65984" width="15" style="margin:5px 47px 5px 0px" /></a>';
            body += '</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%">';
            body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:13px">';

            body += '<p>Este es un mensaje automatico de LatamReady SuiteApp.</p>';
            if (tranSent.length + tranFail.length + tranProc.length + tranNoFact.length + tranRestart.length == 1) {
                if (subsiOW) {
                    body += '<p>Se ha enviado automaticamente una transaccion para:</p><ul>';
                    body += '<li type="disc">Subsidiaria: ' + subsidiary + '</li>';
                    body += '</ul>';
                } else {
                    body += '<p>Se ha enviado automaticamente una transaccion</p>';
                }
            } else if (tranSent.length + tranFail.length + tranProc.length + tranNoFact.length + tranRestart.length > 1) {
                if (subsiOW) {
                    body += '<p>Se ha enviado automaticamente un total de ' + (tranSent.length + tranFail.length + tranProc.length + tranNoFact.length + tranRestart.length) + ' transacciones para:</p><ul>';
                    body += '<li type="disc">Subsidiaria: ' + subsidiary + '</li>';
                    body += '</ul>';
                } else {
                    body += '<p>Se ha enviado automaticamente un total de ' + (tranSent.length + tranFail.length + tranProc.length + tranNoFact.length + tranRestart.length) + ' transacciones</p>';
                }
            }
            body += '<p><b>Envios exitosos: </b>' + tranSent.length + '</p><ul>';
            for (i = 0; i < tranSent.length; i++) {
                body += '<li type="disc">' + tranSent[i] + '</li>'
            }
            body += '</ul>';
            body += '<p><b>Envios procesando: </b>' + tranProc.length + '</p><ul>';
            for (i = 0; i < tranProc.length; i++) {
                body += '<li type="disc">' + tranProc[i] + '</li>';
            }
            body += '</ul>';
            if (tranProc.length > 0) {
                body += '<p>Verificar el estado de estos invoices en el record LatamReady - EI Document Status</p>';
            }
            body += '<p><b>Envios fallidos: </b>' + tranFail.length + '</p><ul>';
            for (i = 0; i < tranFail.length; i++) {
                body += '<li type="disc">' + tranFail[i] + '</li>'
                body += '<p style="padding-left:20px;">' + respond[i] + '</p>'
            }
            body += '</ul>';

            body += '<p><b>Documentos No Electronicos: </b>' + tranNoFact.length + '</p><ul>';
            for (i = 0; i < tranNoFact.length; i++) {
                body += '<li type="disc">' + tranNoFact[i] + '</li>'
            }
            body += '</ul>';

            body += '<p><b>Transacciones con posible Reproceso: </b>' + tranRestart.length + '</p><ul>';
            for (i = 0; i < tranRestart.length; i++) {
                body += '<li type="disc">' + tranRestart[i] + '</li>'
            }
            body += '</ul>';
            if (tranRestart.length > 0) {
                if (tranRestart.length > 1) {
                    body += '<p>Verificar manualmente las transacciones</p>';
                }
                else {
                    body += '<p>Verificar manualmente la transacción</p>';
                }
            }

            body += '<p>Saludos,</p>';
            body += '<p>El Equipo de LatamReady</p>';
            body += '</font>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<br>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2" bgcolor="#e5e6e7">';
            body += '<tr>';
            body += '<td>&nbsp;</td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%" align="center">';
            body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:12px;" >';
            body += '<i>Este es un mensaje automatico. Por favor, no responda este correo electronico.</i>';
            body += '</font>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td>&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%" align="center">';
            body += '<a href="http://www.latamready.com/"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=926&c=TSTDRV1038915&h=e14f0c301f279780eb38" width="169" style="margin:15px 0px 15px 0px" /></a>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%" align="center">';
            body += '<a href="https://www.linkedin.com/company/9207808"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=925&c=TSTDRV1038915&h=41ec53b63dba135488be" width="101" style="margin:0px 5px 0px 5px" /></a>';
            body += '<a href="https://www.facebook.com/LatamReady-337412836443120/"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=920&c=TSTDRV1038915&h=7fb4d03fff9283e55318" width="101" style="margin:0px 5px 0px 5px" /></a>';
            body += '<a href="https://twitter.com/LatamReady"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=929&c=TSTDRV1038915&h=300c376863035d25c42a" width="101" style="margin:0px 5px 0px 5px" /></a>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0">';
            body += '<tr>';
            body += '<td>';
            body += '<img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=918&c=TSTDRV1038915&h=7f0198f888bdbb495497" width="642" style="margin:15px 0px 15px 0px" /></a>';
            body += '</td>';
            body += '</tr>';
            body += '</table>';
            body += '</td>';
            body += '</tr>';
            body += '</table>';
            body += '</body>';

            return body;
        }

        function path_file(name_file) {
            var path = '';
            try {
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

            } catch (err) {
                libraryEmail.sendemail('[path_file] ' + err, LMRY_script);
            }
            path = path.substring(0, path.length - 3);
            path = '/' + path;
            return path;
        }

        function allGetRps(idTransacciones, subsidiaria, pais) {

            var RPS = '';
            var currentNumber = '';
            var idSerieImpresion = '';
            var concatenatedRPS = false;
            var jsonRPS = {};
            var banderaCurrent = false;
            var banderaMunicipio = false;

            var auxTransacciones = idTransacciones;
            auxTransacciones.pop();

            for (var i = 0; i < auxTransacciones.length; i++) {
                jsonRPS[auxTransacciones[i]] = '';
            }

            if (pais == 'BRA') {
                //SETUP TAX SUBSIDIARY: RPS CONCATENADO
                var filtrosSetup = [];
                filtrosSetup[0] = search.createFilter({ name: 'isinactive', operator: 'is', values: 'F' });
                if (subsiOW) {
                    filtrosSetup[1] = search.createFilter({ name: 'custrecord_lmry_setuptax_subsidiary', operator: 'is', values: subsidiaria });
                }

                var setupBR = search.create({
                    type: 'customrecord_lmry_setup_tax_subsidiary', columns: ['custrecord_lmry_br_setuptax_concatenated'],
                    filters: filtrosSetup
                });

                var setupBR = setupBR.run().getRange(0, 1);

                if (setupBR && setupBR.length) {
                    concatenatedRPS = setupBR[0].getValue('custrecord_lmry_br_setuptax_concatenated');
                }

                //BR TRANSACTION FIELDS: INVOICES YA CON RPS
                var bandera = true, contadorBR = 0;

                var searchBR = search.create({
                    type: 'customrecord_lmry_br_transaction_fields', columns: ['internalid', 'custrecord_lmry_br_rps', 'custrecord_lmry_br_related_transaction'],
                    filters: [{ name: 'custrecord_lmry_br_related_transaction', operator: 'anyof', values: auxTransacciones }]
                });

                var resultBR = searchBR.run();

                while (bandera) {
                    var auxResult = resultBR.getRange({ start: contadorBR, end: contadorBR + 1000 });

                    if (auxResult.length == 0) {
                        break;
                    }

                    for (var i = 0; i < auxResult.length; i++) {
                        var idInvoice = auxResult[i].getValue('custrecord_lmry_br_related_transaction');
                        var rps = auxResult[i].getValue('custrecord_lmry_br_rps') || '';

                        jsonRPS[idInvoice] = rps;

                    }

                    if (auxResult.length == 1000) {
                        contadorBR += 1000;
                    } else {
                        bandera = false;
                    }

                }

                //OBTENER EL RPS
                var filtrosSerie = [];
                filtrosSerie[0] = search.createFilter({ name: 'custrecord_lmry_codigo_doc', join: 'custrecord_lmry_serie_tipo_doc_cxc', operator: 'is', values: '99' });
                filtrosSerie[1] = search.createFilter({ name: 'isinactive', operator: 'is', values: 'F' });
                if (subsiOW) {
                    filtrosSerie[2] = search.createFilter({ name: 'custrecord_lmry_subsidiaria', operator: 'is', values: subsidiaria });
                }

                var searchSerie = search.create({
                    type: 'customrecord_lmry_serie_impresion_cxc', columns: [{ name: 'internalid', sort: search.Sort.ASC }, 'custrecord_lmry_serie_rango_ini', 'custrecord_lmry_serie_rango_fin', 'custrecord_lmry_rps_numero', 'custrecord_lmry_serie_impresion'],
                    filters: filtrosSerie
                });

                var resultSerie = searchSerie.run().getRange({ start: 0, end: 1 });

                idSerieImpresion = resultSerie[0].getValue('internalid');

                var serieImpresion = resultSerie[0].getValue('custrecord_lmry_serie_impresion');
                var currentNumber = resultSerie[0].getValue('custrecord_lmry_rps_numero');
                var rangoFin = resultSerie[0].getValue('custrecord_lmry_serie_rango_fin');

                if (parseInt(currentNumber) < parseInt(rangoFin)) {

                    var codigoCity = '';
                    var codigoSiafi = '';

                    if (subsiOW) {
                        var city = search.lookupFields({ type: 'subsidiary', id: subsidiaria, columns: ['address.custrecord_lmry_addr_city', 'address.custrecord_lmry_addr_city_id', 'address.custrecord_lmry_addr_prov_id_siafi'] });

                        if (city['address.custrecord_lmry_addr_city_id']) {
                            codigoCity = city['address.custrecord_lmry_addr_city_id'];
                        }

                        if (city['address.custrecord_lmry_addr_prov_id_siafi']) {
                            codigoSiafi = city['address.custrecord_lmry_addr_prov_id_siafi'];
                        }

                    } else {
                        var configCompany = config.load({ type: config.Type.COMPANY_INFORMATION });

                        if (configCompany.hasSubrecord('mainaddress')) {
                            var mainAddress = configCompany.getSubrecord('mainaddress');

                            if (mainAddress.getValue('custrecord_lmry_addr_city_id')) {
                                codigoCity = mainAddress.getValue('custrecord_lmry_addr_city_id');
                            }

                            if (mainAddress.getValue('custrecord_lmry_addr_prov_id_siafi')) {
                                codigoSiafi = mainAddress.getValue('custrecord_lmry_addr_prov_id_siafi');
                            }

                        }

                    }

                    //Sao Paulo, Belo Horizonte, Valinhos, Brasilia
                    var municipios = ['3550308', '3106200', '3556206', '5300108'];

                    if (municipios.indexOf(codigoCity) != -1) {
                        if (serieImpresion) {
                            RPS += serieImpresion;
                        }

                        RPS += codigoSiafi;

                        banderaMunicipio = true;

                    }

                }

                //SETEO DE RPS SOLO A INVOICES SIN ESTE
                if (banderaMunicipio) {
                    for (var i in jsonRPS) {
                        if (!jsonRPS[i]) {
                            currentNumber++;
                            banderaCurrent = true;

                            (concatenatedRPS) ? jsonRPS[i] = RPS + currentNumber : jsonRPS[i] = currentNumber;

                        }
                    }
                }


                //ACTUALIZACION DE SERIE
                if (banderaCurrent) {
                    record.submitFields({ type: 'customrecord_lmry_serie_impresion_cxc', id: idSerieImpresion, values: { custrecord_lmry_rps_numero: currentNumber }, options: { ignoreMandatoryFields: true, disableTriggers: true } });
                }

            }

            return jsonRPS;

        }

        function setPercentage() {

            var percentage = '';

            var searchLog = search.lookupFields({ type: 'customrecord_lmry_invoicing_populate', id: stateId, columns: ['custrecord_lmry_ip_count'] });
            searchLog = searchLog.custrecord_lmry_ip_count;
            searchLog = searchLog.split('|');

            if (searchLog.length == 1) {
                percentage = searchLog[0] + '|' + 1;
            } else {
                percentage = searchLog[0] + '|' + parseInt(parseFloat(searchLog[1]) + 1);
            }

            record.submitFields({
                type: 'customrecord_lmry_invoicing_populate', id: stateId,
                values: { custrecord_lmry_ip_count: percentage },
                options: { enableSourcing: false, ignoreMandatoryFields: true, disableTriggers: true }
            });


        }

        function setTransactionType(loadTransaction) {

            var searchTransactionType = search.create({ type: 'customrecord_lmry_trantype', filters: [{ name: 'name', operator: 'is', values: loadTransaction.getValue('type') }] });
            searchTransactionType = searchTransactionType.run().getRange({ start: 0, end: 1 });

            if (searchTransactionType && searchTransactionType.length) {
                loadTransaction.setValue('custbody_lmry_br_transaction_type', searchTransactionType[0].id);
            }

        }

        function getCountJsonTC(loadTransaction, bool_tax_purchase, bool_pop_up) {
            var cant = loadTransaction.getLineCount({ sublistId: 'item' });
            var count = 0;
            var custcol_lmry_br_json = null;
            var custcol_lmry_br_tax_rule = null;
            if (cant > 0) {
                for (var i = 0; i < cant; i++) {
                    if (bool_pop_up == true) {
                        //Columa para el Popup
                        var custcol_lmry_br_json = loadTransaction.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_br_json', line: i });
                    }
                    if (bool_tax_purchase == true) {
                        //Columna para el LatamTax Purchase
                        var custcol_lmry_br_tax_rule = loadTransaction.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_br_tax_rule', line: i });
                    }

                    if (custcol_lmry_br_json || custcol_lmry_br_tax_rule) {
                        count++;
                        if (count == 1) {
                            break;
                        }
                    }
                }
                return count;
            }
            else {
                return null;
            }
        }

        return {
            getInputData: getInputData,
            //map: map,
            reduce: reduce,
            summarize: summarize
        };

    });