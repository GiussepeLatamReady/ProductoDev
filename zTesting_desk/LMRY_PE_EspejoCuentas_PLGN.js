/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       22 April 2022     LatamReady
 * File : LMRY_PE_EspejoCuentas_PLGN.js
 */
var objContext = nlapiGetContext();

var LMRY_script = 'LatamReady - PE Espejo Cuentas 6-9';
var featureMB = objContext.getFeature('MULTIBOOK');
var featureOW = objContext.getFeature('SUBSIDIARIES');
var featureDep = objContext.getSetting('FEATURE', 'DEPARTMENTS');
var featureCla = objContext.getSetting('FEATURE', 'CLASSES');
var featureLoc = objContext.getSetting('FEATURE', 'LOCATIONS');


function customizeGlImpact(transactionRecord, standardLines, customLines, book) {

    try {

        if (featureOW) {
            var country = transactionRecord.getFieldText("custbody_lmry_subsidiary_country");
            var subsidiaria = transactionRecord.getFieldValue('subsidiary');
        } else {
            //load Netsuite configuration page
            var companyInfo = nlapiLoadConfiguration('companyinformation');
            //get field values
            var country = companyInfo.getFieldText('country');
            var subsidiaria = 1
        }
        country = validarAcentos(country);
        country = country.substring(0, 3).toUpperCase();

        var type = transactionRecord.getRecordType();
        type = type.toLowerCase();

       // var subsidiaria = transactionRecord.getFieldValue('subsidiary');
        var licenses = getLicenses(subsidiaria);
        var typeTransaction = ['vendorbill', 'journalentry', 'customerpayment', 'expensereport', 'check', 'deposit', 'vendorcredit','itemreceipt','itemfulfillment'];

        nlapiLogExecution('DEBUG', 'Feature', getAuthorization(500, licenses));

        if (getAuthorization(500, licenses) == false || country != 'PER' || typeTransaction.indexOf(type) == -1) {
            return true;
        }

        var filterDepartment = getAuthorization(864, licenses);

        if (filterDepartment == true && (featureDep == 'F' || featureDep == false)) {
            return true;
        }

        // SOLO PARA JOURNAL
        if (type == 'journalentry') {
            var cargaInicial = transactionRecord.getFieldValue('custbody_lmry_carga_inicial');
            if (cargaInicial == true || cargaInicial == 'T') {
                return true;
            }
        }

        if(type == 'itemfulfillment'){
           typefrom =  transactionRecord.getFieldValue('ordertype');
           if(typefrom != 'VendAuth' && typefrom != 'TrnfrOrd')  return true;
        }
       
        var jsonCuentas = {};
        var jsonAccounting = {};

        var filtrosCuentas = [];
        filtrosCuentas[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
        filtrosCuentas[1] = new nlobjSearchFilter('custrecord_lmry_pe_espejo_subsidiary', null, 'is', subsidiaria);
        //filtrosCuentas[2] = new nlobjSearchFilter ('isinactive',null,'is','F');

        var columnasCuentas = [];
        columnasCuentas[0] = new nlobjSearchColumn('internalid');
        columnasCuentas[1] = new nlobjSearchColumn('custrecord_lmry_pe_espejo_sourceacc');
        columnasCuentas[2] = new nlobjSearchColumn('custrecord_lmry_pe_espejo_debitacc');
        columnasCuentas[3] = new nlobjSearchColumn('custrecord_lmry_pe_espejo_creditacc');
        columnasCuentas[4] = new nlobjSearchColumn('custrecord_lmry_pe_espejo_department');
        columnasCuentas[5] = new nlobjSearchColumn('custrecord_lmry_pe_espejo_class');
        columnasCuentas[6] = new nlobjSearchColumn('custrecord_lmry_pe_espejo_location');
        //columnasCuentas[7] = new nlobjSearchColumn('custrecord_lmry_pe_espejo_groupamounts');

        var searchCuentas = nlapiCreateSearch("customrecord_lmry_pe_espejo_cuentas", filtrosCuentas, columnasCuentas);
        searchCuentas = searchCuentas.runSearch();
        var iteratorCount = 0;
        var iteratorCondition = false;

        while (!iteratorCondition) {
            var resultCuentas = searchCuentas.getResults(iteratorCount, iteratorCount + 1000);
            if (resultCuentas != null && resultCuentas.length > 0) {
                for (var i = 0; i < resultCuentas.length; i++) {
                    var sourceAccount = resultCuentas[i].getValue('custrecord_lmry_pe_espejo_sourceacc');
                    if (filterDepartment) {
                        var department = resultCuentas[i].getValue('custrecord_lmry_pe_espejo_department');
                        jsonCuentas[sourceAccount + ";" + department] = {
                            'debit': resultCuentas[i].getValue('custrecord_lmry_pe_espejo_debitacc'), 'credit': resultCuentas[i].getValue('custrecord_lmry_pe_espejo_creditacc'),
                            'department': resultCuentas[i].getValue('custrecord_lmry_pe_espejo_department'), 'class': resultCuentas[i].getValue('custrecord_lmry_pe_espejo_class'), 'location': resultCuentas[i].getValue('custrecord_lmry_pe_espejo_location')
                        };
                    } else {
                        jsonCuentas[sourceAccount] = {
                            'debit': resultCuentas[i].getValue('custrecord_lmry_pe_espejo_debitacc'), 'credit': resultCuentas[i].getValue('custrecord_lmry_pe_espejo_creditacc'),
                            'department': resultCuentas[i].getValue('custrecord_lmry_pe_espejo_department'), 'class': resultCuentas[i].getValue('custrecord_lmry_pe_espejo_class'), 'location': resultCuentas[i].getValue('custrecord_lmry_pe_espejo_location')
                        };
                    }
                }

            } else {
                iteratorCondition = true;
            }
            if (iteratorCondition) {
                break;
            } else {
                iteratorCount += 1000;
            }
        }
        //json para almacenar los articulos
        var JsonItems = {};
        nlapiLogExecution('ERROR','jsonCuentas',JSON.stringify(jsonCuentas));
        if (featureMB == true || featureMB == 'T') {
            //BUSQUEDA POR INTERFAZ: MULTIBOOKING
            var searchAccounting = nlapiLoadSearch('accountingtransaction', 'customsearch_lmry_pe_espejocuentas');
            searchAccounting.addFilter(new nlobjSearchFilter('internalid', null, 'is', transactionRecord.getId()));

            if (featureDep == 'T' || featureDep == true) {
                searchAccounting.addColumn(new nlobjSearchColumn('department', 'transaction'));
            }
            if (featureCla == 'T' || featureCla == true) {
                searchAccounting.addColumn(new nlobjSearchColumn('class', 'transaction'));
            }
            if (featureLoc == 'T' || featureLoc == true) {
                searchAccounting.addColumn(new nlobjSearchColumn('location', 'transaction'));
            }
            if (type == 'vendorbill'){
               searchAccounting.addColumn(new nlobjSearchColumn('item', 'transaction'));
            }
            iteratorCount = 0;
            iteratorCondition = false;

            searchAccounting = searchAccounting.runSearch();
            while (!iteratorCondition) {
                var resultAccounting = searchAccounting.getResults(iteratorCount, iteratorCount + 1000);

                if (resultAccounting != null && resultAccounting.length > 0) {
                    var columnas = resultAccounting[0].getAllColumns();
                    for (var i = 0; i < resultAccounting.length; i++) {
                        var libro = resultAccounting[i].getValue('accountingbook');
                        var cuenta = resultAccounting[i].getValue('account');
                        var departmentLinea = '';//resultAccounting[i].getValue(columnas[4]);
                        var classLinea = '';//resultAccounting[i].getValue(columnas[5]);
                        var locationLinea = '';//resultAccounting[i].getValue(columnas[6]);
                        var memoLinea = resultAccounting[i].getValue('memo', 'transaction');
                        var item = '';
                        if (featureDep == 'T' || featureDep == true) {
                            departmentLinea = resultAccounting[i].getValue('department', 'transaction');
                            if (type == 'deposit' && (departmentLinea == "" || departmentLinea == null)) {
                                var deparmentCabecera = transactionRecord.getFieldValue('department');
                                departmentLinea = deparmentCabecera;
                            }
                        }
                        if (featureCla == 'T' || featureCla == true) {
                            classLinea = resultAccounting[i].getValue('class', 'transaction');
                        }
                        if (featureLoc == 'T' || featureLoc == true) {
                            locationLinea = resultAccounting[i].getValue('location', 'transaction');
                        }
                         
                        if(type == 'vendorbill'){
                           item =   resultAccounting[i].getValue('item', 'transaction');
                           if(item && !JsonItems[item]) JsonItems[item] = item;
                        }

                        var amount = 0;
                        var columna = '';

                        if (resultAccounting[i].getValue('debitamount') != null && resultAccounting[i].getValue('debitamount') != '') {
                            amount = resultAccounting[i].getValue('debitamount');
                            columna = 'debit';
                        } else {
                            amount = resultAccounting[i].getValue('creditamount');
                            columna = 'credit';
                        }

                        if (filterDepartment) {
                            if (jsonCuentas[cuenta + ";" + departmentLinea] != null && jsonCuentas[cuenta + ";" + departmentLinea] != undefined) {
                                if (jsonAccounting[libro + ";" + cuenta + ";" + departmentLinea] == null || jsonAccounting[libro + ";" + cuenta + ";" + departmentLinea] == undefined) {
                                    jsonAccounting[libro + ";" + cuenta + ";" + departmentLinea] = [];
                                }

                                jsonAccounting[libro + ";" + cuenta + ";" + departmentLinea].push({ 'columna': columna, 'amount': amount, 'department': departmentLinea, 'class': classLinea, 'location': locationLinea, 'memo': memoLinea,'item':  item });
                                //var contador = Object.keys(jsonAccounting[libro + ";" + cuenta]).length;

                            } else {
                                if (jsonCuentas[cuenta + ";"] != null && jsonCuentas[cuenta + ";"] != undefined) {
                                    if (jsonAccounting[libro + ";" + cuenta + ";"] == null || jsonAccounting[libro + ";" + cuenta + ";"] == undefined) {
                                        jsonAccounting[libro + ";" + cuenta + ";"] = [];
                                    }
                                    jsonAccounting[libro + ";" + cuenta + ";"].push({ 'columna': columna, 'amount': amount, 'department': departmentLinea, 'class': classLinea, 'location': locationLinea, 'memo': memoLinea ,'item':  item });
                                }
                            }
                        } else {
                            if (jsonCuentas[cuenta] != null && jsonCuentas[cuenta] != undefined) {
                                if (jsonAccounting[libro + ";" + cuenta] == null || jsonAccounting[libro + ";" + cuenta] == undefined) {
                                    jsonAccounting[libro + ";" + cuenta] = [];
                                }

                                jsonAccounting[libro + ";" + cuenta].push({ 'columna': columna, 'amount': amount, 'department': departmentLinea, 'class': classLinea, 'location': locationLinea, 'memo': memoLinea ,'item':  item});
                                //var contador = Object.keys(jsonAccounting[libro + ";" + cuenta]).length;

                            }
                        }


                    }
                } else {
                    iteratorCondition = true;
                }

                if (iteratorCondition) {
                    break;
                } else {
                    iteratorCount += 1000;
                }
            }
        } else {

            var searchAccounting = nlapiLoadSearch('transaction', 'customsearch_lmry_pe_espejocuentas_sinmb');
            searchAccounting.addFilter(new nlobjSearchFilter('internalid', null, 'is', transactionRecord.getId()));

            if (featureDep == 'T' || featureDep == true) {
                searchAccounting.addColumn(new nlobjSearchColumn('department'));
            }
            if (featureCla == 'T' || featureCla == true) {
                searchAccounting.addColumn(new nlobjSearchColumn('class'));
            }
            if (featureLoc == 'T' || featureLoc == true) {
                searchAccounting.addColumn(new nlobjSearchColumn('location'));
            }
            if (type == 'vendorbill'){
               searchAccounting.addColumn(new nlobjSearchColumn('item'));
            }
            iteratorCount = 0;
            iteratorCondition = false;

            searchAccounting = searchAccounting.runSearch();
            while (!iteratorCondition) {
                var resultTran = searchAccounting.getResults(iteratorCount, iteratorCount + 1000);

                if (resultTran != null && resultTran.length > 0) {
                    for (var i = 0; i < resultTran.length; i++) {
                        var cuenta = resultTran[i].getValue('account');
                        var departmentLinea = '';
                        var classLinea = '';
                        var locationLinea = '';
                        if (featureDep == 'T' || featureDep == true) {
                            departmentLinea = resultTran[i].getValue('department');
                            if (type == 'deposit' && (departmentLinea == "" || departmentLinea == null)) {
                                var deparmentCabecera = transactionRecord.getFieldValue('department');
                                departmentLinea = deparmentCabecera;
                            }
                        }
                        if (featureCla == 'T' || featureCla == true) {
                            classLinea = resultTran[i].getValue('class');
                        }
                        if (featureLoc == 'T' || featureLoc == true) {
                            locationLinea = resultTran[i].getValue('location');
                        }
                        var memoLinea = resultTran[i].getValue('memo');
                        var amount = 0;
                        var columna = '';

                        if (resultTran[i].getValue('debitamount') != null && resultTran[i].getValue('debitamount') != '') {
                            amount = resultTran[i].getValue('debitamount');
                            columna = 'debit';
                        } else {
                            amount = resultTran[i].getValue('creditamount');
                            columna = 'credit';
                        }
                        if(type == 'vendorbill'){
                           item =   resultTran[i].getValue('item');
                           if(item && !JsonItems[item]) JsonItems[item] = item;
                        }
                        if (filterDepartment) {
                            if (jsonCuentas[cuenta + ";" + departmentLinea] != null && jsonCuentas[cuenta + ";" + departmentLinea] != undefined) {
                                if (jsonAccounting[1 + ";" + cuenta + ";" + departmentLinea] == null || jsonAccounting[1 + ";" + cuenta + ";" + departmentLinea] == undefined) {
                                    jsonAccounting[1 + ";" + cuenta + ";" + departmentLinea] = [];
                                }

                                jsonAccounting[1 + ";" + cuenta + ";" + departmentLinea].push({ 'columna': columna, 'amount': amount, 'department': departmentLinea, 'class': classLinea, 'location': locationLinea, 'memo': memoLinea ,'item':  item });
                                //var contador = Object.keys(jsonAccounting[libro + ";" + cuenta]).length;

                            } else {
                                if (jsonCuentas[cuenta + ";"] != null && jsonCuentas[cuenta + ";"] != undefined) {
                                    if (jsonAccounting[1 + ";" + cuenta + ";"] == null || jsonAccounting[1 + ";" + cuenta + ";"] == undefined) {
                                        jsonAccounting[1 + ";" + cuenta + ";"] = [];
                                    }
                                    jsonAccounting[1 + ";" + cuenta + ";"].push({ 'columna': columna, 'amount': amount, 'department': departmentLinea, 'class': classLinea, 'location': locationLinea, 'memo': memoLinea  ,'item':  item});
                                }
                            }
                        } else {
                            if (jsonCuentas[cuenta] != null && jsonCuentas[cuenta] != undefined) {
                                if (jsonAccounting[1 + ";" + cuenta] == null || jsonAccounting[1 + ";" + cuenta] == undefined) {
                                    jsonAccounting[1 + ";" + cuenta] = [];
                                }

                                jsonAccounting[1 + ";" + cuenta].push({ 'columna': columna, 'amount': amount, 'department': departmentLinea, 'class': classLinea, 'location': locationLinea, 'memo': memoLinea ,'item':  item });
                                //var contador = Object.keys(jsonAccounting[libro + ";" + cuenta]).length;

                            }
                        }

                    }
                } else {
                    iteratorCondition = true;
                }

                if (iteratorCondition) {
                    break;
                } else {
                    iteratorCount += 1000;
                }
            }
        }
        nlapiLogExecution('ERROR','jsonAccounting gap',JSON.stringify(jsonAccounting));
        nlapiLogExecution('ERROR','JsonItems gap',JSON.stringify(JsonItems));
        //se inicializa denuevo le json de items
        JsonItem = {}
        //se hace una busqueda para saber que articulos deberia de aparecer
        if(Object.keys(JsonItems).length && transactionRecord.getFieldValue('ordertype') == 'PurchOrd'){
           var items = Object.keys(JsonItems)
           var cantidad = Math.ceil(items.length/1000);
           for(var i = 0; i <cantidad; i++){
               Arraux =  items.slice(1000*(i),1000*(i+1));
               var filters = [
                   ["internalid","anyof",Arraux], 
                   "AND", 
                   [[["generateaccruals","is","T"],"AND",["type","anyof","Service"]],"OR",[["type","anyof","InvtPart","Group","Kit","Assembly"]]]
                ]
               
               var columns = [];
               columns[0] =  new nlobjSearchColumn("internalid")
               var serviceitemSearch = nlapiSearchRecord("item",null,filters,columns);
               for ( var i = 0; serviceitemSearch != null && i < serviceitemSearch.length; i++ ){
                   var searchresult = serviceitemSearch[i];
                   id =  searchresult.getValue('internalid')
                   if(!JsonItem[id])  JsonItem[id] = true;
               }
           }
        }
        
        nlapiLogExecution("DEBUG", "JsonItem", JsonItem);
        nlapiLogExecution("DEBUG", "jsonAccounting", jsonAccounting);

        //MANDATORY SEGMENTACION
        var currentBook = book.getId();
        var mandatoryDepartment = nlapiGetContext().getPreference('DEPTMANDATORY');
        var mandatoryClass = nlapiGetContext().getPreference('CLASSMANDATORY');
        var mandatoryLocation = nlapiGetContext().getPreference('LOCMANDATORY');

        //nlapiLogExecution("ERROR","mandatorySegmentacion",mandatoryDepartment + "-" + mandatoryClass + "-" + mandatoryLocation);

        //CREADO DE LINEAS GL
        for (var i in jsonCuentas) {
            if (jsonAccounting[currentBook + ";" + i] != null && jsonAccounting[currentBook + ";" + i] != undefined ) {
               
                for (var j = 0; j < jsonAccounting[currentBook + ";" + i].length; j++) {

                    if ((mandatoryDepartment == true || mandatoryDepartment == 'T') && (jsonAccounting[currentBook + ";" + i][j]['department'] == '' || jsonAccounting[currentBook + ";" + i][j]['department'] == null) && (jsonCuentas[i]['department'] == '' || jsonCuentas[i]['department'] == null)) {
                        continue;
                    }

                    if ((mandatoryClass == true || mandatoryClass == 'T') && (jsonAccounting[currentBook + ";" + i][j]['class'] == '' || jsonAccounting[currentBook + ";" + i][j]['class'] == null) && (jsonCuentas[i]['class'] == '' || jsonCuentas[i]['class'] == null)) {
                        continue;
                    }

                    if ((mandatoryLocation == true || mandatoryLocation == 'T') && (jsonAccounting[currentBook + ";" + i][j]['location'] == '' || jsonAccounting[currentBook + ";" + i][j]['location'] == null) && (jsonCuentas[i]['location'] == '' || jsonCuentas[i]['location'] == null)) {
                        continue;
                    }

                    if (!jsonAccounting[currentBook + ";" + i][j]['amount']) {
                        continue;
                    }
                    //se comprueba si existe el item de la linea en el json de articulos con el devengo activado
                    if(JsonItem[jsonAccounting[currentBook + ";" + i][j]["item"]])  continue;

                    var newLineDebit = '', newLineCredit = '';

                    if (jsonAccounting[currentBook + ";" + i][j]['columna'] == 'debit') {
                        newLineDebit = customLines.addNewLine();
                        newLineCredit = customLines.addNewLine();

                        newLineDebit.setAccountId(parseFloat(jsonCuentas[i]['debit']));
                        newLineCredit.setAccountId(parseFloat(jsonCuentas[i]['credit']));
                    } else {
                        newLineCredit = customLines.addNewLine();
                        newLineDebit = customLines.addNewLine();

                        newLineCredit.setAccountId(parseFloat(jsonCuentas[i]['debit']));
                        newLineDebit.setAccountId(parseFloat(jsonCuentas[i]['credit']));
                    }

                    newLineDebit.setDebitAmount(parseFloat(jsonAccounting[currentBook + ";" + i][j]['amount']));
                    newLineCredit.setCreditAmount(parseFloat(jsonAccounting[currentBook + ";" + i][j]['amount']));

                    var customDepartment = jsonAccounting[currentBook + ";" + i][j]['department'];
                    var customClass = jsonAccounting[currentBook + ";" + i][j]['class'];
                    var customLocation = jsonAccounting[currentBook + ";" + i][j]['location'];
                    var customMemo = jsonAccounting[currentBook + ";" + i][j]['memo'];

                    if ((mandatoryDepartment == true || mandatoryDepartment == 'T') && !customDepartment) {
                        customDepartment = jsonCuentas[i]['department'];
                    }

                    if ((mandatoryClass == true || mandatoryClass == 'T') && !customClass) {
                        customClass = jsonCuentas[i]['class'];
                    }

                    if ((mandatoryLocation == true || mandatoryLocation == 'T') && !customLocation) {
                        customLocation = jsonCuentas[i]['location'];
                    }

                    if (customDepartment) {
                        newLineDebit.setDepartmentId(parseFloat(customDepartment));
                        newLineCredit.setDepartmentId(parseFloat(customDepartment));
                    }

                    if (customClass) {
                        newLineDebit.setClassId(parseFloat(customClass));
                        newLineCredit.setClassId(parseFloat(customClass));
                    }

                    if (customLocation) {
                        newLineDebit.setLocationId(parseFloat(customLocation));
                        newLineCredit.setLocationId(parseFloat(customLocation));
                    }

                    /*if(customMemo){
                      newLineDebit.setMemo(customMemo);
                      newLineCredit.setMemo(customMemo);
                    }*/


                }


            }
        }

        var usageRemaining = objContext.getRemainingUsage();
        nlapiLogExecution("DEBUG", "Uso de memoria", usageRemaining);

    } catch (err) {
        nlapiLogExecution('Error', 'Error', err);
        sendemail(' [ customizeGlImpact ] ' + err, LMRY_script);
    }

}



function validarAcentos(s) {
    var AccChars = "ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ&°–—ªº·";
    var RegChars = "SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyyo--ao.";

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