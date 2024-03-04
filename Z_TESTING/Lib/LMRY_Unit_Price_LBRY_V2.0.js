/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @Name LMRY_Unit_Price_LBRY_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 04/03/2024
 */


define([
    'N/log',
    'N/search',
    'N/record',
    'N/runtime',
    'N/format',
],function(log, search, record, runtime, format){

    function saveUnitPrice(currentRecord){
        log.error("saveUnitPrice","START")
        var numberItems = currentRecord.getLineCount({
            sublistId: "item"
        });

        if (numberItems) {
            for (var i = 0; i < numberItems; i++) {
                var unitPrice = 0;
                if (currentRecord.type == 'itemfulfillment') {
                    unitPrice = currentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: "itemunitprice",
                        line: i
                    }) || 0.01;
                } else{
                    unitPrice = currentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: "rate",
                        line: i
                    }) || 0.01;
                }
                
                unitPrice = unitPrice == 0 ? 0.01 : unitPrice;
                currentRecord.setSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_lmry_prec_unit_so",
                    value: unitPrice,
                    line: i
                });  
            }
        }
    }
    

    return { saveUnitPrice: saveUnitPrice };
});
