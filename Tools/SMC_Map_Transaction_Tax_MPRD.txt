/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name LMRY_CO_Header_WHT_calculation_Auto_MPRD_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 02/01/2024
 */
define([
    "N/record",
    "N/runtime",
    "N/search",
    "N/log",
    "N/format",
    "./LMRY_PE_TAXGROUP_LBRY"
],

    (record, runtime, search, log, format, Lib_Tax_Group) => {


        const getInputData = (inputContext) => {
            try {
                //const lines = Lib_Tax_Group.getLinesTransactions();

                const ids = getTransaction()
                
                return lines;
            } catch (error) {
                log.error("Error [getInputData]", error);
                return [{
                    code: "ERROR",
                    message: error.message
                }];
            }
        }

        const map = (mapContext) => {

            const value = JSON.parse(mapContext.value);
            if (value.code === "ERROR") {
                mapContext.write({
                    key: value.code,
                    value: value
                });
            } else {
                const taxGroup = Lib_Tax_Group.getTacGroup();
                const id = value;
                try {

                    recorddObj = record.load();
                    const taxTransaction = Lib_Tax_Group.getTaxTransaction(recorddObj,taxGroup);
                    /*
                        mapContext.write({
                            key: taxResult.item.lineuniquekey,
                            value: {
                                code: "OK",
                                transaction: data,
                                taxResult
                            }
                        });
                    */
                   mapContext.write({
                            key: taxResult.item.lineuniquekey,
                            value: {
                                taxTransaction
                            }
                        });
                } catch (error) {
                    log.error("Error [map]", error);
                    log.error("Error [map] data.id", data.id);
                    data.state = "Error";
                    mapContext.write({
                        key: mapContext.key,
                        value: {
                            code: "ERROR",
                            message: error.message,
                            transaction: data
                        }
                    });
                }

            }

        }

        const reduce = (reduceContext) => {

            const { values, key } = reduceContext;
            const JsonTaxTransaction = values.map(value => JSON.parse(value));
            if (JsonTaxTransaction[0].code == "ERROR") {
                JsonTaxTransaction[0].transaction.state = "Error";
                reduceContext.write({
                    key: JsonTaxTransaction[0].transaction.id,
                    value: {
                        code: "ERROR",
                        message: JsonTaxTransaction[0].message,
                        transaction: JsonTaxTransaction[0].transaction
                    }
                });
            } else {
                try {
                    taxResult = Lib_Tax_Group.createTaxResult(JsonTaxTransaction);

                } catch (error) {
                    log.error('Error [REDUCE]', error)
                    log.error('Error [REDUCE] id ', JsonTaxTransaction[0].transaction.id)
                    JsonTaxTransaction[0].transaction.state = "Error";
                    reduceContext.write({
                        key: JsonTaxTransaction[0].transaction.id,
                        value: {
                            code: "ERROR",
                            message: error.message,
                            transaction: JsonTaxTransaction[0].transaction
                        }
                    });
                }
            }

        }

        const summarize = (summarizeContext) => {
            const data = [];
            const transactionIDs = new Set();
            summarizeContext.output.iterator().each(function (key, value) {

                value = JSON.parse(value);
                const { id } = value.transaction;
                if (!transactionIDs.has(id)) {
                    data.push(value);
                    transactionIDs.add(id);
                }

                return true;
            });

            try {
           
            } catch (error) {
                log.error('Error [summarize]', error)
            }

        }

        return { getInputData, map, reduce, summarize }

    });