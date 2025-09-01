/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||  This script for Report - Colombia                               ||
||                                                                  ||
||  File Name: LMRY_CO_CertificadoRetencion_SCHDL_V2.0.js           ||
||                                                                  ||
||  Version Date         Author        Remarks                      ||
||  2.0     FEB 20 2022  Alexandra      Use Script 2.0              ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(['N/search',
        "N/format",
        'N/config',
        'N/record',
        'N/file',
        'N/log',
        'N/runtime',
        "./CO_Library_Mensual/LMRY_CO_Reportes_LBRY_V2.0.js",
        'N/xml',
        "N/url",
        "N/render",
        "/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js"
    ],

    function(search, format, config, record, file, log, runtime, libreria, xml, url,render, libreriaReport) {

        var objContext = runtime.getCurrentScript();
        // Parametros
        var language = '';
        var municipality = 'Bogota';
        var extension = 'pdf';
        var transacciones;
        
        var otherMunicipality;
        var jsonTransactionMunicip = {};
        var GLOBAL_LABELS;

        var companyname;
        var companyruc = '';
        var companydv = '';
        var companyaddress;

        var parametros;
        var reteType = '';
        var vatRegNumberVendor = '';
        var vendorruc= '';
        var vendordv = '';
        var nit_vendor = '';


        var LMRY_script = "LMRY - CO Certificado de Retencion V2 SCHDL";
        var namereport = "Certificado de Retención";

        var featureSubs = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
        var featureMulti= runtime.isFeatureInEffect({ feature: "MULTIBOOK" });

        function execute(context) {

            // try {
            var idFiles = [];
            obtenerParametros();
            ObtenerDatosSubsidiaria();
            log.debug('transacciones',transacciones)
            for(key in transacciones){
                var arrKeys = Object.keys(transacciones[key]);
                log.debug('arrKeys',arrKeys)
                var retention = key;
                if (arrKeys.length != 0) {
                    jsonTransactionMunicip = obtenerTransaccionesXMunicipalidad(transacciones[key],retention);
                    
                    var testmunicipality = Object.keys(jsonTransactionMunicip);
                    //log.debug('testmunicipality: ', testmunicipality);
                    //log.debug('testmunicipality: ', jsonTransactionMunicip);
                    
                    for (key2 in jsonTransactionMunicip) {
                        municipality = key2;
                        name_muni = key2.split(' ').join('_');
                        idFiles.push(getPDF(jsonTransactionMunicip[key2],retention));
                    }
                }
            }
            CreateOrUpdatesLogs(idFiles);
            
            /*} catch (error) {
                var varMsgError = 'Importante: Error al generar el reporte.';
                log.error('error', error);
                libreriaReport.CreacionFormError(namereport, LMRY_script, varMsgError, error);
            }*/

        };

        function obtenerParametros() {

            var objContext = runtime.getCurrentScript();

            language = runtime.getCurrentScript().getParameter("LANGUAGE").substring(0, 2);

            if (!language) {
                language = 'en'
            }

            var filedataparam = objContext.getParameter({
                name: 'custscript_lmry_co_cert_reten_param_schd'
            });
            var paramsubsidi = '';
            if (filedataparam != '' && filedataparam != null) {
                var fileObj = file.load({
                    id: filedataparam
                });
                var dataContents = fileObj.getContents();
                
                dataparam = JSON.parse(dataContents);

                parametros = dataparam.parametros;
                
                transacciones = dataparam.transactions;
                otherMunicipality = dataparam.muni_by_vendor_o_subsi;
            }

            licenses = libreriaReport.getLicenses(parametros.id_subsidiary);

            //Obtener parametros
            
            log.debug('parametros', parametros);

        }

        function obtenerTransaccionesXMunicipalidad(transacciones,retention) {
            var jsonAgrupadoxMun = {};

            for (key in transacciones) {
                var headerMunicipality = transacciones[key]["municipality"];
                if (headerMunicipality != "") {
                    //TOTALES 
                    if (jsonAgrupadoxMun[headerMunicipality] == undefined) {
                        jsonAgrupadoxMun[headerMunicipality] = {}
                    }
                    if (jsonAgrupadoxMun[headerMunicipality][key] == undefined) {
                        jsonAgrupadoxMun[headerMunicipality][key] = {}
                    }
                    jsonAgrupadoxMun[headerMunicipality][key] = transacciones[key];
                } else {
                    if (jsonAgrupadoxMun[otherMunicipality] == undefined) {
                        jsonAgrupadoxMun[otherMunicipality] = {}
                    }
                    if (jsonAgrupadoxMun[otherMunicipality][key] == undefined) {
                        jsonAgrupadoxMun[otherMunicipality][key] = {}
                    }
                    jsonAgrupadoxMun[otherMunicipality][key] = transacciones[key];        
                }
            }
            return jsonAgrupadoxMun;
        }

        function ObtenerDatosSubsidiaria() {

            if (parametros.id_subsidiary != '') {
                var subsidiaryData = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: parametros.id_subsidiary,
                    columns: ['legalname','taxidnum','custrecord_lmry_dig_verificador','address1']
                });

                companyname = subsidiaryData.legalname;
                companydv = subsidiaryData.custrecord_lmry_dig_verificador;
                companyruc = ''+subsidiaryData.taxidnum;
                companyruc = cleanNit(companyruc)
                companyaddress = subsidiaryData.address1;

            } else {

                var pageConfig = config.load({
                    type: config.Type.COMPANY_INFORMATION
                });
                companyruc = ''+pageConfig.getValue('employerid');
                companyruc = cleanNit(companyruc)
                companydv = pageConfig.getValue('custrecord_lmry_dig_verificador');  
                companyname = configpage.getValue('legalname');
                companyaddress = pageConfig.getFieldValue('address1');
            }
        }

        function createFile(render_outpuFile) {
            var FolderId = objContext.getParameter({
                name: 'custscript_lmry_file_cabinet_rg_co'
            });
            var nameFile = getNameFile(extension)+".pdf";

            if (FolderId!= '' && FolderId != null){
                var templateRender = render.xmlToPdf(render_outpuFile);
                templateRender.name = nameFile;
                templateRender.folder = FolderId;
                var idfile = templateRender.save();
                return idfile;  
            }else{
                // Debug
                log.error({
                    title: 'Creacion de File:',
                    details: 'No existe el folder'
                });
            }
        }

        function getNameFile(id_extension) {

            var name = '';

            var Inicio_Fecha = formatDate(parametros.id_Fecha_ini,"_")
            var Final_Fecha = formatDate(parametros.id_Fecha_fin,"_")

            if(id_extension == 'pdf'){
                name = 'COCertificado' + reteType + '_' + companyruc + companydv + '_' + vendorruc + vendordv +  '_' + Inicio_Fecha + '_' + Final_Fecha + '_' + name_muni 
            }else if(id_extension == 'zip'){
                name = 'COCertificadoRetencion' + '_' + companyruc + companydv + '_' + vendorruc + vendordv +  '_' + Inicio_Fecha + '_' + Final_Fecha 
            }
            if (featureMulti == true || featureMulti == 'T') name += '_' + parametros.id_multibook;

            return name;
        }

        function CreateOrUpdatesLogs (id_files) {
            var urlfile = "";
            var objContext = runtime.getCurrentScript();

            if (id_files.length === 1) {
                var namefile = getNameFile(extension);
                var fileObject = file.load({
                    id: id_files[0]
                }); // Trae URL de archivo generado
                fileObject.name =  namefile + "." + extension;
                fileObject.save();
    
                var getURL = objContext.getParameter({
                    name: "custscript_lmry_netsuite_location"
                });
    
                if (getURL !== "" && getURL !== "") {
                    urlfile += 'https://' + getURL;
                }
    
                urlfile += fileObject.url;
            } else {
                //Crear Folder
                extension = "zip";

                var namefile = getNameFile(extension);

                var folderRoot = objContext.getParameter({
                    name: "custscript_lmry_file_cabinet_rg_co"
                });
                var folderId = deleteFolderFiles(namefile, folderRoot);
    
                var folderObject = record.load({
                    type: record.Type.FOLDER,
                    id: folderId
                });
    
                // Obtenemos las prefencias generales el URL de Netsuite (Produccion o Sandbox)
                var getURL = objContext.getParameter({
                    name: "custscript_lmry_netsuite_location"
                });
                if (getURL !== "" && getURL !== "") {
                    urlfile += 'https://' + getURL;
                }
                urlfile += '/core/media/downloadfolder.nl?id='+ folderId;
                
                for ( var i = 0; i < id_files.length; i++) {
                    var fileObject = file.load({
                        id: id_files[i]
                    });
    
                    fileObject.folder = folderId;
                    fileObject.save();
                }
            }

            var recordObj = record.load({
                type: 'customrecord_lmry_co_rpt_generator_log',
                id: parametros.id_rpt_generator_log
            });                  
       
            //Nombre de Archivo
            recordObj.setValue({
                fieldId: "custrecord_lmry_co_rg_name",
                value: namefile + "." + extension
            });
            //Url de Archivo
            recordObj.setValue({
                fieldId: "custrecord_lmry_co_rg_url_file",
                value: urlfile
            });

            recordObj.save();

            libreria.sendrptuser(namereport, 3, namefile);
            return true;
        }
        
        function deleteFolderFiles(nameFolder, rootFolder) {
            var busquedaFolder = search.create({
                type: search.Type.FOLDER,
                filters: [
                    ["name","is", nameFolder],
                    "AND",
                    ["parent","anyof", rootFolder]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid"
                    }),
                    search.createColumn({
                        name: "internalid",
                        join: "file",
                    })
                ]
            });
            var result = busquedaFolder.run().getRange(0,10);

            if (result.length > 0) {
                //Ya existe el Folder
                var columns = result[0].columns;
                var folderId = result[0].getValue(columns[0]);
    
                for (var i = 0; i < result.length; i++) {
                    var columns = result[i].columns;
                    var fileId = result[i].getValue(columns[1]);
                    file.delete({
                        id: fileId
                    });
                }
                return folderId;
                
            } else {
                var folderRecord = record.create({
                    type: record.Type.FOLDER,
                    isDynamic: true
                });
                folderRecord.setValue({fieldId: "name",value: nameFolder});
                folderRecord.setValue({fieldId: "parent",value: rootFolder});
                var folderId = folderRecord.save();
                return folderId;
            }  
        }

        //-------------------------------------------------------------------------------------------------------
        //Obtiene Informacion Vendor: CompanyName / VatRegNumber
        //-------------------------------------------------------------------------------------------------------
        function ObtainVendor(idvendor) {
            try {
                if (idvendor != '' && idvendor != null) {

                    var columnFrom_temp = search.lookupFields({
                        type: search.Type.VENDOR,
                        id: idvendor,
                        columns: ['companyname', 'vatregnumber', 'custentity_lmry_digito_verificator', "isperson", "firstname", "lastname"]
                    });

                    if (columnFrom_temp.isperson) {
                        var columnFrom1 = columnFrom_temp.firstname + " " + columnFrom_temp.lastname;
                    } else {
                        var columnFrom1 = columnFrom_temp.companyname;
                    }
                    companyname_vendor = ValidarAcentos(columnFrom1);

                    if (columnFrom_temp.vatregnumber != null && columnFrom_temp.vatregnumber != "" && columnFrom_temp.vatregnumber != "- None -") {
                        if (columnFrom_temp.custentity_lmry_digito_verificator != null && columnFrom_temp.custentity_lmry_digito_verificator != "" && columnFrom_temp.custentity_lmry_digito_verificator != "- None -") {
                            var columnFrom2 = ''+columnFrom_temp.vatregnumber;
                            vendorruc = cleanNit(columnFrom2);
                            var columnFrom3 = columnFrom_temp.custentity_lmry_digito_verificator;
                            vendordv = columnFrom3.substr(0, 1);
                            nit_vendor = columnFrom2 + "-" + columnFrom3.substr(0, 1);
                        } else {
                            var columnFrom2 = ''+columnFrom_temp.vatregnumber;
                            vendorruc = cleanNit(columnFrom2);
                            nit_vendor = columnFrom2 + "-" + " ";
                        }
                        vatRegNumberVendor = columnFrom2;
                    } else {
                        nit_vendor = "           ";
                    }
                }
            } catch (err) {
                log.debug('error: ', err);
            }
            return true;
        }

        //-------------------------------------------------------------------------------------------------------
        //Generacion archivo PDF
        //-------------------------------------------------------------------------------------------------------
        function getPDF(JsonTransactions,retention) {

            var montototalRet = 0;
            var montototalBase = 0;

            // Declaracion de variables
            var strName = '';
            var Inicio_Fecha = formatDate(parametros.id_Fecha_ini,"/")
            var Final_Fecha = formatDate(parametros.id_Fecha_fin,"/")

            var strConcepto = '';
            //  Para obtener el NIT o Cedula
            var nitCedula = ''
            if(companydv != null && companydv != ''){
                nitCedula = companyruc + '-' + companydv ;
            }else{
                nitCedula = companyruc;
            }

            switch (retention) {
                case 'transactionICA':
                    reteType = 'ReteICA';
                    strConcepto = 'Retencion ICA';
                    break;
                case 'transactionFTE':
                    reteType = 'ReteFte';
                    strConcepto = 'Retencion FTE';
                    break;
                case 'transactionIVA':
                    reteType = 'ReteIVA';
                    strConcepto = 'Retencion IVA';
                    break;
                
                default:
                    log.debug('El tipo de retencion no coincide con ICA, IVA o FTE');
            }

            GLOBAL_LABELS = {

                'es': {
                    'titulo': 'CERTIFICADO DE RETENCION',
                    'text1': 'Para dar Cumplimiento al articulo 381 de Estatuto Tributario, certificamos que durante el periodo comprendido entre el ' + Inicio_Fecha + " y el " + Final_Fecha + ' , practicamos retenciones a titulo de ' + reteType,
                    'text2': "Los valores retenidos fueron consignados oportunamente a favor de la DIRECCIÓN DE IMPUESTOS Y ADUANAS NACIONALES (DIAN) en la Ciudad de " + municipality + ".",
                    'textICA': "Los valores retenidos fueron consignados oportunamente a favor de la Secretaría de Hacienda Municipal en la ciudad de " + municipality + ".",
                    'cabecera': {
                        'concepto': 'CONCEPTO',
                        'factura': 'N. FACTURA',
                        'baseret': ['BASE', 'RETENCION'],
                        'porcentaje': 'PORC.',
                        'valorret': ['VALOR', 'RETENIDO'],
                        'municipality': "MUNICIPIO",
                    },
                    
                    'firma': "SE EXPIDE SIN FIRMA AUTOGRAFA",
                    'domicilio': "DOMICILIO PRINCIPAL: ",
                    'fecha': "FECHA DE EXPEDICION: "
                }
            }

            ObtainVendor(parametros.id_Vendor);
            //-------------------------------------------------------------------------------------------------------
            //LOGO
            //-------------------------------------------------------------------------------------------------------
            var strHead = '';
            try{
                var subsi_logo = '';
                subsi_logo = logoSubsidiary(parametros.id_subsidiary);
                subsi_logo = xml.escape(subsi_logo);
                strHead += "<div style=\"font-size: 10px; width:100%\">";
                strHead += "<img align=\"right\" src='" + subsi_logo + "' alt=\"logo\" height=\"50px\"></img>";
                strHead += "</div>";
            }catch(e){
                log.error('error de logo',e);
            }
            
            //-------------------------------------------------------------------------------------------------------
            //Cabecera del reporte
            //-------------------------------------------------------------------------------------------------------  
            
            strHead += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
            strHead += "<tr>";
            strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\" align=\"center\">";
            strHead += "<p>" + ValidarAcentos(companyname) + "</p>";
            strHead += "</td>";
            strHead += "</tr>";
            strHead += "<tr>";
            strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\" align=\"center\">";
            strHead += nitCedula;
            strHead += "</td>";
            strHead += "</tr>";
            strHead += "</table>";
            strHead += "<p></p>";

            strHead += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
            strHead += "<tr>";
            strHead += "<td style=\"text-align: center; font-size: 16pt; border: 0px solid #000000\" align=\"center\">";
            strHead += "<p>" + GLOBAL_LABELS['es']['titulo'] + "</p>";
            strHead += "</td>";
            strHead += "</tr>";
            // Impuesto

            strHead += "<tr>";
            strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
            strHead += GLOBAL_LABELS['es']['text1'];
            strHead += "</td>";
            strHead += "</tr>";

            strHead += "</table>";

            strHead += "<p></p>";
            strHead += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
            strHead += "<tr>";
            strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
            strHead += "<p>" + xml.escape(companyname_vendor) + "</p>";
            strHead += "</td>";
            strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
            strHead += "<p>" + nit_vendor + "</p>";
            strHead += "</td>";
            strHead += "</tr>";

            strHead += "</table>";
            strHead += "<p></p>";

            strName += strHead;

            //-------------------------------------------------------------------------------------------------------
            //Detalle del reporte
            //-------------------------------------------------------------------------------------------------------
            var strDeta = '';
            strDeta += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
            strDeta += "<tr>";
            strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"25mm\">";
            strDeta += "<p>" + GLOBAL_LABELS['es']['cabecera']['concepto'] + "</p>";
            strDeta += "</td>";
            strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"40mm\">";
            strDeta += "<p>" + GLOBAL_LABELS['es']['cabecera']['factura'] + "</p>";
            strDeta += "</td>";
            strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"40mm\">";
            strDeta += GLOBAL_LABELS['es']['cabecera']['baseret'][0];
            strDeta += "<br/>";
            strDeta += GLOBAL_LABELS['es']['cabecera']['baseret'][1];
            strDeta += "</td>";
            strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"30mm\">";
            strDeta += "<p>" + GLOBAL_LABELS['es']['cabecera']['porcentaje'] + "</p>";
            strDeta += "</td>";
            strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"40mm\">";
            strDeta += GLOBAL_LABELS['es']['cabecera']['valorret'][0];
            strDeta += "<br/>";
            strDeta += GLOBAL_LABELS['es']['cabecera']['valorret'][1];
            strDeta += "</td>";
            strDeta += "</tr>";

            for (idTransaction in JsonTransactions) {

                //NO. FACTURA
                var noFactura = JsonTransactions[idTransaction].transaction_no_factura;
                var arrRetencion = JsonTransactions[idTransaction].transaction_json;

                for (var i = 0; i < arrRetencion.length; i++) {

                    montototalRet = parseFloat(montototalRet) + parseFloat(Math.round(parseFloat(Number(arrRetencion[i]['lc_whtamount'])) * 100) / 100);
                    montototalBase = parseFloat(montototalBase) + parseFloat(Math.round(parseFloat(Number(arrRetencion[i]['lc_baseamount'])) * 100) / 100);

                    strDeta += "<tr>";
                    strDeta += "<td style=\"text-align: center; font-size: 9pt; border: 1px solid #000000\">";
                    strDeta += "<p>" + xml.escape(arrRetencion[i]['description']) + "</p>";
                    strDeta += "</td>";
                    strDeta += "<td style=\"text-align: center; font-size: 9pt; border: 1px solid #000000\">";
                    strDeta += "<p>" + xml.escape(noFactura) + "</p>";
                    strDeta += "</td>";
                    strDeta += "<td style=\"text-align: center; font-size: 9pt; border: 1px solid #000000\" align=\"right\">";
                    strDeta += "<p>" + FormatoNumero(parseFloat(arrRetencion[i]['lc_baseamount']).toFixed(2), "$") + "</p>";
                    strDeta += "</td>";
                    strDeta += "<td style=\"text-align: center; font-size: 9pt; border: 1px solid #000000\" align=\"right\">";
                    strDeta += "<p>" +  xml.escape(arrRetencion[i]['whtrate']) + "</p>";
                    strDeta += "</td>";
                    strDeta += "<td style=\"text-align: center; font-size: 9pt; border: 1px solid #000000\" align=\"right\">";
                    strDeta += "<p>" + FormatoNumero(parseFloat(arrRetencion[i]['lc_whtamount']).toFixed(2), "$") + "</p>";
                    strDeta += "</td>";
                    strDeta += "</tr>";

                }
            }

            strDeta += "<tr>";
            strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"50mm\">";
            strDeta += "<p>TOTAL</p>";
            strDeta += "</td>";
            strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"40mm\">";
            strDeta += "<p></p>";
            strDeta += "</td>";
            strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"right\" width=\"45mm\">";
            strDeta += "<p>" + FormatoNumero(parseFloat(montototalBase).toFixed(2), "$") + "</p>";
            strDeta += "</td>";
            strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"22mm\">";
            strDeta += "<p></p>";
            strDeta += "</td>";
            strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"right\" width=\"42mm\">";
            strDeta += "<p>" + FormatoNumero(parseFloat(montototalRet).toFixed(2), "$") + "</p>";
            strDeta += "</td>";
            strDeta += "</tr>";

            // cierra la tabla
            strDeta += "</table>";

            strName += strDeta;

            var strNpie = '';

            strNpie += "<p></p>";
            strNpie += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
            strNpie += "<tr>";
            strNpie += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
            if (reteType == 'ReteICA') {
                strNpie += GLOBAL_LABELS['es']['textICA']
            } else {
                strNpie += GLOBAL_LABELS['es']['text2'];
            }

            strNpie += "</td>";
            strNpie += "</tr>";
            strNpie += "</table>";

            strNpie += "<p></p>";
            strNpie += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
            strNpie += "<tr>";
            strNpie += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
            strNpie += GLOBAL_LABELS['es']['firma'];
            strNpie += "</td>";
            strNpie += "</tr>";
            strNpie += "<tr>";
            strNpie += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
            strNpie += "(ART .10 D.R. 836/91)";
            strNpie += "</td>";
            strNpie += "</tr>";

            var fecha_actual = new Date();
            fecha_actual = fecha_actual.getDate() + "/" + (fecha_actual.getMonth() + 1) + "/" + fecha_actual.getFullYear();

            strNpie += "<tr>";
            strNpie += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
            strNpie += GLOBAL_LABELS['es']['domicilio'] + xml.escape(companyaddress);
            strNpie += "</td>";
            strNpie += "</tr>";
            strNpie += "<tr>";
            strNpie += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
            strNpie += GLOBAL_LABELS['es']['fecha'] + fecha_actual;
            strNpie += "</td>";
            strNpie += "</tr>";
            strNpie += "</table>";
            strNpie += "<p></p>";

            strName += strNpie;

            Final_string = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
            Final_string += '<pdf><head><style> body {size:A4}</style></head><body>';
            Final_string += strName;
            Final_string += "</body>\n</pdf>";

            var idFile = createFile(Final_string);
            return idFile
        }

        function ValidarAcentos(s) {
            var AccChars = "ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ&°–—ªº·";
            var RegChars = "SZszYAAAAAACEEEEIIIIDOOOOOUUUUYaaaaaaceeeeiiiidooooouuuuyyyo--ao.";

            s = s.toString();
            for (var c = 0; c < s.length; c++) {
                for (var special = 0; special < AccChars.length; special++) {
                    if (s.charAt(c) == AccChars.charAt(special)) {
                        s = s.substring(0, c) + RegChars.charAt(special) + s.substring(c + 1, s.length);
                    }
                }
            }
            return s;
        }

        //-------------------------------------------------------------------------------------------------------
        //Formato de Numero con miles-decimales
        //-------------------------------------------------------------------------------------------------------
        function FormatoNumero(pNumero, pSimbolo) {
            var separador = ',';
            var sepDecimal = '.';

            var splitStr = pNumero.split('.');
            var splitLeft = splitStr[0];
            var splitRight = splitStr.length > 1 ? sepDecimal + splitStr[1] : '';
            var regx = /(\d+)(\d{3})/;
            while (regx.test(splitLeft)) {
                splitLeft = splitLeft.replace(regx, '$1' + separador + '$2');
            }
            pSimbolo = pSimbolo || '';
            var valor = pSimbolo + splitLeft + splitRight;
            return valor;
        }

        function logoSubsidiary(paramsubsidi) {

            if(featureSubs){
                
                var subsi = record.load({
                    type: "subsidiary",
                    id: paramsubsidi
                })
                //logo
                var subsi_log = subsi.getValue('custrecord_co_cert_logo') || subsi.getValue('logo');
            }else{

                var pageConfig = config.load({
                    type: config.Type.COMPANY_INFORMATION
                });

                var subsi_log = pageConfig.getValue('custrecord_co_cert_logo') || pageConfig.getValue('formlogo');
            }

            if (subsi_log) {
                var _logo = file.load({
                    id: subsi_log
                })

                var subsi_logo = _logo.url;
                var name_logo = _logo.name ;
                var host = url.resolveDomain({
                    hostType: url.HostType.APPLICATION,
                    accountId: runtime.accountId
                });

                return "https://" + host + subsi_logo;
            }
        }

        function formatDate(fecha,separador){
            var fechaFormato;
    
            var fecha_format = format.parse({
                value: fecha,
                type: format.Type.DATE
            });

            var MM = fecha_format.getMonth() + 1;
            var YYYY = fecha_format.getFullYear();
            var DD = fecha_format.getDate();

            if (('' + MM).length == 1) {
                MM = '0' + MM;
            }
            if (('' + DD).length == 1) {
                DD = '0' + DD;
            }

            fechaFormato = DD + separador + MM + separador + YYYY;
            return fechaFormato
        }

        
        function cleanNit(str) {
            str = str.replace(/,/g, "");
            str = str.replace(/-/g, "");
            str = str.replace(/\s/g, "");
            str = str.replace(/\./g, "");
            str = str.replace(/[^0-9]/g, '');
            return str;
        }

        return {
            execute: execute
        };
    });