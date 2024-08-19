/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_VendorCredit_CO_CLNT_HNDL.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 10/07/2024
 */
define([
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/error/LR_Error_LIB",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/licenses/LR_Licenses_LIB",
    "../../constants/LR_CO_FEATURES_CONST",
    "../../co_new_withholding_lines/lib/LR_WHT_Variable_Rate_popup_LIB"
]
, (
    Lib_Error,
    Lib_Licenses,
    CO_FEAT,
    Lib_variableRate,
    
) => {
    const LMRY_SCRIPT = "LMRY_VendorCredit_CO_CLNT_HNDL.js";

    // Global variables


    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    const pageInit = (scriptContext) => {
        try {
            const { FeatureManager } = Lib_Licenses;
            const { currentRecord , mode } = scriptContext;
            const subsidiary = currentRecord.getValue("subsidiary");
            const FEAT_SUBS = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });

            if(FEAT_SUBS && !subsidiary) return ;

            const featureManager = new FeatureManager(subsidiary);
            const isVariableRate = Lib_variableRate.getFeatureVariableRate(subsidiary);
            if (
                featureManager.isActive(CO_FEAT.LOCALIZATION) && 
                featureManager.isActive(CO_FEAT.WHT_NEW_LINES_PURCHASE) &&
                isVariableRate
            ) {
                if (["edit", "copy", "create"].indexOf(mode) != -1) {
                    Lib_variableRate.loadDataVariableRate(currentRecord)
                    Lib_variableRate.executePopup(currentRecord);
                }
            }
        } catch (err) {
            Lib_Error.handleError({ title: "[pageInit - CO]", err });
        }
    };

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    const fieldChanged = (scriptContext) => {
        try {
            
        } catch (err) {
            Lib_Error.handleError({ title: "[fieldChanged - CO]", err });
        }
    };

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    //const postSourcing = (scriptContext) => {};

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    // const sublistChanged = (scriptContext) => {}

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    // const lineInit = (scriptContext) => {}

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    const validateField = (scriptContext) => {
        try {
            
            return true;
        } catch (err) {
            Lib_Error.handleError({ title: "[validateField - CO]", err });
        }
    };

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    // const validateLine = (scriptContext) => {}

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    // const validateInsert = (scriptContext) => {}

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    // const validateDelete = (scriptContext) => {}

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    const saveRecord = (scriptContext) => {
        try {
        
            return true;
        } catch (err) {
            Lib_Error.handleError({ title: "[saveRecord - CO]", err });
        }
    };

    const updateRetention = (type) => {
        Lib_variableRate.updateRetention(type);
    }

    return {
        pageInit,
        validateField,
        fieldChanged,
        saveRecord,
        updateRetention
    };
});
