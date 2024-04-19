/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @Name LMRY_AR_Massive_Gene_Agip_URET_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 05/04/2024
 */

define(['N/runtime', 'N/ui/serverWidget', 'N/search', 'N/url'], (runtime, serverWidget, search, url) => {


    const beforeLoad = (scriptContext) => {
        try {
            let mainUIManager = new UIManager(scriptContext);
            if (mainUIManager.isUserInterface()) {
                mainUIManager.hiddenFields();
                mainUIManager.buildTable();
                mainUIManager.loadTable();
                mainUIManager.getButtomResponse();
            }
        } catch (error) {
            log.error('Error beforeLoad ', error)
        }

    };


    class UIManager {
        constructor(scriptContext) {
            let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
            language = language === "es" ? language : "en";
            this.translations = this.getTranslations(language);
            this.FEAT_SUBS = this.isValid(runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' }));
            this.subsidiaries = [];
            this.scriptContext = scriptContext;
            this.form = scriptContext.form;
            this.newRecord = scriptContext.newRecord;
        }

        buildTable() {

            this.form.clientScriptModulePath = './LMRY_AR_Massive_Gene_Agip_CLNT_V2.1.js';
            this.form.addButton({
                id: "custpage_btn_reload",
                label: this.translations.LMRY_REFRESH,
                functionName: "reload()"
            });
            this.tab = this.form.addTab({ id: 'custpage_tab_entities', label: this.translations.LMRY_ENTITIES });
            this.form.insertTab({ tab: this.tab, nexttab: 'notes' });
            this.sublist = this.form.addSublist({
                id: 'custpage_custlist_entities',
                label: this.translations.LMRY_ENTITIES,
                tab: 'custpage_tab_entities',
                type: serverWidget.SublistType.LIST
            });

            const fields = [
                { id: 'custpage_col_number', label: this.translations.LMRY_NUMBER, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_entity', label: this.translations.LMRY_ENTITY, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_cuit', label: "CUIT", type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_created_from', label: this.translations.LMRY_CREATED_FROM, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_contributory_class', label: this.translations.LMRY_CC, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_status', label: this.translations.LMRY_STATUS, type: serverWidget.FieldType.TEXTAREA},
            ];
            fields.forEach(fieldInfo => {
                this.sublist.addField(fieldInfo);
            });

        }

        loadTable() {
            const data = this.getEntities();
            
            const sublist = this.form.getSublist({ id: "custpage_custlist_entities" });
            const ids = Object.keys(data);
            ids.forEach((id, i) => {
                const { internalid,type,names,cuit,status,createdSetup,CCId,message} = data[id];

                const setSublistValue = (colId, value) => sublist.setSublistValue({ id: colId, line: i, value });

                setSublistValue("custpage_col_number", i + 1);

                const entityUrl = url.resolveRecord({ recordType:type, recordId: internalid, isEditMode: false });
                setSublistValue("custpage_col_entity", `<a class="dottedlink" href="${entityUrl}" target="_blank">${names}</a>` );
                setSublistValue("custpage_col_cuit", cuit);
                setSublistValue("custpage_col_created_from", createdSetup);

                if (CCId) {
                    const ccUrl = url.resolveRecord({ recordType:"customrecord_lmry_ar_contrib_class", recordId: CCId, isEditMode: false });
                    setSublistValue("custpage_col_contributory_class", `<a class="dottedlink" href="${ccUrl}" target="_blank">${CCId}</a>`);
                }else {
                    setSublistValue("custpage_col_contributory_class", " ");
                }
                

                const jsonStatus = {
                    "s":this.translations.LMRY_PROCESING_CHECK,
                    "e":this.translations.LMRY_ERROR,
                    "p":this.translations.LMRY_PROCESING,
                    "n":this.translations.LMRY_NOT_PROCESING
                }

                const title = jsonStatus[status];
                let htmlStatus;
                /*
                if (status=="n") {

                    htmlStatus = title + " : " + message
                }else{
                    htmlStatus = title;
                }
                */
                const JsonMessage = this.translations[message];
                htmlStatus= `
                        <div style="display:flex; flex-direction: column; justify-content: center;">
                            <h3>${title}</h3>
                            ${status=="n" &&  JsonMessage ? `<span style="font-size: 0.9em; font-style: italic; margin: 5px 0">${JsonMessage}</span>`:""}
                        </div>
                        
                    `;
               
                setSublistValue("custpage_col_status", htmlStatus);
                
            });

            if (ids.length) {
                sublist.label = `${sublist.label} (${ids.length})`;
            }
        }


        getEntities() {

            const fieldEntities = this.scriptContext.newRecord.getValue('custrecord_lmry_ar_gen_agip_entities');
            if (!fieldEntities) return {};
            
            const entities = JSON.parse(fieldEntities);
            const processStatus = this.scriptContext.newRecord.getValue('custrecord_lmry_ar_gen_agip_status');
            const typeEntity = this.scriptContext.newRecord.getValue('custrecord_lmry_ar_gen_agip_entity_type');
            /*
            let transactionIds = entitiesIds.map(ts => typeof ts === 'object' && ts !== null ? ts.id : ts);
            let state = transactionIds.length > 0 && typeof entitiesIds[0] !== 'object' ? "Procesando" : undefined;
            */
            let processCompleted = false;
            let entitiesIds = entities;
            let listEntities = {};
            if (processStatus==="Loading data") return {};

            if (entities.length) {
                processCompleted = typeof entities[0] === 'object';
                if (processCompleted) {
                    entitiesIds = entities.map(entity => entity[0]);
                    //entities = entities.map(entity => entity[0])

                    for (let i = 0; i < entitiesIds.length; i++) {
                        const [id,status,createdSetup,CCId,message] = entities[i];
                        listEntities[id] = {
                            internalid:id,
                            status,
                            createdSetup: createdSetup == 0? "Padron":createdSetup ==1?"Setup":" ",
                            CCId: CCId ?? " ",
                            message: message ?? " ",
                            type:typeEntity
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
                }else{
                    listEntities[internalid].names = result.getValue(columns[6]) || " ";
                }
                listEntities[internalid].status = processCompleted ? listEntities[internalid].status : "p";
                return true;
            });

            return listEntities;
        }

        hiddenFields() {

            const fieldsHideen = ['custrecord_lmry_ar_gen_agip_entities','custrecord_lmry_ar_gen_agip_summary','custrecord_lmry_ar_gen_agip_url'];
            fieldsHideen.forEach(field => this.form.getField(field).updateDisplayType({ displayType: 'hidden' }));
        }

        getButtomResponse(){
            const responseField = this.form.addField({
                id: "custpage_response",
                type: serverWidget.FieldType.TEXTAREA,
                label: "File"
            });
            const urlFile = this.newRecord.getValue("custrecord_lmry_ar_gen_agip_url");
            if (urlFile) {
                const htmlUrlFile = `
                            <a href="${urlFile}" target="_blank" >
                                Response.csv
                            </a>
                            `;
                responseField.defaultValue = htmlUrlFile;
            }
            
            
        }


        isUserInterface() {
            return runtime.executionContext == 'USERINTERFACE';
        }

        getTranslations(lenguage) {
            const translatedFields = {
                "es": {
                    "LMRY_ENTITIES": "Entidades",
                    "LMRY_NUMBER": "Posición",
                    "LMRY_CITY": "Ciudad",
                    "LMRY_INTERNALID": "ID Interno",
                    "LMRY_CC": "Clase contributiva",
                    "LMRY_ENTITY": "Entidad",
                    "LMRY_STATUS": "Estado",
                    "LMRY_RESTART": "Reiniciar",
                    "LMRY_PROCESING": "Procesando",
                    "LMRY_ERROR": "Error",
                    "LMRY_NOT_PROCESING": "No procesada",
                    "LMRY_PROCESING_CHECK": "Procesada con éxito",
                    "LMRY_REFRESH": "Actualizar Pagina",
                    "LMRY_CREATED_FROM": "Creado desde",
                    "LMRY_NOT_PROCESING": "No procesada",
                    "LMRY_PROCESING_CHECK": "Procesada con éxito",
                    "LMRY_NOT_TAX_APPLY": "Entidad no registrada o con configuración incorrecta",
                    "LMRY_NOT_LIST": "No se ha encontrado ninguna lista para este periodo",
                },
                "en": {
                    "LMRY_ENTITIES": "Entities",
                    "LMRY_NUMBER": "Position",
                    "LMRY_CITY": "City",
                    "LMRY_INTERNALID": "Internal ID",
                    "LMRY_CC": "Contributory Class",
                    "LMRY_ENTITY": "Entity",
                    "LMRY_STATUS": "State",
                    "LMRY_RESTART": "Restart",
                    "LMRY_PROCESING": "Processing",
                    "LMRY_ERROR": "Error",
                    "LMRY_NOT_PROCESING": "Not Processed",
                    "LMRY_PROCESING_CHECK": "Successfully Processed",
                    "LMRY_REFRESH": "Refresh",
                    "LMRY_CREATED_FROM": "Created from",
                    "LMRY_NOT_TAX_APPLY": "Entity not registered or incorrectly configured",
                    "LMRY_NOT_LIST": "No list was found for this period",
                }
            }
            return translatedFields[lenguage];
        }

        isValid(bool) {
            return (bool === "T" || bool === true);
        }

    }

    return { beforeLoad };
});