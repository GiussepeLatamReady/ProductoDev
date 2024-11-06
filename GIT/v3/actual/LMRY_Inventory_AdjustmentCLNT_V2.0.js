/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_Inventory_AdjustmentCLNT_V2.0.js	          ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     15 ago 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

define(['N/currentRecord', 'N/runtime', 'N/search', 'N/log', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],

  function (currentRecord, runtime, search, log, Library_Mail) {



    var LMRY_script = 'LatamReady - Inventory Adjustment CLNT V2.0';
    var LMRY_access = false;
    var LMRY_countr = new Array();
    var currentRCD = '';
    var mode_type = '';
    var LICENSES = [];

    function pageInit(scriptContext) {

      try {

        currentRCD = scriptContext.currentRecord;
        mode_type = scriptContext.mode;
        //LMRY_countr = Library_Mail.Get_Country_STLT(ID);

        // Desactiva el campo
        currentRCD.getField({
          fieldId: 'custbody_lmry_subsidiary_country'
        }).isDisabled = true;


        var subsidiary = currentRCD.getValue('subsidiary');
        if (subsidiary) {
          LICENSES = Library_Mail.getLicenses(subsidiary);
        }

        // Valida el Acceso
        ValidateAccessAjust(subsidiary);

      } catch (err) {
        Library_Mail.sendemail(' [ pageInit ] ' + err, LMRY_script);
      }
    }


    function validateField(scriptContext) {

      try {


        if (scriptContext.fieldId == 'subsidiary') {
          var currentRCD = scriptContext.currentRecord;

          var subsidiary = currentRCD.getValue('subsidiary');

          if (!subsidiary) {
            subsidiary = runtime.getCurrentUser().subsidiary;
          }

          if (subsidiary) {
            LICENSES = Library_Mail.getLicenses(subsidiary);
          }

          // Valida el Acceso
          ValidateAccessAjust(subsidiary);

          return true;
        }

      } catch (err) {
        Library_Mail.sendemail(' [ validateField ] ' + err, LMRY_script);
      }
      return true;
    }



    function ValidateAccessAjust(ID) {

      try {

        // Oculta todos los campos LMRY
        var currentRCD = currentRecord.get();

        Library_Mail.onFieldsHide([2], currentRCD, false);

        LMRY_countr = Library_Mail.Get_Country_STLT(ID);

        if (LMRY_countr[0] == '' || LMRY_countr[0] == null) {
          return true;
        }

        // Inicializa variables Locales y Globales
        LMRY_access = false;

        // Verifica que el arreglo este lleno
        if (LMRY_countr.length < 1) {
          return true;
        }

        LMRY_access = Library_Mail.getCountryOfAccess(LMRY_countr, LICENSES);

        // Solo si tiene acceso
        if (LMRY_access == true) {
          Library_Mail.onFieldsDisplayBody(currentRCD, LMRY_countr[1], 'custrecord_lmry_on_inventory_adjust', false);
        }
      } catch (err) {
        Library_Mail.sendemail(' [ ValidateAccessAjust ] ' + err, LMRY_script);
      }

      return true;

    }

    return {
      pageInit: pageInit,
      validateField: validateField,

    };

  });
