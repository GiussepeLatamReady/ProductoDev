/**
 * @NApiVersion 2.0
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
    '../Latam_Library/SMC_BR_LatamTax_Purchase_LBRY_V2.0',
],

    function (record, runtime, search, log, file, libraryTaxPurchase) {


        function getInputData(inputContext) {
            try {
                var transactions = getTransactions();
                log.error("count transactions", transactions.length);
                transactions = transactions.slice(0,1);
                log.error("transactions", transactions);
                return transactions;
            } catch (error) {
                log.error("Error [getInputData]", error);
                return [{
                    code: "ERROR",
                    message: error.message
                }];
            }
        }

        function map(mapContext) {
            //Library_HideView.saveEntityFields(currentRecord)
            var value = JSON.parse(mapContext.value);
            if (value.code === "ERROR") {
                mapContext.write({
                    key: value.code,
                    value: value
                });
            } else {

                var transaction = value;
                //log.error("transaction map", transaction)
                try {
                    setCustomGL(transaction);
                    existTaxResult(transaction);
                    transaction.modificado = false;
                    var line = '';
                    for (var key in transaction) {
                        if (transaction.hasOwnProperty(key)) {
                            line += transaction[key] + "\t";
                        }
                    }
                    line = line.slice(0, -1); // Eliminar el último tab

                    //log.error("transaction map 2", transaction)
                    if (!transaction.customgl) {
                        
                        var recordObj = record.load({
                            type: "vendorbill",
                            id: transaction.internalid
                        })
                        
                        //var setup = libraryTaxPurchase.getSetupTaxSubsidiary("4");
                        //var Jsonresult = libraryTaxPurchase.getTaxPurchase(recordObj, setup, false);
                        //log.error("Jsonresult map 2", Jsonresult)

                        
                        recordObj.save({
                            disableTriggers: true,
                        });
                        //log.error("save", "guardado")
                        
                        transaction.modificado = true;

                    }
                    mapContext.write({
                        key: transaction.internalid,
                        value: {
                            code: "OK",
                            transaction: transaction,
                            line: line
                        }
                    });

                } catch (error) {
                    log.error("error map", error)
                    entity.state = "Error";
                    mapContext.write({
                        key: transaction.internalid,
                        value: {
                            code: "ERROR",
                            transaction: transaction
                        }
                    });
                }
            }

        }


        function summarize(summaryContext) {
            try {
                var transactions = []
                summaryContext.output.iterator().each(function (key, value) {
                    value = JSON.parse(value);
                    transactions.push(value)
                    return true;
                });
                log.error("transactions", transactions)
                var fileContent = '';
                for (var i = 0; i < transactions.length; i++) {
                    fileContent += transactions[i].line + '\n';
                }

                var title = '';
                for (var key in transactions[0].transaction) {
                    if (transactions[0].transaction.hasOwnProperty(key)) {
                        title += key + '\t';
                    }
                }
                title = title.slice(0, -1) + '\n'; // Eliminar el último tab
                fileContent = title + fileContent + '\r\n';

                saveFile(fileContent, "transaction_no_tax_BR_gadp.csv", "969158");

                var errorResults = [];
                for (var i = 0; i < transactions.length; i++) {
                    if (transactions[i].code === "ERROR") {
                        errorResults.push(transactions[i]);
                    }
                }

                log.error("errorResults", errorResults)
                setStatus(transactions);
            } catch (error) {

                log.error("error Summarize [interno]", error.message);
            }
        };

        function setStatus(transactions) {
            var status = {
                PROCESS: 0,
                NOT_PROCESS: 0
            };

            for (var i = 0; i < transactions.length; i++) {
                if (transactions[i].transaction.customgl) {
                    status.PROCESS++;
                } else {
                    status.NOT_PROCESS++;
                }
            }

            status.TOTAL = status.PROCESS + status.NOT_PROCESS;
            log.error("status", status);
        }


        function saveFile(fileContent, nameFile, folderId) {

            if (!folderId) return;
            var fileGenerate = file.create({
                name: nameFile,
                fileType: file.Type.CSV,
                contents: fileContent,
                encoding: file.Encoding.UTF8,
                folder: folderId
            });

            return fileGenerate.save();
        };

        function existTaxResult(transaction) {



            
            var count =  search.create({
                type: "customrecord_lmry_br_transaction",
                filters:
                    [
                        ["custrecord_lmry_br_transaction", "anyof", transaction.internalid]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            }).runPaged().count;

            if (count) {
                transaction.taxresult = true;
                transaction.countTaxresult = count;
            }else{
                transaction.taxresult = false;
                transaction.countTaxresult = count;
            }
        }

        function getTransactions() {

            var transactionResult = [];
            var transactionIds = {};
            var periods = ["38"/*,"39","41","42","43","45","46","47","49","50","51"*/];// jan 2024


            var transactionSearch = search.create({
                type: "vendorbill",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }, { "name": "includeperiodendtransactions", "value": "F" }],
                filters: [
                    ["type", "anyof", "VendBill"],
                    "AND",
                    ["subsidiary", "anyof", "4"],
                    "AND",
                    ["mainline", "is", "T"],
                    //"AND",
                    //["internalid", "anyof", "1167646"]
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

            var glColumn = search.createColumn({
                name: 'formulatext',
                formula: "{customscript}"
            });

            transactionSearch.columns.push(glColumn);

            var pagedData = transactionSearch.runPaged({
                pageSize: 1000
            });

            var page, columns;
            pagedData.pageRanges.forEach(function (pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    columns = result.columns;
                    var transaction = {};
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


        function setCustomGL(transaction) {

            var customgl = []
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
            }).run().each(function (result) {
                var columns = result.columns;
                var plugin = result.getValue(columns[1]);
                //log.error("plugin",plugin)
                if (plugin) customgl.push(plugin);
                return true;
            });
            //log.error("customgl",customgl)
            transaction.customgl = customgl.length > 0;
        }

        function generatePeriodFormula(idsPeriod) {
            var periodsString = '';
            for (var i = 0; i < idsPeriod.length; i++) {
                periodsString += "'" + idsPeriod[i] + "'";
                if (i < idsPeriod.length - 1) {
                    periodsString += ', ';
                }
            }
            return 'CASE WHEN {postingperiod.id} IN (' + periodsString + ') THEN 1 ELSE 0 END';
        }




        return { getInputData: getInputData, map: map, summarize: summarize }

    });