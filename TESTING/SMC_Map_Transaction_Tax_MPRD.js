/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name SMC_Map_Transaction_Tax_MPRD.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 03/06/2025
 */
define([
    "N/record",
    "N/runtime",
    "N/search",
    "N/log",
    "N/file",
],

    (record, runtime, search, log, file) => {


        const getInputData = (inputContext) => {
            try {
                const transactions = getTransactions();
                log.error("transactions",transactions.slice(0,5));
                log.error("count transactions",transactions.length);
                return transactions;
            } catch (error) {
                log.error("Error [getInputData]", error);
                return [{
                    code: "ERROR",
                    message: error.message
                }];
            }
        }

        const map = (mapContext) => {
            //Library_HideView.saveEntityFields(currentRecord)
            const value = JSON.parse(mapContext.value);
            if (value.code === "ERROR") {
                mapContext.write({
                    key: value.code,
                    value: value
                });
            } else {

                const transaction = value;
                try {

                    const line = Object.values(transaction).join("\t");

                    mapContext.write({
                        key: transaction.internalid,
                        value: {
                            code: "OK",
                            transaction,
                            line
                        }
                    });

                } catch (error) {
                    entity.state = "Error";
                    mapContext.write({
                        key: entity.internalid,
                        value: {
                            code: "ERROR",
                            transaction
                        }
                    });
                }
            }

        }


        const summarize = summaryContext => {
            try {
                const transactions = []
                summaryContext.output.iterator().each(function (key, value) {
                    value = JSON.parse(value);
                    transactions.push(value)
                    return true;
                });
                const fileContent = transactions.map(transaction => transaction + '\n').join('');
                const title = Object.keys(transaction[0]).join("\t");
                fileContent = `${title}${fileContent}\r\n`
                saveFile(fileContent,"transaction_no_tax_BR_gadp.csv","371268")

                const errorResults = transactions.filter(item => item.code === "ERROR");
                log.error("errorResults", errorResults)
                log.error("countEntityResults", countEntityResults(transactions))
            } catch (error) {

                log.error("error Summarize [interno]", error.message);
            }
        };

        const saveFile = (fileContent, nameFile, folderId) => {
           
            if (!folderId) return;
            const fileGenerate = file.create({
                name: nameFile,
                fileType: file.Type.CSV,
                contents: fileContent,
                encoding: file.Encoding.UTF8,
                folder: folderId
            });

            return fileGenerate.save();
        };

        const getAllCountryIDs = (data) => [
            ...new Set(
                Object.values(data)
                    .flatMap(({ countries }) => countries ? Object.keys(countries) : [])
            )
        ];
        const getTransactions = () => {

            const transactionResult = [];
            const periods = ["54"];
            const filters = [
                        ["type", "anyof", "VendBill"],
                        "AND",
                        ["subsidiary", "anyof", "4"],
                        "AND",
                        ["mainline", "is", "T"]
                    ];
            
            filters.push(search.createFilter({
                name: "formulatext",
                formula: generatePeriodFormula(periods),
                operator: search.Operator.IS,
                values: "1"
            }));
            const transactionSearch = search.create({
                type: "vendorbill",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }, { "name": "includeperiodendtransactions", "value": "F" }],
                filters,
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{tranid}",
                            label: "Formula (Text)"
                        }),
                        search.createColumn({ name: "postingperiod", label: "Period" })
                    ]
            });

            let pagedData = transactionSearch.runPaged({
                pageSize: 1000
            });

            let page, columns;
            pagedData.pageRanges.forEach(function (pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    columns = result.columns;
                    let transaction = {};
                    transaction.internalid = result.getValue(columns[0]);
                    transaction.tranid = result.getValue(columns[1]);
                    transaction.period = result.getValue(columns[2]);
                  
                    transactionResult.push(transaction);
                });
            });
            return transactionResult;
        }

        const generatePeriodFormula = (idsPeriod) => {
            const periodsString = idsPeriod.map(id => `'${id}'`).join(', ');
            return `CASE WHEN {postingperiod.id} IN (${periodsString}) THEN 1 ELSE 0 END`;
        }

        const generateLine = (transaction) => {
            return Object.values(transaction).join("\t");

        };

        return { getInputData, map, summarize }

    });