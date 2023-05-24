/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @Name LMRY_AdvanceFlow_CLNT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 05/09/2023
 */

define(['N/runtime','N/search'],

    (runtime, search) =>{

        features = {};
        features.subsidiary = runtime.isFeatureInEffect({
            feature: 'SUBSIDIARIES'
        });
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

            console.log("features:",features);
            console.log("CLNT runtime");
            let objRecord = scriptContext.currentRecord;
            let checkpaidField = objRecord.getField('custpage_lmry_ste_include_paid');
            let checkpaidValue = objRecord.getValue('custpage_lmry_ste_include_paid');
            let hiddenValue = objRecord.getValue('custpage_lmry_ste_hidden');
            checkpaidField.isVisible = checkpaidValue;
            


            if (!features.subsidiary) {
                let jsonTransactionType = getTransactionType();
                let countryValue = objRecord.getValue('custpage_lmry_ste_country');
                let transactionTypeField = objRecord.getField('custpage_lmry_ste_transaction');

                checkpaidField.isVisible = false;
                objRecord.setValue({fieldId: 'custpage_lmry_ste_include_paid', value: false });

                transactionTypeField.removeSelectOption({
                    value: null
                });
                transactionTypeField.insertSelectOption({
                    value: 0,
                    text: ' '
                });

                if (countryValue != '' && !countryValue) {
                    
                }


            }



            return true;

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

        }


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

        }


        const getTransactionType = (scriptContext) => {
            
            let jsonTransaction = {};
            let searchTransaction = search.create({
                type: 'customrecord_lmry_af_trans_by_country',
                filters: [{
                    name: 'isinactive',
                    operator: 'is',
                    values: 'F'
                }],
                columns: [
                    'custrecord_lmry_ste_af_tbc_country',
                    'custrecord_lmry_ste_ad_tbc_transaction'
                ]

            });

            searchTransaction.run().each(function (result) {
                let columns = result.columns;
                let countryTransaction = result.getText(columns[0]);
                let transactionTypeText = result.getText(columns[1]);
                let transactionTypeValue = result.getValue(columns[1]);

                if (jsonTransaction[countryTransaction] == null || jsonTransaction[countryTransaction] == undefined) {
                    jsonTransaction[countryTransaction] = [];
                }

                jsonTransaction[countryTransaction].push({
                    text: transactionTypeText,
                    value: transactionTypeValue
                });
                return true;
            });


            return jsonTransaction;

        }

        return {
            pageInit,
            validateField,
            saveRecord
        };

    });
