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
define(["N/search","N/record", "N/log",'/SuiteBundles/Bundle 245636/EI_Library/LMRY_AnulacionInvoice_LBRY_V2.0'],
    function (search, record, log, invoiceCancellation) {

        function execute(Context) {
            // ID de la transacción que deseas duplicar
            try {
                var invoiceId = "1041271"
                var result = invoiceCancellation.anularInvoice(invoiceId);
                log.error("Respuesta",result);

            } catch (error) {
                log.erro("error",error)
            }

        }

       

        return {
            execute: execute
        };
    });


