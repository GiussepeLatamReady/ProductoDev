function getTransactions() {
   let {
       subsidiary,
       startDate,
       endDate,
       whtType,
       accoutingPeriod,
       typeProcess
   } = this.params;

   let filters = [
       ["mainline", "is", "T"],
       "AND",
       ["custbody_lmry_reference_transaction", "noneof", "@NONE@"]
   ];

   let typeFilters = [
       "OR",
       ["type", "anyof", typeProcess === "sales" ? ["CustCred", "CustInvc"] : ["VendBill", "VendCred"]],
       ["type", "anyof", "Journal", "AND", ["formulatext", "is", "1", "formulatext", `CASE WHEN {custbody_lmry_reference_transaction.recordType} = '${typeProcess === "sales" ? "invoice" : "vendorbill"}' OR {custbody_lmry_reference_transaction.recordType} = '${typeProcess === "sales" ? "creditmemo" : "vendorcredit"}' THEN 1 ELSE 0 END`]]
   ];
   filters.push(...typeFilters);

   let whtFilters = [
       "AND",
       ["memomain", "startswith", whtType === "header" ? "Latam - WHT" : "Latam - CO WHT (Lines)"]
   ];
   if (whtType === "header") {
       whtFilters.push("AND", ["memomain", "doesnotstartwith", "Latam - WHT Reverse"]);
   }
   filters.push(...whtFilters);

   if (startDate && endDate) {
       filters.push('AND', ["formulatext:" + this.getPeriods(subsidiary, startDate, endDate), search.Operator.IS, "1"]);
   }

   if (accoutingPeriod) {
       filters.push('AND', ["formulatext:" + this.generatePeriodFormula([accoutingPeriod]), search.Operator.IS, "1"]);
   }

   if (this.FEAT_SUBS) {
       filters.push('AND', ['subsidiary', 'anyof', subsidiary]);
   }

   let columns = [search.createColumn({
       name: 'formulatext',
       formula: '{custbody_lmry_reference_transaction.internalid}',
       sort: search.Sort.DESC
   })];

   let searchSettings = this.FEAT_SUBS ? [search.createSetting({ name: 'consolidationtype', value: 'NONE' })] : [];
   let searchTransactionsWht = search.create({ type: "transaction", filters, columns, settings: searchSettings });

   let jsonData = {};
   let pageData = searchTransactionsWht.runPaged({ pageSize: 1000 });
   pageData.pageRanges.forEach(pageRange => {
       let page = pageData.fetch({ index: pageRange.index });
       page.data.forEach(result => {
           let id = result.getValue(result.columns[0]);
           jsonData[id] = true;
       });
   });

   return this.getTransactionsMain(Object.keys(jsonData), whtType);
}
