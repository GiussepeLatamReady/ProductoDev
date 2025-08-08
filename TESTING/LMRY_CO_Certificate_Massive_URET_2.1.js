/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @Name LMRY_CO_Certificate_Massive_URET_2.1.js
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
                //mainUIManager.getButtomResponse();
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
            this.scriptContext = scriptContext;
            this.form = scriptContext.form;
            this.newRecord = scriptContext.newRecord;
        }

        buildTable() {

            //this.form.clientScriptModulePath = './AR_LIBRARY_MENSUAL/LMRY_AR_Massive_Gene_Agip_CLNT_V2.1.js';
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
                { id: 'custpage_col_filename', label: this.translations.LMRY_FILE_NAME, type: serverWidget.FieldType.TEXT },
                { id: 'custpage_col_url', label: this.translations.LMRY_URL, type: serverWidget.FieldType.TEXTAREA },
                { id: 'custpage_col_status', label: this.translations.LMRY_STATUS, type: serverWidget.FieldType.TEXT},
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
                const { vendorName,status,filename,url:urlfile} = data[id];

                const setSublistValue = (colId, value) => sublist.setSublistValue({ id: colId, line: i, value });
                const entityUrl = url.resolveRecord({ recordType:"vendor", recordId: id, isEditMode: false });
                setSublistValue("custpage_col_number", i + 1);
                setSublistValue("custpage_col_entity", `<a class="dottedlink" href="${entityUrl}" target="_blank">${vendorName}</a>` );
                setSublistValue("custpage_col_filename", filename || " ");
                setSublistValue("custpage_col_url", urlfile || " ");
                

                const jsonStatus = {
                    "FINISH":this.translations.LMRY_PROCESING_CHECK,
                    "ERROR":this.translations.LMRY_ERROR,
                    "PROCESS":this.translations.LMRY_PROCESING,
                    "PENDING":this.translations.LMRY_NOT_PROCESING
                }

                const title = jsonStatus[status];
                let htmlStatus;
                
                const JsonMessage = this.translations[status];
                htmlStatus= `
                        <div style="display:flex; flex-direction: column; justify-content: center;">
                            <h3>${title}</h3>
                        </div>
                        
                    `;
               
                setSublistValue("custpage_col_status", htmlStatus);
                
            });

            if (ids.length) {
                sublist.label = `${sublist.label} (${ids.length})`;
            }
        }


        getEntities() {

            const fieldEntities = this.scriptContext.newRecord.getValue('custrecord_lmry_co_mass_vendors');
            if (!fieldEntities) return {};      
            const entities = JSON.parse(fieldEntities);
            let entitiesIds = Object.keys(entities);
            let filters = [
                ["internalid", "anyof", entitiesIds]
            ];
            let columns = [];
            columns.push(search.createColumn({ name: 'formulatext', formula: '{internalid}', sort: search.Sort.DESC }));
            columns.push(search.createColumn({
                            name: 'formulatext',
                            formula: "CASE WHEN {isperson} = 'T' THEN CONCAT({firstname}, CONCAT(' ', CONCAT({middlename}, CONCAT(' ', {lastname})))) ELSE {companyname} END"
                        }));

            search.create({
                type: "vendor",
                filters: filters,
                columns: columns
            }).run().each(result => {
                const internalid = result.getValue(result.columns[0]);
                entities[internalid].vendorName = result.getValue(result.columns[1]) || " ";
                return true;
            });

            return entities;
        }

        hiddenFields() {

            const fieldsHideen = ['custrecord_lmry_co_mass_vendors','custrecord_lmry_co_mass_summary'];
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
                    "LMRY_ENTITY": "Entidad",
                    "LMRY_STATUS": "Estado",
                    "LMRY_PROCESING": "Procesando",
                    "LMRY_ERROR": "Error",
                    "LMRY_PROCESING_CHECK": "Procesada con éxito",
                    "LMRY_REFRESH": "Actualizar Pagina",
                    "LMRY_CREATED_FROM": "Creado desde",
                    "LMRY_NOT_PROCESING": "Cargando",
                    "LMRY_PROCESING_CHECK": "Procesada con éxito",
                    "LMRY_FILE_NAME": "Nombre del archivo",
                    "LMRY_URL": "Descargar"
                },
                "en": {
                    "LMRY_ENTITIES": "Entities",
                    "LMRY_NUMBER": "Position",
                    "LMRY_ENTITY": "Entity",
                    "LMRY_STATUS": "State",
                    "LMRY_PROCESING": "Processing",
                    "LMRY_ERROR": "Error",
                    "LMRY_NOT_PROCESING": "Loading",
                    "LMRY_PROCESING_CHECK": "Successfully Processed",
                    "LMRY_REFRESH": "Refresh",
                    "LMRY_CREATED_FROM": "Created from",
                    "LMRY_FILE_NAME": "File Name",
                    "LMRY_URL": "Download"
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