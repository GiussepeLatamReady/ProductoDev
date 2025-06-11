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
                log.error("count transactions", transactions.length);
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
                    setCustomGL(transaction);
                    transaction.modificado = false;
                    const line = Object.values(transaction).join("\t");
                    if (!transaction.customgl) {
                        record.load({
                            type:"vendorbill",
                            id:transaction.internalid
                        }).save();
                        log.error("save","guardado")
                        transaction.modificado = true;
                    }
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
                log.error("transactions", transactions)
                let fileContent = transactions.map(transaction => transaction.line + '\n').join('');
                const title = Object.keys(transactions[0].transaction).join("\t");
                fileContent = `${title}${fileContent}\r\n`
                saveFile(fileContent, "transaction_no_tax_BR_gadp.csv", "969158");

                const errorResults = transactions.filter(item => item.code === "ERROR");
                log.error("errorResults", errorResults)
                setStatus(transactions);
            } catch (error) {

                log.error("error Summarize [interno]", error.message);
            }
        };

        const setStatus = (transactions) => {
            const status = {
                PROCESS:0,
                NOT_PROCESS:0
            }
           transactions.forEach(line => {
                if (line.transaction.customgl) {
                    status.PROCESS++
                }else{
                    status.NOT_PROCESS++
                }
           });
           status.TOTAL = status.PROCESS + status.NOT_PROCESS;
           log.error("status",status)
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
            const transactionIds = {};
            const periods = ["54"];// jan 2024


            const transactionSearch = search.create({
                type: "vendorbill",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }, { "name": "includeperiodendtransactions", "value": "F" }],
                filters: [
                    ["type", "anyof", "VendBill"],
                    "AND",
                    ["subsidiary", "anyof", "4"],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["internalid","anyof","1068888"]
                ],
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

            transactionSearch.filters.push(search.createFilter({
                name: "formulatext",
                formula: generatePeriodFormula(periods),
                operator: search.Operator.IS,
                values: "1"
            }));

            const glColumn = search.createColumn({
                name: 'formulatext',
                formula: "{customscript}"
            });

            transactionSearch.columns.push(glColumn);

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
                    transaction.period = result.getText(columns[2]);
                    transactionResult.push(transaction);
                    //if (!transactionIds[transaction.internalid]) {
                    //transactionIds[transaction.internalid] = transaction.internalid;
                    //}

                });
            });
            return transactionResult;
        }


        const setCustomGL = (transaction) => {

            const customgl = []
            search.create({
                type: "vendorbill",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }, { "name": "includeperiodendtransactions", "value": "F" }],
                filters: [
                    ["type", "anyof", "VendBill"],
                    "AND",
                    ["subsidiary", "anyof", "4"],
                    "AND",
                    ["internalid", "anyof", transaction.internalid]
                ],
                columns:
                    [
                        search.createColumn({ name: "postingperiod", label: "Period" }),
                        search.createColumn({
                name: 'formulatext',
                formula: "{customscript}"
            })
                    ]
            }).run().each(result => {
                const columns = result.columns;
                const plugin = result.getValue(columns[1]);
                //log.error("plugin",plugin)
                if (plugin) customgl.push(plugin);
                return true;
            });
            //log.error("customgl",customgl)
            transaction.customgl = customgl.length > 0;
        }

        const generatePeriodFormula = (idsPeriod) => {
            const periodsString = idsPeriod.map(id => `'${id}'`).join(', ');
            return `CASE WHEN {postingperiod.id} IN (${periodsString}) THEN 1 ELSE 0 END`;
        }

        return { getInputData, map, summarize }

    });