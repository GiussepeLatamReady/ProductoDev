/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_MX_PedimentoDetail_Inventory_STLT.js        ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Ago 01 2020  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/record', 'N/log', 'N/xml', 'N/ui/serverWidget', 'N/search', 'N/runtime', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],

    function (record, log, xml, serverWidget, search, runtime, library) {
        // Nombre del Script
        var LMRY_script = "LatamReady - MX Pedimentos Detail Inventory";
        var FORM = '';
        var LANGUAGE = '';

        function onRequest(context) {
            try {

                LANGUAGE = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" });
                LANGUAGE = LANGUAGE.substring(0, 2);
                var inventoryID = context.request.parameters.inventoryid;

                if (inventoryID == '' || inventoryID == null) {
                    return true;
                }

                if (context.request.method == 'GET') {

                    var RCD_INVENTORY = search.lookupFields({
                        type: search.Type.INVENTORY_ADJUSTMENT,
                        id: inventoryID,
                        columns: ['trandate', 'internalid', 'subsidiary', 'tranid']
                    });

                    var trandate = RCD_INVENTORY.trandate;

                    //Features
                    var subsi_OW = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                    var FEAT_INVENTORY = runtime.isFeatureInEffect({ feature: "advbinseriallotmgmt" });

                    //Crea formulario
                    FORM = serverWidget.createForm({ title: getText('title') });

                    FORM.addFieldGroup({ id: 'group_pi', label: getText('group') });

                    //Subsidiary --one world--
                    if (subsi_OW == true) {
                        var p_subsi = FORM.addField({ id: 'custpage_id_subsi', label: getText('sub'), type: serverWidget.FieldType.SELECT, container: 'group_pi' });
                        p_subsi.addSelectOption({ value: RCD_INVENTORY.subsidiary[0].value, text: RCD_INVENTORY.subsidiary[0].text });
                        p_subsi.isMandatory = true;
                    }

                    //Transacción
                    var p_trans = FORM.addField({ id: 'custpage_id_trans', label: getText('trans'), type: serverWidget.FieldType.SELECT, container: 'group_pi' });
                    p_trans.addSelectOption({ value: inventoryID, text: "Inventory Adjustment #" + RCD_INVENTORY.tranid });
                    p_trans.isMandatory = true;

                    //Fecha
                    var p_date = FORM.addField({ id: 'custpage_id_date', label: getText('date'), type: serverWidget.FieldType.DATE, source: 'date', container: 'group_pi' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    p_date.isMandatory = true;

                    //Creación subtabla
                    var SubTabla = FORM.addSublist({ id: 'custpage_id_sublista', type: serverWidget.SublistType.LIST, label: getText('items'), tab: 'custpage_tab1' });

                    //Item Internal ID
                    var internalID = SubTabla.addField({ id: 'id_int', label: getText('internalid'), type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                    internalID.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    //Item
                    SubTabla.addField({ id: 'id_item', label: getText('item'), type: serverWidget.FieldType.TEXT });

                    //Item Descripción
                    SubTabla.addField({ id: 'id_description', label: getText('descrip'), type: serverWidget.FieldType.TEXT });

                    //Item Location ID
                    var locationID = SubTabla.addField({ id: 'id_locationid', label: 'Location ID', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                    locationID.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    //Item location
                    var location = SubTabla.addField({ id: 'id_location', label: getText('location'), type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                    //Item Lore/Serie ID
                    var loteID = SubTabla.addField({ id: 'id_loteid', label: 'Location ID', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                    loteID.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    //Item Lore/Serie
                    SubTabla.addField({ id: 'id_lote', label: getText('lote'), type: serverWidget.FieldType.TEXT });

                    //Item Cantidad
                    SubTabla.addField({ id: 'id_quantity', label: getText('quantity'), type: serverWidget.FieldType.TEXT });

                    //Número Pedimento
                    var pedimento = SubTabla.addField({ id: 'id_pediment', label: 'PEDIMENTO', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                    pedimento.isMandatory = true;

                    //Fecha Pedimento
                    SubTabla.addField({ id: 'id_date', label: getText('pedate'), type: serverWidget.FieldType.DATE }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

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

                    //Se filtra por la transacción
                    var Filter_Trans = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: inventoryID });

                    /* Busqueda personalizada LatamReady - MX Pediment Lines*/
                    // Devuelve las líneas de item de las transacciones que cuentan con check activado de pedimento
                    var search_items_ped = search.load({ id: 'customsearch_lmry_mx_ped_receipt_lines' });

                    search_items_ped.filters.push(Filter_Trans);
                    search_items_ped.columns.push(search.createColumn({
                        name: "purchasedescription",
                        join: "item"
                    }));
                    var result_items_ped = search_items_ped.run().getRange(0, 1000);

                    /**
                    * Modificacion kit/package
                    * -----------------------------------------------------------------------------------------------------------------------------
                    */

                    var recordShipment = record.load({
                        type: search.Type.INVENTORY_ADJUSTMENT,
                        id: inventoryID,
                        isDynamic: false,
                    });

                    var numItems = recordShipment.getLineCount({ sublistId: "item" });
                    var index = 0;
                    var kitItemxPediment = {};
                    for (var i = 0; i < numItems; i++) {

                        log.debug({
                            title: "type",
                            details: [
                                recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitlineid', line: i }),
                                recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitmemberof', line: i }),
                                recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitmemberquantityfactor', line: i }),
                                recordShipment.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i }),
                                recordShipment.getSublistText({ sublistId: "item", fieldId: "itemname", line: i }),
                                recordShipment.getSublistText({ sublistId: "item", fieldId: "custcol_lmry_mx_pediment", line: i })
                            ]
                        });
                        if (recordShipment.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i }) === "Kit") {
                            kitItemxPediment[recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitlineid', line: i })] = recordShipment.getSublistText({ sublistId: "item", fieldId: "custcol_lmry_mx_pediment", line: i });
                        }
                        if (recordShipment.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i }) === "Kit" || recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitmemberof', line: i }) === "") continue;
                        if (kitItemxPediment[recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'kitmemberof', line: i })] === "F") continue;
                        // if (recordShipment.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: index }) === "Kit") continue;
                        var trandate = recordShipment.getValue("trandate");
                        var type = recordShipment.getValue("type");
                        var itemID = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        var itemIDName = recordShipment.getSublistText({ sublistId: 'item', fieldId: 'item', line: i });
                        var location = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i });
                        var locationName = recordShipment.getSublistText({ sublistId: 'item', fieldId: 'location', line: i });
                        var quantity = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                        var idInventoryDetail = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'inventorydetail', line: i });
                        var itemDescription = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'itemdescription', line: i });
                        if (itemDescription.length > 300) {
                            itemDescription = itemDescription.substring(0, 297) + "...";
                        }
                        quantity = Number(quantity).toFixed(0);
                        // var itemReceive = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'itemreceive', line: i });
                        var inventoryDetail = recordShipment.getSublistValue({ sublistId: 'item', fieldId: 'inventorydetail', line: i });
                        if (inventoryDetail) {
                            var inventorydetailRecord = recordShipment.getSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: i });
                            var cLineas = inventorydetailRecord.getLineCount({ sublistId: 'inventoryassignment' });
                            for (var j = 0; j < cLineas; j++) {
                                var lote = inventorydetailRecord.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorynumber', line: j });
                                var loteText = inventorydetailRecord.getSublistText({ sublistId: 'inventoryassignment', fieldId: 'inventorynumber', line: j });
                                var loteQuantity = inventorydetailRecord.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', line: j });

                                if (Number(itemID))
                                    SubTabla.setSublistValue({ id: 'id_int', line: index, value: itemID });
                                if (itemIDName)
                                    SubTabla.setSublistValue({ id: 'id_item', line: index, value: itemIDName });
                                if (itemDescription != null && itemDescription != "")
                                    SubTabla.setSublistValue({ id: 'id_description', line: index, value: itemDescription });
                                if (Number(location))
                                    SubTabla.setSublistValue({ id: 'id_location', line: index, value: location });
                                if (locationName)
                                    SubTabla.setSublistValue({ id: 'id_location', line: index, value: locationName });
                                if (trandate != null && trandate != "")
                                    SubTabla.setSublistValue({ id: 'id_date', line: index, value: trandate });
                                // if (Number(index))
                                //     SubTabla.setSublistValue({ id: 'custpage_line_id', line: index, value: index });
                                if (Number(lote))
                                    SubTabla.setSublistValue({ id: 'id_loteid', line: index, value: lote });
                                if (loteText)
                                    SubTabla.setSublistValue({ id: 'id_lote', line: index, value: loteText });
                                if (Number(loteQuantity)) {
                                    SubTabla.setSublistValue({ id: 'id_quantity', line: index, value: loteQuantity });
                                } else {
                                    SubTabla.setSublistValue({ id: 'id_quantity', line: index, value: quantity });
                                }
                                index++;
                            }
                        } else {
                            if (Number(itemID))
                                SubTabla.setSublistValue({ id: 'id_int', line: index, value: itemID });
                            if (itemIDName)
                                SubTabla.setSublistValue({ id: 'id_item', line: index, value: itemIDName });
                            if (itemDescription != null && itemDescription != "")
                                SubTabla.setSublistValue({ id: 'id_description', line: index, value: itemDescription });
                            if (Number(location))
                                SubTabla.setSublistValue({ id: 'id_location', line: index, value: location });
                            if (locationName)
                                SubTabla.setSublistValue({ id: 'id_location', line: index, value: locationName });
                            if (trandate != null && trandate != "")
                                SubTabla.setSublistValue({ id: 'id_date', line: index, value: trandate });

                            if (Number(quantity))
                                SubTabla.setSublistValue({ id: 'id_quantity', line: index, value: quantity });

                            index++;
                        }

                    }
                    /**
                    * --------------------------------------------------------------------------------------------------------------------------------------------------------
                    */


                    if (result_items_ped != null && result_items_ped.length > 0) {
                        for (var i = 0; i < result_items_ped.length; i++) {
                            var colFields = result_items_ped[i].columns;

                            var ITEM_ID = "" + result_items_ped[i].getValue(colFields[5]);
                            var ITEM_NAME = "" + result_items_ped[i].getText(colFields[5]);
                            var INVENTORY_DETAIL = "";

                            if (FEAT_INVENTORY == true || FEAT_INVENTORY == 'T') {
                                var INVENTORY_DETAIL = "" + result_items_ped[i].getValue(colFields[6]);
                            }

                            var ITEM_DESCRIPTION = result_items_ped[i].getValue(colFields[9]) || "";
                            if (ITEM_DESCRIPTION.length > 300) {
                                ITEM_DESCRIPTION = ITEM_DESCRIPTION.substring(0, 297) + "...";
                            }

                            SubTabla.setSublistValue({ id: 'id_int', line: index, value: ITEM_ID });
                            SubTabla.setSublistValue({ id: 'id_item', line: index, value: ITEM_NAME });

                            if (ITEM_DESCRIPTION != '' && ITEM_DESCRIPTION != null) {
                                SubTabla.setSublistValue({ id: 'id_description', line: index, value: ITEM_DESCRIPTION });
                            }

                            SubTabla.setSublistValue({ id: 'id_locationid', line: index, value: result_items_ped[i].getValue(colFields[3]) });
                            SubTabla.setSublistValue({ id: 'id_location', line: index, value: result_items_ped[i].getText(colFields[3]) });
                            SubTabla.setSublistValue({ id: 'id_date', line: index, value: result_items_ped[i].getValue(colFields[0]) });

                            if (INVENTORY_DETAIL != "") {
                                //Si el item es de tipo lote/serie
                                if (result_items_ped[i].getValue(colFields[8])) {
                                    SubTabla.setSublistValue({ id: 'id_loteid', line: index, value: result_items_ped[i].getValue(colFields[8]) });
                                    SubTabla.setSublistValue({ id: 'id_lote', line: index, value: result_items_ped[i].getText(colFields[8]) });
                                }
                                SubTabla.setSublistValue({ id: 'id_quantity', line: index, value: result_items_ped[i].getValue(colFields[7]) });
                            } else {
                                SubTabla.setSublistValue({ id: 'id_quantity', line: index, value: result_items_ped[i].getValue(colFields[4]) });
                            }
                            index++;
                        }
                    }

                    FORM.addSubmitButton({ label: getText('save') });

                    FORM.addButton({ id: 'id_cancel', label: getText('cancel'), functionName: "funcionCancel" });

                    FORM.addResetButton({ label: getText('reset') });

                    // Script Cliente
                    FORM.clientScriptModulePath = './Latam_Library/LMRY_MX_PedimentosInventory_CLNT.js';

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
                log.error('sendemail');
                library.sendemail(' [ onRequest ] ' + msgerr, LMRY_script);
            }
        }

        var TEXT_BY_LANG = {
            'title': { 'en': 'LatamReady - MX Pedimentos Detail Inventory', 'es': 'LatamReady - MX Detalle Pedimento Inventory', 'pt': 'LatamReady - MX Detalhe Pedimento Inventory' },
            'group': { 'en': 'Primary Information', 'es': 'Información Primaria', 'pt': 'Informação Primária' },
            'message': { 'en': "Important: Access is not allowed. <br> <br>", 'es': "Importante: El acceso no está permitido.<br><br>", 'pt': "Importante: o acesso não é permitido.<br><br>" },
            'sub': { 'en': 'Subsidiary', 'es': 'Subsidiaria', 'pt': 'Subsidiária' },
            'trans': { 'en': 'Transaction', 'es': 'Transacción', 'pt': 'Transação ' },
            'date': { 'en': 'Date', 'es': 'Fecha', 'pt': 'Data' },
            'items': { 'en': 'Items Details', 'es': 'Detalle de Artículos', 'pt': 'Detalhe de Artigos' },
            'item': { 'en': 'Item', 'es': 'Artículo', 'pt': 'Artigo' },
            'descrip': { 'en': 'Description', 'es': 'Descripción', 'pt': 'Descrição' },
            'internalid': { 'en': 'Internal ID', 'es': 'ID Interno', 'pt': 'ID Interno' },
            'location': { 'en': 'Location', 'es': 'Ubicación', 'pt': 'Localização' },
            'lote': { 'en': 'Batch / Series', 'es': 'Lote / Serie', 'pt': 'Lote / Série' },
            'quantity': { 'en': 'Quantity', 'es': 'Cantidad', 'pt': 'Quantidade' },
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
