/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for WTH on Purchases                           ||
||                                                              ||
||  File Name: LMRY_BR_WHT_Purchase_CLNT_LBRY_V2.1.js           ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Oct 31 2022  LatamReady    Use Script 2.1           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Author gerson@latamready.com
 */
define(["N/runtime", "N/search", "N/record", "N/format", "N/translation", "N/query", "N/currency", "N/ui/message", "./LMRY_CustomFieldData_LBRY_V2.1", "./LMRY_Log_LBRY_V2.0", "./LMRY_libSendingEmailsLBRY_V2.0"],
    function (runtime, search, record, format, translation, query, currencyApi, message, lbryCustomField, lbryLog, lbryMail) {
        const ScriptName = "LMRY_BR_WHT_Purchase_CLNT_LBRY_V2.1.js";

        class ClntHandler {
            constructor(options) {
                this.FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                this.FEAT_MULTIBOOK = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
                this.FEAT_DEPT = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
                this.FEAT_LOC = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
                this.FEAT_CLASS = runtime.isFeatureInEffect({ feature: "CLASSES" });
                this.FEAT_INSTALLMENTS = runtime.isFeatureInEffect({ feature: "installments" });

                this.DEPTMANDATORY = runtime.getCurrentUser().getPreference({ name: "DEPTMANDATORY" });
                this.LOCMANDATORY = runtime.getCurrentUser().getPreference({ name: "LOCMANDATORY" });
                this.CLASMANDATORY = runtime.getCurrentUser().getPreference({ name: "CLASSMANDATORY" });

                this.deploy = options.deployid || "";
                this.featurelatam = options.featurelatam || "F";
                this.names = this.getNames(this.deploy);

                this.translator = this.getTranslator();
            }

            getNames(deploy) {
                let nameList = {
                    "customdeploy_lmry_br_wht_pur_stlt": {
                        title: "title_br_wht_pur",
                        process: "Individual",
                        scriptmprd: "customscript_lmry_br_wht_purchase_mprd",
                        deploymprd: "customdeploy_lmry_br_wht_purchase_mprd"
                    },
                    "customdeploy_lmry_br_wht_pur_mas_stlt": {
                        title: "title_br_wht_pur_mas",
                        process: "Massive",
                        scriptmprd: "customscript_lmry_br_massive_wht_mprd",
                        deploymprd: "customdeploy_lmry_br_massive_wht_mprd"
                    }
                };
                return nameList[deploy];
            }

            pageInit(context) {
                try {
                    this.currentRecord = context.currentRecord;
                    let recordObj = context.currentRecord;
                    this.status = recordObj.getValue("custpage_status");
                    this.status = Number(this.status);
                    let idEnt = recordObj.getValue("custpage_vendor");
                    if (idEnt && !this.status) {
                        this.fillCurrenciesByEntity();
                        this.fillAccounts();
                        if (this.FEAT_DEPT === true || this.FEAT_DEPT === "T") {
                            this.fillDepartments();
                        }

                        if (this.FEAT_CLASS === true || this.FEAT_CLASS === "T") {
                            this.fillClasses();
                        }

                        if (this.FEAT_LOC === true || this.FEAT_LOC === "T") {
                            this.fillLocations();
                        }
                        this.fillBankAccounts();
                        this.fillReclassAccounts();
                        this.fillPaymentMethods();
                    }


                    if (!this.status) {
                        recordObj.setValue({ fieldId: "custpage_date", value: new Date() });
                        //recordObj.setValue({ fieldId: "custpage_duedate", value: new Date(), ignoreFieldChange: true });
                        this.fillPeriod();
                        this.setPeriodByDate();
                        if (this.FEAT_SUBS === false || this.FEAT_SUBS === "F") {
                            if (this.names["process"] == "Individual") {
                                this.fillVendors();
                            } else {
                                this.fillMultiVendors();
                                this.fillCurrencies();
                            }
                            this.fillAccounts();
                            if (this.FEAT_DEPT === true || this.FEAT_DEPT === "T") {
                                this.fillDepartments();
                            }

                            if (this.FEAT_CLASS === true || this.FEAT_CLASS === "T") {
                                this.fillClasses();
                            }

                            if (this.FEAT_LOC === true || this.FEAT_LOC === "T") {
                                this.fillLocations();
                            }
                        } else {
                            if (this.names["process"] == "Massive") {
                                let vendorField = recordObj.getField({ fieldId: "custpage_multi_vendor" });
                                vendorField.isDisplay = false;
                            }
                        }
                    } else {
                        let queryParams = new URLSearchParams(window.location.search);
                        let byTransaction = queryParams.get('byTransaction');
                        if (byTransaction =="1") {
                            recordObj.setValue({ fieldId: "custpage_date", value: new Date() });
                            this.fillPeriod();
                            this.setPeriodByDate();
                            if (this.FEAT_DEPT === true || this.FEAT_DEPT === "T") {
                                this.fillDepartments();
                            }

                            if (this.FEAT_CLASS === true || this.FEAT_CLASS === "T") {
                                this.fillClasses();
                            }

                            if (this.FEAT_LOC === true || this.FEAT_LOC === "T") {
                                this.fillLocations();
                            }
                            this.fillBankAccounts();
                            this.fillReclassAccounts();
                        }
                        this.firstPay = this.firstPayment();
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
                            if (this.names["process"] == "Individual") {
                                this.fillVendors();
                            } else {
                                this.fillMultiVendors();
                                this.fillCurrencies();
                            }
                            this.fillAccounts();
                            if (this.FEAT_DEPT === true || this.FEAT_DEPT === "T") {
                                this.fillDepartments();
                            }

                            if (this.FEAT_CLASS === true || this.FEAT_CLASS === "T") {
                                this.fillClasses();
                            }

                            if (this.FEAT_LOC === true || this.FEAT_LOC === "T") {
                                this.fillLocations();
                            }
                            this.fillBankAccounts();
                            this.fillReclassAccounts();
                            this.fillPaymentMethods();
                        }
                    }

                    if (fieldId === "custpage_date") {
                        this.setPeriodByDate();
                    }

                    if (fieldId === "custpage_vendor") {
                        this.fillCurrenciesByEntity();
                    }

                    if (fieldId === "custpage_currency") {
                        this.fillBankAccounts();
                    }

                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        if (fieldId === "custpage_currency" || fieldId === "custpage_date" || fieldId === "custpage_subsidiary") {
                            this.setExchangeRate();
                        }
                    }

                    if (sublistId === "custpage_results_list") {
                        if (fieldId === "apply") {
                            let sublistpaymentamt = recordObj.getSublistField({ sublistId: "custpage_results_list", fieldId: "payment_amt", line: context.line });
                            let sublistpenalty = recordObj.getSublistField({ sublistId: "custpage_results_list", fieldId: "penalty", line: context.line });
                            let sublistinterest = recordObj.getSublistField({ sublistId: "custpage_results_list", fieldId: "interest", line: context.line });
                            let isApplied = recordObj.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "apply" });
                            let amountdue = "";
                            if (isApplied) {
                                amountdue = recordObj.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "amount_due" });
                                recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "payment_amt", value: Number(amountdue), ignoreFieldChange: true });

                                sublistpaymentamt.isDisabled = false;
                                sublistpenalty.isDisabled = false;
                                sublistinterest.isDisabled = false;
                            } else {
                                recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "payment_amt", value: "", ignoreFieldChange: true });
                                recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "penalty", value: "", ignoreFieldChange: true });
                                recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "interest", value: "", ignoreFieldChange: true });

                                sublistpaymentamt.isDisabled = true;
                                sublistpenalty.isDisabled = true;
                                sublistinterest.isDisabled = true;
                            }
                            recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "payment_amt", value: amountdue, ignoreFieldChange: true });
                        }

                        if (fieldId === "payment_amt") {
                            let payment = recordObj.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "payment_amt" });
                            payment = Number(payment);
                            let amountdue = recordObj.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "amount_due" });
                            amountdue = Number(amountdue);
                            if (payment > amountdue) {
                                payment = amountdue;
                            } else if (payment <= 0) {
                                payment = "";
                                recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "apply", value: false });
                            }
                            recordObj.setCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "payment_amt", value: payment, ignoreFieldChange: true });

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

                        if (!this.validateReclassAccount()) {
                            return false;
                        }

                        if (!this.validateDates()) {
                            return false;
                        }
                    } else {
                        if (!this.validateMandatoryFields()) {
                            return false;
                        }
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
                            params: { subsidiaryId: subsidiaryId },
                            title: this.getText("vendor_search"),
                            btnLabel: this.getText("search")
                        });
                    }
                }
            }

            fillMultiVendors() {
                let recordObj = this.currentRecord;
                let vendorField = recordObj.getField({ fieldId: "custpage_multi_vendor" });
                if (vendorField) {
                    let subsidiaryId = 1;
                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        subsidiaryId = recordObj.getValue({ fieldId: "custpage_subsidiary" }) || "";
                    }

                    lbryCustomField.removeDataSelect({ relatedFieldId: "custpage_multi_vendor", multiselect: true });
                    lbryCustomField.removeSearchModal({ id: "vendor_search" });
                    if (subsidiaryId) {
                        let licenses = lbryMail.getLicenses(subsidiaryId);
                        if (!lbryMail.getAuthorization(874, licenses)) {
                            vendorField.isDisplay = false;
                        } else {
                            vendorField.isDisplay = true;
                            lbryCustomField.addEntityDataSelect({
                                id: "vendor_search",
                                relatedFieldId: "custpage_multi_vendor",
                                recordType: "vendor",
                                params: { subsidiaryId: subsidiaryId },
                                title: this.getText("vendor_search"),
                                btnLabel: this.getText("search")
                            });
                        }
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
                        currencies.filter((a) => !isNaN(a));
                        console.log(currencies);
                    }

                    if (currencies.length) {
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
                    /*lbryCustomField.removeDataSelect({ relatedFieldId: "custpage_vendor" });
                    lbryCustomField.removeSearchModal({ id: "vendor_search" });
                    if (subsidiaryId) {
                        lbryCustomField.addEntityDataSelect({
                            id: "vendor_search",
                            relatedFieldId: "custpage_vendor",
                            recordType: "vendor",
                            params: { subsidiaryId: subsidiaryId },
                            title: this.getText("vendor_search"),
                            btnLabel: this.getText("search")
                        });
                    }*/
                }
            }

            validateMandatoryFields() {
                let recordObj = this.currentRecord;
                let mandatoryFields = ["custpage_vendor", "custpage_currency", "custpage_date", "custpage_bank_account", "custpage_ap_account", "custpage_exchange_rate", "custpage_payment_method"];

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
                let paymentDate = recordObj.getValue("custpage_date");
                if (paymentDate) {
                    paymentDate = format.parse({ value: paymentDate, type: format.Type.DATE });
                }
                let dueDate = recordObj.getValue("custpage_duedate");
                if (dueDate) {
                    dueDate = format.parse({ value: dueDate, type: format.Type.DATE });
                }

                if (dueDate) {
                    if (dueDate > paymentDate) {
                        //The date in "{1}" must be on or before the date in "{2}".
                        let fieldDateObj = recordObj.getField({ fieldId: "custpage_date" });
                        let fieldDuedateObj = recordObj.getField({ fieldId: "custpage_duedate" });
                        alert(this.getText("msg_validation_dates", [fieldDuedateObj.label, fieldDateObj.label]));
                        return false;
                    }
                }

                return true;
            }

            validateReclassAccount() {
                let recordObj = this.currentRecord;
                let reclassAccount = recordObj.getValue("custpage_reclass_account");
                console.log('reclassAccount: ' + reclassAccount);
                let currency = recordObj.getValue("custpage_currency");
                let currencySub = "";
                let subsidiary = 1;
                if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                    subsidiary = recordObj.getValue("custpage_subsidiary");
                    console.log('subsidiary: ' + subsidiary);
                    currencySub = search.lookupFields({ type: "subsidiary", id: subsidiary, columns: ["currency"] }).currency[0].value;
                    console.log('currencySub: ' + currencySub);
                }

                if (Number(reclassAccount)) {
                    console.log('reclassAccount2: ' + reclassAccount);
                    let accountReclassif = record.load({ type: "account", id: reclassAccount, isDynamic: true });
                    let currencyReclassif = accountReclassif.getValue("currency");
                    if (currencyReclassif != null && currencyReclassif != "") {
                        let validate = false;
                        if (currencyReclassif != currency) {
                            validate = true;
                        }
                        if (currencySub && currencyReclassif != currencySub) {
                            validate = true;
                        }
                        if (validate) {
                            alert(this.getText("msg_reclass_account"));
                            return false;
                        }
                    }

                    let proveedor = "";
                    let filtersproveedor = [
                        ["isinactive", "is", "F"], "AND",
                        ["custrecord_lmry_br_cuenta_tarjeta", "anyof", reclassAccount]
                    ];
                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        filtersproveedor.push("AND", ["custrecord_lmry_br_subsidiary", "anyof", subsidiary]);
                    }

                    let search_proveedor = search.create({
                        type: "customrecord_lmry_br_reclasif_tarjeta",
                        filters: filtersproveedor,
                        columns: ["custrecord_lmry_br_proveedor"]
                    });
                    let result_proveedor = search_proveedor.run().getRange({ start: 0, end: 1 });

                    if (result_proveedor != null && result_proveedor.length > 0) {
                        proveedor = result_proveedor[0].getValue("custrecord_lmry_br_proveedor");
                    }

                    if (proveedor) {
                        let filtersreclassif = [
                            ["vendorcurrencybalance.currency", "anyof", currency], "AND",
                            ["internalid", "anyof", proveedor], "AND",
                            ["isinactive", "is", "F"]
                        ];
                        if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                            filtersreclassif.push("AND", ["msesubsidiary.internalid", "anyof", subsidiary]);
                        }

                        let search_acc_reclassif = search.create({
                            type: "vendor",
                            filters: filtersreclassif,
                            columns: ["internalid"]
                        });

                        let result_acc_reclassif = search_acc_reclassif.run().getRange({ start: 0, end: 1000 });

                        if (result_acc_reclassif.length == 0) {
                            alert(this.getText("msg_reclass_vendor"));
                            return false;
                        }
                    } else {
                        alert(this.getText("msg_reclass_vendor"));
                        return false;
                    }
                }



                return true;
            }

            validateSublist() {
                let recordObj = this.currentRecord;
                let numberLines = recordObj.getLineCount({ sublistId: "custpage_results_list" });
                let numApplieds = 0;
                let numAdvanceApplieds = 0;
                if (numberLines < 1) {
                    //There is no transactions to pay.
                    alert(this.getText("msg_empty_list"));
                    return false;
                } else {
                    let auxLinePay = { amount: 0, advance: 0, amountdue: 0 };
                    for (let i = 0; i < numberLines; i++) {
                        recordObj.selectLine({ sublistId: "custpage_results_list", line: i });
                        let isApplied = recordObj.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "apply" });
                        if (isApplied) {
                            let isAdvance = recordObj.getSublistValue({ sublistId: "custpage_results_list", fieldId: "advance", line: i });
                            let payment_amt = recordObj.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "payment_amt" });
                            let amount_due = recordObj.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "amount_due" });
                            isAdvance ? numAdvanceApplieds++ : numApplieds++;
                            auxLinePay.advance = Number(isAdvance);
                            auxLinePay.amount = Number(payment_amt);
                            auxLinePay.amountdue = Number(amount_due);
                            console.log([isApplied, isAdvance, i].join(";"));
                        }
                    }

                    if (!numApplieds && !numAdvanceApplieds) {
                        //Select transactions to pay.
                        alert(this.getText("msg_no_selected"));
                        return false;
                    }

                    if (numAdvanceApplieds > 1) {
                        //There are more than 1 Bill with advance payment selected.
                        alert(this.getText("msg_many_advance"));
                        return false;
                    }

                    if (numAdvanceApplieds == 1 && numApplieds > 0) {
                        //It is not possible to pay an Bill with advance and others without advance at the same time.
                        alert(this.getText("msg_advance_conflict"));
                        return false;
                    }

                    if (numAdvanceApplieds == 1) {
                        let auxAmount = 0;
                        let advanceApplied = 0;
                        for (let i = 0; i < recordObj.getLineCount({ sublistId: "custpage_advances_list" }); i++) {
                            recordObj.selectLine({ sublistId: "custpage_advances_list", line: i });
                            let isApplied = recordObj.getCurrentSublistValue({ sublistId: "custpage_advances_list", fieldId: "apply" });
                            let amount = recordObj.getSublistValue({ sublistId: "custpage_advances_list", fieldId: "total_amt", line: i });
                            console.log([isApplied, amount, i].join(";"));
                            if (isApplied) {
                                auxAmount = amount;
                                advanceApplied++;
                            }
                        }

                        if (!advanceApplied) {
                            //Select Advance to pay.
                            alert(this.getText("msg_no_advance_selected"));
                            return false;
                        }

                        if (advanceApplied > 1) {
                            //Select only one Advance to pay.
                            alert(this.getText("msg_many_advance_selected"));
                            return false;
                        }

                        if (auxLinePay.advance != auxAmount) {
                            //The amount of the advance does not match.
                            alert(this.getText("msg_no_match_amount"));
                            return false;
                        }

                        if (auxAmount + auxLinePay.amount > auxLinePay.amountdue) {
                            //You cannot pay that amount, consider the Advance.
                            alert(this.getText("msg_advance_exceeds"));
                            return false;
                        }
                    }
                }

                return true;
            }

            validateExecution() {
                let mprd_scp = this.featurelatam == "T" ? "customscript_lmry_br_wht_pur_mprd" : this.names["scriptmprd"];
                let mprd_dep = this.featurelatam == "T" ? "customdeploy_lmry_br_wht_pur_mprd" : this.names["deploymprd"];
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

            fillPeriod() {
                this.periods = {};
                let recordObj = this.currentRecord;
                let periodField = recordObj.getField({ fieldId: "custpage_period" });
                if (periodField) {
                    periodField.removeSelectOption({ value: null });
                    periodField.insertSelectOption({ value: 0, text: "&nbsp" });

                    let periodSearch = search.create({
                        type: "accountingperiod",
                        filters:
                            [
                                ["isadjust", "is", "F"], "AND",
                                ["isquarter", "is", "F"], "AND",
                                ["isinactive", "is", "F"], "AND",
                                ["isyear", "is", "F"], "AND",
                                ["closed", "is", "F"]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "internalid",
                                    sort: search.Sort.DESC
                                }),
                                "periodname",
                                "startdate",
                                "enddate"
                            ]
                    });

                    let results = periodSearch.run().getRange(0, 1000);
                    if (results) {
                        for (let i = 0; i < results.length; i++) {
                            let id = results[i].getValue("internalid");
                            let name = results[i].getValue("periodname");
                            let startDate = results[i].getValue("startdate");
                            startDate = format.parse({ value: startDate, type: format.Type.DATE });
                            let endDate = results[i].getValue("enddate");
                            endDate = format.parse({ value: endDate, type: format.Type.DATE });

                            if (!this.periods.hasOwnProperty(id)) {
                                this.periods[id] = {
                                    id: id,
                                    name: name,
                                    startDate: startDate,
                                    endDate: endDate
                                };
                                periodField.insertSelectOption({ value: id, text: name });
                            }
                        }
                    }
                }
            }

            setPeriodByDate() {
                let recordObj = this.currentRecord;
                let date = recordObj.getValue({ fieldId: "custpage_date" });
                if (this.periods && date) {
                    for (let id in this.periods) {
                        if (this.periods[id].startDate <= date && date <= this.periods[id].endDate) {
                            recordObj.setValue({ fieldId: "custpage_period", value: id, ignoreFieldChange: true });
                            break;
                        }
                    }
                }
            };

            fillAccounts() {

                let recordObj = this.currentRecord;

                let accountField = recordObj.getField({ fieldId: "custpage_ap_account" });
                if (accountField) {
                    accountField.isDisabled = true;
                    accountField.removeSelectOption({ value: null });
                    accountField.insertSelectOption({ value: 0, text: "&nbsp;" });

                    let subsidiary = 1;
                    let feature_subsi = this.FEAT_SUBS;
                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        subsidiary = recordObj.getValue({ fieldId: "custpage_subsidiary" });
                    }

                    if (Number(subsidiary)) {
                        search.load.promise({
                            id: "customsearch_lmry_wht_account_payable"
                        }).then(function (accountSearch) {
                            if (feature_subsi === true || feature_subsi === "T") {
                                accountSearch.filters.push(search.createFilter({
                                    name: "subsidiary",
                                    operator: "anyof",
                                    values: [subsidiary]
                                }));
                            }
                            return accountSearch.run().getRange.promise(0, 1000);
                        }).then(function (results) {
                            if (results) {
                                for (let i = 0; i < results.length; i++) {
                                    let columns = results[i].columns;
                                    let id = results[i].getValue(columns[0]);
                                    let name = results[i].getValue(columns[1]);
                                    accountField.insertSelectOption({ value: id, text: name });
                                }
                            }
                            accountField.isDisabled = false;
                        }).catch(function (err) {
                            accountField.isDisabled = false;
                            handleError("[ fillAccounts ]", err);
                        });
                    }
                }
            }

            fillBankAccounts() {
                let recordObj = this.currentRecord;
                let accountField = recordObj.getField({ fieldId: "custpage_bank_account" });
                if (accountField) {
                    accountField.removeSelectOption({ value: null });
                    accountField.insertSelectOption({ value: 0, text: "&nbsp;" });
                    let currency = recordObj.getValue({ fieldId: "custpage_currency" }) || "";

                    let subsidiary = 1;
                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        subsidiary = recordObj.getValue({ fieldId: "custpage_subsidiary" }) || "";
                    }

                    if (Number(subsidiary) && Number(currency)) {
                        let currencies = [currency];
                        if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                            let subsidiaryCurrency = search.lookupFields({
                                type: "subsidiary",
                                id: subsidiary,
                                columns: ["currency"]
                            }).currency || "";

                            if (subsidiaryCurrency && subsidiaryCurrency.length) {
                                subsidiaryCurrency = subsidiaryCurrency[0].value;
                            }

                            if (subsidiaryCurrency && Number(currency) !== Number(subsidiaryCurrency)) {
                                currencies.push(subsidiaryCurrency);
                            }
                        }

                        let accountQuery = query.create({
                            type: "account"
                        });

                        let conditions = [
                            accountQuery.createCondition({
                                fieldId: "accttype",
                                operator: query.Operator.ANY_OF,
                                values: ["Bank"]
                            }),
                            accountQuery.createCondition({
                                fieldId: "currency",
                                operator: query.Operator.ANY_OF,
                                values: currencies
                            }),
                            accountQuery.createCondition({
                                fieldId: "isinactive",
                                operator: query.Operator.IS,
                                values: [false]
                            })
                        ];

                        if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                            conditions.push(accountQuery.createCondition({
                                fieldId: "subsidiary",
                                operator: query.Operator.INCLUDE_ANY,
                                values: [subsidiary]
                            }));
                        }
                        accountQuery.condition = accountQuery.and(conditions);
                        accountQuery.columns = [
                            accountQuery.createColumn({
                                fieldId: "id"
                            }),
                            accountQuery.createColumn({
                                fieldId: "displaynamewithhierarchy",
                                alias: "name"
                            })
                        ];

                        let results = accountQuery.run().asMappedResults();
                        for (let i = 0; i < results.length; i++) {
                            let id = results[i].id;
                            let name = results[i].name;
                            if (id) {
                                accountField.insertSelectOption({ value: id, text: name });
                            }
                        }
                    }
                }
            }

            fillReclassAccounts() {
                let recordObj = this.currentRecord;
                let reclassAccountField = recordObj.getField({ fieldId: "custpage_reclass_account" });
                if (reclassAccountField) {
                    reclassAccountField.removeSelectOption({ value: null });
                    reclassAccountField.insertSelectOption({ value: 0, text: "&nbsp;" });

                    let filtersReclass = [
                        ["isinactive", "is", "F"], "AND",
                        ["custrecord_lmry_br_cuenta_tarjeta.isinactive", "is", "F"], "AND",
                        ["custrecord_lmry_br_proveedor.isinactive", "is", "F"]
                    ];
                    if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                        filtersReclass.push("AND", ["custrecord_lmry_br_subsidiary", "anyof", recordObj.getValue({ fieldId: "custpage_subsidiary" })]);
                    }

                    let search_acc_reclassif = search.create({
                        type: "customrecord_lmry_br_reclasif_tarjeta",
                        filters: filtersReclass,
                        columns: ["custrecord_lmry_br_cuenta_tarjeta"]
                    }).runPaged({
                        pageSize: 1000
                    });

                    search_acc_reclassif.pageRanges.forEach(function (pageRange) {
                        let page = search_acc_reclassif.fetch({
                            index: pageRange.index
                        });

                        page.data.forEach(function (result) {
                            let id = result.getValue("custrecord_lmry_br_cuenta_tarjeta");
                            let textos = result.getText("custrecord_lmry_br_cuenta_tarjeta");

                            reclassAccountField.insertSelectOption({ value: id, text: textos });
                        });
                    });
                }
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

            fillPaymentMethods() {
                let recordObj = this.currentRecord;
                let paymentMethodField = recordObj.getField({ fieldId: "custpage_payment_method" });
                if (paymentMethodField) {
                    paymentMethodField.removeSelectOption({ value: null });
                    paymentMethodField.insertSelectOption({ value: 0, text: "&nbsp;" });

                    let search_paymethod = search.create({
                        type: "customrecord_lmry_paymentmethod",
                        filters: [
                            ["isinactive", "is", "F"], "AND",
                            ["custrecord_lmry_country_pm", "anyof", "30"]
                        ],
                        columns: ["internalid", "name"]
                    }).runPaged({
                        pageSize: 1000
                    });

                    search_paymethod.pageRanges.forEach(function (pageRange) {
                        let page = search_paymethod.fetch({
                            index: pageRange.index
                        });

                        page.data.forEach(function (result) {
                            let id = result.getValue("internalid");
                            let textos = result.getValue("name");

                            paymentMethodField.insertSelectOption({ value: id, text: textos });
                        });
                    });
                }
            }

            fillCurrenciesByEntity() {
                let recordObj = this.currentRecord;
                let currencyField = recordObj.getField({ fieldId: "custpage_currency" });
                if (currencyField) {
                    currencyField.removeSelectOption({ value: null });
                    currencyField.insertSelectOption({ value: 0, text: "&nbsp;" });
                    let entity = recordObj.getValue({ fieldId: "custpage_vendor" }) || "";
                    entity = Number(entity);
                    if (entity) {
                        let entityQuery = query.create({
                            type: "vendor"
                        });

                        /* Joins */
                        let currencyJoin = entityQuery.autoJoin({
                            fieldId: 'currencylist'
                        });

                        /* Conditions */
                        entityQuery.condition =
                            entityQuery.createCondition({
                                fieldId: 'id',
                                operator: query.Operator.EQUAL,
                                values: [entity]
                            });

                        /* Columns */
                        entityQuery.columns = [
                            entityQuery.createColumn({
                                fieldId: 'companyname'
                            }),
                            entityQuery.createColumn({
                                fieldId: 'currency',
                                alias: 'primaryCurrencyId'
                            }),
                            entityQuery.createColumn({
                                fieldId: 'currency',
                                alias: 'primaryCurrencyText',
                                context: query.FieldContext.DISPLAY
                            }),
                            currencyJoin.createColumn({
                                fieldId: 'currency',
                                alias: 'secCurrency'
                            }),
                            currencyJoin.createColumn({
                                fieldId: 'currency',
                                alias: 'secCurrencyText',
                                context: query.FieldContext.DISPLAY
                            })
                        ];

                        let results = entityQuery.run().asMappedResults();
                        if (results && results.length) {
                            let currencies = {};
                            currencies[results[0].primaryCurrencyId] = results[0].primaryCurrencyText;
                            for (let i = 0; i < results.length; i++) {
                                let id = results[i].secCurrency;
                                id = String(id);
                                if (!currencies.hasOwnProperty(id)) {
                                    currencies[id] = results[i].secCurrencyText;
                                }
                            }

                            for (let id in currencies) {
                                currencyField.insertSelectOption({ value: id, text: currencies[id] });
                            }
                        }
                    }
                }
            }

            setExchangeRate() {
                let recordObj = this.currentRecord;
                let currency = recordObj.getValue({ fieldId: "custpage_currency" });
                let trandate = recordObj.getValue({ fieldId: "custpage_date" });
                let subsidiary = 1;
                if (this.FEAT_SUBS === true || this.FEAT_SUBS === "T") {
                    subsidiary = recordObj.getValue({ fieldId: "custpage_subsidiary" });
                }
                if (Number(currency) && trandate && Number(subsidiary)) {
                    let subsidiaryCurrency = search.lookupFields({
                        type: "subsidiary",
                        id: subsidiary,
                        columns: ["currency"]
                    }).currency[0].value;

                    let exchangeRate = currencyApi.exchangeRate({
                        date: trandate,
                        source: currency,
                        target: subsidiaryCurrency
                    });
                    exchangeRate = parseFloat(exchangeRate);
                    recordObj.setValue({ fieldId: "custpage_exchange_rate", value: exchangeRate, ignoreFieldChange: true });
                } else {
                    recordObj.setValue({ fieldId: "custpage_exchange_rate", value: "", ignoreFieldChange: true });
                }
            }

            firstPayment() {
                let JsonFirstPay = {};
                //PRIMER PAGO
                let filtrosLog = [];
                filtrosLog[0] = search.createFilter({ name: "custrecord_lmry_br_wht_log_state", operator: "is", values: "Finalizado" });
                filtrosLog[1] = search.createFilter({ name: "isinactive", operator: "is", values: "F" });
                filtrosLog[2] = search.createFilter({ name: "custrecord_lmry_br_wht_log_payment", operator: "noneof", values: "@NONE@" });

                let searchLog = search.create({
                    type: "customrecord_lmry_br_wht_purchase_log",
                    columns: ["custrecord_lmry_br_wht_log_bills", { name: "internalid", sort: search.Sort.DESC }],
                    filters: filtrosLog
                }).runPaged({
                    pageSize: 1000
                });

                if (searchLog.count) {
                    searchLog.pageRanges.forEach(function (pageRange) {
                        let page = searchLog.fetch({ index: pageRange.index });
                        let results = page.data;
                        if (results) {
                            for (let i = 0; i < results.length; i++) {
                                let billsLog = results[i].getValue("custrecord_lmry_br_wht_log_bills");
                                billsLog = billsLog ? billsLog.split("|") : [];

                                for (let j = 0; j < billsLog.length - 1; j++) {
                                    let auxBillLog = billsLog[j].split(";");
                                    let idBill = auxBillLog[0];

                                    if (!JsonFirstPay.hasOwnProperty(idBill)) {
                                        JsonFirstPay[idBill] = { "ninstallment": [], id: results[i].getValue("internalid") };
                                    }

                                    //YA TIENE INSTALLMENT
                                    if (auxBillLog.length >= 8) {
                                        if (auxBillLog[5] != "0") {
                                            JsonFirstPay[idBill]["ninstallment"].push(auxBillLog[5]);
                                        }
                                    }

                                }
                            }
                        }
                    });
                }

                return JsonFirstPay;
            }

            createRecordLog() {
                let currentRecord = this.currentRecord;
                let jsonVendor = {};
                let jsonAnticipo = {};
                let firstPay = this.firstPay;
                let firstPayJSON = {};
                let entity = Number(currentRecord.getValue({ fieldId: "custpage_vendor" }));

                let numberLines = currentRecord.getLineCount({ sublistId: "custpage_results_list" });
                for (let i = 0; i < numberLines; i++) {
                    let isApplied = currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "apply", line: i });

                    if (isApplied) {
                        let vendor = currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "vendor", line: i }) || "";
                        if (!vendor) {
                            vendor = entity;
                        }
                        console.log("vendor: " + vendor);
                        if (!jsonVendor[vendor]) {
                            jsonVendor[vendor] = { 'bills': '', 'firstpay': {} };
                        }
                        let internalid = currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "internalidtext", line: i }) || "";
                        let total_amt = currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "total_amt", line: i }) || 0.00;
                        let amount_due = currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "amount_due", line: i }) || 0.00;
                        let total_hidden = currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "total_hidden", line: i }) || 0.00;
                        let advance = currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "advance", line: i }) || 0.00;

                        currentRecord.selectLine({ sublistId: "custpage_results_list", line: i });
                        let payment = currentRecord.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "payment_amt" }) || 0.00;
                        let penalty = currentRecord.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "penalty" }) || 0.00;
                        let interest = currentRecord.getCurrentSublistValue({ sublistId: "custpage_results_list", fieldId: "interest" }) || 0.00;

                        let billsData = internalid + ";" + total_amt + ";" + amount_due + ";" + payment + ";" + total_hidden + ";";

                        let is_installment = "0";
                        if (currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "installment", line: i })) {
                            is_installment = currentRecord.getSublistValue({ sublistId: "custpage_results_list", fieldId: "installment", line: i });
                        }
                        billsData += is_installment + ";";
                        billsData += penalty + ";" + interest + ";";
                        billsData += advance + ";";

                        let is_primerPago = "T";
                        //SI YA SE PAGO ESTE BILL: NO ES PRIMER PAGO
                        if (firstPay.hasOwnProperty(internalid)) {
                            if (firstPay[internalid]["ninstallment"].length) {
                                for (let j = 0; j < firstPay[internalid]["ninstallment"].length; j++) {
                                    if (is_installment == firstPay[internalid]["ninstallment"][j]) {
                                        is_primerPago = "F";
                                    }
                                }
                            } else {
                                is_primerPago = "F";
                            }
                        } else {
                            jsonVendor[vendor]['firstpay'][internalid] = internalid;
                            //firstPayJSON[internalid] = internalid;
                        }
                        billsData += is_primerPago + "|";
                        jsonVendor[vendor]['bills'] += billsData;

                        console.log("jsonVendor[" + vendor + "]: " + jsonVendor[vendor]);
                    }
                }

                // Anticipo
                if (this.names["process"] == 'Individual') {
                    let auxAdvance = jsonVendor[entity]["bills"].split(";");
                    let numberAdvanceLines = currentRecord.getLineCount({ sublistId: "custpage_advances_list" });
                    for (let i = 0; i < numberAdvanceLines; i++) {
                        let apply = currentRecord.getSublistValue({ sublistId: "custpage_advances_list", fieldId: "apply", line: i });
                        let idAnticipo = currentRecord.getSublistValue({ sublistId: "custpage_advances_list", fieldId: "internalid", line: i });
                        let amountAnticipo = currentRecord.getSublistValue({ sublistId: "custpage_advances_list", fieldId: "total_amt", line: i });
                        let typeAnticipo = currentRecord.getSublistValue({ sublistId: "custpage_advances_list", fieldId: "type", line: i });

                        if (apply) {
                            jsonAnticipo[auxAdvance[0]] = { "id": idAnticipo, "amount": amountAnticipo, "type": typeAnticipo };
                        }
                    }
                }

                let subsidiary = Number(currentRecord.getValue({ fieldId: "custpage_subsidiary" })) || "";
                let account = currentRecord.getValue({ fieldId: "custpage_ap_account" }) || "";
                let currency = Number(currentRecord.getValue({ fieldId: "custpage_currency" })) || "";
                let date = currentRecord.getValue({ fieldId: "custpage_date" });
                let period = Number(currentRecord.getValue({ fieldId: "custpage_period" })) || "";
                let bankaccount = Number(currentRecord.getValue({ fieldId: "custpage_bank_account" })) || "";
                let memo = currentRecord.getValue({ fieldId: "custpage_memo" });
                let check = currentRecord.getValue({ fieldId: "custpage_check" });
                let department = Number(currentRecord.getValue({ fieldId: "custpage_department" })) || "";
                let class_ = Number(currentRecord.getValue({ fieldId: "custpage_class" })) || "";
                let location = Number(currentRecord.getValue({ fieldId: "custpage_location" })) || "";
                let reclass_account = Number(currentRecord.getValue({ fieldId: "custpage_reclass_account" })) || "";
                let payment_method = Number(currentRecord.getValue({ fieldId: "custpage_payment_method" })) || "";

                let jsonRecord = {
                    "subsidiary": subsidiary,
                    "entity": entity,
                    "account": account,
                    "currency": currency,
                    "date": date,
                    "period": period,
                    "bankaccount": bankaccount,
                    "memo": memo,
                    "department": department,
                    "class_": class_,
                    "location": location,
                    "check": check
                }

                console.log(jsonRecord);
                console.log("jsonVendor[vendor]: " + JSON.stringify(jsonVendor));

                // Creacion de Logs
                let idlog = '';

                for (const vendor in jsonVendor) {
                    let recordlog = record.create({
                        type: "customrecord_lmry_br_wht_purchase_log"
                    });

                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_subsi", value: subsidiary });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_vendor", value: vendor });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_date", value: date });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_period", value: period });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_employee", value: runtime.getCurrentUser().id });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_currency", value: currency });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_apacc", value: account });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_bank", value: bankaccount });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_state", value: "Preview" });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_department", value: department });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_class", value: class_ });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_location", value: location });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_memo", value: memo });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_pmethod", value: payment_method });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_check", value: check });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_reclasifacc", value: reclass_account });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_process", value: this.names["process"] });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_log_bills", value: jsonVendor[vendor]['bills'] });
                    recordlog.setValue({ fieldId: "custrecord_lmry_br_wht_first_payment", value: JSON.stringify(jsonVendor[vendor]['firstpay']) });

                    if (Object.keys(jsonAnticipo).length) {
                        recordlog.setValue('custrecord_lmry_br_wht_log_advance', JSON.stringify(jsonAnticipo));
                    }

                    idlog += recordlog.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true }) + "|";
                }

                currentRecord.setValue({ fieldId: "custpage_log_id", value: idlog, ignoreFieldChange: true });

                console.log("idlog: " + idlog);
                return true;
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
                            "vendor_search", "customer_search", "search", "msg_mandatory_fields", "msg_validation_dates", "msg_reclass_account",
                            "msg_reclass_vendor", "msg_empty_list", "msg_no_selected", "msg_book_no_exchangerate", "msg_alert", "msg_process_in_execution",
                            "msg_many_advance", "msg_advance_conflict", "msg_no_advance_selected", "msg_many_advance_selected", "msg_no_match_amount",
                            "msg_advance_exceeds"
                        ]
                    }]
                });
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