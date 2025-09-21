/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name SMC_PERDIMENTOS_SOLUTIONS_MPRD_V2.1.js
 * @Author LatamReady
 * @Date 02/01/2024
 */
define([
    "N/record",
    "N/runtime",
    "N/file",
    "N/search",
    "N/format",
    "N/log",
    "N/url",
    "N/translation",
    "N/suiteAppInfo",
    'N/config',
    './WTH_Library/LMRY_BR_WHT_CustPaymnt_LBRY'
],

    (
        record,
        runtime,
        file,
        search,
        format,
        log,
        url,
        translation,
        suiteAppInfo,
        config,
        lbryBRPayment) => {

        // let scriptParameters = {};



        const getInputData = () => {
            try {
                const transactionId = JSON.parse(runtime.getCurrentScript().getParameter({ name: "custscript_smc_transaction_id_ped" }));
                const {
                    finalPedimentoDetail,
                    finalTransactions
                } = getTransactions(transactionId);

                return finalTransactions;
            } catch (error) {

                log.error("getinputdata error", error)
                return [["isError", error.message]];
            }

        }

        const deleteRecord = () => {
            const deleteRecord = []
            const transactionSearchObj = search.create({
                type: "customrecord_lmry_mx_pedimento_details",
                filters:
                    [["custrecord_lmry_mx_ped_initial_load", "is", "T"]],
                columns:
                    [
                        "internalid"
                    ]
            })

            let pageData = transactionSearchObj.runPaged({ pageSize: 1000 });
            if (pageData) {
                pageData.pageRanges.forEach(function (pageRange) {
                    let page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(function (result) {
                        const internalid = result.getValue(result.columns[0]);
                        deleteRecord.push(internalid);

                    });
                });
            }
            log.error("deleteRecord", deleteRecord.length)
            return deleteRecord;
        }

        const map = (context) => {
            //log.error("context.value", context.value)
            let transaction = JSON.parse(context.value);
            try {
                if (context.value.indexOf("isError") != -1) {
                    context.write({
                        key: context.key,
                        value: context.value
                    });
                } else {


                    getDetails(transaction);
                    createPedimento(transaction);
                    /*
                    const recordDetail = getTransactionDetails(transaction);
                    if (recordDetail.length) {
                        context.write({
                            key: transaction,
                            value: {
                                recordDetail: recordDetail
                            }
                        });
                    }
                    */
                }
            } catch (error) {
                log.error("error map transaction", transaction);
                log.error("error map", error);
                context.write({
                    key: context.key,
                    value: ["isError " + transaction.internalid + " - " + transaction.transaction, error.message]
                });
            }
        }

        function reduce(context) {
            try {
                if (context.values[0].indexOf("isError") != -1) {
                    context.write({
                        key: context.key,
                        value: context.values[0]
                    });
                } else {


                    /*
                    let objItem = new Object();
                    let arrItems = context.values;
                    arrItems.forEach(function (item) {
                        item = JSON.parse(item);
                        updateQuantityAndTotalCost(item);
                        if (Object.keys(objItem).length === 0) {
                            objItem = item;
                        } else {
                            objItem.quantity += item.quantity;
                            objItem.totalCost += item.totalCost;
                        }
                    });

                    if (objItem.quantity == 0) {
                        objItem.unitCost = 0.00;
                    } else {
                        objItem.unitCost = roundMethod(objItem.totalCost / objItem.quantity);
                    }             
                    objItem.quantity = objItem.quantity.toFixed(0);
                    objItem.unitCost = objItem.unitCost.toFixed(2);
                    objItem.totalCost = objItem.totalCost.toFixed(2);

                    if (objItem.totalCost == "-0.00") {
                        objItem.totalCost = "0.00"
                    }
                    if (Object.keys(objItem).length !== 0) {
                        context.write({
                            key: context.key,
                            value: objItem
                        });
                    }
                    */
                }
            } catch (error) {
                log.error("error reduce", error);
                context.write({
                    key: context.key,
                    value: ["isError", error.message]
                });
            }
        }


        const summarize = (context) => {
            try {

                context.output.iterator().each(function (key, value) {
                    return true;
                });

                log.debug("end", "end")
            } catch (error) {
                log.error("error Summarize", error);
                log.error("error Summarize STACK", error.stack);
            }

        }

        const getTransactions = (transactionID) => {
            try {
                const jsonITems = {};
                search.create({
                    type: "transaction",
                    filters:
                        [
                            ["internalid", "anyof", transactionID]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "item",
                                label: "Latam - MX Pedimento Item"
                            }),
                            search.createColumn({
                                name: "location",
                                label: "Latam - MX Pedimento Location"
                            })
                        ]
                }).run().each(result => {

                    const item = result.getValue(result.columns[0]);
                    const location = result.getValue(result.columns[1]);
                    jsonITems[item] = {
                        item,
                        location
                    };
                    return true;
                });
                const transactions = [];

                const sumTransactions = {};
                const items = Object.keys(jsonITems);
                //log.error("items",items)
                let locations = Object.keys(jsonITems).map(itemID => jsonITems[itemID].location);

                locations = [...new Set(locations)]
                //log.error("locations",locations)
                const transactionSearchObj = search.create({
                    type: "transaction",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters:
                        [
                            ["subsidiary", "anyof", "2"],
                            "AND",
                            ["item.custitem_lmry_mx_pediment", "is", "T"],
                            "AND",
                            ["type", "anyof", "InvAdjst", "InvCount", "InvDistr", "StatChng", "InvTrnfr", "InvWksht", "ItemShip", "ItemRcpt", "WorkOrd"],
                            "AND",
                            ["formulatext: CASE WHEN {recordType} = 'itemreceipt' AND {quantity}< 0 THEN 0 ELSE 1 END", "is", "1"],
                            "AND",
                            ["formulatext: CASE WHEN {transferlocation} = {location}  THEN 0 ELSE 1 END", "is", "1"],
                            "AND",
                            ["item", "anyof", items],
                            "AND",
                            ["location", "anyof", locations]
                            /*
                            "AND",
                            ["item", "anyof", "7081"],
                            "AND",
                            ["location", "anyof", "19"]
                            
                            */
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                summary: "GROUP",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "type",
                                summary: "GROUP",
                                label: "Type"
                            }),
                            search.createColumn({
                                name: "subsidiary",
                                summary: "GROUP",
                                label: "Latam - MX Subsidiary"
                            }),
                            search.createColumn({
                                name: "item",
                                summary: "GROUP",
                                label: "Latam - MX Pedimento Item"
                            }),
                            search.createColumn({
                                name: "formulanumeric",
                                summary: "SUM",
                                formula: "CASE WHEN {recordType} = 'itemfulfillment' THEN -{inventoryDetail.quantity} ELSE {inventoryDetail.quantity} END",
                                label: "Formula (Numeric)"
                            }),
                            search.createColumn({
                                name: "location",
                                summary: "GROUP",
                                label: "Latam - MX Pedimento Location"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                summary: "GROUP",
                                formula: "{recordType}",
                                label: "Formula (Text)"
                            })
                        ]
                });
                const jsonTransaction = {};
                let pageData = transactionSearchObj.runPaged({ pageSize: 1000 });
                if (pageData) {
                    pageData.pageRanges.forEach(function (pageRange) {
                        let page = pageData.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            const { getValue, getText, columns } = result;
                            const gv = (i) => getValue(columns[i]);
                            const gt = (i) => getText(columns[i]);
                            const transaction = {
                                id: gv(0),
                                type: gt(1),
                                subsidiary: gt(2),
                                subsidiaryId: gv(2),
                                item: gt(3),
                                quantity: Number(gv(4)),
                                location: gt(5),
                                itemID: gv(3),
                                locationID: gv(5),
                                revised: false,
                                typeID: gv(1),
                                recordType: gv(6)
                                //pedimentos: existPedimento(id,gv(3),gv(5))
                            }
                            const key = transaction.id + "-" + transaction.locationID + "-" + transaction.itemID;

                            if (!sumTransactions[key]) sumTransactions[key] = 0;
                            sumTransactions[key] = transaction.quantity;
                            if (!jsonTransaction[key]) {
                                jsonTransaction[key] = transaction.id;
                                transactions.push(transaction);
                            }

                        });
                    });
                }

                const jsonPedimentos = getPedimentos(items, locations)

                for (let i = 0; i < transactions.length; i++) {
                    const transaction = transactions[i];
                    const { id, itemID, locationID, location, item } = transaction;
                    const key = id + "-" + locationID + "-" + itemID;
                    if (jsonPedimentos[key] && jsonPedimentos[key].list && jsonPedimentos[key].list.length) {
                        transaction.pedimentos = jsonPedimentos[key].total || 0;
                        transaction.revised = jsonPedimentos[key].total == sumTransactions[key]
                        transaction.total = sumTransactions[key];
                        //log.error("jsonPedimentos[key].total",jsonPedimentos[key].total);
                        //log.error("sumTransactions[key]",sumTransactions[key])
                        //log.error("key",key)
                        if (!transaction.revised) {
                            if (transaction.total > transaction.pedimentos) {
                                transaction.obs = `El articulo ${transaction.item} en la locacion ${transaction.location} no tiene la cantidad suficiente en el registro de pedimentos. Se recomienda revisar los registros asociados`
                            }
                            if (transaction.total < transaction.pedimentos) {
                                transaction.obs = `El articulo ${transaction.item} en la locacion ${transaction.location} a excedido la cantidad existencias en el registro de pedimentos.Se debe modificar el record de pedimentos relacionados`
                            }

                            if (transaction.total == Math.abs(transaction.pedimentos) && transaction.type == "Inventory Adjustment") {
                                transaction.revised = true;
                            }

                        }
                    } else {
                        transaction.pedimentos = 0;
                        transaction.obs = "La transacción no tiene pedimentos";
                        transaction.total = sumTransactions[key];
                    }
                }

                const finalTransactions = transactions.filter(transaction => !transaction.revised && transaction.total != 0);
                //log.error("finalTransactions", finalTransactions)
                const finalPedimentoDetail = [];

                for (const key in jsonPedimentos) {
                    const listPedimentos = jsonPedimentos[key].list;
                    for (let i = 0; i < listPedimentos.length; i++) {
                        const pedimentoDetail = listPedimentos[i];
                        if (!pedimentoDetail.reference) {
                            pedimentoDetail.obs = "Pedimento no relacionado a una transaccion. Se recomienda eliminarla."
                            finalPedimentoDetail.push(pedimentoDetail)
                        }
                    }
                }

                return {
                    finalPedimentoDetail,
                    finalTransactions
                }
            } catch (error) {
                log.error("error", error)
                log.error("error stack", error.stack)
                return {
                    finalPedimentoDetail: [],
                    finalTransactions: []
                }
            }
        }

        const getDetails = (transaction) => {

            transaction.createdfrom = search.lookupFields({
                type: 'transaction',
                id: transaction.id,
                columns: ['createdfrom']
            }).createdfrom[0].value;

            if (transaction.createdfrom) {
                transaction.createdfromType = search.lookupFields({
                    type: 'transaction',
                    id: transaction.createdfrom,
                    columns: ['recordtype']
                }).recordtype;
            }
            let jsonPedimentos = {}
            if (transaction.createdfromType == "returnauthorization") {
                jsonPedimentos = getPedimentos(transaction.itemID, transaction.locationID, true)
            }


            if (Object.keys(jsonPedimentos).length) {
                transaction.nroPedimento = Object.keys(jsonPedimentos)[Object.keys(jsonPedimentos).length - 1];
                const objPedimento = jsonPedimentos[transaction.nroPedimento].list
                    .filter(item => item.quantity > 0)
                    .reduce((max, item) => {
                        return Number(item.internalid) > Number(max.internalid) ? item : max;
                    });

                transaction.datePedimento = objPedimento.date;
                transaction.aduanaPedimento = objPedimento.aduanaId;
                //log.error("objPedimento", objPedimento)
            }
            log.error("transaction", transaction)
        }

        const createPedimento = (transaction) => {
            log.error("createPedimento", "START")
            if (!transaction.nroPedimento) return false;
            let ped_details = record.create({ type: 'customrecord_lmry_mx_pedimento_details', isDynamic: true });

            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_subsidiary', value: transaction.subsidiaryId });
            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_trans_ref', value: transaction.createdfrom });
            
            ped_details.setValue({ fieldId: 'custrecord_lmry_source_transaction_id', value: transaction.createdfrom });

            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_trans', value: transaction.id });

            ped_details.setValue({ fieldId: 'custrecord_lmry_transaction_id', value: transaction.id });

            ped_details.setValue({
                fieldId: 'custrecord_lmry_date', value: new Date()
            });

            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_item', value: transaction.itemID });

            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_date', value: format.parse({ value: transaction.datePedimento, type: "date" }) });
            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_num', value: transaction.nroPedimento });

            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_location', value: transaction.locationID });

            /*
            let quantity;
            let loteSerie;
            if ((FEAT_INVENTORY === "T" || FEAT_INVENTORY === true) && INVENTORY_DETAIL != "" && result_items_ped[i].getValue(colFields[8])) {
                loteSerie = result_items_ped[i].getValue(colFields[8]);
                if (Number(loteSerie)) {
                    ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_lote_serie', value: loteSerie });
                }
                quantity = result_items_ped[i].getValue(colFields[7]);
                ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_quantity', value: transaction.quantity });
            } else {

                quantity = result_items_ped[i].getValue(colFields[4]);
                ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_quantity', value: quantity * (isReceipt ? 1 : -1) });

            }
            */
            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_quantity', value: transaction.quantity });

            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_aduana', value: transaction.aduanaPedimento });
            

            // Graba record Latam - MX Pedimento Details


            ped_details.save();

            log.error("createPedimento",transaction)
        }


        const getPedimentos = (items, locations, forPedimento) => {
            const jsonPedimentos = {}
            const transactionSearchObj = search.create({
                type: "customrecord_lmry_mx_pedimento_details",
                filters:
                    [
                        ["custrecord_lmry_mx_ped_item", "anyof", items],
                        "AND",
                        ["custrecord_lmry_mx_ped_location", "anyof", locations],
                    ],
                columns:
                    [
                        "custrecord_lmry_mx_ped_quantity",//0
                        "custrecord_lmry_mx_ped_item",//1
                        "custrecord_lmry_mx_ped_location",//2
                        "custrecord_lmry_mx_ped_trans",//3
                        "internalid",//4
                        "custrecord_lmry_mx_ped_num",//5
                        "custrecord_lmry_mx_ped_date",//6
                        "custrecord_lmry_mx_ped_aduana",//7
                        "custrecord_lmry_mx_ped_trans_ref",//8
                        "custrecord_lmry_date",//9
                        "custrecord_lmry_mx_ped_ei"
                    ]
            })

            let pageData = transactionSearchObj.runPaged({ pageSize: 1000 });
            if (pageData) {
                pageData.pageRanges.forEach(function (pageRange) {
                    let page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(function (result) {
                        const itemID = result.getValue(result.columns[1]);
                        const locationID = result.getValue(result.columns[2]);
                        const transactionID = result.getValue(result.columns[3]);
                        const numPedimento = result.getValue(result.columns[5]);
                        let key = transactionID + "-" + locationID + "-" + itemID;
                        if (forPedimento) key = numPedimento;

                        const unitPedimento = {}
                        if (!jsonPedimentos[key]) {
                            jsonPedimentos[key] = {};
                            jsonPedimentos[key].list = [];
                            jsonPedimentos[key].total = 0;
                        }

                        unitPedimento.quantity = parseFloat(result.getValue(result.columns[0]));
                        unitPedimento.internalid = result.getValue(result.columns[4]) || "";
                        unitPedimento.correlativo = result.getValue(result.columns[5]) || "";
                        unitPedimento.date = result.getValue(result.columns[6]) || "";
                        unitPedimento.aduana = result.getText(result.columns[7]) || "";
                        unitPedimento.aduanaId = result.getValue(result.columns[7]) || "";
                        unitPedimento.referenceSource = result.getValue(result.columns[8]) || "";
                        unitPedimento.reference = result.getValue(result.columns[3]) || "";
                        unitPedimento.trandate = result.getValue(result.columns[9]) || "";
                        //unitPedimento.ei = this.isValid(result.getValue(result.columns[10]));
                        unitPedimento.item = result.getText(result.columns[1]);
                        unitPedimento.location = result.getText(result.columns[2]);
                        unitPedimento.revised = false;
                        jsonPedimentos[key].total += unitPedimento.quantity;
                        jsonPedimentos[key].list.push(unitPedimento);
                    });
                });
            }
            return jsonPedimentos;
        }

        return { getInputData, map, summarize };
    });