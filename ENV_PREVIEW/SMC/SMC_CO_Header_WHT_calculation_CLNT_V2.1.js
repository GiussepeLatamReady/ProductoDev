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
        const STLT_ID = 'customscript_smc_co_head_wht_calc_stlt';
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
                scriptId: "customscript_smc_co_head_calc_stlt_log",
                deploymentId: "customdeploy_smc_co_head_calc_stlt_log",
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
                    customdeploy_smc_co_head_wht_calc_stlt: {
                        scriptmprd: 'customscript_smc_co_head_wht_calc_mprd',
                        deploymprd: 'customdeploy_smc_co_head_wht_calc_mprd'
                    }
                };
                return nameList[deploy];
            }

            pageInit(scriptContext) {
                this.currentRecord = scriptContext.currentRecord;
                this.setFieldPeriod();
            }
            validateField(scriptContext) {
                this.currentRecord = scriptContext.currentRecord;

                if (scriptContext.fieldId == 'custpage_subsidiary') {
                    this.setPeriod(false);
                }
                /*
                if (scriptContext.fieldId == 'custpage_period_type') {
                    const periodTypeValue = this.currentRecord.getValue({ fieldId: 'custpage_period_type' });
                    const startDateField = this.currentRecord.getField({ fieldId: 'custpage_start_date' });
                    const endDateField = this.currentRecord.getField({ fieldId: 'custpage_end_date' });
                    const accountingperiodField = this.currentRecord.getField({ fieldId: 'custpage_period' });
                    this.hiddenFields();
                    console.log("periodTypeValue", periodTypeValue)
                    if (periodTypeValue == "month") {
                        accountingperiodField.isDisplay = true;
                        this.setPeriod();
                    } else {
                        startDateField.isDisplay = true;
                        endDateField.isDisplay = true;
                    }
                }
                */
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
                        /*
                        if (!this.validateDates()) {
                            return false;
                        }
                        */
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
                    ["isyear", "is", "T"]
                ];

                if(isInit){
                    const urlObject = new URL(window.location.href);
                    const accoutingPeriodValue = urlObject.searchParams.get('accoutingPeriod');
                    filters.push('AND',['internalid', 'anyof',accoutingPeriodValue]);

                    console.log('urlObject :', 'urlObject')
                    console.log('accoutingPeriodValue :', 'accoutingPeriodValue')
                }

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
                const periodField = this.currentRecord.getField({ fieldId: 'custpage_period' });
                if (periodField) {
                    periodField.removeSelectOption({ value: null });
                    periods.forEach(period => {
                        const periodId = period.getValue({ name: 'internalid', summary: "GROUP" });
                        const periodName = period.getValue({ name: 'periodname', summary: "GROUP" });
                        periodField.insertSelectOption({ value: periodId, text: periodName });
                    });
                }
            }


            validateMandatoryFields() {
                const recordObj = this.currentRecord;
                //const periodTypeValue = this.currentRecord.getValue({ fieldId: 'custpage_period_type' });
                let mandatoryFields = [
                    'custpage_wht_process',
                    'custpage_wht_type'
                ];
                /*
                if (this.FEAT_SUBS) {
                    mandatoryFields.unshift('custpage_subsidiary');
                }
                if (periodTypeValue == "month") {
                    mandatoryFields.push('custpage_period');
                } else {
                    mandatoryFields.push('custpage_start_date');
                    mandatoryFields.push('custpage_end_date');
                }
                */
                mandatoryFields.push('custpage_period');
                const isFieldInvalid = (fieldId) => {
                    const value = recordObj.getValue({ fieldId });
                    console.log(fieldId, value)
                    if (value == 0 || !value) {
                        const fieldLabel = recordObj.getField({ fieldId }).label;
                        alert(`Ingrese un valor para: ${fieldLabel}`);
                        return true;
                    }
                    return false;
                };
                console.log("mandatoryFields", mandatoryFields)
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

            /*
            validateDates() {
                const { getValue, getField } = this.currentRecord;
                const periodType = getValue('custpage_period_type');
                if (periodType == "range") {
                    const startDate = getValue('custpage_start_date') ? format.parse({ value: getValue('custpage_start_date'), type: format.Type.DATE }) : null;
                    const endDate = getValue('custpage_end_date') ? format.parse({ value: getValue('custpage_end_date'), type: format.Type.DATE }) : null;

                    if (startDate && endDate && startDate > endDate) {
                        const startFieldLabel = getField({ fieldId: 'custpage_start_date' }).label;
                        const endFieldLabel = getField({ fieldId: 'custpage_end_date' }).label;
                        alert(`La ${startFieldLabel} debe ser igual o anterior a la ${endFieldLabel}`);
                        return false;
                    }
                }

                return true;
            }
            */
            validateSublist() {
                const recordObj = this.currentRecord;
                const numberLines = recordObj.getLineCount({ sublistId: 'custpage_results_list' });

                if (numberLines < 1) {
                    alert("No hay transacciones Filtradas");
                    return false;
                }

                const numApplieds = Array.from({ length: numberLines }).reduce((count, _, i) =>
                    count + (recordObj.getSublistValue({ sublistId: 'custpage_results_list', fieldId: 'apply', line: i }) ? 1 : 0), 0);

                if (numApplieds === 0) {
                    alert("No hay transacciones Seleccionadas");
                    return false;
                }

                return true;
            }



            setFieldPeriod() {
                //const fields = ['custpage_start_date', 'custpage_end_date', 'custpage_period'];
                //fields.forEach(id => this.currentRecord.getField({ fieldId: id }).isDisplay = false);
                const status = this.currentRecord.getValue('custpage_status');
                //const periodType = this.currentRecord.getValue('custpage_period_type');
                /*
                if (status == 1 || status == "1") {
                    /*
                    if (periodType == "range") {
                        this.currentRecord.getField({ fieldId: 'custpage_start_date' }).isDisplay = true;
                        this.currentRecord.getField({ fieldId: 'custpage_end_date' }).isDisplay = true;
                    } else {
                        this.setPeriod(isInit);
                        this.currentRecord.getField({ fieldId: 'custpage_period' }).isDisplay = true;
                    }
                    
                    this.setPeriod(isInit);
                    this.currentRecord.getField({ fieldId: 'custpage_period' }).isDisplay = true;
                }
                */
                const isInit = status == 1 || status == "1";
                this.setPeriod(isInit);
                this.currentRecord.getField({ fieldId: 'custpage_period' }).isDisplay = true;

            }


            validateExecution() {
                let mprd_scp = 'customscript_smc_co_head_wht_calc_mprd';
                let mprd_dep = 'customdeploy_smc_co_head_wht_calc_mprd';
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
                        title: 'Alerta',
                        message: 'Espere un momento por favor, el proceso se encuentra en curso.',
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
                    //form.startDate = currentRecord.getValue({ fieldId: 'custpage_start_date' });
                    //form.endDate = currentRecord.getValue({ fieldId: 'custpage_end_date' });
                    form.whtType = currentRecord.getValue({ fieldId: 'custpage_wht_type' });
                    //form.periodType = currentRecord.getValue({ fieldId: 'custpage_period_type' });
                    form.accoutingPeriod = currentRecord.getValue({ fieldId: 'custpage_period' });
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

                form.accoutingPeriod = periodlookup.periodname;

                // Creacion de Logs
                let idlog = '';

                let recordlog = record.create({
                    type: 'customrecord_smc_co_head_wht_cal_log'
                });
                console.log("form :", form)
                recordlog.setValue({ fieldId: 'custrecord_smc_co_hwht_log_subsi', value: form.subsidiary });
                //recordlog.setValue({ fieldId: 'custrecord_smc_co_hwht_log_start_date', value: new Date() });
                //recordlog.setValue({ fieldId: 'custrecord_smc_co_hwht_log_end_date', value: new Date() });
                recordlog.setValue({ fieldId: 'custrecord_smc_co_hwht_log_state', value: "Cargando datos" });
                recordlog.setValue({ fieldId: 'custrecord_smc_co_hwht_log_employee', value: runtime.getCurrentUser().id });
                recordlog.setValue({ fieldId: 'custrecord_smc_co_hwht_log_transactions', value: JSON.stringify(form.ids) });
                recordlog.setValue({ fieldId: 'custrecord_smc_co_hwht_log_process', value: form.typeProcess });
                recordlog.setValue({ fieldId: 'custrecord_smc_co_hwht_log_whttype', value: form.whtType });
                //recordlog.setValue({ fieldId: 'custrecord_smc_co_hwht_log_period_type', value: "" });
                recordlog.setValue({ fieldId: 'custrecord_smc_co_hwht_log_period', value: form.accoutingPeriod });
                recordlog.setValue({ fieldId: 'custrecord_smc_co_hwht_log_exect', value: form.executionType });
                idlog = recordlog.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });

                currentRecord.setValue({ fieldId: 'custpage_log_id', value: idlog, ignoreFieldChange: true });

                this.parameters = { idlog,idUser: runtime.getCurrentUser().id }
                console.log('idlog: ' + idlog);
                return true;
            }

            isValid(bool) {
                return (bool === "T" || bool === true);
            }

            getTranslations(country) {
                const translatedFields = {
                    "es": {
                        "LMRY_LOADING_DATA": "Cargando Datos",
                    },
                    "en": {
                        "LMRY_LOADING_DATA": "Loading data",
                    }
                }
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
