


function getTest(){
    const arregloPurchaseOrders = [];
    const nLines = currentRecord.getLineCount({
        sublistId: "items"
    });
    for (let index = 0; index < nLines; index++) {
        const idPO = currentRecord.getSublistValue({
            sublistId: "items",
            fieldId: "purchaseorder",
            line: index
        });
    
        if (!arregloPurchaseOrders.includes(idPO))
            arregloPurchaseOrders.push(idPO);
    };
    if (arregloPurchaseOrders.length === 0) {
        alert("Debe ingresar al menos un purchase order");
        throw "Debe ingresar al menos un purchase order";
    };

    console.log("arregloPurchaseOrders: ",arregloPurchaseOrders)
}
getTest()


[
    "1155540",
    "1155541"
]
