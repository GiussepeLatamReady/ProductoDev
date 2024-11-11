data.forEach((d) => {
  const { operation, recordObj, dataOperation } = d;
  nLog.debug("recordObj", JSON.stringify(recordObj));
  if (recordObj.scriptid) {
    try {
      if (operation === "create") {
        const newRecord = record.create({
          type: recordType
        });


        fields.forEach((fieldObj) => {
          const { fieldScriptId, isCircularReference, type } = fieldObj;
          if (!isCircularReference && recordObj.hasOwnProperty(fieldScriptId)) {
            let value = recordObj[fieldScriptId];
            if (type === "DATE") {
              if (value) {
                value = new Date(value);
              }
            }
            newRecord.setValue({ fieldId: fieldScriptId, value: value });
          }
        });

        const newId = newRecord.save({
          ignoreMandatoryFields: true,
          enableSourcing: false,
          disableTriggers: true
        });

        response.updateData.push({ id: newId, scriptid: recordObj.scriptid, operation: operation });
      } else if (operation === "update") {
        if (dataOperation === "REPLACEDATA") {
          const values = {};

          fields.forEach((fieldObj) => {
            const { fieldScriptId, isCircularReference, type } = fieldObj;
            if (!isCircularReference && recordObj.hasOwnProperty(fieldScriptId)) {
              let value = recordObj[fieldScriptId];
              if (type === "DATE") {
                value = new Date(value);
              }
              values[fieldScriptId] = value;
            }
          });

          if (Object.keys(values).length) {
            // values.scriptid = recordObj.scriptid;
            values.externalid = recordObj.externalid;
            values.isinactive = recordObj.isinactive;

            record.submitFields({
              type: recordType,
              id: recordObj.id,
              values: values,
              options: {
                ignoreMandatoryFields: true,
                enableSourcing: false,
                disableTriggers: true
              }
            });

            response.updateData.push({ id: recordObj.id, scriptid: recordObj.scriptid, operation: operation });
          }
        } else if (dataOperation === "PRESERVEDATA") {
          response.updateData.push({ id: recordObj.id, scriptid: recordObj.scriptid, operation: operation });
        }
      }
    } catch (err) {
      nLog.error("[saveData]", err);
      response.errorData.push({ scriptid: recordObj.scriptid, operation: operation, error: err.message });
    }
  }
});