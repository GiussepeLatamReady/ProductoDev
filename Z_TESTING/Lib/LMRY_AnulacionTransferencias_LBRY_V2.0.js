/* eslint-disable line-comment-position */
/* eslint-disable no-eq-null */
/* eslint-disable eqeqeq */
/* eslint-disable camelcase */
/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_AnulacionTransferencias_LBRY_V2.0.js        ||
||                                                              ||
||  Version   Date         Author        Remarks                ||
||  2.0     14 Nov 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

define([
    'N/record',
    'N/runtime',
    'N/log',
    'N/search',
    'N/format',
    'N/transaction',
    './LMRY_IP_libSendingEmailsLBRY_V2.0'
], function (record, runtime, log, search, format, transaction, libraryEmail) {
    var LMRY_script = 'LMRY_AnulacionTransferencias_LBRY_V2.0.js';
    // Features
    var F_DEPARTMENTS = false;
    var F_LOCATIONS = false;
    var F_CLASSES = false;
    var F_DEPTMANDATORY = false;
    var F_CLASSMANDATORY = false;
    var F_LOCMANDATORY = false;
    var deptFinal = '';
    var classFinal = '';
    var createdFrom = '';

    function anulacionTransferencia(rcdItemFulfillment) {
        var transactionType = rcdItemFulfillment.recordType;
        var itemsTransferPrice = {};
        var itemsWithoutTransfPrice = {};
        var accounts = {};
        var itemLocation = '';
        var flag = true;
        var subsidiaries = [];
        var _class = '';
        var department = '';
        var subReceipt = '';
        var idItemReceipt = '';
        var response = {
            idInvAdjustment: null,
            error: null
        };
        response[transactionType] = rcdItemFulfillment.id;

        try {
            F_DEPARTMENTS = runtime.isFeatureInEffect({ feature: 'DEPARTMENTS' });
            F_LOCATIONS = runtime.isFeatureInEffect({ feature: 'LOCATIONS' });
            F_CLASSES = runtime.isFeatureInEffect({ feature: 'CLASSES' });

            // Obteniendo el estado de los Features Departamento / Clase / Localización
            F_DEPTMANDATORY = runtime.getCurrentScript().getParameter({ name: 'DEPTMANDATORY' });
            F_CLASSMANDATORY = runtime.getCurrentScript().getParameter({ name: 'CLASSMANDATORY' });
            F_LOCMANDATORY = runtime.getCurrentScript().getParameter({ name: 'LOCMANDATORY' });

            var subsidiaryItemFul = rcdItemFulfillment.getValue('subsidiary');
            subsidiaries.push(subsidiaryItemFul);
            createdFrom = rcdItemFulfillment.getValue('createdfrom');
            log.debug('createdFrom', createdFrom);
            var locationReceipt = rcdItemFulfillment.getValue('transferlocation');

            var rcdTransferOrder = search.load({ id: 'customsearch_lmry_br_anul_transf' });
            rcdTransferOrder.filters.push(
                search.createFilter({ name: 'internalid', operator: 'anyof', values: createdFrom })
            );

            var resultTransferOrder = rcdTransferOrder.run().getRange(0, 1);
            if (resultTransferOrder != null && resultTransferOrder.length > 0) {
                var columnsTransferOrder = resultTransferOrder[0].columns;
                var subReceipt = resultTransferOrder[0].getValue(columnsTransferOrder[0]);
                subsidiaries.push(subReceipt);
                idItemReceipt = resultTransferOrder[0].getValue(columnsTransferOrder[1]);
                log.debug('idItemReceipt', idItemReceipt);

                if (F_DEPARTMENTS == true || F_DEPARTMENTS == 'T') {
                    if (
                        resultTransferOrder[0].getValue(columnsTransferOrder[2]) != null &&
                        resultTransferOrder[0].getValue(columnsTransferOrder[2]) != ''
                    ) {
                        department = resultTransferOrder[0].getValue(columnsTransferOrder[2]);
                    }
                }

                if (F_CLASSES == true || F_CLASSES == 'T') {
                    if (
                        resultTransferOrder[0].getValue(columnsTransferOrder[columnsTransferOrder.length - 1]) !=
                            null &&
                        resultTransferOrder[0].getValue(columnsTransferOrder[columnsTransferOrder.length - 1]) != ''
                    ) {
                        _class = resultTransferOrder[0].getValue(columnsTransferOrder[columnsTransferOrder.length - 1]);
                    }
                }
            }

            // Devuelve las cuentas configuradas en el record LatamReady - Setup Tax Subsidiary para la creación del Inventory Adjustment
            devolverAccounts(subsidiaries, accounts, subsidiaryItemFul, subReceipt);

            // Devuelve las líneas de la transacción
            itemLocation = devolverLineas(rcdItemFulfillment, itemsTransferPrice, itemsWithoutTransfPrice);

            if (Object.keys(itemsTransferPrice).length) {
                if (accounts.debitFul != '' && accounts.creditReceipt != '') {
                } else {
                    flag = false;
                }
            } else if (Object.keys(itemsWithoutTransfPrice).length) {
                if (accounts.defaultFul != '' && accounts.defaultReceipt != '') {
                } else {
                    flag = false;
                }
            }

            if (flag) {
                var invAdjID = [];
                if (Object.keys(itemsTransferPrice).length) {
                    log.debug('Anulación', 'Con Transfer Price');
                    var invAdjustmentFulfillmentID = createInvAdjustment(
                        createdFrom,
                        subsidiaryItemFul,
                        accounts.debitFul,
                        itemLocation,
                        department,
                        _class,
                        accounts.deptFul,
                        accounts.classFul,
                        itemsTransferPrice,
                        1,
                        1
                    );
                    var invAdjustmentReceipt = createInvAdjustment(
                        createdFrom,
                        subReceipt,
                        accounts.creditReceipt,
                        locationReceipt,
                        department,
                        _class,
                        accounts.deptReceipt,
                        accounts.classReceipt,
                        itemsTransferPrice,
                        0,
                        1
                    );
                    if (invAdjustmentFulfillmentID && invAdjustmentReceipt) {
                        invAdjID.push(invAdjustmentFulfillmentID);
                        invAdjID.push(invAdjustmentReceipt);
                        response.idInvAdjustment = invAdjID;
                    }
                }

                if (Object.keys(itemsWithoutTransfPrice).length) {
                    log.debug('Anulación', 'Sin Transfer Price');
                    var invAdjustmentFulfillmentID = createInvAdjustment(
                        createdFrom,
                        subsidiaryItemFul,
                        accounts.defaultFul,
                        itemLocation,
                        department,
                        _class,
                        accounts.deptFul,
                        accounts.classFul,
                        itemsWithoutTransfPrice,
                        1
                    );
                    invAdjustmentReceipt = createInvAdjustment(
                        createdFrom,
                        subReceipt,
                        accounts.defaultReceipt,
                        locationReceipt,
                        department,
                        _class,
                        accounts.deptReceipt,
                        accounts.classReceipt,
                        itemsWithoutTransfPrice,
                        0
                    );
                    if (invAdjustmentFulfillmentID && invAdjustmentReceipt) {
                        invAdjID.push(invAdjustmentFulfillmentID);
                        invAdjID.push(invAdjustmentReceipt);
                        response.idInvAdjustment = invAdjID;
                    }
                }

                if (invAdjID.length > 0) {
                    // Se ponen a 0 los tax results del Item Fulfillment
                    var taxResultsFulfillment = getTaxResults(rcdItemFulfillment.id);
                    log.debug('taxResults - Item Fulfillment', taxResultsFulfillment);
                    deleteTaxResults(taxResultsFulfillment);
                    // Se actualiza la transacción para eliminar líneas del Tax Result en GL Impact
                    var trans = record.load({ type: record.Type.ITEM_FULFILLMENT, id: rcdItemFulfillment.id });
                    trans.save();

                    // Se ponen a 0 los tax results del Item Receipt
                    if (idItemReceipt != '') {
                        var taxResultsReceipt = getTaxResults(idItemReceipt);
                        log.debug('taxResults - Item Receipt', taxResultsReceipt);
                        deleteTaxResults(taxResultsReceipt);
                        // Se actualiza la transacción para eliminar líneas del Tax Result en GL Impact
                        var trans = record.load({ type: record.Type.ITEM_RECEIPT, id: idItemReceipt });
                        trans.save();
                    }
                }
            } else {
                log.error(
                    'ERROR',
                    'No se han configurado correctamente las cuentas en el record LatamReady - Setup Tax Subsidiary'
                );
            }
        } catch (error) {
            response.error = {
                name: error.name,
                message: error.message || error
            };
            log.error('LMRY_AnulacionTransferencias_LBRY_V2 - [anulacionTransferencia]', error);
            libraryEmail.sendemail(' [ anulacionTransferencia ] ' + error, LMRY_script);
        }
        return response;
    }

    function devolverAccounts(subsidiaries, accounts, subsidiaryItemFul, subReceipt) {
        try {
            var columns = [
                'custrecord_lmry_setuptax_subsidiary',
                'custrecord_lmry_setuptax_br_debit_iful',
                'custrecord_lmry_setuptax_br_credit_irec',
                'custrecord_lmry_setuptax_br_def_inv'
            ];
            if (F_DEPARTMENTS == true || F_DEPARTMENTS == 'T') {
                columns.push('custrecord_lmry_setuptax_department');
            }

            if (F_CLASSES == true || F_CLASSES == 'T') {
                columns.push('custrecord_lmry_setuptax_class');
            }

            var search_setup = search.create({
                type: 'customrecord_lmry_setup_tax_subsidiary',
                filters: [
                    ['isinactive', 'is', 'F'],
                    'AND',
                    ['custrecord_lmry_setuptax_subsidiary', 'anyof', subsidiaries]
                ],
                columns: columns
            });

            var results_setup = search_setup.run().getRange(0, 2);
            if (results_setup && results_setup.length) {
                for (var i = 0; i < results_setup.length; i++) {
                    // var accountSub = results_setup[i].getValue(columns[0]).trim().toUpperCase();
                    var sub = results_setup[i].getValue('custrecord_lmry_setuptax_subsidiary');
                    if (sub == subsidiaryItemFul) {
                        accounts.debitFul = results_setup[i].getValue('custrecord_lmry_setuptax_br_debit_iful') || '';
                        accounts.defaultFul = results_setup[i].getValue('custrecord_lmry_setuptax_br_def_inv') || '';
                        accounts.deptFul = results_setup[i].getValue('custrecord_lmry_setuptax_department') || '';
                        accounts.classFul = results_setup[i].getValue('custrecord_lmry_setuptax_class') || '';
                    } else if (sub == subReceipt) {
                        accounts.creditReceipt =
                            results_setup[i].getValue('custrecord_lmry_setuptax_br_credit_irec') || '';
                        accounts.defaultReceipt =
                            results_setup[i].getValue('custrecord_lmry_setuptax_br_def_inv') || '';
                        accounts.deptReceipt = results_setup[i].getValue('custrecord_lmry_setuptax_department') || '';
                        accounts.classReceipt = results_setup[i].getValue('custrecord_lmry_setuptax_class') || '';
                    }
                }
            }
        } catch (error) {
            log.error('LMRY_AnulacionTransferencias_LBRY_V2 - [devolverAccounts]', error);
            libraryEmail.sendemail(' [ devolverAccounts ] ' + error, LMRY_script);
        }
    }

    function devolverLineas(record, itemsTransferPrice, itemsWithoutTransfPrice) {
        try {
            var itemLines = record.getLineCount({ sublistId: 'item' });
            itemLocation = 0;

            if (itemLines > 0) {
                var itemLocation = record.getSublistValue('item', 'location', 0);
                for (var i = 0; i < itemLines; i++) {
                    var itemTag = i;
                    var itemID = record.getSublistValue('item', 'item', i);
                    var itemQuantity = record.getSublistValue('item', 'quantity', i);
                    var itemPrice = record.getSublistValue('item', 'itemunitprice', i);
                    // Se agruparán las líneas según tengan Transfer Price o no
                    if (itemPrice > 0) {
                        itemsTransferPrice[itemTag] = {};
                        itemsTransferPrice[itemTag].item = itemID;
                        itemsTransferPrice[itemTag].itemQuantity = itemQuantity;
                        itemsTransferPrice[itemTag].itemPrice = itemPrice;
                    } else {
                        itemsWithoutTransfPrice[itemTag] = {};
                        itemsWithoutTransfPrice[itemTag].item = itemID;
                        itemsWithoutTransfPrice[itemTag].itemQuantity = itemQuantity;
                        itemsWithoutTransfPrice[itemTag].itemPrice = itemPrice;
                    }
                }
            }
            return itemLocation;
        } catch (error) {
            log.error('LMRY_AnulacionTransferencias_LBRY_V2 - [devolverLineas]', error);
            libraryEmail.sendemail(' [ devolverLineas ] ' + error, LMRY_script);
        }
    }

    function createInvAdjustment(
        transactionID,
        subsidiary,
        account,
        location,
        department,
        _class,
        depSetup,
        classSetup,
        arrayItems,
        type,
        transferPrice
    ) {
        try {
            var invAdjustment = record.create({
                type: record.Type.INVENTORY_ADJUSTMENT,
                isDynamic: true
            });

            invAdjustment.setValue('subsidiary', subsidiary);
            invAdjustment.setValue('account', account);
            invAdjustment.setValue('adjlocation', location);
            invAdjustment.setValue('custbody_lmry_reference_transaction', transactionID);
            invAdjustment.setValue('custbody_lmry_reference_transaction_id', transactionID);

            if (transferPrice == 1) {
                var memo = 'Reference VOID Intercompany (ID:' + createdFrom + ') - Con Transfer Price';
            } else {
                var memo = 'Reference VOID Intercompany (ID:' + createdFrom + ') - Sin Transfer Price';
            }

            getSegmentacion(invAdjustment, depSetup, classSetup, department, _class);
            if (classFinal) {
                invAdjustment.setValue('class', classFinal);
            }
            if (deptFinal) {
                invAdjustment.setValue('department', deptFinal);
            }

            invAdjustment.setValue('memo', memo);

            for (var itemID in arrayItems) {
                if (arrayItems[itemID]) {
                    var quantity = arrayItems[itemID].itemQuantity;
                    invAdjustment.selectNewLine({ sublistId: 'inventory' });
                    invAdjustment.setCurrentSublistValue({
                        sublistId: 'inventory',
                        fieldId: 'item',
                        value: arrayItems[itemID].item
                    });
                    invAdjustment.setCurrentSublistValue({
                        sublistId: 'inventory',
                        fieldId: 'location',
                        value: location
                    });
                    if (type == 0) {
                        // Si es para crear Inventory Adjustment para la reversa de Item Receipt, la cantidad va con -
                        invAdjustment.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'adjustqtyby',
                            value: -quantity
                        });
                    } else if (type == 1) {
                        // Si es para crear Inventory Adjustment para la reversa de Item Fulfillment, la cantidad va con +
                        invAdjustment.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'adjustqtyby',
                            value: quantity
                        });
                    }
                    if (transferPrice == 1) {
                        // Si tiene Transfer Price, se utiliza el monto ingresado en dicho campo
                        invAdjustment.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'unitcost',
                            value: arrayItems[itemID].itemPrice
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

                    invAdjustment.commitLine({ sublistId: 'inventory' });
                }
            }

            return invAdjustment.save();
        } catch (error) {
            log.error('LMRY_AnulacionTransferencias_LBRY_V2 - [createInvAdjustment]', error);
            libraryEmail.sendemail(' [ createInvAdjustment ] ' + error, LMRY_script);
        }
    }

    function getSegmentacion(invAdjustment, depSetup, classSetup, department, _class) {
        if (F_DEPTMANDATORY == 'T' || F_DEPTMANDATORY == true) {
            // Si el departamento en el invoice esta vacio, entonces se coloca el valor del campo "departamento" del record personalizado
            if (!department) {
                if (depSetup) {
                    deptFinal = depSetup;
                }
            } else {
                deptFinal = department;
            }
        }

        if (F_CLASSMANDATORY == 'T' || F_CLASSMANDATORY == true) {
            // Si la Clase en el invoice esta vacio, entonces se coloca el valor del campo "Clase" del record personalizado
            if (!_class) {
                if (classSetup) {
                    classFinal = classSetup;
                }
            } else {
                classFinal = _class;
            }
        }
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
                    custrecord_lmry_base_amount: 0, // LATAM - BASE AMOUNT
                    custrecord_lmry_br_total: 0, // LATAM - TOTAL
                    custrecord_lmry_total_base_currency: 0, // LATAM - TOTAL BASE CURRENCY
                    custrecord_lmry_base_amount_local_currc: 0, // LATAM - BASE AMOUNT LOCAL CURRENCY
                    custrecord_lmry_amount_local_currency: 0, // LATAM - AMOUNT LOCAL CURRENCY
                    custrecord_lmry_gross_amt_local_curr: 0, // LATAM - GROSS AMT LOCAL CURRENCY
                    custrecord_lmry_discount_amt_local_curr: 0, // LATAM - DISCOUNT AMT LOCAL CURRENCY
                    custrecord_lmry_gross_amt: 0, // LATAM - GROSS AMOUNT ITEM
                    custrecord_lmry_discount_amt: 0 // LATAM - DISCOUNT AMOUNT
                }
            });
        }
    }

    return {
        anulacionTransferencia: anulacionTransferencia
    };
});
