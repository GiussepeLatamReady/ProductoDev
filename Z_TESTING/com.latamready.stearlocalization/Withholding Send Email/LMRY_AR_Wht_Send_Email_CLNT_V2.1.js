/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @Name LMRY_AR_Wht_Send_Email_CLNT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 18/07/2024
 */
define([
    'N/runtime',
    'N/search',
    'N/record',
    'N/ui/message',
    'N/url',
    'N/currentRecord',
    "../Constants/LMRY_AR_GlobalConstants_LBRY",
    "../Latam Tools/Router/LMRY_AR_Library_CLNT_ROUT"
],
    (
        runtime, 
        search, 
        record, 
        message, 
        urlApi, 
        currentRecord, 
        Constants, 
        Router_LBRY
    ) => {
        const STLT_ID = 'customscript_lmry_ste_ar_wht_se_stlt';
        const LMRY_SCRIPT = "LMRY_AR_Wht_Send_Email_CLNT_V2.1.js";
        let DEPLOY_ID, handler;
        const { Error_LBRY } = Router_LBRY;

        const pageInit = context => {
            try {
                const {currentRecord} = context;
                DEPLOY_ID = currentRecord.getValue('custpage_deploy_id');
                handler = new ClientUIManager({ deployid: DEPLOY_ID });
                handler.pageInit(context);
            } catch (err) {
                Error_LBRY.handleError({ title: "[pageInit]", err, script: LMRY_SCRIPT ,suiteAppId: Constants.APP_ID });
            }
        };

        const validateField = context => handler.validateField(context);

        const saveRecord = context => handler.saveRecord(context);

        const back = () => {
            const urlSuitelet = urlApi.resolveScript({
                scriptId: STLT_ID,
                deploymentId: DEPLOY_ID,
                returnExternalUrl: false
            });
            window.location.href = urlSuitelet;
        };

        const backLog = () => {
            const urlSuitelet = urlApi.resolveScript({
                scriptId: "customscript_lmry_ste_ar_wht_se_log_stlt",
                deploymentId: "customdeploy_lmry_ste_ar_wht_se_log_stlt",
                returnExternalUrl: false
            });
            window.location.href = urlSuitelet;
        };

        const toggleCheckBoxes = isApplied => {
            const recordObj = currentRecord.get();
            const numberLines = recordObj.getLineCount({ sublistId: 'custpage_results_list' });
            for (let i = 0; i < numberLines; i++) {
                recordObj.selectLine({ sublistId: 'custpage_results_list', line: i });
                recordObj.setCurrentSublistValue({ sublistId: 'custpage_results_list', fieldId: 'apply', value: isApplied });
            }
        };

        const reload = () => {

            var _record = currentRecord.get();

            var path = urlApi.resolveRecord({
                recordType: _record.type,
                recordId: _record.id,
                isEditMode: false,
            });

            setWindowChanged(window, false);
            window.location.href = path;

        }

        class ClientUIManager {
            constructor(options) {

                let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
                language = language === "es" ? language : "en";
                this.deploy = options.deployid;
                this.names = this.getNames(this.deploy);
                this.translations = this.getTranslations(language);
            }


            getNames(deploy) {
                let nameList = {
                    customdeploy_lmry_ste_ar_wht_se_stlt: {
                        scriptmprd: 'customscript_lmry_ste_ar_wht_se_mprd',
                        deploymprd: 'customdeploy_lmry_ste_ar_wht_se_mprd'
                    }
                };
                return nameList[deploy];
            }

            pageInit(scriptContext) {
                this.currentRecord = scriptContext.currentRecord;
                const status = this.currentRecord.getValue('custpage_status');
                //if (status === 1 || status === "1") this.setVendors(); 
            }
            validateField(scriptContext) {

                try {
                    this.currentRecord = scriptContext.currentRecord;
                    if (scriptContext.fieldId == 'custpage_subsidiary') {
                        this.setVendors();
                    }
                    return true;
                } catch (err) {
                    Error_LBRY.handleError({ title: "[validate Field]", err, script: LMRY_SCRIPT, suiteAppId: Constants.APP_ID });
                    return false;
                }
                
            }
            

            saveRecord(context) {
                try {
                    
                    this.currentRecord = context.currentRecord;
                    let recordObj = context.currentRecord;
                    let status = recordObj.getValue({ fieldId: 'custpage_status' });
                    status = Number(status);
                    if (!status) {
                        if (!this.validateMandatoryFields()) {
                            return false;
                        }
                        
                    } else {
                        if (!this.validateSublist()) {
                            return false;
                        }

                        if (!this.validateExecution()) {
                            return false;
                        }

                        if (!this.createRecordLog()) {
                            return false;
                        }
                    }
                } catch (err) {
                    alert(err.stack)
                    Error_LBRY.handleError({ title: "[Save Record]", err, script: LMRY_SCRIPT, suiteAppId: Constants.APP_ID });
                    return false;
                }

                return true;
            }


            validateMandatoryFields() {
                const recordObj = this.currentRecord;
                const fieldsObj = {};
                //const periodTypeValue = this.currentRecord.getValue({ fieldId: 'custpage_ period _type' });
                let mandatoryFields = [
                    'custpage_period_start',
                    'custpage_period_end'
                ];
                const isFieldInvalid = (fieldId) => {
                    const value = recordObj.getValue({ fieldId });
                    fieldsObj[fieldId] = value;
                    if (value == 0 || !value) {
                        const fieldLabel = recordObj.getField({ fieldId }).label;
                        alert(`${this.translations.LMRY_VALIDATE_VALUES} ${fieldLabel}`);
                        return true;
                    }
                    return false;
                };

                const perIni = recordObj.getValue('custpage_period_start');
                const perfin = recordObj.getValue('custpage_period_end');


                // Convertir las fechas a objetos Date
                var firstDate = new Date(perIni);
                var secondDate = new Date(perfin);
                
                if (firstDate > secondDate){
                    alert(this.translations.LMRY_VALIDATE_PERIODS);
                    return false;
                }

                return !mandatoryFields.some(isFieldInvalid);
            }


            validateSublist() {
                const recordObj = this.currentRecord;
                const numberLines = recordObj.getLineCount({ sublistId: 'custpage_results_list' });

                if (numberLines < 1) {
                    alert(this.translations.LMRY_FILTER_TRANSACTIONS);
                    return false;
                }

                const numApplieds = Array.from({ length: numberLines }).reduce((count, _, i) =>
                    count + (recordObj.getSublistValue({ sublistId: 'custpage_results_list', fieldId: 'apply', line: i }) ? 1 : 0), 0);

                if (numApplieds === 0) {
                    alert(this.translations.LMRY_SELECTED_TRANSACTIONS);
                    return false;
                }
                return true;
            }



            validateExecution() {
                let mprd_scp = 'customscript_lmry_ste_ar_wht_se_mprd';
                let mprd_dep = 'customdeploy_lmry_ste_ar_wht_se_mprd';
                let search_executions = search.create({
                    type: 'scheduledscriptinstance',
                    filters: [
                        ['status', 'anyof', 'PENDING', 'PROCESSING'],
                        'AND',
                        ['script.scriptid', 'is', mprd_scp],
                        'AND',
                        ['scriptdeployment.scriptid', 'is', mprd_dep]
                    ],
                    columns: [
                        search.createColumn({
                            name: 'timestampcreated',
                            sort: search.Sort.DESC
                        }),
                        'mapreducestage',
                        'status',
                        'taskid'
                    ]
                });

                let results = search_executions.run().getRange(0, 1);

                if (results && results.length) {
                    let myMsg = message.create({
                        title: this.translations.LMRY_ALERT,
                        message: this.translations.LMRY_PROCESS_ACTIVATE,
                        type: message.Type.INFORMATION,
                        duration: 8000
                    });
                    myMsg.show();
                    return false;
                }

                return true;
            }


            createRecordLog() {
                const recordStatus = this.getRecordStatus();
                console.log("recordStatus :",recordStatus);

                let currentRecord = this.currentRecord;
                let form = {
                    ids: [],
                    transactions: []
                };
                
                form.subsidiary = Number(currentRecord.getValue({ fieldId: 'custpage_subsidiary' })) || '';
                form.dateFrom = currentRecord.getValue({ fieldId: 'custpage_period_start' }) || '';
                form.dateTo = currentRecord.getValue({ fieldId: 'custpage_period_end' }) || '';
                

                let numberLines = currentRecord.getLineCount({ sublistId: 'custpage_results_list' });
                for (let i = 0; i < numberLines; i++) {
                    let isApplied = currentRecord.getSublistValue({
                        sublistId: 'custpage_results_list',
                        fieldId: 'apply',
                        line: i
                    });

                    if (isApplied) {
                        form.transactions.push({
                            id: currentRecord.getSublistValue({ sublistId: 'custpage_results_list', fieldId: 'internalidtext', line: i }),
                            vendorID: currentRecord.getSublistValue({ sublistId: 'custpage_results_list', fieldId: 'entity_id', line: i }),
                            email: currentRecord.getSublistValue({ sublistId: 'custpage_results_list', fieldId: 'email', line: i }),
                        });
                    }
                }

                let pooledPayments = {};
                console.log("form",  form);
                //Agrupar bill payments por vendor
                form.transactions.forEach(({id,vendorID,email}) => {

                    if (!pooledPayments[vendorID]) pooledPayments[vendorID] = {email,transactions: []}
                    pooledPayments[vendorID].transactions.push(id);

                });

                

                // Creacion de Logs
                let logIds = [];
                for (const vendorID in pooledPayments) {
                    const {transactions,email} = pooledPayments[vendorID];
                    console.log("pooledPayments[vendorID] :",pooledPayments[vendorID])
                    let recordlog = record.create({
                        type: 'customrecord_lmry_ste_ar_wht_send'
                    });
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ste_ar_wht_se_subsi', value: form.subsidiary });
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ste_ar_wht_se_vendor', value: vendorID });
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ste_ar_wht_se_email', value: email });
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ste_ar_wht_se_dfrom', value: form.dateFrom });
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ste_ar_wht_se_dto', value: form.dateTo });
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ste_ar_wht_se_employee', value: runtime.getCurrentUser().id });
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ste_ar_wht_se_status', value: recordStatus["PREPARING"].id });
                    
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ste_ar_wht_se_payments', value: JSON.stringify(transactions) });
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ste_ar_wht_se_payments_m', value: transactions })
                    const idlog = recordlog.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                    logIds.push(idlog);
                }
                currentRecord.setValue({ fieldId: 'custpage_log_id', value: JSON.stringify(logIds), ignoreFieldChange: true });
                return true;
            }

            isValid(bool) {
                return (bool === "T" || bool === true);
            }

            getTranslations(country) {
                const translatedFields = {
                    "es": {
                      "LMRY_VALIDATE_VALUES": "Ingrese un valor para:",
                      "LMRY_PROCESS_ACTIVATE": "Espere un momento por favor, el proceso se encuentra en curso.",
                      "LMRY_FILTER_TRANSACTIONS": "No hay transacciones Filtradas",
                      "LMRY_SELECTED_TRANSACTIONS": "No hay transacciones Seleccionadas",
                      "LMRY_ALERT": "Alerta",
                      "LMRY_VALIDATE_PERIODS": "El período inicial no puede ser mayor que el período final",
                    },
                    "en": {
                      "LMRY_VALIDATE_VALUES": "Enter a value for:",
                      "LMRY_PROCESS_ACTIVATE": "Please wait a moment, the process is in progress.",
                      "LMRY_FILTER_TRANSACTIONS": "No Filtered Transactions",
                      "LMRY_SELECTED_TRANSACTIONS": "No Selected Transactions",
                      "LMRY_ALERT": "Alert",
                      "LMRY_VALIDATE_PERIODS": "Initial period can't be bigger than final period",
                    }
                  };
                return translatedFields[country];
            }

            setVendors(){
                let subsidiary = this.currentRecord.getValue({ fieldId: 'custpage_subsidiary' });
                const vendors = this.getVendors(subsidiary);
                const entityField = this.currentRecord.getField({ fieldId: 'custpage_entity' });

                if (entityField) {
                    entityField.removeSelectOption({ value: null });
                    entityField.insertSelectOption({ value: 0, text:'&nbsp;'});
                    vendors.forEach(({value,text}) => {
                        entityField.insertSelectOption({ value, text});
                    });
                }
                
            }

            getVendors(subsidiary){
                
                let vendors = [];
                const newSearchVendor = search.create({
                    type: "vendor",
                    filters: [
                        ['subsidiary', 'is', subsidiary]
                    ],
                    columns: [
                        search.createColumn({
                            name: "formulatext",
                            formula: "CASE WHEN {isperson} = 'T' THEN {firstname} ELSE '' END",
                            label: "0. Nombres"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "CASE WHEN {isperson} = 'T' THEN {middlename} ELSE '' END",
                            label: "1. Segundo nombre"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "CASE WHEN {isperson} = 'T' THEN {lastname} ELSE '' END",
                            label: "2. Apellidos"
                        }),    
                        search.createColumn({
                            name: "formulatext",
                            formula: "CASE WHEN {isperson} = 'F' THEN {companyname} ELSE '' END",
                            label: "3. Razón Social"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{isperson}",
                            label: "4. tipo de entidad"
                        }),                        
                    ]
                }); 
            
                newSearchVendor.run().each(result =>{
                    const columns = result.columns;
            
                    const isPerson = result.getValue(columns[4]);
            
                    if (isPerson ==="T" || isPerson === true) {
                        const firstname = result.getValue(columns[0]);
                        const middlename = result.getValue(columns[1]);
                        const lastname = result.getValue(columns[2]);
                        const fullname = `${firstname} ${middlename} ${lastname}`;
                        vendors.push({
                            value:result.id,
                            text:fullname
                        });
                    }else{
                        const companyname = result.getValue(columns[3]);
                        vendors.push({
                            value:result.id,
                            text:companyname
                        });
                    }
                    return true;
                });
            
                return vendors;
            }

            getRecordStatus(){
                let status = {}
                const newSearchStatus = search.create({
                    type: "customrecord_lmry_ste_process_status",
                    filters: [],
                    columns: [
                        "name",
                        "custrecord_lmry_ste_procstatus_code"
                    ]
                });
                
                newSearchStatus.run().each(result =>{
                    const columns = result.columns;
                    const code = result.getValue(columns[1]);
                    status[code] = {
                        id: result.id,
                        name: result.getValue(columns[0])
                    }  
                    return true;
                });

                return status;
            }
        }

        return { pageInit, validateField, saveRecord, back, backLog, toggleCheckBoxes, reload};
    });