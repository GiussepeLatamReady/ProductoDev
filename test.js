/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/ui/serverWidget'], function(record, serverWidget) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW || context.type === context.UserEventType.EDIT) {
            var form = context.form;
            var sublist = form.getSublist({ id: 'item' });

            // Añadir un campo de columna de texto
            sublist.addField({
                id: 'custcol_button_column',
                type: serverWidget.FieldType.TEXT,
                label: 'Button'
            });

            // Añadir estilo al botón y script para reemplazar texto con HTML
            const styleAndScript = `
                <style>
                    .button-variable {
                        display: inline-block;
                        padding: 5px 10px;
                        background-color: #007bff;
                        color: white;
                        text-align: center;
                        cursor: pointer;
                        border-radius: 5px;
                        user-select: none;
                        transition: background-color 0.3s;
                    }
                    .button-variable:hover {
                        background-color: #0056b3;
                    }
                    .button-variable:active {
                        background-color: #004494;
                    }
                </style>
                <script>
                    document.addEventListener("DOMContentLoaded", function() {
                        var buttonFields = document.querySelectorAll("[id^='item_custcol_button_column']");
                        buttonFields.forEach(function(field) {
                            if (field && field.innerText === 'Botón') {
                                field.innerHTML = '<div class="button-variable" onclick="alert(\\'¡Botón presionado!\\')">P</div>';
                            }
                        });
                    });
                </script>
            `;

            form.addField({
                id: 'custpage_button_style',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            }).defaultValue = styleAndScript;
        }

        if (context.type === context.UserEventType.EDIT) {
            var newRecord = context.newRecord;
            var itemCount = newRecord.getLineCount({ sublistId: 'item' });

            for (var i = 0; i < itemCount; i++) {
                var buttonHtml = 'Botón';
                newRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_button_column',
                    line: i,
                    value: buttonHtml
                });
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };

});
