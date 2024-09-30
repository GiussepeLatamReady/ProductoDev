/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @Name LMRY_Automatic_Set_Fields_URET_V2.1.js
 * @Author rene@latamready.com
 * @NModuleScope Public
 */
define(['N/error', 'N/record', 'N/log', 'N/runtime', 'N/search', 'N/ui/serverWidget', "./Latam_Library/LMRY_libSendingEmailsLBRY_V2.0", "./Latam_Library/LMRY_Log_LBRY_V2.0"],
    /**
     * @param{error} error
     * @param{log} log
     * @param{runtime} runtime
     * @param{search} search
     * @param{serverWidget} serverWidget
     */
    (error, record, log, runtime, search, serverWidget, Library_Mail, Library_Log) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */

        const ScriptName = "LatamReady - Automatic Set Field URET v2.1";
        //const {FeatureManager} = Library_Licenses;
        let licenses = [];
        let FEAT_SUBSIDIARY = false;
        let FEAT_MULTISUBCUSTOMER = false;
        let language = '';

        const countryDocuments = [11, 29, 30, 91, 157, 173, 174, 186, 231];
        const transactionFieldById = {
            5: 'custrecord_lmry_setup_us_cashsale',
            7: 'custrecord_lmry_setup_us_invoice',
            9: 'custrecord_lmry_setup_us_payment',
            10: 'custrecord_lmry_setup_us_credit',
            16: 'custrecord_lmry_setup_us_recepit',
            17: 'custrecord_lmry_setup_us_vendorbill',
            18: 'custrecord_lmry_setup_us_bill_payment',
            20: 'custrecord_lmry_setup_us_vendorcredit',
            32: 'custrecord_lmry_setup_us_fulfillment'
        }
        let complementoPagoId = "";

        const beforeLoad = (scriptContext) => {
            try {
                const actionType = scriptContext.type;
                let form = scriptContext.form;
                let recordObj = scriptContext.newRecord;

                // 2023.07.31 : Ampliacion para el soporte de WebService
                if (!["CSVIMPORT", "WEBSERVICES"].includes(runtime.executionContext) && ["create", "edit", "copy", "view"].includes(actionType)) {
                    form.removeButton("resetter");
                    FEAT_SUBSIDIARY = runtime.isFeatureInEffect({
                        feature: 'SUBSIDIARIES'
                    });

                    //Se oculta el campo del setup tax siempre
                    form.getField('custrecord_lmry_us_setuptax').updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });

                    //Si viene de subsidiaria, ocultar campos de entidad (Entidad y el Entity Type)
                    let setupTaxsubsid = recordObj.getValue('custrecord_lmry_us_setuptax');

                    if (setupTaxsubsid) {
                        form.getField('custrecord_lmry_us_entity').updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                        form.getField('custrecord_lmry_us_entity_type').updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                    }


                    if (actionType == "create" || actionType == "edit" || actionType == "copy") {
                        let entity = recordObj.getValue("custrecord_lmry_us_entity");
                        let setupTax = recordObj.getValue("custrecord_lmry_us_setuptax");

                        if (entity) {
                            if (actionType === "create") {
                                if (FEAT_SUBSIDIARY === "T" || FEAT_SUBSIDIARY) {
                                    //crear campo custpage de subsidiaria
                                    let select_subsidiary = form.addField({
                                        id: 'custpage_subsidiary',
                                        type: serverWidget.FieldType.SELECT,
                                        label: 'LATAM - SUBSIDIARY (SET)'
                                    });

                                    //Ocultar el campo de la subsidiaria real
                                    form.getField('custrecord_lmry_us_subsidiary').updateDisplayType({
                                        displayType: serverWidget.FieldDisplayType.HIDDEN
                                    });

                                    form.insertField({
                                        field: select_subsidiary,
                                        nextfield: 'custrecord_lmry_us_country'
                                    });

                                    //Llenar con las subsidiarias de la entidad(customer, vendor)
                                    fillSubsidiaries(select_subsidiary, recordObj);

                                    let subsidiary = recordObj.getValue("custrecord_lmry_us_subsidiary");
                                    select_subsidiary.defaultValue = subsidiary;
                                }


                                //Crear campo custpage de transacciones
                                let select_transaction = form.addField({
                                    id: 'custpage_transaction',
                                    type: serverWidget.FieldType.SELECT,
                                    label: 'LATAM - TRANSACTION (SET)'
                                });

                                form.insertField({
                                    field: select_transaction,
                                    nextfield: 'custrecord_lmry_us_transaction'
                                });
                                let country = recordObj.getValue({ fieldId: "custrecord_lmry_us_country" });
                                fillTransactions(select_transaction, recordObj, country);

                                //ocultar el campo real de las transacciones
                                form.getField('custrecord_lmry_us_transaction').updateDisplayType({
                                    displayType: serverWidget.FieldDisplayType.HIDDEN
                                });

                            }
                            //Crear campo custpage de Shipping Reason
                            let select_shipping_reason = form.addField({
                                id: 'custpage_shipping_reason',
                                type: serverWidget.FieldType.SELECT,
                                label: 'LATAM - SHIPPING REASON(SET)'
                            });
                            form.insertField({
                                field: select_shipping_reason,
                                nextfield: 'custrecord_lmry_shipping_reason'
                            });
                        } else if (setupTax) {
                            if (actionType === "create") {
                                //Setear el campo subsidiary con al subsidiaria del setup tax subsidiary de donde viene
                                let setupTax = recordObj.getValue("custrecord_lmry_us_setuptax");

                                let searchSetupTax = search.lookupFields({
                                    type: 'customrecord_lmry_setup_tax_subsidiary',
                                    id: setupTax,
                                    columns: ['custrecord_lmry_setuptax_subsidiary', 'custrecord_lmry_setuptax_sub_country']
                                });
                                //Subsidiaria Setup Tax
                                let stSubsidiaria = searchSetupTax.custrecord_lmry_setuptax_subsidiary[0].value;

                                //Country Setup Tax
                                let stCountry = searchSetupTax.custrecord_lmry_setuptax_sub_country[0].value;

                                recordObj.setValue('custrecord_lmry_us_subsidiary', stSubsidiaria);

                                form.getField('custrecord_lmry_us_subsidiary').updateDisplayType({
                                    displayType: serverWidget.FieldDisplayType.DISABLED
                                });

                                //crear el campo custpage para transacciones y llenar con todas las transacciones de ese pais
                                let transactionField = form.addField({
                                    id: 'custpage_transaction',
                                    type: serverWidget.FieldType.SELECT,
                                    label: 'LATAM - TRANSACTION (SET)'
                                });
                                form.insertField({
                                    field: transactionField,
                                    nextfield: 'custrecord_lmry_us_transaction'
                                });

                                fillTransactions(transactionField, recordObj, stCountry);

                                //ocultar el campo real de transaccion.
                                form.getField('custrecord_lmry_us_transaction').updateDisplayType({
                                    displayType: serverWidget.FieldDisplayType.HIDDEN
                                });
                            }

                        } else {
                            //Deshabilitar campos de la subsidiaria,transacciones
                            form.getField('custrecord_lmry_us_subsidiary').updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.DISABLED
                            });
                            form.getField('custrecord_lmry_us_transaction').updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.DISABLED
                            });

                        }

                        if (actionType == "edit" || actionType === "copy") {

                            if (entity) {
                                form.getField('custrecord_lmry_us_entity').updateDisplayType({
                                    displayType: serverWidget.FieldDisplayType.DISABLED
                                });
                            }
                            //Deshabilitar el campo subsidiary
                            form.getField('custrecord_lmry_us_subsidiary').updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.DISABLED
                            });

                            //Deshabilitar el campo transaccion
                            form.getField('custrecord_lmry_us_transaction').updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.DISABLED
                            });

                        }
                        //Oculta campos con country vacio y mostrar campos del pais y transaccion.
                        //hideAndViewFields(recordObj, form);
                    } else if (actionType === "view") {
                        hideAndViewFields(recordObj, form);
                    }
                }


            } catch (err) {
                log.error("[beforeLoad]", err);
                Library_Mail.sendemail("[beforeLoad]", err, ScriptName);
                Library_Log.doLog({ title: "[beforeLoad]", message: err });
            }

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            //Record Actual
            let recordObj = scriptContext.newRecord;
            let eventType = scriptContext.type;
            // LatamReady - Automatic Set MX C0665
            if (["create", "edit", "copy"].includes(eventType)) {
                if (runtime.executionContext === "CSVIMPORT") {
                    let subsidiaryID = recordObj.getValue('custrecord_lmry_us_subsidiary');
                    let licenses = Library_Mail.getLicenses(subsidiaryID);
                    checkFeatureAutomaticSetGen(recordObj, licenses);
                }

                try {
                    if (runtime.executionContext == 'CSVIMPORT') {
                        setArDateFields(recordObj);
                    }
                    setDataJson(recordObj);

                } catch (err) {
                    log.error('[beforeSubmit]', err);
                    Library_Mail.sendemail("[beforeSubmit]", err, ScriptName);
                    Library_Log.doLog({ title: "[beforeSubmit]", message: err });
                }
            }
        }

        //Oculta campos con country vacio y mostrar campos del pais y transaccion.
        const hideAndViewFields = (recordObj, form) => {

            let jsonResult = getfieldsHideAndView(recordObj);
            let hideFields = jsonResult.hideFields;
            let viewFields = jsonResult.viewFields;
            viewFields = viewFields.filter((v) => !v.isRecordKey);

            let setupTax = getSetupTax(recordObj);

            hideFields.forEach((fieldName) => {
                if (!viewFields.find((v) => v.name === fieldName) && !validateARfields(recordObj, fieldName, setupTax)) {
                    let fieldObj = form.getField(fieldName);
                    if (fieldObj) {
                        fieldObj.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        })
                    }

                }
            });
        }

        const getSetupTax = (recordObj) => {
            let entity = recordObj.getValue({ fieldId: "custrecord_lmry_us_entity" });
            let subsidiary = recordObj.getValue({ fieldId: "custpage_subsidiary" });
            let setupTax = recordObj.getValue({ fieldId: "custrecord_lmry_us_setuptax" });
            //filtros
            if ((entity && subsidiary) || setupTax) {
                let filters = [
                    ["isinactive", "is", "F"]
                ];

                if (entity) {
                    if (FEAT_SUBSIDIARY) {
                        filters.push("AND", ["custrecord_lmry_setuptax_subsidiary", "anyof", subsidiary]);
                    }

                } else if (setupTax) {
                    filters.push("AND", ["internalid", "anyof", setupTax]);
                }

                //Busqueda Setup Tax Subsidiary
                let setupTaxSearch = search.create({
                    type: "customrecord_lmry_setup_tax_subsidiary",
                    filters: filters,
                    columns: ["custrecord_lmry_setuptax_ar_doc_type_val"]
                })
                let result = setupTaxSearch.run().getRange(0, 1)
                if (result && result.length) {
                    return {
                        "arDocumentType": result[0].getValue("custrecord_lmry_setuptax_ar_doc_type_val") || ""
                    }
                }
            }

            return null;
        }

        const validateARfields = (recordObj, fieldName, setupTax) => {
            let document = recordObj.getValue("custrecord_lmry_document_type");
            let country = recordObj.getValue("custrecord_lmry_us_country");
            return (country == 11 && ['custrecord_lmry_document_type_validate', 'custrecord_lmry_serie_doc_cxc_validate'].includes(fieldName) && setupTax && setupTax.arDocumentType == document);
        }

        const fillSubsidiaries = (subsidiaryField, recordObj) => {
            subsidiaryField.addSelectOption({
                value: "",
                text: "&nbsp"
            });

            let entity = recordObj.getValue({ fieldId: "custrecord_lmry_us_entity" });
            let entityType = recordObj.getValue({ fieldId: "custrecord_lmry_us_entity_type" });

            FEAT_MULTISUBCUSTOMER = runtime.isFeatureInEffect({
                feature: "multisubsidiarycustomer"
            });

            //Customer
            if (entityType == 2 && (FEAT_MULTISUBCUSTOMER === "F" || !FEAT_MULTISUBCUSTOMER)) {
                let entityResult = search.lookupFields({
                    type: "entity",
                    id: entity,
                    columns: ["subsidiary"]
                });

                subsidiaryField.addSelectOption({
                    value: entityResult.subsidiary[0].value,
                    text: entityResult.subsidiary[0].text
                });

            } else {
                let searchType = "vendorsubsidiaryrelationship";
                if (entityType == 2) {
                    searchType = "customersubsidiaryrelationship";
                }

                let subsidiarySearch = search.create({
                    type: searchType,
                    filters: [
                        //["isinactive", "is", "F"], "AND",
                        ["entity", "anyof", entity]
                    ],
                    columns: ["subsidiary"]
                });

                let results = subsidiarySearch.run().getRange(0, 1000);
                for (let i = 0; i < results.length; i++) {
                    let id = results[i].getValue("subsidiary");
                    let name = results[i].getText("subsidiary");

                    subsidiaryField.addSelectOption({ value: id, text: name });
                }
            }

        }

        const fillTransactions = (transactionField, recordObj, country) => {
            transactionField.addSelectOption({
                value: "",
                text: "&nbsp"
            })
            //Variable si viene del Setup Tax
            let setupTax = recordObj.getValue("custrecord_lmry_us_setuptax");
            //Tipo de entidad (1: vendor, 2: customer)
            let entityTypeID = recordObj.getValue('custrecord_lmry_us_entity_type');
            //Objeto de transacciones por país y tipo de entidad
            const jsonTransactionByCountry = {
                //Argentina
                "11": {
                    "1": [],
                    "2": ["invoice", "creditmemo", "itemfulfillment"]
                },
                //Bolivia
                "29": {
                    "1": [],
                    "2": ["invoice", "creditmemo"]
                },
                //brazil
                "30": {
                    "1": ["vendorbill", "vendorcredit", "itemreceipt", "itemfulfillment"],
                    "2": ["invoice", "creditmemo", "itemfulfillment", "itemreceipt"]
                },
                //Chile
                "45": {
                    "1": ["vendorbill", "vendorcredit"],
                    "2": ["invoice", "creditmemo", "itemfulfillment"] //7, 10
                },
                //Colombia
                "48": {
                    "1": [],
                    "2": ["invoice", "creditmemo"]
                },
                //Costa Rica
                "49": {
                    "1": [],
                    "2": ["invoice", "creditmemo"]
                },
                //Ecuador
                "63": {
                    "1": [],
                    "2": ["invoice", "creditmemo"]
                },
                //Guatemala
                "91": {
                    "1": [],
                    "2": ["invoice", "creditmemo"]
                },
                //Mexico
                "157": {
                    "1": [],
                    "2": ["invoice", "creditmemo", "itemfulfillment", "customerpayment"]
                },
                //Panama
                "173": {
                    "1": [],
                    "2": ["invoice", "creditmemo"]
                },
                //Peru
                "174": {
                    "1": ["vendorpayment"],
                    "2": ["invoice", "creditmemo", "itemfulfillment", "cashsale", "itemreceipt"]
                },
                //Paraguay
                "186": {
                    "1": [],
                    "2": ["invoice", "creditmemo"]
                },
                //Uruguay
                "231": {
                    "1": ["vendorbill", "vendorcredit"],
                    "2": ["invoice", "creditmemo"]
                },
                //Republica Dominicana
                "61": {
                    "1": [],
                    "2": ["invoice", "creditmemo"]
                }
            };

            language = runtime.getCurrentScript().getParameter({ name: 'LANGUAGE' });
            language = language.substring(0, 2);
            if (language != 'es' && language != 'pt') {
                language = 'en';
            }

            const transactionsById = {
                "invoice": {
                    name: {
                        en: "Invoice",
                        es: "Factura de venta",
                        pt: "Documento fiscal"
                    },
                    id: 7
                },
                "creditmemo": {
                    name: {
                        en: "Credit Memo",
                        es: "Nota de crédito",
                        pt: "Memorando de crédito"
                    },
                    id: 10
                },
                "vendorbill": {
                    name: {
                        en: "Bill",
                        es: "Factura",
                        pt: "Fatura"
                    },
                    id: 17
                },
                "vendorcredit": {
                    name: {
                        en: "Bill Credit",
                        es: "Crédito de factura",
                        pt: "Crédito de fatura"
                    },
                    id: 20
                },
                "itemfulfillment": {
                    name: {
                        en: "Item Fulfillment",
                        es: "Ejecución de orden de artículo",
                        pt: "Atendimento de item"
                    },
                    id: 32
                },
                "customerpayment": {
                    name: {
                        en: "Payment",
                        es: "Pago",
                        pt: "Pagamento"
                    },
                    id: 9
                },
                "cashsale": {
                    name: {
                        en: "Cash Sale",
                        es: "Venta en efectivo",
                        pt: "Venda à vista"
                    },
                    id: 5
                },
                "itemreceipt": {
                    name: {
                        en: "Item Receipt",
                        es: "Recepción de artículo",
                        pt: "Recebimento de item"
                    },
                    id: 16
                },
                "vendorpayment": {
                    name: {
                        en: "Bill Payment",
                        es: "Pago de factura",
                        pt: "Pagamento de conta"
                    },
                    id: 18
                }
            };

            //Arreglo de transacciones del tipo de entidad actual
            let transactions = [];

            if (entityTypeID && (entityTypeID == "1" || entityTypeID == "2") && country) {
                transactions = jsonTransactionByCountry[country][entityTypeID]
            } else {
                transactions = [...jsonTransactionByCountry[country]["1"], ...jsonTransactionByCountry[country]["2"]];
            }
            for (let i = 0; i < transactions.length; i++) {
                let id = transactionsById[transactions[i]].id;
                let name = transactionsById[transactions[i]].name[language] || transactionsById[transactions[i]].name['en'];
                if (id) {
                    if (country == 11 && setupTax) {
                        let arTransactionsSetup = [32]
                        if (arTransactionsSetup.indexOf(id) > -1) {
                            transactionField.addSelectOption({ value: id, text: name });
                        }
                    }
                    else {
                        transactionField.addSelectOption({ value: id, text: name });
                    }
                }
            }
        }

        //AUTOMATIC FIELDS BY SUBSIDIARY (A/R) -MX
        const checkFeatureAutomaticSetGen = (recordObj, licenses) => {
            let setupTaxSubsid = recordObj.getValue('custrecord_lmry_us_setuptax');
            let country = recordObj.getValue('custrecord_lmry_us_country');

            if (setupTaxSubsid) {
                if (country == 157 && !Library_Mail.getAuthorization(975, licenses)) {
                    throw error.create({
                        name: 'ERROR_AUTHOMATIC_SET_SUBSIDIARY',
                        message: 'Disabled feature',
                        notifyOff: true
                    })
                }
                if (country == 11 && !Library_Mail.getAuthorization(323, licenses)) {
                    throw error.create({
                        name: 'ERROR_AUTHOMATIC_SET_SUBSIDIARY',
                        message: 'Disabled feature',
                        notifyOff: true
                    })
                }
            }

        }

        const setArDateFields = (recordObj) => {
            let countryID = recordObj.getValue('custrecord_lmry_us_country');
            if (countryID == 11) {
                let arIncConcepts = recordObj.getValue('custrecord_set_ar_inc_concepts');
                //Solo si el campo LATAM - AR INCLUDED CONCEPTS es Servícios o Productos y Servícios
                if (arIncConcepts == 2 || arIncConcepts == 3) {
                    let date = new Date();
                    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                    let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

                    recordObj.setValue('custrecord_set_ar_servdate_initial', firstDay);
                    recordObj.getValue('custrecord_set_ar_servdate_end', lastDay);
                } else {
                    recordObj.setValue('custrecord_set_ar_servdate_initial', '');
                    recordObj.getValue('custrecord_set_ar_servdate_end', '');
                }
            }
        }

        const setDataJson = (recordObj) => {
            let fieldData = [];
            let fieldDataRecord = [];

            //ID de la transacción
            //ID de la transacción
            let transaction = recordObj.getValue('custrecord_lmry_us_transaction') || "";
            let jsonResult = getfieldsHideAndView(recordObj);
            let viewFields = jsonResult.viewFields;
            if (viewFields.length) {
                let recordName = "";
                let recordId = "";

                viewFields.forEach((fieldObj) => {
                    if (!fieldObj.isRecordKey) {
                        //Nombre del campo
                        let nameField = fieldObj.name;
                        //Valor del campo
                        let valueField = recordObj.getValue(nameField);
                        if (nameField.startsWith('custrecord_set')) {
                            //Reemplazar inicial del campo
                            let newNameField = nameField.replace('custrecord_set', 'custrecord_lmry');
                            //Objeto de transaction Fields
                            let jsonDataRecord = {
                                field: newNameField,
                                value: valueField
                            };
                            //Agregando valores al arreglo Transaction Fields
                            fieldDataRecord.push(jsonDataRecord);
                        } else {
                            let newNameField = "";
                            if (transaction == complementoPagoId) {
                                if (nameField == 'custrecord_lmry_document_type') {
                                    newNameField = 'custpage_lmry_document_type';

                                } else if (nameField == 'custrecord_lmry_serie_doc_cxc') {
                                    newNameField = 'custpage_serie_doc';
                                } else {
                                    newNameField = nameField.replace('custrecord', 'custbody');
                                }

                            } else {
                                if (nameField == 'custrecord_lmry_serie_retencion_uy') {
                                    newNameField = 'custbody_lmry_serie_retencion';
                                } else {
                                    newNameField = nameField.replace('custrecord', 'custbody');
                                }
                            }
                            //Objeto de Body Fields
                            let jsonData = {
                                field: newNameField,
                                value: valueField
                            };
                            //Agregando valores al arreglo Body Fields
                            fieldData.push(jsonData);
                        }
                    } else {
                        recordName = fieldObj.recordName;//No se para que , pero lo llenaba en la version anterior !-_-
                        recordId = fieldObj.recordId;
                    }
                });
                //log.debug("recordName", recordName);
                if (recordName) {
                    recordObj.setValue('custrecord_lmry_setup_us_data_recor_name', recordName);

                }
                //log.debug("fieldData", fieldData.length);
                if (fieldData.length > 0) {
                    recordObj.setValue('custrecord_lmry_setup_us_data', JSON.stringify(fieldData));

                }
                log.debug("fieldDataRecord", fieldDataRecord.length);
                //Llenar campo transaction fields data
                if (fieldDataRecord.length > 0) {
                    recordObj.setValue('custrecord_lmry_setup_us_data_record_id', recordId);
                    recordObj.setValue('custrecord_lmry_setup_us_data_record', JSON.stringify(fieldDataRecord));

                }
            }
        }

        const getfieldsHideAndView = (recordObj) => {

            let filterView = [];
            let transaction = recordObj.getValue('custrecord_lmry_us_transaction') || "";
            transaction = Number(transaction);
            let country = recordObj.getValue('custrecord_lmry_us_country') || "";
            country = Number(country);

            if (country && transaction) {
                filterView.push(["custrecord_lmry_setup_us_country", "anyof", country]);

                let isNotaDebito = false, isExportacion = false, isLibreConsigna = false;
                //Invoice, CreditMemo
                let document = recordObj.getValue('custrecord_lmry_document_type');

                if ([7, 10].includes(transaction) && countryDocuments.includes(country) && document) {
                    let recordDocument = search.lookupFields({
                        type: 'customrecord_lmry_tipo_doc',
                        id: document,
                        columns: ['custrecord_lmry_es_nota_de_debito', 'custrecord_lmry_es_exportacion', 'custrecord_lmry_es_libre_consigna']
                    });
                    isNotaDebito = recordDocument.custrecord_lmry_es_nota_de_debito;
                    isExportacion = recordDocument.custrecord_lmry_es_exportacion;
                    isLibreConsigna = recordDocument.custrecord_lmry_es_libre_consigna;
                }

                if (transaction == 7) {
                    if (isExportacion && isNotaDebito) {
                        filterView.push("AND", ["custrecord_lmry_setup_us_notadeb_exp", "is", "T"]);
                    } else if (isNotaDebito) {
                        filterView.push("AND", ["custrecord_lmry_setup_us_nota_deb", "is", "T"]);
                    } else if (isExportacion) {
                        filterView.push("AND", ["custrecord_lmry_setup_us_inv_exp", "is", "T"]);
                    } else if (isLibreConsigna) {
                        filterView.push("AND", ["custrecord_lmry_setup_us_lib_consig", "is", "T"]);
                    } else if (!isExportacion && !isNotaDebito && !isLibreConsigna) {
                        filterView.push("AND", ["custrecord_lmry_setup_us_invoice", "is", "T"])
                    }
                } else if (transaction == 10 && isExportacion) {
                    filterView.push("AND", ["custrecord_lmry_setup_us_credit_exp", "is", "T"]);
                } else {
                    filterView.push("AND", [transactionFieldById[transaction], "is", "T"]);
                }
            }

            let filters = [
                ["isinactive", "is", "F"]
            ];

            if (filterView.length) {
                filters.push("AND", [
                    ["custrecord_lmry_setup_us_country", "anyof", "@NONE@"], "OR",
                    filterView
                ]);
            } else {
                filters.push("AND", ["custrecord_lmry_setup_us_country", "anyof", "@NONE@"]);
            }

            let viewSearch = search.create({
                type: "customrecord_lmry_setup_universal_set_v2",
                filters: filters,
                columns: ["name", "custrecord_lmry_setup_us_country", "custrecord_lmry_setup_us_record_key", "custrecord_lmry_setup_us_record.scriptid", "custrecord_lmry_setup_us_record"]
            });

            let results = viewSearch.run().getRange(0, 1000);
            let hideFields = [], viewFields = [];

            for (let i = 0; i < results.length; i++) {
                let name = results[i].getValue("name") || "";
                name = name.trim();
                let country = results[i].getValue("custrecord_lmry_setup_us_country") || "";
                let recordId = results[i].getValue({ name: "custrecord_lmry_setup_us_record" });
                let recordName = results[i].getValue({ name: "scriptid", join: "custrecord_lmry_setup_us_record" });
                let isRecordKey = results[i].getValue("custrecord_lmry_setup_us_record_key") || false;
                isRecordKey = (isRecordKey === "T" || isRecordKey === true);
                if (country) {
                    viewFields.push({ name: name, recordId: recordId, recordName: recordName, isRecordKey: isRecordKey });
                } else {
                    hideFields.push(name);
                }
            }

            return { viewFields: viewFields, hideFields: hideFields };

        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
        }

    });