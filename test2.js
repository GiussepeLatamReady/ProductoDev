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
if (type == 'vendorbill') {
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
            if (type == 'vendorbill') {
                item = resultTran[i].getValue('item');
                if (item && !JsonItems[item]) JsonItems[item] = item;
            }
            if (filterDepartment) {
                if (jsonCuentas[cuenta + ";" + departmentLinea] != null && jsonCuentas[cuenta + ";" + departmentLinea] != undefined) {
                    if (jsonAccounting[1 + ";" + cuenta + ";" + departmentLinea] == null || jsonAccounting[1 + ";" + cuenta + ";" + departmentLinea] == undefined) {
                        jsonAccounting[1 + ";" + cuenta + ";" + departmentLinea] = [];
                    }

                    jsonAccounting[1 + ";" + cuenta + ";" + departmentLinea].push({ 'columna': columna, 'amount': amount, 'department': departmentLinea, 'class': classLinea, 'location': locationLinea, 'memo': memoLinea, 'item': item });
                    //var contador = Object.keys(jsonAccounting[libro + ";" + cuenta]).length;

                } else {
                    if (jsonCuentas[cuenta + ";"] != null && jsonCuentas[cuenta + ";"] != undefined) {
                        if (jsonAccounting[1 + ";" + cuenta + ";"] == null || jsonAccounting[1 + ";" + cuenta + ";"] == undefined) {
                            jsonAccounting[1 + ";" + cuenta + ";"] = [];
                        }
                        jsonAccounting[1 + ";" + cuenta + ";"].push({ 'columna': columna, 'amount': amount, 'department': departmentLinea, 'class': classLinea, 'location': locationLinea, 'memo': memoLinea, 'item': item });
                    }
                }
            } else {
                if (jsonCuentas[cuenta] != null && jsonCuentas[cuenta] != undefined) {
                    if (jsonAccounting[1 + ";" + cuenta] == null || jsonAccounting[1 + ";" + cuenta] == undefined) {
                        jsonAccounting[1 + ";" + cuenta] = [];
                    }

                    jsonAccounting[1 + ";" + cuenta].push({ 'columna': columna, 'amount': amount, 'department': departmentLinea, 'class': classLinea, 'location': locationLinea, 'memo': memoLinea, 'item': item });
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