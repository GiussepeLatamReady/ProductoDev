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
], function (log, currentRecord) {

    function saveUnitPrice(currentRecord) {
        log.error("saveUnitPrice", "START")
        var numberItems = currentRecord.getLineCount({
            sublistId: "item"
        });
        if (numberItems) {
            for (var i = 0; i < numberItems; i++) {
                var unitPrice = 0;
                var amount = 0;
                var quantity = 0;
                var unitPriceAux = 0;
                var fieldIdUnitPrice = currentRecord.type == 'itemfulfillment' ? "itemunitprice" : "rate";
                var fieldIdAmount = currentRecord.type == 'itemfulfillment' ? "itemfxamount" : "amount";

                quantity = currentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "quantity",
                    line: i
                }) || 1;
                amount = currentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: fieldIdAmount,
                    line: i
                }) || 0;


                unitPriceAux = amount == 0 ? 0.01 : (amount / quantity).toFixed(2);

                unitPrice = currentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: fieldIdUnitPrice,
                    line: i
                }) || unitPriceAux;

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
                objRecord.selectLine({ sublistId: 'item', line: i });
                var objLine = objRecord.getCurrentSublistField({ sublistId: 'item', fieldId: 'custcol_lmry_prec_unit_so' })
                console.log("objLine :", objLine);
                //objLine.isDisplay = false;
                objLine.isDisabled = true;
            }
        }
    }


    return { disabledField: disabledField, saveUnitPrice: saveUnitPrice };
});
