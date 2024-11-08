/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_Inventory_AdjustmentURET_V2.0.js	          ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 20 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

define([
  'N/log', 'N/ui/serverWidget', 'N/record', 'N/search', 'N/runtime', 'N/https',
  './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', 
  './Latam_Library/LMRY_GLImpact_LBRY_V2.0', 
  './Latam_Library/LMRY_HideViewLBRY_V2.0',
  './Latam_Library/LMRY_MX_Pedimentos_LBRY_2.0'
],

  function (
    log, serverWidget, record, search, runtime, https,
    library, 
    libraryGLImpact, 
    Library_HideView,
    MXPedimentos
  ) {

    var LMRY_script = "LatamReady - Inventory Adjustment URET V2.0";
    var recordObj = '';
    var form = '';
    var type = '';

    function beforeLoad(scriptContext) {

      try {

        type = scriptContext.type;
        form = scriptContext.form;
        recordObj = scriptContext.newRecord;
        var request = scriptContext.request;

        var LMRY_countr = new Array();
        var country = new Array();
        country[0] = '';
        country[1] = '';

        var LICENSES = [];
        var subsidiary = recordObj.getValue('subsidiary');

        if (subsidiary) {
          LICENSES = library.getLicenses(subsidiary);
        }


        if (scriptContext.type == 'create') {
          try {

            var subsidiari = recordObj.getValue({
              fieldId: 'subsidiary'
            });

            if (subsidiari == '' || subsidiari == null) {
              var userS = runtime.getCurrentUser();
              subsidiari = userS.subsidiary;
            }

            if (subsidiari != '' && subsidiari != null) {
              var filters = new Array();
              filters[0] = search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: [subsidiari]
              });
              var columns = new Array();
              columns[0] = search.createColumn({
                name: 'country'
              });

              var getfields = search.create({
                type: 'subsidiary',
                columns: columns,
                filters: filters
              });
              getfields = getfields.run().getRange(0, 1000);

              if (getfields != '' && getfields != null) {
                country[0] = getfields[0].getValue('country');
                country[1] = getfields[0].getText('country');
              }
            }
          } catch (err) {

            country[0] = runtime.getCurrentScript().getParameter({
              name: 'custscript_lmry_country_code_stlt'
            });
            country[1] = runtime.getCurrentScript().getParameter({
              name: 'custscript_lmry_country_desc_stlt'
            });
          }

          if (form != '' && form != null) {
            Library_HideView.HideSubTab(form, country[1], recordObj.type, LICENSES);
          }
        }

        if (type == 'view' || type == 'edit') {

          var country = ValidateAccessAjust(subsidiary, form, LICENSES);

          if (type == 'view') {

            var featurelang = runtime.getCurrentScript().getParameter({
              name: 'LANGUAGE'
            });

            featurelang = featurelang.substring(0, 2);

            // Lógica GL Impact
            var btnGl = libraryGLImpact.featureGLImpact(recordObj, 'inventoryadjustment');
            if (btnGl == 1) {
              if (featurelang == 'es') {
                form.addButton({
                  id: 'custpage_id_button_imp',
                  label: 'IMPRIMIR GL',
                  functionName: 'onclick_event_gl_impact()'
                });
              } else {
                form.addButton({
                  id: 'custpage_id_button_imp',
                  label: 'PRINT GL',
                  functionName: 'onclick_event_gl_impact()'
                });
              }
              form.clientScriptModulePath = './Latam_Library/LMRY_GLImpact_CLNT_V2.0.js';
            }

            //Botón MX Pediments
            var recordID = recordObj.id;
            if(library.getAuthorization(521, LICENSES) && country[0] == 'MX'){

              if(searchPediments(recordID)){
                form.addButton({
                  id: 'custpage_button_inv_pediments',
                  label: 'MX - PEDIMENTS',
                  functionName: 'onclick_inventory_pediments()'
                });

                form.clientScriptModulePath = './Latam_Library/LMRY_GLImpact_CLNT_V2.0.js';
              }else{
                form.removeButton('edit');
              }
            }
          }
        }
        var subsidiaryID = request.parameters.subsidiary;
        if (subsidiaryID) recordObj.setValue({ fieldId: 'subsidiary', value: subsidiaryID });
        if (subsidiaryID || country[0] == "MX") {
          if (country[0] == "MX") subsidiaryID = subsidiary;
          var featPedimentos = MXPedimentos.isAutomaticPedimentos(subsidiaryID);
          if (runtime.executionContext == 'USERINTERFACE' && featPedimentos && (type === "create" || type === "edit" || type === "copy" || type === "view")) {
            MXPedimentos.showMXTransactionbyPedimentFields(form, recordObj.id, "purchaseorder", type);
          }
          
        }
      } catch (error) {
        log.error(" [ beforeLoad ]  error",error);
        library.sendemail(' [ beforeLoad ] ' + error, LMRY_script);
      }

    }

    function beforeSubmit(context){
      try {
        recordObj = context.newRecord;
        form = context.form;
        var LICENSES = [];
        var FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
        var subsidiary = 1;
        if (FEAT_SUBS == true || FEAT_SUBS == "T") {
          subsidiary = recordObj.getValue("subsidiary");
        }

        if (subsidiary) {
          LICENSES = library.getLicenses(subsidiary);
        }

        var country = ValidateAccessAjust(subsidiary, form, LICENSES);
        if (country[0] === 'MX') {
          var featPedimentos = MXPedimentos.isAutomaticPedimentos(subsidiary);
          if (featPedimentos && (type == "create" || type == "edit")) {
            MXPedimentos.updateLinesUsePedimentos(recordObj);
          }
        }
      } catch (error) {
        log.error(" [ beforeSubmit ]  error",error);
        library.sendemail(' [ beforeSubmit ] ' + error, LMRY_script);
      }
    }

    function afterSubmit(context) {
      var recordObj = context.newRecord;
      try {
        var eventType = context.type;
        form = context.form;
        var LICENSES = [];
        var FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
        var subsidiary = 1;
        if (FEAT_SUBS == true || FEAT_SUBS == "T") {
          subsidiary = recordObj.getValue("subsidiary");
        }

        if (subsidiary) {
          LICENSES = library.getLicenses(subsidiary);
        }

        var country = ValidateAccessAjust(subsidiary, form, LICENSES);
        if (country[0] === 'MX') {
          var featPedimentos = MXPedimentos.isAutomaticPedimentos(subsidiary)
          if ((eventType === "create" || eventType === "edit" || eventType === "copy" || eventType === "view") && featPedimentos) {
            MXPedimentos.createMXTransactionbyPediment(recordObj, true, recordObj.id);
          }
          if (featPedimentos && (eventType == 'create' || eventType == 'edit')) {
            if (searchPediments(recordObj.id)) {
              const lifoInfo = search.create({
                type: 'customrecord_lmry_mx_transaction_fields',
                filters: [
                  'custrecord_lmry_mx_transaction_related', 'anyof', recordObj.id
                ],
                columns: ['custrecord_lmry_mx_pedimento_lifo', 'custrecord_lmry_mx_pedimento_fifo', 'custrecord_lmry_mx_pedimento']
              }).run().getRange(0, 1);
              if (lifoInfo.length > 0) {
                if (lifoInfo[0].getValue('custrecord_lmry_mx_pedimento_lifo') == true || lifoInfo[0].getValue('custrecord_lmry_mx_pedimento_fifo') == true || lifoInfo[0].getValue('custrecord_lmry_mx_pedimento') != null) {
                  var mensaje = https.requestRestlet({
                    deploymentId: "customdeploy_lmry_pedimentos_rlt",
                    scriptId: "customscript_lmry_pedimentos_rlt",
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    urlParams: {
                      idRecord: recordObj.id
                    }
                  });
  
                  if (typeof mensaje != "object" && mensaje.indexOf('Error')) {
                    throw mensaje;
                  }
                }
              }
            }
          }
        }
        
        

      } catch (err) {
        log.error(" [ afterSubmit ]  error",err);
        log.error(" [ afterSubmit ]  error stack",err.stack);
        library.sendemail(' [ afterSubmit ] ' + err, LMRY_script);
      }
    }

    function ValidateAccessAjust(sub, form, LICENSES) {

      try {
        var LMRY_countr = new Array();
        var LMRY_access = false;
        // Oculta todos los campos LMRY
        if (type == 'view') {
          library.onFieldsHide([2], form, true);
        }

        // Inicializa variables Locales y Globales
        LMRY_countr = library.Validate_Country(sub);

        // Verifica que el arreglo este lleno
        if (LMRY_countr.length < 1) {
          return true;
        }

        if ((type == 'view' || type == 'edit') && (form != '' && form != null)) {
          Library_HideView.HideSubTab(form, LMRY_countr[1], recordObj.type, LICENSES);
        }

        LMRY_access = library.getCountryOfAccess(LMRY_countr, LICENSES);

        // Solo si tiene acceso
        if (LMRY_access == true) {
          if (type == 'view') {
            library.onFieldsDisplayBody(form, LMRY_countr[1], 'custrecord_lmry_on_inventory_adjust', true);
          }
        }

        return LMRY_countr;

      } catch (err) {
        library.sendemail(' [ ValidateAccessAjust ] ' + err, LMRY_script);
      }

    }

    function searchPediments(obj_ped){
      try{

          //Busca si la transacción ya se registró en el record LatamReady - MX Pediments Detail
        var search_ped = search.create({type:'customrecord_lmry_mx_pedimento_details',filters:[{name:'custrecord_lmry_mx_ped_trans',operator:'is',values:obj_ped}],columns:['internalid']});

        var result_ped = search_ped.run().getRange({start:0,end:1});

        if(result_ped != null && result_ped.length > 0){
          return false;
        }else{
          return true;
        }

      }catch(err){
        log.error('searchPediments', err);
        library.sendemail2(' [ searchPediments ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }
    }

    return {
      beforeLoad: beforeLoad,
      beforeSubmit:beforeSubmit,
      afterSubmit:afterSubmit
    };

  });
