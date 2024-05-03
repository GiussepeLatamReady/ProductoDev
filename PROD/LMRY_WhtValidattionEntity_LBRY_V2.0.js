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
define(['N/record', 'N/url','N/log', 'N/search', 'N/runtime'],
    function (record, url,log, search, runtime) {

        /**
        * Funcion que permite crear el campo ficticio "Latam - BO IVA" y setearlo
        * segun el valor del BO entity field field de la propia transaccion.
        *
        * @param {recordEntity} scriptContext.newRecord
        * @param {form} scriptContext.form - New record
        * @param {isURE} scriptContext.type - Trigger type
        */

        function setFieldWhtIVA(recordEntity, form, isURET) {
            try {
                var language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
                var entityLabel = language == "es" ? "ENTIDAD": "ENTITY"
                var whtCodeIvaField = form.addField({
                    id: 'custpage_lmry_ety_bo_reteiva',
                    type: 'select',
                    label: 'Latam '+ entityLabel +' -  BO IVA'
                });


                whtCodeIvaField.addSelectOption({
                    value: '',
                    text: '&nbsp;'
                });


                var whtCodeIvaList = getWhtCodeList("custpage_lmry_ety_bo_reteiva");

                var idsWhtCodeList = Object.keys(whtCodeIvaList);

                idsWhtCodeList.forEach(function (id) {
                    var urlWhtCode = url.resolveRecord({ recordType: "customrecord_lmry_wht_code", recordId:  id, isEditMode: false });
                    whtCodeIvaField.addSelectOption({
                        value: id,
                        text: '<a class="dottedlink" href="'+urlWhtCode+'" target="_blank">'+whtCodeIvaList[id].name+'</a>'
                    });
                })

                if (['edit', 'view'].indexOf(isURET) > -1) {
                    var entityField = getEntityField(recordEntity.id);
                    if (entityField.exist && entityField.whtCodeIva != "") {
                        recordEntity.setValue('custpage_lmry_ety_bo_reteiva', entityField.whtCodeIva);
                    }
                }
            } catch (error) {
                log.error(" error [setFieldWhtIVA]", error)
            }



        }

        function getWhtCodeList(custpage) {

            var whtCodeList = {};
            var codeSearchObj = search.create({
                type: "customrecord_lmry_wht_code",
                filters:
                    [
                        ["custrecord_lmry_wht_countries", "anyof", "29"],
                        "AND",
                        [
                            ["custrecord_lmry_wht_types.custrecord_lmry_wht_tranfield", "is", custpage],
                            "OR",
                            ["custrecord_lmry_wht_types.custrecord_lmry_wht_entityfield", "is", custpage],
                        ]
                        
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
                whtCodeList[id] = {
                    id: id,
                    name: result.getValue("name")
                }
                return true;
            });
            return whtCodeList;

        }

        function getEntityField(entityId) {
            var entityField = {
                exist: false
            };
            var entityFieldObj = search.create({
                type: "customrecord_lmry_entity_fields",
                filters:
                    [
                        ["custrecord_lmry_co_entity", "anyof", entityId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "custrecord_lmry_bo_ety_reteiva" }),

                    ]
            });
            entityFieldObj.run().each(function (result) {
                entityField.id = result.getValue("internalid") || "";
                entityField.whtCodeIva = result.getValue("custrecord_lmry_bo_ety_reteiva") || "";
                entityField.exist = true;
            });
            return entityField;
        }


        function saveFieldWhtIva(recordEntity) {
            
            var entity = {
                id: recordEntity.id,
                whtCodeIva: recordEntity.getValue({ fieldId: 'custpage_lmry_ety_bo_reteiva' }) || "",
                subsidiary: recordEntity.getValue({ fieldId: 'subsidiary' }) || ""
            }

            if (entity.whtIva == "") {
                
                return false;
            }
            saveRecordEntityField(entity);

        }


        function saveRecordEntityField(entity) {
            
            var entityField = getEntityField(entity.id);
            
            if (entityField.exist) {
                var updateEntityField = record.load({
                    type: "customrecord_lmry_entity_fields",
                    id: entityField.id
                });

                updateEntityField.setValue({
                    fieldId: 'custrecord_lmry_bo_ety_reteiva',
                    value: entity.whtCodeIva
                });

                updateEntityField.save({
                    disableTriggers: true,
                    ignoreMandatoryFields: true
                });
            } else {
                
                var newEntityField = record.create({
                    type: "customrecord_lmry_entity_fields",
                    isDynamic: true
                });

                newEntityField.setValue({
                    fieldId: 'custrecord_lmry_co_entity',
                    value: entity.id
                });

                newEntityField.setValue({
                    fieldId: 'custrecord_lmry_co_subsi_reten',
                    value: entity.subsidiary
                });

                newEntityField.setValue({
                    fieldId: 'custrecord_lmry_bo_ety_reteiva',
                    value: entity.whtCodeIva
                });
                
                newEntityField.save({
                    disableTriggers: true,
                    ignoreMandatoryFields: true
                });

                
            }
        }
        return {
            setFieldWhtIVA: setFieldWhtIVA,
            saveFieldWhtIva: saveFieldWhtIva,
            getWhtCodeList: getWhtCodeList,
            getEntityField: getEntityField
        };
    });
