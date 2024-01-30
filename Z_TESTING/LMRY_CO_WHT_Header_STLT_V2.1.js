/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_CO_WHT_Header_Purchase_STLT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */
define([
    "N/log",
    "N/redirect", 
    "N/runtime", 
    "./Latam_Library/LMRY_CO_WHT_Header_Purchase_STLT_LBRY_V2.1.js"],
    function (log,redirect, runtime, lbryHeaderWhtCalc) {
        const ScriptName = "LatamReady - CO WHT Header Purchase STLT";
        const CLIENT_SCRIPT = "./LMRY_CO_WHT_Header_Purchase_CLNT_V2.1.js";

        function onRequest(context) {

            const STLT_ID = runtime.getCurrentScript().id;
            const DEPLOY_ID = runtime.getCurrentScript().deploymentId;

            let params = context.request.parameters;
            let handler = new lbryHeaderWhtCalc.LibraryHandler({
                params: context.request.parameters,
                method: context.request.method
            });

            if (context.request.method == "GET") {
                try {
                    const status = Number(params.status);

                    let form = handler.createForm();
                    handler.createTransactionSublist();

                    if (!status) {
                        handler.loadFormValues();
                    } else {
                        handler.setFormValues();
                        handler.loadTransactionSublist();
                    }

                    form.clientScriptModulePath = CLIENT_SCRIPT;

                    context.response.writePage(form);
                } catch (err) {
                    log.error("[ onRequest - GET ]", err);
                    //lbryMail.sendemail('[ onRequest - GET ]' + err, ScriptName);
                }

            } else {
                try {
                    const status = Number(params.custpage_status);
                    log.debug("POST - status", status);
                    if (!status) {
                        redirect.toSuitelet({
                            scriptId: STLT_ID,
                            deploymentId: DEPLOY_ID,
                            parameters: handler.getRedirectParams()
                        });
                    } else {
                        let logIdparam = params.custpage_log_id;
                        let parametros = {
                            state: logIdparam,
                            user: runtime.getCurrentUser().id
                        };

                        handler.runMapReduce(parametros);
                        handler.toLogSuitelet();
                        
                    }

                } catch (err) {
                    log.error("[ onRequest - POST ]", err);
                    //lbryMail.sendemail('[ onRequest - GET ]' + err, ScriptName);
                }
            }
        }

        return {
            onRequest: onRequest
        }
    });