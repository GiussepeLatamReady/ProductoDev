/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name LMRY_CO_Header_WHT_calculation_Cron_MPRD_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 02/01/2024
 */
define([
    "N/record",
    "N/runtime",
    "N/search",
    "N/log",
    "N/format",
    "./WTH_Library/LMRY_CO_Header_WHT_calculation_LBRY_V2.1",
    "./LMRY_CO_Header_WHT_calculation_STLT_V2.1",
    "./LMRY_CO_Header_WHT_calculation_CLNT_V2.1"
],

    (record, runtime, search, log, format, lbryWHTHeader, SuiteletForm, ClntForm) => {

        let processExecution = {
            date: format.format({
                value: new Date(),
                type: format.Type.DATE,
                timezone: format.Timezone.AMERICA_BOGOTA
            })
        };
        let parameters = {};


        const getInputData = (inputContext) => {
            try {

                const formInstance = new SuiteletForm.SuiteletFormManager({});
                const recordInstance = new ClntForm.ClientUIManager({});
                let transactions = getTransactions(formInstance);



                //const parameters = getParameters();
                //log.error("getInputData parameters", parameters)
                //const transactions = getTransactionsFromRecord(parameters);
                updateState(parameters, 'Procesando', 'Se ha comenzado a procesar las transacciones...');
                log.error("transactions", transactions)
                return transactions;



            } catch (error) {
                log.error("Error [getInputData]", error);
                return [["isErrorInput", error.message]];
            }
        }


        const map = (mapContext) => {
            try {
                log.error("value", JSON.parse(mapContext.value))
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
                        lbryWHTHeader.updateWthInformationByLine(transaction.id);
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

                const transactionsData = getTransactionsFromRecord(parameters);
                const transactionIds = transactionsData.map(({ id }) => id);
                const idsSuccess = results.filter(([key, value]) => value === 'T').map(([id]) => id);
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
                log.error("error Summarize [interno]", error);
                log.error("error Summarize [interno]", error.message);
                updateState(parameters, 'Ocurrió un error', error.message);
            }
        };


        const getParameters = () => {

            return {
                idUser: runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_co_head_wht_calc_user' }),
                idLog: runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_co_head_wht_calc_state' }),
            }
        }

        const getTransactions = (processExecution) => {
            let transactions = [];
            processExecution.authorise = formInstance.areThereSubsidiaries();

            if (processExecution.authorise) {

                const currentDate = processExecution.date;

                formInstance.subsidiaries?.filter(sub => sub.active).forEach(activeSub => {
                    ['header', 'line'].forEach(whtType => {
                        ['purchases', 'sales'].forEach(typeProcess => {
                            const params = { subsidiary: activeSub, startDate: currentDate, endDate: currentDate, whtType, typeProcess };
                            formInstance.setParams(params);
                            transactions = transactions.concat(formInstance.getTransactions().map(transaction => transaction.whtType = whtType));
                        });
                    });
                });
                return transactions;
            } else {
                return [];
            }
        }

        const setForms = (subsidiaries) => {
            processExecution.forms = new Array();
            subsidiaries.forEach(subsidiary => {
                let form = {
                    subsidiary: subsidiary,
                    typeProcess: "H"
                }

            });
        }


        const getTransactionsFromRecord = (parameters) => {
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
            //return [{"id":"3947913","whtType":"header"}]
            log.error("recordLog.idTransaction", recordLog.idTransaction);
            return JSON.parse(recordLog.idTransaction).map(id => ({ id: id, whtType: recordLog.whtType }));
        }

        /* ------------------------------------------------------------------------------------------------------
        * Esta funcion permite actualiazr el estado del proceso segun la etapa del flujo del modulo.
        * --------------------------------------------------------------------------------------------------- */
        const updateState = (parameters, msgState, msgDetails) => {
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

        const updateTransactionState = (parameters, transactions) => {
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