/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_AR_Wht_Send_Email_STLT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 18/07/2024
 */
define([
    'N/log',
    'N/search',
    'N/redirect',
    'N/runtime',
    'N/ui/serverWidget',
    'N/url',
    'N/task',
    "../../Latam Tools/Router/LMRY_AR_Library_ROUT",
    "../../Constants/LMRY_AR_Features_CONST"
],
    (log, search, redirect, runtime, serverWidget, url, task,Router_LBRY,Features) => {
        const CLIENT_SCRIPT_PATH = "./LMRY_AR_Wht_Send_Email_CLNT_V2.1.js";
        const { Error_LBRY, Licenses_LBRY } = Router_LBRY;
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
                this.addDateField('custpage_period_start', this.translations.LMRY_PERIOD_START, 'mainGroup').isMandatory();
                this.addDateField('custpage_period_end', this.translations.LMRY_PERIOD_END, 'mainGroup').isMandatory();
                this.addCheckField('custpage_view_sent', this.translations.LMRY_PERIOD_END, 'mainGroup').isMandatory();
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

            addDateField(id, label, container) {
                return this.addCustomField(id, serverWidget.FieldType.DATE, label, container).setHelpText({ help: id });
            }

            addCheckField(id, label, container) {
                return this.addCustomField(id, serverWidget.FieldType.CHECKBOX, label, container).setHelpText({ help: id });
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
                    this.subsidiaries = this.getSubsidiaries();
                    this.subsidiaries.forEach(subsidiary => {
                        
                        subsidiary.active = this.isFeatureActive(Features.AR_BASIC_LOCALIZATION,subsidiary.value);
                        if (subsidiary.active) {
                            anySubsidiaryActive = true;
                        }
                    });
                } else { // COMPROBAR
                    const isAuthorized = this.isFeatureActive(Features.AR_BASIC_LOCALIZATION,"1");;
                    this.subsidiaries = [{
                        value: 1,
                        text: 'Company',
                        active: isAuthorized
                    }];
                    anySubsidiaryActive = isAuthorized;
                }
            
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
                    { id: "apply", label: this.translations.LMRY_NUMBER, type: serverWidget.FieldType.TEXT },
                    { id: "subsidiary", label: this.translations.LMRY_SUBSIDIARY, type: serverWidget.FieldType.TEXT },
                    { id: "datecreated", label: this.translations.LMRY_CREATION_DATE_LABEL, type: serverWidget.FieldType.TEXT },
                    { id: "created_by", label: this.translations.LMRY_CREATED_BY_LABEL, type: serverWidget.FieldType.TEXT },
                    { id: "period", label: this.translations.LMRY_PERIOD, type: serverWidget.FieldType.TEXT },
                    { id: "summary", label: this.translations.LMRY_SUMMARY, type: serverWidget.FieldType.TEXTAREA },
                    { id: "details", label: this.translations.LMRY_DETAILS, type: serverWidget.FieldType.TEXTAREA },
                    { id: "result", label: this.translations.LMRY_RESULTS, type: serverWidget.FieldType.TEXTAREA},
                    { id: "status", label: this.translations.LMRY_STATUS, type: serverWidget.FieldType.TEXT }
                ];


                fields.forEach(fieldInfo => {
                    let field = this.sublist.addField(fieldInfo);
                    if (fieldInfo.displayType) {
                        field.updateDisplayType({ displayType: fieldInfo.displayType });
                    }
                });

                this.sublist.addRefreshButton();

                return this.sublist;
            }

            loadFormValues() {
                if (this.FEAT_SUBS) {
                    this.fillSubsidiaries();
                }
                this.fillPeriods();
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

            fillPeriods() {

                const nowDate = new Date();
                let startPeriod = this.form.getField({ id: 'custpage_period_start' });
                let endPeriod = this.form.getField({ id: 'custpage_period_end' });
                
                startPeriod.defaultValue = nowDate;
                endPeriod.defaultValue = nowDate;
            } 

            loadProcessRecord() {


                let data = this.getRecords();

                let sublist = this.form.getSublist({ id: 'custpage_results_list' });
                const count = data.length;
                data.forEach((form, i) => {
                    const { id, subsidiary, created, employee, period, summary, status, urlFile } = form;
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
                    setSublistValue("summary",this.getSummary(summary));
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

                    if (urlFile) {
                            const htmlUrlFile = `
                            <a href="${urlFile}" target="_blank" style="text-decoration: none; color: inherit;">
                                <div style="display: grid; place-items: center; background: white; border-radius: 6px; transition: background-color 0.3s; border: 0.5px solid #b3ecae;" onmouseover="this.style.backgroundColor='#b3ecae'" onmouseout="this.style.backgroundColor='white';">
                                    <div style="color: color:#424950; font-size: 14px;">${"Response"}</div>
                                </div>
                            </a>
                            `;
                        setSublistValue("result", htmlUrlFile)
                    }
                    statusResult= `
                        <div style ="display: flex; align-items: center; height:80%">
                            <h3>${statusResult}</h3>
                        </div>
                        
                    `;
                    setSublistValue("status",statusResult)

                    // Falata detalles y resultados
                })

                if (data.length) {
                    sublist.label = `${sublist.label} (${data.length})`;
                }

            }
 
            getRecords() {

                
                let data = [];
                const jsonPeriods = this.getPeriod();
                let search_log = search.create({
                    type: "customrecord_lmry_ar_massive_gener_agip",
                    filters:
                        [
                            ["isinactive", "is", "F"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", sort: search.Sort.DESC }),
                            "custrecord_lmry_ar_gen_agip_subsidiary.legalname",
                            "created",
                            "custrecord_lmry_ar_gen_agip_user",
                            "custrecord_lmry_ar_gen_agip_period",
                            "custrecord_lmry_ar_gen_agip_summary",
                            "custrecord_lmry_ar_gen_agip_status",
                            "custrecord_lmry_ar_gen_agip_url",
                            
                        ]
                });
                let pageData = search_log.runPaged({ pageSize: 1000 });
                if (pageData) {
                    pageData.pageRanges.forEach(function (pageRange) {
                        let page = pageData.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            let columns = result.columns;
                           
                            let formublist = {};
                            formublist.id = result.getValue(columns[0]) || ' ';
                            formublist.subsidiary = result.getValue(columns[1]) || ' ';
                            formublist.created = result.getValue(columns[2]) || ' ';
                            formublist.employee = result.getText(columns[3]) || ' ';
                            formublist.period = jsonPeriods[result.getValue(columns[4])] || ' ';
                            formublist.summary = result.getValue(columns[5]);
                            formublist.status = result.getValue(columns[6]) || ' ';
                            formublist.urlFile = result.getValue(columns[7]);
                            data.push(formublist);
                        });
                    });
                }

                return data;
            }

            getSummary(summary) {
                if (!summary) return " ";

                const jsonSummary = JSON.parse(summary);
                const { s, p, n, e } = jsonSummary;
                const total = s + p + n + e;

                const getLi = (count, text, color) => count === 0 ? '' : `<li style="color: ${color};" margin: 5px 0>${count} ${text}</li>`;

                const html = `
                  <div style="display:flex; flex-direction: column; justify-content: center;  height: 80%; font-family: Arial, sans-serif;">
                    <h3 style="margin-top: 20px;">${total} ${this.translations.LMRY_ENTITIES_FOUND}</h3>
                    <ul style="margin-top: 10px; padding-left: 0px;">
                      ${getLi(s, this.translations.LMRY_SUCESS, 'rgb(18, 179, 18)') }
                      ${getLi(p, this.translations.LMRY_PROCESING, 'blue')}
                      ${getLi(n, this.translations.LMRY_RAW, 'orange')}
                      ${getLi(e, this.translations.LMRY_WITH_ERROR, 'red')}
                    </ul>
                  </div>
                `.trim().replace(/\s+/g, ' ');

                return html;
            }


            getTranslations(language) {
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
                        "LMRY_STATUS": "Estado",
                        "LMRY_REFRESH": "Actualizar",
                        "LMRY_FINISH": "Finalizado",
                        "LMRY_LOADING_DATA": "Cargando datos",
                        "LMRY_ERROR": "Ocurrió un error",
                        "LMRY_PROCESING": "Procesando",
                        "LMRY_SUMMARY": "Resumen",
                        "LMRY_DETAILS": "Detalles",
                        "LMRY_NUMBER":"Posicion",
                        "LMRY_RECORD":"Registro",
                        "LMRY_VIEW":"Ver",
                        "LMRY_SUCESS":"con éxito",
                        "LMRY_RAW":"sin procesar",
                        "LMRY_WITH_ERROR":"con error",
                        "LMRY_ENTITIES_FOUND":"entidades encontradas",

                        "LMRY_PERIOD_START": "Fecha de inicio",
                        "LMRY_PERIOD_END": "Fecha hasta",
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
                        "LMRY_SUMMARY": "Summary",
                        "LMRY_STATUS": "Status",
                        "LMRY_REFRESH": "Refresh",
                        "LMRY_FINISH": "Finished",
                        "LMRY_LOADING_DATA": "Loading Data",
                        "LMRY_ERROR": "An Error Occurred",
                        "LMRY_PROCESING": "Processing",
                        "LMRY_DETAILS": "Details",
                        "LMRY_NUMBER":"Position",
                        "LMRY_RECORD":"Record",
                        "LMRY_VIEW":"View",
                        "LMRY_SUCESS":"successful",
                        "LMRY_RAW":"unprocessed",
                        "LMRY_WITH_ERROR":"with error",
                        "LMRY_ENTITIES_FOUND":"entities found",

                        "LMRY_PERIOD_START": "Date From",
                        "LMRY_PERIOD_END": "Date To",
                    }  
                }
                return translatedFields[language];
            }

            
            toLogSuitelet() {
                redirect.toSuitelet({
                    scriptId: 'customscript_lmry_ar_mass_gene_agip_stlt',
                    deploymentId: 'customdeploy_lmry_ar_mass_gene_agip_stlt'
                });
            }

            runMapReduce({ state, user }) {
                const parameters = {
                    custscript_lmry_ar_mass_gen_agip_user: user,
                    custscript_lmry_ar_mass_gen_agip_state: state
                };

                task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_lmry_ste_ar_wht_send_email_mprd',
                    deploymentId: 'customdeploy_lmry_ste_ar_wht_send_email_mprd',
                    params: parameters
                }).submit();
            }


            isValid(bool) {
                return (bool === "T" || bool === true);
            }
            setParams(parameters){
                this.params = parameters;
            }

            getPeriod(){
                let jsonPeriod = {};
                const search_log = search.create({
                    type: "accountingperiod",
                    columns:
                        [
                            "internalid",
                            "periodname"
                        ]
                });
                let pageData = search_log.runPaged({ pageSize: 1000 });
                if (pageData) {
                    pageData.pageRanges.forEach(function (pageRange) {
                        let page = pageData.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            const id  = result.getValue("internalid");
                            const periodname = result.getValue("periodname") || ' ';
                            jsonPeriod[id] = periodname;
                        });
                    });
                }
                return jsonPeriod;
            }

            isFeatureActive(feature,subsidiary){
                const Licenses = new Licenses_LBRY.Licenses({ subsidiaryId: subsidiary });
                return Licenses.getAuthorization(feature)
            }

        }

        return { onRequest, SuiteletFormManager };
    });
