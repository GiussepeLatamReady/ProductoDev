/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       Ene 2024        LatamReady
 * File : LMRY_CO_WHT_Reclass_PLGN.js
 */
var objContext = nlapiGetContext();

var scriptName = 'LatamReady - CO WHT Reclass PLGN';

var FEAT_SUBSIDIARY = false;
var FEAT_CUSTOMSEGMENTS = false;
var FEAT_DEPT = false;
var FEAT_CLASS = false;
var FEAT_LOC = false;
var FEAT_MULTIBOOK = false;
var FEAT_FOREIGN_CURRENCY = false;
var typeTransactionJson = {
    "CustInvc": "invoice",
    "CustCred": "creditmemo",
    "VendBill": "vendorbill",
    "VendCred": "vendorcredit"
}

function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    try {
        var nexus_country = transactionRecord.getFieldValue("custbody_lmry_subsidiary_country");
        FEAT_SUBSIDIARY = objContext.getFeature('SUBSIDIARIES');
        FEAT_DEPT = objContext.getFeature("departments");
        FEAT_CLASS = objContext.getFeature("classes");
        FEAT_LOC = objContext.getFeature("locations");
        FEAT_MULTIBOOK = objContext.getFeature("MULTIBOOK")
        FEAT_FOREIGN_CURRENCY = objContext.getFeature('foreigncurrencymanagement');
        var transactionType = transactionRecord.getRecordType();
        if (nexus_country == "48" && (FEAT_FOREIGN_CURRENCY == true || FEAT_FOREIGN_CURRENCY == "T") && ["invoice", "creditmemo", "vendorbill", "vendorcredit", "journalentry"].indexOf(transactionType) != -1) {
            var setupTax = getSetupTaxSubsidiary(transactionRecord);
            var currency = transactionRecord.getFieldValue("currency");
            if (currency != setupTax.localCurrency) {
                var bookInfo = getBookInfo(transactionRecord, book);

                if (bookInfo.currency == setupTax.localCurrency) {

                    // Transaccion Origen
                    var dataOrigin = {};
                    var transactionOrigin = transactionRecord.getFieldValue("custbody_lmry_reference_transaction");
                    if (!transactionOrigin) {
                        return true;
                    }

                    var searchTransaction = nlapiLoadSearch("transaction", "customsearch_lmry_wht_reclass");
                    searchTransaction.addFilter(new nlobjSearchFilter("internalid", null, "anyof", transactionOrigin));
                    var results = searchTransaction.runSearch().getResults(0, 1000);
                    if (results && results.length) {
                        dataOrigin["type"] = typeTransactionJson[results[0].getValue("type")];
                        dataOrigin["iva"] = results[0].getValue("custbody_lmry_co_reteiva");
                        dataOrigin["ivaamount"] = results[0].getValue("custbody_lmry_co_reteiva_amount");
                        dataOrigin["ica"] = results[0].getValue("custbody_lmry_co_reteica");
                        dataOrigin["icaamount"] = results[0].getValue("custbody_lmry_co_reteica_amount");
                        dataOrigin["fte"] = results[0].getValue("custbody_lmry_co_retefte");
                        dataOrigin["fteamount"] = results[0].getValue("custbody_lmry_co_retefte_amount");
                        dataOrigin["cree"] = results[0].getValue("custbody_lmry_co_autoretecree");
                        dataOrigin["creeamount"] = results[0].getValue("custbody_lmry_co_retecree_amount");
                        var retentions = results[0].getValue("custbody_lmry_installments_details");
                        dataOrigin["retentions"] = retentions ? JSON.parse(retentions) : [];
                    }
                    var isReverse = (["creditmemo", "vendorcredit", "journalentry"].indexOf(transactionType) != -1 && transactionRecord.getFieldValue("memo").indexOf("Latam - WHT Reverse") != -1);
                    //nlapiLogExecution("DEBUG", "isJournalReverse",isJournalReverse);
                    
                    if (["invoice", "creditmemo"].indexOf(dataOrigin["type"]) == -1 && !isReverse) {
                        return true;
                    }
            
                    var subsidiary = FEAT_SUBSIDIARY ? transactionRecord.getFieldValue("subsidiary") : 1;
                    var licenses = getLicenses(subsidiary);
                    //journal de reversa proceso reclasificacion de retenciones
                    // if (isReverse && (getAuthorization(27, licenses) || getAuthorization(340, licenses) || getAuthorization(720, licenses) || getAuthorization(721, licenses))) {
                    //     if (FEAT_MULTIBOOK == 'T' || FEAT_MULTIBOOK == true) {
                    //         var searchTransaction = nlapiLoadSearch("accountingtransaction", "customsearch_lmry_co_reversalgl_mb");
                    //         searchTransaction.addFilter(new nlobjSearchFilter("internalid", null, "anyof", transactionOrigin));
                    //         searchTransaction.addFilter(new nlobjSearchFilter("accountingbook", null, "anyof", book));
                    //         var results = searchTransaction.runSearch().getResults(0, 1000);
                    //         nlapiLogExecution("DEBUG", "IS REVERSAL", isReverse);
                    //         addLinesForJournalReverse(customLines, results);
                    //     }else{
                    //         var searchTransaction = nlapiLoadSearch("transaction", "customsearch_lmry_co_reversalgl");
                    //         searchTransaction.addFilter(new nlobjSearchFilter("internalid", null, "anyof", transactionOrigin));
                    //         var results = searchTransaction.runSearch().getResults(0, 1000);
                    //         nlapiLogExecution("DEBUG", "IS REVERSAL", isReverse);
                    //         addLinesForJournalReverse(customLines, results);
                    //     }
                        
                    //     return true;
                    // }
                    // retenciones cabecera
                    if (getAuthorization(27, licenses)) {
                        createCabecera(dataOrigin, setupTax, bookInfo, transactionRecord, standardLines, customLines, book);
                    }
                    // retenciones lineas
                    if (getAuthorization(340, licenses)) {
                        createLines(dataOrigin, setupTax, bookInfo, transactionRecord, standardLines, customLines, book);
                    }
                    // retenciones lineas v2 purchase
                    if (getAuthorization(720, licenses) && ["vendorbill", "vendorcredit"].indexOf(dataOrigin.type) != -1) {
                        createLines(dataOrigin, setupTax, bookInfo, transactionRecord, standardLines, customLines, book);
                    }
                    // retenciones lineas v2 sales
                    if (getAuthorization(721, licenses) && ["invoice", "creditmemo"].indexOf(dataOrigin.type) != -1) {
                        createLines(dataOrigin, setupTax, bookInfo, transactionRecord, standardLines, customLines, book);
                    }

                }
            }

        }
    } catch (err) {
        nlapiLogExecution("ERROR", "[customizeGlImpact]", err);
    }
}

