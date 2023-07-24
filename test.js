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
if (type == 'vendorbill') {
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

      if (type == 'vendorbill') {
        item = resultAccounting[i].getValue('item', 'transaction');
        if (item && !JsonItems[item]) JsonItems[item] = item;
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

          jsonAccounting[libro + ";" + cuenta + ";" + departmentLinea].push({ 'columna': columna, 'amount': amount, 'department': departmentLinea, 'class': classLinea, 'location': locationLinea, 'memo': memoLinea, 'item': item });
          //var contador = Object.keys(jsonAccounting[libro + ";" + cuenta]).length;

        } else {
          if (jsonCuentas[cuenta + ";"] != null && jsonCuentas[cuenta + ";"] != undefined) {
            if (jsonAccounting[libro + ";" + cuenta + ";"] == null || jsonAccounting[libro + ";" + cuenta + ";"] == undefined) {
              jsonAccounting[libro + ";" + cuenta + ";"] = [];
            }
            jsonAccounting[libro + ";" + cuenta + ";"].push({ 'columna': columna, 'amount': amount, 'department': departmentLinea, 'class': classLinea, 'location': locationLinea, 'memo': memoLinea, 'item': item });
          }
        }
      } else {
        if (jsonCuentas[cuenta] != null && jsonCuentas[cuenta] != undefined) {
          if (jsonAccounting[libro + ";" + cuenta] == null || jsonAccounting[libro + ";" + cuenta] == undefined) {
            jsonAccounting[libro + ";" + cuenta] = [];
          }

          jsonAccounting[libro + ";" + cuenta].push({ 'columna': columna, 'amount': amount, 'department': departmentLinea, 'class': classLinea, 'location': locationLinea, 'memo': memoLinea, 'item': item });
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