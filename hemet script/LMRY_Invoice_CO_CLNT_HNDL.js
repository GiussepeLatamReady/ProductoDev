/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_Invoice_CO_CLNT_HNDL.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 10/07/2024
 */
define([
    "N/runtime",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/error/LR_Error_LIB",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/licenses/LR_Licenses_LIB",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/features/LR_Features_CONST",
    "../../constants/LR_CO_FEATURES_CONST",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/hideAndView/LR_HideView_LIB",
]
    , (
        runtime,
        Lib_Error,
        Lib_Licenses,
        Features_CONST,
        CO_FEAT,
        Lib_HideView
    ) => {
        const LMRY_SCRIPT = "LMRY_Invoice_CO_CLNT_HNDL.js";

        // Global variables
        const { executionContext } = runtime;
        const { FeatureManager } = Lib_Licenses;
        const features = new Features_CONST.features();
        let type;


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
                const { currentRecord: CR, mode } = scriptContext;
                const { type: transType } = CR;
                type = mode;
                const subsidiary = CR.getValue("subsidiary");
                if (features.SUBSIDIARY && !subsidiary) return 0;
                const featureManager = new FeatureManager(subsidiary);
                if (featureManager.isActive(CO_FEAT.ADV_HIDE_VIEW)) {
                    const docTypeTemp = CR.getValue("custbody_lmry_document_type");
                    if (executionContext == "USERINTERFACE" && ["create", "edit", "copy"].includes(type)) {                        
                        Lib_HideView.hideFields(CR, "CO", transType, docTypeTemp, false, FeatureManager);
                        Lib_HideView.hideColumns(CR, "CO", transType, docTypeTemp, false, FeatureManager);
                        Lib_HideView.hideSubTab(CR, "CO", transType, docTypeTemp, false);
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
                const { currentRecord: CR, fieldId } = scriptContext;
                const { type: transType } = CR;
                const subsidiary = CR.getValue("subsidiary");
                if (features.SUBSIDIARY && !subsidiary) return 0;
                const featureManager = new FeatureManager(subsidiary);
                if (featureManager.isActive(CO_FEAT.ADV_HIDE_VIEW) && executionContext == "USERINTERFACE" && ["create", "edit", "copy"].includes(type)) {
                    if (fieldId == "custbody_lmry_document_type" ) {
                        const docTypeTemp = CR.getValue("custbody_lmry_document_type");
                        Lib_HideView.hideFields(CR, "CO", transType, docTypeTemp, false, FeatureManager);
                        Lib_HideView.hideColumns(CR, "CO", transType, docTypeTemp, false, FeatureManager);
                        Lib_HideView.hideSubTab(CR, "CO", transType, docTypeTemp, false);

                    }
                }
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
        const lineInit = (scriptContext) => {
            try {
                const { currentRecord: CR } = scriptContext;
                const { type: transType } = CR;
                const subsidiary = CR.getValue("subsidiary");
                if (features.SUBSIDIARY && !subsidiary) return 0;
                const featureManager = new FeatureManager(subsidiary);
                if (featureManager.isActive(CO_FEAT.ADV_HIDE_VIEW) && executionContext == "USERINTERFACE" && ["create", "edit", "copy"].includes(type)) {
                    const docTypeTemp = CR.getValue("custbody_lmry_document_type");
                    setTimeout(() => { Lib_HideView.hideColumns(CR, "CO", transType, docTypeTemp, false, FeatureManager) }, 1000);
                }
            } catch (err) {
                Lib_Error.handleError({ title: "[lineInit]", err });
            }
        }

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

        return {
            pageInit,
            validateField,
            fieldChanged,
            saveRecord,
            lineInit,
        };
    });
