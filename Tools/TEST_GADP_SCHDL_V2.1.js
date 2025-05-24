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
    "N/runtime",
    "N/https",
    '/SuiteBundles/Bundle 243159/EI_Library/LMRY_AnulacionInvoice_LBRY_V2.0'
],
    function (file, search, record, log, query, runtime, https,library_AnulacionInvoice) {

        function execute(Context) {
            try {
                
                //reversalJournalClosedPeriod("4286431");


                HideEntityFields()

            } catch (error) {
                log.error('Error execute', error)
            }

        }
        return {
            execute: execute
        };
    });


