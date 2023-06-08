/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_AdvanceFlow_Log_STLT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 05/09/2023
 */
define(['N/log',
        'N/ui/serverWidget',
        'N/url',
        'N/runtime',
        'N/search',
        './LMRY_AdvanceFlow_LBRY_V2.1',
        '../Tax Result Engine/LMRY_TaxResultEngine_LBRY_V2.1',
        '../Send Email/LMRY_SendEmail_LBRY_V2.1'],

    (nLog,nServerWidget,nUrl,nRuntime,nSearch,AF_Library,TRE_Library, SendEmail_LBRY) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const LMRY_SCRIPT = "LR Advance Flow Log STLT V2.1";
        const LMRY_SCRIPT_NAME = "LMRY_AdvanceFlow_Log_STLT_V2.1.js";
        const transactionTypeList = {
            SalesOrd: { name: "Sales Order", id: "salesorder" },
            CustInvc: { name: "Invoice", id: "invoice" },
            CustCred: { name: "Credit Memo", id: "creditmemo" },
            CustPymt: { name: "Customer Payment", id: "customerpayment" },
            CashSale: { name: "Cash Sales", id: "cashsale" },
            PurchOrd: { name: "Purchase Order", id: "purchaseorder" },
            VendBill: { name: "Bill", id: "vendorbill" },
            VendCred: { name: "Bill Credit", id: "vendorcredit" },
            VendPymt: { name: "Vendor Payment", id: "vendorpayment" },
            ItemShip: { name: "Item Fulfillment", id: "itemfulfillment" },
            ItemRcpt: { name: "Item Receipt", id: "itemreceipt" },
        };

        const onRequest = (scriptContext) => {
            const translatedFieldsTRE = TRE_Library.getFieldTranslations();
            const translatedFieldsAF = AF_Library.getFieldTranslations();
            if (scriptContext.request.method === "GET") {
                try {
                    const paramIsDetails = scriptContext.request.parameters.isDetails || "F";
                    const paramLogId = scriptContext.request.parameters.logId;

                    const form = nServerWidget.createForm({
                        title: `${translatedFieldsAF.afTitle} Log`
                    });
                    if (!paramIsDetails || paramIsDetails === "F") {

                        /**
                         * Message
                         * @type {Field}
                         */
                        const inlineHtmlField = form.addField({
                            id: "custpage_lmry_ste_inline_html",
                            label: translatedFieldsTRE.treFldInlineHtml,
                            type: nServerWidget.FieldType.INLINEHTML
                        });

                        inlineHtmlField.defaultValue = `
                        <html>
                            <table border="0" class="table_fields" cellspacing="0" cellpadding="0">
                                <tr></tr>
                                <tr>
                                    <td class="text">
                                        <div style="color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver">
                                            ${translatedFieldsTRE.treMsg1}
                                            ${translatedFieldsTRE.treMsg2}<br><br>
                                            ${translatedFieldsTRE.treMsg3}<br><br>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </html>
                        `;
                        inlineHtmlField.updateBreakType({ breakType: nServerWidget.FieldBreakType.STARTCOL });

                        const resultList = form.addSublist({
                            id: "custlist_lmry_ste_results",
                            label: translatedFieldsTRE.treLstResult,
                            type: nServerWidget.SublistType.STATICLIST
                        });
                        resultList.addRefreshButton();
                        resultList.addField({ id: "listcol_lmry_ste_order", type: nServerWidget.FieldType.INTEGER, label: translatedFieldsTRE.treLstColOrder });
                        resultList.addField({ id: "listcol_lmry_ste_log_id", type: nServerWidget.FieldType.TEXT, label: translatedFieldsTRE.treLstColId });
                        resultList.addField({ id: "listcol_lmry_ste_user", type: nServerWidget.FieldType.TEXT, label: translatedFieldsTRE.treLstColUser });
                        resultList.addField({ id: "listcol_lmry_ste_subsidiary", type: nServerWidget.FieldType.TEXT, label: translatedFieldsTRE.treLstColSubsidiary });
                        resultList.addField({ id: "listcol_lmry_ste_country", type: nServerWidget.FieldType.TEXT, label: translatedFieldsAF.afCountry });
                        resultList.addField({ id: "listcol_lmry_ste_process_date", type: nServerWidget.FieldType.TEXT, label: translatedFieldsTRE.treLstColProcessDate });
                        resultList.addField({ id: "listcol_lmry_ste_status", type: nServerWidget.FieldType.TEXT, label: translatedFieldsTRE.treLstColStatus});
                        resultList.addField({ id: "listcol_lmry_ste_n_trans", type: nServerWidget.FieldType.TEXTAREA, label:`# ${translatedFieldsAF.afTransactions}` });
                        resultList.addField({ id: "listcol_lmry_ste_comments", type: nServerWidget.FieldType.TEXTAREA, label: translatedFieldsAF.afLogComments });
                        resultList.addField({ id: "listcol_lmry_ste_details", type: nServerWidget.FieldType.TEXT, label: translatedFieldsTRE.treLstColDetails });

                        const advanceFlowList = AF_Library.getAdvanceFlowRecord();
                        let order = advanceFlowList.length;

                        advanceFlowList.forEach((record,cont) => {
                            resultList.setSublistValue({ id: "listcol_lmry_ste_order", value: order, line: cont });
                            const afLogUrl = nUrl.resolveRecord({
                                recordType: "customrecord_lmry_ste_advance_flow_log",
                                recordId: record.id
                            });
                            resultList.setSublistValue({
                                id: "listcol_lmry_ste_log_id",
                                value: `<a href="${afLogUrl}" target="_blank" style="color:blue;">${record.id}</a>`,
                                line: cont
                            });
                            if (record.user && record.user !== "" && record.user !== null) {
                                resultList.setSublistValue({ id: "listcol_lmry_ste_user", value: record.user, line: cont });
                            }
                            resultList.setSublistValue({ id: "listcol_lmry_ste_subsidiary", value: record.subsidiary, line: cont });
                            resultList.setSublistValue({ id: "listcol_lmry_ste_country", value: record.country, line: cont });
                            resultList.setSublistValue({ id: "listcol_lmry_ste_process_date", value: record.date, line: cont });
                            resultList.setSublistValue({ id: "listcol_lmry_ste_status", value: record.status, line: cont });
                            resultList.setSublistValue({ id: "listcol_lmry_ste_n_trans", value: record.numberTrans, line: cont });
                            const afLogStltUrl = nUrl.resolveScript({
                                scriptId: nRuntime.getCurrentScript().id,
                                deploymentId: nRuntime.getCurrentScript().deploymentId,
                                params: {
                                    isDetails: "T",
                                    logId: record.id
                                }
                            });
                            resultList.setSublistValue({ id: "listcol_lmry_ste_comments", value: record.comments, line: cont });
                            resultList.setSublistValue({
                                id: "listcol_lmry_ste_details",
                                value: `<a href="${afLogStltUrl}" style="color:blue;">${translatedFieldsTRE.treLstColDetails}</a>`,
                                line: cont
                            });
                            order--;
                        });

                        form.addButton({
                            id: "custbutton_lmry_ste_back",
                            label: translatedFieldsTRE.treBtnBack,
                            functionName: `redirectBack("${paramIsDetails}")`
                        });

                    }else {
                        if (paramLogId && paramLogId !== "" && paramLogId !== null) {
                            const treLogSearch = nSearch.lookupFields({
                                type: "customrecord_lmry_ste_advance_flow_log",
                                id: paramLogId,
                                columns: [ "custrecord_lmry_ste_af_log_trans_ids" ,"custrecord_lmry_ste_af_log_datefrom","custrecord_lmry_ste_af_log_dateto","custrecord_lmry_ste_af_log_summary"]
                            });

                            const afLogIds = JSON.parse(treLogSearch["custrecord_lmry_ste_af_log_trans_ids"]);
                            const dateFrom = treLogSearch["custrecord_lmry_ste_af_log_datefrom"];
                            const dateTo = treLogSearch["custrecord_lmry_ste_af_log_dateto"];
                            const summary = treLogSearch["custrecord_lmry_ste_af_log_summary"];
                            const detailsList = form.addSublist({
                                id: "custlist_lmry_ste_details",
                                label: translatedFieldsTRE.treLstColDetails,
                                type: nServerWidget.SublistType.LIST
                            });

                            detailsList.addRefreshButton();
                            detailsList.addField({ id: "listcol_lmry_ste_order", type: nServerWidget.FieldType.INTEGER, label: translatedFieldsTRE.treLstColOrder });
                            detailsList.addField({ id: "listcol_lmry_ste_trans_id", type: nServerWidget.FieldType.TEXT, label: `${translatedFieldsAF.afTransaction} ID` });
                            detailsList.addField({ id: "listcol_lmry_ste_date_from", type: nServerWidget.FieldType.DATE,  label: translatedFieldsAF.afDateFrom });
                            detailsList.addField({ id: "listcol_lmry_ste_date_to", type: nServerWidget.FieldType.DATE, label: translatedFieldsAF.afDateTo });
                            detailsList.addField({ id: "listcol_lmry_ste_ei_doc_sts", type: nServerWidget.FieldType.TEXT, label: `Latam - ${translatedFieldsAF.afLogIDocumentStatus}` });
                            detailsList.addField({ id: "listcol_lmry_ste_doc_type", type: nServerWidget.FieldType.TEXT, label: translatedFieldsAF.afDocumentType });
                            detailsList.addField({ id: "listcol_lmry_ste_ei", type: nServerWidget.FieldType.TEXT, label: `${translatedFieldsAF.afLogIe}?` });
                            detailsList.addField({ id: "listcol_lmry_ste_state", type: nServerWidget.FieldType.TEXT, label: translatedFieldsAF.afState });

                            const transactionDetails = AF_Library.getTransactionsDetail(afLogIds);
                            const states = AF_Library.getJsonState(summary,afLogIds);
                            transactionDetails.forEach((transaction,index) => {
                                detailsList.setSublistValue({ id: "listcol_lmry_ste_order", value: (index + 1), line: index });
                                const transactionUrl = nUrl.resolveRecord({
                                    recordType: transactionTypeList[transaction.type].id,
                                    recordId: transaction.id
                                });
                                detailsList.setSublistValue({
                                    id: "listcol_lmry_ste_trans_id",
                                    value: `<a href="${transactionUrl}" target="_blank" style="color:blue;">${transaction.id}</a>`,
                                    line: index
                                });
                                detailsList.setSublistValue({ id: "listcol_lmry_ste_date_from", value: dateFrom, line: index });
                                detailsList.setSublistValue({ id: "listcol_lmry_ste_date_to", value: dateTo, line: index });
                                detailsList.setSublistValue({ id: "listcol_lmry_ste_ei_doc_sts", value: ' ', line: index });
                                detailsList.setSublistValue({ id: "listcol_lmry_ste_doc_type", value: transaction.legalDocType, line: index });
                                detailsList.setSublistValue({ id: "listcol_lmry_ste_ei", value: ' ', line: index });
                                const transactionState = states[transaction.id] || ' ';
                                detailsList.setSublistValue({ id: "listcol_lmry_ste_state", value: transactionState, line: index });
                            });
                            form.addButton({
                                id: "custbutton_lmry_ste_back",
                                label: translatedFieldsTRE.treBtnBack,
                                functionName: `redirectBack("${paramIsDetails}")`
                            });
                        }

                    }

                    
                    form.clientScriptModulePath = "./LMRY_AdvanceFlow_CLNT_V2.1.js";
                    scriptContext.response.writePage({ pageObject: form });
                } catch (error) {
                    nLog.error({ title: `[ ${LMRY_SCRIPT} : onRequest ]`, details: error });
                    SendEmail_LBRY.sendErrorEmail(`[ onRequest ] : ${error}`, LMRY_SCRIPT);
                }
            }
        }

        return {onRequest}

    });
