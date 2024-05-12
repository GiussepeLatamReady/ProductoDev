/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_MX_Reverse_Cancellation_Log_STLT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */
define(["./EI_Library/LMRY_MX_Reverse_Cancellation_Log_LBRY_V2.1"],
    function (lbryBRWHTPurchaseLog) {

        function onRequest(context) {

            let handler = new lbryBRWHTPurchaseLog.LibraryHandler({
                params: context.request.parameters,
                method: context.request.method
            });

            if (context.request.method == "GET") {
                try {
                    let form = handler.createLogForm();
                    handler.createSublist();
                    handler.loadSublist();
                    context.response.writePage(form);
                } catch (err) {
                    log.error("[ onRequest - GET ]", err);
                }
            } else {
                try {
                    handler.toMainSuitelet();
                } catch (err) {
                    log.error("[ onRequest - POST ]", err);
                }
            }
        }

        return {
            onRequest: onRequest
        }
    });