

var country = [];
var filters = new Array();
filters[0] = search.createFilter({
    name: 'internalid',
    operator: search.Operator.ANYOF,
    values: ["6"]
});
var columns = new Array();
columns[0] = search.createColumn({
    name: 'country'
});

var getfields = search.create({
    type: 'subsidiary',
    columns: columns,
    filters: filters
});
getfields = getfields.run().getRange(0, 1000);

if (getfields != '' && getfields != null) {
    country[0] = getfields[0].getValue('country');
    country[1] = getfields[0].getText('country');
}
console.log("country:", country)