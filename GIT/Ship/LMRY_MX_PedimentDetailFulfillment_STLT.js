/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_MX_PedimentDetailFulfillment_STLT.js        ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Ago 01 2020  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
//@ts-check
// @ts-ignore
define(['N/record', 'N/log', 'N/xml', 'N/ui/serverWidget', 'N/search', 'N/runtime', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],

    function (record, log, xml, serverWidget, search, runtime, library) {
        // Nombre del Script
        var LMRY_script = "LatamReady - MX Pedimentos Detail Fulfillment";
        var FORM = '';
        var LANGUAGE = '';

        function onRequest(context) {
            try {
                LANGUAGE = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" });
                LANGUAGE = LANGUAGE.substring(0, 2);
                var shipmentID = context.request.parameters.shipmentid;
                if (shipmentID == '' || shipmentID == null) {
                    return true;
                }

                if (context.request.method == 'GET') {

                    var recordShipment = search.lookupFields({
                        type: search.Type.ITEM_FULFILLMENT,
                        id: shipmentID,
                        columns: ['trandate', 'internalid', 'subsidiary', 'createdfrom', 'tranid']
                    });

                    var trandate = recordShipment.trandate;

                    //Features
                    var subsi_OW = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                    var FEAT_INVENTORY = runtime.isFeatureInEffect({ feature: "advbinseriallotmgmt" });

                    //Se crea formulario
                    FORM = serverWidget.createForm({ title: getText('title') });

                    FORM.addFieldGroup({ id: 'group_pi', label: getText('group') });

                    //Subsidiary --one world--
                    if (subsi_OW == true) {
                        //Subsidiary
                        var p_subsi = FORM.addField({ id: 'custpage_id_subsi', label: getText('sub'), type: serverWidget.FieldType.SELECT, container: 'group_pi' });
                        p_subsi.addSelectOption({ value: recordShipment.subsidiary[0].value, text: recordShipment.subsidiary[0].text });
                        p_subsi.isMandatory = true;
                    }

                    //Created from
                    var p_source = FORM.addField({ id: 'custpage_id_source', label: getText('source'), type: serverWidget.FieldType.SELECT, container: 'group_pi' });
                    p_source.addSelectOption({ value: recordShipment.createdfrom[0].value, text: recordShipment.createdfrom[0].text });
                    p_source.isMandatory = true;


                    //Transaction
                    var p_trans = FORM.addField({ id: 'custpage_id_trans', label: getText('trans'), type: serverWidget.FieldType.SELECT, container: 'group_pi' });
                    p_trans.addSelectOption({ value: shipmentID, text: "Item Shipment #" + recordShipment.tranid });
                    p_trans.isMandatory = true;


                    //Fecha actual
                    var p_date = FORM.addField({ id: 'custpage_id_date', label: getText('date'), type: serverWidget.FieldType.DATE, source: 'date', container: 'group_pi' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    p_date.isMandatory = true;

                    //Llenado de tabla
                    var SubTabla = FORM.addSublist({ id: 'custpage_id_sublista', type: serverWidget.SublistType.LIST, label: getText('items'), tab: 'custpage_tab1' });

                    //Internal ID Item
                    var internalID = SubTabla.addField({ id: 'id_int', label: getText('internalid'), type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                    internalID.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    //Item
                    SubTabla.addField({ id: 'id_item', label: getText('item'), type: serverWidget.FieldType.SELECT, source: 'item' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                    //Item Descripción
                    var descrip = SubTabla.addField({ id: 'custpage_description', label: getText('descrip'), type: serverWidget.FieldType.TEXT })/*.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY})*/;
                    descrip.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                    //Item Location
                    SubTabla.addField({ id: 'id_location', label: getText('location'), type: serverWidget.FieldType.SELECT, source: 'location' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                    //Item Lote Serie
                    SubTabla.addField({ id: 'custpage_lote', label: getText('lote'), type: serverWidget.FieldType.SELECT, source: "inventorynumber" }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                    //Item Cantidad
                    var quantity = SubTabla.addField({ id: 'custpage_quantity', label: getText('quantity'), type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                    quantity.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                    //Checkbox POPUP
                    SubTabla.addField({ id: 'id_popup', label: 'Pedimento', type: serverWidget.FieldType.CHECKBOX });

                    // JSON Popup
                    var popup_data = SubTabla.addField({ id: 'custpage_popup_data_detail', label: 'POPUP DATA', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                    popup_data.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    var line_id = SubTabla.addField({ id: 'custpage_line_id', label: 'LINE ID', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                    line_id.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    //Filtro por transacción
                    var Filter_Trans = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: shipmentID });

                    /* Busqueda personalizada LatamReady - MX Pediment Lines*/
                    // Devuelve las líneas de item de las transacciones que cuentan con check activado de pedimento
                    var search_items_ped = search.load({ id: 'customsearch_lmry_mx_ped_receipt_lines' });

                    search_items_ped.filters.push(Filter_Trans);
                    search_items_ped.columns.push(search.createColumn({
                        name: "purchasedescription",
                        join: "item"
                    }));
                    var colFields = search_items_ped.columns;

                    var result_items_ped = search_items_ped.run().getRange(0, 1000);

                    /**
                     * Modificacion kit/package
                     * -----------------------------------------------------------------------------------------------------------------------------
                     */

                    var recordShipment = record.load({
                        type: search.Type.ITEM_FULFILLMENT,
                        id: shipmentID,
                        isDynamic: false,
                    });

                    var numItems = recordShipment.getLineCount({ sublistId: "item" });
                    var index = 0;
                    var kitItemxPediment = {};
                    for (var i = 0; i < numItems; i++) {
                        if (recordShipment.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i }) === "Kit") {
                            kitItemxPediment[recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitlineid', line: i })] = recordShipment.getSublistText({ sublistId: "item", fieldId: "custcol_lmry_mx_pediment", line: i });
                        }
                        if (recordShipment.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i }) === "Kit" || recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitmemberof', line: i }) === "") continue;
                        if (kitItemxPediment[recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitmemberof', line: i })] === "F") continue;
                        // if (recordShipment.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: index }) === "Kit") continue;
                        var trandate = recordShipment.getValue("trandate");
                        var itemID = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        var location = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i });
                        var quantity = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                        var itemDescription = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'itemdescription', line: i });
                        // quantity = Number(quantity).toFixed(0);
                        // var itemReceive = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'itemreceive', line: i });
                        var inventoryDetail = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'inventorydetail', line: i });
                        if (inventoryDetail) {
                            var inventorydetailRecord = recordShipment.getSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: i });
                            var cLineas = inventorydetailRecord.getLineCount({ sublistId: 'inventoryassignment' });
                            for (var j = 0; j < cLineas; j++) {
                                var lote = inventorydetailRecord.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: j });
                                // var loteText = inventorydetailRecord.getSublistText({ sublistId: 'inventoryassignment', fieldId: 'inventorynumber', line: j });
                                var loteQuantity = inventorydetailRecord.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', line: j });
                                if (Number(itemID))
                                    SubTabla.setSublistValue({ id: 'id_int', line: index, value: itemID });
                                if (Number(itemID))
                                    SubTabla.setSublistValue({ id: 'id_item', line: index, value: itemID });
                                if (itemDescription != null && itemDescription != "")
                                    SubTabla.setSublistValue({ id: 'custpage_description', line: index, value: itemDescription });
                                if (Number(location))
                                    SubTabla.setSublistValue({ id: 'id_location', line: index, value: location });
                                if (trandate != null && trandate != "")
                                    SubTabla.setSublistValue({ id: 'id_date', line: index, value: trandate });
                                SubTabla.setSublistValue({ id: 'custpage_line_id', line: index, value: index });
                                if (Number(lote))
                                    SubTabla.setSublistValue({ id: 'custpage_lote', line: index, value: lote });
                                if (Number(loteQuantity)) {
                                    SubTabla.setSublistValue({ id: 'custpage_quantity', line: index, value: Math.round(loteQuantity) });
                                } else {
                                    SubTabla.setSublistValue({ id: 'custpage_quantity', line: index, value: Math.round(quantity) });
                                }
                                log.debug({
                                    title: "type",
                                    details: [
                                        trandate, itemID, location, quantity, itemDescription, lote, loteQuantity
                                    ]
                                });
                                index++;
                            }
                        } else {
                            if (Number(itemID))
                                SubTabla.setSublistValue({ id: 'id_int', line: index, value: itemID });
                            if (Number(itemID))
                                SubTabla.setSublistValue({ id: 'id_item', line: index, value: itemID });
                            if (itemDescription != null && itemDescription != "")
                                SubTabla.setSublistValue({ id: 'custpage_description', line: index, value: itemDescription });
                            if (Number(location))
                                SubTabla.setSublistValue({ id: 'id_location', line: index, value: location });
                            if (trandate != null && trandate != "")
                                SubTabla.setSublistValue({ id: 'id_date', line: index, value: trandate });
                            SubTabla.setSublistValue({ id: 'custpage_line_id', line: index, value: index });
                            // if (Number(lote))
                            //     SubTabla.setSublistValue({ id: 'custpage_lote', line: index, value: loteText });
                            if (Number(quantity))
                                SubTabla.setSublistValue({ id: 'custpage_quantity', line: index, value: Math.round(quantity) });
                            log.debug({
                                title: "type",
                                details: [
                                    trandate, itemID, location, quantity, itemDescription
                                ]
                            });
                            index++;
                        }

                    }
                    /**
                    * --------------------------------------------------------------------------------------------------------------------------------------------------------
                    */


                    var idLog = '';
                    var numPed = '';

                    if (result_items_ped != null && result_items_ped.length > 0) {
                        for (var i = 0; i < result_items_ped.length; i++) {

                            var Filter_Pedimento = new Array();


                            var ITEM_ID = "" + result_items_ped[i].getValue(colFields[5]);
                            var ITEM_NAME = "" + result_items_ped[i].getText(colFields[5]);
                            var LOCATION_ID = "" + result_items_ped[i].getValue(colFields[3]);
                            var INVENTORY_DETAIL = "";


                            if (FEAT_INVENTORY == true || FEAT_INVENTORY == 'T') {
                                INVENTORY_DETAIL = "" + result_items_ped[i].getValue(colFields[6]);
                                var INVENTORY_NUMBER = "" + result_items_ped[i].getValue(colFields[8]);
                            }

                            var ITEM_DESCRIPTION = result_items_ped[i].getValue(colFields[9]) || "";
                            if (ITEM_DESCRIPTION.length > 300) {
                                ITEM_DESCRIPTION = ITEM_DESCRIPTION.substring(0, 297) + "...";
                            }

                            SubTabla.setSublistValue({ id: 'id_int', line: index, value: ITEM_ID });

                            SubTabla.setSublistValue({ id: 'id_item', line: index, value: ITEM_ID });

                            if (ITEM_DESCRIPTION != '' && ITEM_DESCRIPTION != null) {
                                SubTabla.setSublistValue({ id: 'custpage_description', line: index, value: ITEM_DESCRIPTION });
                            }

                            SubTabla.setSublistValue({ id: 'id_location', line: index, value: LOCATION_ID });

                            SubTabla.setSublistValue({ id: 'id_date', line: index, value: result_items_ped[i].getValue(colFields[0]) });

                            //ID de la línea para setear json del popup
                            SubTabla.setSublistValue({ id: 'custpage_line_id', line: index, value: index });

                            if (INVENTORY_DETAIL != "") {
                                //Si el item es de tipo lote/serie
                                if (result_items_ped[i].getValue(colFields[8])) {
                                    SubTabla.setSublistValue({ id: 'custpage_lote', line: index, value: INVENTORY_NUMBER });
                                }
                                SubTabla.setSublistValue({ id: 'custpage_quantity', line: index, value: result_items_ped[i].getValue(colFields[7]) });
                            } else {
                                SubTabla.setSublistValue({ id: 'custpage_quantity', line: index, value: result_items_ped[i].getValue(colFields[4]) });
                            }
                            index++;
                        }
                    }

                    // Script Cliente
                    FORM.clientScriptModulePath = './Latam_Library/LMRY_MX_PedimentosFulfillment_CLNT.js';

                    FORM.addSubmitButton({ label: getText('save') });

                    FORM.addButton({ id: 'id_cancel', label: getText('cancel'), functionName: 'funcionCancel' });

                    FORM.addResetButton({ label: getText('reset') });

                    // Dibuja el fomulario
                    context.response.writePage(FORM);
                }
            } catch (msgerr) {

                var FORM = serverWidget.createForm({ title: getText('title') });

                var myInlineHtml = FORM.addField({ id: 'custpage_id_message', label: 'MESSAGE', type: serverWidget.FieldType.INLINEHTML });

                myInlineHtml.layoutType = serverWidget.FieldLayoutType.OUTSIDEBELOW;
                myInlineHtml.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });

                var strhtml = "<html>";
                strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>";
                strhtml += "<tr>";
                strhtml += "</tr>";
                strhtml += "<tr>";
                strhtml += "<td class='text'>";
                strhtml += "<div style=\"color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">";
                strhtml += getText('message');
                strhtml += "<br>Code :" + xml.escape(msgerr.name);
                strhtml += "<br>Details :" + xml.escape(msgerr.message);
                strhtml += "</div>";
                strhtml += "</td>";
                strhtml += "</tr>";
                strhtml += "</table>";
                strhtml += "</html>";

                // Mensaje HTML
                myInlineHtml.defaultValue = strhtml;

                // Dibuja el Formulario
                context.response.writePage(FORM);
                log.error({ title: 'Se generó un error en suitelet', details: msgerr });

                // Envio de mail al clientes
                library.sendemail(' [ onRequest ] ' + msgerr, LMRY_script);
            }
        }

        var TEXT_BY_LANG = {
            'title': { 'en': 'LatamReady - MX Pedimentos Detail Fulfillment', 'es': 'LatamReady - MX Detalle Pedimento Fulfillment', 'pt': 'LatamReady - MX Detalhe Pedimento Fulfillment' },
            'group': { 'en': 'Primary Information', 'es': 'Información Primaria', 'pt': 'Informação Primária' },
            'message': { 'en': "Important: Access is not allowed. <br> <br>", 'es': "Importante: El acceso no está permitido.<br><br>", 'pt': "Importante: o acesso não é permitido.<br><br>" },
            'sub': { 'en': 'Subsidiary', 'es': 'Subsidiaria', 'pt': 'Subsidiária' },
            'source': { 'en': 'Source Transaction', 'es': 'Transacción de Origen', 'pt': 'Transação de Origem' },
            'trans': { 'en': 'Transaction', 'es': 'Transacción', 'pt': 'Transação ' },
            'date': { 'en': 'Date', 'es': 'Fecha', 'pt': 'Data' },
            'items': { 'en': 'Items', 'es': 'Artículos', 'pt': 'Artigos' },
            'item': { 'en': 'Item', 'es': 'Artículo', 'pt': 'Artigo' },
            'descrip': { 'en': 'Description', 'es': 'Descripción', 'pt': 'Descrição' },
            'internalid': { 'en': 'Internal ID', 'es': 'ID Interno', 'pt': 'ID Interno' },
            'location': { 'en': 'Location', 'es': 'Ubicación', 'pt': 'Localização' },
            'lote': { 'en': 'Batch / Series', 'es': 'Lote / Serie', 'pt': 'Lote / Série' },
            'quantity': { 'en': 'Quantity', 'es': 'Cantidad', 'pt': 'Quantidade' },
            'onhand': { 'en': 'On Hand', 'es': 'En Mano', 'pt': 'Na Mão' },
            'pedate': { 'en': 'Pedimento Date', 'es': 'Fecha de Pedimento', 'pt': 'Data do Pedimento' },
            'save': { 'en': 'Save', 'es': 'Guardar', 'pt': 'Salvar' },
            'cancel': { 'en': 'Cancel', 'es': 'Cancelar', 'pt': 'Cancelar' },
            'reset': { 'en': 'Reset', 'es': 'Reiniciar', 'pt': 'Reiniciar' },
        };

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