/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_AR_Massive_Gene_Agip_STLT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */
define([
    'N/log',
    'N/search',
    'N/redirect',
    'N/runtime',
    'N/ui/serverWidget',
    'N/url',
    'N/task',
    'SuiteBundles/Bundle 37714/Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'
],
    (log, search, redirect, runtime, serverWidget, url, task, LibraryMail) => {
        const CLIENT_SCRIPT_PATH = "./LMRY_AR_Massive_Gene_Agip_CLNT_V2.1.js";

        const onRequest = (context) => {
            const scriptContext = {
                scriptId: runtime.getCurrentScript().id,
                deploymentId: runtime.getCurrentScript().deploymentId,
                params: context.request.parameters,
                method: context.request.method,
                response: context.response
            };

            const handler = new SuiteletFormManager({
                params: scriptContext.params,
                method: scriptContext.method
            });

            scriptContext.method === "GET" ? processGETRequest(handler, scriptContext) : processPOSTRequest(handler, scriptContext);
        };

        const processGETRequest = (handler, { params, response }) => {
            try {

                
                //const status = Number(params.status);
                const {form,active} = handler.createForm();
                log.error("active",active)
                if (active) {
                    handler.loadFormValues();
                    handler.createTransactionSublist();
                    handler.loadProcessRecord();

                    form.clientScriptModulePath = CLIENT_SCRIPT_PATH;
                }
                
                response.writePage(form);

            } catch (err) {
                log.error("[ onRequest - GET ]", err);
            }
        };

        const processPOSTRequest = (handler, { params, scriptId, deploymentId }) => {
            try {
                const parameters = {
                    state: params.custpage_log_id,
                    user: runtime.getCurrentUser().id
                };

                handler.runMapReduce(parameters);
                handler.toLogSuitelet();

            } catch (err) {
                log.error("[ onRequest - POST ]", err);
            }
        };

        class SuiteletFormManager {
            constructor(options) {
                this.params = options.params || {};
                this.method = options.method;
                this.FEAT_SUBS = this.isValid(runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' }));
                this.FEAT_CALENDAR = this.isValid(runtime.isFeatureInEffect({ feature: 'MULTIPLECALENDARS' }));
                this.FEAT_LOCALIZATION = 100;
                let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
                language = language === "es" ? language : "en";
                this.translations = this.getTranslations(language);
                this.subsidiaries = [];
            }


            createForm() {

                this.form = serverWidget.createForm({
                    title: this.translations.LMRY_TITLE_FORM
                });

                if (!this.areThereSubsidiaries()) {
                    this.addNoSubsidiaryMessage();
                    return {form: this.form , active:false};
                }

                this.setupForm();

                return {form: this.form , active:true};
            }

            addNoSubsidiaryMessage() {
                let myInlineHtml = this.form.addField({
                    id: 'custpage_lmry_v_message',
                    label: this.translations.LMRY_MESSAGE,
                    type: serverWidget.FieldType.INLINEHTML
                }).updateLayoutType({
                    layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
                }).updateBreakType({
                    breakType: serverWidget.FieldBreakType.STARTCOL
                });

                const messageHtml = `
                <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f7f7f7;
                                margin: 0;
                                padding: 0;
                            }
                            .container {
                                width: 100%;
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                                border-top: 2px solid red;
                            }
                            .message {
                                color: #555555;
                                font-size: 16px;
                                line-height: 1.5;
                            }
                            .message a {
                                color: #007bff;
                                text-decoration: none;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <p class="message">
                                ${this.translations.LMRY_MESSAGE_LICENSE}. <br>
                                ${this.translations.LMRY_MESSAGE_CONTACT} <a href="https://www.Latamready.com" target="_blank">www.Latamready.com</a>
                            </p>
                        </div>
                    </body>
                </html>`;
                myInlineHtml.defaultValue = messageHtml;
            }

            setupForm() {
                this.form.addButton({
                    label: this.translations.LMRY_VIEW_LOG,
                    id: "custpage_btn_log",
                    functionName: "backLog"
                });
                this.addGroup('mainGroup', this.translations.LMRY_PRIMARY_INFO);
                if (this.FEAT_SUBS) {
                    this.addSelectField('custpage_subsidiary', this.translations.LMRY_SUBSIDIARY, 'mainGroup').isMandatory();
                }
                this.addSelectField('custpage_period', this.translations.LMRY_PERIOD, 'mainGroup').isMandatory();
                this.addSelectField('custpage_entity_type', this.translations.LMRY_ENTITY_TYPE, 'mainGroup').isMandatory();

                this.addSimpleField('custpage_log_id', 'Log ID','mainGroup').isHidden();
                this.addSimpleField('custpage_deploy_id', 'Deploy ID', 'mainGroup').setDefautValue(runtime.getCurrentScript().deploymentId).isHidden();

                this.addFormButtons();
            }

            addGroup(groupId, label) {
                this.form.addFieldGroup({
                    id: groupId,
                    label: label
                });
            }

            addCustomField(id, type, label, container) {
                let field = this.form.addField({
                    id: id,
                    type: type,
                    label: label,
                    container: container
                });
                return {
                    field: field,
                    isMandatory: function () {
                        this.field.isMandatory = true;
                        return this;
                    },
                    setHelpText: function (help) {
                        this.field.setHelpText(help);
                        return this;
                    },
                    isHidden: function () {
                        this.field.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                        return this;
                    },
                    setDefautValue: function (value) {
                        this.field.defaultValue = value;
                        return this;
                    }
                };
            }


            addSelectField(id, label, container) {
                return this.addCustomField(id, serverWidget.FieldType.SELECT, label, container).setHelpText({ help: id });
            }
            addHtmlField(id, label, container) {
                return this.addCustomField(id, serverWidget.FieldType.INLINEHTML, label, container).setHelpText({ help: id });
            }

            addSimpleField(id, label, container) {
                return this.addCustomField(id, serverWidget.FieldType.TEXT, label, container).setHelpText({ help: id });
            }

            addFormButtons() {
                this.form.addSubmitButton({ label: this.translations.LMRY_GENERATE });
                this.form.addResetButton({ label: this.translations.LMRY_RESTART });
            }


            areThereSubsidiaries() {
                let anySubsidiaryActive = false; 
                
               
                if (this.FEAT_SUBS) {
                    const allLicenses = LibraryMail.getAllLicenses();
                    this.subsidiaries = this.getSubsidiaries();
            
                    
                    this.subsidiaries.forEach(subsidiary => {
                        const licenses = allLicenses[subsidiary.value] || [];
                        subsidiary.active = LibraryMail.getAuthorization(this.FEAT_LOCALIZATION, licenses);
                        if (subsidiary.active) {
                            anySubsidiaryActive = true;
                        }
                    });
                } else {
                
                    const licenses = LibraryMail.getLicenses(1);
                    const isAuthorized = LibraryMail.getAuthorization(this.FEAT_LOCALIZATION, licenses);
                    this.subsidiaries = [{
                        value: 1,
                        text: 'Company',
                        active: isAuthorized
                    }];
                    anySubsidiaryActive = isAuthorized;
                }
                log.error("anySubsidiaryActive",anySubsidiaryActive)
                return anySubsidiaryActive;
            }
            


            getSubsidiaries() {

                let searchSubs = search.create({
                    type: search.Type.SUBSIDIARY,
                    filters: [['isinactive', 'is', 'F'], 'AND', ['country', 'is', 'AR']],
                    columns: ['internalid', 'name']
                });

                return searchSubs.run().getRange(0, 1000).map(result => ({
                    value: result.getValue('internalid'),
                    text: result.getValue('name'),
                    active: false
                }));
            }

            createTransactionSublist() {
                this.form.addTab({
                    id: 'tab_results',
                    label: this.translations.LMRY_RESULTS
                });

                this.sublist = this.form.addSublist({
                    id: 'custpage_results_list',
                    label: this.translations.LMRY_RESULTS,
                    tab: 'tab_results',
                    type: serverWidget.SublistType.LIST
                });

                
                const fields = [
                    { id: "number", label: this.translations.LMRY_NUMBER, type: serverWidget.FieldType.TEXT },
                    { id: "subsidiary", label: this.translations.LMRY_SUBSIDIARY, type: serverWidget.FieldType.TEXT },
                    { id: "datecreated", label: this.translations.LMRY_CREATION_DATE_LABEL, type: serverWidget.FieldType.TEXT },
                    { id: "created_by", label: this.translations.LMRY_CREATED_BY_LABEL, type: serverWidget.FieldType.TEXT },
                    { id: "period", label: this.translations.LMRY_PERIOD, type: serverWidget.FieldType.TEXT },
                    { id: "details", label: this.translations.LMRY_DETAILS, type: serverWidget.FieldType.TEXTAREA },
                    { id: "result", label: this.translations.LMRY_RESULTS, type: serverWidget.FieldType.TEXT},
                    { id: "description", label: this.translations.LMRY_DESCRIPTION, type: serverWidget.FieldType.TEXT },
                    { id: "status", label: this.translations.LMRY_STATUS, type: serverWidget.FieldType.TEXT }
                ];


                fields.forEach(fieldInfo => {
                    let field = this.sublist.addField(fieldInfo);
                    if (fieldInfo.displayType) {
                        field.updateDisplayType({ displayType: fieldInfo.displayType });
                    }
                });

                this.sublist.addButton({
                    id: "custpage_btnrefresh",
                    label: this.translations.LMRY_REFRESH,
                    functionName: 'reload'
                });

                return this.sublist;
            }

            loadFormValues() {
                if (this.FEAT_SUBS) {
                    this.fillSubsidiaries();
                }
                this.fillEntityType();
            }

            fillSubsidiaries() {
                let subsidiaryField = this.form.getField({ id: 'custpage_subsidiary' });
                if (subsidiaryField) {
                    subsidiaryField.addSelectOption({ value: 0, text: '&nbsp;' });
                    this.subsidiaries?.filter(sub => sub.active).forEach(activeSub => {
                        subsidiaryField.addSelectOption({ value: activeSub.value, text: activeSub.text });
                    });
                }
            }

            fillEntityType() {
                let entityTypeField = this.form.getField({ id: 'custpage_entity_type' });
                entityTypeField.addSelectOption({ value: 0, text: '&nbsp;' });
                entityTypeField.addSelectOption({ value: "customer", text: this.translations.LMRY_CUSTOMER });
                entityTypeField.addSelectOption({ value: "vendor", text: this.translations.LMRY_VENDOR });
                return entityTypeField;
            } 

            loadProcessRecord() {


                let data = this.getRecords();

                let sublist = this.form.getSublist({ id: 'custpage_results_list' });
                const count = data.length;
                data.forEach((form, i) => {
                    const { id, subsidiary, created, employee, period, description, status } = form;
                    const setSublistValue = (colId, value) => sublist.setSublistValue({ id: colId, line: i, value });
                    const recordUrl = url.resolveRecord({ recordType: "customrecord_lmry_ar_massive_gener_agip", recordId: id, isEditMode: false });
                    const urlID = `
                    <a href="${recordUrl}" target="_blank" style="text-decoration: none; color: inherit;">
                        <div style="display: grid; place-items: center; background: white; border-radius: 6px; transition: background-color 0.3s; border: 0.5px solid #bbd1e9;" onmouseover="this.style.backgroundColor='#bbd1e9'" onmouseout="this.style.backgroundColor='white';">
                            <div style="color: color:#424950; font-size: 14px;">${this.translations.LMRY_DETAILS}</div>
                        </div>
                    </a>`;










                    setSublistValue("number",id)
                    setSublistValue("subsidiary",subsidiary)
                    setSublistValue("datecreated",created)
                    setSublistValue("created_by",employee)
                    setSublistValue("period",period)
                    setSublistValue("details",urlID)
                    setSublistValue("description",description)
                    let statusResult = "Loading data";
                    switch (status) {
                        case "Finish":
                            statusResult = this.translations.LMRY_FINISH;
                            break;
                        case "Loading data":
                            statusResult = this.translations.LMRY_LOADING_DATA;
                            break;
                        case "An error occurred":
                            statusResult = this.translations.LMRY_ERROR;
                            break;
                        case "Processing":
                            statusResult = this.translations.LMRY_PROCESING;
                            break;
                        default:
                            statusResult = this.translations.LMRY_LOADING_DATA;
                    }
                    setSublistValue("status",statusResult)

                    // Falata detalles y resultados
                })

                if (data.length) {
                    sublist.label = `${sublist.label} (${data.length})`;
                }

            }
 
            getRecords() {
                let data = [];

                let search_log = search.create({
                    type: "customrecord_lmry_ar_massive_gener_agip",
                    filters:
                        [
                            ["isinactive", "is", "F"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", sort: search.Sort.DESC }),
                            "custrecord_lmry_ar_gen_agip_subsidiary",
                            "created",
                            "custrecord_lmry_ar_gen_agip_user",
                            "custrecord_lmry_ar_gen_agip_period",
                            "custrecord_lmry_ar_gen_agip_details",
                            "custrecord_lmry_ar_gen_agip_status"
                        ]
                });
                let pageData = search_log.runPaged({ pageSize: 1000 });
                if (pageData) {
                    pageData.pageRanges.forEach(function (pageRange) {
                        let page = pageData.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            let columns = result.columns;
                            log.error("result",result);
                            let formublist = {};
                            formublist.id = result.getValue(columns[0]) || ' ';
                            formublist.subsidiary = result.getText(columns[1]) || ' ';
                            formublist.created = result.getValue(columns[2]) || ' ';
                            formublist.employee = result.getText(columns[3]) || ' ';
                            formublist.period = result.getText(columns[4]) || ' ';
                            formublist.description = result.getValue(columns[5]) || ' ';
                            formublist.status = result.getValue(columns[6]) || ' ';

                            data.push(formublist);
                        });
                    });
                }

                return data;
            }


            getRedirectParams() {
                let params = this.params;
                return {
                    subsidiary: params.custpage_subsidiary || '',
                    whtType: params.custpage_wht_type || '',
                    accoutingPeriod: params.custpage_period || '',
                    typeProcess: params.custpage_wht_process || '',
                    status: '1'
                };
            }

            getTranslations(country) {
                const translatedFields = {
                    "es": {
                        "LMRY_MESSAGE": "Mensaje",
                        "LMRY_MESSAGE_LICENSE": "AVISO: Actualmente la licencia para este módulo está vencida, por favor contacte al equipo comercial de LatamReady.",
                        "LMRY_MESSAGE_CONTACT": "También puedes contactar con nosotros a",
                        "LMRY_PRIMARY_INFO": "Informacion primaria",
                        "LMRY_SUBSIDIARY": "Subsidiaria",
                        "LMRY_VIEW_LOG": "Ver registro",
                        "LMRY_ENTITY_TYPE": "Tipo de entidad",
                        "LMRY_VENDOR": "Proveedor",
                        "LMRY_CUSTOMER": "Cliente",
                        "LMRY_TITLE_FORM": "LatamReady - Generación masiva AGIP",
                        "LMRY_RESTART": "Reiniciar",
                        "LMRY_GENERATE": "Generar",
                        "LMRY_RESULTS": "Resultados",
                        "LMRY_RESULT": "Resultado",
                        "LMRY_INTERNALID": "ID Interno",
                        "LMRY_CREATION_DATE_LABEL": "Fecha de Creación",
                        "LMRY_CREATED_BY_LABEL": "Creado por",
                        "LMRY_PERIOD": "Periodo",
                        "LMRY_DESCRIPTION": "Descripción",
                        "LMRY_STATUS": "Estado",
                        "LMRY_REFRESH": "Actualizar",
                        "LMRY_FINISH": "Finalizado",
                        "LMRY_LOADING_DATA": "Cargando datos",
                        "LMRY_ERROR": "Ocurrió un error",
                        "LMRY_PROCESING": "Procesando",
                        "LMRY_DESCRIPTION": "Descripción",
                        "LMRY_DETAILS": "Detalles",
                        "LMRY_NUMBER":"Posicion",
                        "LMRY_RECORD":"Registro",
                        "LMRY_VIEW":"Ver"
                    },
                    "en": {
                        "LMRY_MESSAGE": "Message",
                        "LMRY_MESSAGE_LICENSE": "NOTICE: Currently the license for this module is expired, please contact the LatamReady sales team.",
                        "LMRY_MESSAGE_CONTACT": "You can also contact us through",
                        "LMRY_PRIMARY_INFO": "Primary information",
                        "LMRY_SUBSIDIARY": "Subsidiary",
                        "LMRY_VIEW_LOG": "View Log",
                        "LMRY_ENTITY_TYPE": "Entity type",
                        "LMRY_VENDOR": "Vendor",
                        "LMRY_CUSTOMER": "Customer",
                        "LMRY_TITLE_FORM": "LatamReady - Massive generation AGIP",
                        "LMRY_RESTART": "Restart",
                        "LMRY_GENERATE": "Generate",
                        "LMRY_RESULTS": "Results",
                        "LMRY_RESULT": "Result",
                        "LMRY_INTERNALID": "Internal ID",
                        "LMRY_CREATION_DATE_LABEL": "Creation Date",
                        "LMRY_CREATED_BY_LABEL": "Created By",
                        "LMRY_PERIOD": "Period",
                        "LMRY_DESCRIPTION": "Description",
                        "LMRY_STATUS": "Status",
                        "LMRY_REFRESH": "Refresh",
                        "LMRY_FINISH": "Finished",
                        "LMRY_LOADING_DATA": "Loading Data",
                        "LMRY_ERROR": "An Error Occurred",
                        "LMRY_PROCESING": "Processing",
                        "LMRY_DESCRIPTION": "Description",
                        "LMRY_DETAILS": "Details",
                        "LMRY_NUMBER":"Position",
                        "LMRY_RECORD":"Record",
                        "LMRY_VIEW":"View"
                    }  
                }
                return translatedFields[country];
            }

            
            toLogSuitelet() {
                redirect.toSuitelet({
                    scriptId: 'customscript_lmry_ar_mass_gene_agip_stlt',
                    deploymentId: 'customdeploy_lmry_ar_mass_gene_agip_stlt'
                });
            }

            runMapReduce({ state, user }) {
                const licenses = this.FEAT_SUBS
                    ? LibraryMail.getAllLicenses()[this.params.custpage_subsidiary]
                    : LibraryMail.getLicenses(1);

                const featureLatam = LibraryMail.getAuthorization(this.FEAT_LOCALIZATION, licenses);
                const parameters = featureLatam ? {
                    custscript_lmry_ar_mass_gen_agip_user: user,
                    custscript_lmry_ar_mass_gen_agip_state: state
                } : {};

                log.error("state",state)
                log.error("user",user)
                task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_lmry_ar_mass_gene_agip_mprd',
                    deploymentId: 'customdeploy_lmry_ar_mass_gene_agip_mprd',
                    params: parameters
                }).submit();
            }


            isValid(bool) {
                return (bool === "T" || bool === true);
            }
            setParams(parameters){
                this.params = parameters;
            }

        }

        return { onRequest, SuiteletFormManager };
    });
