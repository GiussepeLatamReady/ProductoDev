/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_ARBAWebServiceLBRY_V2.1.js                  ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Set 09 2022  LatamReady    Use Script 2.1           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

define(["require", "exports", "N/email", "N/file", "N/format", "N/http", "N/log", "N/record", "N/runtime", "N/search", "N/task", "./LMRY_AR_MD5_encript_LBRY_V2.0"],
    function (_require, exports, email, file, format, http, log, record, runtime, search, task, libraryMD5) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.generarXMLConsultaMasiva = void 0;


        let urlImage = 'https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=921&c=TSTDRV1038915&h=c493217843d184e7f054';
        let urlImage2 = 'https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=923&c=TSTDRV1038915&h=3c7406d759735a1e791d';
        let urlImage3 = 'https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=924&c=TSTDRV1038915&h=c135e74bcb8d5e1ac356';
        let urlImage4 = 'https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=919&c=TSTDRV1038915&h=9c937774d04fb76747f7';
        let urlImage5 = 'https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=928&c=TSTDRV1038915&h=fc69b39a8e7210c65984';
        let urlImage6 = 'https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=926&c=TSTDRV1038915&h=e14f0c301f279780eb38';
        let urlImage7 = 'https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=925&c=TSTDRV1038915&h=41ec53b63dba135488be';
        let urlImage8 = 'https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=920&c=TSTDRV1038915&h=7fb4d03fff9283e55318';
        let urlImage9 = 'https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=929&c=TSTDRV1038915&h=300c376863035d25c42a';
        let urlImage10 = 'https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=918&c=TSTDRV1038915&h=7f0198f888bdbb495497';
        let urlImageTwt = 'https://twitter.com/LatamReady';
        let urlImageFb = 'https://www.facebook.com/LatamReady-337412836443120/';
        let urlImageLinkedin = 'https://www.linkedin.com/company/9207808';

        let otherIDSave;

        let totalBase = 0;
        let types = {};
        types[file.Type.XMLDOC] = 'text/xml';

        /**
         * Funcion para definir el content type del archivo a enviar al ws
         * @param {object} f Archivo
         * @returns Content type del archivo a enviar al ws
         */
        function getContentType(f) {

            let mime = types[f.fileType];
            let charset = f.encoding;
            let ct = 'Content-Type: ' + mime + (charset ? ';charset=' + charset : '');
            return ct;
        }
        /**
         * Funcion de validacion para revisar si existe o no el archivo
         * @param {any} o Objecto del archivo
         * @returns Estado de si existe o no el archivo
         */
        function isFile(o) {
            return (typeof o == 'object' && typeof o.fileType != 'undefined');
        }
        /**
         * Funcion de creacion y subida de archivo multipart al ws
         * @param {string} url     ruta de envio
         * @param {object} headers llave valor, incluye el Auth
         * @param {array} parts   arreglo con las partes a enviar
         * @returns Respuesta del ws
         */
        function uploadParts(url, headers, parts) {
            let boundary = 'Separator';
            headers['content-type'] = 'multipart/form-data; boundary=' + boundary;
            // Body
            let body = [];
            parts.forEach(function (p, idx) {
                let partIsFile = isFile(p.value);
                body.push('--' + boundary);
                body.push('Content-Disposition: form-data; name="' + p.name + '"' + (partIsFile ? ('; filename="' + p.value.name + '"') : ''));
                if (partIsFile) {
                    body.push(getContentType(p.value));
                }
                body.push('');
                body.push(partIsFile ? p.value.getContents() : p.value);
                if (idx == parts.length - 1) {
                    body.push('--' + boundary + '--');
                    body.push('');
                }
            });
            // Submit Request
            try {

                let response = http.post({
                    url: url,
                    headers: headers,
                    body: body.join('\r\n')
                });
                return response;
            }
            catch (e) {
                log.error({
                    title: 'Failed to submit file',
                    details: (e.message || e.toString()) + (e.getStackTrace ? (' \n \n' + e.getStackTrace().join(' \n')) : '')
                });
                return 'Fallo';
            }
        }
        /**
         * 
         * @param {number} period Id del periodo
         * @param {number} cuit Numero de registro del contribuyente + Digito Verificador
         * @param {boolean} detalle bandera para indicar si existe o no detalle
         * @param {number} entityID id de la entidad relacionada
         * @param {number} subsidiary id de la subsidiaria
         * @returns Mensaje de culminacion del proceso de consulta sea satisfactorio o erroneo
         */
        function generarXMLConsulta(period, cuit, detalle, entityID, subsidiary) {
            let mensaje = '';
            try {
                let fechas = getPeriodo(period).split(',');

                let fdesde = fechas[0];
                let fhasta = fechas[1];

                let body = '';
                body += '<?xml version = "1.0" encoding = "ISO-8859-1"?>';
                body += '<CONSULTA-ALICUOTA>';
                body += '<fechaDesde>' + fdesde + '</fechaDesde>';
                body += '<fechaHasta>' + fhasta + '</fechaHasta>';
                body += '<cantidadContribuyentes>1</cantidadContribuyentes>';
                body += '<contribuyentes class="list">';
                body += '<contribuyente>';
                body += '<cuitContribuyente>' + cuit + '</cuitContribuyente>';
                body += '</contribuyente>';
                body += '</contribuyentes>';
                body += '</CONSULTA-ALICUOTA>';
                let fileObj = file.create({
                    name: 'DFEServicioConsulta.xml',
                    fileType: file.Type.XMLDOC,
                    contents: body,
                    description: 'This xml file',
                    encoding: file.Encoding.UTF_8
                });
                let md5 = libraryMD5.encrypt(fileObj.getContents());
                let tam = fileObj.name.length;
                let nombre = fileObj.name.substring(0, tam - 4);
                fileObj.name = nombre + '_' + md5 + '.xml';

                let user = runtime.getCurrentScript().getParameter({
                    name: 'custscript_lmry_ar_ws_user'
                });
                let password = runtime.getCurrentScript().getParameter({
                    name: 'custscript_lmry_ar_ws_password'
                });
                let files = [{
                    name: 'user',
                    value: user
                },
                {
                    name: 'password',
                    value: password
                },
                {
                    name: 'file',
                    value: fileObj
                }
                ];
                let resp = uploadParts('http://dfe.arba.gov.ar/DomicilioElectronico/SeguridadCliente/dfeServicioConsulta.do', {}, files);
                if (resp == 'Fallo') {
                    return '- Error al intentar conectar con el web service con el XML multipart<br>';
                }
                mensaje = ObtenerDatos(resp.body, cuit, detalle, entityID, subsidiary, period);

                return mensaje;
            }
            catch (err) {
                log.error('ERROR generarXMLConsulta', err);
                mensaje = '- Error al intentar conectar con el web service<br>';
                return mensaje;
            }
        }
        /**
         * Funcion de busqueda del periodo
         * @param {number} period Id de l periodo a buscar
         * @returns Cadena con el nombre del periodo
         */
        function getPeriodo(period) {
            let name1 = '';
            let name2 = '';
            let datosSearch = search.create({
                type: "accountingperiod",
                filters: [
                    ["isadjust", "is", "F"],
                    "AND",
                    ["isquarter", "is", "F"],
                    "AND",
                    ["isinactive", "is", "F"],
                    "AND",
                    ["isyear", "is", "F"],
                    "AND",
                    ["closed", "is", "F"],
                    "AND",
                    ["alllocked", "is", "F"],
                    "AND",
                    ["internalid", "is", period]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        sort: search.Sort.DESC,
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "periodname",
                        label: "Name"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "TO_CHAR({startdate},'YYYYMMDD')",
                        label: "StartDate"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "TO_CHAR({enddate},'YYYYMMDD')",
                        label: "EndDate"
                    })
                ]
            });
            let datosSearch2 = datosSearch.run().getRange({ start: 0, end: 10 });
            if (datosSearch2.length > 0) {
                let columns = datosSearch2[0].columns;
                name1 = datosSearch2[0].getValue(columns[2]).toString();
                name2 = datosSearch2[0].getValue(columns[3]).toString();
            }
            let cadena = name1 + ',' + name2;
            return cadena;
        }

        function getPeriodFormat(period) {
            let periodformat;
            let datosSearch = search.create({
                type: "accountingperiod",
                filters: [
                    ["isadjust", "is", "F"], "AND",
                    ["isquarter", "is", "F"], "AND",
                    ["isinactive", "is", "F"], "AND",
                    ["isyear", "is", "F"], "AND",
                    ["closed", "is", "F"], "AND",
                    ["alllocked", "is", "F"], "AND",
                    ["internalid", "is", period]
                ],
                columns: [
                    search.createColumn({
                        name: "formulatext",
                        formula: "TO_CHAR({startdate},'MMYYYY')",
                        label: "StartDate"
                    })
                ]
            });
            let datosSearch2 = datosSearch.run().getRange({ start: 0, end: 10 });
            if (datosSearch2.length > 0) {
                let columns = datosSearch2[0].columns;
                periodformat = datosSearch2[0].getValue(columns[0]);
            }
            return periodformat;
        }
        /**
         * Funcion de actualizacion de datos de la consulta realizada
         * @param {string} xmlText Texto xml de respuesta del ws
         * @param {number} cuit numero de registro del contribuyente
         * @param {boolean} detalle bandera de existencia o no de detalle
         * @param {number} entityID Id de la entidad relacionada
         * @param {number} subsidiary Id de la subsidiaria
         * @param {number} period id del periodo
         * @returns Mensaje de culminacion del proceso de actualizacion de datos
         */

        function getDataPadron() {
            let auxBody = { "period": '102025', "cuits": ['20005810788'], "type": 'P' }
            auxBody = JSON.stringify(auxBody)
            let responsePadron = http.post({
                body: auxBody,
                url: "http://149.130.171.192:3000/padron/Arba",
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "lmry-account": runtime.accountId,
                    "Content-Type": "application/json"
                }
            });
            let response = JSON.parse(responsePadron.body)
            console.log("response:", response)
        }
        function ObtenerDatos(xmlText, cuit, detalle, entityID, subsidiary, period) {
            let exit = false;
            let TextXML = xmlText;
            let indice = 0;
            let grabado = '';
            while (!exit) {
                TextXML = TextXML.replace('</', '<');
                indice = TextXML.indexOf('</');
                if (indice == -1) {
                    exit = true;
                }
            }

            let contribuyente = TextXML.split('<contribuyente>');
            let typeEntity = search.lookupFields({
                type: 'entity',
                id: entityID,
                columns: ['type']
            });
            let typeEntityPrev = typeEntity.type[0].value == 'CustJob' ? 2 : 1;
            let datosDefault = obtenerSetup(subsidiary, typeEntityPrev);
            if (contribuyente.length == 1) {
                if (TextXML.indexOf('500 Internal Server Error') != -1) {
                    return 'Internal Server';
                }
                let tipoError = TextXML.split('<tipoError>')[1];
                let mensajeError = TextXML.split('<mensajeError>')[1];
                exit = false;
                indice = 0;
                while (!exit) {
                    mensajeError = mensajeError.replace(']', '[');
                    indice = mensajeError.indexOf(']');
                    if (indice == -1) {
                        exit = true;
                    }
                }
                let cadena = mensajeError.split('[');
                let cont = cadena.length;
                cont = (cont - 1) / 2;
                let mensajeErrorFinal = cadena[cont];
                if (mensajeErrorFinal.indexOf('La CUIT ingresada no se encuentra en ningun padron') != -1) {
                    if (datosDefault.length > 0) {
                        let fechas = getPeriodo(period).split(',');
                        let fdesde = fechas[0];
                        let fhasta = fechas[1];
                        // @ts-ignore
                        fdesde = generarFecha(fdesde.substring(0, 4), fdesde.substring(4, 6), fdesde.substring(6, 8));
                        // @ts-ignore
                        fhasta = generarFecha(fhasta.substring(0, 4), fhasta.substring(4, 6), fhasta.substring(6, 8));
                        let aplica = datosDefault[0].getValue('custrecord_lmry_ar_ws_default_cc');
                        let percent = datosDefault[0].getValue('custrecord_lmry_ar_ws_default_percent');
                        if (aplica) {
                            grabado += createContributoryClass(entityID, 1, 'WS-NEP', percent, fdesde, fhasta, detalle, subsidiary, period, datosDefault);
                            if (grabado == '') {
                                grabado = '- CUIT: ' + cuit + ', Tipo de Error: CCL Vacio<br>';
                            }
                            return grabado;
                        }
                        else {
                            createLogDetalle(detalle, subsidiary, entityID, period, tipoError, mensajeErrorFinal);
                            return '- CUIT: ' + cuit + ', Tipo de Error: ' + tipoError + ', Mensaje de Error: ' + mensajeErrorFinal + '<br>';
                        }
                    }
                    else {
                        return '- No hay Setup Fallo<br>';
                    }
                    //}
                }
                else {
                    if ((mensajeErrorFinal.indexOf('fechaDesde') != -1) || (mensajeErrorFinal.indexOf('No se encontró ningún padrón consultando con las fechas') != -1)) {
                        mensajeErrorFinal = 'El periodo es inválido o inexistente';
                    }
                    createLogDetalle(detalle, subsidiary, entityID, period, tipoError, mensajeErrorFinal);
                    return '- CUIT: ' + cuit + ', Tipo de Error: ' + tipoError + ', Mensaje de Error: ' + mensajeErrorFinal + '<br>';
                }
            }
            let fechaDesdeList = TextXML.split('<fechaDesde>');
            let fechaHastaList = TextXML.split('<fechaHasta>');
            let fechaDesde = fechaDesdeList[1];
            let fechaHasta = fechaHastaList[1];
            // @ts-ignore
            fechaDesde = generarFecha(fechaDesde.substring(0, 4), fechaDesde.substring(4, 6), fechaDesde.substring(6, 8));
            // @ts-ignore
            fechaHasta = generarFecha(fechaHasta.substring(0, 4), fechaHasta.substring(4, 6), fechaHasta.substring(6, 8));
            let alicuotaPercepcion = contribuyente[1].split('<alicuotaPercepcion>')[1];
            let alicuotaRetencion = contribuyente[1].split('<alicuotaRetencion>')[1];
            let grupoPercepcion = contribuyente[1].split('<grupoPercepcion>')[1];
            let grupoRetencion = contribuyente[1].split('<grupoRetencion>')[1];
            if (typeEntity.type[0].value == 'CustJob') {
                if (grupoPercepcion != '') {
                    let parseAlicuotaPercepcion = alicuotaPercepcion.replace(',', '');
                    // @ts-ignore
                    parseAlicuotaPercepcion = parseFloat(parseAlicuotaPercepcion) / 100;
                    grabado += createContributoryClass(entityID, 2, grupoPercepcion, parseAlicuotaPercepcion, fechaDesde, fechaHasta, detalle, subsidiary, period, datosDefault);
                }
            }
            else {
                if (grupoRetencion != '') {
                    let parseAlicuotaRetencion = alicuotaRetencion.replace(',', '');
                    // @ts-ignore
                    parseAlicuotaRetencion = parseFloat(parseAlicuotaRetencion) / 100;
                    grabado += createContributoryClass(entityID, 1, grupoRetencion, parseAlicuotaRetencion, fechaDesde, fechaHasta, detalle, subsidiary, period, datosDefault);
                }
            }
            if (grabado == '') {
                if (datosDefault.length > 0) {
                    let fechas = getPeriodo(period).split(',');
                    let fdesde = fechas[0];
                    let fhasta = fechas[1];
                    // @ts-ignore
                    fdesde = generarFecha(fdesde.substring(0, 4), fdesde.substring(4, 6), fdesde.substring(6, 8));
                    // @ts-ignore
                    fhasta = generarFecha(fhasta.substring(0, 4), fhasta.substring(4, 6), fhasta.substring(6, 8));
                    let aplica = datosDefault[0].getValue('custrecord_lmry_ar_ws_default_cc');
                    let percent = datosDefault[0].getValue('custrecord_lmry_ar_ws_default_percent').toString();
                    if (aplica) {
                        grabado += createContributoryClass(entityID, typeEntityPrev, 'WS-NEP', parseFloat(percent), fdesde, fhasta, detalle, subsidiary, period, datosDefault);
                        if (grabado == '') {
                            grabado = '- CUIT: ' + cuit + ', Tipo de Error: CCL Vacio<br>';
                        }
                        // log.error('grabado', grabado);
                        return grabado;
                    }
                    else {
                        createLogDetalle(detalle, subsidiary, entityID, period, 'CCL Vacio', 'La entidad no tiene Clases contributivas');
                        return '- CUIT: ' + cuit + ', Tipo de Error: CCL Vacio<br>';
                    }
                }
                else {
                    return '- No hay Setup Fallo<br>';
                }
            }

            return grabado;
        }
        /**
         * 
         * @param {*} entityID 
         * @param {*} taxtype 
         * @param {*} grupo 
         * @param {*} alicuota 
         * @param {*} fechaDesde 
         * @param {*} fechaHasta 
         * @param {*} detalle 
         * @param {*} Subsi 
         * @param {*} period 
         * @param {*} datosDefault 
         * @returns 
         */
        function createContributoryClass(entityID, taxtype, grupo, alicuota, fechaDesde, fechaHasta, detalle, Subsi, period, datosDefault) {
            let aviso = '';
            let taxtypeText = '';
            if (taxtype == 1) {
                taxtypeText = 'Retencion';
            }
            else {
                taxtypeText = 'Percepcion';
            }
            let recordObj = null;
            if (Subsi == 0) {
                let entitySubsi = search.lookupFields({
                    type: 'entity',
                    id: entityID,
                    columns: ['subsidiary']
                });
                if (entitySubsi != null && entitySubsi != '') {
                    Subsi = entitySubsi.subsidiary[0].value;
                }
            }
            let entityType;
            if (datosDefault != null && datosDefault != '') {
                let columnas = datosDefault[0].columns;
                let entityLookUpField = search.lookupFields({
                    type: 'entity',
                    id: entityID,
                    columns: ['type']
                });
                entityType = entityLookUpField.type[0].text;
                let filters = new Array();
                filters[0] = search.createFilter({
                    name: 'custrecord_lmry_ar_ccl_entity',
                    operator: search.Operator.IS,
                    values: entityID
                });
                filters[1] = search.createFilter({
                    name: 'custrecord_lmry_ar_ccl_nroarba',
                    operator: search.Operator.IS,
                    values: grupo
                });
                filters[2] = search.createFilter({
                    name: 'custrecord_lmry_ccl_taxtype',
                    operator: search.Operator.IS,
                    values: datosDefault[0].getValue(columnas[10])
                });
                filters[3] = search.createFilter({
                    name: 'custrecord_lmry_ar_ccl_fechdesd',
                    operator: search.Operator.ON,
                    values: format.format({
                        value: fechaDesde,
                        type: format.Type.DATE
                    })
                });
                filters[4] = search.createFilter({
                    name: 'custrecord_lmry_ar_ccl_fechhast',
                    operator: search.Operator.ON,
                    values: format.format({
                        value: fechaHasta,
                        type: format.Type.DATE
                    })
                });
                filters[5] = search.createFilter({
                    name: 'custrecord_lmry_ar_ccl_subsidiary',
                    operator: search.Operator.IS,
                    values: Subsi
                });
                let searchCCL = search.create({
                    type: 'customrecord_lmry_ar_contrib_class',
                    columns: ['internalid'],
                    filters: filters
                });
                let searchCCL2 = searchCCL.run().getRange({ start: 0, end: 10 });
                if (searchCCL2.length > 0) {
                    recordObj = record.load({
                        type: 'customrecord_lmry_ar_contrib_class',
                        id: searchCCL2[0].getValue('internalid')
                    });
                    aviso = 'Edit ';
                    if (alicuota == 0) {
                        /*recordObj.setValue({logObj
                            fieldId: 'isinactive',
                            value: true
                        });*/
                        recordObj.setValue({
                            fieldId: 'custrecord_lmry_ar_ccl_taxrate_pctge',
                            value: 0
                        });
                        recordObj.setValue({
                            fieldId: 'custrecord_lmry_ar_ccl_taxrate',
                            value: 0
                        });
                    }
                    else {
                        seteoDatosCCL(recordObj, entityID, datosDefault, alicuota, grupo, fechaDesde, fechaHasta, Subsi);
                    }
                }
                else {
                    if (alicuota >= 0) {
                        recordObj = record.create({
                            type: 'customrecord_lmry_ar_contrib_class'
                        });
                        aviso = 'Create ';
                        seteoDatosCCL(recordObj, entityID, datosDefault, alicuota, grupo, fechaDesde, fechaHasta, Subsi);
                    }
                    else {
                        let aplica = datosDefault[0].getValue('custrecord_lmry_ar_ws_default_cc');
                        if (aplica) {
                            recordObj = record.create({
                                type: 'customrecord_lmry_ar_contrib_class'
                            });
                            aviso = 'Create ';
                            seteoDatosCCL(recordObj, entityID, datosDefault, 0, grupo, fechaDesde, fechaHasta, Subsi);
                        }
                        else {
                            return '- CCL Omitida ' + entityType + ' ' + entityID + ' ' + taxtypeText + '<br>';
                        }
                    }
                }
                let IDSave = recordObj.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                if (detalle) {
                    let logObj = record.create({
                        type: 'customrecord_lmry_ar_ws_log',
                        isDynamic: true
                    });
                    logObj.setValue({
                        fieldId: 'custrecord_lmry_ar_ws_subsidiary',
                        value: Subsi
                    });
                    logObj.setValue({
                        fieldId: 'custrecord_lmry_ar_ws_period',
                        value: period
                    });
                    logObj.setValue({
                        fieldId: 'custrecord_lmry_ar_ws_user',
                        value: runtime.getCurrentUser().id
                    });
                    logObj.setValue({
                        fieldId: 'custrecord_lmry_ar_ws_entity',
                        value: entityID
                    });
                    if (taxtype == 2) {
                        logObj.setValue({
                            fieldId: 'custrecord_lmry_ar_ws_percepcion',
                            value: IDSave
                        });
                    }
                    else {
                        logObj.setValue({
                            fieldId: 'custrecord_lmry_ar_ws_retencion',
                            value: IDSave
                        });
                    }
                    logObj.setValue({
                        fieldId: 'custrecord_lmry_ar_ws_descripcion',
                        value: 'Generado correctamente'
                    });
                    otherIDSave = logObj.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                }
                return '- CCL ' + aviso + entityType + ' ' + entityID + ' ' + taxtypeText +
                    ' <a href="https://' + runtime.getCurrentScript().getParameter({
                        name: 'custscript_lmry_netsuite_location'
                    }) +
                    '/app/common/custom/custrecordentry.nl?rectype=' + runtime.getCurrentScript().getParameter({
                        name: 'custscript_lmry_wht_details_id_record'
                    }) + '&id=' + IDSave + '">' + IDSave + '</a><br>';
            }
            if (entityType == undefined || entityType == 'undefined') {
            }
            return 'CCL ' + entityType + ' ' + taxtypeText + ' Fallo' + '<br>';
        }
        /**
         * 
         * @param {*} recordObj 
         * @param {*} entityID 
         * @param {*} datosDefault 
         * @param {*} alicuota 
         * @param {*} grupo 
         * @param {*} fechaDesde 
         * @param {*} fechaHasta 
         * @param {*} Subsi 
         */
        function seteoDatosCCL(recordObj, entityID, datosDefault, alicuota, grupo, fechaDesde, fechaHasta, Subsi) {
            let columnas = datosDefault[0].columns;
            recordObj.setValue({
                fieldId: 'custrecord_lmry_ar_ccl_subsidiary',
                value: Subsi
            });
            recordObj.setValue({
                fieldId: 'custrecord_lmry_ar_ccl_entity',
                value: entityID
            });
            if (datosDefault[0].getValue(columnas[10]) != null && datosDefault[0].getValue(columnas[10]) != '' && datosDefault[0].getValue(columnas[10]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_taxtype',
                    value: datosDefault[0].getValue(columnas[10])
                });
            }
            if (datosDefault[0].getValue(columnas[0]) != null && datosDefault[0].getValue(columnas[0]) != '' && datosDefault[0].getValue(columnas[0]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_appliesto',
                    value: datosDefault[0].getValue(columnas[0])
                });
            }
            if (datosDefault[0].getValue(columnas[9]) != null && datosDefault[0].getValue(columnas[9]) != '' && datosDefault[0].getValue(columnas[9]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_transactiontypes',
                    value: datosDefault[0].getValue(columnas[9]).split(',')
                });
            }
            if (datosDefault[0].getValue(columnas[11]) != null && datosDefault[0].getValue(columnas[11]) != '' && datosDefault[0].getValue(columnas[11]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ccl_taxitem',
                    value: datosDefault[0].getValue(columnas[11])
                });
            }
            recordObj.setValue({
                fieldId: 'custrecord_lmry_ar_ccl_taxrate_pctge',
                value: parseFloat(alicuota)
            });
            recordObj.setValue({
                fieldId: 'custrecord_lmry_ar_ccl_taxrate',
                value: parseFloat(alicuota) / 100
            });
            recordObj.setValue({
                fieldId: 'custrecord_lmry_ar_ccl_fechdesd',
                value: fechaDesde
            });
            recordObj.setValue({
                fieldId: 'custrecord_lmry_ar_ccl_fechhast',
                value: fechaHasta
            });
            recordObj.setValue({
                fieldId: 'custrecord_lmry_ar_ccl_fechpubl',
                value: fechaDesde
            });
            if (datosDefault[0].getValue(columnas[2]) != null && datosDefault[0].getValue(columnas[2]) != '' && datosDefault[0].getValue(columnas[2]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_addratio',
                    value: datosDefault[0].getValue(columnas[2])
                });
            }
            if (datosDefault[0].getValue(columnas[13]) != null && datosDefault[0].getValue(columnas[13]) != '' && datosDefault[0].getValue(columnas[13]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ccl_taxcode',
                    value: datosDefault[0].getValue(columnas[13])
                });
            }
            if (datosDefault[0].getValue(columnas[1]) != null && datosDefault[0].getValue(columnas[1]) != '' && datosDefault[0].getValue(columnas[1]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_amount',
                    value: datosDefault[0].getValue(columnas[1])
                });
            }
            if (datosDefault[0].getValue(columnas[3]) != null && datosDefault[0].getValue(columnas[3]) != '' && datosDefault[0].getValue(columnas[3]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_sub_type',
                    value: datosDefault[0].getValue(columnas[3])
                });
            }
            if (datosDefault[0].getValue(columnas[4]) != null && datosDefault[0].getValue(columnas[4]) != '' && datosDefault[0].getValue(columnas[4]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ccl_subtype',
                    value: datosDefault[0].getValue(columnas[4])
                });
            }
            if (datosDefault[0].getValue(columnas[5]) != null && datosDefault[0].getValue(columnas[5]) != '' && datosDefault[0].getValue(columnas[5]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ccl_jurisdib',
                    value: datosDefault[0].getValue(columnas[5])
                });
            }
            if (datosDefault[0].getValue(columnas[19]) != null && datosDefault[0].getValue(columnas[19]) != '' && datosDefault[0].getValue(columnas[19]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_vatincluded',
                    value: datosDefault[0].getValue(columnas[19])
                });
            }
            if (datosDefault[0].getValue(columnas[20]) != null && datosDefault[0].getValue(columnas[20]) != '' && datosDefault[0].getValue(columnas[20]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_minamount',
                    value: datosDefault[0].getValue(columnas[20])
                });
            }
            if (datosDefault[0].getValue(columnas[21]) != null && datosDefault[0].getValue(columnas[21]) != '' && datosDefault[0].getValue(columnas[21]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_maxamount',
                    value: datosDefault[0].getValue(columnas[21])
                });
            }
            if (datosDefault[0].getValue(columnas[22]) != null && datosDefault[0].getValue(columnas[22]) != '' && datosDefault[0].getValue(columnas[22]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_montaccum',
                    value: datosDefault[0].getValue(columnas[22])
                });
            }
            if (datosDefault[0].getValue(columnas[23]) != null && datosDefault[0].getValue(columnas[23]) != '' && datosDefault[0].getValue(columnas[23]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_set_baseretention',
                    value: datosDefault[0].getValue(columnas[23])
                });
            }
            if (datosDefault[0].getValue(columnas[24]) != null && datosDefault[0].getValue(columnas[24]) != '' && datosDefault[0].getValue(columnas[24]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_accandmin_with',
                    value: datosDefault[0].getValue(columnas[24])
                });
            }
            if (datosDefault[0].getValue(columnas[25]) != null && datosDefault[0].getValue(columnas[25]) != '' && datosDefault[0].getValue(columnas[25]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_base_amount',
                    value: datosDefault[0].getValue(columnas[25])
                });
            }
            if (datosDefault[0].getValue(columnas[8]) != null && datosDefault[0].getValue(columnas[8]) != '' && datosDefault[0].getValue(columnas[8]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_gen_transaction',
                    value: datosDefault[0].getValue(columnas[8])
                });
            }
            if (datosDefault[0].getValue(columnas[6]) != null && datosDefault[0].getValue(columnas[6]) != '' && datosDefault[0].getValue(columnas[6]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_applies_to_item',
                    value: datosDefault[0].getValue(columnas[6])
                });
            }
            if (datosDefault[0].getValue(columnas[7]) != null && datosDefault[0].getValue(columnas[7]) != '' && datosDefault[0].getValue(columnas[7]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_applies_to_account',
                    value: datosDefault[0].getValue(columnas[7])
                });
            }
            if (datosDefault[0].getValue(columnas[17]) != null && datosDefault[0].getValue(columnas[17]) != '' && datosDefault[0].getValue(columnas[17]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_br_ccl_account1',
                    value: datosDefault[0].getValue(columnas[17])
                });
            }
            if (datosDefault[0].getValue(columnas[18]) != null && datosDefault[0].getValue(columnas[18]) != '' && datosDefault[0].getValue(columnas[18]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_br_ccl_account2',
                    value: datosDefault[0].getValue(columnas[18])
                });
            }
            if (datosDefault[0].getValue(columnas[28]) != null && datosDefault[0].getValue(columnas[28]) != '' && datosDefault[0].getValue(columnas[28]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ccl_convmult',
                    value: datosDefault[0].getValue(columnas[28])
                });
            }
            if (datosDefault[0].getValue(columnas[29]) != null && datosDefault[0].getValue(columnas[29]) != '' && datosDefault[0].getValue(columnas[29]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ccl_resptype',
                    value: datosDefault[0].getValue(columnas[29])
                });
            }
            if (datosDefault[0].getValue(columnas[12]) != null && datosDefault[0].getValue(columnas[12]) != '' && datosDefault[0].getValue(columnas[12]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ar_normas_iibb',
                    value: datosDefault[0].getValue(columnas[12])
                });
            }
            if (datosDefault[0].getValue(columnas[26]) != null && datosDefault[0].getValue(columnas[26]) != '' && datosDefault[0].getValue(columnas[26]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_not_taxable_minimum',
                    value: datosDefault[0].getValue(columnas[26])
                });
            }
            if (datosDefault[0].getValue(columnas[27]) != null && datosDefault[0].getValue(columnas[27]) != '' && datosDefault[0].getValue(columnas[27]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_fiscal_doctype',
                    value: datosDefault[0].getValue(columnas[27])
                });
            }
            if (datosDefault[0].getValue(columnas[30]) != null && datosDefault[0].getValue(columnas[30]) != '' && datosDefault[0].getValue(columnas[30]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ccl_arba_padron',
                    value: datosDefault[0].getValue(columnas[30])
                });
            }
            recordObj.setValue({
                fieldId: 'custrecord_lmry_ar_ccl_nroarba',
                value: grupo
            });
            if (datosDefault[0].getValue(columnas[14]) != null && datosDefault[0].getValue(columnas[14]) != '') {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ccl_department',
                    value: datosDefault[0].getValue(columnas[14])
                });
            }
            if (datosDefault[0].getValue(columnas[15]) != null && datosDefault[0].getValue(columnas[15]) != '') {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ccl_class',
                    value: datosDefault[0].getValue(columnas[15])
                });
            }
            if (datosDefault[0].getValue(columnas[16]) != null && datosDefault[0].getValue(columnas[16]) != '') {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ccl_location',
                    value: datosDefault[0].getValue(columnas[16])
                });
            }
            recordObj.setValue({
                fieldId: 'custrecord_lmry_ccl_new_logic',
                value: datosDefault[0].getValue(columnas[33])
            });
            if (datosDefault[0].getValue(columnas[34]) != null && datosDefault[0].getValue(columnas[34]) != '' && datosDefault[0].getValue(columnas[34]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_taxcode_group',
                    value: datosDefault[0].getValue(columnas[34])
                });
            }
            if (datosDefault[0].getValue(columnas[35]) != null && datosDefault[0].getValue(columnas[35]) != '' && datosDefault[0].getValue(columnas[35]) != 0) {
                recordObj.setValue({
                    fieldId: 'custrecord_lmry_ccl_add_accumulated',
                    value: datosDefault[0].getValue(columnas[35])
                });
            }
        }
        /**
         * 
         * @param {*} period 
         * @param {*} contadorGeneral 
         * @param {*} entityType 
         * @param {*} subsidiary 
         * @param {*} contadorExito 
         * @param {*} contadorError1 
         * @param {*} contadorError2 
         * @param {*} contadorError3 
         * @param {*} contadorError4 
         * @param {*} descError1 
         * @param {*} descError2 
         * @param {*} descError3 
         * @param {*} descError4 
         * @param {*} contadorOmit 
         * @param {*} descOmit 
         * @param {*} contadorVacio 
         * @param {*} descVacio 
         * @param {*} flag 
         * @param {*} flagEntity 
         * @param {*} juridicPerson 
         * @param {*} entityIDBase 
         * @returns 
         */
        let generarXMLConsultaMasiva = function generarXMLConsultaMasiva(
            period,
            contadorGeneral,
            entityType,
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
            entityIDBase) {
            let salida = '';
            let detalle = false;
            let vendorList = [];
            let customerList = [];
            let searchLog = search.create({
                type: 'customrecord_lmry_ar_ws_log_resumen',
                columns: ['internalid'],
                filters: ['custrecord_lmry_ar_ws_resumen_estado', 'contains', 'Procesando']
            });
            let searchLog2 = searchLog.run().getRange({ start: 0, end: 10 });

            let logObj = record.load({
                type: 'customrecord_lmry_ar_ws_log_resumen',
                id: searchLog2[0].getValue('internalid')
            });
            const filters = logObj.getValue("custrecord_lmry_ar_ws_resumen_filt").split('|');
            flagEntity == null ? flagEntity = 0 : flagEntity = flagEntity;
            if (entityType == 1 && (flagEntity == 0 || flagEntity == 2)) {
                vendorList = cargarEntity("vendor", subsidiary, juridicPerson, entityIDBase, filters[2], filters[3]);
            }
            else if (entityType != 1 && (flagEntity == 0 || flagEntity == 1)) {
                customerList = cargarEntity("customer", subsidiary, juridicPerson, entityIDBase, filters[2], filters[3]);
            }

            let mensaje = '';
            let cond = false;
            let datosDefault = obtenerSetup(subsidiary, entityType);
            let feature_ws_osci = datosDefault[0].getValue('custrecord_lmry_ar_ws_osci_arba');
            feature_ws_osci = feature_ws_osci === "T" || feature_ws_osci === true ? true: false;
            if (entityType == 1) {

                try {
                    if (vendorList.length > 0) {
                        cond = false;

                        // if (vendorList.length > entityIDBase + numRellamado) {
                        //     salidaFor = entityIDBase + numRellamado;
                        //     cond = true;
                        // }
                        // else if (vendorList.length == entityIDBase + numRellamado) {
                        //     salidaFor = entityIDBase + numRellamado;
                        //     entityType = 2;
                        // }
                        // else {
                        //     salidaFor = vendorList.length;
                        //     entityType = 2;
                        // }

                        if (feature_ws_osci) {
                            const validCuits = vendorList.reduce((acc, vendor) => {
                                const vat = vendor.getValue('vatregnumber') || '';
                                const dv = vendor.getValue('custentity_lmry_digito_verificator') || '';
                                const cuit = vat + dv;
                                if (validaCUIT(cuit)) acc.push(cuit);
                                return acc;
                            }, []);
                            const periodFormat = getPeriodFormat(period);
                            const alicuotasByCuit = getAlicuotasByCUIT(validCuits, periodFormat, "R");
                            let apply = datosDefault[0].getValue('custrecord_lmry_ar_ws_default_cc');
                            let percent = datosDefault[0].getValue('custrecord_lmry_ar_ws_default_percent');
                            let fechas = getPeriodo(period).split(',');
                            let fdesde = fechas[0];
                            let fhasta = fechas[1];
                            fdesde = generarFecha(fdesde.substring(0, 4), fdesde.substring(4, 6), fdesde.substring(6, 8));
                            fhasta = generarFecha(fhasta.substring(0, 4), fhasta.substring(4, 6), fhasta.substring(6, 8));
                            for (let i = 0; i < vendorList.length; i++) {
                                const vendor = vendorList[i];
                                const entityID = vendor.getValue('internalid');
                                const vat = vendor.getValue('vatregnumber') || '';
                                const dv = vendor.getValue('custentity_lmry_digito_verificator') || '';
                                const cuit = vat + dv;
                                if (!validaCUIT(cuit)) {
                                    contadorError2++;
                                    continue;
                                }

                                let alicuotaByEntity = alicuotasByCuit[cuit];
                                if (alicuotaByEntity) alicuotaByEntity = alicuotaByEntity[0]
                                if (alicuotaByEntity && apply) {
                                    let alicuota = parseFloat(alicuotaByEntity["alicuota"]) / 100;
                                    let grupoAlicouta = alicuotaByEntity["nro_grupo"];
                                    let fechaDesdeList = alicuotaByEntity["fecha_de_vigencia_desde"];
                                    let fechaHastaList = alicuotaByEntity["fecha_de_vigencia_hasta"];
                                    let fechaDesde = generarFecha(fechaDesdeList.substring(0, 4), fechaDesdeList.substring(5, 7), fechaDesdeList.substring(8, 10));
                                    let fechaHasta = generarFecha(fechaHastaList.substring(0, 4), fechaHastaList.substring(5, 7), fechaHastaList.substring(8, 10));

                                    salida += createContributoryClass(entityID, 1, grupoAlicouta, alicuota, fechaDesde, fechaHasta, detalle, subsidiary, period, datosDefault);
                                    contadorExito++
                                } else {
                                    if (apply) {
                                        salida += createContributoryClass(entityID, 1, 'WS-NEP', percent, fdesde, fhasta, detalle, subsidiary, period, datosDefault);
                                        contadorError3++
                                    }
                                }

                                contadorGeneral++;
                                entityIDBase = entityID;
                            }
                        }else{
                            vendorList.forEach((vendorElement) => {
                            let cuit = vendorElement.getValue('vatregnumber') + vendorElement.getValue('custentity_lmry_digito_verificator');
                            let entityID = vendorElement.getValue('internalid');
                            let valida = validaCUIT(cuit);

                            if (valida) {
                                let respuesta = generarXMLConsulta(period, cuit, detalle, entityID, subsidiary);
                                if (respuesta.indexOf('Create') != -1 || respuesta.indexOf('Edit') != -1) {
                                    contadorExito++;
                                }
                                else if (respuesta.indexOf('PREFIJO DE CUIT INVALIDO') != -1) {
                                    contadorError1++;
                                    if (descError1 == 'Vacio') {
                                        descError1 = vendorElement.getValue('internalid');
                                    }
                                    else {
                                        descError1 += ',' + vendorElement.getValue('internalid');
                                    }
                                    record.submitFields({
                                        type: "vendor",
                                        id: vendorElement.getValue('internalid'),
                                        values: {
                                            "custentity_lmry_arba_cuit_invalid": true
                                        },
                                    });
                                }
                                else if (respuesta.indexOf('NUMERO DE CUIT INVALIDO') != -1) {
                                    contadorError2++;
                                    if (descError2 == 'Vacio') {
                                        descError2 = vendorElement.getValue('internalid');
                                    }
                                    else {
                                        descError2 += ',' + vendorElement.getValue('internalid');
                                    }
                                    record.submitFields({
                                        type: "vendor",
                                        id: vendorElement.getValue('internalid'),
                                        values: {
                                            "custentity_lmry_arba_cuit_invalid": true
                                        },
                                    });


                                }
                                else if (respuesta.indexOf('La CUIT ingresada no se encuentra en ningun padron') != -1) {
                                    contadorError3++;
                                    if (descError3 == 'Vacio') {
                                        descError3 = vendorElement.getValue('internalid');
                                    }
                                    else {
                                        descError3 += ',' + vendorElement.getValue('internalid');
                                    }
                                }
                                else if (respuesta.indexOf('El usuario ingresado y / o la contraseña son inválidos.') != -1) {
                                    if (flag) {
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                            value: 'Error al conectar con la api'
                                        });
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                            value: 'Finalizado'
                                        });
                                        otherIDSave = logObj.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                        return true;
                                    }
                                    else {
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                            value: 'Error al conectar con la api - reintentando'
                                        });
                                        // logObj.setValue({
                                        //     fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                        //     value: 'Finalizado'
                                        // });
                                        flag = "T";
                                        otherIDSave = logObj.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                        totalBase = contadorExito + contadorError1 + contadorError2 + contadorError3 + contadorError4 + contadorOmit + contadorVacio;
                                        LlamarSchedule(period, contadorGeneral, entityType, subsidiary, contadorExito, contadorError1, contadorError2, contadorError3, contadorError4, descError1, descError2, descError3, descError4, contadorOmit, descOmit, contadorVacio, descVacio, vendorList, customerList, flag, flagEntity, juridicPerson, entityIDBase);
                                    }
                                }
                                else if (respuesta.indexOf('Internal Server') != -1) {
                                    if (flag) {
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                            value: 'Error Interno del Servidor'
                                        });
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                            value: 'Finalizado'
                                        });
                                        otherIDSave = logObj.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                        return true;
                                    }
                                    else {
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                            value: 'Error Interno del Servidor - reintentando'
                                        });
                                        // logObj.setValue({
                                        //     fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                        //     value: 'Finalizado'
                                        // });
                                        flag = "T";
                                        otherIDSave = logObj.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                        totalBase = contadorExito + contadorError1 + contadorError2 + contadorError3 + contadorError4 + contadorOmit + contadorVacio;
                                        LlamarSchedule(period, contadorGeneral, entityType, subsidiary, contadorExito, contadorError1, contadorError2, contadorError3, contadorError4, descError1, descError2, descError3, descError4, contadorOmit, descOmit, contadorVacio, descVacio, vendorList, customerList, flag, flagEntity, juridicPerson, entityIDBase);
                                    }
                                }
                                else if (respuesta.indexOf('Fallo') != -1) {
                                    logObj.setValue({
                                        fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                        value: 'No se ha configurado el setup'
                                    });
                                    logObj.setValue({
                                        fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                        value: 'Finalizado'
                                    });
                                    otherIDSave = logObj.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    });
                                    return true;
                                }
                                else if (respuesta.indexOf('El periodo es inválido o inexistente') != -1) {
                                    logObj.setValue({
                                        fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                        value: 'El periodo es inválido o inexistente'
                                    });
                                    logObj.setValue({
                                        fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                        value: 'Finalizado'
                                    });
                                    otherIDSave = logObj.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    });
                                    return true;
                                }
                                else if (respuesta.indexOf('No se encontró ningún padrón consultando con las fechas') != -1) {
                                    logObj.setValue({
                                        fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                        value: 'El periodo es inválido o inexistente'
                                    });
                                    logObj.setValue({
                                        fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                        value: 'Finalizado'
                                    });
                                    otherIDSave = logObj.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    });
                                    return true;
                                }
                                else if (respuesta.indexOf('Error al intentar conectar con el web service') != -1) {
                                    logObj.setValue({
                                        fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                        value: 'Error al intentar conectar con el web service'
                                    });
                                    logObj.setValue({
                                        fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                        value: 'Finalizado'
                                    });
                                    otherIDSave = logObj.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    });
                                    return true;
                                }
                                else if (respuesta.indexOf('EL PADRON CONSULTADO NO SE ENCUENTRA PUBLICADO') != -1) {
                                    logObj.setValue({
                                        fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                        value: 'El padron consultado no se encuentra publicado'
                                    });
                                    logObj.setValue({
                                        fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                        value: 'Finalizado'
                                    });
                                    otherIDSave = logObj.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    });
                                    return true;
                                }
                                else if (respuesta.indexOf('Omitida') != -1) {
                                    contadorOmit++;
                                    if (descOmit == 'Vacio') {
                                        descOmit = vendorElement.getValue('internalid');
                                    }
                                    else {
                                        descOmit += ',' + vendorElement.getValue('internalid');
                                    }
                                }
                                else if (respuesta.indexOf('Vacio') != -1) {
                                    contadorVacio++;
                                    if (descVacio == 'Vacio') {
                                        descVacio = vendorElement.getValue('internalid');
                                    }
                                    else {
                                        descVacio += ',' + vendorElement.getValue('internalid');
                                    }
                                }
                                else {
                                    contadorError4++;
                                    if (descError4 == 'Vacio') {
                                        descError4 = vendorElement.getValue('internalid');
                                    }
                                    else {
                                        descError4 += ',' + vendorElement.getValue('internalid');
                                    }
                                }
                                salida += respuesta;

                            }

                            contadorGeneral++;
                            entityIDBase = entityID;

                        });
                        }

                        
                        if (vendorList.length === 80) {
                            cond = true;
                        } else {
                            entityType = 2;
                            entityIDBase = 0;
                        }
                    }
                    else {
                        entityType = 2;
                        entityIDBase = 0;
                    }
                } catch (error) {
                    log.error('vendorListDespuesFiltro', error);

                }

            }
            else {
                try {
                    if (customerList.length > 0) {
                        cond = false;

                        // if (customerList.length > entityIDBase + numRellamado) {
                        //     salidaFor = entityIDBase + numRellamado;
                        //     cond = true;
                        // }
                        // else if (customerList.length == entityIDBase + numRellamado) {
                        //     salidaFor = entityIDBase + numRellamado;
                        //     entityType = 3;
                        // }
                        // else {
                        //     salidaFor = customerList.length;
                        //     entityType = 3;
                        // }
                        datosDefault[0].getValue('custrecord_lmry_ar_ws_default_cc');
                        if (feature_ws_osci) {
                            const validCuits = customerList.reduce((acc, customer) => {
                                const vat = customer.getValue('vatregnumber') || '';
                                const dv = customer.getValue('custentity_lmry_digito_verificator') || '';
                                const cuit = vat + dv;
                                if (validaCUIT(cuit)) acc.push(cuit);
                                return acc;
                            }, []);
                            const periodFormat = getPeriodFormat(period);
                            const alicuotasByCuit = getAlicuotasByCUIT(validCuits, periodFormat, "P");
                            
                            let apply = datosDefault[0].getValue('custrecord_lmry_ar_ws_default_cc');
                            let percent = datosDefault[0].getValue('custrecord_lmry_ar_ws_default_percent');
                            let fechas = getPeriodo(period).split(',');
                            let fdesde = fechas[0];
                            let fhasta = fechas[1];
                            fdesde = generarFecha(fdesde.substring(0, 4), fdesde.substring(4, 6), fdesde.substring(6, 8));
                            fhasta = generarFecha(fhasta.substring(0, 4), fhasta.substring(4, 6), fhasta.substring(6, 8));
                            for (let i = 0; i < customerList.length; i++) {
                                const customer = customerList[i];
                                const entityID = customer.getValue('internalid');
                                const vat = customer.getValue('vatregnumber') || '';
                                const dv = customer.getValue('custentity_lmry_digito_verificator') || '';
                                const cuit = vat + dv;
                                if (!validaCUIT(cuit)) {
                                    contadorError2++;
                                    continue;
                                }

                                let alicuotaByEntity = alicuotasByCuit[cuit];
                                if (alicuotaByEntity) alicuotaByEntity = alicuotaByEntity[0]
                                if (alicuotaByEntity && apply) {
                                    let alicuota = parseFloat(alicuotaByEntity["alicuota"]) / 100;
                                    let grupoAlicouta = alicuotaByEntity["nro_grupo"];
                                    let fechaDesdeList = alicuotaByEntity["fecha_de_vigencia_desde"];
                                    let fechaHastaList = alicuotaByEntity["fecha_de_vigencia_hasta"];

                                    const [anioDesde, mesDesde, diaDesde] = fechaDesdeList.split("-");
                                    const [anioHasta, mesHasta, diaHasta] = fechaHastaList.split("-");

                                    let fechaDesde = generarFecha(anioDesde, mesDesde, diaDesde);
                                    let fechaHasta = generarFecha(anioHasta, mesHasta, diaHasta);
                                    salida += createContributoryClass(entityID, 1, grupoAlicouta, alicuota, fechaDesde, fechaHasta, detalle, subsidiary, period, datosDefault);
                                    contadorExito++
                                } else {
                                    if (apply) {
                                        salida += createContributoryClass(entityID, 1, 'WS-NEP', percent, fdesde, fhasta, detalle, subsidiary, period, datosDefault);
                                        contadorError3++
                                    }
                                }

                                contadorGeneral++;
                                entityIDBase = entityID;
                            }
                        } else {
                            customerList.forEach((customerElement) => {
                                let cuit = customerElement.getValue('vatregnumber') + customerElement.getValue('custentity_lmry_digito_verificator');
                                let entityID = customerElement.getValue('internalid');
                                let valida = validaCUIT(cuit);

                                if (cuit.length == 11 && valida) {
                                    let respuesta = generarXMLConsulta(period, cuit, detalle, entityID, subsidiary);
                                    if (respuesta.indexOf('Create') != -1 || respuesta.indexOf('Edit') != -1) {
                                        contadorExito++;
                                    }
                                    else if (respuesta.indexOf('PREFIJO DE CUIT INVALIDO') != -1) {
                                        contadorError1++;
                                        if (descError1 == 'Vacio') {
                                            descError1 = customerElement.getValue('internalid');
                                        }
                                        else {
                                            descError1 += ',' + customerElement.getValue('internalid');
                                        }
                                        record.submitFields({
                                            type: "customer",
                                            id: customerElement.getValue('internalid'),
                                            values: {
                                                "custentity_lmry_arba_cuit_invalid": true
                                            },
                                        });
                                    }
                                    else if (respuesta.indexOf('NUMERO DE CUIT INVALIDO') != -1) {
                                        contadorError2++;
                                        if (descError2 == 'Vacio') {
                                            descError2 = customerElement.getValue('internalid');
                                        }
                                        else {
                                            descError2 += ',' + customerElement.getValue('internalid');
                                        }
                                        record.submitFields({
                                            type: "customer",
                                            id: customerElement.getValue('internalid'),
                                            values: {
                                                "custentity_lmry_arba_cuit_invalid": true
                                            },
                                        });

                                    }
                                    else if (respuesta.indexOf('La CUIT ingresada no se encuentra en ningun padron') != -1) {
                                        contadorError3++;
                                        if (descError3 == 'Vacio') {
                                            descError3 = customerElement.getValue('internalid');
                                        }
                                        else {
                                            descError3 += ',' + customerElement.getValue('internalid');
                                        }
                                    }
                                    else if (respuesta.indexOf('El usuario ingresado y / o la contraseña son inválidos.') != -1) {
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                            value: 'Error al conectar con la api'
                                        });
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                            value: 'Finalizado'
                                        });
                                        otherIDSave = logObj.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                        return true;
                                    }
                                    else if (respuesta.indexOf('Internal Server') != -1) {
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                            value: 'Error Interno del Servidor'
                                        });
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                            value: 'Finalizado'
                                        });
                                        otherIDSave = logObj.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                        // return true;
                                        throw 'Error Interno del Servidor';
                                    }
                                    else if (respuesta.indexOf('Fallo') != -1) {
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                            value: 'No se ha configurado el setup'
                                        });
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                            value: 'Finalizado'
                                        });
                                        otherIDSave = logObj.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                        // return true;
                                        throw 'No se ha configurado el setup';
                                    }
                                    else if (respuesta.indexOf('El periodo es inválido o inexistente') != -1) {
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                            value: 'El periodo es inválido o inexistente'
                                        });
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                            value: 'Finalizado'
                                        });
                                        otherIDSave = logObj.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                        // return true;
                                        throw 'El periodo es inválido o inexistente';
                                    }
                                    else if (respuesta.indexOf('No se encontró ningún padrón consultando con las fechas') != -1) {
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                            value: 'El periodo es inválido o inexistente'
                                        });
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                            value: 'Finalizado'
                                        });
                                        otherIDSave = logObj.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                        // return true;
                                        throw 'El periodo es inválido o inexistente';
                                    }
                                    else if (respuesta.indexOf('Error al intentar conectar con el web service') != -1) {
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                            value: 'Error al intentar conectar con el web service'
                                        });
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                            value: 'Finalizado'
                                        });
                                        otherIDSave = logObj.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                        // return true;
                                        throw 'Error al intentar conectar con el web service';
                                    }
                                    else if (respuesta.indexOf('EL PADRON CONSULTADO NO SE ENCUENTRA PUBLICADO') != -1) {
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                                            value: 'El padron consultado no se encuentra publicado'
                                        });
                                        logObj.setValue({
                                            fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                                            value: 'Finalizado'
                                        });
                                        otherIDSave = logObj.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                        // return true;
                                        throw 'El padron consultado no se encuentra publicado';
                                    }
                                    else if (respuesta.indexOf('Omitida') != -1) {
                                        contadorOmit++;
                                        if (descOmit == 'Vacio') {
                                            descOmit = customerElement.getValue('internalid');
                                        }
                                        else {
                                            descOmit += ',' + customerElement.getValue('internalid');
                                        }
                                    }
                                    else if (respuesta.indexOf('Vacio') != -1) {
                                        contadorVacio++;
                                        if (descVacio == 'Vacio') {
                                            descVacio = customerElement.getValue('internalid');
                                        }
                                        else {
                                            descVacio += ',' + customerElement.getValue('internalid');
                                        }
                                    }
                                    else {
                                        contadorError4++;
                                        if (descError4 == 'Vacio') {
                                            descError4 = customerElement.getValue('internalid');
                                        }
                                        else {
                                            descError4 += ',' + customerElement.getValue('internalid');
                                        }
                                    }
                                    salida += respuesta;

                                }

                                contadorGeneral++;
                                entityIDBase = entityID;

                            });
                        }


                        if (customerList.length === 80) {
                            cond = true;
                        } else {
                            entityType = 3;
                            entityIDBase = 0;
                        }
                    }
                    else {
                        entityType = 3;
                        entityIDBase = 0;
                    }
                } catch (error) {
                    log.error('customerListDespuesFiltro', error);
                }
            }
            if ((salida.indexOf('Edit') != -1) || (salida.indexOf('Create') != -1)) {
                sendrptuser('ARBA Web Service', 1, salida);
                mensaje = 'Se creó o actualizó CCL';
            }
            else {
                sendrptuser('ARBA Web Service', 1, salida);
                mensaje = 'No se crearon CCL';
            }
            if (cond && entityType != 2) {
                totalBase = contadorExito + contadorError1 + contadorError2 + contadorError3 + contadorError4 + contadorOmit + contadorVacio;
                LlamarSchedule(period, contadorGeneral, entityType, subsidiary, contadorExito, contadorError1, contadorError2, contadorError3, contadorError4, descError1, descError2, descError3, descError4, contadorOmit, descOmit, contadorVacio, descVacio, vendorList, customerList, flag, flagEntity, juridicPerson, entityIDBase);
            }
            else {
                if (!cond && entityType != 3) {
                    totalBase = contadorExito + contadorError1 + contadorError2 + contadorError3 + contadorError4 + contadorOmit + contadorVacio;
                    LlamarSchedule(period, 0, entityType, subsidiary, contadorExito, contadorError1, contadorError2, contadorError3, contadorError4, descError1, descError2, descError3, descError4, contadorOmit, descOmit, contadorVacio, descVacio, vendorList, customerList, flag, flagEntity, juridicPerson, entityIDBase);
                }
                else if (cond && entityType != 3) {
                    totalBase = contadorExito + contadorError1 + contadorError2 + contadorError3 + contadorError4 + contadorOmit + contadorVacio;
                    LlamarSchedule(period, contadorGeneral, entityType, subsidiary, contadorExito, contadorError1, contadorError2, contadorError3, contadorError4, descError1, descError2, descError3, descError4, contadorOmit, descOmit, contadorVacio, descVacio, vendorList, customerList, flag, flagEntity, juridicPerson, entityIDBase);
                }
                else {
                    let total = contadorExito + contadorError1 + contadorError2 + contadorError3 + contadorError4 + contadorOmit + contadorVacio;
                    let descripcion = '';
                    descripcion += '- ' + contadorExito + ' de ' + total + ' registros Generados Correctamente';
                    let body = '';
                    const params = {};
                    params['custscript_lmry_ar_ws_period'] = period;
                    params['custscript_lmry_ar_ws_contador'] = contadorGeneral;
                    params['custscript_lmry_ar_ws_entity'] = entityType;
                    params['custscript_lmry_ar_ws_subsidiary'] = subsidiary;
                    params['custscript_lmry_ar_ws_contador_exito'] = contadorExito;
                    params['custscript_lmry_ar_ws_contador_error1'] = contadorError1;
                    params['custscript_lmry_ar_ws_contador_error2'] = contadorError2;
                    params['custscript_lmry_ar_ws_contador_error3'] = contadorError3;
                    params['custscript_lmry_ar_ws_contador_error4'] = contadorError4;
                    params['custscript_lmry_ar_ws_desc_error1'] = descError1;
                    params['custscript_lmry_ar_ws_desc_error2'] = descError2;
                    params['custscript_lmry_ar_ws_desc_error3'] = descError3;
                    params['custscript_lmry_ar_ws_desc_error4'] = descError4;
                    params['custscript_lmry_ar_ws_contador_omit'] = contadorOmit;
                    params['custscript_lmry_ar_ws_desc_omit'] = descOmit;
                    params['custscript_lmry_ar_ws_contador_vacio'] = contadorVacio;
                    params['custscript_lmry_ar_ws_desc_vacio'] = descVacio;
                    params['custscript_lmry_ar_ws_flag'] = flag;
                    params['custscript_lmry_ar_ws_flag_e'] = flagEntity;
                    params['custscript_lmry_ar_ws_juridic_p'] = juridicPerson;
                    params['custscript_lmry_ar_ws_id_entity'] = entityIDBase;
                    logObj = updateDataLog(params, vendorList, customerList, logObj);
                    if (total == 0) {
                        logObj.setValue({
                            fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                            value: 'No existen entidades validas.'
                        });
                        logObj.setValue({
                            fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                            value: 'Finalizado'
                        });
                        otherIDSave = logObj.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                    }
                    else {
                        if (contadorError1 == 0 && contadorError2 == 0 && contadorError3 == 0 && contadorError4 == 0 && contadorOmit == 0 && contadorVacio == 0) {
                            body += 'Todos los registros fueron creados correctamente';
                        }
                        else {
                            body += 'ERROR|ENTITY ID\n';
                            if (descError1 != 'Vacio') {
                                let listError1 = descError1.split(',');
                                for (let i = 0; i < listError1.length; i++) {
                                    body += 'PREFIJO DE CUIT INVALIDO|' + listError1[i] + '\n';
                                }
                            }
                            if (descError2 != 'Vacio') {
                                let listError2 = descError2.split(',');
                                for (let i = 0; i < listError2.length; i++) {
                                    body += 'NUMERO DE CUIT INVALIDO|' + listError2[i] + '\n';
                                }
                            }
                            if (descError3 != 'Vacio') {
                                let listError3 = descError3.split(',');
                                for (let i = 0; i < listError3.length; i++) {
                                    body += 'La CUIT ingresada no se encuentra en ningun padron|' + listError3[i] + '\n';
                                }
                            }
                            if (descError4 != 'Vacio') {
                                let listError4 = descError4.split(',');
                                for (let i = 0; i < listError4.length; i++) {
                                    body += 'ERROR INESPERADO|' + listError4[i] + '\n';
                                }
                            }
                            if (descOmit != 'Vacio') {
                                let listOmit = descOmit.split(',');
                                for (let i = 0; i < listOmit.length; i++) {
                                    body += 'Omitido por tener alicuota con valor 0 en el periodo|' + listOmit[i] + '\n';
                                }
                            }
                            if (descVacio != 'Vacio') {
                                let listVacio = descVacio.split(',');
                                for (let i = 0; i < listVacio.length; i++) {
                                    body += 'Omitido por no tener clases contributivas en el periodo|' + listVacio[i] + '\n';
                                }
                            }
                        }
                        let fileCSV = file.create({
                            name: Name_File(subsidiary),
                            fileType: file.Type.CSV,
                            contents: body,
                            encoding: file.Encoding.UTF_8,
                            folder: Consult_folder('Latam WS ARBA', 'SuiteLatamReady') //37164 folderId
                        });
                        let idCSV = fileCSV.save();
                        let fileObj = file.load({
                            id: idCSV
                        });

                        logObj.setValue({
                            fieldId: 'custrecord_lmry_ar_ws_resumen_descrip',
                            value: descripcion
                        });
                        logObj.setValue({
                            fieldId: 'custrecord_lmry_ar_ws_resumen_result',
                            value: fileObj.url
                        });
                        logObj.setValue({
                            fieldId: 'custrecord_lmry_ar_ws_resumen_estado',
                            value: 'Finalizado'
                        });
                        otherIDSave = logObj.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                    }
                }
            }
            return mensaje;
        };
        exports.generarXMLConsultaMasiva = generarXMLConsultaMasiva;
        /**
         * Funcion de generacion del nombre del archivo
         * @param {number} subsidiary id subsidiaria
         * @returns Cadena con el nombre del archivo
         */

        function getAlicuotasByCUIT(cuits, period, type) {
            const auxBody = JSON.stringify({ period, cuits, type });
            let responsePadron = http.post({
                body: auxBody,
                url: "http://149.130.171.192:3000/padron/Arba",
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "lmry-account": runtime.accountId,
                    "Content-Type": "application/json"
                }
            });
            return JSON.parse(responsePadron.body).data
        }

        function Name_File(subsidiary) {
            let name = 'CSVResponse';
            let ext = '.csv';
            let fecha = new Date();
            let month = fecha.getMonth() + 1;
            let year = fecha.getFullYear();
            let day = fecha.getDate();
            let monthText = '' + month;
            let yearText = '' + year;
            let dayText = '' + day;
            if (monthText.length == 1) {
                monthText = '0' + monthText;
            }
            if (dayText.length == 1) {
                dayText = '0' + dayText;
            }
            name += subsidiary + '_' + yearText + monthText + dayText + ext;
            return name;
        }
        /**
         * Funcion de busqueda y creacion del folder de destino para el archivo csv
         * @param {string} name_folder 
         * @param {string} parent_folder 
         * @returns {number} id del folder
         */
        function Consult_folder(name_folder, parent_folder) {
            let busfolder = search.create({
                type: 'folder',
                columns: ['internalid', 'name'],
                filters: [
                    ['name', 'is', parent_folder]
                ]
            });
            let resultado_busqueda = busfolder.run().getRange({ start: 0, end: 10 });
            let subof;
            if (resultado_busqueda == null || resultado_busqueda.length == 0) {
                subof = record.create({
                    type: 'folder'
                });
                subof.setValue('name', parent_folder);
            }
            else {
                subof = record.load({
                    type: 'folder',
                    id: resultado_busqueda[0].getValue('internalid')
                });
            }
            let id_folder_parent = subof.save();
            let busfolder2 = search.create({
                type: 'folder',
                columns: ['internalid', 'name'],
                filters: [
                    ['name', 'is', name_folder], 'and', ['parent', 'is', id_folder_parent]
                ]
            });
            let resultado_busqueda2 = busfolder2.run().getRange({ start: 0, end: 100 });
            let subof2;
            if (resultado_busqueda2 == null || resultado_busqueda2.length == 0) {
                subof2 = record.create({
                    type: 'folder'
                });
                subof2.setValue('name', name_folder);
                subof2.setValue('parent', id_folder_parent);
            }
            else {
                subof2 = record.load({
                    type: 'folder',
                    id: resultado_busqueda2[0].getValue('internalid')
                });
            }
            let id_folder = subof2.save();
            return id_folder;
        }
        /**
         * 
         * @param {*} cuit 
         * @returns 
         */
        function validaCUIT(cuit) {
            let valida;
            let parser = parseFloat(cuit);
            if (cuit.length == 11 && cuit == parser) {
                valida = true;
            }
            else {

                valida = false;
            }
            return valida;
        }

        /**
         * 
         * @param {string} type 
         * @param {number} subsidiary 
         * @param {number} juridicPerson 
         * @param {number} nroID 
         * @param {any} isvalidCuit 
         * @param {any} isOpenTransactions 
         * @returns 
         */
        function cargarEntity(type, subsidiary, juridicPerson, nroID, isvalidCuit, isOpenTransactions) {
            let filters = new Array();
            filters[0] = search.createFilter({
                name: 'vatregnumber',
                operator: search.Operator.ISNOTEMPTY
            });
            filters[1] = search.createFilter({
                name: 'custentity_lmry_digito_verificator',
                operator: search.Operator.ISNOTEMPTY
            });
            let prefMultiSub = runtime.isFeatureInEffect({
                feature: "multisubsidiary" + type
            });
            if (type == "vendor" || prefMultiSub == true) {
                filters[2] = search.createFilter({
                    name: 'formulanumeric',
                    formula: '{msesubsidiary.internalid}',
                    operator: search.Operator.EQUALTO,
                    values: subsidiary // Argentina
                });
            } else {
                filters[2] = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: subsidiary // Argentina
                });
            }
            filters[3] = search.createFilter({
                name: 'isinactive',
                operator: search.Operator.IS,
                values: 'F'
            });
            if (Number(juridicPerson)) {
                filters[4] = search.createFilter({
                    name: "custentity_lmry_ar_cuitc_tsuj",
                    operator: search.Operator.IS,
                    values: juridicPerson,
                });
            }
            if (Number(nroID)) {
                filters.push(
                    search.createFilter({
                        name: "internalidnumber",
                        operator: "greaterthan",
                        values: nroID,
                    })
                );
            }
            if (isvalidCuit === "T") {
                filters.push(
                    search.createFilter({
                        name: "custentity_lmry_arba_cuit_invalid",
                        operator: "is",
                        values: false
                    })
                );
            }
            if (isOpenTransactions === "T") {
                filters.push(
                    search.createFilter({
                        name: "status",
                        join: "transaction",
                        operator: "anyof",
                        values: ["VendBill:A", "CustCred:A", "CustInvc:A"],

                    })
                );
            }
            //filtros de validacion del cuit
            filters.push(
                search.createFilter({
                    name: 'formulanumeric',
                    formula: 'LENGTH({vatregnumber})+LENGTH({custentity_lmry_digito_verificator})',
                    operator: search.Operator.EQUALTO,
                    values: 11 // numero de digitos del cuit
                })
            );
            filters.push(
                search.createFilter({
                    name: 'formulanumeric',
                    formula: "REGEXP_INSTR({vatregnumber} , '^([0-9]){9}\\d')",
                    operator: search.Operator.EQUALTO,
                    values: 1 // true
                })
            );
            filters.push(
                search.createFilter({
                    name: 'formulanumeric',
                    formula: "REGEXP_INSTR({custentity_lmry_digito_verificator} , '^([0-9]){0}\\d')",
                    operator: search.Operator.EQUALTO,
                    values: 1 // true
                })
            );
            let VendSearch = search.create({
                type: type,
                columns: [search.createColumn({ name: "internalid", sort: search.Sort.ASC }), 'vatregnumber', 'custentity_lmry_digito_verificator'],
                filters: filters
            });
            const entitys = VendSearch.run().getRange(0, 80);
            return entitys;

            // let vendorArray = [];
            // let pageData = VendSearch.runPaged({ pageSize: 1000 });
            // if (pageData) {
            //     pageData.pageRanges.forEach(function (pageRange) {
            //         let page = pageData.fetch({ index: pageRange.index });
            //         let results = page.data;
            //         if (results) {
            //             vendorArray = vendorArray.concat(results);
            //         }
            //     });
            // }
            // return vendorArray;
        }
        /**
         * 
         * @param {string} type 
         * @param {number} subsidiary 
         * @param {number} juridicPerson 
         * @param {number} nroID 
         * @param {any} isvalidCuit 
         * @param {any} isOpenTransactions 
         * @returns  
         */
        function countEntity(type, subsidiary, juridicPerson, nroID, isvalidCuit, isOpenTransactions) {

            let filters = new Array();
            filters[0] = search.createFilter({
                name: 'vatregnumber',
                operator: search.Operator.ISNOTEMPTY
            });
            filters[1] = search.createFilter({
                name: 'custentity_lmry_digito_verificator',
                operator: search.Operator.ISNOTEMPTY
            });
            let prefMultiSub = runtime.isFeatureInEffect({
                feature: "multisubsidiary" + type
            });
            if (prefMultiSub == true) {
                filters[2] = search.createFilter({
                    name: 'formulanumeric',
                    formula: '{msesubsidiary.internalid}',
                    operator: search.Operator.EQUALTO,
                    values: subsidiary // Argentina
                });
            }
            else {
                filters[2] = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: subsidiary // Argentina
                });
            }
            filters[3] = search.createFilter({
                name: 'isinactive',
                operator: search.Operator.IS,
                values: 'F'
            });
            if (Number(juridicPerson)) {
                filters[4] = search.createFilter({
                    name: "custentity_lmry_ar_cuitc_tsuj",
                    operator: search.Operator.IS,
                    values: juridicPerson,
                });
            }
            if (Number(nroID)) {
                filters.push(
                    search.createFilter({
                        name: "internalidnumber",
                        operator: "greaterthan",
                        values: nroID,
                    })
                );
            }
            if (isvalidCuit === "T") {
                filters.push(
                    search.createFilter({
                        name: "custentity_lmry_arba_cuit_invalid",
                        operator: "is",
                        values: false
                    })
                );
            }
            if (isOpenTransactions === "T") {
                filters.push(
                    search.createFilter({
                        name: "status",
                        join: "transaction",
                        operator: "anyof",
                        values: ["VendBill:A", "CustCred:A", "CustInvc:A"],

                    })
                );
            }
            //filtros de validacion del cuit
            filters.push(
                search.createFilter({
                    name: 'formulanumeric',
                    formula: 'LENGTH({vatregnumber})+LENGTH({custentity_lmry_digito_verificator})',
                    operator: search.Operator.EQUALTO,
                    values: 11 // numero de digitos del cuit
                })
            );
            filters.push(
                search.createFilter({
                    name: 'formulanumeric',
                    formula: "REGEXP_INSTR({vatregnumber} , '^([0-9]){9}\\d')",
                    operator: search.Operator.EQUALTO,
                    values: 1 // true
                })
            );
            filters.push(
                search.createFilter({
                    name: 'formulanumeric',
                    formula: "REGEXP_INSTR({custentity_lmry_digito_verificator} , '^([0-9]){0}\\d')",
                    operator: search.Operator.EQUALTO,
                    values: 1 // true
                })
            );
            let VendSearch = search.create({
                type: type,
                columns: [search.createColumn({
                    name: "internalid",
                    summary: "COUNT",
                    sort: search.Sort.ASC
                })],
                filters: filters
            });
            const vendors = VendSearch.run().getRange(0, 1);

            return vendors[0]?.toJSON()?.values["COUNT(internalid)"];
        }
        /**
         * Funcion de formateo de string a Date
         * @param {number} year 
         * @param {number} mes 
         * @param {number} dia 
         * @returns {Date} 
         */
        function generarFecha(year, mes, dia) {
            let fecha = new Date(year, mes - 1, dia, 0, 0, 0, 0);
            return fecha;
        }
        /**
         * Funcion para el rellamado del schedule,se realiza cada 80 entidades por tema de performance
         * @param {number} period Periodo a actualizar
         * @param {number} cont Contador general de entidades procesadas
         * @param {number} entityType Tipo de entidad que se esta procesando
         * @param {number} subsidiary Id de subsidiaria
         * @param {number} contExito Contador de CC generadas con exito
         * @param {number} contError1 
         * @param {number} contError2 
         * @param {number} contError3 
         * @param {number} contError4 
         * @param {string} descError1 
         * @param {string} descError2 
         * @param {string} descError3 
         * @param {string} descError4 
         * @param {number} contadorOmit 
         * @param {string} descOmit 
         * @param {number} contadorVacio 
         * @param {string} descVacio 
         * @param {Array<object>} vendorList Arreglo de entidades 
         * @param {Array<object>} customerList 
         * @param {boolean} flag 
         * @param {boolean} flagEntity 
         * @param {number} juridicPerson 
         * @param {number} idEntityError 
         */
        function LlamarSchedule(
            period,
            cont,
            entityType,
            subsidiary,
            contExito,
            contError1,
            contError2,
            contError3,
            contError4,
            descError1,
            descError2,
            descError3,
            descError4,
            contadorOmit,
            descOmit,
            contadorVacio,
            descVacio,
            vendorList,
            customerList,
            flag,
            flagEntity,
            juridicPerson,
            idEntityError) {

            let params = {};
            params['custscript_lmry_ar_ws_period'] = period;
            params['custscript_lmry_ar_ws_contador'] = cont;
            params['custscript_lmry_ar_ws_entity'] = entityType;
            params['custscript_lmry_ar_ws_subsidiary'] = subsidiary;
            params['custscript_lmry_ar_ws_contador_exito'] = contExito;
            params['custscript_lmry_ar_ws_contador_error1'] = contError1;
            params['custscript_lmry_ar_ws_contador_error2'] = contError2;
            params['custscript_lmry_ar_ws_contador_error3'] = contError3;
            params['custscript_lmry_ar_ws_contador_error4'] = contError4;
            params['custscript_lmry_ar_ws_desc_error1'] = descError1;
            params['custscript_lmry_ar_ws_desc_error2'] = descError2;
            params['custscript_lmry_ar_ws_desc_error3'] = descError3;
            params['custscript_lmry_ar_ws_desc_error4'] = descError4;
            params['custscript_lmry_ar_ws_contador_omit'] = contadorOmit;
            params['custscript_lmry_ar_ws_desc_omit'] = descOmit;
            params['custscript_lmry_ar_ws_contador_vacio'] = contadorVacio;
            params['custscript_lmry_ar_ws_desc_vacio'] = descVacio;
            params['custscript_lmry_ar_ws_flag'] = flag;
            params['custscript_lmry_ar_ws_flag_e'] = flagEntity;
            params['custscript_lmry_ar_ws_juridic_p'] = juridicPerson;
            params['custscript_lmry_ar_ws_id_entity'] = idEntityError;
            updateDataLog(params, vendorList, customerList, null);

            let RedirecSchdl = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: 'customscript_lmry_ar_ws_arba_masivo_schd',
                deploymentId: 'customdeploy_lmry_ar_ws_arba_masivo_schd',
                params: params
            });
            RedirecSchdl.submit();
        }

        /**
         * Funcion de actualizacion del progreso del proceso en el log
         * @param {object} LogData 
         * @param {Array} vendorList 
         * @param {Array} customerList 
         */

        function updateDataLog(LogData, vendorList, customerList, logRecord) {
            const entityType = LogData.custscript_lmry_ar_ws_entity;
            const subsidiary = LogData.custscript_lmry_ar_ws_subsidiary;
            const juridicPerson = LogData.custscript_lmry_ar_ws_juridic_p;
            const descError1 = LogData.custscript_lmry_ar_ws_desc_error1;
            const descError2 = LogData.custscript_lmry_ar_ws_desc_error2;
            const descError3 = LogData.custscript_lmry_ar_ws_desc_error3;
            const descError4 = LogData.custscript_lmry_ar_ws_desc_error4;
            const cont = LogData.custscript_lmry_ar_ws_contador;
            const descOmit = LogData.custscript_lmry_ar_ws_desc_omit;
            const descVacio = LogData.custscript_lmry_ar_ws_desc_vacio;


            // @ts-ignore
            let searchLog = search.create({
                type: 'customrecord_lmry_ar_ws_log_resumen',
                columns: ['internalid', 'custrecord_lmry_ar_ws_resumen_json', 'custrecord_lmry_ar_ws_resumen_filt'],
                filters: ['custrecord_lmry_ar_ws_resumen_estado', 'contains', 'Procesando']
            });
            let searchLog2 = searchLog.run().getRange({ start: 0, end: 1 });
            let bodyJson = (searchLog2[0].getValue("custrecord_lmry_ar_ws_resumen_json") !== null) ? JSON.parse(searchLog2[0].getValue("custrecord_lmry_ar_ws_resumen_json")) : {};
            const filters = searchLog2[0].getValue('custrecord_lmry_ar_ws_resumen_filt').split('|');
            let ntotal = (entityType == 1 ? countEntity("vendor", subsidiary, juridicPerson, 0, filters[2], filters[3]) : (entityType == 2 ? countEntity("customer", subsidiary, juridicPerson, 0, filters[2], filters[3]) : "Consolidando"));

            // 1='PREFIJO DE CUIT INVALIDO';
            // 2='NUMERO DE CUIT INVALIDO';
            // 3='La CUIT ingresada no se encuentra en ningun padron';
            // 4='ERROR INESPERADO';
            // 5='Omitido por tener alicuota con valor 0 en el periodo';
            // 6='Omitido por no tener clases contributivas en el periodo';
            if (descError1 != 'Vacio') {
                let listError1 = descError1.split(',');
                listError1.forEach(listError1Item => {
                    bodyJson[listError1Item] = 1;
                });
            }
            if (descError2 != 'Vacio') {
                let listError2 = descError2.split(',');
                listError2.forEach(listError2Item => {
                    bodyJson[listError2Item] = 2;
                });
            }
            if (descError3 != 'Vacio') {
                let listError3 = descError3.split(',');
                listError3.forEach(listError3Item => {
                    bodyJson[listError3Item] = 3;
                });
            }
            if (descError4 != 'Vacio') {
                let listError4 = descError4.split(',');
                listError4.forEach(listError4Item => {
                    bodyJson[listError4Item] = 4;
                });
            }
            if (descOmit != 'Vacio') {
                let listOmit = descOmit.split(',');
                listOmit.forEach(listOmitItem => {
                    bodyJson[listOmitItem] = 5;
                });
            }
            if (descVacio != 'Vacio') {
                let listVacio = descVacio.split(',');
                listVacio.forEach(listVacioItem => {
                    bodyJson[listVacioItem] = 6;
                });
            }
            if (customerList.length > 0) {
                customerList.forEach((e) => {
                    if (bodyJson[e.getValue("internalid")] == undefined) {
                        bodyJson[e.getValue("internalid")] = 7;
                    }
                });
            }
            if (vendorList.length > 0) {
                vendorList.forEach((e) => {
                    if (bodyJson[e.getValue("internalid")] == undefined) {
                        bodyJson[e.getValue("internalid")] = 7;
                    }
                });
            }
            if (!logRecord) {
                record.submitFields({
                    type: 'customrecord_lmry_ar_ws_log_resumen',
                    id: searchLog2[0].getValue('internalid').toString(),
                    values: {
                        'custrecord_lmry_ar_ws_resumen_estado': ntotal != "Consolidando" ? "Procesando - " + cont.toString() + "/" + ntotal.toString() + (entityType === 1 ? " Vendors" : " Customers") : ntotal,
                        'custrecord_lmry_ar_ws_resumen_json': JSON.stringify(bodyJson),
                        "custrecord_lmry_ar_ws_resumen_eid": JSON.stringify(LogData)
                    },
                });
            } else {
                logRecord.setValue({ fieldId: 'custrecord_lmry_ar_ws_resumen_json', value: JSON.stringify(bodyJson) });
                logRecord.setValue({ fieldId: "custrecord_lmry_ar_ws_resumen_eid", value: JSON.stringify(LogData) });
                return logRecord;
            }

        }
        /**
         * Funcion de busqueda de configuracion 
         * @param {number} Subsi Id de la subsidiaria
         * @param {number} taxtype Id del tipo de CC
         * @returns {Array} Arreglo con las configuraciones disponibles
         */
        function obtenerSetup(Subsi, taxtype) {
            let filterDatos = new Array();
            filterDatos[0] = search.createFilter({
                name: 'custrecord_lmry_ar_ws_tipo_padron',
                operator: search.Operator.IS,
                values: 'ARBA'
            });
            filterDatos[1] = search.createFilter({
                name: 'custrecord_lmry_ar_ws_subsidiary_cc',
                operator: search.Operator.IS,
                values: Subsi
            });
            filterDatos[2] = search.createFilter({
                name: 'custrecord_lmry_ar_ws_taxtype',
                operator: search.Operator.EQUALTO,
                values: taxtype
            });
            filterDatos[3] = search.createFilter({
                name: 'isinactive',
                operator: search.Operator.IS,
                values: 'F'
            });
            let columnDatos = new Array();
            columnDatos[0] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_appliesto'
            });
            columnDatos[1] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_amountto'
            });
            columnDatos[2] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_additional_ratio'
            });
            columnDatos[3] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_subtype'
            });
            columnDatos[4] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_type'
            });
            columnDatos[5] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_jurisdiccion'
            });
            columnDatos[6] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_applies_item'
            });
            columnDatos[7] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_applies_account'
            });
            columnDatos[8] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_gen_transaction'
            });
            columnDatos[9] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_tran_types'
            });
            columnDatos[10] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_taxtype'
            });
            columnDatos[11] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_tax_item'
            });
            columnDatos[12] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_normas_iibb'
            });
            columnDatos[13] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_taxcode'
            });
            columnDatos[14] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_department'
            });
            columnDatos[15] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_class'
            });
            columnDatos[16] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_location'
            });
            columnDatos[17] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_debit_account'
            });
            columnDatos[18] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_credit_account'
            });
            columnDatos[19] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_vat_included'
            });
            columnDatos[20] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_minimun_amount'
            });
            columnDatos[21] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_maximun_amount'
            });
            columnDatos[22] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_month_accum'
            });
            columnDatos[23] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_set_ret_base'
            });
            columnDatos[24] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_accandmin_with'
            });
            columnDatos[25] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_base_amount'
            });
            columnDatos[26] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_non_taxable_min'
            });
            columnDatos[27] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_fiscal_doctype'
            });
            columnDatos[28] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_ccl_convmult'
            });
            columnDatos[29] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_resptype'
            });
            columnDatos[30] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_arba_padron'
            });
            columnDatos[31] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_default_cc'
            });
            columnDatos[32] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_default_percent'
            });
            columnDatos[33] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_sub_last_ret'
            });
            columnDatos[34] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_tax_code_group'
            });
            columnDatos[35] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_add_accumulated'
            });
            columnDatos[36] = search.createColumn({
                name: 'custrecord_lmry_ar_ws_osci_arba'
            });
            let serachObj = search.create({
                type: 'customrecord_lmry_ar_ws_setup',
                columns: columnDatos,
                filters: filterDatos
            });
            let serachObj2 = serachObj.run().getRange({ start: 0, end: 10 });
            return serachObj2;
        }
        /**
         * Funcion de creacion de registro log de las actualizaciones erradas
         * @param {boolean} detalle Cadena con el detalle del problema
         * @param {number} subsidiary Id de la subsidiaria
         * @param {number} entityID Id de la entidad relacionada
         * @param {number} period Id del periodo 
         * @param {string} tipoError Valor del error sucedido
         * @param {string} mensajeErrorFinal Mensaje de error detallado
         * @returns Status del proceso de creacion del log
         */
        function createLogDetalle(detalle, subsidiary, entityID, period, tipoError, mensajeErrorFinal) {
            if (detalle) {
                if (subsidiary == 0) {
                    let entityError = search.lookupFields({
                        type: 'entity',
                        id: entityID,
                        columns: ['subsidiary']
                    });
                    if (entityError != null && entityError != '') {
                        subsidiary = entityError.subsidiary[0].value;
                    }
                }
                let logObj = record.create({
                    type: 'customrecord_lmry_ar_ws_log',
                    isDynamic: true
                });
                logObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ws_subsidiary',
                    value: subsidiary
                });
                logObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ws_period',
                    value: period
                });
                logObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ws_user',
                    value: runtime.getCurrentUser().id
                });
                logObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ws_entity',
                    value: entityID
                });
                logObj.setValue({
                    fieldId: 'custrecord_lmry_ar_ws_descripcion',
                    value: 'Tipo de Error: ' + tipoError + ', Mensaje de Error: ' + mensajeErrorFinal
                });
                otherIDSave = logObj.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
            }
            return true;
        }
        /* ------------------------------------------------------------------------------------------------------
         * Nota: Envio de mail al usuario.
         * 		 namereport = Nombre del reporte
         * 		 opc		= Opcion del mensaje
         * 		 msgreport  = Mensaje personalizado
         * --------------------------------------------------------------------------------------------------- */
        /**
         * funcion de envio de correo de actualizacion al usuario
         * @param {string} namereport nombre del archivo generado
         * @param {any} opc tipo de operacion
         * @param {string} msgreport Mensaje de reporte
         * @returns Status del envio del correo
         */
        function sendrptuser(namereport, opc, msgreport) {
            //Formato
            let colStyl = 'style=\"text-align: center; font-size: 9pt; font-weight:bold; color:white; background-color:#d50303; border: 1px solid #d50303; ';
            let rowStyl = 'style=\"text-align: Left;   font-size: 9pt; font-weight:bold; border: 1px solid #d50303; ';
            let width_td1 = " width:50%;\">";
            let width_td2 = " width:50%;\">";
            // Dados del nlapiGetContext
            let namevers = runtime.version;
            let namecomp = runtime.accountId;
            let nameuser = runtime.getCurrentUser().name;
            // Apis de Netsuite
            let namesubs = runtime.getCurrentUser().subsidiary.toString();
            // Verifica si es One World
            let featuresubs = runtime.isFeatureInEffect({
                feature: 'SUBSIDIARIES'
            });
            if (featuresubs == true) {
                try {
                    namesubs = search.lookupFields({
                        type: 'subsidiary',
                        id: namesubs,
                        columns: ['name']
                    })?.name.toString();
                    // namesubs = namesubs.name;
                }
                catch (err) {
                    namesubs = runtime.getCurrentUser().subsidiary.toString();
                }
            }
            // Datos del Usuario
            let userid = runtime.getCurrentUser();

            let userfn = ['email', 'firstname'];
            let employ = search.lookupFields({
                type: 'employee',
                id: userid.id,
                columns: userfn
            });
            let empema = "";

            if (employ.email != '' && employ.email != null) {
                empema = employ.email.toString();
            }
            else {

                return true;
            }
            let empfir = employ.firstname;
            let datetime = new Date();
            let bmsg = '';
            bmsg += "<table style=\"font-family: Courier New, Courier, monospace; width:95%; border: 1px solid #d50303;\">";
            bmsg += "<tr>";
            bmsg += "<td " + colStyl + width_td1;
            bmsg += "Descripcion";
            bmsg += "</td>";
            bmsg += "<td " + colStyl + width_td2;
            bmsg += "Detalle";
            bmsg += "</td>";
            bmsg += "</tr>";
            bmsg += "<tr>";
            bmsg += "<td " + rowStyl + width_td1;
            bmsg += "Fecha y Hora";
            bmsg += "</td>";
            bmsg += "<td " + rowStyl + width_td2;
            bmsg += datetime;
            bmsg += "</td>";
            bmsg += "</tr>";
            bmsg += "<tr>";
            bmsg += "<td " + rowStyl + width_td1;
            bmsg += "NetSuite Version (Release)";
            bmsg += "</td>";
            bmsg += "<td " + rowStyl + width_td2;
            bmsg += namevers;
            bmsg += "</td>";
            bmsg += "</tr>";
            bmsg += "<tr>";
            bmsg += "<td " + rowStyl + width_td1;
            bmsg += "Codigo Cliente (Company)";
            bmsg += "</td>";
            bmsg += "<td " + rowStyl + width_td2;
            bmsg += namecomp;
            bmsg += "</td>";
            bmsg += "</tr>";
            bmsg += "<tr>";
            bmsg += "<td " + rowStyl + width_td1;
            bmsg += "Subsidiaria del Usuario (ID)";
            bmsg += "</td>";
            bmsg += "<td " + rowStyl + width_td2;
            bmsg += namesubs;
            bmsg += "</td>";
            bmsg += "</tr>";
            bmsg += "<tr>";
            bmsg += "<td " + rowStyl + width_td1;
            bmsg += "Nombre del Usuario (User) ";
            bmsg += "</td>";
            bmsg += "<td " + rowStyl + width_td2;
            bmsg += nameuser;
            bmsg += "</td>";
            bmsg += "</tr>";
            bmsg += "</table>";
            // Generacion txt y envio de email
            let subject = 'NS - Bundle Latinoamerica - Mensaje.';
            let body = '<body text="#333333" link="#014684" vlink="#014684" alink="#014684">';
            body += '<table width="642" border="0" align="center" cellpadding="0" cellspacing="0">';
            body += '<tr>';
            body += '<td width="100%" valign="top">';
            body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
            body += '<tr>';
            body += '<td width="100%" colspan="2"><img style="display: block;" src="' + urlImage + '" width="645" alt="main banner"/></td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
            body += '<tr>';
            body += '<td bgcolor="#d50303" width="15%">&nbsp;</td>';
            body += '<td bgcolor="#d50303" width="85%">';
            body += '<font style="color:#FFFFFF; line-height:130%; font-family:Arial, Helvetica, sans-serif; font-size:19px">';
            body += 'Estimado(a) ' + empfir + ':<br>';
            body += '</font>';
            body += '</td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td width="100%" bgcolor="#d50303" colspan="2" align="right"><a href="http://www.latamready.com/#contac"><img src="' + urlImage2 + '" width="94" style="margin-right:45px" /></a></td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td width="100%" bgcolor="#FFF" colspan="2" align="right">';
            body += '<a href="' + urlImageLinkedin + '"><img src="' + urlImage3 + '" width="15" style="margin:5px 1px 5px 0px" /></a>';
            body += '<a href="' + urlImageFb + '"><img src="' + urlImage4 + '" width="15" style="margin:5px 1px 5px 0px" /></a>';
            body += '<a href="' + urlImageTwt + '"><img src="' + urlImage5 + '" width="15" style="margin:5px 47px 5px 0px" /></a>';
            body += '</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%">';
            body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:13px">';
            body += '<p>Este es un mensaje automático de LatamReady SuiteApp.</p>';
            // Depende del parametro envia el mensaje
            if (opc == '' || opc == null) {
                body += '<p>El nombre del archivo generado es: </p>';
                body += '<p><b> - ' + namereport + '</b></p>';
            }
            else {
                switch (opc) {
                    case 1:
                        body += '<p><b> - ' + namereport + '</b></p>';
                        body += '<p>' + msgreport + '</p>';
                        break;
                    case 2:
                        body += '<p>' + msgreport + '</p>';
                        break;
                    case 3:
                        body += '<p>' + msgreport + '</p>';
                        body += '<b> - ' + namereport + '</b>';
                        break;
                    default:
                }
            }
            body += bmsg;
            body += '<p>Saludos,</p>';
            body += '<p>El Equipo de LatamReady</p>';
            body += '</font>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<br>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2" bgcolor="#e5e6e7">';
            body += '<tr>';
            body += '<td>&nbsp;</td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%" align="center">';
            body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:12px;" >';
            body += '<i>Este es un mensaje automático. Por favor, no responda este correo electrónico.</i>';
            body += '</font>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td>&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%" align="center">';
            body += '<a href="http://www.latamready.com/"><img src="' + urlImage6 + '" width="169" style="margin:15px 0px 15px 0px" /></a>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%" align="center">';
            body += '<a href="' + urlImageLinkedin + '"><img src="' + urlImage7 + '" width="101" style="margin:0px 5px 0px 5px" /></a>';
            body += '<a href="' + urlImageFb + '"><img src="' + urlImage8 + '" width="101" style="margin:0px 5px 0px 5px" /></a>';
            body += '<a href="' + urlImageTwt + '"><img src="' + urlImage9 + '" width="101" style="margin:0px 5px 0px 5px" /></a>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0">';
            body += '<tr>';
            body += '<td>';
            body += '<img src="' + urlImage10 + '" width="642" style="margin:15px 0px 15px 0px" /></a>';
            body += '</td>';
            body += '</tr>';
            body += '</table>';
            body += '</td>';
            body += '</tr>';
            body += '</table>';
            body += '</body>';
            let bcc = new Array();
            // Api de Netsuite para enviar correo electronico
            let ID = runtime.getCurrentUser().id;
            email.send({
                author: ID,
                recipients: empema,
                subject: subject,
                body: body,
                bcc: bcc,
                // cco: cco
            });
            return true;
        }
    });
