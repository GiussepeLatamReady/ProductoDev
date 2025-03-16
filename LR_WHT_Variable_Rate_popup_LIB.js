/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LR_WHT_Variable_Rate_popup_LIB.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 12/06/2024
 */

define(['N/search','N/runtime','N/currentRecord','N/record'],

    function (search,runtime,currentRecord,record) {

        const loadDataVariableRate = (currentRecord) => {
            try {
                let dataGeneral = currentRecord.getValue("custbody_lmry_features_active");
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
                console.log("error [loadDataVariableRate]", error)
            }
        }

        const executePopup = (currentRecord) => {

            const onClickVariableRate = (id,type) => {
              let checkvariableRate = document.getElementById(id);

              checkvariableRate.addEventListener('click', function (event) {
                if (checkvariableRate.classList.contains('checkbox_ck')) {
                  createPopup(checkvariableRate, currentRecord,type);
                }
              });
            }
      
            onClickVariableRate("item_custpage_co_variable_rate_fs","item");
            onClickVariableRate("expense_custpage_co_variable_rate_expense_fs","expense");
      
            
        }
        
        function createPopup2(checkvariableRate, currentRecord, type) {
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
        
        
        
        const createPopup = (checkvariableRate, currentRecord,type) => {
            const translation = getTranslations();
            const colorTheme = getColor();
            const index = getPosition(checkvariableRate);
            openSubForm();

            

            //Capturar retenciones almacenadas
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
                //Alerta modal en el centro
                alert(translation.LMRY_WARNING+" : ",translation.LMRY_SELECT_ITEM)
                return;
            }

            const retentions = {
                cree:getFieldValue(type == "item" ? "custpage_lmry_co_autoretecree" : "custpage_lmry_co_retecree_exp"),
                fte:getFieldValue(type == "item" ? "custpage_lmry_co_retefte" : "custpage_lmry_co_retefte_exp"),
                ica:getFieldValue(type == "item" ? "custpage_lmry_co_reteica" : "custpage_lmry_co_reteica_exp"),
                iva:getFieldValue(type == "item" ? "custpage_lmry_co_reteiva" : "custpage_lmry_co_reteiva_exp")
            }


            let featureByRetention = {
                cree: retentions.cree.value ? isActiveFeatNationalTax(retentions.cree.value):false,
                fte: retentions.fte.value ? isActiveFeatNationalTax(retentions.fte.value):false,
                ica: retentions.ica.value ? isActiveFeatNationalTax(retentions.ica.value):false,
                iva: retentions.iva.value ? isActiveFeatNationalTax(retentions.iva.value):false
            }


            // Datos de las cuatro secciones
            let sectionsData = [];

            const retentionTypes = ["cree", "fte", "ica", "iva"];
            sectionsData = retentionTypes
                .filter(type => featureByRetention[type])
                .map(type => {
                    const { text, value } = retentions[type];  // Destructuración de `retentions`
                    const variableRate = itemVariableRate?.[type] || {};  // Evita errores si `itemVariableRate[type]` no existe
                    const { newBasis, newRate, amount, nationalTax } = variableRate;

                    return {
                        title: `RETE${type.toUpperCase()} ${translation.LMRY_DETAIL}`,
                        tax: text,
                        type,
                        newBasis: newBasis && value !== nationalTax ? newBasis : null,
                        newRate: newRate && value !== nationalTax ? newRate : null,
                        amount: amount && value !== nationalTax ? amount : null,
                    };
                });


            if (!sectionsData.length) {
                if (
                    retentions.cree.value ||
                    retentions.fte.value ||
                    retentions.ica.value ||
                    retentions.iva.value
                ) {

                    //Alerta modal en el centro
                    alert(translation.LMRY_WARNING+" : ",translation.LMRY_SUPPORT_VR)
                    currentRecord.setCurrentSublistValue({ sublistId: type, fieldId: "custpage_co_variable_rate", value: false })
                    //checkvariableRate.classList.replace('checkbox_ck', 'checkbox_unck');
                } else{

                    alert(translation.LMRY_WARNING+" : ", translation.LMRY_CONFIG_WHT)
                    currentRecord.setCurrentSublistValue({ sublistId: type, fieldId: "custpage_co_variable_rate", value: false })
                    //checkvariableRate.classList.replace('checkbox_ck', 'checkbox_unck');
                }
                
                return;
            }

            // Modal de bloqueo (fondo oscuro)
            let overlay = document.createElement('div');
            overlay.id = 'modal-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'rgba(0, 0, 0, 0.6)'; // Mayor opacidad para resaltar la modal
            overlay.style.zIndex = '9999';
            overlay.style.transition = 'opacity 0.3s ease-in-out';
            document.body.appendChild(overlay);

            // Contenedor - Ventana Modal
            let container = document.createElement('div');
            container.id = 'modal-container';
            container.style.position = 'fixed';
            container.style.top = '50%';
            container.style.left = '50%';
            container.style.transform = 'translate(-50%, -50%)';
            container.style.height = 'auto'; 
            container.style.maxHeight = '80vh';
            container.style.background = 'white';
            container.style.padding = '20px';
            container.style.borderRadius = '12px'; // Bordes redondeados para un look moderno
            container.style.border = '1px solid #ddd';
            container.style.boxShadow = '0px 4px 15px rgba(0, 0, 0, 0.3)';
            container.style.overflowY = 'auto'; // Para manejar contenido largo
            container.style.zIndex = '10000';
            container.style.transition = 'all 0.3s ease-in-out';

            // Función para ajustar el ancho dinámicamente
            const adjustModalWidth = () => {
                let viewportWidth = window.innerWidth;
                if (viewportWidth > 1200) {
                    container.style.width = '70%'; 
                } else if (viewportWidth > 768) {
                    container.style.width = '80%'; 
                } else {
                    container.style.width = '95%'; 
                }
            };

            // Ajustar el ancho al cargar y al cambiar el tamaño de la ventana
            adjustModalWidth();
            window.addEventListener('DOMContentLoaded', adjustModalWidth);
            window.addEventListener('resize', adjustModalWidth);

            // Animación de apertura
            container.style.opacity = '0';
            setTimeout(() => { container.style.opacity = '1'; }, 100);

            // Cabecera - Ventana Modal
            let header = document.createElement('div');
            header.id = 'subsidiary-modal';
            header.className = 'latam-tab';
            header.style.width = '100%';
            header.style.height = '40px'; // Altura definida para mantener un diseño uniforme
            header.style.background = colorTheme; // Se usa el color temático
            header.style.padding = '15px 20px';
            header.style.borderTopLeftRadius = '12px';
            header.style.borderTopRightRadius = '12px';
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.justifyContent = 'space-between';
            header.style.position = 'relative';
            header.style.boxShadow = '0px 2px 10px rgba(0,0,0,0.1)';

            // Título - Cabecera
            let titleHeader = document.createElement('h2');
            titleHeader.id = 'title-header';
            titleHeader.innerText = translation.LMRY_TITLE_PANEL;
            titleHeader.style.color = 'white';
            titleHeader.style.cursor = 'default';
            titleHeader.style.fontSize = '17px';
            titleHeader.style.fontWeight = 'bold';
            titleHeader.style.fontFamily = 'Arial, sans-serif';

            // Botón de Cierre de Ventana
            let closeButton = document.createElement('button');
            closeButton.id = 'close-button';
            closeButton.textContent = '✖';
            closeButton.style.border = 'none';
            closeButton.style.color = 'white';
            closeButton.style.cursor = 'pointer';
            closeButton.style.fontSize = '16px';
            closeButton.style.width = '25px';
            closeButton.style.height = '25px';
            closeButton.style.borderRadius = '50%';
            closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
            closeButton.style.display = 'flex';
            closeButton.style.alignItems = 'center';
            closeButton.style.justifyContent = 'center';
            closeButton.style.transition = 'background 0.3s ease-in-out';

            // Efecto hover en botón de cierre
            closeButton.addEventListener('mouseenter', () => {
                closeButton.style.background = 'rgba(255, 255, 255, 0.6)';
            });
            closeButton.addEventListener('mouseleave', () => {
                closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
            });

            // Acción de cierre
            closeButton.addEventListener('click', function () {
                container.style.opacity = '0';
                overlay.style.opacity = '0';
                setTimeout(() => {
                    checkvariableRate.classList.replace('checkbox_ck', 'checkbox_unck');
                    document.body.removeChild(container);
                    document.body.removeChild(overlay);
                }, 300);
            });

            // Agregar título y botón a la cabecera
            header.appendChild(titleHeader);
            header.appendChild(closeButton);

            // Agregar la cabecera al contenedor
            container.appendChild(header);

            // Agregar el contenedor al body
            document.body.appendChild(container);



            // Creación de contenido

            // Contenedor principal
            let contentContainer = document.createElement('div');
            contentContainer.style.display = 'flex';
            contentContainer.style.flexDirection = 'column';
            contentContainer.style.gap = '20px';
            contentContainer.style.padding = '10px 20px';
            contentContainer.style.fontFamily = 'Arial, sans-serif';

            // Campo de Ítem
            let itemLabel = document.createElement('label');
            itemLabel.innerText = type == "item" ? translation.LMRY_ITEM : translation.LMRY_ACCOUNT;
            itemLabel.style.fontWeight = 'bold';
            itemLabel.style.fontSize = '15px';

            let itemInput = document.createElement('input');
            itemInput.type = 'text';
            itemInput.value = 'ACC00001'; // Valor de ejemplo
            itemInput.style.width = '100%';
            itemInput.style.padding = '5px 10px';
            itemInput.style.border = '1px solid #ccc';
            itemInput.style.borderRadius = '5px';
            itemInput.style.fontSize = '12px';
            itemInput.style.transition = 'all 0.3s ease-in-out';
            itemInput.style.backgroundColor = '#f3f3f3'; 
            itemInput.style.cursor = 'not-allowed'; // Cambiar cursor
            itemInput.readOnly = true; // Evitar edición



            const hexToRgba = (hex, alpha = 0.5) => {
                hex = hex.replace("#", ""); // Eliminar el #
                let r = parseInt(hex.substring(0, 2), 16);
                let g = parseInt(hex.substring(2, 4), 16);
                let b = parseInt(hex.substring(4, 6), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };
            
            let borderColorTransparent = hexToRgba(colorTheme, 0.2);
            // Animación al pasar el cursor sobre el input
            itemInput.addEventListener('focus', () => {
                itemInput.style.border = `2px solid ${borderColorTransparent}`;
                itemInput.style.boxShadow = '0px 0px 5px rgba(0, 123, 255, 0.5)';
            });
            itemInput.addEventListener('blur', () => {
                itemInput.style.border = '1px solid #ccc';
                itemInput.style.boxShadow = 'none';
            });

            // Contenedor de secciones
            let sectionsContainer = document.createElement('div');
            sectionsContainer.style.display = 'flex';
            sectionsContainer.style.justifyContent = 'space-between';
            sectionsContainer.style.gap = '15px';

            

            // Función para crear un campo de entrada con etiqueta

            

            const createInputField = (labelText, id) => {

                const enforceNumericInput = (input) => {
                    input.addEventListener('input', () => {
                        input.value = input.value.replace(/[^0-9.]/g, '');
                    });
                };

                let label = document.createElement('label');
                label.innerText = labelText;
                label.style.fontWeight = 'bold';
                label.style.fontSize = '13px';
                label.style.marginBottom = '2px';

                let input = document.createElement('input');
                input.type = 'text';
                input.id = id;
                input.style.width = '100%';
                input.style.padding = '4px 8px';
                input.style.border = '1px solid #ccc';
                input.style.borderRadius = '4px';
                input.style.fontSize = '13px';
                input.style.transition = 'all 0.3s ease-in-out';

                if (id.startsWith("new_basis_") || id.startsWith("new_rate_") || id.startsWith("amount_")) {
                    input.type = "number";  // Cambia el tipo a numérico
                    input.step = "0.01";    // Permite valores decimales con 2 decimales
                    input.min = "0";        // Evita valores negativos (si aplica)
                }
                
                if (id.startsWith("nt")) {
                    input.style.backgroundColor = '#f3f3f3'; 
                    input.style.cursor = 'not-allowed'; // Cambiar cursor
                    input.readOnly = true; // Evitar edición
                }
                // Animación al pasar el cursor sobre el input
                input.addEventListener('focus', () => {
                    input.style.border = '1px solid #28A745';
                    input.style.boxShadow = '0px 0px 5px rgba(40, 167, 69, 0.5)';
                });
                input.addEventListener('blur', () => {
                    input.style.border = '1px solid #ccc';
                    input.style.boxShadow = 'none';
                });

                // Restringe a solo números
                if (id.startsWith("new_basis_") || id.startsWith("new_rate_") || id.startsWith("amount_")) {
                    enforceNumericInput(input); 
                }

                let container = document.createElement('div');
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.gap = '5px';
                container.appendChild(label);
                container.appendChild(input);

                return container;
            };

            const calculateAmount = (type) => {
                let basisInput = document.getElementById(`new_basis_${type}`);
                let rateInput = document.getElementById(`new_rate_${type}`);
                let amountInput = document.getElementById(`amount_${type}`);
                
                const updateAmount = () => {
                    let basis = parseFloat(basisInput.value) || 0;
                    let rate = parseFloat(rateInput.value) || 0;
            
                    let calculatedAmount = (basis * rate) / 100; // Fórmula estándar para cálculo de retenciones
            
                    amountInput.value = calculatedAmount.toFixed(2); // Redondea a 2 decimales
                };
                if (basisInput && rateInput && amountInput) {
                    ["change", "blur", "keyup"].forEach(event => {
                        basisInput.addEventListener(event, updateAmount);
                        rateInput.addEventListener(event, updateAmount);
                    });
                }
            };
            

            // Crear cada sección
            sectionsData.forEach(section => {
                let sectionContainer = document.createElement('div');
                sectionContainer.style.border = `2px solid ${borderColorTransparent}`;
                sectionContainer.style.padding = '10px';
                sectionContainer.style.width = '24%';
                sectionContainer.style.display = 'flex';
                sectionContainer.style.flexDirection = 'column';
                sectionContainer.style.gap = '15px';
                sectionContainer.style.borderRadius = '10px';
                sectionContainer.style.backgroundColor = '#F8F9FA';
                sectionContainer.style.transition = 'transform 0.2s ease-in-out';

                // Efecto hover en cada sección
                sectionContainer.addEventListener('mouseenter', () => {
                    sectionContainer.style.transform = 'scale(1.05)';
                });
                sectionContainer.addEventListener('mouseleave', () => {
                    sectionContainer.style.transform = 'scale(1)';
                });

                let sectionTitle = document.createElement('strong');
                sectionTitle.innerText = section.title;
                sectionTitle.style.fontSize = '15px';
                sectionTitle.style.color = 'rgba(97, 100, 98, 0.5)';

                // Agregar campos con sus respectivos IDs dinámicos
                sectionContainer.appendChild(sectionTitle);
                sectionContainer.appendChild(createInputField(translation.LMRY_NATIONAL_TAX, `nt_${section.type}`)).querySelector('input').value = section.tax;
                
                
                const newBasisElement = sectionContainer.appendChild(createInputField(translation.LMRY_NEW_BASIS, `new_basis_${section.type}`));
                const newRateElement = sectionContainer.appendChild(createInputField(translation.LMRY_NEW_RATE, `new_rate_${section.type}`));
                const amountElement = sectionContainer.appendChild(createInputField(translation.LMRY_AMOUNT, `amount_${section.type}`));
                console.log("newBasisElement:",newBasisElement)
                console.log("newRateElement:",newRateElement)
                console.log("amountElement:",amountElement)
                //obs   
                if (section.newBasis) newBasisElement.querySelector('input').value = section.newBasis;
                if (section.newRate) newRateElement.querySelector('input').value = section.newRate;
                if (section.amount) amountElement.querySelector('input').value = section.amount;

                sectionsContainer.appendChild(sectionContainer);
            });

            // Agregar elementos al contenedor principal
            contentContainer.appendChild(itemLabel);
            contentContainer.appendChild(itemInput);
            contentContainer.appendChild(sectionsContainer);

            // Agregar el contenido a la ventana modal
            container.appendChild(contentContainer);

            // Fin de contenido

            //Agregar botones
            let buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'flex-end';
            buttonContainer.style.gap = '15px';
            buttonContainer.style.padding = '10px 20px';
            buttonContainer.style.marginTop = '5px';

            // Estilos base para los botones
            const createButton = (text, bgColor, textColor, hoverBg, hoverText, action) => {
                let button = document.createElement('button');
                button.innerText = text;
                button.style.padding = '6px 20px';
                button.style.border = 'none';
                button.style.borderRadius = '6px';
                button.style.cursor = 'pointer';
                button.style.fontSize = '14px';
                button.style.fontWeight = 'bold';
                button.style.transition = 'all 0.3s ease-in-out';
                button.style.backgroundColor = bgColor;
                button.style.color = textColor;
                button.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';

                // Efecto hover
                button.addEventListener('mouseenter', () => {
                    button.style.backgroundColor = hoverBg;
                    button.style.color = hoverText;
                });
                button.addEventListener('mouseleave', () => {
                    button.style.backgroundColor = bgColor;
                    button.style.color = textColor;
                });

                // Acción al hacer clic
                button.addEventListener('click', action);

                return button;
            };

            // Botón de Guardar
            let saveButton = createButton(
                translation.LMRY_SAVE,
                '#006AFF',      // Verde éxito 
                '#FFFFFF',      // Texto blanco 
                '#0055CC',      // Verde más oscuro en hover
                '#FFFFFF',
                () => {
                    let allValid = true; // Variable para verificar si todos son válidos

                    sectionsData.forEach(section => {
                        let basisInput = document.getElementById(`new_basis_${section.type}`);
                        let rateInput = document.getElementById(`new_rate_${section.type}`);
                        let amountInput = document.getElementById(`amount_${section.type}`);

                        let basisValue = parseFloat(basisInput.value) || 0;
                        let rateValue = parseFloat(rateInput.value) || 0;
                        let amountValue = parseFloat(amountInput.value) || 0;

                        // Si el campo está vacío o su valor es 0, marcarlo como inválido
                        if (basisInput.value.trim() === "" || basisValue === 0) {
                            allValid = false;
                            basisInput.style.border = '2px solid red';
                        } else {
                            basisInput.style.border = '1px solid #ccc';
                        }

                        if (rateInput.value.trim() === "" || rateValue === 0) {
                            allValid = false;
                            rateInput.style.border = '2px solid red';
                        } else {
                            rateInput.style.border = '1px solid #ccc';
                        }

                        if (amountInput.value.trim() === "" || amountValue === 0) {
                            allValid = false;
                            amountInput.style.border = '2px solid red';
                        } else {
                            amountInput.style.border = '1px solid #ccc';
                        }
                    });



                    // Si todos los valores son válidos, proceder con el guardado
                    if (allValid) {
                        
                        const whtObject = {};
                        sectionsData.forEach(section => {                  
                            const {type} =  section; 
                            const basisInput = document.getElementById(`new_basis_${type}`);
                            const rateInput = document.getElementById(`new_rate_${type}`);
                            const amountInput = document.getElementById(`amount_${type}`);
                            
                            if (retentions[type].value) {
                                whtObject[type] = {
                                    nationalTax: retentions[type].value,
                                    newBasis: parseFloat(basisInput.value) || 0,
                                    newRate: parseFloat(rateInput.value) || 0,
                                    amount: parseFloat(amountInput.value) || 0,
                                    key: type
                                }
                            }
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: type,
                            fieldId: fieldId,
                            value: JSON.stringify(whtObject)
                        });
                        document.body.removeChild(container);
                        document.body.removeChild(overlay);

                        currentRecord.setCurrentSublistValue({ sublistId: type, fieldId: "custpage_co_variable_rate", value: false })
                        //checkvariableRate.classList.replace('checkbox_ck', 'checkbox_unck');
                    } else {
                        alert('⚠️ Error: Todos los campos deben contener un valor mayor a 0.');
                    }
                }
            );

            // Botón de Cancelar
            let cancelButton = createButton(
                translation.LMRY_CANCEL,
                '#D2D2D2',      // Rojo alerta 
                '#030000',      // Texto blanco
                '#B3B3B3',      // Rojo más oscuro en hover
                '#030000',
                () => {
                    currentRecord.setCurrentSublistValue({ sublistId: type, fieldId: "custpage_co_variable_rate", value: false })
                    //checkvariableRate.classList.replace('checkbox_ck', 'checkbox_unck');
                    document.body.removeChild(container);
                    document.body.removeChild(overlay);
                }
            );

            // Agregar botones al contenedor
            buttonContainer.appendChild(cancelButton);
            buttonContainer.appendChild(saveButton);

            // Agregar el contenedor de botones al modal
            container.appendChild(buttonContainer);
            // Fin de agregar botones


            document.body.appendChild(container);

            sectionsData.forEach(section => {
                calculateAmount(section.type);
            });
        }
        
        
        const getColor = () => {
            const colorIds = ["-358", "-5", "-16", "-14", "-15", "-8", "10", "-9", "-7",
                "-13", "-12", "-6", "-11", "-100", "-101", "-102", "-103", "-104", "-105", "-106", "-107", "-108",
                "-109", "-110", "-111", "-112", "-113", "-114", "-115", "-116", "-117", "-118", "-119", "-120",
                "-350", "-351", "-352", "-353", "-354", "-355", "-356", "-357",
                "-361", "-362", "-359", "-360", "-363", "-364", "-365", "-121", "-122", "-123", "-124", "-125",
                "-126", "-127", "-128", "-129", "-130", "-131", "-366", "-367",
                "-368", "-369", "-370", "-371", "-372", "-373", "-132", "-133", "-134", "-136", "-137", "-138", "-139",
                "-148", "-135", "-141", "-142", "-143", "-144", "-145",
                "-146", "-147", "-148", "-149", "-150", "-151", "-152", "-153", "-154", "-155", "-156", "-157",
                "-158", "-159", "-160", "-161", "-374", "-375", "-376", "-377",
                "-378", "-380", "-379", "-481"
            ];
    
            const colorBackgrounds = ["#002157", "#607799", "#444444", "#674218", "#888888", "#6D8C1E", "#85C1CF", "#8CB49A", "#E5772A", "#DC64A2", "#6E609D", "#AD4B4B", "#287587", "#FF6600", "#0C2475",
                "#660000", "#EAB200", "#CC0000", "#7595CC", "#D60039", "#000066", "#FFCC66", "#006600", "#BD9C00", "#CC0000", "#000066", "#663399", "#CC9900", "#B40000", "#830506",
                "#FF6600", "#CC6600", "#660000", "#CC0000", "#075699", "#001E58", "#241D4E", "#222222", "#CC0000", "#023EAD", "#990000", "#FF571C", "#222222", "#CC0000", "#000066",
                "#041C43", "#00543D", "#013875", "#000056", "#FF6600", "#8C2108", "#333333", "#000063", "#017400", "#752132", "#702C7E", "#CC0000", "#35457C", "#B69B29", "#990000",
                "#990000", "#004576", "#222222", "#990000", "#000066", "#004A83", "#00287A", "#F76507", "#990000", "#004A85", "#CC0000", "#305930", "#990000", "#002649", "#FF9900",
                "#1A2E57", "#002868", "#840029", "#211F5E", "#044520", "#FF6600", "#AD3118", "#003399", "#A20012", "#330066", "#990000", "#990032", "#990000", "#000067", "#0034AE",
                "#DE0018", "#000066", "#2B0A4F", "#000066", "#880029", "#980033", "#EF9218", "#B5AD63", "#000066", "#8B0222", "#333399", "#000066", "#892020", "#3A027C", "#03492F", "#002654"
            ]

            const colorId = runtime.getCurrentUser().getPreference({
                name: 'COLORTHEME'
            });
            let i = colorIds.indexOf(colorId);
            if (i == -1) i = 0;
            return colorBackgrounds[i];
        }

        const openSubForm = () => {

            let style = document.createElement('link');
            style.rel = 'stylesheet';
            style.href = 'https://system.netsuite.com/core/media/media.nl?id=514118&c=TSTDRV1038906&h=b4af44a9b704b0222e5b&_xt=.css';
            document.head.appendChild(style);


            let jquery = document.createElement('script');
            jquery.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js';
            document.head.appendChild(jquery);

            jquery = document.createElement('script');
            jquery.src = 'https://system.netsuite.com/core/media/media.nl?id=427070&c=TSTDRV1038906&h=3495197c2dceba538ccd&_xt=.js';
            document.head.appendChild(jquery);

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
                    "LMRY_NATIONAL_TAX":"NATIONAL TAX",
                    "LMRY_SAVE":"Save",
                    "LMRY_CANCEL":"Cancel",
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
                    "LMRY_NATIONAL_TAX":"iMPUESTO NACIONAL",
                    "LMRY_SAVE":"Guardar",
                    "LMRY_CANCEL":"Cancelar",
                }
            }
            return translatedFields[language];
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
        


        

        const createWhtUpdateButton = (context) => {
            const { form, newRecord } = context;
            const {type} = newRecord;
            const fieldsToCheck = [
              'custcol_lmry_co_autoretecree',
              'custcol_lmry_co_retefte',
              'custcol_lmry_co_reteica',
              'custcol_lmry_co_reteiva'
            ];
          
            const numTransaction = newRecord.getLineCount({ sublistId: 'item' });
            let hasRetencion = false;
          
            for (let i = 0; i < numTransaction; i++) {
              if (fieldsToCheck.some(fieldId => newRecord.getSublistValue({ sublistId: 'item', fieldId, line: i }))) {
                hasRetencion = true;
                break;
              }
            }
          
            form.addButton({
              id: 'custpage_id_button_ud_whx',
              label: 'UPDATE WHT',
              functionName: `updateRetention('${type}')`
            });
          
            const pathScript = {
              "vendorbill" : "../../pluginImpl/vendorbill/LMRY_VendorBill_CO_CLNT_HNDL.js",
              "vendorcredit" : "../../pluginImpl/vendorcredit/LMRY_VendorCredit_CO_CLNT_HNDL.js",
              "invoice" : "../../pluginImpl/invoice/LMRY_Invoice_CO_CLNT_HNDL.js",
              "creditmemo": "../../pluginImpl/creditmemo/LMRY_CreditMemo_CO_CLNT_HNDL.js"
            }
          
            form.clientScriptModulePath = pathScript[type];
          
            if (hasRetencion) {
              form.getButton({ id: 'custpage_id_button_ud_whx' }).isDisabled = true;
            }
          
        };

        const updateRetention = (type) => {
            const {id} = currentRecord.get();
            const transactionID = Number(id) || "";
            const transactionRecord = record.load({ type, id: transactionID });
            const entityId = transactionRecord.getValue("entity");

            if (entityId) {
                if (type) {
                    const filters = [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custrecord_lmry_co_entity", "anyof", entityId],
                        "AND",
                        ["custrecord_lmry_co_ent_trantype", "anyof", type]
                    ];

                    const FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                    if (FEAT_SUBS) {
                        const subsidiary = transactionRecord.getValue("subsidiary");
                        filters.push("AND", ["custrecord_lmry_co_subsi_reten", "anyof", subsidiary]);
                    }

                    const columns = [
                                        "custrecord_lmry_co_retefte", 
                                        "custrecord_lmry_co_autoretecree", 
                                        "custrecord_lmry_co_reteica", 
                                        "custrecord_lmry_co_reteiva"
                                    ];
                    search.create({
                        type: "customrecord_lmry_entity_fields",
                        filters,
                        columns
                    }).run().each(result => {
                        const [reteica, reteiva, retefte, retecree] = columns.map(col => result[0].getValue(col) || "");

                        const updateSublistValues = (sublistId) => {
                            const numLines = transactionRecord.getLineCount({ sublistId });
                            for (let i = 0; i < numLines; i++) {
                                const applyWht = transactionRecord.getSublistValue({ sublistId, fieldId: 'custcol_lmry_apply_wht_tax', line: i });
                                if (applyWht === 'T' || applyWht === true) {
                                    transactionRecord.setSublistValue({ sublistId, fieldId: 'custcol_lmry_co_autoretecree', line: i, value: retecree });
                                    transactionRecord.setSublistValue({ sublistId, fieldId: 'custcol_lmry_co_retefte', line: i, value: retefte });
                                    transactionRecord.setSublistValue({ sublistId, fieldId: 'custcol_lmry_co_reteica', line: i, value: reteica });
                                    transactionRecord.setSublistValue({ sublistId, fieldId: 'custcol_lmry_co_reteiva', line: i, value: reteiva });
                                }
                            }
                        };

                        ['item', 'expense', 'expcost', 'itemcost', 'time'].forEach(updateSublistValues);
                        transactionRecord.save({ disableTriggers: true }); // no se ejecutan los user events
                        window.location.reload();
                    });
                }
            }
        }


        return {
            executePopup:executePopup,
            loadDataVariableRate:loadDataVariableRate,
            getFeatureVariableRate:getFeatureVariableRate,
            createWhtUpdateButton,
            updateRetention
        };
    });