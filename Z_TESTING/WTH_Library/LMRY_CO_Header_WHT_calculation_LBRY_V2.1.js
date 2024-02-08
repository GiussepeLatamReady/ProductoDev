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
    'N/runtime'
], (log, search, record, runtime) => {

    let features = {};
    const calculateHeaderWHT = (id) => {
        getFeatures();
        const transaction = getTransaction(id);


    }
    
    const getTransaction = (id) => {
        let transaction = {
            wht:{
                ica:{},
                iva:{},
                fte:{},
                cree:{}
            }
        };
        let searchFilters = [
            ["internalid", "anyof", id],
            "AND",
            ["mainline", "is", "T"]
        ];

        let searchColumns = new Array();
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{internalid}'}));
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{recordType}' }));

        search.create({
            type: 'transaction',
            filters: searchFilters,
            columns: searchColumns
        }).run().each(result => {
            transaction.recordtype = result.getValue(result.columns[1]);
        });


        let recordObj = record.load({ type: transaction.recordtype,id: id });

        transaction.total = parseFloat(recordObj.getValue({ fieldId: 'total'}));
        transaction.taxtotal = parseFloat(recordObj.getValue({ fieldId: 'taxtotal'}));
        transaction.subtotal =  transaction.total - transaction.taxtotal;
        transaction.exchangeRate = parseFloat(getExchangeRate(recordObj));
        transaction.items = getItemsData(recordObj);
        const relatedRecords = getRelatedRecord(id);

        relatedRecords.forEach(retention => {
            
            let nameWht = getRetentionName(retention.memo);
            
            let whtObject = getWhtCode(nameWht);
            
            if (whtObject.id) {
                assignToWht(transaction,whtObject.subtype,whtObject);
            }
            
        });
        transaction.relatedRecords = [...relatedRecords];
        log.error("transaction",transaction);
    }

    const getRetentionName = text => {
        const match = text.match(/Latam - WHT(?: Reclasification)?\s?(\S.*)/);
        return match ? match[1].trim() : "Retention name not found";
    };

    const assignToWht = (transaction, subtype, objeto) => {
        const whtMap = {
            "Auto ReteCREE": "cree",
            "ReteCREE": "cree",
            "Auto ReteFTE": "fte",
            "ReteFTE": "fte",
            "Auto ReteICA": "ica",
            "ReteICA": "ica",
            "Auto ReteIVA": "iva",
            "ReteIVA": "iva"
        };
    
        
        const key = Object.keys(whtMap).find(k => subtype.includes(k));
        if (key) transaction.wht[whtMap[key]] = objeto;
    };

    const getFeatures = () => {
        features.multibook = isValid(runtime.isFeatureInEffect({ feature: "MULTIBOOK" }));
        features.subsidiary = isValid(runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" }));
    }

    

    const getWhtCode = (nameWht) => {
        let whtCode = {
            id:null,
            name:null,
            rate:0,
            salesbase:null,
            puchasebase:null,
            subtype:null,
        };
        if (nameWht!="Retention name not found") {
            
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

            search.create({
                type: 'customrecord_lmry_wht_code',
                filters: searchFilters,
                columns: searchColumns
            }).run().each(result => {

                whtCode.id = result.getValue(result.columns[0])|| null;
                whtCode.name = result.getValue(result.columns[1]) || " ";
                whtCode.rate = result.getValue(result.columns[2]) || 0;
                whtCode.salesbase = result.getValue(result.columns[3])|| " ";
                whtCode.puchasebase = result.getValue(result.columns[4])|| " ";
                whtCode.subtype = result.getValue(result.columns[5])|| " ";
            });

            
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
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{trandate}' }));
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{memomain}' }));
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: '{amount}' }));
        let settings= [];
        if (features.subsidiary) {
            settings = [search.createSetting({ name: 'consolidationtype', value: 'NONE' })];
        }
        search.create({
            type: 'transaction',
            filters: searchFilters,
            columns: searchColumns,
            settings:settings
        }).run().each(result => {
            const transactionId =  result.getValue(result.columns[0]);
            transaction[transactionId]= {
                id: result.getValue(result.columns[0]),
                tranid: result.getValue(result.columns[1]),
                trandate: result.getValue(result.columns[2]),
                memo: result.getValue(result.columns[3]),
                amount:result.getValue(result.columns[4])
            }
            return true
        });
        return filterTransactionsByMemo(transaction);
    }

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

    const createTaxReesult = () => {

    }

    const updateTaxResult = (id) => {
        log.error(updateTaxResult.name, id)
    }

    const isValid = (bool) => {
        return (bool === "T" || bool === true);
    }

    const roundNumber = (num)=> {
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
            const itemType = recordObj.getSublistValue({ sublistId: 'item', fieldId: "itemtype", line: i });
            if (itemType != 'Discount' && itemType != 'Descuento') {
                items[id] = {
                    id: id,
                    amount: recordObj.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }),
                    lineuniquekey: recordObj.getSublistValue({ sublistId: 'item', fieldId: 'lineuniquekey', line: i }),
                    account: getItemAccount(id)
                }
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
        searchColumns.push(search.createColumn({ name: 'formulatext', formula: "CASE WHEN {type}='Inventory Item' THEN {assetaccount} ELSE  NVL({expenseaccount},{incomeaccount}) END" }));
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
