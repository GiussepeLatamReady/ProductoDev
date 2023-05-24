/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_AdvanceFlow_STLT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 05/09/2023
 */
define([
    'N/log', 
    'N/xml',
    'N/config',
    'N/redirect',
    'N/task',
    'N/search',
    'N/ui/serverWidget',
    'N/runtime',
    './LMRY_AdvanceFlow_LBRY_V2.1.js',
    '../Send Email/LMRY_SendEmail_LBRY_V2.1.js'
], (nLog, xml, nConfig, nRedirect, nTask, nSearch, nServerWidget, nRuntime, AF_Library, SendEmail_LBRY) => {

    // Script information
    const LMRY_SCRIPT = "LR Advance Flow STLT V2.1";
    const LMRY_SCRIPT_NAME = "LMRY_AdvanceFlow_STLT_V2.1.js";

    let parameters = {};
    let features = {};
    let idCountries = {
        BR: 339
    }
    const onRequest = (context) => {

        try {

            getFeatures();


            const translatedFields = AF_Library.getFieldTranslations();
            if (context.request.method === 'GET') {


                const form = nServerWidget.createForm({
                    title: translatedFields.afTitle
                });

                //Se setean los parametros - Sujeto a cambio
                parameters.subsidiary = context.request.parameters.subsidiary;
                parameters.dateFrom = context.request.parameters.dateFrom;
                parameters.dateTo = context.request.parameters.dateTo;
                parameters.country = context.request.parameters.country;
                parameters.transaction = context.request.parameters.transaction;
                parameters.checkpaid = context.request.parameters.checkpaid;

                nLog.debug("features :",features);
                nLog.debug("Parameters :",parameters);

                nLog.error("Pmessage :","buildGroups...");
                buildGroups(form);
                nLog.error("Pmessage :","buildFields...");
                buildFields(form);
                nLog.error("Pmessage :","authentication...");
                authentication(form);
                nLog.error("Pmessage :","buildSubListFilter...");
                const countTransactions = buildSubListFilter(form,parameters);
                nLog.error("Pmessage :","LMRY_AdvanceFlow_CLNT_V2.1.js...");

                if (parameters.country) {
                    let numberOfTransactionField= form.getField({
                        id : 'custpage_lmry_ste_number_of_trans'
                    });
                    numberOfTransactionField.defaultValue = countTransactions;
                }
                

                
                nLog.error("Pmessage :","addSubmitButton..");
                if (!parameters.subsidiary || parameters.subsidiary === "" || parameters.subsidiary === null) {
                    form.addSubmitButton({label: translatedFields.afSave});
                } else {
                    form.addSubmitButton({label: translatedFields.afFilter});
                    form.addButton({
                        id: "custbutton_lmry_ste_back",
                        label: translatedFields.afBack,
                        functionName: "redirectBack()"
                    });
                }
                nLog.error("Pmessage :","End..");

                form.clientScriptModulePath = "./LMRY_AdvanceFlow_CLNT_V2.1.js"
                context.response.writePage({ pageObject: form });

            } else {
                let statusValue = context.request.parameters.custpage_lmry_ste_status;
                let subsidiaryValue = features.subsidiary ? context.request.parameters.custpage_lmry_ste_subsidiary : 1;
                let transactionValue = context.request.parameters.custpage_lmry_ste_transaction;
                let params = {};
                if (statusValue == null || statusValue == '') {
                    nRedirect.toSuitelet({
                        scriptId: nRuntime.getCurrentScript().id,
                        deploymentId: nRuntime.getCurrentScript().deploymentId,
                        parameters: {
                            subsidiary: scriptContext.request.parameters["custpage_lmry_ste_subsidiary"],
                            dateFrom: scriptContext.request.parameters["custpage_lmry_ste_date_from"],
                            dateTo: scriptContext.request.parameters["custpage_lmry_ste_date_to"],
                            country: scriptContext.request.parameters["custpage_lmry_ste_country"],
                            transaction: scriptContext.request.parameters["custpage_lmry_ste_transaction"],
                            checkpaid: scriptContext.request.parameters["custpage_lmry_ste_include_paid"],

                        }
                    });
                } else {
                    let user = nRuntime.getCurrentUser().id;
                    if (transactionValue == 'vendorbill' || transactionValue == 'vendorcredit') {
                        params.custscript_lmry_ip_params_state_purchase = statusValue;
                        params.custscript_lmry_ip_params_user_purchase = user;
                    } else if (transactionValue == 'itemfulfillment' || transactionValue == 'itemreceipt') {
                        params.custscript_lmry_ip_params_state_fillrcpt = statusValue;
                        params.custscript_lmry_ip_params_user_fillrcpt = user;
                    } else {
                        params.custscript_lmry_ip_params_state = statusValue;
                        params.custscript_lmry_ip_params_user = user;
                    }

                    let countryValue = context.request.parameters.custpage_lmry_ste_country;
                    countryValue = countryValue.substring(0, 3).toUpperCase();
                    countryValue = validateAccents(countryValue);

                    let setting = [nTask.TaskType.MAP_REDUCE, 'customscript_lmry_lmry_ste_af_sales_mprd', 'customscript_lmry_lmry_ste_af_purchase_mprd', 'customscript_lmry_ste_af_item_mprd'];

                    //BRA
                    let taskMPRD;

                    if (transactionValue == 'vendorbill' || transactionValue == 'vendorcredit') {

                        let deploySubsidiary = 'customdeploy_lmry_purchasing_pop_br_' + subsidiaryValue;
                        taskMPRD = nTask.create({
                            taskType: setting[0],
                            scriptId: setting[2],
                            deploymentId: deploySubsidiary,
                            params: params
                        });

                    } else if (transaction == 'itemfulfillment' || transaccion == 'itemreceipt') {

                        let deploySubsidiary = 'customdeploy_lmry_fillrcpt_pop_br_' + subsidiaryValue;
                        taskMPRD = nTask.create({
                            taskType: setting[0],
                            scriptId: setting[3],
                            deploymentId: deploySubsidiary,
                            params: params
                        });

                    }
                    // Ventas
                    else {

                        let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_br_' + subsidiaryValue;
                        taskMPRD = nTask.create({
                            taskType: setting[0],
                            scriptId: setting[1],
                            deploymentId: deploySubsidiary,
                            params: params
                        });

                    }

                    taskMPRD.submit();
                    nRedirect.toSuitelet({
                        scriptId: 'customscript_lmry_ste_advanceflow_stlt',
                        deploymentId: 'customdeploy_lmry_ste_advanceflow_stlt',
                        params: params
                    });


                }
            }
        } catch (error) {
            buildErrorForm(error,context);
        }
    }
    const getFeatures = () => {
        features.subsidiary = nRuntime.isFeatureInEffect({
            feature: 'SUBSIDIARIES'
        });
        features.advanced = true;
        features.WthBR = true;
    }

    const buildGroups = (form) => {

        const translatedFields = AF_Library.getFieldTranslations();
        form.addFieldGroup({ // Primary Information
            id: "custgroup_lmry_ste_primary_information",
            label: translatedFields.afGrpPrimary
        });

        form.addFieldGroup({ // Date Ranges
            id: "custgroup_lmry_ste_date_ranges",
            label: translatedFields.afGrpDateRanges
        });

        if (parameters.country) {
            form.addFieldGroup({ // Transaction Count
                id: "custgroup_lmry_ste_trans_count",
                label: translatedFields.afGrpTransactionCount
            });
        }


    }
    const buildFields = (form) => {

        /**  FIELD SUBISIDIARY **/
        const translatedFields = AF_Library.getFieldTranslations();
        if (features.subsidiary) {

            let subsidiaryField = form.addField({
                id: 'custpage_lmry_ste_subsidiary',
                type: nServerWidget.FieldType.SELECT,
                label: translatedFields.afSubSidiary,
                container: 'custgroup_lmry_ste_primary_information'
            });

            subsidiaryField.isMandatory = true;

            let searchSub = nSearch.create({
                type: 'subsidiary',
                columns: ['name', 'internalid'],
                filters: [{
                    name: 'isinactive',
                    operator: 'is',
                    values: 'F'
                }, {
                    name: 'country',
                    operator: 'anyof',
                    values: Object.keys(idCountries)
                }]
            });
            let resultSub = searchSub.run().getRange({
                start: 0,
                end: 1000
            });

            if (resultSub != null && resultSub.length > 0) {
                subsidiaryField.addSelectOption({
                    value: 0,
                    text: ' '
                });
                for (let i = 0; i < resultSub.length; i++) {
                    let idSubsidiary = resultSub[i].getValue('internalid');
                    let nameSubsidiary = resultSub[i].getValue('name');

                    subsidiaryField.addSelectOption({
                        value: idSubsidiary,
                        text: nameSubsidiary
                    });
                }
            }
        }

        /**  FIELD COUNTRY **/

        let countryField = form.addField({
            id: 'custpage_lmry_ste_country',
            type: nServerWidget.FieldType.TEXT,
            label: translatedFields.afCountry,
            container: 'custgroup_lmry_ste_primary_information'
        });

        countryField.updateDisplayType({
            displayType: nServerWidget.FieldDisplayType.DISABLED
        });
        countryField.updateDisplaySize({
            height: 60,
            width: 30
        });

        if (!features.subsidiary) {
            let countryConfig = nConfig.load({
                type: nConfig.Type.COMPANY_INFORMATION
            });
            countryConfig = countryConfig.getText({
                fieldId: 'country'
            });

            countryField.defaultValue = countryConfig;
        }


        /**  TYPE TRANSACTION **/

        let transactionField = form.addField({
            id: 'custpage_lmry_ste_transaction',
            type: nServerWidget.FieldType.SELECT,
            label: translatedFields.afTransaction,
            container: 'custgroup_lmry_ste_primary_information'
        });


        transactionField.isMandatory = true;

        /**  INCLUDE PAID INVOICES **/

        let includePaidInvoiceField = form.addField({
            id: 'custpage_lmry_ste_include_paid',
            type: nServerWidget.FieldType.CHECKBOX,
            label: translatedFields.afCheckPaid,
            container: 'custgroup_lmry_ste_primary_information'
        });

        includePaidInvoiceField.defaultValue = 'F';


        /**  DATE FROM **/

        let dateFromField = form.addField({
            id: 'custpage_lmry_ste_date_from',
            type: nServerWidget.FieldType.DATE,
            label: translatedFields.afDateFrom,
            container: 'custgroup_lmry_ste_date_ranges'
        });

        dateFromField.updateDisplaySize({
            height: 60,
            width: 30
        });

        dateFromField.isMandatory = true;


        /**  DATE TO **/

        let dateToField = form.addField({
            id: 'custpage_lmry_ste_date_to',
            type: nServerWidget.FieldType.DATE,
            label: translatedFields.afDateTo,
            container: 'custgroup_lmry_ste_date_ranges'
        });

        dateToField.updateDisplaySize({
            height: 60,
            width: 30
        });

        dateToField.isMandatory = true;


        if (parameters.country) {

            parameters.country = validateAccents(parameters.country.substring(0, 3).toUpperCase());

            /** STATUS **/

            let statusField = form.addField({
                id: 'custpage_lmry_ste_status',
                type: nServerWidget.FieldType.TEXT,
                label: translatedFields.afState,
                container: 'custgroup_lmry_ste_primary_information'
            });

            statusField.defaultValue = 'PENDIENTE';

            /** NUMBER OF TRANSACTIONS **/

            let numberOfTransactionField = form.addField({
                id: 'custpage_lmry_ste_number_of_trans',
                type: nServerWidget.FieldType.INTEGER,
                label: translatedFields.afNumberTransactions,
                container: 'custgroup_lmry_ste_trans_count'
            });

            numberOfTransactionField.updateDisplayType({
                displayType: nServerWidget.FieldDisplayType.DISABLED
            });

            numberOfTransactionField.updateDisplaySize({
                height: 60,
                width: 30
            });


            /** NUMBER OF SELECTED TRANSACTIONS **/

            let numberOfSelectTransField = form.addField({
                id: 'custpage_lmry_ste_number_select_trans',
                type: nServerWidget.FieldType.INTEGER,
                label: translatedFields.afNumberSelectedTransactions,
                container: 'custgroup_lmry_ste_trans_count'
            });

            numberOfSelectTransField.updateDisplayType({
                displayType: nServerWidget.FieldDisplayType.DISABLED
            });

            numberOfSelectTransField.updateDisplaySize({
                height: 60,
                width: 30
            });

            numberOfSelectTransField.defaultValue = 0;

            /** SELECT TRANSACTIONS **/

            let selectTransactionField = form.addField({
                id: 'custpage_lmry_ste_select_trans',
                type: nServerWidget.FieldType.SELECT,
                label: translatedFields.afSelectTransactions,
                container: 'custgroup_lmry_ste_trans_count'
            });

            selectTransactionField.addSelectOption({
                value: '',
                text: ' '
            });
            selectTransactionField.addSelectOption({
                value: 500,
                text: '500 ' + translatedFields.afTransactions
            });
            selectTransactionField.addSelectOption({
                value: 1000,
                text: '1000 ' + translatedFields.afTransactions
            });
            selectTransactionField.addSelectOption({
                value: 2000,
                text: '2000 ' + translatedFields.afTransactions
            });

            selectTransactionField.updateBreakType({
                breakType: nServerWidget.FieldBreakType.STARTCOL
            });

            /** TRANSACTIONS TO SELECT **/

            let transactionToSelectField = form.addField({
                id: 'custpage_lmry_ste_trans_to_select',
                type: nServerWidget.FieldType.INTEGER,
                label: translatedFields.afTransactionsToSelect,
                container: 'custgroup_lmry_ste_trans_count'
            });

            transactionToSelectField.updateDisplaySize({
                height: 60,
                width: 30
            });


            // Set values to the fields from the parameters

            if (features.subsidiary) {
                subsidiaryField.defaultValue = parameters.subsidiary;
                subsidiaryField.updateDisplayType({
                    displayType: nServerWidget.FieldDisplayType.DISABLED
                });
            }

            if (parameters.transaction != null && parameters.transaction != '' && parameters.transaction != '0') {
                transactionField.addSelectOption({
                    value: parameters.transaction[0],
                    text: parameters.transaction[1]
                });
            }

            transactionField.updateDisplayType({
                displayType: nServerWidget.FieldDisplayType.DISABLED
            });

            dateFromField.defaultValue = parameters.dateFrom;
            dateFromField.updateDisplayType({
                displayType: nServerWidget.FieldDisplayType.DISABLED
            });

            dateToField.defaultValue = parameters.dateTo;
            dateToField.updateDisplayType({
                displayType: nServerWidget.FieldDisplayType.DISABLED
            });

            includePaidInvoiceField.defaultValue = parameters.checkpaid;

            includePaidInvoiceField.updateDisplayType({
                displayType: nServerWidget.FieldDisplayType.DISABLED
            });

            statusField.updateDisplayType({
                displayType: nServerWidget.FieldDisplayType.DISABLED
            });

        }

    }

    const authentication = (form) => {
        const translatedFields = AF_Library.getFieldTranslations();
        if (nRuntime.envType == 'SANDBOX' || nRuntime.accountId.indexOf('TSTDRV') == 0) {
            let myInlineHtml = form.addField({
                id: 'custpage_lmry_ste_id_message',
                label: 'MESSAGE',
                type: nServerWidget.FieldType.INLINEHTML
            });
            myInlineHtml.layoutType = nServerWidget.FieldLayoutType.OUTSIDEBELOW;

            let strhtml = '<html>';
            strhtml += '<table border="0" class="table_fields" cellspacing="0" cellpadding="0">';
            strhtml += '<tr>';
            strhtml += '</tr>';
            strhtml += '<tr>';
            strhtml += '<td class="text">';
            strhtml += '<div style="color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver">';
            strhtml += translatedFields.afAuthentication + '</div>';
            strhtml += '</td>';
            strhtml += '</tr>';
            strhtml += '</table>';
            strhtml += '</html>';

            myInlineHtml.defaultValue = strhtml;
        }
    }


    const buildSubListFilter = (form,parameters) => {
        const translatedFields = AF_Library.getFieldTranslations();
        const resultList = form.addSublist({ id: "custlist_lmry_ste_filter", type: nServerWidget.SublistType.LIST, label: translatedFields.afTransactions });
        let countTransactions = 0;

        resultList.addField({ id: "listcol_lmry_ste_apply", label: translatedFields.afApply, type: nServerWidget.FieldType.CHECKBOX });
        resultList.addField({ id: "listcol_lmry_ste_id", label: translatedFields.afInternalId, type: nServerWidget.FieldType.TEXT });
        resultList.addField({ id: "listcol_lmry_ste_tranid", label: translatedFields.afTranId, type: nServerWidget.FieldType.TEXT });
        resultList.addField({ id: "listcol_lmry_ste_type", label: translatedFields.afTransactionType, type: nServerWidget.FieldType.TEXT });
        resultList.addField({ id: "listcol_lmry_ste_date", label: translatedFields.afDate, type: nServerWidget.FieldType.DATE });
        resultList.addField({ id: "listcol_lmry_ste_entity", label: translatedFields.afEntity, type: nServerWidget.FieldType.TEXT });
        resultList.addField({ id: "listcol_lmry_ste_doc_type", label: translatedFields.afDocumentType, type: nServerWidget.FieldType.TEXT });
        resultList.addField({ id: "listcol_lmry_ste_memo", label: translatedFields.afMemo, type: nServerWidget.FieldType.TEXT });
        resultList.addField({ id: "listcol_lmry_ste_amount", label: translatedFields.afAmount, type: nServerWidget.FieldType.TEXT });


        if (parameters.country) {
            let transactions = AF_Library.getSearchTransactions(features, parameters);


            transactions.forEach((transaction, index) => {


                resultList.setSublistValue({ id: 'listcol_lmry_ste_id', line: index, value: transaction.internalId });
                resultList.setSublistValue({ id: 'listcol_lmry_ste_tranid', line: index, value: transaction.tranid });
                resultList.setSublistValue({ id: 'listcol_lmry_ste_type', line: index, value: transaction.typeText });
                resultList.setSublistValue({ id: 'listcol_lmry_ste_date', line: index, value: transaction.trandate });
                resultList.setSublistValue({ id: 'listcol_lmry_ste_entity', line: index, value: transaction.entityText });
                resultList.setSublistValue({ id: 'listcol_lmry_ste_doc_type', line: index, value: transaction.documentTypeText });
                resultList.setSublistValue({ id: 'listcol_lmry_ste_memo', line: index, value: transaction.memo });
                resultList.setSublistValue({ id: 'listcol_lmry_ste_amount', line: index, value: transaction.fxamount });

            });
            countTransactions = transactions.length;

            resultList.addButton({
                id: 'custbutton_lmry_ste_mark_all',
                label: translatedFields.afMarkAll,
                functionName: 'markAll(' + countTransactions + ')'
            });
            resultList.addButton({
                id: 'custbutton_lmry_ste_des_mark',
                label: translatedFields.afDesMarkAll,
                functionName: 'desmarkAll'
            });
        }

        return countTransactions;
    }

    const validateAccents = (s) => {
        let AccChars = 'ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ&°–—ªº·';
        let RegChars = 'SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyyo--ao.';

        s = s.toString();
        for (let c = 0; c < s.length; c++) {
            for (let special = 0; special < AccChars.length; special++) {
                if (s.charAt(c) == AccChars.charAt(special)) {
                    s = s.substring(0, c) + RegChars.charAt(special) + s.substring(c + 1, s.length);
                }
            }
        }
        return s;
    }

    const buildErrorForm = (msgerr, context) => {
        const translatedFields = AF_Library.getFieldTranslations();

        let formError = nServerWidget.createForm({
            title: translatedFields.afTitle
        });
        let myInlineHtml = formError.addField({
            id: 'custpage_lmry_ste_id_message',
            label: 'MESSAGE',
            type: nServerWidget.FieldType.INLINEHTML
        });
        myInlineHtml.layoutType = nServerWidget.FieldLayoutType.OUTSIDEBELOW;
        myInlineHtml.updateBreakType({
            breakType: nServerWidget.FieldBreakType.STARTCOL
        });

        let strhtml = '<html>';
        strhtml += '<table border="0" class="table_fields" cellspacing="0" cellpadding="0">';
        strhtml += '<tr>';
        strhtml += '</tr>';
        strhtml += '<tr>';
        strhtml += '<td class="text">';
        strhtml += '<div style="color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver">';
        strhtml += translatedFields.afImportant + '<br><br>';
        strhtml += '<br>' + translatedFields.afCode + xml.escape(msgerr.name);
        strhtml += '<br>' + translatedFields.afDetails + xml.escape(msgerr.message);
        strhtml += '</div>';
        strhtml += '</td>';
        strhtml += '</tr>';
        strhtml += '</table>';
        strhtml += '</html>';

        // Mensaje HTML
        myInlineHtml.defaultValue = strhtml;

        // Dibuja el Formulario
        context.response.writePage(formError);
        nLog.error({
            title: 'Se genero un error en suitelet',
            details: msgerr
        });

        // Envio de mail al clientes
        SendEmail_LBRY.sendErrorEmail(`[ onRequest ] : ${msgerr}`, LMRY_SCRIPT);
    }


    return {onRequest}

});
