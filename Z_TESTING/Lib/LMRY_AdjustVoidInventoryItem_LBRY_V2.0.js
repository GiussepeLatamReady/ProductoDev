/* eslint-disable line-comment-position */
/* eslint-disable suitescript/no-log-module */
/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define([
    'N/record',
    'N/runtime',
    'N/log',
    'N/search',
    'N/format',
    'N/transaction',
    'SuiteBundles/Bundle 35754/Latam_Library/LMRY_IP_libSendingEmailsLBRY_V2.0'
], function (record, runtime, log, search, format, transaction, libraryEmail) {
    var scriptName = 'LMRY_AnulacionTransferencias_LBRY_V2.0.js';
    var F_DEPARTMENTS = runtime.isFeatureInEffect({
        feature: 'DEPARTMENTS'
    });
    var F_LOCATIONS = runtime.isFeatureInEffect({
        feature: 'LOCATIONS'
    });
    var F_CLASSES = runtime.isFeatureInEffect({
        feature: 'CLASSES'
    });

    // Obteniendo el estado de los Features Departamento / Clase / Localización
    var F_DEPTMANDATORY = runtime.getCurrentScript().getParameter({
        name: 'DEPTMANDATORY'
    });
    var F_CLASSMANDATORY = runtime.getCurrentScript().getParameter({
        name: 'CLASSMANDATORY'
    });
    var F_LOCMANDATORY = runtime.getCurrentScript().getParameter({
        name: 'LOCMANDATORY'
    });
    function voidReceipt(recordReceipt) {
        var status = {
            idInvAdjustment: [],
            error: null
        };
        var transferOrderID = recordReceipt.getValue('createdfrom');
        try {
            var accounts = getAccounts({
                receiptSubsidiary: recordReceipt.getValue('subsidiary')
            });
            var items = getItemDataByTransaction(recordReceipt);
            status.items = items;
            status.accounts = accounts;
            status.transferOrderID = transferOrderID;
            if (Object.keys(items.itemsWithoutTransfPrice).length > 0) {
                var adjustWTP = createInventoryAdjustment({
                    transferOrderID: transferOrderID,
                    account: accounts.defaultReceipt,
                    subsidiary: recordReceipt.getValue('subsidiary'),
                    classFinal: accounts.classFul,
                    deptFinal: accounts.deptFul,
                    listItems: items.itemsWithoutTransfPrice,
                    contentTransferPrice: false,
                    location: items.itemLocation,
                    isFulfillment: false
                });
                status.idInvAdjustment.push(adjustWTP);
            }
            if (Object.keys(items.itemsTransferPrice).length > 0) {
                var adjustTP = createInventoryAdjustment({
                    transferOrderID: transferOrderID,
                    account: accounts.defaultReceipt,
                    subsidiary: recordReceipt.getValue('subsidiary'),
                    classFinal: accounts.classReceipt,
                    deptFinal: accounts.deptReceipt,
                    listItems: items.itemsTransferPrice,
                    contentTransferPrice: true,
                    location: items.itemLocation,
                    isFulfillment: false
                });
                status.idInvAdjustment.push(adjustTP);
            }
            var listTaxResult = getTaxResults(recordReceipt.id);
            status.listTaxResult = listTaxResult;
            deleteTaxResults(listTaxResult);
            var trans = record.load({
                type: record.Type.ITEM_RECEIPT,
                id: recordReceipt.id
            });
            trans.save();
        } catch (error) {
            status.error = {
                name: error.name,
                message: error.message || error
            };
            log.error('LMRY_AnulacionTransferencias_LBRY_V2 - [anulacionTransferencia]', error);
            // libraryEmail.sendemail(' [ anulacionTransferencia ] ' + error, scriptName);
        }
        return status;
    }
    function voidFulfillment(recordFulfillment) {
        var status = {
            idInvAdjustment: [],
            error: null
        };
        var transferOrderID = recordFulfillment.getValue('createdfrom');
        try {
            var transferoOrderData = getApplyTransactionsByTransferOrder(transferOrderID);
            var accounts = getAccounts({
                receiptSubsidiary: transferoOrderData[0].tosubsidiary,
                fulfillmentSubsidiary: recordFulfillment.getValue('subsidiary')
            });
            var items = getItemDataByTransaction(recordFulfillment);
            if (Object.keys(items.itemsWithoutTransfPrice).length > 0) {
                createInventoryAdjustment({
                    transferOrderID: transferOrderID,
                    account: accounts.defaultFul,
                    subsidiary: recordFulfillment.getValue('subsidiary'),
                    classFinal: accounts.classFul,
                    deptFinal: accounts.deptFul,
                    listItems: items.itemsWithoutTransfPrice,
                    contentTransferPrice: false,
                    location: items.itemLocation
                });
                createInventoryAdjustment({
                    transferOrderID: transferOrderID,
                    account: accounts.defaultReceipt,
                    subsidiary: transferoOrderData[0].tosubsidiary,
                    classFinal: accounts.classFul,
                    deptFinal: accounts.deptFul,
                    listItems: items.itemsWithoutTransfPrice,
                    contentTransferPrice: false,
                    location: recordFulfillment.getValue('transferlocation')
                });
            }
            if (Object.keys(items.itemsTransferPrice).length > 0) {
                createInventoryAdjustment({
                    transferOrderID: transferOrderID,
                    account: accounts.defaultFul,
                    subsidiary: recordFulfillment.getValue('subsidiary'),
                    classFinal: accounts.classFul,
                    deptFinal: accounts.deptFul,
                    listItems: items.itemsTransferPrice,
                    contentTransferPrice: true,
                    location: items.itemLocation
                });
                createInventoryAdjustment({
                    transferOrderID: transferOrderID,
                    account: accounts.defaultReceipt,
                    subsidiary: transferoOrderData[0].tosubsidiary,
                    classFinal: accounts.classReceipt,
                    deptFinal: accounts.deptReceipt,
                    listItems: items.itemsTransferPrice,
                    contentTransferPrice: true,
                    location: recordFulfillment.getValue('transferlocation')
                });
            }
            transferoOrderData.forEach(function (receiptInfo) {
                var listTaxResult = getTaxResults(receiptInfo.applyingtransaction);
                deleteTaxResults(listTaxResult);
                var trans = record.load({
                    type: record.Type.ITEM_RECEIPT,
                    id: receiptInfo.applyingtransaction
                });
                trans.save();
            });
            var trans = record.load({
                type: record.Type.ITEM_FULFILLMENT,
                id: recordFulfillment.id
            });
            trans.save();
        } catch (error) {
            status.error = {
                name: error.name,
                message: error.message || error
            };
            log.error('LMRY_AnulacionTransferencias_LBRY_V2 - [anulacionTransferencia]', error);
            // libraryEmail.sendemail(' [ anulacionTransferencia ] ' + error, scriptName);
        }
        return status;
    }

    // General functions
    /**
     *
     * @param {Object} param0
     * @returns
     */
    function createInventoryAdjustment(_ref) {
        var contentTransferPrice = _ref.contentTransferPrice,
            isFulfillment = _ref.isFulfillment,
            subsidiary = _ref.subsidiary,
            account = _ref.account,
            transferOrderID = _ref.transferOrderID,
            listItems = _ref.listItems,
            classFinal = _ref.classFinal,
            deptFinal = _ref.deptFinal,
            location = _ref.location;
        try {
            var invAdjustment = record.create({
                type: record.Type.INVENTORY_ADJUSTMENT,
                isDynamic: true
            });
            invAdjustment.setValue('subsidiary', subsidiary);
            invAdjustment.setValue('account', account);
            invAdjustment.setValue('adjlocation', location);
            invAdjustment.setValue('custbody_lmry_reference_transaction', transferOrderID);
            invAdjustment.setValue('custbody_lmry_reference_transaction_id', transferOrderID);
            var memo = '';
            if (contentTransferPrice) {
                memo = 'Reference VOID Intercompany (ID:' + transferOrderID + ') - with Transfer Price';
            } else {
                memo = 'Reference VOID Intercompany (ID:' + transferOrderID + ') - without Transfer Price';
            }

            // getSegmentacion(invAdjustment, depSetup, classSetup, department, _class);
            if (classFinal) {
                invAdjustment.setValue('class', classFinal);
            }
            if (deptFinal) {
                invAdjustment.setValue('department', deptFinal);
            }
            invAdjustment.setValue('memo', memo);
            for (var itemID in listItems) {
                if (listItems[itemID]) {
                    var quantity = listItems[itemID].itemQuantity;
                    invAdjustment.selectNewLine({
                        sublistId: 'inventory'
                    });
                    invAdjustment.setCurrentSublistValue({
                        sublistId: 'inventory',
                        fieldId: 'item',
                        value: listItems[itemID].item
                    });
                    invAdjustment.setCurrentSublistValue({
                        sublistId: 'inventory',
                        fieldId: 'location',
                        value: location
                    });
                    if (!isFulfillment) {
                        // Si es para crear Inventory Adjustment para la reversa de Item Receipt, la cantidad va con -
                        invAdjustment.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'adjustqtyby',
                            value: -quantity
                        });
                    } else if (isFulfillment) {
                        // Si es para crear Inventory Adjustment para la reversa de Item Fulfillment, la cantidad va con +
                        invAdjustment.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'adjustqtyby',
                            value: quantity
                        });
                    }
                    if (contentTransferPrice) {
                        // Si tiene Transfer Price, se utiliza el monto ingresado en dicho campo
                        invAdjustment.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'unitcost',
                            value: listItems[itemID].itemPrice
                        });
                    }
                    if (classFinal) {
                        invAdjustment.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'class',
                            value: classFinal
                        });
                    }
                    if (deptFinal) {
                        invAdjustment.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'department',
                            value: deptFinal
                        });
                    }
                    invAdjustment.commitLine({
                        sublistId: 'inventory'
                    });
                }
            }
            return invAdjustment.save();
        } catch (error) {
            log.error('LMRY_AdjustVoidInventoryItem_LBRY_V2.0.js - [createInventoryAdjustment]', error);
            // libraryEmail.sendemail(' [ createInvAdjustment ] ' + error, scriptName);
            return error;
        }
    }
    function getApplyTransactionsByTransferOrder(transferOrderID) {
        var rcdTransferOrder = search.load({
            id: 'customsearch_lmry_br_anul_transf'
        });
        // const rcdTransferOrder = search.create({
        //     type: 'transferorder',
        //     filters: ['type', 'anyof', 'TrnfrOrd'],
        //     columns: ['tosubsidiary', 'applyingtransaction', 'department', 'class']
        // });
        rcdTransferOrder.filters.push(
            search.createFilter({
                name: 'internalid',
                operator: 'anyof',
                values: transferOrderID
            })
        );
        // if (transactionType) {
        //     rcdTransferOrder.filters.push(
        //         search.createFilter({ name: 'applyingtransaction.type', operator: 'anyof', values: 'ItemRcpt' })
        //     );
        // } else {
        //     rcdTransferOrder.filters.push(
        //         search.createFilter({ name: 'applyingtransaction.type', operator: 'anyof', values: 'ItemShip' })
        //     );
        // }
        /**
         * @type {Array<object>}
         */
        var resultTransferOrder = rcdTransferOrder.run().getRange(0, 1000);
        var resultTransferOrderAux = resultTransferOrder.map(function (element) {
            return {
                tosubsidiary: element.getValue('tosubsidiary'),
                applyingtransaction: element.getValue('applyingtransaction'),
                department: element.getValue('department'),
                class: element.getValue('class')
            };
        });
        return resultTransferOrderAux;
    }
    function getItemDataByTransaction(recordObj) {
        var itemsTransferPrice = {};
        var itemsWithoutTransfPrice = {};
        var itemLocation;
        try {
            var itemLines = recordObj.getLineCount({
                sublistId: 'item'
            });
            if (itemLines > 0) {
                itemLocation = recordObj.getSublistValue('item', 'location', 0);
                for (var i = 0; i < itemLines; i++) {
                    var itemIndex = i;
                    var itemID = recordObj.getSublistValue('item', 'item', i);
                    var itemQuantity = recordObj.getSublistValue('item', 'quantity', i);
                    var itemPrice = recordObj.getSublistValue('item', 'itemunitprice', i);
                    // Se agruparán las líneas según tengan Transfer Price o no
                    if (itemPrice > 0) {
                        itemsTransferPrice[itemIndex] = {};
                        itemsTransferPrice[itemIndex].item = itemID;
                        itemsTransferPrice[itemIndex].itemQuantity = itemQuantity;
                        itemsTransferPrice[itemIndex].itemPrice = itemPrice;
                    } else {
                        itemsWithoutTransfPrice[itemIndex] = {};
                        itemsWithoutTransfPrice[itemIndex].item = itemID;
                        itemsWithoutTransfPrice[itemIndex].itemQuantity = itemQuantity;
                        itemsWithoutTransfPrice[itemIndex].itemPrice = itemPrice;
                    }
                }
            }
        } catch (error) {
            log.error('LMRY_AnulacionTransferencias_LBRY_V2 - [devolverLineas]', error);
            // libraryEmail.sendemail(' [ devolverLineas ] ' + error, scriptName);
        }
        return {
            itemLocation: itemLocation,
            itemsTransferPrice: itemsTransferPrice,
            itemsWithoutTransfPrice: itemsWithoutTransfPrice
        };
    }
    function getAccounts(_ref2) {
        var receiptSubsidiary = _ref2.receiptSubsidiary,
            fulfillmentSubsidiary = _ref2.fulfillmentSubsidiary;
        var accounts = {};
        var listSubsidiary = [];
        if (Number(receiptSubsidiary)) listSubsidiary.push(receiptSubsidiary);
        if (Number(fulfillmentSubsidiary)) listSubsidiary.push(fulfillmentSubsidiary);
        try {
            if (listSubsidiary.length === 0) throw Error('No hay subsidiarias');
            var columns = [
                'custrecord_lmry_setuptax_subsidiary',
                'custrecord_lmry_setuptax_br_debit_iful',
                'custrecord_lmry_setuptax_br_credit_irec',
                'custrecord_lmry_setuptax_br_def_inv'
            ];
            if (F_DEPARTMENTS === true || F_DEPARTMENTS === 'T') {
                columns.push('custrecord_lmry_setuptax_department');
            }
            if (F_CLASSES === true || F_CLASSES === 'T') {
                columns.push('custrecord_lmry_setuptax_class');
            }
            var searchSetupTax = search.create({
                type: 'customrecord_lmry_setup_tax_subsidiary',
                filters: [
                    ['isinactive', 'is', 'F'],
                    'AND',
                    ['custrecord_lmry_setuptax_subsidiary', 'anyof', listSubsidiary]
                ],
                columns: columns
            });
            var resultSetupTax = searchSetupTax.run().getRange(0, 2);
            if (resultSetupTax && resultSetupTax.length) {
                for (var i = 0; i < resultSetupTax.length; i++) {
                    // var accountSub = results_setup[i].getValue(columns[0]).trim().toUpperCase();
                    var sub = resultSetupTax[i].getValue('custrecord_lmry_setuptax_subsidiary');
                    if (sub === fulfillmentSubsidiary) {
                        accounts.debitFul = resultSetupTax[i].getValue('custrecord_lmry_setuptax_br_debit_iful') || '';
                        accounts.defaultFul = resultSetupTax[i].getValue('custrecord_lmry_setuptax_br_def_inv') || '';
                        accounts.deptFul = resultSetupTax[i].getValue('custrecord_lmry_setuptax_department') || '';
                        accounts.classFul = resultSetupTax[i].getValue('custrecord_lmry_setuptax_class') || '';
                    } else if (sub === receiptSubsidiary) {
                        accounts.creditReceipt =
                            resultSetupTax[i].getValue('custrecord_lmry_setuptax_br_credit_irec') || '';
                        accounts.defaultReceipt =
                            resultSetupTax[i].getValue('custrecord_lmry_setuptax_br_def_inv') || '';
                        accounts.deptReceipt = resultSetupTax[i].getValue('custrecord_lmry_setuptax_department') || '';
                        accounts.classReceipt = resultSetupTax[i].getValue('custrecord_lmry_setuptax_class') || '';
                    }
                }
            }
        } catch (error) {
            log.error('LMRY_AdjustVoidInventoryItem_LBRY_V2.0.js - [getAccounts]', error);
            // libraryEmail.sendemail(' [ devolverAccounts ] ' + error, scriptName);
        }
        return accounts;
    }
    function getTaxResults(recordId) {
        var taxResults = [];
        if (recordId) {
            var searchTaxResults = search.create({
                type: 'customrecord_lmry_br_transaction',
                filters: [['custrecord_lmry_br_transaction', 'anyof', recordId]],
                columns: ['internalid', 'custrecord_lmry_tax_type']
            });
            var results = searchTaxResults.run().getRange(0, 1000);
            if (results) {
                for (var i = 0; i < results.length; i++) {
                    taxResults.push({
                        taxtype: results[i].getValue('custrecord_lmry_tax_type'),
                        id: results[i].getValue('internalid')
                    });
                }
            }
        }
        return taxResults;
    }
    function deleteTaxResults(taxResults) {
        // Modificando a cero los campos BASE AMOUNT/TOTAL/TOTAL BASE CURRENCY de los records del Tax Results
        for (var i = 0; i < taxResults.length; i++) {
            var id = taxResults[i].id;
            record.submitFields({
                type: 'customrecord_lmry_br_transaction',
                id: id,
                values: {
                    custrecord_lmry_base_amount: 0,
                    // LATAM - BASE AMOUNT
                    custrecord_lmry_br_total: 0,
                    // LATAM - TOTAL
                    custrecord_lmry_total_base_currency: 0,
                    // LATAM - TOTAL BASE CURRENCY
                    custrecord_lmry_base_amount_local_currc: 0,
                    // LATAM - BASE AMOUNT LOCAL CURRENCY
                    custrecord_lmry_amount_local_currency: 0,
                    // LATAM - AMOUNT LOCAL CURRENCY
                    custrecord_lmry_gross_amt_local_curr: 0,
                    // LATAM - GROSS AMT LOCAL CURRENCY
                    custrecord_lmry_discount_amt_local_curr: 0,
                    // LATAM - DISCOUNT AMT LOCAL CURRENCY
                    custrecord_lmry_gross_amt: 0,
                    // LATAM - GROSS AMOUNT ITEM
                    custrecord_lmry_discount_amt: 0 // LATAM - DISCOUNT AMOUNT
                }
            });
        }
    }

    return {
        voidFulfillment: voidFulfillment,
        voidReceipt: voidReceipt
    };
});
