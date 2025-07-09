/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_ItemFulfillmentURET_V2.0.js		            ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 25 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */
define(['N/runtime', 'N/log', 'N/search', 'N/record', 'N/ui/serverWidget', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0',
  './Latam_Library/LMRY_HideViewLBRY_V2.0','./Latam_Library/LMRY_MX_Pedimentos_LBRY_2.0'],

  function (runtime, log, search, record, serverWidget, library_mail, library_HideView,MXPedimentos) {

    var LMRY_script = 'LatamReady - Inventory Transfer URET V2.0';
    var licenses = [];

    function beforeLoad(context) {

      var type = context.type;
      var recordObj = context.newRecord;
      var OBJ_FORM = context.form;

      try {

        // Obtiene la interface que se esta ejecutando
        var type_interface = runtime.executionContext;
        if (type_interface == 'MAPREDUCE') {
          return true;
        }

        if (type != 'print' && type != 'email') {
          var subsidiary = recordObj.getValue({
            fieldId: 'subsidiary'});

          if (!subsidiary) {
            subsidiary = runtime.getCurrentUser().subsidiary;
          }

          licenses = library_mail.getLicenses(subsidiary);

          var LMRY_Result = ValidateAccessIFU(subsidiary);
          var country = LMRY_Result[1];
          var hasAccess = LMRY_Result[2];

        }//FIN DE NO PRINT Y NO EMAIL


        // Lógica GL Impact
        if (context.type == 'view') {
          // Obtiene el idioma del entorno
          var featurelang = runtime.getCurrentScript().getParameter({name: 'LANGUAGE'});
          featurelang = featurelang.substring(0, 2);

          //Botón MX Pediments
          var recordID = recordObj.id;
          if (library_mail.getAuthorization(521, licenses) && LMRY_Result[0] == 'MX') {

            if (searchPediments(recordID)) {
              OBJ_FORM.addButton({
                id: 'custpage_button_invtransfer_pediments',
                label: 'MX - PEDIMENTS',
                functionName: 'onclick_invtransfer_pediments()'
              });

              OBJ_FORM.clientScriptModulePath = './Latam_Library/LMRY_GLImpact_CLNT_V2.0.js';
            } else {
              OBJ_FORM.removeButton('edit');
            }
          }
        }
        log.error("country",country)
        log.error("LMRY_Result[0]",LMRY_Result[0])
  
        if (LMRY_Result[0] === "MX") {
          var featPedimentos = MXPedimentos.isAutomaticPedimentos(subsidiary)
          if (featPedimentos && (runtime.executionContext == 'USERINTERFACE' && (type === "create" || type === "edit" || type === "copy" || type === "view"))) {
            MXPedimentos.showMXTransactionbyPedimentFields(form, recordObj.id, recordObj.type, type);
          }
        }

      }
      catch (err) {
        log.error('BeforeLoad', err);
        library_mail.sendemail2(' [ BeforeLoad ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }
    }

    function beforeSubmit(context) {
      var recordObj = context.oldRecord;
      var RCD = context.newRecord;

      try {

        // Obtiene la interface que se esta ejecutando
        var type_interface = runtime.executionContext;
        if (type_interface == 'MAPREDUCE') {
          return true;
        }

        var formulario = context.form;
        var type = context.type;

        var subsidiary = '';

        if (type == 'create') {
          var newrecordObj = context.newRecord;
          subsidiary = newrecordObj.getValue('subsidiary');
        } else {
          subsidiary = recordObj.getValue('subsidiary');
        }

        licenses = library_mail.getLicenses(subsidiary);
        var LMRY_Result = ValidateAccessIFU(subsidiary);


        if (LMRY_Result[0] == 'MX' && context.type == "delete") {
          MXPedimentos.deletePedimentoDetails(recordObj.id)
        }

      } catch (err) {
        library_mail.sendemail2(' [ beforeSubmit ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }
    }

    function afterSubmit(context) {
      try {

        // Obtiene la interface que se esta ejecutando
        var type_interface = runtime.executionContext;
        if (type_interface == 'MAPREDUCE') {
          return true;
        }
        var RCD = context.newRecord;
        var subsidiary = RCD.getValue('subsidiary');
        var type = context.type;


        licenses = library_mail.getLicenses(subsidiary);
        var LMRY_Result = ValidateAccessIFU(subsidiary);


        if (LMRY_Result[0] === 'MX') {
          const featPedimentos = MXPedimentos.isAutomaticPedimentos(subsidiary)
          if (featPedimentos) {
            if ((type === "create" || type === "edit" || type === "copy" || type === "view")) {
              MXPedimentos.createMXTransactionbyPediment(RCD);
            }
            if (type == 'create' || type == 'edit') {

              var message = MXPedimentos.createPedimentos(RCD.id, RCD.id);
              if (typeof message != "object" && message.indexOf('Error')) {
                throw message;
              }
            }

          }
        }
           
      } catch (err) {
        library_mail.sendemail2(' [ afterSubmit ] ' + err, LMRY_script, RCD, 'tranid', 'entity');
      }

    }

    function ValidateAccessIFU(idSubsidiary) {
      var LMRY_access = false;
      var LMRY_countr = [];
      var LMRY_Result = [];
      try {
        LMRY_countr = library_mail.Validate_Country(idSubsidiary);

        if (!LMRY_countr.length) {
          LMRY_Result[2] = false;
          return LMRY_Result;
        }

        LMRY_access = library_mail.getCountryOfAccess(LMRY_countr, licenses);

        LMRY_Result = [LMRY_countr[0], LMRY_countr[1], LMRY_access];
      }
      catch (err) {
        throw ' [ ValidateAccessIFU ] ' + err;
      }

      return LMRY_Result;
    }

    function searchPediments(obj_ped) {
      try {

        //Busca si la transacción ya se registró en el record LatamReady - MX Pediments Detail
        var search_ped = search.create({ type: 'customrecord_lmry_mx_pedimento_details', filters: [{ name: 'custrecord_lmry_mx_ped_trans', operator: 'is', values: obj_ped }], columns: ['internalid'] });

        var result_ped = search_ped.run().getRange({ start: 0, end: 1 });

        if (result_ped != null && result_ped.length > 0) {
          return false;
        } else {
          return true;
        }

      } catch (err) {
        log.error('searchPediments', err);
        library_mail.sendemail2(' [ searchPediments ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }
    }

    return {
      beforeLoad: beforeLoad,
      beforeSubmit: beforeSubmit,
      afterSubmit: afterSubmit
    }
  });
