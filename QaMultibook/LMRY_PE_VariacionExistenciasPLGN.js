/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       19 Nov 2019     LatamReady
 * File : LMRY_PE_VariacionExistenciasPLGN.js
 */
var objContext = nlapiGetContext();
var FEAT_SUBSI = objContext.getFeature('SUBSIDIARIES');
var FEAT_MULTIBOOK = objContext.getFeature('MULTIBOOK');
var FEAT_DEPT = objContext.getFeature("departments");
var FEAT_CLASS = objContext.getFeature("classes");
var FEAT_LOC = objContext.getFeature("locations");
var DEPTSPERLINE = objContext.getPreference('DEPTSPERLINE');
var CLASSESPERLINE = objContext.getPreference('CLASSESPERLINE');


var LMRY_script = 'LMRY_PE_VariacionExistenciasPLGN.js';


function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    try {

        var country = transactionRecord.getFieldValue("custbody_lmry_subsidiary_country");
        country = Number(country);
        if (country == 174) {//Peru
            nlapiLogExecution("DEBUG", "bookId", book.getId());
            var type = transactionRecord.getRecordType();
            nlapiLogExecution("DEBUG", "typeTransaction", type);

            var licenses = getLicenses(transactionRecord.getFieldValue('subsidiary'));
            //FEATURE 415: PE - VARIACIÓN EXISTENCIAS (SUITE GL)
            if (getAuthorization(415, licenses) != true) {
                return;
            }

            var createdFrom = transactionRecord.getFieldValue('createdfrom');
            nlapiLogExecution('ERROR', 'createdFrom', createdFrom);
            // CREADO DESDE UN VENDOR RETURN AUTHORIZATION
            if (["vendorcredit", "itemfulfillment", "itemreceipt"].indexOf(type) != -1 && !Number(createdFrom)) {
                return;
            }

            if (type == 'vendorcredit' || type == 'itemfulfillment') {
                var typeFrom = nlapiLookupField('vendorreturnauthorization', createdFrom, ['type']);
                nlapiLogExecution("DEBUG", "typefrom", typeFrom);

                if (!typeFrom) {
                    return;
                }
            }

            if (type == 'vendorbill' || type == 'vendorcredit') {
                var hasPOs = false;
                var numItems = transactionRecord.getLineItemCount("item");
                for (var i = 1; i <= numItems; i++) {
                    //Para comprobar que los items del Vendor Bill O Bill Credit proviene del Purchase Order
                    var generateAccruals = transactionRecord.getLineItemValue("item", "generateaccruals", i);
                    nlapiLogExecution("DEBUG", "generateAccruals", generateAccruals);
                    if (generateAccruals == true || generateAccruals == "T") {
                        hasPOs = true;
                        break;
                    }
                }

                if (!hasPOs) {
                    return;
                }
            }

            var subsidiaryAccounts = {};

            if (FEAT_SUBSI == true || FEAT_SUBSI == "T") {
                var subsidiary = transactionRecord.getFieldValue("subsidiary");
                var result = nlapiLookupField('subsidiary', subsidiary, ['custrecord_lmry_pe_cuenta_compras', 'custrecord_lmry_pe_cuenta_variacion_exis', 'custrecord_lmry_pe_cuenta_defecto_compra', 'custrecord_lmry_pe_cuenta_defecto_devolu', 'custrecord_lmry_pe_cuenta_fact_noemitida']);
                subsidiaryAccounts.compras = result.custrecord_lmry_pe_cuenta_compras || "";
                subsidiaryAccounts.variacionExistencias = result.custrecord_lmry_pe_cuenta_variacion_exis || "";
                subsidiaryAccounts.defaultCompra = result.custrecord_lmry_pe_cuenta_defecto_compra || "";
                subsidiaryAccounts.defaultDevolucion = result.custrecord_lmry_pe_cuenta_defecto_devolu || "";
                subsidiaryAccounts.facturaNoEmitida = result.custrecord_lmry_pe_cuenta_fact_noemitida || "";
            } else {
                //load Netsuite configuration page
                var companyInfo = nlapiLoadConfiguration('companyinformation');
                subsidiaryAccounts.compras = companyInfo.getFieldValue('custrecord_lmry_pe_cuenta_compras');
                subsidiaryAccounts.variacionExistencias = companyInfo.getFieldValue('custrecord_lmry_pe_cuenta_variacion_exis');
                subsidiaryAccounts.defaultCompra = companyInfo.getFieldValue('custrecord_lmry_pe_cuenta_defecto_compra');
                subsidiaryAccounts.defaultDevolucion = companyInfo.getFieldValue('custrecord_lmry_pe_cuenta_defecto_devolu');
                subsidiaryAccounts.facturaNoEmitida = companyInfo.getFieldValue('custrecord_lmry_pe_cuenta_fact_noemitida');
            }

            nlapiLogExecution("DEBUG", "subsidiaryAccounts", JSON.stringify(subsidiaryAccounts));

            var items = {}, lines = [];
            var numItems = transactionRecord.getLineItemCount("item");
            if (type == "vendorbill" || type == "vendorcredit") {
                for (var i = 1; i <= numItems; i++) {
                    //Para comprobar que los items del Vendor Bill O Bill Credit proviene del Purchase Order
                    var generateAccruals = transactionRecord.getLineItemValue("item", "generateaccruals", i);
                    if (generateAccruals == true || generateAccruals == "T") {
                        var itemId = transactionRecord.getLineItemValue("item", "item", i);
                        var amount = transactionRecord.getLineItemValue("item", "amount", i) || 0.00;
                        amount = parseFloat(amount);

                        var itemType = transactionRecord.getLineItemValue("item", "itemtype", i);
                        var department = transactionRecord.getLineItemValue("item", "department", i) || "";
                        var class_ = transactionRecord.getLineItemValue("item", "class", i) || "";
                        var location = transactionRecord.getLineItemValue("item", "location", i) || "";
                        if (!items.hasOwnProperty(itemId)) {
                            items[itemId] = {};
                        }

                        if (amount && (itemType == "InvtPart" || itemType == "Assembly")) {
                            lines.push({
                                itemId: itemId,
                                amount: amount,
                                itemType: itemType,
                                department: department,
                                class_: class_,
                                location: location
                            });
                        }
                    }
                }
            } else if (type == "itemreceipt" || type == "itemfulfillment") {
                for (var i = 1; i <= numItems; i++) {
                    var itemId = transactionRecord.getLineItemValue("item", "item", i);
                    var quantity = transactionRecord.getLineItemValue("item", "quantity", i) || 0.00;
                    quantity = parseFloat(quantity);
                    var rate = transactionRecord.getLineItemValue("item", "rate", i) || 0.00;
                    rate = parseFloat(rate);
                    var amount = round2(quantity * rate);
                    var itemType = transactionRecord.getLineItemValue("item", "itemtype", i);
                    var department = transactionRecord.getLineItemValue("item", "department", i) || "";
                    var class_ = transactionRecord.getLineItemValue("item", "class", i) || "";
                    var location = transactionRecord.getLineItemValue("item", "location", i) || "";

                    if (!items.hasOwnProperty(itemId)) {
                        items[itemId] = {};
                    }

                    if (amount && (itemType == "InvtPart" || itemType == "Assembly")) {
                        lines.push({
                            itemId: itemId,
                            amount: amount,
                            itemType: itemType,
                            department: department,
                            class_: class_,
                            location: location
                        });
                    }
                }
            }

            nlapiLogExecution("DEBUG", "lines", JSON.stringify(lines));

            setAccountItems(items);
            nlapiLogExecution("DEBUG", "items", JSON.stringify(items));
            var exchangeRate = getExchangeRate(transactionRecord, book);
            nlapiLogExecution("DEBUG", "exchangeRate", exchangeRate);

            var accounts69Array = [];

            var defaultAccount = "";
            if (type == "vendorbill" || type == "itemreceipt") {
                defaultAccount = subsidiaryAccounts.defaultCompra || "";
            } else if (type == "vendorcredit" || type == "itemfulfillment") {
                defaultAccount = subsidiaryAccounts.defaultDevolucion || "";
            }

            defaultAccount = Number(defaultAccount);


            if (type == "vendorbill" || type == "vendorcredit") {
                var factNoEmitAccount = subsidiaryAccounts.facturaNoEmitida || "";
                factNoEmitAccount = Number(factNoEmitAccount);
                nlapiLogExecution("DEBUG", "defaultAccount, factNoEmitAccount", [defaultAccount, factNoEmitAccount].join("-"));

                if (defaultAccount) {
                    for (var i = 0; i < lines.length; i++) {
                        var itemId = lines[i].itemId;
                        var amount = lines[i].amount || 0.00;
                        if (exchangeRate != 1) {
                            amount = amount * exchangeRate;
                        }
                        amount = round2(amount);

                        var department = lines[i].department || "";
                        department = Number(department);
                        var class_ = lines[i].class_ || "";
                        class_ = Number(class_);
                        var location = lines[i].location || "";
                        location = Number(location);
                        //Si no esta configurada en la subsidiaria, se toma del item
                        if (!factNoEmitAccount && items.hasOwnProperty(itemId)) {
                            factNoEmitAccount = items[itemId].cuentaFactNoEmit || "";
                            factNoEmitAccount = Number(factNoEmitAccount);
                        }

                        //Valores para Espejo 6-9
                        var lineDebit = {
                            book: book.getId(),
                            department: department || "",
                            "class": class_ || "",
                            location: location || "",
                            amount: amount,
                            memo: "Espejo 6-9"
                        };

                        var lineCredit = JSON.parse(JSON.stringify(lineDebit));
                        lineDebit.columna = "debit";
                        lineCredit.columna = "credit";

                        if (amount && factNoEmitAccount) {
                            var newDebitLine = customLines.addNewLine();
                            var newCreditLine = customLines.addNewLine();

                            newDebitLine.setDebitAmount(parseFloat(amount));
                            newCreditLine.setCreditAmount(parseFloat(amount));

                            if (type == "vendorbill") {
                                newDebitLine.setAccountId(factNoEmitAccount);
                                newCreditLine.setAccountId(defaultAccount);

                                lineDebit.account = factNoEmitAccount;
                                lineCredit.account = defaultAccount;
                            } else if (type == "vendorcredit") {
                                newDebitLine.setAccountId(defaultAccount);
                                newCreditLine.setAccountId(factNoEmitAccount);

                                lineDebit.account = defaultAccount;
                                lineCredit.account = factNoEmitAccount;
                            }

                            if ((FEAT_DEPT == true || FEAT_DEPT == "T") && (DEPTSPERLINE == true || DEPTSPERLINE == "T") && department) {
                                newDebitLine.setDepartmentId(department);
                                newCreditLine.setDepartmentId(department);
                            }

                            if ((FEAT_CLASS == true || FEAT_CLASS == "T") && (CLASSESPERLINE == true || CLASSESPERLINE == "T") && class_) {
                                newDebitLine.setClassId(class_);
                                newCreditLine.setClassId(class_);
                            }

                            if ((FEAT_LOC == true || FEAT_LOC == "T") && location) {
                                newDebitLine.setLocationId(location);
                                newCreditLine.setLocationId(location);
                            }

                            accounts69Array.push(lineDebit, lineCredit);
                        }
                    }
                }
            } else if (type == "itemfulfillment" || type == "itemreceipt") {
                var cuentaVarExist = subsidiaryAccounts.variacionExistencias;
                cuentaVarExist = Number(cuentaVarExist);
                var cuentaCompras = subsidiaryAccounts.compras;
                cuentaCompras = Number(cuentaCompras);
                var factNoEmitAccount = subsidiaryAccounts.facturaNoEmitida;
                factNoEmitAccount = Number(factNoEmitAccount);
                if (defaultAccount) {
                    for (var i = 0; i < lines.length; i++) {
                        var itemId = lines[i].itemId;
                        var amount = lines[i].amount || 0.00;
                        if (exchangeRate != 1) {
                            amount = amount * exchangeRate;
                        }
                        amount = round2(amount);

                        var department = lines[i].department || "";
                        department = Number(department);
                        var class_ = lines[i].class_ || "";
                        class_ = Number(class_);
                        var location = lines[i].location || "";
                        location = Number(location);

                        if (items.hasOwnProperty(itemId)) {
                            if (!cuentaVarExist) {
                                cuentaVarExist = items[itemId].cuentaVarExist || "";
                                cuentaVarExist = Number(cuentaVarExist);
                            }
                            if (!cuentaCompras) {
                                cuentaCompras = items[itemId].cuentaCompras || "";
                                cuentaCompras = Number(cuentaCompras);
                            }
                            if (!factNoEmitAccount) {
                                factNoEmitAccount = items[itemId].cuentaFactNoEmit || "";
                                factNoEmitAccount = Number(factNoEmitAccount);
                            }
                        }

                        if (amount) {
                            if (cuentaVarExist) {
                                var lineDebit = {
                                    book: book.getId(),
                                    department: department || "",
                                    "class": class_ || "",
                                    location: location || "",
                                    amount: amount,
                                    memo: "Espejo 6-9"
                                };
                                var lineCredit = JSON.parse(JSON.stringify(lineDebit));
                                lineDebit.columna = "debit";
                                lineCredit.columna = "credit";

                                var newDebitLine1 = customLines.addNewLine();
                                var newCreditLine1 = customLines.addNewLine();

                                newDebitLine1.setDebitAmount(parseFloat(amount));
                                newCreditLine1.setCreditAmount(parseFloat(amount));

                                if (type == "itemreceipt") {
                                    newDebitLine1.setAccountId(defaultAccount);
                                    newCreditLine1.setAccountId(cuentaVarExist);

                                    lineDebit.account = defaultAccount;
                                    lineCredit.account = cuentaVarExist;
                                } else if (type == "itemfulfillment") {
                                    newDebitLine1.setAccountId(cuentaVarExist);
                                    newCreditLine1.setAccountId(defaultAccount);

                                    lineDebit.account = cuentaVarExist;
                                    lineCredit.account = defaultAccount;
                                }

                                if ((FEAT_DEPT == true || FEAT_DEPT == "T") && (DEPTSPERLINE == true || DEPTSPERLINE == "T") && department) {
                                    newDebitLine1.setDepartmentId(department);
                                    newCreditLine1.setDepartmentId(department);
                                }

                                if ((FEAT_CLASS == true || FEAT_CLASS == "T") && (CLASSESPERLINE == true || CLASSESPERLINE == "T") && class_) {
                                    newDebitLine1.setClassId(class_);
                                    newCreditLine1.setClassId(class_);
                                }

                                if ((FEAT_LOC == true || FEAT_LOC == "T") && location) {
                                    newDebitLine1.setLocationId(location);
                                    newCreditLine1.setLocationId(location);
                                }

                                accounts69Array.push(lineDebit, lineCredit);
                            }

                            if (cuentaCompras && factNoEmitAccount) {
                                var lineDebit = {
                                    book: book.getId(),
                                    department: department || "",
                                    "class": class_ || "",
                                    location: location || "",
                                    amount: amount,
                                    memo: "Espejo 6-9"
                                };
                                var lineCredit = JSON.parse(JSON.stringify(lineDebit));
                                lineDebit.columna = "debit";
                                lineCredit.columna = "credit";

                                var newDebitLine2 = customLines.addNewLine();
                                var newCreditLine2 = customLines.addNewLine();

                                newDebitLine2.setDebitAmount(parseFloat(amount));
                                newCreditLine2.setCreditAmount(parseFloat(amount));

                                if (type == "itemreceipt") {
                                    newDebitLine2.setAccountId(cuentaCompras);
                                    newCreditLine2.setAccountId(factNoEmitAccount);

                                    lineDebit.account = cuentaCompras;
                                    lineCredit.account = factNoEmitAccount;
                                } else if (type == "itemfulfillment") {
                                    newDebitLine2.setAccountId(factNoEmitAccount);
                                    newCreditLine2.setAccountId(cuentaCompras);

                                    lineDebit.account = factNoEmitAccount;
                                    lineCredit.account = cuentaCompras;
                                }

                                if ((FEAT_DEPT == true || FEAT_DEPT == "T") && (DEPTSPERLINE == true || DEPTSPERLINE == "T") && department) {
                                    newDebitLine2.setDepartmentId(department);
                                    newCreditLine2.setDepartmentId(department);
                                }

                                if ((FEAT_CLASS == true || FEAT_CLASS == "T") && (CLASSESPERLINE == true || CLASSESPERLINE == "T") && class_) {
                                    newDebitLine2.setClassId(class_);
                                    newCreditLine2.setClassId(class_);
                                }

                                if ((FEAT_LOC == true || FEAT_LOC == "T") && location) {
                                    newDebitLine2.setLocationId(location);
                                    newCreditLine2.setLocationId(location);
                                }

                                accounts69Array.push(lineDebit, lineCredit);
                            }
                        }
                    }
                }
            }

            nlapiLogExecution("DEBUG", "accounts69Array", JSON.stringify(accounts69Array));
            customizeGlImpactEspejo69(transactionRecord, standardLines, customLines, book, accounts69Array);
        }
    } catch (err) {
        nlapiLogExecution("ERROR", "[ customizeGlImpact ]", err);
        sendemail(' [ customizeGlImpact ] ' + err, LMRY_script);
    }
}

