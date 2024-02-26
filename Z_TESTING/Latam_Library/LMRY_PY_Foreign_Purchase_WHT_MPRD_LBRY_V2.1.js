/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_PY_Foreign_Purchase_WHT_MPRD_LBRY_V2.1.js
 * @Author gerson@latamready.com
 */
define(["N/search", "N/runtime", "N/record", "N/log", "N/url", "N/format"],

    function (search, runtime, record, log, url, format) {

        function getLogData(idLog) {
            let dataMap = {};
            let dataLog = search.lookupFields({
                type: "customrecord_lmry_py_wht_purchase",
                id: idLog,
                columns: [
                    "custrecord_lmry_py_wht_subsidiary", "custrecord_lmry_py_wht_entity", "custrecord_lmry_py_wht_currency",
                    "custrecord_lmry_py_wht_datefrom", "custrecord_lmry_py_wht_dateto", "custrecord_lmry_py_wht_dateissue",
                    "custrecord_lmry_py_wht_department", "custrecord_lmry_py_wht_class", "custrecord_lmry_py_wht_location",
                    "custrecord_lmry_py_wht_batch", "custrecord_lmry_py_wht_memo", "custrecord_lmry_py_wht_data",
                    "custrecord_lmry_py_wht_books", "custrecord_lmry_py_wht_exchange_rate"
                ]
            });
            log.debug("dataLog", JSON.stringify(dataLog));
            let subsidiary = dataLog.custrecord_lmry_py_wht_subsidiary ? dataLog.custrecord_lmry_py_wht_subsidiary[0].value : 1;
            let vendor = dataLog.custrecord_lmry_py_wht_entity.length ? dataLog.custrecord_lmry_py_wht_entity[0].value : "";
            let currency = dataLog.custrecord_lmry_py_wht_currency.length ? dataLog.custrecord_lmry_py_wht_currency[0].value : "";
            let datefrom = dataLog.custrecord_lmry_py_wht_datefrom;
            let dateto = dataLog.custrecord_lmry_py_wht_dateto;
            let dateissue = dataLog.custrecord_lmry_py_wht_dateissue;
            let department = dataLog.custrecord_lmry_py_wht_department.length ? dataLog.custrecord_lmry_py_wht_department[0].value : "";
            let class_ = dataLog.custrecord_lmry_py_wht_class.length ? dataLog.custrecord_lmry_py_wht_class[0].value : "";
            let location = dataLog.custrecord_lmry_py_wht_location.length ? dataLog.custrecord_lmry_py_wht_location[0].value : "";
            let batch = dataLog.custrecord_lmry_py_wht_batch;
            let memo = dataLog.custrecord_lmry_py_wht_memo;
            let data = JSON.parse(dataLog.custrecord_lmry_py_wht_data);
            let exchangeRate = dataLog.custrecord_lmry_py_wht_exchange_rate;
            let applyExchangeRate = dataLog.custrecord_lmry_py_wht_apply_rate;
            let accountingBooks = JSON.parse(dataLog.custrecord_lmry_py_wht_books);
            log.debug("data", JSON.stringify(data));

            let setupJson = setupTaxSubsidiary(subsidiary);
            log.debug("setupJson", JSON.stringify(setupJson));

            for (const bill in data) {
                dataMap[bill] = {
                    subsidiary: subsidiary,
                    vendor: vendor ? vendor : data[bill].vendor,
                    currency: currency ? currency : data[bill].currency,
                    precision: setupJson["precision"][currency ? currency : data[bill].currency] != undefined ? setupJson["precision"][currency ? currency : data[bill].currency] : 2,
                    datefrom: datefrom,
                    dateto: dateto,
                    dateissue: dateissue,
                    department: department,
                    class_: class_,
                    location: location,
                    batch: batch,
                    memo: memo,
                    exchangeRate,
                    accountingBooks,
                    applyExchangeRate,
                    total_amt: data[bill].total_amt,
                    wht_percent: data[bill].wht_percent,
                    apply_rule: data[bill].apply_rule,
                    wht_amount: data[bill].wht_amount,
                    form: setupJson["formJournal"],
                    currency_setup: setupJson["currencySetup"],
                    bankaccount: setupJson["bankAccounts"][currency ? currency : data[bill].currency] ? setupJson["bankAccounts"][currency ? currency : data[bill].currency] : ""
                };
            }
            return dataMap;
        }

        function hasError(idLog) {
            let dataLog = search.lookupFields({
                type: "customrecord_lmry_py_wht_purchase",
                id: idLog,
                columns: ["custrecord_lmry_py_wht_errors"]
            });
            return !!dataLog.custrecord_lmry_py_wht_errors;
        }

        function setLogStatus(idLog, data) {
            record.submitFields({
                type: "customrecord_lmry_py_wht_purchase",
                id: idLog,
                values: data,
                options: {
                    ignoreMandatoryFields: true,
                    disableTriggers: true
                }
            });
        }

        function getNationalTaxes(dataLog) {
            // National Taxes
            let data = [];

            let rule = dataLog.apply_rule;
            if (!rule) {
                return data;
            }

            let subsidiary = dataLog.subsidiary;
            let datefrom = dataLog.datefrom;
            let dateto = dataLog.dateto;

            let filters = [
                ["isinactive", "is", "F"], "AND",
                ["custrecord_lmry_ntax_transactiontypes", "is", "4"], "AND", //Bill
                ["custrecord_lmry_ntax_appliesto", "is", "1"], "AND", //Total
                ["custrecord_lmry_ntax_gen_transaction", "is", "8"], "AND", //Latam WHT
                ["custrecord_lmry_ntax_wht_rule", "is", rule]
            ];

            let FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
            if (FEAT_SUBS == true || FEAT_SUBS == "T") {
                filters.push("AND", ["custrecord_lmry_ntax_subsidiary", "anyof", subsidiary]);
            }

            if (datefrom) {
                filters.push("AND", ["custrecord_lmry_ntax_datefrom", "onorbefore", format.format({ value: format.parse({ value: datefrom, type: format.Type.DATE }), type: format.Type.DATE })]);
            }

            if (dateto) {
                filters.push("AND", ["custrecord_lmry_ntax_dateto", "onorafter", format.format({ value: format.parse({ value: dateto, type: format.Type.DATE }), type: format.Type.DATE })]);
            }

            let columns = [
                "internalid", "custrecord_lmry_co_ntax_taxrate", "custrecord_lmry_nt_transfer_account",
                "custrecord_lmry_ntax_sub_type", "custrecord_lmry_ntax_description"
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
                            let id = results[i].getValue("internalid");
                            let rate = results[i].getValue("custrecord_lmry_co_ntax_taxrate");
                            let account = results[i].getValue("custrecord_lmry_nt_transfer_account");
                            let subtype = results[i].getValue("custrecord_lmry_ntax_sub_type");
                            let subtypetext = results[i].getText("custrecord_lmry_ntax_sub_type");
                            let description = results[i].getValue("custrecord_lmry_ntax_description");
                            data.push({
                                id: id,
                                rate: rate,
                                account: account,
                                subtype: subtype,
                                subtypetext: subtypetext,
                                description: description
                            });
                        }
                    }
                });
            }
            log.debug("data", JSON.stringify(data));
            return data;
        }

        function createJournal(billId, dataLog, nationalTaxes) {
            let FEAT_MULTIBOOK = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
            let subsidiary = dataLog.subsidiary;
            let vendor = dataLog.vendor;
            let dateissue = dataLog.dateissue;
            dateissue = format.parse({ value: dateissue, type: format.Type.DATE });
            let currency = dataLog.currency;
            let precision = dataLog.precision;
            let memo = dataLog.memo;
            let exchangeRate = dataLog.exchangeRate;
            let applyExchangeRate = dataLog.applyExchangeRate === "T" || dataLog.applyExchangeRate === true
            let accountingBooks = dataLog.accountingBooks;
            let department = dataLog.department;
            let class_ = dataLog.class_;
            let location = dataLog.location;
            let formJournal = dataLog.form;
            let bankaccount = dataLog.bankaccount;

            if (!bankaccount) {
                return 0;
            }

            // Check if there is retention
            let retention = 0, subtypes = [], account = "";
            for (let index = 0; index < nationalTaxes.length; index++) {
                retention += round(dataLog.total_amt * nationalTaxes[index].rate / 100, 2);
                subtypes.push(nationalTaxes[index].subtypetext);
                account = nationalTaxes[index].account;
            }

            if (!retention || !account) {
                return 0;
            }

            let apaccount = search.lookupFields({ type: "vendorbill", id: billId, columns: ["account"] }).account[0].value;

            let journalObj = record.create({ type: "journalentry", isDynamic: true });

            if (formJournal != "") {
                journalObj.setValue({ fieldId: "customform", value: formJournal });
            }

            journalObj.setValue("subsidiary", subsidiary);
            journalObj.setValue("currency", currency);
            journalObj.setValue("trandate", dateissue);
            journalObj.setValue("memo", memo);

            if (applyExchangeRate) {
                journalObj.setValue("exchangerate", exchangeRate);
                if (FEAT_MULTIBOOK== "T"|| FEAT_MULTIBOOK == true) {
                    setAccountingBookDetails(journalObj,accountingBooks)
                }
                
            }
            

            let FEAT_JOURNAL = runtime.getCurrentScript().getParameter({ name: "CUSTOMAPPROVALJOURNAL" });
            if (FEAT_JOURNAL === true || FEAT_JOURNAL === "T") {
                journalObj.setValue("approvalstatus", "2");
            }

            journalObj.setValue("custbody_lmry_reference_transaction", billId);
            journalObj.setValue("custbody_lmry_reference_transaction_id", billId);

            journalObj.selectNewLine({ sublistId: "line" });
            journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "account", value: apaccount });
            journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "memo", value: subtypes.join(", ") });
            journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "debit", value: round(retention, precision) });
            journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "entity", value: vendor });

            if (department != null && department != "") {
                journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "department", value: department });
            }

            if (class_ != null && class_ != "") {
                journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "class", value: class_ });
            }

            if (location != null && location != "") {
                journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "location", value: location });
            }

            journalObj.commitLine({ sublistId: "line" });

            journalObj.selectNewLine({ sublistId: "line" });
            journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "account", value: account });
            journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "memo", value: subtypes.join(", ") });
            journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "credit", value: round(retention, precision) });
            journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "entity", value: vendor });

            if (department != null && department != "") {
                journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "department", value: department });
            }

            if (class_ != null && class_ != "") {
                journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "class", value: class_ });
            }

            if (location != null && location != "") {
                journalObj.setCurrentSublistValue({ sublistId: "line", fieldId: "location", value: location });
            }

            journalObj.commitLine({ sublistId: "line" });

            let idJournal = journalObj.save({ ignoreMandatoryFields: true, disableTriggers: true });

            // Application of the Journal to Bill
            let billpaymentObj = record.transform({
                fromType: record.Type.VENDOR_BILL,
                fromId: billId,
                toType: record.Type.VENDOR_PAYMENT,
                isDynamic: true
            });

            billpaymentObj.setValue("trandate", dateissue);
            billpaymentObj.setValue("memo", memo);
            billpaymentObj.setValue("apacct", apaccount);
            billpaymentObj.setValue("currency", currency);
            billpaymentObj.setValue("account", bankaccount);
            if (department) {
                billpaymentObj.setValue("department", department);
            }
            if (class_) {
                billpaymentObj.setValue("class", class_);
            }
            if (location) {
                billpaymentObj.setValue("location", location);
            }

            let numApply = billpaymentObj.getLineCount({ sublistId: "apply" });
            for (let i = 0; i < numApply; i++) {
                billpaymentObj.selectLine({ sublistId: "apply", line: i });

                let key = billpaymentObj.getCurrentSublistValue({
                    sublistId: "apply",
                    fieldId: "internalid"
                });

                if (key == billId) {
                    billpaymentObj.setCurrentSublistValue({
                        sublistId: "apply",
                        fieldId: "apply",
                        value: true
                    });

                    billpaymentObj.setCurrentSublistValue({
                        sublistId: "apply",
                        fieldId: "amount",
                        value: round(retention, precision)
                    });
                }

                if (key == idJournal) {
                    billpaymentObj.setCurrentSublistValue({
                        sublistId: "apply",
                        fieldId: "apply",
                        value: true
                    });
                }
            }
            if (FEAT_MULTIBOOK== "T"|| FEAT_MULTIBOOK == true) {
                setAccountingBookDetails(billpaymentObj,accountingBooks)
            }
            
            
            

            billpaymentObj.save({ ignoreMandatoryFields: true, disableTriggers: true });

            return idJournal;
        }

        function setAccountingBookDetails(newTransaction,accountingBooks){
            const numApplyBook = newTransaction.getLineCount({ sublistId: "accountingbookdetail" });
            if (numApplyBook > 0) {
                for (let i = 0; i < numApplyBook; i++) {
                    newTransaction.selectLine({ sublistId: "accountingbookdetail", line: i });

                    const bookId = newTransaction.getCurrentSublistValue({
                        sublistId: "accountingbookdetail",
                        fieldId: "bookid"
                    });
                    if (accountingBooks[bookId]) {
                        newTransaction.setCurrentSublistValue({
                            sublistId: "accountingbookdetail",
                            fieldId: "exchangerate",
                            value: accountingBooks[bookId].exchangeRate
                        });
                    }
                    
                }
            }
        }

        function setupTaxSubsidiary(subsidiary) {
            let jsonSetupTax = {};
            let setupTax = search.create({
                type: "customrecord_lmry_setup_tax_subsidiary",
                columns: [
                    "custrecord_lmry_setuptax_form_journal", "custrecord_lmry_setuptax_currency", "custrecord_lmry_setuptax_multicurrency",
                    "custrecord_lmry_py_bank_setup.custrecord_lmry_py_bank_currency", "custrecord_lmry_py_bank_setup.custrecord_lmry_py_bank_account"
                ],
                filters: [
                    { name: "isinactive", operator: "is", values: "F" },
                    { name: "custrecord_lmry_setuptax_subsidiary", operator: "is", values: subsidiary }
                ]
            });

            let resultTax = setupTax.run().getRange({ start: 0, end: 1000 });

            if (resultTax && resultTax.length) {
                jsonSetupTax["formJournal"] = resultTax[0].getValue("custrecord_lmry_setuptax_form_journal") || "";
                jsonSetupTax["currencySetup"] = resultTax[0].getValue("custrecord_lmry_setuptax_currency") || "";

                let currencies = resultTax[0].getValue("custrecord_lmry_setuptax_multicurrency").split(",") || [];
                jsonSetupTax["multicurrency"] = currencies.filter((a) => !isNaN(a) && a !== "");

                let precision = {};
                for (let i = 0; i < jsonSetupTax["multicurrency"].length; i++) {
                    let currencyObj = record.load({ type: "currency", id: jsonSetupTax["multicurrency"][i] });
                    precision[jsonSetupTax["multicurrency"][i]] = currencyObj.getValue("currencyprecision");
                }
                jsonSetupTax["precision"] = precision;
                
                let accountByCurrency = {};
                for (let i = 0; i < resultTax.length; i++) {
                    let currencySetup = resultTax[i].getValue({ join: "custrecord_lmry_py_bank_setup", name: "custrecord_lmry_py_bank_currency" });
                    let bankAccount = resultTax[i].getValue({ join: "custrecord_lmry_py_bank_setup", name: "custrecord_lmry_py_bank_account" });
                    accountByCurrency[currencySetup] = bankAccount;
                }
                jsonSetupTax["bankAccounts"] = accountByCurrency;
            }

            return jsonSetupTax;
        }

        function round(num, precision) {
            let e = (num >= 0) ? 1e-6 : -1e-6;
            precision = precision != undefined ? precision : 2;
            return parseFloat(Math.round(parseFloat(num) * Number("1e" + precision) + e) / Number("1e" + precision));
        }

        function createTaxResult(billId, dataLog, nationalTaxes) {
            let billObj = record.load({ type: "vendorbill", id: billId });
            let currency_setup = dataLog.currency_setup;

            let localRate = getLocalExchangeRate(billObj, currency_setup);
            let multibook = getAccountingBook(billObj);

            // Create Tax Result
            let recordSummary = record.create({ type: "customrecord_lmry_br_transaction", isDynamic: false });

            recordSummary.setValue({ fieldId: "custrecord_lmry_br_related_id", value: String(billId) });
            recordSummary.setValue({ fieldId: "custrecord_lmry_br_transaction", value: billId });

            let retention = 0;
            for (let index = 0; index < nationalTaxes.length; index++) {

                //recordSummary.setValue({ fieldId: "custrecord_lmry_br_type_id", value: nationalTaxes[index].subtype });
                //recordSummary.setValue({ fieldId: "custrecord_lmry_br_type", value: nationalTaxes[index].subtypetext });

                retention += round(dataLog.total_amt * nationalTaxes[index].rate / 100, 2);

            }
            recordSummary.setValue({ fieldId: "custrecord_lmry_base_amount", value: dataLog.total_amt });
            recordSummary.setValue({ fieldId: "custrecord_lmry_br_total", value: round(retention, dataLog.precision) });
            recordSummary.setValue({ fieldId: "custrecord_lmry_br_percent", value: parseFloat(dataLog.wht_percent / 100) });

            recordSummary.setValue({ fieldId: "custrecord_lmry_total_item", value: "Total" });
            //recordSummary.setValue({ fieldId: "custrecord_lmry_br_ccl", value: nationalTaxes[index].id });
            //recordSummary.setValue({ fieldId: "custrecord_lmry_ntax", value: nationalTaxes[index].id });

            recordSummary.setValue({ fieldId: "custrecord_lmry_accounting_books", value: multibook });
            //recordSummary.setValue({ fieldId: "custrecord_lmry_tax_description", value: nationalTaxes[index].description });
            recordSummary.setValue({ fieldId: "custrecord_lmry_total_base_currency", value: round(retention * localRate, dataLog.precision) });
            recordSummary.setValue({ fieldId: "custrecord_lmry_base_amount_local_currc", value: dataLog.total_amt * localRate });
            recordSummary.setValue({ fieldId: "custrecord_lmry_amount_local_currency", value: retention * localRate });
            recordSummary.setValue({ fieldId: "custrecord_lmry_gross_amt_local_curr", value: dataLog.total_amt * localRate });

            recordSummary.setValue({ fieldId: "custrecord_lmry_tax_type", value: "1" });

            let idRecordSummary = recordSummary.save({ disableTriggers: true, ignoreMandatoryFields: true });

            log.debug("idRecordSummary", idRecordSummary);

            return idRecordSummary;
        }

        function getLocalExchangeRate(recordObj, localCurrency) {
            let FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
            let FEAT_MULTIBOOK = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });

            let tranExchangeRate = recordObj.getValue("exchangerate");

            if (FEAT_SUBS && FEAT_MULTIBOOK) {
                let subsidiaryId = recordObj.getValue("subsidiary");
                let subsidiaryCurrency = search.lookupFields({
                    type: "subsidiary",
                    id: subsidiaryId,
                    columns: ["currency"]
                }).currency[0].value;

                if (localCurrency && (Number(localCurrency) != Number(subsidiaryCurrency))) {
                    if (recordObj.getLineCount({ sublistId: "accountingbookdetail" }) > 0) {
                        for (let i = 0; i < recordObj.getLineCount({ sublistId: "accountingbookdetail" }); i++) {
                            let currencyBook = recordObj.getSublistValue({ sublistId: "accountingbookdetail", fieldId: "currency", line: i });
                            if (Number(currencyBook) == Number(localCurrency)) {
                                let rateBook = recordObj.getSublistValue({ sublistId: "accountingbookdetail", fieldId: "exchangerate", line: i });
                                return rateBook;
                            }
                        }
                    }
                }
            }
            return tranExchangeRate;
        }

        function getAccountingBook(recordObj) {
            let FEAT_MULTIBOOK = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
            let auxBookMB = [0];
            let auxExchangeMB = [recordObj.getValue({ fieldId: "exchangerate" })];

            if (FEAT_MULTIBOOK) {
                let lineasBook = recordObj.getLineCount({ sublistId: "accountingbookdetail" });
                if (lineasBook != null && lineasBook !== "") {
                    for (let j = 0; j < lineasBook; j++) {
                        auxBookMB.push(recordObj.getSublistValue({ sublistId: "accountingbookdetail", fieldId: "accountingbook", line: j }));
                        auxExchangeMB.push(recordObj.getSublistValue({ sublistId: "accountingbookdetail", fieldId: "exchangerate", line: j }));
                    }
                }
            }

            let multibook = auxBookMB.join("|") + "&" + auxExchangeMB.join("|");

            return multibook;
        }

        function updateBillField(idLog) {
            record.submitFields({
                type: "vendorbill",
                id: idLog,
                values: {
                    custbody_lmry_scheduled_process: true
                },
                options: {
                    ignoreMandatoryFields: true,
                    disableTriggers: true
                }
            });
        }

        return {
            getLogData: getLogData,
            hasError: hasError,
            setLogStatus: setLogStatus,
            setupTaxSubsidiary: setupTaxSubsidiary,
            getNationalTaxes: getNationalTaxes,
            createJournal: createJournal,
            createTaxResult: createTaxResult,
            updateBillField: updateBillField
        };

    });