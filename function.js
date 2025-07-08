search.create({
    type: "inventorytransfer",
    columns: [
        'subsidiary',
        'createdfrom',
        'trandate',
        'location',
        'transferlocation',
    ]
}).run().each(function (result) { console.log(result) });