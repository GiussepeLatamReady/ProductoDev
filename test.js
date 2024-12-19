const getQuantityItems = (idRecord) => {

  const quantityItem = {}
  const recordObj = record.load({
    type: "inventoryadjustment",
    id: idRecord,
    isDynamic: true,
  });
  
  const itemCount = recordObj.getLineCount({
    sublistId: 'inventory'
  });

  for (let i = 0; i < itemCount; i++) {

    const item = recordObj.getSublistValue({
      sublistId: 'inventory',
      fieldId: 'item',
      line: i
    });

    const quantity = recordObj.getSublistValue({
      sublistId: 'inventory',
      fieldId: 'adjustqtyby',
      line: i
    });

    quantityItem[item] = Number(quantity);

  }
  return quantityItem;
}

getQuantityItems("4279912")