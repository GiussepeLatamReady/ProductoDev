const columns = [];
var featSubsidiary = true
columns.push(search.createColumn({ name: 'formulatext', formula: '{altname}' }));
columns.push(search.createColumn({ name: 'formulatext', formula: '{type}' }));
if (featSubsidiary) {
    columns.push(search.createColumn({ name: 'formulatext', formula: '{subsidiary}' }));
}

var filters = [
    ["isinactive", "is", "F"]
]

filters.push("AND",["formulanumeric: {msesubsidiary.internalid}","equalto","10"])

var entity = {};
search.create({
    type: "vendor",
    filters,
    columns,
}).run().each(result => {
    const get = (i) => result.getValue(result.columns[i]);
    const altname = get(0);
    const type = get(1);
    entity = {
        internalid: result.id,
        "name": altname || result.id,
        type
    }
    if (featSubsidiary) {
        entity["subsidiary"] = get(2);
    }
    console.log("entity",entity)
});