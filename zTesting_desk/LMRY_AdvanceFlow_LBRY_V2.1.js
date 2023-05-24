/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_AdvanceFlow_LBRY_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 05/21/2023
 */
define([
    'N/log',
    'N/translation',
    'N/search'
], (nLog, nTranslation, nSearch) => {

    const LMRY_SCRIPT = "LR Advance Flow LBRY V2.1";
    const LMRY_SCRIPT_NAME = "LMRY_AdvanceFlow_LBRY_V2.1.js";
    
    const getSearchTransactions = (features,parameters) => {
        let transactionType = 'transaction';

        if (parameters.transaction != null && parameters.transaction != '' && parameters.transaction != '0') {
            transactionType = parameters.transaction.split(';')[0];
        }

        // BUSQUEDA INVOICE

        let filtros_invoice = [];
        filtros_invoice[0] = nSearch.createFilter({
            name: 'mainline',
            operator: 'is',
            values: 'T'
        });
        filtros_invoice[1] = nSearch.createFilter({
            name: 'trandate',
            operator: 'onorbefore',
            values: parameters.dateTo
        });
        filtros_invoice[2] = nSearch.createFilter({
            name: 'trandate',
            operator: 'onorafter',
            values: parameters.dateFrom
        }); 
        
        let i = 3;
        if (features.subsidiary) {
            filtros_invoice[i] = nSearch.createFilter({
                name: 'subsidiary',
                operator: 'is',
                values: parameters.subsidiary
            });
            i++;
        }
        if (transactionType == 'transaction') {
            if (parameters.country == 'BRA') {
                filtros_invoice[i] = nSearch.createFilter({
                    name: 'type',
                    operator: 'anyof',
                    values: ['ItemShip', 'CustInvc', 'VendBill', 'ItemRcpt', 'CustCred', 'VendCred']
                });
                i++;
            }
        }

        if (!features.advanced) {
            filtros_invoice[i] = nSearch.createFilter({
                name: 'custbody_lmry_document_type',
                operator: 'anyof',
                values: ['@NONE@']
            });
            i++;
        }


        let searchTransactions = nSearch.create({
            type: transactionType,
            filters: filtros_invoice,
            columns: [nSearch.createColumn({
                name: 'type',
                sort: nSearch.Sort.ASC
            }),
            nSearch.createColumn({
                name: 'trandate',
                sort: nSearch.Sort.ASC
            }),
            nSearch.createColumn({
                name: 'tranid',
                sort: nSearch.Sort.ASC
            }),
                'entity',
                'internalid',
                'status',
                'fxamount',
                'externalid',
                'custbody_lmry_document_type',
                'amountpaid',
                'memo',
                'total',
                'memomain',
                'custbody_lmry_processed_transaction'],
            settings: []
        });

        if (features.subsidiary) {
            searchTransactions.settings.push(nSearch.createSetting({ name: 'consolidationtype', value: 'NONE' }));
        }

        let transactionsResult = [];
        let internalIds = [];
        let pagedData = searchTransactions.runPaged({
            pageSize: 1000
        });
        let page;
        pagedData.pageRanges.forEach( pageRange => {
            page = pagedData.fetch({
                index: pageRange.index
            });
            page.data.forEach( result => {
                let transaction = {};

                transaction.internalId = result.getValue('internalid');
                transaction.typeText = result.getText('type');               
                transaction.type = result.getValue('type').toLowerCase();
                transaction.entityText = result.getText('entity');
                transaction.entityValue = result.getValue('entity');
                transaction.trandate = result.getValue('trandate');
                transaction.tranid = result.getValue('tranid');
                transaction.status = result.getValue('status').toLowerCase();
                transaction.fxamount = result.getValue('fxamount');
                transaction.externalid = result.getValue('externalid');
                transaction.documentTypeText = result.getText('custbody_lmry_document_type');
                transaction.documentTypeValue = result.getValue('custbody_lmry_document_type');
                transaction.amountpaid = result.getValue('amountpaid');
                transaction.memo = result.getValue('memo');
                transaction.total = result.getValue('total');
                transaction.memomain = result.getValue('memomain');
                transaction.processTransaction = result.getValue('custbody_lmry_processed_transaction');

                internalIds.push(transaction.internalId);

                transactionsResult.push(transaction);
            });
        });


        let jsonDocumentStatus = getJsonStatus(parameters.country, internalIds);
        let jsonDocument = getJsonDocument(parameters);
        let jsonPackage = getJsonPackague(features, parameters);
        let statusCountries = ['Aprobado', 'Observado', 'EMITIDO', 'APROBADO POR SII', 'APROBADO', 'AUTORIZADO', 'Procesando', 'PROCESANDO', 'Autorizado', 'Generado', 'ACEPTADO', 'Cancelada', 'Cancelado', 'Denegada', 'Cancelando', 'No Cancelado', 'No Cancelada', 'EMILOCAL', 'Caida por Intermitencia'];

        let transactionReturn = [];
        for (let i = 0; i < transactionsResult.length; i++) {
            let transaction = transactionsResult[i];

            if (statusCountries.indexOf(jsonDocumentStatus[transaction.internalId]) != -1) {
                continue;
            }

            // VALIDACIONES CUANDO ES INVOICE
            if (transaction.type == 'custinvc') {
                if (transaction.status != 'open' && transaction.status != 'paidinfull') {
                    continue;
                }

                if (transaction.status == 'paidinfull' && parameters.checkpaid == 'F') {
                    continue;
                }

                if (parameters.country == 'BRA') {
                    // Si tiene pago parcial, sigue siendo open
                    if (transaction.amountpaid > 0 && transaction.amountpaid < transaction.total && features.WthBR == false) {
                        continue;
                    }
                }
                 
            }

            // VIP
            if (features.advanced) {
                if (transaction.documentTypeText != null && transaction.documentTypeText != '') {
                    // SI EL DOC NO ES DE FACTURACION
                    if (jsonDocument[transaction.documentTypeValue] == undefined || jsonDocument[transaction.documentTypeValue] == null) {
                        continue;
                    }

                    // SI EL DOCUMENTO NO TIENE EI-PACKAGE, NO LO MUESTRA
                    if (parameters.country != 'BRA') {
                        if (jsonPackage[transaction.documentTypeValue] == null || jsonPackage[transaction.documentTypeValue] == undefined) {
                            continue;
                        }
                    } else if (jsonPackage[transaction.documentTypeValue + ';' + transaction.type] == null || jsonPackage[transaction.documentTypeValue + ';' + transaction.type] == undefined) {
                        continue;
                    }
                }
            }

            if (transaction.documentTypeText == null || transaction.documentTypeText == '') {
                transaction.documentTypeText = ' ';
            }

            if (transaction.memo == null || transaction.memo == '') {
                transaction.memo = ' ';
            } else {
                transaction.memo = transaction.memo.substring(0, 50) + '...';
            }

            if (!transaction.entityText) {
                transaction.entityText = ' ';
            }

            if (transaction.tranid == null || transaction.tranid == '') {
                transaction.tranid = ' ';
            }

            if (transaction.type == 'itemship' || transaction.type == 'itemrcpt') {
                
                transaction.fxamount = ' '
            }

            transactionReturn.push(transaction);
        }

        return transactionReturn;
     
    }

    
    const getJsonDocument = (parameters) => {
        // BUSQUEDA TIPO DE DOCUMENTO

        let filtros_document = [],
            jsonDocument = {};
        filtros_document[0] = nSearch.createFilter({
            name: 'isinactive',
            operator: 'is',
            values: 'F'
        });
        filtros_document[1] = nSearch.createFilter({
            name: 'custrecord_lmry_fact_electronica',
            operator: 'is',
            values: 'T'
        });
        filtros_document[2] = nSearch.createFilter({
            name: 'formulatext',
            formula: '{custrecord_lmry_country_applied}',
            operator: 'startswith',
            values: parameters.country
        });

        let searchDocument = nSearch.create({
            type: 'customrecord_lmry_tipo_doc',
            columns: ['internalid'],
            filters: filtros_document
        });
        
        searchDocument.run().each(function (result) {
            jsonDocument[result.getValue('internalid')] = result.getValue('internalid');
            return true;
        });

        return jsonDocument
    }

    const getJsonStatus = (country, arrayInvoiceIds) => {
        // STATUS, STATUS-COUNTRY, HORA-COUNTRY, STATUS-GLOBAL, HORA-GLOBAL
        let jsonStatus = {};

        if (country == 'BRA') {//Se tiene que agregar la busqueda correspondiente a cada pais
            // RECORD COUNTRY
            let searchStatus = nSearch.create({
                type: 'customrecord_lmry_ei_docs_status',
                columns: [{
                    name: 'internalid',
                    sort: nSearch.Sort.DESC
                }, 'custrecord_lmry_ei_ds_doc_status', 'custrecord_lmry_ei_ds_doc', 'lastmodified'],
                filters: [{
                    name: 'custrecord_lmry_ei_ds_doc',
                    operator: 'anyof',
                    values: arrayInvoiceIds
                }]
            });

            let pagedData = searchStatus.runPaged({
                pageSize: 1000
            });

            let page;
            pagedData.pageRanges.forEach( pageRange => {
                page = pagedData.fetch({
                    index: pageRange.index
                });
                page.data.forEach( result => {
                    jsonStatus[result.getValue('custrecord_lmry_ei_ds_doc')] = result.getValue('custrecord_lmry_ei_ds_doc_status');
                });
            })
        }

        return jsonStatus;
    }

    const getJsonPackague = (features, parameters) => {
        let jsonPackage = {};
        if (features.advanced) {
            let filtrosPackage = [];

            filtrosPackage[0] = nSearch.createFilter({
                name: 'isinactive',
                operator: 'is',
                values: 'F'
            });
            filtrosPackage[1] = nSearch.createFilter({
                name: 'custrecord_lmry_ei_pckg_sm',
                operator: 'noneof',
                values: '@NONE@'
            });
            filtrosPackage[2] = nSearch.createFilter({
                name: 'custrecord_lmry_ei_pckg_template',
                operator: 'noneof',
                values: '@NONE@'
            });
            filtrosPackage[3] = nSearch.createFilter({
                name: 'custrecord_lmry_ei_pckg_doc_type',
                operator: 'isnotempty',
                values: ''
            });
            if (features.subsidiary) {
                filtrosPackage[4] = nSearch.createFilter({
                    name: 'custrecord_lmry_ei_pckg_subsi',
                    operator: 'anyof',
                    values: parameters.subsidiary
                });
            }

            let searchPackage = nSearch.create({
                type: 'customrecord_lmry_ei_pckg',
                filters: filtrosPackage,
                columns: ['custrecord_lmry_ei_pckg_doc_type', 'custrecord_lmry_ei_pckg_trans_type']
            });
            
            
            searchPackage.run().each(function (result) {
                let documento = result.getValue('custrecord_lmry_ei_pckg_doc_type');
                let transaccion = result.getValue('custrecord_lmry_ei_pckg_trans_type');
                if (parameters.country == 'BRA' && transaccion) {
                    if (transaccion == '7') {
                        transaccion = 'custinvc';
                    } else if (transaccion == '32') {
                        transaccion = 'itemship';
                    } else if (transaccion == '17') {
                        transaccion = 'vendbill';
                    } else if (transaccion == '16') {
                        transaccion = 'itemrcpt';
                    } else if (transaccion == '20') {
                        transaccion = 'vendcred';
                    } else if (transaccion == '10') {
                        transaccion = 'custcred';
                    }
                    jsonPackage[documento + ';' + transaccion] = documento;
                } else {
                    jsonPackage[documento] = documento;
                }
                return true;
            });
            
        }

        return jsonPackage;
    }

    const getFieldTranslations = () =>{
        return {
            afTitle: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_title" })(),
            afGrpPrimary: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_grp_primary" })(),
            afSubSidiary: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_subsidiary" })(),
            afCountry: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_country" })(),
            afTransaction: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_transaction" })(),
            afGrpDateRanges: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_grp_date_ranges" })(),
            afDateFrom: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_date_from" })(),
            afDateTo: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_date_to" })(),
            afGrpTransactionCount: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_grp_transaction_count" })(),
            afNumberTransactions: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_number_transactions" })(),
            afNumberSelectedTransactions: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_number_selected_transactions" })(),
            afSelectTransactions: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_select_transactions" })(),
            afTransactionsToSelect: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_transactions_to_select" })(),
            afTransactions: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_transactions" })(),
            afTransactionType: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_transaction_type" })(),
            afAuthentication: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_authentication" })(),
            afInvoices: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_invoices" })(),
            afApply: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_apply" })(),
            afInternalId: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_internal_id" })(),
            afTranId: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_tran_id" })(),
            afDate: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_date" })(),
            afEntity: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_entity" })(),
            afDocumentType: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_document_type" })(),
            afMemo: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_memo" })(),
            afAmount: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_amount" })(),
            afState: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_state" })(),
            afMarkAll: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_mark_all" })(),
            afDesMarkAll: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_des_mark_all" })(),
            afBack: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_back" })(),
            afSave: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_save" })(),
            afFilter: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_filter" })(),
            afReset: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_reset" })(),
            afImportant: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_important" })(),
            afCode: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_code" })(),
            afDetails: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_details" })(),
            afCheckPaid: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_check_paid" })(),
        }
    }

    return {
        getFieldTranslations,
        getSearchTransactions
    }

});
