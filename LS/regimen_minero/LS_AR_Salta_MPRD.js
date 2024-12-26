/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType MapReduceScript
 * @Name LS_AR_Salta_MPRD.js
 * @Author anthony@latamready.com
 */
define(["./handler/LS_AR_Salta_HANDLER"], function (Salta) {
    function getInputData() {
        const SaltaHandler = new Salta();
        return SaltaHandler.getInputData();
    }

    function map(context) {
        const SaltaHandler = new Salta(context);
        SaltaHandler.map();
    }

    function reduce(context) {
        const SaltaHandler = new Salta(context);
        SaltaHandler.reduce();
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce
        // summarize: summarize
    };
});
