/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_TAX_Withholding_LBRY_V2.0.js		        ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Nov 25 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
define(['N/log', 'N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', '../Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', '../Latam_Library/LMRY_Log_LBRY_V2.0.js'],
    function (log, record, search, runtime, error, format, library_mail, lbryLog) {
        var LMRY_script = 'LMRY_TAX_Withholding_LBRY_V2.0.js';
        var TAX_TYPE = 1;
        var GEN_TRANSACTION = 6;
        var FEAT_SUBS = false;
        var FEAT_MULTIBOOK = false;
        var FEAT_INSTALLMENTS = false;
        var CONFIG_TRANSACTION = {
            'invoice': { 'recordtype': 'creditmemo', "form": "creditmemoform" },
            'creditmemo': { 'recordtype': 'invoice', "form": "invoiceform" },
        };

        var FEATURE_TRANSACTION = {
            'invoice': 'CUSTOMAPPROVALCUSTINVC',
        };

        var TRANSACTIONS = { 'invoice': 1, 'creditmemo': 8 };
        var MEMO_TRANSACTION = '(LatamTax -  WHT)';
        var MEMO_LINE = ' (LatamTax - WHT) ';
        var WHT_MEMO = 'Latam - WHT Tax';
        var MEMO_EXPORT_WHT = "LatamTax - Export WHT";
        const GroupTypeItems = ["Group", "EndGroup"];
        var FEAT_SUMMARY_WHT = false;
        var licenses = [];

        var language = runtime.getCurrentScript().getParameter({ name: 'LANGUAGE' });
        language = language.substring(0, 2);

        function LatamTaxWithHoldingBR(recordObj, type) {
            try {
                var typeTransaction = recordObj.getValue('baserecordtype');
                var transactionID = recordObj.id;
                var country = recordObj.getValue({
                    fieldId: 'custbody_lmry_subsidiary_country'
                });

                if (Number(country) == 30) { //BR
                    //Si no esta anulado
                    if (recordObj.getValue('voided') != 'T') {
                        FEAT_SUBS = runtime.isFeatureInEffect({
                            feature: "SUBSIDIARIES"
                        });

                        var subsidiary = 1;
                        if (FEAT_SUBS == true || FEAT_SUBS == "T") {
                            subsidiary = recordObj.getValue({
                                fieldId: 'subsidiary'
                            });
                        }

                        licenses = library_mail.getLicenses(subsidiary);

                        if (typeTransaction == "creditmemo") {
                            if (library_mail.getAuthorization(596, licenses) || runtime.executionContext == "MAPREDUCE") {
                                deleteTaxResults(recordObj.id);
                            } else {
                                inactiveTaxResults(recordObj);
                            }
                        }

                        if (!validateMemo(recordObj)) {
                            return recordObj;
                        }

                        var TOTAL_AMOUNT_WHT = 0.00;

                        FEAT_SUMMARY_WHT = library_mail.getAuthorization(1003, licenses);

                        FEAT_MULTIBOOK = runtime.isFeatureInEffect({
                            feature: "MULTIBOOK"
                        });

                        //Feature Approval Status Invoice

                        var steTaxObj = getSteTaxRecord(recordObj);
                        log.debug("steTaxObj", JSON.stringify(steTaxObj));

                        var calculatedTaxes = getCalculatedTaxes(recordObj, steTaxObj);
                        log.debug("calculatedTaxes", JSON.stringify(calculatedTaxes));

                        var brTransactionIds = getBrTransactionFieldsIds(recordObj);
                        log.debug("brTransactionIds", brTransactionIds);

                        var selectedAppliesTo = recordObj.getValue({ fieldId: 'custbody_lmry_wht_appliesto' }) || "";
                        selectedAppliesTo = Number(selectedAppliesTo);
                        if (selectedAppliesTo > 0 && isApproved(recordObj) && !checkWithholdingTax(recordObj)) {
                            log.debug("[typeTransaction, transactionID]", [typeTransaction, transactionID]);
                            var taxGroups = getTaxGroups(subsidiary);
                            log.debug('taxGroups', JSON.stringify(taxGroups));

                            if (taxGroups && Object.keys(taxGroups).length) {
                                var setupSubsidiary = getSetupTaxSubsidiary(subsidiary);
                                log.debug("setupSubsidiary", JSON.stringify(setupSubsidiary));
                                var validationsTaxes = getValidationsBRTaxes(recordObj, setupSubsidiary, calculatedTaxes);
                                log.debug('validationsTaxes', JSON.stringify(validationsTaxes));

                                var taxResults = getWhtTaxResults(recordObj, subsidiary, setupSubsidiary, validationsTaxes, taxGroups);
                                log.debug("preview Tax Results", JSON.stringify(taxResults));

                                var validatedWHTs = getValidatedWithholdings(taxResults, taxGroups);

                                // var strAccountingBooks = concatAccountingBooks(recordObj);

                                log.debug('validatedWHTs', JSON.stringify(validatedWHTs));
                                var notExceedTotal = validateTotalWHT(recordObj, validatedWHTs);
                                if (notExceedTotal) {
                                    //Feature Create Tax Results - Sales
                                    if (library_mail.getAuthorization(596, licenses) || runtime.executionContext == "MAPREDUCE") {
                                        createTaxResults(recordObj, validatedWHTs);
                                    }

                                    saveSteTaxRecord(recordObj, validatedWHTs, steTaxObj);

                                    FEAT_INSTALLMENTS = runtime.isFeatureInEffect({ feature: "installments" });
                                    var installments = {};
                                    if (FEAT_INSTALLMENTS == true || FEAT_INSTALLMENTS == "T") {
                                        if (typeTransaction == "invoice") {
                                            updateInstallments(recordObj, validatedWHTs, installments, brTransactionIds);
                                        }
                                    }

                                    var idRecordWHT = createWhtTransaction(recordObj, validatedWHTs, setupSubsidiary, installments);

                                    if (idRecordWHT) {
                                        TOTAL_AMOUNT_WHT = search.lookupFields({
                                            type: CONFIG_TRANSACTION[typeTransaction]['recordtype'],
                                            id: idRecordWHT,
                                            columns: ["fxamount"]
                                        }).fxamount || 0.00;
                                    }

                                    if (typeTransaction == "creditmemo") {
                                        //Para credit memo, se edita la transaccion y se agrega el wht invoice.
                                        applyTransaction(recordObj, idRecordWHT, TOTAL_AMOUNT_WHT);
                                    }
                                }
                                updateIssRetained(brTransactionIds, calculatedTaxes, validatedWHTs);
                                record.submitFields({
                                    type: typeTransaction,
                                    id: transactionID,
                                    values: {
                                        'custbody_lmry_wtax_amount': Math.abs(parseFloat(TOTAL_AMOUNT_WHT)),
                                        'custbody_lmry_wtax_code_des': WHT_MEMO
                                    },
                                    options: {
                                        disableTriggers: true
                                    }
                                });

                                if (!notExceedTotal) {
                                    var errorObj = error.create({
                                        name: 'WHT_TOTAL_AMOUNT_EXCEEDS',
                                        message: "The total amount of withholdings exceeds the total amount of the transaction.",
                                        notifyOff: false
                                    });
                                    throw errorObj;
                                }
                            }
                        } else {
                            saveSteTaxRecord(recordObj, [], steTaxObj);
                            updateIssRetained(brTransactionIds, calculatedTaxes, []);
                        }
                    }
                }
            } catch (err) {
                log.error("[ LatamTaxWithHoldingBR ]", err);
                library_mail.sendemail('[ LatamTaxWithHoldingBR ] ' + err, LMRY_script);
                lbryLog.doLog({ title: "[ LatamTaxWithHoldingBR] ", message: err, relatedScript: LMRY_script });
            }

            return recordObj;
        }


        function getValidatedWithholdings(taxResultGroups, taxGroups) {
            var validatedWHTs = [];
            for (var group in taxResultGroups) {
                var minimWHT = parseFloat(taxGroups[group]['minim']);
                var taxResults = taxResultGroups[group];
                var totalGroup = 0.00;
                var taxResultsByGroup = [];
                for (var key in taxResults) {
                    for (var i = 0; i < taxResults[key].length; i++) {
                        var taxResult = taxResults[key][i];
                        if (taxResult) {
                            totalGroup += taxResult.lc_whtAmount;
                        }
                    }
                    taxResultsByGroup = taxResultsByGroup.concat(taxResults[key]);
                }

                if (minimWHT <= totalGroup) {
                    validatedWHTs = validatedWHTs.concat(taxResultsByGroup);
                }
            }
            return validatedWHTs;
        }


        function getWhtTaxResults(recordObj, subsidiary, setupSubsidiary, validationsTaxes, taxGroups) {
            var taxResults = {};
            var selectedAppliesTo = recordObj.getValue('custbody_lmry_wht_appliesto');
            var exchangeRate = getExchangeRate(recordObj, setupSubsidiary['currency']);
            var taxRecords = getContributoryClasses(recordObj, subsidiary, taxGroups);
            log.debug('ccs', JSON.stringify(taxRecords));

            var numberCclasses = taxRecords['total'].length;

            if (Number(selectedAppliesTo) == 2) {
                numberCclasses = Object.keys(taxRecords['item']).length || Object.keys(taxRecords['catalog']).length;
            }

            if (!numberCclasses) {
                taxRecords = getNationalTaxes(recordObj, subsidiary, taxGroups);
                log.debug('nts', JSON.stringify(taxRecords));
            }

            if (Number(selectedAppliesTo) == 1) {
                if (taxRecords['total'] && taxRecords['total'].length) {
                    if (validationsTaxes['total']) {
                        var totalAmounts = getTotalAmounts(recordObj);
                        calculateWHTTaxResults({ 'grossAmt': totalAmounts["total"], 'taxAmt': totalAmounts["taxTotal"], 'netAmt': totalAmounts["subTotal"] },
                            taxRecords['total'], '', '', '', '', exchangeRate, taxResults);
                    }
                }
            } else if (Number(selectedAppliesTo) == 2) {

                var numLines = recordObj.getLineCount({
                    sublistId: 'item'
                });

                if (numLines) {

                    for (var i = 0; i < numLines; i++) {
                        if (validationsTaxes[String(i)]) {
                            var apply_wht_field = recordObj.getSublistField({ sublistId: 'item', fieldId: 'custcol_lmry_apply_wht_tax', line: i });
                            if (apply_wht_field) {
                                var applywht_ischeck = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_apply_wht_tax', line: i });
                                if (applywht_ischeck == true || applywht_ischeck == 'T') {
                                    var isTaxItem = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_ar_item_tributo', line: i });
                                    var typeDiscount = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_col_sales_type_discount', line: i });
                                    var itemType = recordObj.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i }) || "";
                                    if ((isTaxItem != true && isTaxItem != 'T') && !typeDiscount && GroupTypeItems.indexOf(itemType) == -1) {
                                        var netAmt = recordObj.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'amount',
                                            line: i
                                        });
                                        netAmt = parseFloat(netAmt);

                                        var taxAmt = recordObj.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'tax1amt',
                                            line: i
                                        });
                                        taxAmt = parseFloat(taxAmt);

                                        var grossAmt = round2(netAmt + taxAmt);

                                        var catalog = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_br_service_catalog', line: i });
                                        var item = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                                        var itemText = recordObj.getSublistText({ sublistId: 'item', fieldId: 'item', line: i });
                                        var lineUniqueKey = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'lineuniquekey', line: i });

                                        var amounts = { 'grossAmt': grossAmt, 'taxAmt': taxAmt, 'netAmt': netAmt };
                                        //Caso Servicios
                                        if (catalog) {
                                            catalog = String(catalog);
                                            calculateWHTTaxResults(amounts, taxRecords['catalog'][catalog], i, item, itemText, lineUniqueKey, exchangeRate, taxResults);
                                        } else {
                                            item = String(item);
                                            calculateWHTTaxResults(amounts, taxRecords['item'][item], i, item, itemText, lineUniqueKey, exchangeRate, taxResults);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return taxResults;
        }

        function calculateWHTTaxResults(objAmounts, taxRecords, position, item, itemText, lineUniqueKey, exchangeRate, totalTaxResults) {
            if (taxRecords && taxRecords.length) {
                var grossAmt = objAmounts['grossAmt'];
                var netAmt = objAmounts['netAmt'];
                var taxAmt = objAmounts['taxAmt'];
                log.debug("objAmounts", JSON.stringify(objAmounts));

                for (var i = 0; i < taxRecords.length; i++) {
                    var taxRecord = taxRecords[i];
                    var baseAmount = 0.00;
                    var amountTo = Number(taxRecord.amountTo);

                    if (amountTo == 1) {
                        baseAmount = round2(parseFloat(grossAmt));
                    } else if (amountTo == 2) {
                        baseAmount = parseFloat(taxAmt);
                    } else if (amountTo == 3) {
                        baseAmount = round2(parseFloat(netAmt));
                    }
                    baseAmount = baseAmount - taxRecord.notTaxableMin / exchangeRate;
                    var compareAmount = baseAmount;
                    var how_base_amount = Number(taxRecord.howBaseAmount);
                    var minAmt = parseFloat(taxRecord.minim) / exchangeRate;
                    var maxAmt = parseFloat(taxRecord.maxim) / exchangeRate;

                    if (how_base_amount) {
                        if (how_base_amount == 2 || how_base_amount == 5) {
                            baseAmount = baseAmount - minAmt;
                        } else if (how_base_amount == 3) {
                            baseAmount = minAmt
                        } else if (how_base_amount == 4) {
                            baseAmount = maxAmt;
                        }
                    }
                    // log.debug('internalid', taxRecord['internalid']);
                    // log.debug('[baseAmount, compareAmount, how_base_amount]', [baseAmount, compareAmount, how_base_amount].join('-'));
                    // log.debug('[minAmt, maxAmt,exchangeRate]', [minAmt, maxAmt, exchangeRate].join('-'));


                    if (minAmt <= compareAmount && ((compareAmount <= maxAmt) || !maxAmt)) {
                        if (baseAmount > 0) {
                            var whtRate = parseFloat(taxRecord.whtRate);
                            var ratio = parseFloat(taxRecord.ratio);
                            var baseRetention = parseFloat(taxRecord.baseRetention);
                            var whtAmount = (baseAmount * ratio * whtRate) + (baseRetention / exchangeRate);

                            //var roundedAmount = roundSetup(amount, roundingType);
                            //var roundedAmount = round4(amount);

                            var TYPE_TAX_RESULT = {
                                '1': 'Total', '2': 'Line - Item'
                            };

                            var lc_baseAmount = baseAmount;
                            var lc_whtAmount = whtAmount;
                            var lc_grossAmount = grossAmt;

                            if (exchangeRate != 1) {
                                lc_baseAmount = baseAmount * exchangeRate;
                                lc_whtAmount = whtAmount * exchangeRate;
                                lc_grossAmount = grossAmt * exchangeRate;
                            }

                            var taxResult = {
                                taxType: { value: "1", text: "Retencion" },
                                appliesTo: { value: taxRecord.appliesTo, text: taxRecord.appliesToText },
                                subType: { value: taxRecord.subType, text: taxRecord.subTypeText },
                                generatedTransaction: { value: taxRecord.genTran, text: taxRecord.genTranText },
                                lineUniqueKey: lineUniqueKey,
                                serviceCatalog: { value: taxRecord.catalog, text: taxRecord.catalogText },
                                baseAmount: baseAmount,
                                whtAmount: whtAmount, //Moneda de la transaccion
                                whtRate: taxRecord.whtRate,
                                taxCode: taxRecord.taxCode,
                                item: { value: item, text: itemText },
                                position: position,
                                department: taxRecord.department,
                                'class': taxRecord.class_,
                                location: taxRecord.location,
                                taxItem: taxRecord.taxItem,
                                lc_baseAmount: lc_baseAmount,
                                lc_whtAmount: lc_whtAmount,
                                grossAmount: grossAmt,
                                lc_grossAmount: lc_grossAmount
                            };

                            if (taxRecord.receita) {
                                taxResult.br_receita = { value: taxRecord.receita, text: taxRecord.receitaText };
                            }

                            if (taxRecord.regimenCatalog) {
                                taxResult.br_regimenCatalog = { value: taxRecord.regimenCatalog, text: taxRecord.regimenCatalogText };
                            }

                            if (taxRecord.recordType == "ntax") {
                                taxResult.nationalTax = taxRecord.recordId;
                            } else {
                                taxResult.contributoryClass = taxRecord.recordId;
                            }

                            //taxResults.push(taxResult);

                            var appliesto = 'total';
                            if (Number(taxRecord.appliesTo) == 2) {
                                appliesto = String(position)
                            }

                            var group = taxRecord.taxGroup;
                            if (!totalTaxResults[group]) {
                                totalTaxResults[group] = {};
                            }

                            if (!totalTaxResults[group][appliesto]) {
                                totalTaxResults[group][appliesto] = [];
                            }

                            totalTaxResults[group][appliesto].push(taxResult);
                        }

                    }
                }
            }
        }


        function getExchangeRate(recordObj, currencySetup) {
            var exchangerate = 1;
            var featureMB = runtime.isFeatureInEffect({
                feature: "MULTIBOOK"
            });
            var tran_exchangerate = recordObj.getValue({ fieldId: 'exchangerate' })

            if (FEAT_SUBS && featureMB) {

                var subsidiary = recordObj.getValue('subsidiary');
                var currencySubs = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['currency']
                }).currency[0].value;

                var numLines = recordObj.getLineCount({
                    sublistId: 'accountingbookdetail'
                });

                var tran_exchangerate = recordObj.getValue({
                    fieldId: 'exchangerate'
                });

                if (currencySetup && currencySetup != currencySubs) {
                    if (numLines) {
                        for (var i = 0; i < numLines; i++) {
                            var currencyMB = recordObj.getSublistValue({
                                sublistId: 'accountingbookdetail',
                                fieldId: 'currency',
                                line: i
                            });

                            if (currencyMB == currencySetup) {
                                exchangerate = recordObj.getSublistValue({
                                    sublistId: 'accountingbookdetail',
                                    fieldId: 'exchangerate',
                                    line: i
                                });
                                break;
                            }
                        }
                    }
                } else {
                    exchangerate = tran_exchangerate
                }
            } else {
                exchangerate = tran_exchangerate
            }

            return exchangerate;
        }

        function getSetupTaxSubsidiary(subsidiary) {
            var filters = [['isinactive', 'is', 'F'], 'AND'];
            if (FEAT_SUBS == true || FEAT_SUBS == 'T') {
                filters.push(['custrecord_lmry_setuptax_subsidiary', 'anyof', subsidiary]);
            }

            var search_setupSub = search.create({
                type: 'customrecord_lmry_setup_tax_subsidiary',
                filters: filters,
                columns: ['custrecord_lmry_setuptax_subsidiary', 'custrecord_lmry_setuptax_currency', 'custrecord_lmry_setuptax_depclassloc',
                    'custrecord_lmry_setuptax_type_rounding', 'custrecord_lmry_setuptax_department', 'custrecord_lmry_setuptax_class',
                    'custrecord_lmry_setuptax_location', 'custrecord_lmry_setuptax_br_minim_tax', 'custrecord_lmry_setuptax_form_invoice', 'custrecord_lmry_setuptax_form_creditmemo',
                    'custrecord_lmry_setuptax_br_taxfromgross'
                ]
            });


            var results = search_setupSub.run().getRange(0, 1);

            var setupSubsidiary = {};

            if (results && results.length > 0) {
                setupSubsidiary['isDefaultClassification'] = results[0].getValue('custrecord_lmry_setuptax_depclassloc');
                setupSubsidiary['rounding'] = results[0].getValue('custrecord_lmry_setuptax_type_rounding');
                setupSubsidiary['department'] = results[0].getValue('custrecord_lmry_setuptax_department');
                setupSubsidiary['class'] = results[0].getValue('custrecord_lmry_setuptax_class');
                setupSubsidiary['location'] = results[0].getValue('custrecord_lmry_setuptax_location');
                setupSubsidiary['currency'] = results[0].getValue('custrecord_lmry_setuptax_currency');
                setupSubsidiary['minimTaxes'] = results[0].getValue('custrecord_lmry_setuptax_br_minim_tax') || 0.00;
                setupSubsidiary['minimTaxes'] = parseFloat(setupSubsidiary['minimTaxes']);
                setupSubsidiary["invoiceform"] = results[0].getValue("custrecord_lmry_setuptax_form_invoice") || "";
                setupSubsidiary["creditmemoform"] = results[0].getValue("custrecord_lmry_setuptax_form_creditmemo") || "";
                setupSubsidiary["taxFlow"] = results[0].getValue("custrecord_lmry_setuptax_br_taxfromgross") || 1;
                setupSubsidiary["taxFlow"] = Number(setupSubsidiary["taxFlow"]);
            }

            return setupSubsidiary;
        }

        function getNationalTaxes(recordObj, subsidiary, taxGroups) {
            var selectedAppliesTo = recordObj.getValue('custbody_lmry_wht_appliesto');
            var taxRecords = { 'total': [], 'item': {}, 'catalog': {} };
            var subtypes = [];
            for (var group in taxGroups) {
                subtypes = subtypes.concat(taxGroups[group]['subtypes']);
            }

            var trandate = recordObj.getText('trandate');
            var documentType = recordObj.getValue('custbody_lmry_document_type');
            var recordType = recordObj.getValue('baserecordtype');
            var province = recordObj.getValue("custbody_lmry_province");
            var city = recordObj.getValue("custbody_lmry_city");
            var district = recordObj.getValue("custbody_lmry_district");
            var applyWHT = recordObj.getValue("custbody_lmry_apply_wht_code");

            if (TRANSACTIONS[recordType]) {
                var filters = [
                    ['isinactive', 'is', 'F'], 'AND',
                    ['custrecord_lmry_ntax_datefrom', 'onorbefore', trandate], 'AND',
                    ['custrecord_lmry_ntax_dateto', 'onorafter', trandate], 'AND',
                    ['custrecord_lmry_ntax_transactiontypes', 'anyof', TRANSACTIONS[recordType]], 'AND',
                    ['custrecord_lmry_ntax_taxtype', 'anyof', TAX_TYPE], 'AND',
                    ['custrecord_lmry_ntax_appliesto', 'anyof', selectedAppliesTo], 'AND',
                    ['custrecord_lmry_ntax_gen_transaction', 'anyof', GEN_TRANSACTION], 'AND',
                    ['custrecord_lmry_ntax_sub_type', 'anyof', subtypes], "AND",
                    ["custrecord_lmry_ntax_wht_tax_point", "anyof", ["@NONE@", "1"]] //Retencion en la factura (Accrual)
                ];


                if (Number(selectedAppliesTo) == 2) {
                    var items = ['@NONE@'], catalogs = ['@NONE@'];
                    var dataItem = getDataItem(recordObj);
                    if (dataItem['catalogs'].length) {
                        catalogs = catalogs.concat(dataItem['catalogs']);
                        filters.push('AND', ['custrecord_lmry_ntax_catalog', 'anyof', catalogs]);
                    }
                    else if (dataItem['items'].length) {
                        items = items.concat(dataItem['items']);
                        filters.push('AND', ['custrecord_lmry_ntax_applies_to_item', 'anyof', items]);
                    }
                }

                var filterDoc = ['@NONE@'];
                if (documentType) {
                    filterDoc.push(documentType);
                }
                filters.push('AND', ['custrecord_lmry_ntax_fiscal_doctype', 'anyof', filterDoc]);

                if (FEAT_SUBS == true || FEAT_SUBS == 'T') {
                    filters.push('AND', ['custrecord_lmry_ntax_subsidiary', 'anyof', subsidiary]);
                }

                var provinces = ['@NONE@'];
                if (province) {
                    provinces.push(province);
                }

                var cities = ['@NONE@'];
                if (city) {
                    cities.push(city)
                }

                var districts = ['@NONE@'];
                if (district) {
                    districts.push(district);
                }

                filters.push('AND', [
                    [
                        ["custrecord_lmry_ntax_sub_type.custrecord_lmry_tax_by_location", "is", "F"]
                    ]
                    , "OR", [
                        ["custrecord_lmry_ntax_sub_type.custrecord_lmry_tax_by_location", "is", "T"],
                        "AND", ["custrecord_lmry_ntax_province", "anyof", provinces],
                        "AND", ["custrecord_lmry_ntax_city", "anyof", cities],
                        "AND", ["custrecord_lmry_ntax_district", "anyof", districts]
                    ]
                ]);


                var search_natTax = search.create({
                    type: 'customrecord_lmry_national_taxes',
                    columns: [
                        {
                            name: "custrecord_lmry_ntax_appliesto",
                            sort: search.Sort.ASC
                        },
                        {
                            name: "custrecord_lmry_ntax_applies_to_item",
                            sort: search.Sort.ASC
                        },
                        {
                            name: "custrecord_lmry_ntax_catalog",
                            sort: search.Sort.ASC
                        },
                        {
                            name: "internalid",
                            sort: search.Sort.ASC
                        },
                        'custrecord_lmry_ntax_taxrate', 'custrecord_lmry_ntax_amount', 'custrecord_lmry_ntax_subtype',
                        'custrecord_lmry_ntax_sub_type', 'custrecord_lmry_ntax_minamount', 'custrecord_lmry_ntax_maxamount',
                        'custrecord_lmry_ntax_debit_account', 'custrecord_lmry_ntax_credit_account',
                        'custrecord_lmry_ntax_department', 'custrecord_lmry_ntax_class', 'custrecord_lmry_ntax_location',
                        'custrecord_lmry_ntax_base_amount', 'custrecord_lmry_ntax_addratio', 'custrecord_lmry_ntax_not_taxable_minimum', 'custrecord_lmry_ntax_set_baseretention',
                        'custrecord_lmry_ntax_taxitem', 'custrecord_lmry_ntax_taxcode',
                        'custrecord_lmry_ntax_br_wht_receita', "custrecord_lmry_ntax_sub_type.custrecord_lmry_tax_by_location", "custrecord_lmry_ntax_config_segment",
                        'custrecord_lmry_br_ntax_regimen_catalog', 'custrecord_lmry_ntax_gen_transaction'
                    ],
                    filters: filters
                });

                var results = search_natTax.run().getRange(0, 1000);

                if (results && results.length) {
                    for (var i = 0; i < results.length; i++) {
                        var recordId = results[i].getValue('internalid');
                        var genTran = results[i].getValue("custrecord_lmry_ntax_gen_transaction");
                        var genTranText = results[i].getText("custrecord_lmry_ntax_gen_transaction");
                        var appliesTo = results[i].getValue("custrecord_lmry_ntax_appliesto");
                        var appliesToText = results[i].getText("custrecord_lmry_ntax_appliesto");
                        var subTypeText = results[i].getText('custrecord_lmry_ntax_sub_type');
                        var subType = results[i].getValue('custrecord_lmry_ntax_sub_type');
                        var whtRate = results[i].getValue('custrecord_lmry_ntax_taxrate') || 0.00;
                        whtRate = parseFloat(whtRate);
                        var amountTo = results[i].getValue('custrecord_lmry_ntax_amount') || 1;
                        var minim = results[i].getValue('custrecord_lmry_ntax_minamount') || 0.00;
                        minim = parseFloat(minim);
                        var maxim = results[i].getValue('custrecord_lmry_ntax_maxamount') || 0.00;
                        maxim = parseFloat(maxim);
                        var department = results[i].getValue('custrecord_lmry_ntax_department');
                        var class_ = results[i].getValue('custrecord_lmry_ntax_class');
                        var location = results[i].getValue('custrecord_lmry_ntax_location');
                        var howBaseAmount = results[i].getValue('custrecord_lmry_ntax_base_amount');
                        var ratio = results[i].getValue('custrecord_lmry_ntax_addratio') || 1.0;
                        ratio = parseFloat(ratio);
                        var notTaxableMin = results[i].getValue('custrecord_lmry_ntax_not_taxable_minimum') || 0.00;
                        notTaxableMin = parseFloat(notTaxableMin);
                        var baseRetention = results[i].getValue('custrecord_lmry_ntax_set_baseretention') || 0.00;
                        baseRetention = parseFloat(baseRetention);
                        var taxItem = results[i].getValue('custrecord_lmry_ntax_taxitem');
                        var taxCode = results[i].getValue('custrecord_lmry_ntax_taxcode');
                        var receita = results[i].getValue('custrecord_lmry_ntax_br_wht_receita') || "";
                        var receitaText = results[i].getText('custrecord_lmry_ntax_br_wht_receita') || "";
                        var catalog = results[i].getValue('custrecord_lmry_ntax_catalog');
                        var catalogText = results[i].getText('custrecord_lmry_ntax_catalog');
                        var regimenCatalog = results[i].getValue('custrecord_lmry_br_ntax_regimen_catalog') || "";
                        var regimenCatalogText = results[i].getText('custrecord_lmry_br_ntax_regimen_catalog') || "";
                        var item = results[i].getValue('custrecord_lmry_ntax_applies_to_item');
                        var itemText = results[i].getText('custrecord_lmry_ntax_applies_to_item');
                        var isTaxByLocation = results[i].getValue({ name: "custrecord_lmry_tax_by_location", join: "custrecord_lmry_ntax_sub_type" });
                        var segmentsNT = results[i].getValue("custrecord_lmry_ntax_config_segment") || "";
                        if (segmentsNT) {
                            segmentsNT = JSON.parse(segmentsNT);
                        }

                        if (((isTaxByLocation || isTaxByLocation == 'T') && (applyWHT || applyWHT == 'T')) || (!isTaxByLocation || isTaxByLocation == 'F')) {
                            var taxGroup = '';
                            for (var idgroup in taxGroups) {
                                if (taxGroups[idgroup]['subtypes'].indexOf(String(subType)) != -1) {
                                    taxGroup = String(idgroup);
                                    break;
                                }
                            }

                            var ntaxObj = {
                                recordId: recordId,
                                recordType: 'ntax',
                                appliesTo: appliesTo,
                                appliesToText: appliesTo,
                                genTran: genTran,
                                genTranText: genTranText,
                                item: item,
                                itemText: itemText,
                                subType: subType,
                                subTypeText: subTypeText,
                                whtRate: whtRate,
                                amountTo: amountTo,
                                minim: minim,
                                maxim: maxim,
                                department: department,
                                class_: class_,
                                location: location,
                                howBaseAmount: howBaseAmount,
                                ratio: ratio,
                                notTaxableMin: notTaxableMin,
                                baseRetention: baseRetention,
                                taxItem: taxItem,
                                taxCode: taxCode,
                                receita: receita,
                                receitaText: receitaText,
                                taxGroup: taxGroup,
                                catalog: catalog,
                                catalogText: catalogText,
                                regimenCatalog: regimenCatalog,
                                regimenCatalogText: regimenCatalogText,
                                customSegments: segmentsNT
                            };

                            if (Number(selectedAppliesTo) == 1) {
                                taxRecords['total'].push(ntaxObj);
                            } else if (Number(selectedAppliesTo) == 2) {
                                if (item) {
                                    if (!taxRecords['item'][item]) {
                                        taxRecords['item'][item] = [];
                                    }

                                    taxRecords['item'][item].push(ntaxObj);
                                }

                                if (catalog) {
                                    if (!taxRecords['catalog'][catalog]) {
                                        taxRecords['catalog'][catalog] = [];
                                    }

                                    taxRecords['catalog'][catalog].push(ntaxObj);
                                }

                            }
                        }
                    }
                }
            }
            return taxRecords;
        }

        function getContributoryClasses(recordObj, subsidiary, taxGroups) {
            var selectedAppliesTo = recordObj.getValue('custbody_lmry_wht_appliesto');
            var taxRecords = { 'total': [], 'item': {}, 'catalog': {} };
            var subtypes = [];
            for (var group in taxGroups) {
                subtypes = subtypes.concat(taxGroups[group]['subtypes']);
            }

            var trandate = recordObj.getText('trandate');
            var documentType = recordObj.getValue('custbody_lmry_document_type');
            var entity = recordObj.getValue('entity');
            var recordType = recordObj.getValue('baserecordtype');
            var province = recordObj.getValue("custbody_lmry_province");
            var city = recordObj.getValue("custbody_lmry_city");
            var district = recordObj.getValue("custbody_lmry_district");
            var applyWHT = recordObj.getValue("custbody_lmry_apply_wht_code");

            if (TRANSACTIONS[recordType]) { //Invoice

                var filters = [
                    ['isinactive', 'is', 'F'], 'AND',
                    ['custrecord_lmry_ar_ccl_fechdesd', 'onorbefore', trandate], 'AND',
                    ['custrecord_lmry_ar_ccl_fechhast', 'onorafter', trandate], 'AND',
                    ['custrecord_lmry_ccl_transactiontypes', 'anyof', TRANSACTIONS[recordType]], 'AND',
                    ['custrecord_lmry_ccl_taxtype', 'anyof', TAX_TYPE], 'AND',
                    ['custrecord_lmry_ar_ccl_entity', 'anyof', entity], 'AND',
                    ['custrecord_lmry_ccl_appliesto', 'anyof', selectedAppliesTo], 'AND',
                    ['custrecord_lmry_ccl_gen_transaction', 'anyof', GEN_TRANSACTION], 'AND',
                    ['custrecord_lmry_sub_type', 'anyof', subtypes], "AND",
                    ["custrecord_lmry_ccl_wht_tax_point", "anyof", ["@NONE@", "1"]] //Retencion en la factura (Accrual)
                ];


                if (Number(selectedAppliesTo) == 2) {
                    var items = ['@NONE@'], catalogs = ['@NONE@'];
                    var dataItem = getDataItem(recordObj);
                    if (dataItem['catalogs'].length) {
                        catalogs = catalogs.concat(dataItem['catalogs']);
                        filters.push('AND', ['custrecord_lmry_br_ccl_catalog', 'anyof', catalogs]);
                    }
                    else if (dataItem['items'].length) {
                        items = items.concat(dataItem['items']);
                        filters.push('AND', ['custrecord_lmry_ccl_applies_to_item', 'anyof', items]);
                    }
                }

                var filterDoc = ['@NONE@'];
                if (documentType) {
                    filterDoc.push(documentType);
                }
                filters.push("AND", ['custrecord_lmry_ccl_fiscal_doctype', 'anyof', filterDoc]);

                if (FEAT_SUBS == true || FEAT_SUBS == 'T') {
                    filters.push("AND", ['custrecord_lmry_ar_ccl_subsidiary', 'anyof', subsidiary]);
                }

                var provinces = ['@NONE@'];
                if (province) {
                    provinces.push(province);
                }

                var cities = ['@NONE@'];
                if (city) {
                    cities.push(city)
                }

                var districts = ['@NONE@'];
                if (district) {
                    districts.push(district);
                }

                filters.push('AND', [
                    [
                        ["custrecord_lmry_sub_type.custrecord_lmry_tax_by_location", "is", "F"]
                    ]
                    , "OR", [
                        ["custrecord_lmry_sub_type.custrecord_lmry_tax_by_location", "is", "T"],
                        'AND', ["custrecord_lmry_ccl_province", "anyof", provinces],
                        'AND', ["custrecord_lmry_ccl_city", "anyof", cities],
                        'AND', ["custrecord_lmry_ccl_district", "anyof", districts]
                    ]
                ]);

                var search_ccls = search.create({
                    type: 'customrecord_lmry_ar_contrib_class',
                    columns: [
                        {
                            name: "custrecord_lmry_ccl_appliesto",
                            sort: search.Sort.ASC
                        },
                        {
                            name: "custrecord_lmry_ccl_applies_to_item",
                            sort: search.Sort.ASC
                        },
                        {
                            name: "custrecord_lmry_br_ccl_catalog",
                            sort: search.Sort.ASC
                        },
                        {
                            name: "internalid",
                            sort: search.Sort.ASC
                        },
                        'custrecord_lmry_ar_ccl_taxrate', 'custrecord_lmry_amount', 'custrecord_lmry_ar_ccl_subtype',
                        'custrecord_lmry_sub_type', 'custrecord_lmry_ccl_minamount', 'custrecord_lmry_ccl_maxamount',
                        'custrecord_lmry_br_ccl_account1', 'custrecord_lmry_br_ccl_account2',
                        'custrecord_lmry_ar_ccl_department', 'custrecord_lmry_ar_ccl_class', 'custrecord_lmry_ar_ccl_location',
                        'custrecord_lmry_ccl_base_amount', 'custrecord_lmry_ccl_addratio', 'custrecord_lmry_ccl_not_taxable_minimum', 'custrecord_lmry_ccl_set_baseretention',
                        'custrecord_lmry_ar_ccl_taxitem', 'custrecord_lmry_ar_ccl_taxcode',
                        'custrecord_lmry_br_cc_wht_receta', "custrecord_lmry_sub_type.custrecord_lmry_tax_by_location", "custrecord_lmry_ccl_config_segment",
                        "custrecord_lmry_br_ccl_regimen_catalog", "custrecord_lmry_ccl_gen_transaction"
                    ],
                    filters: filters
                });

                var results = search_ccls.run().getRange(0, 1000);

                if (results && results.length) {
                    for (var i = 0; i < results.length; i++) {
                        var recordId = results[i].getValue('internalid');
                        var genTran = results[i].getValue("custrecord_lmry_ccl_gen_transaction");
                        var genTranText = results[i].getText("custrecord_lmry_ccl_gen_transaction");
                        var appliesTo = results[i].getValue("custrecord_lmry_ccl_appliesto");
                        var appliesToText = results[i].getText("custrecord_lmry_ccl_appliesto");
                        var subTypeText = results[i].getText('custrecord_lmry_sub_type');
                        var subType = results[i].getValue('custrecord_lmry_sub_type');
                        var whtRate = results[i].getValue('custrecord_lmry_ar_ccl_taxrate') || 0.00;
                        whtRate = parseFloat(whtRate);
                        var amountTo = results[i].getValue('custrecord_lmry_amount') || 1;
                        var minim = results[i].getValue('custrecord_lmry_ccl_minamount') || 0.00;
                        minim = parseFloat(minim);
                        var maxim = results[i].getValue('custrecord_lmry_ccl_maxamount') || 0.00;
                        maxim = parseFloat(maxim);
                        var department = results[i].getValue('custrecord_lmry_ar_ccl_department');
                        var class_ = results[i].getValue('custrecord_lmry_ar_ccl_class');
                        var location = results[i].getValue('custrecord_lmry_ar_ccl_location');
                        var howBaseAmount = results[i].getValue('custrecord_lmry_ccl_base_amount');
                        var ratio = results[i].getValue('custrecord_lmry_ccl_addratio') || 1.0;
                        ratio = parseFloat(ratio);
                        var notTaxableMin = results[i].getValue('custrecord_lmry_ccl_not_taxable_minimum') || 0.00;
                        notTaxableMin = parseFloat(notTaxableMin);
                        var baseRetention = results[i].getValue('custrecord_lmry_ccl_set_baseretention') || 0.00;
                        baseRetention = parseFloat(baseRetention);
                        var taxItem = results[i].getValue('custrecord_lmry_ar_ccl_taxitem');
                        var taxCode = results[i].getValue('custrecord_lmry_ar_ccl_taxcode');
                        var receita = results[i].getValue('custrecord_lmry_br_cc_wht_receta');
                        var receitaText = results[i].getText("custrecord_lmry_br_cc_wht_receta");
                        var catalog = results[i].getValue('custrecord_lmry_br_ccl_catalog');
                        var catalogText = results[i].getText("custrecord_lmry_br_ccl_catalog");
                        var item = results[i].getValue('custrecord_lmry_ccl_applies_to_item') || "";
                        var itemText = results[i].getText("custrecord_lmry_ccl_applies_to_item") || "";
                        var regimenCatalog = results[i].getValue('custrecord_lmry_br_ccl_regimen_catalog') || "";
                        var regimenCatalogText = results[i].getText("custrecord_lmry_br_ccl_regimen_catalog");
                        var isTaxByLocation = results[i].getValue({ name: "custrecord_lmry_tax_by_location", join: "custrecord_lmry_sub_type" });
                        var segmentsCC = results[i].getValue("custrecord_lmry_ccl_config_segment") || "";
                        if (segmentsCC) {
                            segmentsCC = JSON.parse(segmentsCC);
                        }

                        if (((isTaxByLocation || isTaxByLocation == 'T') && (applyWHT || applyWHT == 'T')) || (!isTaxByLocation || isTaxByLocation == 'F')) {

                            var taxGroup = '';
                            for (var idgroup in taxGroups) {
                                if (taxGroups[idgroup]['subtypes'].indexOf(String(subType)) != -1) {
                                    taxGroup = String(idgroup);
                                    break;
                                }
                            }

                            var cclassObj = {
                                recordId: recordId,
                                recordType: 'ccl',
                                appliesTo: appliesTo,
                                appliesToText: appliesToText,
                                genTran: genTran,
                                genTranText: genTranText,
                                item: item,
                                itemText: itemText,
                                subType: subType,
                                subTypeText: subTypeText,
                                whtRate: whtRate,
                                amountTo: amountTo,
                                minim: minim,
                                maxim: maxim,
                                department: department,
                                class_: class_,
                                location: location,
                                howBaseAmount: howBaseAmount,
                                ratio: ratio,
                                notTaxableMin: notTaxableMin,
                                baseRetention: baseRetention,
                                taxItem: taxItem,
                                taxCode: taxCode,
                                receita: receita,
                                receitaText: receitaText,
                                taxGroup: taxGroup,
                                catalog: catalog,
                                catalogText: catalogText,
                                regimenCatalog: regimenCatalog,
                                regimenCatalogText: regimenCatalogText,
                                customSegments: segmentsCC
                            };

                            if (Number(selectedAppliesTo) == 1) {
                                taxRecords['total'].push(cclassObj);
                            } else if (Number(selectedAppliesTo) == 2) {
                                if (item) {
                                    if (!taxRecords['item'][item]) {
                                        taxRecords['item'][item] = [];
                                    }

                                    taxRecords['item'][item].push(cclassObj);
                                }


                                if (catalog) {
                                    if (!taxRecords['catalog'][catalog]) {
                                        taxRecords['catalog'][catalog] = [];
                                    }

                                    taxRecords['catalog'][catalog].push(cclassObj);
                                }
                            }
                        }
                    }
                }
            }
            return taxRecords;
        }



        function getTaxGroups(subsidiary) {
            var taxGroups = {};
            var search_groups = search.create({
                type: 'customrecord_lmry_tax_wht_group',
                filters: [
                    ['isinactive', 'is', 'F'], 'AND',
                    ['custrecord_lmry_taxwhtgroup_subsidiary', 'anyof', subsidiary], 'AND',
                    ['custrecord_lmry_taxwhtgroup_taxtype', 'is', TAX_TYPE], "AND",
                    ["custrecord_lmry_taxwhtgroup_applyto", "anyof", ["2", "@NONE@"]] //Sales
                ],
                columns: [
                    {
                        name: 'internalid',
                        sort: search.Sort.ASC
                    },
                    'custrecord_lmry_taxwhtgroup_subtypes',
                    'custrecord_lmry_taxwhtgroup_br_minim_wht'
                ]
            });

            var results = search_groups.run().getRange(0, 1000);

            if (results && results.length) {
                for (var i = 0; i < results.length; i++) {
                    var internalid = results[i].getValue('internalid');
                    internalid = String(internalid);
                    var subtypes = results[i].getValue('custrecord_lmry_taxwhtgroup_subtypes');
                    var minim = results[i].getValue('custrecord_lmry_taxwhtgroup_br_minim_wht') || 0.00;
                    if (subtypes) {
                        subtypes = subtypes.split(/\u0005|\,/g);
                        taxGroups[internalid] = {
                            'minim': minim,
                            'subtypes': subtypes
                        };
                    }
                }
            }

            return taxGroups;
        }

        function deleteTaxResults(recordId) {
            if (recordId) {

                var searchTaxResults = search.create({
                    type: 'customrecord_lmry_br_transaction',
                    filters: [
                        ['custrecord_lmry_br_transaction', 'anyof', recordId], 'AND',
                        ['custrecord_lmry_tax_type', 'anyof', TAX_TYPE]
                    ],
                    columns: ['internalid']
                });

                var results = searchTaxResults.run().getRange(0, 1000);
                log.debug("results", JSON.stringify(results));
                if (results && results.length) {
                    for (var i = 0; i < results.length; i++) {
                        var internalid = results[i].getValue('internalid');
                        record.delete({
                            type: 'customrecord_lmry_br_transaction',
                            id: internalid
                        });
                    }
                }
            }
        }

        function round2(num) {
            var e = (num >= 0) ? 1e-6 : -1e-6;
            return parseFloat(Math.round(parseFloat(num) * 1e2 + e) / 1e2);
        }

        function round4(num) {
            var e = (num >= 0) ? 1e-6 : -1e-6;
            return parseFloat(Math.round(parseFloat(num) * 1e4 + e) / 1e4);
        }

        function concatAccountingBooks(recordObj) {
            var auxBookMB = 0;
            var auxExchangeMB = recordObj.getValue({
                fieldId: 'exchangerate'
            });

            var featureMB = runtime.isFeatureInEffect({
                feature: "MULTIBOOK"
            });

            if (featureMB) {
                var lineasBook = recordObj.getLineCount({
                    sublistId: 'accountingbookdetail'
                });
                if (lineasBook != null & lineasBook != '') {
                    for (var j = 0; j < lineasBook; j++) {
                        var lineaBook = recordObj.getSublistValue({
                            sublistId: 'accountingbookdetail',
                            fieldId: 'accountingbook',
                            line: j
                        });
                        var lineaExchangeRate = recordObj.getSublistValue({
                            sublistId: 'accountingbookdetail',
                            fieldId: 'exchangerate',
                            line: j
                        });
                        auxBookMB = auxBookMB + '|' + lineaBook;
                        auxExchangeMB = auxExchangeMB + '|' + lineaExchangeRate;
                    }
                }
            }
            return auxBookMB + '&' + auxExchangeMB;
        }

        function createWhtTransaction(recordObj, taxResults, setupSubsidiary, installments) {
            var recordType = recordObj.getValue('baserecordtype');

            var idTransaction = recordObj.id;
            var idNewRecord = null;

            if (CONFIG_TRANSACTION[recordType]) {
                if (taxResults && taxResults.length) {
                    var form = setupSubsidiary[CONFIG_TRANSACTION[recordType]['form']];

                    if (form) {
                        var entity = recordObj.getValue('entity');
                        var subsidiary = recordObj.getValue("subsidiary");
                        var date = recordObj.getValue('trandate');
                        date = format.parse({ value: date, type: format.Type.DATE });
                        var postingperiod = recordObj.getValue('postingperiod');

                        var departmentTr = recordObj.getValue('department');
                        var classTr = recordObj.getValue('class');
                        var locationTr = recordObj.getValue('location');

                        var featureMultiPrice = runtime.isFeatureInEffect({ feature: 'MULTPRICE' });

                        var DEPARTMENT_FEAT = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
                        var LOCATION_FEAT = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
                        var CLASS_FEAT = runtime.isFeatureInEffect({ feature: "CLASSES" });

                        var DEPTMANDATORY = runtime.getCurrentUser().getPreference({ name: "DEPTMANDATORY" });
                        var LOCMANDATORY = runtime.getCurrentUser().getPreference({ name: "LOCMANDATORY" });
                        var CLASSMANDATORY = runtime.getCurrentUser().getPreference({ name: "CLASSMANDATORY" });

                        var account = recordObj.getValue('account');

                        var exchangeRate = recordObj.getValue('exchangerate');

                        var currency = recordObj.getValue('currency');

                        var segmentationLines = {};

                        var numItems = recordObj.getLineCount({ sublistId: "item" });
                        for (var i = 0; i < numItems; i++) {
                            segmentationLines[String(i)] = {
                                "department": recordObj.getSublistValue({ sublistId: "item", fieldId: "department", line: i }) || "",
                                "class": recordObj.getSublistValue({ sublistId: "item", fieldId: "class", line: i }) || "",
                                "location": recordObj.getSublistValue({ sublistId: "item", fieldId: "location", line: i }) || ""
                            };
                        }

                        var numberInstallments = 0;
                        if (FEAT_INSTALLMENTS == true || FEAT_INSTALLMENTS == "T") {
                            numberInstallments = recordObj.getLineCount({ sublistId: "installlment" });
                        }

                        var fromType = "invoice";
                        var fromId = idTransaction;
                        if (recordType == "creditmemo") {
                            fromType = "customer";
                            fromId = entity;
                        }


                        var toType = CONFIG_TRANSACTION[recordType]['recordtype'];
                        var recordTransaction = record.transform({
                            fromType: fromType,
                            fromId: fromId,
                            toType: toType,
                            isDynamic: true,
                            defaultValues: {
                                'customform': form,
                            }
                        });



                        //recordTransaction.setValue('customform', form);
                        if (toType == "invoice") {
                            recordTransaction.setValue("entity", entity);
                            recordTransaction.setValue("subsidiary", subsidiary);
                        }
                        recordTransaction.setValue('trandate', date);
                        recordTransaction.setValue('postingperiod', postingperiod);
                        recordTransaction.setValue('memo', MEMO_TRANSACTION);
                        recordTransaction.setValue('account', account);
                        recordTransaction.setValue('currency', currency);
                        recordTransaction.setValue('exchangerate', exchangeRate);
                        recordTransaction.setValue('custbody_lmry_reference_transaction', idTransaction);
                        recordTransaction.setValue('custbody_lmry_reference_transaction_id', idTransaction);
                        recordTransaction.setValue('custbody_lmry_reference_entity', entity);
                        recordTransaction.setValue("terms", "");

                        if (FEATURE_TRANSACTION[toType]) {
                            var approvalFeature = runtime.getCurrentScript().getParameter({ name: FEATURE_TRANSACTION[toType] });
                            if (approvalFeature == true || approvalFeature == 'T') {
                                recordTransaction.setValue('approvalstatus', 2);
                            }
                        }

                        if (DEPARTMENT_FEAT == true || DEPARTMENT_FEAT == 'T') {
                            var departmentHeader = departmentTr;
                            if (DEPTMANDATORY == "T" || DEPTMANDATORY == true) {
                                departmentHeader = departmentHeader || setupSubsidiary.department;
                            }

                            recordTransaction.setValue('department', departmentHeader);
                        }

                        if (CLASS_FEAT == true || CLASS_FEAT == 'T') {
                            var classHeader = classTr;
                            if (CLASSMANDATORY == "T" || CLASSMANDATORY == true) {
                                classHeader = classHeader || setupSubsidiary["class"];
                            }

                            recordTransaction.setValue('class', classHeader);
                        }

                        if (LOCATION_FEAT == true || LOCATION_FEAT == 'T') {
                            var locationHeader = locationTr;
                            if (LOCMANDATORY == "T" || LOCMANDATORY == true) {
                                locationHeader = locationHeader || setupSubsidiary.location;
                            }

                            recordTransaction.setValue('location', locationHeader);
                        }


                        //Limpiar campos copiados del invoice
                        recordTransaction.setValue('custbody_lmry_document_type', '');
                        recordTransaction.setValue('custbody_lmry_serie_doc_cxc', '');
                        recordTransaction.setValue('custbody_lmry_num_preimpreso', '');
                        recordTransaction.setValue('custbody_lmry_informacion_adicional', '');
                        recordTransaction.setValue('custbody_lmry_apply_wht_code', false);
                        recordTransaction.setValue('custbody_lmry_paymentmethod', "");


                        //Campos de facturacion
                        if (recordTransaction.getField({ fieldId: 'custbody_psg_ei_template' })) {
                            recordTransaction.setValue('custbody_psg_ei_template', '');
                        }

                        if (recordTransaction.getField({ fieldId: 'custbody_psg_ei_status' })) {
                            recordTransaction.setValue('custbody_psg_ei_status', '');
                        }

                        if (recordTransaction.getField({ fieldId: 'custbody_psg_ei_sending_method' })) {
                            recordTransaction.setValue('custbody_psg_ei_sending_method', '');
                        }

                        if (recordTransaction.getField({ fieldId: 'custbody_psg_ei_generated_edoc' })) {
                            recordTransaction.setValue('custbody_psg_ei_generated_edoc', '');
                        }

                        var amountWHT = 0.00;

                        if (toType == "creditmemo") {
                            //si se genera un creditmemo se elimina los items que viene del invoice
                            removeAllItems(recordTransaction);
                        }

                        var whtLines = [], taxCode = "";
                        taxResults.forEach(function (tr) {

                            var position = tr.position;
                            var taxItem = tr.taxItem;
                            var subType = tr.subType.value;
                            var subTypeText = tr.subType.text;
                            var whtAmount = tr.whtAmount;
                            var baseAmount = tr.baseAmount;
                            var appliesTo = tr.appliesTo.value;
                            var whtRate = tr.whtRate;
                            if (!taxCode) {
                                taxCode = tr.taxCode;
                            }


                            var department = "", class_ = "", location = "";

                            if (DEPARTMENT_FEAT == true || DEPARTMENT_FEAT == 'T') {
                                department = tr.department || "";

                                if (!FEAT_SUMMARY_WHT && appliesTo == 2 && segmentationLines.hasOwnProperty(position)) {
                                    department = department || segmentationLines[position].department || "";
                                }

                                department = department || departmentTr || "";

                                if (DEPTMANDATORY == "T" || DEPTMANDATORY == true) {
                                    department = department || setupSubsidiary.department || "";
                                }
                            }


                            if (CLASS_FEAT == true || CLASS_FEAT == 'T') {
                                class_ = tr.class || "";

                                if (!FEAT_SUMMARY_WHT && appliesTo == 2 && segmentationLines.hasOwnProperty(position)) {
                                    class_ = class_ || segmentationLines[position].class || "";
                                }

                                class_ = class_ || classTr || "";

                                if (CLASSMANDATORY == "T" || CLASSMANDATORY == true) {
                                    class_ = class_ || setupSubsidiary.class || "";
                                }
                            }

                            if (LOCATION_FEAT == true || LOCATION_FEAT == 'T') {
                                location = tr.location || "";

                                if (!FEAT_SUMMARY_WHT && appliesTo == 2 && segmentationLines.hasOwnProperty(position)) {
                                    location = location || segmentationLines[position].location || "";
                                }

                                location = location || locationTr || "";

                                if (LOCMANDATORY == "T" || LOCMANDATORY == true) {
                                    location = location || setupSubsidiary.location || "";
                                }
                            }

                            var whtLineObj = null;

                            if (FEAT_SUMMARY_WHT) {
                                var foundLines = whtLines.filter(function (line) {
                                    return line.subType == subType;
                                });
                                whtLineObj = foundLines[0];

                                if (whtLineObj) {
                                    whtLineObj.whtAmount = whtLineObj.whtAmount + whtAmount;
                                    whtLineObj.baseAmount = whtLineObj.baseAmount + baseAmount;
                                } else {
                                    whtLines.push({
                                        taxItem: taxItem,
                                        whtAmount: whtAmount,
                                        subType: subType,
                                        whtRate: whtRate,
                                        baseAmount: baseAmount,
                                        memo: subTypeText + MEMO_LINE,
                                        department: department,
                                        class_: class_,
                                        location: location
                                    });
                                }
                            } else {

                                var memo = subTypeText + MEMO_LINE;
                                if (appliesTo == 2) {
                                    memo += ' - (ID Item: ' + tr.item.value + ')';
                                }

                                whtLines.push({
                                    taxItem: taxItem,
                                    whtAmount: whtAmount,
                                    subType: subType,
                                    whtRate: whtRate,
                                    baseAmount: baseAmount,
                                    memo: memo,
                                    department: department,
                                    class_: class_,
                                    location: location
                                });
                            }

                        });



                        log.debug("whtLines", JSON.stringify(whtLines));

                        whtLines.forEach(function (line) {
                            var amount = round2(line.whtAmount);
                            amountWHT = amountWHT + amount;
                            recordTransaction.selectNewLine({ sublistId: 'item' });
                            recordTransaction.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: line.taxItem });

                            if (featureMultiPrice == true || featureMultiPrice == 'T') {
                                recordTransaction.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: -1 });
                            }
                            recordTransaction.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: amount });
                            recordTransaction.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: amount });
                            recordTransaction.setCurrentSublistValue({ sublistId: 'item', fieldId: 'tax1amt', value: 0.00 });
                            recordTransaction.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: taxCode });

                            if (DEPARTMENT_FEAT == "T" || DEPARTMENT_FEAT == true) {
                                var depField = recordTransaction.getCurrentSublistField({ sublistId: 'item', fieldId: 'department' });
                                if (depField && line.department) {
                                    recordTransaction.setCurrentSublistValue({ sublistId: 'item', fieldId: 'department', value: line.department });
                                }
                            }

                            if (CLASS_FEAT == "T" || CLASS_FEAT == true) {
                                var classField = recordTransaction.getCurrentSublistField({ sublistId: 'item', fieldId: 'class' });
                                if (classField && line.class) {
                                    recordTransaction.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: line.class });
                                }
                            }

                            if (LOCATION_FEAT == "T" || LOCATION_FEAT == true) {
                                var locField = recordTransaction.getCurrentSublistField({ sublistId: 'item', fieldId: 'location' });
                                if (locField && line.location) {
                                    recordTransaction.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: line.location });
                                }
                            }

                            recordTransaction.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_ar_perception_amount', value: line.baseAmount });
                            recordTransaction.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_ar_perception_percentage', value: line.whtRate });
                            recordTransaction.commitLine({ sublistId: "item" });
                        });

                        if (toType == "creditmemo") {
                            //si se genero un creditmemo se aplica el invoice de donde se creo.
                            var numApply = recordTransaction.getLineCount({
                                sublistId: 'apply'
                            });

                            for (var i = 0; i < numApply; i++) {
                                recordTransaction.selectLine({ sublistId: "apply", line: i });
                                var lineTransaction = recordTransaction.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: i });

                                var instNumber = recordTransaction.getSublistValue({ sublistId: "apply", fieldId: "installmentnumber", line: i });

                                if (Number(lineTransaction) == Number(idTransaction)) {

                                    recordTransaction.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });

                                    if (numberInstallments) {
                                        if (installments[String(instNumber)] && installments[String(instNumber)]["wht"]) {
                                            var partialWht = installments[String(instNumber)]["wht"]
                                            recordTransaction.setCurrentSublistValue({ sublistId: "apply", fieldId: "amount", value: partialWht });
                                            recordTransaction.commitLine({ sublistId: "apply" });
                                        }
                                    } else {
                                        recordTransaction.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: parseFloat(amountWHT) });
                                        recordTransaction.commitLine({ sublistId: "apply" });
                                        break;
                                    }
                                }
                            }
                        }

                        idNewRecord = recordTransaction.save({
                            ignoreMandatoryFields: true,
                            disableTriggers: true,
                            enableSourcing: true
                        });

                        log.debug('idNewRecord', idNewRecord);
                    }
                }
            }
            return idNewRecord;
        }


        function applyTransaction(recordObj, idTransaction, amountWHT) {
            var recordType = recordObj.getValue("baserecordtype");

            var oldInvoices = [];

            var searchTransactions = search.create({
                type: "invoice",
                filters: [
                    ["mainline", "is", "T"], "AND",
                    ["memo", "startswith", MEMO_TRANSACTION], "AND",
                    ["custbody_lmry_reference_transaction", "anyof", recordObj.id]
                ],
                columns: [search.createColumn({
                    name: "internalid",
                    sort: search.Sort.ASC
                })]
            });

            var results = searchTransactions.run().getRange(0, 1000);
            var columns = searchTransactions.columns;

            for (var i = 0; i < results.length; i++) {
                var id = results[i].getValue(columns[0]);
                id = Number(id);
                if (oldInvoices.indexOf(id) == -1 && (Number(id) != Number(idTransaction))) {
                    oldInvoices.push(id);
                }
            }

            log.debug("oldInvoices", JSON.stringify(oldInvoices));

            var recordTransaction = record.load({
                type: recordType,
                id: recordObj.id,
                isDynamic: true
            });

            var total = recordTransaction.getValue({ fieldId: "total" });
            total = parseFloat(total);

            var numApply = recordTransaction.getLineCount({ sublistId: 'apply' });

            var currentLine = -1

            for (var i = 0; i < numApply; i++) {
                recordTransaction.selectLine({ sublistId: "apply", line: i });
                var lineTransaction = recordTransaction.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: i });
                //si existe una transaccion de retencion antigua, se desaplica
                if (oldInvoices.indexOf(Number(lineTransaction)) != -1) {
                    recordTransaction.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: false, line: i });
                } else if (Number(lineTransaction) == Number(idTransaction)) {
                    currentLine = i;
                }
            }

            if (currentLine != -1) {
                recordTransaction.selectLine({ sublistId: "apply", line: currentLine });
                recordTransaction.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                recordTransaction.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: parseFloat(amountWHT) });
            }

            recordTransaction.save({
                ignoreMandatoryFields: true,
                disableTriggers: true,
                enableSourcing: true
            });

            if (oldInvoices.length) {
                for (var i = 0; i < oldInvoices.length; i++) {
                    var internalid = oldInvoices[i];
                    if (internalid) {
                        record.delete({
                            type: "invoice",
                            id: internalid
                        });
                    }
                }
            }
        }

        function deleteGeneratedRecords(recordObj) {
            try {
                if (recordObj.id) {
                    var FEAT_SUBS = runtime.isFeatureInEffect({
                        feature: "SUBSIDIARIES"
                    });

                    var subsidiary = 1;
                    if (FEAT_SUBS == true || FEAT_SUBS == 'T') {
                        subsidiary = recordObj.getValue({
                            fieldId: 'subsidiary'
                        });
                    }

                    var licenses = library_mail.getLicenses(subsidiary);
                    var transactionType = recordObj.getValue('baserecordtype');

                    if (library_mail.getAuthorization(596, licenses) || runtime.executionContext == "MAPREDUCE") {
                        deleteTaxResults(recordObj.id);
                    } else {
                        inactiveTaxResults(recordObj);
                    }

                    var whtTransactions = [];
                    var search_transactions = search.create({
                        type: CONFIG_TRANSACTION[transactionType]["recordtype"],
                        filters: [
                            ['mainline', 'is', 'T'], 'AND',
                            ['custbody_lmry_reference_transaction', 'anyof', recordObj.id], 'AND',
                            [
                                ['memo', 'is', MEMO_TRANSACTION], "OR",
                                ["memo", "is", MEMO_EXPORT_WHT]
                            ]
                        ],
                        columns: ['internalid']
                    });

                    var results = search_transactions.run().getRange(0, 1000);

                    for (var i = 0; i < results.length; i++) {
                        var internalid = results[i].getValue("internalid");
                        whtTransactions.push(Number(internalid));
                    }

                    if (transactionType == "creditmemo" && whtTransactions.length) {

                        var recordTransaction = record.load({
                            type: "creditmemo",
                            id: recordObj.id,
                            isDynamic: true
                        });

                        var numApply = recordTransaction.getLineCount({
                            sublistId: 'apply'
                        });

                        for (var i = 0; i < numApply; i++) {
                            recordTransaction.selectLine({ sublistId: 'apply', line: i });

                            var lineTransaction = recordTransaction.getSublistValue({
                                sublistId: 'apply',
                                fieldId: 'internalid',
                                line: i
                            });

                            if (whtTransactions.indexOf(Number(lineTransaction)) != -1) {
                                recordTransaction.setCurrentSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'apply',
                                    value: false
                                });
                            }
                        }

                        recordTransaction.save({
                            ignoreMandatoryFields: true,
                            disableTriggers: true,
                            enableSourcing: true
                        });
                    }


                    log.debug("whtTransaction", JSON.stringify(whtTransactions));

                    for (var i = 0; i < whtTransactions.length; i++) {
                        var id = whtTransactions[i];
                        record.delete({
                            type: CONFIG_TRANSACTION[transactionType]["recordtype"],
                            id: id
                        });
                    }
                }

            } catch (err) {
                library_mail.sendemail('[ deleteGeneratedRecords ] ' + err, LMRY_script);
                lbryLog.doLog({ title: "[ deleteGeneratedRecords ]", message: err, relatedScript: LMRY_script });
            }
        }

        function checkWithholdingTax(recordObj) {
            var numLines = recordObj.getLineCount({
                sublistId: 'item'
            });
            var found = false;
            for (var i = 0; i < numLines; i++) {
                var whtApply = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxapplies', line: i });
                if (whtApply == 'T' || whtApply == true) {
                    found = true;
                    break;
                }
            }
            return found;
        }

        function getValidationsBRTaxes(recordObj, setupSubsidiary, taxResults) {
            var taxesBR = {};
            var totalTaxes = {};
            var validationsTaxes = {};
            var defaultValue = !setupSubsidiary['minimBRTax'];
            validationsTaxes['total'] = defaultValue;
            var numLines = recordObj.getLineCount({ sublistId: 'item' });
            for (var i = 0; i < numLines; i++) {
                validationsTaxes[String(i)] = defaultValue;
            }

            if (recordObj.id) {
                if (setupSubsidiary['minimTaxes']) {
                    if (taxResults && taxResults.length) {
                        taxResults.forEach(function (tr) {
                            var subtype = tr.subType.value;
                            var position = tr.position;
                            if (subtype && position) {
                                var taxAmount = tr.lc_taxAmount;
                                taxAmount = round2(taxAmount);
                                if (!taxesBR.hasOwnProperty(position)) {
                                    taxesBR[position] = {};
                                }

                                //Se suman los impuestos por item
                                taxesBR[position][subtype] = taxesBR[position][subtype] || 0.00;
                                taxesBR[position][subtype] += parseFloat(taxAmount);

                                //Se suman todos los impuestos de la transaccion
                                totalTaxes[subtype] = totalTaxes[subtype] || 0.00;
                                totalTaxes[subtype] += parseFloat(taxAmount);

                            }
                        });
                    }

                    log.debug('taxesBR', JSON.stringify(taxesBR));
                    log.debug('totalTaxes', JSON.stringify(totalTaxes));

                    var minimBRTax = setupSubsidiary['minimBRTax'];
                    minimBRTax = parseFloat(minimBRTax);

                    //Totales
                    var exceedMinim = false;
                    for (var subtype in totalTaxes) {
                        if (totalTaxes[subtype] < minimBRTax) {
                            exceedMinim = true;
                            break;
                        }
                    }
                    validationsTaxes['total'] = !exceedMinim;

                    //Lines
                    for (var position in taxesBR) {
                        var exceedMinim = false;
                        for (var subtype in taxesBR[position]) {
                            if (parseFloat(taxesBR[position][subtype]) < minimBRTax) {
                                exceedMinim = true;
                                break;
                            }
                        }
                        validationsTaxes[position] = !exceedMinim;
                    }

                }
            }

            return validationsTaxes;
        }

        function getDataItem(recordObj) {
            var results = { 'items': [], 'catalogs': [] };
            var numLines = recordObj.getLineCount({ sublistId: 'item' });
            for (var i = 0; i < numLines; i++) {
                var idItem = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                idItem = Number(idItem);

                if (results['items'].indexOf(idItem) == -1) {
                    results['items'].push(idItem);
                }

                var catalog = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_br_service_catalog', line: i });
                catalog = Number(catalog);
                if (catalog && results['catalogs'].indexOf(catalog) == -1) {
                    results['catalogs'].push(catalog);
                }
            }
            return results;
        }

        function validateTotalWHT(recordObj, validatedWHTs) {
            var totalAmountWHT = 0.00;
            for (var i = 0; i < validatedWHTs.length; i++) {
                var taxResult = validatedWHTs[i];
                if (taxResult) {
                    totalAmountWHT += taxResult.whtAmount;
                }
            }
            var totalAmounts = getTotalAmounts(recordObj);
            log.debug("totalAmounts", totalAmounts);
            var totalAmount = totalAmounts["total"];

            return (totalAmountWHT <= parseFloat(totalAmount))
        }


        function removeAllItems(recordObj) {
            var n = recordObj.getLineCount({ sublistId: 'item' });
            while (n > 0) {
                recordObj.removeLine({ sublistId: 'item', line: 0 });
                n = recordObj.getLineCount({ sublistId: 'item' });
            }
        }

        function getCustomSegments() {
            var customSegments = [];
            var FEAT_CUSTOMSEGMENTS = runtime.isFeatureInEffect({ feature: "customsegments" });

            if (FEAT_CUSTOMSEGMENTS == true || FEAT_CUSTOMSEGMENTS == "T") {
                var searchCustomSegments = search.create({
                    type: "customrecord_lmry_setup_cust_segm",
                    filters: [
                        ["isinactive", "is", "F"]
                    ],
                    columns: [
                        "internalid", "name", "custrecord_lmry_setup_cust_segm"]
                });

                var results = searchCustomSegments.run().getRange(0, 1000);

                if (results && results.length) {
                    for (var i = 0; i < results.length; i++) {
                        var customSegmentId = results[i].getValue("custrecord_lmry_setup_cust_segm");
                        customSegmentId = customSegmentId.trim() || "";
                        if (customSegmentId) {
                            customSegments.push(customSegmentId);
                        }
                    }
                }

            }
            return customSegments;
        }

        function updateInstallments(recordObj, taxResults, installments, brTransactionIds) {
            var numberInstallments = recordObj.getLineCount({ sublistId: "installment" });
            if (numberInstallments && taxResults.length) {

                var whtLines = [];

                taxResults.forEach(function (tr) {
                    var subType = tr.subType.value;
                    var whtAmount = tr.whtAmount;
                    var whtLineObj = null;

                    if (FEAT_SUMMARY_WHT) {
                        var foundLines = whtLines.filter(function (line) {
                            return line.subType == subType;
                        });
                        whtLineObj = foundLines[0];

                        if (whtLineObj) {
                            whtLineObj.whtAmount = whtLineObj.whtAmount + whtAmount;
                        } else {
                            whtLines.push({
                                whtAmount: whtAmount,
                                subType: subType
                            });
                        }
                    } else {
                        whtLines.push({
                            whtAmount: whtAmount,
                            subType: subType,
                        });
                    }
                });

                var whtTotal = 0.00;
                whtLines.forEach(function (line) {
                    whtTotal = whtTotal + round2(line.whtAmount);
                });


                var calculatedWhtTotal = 0.00;
                var totalAmounts = getTotalAmounts(recordObj);
                log.debug("totalAmounts", JSON.stringify(totalAmounts));
                var total = totalAmounts["total"];

                var lastNumber = "";

                var searchInstallments = search.create({
                    type: "invoice",
                    filters:
                        [
                            ["internalid", "anyof", recordObj.id], "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns: [
                        search.createColumn({
                            name: "installmentnumber",
                            join: "installment",
                            sort: search.Sort.ASC
                        }),
                        "installment.fxamount",
                        "installment.duedate",
                        "internalid"
                    ],
                    settings: [search.createSetting({ name: 'consolidationtype', value: 'NONE' })]
                });

                var columns = searchInstallments.columns;
                var results = searchInstallments.run().getRange(0, 1000);
                for (var i = 0; i < results.length; i++) {
                    // var amount = recordObj.getSublistValue({ sublistId: "installment", fieldId: "amount", line: i });
                    // amount = parseFloat(amount);
                    // var number = recordObj.getSublistValue({ sublistId: "installment", fieldId: "seqnum", line: i });
                    var number = results[i].getValue(columns[0]);
                    var amount = results[i].getValue(columns[1]);
                    amount = parseFloat(amount);
                    var duedate = results[i].getValue(columns[2]);
                    //duedate = format.parse({ value: fecha, type: format.Type.DATE });

                    if (amount && number) {
                        lastNumber = number;
                        var partialWht = (amount / total) * whtTotal;
                        partialWht = round2(partialWht);

                        installments[String(number)] = { "amount": amount, "wht": partialWht, "duedate": duedate };
                        calculatedWhtTotal += partialWht;
                    }
                }

                log.debug("installments", JSON.stringify(installments));

                var diff = whtTotal - calculatedWhtTotal;
                log.debug("diff", diff);
                if (diff) {
                    if (installments[String(lastNumber)]) {
                        var partialWht = installments[String(lastNumber)]["wht"];
                        partialWht = round2(partialWht + diff);
                        installments[String(lastNumber)]["wht"] = partialWht;
                    }
                }

                log.debug("installments", JSON.stringify(installments));
                if (brTransactionIds.length) {
                    brTransactionIds.forEach(function (brId) {
                        record.submitFields({
                            type: "customrecord_lmry_br_transaction_fields",
                            id: brId,
                            values: {
                                "custrecord_lmry_br_installments": JSON.stringify(installments)
                            },
                            options: {
                                disableTriggers: true
                            }
                        });
                    });
                }
            }
        }

        function getTotalAmounts(recordObj) {
            var total = 0.00, subTotal = 0.00, taxTotal = 0.00;
            var numLines = recordObj.getLineCount({ sublistId: "item" });
            for (var i = 0; i < numLines; i++) {
                var itemType = recordObj.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i }) || "";
                if (GroupTypeItems.indexOf(itemType) == -1) {
                    var netAmt = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }) || 0.00;
                    netAmt = parseFloat(netAmt);

                    var taxAmt = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }) || 0.00;
                    taxAmt = parseFloat(taxAmt);

                    var grossAmt = round2(netAmt + taxAmt);

                    taxTotal = round2(taxTotal + taxTotal);
                    subTotal = round2(subTotal + netAmt);
                    total = round2(total + grossAmt);
                }
            }

            return { "total": total, "subTotal": subTotal, "taxTotal": taxTotal };
        }

        function validateMemo(recordObj) {
            var MEMOS = ["Reference VOID", "(LatamTax -  WHT)", "Latam - Interest and Penalty", "Voided Latam - WHT"];
            var memo = recordObj.getValue("memo");
            for (var i = 0; i < MEMOS.length; i++) {
                if (memo.substring(0, MEMOS[i].length) == MEMOS[i]) {
                    return false;
                }
            }

            return true;
        }

        function getSteTaxRecord(recordObj) {
            var steTaxObj = null;
            var steSearch = search.create({
                type: "customrecord_lmry_ste_json_result",
                filters: [
                    ["isinactive", "is", "F"], "AND",
                    ["custrecord_lmry_ste_related_transaction", "anyof", recordObj.id]
                ],
                columns: ["internalid", "custrecord_lmry_ste_tax_transaction"]
            });

            var results = steSearch.run().getRange(0, 1);
            if (results && results.length) {
                var steId = results[0].getValue("internalid");
                var taxes = results[0].getValue("custrecord_lmry_ste_tax_transaction") || "";
                if (taxes) {
                    taxes = JSON.parse(taxes);
                }
                steTaxObj = {
                    id: Number(steId),
                    taxes: taxes || []
                };
            }

            return steTaxObj;
        }

        function getCalculatedTaxes(recordObj, steTaxObj) {
            var taxes = [];
            if (steTaxObj && steTaxObj.taxes && steTaxObj.taxes.length) {
                taxes = steTaxObj.taxes;
            } else {
                var taxResultSearch = search.create({
                    type: "customrecord_lmry_br_transaction",
                    filters:
                        [
                            ["custrecord_lmry_br_transaction", "anyof", recordObj.id], "AND",
                            ["custrecord_lmry_tax_type", "anyof", "4"], "AND",
                            ["custrecord_lmry_br_transaction.mainline", "is", "T"]
                        ],
                    columns:
                        ["custrecord_lmry_br_type_id", "custrecord_lmry_br_positem", "custrecord_lmry_lineuniquekey", "custrecord_lmry_br_total", "custrecord_lmry_amount_local_currency"]
                });

                var results = taxResultSearch.run().getRange(0, 1000);
                if (results && results.length) {
                    for (var i = 0; i < results.length; i++) {
                        var subTypeId = results[i].getValue("custrecord_lmry_br_type_id");
                        subTypeId = Number(subTypeId);
                        var subTypeText = results[i].getText("custrecord_lmry_br_type_id");
                        var position = results[i].getValue("custrecord_lmry_br_positem");
                        var lineUniqueKey = results[i].getValue("custrecord_lmry_lineuniquekey");
                        var taxAmount = results[i].getValue("custrecord_lmry_br_total") || 0.00;
                        taxAmount = parseFloat(taxAmount);
                        var lc_taxAmount = results[i].getValue("custrecord_lmry_amount_local_currency") || 0.00;
                        lc_taxAmount = parseFloat(lc_taxAmount);

                        taxes.push({
                            subType: { value: subTypeId, text: subTypeText },
                            position: position,
                            lineUniqueKey: lineUniqueKey,
                            taxAmount: taxAmount,
                            lc_taxAmount: lc_taxAmount
                        });
                    }
                }
            }

            return taxes;
        }


        function createTaxResults(recordObj, taxResults) {
            taxResults.forEach(function (tr) {
                var recordTr = record.create({
                    type: 'customrecord_lmry_br_transaction'
                });

                recordTr.setValue({ fieldId: 'custrecord_lmry_br_related_id', value: String(recordObj.id) });
                recordTr.setValue({ fieldId: 'custrecord_lmry_br_transaction', value: recordObj.id });
                recordTr.setValue({ fieldId: 'custrecord_lmry_br_type', value: tr.subType.text });
                recordTr.setValue({ fieldId: 'custrecord_lmry_br_type_id', value: tr.subType.value });

                recordTr.setValue({ fieldId: 'custrecord_lmry_base_amount', value: round4(tr.baseAmount) });
                recordTr.setValue({ fieldId: 'custrecord_lmry_br_total', value: round4(tr.whtAmount) });
                recordTr.setValue({ fieldId: 'custrecord_lmry_br_percent', value: tr.whtRate });


                var strAppliesTo = {
                    '1': 'Total', '2': 'Line - Item'
                };

                recordTr.setValue({ fieldId: 'custrecord_lmry_total_item', value: strAppliesTo[tr.appliesTo.value] || "" });
                recordTr.setValue({ fieldId: 'custrecord_lmry_item', value: tr.item.value });
                recordTr.setValue({ fieldId: 'custrecord_lmry_br_positem', value: tr.position });
                recordTr.setValue({ fieldId: 'custrecord_lmry_lineuniquekey', value: tr.lineUniqueKey });

                if (tr.hasOwnProperty("contributoryClass")) { // Entidad - Totales || Entidad - Items || Entidad - Expenses
                    recordTr.setValue({ fieldId: 'custrecord_lmry_ccl', value: tr.contributoryClass });
                    recordTr.setValue({ fieldId: 'custrecord_lmry_br_ccl', value: tr.contributoryClass });
                } else if (tr.hasOwnProperty("nationalTax")) {
                    recordTr.setValue({ fieldId: 'custrecord_lmry_ntax', value: tr.nationalTax });
                    recordTr.setValue({ fieldId: 'custrecord_lmry_br_ccl', value: tr.nationalTax });
                }
                // recordSummary.setValue({ fieldId: 'custrecord_lmry_accounting_books', value: concatAccountBooks});
                recordTr.setValue({ fieldId: 'custrecord_lmry_tax_description', value: tr.description || "" });
                recordTr.setValue({ fieldId: 'custrecord_lmry_total_base_currency', value: round4(tr.lc_whtAmount) });
                recordTr.setValue({ fieldId: 'custrecord_lmry_tax_type', value: "1" });
                if (tr.hasOwnProperty("br_receita")) {
                    recordTr.setValue({ fieldId: 'custrecord_lmry_br_receta', value: tr.br_receita.value });
                }
                if (tr.hasOwnProperty("br_regimenCatalog")) {
                    recordTr.setValue({ fieldId: 'custrecord_lmry_br_regimen_asoc_catalog', value: tr.br_regimenCatalog.value });
                }
                recordTr.setValue({ fieldId: "custrecord_lmry_gross_amt", value: tr.grossAmount });

                if (tr.discountAmount) {
                    recordTr.setValue({ fieldId: "custrecord_lmry_discount_amt", value: tr.discountAmount });
                }
                recordTr.setValue({ fieldId: "custrecord_lmry_base_amount_local_currc", value: tr.lc_baseAmount });
                recordTr.setValue({ fieldId: "custrecord_lmry_amount_local_currency", value: tr.lc_whtAmount })
                recordTr.setValue({ fieldId: "custrecord_lmry_gross_amt_local_curr", value: tr.lc_grossAmount });

                // if (tr.lc_discountAmount) {
                //     recordTr.setValue({ fieldId: "custrecord_lmry_discount_amt_local_curr", value: tr.lc_discountAmount });
                // }

                recordTr.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
            });
        }


        function getBrTransactionFieldsIds(recordObj) {
            var brTransactionIds = [];
            var brTransactionSearch = search.create({
                type: 'customrecord_lmry_br_transaction_fields',
                filters: [
                    ["isinactive", "is", "F"], "AND",
                    ["custrecord_lmry_br_related_transaction", "anyof", recordObj.id]
                ],
                columns: ["internalid"]
            });
            var results = brTransactionSearch.run().getRange(0, 2);
            if (results && results.length) {
                for (var i = 0; i < results.length; i++) {
                    var id = results[i].getValue("internalid");
                    brTransactionIds.push(id);
                }
            }

            return brTransactionIds;
        }

        function updateIssRetained(brTransactionIds, calculatedTaxes, validatedWHTs) {
            if (brTransactionIds.length) {
                var ISS_TAX_TYPE = 13;
                var RETEISS_TAX_TYPE = 67;
                var hasISS = calculatedTaxes.filter(function (tr) {
                    return tr.subType.value == ISS_TAX_TYPE;
                }).length > 0;

                var hasReteISS = validatedWHTs.filter(function (tr) {
                    return tr.subType.value == RETEISS_TAX_TYPE;
                }).length > 0;


                if (!hasReteISS && hasISS) {
                    brTransactionIds.forEach(function (brId) {
                        record.submitFields({
                            type: "customrecord_lmry_br_transaction_fields",
                            id: brId,
                            values: {
                                "custrecord_lmry_br_iss_retained": "2"
                            },
                            options: {
                                disableTriggers: true
                            }
                        });
                    });
                }
            }
        }

        function saveSteTaxRecord(recordObj, whtTaxResults, steTaxObj) {
            var steId = "";
            if (steTaxObj) {
                steId = steTaxObj.id;
                var values = {
                    custrecord_lmry_ste_transaction_date: recordObj.getValue("trandate"),
                    custrecord_lmry_ste_wht_transaction: JSON.stringify(whtTaxResults),
                };

                if (library_mail.getAuthorization(596, licenses) || runtime.executionContext == "MAPREDUCE") {
                    values.custrecord_lmry_ste_taxresult_generated = true;
                } else {
                    values.custrecord_lmry_ste_taxresult_generated = false;
                }

                record.submitFields({
                    type: "customrecord_lmry_ste_json_result",
                    id: steId,
                    values: values,
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true,
                        disableTriggers: true
                    }
                });

            } else {
                var steRecord = record.create({
                    type: "customrecord_lmry_ste_json_result"
                });
                steRecord.setValue({ fieldId: "custrecord_lmry_ste_related_transaction", value: recordObj.id });
                steRecord.setValue({ fieldId: "custrecord_lmry_ste_related_trans_id", value: String(recordObj.id) });
                if (FEAT_SUBS == true || FEAT_SUBS == "T") {
                    var subsidiary = recordObj.getValue("subsidiary");
                    steRecord.setValue({ fieldId: "custrecord_lmry_ste_subsidiary", value: subsidiary });
                }

                if (library_mail.getAuthorization(596, licenses) || runtime.executionContext == "MAPREDUCE") {
                    steRecord.setValue({ fieldId: "custrecord_lmry_ste_taxresult_generated", value: true });
                } else {
                    steRecord.setValue({ fieldId: "custrecord_lmry_ste_taxresult_generated", value: false });
                }

                steRecord.setValue({ fieldId: "custrecord_lmry_ste_subsidiary_country", value: 30 });//Brasil
                steRecord.setValue({ fieldId: "custrecord_lmry_ste_transaction_date", value: recordObj.getValue("trandate") });
                steRecord.setValue({ fieldId: "custrecord_lmry_ste_wht_transaction", value: JSON.stringify(whtTaxResults) });
                steId = steRecord.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
            }
            log.debug("steId", steId);
        }

        function inactiveTaxResults(recordObj) {
            if (recordObj.id) {
                var searchTaxResults = search.create({
                    type: 'customrecord_lmry_br_transaction',
                    filters: [
                        ["isinactive", "is", "F"], "AND",
                        ["custrecord_lmry_br_transaction", "anyof", recordObj.id], "AND",
                        ["custrecord_lmry_tax_type", "anyof", "1"]//Retencion
                    ],
                    columns: ['internalid']
                });

                var results = searchTaxResults.run().getRange(0, 1000);
                if (results && results.length > 0) {
                    for (var i = 0; i < results.length; i++) {
                        var tr_id = results[i].getValue('internalid');
                        record.submitFields({
                            type: "customrecord_lmry_br_transaction",
                            id: Number(tr_id),
                            values: {
                                "isinactive": true
                            },
                            options: {
                                enableSourcing: true, ignoreMandatoryFields: true,
                                disableTriggers: true
                            }
                        })
                    }
                }
            }
        }

        function isApproved(recordObj) {
            var approvalFeature = false;
            var typeTransaction = recordObj.getValue('baserecordtype');
            if (FEATURE_TRANSACTION[typeTransaction]) {
                approvalFeature = runtime.getCurrentScript().getParameter({ name: FEATURE_TRANSACTION[typeTransaction] });
            }

            var approvalStatus = recordObj.getValue({ fieldId: 'approvalstatus' }) || "";
            approvalStatus = Number(approvalStatus);

            return (approvalFeature == false || approvalFeature == 'F') || ((approvalFeature == true || approvalFeature == 'T') && (approvalStatus && approvalStatus == 2))
        }

        return {
            LatamTaxWithHoldingBR: LatamTaxWithHoldingBR,
            deleteGeneratedRecords: deleteGeneratedRecords
        }
    });