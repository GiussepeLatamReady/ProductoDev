/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_PE_AnulacionInvoice_LBRY_V2.0.js  				  ||
||                                                              ||
||  Version   Date         Author        Remarks                ||
||  2.0     11 Jun 2020  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */
 define(['N/record', 'N/runtime', 'N/log', 'N/search', 'N/format', 'N/transaction', './LMRY_IP_libSendingEmailsLBRY_V2.0'],
 function(record, runtime, log, search, format, transaction, libraryEmail) {

     var LMRY_script = 'LMRY_PE_AnulacionInvoice_LBRY_V2.0.js';

     var fApprovalInvoice = runtime.getCurrentScript().getParameter({
         name: "CUSTOMAPPROVALCUSTINVC"
     });
     var fReversalVoiding = runtime.getCurrentScript().getParameter({
         name: 'REVERSALVOIDING'
     });
     var fMultprice = runtime.isFeatureInEffect({
         feature: 'MULTPRICE'
     });

     var fDeptMandatory = runtime.getCurrentScript().getParameter({
         name: 'DEPTMANDATORY'
     });
     var fClassMandatory = runtime.getCurrentScript().getParameter({
         name: 'CLASSMANDATORY'
     });
     var fLocMandatory = runtime.getCurrentScript().getParameter({
         name: 'LOCMANDATORY'
     });

     var fDepartment = runtime.isFeatureInEffect({
         feature: "DEPARTMENTS"
     });
     var fClass = runtime.isFeatureInEffect({
         feature: "LOCATIONS"
     });
     var fLocation = runtime.isFeatureInEffect({
         feature: "CLASSES"
     });

     function anularTransaction(idTransaction, typeTransaction) {

         try {

             var response = {
                 idInvoice: idTransaction,
                 wht: false,
                 standardvoid: false,
                 idcreditmemo: null,
                 error: null
             };

             var currentTransaction = search.lookupFields({
                 type: typeTransaction,
                 columns: ['subsidiary', 'department', 'class', 'location', 'accountingperiod.closed', 'fxamount', 'tranid', 'fxamountremaining'],
                 id: idTransaction
             });

             var isClosedPeriod = currentTransaction["accountingperiod.closed"];
             response['closedperiod'] = isClosedPeriod;

             if ((fReversalVoiding == 'F' || fReversalVoiding == false) && !isClosedPeriod) {
                 transaction.void({
                     type: typeTransaction,
                     id: idTransaction
                 });
                 response['standardvoid'] = true;
             } else {
                 var filtrosConfigVoid = [];
                 filtrosConfigVoid[0] = search.createFilter({
                     name: 'custrecord_lmry_configvoid_subsidiary',
                     operator: 'anyof',
                     values: currentTransaction.subsidiary[0].value
                 });
                 filtrosConfigVoid[1] = search.createFilter({
                     name: 'isinactive',
                     operator: 'is',
                     values: 'F'
                 });

                 var searchConfigVoid = search.create({
                     type: 'customrecord_lmry_config_voidtransaction',
                     filters: filtrosConfigVoid,
                     columns: ['custrecord_lmry_configvoid_item', 'custrecord_lmry_configvoid_taxcode', 'custrecord_lmry_configvoid_department', 'custrecord_lmry_configvoid_class', 'custrecord_lmry_configvoid_location', 'custrecord_lmry_configvoid_removelines']
                 });

                 var resultConfigVoid = searchConfigVoid.run().getRange({
                     start: 0,
                     end: 1
                 });

                 if (resultConfigVoid != null && resultConfigVoid.length == 1) {

                     var cMemo = record.transform({
                         fromType: typeTransaction,
                         fromId: idTransaction,
                         toType: record.Type.CREDIT_MEMO,
                         isDynamic: false
                     });

                     cMemo.setValue('custbody_lmry_reference_transaction', idTransaction);
                     cMemo.setValue('custbody_lmry_reference_transaction_id', idTransaction);
                     cMemo.setValue('memo', 'Reference VOID ' + currentTransaction['tranid'] + " (" + idTransaction + ")");

                     //TRANDATE Y ACCOUNTING PERIOD

                     cleanCreditMemoFields(cMemo);

                     if (fDeptMandatory == true || fDeptMandatory == 'T') {
                         if (!(currentTransaction['department'].length > 0)) {
                             cMemo.setValue('department', resultConfigVoid[0].getValue('custrecord_lmry_configvoid_department'));
                         }
                     }

                     if (fClassMandatory == true || fClassMandatory == 'T') {
                         if (!(currentTransaction['class'].length > 0)) {
                             cMemo.setValue('class', resultConfigVoid[0].getValue('custrecord_lmry_configvoid_class'));
                         }
                     }

                     if (fLocMandatory == true || fLocMandatory == 'T') {
                         if (!(currentTransaction['location'].length > 0)) {
                             cMemo.setValue('location', resultConfigVoid[0].getValue('custrecord_lmry_configvoid_location'));
                         }
                     }

                     var removerLineas = resultConfigVoid[0].getValue('custrecord_lmry_configvoid_removelines');

                     if (currentTransaction['fxamount'] != currentTransaction['fxamountremaining']) {
                         removerLineas = true;
                     }

                     //DESCUENTO Y RETENCIONES WHT ESTANDAR
                     if (removerLineas) {
                         for (var i = 0; i < cMemo.getLineCount({
                                 sublistId: 'item'
                             }); i++) {
                             var amountItem = cMemo.getSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'amount',
                                 line: i
                             });
                             var itemType = cMemo.getSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'itemtype',
                                 line: i
                             });
                             if (parseFloat(amountItem) < 0 || itemType == 'Discount' || itemType == 'Descuento') {
                                 removerLineas = false;
                             }
                         }

                         if (removerLineas) {
                             var loadInvoice = record.load({
                                 type: typeTransaction,
                                 id: idTransaction
                             });
                             if (loadInvoice.getValue('discounttotal')) {
                                 removerLineas = false;
                             }
                         }

                     }

                     //REMOVER LINEAS
                     if (removerLineas) {
                         var totalItems = cMemo.getLineCount({
                             sublistId: 'item'
                         });
                         for (var i = 0; i < totalItems; i++) {
                             cMemo.removeLine({
                                 sublistId: 'item',
                                 line: totalItems - i - 1
                             });
                         }

                         cMemo.insertLine({
                             sublistId: 'item',
                             line: 0
                         });

                         if (resultConfigVoid[0].getValue('custrecord_lmry_configvoid_item')) {
                             cMemo.setSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'item',
                                 line: 0,
                                 value: resultConfigVoid[0].getValue('custrecord_lmry_configvoid_item')
                             });
                         }

                         if (fMultprice == true || fMultprice == 'T') {
                             cMemo.setSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'price',
                                 line: 0,
                                 value: -1
                             });
                         }

                         cMemo.setSublistValue({
                             sublistId: 'item',
                             fieldId: 'rate',
                             line: 0,
                             value: currentTransaction['fxamountremaining']
                         });
                         cMemo.setSublistValue({
                             sublistId: 'item',
                             fieldId: 'amount',
                             line: 0,
                             value: currentTransaction['fxamountremaining']
                         });

                         if (resultConfigVoid[0].getValue('custrecord_lmry_configvoid_taxcode')) {
                             cMemo.setSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'taxcode',
                                 line: 0,
                                 value: resultConfigVoid[0].getValue('custrecord_lmry_configvoid_taxcode')
                             });
                         }

                         //SEGMENTACION LINEA
                         if (fDepartment == true || fDepartment == 'T') {
                             var departmentLine = '';
                             if (currentTransaction['department'].length > 0) {
                                 departmentLine = currentTransaction.department[0].value;
                             } else {
                                 if (resultConfigVoid[0].getValue('custrecord_lmry_configvoid_department') != null && resultConfigVoid[0].getValue('custrecord_lmry_configvoid_department') != '') {
                                     departmentLine = resultConfigVoid[0].getValue('custrecord_lmry_configvoid_department');
                                 }
                             }

                             if (departmentLine) {
                                 cMemo.setSublistValue({
                                     sublistId: 'item',
                                     fieldId: 'department',
                                     line: 0,
                                     value: departmentLine
                                 });
                             }

                         }

                         if (fClass == true || fClass == 'T') {
                             var classLine = '';
                             if (currentTransaction['class'].length > 0) {
                                 classLine = currentTransaction.class[0].value;
                             } else {
                                 if (resultConfigVoid[0].getValue('custrecord_lmry_configvoid_class') != null && resultConfigVoid[0].getValue('custrecord_lmry_configvoid_class') != '') {
                                     classLine = resultConfigVoid[0].getValue('custrecord_lmry_configvoid_class');
                                 }
                             }

                             if (classLine) {
                                 cMemo.setSublistValue({
                                     sublistId: 'item',
                                     fieldId: 'class',
                                     line: 0,
                                     value: classLine
                                 });
                             }

                         }

                         var fieldLocation = cMemo.getSublistField({
                             sublistId: 'item',
                             fieldId: 'location',
                             line: 0
                         });

                         if ((fLocation == true || fLocation == 'T') && fieldLocation != null && fieldLocation != '') {
                             var locationLine = '';
                             if (currentTransaction['location'].length > 0) {
                                 locationLine = currentTransaction.location[0].value;
                             } else {
                                 if (resultConfigVoid[0].getValue('custrecord_lmry_configvoid_location') != null && resultConfigVoid[0].getValue('custrecord_lmry_configvoid_location') != '') {
                                     locationLine = resultConfigVoid[0].getValue('custrecord_lmry_configvoid_location');
                                 }
                             }

                             if (locationLine) {
                                 cMemo.setSublistValue({
                                     sublistId: 'item',
                                     fieldId: 'location',
                                     line: 0,
                                     value: locationLine
                                 });
                             }

                         }

                     }

                     //APLICACION AL INVOICE
                     var numApply = cMemo.getLineCount({
                         sublistId: 'apply'
                     });
                     for (var i = 0; i < numApply; i++) {
                         var invoiceApply = cMemo.getSublistValue({
                             sublistId: 'apply',
                             fieldId: 'internalid',
                             line: i
                         });

                         if (invoiceApply == idTransaction) {
                             cMemo.setSublistValue({
                                 sublistId: 'apply',
                                 fieldId: 'apply',
                                 line: i,
                                 value: true
                             });
                             break;
                         }
                     }

                     idCreditMemo = cMemo.save({
                         disableTriggers: true,
                         ignoreMandatoryFields: true
                     });
                     response['idcreditmemo'] = idCreditMemo;
                     //log.error('id credit memo',idCreditMemo);

                     // CREDIT MEMO ANULACION
                 } else {
                     response['error'] = 'No tiene configurado el record LatamReady - Config Void Transaction';
                 }


             }

             if (response['standardvoid'] == false && response['idcreditmemo'] == null && response['error'] == null) {
                 response['error'] = 'No se anulo la transaccion, revise su configuracion';
             }

         } catch (err) {
             libraryEmail.sendemail(' [ anularTransaction ] ' + err, LMRY_script);
             log.error('PE_AnulacionInvoice', err);

             response['error'] = {
                 name: err.name,
                 message: err.message || err
             };

         }

         return response;

     }

     function cleanCreditMemoFields(recordObj) {
         recordObj.setValue('custbody_lmry_doc_ref_type', ''); //LATAM - DOCUMENT TYPE REF
         recordObj.setValue('custbody_lmry_exchange_rate_doc_ref', ''); //LATAM - TYPE CHANGE DOC REF
         recordObj.setValue('custbody_lmry_apply_wht_code', false); // LATAM - APPLIED WHT CODE
         recordObj.setValue('custbody_lmry_carga_inicial', false); //LATAM - INITIAL LOAD?
         recordObj.setValue('custbody_lmry_cl_ei_exchangerate', ''); //Latam - EI Exchange Rate
         recordObj.setValue('custbody_lmry_dato_estructurado', ''); //Latam - Dato Estructurado
         recordObj.setValue('custbody_lmry_document_type', ''); //LATAM - LEGAL DOCUMENT TYPE
         recordObj.setValue('custbody_lmry_doc_ref_date', ''); //LATAM - DOCUMENT DATE REF
         recordObj.setValue('custbody_lmry_doc_serie_ref', ''); //LATAM - DOCUMENT SERIES REF
         recordObj.setValue('custbody_lmry_es_refacturacion', false); //Latam - Es refacturación?
         recordObj.setValue('custbody_lmry_identif_contrato', ''); //Latam - Identificación del Contrato
         recordObj.setValue('custbody_lmry_incon_tipo_cambio', ''); //Latam - Inconsistencies of Exchange rate
         recordObj.setValue('custbody_lmry_informacion_adicional', ''); //LATAM - ADDITIONAL INFORMATION
         recordObj.setValue('custbody_lmry_modification_reason', ''); //Latam - Modification Reason
         recordObj.setValue('custbody_lmry_num_aut_comfiar_pe', '');
         recordObj.setValue('custbody_lmry_pe_estado_comfiar', ''); //Latam - PE Estado ComfiAr
         recordObj.setValue('custbody_lmry_pe_identificador_comfiar', ''); //Latam - PE Identificador Comfiar
         recordObj.setValue('custbody_lmry_num_doc_ref', ''); //LATAM - DOCUMENT NUMBER REF
         recordObj.setValue('custbody_lmry_num_preimpreso', '') //LATAM - PREPRINTED NUMBER
         recordObj.setValue('custbody_lmry_pe_metodo_pago_sunat', ''); //Latam - PE Metodo de Pago SUNAT
         recordObj.setValue('custbody_lmry_pe_num_aut_comfiar', ''); //Latam - PE Num Autorización Comfiar
         recordObj.setValue('custbody_lmry_serie_doc_cxc', ''); //LATAM - SERIE CXC
         recordObj.setValue('custbody_lmry_tipo_cambio_mon_extranje', '');
         recordObj.setValue('custbody_lmry_tranf_gratuita', false); //Latam - Es TTG?
         recordObj.setValue('custbody_lmry_pa_monto_letras', ''); //Latam - Monto en Letras

         //E-DOCUMENT STANDARD
         recordObj.setValue('custbody_psg_ei_template', ''); // E-DOCUMENT TEMPLATE
         recordObj.setValue('custbody_psg_ei_status', ''); // E-DOCUMENT STATUS
         recordObj.setValue('custbody_psg_ei_sending_method', ''); //E-DOCUMENT SENDING METHODS
         recordObj.setValue('custbody_edoc_gen_trans_pdf', false); //GENERATE PDF
         recordObj.setValue('custbody_edoc_generated_pdf', ''); //GENERATED PDF
         recordObj.setValue('custbody_psg_ei_generated_edoc', ''); //GENERATED E-DOCUMENT

     }

     return {
         anularTransaction: anularTransaction
     };

 });