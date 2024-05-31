/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @Name LMRY_CO_Header_WHT_calculation_CLNT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */
define(['N/runtime',
    'N/search',
    'N/record',
    'N/format',
    'N/ui/message',
    'SuiteBundles/Bundle 37714/Latam_Library/LMRY_Log_LBRY_V2.0',
    'N/url',
    'N/currentRecord'],
    (runtime, search, record, format, message, lbryLog, urlApi, currentRecord) => {
        const STLT_ID = 'customscript_lmry_co_head_wht_calc_stlt';
        let DEPLOY_ID, handler;

        const pageInit = context => {
            const recordObj = context.currentRecord;
            DEPLOY_ID = recordObj.getValue('custpage_deploy_id');
            handler = new ClientUIManager({ deployid: DEPLOY_ID });
            handler.pageInit(context);
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
                scriptId: "customscript_lmry_co_head_calc_stlt_log",
                deploymentId: "customdeploy_lmry_co_head_calc_stlt_log",
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
                this.FEAT_SUBS = this.isValid(runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' }));
                this.FEAT_CALENDAR = this.isValid(runtime.isFeatureInEffect({ feature: 'MULTIPLECALENDARS' }));
                let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
                language = language === "es" ? language : "en";
                this.deploy = options.deployid;
                this.names = this.getNames(this.deploy);
                this.translations = this.getTranslations(language);

            }


            getNames(deploy) {
                let nameList = {
                    customdeploy_lmry_co_head_wht_calc_stlt: {
                        scriptmprd: 'customscript_lmry_co_head_wht_calc_mprd',
                        deploymprd: 'customdeploy_lmry_co_head_wht_calc_mprd'
                    }
                };
                return nameList[deploy];
            }

            pageInit(scriptContext) {
                this.currentRecord = scriptContext.currentRecord;
                const status = this.currentRecord.getValue('custpage_status');
                const isInit = status == 1 || status == "1";

                if (isInit) this.setFieldPeriod(isInit);
                
            }
            validateField(scriptContext) {
                this.currentRecord = scriptContext.currentRecord;
                if (scriptContext.fieldId == 'custpage_subsidiary') {
                    this.setPeriod(false);
                }
                if (scriptContext.fieldId == 'custpage_subsidiary') {
                    this.setFieldPeriod();
                }
               
                return true
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
                    this.handleError('[ saveRecord ]', err);
                    return false;
                }

                return true;
            }

            setPeriod(isInit) {
                let filters = [
                    ['isadjust', 'is', 'F'],
                    'AND',
                    ["isquarter", "is", "F"],
                    'AND',
                    ["isyear", "is", "F"]
                ];


                if (this.FEAT_SUBS && this.FEAT_CALENDAR) {

                    const subsidiary = this.currentRecord.getValue({ fieldId: 'custpage_subsidiary' });
                    const { fiscalcalendar } = search.lookupFields({
                        type: search.Type.SUBSIDIARY,
                        id: subsidiary,
                        columns: ['fiscalcalendar']
                    });

                    if (fiscalcalendar && fiscalcalendar.length > 0) {
                        filters.push('AND',['fiscalcalendar', 'anyof', fiscalcalendar[0].value]);
                    }

                    
                }
                const periodSearch = search.create({
                    type: "accountingperiod",
                    filters: filters,
                    columns: [
                        search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                        search.createColumn({ name: "periodname", summary: "GROUP", label: "Name" }),
                        search.createColumn({ name: "startdate", summary: "GROUP", sort: search.Sort.DESC, label: "Start Date" })
                    ]
                });

                // Obtención de periodos
                const periods = periodSearch.run().getRange({ start: 0, end: 1000 });

                // Configuración del campo de periodo
                const periodField = this.currentRecord.getField({ fieldId: 'custpage_ini_period' });
                const periodFinalField = this.currentRecord.getField({ fieldId: 'custpage_fin_period' });
                if (periodField || periodFinalField) {
                    periodField.removeSelectOption({ value: null });
                    periodFinalField.removeSelectOption({ value: null });
                if(isInit){

                    const urlObject = new URL(window.location.href);
                    const accoutingPeriodValue = urlObject.searchParams.get('accoutingPeriod');
                    const accoutingFinalPeriodValue = urlObject.searchParams.get('accoutingFinalPeriod');
                    

                    const periodNameIni = search.lookupFields({
                        type: 'accountingperiod',
                        id: accoutingPeriodValue,
                        columns: ['periodname']
                    }).periodname;

                    const periodNameFin = search.lookupFields({
                        type: 'accountingperiod',
                        id: accoutingFinalPeriodValue,
                        columns: ['periodname']
                    }).periodname;

                    periodField.insertSelectOption({ value: accoutingPeriodValue, text: periodNameIni });
                    periodFinalField.insertSelectOption({ value: accoutingFinalPeriodValue, text: periodNameFin });
                }else {
                        periods.forEach(period => {
                            const periodId = period.getValue({ name: 'internalid', summary: "GROUP" });
                            const periodName = period.getValue({ name: 'periodname', summary: "GROUP" });
                            periodField.insertSelectOption({ value: periodId, text: periodName });
                            periodFinalField.insertSelectOption({ value: periodId, text: periodName });
                        });
                    }
                }
            }


            validateMandatoryFields() {
                const recordObj = this.currentRecord;
                const fieldsObj = {};
                //const periodTypeValue = this.currentRecord.getValue({ fieldId: 'custpage_ period _type' });
                let mandatoryFields = [
                    'custpage_wht_process',
                    'custpage_wht_type'
                ];
                
                mandatoryFields.push('custpage_ini_period');
                mandatoryFields.push('custpage_fin_period');
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

                const perIni = recordObj.getValue('custpage_ini_period');
                const perfin = recordObj.getValue('custpage_fin_period');

                const period1 = record.load({
                    type: record.Type.ACCOUNTING_PERIOD,
                    id: perIni
                });
                
                const period2 = record.load({
                    type: record.Type.ACCOUNTING_PERIOD,
                    id: perfin
                });

                var startDateIni = period1.getValue('startdate');
                var startDateFin = period2.getValue('startdate');

                // Convertir las fechas a objetos Date
                var firstDate = new Date(startDateIni);
                var secondDate = new Date(startDateFin);
                
                if (firstDate > secondDate){
                    alert(this.translations.LMRY_VALIDATE_PERIODS);
                    return false;
                }

                return !mandatoryFields.some(isFieldInvalid);
            }

            

            addFieldMandatory(fields, id) {
                if (!fields.includes(id)) {
                    fields.push(id);
                }
                return fields
            }
            removeFieldMandatory(fields, id) {
                return fields.filter(element => element !== id);
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



            setFieldPeriod(isInit) {
                
                this.setPeriod(isInit);
                this.currentRecord.getField({ fieldId: 'custpage_ini_period' }).isDisplay = true;
                this.currentRecord.getField({ fieldId: 'custpage_fin_period' }).isDisplay = true;

            }


            validateExecution() {
                let mprd_scp = 'customscript_lmry_co_head_wht_calc_mprd';
                let mprd_dep = 'customdeploy_lmry_co_head_wht_calc_mprd';
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


            createRecordLog(isCron, dataProcess) {
                let currentRecord = this.currentRecord;
                let form = {
                    ids: []
                };
                
                if (!isCron) {

                    form.subsidiary = Number(currentRecord.getValue({ fieldId: 'custpage_subsidiary' })) || '';
                    form.typeProcess = currentRecord.getValue({ fieldId: 'custpage_wht_process' });
                   
                    form.whtType = currentRecord.getValue({ fieldId: 'custpage_wht_type' });
                       
                    form.accoutingPeriod = currentRecord.getValue({ fieldId: 'custpage_ini_period' });
                    form.accoutingFinalPeriod = currentRecord.getValue({ fieldId: 'custpage_fin_period' });
                    form.executionType = "UI";

                    let numberLines = currentRecord.getLineCount({ sublistId: 'custpage_results_list' });
                    for (let i = 0; i < numberLines; i++) {

                        let isApplied = currentRecord.getSublistValue({
                            sublistId: 'custpage_results_list',
                            fieldId: 'apply',
                            line: i
                        });
    
                        if (isApplied) {
                            form.ids.push(currentRecord.getSublistValue({ sublistId: 'custpage_results_list', fieldId: 'internalidtext', line: i }));
                        }
                    }
                }else{
                    form = dataProcess;
                }

                

                const periodlookup = search.lookupFields({
                    type: 'accountingperiod',
                    id: form.accoutingPeriod,
                    columns: ['periodname']
                });

                let initialPeriod= periodlookup.periodname;

                const periodlookupFin = search.lookupFields({
                    type: 'accountingperiod',
                    id: form.accoutingFinalPeriod,
                    columns: ['periodname']
                });

                let finalPeriod = periodlookupFin.periodname;

                // Creacion de Logs
                let idlog = '';

                let recordlog = record.create({
                    type: 'customrecord_lmry_co_head_wht_cal_log'
                });

                recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_subsi', value: form.subsidiary });
                
                recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_state', value: "Cargando datos" });
                recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_employee', value: runtime.getCurrentUser().id });
                recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_transactions', value: JSON.stringify(form.ids) });
                recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_process', value: form.typeProcess });
                recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_whttype', value: form.whtType });
                recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_period', value: initialPeriod });
                recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_period_fin', value: finalPeriod });
                recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_exect', value: form.executionType });
                idlog = recordlog.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });

                currentRecord.setValue({ fieldId: 'custpage_log_id', value: idlog, ignoreFieldChange: true });

                this.parameters = { idlog,idUser: runtime.getCurrentUser().id }
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

            handleError(functionName, err) {
                console.error(functionName, err);
                lbryLog.doLog({ title: functionName, message: err, relatedScript: "LMRY_CO_Header_WHT_calculation_CLNT_V2.1.js" });
                alert(functionName + '\n' + JSON.stringify({ name: err.name, message: err.message }));
            }

        }

        return { pageInit, validateField, saveRecord, back, backLog, toggleCheckBoxes, reload, ClientUIManager };
    });