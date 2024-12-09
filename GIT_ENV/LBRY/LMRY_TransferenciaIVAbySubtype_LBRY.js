/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       Dic 2021        LatamReady
 * File : LMRY_TransferenciaIVAbySubtype_LBRY.js
 */
var objContext = nlapiGetContext();

var LMRY_script = 'LatamReady - MX Traslado IVA Subtype PLGN';
var featureMB = false;
var featureLang = objContext.getPreference('LANGUAGE');
var featureLang = featureLang.substring(0, 2);
var featureSubs = false;
var withDiscount = false;
var fecha = '';
var subsidiary = 1;
var jsonGlobalAM = {};
var FEAT_ACC_MAPPING = false;

function transferenciaIvabySubType(transactionRecord, standardLines, customLines, book, licenses) {

    try {

        var transactionType = transactionRecord.getRecordType().toLowerCase();
        //validate approval Gl impact
        if (transactionType == "vendorpayment" && getAuthorization(673, licenses)) {
            var approvalVendorPayment = objContext.getPreference("CUSTOMAPPROVALVENDPYMT");
            if (approvalVendorPayment == "T" || approvalVendorPayment == true) {
                var approvalStatus = transactionRecord.getFieldValue("approvalstatus");
                if (Number(approvalStatus) != 2) {
                    return true;
                }
            }
        }

        //validate country
        var country = transactionRecord.getFieldText("custbody_lmry_subsidiary_country");
        if (country != '' && country != null) {
            country = country.substring(0, 3).toUpperCase();
        }
        country = country.substring(0, 1) + country.substring(2, 3);

        if (country != 'MX') {
            return true;
        }

        //var idTransaction = transactionRecord.getId();
        fecha = transactionRecord.getFieldValue("trandate");
        featureSubs = objContext.getFeature('SUBSIDIARIES');
        if (featureSubs) {
            subsidiary = transactionRecord.getFieldValue("subsidiary");
        }

        featureMB = objContext.getFeature('MULTIBOOK');
        FEAT_ACC_MAPPING = objContext.getFeature('coaclassificationmanagement');

        //featerure traslado de Iva
        if (getAuthorization(243, licenses) == false) {
            return true;
        }

        var discountWTHTransaction = ['vendorpayment', 'vendorprepaymentapplication'];
        if ((discountWTHTransaction.indexOf(transactionType) !== -1) && getAuthorization(814, licenses)) {
            withDiscount = true;
        }

        var entity = '';

        //var estadoIVA = nlapiLookupField(transactionType, idTransaction, 'custbody_lmry_schedule_transfer_of_iva');

        //INICIO OBTENCION DE CUENTAS POR TAX CODE
        var filtrosCT = new Array();
        filtrosCT[0] = new nlobjSearchFilter("isinactive", null, "is", ['F']);
        if (featureSubs) {
            filtrosCT[1] = new nlobjSearchFilter("custrecord_lmry_mx_latam_vat_subsidiary", null, "is", [subsidiary]);
        }

        var columnasCT = new Array();
        columnasCT[0] = new nlobjSearchColumn("custrecord_lmry_mx_latam_vat_subtype");
        if (['customerpayment', 'customerrefund', 'depositapplication'].indexOf(transactionType) > -1) {
            entity = transactionRecord.getFieldValue("customer");
            columnasCT[1] = new nlobjSearchColumn("custrecord_lmry_mx_latam_vat_debitsales");
            columnasCT[2] = new nlobjSearchColumn("custrecord_lmry_mx_latam_vat_creditsales");
            columnasCT[3] = new nlobjSearchColumn("custrecord_lmry_mx_latam_vat_earningsale");
            columnasCT[4] = new nlobjSearchColumn("custrecord_lmry_mx_latam_vat_deficitsale");
        } else {
            entity = transactionRecord.getFieldValue("entity");
            columnasCT[1] = new nlobjSearchColumn("custrecord_lmry_mx_latam_vat_debitpurch");
            columnasCT[2] = new nlobjSearchColumn("custrecord_lmry_mx_latam_vat_creditpurch");
            columnasCT[3] = new nlobjSearchColumn("custrecord_lmry_mx_latam_vat_earningpurc");
            columnasCT[4] = new nlobjSearchColumn("custrecord_lmry_mx_latam_vat_deficitpurc");
        }

        var searchCT = nlapiCreateSearch("customrecord_lmry_mx_vat_transf_subtype", filtrosCT, columnasCT);
        var resultCT = searchCT.runSearch().getResults(0, 1000);

        if (resultCT.length == 0) {
            return true;
        }

        var jsonCT = {}, contadorCT = 0;

        if (resultCT != null && resultCT.length > 0) {
            for (var i = 0; i < resultCT.length; i++) {
                var taxCT = resultCT[i].getValue('custrecord_lmry_mx_latam_vat_subtype');
                if (jsonCT[taxCT] == null || jsonCT[taxCT] == undefined) {
                    if (['customerpayment', 'customerrefund', 'depositapplication'].indexOf(transactionType) > -1) {
                        jsonCT[taxCT] = {
                            'debit': resultCT[i].getValue('custrecord_lmry_mx_latam_vat_debitsales'),
                            'credit': resultCT[i].getValue('custrecord_lmry_mx_latam_vat_creditsales'),
                            'earning': resultCT[i].getValue('custrecord_lmry_mx_latam_vat_earningsale'),
                            'deficit': resultCT[i].getValue('custrecord_lmry_mx_latam_vat_deficitsale'),
                            'name': resultCT[i].getText('custrecord_lmry_mx_latam_vat_subtype')
                        };
                        contadorCT++;
                    } else {
                        jsonCT[taxCT] = {
                            'debit': resultCT[i].getValue('custrecord_lmry_mx_latam_vat_debitpurch'),
                            'credit': resultCT[i].getValue('custrecord_lmry_mx_latam_vat_creditpurch'),
                            'earning': resultCT[i].getValue('custrecord_lmry_mx_latam_vat_earningpurc'),
                            'deficit': resultCT[i].getValue('custrecord_lmry_mx_latam_vat_deficitpurc'),
                            'name': resultCT[i].getText('custrecord_lmry_mx_latam_vat_subtype')
                        };
                        contadorCT++;
                    }
                }
            }
            if (!parseFloat(contadorCT) > 0) {
                return true;
            }

            nlapiLogExecution('DEBUG', 'jsonCT', JSON.stringify(jsonCT));

            //Verificamos si la cuenta se encuentra en el record de las cuentas excluidas
            var accTransaccion = '';
            if (['vendorprepaymentapplication', 'depositapplication'].indexOf(transactionType) > -1) {
                var tranOrigin = transactionType == 'vendorprepaymentapplication' ? 'vendorprepayment' : 'customerdeposit';
                var fieldOrigin = transactionType == 'vendorprepaymentapplication' ? 'vendorprepayment' : 'deposit';
                accTransaccion = nlapiLookupField(tranOrigin, transactionRecord.getFieldValue(fieldOrigin), 'account', false);
            } else {
                accTransaccion = transactionRecord.getFieldValue("account");
            }

            if (accTransaccion != '' && accTransaccion != null) {
                var filtros = new Array();
                filtros[0] = new nlobjSearchFilter('custrecord_lmry_account_no_transferiva', null, 'anyof', accTransaccion);
                filtros[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');

                var columnas = new Array();
                columnas[0] = new nlobjSearchColumn('internalid');

                var searchCuentas = nlapiSearchRecord('customrecord_lmry_account_no_transferiva', null, filtros, columnas);
                if (searchCuentas != null && searchCuentas != '') {
                    // Marca la transaccion como excluida del proceso
                    return true;
                }
            }

            var applySublist = (transactionType == 'vendorprepaymentapplication') ? transactionRecord.getLineItemCount('bill') : transactionRecord.getLineItemCount('apply');
            var applySb = (transactionType == 'vendorprepaymentapplication') ? 'bill' : 'apply';

            nlapiLogExecution('DEBUG', 'applysublist1', applySublist);
            //ARREGLO DE BILLS
            var transaccionPagar = [];

            for (var i = 1; i <= applySublist; i++) {
                var apply = transactionRecord.getLineItemValue(applySb, 'apply', i);
                nlapiLogExecution('DEBUG', 'apply', apply);
                if (apply == 'T' || apply == true) {
                    var lineID = transactionRecord.getLineItemValue(applySb, 'internalid', i);
                    nlapiLogExecution('DEBUG', 'lineID', lineID);
                    transaccionPagar.push(lineID);
                }
            }
            //nlapiLogExecution('DEBUG', 'doc', lineID);
            nlapiLogExecution('DEBUG', 'arraytransacciones', transaccionPagar);

            if (!transaccionPagar.length) {
                return true;
            }

            //INICIO BUSQUEDA DE MX TRANSACTION IVA
            var filtrosMXIVA = [];
            filtrosMXIVA[0] = new nlobjSearchFilter("custrecord_lmry_mx_transaction_related", null, "anyof", transaccionPagar);
            filtrosMXIVA[1] = new nlobjSearchFilter("isinactive", null, "is", ['F']);
            filtrosMXIVA[2] = new nlobjSearchFilter("mainline", "custrecord_lmry_mx_transaction_related", "is", ['T']);

            var columnasMXIVA = new Array();
            columnasMXIVA[0] = new nlobjSearchColumn("internalid");
            columnasMXIVA[1] = new nlobjSearchColumn("custrecord_lmry_mx_vat_transfer_by_stype");
            columnasMXIVA[2] = new nlobjSearchColumn("custrecord_lmry_mx_amount_net");
            columnasMXIVA[3] = new nlobjSearchColumn("custrecord_lmry_mx_amount_tax");
            columnasMXIVA[4] = new nlobjSearchColumn("custrecord_lmry_mx_amount_total");
            columnasMXIVA[5] = new nlobjSearchColumn("custrecord_lmry_mx_transaction_related");
            columnasMXIVA[6] = new nlobjSearchColumn("transactionnumber", "custrecord_lmry_mx_transaction_related");
            columnasMXIVA[7] = new nlobjSearchColumn("formulatext").setFormula("{custrecord_lmry_mx_transaction_related.tranid}");
            columnasMXIVA[8] = new nlobjSearchColumn("exchangerate", "custrecord_lmry_mx_transaction_related");

            var SearchMXIVA = nlapiCreateSearch("customrecord_lmry_mx_transaction_fields", filtrosMXIVA, columnasMXIVA);
            var ResultMXIVA = SearchMXIVA.runSearch().getResults(0, 1000);

            if (ResultMXIVA.length == 0) {
                return true;
            }

            var jsonMXIVA = {}, jsonMB = {}, contadorMXIVA = 0;
            //LLENADO DE JSON CON RESULTADOS DE MX TRANSACTION IVA
            if (ResultMXIVA != null && ResultMXIVA.length > 0) {
                var columMXIVA = ResultMXIVA[0].getAllColumns();
                for (var i = 0; i < ResultMXIVA.length; i++) {
                    var idBillMX = ResultMXIVA[i].getValue('custrecord_lmry_mx_transaction_related');
                    if (jsonMXIVA[idBillMX] == null || jsonMXIVA[idBillMX] == undefined) {
                        var dataByCode = ResultMXIVA[i].getValue('custrecord_lmry_mx_vat_transfer_by_stype');
                        jsonMXIVA[idBillMX] = {
                            'databycode': dataByCode ? JSON.parse(dataByCode) : {},
                            'net': ResultMXIVA[i].getValue('custrecord_lmry_mx_amount_net'),
                            'tax': ResultMXIVA[i].getValue('custrecord_lmry_mx_amount_tax'),
                            'total': ResultMXIVA[i].getValue('custrecord_lmry_mx_amount_total'),
                            'tranid': ResultMXIVA[i].getValue(columMXIVA[7]),
                            'transactionnumber': ResultMXIVA[i].getValue(columMXIVA[6]),
                            'exchangerate': ResultMXIVA[i].getValue(columMXIVA[8])
                        };
                        contadorMXIVA++;
                    }
                }
            }

            nlapiLogExecution('DEBUG', 'jsonMXIVA', JSON.stringify(jsonMXIVA));

            if (!parseFloat(contadorMXIVA) > 0) {
                return true;
            }

            //FIN  MX TRANSACTION IVA

            //Busqueda de MX de Devoluciones
            var filtrosMXDev = [];
            filtrosMXDev[0] = new nlobjSearchFilter("custrecord_lmry_mx_transaction", null, "anyof", transaccionPagar);
            filtrosMXDev[1] = new nlobjSearchFilter("isinactive", null, "is", ['F']);
            filtrosMXDev[2] = new nlobjSearchFilter("custrecord_lmry_mx_transaction_related", null, "noneof", ["@NONE@"]);
            filtrosMXDev[3] = new nlobjSearchFilter("type", "custrecord_lmry_mx_transaction_related", "anyof", ["VendCred", "CustCred"]);
            filtrosMXDev[4] = new nlobjSearchFilter("mainline", "custrecord_lmry_mx_transaction_related", "is", "T");

            var columnasMXDev = new Array();
            columnasMXDev[0] = new nlobjSearchColumn("internalid");
            columnasMXDev[1] = new nlobjSearchColumn("custrecord_lmry_mx_vat_transfer_by_stype");
            columnasMXDev[2] = new nlobjSearchColumn("custrecord_lmry_mx_amount_net");
            columnasMXDev[3] = new nlobjSearchColumn("custrecord_lmry_mx_amount_tax");
            columnasMXDev[4] = new nlobjSearchColumn("custrecord_lmry_mx_amount_total");
            columnasMXDev[5] = new nlobjSearchColumn("custrecord_lmry_mx_transaction");

            var SearchMXDev = nlapiCreateSearch("customrecord_lmry_mx_transaction_fields", filtrosMXDev, columnasMXDev);
            SearchMXDev = SearchMXDev.runSearch().getResults(0, 1000);

            var jsonDev = {};

            if (SearchMXDev && SearchMXDev.length) {
                var columMXIVA = SearchMXDev[0].getAllColumns();
                for (var i = 0; i < SearchMXDev.length; i++) {
                    var idBillMX = SearchMXDev[i].getValue('custrecord_lmry_mx_transaction');

                    if (!jsonDev[idBillMX]) {
                        jsonDev[idBillMX] = { 'databycode': {}, 'net': 0, 'tax': 0, 'total': 0 };
                    }

                    var dataByCode = SearchMXDev[i].getValue('custrecord_lmry_mx_vat_transfer_by_stype');
                    dataByCode = dataByCode ? JSON.parse(dataByCode) : {};

                    for (var taxcodeid in dataByCode) {
                        if (!jsonDev[idBillMX]['databycode'][taxcodeid]) {
                            jsonDev[idBillMX]['databycode'][taxcodeid] = {
                                'name': dataByCode[taxcodeid]['name'],
                                'amount': 0,
                                'taxamt': 0,
                                'grossamt': 0,
                                'whtamount': 0
                            };
                        }
                        jsonDev[idBillMX]['databycode'][taxcodeid]['amount'] += parseFloat(dataByCode[taxcodeid]['amount']);
                        jsonDev[idBillMX]['databycode'][taxcodeid]['taxamt'] += parseFloat(dataByCode[taxcodeid]['taxamt']);
                        jsonDev[idBillMX]['databycode'][taxcodeid]['grossamt'] += parseFloat(dataByCode[taxcodeid]['grossamt']);
                        jsonDev[idBillMX]['databycode'][taxcodeid]['whtamount'] += parseFloat(dataByCode[taxcodeid]['whtamount']);
                    }

                    jsonDev[idBillMX]['net'] += parseFloat(SearchMXDev[i].getValue('custrecord_lmry_mx_amount_net'));
                    jsonDev[idBillMX]['tax'] += parseFloat(SearchMXDev[i].getValue('custrecord_lmry_mx_amount_tax'));
                    jsonDev[idBillMX]['total'] += parseFloat(SearchMXDev[i].getValue('custrecord_lmry_mx_amount_total'));

                }
            }

            nlapiLogExecution('DEBUG', 'jsonDev', JSON.stringify(jsonDev));

            //Resta Respectiva
            for (var idBillMX in jsonMXIVA) {

                if (!jsonDev[idBillMX]) {
                    continue;
                }

                for (var taxcodeid in jsonDev[idBillMX]['databycode']) {

                    if (jsonMXIVA[idBillMX]['databycode'][taxcodeid] && (jsonMXIVA[idBillMX]['databycode'][taxcodeid]['taxamt'] >= jsonDev[idBillMX]['databycode'][taxcodeid]['taxamt'])) {
                        jsonMXIVA[idBillMX]['databycode'][taxcodeid]['taxamt'] -= jsonDev[idBillMX]['databycode'][taxcodeid]['taxamt'];
                    }

                }

            }

            nlapiLogExecution('DEBUG', 'jsonMXIVA pos Dev', JSON.stringify(jsonMXIVA));

            //Busqueda de segmentacion por subsidiaria en setuptax
            var filtrosST = new Array();
            filtrosST[0] = new nlobjSearchFilter("isinactive", null, "is", ['F']);
            if (featureSubs) {
                filtrosST[1] = new nlobjSearchFilter("custrecord_lmry_setuptax_subsidiary", null, "is", [subsidiary]);
            }
            var columnasST = new Array();
            columnasST[0] = new nlobjSearchColumn("custrecord_lmry_setuptax_department");
            columnasST[1] = new nlobjSearchColumn("custrecord_lmry_setuptax_class");
            columnasST[2] = new nlobjSearchColumn("custrecord_lmry_setuptax_location");

            var searchSetupSubsidiary = nlapiCreateSearch("customrecord_lmry_setup_tax_subsidiary", filtrosST, columnasST);
            var resultSearchSub = searchSetupSubsidiary.runSearch().getResults(0, 1000);

            if (resultSearchSub.length != null && resultSearchSub.length > 0) {
                var departmentSetup = resultSearchSub[0].getValue("custrecord_lmry_setuptax_department");
                var classSetup = resultSearchSub[0].getValue("custrecord_lmry_setuptax_class");
                var locationSetup = resultSearchSub[0].getValue("custrecord_lmry_setuptax_location");
            }


            //BUSQUEDA DE MULTIBOOKING
            if (featureMB) {

                var filtrosMB = [];
                filtrosMB[0] = new nlobjSearchFilter("internalid", null, "anyof", transaccionPagar);
                filtrosMB[1] = new nlobjSearchFilter("mainline", null, "is", 'T');

                var columnasMB = [];
                columnasMB[0] = new nlobjSearchColumn("internalid");
                columnasMB[1] = new nlobjSearchColumn("accountingbook", "accountingTransaction");
                columnasMB[2] = new nlobjSearchColumn("accountingbookid", "accountingTransaction");
                columnasMB[3] = new nlobjSearchColumn("exchangerate", "accountingTransaction");

                var searchMB = nlapiCreateSearch("transaction", filtrosMB, columnasMB);
                var resultMB = searchMB.runSearch().getResults(0, 1000);

                if (resultMB != null && resultMB.length > 0) {
                    var columMB = resultMB[0].getAllColumns();
                    for (var i = 0; i < resultMB.length; i++) {
                        var idDoc = resultMB[i].getValue('internalid');

                        if (jsonMB[idDoc] == null || jsonMB[idDoc] == undefined) {
                            jsonMB[idDoc] = [];
                        }

                        jsonMB[idDoc].push({ 'book': resultMB[i].getText(columMB[1]), 'bookid': resultMB[i].getValue(columMB[2]), 'exchangerate': resultMB[i].getValue(columMB[3]) });

                    }
                }

                //LLENADO DE JSON GLOBAL ACCOUNT MAPPING
                if (FEAT_ACC_MAPPING == true || FEAT_ACC_MAPPING == "T") {
                    devolverCuentaGlobal();
                }
                //nlapiLogExecution('ERROR','jsonGlobalAM',JSON.stringify(jsonGlobalAM));

            }

            // COMIENZO PAGO
            for (var i = 1; i <= applySublist; i++) {

                //nlapiLogExecution('DEBUG', 'applysublist2', applySublist);

                var apply = transactionRecord.getLineItemValue(applySb, 'apply', i);
                if (apply == 'T' || apply == true) {
                    //Se captura el id de la transaccion
                    var lineID = transactionRecord.getLineItemValue(applySb, 'internalid', i);
                    //nlapiLogExecution('DEBUG', 'lineID', lineID);
                    //SI NO ESTA EL BILL EN EL JSON, NO GENERA SUITEGL
                    if (jsonMXIVA[lineID] == null || jsonMXIVA[lineID] == undefined) {
                        //nlapiLogExecution("ERROR", "mensaje", "nogenera");
                        continue;
                    }

                    var lineType = transactionRecord.getLineItemValue(applySb, 'trantype', i).toLowerCase(); // Tipo de Linea
                    var linePaymentAmount = transactionRecord.getLineItemValue(applySb, 'amount', i); // Monto

                    var exchangeRate = 1;
                    var taxamt = jsonMXIVA[lineID]['tax'];
                    var grossamt = jsonMXIVA[lineID]['total'];

                    if (jsonDev[lineID]) {
                        grossamt -= parseFloat(jsonDev[lineID]['total']);
                    }

                    var typeTransactionLine = '';
                    var memo = '';

                    exchangeRate = transactionRecord.getFieldValue('exchangerate');

                    //nlapiLogExecution('DEBUG', 'Tax1', taxamt);
                    //nlapiLogExecution('DEBUG', 'gross1', grossamt);

                    if (!taxamt) {
                        //nlapiLogExecution("ERROR", "mensaje", "sintaxamount");
                        continue;
                    }

                    taxamt = parseFloat(Math.round(parseFloat(taxamt) * 100) / 100);

                    grossamt = parseFloat(Math.round(parseFloat(grossamt) * 100) / 100);
                    if (exchangeRate == '' || exchangeRate == 0) {
                        exchangerate = 1;
                    }
                    exchangeRate = parseFloat(exchangeRate);
                    nlapiLogExecution('DEBUG', 'Tax2', taxamt);
                    nlapiLogExecution('DEBUG', 'gross2', grossamt);

                    var prefDep = objContext.getPreference('DEPTMANDATORY');
                    var prefLoc = objContext.getPreference('LOCMANDATORY');
                    var prefClas = objContext.getPreference('CLASSMANDATORY');
                    var departmentLine = '';
                    var classLine = '';
                    var locationLine = '';
                    var contadorSeg = parseInt(0);


                    if (prefDep == 'T' || prefDep == true) {
                        departmentLine = elegirSegmentacion(transactionRecord.getFieldValue("department"), departmentSetup);
                        if (departmentLine == '' || departmentLine == null) {
                            contadorSeg = contadorSeg + 1;
                        }
                    }

                    if (prefClas == 'T' || prefClas == true) {
                        classLine = elegirSegmentacion(transactionRecord.getFieldValue("class"), classSetup);
                        if (classLine == '' || classLine == null) {
                            contadorSeg = contadorSeg + 1;
                        }
                    }

                    if (prefLoc == 'T' || prefLoc == true) {
                        locationLine = elegirSegmentacion(transactionRecord.getFieldValue("location"), locationSetup);
                        if (locationLine == '' || locationLine == null) {
                            contadorSeg = contadorSeg + 1;
                        }
                    }
                    nlapiLogExecution('DEBUG', 'contadorSeg', contadorSeg);

                    if (contadorSeg > 0) {
                        if (featureLang == 'es') {
                            sendemail(' [ customizeGlImpact ] ' + 'La Segmentacion (Clase, Departamento o Localidad) han sido configurados obligatorios en Preferencias de Contabilidad y no se encuentran configurados en el formulario, por lo tanto debe registrarlos en la ruta Setup > LatamReady - Setup > LatamReady - Setup Tax Subsi.', LMRY_script);
                            break;
                        } else {
                            sendemail(' [ customizeGlImpact ] ' + 'The Segmentation (Class, Department or Location) have been configured as mandatory in Accounting Preferences and have not been configured in the form, therefore you must configure them in the path Setup > LatamReady - Setup > LatamReady - Setup Tax Subsi.', LMRY_script);
                            break;
                        }
                    }

                    for (var j in jsonMXIVA[lineID]['databycode']) {

                        if (parseFloat(jsonMXIVA[lineID]['databycode'][j]['taxamt']) > 0) {

                            if (jsonMXIVA[lineID]['databycode'][j]['ieps']) {
                                continue;
                            }

                            if (!jsonCT[j]) {
                                continue;
                            }

                            if (!jsonCT[j]['debit'] || !jsonCT[j]['credit'] || !jsonCT[j]['earning'] || !jsonCT[j]['deficit']) {
                                nlapiLogExecution("ERROR", "mensaje", "FALTA CONFIGURAR CUENTAS");
                                continue;
                            }
                            //ARMADO DE MEMOS

                            memo = 'Latam - IVA Tax transference ';
                            switch (lineType) {
                                case 'custinvc':
                                    memo = memo + '- Sales ';
                                    break;
                                case 'vendbill':
                                    memo = memo + '- Purchases ';
                                    break;
                                case 'exprept':
                                    memo = memo + '- Expense Reports ';
                                    break;
                                case 'custcred':
                                    memo = memo + '- Sales ';
                                    break;
                                case 'vendcred':
                                    memo = memo + '- Purchases ';
                                    break;
                                default:
                                    continue;
                            }

                            memo = memo + '(' + jsonMXIVA[lineID]['databycode'][j]['name'] + ')' + ' (Doc: ';

                            /*switch(j){
                              case 'S-MX':
                                  memo = memo + '- IVA Transference S-MX (Doc: ';
                                  break;
                              case 'DS-MX':
                                  memo = memo + '- IVA Transference DS-MX (Doc: ';
                                  break;
                              case 'IS-MX':
                                  memo = memo + '- IVA Transference IS-MX (Doc: ';
                                  break;
                              case 'IE-MX':
                                  memo = memo + '- IVA Transference IE-MX (Doc: ';
                                  break;
                              case 'Z-MX':
                                  memo = memo + '- IVA Transference Z-MX (Doc: ';
                                  break;
                              case 'E-MX':
                                  memo = memo + '- IVA Transference E-MX (Doc: ';
                                  break;
                              case 'SNOC-MX':
                                  memo = memo + '- IVA Transference SNOC-MX (Doc: ';
                                  break;
                              case 'INOC-MX':
                                  memo = memo + '- IVA Transference INOC-MX (Doc: ';
                                  break;
                              case 'S8-MX':
                                  memo = memo + '- IVA Transference S8-MX (Doc: ';
                                  break;
                              case 'S4-MX':
                                  memo = memo + '- IVA Transference S4-MX (Doc: ';
                                  break;
                              case 'S8NOC-MX':
                                  memo = memo + '- IVA Transference S8NOC-MX (Doc: ';
                                  break;
                              default:
                                  break;
                            }*/
                            var tranid = jsonMXIVA[lineID]['tranid'];

                            if (tranid == '' || tranid == null) {
                                tranid = jsonMXIVA[lineID]['transactionnumber'];
                                if (tranid == '' || tranid == null) {
                                    tranid = lineID;
                                }
                            }

                            memo = memo + tranid + ', ID: ' + lineID + ')';
                            nlapiLogExecution('DEBUG', 'memo', memo);

                            //PAGO PARCIAL
                            var montotaxcode = parseFloat(Math.round(parseFloat(jsonMXIVA[lineID]['databycode'][j]['taxamt']) * 100) / 100);
                            var amountIVA = parseFloat(montotaxcode) * parseFloat(linePaymentAmount) / parseFloat(grossamt);
                            amountIVA = parseFloat(Math.round(amountIVA * 100) / 100); // Monto de la Transaccion
                            //Retencion
                            var retencion = parseFloat(jsonMXIVA[lineID]['databycode'][j]['whtamount']) * (parseFloat(linePaymentAmount) / parseFloat(grossamt));
                            retencion = parseFloat(Math.round(retencion * 100) / 100);
                            if (withDiscount) {
                                amountIVA = parseFloat(amountIVA) - parseFloat(retencion);
                                amountIVA = parseFloat(Math.round(amountIVA * 100) / 100);
                            }

                            var amountIVAPayment = amountIVA;
                            var revaluacionMoneda = 0;
                            nlapiLogExecution('DEBUG', 'ivapagar', amountIVAPayment);

                            if (amountIVA == 0 || amountIVA == '') {
                                nlapiLogExecution("ERROR", "mensaje", "monto Iva vacio");
                                continue;
                            }

                            //MULTIBOOKING
                            if (featureMB) {
                                amountIVA = tipoCambioMB(jsonMB[lineID], book, amountIVA, jsonMXIVA[lineID]['exchangerate'], '1');
                                amountIVAPayment = tipoCambioMB(transactionRecord, book, amountIVAPayment, exchangeRate, '0');
                            } else {
                                var exRateLine = jsonMXIVA[lineID]['exchangerate'];
                                var exRateTrans = transactionRecord.getFieldValue("exchangerate");

                                if (exRateLine) {
                                    amountIVA = amountIVA * parseFloat(exRateLine);
                                    amountIVA = parseFloat(Math.round(parseFloat(amountIVA) * 100) / 100);
                                }

                                if (exRateTrans) {
                                    amountIVAPayment = amountIVAPayment * parseFloat(exRateTrans);
                                    amountIVAPayment = parseFloat(Math.round(parseFloat(amountIVAPayment) * 100) / 100);
                                }
                            }

                            if (amountIVA != amountIVAPayment) {
                                revaluacionMoneda = parseFloat(amountIVA) - parseFloat(amountIVAPayment);
                                revaluacionMoneda = Math.abs(revaluacionMoneda);
                                revaluacionMoneda = parseFloat(Math.round(parseFloat(revaluacionMoneda) * 100) / 100);
                            }

                            var montoDebit, montoCredit;

                            if (['customerpayment', 'customerrefund', 'depositapplication'].indexOf(transactionType) > -1) { // Customer Payment
                                montoDebit = amountIVA;
                                montoCredit = amountIVAPayment;
                            } else { // Bill Payment
                                montoDebit = amountIVAPayment;
                                montoCredit = amountIVA;
                            }

                            if (montoDebit <= 0 || montoCredit <= 0) {
                                //nlapiLogExecution("ERROR", "mensaje", "debitCredit");
                                continue;
                            }

                            var accountCredit = jsonCT[j]['credit'];
                            var accountDebit = jsonCT[j]['debit'];
                            if (!book.isPrimary()) {
                                accountDebit = devolverCuenta(accountDebit, book.getId());
                                accountCredit = devolverCuenta(accountCredit, book.getId());
                            }

                            var newLineCredit = customLines.addNewLine();
                            var newLineDebit = customLines.addNewLine();



                            newLineDebit.setDebitAmount(parseFloat(montoDebit));
                            newLineDebit.setAccountId(parseFloat(accountDebit));
                            newLineDebit.setMemo(memo);
                            newLineDebit.setEntityId(parseInt(entity));
                            if (departmentLine != '' && departmentLine != null) {
                                newLineDebit.setDepartmentId(parseInt(departmentLine));
                            }
                            if (classLine != '' && classLine != null) {
                                newLineDebit.setClassId(parseInt(classLine));
                            }
                            if (locationLine != '' && locationLine != null) {
                                newLineDebit.setLocationId(parseInt(locationLine));
                            }

                            newLineCredit.setCreditAmount(parseFloat(montoCredit));
                            newLineCredit.setAccountId(parseFloat(accountCredit));
                            newLineCredit.setMemo(memo);
                            newLineCredit.setEntityId(parseInt(entity));
                            if (departmentLine != '' && departmentLine != null) {
                                newLineCredit.setDepartmentId(parseInt(departmentLine));
                            }
                            if (classLine != '' && classLine != null) {
                                newLineCredit.setClassId(parseInt(classLine));
                            }
                            if (locationLine != '' && locationLine != null) {
                                newLineCredit.setLocationId(parseInt(locationLine));
                            }

                            // Linea de Revaluacion de Moneda
                            if (revaluacionMoneda > 0) {
                                //Cuenta dependiendo del libro contable
                                var accountDeficit = jsonCT[j]['deficit'];
                                var accountEarning = jsonCT[j]['earning'];
                                if (!book.isPrimary()) {
                                    accountDeficit = devolverCuenta(accountDeficit, book.getId());
                                    accountEarning = devolverCuenta(accountEarning, book.getId());
                                }

                                var memoRevaluation = '';
                                if (featureLang == 'es') {
                                    memoRevaluation = jsonMXIVA[lineID]['databycode'][j]['name'] + ' - Revaluacion de Moneda (Doc: ' + tranid + ')';
                                } else {
                                    memoRevaluation = jsonMXIVA[lineID]['databycode'][j]['name'] + ' - Currency Revaluation (Doc: ' + tranid + ')';
                                }

                                if (parseFloat(montoDebit) > parseFloat(montoCredit)) { // Credito Total es Menor que el Debito Total
                                    var newLineCredit = customLines.addNewLine();
                                    newLineCredit.setCreditAmount(parseFloat(revaluacionMoneda));
                                    newLineCredit.setAccountId(parseFloat(accountDeficit));
                                    newLineCredit.setMemo(memoRevaluation);
                                    if (departmentLine != '' && departmentLine != null) {
                                        newLineCredit.setDepartmentId(parseInt(departmentLine));
                                    }
                                    if (classLine != '' && classLine != null) {
                                        newLineCredit.setClassId(parseInt(classLine));
                                    }
                                    if (locationLine != '' && locationLine != null) {
                                        newLineCredit.setLocationId(parseInt(locationLine));
                                    }
                                    newLineCredit.setEntityId(parseInt(entity));
                                } else { // Credito Total es Mayor que el Debito Total

                                    var newLineDebit = customLines.addNewLine();
                                    newLineDebit.setDebitAmount(parseFloat(revaluacionMoneda));
                                    newLineDebit.setAccountId(parseFloat(accountEarning));
                                    newLineDebit.setMemo(memoRevaluation);
                                    if (departmentLine != '' && departmentLine != null) {
                                        newLineDebit.setDepartmentId(parseInt(departmentLine));
                                    }
                                    if (classLine != '' && classLine != null) {
                                        newLineDebit.setClassId(parseInt(classLine));
                                    }
                                    if (locationLine != '' && locationLine != null) {
                                        newLineDebit.setLocationId(parseInt(locationLine));
                                    }
                                    newLineDebit.setEntityId(parseInt(entity));
                                }
                            }

                        }

                    }

                }
                //nlapiLogExecution('DEBUG', 'Mensaje', 'correcto');
            }

        } else {
            return true;
        }

        var usageRemaining = objContext.getRemainingUsage();
        nlapiLogExecution("DEBUG", "Uso de memoria", usageRemaining);


    } catch (err) {
        nlapiLogExecution('ERROR', 'customizeGlImpact', err + " LINE : " + err.lineNumber);
        sendemail(' [ customizeGlImpact ] ' + err, LMRY_script);
    }
}

function tipoCambioMB(transactionRecordAux, book, ivaMB, exchange, flow) {

    try {

        var exchangeRate_mb = 1;

        if (book.isPrimary()) {
            exchangeRate_mb = exchange;
        } else {

            var bookId = book.getId();

            //TRANSACTION RECORD DEL MISMO SCRIPT
            if (flow == '0') {
                var bookId = book.getId();
                if (transactionRecordAux.getRecordType().toLowerCase() == 'vendorprepaymentapplication') {
                    transactionRecordAux = nlapiLoadRecord('vendorprepayment', transactionRecordAux.getFieldValue("vendorprepayment"));
                }
                for (var line = 1; line <= transactionRecordAux.getLineItemCount('accountingbookdetail'); line++) {
                    if (bookId == transactionRecordAux.getLineItemValue('accountingbookdetail', 'bookid', line)) {
                        exchangeRate_mb = transactionRecordAux.getLineItemValue('accountingbookdetail', 'exchangerate', line);
                        //nlapiLogExecution('ERROR', 'exchangeRate_mb2', exchangeRate_mb);
                        break;
                    }
                }

            } else {
                //NUEVO: JSON DE BUSQUEDA MULTIBOOKING
                for (var line = 0; line < transactionRecordAux.length; line++) {
                    if (bookId == transactionRecordAux[line]['bookid']) {
                        exchangeRate_mb = transactionRecordAux[line]['exchangerate'];
                        break;
                    }
                }

            }

        }

        if (exchangeRate_mb == '' || exchangeRate_mb == null) {
            exchangeRate_mb = 1;
        }
        ivaMB = ivaMB * parseFloat(exchangeRate_mb);
        ivaMB = parseFloat(Math.round(parseFloat(ivaMB) * 100) / 100);


    } catch (err) {
        nlapiLogExecution('ERROR', 'tipoCambioMB', err);
        //sendemail(' [ tipoCambioMB ] ' + err, LMRY_script);
        throw ' [ tipoCambioMB ] ' + err;
    }

    return ivaMB;
}

function devolverCuentaGlobal() {
    var filtros_gam = [];
    filtros_gam[0] = new nlobjSearchFilter('effectivedate', null, 'onorbefore', fecha);
    if (featureSubs) {
        filtros_gam[1] = new nlobjSearchFilter('subsidiary', null, 'anyof', subsidiary);
    }

    var columnas_gam = [];
    columnas_gam[0] = new nlobjSearchColumn("internalid");
    columnas_gam[1] = new nlobjSearchColumn("destinationaccount");
    columnas_gam[2] = new nlobjSearchColumn("enddate");
    columnas_gam[3] = new nlobjSearchColumn("sourceaccount");
    columnas_gam[4] = new nlobjSearchColumn("accountingbook");

    var search_gam = nlapiCreateSearch('globalaccountmapping', filtros_gam, columnas_gam);
    var result_gam = search_gam.runSearch().getResults(0, 1000);

    for (var m = 0; m < result_gam.length; m++) {
        var fechaFinAcc = result_gam[m].getValue("enddate");
        var sourceAccount = result_gam[m].getValue("sourceaccount");
        var currentBook = result_gam[m].getValue("accountingbook");

        if (fechaFinAcc == '' || fechaFinAcc == null) {
            jsonGlobalAM[sourceAccount + ";" + currentBook] = result_gam[m].getValue('destinationaccount');
        } else {
            if (yyymmdd(fecha) <= yyymmdd(fechaFinAcc)) {
                jsonGlobalAM[sourceAccount + ";" + currentBook] = result_gam[m].getValue('destinationaccount');
            }
        }
    }


}

function devolverCuenta(cuentaSource, currentBook) {

    try {

        if (jsonGlobalAM[cuentaSource + ";" + currentBook] != null && jsonGlobalAM[cuentaSource + ";" + currentBook] != undefined) {
            return jsonGlobalAM[cuentaSource + ";" + currentBook];
        } else {
            return cuentaSource;
        }

    } catch (err) {
        nlapiLogExecution('ERROR', 'devolverCuenta', err);
        //sendemail(' [ devolverCuenta ] ' + err, LMRY_script);
        throw ' [ devolverCuenta ] ' + err;
    }
}

function elegirSegmentacion(valor1, valor2, tipo) {
    try {
        if (valor1 != '' && valor1 != null) {
            return valor1;
        } else {
            if (valor2 != '' && valor2 != null) {
                return valor2;
            }
        }
    } catch (err) {
        //sendemail(' [ elegirSegmentacion ] ' + err, LMRY_script);
        nlapiLogExecution('ERROR', 'elegirSegmentacion', err);
        throw ' [ elegirSegmentacion ] ' + err;
    }
    return '';
}

/***********************************************
 * Funcion que da formato al campo fecha YYMMDD
 * Parámetros :
 *      date : fecha
 **********************************************/
function yyymmdd(dateString) {

    if (dateString == '' || dateString == null) {
        return '';
    }

    var date = new Date(dateString);

    var year = date.getFullYear();

    var month = "" + (date.getMonth() + 1);

    if (month.length < 2)
        month = "0" + month;

    var date = "" + date.getDate();
    if (date.length < 2)
        date = "0" + date;

    var fe = '' + year + "" + month + "" + date;

    return fe;
}