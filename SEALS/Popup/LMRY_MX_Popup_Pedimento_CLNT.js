/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                    ||
||                                                             ||
||  File Name: LMRY_MX_Popup_Pedimento_CLNT.js                 ||
||                                                             ||
||  Version Date         Author        Remarks                 ||
||  2.0     Ago 21 2021  LatamReady    Use Script 2.0          ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/currentRecord', 'N/url', 'N/search', 'N/format'],
    function (currentRecord, url, search, format) {

        var LMRY_script = 'LatamReady - MX Popup Pedimento CLNT';

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line4     number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */

        function pageInit(scriptContext) {

            try {

                console.log("pageInit");
                var objRecord = scriptContext.currentRecord;
                var lineID = objRecord.getValue('custpage_id_line');
                
                var item = objRecord.getValue('custpage_id_item');
                var location = objRecord.getValue('custpage_id_lct');
                var lote = objRecord.getValue('custpage_id_lote');
                var key = [item, location, lote].join(";");

                var dataPediments = window.opener.nlapiGetFieldValue('custpage_pediments');
                dataPediments = dataPediments ? JSON.parse(dataPediments) : {};

                console.log("pageInit dataPediments", JSON.stringify(dataPediments));
                //section = objRecord.getValue('custpage_hidden');
                var sumQuantityDisp = 0;
                var quantitytotal = objRecord.getValue('custpage_id_quantity');

                var lines = objRecord.getLineCount('custpage_id_sublista');

                var dataPreview = updateDataPediments(dataPediments, lineID);
                console.log("pageInit dataPreview", JSON.stringify(dataPreview));
                for (var i = 0; i < lines; i++) {
                    objRecord.selectLine({sublistId: 'custpage_id_sublista', line: i});
                    var ped_quantity = Number(objRecord.getCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'custpage_cant_onhand' }));
                    var aduana = Number(objRecord.getCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_aduana' }));
                    if (aduana) {
                        sumQuantityDisp += ped_quantity;
                    }
                }

                if (quantitytotal > sumQuantityDisp) {
                    alert('La cantidad total es mayor a la cantidad disponible de la suma de los pedimentos.');
                } else {
                    // Update On Hand
                    for (var i = 0; i < dataPediments[key].length; i++) {
                        objRecord.selectLine({sublistId: 'custpage_id_sublista', line: i});
                        var dataPediment = dataPediments[key][i];
                        var onhand = dataPediment.quantity;
                        objRecord.setCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'custpage_cant_onhand', value: onhand });
                        objRecord.commitLine({sublistId: 'custpage_id_sublista'});
                        
                    }

                    // Update Amounts
                    for (var i = 0; i < lines; i++) {
                        objRecord.selectLine({sublistId: 'custpage_id_sublista', line: i});

                        // Valida Versus dataPreview
                        if (!dataPreview.length) continue;
                        var pediment = dataPreview[0];
                        var qty = Number(pediment.qty);

                        var ped_code = objRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'custpage_pedimento', line: i });

                        if (pediment.pedimento == ped_code) {                            
                            objRecord.setCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'custpage_quantity_ped', value: qty });
                            objRecord.commitLine({sublistId: 'custpage_id_sublista'});
                            dataPreview = dataPreview.slice(1);
                        }

                    }
                }

                console.log("pageInit dataPediments after", JSON.stringify(dataPediments));
            } catch (err) {
                console.log('Error pageInit: ' + err);
                //ibrary.sendMail(LMRY_script, err);
                //alert('Page INIT: ' + err);
            }

            return true;

        }

        function validateField(scriptContext) {
            try {
                var RCD_OBJ = scriptContext.currentRecord;
                var inprocess = false;

                if (scriptContext.sublistId == 'custpage_id_sublista' && scriptContext.fieldId == 'custpage_quantity_ped' && inprocess == false) {

                    var ped_quantity = Number(RCD_OBJ.getCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'custpage_cant_onhand' }));
                    var quantity = Number(RCD_OBJ.getCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'custpage_quantity_ped' }));
                    var aduana = Number(RCD_OBJ.getCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_aduana' }));

                    if (!aduana) {
                        alert('La Aduana no debe ser vacia.');
                        inprocess = true;
                        RCD_OBJ.setCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'custpage_quantity_ped', value: '', ignoreFieldChange: true });
                    } else {
                        if (quantity > ped_quantity) {
                            alert('La cantidad ingresada debe ser menor o igual a la cantidad disponible del pedimento.');
                            inprocess = true;
                            RCD_OBJ.setCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'custpage_quantity_ped', value: '', ignoreFieldChange: true });
                            return false;
                        } else {
                            var cant_remaining = ped_quantity - quantity;
                            RCD_OBJ.setCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'custpage_cant_remaining', value: cant_remaining, ignoreFieldChange: true });
                        }
                    }
                    return true;
                }

            } catch (err) {

            }
            return true;
        }

        function saveRecord(scriptContext) {

            try {

                var objRecord = scriptContext.currentRecord;
                //section = objRecord.getValue('custpage_hidden');
                // updateParent(objRecord);
                return false;

            } catch (err) {
                //ibrary.sendMail(LMRY_script, err);
                //alert('Page INIT: ' + err);
            }

        }

        function cancel(lineID) {
            try {

                setWindowChanged(window, false);

                window.opener.nlapiSetLineItemValue('custpage_id_sublista', 'custpage_popup_data_detail', parseInt(lineID) + 1, JSON.stringify([]));
                window.opener.nlapiSetLineItemValue('custpage_id_sublista', 'id_popup', parseInt(lineID) + 1, false);
                window.close();
                window.opener.focus();

            } catch (err) {

            }
        }

        function updateParent(lineID) {
            try {
                var dataObj = {}, arrLines = [];
                var quantity_total = Number(nlapiGetFieldValue('custpage_id_quantity'));
                var lineCount = nlapiGetLineItemCount('custpage_id_sublista');
                var sum = 0;
                var cont = 0;

                for (var i = 1; i <= lineCount; i++) {
                    var cant = nlapiGetLineItemValue('custpage_id_sublista', 'custpage_quantity_ped', i);
                    sum = sum + Number(cant);
                    if (cant > 0) {
                        cont++;
                    }
                }
                /*if (lote_serie == null || lote_serie == '') {
                    if (cont > 1) {
                        alert('Solo se puede registrar un único número de pedimento para este item.');
                        return false;
                    }
                }*/

                if (sum > quantity_total || sum == 0 || sum < quantity_total) {
                    alert('Se debe completar la cantidad total indicada en el campo: "Total Quantity"');
                    return false;
                }

                for (var i = 1; i <= lineCount; i++) {

                    var cant = nlapiGetLineItemValue('custpage_id_sublista', 'custpage_quantity_ped', i);
                    var date = nlapiGetLineItemValue('custpage_id_sublista', 'id_date', i);

                    if (cant > 0) {
                        if (date != null && date != '' && date != 0) {
                            arrLines.push({
                                pedimento: nlapiGetLineItemValue('custpage_id_sublista', 'custpage_pedimento', i),
                                qty: nlapiGetLineItemValue('custpage_id_sublista', 'custpage_quantity_ped', i),
                                date: nlapiGetLineItemValue('custpage_id_sublista', 'id_date', i),
                                aduana: nlapiGetLineItemValue('custpage_id_sublista', 'id_aduana', i),
                            });
                        } else {
                            alert('Debe llenar el campo fecha obligatoriamente');
                            return false;
                        }
                    }
                }

                dataObj = arrLines;
                //window.opener.nlapiSetLineItemValue('custpage_id_sublista', 'id_popup', parseInt(lineID) + 1, true);
                window.opener.nlapiSetLineItemValue('custpage_id_sublista', 'custpage_popup_data_detail', parseInt(lineID) + 1, JSON.stringify(dataObj));

                //CERRADO DE VENTANA
                setWindowChanged(window, false);

                window.close();
                window.opener.focus();

            } catch (err) {
                console.log('err', err);
                //ibrary.sendMail(LMRY_script, err);
                //alert('Page INIT: ' + err);
            }
        }

        function updateDataPediments(dataPediments, lineID) {
            var dataPreview = [];
            var lines = window.opener.nlapiGetLineItemCount('custpage_id_sublista')
            for (var i = 0; i < lines; i++) {
                if (i == lineID) {
                    var dataLine = window.opener.nlapiGetLineItemValue('custpage_id_sublista', 'custpage_popup_data_detail', parseInt(i) + 1);
                    dataPreview = dataLine ? JSON.parse(dataLine) : [];
                } else {
                    var dataLine = window.opener.nlapiGetLineItemValue('custpage_id_sublista', 'custpage_popup_data_detail', parseInt(i) + 1);
                    var item = window.opener.nlapiGetLineItemValue('custpage_id_sublista', 'id_item', parseInt(i) + 1);
                    var location = window.opener.nlapiGetLineItemValue('custpage_id_sublista', 'id_location', parseInt(i) + 1);
                    var lote = window.opener.nlapiGetLineItemValue('custpage_id_sublista', 'custpage_lote', parseInt(i) + 1);
                    dataLine = dataLine ? JSON.parse(dataLine) : [];
                    var key = [item, location, lote].join(";");
    
                    var pediment = dataPediments[key] || [];
                    updateLine(dataLine, pediment);
                }
            }
            return dataPreview;
        }

        function updateLine(dataLine, pediment) {
            for (var i = 0; i < pediment.length; i++) {
                var number = pediment[i].number;
                for (var j = 0; j < dataLine.length; j++) {
                    var ped = dataLine[j].pedimento;

                    if (number == ped) {
                        var quantity = dataLine[j].qty;
                        pediment[i].quantity -= Number(quantity);
                        break;
                    }
                }
            }
        }

        return {
            pageInit: pageInit,
            validateField: validateField,
            // fieldChanged: fieldChanged,
            // postSourcing: postSourcing,
            // sublistChanged: sublistChanged,
            // lineInit: lineInit,
            // fieldChanged: fieldChanged,
            // validateField: validateField
            saveRecord: saveRecord,
            cancel: cancel,
            updateParent: updateParent
        };

    });