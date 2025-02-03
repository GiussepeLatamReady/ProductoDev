function changeSubsidiary(currentRCD, subsidiaries) {
    try {
        console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
        console.log("subsidiaries", subsidiaries);

        var subsidiaryID = currentRCD.getCurrentSublistValue({
            sublistId: 'submachine',
            fieldId: 'subsidiary'
        });

        var isClient = true;
        var entityFields = getEntityFields();

        // Mapeo de cuántas subsidiarias hay por país
        var subsidiariesByCountry = {};

        Object.keys(subsidiaries).forEach(function (subsidiaryId) {
            var countryCode = subsidiaries[subsidiaryId].countryCode;
            if (!subsidiariesByCountry[countryCode]) {
                subsidiariesByCountry[countryCode] = [];
            }
            subsidiariesByCountry[countryCode].push(subsidiaryId);
        });

        // Evitar la doble ejecución del evento de click
        document.removeEventListener('click', handleButtonClick);
        document.addEventListener('click', handleButtonClick);

        function handleButtonClick(event) {
            console.log("##############################");
            console.log("handleButtonClick", "click");

            var buttonActions = {
                submachine_addedit: true,  // Agregar (isVisible = true)
                submachine_remove: false   // Remover (isVisible = false)
            };

            if (event.target && buttonActions.hasOwnProperty(event.target.id)) {
                var isVisible = buttonActions[event.target.id];

                // Obtener el país de la subsidiaria seleccionada
                var countryCode = subsidiaries[subsidiaryID].countryCode;

                // Verificar si es una acción de eliminación y si quedan subsidiarias en ese país
                if (!isVisible) {
                    // Filtrar la subsidiaria eliminada
                    subsidiariesByCountry[countryCode] = subsidiariesByCountry[countryCode].filter(id => id !== subsidiaryID);

                    // Si todavía quedan subsidiarias en el mismo país, **no ocultar el grupo**
                    if (subsidiariesByCountry[countryCode].length > 0) {
                        console.log("No se oculta el grupo del país porque hay más subsidiarias en", countryCode);
                        return;
                    }
                }

                // Crear jsonSubsidiaries para la subsidiaria seleccionada
                var jsonSubsidiaries = {};
                jsonSubsidiaries[subsidiaryID] = subsidiaries[subsidiaryID];
                console.log("jsonSubsidiaries", jsonSubsidiaries);

                // Procesar los datos de campo
                var fieldData = assignFieldsToSubsidiaries(jsonSubsidiaries, entityFields, currentRCD.type);

                // Crear grupos y actualizar campos
                createGroups(null, fieldData, isClient);
                setCustpage(fieldData, isClient, currentRCD, isVisible);

                console.log("Botón presionado: " + event.target.id.replace('submachine_', '') + ", Subsidiaria: ", subsidiaryID);
                console.log("##############################");
            }
        }
        console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");

    } catch (error) {
        console.error('Error', error);
    }
}
