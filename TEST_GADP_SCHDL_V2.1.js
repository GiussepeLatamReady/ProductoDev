/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =*\
||  This script for Report - Chile                                      ||
||                                                                      ||
||  File Name: TEST_GADP_SCHDL_V2.0.js                       ||
||                                                                      ||
||  Version Date           Author            Remarks                    ||
||  2.0     April 01 2023  Giussepe Delgado  Use Script 2.0             ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define([
    'N/file',
    "N/search", 
    "N/record", 
    "N/log", 
    "N/query", 
    "N/runtime"
],
    function (file,search, record, log, query, runtime,libryVoidItemReceipt) {

        function execute(Context) {
            // ID de la transacción que deseas duplicar
            try {
                deleteAllRecord();
            } catch (error) {
                log.error("error", error)
            }

        }

        


        const deleteAllRecord = () => {
            /* Query */
            const max = 5;
            let i=0;
            search.create({
                type: "customrecord_lmry_br_ibpt",
                filters: [],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    })
                ]
            }).run().each(result => {
                const internalid = result.getValue("internalid");
                if (i>max) return false;
                const idrecord =record.delete({
                    type: 'customrecord_lmry_br_ibpt',
                    id: internalid,
                });
                i++
                log.error("idrecord",idrecord)
                return true;
            });
        }

        

        return {
            execute: execute
        };
    });


