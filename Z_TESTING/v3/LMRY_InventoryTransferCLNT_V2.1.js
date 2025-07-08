/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_Invoice_CO_CLNT_HNDL.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 10/07/2024
 */
define([
    "N/runtime"
], (runtime) => {

    // Global variables
    const { executionContext } = runtime;

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    const pageInit = (scriptContext) => {};
    const saveRecord = (scriptContext) => {
        try {

            return true;
        } catch (err) {
            alert("error [Saverecord]: "+err)
        }
    };

    return {
        pageInit,
        saveRecord
    };
});
