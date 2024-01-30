/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_CO_WHT_Header_Purchase_STLT_LBRY_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */
define([
    'N/log',
    'N/search',
    'N/runtime',
    'N/redirect',
    'N/ui/serverWidget',
    'N/url',
    'N/task',
    'N/format',
    'N/record',
    'SuiteBundles/Bundle 37714/Latam_Library/LMRY_libSendingEmailsLBRY_V2.0',

], function (log, search, runtime, redirect, serverWidget, url, task, format, record, LibraryMail) {
    const LMRY_script = 'LatamReady - CO WHT Header Purchase STLT LBRY';

    const language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
    language = language === "es" ? language : "en";




    class LibraryHandler {
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
                    scriptid: 'customscript_lmry_co_head_wht_calc_stlt',
                    deployid: 'customdeploy_lmry_co_head_wht_calc_stlt',
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
                isMandatory: function() {
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
            const fieldsToDisable = ['custpage_subsidiary', 'custpage_start_date', 'custpage_end_date', 'custpage_period', 'custpage_wth_type','custpage_period_type'];
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

                let licenses = this.FEAT_SUBS ? allLicenses[subsidiaries[i].value]: LibraryMail.getLicenses(subsidiaries[i].value);
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

        fillWhtType(){
            let whtTypeField = this.form.getField({ id: 'custpage_wth_type' });
            whtTypeField.addSelectOption({ value: 0, text: '&nbsp;' });
            whtTypeField.addSelectOption({ value: "header", text: this.translations.LMRY_WHT_HEADER });
            whtTypeField.addSelectOption({ value: "line", text: this.translations.LMRY_WHT_LINE });
        }
        fillPeriodType(){
            let periodTypeField = this.form.getField({ id: 'custpage_period_type' });
            periodTypeField.addSelectOption({ value: 0, text: '&nbsp;' });
            periodTypeField.addSelectOption({ value: "range", text: this.translations.LMRY_DATE_RANGE });
            periodTypeField.addSelectOption({ value: "month", text: this.translations.LMRY_PERIOD });   
        }
        
        
        setFormValues() {
            let {
                subsidiary,
                startDate,
                endDate,
                whtType,
                accoutingPeriod,
                typePeriod
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

            form.updateDefaultValues({
                custpage_start_date: startDate || '',
                custpage_end_date: endDate || '',
                custpage_status: '1',
                custpage_wth_type: whtType || '',
                custpage_period: accoutingPeriod || '',
                custpage_period_type: typePeriod || '' 
            });
        }

        loadTransactionSublist() {

            if (this.FEAT_REVERSALVOIDING == true || this.FEAT_REVERSALVOIDING == 'T') {
                let data = this.getTransactions();

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

        }

        getTransactions() {
            let data = [];
            let { subsidiary, typeTransaction, endDate, startDate } = this.params

            let filters = [
                ['custbody_lmry_pe_estado_sf', 'is', 'Cancelado'],
                'AND',
                ['mainline', 'is', 'T']
            ];

            if (startDate != null && startDate != '') {
                filters.push('AND');
                filters.push(['trandate', 'onorafter', startDate]);
            }
            if (endDate != null && endDate != '') {
                filters.push('AND');
                filters.push(['trandate', 'onorbefore', endDate]);

            }

            let settings = [];

            if (this.FEAT_SUBS) {
                filters.push('AND', ['subsidiary', 'anyof', subsidiary]);
                settings = [search.createSetting({ name: 'consolidationtype', value: 'NONE' })];
            }

            let columns = [];
            columns.push(search.createColumn({ name: 'internalid', sort: search.Sort.DESC }));
            columns.push(search.createColumn({ name: 'type' }));
            columns.push(search.createColumn({ name: 'custbody_lmry_document_type' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{tranid}' }));
            columns.push(search.createColumn({ name: 'amount' }));
            columns.push(search.createColumn({ name: 'recordtype' }));

            let searchTransactions = search.create({
                type: typeTransaction,
                filters: filters,
                columns: columns,
                settings: settings
            });

            let pageData = searchTransactions.runPaged({ pageSize: 1000 });
            if (pageData) {
                pageData.pageRanges.forEach(function (pageRange) {
                    let page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(function (result) {
                        let transaction = {};
                        transaction.id = result.getValue('internalid');
                        transaction.typeName = result.getText('type');
                        transaction.typeID = result.getValue('recordtype');
                        transaction.legalDocumentType = result.getText('custbody_lmry_document_type') || '';
                        transaction.tranid = result.getValue('formulatext') || '';
                        transaction.amount = Number(result.getValue('amount'));

                        data.push(transaction);
                    });
                });
            }

            log.error("data [getTransactions]", data);
            return data;
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

                }
            }
            return translatedFields[country];
        }


        isValid(bool){
            return (bool === "T" || bool === true);
        }

    }

    return {
        LibraryHandler: LibraryHandler
    };
});