/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
  ||  This script for customer center                             ||
  ||                                                              ||
  ||  File Name:  LMRY_MX_Transaction_Fields_URET_V2.0.js         ||
  ||                                                              ||
  ||  Version Date         Author        Remarks                  ||
  ||  2.0     Feb 20 2018  LatamReady    Bundle 37714             ||
   \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/log', 'N/ui/serverWidget', 'N/search', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],

    function (log, serverWidget, search, libraryMail) {

        // Nombre del Script
        var LMRY_script = "LatamReady - MX Transaction Fields URET V2.0";

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

                log.error('tipo', scriptContext.type);

                //recupera el formulario
                var formulario = scriptContext.form;
                var actionType = scriptContext.type;
                var objRecord = scriptContext.newRecord;
                if (actionType == 'view' || actionType == 'edit' || actionType == 'create' || actionType == 'copy') {
                    var periodValue = objRecord.getValue('custrecord_lmry_mx_periodicidad');
                    var mesesValue = objRecord.getValue('custrecord_lmry_mx_meses');
                    var selectPeriodicidad = formulario.addField({
                        id: 'custpage_periodicidad',
                        type: serverWidget.FieldType.SELECT,
                        label: 'LATAM - MX PERIODICIDAD'
                    }); 
                    //oculto campo custrecord de Periodicida
                    formulario.getField('custrecord_lmry_mx_periodicidad').updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                    //Llenar Periodicidad
                    fillPeriodicidad(selectPeriodicidad);
                    
                    //Creo campo Meses tipo custpage
                    var selectMeses = formulario.addField({
                        id: 'custpage_meses',
                        type: serverWidget.FieldType.SELECT,
                        label: 'LATAM - MX MESES'
                    }); 
                    //oculto campo custrecord de Periodicida
                    formulario.getField('custrecord_lmry_mx_meses').updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                    //Llenar Mes
                    fillMeses(selectMeses, periodValue);

                    if(periodValue != null && periodValue != ''){
                        objRecord.setValue('custpage_periodicidad', periodValue);
                    }

                    if(mesesValue != null && mesesValue != ''){
                        objRecord.setValue('custpage_meses', mesesValue);
                    }

                }

                //Ocultar campos
                formulario.getField({ id: 'isinactive' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_transaction_related' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_entity_related' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_paid_transaction' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_transaction' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_currency' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_exchange_rate' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_operation_type' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_vatregnumber' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_legalname' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_iva_smx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_iva_dsmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_iva_snocmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_iva_ismx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_iva_iemx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_iva_inocmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_iva_zmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_iva_emx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_iva_s8mx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_iva_s8nocmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_iva_s4mx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_iva_rmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_total_smx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_total_dsmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_total_snocmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_total_ismx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_total_iemx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_total_inocmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_total_zmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_total_emx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_total_s8mx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_total_s8nocmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_total_s4mx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_total_rmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_ret_smx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_ret_dsmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_ret_snocmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_ret_ismx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_ret_iemx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_ret_inocmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_ret_zmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_ret_emx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_ret_s8mx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_ret_s8nocmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_ret_s4mx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_ret_rmx' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                formulario.getField({ id: 'custrecord_lmry_mx_diot_iva_devoluciones' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_amount_save' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_amount_net' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_amount_tax' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_amount_total' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_diot_ret_iva_total' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_schedule_transfer_of_iva' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_vat_transfer_by_code' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_vat_transfer_by_stype' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_mx_ieps_total' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                formulario.getField({ id: 'custrecord_lmry_config_vendor_line' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                if (scriptContext.type == scriptContext.UserEventType.COPY) {
                    var related_transaction = formulario.getField({ id: 'custrecord_lmry_mx_transaction_related' });
                    related_transaction.defaultValue = '';
                }

            } catch (err) {
                log.error('ERROR - BeforeLoad', err);
                libraryMail.sendemail(' [ BeforeLoad ] ' + err, LMRY_script);
            }
        }

        function beforeSubmit(scriptContext) {
            try {
                var ObjRecord = scriptContext.newRecord;
                var type = scriptContext.type;
        
                if (type != 'view') {
                    var periodValue = ObjRecord.getValue('custpage_periodicidad');
                    if (periodValue && periodValue.trim() !== '') {
                        ObjRecord.setValue('custrecord_lmry_mx_periodicidad', periodValue.trim());
                    } else {
                        ObjRecord.setValue('custrecord_lmry_mx_periodicidad', '');
                    }
                    var mesesValue = ObjRecord.getValue('custpage_meses');
                    if (mesesValue && mesesValue.trim() !== '') {
                        ObjRecord.setValue('custrecord_lmry_mx_meses', mesesValue.trim());
                    } else {
                        ObjRecord.setValue('custrecord_lmry_mx_meses', '');
                    }
                }
            } catch (err) {
                log.error('ERROR - beforeSubmit', err);
                libraryMail.sendemail(' [ beforeSubmit ] ' + err, LMRY_script);
            }
        }
        

        function fillPeriodicidad(selectPeriodicidad) {
            selectPeriodicidad.addSelectOption({
                value: "",
                text: "&nbsp"
            });
            var id = "";
            var name = "&nbsp";
            try {

                var PeriodicidadSearch = search.create({
                type: "customrecord_lmry_mx_periodicidad",
                filters: [["isinactive", "is", "F"]],
                columns: ["internalid", "name", "custrecord_lmry_mx_periodicidad_id"]
                });

                var results = PeriodicidadSearch.run().getRange(0,1000);
                for (var i = 0; i < results.length; i++) {
                    id = results[i].getValue("internalid");
                    name = results[i].getValue("custrecord_lmry_mx_periodicidad_id") + ". " + results[i].getValue("name");
                    
                    selectPeriodicidad.addSelectOption({value: id, text: name});
                }  
            } catch (e) {
                selectPeriodicidad.addSelectOption({value: id, text: name});
            }
            
            
        }

        function fillMeses(selectPeriodicidad, periodValue) {
            if (periodValue) {
                if (periodValue == '5' || periodValue == '05') {
                    var mesesSearch = search.create({
                        type: 'customrecord_lmry_mx_meses',
                        filters: [
                            ["isinactive", "is", "F"],
                            'AND',
                            ['custrecord_lmry_mx_ref_periodicidad', 'anyof', '5']
                        ],
                        columns: ['internalid', 'name', 'custrecord_lmry_mx_mes_id']
                    });

                    var results = mesesSearch.run().getRange(0, 1000);
                    if (results) {
                        selectPeriodicidad.addSelectOption({ value: '', text: "&nbsp" });
                        for (var i = 0; i < results.length; i++) {
                            var id = results[i].getValue("internalid");
                            var name = results[i].getValue("custrecord_lmry_mx_mes_id") + ". " + results[i].getValue("name");

                            selectPeriodicidad.addSelectOption({ value: id, text: name });
                        }

                    }

                } else {
                    var mesesSearch = search.create({
                        type: 'customrecord_lmry_mx_meses',
                        filters: [
                            ["isinactive", "is", "F"],
                            'AND',
                            ['custrecord_lmry_mx_ref_periodicidad', 'noneof', '5']
                        ],
                        columns: ['internalid', 'name', 'custrecord_lmry_mx_mes_id']
                    });

                    var results = mesesSearch.run().getRange(0, 1000);
                    if (results) {
                        selectPeriodicidad.addSelectOption({ value: '', text: "&nbsp" });
                        for (var i = 0; i < results.length; i++) {
                            var id = results[i].getValue("internalid");
                            var name = results[i].getValue("custrecord_lmry_mx_mes_id") + ". " + results[i].getValue("name");

                            selectPeriodicidad.addSelectOption({ value: id, text: name });
                        }

                    }
                }

            } else {
                selectPeriodicidad.addSelectOption({ value: '', text: "&nbsp" });
            }

        }
        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
        };

    });