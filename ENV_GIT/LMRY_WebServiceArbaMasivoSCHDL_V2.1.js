/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_WebServiceArbaMasivoSCHDL_V2.1.js           ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Set 09 2022  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
* @NApiVersion 2.1
* @NScriptType ScheduledScript
* @NModuleScope Public
*/
//@ts-check
// @ts-ignore
define(["require", "exports", "N/log", "N/runtime", "./AR_LIBRARY_MENSUAL/LMRY_ARBAWebServiceLBRY_V2.1", "N/search", "N/record"],
 function (require, exports, log, runtime, libARBA, search, record) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.execute = void 0;
    let execute = () => {
        function updateLog() {
            var searchLog = search.create({
                type: 'customrecord_lmry_ar_ws_log_resumen',
                columns: ['internalid'],
                filters: ['custrecord_lmry_ar_ws_resumen_estado', 'contains', 'Procesando']
            });
            searchLog = searchLog.run().getRange(0, 10);
            searchLog.forEach(function (recordLog) {
                record.submitFields({
                    type: "customrecord_lmry_ar_ws_log_resumen",
                    id: recordLog.getValue("internalid"),
                    values: {
                        "custrecord_lmry_ar_ws_resumen_estado": "Finalizado",
                        "custrecord_lmry_ar_ws_resumen_descrip": "Error durante el proceso"
                    },

                });
            });
        }
        let mensaje = "";
        try {
            let scriptObj = runtime.getCurrentScript();
            let period = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_period'
            }); //period
            let contador = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_contador'
            }); //contador
            let entity = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_entity'
            }); //entity (vendor inicialemnte)
            let subsidiary = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_subsidiary'
            }); //subsidiary
            let contadorExito = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_contador_exito'
            }); //contador exito
            let contadorError1 = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_contador_error1'
            }); //contador error1
            let contadorError2 = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_contador_error2'
            }); //contador error2
            let contadorError3 = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_contador_error3'
            }); //contador error3
            let contadorError4 = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_contador_error4'
            }); //contador error4
            let descError1 = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_desc_error1'
            }); //descripcion error1
            let descError2 = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_desc_error2'
            }); //descripcion error2
            let descError3 = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_desc_error3'
            }); //descripcion error3
            let descError4 = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_desc_error4'
            }); //descripcion error4
            let contadorOmit = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_contador_omit'
            }); //contador error4
            let descOmit = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_desc_omit'
            }); //descripcion error1
            let contadorVacio = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_contador_vacio'
            }); //contador error4
            let descVacio = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_desc_vacio'
            }); //descripcion error1
            let flag = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_flag'
            }); //rellamado de delay
            let flagEntity = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_flag_e'
            }); //rellamado tipo entidad filtro
            let juridicPerson = scriptObj.getParameter({
                name: 'custscript_lmry_ar_ws_juridic_p'
            }); //rellamado tipo persona juridica
            let idEntityError = scriptObj.getParameter({
                name: "custscript_lmry_ar_ws_id_entity"
            });
            mensaje = libARBA.generarXMLConsultaMasiva(
                period,
                contador,
                entity,
                subsidiary,
                contadorExito,
                contadorError1,
                contadorError2,
                contadorError3,
                contadorError4,
                descError1,
                descError2,
                descError3,
                descError4,
                contadorOmit,
                descOmit,
                contadorVacio,
                descVacio,
                flag,
                flagEntity,
                juridicPerson,
                idEntityError
            );
        }
        catch (err) {
            log.error('ERROR', err);
            mensaje = 'No se crearon CCL';
            updateLog();
        }
        log.error('SalidaFinal', mensaje);
        return mensaje;
    };
    exports.execute = execute;
});
