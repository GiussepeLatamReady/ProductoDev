/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       Oct 2020        LatamReady
 * File : LMRY_CO_VAT_Reclass_PLGN.js
 */
var objContext = nlapiGetContext();

var scriptName = 'LatamReady - CO VAT Reclass PLGN';

var FEAT_SUBSIDIARY = false;
var FEAT_CUSTOMSEGMENTS = false;
var FEAT_DEPT = false;
var FEAT_CLASS = false;
var FEAT_LOC = false;
var FEAT_MULTIBOOK = false;
var FEAT_FOREIGN_CURRENCY = false;

function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    try {
        var nexus_country = transactionRecord.getFieldValue("nexus_country");
        FEAT_SUBSIDIARY = objContext.getFeature('SUBSIDIARIES');
        FEAT_DEPT = objContext.getFeature("departments");
        FEAT_CLASS = objContext.getFeature("classes");
        FEAT_LOC = objContext.getFeature("locations");
        FEAT_FOREIGN_CURRENCY = objContext.getFeature('foreigncurrencymanagement');
        var transactionType = transactionRecord.getRecordType();
        if (nexus_country == "CO" && (FEAT_FOREIGN_CURRENCY == true || FEAT_FOREIGN_CURRENCY == "T") && ["invoice", "creditmemo"].indexOf(transactionType) != -1) {

            var standardLinesInfo = getStandardLinesInfo(transactionRecord, standardLines);
            nlapiLogExecution("DEBUG", "standardLineInfo", JSON.stringify(standardLinesInfo));


            if (!standardLinesInfo.vatAmount) {
                return;
            }
            nlapiLogExecution("DEBUG", "bookId", book.getId());
            var setupTax = getSetupTaxSubsidiary(transactionRecord);
            nlapiLogExecution("DEBUG", "setupTax", JSON.stringify(setupTax));
            var currency = transactionRecord.getFieldValue("currency");
            if (currency != setupTax.localCurrency) {
                var bookInfo = getBookInfo(transactionRecord, book);
                nlapiLogExecution("DEBUG", "bookInfo", JSON.stringify(bookInfo));

                if (bookInfo.currency == setupTax.localCurrency) {
                    var discountItem = transactionRecord.getFieldValue("discountitem");
                    var hasDiscountGlobal = !!Number(discountItem);

                    nlapiLogExecution("DEBUG", "hasDiscountGlobal", hasDiscountGlobal);

                    var localAmounts = getLocalCurrencyAmounts(transactionRecord, bookInfo);
                    nlapiLogExecution("DEBUG", "localTaxAmount", JSON.stringify(localAmounts));

                    var diffVat = localAmounts.localTaxTotal - standardLinesInfo.vatAmount;
                    nlapiLogExecution("DEBUG", "diffVat", diffVat);

                    var diffSubTotal = localAmounts.localSubTotal - standardLinesInfo.subTotal;
                    nlapiLogExecution("DEBUG", "diffSubTotal", diffSubTotal);

                    diffSubTotal = round2(diffSubTotal);
                    
                    var amountMain = round2(Math.abs(diffVat));
                    if (hasDiscountGlobal) {
                        amountMain = round2(Math.abs(diffVat + diffSubTotal));
                    }
                    nlapiLogExecution("DEBUG", "amountMain", amountMain);

                    var varianceAmt = round2(Math.abs(diffVat));
                    if (varianceAmt) {
                        var entity = transactionRecord.getFieldValue("entity")
                        var account = transactionRecord.getFieldValue("account");
                        var memo = "Reclasificacion - VAT";
                        var lineMain = customLines.addNewLine();

                        if (diffVat > 0) {
                            if (["invoice", "vendorcredit"].indexOf(transactionType) != -1) {
                                lineMain.setDebitAmount(parseFloat(amountMain));
                            } else if (["vendorbill", "creditmemo"].indexOf(transactionType) != -1) {
                                lineMain.setCreditAmount(parseFloat(amountMain));
                            }
                        } else {
                            if (["invoice", "vendorcredit"].indexOf(transactionType) != -1) {
                                lineMain.setCreditAmount(parseFloat(amountMain));
                            } else if (["vendorbill", "creditmemo"].indexOf(transactionType) != -1) {
                                lineMain.setDebitAmount(parseFloat(amountMain));
                            }
                        }

                        lineMain.setAccountId(parseInt(account));
                        lineMain.setMemo(memo);
                        nlapiLogExecution("DEBUG", "entity", entity);
                        
                        

                        if (standardLinesInfo.department && (FEAT_DEPT == "T" || FEAT_DEPT == true)) {
                            lineMain.setDepartmentId(parseInt(standardLinesInfo.department));
                        }


                        if (standardLinesInfo.class_ && (FEAT_CLASS == "T" || FEAT_CLASS == true)) {
                            lineMain.setClassId(parseInt(standardLinesInfo.class_));
                        }

                        if (standardLinesInfo.location && (FEAT_LOC == "T" || FEAT_LOC == true)) {
                            lineMain.setLocationId(parseInt(standardLinesInfo.location));
                        }

                        var lineVat = customLines.addNewLine();

                        if (diffVat > 0) {
                            if (["invoice", "vendorcredit"].indexOf(transactionType) != -1) {
                                lineVat.setCreditAmount(parseFloat(varianceAmt));
                            } else if (["vendorbill", "creditmemo"].indexOf(transactionType) != -1) {
                                lineVat.setDebitAmount(parseFloat(varianceAmt));
                            }
                        } else {
                            if (["invoice", "vendorcredit"].indexOf(transactionType) != -1) {
                                lineVat.setDebitAmount(parseFloat(varianceAmt));
                            } else if (["vendorbill", "creditmemo"].indexOf(transactionType) != -1) {
                                lineVat.setCreditAmount(parseFloat(varianceAmt));
                            }
                        }

                        lineVat.setAccountId(parseInt(standardLinesInfo.vatAccount));
                        lineVat.setMemo(memo);

                        if (setupTax.isEntitySet ==="T" || setupTax.isEntitySet === true) {
                            nlapiLogExecution("DEBUG", "Setear el valor", "entidad seteada");
                            lineVat.setEntityId(parseInt(entity));
                        }
                        

                        if (standardLinesInfo.department && (FEAT_DEPT == "T" || FEAT_DEPT == true)) {
                            lineVat.setDepartmentId(parseInt(standardLinesInfo.department));
                        }

                        if (standardLinesInfo.class_ && (FEAT_CLASS == "T" || FEAT_CLASS == true)) {
                            lineVat.setClassId(parseInt(standardLinesInfo.class_));
                        }

                        if (standardLinesInfo.location && (FEAT_LOC == "T" || FEAT_LOC == true)) {
                            lineVat.setLocationId(parseInt(standardLinesInfo.location));
                        }

                        var varianceSubtotal = Math.abs(diffSubTotal);
                        if(hasDiscountGlobal && varianceSubtotal){
                            var lineDiscount = customLines.addNewLine();

                            if (diffSubTotal < 0) {
                                if (["invoice", "vendorcredit"].indexOf(transactionType) != -1) {
                                    lineDiscount.setDebitAmount(parseFloat(varianceSubtotal));
                                } else if (["vendorbill", "creditmemo"].indexOf(transactionType) != -1) {
                                    lineDiscount.setCreditAmount(parseFloat(varianceSubtotal));
                                }
                            } else {
                                if (["invoice", "vendorcredit"].indexOf(transactionType) != -1) {
                                    lineDiscount.setCreditAmount(parseFloat(varianceSubtotal));
                                } else if (["vendorbill", "creditmemo"].indexOf(transactionType) != -1) {
                                    lineDiscount.setDebitAmount(parseFloat(varianceSubtotal));
                                }
                            }

                            lineDiscount.setAccountId(parseInt(standardLinesInfo.discountAccount));
                            lineDiscount.setMemo(memo);
                            // lineVat.setEntityId(parseInt(vatInfo.entity));
    
                            if (standardLinesInfo.department && (FEAT_DEPT == "T" || FEAT_DEPT == true)) {
                                lineDiscount.setDepartmentId(parseInt(standardLinesInfo.department));
                            }
    
                            if (standardLinesInfo.class_ && (FEAT_CLASS == "T" || FEAT_CLASS == true)) {
                                lineDiscount.setClassId(parseInt(standardLinesInfo.class_));
                            }
    
                            if (standardLinesInfo.location && (FEAT_LOC == "T" || FEAT_LOC == true)) {
                                lineDiscount.setLocationId(parseInt(standardLinesInfo.location));
                            }
                        }
                    }

                }
            }

        }
    } catch (err) {
        nlapiLogExecution("ERROR", "[customizeGlImpact]", err);
        sendemail(' [ customizeGlImpact ] ' + err, "LatamReady - CO VAT Reclass");
    }
}

