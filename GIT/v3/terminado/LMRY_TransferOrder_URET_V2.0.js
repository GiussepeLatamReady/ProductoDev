/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Transaction Transfer Order                 ||
||                                                              ||
||  File Name: LMRY_TransferOrder_URET_V2.0.js                  ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Set 09 2021  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */
define(['N/runtime', 'N/log', 'N/search', 'N/record', 'N/ui/serverWidget',
  './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0',
  './Latam_Library/LMRY_HideViewLBRY_V2.0',
  './Latam_Library/LMRY_BR_ValidateDuplicate_LBRY_V2.0',
  './Latam_Library/LMRY_MX_Pedimentos_LBRY_2.0'],

  function (runtime, log, search, record, serverWidget, library_mail, library_HideView, Library_BRDup, MXPedimentos) {
    var LMRY_script = 'LatamReady - Transfer Order URET V2.0';
    var licenses = [];

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
      try {
        /* ************************************
         * Fecha : 2022.03.17
         * Se agrega el Hide And View
         ************************************ */
        var recordObj = scriptContext.newRecord;

        // Obtiene la interface que se esta ejecutando
        var type_interface = runtime.executionContext;
        if (type_interface == 'MAPREDUCE') {
          return true;
        }

        var RCD_OBJ = scriptContext.currentRecord;
        var OBJ_FORM = scriptContext.form;

        // Se ejecuta cuando es diferente de Print y EMail
        if (scriptContext.type != 'print' && scriptContext.type != 'email') {
          RCD_OBJ = scriptContext.newRecord;
          OBJ_FORM = scriptContext.form;

          var LMRY_countr = new Array();
          var country = new Array();
          country[0] = '';
          country[1] = '';
          var subsidiary = RCD_OBJ.getValue({
            fieldId: 'subsidiary'
          });

          // Obtiene valores de la subsidiaria
          try {
            var subsidiari = RCD_OBJ.getValue({
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
            log.debug('err 1', err);
            subsidiari = 1;
            country[0] = runtime.getCurrentScript().getParameter({
              name: 'custscript_lmry_country_code_stlt'
            });
            country[1] = runtime.getCurrentScript().getParameter({
              name: 'custscript_lmry_country_desc_stlt'
            });
          } // Obtiene valores de la subsidiaria

          var LICENSES = [];
          if (subsidiari) {
            LICENSES = library_mail.getLicenses(subsidiari);
          }
          // Hide and View en formulario
          if (scriptContext.form != '' && scriptContext.form != null) {
            // Solo cuando es View
            if (scriptContext.type == 'view') {
              log.debug('library_mail', 'onFieldsHide');
              library_mail.onFieldsHide([2], scriptContext.form, true);
            }
            log.debug('library_HideView', 'HideSubTab');
            library_HideView.HideSubTab(scriptContext.form, country[1], recordObj.type, LICENSES);
            log.debug('library_HideView', 'HideColumn');
            library_HideView.HideColumn(scriptContext.form, country[1], recordObj.type, LICENSES);
          } // Hide and View en formulario

          if ((runtime.executionContext == 'USERINTERFACE' && (scriptContext.type === "create" || scriptContext.type === "edit" || scriptContext.type === "copy" || scriptContext.type === "view"))) {
            MXPedimentos.showMXTransactionbyPedimentFields(OBJ_FORM, RCD_OBJ.id, RCD_OBJ.type);
          }
        }

      } catch (err) {
        log.error(' [ beforeLoad ] ', err);
        library_mail.sendemail(' [ beforeLoad ] ' + err, LMRY_script);
      }

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
      var recordObj = scriptContext.newRecord;
      try {

        // Obtiene la interface que se esta ejecutando
        var type_interface = runtime.executionContext;
        if (type_interface == 'MAPREDUCE') {
          return true;
        }

        var type = scriptContext.type;

        var subsidiary = recordObj.getValue('subsidiary');

        licenses = library_mail.getLicenses(subsidiary);
        var LMRY_Result = ValidateAccessTO(subsidiary);

        if (LMRY_Result[0] == "BR") {
          if (type == 'create') {
            Library_BRDup.assignPreprinted(recordObj, licenses);
          }
        }
        if ((type == "create" || type == "edit" || type == "copy" || type == "view") && LMRY_Result[0] == 'MX') {
          MXPedimentos.createMXTransactionbyPediment(recordObj);
        }
      } catch (error) {
        library_mail.sendemail2(' [ afterSubmit ] ' + error, LMRY_script, recordObj, 'tranid', 'entity');
      }
      return true;
    }

    function ValidateAccessTO(idSubsidiary) {
      var LMRY_access = false;
      var LMRY_countr = [];
      var LMRY_Result = [];
      try {
        LMRY_countr = library_mail.Validate_Country(idSubsidiary);

        if (!LMRY_countr.length) {
          LMRY_Result[0] = '';
          LMRY_Result[1] = '';
          LMRY_Result[2] = false;
          return LMRY_Result;
        }

        LMRY_access = library_mail.getCountryOfAccess(LMRY_countr, licenses);

        LMRY_Result = [LMRY_countr[0], LMRY_countr[1], LMRY_access];
      }
      catch (err) {
        throw ' [ ValidateAccessTO ] ' + err;
      }

      return LMRY_Result;
    }

    return {
      beforeLoad: beforeLoad,
      //beforeSubmit: beforeSubmit,
      afterSubmit: afterSubmit
    };
  });