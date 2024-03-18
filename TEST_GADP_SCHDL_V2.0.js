/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =*\
||  This script for Report - Chile                                      ||
||                                                                      ||
||  File Name: TEST_GADP_SCHDL_V2.0.js                       ||
||                                                                      ||
||  Version Date           Author            Remarks                    ||
||  2.0     April 01 2023  Giussepe Delgado  Use Script 2.0             ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(["N/search", "N/record", "N/log", "N/query", "N/runtime"],
    function (search, record, log, query, runtime) {

        function execute(Context) {
            // ID de la transacción que deseas duplicar
            try {
                //var invoiceId = "1041271"
                //var result = record.create({ type:"customtransaction_lmry_ei_voided_transac"});
                //log.error("type",result.getValue("type"));
                /*
                for (var i = 0; i < 25; i++) {
                    copyCreditMemo("3957662");
                }
                */
                //voidCreditMemo("3939157",true);s

                //searchTransaction("3914166");
                //log.error("account",creditMemoSearch.accountmain[0].value);

                updatePercetion();


            } catch (error) {
                log.error("error", error)
            }

        }

        function updatePercetion(){

            var currentRecord = record.load({
                type: 'salesorder',
                id: "3967092"
            });
            var lines = currentRecord.getLineCount('item');
            for (var i = 0; i < lines; i++) {
                var tiene_tributo = currentRecord.getSublistValue('item', 'custcol_lmry_ar_item_tributo', i);
                if (tiene_tributo) {
                    currentRecord.setSublistValue('item', 'quantity', i, 1);
                    currentRecord.setSublistValue('item', 'rate', i, parseFloat(300));
                }
            }
            
            currentRecord.save();
        }

        function copyCreditMemo(transactionId) {
            // Duplicar la transacción
            var duplicatedTransaction = record.copy({
                type: record.Type.VENDOR_BILL, // Reemplaza con el tipo de transacción adecuado
                id: transactionId,
            });

            // Puedes realizar modificaciones en la transacción duplicada si es necesario

            duplicatedTransaction.setValue({
                fieldId: 'memo',
                value: 'Copias generadas gadp',
            });

            duplicatedTransaction.setValue({
                fieldId: 'approvalstatus',
                value: '2',
            });

            // Guardar la transacción duplicada
            var newTransactionId = duplicatedTransaction.save();

            log.error('Transacción duplicada', 'Nueva transacción ID: ' + newTransactionId);
        }

        /*
        function searchTransaction(id) {
            var transaction = {};
            var searchFilters = [
                ["internalid", "anyof", id],
                "AND",
                ["mainline", "is", "T"]
            ];
    
            var searchColumns = [];
            searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{internalid}'}));
            searchColumns.push(search.createColumn({name: 'amount', join: 'item'}))
            let settings = [];
            
            settings = [search.createSetting({ name: 'consolidationtype', value: 'NONE' })];
            
    
            search.create({
                type: 'transaction',
                filters: searchFilters,
                columns: searchColumns,
                settings:settings
            }).run().each( function (result){
                var columns = result.columns;
                transaction.id = result.getValue(columns[0])
            });
            log.error("transaction",transaction)
        }
        */


        return {
            execute: execute
        };
    });


