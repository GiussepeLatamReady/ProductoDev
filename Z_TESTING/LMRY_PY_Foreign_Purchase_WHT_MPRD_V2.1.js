/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name LMRY_PY_Foreign_Purchase_WHT_MPRD_V2.1.js
 * @Author gerson@latamready.com
 */
define(["N/log", "N/record", "N/search", "N/format", "N/runtime", "require", "./Latam_Library/LMRY_PY_Foreign_Purchase_WHT_MPRD_LBRY_V2.1", "N/task", "./Latam_Library/LMRY_Log_LBRY_V2.0"],

    function (log, record, search, format, runtime, require, libraryWhtPurchase, task, libraryLog) {

        let LMRY_script = "LatamReady - PY WHT Purchase MPRD";

        function getInputData() {
            try {
                // Data Parameters
                let scriptObj = runtime.getCurrentScript();
                let logid = scriptObj.getParameter({ name: "custscript_lmry_py_wht_pur_logid" });

                // Update Status
                libraryWhtPurchase.setLogStatus(logid, { "custrecord_lmry_py_wht_status": "1" });

                // Get Data Transactions
                let dataMap = libraryWhtPurchase.getLogData(logid);
                log.debug("dataMap", dataMap);

                return dataMap;
            } catch (err) {
                log.error("[getInputData]", err);
                // Data Parameters
                let scriptObj = runtime.getCurrentScript();
                let logid = scriptObj.getParameter({ name: "custscript_lmry_py_wht_pur_logid" });

                // Update Status
                libraryWhtPurchase.setLogStatus(logid, { "custrecord_lmry_py_wht_status": "3", "custrecord_lmry_py_wht_errors": "[getInputData]: " + err.message });

                // Create Log Error
                libraryLog.doLog({ title: "[ getInputData ]", message: err });
                return [];
            }

        }

        /**
         * If this entry point is used, the map function is invoked one time for each key/value.
         *
         * @param {Object} context
         * @param {boolean} context.isRestarted - Indicates whether the current invocation represents a restart
         * @param {number} context.executionNo - Version of the bundle being installed
         * @param {Iterator} context.errors - This param contains a "iterator().each(parameters)" function
         * @param {string} context.key - The key to be processed during the current invocation
         * @param {string} context.value - The value to be processed during the current invocation
         * @param {function} context.write - This data is passed to the reduce stage
         *
         * @since 2016.1
         */
        function map(context) {
            let journalId = "", taxResultId = "";
            try {
                let bill = context.key;
                let data = JSON.parse(context.value);

                let nationalTaxes = libraryWhtPurchase.getNationalTaxes(data);
                journalId = libraryWhtPurchase.createJournal(bill, data, nationalTaxes);

                if (journalId == 0) {
                    // Write Error
                    context.write({
                        key: bill,
                        value: {
                            success: false,
                            name: "Missing settings",
                            message: "Review record settings",
                            journal: "",
                            taxresult: ""
                        }
                    });
                    return true;
                }

                taxResultId = libraryWhtPurchase.createTaxResult(bill, data, nationalTaxes);

                libraryWhtPurchase.updateBillField(bill);

                // Write Success
                context.write({
                    key: bill,
                    value: {
                        success: true,
                        journal: journalId,
                        taxresult: taxResultId
                    }
                });
            } catch (err) {
                log.error("[map]", err);
                let bill = context.key;
                // Write Error
                context.write({
                    key: bill,
                    value: {
                        success: false,
                        name: err.name,
                        message: err.message,
                        journal: journalId,
                        taxresult: taxResultId
                    }
                });
            }
        }

        /**
         * If this entry point is used, the reduce function is invoked one time for
         * each key and list of values provided..
         *
         * @param {Object} context
         * @param {boolean} context.isRestarted - Indicates whether the current invocation of the represents a restart.
         * @param {number} context.concurrency - The maximum concurrency number when running the map/reduce script.
         * @param {Date} context.datecreated - The time and day when the script began running.
         * @param {number} context.seconds - The total number of seconds that elapsed during the processing of the script.
         * @param {number} context.usage - TThe total number of usage units consumed during the processing of the script.
         * @param {number} context.yields - The total number of yields that occurred during the processing of the script.
         * @param {Object} context.inputSummary - Object that contains data about the input stage.
         * @param {Object} context.mapSummary - Object that contains data about the map stage.
         * @param {Object} context.reduceSummary - Object that contains data about the reduce stage.
         * @param {Iterator} context.output - This param contains a "iterator().each(parameters)" function
         *
         * @since 2016.1
         */
        function summarize(context) {
            try {
                // Data Parameters
                let scriptObj = runtime.getCurrentScript();
                let logid = scriptObj.getParameter({ name: "custscript_lmry_py_wht_pur_logid" });

                // Already has an error
                if (libraryWhtPurchase.hasError(logid)) return true;

                let successJson = {};
                let errorJson = {};

                context.output.iterator().each(function (key, value) {
                    let result = JSON.parse(value);
                    log.debug("result", result);
                    // Has not been successful
                    if (!result.success) {
                        errorJson[key] = { name: result.name, message: result.message };
                        if (result.journal) successJson[key] ? successJson[key].journal = result.journal : successJson[key] = { journal: result.journal };
                        if (result.taxresult) successJson[key] ? successJson[key].taxresult = result.taxresult : successJson[key] = { taxresult: result.taxresult };
                    } else {
                        successJson[key] = { journal: result.journal, taxresult: result.taxresult };
                    }

                    return true;
                });

                log.debug("Success", JSON.stringify(successJson));
                log.debug("Error", JSON.stringify(errorJson));

                // Finalized by default
                let valuesRec = { "custrecord_lmry_py_wht_status": "2" };
                if (Object.keys(successJson).length) {
                    valuesRec["custrecord_lmry_py_wht_results"] = JSON.stringify(successJson);
                }

                // An error ocurred
                if (Object.keys(errorJson).length) {
                    valuesRec["custrecord_lmry_py_wht_errors"] = JSON.stringify(errorJson);
                    valuesRec["custrecord_lmry_py_wht_status"] = "3";
                }

                // Update Status
                libraryWhtPurchase.setLogStatus(logid, valuesRec);

            } catch (err) {

                log.error("[summarize]", err);
                // Data Parameters
                let scriptObj = runtime.getCurrentScript();
                let logid = scriptObj.getParameter({ name: "custscript_lmry_py_wht_pur_logid" });

                // Update Status
                libraryWhtPurchase.setLogStatus(logid, { "custrecord_lmry_py_wht_status": "3", "custrecord_lmry_py_wht_errors": "[summarize]: " + err.message });

                // Create Log Error
                libraryLog.doLog({ title: "[ summarize ]", message: err });
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            //reduce: reduce,
            summarize: summarize
        };

    });