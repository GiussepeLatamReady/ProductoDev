/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @Name LMRY_InboundClient_V2.1.js
 */
define(["require", "N/search", "N/log", "N/runtime", "N/http", "N/url", "N/record","N/format", "N/query",'./Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],

    function (require, search, log, runtime,  http, url, record,format, query,library_mail) {
        /**
               * Script Cliente, de la transaccion Inbound
               * @exports InboundClient
               */
        let ClientModule;
        ClientModule = {
            pageInit(scriptContext) {
            
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
                const pedimentoDate = currentRecord.getValue("custpage_pedimento_date");
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

                    const {roleCenter}= runtime.getCurrentUser();

                    if (roleCenter != "PARTNERCENTER" && roleCenter != "BASIC" ) {
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
                    }
                    
                    if (!validateLinesxPedimento(numberPedimento)) {
                        alert("Numero de pedimento invalido");
                        return false;
                    }
                    const [idsPurchaseOrderWhithinMxTransaction, idMxTransactionExist] = getMxTransactionsNull(arregloPurchaseOrders);

                    const idMxTransactionCreate = createMXTransaction(getTransactionsData(idsPurchaseOrderWhithinMxTransaction), numberPedimento, idAduana, pedimentoDate);
                    updateMxTransaction(idMxTransactionExist, numberPedimento, idAduana, pedimentoDate);

                    return true;
                } catch (error) {
                    console.log("  saverecord error",error)
                    log.error("saverecord error",error)
                    const {roleCenter}= runtime.getCurrentUser();
                    if (roleCenter != "PARTNERCENTER") {
                        library_mail.sendemail2(' [ saveRecord ] ' + error, "LMRY_InboundClient_V2.1.js", currentRecord, 'tranid', 'entity');
                    }
                    
                    
                    return false;
                }

            }
        };

        function validateLinesxPedimento(numberPedimento) {
            const patron = new RegExp("([0-9]){2}[ ]([0-9]){2}[ ]([0-9]){4}[ ]([0-9]){7}");
            if (patron.test(numberPedimento) && numberPedimento.length === 18) return true;
            return false;
        }

        function createMXTransaction(listaDatosTransacciones, nroPedimento, idAduana,pedimentoDate) {
            const idsMxTransactionCreadas = [];
            listaDatosTransacciones.forEach(transaction => {
                const mxTransaction = record.create({
                    type: "customrecord_lmry_mx_transaction_fields",
                    isDynamic: true
                });
                mxTransaction.setValue({ fieldId: "custrecord_lmry_mx_transaction_related", value: transaction.id });
                mxTransaction.setValue({ fieldId: "custrecord_lmry_mx_entity_related", value: transaction.entity });
                mxTransaction.setValue({ fieldId: "custrecord_lmry_mx_currency", value: transaction.currency });
                mxTransaction.setValue({ fieldId: "custrecord_lmry_mx_exchange_rate", value: transaction.exchangerate });
                mxTransaction.setValue({ fieldId: "custrecord_lmry_mx_pedimento", value: nroPedimento });
                mxTransaction.setValue({ fieldId: "custrecord_lmry_mx_tf_pedimento_date", value: pedimentoDate });
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

        function updateMxTransaction(listaMxTransactions, nroPedimento, idAduana,pedimentoDate) {
            listaMxTransactions.forEach((idTransaction) => {
                pedimentoDate = format.parse({ value: pedimentoDate, type: format.Type.DATE });
                const values = {
                    custrecord_lmry_mx_pedimento: nroPedimento,
                    custrecord_lmry_mx_tf_pedimento_date: pedimentoDate
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
