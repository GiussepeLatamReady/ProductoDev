/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_second_Entity_LBR_Y2.0.js                              ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Oct 02 2023  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */
define(['N/record', 'N/log', 'N/search', 'N/runtime'],
    function (record, log, search, runtime) {

        /**
        * Funcion que permite crear el campo ficticio "LATAM - BR CLIENTE REMESSA" y setearlo
        * segun el valor del BR trasactions field de la propia transaccion.
        *
        * @param {recordTransaction} scriptContext.newRecord
        * @param {form} scriptContext.form - New record
        * @param {typeContext} scriptContext.type - Trigger type
        */

        function setSecondClient(recordTransaction, form, typeContext) {
            try {
                log.debug("Debug", "Entro a setSecondClient");
                log.debug("typeContext", typeContext);
                var oneWorldEdition = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                var transaction = {
                    id: recordTransaction.id,
                    createdFrom: recordTransaction.getValue({ fieldId: 'createdfrom' }) || null
                }
                var clientRemesa;


                if (oneWorldEdition == true || oneWorldEdition == 'T') {
                    log.debug("Debug", "Creando campo");
                    clientRemesa = form.addField({
                        id: 'custpage_lmry_br_cliente_remessa',
                        type: 'select',
                        label: 'Latam - BR Cliente Remessa'
                    });


                    clientRemesa.addSelectOption({
                        value: '',
                        text: '&nbsp;'
                    });
                    var customers = getCustmers();

                    var idsCustomer = Object.keys(customers);

                    idsCustomer.forEach(function (id) {
                        clientRemesa.addSelectOption({
                            value: customers[id].internalid,
                            text: customers[id].nameCustomer
                        });
                    })


                } else {

                    clientRemesa = form.addField({
                        id: 'custpage_lmry_br_cliente_remessa',
                        type: 'select',
                        label: 'Latam - BR Cliente Remessa',
                        source: 'customer'
                    });

                }

                var idTransaction;

                if (typeContext == "create" && transaction.createdFrom) {
                    idTransaction = transaction.createdFrom
                }
                if (typeContext == "edit" || typeContext == "view") {
                    idTransaction = transaction.id
                }
                var transactionfield = getTransactionField(idTransaction);
                log.debug("transactionfield before ", transactionfield)
                if (transactionfield && (transactionfield.secondClient != null && transactionfield.secondClient != "")) {
                    recordTransaction.setValue('custpage_lmry_br_cliente_remessa', transactionfield.secondClient);
                }

                log.debug("Debug", "Salio a setSecondClient");
            } catch (error) {
                log.error(" error [setSecondClient]", error)
            }



        }
        function getCustmers() {

            var subsidiaries = {};
            var customerSearch = search.create({
                type: "customer",
                filters:
                    [
                        ["msesubsidiary.country", "anyof", "BR"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "companyname", label: "Company Name" }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{isperson}",
                            label: "is Person"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{firstname}",
                            label: "Firstname"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{middlename}",
                            label: "middlename"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{lastname}",
                            label: "lastname"
                        })
                    ]
            });

            var pagedData = customerSearch.runPaged({
                pageSize: 1000
            });
            var page, columns;
            pagedData.pageRanges.forEach(function (pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    columns = result.columns;
                    var id = result.getValue(columns[0]);
                    var companyname = result.getValue(columns[1]);
                    var isperson = result.getValue(columns[2]);
                    var firstname = result.getValue(columns[3]);
                    var middlename = result.getValue(columns[4]);
                    var lastname = result.getValue(columns[5]);
                    var nameCustomer = isperson == 'F' ? companyname : firstname + " " + middlename + " " + lastname;

                    subsidiaries[id] = {
                        internalid: id,
                        nameCustomer: nameCustomer
                    }

                });
            })
            return subsidiaries;
        }

        function saveSecondClient(recordTransaction) {
            try {
                log.debug("debug", "saveSecondClient start");
                var transaction = {
                    id: recordTransaction.id,
                    createdFrom: recordTransaction.getValue({ fieldId: 'createdfrom' }) || null,
                    secondClient: recordTransaction.getValue({ fieldId: 'custpage_lmry_br_cliente_remessa' }) || null
                }


                var transactionField = getTransactionField(transaction.id);
                if (!transaction.secondClient && !transactionField) {
                    return false;
                }
                log.debug("transactionField", transactionField);
                initializeSecondClient(transactionField, transaction);
                log.debug("debug", "saveSecondClient end");
            } catch (error) {
                log.error("Error [setSecondClient] ", error);
            }
        }


        function getTransactionField(idTransaction) {
            var secondCustomerSearch = search.create({
                type: "customrecord_lmry_br_transaction_fields",
                filters:
                    [
                        ["custrecord_lmry_br_related_transaction", "anyof", idTransaction]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_lmry_br_cliente_remessa" }),
                        search.createColumn({ name: "internalid" })
                    ]
            });
            var secondCustomerResult = secondCustomerSearch.run().getRange(0, 1);
            if (secondCustomerResult.length > 0) {


                return {
                    id: secondCustomerResult[0].getValue("internalid"),
                    secondClient: secondCustomerResult[0].getValue("custrecord_lmry_br_cliente_remessa")
                };


            }
            log.debug("debug", "No tiene el campo completado o no existe el transaction field")
            return false;
        }

        function initializeSecondClient(updateTransactionField, transaction) {
            log.error("debug", "initializeSecondClient start")
            if (updateTransactionField) {

                //Actualiza el record
                var updateTransactionField = record.load({
                    type: "customrecord_lmry_br_transaction_fields",
                    id: updateTransactionField.id
                });

                updateTransactionField.setValue({
                    fieldId: 'custrecord_lmry_br_cliente_remessa',
                    value: transaction.secondClient,
                    ignoreFieldChange: true
                });

                updateTransactionField.save({
                    disableTriggers: true,
                    ignoreMandatoryFields: true
                });
            } else {
                log.debug("debug", "creando transation field")
                //Crea el record
                var newTransactionField = record.create({
                    type: 'customrecord_lmry_br_transaction_fields',
                    isDynamic: true
                });

                newTransactionField.setValue({
                    fieldId: 'custrecord_lmry_br_related_transaction',
                    value: transaction.id,
                    ignoreFieldChange: true
                });

                newTransactionField.setValue({
                    fieldId: 'custrecord_lmry_br_cliente_remessa',
                    value: transaction.secondClient,
                    ignoreFieldChange: true
                });

                newTransactionField.save({
                    disableTriggers: true,
                    ignoreMandatoryFields: true
                });
            }
            log.debug("debug", "initializeSecondClient end")
        }
        return {
            saveSecondClient: saveSecondClient,
            setSecondClient: setSecondClient
        };
    });
