var sourceSublist = [];

var editableSublist = [];
function getChanges(sourceSublist, editableSublist) {
    var changes = [];


    var sourceMap = {};
    for (var i = 0; i < sourceSublist.length; i++) {
        sourceMap[sourceSublist[i].line] = sourceSublist[i];
    }


    var editableMap = {};
    for (var i = 0; i < editableSublist.length; i++) {
        editableMap[editableSublist[i].line] = editableSublist[i];
    }



    Object.keys(sourceMap).forEach(function (line) {
        if (editableMap.hasOwnProperty(line)) {
            if (sourceMap[line].name !== editableMap[line].name) {
                changes.push({
                    line: parseInt(line),
                    change: 'modify',
                    name: editableMap[line].name
                });
            }
        } else {
            changes.push({
                line: parseInt(line),
                change: 'delete'
            });
        }
    });

    Object.keys(editableMap).forEach(function (line) {
        if (!sourceMap.hasOwnProperty(line)) {
            changes.push({
                line: parseInt(line),
                change: 'create',
                name: editableMap[line].name
            });
        }
    });
    changes.sort(function (a, b) {
        return a.line - b.line;
    });

    return changes;
}

console.log(getChanges(sourceSublist, editableSublist))


function getSublistTabItems(sourceSublistId, editableSublistId,recordObj){
    var sourceSublistCount = recordObj.getLineCount({ sublistId: sourceSublistId });
    var editableSublistCount = recordObj.getLineCount({ sublistId: editableSublistId });
    var sourceSublist = [];
    var editableSublist = [];
    if (sourceSublistCount) {
      for (var i = 0; i < sourceSublistCount; i++) {
        recordObj.selectLine({ sublistId: sourceSublistId, line: i });

        var elementsObject = {
          name: recordObj.getCurrentSublistValue({ sublistId: sourceSublistId, fieldId: sourceSublistId }),
          line: i
        }
        sourceSublist.push(elementsObject);
      }
    }
    if (editableSublistCount) {
      for (var i = 0; i < editableSublistCount; i++) {
        recordObj.selectLine({ sublistId: editableSublistId, line: i });

        var elementsObject = {
          name: recordObj.getCurrentSublistValue({ sublistId: editableSublistId, fieldId: sourceSublistId }),
          line: i,
        }
        editableSublist.push(elementsObject);
      }
    }

    console.log("sourceSublist:",sourceSublist)
    console.log("editableSublist:",editableSublist)
    //var sublistModify = getChanges(sourceSublist,editableSublist);
    
    
    
  }