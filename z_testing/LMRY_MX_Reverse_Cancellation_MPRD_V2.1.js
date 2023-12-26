/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_MX_Reverse_Cancellation_MPRD_V2.1.js         ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Oct 04 2023  LatamReady    Use Script 2.1           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/log', 'N/runtime', 'N/search', './EI_Library/LMRY_MX_Reverse_Cancellation_MPRD_LBRY_V2.1.js'],

    (log, runtime, search, lbryRCD) => {
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
                const parameters = lbryRCD.getParameters();
                const recordLog = lbryRCD.getRecordsLog(parameters);
                lbryRCD.updateState(parameters, 'Procesando', 'Se ha comenzado a revertir las anulaciones...');
                const cancellations = JSON.parse(recordLog.idTransaction).map(id => ({ idTransaction: id, accountSetup: recordLog.accountSetup ,typeTransaction: recordLog.typeTransaction}));
                return cancellations;
            } catch (error) {
                log.error("Error [getInputData]", error);
                return [["isErrorInput", error.message]];
            }
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
            try {

                if (mapContext.value.indexOf("isError") != -1) {
                    mapContext.write({
                        key: mapContext.key,
                        value: mapContext.value
                    });
                } else {
                    let transactionsResult;
                    const parameters = lbryRCD.getParameters();

                    const cancellations = JSON.parse(mapContext.value);
                    
                    if (parameters.reversalVoiding == 'T' || parameters.reversalVoiding == true) {
                        transactionsResult = lbryRCD.reverseCancellation(cancellations);
                    }

                    mapContext.write({
                        key: mapContext.key,
                        value: [cancellations.idTransaction,"T",transactionsResult.void,transactionsResult.reverse]
                    });

                }
            } catch (error) {
                log.error("Error", error);
                mapContext.write({
                    key: mapContext.key,
                    value: ["isError",error.message]
                });
            }
        }

        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
            const parameters = lbryRCD.getParameters();
            let results = [];
            try {
                summaryContext.output.iterator().each(function (key, value) {
                    results.push(JSON.parse(value));
                    return true;
                });
                const errors = results.filter(function (error) { return error[0] == 'isError' || error[0] == 'isErrorInput'});
                
                let recordLog = lbryRCD.getRecordsLog(parameters);
                let transactionIds = JSON.parse(recordLog.idTransaction);
                let idsSuccess = [];
                let idsSuccessObject = [];
                results.forEach(transaction => {
                    if (transaction[1] == 'T') {
                        idsSuccess.push(transaction[0]);
                        idsSuccessObject.push({main: transaction[0],void: transaction[2],reverse: transaction[3]});
                    }
                });
                
                const idsError = transactionIds.filter(idTransaction => !idsSuccess.includes(idTransaction));
                
                let transactions = [];
                idsSuccessObject.forEach( transaction => {
                    transactions.push(
                        {
                            id : transaction.main, 
                            state : 'Procesada con exito',
                            transactionVoid: transaction.void,
                            transactionReserve: transaction.reverse
                        });
                });
                idsError.forEach( id => {
                    transactions.push({id : id , state : 'Error'});
                });
    
                
                if (transactions.indexOf(1)==-1) {
                    lbryRCD.updateTransactionState(parameters,transactions);
                }
                
                if (errors.length == 0) {
                
                    lbryRCD.updateState(parameters, 'Finalizado', 'La reversión de las anulaciones se ha realizado con exito');
                    
                } else { 
                    
                    log.error("error Summarize [interno]", errors[0][1]);
                    lbryRCD.updateState(parameters, 'Ocurrió un error', errors[0][1]);
                }
            } catch (error) {
                lbryRCD.updateState(parameters, 'Ocurrió un error', error.message);
            }
        }

        return { getInputData, map, summarize }

    });
