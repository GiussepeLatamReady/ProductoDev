function createTransactionFields(vendorCreditID,dateSICORE) {

  if (!isfeeBased(vendorCreditID)) return false;
  var recordID
  search.create({
      type: "customrecord_lmry_ar_transaction_fields",
      filters:
      [
         ["custrecord_lmry_ar_transaction_related.internalid","anyof",vendorCreditID]
      ],
      columns:
      [
         "internalid"
      ]
   }).run().each(function(result){
      recordID = result.getValue("internalid") || "";
   });

  if (recordID) {
      record.submitFields({
          type: "customrecord_lmry_ar_transaction_fields",
          id: recordID,
          values: {
              "custrecord_lmry_ar_voided": "1"
          },
          options: {
              disableTriggers: true
          }
      });
  }else{
      var rec_transField = record.create({ type: 'customrecord_lmry_ar_transaction_fields' });
      rec_transField.setValue({ fieldId: 'custrecord_lmry_ar_date_report', value: dateSICORE })
      rec_transField.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
      });
  }
  

}
