/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name LMRY_AR_Wht_Send_Email_MPRD_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 18/07/2024
 */
define([
    "N/record",
    "N/runtime",
    "N/search",
    "N/log",
    "./CO_Library_Mensual/LMRY_CO_Header_WHT_calculation_LBRY_V2.1",
],(
    record, 
    runtime, 
    search, 
    log, 
    lbryWHTHeader
) => {
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
                    }
                    mapContext.write({
                        key: mapContext.key,
                        value: [transaction.id, "T"]
                    });

                }
            } catch (error) {
                log.error("Error [map]", error);
                mapContext.write({
                    key: mapContext.key,
                    value: ["isError", error.message]
                });
            }
        }

        const summarize = summaryContext => {
            const parameters = getParameters();
            try {
                
                const results = [];
                summaryContext.output.iterator().each(function (key, value) {
                    results.push(JSON.parse(value));
                    return true;
                });
                const errors = results.filter(([key]) => key === 'isError' || key === 'isErrorInput');
        
                const transactionsData = getTransactions(parameters);
                const transactionIds = transactionsData.map(({id}) => id);
                const idsSuccess = results.filter(([key, value]) => value === 'T').map(([id]) => id);
                const idsError = transactionIds.filter(id => !idsSuccess.includes(id));
        
                const transactions = [
                    ...idsSuccess.map(id => ({id, state: 'Procesada con exito'})),
                    ...idsError.map(id => ({id, state: 'Error'}))
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
                idUser: runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_ste_ar_wht_se_user' }),
                idLog: JSON.parse(runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_ste_ar_wht_se_state' })),
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
            let recordLog = [];
            let searchRecordLog = search.create({
                type: 'customrecord_lmry_ste_ar_wht_se',
                filters: [
                    ['internalid', 'anyof', parameters.idLog]
                ],
                columns: [
                    'custrecord_lmry_ste_ar_wht_se_payments',
                    'custrecord_lmry_ste_ar_wht_se_vendor'
                ]
            })
            searchRecordLog.run().each(function (result) {
                recordLog.push({
                    transactions: result.getValue('custrecord_lmry_ste_ar_wht_se_payments'),
                    vendor: result.getValue('custrecord_lmry_ste_ar_wht_se_vendor')
                })
                return true;
            });
            

            recordLog.forEach(({transactions,vendor})=>{
                
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