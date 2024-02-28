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
define(["N/search","N/record", "N/log","N/query", "N/runtime"],
    function (search, record, log, query, runtime) {

        function execute(Context) {
            // ID de la transacción que deseas duplicar
            try {
                //var invoiceId = "1041271"
                //var result = record.create({ type:"customtransaction_lmry_ei_voided_transac"});
                //log.error("type",result.getValue("type"));
                 /*
                for (var i = 0; i < 25; i++) {
                    copyCreditMemo("3939035");
                }
                */
                //voidCreditMemo("3939157",true);
                deleteTaxResults("3959312");
                //searchTransaction("3914166");
                //log.error("account",creditMemoSearch.accountmain[0].value);


                
            } catch (error) {
                log.error("error",error)
            }

        }
        function deleteTaxResults(id) {
            var searchRecordLog = search.create({
                type: 'customrecord_lmry_br_transaction',
                filters: [
                    ['custrecord_lmry_br_transaction', 'is', id]
                ],
                columns: [
                    'internalid'
                ]
            })
            searchRecordLog.run().each(function (result) {
                var idTax = result.getValue(result.columns[0]);
    
                var idTaxLog = record.delete({
                    type: 'customrecord_lmry_br_transaction',
                    id: idTax,
                    isDynamic: true
                });
                return true;
            });
        }

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

       

        return {
            execute: execute
        };
    });


