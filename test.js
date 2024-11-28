
fxamountremaining

search.create({
  type: 'transaction',
  filters:[["internalid","anyof",]]
  columns: ['fxamountremaining']
}).run().each(function(row) {

  var saldo = row.getValue('fxamountremaining');

  console.log("saldo")

  return true;
});