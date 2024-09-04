/**
 * @NApiVersion 2.1
 * @NScriptType plugintypeimpl
 * @Name LMRY_Invoice_CO_URET_IMPLT.js
 * @Auhor joshep@latamready.com
 */
define([
    "N/log",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/error/LR_Error_LIB",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/licenses/LR_Licenses_LIB",
    "../../constants/LR_CO_FEATURES_CONST",
    "../../co_new_withholding_lines/lib/LR_CO_New_WithholdingLines_LIB",
    "N/runtime", "N/search",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/features/LR_Features_CONST",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/hideAndView/LR_HideView_LIB",
    "../../co_revenue_arrangement/lib/LR_CO_Revenuve_Arrangement_LIB"
], function (nLog, Lib_Error, Lib_Licenses, CO_FEAT, Lib_WhtLines2, runtime, search, Features_CONST, Lib_HideView, Lib_Revenue) {
    const { FeatureManager } = Lib_Licenses;

    const beforeLoad = (context) => {
        try {
            const features = new Features_CONST.features();
            const FEAT_SUBS = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const { executionContext } = runtime;
            const { type, newRecord, form } = context;
            const { type: transType } = newRecord;
            const subsidiary = newRecord.getValue("subsidiary");
            if (FEAT_SUBS && !subsidiary) return 0;
            const featureManager = new FeatureManager(subsidiary);
            if (featureManager.isActive(CO_FEAT.LOCALIZATION)) {
                if (executionContext == 'USERINTERFACE' && ["create", "edit", "copy", "view"].includes(type)) {
                    let setupTax = getSetupTaxSubsidiary(subsidiary, features);
                    if (setupTax.unBilledrevenue === true || setupTax.unBilledrevenue === 'T') {
                        let customAdvancedInvoice = form.getField('custbody_lmry_carga_inicial');
                        if (customAdvancedInvoice) {
                            let jsonCustom = {
                                'customAdvancedInvoice': {
                                    'en': 'Latam - Advanced Invoice',
                                    'es': 'Latam - Factura Avanzada',
                                    'pt': 'Latam - Fatura Avançada'
                                }
                            }
                            customAdvancedInvoice.label = jsonCustom["customAdvancedInvoice"][features.LANGUAGE] ? jsonCustom["customAdvancedInvoice"][features.LANGUAGE] : jsonCustom["customAdvancedInvoice"]['en'];
                        }
                    }
                }
            }

            if (featureManager.isActive(CO_FEAT.ADV_HIDE_VIEW)) {
                const docTypeTemp = newRecord.getValue("custbody_lmry_document_type");                
                if (executionContext == "USERINTERFACE" && type == "view") {
                    Lib_HideView.hideFields(form, "CO", transType, docTypeTemp, true, FeatureManager);
                    Lib_HideView.hideColumns(form, "CO", transType, docTypeTemp, true, FeatureManager);
                    Lib_HideView.hideSubTab(form, "CO", transType, docTypeTemp, true);
                }
            }
     
        } catch (error) {
            Lib_Error.handleError({ title: "[beforeLoad]", error });
        }
    };

    const beforeSubmit = (context) => {};

    const afterSubmit = (context) => {
        try {
            const features = new Features_CONST.features();
            let { type, newRecord } = context;
            let subsidiary = newRecord.getValue("subsidiary");
            let featureManager = new FeatureManager(subsidiary);
            if (featureManager.isActive(CO_FEAT.LOCALIZATION)) {
                let setupTax = getSetupTaxSubsidiary(subsidiary, features);
                if (["create", "edit"].includes(type)) {
                    if (setupTax.unBilledrevenue === true || setupTax.unBilledrevenue === 'T') {
                        Lib_Revenue.updateRevenueArrangement(newRecord)
                    }
                }
            }
        } catch (err) {
            Lib_Error.handleError({ title: "[afterSubmit]", err });
        }
    };

    const getSetupTaxSubsidiary = (subsidiary, features) => {
        let filters = [["isinactive", "is", "F"]];
        if (features.SUBSIDIARY) {
            filters.push("AND", ["custrecord_lmry_setuptax_subsidiary", "anyof", subsidiary]);
        }
        let setupSearch = search.create({
            type: "customrecord_lmry_setup_tax_subsidiary",
            filters: filters,
            columns: ["custrecord_lmry_setuptax_unb_rvn_recognt"]
        });
        let results = setupSearch.run().getRange(0, 1);
        if (results && results.length) {
            let unBilledrevenue = results[0].getValue("custrecord_lmry_setuptax_unb_rvn_recognt");
            return {
                unBilledrevenue
            };
        }
        return {};
    };

    return {
        beforeLoad,
        beforeSubmit,
        afterSubmit
    };
});
