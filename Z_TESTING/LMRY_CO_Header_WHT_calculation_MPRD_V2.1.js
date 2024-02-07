/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name LMRY_PE_RPT_InvBalance_Cta20y21_MPRD_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 02/01/2024
 */
define([
    "N/record",
    "N/runtime",
    "N/search",
    "N/log",
    "./WTH_Library/LMRY_CO_Header_WHT_calculation_LBRY_V2.1",
],

    (record, runtime, search, log, lbryWHTHeader) => {

        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            try {
                const parameters = getParameters();
                const transactions = getTransactions(parameters);
                updateState(parameters, 'Procesando', 'Se ha comenzado a procesar las transacciones...');

                return transactions;
            } catch (error) {
                log.error("Error [getInputData]", error);
                return [["isErrorInput", error.message]];
            }
        }
 

        const map = (mapContext) => {
            try {

                if (mapContext.value.indexOf("isError") != -1) {
                    mapContext.write({
                        key: mapContext.key,
                        value: mapContext.value
                    });
                } else {

                    const transaction = JSON.parse(mapContext.value);

                    if (transaction.whtType == "header") {
                        lbryWHTHeader.calculateHeaderWHT(transaction.id);
                    } else {
                        lbryWHTHeader.updateTaxResult(transaction.id);
                    }
                    mapContext.write({
                        key: mapContext.key,
                        value: [transaction.id, "T"]
                    });

                }
            } catch (error) {
                log.error("Error", error);
                mapContext.write({
                    key: mapContext.key,
                    value: ["isError", error.message]
                });
            }
        }

        const summarize = summaryContext => {
            try {
                const parameters = getParameters();
                const results = [...summaryContext.output.iterator()].map(([, value]) => JSON.parse(value));
                const errors = results.filter(([key]) => key === 'isError' || key === 'isErrorInput');
        
                const transactionsData = getTransactions(parameters);
                const transactionIds = transactionsData.map(({id}) => id);
                const idsSuccess = results.filter(([key, value]) => value === 'T').map(([id]) => id);
                const idsError = transactionIds.filter(id => !idsSuccess.includes(id));
        
                const transactions = [
                    ...idsSuccess.map(id => ({id, state: 'Procesada con exito'})),
                    ...idsError.map(id => ({id, state: 'Error'}))
                ];
        
                if (!transactions.find(({id}) => id === 1)) {
                    updateTransactionState(parameters, transactions);
                }
        
                if (errors.length === 0) {
                    updateState(parameters, 'Finalizado', 'Las transacciones han sido procesadas con exito');
                } else {
                    log.error("error Summarize [interno]", errors[0][1]);
                    updateState(parameters, 'Ocurrió un error', errors[0][1]);
                }
            } catch (error) {
                updateState(parameters, 'Ocurrió un error', error.message);
            }
        };


        let getParameters = () => {

            return {
                idUser: runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_co_head_wht_calc_usery' }),
                idLog: runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_co_head_wht_calc_state' }),
            }
        }

        let getPreference = () => {

            return {
                department: runtime.getCurrentUser().getPreference({ name: 'DEPTMANDATORY' }),
                "class": runtime.getCurrentUser().getPreference({ name: 'CLASSMANDATORY' }),
                location: runtime.getCurrentUser().getPreference({ name: 'LOCMANDATORY' }),
                journal: runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALJOURNAL' })
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


        return { getInputData, map, summarize }

    });