/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
  ||  This script for customer center                             ||
  ||                                                              ||
  ||  File Name:  LMRY_ArWsSetupCLNT_V2.0.js  	                  ||
  ||                                                              ||
  ||  Version Date         Author        Remarks                  ||
  ||  2.0     Feb 20 2018  LatamReady    Bundle 37714             ||
   \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define(['N/log', 'N/search', 'N/runtime', 'N/email'/*, './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'*/],
  function(log, search, runtime, email/*, libraryMail*/) {

    // Nombre del Script
    var LMRY_script = "LatamReady - AR WS SETUP CLNT V2.0";


    var Language = '';

    var recordObj = '';
    var mode = '';
    var enab_loc;
    var enab_dep;
    var enab_clas;
    var pref_loc;
    var pref_dep;
    var pref_clas;
    var opc = false;


    function pageInit(scriptContext) {
      Language = runtime.getCurrentScript().getParameter({name:'LANGUAGE'});
      Language = Language.substring(0,2);
      enab_loc = runtime.isFeatureInEffect({feature: 'LOCATIONS'});
      enab_dep = runtime.isFeatureInEffect({feature: 'DEPARTMENTS'});
      enab_clas = runtime.isFeatureInEffect({feature: 'CLASSES'});
      pref_loc = runtime.getCurrentUser().getPreference({name:'LOCMANDATORY'});
      pref_dep = runtime.getCurrentUser().getPreference({name:'DEPTMANDATORY'});
      pref_clas = runtime.getCurrentUser().getPreference({name:'CLASSMANDATORY'});
      mode = scriptContext.mode;
      recordObj= scriptContext.currentRecord;
      var docType = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_fiscal_doctype'});
      if(docType!=null && docType!=''){
        recordObj.setValue({fieldId:'custpage_doc_type',value:docType});
      }
      var taxGroup = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_tax_code_group'});
      if(taxGroup!=null && taxGroup!=''){
        recordObj.setValue({fieldId:'custpage_tax_group',value:taxGroup});
      }
      var addAcum = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_add_accumulated'});
      if(addAcum!=null && addAcum!=''){
        recordObj.setValue({fieldId:'custpage_add_acum',value:addAcum});
      }
      var typeCCL = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_type'});
      if(typeCCL!=null && typeCCL!=''){
        recordObj.setValue({fieldId:'custpage_type',value:typeCCL});
      }
      var subtypeCCL = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_subtype'});
      if(subtypeCCL!=null && subtypeCCL!=''){
        recordObj.setValue({fieldId:'custpage_subtype',value:subtypeCCL});
      }
      var amount_To = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_amountto'});
      if(amount_To!=null && amount_To!=''){
        recordObj.setValue({fieldId:'custpage_amountto',value:amount_To});
      }
      var accum_min = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_accandmin_with'});
      if(accum_min!=null && accum_min!=''){
        recordObj.setValue({fieldId:'custpage_accum_min',value:accum_min});
      }
      var resp_type = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_resptype'});
      if(resp_type!=null && resp_type!=''){
        recordObj.setValue({fieldId:'custpage_resptype',value:resp_type});
      }
      var iibb_norm = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_normas_iibb'});
      if(iibb_norm!=null && iibb_norm!=''){
        recordObj.setValue({fieldId:'custpage_iibbnorm',value:iibb_norm});
      }
      var applies_to = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_appliesto'});
      if(applies_to!=null && applies_to!=''){
        recordObj.setValue({fieldId:'custpage_appliesto',value:applies_to});
      }
      var jurisdiction_iibb = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_jurisdiccion'});
      if(jurisdiction_iibb!=null && jurisdiction_iibb!=''){
        recordObj.setValue({fieldId:'custpage_jurisdiction',value:jurisdiction_iibb});
      }
      var gen_tran = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_gen_transaction'});
      if(gen_tran!=null && gen_tran!=''){
        recordObj.setValue({fieldId:'custpage_gen_tran',value:gen_tran});
      }
      var tax_type = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_taxtype'});
      if(tax_type!=null && tax_type!=''){
        recordObj.setValue({fieldId:'custpage_taxtype',value:tax_type});
      }
      var base_amount = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_base_amount'});
      if(base_amount!=null && base_amount!=''){
        recordObj.setValue({fieldId:'custpage_base_amount',value:base_amount});
      }
      var tran_types = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_tran_types'});
      if(tran_types!=null && tran_types!='' && tran_types!='""'){
        tran_types = tran_types.split(',');
        recordObj.setValue({fieldId:'custpage_tran_type',value:tran_types});
      }
      opc = true;
      return true;
    }

    function validateField(scriptContext) {
      try{
        var objRecord = scriptContext.currentRecord;
        var name = scriptContext.fieldId;
        if(name == 'custpage_type'){
          var typeCCL = objRecord.getValue({fieldId:'custpage_type'});
          if(typeCCL=='' || typeCCL==null || typeCCL==0){
            return true;
          }
          var subtypeField = objRecord.getField({fieldId:'custpage_subtype'});
          subtypeField.removeSelectOption({value: null});
          var subtypeContClass = search.create({
            type: 'customrecord_lmry_ar_wht_type',
            filters: [['custrecord_lmry_type','is',typeCCL],'AND',['isinactive','is','F']],
            columns: ['internalid','name']
          });
          subtypeContClass = subtypeContClass.run().getRange(0,1000);
          subtypeField.insertSelectOption({value:0,text:' '});
          if(subtypeContClass!=null && subtypeContClass!=''){
            for(var i=0;i<subtypeContClass.length;i++){
              subtypeField.insertSelectOption({value: subtypeContClass[i].getValue('internalid'),text: subtypeContClass[i].getValue('name')});
            }
          }
        }
        if(name == 'custpage_taxtype' && opc){
          var taxType = objRecord.getValue({fieldId:'custpage_taxtype'});
          //var taxTypeReal = objRecord.getValue({fieldId:'custrecord_lmry_ar_ws_taxtype'});
          if(taxType=='' || taxType==null || taxType==0/* || taxTypeReal==taxType*/){
            return true;
          }
          var iibbField = objRecord.getField({fieldId:'custpage_iibbnorm'});
          iibbField.removeSelectOption({value: null});
          var iibbNorm = search.create({
            type: 'customrecord_lmry_ar_normas_iibb',
            filters: [['custrecord_lmry_ar_operation_typ','is',taxType],'AND',['isinactive','is','F']],
            columns: ['internalid','name']
          });
          iibbNorm = iibbNorm.run().getRange(0,1000);
          iibbField.insertSelectOption({value:0,text:' '});
          if(iibbNorm!=null && iibbNorm!=''){
            for(var i=0;i<iibbNorm.length;i++){
              iibbField.insertSelectOption({value: iibbNorm[i].getValue('internalid'),text: iibbNorm[i].getValue('name')});
            }
          }
        }
      }catch(err){
        alert('[validateField] '+err);
        return false;
      }
      return true;
    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2018.2
     */
    function saveRecord(scriptContext) {
      try {

        recordObj = scriptContext.currentRecord;

        var subs = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_subsidiary_cc'});
        var taxtype = recordObj.getValue({fieldId:'custpage_taxtype'});
        var ttype= recordObj.getValue({fieldId:'custpage_type'});
        var tsubtype= recordObj.getValue({fieldId: 'custpage_subtype'});
        if(subs!='' && subs!=null && taxtype!='' && taxtype!=null){
          var searchEqual = search.create({
            type: 'customrecord_lmry_ar_ws_setup',
            filters: [['custrecord_lmry_ar_ws_subsidiary_cc','is',subs],'AND',
                      ['custrecord_lmry_ar_ws_taxtype','equalto',taxtype],'AND',
                      ['isinactive','is','F']],
            columns: ['internalid']
          });
          if(mode=='edit'){
            searchEqual.filters.push(search.createFilter({name: 'internalid',operator: 'noneof',values: [recordObj.id]}));
          }
          if(Number(ttype) && Number(tsubtype)){
            searchEqual.filters.push(search.createFilter({name: 'custrecord_lmry_ar_ws_type',operator: 'equalto',values: [ttype]}));
            searchEqual.filters.push(search.createFilter({name: 'custrecord_lmry_ar_ws_subtype',operator: 'equalto',values: [tsubtype]}));
          }
          searchEqual = searchEqual.run().getRange(0,1);
          if (searchEqual != null && searchEqual != '') {
            if(searchEqual.length>0){
              var datosSub = search.lookupFields({type:'subsidiary', id:subs, columns:['name']});
              var taxtypeText = '';
              if(taxtype==1){
                if(Language=='es'){
                  taxtypeText = ' para Retenciones';
                }else{
                  taxtypeText = ' for Retentions';
                }
              }
              if(taxtype==2){
                if(Language=='es'){
                  taxtypeText = ' para Percepciones';
                }else{
                  taxtypeText = ' for Perceptions';
                }
              }
              if(Language=='es'){
                alert('La subsidiaria "'+datosSub.name+'" ya ha sido configurada'+taxtypeText+'.');
              }else{
                alert('Subsidiary "'+datosSub.name+'" has already been configured'+taxtypeText+'.');
              }
              return false;
            }
          }
        }


        var appliesTo = recordObj.getValue({
          fieldId: 'custpage_appliesto'
        });
        var appliesItem = recordObj.getValue({
          fieldId: 'custrecord_lmry_ar_ws_applies_item'
        });
        var appliesAccount = recordObj.getValue({
          fieldId: 'custrecord_lmry_ar_ws_applies_account'
        });
        if(appliesTo==2){
          if((appliesItem == '' || appliesItem == null) && (appliesAccount == '' || appliesAccount == null)){
            var mensaje = '';
            if (Language == 'es') {
              mensaje = 'Cuando la clase contributiva esta aplicada a lineas, al menos uno de estos campos:\n';
              mensaje += ' - "LATAM - AR WS APLICA A ARTÍCULO"\n';
              mensaje += ' - "LATAM - AR WS APLICA A CUENTA"';
            } else {

              mensaje = 'When the contributory class is applied to lines, at least one of these fields:\n';
              mensaje += ' - "LATAM - AR WS APPLIES TO ITEM"\n';
              mensaje += ' - "LATAM - AR WS APPLIES TO ACCOUNT"';
            }
            //alert(mensaje);
            //return false;
          }
        }

        var aplica = recordObj.getValue({
          fieldId: 'custrecord_lmry_ar_ws_default_cc'
        });
        if(aplica){
          var percent = recordObj.getValue({
            fieldId: 'custrecord_lmry_ar_ws_default_percent'
          });
          if(percent=='' || percent==null || percent==0){
            var message = '';
            if (Language == 'es') {
              message = 'Ingrese el porcentaje de la Clase Contributiva por defecto';
            } else {
              message = 'Enter the percentage of the Contributory Class by default';
            }
            alert(message);
            return false;
          }
        }
        var _depar = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_department'});
        var _locat = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_location'});
        var _class = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_class'});
        if (enab_dep == true) {
          if (pref_dep == true) {
            if (_depar=='' || _depar==null || _depar==0) {
              if(Language=='es'){
                alert('Ingresar Departamento');
              }else{
                alert('Enter Department');
              }
              return false;
            }
          }
          if (_depar!='' && _depar!=null && _depar!=0){
            log.error('_depar',_depar+','+subs);
            var search_dep = search.create({
              type: 'department',
              columns: ['internalid'],
              filters: [
                ['isinactive', 'is', 'F'], 'AND',
                ['internalid', 'is', _depar], 'AND',
                ['subsidiary', 'anyof', subs]
              ]
            });
            search_dep = search_dep.run().getRange(0,1);
            log.error('search_dep',search_dep);
            if(search_dep && !search_dep.length>0){
              if(Language=='es'){
                alert('El Departamento no pertenece a la Subsidiaria');
              }else{
                alert('The Department does not belong to the Subsidiary');
              }
              return false;
            }
          }

        }
        if (enab_clas == true) {
          if (pref_clas == true) {
            if (_class=='' || _class==null || _class==0) {
              if(Language=='es'){
                alert('Ingresar Clase');
              }else{
                alert('Enter Class');
              }
              return false;
            }
          }
          if (_class!='' && _class!=null && _class!=0){
            log.error('_class',_class+','+subs);
            var search_cla = search.create({
              type: 'classification',
              columns: ['internalid'],
              filters: [
                ['isinactive', 'is', 'F'], 'AND',
                ['internalid', 'is', _class], 'AND',
                ['subsidiary', 'anyof', subs]
              ]
            });
            search_cla = search_cla.run().getRange(0,1);
            log.error('search_cla',search_cla);
            if(search_cla && !search_cla.length>0){
              if(Language=='es'){
                alert('La Clase no pertenece a la Subsidiaria');
              }else{
                alert('The Class does not belong to the Subsidiary');
              }
              return false;
            }
          }
        }
        if (enab_loc == true) {
          if (pref_loc == true) {
            if (_locat=='' || _locat==null || _locat==0) {
              if(Language=='es'){
                alert('Ingresar Ubicacion');
              }else{
                alert('Enter Location');
              }
              return false;
            }
          }
        }

        /*var ratio = recordObj.getValue({fieldId:'custrecord_lmry_ar_ws_additional_ratio'});
        if(ratio<=0 || ratio>1){
          if(Language=='es'){
            alert('El campo "LATAM - AR WS ADDITIONAL RATIO" debe ser mayor a 0 y menor igual a 1');
          }else{
            alert('The "LATAM - AR WS ADDITIONAL RATIO" field must be greater than 0 and less than 1');
          }
          return false;
        }*/


      } catch (error) {
        log.error('ERROR - SaveRecord', error);
        //libraryMail.sendemail(' [ SaveRecord ] ' + error, LMRY_script);
      }
      return true;
    }

    return {
      pageInit: pageInit,
      validateField: validateField,
      saveRecord: saveRecord
    };

});
