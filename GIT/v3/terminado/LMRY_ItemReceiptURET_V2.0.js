/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Transaction Item Receipt               ||
||                                                              ||
||  File Name: LMRY_ItemReceiptURET_V2.0.js		                  ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 25 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */
//@ts-check
// @ts-ignore
define(['N/search', 'N/record', 'N/https', 'N/runtime', 'N/query', 'N/log', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0',
  './Latam_Library/LMRY_HideView3LBRY_V2.0', './Latam_Library/LMRY_GLImpact_LBRY_V2.0', "./Latam_Library/LMRY_Log_LBRY_V2.0",
  './Latam_Library/LMRY_UniversalSetting_Fulfillment_Receipt_LBRY', 'N/ui/serverWidget', "./WTH_Library/LMRY_ItemReceiptTaxResults_LBRY_v2.0",
  './Latam_Library/LMRY_libToolsFunctionsLBRY_V2.0'],
  function (search, record, https, runtime, query, log, library_mail, library_HideView,
    libraryGLImpact, lbryLog, library_Uni_Setting, serverWidget, libTaxResult, libtools) {
    var LMRY_script = 'LatamReady - Item Receipt URET V2.0';
    function beforeLoad(context) {
      var type = context.type;
      var recordObj = context.newRecord;
      var OBJ_FORM = context.form;
      try {
        if (type != 'print' && type != 'email') {
          var FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
          var subsidiary = 1;
          if (FEAT_SUBS == true || FEAT_SUBS == "T") {
            subsidiary = recordObj.getValue({
              fieldId: 'subsidiary'
            });
          }

          // 08.09.2021 - La logica se paso al script Cliente

          if (!subsidiary) {
            subsidiary = runtime.getCurrentUser().subsidiary;
          }

          var licences = [];

          if (subsidiary) {
            licences = library_mail.getLicenses(subsidiary);
          }

          var LMRY_Result = ValidateAccessIRU(subsidiary, licences);
          var country = LMRY_Result.slice(0, 2);
          var hasAccess = LMRY_Result[2];

          hideandViewFields(context, country, hasAccess, licences);
          if (context.type == 'create') {
            OBJ_FORM.addField({
              id: 'custpage_uni_set_status',
              label: 'Set Estatus',
              type: serverWidget.FieldType.CHECKBOX
            }).defaultValue = 'F';
          }
        }
        // Lógica GL Impact
        if (context.type == 'view') {

          // Obtiene el idioma del entorno
          var featurelang = runtime.getCurrentScript().getParameter({
            name: 'LANGUAGE'
          });
          featurelang = featurelang.substring(0, 2);

          var btnGl = libraryGLImpact.featureGLImpact(recordObj, 'itemreceipt');

          if (btnGl == 1) {
            if (featurelang == 'es') {
              OBJ_FORM.addButton({
                id: 'custpage_id_button_imp',
                label: 'IMPRIMIR GL',
                functionName: 'onclick_event_gl_impact()'
              });
            } else {
              OBJ_FORM.addButton({
                id: 'custpage_id_button_imp',
                label: 'PRINT GL',
                functionName: 'onclick_event_gl_impact()'
              });
            }
            OBJ_FORM.clientScriptModulePath = './Latam_Library/LMRY_GLImpact_CLNT_V2.0.js';
          }

          //Botón MX Pediments
          var recordID = recordObj.id;
          if (library_mail.getAuthorization(521, licences) && country[0] == 'MX') {
            if (searchPediments(recordID)) {
              OBJ_FORM.addButton({
                id: 'custpage_receipt_button_pediments',
                label: 'MX - PEDIMENTS',
                functionName: 'onclick_receipt_pediments()'
              });

              OBJ_FORM.clientScriptModulePath = './Latam_Library/LMRY_GLImpact_CLNT_V2.0.js';
            } else {
              OBJ_FORM.removeButton('edit');
            }
          }
        }



        if (context.type != 'print' && context.type != 'email') {

          //SETEO DEL CUSTBODY LATAMREADY - BR TRANSACTION TYPE PARA FILTRAR LA COLUMNA CFOP
          if (LMRY_Result[0] == 'BR' && LMRY_Result[2] == true && (context.type == 'create' || context.type == 'edit' || context.type == 'copy')) {
            var transactionType = recordObj.getValue('custbody_lmry_br_transaction_type');
            var createdFrom = recordObj.getValue('createdfrom');
            if (!transactionType || (createdFrom != '' && createdFrom != null)) {
              var typeStandard = recordObj.getValue('type');
              if (typeStandard != null && typeStandard != '') {
                var searchTransactionType = search.create({ type: 'customrecord_lmry_trantype', columns: ['internalid'], filters: [{ name: 'name', operator: 'is', values: typeStandard }] });
                var resultTransactionType = searchTransactionType.run().getRange({ start: 0, end: 1 });
                if (resultTransactionType != null && resultTransactionType.length > 0) {
                  recordObj.setValue({ fieldId: 'custbody_lmry_br_transaction_type', value: resultTransactionType[0].getValue('internalid') });
                }

              }
            }
          }



        }


      }
      catch (err) {
        log.error('BeforeLoad', err);
        library_mail.sendemail2(' [ BeforeLoad ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
        lbryLog.doLog({ title: "[ BeforeLoad ]", message: err });
      }
    }

    function beforeSubmit(context) {
      var recordObj = context.newRecord;
      try {
        var eventType = context.type;
        var type_interface = runtime.executionContext;
        var licenses = [];
        var FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });

        var subsidiary = 1;
        if (FEAT_SUBS == true || FEAT_SUBS == "T") {
          subsidiary = recordObj.getValue("subsidiary");
        }

        if (subsidiary) {
          licenses = library_mail.getLicenses(subsidiary);
        }

        var LMRY_Result = ValidateAccessIRU(subsidiary, licenses);

        //Universal Settings se realiza solo al momento de crear
        if (eventType == 'create' && type_interface == 'USERINTERFACE') {
          var type_document = recordObj.getValue('custbody_lmry_document_type');

          if (library_Uni_Setting.auto_universal_setting(licenses, false)) {
            //Solo si el campo LATAM - LEGAL DOCUMENT TYPE se encuentra vacío

            if (recordObj.getValue('custpage_uni_set_status') == 'F' && (type_document == '' || type_document == null)) {
              //Seteo campos cabecera, numero pre impreso y template
              library_Uni_Setting.automatic_setfield(recordObj, false);
              library_Uni_Setting.set_preimpreso(recordObj, LMRY_Result, licenses);
              library_Uni_Setting.set_template(recordObj, licenses);
              recordObj.setValue('custpage_uni_set_status', 'T');
            }
          }
        }

        if (LMRY_Result[0] == "BR" && LMRY_Result[2] && (eventType == "create" || eventType == "edit")) {
          libTaxResult.setLinePosition(recordObj);
        }
        if (LMRY_Result[0] == "MX" && (eventType == "create" || eventType == "edit") && type_interface !== 'USERINTERFACE') {
          var idPurchaseOrder = recordObj.getValue("createdfrom");
          var linesItems = getPedimentoMXtransaction(idPurchaseOrder);
          if (linesItems.length > 0) {
            var nLines = recordObj.getLineCount({
              sublistId: "item"
            });
            for (var index = 0; index < nLines; index++) {
              recordObj.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_lmry_mx_pediment",
                line: index,
                value: true
              });
            };
          }
        }
      } catch (err) {
        log.error("[ beforeSubmit ]", err);
        library_mail.sendemail2(' [ beforeSubmit ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
        lbryLog.doLog({ title: "[ beforeSubmit ]", message: err });
      }
    }

    function afterSubmit(context) {
      var recordObj = context.newRecord;
      try {
        var eventType = context.type;
        var type_interface = runtime.executionContext;
        var licenses = [];
        var FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });

        var subsidiary = 1;
        if (FEAT_SUBS == true || FEAT_SUBS == "T") {
          subsidiary = recordObj.getValue("subsidiary");
        }

        if (subsidiary) {
          licenses = library_mail.getLicenses(subsidiary);
        }

        var LMRY_Result = ValidateAccessIRU(subsidiary, licenses);
        log.debug("LMRY_Result", JSON.stringify(LMRY_Result));

        //Universal Setting se realiza solo al momento de crear
        if (eventType == 'create' && type_interface == 'USERINTERFACE') {
          var type_document = recordObj.getValue('custbody_lmry_document_type');

          //Mediante el custpage se conoce que el seteo de cabecera fue realizado por Universal Setting
          if (recordObj.getValue('custpage_uni_set_status') == 'T') {
            //Seteo de campos perteneciente a record anexado
            library_Uni_Setting.automatic_setfieldrecord(recordObj);
          }
        }

        if (LMRY_Result[0] == "BR" && LMRY_Result[2] && (eventType == "create" || eventType == "edit")) {
          if (library_mail.getAuthorization(735, licenses)) {
            libTaxResult.createItemReceiptTaxResults(recordObj);
          }
        }
        if (LMRY_Result[0] == 'MX' && (eventType == 'create' || eventType == 'edit')) {
          if (libtools.searchPediments(recordObj.id)) {
            const lifoInfo = search.create({
              type: 'customrecord_lmry_mx_transaction_fields',
              filters: [
                'custrecord_lmry_mx_transaction_related', 'anyof', recordObj.getValue('createdfrom')
              ],
              columns: ['custrecord_lmry_mx_pedimento_lifo', 'custrecord_lmry_mx_pedimento_fifo', 'custrecord_lmry_mx_pedimento']
            }).run().getRange(0, 1);
            log.debug('mxt', lifoInfo);
            if (lifoInfo.length > 0) {
              log.debug('mxdata', lifoInfo[0].getValue('custrecord_lmry_mx_pedimento_lifo'));
              if (lifoInfo[0].getValue('custrecord_lmry_mx_pedimento_lifo') == true || lifoInfo[0].getValue('custrecord_lmry_mx_pedimento_fifo') == true || lifoInfo[0].getValue('custrecord_lmry_mx_pedimento') != null) {
                const mensaje = https.requestRestlet({
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
                if (mensaje.indexOf('Error')) {
                  throw mensaje;
                }
              }
            }
          }
        }

      } catch (err) {
        log.error("[ afterSubmit ]", err);
        library_mail.sendemail2(' [ afterSubmit ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
        lbryLog.doLog({ title: "[ afterSubmit ]", message: err });
      }
    }

    function hideandViewFields(context, country, hasAccess, licenses) {
      var type = context.type;
      var recordObj = context.newRecord;
      var form = context.form;
      var typeTrans = recordObj.type;

      if (form) {
        var types = ['create', 'edit', 'copy', 'view'];

        if (types.indexOf(type) != -1) {


          var functionsBySection = { '2': 'PxHide', '5': 'PxHideSubTab', '3': 'PxHideColumn' };
          var codeCountry = "";

          if (hasAccess) {
            codeCountry = country[0];
          }

          for (var section in functionsBySection) {
            var isActive = library_mail.getHideView(country, section, licenses);
            if (isActive || (!licenses || !licenses.length)) {
              library_HideView[functionsBySection[section]](form, codeCountry, typeTrans);
            }

          }
        }
      }
    }

    function ValidateAccessIRU(idSubsidiary, licenses) {
      var LMRY_access = false;
      var LMRY_countr = [];
      var LMRY_Result = [];

      LMRY_countr = library_mail.Validate_Country(idSubsidiary);

      if (!LMRY_countr.length) {
        LMRY_Result[2] = false;
        return LMRY_Result;
      }

      LMRY_access = library_mail.getCountryOfAccess(LMRY_countr, licenses);
      LMRY_Result = [LMRY_countr[0], LMRY_countr[1], LMRY_access]; //CountryText, CountryId, Localization

      return LMRY_Result;
    }

    function searchPediments(obj_ped) {
        //Busca si la transacción ya se registró en el record LatamReady - MX Pediments Detail
        var search_ped = search.create({ type: 'customrecord_lmry_mx_pedimento_details', filters: [{ name: 'custrecord_lmry_mx_ped_trans', operator: 'is', values: obj_ped }], columns: ['internalid'] });
        var result_ped = search_ped.run().getRange({ start: 0, end: 1 });

        if (result_ped != null && result_ped.length > 0) {
          return false;
        } else {
          return true;
        }
    }
    function getPedimentoMXtransaction(idPO) {
      log.debug("idpo", idPO);
      if (Number(idPO) === 0 || idPO === undefined) return [];
      var consulta = "SELECT       CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_pedimento,        CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_pedimento_aduana      FROM        CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS       WHERE         CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_transaction_related = " + idPO + "   and      CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_pedimento IS NOT NULL";
      log.debug("consulta", consulta);
      var nroPedimentoandAduana = query.runSuiteQL({
        query: consulta,
      }).asMappedResults();
      return nroPedimentoandAduana;
    }

    return {
      beforeLoad: beforeLoad,
      beforeSubmit: beforeSubmit,
      afterSubmit: afterSubmit
    };
  });
