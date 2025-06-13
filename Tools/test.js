var entity = {};
var columns = [];
columns.push(search.createColumn({ name: 'formulatext', formula: '{altname}' }));
columns.push(search.createColumn({ name: 'formulatext', formula: '{subsidiary}' }));
columns.push(search.createColumn({ name: 'formulatext', formula: '{type.id}' }));
search.create({
    type: "entity",
    filters: [
        ["isinactive", "is", "F"],
        "AND",
        ["internalid", "anyof", "2275"]
    ],
    columns,
}).run().each(result => {
    const get = (i) => result.getValue(result.columns[i]);
    const altname = get(0);
    const subsidiary = get(1);
    entity = {
        internalid: result.id,
        "name": altname || result.id,
        subsidiary,
        type: get(2)
    }
});

console.log("entity:", entity)