function setAccountItems(items) {
    var itemKeys = Object.keys(items);
    if (itemKeys.length) {
        var columns = [
            new nlobjSearchColumn("internalid"),
            new nlobjSearchColumn("custitem_lmry_pe_cuenta_fact_noemitida"),
            new nlobjSearchColumn("custitem_lmry_cta_compras_desc"),
            new nlobjSearchColumn("custitem_lmry_pe_cta_varexist")
        ];
        var itemSearch = nlapiCreateSearch("item", [["internalid", "anyof", itemKeys]], columns);

        var results = itemSearch.runSearch().getResults(0, 1000);
        if (results) {
            for (var i = 0; i < results.length; i++) {
                var id = results[i].getValue("internalid");
                if (items.hasOwnProperty(id)) {
                    items[id].cuentaFactNoEmit = results[i].getValue("custitem_lmry_pe_cuenta_fact_noemitida") || "";
                    items[id].cuentaCompras = results[i].getValue("custitem_lmry_cta_compras_desc") || "";
                    items[id].cuentaVarExist = results[i].getValue("custitem_lmry_pe_cta_varexist") || "";
                }
            }
        }
    }
}

function getExchangeRate(transactionRecord, book) {
    var exchangeRate = transactionRecord.getFieldValue("exchangerate");
    if (FEAT_MULTIBOOK == "T" || FEAT_MULTIBOOK == true) {
        if (!book.isPrimary()) {
            var bookId = book.getId();
            var numBooks = transactionRecord.getLineItemCount("accountingbookdetail");
            //Se busca el exchange del Libro actual
            for (var i = 1; i <= numBooks; i++) {
                var currentBookId = transactionRecord.getLineItemValue("accountingbookdetail", "bookid", i);
                if (Number(bookId) == Number(currentBookId)) {
                    exchangeRate = transactionRecord.getLineItemValue("accountingbookdetail", "exchangerate", i);
                    exchangeRate = parseFloat(exchangeRate);
                    break;
                }
            }
        }
    }

    return exchangeRate;
}

function round2(num) {
    var e = (num >= 0) ? 1e-6 : -1e-6;
    return parseFloat(Math.round(parseFloat(num) * 1e2 + e) / 1e2);
}