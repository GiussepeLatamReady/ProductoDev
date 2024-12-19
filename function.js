

function getTransactions() {
    var invoiceSearchObj = search.create({
        type: "invoice",
        settings: [{ "name": "consolidationtype", "value": "NONE" }, { "name": "includeperiodendtransactions", "value": "F" }],
        filters:
            [
                ["type", "anyof", "CustInvc"],
                "AND",
                ["status", "anyof", "CustInvc:A"],
                "AND",
                ["mainline", "is", "T"],
                "AND",
                ["custbody_lmry_document_type.custrecord_lmry_document_apply_wht", "is", "T"],
                "AND",
                ["subsidiary", "anyof", "16"],
                "AND",
                ["entity", "anyof", "168831"],
                "AND",
                ["account", "anyof", "2409"]
            ],
        columns:
            [
                search.createColumn({ name: "internalid", label: "0. Internal ID" }),
                search.createColumn({ name: "transactionnumber", label: "1. Transaction Number" }),
                search.createColumn({ name: "currency", label: "2. Currency" }),
                search.createColumn({
                    name: "formulatext",
                    formula: "{tranid}",
                    label: "3. Transaction ID"
                }),
                search.createColumn({ name: "trandate", label: "4. Date" }),
                search.createColumn({ name: "memomain", label: "5. Memo" }),
                search.createColumn({ name: "mainname", label: "6. Customer main" }),
                search.createColumn({ name: "custbody_lmry_document_type", label: "7. Legal Document Type" }),
                search.createColumn({ name: "fxamountremaining", label: "8. Amount Remaining" }),
                search.createColumn({ name: "fxamount", label: "9. Amount" }),
                search.createColumn({ name: "fxamountpaid", label: "10. Amount Paid" }),
                search.createColumn({ name: "account", label: "11. Account" }),
                search.createColumn({
                    name: "custrecord_lmry_br_advance",
                    join: "CUSTRECORD_LMRY_BR_RELATED_TRANSACTION",
                    label: "12. Is Advance?"
                }),
                search.createColumn({
                    name: "custrecord_lmry_br_amount_advance",
                    join: "CUSTRECORD_LMRY_BR_RELATED_TRANSACTION",
                    label: "13. Amount Advance"
                })
            ]
    });

    invoiceSearchObj.run().each(result => {
        const internalid = result.getValue("internalid");
        const transactionnumber = result.getValue(result.columns[1]);
        const tranid = result.getValue(result.columns[3]);
        console.log("internalid: " + internalid)
        console.log("transactionnumber: " + transactionnumber)
        console.log("tranid: " + tranid)
        return true;
    });
}
getTransactions()