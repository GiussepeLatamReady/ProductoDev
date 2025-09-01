/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_CO_CertifiRetencionesAcumulado_SCHDL_v2.0.js||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0    ABRIL 04 2023  LatamReady    Use Script 2.0          ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(["N/record", "N/runtime", "N/file", "N/search", "N/format", "N/log", "N/config",
    "./CO_Library_Mensual/LMRY_CO_Reportes_LBRY_V2.0.js", "N/render", "N/url", "N/xml",
    "/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js",
    "./LMRY_CO_Certificate_Massive_LIB.js"],

   function(record, runtime, file, search, format, log,
       config, libreria, render, url, xml, libreriaReport,Lib_certificate_massive) {
       var objContext = runtime.getCurrentScript();

       var anio = '';

       // Nombre del Reporte
       var namereport = "Reporte de Certificado de Retenciones Acumulado";
       var LMRY_script = 'LMRY CO Reportes Certificado de Retencion Acumulado SCHDL 2.0';

       //Parametros
       var paramsubsidi = '';
       var paramVendor = '';
       var paramTyreten = '';
       var paramidrpt = '';
       var paramMulti = '';
       var paramCont = '';
       var paramBucle = '';
       var paramGroupingMonth = '';
       var paramperiodanio = '';
       var paramOriginCity = '';
       var jsonNameMonth = {};
       var montototalBase = 0;
       var montototalRet = 0;
       var extension = 'pdf';

       //Control de Reporte
       var companyruc = '';
       var companydv = '';
       var companyname = '';
       var companyaddress = '';
       var companyname_vendor = '';
       var nit_vendor = '';
       var companycity = '';

       var retType = '';
       var autoRetType = '';
       var columnaCodWht = '';
       var filtroRetencionName = '';

       var ArrRetencion = {};
       ArrRetencion["transactionIVA"] = {};
       ArrRetencion["transactionFTE"] = {};
       ArrRetencion["transactionICA"] = {};
       ArrRetencion["transactionIVA"]["transactions"] = [];
       ArrRetencion["transactionFTE"]["transactions"] = [];
       ArrRetencion["transactionICA"]["transactions"] = [];

       var formulPeriodFilters = new Array();

       var result_wht_code;
       var searchresultWhtCode_fin;

       var strNameFile = 'CRA';
       var columnas_f = new Array();
       var ExchangerateC_S;
       
       // Para el logo de la subsidiaria
       var subsi_logo = ''

       /******************************************
        * @leny - Modificado el 28/08/2015
        * Nota: Variables para acumulacions de Montos.
        ******************************************/
       var nameDIAN = '';
       var municipality = '';
       var name_muni = '';

       //Features
       var featSubsi = null;
       var featMulti = null;
       var munixUniqueKey = {};

       var vendorField = 'custrecord_lmry_taxres_entity';
       var taxResultId = 'customrecord_lmry_br_transaction';

       var GLOBAL_LABELS = {};

       function execute(context) {

           //try {
           GLOBAL_LABELS = getGlobalLabels();

           var idFiles = [];

           ObtenerParametrosYFeatures();

           ObtenerDatosSubsidiaria();

           var hasVendorField = getVendorField();

           var arregloidPeriod = getPeriods(paramperiodanio, paramsubsidi) || [];

           log.debug('accounting arrperiod', arregloidPeriod);

           formulPeriodFilters = generarStringFilterPostingPeriodAnual(arregloidPeriod);
           log.debug('formulPeriodFilters', formulPeriodFilters);

           jsonNameMonth = obtenerMeses();
           for (var i=0; i < paramTyreten.length; i++){
               // Retencion ICA
               typeRetention((paramTyreten[i]));
               if (paramTyreten[i] == 1) {
                   var arrTransactions = [];
                   arrTransactions = arrTransactions.concat(ObtieneRetencionRete(paramTyreten[i]));
                   arrTransactions = arrTransactions.concat(ObtieneRetencionCabecera(paramTyreten[i]));

                   if(hasVendorField){
                    arrTransactions = arrTransactions.concat(ObtieneJournalRete(paramTyreten[i]));
                    arrTransactions = arrTransactions.concat(ObtieneJournalCabecera(paramTyreten[i]));
                   }
                   arrTransactions = groupRetentions(arrTransactions);
                   ArrRetencion["transactionICA"]["transactions"] = arrTransactions;
                   ArrRetencion["transactionICA"]["retention"] = paramTyreten[i];
               }
               // Retencion en la Fuente
               if (paramTyreten[i] == 2) {
                   var arrTransactions = [];
                   arrTransactions = arrTransactions.concat(ObtieneRetencionRete(paramTyreten[i]));
                   arrTransactions = arrTransactions.concat(ObtieneRetencionCabecera(paramTyreten[i]));

                   if(hasVendorField){
                    arrTransactions = arrTransactions.concat(ObtieneJournalRete(paramTyreten[i]));
                    arrTransactions = arrTransactions.concat(ObtieneJournalCabecera(paramTyreten[i]));
                   }
                   arrTransactions = groupRetentions(arrTransactions);
                   ArrRetencion["transactionFTE"]["transactions"] = arrTransactions;
                   ArrRetencion["transactionFTE"]["retention"] = paramTyreten[i];
               }
               // Retencion IVA
               if (paramTyreten[i] == 3) {
                   var arrTransactions = [];
                   arrTransactions = arrTransactions.concat(ObtieneRetencionRete(paramTyreten[i]));
                   arrTransactions = arrTransactions.concat(ObtieneRetencionCabecera(paramTyreten[i]));

                   if(hasVendorField){
                    arrTransactions = arrTransactions.concat(ObtieneJournalRete(paramTyreten[i]));
                    arrTransactions = arrTransactions.concat(ObtieneJournalCabecera(paramTyreten[i]));
                   }
                   arrTransactions = groupRetentions(arrTransactions);
                   ArrRetencion["transactionIVA"]["transactions"] = arrTransactions;
                   ArrRetencion["transactionIVA"]["retention"] = paramTyreten[i];
               }
           }

           log.debug('ArrRetencion result', ArrRetencion);

           for(key in ArrRetencion){
               var ArrRetencionTrans = ArrRetencion[key]["transactions"];
               var retention =  ArrRetencion[key]["retention"];

               if (ArrRetencionTrans.length != 0) {

                   if (paramOriginCity == 1) {
   
                       jsonTransactionMunicip = obtenerTransaccionesXMunicipalidad(ArrRetencionTrans);

                       for (key in jsonTransactionMunicip) {
                           //municipality = key;

                           name_muni = key.split(' ').join('_');
                           ArrRetencionTrans = jsonTransactionMunicip[key];
                           idFiles.push(GeneracionPDF(ArrRetencionTrans,retention,key));
                       }
                   } else {
                       name_muni = municipality.split(' ').join('_');
                       idFiles.push(GeneracionPDF(ArrRetencionTrans,retention,municipality));
                   }
               }
           }
           if(idFiles.length != 0) {
               CreateOrUpdatesLogs(idFiles);
           }else {
               RecordNoData();
               Lib_certificate_massive.continueExecutionFlow(paramVendor,paramidrpt,false,"","",true)
           }

           /*} catch (err) {
               libreria.sendMail(LMRY_script, ' [ execute ] ' + err);
               //var varMsgError = 'No se pudo procesar el Schedule.';
           }*/
       }

       //AGRUPA LAS TRANSACCIONES POR MUNICIPALIDAD
       function obtenerTransaccionesXMunicipalidad(ArrRetencion) {
           var jsonAgrupadoxMun = {};
           for (var i = 0; i < ArrRetencion.length; i++) {
               
               var municipalidad = (getNameMunicipalidad(ArrRetencion[i][5]) || municipality);

               if (jsonAgrupadoxMun[municipalidad] != undefined) {
                   jsonAgrupadoxMun[municipalidad].push(ArrRetencion[i]);
               } else {
                   jsonAgrupadoxMun[municipalidad] = [ArrRetencion[i]]
               }
           }
           return jsonAgrupadoxMun;
       }

       //-------------------------------------------------------------------------------------------------------
       //Formato de Numero con miles-decimales
       //-------------------------------------------------------------------------------------------------------
       function FormatoNumero(pNumero, pSimbolo) {
           var separador = ',';
           var sepDecimal = '.';

           pNumero = Number(pNumero).toFixed(2) == 0 ? 0 : Number(pNumero);
           pNumero = parseFloat(pNumero).toFixed(2);
           var splitStr = pNumero.split('.');
           var splitLeft = splitStr[0];
           var splitRight = splitStr.length > 1 ? sepDecimal + splitStr[1] : '';
           var regx = /(\d+)(\d{3})/;
           while (regx.test(splitLeft)) {
               splitLeft = splitLeft.replace(regx, '$1' + separador + '$2');
           }
           pSimbolo = pSimbolo || '';
           if (splitLeft.charAt(0) === '-') {
               splitLeft = splitLeft.slice(1)
               pSimbolo = '-' + pSimbolo
           }
           var valor = pSimbolo + splitLeft + splitRight;
           return valor;
       }

       //-------------------------------------------------------------------------------------------------------
       //Generaci?n Detalle Retencion en PDF
       //-------------------------------------------------------------------------------------------------------
       function DetalleRetencionxMes(ArrAcumulado, municipality ,retention) {
           var strAux = '';

           for (var i = 0; i <= ArrAcumulado.length - 1; i++) {

               montototalBase = parseFloat(montototalBase) + parseFloat(Math.round(parseFloat(Number(ArrAcumulado[i][1])) * 100) / 100);
               montototalRet = parseFloat(montototalRet) + parseFloat(Math.round(parseFloat(Number(ArrAcumulado[i][3])) * 100) / 100);

               strAux += "<tr>";
               strAux += "<td style=\"text-align: center; font-size: 9pt; border: 1px solid #000000\">";
               strAux += "<p>" + ArrAcumulado[i][4] + "</p>";
               strAux += "</td>";
               strAux += "<td style=\"text-align: center; font-size: 9pt; border: 1px solid #000000\">";
               strAux += "<p>" + xml.escape(ArrAcumulado[i][0]) + "</p>";
               strAux += "</td>";
               strAux += "<td style=\"text-align: center; font-size: 9pt; border: 1px solid #000000\" align=\"right\">";
               strAux += "<p>" + FormatoNumero(ArrAcumulado[i][1], "$") + "</p>";
               strAux += "</td>";
               strAux += "<td style=\"text-align: center; font-size: 9pt; border: 1px solid #000000\" align=\"right\">";
               strAux += "<p>" + FormatoNumero(ArrAcumulado[i][3], "$") + "</p>";
               strAux += "</td>";
               strAux += "</tr>";
           }

           return strAux;
       }

       function DetalleRetencion(ArrAcumulado, municipality ,retention) {
           var strAux = '';

           for (var i = 0; i <= ArrAcumulado.length - 1; i++) {
               montototalBase = parseFloat(montototalBase) + parseFloat(Math.round(parseFloat(Number(ArrAcumulado[i][1])) * 100) / 100);
               montototalRet = parseFloat(montototalRet) + parseFloat(Math.round(parseFloat(Number(ArrAcumulado[i][3])) * 100) / 100);
               strAux += "<tr>";
               strAux += "<td style=\"text-align: center; font-size: 9pt; border: 1px solid #000000\">";
               strAux += "<p>" + xml.escape(ArrAcumulado[i][0]) + "</p>";
               strAux += "</td>";
               strAux += "<td style=\"text-align: center; font-size: 9pt; border: 1px solid #000000\" align=\"right\">";
               strAux += "<p>" + FormatoNumero(ArrAcumulado[i][1], "$") + "</p>";
               strAux += "</td>";
               strAux += "<td style=\"text-align: center; font-size: 9pt; border: 1px solid #000000\" align=\"right\">";
               strAux += "<p>" + FormatoNumero(ArrAcumulado[i][3], "$") + "</p>";
               strAux += "</td>";
               strAux += "</tr>";
           }

           return strAux;
       }



       function getNameFile(retention,id_extension) {
           var name = '';
           switch (retention) {
               case '1':
                   retType = 'ReteICA';
                   break;
               case '2':
                   retType = 'ReteFTE';
                   break;
               case '3':
                   retType = 'ReteIVA';
                   break;
             /*  case '4':
                   retType = 'RETENCION';
                   break;*/
           }

           if(id_extension == 'pdf'){
               name = strNameFile + '_' + retType + '_' + companyruc + companydv + '_' + anio + '_' + paramsubsidi + '_'+ name_muni + '_'+ nit_vendor
           }else if(id_extension == 'zip'){
               name = strNameFile + '_' + companyruc + companydv + '_' + anio + '_' + paramsubsidi + '_'+ nit_vendor
           }
           if (featMulti == true || featMulti == 'T') name += '_' + paramMulti;

           return name;   
       }


       function calcularAnio() {

           //Mostrar año
         
           var periodAnioSearchObj = search.lookupFields({
               type: search.Type.ACCOUNTING_PERIOD,
               id: paramperiodanio,
               columns: ['startdate', 'enddate']
           });
           var periodStartDate = periodAnioSearchObj.enddate;
           var fecha_format = format.parse({
               value: periodStartDate,
               type: format.Type.DATE
           });
           anio = fecha_format.getFullYear();     
       }

       //-------------------------------------------------------------------------------------------------------
       // Graba el archivo en el Gabinete de Archivos
       //-------------------------------------------------------------------------------------------------------
       function SaveFile(retention,Final_string) {
           var objContext = runtime.getCurrentScript();

           var FolderId = objContext.getParameter({
               name: 'custscript_lmry_file_cabinet_rg_co'
           });
           var nameFile = getNameFile(retention,extension)+".pdf";

           if (FolderId!= '' && FolderId != null){
               var templateRender = render.xmlToPdf(Final_string);
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
       
       function CreateOrUpdatesLogs (id_files) {

           var urlfile = "";
           var objContext = runtime.getCurrentScript();

           if (id_files.length === 1) {
               var namefile = getNameFile('',extension);
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

               var namefile = getNameFile('',extension);

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
               id: paramidrpt
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
           Lib_certificate_massive.continueExecutionFlow(paramVendor,paramidrpt,false,namefile + "." + extension,urlfile,false)
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
                   var fileId = result[i].getValue(columns[1]) || '';

                    if(!fileId) continue;

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
       
       function RecordNoData() {
           log.error('ENTRO', 'entro RecordNoData');
           var RecNoData = record.load({
               type: 'customrecord_lmry_co_rpt_generator_log',
               id: paramidrpt
           });

           //Nombre de Archivo
           RecNoData.setValue({
               fieldId: 'custrecord_lmry_co_rg_name',
               value: 'No existe informacion para los criterios seleccionados.'
           });

           var recordId = RecNoData.save();
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
                           var columnFrom2 = columnFrom_temp.vatregnumber;
                           var columnFrom3 = columnFrom_temp.custentity_lmry_digito_verificator;
                           nit_vendor = columnFrom2 + "-" + columnFrom3.substr(0, 1);
                       } else {
                           var columnFrom2 = columnFrom_temp.vatregnumber;
                           nit_vendor = columnFrom2;
                       }
                   } else {
                       nit_vendor = "           ";
                   }
               }
           } catch (err) {
               sendemail(' [ ObtainVendor ] ' + err, LMRY_script);
           }
           return true;
       }

       //-------------------------------------------------------------------------------------------------------
       //Generaci?n archivo PDF
       //-------------------------------------------------------------------------------------------------------
       function GeneracionPDF(ArrRetencion, retention, municipality) {

           var noDataFound = true;
           var title = getTitle(retention);
           var Final_string;

           // Declaracion de variables
           var strName = '';

           var anio_gravable = anio;
           
           ObtainVendor(paramVendor);
           
           //-------------------------------------------------------------------------------------------------------
           //Cabecera del reporte
           //-------------------------------------------------------------------------------------------------------
           var strHead = '';
           try{
               subsi_logo = logoSubsidiary(paramsubsidi);
               subsi_logo = xml.escape(subsi_logo);
           //  Para el logo
               strHead += "<div style=\"font-size: 10px; width:100%\">";
               strHead += "<img align=\"right\" src='" + subsi_logo + "' alt=\"logo\" height=\"50px\"></img>";
               strHead += "</div>";
           }catch(e){
               log.error('error de logo',e);
           }
           var CedulaNIT = ''
           if(companydv != null && companydv != ''){
               CedulaNIT = companyruc + '-' + companydv ;
           }else{
               CedulaNIT = companyruc;
           }

           //  Head
           strHead += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
           strHead += "<tr>";
           strHead += "<td style=\"text-align: center; font-size: 16pt; border: 0px solid #000000\" align=\"center\">";
           strHead += "<p>" + title + "</p>";
           strHead += "</td>";
           strHead += "</tr>";
           strHead += "<tr>";
           strHead += "<td style=\"text-align: center; font-size: 14pt; border: 0px solid #000000\" align=\"center\">";
           strHead += "<p>" + GLOBAL_LABELS['AnioGravable']["es"] + anio_gravable + "</p>";
           strHead += "</td>";
           strHead += "</tr>";

           // Impuesto ICA
           if (retention == 1) {
               strHead += "<tr>";
               strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
               strHead += GLOBAL_LABELS['Articulo381_ICA']["es"];
               strHead += "</td>";
               strHead += "</tr>";
           }
           // Impuesto RENTA
           if (retention == 2) {
               strHead += "<tr>";
               strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
               strHead += GLOBAL_LABELS['Articulo381_RENTA']["es"];
               strHead += "</td>";
               strHead += "</tr>";
           }
           // Impuesto IVA
           if (retention == 3) {
               strHead += "<tr>";
               strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
               strHead += GLOBAL_LABELS['Articulo381_IVA']["es"];
               strHead += "</td>";
               strHead += "</tr>";
           }

           
           strHead += "</table>";

           strHead += "<p></p>";


           strHead += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
           strHead += "<tr>";
           //  Agente Retenedor
           strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
           strHead += "<p><b>" + GLOBAL_LABELS['AgenteRetenedor']["es"] + "</b></p>";
           strHead += "</td>";
           strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
           strHead += "<p>" + xml.escape(ValidarAcentos(companyname)) + "</p>";
           strHead += "</td>";
           strHead += "<td></td>";
           strHead += "<td></td>";
           strHead += "<td></td>";
           strHead += "</tr>";

           //  NIT o Cédula
           strHead += "<tr>";
           strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
           strHead += "<p><b>" + GLOBAL_LABELS['NITCédula']["es"] + "</b></p>";
           strHead += "</td>";
           strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
           strHead += "<p>" + CedulaNIT + "</p>";
           strHead += "</td>";
           strHead += "<td>";
           strHead += "</td>";
           strHead += "</tr>";

           //  Dirección
           strHead += "<tr>";
           strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
           strHead += "<p><b>" + GLOBAL_LABELS['Direccion']["es"] + "</b></p>";
           strHead += "</td>";
           strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
           strHead += "<p>" + xml.escape(ValidarAcentos(companyaddress)) + "</p>";
           strHead += "</td>";
           strHead += "</tr>";

           //  Ciudad
           strHead += "<tr>";
           strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
           strHead += "<p><b>" + GLOBAL_LABELS['Ciudad']["es"] + "</b></p>";
           strHead += "</td>";
           strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
           strHead += "<p>" + companycity + "</p>";
           strHead += "</td>";
           strHead += "</tr>";

           strNpie += "<p></p>";

           //  Pagado a
           strHead += "<tr>";
           strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
           strHead += "<p><b>" + GLOBAL_LABELS['PagadoA']["es"] + "</b></p>";
           strHead += "</td>";
           strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
           strHead += "<p>" + xml.escape(companyname_vendor) + "</p>";
           strHead += "</td>";
           strHead += "</tr>";

           //  NIT/ Cédula
           strHead += "<tr>";
           strHead += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
           strHead += "<p><b>" + GLOBAL_LABELS['NIT/Cédula']["es"] + "</b></p>";
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

           montototalBase = 0;
           montototalRet = 0;

           //TODO: CREAR EL PARAMETRO QUE VENGA DESDE EL SUITELET
           if (paramGroupingMonth == true || paramGroupingMonth == 'T') {
               var strDeta = '';
               strDeta += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
               strDeta += "<tr>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"16%\">";
               strDeta += "<p>" + GLOBAL_LABELS['MES']["es"] + "</p>";
               strDeta += "</td>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"40%\">";
               strDeta += "<p>" + GLOBAL_LABELS['CONCEPTO']["es"] + "</p>";
               strDeta += "</td>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"22%\">";
               strDeta += GLOBAL_LABELS['BASE']["es"] + "<br/>";
               strDeta += GLOBAL_LABELS['RETENCION']["es"];
               strDeta += "</td>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"22%\">";
               strDeta += GLOBAL_LABELS['VALOR']["es"] + "<br/>";
               strDeta += GLOBAL_LABELS['RETENIDO']["es"];
               strDeta += "</td>";
               strDeta += "</tr>";
       
               var jsonRetencionxmes = getJsonxMes(ArrRetencion);
               log.debug('getJsonxMes jsonRetencionxmes',jsonRetencionxmes)
               var arrMesesOrdenado = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
               for (var m = 0; m < arrMesesOrdenado.length; m++) {
                   if (jsonRetencionxmes[arrMesesOrdenado[m]] != undefined) {
                       var ArrAcumulado = AcumuladoPorConcept(jsonRetencionxmes[arrMesesOrdenado[m]]);
                       if (ArrAcumulado.length != null && ArrAcumulado.length != 0) {
                           noDataFound = false;
                           strDeta += DetalleRetencionxMes(ArrAcumulado, municipality, retention);
                       }
                   }
               }

               strDeta += "<tr>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\">";
               strDeta += "<p>TOTAL</p>";
               strDeta += "</td>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\">";
               strDeta += "<p></p>";
               strDeta += "</td>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"right\">";
               strDeta += "<p>" + FormatoNumero(montototalBase, "$") + "</p>";
               strDeta += "</td>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"right\">";
               strDeta += "<p>" + FormatoNumero(montototalRet, "$") + "</p>";
               strDeta += "</td>";
               strDeta += "</tr>";

               if (noDataFound) {
                   RecordNoData();
                   return false;
               }

           } else {
               var strDeta = '';
               strDeta += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
               strDeta += "<tr>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"50%\">";
               strDeta += "<p>" + GLOBAL_LABELS['CONCEPTO']["es"] + "</p>";
               strDeta += "</td>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"25%\">";
               strDeta += GLOBAL_LABELS['BASE']["es"] + "<br/>";
               strDeta += GLOBAL_LABELS['RETENCION']["es"];
               strDeta += "</td>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\" width=\"25%\">";
               strDeta += GLOBAL_LABELS['VALOR']["es"] + "<br/>";
               strDeta += GLOBAL_LABELS['RETENIDO']["es"];
               strDeta += "</td>";
               strDeta += "</tr>";

               var ArrAcumulado = [];
               ArrAcumulado = AcumuladoPorConcept(ArrRetencion);

               if (ArrAcumulado.length != null && ArrAcumulado.length != 0) {
                   strDeta += DetalleRetencion(ArrAcumulado, municipality, retention);
               } else {
                   RecordNoData();
                   return false;
               }

               strDeta += "<tr>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"center\">";
               strDeta += "<p>TOTAL</p>";
               strDeta += "</td>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"right\">";
               strDeta += "<p>" + FormatoNumero(montototalBase, "$") + "</p>";
               strDeta += "</td>";
               strDeta += "<td style=\"text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #000000\" align=\"right\">";
               strDeta += "<p>" + FormatoNumero(montototalRet, "$") + "</p>";
               strDeta += "</td>";
               strDeta += "</tr>";
           }

           // cierra la tabla
           strDeta += "</table>";

           strName += strDeta;

           //-------------------------------------------------------------------------------------------------------
           //Pie de p?gina del reporte
           //-------------------------------------------------------------------------------------------------------
           var strNpie = '';
           strNpie += "<p></p>";
           if (retention == 1) //RETEICA
           {
               strNpie += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
               strNpie += "<tr>";
               strNpie += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
               strNpie += GLOBAL_LABELS['RETEICA_PIE']["es"] + municipality + ".";
               strNpie += "</td>";
               strNpie += "</tr>";
               strNpie += "</table>";

           } else {

               strNpie += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
               strNpie += "<tr>";
               strNpie += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
               strNpie += GLOBAL_LABELS['PIE']["es"] + municipality + ".";
               strNpie += "</td>";
               strNpie += "</tr>";
               strNpie += "</table>";

           }
           strNpie += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
           strNpie += "<tr>";
           strNpie += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
           if (retention == 1) {
               strNpie += GLOBAL_LABELS['FirmaAutografaReteICA']["es"];
           }
           if (retention == 2) {
               strNpie += GLOBAL_LABELS['FirmaAutografaReteFTE']["es"];
           }
           if (retention == 3) {
               strNpie += GLOBAL_LABELS['FirmaAutografaReteIVA']["es"];
           }
           
           strNpie += "</td>";
           strNpie += "</tr>";

           var auxDireccion = '';
           if (companyaddress != '') {
               var auxStr = companyaddress.split('\n');
               auxDireccion = auxStr[1];
           }
           var fecha_actual = new Date();
           var date = fecha_actual.getDate();
           if ((date + '').length == 1) {
               date = '0' + date;
           }
           DD = date;
           var mes = fecha_actual.getMonth() + 1;
           if ((mes + '').length == 1) {
               mes = '0' + mes;
           }
           MM = mes;
           YYYY = fecha_actual.getFullYear();
           fecha_actual = DD + "/" + MM + "/" + YYYY;

           strNpie += "<tr>";
           strNpie += "<td style=\"text-align: center; font-size: 10pt; border: 0px solid #000000\">";
           strNpie += GLOBAL_LABELS['FechaExpedicion']["es"] + fecha_actual;
           strNpie += "</td>";
           strNpie += "</tr>";
           strNpie += "</table>";
           strNpie += "<p></p>";

           strName += strNpie;

           Final_string = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
           Final_string += '<pdf><head><style> body {size:A4}</style></head><body>';
           Final_string += strName;
           Final_string += "</body>\n</pdf>";

           var idfile = SaveFile(retention,Final_string);

           log.debug('idfile', idfile);

           return idfile;
       }


       function ObtieneRetencionCabecera(paramTyreten) {
           //RETENCION EN LINEA
           var _cont = 0;
           var intDMinReg = Number(paramBucle) * 1000;
           var intDMaxReg = intDMinReg + 1000;
           var DbolStop = false;
           var arrAuxiliar = new Array();
           var arrRetencion = new Array();
           var ArrReteAux = new Array();

           var saved_search = search.create({
               type: "transaction",
               filters:
               [
                  ["formulatext: CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_br_type} IN ('"+retType+"', '"+autoRetType+"') THEN 1 ELSE 0 END","is","1"], 
                  "AND", 
                  ["posting","is","T"], 
                  "AND", 
                  ["type","anyof","VendCred","VendBill"], 
                  "AND", 
                  ["mainline","is","F"], 
                  "AND", 
                  ["voided","is","F"], 
                  "AND", 
                  ["formulatext: CASE WHEN {customform} = 'Latam WHT - Vendor Bill' THEN 1 ELSE CASE WHEN {customform} = 'Latam WHT - Vendor Credit' THEN 2 ELSE 0 END END","is","0"],
                  "AND",
                  [filtroRetencionName,"is","0"]
               ],
               columns:
               [
                  search.createColumn({
                     name: "formulatext",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_type}",
                     label: "0. Código WHT"
                  }),
                  search.createColumn({
                     name: "formulanumeric",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent} * 10000",
                     label: "1. tasa"
                  }),
                  search.createColumn({name: "entity", label: "2. Razón Social / Individuo"}),
                  search.createColumn({name: "type", label: "3. Tipo de Transaccion"}),
                  search.createColumn({name: "tranid", label: "4. Número de transacción"}),
                  search.createColumn({name: "memo", label: "5. Nota"}),
                  search.createColumn({
                     name: "formulacurrency",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_base_amount}",
                     label: "6. Base imponible"
                  }),
                  search.createColumn({
                     name: "formulacurrency",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_total}",
                     label: "7. Retencion"
                  }),
                  search.createColumn({name: "trandate", label: "8. Date"}),
                  search.createColumn({
                     name: "formulanumeric",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent} * 10000",
                     label: "9. Latam - CO ReteICA"
                  }),
                  search.createColumn({
                     name: "formulatext",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_accounting_books}",
                     label: "exhange rate total"
                  })
               ]
            });

           if (featSubsi) {
               var subsidiaryFilter = search.createFilter({
                   name: 'subsidiary',
                   operator: search.Operator.IS,
                   values: [paramsubsidi]
               });
               saved_search.filters.push(subsidiaryFilter);
           }


           var periodFilter = search.createFilter({
               name: "formulatext",
               formula: formulPeriodFilters,
               operator: search.Operator.IS,
               values: "1"
           });
           saved_search.filters.push(periodFilter);



           var vendorLineFilter = search.createFilter({
               name: 'formulanumeric',
               formula: "CASE WHEN NVL({custcol_lmry_exp_rep_vendor_colum.internalid},{vendor.internalid}) = " + paramVendor +
                   " THEN 1 ELSE 0  END",
               operator: search.Operator.EQUALTO,
               values: 1
           })
           saved_search.filters.push(vendorLineFilter);

           //Filtro para excluir Tax Results creados por Modulo Header
           var linesFilter = search.createFilter({
               join: "custrecord_lmry_br_transaction",
               name: "custrecord_lmry_co_acc_exo_concept",
               operator: "noneof",
               values: ["@NONE@"]
           })
           saved_search.filters.push(linesFilter);
           
           var taxResultsFilter = search.createFilter({
               formula: "CASE WHEN {lineuniquekey} = {custrecord_lmry_br_transaction.custrecord_lmry_lineuniquekey} THEN 1 ELSE 0 END",
               name: "formulanumeric",
               operator: search.Operator.EQUALTO,
               values: 1
           })
           saved_search.filters.push(taxResultsFilter);

           if (featMulti) {
               var multibookFilter = search.createFilter({
                   name: 'accountingbook',
                   join: 'accountingtransaction',
                   operator: search.Operator.IS,
                   values: [paramMulti]
               });
               saved_search.filters.push(multibookFilter);
           }

           //Obtener ID del National Tax o Contributory Class
           var idNational_or_Contributory = search.createColumn({
               name: "formulatext",
               formula: columnaCodWht,
               label: "11. WHT Name"
           });
           saved_search.columns.push(idNational_or_Contributory);

           //Obtener label National Tax o Contributory Class
           var nameNational_or_Contributory = search.createColumn({
               name: "formulatext",
               formula: "'0'",
               label: "12.National_o_Contributory"
           });
           saved_search.columns.push(nameNational_or_Contributory);


           //LATAM - BASE AMOUNT LOCAL CURRENCY
           var baseAmountCurrency = search.createColumn({
               name: "formulatext",
               formula: "{custrecord_lmry_br_transaction.custrecord_lmry_base_amount_local_currc}",
               label: "13. LATAM - BASE AMOUNT LOCAL CURRENCY"
           });
           saved_search.columns.push(baseAmountCurrency);


           //LATAM - AMOUNT LOCAL CURRENCY
           var amountLocalCurrency = search.createColumn({
               name: "formulatext",
               formula: "{custrecord_lmry_br_transaction.custrecord_lmry_amount_local_currency}",
               label: "14.LATAM - AMOUNT LOCAL CURRENCY"
           });
           saved_search.columns.push(amountLocalCurrency);

           //10.-Municipalidad
           var municipTransaction = search.createColumn({
               name: "internalid",
               join: "CUSTBODY_LMRY_MUNICIPALITY",
               label: "15. Municipality"
           });
           saved_search.columns.push(municipTransaction);

           var postingPeriodColumn = search.createColumn({
               name: 'postingperiod',
               label: "16. PERIODO"
           });
           saved_search.columns.push(postingPeriodColumn);

           //Internalid
           var lineuniquekey = search.createColumn({
               name: "formulatext",
               formula: "{internalid}",
               label: "17. Internalid"
           });
           saved_search.columns.push(lineuniquekey);

           var searchresult = saved_search.run();
           while (!DbolStop) {
               var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

               if (objResult != null) {
                   var intLength = objResult.length;
                   if (intLength != 1000) {
                       DbolStop = true;
                   }

                   for (var i = 0; i < intLength; i++) {

                       var columns = objResult[i].columns;
                       //log.debug('objResult',objResult)
                       arrRetencion = new Array();
                       arrAuxiliar = new Array();

                       // 0. C?DIGO WHT
                       if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -') {
                           arrAuxiliar[0] = objResult[i].getValue(columns[11]);
                       } else
                           arrAuxiliar[0] = '';
                       // 1. TASA
                       if (objResult[i].getValue(columns[1]) != null && objResult[i].getValue(columns[1]) != '- None -') {
                           arrAuxiliar[1] = Number(objResult[i].getValue(columns[1])).toFixed(6);
                       } else
                           arrAuxiliar[1] = '0.00';
                       // 2. RAZ?N SOCIAL / INDIVIDUO
                       if (objResult[i].getValue(columns[2]) != null && objResult[i].getValue(columns[2]) != '- None -') {
                           arrAuxiliar[2] = objResult[i].getValue(columns[2]);
                       } else
                           arrAuxiliar[2] = '';

                       // 3. TIPO DE TRANSACCI?N
                       if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -') {
                           arrAuxiliar[3] = objResult[i].getValue(columns[3]);
                       } else
                           arrAuxiliar[3] = '';

                       // 4. NUMERO DE TRANSACCI?N
                       if (objResult[i].getValue(columns[4]) != null && objResult[i].getValue(columns[4]) != '- None -') {
                           arrAuxiliar[4] = objResult[i].getValue(columns[4]);
                       } else
                           arrAuxiliar[4] = '';

                       // 5. NOTA
                       if (objResult[i].getValue(columns[5]) != null && objResult[i].getValue(columns[5]) != '- None -') {
                           arrAuxiliar[5] = objResult[i].getValue(columns[5]);
                       } else
                           arrAuxiliar[5] = '';

                       //G. exchange rate cabecera y multibook

                       if (objResult[i].getValue(columns[10]) != null && objResult[i].getValue(columns[10]) != '- None -' && objResult[i].getValue(columns[10]) != '') {
                           var ExchangerateAux = objResult[i].getValue(columns[10]);
                           ExchangerateC_S = exchange_rate(ExchangerateAux);
                       } else {
                           ExchangerateC_S = 1;
                       }

                       // 6. BASE IMPONIBLE
                       if (objResult[i].getValue(columns[13]) != null && objResult[i].getValue(columns[13]) != '- None -' && objResult[i].getValue(columns[13]) != '') {
                           arrAuxiliar[6] = objResult[i].getValue(columns[13]);
                       } else {
                           /*if (objResult[i].getValue(columns[6]) != null && objResult[i].getValue(columns[6]) != '- None -') {
                               arrAuxiliar[6] = (parseFloat(objResult[i].getValue(columns[6]))) * (Number(ExchangerateC_S));
                           } else {*/
                            arrAuxiliar[6] = 0;
                           //}
                       }

                       arrAuxiliar[6] =  Math.abs(arrAuxiliar[6]);

                       // 7. RETENCION
                       if (objResult[i].getValue(columns[14]) != null && objResult[i].getValue(columns[14]) != '- None -' && objResult[i].getValue(columns[14]) != '') {
                           arrAuxiliar[7] = objResult[i].getValue(columns[14]);
                       } else {
                           /*if (objResult[i].getValue(columns[7]) != null && objResult[i].getValue(columns[7]) != '- None -') {
                               arrAuxiliar[7] = (parseFloat(objResult[i].getValue(columns[7]))) * (Number(ExchangerateC_S));
                           } else {*/
                            arrAuxiliar[7] = 0;
                           //}
                       }

                       if (arrAuxiliar[3] == "VendBill" || arrAuxiliar[3] == "Factura" ) {
                           arrAuxiliar[6] = Math.abs(arrAuxiliar[6]);
                           arrAuxiliar[7] = Math.abs(arrAuxiliar[7]);
                       } else if (arrAuxiliar[3] == "VendCred" || arrAuxiliar[3] == "Crédito de factura") {
                           arrAuxiliar[6] = -Math.abs(arrAuxiliar[6]);
                           arrAuxiliar[7] = -Math.abs(arrAuxiliar[7]);
                       }

                       //8. FECHA
                       if (objResult[i].getValue(columns[8]) != null && objResult[i].getValue(columns[8]) != '- None -') {
                           arrAuxiliar[8] = objResult[i].getValue(columns[8]);
                       } else
                           arrAuxiliar[8] = '';

                       //9. DESCRIPCION
                       if (objResult[i].getValue(columns[9]) != null && objResult[i].getValue(columns[9]) != '- None -') {
                           arrAuxiliar[9] = Number(objResult[i].getValue(columns[9])).toFixed(6);
                       } else
                           arrAuxiliar[9] = '';


                       //10. MUNICIPAILTY
                       if (objResult[i].getValue(columns[15]) != null && objResult[i].getValue(columns[15]) != '- None -' && paramOriginCity == 1 ) {
                           arrAuxiliar[10] = objResult[i].getValue(columns[15]);
                       } else{
                           arrAuxiliar[10] = '';
                       }

                       //11. POSTING PERIOD
                       if (objResult[i].getValue(columns[16]) != null && objResult[i].getValue(columns[16]) != '- None -') {
                           arrAuxiliar[11] = objResult[i].getValue(columns[16]);
                       } else
                           arrAuxiliar[11] = '';

                       //12. InternalId
                       if (objResult[i].getValue(columns[17]) != null && objResult[i].getValue(columns[17]) != '- None -') {
                            arrAuxiliar[12] = objResult[i].getValue(columns[17]);
                        } else
                            arrAuxiliar[12] = '';

                       //COLUMNA DE RETENCIONES IMPORTANTES(Concepto, factura, base retención, porc, valor retenido)
                       arrRetencion[0] = arrAuxiliar[0];
                       arrRetencion[1] = arrAuxiliar[4];
                       arrRetencion[2] = arrAuxiliar[6];
                       arrRetencion[3] = arrAuxiliar[9];
                       arrRetencion[4] = arrAuxiliar[7];
                       arrRetencion[5] = arrAuxiliar[10];
                       arrRetencion[6] = jsonNameMonth[arrAuxiliar[11]];
                       arrRetencion[7] = arrAuxiliar[12];
                       arrRetencion[8] = paramTyreten;

                       ArrReteAux[_cont] = arrRetencion;
                       _cont++;
                   }
                   intDMinReg = intDMaxReg;
                   intDMaxReg += 1000;
                   if (intLength < 1000) {
                       DbolStop = true;
                   }

               } else {
                   DbolStop = true;
               }
           }
           var arrRetencion = new Array();
           log.debug('main ArrReteAux'+ paramTyreten , ArrReteAux)
           return ArrReteAux ;
       }

       

       function ObtieneRetencionRete(paramTyreten) {
           //RETENCION EN LINEA
           var _cont = 0;
           var intDMinReg = Number(paramBucle) * 1000;
           var intDMaxReg = intDMinReg + 1000;
           var DbolStop = false;
           var arrAuxiliar = new Array();
           var arrRetencion = new Array();
           var ArrReteAux = new Array();

           var saved_search = search.create({
               type: "transaction",
               filters:
               [
                  ["formulatext: CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_br_type} IN ('"+retType+"', '"+autoRetType+"') THEN 1 ELSE 0 END","is","1"], 
                  "AND", 
                  ["posting","is","T"], 
                  "AND", 
                  ["type","anyof","VendCred","VendBill"], 
                  "AND", 
                  ["mainline","is","F"], 
                  "AND", 
                  ["voided","is","F"], 
                  "AND", 
                  ["formulatext: CASE WHEN {customform} = 'Latam WHT - Vendor Bill' THEN 1 ELSE CASE WHEN {customform} = 'Latam WHT - Vendor Credit' THEN 2 ELSE 0 END END","is","0"]
               ],
               columns:
               [
                  search.createColumn({
                     name: "formulatext",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_type}",
                     label: "0. Código WHT"
                  }),
                  search.createColumn({
                     name: "formulanumeric",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent} * 10000",
                     label: "1. tasa"
                  }),
                  search.createColumn({name: "entity", label: "2. Razón Social / Individuo"}),
                  search.createColumn({name: "type", label: "3. Tipo de Transaccion"}),
                  search.createColumn({name: "tranid", label: "4. Número de transacción"}),
                  search.createColumn({name: "memo", label: "5. Nota"}),
                  search.createColumn({
                     name: "formulacurrency",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_base_amount}",
                     label: "6. Base imponible"
                  }),
                  search.createColumn({
                     name: "formulacurrency",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_total}",
                     label: "7. Retencion"
                  }),
                  search.createColumn({name: "trandate", label: "8. Date"}),
                  search.createColumn({
                     name: "formulanumeric",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent} * 10000",
                     label: "9. Latam - CO Percente"
                  }),
                  search.createColumn({
                     name: "formulatext",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_accounting_books}",
                     label: "Exchange rate total"
                  })
               ]
            });

           if (featSubsi) {
               var subsidiaryFilter = search.createFilter({
                   name: 'subsidiary',
                   operator: search.Operator.IS,
                   values: [paramsubsidi]
               });
               saved_search.filters.push(subsidiaryFilter);
           }


           var periodFilter = search.createFilter({
               name: "formulatext",
               formula: formulPeriodFilters,
               operator: search.Operator.IS,
               values: "1"
           });
           saved_search.filters.push(periodFilter);


           var vendorLineFilter = search.createFilter({
               name: 'formulanumeric',
               formula: "CASE WHEN NVL({custcol_lmry_exp_rep_vendor_colum.internalid},{vendor.internalid}) = " + paramVendor +
                   " THEN 1 ELSE 0  END",
               operator: search.Operator.EQUALTO,
               values: 1
           })
           saved_search.filters.push(vendorLineFilter);

           //Filtro para excluir Tax Results creados por Modulo Header
           var linesFilter = search.createFilter({
               join: "custrecord_lmry_br_transaction",
               name: "custrecord_lmry_co_acc_exo_concept",
               operator: "anyof",
               values: ["@NONE@"]
           })
           saved_search.filters.push(linesFilter);
           
           var taxResultsFilter = search.createFilter({
               formula: "CASE WHEN {lineuniquekey} = {custrecord_lmry_br_transaction.custrecord_lmry_lineuniquekey} THEN 1 ELSE 0 END",
               name: "formulanumeric",
               operator: search.Operator.EQUALTO,
               values: 1
           })
           saved_search.filters.push(taxResultsFilter);

           if (featMulti) {
               var multibookFilter = search.createFilter({
                   name: 'accountingbook',
                   join: 'accountingtransaction',
                   operator: search.Operator.IS,
                   values: [paramMulti]
               });
               saved_search.filters.push(multibookFilter);
           }

           //Obtener ID del National Tax o Contributory Class
           var idNational_or_Contributory = search.createColumn({
               name: "formulatext",
               formula: "NVL(NVL({custrecord_lmry_br_transaction.custrecord_lmry_ntax.id}, {custrecord_lmry_br_transaction.custrecord_lmry_ccl.id}),'0')",
               label: "11. ID_National_o_Contributory"
           });
           saved_search.columns.push(idNational_or_Contributory);

           //Obtener label National Tax o Contributory Class
           var nameNational_or_Contributory = search.createColumn({
               name: "formulatext",
               formula: "(CASE WHEN ({custrecord_lmry_br_transaction.custrecord_lmry_ntax} is not null) THEN 'National Tax' WHEN ({custrecord_lmry_br_transaction.custrecord_lmry_ccl} is not null) THEN 'Contributory Class' ELSE '0'  END)",
               label: "12.National_o_Contributory"
           });
           saved_search.columns.push(nameNational_or_Contributory);


           //LATAM - BASE AMOUNT LOCAL CURRENCY
           var baseAmountCurrency = search.createColumn({
               name: "formulatext",
               formula: "{custrecord_lmry_br_transaction.custrecord_lmry_base_amount_local_currc}",
               label: "13. LATAM - BASE AMOUNT LOCAL CURRENCY"
           });
           saved_search.columns.push(baseAmountCurrency);


           //LATAM - AMOUNT LOCAL CURRENCY
           var amountLocalCurrency = search.createColumn({
               name: "formulatext",
               formula: "{custrecord_lmry_br_transaction.custrecord_lmry_amount_local_currency}",
               label: "14.LATAM - AMOUNT LOCAL CURRENCY"
           });
           saved_search.columns.push(amountLocalCurrency);

           //10.-Municipalidad
           var municipTransaction = search.createColumn({
               name: "internalid",
               join: "CUSTBODY_LMRY_MUNICIPALITY",
               label: "15. Municipality"
           });
           saved_search.columns.push(municipTransaction);

           var postingPeriodColumn = search.createColumn({
               name: 'postingperiod',
               label: "16. PERIODO"
           });
           saved_search.columns.push(postingPeriodColumn);

           //Internalid
           var lineuniquekey = search.createColumn({
               name: "formulatext",
               formula: "{internalid}",
               label: "17.internalid"
           });
           saved_search.columns.push(lineuniquekey);

           var searchresult = saved_search.run();
           while (!DbolStop) {
               var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

               if (objResult != null) {
                   var intLength = objResult.length;
                   if (intLength != 1000) {
                       DbolStop = true;
                   }

                   for (var i = 0; i < intLength; i++) {

                       var columns = objResult[i].columns;
                       arrRetencion = new Array();
                       arrAuxiliar = new Array();

                       // 0. C?DIGO WHT
                       if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -') {
                           var nat_o_contib = objResult[i].getValue(columns[12]);
                           var idNat_o_contib = objResult[i].getValue(columns[11]);
                           //Obtiene el WithHolding Description
                           arrAuxiliar[0] = obtenerWithHoldingDescription(nat_o_contib, idNat_o_contib);
                       } else
                           arrAuxiliar[0] = '';
                       // 1. TASA
                       if (objResult[i].getValue(columns[1]) != null && objResult[i].getValue(columns[1]) != '- None -') {
                           arrAuxiliar[1] = Number(objResult[i].getValue(columns[1])).toFixed(6);
                       } else
                           arrAuxiliar[1] = '0.00';
                       // 2. RAZ?N SOCIAL / INDIVIDUO
                       if (objResult[i].getValue(columns[2]) != null && objResult[i].getValue(columns[2]) != '- None -') {
                           arrAuxiliar[2] = objResult[i].getValue(columns[2]);
                       } else
                           arrAuxiliar[2] = '';

                       // 3. TIPO DE TRANSACCI?N
                       if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -') {
                           arrAuxiliar[3] = objResult[i].getValue(columns[3]);
                       } else
                           arrAuxiliar[3] = '';

                       // 4. NUMERO DE TRANSACCI?N
                       if (objResult[i].getValue(columns[4]) != null && objResult[i].getValue(columns[4]) != '- None -') {
                           arrAuxiliar[4] = objResult[i].getValue(columns[4]);
                       } else
                           arrAuxiliar[4] = '';

                       // 5. NOTA
                       if (objResult[i].getValue(columns[5]) != null && objResult[i].getValue(columns[5]) != '- None -') {
                           arrAuxiliar[5] = objResult[i].getValue(columns[5]);
                       } else
                           arrAuxiliar[5] = '';

                       //G. exchange rate cabecera y multibook

                       if (objResult[i].getValue(columns[10]) != null && objResult[i].getValue(columns[10]) != '- None -' && objResult[i].getValue(columns[10]) != '') {
                           var ExchangerateAux = objResult[i].getValue(columns[10]);
                           ExchangerateC_S = exchange_rate(ExchangerateAux);
                       } else {
                           ExchangerateC_S = 1;
                       }

                       // 6. BASE IMPONIBLE
                       if (objResult[i].getValue(columns[13]) != null && objResult[i].getValue(columns[13]) != '- None -' && objResult[i].getValue(columns[13]) != '') {
                           arrAuxiliar[6] = objResult[i].getValue(columns[13]);
                       } else {
                           /*if (objResult[i].getValue(columns[6]) != null && objResult[i].getValue(columns[6]) != '- None -') {
                               arrAuxiliar[6] = (parseFloat(objResult[i].getValue(columns[6]))) * (Number(ExchangerateC_S));
                           } else {*/
                            arrAuxiliar[6] = 0;
                           //}
                       }

                       arrAuxiliar[6] =  Math.abs(arrAuxiliar[6]);

                       // 7. RETENCION
                       if (objResult[i].getValue(columns[14]) != null && objResult[i].getValue(columns[14]) != '- None -' && objResult[i].getValue(columns[14]) != '') {
                           arrAuxiliar[7] = objResult[i].getValue(columns[14]);
                       } else {
                           /*if (objResult[i].getValue(columns[7]) != null && objResult[i].getValue(columns[7]) != '- None -') {

                               arrAuxiliar[7] = (parseFloat(objResult[i].getValue(columns[7]))) * (Number(ExchangerateC_S));

                           } else {*/
                            arrAuxiliar[7] = 0;
                           //}
                       }

                       if (arrAuxiliar[3] == "VendBill" || arrAuxiliar[3] == "Factura" ) {
                           arrAuxiliar[6] = Math.abs(arrAuxiliar[6]);
                           arrAuxiliar[7] = Math.abs(arrAuxiliar[7]);
                       } else if (arrAuxiliar[3] == "VendCred" || arrAuxiliar[3] == "Crédito de factura") {
                           arrAuxiliar[6] = -Math.abs(arrAuxiliar[6]);
                           arrAuxiliar[7] = -Math.abs(arrAuxiliar[7]);
                       }

                       //8. FECHA
                       if (objResult[i].getValue(columns[8]) != null && objResult[i].getValue(columns[8]) != '- None -') {
                           arrAuxiliar[8] = objResult[i].getValue(columns[8]);
                       } else
                           arrAuxiliar[8] = '';

                       //9. DESCRIPCION
                       if (objResult[i].getValue(columns[9]) != null && objResult[i].getValue(columns[9]) != '- None -') {
                           arrAuxiliar[9] = Number(objResult[i].getValue(columns[9])).toFixed(6);
                       } else
                           arrAuxiliar[9] = '';


                       //10. MUNICIPALITY
                       if (objResult[i].getValue(columns[15]) != null && objResult[i].getValue(columns[15]) != '- None -' && paramOriginCity == 1 ) {
                           arrAuxiliar[10] = objResult[i].getValue(columns[15]);
                       } else{
                           arrAuxiliar[10] = '';
                       }
                       

                       //11. POSTING PERIOD
                       if (objResult[i].getValue(columns[16]) != null && objResult[i].getValue(columns[16]) != '- None -') {
                           arrAuxiliar[11] = objResult[i].getValue(columns[16]);
                       } else
                           arrAuxiliar[11] = '';

                       //COLUMNA DE RETENCIONES IMPORTANTES(Concepto, factura, base retención, porc, valor retenido)
                       arrRetencion[0] = arrAuxiliar[0];
                       arrRetencion[1] = arrAuxiliar[4];
                       arrRetencion[2] = arrAuxiliar[6];
                       arrRetencion[3] = arrAuxiliar[9];
                       arrRetencion[4] = arrAuxiliar[7];
                       arrRetencion[5] = arrAuxiliar[10];
                       arrRetencion[6] = jsonNameMonth[arrAuxiliar[11]];


                       ArrReteAux[_cont] = arrRetencion;
                       _cont++;
                   }
                   intDMinReg = intDMaxReg;
                   intDMaxReg += 1000;
                   if (intLength < 1000) {
                       DbolStop = true;
                   }

               } else {
                   DbolStop = true;
               }
           }
           var arrRetencion = new Array();
           log.debug('lines ArrReteAux '+paramTyreten , ArrReteAux)
           return ArrReteAux ;
       }

       function ObtieneJournalCabecera(paramTyreten) {
           //RETENCION EN LINEA
           var _cont = 0;
           var intDMinReg = Number(paramBucle) * 1000;
           var intDMaxReg = intDMinReg + 1000;
           var DbolStop = false;
           var arrAuxiliar = new Array();
           var arrRetencion = new Array();
           var ArrReteAux = new Array();

           log.debug('retType', retType);
           log.debug('autoRetType', autoRetType);
           log.debug('filtroRetencionName', filtroRetencionName);

           var saved_search = search.create({
               type: "journalentry",
               filters:
               [
                  ["formulatext: CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_br_type} IN ('"+retType+"', '"+autoRetType+"') THEN 1 ELSE 0 END","is","1"], 
                  "AND", 
                  ["posting","is","T"], 
                  
                  /*"AND", 
                  ["mainline","is","F"],*/
                  "AND", 
                  ["voided","is","F"], 
                  "AND", 
                  ["formulatext: CASE WHEN {customform} = 'Latam WHT - Vendor Bill' THEN 1 ELSE CASE WHEN {customform} = 'Latam WHT - Vendor Credit' THEN 2 ELSE 0 END END","is","0"],
                   "AND",
                   [filtroRetencionName,"is","0"]
               ],
               columns:
               [
                  search.createColumn({
                     name: "formulatext",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_type}",
                     label: "0. Código WHT"
                  }),
                  search.createColumn({
                     name: "formulanumeric",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent} * 10000",
                     label: "1. tasa"
                  }),
                  //search.createColumn({name: "entity", label: "2. Razón Social / Individuo"}),
                  search.createColumn({
                       name: "formulatext",
                       formula: "{custrecord_lmry_br_transaction.custrecord_lmry_taxres_entity}",
                       //summary: "GROUP",
                       label: "2. Vendor "
                  }),
                  search.createColumn({name: "type", label: "3. Tipo de Transaccion"}),
                  search.createColumn({name: "tranid", label: "4. Número de transacción"}),
                  search.createColumn({name: "memo", label: "5. Nota"}),
                  search.createColumn({
                     name: "formulacurrency",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_base_amount}",
                     label: "6. Base imponible"
                  }),
                  search.createColumn({
                     name: "formulacurrency",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_total}",
                     label: "7. Retencion"
                  }),
                  search.createColumn({name: "trandate", label: "8. Date"}),
                  search.createColumn({
                     name: "formulanumeric",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent} * 10000",// * 10000",
                     label: "9. Latam - CO ReteICA"
                  }),
                  search.createColumn({
                     name: "formulatext",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_accounting_books}",
                     label: "10. exhange rate total"
                  })
               ]
            });

           if (featSubsi) {
               var subsidiaryFilter = search.createFilter({
                   name: 'subsidiary',
                   operator: search.Operator.IS,
                   values: [paramsubsidi]
               });
               saved_search.filters.push(subsidiaryFilter);
           }

           var periodFilter = search.createFilter({
               name: "formulatext",
               formula: formulPeriodFilters,
               operator: search.Operator.IS,
               values: "1"
           });
           saved_search.filters.push(periodFilter);


           var vendorLineFilter = search.createFilter({
               name: 'formulanumeric',
               formula: "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_taxres_entity.id} = " + paramVendor +
                   " THEN 1 ELSE 0  END",
               operator: search.Operator.EQUALTO,
               values: 1
           })
           saved_search.filters.push(vendorLineFilter);

           //Filtro para excluir Tax Results creados por Modulo Header
           var linesFilter = search.createFilter({
               join: "custrecord_lmry_br_transaction",
               name: "custrecord_lmry_co_acc_exo_concept",
               operator: "noneof",
               values: ["@NONE@"]
           })
           saved_search.filters.push(linesFilter);

           var taxtypeFilter = search.createFilter({
               join: "custrecord_lmry_br_transaction",
               name: "custrecord_lmry_tax_type",
               operator: search.Operator.IS,
               values: 1
           })
           saved_search.filters.push(taxtypeFilter);
           
           var taxResultsFilter = search.createFilter({
               formula: "CASE WHEN {lineuniquekey} = {custrecord_lmry_br_transaction.custrecord_lmry_lineuniquekey} THEN 1 ELSE 0 END",
               name: "formulanumeric",
               operator: search.Operator.EQUALTO,
               values: 1
           })
           saved_search.filters.push(taxResultsFilter);

           if (featMulti) {
               var multibookFilter = search.createFilter({
                   name: 'accountingbook',
                   join: 'accountingtransaction',
                   operator: search.Operator.IS,
                   values: [paramMulti]
               });
               saved_search.filters.push(multibookFilter);
           }

           //Obtener ID del National Tax o Contributory Class
           var idNational_or_Contributory = search.createColumn({
               name: "formulatext",
               formula: columnaCodWht,
               label: "11. WHT Name"
           });
           saved_search.columns.push(idNational_or_Contributory);

           //Obtener label National Tax o Contributory Class
           var nameNational_or_Contributory = search.createColumn({
               name: "formulatext",
               formula: "'0'",
               label: "12.National_o_Contributory"
           });
           saved_search.columns.push(nameNational_or_Contributory);


           //LATAM - BASE AMOUNT LOCAL CURRENCY
           var baseAmountCurrency = search.createColumn({
               name: "formulatext",
               formula: "{custrecord_lmry_br_transaction.custrecord_lmry_base_amount_local_currc}",
               label: "13. LATAM - BASE AMOUNT LOCAL CURRENCY"
           });
           saved_search.columns.push(baseAmountCurrency);


           //LATAM - AMOUNT LOCAL CURRENCY
           var amountLocalCurrency = search.createColumn({
               name: "formulatext",
               formula: "{custrecord_lmry_br_transaction.custrecord_lmry_amount_local_currency}",
               label: "14.LATAM - AMOUNT LOCAL CURRENCY"
           });
           saved_search.columns.push(amountLocalCurrency);

           //10.-Municipalidad
           var municipTransaction = search.createColumn({
               name: "internalid",
               join: "CUSTBODY_LMRY_MUNICIPALITY",
               label: "15. Municipality"
           });
           saved_search.columns.push(municipTransaction);

           var postingPeriodColumn = search.createColumn({
               name: 'postingperiod',
               label: "16. PERIODO"
           });
           saved_search.columns.push(postingPeriodColumn);

           //Line Unique Key
           var lineuniquekey = search.createColumn({
               name: "formulatext",
               formula: "{internalid}",
               label: "17.Internalid"
           });
           saved_search.columns.push(lineuniquekey);
           //TransacionAjuste
           var AjustColumn = search.createColumn({
                name: "formulanumeric",
                formula: "NVL({custrecord_lmry_br_transaction.custrecord_lmry_co_wht_applied.id},0)",
                label: "TransacionAjuste"
            });
            saved_search.columns.push(AjustColumn);
            
           var searchresult = saved_search.run();
           while (!DbolStop) {
               var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

               if (objResult != null) {
                   var intLength = objResult.length;
                   if (intLength != 1000) {
                       DbolStop = true;
                   }

                   for (var i = 0; i < intLength; i++) {

                       var columns = objResult[i].columns;

                       //log.debug('objResult',objResult)
                       arrRetencion = new Array();
                       arrAuxiliar = new Array();

                       // 0. C?DIGO WHT
                       if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -') {
                           arrAuxiliar[0] = objResult[i].getValue(columns[11]);
                       } else
                           arrAuxiliar[0] = '';
                       // 1. TASA
                       if (objResult[i].getValue(columns[1]) != null && objResult[i].getValue(columns[1]) != '- None -') {
                           arrAuxiliar[1] = Number(objResult[i].getValue(columns[1])).toFixed(6);
                       } else
                           arrAuxiliar[1] = '0.00';
                       // 2. RAZ?N SOCIAL / INDIVIDUO
                       if (objResult[i].getValue(columns[2]) != null && objResult[i].getValue(columns[2]) != '- None -') {
                           arrAuxiliar[2] = objResult[i].getValue(columns[2]);
                       } else
                           arrAuxiliar[2] = '';

                       // 3. TIPO DE TRANSACCI?N
                       if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -') {
                           arrAuxiliar[3] = objResult[i].getValue(columns[3]);
                       } else
                           arrAuxiliar[3] = '';

                       // 4. NUMERO DE TRANSACCI?N
                       if (objResult[i].getValue(columns[4]) != null && objResult[i].getValue(columns[4]) != '- None -') {
                           arrAuxiliar[4] = objResult[i].getValue(columns[4]);
                       } else
                           arrAuxiliar[4] = '';

                       // 5. NOTA
                       if (objResult[i].getValue(columns[5]) != null && objResult[i].getValue(columns[5]) != '- None -') {
                           arrAuxiliar[5] = objResult[i].getValue(columns[5]);
                       } else
                           arrAuxiliar[5] = '';

                       // 6. BASE IMPONIBLE
                       if (objResult[i].getValue(columns[13]) != null && objResult[i].getValue(columns[13]) != '- None -' && objResult[i].getValue(columns[13]) != '' && objResult[i].getValue(columns[13]) != 0) {
                           arrAuxiliar[6] = objResult[i].getValue(columns[13]);
                       } else {
                           /*if (objResult[i].getValue(columns[6]) != null && objResult[i].getValue(columns[6]) != '- None -') {
                               arrAuxiliar[6] = (parseFloat(objResult[i].getValue(columns[6]))) * (Number(ExchangerateC_S));
                           } else {*/
                            arrAuxiliar[6] = 0;
                           //}
                       }

                       arrAuxiliar[6] =  Math.abs(arrAuxiliar[6]);

                       // 7. RETENCION
                       if (objResult[i].getValue(columns[14]) != null && objResult[i].getValue(columns[14]) != '- None -' && objResult[i].getValue(columns[14]) != '' && objResult[i].getValue(columns[14]) != 0) {
                           arrAuxiliar[7] = objResult[i].getValue(columns[14]);
                       } else {
                           /*if (objResult[i].getValue(columns[7]) != null && objResult[i].getValue(columns[7]) != '- None -') {
                               arrAuxiliar[7] = (parseFloat(objResult[i].getValue(columns[7]))) * (Number(ExchangerateC_S));
                           } else {*/
                            arrAuxiliar[7] = 0;
                           //}
                       }

                       arrAuxiliar[7] = Math.abs(arrAuxiliar[7]);

                       //8. FECHA
                       if (objResult[i].getValue(columns[8]) != null && objResult[i].getValue(columns[8]) != '- None -') {
                           arrAuxiliar[8] = objResult[i].getValue(columns[8]);
                       } else
                           arrAuxiliar[8] = '';

                       //9. DESCRIPCION
                       if (objResult[i].getValue(columns[9]) != null && objResult[i].getValue(columns[9]) != '- None -') {
                           arrAuxiliar[9] = objResult[i].getValue(columns[9]); //Number(objResult[i].getValue(columns[9])).toFixed(6);
                       } else
                           arrAuxiliar[9] = '';

                       //10. MUNICIPAILTY
                       if (objResult[i].getValue(columns[15]) != null && objResult[i].getValue(columns[15]) != '- None -' && paramOriginCity == 1 ) {
                           arrAuxiliar[10] = objResult[i].getValue(columns[15]);
                       } else{
                           arrAuxiliar[10] = '';
                       }

                       //11. POSTING PERIOD
                       if (objResult[i].getValue(columns[16]) != null && objResult[i].getValue(columns[16]) != '- None -') {
                           arrAuxiliar[11] = objResult[i].getValue(columns[16]);
                       } else
                           arrAuxiliar[11] = '';

                       //12. InternalId
                       if (objResult[i].getValue(columns[17]) != null && objResult[i].getValue(columns[17]) != '- None -') {
                            arrAuxiliar[12] = objResult[i].getValue(columns[17]);
                        } else
                            arrAuxiliar[12] = '';

                            arrAuxiliar[13] = objResult[i].getValue(columns[18]);

                       //COLUMNA DE RETENCIONES IMPORTANTES(Concepto, factura, base retención, porc, valor retenido)
                       arrRetencion[0] = arrAuxiliar[0];
                       arrRetencion[1] = arrAuxiliar[4];
                       arrRetencion[2] = arrAuxiliar[6];
                       arrRetencion[3] = arrAuxiliar[9];
                       arrRetencion[4] = arrAuxiliar[7];
                       arrRetencion[5] = arrAuxiliar[10];
                       arrRetencion[6] = jsonNameMonth[arrAuxiliar[11]];
                       arrRetencion[7] = arrAuxiliar[12];
                       arrRetencion[8] = paramTyreten;
                       if(arrRetencion[2] === 0){
                           arrRetencion[9] = arrAuxiliar[13];
                       }

                       ArrReteAux[_cont] = arrRetencion;
                       _cont++;
                   }
                   intDMinReg = intDMaxReg;
                   intDMaxReg += 1000;
                   if (intLength < 1000) {
                       DbolStop = true;
                   }

               } else {
                   DbolStop = true;
               }
           }
           var arrRetencion = new Array();
           log.debug('main ArrReteAux journal' + paramTyreten , ArrReteAux)
           return ArrReteAux ;
       }


       function ObtieneJournalRete(paramTyreten) {
           //RETENCION EN LINEA
           var _cont = 0;
           var intDMinReg = Number(paramBucle) * 1000;
           var intDMaxReg = intDMinReg + 1000;
           var DbolStop = false;
           var arrAuxiliar = new Array();
           var arrRetencion = new Array();
           var ArrReteAux = new Array();

           var saved_search = search.create({
               type: "journalentry",
               filters:
               [
                  ["formulatext: CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_br_type} IN ('"+retType+"', '"+autoRetType+"') THEN 1 ELSE 0 END","is","1"], 
                  "AND", 
                  ["posting","is","T"], 
                 
                  // "AND", 
                  // ["mainline","is","F"], 
                  "AND", 
                  ["voided","is","F"], 
                  "AND", 
                  ["formulatext: CASE WHEN {customform} = 'Latam WHT - Vendor Bill' THEN 1 ELSE CASE WHEN {customform} = 'Latam WHT - Vendor Credit' THEN 2 ELSE 0 END END","is","0"]
               ],
               columns:
               [
                  search.createColumn({
                     name: "formulatext",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_type}",
                     label: "0. Código WHT"
                  }),
                  search.createColumn({
                     name: "formulanumeric",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent} * 10000",
                     label: "1. tasa"
                  }),
                  //search.createColumn({name: "entity", label: "2. Razón Social / Individuo"}),
                  search.createColumn({
                       name: "formulatext",
                       formula: "{custrecord_lmry_br_transaction.custrecord_lmry_taxres_entity}",
                       //summary: "GROUP",
                       label: "2. Vendor "
                  }),
                  search.createColumn({name: "type", label: "3. Tipo de Transaccion"}),
                  search.createColumn({name: "tranid", label: "4. Número de transacción"}),
                  search.createColumn({name: "memo", label: "5. Nota"}),
                  search.createColumn({
                     name: "formulacurrency",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_base_amount}",
                     label: "6. Base imponible"
                  }),
                  search.createColumn({
                     name: "formulacurrency",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_total}",
                     label: "7. Retencion"
                  }),
                  search.createColumn({name: "trandate", label: "8. Date"}),
                  search.createColumn({
                     name: "formulanumeric",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent} * 10000",//" * 10000",
                     label: "9. Latam - CO Percente"
                  }),
                  search.createColumn({
                     name: "formulatext",
                     formula: "{custrecord_lmry_br_transaction.custrecord_lmry_accounting_books}",
                     label: "10. Exchange rate total"
                  })
               ]
            });

           if (featSubsi) {
               var subsidiaryFilter = search.createFilter({
                   name: 'subsidiary',
                   operator: search.Operator.IS,
                   values: [paramsubsidi]
               });
               saved_search.filters.push(subsidiaryFilter);
           }


           var periodFilter = search.createFilter({
               name: "formulatext",
               formula: formulPeriodFilters,
               operator: search.Operator.IS,
               values: "1"
           });
           saved_search.filters.push(periodFilter);


           var vendorLineFilter = search.createFilter({
               name: 'formulanumeric',
               formula: "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_taxres_entity.id} = " + paramVendor +
                   " THEN 1 ELSE 0  END",
               operator: search.Operator.EQUALTO,
               values: 1
           })
           saved_search.filters.push(vendorLineFilter);

           //Filtro para excluir Tax Results creados por Modulo Header
           var linesFilter = search.createFilter({
               join: "custrecord_lmry_br_transaction",
               name: "custrecord_lmry_co_acc_exo_concept",
               operator: "anyof",
               values: ["@NONE@"]
           })
           saved_search.filters.push(linesFilter);

            var taxtypeFilter = search.createFilter({
               join: "custrecord_lmry_br_transaction",
               name: "custrecord_lmry_tax_type",
               operator: search.Operator.IS,
               values: 1
           })
           saved_search.filters.push(taxtypeFilter);
           
           var taxResultsFilter = search.createFilter({
               formula: "CASE WHEN {lineuniquekey} = {custrecord_lmry_br_transaction.custrecord_lmry_lineuniquekey} THEN 1 ELSE 0 END",
               name: "formulanumeric",
               operator: search.Operator.EQUALTO,
               values: 1
           })
           saved_search.filters.push(taxResultsFilter);

           if (featMulti) {
               var multibookFilter = search.createFilter({
                   name: 'accountingbook',
                   join: 'accountingtransaction',
                   operator: search.Operator.IS,
                   values: [paramMulti]
               });
               saved_search.filters.push(multibookFilter);
           }

           //Obtener ID del National Tax o Contributory Class
           var idNational_or_Contributory = search.createColumn({
               name: "formulatext",
               formula: "NVL(NVL({custrecord_lmry_br_transaction.custrecord_lmry_ntax.id}, {custrecord_lmry_br_transaction.custrecord_lmry_ccl.id}),'0')",
               label: "11. ID_National_o_Contributory"
           });
           saved_search.columns.push(idNational_or_Contributory);

           //Obtener label National Tax o Contributory Class
           var nameNational_or_Contributory = search.createColumn({
               name: "formulatext",
               formula: "(CASE WHEN ({custrecord_lmry_br_transaction.custrecord_lmry_ntax} is not null) THEN 'National Tax' WHEN ({custrecord_lmry_br_transaction.custrecord_lmry_ccl} is not null) THEN 'Contributory Class' ELSE '0'  END)",
               label: "12.National_o_Contributory"
           });
           saved_search.columns.push(nameNational_or_Contributory);


           //LATAM - BASE AMOUNT LOCAL CURRENCY
           var baseAmountCurrency = search.createColumn({
               name: "formulatext",
               formula: "{custrecord_lmry_br_transaction.custrecord_lmry_base_amount_local_currc}",
               label: "13. LATAM - BASE AMOUNT LOCAL CURRENCY"
           });
           saved_search.columns.push(baseAmountCurrency);


           //LATAM - AMOUNT LOCAL CURRENCY
           var amountLocalCurrency = search.createColumn({
               name: "formulatext",
               formula: "{custrecord_lmry_br_transaction.custrecord_lmry_amount_local_currency}",
               label: "14.LATAM - AMOUNT LOCAL CURRENCY"
           });
           saved_search.columns.push(amountLocalCurrency);

           //10.-Municipalidad
           var municipTransaction = search.createColumn({
               name: "internalid",
               join: "CUSTBODY_LMRY_MUNICIPALITY",
               label: "15. Municipality"
           });
           saved_search.columns.push(municipTransaction);

           var postingPeriodColumn = search.createColumn({
               name: 'postingperiod',
               label: "16. PERIODO"
           });
           saved_search.columns.push(postingPeriodColumn);

           // Internalid
           var lineuniquekey = search.createColumn({
               name: "formulatext",
               formula: "{internalid}",
               label: "17.internalid"
           });
           saved_search.columns.push(lineuniquekey);

           var searchresult = saved_search.run();
           while (!DbolStop) {
               var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

               if (objResult != null) {
                   var intLength = objResult.length;
                   if (intLength != 1000) {
                       DbolStop = true;
                   }

                   for (var i = 0; i < intLength; i++) {

                       var columns = objResult[i].columns;
                       arrRetencion = new Array();
                       arrAuxiliar = new Array();

                       // 0. C?DIGO WHT
                       if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -') {
                           var nat_o_contib = objResult[i].getValue(columns[12]);
                           var idNat_o_contib = objResult[i].getValue(columns[11]);
                           //Obtiene el WithHolding Description
                           arrAuxiliar[0] = obtenerWithHoldingDescription(nat_o_contib, idNat_o_contib);
                       } else
                           arrAuxiliar[0] = '';
                       // 1. TASA
                       if (objResult[i].getValue(columns[1]) != null && objResult[i].getValue(columns[1]) != '- None -') {
                           arrAuxiliar[1] = Number(objResult[i].getValue(columns[1])).toFixed(6);
                       } else
                           arrAuxiliar[1] = '0.00';
                       // 2. RAZ?N SOCIAL / INDIVIDUO
                       if (objResult[i].getValue(columns[2]) != null && objResult[i].getValue(columns[2]) != '- None -') {
                           arrAuxiliar[2] = objResult[i].getValue(columns[2]);
                       } else
                           arrAuxiliar[2] = '';

                       // 3. TIPO DE TRANSACCI?N
                       if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -') {
                           arrAuxiliar[3] = objResult[i].getValue(columns[3]);
                       } else
                           arrAuxiliar[3] = '';

                       // 4. NUMERO DE TRANSACCI?N
                       if (objResult[i].getValue(columns[4]) != null && objResult[i].getValue(columns[4]) != '- None -') {
                           arrAuxiliar[4] = objResult[i].getValue(columns[4]);
                       } else
                           arrAuxiliar[4] = '';

                       // 5. NOTA
                       if (objResult[i].getValue(columns[5]) != null && objResult[i].getValue(columns[5]) != '- None -') {
                           arrAuxiliar[5] = objResult[i].getValue(columns[5]);
                       } else
                           arrAuxiliar[5] = '';

                       // 6. BASE IMPONIBLE
                       if (objResult[i].getValue(columns[13]) != null && objResult[i].getValue(columns[13]) != '- None -' && objResult[i].getValue(columns[13]) != '' && objResult[i].getValue(columns[13]) != 0) {
                           arrAuxiliar[6] = objResult[i].getValue(columns[13]);
                       } else {
                           /*if (objResult[i].getValue(columns[6]) != null && objResult[i].getValue(columns[6]) != '- None -') {
                               arrAuxiliar[6] = (parseFloat(objResult[i].getValue(columns[6]))) * (Number(ExchangerateC_S));
                           } else {*/
                            arrAuxiliar[6] = 0;
                           //}
                       }

                       arrAuxiliar[6] =  Math.abs(arrAuxiliar[6]);

                       // 7. RETENCION
                       if (objResult[i].getValue(columns[14]) != null && objResult[i].getValue(columns[14]) != '- None -' && objResult[i].getValue(columns[14]) != '' && objResult[i].getValue(columns[14]) != 0) {
                           arrAuxiliar[7] = objResult[i].getValue(columns[14]);
                       } else {
                           /*if (objResult[i].getValue(columns[7]) != null && objResult[i].getValue(columns[7]) != '- None -') {
                               arrAuxiliar[7] = (parseFloat(objResult[i].getValue(columns[7]))) * (Number(ExchangerateC_S));
                           }else{*/
                            arrAuxiliar[7] = 0;
                           //}
                       }

                       arrAuxiliar[7] = Math.abs(arrAuxiliar[7]);
                       
                       //8. FECHA
                       if (objResult[i].getValue(columns[8]) != null && objResult[i].getValue(columns[8]) != '- None -') {
                           arrAuxiliar[8] = objResult[i].getValue(columns[8]);
                       } else
                           arrAuxiliar[8] = '';

                       //9. DESCRIPCION
                       if (objResult[i].getValue(columns[9]) != null && objResult[i].getValue(columns[9]) != '- None -') {
                           arrAuxiliar[9] = objResult[i].getValue(columns[9]); //Number(objResult[i].getValue(columns[9])).toFixed(6);
                       } else
                           arrAuxiliar[9] = '';


                       //10. MUNICIPALITY
                       if (objResult[i].getValue(columns[15]) != null && objResult[i].getValue(columns[15]) != '- None -' && paramOriginCity == 1 ) {
                           arrAuxiliar[10] = objResult[i].getValue(columns[15]);
                       } else{
                           arrAuxiliar[10] = '';
                       }
                       

                       //11. POSTING PERIOD
                       if (objResult[i].getValue(columns[16]) != null && objResult[i].getValue(columns[16]) != '- None -') {
                           arrAuxiliar[11] = objResult[i].getValue(columns[16]);
                       } else
                           arrAuxiliar[11] = '';

                       //COLUMNA DE RETENCIONES IMPORTANTES(Concepto, factura, base retención, porc, valor retenido)
                       arrRetencion[0] = arrAuxiliar[0];
                       arrRetencion[1] = arrAuxiliar[4];
                       arrRetencion[2] = arrAuxiliar[6];
                       arrRetencion[3] = arrAuxiliar[9];
                       arrRetencion[4] = arrAuxiliar[7];
                       arrRetencion[5] = arrAuxiliar[10];
                       arrRetencion[6] = jsonNameMonth[arrAuxiliar[11]];


                       ArrReteAux[_cont] = arrRetencion;
                       _cont++;
                   }
                   intDMinReg = intDMaxReg;
                   intDMaxReg += 1000;
                   if (intLength < 1000) {
                       DbolStop = true;
                   }

               } else {
                   DbolStop = true;
               }
           }
           var arrRetencion = new Array();
           log.debug('lines ArrReteAux '+paramTyreten , ArrReteAux)
           return ArrReteAux ;
       }



       function typeRetention(type){

           switch (type) {
               case '1':
                   retType = 'ReteICA';
                   autoRetType = 'Auto ReteICA';
                   columnaCodWht = "{custbody_lmry_co_reteica.name}";
                   filtroRetencionName = "formulatext: CASE WHEN {custbody_lmry_co_reteica.name} = 'ReteICA 0%' THEN 1 ELSE 0 END";
                   break;
               case '2':
                   retType = 'ReteFTE';
                   autoRetType = 'Auto ReteFTE';
                   columnaCodWht = "{custbody_lmry_co_retefte.name}";
                   filtroRetencionName = "formulatext: CASE WHEN {custbody_lmry_co_retefte.name} = 'ReteFte 0%' THEN 1 ELSE 0 END";
                   break;
               case '3':
                   retType = 'ReteIVA';
                   autoRetType = 'Auto ReteIVA';
                   columnaCodWht = "{custbody_lmry_co_reteiva.name}";
                   filtroRetencionName = "formulatext: CASE WHEN {custbody_lmry_co_reteiva.name} = 'ReteIVA 0%' THEN 1 ELSE 0 END";
                   break;
               
           }
       }

       function getJsonxMes(ArrayRetencion) {
           var jsonReturn = {};
           for (var i = 0; i < ArrayRetencion.length; i++) {
               if (jsonReturn[ArrayRetencion[i][6]] != undefined) {
                   jsonReturn[ArrayRetencion[i][6]].push(ArrayRetencion[i]);
               } else {
                   jsonReturn[ArrayRetencion[i][6]] = [ArrayRetencion[i]];
               }
           }
           return jsonReturn;
       }

       function AcumuladoPorConcept(ArrRetAux) {
           var arrMoment = new Array();
           var cont = -1;
           for (var i = 0; i <= ArrRetAux.length - 1; i++) {
               var encontro = false;
               //Recorrer el arreglo de acumulado x Concepto
               for (var j = 0; j <= arrMoment.length - 1; j++) {
                   //Es el mismo concepto
                   if (arrMoment[j][0] == ArrRetAux[i][0]) {
                       arrMoment[j][1] += parseFloat((Number(ArrRetAux[i][2])).toFixed(2));
                       arrMoment[j][2] = ArrRetAux[i][3];
                       arrMoment[j][3] += parseFloat((Number(ArrRetAux[i][4])).toFixed(2));
                       arrMoment[j][4] = ArrRetAux[i][6];
                       encontro = true;
                   }
               }
               //Si no encontro el valor
               if (!encontro) {
                   cont++;
                   arrMoment[cont] = new Array();
                   arrMoment[cont][0] = ArrRetAux[i][0];
                   arrMoment[cont][1] = parseFloat((Number(ArrRetAux[i][2])).toFixed(2));
                   arrMoment[cont][2] = ArrRetAux[i][3];
                   arrMoment[cont][3] = parseFloat((Number(ArrRetAux[i][4])).toFixed(2));
                   arrMoment[cont][4] = ArrRetAux[i][6];
               }

           }
        
           return arrMoment;
       }

       function exchange_rate(exchangerate) {
           var auxiliar = ('' + exchangerate).split('&');
           var final = '';

           if (featMulti) {
               var id_libro = auxiliar[0].split('|');
               var exchange_rate = auxiliar[1].split('|');

               for (var i = 0; i < id_libro.length; i++) {
                   if (Number(id_libro[i]) == Number(paramMulti)) {
                       final = exchange_rate[i];
                       break;
                   } else {
                       final = exchange_rate[0];
                   }
               }
           } else {
               final = auxiliar[1];
           }
           return final;
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

       function lengthInUtf8Bytes(str) {
           var m = encodeURIComponent(str).match(/%[89ABab]/g);
           return str.length + (m ? m.length : 0);
       }

       function ObtenerDatosSubsidiaria() {
           var configpage = config.load({
               type: config.Type.COMPANY_INFORMATION
           });
           if (featSubsi) {
               var subsidiaryData = search.lookupFields({
                   type: search.Type.SUBSIDIARY,
                   id: paramsubsidi,
                   columns: ['legalname','taxidnum','custrecord_lmry_dig_verificador','address1','city']
               });

               companyname = subsidiaryData.legalname;
               companyruc = ''+subsidiaryData.taxidnum;
               companyruc = cleanNit(companyruc)
               companydv = subsidiaryData.custrecord_lmry_dig_verificador;    
               companyaddress = subsidiaryData.address1;
               companycity = subsidiaryData.city

           } else {
               companyruc = ''+configpage.getFieldValue('employerid');
               companyruc = cleanNit(companyruc)
               companydv = pageConfig.getValue('custrecord_lmry_dig_verificador');  
               companyname = configpage.getFieldValue('legalname');
               companyaddress = configpage.getFieldValue('address1');
               companycity = configpage.getFieldValue('city');
           }



       }

       //-------------------------------------------------------------------------------------------------------
       //Concadena al aux un caracter segun la cantidad indicada
       //-------------------------------------------------------------------------------------------------------

       function obtenerWithHoldingDescription(title, id) {

           var concept = '';
           if (title == 'National Tax') {
               var nationalTaxSearchObj = search.create({
                   type: "customrecord_lmry_national_taxes",
                   filters: [
                       ["internalid", "anyof", id]
                   ],
                   columns: [
                       search.createColumn({ name: "internalid", label: "Internal ID" }),
                       search.createColumn({ name: "custrecord_lmry_ntax_description", label: "Latam - Withholding Description" })
                   ]
               });
               var searchresult = nationalTaxSearchObj.run();
               var objResult = searchresult.getRange(0, 100);
               var columns = objResult[0].columns;

               concept = objResult[0].getValue(columns[1]);

           } else if (title == 'Contributory Class') {
               var contributoryClassSearchObj = search.create({
                   type: "customrecord_lmry_ar_contrib_class",
                   filters: [
                       ["internalid", "anyof", id]
                   ],
                   columns: [
                       search.createColumn({ name: "internalid", label: "Internal ID" }),
                       search.createColumn({ name: "custrecord_lmry_ccl_description", label: "Latam - Withholding Description" })
                   ]
               });
               var searchresult = contributoryClassSearchObj.run();
               var objResult = searchresult.getRange(0, 100);
               var columns = objResult[0].columns;

               concept = objResult[0].getValue(columns[1]);
           } else {
               concept = '';
           }

           return concept;
       }


       function getTitle(parameTypeRet) {
           if (parameTypeRet == 1) {
               return GLOBAL_LABELS['tituloICA']["es"];
           }

           if (parameTypeRet == 2) {
               return GLOBAL_LABELS['tituloRETE']["es"];
           }

           if (parameTypeRet == 3) {
               return GLOBAL_LABELS['tituloIVA']["es"];
           }
           
       }

       function calcular_tasa(tas_) {
           var tama = searchresultWhtCode_fin.length;

           for (var i = 0; i < tama; i++) {
               if (tas_ == searchresultWhtCode_fin[i].getValue(columnas_f[0])) {
                   return searchresultWhtCode_fin[i].getValue(columnas_f[2]);
               }
           }
       }

       function calcular_desc(des_) {
           var tama = searchresultWhtCode_fin.length;
           for (var i = 0; i < tama; i++) {
               if (des_ == searchresultWhtCode_fin[i].getValue(columnas_f[0])) {
                   return searchresultWhtCode_fin[i].getValue(columnas_f[1]);
               }
           }
       }


       function getPeriods(paramperiodanio, paramSubsi) {
           var featCalendar = runtime.isFeatureInEffect({ feature: "MULTIPLECALENDARS" });
         
           var period = new Array();

           var varFilter = new Array();
           // Busqueda para obtener AÑO Y MES (AAAAMM) 
           var periodSearchObj = search.lookupFields({
               type: search.Type.ACCOUNTING_PERIOD,
               id: paramperiodanio,
               columns: ['startdate', 'enddate']
           });
           var periodStartDate = periodSearchObj.startdate;
           var periodEndDate = periodSearchObj.enddate;

           var accountingperiodObj = search.create({
               type: "accountingperiod",
               filters: [
                   ["isquarter", "is", "F"],
                   "AND", ["isyear", "is", "F"],
                   "AND", ["startdate", "onorafter", periodStartDate],
                   "AND", ["enddate", "onorbefore", periodEndDate]
               ],
               columns: [
                   search.createColumn({
                       name: "periodname",
                       sort: search.Sort.ASC,
                       label: "Name"
                   }),
                   search.createColumn({ name: "internalid", label: "Internal ID" }),
                   search.createColumn({ name: "startdate", label: "Start Date" }),
                   search.createColumn({ name: "enddate", label: "End Date" })
               ]
           });
           //Filtro para probar si tiene multiples calendarios                            
           if (featCalendar == true || featCalendar == 'T') {
               var varSubsidiary = search.lookupFields({
                   type: 'subsidiary',
                   id: paramSubsi,
                   columns: ['fiscalcalendar']
               });
               var fiscalCalendar = varSubsidiary.fiscalcalendar[0].value;

               varFilter = search.createFilter({
                   name: 'fiscalcalendar',
                   operator: search.Operator.IS,
                   values: fiscalCalendar
               });
               // Agrega filtro del calendario de la subsidiaria
               accountingperiodObj.filters.push(varFilter);
           }
           // Ejecutando la busqueda
           var varResult = accountingperiodObj.run();
           var AccountingPeriodRpt = varResult.getRange({
               start: 0,
               end: 1000
           });
           if (AccountingPeriodRpt == null || AccountingPeriodRpt.length == 0) {
               log.debug('NO DATA', 'No hay periodos para ese año seleccionado en la configuración del Period');
               return false;
           } else {
               for (var i = 0; i < AccountingPeriodRpt.length; i++) {
                   period[i] = new Array();
                   period[i] = AccountingPeriodRpt[i].getValue('internalid');
               }
           }
           return period;
           
       }

       function generarStringFilterPostingPeriodAnual(idsPeriod) {
           var cant = idsPeriod.length;
           var comSimpl = "'";
           var strinic = "CASE WHEN ({postingperiod.id}=" + comSimpl + idsPeriod[0] + comSimpl;
           var strAdicionales = "";
           var strfinal = ") THEN 1 ELSE 0 END";
           for (var i = 1; i < cant; i++) {
               strAdicionales += " or {postingperiod.id}=" + comSimpl + idsPeriod[i] + comSimpl;
           }
           var str = strinic + strAdicionales + strfinal;
           //log.debug('periodsSTR', str);
           return str;
       }


       function logoSubsidiary(paramsubsidi) {

           if(featSubsi){
               subsi = record.load({
                   type: "subsidiary",
                   id: paramsubsidi
               })
               //logo
               var subsi_log = subsi.getValue('custrecord_co_cert_logo') || subsi.getValue('logo');

           }else{
               
               var configpage = config.load({
                   type: config.Type.COMPANY_INFORMATION
               });
               subsi_log = pageConfig.getValue('custrecord_co_cert_logo') || configpage.getValue('formlogo');
           }

           if (subsi_log) {
               var _logo = file.load({
                   id: subsi_log
               })
               subsi_logo = _logo.url;

               var host = url.resolveDomain({
                   hostType: url.HostType.APPLICATION,
                   accountId: runtime.accountId
               });

               return subsi_logo = "https://" + host + subsi_logo;
           }
       }


       function ObtenerParametrosYFeatures() {

           columnas_f[0] = search.createColumn({
               name: 'name',
               label: 'Name'
           });

           columnas_f[1] = search.createColumn({
               name: 'formulatext',
               formula: '{custrecord_lmry_wht_codedesc}',
               label: "WHT-CODEDESC"
           });

           columnas_f[2] = search.createColumn({
               name: "formulatext",
               formula: "{custrecord_lmry_wht_coderate}",
               label: "WHT-CODERATE"
           });

           result_wht_code = search.create({
               type: "customrecord_lmry_wht_code",
               filters: [],
               columns: columnas_f
           });
           var searchresultWhtCode = result_wht_code.run();
           searchresultWhtCode_fin = searchresultWhtCode.getRange(0, 1000);

           //Parametros
           var objContext = runtime.getCurrentScript();

           paramsubsidi = objContext.getParameter({
               name: 'custscript_lmry_co_subsi_withbk_ret_acum'
           });
           nameDIAN = objContext.getParameter({
               name: 'custscript_lmry_co_dian_name'
           });
           if (nameDIAN == null || nameDIAN == "- None -" || nameDIAN == "") {
               nameDIAN = ' ';
           }

           paramperiodanio = objContext.getParameter({
               name: 'custscript_lmry_co_par_anio_wtbk_ret_ac'
           });


           calcularAnio();

           paramMulti = objContext.getParameter({
               name: 'custscript_lmry_co_multibook_wtbk_ret_ac'
           });

           paramidrpt = objContext.getParameter({
               name: 'custscript_lmry_co_idrpt_wtbk_ret_acumul'
           });

           paramVendor = objContext.getParameter({
               name: 'custscript_lmry_co_vendor_withbk_ret_ac'
           });

           paramTyreten = objContext.getParameter({
               name: 'custscript_lmry_co_type_withbk_ret_acum'
           }).split(/\u0005/);

           paramCont = objContext.getParameter({
               name: 'custscript_lmry_co_cont_withbk_ret_acum'
           });

           paramBucle = objContext.getParameter({
               name: 'custscript_lmry_co_bucle_withbk_ret_acum'
           });

           paramGroupingMonth = objContext.getParameter({
               name: 'custscript_lmry_co_group_month'
           });

           paramOriginCity = objContext.getParameter({
               name: 'custscript_lmry_co_city_origin_2'
           });


           if (paramCont == null) {
               paramCont = 0;
           }

           if (paramBucle == null) {
               paramBucle = 0;
           }

           //Features
           featSubsi = runtime.isFeatureInEffect({
               feature: "SUBSIDIARIES"
           });
           featMulti = runtime.isFeatureInEffect({
               feature: "MULTIBOOK"
           });
           //TODO: Obtiene el feature de retenciones por linea o cabecera
           licenses = libreriaReport.getLicenses(paramsubsidi);

           log.error({
               title: 'ENTROfeats',
               details: 
               {
                   paramsubsidi:paramsubsidi,
                   paramperiodanio:paramperiodanio,
                   paramMulti:paramMulti,
                   paramidrpt:paramidrpt,
                   paramVendor:paramVendor,
                   paramTyreten:paramTyreten
               }
           });

           log.error({
               title: 'otrosparametros',
               details: {
                   nameDIAN:nameDIAN,
                   paramCont:paramCont,
                   paramBucle:paramBucle,
                   paramGroupingMonth:paramGroupingMonth,
                   paramOriginCity:paramOriginCity
               }
           });


           // Para buscar la municipality
           log.error('paramVendor', paramVendor);

           if (paramOriginCity == 1) {
               municipality = getMunicipalityByVendor(paramVendor);
               municipality = municipality || 'BOGOTA';
           } else {
               municipality =  getMunicipalityBySubsidiary() || 'BOGOTA';
           }
           //Multibook Name
           if (featMulti) {
               var multibookName_temp = search.lookupFields({
                   type: search.Type.ACCOUNTING_BOOK,
                   id: paramMulti,
                   columns: ['name']
               });

               multibookName = multibookName_temp.name;
               log.error({
                   title: 'MULTIBOOK',
                   details: multibookName
               });
           }
       }

       function getNameMunicipalidad(municipality_id) {

           var municipalidad = '';

           if (municipality_id != '' && municipality_id != null) {

               var municipality_Temp = search.lookupFields({
                   type: 'customrecord_lmry_co_entitymunicipality',
                   id: municipality_id,
                   columns: ['custrecord_lmry_co_municcode']
               });

               var code_municipality = municipality_Temp.custrecord_lmry_co_municcode;

               var searchCity = search.create({
                   type: "customrecord_lmry_city",
                   filters: [
                       ["custrecord_lmry_city_country", "anyof", "48"],
                       "AND", ["custrecord_lmry_city_id", "is", code_municipality]
                   ],
                   columns: [
                       search.createColumn({
                           name: "name",
                       })
                   ]
               });

               var resultObj = searchCity.run();
               var searchResultArray = resultObj.getRange(0, 1000);

               if (searchResultArray != null && searchResultArray.length != 0) {
                   municipalidad = searchResultArray[0].getValue("name");
                   if (municipalidad != '' && municipalidad != null) {
                       municipalidad = municipalidad.replace('BOGOTA BOGOTA, D.C.', 'BOGOTA');
                   }
               }
           }

           return municipalidad;
       }

       function getMunicipalityBySubsidiary() {

           var municipalidad = '';

           if (paramsubsidi != '' && paramsubsidi != null) {
               var municipality_id_Temp = search.lookupFields({
                   type: search.Type.SUBSIDIARY,
                   id: paramsubsidi,
                   columns: ['custrecord_lmry_municipality_sub']
               });

               if (municipality_id_Temp.custrecord_lmry_municipality_sub.length != 0) {
                   var municipality_id = municipality_id_Temp.custrecord_lmry_municipality_sub[0].value;
               }
               if (municipality_id != '' && municipality_id != null) {
                   municipalidad = getNameMunicipalidad(municipality_id);
               }
           }
           return municipalidad;
       }

       function getMunicipalityByVendor(idvendor) {

           var municipalidad = '';

           if (idvendor != '' && idvendor != null) {

               var vendorTemp = search.lookupFields({
                   type: search.Type.VENDOR,
                   id: idvendor,
                   columns: ['custentity_lmry_municipality']
               });

               if (vendorTemp.custentity_lmry_municipality.length != 0) {
                   var municipality_id = vendorTemp.custentity_lmry_municipality[0].value;
               }

               municipalidad = getNameMunicipalidad(municipality_id);
           }
           return municipalidad;

       }


       function obtenerMeses() {

           var periodStartDate = format.format({
               value: new Date(anio, 0, 1),
               type: format.Type.DATE
           });

           var periodEndDate = format.format({
               value: new Date(anio, 11, 31),
               type: format.Type.DATE
           });

           var accountingperiodSearchObj = search.create({
               type: "accountingperiod",
               filters: [
                   ["startdate", "onorafter", periodStartDate],
                   "AND", ["enddate", "onorbefore", periodEndDate],
                   "AND", ["isquarter", "is", "F"],
                   "AND", ["isyear", "is", "F"]
               ],
               columns: [
                   search.createColumn({ name: "internalid", label: "Internal ID" }),
                   search.createColumn({
                       name: "formulatext",
                       formula: "CASE  WHEN EXTRACT(Month FROM {enddate})= 1 THEN 'Enero'  WHEN EXTRACT(Month FROM {enddate})= 2 THEN 'Febrero' WHEN EXTRACT(Month FROM {enddate})= 3 THEN 'Marzo' WHEN EXTRACT(Month FROM {enddate})= 4 THEN 'Abril' WHEN EXTRACT(Month FROM {enddate})= 5 THEN 'Mayo' WHEN EXTRACT(Month FROM {enddate})= 6 THEN 'Junio' WHEN EXTRACT(Month FROM {enddate})= 7 THEN 'Julio' WHEN EXTRACT(Month FROM {enddate})= 8 THEN 'Agosto' WHEN EXTRACT(Month FROM {enddate})= 9 THEN 'Septiembre' WHEN EXTRACT(Month FROM {enddate})= 10 THEN 'Octubre' WHEN EXTRACT(Month FROM {enddate})= 11 THEN 'Noviembre' WHEN EXTRACT(Month FROM {enddate})= 12 THEN 'Diciembre' ELSE 'PERIODO DE AJUSTE' END",
                       label: "Formula (Text)"
                   })
               ]
           });

           var pagedData = accountingperiodSearchObj.runPaged({
               pageSize: 1000
           });

           var page, idPeriod, mes;
           var jsonMeses = {};

           pagedData.pageRanges.forEach(function(pageRange) {

               page = pagedData.fetch({
                   index: pageRange.index
               });
               page.data.forEach(function(result) {

                   idPeriod = '';
                   mes = '';

                   // 0. ID PERIODO
                   if (result.getValue(result.columns[0]) != '- None -' && result.getValue(result.columns[0]) != '') {
                       idPeriod = result.getValue(result.columns[0]);
                   } else {
                       idPeriod = '';
                   }

                   // 1. MES (ENERO - DICIEMBRE)
                   if (result.getValue(result.columns[1]) != '- None -' && result.getValue(result.columns[1]) != '') {
                       mes = result.getValue(result.columns[1]);
                   } else {
                       mes = '';
                   }


                   jsonMeses[idPeriod] = mes;
               });
           });

           log.debug('jsonMeses', jsonMeses);

           return jsonMeses;
       }

       function getGlobalLabels() {

           var labels = {
               "tituloICA": {
                   "es": 'CERTIFICADO DE RETENCIÓN DEL IMPUESTO DE INDUSTRIA Y COMERCIO',
               },
               "tituloRETE": {
                   "es": 'CERTIFICADO DE RETENCIÓN EN LA FUENTE',
               },
               "tituloIVA": {
                   "es": 'CERTIFICADO DE RETENCIÓN EN LA FUENTE POR IVA',
               },
               
               "AnioGravable": {
                   "es": 'AÑO GRAVABLE ',
               },
               "Articulo381_ICA": {
                   "es": 'Para dar Cumplimiento al artículo 381 del Estatuto tributario, certificamos que practicamos retenciones a título de ICA. ',
               },
               "Articulo381_RENTA": {
                   "es": 'Para dar Cumplimiento al artículo 381 del Estatuto tributario, certificamos que practicamos retenciones a título de RENTA. ',
               },
               "Articulo381_IVA": {
                   "es": 'Para dar Cumplimiento al artículo 381 del Estatuto tributario, certificamos que practicamos retenciones a título de IVA. ',
               },
               'MES': {
                   "es": 'MES',
               },
               'CONCEPTO': {
                   "es": 'CONCEPTO',
               },
               'MUNICIPIO': {
                   "es": 'MUNICIPIO',
               },
               'BASE': {
                   "es": 'BASE',
               },
               'RETENCION': {
                   "es": 'RETENCION',
               },
               'PORC': {
                   "es": 'PORC.',
               },
               'VALOR': {
                   "es": 'VALOR',
               },
               'RETENIDO': {
                   "es": 'RETENIDO',
               },
               'RETEICA_PIE': {
                   "es": 'Los valores retenidos fueron consignados oportunamente a favor de la Secretaría de Hacienda Municipal en la ciudad de ',
               },
               'PIE': {
                   "es": 'Los valores fueron consignados oportunamente a favor de la DIRECCIÓN DE IMPUESTOS Y ADUANAS NACIONALES (DIAN) en la Ciudad de ',
               },
               'FirmaAutografaReteICA': {
                   "es": 'Este documento no requiere para su validez firma autógrafa de acuerdo con el artículo 10 del Decreto 836 de 1991, recopilado en el artículo 1.6.1.12.12 del DUT 1625 de octubre de 2016, que regula el contenido del certificado de retenciones a título de ICA.',
               },
               'FirmaAutografaReteFTE': {
                   "es": 'Este documento no requiere para su validez firma autógrafa de acuerdo con el artículo 10 del Decreto 836 de 1991, recopilado en el artículo 1.6.1.12.12 del DUT 1625 de octubre de 2016, que regula el contenido del certificado de retenciones a título de RENTA.',
               },
               'FirmaAutografaReteIVA': {
                   "es": 'Este documento no requiere para su validez firma autógrafa de acuerdo con el artículo 7 del Decreto 380 de 1996, recopilado en el artículo 1.6.1.12.13 del DUT 1625 de octubre de 2016, que regula el contenido del certificado de retenciones a título de IVA.',
               },
               
               'DomicilioPrincipal': {
                   "es": 'DOMICILIO PRINCIPAL: '
               },
               'FechaExpedicion': {
                   "es": 'FECHA DE EXPEDICION: '
               },
               'AgenteRetenedor': {
                   "es": 'Agente Retenedor: '
               },
               'NITCédula': {
                   "es": 'NIT o Cédula: '
               },
               'Direccion': {
                   "es": 'Dirección: '
               },
               'Ciudad': {
                   "es": 'Ciudad: '
               },
               'PagadoA': {
                   "es": 'Pagado a:  '
               },
               'NIT/Cédula': {
                   "es": 'NIT/Cédula:  '
               }
           }
           return labels;
       }

       function obtenerCampoWhtVariable(typeRet){

           if (typeRet == 1) {
               return "{custbody_lmry_co_reteica.custrecord_lmry_wht_variable_rate}";
           }else if(typeRet == 2){
               return "{custbody_lmry_co_retefte.custrecord_lmry_wht_variable_rate}";
           }else{
               return "{custbody_lmry_co_reteiva.custrecord_lmry_wht_variable_rate}";
           }
       }
       
       function cleanNit(str) {
           str = str.replace(/,/g, "");
           str = str.replace(/-/g, "");
           str = str.replace(/\s/g, "");
           str = str.replace(/\./g, "");
           str = str.replace(/[^0-9]/g, '');
           return str;
       }

       function getVendorField(){

            var hasVendorField = false;
            var idTaxResultRecord = '';

            var searchTaxResult = search.create({
                type: "customrecordtype",
                columns: ["internalid", "scriptid"],
                filters: [{name: 'scriptid', operator: 'is', values: taxResultId}]

            }).run().getRange({ start: 0, end: 1000 });

            if(searchTaxResult && searchTaxResult.length){
                idTaxResultRecord = searchTaxResult[0].id;
            }

            if(!idTaxResultRecord){
                return false;
            }

            var objTaxResults = record.load({
                type: 'customrecordtype',
                id: idTaxResultRecord
            });

            var fieldsLineCount = objTaxResults.getLineCount({ sublistId: "customfield" });

            if (fieldsLineCount && fieldsLineCount > 0) {
                for (var i = 0; i < fieldsLineCount; i++) {
                    var idField = objTaxResults.getSublistValue({ sublistId: "customfield", fieldId: "fieldcustcodeid", line: i});

                    if(idField == vendorField){
                        hasVendorField = true;
                        break;
                    }

                }
            }

            return hasVendorField;

        }

        function groupRetentions(arr){
            
            var jsonTransactionAgrup = {};
            var jsonAdjustAgrup = {};
            var arrReturn = [];
            for(var i = 0; i < arr.length; i++){
               var key = '';
               if(arr[i].length == 10){
                   key = arr[i][9];
                   jsonAdjustAgrup[key] = arr[i];
               }else{
                   key = arr[i][7] || 'noid';
                   if(jsonTransactionAgrup[key] != undefined){
                       jsonTransactionAgrup[key].push(arr[i]);
                   }else{
                       jsonTransactionAgrup[key] = [arr[i]];
                   }
               }
            }
        
            for (key in jsonTransactionAgrup){
                if(jsonAdjustAgrup[key] != undefined){
                    var ajustePositivo = Number(jsonTransactionAgrup[key][0][3]) < Number(jsonAdjustAgrup[key][3]) ;
                    jsonTransactionAgrup[key][0][4] = ajustePositivo ? jsonTransactionAgrup[key][0][4] + jsonAdjustAgrup[key][4] : jsonTransactionAgrup[key][0][4] - jsonAdjustAgrup[key][4];
                    for(var j = 0; j < jsonTransactionAgrup[key].length; j++){
                        jsonTransactionAgrup[key][j][0] = jsonAdjustAgrup[key][0];
                        jsonTransactionAgrup[key][j][3] = jsonAdjustAgrup[key][3];
                    }
                }
            }
        
            for (key in jsonTransactionAgrup){
                arrReturn = arrReturn.concat(jsonTransactionAgrup[key]);
            }
            return arrReturn;
        }

       return {
           execute: execute
       };
   });