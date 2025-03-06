const getEntities = () => {
   const entities = []
   search.create({
       type: "entity",
       filters: [
           ["custentity_lmry_subsidiary_country", "is", "48"],
           "AND",
           ["isinactive", "is", "F"]
       ],
       columns: [
           search.createColumn({
               name: "formulatext",
               formula: "CASE WHEN {type} = 'Customer' THEN '' ELSE {firstname}  END"
           }), 
           search.createColumn({
               name: "formulatext",
               formula: "CASE WHEN {type} = 'Customer' THEN ''  ELSE {middlename} END"
           }), 
           "altname",
           search.createColumn({
            name: "formulatext",
            formula: "{type}"
        })
       ],
   }).run().each(result => {
       const get = (i) => result.getValue(result.columns[i]);
       entities.push({
           internalid: result.id,
           "name": `${get(0) || ""} ${get(1) || ""} ${get(2) || ""}`,
           type: get(3)
       })
   })
   return entities
}
getEntities();