function createCabecera(dataOrigin, setupTax, bookInfo, transactionRecord, standardLines, customLines, book) {
    var whtData = getWhtData(dataOrigin);
    nlapiLogExecution("DEBUG", "whtData", JSON.stringify(whtData));
    var whtAmount = 0;
    var memo = transactionRecord.getFieldValue("memo");
    var element = {};
    if (dataOrigin.retentions && dataOrigin.retentions.length) {
        element = dataOrigin.retentions[dataOrigin.retentions.length - 1];
    }
    nlapiLogExecution("DEBUG", "element", JSON.stringify(element));
    nlapiLogExecution("DEBUG", "memo", memo);
    if(memo.indexOf(" RE WHT ")!=-1)return true;
    for (var i = 0; i < whtData.length; i++) {
        if (memo.indexOf(whtData[i].name) != -1) {
            whtAmount = element[whtData[i].wht].amount;
            break;
        }
    }
    nlapiLogExecution("DEBUG", "whtAmount", whtAmount);
    if (!whtAmount) return true;
    var glData = getGlCabecera(standardLines);
    var difference = Number(whtAmount) - Number(glData.amount);
    nlapiLogExecution("DEBUG", "[glData]", JSON.stringify(glData));
    addCustomLines(glData, difference, customLines, dataOrigin);

}

