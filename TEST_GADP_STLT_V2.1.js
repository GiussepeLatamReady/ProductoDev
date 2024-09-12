/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/log', 'N/redirect'], (serverWidget, record, search, log, redirect) => {

    const onRequest = (context) => {
        const totalDeleted = context.request.parameters.totalDeleted || 0;
        const totalRecords = getTotalRecordsCount(); // Obtener el total de registros

        if (context.request.method === 'GET') {
            // Crear el formulario del Suitelet
            const form = serverWidget.createForm({
                title: 'Eliminar Registros'
            });

            // Campo para mostrar el total de registros existentes
            form.addField({
                id: 'custpage_total_records',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Total de Registros'
            }).defaultValue = `<p>Existen ${totalRecords} registros en total.</p>`;

            // Campo para ingresar cuántos registros deseas eliminar
            const numToDeleteField = form.addField({
                id: 'custpage_num_to_delete',
                type: serverWidget.FieldType.INTEGER,
                label: 'Número de Registros a Eliminar'
            });
            numToDeleteField.defaultValue = totalRecords; // Valor por defecto: eliminar todos

            // Campo para mostrar el resultado de la eliminación
            const htmlField = form.addField({
                id: 'custpage_result_html',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Resultado'
            });

            if (totalDeleted > 0) {
                htmlField.defaultValue = `<p>Se han eliminado ${totalDeleted} registros. Quedan ${totalRecords} registros.</p>`;
            } else {
                htmlField.defaultValue = 'Haz clic en el botón para ejecutar el proceso de eliminación.';
            }

            // Agregar un botón de eliminar
            form.addSubmitButton({
                label: 'Eliminar Registros'
            });

            // Mostrar la página
            context.response.writePage(form);

        } else if (context.request.method === 'POST') {
            // Obtener el número de registros que el usuario desea eliminar
            const numToDelete = parseInt(context.request.parameters.custpage_num_to_delete) || 0;

            // Ejecutar el proceso de eliminación de registros
            let countDeleted = 0;

            try {
                countDeleted = deleteRecords(numToDelete); // Llamar a la función que elimina los registros

                // Redirigir al mismo Suitelet pasando el total de registros eliminados
                redirect.toSuitelet({
                    scriptId: 'customscript_test_gadp_stlt', // Script ID actualizado
                    deploymentId: 'customdeploy_test_stlt_gadp', // Deployment ID actualizado
                    parameters: {
                        totalDeleted: countDeleted
                    }
                });

            } catch (e) {
                log.error({
                    title: 'Error al eliminar registros',
                    details: e.toString()
                });

                context.response.write(`Error al ejecutar el proceso: ${e.message}`);
            }
        }
    };

    // Función auxiliar para eliminar registros y devolver el número de registros eliminados
    const deleteRecords = (numToDelete) => {
        let countDeleted = 0;
        try {
            const mySearch = search.create({
                type: 'customrecord_lmry_br_ibpt', // Tipo de registro actualizado
                filters: [],
                columns: ['internalid'],
                sort: [
                    search.Sort.ASC // Orden ascendente por internalid
                ]
            });

            let remainingToDelete = numToDelete;
            mySearch.run().each(result => {
                const recordId = result.getValue({ name: 'internalid' });

                // Eliminar cada registro
                record.delete({
                    type: 'customrecord_lmry_br_ibpt', // Tipo de registro actualizado
                    id: recordId
                });

                countDeleted++;
                remainingToDelete--;

                // Detener si ya hemos eliminado la cantidad solicitada
                if (remainingToDelete === 0) {
                    return false; // Detener la búsqueda
                }

                return true; // Continuar con la siguiente iteración
            });
        } catch (e) {
            log.error('Error al eliminar registros', e.toString());
        }

        return countDeleted; // Retorna el número de registros eliminados
    };

    // Función auxiliar para obtener el total de registros existentes
    const getTotalRecordsCount = () => {
        let total = 0;
        const mySearch = search.create({
            type: 'customrecord_lmry_br_ibpt', // Tipo de registro actualizado
            filters: [],
            columns: ['internalid']
        });

        total = mySearch.runPaged().count; // Obtener el total de registros
        return total;
    };

    return {
        onRequest
    };
});
