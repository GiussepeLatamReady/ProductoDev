/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       Ene 2024        LatamReady
 * File : LMRY_CO_WHT_Reclass_PLGN.js
 */
var objContext = nlapiGetContext();

var scriptName = 'LR - CO Set Entity';

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
        var nexus_country = transactionRecord.getFieldValue("entity");
        

        
    } catch (err) {
        nlapiLogExecution("ERROR", "[customizeGlImpact]", err);
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