const saveWhtVariableRate = (context) => {
    const {newRecord} = context;
    let resultWht = {};

    const saveWhtVariableRate = (resultWht,sublist) => {
        const countItems = newRecord.getLineCount({
            sublistId: sublist
        });
        let elements = [];
        let fieldId = sublist == "item" ? 'custpage_co_variable_rate_data' : 'custpage_co_variable_rate_data_expense';
        for (let i = 0; i < countItems; i++) {
            let dataLine = newRecord.getSublistValue({
                sublistId: sublist,
                fieldId: fieldId,
                line: i
            });
            elements.push(JSON.parse(dataLine));
        }

        if (elements.length) {
            resultWht[sublist] = elements;
        }
    }

    saveWhtVariableRate(resultWht,"item");
    saveWhtVariableRate(resultWht,"expense");

    if (Object.keys(resultWht).length) {
        newRecord.setValue("custbody_lmry_features_active",JSON.stringify(resultWht));
    } 

}