search.lookupFields({
  type: search.Type.ITEM_RECEIPT ,
  id: "4252900",
  columns: [
      'subsidiary',
      'createdfrom',
      'trandate',
      "transferlocation"
  ]
});

search.lookupFields({
  type: 'transaction',
  id: "4253212",
  columns: ['type','location']
});