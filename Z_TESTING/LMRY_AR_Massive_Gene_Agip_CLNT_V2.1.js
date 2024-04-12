/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @Name LMRY_CO_Header_WHT_calculation_CLNT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/04/2024
 */
define(['N/runtime',
    'N/search',
    'N/record',
    'N/format',
    'N/ui/message',
    'SuiteBundles/Bundle 37714/Latam_Library/LMRY_Log_LBRY_V2.0',
    'N/url',
    'N/currentRecord',
    'SuiteBundles/Bundle 37714/Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],
    (runtime, search, record, format, message, lbryLog, urlApi, currentRecord, LibraryMail) => {
        const STLT_ID = 'customscript_lmry_ar_mass_gene_agip_stlt';
        let DEPLOY_ID, handler;

        const pageInit = context => {
            const recordObj = context.currentRecord;
            DEPLOY_ID = recordObj.getValue('custpage_deploy_id');
            handler = new ClientUIManager({ deployid: DEPLOY_ID });
            console.log("pageInit clnt")
            handler.pageInit(context);
        };

        const validateField = context => handler.validateField(context);

        const saveRecord = context => handler.saveRecord(context);

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
            constructor() {
                this.FEAT_SUBS = this.isValid(runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' }));
                this.FEAT_CALENDAR = this.isValid(runtime.isFeatureInEffect({ feature: 'MULTIPLECALENDARS' })); 
            }


            pageInit(scriptContext) {
                if (!this.FEAT_SUBS) {
                    this.setFieldPeriod();
                }
            }
            validateField(scriptContext) {
                this.currentRecord = scriptContext.currentRecord;

                if (this.FEAT_SUBS) {
                    if (scriptContext.fieldId == 'custpage_subsidiary') {
                        this.setFieldPeriod();
                    }
                }
                      
                return true
            }
            /*
            saveRecord(context) {
                try {
                    this.currentRecord = context.currentRecord;

                    if (!this.validateMandatoryFields()) {
                        return false;
                    }

                    if (!this.validateExecution()) {
                        return false;
                    }

                    if (!this.createRecordLog()) {
                        return false;
                    }

                    if (!this.validateFeatureMassive()) {
                        return false;
                    }

                } catch (err) {
                    this.handleError('[ saveRecord ]', err);
                    return false;
                }

                return true;
            }
            */
            saveRecord(context) {
                try {
                    this.currentRecord = context.currentRecord;
                    return this.validateMandatoryFields() && this.validateExecution() && this.createRecordLog() && this.validateFeatureMassive();
                } catch (err) {
                    this.handleError('[ saveRecord ]', err);
                    return false;
                }
            }

            setPeriod() {
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

                    console.log("fiscalcalendar:",fiscalcalendar)

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
                    'custpage_period',
                    'custpage_entity_type'
                ];
                
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


            setFieldPeriod() {
                this.setPeriod();
                this.currentRecord.getField({ fieldId: 'custpage_period' }).isDisplay = true;
            }


            validateExecution() {
                let mprd_scp = 'customscript_lmry_ar_mass_gene_agip_mprd';
                let mprd_dep = 'customdeploy_lmry_ar_mass_gene_agip_mprd';
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

            validateFeatureMassive(){
                const subsidiary = this.currentRecord.getValue({ fieldId: 'custpage_subsidiary' });
                const licenses = this.FEAT_SUBS
                    ? LibraryMail.getAllLicenses()[subsidiary]
                    : LibraryMail.getLicenses(1);

                return LibraryMail.getAuthorization(1092, licenses)
            }
            createRecordLog() {
                try {
                    console.log(' createRecordLog start');
                    let currentRecord = this.currentRecord;
                    let form = {
                        ids: []
                    };
    
    
    
                    form.subsidiary = Number(currentRecord.getValue({ fieldId: 'custpage_subsidiary' })) || '';
                    form.entityType = currentRecord.getValue({ fieldId: 'custpage_entity_type' });
                    form.accoutingPeriod = currentRecord.getValue({ fieldId: 'custpage_period' });
                    
    
                    // Creacion de Logs
                    let idlog = '';
    
                    let recordlog = record.create({
                        type: 'customrecord_lmry_ar_massive_gener_agip'
                    });
                    console.log("form :", form)
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ar_gen_agip_subsidiary', value: form.subsidiary });
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ar_gen_agip_entity_type', value: form.entityType });
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ar_gen_agip_period', value: form.accoutingPeriod });
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ar_gen_agip_user', value: runtime.getCurrentUser().id });
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ar_gen_agip_entities', value: JSON.stringify(form.ids) });
                    recordlog.setValue({ fieldId: 'custrecord_lmry_ar_gen_agip_status', value: "Loading data" });
                    idlog = recordlog.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
    
                    currentRecord.setValue({ fieldId: 'custpage_log_id', value: idlog, ignoreFieldChange: true });
    
                    this.parameters = { idlog, idUser: runtime.getCurrentUser().id }
                    console.log('idlog: ' + idlog);
                    return true;
                } catch (error) {
                    console.log('Error', error)
                   return false;
                }
                
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

        return { pageInit, validateField, saveRecord, reload };
    });
