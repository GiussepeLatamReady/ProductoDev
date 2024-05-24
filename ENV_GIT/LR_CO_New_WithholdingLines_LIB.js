/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LR_CO_New_WithholdingLines_LIB.js
 * @Author joshep@latamready.com
 **/
define(["N/record", "N/search", "N/runtime", "N/log", "N/format", "N/https", "N/suiteAppInfo", "SuiteApps/com.latamready.lmrylocalizationcore/lib/licenses/LR_Licenses_LIB", "../../constants/LR_CO_FEATURES_CONST"], function (record, search, runtime, log, format, https, suiteAppInfo, Lib_Licenses, CO_FEAT) {
    const { FeatureManager } = Lib_Licenses;
    const tranTypeJSON = { invoice: 1, creditmemo: 8, vendorbill: 4, vendorcredit: 7 };
    const GroupTypeItems = ["Group", "EndGroup"];
    const sublistJSON = {
        item: { line: "item", appliesto: "applies_item" },
        expense: { line: "account", appliesto: "applies_account" },
        time: { line: "item", appliesto: "applies_item" }
    };

    const createWithholdingLines = (context) => {
        let newRecord = context.newRecord;
        log.error("newRecord", newRecord);
        log.error("type", newRecord.type);
        let mode = context.type;
        log.error("mode", mode);
        //Features
        let featureOW = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
        let featureMB = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
        let approvalInvoice = runtime.getCurrentScript().getParameter({ name: "CUSTOMAPPROVALCUSTINVC" });
        let approvalBill = runtime.getCurrentScript().getParameter({ name: "CUSTOMAPPROVALVENDORBILL" });
        let approvalFeature = ["invoice", "creditmemo"].includes(newRecord.type) ? approvalInvoice : approvalBill;

        let recordObj = record.load({ type: newRecord.type, id: newRecord.id });
        let approvalstatus = recordObj.getValue({ fieldId: "approvalstatus" });
        if (approvalFeature == "T" || approvalstatus == true) {
            if (newRecord.type == "invoice" || newRecord.type == "vendorbill") {
                if (approvalstatus != null && approvalstatus != "" && approvalstatus != "2") {
                    return true;
                }
            }
        }
        let subsidiary = recordObj.getValue("subsidiary");
        let featureManager = new FeatureManager(subsidiary);
        if (mode == "edit") {
            if (featureManager.isActive(CO_FEAT.WHT_VERIFY_CM) && Validate_EIDocument(recordObj)) {
                return true;
            }
            if (validateChange(context)) {
                return true;
            }
        }
        let restrict = { round: false };
        let multibook = getMultibook(recordObj, featureMB);
        let exchangeRate = getExchangeRate(recordObj, featureOW, featureMB, restrict);
        //Segmentaciones
        let departmentMain = recordObj.getValue({ fieldId: "department" });
        let classMain = recordObj.getValue({ fieldId: "class" });
        let locationMain = recordObj.getValue({ fieldId: "location" });
        //Objetos
        let linesJSON = {};
        let nationalTaxes = [];
        let items = [];
        let itemNames = {};
        let accounts = [];
        let accountNames = {};
        for (const key in sublistJSON) {
            for (let i = 0; i < recordObj.getLineCount({ sublistId: key }); i++) {
                if (key == "time") {
                    if (!recordObj.getSublistValue({ sublistId: key, fieldId: "apply", line: i })) continue;
                }

                if (key == "item") {
                    if (GroupTypeItems.includes(recordObj.getSublistValue({ sublistId: key, fieldId: "itemtype", line: i }))) continue;
                }

                let ApplyWHT = recordObj.getSublistValue({ sublistId: key, fieldId: "custcol_lmry_apply_wht_tax", line: i });
                if (ApplyWHT == "F" || ApplyWHT == false) {
                    continue;
                }

                let retecree = recordObj.getSublistValue({ sublistId: key, fieldId: "custcol_lmry_co_autoretecree", line: i });
                let retefte = recordObj.getSublistValue({ sublistId: key, fieldId: "custcol_lmry_co_retefte", line: i });
                let reteiva = recordObj.getSublistValue({ sublistId: key, fieldId: "custcol_lmry_co_reteiva", line: i });
                let reteica = recordObj.getSublistValue({ sublistId: key, fieldId: "custcol_lmry_co_reteica", line: i });

                if (!retecree && !retefte && !reteiva && !reteica) continue;

                linesJSON[[key, i].join("|")] = {
                    value: recordObj.getSublistValue({ sublistId: key, fieldId: sublistJSON[key].line, line: i }),
                    departmentItem: recordObj.getSublistValue({ sublistId: key, fieldId: "department", line: i }),
                    classItem: recordObj.getSublistValue({ sublistId: key, fieldId: "class", line: i }),
                    locationItem: recordObj.getSublistValue({ sublistId: key, fieldId: "location", line: i }),
                    grossamtItem: recordObj.getSublistValue({ sublistId: key, fieldId: "grossamt", line: i }),
                    taxamtItem: recordObj.getSublistValue({ sublistId: key, fieldId: "tax1amt", line: i }),
                    taxrateItem: recordObj.getSublistValue({ sublistId: key, fieldId: "taxrate1", line: i }) || 0,
                    netamtItem: recordObj.getSublistValue({ sublistId: key, fieldId: "amount", line: i }),
                    lineuniquekey: recordObj.getSublistValue({ sublistId: key, fieldId: "lineuniquekey", line: i }),
                    departmentMain: departmentMain,
                    classMain: classMain,
                    locationMain: locationMain
                };

                if (sublistJSON[key].line == "item") {
                    items.push(recordObj.getSublistValue({ sublistId: key, fieldId: sublistJSON[key].line, line: i }));
                } else {
                    accounts.push(recordObj.getSublistValue({ sublistId: key, fieldId: sublistJSON[key].line, line: i }));
                }

                if (retecree) {
                    linesJSON[[key, i].join("|")]["retecree"] = retecree || "";
                    if (!nationalTaxes.includes(retecree)) nationalTaxes.push(retecree);
                }
                if (retefte) {
                    linesJSON[[key, i].join("|")]["retefte"] = retefte || "";
                    if (!nationalTaxes.includes(retefte)) nationalTaxes.push(retefte);
                }
                if (reteiva) {
                    linesJSON[[key, i].join("|")]["reteiva"] = reteiva || "";
                    if (!nationalTaxes.includes(reteiva)) nationalTaxes.push(reteiva);
                }
                if (reteica) {
                    linesJSON[[key, i].join("|")]["reteica"] = reteica || "";
                    if (!nationalTaxes.includes(reteica)) nationalTaxes.push(reteica);
                }
            }
        }
        log.error("linesJSON", JSON.stringify(linesJSON));
        log.error("nationalTaxes", JSON.stringify(nationalTaxes));
        if (!nationalTaxes.length) {
            return true;
        }
        // Busqueda de nombres de items/accounts
        if (items.length) {
            let itemSearch = search.create({
                type: "item",
                filters: [["internalid", "anyof", items]],
                columns: ["internalid", "itemid"]
            });
            itemSearch = itemSearch.run().getRange(0, 1000);

            if (itemSearch && itemSearch.length) {
                for (let i = 0; i < itemSearch.length; i++) {
                    itemNames[itemSearch[i].getValue("internalid")] = itemSearch[i].getValue("itemid");
                }
            }
        }
        log.error("itemNames", JSON.stringify(itemNames));
        // Busqueda de nombres de items/accounts
        if (accounts.length) {
            let accountSearch = search.create({
                type: "account",
                filters: [["internalid", "anyof", accounts]],
                columns: ["internalid", "name"]
            });
            accountSearch = accountSearch.run().getRange(0, 1000);

            if (accountSearch && accountSearch.length) {
                for (let i = 0; i < accountSearch.length; i++) {
                    accountNames[accountSearch[i].getValue("internalid")] = accountSearch[i].getValue("name");
                }
            }
        }
        log.error("accountNames", JSON.stringify(accountNames));
        // JSON de National Taxes
        let nationalTaxJSON = getNationalTaxes(recordObj, nationalTaxes, featureOW);
        //JSON result
        let JSONresult = [];
        let JSONamounts = {
            retecree: 0,
            retefte: 0,
            reteiva: 0,
            reteica: 0
        };
        // Iteracion de lineas con retenciones
        for (const key in linesJSON) {
            let sublist = key.split("|")[0];
            let position = key.split("|")[1];

            if (linesJSON[key].retecree) {
                let whtData = getWHT(recordObj, sublist, position, linesJSON[key], nationalTaxJSON[linesJSON[key].retecree], multibook, exchangeRate, itemNames, accountNames, restrict);
                if (Object.keys(whtData).length) {
                    JSONresult.push(whtData);
                    JSONamounts.retecree += round2(whtData.retencionLocal);
                }
            }
            if (linesJSON[key].retefte) {
                let whtData = getWHT(recordObj, sublist, position, linesJSON[key], nationalTaxJSON[linesJSON[key].retefte], multibook, exchangeRate, itemNames, accountNames, restrict);
                if (Object.keys(whtData).length) {
                    JSONresult.push(whtData);
                    JSONamounts.retefte += round2(whtData.retencionLocal);
                }
            }
            if (linesJSON[key].reteiva) {
                let whtData = getWHT(recordObj, sublist, position, linesJSON[key], nationalTaxJSON[linesJSON[key].reteiva], multibook, exchangeRate, itemNames, accountNames, restrict);
                if (Object.keys(whtData).length) {
                    JSONresult.push(whtData);
                    JSONamounts.reteiva += round2(whtData.retencionLocal);
                }
            }
            if (linesJSON[key].reteica) {
                let whtData = getWHT(recordObj, sublist, position, linesJSON[key], nationalTaxJSON[linesJSON[key].reteica], multibook, exchangeRate, itemNames, accountNames, restrict);
                if (Object.keys(whtData).length) {
                    JSONresult.push(whtData);
                    JSONamounts.reteica += round2(whtData.retencionLocal);
                }
            }
        }
        log.error("JSONresult", JSON.stringify(JSONresult));
        log.error("JSONamounts", JSON.stringify(JSONamounts));

        let idJsonResult = createJSONResult(JSONresult, recordObj);
        log.error("idJsonResult", idJsonResult);
        record.submitFields({
            type: recordObj.type,
            id: recordObj.id,
            values: {
                custbody_lmry_co_retecree_amount: JSONamounts.retecree,
                custbody_lmry_co_retefte_amount: JSONamounts.retefte,
                custbody_lmry_co_reteiva_amount: JSONamounts.reteiva,
                custbody_lmry_co_reteica_amount: JSONamounts.reteica
            },
            options: {
                ignoreMandatoryFields: true,
                disableTriggers: true
            }
        });

        //Llamado del Reslet
        let myRestletResponse = https.requestRestlet.promise({
            scriptId: "customscript_lr_process_withholding_rstl",
            deploymentId: "customdeploy_lr_process_withholding_rstl",
            body: JSON.stringify({ id: recordObj.id, type: recordObj.type, idJson: idJsonResult }),
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0"
            }
        });
        log.error("myRestletResponse", myRestletResponse);
    };

    const getMultibook = (recordObj, featureMB) => {
        /********************************************************
         * Concatena los libros contables en caso tenga Multibook
         ********************************************************/
        let auxBookMB = [0];
        let auxExchangeMB = [recordObj.getValue({ fieldId: "exchangerate" })];
        if (featureMB) {
            let lineasBook = recordObj.getLineCount({ sublistId: "accountingbookdetail" });
            if ((lineasBook != null) & (lineasBook != "")) {
                for (let j = 0; j < lineasBook; j++) {
                    let lineaBook = recordObj.getSublistValue({ sublistId: "accountingbookdetail", fieldId: "bookid", line: j });
                    let lineaExchangeRate = recordObj.getSublistValue({ sublistId: "accountingbookdetail", fieldId: "exchangerate", line: j });
                    if (lineaBook) {
                        auxBookMB.push(lineaBook);
                        auxExchangeMB.push(lineaExchangeRate);
                    }
                }
            }
        } // Fin Multibook
        return auxBookMB.join("|") + "&" + auxExchangeMB.join("|");
    };

    const getExchangeRate = (recordObj, featureOW, featureMB, restrict) => {
        let filtros = [];
        filtros[0] = search.createFilter({ name: "isinactive", operator: "is", values: ["F"] });
        if (featureOW) {
            filtros[1] = search.createFilter({ name: "custrecord_lmry_setuptax_subsidiary", operator: "is", values: recordObj.getValue("subsidiary") });
        }
        let searchSetupSubsidiary = search.create({
            type: "customrecord_lmry_setup_tax_subsidiary",
            filters: filtros,
            columns: ["custrecord_lmry_setuptax_restrict_round", "custrecord_lmry_setuptax_currency"]
        });
        let resultSearchSub = searchSetupSubsidiary.run().getRange({ start: 0, end: 1 });
        let currencySetup = "";
        if (resultSearchSub && resultSearchSub.length) {
            currencySetup = resultSearchSub[0].getValue({ name: "custrecord_lmry_setuptax_currency" });
            restrict.round = resultSearchSub[0].getValue({ name: "custrecord_lmry_setuptax_restrict_round" });
        }
        let exchangerateTran = recordObj.getValue({ fieldId: "exchangerate" });
        let exchangeRate = 1;
        if (featureOW && featureMB) {
            // OneWorld y Multibook
            let currencySubs = search.lookupFields({ type: "subsidiary", id: recordObj.getValue("subsidiary"), columns: ["currency"] });
            currencySubs = currencySubs.currency[0].value;
            let lineasBook = recordObj.getLineCount({ sublistId: "accountingbookdetail" });
            if (currencySubs != currencySetup && currencySetup != "" && currencySetup != null) {
                if (lineasBook != null && lineasBook != "") {
                    for (let i = 0; i < lineasBook; i++) {
                        let lineaCurrencyMB = recordObj.getSublistValue({ sublistId: "accountingbookdetail", fieldId: "currency", line: i });
                        if (lineaCurrencyMB == currencySetup) {
                            exchangeRate = recordObj.getSublistValue({ sublistId: "accountingbookdetail", fieldId: "exchangerate", line: i });
                            break;
                        }
                    }
                }
            } else {
                // No esta configurado Setup Tax Subsidiary
                exchangeRate = exchangerateTran;
            }
        } else {
            // No es OneWorld o no tiene Multibook
            exchangeRate = exchangerateTran;
        }
        return exchangeRate;
    };

    const getNationalTaxes = (recordObj, nationalTaxes, featureOW) => {
        let jsonNT = {};
        let searchNT = search.create({
            type: "customrecord_lmry_national_taxes",
            columns: [
                "internalid",
                "custrecord_lmry_ntax_gen_transaction",
                "custrecord_lmry_ntax_description",
                "custrecord_lmry_ntax_taxtype",
                "custrecord_lmry_ntax_subtype",
                "custrecord_lmry_ntax_sub_type",
                "custrecord_lmry_ntax_appliesto",
                "custrecord_lmry_ntax_applies_to_item",
                "custrecord_lmry_ntax_applies_to_account",
                "custrecord_lmry_co_ntax_taxrate",
                "custrecord_lmry_ntax_amount",
                "custrecord_lmry_ntax_addratio",
                "custrecord_lmry_ntax_minamount",
                "custrecord_lmry_ntax_maxamount",
                "custrecord_lmry_ntax_set_baseretention",
                "custrecord_lmry_ntax_base_amount",
                "custrecord_lmry_ntax_not_taxable_minimum",
                "custrecord_lmry_ntax_taxitem",
                "custrecord_lmry_ntax_taxcode",
                "custrecord_lmry_ntax_department",
                "custrecord_lmry_ntax_class",
                "custrecord_lmry_ntax_location",
                "custrecord_lmry_ntax_credit_account",
                "custrecord_lmry_ntax_debit_account"
            ],
            filters: [
                ["isinactive", "is", "F"],
                "AND",
                ["internalid", "anyof", nationalTaxes],
                "AND",
                ["custrecord_lmry_ntax_transactiontypes", "anyof", tranTypeJSON[recordObj.type]],
                "AND",
                ["custrecord_lmry_ntax_datefrom", "onorbefore", recordObj.getText("trandate")],
                "AND",
                ["custrecord_lmry_ntax_dateto", "onorafter", recordObj.getText("trandate")],
                "AND",
                ["custrecord_lmry_ntax_wht_tax_point", "anyof", ["1", "@NONE@"]]
            ]
        });
        if (featureOW) {
            searchNT.filters.push(search.createFilter({ name: "custrecord_lmry_ntax_subsidiary", operator: "is", values: recordObj.getValue("subsidiary") }));
        }
        let searchResultNT = searchNT.run().getRange({ start: 0, end: 1000 });
        for (let i = 0; i < searchResultNT.length; i++) {
            let internalId = searchResultNT[i].getValue("internalid");
            let generatedTransactionID = searchResultNT[i].getValue("custrecord_lmry_ntax_gen_transaction");
            let generatedTransaction = searchResultNT[i].getText("custrecord_lmry_ntax_gen_transaction");
            let description = searchResultNT[i].getValue("custrecord_lmry_ntax_description");
            let taxtypeID = searchResultNT[i].getValue("custrecord_lmry_ntax_taxtype");
            let taxtype = searchResultNT[i].getText("custrecord_lmry_ntax_taxtype");
            let whttype = searchResultNT[i].getValue("custrecord_lmry_ntax_subtype");
            let subtypeID = searchResultNT[i].getValue("custrecord_lmry_ntax_sub_type");
            let subtype = searchResultNT[i].getText("custrecord_lmry_ntax_sub_type");
            let applies_toID = searchResultNT[i].getValue("custrecord_lmry_ntax_appliesto");
            let applies_to = searchResultNT[i].getText("custrecord_lmry_ntax_appliesto");
            let applies_item = searchResultNT[i].getValue("custrecord_lmry_ntax_applies_to_item");
            let applies_account = searchResultNT[i].getValue("custrecord_lmry_ntax_applies_to_account");
            let taxrate = searchResultNT[i].getValue("custrecord_lmry_co_ntax_taxrate");
            let amount_to = searchResultNT[i].getValue("custrecord_lmry_ntax_amount");
            let ratio = searchResultNT[i].getValue("custrecord_lmry_ntax_addratio");
            let min_amount = searchResultNT[i].getValue("custrecord_lmry_ntax_minamount");
            let max_amount = searchResultNT[i].getValue("custrecord_lmry_ntax_maxamount");
            let set_base_ret = searchResultNT[i].getValue("custrecord_lmry_ntax_set_baseretention");
            let base_amount = searchResultNT[i].getValue("custrecord_lmry_ntax_base_amount");
            let not_taxable = searchResultNT[i].getValue("custrecord_lmry_ntax_not_taxable_minimum");
            let taxitem = searchResultNT[i].getValue("custrecord_lmry_ntax_taxitem");
            let taxcode = searchResultNT[i].getValue("custrecord_lmry_ntax_taxcode");
            let department = searchResultNT[i].getValue("custrecord_lmry_ntax_department");
            let classes = searchResultNT[i].getValue("custrecord_lmry_ntax_class");
            let location = searchResultNT[i].getValue("custrecord_lmry_ntax_location");
            let creditaccount = searchResultNT[i].getValue("custrecord_lmry_ntax_credit_account");
            let debitaccount = searchResultNT[i].getValue("custrecord_lmry_ntax_debit_account");

            jsonNT[internalId] = {
                internalId: internalId,
                generatedTransactionID: generatedTransactionID,
                generatedTransaction: generatedTransaction,
                description: description,
                taxtypeID: taxtypeID,
                taxtype: taxtype,
                whttype: whttype,
                subtypeID: subtypeID,
                subtype: subtype,
                applies_toID: applies_toID,
                applies_to: applies_to,
                applies_item: applies_item,
                applies_account: applies_account,
                taxrate: taxrate,
                amount_to: amount_to,
                ratio: ratio,
                min_amount: min_amount,
                max_amount: max_amount,
                set_base_ret: set_base_ret,
                base_amount: base_amount,
                not_taxable: not_taxable,
                taxitem: taxitem,
                taxcode: taxcode,
                department_nt: department,
                classes_nt: classes,
                location_nt: location,
                creditaccount: creditaccount,
                debitaccount: debitaccount
            };
        }
        log.error("nationalTaxJSON", JSON.stringify(jsonNT));
        return jsonNT;
    };

    const getWHT = (recordObj, sublist, position, dataLine, dataNationalTax, multibook, exchangeRate, itemNames, accountNames, restrict) => {
        // Return data
        let returnData = {};
        if (!dataNationalTax) return returnData;

        let retencion = 0;
        let baseAmount = 0;

        // Conversion de los montos del NT a moneda de la transaccion
        if (dataNationalTax.min_amount == null || dataNationalTax.min_amount == "") {
            dataNationalTax.min_amount = 0;
        }
        dataNationalTax.min_amount = parseFloat(parseFloat(dataNationalTax.min_amount) / exchangeRate);
        if (dataNationalTax.max_amount == null || dataNationalTax.max_amount == "") {
            dataNationalTax.max_amount = 0;
        }
        dataNationalTax.max_amount = parseFloat(parseFloat(dataNationalTax.max_amount) / exchangeRate);
        if (dataNationalTax.set_base_ret == null || dataNationalTax.set_base_ret == "") {
            dataNationalTax.set_base_ret = 0;
        }
        dataNationalTax.set_base_ret = parseFloat(parseFloat(dataNationalTax.set_base_ret) / exchangeRate);
        if (dataNationalTax.not_taxable == null || dataNationalTax.not_taxable == "") {
            dataNationalTax.not_taxable = 0;
        }
        dataNationalTax.not_taxable = parseFloat(parseFloat(dataNationalTax.not_taxable) / exchangeRate);

        if (dataNationalTax.ratio == null || dataNationalTax.ratio == "") {
            dataNationalTax.ratio = 1;
        }

        if (dataNationalTax.description == null || dataNationalTax.description == "") {
            dataNationalTax.description = "";
        }

        let sublistId = sublist;
        let appliesField = dataNationalTax[sublistJSON[sublist].appliesto];

        let idItem = dataLine.value;
        let idItemName = sublistJSON[sublist].line == "item" ? itemNames[dataLine.value] : accountNames[dataLine.value];

        let flagItem = false;
        if (idItem == appliesField || (!dataNationalTax.applies_item && !dataNationalTax.applies_account)) {
            flagItem = true;
        }

        if (!flagItem) {
            return returnData;
        }
        let departmentItem = dataLine["departmentItem"] || dataLine["departmentMain"] || "";
        let classItem = dataLine["classItem"] || dataLine["classMain"] || "";
        let locationItem = dataLine["locationItem"] || dataLine["locationMain"] || "";
        let netamtItem = parseFloat(dataLine["netamtItem"]);
        let taxamtItem = parseFloat(dataLine["taxamtItem"]);
        let taxrateItem = dataLine["taxrateItem"];
        let grossamtItem = parseFloat(dataLine["grossamtItem"]);

        if (taxamtItem == 0 && dataNationalTax.amount_to == 2) {
            return returnData;
        }

        // Calculo del Monto Base
        switch (dataNationalTax.amount_to) {
            case "1":
                baseAmount = parseFloat(grossamtItem) - parseFloat(dataNationalTax.not_taxable);
                break;
            case "2":
                baseAmount = parseFloat(taxamtItem) - parseFloat(dataNationalTax.not_taxable);
                break;
            case "3":
                baseAmount = parseFloat(netamtItem) - parseFloat(dataNationalTax.not_taxable);
                break;
        }
        if (restrict.round && ["invoice", "creditmemo"].includes(recordObj.type)) {
            taxrateItem = parseFloat(taxrateItem);
            baseAmount = getBaseWht(dataNationalTax.amount_to, netamtItem, taxrateItem, exchangeRate);
            baseAmount = parseFloat(baseAmount) - parseFloat(dataNationalTax.not_taxable);
        }
        baseAmount = parseFloat(baseAmount);

        if (dataNationalTax.base_amount != null && dataNationalTax.base_amount != "") {
            switch (dataNationalTax.base_amount) {
                case "2": // Substrac Minimun
                    baseAmount = parseFloat(baseAmount) - parseFloat(dataNationalTax.min_amount);
                    break;
                case "3": // Minimun
                    baseAmount = parseFloat(dataNationalTax.min_amount);
                    break;
                case "4": // Maximun
                    baseAmount = parseFloat(dataNationalTax.max_amount);
                    break;
                case "5": // Substrac Minimun Once
                    baseAmount = parseFloat(baseAmount) - parseFloat(dataNationalTax.min_amount);
                    break;
            }
        }
        baseAmount = parseFloat(baseAmount);
        let compareAmount = Math.abs(baseAmount);
        /**if (baseAmount <= 0) {
            return returnData;
        }*/

        // Calculo de retencion
        if (dataNationalTax.max_amount != 0) {
            if (dataNationalTax.min_amount <= parseFloat(compareAmount) && parseFloat(compareAmount) <= dataNationalTax.max_amount) {
                retencion = (parseFloat(dataNationalTax.taxrate) / 100) * parseFloat(baseAmount) * parseFloat(dataNationalTax.ratio) + parseFloat(dataNationalTax.set_base_ret);
            }
        } else {
            if (dataNationalTax.min_amount <= parseFloat(compareAmount)) {
                retencion = (parseFloat(dataNationalTax.taxrate) / 100) * parseFloat(baseAmount) * parseFloat(dataNationalTax.ratio) + parseFloat(dataNationalTax.set_base_ret);
            }
        }

        //LLENADO DE ARREGLO RETENCION
        //retencion = round2(retencion);
        if (parseFloat(retencion) != 0) {
            let retencionLocal = 0;
            let retencionAux = 0;
            if (restrict.round && ["invoice", "creditmemo"].includes(recordObj.type)) {
                retencionLocal = retencion * exchangeRate;
                retencionAux = round2(round2(retencionLocal) / exchangeRate);
            } else {
                retencionAux = round2(retencion);
                retencionLocal = round2(retencion) * exchangeRate;
            }
            let caso = "";

            sublist != "expense" ? (caso = "4I") : (caso = "4E");

            let approvalInvoice = runtime.getCurrentScript().getParameter({ name: "CUSTOMAPPROVALCUSTINVC" });
            let approvalBill = runtime.getCurrentScript().getParameter({ name: "CUSTOMAPPROVALVENDORBILL" });
            let approvalFeature = ["invoice", "creditmemo"].includes(recordObj.type) ? approvalInvoice : approvalBill;

            returnData = {
                subtype: dataNationalTax.subtype,
                subtypeId: dataNationalTax.subtypeID,
                typeId: dataNationalTax.whttype,
                baseamount: parseFloat(baseAmount),
                grossamtItem: grossamtItem,
                retencion: retencionAux,
                internalid: dataNationalTax.internalId,
                sublist: sublistId,
                rate: dataNationalTax.taxrate,
                caso: caso,
                account1: dataNationalTax.debitaccount,
                account2: dataNationalTax.creditaccount,
                genera: dataNationalTax.generatedTransactionID,
                generaText: dataNationalTax.generatedTransaction,
                department: dataNationalTax.department_nt,
                classes: dataNationalTax.classes_nt,
                location: dataNationalTax.location_nt,
                departmentLine: departmentItem,
                classLine: classItem,
                locationLine: locationItem,
                item: idItem,
                itemName: idItemName,
                lineuniquekey: dataLine.lineuniquekey,
                positionItem: position,
                description: dataNationalTax.description,
                taxcodeReference: dataNationalTax.taxcode,
                itemReference: dataNationalTax.taxitem,
                multibook: multibook,
                exchangerate: exchangeRate,
                approvalFeature: approvalFeature,
                taxTypeId: dataNationalTax.taxtypeID,
                taxType: dataNationalTax.taxtype,
                applies_toID: dataNationalTax.applies_toID,
                applies_to: dataNationalTax.applies_to,
                ratio: dataNationalTax.ratio,
                retencionLocal: retencionLocal
            };
        } //FIN LLENADO ARREGLO RETENCION

        return returnData;
    };

    const round2 = (num) => {
        let e = num >= 0 ? 1e-6 : -1e-6;
        return parseFloat(Math.round(parseFloat(num) * 1e2 + e) / 1e2);
    };

    const getBaseWht = (base, amount, rate, exchangerate) => {
        var result = 0;
        if (base == "3") {
            result = amount * exchangerate;
        }
        if (base == "2") {
            result = amount * exchangerate * (rate / 100);
        }
        if (base == "1") {
            result = amount * exchangerate * (1 + rate / 100);
        }
        result /= exchangerate;
        return result;
    }

    const createJSONResult = (aRetencion, recordObj) => {
        let arrayJSON = [];
        for (let i = 0; i < aRetencion.length; i++) {
            let jsonAuxTemp = {};
            jsonAuxTemp["taxType"] = { text: aRetencion[i].taxType, value: aRetencion[i].taxTypeId };
            jsonAuxTemp["appliesTo"] = { text: aRetencion[i].applies_to, value: aRetencion[i].applies_toID };
            jsonAuxTemp["subType"] = { text: aRetencion[i].subtype, value: aRetencion[i].subtypeId };
            jsonAuxTemp["whtType"] = aRetencion[i].typeId;
            jsonAuxTemp["lineUniqueKey"] = aRetencion[i].lineuniquekey;
            jsonAuxTemp["baseAmount"] = parseFloat(aRetencion[i].baseamount);
            jsonAuxTemp["whtAmount"] = Math.round(aRetencion[i].retencion * 100) / 100;
            jsonAuxTemp["whtRate"] = parseFloat(aRetencion[i].rate / 100);
            jsonAuxTemp["referenceTransaction"] = recordObj.id;
            jsonAuxTemp["nationalTax"] = aRetencion[i].internalid;
            jsonAuxTemp["generatedTransaction"] = { text: aRetencion[i].generaText, value: aRetencion[i].genera };
            if (aRetencion[i].caso.indexOf("I") != -1) {
                jsonAuxTemp["item"] = { text: aRetencion[i].itemName, value: aRetencion[i].item };
            } else {
                jsonAuxTemp["expenseAccount"] = { text: aRetencion[i].itemName, value: aRetencion[i].item };
            }
            jsonAuxTemp["position"] = aRetencion[i].positionItem;
            jsonAuxTemp["description"] = aRetencion[i].description;
            jsonAuxTemp["lc_baseAmount"] = parseFloat(aRetencion[i].baseamount * aRetencion[i].exchangerate);
            jsonAuxTemp["lc_whtAmount"] = parseFloat(aRetencion[i].retencionLocal);
            jsonAuxTemp["lc_grossAmount"] = parseFloat(aRetencion[i].grossamtItem * aRetencion[i].exchangerate);
            jsonAuxTemp["additionalRatio"] = aRetencion[i].ratio;
            jsonAuxTemp["itemReference"] = aRetencion[i].itemReference;
            jsonAuxTemp["taxcodeReference"] = aRetencion[i].taxcodeReference;
            jsonAuxTemp["departmentLine"] = aRetencion[i].departmentLine;
            jsonAuxTemp["classLine"] = aRetencion[i].classLine;
            jsonAuxTemp["locationLine"] = aRetencion[i].locationLine;
            jsonAuxTemp["account1"] = aRetencion[i].account1;
            jsonAuxTemp["account2"] = aRetencion[i].account2;

            arrayJSON.push(jsonAuxTemp);
        }
        let JSONsearch = search.create({
            type: "customrecord_lmry_ste_json_result",
            filters: [["isinactive", "is", "F"], "AND", ["custrecord_lmry_ste_related_transaction", "is", recordObj.id]],
            columns: ["internalid"]
        });
        JSONsearch = JSONsearch.run().getRange(0, 1);
        if (JSONsearch && JSONsearch.length) {
            // Json Result already exists
            let IDJson = JSONsearch[0].getValue("internalid");
            // Update record related
            record.submitFields({
                type: "customrecord_lmry_ste_json_result",
                id: IDJson,
                values: {
                    custrecord_lmry_ste_transaction_date: format.parse({ type: format.Type.DATE, value: recordObj.getValue({ fieldId: "trandate" }) }),
                    custrecord_lmry_ste_wht_transaction: JSON.stringify(arrayJSON),
                    custrecord_lmry_ste_process_status: "4"
                },
                options: {
                    ignoreMandatoryFields: true,
                    disableTriggers: true
                }
            });
            return IDJson;
        } else {
            // Create new Json Result
            let JSON_Record = record.create({
                type: "customrecord_lmry_ste_json_result",
                isDynamic: false
            });
            JSON_Record.setValue({ fieldId: "custrecord_lmry_ste_related_transaction", value: recordObj.id });
            JSON_Record.setValue({ fieldId: "custrecord_lmry_ste_related_trans_id", value: recordObj.id });
            JSON_Record.setValue({ fieldId: "custrecord_lmry_ste_subsidiary", value: recordObj.getValue("subsidiary") });
            JSON_Record.setValue({ fieldId: "custrecord_lmry_ste_subsidiary_country", value: recordObj.getValue("custbody_lmry_subsidiary_country") });
            JSON_Record.setValue({ fieldId: "custrecord_lmry_ste_transaction_date", value: format.parse({ type: format.Type.DATE, value: recordObj.getValue({ fieldId: "trandate" }) }) });
            JSON_Record.setValue({ fieldId: "custrecord_lmry_ste_wht_transaction", value: JSON.stringify(arrayJSON) });
            JSON_Record.setValue({ fieldId: "custrecord_lmry_ste_process_status", value: "4" });
            let IDJson = JSON_Record.save({
                enableSourcing: true,
                ignoreMandatoryFields: true,
                disableTriggers: true
            });
            return IDJson;
        }
    };

    const Validate_EIDocument = (currentRecord) => {
        let isBundleInstalled_CO_LMRY = suiteAppInfo.isBundleInstalled({
            bundleId: 218184
        });
        let isBundleInstalled_Dev_CO = suiteAppInfo.isBundleInstalled({
            bundleId: 218157
        });

        if (isBundleInstalled_CO_LMRY == true || isBundleInstalled_Dev_CO == true) {
            let id_invoice = currentRecord.getValue({
                fieldId: "id"
            });

            if (id_invoice == "" || id_invoice == null) {
                return false;
            }

            let statusDocument = "";

            let searchDocumentAutorizate = search.create({
                type: "customrecord_lmry_ei_docs_status",
                filters: [["custrecord_lmry_ei_ds_doc", "anyof", id_invoice]],
                columns: [search.createColumn({ name: "custrecord_lmry_ei_ds_doc_status", label: "Latam - EI Document Status" })]
            });

            searchDocumentAutorizate.run().each(function (result) {
                statusDocument = result.getValue("custrecord_lmry_ei_ds_doc_status");
                return true;
            });

            if (statusDocument == "AUTORIZADO") {
                return true;
            }
        }
        return false;
    };

    function validateChange(context) {
        const oldRecord = context.oldRecord;
        const newRecord = context.newRecord;

        const oldApprovalStatus = oldRecord.getValue("approvalstatus");
        const approvalStatus = newRecord.getValue("approvalstatus");

        log.debug("oldApprovalStatus, approvalStatus", [oldApprovalStatus, approvalStatus].join(","));
        if (oldApprovalStatus != approvalStatus) {
            return false;
        }

        const oldNumberItem = oldRecord.getLineCount({ sublistId: "item" }) || 0;
        const numberItem = newRecord.getLineCount({ sublistId: "item" }) || 0;

        log.debug("oldNumberItem, numberItem", [oldNumberItem, numberItem].join(","));
        if (oldNumberItem != numberItem) {
            return false;
        }

        for (let i = 0; i < numberItem; i++) {
            let oldAccount = oldRecord.getSublistValue({ sublistId: "item", fieldId: "item", line: i }) || "";
            let account = newRecord.getSublistValue({ sublistId: "item", fieldId: "item", line: i }) || "";

            log.debug("i, oldAccount, account", [i, oldAccount, account].join(","));
            if (oldAccount != account) {
                return false;
            }

            let oldGrossAmt = oldRecord.getSublistValue({ sublistId: "item", fieldId: "grossamt", line: i }) || 0.00;
            oldGrossAmt = parseFloat(oldGrossAmt);

            let grossAmt = newRecord.getSublistValue({ sublistId: "item", fieldId: "grossamt", line: i }) || 0.00;
            grossAmt = parseFloat(grossAmt);

            log.debug("i, oldGrossAmt, grossAmt", [i, oldGrossAmt, grossAmt].join(","));
            if (oldGrossAmt != grossAmt) {
                return false;
            }

            let oldIVA = oldRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_reteiva", line: i }) || "";
            let IVA = newRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_reteiva", line: i }) || "";
            log.debug("i, oldIVA, IVA", [i, oldIVA, IVA].join(","));
            if (oldIVA != IVA) {
                return false;
            }

            let oldICA = oldRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_reteica", line: i }) || "";
            let ICA = newRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_reteica", line: i }) || "";
            log.debug("i, oldICA, ICA", [i, oldICA, ICA].join(","));
            if (oldICA != ICA) {
                return false;
            }

            let oldFTE = oldRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_retefte", line: i }) || "";
            let FTE = newRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_retefte", line: i }) || "";
            log.debug("i, oldFTE, FTE", [i, oldFTE, FTE].join(","));
            if (oldFTE != FTE) {
                return false;
            }

            let oldCREE = oldRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_autoretecree", line: i }) || "";
            let CREE = newRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_autoretecree", line: i }) || "";
            log.debug("i, oldCREE, CREE", [i, oldCREE, CREE].join(","));
            if (oldCREE != CREE) {
                return false;
            }

        }

        if (["vendorbill", "vendorcredit"].includes(newRecord.type)) {
            const oldNumberExpenses = oldRecord.getLineCount({ sublistId: "expense" }) || 0;
            const numberExpenses = newRecord.getLineCount({ sublistId: "expense" }) || 0;

            log.debug("oldNumberExpenses, numberExpenses", [oldNumberExpenses, numberExpenses].join(","));
            if (oldNumberExpenses != numberExpenses) {
                return false;
            }

            for (let i = 0; i < numberExpenses; i++) {
                let oldAccount = oldRecord.getSublistValue({ sublistId: "expense", fieldId: "account", line: i }) || "";
                let account = newRecord.getSublistValue({ sublistId: "expense", fieldId: "account", line: i }) || "";

                log.debug("i, oldAccount, account", [i, oldAccount, account].join(","));
                if (oldAccount != account) {
                    return false;
                }

                let oldGrossAmt = oldRecord.getSublistValue({ sublistId: "expense", fieldId: "grossamt", line: i }) || 0.00;
                oldGrossAmt = parseFloat(oldGrossAmt);

                let grossAmt = newRecord.getSublistValue({ sublistId: "expense", fieldId: "grossamt", line: i }) || 0.00;
                grossAmt = parseFloat(grossAmt);

                log.debug("i, oldGrossAmt, grossAmt", [i, oldGrossAmt, grossAmt].join(","));
                if (oldGrossAmt != grossAmt) {
                    return false;
                }

                let oldIVA = oldRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_reteiva", line: i }) || "";
                let IVA = newRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_reteiva", line: i }) || "";
                log.debug("i, oldIVA, IVA", [i, oldIVA, IVA].join(","));
                if (oldIVA != IVA) {
                    return false;
                }
    
                let oldICA = oldRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_reteica", line: i }) || "";
                let ICA = newRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_reteica", line: i }) || "";
                log.debug("i, oldICA, ICA", [i, oldICA, ICA].join(","));
                if (oldICA != ICA) {
                    return false;
                }
    
                let oldFTE = oldRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_retefte", line: i }) || "";
                let FTE = newRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_retefte", line: i }) || "";
                log.debug("i, oldFTE, FTE", [i, oldFTE, FTE].join(","));
                if (oldFTE != FTE) {
                    return false;
                }
    
                let oldCREE = oldRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_autoretecree", line: i }) || "";
                let CREE = newRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_autoretecree", line: i }) || "";
                log.debug("i, oldCREE, CREE", [i, oldCREE, CREE].join(","));
                if (oldCREE != CREE) {
                    return false;
                }
    
            }
        }

        log.debug("return true", true);
        return true;

    }

    return {
        createWithholdingLines
    };
});