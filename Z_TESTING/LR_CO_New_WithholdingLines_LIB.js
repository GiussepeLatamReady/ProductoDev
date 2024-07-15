/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LR_CO_New_WithholdingLines_LIB.js
 * @Author joshep@latamready.com
 **/
define([
        "N/ui/serverWidget","N/record", "N/search", "N/runtime", "N/log", "N/format", "N/https", "N/suiteAppInfo","N/currentRecord", 
        "SuiteApps/com.latamready.lmrylocalizationcore/lib/licenses/LR_Licenses_LIB", 
        "../../constants/LR_CO_FEATURES_CONST"
    ], 
    function (
                serverWidget,record, search, runtime, log, format, https, suiteAppInfo, currentRecord,
                Lib_Licenses, 
                CO_FEAT
    ) {
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
    
            //log.error("newRecord", newRecord);
            let mode = context.type;
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
    
                    if (!retecree && !retefte && !reteiva && !reteica) {
                        continue;
                    };
    
    
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


            const isActiveVariableRate = getFeatureVariableRate(subsidiary);
            let listVariebleRate = {};
            if (isActiveVariableRate) {
                let dataGeneral = newRecord.getValue("custbody_lmry_features_active");
                if (dataGeneral) listVariebleRate = JSON.parse(dataGeneral);
            }
            
            
            


            // Iteracion de lineas con retenciones
            for (const key in linesJSON) {
                let sublist = key.split("|")[0];
                let position = key.split("|")[1];
    
                if (linesJSON[key].retecree) {
                    let whtData = getWHT(recordObj, sublist, position, linesJSON[key], nationalTaxJSON[linesJSON[key].retecree], multibook, exchangeRate, itemNames, accountNames, restrict,listVariebleRate,"cree");
                    if (Object.keys(whtData).length) {
                        JSONresult.push(whtData);
                        JSONamounts.retecree += round2(whtData.retencionLocal);
                    }
                }
                if (linesJSON[key].retefte) {
                    let whtData = getWHT(recordObj, sublist, position, linesJSON[key], nationalTaxJSON[linesJSON[key].retefte], multibook, exchangeRate, itemNames, accountNames, restrict,listVariebleRate,"fte");
                    if (Object.keys(whtData).length) {
                        JSONresult.push(whtData);
                        JSONamounts.retefte += round2(whtData.retencionLocal);
                    }
                }
                if (linesJSON[key].reteiva) {
                    let whtData = getWHT(recordObj, sublist, position, linesJSON[key], nationalTaxJSON[linesJSON[key].reteiva], multibook, exchangeRate, itemNames, accountNames, restrict,listVariebleRate,"iva");
                    if (Object.keys(whtData).length) {
                        JSONresult.push(whtData);
                        JSONamounts.reteiva += round2(whtData.retencionLocal);
                    }
                }
                if (linesJSON[key].reteica) {
                    let whtData = getWHT(recordObj, sublist, position, linesJSON[key], nationalTaxJSON[linesJSON[key].reteica], multibook, exchangeRate, itemNames, accountNames, restrict,listVariebleRate,"ica");
                    if (Object.keys(whtData).length) {
                        JSONresult.push(whtData);
                        JSONamounts.reteica += round2(whtData.retencionLocal);
                    }
                }
            }
    
            let idJsonResult = createJSONResult(JSONresult, recordObj);
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
        };


        const getFeatureVariableRate = (subsidiary) => {
            const FEAT_SUBS = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' })
            const filters = [
                ["isinactive", "is", "F"]
            ];
            if (FEAT_SUBS === true || FEAT_SUBS === "T") {
                filters.push("AND", ["custrecord_lmry_setuptax_subsidiary", "anyof", subsidiary]);
            }

            const results = search.create({
                type: "customrecord_lmry_setup_tax_subsidiary",
                filters: filters,
                columns: ["custrecord_lmry_co_variable_rate"]
            }).run().getRange(0, 1);
            if (results && results.length) {
                let isVariableRate = results[0].getValue("custrecord_lmry_co_variable_rate");
                return isVariableRate === true || isVariableRate === "T"
            }
            return false;
        }
    
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
            return jsonNT;
        };
    
        const getWHT = (recordObj, sublist, position, dataLine, dataNationalTax, multibook, exchangeRate, itemNames, accountNames, restrict,listVariebleRate,typeWht) => {
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

            if (
                listVariebleRate[sublist] && 
                listVariebleRate[sublist][position] && 
                listVariebleRate[sublist][position][typeWht]
            ) {

                let retencionLocal = 0;
                let retencionAux = 0;
                retencion = listVariebleRate[sublist][position][typeWht].amount;
                retencionAux = round2(retencion / exchangeRate);
                retencionLocal = retencion ;
                baseAmount = listVariebleRate[sublist][position][typeWht].newBasis;
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
                    rate: listVariebleRate[sublist][position][typeWht].newRate,
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
                return returnData;
            }
            if (parseFloat(retencion) != 0 ) {
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
            let result = 0;
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
            const oldDataVariableRate = oldRecord.getValue("custbody_lmry_features_active");
            const dataVariableRate = newRecord.getValue("custbody_lmry_features_active");
            
            if (oldApprovalStatus != approvalStatus) {
                return false;
            }

            if (oldDataVariableRate != dataVariableRate) {
                return false;
            }
    
            const oldNumberItem = oldRecord.getLineCount({ sublistId: "item" }) || 0;
            const numberItem = newRecord.getLineCount({ sublistId: "item" }) || 0;
    
    
            if (oldNumberItem != numberItem) {
                return false;
            }
    
            for (let i = 0; i < numberItem; i++) {
                let oldAccount = oldRecord.getSublistValue({ sublistId: "item", fieldId: "item", line: i }) || "";
                let account = newRecord.getSublistValue({ sublistId: "item", fieldId: "item", line: i }) || "";
    
    
                if (oldAccount != account) {
                    return false;
                }
    
                let oldGrossAmt = oldRecord.getSublistValue({ sublistId: "item", fieldId: "grossamt", line: i }) || 0.00;
                oldGrossAmt = parseFloat(oldGrossAmt);
    
                let grossAmt = newRecord.getSublistValue({ sublistId: "item", fieldId: "grossamt", line: i }) || 0.00;
                grossAmt = parseFloat(grossAmt);
    
    
                if (oldGrossAmt != grossAmt) {
                    return false;
                }
    
                let oldIVA = oldRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_reteiva", line: i }) || "";
                let IVA = newRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_reteiva", line: i }) || "";
    
                if (oldIVA != IVA) {
                    return false;
                }
    
                let oldICA = oldRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_reteica", line: i }) || "";
                let ICA = newRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_reteica", line: i }) || "";
    
                if (oldICA != ICA) {
                    return false;
                }
    
                let oldFTE = oldRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_retefte", line: i }) || "";
                let FTE = newRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_retefte", line: i }) || "";
    
                if (oldFTE != FTE) {
                    return false;
                }
    
                let oldCREE = oldRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_autoretecree", line: i }) || "";
                let CREE = newRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_co_autoretecree", line: i }) || "";
    
                if (oldCREE != CREE) {
                    return false;
                }
    
            }
    
            if (["vendorbill", "vendorcredit"].includes(newRecord.type)) {
                const oldNumberExpenses = oldRecord.getLineCount({ sublistId: "expense" }) || 0;
                const numberExpenses = newRecord.getLineCount({ sublistId: "expense" }) || 0;
    
    
                if (oldNumberExpenses != numberExpenses) {
                    return false;
                }
    
                for (let i = 0; i < numberExpenses; i++) {
                    let oldAccount = oldRecord.getSublistValue({ sublistId: "expense", fieldId: "account", line: i }) || "";
                    let account = newRecord.getSublistValue({ sublistId: "expense", fieldId: "account", line: i }) || "";
    
    
                    if (oldAccount != account) {
                        return false;
                    }
    
                    let oldGrossAmt = oldRecord.getSublistValue({ sublistId: "expense", fieldId: "grossamt", line: i }) || 0.00;
                    oldGrossAmt = parseFloat(oldGrossAmt);
    
                    let grossAmt = newRecord.getSublistValue({ sublistId: "expense", fieldId: "grossamt", line: i }) || 0.00;
                    grossAmt = parseFloat(grossAmt);
    
    
                    if (oldGrossAmt != grossAmt) {
                        return false;
                    }
    
                    let oldIVA = oldRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_reteiva", line: i }) || "";
                    let IVA = newRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_reteiva", line: i }) || "";
    
                    if (oldIVA != IVA) {
                        return false;
                    }
    
                    let oldICA = oldRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_reteica", line: i }) || "";
                    let ICA = newRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_reteica", line: i }) || "";
    
                    if (oldICA != ICA) {
                        return false;
                    }
    
                    let oldFTE = oldRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_retefte", line: i }) || "";
                    let FTE = newRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_retefte", line: i }) || "";
    
                    if (oldFTE != FTE) {
                        return false;
                    }
    
                    let oldCREE = oldRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_autoretecree", line: i }) || "";
                    let CREE = newRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_lmry_co_autoretecree", line: i }) || "";
    
                    if (oldCREE != CREE) {
                        return false;
                    }
    
                }
            }
            return true;
    
        }
    
        const getReteDetails = (newRecord,type) => {
            let elements = [];
    
            const countItems = newRecord.getLineCount({
                sublistId: type
            });
            for (let i = 0; i < countItems; i++) {
                let whtObject = {
                    fte:{},
                    cree:{},
                    iva:{},
                    ica:{}
                };

                whtObject.item = newRecord.getSublistText({
                    sublistId: type,
                    fieldId: type == "item"? type:"account",
                    line: i
                });

                whtObject.fte.value = newRecord.getSublistValue({
                    sublistId: type,
                    fieldId: "custcol_lmry_co_retefte",
                    line: i
                }) || 0;
                whtObject.fte.text = newRecord.getSublistText({
                    sublistId: type,
                    fieldId: "custcol_lmry_co_retefte",
                    line: i
                }) || 0;
                whtObject.ica.value = newRecord.getSublistValue({
                    sublistId: type,
                    fieldId: "custcol_lmry_co_reteica",
                    line: i
                }) || 0;
                whtObject.ica.text = newRecord.getSublistText({
                    sublistId: type,
                    fieldId: "custcol_lmry_co_reteica",
                    line: i
                });
                whtObject.iva.value = newRecord.getSublistValue({
                    sublistId: type,
                    fieldId: "custcol_lmry_co_reteiva",
                    line: i
                }) || 0;
                whtObject.iva.text = newRecord.getSublistText({
                    sublistId: type,
                    fieldId: "custcol_lmry_co_reteiva",
                    line: i
                });
                whtObject.cree.value = newRecord.getSublistValue({
                    sublistId: type,
                    fieldId: "custcol_lmry_co_autoretecree",
                    line: i
                }) || 0;
                whtObject.cree.text = newRecord.getSublistText({
                    sublistId: type,
                    fieldId: "custcol_lmry_co_autoretecree",
                    line: i
                });
                elements.push(whtObject);
            }
            return elements;
        }
    
        const createSublistVariableRate = (context) => {


            try {
                //Creacion de La lista de items
                const { form, newRecord } = context;


                let dataGeneral = newRecord.getValue("custbody_lmry_features_active");

                if (dataGeneral) {
                    dataGeneral = JSON.parse(dataGeneral);
                    if (dataGeneral.item) {
                        let sublistItems = form.addSublist({
                            id: "custpage_sublit_items",
                            type: serverWidget.SublistType.LIST,
                            label: "Variable Rate (Items)",
                            tab: "items"
                        });
                        let fieldsItems = [
                            { id: 'custpage_list_i_item', label: "Item", type: serverWidget.FieldType.TEXT }
                        ];
                        let activeWht = {
                            cree: false,
                            fte: false,
                            iva: false,
                            ica: false
                        }
                        dataGeneral.item.forEach(function (item) {
                            if (item.cree && item.cree.amount) activeWht.cree = true;
                            if (item.fte && item.fte.amount) activeWht.fte = true;
                            if (item.ica && item.ica.amount) activeWht.ica = true;
                            if (item.iva && item.iva.amount) activeWht.iva = true;
                        });

                        if (activeWht.cree) {
                            fieldsItems.push(
                                { id: 'custpage_list_i_cree_details', label: "LATAM - CO RETECREE DETAILS", type: serverWidget.FieldType.SELECT },
                                { id: 'custpage_list_i_cree_basis', label: "LATAM - CO RETECREE NEW BASIS", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_i_cree_rate', label: "LATAM - CO RETECREE NEW RATE", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_i_cree_amount', label: "LATAM - CO RETECREE AMOUNT", type: serverWidget.FieldType.TEXT }
                            );
                        }
                        if (activeWht.fte) {
                            fieldsItems.push(
                                { id: 'custpage_list_i_fte_details', label: "LATAM - CO RETEFTE DETAILS", type: serverWidget.FieldType.SELECT },
                                { id: 'custpage_list_i_fte_basis', label: "LATAM - CO RETEFTE NEW BASIS", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_i_fte_rate', label: "LATAM - CO RETEFTE NEW RATE", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_i_fte_amount', label: "LATAM - CO RETEFTE AMOUNT", type: serverWidget.FieldType.TEXT }
                            );
                        }
                        if (activeWht.ica) {
                            fieldsItems.push(
                                { id: 'custpage_list_i_ica_details', label: "LATAM - CO RETEICA DETAILS", type: serverWidget.FieldType.SELECT },
                                { id: 'custpage_list_i_ica_basis', label: "LATAM - CO RETEICA NEW BASIS", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_i_ica_rate', label: "LATAM - CO RETEICA NEW RATE", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_i_ica_amount', label: "LATAM - CO RETEICA AMOUNT", type: serverWidget.FieldType.TEXT }
                            );
                        }

                        if (activeWht.iva) {
                            fieldsItems.push(
                                { id: 'custpage_list_i_iva_details', label: "LATAM - CO RETEIVA DETAILS", type: serverWidget.FieldType.SELECT },
                                { id: 'custpage_list_i_iva_basis', label: "LATAM - CO RETEIVA NEW BASIS", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_i_iva_rate', label: "LATAM - CO RETEIVA NEW RATE", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_i_iva_amount', label: "LATAM - CO RETEIVA AMOUNT", type: serverWidget.FieldType.TEXT }
                            );
                        }

                        fieldsItems.forEach(fieldInfo => {
                            sublistItems.addField(fieldInfo);
                        });

                        // cargar national taxes

                        const nationalTaxes = getReteDetails(newRecord, "item");


                        let sublist = form.getSublist({ id: 'custpage_sublit_items' });
                        dataGeneral.item.forEach(function (item, i) {

                            if (nationalTaxes[i].item) {
                                sublist.setSublistValue({ id: 'custpage_list_i_item', line: i, value: nationalTaxes[i].item });
                            }
                            if (item.cree && activeWht.cree) {
                                let retecree = sublist.getField({
                                    id: 'custpage_list_i_cree_details'
                                });
                                if (nationalTaxes[i].cree && nationalTaxes[i].cree.value) {
                                    retecree.addSelectOption({
                                        value: nationalTaxes[i].cree.value,
                                        text: nationalTaxes[i].cree.text
                                    });
                                    sublist.setSublistValue({ id: 'custpage_list_i_cree_details', line: i, value: item.cree.nationalTax });
                                }


                                sublist.setSublistValue({ id: 'custpage_list_i_cree_basis', line: i, value: item.cree.newBasis });
                                sublist.setSublistValue({ id: 'custpage_list_i_cree_rate', line: i, value: item.cree.newRate });
                                sublist.setSublistValue({ id: 'custpage_list_i_cree_amount', line: i, value: item.cree.amount });
                            }

                            if (item.fte&& activeWht.fte) {
                                let retefte = sublist.getField({
                                    id: 'custpage_list_i_fte_details'
                                });
                                if (nationalTaxes[i].fte && nationalTaxes[i].fte.value) {
                                    retefte.addSelectOption({
                                        value: nationalTaxes[i].fte.value,
                                        text: nationalTaxes[i].fte.text
                                    });
                                    sublist.setSublistValue({ id: 'custpage_list_i_fte_details', line: i, value: item.fte.nationalTax });
                                }

                                sublist.setSublistValue({ id: 'custpage_list_i_fte_basis', line: i, value: item.fte.newBasis });
                                sublist.setSublistValue({ id: 'custpage_list_i_fte_rate', line: i, value: item.fte.newRate });
                                sublist.setSublistValue({ id: 'custpage_list_i_fte_amount', line: i, value: item.fte.amount });
                            }

                            if (item.iva && activeWht.iva) {
                                let reteiva = sublist.getField({
                                    id: 'custpage_list_i_iva_details'
                                });
                                if (nationalTaxes[i].fte && nationalTaxes[i].iva.value) {
                                    reteiva.addSelectOption({
                                        value: nationalTaxes[i].iva.value,
                                        text: nationalTaxes[i].iva.text
                                    });
                                    sublist.setSublistValue({ id: 'custpage_list_i_iva_details', line: i, value: item.iva.nationalTax });
                                }

                                sublist.setSublistValue({ id: 'custpage_list_i_iva_basis', line: i, value: item.iva.newBasis });
                                sublist.setSublistValue({ id: 'custpage_list_i_iva_rate', line: i, value: item.iva.newRate });
                                sublist.setSublistValue({ id: 'custpage_list_i_iva_amount', line: i, value: item.iva.amount });
                            }

                            if (item.ica && activeWht.ica) {
                                let reteica = sublist.getField({
                                    id: 'custpage_list_i_ica_details'
                                });
                                if (nationalTaxes[i].ica && nationalTaxes[i].ica.value) {
                                    reteica.addSelectOption({
                                        value: nationalTaxes[i].ica.value,
                                        text: nationalTaxes[i].ica.text
                                    });
                                    sublist.setSublistValue({ id: 'custpage_list_i_ica_details', line: i, value: item.ica.nationalTax });
                                }

                                sublist.setSublistValue({ id: 'custpage_list_i_ica_basis', line: i, value: item.ica.newBasis });
                                sublist.setSublistValue({ id: 'custpage_list_i_ica_rate', line: i, value: item.ica.newRate });
                                sublist.setSublistValue({ id: 'custpage_list_i_ica_amount', line: i, value: item.ica.amount });
                            }

                        });

                    }

                    if (dataGeneral.expense) {
                        let sublistExpense = form.addSublist({
                            id: "custpage_sublit_expense",
                            type: serverWidget.SublistType.LIST,
                            label: "Variable Rate (Expense)",
                            tab: "items"
                        });
                        let fieldsExpense = [
                            { id: 'custpage_list_e_item', label: "Account", type: serverWidget.FieldType.TEXT }
                        ];
                        let activeWht = {
                            cree: false,
                            fte: false,
                            iva: false,
                            ica: false
                        }
                        dataGeneral.expense.forEach(function (expense) {
                            if (expense.cree) activeWht.cree = true;
                            if (expense.fte) activeWht.fte = true;
                            if (expense.ica) activeWht.ica = true;
                            if (expense.iva) activeWht.iva = true;
                        });

                        if (activeWht.cree) {
                            fieldsExpense.push(
                                { id: 'custpage_list_e_cree_details', label: "LATAM - CO RETECREE DETAILS", type: serverWidget.FieldType.SELECT },
                                { id: 'custpage_list_e_cree_basis', label: "LATAM - CO RETECREE NEW BASIS", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_e_cree_rate', label: "LATAM - CO RETECREE NEW RATE", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_e_cree_amount', label: "LATAM - CO RETECREE AMOUNT", type: serverWidget.FieldType.TEXT }
                            );
                        }
                        if (activeWht.fte) {
                            fieldsExpense.push(
                                { id: 'custpage_list_e_fte_details', label: "LATAM - CO RETEFTE DETAILS", type: serverWidget.FieldType.SELECT },
                                { id: 'custpage_list_e_fte_basis', label: "LATAM - CO RETEFTE NEW BASIS", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_e_fte_rate', label: "LATAM - CO RETEFTE NEW RATE", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_e_fte_amount', label: "LATAM - CO RETEFTE AMOUNT", type: serverWidget.FieldType.TEXT }
                            );
                        }
                        if (activeWht.ica) {
                            fieldsExpense.push(
                                { id: 'custpage_list_e_ica_details', label: "LATAM - CO RETEICA DETAILS", type: serverWidget.FieldType.SELECT },
                                { id: 'custpage_list_e_ica_basis', label: "LATAM - CO RETEICA NEW BASIS", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_e_ica_rate', label: "LATAM - CO RETEICA NEW RATE", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_e_ica_amount', label: "LATAM - CO RETEICA AMOUNT", type: serverWidget.FieldType.TEXT }
                            );
                        }

                        if (activeWht.iva) {
                            fieldsExpense.push(
                                { id: 'custpage_list_e_iva_details', label: "LATAM - CO RETEIVA DETAILS", type: serverWidget.FieldType.SELECT },
                                { id: 'custpage_list_e_iva_basis', label: "LATAM - CO RETEIVA NEW BASIS", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_e_iva_rate', label: "LATAM - CO RETEIVA NEW RATE", type: serverWidget.FieldType.TEXT },
                                { id: 'custpage_list_e_iva_amount', label: "LATAM - CO RETEIVA AMOUNT", type: serverWidget.FieldType.TEXT }
                            );
                        }


                        fieldsExpense.forEach(fieldInfo => {
                            sublistExpense.addField(fieldInfo);
                        });

                        const nationalTaxes = getReteDetails(newRecord, "expense");

                        let sublist = form.getSublist({ id: 'custpage_sublit_expense' });
                        dataGeneral.expense.forEach(function (expense, i) {
                            if (nationalTaxes[i].item) {
                                sublist.setSublistValue({ id: 'ccustpage_list_e_item', line: i, value: nationalTaxes[i].item });
                            }
                            if (expense.cree && activeWht.cree) {
                                let retecree = sublist.getField({
                                    id: 'custpage_list_e_cree_details'
                                });
                                if (nationalTaxes[i].cree && nationalTaxes[i].cree.value) {
                                    retecree.addSelectOption({
                                        value: nationalTaxes[i].cree.value,
                                        text: nationalTaxes[i].cree.text
                                    });
                                    sublist.setSublistValue({ id: 'custpage_list_e_cree_details', line: i, value: expense.cree.nationalTax });
                                }

                                sublist.setSublistValue({ id: 'custpage_list_e_cree_basis', line: i, value: expense.cree.newBasis });
                                sublist.setSublistValue({ id: 'custpage_list_e_cree_rate', line: i, value: expense.cree.newRate });
                                sublist.setSublistValue({ id: 'custpage_list_e_cree_amount', line: i, value: expense.cree.amount });
                            }

                            if (expense.fte && activeWht.fte) {
                                let retefte = sublist.getField({
                                    id: 'custpage_list_e_fte_details'
                                });
                                if (nationalTaxes[i].fte && nationalTaxes[i].fte.value) {
                                    retefte.addSelectOption({
                                        value: nationalTaxes[i].fte.value,
                                        text: nationalTaxes[i].fte.text
                                    });
                                    sublist.setSublistValue({ id: 'custpage_list_e_fte_details', line: i, value: expense.fte.nationalTax });
                                }

                                sublist.setSublistValue({ id: 'custpage_list_e_fte_basis', line: i, value: expense.fte.newBasis });
                                sublist.setSublistValue({ id: 'custpage_list_e_fte_rate', line: i, value: expense.fte.newRate });
                                sublist.setSublistValue({ id: 'custpage_list_e_fte_amount', line: i, value: expense.fte.amount });
                            }

                            if (expense.iva && activeWht.iva) {
                                let reteiva = sublist.getField({
                                    id: 'custpage_list_e_iva_details'
                                });
                                if (nationalTaxes[i].fte && nationalTaxes[i].iva.value) {
                                    reteiva.addSelectOption({
                                        value: nationalTaxes[i].iva.value,
                                        text: nationalTaxes[i].iva.text
                                    });
                                    sublist.setSublistValue({ id: 'custpage_list_e_iva_details', line: i, value: expense.iva.nationalTax });
                                }

                                sublist.setSublistValue({ id: 'custpage_list_e_iva_basis', line: i, value: expense.iva.newBasis });
                                sublist.setSublistValue({ id: 'custpage_list_e_iva_rate', line: i, value: expense.iva.newRate });
                                sublist.setSublistValue({ id: 'custpage_list_e_iva_amount', line: i, value: expense.iva.amount });
                            }

                            if (expense.ica && activeWht.ica) {
                                let reteica = sublist.getField({
                                    id: 'custpage_list_e_ica_details'
                                });
                                if (nationalTaxes[i].ica && nationalTaxes[i].ica.value) {
                                    reteica.addSelectOption({
                                        value: nationalTaxes[i].ica.value,
                                        text: nationalTaxes[i].ica.text
                                    });
                                    sublist.setSublistValue({ id: 'custpage_list_e_ica_details', line: i, value: expense.ica.nationalTax });
                                }

                                sublist.setSublistValue({ id: 'custpage_list_e_ica_basis', line: i, value: expense.ica.newBasis });
                                sublist.setSublistValue({ id: 'custpage_list_e_ica_rate', line: i, value: expense.ica.newRate });
                                sublist.setSublistValue({ id: 'custpage_list_e_ica_amount', line: i, value: expense.ica.amount });
                            }
                        });
                    }
                };
            } catch (error) {
                log.error('Error [createSublistVariableRate]', error)
                log.error('Error [createSublistVariableRate] message', error.message)
                log.error('Error [createSublistVariableRate] stack', error.stack)
            }


        }
               
        const createFields = (context) => {
            const {form} = context;
    
            
            
            let itemSublist = form.getSublist({
                id: 'item'
            });
    
    
            itemSublist.addField({
                id: 'custpage_co_variable_rate',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Latam col - co Variable rate'
            });
    
            itemSublist.addField({
                id: 'custpage_co_variable_rate_data',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Latam col - co tarifa variable data'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
    
    
            let expenseSublist = form.getSublist({
                id: 'expense'
            });
    
    
            expenseSublist.addField({
                id: 'custpage_co_variable_rate_expense',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Latam col - co Variable rate'
            });
    
            expenseSublist.addField({
                id: 'custpage_co_variable_rate_data_expense',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Latam col - co tarifa variable data'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
        
        }
    
        const saveWhtVariableRate = (context) => {
            try {
                const {newRecord} = context;
                let resultWht = {};
                
                const saveWhtVariableRate = (resultWht,sublist) => {
    
                    const countItems = newRecord.getLineCount({
                        sublistId: sublist
                    });
                    let elements = [];
                    let fieldId = sublist == "item" ? 'custpage_co_variable_rate_data' : 'custpage_co_variable_rate_data_expense';
                    for (let i = 0; i < countItems; i++) {
                        let dataLine = newRecord.getSublistValue({
                            sublistId: sublist,
                            fieldId: fieldId,
                            line: i
                        });
                        let existRetention = {
                            cree:newRecord.getSublistValue({
                                sublistId: sublist,
                                fieldId: sublist == "item" ? 'custpage_lmry_co_autoretecree' : 'custpage_lmry_co_retecree_exp',
                                line: i
                            }),
                            fte:newRecord.getSublistValue({
                                sublistId: sublist,
                                fieldId: sublist == "item" ? 'custpage_lmry_co_retefte' : 'custpage_lmry_co_retefte_exp',
                                line: i
                            }),
                            iva:newRecord.getSublistValue({
                                sublistId: sublist,
                                fieldId: sublist == "item" ? 'custpage_lmry_co_reteiva' : 'custpage_lmry_co_reteiva_exp',
                                line: i
                            }),
                            ica:newRecord.getSublistValue({
                                sublistId: sublist,
                                fieldId: sublist == "item" ? 'custpage_lmry_co_reteica' : 'custpage_lmry_co_reteica_exp',
                                line: i
                            })
                        }
                        //elimina las retenciones que se han dejado de escoger despues de guardar el popup
                        if (dataLine) {
                            
                            dataLine = JSON.parse(dataLine);
                            for (const retention in dataLine) {
                                if (existRetention[retention] != dataLine[retention].nationalTax) {
                                    delete dataLine[retention];
                                }
                            }
                            if (Object.keys(dataLine).length) {
                                elements.push(dataLine);
                            }
                            
                        }
                        
                    }
            
                    if (elements.length) {
                        resultWht[sublist] = elements;
                    }
                }
        
                saveWhtVariableRate(resultWht,"item");
                saveWhtVariableRate(resultWht,"expense");
        
                if (Object.keys(resultWht).length) {
                    newRecord.setValue("custbody_lmry_features_active",JSON.stringify(resultWht));
                } 
            } catch (error) {
               log.error('Error [saveWhtVariableRate]', error)
               log.error('Error [saveWhtVariableRate] stack', error.stack)
            }
            
    
        }


        const hiddenField = (form,fieldId) => {
            const field = form.getField(fieldId);
            if (field && JSON.stringify(field) != '{}') {
                field.updateDisplayType({displayType:'hidden'});
                return field;
            } 
        }

        const hiddenMainFields = (form) =>{
            const mainRetentionFields = [
                'custbody_lmry_co_reteica',
                'custbody_lmry_co_reteiva',
                'custbody_lmry_co_retefte',
                'custbody_lmry_co_autoretecree'
            ]
            mainRetentionFields.forEach(fieldId => hiddenField(form,fieldId));

        }

        const getNationalTaxForRetention = (context) => {
            const {form,newRecord} = context;
            const jsonTransaction = { invoice: '1', creditmemo: '8', vendorbill: '4', vendorcredit: '7' };
            const FEATURE_SUBSIDIARY = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
            let nationalTaxes = {
                iva:{
                    ids:[82,18],
                    list:[]
                },
                ica:{
                    ids:[83,19],
                    list:[]
                },
                fte:{
                    ids:[85,21],
                    list:[]
                },
                cree:{
                    ids:[84,20],
                    list:[]
                }
            }
            let transaction = {
                type:newRecord.type,
                subsidiary: newRecord.getValue("subsidiary")
            };
            
            let filters = [
                ["isinactive", "is", "F"],
                "AND",
                ["custrecord_lmry_ntax_subsidiary_country", "anyof", "48"],
                "AND",
                ["custrecord_lmry_ntax_sub_type", "anyof", ["20", "84", "85", "21", "83", "19", "82", "18"]],//ReteCree,ReteFte,ReteICA,ReteIVA
                "AND",
                ["custrecord_lmry_ntax_gen_transaction", "anyof", "5"],
                "AND",
                ["custrecord_lmry_ntax_taxtype", "anyof", "1"],
                "AND",
                ["custrecord_lmry_ntax_transactiontypes", "anyof", jsonTransaction[transaction.type]]
            ];

            if (FEATURE_SUBSIDIARY == true || FEATURE_SUBSIDIARY == 'T') {
                filters.push("AND", ["custrecord_lmry_ntax_subsidiary", "anyof", transaction.subsidiary]);
            }

            const columns = [
                "internalid", 
                "custrecord_lmry_ntax_sub_type", 
                search.createColumn({
                    name: "name",
                    sort: search.Sort.ASC,
                    label: "Name"
                })
            ];

            search.create({
                type: 'customrecord_lmry_national_taxes',
                filters: filters,
                columns: columns
            }).run().each(result => {
                periodIds.push(result.getValue(result.columns[0]));
                const id = result.getValue("internalid");
                const name = result.getValue("name");
                const subType = result.getValue("custrecord_lmry_ntax_sub_type");
                if (id && name && subType) {
                    for (let retention of Object.values(nationalTaxes)) {
                        if (retention.ids.includes(subType)) {
                            retention.list.push({id,name})
                        }
                    }
                }
                return true;
            });

            return nationalTaxes;
        }


        const manageRetentionFields = (context) => {
            const {form,newRecord, type} = context
            const {type:transaccionType} = newRecord;
            hiddenMainFields(form);
            if (['create','edit','copy'].includes(type)) {
                const nationalTaxes = getNationalTaxForRetention(context);
                setLineFields(context,nationalTaxes,transaccionType);
            }
        }


        
        

        const setLineFields = (context,nationalTaxes,transaccionType) => {
            const {form,newRecord} = context;
            const fillFieldCustpage = (sublist,retentionField,retentionKey) => {
                const {custcol,cuspage} = retentionField;
                const fieldCustCol = hiddenField(sublist,custcol);

                if (fieldCustCol) {
                    let fieldCustPage = itemSublist.addField({
                        id: cuspage.id,
                        type: serverWidget.FieldType.SELECT,
                        label: cuspage.name
                    });

                    const retentionList = nationalTaxes[retentionKey].list;
                    fieldCustPage.addSelectOption({value: '', text: '&nbsp;'});
                    retentionList.forEach(({id,name}) => {
                        fieldCustPage.addSelectOption({
                            value: id,
                            text: name
                        });
                    });
                }
            }

            const setFieldCustpage = (sublistId, lineRetentionFields) => {
                const lines = newRecord.getLineCount({ sublistId });
                for (let i = 0; i < lines; i++) {
                    for (let retentionField of Object.values(lineRetentionFields)) {
                        const custcolValue = newRecord.getSublistValue({
                            sublistId: sublistId,
                            fieldId: retentionField.custcol,
                            line: i
                        });

                        if (custcolValue) {
                            expenseSublist.setSublistValue({
                                id: retentionField.cuspage.id,
                                line: i,
                                value: custcolValue
                            });
                        }
                    }
                }
            }

            //Items
            const lineRetentionFieldsItems = {
                cree: {
                    custcol:"custcol_lmry_co_autoretecree",
                    cuspage:{
                        id:"custpage_lmry_co_autoretecree",
                        name:"Latam - CO ReteCREE detail"
                    }
                },
                fte: {
                    custcol:"custcol_lmry_co_retefte",
                    cuspage:{
                        id:"custpage_lmry_co_retefte",
                        name:"Latam - CO ReteFte detail"
                    }
                },
                ica: {
                    custcol:"custcol_lmry_co_reteica",
                    cuspage:{
                        id:"custpage_lmry_co_reteica",
                        name:"Latam - CO ReteICA detail"
                    }
                },
                iva: {
                    custcol:"custcol_lmry_co_reteiva",
                    cuspage:{
                        id:"custpage_lmry_co_reteiva",
                        name:"Latam - CO ReteIVA detail"
                    }
                }
                
            }
            
            const itemSublist = form.getSublist({id:'item'});
            

            for (let retentionKey in lineRetentionFieldsItems) {
                const retentionField = lineRetentionFieldsItems[retentionKey];
                fillFieldCustpage(itemSublist,retentionField,retentionKey);
            }


            setFieldCustpage("item",lineRetentionFieldsItems)

            if (['vendorbill','vendorcredit'].includes(transaccionType)) {
                //expense
                const lineRetentionFieldsExpense = {
                    cree: {
                        custcol: "custcol_lmry_co_autoretecree",
                        cuspage: {
                            id: "custpage_lmry_co_retecree_exp",
                            name: "Latam - CO ReteCREE detail"
                        }
                    },
                    fte: {
                        custcol: "custcol_lmry_co_retefte",
                        cuspage: {
                            id: "custpage_lmry_co_retefte_exp",
                            name: "Latam - CO ReteFte detail"
                        }
                    },
                    ica: {
                        custcol: "custcol_lmry_co_reteica",
                        cuspage: {
                            id: "custpage_lmry_co_reteica_exp",
                            name: "Latam - CO ReteICA detail"
                        }
                    },
                    iva: {
                        custcol: "custcol_lmry_co_reteiva",
                        cuspage: {
                            id: "custpage_lmry_co_reteiva_exp",
                            name: "Latam - CO ReteIVA detail"
                        }
                    }
                    
                }

                const expenseSublist = form.getSublist({ id: 'expense' });
                
                for (let retentionKey in lineRetentionFieldsExpense) {
                    const retentionField = lineRetentionFieldsExpense[retentionKey];
                    fillFieldCustpage(expenseSublist, retentionField, retentionKey);
                }

                setFieldCustpage("expense",lineRetentionFieldsExpense)
            }
            

        }

        const hiddenLineFields = (form) =>{
            const lineFields = [
                'custcol_lmry_co_autoretecree',
                'custcol_lmry_co_reteiva',
                'custcol_lmry_co_reteica',
                'custcol_lmry_co_retefte'
            ]
            const sublistItem = form.getSublist({id:'item'});
            if (sublistItem && JSON.stringify(sublistItem) != '{}') {
                lineFields.forEach(fieldId => hiddenField(sublistItem,fieldId));
            }

            const sublistExpense = form.getSublist({id:'expense'});
            if (sublistExpense && JSON.stringify(sublistExpense) != '{}') {
                lineFields.forEach(fieldId => hiddenField(sublistExpense,fieldId));
            }
        }

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
          
            const pathScript = {
              "vendorbill" : "./LMRY_VendorBill_CO_CLNT_HNDL.js",
              "vendorcredit" : "./LMRY_VendorCredit_CO_CLNT_HNDL.js",
              "invoice" : "./LMRY_Invoice_CO_CLNT_HNDL.js",
              "creditmemo": "./LMRY_CreditMemo_CO_CLNT_HNDL.js"
            }
          
            form.clientScriptModulePath = pathScript[type];
          
            if (hasRetencion) {
              form.getButton({ id: 'custpage_id_button_ud_whx' }).isDisabled = true;
            }
          
        };


        const updateRetention = (type) => {
            const {id} = currentRecord.get();
            const transactionID = Number(id) || "";
            const transactionRecord = record.load({ type, id: transactionID });
            const entityId = transactionRecord.getValue("entity");

            if (entityId) {
                const transactionTypes = {
                    "invoice": "1",
                    "vendorbill": "4", 
                    "vendorcredit": "7",
                    "creditmemo": "8"
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

                    const columns = [
                                        "custrecord_lmry_co_retefte", 
                                        "custrecord_lmry_co_autoretecree", 
                                        "custrecord_lmry_co_reteica", 
                                        "custrecord_lmry_co_reteiva"
                                    ];
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
        };
    
        return {
            createWithholdingLines,
            createFields,
            createSublistVariableRate,
            saveWhtVariableRate,
            getFeatureVariableRate,
            hiddenLineFields,
            createWhtUpdateButton,
            updateRetention,
            manageRetentionFields,
            setLinesValueRetention
        };
    });