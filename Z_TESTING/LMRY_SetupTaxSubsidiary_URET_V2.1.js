/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center                            ||
||                                                              ||
||  File Name: LMRY_SetupTaxSubsidiary_URET_V2.1.js			    ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     8 Aug 2022  LatamReady    Use Script 2.1            ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(["N/search", "N/ui/serverWidget", './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],
    /* ******************************************************************** * 
    * Automatización entidad de cliente (Mejoras Imprimible Factura Exterior)
    * Requerimiento C0586
    * ******************************************************************** */
    function (search, serverWidget, Library_Mail) {

        function beforeLoad(scriptContext) {
            try {
                let ObjRecord = scriptContext.newRecord;
                let type = scriptContext.type;
                let formulario = scriptContext.form;

                //Ocultar Campos
                let tcForeign = formulario.getField({ id: 'custrecord_lmry_setuptax_taxcode_foreign' });
                tcForeign.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                let tcForeignTaxpayer = formulario.getField({ id: 'custrecord_lmry_setuptax_mx_fr_tp_type' });
                tcForeignTaxpayer.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                //para los taxcode
                let taxcode = ObjRecord.getValue('custrecord_lmry_setuptax_taxcode_foreign');
                let taxpayerType = ObjRecord.getValue('custrecord_lmry_setuptax_mx_fr_tp_type');

                let p_taxcode = formulario.addField({
                    id: 'custpage_taxcode_foreign',
                    label: tcForeign.label,
                    //label: 'LATAM - TAX CODE FOREIGN',
                    type: serverWidget.FieldType.SELECT
                });
                formulario.insertField({
                    field: p_taxcode,
                    nextfield: 'custrecord_lmry_setuptax_taxcode_foreign'
                });
                let p_taxpayerType = formulario.addField({
                    id: 'custpage_foreign_taxpayer',
                    label: tcForeignTaxpayer.label,
                    //label: 'LATAM - FOREIGN TAXPAYER TYPE',
                    type: serverWidget.FieldType.SELECT
                });
                formulario.insertField({
                    field: p_taxpayerType,
                    nextfield: 'custrecord_lmry_setuptax_taxcode_foreign'
                });
                if (type != 'view') {
                    //cargar los valores a mi select
                    if (taxcode != null && taxcode != '') p_taxcode.defaultValue = taxcode;
                    if (taxpayerType != null && taxpayerType != '') p_taxpayerType.defaultValue = taxpayerType;

                    let salestaxitemSearchObj = search.create({
                        type: "salestaxitem",
                        filters: [
                            ["country", "anyof", "MX"], "AND",
                            ["isinactive", "is", "F"]
                        ],
                        columns: [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "itemid", label: "Item ID" }),
                            search.createColumn({ name: "rate", label: "Rate" }),
                            search.createColumn({ name: "country", label: "Country" })
                        ]
                    });
                    salestaxitemSearchObj = salestaxitemSearchObj.run().getRange(0, 1000);

                    p_taxcode.addSelectOption({ value: '', text: '' });
                    if (salestaxitemSearchObj != null && salestaxitemSearchObj != '') {
                        for (let index = 0; index < salestaxitemSearchObj.length; index++) {
                            let id = salestaxitemSearchObj[index].getValue('internalid');
                            let name = salestaxitemSearchObj[index].getValue('itemid');
                            p_taxcode.addSelectOption({ value: id, text: name });
                        }
                    }

                    let taxpayerTypeSearchObj = search.create({
                        type: "customrecord_lmry_taxpayer_type_sv",
                        filters: [
                            ["custrecord_country", "anyof", "157"], "AND",
                            ["isinactive", "is", "F"]
                        ],
                        columns: [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "name", label: "Name" })
                        ]
                    });
                    taxpayerTypeSearchObj = taxpayerTypeSearchObj.run().getRange(0, 1000);

                    p_taxpayerType.addSelectOption({ value: '', text: '' });
                    if (taxpayerTypeSearchObj != null && taxpayerTypeSearchObj != '') {
                        for (let index = 0; index < taxpayerTypeSearchObj.length; index++) {
                            let id = taxpayerTypeSearchObj[index].getValue('internalid');
                            let name = taxpayerTypeSearchObj[index].getValue('name');
                            p_taxpayerType.addSelectOption({ value: id, text: name });
                        }
                    }


                } else {
                    // 14/10/2022 : LatamReady - Automatic Set MX C0665
                    if (type == 'view' || type == 'edit') {
                        let subsidiary = ObjRecord.getValue('custrecord_lmry_setuptax_subsidiary');
                        let licenses = Library_Mail.getLicenses(subsidiary);
                        let setupTaxSubCountry = ObjRecord.getValue('custrecord_lmry_setuptax_sub_country');
                        log.error("setupTaxSubCountry",setupTaxSubCountry)
                        log.error("setupTaxSubCountry",setupTaxSubCountry)
                        if (
                                (setupTaxSubCountry != 157 || !Library_Mail.getAuthorization(975, licenses)) && 
                                (setupTaxSubCountry != 11 || !Library_Mail.getAuthorization(323, licenses)) &&
                                (setupTaxSubCountry != 48 || !Library_Mail.getAuthorization(1110, licenses))
                            ) {
                            log.error("formulario","entramossss")
                            let sublist = formulario.getSublist({
                                id: 'recmachcustrecord_lmry_us_setuptax'
                            });
                            try {
                                sublist.displayType = serverWidget.SublistDisplayType.HIDDEN;
                            } catch (err) {
                                log.debug('[Debug: Only Information]', 'LatamReady - Automatic Set : HIDDEN');
                            }
                        }
                    }
                    if (taxcode != null && taxcode != '') {
                        let fieldLookUp = search.lookupFields({
                            type: "salestaxitem",
                            id: taxcode,
                            columns: ['itemid']
                        });
                        let name = fieldLookUp.itemid;
                        p_taxcode.addSelectOption({ value: taxcode, text: name });
                        p_taxcode.defaultValue = taxcode;
                    }
                    if (taxpayerType != null && taxpayerType != '') {
                        let fieldLookUp = search.lookupFields({
                            type: "customrecord_lmry_taxpayer_type_sv",
                            id: taxpayerType,
                            columns: ['name']
                        });
                        let name = fieldLookUp.name;
                        p_taxpayerType.addSelectOption({ value: taxpayerType, text: name });
                        p_taxpayerType.defaultValue = taxpayerType;
                    }
                }

            } catch (error) {
                log.error('[beforeLoad] error', error);
            }
            return true;
        }

        function beforeSubmit(scriptContext) {
            try {
                let ObjRecord = scriptContext.newRecord;
                let type = scriptContext.type;
                if (type != 'view') {
                    let taxCode = ObjRecord.getValue({ fieldId: 'custpage_taxcode_foreign' });
                    ObjRecord.setValue({ fieldId: 'custrecord_lmry_setuptax_taxcode_foreign', value: taxCode });
                    let taxpayerType = ObjRecord.getValue({ fieldId: 'custpage_foreign_taxpayer' });
                    ObjRecord.setValue({ fieldId: 'custrecord_lmry_setuptax_mx_fr_tp_type', value: taxpayerType });
                }
            }
            catch (error) {
                log.error('[beforeSubmit] error', error);
            }
            return true;
        }

        function afterSubmit(scriptContext) {

        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            //afterSubmit: afterSubmit
        };

    });