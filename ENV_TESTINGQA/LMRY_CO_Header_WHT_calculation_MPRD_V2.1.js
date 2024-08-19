/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name LMRY_CO_Header_WHT_calculation_MPRD_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 02/01/2024
 */
define([
    "N/record",
    "N/runtime",
    "N/search",
    "N/log",
    "./LMRY_CO_Header_WHT_calculation_LBRY_V2.1",
],

    (record, runtime, search, log, lbryWHTHeader) => {


        const getInputData = (inputContext) => {
            try {
                const parameters = getParameters();

                const transactions = getTransactions(parameters);
                updateState(parameters, 'Procesando', 'Se ha comenzado a procesar las transacciones...');

                return transactions;
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

                const data = value;
                try {
                    if (data.id) {
                        const transaction = lbryWHTHeader.getTransaction(data.id);
                        const taxResults = lbryWHTHeader.buildTaxResults(transaction);
                        taxResults.forEach(taxResult => {
                            mapContext.write({
                                key: taxResult.item.lineuniquekey,
                                value: {
                                    code: "OK",
                                    transaction: data,
                                    taxResult
                                }
                            });
                        });
                    }
                    
                } catch (error) {
                    log.error("Error [map]", error);
                    log.error("Error [map] stack", error.stack);
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

            const { values } = reduceContext;
            const data = values.map(value => JSON.parse(value));
            if (data[0].code == "ERROR") {
                data[0].transaction.state = "Error";
                reduceContext.write({
                    key: data[0].transaction.id,
                    value: {
                        code: "ERROR",
                        message: data[0].message,
                        transaction: data[0].transaction
                    }
                });
            } else {
                try {
                    data.forEach(({ taxResult }) => {
                        lbryWHTHeader.createTaxResult(taxResult);
                    });
                    data[0].transaction.state = "Procesada con exito";
                    reduceContext.write({
                        key: data[0].transaction.id,
                        value: {
                            code: "OK",
                            transaction: data[0].transaction
                        }
                    });
                } catch (error) {
                    log.error('Error [REDUCE]', error)
                    log.error('Error [REDUCE] id ', data[0].transaction.id)
                    data[0].transaction.state = "Error";
                    reduceContext.write({
                        key: data[0].transaction.id,
                        value: {
                            code: "ERROR",
                            message: error.message,
                            transaction: data[0].transaction
                        }
                    });
                }
            }

        }

        const summarize = summaryContext => {
            const parameters = getParameters();
            try {

                const results = [];
                const transactionIDs = new Set();
                summaryContext.output.iterator().each(function (key, value) {

                    value = JSON.parse(value);
                    const { id } = value.transaction;
                    if (!transactionIDs.has(id)) {
                        results.push(value);
                        transactionIDs.add(id);
                    }
                    return true;
                });

                const errors = results.filter(({code}) => code === "ERROR");

                const transactionsData = getTransactions(parameters);
                const transactionIds = transactionsData.map(({ id }) => id);
                const idsSuccess = results.filter(({code}) => code === 'OK').map(({transaction}) => transaction.id);
                const idsError = transactionIds.filter(id => !idsSuccess.includes(id));

                const transactions = [
                    ...idsSuccess.map(id => ({ id, state: 'Procesada con exito' })),
                    ...idsError.map(id => ({ id, state: 'Error' }))
                ];


                updateTransactionState(parameters, transactions);


                if (errors.length === 0) {
                    updateState(parameters, 'Finalizado', 'Las transacciones han sido procesadas con exito');
                } else {
                    log.error("error Summarize [interno]", errors[0][1]);
                    updateState(parameters, 'Ocurrió un error', errors[0][1]);
                }
            } catch (error) {

                log.error("error Summarize [interno]", error.message);
                updateState(parameters, 'Ocurrió un error', error.message);
            }
        };


        let getParameters = () => {
            return {
                idUser: runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_co_head_wht_calc_user' }),
                idLog: runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_co_head_wht_calc_state' }),
            }
        }

        let getFeatures = () => {

            return {
                department: runtime.isFeatureInEffect({ feature: "DEPARTMENTS" }),
                "class": runtime.isFeatureInEffect({ feature: "CLASS" }),
                location: runtime.isFeatureInEffect({ feature: "LOCATIONS" }),
                multibook: runtime.isFeatureInEffect({ feature: "MULTIBOOK" }),
                subsidiary: runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' })
            }
        }

        let getTransactions = (parameters) => {
            let recordLog = {};
            let searchRecordLog = search.create({
                type: 'customrecord_lmry_co_head_wht_cal_log',
                filters: [
                    ['internalid', 'is', parameters.idLog]
                ],
                columns: [
                    'custrecord_lmry_co_hwht_log_transactions',
                    'custrecord_lmry_co_hwht_log_whttype'
                ]
            })
            searchRecordLog.run().each(function (result) {
                recordLog.idTransaction = result.getValue('custrecord_lmry_co_hwht_log_transactions');
                recordLog.whtType = result.getValue('custrecord_lmry_co_hwht_log_whttype');
            });
            //return [{"id":"148013","whtType":"header"}]

            return JSON.parse(recordLog.idTransaction).map(id => ({ id: id, whtType: recordLog.whtType }));
        }

        /* ------------------------------------------------------------------------------------------------------
        * Esta funcion permite actualiazr el estado del proceso segun la etapa del flujo del modulo.
        * --------------------------------------------------------------------------------------------------- */
        let updateState = (parameters, msgState, msgDetails) => {
            record.submitFields({
                type: 'customrecord_lmry_co_head_wht_cal_log',
                id: parameters.idLog,
                values: {
                    custrecord_lmry_co_hwht_log_state: msgState,
                    custrecord_lmry_co_hwht_log_details: msgDetails
                },
                options: { ignoreMandatoryFields: true, disableTriggers: true }
            });
        }

        let updateTransactionState = (parameters, transactions) => {
            record.submitFields({
                type: 'customrecord_lmry_co_head_wht_cal_log',
                id: parameters.idLog,
                values: {
                    custrecord_lmry_co_hwht_log_transactions: JSON.stringify(transactions)
                },
                options: { ignoreMandatoryFields: true, disableTriggers: true }
            });
        }


        return { getInputData, map, reduce, summarize }

    });