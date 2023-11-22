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
define([
    "N/search",
    "N/record", 
    "N/log",
    '/SuiteBundles/Bundle 245636/EI_Library/LMRY_AnulacionInvoice_LBRY_V2.0',
    '/SuiteBundles/Bundle 245636/EI_Library/LMRY_BR_EI_Void_LBRY_V2.0',
    '/SuiteBundles/Bundle 245636/EI_Library/LMRY_AnulacionBill_LBRY_V2.0',
    '/SuiteBundles/Bundle 245636/EI_Library/LMRY_PE_AnulacionInvoice_LBRY_V2.0'],
function (search, record, log, invoiceCancellation,billCreditVoid, billVoid,voideInvoicePE) {

    function execute(Context) {
        // ID de la transacción que deseas duplicar
        try {
            //var invoiceId = "1041271";
            //var billCredit = "3913909";
            //var billId = "1360844";
            var invoiceId = "2347051";
            //var result = invoiceCancellation.anularInvoice(invoiceId);
            //var result = billCreditVoid.voidBillCredit(billCredit);
            //var result = billVoid.anularBill(billId);
            var result = voideInvoicePE.anularTransaction(invoiceId,"invoice");
            log.error("Respuesta",result);
            
        } catch (error) {
            log.erro("error",error)
        }

    }

   

    return {
        execute: execute
    };
});


