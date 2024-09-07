function setLineDiscount(newRecord) {
  try {

    var recordObj = record.load({
      type: 'invoice',
      id: newRecord.id
    });
    
    var numberItems = recordObj.getLineCount({ sublistId: "item" });
    

    if (numberItems) {
      var GroupTypeItems = ["Group", "EndGroup"];
      var rateDiscount = 0;
      var amountDiscount = 0;
      var isChildrenGroup = false;
      var amountgroup=0;
      for (var i = numberItems - 1; i >= 0; i--) {
        var itemType = recordObj.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i });
        log.error("itemType:"+ i,itemType);
        var rate = recordObj.getSublistValue({ sublistId: "item", fieldId: "rate", line: i });
        log.error("isChildrenGroup:"+ i,isChildrenGroup);
        if (itemType == 'Discount') {
          var amountParent = Number(recordObj.getSublistValue({ sublistId: "item", fieldId: "amount", line: i-1 }));
          var amount = Number(recordObj.getSublistValue({ sublistId: "item", fieldId: "amount", line: i }));
          rate = Number((amount/amountParent).toFixed(2));
          rateDiscount = rate;
          amountDiscount = amount;
          log.error("rateDiscount:"+ i,rateDiscount);
        } else {

          if (itemType == "Group") {
            isChildrenGroup = false;
          }
          if (itemType == "EndGroup") {
            isChildrenGroup = true;
            amountgroup = Number(recordObj.getSublistValue({ sublistId: "item", fieldId: "amount", line: i }));
          }
          log.error("isChildrenGroup:"+ i,isChildrenGroup);
          if (isChildrenGroup) continue;

          recordObj.setSublistValue({ sublistId: "item", fieldId: "custcol_lmry_sales_discount_percentag", value: Math.abs(rateDiscount*100), line: i });   
          if (!rate) {
            var quantity = Number(recordObj.getSublistValue({ sublistId: "item", fieldId: "quantity", line: i }));
            var amount = Number(recordObj.getSublistValue({ sublistId: "item", fieldId: "amount", line: i }));

            if (itemType == "Group") {
              amount = amountgroup;
            }
            log.error("amount 2:"+ i,amount);
            log.error("quantity 2:"+ i,quantity);
            rate = amount/quantity;
            log.error("rate 2:"+ i,rate);
          }
          //discount = rate * (Math.abs(rateDiscount));
          //log.error("discount",discount);
          rate *= (1 - Math.abs(rateDiscount));
          recordObj.setSublistValue({ sublistId: "item", fieldId: "custcol_lmry_sales_discount_unit_real", value: Math.abs(rate), line: i });
          log.error("Precio unitario con descuento"+ i,rate);
          log.error("monto de  descuento "+ i,amountDiscount);
          recordObj.setSublistValue({ sublistId: "item", fieldId: "custcol_lmry_col_sales_discount", value: Math.abs(amountDiscount), line: i });
          log.error("rateDiscount:"+ i,rateDiscount);
          rateDiscount = 0;
          amountDiscount = 0;
          
        }
      }
    }

    recordObj.save({
      disableTriggers: true,
      ignoreMandatoryFields: true
    });
  } catch (err) {
    log.error('Error [setLineDiscount]', err);
    Library_Mail.sendemail2(' [ setLineDiscount ] ' + err, LMRY_script, RCD_OBJ, 'tranid', 'entity');
  }
}