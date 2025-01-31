{
  "id": 508317,
  "type": "address",
  "isDynamic": false,
  "isReadOnly": true,
  "isNew": false
}

[
  "https://3817209-sb1.app.netsuite.com/app/common/entity/vendor.nl?id=26068&e=T",
  "https://3817209-sb1.app.netsuite.com/app/common/entity/vendor.nl?id=26068&e=T",
  "https://3817209-sb1.app.netsuite.com/app/common/entity/vendor.nl?id=26068&e=T",
  "https://3817209-sb1.app.netsuite.com/app/common/entity/vendor.nl?id=26068",
  "https://3817209-sb1.app.netsuite.com/app/common/entity/vendor.nl?id=26068",
  "https://3817209-sb1.app.netsuite.com/app/common/entity/vendor.nl?id=26068",
  "https://3817209-sb1.app.netsuite.com/app/common/entity/vendor.nl?id=26068",
  "https://3817209-sb1.app.netsuite.com/app/common/entity/vendor.nl?id=26068",
  "https://3817209-sb1.app.netsuite.com/app/common/entity/vendor.nl?id=26068",
  "https://3817209-sb1.app.netsuite.com/app/common/entity/vendor.nl?id=26068",
  "https://3817209-sb1.app.netsuite.com/app/common/entity/vendor.nl?id=26068",
  "https://3817209-sb1.app.netsuite.com/app/common/entity/vendor.nl?id=26068"
]

var busq_setuptax = search.create({
  type: "address",
  columns: [search.createColumn({
    name: "formulatext",
    formula: "{country.id}",
    label: "country"
})],
  filters: ['internalid', 'anyof', "508317"]
}).run().each(function(result){
  console.log("result seach",result)
  console.log("country seach",result.getValue(result.columns[0]))
});

{
  "type": "address",
  "id": -1,
  "filters": [
      {
          "name": "internalid",
          "operator": "anyof",
          "values": [
              "508317"
          ],
          "isor": false,
          "isnot": false,
          "leftparens": 0,
          "rightparens": 0
      }
  ],
  "columns": [
      {
          "name": "country",
          "join": null,
          "summary": null,
          "label": null,
          "type": null,
          "function": null,
          "formula": null,
          "sortdir": "NONE",
          "whenorderedby": null,
          "whenorderedbyjoin": null,
          "whenorderedbyalias": null
      }
  ],
  "settings": null,
  "title": null,
  "scriptId": null,
  "isPublic": false,
  "packageId": null
}

{
  "recordType": "address",
  "id": "508317",
  "values": {
      "country": [
          {
              "value": "Colombia",
              "text": "Colombia"
          }
      ]
  }
}