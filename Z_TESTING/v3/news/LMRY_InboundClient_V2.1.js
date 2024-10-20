/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @Name LMRY_InboundClient_V2.1.js
 */
define(["require", "N/search", "N/http", "N/url", "N/record", "N/query",'./Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],

    function (require, search, http, url, record, query,library_mail) {
        /**
               * Script Cliente, de la transaccion Inbound
               * @exports InboundClient
               */
        let ClientModule;
        ClientModule = {
            pageInit(scriptContext) {
                const currentRecord = scriptContext.currentRecord;
                try {
                    search.create({
                        type: "customrecord_mx_pedimento_inbound",
                        filters: ["custrecord_mx_pedimento_inbound_id", "is", currentRecord.id]
                    });
                    console.log("holi clnt")
                } catch (error) {
                    console.error("error asda",error)
                    library_mail.sendemail2(' [ pageInit ] ' + error, "LMRY_InboundClient_V2.1.js", currentRecord, 'tranid', 'entity');
                }

            },
            /**
             * Validation function to be executed when record is saved.
             *
             * @param {Object} scriptContext
             * @param {Record} scriptContext.currentRecord - Current form record
             * @returns {boolean} Return true if record is valid
             *
             * @since 2015.2
             */
            saveRecord(scriptContext) {
                const currentRecord = scriptContext.currentRecord;
                const numberPedimento = currentRecord.getValue("custpage_pedimento");
                const idAduana = currentRecord.getValue("custpage_aduana");
                const arregloPurchaseOrders = [];
                try {

                    const nLines = currentRecord.getLineCount({
                        sublistId: "items"
                    });
                    for (let index = 0; index < nLines; index++) {
                        const idPO = currentRecord.getSublistValue({
                            sublistId: "items",
                            fieldId: "purchaseorder",
                            line: index
                        });

                        if (!arregloPurchaseOrders.includes(idPO))
                            arregloPurchaseOrders.push(idPO);
                    };
                    if (arregloPurchaseOrders.length === 0) {
                        alert("Debe ingresar al menos un purchase order");
                        throw "Debe ingresar al menos un purchase order";
                    };
                    const paises = query.runSuiteQL({
                        query: `
                     SELECT DISTINCT
                         Country.id
                     FROM
                         transaction,
                         Country
                     WHERE
                         transaction.id = any(${arregloPurchaseOrders.join(",")})
                     and
                         transaction.custbody_lmry_subsidiary_country = Country.uniquekey
                     `

                    }).asMappedResults();
                    if (paises.length != 1 || paises[0]?.id !== "MX") {
                        return confirm("Tienes transacciones que no son de Mexico no se populara el pedimento");
                    }
                    if (!validateLinesxPedimento(numberPedimento)) {
                        alert("Numero de pedimento invalido");
                        return false;
                    }
                    const [idsPurchaseOrderWhithinMxTransaction, idMxTransactionExist] = getMxTransactionsNull(arregloPurchaseOrders);
                    console.log([idsPurchaseOrderWhithinMxTransaction, idMxTransactionExist]);

                    const idMxTransactionCreate = createMXTransaction(getTransactionsData(idsPurchaseOrderWhithinMxTransaction), numberPedimento, idAduana);
                    updateMxTransaction(idMxTransactionExist, numberPedimento, idAduana);
                    console.log([idMxTransactionCreate, idMxTransactionExist]);
                    console.log("termino");

                    return true;
                } catch (error) {
                    library_mail.sendemail2(' [ saveRecord ] ' + error, "LMRY_InboundClient_V2.1.js", currentRecord, 'tranid', 'entity');
                    return false;
                }

            }
        };

        function validateLinesxPedimento(numberPedimento) {
            const patron = new RegExp("([0-9]){2}[ ]([0-9]){2}[ ]([0-9]){4}[ ]([0-9]){7}");
            if (patron.test(numberPedimento) && numberPedimento.length === 18) return true;
            return false;
        }

        function createMXTransaction(listaDatosTransacciones, nroPedimento, idAduana) {
            const idsMxTransactionCreadas = [];
            listaDatosTransacciones.forEach(transaction => {
                console.log(transaction, nroPedimento);
                const mxTransaction = record.create({
                    type: "customrecord_lmry_mx_transaction_fields",
                    isDynamic: true
                });
                mxTransaction.setValue({ fieldId: "custrecord_lmry_mx_transaction_related", value: transaction.id });
                mxTransaction.setValue({ fieldId: "custrecord_lmry_mx_entity_related", value: transaction.entity });
                mxTransaction.setValue({ fieldId: "custrecord_lmry_mx_currency", value: transaction.currency });
                mxTransaction.setValue({ fieldId: "custrecord_lmry_mx_exchange_rate", value: transaction.exchangerate });
                mxTransaction.setValue({ fieldId: "custrecord_lmry_mx_pedimento", value: nroPedimento });
                if (Number(idAduana) !== 0) mxTransaction.setValue({ fieldId: "custrecord_lmry_mx_pedimento_aduana", value: idAduana });
                idsMxTransactionCreadas.push(mxTransaction.save());
            });
            return idsMxTransactionCreadas;
        }
        /**
         * Funcion de busqueda de MX transaction
         * @param {Array<number>} listaIdsPurchaseOrder 
         * @returns Arreglo Ids De Purchase Orders sin Mx transaction
         */
        function getMxTransactionsNull(listaIdsPurchaseOrder) {

            if (typeof listaIdsPurchaseOrder != "object") return [[], []];
            if (listaIdsPurchaseOrder.length === 0) return [[], []];
            listaIdsPurchaseOrder = listaIdsPurchaseOrder.map((e) => Number(e));
            const MxTransactionsIds = [];

            const MxTransactions = query.runSuiteQL({
                query: `
             SELECT
                 CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.id,
                 CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_transaction_related
             FROM
                 CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS
             WHERE
                 CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_transaction_related = any(${listaIdsPurchaseOrder})
             `,

            }).asMappedResults();

            MxTransactions.forEach(transaction => {

                const index = listaIdsPurchaseOrder.indexOf(Number(transaction.custrecord_lmry_mx_transaction_related));
                MxTransactionsIds.push(transaction.id);
                if (index != -1) listaIdsPurchaseOrder.splice(index, 1);
            });
            return [listaIdsPurchaseOrder, MxTransactionsIds];

        }

        function getTransactionsData(listaIdsPurchaseOrder) {
            if (listaIdsPurchaseOrder.length === 0) return [];
            const dataTransactions = query.runSuiteQL({
                query: `
             SELECT
                 transaction.id,
                 transaction.currency,
                 transaction.exchangeRate,
                 transaction.entity
             FROM
                 transaction
             WHERE
                 transaction.id = any(${listaIdsPurchaseOrder})
             `,

            }).asMappedResults();
            return dataTransactions;
        }

        function updateMxTransaction(listaMxTransactions, nroPedimento, idAduana) {
            listaMxTransactions.forEach((idTransaction) => {
                const values = {
                    custrecord_lmry_mx_pedimento: nroPedimento
                };
                if (Number(idAduana) !== 0) values["custrecord_lmry_mx_pedimento_aduana"] = idAduana;

                record.submitFields.promise({
                    type: "customrecord_lmry_mx_transaction_fields",
                    id: idTransaction,
                    values: values


                }).then(function (response) {
                    // DO SOMETHING WITH RESPONSE HERE
                }, function (error) {
                    // DO SOMETHING WITH ERROR HERE
                });
            });

        }
        return ClientModule;
    });
