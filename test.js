function isActiveSubsidiary(recordObj){
    var subsi = recordObj.getValue({
      fieldId: "subsidiary",
    });
    log.error("subsi",subsi)
    var includeChildren= recordObj.getValue({
      fieldId: "includechildren",
    });
    log.error("includeChildren",includeChildren)
    /**
     * afdasdfasdf
     */
    var subsis = search.create({
      type: "subsidiary",
      columns: ["internalid", "country", "isinactive", "parent"]
    }).run().getRange(0, 1000);
    
    var subsisParent = {}; 
    if (subsis && subsis.length) {
      for (var i = 0; i < subsis.length; i++) {
        var parent = subsis[i].getValue("parent");
        var country = subsis[i].getValue("country");
        var id = subsis[i].getValue("internalid");
        var inactive = subsis[i].getValue("isinactive");
        
        subsisParent[id] = {p:parent, c:country, i:inactive};

      }
    }

    var aux = subsi;
    var aux2 = subsi;
    var condition = false;
    while (!condition || !aux.length) {
      aux2 = [];
      for (var id in subsisParent) {
        if (aux.indexOf(id) > -1) {
          if (subsisParent[id].c == "MX" && subsisParent[id].i) {
            condition = true;
            break;
          }
        }
        if (aux.indexOf(subsisParent[id].p) > -1){
          aux2.push(id);
        }
      }
      aux = aux2;
    }
    
    /**
     * 
     */
    var subsidiaryInfo = search.lookupFields({
      type: search.Type.SUBSIDIARY,
      id: subsi,
      columns: ['isinactive','country']
    });
    var isinactive = subsidiaryInfo.isinactive;
    var country = subsidiaryInfo.country[0].value;

    log.error("isinactive",isinactive)
    log.error("country",country)
    if (country == "MX"){
      return isinactive !== "T" && isinactive !== true;
    }else if(includeChildren === "T"|| includeChildren === true){
      var searchOW = search.create({
        type: 'subsidiary',
        columns: [
            'country',
            'isinactive'
        ],
        filters: [
            ['isinactive', 'is', 'F'],
            "AND",
            ['parent', 'anyof', subsi],
            "AND",
            ['country', 'anyof', "MX"],
        ]
      }); 
      return searchOW.runPaged().count;
    }
    
      
  }