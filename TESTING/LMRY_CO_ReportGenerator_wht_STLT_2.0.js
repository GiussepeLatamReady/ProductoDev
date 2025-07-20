/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Inventory Balance Library                  ||
||                                                              ||
||  File Name: LMRY_CO_ReportGenerator_wht_STLT_2.0.js          ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Aug 16 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(["N/ui/serverWidget", "N/search", "N/runtime", "N/record", "N/redirect", "N/task", "N/log", "N/config", 'N/format', require], runSuitelet);
var UI, SEARCH, RECORD, RUNTIME, REDIRECT, TASK, LOG, CONFIG, REQUIRE;
// Titulo del Suitelet

var LMRY_script = "LMRY Report Generator - Withholding Certificate CO STLT";
var namereport = "";
var language;

function runSuitelet(ui, search, runtime, record, redirect, task, log, config, format, require) {

    UI = ui;
    SEARCH = search;
    RUNTIME = runtime;
    RECORD = record;
    REDIRECT = redirect;
    TASK = task;
    LOG = log;
    CONFIG = config;
    //LIBRARY = library;
    //LIBFEATURE = libfeature;
    FORMAT = format;
    REQUIRE = require;
    LR_PermissionManager = null;
    LR_libfeature = null;
    var GLOBAL_LABELS = {};
    language = RUNTIME.getCurrentScript().getParameter({
        name: 'LANGUAGE'
    }).substring(0, 2);

    var returnObj = {};
    returnObj.onRequest = execute;
    return returnObj;
}

function getSecurityLibrary() {
    try {

        require(["/SuiteBundles/Bundle 35754/Latam_Library/LMRY_LibraryReport_LBRY_V2.js", "/SuiteBundles/Bundle 35754/Latam_Security/LMRY_SECURITY_LICENSES_LBRY_V2.0"], function (libfeature , library) {
            LR_PermissionManager = library;
            LR_libfeature = libfeature;
        });
        LOG.error('SecurityLibrary.Bundle', 'Bundle 35754');

    } catch (err) {

        try {
            require(["/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js", "/SuiteBundles/Bundle 37714/Latam_Security/LMRY_SECURITY_LICENSES_LBRY_V2.0"], function (libfeature, library) {
                LR_PermissionManager = library;
                LR_libfeature = libfeature;
            });

            LOG.error('SecurityLibrary.Bundle', 'Bundle 37714');
        } catch (err) {

            SEARCH.create({
                type: 'file',
                columns: ['internalid'],
                filters: [
                    ['name', 'is', 'LMRY_SECURITY_LICENSES_LBRY_V2.0.js']
                ]
            }).run().each(function (result) {
                require(['N/file'], function (file) {

                    var libraryPath = file.load(result.id).path;

                    require([libraryPath], function (library) {
                        LR_PermissionManager = library;
                    })

                });
                return false;
            })
            LOG.error('SecurityLibrary.Bundle', '- None -');
        }
    }

}

