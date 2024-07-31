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
    "../Latam Tools/Router/LMRY_AR_Library_ROUT",
    "../Constants/LMRY_AR_GlobalConstants_LBRY",
    "./Constants/LMRY_AR_Wht_Send_Email_CONST",
    "../Helper/LMRY_AR_Search_Library_HELPER"
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
        Constants_LBRY,
        Search_HELPER

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
                const { REGISTRY_COLLECTION, REGISTRY_TRANSLATION_KEYS } = Constants_LBRY;
                this.translations = Search_HELPER.getTranslations( REGISTRY_TRANSLATION_KEYS, REGISTRY_COLLECTION );
                this.FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });

                this.deploy = runtime.getCurrentScript().deploymentId;

            }

            createLogForm() {
                this.form = serverWidget.createForm({
                    title: this.translations.AR_TITLE_STLT()
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
                                    ${this.translations.AR_NOTE()}
                                    <br/><br/>
                                    ${this.translations.AR_MESSAGE_UPDATE()}
                                </div>
                            </td>
                        </tr>
                    </table>
                </html>`;

                myInlineHtml.defaultValue = strhtml;

                this.form.addSubmitButton({
                    label: this.translations.AR_BACK_TO_MAIN()
                });

                return this.form;
            }


            createSublist() {
                this.sublist = this.form.addSublist({
                    id: "custpage_results_list",
                    label: this.translations.AR_RESULTS_LABEL(),
                    type: serverWidget.SublistType.LIST
                });

                const fields = [
                    { id: "internalid", label: this.translations.AR_INTERNAL_ID_LABEL(), type: serverWidget.FieldType.TEXT },
                    { id: "subsidiary", label: this.translations.AR_SUBSIDIARY(), type: serverWidget.FieldType.TEXT },
                    { id: "vendor", label: this.translations.AR_VENDOR(), type: serverWidget.FieldType.TEXT },
                    { id: "datecreated", label: this.translations.AR_CREATION_DATE_LABEL(), type: serverWidget.FieldType.TEXT },
                    { id: "created_by", label: this.translations.AR_CREATED_BY_LABEL(), type: serverWidget.FieldType.TEXT },
                    { id: "details", label: this.translations.AR_DETAILS(), type: serverWidget.FieldType.TEXTAREA },
                    { id: "state", label: this.translations.AR_STATUS(), type: serverWidget.FieldType.TEXT },
                    
                ];

                fields.forEach((field) => {
                    this.sublist.addField(field);
                });

                this.sublist.addRefreshButton();

                return this.sublist;
            }



            loadSublist() {
                const data = this.getRecords();
                const sublist = this.form.getSublist({ id: "custpage_results_list" });
                data.forEach((form, i) => {
                    const { id, subsidiary, vendor, created, employee, state } = form;
                    const setStyle = (fieldId,fieldValue) => {
                        fieldValue =  `<div style ="display: flex; align-items: center; height:80%; padding-left:10px">
                                    <span>${fieldValue}</span>
                                </div>`;
                        return sublist.setSublistValue({ id: fieldId, line: i, value: fieldValue});
                    }
                    const setStyleBold = (fieldId,fieldValue) => {
                        fieldValue =  `<div style ="display: flex; align-items: center; height:80%; font-weight: bold; padding-left:10px">
                                    <span>${fieldValue}</span>
                                </div>`;
                        return sublist.setSublistValue({ id: fieldId, line: i, value: fieldValue});
                    }

                    const setStyleBtn = (fieldId,fieldValue,label) => {
                        fieldValue =  `<a href="${fieldValue}" target="_blank" style="text-decoration: none; color: inherit;">
                        <div style="display: flex; justify-content:center; align-items: center; place-items: center; height: 35px; background: white; border-radius: 6px; transition: background-color 0.3s; border: 0.5px solid #bbd1e9;" onmouseover="this.style.backgroundColor='#bbd1e9'" onmouseout="this.style.backgroundColor='white';">
                            <div style="display: flex; justify-content:center; align-items: center; color: color:#424950; font-size: 14px; height: 100%;">${label}</div>
                        </div>
                    </a>`;
                        return sublist.setSublistValue({ id: fieldId, line: i, value: fieldValue});
                    }
                    const tranUrl = url.resolveRecord({ recordType: "customrecord_lmry_ste_ar_wht_send", recordId: id, isEditMode: false });
                    setStyle("internalid",id);
                    setStyle("subsidiary",subsidiary);
                    setStyle("vendor",vendor);
                    setStyle("datecreated",created);
                    setStyle("created_by",employee);
                    setStyleBtn("details",tranUrl,this.translations.AR_DETAILS());
                    setStyleBold("state",state)
                })
                if (data.length) {
                    sublist.label = `${sublist.label} (${data.length})`;
                }
            }

            

            getRecords() {
                let data = [];

                let search_log = search.create({
                    type: "customrecord_lmry_ste_ar_wht_send",
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
                            "custrecord_lmry_ste_ar_wht_se_employee",
                            "custrecord_lmry_ste_ar_wht_se_status.name"
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
        }

        return { onRequest };
    });
