/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_WhtValidattionEntity_LBRY_V2.0.js           ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Oct 02 2023  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define(['N/record', 'N/log', 'N/search', 'N/runtime'],
    function (record, log, search, runtime) {

        /**
        * Funcion que permite crear el campo ficticio "LATAM - BR CLIENTE REMESSA" y setearlo
        * segun el valor del BR trasactions field de la propia transaccion.
        *
        * @param {recordTransaction} scriptContext.newRecord
        * @param {form} scriptContext.form - New record
        * @param {typeContext} scriptContext.type - Trigger type
        */

        function setFieldWhtIVA(recordEntity, form) {
            try {
                log.debug("Debug", "Entro a setFieldWhtIVA");
        

                log.debug("Debug", "Creando campo");
                var whtCodeIvaField = form.addField({
                    id: 'custpage_lmry_ety_bo_reteiva',
                    type: 'select',
                    label: 'Latam Entity -  BO IVA'
                });


                whtCodeIvaField.addSelectOption({
                    value: '',
                    text: '&nbsp;'
                });
                var whtCodeIvaList = getWhtCodeList();

                var idsCustomer = Object.keys(whtCodeIvaList);

                idsCustomer.forEach(function (id) {
                    whtCodeIvaField.addSelectOption({
                        value: whtCodeIvaList[id].id,
                        text: whtCodeIvaList[id].name
                    });
                })



                var whtCodeIva = getIvaToEntityField(recordEntity.id);
                log.debug("transactionfield before ", whtCodeIva)
                if (whtCodeIva) {
                    recordEntity.setValue('custpage_lmry_bo_reteiva', whtCodeIva);
                }

                log.debug("Debug", "Salio a setFieldWhtIVA");
            } catch (error) {
                log.error(" error [setFieldWhtIVA]", error)
            }



        }

        function getWhtCodeList() {

            var whtCodeList = {};
            var codeSearchObj = search.create({
                type: "customrecord_lmry_wht_code",
                filters:
                    [
                        ["custrecord_lmry_wht_countries", "anyof", "29"],
                        "AND",
                        ["custrecord_lmry_wht_types", "anyof", "113"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({
                            name: "internalid",
                            sort: search.Sort.ASC,
                            label: "Internal ID"
                        })
                    ]
            });
            codeSearchObj.run().each(function (result) {
                var id = result.getValue("internalid");
                whtCodeList [id] = {
                    id: id,
                    name: result.getValue("name")
                }
            }); 
            return whtCodeList;
            
        }

        function getIvaToEntityField(entityId){
            var whtCodeIva = null;
            var entityFieldObj = search.create({
                type: "customrecord_lmry_entity_fields",
                filters:
                    [
                        ["custrecord_lmry_co_entity", "anyof", entityId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_lmry_bo_reteiva" })
                    ]
            });
            entityFieldObj.run().each(function (result) {
                whtCodeIva = result.getValue("custrecord_lmry_bo_reteiva");
            }); 
            return whtCodeIva;
        }


        function saveFieldWhtIva(recordEntity){
            var vendor = {
                id: recordEntity.id,
                whtIva: recordEntity.getValue({ fieldId: 'custpage_lmry_ety_bo_reteiva' }) || ""
            }

            if (vendor.whtIva == "") {
                return false;
            }
            

        }
        return {
            setFieldWhtIVA: setFieldWhtIVA
        };
    });
