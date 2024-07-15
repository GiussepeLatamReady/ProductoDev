const createWhtUpdateButton = (context) => {
  const { form, newRecord } = context;
  const {type} = newRecord;
  const fieldsToCheck = [
    'custcol_lmry_co_autoretecree',
    'custcol_lmry_co_retefte',
    'custcol_lmry_co_reteica',
    'custcol_lmry_co_reteiva'
  ];

  const numTransaction = newRecord.getLineCount({ sublistId: 'item' });
  let hasRetencion = false;

  for (let i = 0; i < numTransaction; i++) {
    if (fieldsToCheck.some(fieldId => newRecord.getSublistValue({ sublistId: 'item', fieldId, line: i }))) {
      hasRetencion = true;
      break;
    }
  }

  form.addButton({
    id: 'custpage_id_button_ud_whx',
    label: 'UPDATE WHT',
    functionName: `updateRetention('${type}')`
  });

  const objScript = {
    "vendorbill" : "./LMRY_VendorBill_CO_CLNT_HNDL.js",
    "vendorcredit" : "./LMRY_VendorCredit_CO_CLNT_HNDL.js"
  }

  form.clientScriptModulePath = objScript[type];

  if (hasRetencion) {
    form.getButton({ id: 'custpage_id_button_ud_whx' }).isDisabled = true;
  }

};
onClick_updatecowht
createCoButtonUpdateWhx

createWhtUpdateButton


const updateRetention = (type) => {
  const transactionID = Number(RECORD_ID) || "";
  const transactionRecord = record.load({ type, id: transactionID });
  const entityId = transactionRecord.getValue("entity");

  if (entityId) {
      const transactionTypes = {
          "invoice": "1", "salesorder": "2", "cashsale": "3",
          "vendorbill": "4", "purchaseorder": "6", "vendorcredit": "7",
          "creditmemo": "8", "cashrefund": "9", "estimate": "10",
          "creditcardcharge": "15", "creditcardrefund": "16", "expensereport": "18"
      };

      if (transactionTypes[type]) {
          const filters = [
              ["isinactive", "is", "F"],
              "AND",
              ["custrecord_lmry_co_entity", "anyof", entityId],
              "AND",
              ["custrecord_lmry_co_ent_trantype", "anyof", transactionTypes[type]]
          ];

          const FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
          if (FEAT_SUBS) {
              const subsidiary = transactionRecord.getValue("subsidiary");
              filters.push("AND", ["custrecord_lmry_co_subsi_reten", "anyof", subsidiary]);
          }

          const columns = ["custrecord_lmry_co_retefte", "custrecord_lmry_co_autoretecree", "custrecord_lmry_co_reteica", "custrecord_lmry_co_reteiva"];
          search.create({
              type: "customrecord_lmry_entity_fields",
              filters,
              columns
          }).run().each(result => {
            const [reteica, reteiva, retefte, retecree] = columns.map(col => result[0].getValue(col) || "");

            const updateSublistValues = (sublistId) => {
                const numLines = transactionRecord.getLineCount({ sublistId });
                for (let i = 0; i < numLines; i++) {
                    const applyWht = transactionRecord.getSublistValue({ sublistId, fieldId: 'custcol_lmry_apply_wht_tax', line: i });
                    if (applyWht === 'T' || applyWht === true) {
                        transactionRecord.setSublistValue({ sublistId, fieldId: 'custcol_lmry_co_autoretecree', line: i, value: retecree });
                        transactionRecord.setSublistValue({ sublistId, fieldId: 'custcol_lmry_co_retefte', line: i, value: retefte });
                        transactionRecord.setSublistValue({ sublistId, fieldId: 'custcol_lmry_co_reteica', line: i, value: reteica });
                        transactionRecord.setSublistValue({ sublistId, fieldId: 'custcol_lmry_co_reteiva', line: i, value: reteiva });
                    }
                }
            };

            ['item', 'expense', 'expcost', 'itemcost', 'time'].forEach(updateSublistValues);

            transactionRecord.save({ disableTriggers: true }); // no se ejecutan los user events
            window.location.reload();
          });
      }
  }
}


const setLinesValueRetention = (newRecord) => {
  try {
    const omitTypeItem = ["Group", "EndGroup"];
    const typeTransaction = newRecord.type;
    const handleSublistValues = (sublistId, fields, line) => {
      fields.forEach(({ from, to }) => {
        const value = newRecord.getSublistValue({ sublistId, fieldId: from, line }) || "";
        if (value) newRecord.setSublistValue({ sublistId, fieldId: to, line, value });
      });
    };

    const processLines = (sublistId, fields) => {
      const numLines = newRecord.getLineCount({ sublistId });
      for (let i = 0; i < numLines; i++) {
        const itemType = newRecord.getSublistValue({ sublistId, fieldId: "itemtype", line: i });
        if (sublistId === 'item' && omitTypeItem.includes(itemType)) {
          continue;
        }
        handleSublistValues(sublistId, fields, i);
      }
    };

    if (['invoice', 'creditmemo', 'vendorbill', 'vendorcredit'].includes(typeTransaction)) {
      processLines('item', [
        { from: 'custpage_lmry_co_autoretecree', to: 'custcol_lmry_co_autoretecree' },
        { from: 'custpage_lmry_co_retefte', to: 'custcol_lmry_co_retefte' },
        { from: 'custpage_lmry_co_reteica', to: 'custcol_lmry_co_reteica' },
        { from: 'custpage_lmry_co_reteiva', to: 'custcol_lmry_co_reteiva' }
      ]);
    }

    if (['vendorbill', 'vendorcredit'].includes(typeTransaction)) {
      processLines('expense', [
        { from: 'custpage_lmry_co_retecree_exp', to: 'custcol_lmry_co_autoretecree' },
        { from: 'custpage_lmry_co_retefte_exp', to: 'custcol_lmry_co_retefte' },
        { from: 'custpage_lmry_co_reteica_exp', to: 'custcol_lmry_co_reteica' },
        { from: 'custpage_lmry_co_reteiva_exp', to: 'custcol_lmry_co_reteiva' }
      ]);
    }
  } catch (error) {
    log.error('setCOLineValueWTH', error);
    libLog.doLog("[setCOLineValueWTH]", error);
  }
};
