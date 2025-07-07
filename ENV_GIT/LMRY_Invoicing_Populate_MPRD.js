/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for EI Avance Flow & Universal Setting         ||
||                                                              ||
||  File Name: LMRY_Invoicing_Populate_MPRD.js                  ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 01 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/config', 'N/email', 'N/log', 'N/url', 'N/record', 'N/search', 'N/runtime', 'N/file', 'N/https',
        './EI_Library/LMRY_IP_libSendingEmailsLBRY_V2.0', './EI_Library/LMRY_EI_libSendingEmailsLBRY_V2.0',
        './EI_Conection/LMRY_EI_Conection_handler_LBRY_v2.0',
        '/SuiteBundles/Bundle 37714/Latam_Library/LMRY_UniversalSetting_LBRY',
        '/SuiteBundles/Bundle 37714/WTH_Library/LMRY_TAX_TransactionLBRY_V2.0',
        '/SuiteBundles/Bundle 37714/WTH_Library/LMRY_TAX_Withholding_LBRY_V2.0',
        '/SuiteBundles/Bundle 37714/WTH_Library/LMRY_AutoPercepcionDesc_LBRY_V2.0',
        '/SuiteBundles/Bundle 37714/WTH_Library/LMRY_TransferIva_LBRY',
        '/SuiteBundles/Bundle 37714/WTH_Library/LMRY_RetencionesEcuador_LBRY',
        './EI_Library/LMRY_seriesObject_LBRY_v2.0',
        '/SuiteBundles/Bundle 37714/Latam_Library/LMRY_Log_LBRY_V2.0', 'N/suiteAppInfo'
    ],

    function (config, email, log, url, record, search, runtime, file, https, libraryEmail, libraryFeature, libraryHandler,
        libraryUS, libraryTaxResult, libraryTaxWHT, libraryPercepcionesAR, libraryTransferIvaMX, libraryLatamTaxEC, librarySeries, logLbry, nSuiteAppInfo) {
        // 245636 : DESARROLLO
        // 243159 : QA
        var LMRY_script = 'Latamready - Invoicing Populate MPRD';
        /**
         * Input Data for processing
         *
         * @return Array,Object,Search,File
         *
         * @since 2016.1
         */
        function getInputData() {
            var userId = '';
            var subsidiariaGet = '';
            try {
                var scriptObj = runtime.getCurrentScript();
                var stateId = scriptObj.getParameter({
                    name: 'custscript_lmry_ip_params_state'
                });
                var subsiOW = runtime.isFeatureInEffect({
                    feature: 'SUBSIDIARIES'
                });                    

                var currentLog = search.lookupFields({
                    type: 'customrecord_lmry_invoicing_populate',
                    id: stateId,
                    columns: ['custrecord_lmry_ip_transactions', 'custrecord_lmry_ip_subsidiary.country', 'custrecord_lmry_ip_subsidiary', 'custrecord_lmry_ip_country', 'custrecord_lmry_ip_process', 'custrecord_lmry_ip_user', 'custrecord_lmry_ip_json_count']
                });
                userId = currentLog.custrecord_lmry_ip_user[0].value;
                var ipJsonCount = JSON.parse(currentLog.custrecord_lmry_ip_json_count);
                log.debug('user y state', userId + '-' + stateId);
                var countryId;
                if (subsiOW) {
                    var country = currentLog['custrecord_lmry_ip_subsidiary.country'][0].text;
                    countryId = currentLog['custrecord_lmry_ip_country'][0].value;

                    //Dominican Republic
                    if (countryId == 61) {
                        country = "Dominican Republic";
                    }

                    country = country.substring(0, 3).toUpperCase();
                    
                    country = validarAcentos(country);

                    var licenses = libraryFeature.getLicenses(currentLog.custrecord_lmry_ip_subsidiary[0].value);
                    subsidiariaGet = currentLog['custrecord_lmry_ip_subsidiary'][0].value;
                } else {

                    var jsonCountryId = {
                        AR: 11,
                        BO: 29,
                        BR: 30,
                        CL: 45,
                        CO: 48,
                        CR: 49,
                        DO: 61,
                        EC: 63,
                        GT: 91,
                        MX: 157,
                        PA: 173,
                        PY: 186,
                        PE: 174,
                        UY: 231
                    };

                    var countryConfig = config.load({
                        type: config.Type.COMPANY_INFORMATION
                    });
                    var country = countryConfig.getText({
                        fieldId: 'country'
                    });

                    var countryCode = countryConfig.getValue({
                        fieldId: "country"
                    });

                    countryId = jsonCountryId[countryCode] || "";


                    if (countryCode == "DO") {
                        country = "Dominican Republic";
                    }

                    country = country.substring(0, 3).toUpperCase();

                    country = validarAcentos(country);

                    var allLicenses = libraryFeature.getAllLicenses();
                    var keyMid = Object.keys(allLicenses)[0];
                    var licenses = libraryFeature.getLicenses(keyMid);
                    subsidiariaGet = '';
                }

                var idFeature = {
                    AR: 341,
                    BO: 704,
                    BR: 339,
                    CL: 342,
                    CO: 343,
                    CR: 523,
                    DO: 860,
                    EC: 601,
                    GT: 706,
                    MX: 338,
                    PA: 441,
                    PE: 344,
                    PY: 965,
                    UY: 647
                };

                // FUNCIONES OPTIMIZAR: SOLO UNA VEZ
                var fVip = false,
                    fPreimpreso = false;

                if (subsiOW) {
                    fVip = libraryFeature.getAuthorization(idFeature[currentLog['custrecord_lmry_ip_subsidiary.country'][0].value], licenses);
                    fPreimpreso = validarPreimpreso(licenses, currentLog['custrecord_lmry_ip_subsidiary.country'][0].value);
                } else {
                    fVip = libraryFeature.getAuthorization(idFeature[countryConfig.getValue('country')], licenses);
                    fPreimpreso = validarPreimpreso(licenses, countryConfig.getValue('country'));
                }

                // UNIVERSAL SETTING
                var fUniversalSetting = libraryUS.auto_universal_setting(licenses, false);

                // TRANID
                var fTranid = false,
                    fTranidPayment = false;
                if (country == 'MEX') {
                    if (libraryFeature.getAuthorization(20, licenses)) {
                        if (libraryFeature.getAuthorization(314, licenses)) {
                            fTranid = true;
                        }
                        if (libraryFeature.getAuthorization(535, licenses)) {
                            fTranidPayment = true;
                        }
                    }
                } else if (country == 'BRA') {
                    if (libraryFeature.getAuthorization(140, licenses) && libraryFeature.getAuthorization(308, licenses)) {
                        fTranid = true;
                    }
                } else if (country == 'COL') {
                    if (libraryFeature.getAuthorization(26, licenses) && libraryFeature.getAuthorization(310, licenses)) {
                        fTranid = true;
                    }
                } else if (country == 'BOL') {
                    if (libraryFeature.getAuthorization(37, licenses) && libraryFeature.getAuthorization(49, licenses)) {
                        fTranid = true;
                    }
                } else if (country == 'GUA') {
                    if (libraryFeature.getAuthorization(133, licenses) && libraryFeature.getAuthorization(23, licenses)) {
                        fTranid = true;
                    }
                } else if (country == 'PER') {
                    if (libraryFeature.getAuthorization(136, licenses) && libraryFeature.getAuthorization(9, licenses)) {
                        fTranid = true;
                    }
                } else if (country == 'PAN') {
                    if (libraryFeature.getAuthorization(137, licenses) && libraryFeature.getAuthorization(59, licenses)) {
                        fTranid = true;
                    }
                } else if (country == 'DOM') {
                    if (libraryFeature.getAuthorization(399, licenses) && libraryFeature.getAuthorization(522, licenses)) {
                        fTranid = true;
                    }
                } else if (country == 'PAR') {
                    if (libraryFeature.getAuthorization(38, licenses) && libraryFeature.getAuthorization(40, licenses)) {
                        fTranid = true;
                    }
                }

                log.debug('Features: Vip - US - Tranid', [fVip, fUniversalSetting, fTranid].join('-'));

                // FEATURES DE DESARROLLOS
                var fPercepcionesAR = false,
                    fTrasladoIvaMX = false,
                    fTaxResultServBR = false,
                    fRetencionesBR = false,
                    fLatamTaxEC = false;

                switch (country) {
                    case 'ARG':
                        fPercepcionesAR = libraryFeature.getAuthorization(142, licenses);
                        break;
                    case 'BRA':
                        fTaxResultServBR = libraryFeature.getAuthorization(147, licenses);
                        fRetencionesBR = libraryFeature.getAuthorization(416, licenses);
                        break;
                    case 'ECU':
                        fLatamTaxEC = libraryFeature.getAuthorization(153, licenses);
                        break;
                    case 'MEX':
                        fTrasladoIvaMX = libraryFeature.getAuthorization(243, licenses);
                        break;
                }

                // JSON DE TRANSACCIONES
                var idTransacciones = currentLog.custrecord_lmry_ip_transactions;
                idTransacciones = idTransacciones.split('|');
                var processObj = (currentLog.custrecord_lmry_ip_process) ? JSON.parse(currentLog.custrecord_lmry_ip_process) : {};

                // SOLO MEXICO y BOLIVIA: PRE-IMPRESO POR LOTES
                if ((country == 'MEX' && libraryFeature.getAuthorization(20, licenses)) || (country == 'BOL' && libraryFeature.getAuthorization(37, licenses)) || (country == 'GUA' && libraryFeature.getAuthorization(133, licenses))) {
                    var transIDs = idTransacciones.slice(0, idTransacciones.length - 1);

                    if (subsiOW) {
                        var transactionContext = librarySeries.getSeries(transIDs, currentLog.custrecord_lmry_ip_subsidiary[0].value, fPreimpreso.slice(1, fPreimpreso.length));
                    } else {
                        var transactionContext = librarySeries.getSeries(transIDs, '', fPreimpreso.slice(1, fPreimpreso.length));
                    }
                    if (transactionContext.series && transactionContext.series.length) {
                        var serieByTransaction = transactionContext.transactions;
                        var serieContext = librarySeries.load(transactionContext.series);
                    }
                }

                var pymtCompFields = getPymtCompFields(idTransacciones);

                // JSON PARA LOS MAPS
                var pruebaJson = [];
                for (var i = 0; i < idTransacciones.length - 1; i++) {
                    var prePrinted = '';

                    if ((country == 'MEX' || country == 'BOL' || country == 'GUA') && transactionContext.series && transactionContext.series.length) {
                        if (serieByTransaction[idTransacciones[i]]) {
                            var serieId = serieByTransaction[idTransacciones[i]];
                            prePrinted = serieContext.generateNumber(serieId);
                        }
                    }

                    pruebaJson.push({
                        key: i,
                        values: {
                            IDcurrentTransaction: idTransacciones[i],
                            country: country,
                            subsidiaryGet: subsidiariaGet,
                            state: stateId,
                            // countryWithout: country_without,
                            countryId: countryId,
                            fVip: fVip,
                            fPreimpresoInvoice: fPreimpreso[1],
                            fPreimpresoCM: fPreimpreso[2],
                            fPreimpresoPY: fPreimpreso[3],
                            fPreimpresoCS: fPreimpreso[4],
                            fPreimpresoPC: fPreimpreso[5],
                            fTranid: fTranid,
                            fTranidPayment: fTranidPayment,
                            cantidadTransacciones: idTransacciones.length - 1,
                            countCurrentTransaction: i + 1,
                            fUniversalSetting: fUniversalSetting,
                            fPercepcionesAR: fPercepcionesAR,
                            fTrasladoIvaMX: fTrasladoIvaMX,
                            fTaxResultServBR: fTaxResultServBR,
                            fRetencionesBR: fRetencionesBR,
                            fLatamTaxEC: fLatamTaxEC,
                            licenses: licenses,
                            //rps: jsonRPS[idTransacciones[i]],
                            preImpresoNumber: prePrinted,
                            pymtCompField: pymtCompFields[idTransacciones[i]],
                            processObj: processObj,
                            userId: userId,
                            ipJsonCount: ipJsonCount[idTransacciones[i]]
                        }
                    });
                }

                // MX: ACTUALIZACION DE SERIES - PREIMPRESO
                if ((country == 'MEX' || country == 'BOL' || country == 'GUA') && transactionContext.series && transactionContext.series.length) {
                    serieContext.commit();
                }

                var id = record.submitFields({
                    type: 'customrecord_lmry_invoicing_populate',
                    id: stateId,
                    values: {
                        custrecord_lmry_ip_state: '1'
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                        disableTriggers: true
                    }
                });

                return pruebaJson;
            } catch (error) {
                var id = record.submitFields({
                    type: 'customrecord_lmry_invoicing_populate',
                    id: stateId,
                    values: {
                        custrecord_lmry_ip_state: '2'
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                        disableTriggers: true
                    }
                });
                logLbry.doLog({ tittle: '[getInputData Context]', message: error, relatedScript: LMRY_script });
                sendErrorEmail('[getInputData] ' + error, LMRY_script, '', userId, subsidiariaGet);
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
                var scriptObj = runtime.getCurrentScript();
                var stateId = scriptObj.getParameter({
                    name: 'custscript_lmry_ip_params_state'
                });
                var subsiOW = runtime.isFeatureInEffect({
                    feature: 'SUBSIDIARIES'
                });                                        
                    
                var isFact = false;
                var posible_error = 'Populado';

                var currenData = context.values;
                currenData = JSON.parse(currenData[0]);

                var current_transaction = currenData.values.IDcurrentTransaction;
                var country = currenData.values.country;
                var subsidiaryMap = currenData.values.subsidiaryGet;
                var state = currenData.values.state;
                // var country_acento = currenData.values.countryWithout;
                var countryId = currenData.values.countryId;
                var feature_vip = currenData.values.fVip;
                var featurePreimpresoInvoice = currenData.values.fPreimpresoInvoice;
                var featurePreimpresoCM = currenData.values.fPreimpresoCM;
                var featurePreimpresoPY = currenData.values.fPreimpresoPY;
                var featurePreimpresoCS = currenData.values.fPreimpresoCS;
                var featurePreimpresoPC = currenData.values.fPreimpresoPC;
                var feature_tranid = currenData.values.fTranid;
                var totalTransacciones = currenData.values.cantidadTransacciones;
                var numeroTransaccionActual = currenData.values.countCurrentTransaction;
                var featureUniversalSetting = currenData.values.fUniversalSetting;
                var featurePercepcionesAR = currenData.values.fPercepcionesAR;
                var featureTrasladoIvaMX = currenData.values.fTrasladoIvaMX;
                var featureTaxResultServBR = currenData.values.fTaxResultServBR;
                var featureRetencionesBR = currenData.values.fRetencionesBR;
                var featureLatamTaxEC = currenData.values.fLatamTaxEC;
                var featureTranidPayment = currenData.values.fTranidPayment;
                var currentRPS = "";
                var preImpresoLote = currenData.values.preImpresoNumber;
                var licensesSub = currenData.values.licenses;
                var pymtCompFieldId = currenData.values.pymtCompField || 0;
                var processObj = currenData.values.processObj;
                var userId = currenData.values.userId || 0;
                var flagProcess = currenData.values.ipJsonCount;

                if (context.isRestarted && context.executionNo > 1) {
                    posible_error = 'Reinicio';
                    var status_search = search.create({
                        type: search.Type.TRANSACTION,
                        columns: [
                            'custbody_lmry_processed_transaction',
                            search.createColumn({ name: 'internalid', join: 'CUSTRECORD_LMRY_EI_DS_DOC' })
                        ],
                        filters: [
                            { name: 'internalid', operator: 'anyof', values: [current_transaction] },
                            { name: 'mainline', operator: 'is', values: 'T' }
                        ]
                    }).run().getRange(0, 1);
                    var isFactura = status_search[0].getValue('custbody_lmry_processed_transaction') == 2;
                    var idDocStatus = status_search[0].getValue({ name: 'internalid', join: 'CUSTRECORD_LMRY_EI_DS_DOC' });
                    if (idDocStatus) {
                        record.submitFields({
                            type: 'customrecord_lmry_ei_docs_status',
                            id: idDocStatus,
                            values: {
                                custrecord_lmry_ei_ds_restart: '1'
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    } else {
                        var objRecord = record.create({
                            type: 'customrecord_lmry_ei_docs_status',
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
                            value: '1'
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

                    if (country != 'MEX' && country != 'ARG' && country != 'PER' && country != 'COS') {
                        return false;
                    }
                }
                if (flagProcess == false) {
                    var search_transaction = search.lookupFields({
                        type: search.Type.TRANSACTION,
                        columns: ['type'],
                        id: current_transaction
                    });
                    search_transaction = search_transaction.type[0].value;
    
                    var type_transaction = '',
                        featurePreimpresoTransaction = false;
                    var idTransaction = 7;
                    if (search_transaction == 'CustInvc') {
                        type_transaction = 'invoice';
                        featurePreimpresoTransaction = featurePreimpresoInvoice;
                    }
    
                    if (search_transaction == 'CustCred') {
                        type_transaction = 'creditmemo';
                        featurePreimpresoTransaction = featurePreimpresoCM;
                        idTransaction = 10;
                    }
    
                    if (search_transaction == 'CustPymt') {
                        type_transaction = 'customerpayment';
                        feature_tranid = featureTranidPayment;
                        featurePreimpresoTransaction = featurePreimpresoPY;
                    }
    
                    if (search_transaction == 'CashSale') {
                        type_transaction = 'cashsale';
                        featurePreimpresoTransaction = featurePreimpresoCS;
                    }
    
                    if (search_transaction == 'Custom') {
                        type_transaction = 'customtransaction_lmry_payment_complemnt';
                        featurePreimpresoTransaction = featurePreimpresoPC;
                    }
    
                    //Process
                    var checkAutomaticSet = false;
                    var checkElectronicInvoicing = false;
                    var checkAgip = false;
                    if (Object.keys(processObj).length) {
                        checkAutomaticSet = processObj['automatic_set'];
                        checkElectronicInvoicing = processObj['e_invoicing'];
                        checkAgip = (processObj.hasOwnProperty('agip')) ? processObj['agip'] : false;
                    }
                    // **************************************
                    // load para Actualizacion de Campos
                    // **************************************
                    var id_load = record.load({
                        type: type_transaction,
                        id: current_transaction
                    });
    
                    isFact = id_load.getValue('custbody_lmry_processed_transaction') == 2;
    
                    // Populado Set Automatic Setting
                    var document_type = '';
                    if (search_transaction == 'Custom') {
                        document_type = id_load.getValue({
                            fieldId: 'custpage_document_type'
                        });
                        if (!document_type && pymtCompFieldId) {
                            var pcDoc = search.lookupFields({
                                type: 'customrecord_lmry_complem_paymnt_fields',
                                id: pymtCompFieldId,
                                columns: ['custrecord_lmry_complm_document_type']
                            }).custrecord_lmry_complm_document_type;
                            if (pcDoc.length > 0 && pcDoc[0].value) document_type = pcDoc[0].value;
                        }
                    } else {
                        document_type = id_load.getValue({
                            fieldId: 'custbody_lmry_document_type'
                        });
                    }
    
                    var seteoUS = false;
    
                    if (featureUniversalSetting == true && checkAutomaticSet == true) {
                        libraryUS.set_inv_identifier(id_load);
                        if (document_type == null || document_type == '') {
                            libraryUS.automatic_setfield(id_load, false);
                            libraryUS.automatic_setfieldrecord(id_load);
                            libraryUS.set_template(id_load, licensesSub);
                            seteoUS = true;
                        }
                    }
    
                    if (country == 'BRA') {
                        generateRPS(id_load, subsiOW);
                    }
    
                    // Campos de facturacion : E-Document Template y E-Document Sending Methods
                    var ei_sending_templa = id_load.getValue({
                        fieldId: 'custbody_psg_ei_template'
                    });
                    var ei_sending_method = id_load.getValue({
                        fieldId: 'custbody_psg_ei_sending_method'
                    });
    
                    // Si existe template y sending method se cambio el estado For generation
                    if (ei_sending_templa && ei_sending_method) {
                        // Se cambia el valor de :E-Document Status
                        id_load.setValue({
                            fieldId: 'custbody_psg_ei_status',
                            value: 1
                        });
                    }
    
                    var sw_Continue = true;
    
                    // Se valida si el tipo de documento fiscal no esta vacio
                    if (search_transaction == 'Custom') {
                        document_type = id_load.getValue({
                            fieldId: 'custpage_document_type'
                        });
                        if (!document_type && pymtCompFieldId) {
                            var pcDoc = search.lookupFields({
                                type: 'customrecord_lmry_complem_paymnt_fields',
                                id: pymtCompFieldId,
                                columns: ['custrecord_lmry_complm_document_type']
                            }).custrecord_lmry_complm_document_type;
                            if (pcDoc.length > 0 && pcDoc[0].value) document_type = pcDoc[0].value;
                        }
                    } else {
                        document_type = id_load.getValue({
                            fieldId: 'custbody_lmry_document_type'
                        });
                    }
                    if (document_type != null && document_type != '') {
                        var search_doc_cod = '';
                        if (country == 'BRA') {
                            search_doc_cod = search.lookupFields({
                                type: 'customrecord_lmry_tipo_doc',
                                id: document_type,
                                columns: ['custrecord_lmry_codigo_doc']
                            });
                            search_doc_cod = search_doc_cod.custrecord_lmry_codigo_doc;
                            // Feature de preimpreso para los documentos con código 55 y 57
    
                            if (search_doc_cod != '55' && search_doc_cod != '57') {
                                featurePreimpresoTransaction = false;
                            }
                        }
    
                        // Seteo del Pre-impreso en la transaccion
                        var serie_cxc = '';
                        if (search_transaction == 'Custom') {
                            serie_cxc = id_load.getValue({
                                fieldId: 'custpage_serie_doc'
                            });
                            if (!serie_cxc && pymtCompFieldId) {
                                var pcSerie = search.lookupFields({
                                    type: 'customrecord_lmry_complem_paymnt_fields',
                                    id: pymtCompFieldId,
                                    columns: ['custrecord_lmry_complm_serie_cxc']
                                }).custrecord_lmry_complm_serie_cxc;
                                if (pcSerie.length > 0 && pcSerie[0].value) serie_cxc = pcSerie[0].value;
                            }
                        } else {
                            serie_cxc = id_load.getValue({
                                fieldId: 'custbody_lmry_serie_doc_cxc'
                            });
                        }
                        if (serie_cxc != null && serie_cxc != '' && serie_cxc != -1 && featurePreimpresoTransaction == true) {
                            setearPreImpreso(subsiOW, id_load, country, feature_tranid, preImpresoLote, pymtCompFieldId);
                        }
                        if (featureUniversalSetting == true && checkAutomaticSet == true) {
                            libraryUS.setRefFieldsOnInvoice(id_load);
                        }
    
                        // Para el automático OWN
                        var ei_automatic = false;
                        if (feature_vip == true) {
                            ei_automatic = true;
                        }
                        if (libraryFeature.getAuthorization(1029, licensesSub) && country == 'ARG' && checkAgip == true) {
                            const headers = { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" };
                            https.requestRestlet({
                                body: JSON.stringify(
                                  { 
                                    subsidiaryID: id_load.getValue('subsidiary'), 
                                    periodID: id_load.getValue('postingperiod'),
                                    entityID: id_load.getValue('entity') 
                                  }
                                ),
                                deploymentId: 'customdeploy_lmry_ar_agip_restl',
                                scriptId: 'customscript_lmry_ar_agip_restl',
                                method: 'POST',
                                headers: headers
                            })
                        }
    
                        // Se cambia el valor de : Latam - EI Automatic
                        id_load.setValue({
                            fieldId: 'custbody_lmry_mx_ei_automatic',
                            value: ei_automatic
                        });
    
                        if (country == 'BRA') {
                            // Log de ayuda
                            log.debug('Cantidad de lineas', current_transaction + ': ' + id_load.getLineCount({
                                sublistId: 'item'
                            }));
    
                            // Se cambia el valor de : Latam - Applied WHT CODE
                            id_load.setValue({
                                fieldId: 'custbody_lmry_apply_wht_code',
                                value: true
                            });
    
                            // Logica para Inventariable
                            if (search_doc_cod == '55') {
                                posible_error = 'Tax Calculator';
                                log.debug('TAX CALCULATOR INICIO', 'TAX CALCULATOR INICIO');
                                // SETEO DEL CAMPO OCULTO BR TRANSACTION TYPE SI ESTA VACIO: CARGAS CSV SIN CHECK
                                if (!id_load.getValue('custbody_lmry_br_transaction_type')) {
                                    setTransactionType(id_load);
                                }
    
                                if (id_load.getValue('custbody_lmry_br_transaction_type')) {
                                    var id_con = idConnectionStatus(subsiOW, id_load, document_type, current_transaction, idTransaction);
    
                                    // Llama a la libreria Tax Calculator
                                    // '/SuiteBundles/Bundle 247582/EI Tax Calculator 2.0 Brasil/LMRY_BR_EI_TAXC_LBRY_V2.0.js',library_taxcalc
                                    require(['/SuiteBundles/Bundle 247582/EI Tax Calculator 2.0 Brasil/LMRY_BR_EI_TAXC_LBRY_V2.0.js'],
                                        function (library_taxcalc) {
                                            sw_Continue = library_taxcalc.calculateTaxes(id_load);
                                        });
                                }
                            } else if (featureTaxResultServBR == true && seteoUS == true && type_transaction == 'invoice') {
                                // Logica para Servicios
                                posible_error = 'Tax Result Servicio';
    
                                var json_taxresult = {
                                    type: 'edit',
                                    newRecord: id_load
                                };
                                libraryTaxResult.afterSubmitTransaction(json_taxresult, true);
                            }
                        } else if (country == 'MEX' && featureTrasladoIvaMX == true && type_transaction == 'invoice' && seteoUS == true) {
                            libraryTransferIvaMX.generateMXTransField({
                                newRecord: id_load,
                                check: false
                            });
                        } else if (country == 'ECU' && featureLatamTaxEC == true && type_transaction == 'invoice' && seteoUS == true) {
                            libraryLatamTaxEC.beforeSubmitTransaction({
                                newRecord: id_load
                            }, [], 'edit');
                        }
    
                        // SETEO DE CAMPOS DE E-DOCUMENT EN BLANCO CUANDO ES EL VIP
                        if (feature_vip) {
                            id_load.setValue({
                                fieldId: 'custbody_psg_ei_template',
                                value: ''
                            });
                            id_load.setValue({
                                fieldId: 'custbody_psg_ei_sending_method',
                                value: ''
                            });
                            id_load.setValue({
                                fieldId: 'custbody_psg_ei_status',
                                value: ''
                            });
                        }
                    }
    
                    // Graba la transaccion actualizada
    
                    var _disableTriggers = true;
                    if (search_transaction == 'Custom') {
                        _disableTriggers = false;
                    }
                    id_load.save({
                        ignoreMandatoryFields: true,
                        disableTriggers: _disableTriggers
                    });
                    if (search_transaction == 'Custom') {
                        record.submitFields({
                            type: 'customrecord_lmry_complem_paymnt_fields',
                            id: pymtCompFieldId,
                            values: {
                                custrecord_lmry_complm_document_type: document_type,
                                custrecord_lmry_complm_serie_cxc: serie_cxc
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    }
    
                    // RETENCIONES BRAZIL
                    if (country == 'BRA' && featureRetencionesBR == true && seteoUS == true && type_transaction == 'invoice') {
                        libraryTaxWHT.LatamTaxWithHoldingBR(id_load, 'edit');
                    }
                    if (country == 'ARG' && featurePercepcionesAR == true && (seteoUS == true || checkAgip == true)) {
                        libraryPercepcionesAR.processPerception({
                            newRecord: {
                                id: current_transaction,
                                type: type_transaction
                            }
                        }, 'AR', 'edit');
                    }
    
                    // **************************************
                    // Fin para Actualizacion de Campos
                    // **************************************
                    if (document_type != null && document_type != '') {
                        // AUTOFACT
                        if (feature_vip == true && sw_Continue && checkElectronicInvoicing == true) {
                            posible_error = 'Generacion y Envio';
                            var id_load4 = '';
                            if (country == 'PER' || country == 'MEX' || country == 'COL' || country == 'CHI' || country == 'PAN' || country == 'COS' || country == 'ECU' || country == 'URU' || country == 'BOL' || country == 'GUA' || country == 'DOM' || country == 'PAR') {
                                id_load4 = record.load({
                                    type: type_transaction,
                                    id: current_transaction
                                });
                            } else if (country == 'BRA') {
                                var search_br_tran = search.create({
                                    type: 'customrecord_lmry_br_transaction_fields',
                                    filters: [{
                                        name: 'custrecord_lmry_br_related_transaction',
                                        operator: 'is',
                                        values: current_transaction
                                    }],
                                    columns: ['internalid']
                                });
    
                                var result_br_tran = search_br_tran.run().getRange({
                                    start: 0,
                                    end: 1
                                });
                                if (result_br_tran != null && result_br_tran.length > 0) {
                                    id_load4 = record.load({
                                        type: 'customrecord_lmry_br_transaction_fields',
                                        id: result_br_tran[0].getValue('internalid')
                                    });
                                }
                            } else {
                                var search_ar_tran = search.create({
                                    type: 'customrecord_lmry_ar_transaction_fields',
                                    filters: [{
                                        name: 'custrecord_lmry_ar_transaction_related',
                                        operator: 'is',
                                        values: current_transaction
                                    }],
                                    columns: ['internalid']
                                });
    
                                var result_ar_tran = search_ar_tran.run().getRange({
                                    start: 0,
                                    end: 1
                                });
    
                                if (result_ar_tran != null && result_ar_tran.length > 0) {
                                    id_load4 = record.load({
                                        type: 'customrecord_lmry_ar_transaction_fields',
                                        id: result_ar_tran[0].getValue('internalid')
                                    });
                                }
                            }
                            // Valida que continue con el proceso
                            if (id_load4 != '' && sw_Continue) {
                                // BUSQUEDA TIPO DE DOCUMENTO
                                var filtros_document = [],
                                    json_document = {};
                                filtros_document[0] = search.createFilter({
                                    name: 'isinactive',
                                    operator: 'is',
                                    values: 'F'
                                });
                                filtros_document[1] = search.createFilter({
                                    name: 'custrecord_lmry_fact_electronica',
                                    operator: 'is',
                                    values: 'T'
                                });
                                // filtros_document[2] = search.createFilter({
                                //     name: 'formulatext',
                                //     formula: '{custrecord_lmry_country_applied}',
                                //     operator: 'startswith',
                                //     values: country_acento
                                // });
                                filtros_document[2] = search.createFilter({
                                    name: 'custrecord_lmry_country_applied',
                                    operator: 'anyof',
                                    values: [countryId]
                                });
    
                                var search_document = search.create({
                                    type: 'customrecord_lmry_tipo_doc',
                                    columns: ['internalid'],
                                    filters: filtros_document
                                });
                                var result_document = search_document.run().getRange({
                                    start: 0,
                                    end: 1000
                                });
                                if (result_document != null && result_document.length > 0) {
                                    for (var i = 0; i < result_document.length; i++) {
                                        json_document[result_document[i].getValue('internalid')] = result_document[i].getValue('internalid');
                                    }
                                }
                                if (json_document[document_type]) {
                                    libraryHandler.generate_and_send(country, id_load4, currentRPS);
                                }
                            }
                        }
                        // }
                    }
                    // ACTUALIZACION PORCENTAJE
                    setPercentage(stateId, current_transaction);
                    posible_error = '';
                    context.write({
                        key: current_transaction,
                        value: [state, 'T', country, posible_error, feature_vip, isFact, totalTransacciones, licensesSub, checkElectronicInvoicing, userId]
                    });
                }
            } catch (err) {
                log.error('Error catch [REDUCE]', err.valueOf().toString());
                logLbry.doLog({ tittle: '[reduce Context]', message: err, relatedScript: LMRY_script });
                libraryEmail.sendemail(' [reduce Context] ' + err, LMRY_script);
                if (err.valueOf().toString().indexOf('SSS_REQUEST_TIME_EXCEEDED') == -1) {
                    context.write({
                        key: current_transaction,
                        value: [state, 'F', country, posible_error, feature_vip, isFact, totalTransacciones, licensesSub, checkElectronicInvoicing, userId]
                    });
                } else {
                    context.write({
                        key: current_transaction,
                        value: [state, 'T', country, posible_error, feature_vip, isFact, totalTransacciones, licensesSub, checkElectronicInvoicing, userId]
                    });
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
            var userId = '';
            var subsidiary_id = '';
            try {
                var scriptObj = runtime.getCurrentScript();
                var userId = scriptObj.getParameter({
                    name: 'custscript_lmry_ip_params_user'
                });
                var stateId = scriptObj.getParameter({
                    name: 'custscript_lmry_ip_params_state'
                });
                var subsiOW = runtime.isFeatureInEffect({
                    feature: 'SUBSIDIARIES'
                });                                        
                    
                var state = '';
                var transaction_f = '';
                var c1 = 0,
                    c2 = 0;
                var country = '';
                var posible_error = '';
                var lista_invoices = [];
                var feature_vip = '';
                var checkElectronicInvoicing = false;
                var isFact = [];
                var totalTransacciones = 0;
                var licensesSub = '';

                context.output.iterator().each(function (key, value) {
                    value = JSON.parse(value);
                    state = value[0];
                    country = value[2];
                    feature_vip = value[4];
                    isFact.push(value[5]);
                    totalTransacciones = value[6];
                    licensesSub = value[7];
                    checkElectronicInvoicing = value[8];
                    userId = value[9];

                    c1++;
                    lista_invoices.push(key);

                    if (value[1] == 'F' || value[1] == 'R') {
                        transaction_f = transaction_f + key + '|';
                        posible_error = posible_error + value[3] + '|';
                        c2++;
                    }

                    return true;
                });

                var link = url.resolveScript({
                    scriptId: 'customscript_lmry_ei_mass_edocument_stlt',
                    deploymentId: 'customdeploy_lmry_ei_mass_edocument_stlt',
                    returnExternalUrl: false
                });

                var r_load = record.load({
                    type: 'customrecord_lmry_invoicing_populate',
                    id: stateId
                });

                var subsidiary = subsiOW ? r_load.getText({
                    fieldId: 'custrecord_lmry_ip_subsidiary'
                }) : '';

                subsidiary_id = subsiOW ? r_load.getValue({
                    fieldId: 'custrecord_lmry_ip_subsidiary'
                }) : '';

                if (c1 != c2 && feature_vip == false) {
                    r_load.setValue({
                        fieldId: 'custrecord_lmry_ip_url',
                        value: link
                    });
                }

                if (transaction_f == '') {
                    r_load.setValue({
                        fieldId: 'custrecord_lmry_ip_state',
                        value: '3'
                    });
                } else {
                    r_load.setValue({
                        fieldId: 'custrecord_lmry_ip_state',
                        value: '4-' + transaction_f
                    });
                    r_load.setValue({
                        fieldId: 'custrecord_lmry_ip_error',
                        value: posible_error
                    });
                }

                r_load.save({
                    disableTriggers: true,
                    ignoreMandatoryFields: true
                });

                // ENVIO DE CORREO EXITOSOS
                if (feature_vip == true && checkElectronicInvoicing == true) {
                    sleep(10000);
                    status(subsiOW, userId, country, lista_invoices, subsidiary, isFact, licensesSub, subsidiary_id);
                }
            } catch (error) {
                logLbry.doLog({ tittle: '[Summarize Context]', message: error, relatedScript: LMRY_script });
                sendErrorEmail('[summarize] ' + error, LMRY_script, '', userId, subsidiary_id);
                log.error('Summarize', error);
            }
        }

        function validarPreimpreso(licenses, country) {
            var devolver = [false, false, false, false, false, false, false];

            // Localizacion - Transaction Number Invoice, TN Credit Memo, TN Payment, TN Cash Sale, TN Payment Complement
            var features = {
                MX: [20, 132, 425, 146, 146, 870],
                BR: [140, 305, 668, 526, 734, 734],
                CO: [26, 387, 419, 419, 419, 419],
                BO: [37, 101, 417, 417, 417, 417],
                GT: [133, 390, 423, 423, 423, 423],
                PE: [136, 66, 67, 67, 849, 849],
                PA: [137, 391, 427, 427, 427, 427],
                DO: [399, 524, 525, 525, 525, 525],
                PY: [38, 108, 110, 110, 110, 110]
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

        function setearPreImpreso(subsiOW, invoice, country, feature_tranid, preImpresoLote, pymtCompFieldId) {
            var preImpreso = invoice.getValue('custbody_lmry_num_preimpreso');
            if (country == 'MEX' || country == 'BOL' || country == 'GUA') {
                if (!preImpreso) {
                    invoice.setValue('custbody_lmry_num_preimpreso', preImpresoLote);
                }

                if (invoice.type != 'customtransaction_lmry_payment_complemnt') {
                    setearTranId(subsiOW, invoice, country, feature_tranid);
                } else {
                    setearTranId(subsiOW, invoice, pymtCompFieldId, feature_tranid);
                }
            } else {
                var serieCxc = invoice.getValue('custbody_lmry_serie_doc_cxc');
                if (preImpreso == null || preImpreso == '') {
                    // Trae el ultimo numero pre-impreso
                    var wtax_type = search.create({
                        type: 'customrecord_lmry_serie_impresion_cxc',
                        filters: [
                            ['internalid', 'anyof', serieCxc]
                        ],
                        columns: [
                            search.createColumn({
                                name: 'formulanumeric',
                                formula: '{custrecord_lmry_serie_numero_impres}'
                            }),
                            'custrecord_lmry_serie_rango_fin',
                            'custrecord_lmry_serie_num_digitos'
                        ]
                    });
                    var results = wtax_type.run().getRange(0, 1);
                    var columns = wtax_type.columns;
                    var nroConse = parseInt(results[0].getValue(columns[0])) + 1;
                    var nroConse_2 = nroConse;
                    var maxPermi = parseInt(results[0].getValue(columns[1]));
                    var digitos = parseInt(results[0].getValue(columns[2]));

                    if (digitos != null && digitos != '' && nroConse <= maxPermi) {
                        var longNumeroConsec = parseInt(String(nroConse).length);
                        var llenarCeros = '';
                        for (var i = 0; i < (digitos - longNumeroConsec); i++) {
                            llenarCeros += '0';
                        }
                        nroConse = llenarCeros + nroConse;

                        if (nroConse != null && nroConse != '') {
                            invoice.setValue({
                                fieldId: 'custbody_lmry_num_preimpreso',
                                value: nroConse
                            });

                            // Actualiza el numero Correlativo en las series de impresion
                            var upd_serie = record.submitFields({
                                type: 'customrecord_lmry_serie_impresion_cxc',
                                id: serieCxc,
                                values: {
                                    custrecord_lmry_serie_numero_impres: nroConse_2
                                },
                                options: {
                                    disableTriggers: true,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }

                        // Valida Feature y actualiza la transaccion
                        setearTranId(subsiOW, invoice, country, feature_tranid);
                    }
                }
            } // NO ES MX
        }

        function setearTranId(subsiOW, invoice, country, feature_tranid) {
            if (feature_tranid == true) {
                posible_error = 'Tranid';

                var urlpais = runtime.getCurrentScript().getParameter('custscript_lmry_netsuite_location');

                var tranprefix = '';
                if (subsiOW) {
                    var subsidiaria = invoice.getValue({
                        fieldId: 'subsidiary'
                    });
                    tranprefix = getPrefijo(subsidiaria);
                }

                var DocuTipo = '';
                if (invoice.type == 'customtransaction_lmry_payment_complemnt') {
                    DocuTipo = invoice.getValue({
                        fieldId: 'custpage_document_type'
                    });
                    if (!DocuTipo && country) {
                        var pcDoc = search.lookupFields({
                            type: 'customrecord_lmry_complem_paymnt_fields',
                            id: country,
                            columns: ['custrecord_lmry_complm_document_type']
                        }).custrecord_lmry_complm_document_type;
                        if (pcDoc.length > 0 && pcDoc[0].value) DocuTipo = pcDoc[0].value;
                    }
                } else {
                    DocuTipo = invoice.getValue({
                        fieldId: 'custbody_lmry_document_type'
                    });
                }

                if (DocuTipo != null && DocuTipo != '') {
                    DocuTipo = search.lookupFields({
                        type: 'customrecord_lmry_tipo_doc',
                        id: DocuTipo,
                        columns: ['custrecord_lmry_doc_initials']
                    });
                    DocuTipo = DocuTipo.custrecord_lmry_doc_initials;
                }
                if (DocuTipo == '' || DocuTipo == null) {
                    DocuTipo = '';
                }
                var DocuSeri = '';
                if (invoice.type == 'customtransaction_lmry_payment_complemnt') {
                    DocuSeri = invoice.getValue({
                        fieldId: 'custpage_serie_doc'
                    });
                } else {
                    DocuSeri = invoice.getValue({
                        fieldId: 'custbody_lmry_serie_doc_cxc'
                    });
                }
                if (DocuSeri != null && DocuSeri != '') {
                    DocuSeri = search.lookupFields({
                        type: 'customrecord_lmry_serie_impresion_cxc',
                        id: DocuSeri,
                        columns: ['name']
                    });
                    DocuSeri = DocuSeri.name;
                }
                var DocuPrei = invoice.getValue({
                    fieldId: 'custbody_lmry_num_preimpreso'
                });

                var texto = '';
                if (tranprefix != '' && tranprefix != null) {
                    texto = tranprefix + ' ' + DocuTipo.toUpperCase() + ' ' + DocuSeri + '-' + DocuPrei;
                } else {
                    texto = DocuTipo.toUpperCase() + ' ' + DocuSeri + '-' + DocuPrei;
                }

                if (texto != '' && texto != null) {
                    invoice.setValue({
                        fieldId: 'tranid',
                        value: texto
                    });
                }
            }
        }

        // Prefijo de la Subsidiaria
        function getPrefijo(subsidiaria) {
            var featuresubs = runtime.isFeatureInEffect({
                feature: 'SUBSIDIARIES'
            });
            var strdata = '';

            if (featuresubs == true || featuresubs == 'T') {
                strdata = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiaria,
                    columns: ['tranprefix']
                });
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

        function idConnectionStatus(subsiOW, id_load_2, document_type, current_transaction, idTransaction) {
            var id_con = '';

            var filtrosPackage = [];
            filtrosPackage[0] = search.createFilter({
                name: 'custrecord_lmry_ei_pckg_doc_type',
                operator: 'equalto',
                values: document_type
            });
            filtrosPackage[1] = search.createFilter({
                name: 'custrecord_lmry_ei_pckg_trans_type',
                operator: 'anyof',
                values: idTransaction
            });
            if (subsiOW) {
                filtrosPackage[2] = search.createFilter({
                    name: 'custrecord_lmry_ei_pckg_subsi',
                    operator: 'anyof',
                    values: id_load_2.getValue('subsidiary')
                });
            }

            var objbusqPrueba = search.create({
                type: 'customrecord_lmry_ei_pckg',
                columns: ['custrecord_lmry_ei_pckg_subsi',
                    'custrecord_lmry_ei_pckg_doc_type',
                    'custrecord_lmry_ei_pckg_template',
                    'custrecord_lmry_ei_pckg_sm'
                ],
                filters: filtrosPackage
            });

            var resultadoPrueba = objbusqPrueba.run().getRange(0, 50);

            // SOLO AGARRA EL PRIMER VALOR YA QUE DEBE IR DENTRO DE UN FOR
            if (resultadoPrueba != null && resultadoPrueba.length != 0) {
                var row = resultadoPrueba[0].columns;
                var subsi = resultadoPrueba[0].getValue(row[0]);
                var _doc_fiscal = resultadoPrueba[0].getValue(row[1]);
                var template = resultadoPrueba[0].getValue(row[2]);
                var send_method = resultadoPrueba[0].getValue(row[3]);

                if ((template != null && template != '') && (send_method != null && send_method != '')) {
                    /* RECORD: LatamReady - EI Connection Status */
                    var busqeiprint = search.create({
                        type: 'customrecord_lmry_ei_con_status',
                        columns: ['custrecord_lmry_ei_con_rel_txn',
                            'custrecord_lmry_ei_con_subsidiary',
                            'custrecord_lmry_ei_con_doc',
                            'custrecord_lmry_ei_con_temp',
                            'custrecord_lmry_ei_con_sm',
                            'custrecord_lmry_ei_con_status'
                        ],
                        filters: [
                            ['custrecord_lmry_ei_con_rel_txn', 'anyof', current_transaction]
                        ]
                    });

                    var resultprint = busqeiprint.run().getRange(0, 1000);

                    var connectionprint = '';
                    if (resultprint == null || resultprint.length == 0) {
                        /* Llenado de tabla: LatamReady - EI Connection Status */
                        connectionprint = record.create({
                            type: 'customrecord_lmry_ei_con_status'
                        });
                        connectionprint.setValue('custrecord_lmry_ei_con_rel_txn', current_transaction);
                        connectionprint.setValue('custrecord_lmry_ei_con_status', 1);
                    } else {
                        connectionprint = record.load({
                            type: 'customrecord_lmry_ei_con_status',
                            id: resultprint[0].id
                        });
                    }

                    if (subsiOW) {
                        connectionprint.setValue('custrecord_lmry_ei_con_subsidiary', subsi);
                    }

                    connectionprint.setValue('custrecord_lmry_ei_con_doc', _doc_fiscal);
                    connectionprint.setValue('custrecord_lmry_ei_con_temp', template);
                    connectionprint.setValue('custrecord_lmry_ei_con_sm', send_method);
                    id_con = connectionprint.save({
                        disableTriggers: true,
                        ignoreMandatoryFields: true
                    });
                } else {
                    return true;
                }
            }

            return id_con;
        }

        // Se realiza la validacion para Mexico
        function validarAcentos(s) {
            var AccChars = 'ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ&°–—ªº·';
            var RegChars = 'SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyyo--ao.';

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

        function status(subsiOW, userId, country, arregloInvoice, subsidiary, isFact, licensesSub, subsidiary_id) {
            // STATUS, STATUS-COUNTRY, HORA-COUNTRY, STATUS-GLOBAL, HORA-GLOBAL
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

            // BRAZIL, ARGENTINA, CHILE, COLOMBIA, PANAMA: LatamReady - EI Documents Status
            // var record = ['customrecord_lmry_ar_fel_estado','customrecord_lmry_ei_docs_status','customrecord_lmry_cl_ei_docs_status','customrecord_lmry_co_ei_docs_status'];
            var recordDoc = ['customrecord_lmry_ei_docs_status'];
            // STATUS
            /* var columnas = ['custrecord_lmry_ar_estado_comfiar','custrecord_lmry_ei_ds_doc_status','custrecord_lmry_cl_ei_doc_status','custrecord_lmry_co_ei_doc_status',
            'custbody_lmry_pe_estado_sf','custbody_lmry_pe_estado_comfiar']; */
            var columnas = ['custrecord_lmry_ei_ds_doc_status', 'custbody_lmry_pe_estado_sf', 'custbody_lmry_pe_estado_comfiar', 'custrecord_lmry_ei_ds_restart'];
            // IDS
            // var columnas2 = ['custrecord_lmry_ar_fel_transac','custrecord_lmry_ei_ds_doc','custrecord_lmry_cl_ei_doc','custrecord_lmry_co_ei_doc'];
            var columnas2 = ['custrecord_lmry_ei_ds_doc'];

            switch (country) {
                case 'ARG':
                    posicion = 0;
                    break;
                case 'BOL':
                    posicion = 0;
                    break;
                case 'BRA':
                    posicion = 0;
                    break;
                case 'CHI':
                    posicion = 0;
                    break;
                case 'COL':
                    posicion = 0;
                    break;
                case 'MEX':
                    posicion = 1;
                    break;
                case 'PER':
                    posicion = 2;
                    break;
                case 'PAN':
                    posicion = 0;
                    break;
                case 'COS':
                    posicion = 0;
                    break;
                case 'ECU':
                    posicion = 0;
                    break;
                case 'URU':
                    posicion = 0;
                    break;
                case 'GUA':
                    posicion = 0;
                    break;
                case 'DOM':
                    posicion = 0;
                    break;
                case 'PAR':
                    posicion = 0;
                    break;
            }

            var c = 0,
                bandera = true;
            while (bandera) {
                var aux = arregloInvoice.slice(c, c + 900);

                if (aux.length == 900) {
                    c += 900;
                } else {
                    bandera = false;
                }

                // custrecord_lmry_ar_fel_transac,custrecord_lmry_cl_ei_doc,custrecord_lmry_co_ei_doc

                var filtros = [
                    search.createFilter({
                        name: 'custrecord_lmry_ei_ds_doc',
                        operator: 'anyof',
                        values: aux
                    })
                ];

                if (country == 'MEX') {
                    var mxTypes = ['CustCred', 'CustInvc', 'CustPymt', 'ItemShip'];

                    if (libraryFeature.getAuthorization(703, licensesSub) == true) {
                        var mxRcd = record.create({ type: 'customtransaction_lmry_payment_complemnt' });
                        mxTypes.push(mxRcd.getValue('type'));
                    }

                    var search_custbody = search.create({
                        type: 'transaction',
                        columns: [columnas[posicion], 'internalid', search.createColumn({ name: 'custrecord_lmry_ei_ds_restart', join: 'CUSTRECORD_LMRY_EI_DS_DOC' })],
                        filters: [{
                                name: 'internalid',
                                operator: 'anyof',
                                values: aux
                            },
                            {
                                name: 'mainline',
                                operator: 'is',
                                values: 'T'
                            },
                            {
                                name: 'type',
                                operator: 'anyof',
                                values: mxTypes
                            }
                        ]
                    });
                    var result_custbody = search_custbody.run().getRange({
                        start: 0,
                        end: 900
                    });

                    if (result_custbody != null && result_custbody.length > 0) {
                        for (var i = 0; i < result_custbody.length; i++) {
                            json_full[result_custbody[i].getValue('internalid')][0] = result_custbody[i].getValue(columnas[posicion]);
                            json_full[result_custbody[i].getValue('internalid')][5] = result_custbody[i].getValue({ name: 'custrecord_lmry_ei_ds_restart', join: 'CUSTRECORD_LMRY_EI_DS_DOC' });
                        }
                    }
                } else if (country == 'PER') {
                    var search_custbody = search.create({
                        type: 'transaction',
                        columns: [columnas[posicion], 'internalid', search.createColumn({ name: 'custrecord_lmry_ei_ds_restart', join: 'CUSTRECORD_LMRY_EI_DS_DOC' })],
                        filters: [{
                                name: 'internalid',
                                operator: 'anyof',
                                values: aux
                            },
                            {
                                name: 'mainline',
                                operator: 'is',
                                values: 'T'
                            },
                            {
                                name: 'type',
                                operator: 'anyof',
                                values: ['CustCred', 'CustInvc', 'CashSale']
                            }
                        ]
                    });
                    var result_custbody = search_custbody.run().getRange({
                        start: 0,
                        end: 900
                    });

                    if (result_custbody != null && result_custbody.length > 0) {
                        for (var i = 0; i < result_custbody.length; i++) {
                            json_full[result_custbody[i].getValue('internalid')][0] = result_custbody[i].getValue(columnas[posicion]);
                            json_full[result_custbody[i].getValue('internalid')][5] = result_custbody[i].getValue({ name: 'custrecord_lmry_ei_ds_restart', join: 'CUSTRECORD_LMRY_EI_DS_DOC' });
                        }
                    }
                } else {
                    // RECORD COUNTRY
                    var search_r_status = search.create({
                        type: recordDoc[posicion],
                        columns: [columnas[posicion], columnas2[posicion], 'lastmodified', columnas[3]],
                        filters: [filtros[posicion]]
                    });
                    var result_r_status = search_r_status.run().getRange({
                        start: 0,
                        end: 900
                    });

                    // Visualiza el resultado de una busqueda

                    if (result_r_status != null && result_r_status.length > 0) {
                        for (var i = 0; i < result_r_status.length; i++) {
                            json_full[result_r_status[i].getValue(columnas2[posicion])][0] = result_r_status[i].getValue(columnas[posicion]);
                            json_full[result_r_status[i].getValue(columnas2[posicion])][5] = result_r_status[i].getValue(columnas[3]);
                        }
                    }
                }
            }

            var ei_status_Countries = {
                ARG: {
                    Aprobado: ['Observado', 'OBSERVADO', 'Aprobado', 'APROBADO'],
                    Procesando: ['Procesando', 'PROCESANDO']
                },
                BOL: {
                    Aprobado: ['Aceptado', 'ACEPTADO'],
                    Procesando: ['Procesando', 'PROCESANDO']
                },
                BRA: {
                    Aprobado: ['Observado', 'OBSERVADO', 'Autorizado', 'AUTORIZADO'],
                    Procesando: ['Procesando', 'PROCESANDO']
                },
                CHI: {
                    Aprobado: ['Emitido', 'EMITIDO', 'APROBADO POR SII', 'Emilocal', 'EMILOCAL'],
                    Procesando: ['Procesando', 'PROCESANDO']
                },
                COL: {
                    Aprobado: ['Autorizado', 'AUTORIZADO'],
                    Procesando: ['Procesando', 'PROCESANDO', 'Caida por Intermitencia']
                },
                COS: {
                    Aprobado: ['Observado', 'OBSERVADO', 'Aprobado', 'APROBADO', 'Autorizado', 'AUTORIZADO'],
                    Procesando: ['Procesando', 'PROCESANDO']
                },
                DOM: {
                    Aprobado: ['Autorizado', 'AUTORIZADO'],
                    Procesando: ['Procesando', 'PROCESANDO']
                },
                ECU: {
                    Aprobado: ['Autorizado', 'AUTORIZADO'],
                    Procesando: ['Procesando', 'PROCESANDO', 'Aceptado', 'ACEPTADO']
                },
                GUA: {
                    Aprobado: ['Autorizado', 'AUTORIZADO'],
                    Procesando: ['Procesando', 'PROCESANDO']
                },
                MEX: {
                    Aprobado: ['Generado', 'GENERADO'],
                    Procesando: ['Procesando', 'PROCESANDO']
                },
                PAN: {
                    Aprobado: ['Autorizado', 'AUTORIZADO'],
                    Procesando: ['Procesando', 'PROCESANDO']
                },
                PAR: {
                    Aprobado: ['Autorizado', 'AUTORIZADO'],
                    Procesando: ['Procesando', 'PROCESANDO']
                },
                PER: {
                    Aprobado: ['Autorizado', 'AUTORIZADO'],
                    Procesando: ['Procesando', 'PROCESANDO', 'Aceptado', 'ACEPTADO']
                },
                URU: {
                    Aprobado: ['Observado', 'OBSERVADO', 'Autorizado', 'AUTORIZADO', 'Generado', 'GENERADO'],
                    Procesando: ['Procesando', 'PROCESANDO']
                }
            };

            var status_aprobado = ei_status_Countries[country].Aprobado;
            var status_procesando = ei_status_Countries[country].Procesando;

            //  var status_countries = ['Aprobado', 'Observado', 'EMITIDO', 'APROBADO POR SII', 'APROBADO', 'AUTORIZADO', 'Autorizado', 'Generado', 'ACEPTADO', 'Cancelada', 'Cancelado', 'Denegada', 'Cancelando', 'No Cancelado', 'No Cancelada', 'EMILOCAL', 'Corregido', 'CORREGIDO'];
            //  var status_countries_error = ['Error', 'ERROR', 'Rechazado', 'RECHAZADO'];

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

            // FALLIDOS
            // ARGENTINA-BRAZIL-CHILE-COLOMBIA-MEXICO-PERU: LatamReady - EI Log of Documents
            // var record_f = ['customrecord_lmry_ar_fel_lote_envio','customrecord_lmry_ei_log_docs','customrecord_lmry_cl_ei_log_docs','customrecord_lmry_co_ei_log_docs','customrecord_lmry_mx_fel_log_docs','customrecord_lmry_pe_fel_lote_envio'];
            // var response_f = ['custrecord_lmry_ar_envio_resp','custrecord_lmry_ei_ld_response','custrecord_lmry_cl_ei_response','custrecord_lmry_co_ei_response','custrecord_lmry_mx_fel_response','custrecord_lmry_pe_envio_resp'];
            var formula_f = ['{custrecord_lmry_ar_envio_transac.internalid}', '{customrecord_lmry_ei_log_docs.internalid}', '{custrecord_lmry_cl_ei_document.internalid}', '{custrecord_lmry_co_ei_document.internalid}', '{custrecord_lmry_mx_fel_document.internalid}', '{custrecord_lmry_pe_envio_transac.internalid}'];
            // var invoice_f = ['custrecord_lmry_ar_envio_transac','custrecord_lmry_ei_ld_doc','custrecord_lmry_cl_ei_document','custrecord_lmry_co_ei_document','custrecord_lmry_mx_fel_document','custrecord_lmry_pe_envio_transac'];

            log.debug('Fallidos', fallidos);
            log.debug('Cantidad de fallidos', fallidos.length);

            if (fallidos.length > 0) {
                var aux = [];
                var aux_id = [];
                var aux2 = [];
                while (bandera) {
                    var fallidos_c = fallidos.slice(c, c + 900);
                    if (fallidos_c.length == 900) {
                        c += 900;
                    } else {
                        bandera = false;
                    }

                    var search_fallidos = search.create({
                        type: 'customrecord_lmry_ei_log_docs',
                        filters: [{
                            name: 'custrecord_lmry_ei_ld_doc',
                            operator: 'anyof',
                            values: fallidos_c
                        }],
                        columns: [{
                            name: 'custrecord_lmry_ei_ld_doc',
                            sort: search.Sort.DESC
                        }, {
                            name: 'internalid',
                            sort: search.Sort.DESC
                        }]
                    });

                    var c2 = 0;

                    var run_fallidos = search_fallidos.run();
                    var run_fallidos2 = run_fallidos.getRange({
                        start: c2,
                        end: c2 + 900
                    });

                    var bandera2 = true;

                    if (run_fallidos2 != null && run_fallidos2.length > 0) {
                        while (bandera2) {
                            var run_fallidos2 = run_fallidos.getRange({
                                start: c2,
                                end: c2 + 900
                            });
                            for (var i = 0; i < run_fallidos2.length; i++) {
                                var columnas_run = run_fallidos2[0].columns;
                                aux.push(run_fallidos2[i].getValue(columnas_run[1]));
                                aux_id.push(run_fallidos2[i].getValue(columnas_run[0]));
                            }

                            if (run_fallidos2.length == 900) {
                                c2 += 900;
                            } else {
                                bandera2 = false;
                            }
                        }

                        for (var a = 0; a < aux_id.length; a++) {
                            if (a == 0) {
                                aux2.push(aux[a]);
                            }
                            if (a > 0) {
                                if (aux_id[a] != aux_id[a - 1]) {
                                    aux2.push(aux[a]);
                                }
                            }
                        }
                    }

                    if (aux2.length > 0) {
                        var search_fallidos2 = search.create({
                            type: 'customrecord_lmry_ei_log_docs',
                            filters: [{
                                name: 'internalid',
                                operator: 'anyof',
                                values: aux2
                            }],
                            columns: ['custrecord_lmry_ei_ld_response', 'custrecord_lmry_ei_ld_doc']
                        });

                        var result_fallidos = search_fallidos2.run().getRange({
                            start: 0,
                            end: 900
                        });
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
                    if (!json_full[i][4]) {
                        tranNoFact.push(json_full[i][2])
                    } else {
                        tran_fallidos.push(json_full[i][2]);
                        if (json_full[i][3] == 'No' || json_full[i][3] == '' || json_full[i][3] == null) {
                            errores.push('No hay detalles del error');
                        } else {
                            errores.push(json_full[i][3]);
                        }
                    }
                    //errores.push(json_full[i][3]);
                }
            }

            var employee = search.lookupFields({
                type: search.Type.EMPLOYEE,
                columns: ['email', 'firstname'],
                id: userId
            });
            var employee_email = employee.email;
            var employee_name = employee.firstname;

            var body = messageBody2(subsiOW, tran_aceptados, tran_fallidos, errores, subsidiary, employee_name, tran_procesando, tranNoFact, tran_reiniciados);
            // log.debug('Cantidad de caracteres correo',body.length);

            //Busqueda de record enable feature en chile para envío de email resumen de masivo
            var enviarCorreo = true;
            log.debug("enviarCorreo1", enviarCorreo);
            if (country == 'CHI') {
                busqEnabFeat = search.create({
                    type: 'customrecord_lmry_cl_ei_enable_features',
                    columns: ['custrecord_lmry_cl_ei_email_resumen'],
                    filters: ['custrecord_lmry_cl_ei_subsi', 'is', subsidiary_id]
                });
                var resultEnabFet = busqEnabFeat.run().getRange(0, 10);
                log.debug("busqueda", resultEnabFet);
                if (resultEnabFet != null && resultEnabFet.length != 0) {
                    row = resultEnabFet[0].columns;
                    enviarCorreo = resultEnabFet[0].getValue('custrecord_lmry_cl_ei_email_resumen');
                }
                log.debug("enviar correo masivo", enviarCorreo);
            } 

            if (enviarCorreo) {
                email.send({
                    author: userId,
                    recipients: employee_email,
                    subject: 'LatamReady - Advanced Sales Flow',
                    body: body
                });
            }

        }

        function tranid_json(json_invoice, arreglo) {
            if (arreglo.length > 0) {
                var aux_x = [];
                var x = 0;
                var bandera = true;
                while (bandera) {
                    aux_x = arreglo.slice(x, x + 900);

                    if (aux_x.length == 900) {
                        x += 900;
                    } else {
                        bandera = false;
                    }
                    // 2020.01.08 - Se agrego el fitro MainLine = 'T'
                    var search_invoice = search.create({
                        type: 'transaction',
                        columns: ['internalid', 'tranid'],
                        filters: [{
                            name: 'internalid',
                            operator: 'anyof',
                            values: aux_x
                        }, {
                            name: 'mainline',
                            operator: 'is',
                            values: 'T'
                        }]
                    });
                    var result_invoice = search_invoice.run().getRange({
                        start: 0,
                        end: 900
                    });

                    if (result_invoice != null && result_invoice.length > 0) {
                        for (var a = 0; a < result_invoice.length; a++) {
                            json_invoice[result_invoice[a].getValue('internalid')][2] = result_invoice[a].getValue('tranid');
                        }
                    }
                }
            }

            return json_invoice;
        }

        function messageBody(subsiOW, tranSent, tranFail, respond, subsidiary, name, tranProc, tranNoFact, tranRestart) {
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
                body += '<li type="disc">' + tranSent[i] + '</li>';
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
                body += '<li type="disc">' + tranFail[i] + '</li>';
                body += '<p style="padding-left:20px;">' + respond[i] + '</p>';
            }
            body += '</ul>';

            body += '<p><b>Documentos No Electronicos: </b>' + tranNoFact.length + '</p><ul>';
            for (i = 0; i < tranNoFact.length; i++) {
                body += '<li type="disc">' + tranNoFact[i] + '</li>';
            }
            body += '</ul>';

            body += '<p><b>Transacciones con posible Reproceso: </b>' + tranRestart.length + '</p><ul>';
            for (i = 0; i < tranRestart.length; i++) {
                body += '<li type="disc">' + tranRestart[i] + '</li>';
            }
            body += '</ul>';
            if (tranRestart.length > 0) {
                if (tranRestart.length > 1) {
                    body += '<p>Verificar manualmente las transacciones</p>';
                } else {
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

        function generateRPS(newRecord, subsiOW) {
            var printSerie  = newRecord.getValue({ fieldId: "custbody_lmry_serie_doc_cxc"});
            if (!printSerie) return;
            var searchBR = search.create({
                type: 'customrecord_lmry_br_transaction_fields',
                columns: ['internalid', 'custrecord_lmry_br_rps', 'custrecord_lmry_br_related_transaction'],
                filters: [{
                    name: 'custrecord_lmry_br_related_transaction',
                    operator: 'anyof',
                    values: newRecord.id
                }]
            });
            var stsResult = searchBR.run().getRange({ start: 0, end: 1 });
            var rps = "";
            if (stsResult.length > 0) rps = stsResult[0].getValue({ name: "custrecord_lmry_br_rps" }) || "";            
            if (rps) return;
            var serieSearch = search.lookupFields({
                type: "customrecord_lmry_serie_impresion_cxc",
                id: printSerie,
                columns: ["custrecord_lmry_serie_tipo_doc_cxc.custrecord_lmry_codigo_doc"]
            });
            var validateCodeSerie = serieSearch["custrecord_lmry_serie_tipo_doc_cxc.custrecord_lmry_codigo_doc"] == "99";
            if (!validateCodeSerie) return;
            var bulkRpsAssignmentRecord = record.create({ type: "customrecord_lmry_br_bulk_rps_assigment" });
            bulkRpsAssignmentRecord.setValue({ fieldId: "custrecord_lmry_br_brpsa_transaction", value: newRecord.id });
            if (subsiOW) bulkRpsAssignmentRecord.setValue({ fieldId: "custrecord_lmry_br_brpsa_subsidiary", value: newRecord.getValue({ fieldId: "subsidiary"})});
            bulkRpsAssignmentRecord.setValue({ fieldId: "custrecord_lmry_br_brpsa_serie", value: printSerie });
            bulkRpsAssignmentRecord.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: false });
        }

        function setPercentage(stateId, current_transaction) {
            var searchLog = search.lookupFields({
                type: 'customrecord_lmry_invoicing_populate',
                id: stateId,
                columns: ['custrecord_lmry_ip_json_count']
            });
            var jsonCount = JSON.parse(searchLog.custrecord_lmry_ip_json_count);
            jsonCount[current_transaction] = true;

            record.submitFields({
                type: 'customrecord_lmry_invoicing_populate',
                id: stateId,
                values: {
                    custrecord_lmry_ip_json_count: JSON.stringify(jsonCount)
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true,
                    disableTriggers: true
                }
            });
        }

        function setTransactionType(loadTransaction) {
            var searchTransactionType = search.create({
                type: 'customrecord_lmry_trantype',
                filters: [{
                    name: 'name',
                    operator: 'is',
                    values: loadTransaction.getValue('type')
                }]
            });
            searchTransactionType = searchTransactionType.run().getRange({
                start: 0,
                end: 1
            });

            if (searchTransactionType && searchTransactionType.length) {
                loadTransaction.setValue('custbody_lmry_br_transaction_type', searchTransactionType[0].id);
            }
        }

        function getPymtCompFields(idTransacciones) {
            try {
                var pymtCompArr = {};
                if (idTransacciones.length == 0) return pymtCompArr;
                var pymtCompFields = search.create({
                    type: 'customrecord_lmry_complem_paymnt_fields',
                    filters: [
                        ['custrecord_lmry_related_complmnt_paym', 'anyof', idTransacciones]
                    ],
                    columns: [
                        'custrecord_lmry_related_complmnt_paym'
                    ]
                });
                pymtCompFields = pymtCompFields.run().getRange(0, 1000);
                if (pymtCompFields.length == 0) return pymtCompArr;
                pymtCompFields.forEach(function (data) {
                    pymtCompArr[data.getValue('custrecord_lmry_related_complmnt_paym')] = data.id;
                });
                return pymtCompArr;
            } catch (error) {
                logLbry.doLog({ tittle: '[getPymtCompFields]', message: error, relatedScript: LMRY_script });
                log.error('getPymtCompFields', error);
                libraryEmail.sendemail(' [ getPymtCompFields ] ' + error, LMRY_script);
            }
        }

        function messageBody2(subsiOW, tranSent, tranFail, respond, subsidiary, name, tranProc, tranNoFact, tranRestart) {
            var bodyHtml = '<div style="color: #483838; margin-bottom: 2.5rem" class="container-body"><div style="text-align: center ; margin-top: 20px;"><img src="https://1016414.app.netsuite.com/core/media/media.nl?id=6151966&c=1016414&h=EoGH8QDhKQhwmCAeNsR80_AoyBB4_VVR5QSV9gDXBkld4VI_" alt="" class="imgBanner" /><p style="font-size: 18px"><strong>Dear: </strong>';
            bodyHtml += name;
            bodyHtml += '</p></div>';
            if (tranSent.length + tranFail.length + tranProc.length + tranNoFact.length + tranRestart.length == 1) {
                if (subsiOW) {
                    bodyHtml += '<p style="margin-bottom: 1.5rem">Este es un mensaje automático de LatamReady SuiteApp.</p><p style="margin-bottom: 1.5rem">Se ha enviado automáticamente una transacción para: <strong>';
                    bodyHtml += subsidiary;
                    bodyHtml += '</strong>';
                } else {
                    bodyHtml += '<p style="margin-bottom: 1.5rem">Este es un mensaje automático de LatamReady SuiteApp.</p><p style="margin-bottom: 1.5rem">Se ha enviado automáticamente una transacción';
                }
            } else if (tranSent.length + tranFail.length + tranProc.length + tranNoFact.length + tranRestart.length > 1) {
                if (subsiOW) {
                    bodyHtml += '<p style="margin-bottom: 1.5rem">Este es un mensaje automático de LatamReady SuiteApp.</p><p style="margin-bottom: 1.5rem">Se ha enviado automáticamente un total de ' + (tranSent.length + tranFail.length + tranProc.length + tranNoFact.length + tranRestart.length) + ' transacciones para: <strong>';
                    bodyHtml += subsidiary;
                    bodyHtml += '</strong>';
                } else {
                    bodyHtml += '<p style="margin-bottom: 1.5rem">Este es un mensaje automático de LatamReady SuiteApp.</p><p style="margin-bottom: 1.5rem">Se ha enviado automáticamente un total de ' + (tranSent.length + tranFail.length + tranProc.length + tranNoFact.length + tranRestart.length) + ' transacciones.';
                }
            }
            bodyHtml += '</p><h2 style="font-size: 18px">Detalles</h2>';
            bodyHtml += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem" role="presentation"><tbody style="line-height: 24px">';
            bodyHtml += '<tr style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;"><td style="padding: 10px">Envios exitosos: <strong>';
            bodyHtml += tranSent.length;
            bodyHtml += '</strong></td><ul>';
            for (var index = 0; index < tranSent.length; index++) {
                bodyHtml += '<li>';
                bodyHtml += tranSent[index];
                bodyHtml += '</li>';
            }
            bodyHtml += '</ul></tr>';
            bodyHtml += '<tr style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;"> <td style="padding: 10px">Envios procesando: <strong>';
            bodyHtml += tranProc.length;
            bodyHtml += '</strong></td><ul>';
            for (var index = 0; index < tranProc.length; index++) {
                bodyHtml += '<li>';
                bodyHtml += tranProc[index];
                bodyHtml += '</li>';
            }
            bodyHtml += '</ul></tr>';
            bodyHtml += '<tr style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;"> <td style="padding: 10px">Envios fallidos: <strong>';
            bodyHtml += tranFail.length;
            bodyHtml += '</strong></td><ul>';
            for (var index = 0; index < tranFail.length; index++) {
                bodyHtml += '<li>';
                bodyHtml += tranFail[index];
                bodyHtml += '</li>';
                bodyHtml += '<p style="padding-left:20px;">';
                bodyHtml += respond[index];
                bodyHtml += '</p>'
            }
            bodyHtml += '</ul></tr>';
            bodyHtml += '<tr style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;"> <td style="padding: 10px"> Documentos No Electrónicos: <strong>';
            bodyHtml += tranNoFact.length;
            bodyHtml += '</strong></td><ul>';
            for (var index = 0; index < tranNoFact.length; index++) {
                bodyHtml += '<li>';
                bodyHtml += tranNoFact[index];
                bodyHtml += '</li>';
            }
            bodyHtml += '</ul></tr>';
            bodyHtml += '<tr style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;"> <td style="padding: 10px">Transacciones con posible retroceso: <strong>';
            bodyHtml += tranRestart.length;
            bodyHtml += '</strong></td><ul>';
            for (var index = 0; index < tranRestart.length; index++) {
                bodyHtml += '<li>';
                bodyHtml += tranRestart[index];
                bodyHtml += '</li>';
            }
            bodyHtml += '</ul>';
            if (tranRestart.length > 0) {
                if (tranRestart.length > 1) {
                    bodyHtml += '<p>Verificar manualmente las transacciones</p>';
                }
                else {
                    bodyHtml += '<p>Verificar manualmente la transacción</p>';
                }
            }
            bodyHtml += '</tr ></tbody ></table >';
            bodyHtml += '<div style="width: 95%; margin: auto; background-color: #f0f9ff; color: #003f79; padding: 10px 12px; box-sizing: border-box; margin-bottom: 2rem;"><table><tr><td style="vertical-align: top"><img width="30px" height="30px" src="https://1016414.app.netsuite.com/core/media/media.nl?id=6151965&c=1016414&h=qCKXvyjFoov8NlpdT4AQIifLRqJAT1fnGYP_xgPEMW5Z7HU-" /></td><td style="vertical-align: top; padding-left: 15px; line-height: 1.3rem;">Please contact our Customer Service department at:<span style="text-decoration: underline">customer.care@latamready.com</span> who will take care of the matter.</td></tr></tabl</div><p>Regards,</p><p>The LatamReady Team</p></div>';

            var emailContent = _emailTemplate(bodyHtml);
            return emailContent;
        }

        function _emailTemplate(paramBody) {
            var html = '<!DOCTYPE html>'
            html += '<html lang="en"><head><meta charset="UTF-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><link href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap" rel="stylesheet" /><style> .container-body {padding: 0 1.5rem;} .fontSize {font - size: 16px;} .imgBanner {width: 290px;height: 234px;} .iconSocial {width: 30px;height: 30px;} @media screen and (max-width: 600px) { .container - body { padding: 0 10px; } .fontSize { font - size: 14px; } .imgBanner { width: 240px; height: 184px; } .iconSocial { width: 25px; height: 25px; } } </style> </head>';
            html += '<body><div style="border: 1px solid #fef3f3; border-radius: 10px; overflow: hidden; max-width: 700px; margin: auto; font-family: Montserrat, sans-serif;" class="fontSize"><div><img width="100%" src="https://1016414.app.netsuite.com/core/media/media.nl?id=6151967&c=1016414&h=DZIWMjYjN7IhRtwiyCwOobZPdii2HPuX2gRdiDk5epj3DHzM" style="display: block" /><div class="container-body" style="margin-top: 15px"><table style="width: 100%"><tbody><tr><td><a style="border: 1px solid #d50303; color: #d50303; padding: 5px 10px; border-radius: 5px; text-decoration: none; font-weight: bold;" href="http://www.latamready.com/#contac" target="_blank">Contact us</a></td><td style="text-align: right"><a href="https://www.latamready.com/" target="_blank" style="text-decoration: none; margin-right: 5px"><img class="iconSocial" src="https://1016414.app.netsuite.com/core/media/media.nl?id=6151968&c=1016414&h=bbcSjvW7AKfo_3wnROKNWDXv6lAO4BDIbQpvDiR5tpe133ok" alt="" /> </a><a href="https://twitter.com/LatamReady" target="_blank" style="text-decoration: none; margin-right: 5px"> <img class="iconSocial" src="https://1016414.app.netsuite.com/core/media/media.nl?id=6151969&c=1016414&h=51Knc5GNKaeTEd2yfGX4flK61J4WKMy995Zo_JAab7sv4KOy" alt=""/> </a><a href="https://www.linkedin.com/company/9207808" target="_blank" style="text-decoration: none; margin-right: 5px"> <img class="iconSocial" src="https://1016414.app.netsuite.com/core/media/media.nl?id=6151970&c=1016414&h=YDU_v4eQJEopaZ41K_8CQu8-20XO-eqsNg85v7n7OYonflr6" alt="" /> </a> <a href="https://www.facebook.com/LatamReady-337412836443120/" target="_blank" style="text-decoration: none; margin-right: 5px"> <img class="iconSocial" src="https://1016414.app.netsuite.com/core/media/media.nl?id=6151971&c=1016414&h=M7qqdXteju-ZqEFstjZ5S4IT4z1Xz-qtNb4qycJYkPF5B_E7" alt=""/></a></td></tr></tbody></table></div></div>';
            html += paramBody;
            html += '<div> <div style="margin-bottom: 16px; text-align: center"> <a href="https://www.latamready.com/" target="_blank" style="text-decoration: none; margin-right: 5px"> <img class="iconSocial" src="https://1016414.app.netsuite.com/core/media/media.nl?id=6151968&c=1016414&h=bbcSjvW7AKfo_3wnROKNWDXv6lAO4BDIbQpvDiR5tpe133ok" alt="" /> </a> <a href="https://twitter.com/LatamReady" target="_blank" style="text-decoration: none; margin-right: 5px"> <img class="iconSocial" src="https://1016414.app.netsuite.com/core/media/media.nl?id=6151969&c=1016414&h=51Knc5GNKaeTEd2yfGX4flK61J4WKMy995Zo_JAab7sv4KOy" alt="" /> </a> <a href="https://www.linkedin.com/company/9207808" target="_blank" style="text-decoration: none; margin-right: 5px"> <img class="iconSocial" src="https://1016414.app.netsuite.com/core/media/media.nl?id=6151970&c=1016414&h=YDU_v4eQJEopaZ41K_8CQu8-20XO-eqsNg85v7n7OYonflr6" alt="" /></a> <a href="https://www.facebook.com/LatamReady-337412836443120/" target="_blank" style="text-decoration: none; margin-right: 5px"> <img class="iconSocial" src="https://1016414.app.netsuite.com/core/media/media.nl?id=6151971&c=1016414&h=M7qqdXteju-ZqEFstjZ5S4IT4z1Xz-qtNb4qycJYkPF5B_E7" alt="" /> </a> </div> <img style="display: block" width="100%" src="https://1016414.app.netsuite.com/core/media/media.nl?id=6156977&c=1016414&h=J5kUMs2llOncCyvB4jf-JB2ICdxdWbpj4ZtZNRdRAxrmBHE5" alt=""/> </div> </div> </body> </html> ';

            return html;
        }

        function sendErrorEmail(paramMessage, paramScript, paramSuiteApp, userId, subsidiary_id) {
            var employee = search.lookupFields({
                type: search.Type.EMPLOYEE,
                columns: ['email', 'firstname'],
                id: userId
            });
            var user = {
                id: userId,
                name: employee.firstname,
                email: employee.email,
                subsidiary: Number(subsidiary_id)
            };

            var subsidiaryName = "";
            if (user.subsidiary && user.subsidiary != "" && user.subsidiary != null) {
                subsidiaryName = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: user.subsidiary,
                    columns: ["legalname"]
                })["legalname"];
            }

            var scriptId = runtime.getCurrentScript().id || paramScript;
            if (scriptId != paramScript) {
                paramSuiteApp = nSuiteAppInfo.listSuiteAppsContainingScripts({ scriptIds: [scriptId] });
                paramSuiteApp = paramSuiteApp[scriptId];
            }

            var bodyHtml = '<div style="color: #483838; margin-bottom: 2.5rem" class="container-body">';
            bodyHtml += '<div style="text-align: center">'
            bodyHtml += '<img src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81016&c=TSTDRV1930452&h=GDs3JoPtwSo-dWnfz1L8Tk_1vFRlHpFBTq0eqakr2pnpZ3gX" alt="" class="imgBanner" />'
            bodyHtml += '<p style="font-size: 18px">'
            bodyHtml += '<strong>Dear: </strong>' + user.name;
            bodyHtml += '</p>'
            bodyHtml += '</div>'
            bodyHtml += '<p style="margin-bottom: 25px">'
            bodyHtml += 'This is an automatic error message from latamready suiteApp'
            bodyHtml += '</p>'
            bodyHtml += '<div style="border-radius: 5px; border: 1px solid #dc2626; background-color: #fef2f2; padding: 16px; word-break: break-all;">'
            bodyHtml += '<img style="vertical-align: top" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81020&c=TSTDRV1930452&h=u2vzMLH9PlIftiP1wRuyWW5Zu3P52HUM4vxLo9xXtYihtu6e" alt="" />'
            bodyHtml += '<div style="width: 80%; display: inline-block; padding-left: 7px; color: #dc2626;">'
            bodyHtml += '<p style="margin: 0; margin-bottom: 5px; font-weight: bold">'
            bodyHtml += 'Script: ' + paramScript;
            bodyHtml += '</p>'
            bodyHtml += '<p style="margin: 0">'
            bodyHtml += paramMessage
            bodyHtml += '</p>'
            bodyHtml += '</div>'
            bodyHtml += '</div>'
            bodyHtml += '<p>More details of the error</p>'
            bodyHtml += '<div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">'
            bodyHtml += '<p style="font-weight: bold; margin: 0; margin-bottom: 5px">'
            bodyHtml += 'Date and hours'
            bodyHtml += '</p>'
            bodyHtml += '<p style="margin: 0">' + new Date() + '</p>'
            bodyHtml += '</div>'
            bodyHtml += '<div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">'
            bodyHtml += '<p style="font-weight: bold; margin: 0; margin-bottom: 5px">'
            bodyHtml += 'Enviroment'
            bodyHtml += '</p>'
            bodyHtml += '<p style="margin: 0">' + runtime.envType + '</p>'
            bodyHtml += '</div>'
            bodyHtml += '<div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">'
            bodyHtml += '<p style="font-weight: bold; margin: 0; margin-bottom: 5px">'
            bodyHtml += 'Account ID'
            bodyHtml += '</p>'
            bodyHtml += '<p style="margin: 0">' + runtime.accountId + '</p>'
            bodyHtml += '</div>'
            bodyHtml += '<div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">'
            bodyHtml += '<p style="font-weight: bold; margin: 0; margin-bottom: 5px">'
            bodyHtml += 'Employee Subsidiary'
            bodyHtml += '</p>'
            bodyHtml += '<p style="margin: 0">' + subsidiaryName + '</p>'
            bodyHtml += '</div>'
            bodyHtml += '<div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">'
            bodyHtml += '<p style="font-weight: bold; margin: 0; margin-bottom: 5px">'
            bodyHtml += 'Execution Context'
            bodyHtml += '</p>'
            bodyHtml += '<p style="margin: 0">' + runtime.executionContext + '</p>'
            bodyHtml += '</div>'
            bodyHtml += '<div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">'
            bodyHtml += '<p style="font-weight: bold; margin: 0; margin-bottom: 5px">'
            bodyHtml += 'SuiteApp ID'
            bodyHtml += '</p>'
            bodyHtml += '<p style="margin: 0">' + paramSuiteApp + '</p>'
            bodyHtml += '</div>'
            bodyHtml += '<div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">'
            bodyHtml += '<p style="font-weight: bold; margin: 0; margin-bottom: 5px">'
            bodyHtml += 'Script ID'
            bodyHtml += '</p>'
            bodyHtml += '<p style="margin: 0">' + scriptId + '</p>'
            bodyHtml += '</div>'
            bodyHtml += '<div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">'
            bodyHtml += '<p style="font-weight: bold; margin: 0; margin-bottom: 5px">'
            bodyHtml += 'Netsuite Released Version'
            bodyHtml += '</p>'
            bodyHtml += '<p style="margin: 0">' + runtime.version + '</p>'
            bodyHtml += '</div>'
            bodyHtml += '</div>'

            var emailContent = _emailTemplate(bodyHtml);

            if (user.email && user.email !== "" && user.email !== null) {
                email.send({
                    author: user.id,
                    body: emailContent,
                    recipients: [user.email],
                    subject: "LatamReady User Error"
                });
            }
        };

        return {
            getInputData: getInputData,
            // map: map,
            reduce: reduce,
            summarize: summarize
        };
    });