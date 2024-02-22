/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_PY_Foreign_Purchase_WHT_STLT_V2.1.js
 * @Author gerson@latamready.com
 */
define(["./Latam_Library/LMRY_PY_Foreign_Purchase_WHT_STLT_LBRY_V2.1", "./Latam_Library/LMRY_Log_LBRY_V2.0", "./Latam_Library/LMRY_libSendingEmailsLBRY_V2.0"],
    (lbryWHT, lbryLog, lbryMail) => {

        const ScriptName = "LatamReady - PY Foreign Purch WHT STLT";
        const CLIENT_SCRIPT = "./Latam_Library/LMRY_PY_Foreign_Purchase_WHT_CLNT_V2.1";
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let params = scriptContext.request.parameters;
            let handler = new lbryWHT.PYStltHandler({
                params: scriptContext.request.parameters,
                method: scriptContext.request.method
            });
            if (scriptContext.request.method === "GET") {
                try {
                    const status = Number(params.status);
                    log.debug("status", status);

                    let form = handler.createForm();
                    handler.createSublist();

                    if (!status) {
                        handler.loadFormValues();
                    } else {
                        handler.setFormValues();
                        handler.loadSublist();
                        handler.loadSublistAccoutingBooks();
                    }

                    form.clientScriptModulePath = CLIENT_SCRIPT;

                    scriptContext.response.writePage(form);
                } catch (error) {
                    log.error("[ onRequest - GET ]", error);
                    lbryLog.doLog({ title: "[ onRequest - GET ]", message: error, relatedScript: ScriptName });
                    lbryMail.sendemail('[ onRequest - GET ]' + error, ScriptName);
                }
            } else {
                try {
                    const status = Number(params.custpage_status);
                    log.debug("status", status);
                    if (!status) {
                        handler.toSuitelet();
                    } else {
                        handler.executeMapReduce();
                        handler.toLogSuitelet();
                    }

                } catch (error) {
                    log.error("[ onRequest - POST ]", error);
                    lbryLog.doLog({ title: "[ onRequest - POST ]", message: error, relatedScript: ScriptName });
                    lbryMail.sendemail('[ onRequest - POST ]' + error, ScriptName);
                }
            }
        }

        return { onRequest }

    });