function addCustomLines(glData, difference, customLines, dataOrigin) {
    var memo = "Reclasificacion - WHT";

    // Credit Line
    var lineCredit = customLines.addNewLine();
    lineCredit.setAccountId(parseInt(glData.data.credit.account));
    lineCredit.setMemo(memo);
    if (difference < 0) {
        lineCredit.setDebitAmount(Math.abs(parseFloat(difference)));
    } else {
        lineCredit.setCreditAmount(Math.abs(parseFloat(difference)));
    }
    if (glData.data.credit.department && (FEAT_DEPT == "T" || FEAT_DEPT == true)) {
        lineCredit.setDepartmentId(parseInt(glData.data.credit.department));
    }
    if (glData.data.credit.class && (FEAT_CLASS == "T" || FEAT_CLASS == true)) {
        lineCredit.setClassId(parseInt(glData.data.credit.class));
    }
    if (glData.data.credit.location && (FEAT_LOC == "T" || FEAT_LOC == true)) {
        lineCredit.setLocationId(parseInt(glData.data.credit.location));
    }

    // Debit Line
    var lineDebit = customLines.addNewLine();
    lineDebit.setAccountId(parseInt(glData.data.debit.account));
    lineDebit.setMemo(memo);
    if (difference < 0) {
        lineDebit.setCreditAmount(Math.abs(parseFloat(difference)));
    } else {
        lineDebit.setDebitAmount(Math.abs(parseFloat(difference)));
    }
    
    if (glData.data.debit.department && (FEAT_DEPT == "T" || FEAT_DEPT == true)) {
        lineDebit.setDepartmentId(parseInt(glData.data.debit.department));
    }
    if (glData.data.debit.class && (FEAT_CLASS == "T" || FEAT_CLASS == true)) {
        lineDebit.setClassId(parseInt(glData.data.debit.class));
    }
    if (glData.data.debit.location && (FEAT_LOC == "T" || FEAT_LOC == true)) {
        lineDebit.setLocationId(parseInt(glData.data.debit.location));
    }
}

function getWhtData(dataOrigin) {
    var whtData = [];
    var whts = [];

    var element = {};
    if (dataOrigin.retentions && dataOrigin.retentions.length) {
        element = dataOrigin.retentions[dataOrigin.retentions.length - 1];
        if (element["ICA"]) whts.push(element["ICA"].id);
        if (element["IVA"]) whts.push(element["IVA"].id);
        if (element["FTE"]) whts.push(element["FTE"].id);
        if (element["CREE"]) whts.push(element["CREE"].id);

    }
    /*if (dataOrigin.iva) whts.push(dataOrigin.iva);
    if (dataOrigin.ica) whts.push(dataOrigin.ica);
    if (dataOrigin.fte) whts.push(dataOrigin.fte);
    if (dataOrigin.cree) whts.push(dataOrigin.cree);*/

    if (!whts.length) return {};

    var filters = [
        ["isinactive", "is", "F"], "AND",
        ["internalid", "anyof", whts]
    ];
    var columns = [
        new nlobjSearchColumn("internalid"),
        new nlobjSearchColumn("name"),
        new nlobjSearchColumn("custrecord_lmry_wht_coderate")
    ];
    var searchWhtCode = nlapiCreateSearch("customrecord_lmry_wht_code", filters, columns);
    var results = searchWhtCode.runSearch().getResults(0, 10);
    if (results && results.length) {
        for (var i = 0; i < results.length; i++) {
            var whtLine = {};
            whtLine["id"] = results[i].getValue("internalid");
            whtLine["name"] = results[i].getValue("name");
            whtLine["rate"] = results[i].getValue("custrecord_lmry_wht_coderate");
            if (element["ICA"] && element["ICA"].id == whtLine["id"]) whtLine["wht"] = "ICA";
            if (element["IVA"] && element["IVA"].id == whtLine["id"]) whtLine["wht"] = "IVA";
            if (element["FTE"] && element["FTE"].id == whtLine["id"]) whtLine["wht"] = "FTE";
            if (element["CREE"] && element["CREE"].id == whtLine["id"]) whtLine["wht"] = "CREE";
            whtData.push(whtLine);
        }
    }
    return whtData;
}

