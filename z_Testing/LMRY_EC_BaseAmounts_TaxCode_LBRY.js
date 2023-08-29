/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_EC_BaseAmounts_TaxCode_LBRY.js  				    ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 21 2020  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define(['N/search', 'N/runtime'],

function(search, runtime) {

    var subsiOW = runtime.isFeatureInEffect({feature: "SUBSIDIARIES"});

    function setBaseAmounts(objRecord, flowType){

      var jsonTaxCode = {};
      var jsonBaseAmounts = {1: {field: 'custbody_lmry_ec_base_rate0', amount: 0}, 2: {field: 'custbody_lmry_ec_base_rate12', amount: 0}, 3: {field: 'custbody_lmry_ec_base_rate14', amount: 0}, 4: {field: 'custbody_lmry_ec_base_rate12', amount: 0}};

      var baseFilters = [];
      baseFilters[0] = search.createFilter({name: 'isinactive', operator: 'is', values: 'F'});
      baseFilters[1] = search.createFilter({name: 'custrecord_lmry_ec_taxcode_apply_to', operator: 'anyof', values: flowType});
      if(subsiOW){
        baseFilters[2] = search.createFilter({name: 'custrecord_lmry_ec_taxcode_subsidiary', operator: 'is', values: objRecord.getValue('subsidiary')});
      }

      var searchECBases = search.create({type: 'customrecord_lmry_ec_base_amount_taxcode', columns: ['custrecord_lmry_ec_taxcode', 'custrecord_lmry_ec_base_amount'], filters: baseFilters});
      searchECBases = searchECBases.run().getRange(0, 1000);

      if(searchECBases && searchECBases.length){
        for(var i = 0; i < searchECBases.length; i++){
          var baseEC = searchECBases[i].getValue('custrecord_lmry_ec_base_amount');
          var taxcodeEC = searchECBases[i].getValue('custrecord_lmry_ec_taxcode');

          if(!jsonTaxCode[baseEC]){
            jsonTaxCode[baseEC] = {};
          }

          jsonTaxCode[baseEC][taxcodeEC] = taxcodeEC;

        }
      }


      //ITERACION ITEMS
      var cItems = objRecord.getLineCount({sublistId: 'item'});
      for(var i = 0; i < cItems; i++){
        var taxCode = objRecord.getSublistValue({sublistId: 'item', fieldId: 'taxcode', line: i});
        var amount = objRecord.getSublistValue({sublistId: 'item', fieldId: 'amount', line: i});

        if(Object.keys(jsonTaxCode).length){
          for(var j in jsonTaxCode){
            for(var k in jsonTaxCode[j]){
              if(jsonTaxCode[j][k] == taxCode){
                jsonBaseAmounts[j]['amount'] += parseFloat(amount);
              }
            }


          }
        }

      }

      //ITERACION EXPENSES
      var cExpenses = objRecord.getLineCount({sublistId: 'expense'});
      for(var i = 0; i < cExpenses; i++){
        var taxCode = objRecord.getSublistValue({sublistId: 'expense', fieldId: 'taxcode', line: i});
        var amount = objRecord.getSublistValue({sublistId: 'expense', fieldId: 'amount', line: i});

        if(Object.keys(jsonTaxCode).length){
          for(var j in jsonTaxCode){
            for(var k in jsonTaxCode[j]){
              if(jsonTaxCode[j][k] == taxCode){
                jsonBaseAmounts[j]['amount'] += parseFloat(amount);
              }
            }


          }
        }

      }

      var isBaseIGV = false;
      //SETEO DE CAMPOS DE CABECERA
      for(var i in jsonBaseAmounts){
        if (i == 2 && jsonBaseAmounts[i]['amount'] != 0) {
          isBaseIGV = true;
        }
        if (i == 4 && isBaseIGV) {
          break;
        }
        objRecord.setValue({fieldId: jsonBaseAmounts[i]['field'], value: jsonBaseAmounts[i]['amount']});
      }

    }

    return {
        setBaseAmounts: setBaseAmounts
    };

});
