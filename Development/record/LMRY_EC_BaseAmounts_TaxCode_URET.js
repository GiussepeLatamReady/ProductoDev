/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Tools for Report                           ||
||                                                              ||
||  File Name: LMRY_EC_BaseAmounts_TaxCode_URET.js              ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 20 2021  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/runtime', 'N/search', 'N/currency', 'N/log', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0','./Latam_Library/LMRY_Log_LBRY_V2.0'],

function(record, runtime, search, currency, log, libraryEmail, libraryLog) {

    var LMRY_script = 'LatamReady - EC Base Amounts URET';

    var subsiOW = runtime.isFeatureInEffect({feature: "SUBSIDIARIES"});

    var Language = runtime.getCurrentScript().getParameter({name: 'LANGUAGE'});
    Language = Language.substring(0, 2);

    setLanguage();

    var jsonLanguage = {
      'taxcode': {'en': 'Latam - Tax Code', 'es': 'Latam - Código de Impuesto', 'pt': 'Latam - Código de Imposto'}
    };

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

      try{

        var objRecord = scriptContext.newRecord;
        var formulario = scriptContext.form;
        var type = scriptContext.type;

        //var events = ['view', 'edit', 'create', 'copy'];

        if(type == 'view'){

          var pTaxCode = formulario.addField({id: 'custpage_taxcode', label: jsonLanguage['taxcode'][Language], type: 'text'});

          var taxCode = objRecord.getValue('custrecord_lmry_ec_taxcode');

          if(Number(taxCode)){

            var nameTaxCode = search.lookupFields({type: 'salestaxitem', id: taxCode, columns: ['itemid']});
            nameTaxCode = nameTaxCode.itemid;

            objRecord.setValue('custpage_taxcode', nameTaxCode);

          }

        }else{

          var pTaxCode = formulario.addField({id: 'custpage_taxcode', label: jsonLanguage['taxcode'][Language], type: 'select'});
          pTaxCode.isMandatory = true;

        }


      }catch(err){
        libraryEmail.sendemail(' [beforeLoad] ' + err, LMRY_script);
        libraryLog.doLog({title: '[ beforeLoad ]', message: err, userId: runtime.getCurrentUser().id});
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
    function beforeSubmit(scriptContext) {

      try{

        var objRecord = scriptContext.newRecord;
        var type = scriptContext.type;

        var events = ['edit', 'create', 'copy'];

        if(events.indexOf(type) != -1){

          var taxCode = objRecord.getValue('custpage_taxcode');

          if(Number(taxCode)){

            var nameTaxCode = search.lookupFields({type: 'salestaxitem', id: taxCode, columns: ['itemid']});
            nameTaxCode = nameTaxCode.itemid;

            objRecord.setValue('custrecord_lmry_ec_taxcode', taxCode);
            objRecord.setValue('custrecord_lmry_ec_taxcode_text', nameTaxCode);

          }


        }

      }catch(err){
        libraryEmail.sendemail(' [beforeLoad] ' + err, LMRY_script);
        libraryLog.doLog({title: '[ beforeLoad ]', message: err, userId: runtime.getCurrentUser().id});
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

    }

    function setLanguage(){

      if(Language != 'es' && Language != 'pt'){
        Language = 'en';
      }

    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
        //afterSubmit: afterSubmit
    };

});
