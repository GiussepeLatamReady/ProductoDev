/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Payment and Generate WHT                   ||
||                                                              ||
||  File Name: LMRY_CO_WHT_CustPayment_MPRD_V2.1.js	            ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Aug 08 2022  LatamReady    Use Script 2.1           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/log', 'N/search', 'N/record', 'N/runtime', 'N/format', 'N/cache', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0',
            './Latam_Library/LMRY_CO_WHT_MainLevel_LBRY_V2.1', './Latam_Library/LMRY_CO_WHT_LineLevel_LBRY_V2.1'],
    (log, search, record, runtime, format, cache, library_mail, library_mainlevel, library_linelevel) => {

        const LMRY_script = "LMRY_CO_WHT_CustPayment_MPRD_V2.1.js";

        const getInputData = () => {

            let idLog = runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_co_wht_on_custpay_id' });
            try {
                record.submitFields({
                    type: "customrecord_lmry_co_wht_on_payment_log",
                    id: idLog,
                    values: {
                        "custrecord_lmry_co_paym_log_status": "4"
                    },
                    options: {
                        disableTriggers: true
                    }
                });

                let transactions = [];
                log.debug('Starting.. getInputData');
                let params = getParametersLog();
                log.debug('params', JSON.stringify(params));

                let myCache = cache.getCache({
                    name: 'CoPaymentPartial',
                    scope: cache.Scope.PRIVATE
                });

                myCache.put({
                    key: 'paramsPayment',
                    value: JSON.stringify(params)
                });

                if (params['transactions']) {
                    transactions = params['transactions'];
                    log.debug('transactions', transactions);
                }

                return transactions;

            } catch (err) {
                library_mail.sendemail('[ getInputData ]' + err, LMRY_script);
                log.debug('err', err);
                if (idLog) {
                    let errObj = { "name": err.name, "message": err.message, "stack": err.stack };
                    record.submitFields({
                        type: "customrecord_lmry_co_wht_on_payment_log",
                        id: idLog,
                        values: {
                            "custrecord_lmry_co_paym_log_error": JSON.stringify(errObj),
                            "custrecord_lmry_co_paym_log_status": "3"
                        },
                        options: {
                            disableTriggers: true
                        }
                    });
                }
            }
        }


        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
            try {
                let id = Number(mapContext.key);
                log.debug('key', id);
                let mapValues = JSON.parse(mapContext.value);
                log.debug('mapValues', mapValues);

                if (!(mapValues['reteica'] === "0" && mapValues['reteiva'] === "0" && mapValues['retefte'] === "0")) {

                    let myCache = cache.getCache({
                        name: 'CoPaymentPartial',
                        scope: cache.Scope.PRIVATE
                    });

                    let params = myCache.get({
                        key: 'paramsPayment',
                        loader: getParametersLog
                    });
                    let resultWHT = { reteamountToDiscount: 0 };

                    if (typeof (params) == 'string') {
                        params = JSON.parse(params);
                    }
                    log.debug("params", params);

                    let appliesto = params["appliesto"] || "";
                    if (appliesto === "1") {
                        resultWHT = library_mainlevel.Create_WHT_Latam('invoice', id, mapValues, params);
                    } else if (appliesto === "2") {
                        resultWHT = library_linelevel.Create_WHT_Latam('invoice', id, mapValues, params);
                    }
                    log.debug('amountReteTotal', resultWHT);
                    mapValues['amountpaid'] = mapValues['amountpaid'] - resultWHT['reteamountToDiscount'];
                }

                let arrJson = { 'id': id, 'values': mapValues };
                log.debug('arrJson', arrJson);
                mapContext.write({
                    key: "1",
                    value: arrJson
                });
            } catch (err) {
                log.error('[ map ]', err);
                library_mail.sendemail('[ map ]' + err, LMRY_script);
                let idLog = runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_co_wht_on_custpay_id' });
                if (idLog) {
                    let errObj = { "name": err.name, "message": err.message, "stack": err.stack };
                    record.submitFields({
                        type: "customrecord_lmry_co_wht_on_payment_log",
                        id: idLog,
                        values: {
                            "custrecord_lmry_co_paym_log_error": JSON.stringify(errObj),
                            "custrecord_lmry_co_paym_log_status": "3"
                        },
                        options: {
                            disableTriggers: true
                        }
                    });
                }
            }
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
            try {
                log.debug('Reduce', 'Starting.....')
                let customer = reduceContext.key;
                log.debug('customer', customer);
                let arrParams = reduceContext.values;
                log.debug('arrParams', JSON.stringify(arrParams));

                let idLog = runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_co_wht_on_custpay_id' });

                let transactions = {};
                for (let i = 0; i < arrParams.length; i++) {
                    let aux = JSON.parse(arrParams[i])
                    transactions[aux['id']] = aux['values'];
                }

                log.debug('transactions', transactions);

                let myCache = cache.getCache({
                    name: 'CoPaymentPartial',
                    scope: cache.Scope.PRIVATE
                });

                let params = myCache.get({
                    key: 'paramsPayment',
                    loader: getParametersLog
                });

                myCache.remove({
                    key: 'paramsPayment'
                });

                if (typeof (params) == 'string') {
                    params = JSON.parse(params);
                }

                log.debug('params', params);

                let setup = getSetupTaxSubsidiary(params['subsidiary']);
                log.debug('setup', JSON.stringify(setup));

                let idpayment = createPayment(params, transactions, setup['paymentform']);
                log.debug('idpayment', idpayment);

                let status = (idpayment) ? '2' : '3';

                record.submitFields({
                    type: 'customrecord_lmry_co_wht_on_payment_log',
                    id: idLog,
                    values: {
                        'custrecord_lmry_co_paym_log_payment': idpayment,
                        'custrecord_lmry_co_paym_log_status': status
                    },
                    options: {
                        disableTriggers: true
                    }
                });

            } catch (err) {
                log.error('[ reduce ]', err);
                library_mail.sendemail('[ reduce ]' + err, LMRY_script);

                if (idLog) {
                    let errObj = { "name": err.name, "message": err.message, "stack": err.stack };
                    record.submitFields({
                        type: "customrecord_lmry_co_wht_on_payment_log",
                        id: idLog,
                        values: {
                            "custrecord_lmry_co_paym_log_error": JSON.stringify(errObj),
                            "custrecord_lmry_co_paym_log_status": "3"
                        },
                        options: {
                            disableTriggers: true
                        }
                    });
                }
            }
        }

        const getParametersLog = () => {
            let idLog = runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_co_wht_on_custpay_id' });
            let params = {};

            let columns = [
                "custrecord_lmry_co_paym_log_subsi", "custrecord_lmry_co_paym_log_entity", "custrecord_lmry_co_paym_log_date",
                "custrecord_lmry_co_paym_log_employee", "custrecord_lmry_co_paym_log_account", "custrecord_lmry_co_paym_log_bankaccount",
                "custrecord_lmry_co_paym_log_currency", "custrecord_lmry_co_paym_log_exchangerate", "custrecord_lmry_co_paym_log_data",
                "custrecord_lmry_co_paym_log_status", "custrecord_lmry_co_paym_log_department", "custrecord_lmry_co_paym_log_class",
                "custrecord_lmry_co_paym_log_location", "custrecord_lmry_co_paym_log_memo", "custrecord_lmry_co_paym_log_accountbooks",
                "custrecord_lmry_co_paym_log_check", "custrecord_lmry_co_paym_log_process", "custrecord_lmry_co_paym_log_appliesto"
            ]

            let result = search.lookupFields({
                type: "customrecord_lmry_co_wht_on_payment_log",
                id: idLog,
                columns: columns
            });

            log.debug("result", result);

            let subsidiary = result["custrecord_lmry_co_paym_log_subsi"] || "";
            if (subsidiary && subsidiary.length) {
                params["subsidiary"] = subsidiary[0]["value"];
            }
            params["entity"] = result["custrecord_lmry_co_paym_log_entity"][0]["value"];
            // date = format.parse({ value: date, type: format.Type.DATE });
            params["date"] = result["custrecord_lmry_co_paym_log_date"];
            params["currency"] = result["custrecord_lmry_co_paym_log_currency"][0]["value"];
            params["account"] = result["custrecord_lmry_co_paym_log_account"][0]["value"];
            params["exchangerate"] = result["custrecord_lmry_co_paym_log_exchangerate"] || "";

            let bankaccount = result["custrecord_lmry_co_paym_log_bankaccount"] || "";
            if (bankaccount && bankaccount.length) {
                params["bankaccount"] = bankaccount[0]["value"];
            }

            let department = result["custrecord_lmry_co_paym_log_department"];
            if (department && department.length) {
                params["department"] = department[0]["value"];
            }

            let class_ = result["custrecord_lmry_co_paym_log_class"] || "";
            if (class_ && class_.length) {
                params["class"] = class_[0]["value"];
            }

            let location = result["custrecord_lmry_co_paym_log_location"] || "";
            if (location && location.length) {
                params["location"] = location[0]["value"];
            }

            params["memo"] = result["custrecord_lmry_co_paym_log_memo"] || "";
            params["check"] = result["custrecord_lmry_co_paym_log_check"] || "";

            let strTransactions = result["custrecord_lmry_co_paym_log_data"];

            let strBooks = result["custrecord_lmry_co_paym_log_accountbooks"];
            if (strBooks) {
                params["books"] = JSON.parse(strBooks);
            }

            if (strTransactions) {
                params["transactions"] = JSON.parse(strTransactions);
            }

            params["process"] = result["custrecord_lmry_co_paym_log_process"] || "";

            let appliesto = result["custrecord_lmry_co_paym_log_appliesto"] || "";
            if (appliesto && appliesto.length) {
                params["appliesto"] = appliesto[0]["value"];
            }

            return params;
        }

        const createPayment = (paymentObj, transactions, form) => {
            let idPayment = "";
            log.debug('Entro CreatePayment', 'Entro CreatePayment');

            let customer = paymentObj['entity'];
            let paymentRecord = record.transform({
                fromType: record.Type.CUSTOMER,
                fromId: customer,
                toType: record.Type.CUSTOMER_PAYMENT,
                isDynamic: true
            });

            if (form) {
                paymentRecord.setValue('customform', form);
            }
            paymentRecord.setValue('subsidiary', paymentObj['subsidiary']);
            let trandate = paymentObj['date'];
            trandate = format.parse({ value: trandate, type: format.Type.DATE });
            paymentRecord.setValue('trandate', trandate);
            paymentRecord.setValue('aracct', paymentObj['account']);
            paymentRecord.setValue('currency', paymentObj['currency']);
            paymentRecord.setValue('exchangerate', paymentObj['exchangerate']);
            paymentRecord.setValue('account', paymentObj['bankaccount']);
            paymentRecord.setValue('memo', paymentObj['memo']);
            paymentRecord.setValue('tranid', paymentObj['check']);
            if (paymentObj['department']) {
                paymentRecord.setValue('department', paymentObj['department']);
            }
            if (paymentObj['class']) {
                paymentRecord.setValue('class', paymentObj['class']);
            }
            if (paymentObj['location']) {
                paymentRecord.setValue('location', paymentObj['location']);
            }

            let numApply = paymentRecord.getLineCount({ sublistId: 'apply' });

            for (let i = 0; i < numApply; i++) {
                paymentRecord.selectLine({ sublistId: 'apply', line: i });

                let key = paymentRecord.getCurrentSublistValue({
                    sublistId: 'apply',
                    fieldId: 'internalid'
                });

                if (transactions[key]) {
                    paymentRecord.setCurrentSublistValue({
                        sublistId: 'apply',
                        fieldId: 'apply',
                        value: true
                    });

                    paymentRecord.setCurrentSublistValue({
                        sublistId: 'apply',
                        fieldId: 'amount',
                        value: parseFloat(transactions[key]['amountpaid'])
                    });
                }
            }

            let FEAT_MULTIBOOK = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
            if (FEAT_MULTIBOOK === true) {
                let accountingBooks = paymentObj["books"];
                let numBooks = paymentRecord.getLineCount({ sublistId: "accountingbookdetail" });
                for (let i = 0; i < numBooks; i++) {
                    paymentRecord.selectLine({ sublistId: 'accountingbookdetail', line: i })
                    let bookId = paymentRecord.getCurrentSublistValue({ sublistId: "accountingbookdetail", fieldId: "bookid" });
                    bookId = String(bookId);
                    if (accountingBooks.hasOwnProperty(bookId) && accountingBooks[bookId].exchangeRate) {
                        let bookExchangeRate = accountingBooks[bookId].exchangeRate;
                        bookExchangeRate = parseFloat(bookExchangeRate);
                        paymentRecord.setCurrentSublistValue({ sublistId: "accountingbookdetail", fieldId: "exchangerate", value: bookExchangeRate });
                    }
                }
            }

            idPayment = paymentRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true,
                disableTriggers: true
            });
            return idPayment;
        }

        const getSetupTaxSubsidiary = (idSubsidiary) => {

            let setupTaxSubsidiary = {};
            let filters = [
                ['isinactive', 'is', 'F']
            ]
            if (idSubsidiary) {
                filters.push('AND', ['custrecord_lmry_setuptax_subsidiary', 'anyof', idSubsidiary]);
            }
            let search_setup = search.create({
                type: 'customrecord_lmry_setup_tax_subsidiary',
                filters: filters,
                columns: [
                    'internalid', 'custrecord_lmry_setuptax_form_custpaymt',
                    'custrecord_lmry_setuptax_form_journal',
                    'custrecord_lmry_setuptax_form_creditmemo'
                ]
            });

            let results = search_setup.run().getRange(0, 10);

            if (results && results.length) {
                setupTaxSubsidiary['paymentform'] = results[0].getValue('custrecord_lmry_setuptax_form_custpaymt') || '';
                setupTaxSubsidiary['journalform'] = results[0].getValue('custrecord_lmry_setuptax_form_journal') || '';
                setupTaxSubsidiary['creditform'] = results[0].getValue('custrecord_lmry_setuptax_form_creditmemo') || '';
            }

            return setupTaxSubsidiary;
        }

        return {getInputData, map, reduce}

    });
