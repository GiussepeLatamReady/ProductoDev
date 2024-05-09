/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for WTH on Purchases                           ||
||                                                              ||
||  File Name: LMRY_BR_WHT_Purchase_STLT_V2.1.js                ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Oct 31 2022  LatamReady    Use Script 2.1           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Author gerson@latamready.com
**/

define(["N/log","N/redirect", "N/task", "N/runtime", "./Latam_Library/LMRY_BR_WHT_Purchase_STLT_LBRY_V2.1"],
    function (log,redirect, task, runtime, lbryBRWHTPurchase) {
        const ScriptName = "LatamReady - BR WHT Purchase STLT";
        const CLIENT_SCRIPT = "./Latam_Library/LMRY_BR_WHT_Purchase_CLNT_V2.1.js"; 

        function onRequest(context) {

            const STLT_ID = runtime.getCurrentScript().id;
            const DEPLOY_ID = runtime.getCurrentScript().deploymentId;

            let params = context.request.parameters;
            log.error("params",params)
            let handler = new lbryBRWHTPurchase.LibraryHandler({
                params: context.request.parameters,
                method: context.request.method
            });

            if (context.request.method == "GET") {
                try {
                    const status = Number(params.status);
                    log.debug("status", status);

                    let form = handler.createForm();
                    handler.createBillSublist();

                    if (!status) {
                        handler.loadFormValues();
                    } else {
                        handler.setFormValues();
                        handler.loadBillSublist();
                        handler.createAdvanceSublist();
                        handler.loadAdvanceSublist();
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
                    log.debug("status", status);
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