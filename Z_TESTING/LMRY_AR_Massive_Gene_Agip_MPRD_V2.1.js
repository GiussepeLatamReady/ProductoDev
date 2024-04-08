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
    "./AR_LIBRARY_MENSUAL/LMRY_AR_padronAGIP_LBRY",
],

    (record, runtime, search, log, query, lbryAGIP) => {


        const getInputData = (inputContext) => {
            try {
                const parameters = getParameters();
                log.error("getInputData parameters",parameters)
                const entities = getEntities(parameters);
                loadEntities(parameters, entities);
                updateState(parameters, 'Processing', 'It has begun to process the entities...');
                log.error("entities",entities)
                return [];
                //return entities;
            } catch (error) {
                log.error("Error [getInputData]", error);
                return [["isError", error.message]];
            }
        }

        const map = (mapContext) => {
            try {
                log.error("value",JSON.parse(mapContext.value))
                if (mapContext.value.indexOf("isError") != -1) {
                    mapContext.write({
                        key: mapContext.key,
                        value: mapContext.value
                    });
                } else {

                    const contextValue = JSON.parse(mapContext.value);

                    const response = createContributoryclass(contextValue);

                    if (response.createSetup) {
                        mapContext.write({
                            key: mapContext.key,
                            value: [entity.internalid, "T",response]   
                        });
                    }else{
                        mapContext.write({
                            key: mapContext.key,
                            value: [entity.internalid, "N",response]   
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
                    jsonResult[data.entityId] = data;
                    return true;
                });
                const errors = results.filter(([key]) => key === 'isError');
        
                const entitiesData = getEntities(parameters);
                const entityIds = entitiesData.map(({entity}) => entity.internalid);
                const idsSuccess = results.filter(([key, value]) => value === 'T').map(([id]) => id);
                const idsNoProcess = results.filter(([key, value]) => value === 'N').map(([id]) => id);
                let idsError = entityIds.filter(id => !idsSuccess.includes(id));
                idsError = idsError.filter(id => !idsNoProcess.includes(id));
                /*
                const transactions = [
                    ...idsSuccess.map(id => ({id, state: 's', createSetup:jsonResult[id][2].createSetup})),
                    ...idsError.map(id => ({id, state: 'e',createSetup:0}))
                ];
                */

                /* 
                    ["id de la entidad",                                    0
                    "estado del proceso para la entidad",                   1 {'s':proceseda,'e': error, 'n': no procesada}
                    "Si es creado por setup o por padron",                  2
                    "id de CC creado",                                      3
                    "(opcional) EL emnsaje por que no ha sido procesada"]   4
                */
                const entities = [
                    ...idsSuccess.map(id => ([id, 's', jsonResult[id][2].createSetup,jsonResult[id][2].CCId,0])),
                    ...idsError.map(id => ([id, 'e', 0, 0,0])),
                    ...idsNoProcess.map(id => ([id, 'n',0,0, jsonResult[id][2].message]))
                ];
        
                const statusEntities = {
                        "s":idsSuccess.length,
                        "e":idsError.length,
                        "p":0,
                        "n":idsNoProcess.length,
                    }
                
                
                updateEntitiesState(parameters, entities, statusEntities);
        
                if (errors.length === 0) {
                    updateState(parameters, 'Finish', 'The process is finished');
                } else {
                    log.error("error Summarize [interno]", errors[0][1]);
                    updateState(parameters, 'An error occurred', errors[0][1]);
                }

                
            } catch (error) {
                log.error("error Summarize [interno]", error);
                log.error("error Summarize [interno]", error.message);
                updateState(parameters, 'An error occurred', error.message);
            }
        };

        
        let loadEntities = (parameters,entities) => {

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

        let getFeatures = () => {

            return {
                department: runtime.isFeatureInEffect({ feature: "DEPARTMENTS" }),
                "class": runtime.isFeatureInEffect({ feature: "CLASS" }),
                location: runtime.isFeatureInEffect({ feature: "LOCATIONS" }),
                multibook: runtime.isFeatureInEffect({ feature: "MULTIBOOK" }),
                subsidiary: runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' })
            }
        }

        let getEntities = (parameters) => {
            let period;
            let subsidiary;
            let entityType;
            let searchRecordLog = search.create({
                type: 'ccustomrecord_lmry_ar_massive_gener_agip',
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
            
            return entities.map(entity => ({ entity, period, subsidiary }));
        }

        let createContributoryclass = ({entity, period, subsidiary}) => {
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
                return {message:'Not file for period'};
            }

            log.debug('entity', lisEntitys);
            const AGIPObject = new lbryAGIP.AGIPTXT(fileResults[0].id,[entity] , period, subsidiary);
            const infoCC = AGIPObject.getListContributoryClass();
            if (infoCC.length > 0) {
                log.debug('infoCC', infoCC);
                return {message:'Successful creation',createSetup:infoCC[0].createSetup,CCId:infoCC[0].idRetention};
            } else {
                return {message:'No tax applicable'};
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


        return { getInputData, map, summarize }

    });