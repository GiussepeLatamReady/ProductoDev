/** 
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_BR_VOID_INVENTORY_TRAN_LBRY_V2.0.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 24/04/2024
 */
define([
    'N/record',
    'N/runtime',
    'N/log',
    'N/search'
], function (record, runtime, log, search) {
    var F_DEPARTMENTS = runtime.isFeatureInEffect({
        feature: 'DEPARTMENTS'
    });

    var F_CLASSES = runtime.isFeatureInEffect({
        feature: 'CLASSES'
    });

    function voidReceipt(recordReceipt) {
        var status = {
            idInvAdjustment: [],
            error: null
        };
        var transferOrderID = recordReceipt.getValue('createdfrom');
        if(isTransferOrder(transferOrderID)) {
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
                var trans = record.load({
                    type: record.Type.ITEM_RECEIPT,
                    id: recordReceipt.id
                });
                trans.setValue('memo', "voided transaction");
                trans.save();
            } catch (error) {
                status.error = {
                    name: error.name,
                    message: error.message || error
                };
                log.error('LMRY_AnulacionTransferencias_LBRY_V2 - [anulacion Item receipt]', error);
            }
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
            return error;
        }
    }
    function getApplyTransactionsByTransferOrder(transferOrderID) {
        var rcdTransferOrder = search.load({
            id: 'customsearch_lmry_br_anul_transf'
        });

        rcdTransferOrder.filters.push(
            search.createFilter({
                name: 'internalid',
                operator: 'anyof',
                values: transferOrderID
            })
        );

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
        }
        return accounts;
    }

    function isTransferOrder(id){
        if (!id) return false;
        var recordType;
        var searchTransaction = search.create({
            type: 'transaction',
            filters: [
                ['internalid', 'anyof', id],
                "AND", 
                ["mainline","is","T"]
            ],
            columns: [
                'recordType'
            ]
        })

        searchTransaction.run().each(function (result) {
            recordType = result.getValue('recordType');
        });

        return recordType == "transferorder";
    }
    return {
        voidFulfillment: voidFulfillment,
        voidReceipt: voidReceipt
    };
});
