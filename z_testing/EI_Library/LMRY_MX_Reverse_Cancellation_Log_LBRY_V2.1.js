/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_MX_Reverse_Cancellation_Log_LBRY_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */
define(["N/log","N/search", "N/runtime", "N/redirect", "N/ui/serverWidget","N/url"],
    function (log,search, runtime, redirect, serverWidget,url) {

        const LMRY_script = 'LMRY - MX Canceled Documents Reversed Log LBRY';
        
        class LibraryHandler {
            constructor(options) {
                this.params = options.params || {};
                this.method = options.method;

                this.FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });

                this.deploy = runtime.getCurrentScript().deploymentId;

                this.translations = this.getTranslations();

            }

            createLogForm() {
            
                if (this.params.isDetails == 'T') {
                    this.form = serverWidget.createForm({
                        title: this.translations.LMRY_DETAILS_FORM_TITLE 
                    });
                    return this.form;
                } else {
                    this.form = serverWidget.createForm({
                        title: this.translations.LMRY_LOG_FORM_TITLE 
                    });
                }
                
                let form = this.form;

                let myInlineHtml = form.addField({ 
                    id: 'custpage_id_message', 
                    label: this.translations.LMRY_MESSAGE, // Se traduce como "Mensaje"
                    type: serverWidget.FieldType.INLINEHTML 
                });
                
                myInlineHtml.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });
                
                let strhtml = "<html>";
                strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>";
                strhtml += "<tr>";
                strhtml += "</tr>";
                strhtml += "<tr>";
                strhtml += "<td class='text'>";
                strhtml += "<div style=\"color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">";
                strhtml += this.translations.LMRY_NOTE + ": " + this.translations.LMRY_PROCESS_NOTE; // Se traduce como "Nota" y "Nota: Se está generando el pago y la creación de asientos diarios. La columna [ESTADO] indica el estado del proceso."
                strhtml += "<br/><br/>";
                strhtml += this.translations.LMRY_REFRESH_BUTTON_NOTE; // Se traduce como "Presione el botón Actualizar o Refresh para ver si el proceso terminó."
                strhtml += "</td>";
                strhtml += "</tr>";
                strhtml += "</table>";
                strhtml += "</html>";
                
                myInlineHtml.defaultValue = strhtml;
                
                form.addSubmitButton({
                    label: this.translations.LMRY_RETURN_TO_HOME_PAGE // Se traduce como "Volver a la Página Principal"
                });

                return form;
            }

            createSublist() {

                if (this.params.isDetails == 'T') {
                    return this.createSublistDetails();                    
                }else{
                    return this.createSublistLog();
                }
                
            }

            createSublistDetails(){
                this.sublist = this.form.addSublist({
                    id: "custpage_results_list_details",
                    label: this.translations.LMRY_RESULTS,
                    type: serverWidget.SublistType.LIST
                });
            
                let sublist = this.sublist;
            
                sublist.addField({
                    id: "tranid",
                    label: this.translations.LMRY_PRINCIPAL_TRANSACTION,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addField({
                    id: "id_void",
                    label: this.translations.LMRY_VOID_TRANSACTION,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addField({
                    id: "id_reverse",
                    label: this.translations.LMRY_REVERSAL_TRANSACTION,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addField({
                    id: "account",
                    label: this.translations.LMRY_ACCOUNT,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addField({
                    id: "entity",
                    label: this.translations.LMRY_ENTITY,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addField({
                    id: "state",
                    label: this.translations.LMRY_STATE,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addRefreshButton();
            
                return sublist;
            }
            

            createSublistLog(){
                
                
            
                this.sublist = this.form.addSublist({
                    id: "custpage_results_list",
                    label: this.translations.LMRY_RESULTS,
                    type: serverWidget.SublistType.LIST
                });
            
                let sublist = this.sublist;
            
                sublist.addField({
                    id: "internalid",
                    label: this.translations.LMRY_INTERNAL_ID,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addField({
                    id: "subsidiary",
                    label: this.translations.LMRY_SUBSIDIARY,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addField({
                    id: "datecreated",
                    label: this.translations.LMRY_DATE_CREATED,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addField({
                    id: "created_by",
                    label: this.translations.LMRY_CREATED_BY,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addField({
                    id: "start_date",
                    label: this.translations.LMRY_START_DATE,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addField({
                    id: "end_date",
                    label: this.translations.LMRY_END_DATE,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addField({
                    id: "type_transaction",
                    label: this.translations.LMRY_TRANSACTION_TYPE,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addField({
                    id: "details",
                    label: this.translations.LMRY_DETAILS,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addField({
                    id: "state",
                    label: this.translations.LMRY_STATE,
                    type: serverWidget.FieldType.TEXT
                });
            
                sublist.addRefreshButton();
            
                return sublist;
            }
            

            loadSublist() {
                
                if (this.params.isDetails == 'T') {
                    return this.loadSublistDetails();                    
                }else{
                    return this.loadSublistLog();  
                }

            }
            loadSublistDetails(){
                let data = this.getTransactions();
                let sublist = this.form.getSublist({ id: "custpage_results_list_details" });
                let ids = Object.keys(data);
                ids.forEach((id,i)=>{
                    let {internalid,tranid,account,entity,state,type, transVoid, transReverse} = data[id];
                    let transactionType = {
                        void: "creditmemo",
                        reverse: "journalentry"
                    };
                    if (type == "creditmemo") {
                        transactionType = {
                            void: "customtransaction_lmry_ei_voided_transac",
                            reverse: "customtransaction_lmry_ei_voided_transac"
                        }
                    } else if (type == "customerpayment"){
                        transactionType = {
                            void: "journalentry",
                            reverse: "customtransaction_lmry_ei_voided_transac"
                        }
                    }
                    
                    let tranUrl = url.resolveRecord({ recordType: type , recordId: internalid, isEditMode: false });
                    let urlID = `<a class="dottedlink" href=${tranUrl} target="_blank">${tranid}</a>`;
                    sublist.setSublistValue({ id: "tranid", line: i, value: urlID });
                    if (transVoid) {
                        
                        const voidTranUrl = url.resolveRecord({ recordType: transactionType.void , recordId: transVoid, isEditMode: false });
                        const voidUrlID = `<a class="dottedlink" href=${voidTranUrl} target="_blank">${transVoid}</a>`;
                        sublist.setSublistValue({ id: "id_void", line: i, value: voidUrlID });
                    }  

                    if (transReverse) {
                        
                        const reverseTranUrl = url.resolveRecord({ recordType: transactionType.reverse , recordId: transReverse, isEditMode: false });
                        const reverseUrlID = `<a class="dottedlink" href=${reverseTranUrl} target="_blank">${transReverse}</a>`;
                        sublist.setSublistValue({ id: "id_reverse", line: i, value: reverseUrlID });
                    }
                    

                    sublist.setSublistValue({ id: "account", line: i, value: account });
                    sublist.setSublistValue({ id: "entity", line: i, value: entity });


                    let stateResult;
                    
                    switch (state) {
                        case "Procesada con exito":
                            stateResult = this.translations.LMRY_SUCESS;
                            break;
                        case "Error":
                            stateResult = this.translations.LMRY_ERROR;
                            break;
                        default:
                            stateResult ="Errors";
                    }
                    sublist.setSublistValue({ id: "state", line: i, value: stateResult });
                })

                if (ids.length) {
                    sublist.label = `${sublist.label} (${ids.length})`;
                }
            }

            getTransactions(){
                
                const recordLog = search.lookupFields({
                    type: 'customrecord_lmry_mx_rever_cancel_log',
                    id: this.params.logId,
                    columns: ['custrecord_lmry_mx_rcd_log_transact','custrecord_lmry_mx_rcd_log_state']
                });

                const transactionsState = JSON.parse(recordLog.custrecord_lmry_mx_rcd_log_transact);
                const recordLogState = recordLog.custrecord_lmry_mx_rcd_log_state;
                let transactionIds = [];
                let state;
                if (typeof transactionsState[0] === 'object' && transactionsState[0] !== null) {
                    for (let i = 0; i < transactionsState.length; i++) {
                        const transaction = transactionsState[i];
                        transactionIds.push(transaction.id);
                    }
                }else{
                    transactionIds = transactionsState;
                    state = "Procesando";
                }
                if (transactionIds.length == 0) {
                    return [];
                }
                
                let transactions = {};
                let searchTransactions = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["internalid", "anyof", transactionIds],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internalid" }),
                            search.createColumn({ name: "account", label: "Account" }),
                            search.createColumn({ name: "mainname", label: "Internal ID" }),
                            search.createColumn({ name: "tranid", label: "trandid" }),
                            search.createColumn({ name: "recordtype", label: "recordtype" })
                        ]
                });

                searchTransactions.run().each(function (result) {

                    transactions[result.getValue('internalid')] = {
                        internalid : result.getValue('internalid'),
                        account : result.getText('account'),
                        entity : result.getText('mainname'),
                        tranid : result.getValue('tranid'),
                        type : result.getValue('recordtype'),
                        state : "Procesando"
                    }
                    
                    return true
                });
                
                if (state != "Procesando") {
                    
                    transactionsState.forEach(transaction => {
                        transactions[transaction.id]['state'] = transaction.state;
                        transactions[transaction.id]['transVoid'] = transaction.transactionVoid;
                        transactions[transaction.id]['transReverse'] = transaction.transactionReserve;
                    });
                }else{
                    
                    if (recordLogState != "Finalizado" && recordLogState != "Procesando" && recordLogState != "Cargando datos") {
                        
                        transactionsState.forEach(transactionId => {
                            transactions[transactionId]['state'] = "No procesada";
                        });
                    }
                }
                return transactions;
                   
            }

            loadSublistLog(){
                let data = this.getRecords();

                let sublist = this.form.getSublist({ id: "custpage_results_list" });
                data.forEach((form,i)=>{
                    let {id,subsidiary,created,employee,startDate,endDate,type,state} = form;
                    let tranUrl = url.resolveRecord({ recordType: "customrecord_lmry_mx_rever_cancel_log" , recordId: id , isEditMode: false });
                    let urlID = `<a class="dottedlink" href=${tranUrl} target="_blank">${id }</a>`;
                    sublist.setSublistValue({ id: "internalid", line: i, value: urlID });
                    sublist.setSublistValue({ id: "subsidiary", line: i, value: subsidiary });
                    sublist.setSublistValue({ id: "datecreated", line: i, value: created });
                    sublist.setSublistValue({ id: "created_by", line: i, value: employee });
                    sublist.setSublistValue({ id: "start_date", line: i, value: startDate });
                    sublist.setSublistValue({ id: "end_date", line: i, value: endDate });
                    sublist.setSublistValue({ id: "type_transaction", line: i, value: type });
                    const afLogStltUrl = url.resolveScript({
                        scriptId: runtime.getCurrentScript().id,
                        deploymentId: runtime.getCurrentScript().deploymentId,
                        params: {
                            isDetails: "T",
                            logId: id
                        }
                    });
                    sublist.setSublistValue({ 
                        id: "details", 
                        line: i, 
                        value:  `<a href="${afLogStltUrl}" target="_blank" style="color:blue;">${this.translations.LMRY_DETAILS}</a>` });
                    

                    let stateResult;
                    
                    switch (state) {
                        case "Finalizado":
                            stateResult = this.translations.LMRY_FINISH;
                            break;
                        case "Ocurrió un error":
                            stateResult = this.translations.LMRY_O_ERROR;
                            break;
                        case "Procesando":
                            stateResult = this.translations.LMRY_PROCESSING;
                            break;
                        case "Preview":
                            stateResult = this.translations.LMRY_LOAD;
                            break;
                        default:
                            stateResult ="Errors";
                    }
                    sublist.setSublistValue({ id: "state", line: i, value: stateResult });
                })

                if (data.length) {
                    sublist.label = `${sublist.label} (${data.length})`;
                }
            }

            getRecords() {
                let data = [];

                let search_log = search.create({
                    type: "customrecord_lmry_mx_rever_cancel_log",
                    filters:
                        [
                            ["isinactive", "is", "F"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", sort: search.Sort.DESC }),
                            "custrecord_lmry_mx_rcd_log_subsi",
                            "created",
                            "custrecord_lmry_mx_rcd_log_employee",
                            "custrecord_lmry_mx_rcd_log_start_date",
                            "custrecord_lmry_mx_rcd_log_end_date",
                            "custrecord_lmry_mx_rcd_log_type",
                            "custrecord_lmry_mx_rcd_log_state"
                        ]
                });
                let pageData = search_log.runPaged({ pageSize: 1000 });
                if (pageData) {
                    pageData.pageRanges.forEach(function (pageRange) {
                        let page = pageData.fetch({ index: pageRange.index });
                        page.data.forEach(function (result){
                            let formublist = {};
                            formublist.id = result.getValue('internalid') || ' ';
                            formublist.subsidiary = result.getText('custrecord_lmry_mx_rcd_log_subsi') || ' ';
                            formublist.created = result.getValue('created') || ' ';
                            formublist.employee = result.getText('custrecord_lmry_mx_rcd_log_employee') || ' ';
                            formublist.startDate = result.getValue('custrecord_lmry_mx_rcd_log_start_date') || ' ';
                            formublist.endDate = result.getValue('custrecord_lmry_mx_rcd_log_end_date') || ' ';
                            formublist.type = result.getText('custrecord_lmry_mx_rcd_log_type') || ' ';
                            formublist.state = result.getValue('custrecord_lmry_mx_rcd_log_state') || ' ';

                            data.push(formublist);
                        });
                    });
                }
                
                return data;
            }

            toMainSuitelet() {
                const STLT_ID = "customscript_lmry_mx_rever_canc_stlt";
                const DEPLOY_ID = "customdeploy_lmry_mx_rever_canc_stlt";
                redirect.toSuitelet({
                    scriptId: STLT_ID,
                    deploymentId: DEPLOY_ID
                });
            }


            getTranslations() {
                let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
                language = language === "es" ? language : "en";
                const translatedFields = {
                    "es": {
                        "LMRY_MESSAGE": "Mensaje",
                        "LMRY_ERROR": "Error",
                        "LMRY_RESULTS": "Resultados",
                        "LMRY_INTERNAL_ID": "Id interno",
                        "LMRY_SUBSIDIARY": "Subsidiaria",
                        "LMRY_DATE_CREATED": "Fecha de Creación",
                        "LMRY_CREATED_BY": "Creado por",
                        "LMRY_START_DATE": "Desde la fecha",
                        "LMRY_END_DATE": "Hasta la fecha",
                        "LMRY_TRANSACTION_TYPE": "Tipo de transacción",
                        "LMRY_DETAILS": "Detalles",
                        "LMRY_STATE": "Estado",
                        "LMRY_DETAILS_FORM_TITLE": "LatamReady - MX Detalles de Documentos Anulados Revertidos",
                        "LMRY_LOG_FORM_TITLE": "LatamReady - MX Registro de Documentos Anulados Revertidos",
                        "LMRY_PROCESS_NOTE": "Se está generando el pago y la creación de asientos diarios. La columna [ESTADO] indica el estado del proceso.",
                        "LMRY_REFRESH_BUTTON_NOTE": "Presione el botón Actualizar o Refresh para ver si el proceso terminó.",
                        "LMRY_RETURN_TO_HOME_PAGE": "Volver a la Página Principal",
                        "LMRY_PRINCIPAL_TRANSACTION": "Transacción principal",
                        "LMRY_VOID_TRANSACTION": "Transacción de anulación",
                        "LMRY_REVERSAL_TRANSACTION": "Transacción de reversión",
                        "LMRY_ACCOUNT": "Cuenta",
                        "LMRY_ENTITY": "Entidad",

                        "LMRY_FINISH": "Finalizado",
                        "LMRY_O_ERROR": "Ocurrió un error",
                        "LMRY_PROCESSING": "Procesando",
                        "LMRY_LOAD": "Cargando Datos",
                        "LMRY_SUCESS": "Procesada con exito",
                    },
                    "en": {
                        "LMRY_MESSAGE": "Message",
                        "LMRY_ERROR": "Error",
                        "LMRY_RESULTS": "Results",
                        "LMRY_INTERNAL_ID": "Internal ID",
                        "LMRY_SUBSIDIARY": "Subsidiary",
                        "LMRY_DATE_CREATED": "Date Created",
                        "LMRY_CREATED_BY": "Created By",
                        "LMRY_START_DATE": "Start Date",
                        "LMRY_END_DATE": "End Date",
                        "LMRY_TRANSACTION_TYPE": "Transaction Type",
                        "LMRY_DETAILS": "Details",
                        "LMRY_STATE": "State",
                        "LMRY_DETAILS_FORM_TITLE": "LatamReady - MX Details Canceled Documents Reversed",
                        "LMRY_LOG_FORM_TITLE": "LatamReady - MX Log Canceled Documents Reversed",
                        "LMRY_PROCESS_NOTE": "Payment and daily journal entry creation are being generated. The [STATUS] column indicates the process status.",
                        "LMRY_REFRESH_BUTTON_NOTE": "Press the Update or Refresh button to see if the process has finished.",
                        "LMRY_RETURN_TO_HOME_PAGE": "Return to Home Page",
                        "LMRY_PRINCIPAL_TRANSACTION": "Principal Transaction",
                        "LMRY_VOID_TRANSACTION": "Void Transaction",
                        "LMRY_REVERSAL_TRANSACTION": "Reversal Transaction",
                        "LMRY_ACCOUNT": "Account",
                        "LMRY_ENTITY": "Entity",

                        "LMRY_FINISH": "Complete",
                        "LMRY_O_ERROR": "An error occurred",
                        "LMRY_PROCESSING": "Processing",
                        "LMRY_LOAD": "Loading data",
                        "LMRY_SUCESS": "Successfully processed",
                    },
                }
                return translatedFields[language];
            }
            
            


        }

        return {
            LibraryHandler: LibraryHandler
        };
    });
