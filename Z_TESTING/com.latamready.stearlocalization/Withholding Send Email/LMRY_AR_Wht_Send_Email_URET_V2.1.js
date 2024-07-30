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
        'N/url'
    ], (
        runtime, 
        serverWidget, 
        search, 
        url
    ) => {

    const beforeLoad = (scriptContext) => {
        try {
            let mainUIManager = new UIManager(scriptContext);
            if (mainUIManager.isUserInterface()) {
                mainUIManager.hiddenFields();
                mainUIManager.buildTable();
                mainUIManager.loadTable();
                mainUIManager.getButtomResponse();
            }
        } catch (error) {
            log.error('Error beforeLoad ', error)
        }

    };


    class UIManager {
        constructor(scriptContext) {
            let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
            language = language === "es" ? language : "en";
            this.translations = this.getTranslations(language);
            this.scriptContext = scriptContext;
            this.form = scriptContext.form;
            this.newRecord = scriptContext.newRecord;
        }

        buildTable() {

            this.form.clientScriptModulePath = './LMRY_AR_Wht_Send_Email_URET_V2.1.js';
            this.form.addButton({
                id: "custpage_btn_reload",
                label: this.translations.LMRY_REFRESH,
                functionName: "reload()"
            });
            this.tab = this.form.addTab({ id: 'custpage_tab_entities', label: this.translations.LMRY_PAYMENTS });
            this.form.insertTab({ tab: this.tab, nexttab: 'notes' });
            this.sublist = this.form.addSublist({
                id: 'custpage_custlist_payments',
                label: this.translations.LMRY_PAYMENTS,
                tab: 'custpage_tab_entities',
                type: serverWidget.SublistType.LIST
            });

            const fields = [
                { id: 'custpage_col_number', label: this.translations.LMRY_NUMBER, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_payment', label: this.translations.LMRY_BILLPAYMENT, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_certified', label: this.translations.LMRY_CERTIFICATE, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_sent_status', label: this.translations.LMRY_SENT_STATUS, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_status', label: this.translations.LMRY_STATUS, type: serverWidget.FieldType.TEXTAREA},
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
                const { internalid,status,message,code,type,certificate} = data[id];

                const setSublistValue = (colId, value) => sublist.setSublistValue({ id: colId, line: i, value });

                setSublistValue("custpage_col_number", i + 1);

                const paymentUrl = url.resolveRecord({ recordType:"vendorpayment", recordId: internalid, isEditMode: false });
                setSublistValue("custpage_col_payment", `<a class="dottedlink" href="${paymentUrl}" target="_blank">${tranid}</a>` );
                const certificatetUrl = url.resolveRecord({ recordType:"file", recordId: certificate, isEditMode: false });
                
                setSublistValue("custpage_col_certified", `<a class="dottedlink" href="${certificatetUrl}" target="_blank">${names}</a>`);
                setSublistValue("custpage_col_created_from", createdSetup);

                if (CCId) {
                    const ccUrl = url.resolveRecord({ recordType:"customrecord_lmry_ar_contrib_class", recordId: CCId, isEditMode: false });
                    setSublistValue("custpage_col_contributory_class", `<a class="dottedlink" href="${ccUrl}" target="_blank">${CCId}</a>`);
                }else {
                    setSublistValue("custpage_col_contributory_class", " ");
                }
                

                const jsonStatus = {
                    "s":this.translations.LMRY_PROCESING_CHECK,
                    "e":this.translations.LMRY_ERROR,
                    "p":this.translations.LMRY_PROCESING,
                    "n":this.translations.LMRY_NOT_PROCESING
                }

                const title = jsonStatus[status];
                let htmlStatus;
                /*
                if (status=="n") {

                    htmlStatus = title + " : " + message
                }else{
                    htmlStatus = title;
                }
                */
                const JsonMessage = this.translations[message];
                htmlStatus= `
                        <div style="display:flex; flex-direction: column; justify-content: center;">
                            <h3>${title}</h3>
                            ${status=="n" &&  JsonMessage ? `<span style="font-size: 0.9em; font-style: italic; margin: 5px 0">${JsonMessage}</span>`:""}
                        </div>
                        
                    `;
               
                setSublistValue("custpage_col_status", htmlStatus);
                
            });

            if (ids.length) {
                sublist.label = `${sublist.label} (${ids.length})`;
            }
        }


        getPayments() {

            const fieldPayments = this.scriptContext.newRecord.getValue('custrecord_lmry_ste_ar_wht_se_payments');
            if (!fieldPayments) return {};
            
            const payments = JSON.parse(fieldPayments);
            const processStatus = this.scriptContext.newRecord.getValue('custrecord_lmry_ar_gen_agip_status');
            const typeTransaction = "vendorpayment";
            /*
            let transactionIds = entitiesIds.map(ts => typeof ts === 'object' && ts !== null ? ts.id : ts);
            let state = transactionIds.length > 0 && typeof entitiesIds[0] !== 'object' ? "Procesando" : undefined;
            */
            let processCompleted = false;
            let paymentIds = payments;
            let listPayments = {};
            if (processStatus=="2") return {};

            if (payments.length) {
                processCompleted = typeof payments[0] === 'object';
                if (processCompleted) {
                    paymentIds = payments.map(payment => payment.billPaymentID);
                    //entities = entities.map(entity => entity[0])

                    for (let i = 0; i < paymentIds.length; i++) {
                        const {billPaymentID,message,code,certificate} = payments[i];
                        listPayments[id] = {
                            internalid:billPaymentID,
                            status: code ==="OK" ? this.translations.LMRY_SENT: this.translations.LMRY_NOT_SENT,
                            message: message ?? " ",
                            code,
                            type:typeTransaction,
                            certificate
                        };
                    }
                };
            } else {
                return {};
            }

            return listPayments;
        }

        hiddenFields() {

            const fieldsHideen = ['custrecord_lmry_ste_ar_wht_se_payments'];
            fieldsHideen.forEach(field => this.form.getField(field).updateDisplayType({ displayType: 'hidden' }));
        }

        getButtomResponse(){
            const responseField = this.form.addField({
                id: "custpage_response",
                type: serverWidget.FieldType.TEXTAREA,
                label: "File"
            });
            const urlFile = this.newRecord.getValue("custrecord_lmry_ar_gen_agip_url");
            if (urlFile) {
                const htmlUrlFile = `
                            <a href="${urlFile}" target="_blank" >
                                Response.csv
                            </a>
                            `;
                responseField.defaultValue = htmlUrlFile;
            }
            
            
        }


        isUserInterface() {
            return runtime.executionContext == 'USERINTERFACE';
        }

        getTranslations(lenguage) {
            const translatedFields = {
                "es": {
                    "LMRY_PAYMENTS": "Pagos",
                    "LMRY_NUMBER": "Posición",
                    "LMRY_CITY": "Ciudad",
                    "LMRY_INTERNALID": "ID Interno",
                    "LMRY_CC": "Clase contributiva",
                    "LMRY_BILLPAYMENT": "Pago",
                    "LMRY_STATUS": "Estado",
                    "LMRY_RESTART": "Reiniciar",
                    "LMRY_PROCESING": "Procesando",
                    "LMRY_ERROR": "Error",
                    "LMRY_NOT_PROCESING": "No procesada",
                    "LMRY_PROCESING_CHECK": "Procesada con éxito",
                    "LMRY_REFRESH": "Actualizar Pagina",
                    "LMRY_CREATED_FROM": "Creado desde",
                    "LMRY_NOT_PROCESING": "No procesada",
                    "LMRY_PROCESING_CHECK": "Procesada con éxito",
                    "LMRY_NOT_TAX_APPLY": "Entidad no registrada o con configuración incorrecta",
                    "LMRY_NOT_LIST": "No se ha encontrado ninguna lista para este periodo",
                    
                    "LMRY_CERTIFICATE": "Certificado",
                    "LMRY_SENT_STATUS": "Estado de envio",
                    "LMRY_SENT" : "Enviado",
                    "LMRY_NOT_SENT": "No enviado"
                },
                "en": {
                    "LMRY_PAYMENTS": "Bill Payments",
                    "LMRY_NUMBER": "Position",
                    "LMRY_CITY": "City",
                    "LMRY_INTERNALID": "Internal ID",
                    "LMRY_CC": "Contributory Class",
                    "LMRY_BILLPAYMENT": "Bill Payment",
                    "LMRY_STATUS": "Status",
                    "LMRY_RESTART": "Restart",
                    "LMRY_PROCESING": "Processing",
                    "LMRY_ERROR": "Error",
                    "LMRY_NOT_PROCESING": "Not Processed",
                    "LMRY_PROCESING_CHECK": "Successfully Processed",
                    "LMRY_REFRESH": "Refresh",
                    "LMRY_CREATED_FROM": "Created from",
                    "LMRY_NOT_TAX_APPLY": "Entity not registered or incorrectly configured",
                    "LMRY_NOT_LIST": "No list was found for this period",
                    
                    "LMRY_CERTIFICATE": "Certificate",
                    "LMRY_SENT_STATUS": "Mailing status",
                    "LMRY_SENT" : "Sent",
                    "LMRY_NOT_SENT": "Not Sent"
                }
            }
            return translatedFields[lenguage];
        }

        isValid(bool) {
            return (bool === "T" || bool === true);
        }

    }

    return { beforeLoad };
});