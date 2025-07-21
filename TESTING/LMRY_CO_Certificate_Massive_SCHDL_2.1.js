/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @Name LMRY_CO_Certificate_Massive_SCHDL_2.1.js
 * @NModuleScope Public
 */
define([
    'N/log',
    'N/record',
    'N/search',
    'N/format',
    'N/runtime',
    'N/task',
], (
    log,
    record,
    search,
    format,
    runtime,
    task
) => {

    function execute(scriptContext) {
        try {
            const getParam = name => runtime.getCurrentScript().getParameter({ name });
            const paramRecordMassiveId = getParam('custscript_lmry_co_massive_record_id');
            log.error("paramRecordMassiveId",paramRecordMassiveId)
            log.error("EXECUTE GADP","start")
        } catch (error) {

        }
    }

    return {
        execute
    };
});
