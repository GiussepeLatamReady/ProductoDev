// Variable para evitar que los eventos se registren más de una vez
var eventsRegistered = false;

function changeSubsidiary(currentRCD, subsidiaries) {
    try {
        log.debug("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
        log.debug("subsidiaries", subsidiaries);

        var subsidiaryID = currentRCD.getCurrentSublistValue({
            sublistId: 'submachine',
            fieldId: 'subsidiary'
        });

        var isClient = true;
        var entityFields = getEntityFields();

        // Mapeo de cuántas subsidiarias hay por país
        var subsidiariesByCountry = {};

        Object.keys(subsidiaries).forEach(function (subsidiaryId) {
            if (subsidiaries[subsidiaryId].isActive) {
                var countryCode = subsidiaries[subsidiaryId].countryCode;
                if (!subsidiariesByCountry[countryCode]) {
                    subsidiariesByCountry[countryCode] = [];
                }
                subsidiariesByCountry[countryCode].push(subsidiaryId);
            }
        });

        log.debug("subsidiariesByCountry", subsidiariesByCountry);

        // Identificar los botones específicos
        var addButton = document.getElementById("submachine_addedit");
        var removeButton = document.getElementById("submachine_remove");

        // Verificar si los eventos ya han sido registrados
        if (!eventsRegistered) {
            if (addButton) {
                addButton.addEventListener('click', handleButtonClick);
            }

            if (removeButton) {
                removeButton.addEventListener('click', handleButtonClick);
            }

            // Marcar que los eventos ya fueron registrados para evitar duplicaciones
            eventsRegistered = true;
        }

        function handleButtonClick(event) {
            log.debug("##############################");
            log.debug("handleButtonClick", "click");

            var buttonId = event.target ? event.target.id : null;
            if (!buttonId) return;

            log.debug("event.target.id", buttonId);

            var isVisible = buttonId === "submachine_addedit"; // true para agregar, false para eliminar

            // Obtener el país de la subsidiaria seleccionada
            var subsidiary = subsidiaries[subsidiaryID];
            if (!subsidiary) return;

            var countryCode = subsidiary.countryCode;
            if (!countryCode) return;

            log.debug("countryCode", countryCode);

            // Si la acción es eliminar
            if (!isVisible) {
                log.debug("subsidiariesByCountry antes de eliminar", subsidiariesByCountry);

                // Filtrar la subsidiaria eliminada
                subsidiariesByCountry[countryCode] = subsidiariesByCountry[countryCode].filter(function (id) {
                    return id !== subsidiaryID;
                });

                log.debug("subsidiariesByCountry después de eliminar", subsidiariesByCountry);

                // Si todavía quedan subsidiarias en el mismo país, **no ocultar el grupo**
                if (subsidiariesByCountry[countryCode].length > 0) {
                    log.debug("No se oculta el grupo del país porque hay más subsidiarias en", countryCode);
                    return;
                }
            }

            // Crear jsonSubsidiaries solo con la subsidiaria seleccionada
            var jsonSubsidiaries = {};
            jsonSubsidiaries[subsidiaryID] = subsidiary;
            log.debug("jsonSubsidiaries", jsonSubsidiaries);

            // Procesar los datos de campo
            var fieldData = assignFieldsToSubsidiaries(jsonSubsidiaries, entityFields, currentRCD.type);

            // Crear grupos y actualizar campos
            createGroups(null, fieldData, isClient);
            setCustpage(fieldData, isClient, currentRCD, isVisible);

            log.debug("Botón presionado: " + buttonId.replace('submachine_', '') + ", Subsidiaria: ", subsidiaryID);
            log.debug("##############################");

            // Actualizar el estado de la subsidiaria
            subsidiaries[subsidiaryID].isActive = isVisible;

            // Si se está agregando la subsidiaria, asegurar que se registre en subsidiariesByCountry
            if (isVisible) {
                if (!subsidiariesByCountry[countryCode]) {
                    subsidiariesByCountry[countryCode] = [];
                }
                if (subsidiariesByCountry[countryCode].indexOf(subsidiaryID) === -1) {
                    subsidiariesByCountry[countryCode].push(subsidiaryID);
                }
            }
        }

        log.debug("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");

    } catch (error) {
        log.error('Error', error);
    }
}
