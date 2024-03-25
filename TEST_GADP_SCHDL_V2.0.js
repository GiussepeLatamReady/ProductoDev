/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =*\
||  This script for Report - Chile                                      ||
||                                                                      ||
||  File Name: TEST_GADP_SCHDL_V2.0.js                       ||
||                                                                      ||
||  Version Date           Author            Remarks                    ||
||  2.0     April 01 2023  Giussepe Delgado  Use Script 2.0             ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(["N/search", "N/record", "N/log", "N/query", "N/runtime",'/SuiteBundles/Bundle 245636/EI_Library/LMRY_VoidedCreditMemo_LBRY_V2.0'],
    function (search, record, log, query, runtime,libraryVoidCreditMemo) {

        function execute(Context) {
            // ID de la transacción que deseas duplicar
            try {
                //var invoiceId = "1041271"
                //var result = record.create({ type:"customtransaction_lmry_ei_voided_transac"});
                //log.error("type",result.getValue("type"))
                /*;
                voidCreditMemo("3959849",true);
               voidCreditMemo("3959850",true);
               voidCreditMemo("3959851",true);
               voidCreditMemo("3959852",true);
               voidCreditMemo("3959853",true);
               voidCreditMemo("3959854",true);
               
               for (var i = 0; i < 25; i++) {
                   copyCreditMemo("3939035");
               }
               
               
                

                var CreditMemoAccount = search.lookupFields({
                    type: "creditmemo",
                    id: "3939157",
                    columns: ["accountmain"]
                }).accountmain[0].value;
                log.error("creditMemoSearch", CreditMemoAccount);

                
                //log.error("account",creditMemoSearch.accountmain[0].value);


                for (var i = 0; i < 10; i++) {
                    var newTransactionId = copyPayment("604361");
                    Remove_Trans(newTransactionId,'customerpayment',true);
                    changeStatus(newTransactionId)
                }
                log.error("TEst","Process end");   
                //Remove_Trans(nInternalid, nTypeRec, void_feature);
                
                var payments = ["1054526",
                "1054528",
                "1054530",
                "1054532",
                "1054534",
                "1054536",
                "1054538",
                "1054540",
                "1054542",
                "1054544"];
                payments.forEach(function(id) {
                    changeStatus(id);
                });
                */


                createTransaction();
            } catch (error) {
                log.error("error", error)
            }

        }

        function searchTest() {

        }
        function createTransaction() {
            var ids = getSearch();
            ids = ids.slice(0, 2);
            ids.forEach(function (id) {
                log.error("Credit Memo id",id)
                libraryVoidCreditMemo.voidCreditMemo(id, true);
            });
        }

        function getSearch() {
            var data = [];
            var columns = [];
            columns.push(search.createColumn({ name: 'internalid', sort: search.Sort.DESC }));

            var filters = [
                ['custbody_lmry_pe_estado_sf', 'is', 'Procesando'],
                'AND',
                ['mainline', 'is', 'T']
            ];

            var settings = [];
            if (this.FEAT_SUBS == true || this.FEAT_SUBS == 'T') {
                filters.push('AND', ['subsidiary', 'anyof', "6", "23"]);
                settings = [search.createSetting({ name: 'consolidationtype', value: 'NONE' })];
            }
            //startDate = format.parse({ value: startDate, type: format.Type.DATE });
            //endDate = format.parse({ value: endDate, type: format.Type.DATE });


            //var typeVoidTransaction = record.create({ type:"customtransaction_lmry_ei_voided_transac"}).getValue("type");
            //filters.push('AND');
            //filters.push(["appliedtotransaction.type","anyof",typeVoidTransaction]);

            var searchTransactions = search.create({
                type: "creditmemo",
                filters: filters,
                columns: columns,
                settings: settings
            });

            var pageData = searchTransactions.runPaged({ pageSize: 1000 });
            if (pageData) {
                pageData.pageRanges.forEach(function (pageRange) {
                    var page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(function (result) {
                        data.push(result.getValue('internalid'));
                    });
                });
            }

            //log.error("data [getTransactions]", data);
            log.error("data length [getTransactions]", data.length);
            return data;

        }

        function copyCreditMemo(transactionId) {
            // Duplicar la transacción
            var duplicatedTransaction = record.copy({
                type: record.Type.CREDIT_MEMO, // Reemplaza con el tipo de transacción adecuado
                id: transactionId,
            });

            // Puedes realizar modificaciones en la transacción duplicada si es necesario
            duplicatedTransaction.setValue({
                fieldId: 'custbody_lmry_pe_estado_sf',
                value: 'Procesando',
            });

            duplicatedTransaction.setValue({
                fieldId: 'memo',
                value: 'Copias generadas gadp',
            });

            duplicatedTransaction.setValue({
                fieldId: 'approvalstatus',
                value: '2',
            });

            // Guardar la transacción duplicada
            var newTransactionId = duplicatedTransaction.save();

            log.error('Transacción duplicada', 'Nueva transacción ID: ' + newTransactionId);
        }
        function changeStatus(payment){
            var paymentTransaction = record.load({
                type: record.Type.CUSTOMER_PAYMENT, // Reemplaza con el tipo de transacción adecuado
                id: payment,
            });

            paymentTransaction.setValue({
                fieldId: 'custbody_lmry_pe_estado_sf',
                value: 'Cancelado',
            });

            paymentTransaction.save();

            log.error('Transacción cambiado', 'Transacción cambiado');
        }

        function copyPayment(transactionId) {
            // Duplicar la transacción
            var duplicatedTransaction = record.copy({
                type: record.Type.CUSTOMER_PAYMENT, // Reemplaza con el tipo de transacción adecuado
                id: transactionId,
            });

            // Puedes realizar modificaciones en la transacción duplicada si es necesario
            duplicatedTransaction.setValue({
                fieldId: 'custbody_lmry_pe_estado_sf',
                value: 'generado',
            });

            duplicatedTransaction.setValue({
                fieldId: 'payment',
                value: 200.00 * Math.random(),
            });

            duplicatedTransaction.setValue({
                fieldId: 'memo',
                value: 'Copias generadas gadp',
            });

            // Guardar la transacción duplicada
            var newTransactionId = duplicatedTransaction.save();

            log.error('Transacción duplicada', 'Nueva transacción ID: ' + newTransactionId);
            return newTransactionId;
        }


        function voidCreditMemo(recordId, void_feature) {

            if (void_feature == "T" || void_feature == true) {
                voidCreditMemoNonStandar(recordId);
            } else {
                voidCreditMemoStandar(recordId);
            }
        }

        function voidCreditMemoNonStandar(recordId) {
            try {
                var result = {
                    trans: '',
                    fields: []
                };
                var lineFields = {
                    department: '',
                    class: '',
                    location: ''
                };
                var filters = [];
                var configFilters = [];
                var configuration = [];
                var detailsCreditMemo = query.runSuiteQL({
                    query: "SELECT top 2 BUILTIN.DF( TransactionAccountingLine.Account ) AS Account,TransactionAccountingLine.Account,TransactionAccountingLine.Debit,TransactionAccountingLine.Credit,TransactionAccountingLine.Posting,TransactionLine.Memo,TransactionLine.id,TransactionLine.Transaction FROM accountingbook, TransactionLine,TransactionAccountingLine where TransactionLine.Transaction = TransactionAccountingLine.Transaction and TransactionAccountingLine.accountingbook=accountingbook.id  and   accountingbook.isprimary= 'T'   and TransactionAccountingLine.Transaction = '" + recordId + "' and (TransactionAccountingLine.Debit IS NOT NULL or TransactionAccountingLine.Credit IS NOT NULL ) ORDER BY TransactionLine.ID"
                }).results;
                // log.error("data custPymtAccountDetail", [custPymtAccountDetail[0], custPymtAccountDetail[1]]);
                var accountDebit = detailsCreditMemo.filter(function (account) { return account.values[2] == null })[0].values[1];
                var accountCredit = detailsCreditMemo.filter(function (account) { return account.values[3] == null })[0].values[1];
                log.debug("detailsCreditMemo", [accountDebit, accountCredit]);

                F_SUBSIDIAR = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                F_LOCMANDATORY = runtime.getCurrentUser().getPreference({ name: 'LOCMANDATORY' });
                F_DEPTMANDATORY = runtime.getCurrentUser().getPreference({ name: 'DEPTMANDATORY' });
                F_CLASSMANDATORY = runtime.getCurrentUser().getPreference({ name: 'CLASSMANDATORY' });


                var creditMemoValues = getTransactionValues(recordId, search.Type.CREDIT_MEMO);
                log.error("creditMemoValues", creditMemoValues);
                //-------------- validate dept, class, loct
                lineFields['department'] = creditMemoValues.department;
                lineFields['class'] = creditMemoValues.class_;
                lineFields['location'] = creditMemoValues.location;

                if (F_SUBSIDIAR) filters.push(search.createFilter({
                    name: "custrecord_lmry_setuptax_subsidiary",
                    operator: search.Operator.IS,
                    values: creditMemoValues.subsidiary
                }));
                if ((lineFields['department'] == '' || lineFields['department'] == null) && F_DEPTMANDATORY) configFilters.push('custrecord_lmry_setuptax_department');
                if ((lineFields['class'] == '' || lineFields['class'] == null) && F_CLASSMANDATORY) configFilters.push('custrecord_lmry_setuptax_class');
                if ((lineFields['location'] == '' || lineFields['location'] == null) && F_LOCMANDATORY) configFilters.push('custrecord_lmry_setuptax_location');

                //---------------- setup tax subsidiary
                if (configFilters.length > 0) configuration = search.create({
                    type: "customrecord_lmry_setup_tax_subsidiary",
                    filters: [
                        filters
                    ],
                    columns: configFilters,
                }).run().getRange(0, 1);

                configFilters.forEach(function (fieldId) {
                    var configField = configuration[0].getValue(fieldId);
                    fieldId.replace('custrecord_lmry_setuptax_', '');
                    if (configField != null && configField != undefined && configField != '') {
                        lineFields[fieldId] = configField;
                    }
                });

                //------------------- Journal
                var voidCreditMemo = record.create({
                    type: "customtransaction_lmry_ei_voided_transac",
                    isDynamic: true
                });

                //------------------- Body
                if (F_SUBSIDIAR) voidCreditMemo.setValue({
                    fieldId: 'subsidiary',
                    value: creditMemoValues.subsidiary
                });
                voidCreditMemo.setValue({
                    fieldId: 'currency',
                    value: creditMemoValues.currency
                });
                voidCreditMemo.setValue({
                    fieldId: 'exchangerate',
                    value: creditMemoValues.exchangerate
                });
                voidCreditMemo.setValue({
                    fieldId: 'memo',
                    value: 'Latam - Void Credit Memo'
                });
                voidCreditMemo.setValue({
                    fieldId: 'custbody_lmry_reference_entity',
                    value: creditMemoValues.customer
                });

                voidCreditMemo.setValue({
                    fieldId: 'custbody_lmry_reference_transaction',
                    value: recordId
                });

                voidCreditMemo.setValue({
                    fieldId: 'custbody_lmry_reference_transaction_id',
                    value: recordId
                });

                var lineAmount = creditMemoValues.total;

                //------------------- debit
                voidCreditMemo.selectNewLine({
                    sublistId: 'line'
                });
                voidCreditMemo.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: accountDebit
                });
                voidCreditMemo.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: "credit",
                    value: lineAmount
                });
                voidCreditMemo.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: creditMemoValues.customer
                });
                voidCreditMemo.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'memo',
                    value: 'Latam - Void Credit Memo'
                });

                for (var property in lineFields) {
                    if (lineFields[property] != '' && lineFields[property] != null && lineFields[property] != null) {
                        voidCreditMemo.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: property,
                            value: lineFields[property]
                        });
                    }
                }
                voidCreditMemo.commitLine({
                    sublistId: 'line'
                });

                //------------------- credit
                voidCreditMemo.selectNewLine({
                    sublistId: 'line'
                });
                voidCreditMemo.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: accountCredit
                });
                voidCreditMemo.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: "debit",
                    value: lineAmount
                })
                voidCreditMemo.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: creditMemoValues.customer
                });
                voidCreditMemo.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'memo',
                    value: 'Latam - Void Credit Memo'
                });

                for (var property in lineFields) {
                    if (lineFields[property] != '' && lineFields[property] != null && lineFields[property] != null) {
                        voidCreditMemo.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: property,
                            value: lineFields[property]
                        });
                    }
                }

                voidCreditMemo.commitLine({
                    sublistId: 'line'
                });

                var trasactionVoid = voidCreditMemo.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                log.debug("End Void Credit Memo", trasactionVoid);
                unapplyAndApplyTransaction(recordId, "creditmemo", trasactionVoid);

            } catch (error) {
                log.error('LMRY_AnulacionInvoice_LBRY_V2 - [voidCreditMemoNonStandar]', error);
                libraryEmail.sendemail(' [ reversalJournal ] ' + error, LMRY_script);
            }
        }

        function voidCreditMemoStandar(recordId) {

            try {

                var columns = [
                    "accountingperiod.closed"
                ];
                var creditMemoSearch = search.lookupFields({
                    type: "creditmemo",
                    id: recordId,
                    columns: columns
                });

                var isClosedPeriod = creditMemoSearch["accountingperiod.closed"];
                if (!isClosedPeriod) {
                    transaction.void({
                        type: transaction.Type.CREDIT_MEMO,
                        id: recordId
                    });
                } else {
                    log.error("Anulacion detenida", "La elimacion se ha detenido debido a que el peirodo de la transaccion esta cerrado.")
                }

            } catch (error) {
                log.error('LMRY_AnulacionInvoice_LBRY_V2 - [voidCreditMemoStandar]', error);
                libraryEmail.sendemail(' [ reversalJournal ] ' + error, LMRY_script);
            }

        }
        function unapplyAndApplyTransaction(transactionId, transactionType, relatedTransactionId) {
            var creditmemoRecord = record.load({ type: transactionType, id: transactionId });

            var count_invoice = creditmemoRecord.getLineCount({
                sublistId: 'apply'
            });

            creditmemoRecord.setValue({
                fieldId: 'custbody_lmry_pe_estado_sf',
                value: 'Cancelado',
            });

            for (i = 0; i < count_invoice; i++) {
                if (creditmemoRecord.getSublistValue('apply', 'apply', i)) {
                    creditmemoRecord.setSublistValue({
                        sublistId: 'apply',
                        fieldId: 'apply',
                        line: i,
                        value: false
                    });
                }
                if (relatedTransactionId) {
                    var transactionId = creditmemoRecord.getSublistValue("apply", "internalid", i);
                    if (transactionId == relatedTransactionId) {
                        creditmemoRecord.setSublistValue({
                            sublistId: "apply",
                            fieldId: "apply",
                            line: i,
                            value: true
                        })
                    }
                }
            }
            creditmemoRecord.save({
                ignoreMandatoryFields: true,
                enableSourcing: true,
            });
        }
        function getTransactionValues(transactionId, recordType) {
            var F_DEPARTMENTS = runtime.isFeatureInEffect({
                feature: "DEPARTMENTS"
            });
            var F_LOCATIONS = runtime.isFeatureInEffect({
                feature: "LOCATIONS"
            });
            var F_CLASSES = runtime.isFeatureInEffect({
                feature: "CLASSES"
            });

            var columns = ["fxamount", "subsidiary", "entity", "currency", "exchangerate"];

            if (F_DEPARTMENTS == "T" || F_DEPARTMENTS == true) {
                columns.push("department");
            }

            if (F_LOCATIONS == "T" || F_LOCATIONS == true) {
                columns.push("location");
            }

            if (F_CLASSES == "T" || F_CLASSES == true) {
                columns.push("class");
            }

            var paymentSearch = search.create({
                type: recordType,
                filters: [
                    ["mainline", "is", "T"], "AND",
                    ["internalid", "anyof", transactionId]
                ],
                columns: columns
            });
            var results = paymentSearch.run().getRange(0, 1);
            if (results && results.length) {
                return {
                    subsidiary: results[0].getValue("subsidiary"),
                    customer: results[0].getValue("entity"),
                    currency: results[0].getValue("currency"),
                    exchangerate: results[0].getValue("exchangerate") || "",
                    total: parseFloat(results[0].getValue("fxamount")) || 0.00,
                    department: results[0].getValue("department") || "",
                    class_: results[0].getValue("class") || "",
                    location: results[0].getValue("location") || ""
                };
            }

            return null;
        }

        function Remove_Trans(_recordId, recordType, void_feature) {
            if (recordType == 'customtransaction_lmry_payment_complemnt') {
                _rec = record.load({
                    type: recordType,
                    id: _recordId,
                    isDynamic: false
                });

                var count_invoice = _rec.getLineCount({
                    sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_cust'
                });
                for (var i = 0; i < count_invoice; i++) {
                    _rec.setSublistValue({
                        sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_cust',
                        fieldId: 'custrecord_lmry_factoring_apply_compensa',
                        line: i,
                        value: false
                    });
                    _rec.setSublistValue({
                        sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_cust',
                        fieldId: 'custrecord_lmry_factoring_apply_invoice',
                        line: i,
                        value: false
                    });
                }

                var count_bills = _rec.getLineCount({
                    sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_vend'
                });
                for (var i = 0; i < count_bills; i++) {
                    _rec.setSublistValue({
                        sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_vend',
                        fieldId: 'custrecord_lmry_factoring_apply_bill',
                        line: i,
                        value: false
                    });
                }
                _rec.setValue('custpage_amount_deposited', 0)
                _rec.setValue('custpage_vendor_subtotal', 0);
                _rec.setValue('custpage_vendor_total', 0);
                _rec.setValue('custpage_apply_total', 0);

                var count_accounts = _rec.getLineCount({
                    sublistId: 'line'
                });
                for (var i = 0; i < count_accounts; i++) {
                    _rec.setSublistValue('line', 'credit', i, 0);
                    _rec.setSublistValue('line', 'debit', i, 0);
                }
                _rec.save({
                    ignoreMandatoryFields: true,
                    enableSourcing: true
                });

            } else if (recordType == 'customerpayment') {
                var validJournal = true, journalId = "";
                if (void_feature == true || void_feature == 'T') {
                    var resultJournal = library_AnulacionInvoice.reversalJournal(_recordId);
                    log.debug('resultJournal', resultJournal);
                    validJournal = (resultJournal.fields.length == 0);
                    journalId = resultJournal.trans || "";
                }

                if (validJournal) {
                    var _rec = record.load({
                        type: "customerpayment",
                        id: _recordId
                    });

                    var count_invoice = _rec.getLineCount({
                        sublistId: 'apply'
                    });
                    for (i = 0; i < count_invoice; i++) {
                        if (_rec.getSublistValue('apply', 'apply', i)) {
                            _rec.setSublistValue({
                                sublistId: 'apply',
                                fieldId: 'apply',
                                line: i,
                                value: false
                            });
                        }
                        if (journalId) {
                            var transactionId = _rec.getSublistValue("apply", "internalid", i);
                            if (transactionId == journalId) {
                                _rec.setSublistValue({
                                    sublistId: "apply",
                                    fieldId: "apply",
                                    line: i,
                                    value: true
                                })
                            }
                        }
                    }
                    _rec.save({
                        ignoreMandatoryFields: true,
                        enableSourcing: true,
                    });
                }
            }
        }




        return {
            execute: execute
        };
    });


