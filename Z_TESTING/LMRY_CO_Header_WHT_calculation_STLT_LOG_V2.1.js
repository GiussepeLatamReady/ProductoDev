/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_CO_Header_WHT_calculation_STLT_LOG_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */

define([
    "N/log",
    "N/search",
    "N/runtime",
    "N/redirect",
    "N/ui/serverWidget",
    "N/url"],
    (log, search, runtime, redirect, serverWidget, url) => {
        const CLIENT_SCRIPT_PATH = "./CO_Library_Mensual/LMRY_CO_Header_WHT_calculation_CLNT_V2.1.js";
        const onRequest = context => {
            //log.error("request",context.request)
            const handler = new SuiteletFormLogManager({
                params: context.request.parameters,
                method: context.request.method
            });

            if (context.request.method === "GET") {
                try {
                    const form = handler.createLogForm();
                    handler.createSublist();
                    handler.loadSublist();
                    form.clientScriptModulePath = CLIENT_SCRIPT_PATH;
                    context.response.writePage(form);
                } catch (err) {
                    log.error("[ onRequest - GET ]", err);
                }
            } else {
                try {
                    handler.toMainSuitelet();
                } catch (err) {
                    log.error("[ onRequest - POST ]", err);
                }
            }
        };

        class SuiteletFormLogManager {
            constructor(options) {
                this.params = options.params || {};
                this.method = options.method;
                let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
                language = language === "es" ? language : "en";
                this.translations = this.getTranslations(language);
                this.FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });

                this.deploy = runtime.getCurrentScript().deploymentId;

            }

            createLogForm() {
                this.form = serverWidget.createForm({
                    title: this.translations.LMRY_TITLE_STLT
                });

                const executionType = this.form.addField({
                    id: 'custpage_execution',
                    label: 'Execution Type',
                    type: serverWidget.FieldType.SELECT
                });
                executionType.addSelectOption({ value: "ALL", text: this.translations.LMRY_ALL });
                executionType.addSelectOption({ value: "UI", text: this.translations.LMRY_UI });
                executionType.addSelectOption({ value: "SCHEDULE", text: this.translations.LMRY_SCHEDULE });
                executionType.defaultValue = this.params.executionType || "ALL";

                const myInlineHtml = this.form.addField({
                    id: 'custpage_id_message',
                    label: 'MESSAGE',
                    type: serverWidget.FieldType.INLINEHTML
                });
                myInlineHtml.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });

                const strhtml = `
                <html>
                    <table border='0' class='table_fields' cellspacing='0' cellpadding='0'>
                        <tr></tr>
                        <tr>
                            <td class='text'>
                                <div style="color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver">
                                    ${this.translations.LMRY_NOTE}
                                    <br/><br/>
                                    ${this.translations.LMRY_MESSAGE_UPDATE}
                                </div>
                            </td>
                        </tr>
                    </table>
                </html>`;

                myInlineHtml.defaultValue = strhtml;

                this.form.addSubmitButton({
                    label: this.translations.LMRY_BACK_TO_MAIN
                });

                return this.form;
            }


            createSublist() {
                this.sublist = this.form.addSublist({
                    id: "custpage_results_list",
                    label: this.translations.LMRY_RESULTS_LABEL,
                    type: serverWidget.SublistType.LIST
                });

                const fields = [
                    { id: "internalid", label: this.translations.LMRY_INTERNAL_ID_LABEL, type: serverWidget.FieldType.TEXT },
                    { id: "details", label: this.translations.LMRY_DETAILS, type: serverWidget.FieldType.TEXTAREA },
                    { id: "subsidiary", label: this.translations.LMRY_SUBSIDIARY_LABEL, type: serverWidget.FieldType.TEXT },
                    { id: "datecreated", label: this.translations.LMRY_CREATION_DATE_LABEL, type: serverWidget.FieldType.TEXT },
                    { id: "created_by", label: this.translations.LMRY_CREATED_BY_LABEL, type: serverWidget.FieldType.TEXT },
                    { id: "wht_type", label: this.translations.LMRY_WHT_TYPE_LABEL, type: serverWidget.FieldType.TEXT },
                    { id: "process", label: this.translations.LMRY_PROCESS_TYPE_LABEL, type: serverWidget.FieldType.TEXT },
                    { id: "summary", label: "Summary", type: serverWidget.FieldType.TEXTAREA },
                    { id: "state", label: this.translations.LMRY_STATUS_LABEL, type: serverWidget.FieldType.TEXT }
                ];

                fields.forEach(({ id, label, type }) => {
                    this.sublist.addField({ id, label, type });
                });

                this.sublist.addRefreshButton();

                return this.sublist;
            }



            loadSublist() {
                const data = this.getRecords();
                const sublist = this.form.getSublist({ id: "custpage_results_list" });


                data.forEach((form, i) => {
                    const { id, subsidiary, created, employee, executionType, process, state, transactionsObj } = form;

                    const setStyle = (fieldId, fieldValue) => {
                        fieldValue = `<div style ="display: flex; align-items: center; height:80%; padding-left:10px">
                                    <span>${fieldValue}</span>
                                </div>`;
                        return sublist.setSublistValue({ id: fieldId, line: i, value: fieldValue });
                    }

                    const setStyleBold = (fieldId, fieldValue) => {
                        fieldValue = `<div style ="display: flex; align-items: center; height:80%; font-weight: bold; padding-left:10px">
                                    <span>${fieldValue}</span>
                                </div>`;
                        return sublist.setSublistValue({ id: fieldId, line: i, value: fieldValue });
                    }
                
                    const setStyleBtn = (fieldId,fieldValue,label) => {
                        fieldValue =  `<a href="${fieldValue}" target="_blank" style="text-decoration: none; color: inherit;">
                        <div style="display: flex; justify-content:center; align-items: center; place-items: center; height: 35px; background: white; border-radius: 6px; transition: background-color 0.3s; border: 0.5px solid #bbd1e9;" onmouseover="this.style.backgroundColor='#bbd1e9'" onmouseout="this.style.backgroundColor='white';">
                            <div style="display: flex; justify-content:center; align-items: center; color: color:#424950; font-size: 14px; height: 100%;">${label}</div>
                        </div>
                    </a>`;
                        return sublist.setSublistValue({ id: fieldId, line: i, value: fieldValue});
                    }

                    const tranUrl = url.resolveRecord({ recordType: "customrecord_lmry_co_head_wht_cal_log", recordId: id, isEditMode: false });
                    const position = data.length - i;
                    const urlID = `<a class="dottedlink" href=${tranUrl} target="_blank">${position}</a>`;
                    setStyle("internalid", position);
                    setStyleBtn("details", tranUrl,this.translations.LMRY_DETAILS);
                    setStyle("subsidiary", subsidiary)
                    setStyle("datecreated", created)
                    setStyle("created_by", employee)
                    let executionTypeName = executionType == "UI" ? this.translations.LMRY_UI : this.translations.LMRY_SCHEDULE;
                    setStyle("wht_type", executionTypeName)
                    let processTemp = process == "purchases" ? this.translations.LMRY_PURCHASES : this.translations.LMRY_SALES;
                    setStyle("process", processTemp)
                    let stateResult;

                    switch (state) {
                        case "Finalizado":
                            stateResult = this.translations.LMRY_FINISH;
                            break;
                        case "Cargando datos":
                            stateResult = this.translations.LMRY_LOADING_DATA;
                            break;
                        case "Ocurrió un error":
                            stateResult = this.translations.LMRY_FINISH;
                            break;
                        case "Procesando":
                            stateResult = this.translations.LMRY_PROCESING;
                            break;
                        default:
                            stateResult = this.translations.LMRY_LOADING_DATA;
                    }

                    if (state == "Finalizado" || state == "Ocurrió un error") {
                        const ids = JSON.parse(transactionsObj);
                        const totalIDs = ids.length;
                        const incorrects = ids.filter(trans => trans.state == "Error" ).length;

                        const getLi = (count, text, color) => count === 0 ? '' : `<li style="color: ${color};" margin: 5px 0>${count} ${text}</li>`;

                        const html = `
                        <div style="display:flex; flex-direction: column; justify-content: center;  height: 80%; font-family: Arial, sans-serif;">
                            <h3 style="margin-top: 20px;">${totalIDs} ${this.translations.LMRY_TOTALES}</h3>
                            <ul style="margin-top: 10px; padding-left: 0px;">
                            ${getLi(totalIDs -incorrects, this.translations.LMRY_CORRECTS, 'rgb(18, 179, 18)') }
                            ${getLi(incorrects, this.translations.LMRY_INCORRECTS, 'red')}
                            </ul>
                        </div>
                        `.trim().replace(/\s+/g, ' ');
                        setStyle("summary", html)
                    }
                    setStyleBold("state", stateResult)
                })
                if (data.length) {
                    sublist.label = `${sublist.label} (${data.length})`;
                }
            }


            getRecords() {
                let data = [];
                const executionType = this.params.executionType || "ALL";

                const filters = [
                    ["isinactive", "is", "F"]
                ]
                //log.error("p","antes")
                if (executionType != "ALL") {
                    filters.push("AND", ["custrecord_lmry_co_hwht_log_exect", "is", executionType]);
                    //log.error("p","dentro")
                }
                //log.error("p","despues")
                let search_log = search.create({
                    type: "customrecord_lmry_co_head_wht_cal_log",
                    filters: filters,
                    columns:
                        [
                            "internalid",
                            "custrecord_lmry_co_hwht_log_subsi",
                            search.createColumn({ name: "created", sort: search.Sort.DESC }),
                            "custrecord_lmry_co_hwht_log_employee",
                            "custrecord_lmry_co_hwht_log_whttype",
                            "custrecord_lmry_co_hwht_log_process",
                            "custrecord_lmry_co_hwht_log_state",
                            "custrecord_lmry_co_hwht_log_exect",
                            "custrecord_lmry_co_hwht_log_transactions"
                        ]
                });
                //log.error("search_log",search_log)
                let pageData = search_log.runPaged({ pageSize: 1000 });
                if (pageData) {
                    pageData.pageRanges.forEach(function (pageRange) {
                        let page = pageData.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            let columns = result.columns;
                            let formublist = {};
                            formublist.id = result.getValue(columns[0]) || ' ';
                            formublist.subsidiary = result.getText(columns[1]) || ' ';
                            formublist.created = result.getValue(columns[2]) || ' ';
                            formublist.employee = result.getText(columns[3]) || ' ';
                            formublist.whtType = result.getValue(columns[4]) || ' ';
                            formublist.process = result.getValue(columns[5]) || ' ';
                            formublist.state = result.getValue(columns[6]) || ' ';
                            formublist.executionType = result.getValue(columns[7]) || ' ';
                            formublist.transactionsObj = result.getValue(columns[8])
                            data.push(formublist);
                        });
                    });
                }
                return data;
            }

            toMainSuitelet() {
                redirect.toSuitelet({
                    scriptId: "customscript_lmry_co_head_wht_calc_stlt",
                    deploymentId: "customdeploy_lmry_co_head_wht_calc_stlt"
                });
            }

            getTranslations(country) {
                const translatedFields = {
                    "es": {
                        "LMRY_NOTE": "Nota: Se está generando el pago y la creación de asientos diarios. La columna [ESTADO] indica el estado del proceso.",
                        "LMRY_MESSAGE_UPDATE": "Presione el botón Actualizar o Refresh para ver si el proceso terminó.",
                        "LMRY_TITLE_STLT": "LatamReady - CO Registro de Cálculo de Retención de cabecera",
                        "LMRY_BACK_TO_MAIN": "Volver a la página principal",
                        "LMRY_RESULTS_LABEL": "Resultados",
                        "LMRY_INTERNAL_ID_LABEL": "Posicion",
                        "LMRY_SUBSIDIARY_LABEL": "Subsidiaria",
                        "LMRY_CREATION_DATE_LABEL": "Fecha de Creación",
                        "LMRY_CREATED_BY_LABEL": "Creado por",
                        "LMRY_WHT_TYPE_LABEL": "Tipo de Ejecucion",
                        "LMRY_PROCESS_TYPE_LABEL": "Tipo de proceso",
                        "LMRY_STATUS_LABEL": "Estado",
                        "LMRY_LINE": "Linea",
                        "LMRY_HEADER": "Cabecera",
                        "LMRY_PURCHASES": "Compras",
                        "LMRY_SALES": "Ventas",
                        "LMRY_FINISH": "Finalizado",
                        "LMRY_LOADING_DATA": "Cargando datos",
                        "LMRY_ERROR": "Ocurrió un error",
                        "LMRY_PROCESING": "Procesando",
                        "LMRY_UI": "Manual",
                        "LMRY_SCHEDULE": "Programado",
                        "LMRY_ALL": "Todos",
                        "LMRY_DETAILS": "Detalles",
                        "LMRY_TOTALES": "Totales",
                        "LMRY_CORRECTS": "Correctas",
                        "LMRY_INCORRECTS": "Incorrectas",

                    },
                    "en": {
                        "LMRY_NOTE": "Note: The payment is being generated and journal entries are being created. The [STATUS] column indicates the process status.",
                        "LMRY_MESSAGE_UPDATE": "Press the Update or Refresh button to see if the process has finished.",
                        "LMRY_TITLE_STLT": "LatamReady - CO Header WHT calculation Log",
                        "LMRY_BACK_TO_MAIN": "Back to Main Page",
                        "LMRY_RESULTS_LABEL": "Results",
                        "LMRY_INTERNAL_ID_LABEL": "Position",
                        "LMRY_SUBSIDIARY_LABEL": "Subsidiary",
                        "LMRY_CREATION_DATE_LABEL": "Creation Date",
                        "LMRY_CREATED_BY_LABEL": "Created By",
                        "LMRY_WHT_TYPE_LABEL": "Execution Type",
                        "LMRY_PROCESS_TYPE_LABEL": "Process Type",
                        "LMRY_STATUS_LABEL": "Status",
                        "LMRY_LINE": "Line",
                        "LMRY_HEADER": "Header",
                        "LMRY_PURCHASES": "Purchases",
                        "LMRY_SALES": "Sales",
                        "LMRY_FINISH": "Finished",
                        "LMRY_LOADING_DATA": "Loading Data",
                        "LMRY_ERROR": "An Error Occurred",
                        "LMRY_PROCESING": "Processing",
                        "LMRY_UI": "Manual",
                        "LMRY_SCHEDULE": "Scheduled",
                        "LMRY_ALL": "All",
                        "LMRY_DETAILS": "Details",
                        "LMRY_TOTALES": "Total",
                        "LMRY_CORRECTS": "Correct",
                        "LMRY_INCORRECTS": "Incorrect",
                    }
                };
                return translatedFields[country];
            }


        }

        return { onRequest };
    });
