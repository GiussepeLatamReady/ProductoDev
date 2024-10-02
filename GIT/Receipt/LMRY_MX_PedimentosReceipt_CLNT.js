/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_MX_PedimentosReceipt_CLNT.js                ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Ago 01 2020  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/log', 'N/record', 'N/runtime', 'N/currentRecord', 'N/url', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],

    function (log, record, runtime, currentRecord, url, library) {

        var LMRY_script = "LatamReady - MX Pediment Receipt CLNT";
        var subsi_OW = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
        var RCD_OBJ = '';
        var LANGUAGE = runtime.getCurrentScript().getParameter({ name: 'LANGUAGE' });
        LANGUAGE = LANGUAGE.substring(0, 2);

        switch (LANGUAGE) {
            case 'es':
                var Mensaje1 = 'Debe llenar todos los números de pedimentos y aduana.';
                break;

            case 'pt':
                var Mensaje1 = 'Você deve preencher todos os números da pedimentos e aduana.';
                break;

            default:
                var Mensaje1 = "You must fill out all the pedimentos numbers and aduana.";
        }

        function pageInit(scriptContext) {
            RCD_OBJ = scriptContext.currentRecord;

            //Graba Fecha Actual
            if (RCD_OBJ.getValue({ fieldId: 'custpage_id_date' }) == null || RCD_OBJ.getValue({ fieldId: 'custpage_id_date' }) == '') {
                var newDate = new Date();
                RCD_OBJ.setValue({ fieldId: 'custpage_id_date', value: newDate });
            }
        }

        function funcionCancel() {
            try {
                //ID Transacción
                var recordObj = RCD_OBJ.getValue({ fieldId: 'custpage_id_trans' });

                //Regresar a la transacción (Botón Cancel)
                var urlTransaction = url.resolveRecord({ recordType: "itemreceipt", recordId: recordObj });
                setWindowChanged(window, false);
                window.location.href = urlTransaction;

            } catch (msgerr) {
                // Envio de mail al clientes
                console.log('msgerr', msgerr);
                library.sendemail(' [ funcionCancel ] ' + msgerr, LMRY_script);
            }

        }

        function saveRecord(scriptContext) {
            try {
                // Objetos del Formulario
                var RCD_OBJ = scriptContext.currentRecord;
                var band = false;
                var item_json = [];

                //Subsidiary
                if (subsi_OW) {
                    var _sub = RCD_OBJ.getValue({ fieldId: 'custpage_id_subsi' });
                } else {
                    var _sub = 1;
                }

                var _source = RCD_OBJ.getValue({ fieldId: 'custpage_id_source' });
                var _transac = RCD_OBJ.getValue({ fieldId: 'custpage_id_trans' });
                var _date = RCD_OBJ.getValue({ fieldId: 'custpage_id_date' });
                var cant = RCD_OBJ.getLineCount({ sublistId: 'custpage_id_sublista' });

                if (cant > 0) {
                    for (var i = 0; i < cant; i++) {

                        var s_item = RCD_OBJ.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_int', line: i });
                        var s_location = RCD_OBJ.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_locationid', line: i });
                        var s_lote = RCD_OBJ.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_loteid', line: i });
                        var s_quantity = RCD_OBJ.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_quantity', line: i });
                        var s_ped = RCD_OBJ.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_pediment', line: i });
                        var s_date = RCD_OBJ.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_date', line: i });
                        var s_aduana = RCD_OBJ.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_aduana', line: i });

                        if (s_ped == '' || s_ped == null) {
                            band = true;
                        }

                        if (s_aduana == '' || s_aduana == null || s_aduana == 0) {
                            band = true;
                        }

                        var line_json = {
                            item: s_item,
                            location: s_location,
                            lote: s_lote,
                            quantity: s_quantity,
                            pediment: s_ped,
                            date: s_date,
                            aduana: s_aduana
                        }

                        item_json.push(line_json);
                    }

                    if (band == false) {
                        //Si no hay número de pedimento vacío

                        for (var i = 0; i < item_json.length; i++) {

                            // validar para poder guardar los datos
                            var ped_details = record.create({ type: 'customrecord_lmry_mx_pedimento_details', isDynamic: true });

                            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_subsidiary', value: _sub });

                            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_trans_ref', value: _source });

                            ped_details.setValue({ fieldId: 'custrecord_lmry_source_transaction_id', value: _source });

                            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_trans', value: _transac });

                            ped_details.setValue({ fieldId: 'custrecord_lmry_transaction_id', value: _transac });

                            ped_details.setValue({ fieldId: 'custrecord_lmry_date', value: _date });

                            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_item', value: item_json[i].item });

                            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_date', value: item_json[i].date });

                            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_num', value: item_json[i].pediment });

                            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_location', value: item_json[i].location });

                            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_quantity', value: item_json[i].quantity });

                            var lote = item_json[i].lote;

                            if (lote != null && lote != '') {
                                ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_lote_serie', value: lote });
                            }

                            if (item_json[i].aduana) {
                                ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_aduana', value: item_json[i].aduana });
                            }

                            // Graba record Latam - MX Pedimento Details
                            var ped_id = ped_details.save();
                        }
                    } else {
                        alert(Mensaje1);
                        return false;
                    }

                    //Retorna a la transacción
                    var urlTransaction = url.resolveRecord({ recordType: "itemreceipt", recordId: _transac });
                    setWindowChanged(window, false);
                    window.location.href = urlTransaction;
                }
            } catch (msgerr) {
                console.log('Function saveRecord', msgerr);
                alert('Se presentó un error. No se puedo continuar con el proceso.');
                library.sendemail(' [ saveRecord ] ' + msgerr, LMRY_script);

                return false;
            }
        }

        return {
            pageInit: pageInit,
            funcionCancel: funcionCancel,
            saveRecord: saveRecord
        };

    });