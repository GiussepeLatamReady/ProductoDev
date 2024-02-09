/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_CO_Header_WHT_calculation_LBRY_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */

define([
    'N/log',
    'N/search',
    'N/record',
    'N/runtime',
    'N/format'
], (log, search, record, runtime, format) => {

    let features = {};
    const calculateHeaderWHT = (id) => {
        getFeatures();
        const transaction = getTransaction(id);


    }

    const getTransaction = (id) => {
        deleteTaxResults(id);
        let transaction = {
            id: id,
            wht: {
                ica: {},
                iva: {},
                fte: {},
                cree: {}
            }
        };
        let searchFilters = [
            ["internalid", "anyof", id],
            "AND",
            ["mainline", "is", "T"]
        ];

        let searchColumns = new Array();
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{internalid}' }));
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{recordType}' }));

        search.create({
            type: 'transaction',
            filters: searchFilters,
            columns: searchColumns
        }).run().each(result => {
            transaction.recordtype = result.getValue(result.columns[1]);
        });


        let recordObj = record.load({ type: transaction.recordtype, id: id });

        transaction.total = parseFloat(recordObj.getValue({ fieldId: 'total' }));
        transaction.taxtotal = parseFloat(recordObj.getValue({ fieldId: 'taxtotal' }));
        transaction.subtotal = transaction.total - transaction.taxtotal;
        transaction.exchangeRate = parseFloat(getExchangeRate(recordObj));
        transaction.items = getItemsData(recordObj);
        const relatedRecords = getRelatedRecord(id);

        if (transaction.recordtype == "vendorbill" || transaction.recordtype == "vendorcredit") {
            transaction.expense = getExpense(recordObj);
        }
        relatedRecords.forEach(retention => {

            let nameWht = getRetentionName(retention.memo);

            let whtObject = getWhtCode(nameWht);

            if (whtObject.id) {
                assignToWht(transaction, whtObject.subtype, whtObject);
            }

        });
        transaction.relatedRecords = [...relatedRecords];
        setTransactionWht(transaction);
        log.error("transaction", transaction);
        createTaxResults(transaction);


    }


    const deleteTaxResults = id => {
        let searchRecordLog = search.create({
            type: 'customrecord_lmry_br_transaction',
            filters: [
                ['custrecord_lmry_br_transaction', 'is', id]
            ],
            columns: [
                'internalid'
            ]
        })
        searchRecordLog.run().each(function (result) {
            const idTax = result.getValue(result.columns[0]);
            
            const idTaxLog = record.delete({
                type: 'customrecord_lmry_br_transaction',
                id: idTax,
                isDynamic: true
            });
            return true;
        });
    }
    /*
    const createTaxResults = transaction => {



        for (let item in transaction.items) {

            for (let retention in transaction.wht) {
                if (Object.keys(transaction.wht[retention]).length === 0) break;
                var recordSummary = record.create({ type: 'customrecord_lmry_br_transaction', isDynamic: false });

                recordSummary.setValue({ fieldId: 'custrecord_lmry_br_related_id', value: String(transaction.id) });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_br_transaction', value: transaction.id });

                recordSummary.setValue({ fieldId: 'custrecord_lmry_br_type', value: transaction.wht[retention].subtype });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_br_type_id', value: transaction.wht[retention].subtypeId });
                const baseAmount = transaction.items[item].amount;
                recordSummary.setValue({ fieldId: 'custrecord_lmry_base_amount', value: baseAmount });
                const retentionAmount = parseFloat(transaction.items[item].amount * transaction.wht[retention].rate);
                recordSummary.setValue({ fieldId: 'custrecord_lmry_br_total', value: retentionAmount.toFixed(2) });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_br_percent', value: parseFloat(transaction.wht[retention].rate) / 100 });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_total_item', value: 'Line - Item' });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_item', value: transaction.items[item].id });


                recordSummary.setValue({ fieldId: 'custrecord_lmry_total_base_currency', value: (baseAmount * transaction.exchangeRate).toFixed(2) });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_base_amount_local_currc', value: (retentionAmount * transaction.exchangeRate).toFixed(2) });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_amount_local_currency', value: (baseAmount * transaction.exchangeRate).toFixed(2) });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_tax_type', value: '1' });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_lineuniquekey', value: item });

                recordSummary.setValue({ fieldId: 'custrecord_lmry_co_wht_applied', value: transaction.wht[retention].relatedTransaction.id });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_co_date_wht_applied', value: transaction.wht[retention].relatedTransaction.trandate });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_co_acc_exo_concept', value: transaction.items[item].account });

                var idRecordSummary = recordSummary.save({ disableTriggers: true, ignoreMandatoryFields: true });

                log.debug('idRecordSummary - item', idRecordSummary);
            }
        }

        if (transaction.expense) {
            for (let expense in transaction.expense) {
                for (let retention in transaction.wht) {
                    if (Object.keys(transaction.wht[retention]).length === 0) break;
                    var recordSummary = record.create({ type: 'customrecord_lmry_br_transaction', isDynamic: false });

                    recordSummary.setValue({ fieldId: 'custrecord_lmry_br_related_id', value: String(transaction.id) });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_br_transaction', value: transaction.id });

                    recordSummary.setValue({ fieldId: 'custrecord_lmry_br_type', value: transaction.wht[retention].subtype });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_br_type_id', value: transaction.wht[retention].subtypeId });
                    const baseAmount = transaction.expense[expense].amount;
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_base_amount', value: baseAmount });
                    const retentionAmount = parseFloat(transaction.expense[expense].amount * transaction.wht[retention].rate);
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_br_total', value: retentionAmount.toFixed(2) });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_br_percent', value: parseFloat(transaction.wht[retention].rate) / 100 });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_total_item', value: 'Line - expense' });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_account', value: transaction.expense[expense].account });


                    recordSummary.setValue({ fieldId: 'custrecord_lmry_total_base_currency', value: (baseAmount * transaction.exchangeRate).toFixed(2)});
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_base_amount_local_currc', value: (retentionAmount * transaction.exchangeRate).toFixed(2) });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_amount_local_currency', value: (baseAmount * transaction.exchangeRate).toFixed(2) });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_tax_type', value: '1' });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_lineuniquekey', value: expense });

                    recordSummary.setValue({ fieldId: 'custrecord_lmry_co_wht_applied', value: transaction.wht[retention].relatedTransaction.id });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_co_date_wht_applied', value: transaction.wht[retention].relatedTransaction.trandate });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_co_acc_exo_concept', value: transaction.expense[expense].account });

                    var idRecordSummary = recordSummary.save({ disableTriggers: true, ignoreMandatoryFields: true });

                    log.debug('idRecordSummary - expense', idRecordSummary);
                }
            }
        }

    }
    */

    const createTaxResults = transaction => {
        const createAndSaveRecord = (amount, itemType, retentionKey, itemKey) => {
            if (Object.keys(transaction.wht[retentionKey]).length === 0) return;
    
            const recordSummary = record.create({ type: 'customrecord_lmry_br_transaction', isDynamic: false });
            const retentionAmount = parseFloat(amount * transaction.wht[retentionKey].rate).toFixed(2);
            const baseAmount = parseFloat(amount).toFixed(2);
            const commonValues = {
                custrecord_lmry_br_related_id: String(transaction.id),
                custrecord_lmry_br_transaction: transaction.id,
                custrecord_lmry_br_type: transaction.wht[retentionKey].subtype,
                custrecord_lmry_br_type_id: transaction.wht[retentionKey].subtypeId,
                custrecord_lmry_base_amount: baseAmount,
                custrecord_lmry_br_total: retentionAmount,
                custrecord_lmry_br_percent: parseFloat(transaction.wht[retentionKey].rate) / 100,
                custrecord_lmry_total_item: `Line - ${itemType}`,
                custrecord_lmry_item: itemType === 'Item' ? transaction.items[itemKey].id : undefined,
                custrecord_lmry_account: itemType === 'Expense' ? transaction.expense[itemKey].account : undefined,
                custrecord_lmry_total_base_currency: (baseAmount * transaction.exchangeRate).toFixed(2),
                custrecord_lmry_base_amount_local_currc: (retentionAmount * transaction.exchangeRate).toFixed(2),
                custrecord_lmry_amount_local_currency: (baseAmount * transaction.exchangeRate).toFixed(2),
                custrecord_lmry_tax_type: '1',
                custrecord_lmry_lineuniquekey: itemKey,
                custrecord_lmry_co_wht_applied: transaction.wht[retentionKey].relatedTransaction.id,
                custrecord_lmry_co_date_wht_applied: transaction.wht[retentionKey].relatedTransaction.trandate,
                custrecord_lmry_co_acc_exo_concept: itemType === 'Expense' ? transaction.expense[itemKey].account : transaction.items[itemKey].account,
            };
    
            for (const fieldId in commonValues) {
                if (commonValues[fieldId] !== undefined) {
                    recordSummary.setValue({ fieldId, value: commonValues[fieldId] });
                }
            }
    
            const idRecordSummary = recordSummary.save({ disableTriggers: true, ignoreMandatoryFields: true });
            log.debug(`idRecordSummary - ${itemType}`, idRecordSummary);
        };
    
        for (let item in transaction.items) {
            for (let retention in transaction.wht) {
                createAndSaveRecord(transaction.items[item].amount, 'Item', retention, item);
            }
        }
    
        if (transaction.expense) {
            for (let expense in transaction.expense) {
                for (let retention in transaction.wht) {
                    createAndSaveRecord(transaction.expense[expense].amount, 'Expense', retention, expense);
                }
            }
        }
    };
    

    const setTransactionWht = transaction => {
        transaction.relatedRecords.forEach(record => {
            let subtypeKey = record.subtypeKey;
            if (transaction.wht[subtypeKey]) {
                transaction.wht[subtypeKey].relatedTransaction = {
                    id: record.id,
                    trandate: record.trandate
                };
            }
        });
    }

    const getExpense = (recordObj) => {
        let expense = {};
        const itemsLines = recordObj.getLineCount({ sublistId: 'expense' });
        for (let i = 0; i < itemsLines; i++) {
            const lineuniquekey = recordObj.getSublistValue({ sublistId: 'expense', fieldId: 'lineuniquekey', line: i });

            expense[lineuniquekey] = {
                amount: recordObj.getSublistValue({ sublistId: 'expense', fieldId: 'amount', line: i }),
                lineuniquekey: lineuniquekey,
                account: recordObj.getSublistValue({ sublistId: 'expense', fieldId: 'account', line: i })
            }

        }
        return expense;
    }

    const getRetentionName = text => {
        const match = text.match(/Latam - WHT(?: Reclasification)?\s?(\S.*)/);
        return match ? match[1].trim() : "Retention name not found";
    };

    const assignToWht = (transaction, subtype, objeto) => {
        transaction.wht[subtypeToKey(subtype)] = objeto;
    };

    const subtypeToKey = (subtype) => {
        return subtype.replace(/.*(?:cree|fte|ica|iva).*/i, (match) => match.toLowerCase().match(/cree|fte|ica|iva/)[0]);
    };

    const getFeatures = () => {
        features.multibook = isValid(runtime.isFeatureInEffect({ feature: "MULTIBOOK" }));
        features.subsidiary = isValid(runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" }));
    }



    const getWhtCode = (nameWht) => {
        let whtCode = {
            id: null,
            name: null,
            rate: 0,
            salesbase: null,
            puchasebase: null,
            subtype: null,
        };
        if (nameWht != "Retention name not found") {

            let searchFilters = [
                ["name", "is", nameWht]
            ];

            let searchColumns = new Array();
            searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{internalid}' }));
            searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{name}' }));
            searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_wht_coderate}' }));
            searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_wht_salebase.custrecord_lmry_wht_internalid}' }));
            searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_wht_purcbase.custrecord_lmry_wht_internalid}' }));
            searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_wht_types.custrecord_lmry_wht_subtype}' }));
            searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_wht_types.custrecord_lmry_wht_subtype.id}' }));

            search.create({
                type: 'customrecord_lmry_wht_code',
                filters: searchFilters,
                columns: searchColumns
            }).run().each(result => {

                whtCode.id = result.getValue(result.columns[0]) || null;
                whtCode.name = result.getValue(result.columns[1]) || " ";
                whtCode.rate = result.getValue(result.columns[2]) || 0;
                whtCode.salesbase = result.getValue(result.columns[3]) || " ";
                whtCode.puchasebase = result.getValue(result.columns[4]) || " ";
                whtCode.subtype = result.getValue(result.columns[5]) || " ";
                whtCode.subtypeId = result.getValue(result.columns[6]) || " ";
            });
            whtCode.rate = parseFloat(whtCode.rate) / 100;

        }
        return whtCode;

    }

    const getRelatedRecord = (id) => {

        let transaction = {};
        let searchFilters = [
            ["custbody_lmry_reference_transaction", "anyof", id],
            "AND",
            ["mainline", "is", "T"]
        ];

        let searchColumns = new Array();
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{internalid}' }));
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{tranid}' }));
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: "TO_CHAR({trandate},'YYYY-MM-DD')" }));
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{memomain}' }));
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{amount}' }));
        let settings = [];
        if (features.subsidiary) {
            settings = [search.createSetting({ name: 'consolidationtype', value: 'NONE' })];
        }
        search.create({
            type: 'transaction',
            filters: searchFilters,
            columns: searchColumns,
            settings: settings
        }).run().each(result => {
            const transactionId = result.getValue(result.columns[0]);
            transaction[transactionId] = {
                id: result.getValue(result.columns[0]),
                tranid: result.getValue(result.columns[1]),
                trandate: formatDate(result.getValue(result.columns[2])),
                memo: result.getValue(result.columns[3]),
                amount: result.getValue(result.columns[4]),
                subtypeKey: subtypeToKey(getRetentionName(result.getValue(result.columns[3])))
            }
            return true
        });
        return filterTransactionsByMemo(transaction);
    }

    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return format.parse({
            value: date,
            type: format.Type.DATE
        });
    };

    const filterTransactionsByMemo = transactions => {
        let filtered = Object.values(transactions).filter(t => t.memo.startsWith("Latam - WHT Reclasification"));
        return filtered.length ? filtered : Object.values(transactions).filter(t => t.memo.startsWith("Latam - WHT"));
    };


    const getExchangeRate = (recordObj) => {
        const exchangerateTran = recordObj.getValue({ fieldId: 'exchangerate' });
        const subsidiary = recordObj.getValue({ fieldId: 'subsidiary' });

        if (!features.subsidiary) return exchangerateTran;

        let searchSetupSubsidiary = search.create({
            type: "customrecord_lmry_setup_tax_subsidiary",
            filters: [
                ['isinactive', 'is', 'F'],
            ],
            columns: ['custrecord_lmry_setuptax_currency']
        });

        if (features.subsidiary) {
            searchSetupSubsidiary.filters.push(search.createFilter({
                name: 'custrecord_lmry_setuptax_subsidiary',
                operator: 'is',
                values: subsidiary
            }));
        }

        searchSetupSubsidiary = searchSetupSubsidiary.run().getRange({
            start: 0,
            end: 1000
        });
        const currencySetup = searchSetupSubsidiary.length ? searchSetupSubsidiary[0].getValue('custrecord_lmry_setuptax_currency') : 0;

        if (!features.multibook || currencySetup === 0) return exchangerateTran;

        const { currency: [{ value: currencySubs }] } = search.lookupFields({
            type: 'subsidiary',
            id: subsidiary,
            columns: ['currency']
        });

        if (currencySubs === currencySetup) return exchangerateTran;

        const lineasBook = recordObj.getLineCount({ sublistId: 'accountingbookdetail' });

        for (let i = 0; i < lineasBook; i++) {
            const lineaCurrencyMB = recordObj.getSublistValue({
                sublistId: 'accountingbookdetail',
                fieldId: 'currency',
                line: i
            });

            if (lineaCurrencyMB === currencySetup) {
                return recordObj.getSublistValue({
                    sublistId: 'accountingbookdetail',
                    fieldId: 'exchangerate',
                    line: i
                });
            }
        }

        return exchangerateTran;
    };

    const updateTaxResult = (id) => {
        log.error(updateTaxResult.name, id)
    }

    const isValid = (bool) => {
        return (bool === "T" || bool === true);
    }

    const roundNumber = (num) => {
        if (num >= 0) {
            return parseFloat(Math.round(parseFloat(num) * 1e2 + 1e-3) / 1e2);
        } else {
            return parseFloat(Math.round(parseFloat(num) * 1e2 - 1e-3) / 1e2);
        }
    }


    const getBase = (id) => {
        const bases = {
            "Net Amount": "subtotal",
            "Gross Amount": "total"
        };

        return bases[id] || null;
    };


    const getItemsData = (recordObj) => {
        let items = {};
        const itemsLines = recordObj.getLineCount({ sublistId: 'item' });
        for (let i = 0; i < itemsLines; i++) {
            const id = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            const lineuniquekey = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'lineuniquekey', line: i });

            items[lineuniquekey] = {
                id: id,
                amount: Math.abs(recordObj.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i })),
                lineuniquekey: lineuniquekey,
                account: getItemAccount(id),
                itemType: recordObj.getSublistValue({ sublistId: 'item', fieldId: "itemtype", line: i })
            }
            if (items[lineuniquekey].itemType == "Discount" || items[lineuniquekey].itemType == "Descuento") {
                items[lineuniquekey].amount *= -1;
            }
        }
        return items;
    }

    const getItemAccount = (id) => {
        let accountItem = "";
        let searchFilters = [
            ["internalid", "anyof", id]
        ];

        let searchColumns = new Array();
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: "CASE WHEN {type}='Inventory Item' THEN {assetaccount.id} ELSE  NVL({expenseaccount.id},{incomeaccount.id}) END" }));
        search.create({
            type: 'item',
            filters: searchFilters,
            columns: searchColumns
        }).run().each(result => {
            accountItem = result.getValue(result.columns[0]);
        });

        return accountItem;
    }




    return { calculateHeaderWHT, updateTaxResult };
});
