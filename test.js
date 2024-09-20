

var subsidiaries = [
  { id: 1, parent: null, country: 'US', isinactive: false },
  { id: 2, parent: 1, country: 'MX', isinactive: false },
  { id: 3, parent: 1, country: 'US', isinactive: true },
  { id: 4, parent: 2, country: 'MX', isinactive: true },
  { id: 5, parent: 2, country: 'MX', isinactive: false },
  { id: 6, parent: 5, country: 'BR', isinactive: false },
  { id: 7, parent: 6, country: 'BR', isinactive: true },
  { id: 8, parent: 6, country: 'MX', isinactive: false },
  { id: 9, parent: 6, country: 'AR', isinactive: false },
  { id: 10, parent: 3, country: 'CA', isinactive: false },
  { id: 11, parent: 10, country: 'CA', isinactive: false },
  { id: 12, parent: 10, country: 'MX', isinactive: true },
  { id: 13, parent: 9, country: 'AR', isinactive: true },
  { id: 14, parent: 9, country: 'BR', isinactive: false },
  { id: 15, parent: 14, country: 'BR', isinactive: false },
  { id: 16, parent: 5, country: 'MX', isinactive: false },
  { id: 17, parent: null, country: 'DE', isinactive: false },
  { id: 18, parent: 17, country: 'DE', isinactive: false },
  { id: 19, parent: 18, country: 'MX', isinactive: false },
  { id: 20, parent: 19, country: 'MX', isinactive: false },
  { id: 21, parent: 19, country: 'BR', isinactive: true },
  { id: 22, parent: 20, country: 'AR', isinactive: false },
  { id: 23, parent: 22, country: 'MX', isinactive: true }
];


function printSubsidiariesTree(subsidiaries, parentId, level) {
  level = level || 0;

  subsidiaries.forEach(function(sub) {
    if (sub.parent === parentId) {
      // Imprimimos la subsidiaria con una indentación que refleja el nivel
      console.log(Array(level + 1).join('  ') + sub.id + ' (' + sub.country + ', ' + (sub.isinactive ? 'Inactive' : 'Active') + ')');
      
      // Recursivamente llamamos para imprimir sus hijos
      printSubsidiariesTree(subsidiaries, sub.id, level + 1);
    }
  });
}

// Función para iniciar el gráfico
function printTree(subsidiaries) {
  // Empieza desde los nodos raíz (parent = null)
  printSubsidiariesTree(subsidiaries, null, 0);
}


function isActiveSubsidiary(recordObj) {
  var accountSubsidiaries = recordObj.getValue({
    fieldId: "subsidiary",
  });
  var includeChildren = recordObj.getValue({
    fieldId: "includechildren",
  });
  log.error("accountSubsidiaries", accountSubsidiaries)
  log.error("includeChildren", includeChildren)

  var subsidiaries = [];
  search.create({
    type: "subsidiary",
    columns: ["internalid", "country", "isinactive", "parent"]
  }).run().each(function(result){
      subsidiaries = [
        {
          id: result.getValue("internalid"),
          country: result.getValue("country"),
          parent: result.getValue("parent"),
          isinactive : result.getValue("isinactive")
        }
      ]
      return true;
  })

  hasMexicanActiveDescendant(subsidiaries,accountSubsidiaries,includeChildren);

  
}

function hasMexicanActiveDescendant(subsidiaries, ids, includeChildren) {
  // Mapeamos las relaciones padre -> hijos
  var parentMap = subsidiaries.reduce(function(map, sub) {
    if (!map[sub.parent]) map[sub.parent] = [];
    map[sub.parent].push(sub);
    return map;
  }, {});

  function isMexicanAndActive(sub) {
    return sub.country === 'MX' && !sub.isinactive;
  }

  // Revisamos si alguna subsidiaria o sus descendientes cumplen los criterios
  return ids.some(function(id) {

    var stack = includeChildren
      ? (parentMap[id] || []).concat([subsidiaries.find(function(sub) { return sub.id === id; })])
      : [subsidiaries.find(function(sub) { return sub.id === id; })];

    while (stack.length) {
      var current = stack.pop();
      if (isMexicanAndActive(current)) return true;
      if (includeChildren) stack = stack.concat(parentMap[current.id] || []);
    }

    return false;
  });
}



printTree(subsidiaries);
console.log(hasMexicanActiveDescendant(subsidiaries,[1]))

