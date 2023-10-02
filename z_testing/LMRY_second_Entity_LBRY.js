/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_CL_PDF_LBRY_V2.0.js                              ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Oct 11 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */
define(['N/record', 'N/log', 'N/search'],
    function (record, log, search) {

        function setSecondClient(recordTransaction) {
            var transaction = {
                id: recordTransaction.id,
                createdFrom: recordTransaction.getValue({ fieldId: 'createdfrom' }) || null,
                type: recordTransaction.type
            }
            var secondClient = getSecondClient();
            switch (transaction.type) {
                case "estimate":
                    initializeSecondClient(secondClient,transaction);
                    break;               
            }
        }


        function getSecondClient(idTransaction) {
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
                    id:secondCustomerResult[0].getValue("internalid"),
                    client:secondCustomerResult[0].getValue("custrecord_lmry_br_cliente_remessa")
                };
            }
            return false;
        }

        function initializeSecondClient(secondClient,transaction){

            if (secondClient) {

                //Actualiza el record
                var transactionField = record.load({
                    type: "customrecord_lmry_br_transaction_fields",
                    id: secondClient.id
                });
    
                transactionField.setValue({
                    fieldId: 'custrecord_lmry_br_cliente_remessa',
                    value: secondClient.client,
                    ignoreFieldChange: true
                });
    
                transactionField.save({
                    disableTriggers: true,
                    ignoreMandatoryFields: true
                });
            }else{
                //Crea el record
                var newTransactionField = record.create({
                    type: 'customrecord_lmry_br_transaction_fields',
                    isDynamic: false
                });

                newTransactionField.setValue({
                    fieldId: 'custrecord_lmry_br_related_transaction',
                    value: transaction.id,
                    ignoreFieldChange: true
                });

                newTransactionField.setValue({
                    fieldId: 'custrecord_lmry_br_cliente_remessa',
                    value: secondClient,
                    ignoreFieldChange: true
                });

                newTransactionField.save({
                    disableTriggers: true,
                    ignoreMandatoryFields: true
                });
            }
        }
        return {
            obtenerLibraryPDF: obtenerLibraryPDF
        };
    });
