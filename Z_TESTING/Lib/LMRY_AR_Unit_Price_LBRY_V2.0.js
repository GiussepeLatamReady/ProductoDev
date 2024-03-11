/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @Name LMRY_Unit_Price_LBRY_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 04/03/2024
 */


define([
    'N/log',
    'N/currentRecord'
], function (log,currentRecord) {

    function saveUnitPrice(currentRecord) {
        log.error("saveUnitPrice", "START")
        var numberItems = currentRecord.getLineCount({
            sublistId: "item"
        });
        var form = currentRecord.form;
        if (numberItems) {
            for (var i = 0; i < numberItems; i++) {
                var unitPrice = 0;

                var fieldId = currentRecord.type == 'itemfulfillment' ? "itemunitprice" : "rate";

                unitPrice = currentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: fieldId,
                    line: i
                }) || 0.01;


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

    function disabledField() {
        var objRecord = currentRecord.get();
        var numberItems = objRecord.getLineCount({ sublistId: 'item' });;
        console.log("numberItems: ", numberItems);
        if (numberItems) {
            for (var i = 0; i < numberItems; i++) {
                //var currentLine = objRecord.getSublistField({ sublistId: 'item', fieldId: 'custcol_lmry_prec_unit_so', line: i });
                var objLine = objRecord.selectLine({ sublistId: 'item', line: i });
                console.log("objLine :",objLine);
                objLine.isDisplay = false;
                objRecord.isDisplay = false;
            }
        }
    }


    return { disabledField:disabledField,saveUnitPrice: saveUnitPrice };
});
