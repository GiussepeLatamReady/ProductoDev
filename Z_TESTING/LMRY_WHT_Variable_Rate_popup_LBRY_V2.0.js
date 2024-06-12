/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @Name LMRY_WHT_Variable_Rate_popup_LBRY_V2.0.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 12/06/2024
 */

define(['N/search','N/runtime'],

    function (search,runtime) {

        function loadDataVariableRate(currentRecord) {
            try {
                var dataGeneral = currentRecord.getValue("custbody_lmry_features_active");
                if (!dataGeneral) return;
                dataGeneral = JSON.parse(dataGeneral);

                var setDataLine = function (sublist, fieldId, list) {
                    var countLines = currentRecord.getLineCount({ sublistId: sublist });
                    for (var i = 0; i < countLines; i++) {
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

        function executePopup(currentRecord) {

            console.log("executePopup")
            var onClickVariableRate = function (id,type) {
              var checkvariableRate = document.getElementById(id);
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

            var index = getPosition(checkvariableRate);

            currentRecord.selectLine({ sublistId: type, line: index });
            var fieldId = type == "item" ? 'custpage_co_variable_rate_data' : 'custpage_co_variable_rate_data_expense';
            var itemVariableRate = currentRecord.getCurrentSublistValue({ sublistId: type, fieldId: fieldId })
            itemVariableRate = itemVariableRate ? JSON.parse(itemVariableRate) : {};


            var getFieldValue = function (fieldId) {
                return {
                    value: currentRecord.getCurrentSublistValue({ sublistId: type, fieldId: fieldId }),
                    text: currentRecord.getCurrentSublistText({ sublistId: type, fieldId: fieldId })
                };
            };

            var item = getFieldValue(type == "item" ? type : "account");
            console.log("item 111", item)

            if (!item.value) {
                Ext.onReady(function () {
                    Ext.Msg.alert('Warning', 'Select an account or item', function () {
                        checkvariableRate.classList.replace('checkbox_ck', 'checkbox_unck');
                    });
                });
                return;
            }
            var retecree = getFieldValue(type == "item" ? "custpage_lmry_co_autoretecree" : "custpage_lmry_co_retecree_exp");
            var retefte = getFieldValue(type == "item" ? "custpage_lmry_co_retefte" : "custpage_lmry_co_retefte_exp");
            var reteica = getFieldValue(type == "item" ? "custpage_lmry_co_reteica" : "custpage_lmry_co_reteica_exp");
            var reteiva = getFieldValue(type == "item" ? "custpage_lmry_co_reteiva" : "custpage_lmry_co_reteiva_exp");



            //Funciones internas
            var createTextField = function (itemId, label, value, mainField) {
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

            var createNumberField = function (itemId, label, value, mainField) {
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

            var createPanel = function (title, items) {
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

            var buildItemsPopup = function (tax, rates, typeWht) {
                var itemsPopup = [createTextField("nt_" + typeWht, 'NATIONAL TAX', tax.text, true)];
                if (rates) {
                    itemsPopup.push(createNumberField("new_basis_" + typeWht, 'NEW BASIS', rates.newBasis));
                    itemsPopup.push(createNumberField("new_rate_" + typeWht, 'NEW RATE %', rates.newRate));
                    itemsPopup.push(createNumberField("amount_" + typeWht, 'AMOUNT', rates.amount));
                } else {
                    itemsPopup.push(createNumberField("new_basis_" + typeWht, 'NEW BASIS'));
                    itemsPopup.push(createNumberField("new_rate_" + typeWht, 'NEW RATE %'));
                    itemsPopup.push(createNumberField("amount_" + typeWht, 'AMOUNT'));
                }
                return itemsPopup;
            };

            var getFieldColValue = function (popup, idField) {
                var itemField = popup.down("#" + idField + type);
                if (!itemField) return null;

                var itemValue = itemField.getValue();
                if (idField.startsWith("nt_")) {
                    var mappings = { "_cree": retecree, "_fte": retefte, "_ica": reteica, "_iva": reteiva };
                    var suffix = Object.keys(mappings).find(function (suffix) {
                        return idField.endsWith(suffix) && itemValue === mappings[suffix].text;
                    });

                    if (suffix) {
                        return mappings[suffix].value;
                    }
                }
                return Number(itemValue);
            };




            //Cracion de paneles por existencia de retenciones
            var panels = [];

            var featureByRetention = {
                cree: retecree.value ? isActiveFeatNationalTax(retecree.value):false,
                fte: retefte.value ? isActiveFeatNationalTax(retefte.value):false,
                ica: reteica.value ? isActiveFeatNationalTax(reteica.value):false,
                iva: reteiva.value ? isActiveFeatNationalTax(reteiva.value):false
            }

            if (featureByRetention.cree) {
                panels.push(createPanel('RETECREE DETAIL', buildItemsPopup(retecree, itemVariableRate ? itemVariableRate.cree : null, "cree")));
            }
            if (featureByRetention.fte) {
                panels.push(createPanel('RETEFTE DETAIL', buildItemsPopup(retefte, itemVariableRate ? itemVariableRate.fte : null, "fte")));
            }
            if (featureByRetention.ica) {
                panels.push(createPanel('RETEICA DETAIL', buildItemsPopup(reteica, itemVariableRate ? itemVariableRate.ica : null, "ica")));
            }
            if (featureByRetention.iva) {
                panels.push(createPanel('RETEIVA DETAIL', buildItemsPopup(reteiva, itemVariableRate ? itemVariableRate.iva : null, "iva")));
            }


            if (!panels.length) {
                if (
                    retecree.value ||
                    retefte.value ||
                    reteica.value ||
                    reteiva.value
                ) {
                    Ext.onReady(function () {
                        Ext.Msg.alert('Warning', 'The selected withholding(s) does not support a variable rate.', function () {
                            checkvariableRate.classList.replace('checkbox_ck', 'checkbox_unck');
                        });
                    });
                } else{
                    Ext.onReady(function () {
                        Ext.Msg.alert('Warning', 'You must configure at least one retention type.', function () {
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
                var popup = Ext.create('Ext.window.Window', {
                    title: 'Variable rate configuration',
                    width: 1000,
                    height: 500,
                    layout: { type: 'vbox', align: 'stretch' },
                    items: [
                        {
                            xtype: 'container',
                            layout: 'anchor',
                            padding: '20 10 0 10',
                            items: [createTextField(type + "_variable_rate", type == "item" ? "ITEM" : "ACCOUNT", item.text, true)]
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

                                var whtObject = {};


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
            var isActive = search.lookupFields(
                {
                    type: "customrecord_lmry_national_taxes",
                    id: id,
                    columns: ["custrecord_lmry_ntax_var_rate"]
                }).custrecord_lmry_ntax_var_rate;
            return isActive === true || isActive === "T";
        }

        function getPosition(checkElement) {
            var trElement = checkElement.closest("tr");
            var allRows = trElement.parentElement.children;
            var rowIndex = Array.prototype.indexOf.call(allRows, trElement);
            return (rowIndex - 1);
        }

        function getFeatureVariableRate (subsidiary){
            var FEAT_SUBS = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' })
            var filters = [
                ["isinactive", "is", "F"]
            ];
            if (FEAT_SUBS === true || FEAT_SUBS === "T") {
                filters.push("AND", ["custrecord_lmry_setuptax_subsidiary", "anyof", subsidiary]);
            }

            var results = search.create({
                type: "customrecord_lmry_setup_tax_subsidiary",
                filters: filters,
                columns: ["custrecord_lmry_co_variable_rate"]
            }).run().getRange(0, 1);
            if (results && results.length) {
                var isVariableRate = results[0].getValue("custrecord_lmry_co_variable_rate");
                return isVariableRate === true || isVariableRate === "T"
            }
            return false;
        }


        return {
            executePopup:executePopup,
            loadDataVariableRate:loadDataVariableRate,
            getFeatureVariableRate:getFeatureVariableRate
        };
    });