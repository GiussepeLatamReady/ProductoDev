/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_WhtValidattionEntity_LBRY_V2.0.js           ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Oct 02 2023  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
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

        function setFieldWhtIVA(recordEntity, form, typeContext) {
            try {
                log.debug("Debug", "Entro a setSecondClient");
                log.debug("typeContext", typeContext);



                log.debug("Debug", "Creando campo");
                var whtCodeIva = form.addField({
                    id: 'custpage_lmry_ety_bo_reteiva',
                    type: 'select',
                    label: 'Latam Entity -  BO IVA'
                });


                whtCodeIva.addSelectOption({
                    value: '',
                    text: '&nbsp;'
                });
                var whtCodeIvaList = getWhtCodeList();

                var idsCustomer = Object.keys(whtCodeIvaList);

                idsCustomer.forEach(function (id) {
                    whtCodeIva.addSelectOption({
                        value: whtCodeIvaList[id].id,
                        text: whtCodeIvaList[id].name
                    });
                })



                var entityField = getEntityField(recordEntity.id);
                log.debug("transactionfield before ", entityField)
                if (entityField && (entityField.whtCodeIva != "")) {
                    recordEntity.setValue('custpage_lmry_ety_bo_reteiva', entityField.whtCodeIva);
                }

                log.debug("Debug", "Salio a setSecondClient");
            } catch (error) {
                log.error(" error [setSecondClient]", error)
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

        function getEntityField(){

        }
        return {
            setSecondClient: setFieldWhtIVA
        };
    });