function createLines(dataOrigin, setupTax, bookInfo, transactionRecord, standardLines, customLines, book) {
    var taxResults = getTaxResults(transactionRecord);
    if (!taxResults.length) taxResults = getJSONResults(transactionRecord);
    nlapiLogExecution("DEBUG", "taxResults", JSON.stringify(taxResults));
    var transactionType = transactionRecord.getRecordType();
    if (transactionType == "journalentry") {
        var glData = getGlLinesJournal(standardLines);
        nlapiLogExecution("DEBUG", "glData", JSON.stringify(glData));
        addCustomLinesJournal(taxResults, glData, customLines, dataOrigin);
    } else {
        var glData = getGlLinesCredit(standardLines);
        nlapiLogExecution("DEBUG", "glData", JSON.stringify(glData));
        addCustomLinesCredit(taxResults, glData, customLines, dataOrigin);
    }
}

function getTaxResults(transactionRecord) {
    var taxResults = [];

    var idTransaction = transactionRecord.getFieldValue("custbody_lmry_reference_transaction");
    var filters = [
        ["isinactive", "is", "F"], "AND",
        ["custrecord_lmry_br_transaction", "is", idTransaction]
    ];

    var columns = [
        new nlobjSearchColumn("internalid").setSort(true),
        new nlobjSearchColumn("custrecord_lmry_br_type"),
        new nlobjSearchColumn("custrecord_lmry_ccl"),
        new nlobjSearchColumn("custrecord_lmry_ntax"),
        new nlobjSearchColumn("custrecord_lmry_amount_local_currency"),
        new nlobjSearchColumn("custrecord_lmry_lineuniquekey")
    ]

    var searchTaxResults = nlapiCreateSearch("customrecord_lmry_br_transaction", filters, columns);
    var results = searchTaxResults.runSearch().getResults(0, 1000);
    if (results && results.length) {
        for (var i = 0; i < results.length; i++) {
            var cc = results[i].getValue("custrecord_lmry_ccl");
            var nt = results[i].getValue("custrecord_lmry_ntax");
            var code = cc ? "CC " + cc : "NT " + nt;
            var taxResultData = {
                id: results[i].getValue("internalid"),
                subtype: results[i].getValue("custrecord_lmry_br_type"),
                code: code,
                lineuniquekey: results[i].getValue("custrecord_lmry_lineuniquekey"),
                amount: results[i].getValue("custrecord_lmry_amount_local_currency")
            };
            taxResults.push(taxResultData);
        }
    }
    return taxResults;
}

function getJSONResults(transactionRecord) {
    var taxResults = [];

    var idTransaction = transactionRecord.getFieldValue("custbody_lmry_reference_transaction");
    var filters = [
        ["isinactive", "is", "F"], "AND",
        ["custrecord_lmry_ste_related_transaction", "is", idTransaction]
    ];

    var columns = [
        new nlobjSearchColumn("internalid"),
        new nlobjSearchColumn("custrecord_lmry_ste_wht_transaction")
    ]

    var searchTaxResults = nlapiCreateSearch("customrecord_lmry_ste_json_result", filters, columns);
    var resultSearch = searchTaxResults.runSearch().getResults(0, 1);
    if (resultSearch && resultSearch.length) {
        var whts = resultSearch[0].getValue("custrecord_lmry_ste_wht_transaction");
        var idJson = resultSearch[0].getValue("internalid");
        var results = whts ? JSON.parse(whts) : [];
        for (var i = 0; i < results.length; i++) {
            var cc = results[i].contributoryClass;
            var nt = results[i].nationalTax;
            var code = cc ? "CC " + cc : "NT " + nt;
            var taxResultData = {
                id: idJson,
                subtype: results[i].subType.value,
                code: code,
                lineuniquekey: results[i].lineUniqueKey,
                amount: results[i].lc_whtAmount
            };
            taxResults.push(taxResultData);
        }
    }
    return taxResults;
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

    var columns = [new nlobjSearchColumn("internalid"), new nlobjSearchColumn("custrecord_lmry_setuptax_currency")]

    var searchSetupTaxSubsidiary = nlapiCreateSearch("customrecord_lmry_setup_tax_subsidiary", filters, columns);
    var results = searchSetupTaxSubsidiary.runSearch().getResults(0, 10);
    if (results && results.length) {
        var localCurrency = results[0].getValue("custrecord_lmry_setuptax_currency") || "";
        return {
            localCurrency: localCurrency
        }
    }
    return null;
}

