/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name LMRY_AR_Massive_Gene_Agip_MPRD_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 02/04/2024
 */
define([
    "N/record",
    "N/runtime",
    "N/search",
    "N/log",
    'N/query',
    "N/file",
    "./AR_LIBRARY_MENSUAL/LMRY_AR_padronAGIP_LBRY",
],

    (record, runtime, search, log, query,file, lbryAGIP) => {


        const getInputData = (inputContext) => {
            try {
                const parameters = getParameters();
                
                const entities = getEntities(parameters).list;
                loadEntities(parameters, entities);
                updateState(parameters, 'Processing', 'It has begun to process the entities...');
                //log.error("entities",entities)
                //return [];
                return entities;
            } catch (error) {
                log.error("Error [getInputData]", error);
                return [["isError", error.message]];
            }
        }

        const map = (mapContext) => {
            try {
                log.error("value", JSON.parse(mapContext.value))
                if (mapContext.value.indexOf("isError") != -1) {
                    mapContext.write({
                        key: mapContext.key,
                        value: mapContext.value
                    });
                } else {

                    const contextValue = JSON.parse(mapContext.value);
                    const { entity } = contextValue;
                    const response = createContributoryclass(contextValue);
                    log.error("response",response);
                    if (response.createSetup===0 || response.createSetup===1) {
                        mapContext.write({
                            key: mapContext.key,
                            value: [entity.internalid, "T", response]
                        });
                    } else {
                        mapContext.write({
                            key: mapContext.key,
                            value: [entity.internalid, "N", response]
                        });
                    }


                }
            } catch (error) {
                log.error("Error [map]", error);
                mapContext.write({
                    key: mapContext.key,
                    value: ["isError", error.message]
                });
            }
        }

        const summarize = summaryContext => {
            const parameters = getParameters();
            try {

                const results = [];
                const jsonResult = {};
                summaryContext.output.iterator().each(function (key, value) {
                    const data = JSON.parse(value)
                    results.push(data);
                    jsonResult[data[0]] = data;
                    return true;
                });
                
                const errors = results.filter(([key]) => key === 'isError');
                
                if (errors.length) {
                    log.error("error Summarize [interno]", errors[0][1]);
                    updateState(parameters, 'An error occurred', errors[0][1]);
                    return true;
                }
                
                const {entityType,list: entitiesData} = getEntities(parameters);
                const entityIds = entitiesData.map(({ entity }) => entity.internalid);
                const idsSuccess = results.filter(([key, value]) => value === 'T').map(([id]) => id);
                const idsNoProcess = results.filter(([key, value]) => value === 'N').map(([id]) => id);
                let idsError = entityIds.filter(id => !idsSuccess.includes(id));
                idsError = idsError.filter(id => !idsNoProcess.includes(id));

                /* 
                    ["id de la entidad",                                    0
                    "estado del proceso para la entidad",                   1 {'s':proceseda,'e': error, 'n': no procesada}
                    "Si es creado por setup o por padron",                  2
                    "id de CC creado",                                      3
                    "(opcional) EL emnsaje por que no ha sido procesada"]   4
                */
                const entities = [
                    ...idsSuccess.map(id => ([id, 's', jsonResult[id][2].createSetup, jsonResult[id][2].CCId, 0])),
                    ...idsError.map(id => ([id, 'e', -1, 0, 0])),
                    ...idsNoProcess.map(id => ([id, 'n', -1, 0, jsonResult[id][2].message]))
                ];

                const statusEntities = {
                    "s": idsSuccess.length,
                    "e": idsError.length,
                    "p": 0,
                    "n": idsNoProcess.length,
                }


                updateEntitiesState(parameters, entities, statusEntities);
                updateState(parameters, 'Finish', 'The process is finished');

                buildReport(parameters,entities, entityType);

            } catch (error) {
                log.error("error Summarize ", error);
                log.error("error Summarize ", error.message);
                updateState(parameters, 'An error occurred', error.message);
            }
        };


        let loadEntities = (parameters, entities) => {

            const entityIds = entities.map(({ entity }) => entity.internalid);
            const statusEntities = {
                "s": 0,
                "e": 0,
                "p": entityIds.length,
                "n": 0,
            }
            updateEntitiesState(parameters, entityIds, statusEntities);

        }

        let getParameters = () => {
            return {
                idUser: runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_ar_mass_gen_agip_user' }),
                idLog: runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_ar_mass_gen_agip_state' }),
            }
        }

        let getEntities = (parameters) => {
            let period;
            let subsidiary;
            let entityType;
            let searchRecordLog = search.create({
                type: 'customrecord_lmry_ar_massive_gener_agip',
                filters: [
                    ['internalid', 'is', parameters.idLog]
                ],
                columns: [
                    'custrecord_lmry_ar_gen_agip_period',
                    'custrecord_lmry_ar_gen_agip_subsidiary',
                    'custrecord_lmry_ar_gen_agip_entity_type'
                ]
            })
            searchRecordLog.run().each(function (result) {
                period = result.getValue('custrecord_lmry_ar_gen_agip_period');
                subsidiary = result.getValue('custrecord_lmry_ar_gen_agip_subsidiary');
                entityType = result.getValue('custrecord_lmry_ar_gen_agip_entity_type');
            });
            //return [{"id":"3947913","whtType":"header"}]
            //log.error("recordLog.idTransaction",recordLog.idTransaction);
            const entities = lbryAGIP.cargarEntity(entityType, subsidiary);
            
            //return entities.map(entity => ({ entity, period, subsidiary }));
            return {entityType,list:entities.map(entity => ({ entity, period, subsidiary }))};
        }

        let createContributoryclass = ({ entity, period, subsidiary }) => {

            let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
            language = language === "es" ? language : "en";
            const translations = getTranslations(language);

            const fileResults = query
                .runSuiteQL({
                    query: `
                    SELECT TOP 1
                        file.id, file.name,
                        REGEXP_SUBSTR(file.name, '([0-9]{11,})',8),  REGEXP_SUBSTR(file.name, '([0-9]{11,})',17) 
                    FROM 
                        file 
                    WHERE
                        file.name LIKE '${subsidiary};${period};%'
                    AND 
                        REGEXP_SUBSTR(file.name, '([0-9]{11,})',LENGTH('${subsidiary};${period};%'))<= ${entity.vatregnumber + entity.custentity_lmry_digito_verificator}
                    AND
                        ${entity.vatregnumber + entity.custentity_lmry_digito_verificator}  <=  REGEXP_SUBSTR(file.name, '([0-9]{11,})',LENGTH('${subsidiary};${period};${entity.vatregnumber + entity.custentity_lmry_digito_verificator}')) 
                    ORDER BY file.id DESC
                        `
                })
                .asMappedResults();
            if (fileResults.length <= 0) {
                return { message: "LMRY_NOT_LIST" };
            }

            //log.debug('entity', lisEntitys);
            const AGIPObject = new lbryAGIP.AGIPTXT(fileResults[0].id, [entity], period, subsidiary);
            const infoCC = AGIPObject.getListContributoryClass();
            if (infoCC.length > 0) {

                const objResult = { 
                    message: 'Successful creation', 
                    createSetup: infoCC[0][0].createSetup, 
                    CCId: infoCC[0][0].idRetention
                }
                return objResult;
            } else {
                return { message: "LMRY_NOT_TAX_APPLY" };
            }
        }

        /* ------------------------------------------------------------------------------------------------------
        * Esta funcion permite actualiazr el estado del proceso segun la etapa del flujo del modulo.
        * --------------------------------------------------------------------------------------------------- */
        let updateState = (parameters, msgState, msgDetails) => {
            record.submitFields({
                type: 'customrecord_lmry_ar_massive_gener_agip',
                id: parameters.idLog,
                values: {
                    custrecord_lmry_ar_gen_agip_status: msgState,
                    custrecord_lmry_ar_gen_agip_details: msgDetails
                },
                options: { ignoreMandatoryFields: true, disableTriggers: true }
            });
        }

        let updateEntitiesState = (parameters, entities, statusEntities) => {
            record.submitFields({
                type: 'customrecord_lmry_ar_massive_gener_agip',
                id: parameters.idLog,
                values: {
                    custrecord_lmry_ar_gen_agip_entities: JSON.stringify(entities),
                    custrecord_lmry_ar_gen_agip_summary: JSON.stringify(statusEntities)
                },
                options: { ignoreMandatoryFields: true, disableTriggers: true }
            });
        }

        let buildReport = (parameters,entities, typeEntity) => {
            const dataEntities = getListEntities(entities, typeEntity);
            const ids = Object.keys(dataEntities);

            let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
            language = language === "es" ? language : "en";
            const translations = getTranslations(language);
            
            const jsonStatus = {
                "s": translations.LMRY_PROCESING_CHECK,
                "e": translations.LMRY_ERROR,
                "p": translations.LMRY_PROCESING,
                "n": translations.LMRY_NOT_PROCESING
            }
            let listEntities = []
            ids.forEach((id) => {
                const { internalid, type, names, cuit, status, createdSetup, CCId, message } = dataEntities[id];



                const title = jsonStatus[status];
                let resultStatus;
                if (status == "n") {
                    resultStatus = title + " : " + (translations[message] || " ");
                } else {
                    resultStatus = title;
                }

                listEntities.push(
                    [
                        internalid,
                        names,
                        cuit,
                        createdSetup,
                        CCId,
                        resultStatus
                    ].join(',') + '\n'
                );
            });


            const strTitle = getTitle(translations);
            const fileContent = listEntities.join('');
            const strReport = `${strTitle}${fileContent}\r\n`

            const file = saveFile(parameters,strReport);
            const url = generateUrlFile(file);
            logGenerator(parameters,url);


        }

        const generateUrlFile = (idfile) => {
            const fileLoad = file.load({ id: idfile });
            const netSuiteLocation = runtime.getCurrentScript().getParameter({
                name: 'custscript_lmry_netsuite_location'
            });
            const urlfile = `https://${netSuiteLocation || ''}${fileLoad.url}`;

            return urlfile;
        };

        const logGenerator = (parameters, urlfile) => {
            const logRecord = record.load({
                type: 'customrecord_lmry_ar_massive_gener_agip',
                id: parameters.idLog
            });

            if (urlfile) {
                logRecord.setValue({ fieldId: 'custrecord_lmry_ar_gen_agip_url', value: urlfile });
            }

            logRecord.save();
        };

        const saveFile = (parameters,fileContent) => {

            const folderId = getFolder();
            if (!folderId) return;
            const {subsidiary,period,entityType} = getDataPrimary(parameters);
            
            const fileGenerate = file.create({
                name:`${subsidiary}_${period}_${entityType}_response`,
                fileType: file.Type.CSV,
                contents: fileContent,
                encoding: file.Encoding.UTF8,
                folder: folderId
            });

            return fileGenerate.save();
        };

        
        const getDataPrimary = (parameters) => {

            let jsonData = {};
            let searchRecordLog = search.create({
                type: 'customrecord_lmry_ar_massive_gener_agip',
                filters: [
                    ['internalid', 'is', parameters.idLog]
                ],
                columns: [
                    'custrecord_lmry_ar_gen_agip_period',
                    'custrecord_lmry_ar_gen_agip_subsidiary',
                    'custrecord_lmry_ar_gen_agip_entity_type'
                ]
            })
            searchRecordLog.run().each(function (result) {
                jsonData.period = result.getValue('custrecord_lmry_ar_gen_agip_period');
                jsonData.subsidiary = result.getValue('custrecord_lmry_ar_gen_agip_subsidiary');
                jsonData.entityType = result.getValue('custrecord_lmry_ar_gen_agip_entity_type');
            });

            return jsonData;
        }
        const getFolder = () => {
            
            let folderPrimaryId;
            let searchFolderSL = search.create({
                type: 'folder',
                columns: ['internalid'],
                filters: ['name', 'is', 'SuiteLatamReady']
            });

            let resultSL = searchFolderSL.run().getRange(0, 50);
            if (!resultSL || !resultSL.length) {
                
                let folderRecordPrimary = record.create({ type: 'folder' });
                folderRecordPrimary.setValue('name', 'SuiteLatamReady');
                folderPrimaryId = folderRecordPrimary.save();
            } else {
                
                folderPrimaryId = resultSL[0].getValue('internalid');
            }

            let folderId = '';
            let searchFolder = search.create({
                type: 'folder',
                columns: ['internalid'],
                filters: [
                    ['name', 'is', 'ReportAGIP']
                ]

            });
            let resultFolder = searchFolder.run().getRange(0, 50);
            
            if (!resultFolder || !resultFolder.length) {
                
                let folderRecord = record.create({ type: 'folder' });
                folderRecord.setValue('name', 'ReportAGIP');
                folderRecord.setValue('parent', folderPrimaryId);
                folderId = folderRecord.save();
            } else {
                
                folderId = resultFolder[0].getValue('internalid');
            }

            return folderId;
        };

        const getTitle = (translations) => {
            

            let strTitle = '';
            strTitle += translations.LMRY_ID + ',';     //1.
            strTitle += translations.LMRY_NAME + ',';   //2
            strTitle += 'CUIT,';                        //3.
            strTitle += translations.LMRY_CREATED + ',';//4.
            strTitle += translations.LMRY_CCID + ',';   //5.
            strTitle += translations.LMRY_STATUS + ','; //6.

            strTitle += '\n';
            return strTitle;
        }


        const getTranslations = (language) => {
            const translatedFields = {
                "es": {
                    "LMRY_ID": "ID Entidad",
                    "LMRY_NAME": "Entidad",
                    "LMRY_CREATED": "Creada desde",
                    "LMRY_CCID": "Id Clase contributiva",
                    "LMRY_STATUS": "Estado",
                    "LMRY_PROCESING": "Procesando",
                    "LMRY_ERROR": "Error",
                    "LMRY_NOT_PROCESING": "No procesada",
                    "LMRY_PROCESING_CHECK": "Procesada con éxito",
                    "LMRY_NOT_TAX_APPLY": "Entidad no registrada o con configuración incorrecta",
                    "LMRY_NOT_LIST": "No se ha encontrado ninguna lista para este periodo",
                },
                "en": {
                    "LMRY_ID": "ID Entity",
                    "LMRY_NAME": "Entity",
                    "LMRY_CREATED": "Created from",
                    "LMRY_CCID": "Id Contributory Class",
                    "LMRY_STATUS": "Status",
                    "LMRY_PROCESING": "Processing",
                    "LMRY_ERROR": "Error",
                    "LMRY_NOT_PROCESING": "Not Processed",
                    "LMRY_PROCESING_CHECK": "Successfully Processed",
                    "LMRY_NOT_TAX_APPLY": "Entity not registered or incorrectly configured",
                    "LMRY_NOT_LIST": "No list was found for this period",

                }
            }
            return translatedFields[language];
        }

        let getListEntities = (entities, typeEntity) => {


            let processCompleted = false;
            let entitiesIds = entities;
            let listEntities = {};

            if (entities.length) {
                processCompleted = typeof entities[0] === 'object';
                if (processCompleted) {
                    entitiesIds = entities.map(entity => entity[0]);
                    //entities = entities.map(entity => entity[0])

                    for (let i = 0; i < entitiesIds.length; i++) {
                        const [id, status, createdSetup, CCId, message] = entities[i];
                        listEntities[id] = {
                            internalid: id,
                            status,
                            createdSetup: createdSetup == 0 ? "Padron" : createdSetup == 1 ? "Setup" : " ",
                            CCId: CCId ?? " ",
                            message: message ?? " ",
                            type: typeEntity
                        };
                    }
                };
            } else {
                return {};
            }



            let filters = [
                ["internalid", "anyof", entitiesIds]
            ];
            let columns = [];
            columns.push(search.createColumn({ name: 'formulatext', formula: '{internalid}', sort: search.Sort.DESC }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{vatregnumber}' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{isperson}' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{firstname}' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{middlename}' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{lastname}' }));
            columns.push(search.createColumn({ name: 'formulatext', formula: '{companyname}' }));

            search.create({
                type: typeEntity,
                filters: filters,
                columns: columns
            }).run().each(result => {
                let columns = result.columns;
                const internalid = result.getValue(columns[0]);
                listEntities[internalid].cuit = result.getValue(columns[1]) || " ";
                const isperson = result.getValue(columns[2]) || " ";
                if (isperson == "T" || isperson == true) {
                    const firstname = result.getValue(columns[3]) || "";
                    const middlename = result.getValue(columns[4]) || "";
                    const lastname = result.getValue(columns[5]) || "";
                    listEntities[internalid].names = `${firstname} ${middlename} ${lastname}`;
                } else {
                    listEntities[internalid].names = result.getValue(columns[6]) || " ";
                }
                listEntities[internalid].status = processCompleted ? listEntities[internalid].status : "p";
                
                return true;
            });

            return listEntities;
        }

        return { getInputData, map, summarize }

    });