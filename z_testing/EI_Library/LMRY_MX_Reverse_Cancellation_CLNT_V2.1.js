/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @Name LMRY_MX_Reverse_Cancellation_CLNT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/04/2024
 */
 define(['./LMRY_MX_Reverse_Cancellation_CLNT_LBRY_V2.1', 'N/url', 'N/currentRecord'], function (
    lbryReverseCancelationClnt,
    urlApi, 
    currentRecord
) {
    const STLT_ID = 'customscript_lmry_mx_rever_canc_stlt';
    let DEPLOY_ID = null;
    let handler = null;

    function pageInit(context) {
        console.log(lbryReverseCancelationClnt);
        let recordObj = context.currentRecord;
        DEPLOY_ID = recordObj.getValue('custpage_deploy_id');
        let featurelatam = recordObj.getValue('custpage_feature_latam');
        handler = new lbryReverseCancelationClnt.ClntHandler({
            deployid: DEPLOY_ID,
            featurelatam: featurelatam
        });
        console.log(handler);
    }
    function validateField(context){
        return handler.validateField(context);
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

    function toggleCheckBoxes(isApplied) {
        let recordObj = currentRecord.get();
        let numberLines = recordObj.getLineCount({ sublistId: 'custpage_results_list' });
        for (let i = 0; i < numberLines; i++) {
            recordObj.selectLine({ sublistId: 'custpage_results_list', line: i });
            recordObj.setCurrentSublistValue({ sublistId: 'custpage_results_list', fieldId: 'apply', value: isApplied });
        }
    }

    return { pageInit,validateField,saveRecord,back,toggleCheckBoxes};
});