function getBookInfo(transactionRecord, book) {
    if (book.isPrimary()) {

        var subsidiary = transactionRecord.getFieldValue("subsidiary");
        var subsidiaryCurrency = nlapiLookupField('subsidiary', subsidiary, ['currency']).currency;

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

function getGlCabecera(standardLines) {
    var lines = { "data": {}, "amount": 0 };

    for (var i = 0; i < standardLines.getCount(); i++) {
        var currLine = standardLines.getLine(i);
        var account = currLine.getAccountId();
        var amount = currLine.getAmount();
        amount = parseFloat(amount) || 0.00;

        if (!Number(amount)) continue;

        lines.amount = Math.abs(amount);
        var order = amount > 0 ? "debit" : "credit";
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

        lines.data[order] = {
            account: account,
            amount: amount,
            entity: entity,
            department: department,
            "class": class_,
            location: location
        };

    }

    return lines;
}

function getGlLinesCredit(standardLines) {
    var lines = { "main": {}, "lines": [] };
    var isMain = true;
    var orderMain = "";

    for (var i = 0; i < standardLines.getCount(); i++) {
        var currLine = standardLines.getLine(i);
        var account = currLine.getAccountId();
        var amount = currLine.getAmount();
        amount = parseFloat(amount) || 0.00;

        if (!Number(amount)) continue;

        var memo = currLine.getMemo();
        var order = amount > 0 ? "debit" : "credit";
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
        if (isMain) {
            lines.main.account = account;
            lines.main.amount = Math.abs(amount);
            lines.main.entity = entity;
            lines.main.department = department;
            lines.main.class = class_;
            lines.main.location = location;
            lines.main.order = order;
            lines.main.memo = memo;
            orderMain = order;
            isMain = false;
        } else {
            lines.lines.push({
                account: account,
                amount: orderMain == order ? Math.abs(amount) * -1 : Math.abs(amount),
                entity: entity,
                department: department,
                "class": class_,
                location: location,
                order: order,
                memo: memo
            });
        }


    }

    return lines;
}

function getGlLinesJournal(standardLines) {
    var lines = [];

    for (var i = 0; i < standardLines.getCount(); i += 2) {
        var currLine = standardLines.getLine(i);
        var currLine2 = standardLines.getLine(i + 1);
        var account = currLine.getAccountId();
        var account2 = currLine2.getAccountId();
        var amount = currLine.getAmount();
        amount = parseFloat(amount) || 0.00;
        var amount2 = currLine2.getAmount();
        amount2 = parseFloat(amount2) || 0.00;

        if (!Number(amount) || !Number(amount2)) continue;

        var memo = currLine.getMemo();
        var memo2 = currLine2.getMemo();
        var order = amount > 0 ? "debit" : "credit";
        var order2 = amount2 > 0 ? "debit" : "credit";
        var department = "", class_ = "", location = "";
        var department2 = "", class_2 = "", location2 = "";
        if (FEAT_DEPT == true || FEAT_DEPT == "T") {
            department = currLine.getDepartmentId();
            department2 = currLine2.getDepartmentId();
        }

        if (FEAT_CLASS == true || FEAT_CLASS == "T") {
            class_ = currLine.getClassId();
            class_2 = currLine2.getClassId();
        }

        if (FEAT_LOC == true || FEAT_LOC == "T") {
            location = currLine.getLocationId();
            location2 = currLine2.getLocationId();
        }

        var entity = currLine.getEntityId();
        var entity2 = currLine2.getEntityId();

        lines.push({
            account: account,
            amount: Math.abs(amount),
            entity: entity,
            department: department,
            "class": class_,
            location: location,
            order: order,
            memo: memo
        }, {
            account: account2,
            amount: Math.abs(amount2),
            entity: entity2,
            department: department2,
            "class": class_2,
            location: location2,
            order: order2,
            memo: memo2
        });

    }

    return lines;
}

function addCustomLinesCredit(taxResults, glData, customLines, dataOrigin) {
    var memo = "Reclasificacion - WHT";

    for (var i = 0; i < glData.lines.length; i++) {
        var glMemo = glData.lines[i].memo;
        var taxResult = matchTaxResult(taxResults, glMemo);
        if(!Object.keys(taxResult).length)continue;
        nlapiLogExecution("DEBUG", "taxResult " + i, JSON.stringify(taxResult));
        var glAmount = glData.lines[i].amount;
        var glOrder = glData.lines[i].order;
        var taxResultamount = round2(taxResult.amount);

        var difference = Number(taxResultamount) - Number(glAmount);
        nlapiLogExecution("DEBUG", "difference", difference);
        if (difference == 0) continue;

        // WHT Line
        var lineCredit = customLines.addNewLine();
        lineCredit.setAccountId(parseInt(glData.lines[i].account));
        lineCredit.setMemo(memo + " " + taxResult.lineuniquekey);
        if (["creditmemo", "vendorbill"].indexOf(dataOrigin.type) != -1) {
            if (difference < 0) {
                lineCredit.setDebitAmount(Math.abs(parseFloat(difference)));
            } else {
                lineCredit.setCreditAmount(Math.abs(parseFloat(difference)));
            }
        } else {
            if (difference < 0) {
                lineCredit.setCreditAmount(Math.abs(parseFloat(difference)));
            } else {
                lineCredit.setDebitAmount(Math.abs(parseFloat(difference)));
            }
        }
        if (glData.lines[i].department && (FEAT_DEPT == "T" || FEAT_DEPT == true)) {
            lineCredit.setDepartmentId(parseInt(glData.lines[i].department));
        }
        if (glData.lines[i].class && (FEAT_CLASS == "T" || FEAT_CLASS == true)) {
            lineCredit.setClassId(parseInt(glData.lines[i].class));
        }
        if (glData.lines[i].location && (FEAT_LOC == "T" || FEAT_LOC == true)) {
            lineCredit.setLocationId(parseInt(glData.lines[i].location));
        }

        // Main Line
        var lineDebit = customLines.addNewLine();
        lineDebit.setAccountId(parseInt(glData.main.account));
        lineDebit.setMemo(memo + " " + taxResult.lineuniquekey);
        if (["creditmemo", "vendorbill"].indexOf(dataOrigin.type) != -1) {
            if (difference < 0) {
                lineDebit.setCreditAmount(Math.abs(parseFloat(difference)));
            } else {
                lineDebit.setDebitAmount(Math.abs(parseFloat(difference)));
            }
        } else {
            if (difference < 0) {
                lineDebit.setDebitAmount(Math.abs(parseFloat(difference)));
            } else {
                lineDebit.setCreditAmount(Math.abs(parseFloat(difference)));
            }
        }
        if (glData.main.department && (FEAT_DEPT == "T" || FEAT_DEPT == true)) {
            lineDebit.setDepartmentId(parseInt(glData.main.department));
        }
        if (glData.main.class && (FEAT_CLASS == "T" || FEAT_CLASS == true)) {
            lineDebit.setClassId(parseInt(glData.main.class));
        }
        if (glData.main.location && (FEAT_LOC == "T" || FEAT_LOC == true)) {
            lineDebit.setLocationId(parseInt(glData.main.location));
        }
    }

}

function addCustomLinesJournal(taxResults, glData, customLines, dataOrigin) {
    var memo = "Reclasificacion - WHT";

    for (var i = 0; i < glData.length; i += 2) {
        var glMemo = glData[i].memo;
        var taxResult = matchTaxResult(taxResults, glMemo);
        if(!Object.keys(taxResult).length)continue;
        var glAmount = glData[i].amount;
        var glOrder = glData[i].order;
        var taxResultamount = round2(taxResult.amount);
        if (taxResultamount < 0) glAmount *= -1;
        nlapiLogExecution("DEBUG", "taxResult", JSON.stringify(taxResult));

        nlapiLogExecution("DEBUG", "difference1", taxResultamount);
        nlapiLogExecution("DEBUG", "difference2", glAmount);

        var difference = Number(taxResultamount) - Number(glAmount);
        nlapiLogExecution("DEBUG", "difference", difference);
        if (difference == 0) continue;

        // WHT Line
        var lineCredit = customLines.addNewLine();
        lineCredit.setAccountId(parseInt(glData[i].account));
        lineCredit.setMemo(memo + " " + taxResult.lineuniquekey);
        /*if (glOrder == "credit") {
            if (difference < 0) {
                lineCredit.setDebitAmount(Math.abs(parseFloat(difference)));
            } else {
                lineCredit.setCreditAmount(Math.abs(parseFloat(difference)));
            }
        } else {*/
            if (difference < 0) {
                lineCredit.setCreditAmount(Math.abs(parseFloat(difference)));
            } else {
                lineCredit.setDebitAmount(Math.abs(parseFloat(difference)));
            }
        //}
        if (glData[i].department && (FEAT_DEPT == "T" || FEAT_DEPT == true)) {
            lineCredit.setDepartmentId(parseInt(glData[i].department));
        }
        if (glData[i].class && (FEAT_CLASS == "T" || FEAT_CLASS == true)) {
            lineCredit.setClassId(parseInt(glData[i].class));
        }
        if (glData[i].location && (FEAT_LOC == "T" || FEAT_LOC == true)) {
            lineCredit.setLocationId(parseInt(glData[i].location));
        }

        // Main Line
        var lineDebit = customLines.addNewLine();
        lineDebit.setAccountId(parseInt(glData[i + 1].account));
        lineDebit.setMemo(memo + " " + taxResult.lineuniquekey);
        /*if (glOrder == "credit") {
            if (difference < 0) {
                lineDebit.setCreditAmount(Math.abs(parseFloat(difference)));
            } else {
                lineDebit.setDebitAmount(Math.abs(parseFloat(difference)));
            }
        } else {*/
            if (difference < 0) {
                lineDebit.setDebitAmount(Math.abs(parseFloat(difference)));
            } else {
                lineDebit.setCreditAmount(Math.abs(parseFloat(difference)));
            }
        //}
        if (glData[i + 1].department && (FEAT_DEPT == "T" || FEAT_DEPT == true)) {
            lineDebit.setDepartmentId(parseInt(glData[i + 1].department));
        }
        if (glData[i + 1].class && (FEAT_CLASS == "T" || FEAT_CLASS == true)) {
            lineDebit.setClassId(parseInt(glData[i + 1].class));
        }
        if (glData[i + 1].location && (FEAT_LOC == "T" || FEAT_LOC == true)) {
            lineDebit.setLocationId(parseInt(glData[i + 1].location));
        }
    }

}

function matchTaxResult(taxResults, glMemo) {
    var returnTaxResult = {};
    for (var i = 0; i < taxResults.length; i++) {
        if (glMemo.indexOf(taxResults[i].code) != -1) {
            if (glMemo.indexOf(taxResults[i].lineuniquekey) != -1) {
                returnTaxResult = taxResults[i];
                break;
            }
        }
    }
    return returnTaxResult;
}

function round2(num) {
    var e = (num >= 0) ? 1e-6 : -1e-6;
    return parseFloat(Math.round(parseFloat(num) * 1e2 + e) / 1e2);
}

function round4(num) {
    var e = (num >= 0) ? 1e-6 : -1e-6;
    return parseFloat(Math.round(parseFloat(num) * 1e4 + e) / 1e4);
}

function calculateLocalCurrencyTaxAmount(transactionRecord, bookInfo) {
    var numItems = transactionRecord.getLineItemCount("item");
    var taxTotal = 0.00;

    for (var i = 1; i <= numItems; i++) {
        var amount = transactionRecord.getLineItemValue("item", "amount", i) || 0.00;
        amount = parseFloat(amount);
        var taxRate = transactionRecord.getLineItemValue("item", "taxrate1", i) || 0.00;
        taxRate = round4(parseFloat(taxRate) / 100);

        taxTotal = taxTotal + (amount * taxRate);
    }
    nlapiLogExecution("DEBUG", "taxTotal", taxTotal);

    return taxTotal * bookInfo.exchangeRate;
}

// function addLinesForJournalReverse(customLines, customLinesInfo){
//     var memo = "Reclasificacion - WHT";
//     if (FEAT_MULTIBOOK == 'T' || FEAT_MULTIBOOK == true) {
//         for (var _i = 0; _i < customLinesInfo.length; _i++) {
//             var customLineInfo = customLinesInfo[_i];
//             var lineReversa = customLines.addNewLine();
//             lineReversa.setAccountId(parseInt(customLineInfo.getValue("account")));
//             lineReversa.setMemo(memo);
//             if (Number(customLineInfo.getValue("debitamount"))) {
//                 lineReversa.setCreditAmount(Math.abs(Number(customLineInfo.getValue("debitamount"))));
//             }
//             if (Number(customLineInfo.getValue("creditamount"))) {
//                 lineReversa.setDebitAmount(Math.abs(Number(customLineInfo.getValue("creditamount"))));
//             }
            
//             if (customLineInfo.getValue("department","transaction") && (FEAT_DEPT == "T" || FEAT_DEPT == true)) {
//                 lineReversa.setDepartmentId(parseInt(customLineInfo.getValue("department","transaction")));
//             }
//             if (customLineInfo.getValue("class","transaction") && (FEAT_CLASS == "T" || FEAT_CLASS == true)) {
//                 lineReversa.setClassId(parseInt(customLineInfo.getValue("class","transaction")));
//             }
//             if (customLineInfo.getValue("location","transaction") && (FEAT_LOC == "T" || FEAT_LOC == true)) {
//                 lineReversa.setLocationId(parseInt(customLineInfo.getValue("location","transaction")));
//             }
//         }
//     } else {
//         for (var _i = 0; _i < customLinesInfo.length; _i++) {
//             var customLineInfo = customLinesInfo[_i];
//             var lineReversa = customLines.addNewLine();
//             lineReversa.setAccountId(parseInt(customLineInfo.getValue("account")));
//             lineReversa.setMemo(memo);
//             if (Number(customLineInfo.getValue("debitamount"))) {
//                 lineReversa.setCreditAmount(Math.abs(Number(customLineInfo.getValue("debitamount"))));
//             }
//             if (Number(customLineInfo.getValue("creditamount"))) {
//                 lineReversa.setDebitAmount(Math.abs(Number(customLineInfo.getValue("creditamount"))));
//             }
            
//             if (customLineInfo.getValue("department") && (FEAT_DEPT == "T" || FEAT_DEPT == true)) {
//                 lineReversa.setDepartmentId(parseInt(customLineInfo.getValue("department")));
//             }
//             if (customLineInfo.getValue("class") && (FEAT_CLASS == "T" || FEAT_CLASS == true)) {
//                 lineReversa.setClassId(parseInt(customLineInfo.getValue("class")));
//             }
//             if (customLineInfo.getValue("location") && (FEAT_LOC == "T" || FEAT_LOC == true)) {
//                 lineReversa.setLocationId(parseInt(customLineInfo.getValue("location")));
//             }
//         }
//     }  
// }