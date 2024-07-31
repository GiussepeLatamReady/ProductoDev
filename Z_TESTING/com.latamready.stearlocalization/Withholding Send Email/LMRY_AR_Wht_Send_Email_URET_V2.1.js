/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @Name LMRY_AR_Wht_Send_Email_URET_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/07/2024
 */

define(
    [
        'N/runtime', 
        'N/ui/serverWidget', 
        'N/search', 
        'N/url',
        "./Constants/LMRY_AR_Wht_Send_Email_CONST",
        "../Helper/LMRY_AR_Search_Library_HELPER"
    ], (
        runtime, 
        serverWidget, 
        search, 
        url,
        Constants_LBRY,
        Search_HELPER
    ) => {

    const beforeLoad = (scriptContext) => {
        try {
            let mainUIManager = new UIManager(scriptContext);
            if (mainUIManager.isUserInterface()) {
                mainUIManager.hiddenFields();
                mainUIManager.buildTable();
                mainUIManager.loadTable();
            }
        } catch (error) {
            log.error('Error beforeLoad ', error)
        }

    };


    class UIManager {
        constructor(scriptContext) {
            const { REGISTRY_COLLECTION, REGISTRY_TRANSLATION_KEYS } = Constants_LBRY;
            this.translations = Search_HELPER.getTranslations( REGISTRY_TRANSLATION_KEYS, REGISTRY_COLLECTION );
            this.scriptContext = scriptContext;
            this.form = scriptContext.form;
            this.newRecord = scriptContext.newRecord;
            this.recordStatus = this.getRecordStatus();
        }

        buildTable() {

            this.form.clientScriptModulePath = './LMRY_AR_Wht_Send_Email_CLNT_V2.1.js';
            this.form.addButton({
                id: "custpage_btn_reload",
                label: this.translations.AR_REFRESH(),
                functionName: "reload()"
            });
            this.tab = this.form.addTab({ id: 'custpage_tab_entities', label: this.translations.AR_PAYMENTS() });
            this.form.insertTab({ tab: this.tab, nexttab: 'notes' });
            this.sublist = this.form.addSublist({
                id: 'custpage_custlist_payments',
                label: this.translations.AR_PAYMENTS(),
                tab: 'custpage_tab_entities',
                type: serverWidget.SublistType.LIST
            });

            const fields = [
                { id: 'custpage_col_number', label: this.translations.AR_NUMBER(), type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_payment', label: this.translations.AR_BILLPAYMENT(), type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_certified', label: this.translations.AR_CERTIFICATE(), type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_sent_status', label: this.translations.AR_SENT_STATUS(), type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_status', label: this.translations.AR_STATUS(), type: serverWidget.FieldType.TEXTAREA},
            ];
            fields.forEach(fieldInfo => {
                this.sublist.addField(fieldInfo);
            });

        }

        loadTable() {
            const data = this.getPayments();
            const sublist = this.form.getSublist({ id: "custpage_custlist_payments" });
            const ids = Object.keys(data);
            ids.forEach((id, i) => {
                const {status,message,code,certificate,tranid} = data[id];

                const setSublistValue = (colId, value) => sublist.setSublistValue({ id: colId, line: i, value });

                setSublistValue("custpage_col_number", i + 1);

                const paymentUrl = url.resolveRecord({ recordType:"vendorpayment", recordId: id, isEditMode: false });
                setSublistValue("custpage_col_payment", `<a class="dottedlink" href="${paymentUrl}" target="_blank">${tranid}</a>` );
                if (code ==="OK") {
                    setSublistValue("custpage_col_certified", `<a class="dottedlink" href="${certificate}" target="_blank">${"Certificate.pdf"}</a>`);
                }
                
                setSublistValue("custpage_col_sent_status", status);

                let htmlStatus;
                if (code != "PROCESSING") {
                    htmlStatus= `
                        <div style="display:flex; flex-direction: column; justify-content: center;">
                            <h3>${code}</h3>
                            ${`<span style="font-size: 0.9em; font-style: italic; margin: 5px 0">${message}</span>`}
                        </div>
                    `;
                    setSublistValue("custpage_col_status", htmlStatus);
                }
                
                
                
            });

            if (ids.length) {
                sublist.label = `${sublist.label} (${ids.length})`;
            }
        }


        getPayments() {

            const fieldPayments = this.scriptContext.newRecord.getValue('custrecord_lmry_ste_ar_wht_se_payments');
            if (!fieldPayments) return {};
            
            const payments = JSON.parse(fieldPayments);
            const processStatus = this.scriptContext.newRecord.getValue('custrecord_lmry_ste_ar_wht_se_status');
        
            let processCompleted = false;
            let paymentIds = payments;
            let listPayments = {};
            let codeStatus = this.recordStatus[processStatus].code;
            if (codeStatus=="PREPARING") return {};
            if (payments.length) {
                processCompleted = typeof payments[0] === 'object';
                if (processCompleted && codeStatus == "DONE") {
                    paymentIds = payments.map(payment => payment.billPaymentID);
                    for (let i = 0; i < paymentIds.length; i++) {
                        const {billPaymentID:id,message,code,certificate} = payments[i];
                        listPayments[id] = {
                            status: code === "OK" ? this.translations.AR_SENT(): this.translations.AR_NOT_SENT(),
                            message: message ?? " ",
                            code,
                            certificate
                        };
                    }
                    this.setPaymentsDetails(paymentIds,listPayments);
                };

                if (codeStatus == "PROCESSING") {
                    
                    for (let i = 0; i < payments.length; i++) {
                        const id = payments[i];
                        listPayments[id] = {
                            code: codeStatus,
                            status: this.translations.AR_PROCESING()
                        };
                    }
                    this.setPaymentsDetails(payments,listPayments)
                }
            } else {
                return {};
            }

            return listPayments;
        }

        hiddenFields() {

            const fieldsHideen = ['custrecord_lmry_ste_ar_wht_se_payments'];
            fieldsHideen.forEach(field => this.form.getField(field).updateDisplayType({ displayType: 'hidden' }));
        }

        getRecordStatus() {
            let status = {}
            const newSearchStatus = search.create({
                type: "customrecord_lmry_ste_process_status",
                filters: [],
                columns: [
                    "name",
                    "custrecord_lmry_ste_procstatus_code"
                ]
            });
    
            newSearchStatus.run().each(result => {
                const columns = result.columns;
                status[result.id] = {
                    code: result.getValue(columns[1]),
                    name: result.getValue(columns[0])
                }
                return true;
            });
    
            return status;
        }



        isUserInterface() {
            return runtime.executionContext == 'USERINTERFACE';
        }

        isValid(bool) {
            return (bool === "T" || bool === true);
        }


        setPaymentsDetails(paymentIds,listPayments){
            log.error("listPayments",listPayments)
            let filters = [
                ["internalid", "anyof", paymentIds]
            ];
            let columns = [];
            columns.push(search.createColumn({ name: 'formulatext', formula: '{internalid}', sort: search.Sort.DESC }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{tranid}' }));
            search.create({
                type: "vendorpayment",
                filters: filters,
                columns: columns
            }).run().each(result => {
                let columns = result.columns;
                const internalid = result.getValue(columns[0]);
                if (listPayments[internalid]) {
                    listPayments[internalid].tranid = result.getValue(columns[1]) || " - ";
                }
                return true;
            });
        }

    }

    return { beforeLoad };
});