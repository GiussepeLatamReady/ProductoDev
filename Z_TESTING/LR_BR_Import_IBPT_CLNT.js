/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @Name LR_BR_Import_IBPT_CLNT.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 01/09/2024
 */
define(['N/runtime',
    'N/search',
    'N/record',
    'N/format',
    'N/ui/message',
    'N/url',
    'N/currentRecord',
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/error/LR_Error_LIB"],
    (runtime, search, record, format, message, urlApi, currentRecord, Lib_Error) => {

        const ScriptName = "LR_BR_Import_IBPT_CLNT.js";
        
        let DEPLOY_ID, handler;

        const pageInit = context => {
            const recordObj = context.currentRecord;
            DEPLOY_ID = recordObj.getValue('custpage_deploy_id');
            handler = new ClientUIManager({ deployid: DEPLOY_ID });
            
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
                let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
                language = language === "es" ? language : "en";
                this.transalations = this.getTranslations(language);
            }


            pageInit(scriptContext) {
                console.log("start")
            }
            validateField(scriptContext) {

                try {
                    this.currentRecord = scriptContext.currentRecord;

                    if (this.FEAT_SUBS) {
                        if (scriptContext.fieldId == 'custpage_subsidiary') {
                            this.setDataSubsidiary();
                        }
                    }
                    return true
                } catch (error) {
                    
                    Lib_Error.handleError({ title: "[validateField]", err, script: ScriptName });
                    return false;
                }
                
            }

            setDataSubsidiary() {
                const subsidiaryValue = this.currentRecord.getValue({ fieldId: "custpage_subsidiary" });
                if (subsidiaryValue) {
                    const { taxidnum, 'address.custrecord_lmry_addr_prov_acronym': uf } = search.lookupFields({
                        type: 'subsidiary',
                        id: subsidiaryValue,
                        columns: ['taxidnum', 'address.custrecord_lmry_addr_prov_acronym']
                    });
            
                    if (taxidnum) {
                        this.currentRecord.setValue('custpage_cnpj', taxidnum.replace(/\.|\/|\-/g, ''));
                    }
                    if (uf) {
                        this.currentRecord.setValue('custpage_uf', uf);
                    }
                }
            }
            
           
            saveRecord(context) {
                try {
                    this.currentRecord = context.currentRecord;
                    return this.validateMandatoryFields() && this.validateExecution() && this.createRecordLog() ;
                } catch (err) {            
                    return false;
                }
            }


            validateMandatoryFields() {
                const recordObj = this.currentRecord;
                let mandatoryFields = [
                    'custpage_subsidiary',
                    'custpage_cnpjf',
                    'custpage_uf'
                ];
                
                const isFieldInvalid = (fieldId) => {
                    const value = recordObj.getValue({ fieldId });
                    
                    if (value == 0 || !value) {
                        const fieldLabel = recordObj.getField({ fieldId }).label;
                        alert(`${this.transalations.LMRY_INPUT_DATA}:  ${fieldLabel}`);
                        return true;
                    }
                    return false; 
                };
                
                return !mandatoryFields.some(isFieldInvalid);
            }


            validateExecution() {
                let mprd_scp = 'customscript_lr_br_import_ibpt_mprd';
                let mprd_dep = 'customdeploy_lr_br_import_ibpt_mprd';
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
                        title: this.transalations.LMRY_ALERT_TITLE,
                        message: this.transalations.LMRY_ALERT_MESSAGE,
                        type: message.Type.INFORMATION,
                        duration: 8000
                    });
                    myMsg.show();
                    return false;
                }

                return true;
            }

            createRecordLog() {
                try {
                    
                    let currentRecord = this.currentRecord;
                    let form = {
                        ids: []
                    };
                    form.subsidiary = Number(currentRecord.getValue({ fieldId: 'custpage_subsidiary' })) || '';
                    form.itemType = currentRecord.getValue({ fieldId: 'custpage_entity_type' });
                    form.cnpj = currentRecord.getValue({ fieldId: 'custpage_cnpj' });
                    form.uf = currentRecord.getValue({ fieldId: 'custpage_uf' });
                    
                    // Creacion de Logs
                    let idlog = '';
    
                    let recordlog = record.create({
                        type: 'customrecord_lr_import_log_ibpt'
                    });
                    
                    recordlog.setValue({ fieldId: 'custrecord_lr_import_log_subsidiary', value: form.subsidiary });
                    recordlog.setValue({ fieldId: 'custrecord_lr_import_log_type', value: form.itemType });
                    recordlog.setValue({ fieldId: 'custrecord_lr_import_log_date', value: new Date() });
                    recordlog.setValue({ fieldId: 'custrecord_lr_import_log_cnpj', value: form.cnpj});
                    recordlog.setValue({ fieldId: 'custrecord_lr_import_log_uf', value: form.uf});
                    recordlog.setValue({ fieldId: 'custrecord_lr_import_log_user', value: runtime.getCurrentUser().id });
                    recordlog.setValue({ fieldId: 'custrecord_lr_import_log_taxes', value: JSON.stringify(form.ids) });
                    recordlog.setValue({ fieldId: 'custrecord_lr_import_log_status', value: "Loading data" });
                    idlog = recordlog.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
    
                    currentRecord.setValue({ fieldId: 'custpage_log_id', value: idlog, ignoreFieldChange: true });

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
                        "LMRY_ALERT_TITLE":"Alerta",
                        "LMRY_ALERT_MESSAGE":"Espere un momento por favor, el proceso se encuentra en curso.",
                        "LMRY_INPUT_DATA":"Ingrese un valor para :"
                    },
                    "en": {
                        "LMRY_ALERT_TITLE":"Alert",
                        "LMRY_ALERT_MESSAGE":"Please wait a moment, the process is in progress.",
                        "LMRY_INPUT_DATA":"Enter a value for :"
                    }
                }
                return translatedFields[country];
            }

        }

        return { pageInit, validateField, saveRecord, reload };
    });
