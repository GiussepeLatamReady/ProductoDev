/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_AdvanceFlow_STLT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 05/09/2023
 */
define(['N/runtime'],
    
    (runtime) => {

        let subsiOW = runtime.isFeatureInEffect({
            feature: 'SUBSIDIARIES'
        });

        let Language = runtime.getCurrentScript().getParameter({
            name: 'LANGUAGE'
        });
        Language = Language.substring(0, 2);

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

        }


        const setLanguage = () => {
            if (Language != 'es' && Language != 'pt') {
                Language = 'en';
            }
        }

        const advanced = (licenses, country, idFeature) => {
            const IPS = {
                ARG: 'AR',
                BOL: 'BO',
                BRA: 'BR',
                CHI: 'CL',
                COL: 'CO',
                COS: 'CR',
                DOM: 'DO',
                ECU: 'EC',
                GUA: 'GT',
                MEX: 'MX',
                PAN: 'PA',
                PER: 'PE',
                URU: 'UY',
                PAR: 'PY'
            }; // G.G

            return libraryFeature.getAuthorization(idFeature[IPS[country]], licenses);
        }

        const validarAcentos = (s) => {
            let AccChars = 'ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ&°–—ªº·';
            let RegChars = 'SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyyo--ao.';

            s = s.toString();
            for (let c = 0; c < s.length; c++) {
                for (let special = 0; special < AccChars.length; special++) {
                    if (s.charAt(c) == AccChars.charAt(special)) {
                        s = s.substring(0, c) + RegChars.charAt(special) + s.substring(c + 1, s.length);
                    }
                }
            }
            return s;
        }

        const status_invoice = (country, arrayInvoiceIds, subsidiary) => {
            // STATUS, STATUS-COUNTRY, HORA-COUNTRY, STATUS-GLOBAL, HORA-GLOBAL
            let json_full = {};

            arrayInvoiceIds.forEach(id => {
                if (json_full[id] == null || json_full[id] == undefined) {
                    json_full[id] = [];
                    json_full[id].push('No');
                    json_full[id].push('No');
                    json_full[id].push(0);
                    json_full[id].push('No');
                    json_full[id].push(0);
                }
            });

            let position = getPosition(country);

            // ARGENTINA,BRAZIL,CHILE Y COLOMBIA;
            
            // STATUS: OTROS-MEXICO-PERU
            let columnas = ['custrecord_lmry_ei_ds_doc_status', 'custbody_lmry_pe_estado_sf', 'custbody_lmry_pe_estado_comfiar'];                 

            if (country == 'MEX') {
                let mxTypes = ['CustInvc', 'CustCred', 'CustPymt', 'ItemShip'];

                let licenses = libraryFeature.getLicenses(subsidiary);
                if (libraryFeature.getAuthorization(703, licenses) == true) {
                    let mxRcd = recordApi.create({ type: 'customtransaction_lmry_payment_complemnt' });
                    mxTypes.push(mxRcd.getValue('type'));
                }

                let search_custbody = search.create({
                    type: search.Type.TRANSACTION,
                    columns: [columnas[position], 'internalid'],
                    filters: [{
                        name: 'internalid',
                        operator: 'anyof',
                        values: arrayInvoiceIds
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
                    }]
                });
                let result_custbody = search_custbody.run().getRange({
                    start: 0,
                    end: 1000
                });

                if (result_custbody != null && result_custbody.length > 0) {
                    for (let i = 0; i < result_custbody.length; i++) {
                        json_full[result_custbody[i].getValue('internalid')][0] = result_custbody[i].getValue(columnas[position]);
                    }
                }
            } else if (country == 'PER') {
                let search_custbody = search.create({
                    type: search.Type.TRANSACTION,
                    columns: [columnas[position], 'internalid'],
                    filters: [{
                        name: 'internalid',
                        operator: 'anyof',
                        values: arrayInvoiceIds
                    },
                    {
                        name: 'mainline',
                        operator: 'is',
                        values: 'T'
                    },
                    {
                        name: 'type',
                        operator: 'anyof',
                        values: ['CustInvc', 'CustCred', 'CashSale', 'ItemShip']
                    }]
                });
                let result_custbody = search_custbody.run().getRange({
                    start: 0,
                    end: 1000
                });

                if (result_custbody != null && result_custbody.length > 0) {
                    for (let i = 0; i < result_custbody.length; i++) {
                        json_full[result_custbody[i].getValue('internalid')][0] = result_custbody[i].getValue(columnas[position]);
                    }
                }
            } else {
                // RECORD COUNTRY
                let search_r_status = search.create({
                    type: 'customrecord_lmry_ei_docs_status',
                    columns: [{
                        name: 'internalid',
                        sort: search.Sort.DESC
                    }, 'custrecord_lmry_ei_ds_doc_status', 'custrecord_lmry_ei_ds_doc', 'lastmodified'],
                    filters: [{
                        name: 'custrecord_lmry_ei_ds_doc',
                        operator: 'anyof',
                        values: arrayInvoiceIds
                    }]
                });

                let result_r_status = search_r_status.run().getRange({
                    start: 0,
                    end: 1000
                });

                if (result_r_status != null && result_r_status.length > 0) {
                    for (let i = 0; i < result_r_status.length; i++) {
                        json_full[result_r_status[i].getValue('custrecord_lmry_ei_ds_doc')][0] = result_r_status[i].getValue('custrecord_lmry_ei_ds_doc_status');
                    }
                }
            }

            return json_full;
        }

        const getPosition = (country) =>{
            switch (country) {
                case 'ARG':
                    return 0;
                case 'BOL':
                    return 0;
                case 'BRA':
                    return 0;
                case 'CHI':
                    return 0;
                case 'COL':
                    return 0;
                case 'MEX':
                    return 1;
                case 'PER':
                    return 2;
                case 'PAN':
                    return 0;
                case 'COS':
                    return 0;
                case 'ECU':
                    return 0;
                case 'URU':
                    return 0;
                case 'GUA':
                    return 0;
                case 'DOM':
                    return 0;
                case 'PAR':
                    return 0;
                default:
                    return -1;
            }
        }

        return {onRequest}

    });
