/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @Name LMRY_PY_Foreign_Purchase_WHT_CLNT_V2.1.js
 * @Author gerson@latamready.com
 */
define(["./LMRY_PY_Foreign_Purchase_WHT_CLNT_LBRY_V2.1", "N/url", "N/currentRecord"],
    function (lbryPayment, urlApi, currentRecord) {
        const STLT_ID = "customscript_lmry_py_wht_purchase_stlt";
        const DEPLOY_ID = "customdeploy_lmry_py_wht_purchase_stlt";
        let handler = null;

        function pageInit(context) {
            handler = new lbryPayment.ClntHandler();
            console.log(handler);
            handler.pageInit(context);
        }

        function fieldChanged(context) {
            handler.fieldChanged(context);
        }

        function saveRecord(context) {
            return handler.saveRecord(context);
        }

        function back() {
            let urlSuitelet = urlApi.resolveScript({
                scriptId: STLT_ID,
                deploymentId: DEPLOY_ID,
                returnExternalUrl: false
            });

            window.location.href = urlSuitelet;
        }

        function toggleCheckBoxes(isApplied, sublistId) {
            let recordObj = currentRecord.get();
            let numberLines = recordObj.getLineCount({ sublistId: sublistId });
            for (let i = 0; i < numberLines; i++) {
                recordObj.selectLine({ sublistId: sublistId, line: i });
                recordObj.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'apply', value: isApplied });
            }
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            fieldChanged: fieldChanged,
            back: back,
            toggleCheckBoxes: toggleCheckBoxes
        }
    });