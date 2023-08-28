/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_EC_BaseAmounts_TaxCode_CLNT.js				      ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 20 2020  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/url', 'N/record', 'N/currentRecord', 'N/runtime', 'N/search', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', './Latam_Library/LMRY_Log_LBRY_V2.0'],

  function(url, record, currentRecord, runtime, search, libraryEmail, libraryLog) {

    var LMRY_script = 'LatamReady - EC Base Amounts CLNT';

    var subsiOW = runtime.isFeatureInEffect({feature: "SUBSIDIARIES"});

    var Language = runtime.getCurrentScript().getParameter({name: 'LANGUAGE'});
    Language = Language.substring(0, 2);

    var jsonLanguage = {
      'subsidiary': {'en': 'MANDATORY SUBSIDIARY FIELD', 'es': 'EL CAMPO SUBSIDIARIA ES OBLIGATORIO', 'pt': 'O CAMPO SUBSIDIÁRIA É OBRIGATÓRIO'},
      'applyto': {'en': 'MANDATORY APPLY TO FIELD', 'es': 'EL CAMPO APLICAR A ES OBLIGATORIO', 'pt': 'O CAMPO APLICAR A É OBRIGATÓRIO'},
      'baseamount': {'en': 'MANDATORY BASE AMOUNT FIELD', 'es': 'EL CAMPO MONTO BASE ES OBLIGATORIO', 'pt': 'O CAMPO VALOR BASE É OBRIGATÓRIO'},
      'taxcode': {'en': 'MANDATORY TAX CODE FIELD', 'es': 'EL CAMPO CÓDIGO DE IMPUESTO ES OBLIGATORIO', 'pt': 'O CAMPO CÓDIGO DE IMPOSTO É OBRIGATÓRIO'},
      'duplicate': {'en': 'THE SAME CONFIGURATION ALREADY EXISTS', 'es': 'YA EXISTE ESTA CONFIGURACIÓN', 'pt': 'ESTA CONFIGURAÇÃO JÁ EXISTE'},
      'error': {'en': 'AN ERROR OCCURRED, THE PROCESS CANNOT BE CONTINUED', 'es': 'OCURRIÓ UN ERROR, NO SE PUEDE CONTINUAR CON EL PROCESO', 'pt': 'OCORREU UM ERRO, O PROCESSO NÃO PODE SER CONTINUADO'}
    };

    var jsonTaxCode = {};
    var evento = '';

    function pageInit(scriptContext){

      try{

        setLanguage();

        var objRecord = scriptContext.currentRecord;
        evento = scriptContext.mode;

        var arraySubsidiary = [];

        //BUSQUEDA DE SUBSIS ECUATORIANAS
        if(subsiOW){
          var searchSubsidiary = search.create({type: 'subsidiary', filters: [{name: 'isinactive', operator: 'is', values: 'F'}, {name: 'country', operator: 'anyof', values: 'EC'}]});
          searchSubsidiary = searchSubsidiary.run().getRange({start: 0, end: 1000});

          if(searchSubsidiary && searchSubsidiary.length){
            for(var i = 0; i < searchSubsidiary.length; i++){
              arraySubsidiary.push(searchSubsidiary[i].id);
            }
          }
        }

        var taxCodeFilters = [];
        taxCodeFilters[0] = search.createFilter({name: 'isinactive', operator: 'is', values: 'F'});
        taxCodeFilters[1] = search.createFilter({name: 'country', operator: 'is', values: 'EC'});
        if(subsiOW && arraySubsidiary.length){
          taxCodeFilters[2] = search.createFilter({name: 'subsidiary', operator: 'anyof', values: arraySubsidiary});
        }

        //BUSQUEDA DE TAX CODES
        var taxCodeColumns = ['itemid', 'rate', 'taxtype'];
        if(subsiOW){
          taxCodeColumns.push('subsidiary');
        }

        var searchTaxCode = search.create({type: 'salestaxitem', columns: taxCodeColumns, filters: taxCodeFilters });
        searchTaxCode = searchTaxCode.run().getRange({start: 0, end: 1000});

        if(searchTaxCode && searchTaxCode.length){
          for(var i = 0; i < searchTaxCode.length; i++){
            var idTaxCode = searchTaxCode[i].id;
            var nameTaxCode = searchTaxCode[i].getValue('itemid');
            var subsiTaxCode = subsiOW ? searchTaxCode[i].getValue('subsidiary') : 1;
            var rateTaxCode = searchTaxCode[i].getValue('rate');

            if(!jsonTaxCode[subsiTaxCode]){
              jsonTaxCode[subsiTaxCode] = [];
            }

            jsonTaxCode[subsiTaxCode].push({'id': idTaxCode, 'rate': rateTaxCode, 'name': nameTaxCode});

          }
        }

        //log.debug('jsonTaxCode', jsonTaxCode);

        //CARGADO Y SETEO X DEFECTO
        loadTaxCode(objRecord.getField('custpage_taxcode'), objRecord, true);

      }catch(err){
        log.error('pageInit',err);
        libraryEmail.sendemail(' [pageInit] ' + err, LMRY_script);
        libraryLog.doLog({title: '[ pageInit ]', message: err, userId: runtime.getCurrentUser().id});
      }

    }

    function loadTaxCode(fieldTaxCode, objRecord, flagSelected){

      var subsidiary = subsiOW ? objRecord.getValue({fieldId: 'custrecord_lmry_ec_taxcode_subsidiary'}) : 1;

      if(Number(subsidiary)){
        if(jsonTaxCode[subsidiary] && jsonTaxCode[subsidiary].length){
          for(var i = 0; i < jsonTaxCode[subsidiary].length; i++){
            fieldTaxCode.insertSelectOption({value: jsonTaxCode[subsidiary][i]['id'], text: jsonTaxCode[subsidiary][i]['name']});
          }

          if(flagSelected){
            var selectedTaxCode = objRecord.getValue('custrecord_lmry_ec_taxcode');
            objRecord.setValue({fieldId: 'custpage_taxcode', value: selectedTaxCode, ignoreFieldChange: true});
          }

        }
      }

    }

    function validateField(scriptContext){

      try{

        if(scriptContext.fieldId == 'custrecord_lmry_ec_taxcode_subsidiary'){

          var objRecord = scriptContext.currentRecord;

          var fTaxCode = objRecord.getField({fieldId: 'custpage_taxcode'});

          fTaxCode.removeSelectOption({value: null});
          fTaxCode.insertSelectOption({value: 0, text: '&nbsp;'});

          loadTaxCode(fTaxCode, objRecord, false);

        }

      }catch(err){
        libraryEmail.sendemail(' [validateField] ' + err, LMRY_script);
        libraryLog.doLog({title: '[ validateField ]', message: err, userId: runtime.getCurrentUser().id});
      }

      return true;

    }

    function saveRecord(scriptContext) {

      try{

        var objRecord = scriptContext.currentRecord;

        var subsidiary = objRecord.getValue({fieldId: 'custrecord_lmry_ec_taxcode_subsidiary'});
        var applyTo = objRecord.getValue({fieldId: 'custrecord_lmry_ec_taxcode_apply_to'});
        var baseAmount = objRecord.getValue({fieldId: 'custrecord_lmry_ec_base_amount'});
        var taxCode = objRecord.getValue({fieldId: 'custpage_taxcode'});

        if(!Number(subsidiary)){
          alert(jsonLanguage['subsidiary'][Language]);
          return false;
        }

        if(applyTo.length == 1 && !applyTo[0]){
          alert(jsonLanguage['applyto'][Language]);
          return false;
        }

        if(!Number(baseAmount)){
          alert(jsonLanguage['baseamount'][Language]);
          return false;
        }

        if(!Number(taxCode)){
          alert(jsonLanguage['taxcode'][Language]);
          return false;
        }

        //DUPLICADOS
        var duplicateFilters = [];
        duplicateFilters[0] = search.createFilter({name: 'isinactive', operator: 'is', values: 'F'});
        duplicateFilters[1] = search.createFilter({name: 'custrecord_lmry_ec_taxcode_subsidiary', operator: 'is', values: subsidiary});
        duplicateFilters[2] = search.createFilter({name: 'custrecord_lmry_ec_base_amount', operator: 'anyof', values: baseAmount});
        duplicateFilters[3] = search.createFilter({name: 'custrecord_lmry_ec_taxcode', operator: 'anyof', values: taxCode});
        if(evento == 'edit'){
          duplicateFilters[4] = search.createFilter({name: 'internalid', operator: 'noneof', values: objRecord.id});
        }

        var searchDuplicate = search.create({type: 'customrecord_lmry_ec_base_amount_taxcode', filters: duplicateFilters, columns: ['custrecord_lmry_ec_taxcode_apply_to']});
        searchDuplicate = searchDuplicate.run().getRange({start: 0, end: 1});

        if(searchDuplicate.length == 1){

          var duplicateApplyTo = searchDuplicate[0].getValue('custrecord_lmry_ec_taxcode_apply_to');
          duplicateApplyTo = duplicateApplyTo.split(',');

          if(JSON.stringify(applyTo) == JSON.stringify(duplicateApplyTo)){
            alert(jsonLanguage['duplicate'][Language]);
            return false;
          }

        }

        return true;

      }catch(err){
        alert(jsonLanguage['error'][Language]);
        libraryEmail.sendemail(' [saveRecord] ' + err, LMRY_script);
        libraryLog.doLog({title: '[ saveRecord ]', message: err, userId: runtime.getCurrentUser().id});
        return false;
      }



    }

    function setLanguage(){

      if(Language != 'es' && Language != 'pt'){
        Language = 'en';
      }

    }

    return {
      pageInit : pageInit,
      validateField: validateField,
      //fieldChanged: fieldChanged,
      saveRecord: saveRecord

    };

  });
