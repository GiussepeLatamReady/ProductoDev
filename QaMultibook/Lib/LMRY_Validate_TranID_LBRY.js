/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_Validate_TranID_LBRY.js                     ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 19 2020  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

 define(['N/search', 'N/log', './LMRY_libSendingEmailsLBRY_V2.0'],

 function (search, log, libraryMail) {

     var features = {
         'AR': 505,
         'BO': 506,
         'BR': 507,
         'CL': 508,
         'CO': 509,
         'CR': 510,
         'DO': 519,
         'EC': 511,
         'SV': 512,
         'GT': 513,
         'MX': 514,
         'NI': 515,
         'PA': 516,
         'PY': 517,
         'PE': 518,
         'UY': 520
     };

     /* ------------------------------------------------------------------------------------------------------
      * Funcion que valida que el Transaction ID no se repita
      * --------------------------------------------------------------------------------------------------- */
     function validateTranID(recordObj, country, licenses) {
         try {
             var idTran = recordObj.id;
             var typeTran = recordObj.type;
             var vendor = recordObj.getValue('entity'); //mine Caso Kavak AR
             log.debug("feature Validate Tranid",libraryMail.getAuthorization(features[country], licenses))
             if (!libraryMail.getAuthorization(features[country], licenses)) {
                log.debug("flag","feature desactivado...")
                 return true;
             }

             var tranID = recordObj.getValue('tranid');
             if(tranID == null || tranID == ''){
                log.debug("flag","No tiene tranid :",tranID)
                 return true;
             }

             tranID = tranID.replace(/( )+/g, ' ');

             var searchTranID = search.create({
                 type: typeTran,
                 columns: ['internalid'],
                 filters: [
                     ['mainline', 'is', 'T'], 'AND',
                     ['tranid', 'is', tranID.trim()], 'AND', //mine (only and) Caso Kavak AR
                     ['entity', 'is', vendor] //mine Caso Kavak AR
                 ]
             });
             if (idTran != null && idTran != '' && idTran != undefined) {
                 searchTranID.filters.push(search.createFilter({
                     name: 'internalid',
                     operator: search.Operator.NONEOF,
                     values: [idTran]
                 }));
             }

             searchTranID = searchTranID.run().getRange(0, 1000);
             log.debug("searchTranID",searchTranID)
             if (searchTranID != null && searchTranID != '') {
                log.debug("flag","Se encontró resultados")
                 return false;
             }
             
             recordObj.setValue('tranid', tranID.trim());

         } catch (error) {
             log.error('error', error);
             return false;
         }
         return true;
     }


     return {
         validateTranID: validateTranID
     };

 });