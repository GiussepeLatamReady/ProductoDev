/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_CO_ReportGenerator_wht_CLNT_2.0.js          ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Apr 02 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/runtime', 'N/currentRecord', 'N/search', "N/log", "N/url", 'N/https', 'N/format', 
    "/SuiteBundles/Bundle 37714/Latam_Library/LMRY_LibraryReport_LBRY_V2.js",
    "./LMRY_CO_Certificate_Massive_LIB.js"],

    function (
        runtime, currentRecord, search, log, url, https, format, 
        libFeature,
        Lib_certificate_massive
    ) {

        var LMRY_script = "LatamReady - CO Report Generator CLNT";
        var objContext = runtime.getCurrentScript();
        var language = runtime.getCurrentScript().getParameter({
            name: 'LANGUAGE'
        }).substring(0, 2);
        var hasJobsFeature = runtime.isFeatureInEffect({
            feature: 'JOBS'
        });
        var hasAdvancedJobsFeature = runtime.isFeatureInEffect({
            feature: 'ADVANCEDJOBS'
        });
        var featAccountingSpecial = null;

        var arrProcessedYears = new Array();
        var calendarSubsi = null;
        var calendarSubsiName = '';

        var varFiscalCalendar = null;

        function pageInit(scriptContext) {

            var varRecordRpt = scriptContext.currentRecord.getValue({
                fieldId: 'custpage_lmry_reporte'
            });

            if (varRecordRpt == 0 || varRecordRpt == '') {
                ocultaCampos(scriptContext);
            }
            //Desabilita los campos txtanio - entity
            var field = scriptContext.currentRecord.getField({
                fieldId: 'custpage_txtanio'
            });

            if (field != null) {
                field.isDisabled = true;
            }

            var field = scriptContext.currentRecord.getField({
                fieldId: 'custpage_proovedor_list'
            });

            if (field != null) {
                field.isDisabled = true;
            }

            //oculto campo
            var field = scriptContext.currentRecord.getField({
                fieldId: 'custpage_msg'
            });

            if (field != null) {
                field.isDisabled = true;
            }

            arrProcessedYears = ObtenerAñosProcesados();

            Lib_certificate_massive.createButtonVendor();
            if (scriptContext.currentRecord) Lib_certificate_massive.setCurrentRecord(scriptContext.currentRecord);

        }

        function ObtenerAñosProcesados() {
            var intDMinReg = 0;
            var intDMaxReg = 1000;
            var DbolStop = false;

            var ArrReturn = new Array();
            var cont = 0;

            var busqueda = search.create({
                type: 'customrecord_lmry_co_terceros_procesados',
                filters: ['isinactive', 'is', 'F'],
                columns: ['custrecord_lmry_co_year_procesado', 'custrecord_lmry_co_subsi_procesado', 'lastmodified']
            });

            var savedsearch = busqueda.run();

            while (!DbolStop) {
                var objResult = savedsearch.getRange(intDMinReg, intDMaxReg);

                if (objResult != null) {

                    if (objResult.length != 1000) {
                        DbolStop = true;
                    }

                    for (var i = 0; i < objResult.length; i++) {
                        var columns = objResult[i].columns;

                        var arrAuxiliar = new Array();

                        // 0. Year
                        arrAuxiliar[0] = objResult[i].getValue(columns[0]);

                        // 1. Subsidiary
                        arrAuxiliar[1] = objResult[i].getValue(columns[1]);

                        // 2. Last Modified
                        arrAuxiliar[2] = objResult[i].getValue(columns[2]);

                        ArrReturn[cont] = arrAuxiliar;
                        cont++;
                    }

                    if (!DbolStop) {
                        intDMinReg = intDMaxReg;
                        intDMaxReg += 1000;
                    }

                } else {
                    DbolStop = true;
                }
            }

            ArrReturn.sort(sortFunction);

            function sortFunction(a, b) {
                if (a[0] === b[0]) {
                    return 0;
                } else {
                    return (a[0] < b[0]) ? -1 : 1;
                }
            }

            return ArrReturn;
        }

        function saveRecord(scriptContext) {
            try {
                varFiscalCalendar = runtime.isFeatureInEffect({
                    feature: 'MULTIPLECALENDARS'
                });
                // Valida si tiene la licencia activa

                /* ************************************************************
                 * Verifica si esta activo la funcionalidad
                 *  SUBSIDIARY - ID Subsidiary
                 * ***********************************************************/
                var varFlagSubsi = runtime.isFeatureInEffect({
                    feature: "SUBSIDIARIES"
                });

                var reporteid = scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_lmry_reporte'
                });

                var GLOBAL_LABELS = getGlobalLabels();

                //var reporteid = context.request.parameters.custpage_lmry_reporte;
                if (reporteid == 0 || reporteid == null) {
                    alert(GLOBAL_LABELS['msjeCampoVacio'][language]);
                    return false;
                }

                if (varFlagSubsi == true || varFlagSubsi == 'T') {
                    var paramSubsi = scriptContext.currentRecord.getValue({
                        fieldId: 'custpage_subsidiary'
                    });
                    if (paramSubsi == 0 || paramSubsi == null) {
                        alert(GLOBAL_LABELS['msjeSubsiVacia'][language]);
                        return false;
                    }
                    obtenerDatosSubsidiaria(paramSubsi);
                }

                var filter_deploy = '';
              
                var id_report_feat = search.lookupFields({
                    type: 'customrecord_lmry_co_features',
                    id: reporteid,
                    columns: ['custrecord_lmry_co_id_schedule', 'custrecord_lmry_co_id_deploy']
                });
                filter_deploy = id_report_feat.custrecord_lmry_co_id_deploy;
                //filter_deploy = id_report_feat.custrecord_lmry_co_id_deploy;

                if (!validarStatus(filter_deploy)) {
                    alert(GLOBAL_LABELS['msjeReporteProcesando'][language]);
                    return false;
                }

                if (reporteid == 56) {
                    var Anio = scriptContext.currentRecord.getText({
                        fieldId: 'custpage_lmry_cr_anio'
                    });

                    if (!Anio || Anio == '') {

                        if (language == 'es') {
                            alert('Debe seleccionar el periodo anual.');
                        } else if (language == 'pt') {
                            alert('Voce deve selecionar o periodo anual.');
                        } else {
                            alert('You must select the annual period.');
                        }

                        return false;
                    }
                }

                /* ************************************************************
                 * Verifica si esta activo la funcionalidad
                 *  MULTI-BOOK ACCOUNTING - ID multibook
                 * ***********************************************************/

                //Features
                feamultibook = runtime.isFeatureInEffect({
                    feature: 'multibook'
                });

                if (feamultibook == true || feamultibook == 'T') {
                    var paramMulti = scriptContext.currentRecord.getValue({
                        fieldId: 'custpage_multibook'
                    });

                    if (paramMulti == 0 || paramMulti == null) {
                        if (language == 'es') {
                            alert('Debe seleccionar el campo Multi Book.');
                        } else if (language == 'pt') {
                            alert('Voce deve selecionar o campo Multi Book.');
                        } else {
                            alert('You must select the Multi Book field.');
                        }
                        return false;
                    }
                }

                //======================

                var fechainicio = scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_lmry_cr_fechaini'
                });

                var fechafin = scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_lmry_cr_fechafin'
                });

                if ((fechainicio == '' || fechainicio == null) && (fechafin == '' || fechafin == null)) {
                    if ( reporteid == 59) {
                        alert('Debe llenar los campos <fecha desde> y <fecha hasta>');
                        return false;
                    }
                } else if ((fechainicio == '' || fechainicio == null) && !(fechafin == '' && fechafin == null)) {
                    alert('Debe llenar el campo <fecha desde>');
                    return false;

                } else if (!(fechainicio == '' && fechainicio == null) && (fechafin == '' || fechafin == null)) {
                    alert('Debe llenar el campo <fecha hasta>');
                    return false;
                }


                if (reporteid == 59) {
                    //var fecha_fin = nlapiStringToDate(nlapiGetFieldValue('custpage_lmry_ar_fecha_fin'));
                    var fin = scriptContext.currentRecord.getValue({
                        fieldId: 'custpage_lmry_cr_fechafin'
                    });
                    var inicio = scriptContext.currentRecord.getValue({
                        fieldId: 'custpage_lmry_cr_fechaini'
                    });


                    if (fin != null && fin != '') {

                        var fecha_fin = format.parse({
                            value: fin,
                            type: format.Type.DATE
                        });
                    }

                    if (inicio != null && inicio != '') {
                        var fecha_ini = format.parse({
                            value: inicio,
                            type: format.Type.DATE
                        });
                    }
                    // var fecha_ini = nlapiStringToDate(nlapiGetFieldValue('custpage_lmry_ar_fecha_ini'));


                    if (fecha_ini != '' && fecha_fin != '' && fecha_ini != null && fecha_fin != null) {

                        if (fecha_ini > fecha_fin) {
                            alert('El rango de fechas ingresadas no está permitido.');
                            return false;
                        }
                    }
                }
              
                var URL =
                    url.resolveScript({
                        scriptId: 'customscript_lmry_get_country_stlt',
                        deploymentId: 'customdeploy_lmry_get_country_stlt',
                        returnExternalUrl: false
                    });

                URL += '&sub=';
                URL += scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_subsidiary'
                });

                var get = https.get({
                    url: URL
                });

                var bod = get.body;

                bod = bod.split(',');

                //Obtener fecha parametrizada segun pais
                columnFrom = _GetResult('Country Cod', bod[0]);


                var strFecha = '';
                var strAnio = '';
                var savedsearch = search.load({
                    id: 'customsearch_lmry_reportdate'
                });

                var countryFilter = search.createFilter({
                    name: 'custrecord_lmry_record_country',
                    operator: search.Operator.ANYOF,
                    values: [columnFrom]
                });
                savedsearch.filters.push(countryFilter);

                var searchResult = savedsearch.run();
                var objResult = searchResult.getRange(0, 1000);

                if (objResult != null) {
                    var intLength = objResult.length;

                    if (intLength != 1000) {
                        DbolStop = true;
                    }

                    for (var i = 0; i < intLength; i++) {
                        columns = objResult[i].columns;
                        if (objResult[i].getValue(columns[2]) != null)
                            strFecha = objResult[i].getValue(columns[2]);
                        else
                            strFecha = '';
                        if (objResult[i].getValue(columns[3]) != null)
                            strAnio = objResult[i].getValue(columns[3]);
                        else
                            strAnio = '';
                    }
                }

                //Solo para Reporte de Certificado de retencion
                var VendorProveedor = scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_proovedor_list'
                });

                if (VendorProveedor == '' || VendorProveedor == null || VendorProveedor == '0' || VendorProveedor == 0) {
                    if (language == 'es') {
                        alert('Debe seleccionar el Proveedor.');
                    } else if (language == 'pt') {
                        alert('Voce deve selecionar o Fornecedor.');
                    } else {
                        alert('You must select the Vendor.');
                    }
                    return false;
                }

                var VendorTypeRetencion = scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_tipo_retencion'
                });
                if (VendorTypeRetencion == '' || VendorTypeRetencion == null) {
                    if (language == 'es') {
                        alert('Debe seleccionar el Tipo de retencion.');
                    } else if (language == 'pt') {
                        alert('Voce deve selecionar o Tipo de retencao.');
                    } else {
                        alert('You must select the Withholding Type.');
                    }
                    return false;
                }

                var municipalidadOrigen = scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_lmry_city_origin'
                });
                if (municipalidadOrigen == '' || municipalidadOrigen == null) {
                    if (language == 'es') {
                        alert('Debe seleccionar el origen de la Municipalidad.');
                    } else if (language == 'pt') {
                        alert('Voce deve selecionar a origem do municipio.');
                    } else {
                        alert('You must select the origin of the Municipality.');
                    }
                    return false;
                }

                if (!Lib_certificate_massive.createRecordMassive(scriptContext.currentRecord)) return false;

                // Mesaje al usuario
                if (language == 'es') {
                    alert('Se generara un archivo y se enviara un mail con la confirmacion del proceso.\n\nEste proceso puede durar varios minutos.\n\nPor favor actualizar el log para su descarga.');
                } else if (language == 'pt') {
                    alert('Um arquivo é gerado e um email será enviado com a confirmação do processo.\n\nEste processo pode demorar vários minutos.\n\nPor favor, atualize o log para download.');
                } else {
                    alert('A file is generated and an email will be sent with the confirmation of the process.\n\nThis process can take several minutes.\n\nPlease update the log for download.');
                }

                

                
                return true;
            } catch (err) {
                alert(err);
                console.log("err [saveRecord]: ",err)
                //libreria.sendMail(LMRY_script , ' [ clientSaveRecord ] ' + err );
                return false;
            }
        }

        function validateField(scriptContext) {

            var feamultibook = runtime.isFeatureInEffect({
                feature: 'multibook'
            });
            var feaForeignCurrency = runtime.isFeatureInEffect({
                feature: "FOREIGNCURRENCYMANAGEMENT"
            });
            //se agrega estas variables para filtrar el año segun el calendario fiscal
            var varFlagSubsi = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            var varFiscalCalendar = runtime.isFeatureInEffect({
                feature: 'MULTIPLECALENDARS'
            });
            var paramSubsi = scriptContext.currentRecord.getValue({
                fieldId: 'custpage_subsidiary'
            });

            var reporteSunat = scriptContext.currentRecord.getValue({
                fieldId: 'custpage_lmry_reporte'
            });

            name = scriptContext.fieldId;

            var GLOBAL_LABELS = getGlobalLabels();

            if (name == 'custpage_subsidiary') {

                var subsidiary_id = scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_subsidiary'
                });
                if (subsidiary_id) Lib_certificate_massive.setSubsidiary(subsidiary_id);

                if (reporteSunat == 60 || reporteSunat == 61) {
                    var licenses = new Array();
                    if (varFlagSubsi == true || varFlagSubsi == 'T') {
                        if (subsidiary_id != 0) licenses = libFeature.getLicenses(subsidiary_id);
                    } else {
                        licenses = libFeature.getLicenses('1');
                    }
                    console.log('AMC/ licenses', licenses);
                    if (licenses.length != 0) {
                        var featureNiif = libFeature.getAuthorization(1025, licenses);
                        console.log('AMC/ featureNiif', featureNiif);

                        // Registro personalizado de campos a ocular en el SuiteLet
                        var transacdataSearch = search.create({
                            type: 'customrecord_lmry_co_filter_report',
                            columns: ['custrecord_lmry_co_filter_id', 'internalid'],
                            filters: [
                                ['custrecord_lmry_co_filter_features', 'anyof', reporteSunat], 'AND', ['isinactive', 'is', 'F']
                            ]
                        })
                        var objResult = transacdataSearch.run().getRange(0, 100);
                        if (objResult != null && objResult != '') {
                            for (var i = 0; i < objResult.length; i++) {
                                var idField = objResult[i].getValue('custrecord_lmry_co_filter_id');
                                if (featureNiif || featureNiif == 'T') {
                                    if (idField == 'custpage_digits') {
                                        scriptContext.currentRecord.getField({
                                            fieldId: idField
                                        }).isDisplay = false;
                                    }
                                } else {
                                    if (idField == 'custpage_digits') {
                                        scriptContext.currentRecord.getField({
                                            fieldId: idField
                                        }).isDisplay = true;
                                    }
                                }
                            }
                        }
                    }
                }

                // Reportes con Desvinculación
                if (reporteSunat == 56 || reporteSunat == 53 || reporteSunat == 52 || reporteSunat == 55 || reporteSunat == 54) {

                    var licenses = libFeature.getLicenses(subsidiary_id);
                   if (reporteSunat == 56) {
                        var fieldPeriod = scriptContext.currentRecord.getField({
                            fieldId: 'custpage_lmry_cr_anio'
                        });

                        console.log(fieldPeriod);
                        fieldPeriod.removeSelectOption({
                            value: null
                        });

                        fieldPeriod.insertSelectOption({
                            value: 0,
                            text: ''
                        });

                    }

                    console.log('Accounting Period');
                    var AccountPeriodSearch = search.create({
                        type: search.Type.ACCOUNTING_PERIOD,
                        filters: [
                            ["isadjust", "is", "F"],
                            "AND", ["isquarter", "is", "F"],
                            "AND", ["isinactive", "is", "F"],
                            "AND", ["isyear", "is", "T"]
                        ]
                    });
                    if (varFiscalCalendar || varFiscalCalendar == 'T') {
                        var subsidiarySearch = search.lookupFields({
                            type: search.Type.SUBSIDIARY,
                            id: paramSubsi,
                            columns: ['fiscalcalendar']
                        });
                        var fiscalCalendar = subsidiarySearch.fiscalcalendar[0].value;
                        console.log('fiscalCalendar: ' + fiscalCalendar);
                        var filtro_fiscal_calendar = search.createFilter({
                            name: 'fiscalcalendar',
                            operator: search.Operator.ANYOF,
                            values: fiscalCalendar
                        });
                        AccountPeriodSearch.filters.push(filtro_fiscal_calendar);
                    }
                    var internalIdColumn = search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    });
                    var nameColumn = search.createColumn({
                        name: "periodname",
                        sort: search.Sort.ASC,
                        label: "Name"
                    });
                    AccountPeriodSearch.columns = [internalIdColumn, nameColumn];

                    var resultado = AccountPeriodSearch.run().getRange(0, 1000);

                    if (resultado != null) {
                        for (var i = 0; i < resultado.length; i++) {
                            var yearPeriod = resultado[i].getValue('periodname').split(' ')
                            fieldPeriod.insertSelectOption({
                                value: resultado[i].getValue('internalid'),
                                text: yearPeriod[1]
                            });
                        }
                    }
                    
                    //fieldPeriod.isDisplay = true;
                }

                var filtro_calendar;

                var licensesvendor = libFeature.getLicenses(subsidiary_id);
                var featuretypeVendorList = libFeature.getAuthorization(1053, licensesvendor);

                console.log('featuretypeVendorList : ' + featuretypeVendorList);

                var formulaNameVendor1 = "NVL({entityid},CASE WHEN  {isperson} = 'T' THEN CONCAT(CONCAT({firstname},' '),{lastname}) ELSE {companyname} END)";
                var formulaNameVendor2 = "CASE WHEN  {isperson} = 'T' THEN CONCAT(CONCAT({firstname},' '),{lastname}) ELSE {companyname} END";

                var columVendor = (featuretypeVendorList || featuretypeVendorList == 'T') ? formulaNameVendor2 : formulaNameVendor1;

                var subsidiary = scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_subsidiary'
                });

                console.log('LLEGO HASTA AQUI: ' + subsidiary);


                console.log('PASO EL CAMBIO : ' + subsidiary);

                
                /***************** De Edwin */
                if (feamultibook == true || feamultibook == 'T') {
                    //MULTIBOOK DE ACUERDO A SUBSIDIARIA

                    var subsidiary = scriptContext.currentRecord.getValue({
                        fieldId: 'custpage_subsidiary'
                    });
                    var featSubsi = runtime.isFeatureInEffect({
                        feature: "SUBSIDIARIES"
                    });

                    if (featSubsi) {

                        var search_currency = search.create({
                            type: "customrecord_lmry_currency_by_country",
                            filters: [
                                ["custrecord_lmry_currency_country_local", "anyof", "48"], "AND", ["custrecord_lmry_is_country_base_currency", "is", "T"]
                            ],
                            columns: [
                                "custrecord_lmry_currency"
                            ]
                        });

                        var results_cur = search_currency.run().getRange(0, 10);
                        var currency_per = results_cur[0].getValue('custrecord_lmry_currency');

                        //alert(currency_per);
                        var search_acc = search.create({
                            type: "accountingbook",
                            filters: [
                                ["status", "anyof", "ACTIVE"], "AND",["isadjustmentonly","is","F"],"AND",["subsidiary", "anyof", subsidiary]
                            ],
                            columns: ["internalid", "name"]
                        });

                        if (feaForeignCurrency) {
                            var currencyFilter = search.createFilter({
                                name: 'currency',
                                operator: search.Operator.ANYOF,
                                values: currency_per
                            });
                            search_acc.filters.push(currencyFilter);
                        }
                        var results_acc = search_acc.run().getRange(0, 1000);

                        var select = scriptContext.currentRecord.getField({
                            fieldId: 'custpage_multibook'
                        });
                        select.removeSelectOption({
                            value: null
                        });

                        select.insertSelectOption({
                            value: 0,
                            text: ' '
                        });

                        for (var i = 0; i < results_acc.length; i++) {
                            var subID = results_acc[i].getValue('internalid');
                            var subNM = results_acc[i].getValue('name');
                            select.insertSelectOption({
                                value: subID,
                                text: subNM
                            });
                        }


                    }
                }
                /***************** */
            }

            if (name == 'custpage_periodo') {
                var period_id = scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_periodo'
                });

                var MM = getMonthPeriod(period_id);

                var featReport = scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_lmry_reporte'
                });

                if (featReport != 43 || featReport != 50 || featReport != 24) { //PARA INVENTARIO Y BALANCE 2.0 CO y BALANCE DE TERCEROS NO APLICA POR EL MOMENTO
                    if (MM == 12) {
                        scriptContext.currentRecord.getField({
                            fieldId: 'custpage_adjusment'
                        }).isDisplay = true;
                    } else {
                        scriptContext.currentRecord.getField({
                            fieldId: 'custpage_adjusment'
                        }).isDisplay = false;
                    }
                }

            }

            if (name == 'custpage_custom_period' || name == 'custpage_custom_periodfin') {
                var period_id = scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_custom_period'
                });
                var period_fin_id = scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_custom_periodfin'
                });
                var featReport = scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_lmry_reporte'
                });
                var mes = null;
                var mes_fin = null;

                if (period_id != null && period_id != '') {
                    var mes = getMonthPeriod(period_id);
                }

                if (period_fin_id != null && period_fin_id != '') {
                    var mes_fin = getMonthPeriod(period_fin_id);
                }
                if (featReport != 24) {
                    if (mes == 12 || mes_fin == 12) {
                        scriptContext.currentRecord.getField({
                            fieldId: 'custpage_adjusment'
                        }).isDisplay = true;
                    } else {
                        scriptContext.currentRecord.getField({
                            fieldId: 'custpage_adjusment'
                        }).isDisplay = false;
                    }
                }
            }

            if (name == 'custpage_lmry_reporte') {
                var subsidiary_id = scriptContext.currentRecord.setValue({
                    fieldId: 'custpage_subsidiary',
                    value: 0,
                    ignoreFieldChange: true,
                    forceSyncSourcing: true
                });
                ocultaCampos(scriptContext);


                if (reporteSunat == '' || reporteSunat == null) {
                    return true;
                }
                //alert(reporteSunat);

                if (reporteSunat == 56) {
                    scriptContext.currentRecord.getField({
                        fieldId: 'custpage_grouping_by_months'
                    }).isDisplay = true;
                }
                
                
                if (reporteSunat == 56 || reporteSunat == 59) {
                    scriptContext.currentRecord.getField({
                        fieldId: 'custpage_proovedor_list'
                    }).isDisplay = true;

                    scriptContext.currentRecord.getField({
                        fieldId: 'custpage_lmry_city_origin'
                    }).isDisplay = true;
                }

                // Registro personalizado de campos a ocular en el SuiteLet
                var transacdataSearch = search.create({
                    type: 'customrecord_lmry_co_filter_report',
                    columns: ['custrecord_lmry_co_filter_id', 'internalid'],
                    filters: [
                        ['custrecord_lmry_co_filter_features', 'anyof', reporteSunat], 'AND', ['isinactive', 'is', 'F']
                    ]
                })
                var objResult = transacdataSearch.run().getRange(0, 100);

                if (objResult != null && objResult != '') {
                    //alert(objResult.length);
                    //alert(objResult[0]);
                    for (var i = 0; i < objResult.length; i++) {
                        var idField = objResult[i].getValue('custrecord_lmry_co_filter_id');
                        var internalidFilter = objResult[i].getValue('internalid');
                        // Obteniendo datos de etiqueta y campo de ingreso
                        //alert(idField);
                        //alert(internalidFilter);
                        if (feamultibook || feamultibook == 'T') {
                            if (internalidFilter == 130 || internalidFilter == 131 || internalidFilter == 132 || internalidFilter == 166 || internalidFilter == 167 || internalidFilter == 168 || internalidFilter == 177) {
                                scriptContext.currentRecord.getField({
                                    fieldId: idField
                                }).isDisplay = false;
                            } else if (idField != null && idField != '') {
                                scriptContext.currentRecord.getField({
                                    fieldId: idField
                                }).isDisplay = true;
                            }
                        } else {
                            if (internalidFilter == 130 || internalidFilter == 131 || internalidFilter == 132 || internalidFilter == 166 || internalidFilter == 167 || internalidFilter == 168 || internalidFilter == 177) {
                                scriptContext.currentRecord.getField({
                                    fieldId: idField
                                }).isDisplay = false;
                            } else if (idField != null && idField != '' && idField != 'custpage_multibook') {
                                scriptContext.currentRecord.getField({
                                    fieldId: idField
                                }).isDisplay = true;
                            }
                        }
                    }
                }

                if (reporteSunat == 50) {

                    var featSubsi = runtime.isFeatureInEffect({
                        feature: "SUBSIDIARIES"
                    });

                    if (featSubsi) {

                    } else {
                        var arrTemp = new Array();
                        var cont = 0;

                        for (var i = 0; i < arrProcessedYears.length; i++) {
                            var arr = new Array();

                            arr[0] = arrProcessedYears[i][0];
                            arr[1] = arrProcessedYears[i][2];

                            arrTemp[cont] = arr;
                            cont++;
                        }
                        var mensaje = '';

                        if (arrTemp.length == 0) {
                            mensaje = 'Aún no hay data en el Record.';
                        } else {
                            mensaje = 'Saldos actualizados hasta el año ' + arrTemp[cont - 1][0] +
                                '.\n\nÚltima fecha de generación: ' + arrTemp[cont - 1][1] +
                                '.\n\nPara actualizar los saldos ir a: Reports -> LatamReady - RPT CO -> LatamReady - CO Delete Thirds';
                        }

                        scriptContext.currentRecord.setValue({
                            fieldId: 'custpage_msg',
                            value: mensaje
                        });
                    }

                }
              
                return true;
            }

            return true;
        }

        function obtenerDatosSubsidiaria(subsidiaryId) {
            if (varFiscalCalendar || varFiscalCalendar == 'T') {
                var subsidiary = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: subsidiaryId,
                    columns: ['fiscalcalendar']
                });

                calendarSubsi = subsidiary.fiscalcalendar[0].value;
                console.log('calendarSubsi', calendarSubsi);
            }

            var licenses = libFeature.getLicenses(subsidiaryId);
            featAccountingSpecial = libFeature.getAuthorization(677, licenses);
            console.log('featAccountingSpecial', featAccountingSpecial);
        }

        function validarSpecialPeriod(paramPeriod) {
            var periodSpecial = new Array();

            var searchSpecialPeriod = search.create({
                type: "customrecord_lmry_special_accountperiod",
                filters: [
                    ["isinactive", "is", "F"], 'AND', ["custrecord_lmry_accounting_period", "is", paramPeriod]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_lmry_calendar",
                        label: "0. Latam - Calendar"
                    }),
                    search.createColumn({
                        name: "custrecord_lmry_date_ini",
                        label: "1. Latam - Date Start",
                    }),
                    search.createColumn({
                        name: "custrecord_lmry_date_fin",
                        label: "2. Latam - Date Fin",
                    }),
                    search.createColumn({
                        name: "name",
                        label: "3. Latam - Period Name",
                    })
                ]
            });

            var pagedData = searchSpecialPeriod.runPaged({
                pageSize: 1000
            });

            pagedData.pageRanges.forEach(function (pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });

                page.data.forEach(function (result) {
                    columns = result.columns;
                    var calendar = result.getValue(columns[0]);
                    var periodName = result.getValue(columns[3]);
                    var startDate = result.getValue(columns[1]);

                    var temporal = [periodName, startDate];

                    if (calendarSubsi != null && calendarSubsi != '') {
                        if (calendar != null && calendar != '') {
                            calendar = JSON.parse(calendar);
                            if (calendar.id == calendarSubsi) {
                                periodSpecial = temporal;
                            }
                        } else {
                            console.log('no se configuro periodo especial');
                        }

                    } else {
                        periodSpecial = temporal;
                    }

                })
            });

            return periodSpecial;
        }

        function validateSpecialPeriodFormMagnetic(periodo) {
            var periodSpecial = new Array();

            var searchSpecialPeriod = search.create({
                type: "customrecord_lmry_special_accountperiod",
                filters: [
                    ["isinactive", "is", "F"], 'AND',
                    ["custrecord_lmry_anio_fisco", "is", periodo], 'AND',
                    ["custrecord_lmry_adjustment", "is", "F"]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_lmry_calendar",
                        label: "0. Latam - Calendar"
                    }),
                    search.createColumn({
                        name: "custrecord_lmry_date_ini",
                        label: "1. Latam - Date Start",
                    }),
                    search.createColumn({
                        name: "custrecord_lmry_date_fin",
                        label: "2. Latam - Date Fin",
                    }),
                    search.createColumn({
                        name: "name",
                        label: "3. Latam - Period Name",
                    })
                ]
            });

            var pagedData = searchSpecialPeriod.runPaged({
                pageSize: 1000
            });

            pagedData.pageRanges.forEach(function (pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });

                page.data.forEach(function (result) {
                    columns = result.columns;
                    var calendar = result.getValue(columns[0]);
                    var periodName = result.getValue(columns[3]);
                    var startDate = result.getValue(columns[1]);

                    var temporal = [periodName, startDate];

                    if (calendarSubsi != null && calendarSubsi != '') {
                        if (calendar != null && calendar != '') {
                            calendar = JSON.parse(calendar);
                            if (calendar.id == calendarSubsi) {
                                periodSpecial = temporal;
                            }
                        } else {
                            console.log('no se configuro periodo especial');
                        }

                    } else {
                        periodSpecial = temporal;
                    }

                })
            });

            return periodSpecial;
        }

        function fieldChanged(scriptContext) {
            return true;
        }

        function getMonthPeriod(periodID) {
            var periodenddate_temp = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: periodID,
                columns: ['enddate']
            });
            //Period EndDate
            var periodenddate = periodenddate_temp.enddate;
            //Nuevo Formato Fecha
            var parsedDateStringAsRawDateObject = format.parse({
                value: periodenddate,
                type: format.Type.DATE
            });
            var MM = parsedDateStringAsRawDateObject.getMonth() + 1;

            return MM;
        }

        function ocultaCampos(pFormulario) {

            var feamultibook = runtime.isFeatureInEffect({
                feature: 'multibook'
            });

            var transacdataSearch = search.create({
                type: 'customrecord_lmry_co_filter_report',

                filters: ['isinactive', 'is', 'F'],

                columns: [
                    search.createColumn({
                        name: 'custrecord_lmry_co_filter_id',
                    }),
                    search.createColumn({
                        name: 'formulatext',
                        formula: '{custrecord_lmry_co_filter_features.custrecord_lmry_co_id_type}'
                    })
                ]

            })
            var objResult = transacdataSearch.run().getRange({
                start: 0,
                end: 1000
            });

            if (objResult != null && objResult != '') {
                for (var i = 0; i < objResult.length; i++) {
                    var idField = objResult[i].getValue('custrecord_lmry_co_filter_id');
                    var reportType = objResult[i].getValue(objResult[i].columns[1])
                    if (idField != null && idField != '' && reportType == 'C') {
                        if (feamultibook || feamultibook == 'T') {
                            // Oculta el campo
                            pFormulario.currentRecord.getField({
                                fieldId: idField
                            }).isDisplay = false;
                        } else {
                            if (idField != 'custpage_multibook') {
                                // Oculta el campo
                                pFormulario.currentRecord.getField({
                                    fieldId: idField
                                }).isDisplay = false;
                            }
                        }
                    }
                }
            }

            pFormulario.currentRecord.getField({
                fieldId: 'custpage_custom_period'
            }).isDisplay = false;

            pFormulario.currentRecord.getField({
                fieldId: 'custpage_custom_periodfin'
            }).isDisplay = false;

            pFormulario.currentRecord.getField({
                fieldId: 'custpage_grouping_by_months'
            }).isDisplay = false;

            pFormulario.currentRecord.getField({
                fieldId: 'custpage_proovedor_list'
            }).isDisplay = false;

            pFormulario.currentRecord.getField({
                fieldId: 'custpage_lmry_city_origin'
            }).isDisplay = false;

        }

        function _GetResult(field, strdata) {
            try {
                var intpos = strdata.indexOf('=');
                var straux = strdata.substr(0, parseInt(intpos));
                var strcad = '';
                if (field == straux) {
                    // Extrae la cadena desde (:) para adelante
                    straux = strdata.substr(parseInt(intpos) + 1);
                    // Valida que el campo no de null
                    if (straux == 'null') {
                        return '';
                    }
                    // Barre el resto de la cadena
                    for (var pos = 0; pos < straux.length; pos++) {
                        if (straux[pos] != '"') {
                            strcad += straux[pos];
                        }
                    }
                    return strcad;
                }
            } catch (err) {
                alert(err);
            }
            return '';
        }

        function validarStatus(deploymentId) {

            var suiteletURL = 'https://' + window.location.host +
                url.resolveScript({
                    scriptId: 'customscript_lmry_co_validatestatus_stlt',
                    deploymentId: 'customdeploy_lmry_co_validatestatus_stlt',
                    returnExternalUrl: false
                });

            suiteletURL += '&schdl=' + deploymentId;

            var request = https.get({
                url: suiteletURL
            });
            var rpta = JSON.parse(request.body);

            var status = rpta.value;

            return status;
        }

        function getGlobalLabels() {
            var labels = {
                "msjeSubsiVacia": {
                    "es": 'Debe seleccionar el campo Subsidiaria.',
                    "pt": 'Você deve selecionar o campo Subsidiária.',
                    "en": 'You must select the Subsidiary field.'
                },
                "msjeCampoVacio": {
                    "es": 'Debe seleccionar el campo Reporte.',
                    "pt": 'Você deve selecionar o campo Relatório.',
                    "en": 'You must select the Report field.'
                },
                "msjeReporteProcesando": {
                    "es": 'El Reporte se esta procesando.',
                    "pt": 'O relatório está sendo processado.',
                    "en": 'The report is being processed.'
                },
                "msjeValidateFieldPeriod" :  {
                    "es": 'Debe seleccionar el periodo anual.',
                    "pt": 'Você deve selecionar o período anual.',
                    "en": 'You must select the annual period.'
                }    
            }

            return labels;
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            validateField: validateField,
            fieldChanged: fieldChanged
        };

    });