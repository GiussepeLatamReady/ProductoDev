/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_VendorReturnAuthorizationURET_V2.0.js       ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 20 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

define(['N/log', 'N/ui/serverWidget', 'N/record', 'N/search', 'N/runtime', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', './Latam_Library/LMRY_HideViewLBRY_V2.0', './Latam_Library/LMRY_GLImpact_LBRY_V2.0', './Latam_Library/LMRY_MX_Pedimentos_LBRY_2.0'],

  function (log, serverWidget, record, search, runtime, library, library_HideView, libraryGLImpact, MXPedimentos) {

    var LMRY_script = "LatamReady - Vendor Return Authorization URET V2.0";
    var recordObj = '';
    var isUret = true;
    var type;
    var subsi_OW = runtime.isFeatureInEffect({
      feature: "SUBSIDIARIES"
    });

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

        type = scriptContext.type;
        var form = scriptContext.form;
        recordObj = scriptContext.newRecord;
        var LMRY_Result = new Array();

        var LMRY_countr = new Array();
        var country = new Array();
        country[0] = '';
        country[1] = '';

        var LICENSES = [];
        var subsidiary = recordObj.getValue('subsidiary');
        if (subsidiary) {
          LICENSES = library.getLicenses(subsidiary);
        }


        if (type == 'create') {
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


          if (scriptContext.form != '' && scriptContext.form != null) {
            library_HideView.HideSubTab(scriptContext.form, country[1], recordObj.type, LICENSES);
            library_HideView.HideColumn(scriptContext.form, country[1], recordObj.type, LICENSES);
          }
        }


        if (subsi_OW == true || subsi_OW == 'T') {
          LMRY_Result = ValidAccessVRAU(recordObj.getValue({
            fieldId: 'subsidiary'
          }), scriptContext.form, isUret, type, LICENSES);
        }

        
        if (type == 'view' || type == 'edit') {
          

          if (type == 'view') {
            var featurelang = runtime.isFeatureInEffect({
              feature: 'LANGUAGE'
            });

            // Lógica GL Impact
            var btnGl = libraryGLImpact.featureGLImpact(recordObj, 'vendorreturnauthorization');
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
          }


        }
        if (LMRY_Result[0] == "MX") {
          var featPedimentos = MXPedimentos.isAutomaticPedimentos(subsidiary)
          if (featPedimentos && (runtime.executionContext == 'USERINTERFACE' && (scriptContext.type == "create" || scriptContext.type == "edit" || scriptContext.type == "copy" || scriptContext.type == "view"))) {
            MXPedimentos.showMXTransactionbyPedimentFields(form, recordObj.id, recordObj.type, type);
          }
        }
        
  
      } catch (error) {
        library.sendemail(' [ beforeLoad ] ' + error, LMRY_script);
      }
    }

    /* ------------------------------------------------------------------------------------------------------
     * A la variable featureId se le asigna el valore que le corresponde
     * --------------------------------------------------------------------------------------------------- */
    function ValidAccessVRAU(ID, CR, isUret, type, LICENSES) {
      try {

        var LMRY_access = false;
        var LMRY_countr = new Array();
        var LMRY_Result = new Array();

        if (type == 'view') {
          // Oculta todos los campos LMRY
          library.onFieldsHide([2], CR, isUret);
        }

        // Inicializa variables Locales y Globales
        LMRY_countr = library.Validate_Country(ID);

        // Verifica que el arreglo este lleno
        if (LMRY_countr.length < 1) {
          LMRY_Result[2] = LMRY_access;
          return LMRY_Result;
        }

        if ((type == 'view' || type == 'edit') && (CR != '' && CR != null)) {
          library_HideView.HideColumn(CR, LMRY_countr[1], recordObj.type, LICENSES);
          library_HideView.HideSubTab(CR, LMRY_countr[1], recordObj.type, LICENSES);
        }
        LMRY_access = library.getCountryOfAccess(LMRY_countr, LICENSES);

        // Solo si tiene acceso
        if (LMRY_access == true) {

          if (type == 'view') {
            library.onFieldsDisplayBody(CR, LMRY_countr[1], 'custrecord_lmry_on_vend_return_autho', isUret);
          }
        }

        // Asigna Valores
        LMRY_Result[0] = LMRY_countr[0];
        LMRY_Result[1] = LMRY_countr[1];
        LMRY_Result[2] = LMRY_access;

      } catch (error) {
        library.sendemail(' [ ValidAccessVRAU ] ' + error, LMRY_script);
      }

      return LMRY_Result;
    }

    function afterSubmit(scriptContext) {
      try {
        const RCD_OBJ = scriptContext.newRecord;
        const subsidiary = RCD_OBJ.getValue('subsidiary');
        const type = scriptContext.type;

        const LMRY_countr = library.Validate_Country(subsidiary);
        if (LMRY_countr[0] === 'MX') {
          const featPedimentos = MXPedimentos.isAutomaticPedimentos(subsidiary)
          if ((type === "create" || type === "edit" || type === "copy" || type === "view") && featPedimentos) {
            MXPedimentos.createMXTransactionbyPediment(RCD_OBJ);
          }
        }
        
      } catch (error) {
        library.sendemail(' [ afterSubmit ] ' + error, LMRY_script);
      }

    }

    return {
      beforeLoad: beforeLoad,
      afterSubmit: afterSubmit
    };

  });
