/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_CO_Header_WHT_calculation_CLNT_LBRY_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */
define([
    'N/runtime',
    'N/search',
    'N/record',
    'N/format',
    'N/ui/message',
    'SuiteBundles/Bundle 37714/Latam_Library/LMRY_Log_LBRY_V2.0',
], function (
    runtime,
    search,
    record,
    format,
    message,
    lbryLog,
) {
    const ScriptName = 'LMRY_MX_Reverse_Cancellation_CLNT_LBRY_V2.1.js';
    class ClntHandler {
        constructor(options) {
            this.FEAT_SUBS = this.isValid(runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' }));
            const language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
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
            this.hiddenFields();
        }
        validateField(scriptContext) {
            this.currentRecord = scriptContext.currentRecord;

            if (scriptContext.fieldId == 'custpage_period_type') {
                const periodTypeValue = this.currentRecord.getValue({ fieldId: 'custpage_period_type' });
                const startDateField = this.currentRecord.getField({ fieldId: 'custpage_start_date' });
                const endDateField = this.currentRecord.getField({ fieldId: 'custpage_end_date' });
                const accountingperiodField = this.currentRecord.getField({ fieldId: 'custpage_period' });
                this.hiddenFields();
                if (periodTypeValue == "month") {
                    accountingperiodField.isDisplay = true;
                    this.setPeriod();
                } else {
                    startDateField.isDisplay = true;
                    endDateField.isDisplay = true;
                }
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

                    if (!this.validateDates()) {
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
                handleError('[ saveRecord ]', err);
                return false;
            }
            return true;
        }

        setPeriod() {
            if (this.FEAT_SUBS) {
                // Filtros básicos consolidados
                let filters = [
                    ['isadjust', 'is', 'F'],
                    'AND',
                    ["isquarter", "is", "F"],
                    'AND',
                    ["isyear", "is", "F"]
                ];

                const subsidiary = this.currentRecord.getValue({ fieldId: 'custpage_subsidiary' });
                const { fiscalcalendar } = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: subsidiary,
                    columns: ['fiscalcalendar']
                });

                // Añadir filtro de fiscalcalendar si está presente
                if (fiscalcalendar && fiscalcalendar.length > 0) {
                    filters.push(['fiscalcalendar', 'anyof', fiscalcalendar[0].value]);
                }
            }
            // Creación de la búsqueda de periodos
            const periodSearch = search.create({
                type: "accountingperiod",
                filters: filters,
                columns: [
                    "internalid",
                    "periodname",
                    { name: "startdate", sort: search.Sort.ASC }
                ].map(name => search.createColumn({ name, summary: "GROUP" }))
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
            const periodTypeValue = this.currentRecord.getValue({ fieldId: 'custpage_period_type' });
            let mandatoryFields = [
                'custpage_wth_process',
                'custpage_wth_type'
            ];

            if (this.FEAT_SUBS) {
                mandatoryFields.unshift('custpage_subsidiary');
            }
            if (periodTypeValue == "month") {
                mandatoryFields.push('custpage_period');
            } else {
                mandatoryFields.push('custpage_start_date');
                mandatoryFields.push('custpage_end_date');
            }
            const isFieldInvalid = (fieldId) => {
                const value = recordObj.getValue({ fieldId });
                if (value == 0 || !value) {
                    const fieldLabel = recordObj.getField({ fieldId }).label;
                    alert(`Ingrese un valor para: ${fieldLabel}`);
                    return true;
                }
                return false;
            };
            return !mandatoryFields.some(isFieldInvalid);
        }

        validateDates() {
            let recordObj = this.currentRecord;
            let startDate = recordObj.getValue('custpage_start_date');
            if (startDate) {
                startDate = format.parse({ value: startDate, type: format.Type.DATE });
            }
            let endDate = recordObj.getValue('custpage_end_date');
            if (endDate) {
                endDate = format.parse({ value: endDate, type: format.Type.DATE });

                if (startDate > endDate) {
                    // The date in "{1}" must be on or before the date in "{2}".
                    let fieldStartDate = recordObj.getField({ fieldId: 'custpage_start_date' });
                    let fieldEndDate = recordObj.getField({ fieldId: 'custpage_end_date' });
                    alert(`La ${fieldStartDate.label} debe ser igual o anterior a la ${fieldEndDate.label}`);
                    return false;
                }
            }
            return true;
        }

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

        validateSublist() {
            let recordObj = this.currentRecord;
            let numberLines = recordObj.getLineCount({ sublistId: 'custpage_results_list' });
            if (numberLines < 1) {
                // No transactions selected.
                alert("No hay transacciones Seleccionadas");
                return false;
            }

            return true;
        }



        hiddenFields() {

            const fields = ['custpage_start_date', 'custpage_end_date', 'custpage_period'];
            fields.forEach(id => this.currentRecord.getField({ fieldId: id }).isDisplay = false);
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


        createRecordLog() {
            let currentRecord = this.currentRecord;
            let form = {
                ids: []
            };


            form.subsidiary = Number(currentRecord.getValue({ fieldId: 'custpage_subsidiary' })) || '';
            form.typeProcess= currentRecord.getValue({ fieldId: 'custpage_wth_process' });
            form.startDate = currentRecord.getValue({ fieldId: 'custpage_start_date' });
            form.endDate = currentRecord.getValue({ fieldId: 'custpage_end_date' });
            form.whtType = currentRecord.getValue({ fieldId: 'custpage_wth_type' });
            form.periodType = currentRecord.getValue({ fieldId: 'custpage_period_type' });
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


            // Creacion de Logs
            let idlog = '';

            let recordlog = record.create({
                type: 'customrecord_lmry_co_head_wht_cal_log'
            });
            console.log("form :", form)
            recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_subsi', value: form.subsidiary });
            recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_start_date', value: form.startDate });
            recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_end_date', value: form.endDate });
            recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_state', value: this.translations.LMRY_LOADING_DATA});
            recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_employee', value: runtime.getCurrentUser().id });
            recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_transactions', value: JSON.stringify(form.ids) });
            recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_process', value: form.typeProcess });
            recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_whttype', value: form.whtType });
            recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_period_type', value: form.periodType });
            recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_period', value: form.accoutingPeriod });
            recordlog.setValue({ fieldId: 'custrecord_lmry_co_hwht_log_exect', value: form.executionType });
            idlog = recordlog.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });

            currentRecord.setValue({ fieldId: 'custpage_log_id', value: idlog, ignoreFieldChange: true });

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

    }


    function handleError(functionName, err) {
        console.error(functionName, err);
        lbryLog.doLog({ title: functionName, message: err, relatedScript: ScriptName });
        alert(functionName + '\n' + JSON.stringify({ name: err.name, message: err.message }));
    }

    return {
        ClntHandler: ClntHandler
    };
});
