/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @Name LMRY_InboundURET_V2.1.js
 */
define(["N/record", "N/search", "N/log", "N/runtime", 'N/ui/serverWidget', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],

    function (record, search, log, runtime, serverWidget, library_mail) {

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
            const { newRecord: currentRecord, form: Form } = scriptContext;
            try {
                const translations = getTranslations();
                const isActivePedimentos = isAutomaticPedimentos(getLocalizedSubsidiaries());
                
                if (isActivePedimentos) {
                    Form.addFieldGroup({ id: 'mainGroupPedimentos', label: translations.LMRY_PEDIMENTOS });
                    const fieldPedimento = Form.addField({ id: "custpage_pedimento", label: "Latam - MX N° Pedimento", type: "text", container: "mainGroupPedimentos" });
                    const fieldAduana = Form.addField({ id: "custpage_aduana", label: translations.LMRY_CUSTOMS, type: "select", container: "mainGroupPedimentos" });
                    
                    search.create({ type: 'customrecord_lmry_mx_aduana', columns: ['internalid', 'name'], filters: [['isinactive', 'is', 'F']] })
                        .run().getRange.promise(0, 1000).then(aduanas => {
                            aduanas.forEach(aduana => fieldAduana.addSelectOption({ value: aduana.getValue("internalid"), text: aduana.getValue("name") }));
                            
                            if (Number(currentRecord.id)) {
                                const pedimentoRecord = search.create({
                                    type: "customrecord_mx_pedimento_inbound",
                                    filters: ["custrecord_mx_pedimento_inbound_id", "is", currentRecord.id],
                                    columns: ["internalid", "custrecord_nro_pedimento_inbound", "custrecord_lmry_mx_aduana_inbound"]
                                }).run().getRange(0, 1)[0];
                                
                                if (pedimentoRecord) {
                                    fieldPedimento.defaultValue = pedimentoRecord.getValue("custrecord_nro_pedimento_inbound") || "";
                                    fieldAduana.defaultValue = pedimentoRecord.getValue("custrecord_lmry_mx_aduana_inbound") || "";
                                }
                            }
                        });
                    
                    Form.clientScriptModulePath = './LMRY_InboundClient_V2.1.js';
                }
            } catch (error) {
                log.error("error", error);
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
                const isActivePedimentos = isAutomaticPedimentos(getLocalizedSubsidiaries());

                if (isActivePedimentos) {
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
                }


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

        function getTranslations() {
            var language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
            language = ["es", "pt"].indexOf(language) != -1 ? language : "en";


            var translatedFields = {
                "es": {
                    "LMRY_PEDIMENTOS": "Registro de Pedimentos",
                    "LMRY_CUSTOMS": "Latam - MX Aduana",
                },
                "en": {
                    "LMRY_PEDIMENTOS": "Register of pedimentos",
                    "LMRY_CUSTOMS": "Latam - MX Aduana",
                },
                "pt": {
                    "LMRY_PEDIMENTOS": "Registro de pedimentos",
                    "LMRY_CUSTOMS": "Latam - MX Alfândega",
                }
            }

            return translatedFields[language];
        }


        function getLocalizedSubsidiaries() {
            const localizedSubsidiaries = [];
            search.create({
                type: 'customrecord_lmry_features_by_subsi',
                columns: [
                    'internalid',
                    'custrecord_lmry_features_subsidiary'
                ],
                filters: [
                    ['isinactive', 'is', 'F'],
                    "AND",
                    ['custrecord_lmry_features_subsidiary.country', 'is', "MX"],
                    "AND",
                    ['custrecord_lmry_features_subsidiary.isinactive', 'is', "F"]
                ]
            }).run().each(result => {
                const idSubsidiary = result.getValue('custrecord_lmry_features_subsidiary');
                localizedSubsidiaries.push(idSubsidiary);
                return true;
            });
            return localizedSubsidiaries;
        }

        function isAutomaticPedimentos(localizedSubsidiaries) {
            var featPedimentos = false;
            var featureSubs = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            if (featureSubs == true || featureSubs == 'T') {
                if (localizedSubsidiaries.length) {
                    search.create({
                        type: 'customrecord_lmry_setup_tax_subsidiary',
                        columns: ['custrecord_lmry_setuptax_pediment_automa'],
                        filters: [
                            ['custrecord_lmry_setuptax_subsidiary', 'anyof', localizedSubsidiaries],
                            "AND",
                            ["isinactive","is","F"]
                        ]
                    }).run().each(result => {
                        featPedimentos = result.getValue('custrecord_lmry_setuptax_pediment_automa');
                        featPedimentos = featPedimentos === "T" || featPedimentos === true;
                        return true;
                    });
                }
            }
            return featPedimentos;
        }
        return {
            beforeLoad: beforeLoad,
            // beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });
