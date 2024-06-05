function createPopup() {
    Ext.onReady(function() {
        // Crear campos de texto
        var createTextField = function(label) {
            return {
                xtype: 'textfield',
                fieldLabel: label,
                labelAlign: 'top',
                anchor: '100%',
                //disabled:true,
                //labelStyle: 'font-weight:bold; color:#FF0000;'
            };
        };

        var createTextFieldItem = function(label) {
            return {
                xtype: 'textfield',
                fieldLabel: label,
                labelAlign: 'top',
                labelWidth: 50,
                //anchor: '100%',
                with: 100,  // Altura del campo de texto
                disabled:true,
                labelStyle: 'font-weight:bold; color:#FF0000; font-size: 16px;'
            };
        };

        // Crear paneles para cada sección
        var createPanel = function(title) {
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
                items: [
                    createTextField(' NATIONAL TAX'),
                    createTextField(' NEW BASIS'),
                    createTextField(' NEW RATE'),
                    createTextField(' AMOUNT')
                ]
            };
        };

        var panels = [
            createPanel('RETEFTE DETAIL'),
            createPanel('RETEICA DETAIL'),
            createPanel('RETEIVA DETAIL'),
            createPanel('RETECREE DETAIL'),
        ];

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
                        createTextFieldItem('ITEM')
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
                        popup.close();
                    }
                },
                {
                    text: 'Cancelar',
                    handler: function() {
                        popup.close();
                    }
                }
            ]
        });

        // Mostrar el popup
        popup.show();
    });
}

createPopup();
  