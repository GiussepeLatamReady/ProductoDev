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

        
        let features = {};
        let jsonTransactionType;
        let isManipulatedLine = true;
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
                getFeatures();
                console.log("features:", features);
                console.log("CLNT runtime");
                let objRecord = scriptContext.currentRecord;
                let country = objRecord.getValue('custpage_lmry_ste_country');
                let checkpaidField = objRecord.getField('custpage_lmry_ste_include_paid');
                let checkpaidValue = objRecord.getValue('custpage_lmry_ste_include_paid');
                let hiddenValue = objRecord.getValue('custpage_lmry_ste_hidden');
                checkpaidField.isVisible = checkpaidValue;
                console.log("country:", country);
                console.log("country va1:", country == '');
                console.log("country va1:", !country);
                if (country == '' || !country) {
                    console.log("country:", "entre");
                    jsonTransactionType = getTransactionType();

                    if (!features.subsidiary) {

                        filterTransactionType(scriptContext);

                    }
                }
                console.log("country:", "pase");
                return true;
            } catch (error) {

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

        const fieldChanged = (scriptContext) =>{
            try {
                if (scriptContext.sublistId == 'custlist_lmry_ste_filter' && scriptContext.fieldId == 'listcol_lmry_ste_apply' && isManipulatedLine) {
                    let objRecord = scriptContext.currentRecord;

                    let selectedQuantity = objRecord.getValue('custpage_lmry_ste_number_select_trans');
                    let isSelected = objRecord.getCurrentSublistValue({
                        sublistId: 'custlist_lmry_ste_filter',
                        fieldId: 'listcol_lmry_ste_apply'
                    });

                    isSelected ? objRecord.setValue('custpage_lmry_ste_number_select_trans', selectedQuantity + 1) : objRecord.setValue('custpage_lmry_ste_number_select_trans', selectedQuantity - 1);
                }
            } catch (error) {
                
            }
        }
        const validateField = (scriptContext) => {
            try {
                if (scriptContext.fieldId == 'custpage_lmry_ste_subsidiary') {
                    setCountry(scriptContext);
                    filterTransactionType(scriptContext);
                }
    
                if (scriptContext.fieldId == 'custpage_lmry_ste_number_select_trans' || scriptContext.fieldId == 'custpage_lmry_ste_select_trans') {
                    quantityTransactions(scriptContext, scriptContext.fieldId);
                }
    
                if (scriptContext.fieldId == 'custpage_lmry_ste_transaction') {
                    showCheckPaidInvoices(scriptContext);
                }
            } catch (error) {
                //library.sendemail(' [validateField] ' + error, LMRY_script);
            }
            
            return true;

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

                jsonTransaction[countryTransaction]={
                    text: transactionTypeText,
                    value: transactionTypeValue
                };
                return true;
            });


            return jsonTransaction;

        }

        const transaformIds = (ids) => {

            let idsTransform = ids.split(",")
            const jsonIdsTypes = {
                16: 'creditmemo',
                17: 'invoice',
                32: 'itemreceipt',
                20: 'itemfulfillment',
                7: 'vendorbill',
                10: 'vendorcredit'
            }

            idsTransform = idsTransform.map(id => jsonIdsTypes[id] );
            
            return idsTransform.toString();
        }

        const filterTransactionType = (scriptContext) => {
            let objRecord = scriptContext.currentRecord;
            let checkpaidField = objRecord.getField('custpage_lmry_ste_include_paid');
            let checkpaidValue = objRecord.getValue('custpage_lmry_ste_include_paid');
            let countryValue = objRecord.getValue('custpage_lmry_ste_country');
            console.log("countryValue :",countryValue)
            let transactionTypeField = objRecord.getField('custpage_lmry_ste_transaction');

            checkpaidField.isVisible = false;
            objRecord.setValue({ fieldId: 'custpage_lmry_ste_include_paid', value: false });

            if (features.subsidiary) {
                let subsidiaryValue = objRecord.getValue({ fieldId: 'custpage_lmry_ste_subsidiary' });
                if (subsidiaryValue == null || subsidiaryValue == '' || subsidiaryValue == 0) {
                    return true;
                }
            }

            transactionTypeField.removeSelectOption({
                value: null
            });
            transactionTypeField.insertSelectOption({
                value: 0,
                text: ' '
            });

            if (countryValue != '' && !countryValue) {
                let transTypeIds = transaformIds(jsonTransactionType[countryValue].value).split(",");
                let transTypeNames = jsonTransactionType[countryValue].text.split(",");
                
                transTypeIds.forEach((id,index) => {
                    transaction.insertSelectOption({
                        value: id + ';' + transTypeNames[index],
                        text: transTypeNames[index]
                    });
                });
            }
        }

        const getFeatures = () =>{
            
            features.subsidiary = runtime.isFeatureInEffect({
                feature: 'SUBSIDIARIES'
            });
        }

        const setCountry = (scriptContext) =>{
            var objRecord = scriptContext.currentRecord;
            var subsidiary = objRecord.getValue({
                fieldId: 'custpage_lmry_ste_subsidiary'
            });

            var country = objRecord.getValue({
                fieldId: 'custpage_lmry_ste_country'
            });

            if (subsidiary == null || subsidiary == '' || subsidiary == 0) {
                objRecord.setValue({
                    fieldId: 'custpage_lmry_ste_country',
                    value: ' '
                });
                return false;
            }

            var country = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: subsidiary,
                columns: ['country']
            });
            country = country.country[0].text;

            objRecord.setValue({
                fieldId: 'custpage_lmry_ste_country',
                value: country
            });
        }

        const showCheckPaidInvoices = (scriptContext) => {
            var objRecord = scriptContext.currentRecord;
            var transactionTypeValue = objRecord.getValue({
                fieldId: 'custpage_lmry_ste_transaction'
            });
            transactionTypeValue = transactionTypeValue.split(';')[0];
            var checkpaidField = objRecord.getField('custpage_lmry_ste_include_paid');
            objRecord.setValue({
                fieldId: 'custpage_lmry_ste_include_paid',
                value: false
            });

            if (transactionTypeValue == 'invoice') {
                checkpaidField.isVisible = true;
            } else {
                checkpaidField.isVisible = false;
            }
        }

        const desmarkAll = () =>{
            try {
                isManipulatedLine = false;

                var objRecord = currentRecord.get();
                var quantity = objRecord.getLineCount({
                    sublistId: 'custlist_lmry_ste_filter'
                });

                for (var i = 0; i < quantity; i++) {
                    objRecord.selectLine({
                        sublistId: 'custlist_lmry_ste_filter',
                        line: i
                    });
                    var check = objRecord.setCurrentSublistValue({
                        sublistId: 'custlist_lmry_ste_filter',
                        fieldId: 'listcol_lmry_ste_apply',
                        value: false
                    });
                }

                objRecord.setValue('custpage_lmry_ste_number_select_trans', 0);

                isManipulatedLine = true;
            } catch (error) {
                //library.sendemail('[desmarkAll]' + error, LMRY_script);
            }
        }

        const markAll = (quantity) => {
            try {
                isManipulatedLine = false;

                var objRecord = currentRecord.get();
                var totalTransactions = objRecord.getLineCount({
                    sublistId: 'custlist_lmry_ste_filter'
                });

                for (var i = 0; i < quantity; i++) {
                    if (i < totalTransactions) {
                        objRecord.selectLine({
                            sublistId: 'custlist_lmry_ste_filter',
                            line: i
                        });
                        var check = objRecord.setCurrentSublistValue({
                            sublistId: 'custlist_lmry_ste_filter',
                            fieldId: 'listcol_lmry_ste_apply',
                            value: true
                        });
                    }
                }

                if (quantity > totalTransactions) {
                    objRecord.setValue('custpage_lmry_ste_number_select_trans', totalTransactions);
                    if (totalTransactions == 0) {
                        alert(jsonLanguage.notransactions[Language]);
                    } else {
                        alert(jsonLanguage.thereare[Language] + totalTransactions + jsonLanguage.transactions[Language]);
                    }
                } else {
                    objRecord.setValue('custpage_lmry_ste_number_select_trans', quantity);
                }

                isManipulatedLine = true;
            } catch (error) {
                //library.sendemail('[MarkAll]' + error, LMRY_script);
            }
        }

        const quantityTransactions = (scriptContext, option) => {
            var objRecord = scriptContext.currentRecord;
            var quantity = objRecord.getValue(option);

            if (parseInt(quantity) >= 1) {
                desmarkAll();
                markAll(quantity);

                objRecord.setValue({
                    fieldId: option,
                    value: ''
                });
            } else if (parseInt(quantity) == 0) {
                desmarkAll();
                objRecord.setValue({
                    fieldId: option,
                    value: ''
                });
            } else if (parseInt(quantity) < 0) {
                objRecord.setValue({
                    fieldId: option,
                    value: ''
                });
            }
        }

        return {
            pageInit,
            validateField,
            fieldChanged,
            saveRecord,
            markAll,
            desmarkAll
        };

    });
