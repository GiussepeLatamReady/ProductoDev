/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_CO_Header_WHT_calculation_STLT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */
define([
        'N/log',
        'N/search', 
        'N/redirect', 
        'N/runtime',
        'N/ui/serverWidget',
        'N/url',
        'N/task',
        'SuiteBundles/Bundle 37714/Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'
    ],
    (log, search,redirect, runtime, serverWidget, url, task, LibraryMail) => {
        const CLIENT_SCRIPT_PATH = "./LMRY_CO_Header_WHT_calculation_CLNT_V2.1.js";

        const onRequest = (context) => {
            const scriptContext = {
                scriptId: runtime.getCurrentScript().id,
                deploymentId: runtime.getCurrentScript().deploymentId,
                params: context.request.parameters,
                method: context.request.method,
                response: context.response
            };

            const handler = new SuiteletFormManager({
                params: scriptContext.params,
                method: scriptContext.method
            });

            scriptContext.method === "GET" ? processGETRequest(handler, scriptContext) : processPOSTRequest(handler, scriptContext);
        };

        const processGETRequest = (handler, { params, response }) => {
            try {
                const status = Number(params.status);
                const form = handler.createForm();

                status ? handler.setFormValues() : handler.loadFormValues();
                handler.createTransactionSublist();
                if (status) handler.loadTransactionSublist();

                form.clientScriptModulePath = CLIENT_SCRIPT_PATH;
                response.writePage(form);
            } catch (err) {
                log.error("[ onRequest - GET ]", err);
            }
        };

        const processPOSTRequest = (handler, { params, scriptId, deploymentId }) => {
            try {
                const status = Number(params.custpage_status);
                if (!status) {
                    redirect.toSuitelet({
                        scriptId,
                        deploymentId,
                        parameters: handler.getRedirectParams()
                    });
                } else {
                    const parameters = {
                        state: params.custpage_log_id,
                        user: runtime.getCurrentUser().id
                    };

                    handler.runMapReduce(parameters);
                    handler.toLogSuitelet();
                }
            } catch (err) {
                log.error("[ onRequest - POST ]", err);
            }
        };

        class SuiteletFormManager {
            constructor(options) {
                this.params = options.params || {};
                this.method = options.method;
                this.FEAT_SUBS = this.isValid(runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' }));
                this.translations = this.getTranslations(language);
                this.subsidiaries = [];
                this.deploy = runtime.getCurrentScript().deploymentId;
                this.names = this.getNames(this.deploy);
                log.debug('this.names', this.names);
            }

            getNames(deploy) {
                let nameList = {
                    customdeploy_lmry_co_head_wht_calc_stlt: {
                        scriptid: 'customscript_lmry_co_head_wht_calc_stlt_log',
                        deployid: 'customdeploy_lmry_co_head_wht_calc_stlt_log',
                        scriptMapReduce: 'customscript_lmry_co_head_wht_calc_mprd',
                        deployMapReduce: 'customdeploy_lmry_co_head_wht_calc_mprd',
                        paramuser: 'custscript_lmry_co_head_wht_calc_user',
                        paramstate: 'custscript_lmry_co_head_wht_calc_state'
                    }
                };
                return nameList[deploy];
            }

            createForm() {

                this.form = serverWidget.createForm({
                    title: 'LatamReady - CO Header WHT calculation'
                });

                if (!this.areThereSubsidiaries()) {
                    this.addNoSubsidiaryMessage();
                    return this.form;
                }

                this.setupFormWithSubsidiaries();
                this.addFormButtons();

                return this.form;
            }

            addNoSubsidiaryMessage() {
                let myInlineHtml = this.form.addField({
                    id: 'custpage_lmry_v_message',
                    label: this.translations.LMRY_MESSAGE,
                    type: serverWidget.FieldType.INLINEHTML
                }).updateLayoutType({
                    layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
                }).updateBreakType({
                    breakType: serverWidget.FieldBreakType.STARTCOL
                });

                const messageHtml = `<html>
                <table border="0" class="table_fields" cellspacing="0" cellpadding="0">
                    <tr></tr>
                    <tr>
                        <td class="text">
                            <div style="color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver">
                                ${this.translations.LMRY_MESSAGE_LICENSE}. </br>
                                ${this.translations.LMRY_MESSAGE_CONTACT} www.Latamready.com
                            </div>
                        </td>
                    </tr>
                </table>
            </html>`;
                myInlineHtml.defaultValue = messageHtml;
            }

            setupFormWithSubsidiaries() {
                this.addGroup('mainGroup', this.translations.LMRY_PRIMARY_INFO);
                if (this.FEAT_SUBS == 'T' || this.FEAT_SUBS == true) {
                    this.addSelectField('custpage_subsidiary', this.translations.LMRY_SUBSIDIARY, 'mainGroup').isMandatory();
                }
                this.addSelectField('custpage_wth_process', this.translations.LMRY_TYPE_PROCESS, 'mainGroup').isMandatory();
                this.addSelectField('custpage_wth_type', this.translations.LMRY_WTH_TYPE, 'mainGroup').isMandatory();

                this.addGroup('dateRangeGroup', this.translations.LMRY_PERIOD_INTERVAL);
                this.addSelectField('custpage_period_type', this.translations.LMRY_PERIOD, 'dateRangeGroup').isMandatory();
                this.addDateField('custpage_start_date', this.translations.LMRY_START_DATE, 'dateRangeGroup');
                this.addDateField('custpage_end_date', this.translations.LMRY_END_DATE, 'dateRangeGroup');
                this.addSelectField('custpage_period', this.translations.LMRY_PERIOD, 'dateRangeGroup');


                this.addHiddenField('custpage_status', 'Status');
                this.addHiddenField('custpage_log_id', 'Log ID');
                this.addHiddenField('custpage_deploy_id', 'Deploy ID', runtime.getCurrentScript().deploymentId);
            }

            addGroup(groupId, label) {
                this.form.addFieldGroup({
                    id: groupId,
                    label: label
                });
            }

            addCustomField(id, type, label, container) {
                let field = this.form.addField({
                    id: id,
                    type: type,
                    label: label,
                    container: container
                });
                field.isMandatory = true;
                return {
                    field: field,
                    isMandatory: function () {
                        this.field.isMandatory = true;
                        return this;
                    }
                };
            }


            addDateField(id, label, container) {
                return this.addCustomField(id, serverWidget.FieldType.DATE, label, container).setHelpText({ help: id });
            }
            addSelectField(id, label, container) {
                return this.addCustomField(id, serverWidget.FieldType.SELECT, label, container).setHelpText({ help: id });
            }

            addHiddenField(id, label, defaultValue = '') {
                let field = this.form.addField({
                    id: id,
                    type: serverWidget.FieldType.TEXT,
                    label: label
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                if (defaultValue) field.defaultValue = defaultValue;
            }

            addFormButtons() {
                if (!Number(this.params.status)) {
                    this.form.addSubmitButton({ label: this.translations.LMRY_FILTER });
                } else {
                    this.form.addSubmitButton({ label: this.translations.LMRY_PROCESS });
                    this.form.addButton({
                        id: 'btn_back',
                        label: this.translations.LMRY_BACK,
                        functionName: 'back'
                    });
                    // Deshabilitar campos si es necesario

                    this.disableFields();
                }
                this.form.addResetButton({ label: this.translations.LMRY_RESTART });
            }


            disableFields() {
                const fieldsToDisable = ['custpage_subsidiary', 'custpage_start_date', 'custpage_end_date', 'custpage_period', 'custpage_wth_type', 'custpage_period_type'];
                fieldsToDisable.forEach(fieldId => {
                    let field = this.form.getField({ id: fieldId });
                    if (field) {
                        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    }
                });
            }


            areThereSubsidiaries() {
                let subsidiaries = [];
                let allLicenses = {};  // Inicializar para el caso de que FEAT_SUBS no esté activo
                if (this.FEAT_SUBS) {
                    allLicenses = LibraryMail.getAllLicenses();
                    subsidiaries = this.getSubsidiaries();
                } else {
                    subsidiaries.push({ value: 1, text: 'Company', active: false });
                }

                for (let i = 0; i < subsidiaries.length; i++) {

                    let licenses = this.FEAT_SUBS ? allLicenses[subsidiaries[i].value] : LibraryMail.getLicenses(subsidiaries[i].value);
                    if (LibraryMail.getAuthorization(26, licenses)) {
                        subsidiaries[i].active = true;
                        this.subsidiaries = subsidiaries;
                        return true;
                    }
                }

                this.subsidiaries = subsidiaries;
                return false;
            }


            getSubsidiaries() {

                let searchSubs = search.create({
                    type: search.Type.SUBSIDIARY,
                    filters: [['isinactive', 'is', 'F'], 'AND', ['country', 'is', 'CO']],
                    columns: ['internalid', 'name']
                });

                return searchSubs.run().getRange(0, 1000).map(result => ({
                    value: result.getValue('internalid'),
                    text: result.getValue('name'),
                    active: false
                }));
            }

            createTransactionSublist() {
                this.form.addTab({
                    id: 'transactions_tab',
                    label: this.translations.LMRY_TRANSACTIONS
                });

                this.sublist = this.form.addSublist({
                    id: 'custpage_results_list',
                    label: this.translations.LMRY_RESULTS,
                    tab: 'transactions_tab',
                    type: serverWidget.SublistType.LIST
                });


                const fields = [
                    { id: 'apply', label: this.translations.LMRY_APPLY, type: serverWidget.FieldType.CHECKBOX },
                    { id: 'tranid', label: this.translations.LMRY_DOCUMENT_NUMBER, type: serverWidget.FieldType.TEXT },
                    { id: 'internalid', label: this.translations.LMRY_INTERNALID, type: serverWidget.FieldType.TEXT },
                    { id: 'type_transaction', label: this.translations.LMRY_TRANSACTION_TYPE, type: serverWidget.FieldType.TEXT },
                    { id: 'legal_document_type', label: this.translations.LMRY_FISCAL_DOCUMENT, type: serverWidget.FieldType.TEXT },
                    { id: 'total_amt', label: this.translations.LMRY_AMOUNT, type: serverWidget.FieldType.CURRENCY, displayType: serverWidget.FieldDisplayType.DISABLED },
                    { id: 'internalidtext', label: 'internal_id', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.HIDDEN }
                ];


                fields.forEach(fieldInfo => {
                    let field = this.sublist.addField(fieldInfo);
                    if (fieldInfo.displayType) {
                        field.updateDisplayType({ displayType: fieldInfo.displayType });
                    }
                });


                this.sublist.addButton({
                    id: 'btn_mark_all',
                    label: this.translations.LMRY_SELECT_ALL,
                    functionName: 'toggleCheckBoxes(true)'
                });
                this.sublist.addButton({
                    id: 'btn_desmark_all',
                    label: this.translations.LMRY_DESELECT_ALL,
                    functionName: 'toggleCheckBoxes(false)'
                });

                return this.sublist;
            }

            loadFormValues() {
                if (this.FEAT_SUBS) {
                    this.fillSubsidiaries();
                }
                this.fillWhtType();
                this.fillPeriodType();
            }

            fillSubsidiaries() {
                let subsidiaryField = this.form.getField({ id: 'custpage_subsidiary' });
                if (subsidiaryField) {
                    subsidiaryField.addSelectOption({ value: 0, text: '&nbsp;' });
                    this.subsidiaries?.filter(sub => sub.active).forEach(activeSub => {
                        subsidiaryField.addSelectOption({ value: activeSub.value, text: activeSub.text });
                    });
                }
            }

            fillWhtType() {
                let whtTypeField = this.form.getField({ id: 'custpage_wth_type' });
                whtTypeField.addSelectOption({ value: 0, text: '&nbsp;' });
                whtTypeField.addSelectOption({ value: "header", text: this.translations.LMRY_WHT_HEADER });
                whtTypeField.addSelectOption({ value: "line", text: this.translations.LMRY_WHT_LINE });
            }
            fillPeriodType() {
                let periodTypeField = this.form.getField({ id: 'custpage_period_type' });
                periodTypeField.addSelectOption({ value: 0, text: '&nbsp;' });
                periodTypeField.addSelectOption({ value: "range", text: this.translations.LMRY_DATE_RANGE });
                periodTypeField.addSelectOption({ value: "month", text: this.translations.LMRY_PERIOD });
            }
            fillProcess() {
                let typeProcessField = this.form.getField({ id: 'custpage_wth_process' });
                typeProcessField.addSelectOption({ value: 0, text: '&nbsp;' });
                typeProcessField.addSelectOption({ value: "sales", text: this.translations.LMRY_SALES });
                typeProcessField.addSelectOption({ value: "purchases", text: this.translations.LMRY_PURCHASES });
            }


            setFormValues() {
                let {
                    subsidiary,
                    startDate,
                    endDate,
                    whtType,
                    accoutingPeriod,
                    typePeriod,
                    typeProcess
                } = this.params;
                let form = this.form;

                if (this.FEAT_SUBS == true || this.FEAT_SUBS == 'T') {
                    if (Number(subsidiary)) {
                        let subsidiaryField = form.getField({ id: 'custpage_subsidiary' });
                        let name = search.lookupFields({
                            type: 'subsidiary',
                            id: subsidiary,
                            columns: ['name']
                        }).name;
                        subsidiaryField.addSelectOption({ value: subsidiary, text: name });
                        subsidiaryField.defaultValue = subsidiary;
                    }

                }

                this.fillWhtType();
                this.fillPeriodType();
                this.fillProcess();
                form.updateDefaultValues({
                    custpage_start_date: startDate || '',
                    custpage_end_date: endDate || '',
                    custpage_status: '1',
                    custpage_wth_type: whtType || '',
                    custpage_period: accoutingPeriod || '',
                    custpage_period_type: typePeriod || '',
                    custpage_wth_process: typeProcess || ''
                });
            }

            loadTransactionSublist() {


                let data = this.getTransactionsMain();

                let sublist = this.form.getSublist({ id: 'custpage_results_list' });

                data.forEach((transaction, i) => {
                    let tranUrl = url.resolveRecord({ recordType: transaction.typeID, recordId: transaction.id, isEditMode: false });
                    let urlID = `<a class="dottedlink" href=${tranUrl} target="_blank">${transaction.id}</a>`;
                    let tranid = `<a class="dottedlink" href=${tranUrl} target="_blank">${transaction.tranid}</a>`;


                    sublist.setSublistValue({ id: 'apply', line: i, value: 'F' });
                    sublist.setSublistValue({ id: 'internalidtext', line: i, value: transaction.id });
                    sublist.setSublistValue({ id: 'tranid', line: i, value: tranid });
                    sublist.setSublistValue({ id: 'type_transaction', line: i, value: transaction.typeName });
                    sublist.setSublistValue({ id: 'legal_document_type', line: i, value: transaction.legalDocumentType });

                    sublist.setSublistValue({ id: 'internalid', line: i, value: urlID });
                    sublist.setSublistValue({ id: 'total_amt', line: i, value: transaction.amount });
                })

                if (data.length) {
                    sublist.label = `${sublist.label} (${data.length})`;
                }


            }

            getTransactions() {
                let dataIds = [];
                let {
                    subsidiary,
                    startDate,
                    endDate,
                    whtType,
                    accoutingPeriod,
                    typeProcess
                } = this.params;

                let filters = [
                    ["mainline", "is", "T"],
                    "AND",
                    ["formulatext: {custbody_lmry_reference_transaction}", "isnotempty", ""]

                ];


                if (typeProcess == "sales") {
                    filters.push('AND');
                    filters.push(
                        [
                            ["type", "anyof", "CustCred", "CustInvc"]
                        ]
                    );
                    filters.push('OR');
                    filters.push(
                        [
                            [
                                ["type", "anyof", "Journal"],
                                "AND",
                                ["formulatext: CASE WHEN  {custbody_lmry_reference_transaction.recordType} = 'invoice'  OR {custbody_lmry_reference_transaction.recordType} = 'creditmemo' THEN 1 ELSE 0 END", "is", "1"]
                            ]
                        ]
                    );
                } else {
                    filters.push('AND');
                    filters.push(
                        [
                            ["type", "anyof", "VendBill", "VendCred"]
                        ]
                    );
                    filters.push('OR');
                    filters.push(
                        [
                            [
                                ["type", "anyof", "Journal"],
                                "AND",
                                ["formulatext: CASE WHEN  {custbody_lmry_reference_transaction.recordType} = 'vendorbill'  OR {custbody_lmry_reference_transaction.recordType} = 'vendorcredit' THEN 1 ELSE 0 END", "is", "1"]
                            ]
                        ]
                    );
                }

                if (whtType == "header") {
                    filters.push('AND');
                    filters.push(
                        [
                            ["formulatext: {memomain}", "startswith", "Latam - WHT"]
                        ]
                    );


                } else {
                    filters.push('AND');
                    filters.push(
                        [
                            ["formulatext: {memomain}", "startswith", "Latam - CO WHT (Lines)"]
                        ]
                    );
                }




                if (startDate != null && startDate != '' && endDate != null && endDate != '') {
                    filters.push('AND');
                    const periodFourmulaids = this.getPeriods(subsidiary, startDate, endDate);
                    filters.push(search.createFilter({
                        name: "formulatext",
                        formula: periodFourmulaids,
                        operator: search.Operator.IS,
                        values: "1"
                    }));
                }

                if (accoutingPeriod != null && accoutingPeriod != '') {
                    filters.push('AND');
                    const periodFourmulaids = this.generatePeriodFormula([accoutingPeriod]);
                    filters.push(search.createFilter({
                        name: "formulatext",
                        formula: periodFourmulaids,
                        operator: search.Operator.IS,
                        values: "1"
                    }));
                }



                let settings = [];

                if (this.FEAT_SUBS) {
                    filters.push('AND', ['subsidiary', 'anyof', subsidiary]);
                    settings = [search.createSetting({ name: 'consolidationtype', value: 'NONE' })];
                }

                let columns = [];
                columns.push(search.createColumn({ name: 'formulatext', formula: '{custbody_lmry_reference_transaction.internalid}', sort: search.Sort.DESC }));



                let searchTransactionsWht = search.create({
                    type: "transaction",
                    filters: filters,
                    columns: columns,
                    settings: settings
                });
                let jsonData = {};
                let pageData = searchTransactionsWht.runPaged({ pageSize: 1000 });
                if (pageData) {
                    pageData.pageRanges.forEach(function (pageRange) {
                        let page = pageData.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            const columns = result.columns;
                            let transaction = {};
                            transaction.id = result.getValue(columns[0]);
                            jsonData[transaction.id] = transaction.id;

                        });
                    });
                }


                const transactionValues = Object.values(jsonData);
                dataIds.push(...transactionValues);

                return this.getTransactionsMain(dataIds, whtType);
            }

            getTransactionsMain(ids, whtType) {
                let data = [];
                let filters = [
                    ["mainline", "is", "T"],
                    "AND",
                    ["internalid", "anyof", ids]

                ];

                if (whtType == "header") {
                    filters.push('AND');
                    filters.push(["custrecord_lmry_br_transaction.internalid", "anyof", "@NONE@"]);
                }

                let columns = [];
                columns.push(search.createColumn({ name: 'formulatext', formula: '{internalid}', sort: search.Sort.DESC }));
                columns.push(search.createColumn({ name: 'formulatext', formula: '{type}' }));
                columns.push(search.createColumn({ name: 'formulatext', formula: '{recordType}' }));
                columns.push(search.createColumn({ name: 'formulatext', formula: '{custbody_lmry_document_type}' }));
                columns.push(search.createColumn({ name: 'formulatext', formula: '{tranid}' }));
                columns.push(search.createColumn({ name: 'formulatext', formula: '{amount}' }));


                let settings = [];
                if (this.FEAT_SUBS) {
                    settings = [search.createSetting({ name: 'consolidationtype', value: 'NONE' })];
                }
                let searchTransactions = search.create({
                    type: "transaction",
                    filters: filters,
                    columns: columns,
                    settings: settings
                });


                let pageData = searchTransactions.runPaged({ pageSize: 1000 });
                if (pageData) {
                    pageData.pageRanges.forEach(function (pageRange) {
                        let page = pageData.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            const columns = result.columns;
                            let transaction = {};
                            transaction.id = result.getValue(columns[0]);
                            transaction.typeName = result.getValue(columns[1]);
                            transaction.typeID = result.getValue(columns[2]);
                            transaction.legalDocumentType = result.getValue(columns[3]);
                            transaction.tranid = result.getValue(columns[4]);
                            transaction.amount = Number(result.getValue(columns[5]));

                            data.push(transaction);

                        });
                    });
                }

                log.error("data [getTransactions]", data);
                return data;
            }


            getPeriods(subsidiaryValue, startDate, endDate) {

                let periodIds = new Array();

                let searchFilters = new Array();
                searchFilters.push({ name: 'isyear', operator: 'is', values: false });
                searchFilters.push({ name: 'isquarter', operator: 'is', values: false });

                if (this.FEAT_SUBS) {

                    searchFilters.push({ name: 'fiscalCalendar', operator: 'is', values: this.getFiscalCalendar(subsidiaryValue) });
                }
                searchFilters.push({ name: 'startdate', operator: 'onorafter', values: startDate });
                searchFilters.push({ name: 'enddate', operator: 'onorbefore', values: endDate });

                let searchColumns = new Array();
                searchColumns.push({ name: 'internalid', sort: search.Sort.ASC, summary: 'GROUP' });

                search.create({
                    type: 'accountingperiod',
                    filters: searchFilters,
                    columns: searchColumns
                }).run().each(result => {
                    periodIds.push(result.getValue(result.columns[0]));
                    return true;
                });

                return this.generatePeriodFormula(periodIds);
            }
            generatePeriodFormula(idsPeriod) {
                const periodsString = idsPeriod.map(id => `'${id}'`).join(', ');
                return `CASE WHEN {custbody_lmry_reference_transaction.postingperiod.id} IN (${periodsString}) THEN 1 ELSE 0 END`;
            }

            getFiscalCalendar(subsidiaryValue) {
                let subsidiary = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: subsidiaryValue,
                    columns: ['fiscalCalendar']
                })
                return subsidiary.fiscalCalendar[0].value;
            }

            getRedirectParams() {
                let params = this.params;
                return {
                    subsidiary: params.custpage_subsidiary || '',
                    startDate: params.custpage_start_date || '',
                    endDate: params.custpage_end_date || '',
                    whtType: params.custpage_wth_type || '',
                    accoutingPeriod: params.custpage_period || '',
                    typePeriod: params.custpage_period_type || '',
                    typeProcess: params.custpage_wth_process || '',
                    status: '1'
                };
            }

            getTranslations(country) {
                const translatedFields = {
                    "es": {
                        "LMRY_MESSAGE": "Mensaje",
                        "LMRY_MESSAGE_LICENSE": "AVISO: Actualmente la licencia para este módulo está vencida, por favor contacte al equipo comercial de LatamReady.",
                        "LMRY_MESSAGE_CONTACT": "También puedes contactar con nosotros a",
                        "LMRY_PRIMARY_INFO": "Informacion primaria",
                        "LMRY_SUBSIDIARY": "Subsidiaria",
                        "LMRY_WTH_TYPE": "Tipo de retención",
                        "LMRY_PERIOD_INTERVAL": "Intervalo de periodos",
                        "LMRY_START_DATE": "Fecha de inicio",
                        "LMRY_END_DATE": "Fecha final",
                        "LMRY_PERIOD": "Periodo contable",
                        "LMRY_FILTER": "Filtrar",
                        "LMRY_PROCESS": "Procesar",
                        "LMRY_BACK": "Atras",
                        "LMRY_RESTART": "Reiniciar",
                        "LMRY_PERIOD_TYPE": "Tipo de período",
                        "LMRY_TRANSACTIONS": "Transacciones",
                        "LMRY_RESULTS": "Resultados",
                        "LMRY_APPLY": "Aplicar",
                        "LMRY_DOCUMENT_NUMBER": "Nùmero de Documento",
                        "LMRY_INTERNALID": "ID Interno",
                        "LMRY_TRANSACTION_TYPE": "Tipo de transaccion",
                        "LMRY_FISCAL_DOCUMENT": "Numero de documento fiscal",
                        "LMRY_AMOUNT": "Importe",
                        "LMRY_SELECT_ALL": "Seleccionar todo",
                        "LMRY_DESELECT_ALL": "Deseleccionar todo",
                        "LMRY_WHT_HEADER": "Cabecera",
                        "LMRY_WHT_LINE": "Linea",
                        "LMRY_DATE_RANGE": "Rango de fechas",
                        "LMRY_TYPE_PROCESS": "Proceso",
                        "LMRY_SALES": "Ventas",
                        "LMRY_PURCHASES": "Compras",
                    },
                    "en": {
                        "LMRY_MESSAGE": "Message",
                        "LMRY_MESSAGE_LICENSE": "NOTICE: Currently the license for this module is expired, please contact the LatamReady sales team.",
                        "LMRY_MESSAGE_CONTACT": "You can also contact us through",
                        "LMRY_PRIMARY_INFO": "Primary information",
                        "LMRY_SUBSIDIARY": "Subsidiary",
                        "LMRY_WTH_TYPE": "Withholding type",
                        "LMRY_PERIOD_INTERVAL": "Period interval",
                        "LMRY_START_DATE": "Start date",
                        "LMRY_END_DATE": "End date",
                        "LMRY_PERIOD": "Accounting period",
                        "LMRY_FILTER": "Filter",
                        "LMRY_PROCESS": "Process",
                        "LMRY_BACK": "Back",
                        "LMRY_RESTART": "Restart",
                        "LMRY_PERIOD_TYPE": "Type of period",
                        "LMRY_TRANSACTIONS": "Transactions",
                        "LMRY_RESULTS": "Results",
                        "LMRY_APPLY": "Apply",
                        "LMRY_DOCUMENT_NUMBER": "Document Number",
                        "LMRY_INTERNALID": "Internal ID",
                        "LMRY_TRANSACTION_TYPE": "Transaction type",
                        "LMRY_FISCAL_DOCUMENT": "Fiscal document number",
                        "LMRY_AMOUNT": "Amount",
                        "LMRY_SELECT_ALL": "Select all",
                        "LMRY_DESELECT_ALL": "Deselect all",
                        "LMRY_WHT_HEADER": "header",
                        "LMRY_WHT_LINE": "Line",
                        "LMRY_DATE_RANGE": "Date range",
                        "LMRY_TYPE_PROCESS": "Process",
                        "LMRY_SALES": "Sales",
                        "LMRY_PURCHASES": "Purchases",
                    }
                }
                return translatedFields[country];
            }


            toLogSuitelet() {
                redirect.toSuitelet({
                    scriptId: this.names.scriptid,
                    deploymentId: this.names.deployid
                });
            }

            runMapReduce({ state, user }) {
                const licenses = this.FEAT_SUBS
                    ? LibraryMail.getAllLicenses()[this.params.custpage_subsidiary]
                    : LibraryMail.getLicenses(1);

                const featureLatam = LibraryMail.getAuthorization(26, licenses);
                const { scriptMapReduce: MPRD_SCRIPT_ID, deployMapReduce: MPRD_DEPLOY_ID } = this.names;
                const parameters = featureLatam ? {
                    custscript_lmry_co_head_wht_calc_user: state,
                    custscript_lmry_co_head_wht_calc_state: user
                } : {};

                task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: MPRD_SCRIPT_ID,
                    deploymentId: MPRD_DEPLOY_ID,
                    params: parameters
                }).submit();
            }


            isValid(bool) {
                return (bool === "T" || bool === true);
            }

        }

        return { onRequest };
    });
