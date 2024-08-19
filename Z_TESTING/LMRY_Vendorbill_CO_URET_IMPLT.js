/**
 * @NApiVersion 2.1
 * @NScriptType plugintypeimpl
 * @Name LMRY_Vendorbill_CO_URET_IMPLT.js
 * @Auhor joshep@latamready.com
 */
define([
    "N/log",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/error/LR_Error_LIB",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/licenses/LR_Licenses_LIB",
    "../../constants/LR_CO_FEATURES_CONST",
    "../../co_new_withholding_lines/lib/LR_CO_New_WithholdingLines_LIB",
    "N/runtime",
    "../../co_new_withholding_lines/lib/LR_WHT_Variable_Rate_popup_LIB"

], function (
    nLog, 
    Lib_Error, 
    Lib_Licenses, 
    CO_FEAT, 
    Lib_WhtLines2, 
    runtime,
    Lib_variableRate
) {
    const { FeatureManager } = Lib_Licenses;

    const beforeLoad = (context) => {

        const {type,newRecord,form} = context;
        const {executionContext} = runtime;
        const FEAT_SUBS = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
        const subsidiary = newRecord.getValue("subsidiary");
        if(FEAT_SUBS && !subsidiary) return 0;

        const featureManager = new FeatureManager(subsidiary);
        const isVariableRate = Lib_WhtLines2.getFeatureVariableRate(subsidiary);
        
        if (executionContext == "USERINTERFACE") {
            if (
                featureManager.isActive(CO_FEAT.LOCALIZATION) && 
                featureManager.isActive(CO_FEAT.WHT_NEW_LINES_PURCHASE)
            ) {
                if (["create", "edit", "copy"].includes(type)) {
                    Lib_WhtLines2.manageRetentionFields(context);
                }
                if (isVariableRate) {
                    if (["create", "edit", "copy"].includes(type)) {
                        Lib_WhtLines2.createFields(context);
                    }
                    if (["view"].includes(type)) {
                        Lib_WhtLines2.createSublistVariableRate(context);
                    }
                }
                if (["view"].includes(type)) {
                    Lib_variableRate.createWhtUpdateButton(context);
                }
            }else{
                Lib_WhtLines2.hiddenLineFields(form);
            }
        }
        

    };

    const beforeSubmit = (context) => {
        const {type,newRecord} = context;
        const {executionContext} = runtime;
        const subsidiary = newRecord.getValue("subsidiary");
        const featureManager = new FeatureManager(subsidiary);
        const isVariableRate = Lib_WhtLines2.getFeatureVariableRate(subsidiary);
        
        if (executionContext == "USERINTERFACE") {
            if (
                featureManager.isActive(CO_FEAT.LOCALIZATION) && 
                featureManager.isActive(CO_FEAT.WHT_NEW_LINES_PURCHASE)
            ) {
                if (["edit"].includes(type)) {
                    newRecord.setValue('custbody_lmry_scheduled_process', false);
                }
                Lib_WhtLines2.setLinesValueRetention(context);
                if (isVariableRate) {
                    if (["create", "edit", "copy"].includes(type)) {
                        Lib_WhtLines2.saveWhtVariableRate(context);
                    }
                }    
            }
        }
        
    };

    const afterSubmit = (context) => {
        try {
            let { type, newRecord } = context;
            if (["create", "edit", "copy"].includes(type)) {
                let subsidiary = newRecord.getValue("subsidiary");
                let featureManager = new FeatureManager(subsidiary);
                if (
                    featureManager.isActive(CO_FEAT.LOCALIZATION) && 
                    featureManager.isActive(CO_FEAT.WHT_NEW_LINES_PURCHASE)
                ) {
                    Lib_WhtLines2.createWithholdingLines(context);
                }
            }
        } catch (err) {
            Lib_Error.handleError({ title: "[afterSubmit]", err });
        }
    };

    return {
        beforeLoad,
        beforeSubmit,
        afterSubmit
    };
});
