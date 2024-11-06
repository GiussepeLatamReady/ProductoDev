/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Transaction Item Receipt               ||
||                                                              ||
||  File Name: LMRY_ItemReceiptCLNT_V2.0.js		                ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 25 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define([
  'N/log', 'N/search', 'N/runtime', 
  './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0',
  './Latam_Library/LMRY_Log_LBRY_V2.0',
  './Latam_Library/LMRY_MX_Pedimentos_LBRY_2.0'
],
    function (
      log, search, runtime, 
      library_mail, 
      lbryLog,
      MXPedimentos
    ) {
        var featureSubs = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
        var LMRY_script = 'LatamReady - Item Receipt CLNT V2.0';
        var LMRY_access = false;
        var LMRY_countr = [];
        var recordObj = null;
        var type = '';
        var LICENSES = [];
        var isSuiteTax = false;
        function pageInit(context) {
            recordObj = context.currentRecord;
            type = context.mode;
            try {
              isSuiteTax = runtime.isFeatureInEffect({
                feature: 'tax_overhauling'
            });
              LICENSES = library_mail.getLicenses(recordObj.getValue('subsidiary'));

              ValidateAccessIRC(recordObj.getValue('subsidiary'));

                if (type != 'print' && type != 'email') {
                  var idSubsidiary = recordObj.getValue({
                      fieldId: 'subsidiary'
                  });
                    if (isSuiteTax == true || isSuiteTax == 'T') {
                      // ***********************************************
                      // 08.09.2021 - La logica se paso al script Cliente
                      // para popular el campo Latam - Subsidiary Country
                      // ***********************************************
                      if (featureSubs == true || featureSubs == 'T') {
                        var filters = new Array();
                            filters[0] = search.createFilter({ name: 'custrecord_lmry_setuptax_subsidiary', operator: search.Operator.ANYOF, values: [idSubsidiary] });
                        var columns = new Array();
                        columns[0] = search.createColumn({ name: 'custrecord_lmry_setuptax_sub_country' });
                        var getfields = search.create({
                          type: 'customrecord_lmry_setup_tax_subsidiary',
                          columns: columns,
                          filters: filters
                        });
                        getfields = getfields.run().getRange(0, 1000);
  
                        if (getfields != '' && getfields != null) {
                          var ST_County = '';
                          ST_County = getfields[0].getText('custrecord_lmry_setuptax_sub_country');
                          // Latam - Subsidiary Country
                          recordObj.setText("custbody_lmry_subsidiary_country", ST_County);
                        }
                      } // 08.09.2021
                    }
                    // Latam - Subsidiary Country
                    var field_country = recordObj.getField({
                        fieldId: 'custbody_lmry_subsidiary_country'
                    });
                    if (field_country) {
                        field_country.isDisabled = true;
                    }
                }

                //BR CFOP
                if(LMRY_countr[0] == 'BR' && LMRY_access && (context.mode == 'create' || context.mode == 'copy' || context.mode == 'edit')){

                  var createdFrom = recordObj.getValue('createdfrom');
                  var transactionType = recordObj.getValue('custbody_lmry_br_transaction_type');

                  if (!transactionType || context.mode == 'copy') {
                    var typeStandard = recordObj.getValue('type');
                    if (typeStandard) {
                      var searchTransactionType = search.create({type: 'customrecord_lmry_trantype', filters: [{name: 'name', operator: 'is', values: typeStandard}]});
                      searchTransactionType = searchTransactionType.run().getRange({start: 0, end: 1});

                      if (searchTransactionType && searchTransactionType.length) {
                        recordObj.setValue('custbody_lmry_br_transaction_type', searchTransactionType[0].id);
                      }

                    }
                  }

                }//FIN BR CFOP
                //C0967:
                var transacOrderType = recordObj.getValue({ fieldId: 'ordertype' }) || '';
                var createdFrom = recordObj.getValue('createdfrom');
                if (['create', 'copy'].indexOf(context.mode) != -1 && LMRY_countr[0] == 'BR' && transacOrderType == 'TrnfrOrd' && createdFrom) {
                  setValueFromTransferOrder(recordObj, createdFrom);
                }

            } catch (err) {
                log.error('pageInit', err);
                library_mail.sendemail2(' [ pageInit ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
                lbryLog.doLog({ title : "[ pageInit ]", message : err });
            }
        }


        function ValidateAccessIRC(idSubsidiary) {

          if (idSubsidiary == '' || idSubsidiary == null) {
            return true;
          }

          LMRY_access = false;
          LMRY_countr = library_mail.Get_Country_STLT(idSubsidiary);
          if (!LMRY_countr.length) {
                return;
          }

            LMRY_access = library_mail.getCountryOfAccess(LMRY_countr, LICENSES);
        }

        function setValueFromTransferOrder(recordObj, createdFrom) {
          try {
            var fieldsTO = search.lookupFields({
              type: search.Type.TRANSFER_ORDER,
              id: createdFrom,
              columns: ['custbody_lmry_document_type', 'custbody_lmry_serie_doc_cxc', 'custbody_lmry_paymentmethod', 'custbody_lmry_via_transp_cl']
            });
            var legalDocumentTO = fieldsTO.custbody_lmry_document_type[0] ? fieldsTO.custbody_lmry_document_type[0].value : '';
            var serieCxcTO = fieldsTO.custbody_lmry_serie_doc_cxc[0] ? fieldsTO.custbody_lmry_serie_doc_cxc[0].value : '';
            var paymentMethodTO = fieldsTO.custbody_lmry_paymentmethod[0] ? fieldsTO.custbody_lmry_paymentmethod[0].value : '';
            var viaTransporteTO = fieldsTO.custbody_lmry_via_transp_cl[0] ? fieldsTO.custbody_lmry_via_transp_cl[0].value : '';
            //Llenado de campos
            recordObj.setValue({
              fieldId: 'custbody_lmry_document_type',
              value: legalDocumentTO,
              ignoreFieldChange: true
            });
            recordObj.setValue({
              fieldId: 'custbody_lmry_serie_doc_cxc',
              value: serieCxcTO,
              ignoreFieldChange: true
            });
            recordObj.setValue({
              fieldId: 'custbody_lmry_paymentmethod',
              value: paymentMethodTO,
              ignoreFieldChange: true
            });
            recordObj.setValue({
              fieldId: 'custbody_lmry_via_transp_cl',
              value: viaTransporteTO,
              ignoreFieldChange: true
            });
          } catch (error) {
            log.error('setValueFromTransferOrder', error);
            library_mail.sendemail2(' [ setValueFromTransferOrder ] ' + error, LMRY_script, recordObj, 'tranid', 'entity');
            lbryLog.doLog({ title: "[ setValueFromTransferOrder ]", message: error });
          }
        }

        function saveRecord(context){
          var newRecord = context.currentRecord;
          var subsidiary = newRecord.getValue("subsidiary");       
          var nroPedimento = newRecord.getValue("custpage_mx_nro_pedimento");

          if (
            LMRY_countr[0] == "MX" && 
            MXPedimentos.isAutomaticPedimentos(subsidiary) && 
            !MXPedimentos.pedimentoIsValid(nroPedimento)
          ) return false;
          return true;
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord
        }
    });
