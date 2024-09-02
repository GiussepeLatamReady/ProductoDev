/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LR_BR_Import_IBPT_STLT.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 01/09/2024
 */
define([
    'N/log',
    'N/search',
    'N/redirect',
    'N/runtime',
    'N/ui/serverWidget',
    'N/url',
    'N/task',
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/error/LR_Error_LIB",
    "../../constants/LR_BR_FEATURES_CONST",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/licenses/LR_Licenses_LIB",
],
    (log, search, redirect, runtime, serverWidget, url, task,Lib_Error,BR_Feat,Lib_Licenses) => {
        const CLIENT_SCRIPT_PATH = "./LR_BR_Import_IBPT_CLNT.js";
        const ScriptName = "LR_BR_Import_IBPT_CLNT.js";
        const onRequest = (context) => {
            try {
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
            } catch (error) {
               log.error('Error', 'Error')
               Lib_Error.handleError({ title: "[onRequest]", err });
            }
            
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
                    status: params.custpage_log_id,
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
                      
                this.subsidiaries = [];

                if (this.method === "GET") {
                    let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
                    language = language === "es" ? language : "en";
                    this.translations = this.getTranslations(language);
                    //this.translator = this.getTranslator();
    
                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        this.featureHandlers = new Lib_Licenses.MultiSubsidiaryFeatureManager();
                    } else {
                        this.featureHandler = new Lib_Licenses.FeatureManager();
                    }
    
                    // this.status = Number(this.params.status);
    
                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        this.subsidiaries = this.getSubsidiaries();
                    } else {
                        this.companyInfo = this.getCompanyInformation();
                    }
                } else {
                }
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
                this.addGroup('mainGroup', this.translations.LMRY_PRIMARY_INFO);
                this.addSelectField('custpage_type', this.translations.LMRY_PERIOD, 'mainGroup').isMandatory();
                if (this.FEAT_SUBS) {
                    this.addSelectField('custpage_subsidiary', this.translations.LMRY_SUBSIDIARY, 'mainGroup').isMandatory();
                }

                this.addSimpleField('custpage_cnpj', 'CNPJ','mainGroup');
                this.addSimpleField('custpage_uf', 'UF','mainGroup');

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
                if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                    for (let i = 0; i < this.subsidiaries.length; i++) {
                        const handler = this.featureHandlers.getHandler(this.subsidiaries[i].id);
                        if (handler && handler.isActive(BR_Feat.LOCALIZATION)) {
                            return true;
                        }
                    }
                } else {
                    if (this.featureHandler.isActive(BR_Feat.LOCALIZATION)) {
                        return true;
                    }
                }
                return false;
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
                    { id: "details", label: this.translations.LMRY_DETAILS, type: serverWidget.FieldType.TEXTAREA },
                    { id: "subsidiary", label: this.translations.LMRY_SUBSIDIARY, type: serverWidget.FieldType.TEXT },
                    { id: "datecreated", label: this.translations.LMRY_CREATION_DATE_LABEL, type: serverWidget.FieldType.TEXT },
                    { id: "created_by", label: this.translations.LMRY_CREATED_BY_LABEL, type: serverWidget.FieldType.TEXT },
                    { id: "summary", label: this.translations.LMRY_SUMMARY, type: serverWidget.FieldType.TEXTAREA },
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
                this.fillItemType();
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

            fillItemType() {
                let itemType = this.form.getField({ id: 'custpage_type' });
                itemType.addSelectOption({ value: 0, text: '&nbsp;' });
                itemType.addSelectOption({ value: "products", text: this.translations.LMRY_PRODUCT });
                itemType.addSelectOption({ value: "services", text: this.translations.LMRY_SERVICES });
                itemType.defaultValue = "products";
            } 

            loadProcessRecord() {


                let data = this.getRecords();

                let sublist = this.form.getSublist({ id: 'custpage_results_list' });
                const count = data.length;
                data.forEach((form, i) => {
                    const { id, subsidiary, created, employee, summary, status } = form;
                    const setSublistValue = (colId, value) => sublist.setSublistValue({ id: colId, line: i, value });
                    const recordUrl = url.resolveRecord({ recordType: "customrecord_lr_import_log_ibpt", recordId: id, isEditMode: false });
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
                let search_log = search.create({
                    type: "customrecord_lr_import_log_ibpt",
                    filters:
                        [
                            ["isinactive", "is", "F"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", sort: search.Sort.DESC }),
                            "custrecord_lr_import_log_subsidiary.legalname",
                            "created",
                            "custrecord_lr_import_log_user",
                            "custrecord_lr_import_log_summary",
                            "custrecord_lr_import_log_status",        
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
                            formublist.summary = result.getValue(columns[4]);
                            formublist.status = result.getValue(columns[5]) || ' ';
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
                    <h3 style="margin-top: 20px;">${total} ${this.translations.LMRY_CODE_FOUND}</h3>
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
                        "LMRY_SERVICES": "Servicios",
                        "LMRY_PRODUCT": "Producto",
                        "LMRY_TITLE_FORM": "LR - BR Import IBPT",
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
                        "LMRY_SUCESS":"con éxito",
                        "LMRY_RAW":"sin procesar",
                        "LMRY_WITH_ERROR":"con error",
                        "LMRY_CODE_FOUND":"Codigos registrados",
                    },
                    "en": {
                        "LMRY_MESSAGE": "Message",
                        "LMRY_MESSAGE_LICENSE": "NOTICE: Currently the license for this module is expired, please contact the LatamReady sales team.",
                        "LMRY_MESSAGE_CONTACT": "You can also contact us through",
                        "LMRY_PRIMARY_INFO": "Primary information",
                        "LMRY_SUBSIDIARY": "Subsidiary",
                        "LMRY_SERVICES": "Services",
                        "LMRY_PRODUCT": "Product",
                        "LMRY_TITLE_FORM": "LR - BR Importar IBPT",
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
                        "LMRY_SUCESS":"successful",
                        "LMRY_RAW":"unprocessed",
                        "LMRY_WITH_ERROR":"with error",
                        "LMRY_CODE_FOUND":"Codigos registrados",
                    }  
                }
                return translatedFields[language];
            }

            
            toLogSuitelet() {
                redirect.toSuitelet({
                    scriptId: 'customscript_lr_br_import_ibpt_stltt',
                    deploymentId: 'customdeploy_lr_br_import_ibpt_stlt'
                });
            }

            runMapReduce({ status, user }) {
                
                const parameters = {
                    custscript_lr_br_import_ibpt_user: user,
                    custscript_lr_br_import_ibpt_status: status
                };

                task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_lr_br_import_ibpt_mprd',
                    deploymentId: 'customdeploy_lr_br_import_ibpt_mprd',
                    params: parameters
                }).submit();
            }


            isValid(bool) {
                return (bool === "T" || bool === true);
            }

        }

        return { onRequest, SuiteletFormManager };
    });
