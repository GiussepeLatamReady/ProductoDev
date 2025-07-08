const inventoryTransfer = record.load({
  type: "inventorytransfer",
  id: "4350670",
  isDynamic: true,
});

var fromLocation = inventoryTransfer.getValue("location");
var toLocation = inventoryTransfer.getValue("transferlocation");
var subsidiary = inventoryTransfer.getValue("subsidiary");
console.log("toLocation:",toLocation)
console.log("fromLocation:",fromLocation)
console.log("subsidiary:",subsidiary)

const newRecord = record.load({
  id: "5242",
  type: "job"
});

const subsidiary = newRecord.getValue("subsidiary")

