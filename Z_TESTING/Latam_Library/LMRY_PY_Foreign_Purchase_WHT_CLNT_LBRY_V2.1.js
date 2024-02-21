/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_PY_Foreign_Purchase_WHT_CLNT_LBRY_V2.1.js
 * @Author gerson@latamready.com
 */
define(["N/runtime","N/currency", "N/search", "N/record", "N/format", "N/translation", "N/ui/message", "./LMRY_CustomFieldData_LBRY_V2.1", "./LMRY_Log_LBRY_V2.0"],
    function (runtime, currency, search, record, format, translation, message, lbryCustomField, lbryLog) {
        const ScriptName = "LMRY_PY_Foreign_Purchase_WHT_CLNT_LBRY_V2.1.js";

        class ClntHandler {
            constructor() {
                this.FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                this.FEAT_MULTIBOOK = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
                this.FEAT_DEPT = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
                this.FEAT_LOC = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
                this.FEAT_CLASS = runtime.isFeatureInEffect({ feature: "CLASSES" });
                this.FEAT_INSTALLMENTS = runtime.isFeatureInEffect({ feature: "installments" });

                this.DEPTMANDATORY = runtime.getCurrentUser().getPreference({ name: "DEPTMANDATORY" });
                this.LOCMANDATORY = runtime.getCurrentUser().getPreference({ name: "LOCMANDATORY" });
                this.CLASMANDATORY = runtime.getCurrentUser().getPreference({ name: "CLASSMANDATORY" });

                this.translator = this.getTranslator();
            }

            pageInit(context) {
                try {
                    this.currentRecord = context.currentRecord;
                    let recordObj = context.currentRecord;
                    this.status = recordObj.getValue("custpage_status");
                    this.status = Number(this.status);
                    if (!this.status) {
                        recordObj.setValue({ fieldId: "custpage_date", value: new Date() });
                        if (this.FEAT_SUBS === false || this.FEAT_SUBS === "F") {
                            this.fillVendors();
                            this.fillCurrencies();

                            if (this.FEAT_DEPT === true || this.FEAT_DEPT === "T") {
                                this.fillDepartments();
                            }

                            if (this.FEAT_CLASS === true || this.FEAT_CLASS === "T") {
                                this.fillClasses();
                            }

                            if (this.FEAT_LOC === true || this.FEAT_LOC === "T") {
                                this.fillLocations();
                            }
                        }
                    } else {
                        this.fillCurrencies();
                        this.getWithholdingByRule(recordObj);
                        this.getRulesbyEntity(recordObj);
                    }
                } catch (err) {
                    handleError("[ pageInit ]", err);
                }
                return true;
            }

            fieldChanged(context) {
                try {
                    this.currentRecord = context.currentRecord;
                    let recordObj = this.currentRecord;
                    let fieldId = context.fieldId;
                    let sublistId = context.sublistId;

                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        if (fieldId === "custpage_subsidiary") {
                            this.fillVendors();
                            this.fillCurrencies();
                            if (this.FEAT_DEPT === true || this.FEAT_DEPT === "T") {
                                this.fillDepartments();
                            }

                            if (this.FEAT_CLASS === true || this.FEAT_CLASS === "T") {
                                this.fillClasses();
                            }

                            if (this.FEAT_LOC === true || this.FEAT_LOC === "T") {
                                this.fillLocations();
                            }
                        }
                    }

                    if (fieldId === "custpage_apply_rule") {
                        let rule = recordObj.getValue({ fieldId: "custpage_apply_rule" });
                        if (Number(rule)) {
                            for (var i = 0; i < recordObj.getLineCount("custpage_results_list"); i++) {
                                if (recordObj.getSublistValue({ sublistId: "custpage_results_list", fieldId: "apply", line: i })) {
                                    recordObj.selectLine({ sublistId: "custpage_results_list", line: i });
                                    recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "apply_rule", value: rule });
                                    recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "wht_percent", value: this.whtByRule[rule] || 0 });
                                    let total = recordObj.getSublistValue({ sublistId: "custpage_results_list", fieldId: "total_amt", line: i });
                                    let currency = recordObj.getSublistValue({ sublistId: "custpage_results_list", fieldId: "currencyid", line: i });
                                    let whtamount = this.round(total * (this.whtByRule[rule] || 0) / 100, this.precision[currency]);
                                    recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "wht_amount", value: whtamount });
                                    recordObj.commitLine({ sublistId: "custpage_results_list" });
                                }
                            }
                        }
                    }

                    if (fieldId === "custpage_currency") {
                        this.setExchangeRate();
                    }

                    if (sublistId === "custpage_results_list") {
                        if (fieldId === "apply") {
                            let sublistrule = recordObj.getSublistField({ sublistId: "custpage_results_list", fieldId: "apply_rule", line: context.line });
                            let isApplied = recordObj.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "apply" });
                            if (isApplied) {
                                let vendor = recordObj.getSublistValue({ sublistId: "custpage_results_list", fieldId: "vendorid", line: context.line });
                                let currency = recordObj.getSublistValue({ sublistId: "custpage_results_list", fieldId: "currencyid", line: context.line });
                                if (this.ruleByEntity[vendor]) {
                                    recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "apply_rule", value: this.ruleByEntity[vendor] });
                                    recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "wht_percent", value: this.whtByRule[this.ruleByEntity[vendor]] || 0 });
                                    let total = recordObj.getSublistValue({ sublistId: "custpage_results_list", fieldId: "total_amt", line: context.line });
                                    let whtamount = this.round(total * (this.whtByRule[this.ruleByEntity[vendor]] || 0) / 100, this.precision[currency]);
                                    recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "wht_amount", value: whtamount });
                                }
                                sublistrule.isDisabled = false;
                            } else {
                                recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "apply_rule", value: 0 });
                                recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "wht_percent", value: "" });
                                recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "wht_amount", value: "" });

                                sublistrule.isDisabled = true;
                            }
                        }

                        if (fieldId === "apply_rule") {
                            let currency = recordObj.getSublistValue({ sublistId: "custpage_results_list", fieldId: "currencyid", line: context.line });
                            let rule = recordObj.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "apply_rule" });
                            recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "wht_percent", value: this.whtByRule[rule] || 0 });
                            let total = recordObj.getSublistValue({ sublistId: "custpage_results_list", fieldId: "total_amt", line: context.line });
                            let whtamount = this.round(total * (this.whtByRule[rule] || 0) / 100, this.precision[currency]);
                            recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "wht_amount", value: whtamount });
                        }
                    }

                } catch (err) {
                    handleError("[ fieldChanged ]", err);
                }
                return true;
            }

            saveRecord(context) {
                try {
                    this.currentRecord = context.currentRecord;
                    let recordObj = context.currentRecord;
                    let status = recordObj.getValue({ fieldId: "custpage_status" });
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
                    handleError("[ saveRecord ]", err);
                    return false;
                }
                return true;
            }

            fillVendors() {
                let recordObj = this.currentRecord;
                let vendorField = recordObj.getField({ fieldId: "custpage_vendor" });
                if (vendorField) {
                    let subsidiaryId = 1;
                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        subsidiaryId = recordObj.getValue({ fieldId: "custpage_subsidiary" }) || "";
                    }

                    lbryCustomField.removeDataSelect({ relatedFieldId: "custpage_vendor" });
                    lbryCustomField.removeSearchModal({ id: "vendor_search" });
                    if (subsidiaryId) {
                        lbryCustomField.addEntityDataSelect({
                            id: "vendor_search",
                            relatedFieldId: "custpage_vendor",
                            recordType: "vendor",
                            params: { subsidiaryId: subsidiaryId, countryCode: "PY|PRY" },
                            title: this.getText("vendor_search"),
                            btnLabel: this.getText("search")
                        });
                    }
                }
            }

            fillCurrencies() {
                let recordObj = this.currentRecord;
                let currencyField = recordObj.getField({ fieldId: "custpage_currency" });
                if (currencyField) {
                    let subsidiaryId = "";
                    let currencies = [];
                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        subsidiaryId = recordObj.getValue({ fieldId: "custpage_subsidiary" }) || "";
                    }

                    let filterssetup = [
                        ["isinactive", "is", "F"]
                    ];
                    if (subsidiaryId) {
                        filterssetup.push("AND", ["custrecord_lmry_setuptax_subsidiary", "anyof", subsidiaryId]);
                    }

                    let setupSearch = search.create({
                        type: "customrecord_lmry_setup_tax_subsidiary",
                        filters: filterssetup,
                        columns: ["custrecord_lmry_setuptax_multicurrency"]
                    });

                    let resultsetup = setupSearch.run().getRange({ start: 0, end: 1 });
                    if (resultsetup != null && resultsetup.length > 0) {
                        currencies = resultsetup[0].getValue("custrecord_lmry_setuptax_multicurrency").split(",") || [];
                        currencies = currencies.filter((a) => !isNaN(a) && a !== "");
                        
                        let precision = {};
                        for (let i = 0; i < currencies.length; i++) {
                            let currencyObj = record.load({ type: "currency", id: currencies[i] });
                            precision[currencies[i]] = currencyObj.getValue("currencyprecision");
                        }
                        this.precision = precision;
                    }

                    if (currencies.length && !this.status) {
                        let currencySearch = search.create({
                            type: "currency",
                            filters: [
                                ['isinactive', 'is', 'F'], 'AND',
                                ['internalid', 'anyof', currencies]
                            ],
                            columns: ["name", "internalid"]
                        });

                        let resultcurrency = currencySearch.run().getRange({ start: 0, end: 100 });
                        if (resultcurrency != null && resultcurrency.length > 0) {
                            currencyField.removeSelectOption({ value: null });
                            currencyField.insertSelectOption({ value: 0, text: "&nbsp" });
                            for (let index = 0; index < resultcurrency.length; index++) {
                                let value = resultcurrency[index].getValue("internalid");
                                let text = resultcurrency[index].getValue("name");
                                currencyField.insertSelectOption({ value: value, text: text });
                            }
                        }
                    }
                }
            }

            getWithholdingByRule(recordObj) {
                let data = {};

                let subsidiary = recordObj.getValue("custpage_subsidiary");
                let datefrom = recordObj.getValue("custpage_date_from");
                let dateto = recordObj.getValue("custpage_date_to");
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
                    filters.push("AND", ["custrecord_lmry_ntax_datefrom", "onorbefore", format.format({ value: datefrom, type: format.Type.DATE })]);
                }

                if (dateto) {
                    filters.push("AND", ["custrecord_lmry_ntax_dateto", "onorafter", format.format({ value: dateto, type: format.Type.DATE })]);
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
                console.log("whtByRule: "+JSON.stringify(this.whtByRule));
            }

            getRulesbyEntity(recordObj) {
                let data = {};

                let subsi = recordObj.getValue("custpage_subsidiary");
                let vendor = recordObj.getValue("custpage_vendor");

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
                console.log("ruleByEntity: "+JSON.stringify(this.ruleByEntity));
            }

            validateMandatoryFields() {
                let recordObj = this.currentRecord;
                let mandatoryFields = ["custpage_date"/*, "custpage_vendor", "custpage_currency"*/, "custpage_date_from", "custpage_date_to"];

                if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                    mandatoryFields.push("custpage_subsidiary");
                }

                if ((this.FEAT_DEPT === true || this.FEAT_DEPT === "T") && (this.DEPTMANDATORY === true || this.DEPTMANDATORY === "T")) {
                    mandatoryFields.push('custpage_department');
                }

                if ((this.FEAT_CLASS === true || this.FEAT_CLASS === "T") && (this.CLASMANDATORY === true || this.CLASMANDATORY === "T")) {
                    mandatoryFields.push('custpage_class');
                }

                if ((this.FEAT_LOC === true || this.FEAT_LOC === "T") && (this.LOCMANDATORY === true || this.LOCMANDATORY === "T")) {
                    mandatoryFields.push('custpage_location');
                }

                for (let i = 0; i < mandatoryFields.length; i++) {
                    let fieldObj = recordObj.getField({ fieldId: mandatoryFields[i] });
                    if (fieldObj) {
                        let value = recordObj.getValue({ fieldId: mandatoryFields[i] }) || "";
                        value = Number(value);
                        if (!value) {
                            //Please enter value(s) for: {1}
                            alert(this.getText("msg_mandatory_fields", [fieldObj.label]));
                            return false;
                        }
                    }
                }
                return true;
            }

            validateDates() {
                let recordObj = this.currentRecord;
                let issueDate = recordObj.getValue("custpage_date");
                if (issueDate) {
                    issueDate = format.parse({ value: issueDate, type: format.Type.DATE });
                }
                let dateFrom = recordObj.getValue("custpage_date_from");
                if (dateFrom) {
                    dateFrom = format.parse({ value: dateFrom, type: format.Type.DATE });
                }
                let dateTo = recordObj.getValue("custpage_date_to");
                if (dateTo) {
                    dateTo = format.parse({ value: dateTo, type: format.Type.DATE });
                }

                if (dateFrom) {
                    if (dateFrom > issueDate) {
                        //The date in "{1}" must be on or before the date in "{2}".
                        let fieldDateFromObj = recordObj.getField({ fieldId: "custpage_date_from" });
                        let fieldIssueDateObj = recordObj.getField({ fieldId: "custpage_date" });
                        alert(this.getText("msg_validation_dates", [fieldDateFromObj.label, fieldIssueDateObj.label]));
                        return false;
                    }
                }
                if (dateTo) {
                    if (issueDate > dateTo) {
                        //The date in "{1}" must be on or before the date in "{2}".
                        let fieldIssueDateObj = recordObj.getField({ fieldId: "custpage_date" });
                        let fieldDateToObj = recordObj.getField({ fieldId: "custpage_date_to" });
                        alert(this.getText("msg_validation_dates", [fieldIssueDateObj.label, fieldDateToObj.label]));
                        return false;
                    }
                }
                if (dateFrom && dateTo) {
                    if (dateFrom > dateTo) {
                        //The date in "{1}" must be on or before the date in "{2}".
                        let fieldDateFromObj = recordObj.getField({ fieldId: "custpage_date_from" });
                        let fieldDateToObj = recordObj.getField({ fieldId: "custpage_date_to" });
                        alert(this.getText("msg_validation_dates", [fieldDateFromObj.label, fieldDateToObj.label]));
                        return false;
                    }
                }

                return true;
            }

            validateSublist() {
                let recordObj = this.currentRecord;
                let numberLines = recordObj.getLineCount({ sublistId: "custpage_results_list" });
                let numApplieds = 0;
                if (numberLines < 1) {
                    //There is no transactions to pay.
                    alert(this.getText("msg_empty_list"));
                    return false;
                } else {
                    for (let i = 0; i < numberLines; i++) {
                        recordObj.selectLine({ sublistId: "custpage_results_list", line: i });
                        let isApplied = recordObj.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "apply" });
                        if (isApplied) {
                            numApplieds++;
                        }
                    }

                    if (!numApplieds) {
                        //Select transactions to pay.
                        alert(this.getText("msg_no_selected"));
                        return false;
                    }
                }

                return true;
            }

            validateExecution() {
                let mprd_scp = "customscript_lmry_py_wht_purchase_mprd";
                let mprd_dep = "customdeploy_lmry_py_wht_purchase_mprd";
                let search_executions = search.create({
                    type: "scheduledscriptinstance",
                    filters: [
                        ["status", "anyof", "PENDING", "PROCESSING"], "AND",
                        ["script.scriptid", "is", mprd_scp], "AND",
                        ["scriptdeployment.scriptid", "is", mprd_dep]
                    ],
                    columns: [
                        search.createColumn({
                            name: "timestampcreated",
                            sort: search.Sort.DESC
                        }),
                        "mapreducestage",
                        "status",
                        "taskid"
                    ]
                });

                let results = search_executions.run().getRange(0, 1);

                if (results && results.length) {
                    let myMsg = message.create({
                        title: this.getText("msg_alert"),
                        message: this.getText("msg_process_in_execution"),
                        type: message.Type.INFORMATION,
                        duration: 8000
                    });
                    myMsg.show();
                    return false;
                }

                return true;
            }

            fillDepartments() {
                let recordObj = this.currentRecord;
                let departmentField = recordObj.getField({ fieldId: "custpage_department" });
                if (departmentField) {
                    departmentField.removeSelectOption({ value: null });
                    departmentField.insertSelectOption({ value: 0, text: "&nbsp;" });
                    let subsidiary = 1;
                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        subsidiary = recordObj.getValue('custpage_subsidiary');
                    }

                    if (Number(subsidiary)) {
                        departmentField.isDisabled = true;
                        let filters = [
                            ["isinactive", "is", "F"]
                        ];

                        if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                            filters.push("AND", ["subsidiary", "anyof", subsidiary]);
                        }

                        search.create.promise({
                            type: 'department',
                            filters: filters,
                            columns: ['internalid', 'name']
                        }).then(function (depSearch) {
                            return depSearch.run().getRange.promise(0, 1000);
                        }).then(function (results) {
                            if (results) {
                                for (let i = 0; i < results.length; i++) {
                                    let id = results[i].getValue('internalid');
                                    let name = results[i].getValue('name');
                                    departmentField.insertSelectOption({ value: id, text: name });
                                }
                            }
                            departmentField.isDisabled = false;
                        }).catch(function (err) {
                            departmentField.isDisabled = false;
                            handleError("[ fillDepartments ]", err);
                        });
                    }
                }
            }

            fillClasses() {
                let recordObj = this.currentRecord;
                let classField = recordObj.getField({ fieldId: "custpage_class" });
                if (classField) {
                    classField.removeSelectOption({ value: null });
                    classField.insertSelectOption({ value: 0, text: "&nbsp;" });
                    let subsidiary = 1;
                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        subsidiary = recordObj.getValue('custpage_subsidiary');
                    }

                    if (Number(subsidiary)) {
                        classField.isDisabled = true;
                        let filters = [
                            ["isinactive", "is", "F"]
                        ];

                        if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                            filters.push("AND", ["subsidiary", "anyof", subsidiary]);
                        }

                        search.create.promise({
                            type: 'classification',
                            filters: filters,
                            columns: ['internalid', 'name']
                        }).then(function (classSearch) {
                            return classSearch.run().getRange.promise(0, 1000);
                        }).then(function (results) {
                            if (results) {
                                for (let i = 0; i < results.length; i++) {
                                    let id = results[i].getValue('internalid');
                                    let name = results[i].getValue('name');
                                    classField.insertSelectOption({ value: id, text: name });
                                }
                            }
                            classField.isDisabled = false;
                        }).catch(function (err) {
                            classField.isDisabled = false;
                            handleError("[ fillClasses ]", err);
                        });
                    }
                }
            }

            fillLocations() {
                let recordObj = this.currentRecord;
                let locationField = recordObj.getField({ fieldId: "custpage_location" });
                if (locationField) {
                    locationField.removeSelectOption({ value: null });
                    locationField.insertSelectOption({ value: 0, text: "&nbsp;" });
                    let subsidiary = 1;
                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        subsidiary = recordObj.getValue('custpage_subsidiary');
                    }

                    if (Number(subsidiary)) {
                        locationField.isDisabled = true;
                        let filters = [
                            ["isinactive", "is", "F"]
                        ];

                        if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                            filters.push("AND", ["subsidiary", "anyof", subsidiary]);
                        }

                        search.create.promise({
                            type: 'location',
                            filters: filters,
                            columns: ['internalid', 'name']
                        }).then(function (locationSearch) {
                            return locationSearch.run().getRange.promise(0, 1000);
                        }).then(function (results) {
                            if (results) {
                                for (let i = 0; i < results.length; i++) {
                                    let id = results[i].getValue('internalid');
                                    let name = results[i].getValue('name');
                                    locationField.insertSelectOption({ value: id, text: name });
                                }
                            }
                            locationField.isDisabled = false;
                        }).catch(function (err) {
                            locationField.isDisabled = false;
                            handleError("[ fillLocations ]", err);
                        });
                    }
                }
            }

            createRecordLog() {
                let currentRecord = this.currentRecord;
                let billsData = {};

                let numberLines = currentRecord.getLineCount({ sublistId: "custpage_results_list" });
                for (let i = 0; i < numberLines; i++) {
                    let isApplied = currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "apply", line: i });

                    if (isApplied) {
                        let internalid = currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "internalidtext", line: i }) || "";
                        let vendor = currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "vendorid", line: i }) || "";
                        let currencyline = currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "currencyid", line: i }) || "";
                        let total_amt = currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "total_amt", line: i }) || 0.00;

                        currentRecord.selectLine({ sublistId: "custpage_results_list", line: i });
                        let apply_rule = currentRecord.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "apply_rule" }) || "";
                        let wht_percent = currentRecord.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "wht_percent" }) || "";
                        let wht_amount = currentRecord.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "wht_amount" }) || 0.00;

                        billsData[internalid] = {
                            vendor: vendor,
                            currency: currencyline,
                            total_amt: total_amt,
                            apply_rule: apply_rule,
                            wht_percent: wht_percent,
                            wht_amount: wht_amount
                        }

                    }
                }

                let subsidiary = Number(currentRecord.getValue({ fieldId: "custpage_subsidiary" })) || "";
                let entity = Number(currentRecord.getValue({ fieldId: "custpage_vendor" })) || "";
                let currency = Number(currentRecord.getValue({ fieldId: "custpage_currency" })) || "";
                let date = currentRecord.getValue({ fieldId: "custpage_date" });
                let datefrom = currentRecord.getValue({ fieldId: "custpage_date_from" });
                let dateto = currentRecord.getValue({ fieldId: "custpage_date_to" });
                let memo = currentRecord.getValue({ fieldId: "custpage_memo" });
                let batch = currentRecord.getValue({ fieldId: "custpage_batch" });
                let department = Number(currentRecord.getValue({ fieldId: "custpage_department" })) || "";
                let class_ = Number(currentRecord.getValue({ fieldId: "custpage_class" })) || "";
                let location = Number(currentRecord.getValue({ fieldId: "custpage_location" })) || "";

                let jsonRecord = {
                    "subsidiary": subsidiary,
                    "entity": entity,
                    "currency": currency,
                    "date": date,
                    "datefrom": datefrom,
                    "dateto": dateto,
                    "memo": memo,
                    "department": department,
                    "class_": class_,
                    "location": location,
                    "batch": batch
                }

                console.log(jsonRecord);

                // Creacion de Logs
                let recordlog = record.create({
                    type: "customrecord_lmry_py_wht_purchase"
                });

                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_subsidiary", value: subsidiary });
                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_user", value: runtime.getCurrentUser().id });
                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_entity", value: entity });
                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_currency", value: currency });
                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_datefrom", value: datefrom });
                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_dateto", value: dateto });
                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_memo", value: memo });
                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_batch", value: batch });
                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_dateissue", value: date });
                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_department", value: department });
                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_class", value: class_ });
                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_location", value: location });
                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_status", value: "4" });
                recordlog.setValue({ fieldId: "custrecord_lmry_py_wht_data", value: JSON.stringify(billsData) });

                let idlog = recordlog.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });

                currentRecord.setValue({ fieldId: "custpage_log_id", value: idlog, ignoreFieldChange: true });

                console.log("idlog: " + idlog);
                return true;
            }

            round(num, precision) {
                var e = (num >= 0) ? 1e-6 : -1e-6;
                precision = precision != undefined ? precision : 2;
                return parseFloat(Math.round(parseFloat(num) * Number("1e"+precision) + e) / Number("1e"+precision));
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

            getTranslator() {
                return translation.load({
                    collections: [{
                        alias: "text",
                        collection: "custcollection_lmry_translations",
                        keys: [
                            "vendor_search", "search", "msg_mandatory_fields", "msg_validation_dates", "msg_empty_list", "msg_no_selected",
                            "msg_alert", "msg_process_in_execution"
                        ]
                    }]
                });
            }

            setExchangeRate(){
                const recordObj = this.currentRecord;
                const subsidiaryValue =  recordObj.getValue("custpage_subsidiary");
                const currencyValue =  recordObj.getValue("custpage_currency");
                const dateValue =  recordObj.getValue("custpage_date");

                const rateField =  recordObj.getField("custpage_exchange_rate");
                let companyCurrency;
                let rate;
                console.log("subsidiaryValue :",subsidiaryValue)
                console.log("currencyValue :",currencyValue)
                console.log("currencyValue typeof:",typeof currencyValue)
                console.log("dateValue :",dateValue)

                if (this.FEAT_SUBS) {
                    if (subsidiaryValue) {
                        companyCurrency = search.lookupFields({
                            type: search.Type.SUBSIDIARY,
                            id: subsidiaryValue,
                            columns: ["currency"]
                        }).currency[0].value;
                    }
                }else{
                    companyCurrency = "11";
                }
                console.log("companyCurrency :",companyCurrency)
                if (companyCurrency && (currencyValue && currencyValue!="0") && dateValue) {
                    rate = currency.exchangeRate({
                        source: currencyValue,
                        target: companyCurrency,
                        date: dateValue
                    });

                    recordObj.setValue({ fieldId: "custpage_exchange_rate", value: rate });

                    if (rate==1) {
                        rateField.isDisabled = true;
                    }else{
                        rateField.isDisabled = false;
                    }
                }
                console.log("rate :",rate)
            }

           
        }

        function handleError(functionName, err) {
            console.error(functionName, err);
            lbryLog.doLog({ title: functionName, message: err, relatedScript: ScriptName });
            alert(functionName + "\n" + JSON.stringify({ name: err.name, message: err.message }));
        }


        return {
            ClntHandler: ClntHandler
        };
    });