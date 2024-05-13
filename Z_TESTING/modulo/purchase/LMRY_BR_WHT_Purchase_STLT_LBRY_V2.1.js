/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for WTH on Purchases                           ||
||                                                              ||
||  File Name: LMRY_BR_WHT_Purchase_STLT_LBRY_V2.1.js           ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Oct 31 2022  LatamReady    Use Script 2.1           ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Author gerson@latamready.com
**/

define(["N/log","N/search", "N/runtime", "N/translation", "N/redirect", "N/ui/serverWidget", "N/suiteAppInfo", "N/url", "N/format", "N/task", "./LMRY_libSendingEmailsLBRY_V2.0"],
    function (log,search, runtime, translation, redirect, serverWidget, suiteAppInfo, url, format, task, LibraryMail) {

        const LMRY_script = "LatamReady - BR WHT Purchase STLT LBRY";
        /*let LANGUAGE = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" });
        LANGUAGE = LANGUAGE.substring(0, 2);*/

        let allLicenses = {};
        let licenses = [];
        let subsidiaries = [];
        let anysubsidiary = false;
        let featureLatam = false;

        class LibraryHandler {
            constructor(options) {
                this.params = options.params || {};
                this.method = options.method;
                this.subsidiaries = [];

                this.FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                this.FEAT_DPT = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
                this.FEAT_LOC = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
                this.FEAT_CLASS = runtime.isFeatureInEffect({ feature: "CLASSES" });
                this.FEAT_MULTIBOOK = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
                this.FEAT_INSTALLMENTS = runtime.isFeatureInEffect({ feature: "INSTALLMENTS" });
                this.FEAT_APPROV_INVC = runtime.getCurrentScript().getParameter({ name: "CUSTOMAPPROVALCUSTINVC" });
                this.FEAT_APPROV_BILL = runtime.getCurrentScript().getParameter({ name: "CUSTOMAPPROVALVENDORBILL" });
                this.FEAT_APPROV_JOURNAL = runtime.getCurrentScript().getParameter({ name: "CUSTOMAPPROVALJOURNAL" });

                this.DEPTMANDATORY = runtime.getCurrentUser().getPreference({ name: "DEPTMANDATORY" });
                this.LOCMANDATORY = runtime.getCurrentUser().getPreference({ name: "LOCMANDATORY" });
                this.CLASSMANDATORY = runtime.getCurrentUser().getPreference({ name: "CLASSMANDATORY" });

                this.deploy = runtime.getCurrentScript().deploymentId;
                this.names = this.getNames(this.deploy);
                log.debug("this.names", this.names);

                if (this.method == "GET") {
                    this.translator = this.getTranslator();
                    this.licensesBySubsidiary = LibraryMail.getAllLicenses();
                }

            }

            getNames(deploy) {
                let nameList = {
                    "customdeploy_lmry_br_wht_pur_stlt": {
                        title: "title_br_wht_pur",
                        process: "Individual",
                        scriptid: "customscript_lmry_br_wht_purchase_mprd",
                        deployid: "customdeploy_lmry_br_wht_purchase_mprd",
                        paramuser: "custscript_lmry_br_wht_user",
                        paramstate: "custscript_lmry_br_wht_state"
                    },
                    "customdeploy_lmry_br_wht_pur_mas_stlt": {
                        title: "title_br_wht_pur_mas",
                        process: "Massive",
                        scriptid: "customscript_lmry_br_massive_wht_mprd",
                        deployid: "customdeploy_lmry_br_massive_wht_mprd",
                        paramuser: "custscript_lmry_br_massive_wht_user",
                        paramstate: "custscript_lmry_br_massive_wht_state"
                    }
                };
                return nameList[deploy];
            }

            areThereSubsidiaries() {
                let subsidiaries = [];
                let anysubsidiary = false;
                let licenses = [];
                if (this.FEAT_SUBS == true || this.FEAT_SUBS == "T") {
                    let allLicenses = LibraryMail.getAllLicenses();
                    subsidiaries = this.getSubsidiaries();

                    for (let i = 0; i < subsidiaries.length; i++) {
                        if (allLicenses[subsidiaries[i].value] != null && allLicenses[subsidiaries[i].value] != "") {
                            licenses = allLicenses[subsidiaries[i].value];
                        } else {
                            licenses = [];
                        }
                        if (LibraryMail.getAuthorization(464, licenses)) {
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
                    licenses = LibraryMail.getLicenses(1);
                    if (LibraryMail.getAuthorization(464, licenses)) {
                        subsidiaries[0].active = true;
                        anysubsidiary = true;
                    }
                }

                log.debug("subsidiaries", subsidiaries);
                this.subsidiaries = subsidiaries;
                return anysubsidiary;
            }

            getSubsidiaries() {
                let subsis = [];

                let search_Subs = search.create({
                    type: search.Type.SUBSIDIARY,
                    filters: [
                        ["isinactive", "is", "F"], "AND",
                        ["country", "is", "BR"]
                    ],
                    columns: ["internalid", "name"]
                });
                let lengt_sub = search_Subs.run().getRange(0, 1000);

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
                    title: this.getText(this.names["title"])
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
                    }).setHelpText({
                        help: "custpage_subsidiary"
                    });
                    subsidiaryField.isMandatory = true;
                }

                let vendorField;
                if (this.names["process"] == "Individual") {
                    vendorField = form.addField({
                        id: "custpage_vendor",
                        type: serverWidget.FieldType.SELECT,
                        label: this.getText("vendor"),
                        container: "mainGroup"
                    }).setHelpText({
                        help: "custpage_vendor"
                    });
                    vendorField.isMandatory = true;
                } else {
                    vendorField = form.addField({
                        id: "custpage_multi_vendor",
                        type: serverWidget.FieldType.MULTISELECT,
                        label: this.getText("vendor"),
                        container: "mainGroup"
                    }).setHelpText({
                        help: "custpage_multi_vendor"
                    });
                    //vendorField.isMandatory = true;
                }

                let currencyField = form.addField({
                    id: "custpage_currency",
                    type: serverWidget.FieldType.SELECT,
                    label: this.getText("currency"),
                    container: "mainGroup"
                }).setHelpText({
                    help: "custpage_currency"
                });
                currencyField.isMandatory = true;

                /*let rateField = form.addField({
                    id: "custpage_exchange_rate",
                    type: serverWidget.FieldType.FLOAT,
                    label: this.getText("exchangerate"),
                    container: "mainGroup"
                }).setHelpText({
                    help: "custpage_exchange_rate"
                });
                rateField.isMandatory = true;*/

                let apAccountField = form.addField({
                    id: "custpage_ap_account",
                    type: serverWidget.FieldType.SELECT,
                    label: this.getText("ap_account"),
                    container: "mainGroup"
                }).setHelpText({
                    help: "custpage_ap_account"
                });
                apAccountField.isMandatory = true;

                let bankAccountField = form.addField({
                    id: "custpage_bank_account",
                    type: serverWidget.FieldType.SELECT,
                    label: this.getText("bank_account"),
                    container: "mainGroup"
                }).setHelpText({
                    help: "custpage_bank_account"
                });
                bankAccountField.isMandatory = true;

                let dateField = form.addField({
                    id: "custpage_date",
                    type: serverWidget.FieldType.DATE,
                    label: this.getText("date"),
                    container: "mainGroup"
                }).setHelpText({
                    help: "custpage_date"
                });
                dateField.isMandatory = true;

                let periodField = form.addField({
                    id: "custpage_period",
                    type: serverWidget.FieldType.SELECT,
                    label: this.getText("period"),
                    container: "mainGroup"
                }).setHelpText({
                    help: "custpage_period"
                });
                periodField.isMandatory = true;

                let checkField = form.addField({
                    id: "custpage_check",
                    type: serverWidget.FieldType.TEXT,
                    label: this.getText("check"),
                    container: "mainGroup"
                }).setHelpText({
                    help: "custpage_check"
                });

                let reclassAccountField = form.addField({
                    id: "custpage_reclass_account",
                    type: serverWidget.FieldType.SELECT,
                    label: this.getText("reclass_account"),
                    container: "mainGroup"
                }).setHelpText({
                    help: "custpage_reclass_account"
                });

                /*form.addFieldGroup({
                    id: "paymentGroup",
                    label: this.getText("payment_information")
                });*/

                let memoField = form.addField({
                    id: "custpage_memo",
                    type: serverWidget.FieldType.TEXT,
                    label: this.getText("memo"),
                    container: "mainGroup"
                }).setHelpText({
                    help: "custpage_memo"
                });

                form.addFieldGroup({
                    id: "classGroup",
                    label: this.getText("classification")
                });

                let depField;
                if (this.FEAT_DPT == true || this.FEAT_DPT == "T") {
                    depField = form.addField({
                        id: "custpage_department",
                        type: serverWidget.FieldType.SELECT,
                        label: this.getText("department"),
                        container: "classGroup"
                    }).setHelpText({
                        help: "custpage_department"
                    });

                    if (this.DEPTMANDATORY == true || this.DEPTMANDATORY == "T") {
                        depField.isMandatory = true;
                    }
                }

                let paymentMethodField = form.addField({
                    id: "custpage_payment_method",
                    type: serverWidget.FieldType.SELECT,
                    label: this.getText("payment_method"),
                    container: "classGroup"
                }).setHelpText({
                    help: "custpage_payment_method"
                });
                paymentMethodField.isMandatory = true;

                let locField;
                if (this.FEAT_LOC == true || this.FEAT_LOC == "T") {
                    locField = form.addField({
                        id: "custpage_location",
                        type: serverWidget.FieldType.SELECT,
                        label: this.getText("location"),
                        container: "classGroup"
                    }).setHelpText({
                        help: "custpage_location"
                    });

                    if (this.LOCMANDATORY == true || this.LOCMANDATORY == "T") {
                        locField.isMandatory = true;
                    }
                }

                let classField;
                if (this.FEAT_CLASS == true || this.FEAT_CLASS == "T") {
                    classField = form.addField({
                        id: "custpage_class",
                        type: serverWidget.FieldType.SELECT,
                        label: this.getText("class"),
                        container: "classGroup"
                    }).setHelpText({
                        help: "custpage_class"
                    });

                    if (this.CLASSMANDATORY == true || this.CLASSMANDATORY == "T") {
                        classField.isMandatory = true;
                    }
                }

                form.addField({
                    id: "custpage_status",
                    type: serverWidget.FieldType.TEXT,
                    label: "Status"
                }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                form.addField({
                    id: "custpage_log_id",
                    type: serverWidget.FieldType.TEXT,
                    label: "Log ID"
                }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                let deployIdField = form.addField({
                    id: "custpage_deploy_id",
                    type: serverWidget.FieldType.TEXT,
                    label: "Deploy ID"
                }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                deployIdField.defaultValue = runtime.getCurrentScript().deploymentId;

                form.addField({
                    id: "custpage_feature_latam",
                    type: serverWidget.FieldType.TEXT,
                    label: "Feature Latam"
                }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                form.addField({
                    id: "custpage_appliesto",
                    type: serverWidget.FieldType.TEXT,
                    label: "Appliesto"
                }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                /*let countryField = form.addField({
                    id: "custpage_country",
                    type: serverWidget.FieldType.TEXT,
                    label: "Country ID",
                });
                countryField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                countryField.defaultValue = this.countryId;*/

                if (!Number(this.params.status)) {
                    form.addSubmitButton({
                        label: this.getText("filter")
                    });
                    checkField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                } else {
                    form.addSubmitButton({
                        label: this.getText("next")
                    });
                    form.addButton({
                        id: "btn_back",
                        label: this.getText("back"),
                        functionName: "back"
                    });

                    if (subsidiaryField) {
                        subsidiaryField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    }
                    if (this.names["process"] == "Individual") vendorField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    if (this.names["process"] == "Massive") vendorField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    if (this.names["process"] == "Massive") checkField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    currencyField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    //rateField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    apAccountField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    dateField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    periodField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                    paymentMethodField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                    if (!this.params.byTransaction) {
                        bankAccountField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                        reclassAccountField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                        memoField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
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
                    

                }

                form.addResetButton({
                    label: this.getText("reset")
                });

                return form;
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
                let thereIsSubsi = this.params.idS;
                let thereIsVendor = this.params.idE;

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

                if (thereIsSubsi) {
                    
                    this.form.getField({ id: "custpage_subsidiary" }).defaultValue = thereIsSubsi;
                }
                if (thereIsVendor) {
                    let vendorField = this.form.getField({ id: "custpage_vendor" });
                    let vendorResult = search.lookupFields({
                        type: 'vendor',
                        id: thereIsVendor,
                        columns: ['internalid', 'companyname', 'isperson', 'firstname', 'middlename', 'lastname', 'entityid']
                    });
                    let { isperson, firstname, middlename, lastname, entityid, companyname } = vendorResult;

                    let name = entityid + " " + ((companyname) ? companyname : "");

                    if (isperson) {
                        name = entityid + " " + firstname + " " + ((middlename) ? (middlename + " ") : "") + lastname;
                    }

                    vendorField.addSelectOption({ value: thereIsVendor, text: name });
                    vendorField.defaultValue = thereIsVendor;
                }
            }

            getRedirectParams() {
                let params = this.params;
                return {
                    subsidiary: params.custpage_subsidiary || "",
                    ap_account: params.custpage_ap_account || "",
                    vendor: params.custpage_vendor || "",
                    multivendor: params.custpage_multi_vendor || "",
                    currency: params.custpage_currency || "",
                    date: params.custpage_date || "",
                    bankaccount: params.custpage_bank_account || "",
                    period: params.custpage_period || "",
                    reclass_account: params.custpage_reclass_account || "",
                    memo: params.custpage_memo || "",
                    department: params.custpage_department || "",
                    class_: params.custpage_class || "",
                    location: params.custpage_location || "",
                    paymethod: params.custpage_payment_method || "",
                    status: "1"
                };
            }

            setFormValues() {
                let { subsidiary, ap_account, vendor, multivendor, currency, date, bankaccount, period, reclass_account, memo, department, class_, location, paymethod,byTransaction } = this.params;
                let form = this.form;

                let allLicenses = {};
                let licenses = [];
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

                    allLicenses = LibraryMail.getAllLicenses();
                    licenses = allLicenses[subsidiary];

                } else {
                    licenses = LibraryMail.getLicenses(1);
                }

                featureLatam = LibraryMail.getAuthorization(670, licenses) || LibraryMail.getAuthorization(922, licenses);
                log.debug("featureLatam setFormValues", featureLatam);

                let featureLatamField = form.getField({ id: "custpage_feature_latam" });
                featureLatamField.defaultValue = featureLatam ? "T" : "F";

                if (Number(ap_account)) {
                    let apAccountField = form.getField({ id: "custpage_ap_account" });
                    let name = search.lookupFields({
                        type: "account",
                        id: ap_account,
                        columns: "name"
                    }).name;
                    apAccountField.addSelectOption({ value: ap_account, text: name });
                    apAccountField.defaultValue = ap_account;
                }

                if (Number(vendor)) {
                    let vendorField = form.getField({ id: "custpage_vendor" });
                    let vendorResult = search.lookupFields({
                        type: "vendor",
                        id: vendor,
                        columns: ["internalid", "companyname", "isperson", "firstname", "middlename", "lastname", "entityid"]
                    });
                    let { isperson, firstname, middlename, lastname, entityid, companyname } = vendorResult;

                    let name = entityid + " " + ((companyname) ? companyname : "");

                    if (isperson) {
                        name = entityid + " " + firstname + " " + ((middlename) ? (middlename + " ") : "") + lastname;
                    }
                    vendorField.addSelectOption({ value: vendor, text: name });
                    vendorField.defaultValue = vendor;
                }
                
                //log.debug("multivendor", multivendor.split("\u0005"));
                if (multivendor && multivendor.length) {
                    this.createVendorsField(form, multivendor.split("\u0005"));
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

                if (!this.params.byTransaction) {
                    if (Number(bankaccount)) {
                        let bankAccountField = form.getField({ id: "custpage_bank_account" });
                        let name = search.lookupFields({
                            type: "account",
                            id: bankaccount,
                            columns: "name"
                        }).name;
                        bankAccountField.addSelectOption({ value: bankaccount, text: name });
                        bankAccountField.defaultValue = bankaccount;
                    }    
                }
                
                if (Number(period)) {

                    if (!this.params.byTransaction) {
                        let periodField = form.getField({ id: "custpage_period" });
                        let name = search.lookupFields({
                            type: "accountingperiod",
                            id: period,
                            columns: "periodname"
                        }).periodname;
                        periodField.addSelectOption({ value: period, text: name });
                    }
                    periodField.defaultValue = period;

                }

                if (Number(reclass_account)) {
                    if (!this.params.byTransaction) {
                        let reclassAccountField = form.getField({ id: "custpage_reclass_account" });
                        let name = search.lookupFields({
                            type: "account",
                            id: reclass_account,
                            columns: "name"
                        }).name;
                        reclassAccountField.addSelectOption({ value: reclass_account, text: name });
                        reclassAccountField.defaultValue = reclass_account;
                    }
                    
                    
                }

                if ((this.FEAT_DPT == true || this.FEAT_DPT == "T") && Number(department)) {
                    if (!this.params.byTransaction) {
                        let departmentField = form.getField({ id: "custpage_department" });
                        let name = search.lookupFields({
                            type: "department",
                            id: department,
                            columns: "name"
                        }).name;
                        departmentField.addSelectOption({ value: department, text: name });
                    }

                    departmentField.defaultValue = department;
                }

                if ((this.FEAT_CLASS == true || this.FEAT_CLASS == "T") && Number(class_)) {

                    if (!this.params.byTransaction) {
                        let classField = form.getField({ id: "custpage_class" });
                        let name = search.lookupFields({
                            type: "classification",
                            id: class_,
                            columns: ["name"]
                        }).name;
                        classField.addSelectOption({ value: class_, text: name });
                    }
                    
                    classField.defaultValue = class_;
                }

                if ((this.FEAT_LOC == true || this.FEAT_LOC == "T") && Number(location)) {
                    if (!this.params.byTransaction) {
                        let locationField = form.getField({ id: "custpage_location" });
                        let name = search.lookupFields({
                            type: "location",
                            id: location,
                            columns: ["name"]
                        }).name;
                        locationField.addSelectOption({ value: location, text: name });
                    }
                    
                    locationField.defaultValue = location;
                }
                
                if (Number(paymethod)) {
                    let paymentMethodField = form.getField({ id: "custpage_payment_method" });
                    let name = search.lookupFields({
                        type: "customrecord_lmry_paymentmethod",
                        id: paymethod,
                        columns: "name"
                    }).name;
                    paymentMethodField.addSelectOption({ value: paymethod, text: name });
                    paymentMethodField.defaultValue = paymethod;
                }

                form.updateDefaultValues({
                    "custpage_date": date || "",
                    "custpage_memo": memo || "",
                    "custpage_status": "1"
                });
            }

            createBillSublist() {

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
                    label: this.getText("document_number"),
                    type: serverWidget.FieldType.TEXT
                });

                let internalidtextField = sublist.addField({
                    id: "internalidtext",
                    label: this.getText("internal_id"),
                    type: serverWidget.FieldType.TEXT
                });
                internalidtextField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                if (this.names["process"] == "Massive") {
                    sublist.addField({
                        id: "vendortext",
                        label: this.getText("vendor"),
                        type: serverWidget.FieldType.TEXT
                    });

                    let vendortextField = sublist.addField({
                        id: "vendor",
                        label: this.getText("vendor"),
                        type: serverWidget.FieldType.TEXT
                    });
                    vendortextField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                }

                sublist.addField({
                    id: "installment",
                    label: this.getText("installment"),
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "date",
                    label: this.getText("date"),
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "doctype",
                    label: this.getText("document_type"),
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "advance",
                    label: this.getText("advance"),
                    type: serverWidget.FieldType.TEXT
                });

                let totalAmtField = sublist.addField({
                    id: "total_amt",
                    label: this.getText("total_amt"),
                    type: serverWidget.FieldType.CURRENCY
                });
                totalAmtField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                totalAmtField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                let amtDueField = sublist.addField({
                    id: "amount_due",
                    label: this.getText("amount_due"),
                    type: serverWidget.FieldType.CURRENCY
                });
                amtDueField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                amtDueField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                sublist.addField({
                    id: "payment_amt",
                    label: this.getText("payment_amt"),
                    type: serverWidget.FieldType.CURRENCY
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY
                }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                let totalhiddenField = sublist.addField({
                    id: "total_hidden",
                    label: this.getText("total_amt"),
                    type: serverWidget.FieldType.CURRENCY
                });
                totalhiddenField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                if (Number(this.params.status)) {

                    sublist.addField({
                        id: "penalty",
                        label: this.getText("penalty"),
                        type: serverWidget.FieldType.CURRENCY
                    }).updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.ENTRY
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });


                    sublist.addField({
                        id: "interest",
                        label: this.getText("interest"),
                        type: serverWidget.FieldType.CURRENCY
                    }).updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.ENTRY
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });


                }

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

            loadBillSublist() {
                let data = this.getTransactions();

                let sublist = this.form.getSublist({ id: "custpage_results_list" });

                for (let i = 0; i < data.length; i++) {
                    let { id, tranid, entity, entitytext, installment, trandate, doctype, advance, totalAmt, amountDue, totalHidden } = data[i];

                    let idTransaction = this.params.idTransaction;
                    if (idTransaction && (idTransaction == id)) {
                        sublist.setSublistValue({ id: 'apply', line: i, value: 'T' });
                    }else{
                        sublist.setSublistValue({ id: 'apply', line: i, value: 'F' });
                    }
                    if (tranid) {
                        sublist.setSublistValue({ id: "tranid", line: i, value: tranid });
                    }

                    let tranUrl = url.resolveRecord({ recordType: "vendorbill", recordId: id, isEditMode: false });
                    let urlID = `<a class="dottedlink" href=${tranUrl} target="_blank">${id}</a>`;

                    sublist.setSublistValue({ id: "internalidtext", line: i, value: id });
                    sublist.setSublistValue({ id: "internalid", line: i, value: urlID });

                    if (entity && this.names["process"] == "Massive") {
                        sublist.setSublistValue({ id: "vendor", line: i, value: entity });
                        sublist.setSublistValue({ id: "vendortext", line: i, value: entitytext });
                    }

                    if (installment) {
                        sublist.setSublistValue({ id: "installment", line: i, value: installment });
                    }

                    if (trandate) {
                        sublist.setSublistValue({ id: "date", line: i, value: trandate });
                    }

                    if (doctype) {
                        sublist.setSublistValue({ id: "doctype", line: i, value: doctype });
                    }

                    if (advance) {
                        sublist.setSublistValue({ id: "advance", line: i, value: advance.toFixed(2) });
                    }

                    if (totalAmt) {
                        sublist.setSublistValue({ id: "total_amt", line: i, value: totalAmt.toFixed(2) });
                    }

                    if (amountDue) {
                        sublist.setSublistValue({ id: "amount_due", line: i, value: amountDue.toFixed(2) });
                    }

                    if (totalHidden) {
                        sublist.setSublistValue({ id: "total_hidden", line: i, value: Number(totalHidden).toFixed(2) });
                    }

                }

                if (data.length) {
                    sublist.label = `${sublist.label} (${data.length})`;
                }

            }

            getTransactions() {
                let data = [];
                let { vendor, multivendor, currency, ap_account, subsidiary, date } = this.params;

                if (Number(currency) && Number(ap_account)) {
                    let filters = [
                        ["status", "anyof", "VendBill:A"], "AND",
                        ["currency", "anyof", currency], "AND",
                        ["account", "anyof", ap_account], "AND",
                        ["amountremaining", "greaterthan", "0.00"]
                    ];

                    if (!this.params.byTransaction) {
                        filters.push("AND", ["custbody_lmry_document_type.custrecord_lmry_document_apply_wht", "is", "T"]);
                    }

                    if (Number(vendor)) {
                        filters.push("AND", ["entity", "anyof", vendor]);
                    }

                    if (multivendor && multivendor.split("\u0005").length) {
                        filters.push("AND", ["entity", "anyof", multivendor.split("\u0005")]);
                    }

                    if (this.FEAT_SUBS == true || this.FEAT_SUBS == "T") {
                        filters.push("AND", ["subsidiary", "anyof", subsidiary]);
                    }

                    if (this.FEAT_APPROV_BILL == true || this.FEAT_APPROV_BILL == "T") {
                        filters.push("AND", ["approvalstatus", "anyof", "2"]);
                    }

                    if (date) {
                        filters.push("AND", ["trandate", "onorbefore", [date]]);
                    }

                    let columns = [];
                    columns.push(search.createColumn({ name: "internalid", sort: search.Sort.ASC }));
                    columns.push(search.createColumn({ name: "formulatext", formula: "{tranid}" }));
                    columns.push(search.createColumn({ name: "trandate" }));
                    columns.push(search.createColumn({ name: "custbody_lmry_document_type" }));
                    columns.push(search.createColumn({ name: "entity" }));
                    columns.push(search.createColumn({ name: "memo" }));
                    columns.push(search.createColumn({ name: "fxamount" }));
                    columns.push(search.createColumn({ name: "fxamountpaid" }));
                    columns.push(search.createColumn({ name: "fxamountremaining" }));
                    columns.push(search.createColumn({ name: "custrecord_lmry_br_advance", join: "CUSTRECORD_LMRY_BR_RELATED_TRANSACTION" }));
                    columns.push(search.createColumn({ name: "custrecord_lmry_br_amount_advance", join: "CUSTRECORD_LMRY_BR_RELATED_TRANSACTION" }));

                    if (this.FEAT_INSTALLMENTS == true || this.FEAT_INSTALLMENTS == "T") {
                        filters.push("AND", [["mainline", "is", "T"], "OR", ["installment.installmentnumber", "isnotempty", ""]]);
                        columns.push(search.createColumn({ name: "fxamount", join: "installment" }));
                        columns.push(search.createColumn({ name: "fxamountpaid", join: "installment" }));
                        columns.push(search.createColumn({ name: "fxamountremaining", join: "installment" }));
                        columns.push(search.createColumn({ name: "installmentnumber", join: "installment", sort: search.Sort.ASC }));
                    } else {
                        filters.push("AND", ["mainline", "is", "T"]);
                    }

                    columns.push(search.createColumn({ name: "fxamount", join: "applyingtransaction", sort: search.Sort.ASC, }));

                    let searchTransactions = search.create({
                        type: "vendorbill",
                        filters: filters,
                        columns: columns,
                        settings: [search.createSetting({ name: "consolidationtype", value: "NONE" })]
                    });

                    let pageData = searchTransactions.runPaged({ pageSize: 1000 });
                    if (pageData) {
                        pageData.pageRanges.forEach(function (pageRange) {
                            let page = pageData.fetch({ index: pageRange.index });
                            let results = page.data;
                            if (results) {
                                let prev = "";
                                for (let i = 0; i < results.length; i++) {
                                    let id = results[i].getValue("internalid");
                                    id = String(id);
                                    let installment = results[i].getValue({ name: "installmentnumber", join: "installment" }) || "";
                                    if (prev == [id, installment].join("-")) {
                                        continue;
                                    }
                                    let tranid = results[i].getValue("formulatext") || "";
                                    let hasInstallment = !!installment;
                                    let trandate = results[i].getValue("trandate");
                                    let doctype = results[i].getText("custbody_lmry_document_type") || "";
                                    let entity = results[i].getValue("entity") || "";
                                    let entitytext = results[i].getText("entity") || "";
                                    let isAdvance = results[i].getValue({ name: "custrecord_lmry_br_advance", join: "CUSTRECORD_LMRY_BR_RELATED_TRANSACTION" });
                                    let amtAdvance = results[i].getValue({ name: "custrecord_lmry_br_amount_advance", join: "CUSTRECORD_LMRY_BR_RELATED_TRANSACTION" });
                                    let alreadyapplied = results[i].getValue({ name: "fxamount", join: "applyingtransaction" });
                                    let totalAmt = hasInstallment ? results[i].getValue({ name: "fxamount", join: "installment" }) : results[i].getValue("fxamount");
                                    totalAmt = Number(totalAmt);
                                    let totalHidden = results[i].getValue("fxamount") || 0.00;
                                    if (featureLatam && totalHidden) {
                                        totalHidden -= Math.abs(alreadyapplied);
                                    }
                                    let amountDue = hasInstallment ? results[i].getValue({ name: "fxamountremaining", join: "installment" }) : results[i].getValue("fxamountremaining");
                                    amountDue = Number(amountDue);
                                    if (!amountDue) {
                                        continue;
                                    }

                                    let advance = "";
                                    if (!hasInstallment && isAdvance && amtAdvance) {
                                        advance = Number(amtAdvance);
                                    }
                                    data.push({
                                        id: id,
                                        tranid: tranid,
                                        installment: installment,
                                        trandate: trandate,
                                        doctype: doctype,
                                        entity: entity,
                                        entitytext: entitytext,
                                        advance: advance,
                                        totalAmt: totalAmt,
                                        amountDue: amountDue,
                                        totalHidden: totalHidden
                                    });
                                    prev = [id, installment].join("-");
                                }
                            }
                        });
                    }

                    
                    //Remover bills que pasan por epayment
                    this.removeEpaymentBills(data);

                    if (this.params.byTransaction) {
                        data = this.moveTransactionToFirst(data,this.params.idTransaction);
                    }
                    
                }
                return data;
            }

            moveTransactionToFirst(transactions, idTransaction) {
                const index = transactions.findIndex(transaction => transaction.id === idTransaction);  
                if (index !== -1) {
                    const transaction = transactions.splice(index, 1)[0];
                    transactions.unshift(transaction);
                }
                return transactions;
            }

            removeEpaymentBills(bills) {
                if (bills.length) {
                    //Electronic Bank Payments by LatamReady (Suiteapp y Dev)
                    if (suiteAppInfo.isBundleInstalled({ bundleId: 338570 }) || (suiteAppInfo.isBundleInstalled({ bundleId: 337228 }))) {
                        const allStatus = getStatus();
                        search.create({
                            type: 'customrecord_lmry_epay_transfer_file',
                            filters: [
                                [
                                    ["custrecord_lmry_epay_tf_step", "anyof", "4"],
                                    "AND",
                                    ["custrecord_lmry_epay_tf_status", "noneof", allStatus.COMPLETED, allStatus.CANCELED, allStatus.FAILED]
                                ],
                                "OR",
                                [
                                    ["custrecord_lmry_epay_tf_status", "noneof", allStatus.CANCELED, allStatus.FAILED],
                                    "AND",
                                    ["custrecord_lmry_epay_tf_step", "noneof", "4", "5"]
                                ]

                            ],
                            columns: [
                                'custrecord_lmry_epay_tf_trans_ref',
                                'custrecord_lmry_epay_tf_step',
                                'custrecord_lmry_epay_tf_status'
                            ]
                        }).run().each((result) => {
                            let trIds = result.getValue("custrecord_lmry_epay_tf_trans_ref") || "";
                            if (trIds) {
                                trIds = trIds.split(/\u0005|\,/g);
                                trIds.forEach((id) => {
                                    let index = bills.findIndex((obj) => obj.id == id);
                                    if (index != -1) {
                                        bills.splice(index, 1);
                                    }
                                })
                            }
                            return true;
                        });
                    }
                }
            }

            createAdvanceSublist() {

                this.form.addTab({
                    id: "advances_tab",
                    label: this.getText("advances")
                });

                this.sublist = this.form.addSublist({
                    id: "custpage_advances_list",
                    label: this.getText("advances"),
                    tab: "advances_tab",
                    type: serverWidget.SublistType.LIST
                });

                let sublist = this.sublist;

                sublist.addField({
                    id: "apply",
                    label: this.getText("apply"),
                    type: serverWidget.FieldType.CHECKBOX
                });

                sublist.addField({
                    id: "type",
                    label: this.getText("type"),
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                sublist.addField({
                    id: "type_text",
                    label: this.getText("type"),
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "internalid",
                    label: this.getText("internal_id"),
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "tranid",
                    label: this.getText("document_number"),
                    type: serverWidget.FieldType.TEXT
                });

                let internalidtextField = sublist.addField({
                    id: "internalidtext",
                    label: this.getText("internal_id"),
                    type: serverWidget.FieldType.TEXT
                });
                internalidtextField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                sublist.addField({
                    id: "date",
                    label: this.getText("date"),
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "doctype",
                    label: this.getText("document_type"),
                    type: serverWidget.FieldType.TEXT
                });

                sublist.addField({
                    id: "total_amt",
                    label: this.getText("total_amt"),
                    type: serverWidget.FieldType.CURRENCY
                });

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

            loadAdvanceSublist() {
                let data = this.getBillCredits();
                data = data.concat(this.getJournalEntries());

                let sublist = this.form.getSublist({
                    id: "custpage_advances_list"
                });

                for (let i = 0; i < data.length; i++) {
                    let { id, type, tranid, date, doctype, totalAmt } = data[i];

                    sublist.setSublistValue({ id: "apply", line: i, value: "F" });

                    sublist.setSublistValue({ id: "internalid", line: i, value: id });

                    let tranUrl = url.resolveRecord({ recordType: type, recordId: id, isEditMode: false });

                    let typeText = "";
                    if (type == "vendorcredit") {
                        typeText = "bill_credit";
                    } else if (type == "journalentry") {
                        typeText = "journal_entry";
                    }

                    let urlType = `<a class="dottedlink" href=${tranUrl} target="_blank">${this.getText(typeText)}</a>`;

                    sublist.setSublistValue({ id: "type_text", line: i, value: urlType });
                    sublist.setSublistValue({ id: "type", line: i, value: type });
                    if (tranid) {
                        sublist.setSublistValue({ id: "tranid", line: i, value: tranid });
                    }

                    if (date) {
                        sublist.setSublistValue({ id: "date", line: i, value: date });
                    }

                    if (doctype) {
                        sublist.setSublistValue({ id: "doctype", line: i, value: doctype });
                    }

                    if (totalAmt) {
                        sublist.setSublistValue({ id: "total_amt", line: i, value: totalAmt });
                    }

                }

                if (data.length) {
                    sublist.label = `${sublist.label} (${data.length})`;
                }
            }

            getBillCredits() {
                let data = [];
                let { vendor, currency, ap_account, subsidiary, date } = this.params;

                if (Number(vendor) && Number(currency) && Number(ap_account)) {
                    let filters = [
                        ["mainline", "is", "T"], "AND",
                        ["appliedtotransaction", "anyof", "@NONE@"], "AND",
                        ["currency", "anyof", currency], "AND",
                        ["account", "anyof", ap_account], "AND",
                        ["amountremaining", "greaterthan", "0.00"], "AND",
                        ["entity", "anyof", vendor], "AND",
                        ["custbody_lmry_br_amount_advance", "is", "1"]
                    ];

                    if (this.FEAT_SUBS == true || this.FEAT_SUBS == "T") {
                        filters.push("AND", ["subsidiary", "anyof", subsidiary]);
                    }

                    if (date) {
                        filters.push("AND", ["trandate", "onorbefore", [date]]);
                    }

                    let searchCreditMemos = search.create({
                        type: "vendorcredit",
                        filters: filters,
                        columns: [
                            search.createColumn({ name: "trandate", sort: search.Sort.DESC }), "internalid", "fxamount",
                            "fxamountremaining", "tranid", "custbody_lmry_document_type", "appliedtotransaction"
                        ],
                        settings: [search.createSetting({ name: "consolidationtype", value: "NONE" })]
                    });

                    let pageData = searchCreditMemos.runPaged({ pageSize: 1000 });
                    if (pageData) {
                        pageData.pageRanges.forEach(function (pageRange) {
                            let page = pageData.fetch({ index: pageRange.index });
                            let results = page.data;
                            if (results) {
                                for (let i = 0; i < results.length; i++) {
                                    let id = results[i].getValue("internalid");
                                    id = String(id);
                                    let trandate = results[i].getValue("trandate");
                                    let totalAmt = results[i].getValue("fxamount") || 0.00;
                                    totalAmt = Math.abs(parseFloat(totalAmt));
                                    let doctype = results[i].getText("custbody_lmry_document_type") || "";

                                    let tranid = results[i].getValue("tranid") || "";
                                    if (id) {
                                        data.push({
                                            id: id,
                                            type: "vendorcredit",
                                            tranid: tranid,
                                            date: trandate,
                                            doctype: doctype,
                                            totalAmt: totalAmt
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
                return data;
            }

            getJournalEntries() {
                let data = [];
                let { vendor, currency, ap_account, subsidiary, date } = this.params;

                if (Number(vendor) && Number(currency) && Number(ap_account) && date) {
                    let filters = [
                        ["appliedtotransaction", "anyof", "@NONE@"], "AND",
                        ["currency", "anyof", currency], "AND",
                        ["account", "anyof", ap_account], "AND",
                        ["amountremaining", "greaterthan", "0.00"], "AND",
                        ["name", "anyof", vendor], "AND",
                        ["debitamount", "greaterthan", "0.00"], "AND",// debit para que se aplique restando al bill
                        ["custbody_lmry_br_amount_advance", "is", "1"]
                    ];

                    if (date) {
                        filters.push("AND", ["trandate", "onorbefore", date]);
                    }

                    if (this.FEAT_SUBS == true || this.FEAT_SUBS == "T") {
                        filters.push("AND", ["subsidiary", "anyof", subsidiary]);
                    }

                    if (this.FEAT_APPROV_JOURNAL == true || this.FEAT_APPROV_JOURNAL == "T") {
                        filters.push("AND", ["approvalstatus", "anyof", "2"]);
                    }

                    let searchJournal = search.create({
                        type: "journalentry",
                        filters: filters,
                        columns: ["internalid", "trandate", search.createColumn({ name: "formulatext", formula: "{tranid}" }), "fxamount", "type"],
                        settings: [search.createSetting({ name: "consolidationtype", value: "NONE" })]
                    });

                    let pageData = searchJournal.runPaged({ pageSize: 1000 });
                    if (pageData) {
                        pageData.pageRanges.forEach(function (pageRange) {
                            let page = pageData.fetch({ index: pageRange.index });
                            let results = page.data;
                            if (results) {
                                for (let i = 0; i < results.length; i++) {
                                    let id = results[i].getValue("internalid");
                                    id = String(id);
                                    let trandate = results[i].getValue("trandate");
                                    let totalAmt = results[i].getValue("fxamount") || 0.00;
                                    totalAmt = Math.abs(parseFloat(totalAmt));

                                    let tranid = results[i].getValue("formulatext") || "";
                                    if (id) {
                                        data.push({
                                            id: id,
                                            type: "journalentry",
                                            tranid: tranid,
                                            date: trandate,
                                            doctype: "",
                                            totalAmt: totalAmt
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
                return data;
            }

            createVendorsField(form, vendorIds) {
                let vendorNames = [];
                let vendorSearch = search.create({
                    type: "vendor",
                    filters: [
                        ["isinactive", "is", "F"], "AND",
                        ["internalid", "anyof", vendorIds]
                    ],
                    columns: ["companyname", "firstname", "middlename", "lastname", "isperson", "entityid"]
                });

                let results = vendorSearch.run().getRange(0, 100);
                for (let i = 0; i < results.length; i++) {
                    let name = "";
                    let isPerson = results[i].getValue({ name: "isperson" });
                    let entityid = results[i].getValue({ name: "entityid" });
                    let firstName = results[i].getValue({ name: "firstname" });
                    let lastName = results[i].getValue({ name: "lastname" });

                    if (entityid != null && entityid != "") {
                        name += entityid + " ";
                    }

                    if (isPerson) {
                        name += firstName + " ";
                        let middleName = results[i].getValue({ name: "middlename" });
                        if (middleName != null && middleName != "") {
                            name += middleName.substring(0, 1) + " ";
                        }
                        name += lastName;
                    } else {
                        let companyName = results[i].getValue({ name: "companyname" });
                        if (companyName != null && companyName != "") {
                            name += companyName;
                        }
                    }
                    if (name) {
                        vendorNames.push(name)
                    }
                }

                if (vendorNames.length) {
                    //Se muestran solo los primeros 10
                    let numVendorLimit = 8;
                    let vendorsHtml = vendorNames.slice(0, numVendorLimit + 1).join("<br/>");
                    if (vendorNames.length > numVendorLimit) {
                        vendorsHtml = vendorsHtml + "<br/>...";
                    }

                    let vendorHtmlField = form.addField({
                        id: "custpage_vendor_arr_html",
                        label: "Vendors HTML",
                        type: serverWidget.FieldType.INLINEHTML,
                        container: "group_pi"
                    });

                    let Label = this.getText("vendor");
                    vendorHtmlField.defaultValue = '<div class="uir-field-wrapper" data-field-type="select">' +
                        '<span id="subsidiaryrestriction_fs_lbl_uir_label" class="smallgraytextnolink uir-label">' +
                        '<span id="subsidiaryrestriction_fs_lbl" class="smallgraytextnolink">' +
                        '<a tabindex="-1" class="smallgraytextnolink">' + Label + '</a>' +
                        '</span></span><span class="uir-field inputreadonly">' +
                        '<span class="inputreadonly">' + vendorsHtml +
                        '</span>' +
                        '</span>' +
                        '</div>';
                    form.insertField({
                        field: vendorHtmlField,
                        nextfield: "custpage_multi_vendor"
                    });
                }
            }

            runMapReduce(parametros) {
                let allLicenses = {};
                let licenses = [];
                if (this.FEAT_SUBS == true || this.FEAT_SUBS == "T") {
                    allLicenses = LibraryMail.getAllLicenses();
                    licenses = allLicenses[this.params.custpage_subsidiary];

                } else {
                    licenses = LibraryMail.getLicenses(1);
                }
                log.debug("featureLatam", featureLatam);
                featureLatam = LibraryMail.getAuthorization(670, licenses) || LibraryMail.getAuthorization(922, licenses);
                let MPRD_SCRIPT_ID = featureLatam ? "customscript_lmry_br_wht_pur_mprd" : this.names["scriptid"];
                let MPRD_DEPLOY_ID = featureLatam ? "customdeploy_lmry_br_wht_pur_mprd" : this.names["deployid"];
                let parameters = {}
                if (featureLatam) {
                    parameters["custscript_lmry_br_wht_pur_state"] = parametros.state;
                    parameters["custscript_lmry_br_wht_pur_user"] = parametros.user;
                } else {
                    let lengthState = parametros.state.length;
                    parameters[this.names["paramstate"]] = this.names["process"] == "Individual" ? parametros.state.substring(0, lengthState - 1) : parametros.state;
                    parameters[this.names["paramuser"]] = parametros.user;
                };

                task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: MPRD_SCRIPT_ID,
                    deploymentId: MPRD_DEPLOY_ID,
                    params: parameters
                }).submit();
            }

            toLogSuitelet() {
                let STLT_LOG_ID = "customscript_lmry_br_wht_pur_log_stlt";
                let DEPLOY_LOG_ID = "customdeploy_lmry_br_wht_pur_log_stlt";
                redirect.toSuitelet({
                    scriptId: STLT_LOG_ID,
                    deploymentId: DEPLOY_LOG_ID
                });
            }

            getTranslator() {
                return translation.load({
                    collections: [{
                        alias: "text",
                        collection: "custcollection_lmry_translations",
                        keys: [
                            "title_br_wht_pur", "title_br_wht_pur_mas", "license_expired", "contact_us", "primary_information", "subsidiary", "vendor", "customer", "currency", "type", "bill_credit", "journal_entry",
                            "exchangerate", "ap_account", "ar_account", "bank_account", "date", "period", "reclass_account", "duedate", "memo", "check", "classification", "department", "class", "location", "payment_method",
                            "payment_information", "results", "apply", "internal_id", "document_number", "installment", "document_type", "advance", "total_amt", "amount_due", "payment_amt", "penalty", "interest", "advances",
                            "retefte", "reteica", "reteiva", "mark_all", "desmark_all", "reset", "filter", "next", "back", "transactions", "advances"
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



        }

        const getStatus = () => {
            let objStatus = {};
            const statusSDFMap = {
                1: 'PENDING',
                2: 'PROGRESS',
                6: 'COMPLETED',
                7: 'CANCELED',
                8: 'FAILED',
                9: 'PENDING_ACCEPT'
            }
            search.create({
                type: 'customlist_lmry_epay_status',
                columns: ['internalid', 'scriptid']
            }).run().each(function (node) {
                let realId = node.getValue(node.columns[0]);
                let scriptId = node.getValue(node.columns[1]).toUpperCase().replace('EPAY_STATUS_', '');
                let key = statusSDFMap[scriptId];
                objStatus[key] = Number(realId);

                return true;
            });

            return objStatus;
        }

        return {
            LibraryHandler: LibraryHandler
        };
    });