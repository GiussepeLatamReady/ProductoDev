/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for WTH on Purchases                           ||
||                                                              ||
||  File Name: SMC_MX_Reverse_Cancellation_Log_LBRY_V2.1.js     ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Oct 04 2023  LatamReady    Use Script 2.1           ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Author master@latamready.com
**/

define(["N/log","N/search", "N/runtime", "N/redirect", "N/ui/serverWidget","N/url"],
    function (log,search, runtime, redirect, serverWidget,url) {

        const LMRY_script = 'SMC - MX Canceled Documents Reversed Log LBRY';
        
        class LibraryHandler {
            constructor(options) {
                this.params = options.params || {};
                this.method = options.method;

                this.FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });

                this.deploy = runtime.getCurrentScript().deploymentId;

            }

            createLogForm() {
                let titleForm =''; 
                if (this.params.isDetails == 'T') {
                    this.form = serverWidget.createForm({
                        title: 'SMC - MX Canceled Documents Reversed Details'
                    });
                    return this.form;
                }else{
                    this.form = serverWidget.createForm({
                        title: 'SMC - MX Canceled Documents Reversed Log'
                    });
                }
                
                let form = this.form;

                let myInlineHtml = form.addField({ id: 'custpage_id_message', label: 'MESSAGE', type: serverWidget.FieldType.INLINEHTML });
                //myInlineHtml.layoutType = serverWidget.FieldLayoutType.OUTSIDEBELOW;
                myInlineHtml.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });

                let strhtml = "<html>";
                strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>";
                strhtml += "<tr>";
                strhtml += "</tr>";
                strhtml += "<tr>";
                strhtml += "<td class='text'>";
                strhtml += "<div style=\"color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">";
                strhtml += "Nota: Se está generando el pago y la creación de asientos diarios. La columna [ESTADO] indica el estado del proceso.";
                strhtml += "<br/><br/>";
                strhtml += "Presione el botón Actualizar o Refresh para ver si el proceso terminó.";
                strhtml += "</td>";
                strhtml += "</tr>";
                strhtml += "</table>";
                strhtml += "</html>";

                myInlineHtml.defaultValue = strhtml;

                form.addSubmitButton({
                    label: "Volver a la Página Principal"
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
                    label: "Resultados",
                    type: serverWidget.SublistType.LIST
                });

                let sublist = this.sublist;

                sublist.addField({
                    id: "internalid",
                    label: "Id interno",
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "tranid",
                    label: "Numero de transacción",
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "account",
                    label: "Account",
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "entity",
                    label: "Entidad",
                    type: serverWidget.FieldType.TEXT
                });
                sublist.addField({
                    id: "state",
                    label: "Estado",
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addRefreshButton();

                return sublist;
            }

            createSublistLog(){
                this.sublist = this.form.addSublist({
                    id: "custpage_results_list",
                    label: "Resultados",
                    type: serverWidget.SublistType.LIST
                });

                let sublist = this.sublist;

                sublist.addField({
                    id: "internalid",
                    label: "Id interno",
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "subsidiary",
                    label: "Subsidiaria",
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "datecreated",
                    label: "Fecha de Creación",
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "created_by",
                    label: "Creado por",
                    type: serverWidget.FieldType.TEXT
                });
                sublist.addField({
                    id: "start_date",
                    label: "Desde la fecha",
                    type: serverWidget.FieldType.TEXT
                });
                sublist.addField({
                    id: "end_date",
                    label: "Hasta la fecha",
                    type: serverWidget.FieldType.TEXT
                });
                sublist.addField({
                    id: "type_transaction",
                    label: "Tipo de transacciòn",
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "details",
                    label: "Detalles",
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "state",
                    label: "Estado",
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
                    let {internalid,tranid,account,entity,state} = data[id];
                    let tranUrl = url.resolveRecord({ recordType: "invoice" , recordId: internalid, isEditMode: false });
                    let urlID = `<a class="dottedlink" href=${tranUrl} target="_blank">${internalid}</a>`;
                    sublist.setSublistValue({ id: "internalid", line: i, value: urlID });
                    sublist.setSublistValue({ id: "tranid", line: i, value: tranid });
                    sublist.setSublistValue({ id: "account", line: i, value: account });
                    sublist.setSublistValue({ id: "entity", line: i, value: entity });
                    sublist.setSublistValue({ id: "state", line: i, value: state });
                })

                if (ids.length) {
                    sublist.label = `${sublist.label} (${ids.length})`;
                }
            }

            getTransactions(){
                
                const recordLog = search.lookupFields({
                    type: 'customrecord_smc_mx_rever_cancel_log',
                    id: this.params.logId,
                    columns: ['custrecord_smc_mx_rcd_log_transact','custrecord_smc_mx_rcd_log_state']
                });

                const transactionsState = JSON.parse(recordLog.custrecord_smc_mx_rcd_log_transact);
                const recordLogState = recordLog.custrecord_smc_mx_rcd_log_state;
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
                        ]
                });

                searchTransactions.run().each(function (result) {

                    transactions[result.getValue('internalid')] = {
                        internalid : result.getValue('internalid'),
                        account : result.getText('account'),
                        entity : result.getText('mainname'),
                        tranid : result.getValue('tranid'),
                        state : "Procesando"
                    }
                    
                    return true
                });
                
                if (state != "Procesando") {
                    
                    transactionsState.forEach(transaction => {
                        transactions[transaction.id]['state'] = transaction.state;
                    });
                }else{
                    
                    if (recordLogState != "Finalizado" && recordLogState != "Procesando" && recordLogState != "Preview") {
                        
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
                    let tranUrl = url.resolveRecord({ recordType: "customrecord_smc_mx_rever_cancel_log" , recordId: id , isEditMode: false });
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
                        value:  `<a href="${afLogStltUrl}" target="_blank" style="color:blue;">Detalles</a>` });
                    sublist.setSublistValue({ id: "state", line: i, value: state });
                })

                if (data.length) {
                    sublist.label = `${sublist.label} (${data.length})`;
                }
            }

            getRecords() {
                let data = [];

                let search_log = search.create({
                    type: "customrecord_smc_mx_rever_cancel_log",
                    filters:
                        [
                            ["isinactive", "is", "F"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", sort: search.Sort.DESC }),
                            "custrecord_smc_mx_rcd_log_subsi",
                            "created",
                            "custrecord_smc_mx_rcd_log_employee",
                            "custrecord_smc_mx_rcd_log_start_date",
                            "custrecord_smc_mx_rcd_log_end_date",
                            "custrecord_smc_mx_rcd_log_type",
                            "custrecord_smc_mx_rcd_log_state"
                        ]
                });
                let pageData = search_log.runPaged({ pageSize: 1000 });
                if (pageData) {
                    pageData.pageRanges.forEach(function (pageRange) {
                        let page = pageData.fetch({ index: pageRange.index });
                        page.data.forEach(function (result){
                            let formublist = {};
                            formublist.id = result.getValue('internalid') || ' ';
                            formublist.subsidiary = result.getText('custrecord_smc_mx_rcd_log_subsi') || ' ';
                            formublist.created = result.getValue('created') || ' ';
                            formublist.employee = result.getText('custrecord_smc_mx_rcd_log_employee') || ' ';
                            formublist.startDate = result.getValue('custrecord_smc_mx_rcd_log_start_date') || ' ';
                            formublist.endDate = result.getValue('custrecord_smc_mx_rcd_log_end_date') || ' ';
                            formublist.type = result.getText('custrecord_smc_mx_rcd_log_type') || ' ';
                            formublist.state = result.getValue('custrecord_smc_mx_rcd_log_state') || ' ';

                            data.push(formublist);
                        });
                    });
                }
                
                return data;
            }

            toMainSuitelet() {
                const STLT_ID = "customscript_smc_mx_rever_canc_stlt";
                const DEPLOY_ID = "customdeploy_smc_mx_rever_canc_stlt";
                redirect.toSuitelet({
                    scriptId: STLT_ID,
                    deploymentId: DEPLOY_ID
                });
            }
        }

        return {
            LibraryHandler: LibraryHandler
        };
    });
