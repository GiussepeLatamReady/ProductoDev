/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_MX_Reverse_Cancellation_STLT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */
define(["N/log","N/redirect", "N/runtime", "./EI_Library/LMRY_MX_Reverse_Cancellation_LBRY_V2.1"],
    function (log,redirect, runtime, lbryMXReverseCancellation) {
        const ScriptName = "LMRY - MX Canceled Documents Reversed STLT";
        const CLIENT_SCRIPT = "./EI_Library/LMRY_MX_Reverse_Cancellation_CLNT_V2.1.js";

        function onRequest(context) {

            const STLT_ID = runtime.getCurrentScript().id;
            const DEPLOY_ID = runtime.getCurrentScript().deploymentId;

            let params = context.request.parameters;
            let handler = new lbryMXReverseCancellation.LibraryHandler({
                params: context.request.parameters,
                method: context.request.method
            });

            if (context.request.method == "GET") {
                try {
                    const status = Number(params.status);

                    let {form,isActive} = handler.createForm();

                    if (isActive) {
                        handler.createTransactionSublist();

                        if (!status) {
                            handler.loadFormValues();
                        } else {
                            handler.setFormValues();
                            handler.loadTransactionSublist();
                        }
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