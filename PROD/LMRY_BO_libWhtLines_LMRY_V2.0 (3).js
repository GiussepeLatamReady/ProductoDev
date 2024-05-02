/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_BO_libWhtLines_LMRY_V2.0.js                 ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Sep 22 2022  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define(['N/search', 'N/record', 'N/runtime','N/ui/serverWidget', './LMRY_libWhtValidationLBRY_V2.0', './LMRY_libSendingEmailsLBRY_V2.0','./LMRY_WhtValidattionEntity_LBRY_V2.0'],

function(search, record, runtime,serverWidget, libWhtValidation, libSendingEmail,library_validation_entity) {
    
    const LMRY_script = 'LMRY_BO_libWhtLines_LMRY_V2.0';
    const F_SUBSIDIARIES = runtime.isFeatureInEffect({feature: "SUBSIDIARIES"});
    const F_DEPARTMENTS = runtime.isFeatureInEffect({feature: "DEPARTMENTS"});
    const F_CLASSES = runtime.isFeatureInEffect({feature: "CLASSES"});
    const F_LOCATIONS = runtime.isFeatureInEffect({feature: "LOCATIONS"});
    const M_DEPARTMENTS = runtime.getCurrentUser().getPreference({ name: "DEPTMANDATORY" });
    const M_CLASSES = runtime.getCurrentUser().getPreference({ name: "CLASSMANDATORY" });
    const M_LOCATIONS = runtime.getCurrentUser().getPreference({ name: "LOCMANDATORY" });

    function createWHTbyLines(tranId, tranType,recordTransaction) {
        try {
            
            if (!tranId || tranId == '' || ['vendorbill','vendorcredit'].indexOf(tranType) == -1) return true;
            libWhtValidation.Delete_JE(tranId);
            if (tranType == 'vendorbill') libWhtValidation.Delete_CM('vendorcredit', tranId);
            var recordObj = record.load({
                type: tranType,
                id: tranId
            });
            var periodObj = search.lookupFields({
                type: 'accountingperiod',
                id: recordObj.getValue({fieldId: 'postingperiod'}),
                columns: ["aplocked"]
            });
            if (periodObj.aplocked) return true;
            var canCreateWht = recordObj.getValue({fieldId: 'custbody_lmry_apply_wht_code'});
            if (canCreateWht == 'F' || canCreateWht == false) return true;
            var setupTax = getSetupTaxSubsidiary(recordObj);
            var isWHTline = setupTax.whtRedirectLine;
            var bookRates = getBookRates(recordObj);
            var transactionLines = getTransactionLines(tranId, 'item');
            util.extend(transactionLines, getTransactionLines(tranId, 'expense'));
            var whtIds = [];
            var reteit = recordObj.getValue({fieldId: 'custbody_lmry_bo_autoreteit'});
            if (reteit) whtIds.push(reteit);
            var reteiu = recordObj.getValue({fieldId: 'custbody_lmry_bo_reteiue'});
            if (reteiu) whtIds.push(reteiu);

            if (runtime.executionContext == 'USERINTERFACE') {
                var reteiva = recordTransaction.getValue({fieldId: 'custpage_lmry_bo_reteiva'});
               
                if (reteiva) {               
                    whtIds.push(reteiva)               
                };
                
            }

            var exchangeRate = libWhtValidation.getExchangeRate(recordObj);
            var dataWht = libWhtValidation.Search_WHT(tranType, tranId, recordObj, whtIds, exchangeRate, setupTax);
            
            
            if (tranType == 'vendorbill') {
                if (isWHTline && Object.keys(transactionLines).length > 0) {
                    createWHT(recordObj, transactionLines, dataWht, bookRates, setupTax);
                } else {
                    libWhtValidation.Create_WHT_1(tranId, recordObj, dataWht, false, setupTax);
                }
            } else if (tranType == 'vendorcredit') {
                var transToDelete = libWhtValidation.getTransactionsToDelete(tranId, 'vendorbill');
                var arApply = Array();
                if (isWHTline && Object.keys(transactionLines).length > 0) {
                    arApply = createWHT(recordObj, transactionLines, dataWht, bookRates, setupTax);
                } else {
                    arApply = libWhtValidation.Create_WHT_2(tranId, recordObj, dataWht, false, setupTax);
                }
                
                libWhtValidation.ApplyInvoice(tranId, tranType, arApply, transToDelete);
            }

            var valuesToSet = {};
            var valuesCustpageToSet = {};
            
            for (var wht in dataWht) {
                if (dataWht[wht].field.slice(0,8) == "custpage") {
                    //valuesCustpageToSet[dataWht[wht].field] = dataWht[wht].local;
                    valuesCustpageToSet[dataWht[wht].field] = {
                        local:dataWht[wht].local,
                        whtID:wht
                    }
                }else{
                    
                    valuesToSet[dataWht[wht].field] = dataWht[wht].local;
                } 
            }

            if(Object.keys(valuesToSet).length){
                record.submitFields({
                    type: tranType,
                    id: tranId,
                    values: valuesToSet,
                    options: { enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true }
                });
            }

            if(Object.keys(valuesCustpageToSet).length){

                saveWhtIva(valuesCustpageToSet,tranId);
            }
            
            
        } catch (error) {
            log.error(LMRY_script + 'createWHTbyLines', error);
            libSendingEmail.sendemail('[createWHTbyLines] ' + error, LMRY_script);
        }
        
    }

    function getTransactionLines(tranId, sublistType) {
        try {
            var result = {};
            var filters = Array();
            var itemOperator = search.Operator.NONEOF;
            if (sublistType == 'expense') itemOperator = search.Operator.ANYOF;

            filters.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: tranId
            }));
            filters.push(search.createFilter({
                name: 'mainline',
                operator: search.Operator.IS,
                values: "F"
            }));
            filters.push(search.createFilter({
                name: 'item',
                operator: itemOperator,
                values: "@NONE@"
            }));
            filters.push(search.createFilter({
                name: 'taxline',
                operator: search.Operator.IS,
                values: "F"
            }));
            filters.push(search.createFilter({
                name: 'cogs',
                operator: search.Operator.IS,
                values: "F"
            }));
            filters.push(search.createFilter({
                name: 'shipping',
                operator: search.Operator.IS,
                values: "F"
            }));
            if (sublistType == 'item') filters.push(search.createFilter({
                name: 'type',
                join: 'item',
                operator: search.Operator.NONEOF,
                values: ["Group","EndGroup"]
            }));
            if (sublistType == 'expense') filters.push(search.createFilter({
                name: 'customgl',
                operator: search.Operator.IS,
                values: "F"
            }));
            if (sublistType == 'expense') filters.push(search.createFilter({
                name: 'internalid',
                join: 'account',
                operator: search.Operator.NONEOF,
                values: "@NONE@"
            }));

            var srchLines = search.create({
                type: "transaction",
                filters: filters,
                    columns: [
                        search.createColumn({ name: "account", label: "Account" }),
                        search.createColumn({ name: "fxamount", label: "Amount (Foreign Currency)" }),
                        search.createColumn({ name: "type", join: "item", label: "Type Item" }),
                        search.createColumn({
                            name: "formulanumeric",
                            formula: "ROUND(ABS({fxamount} * (TO_NUMBER({taxitem.rate}) / 100)), 2)",
                            label: "Formula (Numeric)"
                        })
                    ]
            });

            if (!srchLines) return result;
            srchLines = srchLines.run().getRange(0, 1000);
            for (var index = 0; index < srchLines.length; index++) {
                var line = srchLines[index];
                var lineAccount = line.getValue('account');
                var lineAmount = Math.abs(line.getValue('fxamount'));
                var lineTaxAmount = Number(line.getValue('formulanumeric'));
                var itemType = line.getValue({ name: "type", join: "item" });
                var key = 'i';
                if (sublistType == 'expense') key = 'e';
                if (sublistType == 'item' && itemType == 'Discount') {
                    lineAmount *= -1;
                    lineTaxAmount *= -1;
                }
                if (lineAccount && lineAccount != '' && lineAmount != 0) result[key + index] = [index, lineAccount, [lineAmount, lineTaxAmount, lineAmount + lineTaxAmount], sublistType];
            }
            
            return result;
        } catch (error) {
            log.error(LMRY_script + 'getTransactionLines', error);
            libSendingEmail.sendemail('[getTransactionLines] ' + error, LMRY_script);
        }
    }

    function createWHT(recordObj, transactionLines, dataWht, bookRates, setupTax) {
        try {
            var result = []; 
            if (!Object.keys(dataWht).length) return result;
            var typetran = recordObj.getValue({fieldId: 'type'});
            var savedSrchWht = search.load({id: 'customsearch_lmry_wht_base'});
            savedSrchWht.filters.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: Object.keys(dataWht)
            }));
            savedSrchWht = savedSrchWht.run().getRange(0, 1000);
            if (savedSrchWht.length < 1) return result;

            var exchangeRate = libWhtValidation.getExchangeRate(recordObj);
            savedSrchWht.forEach(function (whtCode) {
                var columns = whtCode.columns;
                var whtId = whtCode.id;
                var form = '';
                var name = whtCode.getValue('name');
                var isAvailableOnPurchases = whtCode.getValue('custrecord_lmry_wht_onpurchases');
                var saleWhtPoint = whtCode.getValue('custrecord_lmry_wht_purctaxpoint');
                var whtKind = whtCode.getValue('custrecord_lmry_wht_kind');
                var rate = whtCode.getValue('custrecord_lmry_wht_coderate');
                
                var minAmountBase = whtCode.getValue('custrecord_lmry_wht_codeminbase');
                if (minAmountBase == '' || minAmountBase == null) minAmountBase = 0;
                var assetAccount = whtCode.getValue('custrecord_lmry_wht_taxcredacc');
                var liabilityAccount = whtCode.getValue('custrecord_lmry_wht_taxliabacc');
                var purchaseWhtBase = whtCode.getValue(columns[16]); // custrecord_lmry_wht_purcbase
                
                var amount = 0;
                var amountresult = 0;
                var amountto = 0;
                
                //Validate field
                if (purchaseWhtBase == '' || purchaseWhtBase == null || isAvailableOnPurchases == false || isAvailableOnPurchases == 'F') return result;

                if (purchaseWhtBase == 'subtotal') {
                    amount = parseFloat(recordObj.getValue({fieldId: 'total'})) - parseFloat(recordObj.getValue({fieldId: 'taxtotal'}));
                    amount = libWhtValidation.round2(amount);
                } else {
                    amount = parseFloat(recordObj.getValue({fieldId: purchaseWhtBase}));
                }

                if (purchaseWhtBase == 'taxtotal') {
                    amountto = 1;
                } else if (purchaseWhtBase == 'total') {
                    amountto = 2;
                }

                //Validate date and amount
                var transactionDate = libWhtValidation.yyymmdd(recordObj.getValue({fieldId: 'trandate'}));
                var dateFrom = whtCode.getValue(columns[6]);
                var dateTo = whtCode.getValue(columns[7]);
                if (saleWhtPoint != 1) return result;
                if (!(transactionDate >= dateFrom && dateFrom != '' && dateFrom != null) || 
                    !(transactionDate <= dateTo && dateTo != '' && dateTo != null) || 
                    !((parseFloat(amount) * exchangeRate) >= parseFloat(minAmountBase) && (parseFloat(amount) * exchangeRate) > 0) || 
                    parseFloat(amountresult) > 0) return result;

                if (amount != '' && amount != null) {
                    amountresult = exchangeAmount(amount, rate);
                }

                var whtJson = {};
                whtJson[whtId] = dataWht[whtId];
                if (whtKind == 1) { //Credit memo
                    if (typetran == 'vendbill') libWhtValidation.Create_WHT_1(recordObj.id, recordObj, whtJson, false, setupTax);
                    if (typetran == 'vendcred') result = libWhtValidation.Create_WHT_2(recordObj.id, recordObj, whtJson, false, setupTax);

                } else if (whtKind == 2 && assetAccount && assetAccount != '') { //Journal
                    if (typetran == 'vendbill') libWhtValidation.Create_WHT_1(recordObj.id, recordObj, whtJson, false, setupTax);
                    if (typetran == 'vendcred') result = libWhtValidation.Create_WHT_2(recordObj.id, recordObj, whtJson, false, setupTax);

                } else { //Journal líneas
                    var journal = record.create({
                        type: record.Type.JOURNAL_ENTRY,
                        isDynamic: true
                    })
                    // Formulario Personalizado
                    form = runtime.getCurrentScript().getParameter({
                        name: 'custscript_lmry_wht_journal_entry'
                    });
                    if (form != '' && form != null) journal.setValue({
                        fieldId: 'customform',
                        value: form
                    });
                    
                    // Campos Standar de NetSuite
                    journal.setValue({
                        fieldId: 'subsidiary',
                        value: recordObj.getValue({fieldId: 'subsidiary'})
                    });
                    journal.setValue({
                        fieldId: 'trandate',
                        value: recordObj.getValue({fieldId: 'trandate'})
                    });
                    journal.setValue({
                        fieldId: 'postingperiod',
                        value: recordObj.getValue({fieldId: 'postingperiod'})
                    });
                    // Tipo de cambio de la transaccion Origen
                    journal.setValue({
                        fieldId: 'currency',
                        value: recordObj.getValue({fieldId: 'currency'})
                    });
                    journal.setValue({
                        fieldId: 'exchangerate',
                        value: recordObj.getValue({fieldId: 'exchangerate'})
                    });

                    /***********************************************
                     * Segmentacion Contable de NetSuite
                     * Campos de cabecera obligatorios
                     * (Habilitados en prefencias de contabilidad)
                     **********************************************/

                    var segmentation = getSegmentation(recordObj, 'item');
                    if (recordObj.getLineCount({ sublistId: "item" }) < 1) {
                        segmentation = getSegmentation(recordObj, 'expense');
                    }

                    ['department', 'class', 'location'].forEach(function (fieldId) {
                        var field = '';
                        if (segmentation.hasOwnProperty(fieldId)) field = segmentation[fieldId];
                        if (field && field != '') journal.setValue(field);
                    });
                    
                    journal.setValue('bookje', false);
                    // Campos Latam Ready
                    journal.setValue({
                        fieldId: 'custbody_lmry_reference_transaction',
                        value: recordObj.id
                    });
                    journal.setValue({
                        fieldId: 'custbody_lmry_reference_transaction_id',
                        value: recordObj.id
                    });
                    journal.setValue({
                        fieldId: 'custbody_lmry_reference_entity',
                        value: recordObj.getValue({fieldId: 'entity'})
                    });

                    // Linea de debito
                    journal.selectNewLine({sublistId: 'line'});

                    journal.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: liabilityAccount
                    });
                    journal.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: typetran == 'vendbill' ? 'credit' : 'debit',
                        value: amountresult
                    });
                    journal.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'entity',
                        value: recordObj.getValue({fieldId: 'entity'})
                    });
                    journal.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'memo',
                        value: 'Latam - WHT ' + name
                    });

                    // Departament, Class, Location
                    ['department', 'class', 'location'].forEach(function (fieldId) {
                        var field = '';
                        if (segmentation.hasOwnProperty(fieldId)) field = segmentation[fieldId];
                        if (field && field != '') journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: fieldId,
                            value: field
                        });
                    });

                    journal.commitLine({
                        sublistId: 'line'
                    });

                    //Linea de credito
                    transactionLines = adjustLineAmount(transactionLines, amountresult, rate, amountto);
                    
                    if (Object.keys(transactionLines).length > 0) 
                    for (var key in transactionLines) {
                        var transactionLine = transactionLines[key];
                        journal.selectNewLine({sublistId: 'line'});

                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            value: transactionLine[1]
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: typetran == 'vendbill' ? 'debit' : 'credit',
                            value: transactionLine[2],
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'entity',
                            value: recordObj.getValue({fieldId: 'entity'})
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'memo',
                            value: 'Latam - WHT ' + name
                        });

                        ['department', 'class', 'location'].forEach(function (fieldId) {
                            var field = '';
                            if (segmentation.hasOwnProperty(fieldId)) field = segmentation[fieldId];
                            if (field && field != '') journal.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: fieldId,
                                value: field
                            });
                        });

                        journal.commitLine({
                            sublistId: 'line'
                        });
                    }

                    var journalApprovalFeat = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALJOURNAL' });
                    if ((journalApprovalFeat == 'T' || journalApprovalFeat == true) && journal.getField({ fieldId: "approvalstatus" })) journal.setValue({
                        fieldId: 'approvalstatus',
                        value: 2
                    });
                    
                    var books = journal.getLineCount({ sublistId: 'accountingbookdetail' });
                    for (var i = 0; i < books; i++) {
                        var currencybook = journal.getSublistValue({ sublistId: 'accountingbookdetail', fieldId: 'currency', line: i });
                        if (bookRates[currencybook]) {
                            journal.selectLine({ sublistId: 'accountingbookdetail', line: i });
                            journal.setCurrentSublistValue({ sublistId: 'accountingbookdetail', fieldId: 'exchangerate', value: bookRates[currencybook] });
                            journal.commitLine({ sublistId: 'accountingbookdetail' });
                        }
                    }
                    // Graba el Journal
                    var newrec = journal.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                    record.submitFields({
                        type: record.Type.JOURNAL_ENTRY,
                        id: newrec,
                        values: { memo: 'Latam - WHT ' + name },
                    });

                    //result = newrec;
                }
            });

            return result;

        } catch (error) {
            log.error(LMRY_script + 'createWHT', error);
            libSendingEmail.sendemail('[createWHT] ' + error, LMRY_script);
        }
    }

    function getSegmentation(recordObj, sublistId) {
        try {
            var result = {};
            var fieldsId = [];
            if (F_DEPARTMENTS == true || F_DEPARTMENTS == 'T') {
                if (M_DEPARTMENTS == true || M_DEPARTMENTS == 'T') {
                    fieldsId.push({ field: 'department', mandatory: true });
                } else {
                    fieldsId.push({ field: 'department', mandatory: false });
                }
            }
            if (F_CLASSES == true || F_CLASSES == 'T') {
                if (M_CLASSES == true || M_CLASSES == 'T') {
                    fieldsId.push({ field: 'class', mandatory: true });
                } else {
                    fieldsId.push({ field: 'class', mandatory: false });
                }
            }
            if (F_LOCATIONS == true || F_LOCATIONS == 'T') {
                if (M_LOCATIONS == true || M_LOCATIONS == 'T') {
                    fieldsId.push({ field: 'location', mandatory: true });
                } else {
                    fieldsId.push({ field: 'location', mandatory: false });
                }
            }
            if (fieldsId.length == 0) return result;
            var setupTaxSubsidiary = getSetupTaxSubsidiary(recordObj);
            fieldsId.forEach(function (fieldId) {
                var field = recordObj.getValue({ fieldId: fieldId["field"] });
                if (!field || field == '') field = recordObj.getSublistValue({
                    sublistId: sublistId,
                    fieldId: fieldId["field"],
                    line: 0
                });
                if ((!field || field == '') && fieldId["mandatory"] && setupTaxSubsidiary.hasOwnProperty(fieldId["field"]) && setupTaxSubsidiary[fieldId["field"]]) field = setupTaxSubsidiary[fieldId["field"]];
                result[fieldId["field"]] = field;
            });
            
            return result;
        } catch (error) {
            log.error('getSegmentation', error);
            libSendingEmail.sendemail('[getSegmentation] ' + error, LMRY_script);
        }
    }

    function getSetupTaxSubsidiary(recordObj) {
        try {
            var result = {};
            var subsidiary = recordObj.getValue({fieldId: 'subsidiary'});
            var filters = Array();
            var columns = ['custrecord_lmry_setuptax_bo_wth_line', 'custrecord_lmry_setuptax_tax_code'];
            if ((F_SUBSIDIARIES == true || F_SUBSIDIARIES == 'T') && (!subsidiary || subsidiary == '')) return result;
            if (F_SUBSIDIARIES == true || F_SUBSIDIARIES == 'T') filters.push(search.createFilter({
                name: 'custrecord_lmry_setuptax_subsidiary',
                operator: search.Operator.ANYOF,
                values: subsidiary
            }));
            if (F_DEPARTMENTS == true || F_DEPARTMENTS == 'T') columns.push('custrecord_lmry_setuptax_department');
            if (F_CLASSES == true || F_CLASSES == 'T') columns.push('custrecord_lmry_setuptax_class');
            if (F_LOCATIONS == true || F_LOCATIONS == 'T') columns.push('custrecord_lmry_setuptax_location');
            var srchSetupTaxSubs = search.create({
                type: 'customrecord_lmry_setup_tax_subsidiary',
                columns: columns,
                filters: filters
            });
            if (!srchSetupTaxSubs) return false;
            srchSetupTaxSubs = srchSetupTaxSubs.run().getRange(0, 1);
            if (srchSetupTaxSubs.length < 1) return false;
            result.whtRedirectLine = srchSetupTaxSubs[0].getValue('custrecord_lmry_setuptax_bo_wth_line') || false;
            result.taxcode = srchSetupTaxSubs[0].getValue('custrecord_lmry_setuptax_tax_code') || '';
            if (F_DEPARTMENTS == true || F_DEPARTMENTS == 'T') result.department = srchSetupTaxSubs[0].getValue('custrecord_lmry_setuptax_department');
            if (F_CLASSES == true || F_CLASSES == 'T') result.class = srchSetupTaxSubs[0].getValue('custrecord_lmry_setuptax_class');
            if (F_LOCATIONS == true || F_LOCATIONS == 'T') result.location = srchSetupTaxSubs[0].getValue('custrecord_lmry_setuptax_location');

            return result;
        } catch (error) {
            log.error(LMRY_script + 'getSetupTaxSubsidiary', error);
            libSendingEmail.sendemail('[getSetupTaxSubsidiary] ' + error, LMRY_script);
        }
    }

    function exchangeAmount(amount, exchangeRate) {
        try {
            var result = 0;
            if (!(amount && exchangeRate) || (amount == 0 || exchangeRate == 0)) return result;
            result = parseFloat(amount) * parseFloat(exchangeRate);
            result = parseFloat(result) / 100;
            result = libWhtValidation.round2(result);
            //result = Math.abs(result);
            return result;
        } catch (error) {
            log.error(LMRY_script + 'exchangeAmount', err);
            libSendingEmail.sendemail('[exchangeAmount] ' + error, LMRY_script);
        }
    }

    function adjustLineAmount(transactionLines, amount, exchangeRate, amountTo) {
        try {
            var result = {};
            var lineKeys = Object.keys(transactionLines);
            var lineQuantity = lineKeys.length;
            if (lineQuantity == 0) return result;
            var totalLineAmount = 0;
            var lastKey = lineKeys[lineQuantity - 1];
            for (var key in transactionLines) {
                var line = transactionLines[key];
                var lineAccount = line[1];
                var lineAmount = line[2][amountTo];
                lineAmount = exchangeAmount(lineAmount, exchangeRate);
                var lastLineAmount = totalLineAmount;
                totalLineAmount += lineAmount;
                if (key == lastKey && amount != totalLineAmount) {
                    result[key] = [line[0], lineAccount, amount - lastLineAmount, line[3]];
                } else {
                    result[key] = [line[0], lineAccount, lineAmount, line[3]];
                }
            }
            return result;

        } catch (error) {
            log.error('adjustLineAmount', error);
            libSendingEmail.sendemail('[adjustLineAmount] ' + error, LMRY_script);
        }
    }

    function getBookRates(recordObj) {
        var bookRatesJson = {};
        var lineasBook = recordObj.getLineCount({ sublistId: 'accountingbookdetail' });

        if (lineasBook != null && lineasBook != '') {
            for (var i = 0; i < lineasBook; i++) {
                var lineaCurrencyMB = recordObj.getSublistValue({ sublistId: 'accountingbookdetail', fieldId: 'currency', line: i });
                bookRatesJson[lineaCurrencyMB] = recordObj.getSublistValue({ sublistId: 'accountingbookdetail', fieldId: 'exchangerate', line: i });
            }
        }
        

        return bookRatesJson;
    }

    function getBoTransactionField(transactionId) {
        var transactionField = {
            exist: false
        };
        var transactionFieldObj = search.create({
            type: "customrecord_lmry_bo_transaction_fields",
            filters:
                [
                    ["custrecord_lmry_bo_transaction", "anyof", transactionId]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid" }),
                    search.createColumn({ name: "custrecord_lmry_bo_reteiva" }),
                    search.createColumn({ name: "custrecord_lmry_bo_reteiva_whtamount" })

                ]
        });
        transactionFieldObj.run().each(function (result) {
            transactionField.id = result.getValue("internalid") || "";
            transactionField.whtCodeIva = result.getValue("custrecord_lmry_bo_reteiva") || "";
            transactionField.whtAmountIva = result.getValue("custrecord_lmry_bo_reteiva_whtamount") || 0.00;
            transactionField.exist = true;
        });
        return transactionField;
    }

    
    function saveWhtIva(valuesCustpageToSet,transactionId){

        const relatedFields = {
            "custpage_lmry_bo_reteiva_whtamount":{
                code:"custrecord_lmry_bo_reteiva",
                amount:"custrecord_lmry_bo_reteiva_whtamount"
            } 
        }

        var transactionField = getBoTransactionField(transactionId);

        if (transactionField.exist) {
            var updateTransactionField = record.load({
                type: "customrecord_lmry_bo_transaction_fields",
                id: transactionField.id
            });
            
            for (var value in valuesCustpageToSet) {
                
                if (valuesCustpageToSet[value].whtID) {
                    updateTransactionField.setValue({
                        fieldId: relatedFields[value].code,
                        value: valuesCustpageToSet[value].whtID,
                        ignoreFieldChange: true
                    });
                    
                    updateTransactionField.setValue({
                        fieldId: relatedFields[value].amount,
                        value: valuesCustpageToSet[value].local,
                        ignoreFieldChange: true
                    });
                } else{
                    updateTransactionField.setValue({
                        fieldId: relatedFields[value].code,
                        value: "",
                        ignoreFieldChange: true
                    });
                    
                    updateTransactionField.setValue({
                        fieldId: relatedFields[value].amount,
                        value: 0,
                        ignoreFieldChange: true
                    });
                }
            }

            updateTransactionField.save({
                disableTriggers: true,
                ignoreMandatoryFields: true
            });
        }else{
            
            var newTransactionField = record.create({
                type: 'customrecord_lmry_bo_transaction_fields',
                isDynamic: true
            });
            for (var value in valuesCustpageToSet) {
                
                    newTransactionField.setValue({
                        fieldId: relatedFields[value].code,
                        value: valuesCustpageToSet[value].whtID,
                        ignoreFieldChange: true
                    });
                    
                    newTransactionField.setValue({
                        fieldId: relatedFields[value].amount,
                        value: valuesCustpageToSet[value].local,
                        ignoreFieldChange: true
                    });

            }
            newTransactionField.setValue({
                fieldId: 'custrecord_lmry_bo_transaction',
                value: transactionId,
                ignoreFieldChange: true
            });

            newTransactionField.save({
                disableTriggers: true,
                ignoreMandatoryFields: true
            });
        }

    }

    function saveWhtIvaCode(transactionId,recordTransaction){
        
        var WHTID = recordTransaction.getValue({fieldId: 'custpage_lmry_bo_reteiva'});
        
        if (!WHTID) return false;
        var transactionField = getBoTransactionField(transactionId);
        
        if (transactionField.exist) {
            
            var updateTransactionField = record.load({
                type: "customrecord_lmry_bo_transaction_fields",
                id: transactionField.id
            });
            updateTransactionField.setValue({
                fieldId: "custrecord_lmry_bo_reteiva",
                value: WHTID,
                ignoreFieldChange: true
            });
            updateTransactionField.save({
                disableTriggers: true,
                ignoreMandatoryFields: true
            });
            
        }else{
            
            var newTransactionField = record.create({
                type: 'customrecord_lmry_bo_transaction_fields',
                isDynamic: true
            });
            

            newTransactionField.setValue({
                fieldId: "custrecord_lmry_bo_reteiva",
                value: WHTID,
                ignoreFieldChange: true
            });

            newTransactionField.setValue({
                fieldId: 'custrecord_lmry_bo_transaction',
                value: transactionId,
                ignoreFieldChange: true
            });

            newTransactionField.save({
                disableTriggers: true,
                ignoreMandatoryFields: true
            });
        }
        
    }

    function setFieldWhtIVA(recordTransaction, form, typeContext, useOnlyAtmainLevel) {
        try {
            var language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
            //Create field wht Iva
            var whtCodeIvaField = form.addField({
                id: 'custpage_lmry_bo_reteiva',
                type: 'select',
                label: 'Latam - BO IVA'
            });
    
            whtCodeIvaField.addSelectOption({
                value: '',
                text: '&nbsp;'
            });
            var whtCodeIvaList = library_validation_entity.getWhtCodeList("custpage_lmry_bo_reteiva");
    
            var idsWhtCodeList = Object.keys(whtCodeIvaList);
    
            idsWhtCodeList.forEach(function (id) {
                whtCodeIvaField.addSelectOption({
                    value: whtCodeIvaList[id].id,
                    text: whtCodeIvaList[id].name
                });
            }) 

            var amountLabel = language == "es" ? "IMPORTE" : "AMOUNT"
            // Create Field  Wht Iva amount
            var whtCodeIvaFieldAmount = form.addField({
                id: 'custpage_lmry_bo_reteiva_whtamount',
                type: 'currency',
                label: 'Latam - BO IVA ' + amountLabel
            });


            whtCodeIvaFieldAmount.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            setFieldsWhtIva(recordTransaction, typeContext, useOnlyAtmainLevel);

        
        } catch (error) {
            log.error(" error [setFieldWhtIVA]", error)
        }
    }

    

    function setFieldsWhtIva(recordTransaction, typeContext,useOnlyAtmainLevel){
        var vendor = recordTransaction.getValue({ fieldId: 'entity' }) || ""
        var entityField = library_validation_entity.getEntityField(vendor);
        
        if (typeContext == "create" || typeContext == "copy") {
            
            
            if (entityField.exist && entityField.whtCodeIva != "") {
                recordTransaction.setValue('custpage_lmry_bo_reteiva', entityField.whtCodeIva);
                recordTransaction.setValue('custpage_lmry_bo_reteiva_whtamount', 0.00);
            }
        } else { // view - edit
            var transactionField = getBoTransactionField(recordTransaction.id);
            
            if (transactionField.exist && transactionField.whtCodeIva != "") {
                recordTransaction.setValue('custpage_lmry_bo_reteiva', transactionField.whtCodeIva);
                recordTransaction.setValue('custpage_lmry_bo_reteiva_whtamount', transactionField.whtAmountIva);
            }
        }
        // establecer por defecto el valor 0 cuando las transaccion es creada
        if (typeContext == "create") {
            recordTransaction.setValue('custbody_lmry_bo_autoreteit_whtamount', 0.00);
            recordTransaction.setValue('custbody_lmry_bo_reteiue_whtamount', 0.00);
        }

        if (!useOnlyAtmainLevel) recordTransaction.setValue('custpage_lmry_bo_reteiva_whtamount', 0.00);
    }

    return {
        createWHTbyLines: createWHTbyLines,
        setFieldWhtIVA:setFieldWhtIVA,
        saveWhtIvaCode:saveWhtIvaCode
    }

});