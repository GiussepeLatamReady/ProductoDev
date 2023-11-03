/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for WTH on Purchases                           ||
||                                                              ||
||  File Name:  SMC_MX_Reverse_Cancellation_STLT_V2.1.js        ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Oct 04 2023  LatamReady    Use Script 2.1           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Author master@latamready.com
 **/

define(["N/log","N/redirect", "N/runtime", "./Latam_Library/SMC_MX_Reverse_Cancellation_LBRY_V2.1"],
    function (log,redirect, runtime, lbryMXReverseCancellation) {
        const ScriptName = "SMC - MX Canceled Documents Reversed STLT";
        const CLIENT_SCRIPT = "./SMC_MX_Reverse_Cancellation_CLNT_V2.1.js";

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