/**
*@NApiVersion 2.1
*@NScriptType Restlet
*@Name LMRY_MX_Pedimentos_resltet.js
*/
//@ts-check
// @ts-ignore
define(["N/log", "N/search", "N/record", 'N/runtime', 'N/format', 'N/query', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],
    function (log, search, record, runtime, format, query, library_mail) {

        function get(parameters) {
            const translation = getTranslations();
            try {
                const idRecord = parameters.idRecord;
                const type = search.lookupFields({
                    type: 'transaction',
                    id: idRecord,
                    columns: ['type']
                }).type[0].value;
                let dataTransaction;
                let isReceipt = true;
                let flagTransfer = false;
                let fromLocation;
                if (type == "InvAdjst") {
                    dataTransaction = search.lookupFields({
                        type: search.Type.INVENTORY_ADJUSTMENT,
                        id: idRecord,
                        columns: [
                            'subsidiary',
                            'createdfrom',
                            'trandate'
                        ]
                    });
                    dataTransaction['createdfrom']= [{value:idRecord}];
                    dataTransaction['isAdjustment']= true;
                    return createPedimentoForInventoryAdj(dataTransaction,idRecord,translation);
                } else {
                    isReceipt = type === "ItemRcpt" ? true : false;
                    //INVENTORY_ADJUSTMENT
                    dataTransaction = search.lookupFields({
                        type: !isReceipt ? search.Type.ITEM_FULFILLMENT : search.Type.ITEM_RECEIPT,
                        id: idRecord,
                        columns: [
                            'subsidiary',
                            'createdfrom',
                            'trandate',
                            'transferlocation'
                        ]
                    });
                    const transactionOgirinType = search.lookupFields({
                        type: 'transaction',
                        id: dataTransaction['createdfrom'][0]?.value,
                        columns: ['type','transferlocation']
                    });
                    if (transactionOgirinType.type[0].value == 'TrnfrOrd') {
                        flagTransfer = true;
                        fromLocation = transactionOgirinType.transferlocation[0].value
                    }
                }
               
                const { isAutomatic, automaticType } = getAutomaticType(dataTransaction['createdfrom'][0]?.value);

                if (isAutomatic) {
                    const items = getItems(idRecord, isReceipt);
                    if (items.length === 0) return translation.NO_LINES_SELECTED;
                    let listSelected = [];
                    let listCreated = [];
                    if (!isReceipt) {
                        items.forEach((itemLine) => {
                            const listPediment = getPedimentos(itemLine.itemid, itemLine.location, itemLine.lote, (automaticType === 1 ? true : false));
                            let sumQuantityDisp = 0;
                            let quantitytotal = itemLine.quantity;
                            for (let i = 0; i < listPediment.length; i++) {
                                const jsonPediment = JSON.parse(JSON.stringify(listPediment[i]));
                                let ped_quantity = Number(jsonPediment.values["SUM(custrecord_lmry_mx_ped_quantity)"]);
                                let aduana = jsonPediment.values["GROUP(custrecord_lmry_mx_ped_aduana)"][0]?.value;
                                if (aduana) {
                                    sumQuantityDisp += ped_quantity;
                                }
                            }
                            if (quantitytotal > sumQuantityDisp) {
                                throw translation.INSUFFICIENT_STOCK;
                            } else {
                                let addCount = 0;
                                for (let i = 0; i < listPediment.length; i++) {
                                    const jsonPediment = JSON.parse(JSON.stringify(listPediment[i]));
                                    let ped_quantity = Number(jsonPediment.values["SUM(custrecord_lmry_mx_ped_quantity)"]);
                                    let aduana = Number(jsonPediment.values["GROUP(custrecord_lmry_mx_ped_aduana)"][0]?.value);
                                    let datePediment = jsonPediment.values["GROUP(custrecord_lmry_mx_ped_date)"]
                                    
                                    if (aduana > 0 && ped_quantity > 0) {
                                        itemLine['datePediment'] = datePediment;
                                        
                                        if (ped_quantity == quantitytotal) {
                                            listSelected.push({ pediment: jsonPediment, nroItems: quantitytotal, itemLine });
                                            quantitytotal = quantitytotal - ped_quantity;
                                            addCount++;
                                            break;
                                        };
                                        if (ped_quantity > quantitytotal) {
                                            listSelected.push({ pediment: jsonPediment, nroItems: quantitytotal, itemLine });
                                            quantitytotal = quantitytotal - ped_quantity;
                                            addCount++;
                                            break;
                                        };
                                        if (ped_quantity < quantitytotal) {
                                            listSelected.push({ pediment: jsonPediment, nroItems: ped_quantity, itemLine });
                                            quantitytotal = quantitytotal - ped_quantity;
                                            addCount++;
                                        }
    
                                    } else {
                                        continue;
                                    }
                                }
                                if (quantitytotal > 0 && addCount !==0) listSelected.slice(addCount*(-1)) //throw translation.INSUFFICIENT_STOCK;
                            };
                        });
                    }
                    
                    if (flagTransfer && isReceipt == true) {
                        const jsonPedimentos = getInfoMXtransaction(dataTransaction['createdfrom'][0]?.value)[0].custrecord_lmry_mx_pedimento_transfer;
                        const auxJson = JSON.parse(jsonPedimentos);
                        if (typeof auxJson === 'object')
                            listSelected = auxJson;
                    }
                    listCreated = createPedimenetByList(listSelected, dataTransaction, idRecord, isReceipt, flagTransfer && isReceipt ? fromLocation: null);

                    if (flagTransfer && isReceipt == false) {
                        const jsonPedimentos = getInfoMXtransaction(dataTransaction['createdfrom'][0]?.value);
                        if (Number(jsonPedimentos[0].id))
                            record.submitFields({
                                type: 'customrecord_lmry_mx_transaction_fields',
                                id: jsonPedimentos[0].id,
                                values: {
                                    custrecord_lmry_mx_pedimento_transfer: JSON.stringify(listSelected)
                                },
                            });
                    }

                    return translation.PEDIMENTO_SUCCESS;
                } else {
                    let respuesta;
                    if (flagTransfer && isReceipt) {
                        const jsonPedimentos = getInfoMXtransaction(dataTransaction['createdfrom'][0]?.value).custrecord_lmry_mx_pedimento_transfer;
                        respuesta = createPedimentoDetailRecord(dataTransaction, idRecord, isReceipt, flagTransfer, jsonPedimentos,translation);
                    } else {
                        respuesta = createPedimentoDetailRecord(dataTransaction, idRecord, isReceipt, flagTransfer, null,translation);
                    }
                    return respuesta;
                }

            } catch (error) {
                log.error({
                    title: 'error',
                    details: error
                });
                if (typeof error == 'string') return error;
                library_mail.sendemail2(' [ pedimentosReslet ] ' + error, 'lmry_MX_pedimentos_resltet', null, 'tranid', 'entity');
                return translation.PEDIMENTO_ERROR_DETAIL;
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
        
        function getItems(shipmentID, isReceipt) {
            let FEAT_INVENTORY = runtime.isFeatureInEffect({ feature: "advbinseriallotmgmt" });
            const listItems = [];
            //Filtro por transacción
            let Filter_Trans = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: shipmentID });

            /* Busqueda personalizada LatamReady - MX Pediment Lines*/
            // Devuelve las líneas de item de las transacciones que cuentan con check activado de pedimento
            let search_items_ped = search.load({ id: 'customsearch_lmry_mx_ped_receipt_lines' });

            search_items_ped.filters.push(Filter_Trans);
            search_items_ped.columns.push(search.createColumn({
                name: "purchasedescription",
                join: "item"
            }));
            let colFields = search_items_ped.columns;

            let result_items_ped = search_items_ped.run().getRange(0, 1000);
            if (result_items_ped.length > 0) {
                for (let i = 0; i < result_items_ped.length; i++) {
                    const pedimentoItem = {};
                    let ITEM_ID = "" + result_items_ped[i].getValue(colFields[5]);
                    let ITEM_NAME = "" + result_items_ped[i].getText(colFields[5]);
                    let LOCATION_ID = "" + result_items_ped[i].getValue(colFields[3]);
                    let INVENTORY_DETAIL = "";
                    let INVENTORY_NUMBER;

                    if (FEAT_INVENTORY == true || FEAT_INVENTORY == 'T') {
                        INVENTORY_DETAIL = "" + result_items_ped[i].getValue(colFields[6]);
                        INVENTORY_NUMBER = "" + result_items_ped[i].getValue(colFields[8]);
                    }

                    let ITEM_DESCRIPTION = result_items_ped[i].getValue(colFields[9]) || "";
                    if (ITEM_DESCRIPTION.length > 300) {
                        ITEM_DESCRIPTION = ITEM_DESCRIPTION.substring(0, 297) + "...";
                    }
                    pedimentoItem.itemid = ITEM_ID;


                    if (ITEM_DESCRIPTION != '' && ITEM_DESCRIPTION != null) {
                        pedimentoItem.itemDescription = ITEM_DESCRIPTION;
                    }

                    pedimentoItem.location = LOCATION_ID;
                    pedimentoItem.date = result_items_ped[i].getValue(colFields[0]);

                    if (INVENTORY_DETAIL != "") {
                        //Si el item es de tipo lote/serie
                        if (result_items_ped[i].getValue(colFields[8])) {
                            pedimentoItem.lote = INVENTORY_NUMBER;
                        }
                        pedimentoItem.quantity = result_items_ped[i].getValue(colFields[7]);
                    } else {
                        pedimentoItem.quantity = result_items_ped[i].getValue(colFields[4]);
                    }
                    listItems.push(pedimentoItem);
                }
            }

            //busqueda pedimentos de tipo kit package

            let recordShipment = record.load({
                type: !isReceipt ? search.Type.ITEM_FULFILLMENT : search.Type.ITEM_RECEIPT,
                id: shipmentID,
                isDynamic: false,
            });

            let numItems = recordShipment.getLineCount({ sublistId: "item" });
            let index = 0;
            let kitItemxPediment = {};
            for (let i = 0; i < numItems; i++) {

                const pedimentoItem = {};
                if (recordShipment.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i }) === "Kit") {
                    kitItemxPediment[recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitlineid', line: i })] = recordShipment.getSublistText({ sublistId: "item", fieldId: "custcol_lmry_mx_pediment", line: i });
                }
                if (recordShipment.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i }) === "Kit" || recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitmemberof', line: i }) === "") continue;
                if (kitItemxPediment[recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitmemberof', line: i })] === "F") continue;

                let trandate = recordShipment.getValue("trandate");
                let itemID = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                let location = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i });
                let quantity = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                let itemDescription = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'itemdescription', line: i });

                let inventoryDetail = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'inventorydetail', line: i });
                if (inventoryDetail) {
                    let inventorydetailRecord = recordShipment.getSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: i });
                    let cLineas = inventorydetailRecord.getLineCount({ sublistId: 'inventoryassignment' });
                    for (let j = 0; j < cLineas; j++) {
                        const pedimentoItema = {};
                        let lote = inventorydetailRecord.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: j });

                        let loteQuantity = inventorydetailRecord.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', line: j });
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
        /**
         * 
         * @param {*} item_id 
         * @param {*} location_id 
         * @param {*} lote_id 
         * @returns {Array<Object>}
         */
        function getPedimentos(item_id, location_id, lote_id, isFifo) {

            if (item_id === null || location_id === null) return [];
            let Filter_Pedimento = [];

            let Filter_Item = search.createFilter({
                name: "custrecord_lmry_mx_ped_item",
                operator: search.Operator.IS,
                values: item_id,
            });

            let Filter_Location = search.createFilter({
                name: "custrecord_lmry_mx_ped_location",
                operator: search.Operator.IS,
                values: location_id,
            });

            Filter_Pedimento.push(Filter_Item);
            Filter_Pedimento.push(Filter_Location);

            if (lote_id) {
                let Filter_Inventory = search.createFilter({
                    name: "custrecord_lmry_mx_ped_lote_serie",
                    operator: search.Operator.ANYOF,
                    values: lote_id,
                });
                Filter_Pedimento.push(Filter_Inventory);
            }

            let search_pedimento_details = search.create({
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

            let result_pedimento_details = search_pedimento_details
                .run()
                .getRange(0, 1000);
            return result_pedimento_details;
        }
        function getAutomaticType(idRecordOrigin) {
            const typeAutomatic = { isAutomatic: false, automaticType: null };
            if (!Number(idRecordOrigin)) return typeAutomatic;
            getInfoMXtransaction(idRecordOrigin, true).forEach(mxRecord => {
                if (mxRecord.custrecord_lmry_mx_pedimento_fifo === 'T') {
                    typeAutomatic.automaticType = 1;
                    typeAutomatic.isAutomatic = true;
                }
                if (mxRecord.custrecord_lmry_mx_pedimento_lifo === 'T') {
                    typeAutomatic.automaticType = 2;
                    typeAutomatic.isAutomatic = true;
                }
                if (mxRecord.custrecord_lmry_mx_pedimento != null) {
                    typeAutomatic.automaticType = null;
                    typeAutomatic.isAutomatic = false;
                }
            });

            return typeAutomatic;
        }

        /**
         * Mejora Pedimentos v2 - Funcion de creacion de Pedimento Detail a partir de un Inbound Shipment
         * @param {object} dataTransaction 
         * @param {number} idRecord 
         * @param {boolean} isReceipt 
         */
        function createPedimentoDetailRecord(dataTransaction, idRecord, isReceipt, flagTransfer, resultItems,translation) {
            let idPurchaseOrder = dataTransaction['createdfrom'][0]?.value;
            if (Number(idPurchaseOrder) === 0) return 'Error falta ID';
            if (!existPediments(idRecord)) return translation.PEDIMENTO_EXISTS;

            let purchaseOrder = getInfoMXtransaction(idPurchaseOrder);
            if (purchaseOrder.length > 0) {
                let idSubsidiary = dataTransaction['subsidiary'][0].value;
                let idItemReciept = idRecord;
                //Filtra por la transacción
                let Filter_Trans = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: idItemReciept });

                /* Busqueda personalizada LatamReady - MX Pediment Lines*/
                // Devuelve las líneas de item de las transacciones que cuentan con check activado de pedimento
                let search_items_ped = search.load({ id: 'customsearch_lmry_mx_ped_receipt_lines' });

                search_items_ped.filters.push(Filter_Trans);

                let result_items_ped = search_items_ped.run().getRange(0, 1000);
                if (result_items_ped.length === 0) return translation.NO_LINES_SELECTED;
                if (flagTransfer && isReceipt) {
                    if (typeof resultItems === 'object')
                        result_items_ped = resultItems;
                }

                for (let i = 0; i < result_items_ped.length; i++) {
                    let colFields = result_items_ped[i].columns;
                    let ITEM_ID = "" + result_items_ped[i].getValue(colFields[5]);
                    let dateLine = result_items_ped[i].getValue(colFields[0]);
                    let locationLine = result_items_ped[i].getValue(colFields[3]);

                    let FEAT_INVENTORY = runtime.isFeatureInEffect({ feature: "advbinseriallotmgmt" });
                    let INVENTORY_DETAIL = "" + result_items_ped[i].getValue(colFields[6]);

                    // validar para poder guardar los datos
                    let ped_details = record.create({ type: 'customrecord_lmry_mx_pedimento_details', isDynamic: true });

                    ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_subsidiary', value: idSubsidiary });
                    if (!dataTransaction['isAdjustment']) {
                        ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_trans_ref', value: idPurchaseOrder });
                    }          

                    ped_details.setValue({ fieldId: 'custrecord_lmry_source_transaction_id', value: idPurchaseOrder });

                    ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_trans', value: idItemReciept });

                    ped_details.setValue({ fieldId: 'custrecord_lmry_transaction_id', value: idItemReciept });

                    ped_details.setValue({
                        fieldId: 'custrecord_lmry_date', value: new Date()
                    });

                    ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_item', value: ITEM_ID });
                    /*
                    ped_details.setValue({
                        fieldId: 'custrecord_lmry_mx_ped_date', 
                        value: format.parse({
                            value: dateLine,
                            type: "date"
                        })
                    });
                    */
                    var pedimentoDate = purchaseOrder[0].custrecord_lmry_mx_tf_pedimento_date;
                    ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_date', value: format.parse({value: pedimentoDate,type: "date"})});
                    ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_num', value: purchaseOrder[0].custrecord_lmry_mx_pedimento });

                    ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_location', value: locationLine });

                    if ((FEAT_INVENTORY === "T" || FEAT_INVENTORY === true) && INVENTORY_DETAIL != "") {
                        if (Number(result_items_ped[i].getValue(colFields[8]))) {
                            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_lote_serie', value: result_items_ped[i].getValue(colFields[8]) });
                        }
                        ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_quantity', value: result_items_ped[i].getValue(colFields[7]) * (isReceipt ? 1 : -1) });
                    } else {
                        ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_quantity', value: result_items_ped[i].getValue(colFields[4]) * (isReceipt ? 1 : -1) });
                    }

                    if (Number(purchaseOrder[0].custrecord_lmry_mx_pedimento_aduana)) {
                        ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_aduana', value: purchaseOrder[0].custrecord_lmry_mx_pedimento_aduana });
                    }

                    // Graba record Latam - MX Pedimento Details
                    let ped_id = ped_details.save();
                }
                if (flagTransfer && !isReceipt) {
                    const jsonPedimentos = getInfoMXtransaction(dataTransaction['createdfrom'][0]?.value);
                    if (Number(jsonPedimentos[0].id))
                        record.submitFields({
                            type: 'customrecord_lmry_mx_transaction_fields',
                            id: jsonPedimentos[0].id,
                            values: {
                                custrecord_lmry_mx_pedimento_transfer: JSON.stringify(result_items_ped)
                            },


                        });
                }
                return translation.PEDIMENTO_SUCCESS;
            }
            return translation.NO_MX_TRANSACTION;

        }


        function createPedimentoForInventoryAdj(dataTransaction, inventoryAdjustmentID, translation) {
            if (Number(inventoryAdjustmentID) === 0) return 'Error falta ID';
            if (!existPediments(inventoryAdjustmentID)) return translation.PEDIMENTO_EXISTS;

            const mxTransactionFields = getInfoMXtransaction(inventoryAdjustmentID);
            if (mxTransactionFields.length > 0) {
                const idSubsidiary = dataTransaction['subsidiary'][0].value;
                const FEAT_INVENTORY = runtime.isFeatureInEffect({ feature: "advbinseriallotmgmt" });
                //Filtra por la transacción
                const Filter_Trans = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: inventoryAdjustmentID });

                /* Busqueda personalizada LatamReady - MX Pediment Lines*/
                // Devuelve las líneas de item de las transacciones que cuentan con check activado de pedimento
                //let search_items_ped = search.load({ id: 'customsearch_lmry_mx_ped_receipt_lines' });
                let listSelected = [];
                const search_items_ped = search.create({
                    type: "transaction",
                    settings: [{ "name": "consolidationtype", "value": "NONE" }, { "name": "includeperiodendtransactions", "value": "F" }],
                    filters:
                        [
                            ["type", "anyof", "InvAdjst"],
                            "AND",
                            ["custcol_lmry_mx_pediment", "is", "T"],
                            "AND",
                            ["item.type", "noneof", "Kit"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "trandate", label: "Date" }),
                            search.createColumn({ name: "type", label: "Type" }),
                            search.createColumn({ name: "tranid", label: "Document Number" }),
                            search.createColumn({ name: "location", label: "Location" }),
                            search.createColumn({ name: "quantity", label: "Quantity" }),
                            search.createColumn({ name: "item", label: "Item" }),
                            search.createColumn({
                                name: "internalid",
                                join: "inventoryDetail",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "quantity",
                                join: "inventoryDetail",
                                label: "Quantity"
                            }),
                            search.createColumn({
                                name: "inventorynumber",
                                join: "inventoryDetail",
                                label: " Number"
                            })
                        ]
                });

                search_items_ped.filters.push(Filter_Trans);

                
                if (search_items_ped.runPaged().count === 0) return translation.NO_LINES_SELECTED;
                search_items_ped.run().each(result =>{
                    const {columns,getValue} = result;
                    const get = (i) => getValue(columns[i]);
                    const itemID = "" + get(5);
                    const locationLine = get(3); 
                    const loteSerie = get(8);       
                    let INVENTORY_DETAIL = "" + get(6);
                    INVENTORY_DETAIL = (FEAT_INVENTORY === "T" || FEAT_INVENTORY === true) && INVENTORY_DETAIL
                    const quantity = Number(INVENTORY_DETAIL ? get(7) : get(4));
                    const pedimentoDate = mxTransactionFields[0].custrecord_lmry_mx_tf_pedimento_date;
                    
                    

                    if (quantity > 0) {
                        // validar para poder guardar los datos
                        let ped_details = record.create({ type: 'customrecord_lmry_mx_pedimento_details', isDynamic: true });
                        ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_subsidiary', value: idSubsidiary });
                        ped_details.setValue({ fieldId: 'custrecord_lmry_source_transaction_id', value: inventoryAdjustmentID });
                        ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_trans', value: inventoryAdjustmentID });
                        ped_details.setValue({ fieldId: 'custrecord_lmry_transaction_id', value: inventoryAdjustmentID });
                        ped_details.setValue({ fieldId: 'custrecord_lmry_date', value: new Date() });
                        ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_item', value: itemID });
                        ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_location', value: locationLine });
                        if (INVENTORY_DETAIL && Number(loteSerie)) {
                            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_lote_serie', value: loteSerie });
                        }
                        ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_quantity', value: quantity });
                        
                        ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_date', value: format.parse({ value: pedimentoDate, type: "date" }) });
                        ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_num', value: mxTransactionFields[0].custrecord_lmry_mx_pedimento });
                        if (Number(mxTransactionFields[0].custrecord_lmry_mx_pedimento_aduana)) {
                            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_aduana', value: mxTransactionFields[0].custrecord_lmry_mx_pedimento_aduana });
                        }
                         // Graba record Latam - MX Pedimento Details
                        ped_details.save();
                    } else if (quantity < 0) {
                        const listPediment = getPedimentos(itemID, locationLine, loteSerie, true);
                        let sumQuantityDisp = 0;
                        let quantitytotal = quantity;
                        for (let i = 0; i < listPediment.length; i++) {
                            const jsonPediment = JSON.parse(JSON.stringify(listPediment[i]));
                            let ped_quantity = Number(jsonPediment.values["SUM(custrecord_lmry_mx_ped_quantity)"]);
                            let aduana = jsonPediment.values["GROUP(custrecord_lmry_mx_ped_aduana)"][0]?.value;
                            if (aduana) {
                                sumQuantityDisp += ped_quantity;
                            }
                        }
                        if (quantitytotal > sumQuantityDisp) {
                            //throw translation.INSUFFICIENT_STOCK;
                        } else {
                            let addCount = 0;
                            for (let i = 0; i < listPediment.length; i++) {
                                const jsonPediment = JSON.parse(JSON.stringify(listPediment[i]));
                                let ped_quantity = Number(jsonPediment.values["SUM(custrecord_lmry_mx_ped_quantity)"]);
                                let aduana = Number(jsonPediment.values["GROUP(custrecord_lmry_mx_ped_aduana)"][0]?.value);
                                let pedimentoNro = jsonPediment.values["GROUP(custrecord_lmry_mx_ped_num)"];
                                if (aduana > 0 && ped_quantity > 0) {
                                    const pedimentoObj = { 
                                        itemID,
                                        locationLine,
                                        loteSerie,
                                        pedimentoNro,
                                        quantity,
                                        pedimentoDate: dataTransaction["trandate"],
                                        aduana
                                    }
                                    if (ped_quantity == quantitytotal) {
                                        
                                        listSelected.push(pedimentoObj);
                                        addCount++;
                                        quantitytotal = quantitytotal - ped_quantity;
                                        break;
                                    };
                                    if (ped_quantity > quantitytotal) {
                                        listSelected.push(pedimentoObj);
                                        addCount++;
                                        quantitytotal = quantitytotal - ped_quantity;
                                        break;
                                    };
                                    if (ped_quantity < quantitytotal) {
                                        listSelected.push(pedimentoObj);
                                        addCount++;
                                        quantitytotal = quantitytotal - ped_quantity;
                                    }

                                } else {
                                    continue;
                                }
                            }
                            if (quantitytotal > 0 && addCount !==0) {
                                //throw translation.INSUFFICIENT_STOCK;
                               listSelected.slice(addCount*(-1))
                            }
                        };
                    }
                });
                
                return translation.PEDIMENTO_SUCCESS;
            }

            return translation.NO_MX_TRANSACTION;

        }

        function existPediments(idRecord) {
            try {

                //Busca si la transacción ya se registró en el record LatamReady - MX Pediments Detail
                let search_ped = search.create({
                    type: 'customrecord_lmry_mx_pedimento_details',
                    filters: [{ name: 'custrecord_lmry_mx_ped_trans', operator: 'is', values: idRecord }],
                    columns: ['internalid']
                });
                let result_ped = search_ped.run().getRange({ start: 0, end: 1 });

                if (result_ped != null && result_ped.length > 0) {
                    return false;
                } else {
                    return true;
                }

            } catch (err) {
                log.error('existPediments', err);

            }
        }
        function getInfoMXtransaction(idPO, isAutomatic) {

            if (Number(idPO) === 0 || idPO === undefined) return [];
            let consulta = `
            SELECT TOP 1
            id,     
            CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_pedimento,
            CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_pedimento_aduana,
            CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_pedimento_fifo,
            CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_pedimento_lifo,
            CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_pedimento_transfer,
            CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_tf_pedimento_date
            FROM        
            CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS       
            WHERE         
            CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_transaction_related = ${idPO}  
            ${isAutomatic === null ? `and      
            CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_pedimento IS NOT NULL`: ''}
            `;

            let nroPedimentoandAduana = query.runSuiteQL({
                query: consulta,
            }).asMappedResults();
            return nroPedimentoandAduana;
        }
        function createPedimenetByList(listSelected, dataTransaction, idRecord, isReceipt, transferlocation) {
            const listCreated = [];
            listSelected.forEach((pedimentSelect) => {
                const { pediment: jsonPediment, nroItems: quantity, itemLine: itemLineInfo } = pedimentSelect;
                log.debug({
                    title: 'listSelected',
                    details: { jsonPediment, quantity, itemLineInfo }
                });

                let ped_details = record.create({ type: 'customrecord_lmry_mx_pedimento_details', isDynamic: true });

                ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_subsidiary', value: dataTransaction['subsidiary'][0].value });

                ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_trans_ref', value: dataTransaction['createdfrom'][0].value });

                ped_details.setValue({ fieldId: 'custrecord_lmry_source_transaction_id', value: dataTransaction['createdfrom'][0].value });

                ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_trans', value: idRecord });

                ped_details.setValue({ fieldId: 'custrecord_lmry_transaction_id', value: idRecord });

                let fecha1 = format.parse({ value: dataTransaction['trandate'], type: format.Type.DATE });

                ped_details.setValue({ fieldId: 'custrecord_lmry_date', value: fecha1 });

                ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_item', value: itemLineInfo.itemid });

                let fecha2 = format.parse({ value: itemLineInfo.date, type: format.Type.DATE });

                if (isReceipt) {
                    fecha2 = format.parse({ value: itemLineInfo.datePediment, type: format.Type.DATE });
                }
                ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_date', value: fecha2 });

                ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_num', value: jsonPediment.values["GROUP(custrecord_lmry_mx_ped_num)"] });

                if (transferlocation) {
                    ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_location', value: transferlocation });
                }else{
                    ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_location', value: itemLineInfo.location });
                }
                

                ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_quantity', value: quantity * (!isReceipt ? -1 : 1) });

                let lote = itemLineInfo.lote;

                if (lote != null && lote != '') {
                    ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_lote_serie', value: lote });
                }

                if (Number(jsonPediment.values["GROUP(custrecord_lmry_mx_ped_aduana)"][0]?.value)) {
                    ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_aduana', value: Number(jsonPediment.values["GROUP(custrecord_lmry_mx_ped_aduana)"][0]?.value) });
                }

                listCreated.push(ped_details.save());

            });
            return listCreated;
        }
        return {
            get: get,
        };
    });