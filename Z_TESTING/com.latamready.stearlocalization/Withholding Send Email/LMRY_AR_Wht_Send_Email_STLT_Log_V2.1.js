/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_AR_Wht_Send_Email_STLT_Log_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 18/07/2024
 */

define([
    "N/log",
    "N/search",
    "N/runtime",
    "N/redirect",
    "N/ui/serverWidget",
    "N/url",
    "../../Latam Tools/Router/LMRY_AR_Library_ROUT",
    "../../Constants/LMRY_AR_GlobalConstants_LBRY"
],
    (
        log, 
        search, 
        runtime, 
        redirect, 
        serverWidget, 
        url,
        Router_LBRY,
        Constants,

    ) => {
        const LMRY_SCRIPT = "LMRY_AR_Wht_Send_Email_STLT_Log_V2.1.js";
        const { Error_LBRY} = Router_LBRY;
        const onRequest = context => {
            const handler = new SuiteletFormLogManager({
                params: context.request.parameters,
                method: context.request.method
            });

            if (context.request.method === "GET") {
                try {
                    const form = handler.createLogForm();
                    handler.createSublist();
                    handler.loadSublist();
                    context.response.writePage(form);
                } catch (err) {
                    log.error("[ onRequest - GET ]", err);
                    Error_LBRY.handleError({ title: "[onRequest - GET]", err, script: LMRY_SCRIPT ,suiteAppId: Constants.APP_ID });
                }
            } else {
                try {
                    handler.toMainSuitelet();
                } catch (err) {
                    log.error("[ onRequest - POST ]", err);
                    Error_LBRY.handleError({ title: "[onRequest - POST]", err, script: LMRY_SCRIPT ,suiteAppId: Constants.APP_ID });
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
                    { id: "internalid", label: this.translations.LMRY_INTERNAL_ID_LABEL },
                    { id: "subsidiary", label: this.translations.LMRY_SUBSIDIARY_LABEL },
                    { id: "vendor", label: this.translations.LMRY_VENDOR },
                    { id: "datecreated", label: this.translations.LMRY_CREATION_DATE_LABEL },
                    { id: "created_by", label: this.translations.LMRY_CREATED_BY_LABEL },
                    { id: "state", label: this.translations.LMRY_STATUS_LABEL }
                ];

                fields.forEach(({ id, label }) => {
                    this.sublist.addField({ id, label, type: serverWidget.FieldType.TEXT });
                });

                this.sublist.addRefreshButton();

                return this.sublist;
            }



            loadSublist() {
                const data = this.getRecords();
                const sublist = this.form.getSublist({ id: "custpage_results_list" });
                data.forEach((form, i) => {
                    const { id, subsidiary, vendor, created, employee, state } = form;
                    const tranUrl = url.resolveRecord({ recordType: "customrecord_lmry_ste_ar_wht_se", recordId: id, isEditMode: false });
                    const urlID = `<a class="dottedlink" href=${tranUrl} target="_blank">${id}</a>`;

                    sublist.setSublistValue({ id: "internalid", line: i, value: urlID });
                    sublist.setSublistValue({ id: "subsidiary", line: i, value: subsidiary });
                    sublist.setSublistValue({ id: "vendor", line: i, value: vendor });
                    sublist.setSublistValue({ id: "datecreated", line: i, value: created });
                    sublist.setSublistValue({ id: "created_by", line: i, value: employee });
                    let stateResult;

                    switch (state) {
                        case "Finalizado": // Finalizado
                            stateResult = this.translations.LMRY_FINISH;
                            break;
                        case "Loading data": // Loading
                            stateResult = this.translations.LMRY_LOADING_DATA;
                            break;
                        case "Ocurrió un error": // Finalizado
                            stateResult = this.translations.LMRY_ERROR;
                            break;
                        case "Procesando": // Finalizado
                            stateResult = this.translations.LMRY_PROCESING;
                            break;
                        default:
                            stateResult = this.translations.LMRY_LOADING_DATA;
                    }
                    sublist.setSublistValue({ id: "state", line: i, value: stateResult });
                })
                if (data.length) {
                    sublist.label = `${sublist.label} (${data.length})`;
                }
            }


            getRecords() {
                let data = [];

                let search_log = search.create({
                    type: "customrecord_lmry_ste_ar_wht_se",
                    filters:
                        [
                            ["isinactive", "is", "F"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", sort: search.Sort.DESC }),
                            "custrecord_lmry_ste_ar_wht_se_subsi",
                            "custrecord_lmry_ste_ar_wht_se_vendor",
                            "created",
                            "custrecord_lmry_ste_ar_wht_se_employeee",
                            "custrecord_lmry_ste_ar_wht_se_status"
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
                            formublist.subsidiary = result.getText(columns[1]) || ' ';
                            formublist.vendor = result.getText(columns[2]) || ' ';
                            formublist.created = result.getValue(columns[3]) || ' ';
                            formublist.employee = result.getText(columns[4]) || ' ';
                            formublist.state = result.getValue(columns[5]) || ' ';

                            data.push(formublist);
                        });
                    });
                }

                return data;
            }

            toMainSuitelet() {
                redirect.toSuitelet({
                    scriptId: "customscript_lmry_ste_ar_wht_se_stlt",
                    deploymentId: "customdeploy_lmry_ste_ar_wht_se_stlt"
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
                        "LMRY_INTERNAL_ID_LABEL": "Id interno",
                        "LMRY_SUBSIDIARY_LABEL": "Subsidiaria",
                        "LMRY_CREATION_DATE_LABEL": "Fecha de Creación",
                        "LMRY_CREATED_BY_LABEL": "Creado por",
                        "LMRY_WHT_TYPE_LABEL": "Tipo de retención",
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

                        "LMRY_VENDOR": "Proveedor",
                    },
                    "en": {
                        "LMRY_NOTE": "Note: The payment is being generated and journal entries are being created. The [STATUS] column indicates the process state.",
                        "LMRY_MESSAGE_UPDATE": "Press the Update or Refresh button to see if the process has finished.",
                        "LMRY_TITLE_STLT": "LatamReady - CO Header WHT calculation Log",
                        "LMRY_BACK_TO_MAIN": "Back to Main Page",
                        "LMRY_RESULTS_LABEL": "Results",
                        "LMRY_INTERNAL_ID_LABEL": "Internal Id",
                        "LMRY_SUBSIDIARY_LABEL": "Subsidiary",
                        "LMRY_CREATION_DATE_LABEL": "Creation Date",
                        "LMRY_CREATED_BY_LABEL": "Created By",
                        "LMRY_WHT_TYPE_LABEL": "Withholding Type",
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

                        "LMRY_VENDOR": "Vendor",
                    }
                };
                return translatedFields[country];
            }


        }

        return { onRequest };
    });
