/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Reverse cancellation                       ||
||                                                              ||
||  File Name: LMRY_MX_Reverse_Cancellation_LBRY_V2.1.js         ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Jul 15 2023  LatamReady    Use Script 2.1           ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Author master@latamready.com
 **/

define([
    'N/log',
    'N/search',
    'N/runtime',
    'N/redirect',
    'N/ui/serverWidget',
    'N/url',
    'N/task',
    'N/format',
    'SuiteBundles/Bundle 37714/Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'
], function (log, search, runtime, redirect, serverWidget, url, task, format, LibraryMail) {
    const LMRY_script = 'LMRY - MX Canceled Documents Reversed LBRY';
    /* var LANGUAGE = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" });
        LANGUAGE = LANGUAGE.substring(0, 2); */

    var featureLatam = false;

    class LibraryHandler {
        constructor(options) {
            this.params = options.params || {};
            this.method = options.method;
            this.subsidiaries = [];
            this.typesTransaction = this.getTypeTransaction();
            this.FEAT_SUBS = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            this.FEAT_REVERSALVOIDING = runtime.getCurrentScript().getParameter({ name: 'REVERSALVOIDING' });
            this.deploy = runtime.getCurrentScript().deploymentId;
            this.names = this.getNames(this.deploy);
            log.debug('this.names', this.names);
        }

        getNames(deploy) {
            let nameList = {
                customdeploy_lmry_mx_rever_canc_stlt: {
                    scriptid: 'customscript_lmry_mx_rever_canc_log_stlt',
                    deployid: 'customdeploy_lmry_mx_rever_canc_log_stlt',
                    scriptMapReduce: 'customscript_lmry_mx_rever_canc_mprd',
                    deployMapReduce: 'customdeploy_lmry_mx_rever_canc_mprd',
                    paramuser: 'custscript_lmry_mx_rcd_user',
                    paramstate: 'custscript_lmry_mx_rcd_state'
                }
            };
            return nameList[deploy];
        }

        areThereSubsidiaries() {
            let subsidiaries = [];
            let anysubsidiary = false;
            let licenses = [];
            if (this.FEAT_SUBS == true || this.FEAT_SUBS == 'T') {
                let allLicenses = LibraryMail.getAllLicenses();

                subsidiaries = this.getSubsidiaries();

                for (var i = 0; i < subsidiaries.length; i++) {
                    if (allLicenses[subsidiaries[i].value] != null && allLicenses[subsidiaries[i].value] != '') {
                        licenses = allLicenses[subsidiaries[i].value];
                    } else {
                        licenses = [];
                    }
                    // 20 : Mexico	Basic	Localization
                    if (LibraryMail.getAuthorization(20, licenses)) {
                        subsidiaries[i].active = true;
                        anysubsidiary = true;
                    }
                }
            } else {
                subsidiaries.push({
                    value: 1,
                    text: 'Company',
                    active: false
                });
                licenses = LibraryMail.getLicenses(1);
                // 20 : Mexico	Basic	Localization
                if (LibraryMail.getAuthorization(20, licenses)) {
                    subsidiaries[0].active = true;
                    anysubsidiary = true;
                }
            }

            
            this.subsidiaries = subsidiaries;
            return anysubsidiary;
        }

        getSubsidiaries() {
            let subsis = [];
            // Solo subsidiaria MX
            let search_Subs = search.create({
                type: search.Type.SUBSIDIARY,
                filters: [['isinactive', 'is', 'F'], 'AND',
                ['country', 'is', 'MX']],
                columns: ['internalid', 'name']
            });
            let lengt_sub = search_Subs.run().getRange(0, 1000);

            if (lengt_sub != null && lengt_sub.length > 0) {
                // Llenado de listbox
                for (let i = 0; i < lengt_sub.length; i++) {
                    let subID = lengt_sub[i].getValue('internalid');
                    let subNM = lengt_sub[i].getValue('name');
                    subsis.push({
                        value: subID,
                        text: subNM,
                        active: false
                    });
                }
            }
            return subsis;
        }

        createForm() {

            this.form = serverWidget.createForm({
                title: 'LatamReady - MX Canceled Documents Reversed'
            });

            let form = this.form;

            let anysubsidiary = this.areThereSubsidiaries();

            if (!anysubsidiary) {
                // Mensaje para el cliente
                var myInlineHtml = form.addField({
                    id: 'custpage_lmry_v_message',
                    label: 'Mensaje',
                    type: serverWidget.FieldType.INLINEHTML
                });

                myInlineHtml.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW });
                myInlineHtml.updateBreakType({
                    breakType: serverWidget.FieldBreakType.STARTCOL
                });

                var strhtml = '<html>';
                strhtml +=
                    '<table border="0" class="table_fields" cellspacing="0" cellpadding="0">' +
                    '<tr>' +
                    '</tr>' +
                    '<tr>' +
                    '<td class="text">' +
                    '<div style="color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver">' +
                    'AVISO: Actualmente la licencia para este módulo está vencida, por favor contacte al equipo comercial de LatamReady' +
                    '. </br>' +
                    'También puedes contactar con nosotros a través de ' +
                    'www.Latamready.com' +
                    '</div>' +
                    '</td>' +
                    '</tr>' +
                    '</table>' +
                    '</html>';
                myInlineHtml.defaultValue = strhtml;

                return form;
            }

            form.addFieldGroup({
                id: 'mainGroup',
                label: 'Información Primaria'
            });

            let subsidiaryField;

            if (this.FEAT_SUBS == true || this.FEAT_SUBS == 'T') {
                subsidiaryField = form
                    .addField({
                        id: 'custpage_subsidiary',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Subsidiária',
                        container: 'mainGroup'
                    })
                    .setHelpText({
                        help: 'custpage_subsidiary'
                    });
                subsidiaryField.isMandatory = true;
            }

            let typeTransaction = form.addField({
                id: 'custpage_type_transaction',
                type: serverWidget.FieldType.SELECT,
                label: 'Tipo de transaccion',
                container: 'mainGroup'
            })
                .setHelpText({
                    help: 'custpage_type_transaction'
                });

            //typeTransaction.isMandatory = true;
            // Para la etapa 1 solo quedará invoice, en la etapa 2 se agrega credit memo y payment.
            typeTransaction.addSelectOption({ value: 'CustInvc', text: this.typesTransaction['CustInvc'] });
            typeTransaction.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            form.addFieldGroup({
                id: 'dateRangeGroup',
                label: 'Rango de fechas'
            });


            let startDateField = form
                .addField({
                    id: 'custpage_start_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha de inicio',
                    container: 'dateRangeGroup'
                })
                .setHelpText({
                    help: 'custpage_start_date'
                });


            let endDateField = form
                .addField({
                    id: 'custpage_end_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha de fin',
                    container: 'dateRangeGroup'
                })
                .setHelpText({
                    help: 'custpage_end_date'
                });

            form.addFieldGroup({
                id: 'setup',
                label: 'Configuración'
            });

            let account = form
                .addField({
                    id: 'custpage_account',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Account',
                    container: 'setup'
                })
                .setHelpText({
                    help: 'custpage_account'
                });
            account.isMandatory = true;

            form.addField({
                id: 'custpage_status',
                type: serverWidget.FieldType.TEXT,
                label: 'Status'
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            form.addField({
                id: 'custpage_feature_latam',
                type: serverWidget.FieldType.TEXT,
                label: 'Feature Latam'
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            form.addField({
                id: 'custpage_log_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Log ID'
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            let deployIdField = form
                .addField({
                    id: 'custpage_deploy_id',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Deploy ID'
                })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            deployIdField.defaultValue = runtime.getCurrentScript().deploymentId;


            if (!Number(this.params.status)) {
                form.addSubmitButton({
                    label: 'filtrar'
                });

            } else {
                form.addSubmitButton({
                    label: 'siguiente'
                });
                form.addButton({
                    id: 'btn_back',
                    label: 'Atras',
                    functionName: 'back'
                });

                if (subsidiaryField) {
                    subsidiaryField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                }
                startDateField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                endDateField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                account.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

            }

            form.addResetButton({
                label: 'Reiniciar'
            });

            return form;
        }

        loadFormValues() {
            if (this.FEAT_SUBS == true || this.FEAT_SUBS == 'T') {
                this.fillSubsidiaries();
            }
            //this.fillTransactionType();
        }

        fillSubsidiaries() {
            let subsidiaryField = this.form.getField({
                id: 'custpage_subsidiary'
            });

            if (subsidiaryField) {
                subsidiaryField.addSelectOption({ value: 0, text: '&nbsp;' });

                if (this.subsidiaries) {
                    for (let i = 0; i < this.subsidiaries.length; i++) {
                        let id = this.subsidiaries[i].value;
                        let name = this.subsidiaries[i].text;
                        if (this.subsidiaries[i].active) {
                            subsidiaryField.addSelectOption({ value: id, text: name });
                        }
                    }
                }
            }
        }

        fillTransactionType() {
            let typeTransactionField = this.form.getField({
                id: 'custpage_type_transaction'
            });

            if (typeTransactionField) {
                typeTransactionField.addSelectOption({ value: 0, text: '&nbsp;' });
                for (let type in this.typesTransaction) {
                    typeTransactionField.addSelectOption({ value: type, text: this.typesTransaction[type] });
                }
                
            }
        }


        getTypeTransaction() {
            return {
                "CustInvc": "Invoice",
                //"creditmemo": "Credit Memo",
                "customerpayment": "Payment"
            }
        }
        getRecordType(type) {
            var recordType = {
                "CustInvc": "invoice",
                "CustCredit": "creditmemo",
                "customerpayment": "customerpayment"
            }
            return recordType[type];
        }

        getRedirectParams() {
            let params = this.params;
            return {
                subsidiary: params.custpage_subsidiary || '',
                startDate: params.custpage_start_date || '',
                endDate: params.custpage_end_date || '',
                typeTransaction: params.custpage_type_transaction || '',
                account: params.custpage_account || '',
                status: '1'
            };
        }

        setFormValues() {
            let {
                subsidiary,
                startDate,
                endDate,
                typeTransaction,
                account
            } = this.params;
            let form = this.form;

            let allLicenses = {};
            let licenses = [];
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
            // 20 : Mexico	Basic	Localization
            featureLatam = LibraryMail.getAuthorization(20, licenses);
            

            let featureLatamField = form.getField({ id: 'custpage_feature_latam' });
            featureLatamField.defaultValue = featureLatam ? 'T' : 'F';
            let typeTransactionField = form.getField({ id: 'custpage_type_transaction' });
            typeTransactionField.addSelectOption({ value: typeTransaction, text: this.typesTransaction[typeTransaction] });
            typeTransactionField.defaultValue = typeTransaction;

            let nameAccount = search.lookupFields({
                type: 'account',
                id: account,
                columns: ['name']
            }).name;

            let accountField = form.getField({ id: 'custpage_account' });
            accountField.addSelectOption({ value: account, text: nameAccount });
            accountField.defaultValue = account;

            form.updateDefaultValues({
                custpage_start_date: startDate || '',
                custpage_end_date: endDate || '',
                custpage_status: '1',
                custpage_type_transaction: typeTransaction || "",
                custpage_account: account || ""
            });
        }

        createTransactionSublist() {
            this.form.addTab({
                id: 'transactions_tab',
                label: 'transaccciones'
            });

            this.sublist = this.form.addSublist({
                id: 'custpage_results_list',
                label: 'resultados',
                tab: 'transactions_tab',
                type: serverWidget.SublistType.LIST
            });

            let sublist = this.sublist;

            sublist.addField({
                id: 'apply',
                label: 'aplicar',
                type: serverWidget.FieldType.CHECKBOX
            });

            sublist.addField({
                id: 'internalid',
                label: 'Id interno',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'type_transaction',
                label: 'Tipo de transaccion',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'legal_document_type',
                label: 'Numero de documento fiscal',
                type: serverWidget.FieldType.TEXT
            });

            sublist.addField({
                id: 'tranid',
                label: 'Nùmero de Documento',
                type: serverWidget.FieldType.TEXT
            });

            let totalAmtField = sublist.addField({
                id: 'total_amt',
                label: 'Importe documento',
                type: serverWidget.FieldType.CURRENCY
            });

            totalAmtField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            totalAmtField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

            let internalidtextField = sublist.addField({
                id: 'internalidtext',
                label: 'internal_id',
                type: serverWidget.FieldType.TEXT
            });
            internalidtextField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            sublist.addButton({
                id: 'btn_mark_all',
                label: 'Seleccionar todo',
                functionName: 'toggleCheckBoxes(true)'
            });

            sublist.addButton({
                id: 'btn_desmark_all',
                label: 'Deseleccionar todo',
                functionName: 'toggleCheckBoxes(false)'
            });

            return sublist;
        }

        loadTransactionSublist() {

            if (this.FEAT_REVERSALVOIDING == true || this.FEAT_REVERSALVOIDING == 'T') {
                let data = this.getTransactions();

                let sublist = this.form.getSublist({ id: 'custpage_results_list' });

                data.forEach((transaction, i) => {
                    sublist.setSublistValue({ id: 'apply', line: i, value: 'F' });
                    sublist.setSublistValue({ id: 'internalidtext', line: i, value: transaction.id });
                    sublist.setSublistValue({ id: 'tranid', line: i, value: transaction.tranid });
                    sublist.setSublistValue({ id: 'type_transaction', line: i, value: transaction.typeName });
                    sublist.setSublistValue({ id: 'legal_document_type', line: i, value: transaction.legalDocumentType });
                    let tranUrl = url.resolveRecord({ recordType: this.getRecordType(transaction.typeID), recordId: transaction.id, isEditMode: false });
                    let urlID = `<a class="dottedlink" href=${tranUrl} target="_blank">${transaction.id}</a>`;
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
            //let { vendor, multivendor, currency, ap_account, subsidiary, date } = this.params;
            let { subsidiary, typeTransaction, endDate, startDate } = this.params
            let filters = [
                ['type', 'anyof', typeTransaction],
                'AND',
                ['custbody_lmry_pe_estado_sf', 'is', 'Cancelado'],
                'AND',
                ['mainline', 'is', 'T'],
                'AND',
                ["applyingtransaction", "noneof", "@NONE@"]
            ];
            //startDate = format.parse({ value: startDate, type: format.Type.DATE });
            //endDate = format.parse({ value: endDate, type: format.Type.DATE });
            if (startDate != null && startDate != '') {
                filters.push('AND');
                filters.push(['trandate', 'onorafter', startDate]);
            }
            if (endDate != null && endDate != '') {
                filters.push('AND');
                filters.push(['trandate', 'onorbefore', endDate]);
                
            }

            let settings = [];

            if (this.FEAT_SUBS == true || this.FEAT_SUBS == 'T') {
                filters.push('AND', ['subsidiary', 'anyof', subsidiary]);
                settings = [search.createSetting({ name: 'consolidationtype', value: 'NONE' })];
            }

            let columns = [];
            columns.push(search.createColumn({ name: 'internalid', sort: search.Sort.DESC }));
            columns.push(search.createColumn({ name: 'type' }));
            columns.push(search.createColumn({ name: 'custbody_lmry_document_type' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{tranid}' }));
            columns.push(search.createColumn({ name: 'amount' }));

            let searchTransactions = search.create({
                type: 'transaction',
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
                        transaction.typeID = result.getValue('type');
                        transaction.legalDocumentType = result.getText('custbody_lmry_document_type') || '';
                        transaction.tranid = result.getValue('formulatext') || '';
                        transaction.amount = Number(result.getValue('amount'));

                        data.push(transaction);
                    });
                });
            }

            return data;
        }

        runMapReduce(parametros) {
            let allLicenses = {};
            let licenses = [];
            if (this.FEAT_SUBS == true || this.FEAT_SUBS == 'T') {
                allLicenses = LibraryMail.getAllLicenses();
                licenses = allLicenses[this.params.custpage_subsidiary];
            } else {
                licenses = LibraryMail.getLicenses(1);
            }

            // 20 : Mexico	Basic	Localization
            featureLatam = LibraryMail.getAuthorization(20, licenses);
            let MPRD_SCRIPT_ID = this.names.scriptMapReduce;
            let MPRD_DEPLOY_ID = this.names.deployMapReduce;
            let parameters = {};
            if (featureLatam) {
                parameters.custscript_lmry_mx_rcd_state = parametros.state;
                parameters.custscript_lmry_mx_rcd_user = parametros.user;
            }

            task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: MPRD_SCRIPT_ID,
                deploymentId: MPRD_DEPLOY_ID,
                params: parameters
            }).submit();
        }

        toLogSuitelet() {
            let STLT_LOG_ID = this.names.scriptid;
            let DEPLOY_LOG_ID = this.names.deployid;
            redirect.toSuitelet({
                scriptId: STLT_LOG_ID,
                deploymentId: DEPLOY_LOG_ID
            });
        }

    }

    return {
        LibraryHandler: LibraryHandler
    };
});