function execute(context) {

    var varMethod = context.request.method;
    try {
        getSecurityLibrary();
        //getlibfeature()

        var reportLicenseManager = LR_PermissionManager.open(LR_PermissionManager.Type.REPORT);
        var reponseLicense = reportLicenseManager.isCountryActived('CO');

        GLOBAL_LABELS = getGlobalLabels();

        if (!reponseLicense.status) {

            LR_PermissionManager.createFormError(context,  GLOBAL_LABELS['namereport'][language], reponseLicense.error);

        } else {
            if (varMethod == 'GET') {

                // Crea el folder
                search_folder();
                //Creacion de Folder
                var form = UI.createForm( GLOBAL_LABELS['namereport'][language]);

                var featuresubs = RUNTIME.isFeatureInEffect({
                    feature: "SUBSIDIARIES"
                });
                var featuremult = RUNTIME.isFeatureInEffect({
                    feature: "MULTIBOOK"
                });
                var FEATURE_CALENDAR = RUNTIME.isFeatureInEffect({
                    feature: 'MULTIPLECALENDARS'
                });

                /* ****** Grupo de Campos Criterios de Busqueda *******/
                form.addFieldGroup({
                    id: 'custpage_filran1',
                    label: GLOBAL_LABELS['tiposReporte'][language]
                });
                //Obtiene los datos de la lista de reportes SUNAT
                var fieldreports = form.addField({
                    id: 'custpage_lmry_reporte',
                    type: UI.FieldType.SELECT,
                    label: GLOBAL_LABELS['reporte'][language],
                    container: 'custpage_filran1'
                });

                var varFilter = new Array();
                varFilter[0] = SEARCH.createFilter({
                    name: 'isinactive',
                    operator: SEARCH.Operator.IS,
                    values: 'F'
                });
                var varRecord = SEARCH.create({
                    type: 'customrecord_lmry_co_features',
                    filters: varFilter,
                    columns: ['internalid', 'name', 'custrecord_lmry_co_id_type']
                });
                var varResult = varRecord.run();
                var varRecordRpt = varResult.getRange({
                    start: 0,
                    end: 1000
                });

                if (varRecordRpt != null && varRecordRpt.length > 0) {
                    // Llena una linea vacia
                    fieldreports.addSelectOption({
                        value: 0,
                        text: ' '
                    });
                    // Llenado de listbox
                    for (var i = 0; i < varRecordRpt.length; i++) {
                        var reportID = varRecordRpt[i].getValue('internalid');
                        var reportNM = varRecordRpt[i].getValue('name');
                        var reportType = varRecordRpt[i].getValue('custrecord_lmry_co_id_type');

                        if(reportType == 'C'){
                            fieldreports.addSelectOption({
                                value: reportID,
                                text: reportNM
                            });
                        }
                    }
                }
                fieldreports.isMandatory = true;

                /* ****** Grupo de Campos Criterios de Busqueda ****** */
                form.addFieldGroup({
                    id: 'custpage_filran2',
                    label: GLOBAL_LABELS['criteriosBusqueda'][language]
                });

                // Valida si es OneWorld
                if (featuresubs == true || featuresubs == 'T') //EN ALGUNAS INSTANCIAS DEVUELVE CADENA OTRAS DEVUELVE BOOLEAN
                {
                    var fieldsubs = form.addField({
                        id: 'custpage_subsidiary',
                        label: GLOBAL_LABELS['subsidiaria'][language],
                        type: UI.FieldType.SELECT,
                        container: 'custpage_filran2'
                    });

                    fieldsubs.isMandatory = true;

                    // Filtros
                    var Filter_Custo = new Array();
                    Filter_Custo[0] = SEARCH.createFilter({
                        name: 'isinactive',
                        operator: SEARCH.Operator.IS,
                        values: 'F'
                    });
                    Filter_Custo[1] = SEARCH.createFilter({
                        name: 'country',
                        operator: SEARCH.Operator.ANYOF,
                        values: 'CO'
                    });
                    var search_Subs = SEARCH.create({
                        type: SEARCH.Type.SUBSIDIARY,
                        filters: Filter_Custo,
                        columns: ['internalid', 'name']
                    });
                    var resul_sub = search_Subs.run();
                    var varRecordSub = resul_sub.getRange({
                        start: 0,
                        end: 1000
                    });

                    if (varRecordSub != null && varRecordSub.length > 0) {
                        // Llena una linea vacia
                        fieldsubs.addSelectOption({
                            value: 0,
                            text: ' '
                        });

                        // Llenado de listbox
                        for (var i = 0; i < varRecordSub.length; i++) {

                            var subID = varRecordSub[i].getValue('internalid');
                            var subNM = varRecordSub[i].getValue('name');
                            
                            fieldsubs.addSelectOption({
                                value: subID,
                                text: subNM
                            });
                        }
                    }
                    //fieldsubs.isMandatory = true;
                }

                /**Periodo Contable sin Periodos de Ajuste*/
                var periodo_mensual = form.addField({
                    id: 'custpage_custom_period',
                    label: GLOBAL_LABELS['periodo'][language],
                    type: UI.FieldType.SELECT,
                    container: 'custpage_filran2'
                });
                //periodo_mensual.isMandatory = true;

                var periodo_mensual_fin = form.addField({
                    id: 'custpage_custom_periodfin',
                    label: GLOBAL_LABELS['periodoFin'][language],
                    type: UI.FieldType.SELECT,
                    container: 'custpage_filran2'
                });

                //* CHECK DE AGRUPAMIENDO POR MESES DEL CERTIFICADO ACUMULADO */

                var checkMontAcum = form.addField({
                    id: 'custpage_grouping_by_months',
                    label: GLOBAL_LABELS['agrupadopormes'][language],
                    type: UI.FieldType.CHECKBOX,
                    container: 'custpage_filran2'
                });

                if (!(FEATURE_CALENDAR || FEATURE_CALENDAR == 'T')) {
                    log.debug('paso calendar');
                    var periodMensualSearch = SEARCH.create({
                        type: "accountingperiod",
                        filters: [
                            ["isadjust", "is", "F"],
                            "AND", ["isquarter", "is", "F"],
                            "AND", ["isinactive", "is", "F"],
                            "AND", ["isyear", "is", "F"],
                        ],
                        columns: [
                            SEARCH.createColumn({
                                name: "internalid",
                                label: "Internal ID"
                            }),
                            SEARCH.createColumn({
                                name: "periodname",
                                label: "Name"
                            }),
                            SEARCH.createColumn({
                                name: "startdate",
                                sort: SEARCH.Sort.ASC,
                                label: "Start Date"
                            })
                        ]
                    });

                    var resultado = periodMensualSearch.run().getRange(0, 1000);

                    periodo_mensual.addSelectOption({
                        value: '',
                        text: ''
                    });
                    periodo_mensual_fin.addSelectOption({
                        value: '',
                        text: ''
                    });

                    if (resultado != null) {
                        for (var i = 0; i < resultado.length; i++) {
                            periodo_mensual.addSelectOption({
                                value: resultado[i].getValue('internalid'),
                                text: resultado[i].getValue('periodname')
                            });

                            periodo_mensual_fin.addSelectOption({
                                value: resultado[i].getValue('internalid'),
                                text: resultado[i].getValue('periodname')
                            });

                        }
                    }

                }

                //* FILTRO DE PROVEDOR - CERTIFICADO DE HONRARIOS

                var provedorList = form.addField({
                    id: 'custpage_proovedor_list',
                    type: UI.FieldType.SELECT,
                    label: GLOBAL_LABELS['listvendor'][language],
                    container: 'custpage_filran2'
                });

                provedorList.addSelectOption({
                    value: ' ',
                    text: ' '
                });

                //******************************************
                //***  Origen de Municipalidad   ***//
                //* POR SUBSIDIARIA
                //* POR TRANSACCION | VENDOR
                var fieldCityOrigen = form.addField({
                    id: 'custpage_lmry_city_origin',
                    type: UI.FieldType.SELECT,
                    label:  GLOBAL_LABELS['custpage_lmry_city_origin'][language],
                    container: 'custpage_filran2'
                });

                var texOpt0 = language == 'en' ? 'SUBSIDIARY' : 'SUBSIDIARIA';
                var texOpt1 = language == 'en' ? "TRANSACTION | VENDOR" : "TRANSACCION | PROVEEDOR";

                fieldCityOrigen.addSelectOption({
                    value: '',
                    text: ''
                });

                fieldCityOrigen.addSelectOption({
                    value: 0,
                    text: texOpt0
                });
                fieldCityOrigen.addSelectOption({
                    value: 1,
                    text: texOpt1
                });

                //******************************************


                var varGrupoEspecial = form.addFieldGroup({
                    id: 'custpage_filran3',
                    label: GLOBAL_LABELS['criteriosEspeciales'][language]
                });

                if (featuremult == true || featuremult == 'T') {
                    // variable - tipo - etiqueta - List/Record - grupo
                    var varFieldMultiB = form.addField({
                        id: 'custpage_multibook',
                        label: GLOBAL_LABELS['multibookTranslator'][language],
                        type: UI.FieldType.SELECT,
                        container: 'custpage_filran3'
                    });

                    varFieldMultiB.isMandatory = true;

                    var Filter_Custo = new Array();
                    var search_MultiB = SEARCH.create({
                        type: SEARCH.Type.ACCOUNTING_BOOK,
                        columns: ['internalid', 'name']
                    });

                    var resul_multib = search_MultiB.run();
                    var varRecordMultiB = resul_multib.getRange({
                        start: 0,
                        end: 1000
                    });
                    if (varRecordMultiB != null && varRecordMultiB.length > 0) {

                        // Llena una linea vacia
                        varFieldMultiB.addSelectOption({
                            value: 0,
                            text: ' '
                        });
                        // Llenado de listbox
                        for (var i = 0; i < varRecordMultiB.length; i++) {
                            var subID = varRecordMultiB[i].getValue('internalid');
                            var subNM = varRecordMultiB[i].getValue('name');
                            varFieldMultiB.addSelectOption({
                                value: subID,
                                text: subNM
                            });
                        }
                    }
                }

                /* ************************************************************
                 * Realiza busqueda por todos los campos agregados en la tabla
                 * de filtros de reportes
                 * ***********************************************************/
                var transacdata = SEARCH.load({
                    id: 'customsearch_lmry_co_filter_report'
                });
                var auxfield = '';

                ColIdFilter = SEARCH.createColumn({
                    name: 'custrecord_lmry_co_filter_id'
                });
                ColTypeFilter = SEARCH.createColumn({
                    name: 'custrecord_lmry_co_filter_field_type'
                });
                ColLabelFilter = SEARCH.createColumn({
                    name: 'custrecord_lmry_co_filter_field_label'
                });
                ColListFilter = SEARCH.createColumn({
                    name: 'custrecord_lmry_co_filter_list_record'
                });
                ColTypeReport = SEARCH.createColumn({
                    name: 'formulatext',
                    formula: '{custrecord_lmry_co_filter_features.custrecord_lmry_co_id_type}'
                });
                transacdata.columns = [ColIdFilter, ColTypeFilter, ColLabelFilter, ColListFilter, ColTypeReport];

                var resul_transac = transacdata.run();
                var varRecordTransac = resul_transac.getRange({
                    start: 0,
                    end: 1000
                });

                if (varRecordTransac != null && varRecordTransac.length > 0) {

                    for (var i = 0; i < varRecordTransac.length; i++) {
                        var idField = varRecordTransac[i].getValue('custrecord_lmry_co_filter_id');
                        var tipoField = varRecordTransac[i].getValue('custrecord_lmry_co_filter_field_type');
                        var lblField = varRecordTransac[i].getValue('custrecord_lmry_co_filter_field_label');
                        var listaRec = varRecordTransac[i].getValue('custrecord_lmry_co_filter_list_record');
                        var reportType = varRecordTransac[i].getValue(varRecordTransac[i].columns[4]);

                        if (listaRec == '') {
                            listaRec = null;
                        }
                        /* ************************************************************
                         * Agregando los campos, definidos en un registro personalizado
                         * varIdField       = ID Field
                         * tipoField    = Type
                         * lblField     = label
                         * listaRec     = List/Record
                         * ************************************************************/
                        if (auxfield != idField && idField != '' && idField != null && idField != 'custpage_locagroup' && idField != 'custpage_multibook' && reportType == 'C') {
                            auxfield = idField;
                            if (idField == 'custpage_tipo_retencion' || idField == 'custpage_lmry_cr_fechaini' || idField == 'custpage_lmry_cr_fechafin' || idField == 'custpage_digits' || idField == 'custpage_op_balance' || idField == 'custpage_insert_head' || idField =='custpage_lmry_cr_anio' || idField == 'custpage_muniline'/*agregar mas id si es que se quiere traducir rpt filters*/) {
                                var addFieldAux = form.addField({
                                    id: idField,
                                    label: GLOBAL_LABELS[idField][language],
                                    type: tipoField,
                                    source: listaRec,
                                    container: 'custpage_filran2'
                                });
                            } else if (idField == 'custpage_entity_type') {
                                var addFieldAux = form.addField({
                                    id: idField,
                                    label: GLOBAL_LABELS[idField][language],
                                    type: tipoField,
                                    source: listaRec,
                                    container: 'custpage_filran2'
                                });
                            } else {
                                var addFieldAux = form.addField({
                                    id: idField,
                                    label: lblField,
                                    type: tipoField,
                                    source: listaRec,
                                    container: 'custpage_filran2'
                                });
                            }

                            if (idField == 'custpage_msg') {
                                addFieldAux.updateDisplaySize({
                                    height: 10,
                                    width: 40
                                });
                            }

                        }
                    }
                }
                
                varGrupoEspecial.setShowBorder = true;

                // Mensaje para el cliente
                var strhtml = "<html>";
                strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
                    "<tr>" +
                    "</tr>" +
                    "<tr>" +
                    "<td class='text'>" +
                    "<div style=\"color: gray; font-size: 8pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">Important: By using the NetSuite Transaction, you assume all responsibility for determining whether the data you generate and download is accurate or sufficient for your purposes. You also assume all responsibility for the security of any data that you download from NetSuite and subsequently store outside of the NetSuite system.</div>" +
                    "</td>" +
                    "</tr>" +
                    "</table>" +
                    "</html>";

                var varInlineHtml = form.addField({
                    id: 'custpage_btn',
                    type: UI.FieldType.INLINEHTML,
                    label: 'custpage_lmry_v1_message'
                }).updateLayoutType({
                    layoutType: UI.FieldLayoutType.OUTSIDEBELOW
                }).updateBreakType({
                    breakType: UI.FieldBreakType.STARTCOL
                }).defaultValue = strhtml;

                var tab = form.addTab({
                    id: 'custpage_maintab',
                    label: 'Tab'
                });


                //sublista
                var listaLog = form.addSublist({
                    id: 'custpage_sublista',
                    type: UI.SublistType.STATICLIST,
                    label: GLOBAL_LABELS['logGeneracion'][language]
                });
                listaLog.addField({
                    id: 'custpage_lmry_rg_trandate',
                    label: GLOBAL_LABELS['fechaCreacion'][language],
                    type: UI.FieldType.TEXT
                });
                listaLog.addField({
                    id: 'custpage_lmry_rg_transaction',
                    label: GLOBAL_LABELS['informe'][language],
                    type: UI.FieldType.TEXT
                });
                listaLog.addField({
                    id: 'custpage_lmry_rg_postingperiod',
                    label: GLOBAL_LABELS['periodoLog'][language],
                    type: UI.FieldType.TEXT
                });
                listaLog.addField({
                    id: 'custpage_lmry_rg_subsidiary',
                    label: GLOBAL_LABELS['subsidiariaLog'][language],
                    type: UI.FieldType.TEXT
                });

                /* ************************************************************
                 * 2018/04/18 Verifica si esta activo la funcionalidad
                 *  MULTI-BOOK ACCOUNTING - ID multibook
                 * ***********************************************************/
                if (featuremult == true || featuremult == 'T') {
                    listaLog.addField({
                        id: 'custpage_lmry_rg_multibook',
                        label: GLOBAL_LABELS['multibookTranslator'][language],
                        type: UI.FieldType.TEXT
                    });
                }
                listaLog.addField({
                    id: 'custpage_lmry_rg_employee',
                    label: GLOBAL_LABELS['creadoPor'][language],
                    type: UI.FieldType.TEXT
                });
                listaLog.addField({
                    id: 'custpage_lmry_rg_nombre',
                    label: GLOBAL_LABELS['nombreArchivo'][language],
                    type: UI.FieldType.TEXT
                });
                listaLog.addField({
                    id: 'custpage_lmry_rg_archivo',
                    label: GLOBAL_LABELS['descargar'][language],
                    type: UI.FieldType.TEXT
                });
                listaLog.addRefreshButton();

                var varLogData = SEARCH.load({
                    id: 'customsearch_lmry_co_rpt_generator_log'
                });

                var typeFilter = SEARCH.createFilter({
                    name: 'custrecord_lmry_co_rpt_type',
                    operator: SEARCH.Operator.IS,
                    values: ['C']
                });
                varLogData.filters.push(typeFilter);

                var resul_LogData = varLogData.run();
                var varRecordLog = resul_LogData.getRange({
                    start: 0,
                    end: 1000
                });

                LOG.debug({
                    title: 'longitud: ',
                    details: varRecordLog.length
                });

                for (var i = 0; varRecordLog != null && i < varRecordLog.length; i++) {
                    //  var row = i + 1;
                    searchresult = varRecordLog[i];
                    var linktext = '';
                    var url = searchresult.getValue('custrecord_lmry_co_rg_url_file');

                    if (url != null && url != '') {
                        linktext = '<a target="_blank" href="' + searchresult.getValue('custrecord_lmry_co_rg_url_file') + '"download>Descarga</a>';
                    }

                    var creat = searchresult.getValue('created');

                    if (creat != null && creat != '') {
                        listaLog.setSublistValue({
                            id: 'custpage_lmry_rg_trandate',
                            line: i,
                            value: creat
                        });
                    }

                    var transact = searchresult.getValue('custrecord_lmry_co_rg_transaction');
                    if (transact != null && transact != '') {
                        listaLog.setSublistValue({
                            id: 'custpage_lmry_rg_transaction',
                            line: i,
                            value: transact
                        });
                    }

                    var periodname = searchresult.getValue('custrecord_lmry_co_rg_postingperiod');
                    if (periodname != null && periodname != '') {
                        listaLog.setSublistValue({
                            id: 'custpage_lmry_rg_postingperiod',
                            line: i,
                            value: periodname
                        });
                    }

                    var subsi = searchresult.getValue('custrecord_lmry_co_rg_subsidiary');
                    if (subsi != null && subsi != '') {
                        listaLog.setSublistValue({
                            id: 'custpage_lmry_rg_subsidiary',
                            line: i,
                            value: subsi
                        });
                    }

                    if (featuremult == true || featuremult == 'T') {

                        var mult = searchresult.getValue('custrecord_lmry_co_rg_multibook');
                        if (mult != null && mult != '') {
                            listaLog.setSublistValue({
                                id: 'custpage_lmry_rg_multibook',
                                line: i,
                                value: mult
                            });
                        }
                    }

                    var empleado = searchresult.getValue('custrecord_lmry_co_rg_employee');
                    if (empleado != null && empleado != '') {
                        listaLog.setSublistValue({
                            id: 'custpage_lmry_rg_employee',
                            line: i,
                            value: empleado
                        });
                    }

                    var nomb = searchresult.getValue('custrecord_lmry_co_rg_name');
                    if (nomb != null && nomb != '') {
                        listaLog.setSublistValue({
                            id: 'custpage_lmry_rg_nombre',
                            line: i,
                            value: nomb
                        });
                    }

                    if (linktext != '') {
                        listaLog.setSublistValue({
                            id: 'custpage_lmry_rg_archivo',
                            line: i,
                            value: linktext
                        });
                    }
                }

                // Botones del formulario
                form.addSubmitButton(GLOBAL_LABELS['btnGenerar'][language]);
                form.addResetButton(GLOBAL_LABELS['btnCancelar'][language]);
                //Llama al cliente
                form.clientScriptModulePath = './LMRY_CO_ReportGenerator_wht_CLNT_2.0.js';
                context.response.writePage(form);
            }

            if (varMethod == 'POST') {
                //Valida si es OneWorld
                var idrpts = context.request.parameters.custpage_lmry_reporte;
                var p = context.request.parameters;

                var features = {
                    SUBSIDIARIES: RUNTIME.isFeatureInEffect({ feature: "SUBSIDIARIES" }),
                    MULTIBOOK: RUNTIME.isFeatureInEffect({ feature: "MULTIBOOK" })
                };

                var reportInfo = SEARCH.lookupFields({
                    type: 'customrecord_lmry_co_features',
                    id: idrpts,
                    columns: ['custrecord_lmry_co_id_schedule', 'custrecord_lmry_co_id_deploy', 'name']
                });

                var periodName = '';
                if (idrpts == 56) {
                    var periodData = SEARCH.lookupFields({
                        type: 'accountingperiod',
                        id: p.custpage_lmry_cr_anio,
                        columns: ['periodname']
                    });
                    periodName = periodData.periodname.replace(/\D/g, '');
                }

                if (idrpts == 59) {
                    var fechaIni = FORMAT.parse({ value: p.custpage_lmry_cr_fechaini, type: FORMAT.Type.DATE });
                    var m = fechaIni.getMonth() + 1;
                    if (m < 10) m = '0' + m;
                    periodName = TraePeriodo(m) + ' ' + fechaIni.getFullYear();
                }

                var subsidiaryName = features.SUBSIDIARIES
                    ? SEARCH.lookupFields({
                        type: 'subsidiary',
                        id: p.custpage_subsidiary,
                        columns: ['legalname']
                    }).legalname
                    : CONFIG.load({ type: CONFIG.Type.COMPANY_INFORMATION }).getValue('legalname');

                var multiBookName = features.MULTIBOOK
                    ? SEARCH.lookupFields({
                        type: 'accountingbook',
                        id: p.custpage_multibook,
                        columns: ['name']
                    }).name
                    : '';

                var empData = SEARCH.lookupFields({
                    type: 'employee',
                    id: RUNTIME.getCurrentUser().id,
                    columns: ['firstname', 'lastname']
                });
                var employeeName = empData.firstname + ' ' + empData.lastname;

                var logRecord = RECORD.create({ type: 'customrecord_lmry_co_rpt_generator_log' });
                logRecord.setValue('custrecord_lmry_co_rg_name', GLOBAL_LABELS['pending'][language]);
                logRecord.setValue('custrecord_lmry_co_rg_transaction', reportInfo.name);
                logRecord.setValue('custrecord_lmry_co_rg_postingperiod', periodName);
                logRecord.setValue('custrecord_lmry_co_rpt_type', 'C');
                logRecord.setValue('custrecord_lmry_co_rg_subsidiary', subsidiaryName);
                logRecord.setValue('custrecord_lmry_co_rg_multibook', multiBookName);
                logRecord.setValue('custrecord_lmry_co_rg_employee', employeeName);
                logRecord.setValue('custrecord_lmry_co_rg_url_file', '');

                var rec_id = logRecord.save();

                var params = {};
                function addParam(k, v, cond) {
                    if ((typeof cond === 'undefined' || cond) && v) params[k] = v;
                }

                if (idrpts == 56) {
                    addParam('custscript_lmry_co_subsi_withbk_ret_acum', p.custpage_subsidiary, features.SUBSIDIARIES);
                    addParam('custscript_lmry_co_multibook_wtbk_ret_ac', p.custpage_multibook, features.MULTIBOOK);
                    addParam('custscript_lmry_co_par_anio_wtbk_ret_ac', p.custpage_lmry_cr_anio);
                    addParam('custscript_lmry_co_vendor_withbk_ret_ac', p.custpage_proovedor_list);
                    addParam('custscript_lmry_co_type_withbk_ret_acum', p.custpage_tipo_retencion);
                    addParam('custscript_lmry_co_idrpt_wtbk_ret_acumul', rec_id);
                    addParam('custscript_lmry_co_group_month', p.custpage_grouping_by_months);
                    addParam('custscript_lmry_co_city_origin', p.custpage_lmry_city_origin);
                }

                if (idrpts == 59) {
                    addParam('custscript_lmry_co_subsi_withbook_v2', p.custpage_subsidiary, features.SUBSIDIARIES);
                    addParam('custscript_lmry_co_multibook_withbook_v2', p.custpage_multibook, features.MULTIBOOK);
                    addParam('custscript_lmry_co_periodini_withbook_v2', p.custpage_lmry_cr_fechaini);
                    addParam('custscript_lmry_co_periodfin_withbook_v2', p.custpage_lmry_cr_fechafin);
                    addParam('custscript_lmry_co_vendor_withbook_v2', p.custpage_proovedor_list);
                    addParam('custscript_lmry_co_type_withbook_v2', p.custpage_tipo_retencion);
                    addParam('custscript_lmry_co_idrpt_withbook_v2', rec_id);
                    addParam('custscript_lmry_co_city_origin_v2', p.custpage_lmry_city_origin);
                }

                try {
                    var task = TASK.create({
                        taskType: (idrpts == 59) ? TASK.TaskType.MAP_REDUCE : TASK.TaskType.SCHEDULED_SCRIPT,
                        scriptId: reportInfo.custrecord_lmry_co_id_schedule,
                        deploymentId: reportInfo.custrecord_lmry_co_id_deploy,
                        params: params
                    });
                    task.submit();

                    REDIRECT.toSuitelet({
                        scriptId: 'customscript_lmry_co_rpt_gen_wht_cert',
                        deploymentId: 'customdeploy_lmry_co_rpt_gen_wht_cert'
                    });
                } catch (e) {
                    LOG.error({ title: 'Error ejecutando tarea', details: e });
                }


            }
        }

    } catch (err) {
        var varMsgError = 'Importante: El acceso no esta permitido.';
        LOG.error({
            title: 'Se genero un error en suitelet 2 :' + err.lineNumber,
            details: err
        });
        //  LIBRARY.CreacionFormError(namereport, LMRY_script, varMsgError, err);
        //sendemail(err, LMRY_script);
    }
    return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Nota: Valida si existe el folder donde se guardaran los archivos
 * --------------------------------------------------------------------------------------------------- */

function getGlobalLabels() {
    var labels = {
        "periodo": {
            "es": 'Periodo Contable',
            "pt": 'Período Contábil',
            "en": 'Accounting Period'
        },
        "periodoFin": {
            "es": 'Periodo Contable Final',
            "pt": 'Período Contábil Final',
            "en": 'Final Accounting Period'
        },
        "ajuste": {
            "es": 'Ajuste',
            "pt": 'Ajustamento',
            "en": 'Adjustment'
        },
        "tipoEntidad": {
            "es": 'Tipo de Entidad',
            "pt": 'Tipo de Entidade',
            "en": 'Entity Type'
        },
        "criteriosBusqueda": {
            "es": "Criterios de Busqueda",
            "pt": "Critérios de busca",
            "en": "Search Criteria"
        },
        "tiposReporte": {
            "es": "Tipos de Reporte",
            "pt": "Tipos de relatórios",
            "en": "Types of Reports"
        },
        "reporte": {
            "es": "Reporte",
            "pt": "Relatório",
            "en": "Report"
        },
        "subsidiaria": {
            "es": "SUBSIDIARIA",
            "pt": "SUBSIDIÁRIA",
            "en": "SUBSIDIARY"
        },
        "logGeneracion": {
            "es": "Log de generacion",
            "pt": "Log de geração",
            "en": "Generation log"
        },
        "fechaCreacion": {
            "es": "Fecha de creacion",
            "pt": "Data de criação",
            "en": "Date of creation"
        },
        "criteriosEspeciales": {
            "es": "Criterios Especiales",
            "pt": "Critérios especiais",
            "en": "Special Criteria"
        },
        "informe": {
            "es": "Informe",
            "pt": "Informe",
            "en": "Report"
        },
        "periodoLog": {
            "es": "Periodo",
            "pt": "Período",
            "en": "Period"
        },
        "subsidiariaLog": {
            "es": "Subsidiaria",
            "pt": "Subsidiária",
            "en": "Subsidiary"
        },
        "creadoPor": {
            "es": "Creado por",
            "pt": "Criado por",
            "en": "Created by"
        },
        "nombreArchivo": {
            "es": "Nombre archivo",
            "pt": "Nome do ficheiro",
            "en": "File name"
        },
        "descargar": {
            "es": "Descargar",
            "pt": "Descarregar",
            "en": "Download"
        },
        "btnGenerar": {
            "es": "Generar",
            "pt": "Gerar",
            "en": "Generate"
        },
        "btnCancelar": {
            "es": "Cancelar",
            "pt": "Cancelar",
            "en": "Cancel"
        },
        "btnCancelar": {
            "es": "Cancelar",
            "pt": "Cancelar",
            "en": "Cancel"
        },
        "custpage_tipo_retencion": {
            "es": "Tipo Retencion",
            "pt": "Tipo de Retenção",
            "en": "Type of retention"
        },
        "custpage_lmry_cr_fechaini": {
            "es": "Fecha desde",
            "pt": "Data desde",
            "en": "Date from"
        },
        "custpage_lmry_cr_anio":{
            "es": "Año",
            "pt": "Ano",
            "en": "Year"
        },
        "custpage_muniline":{
            "es": "Municipalidad en certificados RETEICA",
            "pt": "Município em certificados RETEICA",
            "en": "Municipality in RETEICA certificates"
        },
        "custpage_lmry_cr_fechafin": {
            "es": "Fecha Hasta",
            "pt": "Data até",
            "en": "Date Until"
        },
        "custpage_digits": {
            "es": 'HABILITAR PUC 8 DIGITOS',
            "pt": 'ATIVAR PUC 8 DÍGITOS',
            "en": 'ENABLE PUC 8 DIGITS'
        },
        "filterHelp": {
            "es": 'Generar reporte con PUC de 8 dígitos',
            "pt": 'Gerar relatório com PUC de 8 dígitos',
            "en": 'Generate report with 8-digit PUC'
        },
        "custpage_op_balance": {
            "es": 'Excluir Saldos Iniciales en Cuenta de Resultados',
            "pt": 'Excluir Saldos Iniciales en Cuenta de Resultados',
            "en": 'Exclude Initial Balances in Income Statement'
        },
        "agrupadopormes": {
            "es": 'Agrupado por mes',
            "pt": 'Agrupacao por meses',
            "en": 'Grouping by months'
        },
        'pending': {
            'es': 'Pendiente' + '\n',
            'pt': "Pendente" + '\n',
            'en': "Pending" + '\n'
        },
        'periodoanual': {
            'es': 'Periodo Anual' + '\n',
            'pt': "Periodo Anual" + '\n',
            'en': "Annual Period" + '\n'
        },
        'custpage_insert_head': {
            'es': 'Incluir Titulo' + '\n',
            'pt': "Incluir Titulo" + '\n',
            'en': "Include Title" + '\n'
        },
        'listvendor': {
            "es": "Proveedor",
            "pt": "Fornecedor",
            "en": "Vendor"
        },
        'multibookTranslator': {
            "es": "LIBRO CONTABLE",
            "pt": "LIVRO DE CONTABILIDADE",
            "en": "MULTIBOOK"
        },
        'custpage_entity_type': {
            "es": 'Tipo de Entidad',
            "pt": 'Tipo de Entidade',
            "en": 'Entity Type'
        },
        'custpage_lmry_city_origin': {
            'es': 'Origen de la Municipalidad',
            'pt': 'Origem do municipio',
            'en': 'Origin of the Municipality'
        },
        'namereport' : {
            'es': 'LatamReady - CO Generador de Reportes Certificados',
            'pt': 'LatamReady - CO Gerador de Relatório Certificados',
            'en': 'LatamReady - CO Certificates Report Generator'
        }
    }

    return labels;
}

function busquedaVersion(idrpts, context) {


    var DbolStop = false;
    var arrAllVersions = new Array();
    var cont = 0;

    var savedSearch = SEARCH.create({
        type: 'customrecord_lmry_co_rpt_feature_version',
        columns: [
            SEARCH.createColumn({
                name: 'custrecord_lmry_co_rpt_id_schedule'
            }),
            SEARCH.createColumn({
                name: 'custrecord_lmry_co_rpt_id_deploy'
            }),
            SEARCH.createColumn({
                name: 'custrecord_lmry_co_rpt_id_report'
            }),
            SEARCH.createColumn({
                name: 'custrecord_lmry_co_rpt_version'
            }),
            SEARCH.createColumn({
                name: 'custrecord_lmry_co_year_from'
            }),
            SEARCH.createColumn({
                name: 'custrecord_lmry_co_year_to'
            }),
            SEARCH.createColumn({
                name: 'internalid'
            })
        ]
    });

    var searchResult = savedSearch.run();

    while (!DbolStop) {

        var objResult = searchResult.getRange(0, 1000);

        if (objResult != null) {

            var intLength = objResult.length;

            if (intLength == 0) {
                DbolStop = true;
            }

            for (var i = 0; i < intLength; i++) {
                var columnas = objResult[i].columns;
                var arrAuxiliar = new Array();

                //0. id SCHDL
                if (objResult[i].getValue(columnas[0]) != null) {
                    arrAuxiliar[0] = objResult[i].getValue(columnas[0]);
                } else {
                    arrAuxiliar[0] = '';
                } //1. id DEPLOY
                if (objResult[i].getValue(columnas[1]) != null) {
                    arrAuxiliar[1] = objResult[i].getValue(columnas[1]);
                } else {
                    arrAuxiliar[1] = '';
                } //2. id RPT
                if (objResult[i].getValue(columnas[2]) != null) {
                    arrAuxiliar[2] = objResult[i].getValue(columnas[2]);
                } else {
                    arrAuxiliar[2] = '';
                } //3. Version del Reporte
                if (objResult[i].getValue(columnas[3]) != null) {
                    arrAuxiliar[3] = objResult[i].getValue(columnas[3]);
                } else {
                    arrAuxiliar[3] = '';
                } //4. PERIODO DESDE
                if (objResult[i].getValue(columnas[4]) != null) {
                    arrAuxiliar[4] = objResult[i].getValue(columnas[4]);
                } else {
                    arrAuxiliar[4] = '';
                } //5. PERIODO HASTA
                if (objResult[i].getValue(columnas[5]) != null) {
                    arrAuxiliar[5] = objResult[i].getValue(columnas[5]);
                } else {
                    arrAuxiliar[5] = '';
                }
                if (objResult[i].getValue(columnas[6]) != null) {
                    arrAuxiliar[6] = objResult[i].getValue(columnas[6]);
                } else {
                    arrAuxiliar[6] = '';
                }

                arrAllVersions[cont] = arrAuxiliar;
                cont++;
            }

            if (intLength < 1000) {
                DbolStop = true;
            }


        }
    }

    for (var i = 0; i < arrAllVersions.length; i++) {
        if (arrAllVersions[i][2] == idrpts) {

            var anio = context.request.parameters.custpage_txtanio;
            var Date1 = FORMAT.parse({
                value: arrAllVersions[i][4],
                type: FORMAT.Type.DATE
            });
            var Date2 = FORMAT.parse({
                value: arrAllVersions[i][5],
                type: FORMAT.Type.DATE
            });
            var year_from = Date1.getFullYear();
            var year_to = Date2.getFullYear();

            if ((Number(anio) >= Number(year_from) || (Number(year_to) == '' || Number(year_to) == null)) && ((Number(year_from) == '' || Number(year_from) == null) || Number(anio) <= Number(year_to))) {
                var nuevoidSCHL = arrAllVersions[i][0];
                var nuevoidDEPLOY = arrAllVersions[i][1];
                var nuevointernalId = arrAllVersions[i][6];
            }

        }

    }

    return [nuevoidSCHL, nuevoidDEPLOY, nuevointernalId];


}

function search_folder() {
    try {
        // Ruta de la carpeta contenedora

        var varScriptObj = RUNTIME.getCurrentScript();
        var FolderId = varScriptObj.getParameter({
            name: 'custscript_lmry_file_cabinet_rg_co'
        });



        if (FolderId == '' || FolderId == null) {

            // Valida si existe "SuiteLatamReady" en File Cabinet
            var varIdFolderPrimary = '';

            var ResultSet = SEARCH.create({
                type: 'folder',
                columns: ['internalid'],
                filters: ['name', 'is', 'SuiteLatamReady']
            });

            objResult = ResultSet.run().getRange(0, 50);

            if (objResult == '' || objResult == null) {
                var varRecordFolder = RECORD.create({
                    type: 'folder'
                });
                varRecordFolder.setValue('name', 'SuiteLatamReady');
                varIdFolderPrimary = varRecordFolder.save();
            } else {
                varIdFolderPrimary = objResult[0].getValue('internalid');
            }

            // Valida si existe "LMRY Report Generator" en File Cabinet
            var varFolderId = '';
            var ResultSet = SEARCH.create({
                type: 'folder',
                columns: ['internalid'],
                filters: [
                    ['name', 'is', 'Latam Report Generator CO v2.0']
                ]
            });
            objResult = ResultSet.run().getRange(0, 50);

            if (objResult == '' || objResult == null) {
                var varRecordFolder = RECORD.create({
                    type: 'folder'
                });
                varRecordFolder.setValue('name', 'Latam Report Generator CO v2.0');
                varRecordFolder.setValue('parent', varIdFolderPrimary);
                varFolderId = varRecordFolder.save();
            } else {
                varFolderId = objResult[0].getValue('internalid');
            }


            // Load the NetSuite Company Preferences page
            var varCompanyReference = CONFIG.load({
                type: CONFIG.Type.COMPANY_PREFERENCES
            });

            // set field values
            varCompanyReference.setValue({
                fieldId: 'custscript_lmry_file_cabinet_rg_co',
                value: varFolderId
            });
            // save changes to the Company Preferences page
            varCompanyReference.save({ ignoreMandatoryFields: true });
        }
    } catch (err) {

        LOG.error({
            title: 'Se genero un error en suitelet',
            details: err
        });
        // Mail de configuracion del folder
        //LIBRARY.sendMail(LMRY_script, ' [ onRequest ] ' + err);
        LR_PermissionManager.sendErrorEmail(err, LMRY_script, language);
    }
    return true;
}

function TraePeriodo(periodo) {

    if (periodo.length == 1) {
        periodo = '0' + periodo;
    }

    var mes = '';
    switch (periodo) {
        case '01':
            mes = 'Jan';
            break;
        case '02':
            mes = 'Feb';
            break;
        case '03':
            mes = 'Mar';
            break;
        case '04':
            mes = 'Apr';
            break;
        case '05':
            mes = 'May';
            break;
        case '06':
            mes = 'Jun';
            break;
        case '07':
            mes = 'Jul';
            break;
        case '08':
            mes = 'Aug';
            break;
        case '09':
            mes = 'Sep';
            break;
        case '10':
            mes = 'Oct';
            break;
        case '11':
            mes = 'Nov';
            break;
        case '12':
            mes = 'Dec';
            break;

    }
    //nlapiLogExecution('DEBUG', 'auxmess2-> ',auxmess);
    return mes;
}