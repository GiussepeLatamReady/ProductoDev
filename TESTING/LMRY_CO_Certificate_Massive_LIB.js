/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @Name LMRY_CO_Certificate_Massive_LIB.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 20/07/2025
 */

define(['N/search', 'N/runtime', 'N/currentRecord', 'N/record', 'N/url'],

    function (search, runtime, currentRecord, record, url) {
        var translations = getTranslations()
        var defaultEntities = [];
        var allEntities = []
        var saveEntities = [];
        var subsidiary;
        var currentRecord;
        var selectedCount = 0;
        var entities = {};
        var page = 100;
        function loadvendors() {

            function generateStruct(ids) {
                var result = [];
                for (var i = 0; i < ids.length; i++) {
                    result.push(["formulanumeric: {msesubsidiary.internalid}", "equalto", ids[i]]);
                    if (i < ids.length - 1) {
                        result.push("OR");
                    }
                }
                return result;
            }

            function getSubsidiariries() {
                var subsidiaries = [];

                search.create({
                    type: "subsidiary",
                    filters: [
                        ["country", "anyof", "CO"],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                    columns: ["internalid"]
                }).run().each(function (result) {
                    subsidiaries.push(result.id);
                    return true;
                });

                return subsidiaries;
            }

            var subsidiaries = getSubsidiariries();

            var filters = [
                ["isinactive", "is", "F"]
            ];

            filters.push("AND", generateStruct(subsidiaries))
            var pageData = search.create({
                type: "vendor",
                filters: filters,
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "subsidiary", label: "Subsidiary" }),
                        search.createColumn({
                            name: 'formulatext',
                            formula: "CASE WHEN {isperson} = 'T' THEN CONCAT({firstname}, CONCAT(' ', CONCAT({middlename}, CONCAT(' ', {lastname})))) ELSE {companyname} END"
                        })
                    ]
            }).runPaged({ pageSize: 1000 });
            if (pageData) {
                pageData.pageRanges.forEach(function (pageRange) {
                    var page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(function (result) {
                        var subsidiaryId = result.getValue(result.columns[1]);
                        var internalid = result.getValue(result.columns[0]);
                        var nameEntity = result.getValue(result.columns[2]);
                        if (!entities[subsidiaryId]) entities[subsidiaryId] = [];
                        entities[subsidiaryId].push({ id: internalid, name: nameEntity, checked: false, status: "PENDING" })
                    });
                });
            }
        }


        function createButtonVendor() {

            var input = document.getElementById('custpage_proovedor_list');
            if (!input) {
                console.log('Input "custpage_proovedor_list" no encontrado.');
                return;
            }

            // Buscar el span padre manualmente (sin closest)
            var parentSpan = input;
            while (parentSpan && !/uir-field-input/.test(parentSpan.className)) {
                parentSpan = parentSpan.parentNode;
            }
            if (!parentSpan) {
                console.log('No se encontró el contenedor .uir-field-input');
                return;
            }

            var wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '8px';

            var parent = parentSpan.parentNode;
            parent.replaceChild(wrapper, parentSpan);
            wrapper.appendChild(parentSpan);
            // Crear botón
            var button = document.createElement('button');
            button.type = 'button';
            button.textContent = translations.SELECT_VENDOR;

            // Estilos
            button.style.padding = '6px 12px';
            button.style.fontSize = '13px';
            button.style.backgroundColor = '#0073aa';
            button.style.color = '#fff';
            button.style.border = 'none';
            button.style.borderRadius = '4px';
            button.style.cursor = 'pointer';
            button.style.transition = 'background 0.2s ease';

            // Hover effects
            button.onmouseenter = function () {
                button.style.backgroundColor = '#005f8d';
            };
            button.onmouseleave = function () {
                button.style.backgroundColor = '#0073aa';
            };

            loadvendors();
            // Acción del botón

            button.onclick = function () {
                if (subsidiary) {
                    executeModal();
                } else {
                    alert(translations.SELECT_SUBSIDIARY)
                }

            };

            wrapper.appendChild(button);

        }

        function getTranslations() {
            var language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
            language = language === "es" || language === "pt" ? language : "en";
            var translatedFields = {
                "en": {
                    "SELECT_VENDOR": "Select",
                    "PENDING": "Pending",
                    "SELECT_SUBSIDIARY": "⚠️ Select a subsidiary",
                    "SEARCH_ENTITIES": "Search entities...",
                    "SELECT_ALL": "Select all",
                    "DESELECT_ALL": "Deselect all",
                    "NO_ENTITIES_SELECTED": "0 entities selected",
                    "SAVE": "Save",
                    "CANCEL": "Cancel",
                    "APPLY": "Apply",
                    "INTERNAL_ID": "Internal ID",
                    "NAME": "Name",
                    "SHOWING_ENTITIES": "Showing 0 entities",
                    "PAGINATION_LABEL": "Showing {shown} entit{suffix1} of {total}",
                    "TITLE_HEADER": "Vendors"
                },
                "es": {
                    "SELECT_VENDOR": "Seleccionar",
                    "PENDING": "Pendiente",
                    "SELECT_SUBSIDIARY": "⚠️ Selecciona una subsidiaria",
                    "SEARCH_ENTITIES": "Buscar entidades...",
                    "SELECT_ALL": "Seleccionar todo",
                    "DESELECT_ALL": "Deseleccionar todo",
                    "NO_ENTITIES_SELECTED": "0 entidades seleccionadas",
                    "SAVE": "Guardar",
                    "CANCEL": "Cancelar",
                    "APPLY": "Aplicar",
                    "INTERNAL_ID": "ID interno",
                    "NAME": "Nombre",
                    "SHOWING_ENTITIES": "Mostrando 0 entidad",
                    "PAGINATION_LABEL": "Mostrando {shown} entidad{suffix1} de {total}",
                    "TITLE_HEADER": "Proveedores"
                },
                "pt": {
                    "SELECT_VENDOR": "Selecionar",
                    "PENDING": "Pendente",
                    "SELECT_SUBSIDIARY": "⚠️ Selecionar uma subsidiária",
                    "SEARCH_ENTITIES": "Buscar entidades...",
                    "SELECT_ALL": "Selecionar tudo",
                    "DESELECT_ALL": "Deselecionar tudo",
                    "NO_ENTITIES_SELECTED": "0 entidades selecionadas",
                    "SAVE": "Salvar",
                    "CANCEL": "Cancelar",
                    "APPLY": "Aplicar",
                    "INTERNAL_ID": "ID interno",
                    "NAME": "Nome",
                    "SHOWING_ENTITIES": "Mostrando 0 entidades",
                    "PAGINATION_LABEL": "Mostrando {shown} entidade{suffix1} de {total}",
                    "TITLE_HEADER": "Fornecedores"
                }
            };

            return translatedFields[language];
        }

        function executeModal() {
            var language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
            defaultEntities = entities[subsidiary];
            if (saveEntities.length) {
                allEntities = JSON.parse(JSON.stringify(saveEntities));
            } else {
                allEntities = JSON.parse(JSON.stringify(defaultEntities));
            }

            var entityList = allEntities.slice(0, page);
            const colorTheme = getColor();
            // Modal de bloqueo (fondo oscuro)
            var overlay = document.createElement('div');
            overlay.id = 'modal-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'rgba(0, 0, 0, 0.6)';
            overlay.style.zIndex = '9999';
            overlay.style.transition = 'opacity 0.3s ease-in-out';
            document.body.appendChild(overlay);

            // Contenedor - Ventana Modal
            var container = document.createElement('div');
            container.id = 'modal-container';
            container.style.position = 'fixed';
            container.style.top = '50%';
            container.style.left = '50%';
            container.style.transform = 'translate(-50%, -50%)';
            container.style.height = 'auto';
            container.style.maxHeight = '80vh';
            container.style.background = 'white';
            container.style.padding = '20px';
            container.style.borderRadius = '12px';
            container.style.border = '1px solid #ddd';
            container.style.boxShadow = '0px 4px 15px rgba(0, 0, 0, 0.3)';
            container.style.overflowY = 'auto';
            container.style.zIndex = '10000';
            container.style.transition = 'all 0.3s ease-in-out';

            // Función para ajustar el ancho dinámicamente
            function adjustModalWidth() {
                var viewportWidth = window.innerWidth;
                if (viewportWidth > 1200) {
                    container.style.width = '70%';
                } else if (viewportWidth > 768) {
                    container.style.width = '80%';
                } else {
                    container.style.width = '95%';
                }
            };

            adjustModalWidth();
            window.addEventListener('DOMContentLoaded', adjustModalWidth);
            window.addEventListener('resize', adjustModalWidth);

            // Animación de apertura
            container.style.opacity = '0';
            setTimeout(function () { container.style.opacity = '1'; }, 100);

            // Cabecera - Ventana Modal
            var header = document.createElement('div');
            header.id = 'subsidiary-modal';
            header.className = 'latam-tab';
            header.style.width = '100%';
            header.style.height = '40px';
            header.style.background = colorTheme;
            header.style.padding = '15px 20px';
            header.style.borderTopLeftRadius = '12px';
            header.style.borderTopRightRadius = '12px';
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.justifyContent = 'space-between';
            header.style.position = 'relative';
            header.style.boxShadow = '0px 2px 10px rgba(0,0,0,0.1)';

            // Título - Cabecera
            var titleHeader = document.createElement('h2');
            titleHeader.id = 'title-header';
            titleHeader.innerText = translations.TITLE_HEADER; //transalations_need
            titleHeader.style.color = 'white';
            titleHeader.style.cursor = 'default';
            titleHeader.style.fontSize = '17px';
            titleHeader.style.fontWeight = 'bold';
            titleHeader.style.fontFamily = 'Arial, sans-serif';

            // Botón de Cierre de Ventana
            var closeButton = document.createElement('button');
            closeButton.id = 'close-button';
            closeButton.textContent = '✖';
            closeButton.style.border = 'none';
            closeButton.style.color = 'white';
            closeButton.style.cursor = 'pointer';
            closeButton.style.fontSize = '16px';
            closeButton.style.width = '25px';
            closeButton.style.height = '25px';
            closeButton.style.borderRadius = '50%';
            closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
            closeButton.style.display = 'flex';
            closeButton.style.alignItems = 'center';
            closeButton.style.justifyContent = 'center';
            closeButton.style.transition = 'background 0.3s ease-in-out';

            // Efecto hover en botón de cierre
            closeButton.addEventListener('mouseenter', function () {
                closeButton.style.background = 'rgba(255, 255, 255, 0.6)';
            });
            closeButton.addEventListener('mouseleave', function () {
                closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
            });

            // Acción de cierre
            closeButton.addEventListener('click', function () {
                container.style.opacity = '0';
                overlay.style.opacity = '0';
                setTimeout(function () {
                    //currentRecord.setCurrentSublistValue({ sublistId: type, fieldId: fieldCheckId, value: false })
                    document.body.removeChild(container);
                    document.body.removeChild(overlay);
                }, 300);
            });

            header.appendChild(titleHeader);
            header.appendChild(closeButton);

            container.appendChild(header);
            document.body.appendChild(container);

            // Contenedor principal
            var contentContainer = document.createElement('div');
            contentContainer.style.display = 'flex';
            contentContainer.style.flexDirection = 'column';
            contentContainer.style.gap = '20px';
            contentContainer.style.padding = '10px 20px';
            contentContainer.style.fontFamily = 'Arial, sans-serif';

            // Altura fija + scroll interno
            //contentContainer.style.height = '500px'; // o usa '60vh' si prefieres altura relativa a la pantalla
            //contentContainer.style.overflowY = 'auto';


            // Contenedor principal
            var contentEntitySearch = document.createElement('div');
            contentEntitySearch.style.display = 'flex';
            contentEntitySearch.style.flexDirection = 'column';
            contentEntitySearch.style.gap = '10px';
            contentEntitySearch.style.fontFamily = 'Arial, sans-serif';

            // Altura fija + scroll interno
            contentEntitySearch.style.height = '400px';
            contentEntitySearch.style.overflowY = 'auto';

            // Campo de búsqueda
            var entitySearch = document.createElement('input');
            entitySearch.type = 'text';
            entitySearch.placeholder = translations.SEARCH_ENTITIES;
            entitySearch.style.padding = '10px 10px';
            entitySearch.style.margin = '10px 0px 0px 0px';
            entitySearch.style.width = '100%';
            entitySearch.style.fontSize = '13px';
            entitySearch.style.border = '1px solid #ccc';
            entitySearch.style.borderRadius = '6px';
            entitySearch.style.marginBottom = '10px';

            // Tabla principal
            var entityTable = document.createElement('table');
            entityTable.style.width = '100%';
            entityTable.style.borderCollapse = 'collapse';
            entityTable.style.fontSize = '13px';

            var thead = document.createElement('thead');
            thead.innerHTML = '' +
                '<tr>' +
                '<th style="padding: 6px; border: 1px solid #ccc;">' + translations.APPLY + '</th>' +
                '<th style="padding: 6px; border: 1px solid #ccc;">' + translations.INTERNAL_ID + '</th>' +
                '<th style="padding: 6px; border: 1px solid #ccc;">' + translations.NAME + '</th>' +
                '</tr>';


            //thead.style.display = 'table';
            thead.style.width = '100%';
            thead.style.tableLayout = 'fixed';
            thead.style.position = 'sticky';
            thead.style.top = '0';
            thead.style.background = '#f9f9f9';
            thead.style.zIndex = '1';
            thead.style.borderBottom = '2px solid #ccc';
            thead.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';

            entityTable.appendChild(thead);

            var tbody = document.createElement('tbody');
            tbody.id = 'entity-table-body';
            entityTable.appendChild(tbody);


            var paginationLabel = document.createElement('div');
            paginationLabel.id = 'pagination-label';
            paginationLabel.style.fontSize = '13px';
            paginationLabel.style.color = '#333';
            paginationLabel.style.alignSelf = 'flex-end'; // Si usas flexbox
            paginationLabel.textContent = translations.SHOWING_ENTITIES; // valor inicial


            // Botones de seleccionar/deseleccionar
            var btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex';
            btnGroup.style.gap = '10px';
            btnGroup.style.marginTop = '10px';

            var btnSelectAll = document.createElement('button');
            btnSelectAll.textContent = translations.SELECT_ALL;
            btnSelectAll.style.padding = '5px 12px';
            btnSelectAll.style.background = '#0073aa';
            btnSelectAll.style.color = 'white';
            btnSelectAll.style.border = 'none';
            btnSelectAll.style.borderRadius = '4px';
            btnSelectAll.style.cursor = 'pointer';
            btnSelectAll.onclick = function () {
                var boxes = document.querySelectorAll('.entity-checkbox');

                for (var i = 0; i < boxes.length; i++) {
                    boxes[i].checked = true;

                }
                // Actualiza en allEntities
                for (var j = 0; j < allEntities.length; j++) {
                    allEntities[j].checked = true;
                }

                // Actualiza en entityList (paginado actual o filtrado)
                for (var k = 0; k < entityList.length; k++) {
                    entityList[k].checked = true;
                }

                updateSelectedLabel(); // Actualiza el contador
            };

            var btnDeselectAll = document.createElement('button');
            btnDeselectAll.textContent = translations.DESELECT_ALL;
            btnDeselectAll.style.padding = '5px 12px';
            btnDeselectAll.style.background = '#0073aa';
            btnDeselectAll.style.color = 'white';
            btnDeselectAll.style.border = 'none';
            btnDeselectAll.style.borderRadius = '4px';
            btnDeselectAll.style.cursor = 'pointer';
            btnDeselectAll.onclick = function () {

                var boxes = document.querySelectorAll('.entity-checkbox');

                for (var i = 0; i < boxes.length; i++) {
                    boxes[i].checked = false;
                }
                for (var j = 0; j < allEntities.length; j++) {
                    allEntities[j].checked = false;
                }

                for (var k = 0; k < entityList.length; k++) {
                    entityList[k].checked = false;
                }

                updateSelectedLabel();
            };

            var selectedLabel = document.createElement('div');
            selectedLabel.id = 'selected-label';
            selectedLabel.style.fontSize = '13px';
            selectedLabel.style.color = '#0073aa';
            selectedLabel.style.marginTop = '10px';
            selectedLabel.style.alignSelf = 'flex-start';
            selectedLabel.textContent = translations.NO_ENTITIES_SELECTED;

            function updateSelectedLabel() {
                selectedCount = 0;

                for (var i = 0; i < allEntities.length; i++) {
                    if (allEntities[i].checked) {
                        selectedCount++;
                    }
                }

                if (language === 'es') {
                    selectedLabel.textContent =
                        selectedCount + ' entidad' + (selectedCount !== 1 ? 'es' : '') +
                        ' seleccionada' + (selectedCount !== 1 ? 's' : '');
                } else if (language === 'en') {
                    selectedLabel.textContent =
                        selectedCount + ' ' + (selectedCount === 1 ? 'entity' : 'entities') +
                        ' selected';
                } else if (language === 'pt') {
                    selectedLabel.textContent =
                        selectedCount + ' entidade' + (selectedCount !== 1 ? 's' : '') +
                        ' selecionada' + (selectedCount !== 1 ? 's' : '');
                }
            }

            btnGroup.appendChild(btnSelectAll);
            btnGroup.appendChild(btnDeselectAll);
            btnGroup.appendChild(selectedLabel);

            // Lista de entidades (ejemplo)



            entitySearch.addEventListener('input', function () {
                var searchValue = entitySearch.value.trim().toLowerCase();

                if (searchValue.length >= 3) {
                    var filtered = allEntities.filter(function (ent) {
                        var idMatch = String(ent.id).toLowerCase().includes(searchValue);
                        var nameMatch = ent.name.toLowerCase().includes(searchValue);
                        return idMatch || nameMatch;
                    });

                    renderTable(filtered);
                } else {
                    renderTable(entityList);
                }
            });

            function getPaginationLabel(shown, total, language) {
                const template = translations["PAGINATION_LABEL"];
                const isPlural = shown !== 1;

                const suffixMap = {
                    en: isPlural ? 'ies' : 'y',
                    es: isPlural ? 'es' : '',
                    pt: isPlural ? 's' : ''
                };

                return template
                    .replace('{shown}', shown)
                    .replace('{suffix1}', suffixMap[language])
                    .replace('{total}', total);
            }



            function renderTable(list) {
                // Limpia tabla
                tbody.innerHTML = '';

                for (var i = 0; i < list.length; i++) {
                    var entity = list[i];

                    var row = document.createElement('tr');
                    row.innerHTML =
                        '<td style="padding: 6px; border: 1px solid #ccc;">' +
                        '<input type="checkbox" class="entity-checkbox" data-id="' + entity.id + '"' +
                        (entity.checked ? ' checked' : '') + '/>' +
                        '</td>' +
                        '<td style="padding: 6px; border: 1px solid #ccc;">' + entity.id + '</td>' +
                        '<td style="padding: 6px; border: 1px solid #ccc;">' + entity.name + '</td>';
                    tbody.appendChild(row);
                }

                //updateSelectedLabel()
                // También podrías actualizar un label de cantidad:
                paginationLabel.textContent = getPaginationLabel(list.length, allEntities.length, language);
            }





            // Agregar al contenedor del modal (dentro de contentContainer)
            contentContainer.appendChild(entitySearch);
            contentContainer.appendChild(btnGroup);
            contentEntitySearch.appendChild(entityTable);
            contentContainer.appendChild(contentEntitySearch);
            contentContainer.appendChild(paginationLabel);
            container.appendChild(contentContainer);
            // Inicializar con todos



            //Agregar botones
            var buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'flex-end';
            buttonContainer.style.gap = '15px';
            buttonContainer.style.padding = '10px 20px';
            buttonContainer.style.marginTop = '5px';

            // Estilos base para los botones
            function createButton(text, bgColor, textColor, hoverBg, hoverText, action) {
                var button = document.createElement('button');
                button.innerText = text;
                button.style.padding = '6px 20px';
                button.style.border = 'none';
                button.style.borderRadius = '6px';
                button.style.cursor = 'pointer';
                button.style.fontSize = '14px';
                button.style.fontWeight = 'bold';
                button.style.transition = 'all 0.3s ease-in-out';
                button.style.backgroundColor = bgColor;
                button.style.color = textColor;
                button.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';

                // Efecto hover
                button.addEventListener('mouseenter', function () {
                    button.style.backgroundColor = hoverBg;
                    button.style.color = hoverText;
                });
                button.addEventListener('mouseleave', function () {
                    button.style.backgroundColor = bgColor;
                    button.style.color = textColor;
                });

                // Acción al hacer clic
                button.addEventListener('click', action);

                return button;
            };

            // Botón de Guardar
            var saveButton = createButton(
                translations.SAVE,//translation.LMRY_SAVE,
                '#006AFF',      // Verde éxito 
                '#FFFFFF',      // Texto blanco 
                '#0055CC',      // Verde más oscuro en hover
                '#FFFFFF',
                function () {
                    var allValid = true; // Variable para verificar si todos son válidos



                    // Si todos los valores son válidos, proceder con el guardado
                    if (allValid) {
                        document.body.removeChild(container);
                        document.body.removeChild(overlay);
                        saveEntities = JSON.parse(JSON.stringify(allEntities));
                        if (selectedCount == 1) {

                            var singleEntity = saveEntities.filter(function (ent) {
                                return ent.checked;
                            });

                            if (currentRecord) {
                                currentRecord.setValue({
                                    fieldId: 'custpage_proovedor_list',
                                    value: singleEntity[0].name
                                });
                            }
                        } else {
                            if (currentRecord) {
                                currentRecord.setValue({
                                    fieldId: 'custpage_proovedor_list',
                                    value: selectedCount + ' entidades selccionadas '
                                });
                            }

                        }
                        //currentRecord.setCurrentSublistValue({ sublistId: type, fieldId: fieldCheckId, value: false })
                        //checkvariableRate.classList.replace('checkbox_ck', 'checkbox_unck');
                    } else {
                        alert('⚠️ Error: validacion');
                    }
                }
            );

            // Botón de Cancelar
            var cancelButton = createButton(
                translations.CANCEL,//translation.LMRY_CANCEL,
                '#D2D2D2',      // Rojo alerta 
                '#030000',      // Texto blanco
                '#B3B3B3',      // Rojo más oscuro en hover
                '#030000',
                function () {
                    document.body.removeChild(container);
                    document.body.removeChild(overlay);
                }
            );

            // Agregar botones al contenedor
            buttonContainer.appendChild(cancelButton);
            buttonContainer.appendChild(saveButton);

            // Agregar el contenedor de botones al modal
            container.appendChild(buttonContainer);
            // Fin de agregar botones

            document.body.appendChild(container);
            //renderEntities();

            updateSelectedLabel()
            renderTable(entityList);


            document.getElementById('entity-table-body').addEventListener('change', function (event) {
                var target = event.target;

                if (target && target.classList.contains('entity-checkbox')) {
                    var id = parseInt(target.getAttribute('data-id'));
                    for (var i = 0; i < allEntities.length; i++) {
                        if (allEntities[i].id == id) {
                            allEntities[i].checked = target.checked;
                            break;
                        }
                    }
                    updateSelectedLabel();
                }
            });

            // Escuchar cambios en cualquier checkbox de entidad (por delegación)


        }

        function getColor() {
            var colorIds = ["-358", "-5", "-16", "-14", "-15", "-8", "10", "-9", "-7",
                "-13", "-12", "-6", "-11", "-100", "-101", "-102", "-103", "-104", "-105", "-106", "-107", "-108",
                "-109", "-110", "-111", "-112", "-113", "-114", "-115", "-116", "-117", "-118", "-119", "-120",
                "-350", "-351", "-352", "-353", "-354", "-355", "-356", "-357",
                "-361", "-362", "-359", "-360", "-363", "-364", "-365", "-121", "-122", "-123", "-124", "-125",
                "-126", "-127", "-128", "-129", "-130", "-131", "-366", "-367",
                "-368", "-369", "-370", "-371", "-372", "-373", "-132", "-133", "-134", "-136", "-137", "-138", "-139",
                "-148", "-135", "-141", "-142", "-143", "-144", "-145",
                "-146", "-147", "-148", "-149", "-150", "-151", "-152", "-153", "-154", "-155", "-156", "-157",
                "-158", "-159", "-160", "-161", "-374", "-375", "-376", "-377",
                "-378", "-380", "-379", "-481"
            ];

            var colorBackgrounds = ["#002157", "#607799", "#444444", "#674218", "#888888", "#6D8C1E", "#85C1CF", "#8CB49A", "#E5772A", "#DC64A2", "#6E609D", "#AD4B4B", "#287587", "#FF6600", "#0C2475",
                "#660000", "#EAB200", "#CC0000", "#7595CC", "#D60039", "#000066", "#FFCC66", "#006600", "#BD9C00", "#CC0000", "#000066", "#663399", "#CC9900", "#B40000", "#830506",
                "#FF6600", "#CC6600", "#660000", "#CC0000", "#075699", "#001E58", "#241D4E", "#222222", "#CC0000", "#023EAD", "#990000", "#FF571C", "#222222", "#CC0000", "#000066",
                "#041C43", "#00543D", "#013875", "#000056", "#FF6600", "#8C2108", "#333333", "#000063", "#017400", "#752132", "#702C7E", "#CC0000", "#35457C", "#B69B29", "#990000",
                "#990000", "#004576", "#222222", "#990000", "#000066", "#004A83", "#00287A", "#F76507", "#990000", "#004A85", "#CC0000", "#305930", "#990000", "#002649", "#FF9900",
                "#1A2E57", "#002868", "#840029", "#211F5E", "#044520", "#FF6600", "#AD3118", "#003399", "#A20012", "#330066", "#990000", "#990032", "#990000", "#000067", "#0034AE",
                "#DE0018", "#000066", "#2B0A4F", "#000066", "#880029", "#980033", "#EF9218", "#B5AD63", "#000066", "#8B0222", "#333399", "#000066", "#892020", "#3A027C", "#03492F", "#002654"
            ]

            var colorId = runtime.getCurrentUser().getPreference({
                name: 'COLORTHEME'
            });
            var i = colorIds.indexOf(colorId);
            if (i == -1) i = 0;
            return colorBackgrounds[i];
        }
        function setSubsidiary(subsidiaryId) {
            subsidiary = subsidiaryId;
        }
        function setCurrentRecord(RCD) {
            currentRecord = RCD;
        }

        function createRecordMassive(currentRecord) {

            var activeAntities = saveEntities.filter(function (ent) {
                return ent.checked;
            });
            if (!activeAntities.length) {
                alert("Elija al menos una entidad")
                return false;
            }

            function compactEntityArray(arr) { //Update_vendor
                var result = {};
                for (var i = 0; i < arr.length; i++) {
                    result[arr[i].id] = {
                        status: arr[i].status,
                        filename: "",
                        url: ""
                    }
                }
                return result;
            }

            var entitiesList = compactEntityArray(activeAntities);
            var summary = {
                s: 0, // Success
                p: 0, // processing
                n: Object.keys(entitiesList).length, // Loading
                e: 0  // Error
            }
                        
            var result = {
                entitiesList:entitiesList,
                summary:summary
            }

            currentRecord.setValue({
                            fieldId: 'custpage_record_massive_list_ids',
                            value: JSON.stringify(result)
                        });

            return true;
        }

        function continueExecutionFlow(vendor, recordLogId, isError, filename, urlFile, isNoData) {
            require(['N/task'], function (task) {

                var recordLog = record.load({ id: recordLogId, type: "customrecord_lmry_co_rpt_generator_log" });

                var recordMassiveId = recordLog.getValue("custrecord_lmry_co_rpt_massive_id");

                if (!recordMassiveId) return false;
                var recordMasive = record.load({ id: recordMassiveId, type: "customrecord_lmry_co_massive_cer_log" });
                var vendors = JSON.parse(recordMasive.getValue("custrecord_lmry_co_mass_vendors"));
                var summary = JSON.parse(recordMasive.getValue("custrecord_lmry_co_mass_summary"));
                summary.p--;
                if (isError) {
                    summary.e++;
                } else {
                    summary.s++;
                }

                var status = isError ? "ERROR" : isNoData ? "NO_DATA" : "FINISH";
                vendors[vendor].status = status;

                vendors[vendor].filename = isError || isNoData ? "" : filename;
                vendors[vendor].url = isError || isNoData ? "" : urlFile;

                if (!isError && !isNoData) {
                    var lower = urlFile.toLowerCase();

                    var type = "";
                    if (lower.indexOf("/downloadfolder.nl") !== -1) type = "folder";
                    else if (lower.indexOf("/media.nl") !== -1 || lower.indexOf("/downloadfile.nl") !== -1) type = "file";

                    var idMatch = urlFile.match(/[?&]id=(\d+)/);
                    var id = idMatch ? parseInt(idMatch[1], 10) : null;
                    vendors[vendor].fileId = id;
                    vendors[vendor].fileType = type;
                }

                recordMasive.setValue('custrecord_lmry_co_mass_vendors', JSON.stringify(vendors));
                recordMasive.setValue('custrecord_lmry_co_mass_summary', JSON.stringify(summary));
                recordMasive.save();

                var params = {
                    "custscript_lmry_co_massive_record_id": recordMassiveId
                };
                task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: "customscript_lmry_co_cert_massive_schdl",
                    params: params
                }).submit();
            });

        }


        return {
            createButtonVendor: createButtonVendor,
            saveEntities: saveEntities,
            subsidiary: subsidiary,
            setSubsidiary: setSubsidiary,
            setCurrentRecord: setCurrentRecord,
            createRecordMassive: createRecordMassive,
            continueExecutionFlow: continueExecutionFlow
        };
    });