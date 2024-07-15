/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_WHT_Variable_Rate_popup_LBRY_V2.0.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 12/06/2024
 */

define(['N/search','N/runtime'],

    function (search,runtime) {

        const loadDataVariableRate = (currentRecord) => {
            try {
                const dataGeneral = currentRecord.getValue("custbody_lmry_features_active");
                if (!dataGeneral) return;
                dataGeneral = JSON.parse(dataGeneral);

                const setDataLine = (sublist, fieldId, list) => {
                    let countLines = currentRecord.getLineCount({ sublistId: sublist });
                    for (let i = 0; i < countLines; i++) {
                        currentRecord.selectLine({ sublistId: sublist, line: i });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublist,
                            fieldId: fieldId,
                            value: JSON.stringify(list[i])
                        });
                    }
                }

                if (dataGeneral.item) setDataLine(
                    "item",
                    "custpage_co_variable_rate_data",
                    dataGeneral.item
                );
                if (dataGeneral.expense) setDataLine(
                    "expense",
                    "custpage_co_variable_rate_data_expense",
                    dataGeneral.expense
                );
            } catch (error) {
                console.log("error laod", error)
            }
        }

        const executePopup = (currentRecord) => {

            console.log("executePopup")
            const onClickVariableRate = (id,type) => {
              let checkvariableRate = document.getElementById(id);
              checkvariableRate.addEventListener('click', function (event) {
                if (checkvariableRate.classList.contains('checkbox_ck')) {
                    console.log("check")
                  createPopup(checkvariableRate, currentRecord,type);
                }
              });
            }
      
            onClickVariableRate("item_custpage_co_variable_rate_fs","item");
            onClickVariableRate("expense_custpage_co_variable_rate_expense_fs","expense");
      
            
        }

        function createPopup(checkvariableRate, currentRecord, type) {
            const translation = getTranslations();
            const index = getPosition(checkvariableRate);

            currentRecord.selectLine({ sublistId: type, line: index });
            const fieldId = type == "item" ? 'custpage_co_variable_rate_data' : 'custpage_co_variable_rate_data_expense';
            let itemVariableRate = currentRecord.getCurrentSublistValue({ sublistId: type, fieldId: fieldId })
            itemVariableRate = itemVariableRate ? JSON.parse(itemVariableRate) : {};


            const getFieldValue = (fieldId) => {
                return {
                    value: currentRecord.getCurrentSublistValue({ sublistId: type, fieldId: fieldId }),
                    text: currentRecord.getCurrentSublistText({ sublistId: type, fieldId: fieldId })
                };
            };

            const item = getFieldValue(type == "item" ? type : "account");

            if (!item.value) {
                Ext.onReady(function () {
                    Ext.Msg.alert(translation.LMRY_WARNING, translation.LMRY_SELECT_ITEM, function () {
                        checkvariableRate.classList.replace('checkbox_ck', 'checkbox_unck');
                    });
                });
                return;
            }
            const retecree = getFieldValue(type == "item" ? "custpage_lmry_co_autoretecree" : "custpage_lmry_co_retecree_exp");
            const retefte = getFieldValue(type == "item" ? "custpage_lmry_co_retefte" : "custpage_lmry_co_retefte_exp");
            const reteica = getFieldValue(type == "item" ? "custpage_lmry_co_reteica" : "custpage_lmry_co_reteica_exp");
            const reteiva = getFieldValue(type == "item" ? "custpage_lmry_co_reteiva" : "custpage_lmry_co_reteiva_exp");



            //Funciones internas
            const createTextField = (itemId, label, value, mainField) => {
                return {
                    xtype: 'textfield',
                    fieldLabel: label,
                    labelAlign: 'top',
                    anchor: '100%',
                    readOnly: mainField,
                    value: value || null,
                    itemId: itemId + type
                };
            };

            const createNumberField = (itemId, label, value, mainField) => {
                return {
                    xtype: 'textfield',
                    fieldLabel: label,
                    labelAlign: 'top',
                    anchor: '100%',
                    readOnly: mainField,
                    value: value || null,
                    itemId: itemId + type,
                    maskRe: /^[0-9]*\.?[0-9]*$/, // Solo permite dígitos
                    enforceMaxLength: true,
                    maxLength: 20 // Por ejemplo, máximo 10 dígitos, ajusta según tus necesidades
                };
            };

            const createPanel = (title, items) => {
                return {
                    xtype: 'fieldset',
                    width: 200,
                    title: title,
                    flex: 1,
                    layout: 'anchor',
                    margin: '40 10',
                    defaults: { anchor: '100%' },
                    items: items
                };
            };

            const buildItemsPopup = (tax, rates, typeWht) => {
                let itemsPopup = [createTextField("nt_" + typeWht, 'NATIONAL TAX', tax.text, true)];
                if (rates) {
                    itemsPopup.push(createNumberField("new_basis_" + typeWht, translation.LMRY_NEW_BASIS, rates.newBasis));
                    itemsPopup.push(createNumberField("new_rate_" + typeWht, translation.LMRY_NEW_RATE, rates.newRate));
                    itemsPopup.push(createNumberField("amount_" + typeWht, translation.LMRY_AMOUNT, rates.amount));
                } else {
                    itemsPopup.push(createNumberField("new_basis_" + typeWht, translation.LMRY_NEW_BASIS));
                    itemsPopup.push(createNumberField("new_rate_" + typeWht, translation.LMRY_NEW_RATE));
                    itemsPopup.push(createNumberField("amount_" + typeWht, translation.LMRY_AMOUNT));
                }
                return itemsPopup;
            };

            const getFieldColValue = (popup, idField) => {
                let itemField = popup.down("#" + idField + type);
                if (!itemField) return null;

                let itemValue = itemField.getValue();
                if (idField.startsWith("nt_")) {
                    let mappings = { "_cree": retecree, "_fte": retefte, "_ica": reteica, "_iva": reteiva };
                    let suffix = Object.keys(mappings).find(function (suffix) {
                        return idField.endsWith(suffix) && itemValue === mappings[suffix].text;
                    });

                    if (suffix) {
                        return mappings[suffix].value;
                    }
                }
                return Number(itemValue);
            };




            //Cracion de paneles por existencia de retenciones
            let panels = [];

            let featureByRetention = {
                cree: retecree.value ? isActiveFeatNationalTax(retecree.value):false,
                fte: retefte.value ? isActiveFeatNationalTax(retefte.value):false,
                ica: reteica.value ? isActiveFeatNationalTax(reteica.value):false,
                iva: reteiva.value ? isActiveFeatNationalTax(reteiva.value):false
            }

            if (featureByRetention.cree) {
                panels.push(createPanel('RETECREE '+ translation.LMRY_DETAIL, buildItemsPopup(retecree, itemVariableRate ? itemVariableRate.cree : null, "cree")));
            }
            if (featureByRetention.fte) {
                panels.push(createPanel('RETEFTE '+ translation.LMRY_DETAIL, buildItemsPopup(retefte, itemVariableRate ? itemVariableRate.fte : null, "fte")));
            }
            if (featureByRetention.ica) {
                panels.push(createPanel('RETEICA '+ translation.LMRY_DETAIL, buildItemsPopup(reteica, itemVariableRate ? itemVariableRate.ica : null, "ica")));
            }
            if (featureByRetention.iva) {
                panels.push(createPanel('RETEIVA '+ translation.LMRY_DETAIL, buildItemsPopup(reteiva, itemVariableRate ? itemVariableRate.iva : null, "iva")));
            }


            if (!panels.length) {
                if (
                    retecree.value ||
                    retefte.value ||
                    reteica.value ||
                    reteiva.value
                ) {
                    Ext.onReady(function () {
                        Ext.Msg.alert(translation.LMRY_WARNING, translation.LMRY_SUPPORT_VR, function () {
                            checkvariableRate.classList.replace('checkbox_ck', 'checkbox_unck');
                        });
                    });
                } else{
                    Ext.onReady(function () {
                        Ext.Msg.alert(translation.LMRY_WARNING, translation.LMRY_CONFIG_WHT, function () {
                            checkvariableRate.classList.replace('checkbox_ck', 'checkbox_unck');
                        });
                    });
                }
                
                return;
            }

            if (panels.length < 4) {
                panels.unshift({ xtype: 'component', flex: 1 });
                panels.push({ xtype: 'component', flex: 1 });
            }

            //Creacion de la ventana emergente

            Ext.onReady(function () {
                let popup = Ext.create('Ext.window.Window', {
                    title: translation.LMRY_TITLE_PANEL,
                    width: 1000,
                    height: 500,
                    layout: { type: 'vbox', align: 'stretch' },
                    items: [
                        {
                            xtype: 'container',
                            layout: 'anchor',
                            padding: '20 10 0 10',
                            items: [createTextField(type + "_variable_rate", type == "item" ? translation.LMRY_ITEM : translation.LMRY_ACCOUNT, item.text, true)]
                        },
                        {
                            xtype: 'container',
                            layout: { type: 'hbox', pack: 'center', align: 'stretch' },
                            flex: 1,
                            defaults: { flex: 1, layout: 'hbox', align: 'stretch' },
                            items: panels
                        }
                    ],
                    buttons: [
                        {
                            text: 'Guardar',
                            handler: function () {
                                checkvariableRate.classList.replace('checkbox_ck', 'checkbox_unck');

                                let whtObject = {};


                                if (retecree.value) {
                                    whtObject.cree = {
                                        nationalTax: getFieldColValue(popup, "nt_cree"),
                                        newBasis: getFieldColValue(popup, "new_basis_cree") || 0,
                                        newRate: getFieldColValue(popup, "new_rate_cree") || 0,
                                        amount: getFieldColValue(popup, "amount_cree") || 0,
                                        key: "cree"
                                    }
                                }

                                if (retefte.value) {
                                    whtObject.fte = {
                                        nationalTax: getFieldColValue(popup, "nt_fte"),
                                        newBasis: getFieldColValue(popup, "new_basis_fte") || 0,
                                        newRate: getFieldColValue(popup, "new_rate_fte") || 0,
                                        amount: getFieldColValue(popup, "amount_fte") || 0,
                                        key: "fte"
                                    }
                                }

                                if (reteica.value) {
                                    whtObject.ica = {
                                        nationalTax: getFieldColValue(popup, "nt_ica"),
                                        newBasis: getFieldColValue(popup, "new_basis_ica") || 0,
                                        newRate: getFieldColValue(popup, "new_rate_ica") || 0,
                                        amount: getFieldColValue(popup, "amount_ica") || 0,
                                        key: "ica"
                                    }
                                }

                                if (reteiva.value) {
                                    whtObject.iva = {
                                        nationalTax: getFieldColValue(popup, "nt_iva"),
                                        newBasis: getFieldColValue(popup, "new_basis_iva") || 0,
                                        newRate: getFieldColValue(popup, "new_rate_iva") || 0,
                                        amount: getFieldColValue(popup, "amount_iva") || 0,
                                        key: "iva"
                                    }
                                }
                                console.log("whtObject : ", whtObject);


                                currentRecord.setCurrentSublistValue({
                                    sublistId: type,
                                    fieldId: fieldId,
                                    value: JSON.stringify(whtObject)
                                });

                                popup.close();
                            }
                        },
                        {
                            text: 'Cancelar',
                            handler: function () {
                                checkvariableRate.classList.replace('checkbox_ck', 'checkbox_unck');
                                popup.close();
                            }
                        }
                    ]
                });
                popup.show();

                checkvariableRate.addEventListener('click', function () {
                    if (checkvariableRate.classList.contains('checkbox_unck')) {
                        popup.close();
                    }
                });
            });
        }

        function isActiveFeatNationalTax(id) {
            let isActive = search.lookupFields(
                {
                    type: "customrecord_lmry_national_taxes",
                    id: id,
                    columns: ["custrecord_lmry_ntax_var_rate"]
                }).custrecord_lmry_ntax_var_rate;
            return isActive === true || isActive === "T";
        }

        function getPosition(checkElement) {
            let trElement = checkElement.closest("tr");
            let allRows = trElement.parentElement.children;
            let rowIndex = Array.prototype.indexOf.call(allRows, trElement);
            return (rowIndex - 1);
        }

        function getFeatureVariableRate (subsidiary){
            let FEAT_SUBS = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' })
            let filters = [
                ["isinactive", "is", "F"]
            ];
            if (FEAT_SUBS === true || FEAT_SUBS === "T") {
                filters.push("AND", ["custrecord_lmry_setuptax_subsidiary", "anyof", subsidiary]);
            }

            let results = search.create({
                type: "customrecord_lmry_setup_tax_subsidiary",
                filters: filters,
                columns: ["custrecord_lmry_co_variable_rate"]
            }).run().getRange(0, 1);
            if (results && results.length) {
                let isVariableRate = results[0].getValue("custrecord_lmry_co_variable_rate");
                return isVariableRate === true || isVariableRate === "T"
            }
            return false;
        }


        function getTranslations() {
            let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
                language = language === "es" ? language : "en";
            let translatedFields = {
                "en": {
                    "LMRY_SELECT_ITEM": "Select an account or item",
                    "LMRY_DETAIL": "DETAIL",
                    "LMRY_SUPPORT_VR":"The selected withholding(s) does not support a variable rate.",
                    "LMRY_WARNING": "WARNING",
                    "LMRY_CONFIG_WHT":"You must configure at least one retention type",
                    "LMRY_TITLE_PANEL":"Variable rate configuration",
                    "LMRY_NEW_BASIS":"NEW BASIS",
                    "LMRY_NEW_RATE":"NEW RATE %",
                    "LMRY_AMOUNT":"AMOUNT",
                    "LMRY_ITEM":"ITEM",
                    "LMRY_ACCOUNT":"ACCOUNT",
                },
                "es": {
                    "LMRY_SELECT_ITEM": "Seleccione una cuenta o un artículo",
                    "LMRY_DETAIL": "DETALLE",
                    "LMRY_SUPPORT_VR":"La(s) retención(es) seleccionada(s) no admite(n) tarifa variable.",
                    "LMRY_WARNING": "ADVERTENCIA",
                    "LMRY_CONFIG_WHT":"Debe configurar al menos un tipo de retención.",
                    "LMRY_TITLE_PANEL":"Configuración de tasa variable",
                    "LMRY_NEW_BASIS":"NUEVA BASE",
                    "LMRY_NEW_RATE":"NUEVA TASA %",
                    "LMRY_AMOUNT":"MONTO",
                    "LMRY_ITEM":"ARTICULO",
                    "LMRY_ACCOUNT":"CUENTA",
                }
            }
            return translatedFields[language];
        }

        return {
            executePopup:executePopup,
            loadDataVariableRate:loadDataVariableRate,
            getFeatureVariableRate:getFeatureVariableRate
        };
    });