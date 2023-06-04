/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @Name LMRY_AdvanceFlow_CLNT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 05/09/2023
 */

define(['N/runtime',
    'N/search',
    'N/url',
    'N/currentRecord',
    'N/record',
    './LMRY_AdvanceFlow_LBRY_V2.1.js',
    '../Send Email/LMRY_SendEmail_LBRY_V2.1.js'
],

    (nRuntime, nSearch, nUrl, nCurrentRecord, nRecord, AF_Library, SendEmail_LBRY) => {


        let features = {};
        let jsonTransactionType;
        let isManipulatedLine = true;

        const LMRY_SCRIPT = "LR Advance Flow CLNT V2.1";
        const LMRY_SCRIPT_NAME = "LMRY_AdvanceFlow_CLNT_V2.1.js";
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
                let objRecord = scriptContext.currentRecord;
                let country = objRecord.getValue('custpage_lmry_ste_country');
                let checkpaidField = objRecord.getField('custpage_lmry_ste_include_paid');
                let checkpaidValue = objRecord.getValue('custpage_lmry_ste_include_paid');
                let hiddenValue = objRecord.getValue('custpage_lmry_ste_hidden');
                checkpaidField.isVisible = checkpaidValue;

                if (country == '' || !country) {

                    objRecord.setValue({
                        fieldId: 'custpage_lmry_ste_date_from',
                        value: new Date()
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_lmry_ste_date_to',
                        value: new Date()
                    });
                    jsonTransactionType = getTransactionType();
                    if (!features.subsidiary) {
                        filterTransactionType(scriptContext);
                    }
                }

                return true;
            } catch (error) {
                SendEmail_LBRY.sendErrorEmail(`[ pageInit ] : ${error}`, LMRY_SCRIPT);
            }


        }

        const fieldChanged = (scriptContext) => {
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
                SendEmail_LBRY.sendErrorEmail(`[ fieldChanged ] : ${error}`, LMRY_SCRIPT);
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
            getFeatures();
            try {
                console.log('Start')
                if (scriptContext.fieldId == 'custpage_lmry_ste_subsidiary') {
                    console.log('custpage_lmry_ste_subsidiary')
                    setCountry(scriptContext);
                    filterTransactionType(scriptContext);
                }

                if (scriptContext.fieldId == 'custpage_lmry_ste_trans_to_select' || scriptContext.fieldId == 'custpage_lmry_ste_select_trans') {
                    console.log('custpage_lmry_ste_trans_to_select')
                    quantityTransactions(scriptContext, scriptContext.fieldId);
                }

                if (scriptContext.fieldId == 'custpage_lmry_ste_transaction') {
                    console.log('custpage_lmry_ste_transaction')
                    showCheckPaidInvoices(scriptContext);
                }
                console.log('End')
            } catch (error) {
                SendEmail_LBRY.sendErrorEmail(`[ validateField ] : ${error}`, LMRY_SCRIPT);
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
            try {
                getFeatures();
                const translatedFields = AF_Library.getFieldTranslations();
                let objRecord = scriptContext.currentRecord;
                let statusValue = objRecord.getValue({ fieldId: 'custpage_lmry_ste_status' });
                let subsidiaryValue = 1;
                if (features.subsidiary) {
                    subsidiaryValue = objRecord.getValue({ fieldId: 'custpage_lmry_ste_subsidiary' });
                }
                let dateFromValue = objRecord.getValue({ fieldId: 'custpage_lmry_ste_date_from' });
                let dateToValue = objRecord.getValue({ fieldId: 'custpage_lmry_ste_date_to' });
                let transactionTypeValue = objRecord.getValue({ fieldId: 'custpage_lmry_ste_transaction' });
                transactionTypeValue = transactionTypeValue.split(';')[0];

                if (statusValue == null || statusValue == '') {
                    if (features.subsidiary) {
                        if (subsidiaryValue == null || subsidiaryValue == '' || subsidiaryValue == 0) {
                            alert(translatedFields.afMsgSubsidiary);
                            return false;
                        }
                    }

                    if (dateFromValue == null || dateFromValue == '' || dateFromValue == 0) {
                        alert(translatedFields.afMsgDateFrom);
                        return false;
                    }

                    if (dateToValue == null || dateToValue == '' || dateToValue == 0) {
                        alert(translatedFields.afMsgDateTo);
                        return false;
                    }

                    if (transactionTypeValue == null || transactionTypeValue == '' || transactionTypeValue == 0) {
                        alert(translatedFields.afMsgTransaction);
                        return false;
                    }
                } else {

                    let JsonContry = {
                        BRA: {
                            ip: 'BR',
                            idCountry: 30
                        }
                    }; // G.G
                    let countryCode = objRecord.getValue({
                        fieldId: 'custpage_lmry_ste_country'
                    });

                    countryCode = countryCode.substring(0, 3).toUpperCase();

                    if (JsonContry[countryCode].ip = 'BR') {
                        if (transactionTypeValue == 'vendorbill' || transactionTypeValue == 'vendorcredit') {

                            let deployIdBySubsidiary = `customdeploy_lmry_ste_af_prchs_mprd_${subsidiaryValue}`;
                            if (checkExecutionByScript(deployIdBySubsidiary)) {
                                alert(translatedFields.afMsgDeploySubsidiary);
                                return false;
                            }

                        } else if (sv_transaction == 'itemfulfillment' || sv_transaction == 'itemreceipt') {

                            let deployIdBySubsidiary = `customdeploy_lmry_ste_af_item_mprd_${subsidiaryValue}`;
                            if (checkExecutionByScript(deployIdBySubsidiary)) {
                                alert(translatedFields.afMsgDeploySubsidiary);
                                return false;
                            }
                        }
                        // Ventas
                        else {
                            let deployIdBySubsidiary = `customdeploy_lmry_ste_af_sales_mprd_${subsidiaryValue}`;
                            if (checkExecutionByScript(deployIdBySubsidiary)) {
                                alert(translatedFields.afMsgDeploySubsidiary);
                                return false;
                            }
                        }
                    }

                    let numberNotSelected = 0;
                    let transactionList = [];
                    let quantity = objRecord.getLineCount({ sublistId: 'custlist_lmry_ste_filter' });


                    if (quantity > 0) {

                        for (let i = 0; i < quantity; i++) {
                            let isApply = objRecord.getSublistValue({ sublistId: 'custlist_lmry_ste_filter', fieldId: 'listcol_lmry_ste_apply', line: i });
                            let internalId = objRecord.getSublistValue({ sublistId: 'custpage_sublista', fieldId: 'listcol_lmry_ste_id', line: i });
                            if (isApply) {
                                transactionList.push(internalId);
                            } else {
                                numberNotSelected++;
                            }
                        }

                        transactionList.sort((a, b) => a - b);

                        let transactionsString = JSON.stringify(transactionList) ;

                        if (quantity == numberNotSelected) {
                            alert(translatedFields.afMsgSelect);
                        } else {
                            return false;
                        }

                        let transactionsRecord = nRecord.create({ type: 'customrecord_lmry_ste_advance_flow_log', isDynamic: true });

                        if (features.subsidiary) {
                            transactionsRecord.setValue({ fieldId: 'custrecord_lmry_ste_af_log_subsidiary', value: subsidiaryValue });
                        }

                        transactionsRecord.setValue({ fieldId: 'custrecord_lmry_ste_af_log_country', value: JsonContry[countryCode].idCountry });
                        transactionsRecord.setValue({ fieldId: 'custrecord_lmry_ste_af_log_datefrom', value: dateFromValue });
                        transactionsRecord.setValue({ fieldId: 'custrecord_lmry_ste_af_log_trans_ids', value: transactionsString });
                        transactionsRecord.setValue({ fieldId: 'custrecord_lmry_ste_af_log_dateto', value: dateToValue });
                        let statusId = transactionsRecord.save({ disableTriggers: true, ignoreMandatoryFields: true });

                        objRecord.setValue({ fieldId: 'custpage_lmry_ste_status', value: statusId });

                    } else {
                        alert(translatedFields.afMsgNothing);
                        return false;
                    }

                }
                return true; 
            } catch (error) {
                SendEmail_LBRY.sendErrorEmail(`[ saveRecord ] : ${error}`, LMRY_SCRIPT);
            }
            

        }


        const getTransactionType = (scriptContext) => {

            let jsonTransaction = {};
            let searchTransaction = nSearch.create({
                type: 'customrecord_lmry_ste_af_trans_country',
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

                jsonTransaction[countryTransaction] = {
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

            idsTransform = idsTransform.map(id => jsonIdsTypes[id]);

            return idsTransform.toString();
        }

        const filterTransactionType = (scriptContext) => {
            let objRecord = scriptContext.currentRecord;
            let checkpaidField = objRecord.getField('custpage_lmry_ste_include_paid');
            let countryValue = objRecord.getValue('custpage_lmry_ste_country');
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
          
            if (countryValue != '' && countryValue) {
                let transTypeIds = transaformIds(jsonTransactionType[countryValue].value).split(",");
                let transTypeNames = jsonTransactionType[countryValue].text.split(",");

                transTypeIds.forEach((id, index) => {
                    transactionTypeField.insertSelectOption({
                        value: id + ';' + transTypeNames[index],
                        text: transTypeNames[index]
                    });
                });
            }
        }

        const getFeatures = () => {

            features.subsidiary = nRuntime.isFeatureInEffect({
                feature: 'SUBSIDIARIES'
            });
        }

        const setCountry = (scriptContext) => {
            let objRecord = scriptContext.currentRecord;
            let subsidiary = objRecord.getValue({
                fieldId: 'custpage_lmry_ste_subsidiary'
            });

            if (subsidiary == null || subsidiary == '' || subsidiary == 0) {
                objRecord.setValue({
                    fieldId: 'custpage_lmry_ste_country',
                    value: ' '
                });
                return false;
            }

            let countrySubsiadiary = nSearch.lookupFields({
                type: nSearch.Type.SUBSIDIARY,
                id: subsidiary,
                columns: ['country']
            });
            let country = countrySubsiadiary.country[0].text;

            objRecord.setValue({
                fieldId: 'custpage_lmry_ste_country',
                value: country
            });
        }

        const showCheckPaidInvoices = (scriptContext) => {
            let objRecord = scriptContext.currentRecord;
            let transactionTypeValue = objRecord.getValue({
                fieldId: 'custpage_lmry_ste_transaction'
            });
            transactionTypeValue = transactionTypeValue.split(';')[0];
            let checkpaidField = objRecord.getField('custpage_lmry_ste_include_paid');
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

        const desmarkAll = () => {
            try {
                isManipulatedLine = false;

                let objRecord = nCurrentRecord.get();
                let quantity = objRecord.getLineCount({
                    sublistId: 'custlist_lmry_ste_filter'
                });

                for (let i = 0; i < quantity; i++) {
                    objRecord.selectLine({
                        sublistId: 'custlist_lmry_ste_filter',
                        line: i
                    });
                    let check = objRecord.setCurrentSublistValue({
                        sublistId: 'custlist_lmry_ste_filter',
                        fieldId: 'listcol_lmry_ste_apply',
                        value: false
                    });
                }

                objRecord.setValue('custpage_lmry_ste_number_select_trans', 0);

                isManipulatedLine = true;
            } catch (error) {
                SendEmail_LBRY.sendErrorEmail(`[ desmarkAll ] : ${error}`, LMRY_SCRIPT);
            }
        }

        const markAll = (quantity) => {
            try {
                const translatedFields = AF_Library.getFieldTranslations();
                isManipulatedLine = false;

                let objRecord = nCurrentRecord.get();
                let totalTransactions = objRecord.getLineCount({
                    sublistId: 'custlist_lmry_ste_filter'
                });

                for (let i = 0; i < quantity; i++) {
                    if (i < totalTransactions) {
                        objRecord.selectLine({
                            sublistId: 'custlist_lmry_ste_filter',
                            line: i
                        });
                        let check = objRecord.setCurrentSublistValue({
                            sublistId: 'custlist_lmry_ste_filter',
                            fieldId: 'listcol_lmry_ste_apply',
                            value: true
                        });
                    }
                }

                if (quantity > totalTransactions) {
                    objRecord.setValue('custpage_lmry_ste_number_select_trans', totalTransactions);
                    if (totalTransactions == 0) {
                        alert(translatedFields.afMsgNoTransactions);
                    } else {
                        alert(translatedFields.afMsgThereAre + " " + totalTransactions + " " + translatedFields.afMsgTransactions);
                    }
                } else {
                    objRecord.setValue('custpage_lmry_ste_number_select_trans', quantity);
                }

                isManipulatedLine = true;
            } catch (error) {
                SendEmail_LBRY.sendErrorEmail(`[ markAll ] : ${error}`, LMRY_SCRIPT);
            }
        }

        const quantityTransactions = (scriptContext, option) => {
            let objRecord = scriptContext.currentRecord;
            let quantity = objRecord.getValue(option);

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
       
        const checkExecutionByScript = (deployId) => {

            const mapReduceStatus = nSearch.create({
                type: "scheduledscriptinstance",
                columns: [
                    "mapreducestage",
                    "status",
                    "taskid"
                ],
                filters: [
                    ["scriptdeployment.scriptid", "anyof", deployId],
                    "AND",
                    ["status", "anyof", "PENDING", "PROCESSING"]
                ]
            }).run().getRange({ start: 0, end: 10 });

            return mapReduceStatus && mapReduceStatus.length > 0;
        }

        const redirectBack = (paramIsDetails) => {

            try {
    
                let scriptUrl = "";
                if (paramIsDetails === true || paramIsDetails === "T") {
                    scriptUrl = nUrl.resolveScript({
                        scriptId: "customscript_lmry_ste_advflow_log_stlt",
                        deploymentId: "customdeploy_lmry_ste_advflow_log_stlt",
                    });
                } else {
                    scriptUrl = nUrl.resolveScript({
                        scriptId: "customscript_lmry_ste_advanceflow_stlt",
                        deploymentId: "customdeploy_lmry_ste_advanceflow_stlt",
                    });
                }
    
                setWindowChanged(window, false);
                window.location.href = scriptUrl;
    
            } catch (error) {
                nLog.error({ title: `[ ${LMRY_SCRIPT} : redirectBack ]`, details: error });
                SendEmail_LBRY.sendErrorEmail(`[ redirectBack ] : ${error}`, LMRY_SCRIPT);
            }
    
        }

        return {
            pageInit,
            validateField,
            fieldChanged,
            saveRecord,
            markAll,
            desmarkAll,
            redirectBack
        };

    });
