/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Tools for Report                           ||
||                                                              ||
||  File Name: LMRY_BR_WHT_CustPaymnt_CLNT.js                   ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Apr 08 2020  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/search', 'N/format', 'N/runtime', 'N/currentRecord', 'N/record', 'N/url', 'N/ui/message', 'N/currency', 'N/query', './LMRY_libSendingEmailsLBRY_V2.0', './LMRY_Log_LBRY_V2.0'],
    function (search, format, runtime, currentRecord, record, url, message, currencyApi, query, libMail, libLog) {
        var LMRY_script = "LMRY_BR_WHT_CustPaymnt_CLNT.js";
        var accountingPeriods = [];
        var FEAT_SUBS = false;
        var FEAT_MULTIBOOK = false;
        var FEAT_DEPT = false;
        var FEAT_LOC = false;
        var FEAT_CLASS = false;
        var FEAT_INSTALLMENTS = false;
        var DEPTMANDATORY = false;
        var LOCMANDATORY = false;
        var CLASMANDATORY = false;
        var FEAT_FOREIGN_BOOKS = false;
        var LANGUAGE = "";

        var SCRIPT_ID = 'customscript_lmry_br_custpayments_stlt';
        var DEPLOY_ID = 'customdeploy_lmry_br_custpayments_stlt';
        var MR_SCRIPT_ID = 'customscript_lmry_br_custpayments_mprd';
        var MR_DEPLOYMENT_ID = 'customdeploy_lmry_br_custpayments_mprd';
        var EXPORT_WHT_MR_SCRIPT_ID = "customscript_lmry_br_exportwht_mprd";
        var EXPORT_WHT_MR_DEPLOY_ID = "customdeploy_lmry_br_exportwht_mprd";

        LANGUAGE = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" });
        LANGUAGE = LANGUAGE.substring(0, 2);

        //Traducción de campos
        switch (LANGUAGE) {
            case 'es':
                var Mensaje1 = 'Ha seleccionado más de 1 Factura de Venta con Anticipo por pagar';
                var Mensaje2 = 'No se pueden pagar facturas con anticipos y sin anticipos al mismo tiempo';
                var Mensaje3 = 'No debe seleccionar Anticipos';
                var Mensaje4 = 'Debe seleccionar un anticipo';
                var Mensaje5 = 'Debe seleccionar solo un anticipo';
                var Mensaje6 = 'No coincide el monto del anticipo';
                var Mensaje7 = 'No puede pagar ese monto, considere el Anticipo';
                var Mensaje8 = 'No es el primer pago de esta Factura, no debe seleccionar anticipos';

                break;

            case 'pt':
                var Mensaje1 = 'Você selecionou mais de 1 fatura com adiantamento para pagar';
                var Mensaje2 = 'Não é possível pagar faturas com adiantamentos e sem adiantamentos ao mesmo tempo';
                var Mensaje3 = 'Não selecione avanços';
                var Mensaje4 = 'Você deve selecionar um avanço';
                var Mensaje5 = 'Você deve selecionar apenas um avanço';
                var Mensaje6 = 'O valor do adiantamento não coincide';
                var Mensaje7 = 'Você não pode pagar esse valor, considere o Adiantamento';
                var Mensaje8 = 'Não é o primeiro pagamento desta fatura, você não deve selecionar adiantamentos';

                break;

            default:
                var Mensaje1 = 'You have selected more than 1 Invoice with Advance to pay';
                var Mensaje2 = 'Can not pay Invoices with Advances and without Advances at the same time';
                var Mensaje3 = 'Do not select advances';
                var Mensaje4 = 'You must select an advance';
                var Mensaje5 = 'You must select only one advance';
                var Mensaje6 = 'The amount of the advance does not match';
                var Mensaje7 = 'Can not pay that amount, consider the amount of the advance';
                var Mensaje8 = 'It is not the first payment of this Invoice, you must not select advances';
        }

        var firstPayment = {};
        var firstInstallment = {};

        function pageInit(context) {
            try {
                FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                FEAT_MULTIBOOK = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
                FEAT_DEPT = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
                FEAT_LOC = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
                FEAT_CLASS = runtime.isFeatureInEffect({ feature: "CLASSES" });
                FEAT_INSTALLMENTS = runtime.isFeatureInEffect({ feature: "installments" });

                DEPTMANDATORY = runtime.getCurrentUser().getPreference({ name: "DEPTMANDATORY" });
                LOCMANDATORY = runtime.getCurrentUser().getPreference({ name: "LOCMANDATORY" });
                CLASMANDATORY = runtime.getCurrentUser().getPreference({ name: "CLASSMANDATORY" });

                FEAT_FOREIGN_BOOKS = runtime.isFeatureInEffect({ feature: "foreigncurrencymanagement" });

                var currentRecord = context.currentRecord;
                var status = currentRecord.getValue({ fieldId: 'custpage_status' });
                console.log(status);
                var idEnt = currentRecord.getValue({ fieldId: 'custpage_customer' });
                if (idEnt && status !="1") {             
                  addAccountsReceivable(currentRecord);
                    if (FEAT_DEPT == true || FEAT_DEPT == 'T') {
                        addDepartments(currentRecord);
                    }
                    if (FEAT_CLASS == true || FEAT_CLASS == 'T') {
                        addClasses(currentRecord);
                    }
                    if (FEAT_LOC == true || FEAT_LOC == 'T') {
                        addLocations(currentRecord);
                    }                  
                }                



                var queryParams = new URLSearchParams(window.location.search);
                var byTransaction = queryParams.get('byTransaction');


                if (!status || byTransaction == "1") { //Estado inicial
                    currentRecord.setValue({ fieldId: 'custpage_date', value: new Date(), ignoreFieldChange: true });
                    currentRecord.setValue({ fieldId: 'custpage_undepfunds', value: 'T', ignoreFieldChange: true });
                    currentRecord.getField({ fieldId: 'custpage_bankaccount' }).isDisabled = true;

                    accountingPeriods = getAccountingPeriods();
                    addPeriods(currentRecord, accountingPeriods);
                    setPeriodByDate(currentRecord, accountingPeriods);
                } else if (Number(status) == 1) {
                    currentRecord.getField('custpage_undepfunds').isDisabled = true;
                }
            }
            catch (err) {
                alert("[ pageInit ]\n" + err.message);
                console.log(err);
                libLog.doLog({ title: "[ pageInit ]", message: err, relatedScript: LMRY_script });
            }
        }

        function fieldChanged(context) {
            try {
                var currentRecord = context.currentRecord;
                var fieldId = context.fieldId;
                var sublistId = context.sublistId;

                if (sublistId == 'custpage_list_apply' && fieldId == 'apply') {
                    var isApplied = currentRecord.getCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'apply' });
                    var amountdue = '', interest = "", penalty = "";
                    if (isApplied) {
                        amountdue = currentRecord.getCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'amountdue' });
                        interest = 0.00;
                        penalty = 0.00;
                    }
                    currentRecord.setCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'payment', value: amountdue, ignoreFieldChange: true });
                    currentRecord.setCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'interest', value: interest, ignoreFieldChange: true });
                    currentRecord.setCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'penalty', value: penalty, ignoreFieldChange: true });
                }
            }
            catch (err) {
                alert("[ fieldChanged ]\n" + err.message);
                console.log(err);
                libLog.doLog({ title: "[ fieldChanged ]", message: err, relatedScript: LMRY_script });
            }
        }


        function validateField(context) {
            try {
                var currentRecord = context.currentRecord;
                var fieldId = context.fieldId;
                var sublistId = context.sublistId;
                if (fieldId == 'custpage_subsidiary') {
                    addCustomers(currentRecord);

                    addAccountsReceivable(currentRecord);

                    if (FEAT_DEPT == true || FEAT_DEPT == 'T') {
                        addDepartments(currentRecord);
                    }

                    if (FEAT_CLASS == true || FEAT_CLASS == 'T') {
                        addClasses(currentRecord);
                    }

                    if (FEAT_LOC == true || FEAT_LOC == 'T') {
                        addLocations(currentRecord);
                    }
                } else if (fieldId == 'custpage_date') {
                    setPeriodByDate(currentRecord, accountingPeriods);
                } else if (fieldId == 'custpage_undepfunds') {
                    var isUndepFunds = currentRecord.getValue({ fieldId: 'custpage_undepfunds' });
                    var field_bankaccount = currentRecord.getField({ fieldId: 'custpage_bankaccount' });

                    if (isUndepFunds == 'T') {
                        addBankAccounts(currentRecord);
                        currentRecord.setValue({ fieldId: 'custpage_bankaccount', value: 0 });
                        field_bankaccount.isDisabled = true;
                    } else if (isUndepFunds == 'F') {
                        var queryParams = new URLSearchParams(window.location.search);
                        var byTransaction = queryParams.get('byTransaction');
                        var idS = queryParams.get('idS');
                        if (byTransaction == "1" || idS != "-1") addBankAccounts(currentRecord);
                        field_bankaccount.isDisabled = false
                    }
                } else if (sublistId == 'custpage_list_apply' && fieldId == 'payment') {
                    var payment = currentRecord.getCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'payment' });
                    payment = Number(payment);
                    var amountdue = currentRecord.getCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'amountdue' });
                    amountdue = Number(amountdue);
                    if (payment > amountdue) {
                        payment = amountdue;
                    } else if (payment < 0) {
                        payment = 0.00;
                    }
                    var isApplied = Number(payment) > 0;
                    currentRecord.setCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'apply', value: isApplied, ignoreFieldChange: true });
                    currentRecord.setCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'payment', value: payment, ignoreFieldChange: true });

                }
                else if (sublistId == "custpage_list_apply" && fieldId == "interest") {
                    var interest = currentRecord.getCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'interest' });
                    interest = Number(interest);
                    if (interest < 0) {
                        interest = 0.00;
                    }
                    currentRecord.setCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'interest', value: interest, ignoreFieldChange: true });
                }
                else if (sublistId == "custpage_list_apply" && fieldId == "penalty") {
                    var penalty = currentRecord.getCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'penalty' });
                    penalty = Number(penalty);
                    if (penalty < 0) {
                        penalty = 0.00;
                    }
                    currentRecord.setCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'penalty', value: penalty, ignoreFieldChange: true });
                }

                if (fieldId == "custpage_currency" || fieldId == "custpage_date" || fieldId == "custpage_subsidiary") {
                    setExchangeRate(currentRecord);
                }

                if (fieldId == "custpage_currency" || fieldId == "custpage_subsidiary") {
                    addBankAccounts(currentRecord);
                }

                if (sublistId === "custpage_list_book" && fieldId == "custpage_book_exchangerate") {
                    var bookCurrencyId = currentRecord.getCurrentSublistValue({ sublistId: "custpage_list_book", fieldId: "custpage_bookcurrency_id" });
                    var bookExchangeRate = currentRecord.getCurrentSublistValue({ sublistId: "custpage_list_book", fieldId: "custpage_book_exchangerate" });
                    var currencyId = currentRecord.getValue({ fieldId: "custpage_currency" });
                    if (bookExchangeRate && (Number(currencyId) == Number(bookCurrencyId))) {
                        currentRecord.setCurrentSublistValue({ sublistId: "custpage_list_book", fieldId: "custpage_book_exchangerate", value: 1.0, ignoreFieldChange: true });
                    }
                }

            } catch (err) {
                alert("[ validateField ]\n" + err.message);
                console.log(err);
                libLog.doLog({ title: "[ validateField ]", message: err, relatedScript: LMRY_script });
                return false;
            }
            return true;
        }

        function saveRecord(context) {
            try {

                var currentRecord = context.currentRecord;
                var status = currentRecord.getValue('custpage_status');
                if (!status) {
                    if (!validateMandatoryFields(currentRecord)) {
                        return false;
                    }
                } else if (Number(status) == 1) {
                    if (!validateMandatoryFields(currentRecord)) {
                        return false;
                    }

                    if (!validateApplySublist(currentRecord)) {
                        return false;
                    }

                    if ((FEAT_SUBS == true || FEAT_SUBS == "T") && (FEAT_MULTIBOOK == true || FEAT_MULTIBOOK == "T") && (FEAT_FOREIGN_BOOKS == true || FEAT_FOREIGN_BOOKS == "T")) {
                        if (!validateBookSublist(currentRecord)) {
                            return false;
                        }
                    }

                    if (!validateExecution()) {
                        return false;
                    }

                    if (!createRecordLog(currentRecord)) {
                        return false;
                    }

                }

            } catch (err) {
                alert("[ saveRecord ]\n" + err.message);
                console.log(err);
                libLog.doLog({ title: "[ saveRecord ]", message: err, relatedScript: LMRY_script });
                return false;
            }
            return true;
        }

        function validateAccountCurrency(currentRecord) {
            var validate = true;
            var idAccount = currentRecord.getValue('custpage_bankaccount');
            var selectedCurrency = currentRecord.getValue('custpage_currency');
            var account = record.load({
                type: 'account',
                id: idAccount
            });

            var accCurrency = account.getValue('currency');

            if (Number(accCurrency) != Number(selectedCurrency)) {
                validate = false;
                var MESSAGE = {
                    'es': 'La Cuenta de Banco no esta configurada para la moneda seleccionada.',
                    'en': 'The Bank Account is not configured for the selected Currency.',
                    'pt': 'A conta bancária não está configurada para a moeda selecionada.'
                };
                alert(MESSAGE[LANGUAGE] || MESSAGE['en']);
            }

            return validate;
        }


        function validateMandatoryFields(currentRecord) {
            var validate = true;
            var MANDATORY_FIELDS = ['custpage_subsidiary', 'custpage_customer', 'custpage_date', 'custpage_araccount', 'custpage_period', 'custpage_currency', 'custpage_exchangerate'];

            var undeffunds = currentRecord.getValue('custpage_undepfunds');

            if (undeffunds == 'F') {
                MANDATORY_FIELDS.push('custpage_bankaccount');
            }

            if ((FEAT_DEPT == true || FEAT_DEPT == "T") && (DEPTMANDATORY == true || DEPTMANDATORY == "T")) {
                MANDATORY_FIELDS.push('custpage_department');
            }

            if ((FEAT_CLASS == true || FEAT_CLASS == "T") && (CLASMANDATORY == true || CLASMANDATORY == "T")) {
                MANDATORY_FIELDS.push('custpage_class');
            }

            if ((FEAT_LOC == true || FEAT_LOC == "T") && (LOCMANDATORY == true || LOCMANDATORY == "T")) {
                MANDATORY_FIELDS.push('custpage_location');
            }

            var mandatoryMsg = '';
            var MESSAGE = { 'es': 'Introduzca un valor para los campos:', 'en': 'Please enter value(s) for: \n', 'pt': 'Digite valor(es) para:' };
            mandatoryMsg += MESSAGE[LANGUAGE] || MESSAGE['en'];

            for (var i = 0; i < MANDATORY_FIELDS.length; i++) {
                var fieldName = MANDATORY_FIELDS[i];
                var value = currentRecord.getValue({
                    fieldId: fieldName
                });

                if (!Number(value)) {
                    var field = currentRecord.getField({ fieldId: fieldName });
                    var label = "";
                    if (field) {
                        label = field.label;
                    }

                    if (fieldName == 'custpage_bankaccount') {
                        var labelAccount = { 'en': 'Account', 'es': 'Cuenta', 'pt': 'Conta' };
                        label = labelAccount[LANGUAGE] || labelAccount['en'];
                    }

                    mandatoryMsg += ' ' + label + '\n';
                    validate = false;
                }
            }

            if (!validate) {
                alert(mandatoryMsg);
            }

            return validate;
        }

        function addAccountsReceivable(currentRecord) {

            var subsidiary = currentRecord.getValue('custpage_subsidiary');
            var field_araccount = currentRecord.getField({ fieldId: 'custpage_araccount' });

            field_araccount.removeSelectOption({ value: null });

            field_araccount.insertSelectOption({ value: 0, text: "&nbsp;" });

            if (Number(subsidiary)) {
                //account receivable
                var search_account = search.load({ id: 'customsearch_lmry_wht_account_receivable' });
                search_account.filters.push(search.createFilter({ name: 'subsidiary', operator: 'anyof', values: [subsidiary] }));

                var columns = search_account.columns;
                var results = search_account.run().getRange(0, 1000);
                if (results) {
                    for (var i = 0; i < results.length; i++) {
                        var id = results[i].getValue(columns[0]);
                        var name = results[i].getValue(columns[1]);

                        field_araccount.insertSelectOption({ value: id, text: name });
                    }
                }
            }
        }

        function isMultiCurrencyBankAccount(subsidiary){
            var FEAT_SUBS = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' })
            var filters = [
                ["isinactive", "is", "F"]
            ];
            if (FEAT_SUBS === true || FEAT_SUBS === "T") {
                filters.push("AND", ["custrecord_lmry_setuptax_subsidiary", "anyof", subsidiary]);
            }

            var results = search.create({
                type: "customrecord_lmry_setup_tax_subsidiary",
                filters: filters,
                columns: ["custrecord_lmry_setuptax_br_multi_bank_a"]
            }).run().getRange(0, 1);
            if (results && results.length) {
                var multicurrencybank = results[0].getValue("custrecord_lmry_setuptax_br_multi_bank_a");
                return multicurrencybank === true || multicurrencybank === "T"
            }
            return false;
        }

        function addBankAccounts(recordObj) {
            var accountField = recordObj.getField({ fieldId: "custpage_bankaccount" });
            if (accountField) {
                accountField.removeSelectOption({ value: null });
                accountField.insertSelectOption({ value: 0, text: "&nbsp;" });
                var currency = recordObj.getValue({ fieldId: "custpage_currency" }) || "";

                if (currency) {
                    var subsidiary = recordObj.getValue({ fieldId: "custpage_subsidiary" });

                    var currencies = [currency];
                    if ((FEAT_SUBS == true || FEAT_SUBS == "T") && isMultiCurrencyBankAccount(subsidiary)) {
                        var subsidiaryCurrency = search.lookupFields({
                            type: "subsidiary",
                            id: subsidiary,
                            columns: ["currency"]
                        }).currency || "";

                        if (subsidiaryCurrency && subsidiaryCurrency.length) {
                            subsidiaryCurrency = subsidiaryCurrency[0].value;
                        }

                        if (subsidiaryCurrency && (Number(currency) != Number(subsidiaryCurrency))) {
                            currencies.push(subsidiaryCurrency);
                        }
                    }

                    var accountQuery = query.create({
                        type: "account",
                    });

                    var conditions = [
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

                    if (FEAT_SUBS == true || FEAT_SUBS == "T") {
                        conditions.push(accountQuery.createCondition({
                            fieldId: "subsidiary",
                            operator: query.Operator.INCLUDE_ANY,
                            values: [subsidiary]
                        }));
                    }
                    accountQuery.condition = accountQuery.and(conditions);
                    accountQuery.columns = [
                        accountQuery.createColumn({
                            fieldId: "id",
                        }),
                        accountQuery.createColumn({
                            fieldId: "displaynamewithhierarchy",
                            alias: "name"
                        })
                    ]

                    var results = accountQuery.run().asMappedResults();

                    for (var i = 0; i < results.length; i++) {
                        var id = results[i]["id"];
                        var name = results[i]["name"];
                        if (id) {
                            accountField.insertSelectOption({ value: id, text: name });
                        }                        
                    }
                }
            }
        }


        function addDepartments(currentRecord) {
            var subsidiary = currentRecord.getValue('custpage_subsidiary');
            var field_deparment = currentRecord.getField('custpage_department');
            field_deparment.removeSelectOption({ value: null });
            field_deparment.insertSelectOption({ value: 0, text: '&nbsp;' });

            if (Number(subsidiary)) {
                var search_department = search.create({
                    type: 'department',
                    filters: [
                        ['isinactive', 'is', 'F'], 'AND', ['subsidiary', 'anyof', subsidiary]
                    ],
                    columns: ['internalid', 'name']
                });

                var results = search_department.run().getRange(0, 1000);
                if (results) {
                    for (var i = 0; i < results.length; i++) {
                        var id = results[i].getValue('internalid');
                        var name = results[i].getValue('name');
                        field_deparment.insertSelectOption({ value: id, text: name });
                    }
                }
            }
        }

        function addClasses(currentRecord) {
            var subsidiary = currentRecord.getValue('custpage_subsidiary');
            var field_class = currentRecord.getField('custpage_class');
            field_class.removeSelectOption({ value: null });
            field_class.insertSelectOption({ value: 0, text: '&nbsp;' });

            if (Number(subsidiary)) {
                var search_class = search.create({
                    type: 'classification',
                    filters: [
                        ['isinactive', 'is', 'F'], 'AND', ['subsidiary', 'anyof', subsidiary]
                    ],
                    columns: ['internalid', 'name']
                });

                var results = search_class.run().getRange(0, 1000);
                if (results) {
                    for (var i = 0; i < results.length; i++) {
                        var id = results[i].getValue('internalid');
                        var name = results[i].getValue('name');
                        field_class.insertSelectOption({ value: id, text: name });
                    }
                }
            }
        }

        function addLocations(currentRecord) {
            var subsidiary = currentRecord.getValue('custpage_subsidiary');
            var field_location = currentRecord.getField('custpage_location');
            field_location.removeSelectOption({ value: null });
            field_location.insertSelectOption({ value: 0, text: "&nbsp;" });

            if (Number(subsidiary)) {
                var search_location = search.create({
                    type: 'location',
                    filters: [
                        ['isinactive', 'is', 'F'], 'AND', ['subsidiary', 'anyof', subsidiary]
                    ],
                    columns: ['internalid', 'name']
                });

                var results = search_location.run().getRange(0, 1000);
                if (results) {
                    for (var i = 0; i < results.length; i++) {
                        var id = results[i].getValue('internalid');
                        var name = results[i].getValue('name');
                        field_location.insertSelectOption({ value: id, text: name });
                    }
                }
            }
        }

        function getAccountingPeriods() {
            var periods = [];
            var search_periods = search.load({
                id: 'customsearch_lmry_open_accounting_period'
            });

            var columns = search_periods.columns;
            var results = search_periods.run().getRange(0, 1000);
            if (results && results.length) {
                for (var i = 0; i < results.length; i++) {
                    var id = results[i].getValue(columns[0]);
                    var name = results[i].getValue(columns[1]);
                    var startdate = results[i].getValue(columns[2]);
                    startdate = format.parse({ value: startdate, type: format.Type.DATE });
                    var enddate = results[i].getValue(columns[3]);
                    enddate = format.parse({ value: enddate, type: format.Type.DATE });

                    periods.push({
                        value: id,
                        text: name,
                        startDate: startdate,
                        endDate: enddate
                    });
                }
            }
            return periods;
        }

        function setPeriodByDate(currentRecord, periods) {
            var period = 0;
            var date = currentRecord.getValue('custpage_date') || new Date();
            for (var i = 0; i < periods.length; i++) {
                if (periods[i]['startDate'] <= date && date <= periods[i]['endDate'].getTime()) {
                    period = periods[i]['value'];
                    break;
                }
            }
            currentRecord.setValue({ fieldId: 'custpage_period', value: period, ignoreFieldChange: true });
        }


        function addPeriods(currentRecord, periods) {
            var field_period = currentRecord.getField({ fieldId: 'custpage_period' });
            field_period.removeSelectOption({ value: null });
            field_period.insertSelectOption({ value: 0, text: "&nbsp;" });

            for (var i = 0; i < periods.length; i++) {
                field_period.insertSelectOption(periods[i]);
            }
        }




        function addCustomers(currentRecord) {
            var subsidiary = currentRecord.getValue('custpage_subsidiary');
            var field_customer = currentRecord.getField({ fieldId: 'custpage_customer' });
            field_customer.removeSelectOption({ value: null });
            field_customer.insertSelectOption({ value: 0, text: '&nbsp;' });

            var customers = [];
            if (Number(subsidiary)) {
                var search_customer = search.create({
                    type: "customer",
                    filters:
                        [
                            ["isinactive", "is", "F"], "AND",
                            ["msesubsidiary.internalid", "anyof", subsidiary]
                        ],
                    columns:
                        [
                            "internalid", "companyname", "firstname", "middlename", "lastname", "isperson", "entityid"
                        ]
                });
                var pageData = search_customer.runPaged();

                if (pageData && pageData.pageRanges) {
                    var ranges = pageData.pageRanges;
                    for (var i = 0; i < ranges.length; i++) {
                        var page = pageData.fetch({ index: ranges[i].index });
                        if (page && page.data) {
                            var results = page.data;

                            results.forEach(function (result) {
                                var id = result.getValue('internalid');
                                var isperson = result.getValue('isperson');
                                var firstname = result.getValue('firstname');
                                var middlename = result.getValue('middlename');
                                var lastname = result.getValue('lastname');
                                var entityid = result.getValue('entityid');
                                var companyname = result.getValue('companyname');

                                var name = entityid + " " + ((companyname) ? companyname : "");

                                if (isperson) {
                                    name = entityid + " " + firstname + " " + ((middlename) ? (middlename + " ") : "") + lastname;
                                }

                                /*if (!name) {
                                    name = entityid;
                                }*/

                                customers.push({ value: id, text: name });
                            });
                        }
                    }
                }
            }

            customers = customers.sort(function (a, b) { return a['text'].localeCompare(b['text']); });
            for (var i = 0; i < customers.length; i++) {
                field_customer.insertSelectOption(customers[i]);
            }
        }

        function validateApplySublist(currentRecord) {
            var validate = true;
            var MESSAGE = {
                'emptylist': { 'en': 'There is not invoices to pay.', 'es': 'No hay facturas a pagar.', 'pt': 'Não há faturas a pagar.' },
                'noselected': { 'en': 'Select invoices to pay.', 'es': 'Seleccione las facturas para pagar.', 'pt': 'Selecione as faturas a pagar.' },
                'gtthan0': { 'en': 'Invoice #ID: The Payment Amount must be greater than 0.', 'es': 'Factura #ID: El monto del pago debe ser mayor que 0.', 'pt': 'Fatura #ID: O valor do pagamento deve ser maior que 0.' },
                'gtamtdue': { 'en': 'Invoice #ID: The Payment Amount is greater than the Amount Due.', 'es': 'Factura #ID: El monto del pago es mayor que el monto adeudado.', 'pt': 'Fatura #ID: O valor do pagamento é maior do que o valor devido.' }
            };

            var numberLines = currentRecord.getLineCount({ sublistId: 'custpage_list_apply' });

            if (!numberLines) {
                validate = false;
                alert(MESSAGE['emptylist'][LANGUAGE] || MESSAGE['emptylist']['en']);
            } else {
                var applieds = [];
                for (var i = 0; i < numberLines; i++) {
                    currentRecord.selectLine({ sublistId: 'custpage_list_apply', line: i });
                    var isApplied = currentRecord.getCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'apply', line: i });
                    if (isApplied) {
                        var id = currentRecord.getCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'internalid', line: i });
                        var payment = currentRecord.getCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'payment', line: i });
                        var amountdue = currentRecord.getCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'amountdue', line: i });

                        if (!Number(payment) || Number(payment) < 0) {
                            validate = false;
                            var msg = MESSAGE['gtthan0'][LANGUAGE] || MESSAGE['gtthan0']['en'];
                            msg = msg.replace('#ID', id);
                            alert(msg);
                            break;
                        }
                        else if (Number(payment) > Number(amountdue)) {
                            validate = false;
                            var msg = MESSAGE['gtamtdue'][LANGUAGE] || MESSAGE['gtamtdue']['en'];
                            msg = msg.replace('#ID', id);
                            alert(msg);
                            break;
                        }
                        applieds.push(id);
                    }
                }

                if (validate && !applieds.length) {
                    validate = false;
                    alert(MESSAGE['noselected'][LANGUAGE] || MESSAGE['noselected']['en']);
                }
            }

            return validate;
        }

        function validateBookSublist(currentRecord) {
            var numBooks = currentRecord.getLineCount({ sublistId: "custpage_list_book" })

            for (var i = 0; i < numBooks; i++) {
                currentRecord.selectLine({ sublistId: "custpage_list_book", line: i })
                var bookExchangeRate = currentRecord.getCurrentSublistValue({ sublistId: "custpage_list_book", fieldId: "custpage_book_exchangerate" });
                if (!bookExchangeRate) {

                    var MSG = {
                        "en": "Please provide a Exchange Rate value for each Accounting Book.",
                        "es": "Por favor ingresa un valor de Tipo de cambio para cada Libro Contable.",
                        "pt": "Forneça um valor de taxa de câmbio para cada livro contábil."
                    };
                    alert(MSG[LANGUAGE] || MSG["en"]);
                    return false;
                }
            }

            return true;
        }

        function toggleCheckBoxes(isApplied) {
            var recordObj = currentRecord.get();
            var numberLines = recordObj.getLineCount({ sublistId: 'custpage_list_apply' });
            for (var i = 0; i < numberLines; i++) {
                recordObj.selectLine({ sublistId: 'custpage_list_apply', line: i });
                recordObj.setCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'apply', value: isApplied });
            }
        }

        function createRecordLog(currentRecord) {

            //Busqueda del Log, devuelve un json donde las keys son los invoices pagados anteriormente
            searchPayments(currentRecord);

            var firstpay = {};
            var invoices = 0, invoicesAnticipos = 0;
            var auxID = '';
            var data = {};
            var numberLines = currentRecord.getLineCount({ sublistId: 'custpage_list_apply' });
            for (var i = 0; i < numberLines; i++) {
                var isApplied = currentRecord.getSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'apply', line: i });
                if (isApplied) {
                    var internalid = currentRecord.getSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'internalid', line: i });
                    var installnum = currentRecord.getSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'installnum', line: i }) || "";
                    var advance = currentRecord.getSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'advance', line: i });
                    var due = currentRecord.getSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'amountdue', line: i });

                    currentRecord.selectLine({ sublistId: 'custpage_list_apply', line: i });
                    var payment = currentRecord.getCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'payment' });
                    var interest = currentRecord.getCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'interest' });
                    var penalty = currentRecord.getCurrentSublistValue({ sublistId: 'custpage_list_apply', fieldId: 'penalty' });


                    if (internalid) {
                        var key = internalid;
                        if ((FEAT_INSTALLMENTS == true || FEAT_INSTALLMENTS == "T") && installnum) {
                            key = internalid + "-" + installnum;
                        }
                        data[key] = { 'amountdue': parseFloat(due), 'amountpaid': parseFloat(payment), 'interest': parseFloat(interest), 'penalty': parseFloat(penalty), 'advance': parseFloat(advance), 'primerpago': 'F' };

                        if (!firstPayment[key]) {
                            data[key]['primerpago'] = 'T';
                        }

                        //Registra las facturas que tendrán primer pago, si se realizo el pago de algún installment cuenta como primer pago de la factura
                        if (!firstInstallment[internalid]) {
                            firstInstallment[internalid] = internalid;
                            firstpay[key] = key;
                        }

                        console.log('firstpay', firstpay);

                        auxID = key;
                    }

                    if (parseFloat(advance) > 0) {
                        invoicesAnticipos++;
                    } else {
                        invoices++;
                    }

                }
            }

            console.log(data);

            //VALIDACIONES ANTICIPOS

            if (invoicesAnticipos > 1) {
                alert(Mensaje1);
                return false;
            }

            if (invoicesAnticipos == 1 && invoices > 0) {
                alert(Mensaje2);
                return false;
            }

            var rowAdvance = currentRecord.getLineCount({ sublistId: 'custpage_id_advances' });
            var contadorAnticipos = 0;
            var jsonAnticipo = {};

            if (rowAdvance > 0) {
                for (var i = 0; i < rowAdvance; i++) {
                    var appl = currentRecord.getSublistValue({ sublistId: 'custpage_id_advances', fieldId: 'custpage_id_che_ad', line: i });
                    var idAnticipo = currentRecord.getSublistValue({ sublistId: 'custpage_id_advances', fieldId: 'custpage_id_int_ad', line: i });
                    var amountAnticipo = currentRecord.getSublistValue({ sublistId: 'custpage_id_advances', fieldId: 'custpage_id_amo_ad', line: i });
                    var typeAnticipo = currentRecord.getSublistValue({ sublistId: 'custpage_id_advances', fieldId: 'custpage_id_typ_ad', line: i });

                    if (appl) {
                        contadorAnticipos++;
                        jsonAnticipo[auxID] = { 'id': idAnticipo, 'amount': amountAnticipo, 'type': typeAnticipo };
                    }
                }
            }

            if (invoicesAnticipos == 0 && contadorAnticipos > 0) {
                alert(Mensaje3);
                return false;
            }

            if (invoicesAnticipos == 1) {
                if (data[auxID]['primerpago'] == 'T') {
                    if (contadorAnticipos == 0) {
                        alert(Mensaje4);
                        return false;
                    } else if (contadorAnticipos > 1) {
                        alert(Mensaje5);
                        return false;
                    }

                    if (parseFloat(jsonAnticipo[auxID]['amount']) != parseFloat(data[auxID]['advance'])) {
                        alert(Mensaje6);
                        return false;
                    }

                    if (parseFloat(data[auxID]['advance']) + parseFloat(data[auxID]['amountpaid']) > parseFloat(data[auxID]['amountdue'])) {
                        //var auxResta = parseFloat(data[auxID]['amountdue']) - parseFloat(data[auxID]['advance']);
                        alert(Mensaje7);
                        return false;
                    }
                } else {
                    if (contadorAnticipos != 0) {
                        alert(Mensaje8);
                        return false;
                    }
                }
            }

            //CUSTOM SEGMENTS
            var csegments = {};
            // var customSegments = getCustomSegments();

            // for (var i = 0; i < customSegments.length; i++) {
            //     var segmentId = customSegments[i];
            //     var fieldId = "custpage_" + segmentId;
            //     if (currentRecord.getField(fieldId)) {
            //         var segmentValue = currentRecord.getValue(fieldId);
            //         if (Number(segmentValue)) {
            //             csegments[segmentId] = segmentValue;
            //         }
            //     }
            // }

            var subsidiary = Number(currentRecord.getValue({ fieldId: 'custpage_subsidiary' })) || '';
            var customer = Number(currentRecord.getValue({ fieldId: 'custpage_customer' }));
            var araccount = Number(currentRecord.getValue({ fieldId: 'custpage_araccount' })) || '';
            var currency = Number(currentRecord.getValue({ fieldId: 'custpage_currency' })) || '';
            var exchangeRate = parseFloat(currentRecord.getValue({ fieldId: "custpage_exchangerate" }));
            var date = currentRecord.getValue({ fieldId: 'custpage_date' });
            var period = Number(currentRecord.getValue({ fieldId: 'custpage_period' })) || '';
            var bankaccount = Number(currentRecord.getValue({ fieldId: 'custpage_bankaccount' })) || '';
            var document = Number(currentRecord.getValue({ fieldId: 'custpage_document' })) || '';
            var memo = currentRecord.getValue({ fieldId: 'custpage_memo' });
            var department = Number(currentRecord.getValue({ fieldId: 'custpage_department' })) || '';
            var class_ = Number(currentRecord.getValue({ fieldId: 'custpage_class' })) || '';
            var location = Number(currentRecord.getValue({ fieldId: 'custpage_location' })) || '';
            var paymentmethod = Number(currentRecord.getValue({ fieldId: 'custpage_paymentmethod' })) || '';

            var accountingBooks = getAccountingBooks(currentRecord);
            console.log(accountingBooks);

            var recordlog = record.create({
                type: 'customrecord_lmry_br_custpayment_log'
            });

            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_subsid', value: subsidiary });
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_customer', value: customer });
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_date', value: date });
            var userid = runtime.getCurrentUser().id;
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_employee', value: userid });
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_currency', value: currency });
            recordlog.setValue({ fieldId: "custrecord_lmry_br_custpaym_exchangerate", value: exchangeRate });
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_aracc', value: araccount });
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_bankacc', value: bankaccount });
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_period', value: period });
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_status', value: '1' });
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_doctype', value: document });
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_deparmen', value: department });
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_class', value: class_ });
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_location', value: location });
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_memo', value: memo });
            recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_paymmeth', value: paymentmethod });
            recordlog.setValue({ fieldId: "custrecord_lmry_br_custpaym_log_segments", value: JSON.stringify(csegments) });
            recordlog.setValue({ fieldId: "custrecord_lmry_br_custpaym_accountbooks", value: JSON.stringify(accountingBooks) });
            recordlog.setValue({ fieldId: "custrecord_lmry_br_custpaym_log_type", value: "1" });

            if (JSON.stringify(jsonAnticipo) != '{}') {
                recordlog.setValue({ fieldId: "custrecord_lmry_br_custpaym_log_advance", value: JSON.stringify(jsonAnticipo) });
            }

            if (Object.keys(data).length) {
                recordlog.setValue({ fieldId: 'custrecord_lmry_br_custpaym_log_data', value: JSON.stringify(data) });
            }


            recordlog.setValue('custrecord_lmry_br_custpaym_log_firstpay', JSON.stringify(firstpay));


            var idlog = recordlog.save({
                enableSourcing: true,
                ignoreMandatoryFields: true,
                disableTriggers: true
            });

            currentRecord.setValue({ fieldId: 'custpage_idlog', value: idlog, ignoreFieldChange: true });

            return true;

        }

        function searchPayments(recordObj) {
            var subsidiary = recordObj.getValue("custpage_subsidiary");
            var logQuery = query.create({
                type: "customrecord_lmry_br_custpayment_log"
            });
            /* Joins */
            var transactionJoin = logQuery.autoJoin({
                fieldId: "custrecord_lmry_br_custpaym_log_idpaymt^transaction",
            });
            logQuery.condition = logQuery.and([
                logQuery.createCondition({
                    fieldId: 'custrecord_lmry_br_custpaym_log_status',
                    operator: query.Operator.ANY_OF,
                    values: ['2']
                }),
                logQuery.createCondition({
                    fieldId: 'custrecord_lmry_br_custpaym_log_idpaymt',
                    operator: query.Operator.ANY_OF_NOT,
                    values: [null]
                }),
                logQuery.createCondition({
                    fieldId: 'custrecord_lmry_br_custpaym_log_subsid',
                    operator: query.Operator.ANY_OF,
                    values: [subsidiary]
                }),
                logQuery.createCondition({
                    fieldId: 'isinactive',
                    operator: query.Operator.IS,
                    values: [false]
                })
            ]);

            logQuery.columns = [
                logQuery.createColumn({
                    fieldId: "id"
                }),
                logQuery.createColumn({
                    fieldId: "custrecord_lmry_br_custpaym_log_data",
                    alias: "jsonData"
                }),
                transactionJoin.createColumn({
                    fieldId: "foreigntotal",
                    alias: "amountPayment"
                }),
                logQuery.createColumn({
                    fieldId: "custrecord_lmry_br_custpaym_log_idpaymt",
                    alias: "transactionPayment"
                })
            ];


            logQuery.sort = [
                logQuery.createSort({
                    column: logQuery.columns[0],
                    ascending: false
                })
            ];

            var resultPayment = logQuery.run().asMappedResults();

            if (resultPayment && resultPayment.length) {
                for (var i = 0; i < resultPayment.length; i++) {
                    var invoicesLog = resultPayment[i].jsonData;
                    invoicesLog = JSON.parse(invoicesLog);
                    var transaction = resultPayment[i].transactionPayment;
                    var amount = resultPayment[i].amountPayment;
                    for (var j in invoicesLog) {
                        id = j;

                        if (j.indexOf('-') > -1) {
                            var id = j.split('-');
                            id = id[0];
                        }

                        if (Number(transaction)) {
                            if (amount != 0) {
                                var isPrimerPago = '';
                                if (invoicesLog[j].hasOwnProperty('primerpago')) {
                                    isPrimerPago = invoicesLog[j].primerpago;
                                }
                                if (isPrimerPago == 'T') {
                                    if (!firstInstallment[id]) {
                                        firstInstallment[id] = j;
                                    }
                                    if (!firstPayment[j]) {
                                        firstPayment[j] = resultPayment[i].id
                                    }
                                }
                            }
                        }
                    }

                }
            }

        }

        function getAccountingBooks(currentRecord) {
            var accountingBooks = {};
            if ((FEAT_MULTIBOOK == true || FEAT_MULTIBOOK == "T") && (FEAT_FOREIGN_BOOKS == true || FEAT_FOREIGN_BOOKS == "T")) {
                var numBooks = currentRecord.getLineCount({ sublistId: "custpage_list_book" });
                for (var i = 0; i < numBooks; i++) {
                    var bookId = currentRecord.getSublistValue({ sublistId: "custpage_list_book", fieldId: "custpage_bookid", line: i });
                    currentRecord.selectLine({ sublistId: "custpage_list_book", line: i })
                    var bookExchangeRate = currentRecord.getCurrentSublistValue({ sublistId: "custpage_list_book", fieldId: "custpage_book_exchangerate" });
                    accountingBooks[String(bookId)] = { exchangeRate: parseFloat(bookExchangeRate) };
                }
            }
            return accountingBooks;
        }

        function cancel() {
            var urlSuitelet = url.resolveScript({
                scriptId: SCRIPT_ID,
                deploymentId: DEPLOY_ID,
                returnExternalUrl: false
            });

            window.location.href = urlSuitelet;
        }


        function validateExecution() {
            var validate = true;
            var search_executions = search.create({
                type: "scheduledscriptinstance",
                filters:
                    [
                        ["status", "anyof", "PENDING", "PROCESSING"], "AND",
                        ["script.scriptid", "startswith", MR_SCRIPT_ID], "AND",
                        ["scriptdeployment.scriptid", "startswith", MR_DEPLOYMENT_ID]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "timestampcreated",
                            sort: search.Sort.DESC
                        }),
                        "mapreducestage",
                        "status",
                        "taskid"
                    ]
            });

            var results = search_executions.run().getRange(0, 1);

            var MESSAGE = {
                'title': {
                    'es': 'Alerta', 'pt': 'Alerta', 'en': 'Alert'
                },
                'description': {
                    'es': 'Espere un momento por favor, se encuentra en transcurso un Proceso del LatamReady - BR Customer Payment.',
                    'pt': 'Aguarde um momento, um processo de LatamReady - BR Pagamento do Cliente está em andamento.',
                    'en': 'Please wait a moment, a LatamReady - BR Customer Payment Process is in progress.'
                }
            };

            if (results && results.length) {
                validate = false;
                var myMsg = message.create({
                    title: MESSAGE['title'][LANGUAGE] || MESSAGE['title']['en'],
                    message: MESSAGE['description'][LANGUAGE] || MESSAGE['description']['en'],
                    type: message.Type.INFORMATION,
                    duration: 8000
                });
                myMsg.show();
            }

            return validate;
        }

        function setExchangeRate(currentRecord) {
            var currency = currentRecord.getValue("custpage_currency");
            var trandate = currentRecord.getValue("custpage_date");
            var subsidiary = currentRecord.getValue("custpage_subsidiary");
            if (Number(currency) && trandate && Number(subsidiary)) {
                var subsidiaryCurrency = search.lookupFields({
                    type: "subsidiary",
                    id: subsidiary,
                    columns: ["currency"]
                }).currency[0].value;

                var exchangeRate = currencyApi.exchangeRate({
                    date: trandate,
                    source: currency,
                    target: subsidiaryCurrency
                });
                exchangeRate = parseFloat(exchangeRate);
                console.log(exchangeRate);
                currentRecord.setValue({ fieldId: "custpage_exchangerate", value: exchangeRate, ignoreFieldChange: true });
            } else {
                currentRecord.setValue({ fieldId: "custpage_exchangerate", value: "", ignoreFieldChange: true });
            }
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            validateField: validateField,
            fieldChanged: fieldChanged,
            toggleCheckBoxes: toggleCheckBoxes,
            cancel: cancel
        }
    });
