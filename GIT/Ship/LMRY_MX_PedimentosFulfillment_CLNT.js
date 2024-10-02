/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_MX_PedimentosFulfillment_CLNT.js            ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Ago 01 2020  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/log', 'N/currency', 'N/record', 'N/format', 'N/search', 'N/runtime', 'N/currentRecord', 'N/url','./Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],

  function(log, currency, record, format, search, runtime, currentRecord, url, library) {

    var LMRY_script = "LatamReady - MX Pediment Fulfillment CLNT";
    var subsi_OW = runtime.isFeatureInEffect({feature: "SUBSIDIARIES"});
    var RCD_OBJ = '';
    var LANGUAGE = runtime.getCurrentScript().getParameter({name: 'LANGUAGE'});
    LANGUAGE = LANGUAGE.substring(0, 2);

    switch (LANGUAGE) {
      case 'es':
        var Mensaje1 = 'No hay stock, elija otro número de pedimento';
        var Mensaje2 = 'Debe elegir todos los pedimentos con stock.';
        break;

      case 'pt':
        var Mensaje1 = "Não há estoque, escolha outro número de pedimento";
        var Mensaje2 = 'Você deve escolher todos os pedimentos com estoque.';
        break;

      default:
        var Mensaje1 = "There is no stock, choose another pedimento number";
        var Mensaje2 = 'You must choose all the pedimentos with stock.';
    }

    function pageInit(scriptContext) {
      try {
        RCD_OBJ = scriptContext.currentRecord;

        //Setea Fecha Actual
        if (RCD_OBJ.getValue({fieldId: 'custpage_id_date'}) == null || RCD_OBJ.getValue({fieldId: 'custpage_id_date'}) == '') {
          var newDate = new Date();
          RCD_OBJ.setValue({fieldId: 'custpage_id_date',value: newDate});
        }
      } catch (msgerr) {
        console.log('msgerr', msgerr);
        library.sendemail(' [ pageInit ] ' + msgerr, LMRY_script);
      }
    }

    function funcionCancel() {
      try {
        //ID de la transacción
        var recordObj = RCD_OBJ.getValue({fieldId: 'custpage_id_trans'});

        //Retorna a la transacción (Botón Cancel)
        var urlTransaction = url.resolveRecord({recordType: "itemfulfillment", recordId: recordObj});
        setWindowChanged(window, false);
        window.location.href = urlTransaction;

      } catch (msgerr) {
        console.log('msgerr', msgerr);
        library.sendemail(' [ funcionCancel ] ' + msgerr, LMRY_script);
      }
    }

    function fieldChanged(scriptContext) {
      try {
        if (scriptContext.sublistId == 'custpage_id_sublista' && scriptContext.fieldId == 'id_popup') {
          var RCD_OBJ = scriptContext.currentRecord;
          var item_id = RCD_OBJ.getCurrentSublistValue({sublistId: 'custpage_id_sublista', fieldId: 'id_item'});
          var location_id = RCD_OBJ.getCurrentSublistValue({sublistId: 'custpage_id_sublista', fieldId: 'id_location'});
          var serie_lote_id = RCD_OBJ.getCurrentSublistValue({sublistId: 'custpage_id_sublista', fieldId: 'custpage_lote'});
          var current_line = nlapiGetCurrentLineItemIndex('custpage_id_sublista');
          var descrip = nlapiGetLineItemValue('custpage_id_sublista', 'custpage_description', current_line);
          var quantity = RCD_OBJ.getCurrentSublistValue({sublistId: 'custpage_id_sublista', fieldId: 'custpage_quantity'});
          var line_id = RCD_OBJ.getCurrentSublistValue({sublistId: 'custpage_id_sublista', fieldId: 'custpage_line_id'});

          var new_suitelet = url.resolveScript({
            scriptId: 'customscript_lmry_mx_ped_popup_stlt',
            deploymentId: 'customdeploy_lmry_mx_ped_popup_stlt',
            params: {
              'param_item': item_id,
              'param_lct': location_id,
              'param_lote': serie_lote_id,
              'param_descrip': descrip,
              'param_quantity': quantity,
              'param_line': line_id
            }
          });

          RCD_OBJ.setCurrentSublistValue({sublistId:'custpage_id_sublista',fieldId:'id_popup',value:true,ignoreFieldChange:true})
          window.open(new_suitelet);
        }
      } catch (msgerr) {
        console.log('msgerr', msgerr);
        //library.sendemail(' [ fieldChanged ] ' + msgerr, LMRY_script);
      }
      return true;
    }

    function saveRecord(scriptContext) {
      try {

        var RCD_OBJ = scriptContext.currentRecord;
        var band = false;
        var item_json = [];
        var jsonPedimentos = [];

        if (subsi_OW) {
          var _sub = RCD_OBJ.getValue({fieldId: 'custpage_id_subsi'});
        } else {
          var _sub = 1;
        }

        var _source = RCD_OBJ.getValue({fieldId: 'custpage_id_source'});
        var _transac = RCD_OBJ.getValue({fieldId: 'custpage_id_trans'});
        var _date = RCD_OBJ.getValue({fieldId: 'custpage_id_date'});
        var cant = RCD_OBJ.getLineCount({sublistId: 'custpage_id_sublista'});

        if (cant > 0) {
          for (var i = 0; i < cant; i++) {

            var s_intr = RCD_OBJ.getSublistValue({sublistId: 'custpage_id_sublista',fieldId: 'id_item', line: i});
            var s_location = RCD_OBJ.getSublistValue({sublistId: 'custpage_id_sublista',fieldId: 'id_location',line: i});
            var s_lote = RCD_OBJ.getSublistValue({sublistId: 'custpage_id_sublista',fieldId: 'custpage_lote',line: i});
            var s_detalle_ped = RCD_OBJ.getSublistValue({sublistId: 'custpage_id_sublista',fieldId: 'custpage_popup_data_detail',line: i});
            if (s_detalle_ped != '' && s_detalle_ped != null) {
              jsonPedimentos = JSON.parse(s_detalle_ped);
            }

          if (Object.keys(jsonPedimentos).length) {
              for (var j = 0; j < jsonPedimentos.length; j++) {
                var line_json = {
                  item: s_intr,
                  location: s_location,
                  lote: s_lote,
                  quantity: -jsonPedimentos[j].qty,
                  pediment: jsonPedimentos[j].pedimento,
                  date: jsonPedimentos[j].date,
                  aduana: jsonPedimentos[j].aduana
                }
                item_json.push(line_json);
              }
            } else {
              alert('Debe llenar todas las líneas con su(s) número(s) de pedimento(s) correspondientes.');
              return false;
            }
          }

          console.log('item_json',item_json);

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
            var fecha = format.parse({value: item_json[i].date, type: format.Type.DATE});
            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_date', value: fecha});
            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_num', value: item_json[i].pediment });
            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_location', value: item_json[i].location });
            ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_quantity', value: item_json[i].quantity });

            var lote = item_json[i].lote;
            if (lote != null && lote != '') {
              ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_lote_serie', value: item_json[i].lote });
            }

            if (item_json[i].aduana) {
              ped_details.setValue({ fieldId: 'custrecord_lmry_mx_ped_aduana', value: item_json[i].aduana });
            }

            // Graba record Latam - MX Pediments Details
            var ped_id = ped_details.save();
          }

            //Retornar a la transacción (Botón Save)
            var urlTransaction = url.resolveRecord({ recordType: "itemfulfillment", recordId: _transac });
            setWindowChanged(window, false);
            window.location.href = urlTransaction;

        }
      } catch (msgerr) {
        console.log(msgerr);
        // library.sendemail(' [ saveRecord ] ' + msgerr, LMRY_script);
      }
    }

    return {
      pageInit: pageInit,
      funcionCancel: funcionCancel,
      fieldChanged: fieldChanged,
      saveRecord: saveRecord
    };

  });
