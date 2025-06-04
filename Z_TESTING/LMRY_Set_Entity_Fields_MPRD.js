/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name LMRY_Set_Entity_Fields_MPRD.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 03/06/2025
 */
define([
    "N/record",
    "N/runtime",
    "N/search",
    "N/log",
    "./Latam_Library/LMRY_HideViewLBRY_V2.0",
],

    (record, runtime, search, log, Library_HideView) => {


        const getInputData = (inputContext) => {
            try {
                const featureInterCompany = runtime.getCurrentScript().getParameter({ name: "custscript_lmry_all_entity_fields" });
                let entities = [];
                if (featureInterCompany) entities = getEntities();
                log.error("entities",entities.length)
                return entities;
            } catch (error) {
                log.error("Error [getInputData]", error);
                return [{
                    code: "ERROR",
                    message: error.message
                }];
            }
        }

        const map = (mapContext) => {
            //Library_HideView.saveEntityFields(currentRecord)
            const value = JSON.parse(mapContext.value);
            if (value.code === "ERROR") {
                mapContext.write({
                    key: value.code,
                    value: value
                });
            } else {

                const entity = value;
                try {
                    if (entity.internalid) {
                        if (!existEntityFields(entity.internalid)) {
                            const currentRecord = record.load({
                                type: entity.type,
                                id: entity.internalid
                            });
                            const recordsEntityFields = saveEntityFields(currentRecord)
                            mapContext.write({
                                key: entity.internalid,
                                value: {
                                    code: "OK",
                                    entity,
                                    recordsEntityFields
                                }
                            });
                        } else {
                            mapContext.write({
                                key: entity.internalid,
                                value: {
                                    code: "EXIST",
                                    entity
                                }
                            });
                        }
                    }

                } catch (error) {
                    entity.state = "Error";
                    mapContext.write({
                        key: entity.internalid,
                        value: {
                            code: "ERROR",
                            message: error.message,
                            entity
                        }
                    });
                }
            }

        }


        const summarize = summaryContext => {
            try {
                const entitiesresult = []
                summaryContext.output.iterator().each(function (key, value) {
                    value = JSON.parse(value);
                    entitiesresult.push(value)
                    return true;
                });

                const errorResults = entitiesresult.filter(item => item.code === "ERROR");
                log.error("errorResults", errorResults)
                log.error("countEntityResults", countEntityResults(entitiesresult))
            } catch (error) {

                log.error("error Summarize [interno]", error.message);
            }
        };

        const countEntityResults = (entitiesResult) => {
            let errorCount = 0;
            let existCount = 0;
            let okCount = 0;

            for (const item of entitiesResult) {
                if (item.code === "ERROR") {
                    errorCount++;
                } else if (item.code === "EXIST") {
                    existCount++;
                } else if (item.code === "OK") {
                    okCount++;
                }
            }

            return {
                ERROR: errorCount,
                EXIST: existCount,
                OK: okCount
            };
        };

        const getEntities = () => {
            const entityFields = Library_HideView.getEntityFields();
            const countriesCode = getAllCountryIDs(entityFields);
            log.error("countriesCode", countriesCode);

            const entityTypes = ["customer", "vendor"];
            const entities = [];

            entityTypes.forEach(type => {
                const searchObj = search.create({
                    type,
                    filters: [
                        ["msesubsidiary.country", "anyof", countriesCode],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                    columns: ["internalid"].map(name => search.createColumn({ name }))
                });

                searchObj.runPaged({ pageSize: 1000 }).pageRanges.forEach(({ index }) => {
                    searchObj.runPaged().fetch({ index }).data.forEach(result => {
                        entities.push({
                            internalid: result.getValue({ name: "internalid" }),
                            type
                        });
                    });
                });
            });

            return entities;
        };

        const getEntities_t = () => {
            const entityFields = Library_HideView.getEntityFields();
            const countriesCode = getAllCountryIDs(entityFields);
            log.error("countriesCode", countriesCode);

            const entityTypes = ["customer", "vendor"];
            const maxPerType = 50;
            const entities = [];

            entityTypes.forEach(type => {
                const searchObj = search.create({
                    type,
                    filters: [
                        ["msesubsidiary.country", "anyof", countriesCode],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                    columns: [search.createColumn({ name: "internalid" })]
                });

                const pageData = searchObj.runPaged({ pageSize: 1000 });

                let count = 0;
                for (const { index } of pageData.pageRanges) {
                    const page = pageData.fetch({ index });

                    for (const result of page.data) {
                        if (count >= maxPerType) break;

                        entities.push({
                            internalid: result.getValue({ name: "internalid" }),
                            type
                        });

                        count++;
                    }

                    if (count >= maxPerType) break;
                }
            });

            return entities;
        };

        const getAllCountryIDs = (data) => [
            ...new Set(
                Object.values(data)
                    .flatMap(({ countries }) => countries ? Object.keys(countries) : [])
            )
        ];

        const existEntityFields = (entityId) => {
            const entity_fieldsSearch = search.create({
                type: "customrecord_lmry_entity_fields",
                filters:
                    [
                        ["custrecord_lmry_co_entity", "anyof", entityId],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            return entity_fieldsSearch.runPaged().count > 0;
        }


        const saveEntityFields = (currentRecord) => {
            var subsidiaries = Library_HideView.getSubsidiaries(currentRecord, true, "create")
            var entityFields = Library_HideView.getEntityFields();
            var fieldData = Library_HideView.assignFieldsToSubsidiaries(subsidiaries, entityFields, currentRecord.type);
            setCustpage(fieldData);
            return createRecord(fieldData, currentRecord)
        }


        function setCustpage(fieldData, isClient, currentRecord, isVisible, mode) {
            function updateFieldConfig(fields, countryCode) {
                fields.forEach(function (fieldConfig) {
                    fieldConfig["custpage"] = fieldConfig.fieldKey;
                    if (isClient && countryCode) {
                        var field = currentRecord.getField(fieldConfig.custpage);
                        if (field) {
                            field.isDisplay = isVisible;
                            if (isVisible && mode != "view" && fieldConfig.viewOnly) {
                                field.isDisabled = true;
                            }
                        }
                    }
                });
            }

            /**
             * Oculta el grupo de manera nativa con js vanilla
             * @param {*} label Nombre del grupo
             * @param {*} hide 
             */
            function toggleBlockByName(label, hide) {
                var tdElement = document.querySelector('td[data-nsps-label="Latam - ' + label + '"]');
                if (tdElement) {
                    var mainTr = tdElement.closest('tr.uir-field-group-row');
                    if (mainTr) {
                        mainTr.style.display = hide ? 'none' : '';
                        var contentTr = document.getElementById('tr_' + mainTr.id);
                        if (contentTr) {
                            contentTr.style.display = hide ? 'none' : '';
                        }
                        var relatedSiblings = mainTr.parentElement.querySelectorAll('tr');
                        Array.prototype.forEach.call(relatedSiblings, function (sibling) {
                            if (
                                sibling.classList.contains('uir-field-group-row-separator') ||
                                sibling.classList.contains('uir-fieldgroup-content') ||
                                sibling.id === 'tr_' + mainTr.id
                            ) {
                                sibling.style.display = hide ? 'none' : '';
                            }
                        });
                    }
                }
            }

            var countriesData = {};
            if (fieldData.subsidiaries) {
                for (var subsidiaryId in fieldData.subsidiaries) {
                    if (fieldData.subsidiaries.hasOwnProperty(subsidiaryId)) {
                        var subsidiaryConfig = fieldData.subsidiaries[subsidiaryId];
                        var countryCode = subsidiaryConfig.countryCode;


                        if (!countriesData[countryCode]) {
                            countriesData[countryCode] = {
                                countryCode: countryCode,
                                countryName: subsidiaryConfig.countryName,
                                fieldsEntity: [],
                                fieldSet: {}
                            };
                        }

                        // Agregar solo los campos únicos por país
                        var fieldsEntity = subsidiaryConfig.fieldsEntity || [];
                        for (var i = 0; i < fieldsEntity.length; i++) {
                            var fieldRecord = fieldsEntity[i].fieldRecord;
                            if (!countriesData[countryCode].fieldSet[fieldRecord]) {
                                countriesData[countryCode].fieldsEntity.push(fieldsEntity[i]);
                                countriesData[countryCode].fieldSet[fieldRecord] = true;
                            }
                        }
                    }
                }
            }

            // Asignar los campos al grupo de cada país
            Object.keys(countriesData).forEach(function (countryCode) {
                var countryData = countriesData[countryCode];
                updateFieldConfig(countryData.fieldsEntity, countryCode);
                if (isClient) {
                    toggleBlockByName(countryData.countryName, !isVisible);
                }
            });

            if (fieldData.general) {
                var generalFieldSet = {};
                fieldData.general.forEach(function (fieldConfig) {
                    if (!generalFieldSet[fieldConfig.fieldRecord]) {
                        updateFieldConfig([fieldConfig]);
                        generalFieldSet[fieldConfig.fieldRecord] = true;
                    }
                });
            }
        }


        function createRecord(fieldData, currentRecord) {
            function getValuesRecord(config, record, prefix) {
                return config.reduce(function (values, fieldConfig) {
                    var fieldValue = record.getValue(fieldConfig.custpage);

                    if (fieldConfig.type === "checkbox") {
                        values[fieldConfig.fieldRecord] = (fieldValue === "T");
                    } else {
                        values[fieldConfig.fieldRecord] = fieldValue;
                    }

                    return values;
                }, prefix || {});
            }

            function findRecordId(subsidiaryId, entityId) {
                var recordID;
                search.create({
                    type: "customrecord_lmry_entity_fields",
                    filters: [
                        ["custrecord_lmry_co_subsi_reten", "anyof", subsidiaryId],
                        "AND",
                        ["custrecord_lmry_co_entity", "anyof", entityId]
                    ],
                    columns: ["internalid"]
                }).run().each(function (result) {
                    recordID = result.getValue("internalid");
                });
                return recordID;
            }

            function submitOrSaveRecord(recordID, values, subsidiaryId, entityId) {
                if (recordID) {
                    var newRecord = record.load({
                        type: "customrecord_lmry_entity_fields",
                        id: recordID,
                        isDynamic: true
                    });
                    updateFieldsChild(values);

                } else {
                    var newRecord = record.create({
                        type: "customrecord_lmry_entity_fields",
                        isDynamic: true
                    });
                    newRecord.setValue("custrecord_lmry_co_entity", entityId);
                    newRecord.setValue("custrecord_lmry_co_subsi_reten", subsidiaryId);
                }
                Object.keys(values).forEach(function (key) {
                    newRecord.setValue(key, values[key]);
                });

                return newRecord.save({ ignoreMandatoryFields: true });
            }

            var countriesData = {};
            var entityfields = []
            if (fieldData.subsidiaries) {
                Object.keys(fieldData.subsidiaries).forEach(function (subsidiaryId) {
                    var subsidiaryConfig = fieldData.subsidiaries[subsidiaryId];
                    var countryCode = subsidiaryConfig.countryCode;

                    if (!countriesData[countryCode]) {
                        countriesData[countryCode] = {
                            countryCode: countryCode,
                            countryName: subsidiaryConfig.countryName,
                            subsidiaries: [],
                            fieldsEntity: subsidiaryConfig.fieldsEntity
                        };
                    }
                    countriesData[countryCode].subsidiaries.push(subsidiaryId);
                });

                // Procesar cada país
                Object.keys(countriesData).forEach(function (countryCode) {
                    var countryConfig = countriesData[countryCode];
                    var values = getValuesRecord(countryConfig.fieldsEntity, currentRecord);
                    if (fieldData.general) {
                        values = getValuesRecord(fieldData.general, currentRecord, values);
                    }
                    countryConfig.subsidiaries.forEach(function (subsidiaryId) {
                        var recordID = findRecordId(subsidiaryId, currentRecord.id);
                        entityfields.push(submitOrSaveRecord(recordID, values, subsidiaryId, currentRecord.id));
                    });
                });
            }
            return entityfields;
        }
        return { getInputData, map, summarize }

    });