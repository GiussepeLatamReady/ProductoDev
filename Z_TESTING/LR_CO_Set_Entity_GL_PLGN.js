/**
 * @NApiVersion 1.0
 * @NScriptType customgllines
 * @Name LR_CO_Set_Entity_GL_PLGN.js
 * @Auhor giussepe@latamready.com
 */
var objContext = nlapiGetContext();

var scriptName = 'LR - CO Set Entity GL';


function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    try {
        var entity = transactionRecord.getFieldValue("entity");
        nlapiLogExecution("DEBUG", "[entity]", entity);

        
    } catch (err) {
        nlapiLogExecution("ERROR", "[customizeGlImpact]", err);
    }
}