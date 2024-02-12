/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @Name LMRY_CO_Header_WHT_calculation_URET_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */

define(['N/runtime', 'N/ui/serverWidget', 'N/search', 'N/url'], (runtime, serverWidget, search,url) => {


    const beforeLoad = (scriptContext) => {
        try {
            let mainUIManager = new UIManager(scriptContext);
            if (mainUIManager.isUserInterface()) {
                mainUIManager.hiddenFields();
                mainUIManager.buildTable();
                mainUIManager.loadTable();
            }
        } catch (error) {
           log.error('Error beforeLoad ', error)
        }
        
    };


    class UIManager {
        constructor(scriptContext) {
            let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
            language = language === "es" ? language : "en";
            this.translations = this.getTranslations(language);
            this.FEAT_SUBS = this.isValid(runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' }));
            this.subsidiaries = [];
            this.scriptContext = scriptContext;
            this.form = scriptContext.form;
        }

        buildTable() {

            this.form.clientScriptModulePath = './LMRY_CO_Header_WHT_calculation_CLNT_V2.1.js';
            this.form.addButton({
                id: "custpage_btn_reload",
                label: "Refresh",
                functionName: "reload()"
            });
            this.tab = this.form.addTab({ id: 'custpage_tab_transactions', label: this.translations.LMRY_TRANSACTIONS });
            this.form.insertTab({ tab: this.tab, nexttab: 'notes' });
            this.sublist = this.form.addSublist({
                id: 'custpage_custlist_transactions',
                label: this.translations.LMRY_TRANSACTIONS,
                tab: 'custpage_tab_transactions',
                type: serverWidget.SublistType.LIST
            });

            const fields = [
                { id: 'custpage_col_number', label: this.translations.LMRY_NUMBER, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_tranid', label: this.translations.LMRY_DOCUMENT_NUMBER, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_entity', label: this.translations.LMRY_ENTITY, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_type_transaction', label: this.translations.LMRY_TRANSACTION_TYPE, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_legal_document_type', label: this.translations.LMRY_FISCAL_DOCUMENT, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_currency', label: this.translations.LMRY_CURRENCY, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_total_amt', label: this.translations.LMRY_AMOUNT, type: serverWidget.FieldType.CURRENCY },
                { id: 'custpage_col_state', label: this.translations.LMRY_STATE, type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.DISABLED },
                { id: 'custpage_col_internalidtext', label: 'internal_id', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.HIDDEN }
            ];
            fields.forEach(fieldInfo => {
                let field = this.sublist.addField(fieldInfo);
                if (fieldInfo.displayType) {
                    field.updateDisplayType({ displayType: fieldInfo.displayType });
                }
            });

        }

        loadTable() {
            const data = this.getTransactions();
            //const data = [];
            const sublist = this.form.getSublist({ id: "custpage_custlist_transactions" });
            const ids = Object.keys(data);
            ids.forEach((id, i) => {
                const { internalid, tranid, legalDocument, entityName, entityValue, state, type, recordType, amount, currency } = data[id];
                sublist.setSublistValue({ id: "custpage_col_number", line: i, value: i + 1 });

                const tranUrl = url.resolveRecord({ recordType, recordId: internalid, isEditMode: false });
                sublist.setSublistValue({ id: "custpage_col_tranid", line: i, value: `<a class="dottedlink" href="${tranUrl}" target="_blank">${tranid}</a>` });

                const entityType = ["invoice", "creditmemo"].includes(recordType) ? "customer" : "vendor";
                const tranUrlEntity = url.resolveRecord({ recordType: entityType, recordId: entityValue, isEditMode: false });
                sublist.setSublistValue({ id: "custpage_col_entity", line: i, value: `<a class="dottedlink" href="${tranUrlEntity}" target="_blank">${entityName}</a>` });

                
                const setSublistValue = (colId, value) => sublist.setSublistValue({ id: colId, line: i, value });
                setSublistValue("custpage_col_type_transaction", type);
                setSublistValue("custpage_col_legal_document_type", legalDocument);
                setSublistValue("custpage_col_currency", currency);
                setSublistValue("custpage_col_total_amt", Number(amount).toFixed(2));
                setSublistValue("custpage_col_state", state);
            });

            if (ids.length) {
                sublist.label = `${sublist.label} (${ids.length})`;
            }
        }


        getTransactions() {
            const transactionsState = JSON.parse(
                this.scriptContext.newRecord.getValue('custrecord_lmry_co_hwht_log_transactions'));

            const recordLogState = this.scriptContext.newRecord.getValue('custrecord_lmry_co_hwht_log_state');
            let transactionIds = transactionsState.map(ts => typeof ts === 'object' && ts !== null ? ts.id : ts);
            let state = transactionIds.length > 0 && typeof transactionsState[0] !== 'object' ? "Procesando" : undefined;

            if (transactionIds.length === 0) return {};

            const transactions = {};
            let columns = [];
            columns.push(search.createColumn({ name: 'formulatext', formula: '{internalid}', sort: search.Sort.DESC }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{type}' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{entity}' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{recordType}' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{custbody_lmry_document_type}' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{tranid}' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{fxamount}' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{currency}' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{entity.id}' }));
            let settings = [];
            if (this.FEAT_SUBS) {
                settings = [search.createSetting({ name: 'consolidationtype', value: 'NONE' })];
            }
            search.create({
                type: "transaction",
                filters: [["internalid", "anyof", transactionIds], "AND", ["mainline", "is", "T"]],
                columns: columns,
                settings: settings
            }).run().each(result => {
                let columns = result.columns;
                const internalid = result.getValue(columns[0]);
                transactions[internalid] = {
                    internalid,
                    legalDocument: result.getValue(columns[4]) || " ",
                    entityName: result.getValue(columns[2])|| " ",
                    entityValue: result.getValue(columns[8])|| " ",
                    tranid: result.getValue(columns[5])|| " - ",
                    type: result.getValue(columns[1])|| " ",
                    recordType: result.getValue(columns[3])|| " ",
                    amount: Math.abs(result.getValue(columns[6]))|| 0,
                    currency: result.getValue(columns[7])|| " ",
                    state: "Procesando"
                };
                return true;
            });
            log.error("state",state)
            if (!state) {
                transactionsState.forEach(({ id, state }) => {
                    Object.assign(transactions[id], { state: state });
                });
            } else if (!["Finalizado", "Procesando", "Cargando datos"].includes(recordLogState)) {
                transactionIds.forEach(id => {
                    transactions[id].state = "No procesada";
                });
            }

            return transactions;
        }

        hiddenFields(){
            let jsonTransactions = this.form.getField('custrecord_lmry_co_hwht_log_transactions');
            jsonTransactions.updateDisplayType({displayType: 'hidden'});
        }


        isUserInterface() {
            return runtime.executionContext == 'USERINTERFACE';
        }

        getTranslations(country) {
            const translatedFields = {
                "es": {
                    "LMRY_TRANSACTIONS": "Transacciones",
                    "LMRY_NUMBER": "Posición",
                    "LMRY_DOCUMENT_NUMBER": "Nùmero de Documento",
                    "LMRY_INTERNALID": "ID Interno",
                    "LMRY_TRANSACTION_TYPE": "Tipo de transaccion",
                    "LMRY_FISCAL_DOCUMENT": "Numero de documento fiscal",
                    "LMRY_AMOUNT": "Importe",
                    "LMRY_ENTITY": "Entidad",
                    "LMRY_CURRENCY": "Moneda",
                    "LMRY_STATE": "Estado",
                    "LMRY_RESTART": "Reiniciar",
                },
                "en": {
                    "LMRY_TRANSACTIONS": "Transactions",
                    "LMRY_NUMBER": "Position",
                    "LMRY_DOCUMENT_NUMBER": "Document Number",
                    "LMRY_INTERNALID": "Internal ID",
                    "LMRY_TRANSACTION_TYPE": "Transaction type",
                    "LMRY_FISCAL_DOCUMENT": "Fiscal document number",
                    "LMRY_AMOUNT": "Amount",
                    "LMRY_ENTITY": "Entity",
                    "LMRY_CURRENCY": "Currency",
                    "LMRY_STATE": "State",
                    "LMRY_RESTART": "Restart",
                }
            }
            return translatedFields[country];
        }

        isValid(bool) {
            return (bool === "T" || bool === true);
        }

    }

    return { beforeLoad };
});