/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_PY_Foreign_Purchase_WHT_STLT_LBRY_V2.1.js
 * @Author gerson@latamready.com
 */
define(["N/search", "N/record", "N/runtime", "N/translation", "N/redirect", "N/ui/serverWidget", "N/url", "N/task", "./LMRY_libSendingEmailsLBRY_V2.0"],
    (search, record, runtime, translation, redirect, serverWidget, url, task, lbryMail) => {

        const MPRD_SCRIPT_ID = "customscript_lmry_py_wht_purchase_mprd";
        const MPRD_DEPLOY_ID = "customdeploy_lmry_py_wht_purchase_mprd";
        const LOG_SCRIPT_ID = "customscript_lmry_py_wht_purch_log_stlt";
        const LOG_DEPLOY_ID = "customdeploy_lmry_py_wht_purch_log_stlt";

        class PYStltHandler {
            constructor(options) {
                this.params = options.params || {};
                this.method = options.method;

                this.FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                this.FEAT_DEPT = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
                this.FEAT_LOC = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
                this.FEAT_CLASS = runtime.isFeatureInEffect({ feature: "CLASSES" });

                this.DEPTMANDATORY = runtime.getCurrentUser().getPreference({ name: "DEPTMANDATORY" });
                this.LOCMANDATORY = runtime.getCurrentUser().getPreference({ name: "LOCMANDATORY" });
                this.CLASSMANDATORY = runtime.getCurrentUser().getPreference({ name: "CLASSMANDATORY" });

                this.FEAT_APPROV_BILL = runtime.getCurrentScript().getParameter({ name: "CUSTOMAPPROVALVENDORBILL" });
                this.deploy = runtime.getCurrentScript().deploymentId;

                if (this.method == "GET") {
                    this.translator = this.getTranslator();
                }
            }

            areThereSubsidiaries() {
                let subsidiaries = [];
                let anysubsidiary = false;
                let licenses = [];
                if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                    let allLicenses = lbryMail.getAllLicenses();
                    subsidiaries = this.getSubsidiaries();

                    for (let i = 0; i < subsidiaries.length; i++) {
                        if (allLicenses[subsidiaries[i].value] != null && allLicenses[subsidiaries[i].value] !== "") {
                            licenses = allLicenses[subsidiaries[i].value];
                        } else {
                            licenses = [];
                        }
                        if (lbryMail.getAuthorization(716, licenses)) {
                            subsidiaries[i].active = true;
                            anysubsidiary = true;
                        }
                    }
                } else {
                    subsidiaries.push({
                        value: 1,
                        text: "Company",
                        active: false
                    });
                    licenses = lbryMail.getLicenses(1);
                    if (lbryMail.getAuthorization(716, licenses)) {
                        anysubsidiary = true;
                    }
                }

                this.subsidiaries = subsidiaries;
                return anysubsidiary;
            }

            getSubsidiaries() {
                let subsis = [];

                let search_Subs = search.create({
                    type: search.Type.SUBSIDIARY,
                    filters: [
                        ["isinactive", "is", "F"], "AND",
                        ["country", "is", "PY"]
                    ],
                    columns: ["internalid", "name"]
                });
                let lengt_sub = search_Subs.run().getRange({ start: 0, end: 1000 });

                if (lengt_sub != null && lengt_sub.length > 0) {
                    // Llenado de listbox
                    for (let i = 0; i < lengt_sub.length; i++) {
                        let subID = lengt_sub[i].getValue("internalid");
                        let subNM = lengt_sub[i].getValue("name");
                        subsis.push({
                            value: subID,
                            text: subNM,
                            active: false
                        });
                    }
                }
                return subsis;
            }

            createForm() {
                this.form = serverWidget.createForm({
                    title: this.getText("title_py_wht_pur")
                });

                let form = this.form;

                let anysubsidiary = this.areThereSubsidiaries();

                if (!anysubsidiary) {
                    // Mensaje para el cliente
                    let myInlineHtml = form.addField({
                        id: "custpage_lmry_v_message",
                        label: "Message",
                        type: serverWidget.FieldType.INLINEHTML
                    });

                    myInlineHtml.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW });
                    myInlineHtml.updateBreakType({
                        breakType: serverWidget.FieldBreakType.STARTCOL
                    });

                    let strhtml = "<html>";
                    strhtml += "<table border=\"0\" class=\"table_fields\" cellspacing=\"0\" cellpadding=\"0\">" +
                        "<tr>" +
                        "</tr>" +
                        "<tr>" +
                        "<td class=\"text\">" +
                        "<div style=\"color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">" +
                        this.getText("license_expired") + ". </br>" + this.getText("contact_us") + "www.Latamready.com" +
                        "</div>" +
                        "</td>" +
                        "</tr>" +
                        "</table>" +
                        "</html>";
                    myInlineHtml.defaultValue = strhtml;

                    return form;
                }

                form.addFieldGroup({
                    id: "mainGroup",
                    label: this.getText("primary_information")
                });

                let subsidiaryField;

                if (this.FEAT_SUBS == true || this.FEAT_SUBS == "T") {
                    subsidiaryField = form.addField({
                        id: "custpage_subsidiary",
                        type: serverWidget.FieldType.SELECT,
                        label: this.getText("subsidiary"),
                        container: "mainGroup"
                    }).setHelpText({ help: "custpage_subsidiary" });
                    subsidiaryField.isMandatory = true;
                }

                let countryField = form.addField({
                    id: "custpage_country",
                    type: serverWidget.FieldType.TEXT,
                    label: this.getText("country"),
                    container: "mainGroup"
                }).setHelpText({ help: "custpage_country" });
                countryField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                countryField.defaultValue = "Paraguay";

                let transactionField = form.addField({
                    id: "custpage_transaction",
                    type: serverWidget.FieldType.TEXT,
                    label: this.getText("transaction"),
                    container: "mainGroup"
                }).setHelpText({ help: "custpage_transaction" });
                transactionField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                transactionField.defaultValue = this.getText("bill");

                let statusField = form.addField({
                    id: "custpage_status_field",
                    type: serverWidget.FieldType.TEXT,
                    label: this.getText("status"),
                    container: "mainGroup"
                }).setHelpText({ help: "custpage_status_field" });
                statusField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                statusField.defaultValue = this.getText("pending_payment");

                let dateField = form.addField({
                    id: "custpage_date",
                    type: serverWidget.FieldType.DATE,
                    label: this.getText("date_issue"),
                    container: "mainGroup"
                }).setHelpText({ help: "custpage_date" });

                let exchangeRate = form.addField({
                    id: "custpage_exchange_rate",
                    type: serverWidget.FieldType.FLOAT,
                    label: this.getText("EXCHANGERATE"),
                    container: "mainGroup"
                }).setHelpText({ help: "custpage_exchange_rate" });
                exchangeRate.isMandatory = true;

                let batchField = form.addField({
                    id: "custpage_batch",
                    type: serverWidget.FieldType.TEXT,
                    label: this.getText("batch"),
                    container: "mainGroup"
                }).setHelpText({ help: "custpage_batch" });

                let memoField = form.addField({
                    id: "custpage_memo",
                    type: serverWidget.FieldType.TEXT,
                    label: this.getText("memo"),
                    container: "mainGroup"
                }).setHelpText({ help: "custpage_memo" });

                //Filters
                form.addFieldGroup({
                    id: "filtersGroup",
                    label: this.getText("filters")
                });

                let dateFromField = form.addField({
                    id: "custpage_date_from",
                    type: serverWidget.FieldType.DATE,
                    label: this.getText("date_from"),
                    container: "filtersGroup"
                }).setHelpText({ help: "custpage_date_from" });

                let dateToField = form.addField({
                    id: "custpage_date_to",
                    type: serverWidget.FieldType.DATE,
                    label: this.getText("date_to"),
                    container: "filtersGroup"
                }).setHelpText({ help: "custpage_date_to" });

                let vendorField = form.addField({
                    id: "custpage_vendor",
                    type: serverWidget.FieldType.SELECT,
                    label: this.getText("vendor"),
                    container: "filtersGroup"
                }).setHelpText({ help: "custpage_vendor" });

                let currencyField = form.addField({
                    id: "custpage_currency",
                    type: serverWidget.FieldType.SELECT,
                    label: this.getText("currency"),
                    container: "filtersGroup"
                }).setHelpText({ help: "custpage_currency" });

                currencyField.isMandatory = true;
                //Classification
                form.addFieldGroup({
                    id: "classGroup",
                    label: this.getText("classification")
                });

                let depField;
                if (this.FEAT_DEPT == true || this.FEAT_DEPT == "T") {
                    depField = form.addField({
                        id: "custpage_department",
                        type: serverWidget.FieldType.SELECT,
                        label: this.getText("department"),
                        container: "classGroup"
                    }).setHelpText({ help: "custpage_department" });

                    if (this.DEPTMANDATORY == true || this.DEPTMANDATORY == "T") {
                        depField.isMandatory = true;
                    }
                }

                let classField;

                if (this.FEAT_CLASS == true || this.FEAT_CLASS == "T") {
                    classField = form.addField({
                        id: "custpage_class",
                        type: serverWidget.FieldType.SELECT,
                        label: this.getText("class"),
                        container: "classGroup"
                    }).setHelpText({ help: "custpage_class" });

                    if (this.CLASSMANDATORY == true || this.CLASSMANDATORY == "T") {
                        classField.isMandatory = true;
                    }
                }

                let locField;

                if (this.FEAT_LOC == true || this.FEAT_LOC == "T") {
                    locField = form.addField({
                        id: "custpage_location",
                        type: serverWidget.FieldType.SELECT,
                        label: this.getText("location"),
                        container: "classGroup"
                    }).setHelpText({ help: "custpage_location" });

                    if (this.LOCMANDATORY == true || this.LOCMANDATORY == "T") {
                        locField.isMandatory = true;
                    }
                }

                form.addField({
                    id: "custpage_log_id",
                    type: serverWidget.FieldType.TEXT,
                    label: "Log ID"
                }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                form.addField({
                    id: "custpage_status",
                    type: serverWidget.FieldType.TEXT,
                    label: "Status"
                }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                if (!Number(this.params.status)) {
                    //Buttons
                    form.addSubmitButton({
                        label: this.getText("filter")
                    });

                } else {

                    //Additional Information
                    form.addFieldGroup({
                        id: "additionalGroup",
                        label: this.getText("additional_information")
                    });

                    //Apply other rule
                    let applyRulefield = form.addField({
                        id: "custpage_apply_rule",
                        type: serverWidget.FieldType.SELECT,
                        label: this.getText("apply_rule"),
                        container: "additionalGroup"
                    }).setHelpText({ help: "custpage_apply_rule" });

                    this.fillRulesPY(applyRulefield);

                    //Buttons
                    form.addSubmitButton({
                        label: this.getText("save")
                    });
                    form.addButton({
                        id: "btn_back",
                        label: this.getText("back"),
                        functionName: "back"
                    });

                    if (subsidiaryField) {
                        subsidiaryField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    }
                    dateField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    batchField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    memoField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    dateFromField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    dateToField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    vendorField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    currencyField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    exchangeRate.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    if (depField) {
                        depField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    }
                    if (classField) {
                        classField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    }
                    if (locField) {
                        locField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    }

                }

                return form;
            }

            createSublist() {

                this.form.addTab({
                    id: "transactions_tab",
                    label: this.getText("transactions")
                });

                this.sublist = this.form.addSublist({
                    id: "custpage_results_list",
                    label: this.getText("results"),
                    tab: "transactions_tab",
                    type: serverWidget.SublistType.LIST
                });

                let sublist = this.sublist;

                sublist.addField({
                    id: "apply",
                    label: this.getText("apply"),
                    type: serverWidget.FieldType.CHECKBOX
                });

                sublist.addField({
                    id: "internalid",
                    label: this.getText("internal_id"),
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "tranid",
                    label: this.getText("tranid"),
                    type: serverWidget.FieldType.TEXT
                });

                let internalidtextField = sublist.addField({
                    id: "internalidtext",
                    label: this.getText("internal_id"),
                    type: serverWidget.FieldType.TEXT
                });
                internalidtextField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                sublist.addField({
                    id: "transaction",
                    label: this.getText("transaction"),
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "date",
                    label: this.getText("date"),
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "vendor",
                    label: this.getText("vendor"),
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "vendorid",
                    label: this.getText("vendor"),
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                sublist.addField({
                    id: "doctype",
                    label: this.getText("document_type"),
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "currency",
                    label: this.getText("currency"),
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "currencyid",
                    label: this.getText("currency"),
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                sublist.addField({
                    id: "total_amt",
                    label: this.getText("total_amt"),
                    type: serverWidget.FieldType.CURRENCY
                });

                let applyRule = sublist.addField({
                    id: "apply_rule",
                    label: this.getText("apply_rule"),
                    type: serverWidget.FieldType.SELECT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                this.fillRulesPY(applyRule);

                sublist.addField({
                    id: "wht_percent",
                    label: this.getText("wht_percent"),
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: "wht_amount",
                    label: this.getText("wht_amount"),
                    type: serverWidget.FieldType.CURRENCY
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                //Buttons
                sublist.addButton({
                    id: "btn_mark_all",
                    label: this.getText("mark_all"),
                    functionName: "toggleCheckBoxes(true)"
                });

                sublist.addButton({
                    id: "btn_desmark_all",
                    label: this.getText("desmark_all"),
                    functionName: "toggleCheckBoxes(false)"
                });

                return sublist;
            }

            loadSublist() {
                let data = this.getTransactions();

                let sublist = this.form.getSublist({ id: "custpage_results_list" });

                for (let i = 0; i < data.length; i++) {
                    let { id, tranid, vendor, vendorid, trandate, doctype, currency, currencyid, totalAmt, whtPercent, whtAmount } = data[i];

                    sublist.setSublistValue({ id: "apply", line: i, value: "F" });

                    let tranUrl = url.resolveRecord({ recordType: "vendorbill", recordId: id, isEditMode: false });
                    let urlID = `<a class="dottedlink" href=${tranUrl} target="_blank">${id}</a>`;

                    sublist.setSublistValue({ id: "internalidtext", line: i, value: id });
                    sublist.setSublistValue({ id: "internalid", line: i, value: urlID });

                    if (tranid) {
                        sublist.setSublistValue({ id: "tranid", line: i, value: tranid });
                    }

                    sublist.setSublistValue({ id: "transaction", line: i, value: this.getText("bill") });

                    if (vendor) {
                        sublist.setSublistValue({ id: "vendor", line: i, value: vendor });
                    }

                    if (vendorid) {
                        sublist.setSublistValue({ id: "vendorid", line: i, value: vendorid });
                    }

                    if (trandate) {
                        sublist.setSublistValue({ id: "date", line: i, value: trandate });
                    }

                    if (doctype) {
                        sublist.setSublistValue({ id: "doctype", line: i, value: doctype });
                    }

                    if (currency) {
                        sublist.setSublistValue({ id: "currency", line: i, value: currency });
                    }

                    if (currencyid) {
                        sublist.setSublistValue({ id: "currencyid", line: i, value: currencyid });
                    }

                    if (totalAmt) {
                        sublist.setSublistValue({ id: "total_amt", line: i, value: totalAmt.toFixed(2) });
                    }

                    if (whtPercent) {
                        sublist.setSublistValue({ id: "wht_percent", line: i, value: whtPercent });
                    }

                    if (whtAmount) {
                        sublist.setSublistValue({ id: "wht_amount", line: i, value: whtAmount.toFixed(2) });
                    }

                }

                if (data.length) {
                    sublist.label = `${sublist.label} (${data.length})`;
                }

            }

            getTransactions() {
                let data = [];
                let { subsidiary, vendor, currency, datefrom, dateto } = this.params;

                /******************************************
                 * Se obtien la precision de las monedas  *
                 ******************************************/
                let precisionJSON = this.getPrecision(subsidiary);
                log.debug("precisionJSON", precisionJSON);

                let filters = [
                    ["status", "anyof", "VendBill:A"], "AND",
                    ["custbody_lmry_scheduled_process", "is", "F"], "AND",
                    ["mainline", "is", "F"], "AND",
                    ["custbody_lmry_apply_wht_code", "is", "T"], "AND",
                    ["vendor.custentity_lmry_countrycode", "isnotempty", ""], "AND",
                    ["vendor.custentity_lmry_countrycode", "isnot", "PY"], "AND",
                    ["vendor.custentity_lmry_countrycode", "isnot", "PRY"], "AND",
                    ["taxline", "is", "F"], "AND",
                    ["cogs", "is", "F"], "AND",
                    ["shipping", "is", "F"], "AND",
                    ["debitfxamount", "greaterthan", "0.00"]
                ];

                if (this.FEAT_SUBS == true || this.FEAT_SUBS == "T") {
                    filters.push("AND", ["subsidiary", "anyof", subsidiary]);
                }

                if (this.FEAT_APPROV_BILL == true || this.FEAT_APPROV_BILL == "T") {
                    filters.push("AND", ["approvalstatus", "anyof", "2"]);
                }

                if (dateto) {
                    filters.push("AND", ["trandate", "onorbefore", [dateto]]);
                }

                if (datefrom) {
                    filters.push("AND", ["trandate", "onorafter", [datefrom]]);
                }

                if (Number(currency)) {
                    filters.push("AND", ["currency", "anyof", [currency]]);
                }

                if (Number(vendor)) {
                    filters.push("AND", ["mainname", "anyof", [vendor]]);
                }

                let columns = [];
                columns.push(search.createColumn({ name: "internalid", sort: search.Sort.ASC, summary: "GROUP" }));
                columns.push(search.createColumn({ name: "formulatext", formula: "NVL({tranid}, {transactionnumber})", summary: "GROUP" }));
                columns.push(search.createColumn({ name: "trandate", summary: "GROUP" }));
                columns.push(search.createColumn({ name: "custbody_lmry_document_type", summary: "GROUP" }));
                columns.push(search.createColumn({ name: "mainname", summary: "GROUP" }));
                columns.push(search.createColumn({ name: "currency", summary: "GROUP" }));
                columns.push(search.createColumn({ name: "formulacurrency", formula: "{fxamount}*(1+{taxitem.rate}/100)", summary: "SUM" }));

                let searchTransactions = search.create({
                    type: "vendorbill",
                    filters: filters,
                    columns: columns,
                    settings: [search.createSetting({ name: "consolidationtype", value: "NONE" })]
                });

                let context = this;
                let pageData = searchTransactions.runPaged({ pageSize: 1000 });
                if (pageData) {
                    pageData.pageRanges.forEach(function (pageRange) {
                        let page = pageData.fetch({ index: pageRange.index });
                        let results = page.data;
                        if (results) {
                            for (let i = 0; i < results.length; i++) {
                                let id = results[i].getValue({ name: "internalid", summary: "GROUP" });
                                id = String(id);
                                let tranid = results[i].getValue({name: "formulatext", summary: "GROUP"}) || "";
                                let trandate = results[i].getValue({ name: "trandate", summary: "GROUP" });
                                let idDoc = results[i].getValue({ name: "custbody_lmry_document_type", summary: "GROUP" });
                                let doctype = idDoc ? results[i].getText({ name: "custbody_lmry_document_type", summary: "GROUP" }) : "";
                                let vendor = results[i].getText({ name: "mainname", summary: "GROUP" }) || "";
                                let vendorid = results[i].getValue({ name: "mainname", summary: "GROUP" }) || "";
                                let currency = results[i].getText({ name: "currency", summary: "GROUP" }) || "";
                                let currencyid = results[i].getValue({ name: "currency", summary: "GROUP" }) || "";
                                let totalAmt = results[i].getValue({ name: "formulacurrency", summary: "SUM" });
                                totalAmt = context.roundnumber(Number(totalAmt), precisionJSON[currencyid]);
                                data.push({
                                    id: id,
                                    tranid: tranid,
                                    trandate: trandate,
                                    doctype: doctype,
                                    vendor: vendor,
                                    vendorid: vendorid,
                                    currency: currency,
                                    currencyid: currencyid,
                                    totalAmt: totalAmt,
                                    /*whtPercent: whtPercent,
                                    whtAmount: whtAmount*/
                                });
                            }
                        }
                    });
                }

                return data;
            }

            fillRulesPY(applyRuleField) {
                let search_rule = search.create({
                    type: "customrecord_lmry_wht_rules",
                    filters: [
                        ["isinactive", "is", "F"], "AND",
                        ["custrecord_lmry_whtrule_country", "is", "186"] //Paraguay
                    ],
                    columns: ["internalid", "name"]
                });
                let lengt_rule = search_rule.run().getRange({ start: 0, end: 1000 });

                applyRuleField.addSelectOption({ value: 0, text: "&nbsp;" });
                if (lengt_rule != null && lengt_rule.length > 0) {
                    // Llenado de listbox
                    for (let i = 0; i < lengt_rule.length; i++) {
                        let ruleID = lengt_rule[i].getValue("internalid");
                        let ruleNM = lengt_rule[i].getValue("name");
                        applyRuleField.addSelectOption({ value: ruleID, text: ruleNM });
                    }
                }
            }

            getRulesbyEntity(vendor, subsi) {
                let data = {};

                let filters = [
                    ["isinactive", "is", "F"], "AND",
                    ["custrecord_lmry_co_ent_trantype", "is", "4"] //Bill
                ];

                if (Number(vendor)) {
                    filters.push("AND", ["custrecord_lmry_co_entity", "anyof", vendor]);
                }

                if (this.FEAT_SUBS == true || this.FEAT_SUBS == "T") {
                    filters.push("AND", ["custrecord_lmry_co_subsi_reten", "anyof", subsi]);
                }

                let columns = ['custrecord_lmry_co_entity', 'custrecord_lmry_py_wht_rule'];

                let searchEntityFields = search.create({
                    type: "customrecord_lmry_entity_fields",
                    filters: filters,
                    columns: columns
                });

                let pageData = searchEntityFields.runPaged({ pageSize: 1000 });
                if (pageData) {
                    pageData.pageRanges.forEach(function (pageRange) {
                        let page = pageData.fetch({ index: pageRange.index });
                        let results = page.data;
                        if (results) {
                            for (let i = 0; i < results.length; i++) {
                                let entity = results[i].getValue("custrecord_lmry_co_entity");
                                let rule = results[i].getValue("custrecord_lmry_py_wht_rule");
                                data[entity] = rule;
                            }
                        }
                    });
                }
                this.ruleByEntity = data;
            }

            getWithholdingByRule(subsidiary, datefrom, dateto) {
                let data = {};

                let filters = [
                    ["isinactive", "is", "F"], "AND",
                    ["custrecord_lmry_ntax_transactiontypes", "is", "4"], "AND", //Bill
                    ["custrecord_lmry_ntax_appliesto", "is", "1"], "AND", //Total
                    ["custrecord_lmry_ntax_gen_transaction", "is", "8"] //Latam WHT
                ];

                if (this.FEAT_SUBS == true || this.FEAT_SUBS == "T") {
                    filters.push("AND", ["custrecord_lmry_ntax_subsidiary", "anyof", subsidiary]);
                }

                if (datefrom) {
                    filters.push("AND", ["custrecord_lmry_ntax_datefrom", "onorbefore", datefrom]);
                }

                if (dateto) {
                    filters.push("AND", ["custrecord_lmry_ntax_dateto", "onorafter", dateto]);
                }

                let columns = [
                    "custrecord_lmry_ntax_wht_rule", "custrecord_lmry_co_ntax_taxrate"
                ];

                let searchNationalTax = search.create({
                    type: "customrecord_lmry_national_taxes",
                    filters: filters,
                    columns: columns
                });

                let pageData = searchNationalTax.runPaged({ pageSize: 1000 });
                if (pageData) {
                    pageData.pageRanges.forEach(function (pageRange) {
                        let page = pageData.fetch({ index: pageRange.index });
                        let results = page.data;
                        if (results) {
                            for (let i = 0; i < results.length; i++) {
                                let rule = results[i].getValue("custrecord_lmry_ntax_wht_rule");
                                let rate = results[i].getValue("custrecord_lmry_co_ntax_taxrate");
                                if (!data[rule]) {
                                    data[rule] = 0;
                                }
                                data[rule] += Number(rate);
                            }
                        }
                    });
                }
                this.whtByRule = data;
            }

            loadFormValues() {
                if (this.FEAT_SUBS == true || this.FEAT_SUBS == "T") {
                    this.fillSubsidiaries();
                }
            }

            fillSubsidiaries() {
                let subsidiaryField = this.form.getField({
                    id: "custpage_subsidiary"
                });

                if (subsidiaryField) {
                    subsidiaryField.addSelectOption({ value: 0, text: "&nbsp;" });

                    if (this.subsidiaries) {
                        for (let i = 0; i < this.subsidiaries.length; i++) {
                            let id = this.subsidiaries[i].value;
                            let name = this.subsidiaries[i].text;
                            // licenses = this.licensesBySubsidiary[id] || [];
                            if (this.subsidiaries[i].active) {
                                subsidiaryField.addSelectOption({ value: id, text: name });
                            }
                        }
                    }
                }
            }

            toSuitelet() {
                let parameters = this.params;
                let params = {
                    subsidiary: parameters.custpage_subsidiary || "",
                    date: parameters.custpage_date || "",
                    batch: parameters.custpage_batch || "",
                    memo: parameters.custpage_memo || "",
                    vendor: parameters.custpage_vendor || "",
                    currency: parameters.custpage_currency || "",
                    datefrom: parameters.custpage_date_from || "",
                    dateto: parameters.custpage_date_to || "",
                    department: parameters.custpage_department || "",
                    class_: parameters.custpage_class || "",
                    location: parameters.custpage_location || "",
                    status: "1"
                };
                redirect.toSuitelet({
                    scriptId: runtime.getCurrentScript().id,
                    deploymentId: runtime.getCurrentScript().deploymentId,
                    parameters: params
                });
            }

            toLogSuitelet() {
                redirect.toSuitelet({
                    scriptId: LOG_SCRIPT_ID,
                    deploymentId: LOG_DEPLOY_ID
                });
            }

            executeMapReduce() {
                let logId = this.params.custpage_log_id;
                task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: MPRD_SCRIPT_ID,
                    deploymentId: MPRD_DEPLOY_ID,
                    params: {
                        "custscript_lmry_py_wht_pur_logid": logId,
                    },
                }).submit();
            }

            setFormValues() {
                let { subsidiary, date, batch, memo, vendor, currency, datefrom, dateto, department, class_, location } = this.params;
                let form = this.form;

                if (this.FEAT_SUBS == true || this.FEAT_SUBS == "T") {
                    if (Number(subsidiary)) {
                        let subsidiaryField = form.getField({ id: "custpage_subsidiary" });
                        let name = search.lookupFields({
                            type: "subsidiary",
                            id: subsidiary,
                            columns: ["name"]
                        }).name;

                        subsidiaryField.addSelectOption({ value: subsidiary, text: name });
                        subsidiaryField.defaultValue = subsidiary;
                    }
                }

                if (Number(vendor)) {
                    let vendorField = form.getField({ id: "custpage_vendor" });
                    let vendorResult = search.lookupFields({
                        type: 'vendor',
                        id: vendor,
                        columns: ['internalid', 'companyname', 'isperson', 'firstname', 'middlename', 'lastname', 'entityid']
                    });
                    let { isperson, firstname, middlename, lastname, entityid, companyname } = vendorResult;

                    var name = entityid + ((companyname) ? " " + companyname : "");

                    if (isperson) {
                        name = entityid + " " + firstname + " " + ((middlename) ? (middlename + " ") : "") + lastname;
                    }

                    vendorField.addSelectOption({ value: vendor, text: name });
                    vendorField.defaultValue = vendor;
                }

                if (Number(currency)) {
                    let currencyField = form.getField({ id: "custpage_currency" });
                    let name = search.lookupFields({
                        type: "currency",
                        id: currency,
                        columns: ["name"]
                    }).name;
                    currencyField.addSelectOption({ value: currency, text: name });
                    currencyField.defaultValue = currency;
                }

                if ((this.FEAT_DEPT == true || this.FEAT_DEPT == "T") && Number(department)) {
                    let departmentField = form.getField({ id: "custpage_department" });
                    let name = search.lookupFields({
                        type: 'department',
                        id: department,
                        columns: 'name'
                    }).name;
                    departmentField.addSelectOption({ value: department, text: name });
                    departmentField.defaultValue = department;
                }

                if ((this.FEAT_CLASS == true || this.FEAT_CLASS == "T") && Number(class_)) {
                    let classField = form.getField({ id: "custpage_class" });
                    let name = search.lookupFields({
                        type: "classification",
                        id: class_,
                        columns: ["name"]
                    }).name;
                    classField.addSelectOption({ value: class_, text: name });
                    classField.defaultValue = class_;
                }

                if ((this.FEAT_LOC == true || this.FEAT_LOC == "T") && Number(location)) {
                    let locationField = form.getField({ id: "custpage_location" });
                    let name = search.lookupFields({
                        type: "location",
                        id: location,
                        columns: ["name"]
                    }).name;
                    locationField.addSelectOption({ value: location, text: name });
                    locationField.defaultValue = location;
                }

                form.updateDefaultValues({
                    "custpage_date": date || "",
                    "custpage_date_from": datefrom || "",
                    "custpage_date_to": dateto || "",
                    "custpage_batch": batch || "",
                    "custpage_memo": memo || "",
                    "custpage_status": "1"
                });
            }

            getTranslator() {
                return translation.load({
                    collections: [{
                        alias: "text",
                        collection: "custcollection_lmry_translations",
                        keys: [
                            "title_py_wht_pur", "license_expired", "contact_us",
                            "primary_information", "subsidiary", "country", "transaction", "status", "bill", "pending_payment", "date_issue",
                            "batch", "memo", "filters", "date_from", "date_to", "vendor", "currency",
                            "classification", "department", "class", "location", "filter",
                            "additional_information", "apply_rule", "save", "back",
                            "transactions", "results", "apply", "internal_id", "tranid", "transaction", "date", "document_type",
                            "total_amt", "wht_percent", "wht_amount", "mark_all", "desmark_all","EXCHANGERATE"
                        ]
                    }]
                });
            }

            getText(key, params) {
                key = key.toUpperCase();
                let funcTranslator = this.translator.text[key];
                if (funcTranslator) {
                    if (params && params.length) {
                        return funcTranslator({ params: params });
                    } else {
                        return funcTranslator();
                    }
                }
                return "";
            }

            getPrecision(subsidiary) {
                let precisionResult = {};
                let filtersSetup = [
                    ["isinactive", "is", "F"]
                ];
                if (this.FEAT_SUBS == true || this.FEAT_SUBS == "T") {
                    filtersSetup.push("AND", ["custrecord_lmry_setuptax_subsidiary", "is", subsidiary]);
                }
                let setupTax = search.create({
                    type: "customrecord_lmry_setup_tax_subsidiary",
                    columns: [ "custrecord_lmry_setuptax_multicurrency"],
                    filters: filtersSetup
                });
                let resultTax = setupTax.run().getRange({ start: 0, end: 1000 });
                
                if (resultTax && resultTax.length) {
                    let currencies = resultTax[0].getValue("custrecord_lmry_setuptax_multicurrency").split(",") || [];
                    currencies = currencies.filter((a) => !isNaN(a) && a !== "");
                    for (let i = 0; i < currencies.length; i++) {
                        let currencyObj = record.load({ type: "currency", id: currencies[i] });
                        precisionResult[currencies[i]] = currencyObj.getValue("currencyprecision");
                    }
                }
                return precisionResult;
            }

            roundnumber(num, precision) {
                log.debug("num", num);
                let e = (num >= 0) ? 1e-6 : -1e-6;
                log.debug("e", e);
                let precs = precision != undefined ? precision : 2;
                log.debug("precs", precs);
                return parseFloat(Math.round(parseFloat(num) * Number("1e"+precs) + e) / Number("1e"+precs));
            }
        }

        return { PYStltHandler }

    });