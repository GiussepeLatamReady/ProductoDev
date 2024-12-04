
fxamountremaining

search.create({
  type: 'transaction',
  filters:[["internalid","anyof","4268974"]],
  columns: ['fxamountremaining']
}).run().each(function(row) {

  var saldo = row.getValue('fxamountremaining');

  console.log("saldo :",saldo)

  return false;
});