function getSetupTaxSubsidiary(transactionRecord) {

    var filters = [
        ["isinactive", "is", "F"]
    ];

    if (FEAT_SUBSIDIARY == "T" || FEAT_SUBSIDIARY == true) {
        var subsidiary = transactionRecord.getFieldValue("subsidiary");
        if (subsidiary) {
            filters.push("AND", ["custrecord_lmry_setuptax_subsidiary", "anyof", subsidiary]);
        }
    }

    var columns = [new nlobjSearchColumn("internalid"), new nlobjSearchColumn("custrecord_lmry_setuptax_currency"), new nlobjSearchColumn("custrecord_lmry_setuptax_co_set_name_gl")]

    var searchSetupTaxSubsidiary = nlapiCreateSearch("customrecord_lmry_setup_tax_subsidiary", filters, columns);
    var results = searchSetupTaxSubsidiary.runSearch().getResults(0, 10);
    if (results && results.length) {
        var localCurrency = results[0].getValue("custrecord_lmry_setuptax_currency") || "";
        var isEntitySet = results[0].getValue("custrecord_lmry_setuptax_co_set_name_gl");
        return {
            localCurrency: localCurrency,
            isEntitySet: isEntitySet
        }
    }
    return null;
}

function getBookInfo(transactionRecord, book) {
    if (book.isPrimary()) {
        var subsidiary = transactionRecord.getFieldValue("subsidiary");
        var subsidiaryCurrency = transactionRecord.getFieldValue("primarycurrency") || "";
        subsidiaryCurrency = Number(subsidiaryCurrency);
        nlapiLogExecution("DEBUG", "subsidiaryCurrency", subsidiaryCurrency);
        if (!subsidiaryCurrency) {
            subsidiaryCurrency = nlapiLookupField('subsidiary', subsidiary, ['currency']).currency;
        }

        return {
            exchangeRate: transactionRecord.getFieldValue("exchangerate"),
            currency: subsidiaryCurrency
        }
    } else {
        var numBooks = transactionRecord.getLineItemCount("accountingbookdetail");
        //Se busca el exchange del Libro actual
        for (var i = 1; i <= numBooks; i++) {
            var bookId = transactionRecord.getLineItemValue("accountingbookdetail", "bookid", i);
            var currencyBook = transactionRecord.getLineItemValue("accountingbookdetail", "currency", i);
            var exchangeRate = transactionRecord.getLineItemValue("accountingbookdetail", "exchangerate", i) || 0.00;
            exchangeRate = parseFloat(exchangeRate);

            if (bookId == book.getId()) {
                return {
                    currency: currencyBook,
                    exchangeRate: exchangeRate
                }
            }
        }
    }
}

