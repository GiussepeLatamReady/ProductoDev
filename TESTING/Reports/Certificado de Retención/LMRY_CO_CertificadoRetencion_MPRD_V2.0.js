/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||  This script for Report - Colombia                           ||
||                                                              ||
||  File Name: LMRY_CO_CertificadoRetencion_MPRD_V2.0.js        ||
||                                                              ||
||  Version  Date          Author          Remarks              ||
||  2.0      Feb 02 2022   Alexandra SF.   Use Script 2.0       ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/search',
    'N/config',
    'N/record',
    'N/file',
    'N/format',
    'N/log',
    'N/task',
    'N/runtime',
    "/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js",
    "./LMRY_CO_Certificate_Massive_LIB.js"
],

    function (search, config, record, file, format,log, task, runtime, libreriaReport,Lib_certificate_massive) {

        /**
         * Input Data for processing
         *
         * @return Array,Object,Search,File
         *
         * @since 2016.1
         */

        var objContext = runtime.getCurrentScript();
        var language = runtime.getCurrentScript().getParameter("LANGUAGE").substring(0, 2);
        //PARAMETROS
        var param_Json = {};

        var retType = '';
        var autoRetType = '';
        var paramOriginCity = '';
        var municipalityDataJson = {}

        var arrTransactions = new Array;
        var licenses;
        var featSubsi = null;
        var featMulti = null;
        var valFeatureDesc = false;

        var GLOBAL_LABELS = {
            "nodata": {
                "es": 'No existe informacion para los criterios seleccionados.',
                "pt": 'Não há informações para os critérios selecionados.',
                "en": 'There is no information for the selected criteria.'
            }
        }

        // IDS DE LA BUSQUEDA POR TOTALES
        var filtroRetencion;
        var filtroRetencionName;
        var filtroRetencionAmount;
        var columnaCodWht;
        var columnaWhtAmount;
        var columnaTasa;
        var columnaWhtVariable;

        var municipality = "";

        var vendorField = 'custrecord_lmry_taxres_entity';
        var taxResultId = 'customrecord_lmry_br_transaction';

        function getInputData() {

            ObtenerParametros();
            log.debug('parametros',param_Json)
            var retention = param_Json.id_Tipo_de_retencion;

            var hasVendorField = getVendorField();
            log.debug('hasVendorField',hasVendorField)

            for(var i=0; i<retention.length; i++){
                typeRetention(retention[i]);

                arrTransactions = arrTransactions.concat(getTransactionMainByIds(retention[i]));
                arrTransactions = arrTransactions.concat(getTransactionLineByIds(retention[i]));

                if(hasVendorField){
                    arrTransactions = arrTransactions.concat(getJournalMainByIds(retention[i]));
                    arrTransactions = arrTransactions.concat(getJournalLineByIds(retention[i]));
                }
            }
            arrTransactions = groupRetentions(arrTransactions);
            
            log.debug('arrTransactions',arrTransactions)
            return arrTransactions;

        }

        function map(context) {
            try {
                ObtenerParametros();
                var transactionResponse = {};
                var transactionIdType = JSON.parse(context.value);
                log.debug('[MAP] transactionIdType',transactionIdType);

                var search_result = [];
                var arrAjuste = [];

                for(var i=0; i < transactionIdType.length ; i++){

                    var transactionId = transactionIdType[i][0];
                    var retention = transactionIdType[i][2];
                    var typeRetentionAux = transactionIdType[i][1];

                    typeRetention(retention);

                    if (typeRetentionAux == "main") {
                        search_result = getMainInformation(transactionId,retention);
                    } else if(typeRetentionAux == "line"){
                        search_result = getLineInformation(transactionId,retention);
                    }else if(typeRetentionAux == "mainJournal"){
                        if(transactionIdType[i].length == 4){
                            arrAjuste = getMainJournalInformation(transactionId,retention);
                        }else{
                            search_result = getMainJournalInformation(transactionId,retention);
                        }
                    }else{
                        if(transactionIdType[i].length == 3){
                            search_result = getLineJournalInformation(transactionId,retention);
                        }
                    }
                }

                if(arrAjuste.length > 0){
                    search_result = replaceRetencion(search_result,arrAjuste)
                }

                // JSON ARRAY
                if (search_result != '' && search_result != null) {
                    var jsonTaxArray = search_result[6];
                } else {
                    var jsonTaxArray = [];
                }

                if (jsonTaxArray.length != 0) {

                    transactionResponse['transaction_id'] = transactionId;

                    transactionResponse['transaction_type'] = search_result[2];

                    //# No. Factura
                    if (search_result[3] != '' && search_result[3] != null) {
                        var documentNumber = search_result[3];
                    } else {
                        var documentNumber = '';
                    }

                    transactionResponse['transaction_no_factura'] = documentNumber;

                    var taxArrayByRetType = [];

                    for (var i = 0; i < jsonTaxArray.length; i++) {

                        if (jsonTaxArray[i]['subtype']['text'] == retType || jsonTaxArray[i]['subtype']['text'] == autoRetType|| jsonTaxArray[i]['subtype']['text'] == 'Retencion') {

                            taxArrayByRetType.push(jsonTaxArray[i]);
                        }

                    }
                    transactionResponse['transaction_json'] = taxArrayByRetType;

                    if (search_result[9] != '' && search_result[9] != null && (param_Json.id_origin_city == 1)) {
                        transactionResponse['municipality'] = getNameMumnicipality(search_result[9]);
                    } else {
                        transactionResponse['municipality'] = '';
                    }
                    
                    transactionResponse['retention'] = retType;

                    context.write({
                        key: transactionId,
                        value: transactionResponse
                    });

                }

            } catch (e) {
                log.error('[ Map Error ]', e);
            }

        }


        function summarize(context) {

            ObtenerParametros();

            //************* OBTENER DATOS DE LA MUNICIPALIDAD ******

            if (param_Json.id_origin_city == 1) {
                 municipality = getMunicipalityByVendor(param_Json.id_Vendor) ;
                municipality = municipality || 'BOGOTA';
            } else {
                 municipality = getMunicipalityBySubsidiary(param_Json.id_subsidiary) || 'BOGOTA';
            }

            //*************transaction******
            var numTransactions = 0;
            var transactionJSON = {};

            transactionJSON["parametros"] = param_Json;
            transactionJSON["transactions"] = {};
            transactionJSON["transactions"]["transactionIVA"] = {};
            transactionJSON["transactions"]["transactionFTE"] = {};
            transactionJSON["transactions"]["transactionICA"] = {};
            //transactionJSON["transactions"]["transactionReten"] = {};
            transactionJSON["muni_by_vendor_o_subsi"] = municipality;


            context.output.iterator().each(function (key, value) {

                value = JSON.parse(value);
                numTransactions++;
                if(value.retention == 'ReteIVA'){
                    transactionJSON["transactions"]["transactionIVA"][value.transaction_id] = value;
                }else if(value.retention == 'ReteFTE'){
                    transactionJSON["transactions"]["transactionFTE"][value.transaction_id] = value;

                }else if(value.retention == 'ReteICA'){
                    transactionJSON["transactions"]["transactionICA"][value.transaction_id] = value;
                }/*else if (value.retention == 'Retencion'){
                    transactionJSON["transactions"]["transactionReten"][value.transaction_id] = value;
                }*/

                return true;

            });

            var FolderId = objContext.getParameter({
                name: 'custscript_lmry_file_cabinet_rg_co'
            });

            var transactionFile = file.create({
                name: 'transactionCERT_RET.json',
                fileType: file.Type.JSON,
                contents: JSON.stringify(transactionJSON),
                folder: FolderId //18966
            }).save();


            if (numTransactions > 0) {
                log.debug("LLAMAR SCHDL");

                LlamarSchedule(transactionFile);
            } else {
                noData();
                Lib_certificate_massive.continueExecutionFlow(paramVendor,param_Json.id_rpt_generator_log,false,"","",true);
            }
            return true;

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

                municipalidad = getNameMumnicipality(municipality_id);
            }
            return municipalidad;

        }

        function getMunicipalityBySubsidiary(paramsubsidi) {

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
                    municipalidad = getNameMumnicipality(municipality_id);
                }
            }
            return municipalidad;
        }


        function getNameMumnicipality(municipality_id) {

            var municipalidad = '';

            if (municipality_id != '' && municipality_id != null) {
                if(municipalityDataJson[municipality_id] !== undefined){
                    return municipalityDataJson[municipality_id]
                }

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
                municipalityDataJson[municipality_id] = municipalidad;
            }

            return municipalidad;
        }

        function LlamarSchedule(transactionFile) {
            var params = {};

            params['custscript_lmry_co_cert_reten_param_schd'] = transactionFile;

            log.debug('PARAMETROS ENVIADOS', params);

            var RedirecSchdl = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: 'customscript_lmry_co_cert_reten_v2_schd',
                deploymentId: 'customdeploy_lmry_co_cert_reten_v2_schd',
                params: params
            });
            RedirecSchdl.submit();

        }

        function noData() {
            log.debug("NO DATA");
            var recordLog = record.load({
                type: 'customrecord_lmry_co_rpt_generator_log',
                id: param_Json.id_rpt_generator_log
            });

            //Nombre de Archivo
            recordLog.setValue({
                fieldId: 'custrecord_lmry_co_rg_name',
                value: GLOBAL_LABELS['nodata'][language]
            });
            recordLog.save();
        }


        function ObtenerParametros() {

            var nameDIAN = objContext.getParameter({
                name: 'custscript_lmry_co_dian_name'
            });
            if (nameDIAN == null || nameDIAN == "- None -" || nameDIAN == "") {
                nameDIAN = ' ';
            }
            paramsubsidi = objContext.getParameter({
                name: 'custscript_lmry_co_subsi_withbook_v2'
            });
            paramperiodoInicio = objContext.getParameter({
                name: 'custscript_lmry_co_periodini_withbook_v2'
            });

            paramperiodoFinal = objContext.getParameter({
                name: 'custscript_lmry_co_periodfin_withbook_v2'
            });

            paramMulti = objContext.getParameter({
                name: 'custscript_lmry_co_multibook_withbook_v2'
            });

            paramidrpt = objContext.getParameter({
                name: 'custscript_lmry_co_idrpt_withbook_v2'
            });

            paramVendor = objContext.getParameter({
                name: 'custscript_lmry_co_vendor_withbook_v2'
            });

            paramTyreten = objContext.getParameter({
                name: 'custscript_lmry_co_type_withbook_v2'
            }).split(/\u0005/);

            paramOriginCity = objContext.getParameter({
                name: 'custscript_lmry_co_city_origin_v2'
            });


            //Features
            featSubsi = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            featMulti = runtime.isFeatureInEffect({
                feature: "MULTIBOOK"
            });

            param_Globales = {
                id_rpt_generator_log: paramidrpt,
                id_subsidiary: paramsubsidi,
                id_multibook: paramMulti,
            }

            param_Json = libreriaReport.mergeObject(param_Json, param_Globales);

            param_Others = {
                id_Vendor: paramVendor,
                id_Tipo_de_retencion: paramTyreten,
                id_Fecha_ini: paramperiodoInicio,
                id_Fecha_fin: paramperiodoFinal,
                namedian: nameDIAN,
                id_origin_city: paramOriginCity,
            }

            param_Json = libreriaReport.mergeObject(param_Json, param_Others);

            //TODO: Obtiene el feature de retenciones por linea o cabecera
            licenses = libreriaReport.getLicenses(param_Json.id_subsidiary);

            //TODO: Se escoge los ids para los filtros de la busqueda de retenciones por totales
            valFeatureDesc = libreriaReport.getAuthorization(1054, licenses);

        }

        function getTransactionLineByIds(retention) {

            var formulaBrTransactionType = "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_br_type} IN ('" + retType + "', '" + autoRetType + "') THEN '1' ELSE '0' END";

            var transactionSearchObj = search.create({
                type: "transaction",
                filters: [
                    ["posting", "is", "T"],
                    "AND", ["type", "anyof", "VendBill", "VendCred"],
                    "AND", ["mainline", "is", "F"],
                    "AND", ["formulatext: CASE WHEN {customform} = 'Latam WHT - Vendor Bill' THEN 1 ELSE CASE WHEN {customform} = 'Latam WHT - Vendor Credit' THEN 2 ELSE 0 END END", "is", "0"],
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP",
                        label: "Internal ID"
                    })
                ]
            });

            var brTransacionFilter = search.createFilter({
                name: "formulatext",
                formula: formulaBrTransactionType,
                operator: search.Operator.IS,
                values: ['1']
            });
            transactionSearchObj.filters.push(brTransacionFilter);

            //Filtro para excluir Tax Results creados por Modulo Header
            var linesFilter = search.createFilter({
                join: "custrecord_lmry_br_transaction",
                name: "custrecord_lmry_co_acc_exo_concept",
                operator: "anyof",
                values: ["@NONE@"]
            })
            transactionSearchObj.filters.push(linesFilter);


            if (param_Json.id_subsidiary != '' && param_Json.id_subsidiary != null) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [param_Json.id_subsidiary]
                });
                transactionSearchObj.filters.push(subsidiaryFilter);
            }

            var periodFilterIni = search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORAFTER,
                values: [param_Json.id_Fecha_ini]
            });
            transactionSearchObj.filters.push(periodFilterIni);

            var periodFilterFin = search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORBEFORE,
                values: [param_Json.id_Fecha_fin]
            });
            transactionSearchObj.filters.push(periodFilterFin);
            var vendorFormula = "CASE WHEN NVL({custcol_lmry_exp_rep_vendor_colum.internalid},{vendor.internalid}) = " + param_Json.id_Vendor  +
            " THEN 1 ELSE 0  END"

            var vendorLineFilter = search.createFilter({
                name: 'formulanumeric',
                formula: vendorFormula,
                operator: search.Operator.EQUALTO,
                values: 1
            });
            transactionSearchObj.filters.push(vendorLineFilter);

            if (param_Json.id_multibook != '' && param_Json.id_multibook != null) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [param_Json.id_multibook]
                });
                transactionSearchObj.filters.push(multibookFilter);

            }

            var myPageData = transactionSearchObj.runPaged({
                pageSize: 1000
            });

            var page, idTransaction;
            var transactionsArray = [];

            myPageData.pageRanges.forEach(function (pageRange) {

                page = myPageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var transactionType = "line";
                    idTransaction = '';
                    // 0. Internal ID
                    if (result.getValue(result.columns[0]) != '- None -') {
                        idTransaction = result.getValue(result.columns[0]);
                    } else {
                        idTransaction = '';
                    }
                    transactionsArray.push([idTransaction, transactionType, retention]);
                });
            });

            return transactionsArray;

        }

        function getJournalLineByIds(retention) {

            var formulaBrTransactionType = "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_br_type} IN ('" + retType + "', '" + autoRetType + "') THEN '1' ELSE '0' END";

            var transactionSearchObj = search.create({
                type: "journalentry",
                filters: [
                    ["posting", "is", "T"],
                   // "AND", ["type", "anyof", "VendBill", "VendCred"],
                   // "AND", ["mainline", "is", "F"],
                    "AND", ["formulatext: CASE WHEN {customform} = 'Latam WHT - Vendor Bill' THEN 1 ELSE CASE WHEN {customform} = 'Latam WHT - Vendor Credit' THEN 2 ELSE 0 END END", "is", "0"],
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP",
                        label: "Internal ID"
                    })
                ]
            });

            var brTransacionFilter = search.createFilter({
                name: "formulatext",
                formula: formulaBrTransactionType,
                operator: search.Operator.IS,
                values: ['1']
            });
            transactionSearchObj.filters.push(brTransacionFilter);

            //Filtro para excluir Tax Results creados por Modulo Header
            var linesFilter = search.createFilter({
                join: "custrecord_lmry_br_transaction",
                name: "custrecord_lmry_co_acc_exo_concept",
                operator: "anyof",
                values: ["@NONE@"]
            })
            transactionSearchObj.filters.push(linesFilter);

            var taxtypeFilter = search.createFilter({
                join: "custrecord_lmry_br_transaction",
                name: "custrecord_lmry_tax_type",
                operator: search.Operator.IS,
                values: 1
            })
            transactionSearchObj.filters.push(taxtypeFilter);


            if (param_Json.id_subsidiary != '' && param_Json.id_subsidiary != null) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [param_Json.id_subsidiary]
                });
                transactionSearchObj.filters.push(subsidiaryFilter);
            }

            var periodFilterIni = search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORAFTER,
                values: [param_Json.id_Fecha_ini]
            });
            transactionSearchObj.filters.push(periodFilterIni);

            var periodFilterFin = search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORBEFORE,
                values: [param_Json.id_Fecha_fin]
            });
            transactionSearchObj.filters.push(periodFilterFin);
            var vendorFormula = "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_taxres_entity.id} = " + param_Json.id_Vendor  +
            " THEN 1 ELSE 0  END"

            var vendorLineFilter = search.createFilter({
                name: 'formulanumeric',
                formula: vendorFormula,
                operator: search.Operator.EQUALTO,
                values: 1
            });
            transactionSearchObj.filters.push(vendorLineFilter);

            if (param_Json.id_multibook != '' && param_Json.id_multibook != null) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [param_Json.id_multibook]
                });
                transactionSearchObj.filters.push(multibookFilter);

            }

            var myPageData = transactionSearchObj.runPaged({
                pageSize: 1000
            });

            var page, idTransaction;
            var transactionsArray = [];

            myPageData.pageRanges.forEach(function (pageRange) {

                page = myPageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var transactionType = "lineJournal";
                    idTransaction = '';
                    // 0. Internal ID
                    if (result.getValue(result.columns[0]) != '- None -') {
                        idTransaction = result.getValue(result.columns[0]);
                    } else {
                        idTransaction = '';
                    }
                    transactionsArray.push([idTransaction, transactionType, retention]);
                });
            });

            return transactionsArray;

        }

        function getJournalMainByIds(retention) {

            var formulaBrTransactionType = "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_br_type} IN ('" + retType + "', '" + autoRetType + "') THEN '1' ELSE '0' END";

            var transactionSearchObj = search.create({
                type: "journalentry",
                filters: [
                    ["posting", "is", "T"],
                    "AND", [filtroRetencionName,"is","0"]    
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        formula: "CASE WHEN NVL({custrecord_lmry_br_transaction.custrecord_lmry_base_amount_local_currc},'') = 0 THEN NVL({custrecord_lmry_br_transaction.custrecord_lmry_co_wht_applied.id},'') ELSE 0 END",
                        summary: "GROUP",
                        label: "TransacionAjuste"
                    })
                ]
            });

            var brTransacionFilter = search.createFilter({
                name: "formulatext",
                formula: formulaBrTransactionType,
                operator: search.Operator.IS,
                values: ['1']
            });
            transactionSearchObj.filters.push(brTransacionFilter);

            //Filtro para tomar solo Tax Results creados por Modulo Header
            var linesFilter = search.createFilter({
                join: "custrecord_lmry_br_transaction",
                name: "custrecord_lmry_co_acc_exo_concept",
                operator: "noneof",
                values: ["@NONE@"]
            })
            transactionSearchObj.filters.push(linesFilter);

            var taxtypeFilter = search.createFilter({
                join: "custrecord_lmry_br_transaction",
                name: "custrecord_lmry_tax_type",
                operator: search.Operator.IS,
                values: 1
            })
            transactionSearchObj.filters.push(taxtypeFilter);

            if (param_Json.id_subsidiary != '' && param_Json.id_subsidiary != null) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [param_Json.id_subsidiary]
                });
                transactionSearchObj.filters.push(subsidiaryFilter);
            }

            var periodFilterIni = search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORAFTER,
                values: [param_Json.id_Fecha_ini]
            });
            transactionSearchObj.filters.push(periodFilterIni);

            var periodFilterFin = search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORBEFORE,
                values: [param_Json.id_Fecha_fin]
            });
            transactionSearchObj.filters.push(periodFilterFin);
            
            var vendorFormula = "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_taxres_entity.id} = " + param_Json.id_Vendor  + " THEN 1 ELSE 0  END";
            var vendorLineFilter = search.createFilter({
                name: 'formulanumeric',
                formula: vendorFormula,
                operator: search.Operator.EQUALTO,
                values: 1
            });
            transactionSearchObj.filters.push(vendorLineFilter);

            if (param_Json.id_multibook != '' && param_Json.id_multibook != null) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [param_Json.id_multibook]
                });
                transactionSearchObj.filters.push(multibookFilter);
            }

            var myPageData = transactionSearchObj.runPaged({
                pageSize: 1000
            });

            var page, idTransaction, idAjuste;
            var transactionsArray = [];

            myPageData.pageRanges.forEach(function (pageRange) {

                page = myPageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var transactionType = "mainJournal";
                    idTransaction = '';
                    idAjuste = '';
                    // 0. Internal ID
                    if (result.getValue(result.columns[0]) != '- None -') {
                        idTransaction = result.getValue(result.columns[0]);
                    }
                    if (result.getValue(result.columns[1])!= '- None -') {
                        idAjuste = result.getValue(result.columns[1]);
                    }
                    if(idAjuste != '' && idAjuste != 0){
                        transactionsArray.push([idTransaction, transactionType, retention, idAjuste]);
                    }else{
                        transactionsArray.push([idTransaction, transactionType, retention]);
                    }
                });
            });

            return transactionsArray;

        }



        function getTransactionMainByIds(retention) {

            log.debug('retType', retType);
            log.debug('autoRetType', autoRetType);

            var formulaBrTransactionType = "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_br_type} IN ('" + retType + "', '" + autoRetType + "') THEN '1' ELSE '0' END";

            log.debug('formulaBrTransactionType',formulaBrTransactionType);

            var transactionSearchObj = search.create({
                type: "transaction",
                filters: [
                    ["posting", "is", "T"],
                    "AND", ["type", "anyof", "VendBill", "VendCred"],
                    "AND", ["mainline", "is", "F"],
                    "AND", ["formulatext: CASE WHEN {customform} = 'Latam WHT - Vendor Bill' THEN 1 ELSE CASE WHEN {customform} = 'Latam WHT - Vendor Credit' THEN 2 ELSE 0 END END", "is", "0"],
                    "AND", [filtroRetencionName,"is","0"]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP",
                        label: "Internal ID"
                    })
                ]
            });

            var brTransacionFilter = search.createFilter({
                name: "formulatext",
                formula: formulaBrTransactionType,
                operator: search.Operator.IS,
                values: ['1']
            });

            transactionSearchObj.filters.push(brTransacionFilter);

            //Filtro para tomar solo Tax Results creados por Modulo Header
            var linesFilter = search.createFilter({
                join: "custrecord_lmry_br_transaction",
                name: "custrecord_lmry_co_acc_exo_concept",
                operator: "noneof",
                values: ["@NONE@"]
            })
            transactionSearchObj.filters.push(linesFilter);


            if (param_Json.id_subsidiary != '' && param_Json.id_subsidiary != null) {
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: [param_Json.id_subsidiary]
                });
                transactionSearchObj.filters.push(subsidiaryFilter);
            }

            var periodFilterIni = search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORAFTER,
                values: [param_Json.id_Fecha_ini]
            });
            transactionSearchObj.filters.push(periodFilterIni);

            var periodFilterFin = search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORBEFORE,
                values: [param_Json.id_Fecha_fin]
            });
            transactionSearchObj.filters.push(periodFilterFin);
            var vendorFormula = "CASE WHEN NVL({custcol_lmry_exp_rep_vendor_colum.internalid},{vendor.internalid}) = " + param_Json.id_Vendor  +
            " THEN 1 ELSE 0  END"

            var vendorLineFilter = search.createFilter({
                name: 'formulanumeric',
                formula: vendorFormula,
                operator: search.Operator.EQUALTO,
                values: 1
            });

            transactionSearchObj.filters.push(vendorLineFilter);

            if (param_Json.id_multibook != '' && param_Json.id_multibook != null) {
                var multibookFilter = search.createFilter({
                    name: 'accountingbook',
                    join: 'accountingtransaction',
                    operator: search.Operator.IS,
                    values: [param_Json.id_multibook]
                });
                transactionSearchObj.filters.push(multibookFilter);

            }

            var myPageData = transactionSearchObj.runPaged({
                pageSize: 1000
            });

            var page, idTransaction;
            var transactionsArray = [];

            myPageData.pageRanges.forEach(function (pageRange) {

                page = myPageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var transactionType = "main";
                    idTransaction = '';
                    // 0. Internal ID
                    if (result.getValue(result.columns[0]) != '- None -') {
                        idTransaction = result.getValue(result.columns[0]);
                    } else {
                        idTransaction = '';
                    }
                    transactionsArray.push([idTransaction, transactionType, retention]);
                });
            });

            return transactionsArray;

        }


        function getLineInformation(id,retention) {
            var auxArray;

            var intDMinReg = 0;
            var intDMaxReg = 1000;
            var DbolStop = false;
            var auxArray;
            var tasa, netAmount, retAmount, concepto;
            var auxArrJson = [];
            var formulaBrTransactionType = "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_br_type} IN ('" + retType + "', '" + autoRetType + "') THEN '1' ELSE '0' END";

            var transactionSearchObj = search.create({
                type: "transaction",
                filters: [
                    ["internalid", "anyof", id]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP",
                        label: "0. Internal ID"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: "{custrecord_lmry_br_transaction.custrecord_lmry_tax_description}",
                        label: "1. Código WHT"
                    }),
                    search.createColumn({ name: "type", summary: "GROUP",label: "2. Tipo de Transaccion" }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: "NVL({tranid},'')",
                        label: "3. Documento"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "NVL({custrecord_lmry_br_transaction.custrecord_lmry_base_amount_local_currc}, {custrecord_lmry_br_transaction.custrecord_lmry_base_amount})",
                        label: "4. Base imponible"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "  NVL({custrecord_lmry_br_transaction.custrecord_lmry_amount_local_currency}, {custrecord_lmry_br_transaction.custrecord_lmry_br_total})",
                        label: "5. Retencion"
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        summary: "GROUP",
                        formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent} * 10000",
                        label: "6. TASA"
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        formula: "NVL({custcol_lmry_exp_rep_vendor_colum.internalid},{vendor.internalid})",
                        summary: "GROUP",
                        label: "7. Vendor Line"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: "CONCAT(CONCAT({custbody_lmry_serie_doc_cxp},'-'),{custbody_lmry_num_preimpreso})",
                        label: "8. Documento Serie-Number"
                    }),
                ]
            });

            var taxResultsFilter = search.createFilter({
                formula: "CASE WHEN {lineuniquekey} = {custrecord_lmry_br_transaction.custrecord_lmry_lineuniquekey} THEN 1 ELSE 0 END",
                name: "formulanumeric",
                operator: search.Operator.EQUALTO,
                values: 1
            })
            transactionSearchObj.filters.push(taxResultsFilter);

            var brTransacionFilter = search.createFilter({
                name: "formulatext",
                formula: formulaBrTransactionType,
                operator: search.Operator.IS,
                values: ['1']
            });
            transactionSearchObj.filters.push(brTransacionFilter);

            var vendorLineFilter = search.createFilter({
                name: 'formulanumeric',
                formula: "CASE WHEN NVL({custcol_lmry_exp_rep_vendor_colum.internalid},{vendor.internalid}) = " + param_Json.id_Vendor +
                    " THEN 1 ELSE 0  END",
                operator: search.Operator.EQUALTO,
                values: 1
            })
            transactionSearchObj.filters.push(vendorLineFilter);

            //8.- Municipalidad
            var municipTransaction = search.createColumn({
                name: "internalid",
                join: "CUSTBODY_LMRY_MUNICIPALITY",
                summary: "GROUP",
                label: "9. Municipality"
            });
            transactionSearchObj.columns.push(municipTransaction);

            var searchresult = transactionSearchObj.run();

            while (!DbolStop) {
                var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

                if (objResult != null) {
                    var intLength = objResult.length;
                    if (intLength != 1000) {
                        DbolStop = true;
                    }

                    for (var i = 0; i < intLength; i++) {
                        var columns = objResult[i].columns;
                        tasa = '', netAmount = '', retAmount = '', concepto = '';
                        auxArray = [];

                        //0. Internal ID
                        if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -') {
                            auxArray[0] = objResult[i].getValue(columns[0]);
                        } else {
                            auxArray[0] = '';
                        }

                        auxArray[1] = '';

                        // 1. Código WHT
                        if (objResult[i].getValue(columns[1]) != null && objResult[i].getValue(columns[1]) != '- None -') {
                            concepto = objResult[i].getValue(columns[1]);
                        } else {
                            concepto = '';
                        }

                        // 2. Type
                        if (objResult[i].getValue(columns[2]) != null && objResult[i].getValue(columns[2]) != '- None -') {
                            auxArray[2] = objResult[i].getValue(columns[2]);
                        } else {
                            auxArray[2] = '';
                        }

                        // 3. No Factura
                        if (objResult[i].getValue(columns[8]) != null && objResult[i].getValue(columns[8]) != '- None -' && objResult[i].getValue(columns[8]) != '-') {
                            auxArray[3] = objResult[i].getValue(columns[8]);
                        } else if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -' ) {
                            auxArray[3] = objResult[i].getValue(columns[3]);
                        } else {
                            auxArray[3] = '';
                        }

                        auxArray[4] = '';
                        auxArray[5] = '';

                        // 4. NET AMOUNT
                        if (objResult[i].getValue(columns[4]) != null && objResult[i].getValue(columns[4]) != '- None -') {
                            if (objResult[i].getValue(columns[2]) == "VendCred") {
                                netAmount = String(Number(objResult[i].getValue(columns[4])) * (-1));
                            } else {
                                netAmount = objResult[i].getValue(columns[4]);
                            }
                        } else {
                            netAmount = '0.00';
                        }

                        // 5. RETENCION
                        if (objResult[i].getValue(columns[5]) != null && objResult[i].getValue(columns[5]) != '- None -') {
                            if (objResult[i].getValue(columns[2]) == "VendCred") {
                                retAmount = String(Number(objResult[i].getValue(columns[5])) * (-1));
                            } else {
                                retAmount = objResult[i].getValue(columns[5]);
                            }
                        } else {
                            retAmount = '0.00';
                        }

                        // 6. BASE IMPONIBLE
                        if (objResult[i].getValue(columns[6]) != null && objResult[i].getValue(columns[6]) != '- None -') {
                            tasa = Number(objResult[i].getValue(columns[6])).toFixed(2) + "%";
                        } else {
                            tasa = '';
                        }


                        if (objResult[i].getValue(columns[7]) != null && objResult[i].getValue(columns[7]) != '- None -') {
                            vendorLine =  objResult[i].getValue(columns[7]);

                        } else {
                            vendorLine =  '';
                        }


                        // JSON
                        auxArrJson.push({
                            subtype: {
                                text: retType
                            },
                            lc_baseamount: netAmount,
                            lc_whtamount: retAmount,
                            whtrate: tasa,
                            description: concepto,
                            vendor: vendorLine
                        });

                        auxArray[6] = auxArrJson;

                        // 7. MUICIPALIDAD
                        if (param_Json.id_origin_city == 1) {
                            auxArray[9] = objResult[i].getValue(columns[9]);
                        } else {
                            auxArray[9] = '';
                        }

                    }

                } else {
                    DbolStop = true;
                }
            }
            return auxArray;
        }

        function getMainInformation(id,retention) {
            var auxArray;

            var intDMinReg = 0;
            var intDMaxReg = 1000;
            var DbolStop = false;
            var auxArray;
            var tasa, netAmount, retAmount, concepto;
            var auxArrJson = [];
            var formulaBrTransactionType = "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_br_type} IN ('" + retType + "', '" + autoRetType + "') THEN '1' ELSE '0' END";

            var transactionSearchObj = search.create({
                type: "transaction",
                filters: [
                    ["internalid", "anyof", id]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP",
                        label: "0. Internal ID"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: columnaCodWht,
                        label: "1. Código WHT"
                    }),
                    search.createColumn({
                         name: "type",
                         summary: "GROUP",
                         label: "2. Tipo"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: "NVL({tranid},'')",
                        label: "3. Documento TranId"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "NVL({custrecord_lmry_br_transaction.custrecord_lmry_base_amount_local_currc}, {custrecord_lmry_br_transaction.custrecord_lmry_base_amount})",
                        label: "4. Base imponible"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "  NVL({custrecord_lmry_br_transaction.custrecord_lmry_amount_local_currency}, {custrecord_lmry_br_transaction.custrecord_lmry_br_total})",
                        label: "5. Retencion"
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        summary: "GROUP",
                        formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent} * 10000",
                        label: "6. TASA"
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        formula: "NVL({custcol_lmry_exp_rep_vendor_colum.internalid},{vendor.internalid})",
                        summary: "GROUP",
                        label: "7. Vendor Line"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: "CONCAT(CONCAT({custbody_lmry_serie_doc_cxp},'-'),{custbody_lmry_num_preimpreso})",
                        label: "8. Documento Serie-Number"
                    }),
                ]
            });

            var taxResultsFilter = search.createFilter({
                formula: "CASE WHEN {lineuniquekey} = {custrecord_lmry_br_transaction.custrecord_lmry_lineuniquekey} THEN 1 ELSE 0 END",
                name: "formulanumeric",
                operator: search.Operator.EQUALTO,
                values: 1
            })
            transactionSearchObj.filters.push(taxResultsFilter);

            var brTransacionFilter = search.createFilter({
                name: "formulatext",
                formula: formulaBrTransactionType,
                operator: search.Operator.IS,
                values: ['1']
            });
            transactionSearchObj.filters.push(brTransacionFilter);

            var vendorLineFilter = search.createFilter({
                name: 'formulanumeric',
                formula: "CASE WHEN NVL({custcol_lmry_exp_rep_vendor_colum.internalid},{vendor.internalid}) = " + param_Json.id_Vendor +
                    " THEN 1 ELSE 0  END",
                operator: search.Operator.EQUALTO,
                values: 1
            })
            transactionSearchObj.filters.push(vendorLineFilter);

            if (param_Json.id_origin_city == 1) {
                //9.- Municipalidad
                var municipTransaction = search.createColumn({
                    name: "internalid",
                    join: "CUSTBODY_LMRY_MUNICIPALITY",
                    summary: "GROUP",
                    label: "9. Municipality"
                });
                transactionSearchObj.columns.push(municipTransaction);


            }

            var searchresult = transactionSearchObj.run();

            while (!DbolStop) {
                var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

                if (objResult != null) {
                    var intLength = objResult.length;
                    if (intLength != 1000) {
                        DbolStop = true;
                    }

                    for (var i = 0; i < intLength; i++) {
                        var columns = objResult[i].columns;
                        tasa = '', netAmount = '', retAmount = '', concepto = '';
                        auxArray = [];

                        //0. Internal ID
                        if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -') {
                            auxArray[0] = objResult[i].getValue(columns[0]);
                        } else {
                            auxArray[0] = '';
                        }

                        auxArray[1] = '';

                        // 1. Código WHT
                        if (objResult[i].getValue(columns[1]) != null && objResult[i].getValue(columns[1]) != '- None -') {
                            concepto = objResult[i].getValue(columns[1]);
                        } else {
                            concepto = '';
                        }

                        // 2. Type
                        if (objResult[i].getValue(columns[2]) != null && objResult[i].getValue(columns[2]) != '- None -') {
                            auxArray[2] = objResult[i].getValue(columns[2]);
                        } else {
                            auxArray[2] = '';
                        }

                        // 3. No Factura
                        if (objResult[i].getValue(columns[8]) != null && objResult[i].getValue(columns[8]) != '- None -' && objResult[i].getValue(columns[8]) != '-') {
                            auxArray[3] = objResult[i].getValue(columns[8]);
                        } else if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -' ) {
                            auxArray[3] = objResult[i].getValue(columns[3]);
                        } else {
                            auxArray[3] = '';
                        }

                        auxArray[4] = '';
                        auxArray[5] = '';

                        // 4. NET AMOUNT
                        if (objResult[i].getValue(columns[4]) != null && objResult[i].getValue(columns[4]) != '- None -') {
                            if (objResult[i].getValue(columns[2]) == "VendCred") {
                                netAmount = String(Number(objResult[i].getValue(columns[4])) * (-1));
                            } else {
                                netAmount = objResult[i].getValue(columns[4]);
                            }
                        } else {
                            netAmount = '0.00';
                        }

                        // 5. RETENCION
                        if (objResult[i].getValue(columns[5]) != null && objResult[i].getValue(columns[5]) != '- None -') {
                            if (objResult[i].getValue(columns[2]) == "VendCred") {
                                retAmount = String(Number(objResult[i].getValue(columns[5])) * (-1));
                            } else {
                                retAmount = objResult[i].getValue(columns[5]);
                            }
                        } else {
                            retAmount = '0.00';
                        }

                        // 6. BASE IMPONIBLE
                        if (objResult[i].getValue(columns[6]) != null && objResult[i].getValue(columns[6]) != '- None -') {
                            tasa = Number(objResult[i].getValue(columns[6])).toFixed(2) + "%";
                        } else {
                            tasa = '';
                        }


                        if (objResult[i].getValue(columns[7]) != null && objResult[i].getValue(columns[7]) != '- None -') {
                            vendorLine =  objResult[i].getValue(columns[7]);

                        } else {
                            vendorLine =  '';
                        }


                        // JSON
                        auxArrJson.push({
                            subtype: {
                                text: retType
                            },
                            lc_baseamount: netAmount,
                            lc_whtamount: retAmount,
                            whtrate: tasa,
                            description: concepto,
                            municipality: '',
                            vendor: vendorLine
                        });

                        auxArray[6] = auxArrJson;

                        // 7. MUICIPALIDAD
                        if (param_Json.id_origin_city == 1) {
                            auxArray[9] = objResult[i].getValue(columns[9]);
                        } else {
                            auxArray[9] = '';
                        }

                    }

                } else {
                    DbolStop = true;
                }
            }
            return auxArray;
        }

        function getLineJournalInformation(id,retention) {
            var auxArray;

            var intDMinReg = 0;
            var intDMaxReg = 1000;
            var DbolStop = false;
            var auxArray;
            var tasa, netAmount, retAmount, concepto;
            var auxArrJson = [];
            var formulaBrTransactionType = "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_br_type} IN ('" + retType + "', '" + autoRetType + "') THEN '1' ELSE '0' END";

            var transactionSearchObj = search.create({
                type: "journalentry",
                filters: [
                    ["internalid", "anyof", id]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP",
                        label: "0. Internal ID"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: "{custrecord_lmry_br_transaction.custrecord_lmry_tax_description}",
                        label: "1. Código WHT"
                    }),
                    search.createColumn({ name: "type", summary: "GROUP",label: "2. Tipo de Transaccion" }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: "NVL({tranid},'')",
                        label: "3. Documento"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "NVL({custrecord_lmry_br_transaction.custrecord_lmry_base_amount_local_currc}, {custrecord_lmry_br_transaction.custrecord_lmry_base_amount})",
                        label: "4. Base imponible"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "  NVL({custrecord_lmry_br_transaction.custrecord_lmry_amount_local_currency}, {custrecord_lmry_br_transaction.custrecord_lmry_br_total})",
                        label: "5. Retencion"
                    }),
                    search.createColumn({
                        name: "formulapercent",
                        summary: "GROUP",
                        formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent}",// * 10000",
                        label: "6. TASA"
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        formula: "{custrecord_lmry_br_transaction.custrecord_lmry_taxres_entity.id}",
                        summary: "GROUP",
                        label: "7. Vendor Line"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: "CONCAT(CONCAT({custbody_lmry_serie_doc_cxc},'-'),{custbody_lmry_num_preimpreso})",
                        label: "8. Documento Serie-Number"
                    }),
                ]
            });

            var taxResultsFilter = search.createFilter({
                formula: "CASE WHEN {lineuniquekey} = {custrecord_lmry_br_transaction.custrecord_lmry_lineuniquekey} THEN 1 ELSE 0 END",
                name: "formulanumeric",
                operator: search.Operator.EQUALTO,
                values: 1
            })
            transactionSearchObj.filters.push(taxResultsFilter);

            var taxtypeFilter = search.createFilter({
                join: "custrecord_lmry_br_transaction",
                name: "custrecord_lmry_tax_type",
                operator: search.Operator.IS,
                values: 1
            })
            transactionSearchObj.filters.push(taxtypeFilter);

            var brTransacionFilter = search.createFilter({
                name: "formulatext",
                formula: formulaBrTransactionType,
                operator: search.Operator.IS,
                values: ['1']
            });
            transactionSearchObj.filters.push(brTransacionFilter);

            var vendorLineFilter = search.createFilter({
                name: 'formulanumeric',
                formula: "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_taxres_entity.id} = " + param_Json.id_Vendor +
                    " THEN 1 ELSE 0  END",
                operator: search.Operator.EQUALTO,
                values: 1
            })
            transactionSearchObj.filters.push(vendorLineFilter);

            //8.- Municipalidad
            var municipTransaction = search.createColumn({
                name: "internalid",
                join: "CUSTBODY_LMRY_MUNICIPALITY",
                summary: "GROUP",
                label: "9. Municipality"
            });
            transactionSearchObj.columns.push(municipTransaction);



            var searchresult = transactionSearchObj.run();

            while (!DbolStop) {
                var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

                if (objResult != null) {
                    var intLength = objResult.length;
                    if (intLength != 1000) {
                        DbolStop = true;
                    }

                    for (var i = 0; i < intLength; i++) {
                        var columns = objResult[i].columns;
                        tasa = '', netAmount = '', retAmount = '', concepto = '';
                        auxArray = [];

                        //0. Internal ID
                        if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -') {
                            auxArray[0] = objResult[i].getValue(columns[0]);
                        } else {
                            auxArray[0] = '';
                        }

                        auxArray[1] = '';

                        // 1. Código WHT
                        if (objResult[i].getValue(columns[1]) != null && objResult[i].getValue(columns[1]) != '- None -') {
                            concepto = objResult[i].getValue(columns[1]);
                        } else {
                            concepto = '';
                        }

                        // 2. Type
                        if (objResult[i].getValue(columns[2]) != null && objResult[i].getValue(columns[2]) != '- None -') {
                            auxArray[2] = objResult[i].getValue(columns[2]);
                        } else {
                            auxArray[2] = '';
                        }

                        // 3. No Factura
                        if (objResult[i].getValue(columns[8]) != null && objResult[i].getValue(columns[8]) != '- None -' && objResult[i].getValue(columns[8]) != '-') {
                            auxArray[3] = objResult[i].getValue(columns[8]);
                        } else if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -' ) {
                            auxArray[3] = objResult[i].getValue(columns[3]);
                        } else {
                            auxArray[3] = '';
                        }

                        auxArray[4] = '';
                        auxArray[5] = '';

                        // 4. NET AMOUNT
                        if (objResult[i].getValue(columns[4]) != null && objResult[i].getValue(columns[4]) != '- None -') {
                            if (objResult[i].getValue(columns[2]) == "VendCred") {
                                netAmount = String(Number(objResult[i].getValue(columns[4])) * (-1));
                            } else {
                                netAmount = objResult[i].getValue(columns[4]);
                            }
                        } else {
                            netAmount = '0.00';
                        }

                        // 5. RETENCION
                        if (objResult[i].getValue(columns[5]) != null && objResult[i].getValue(columns[5]) != '- None -') {
                            if (objResult[i].getValue(columns[2]) == "VendCred") {
                                retAmount = String(Number(objResult[i].getValue(columns[5])) * (-1));
                            } else {
                                retAmount = objResult[i].getValue(columns[5]);
                            }
                        } else {
                            retAmount = '0.00';
                        }

                        // 6. BASE IMPONIBLE
                        if (objResult[i].getValue(columns[6]) != null && objResult[i].getValue(columns[6]) != '- None -') {
                            tasa = objResult[i].getValue(columns[6]); //Number(objResult[i].getValue(columns[6])).toFixed(2) + "%";
                        } else {
                            tasa = '';
                        }


                        if (objResult[i].getValue(columns[7]) != null && objResult[i].getValue(columns[7]) != '- None -') {
                            vendorLine =  objResult[i].getValue(columns[7]);

                        } else {
                            vendorLine =  '';
                        }


                        // JSON
                        auxArrJson.push({
                            subtype: {
                                text: retType
                            },
                            lc_baseamount: netAmount,
                            lc_whtamount: retAmount,
                            whtrate: tasa,
                            description: concepto,
                            vendor: vendorLine
                        });

                        auxArray[6] = auxArrJson;

                        // 7. MUICIPALIDAD
                        if (param_Json.id_origin_city == 1) {
                            //Logica de Cabecera
                            auxArray[9] = objResult[i].getValue(columns[9]);
                        } else {
                            auxArray[9] = '';
                        }

                    }

                } else {
                    DbolStop = true;
                }
            }
            return auxArray;
        }


        function getMainJournalInformation(id,retention) {
            var auxArray;

            var intDMinReg = 0;
            var intDMaxReg = 1000;
            var DbolStop = false;
            var auxArray;
            var tasa, netAmount, retAmount, concepto;
            var auxArrJson = [];
            var formulaBrTransactionType = "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_br_type} IN ('" + retType + "', '" + autoRetType + "') THEN '1' ELSE '0' END";

            var transactionSearchObj = search.create({
                type: "journalentry",
                filters: [
                    ["internalid", "anyof", id]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP",
                        label: "0. Internal ID"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: columnaCodWht,
                        label: "1. Código WHT"
                    }),
                    search.createColumn({
                         name: "type",
                         summary: "GROUP",
                         label: "2. Tipo"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: "NVL({tranid},'')",
                        label: "3. Documento TranId"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "NVL({custrecord_lmry_br_transaction.custrecord_lmry_base_amount_local_currc}, {custrecord_lmry_br_transaction.custrecord_lmry_base_amount})",
                        label: "4. Base imponible"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "  NVL({custrecord_lmry_br_transaction.custrecord_lmry_amount_local_currency}, {custrecord_lmry_br_transaction.custrecord_lmry_br_total})",
                        label: "5. Retencion"
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        summary: "GROUP",
                        formula: "{custrecord_lmry_br_transaction.custrecord_lmry_br_percent} * 10000",
                        label: "6. TASA"
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        formula: "{custrecord_lmry_br_transaction.custrecord_lmry_taxres_entity.id}",
                        summary: "GROUP",
                        label: "7. Vendor Line"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: "CONCAT(CONCAT({custbody_lmry_serie_doc_cxc},'-'),{custbody_lmry_num_preimpreso})",
                        label: "8. Documento Serie-Number"
                    }),
                ]
            });

            var taxResultsFilter = search.createFilter({
                formula: "CASE WHEN {lineuniquekey} = {custrecord_lmry_br_transaction.custrecord_lmry_lineuniquekey} THEN 1 ELSE 0 END",
                name: "formulanumeric",
                operator: search.Operator.EQUALTO,
                values: 1
            })
            transactionSearchObj.filters.push(taxResultsFilter);

            var brTransacionFilter = search.createFilter({
                name: "formulatext",
                formula: formulaBrTransactionType,
                operator: search.Operator.IS,
                values: ['1']
            });
            transactionSearchObj.filters.push(brTransacionFilter);

            var taxtypeFilter = search.createFilter({
                join: "custrecord_lmry_br_transaction",
                name: "custrecord_lmry_tax_type",
                operator: search.Operator.IS,
                values: 1
            })
            transactionSearchObj.filters.push(taxtypeFilter);

            var vendorLineFilter = search.createFilter({
                name: 'formulanumeric',
                formula: "CASE WHEN {custrecord_lmry_br_transaction.custrecord_lmry_taxres_entity.id} = " + param_Json.id_Vendor +
                    " THEN 1 ELSE 0  END",
                operator: search.Operator.EQUALTO,
                values: 1
            })
            transactionSearchObj.filters.push(vendorLineFilter);

            if (param_Json.id_origin_city == 1) {
                //9.- Municipalidad
                var municipTransaction = search.createColumn({
                    name: "internalid",
                    join: "CUSTBODY_LMRY_MUNICIPALITY",
                    summary: "GROUP",
                    label: "9. Municipality"
                });
                transactionSearchObj.columns.push(municipTransaction);


            }

            var searchresult = transactionSearchObj.run();

            while (!DbolStop) {
                var objResult = searchresult.getRange(intDMinReg, intDMaxReg);

                if (objResult != null) {
                    var intLength = objResult.length;
                    if (intLength != 1000) {
                        DbolStop = true;
                    }

                    for (var i = 0; i < intLength; i++) {
                        var columns = objResult[i].columns;
                        tasa = '', netAmount = '', retAmount = '', concepto = '';
                        auxArray = [];

                        //0. Internal ID
                        if (objResult[i].getValue(columns[0]) != null && objResult[i].getValue(columns[0]) != '- None -') {
                            auxArray[0] = objResult[i].getValue(columns[0]);
                        } else {
                            auxArray[0] = '';
                        }

                        auxArray[1] = '';

                        // 1. Código WHT
                        if (objResult[i].getValue(columns[1]) != null && objResult[i].getValue(columns[1]) != '- None -') {
                            concepto = objResult[i].getValue(columns[1]);
                        } else {
                            concepto = '';
                        }

                        // 2. Type
                        if (objResult[i].getValue(columns[2]) != null && objResult[i].getValue(columns[2]) != '- None -') {
                            auxArray[2] = objResult[i].getValue(columns[2]);
                        } else {
                            auxArray[2] = '';
                        }

                        // 3. No Factura
                        if (objResult[i].getValue(columns[8]) != null && objResult[i].getValue(columns[8]) != '- None -' && objResult[i].getValue(columns[8]) != '-') {
                            auxArray[3] = objResult[i].getValue(columns[8]);
                        } else if (objResult[i].getValue(columns[3]) != null && objResult[i].getValue(columns[3]) != '- None -' ) {
                            auxArray[3] = objResult[i].getValue(columns[3]);
                        } else {
                            auxArray[3] = '';
                        }

                        auxArray[4] = '';
                        auxArray[5] = '';

                        // 4. NET AMOUNT
                        if (objResult[i].getValue(columns[4]) != null && objResult[i].getValue(columns[4]) != '- None -') {
                            if (objResult[i].getValue(columns[2]) == "VendCred") {
                                netAmount = String(Number(objResult[i].getValue(columns[4])) * (-1));
                            } else {
                                netAmount = objResult[i].getValue(columns[4]);
                            }
                        } else {
                            netAmount = '0.00';
                        }

                        // 5. RETENCION
                        if (objResult[i].getValue(columns[5]) != null && objResult[i].getValue(columns[5]) != '- None -') {
                            if (objResult[i].getValue(columns[2]) == "VendCred") {
                                retAmount = String(Number(objResult[i].getValue(columns[5])) * (-1));
                            } else {
                                retAmount = objResult[i].getValue(columns[5]);
                            }
                        } else {
                            retAmount = '0.00';
                        }

                        // 6. BASE IMPONIBLE
                        if (objResult[i].getValue(columns[6]) != null && objResult[i].getValue(columns[6]) != '- None -') {
                            tasa = Number(objResult[i].getValue(columns[6])).toFixed(2) + "%";
                        } else {
                            tasa = '';
                        }


                        if (objResult[i].getValue(columns[7]) != null && objResult[i].getValue(columns[7]) != '- None -') {
                            vendorLine =  objResult[i].getValue(columns[7]);

                        } else {
                            vendorLine =  '';
                        }


                        // JSON
                        auxArrJson.push({
                            subtype: {
                                text: retType
                            },
                            lc_baseamount: netAmount,
                            lc_whtamount: retAmount,
                            whtrate: tasa,
                            description: concepto,
                            municipality: '',
                            vendor: vendorLine
                        });

                        auxArray[6] = auxArrJson;

                        // 7. MUICIPALIDAD
                        if (param_Json.id_origin_city == 1) {
                            auxArray[9] = objResult[i].getValue(columns[9]);
                        } else {
                            auxArray[9] = '';
                        }

                        //log.debug('auxArray+Main '+id , auxArray )
                    }

                } else {
                    DbolStop = true;
                }
            }
            return auxArray;
        }



        function typeRetention(type){

            switch (type) {
                case '1':
                    retType = 'ReteICA';
                    autoRetType = 'Auto ReteICA';
                    filtroRetencion = "formulatext: {custbody_lmry_co_reteica}";
                    filtroRetencionName = "formulatext: CASE WHEN {custbody_lmry_co_reteica.name} = 'ReteICA 0%' THEN 1 ELSE 0 END";
                    filtroRetencionAmount = "formulatext: CASE WHEN({custbody_lmry_co_reteica_amount}>0) THEN 1 ELSE 0 END";
                    columnaCodWht = "{custbody_lmry_co_reteica.name}";
                    columnaWhtAmount = "{custbody_lmry_co_reteica_amount}";
                    columnaTasa = valFeatureDesc? "{custbody_lmry_co_reteica.custrecord_lmry_wht_codedesc}" : "CONCAT({custbody_lmry_co_reteica.custrecord_lmry_wht_coderate}, '')";
                    columnaWhtVariable = "{custbody_lmry_co_reteica.custrecord_lmry_wht_variable_rate}";
                    break;
                case '2':
                    retType = 'ReteFTE';
                    autoRetType = 'Auto ReteFTE';
                    filtroRetencion = "formulatext: {custbody_lmry_co_retefte}";
                    filtroRetencionName = "formulatext: CASE WHEN {custbody_lmry_co_retefte.name} = 'ReteFte 0%' THEN 1 ELSE 0 END";
                    filtroRetencionAmount = "formulatext: CASE WHEN({custbody_lmry_co_retefte_amount}>0) THEN 1 ELSE 0 END";
                    columnaCodWht = "{custbody_lmry_co_retefte.name}";
                    columnaWhtAmount = "{custbody_lmry_co_retefte_amount}";
                    columnaTasa = valFeatureDesc? "{custbody_lmry_co_retefte.custrecord_lmry_wht_codedesc}" : "CONCAT({custbody_lmry_co_retefte.custrecord_lmry_wht_coderate}, '')";
                    columnaWhtVariable = "{custbody_lmry_co_retefte.custrecord_lmry_wht_variable_rate}";
                    break;
                case '3':
                    retType = 'ReteIVA';
                    autoRetType = 'Auto ReteIVA';
                    filtroRetencion = "formulatext: {custbody_lmry_co_reteiva}";
                    filtroRetencionName = "formulatext: CASE WHEN {custbody_lmry_co_reteiva.name} = 'ReteIVA 0%' THEN 1 ELSE 0 END";
                    filtroRetencionAmount = "formulatext: CASE WHEN({custbody_lmry_co_reteiva_amount}>0) THEN 1 ELSE 0 END";
                    columnaCodWht = "{custbody_lmry_co_reteiva.name}";
                    columnaWhtAmount = "{custbody_lmry_co_reteiva_amount}";
                    columnaTasa = valFeatureDesc? "{custbody_lmry_co_reteiva.custrecord_lmry_wht_codedesc}" : "CONCAT({custbody_lmry_co_reteiva.custrecord_lmry_wht_coderate}, '')";
                    columnaWhtVariable = "{custbody_lmry_co_reteiva.custrecord_lmry_wht_variable_rate}";
                    break;


            }
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

        function groupRetentions (arr){
            
            var jsonAgrup = {};
            var arrReturn = [];
            for(var i = 0; i < arr.length; i++){
               var key = '';
               if(arr[i].length == 4){
                   key = arr[i][3] + '|' + arr[i][2];
               }else{
                   key = arr[i][0] + '|' + arr[i][2];
               }
               //console.log(key)
           
               if(jsonAgrup[key]){
                   jsonAgrup[key].push(arr[i]);
               }else{
                   jsonAgrup[key] = [];
                   jsonAgrup[key].push(arr[i]);
               }
            }

            for (key in jsonAgrup){
                arrReturn.push(jsonAgrup[key]);

            }
            return arrReturn;
        }

        function replaceRetencion(arrOrigen,arrAjuste){
            var jsonAjuste = arrAjuste[6][0];
            var jsonOrigen = arrOrigen[6][0];
            jsonOrigen.lc_whtamount = Number((jsonOrigen.whtrate).replace('%', '').trim()) > Number((jsonAjuste.whtrate).replace('%', '').trim()) ? Number(jsonOrigen.lc_whtamount) - Number(jsonAjuste.lc_whtamount) : Number(jsonOrigen.lc_whtamount) + Number(jsonAjuste.lc_whtamount);
            jsonOrigen.whtrate = jsonAjuste.whtrate;
            jsonOrigen.description = jsonAjuste.description;
            return arrOrigen;
        }

        return {
            getInputData: getInputData,
            map: map,
            // reduce: reduce,
            summarize: summarize
        };

    });