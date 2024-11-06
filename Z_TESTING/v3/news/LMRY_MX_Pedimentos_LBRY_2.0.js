"use strict";

/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_MX_Pedimentos_LBRY_2.0.js                   ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     16 Ago 2022  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
//@ts-check
// @ts-ignore
define(["N/query", "N/search", "N/record", "N/log","N/runtime","N/format"], function (query, search, record, log, runtime, format) {
    /**
     * 
     * @param {Object} recordObj 
     */
    function createMXTransactionbyPediment(recordObj,isReceiptDeferral,idPurchaseOrder) {
        var nroPedimento = recordObj.getValue("custpage_mx_nro_pedimento");
        var pedimentoAduana = recordObj.getValue("custpage_mx_pedimento_aduana");
        var pedimentoDate = recordObj.getValue("custpage_mx_pedimento_date");
        var isValid = validateLinesxPedimento(nroPedimento);
        log.error("isValid",isValid)
        
        //automatico
        var fifo = recordObj.getValue('custpage_mx_pedimento_au_fifo');
        var lifo = recordObj.getValue('custpage_mx_pedimento_au_lifo');
        log.error("fifo",fifo)
        if (fifo === 'T' || lifo === 'T' || isValid) {
            var recordMxtransaction = searchMxtransaction(recordObj.id);
            if (recordMxtransaction.length > 0) {
                recordMxtransaction.forEach(function (Mxtransaction) {
                    updateMxTransaction(nroPedimento, pedimentoAduana, Mxtransaction.id, fifo, lifo,pedimentoDate);
                });
            } else {
                var mxTransaction = record.create({
                    type: "customrecord_lmry_mx_transaction_fields",
                    isDynamic: false
                });
                mxTransaction.setValue({
                    fieldId: "custrecord_lmry_mx_transaction_related",
                    value: isReceiptDeferral ? idPurchaseOrder : recordObj.id
                });
                mxTransaction.setValue({
                    fieldId: "custrecord_lmry_mx_entity_related",
                    value: recordObj.getValue("entity")
                });
                mxTransaction.setValue({
                    fieldId: "custrecord_lmry_mx_currency",
                    value: recordObj.getValue("currency")
                });
                mxTransaction.setValue({
                    fieldId: "custrecord_lmry_mx_exchange_rate",
                    value: recordObj.getValue("exchangerate")
                });
                if (isValid) mxTransaction.setValue({
                    fieldId: "custrecord_lmry_mx_pedimento",
                    value: nroPedimento
                });
                if (Number(pedimentoAduana) !== 0) mxTransaction.setValue({
                    fieldId: "custrecord_lmry_mx_pedimento_aduana",
                    value: pedimentoAduana
                });

                if (pedimentoDate) {
                    log.error("pedimentoDate", pedimentoDate)
                    //format.parse({ value: pedimentoDate, type: format.Type.DATE });
                    var dateFormat = format.parse({ value: pedimentoDate, type: format.Type.DATE });
                    log.error("dateFormat", dateFormat);
                    mxTransaction.setValue({
                        fieldId: "custrecord_lmry_mx_tf_pedimento_date",
                        value: dateFormat
                    });
                }
                
                if (fifo === 'T') mxTransaction.setValue({
                    fieldId: "custrecord_lmry_mx_pedimento_fifo",
                    value: true
                });
                if (lifo === 'T') mxTransaction.setValue({
                    fieldId: "custrecord_lmry_mx_pedimento_lifo",
                    value: true
                });
                try {
                    var mxID = mxTransaction.save();
                } catch (error) {
                    log.debug('error [createMXTransactionbyPediment]', error);
                }
            }
        }
    }
    
    function validateLinesxPedimento(numberPedimento) {
        if (numberPedimento == null || numberPedimento == '') return false;
        if (typeof numberPedimento != "string") numberPedimento = numberPedimento.toString();
        var patron = new RegExp("([0-9]){2}[ ]([0-9]){2}[ ]([0-9]){4}[ ]([0-9]){7}");
        if (patron.test(numberPedimento) && numberPedimento.length === 18) return true;
        return false;
    }

    function pedimentoIsValid(numberPedimento){
        if (!numberPedimento || !numberPedimento.trim()) return true;
        if (!validateLinesxPedimento(numberPedimento)) {
            alert("Numero de pedimento invalido");
            return false;
        }else{
            return true;
        }
    }

    function showMXTransactionbyPedimentFields(form, id, type, eventType) {
        var fieldPedimento;
        var fieldAduana;
        var fieldDate;
        if (type === 'transferorder' || type === 'purchaseorder' || type == 'inventoryadjustment') {
            var aduanaSearch = search.create({
                type: 'customrecord_lmry_mx_aduana',
                columns: ['internalid', 'name'],
                filters: [['isinactive', 'is', 'F']]
            });
            var aduanas = aduanaSearch.run().getRange(0, 1000);
            fieldPedimento = form.addField({
                label: "Latam - MX Nro Pedimento",
                id: "custpage_mx_nro_pedimento",
                type: "text"
            });
            fieldAduana = form.addField({
                label: "Latam - MX Pedimento Aduana",
                id: "custpage_mx_pedimento_aduana",
                type: "select"
            });
            fieldAduana.addSelectOption({
                value: "0",
                text: " "
            });
            aduanas.forEach(function (aduana) {
                fieldAduana.addSelectOption({
                    value: aduana.getValue("internalid"),
                    text: aduana.getValue("name")
                });
            });

            fieldDate = form.addField({
                label: "Latam - MX Pedimento Date",
                id: "custpage_mx_pedimento_date",
                type: "date"
            });

            if (eventType && eventType !== "view") fieldDate.defaultValue = new Date();
        }


        if (type === 'transferorder' || type === 'salesorder') {
            var fifoFiedl = form.addField({
                label: "Latam - Pedimento automático FIFO",
                id: "custpage_mx_pedimento_au_fifo",
                type: 'checkbox'
            });

            fifoFiedl.defaultValue = 'T';
            require(['N/ui/serverWidget'], function (serverWidget) {
                fifoFiedl.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            });
            
        }
        if (type === 'returnauthorization' || type === 'vendorreturnauthorization') {
            var lifoFiedl = form.addField({
                label: "Latam - Pedimento automático LIFO",
                id: "custpage_mx_pedimento_au_lifo",
                type: 'checkbox'
            });
            lifoFiedl.defaultValue = 'T';

            require(['N/ui/serverWidget'], function (serverWidget) {
                lifoFiedl.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            });
            
        }

        var valuesMxTransaction = searchMxtransaction(id);
        if (valuesMxTransaction.length > 0) {
            if (validateLinesxPedimento(valuesMxTransaction[0].custrecord_lmry_mx_pedimento)) fieldPedimento.defaultValue = valuesMxTransaction[0].custrecord_lmry_mx_pedimento;
            if (Number(valuesMxTransaction[0].custrecord_lmry_mx_pedimento_aduana)) fieldAduana.defaultValue = valuesMxTransaction[0].custrecord_lmry_mx_pedimento_aduana;
            if (type === 'transferorder' || type === 'salesorder') {
                fifoFiedl.defaultValue = valuesMxTransaction[0].custrecord_lmry_mx_pedimento_fifo;
            }
            if (type === 'returnauthorization' || type === 'vendorreturnauthorization') {
                lifoFiedl.defaultValue = valuesMxTransaction[0].custrecord_lmry_mx_pedimento_lifo;
            }
            var pedimentoDate = valuesMxTransaction[0].custrecord_lmry_mx_tf_pedimento_date;
            if (pedimentoDate) {
                fieldDate.defaultValue = format.parse({ value: pedimentoDate, type: format.Type.DATE });
            }
            
        }
    }
    /**
     * 
     * @param {number} nroPedimento 
     * @param {number} idAduana 
     */
    function updateMxTransaction(nroPedimento, idAduana, idMxTransactionFields, fifo, lifo,pedimentoDate) {
        var values = {};
        if (nroPedimento) values['custrecord_lmry_mx_pedimento'] = nroPedimento;
        if (Number(idAduana) !== 0) values["custrecord_lmry_mx_pedimento_aduana"] = idAduana;
        if (fifo === 'T') values["custrecord_lmry_mx_pedimento_fifo"] = fifo;
        if (lifo === 'T') values["custrecord_lmry_mx_pedimento_lifo"] = lifo;
        if (pedimentoDate) values["custrecord_lmry_mx_tf_pedimento_date"] = pedimentoDate;
        record.submitFields({
            type: "customrecord_lmry_mx_transaction_fields",
            id: idMxTransactionFields,
            values: values
        });
    }
    /**
     * Funcion de busqueda de record MX Transaction previo a la actualizacion de datos
     * @param {number} IdPurchaseOrder ID del purchase order
     * @returns {Array<object>} resultados de la busqueda
     */
    function searchMxtransaction(IdPurchaseOrder) {
        if (!Number(IdPurchaseOrder)) return [];
        var MxTransactions = query.runSuiteQL({
            query: "\n SELECT\n id,\n custrecord_lmry_mx_transaction_related,\n custrecord_lmry_mx_pedimento_aduana,\n custrecord_lmry_mx_pedimento\n ,\n custrecord_lmry_mx_pedimento_fifo ,\n custrecord_lmry_mx_pedimento_lifo ,\n custrecord_lmry_mx_tf_pedimento_date \n FROM\n CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS\n  WHERE\n custrecord_lmry_mx_transaction_related = " + IdPurchaseOrder + "\n"
        }).asMappedResults();
        return MxTransactions;
    }
    function isValidItemsTransaction(recordObj) {
        var message = 'ok';
        var items = getItems(recordObj);
        if (items.length === 0) message = 'Error no hay lineas seleccionadas';

        items.forEach(function (itemLine) {
            var listPediment = getPedimentos(itemLine.itemid, itemLine.location, itemLine.lote, false);
            var sumQuantityDisp = 0;
            var quantitytotal = itemLine.quantity;

            for (var i = 0; i < listPediment.length; i++) {
                var jsonPediment1 = JSON.parse(JSON.stringify(listPediment[i]));
                var ped_quantity = Number(jsonPediment1.values["SUM(custrecord_lmry_mx_ped_quantity)"]);
                var aduana = jsonPediment1.values["GROUP(custrecord_lmry_mx_ped_aduana)"][0].value;
                if (aduana) {
                    sumQuantityDisp += ped_quantity;
                }
            }

            if (quantitytotal > sumQuantityDisp) {
                message = 'Error no hay suficiente stock ';
            } else {
                for (var i = 0; i < listPediment.length; i++) {
                    var jsonPediment = JSON.parse(JSON.stringify(listPediment[i]));
                    var ped_quantity = Number(jsonPediment.values["SUM(custrecord_lmry_mx_ped_quantity)"]);
                    var aduana = Number(jsonPediment.values["GROUP(custrecord_lmry_mx_ped_aduana)"][0].value);

                    if (aduana > 0 && ped_quantity > 0) {

                        if (ped_quantity == quantitytotal) {


                            quantitytotal = quantitytotal - ped_quantity;
                            break;
                        };
                        if (ped_quantity > quantitytotal) {

                            quantitytotal = quantitytotal - ped_quantity;
                            break;
                        };
                        if (ped_quantity < quantitytotal) {

                            quantitytotal = quantitytotal - ped_quantity;
                        }

                    } else {
                        continue;
                    }
                }
                if (quantitytotal > 0) message = ' Error no hay suficiente stock';
            };
        });
        return message;
    }
    function getItems(recordObj) {
        //busqueda pedimentos de tipo kit package

        var recordShipment = recordObj;
        var listItems = [];

        var numItems = recordShipment.getLineCount({ sublistId: "item" });
        var kitItemxPediment = {};
        for (var i = 0; i < numItems; i++) {
            var pedimentoItem = {};
            if (recordShipment.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i }) === "Kit" &&
                (recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'itemreceive', line: i }) == 'T' ||
                    recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'itemreceive', line: i }) == true)) {

                kitItemxPediment[recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitlineid', line: i })] = recordShipment.getSublistText({ sublistId: "item", fieldId: "custcol_lmry_mx_pediment", line: i });
            }
            if (recordShipment.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i }) === "Kit" || recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitmemberof', line: i }) === "") continue;
            if (kitItemxPediment[recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitmemberof', line: i })] === "F" || kitItemxPediment[recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitmemberof', line: i })] === false) continue;

            var trandate = recordShipment.getValue("trandate");
            var itemID = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            var location = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i });
            var quantity = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
            var itemDescription = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'itemdescription', line: i });

            var inventoryDetail = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'inventorydetailavail', line: i });
            if (inventoryDetail == 'T' || inventoryDetail == true) {
                recordShipment.selectLine({
                    sublistId: 'item',
                    line: i
                });
                var inventorydetailRecord = recordShipment.getCurrentSublistSubrecord({
                    sublistId: 'item', fieldId: 'inventorydetail'
                });
                var cLineas = inventorydetailRecord.getLineCount({ sublistId: 'inventoryassignment' });
                for (var j = 0; j < cLineas; j++) {
                    var pedimentoItema = {};
                    var lote = inventorydetailRecord.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: j });

                    var loteQuantity = inventorydetailRecord.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', line: j });
                    if (Number(itemID))
                        pedimentoItema.itemid = itemID;

                    if (itemDescription != null && itemDescription != "") {
                        if (itemDescription.length > 300) {
                            itemDescription = itemDescription.substring(0, 297) + "...";
                        }
                        pedimentoItema.itemDescription = itemDescription;
                    }

                    if (Number(location))
                        pedimentoItema.location = location;

                    if (trandate != null && trandate != "")
                        pedimentoItema.date = trandate;

                    if (Number(lote))
                        pedimentoItema.lote = lote;

                    if (Number(loteQuantity)) {
                        pedimentoItema.quantity = Math.round(loteQuantity);

                    } else {
                        pedimentoItema.quantity = Math.round(quantity);

                    }
                    listItems.push(pedimentoItema);
                }
            } else {
                if (Number(itemID))
                    pedimentoItem.itemid = itemID;

                if (itemDescription != null && itemDescription != "") {
                    if (itemDescription.length > 300) {
                        itemDescription = itemDescription.substring(0, 297) + "...";
                    }
                    pedimentoItem.itemDescription = itemDescription;
                }

                if (Number(location))
                    pedimentoItem.location = location;

                if (trandate != null && trandate != "")
                    pedimentoItem.date = trandate;

                // if (Number(lote))
                //     SubTabla.setSublistValue({ id: 'custpage_lote', line: index, value: loteText });
                if (Number(quantity))
                    pedimentoItem.quantity = Math.round(quantity);
                listItems.push(pedimentoItem);

            }

        }
        for (var i = 0; i < numItems; i++) {

            if (recordShipment.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i }) === "Kit" || recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitmemberof', line: i }) !== "") continue;
            if (recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_mx_pediment', line: i }) == 'F' || recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_mx_pediment', line: i }) == false) continue;
            if (recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'itemreceive', line: i }) === false || recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'itemreceive', line: i }) === 'F') continue;

            var trandate = recordShipment.getValue("trandate");
            var itemID = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            var location = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i });
            var quantity = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
            var itemDescription = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'itemdescription', line: i });

            var inventoryDetail = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'inventorydetailavail', line: i });
            if (inventoryDetail == 'T' || inventoryDetail == true) {

                recordShipment.selectLine({
                    sublistId: 'item',
                    line: i
                });
                var inventorydetailRecord = recordShipment.getCurrentSublistSubrecord({
                    sublistId: 'item', fieldId: 'inventorydetail'
                });
                var cLineas = inventorydetailRecord.getLineCount({ sublistId: 'inventoryassignment' });
                for (var j = 0; j < cLineas; j++) {
                    var pedimentoItema = {};
                    var lote = inventorydetailRecord.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: j });

                    var loteQuantity = inventorydetailRecord.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', line: j });
                    if (Number(itemID))
                        pedimentoItema.itemid = itemID;

                    if (itemDescription != null && itemDescription != "") {
                        if (itemDescription.length > 300) {
                            itemDescription = itemDescription.substring(0, 297) + "...";
                        }
                        pedimentoItema.itemDescription = itemDescription;
                    }

                    if (Number(location))
                        pedimentoItema.location = location;

                    if (trandate != null && trandate != "")
                        pedimentoItema.date = trandate;

                    if (Number(lote))
                        pedimentoItema.lote = lote;

                    if (Number(loteQuantity)) {
                        pedimentoItema.quantity = Math.round(loteQuantity);

                    } else {
                        pedimentoItema.quantity = Math.round(quantity);

                    }
                    listItems.push(pedimentoItema);
                }
            } else {
                if (Number(itemID))
                    pedimentoItem.itemid = itemID;

                if (itemDescription != null && itemDescription != "") {
                    if (itemDescription.length > 300) {
                        itemDescription = itemDescription.substring(0, 297) + "...";
                    }
                    pedimentoItem.itemDescription = itemDescription;
                }

                if (Number(location))
                    pedimentoItem.location = location;

                if (trandate != null && trandate != "")
                    pedimentoItem.date = trandate;

                // if (Number(lote))
                //     SubTabla.setSublistValue({ id: 'custpage_lote', line: index, value: loteText });
                if (Number(quantity))
                    pedimentoItem.quantity = Math.round(quantity);
                listItems.push(pedimentoItem);

            }

        }
        return listItems;
    }
    function getPedimentos(item_id, location_id, lote_id, isFifo) {

        if (item_id === null || location_id === null) return [];
        var Filter_Pedimento = [];

        var Filter_Item = search.createFilter({
            name: "custrecord_lmry_mx_ped_item",
            operator: search.Operator.IS,
            values: item_id,
        });

        var Filter_Location = search.createFilter({
            name: "custrecord_lmry_mx_ped_location",
            operator: search.Operator.IS,
            values: location_id,
        });

        Filter_Pedimento.push(Filter_Item);
        Filter_Pedimento.push(Filter_Location);

        if (lote_id) {
            var Filter_Inventory = search.createFilter({
                name: "custrecord_lmry_mx_ped_lote_serie",
                operator: search.Operator.ANYOF,
                values: lote_id,
            });
            Filter_Pedimento.push(Filter_Inventory);
        }

        var search_pedimento_details = search.create({
            type: "customrecord_lmry_mx_pedimento_details",
            filters: Filter_Pedimento,
            columns: [
                search.createColumn({
                    name: "custrecord_lmry_mx_ped_num",
                    summary: "GROUP",
                    label: "Latam - MX Nro Pedimento",
                }),
                search.createColumn({
                    name: "custrecord_lmry_mx_ped_quantity",
                    summary: "SUM",
                    label: "Latam - MX Pedimento Quantity",
                }),
                search.createColumn({
                    name: "custrecord_lmry_mx_ped_date",
                    summary: "GROUP",
                    label: "Latam - MX Pedimento Date",
                    sort: !isFifo ? search.Sort.DESC : search.Sort.ASC,
                }),
                search.createColumn({
                    name: "custrecord_lmry_mx_ped_aduana",
                    summary: "GROUP",
                    label: "Latam - MX Aduana",
                }),
            ],
        });

        var result_pedimento_details = search_pedimento_details
            .run()
            .getRange(0, 1000);
        return result_pedimento_details;
    }

    function updateLinesUsePedimentos(recordObj) {
        var nLines = recordObj.getLineCount({
            sublistId: "item"
        });

        var listItems = [];
        for (var index = 0; index < nLines; index++) {
            listItems.push(recordObj.getSublistValue({
                sublistId: "item",
                fieldId: "item",
                line: index
            }));
        };

        var listUsePedimentos = {};
        log.error("listItems",listItems)
        if (listItems.length) {
            search.create({
                type: "item",
                filters:
                    [
                        ["internalid", "anyof", listItems]
                    ],
                columns:
                    ["internalid", "custitem_lmry_mx_pediment"]
            }).run().each(function (result) {
                var internalid = result.getValue("internalid");
                var usePedimento = result.getValue("custitem_lmry_mx_pediment");
                listUsePedimentos[internalid] = usePedimento === "T" || usePedimento === true;
                return true;
            });
    
            for (var index = 0; index < nLines; index++) {
                var itemID = recordObj.getSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    line: index
                });
    
                if (listUsePedimentos[itemID]) {
                    recordObj.setSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_lmry_mx_pediment",
                        line: index,
                        value: true
                    });
                }
            };
        }
        
    }

    function getTranslations() {
        var language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
        language = ["es", "pt"].indexOf(language) != -1 ? language : "en";
    
        var translatedFields = {
            "es": {
                "NO_LINES_SELECTED": "No hay líneas seleccionadas",
                "INSUFFICIENT_STOCK": "Error no hay suficiente stock",
                "PEDIMENTO_SUCCESS": "Pedimento creado con éxito",
                "PEDIMENTO_ERROR_DETAIL": "Error al crear el pedimento Detail",
                "PEDIMENTO_EXISTS": "Ya existen pedimentos",
                "NO_MX_TRANSACTION": "No hay Mx Transaction"
            },
            "en": {
                "NO_LINES_SELECTED": "No lines selected",
                "INSUFFICIENT_STOCK": "Error not enough stock",
                "PEDIMENTO_SUCCESS": "Pedimento created successfully",
                "PEDIMENTO_ERROR_DETAIL": "Error creating pedimento Detail",
                "PEDIMENTO_EXISTS": "Pedimentos already exist",
                "NO_MX_TRANSACTION": "No Mx Transaction"
            },
            "pt": {
                "NO_LINES_SELECTED": "Nenhuma linha selecionada",
                "INSUFFICIENT_STOCK": "Erro não há estoque suficiente",
                "PEDIMENTO_SUCCESS": "Pedimento criado com sucesso",
                "PEDIMENTO_ERROR_DETAIL": "Erro ao criar o pedimento Detalhe",
                "PEDIMENTO_EXISTS": "Já existem pedimentos",
                "NO_MX_TRANSACTION": "Não há Transação Mx"
            }
        };
    
        return translatedFields[language];
    }

    function isAutomaticPedimentos(idSubsidiary) {
        var featPedimentos = false;
        var featureSubs = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
        if (featureSubs == true || featureSubs == 'T') {
            if (idSubsidiary) {
                search.create({
                    type: 'customrecord_lmry_setup_tax_subsidiary',
                    columns: ['custrecord_lmry_setuptax_pediment_automa'],
                    filters: [
                        ['custrecord_lmry_setuptax_subsidiary', 'anyof', idSubsidiary],
                        "AND",
                        ["isinactive", "is", "F"]
                    ]
                }).run().each(function (result) {
                    featPedimentos = result.getValue('custrecord_lmry_setuptax_pediment_automa');
                    featPedimentos = featPedimentos === "T" || featPedimentos === true;
                });
            }
        }
        return featPedimentos;
    }

    function formatDate(date) {
        var parseDate = format.parse({ value: date, type: format.Type.DATE });
        parseDate = format.format({ type: format.Type.DATE, value: parseDate });

        return parseDate;
    }
    return {
        showMXTransactionbyPedimentFields: showMXTransactionbyPedimentFields,
        createMXTransactionbyPediment: createMXTransactionbyPediment,
        isValidItemsTransaction: isValidItemsTransaction,
        updateLinesUsePedimentos:updateLinesUsePedimentos,
        pedimentoIsValid:pedimentoIsValid,
        isAutomaticPedimentos: isAutomaticPedimentos
    };
});