function getVatLineInfo(standardLines) {
    var vatInfo = null, vatAccount;
    for (var i = 0; i < standardLines.getCount(); i++) {
        var currLine = standardLines.getLine(i);
        var memo = currLine.getMemo() || "";
        memo = memo.trim();
        var account = currLine.getAccountId();
        var amount = currLine.getAmount();
        amount = parseFloat(amount) || 0.00;

        var department = "", class_ = "", location = "";
        if (FEAT_DEPT == true || FEAT_DEPT == "T") {
            department = currLine.getDepartmentId();
        }

        if (FEAT_CLASS == true || FEAT_CLASS == "T") {
            class_ = currLine.getClassId();
        }

        if (FEAT_LOC == true || FEAT_LOC == "T") {
            location = currLine.getLocationId();
        }

        var entity = currLine.getEntityId();
        var isTaxable = currLine.isTaxable();

        if (memo == "VAT" && isTaxable) {
            if (!vatInfo) {
                vatInfo = {
                    amount: 0.00,
                    entity: entity,
                    department: department,
                    "class": class_,
                    location: location
                }
            }

            //si vas a pasarla a compras no te olvides del signo xd
            if (!vatAccount && amount < 0) {
                vatAccount = account;
            }

            vatInfo.amount = round2(vatInfo.amount + amount);
        }
    }

    if (vatInfo) {
        vatInfo.amount = Math.abs(vatInfo.amount);
        vatInfo.account = vatAccount;
    }

    return vatInfo;
}

