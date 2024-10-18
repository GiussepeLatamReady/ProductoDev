/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @Name LMRY_InboundURET_V2.1.js
 */
define(["N/record", "N/search", "N/log",'./Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],

    function (record, search, log,library_mail) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */

        const LMRY_script = "LMRY_InboundURET_V2.1.js";
        function beforeLoad(scriptContext) {
            const currentRecord = scriptContext.newRecord;
            try {
                log.error("beforeLoad","start")
                const Form = scriptContext.form;

                const fieldPedimento = Form.addField({
                    id: "custpage_pedimento",
                    label: "MX Pedimento",
                    type: "text",
                });
                const fieldAduana = Form.addField({
                    id: "custpage_aduana",
                    label: "MX Aduana",
                    type: "select",
                });
                const aduanaSearch = search.create({
                    type: 'customrecord_lmry_mx_aduana',
                    columns: ['internalid', 'name'],
                    filters: [['isinactive', 'is', 'F']]
                });
                aduanaSearch.run().getRange.promise(0, 1000)
                    .then((aduanas) => {
                        aduanas.forEach(aduana => {
                            fieldAduana.addSelectOption({
                                value: aduana.getValue("internalid"),
                                text: aduana.getValue("name"),
                            });
                        });
                        if (Number(currentRecord.id)) {
                            const inboundPedimentoRecords = search.create({
                                type: "customrecord_mx_pedimento_inbound",
                                filters: ["custrecord_mx_pedimento_inbound_id", "is", currentRecord.id],
                                columns: ["internalid", "custrecord_nro_pedimento_inbound", "custrecord_lmry_mx_aduana_inbound"],
                            }).run().getRange(0, 1);

                            if (inboundPedimentoRecords.length > 0) {

                                if (inboundPedimentoRecords[0]?.getValue("custrecord_nro_pedimento_inbound") != "")
                                    fieldPedimento.defaultValue = inboundPedimentoRecords[0].getValue("custrecord_nro_pedimento_inbound");

                                if (Number(inboundPedimentoRecords[0]?.getValue("custrecord_lmry_mx_aduana_inbound")))
                                    fieldAduana.defaultValue = inboundPedimentoRecords[0].getValue("custrecord_lmry_mx_aduana_inbound");
                            }

                        }
                    });



                // fieldPedimento.defaultValue = "-";
                Form.clientScriptModulePath = './LMRY_InboundClient_V2.1.js';
            } catch (error) {
                log.error("error",error)
                library_mail.sendemail2(' [ afterSubmit ] ' + error, LMRY_script, currentRecord, 'tranid', 'entity');
            }

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {
            const currentRecord = scriptContext.newRecord;
            try {
                const nLines = currentRecord.getLineCount({
                    sublistId: "items"
                });
                const arregloPurchaseOrders = [];
                for (let index = 0; index < nLines; index++) {
                    const idPO = currentRecord.getSublistValue({
                        sublistId: "items",
                        fieldId: "purchaseorder",
                        line: index
                    });

                    if (!arregloPurchaseOrders.includes(idPO))
                        arregloPurchaseOrders.push(idPO);
                };
                createInboundPedimentoRecord({ idRecord: currentRecord.id, nroPedimento: currentRecord.getValue("custpage_pedimento"), idAduana: currentRecord.getValue("custpage_aduana"), pos: arregloPurchaseOrders });
            } catch (error) {
                library_mail.sendemail2(' [ afterSubmit ] ' + error, LMRY_script, currentRecord, 'tranid', 'entity');
            }

        }
        /**
         * 
         * @param {Object} InboundPedimentoRecord 
         * @param {number} InboundPedimentoRecord.idRecord
         * @param {number} InboundPedimentoRecord.nroPedimento
         * @param {number} InboundPedimentoRecord.idAduana
         * @param {Array<number>} InboundPedimentoRecord.pos
         */
        function createInboundPedimentoRecord(InboundPedimentoRecord) {
            log.debug("datos", JSON.stringify(InboundPedimentoRecord));
            if (validateInboundPedimentoRecord(InboundPedimentoRecord.idRecord)) {
                updateInboundPedimentoRecord(InboundPedimentoRecord);

            } else {
                const inboundPedimentoRecord = record.create({
                    type: "customrecord_mx_pedimento_inbound",
                    isDynamic: false,
                });

                inboundPedimentoRecord.setValue({ fieldId: "custrecord_mx_pedimento_inbound_id", value: InboundPedimentoRecord.idRecord });
                inboundPedimentoRecord.setValue({ fieldId: "custrecord_nro_pedimento_inbound", value: InboundPedimentoRecord.nroPedimento });
                inboundPedimentoRecord.setValue({ fieldId: "custrecord_lmry_mx_aduana_inbound", value: InboundPedimentoRecord.idAduana });
                inboundPedimentoRecord.setValue({ fieldId: "custrecord_lmry_mx_purchase_order", value: InboundPedimentoRecord.pos.join("|") });

                inboundPedimentoRecord.save();
            }

        }
        /**
         * 
         * @param {Object} InboundPedimentoRecord 
         * @param {number} InboundPedimentoRecord.idRecord
         * @param {number} InboundPedimentoRecord.nroPedimento
         * @param {number} InboundPedimentoRecord.idAduana
         * @param {Array<number>} InboundPedimentoRecord.pos
         */
        function updateInboundPedimentoRecord(InboundPedimentoRecord) {
            const inboundPedimentoRecord = record.load({
                type: "customrecord_mx_pedimento_inbound",
                id: InboundPedimentoRecord.idRecord,
                isDynamic: false,
            });

            inboundPedimentoRecord.setValue({ fieldId: "custrecord_mx_pedimento_inbound_id", value: InboundPedimentoRecord.idRecord });
            inboundPedimentoRecord.setValue({ fieldId: "custrecord_nro_pedimento_inbound", value: InboundPedimentoRecord.nroPedimento });
            inboundPedimentoRecord.setValue({ fieldId: "custrecord_lmry_mx_aduana_inbound", value: InboundPedimentoRecord.idAduana });
            inboundPedimentoRecord.setValue({ fieldId: "custrecord_lmry_mx_purchase_order", value: InboundPedimentoRecord.pos.join("|") });

            inboundPedimentoRecord.save();
        };
        /**
         * Funcion de busqueda de record inbound 
         * @param {number} inboundId 
         * @returns exist o not exist inbound record
         */
        function validateInboundPedimentoRecord(inboundId) {
            if (!Number(inboundId)) return false;

            const inboundPedimentoRecords = search.create({
                type: "customrecord_mx_pedimento_inbound",
                filters: ["custrecord_mx_pedimento_inbound_id", "is", inboundId],
                columns: ["internalid"],
            }).run().getRange(0, 1);

            if (inboundPedimentoRecords.length === 0) return false;

            return true;
        }
        return {
            beforeLoad: beforeLoad,
            // beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });
