/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                    ||
||                                                             ||
||  File Name: LMRY_MX_Popup_Pedimentos_STLT.js                ||
||                                                             ||
||  Version Date         Author        Remarks                 ||
||  2.0     Ago 21 2021  LatamReady    Use Script 2.0          ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/log', 'N/ui/serverWidget', 'N/runtime'],

    function (record, search, log, serverWidget, runtime) {

        var LMRY_script = 'LatamReady - POPUP Pedimentos STLT';
        var LANGUAGE = '';
        var FORM = '';

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */

        function onRequest(context) {

            try {

                if (context.request.method == 'GET') {

                    LANGUAGE = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" });
                    LANGUAGE = LANGUAGE.substring(0, 2);

                    var item_id = context.request.parameters.param_item;
                    var item_descrip = context.request.parameters.param_descrip;
                    var location_id = context.request.parameters.param_lct;
                    var lote_id = context.request.parameters.param_lote;
                    var quantity = context.request.parameters.param_quantity;
                    var line_id = context.request.parameters.param_line;

                    FORM = serverWidget.createForm({ title: getText('title'), hideNavBar: true });
                    FORM.addFieldGroup({ id: 'group_pi', label: getText('group') });

                    var p_item = FORM.addField({ id: 'custpage_id_item', label: getText('item'), type: serverWidget.FieldType.SELECT, container: 'group_pi', source: 'item' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    var p_descrip = FORM.addField({ id: 'custpage_id_descrip', label: getText('descrip'), type: serverWidget.FieldType.TEXT, container: 'group_pi' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    var p_lct = FORM.addField({ id: 'custpage_id_lct', label: getText('location'), type: serverWidget.FieldType.SELECT, container: 'group_pi', source: 'location' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    var p_lote = FORM.addField({ id: 'custpage_id_lote', label: getText('lote'), type: serverWidget.FieldType.SELECT, container: 'group_pi', source: 'inventorynumber' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    var p_quantity = FORM.addField({ id: 'custpage_id_quantity', label: getText('totalquantity'), type: serverWidget.FieldType.TEXT, container: 'group_pi' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                    if (lote_id != null && lote_id != '') {
                        p_lote.defaultValue = lote_id;
                    }

                    if (item_descrip != null && item_descrip != '') {
                        p_descrip.defaultValue = item_descrip;
                    }

                    p_item.defaultValue = item_id;
                    p_lote.defaultValue = lote_id;
                    p_lct.defaultValue = location_id;
                    p_quantity.defaultValue = quantity;

                    //Llenado de tablaa
                    var SubTabla = FORM.addSublist({ id: 'custpage_id_sublista', type: serverWidget.SublistType.LIST, label: getText('subtab'), tab: 'custpage_tab1' });

                    //Número de Pedimento
                    var pedimento = SubTabla.addField({ id: 'custpage_pedimento', label: 'PEDIMENTO', type: serverWidget.FieldType.TEXT });
                    //pedimento.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

                    var quantity_onhand_ped = SubTabla.addField({ id: 'custpage_cant_onhand', label: getText('onhand'), type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                    quantity_onhand_ped.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                    var quantity = SubTabla.addField({ id: 'custpage_quantity_ped', label: getText('quantity'), type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

                    //Cantidad disponible en stock
                    var quantity_remaining_ped = SubTabla.addField({ id: 'custpage_cant_remaining', label: getText('remaining'), type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                    quantity_remaining_ped.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                    //Fecha de pedimento
                    var date_ped = SubTabla.addField({ id: 'id_date', label: getText('pedate'), type: serverWidget.FieldType.DATE }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                    date_ped.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    //date_ped.isMandatory = true;

                    var AduanaSeach = search.create({
                        type: 'customrecord_lmry_mx_aduana',
                        columns: ['internalid', 'name'],
                        filters: [['isinactive', 'is', 'F']]
                    });
                    AduanaSeach = AduanaSeach.run().getRange(0, 1000);
                    //Codigo de Aduana
                    var aduana = SubTabla.addField({ id: 'id_aduana', label: 'ADUANA', type: serverWidget.FieldType.SELECT });
                    aduana.addSelectOption({ value: 0, text: ' ' });
                    for (var i = 0; i < AduanaSeach.length; i++) {
                        aduana.addSelectOption({ value: AduanaSeach[i].getValue('internalid'), text: AduanaSeach[i].getValue('name') });
                    }
                    aduana.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    //aduana.isMandatory = true;

                    var Filter_Pedimento = [];

                    //Filtro Item
                    var Filter_Item = search.createFilter({ name: 'custrecord_lmry_mx_ped_item', operator: search.Operator.IS, values: item_id });

                    //Filtro Item Location
                    var Filter_Location = search.createFilter({ name: 'custrecord_lmry_mx_ped_location', operator: search.Operator.IS, values: location_id });

                    Filter_Pedimento.push(Filter_Item);
                    Filter_Pedimento.push(Filter_Location);

                    if (lote_id) {
                        //Si el item cuenta con lote/serie se añadirá como filtro
                        var Filter_Inventory = search.createFilter({ name: 'custrecord_lmry_mx_ped_lote_serie', operator: search.Operator.ANYOF, values: lote_id });
                        Filter_Pedimento.push(Filter_Inventory);
                    }


                    var search_pedimento_details = search.create({
                        type: "customrecord_lmry_mx_pedimento_details",
                        filters: Filter_Pedimento,
                        columns:
                            [search.createColumn({ name: "custrecord_lmry_mx_ped_num", summary: "GROUP", label: "Latam - MX Nro Pedimento" }),
                            search.createColumn({ name: "custrecord_lmry_mx_ped_quantity", summary: "SUM", label: "Latam - MX Pedimento Quantity" }),
                            search.createColumn({ name: "custrecord_lmry_mx_ped_date", summary: "GROUP", label: "Latam - MX Pedimento Date", sort: search.Sort.ASC }),
                            search.createColumn({ name: "custrecord_lmry_mx_ped_aduana", summary: "GROUP", label: "Latam - MX Aduana" })]
                    });

                    var result_pedimento_details = search_pedimento_details.run().getRange(0, 1000);
                    var k = 0;

                    if (result_pedimento_details != null && result_pedimento_details.length > 0) {

                        for (var j = 0; j < result_pedimento_details.length; j++) {
                            var row = result_pedimento_details[j].columns;

                            var numPed = result_pedimento_details[j].getValue(row[0]);
                            var cantidadPed = result_pedimento_details[j].getValue(row[1]);
                            var datePed = result_pedimento_details[j].getValue(row[2]);
                            var aduanaPed = result_pedimento_details[j].getValue(row[3]);

                            if (cantidadPed > 0) {
                                SubTabla.setSublistValue({ id: 'custpage_pedimento', line: k, value: numPed });
                                SubTabla.setSublistValue({ id: 'custpage_cant_onhand', line: k, value: cantidadPed });
                                if (datePed) SubTabla.setSublistValue({ id: 'id_date', line: k, value: datePed });
                                if (aduanaPed) SubTabla.setSublistValue({ id: 'id_aduana', line: k, value: aduanaPed });
                                k++;
                            }
                        }
                    }

                    FORM.addButton({
                        id: 'custpage_lmry_submit',
                        label: getText('save'),
                        functionName: 'updateParent("' + line_id + '")'
                    });

                    FORM.clientScriptModulePath = './Latam_Library/LMRY_MX_Popup_Pedimento_CLNT.js';

                    //FORM.addSubmitButton({label: getText('save')});
                    FORM.addButton({ label: getText('cancel'), id: 'custpage_cancel', functionName: 'cancel("' + line_id + '")' });

                    // Dibuja el fomulario
                    context.response.writePage(FORM);

                }

            } catch (msgerr) {
                log.error("Error", msgerr);
            }

        }

        var TEXT_BY_LANG = {
            'title': { 'en': 'LatamReady - MX Pedimento Details', 'es': 'LatamReady - MX Detalle Pedimentos', 'pt': 'LatamReady - MX Detalhe Pedimento' },
            'group': { 'en': 'Primary Information', 'es': 'Información Primaria', 'pt': 'Informação Primária' },
            'message': { 'en': "Important: Access is not allowed. <br> <br>", 'es': "Importante: El acceso no está permitido.<br><br>", 'pt': "Importante: o acesso não é permitido.<br><br>" },
            'sub': { 'en': 'Subsidiary', 'es': 'Subsidiaria', 'pt': 'Subsidiária' },
            'pedquantity': { 'en': 'Pedimento Quantity', 'es': 'Cantidad Pedimento', 'pt': 'Quantidade Pedimento' },
            'trans': { 'en': 'Transaction', 'es': 'Transacción', 'pt': 'Transação ' },
            'date': { 'en': 'Date', 'es': 'Fecha', 'pt': 'Data' },
            'subtab': { 'en': 'Pedimento Details', 'es': 'Detalle Pedimentos', 'pt': 'Detalle Pedimentos' },
            'item': { 'en': 'Item', 'es': 'Artículo', 'pt': 'Artigo' },
            'descrip': { 'en': 'Description', 'es': 'Descripción', 'pt': 'Descrição' },
            'internalid': { 'en': 'Internal ID', 'es': 'ID Interno', 'pt': 'ID Interno' },
            'location': { 'en': 'Location', 'es': 'Ubicación', 'pt': 'Localização' },
            'lote': { 'en': 'Batch / Series', 'es': 'Lote / Serie', 'pt': 'Lote / Série' },
            'quantity': { 'en': 'Quantity', 'es': 'Cantidad', 'pt': 'Quantidade' },
            'totalquantity': { 'en': 'Total Quantity', 'es': 'Cantidad Total', 'pt': 'Quantidade Total' },
            'remaining': { 'en': 'Remaining', 'es': 'Restante', 'pt': 'Remanescente' },
            'onhand': { 'en': 'On Hand', 'es': 'En Mano', 'pt': 'Na Mão' },
            'pedate': { 'en': 'Pedimento Date', 'es': 'Fecha de Pedimento', 'pt': 'Data do Pedimento' },
            'save': { 'en': 'Save', 'es': 'Guardar', 'pt': 'Salvar' },
            'cancel': { 'en': 'Cancel', 'es': 'Cancelar', 'pt': 'Cancelar' },
            'reset': { 'en': 'Reset', 'es': 'Reiniciar', 'pt': 'Reiniciar' },
        }

        function getText(key) {
            if (TEXT_BY_LANG[key]) {
                return TEXT_BY_LANG[key][LANGUAGE] || TEXT_BY_LANG[key]['en'];
            }
            return '';
        }

        return {
            onRequest: onRequest
        };

    });