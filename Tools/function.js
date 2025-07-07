search.create({
    type: search.Type.TRANSACTION,
    columns: ['account'],
    filters: [
        {
            name: 'internalid',
            operator: 'anyof',
            values: "1411926"
        }
    ]
}).run().each(result => {
    console.log("account",result.getValue("account"))
});