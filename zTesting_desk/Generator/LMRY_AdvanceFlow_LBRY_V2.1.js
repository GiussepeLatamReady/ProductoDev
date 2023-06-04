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
    'N/search',
    '../Send Email/LMRY_SendEmail_LBRY_V2.1.js'
], (nLog, nTranslation, nSearch, SendEmail_LBRY) => {

    const LMRY_SCRIPT = "LR Advance Flow LBRY V2.1";
    const LMRY_SCRIPT_NAME = "LMRY_AdvanceFlow_LBRY_V2.1.js";
    
    const getSearchTransactions = (features, parameters) => {

        try {
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
                    name: 'custbody_lmry_ste_fiscal_doctype',
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
                    'custbody_lmry_ste_fiscal_doctype',
                    'amountpaid',
                    'memo',
                    'total',
                    'memomain'],
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
            pagedData.pageRanges.forEach(pageRange => {
                page = pagedData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(result => {
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
                    transaction.documentTypeText = result.getText('custbody_lmry_ste_fiscal_doctype');
                    transaction.documentTypeValue = result.getValue('custbody_lmry_ste_fiscal_doctype');
                    transaction.amountpaid = result.getValue('amountpaid');
                    transaction.memo = result.getValue('memo');
                    transaction.total = result.getValue('total');
                    transaction.memomain = result.getValue('memomain');
                    internalIds.push(transaction.internalId);

                    transactionsResult.push(transaction);
                });
            });



            let jsonDocument = getJsonDocument(parameters);

            let transactionReturn = [];
            for (let i = 0; i < transactionsResult.length; i++) {
                let transaction = transactionsResult[i];

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
        } catch (error) {
            nLog.error({ title: `[${LMRY_SCRIPT} : getSearchTransactions]`, details: error });
            SendEmail_LBRY.sendErrorEmail(`[ getSearchTransactions ] : ${error}`, LMRY_SCRIPT);
        }


    }

    
    const getJsonDocument = (parameters) => {

        try {
            // BUSQUEDA TIPO DE DOCUMENTO

            let filtros_document = [],
                jsonDocument = {};
            filtros_document[0] = nSearch.createFilter({
                name: 'isinactive',
                operator: 'is',
                values: 'F'
            });
            filtros_document[1] = nSearch.createFilter({
                name: 'custrecord_lmry_ste_fdt_is_ei',
                operator: 'is',
                values: 'T'
            });
            filtros_document[2] = nSearch.createFilter({
                name: 'formulatext',
                formula: '{custrecord_lmry_ste_fdt_country}',
                operator: 'startswith',
                values: parameters.country
            });

            let searchDocument = nSearch.create({
                type: 'customrecord_lmry_ste_fiscal_docume_type',
                columns: ['internalid'],
                filters: filtros_document
            });

            searchDocument.run().each(function (result) {
                jsonDocument[result.getValue('internalid')] = result.getValue('internalid');
                return true;
            });

            return jsonDocument
        } catch (error) {
            nLog.error({ title: `[${LMRY_SCRIPT} : getJsonDocument]`, details: error });
            SendEmail_LBRY.sendErrorEmail(`[ getJsonDocument ] : ${error}`, LMRY_SCRIPT);
        }
        
    }

    const getAdvanceFlowRecord = () =>{
        let recordList = [];
        let searchRecord = nSearch.create({
            type: 'customrecord_lmry_ste_advance_flow_log',
            columns: [
                nSearch.createColumn({
                    name: 'internalid',
                    sort: nSearch.Sort.DESC
                }), 
                'custrecord_lmry_ste_af_log_user',
                'custrecord_lmry_ste_af_log_subsidiary',
                'custrecord_lmry_ste_af_log_country',
                'created',
                'custrecord_lmry_ste_af_log_status',
                'custrecord_lmry_ste_af_log_comments',
            ],
            filters: []
        });


        let pagedData = searchRecord.runPaged({
            pageSize: 1000
        });
        let page;
        pagedData.pageRanges.forEach( pageRange => {
            page = pagedData.fetch({
                index: pageRange.index
            });
            page.data.forEach( result => {
                let columns = result.columns;

                recordList.push({
                    id: result.getValue(columns[0]),
                    user: result.getValue(columns[1]) || '',
                    subsidiary: result.getValue(columns[2]) || '',
                    country: result.getValue(columns[3]) || '',
                    date: result.getValue(columns[4]),
                    status: result.getValue(columns[5]) || '',
                    comments: result.getValue(columns[6]) || '',
                });      
            });
        });

        return recordList;
    }

    const getTransactionsDetail = (transactionIds) =>{
        let transactions =[];
        var searchTransactions = nSearch.create({
            type: nSearch.Type.TRANSACTION,
            columns: [
                    'internalid', 
                    'type', 
                    'custbody_lmry_ste_fiscal_doctype' 
               ],
            filters: [{
                name: 'internalid',
                operator: 'anyof',
                values: transactionIds
            }, {
                name: 'mainline',
                operator: 'is',
                values: 'T'
            }]
        });

        let pagedData = searchTransactions.runPaged({
            pageSize: 1000
        });
        let page;
        pagedData.pageRanges.forEach( pageRange => {
            page = pagedData.fetch({
                index: pageRange.index
            });
            page.data.forEach( result => {
                let columns = result.columns;

                transactions.push({
                    id: result.getValue(columns[0]),
                    type: result.getValue(columns[1]) || '',
                    legalDocType: result.getValue(columns[2]) || ''
                });      
            });
        });


        return transactions;
    }
    const getFieldTranslations = () =>{

        try {
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
                afMsgSubsidiary: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_msg_subsidiary" })(),
                afMsgDateFrom: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_msg_date_from" })(),
                afMsgDateTo: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_msg_date_to" })(),
                afMsgDeploy: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_msg_deploy" })(),
                afMsgDeploySubsidiary: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_msg_deploy_subsidiary" })(),
                afMsgSelect: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_msg_select" })(),
                afMsgNothing: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_msg_nothing" })(),
                afMsgError: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_msg_error" })(),
                afMsgNoTransactions: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_msg_no_transactions" })(),
                afMsgThereAre: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_msg_there_are" })(),
                afMsgTransactions: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_msg_transactions" })(),
                afMsgTransaction: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_msg_transaction" })(),
                afStsProcessing: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_sts_processing" })(),
                afStsUnprocessed: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_sts_unprocessed" })(),
                afStsFinished: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_sts_finished" })(),
                afLogComments: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_log_comments" })(), 
                afLogIDocumentStatus: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_log_ie_document_status" })(),
                afLogIe: nTranslation.get({ collection: "custcollection_lmry_ste_advanceflow", key: "af_log_ie" })(),         
            }
        } catch (error) {
            nLog.error({ title: `[${LMRY_SCRIPT} : getFieldTranslations]`, details: error });
            SendEmail_LBRY.sendErrorEmail(`[ getFieldTranslations ] : ${error}`, LMRY_SCRIPT);
        }
        
       
    }

    return {
        getFieldTranslations,
        getSearchTransactions,
        getAdvanceFlowRecord
    }

});
