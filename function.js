function createPopup(checkvariableRate,context) {
    var mode = context.mode;
    var currentRecord = context.currentRecord;
    var index = getPosition(checkvariableRate);

    var listWhtVariableRate = []; 
    var jsonVariableRate = currentRecord.getValue("custbody_lmry_features_active");
    if (jsonVariableRate) {
      listWhtVariableRate = JSON.parse(jsonVariableRate);
    }
    var itemVariableRate;
    if (listWhtVariableRate.length) {
       itemVariableRate = listWhtVariableRate[index];
    }

    currentRecord.selectLine({ sublistId: "item", line: index });
    
    var item = {
      value: currentRecord.getCurrentSublistValue({ sublistId: "item", fieldId: "item" }),
      text: currentRecord.getCurrentSublistText({ sublistId: "item", fieldId: "item" })
    };

    var retecree = {
      value: currentRecord.getCurrentSublistValue({ sublistId: "item", fieldId: "custpage_lmry_co_autoretecree" }),
      text: currentRecord.getCurrentSublistText({ sublistId: "item", fieldId: "custpage_lmry_co_autoretecree" })
    };
    var retefte = {
      value: currentRecord.getCurrentSublistValue({ sublistId: "item", fieldId: "custpage_lmry_co_retefte" }),
      text: currentRecord.getCurrentSublistText({ sublistId: "item", fieldId: "custpage_lmry_co_retefte" })
    };
    var reteica = {
      value: currentRecord.getCurrentSublistValue({ sublistId: "item", fieldId: "custpage_lmry_co_reteica" }),
      text: currentRecord.getCurrentSublistText({ sublistId: "item", fieldId: "custpage_lmry_co_reteica" })
    };
    var reteiva = {
      value: currentRecord.getCurrentSublistValue({ sublistId: "item", fieldId: "custpage_lmry_co_reteiva" }),
      text: currentRecord.getCurrentSublistText({ sublistId: "item", fieldId: "custpage_lmry_co_reteiva" })
    };

    console.log("retecree :",retecree.text)
    console.log("retefte :",retefte.text)
    console.log("reteica :",reteica.text)
    console.log("reteiva :",reteiva.text)
    
    if (retecree.value || retefte.value || reteica.value || reteiva.value) {
      Ext.onReady(function () {
        // Crear campos de texto
        var createTextField = function (label,value,mainField) {

          var field = {
            xtype: 'textfield',
            fieldLabel: label,
            labelAlign: 'top',
            anchor: '100%',
            //disabled:true,
            //labelStyle: 'font-weight:bold; color:#FF0000;'
          }

          if (value) {
            field.value = value
          }
          if (mainField) {
            field.readOnly = true;
          }
          return field;
        };
        
        var createTextFieldItem = function (label, value) {
          return {
              xtype: 'textfield',
              fieldLabel: label,
              labelAlign: 'top',
              labelWidth: 50,
              width: 100,  // Anchura del campo de texto
              readOnly: true,
              labelStyle: 'font-weight:bold; color:#FF0000; font-size: 12px;',
              value: value,
              fieldStyle: 'background-color: #f0f0f0; color: #615D5C; font-weight: bold;', // Estilo del campo
              //style: 'border: 2px solid #FF0000; padding: 5px;' // Estilo del contenedor del campo
          };
        };

        
        
        // Crear paneles para cada sección
        var createPanel = function (title,items) {
          return {
            xtype: 'fieldset',
            width: 200,
            title: title,
            flex: 1,
            layout: 'anchor',
            margin: '40 10',
            defaults: {
              anchor: '100%'
            },
            items:items
          };
        };

        var panels = [];
        
        if (retecree.value) {
          
          var itemsPopup = [
            createTextField(' NATIONAL TAX',retecree.text,true)
          ];

          if (itemVariableRate) {
            if (itemVariableRate.cree) {
              if (itemVariableRate.cree.newBasis) {
                itemsPopup.push(createTextField(' NEW BASIS',itemVariableRate.cree.newBasis,false));
              }else{
                itemsPopup.push(createTextField(' NEW BASIS',null,false));
              }

              if (itemVariableRate.cree.newRate) {
                itemsPopup.push(createTextField(' NEW RATE',itemVariableRate.cree.newRate,false));
              }else{
                itemsPopup.push(createTextField(' NEW RATE',null,false));
              }
              if (itemVariableRate.cree.amount) {
                itemsPopup.push(createTextField(' AMOUNT',itemVariableRate.cree.amount,false));
              }else{
                itemsPopup.push(createTextField(' AMOUNT',null,false));
              }
            }  
          }
          panels.push(createPanel('RETECREE DETAIL',itemsPopup));

        }
        if (retefte.value) {
          var itemsPopup = [
            createTextField(' NATIONAL TAX',retefte.text,true)
          ];

          if (itemVariableRate) {
            if (itemVariableRate.fte) {
              if (itemVariableRate.fte.newBasis) {
                itemsPopup.push(createTextField(' NEW BASIS',itemVariableRate.fte.newBasis,false));
              }else{
                itemsPopup.push(createTextField(' NEW BASIS',null,false));
              }

              if (itemVariableRate.fte.newRate) {
                itemsPopup.push(createTextField(' NEW RATE',itemVariableRate.fte.newRate,false));
              }else{
                itemsPopup.push(createTextField(' NEW RATE',null,false));
              }
              if (itemVariableRate.fte.amount) {
                itemsPopup.push(createTextField(' AMOUNT',itemVariableRate.fte.amount,false));
              }else{
                itemsPopup.push(createTextField(' AMOUNT',null,false));
              }
            }  
          }
          panels.push(createPanel('RETEFTE DETAIL',itemsPopup));
        }
        if (reteica.value) {
          var itemsPopup = [
            createTextField(' NATIONAL TAX',reteica.text,true)
          ];

          if (itemVariableRate) {
            if (itemVariableRate.ica) {
              if (itemVariableRate.ica.newBasis) {
                itemsPopup.push(createTextField(' NEW BASIS',itemVariableRate.ica.newBasis,false));
              }else{
                itemsPopup.push(createTextField(' NEW BASIS',null,false));
              }

              if (itemVariableRate.ica.newRate) {
                itemsPopup.push(createTextField(' NEW RATE',itemVariableRate.ica.newRate,false));
              }else{
                itemsPopup.push(createTextField(' NEW RATE',null,false));
              }
              if (itemVariableRate.ica.amount) {
                itemsPopup.push(createTextField(' AMOUNT',itemVariableRate.ica.amount,false));
              }else{
                itemsPopup.push(createTextField(' AMOUNT',null,false));
              }
            }  
          }
          panels.push(createPanel('RETEICA DETAIL',itemsPopup));
        }
        if (reteiva.value) {
          var itemsPopup = [
            createTextField(' NATIONAL TAX',reteiva.text,true)
          ];

          if (itemVariableRate) {
            if (itemVariableRate.iva) {
              if (itemVariableRate.iva.newBasis) {
                itemsPopup.push(createTextField(' NEW BASIS',itemVariableRate.iva.newBasis,false));
              }else{
                itemsPopup.push(createTextField(' NEW BASIS',null,false));
              }

              if (itemVariableRate.iva.newRate) {
                itemsPopup.push(createTextField(' NEW RATE',itemVariableRate.iva.newRate,false));
              }else{
                itemsPopup.push(createTextField(' NEW RATE',null,false));
              }
              if (itemVariableRate.iva.amount) {
                itemsPopup.push(createTextField(' AMOUNT',itemVariableRate.iva.amount,false));
              }else{
                itemsPopup.push(createTextField(' AMOUNT',null,false));
              }
            }  
          }
          panels.push(createPanel('RETEIVA DETAIL',itemsPopup));
        }

        if (panels.length < 4) {
          panels.unshift({ xtype: 'component', flex: 1 });
          panels.push({ xtype: 'component', flex: 1 });
        }

        // Crear el popup
        var popup = Ext.create('Ext.window.Window', {
          title: 'Configuracion de tarifa variable',
          width: 1000,
          height: 500,
          layout: {
            type: 'vbox',
            align: 'stretch'
          },
          items: [
            {
              xtype: 'container',
              layout: 'anchor',
              padding: '20 10 0 10',
              items: [
                createTextFieldItem('ITEM',item.text)
              ]
            },
            {
              xtype: 'container',
              layout: {
                type: 'hbox',
                pack: 'center',
                align: 'stretch'
              },
              flex: 1,
              defaults: {
                flex: 1,
                layout: 'hbox',
                align: 'stretch'
              },
              items: panels
            }
          ],
          buttons: [
            {
                text: 'Aceptar',
                handler: function() {
                  if(checkvariableRate.classList.contains('checkbox_ck')) {
                    checkvariableRate.classList.remove('checkbox_ck');
                    checkvariableRate.classList.add('checkbox_unck');
                  }
                  popup.close();
                }
            },
            {
                text: 'Cancelar',
                handler: function() {           
                  if(checkvariableRate.classList.contains('checkbox_ck')) {
                    checkvariableRate.classList.remove('checkbox_ck');
                    checkvariableRate.classList.add('checkbox_unck');
                  }
                  popup.close();
                }
            }
        ]
        });
        
        // Mostrar el popup
        popup.show();

        checkvariableRate.addEventListener('click', function(event) {        
          if (checkvariableRate.classList.contains('checkbox_unck')) {
            console.log('CHECK DESACTIVO entrado');
            popup.close();
          }
        });

      });
    }else{
      Ext.onReady(function () {
        Ext.Msg.alert('Advertencia', 'Debe configurar por lo menos un tipo de retención.', function () {

          if (checkvariableRate.classList.contains('checkbox_ck')) {
            checkvariableRate.classList.remove('checkbox_ck');
            checkvariableRate.classList.add('checkbox_unck');
          }
        });
      });
    }

    
    

  }