function getStandardLinesInfo(transactionRecord, standardLines) {
    var discountItem = transactionRecord.getFieldValue("discountitem");
    var hasDiscountGlobal = !!Number(discountItem);
    var arAccount = transactionRecord.getFieldValue("account");
    var transactionType = transactionRecord.getRecordType();

    var standardLinesInfo = {
        vatAccount: null, vatAmount: 0.00, subTotal: 0.00, discountAccount: null, department: null, class_: null, location: null
    };

    for (var i = 0; i < standardLines.getCount(); i++) {
        var currLine = standardLines.getLine(i);
        var memo = currLine.getMemo() || "";
        memo = memo.trim();
        var account = currLine.getAccountId();
        var amount = currLine.getAmount();
        amount = parseFloat(amount) || 0.00;

        var department = "", class_ = "", location = "";
        if (FEAT_DEPT == true || FEAT_DEPT == "T") {
            department = currLine.getDepartmentId();
        }

        if (FEAT_CLASS == true || FEAT_CLASS == "T") {
            class_ = currLine.getClassId();
        }

        if (FEAT_LOC == true || FEAT_LOC == "T") {
            location = currLine.getLocationId();
        }

        if (memo !== "Cost of Sales") {
            if (memo === "VAT") {
                standardLinesInfo.vatAmount = round2(standardLinesInfo.vatAmount + amount);
                if (!standardLinesInfo.vatAccount) {
                    if (transactionType === "invoice" && amount < 0) {
                        standardLinesInfo.vatAccount = account;
                    } else if (transactionType === "creditmemo" && amount > 0) {
                        standardLinesInfo.vatAccount = account;
                    }
                }
                standardLinesInfo.department = department || 0.00;
                standardLinesInfo.class_ = class_ || 0.00;
                standardLinesInfo.location = location || 0.00

            } else {
                if (arAccount != account) { //no linea principal. lineas de items o descuento
                    standardLinesInfo.subTotal = round2(standardLinesInfo.subTotal + amount);

                    if (hasDiscountGlobal) {
                        if (transactionType === "invoice" && amount > 0) {
                            standardLinesInfo.discountAccount = account;
                        } else if (transactionType === "creditmemo" && amount < 0) {
                            standardLinesInfo.discountAccount = account;
                        }
                    }
                }
            }
        }
    }

    standardLinesInfo.vatAmount = Math.abs(standardLinesInfo.vatAmount);
    standardLinesInfo.subTotal = Math.abs(standardLinesInfo.subTotal);

    return standardLinesInfo;
}

function round2(num) {
    var e = (num >= 0) ? 1e-8 : -1e-8;
    return parseFloat(Math.round(parseFloat(num) * 1e2 + e) / 1e2);
}

function round4(num) {
    var e = (num >= 0) ? 1e-6 : -1e-6;
    return parseFloat(Math.round(parseFloat(num) * 1e4 + e) / 1e4);
}

function getLocalCurrencyAmounts(transactionRecord, bookInfo) {
    var discountRate = transactionRecord.getFieldValue("discountrate") || 0.00;
    discountRate = Math.abs(parseFloat(discountRate) / 100);
    nlapiLogExecution("DEBUG", "discountRate", discountRate);
    var numItems = transactionRecord.getLineItemCount("item");
    var taxTotal = 0.00, subTotal = 0.00;

    for (var i = 1; i <= numItems; i++) {
        var amount = transactionRecord.getLineItemValue("item", "amount", i) || 0.00;
        amount = parseFloat(amount) * (1 - discountRate);
        subTotal = subTotal + amount;
        var taxRate = transactionRecord.getLineItemValue("item", "taxrate1", i) || 0.00;
        taxRate = round4(parseFloat(taxRate) / 100);
        var taxAmt = amount * taxRate;
        taxTotal = taxTotal + taxAmt;
    }
    nlapiLogExecution("DEBUG", "taxTotal", taxTotal);

    return {
        localSubTotal: subTotal * bookInfo.exchangeRate,
        localTaxTotal: taxTotal * bookInfo.exchangeRate
    };
}