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
    "../../co_new_withholding_lines/lib/LR_CO_New_WithholdingLines_LIB"
], function (nLog, Lib_Error, Lib_Licenses, CO_FEAT, Lib_WhtLines2) {
    const { FeatureManager } = Lib_Licenses;

    const beforeLoad = (context) => {
        Lib_WhtLines2.createWithholdingLines(context);
    };

    const beforeSubmit = (context) => {};

    const afterSubmit = (context) => {
        try {
            let { type, newRecord } = context;
            if (["create", "edit", "copy"].includes(type)) {
                let subsidiary = newRecord.getValue("subsidiary");
                let featureManager = new FeatureManager(subsidiary);
                if (featureManager.isActive(CO_FEAT.LOCALIZATION) && featureManager.isActive(CO_FEAT.WHT_NEW_LINES_PURCHASE)) {
                    
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
