let search; require(["N/search"], function (sear) { search = sear; });
let runtime; require(["N/runtime"], function (runt) { runtime = runt; });
let format; require(["N/format"], function (form) { format = form; });
let record; require(["N/record"], function (rec) { record = rec; });


var FeaDepa = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
var FeaLoca = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
var FeaClas = runtime.isFeatureInEffect({ feature: "CLASSES" });

//activacion de Accounting Preferences
var userObj = runtime.getCurrentUser();
var pref_dep = userObj.getPreference({ name: "DEPTMANDATORY" });
var pref_loc = userObj.getPreference({ name: "LOCMANDATORY" });
var pref_clas = userObj.getPreference({ name: "CLASSMANDATORY" });

// One World o Mismarket
var subsi_OW = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
var featureMB = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });



var sumaPercepciones = 0;



var recordObj = record.load({
    type: 'vendor',
    id: "6340"
});
var numLines = 1;
var soloItems = 1;
var cantidad = 0;


processPerception("90308161", "AR", "edit", false, "");


function processPerception(idTransaction, CodeCountry, evento, isMassive, objTransaction) {

    try {
        if (evento == "create" || evento == "edit") {
            // Registro actual


            var transactionRecord = record.load(
                {
                    id: idTransaction,
                    type: "creditmemo",
                    //isDynamic: true
                }
            );


            /********************************************
             * Valida si tiene activo el feature para
             * realizar la autopercepcion y descuento
             * por pais.
             ********************************************/


            numLines = transactionRecord.getLineCount('item');
            soloItems = numLines;

            // Logica de Auto Percepciones por Linea
            calculatePerception(transactionRecord, numLines, CodeCountry, evento, isMassive);

        }
    } catch (msg) {
        // Envio de mail con errores
        //log.error('Percepciones', msg);
        //LibraryMail.sendemail('[ beforeSubmit ] ' + msg, Name_script);
    }

}
function isValid(bool) {
    return (bool === "T" || bool === true);
}

function validateStatus(transactionId) {
    var status = false;
    var countRegister = 0;
    if (transactionId) {
        search.create({
            type: "customrecord_lmry_ei_docs_status",
            filters: [
                ['custrecord_lmry_ei_ds_doc', 'anyof', transactionId]
            ],
            columns: [
                'custrecord_lmry_ei_ds_doc_status'
            ]
        }).run().each(function (result) {
            var statusText = result.getValue(result.columns[0]).toUpperCase().trim();
            status = (statusText !== "APROBADO" || statusText !== "OBSERVADO")
            countRegister++;
        });
    }
    return {
        notSend: status,
        countRegister: countRegister
    };
}

function getSetupTaxSubsidiary(subsidiary) {
    var jsonSetup = {}
    var filtros_setuptax = new Array();
    filtros_setuptax[0] = search.createFilter({ name: 'isinactive', operator: 'is', values: ['F'] });
    if (true) {
        filtros_setuptax[1] = search.createFilter({ name: 'custrecord_lmry_setuptax_subsidiary', operator: 'is', values: subsidiary });
    }

    var search_setuptax = search.create({
        type: 'customrecord_lmry_setup_tax_subsidiary', filters: filtros_setuptax,
        columns: [
            'custrecord_lmry_setuptax_sales_discount',
            'custrecord_lmry_setuptax_currency',
            'custrecord_lmry_setuptax_type_rounding',
            'custrecord_lmry_setuptax_apply_line',
            'custrecord_lmry_setuptax_department',
            'custrecord_lmry_setuptax_class',
            'custrecord_lmry_setuptax_location',
            'custrecord_lmry_ar_setuptax_total_percep'
        ]
    });
    var result_setuptax = search_setuptax.run().getRange({ start: 0, end: 1 });
    if (result_setuptax && result_setuptax.length) {
        jsonSetup = {
            'salesDiscount': result_setuptax[0].getValue('custrecord_lmry_setuptax_sales_discount'),
            'currency': result_setuptax[0].getValue('custrecord_lmry_setuptax_currency'),
            'typeRounding': result_setuptax[0].getValue('custrecord_lmry_setuptax_type_rounding'),
            'applyLine': result_setuptax[0].getValue('custrecord_lmry_setuptax_apply_line'),
            'department': result_setuptax[0].getValue('custrecord_lmry_setuptax_department'),
            'class': result_setuptax[0].getValue('custrecord_lmry_setuptax_class'),
            'location': result_setuptax[0].getValue('custrecord_lmry_setuptax_location'),
            'totalPerception': isValid(result_setuptax[0].getValue('custrecord_lmry_ar_setuptax_total_percep')),
        }
    }
    return jsonSetup;
}


function getItems(currentRecord) {
    var items = {};
    var lines = currentRecord.getLineCount('item');
    for (var i = 0; i < lines; i++) {

        var key = currentRecord.getSublistValue('item', 'lineuniquekey', i);
        items[key] = {
            lineuniquekey: key,
            isTribute: currentRecord.getSublistValue('item', 'custcol_lmry_ar_item_tributo', i),
            amount: parseFloat(currentRecord.getSublistValue('item', 'amount', i)),
            revised: false,
            perceptionPercentage: currentRecord.getSublistValue('item', 'custcol_lmry_ar_perception_percentage', i),
            grossAmount: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i }),
            taxAmount: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }),
            id: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i }),
            catalog: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_br_service_catalog', line: i }) || "no catalogo",
            line: i,
            description: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_br_taxc_rsp', line: i }),
            type: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i }),
            baseAmount: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_base_amount', line: i }),

            descriptionMemo: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i }),
            taxcode: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: i }),
            perceptionAccount: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_ar_perception_account', line: i }),
            perceptionAdjustment: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_ar_perception_adjustment', line: i }),
            iibbArciba: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_ar_norma_iibb_arciba', line: i }),
            iibbJuris: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_ar_col_jurisd_iibb', line: i }),
            taxRegimen: currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_ar_col_regimen', line: i })
        }

        if (FeaDepa || FeaDepa == 'T') {
            items[key]["department"] = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'department', line: i })
        }
        if (FeaClas || FeaClas == 'T') {
            items[key]["class"] = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'department', line: i })
        }
        if (FeaLoca || FeaLoca == 'T') {
            items[key]["location"] = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'department', line: i })
        }
    }
    return items;
}

function getExchangeRate(setupTaxSubsidiary, transaction, invoiceRecord) {
    var exchangerate = 1;
    var subsidiaryCurrency = "";
    if (subsi_OW) {
        subsidiaryCurrency = search.lookupFields(
            {
                type: search.Type.SUBSIDIARY,
                id: transaction.subsidiary,
                columns: ['currency']
            }
        );
        subsidiaryCurrency = subsidiaryCurrency.currency[0].value;
    }

    if (setupTaxSubsidiary.currency == transaction.currency) {
        exchangerate = 1;
    }
    if (setupTaxSubsidiary.currency != transaction.currency && setupTaxSubsidiary.currency == subsidiaryCurrency) {
        exchangerate = parseFloat(invoiceRecord.getValue("exchangerate"));
    }
    if (setupTaxSubsidiary.currency != transaction.currency && setupTaxSubsidiary.currency != subsidiaryCurrency && featureMB == true) {
        var bookLines = invoiceRecord.getLineCount({ sublistId: 'accountingbookdetail' });
        if (bookLines > 0) {
            for (var k = 0; k < bookLines; k++) {
                var bookCurrency = invoiceRecord.getSublistValue({ sublistId: 'accountingbookdetail', fieldId: 'currency', line: k });
                if (bookCurrency == setupTaxSubsidiary.currency) {
                    exchangerate = parseFloat(invoiceRecord.getSublistValue({ sublistId: 'accountingbookdetail', fieldId: 'exchangerate', line: k }));
                    break;
                }
            }
        }
    }

    return exchangerate;
}


function getDiscountGlobal(objRecord) {
    var discountRate = objRecord.getValue("discountrate");
    var discountRateText = objRecord.getText("discountrate");

    if (!discountRate) {
        return 0;
    }

    var sumAmount = 0,
        sumWithout = 0;
    for (var i = 0; i < objRecord.getLineCount({ sublistId: "item" }); i++) {
        var amount = objRecord.getSublistValue({
            sublistId: "item",
            fieldId: "amount",
            line: i,
        });
        var tributo = objRecord.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_lmry_ar_item_tributo",
            line: i,
        });
        var itemType = objRecord.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_lmry_item_type",
            line: i,
        });

        sumAmount += parseFloat(amount);

        if (
            tributo == "T" ||
            tributo == true ||
            itemType == "Descuento" ||
            itemType == "Discount"
        ) {
            continue;
        }

        sumWithout += parseFloat(amount);
    }

    //Porcentaje
    if (discountRateText.indexOf("%") != -1) {
        //Solo el descuento global suma
        var sumDiscount = 0;

        for (var i = 0; i < objRecord.getLineCount({ sublistId: "item" }); i++) {
            var itemType = objRecord.getSublistValue({
                sublistId: "item",
                fieldId: "custcol_lmry_item_type",
                line: i,
            });
            var tributo = objRecord.getSublistValue({
                sublistId: "item",
                fieldId: "custcol_lmry_ar_item_tributo",
                line: i,
            });
            var amount = objRecord.getSublistValue({
                sublistId: "item",
                fieldId: "amount",
                line: i,
            });

            if (
                tributo == "T" ||
                tributo == true ||
                itemType == "Descuento" ||
                itemType == "Discount"
            ) {
                continue;
            }

            var prorrateo = (parseFloat(amount) * parseFloat(discountRate)) / 100;

            prorrateo = Math.round(parseFloat(prorrateo) * 100) / 100;

            sumDiscount += parseFloat(prorrateo);
        }

        return sumDiscount;
    } else {
        //Numero

        return objRecord.getValue("discountrate") || 0;
    }
}

function getSubtotal(transaction) {
    var subtotal = 0.00;
    var items = transaction.items

    Object.keys(items).forEach(function (lineuniquekey) {
        var item = items[lineuniquekey]

        if ((!item.isTribute || !item.perceptionPercentage) && item.type != "Subtotal") {
            subtotal += parseFloat(item.amount);
        }
    })

    return subtotal;
}

function getTotal(transaction) {
    var total = 0.00;
    var items = transaction.items

    Object.keys(items).forEach(function (lineuniquekey) {
        var item = items[lineuniquekey]
        if ((!item.isTribute || !item.perceptionPercentage) && item.type != "Subtotal") {
            total += parseFloat(item.grossAmount);
        }
    })

    return total;
}


function getNationaltaxs(transaction) {
    var nationalTaxList = [];
    var filters = [
        ['custrecord_lmry_ntax_isexempt', 'is', ['F']],
        ['isinactive', 'is', ['F']],
        ['custrecord_lmry_ntax_taxtype', 'anyof', [2]],
        ['custrecord_lmry_ntax_gen_transaction', 'anyof', [4]],
        ['custrecord_lmry_ntax_datefrom', 'onorbefore', [transaction.trandate]],
        ['custrecord_lmry_ntax_dateto', 'onorafter', [transaction.trandate]],
        ['custrecord_lmry_ntax_transactiontypes', 'anyof', [transaction.type.value]]
    ];

    if (subsi_OW) filters.push(['custrecord_lmry_ntax_subsidiary', 'is', [transaction.subsidiary]]);


    var columns = [
        'custrecord_lmry_ntax_taxitem',
        'custrecord_lmry_ntax_taxrate',
        'custrecord_lmry_ntax_memo',
        'custrecord_lmry_ntax_taxcode',
        { name: 'subtype', join: 'custrecord_lmry_ntax_taxitem' },
        'custrecord_lmry_ntax_department',
        'custrecord_lmry_ntax_class',
        'custrecord_lmry_ntax_location',
        'custrecord_lmry_ntax_iibb_norma',
        { name: 'custrecord_lmry_ar_wht_regimen', join: 'custrecord_lmry_ntax_regimen' },
        'custrecord_lmry_ntax_jurisdib',
        'custrecord_lmry_ntax_appliesto',
        'custrecord_lmry_ntax_amount',
        'custrecord_lmry_ntax_addratio',
        'custrecord_lmry_ntax_minamount',
        'custrecord_lmry_ntax_maxamount',
        'custrecord_lmry_ntax_set_baseretention',
        'custrecord_lmry_ntax_applies_to_item',
        'custrecord_lmry_ntax_base_amount',
        'custrecord_lmry_ntax_not_taxable_minimum',
        'internalid',
        'custrecord_lmry_ntax_catalog',
        'custrecord_lmry_ntax_applies_to_account'
    ];

    var filters = filters.map(function (filter) {
        return search.createFilter({ name: filter[0], operator: filter[1], values: filter[2] });
    });

    var columns = columns.map(function (column) {
        return (typeof column === 'string') ? search.createColumn({ name: column }) : search.createColumn(column);
    });

    var nationalTaxSearch = search.create({
        type: "customrecord_lmry_national_taxes",
        filters: filters,
        columns: columns
    });

    nationalTaxSearch.run().each(function (result) {
        var columns = result.columns;

        var nationalTax = {
            taxItem: result.getValue(columns[0]),
            taxRate: result.getValue(columns[1]),
            taxMemo: result.getValue(columns[2]),
            memo: result.getValue(columns[2]),
            taxCode: result.getValue(columns[3]),
            taxItemSubtype: result.getValue(columns[4]),
            department: result.getValue(columns[5]),
            class: result.getValue(columns[6]),
            location: result.getValue(columns[7]),
            iibbNorma: result.getValue(columns[8]),
            taxRegimen: result.getValue(columns[9]),
            jurisDib: result.getValue(columns[10]),
            appliesTo: result.getValue(columns[11]),
            amount: result.getValue(columns[12]),
            addratio: result.getValue(columns[13]),
            minAmount: result.getValue(columns[14]),
            maxAmount: result.getValue(columns[15]),
            setBaseRetention: result.getValue(columns[16]),
            appliesToItem: result.getValue(columns[17]),
            baseAmount: result.getValue(columns[18]),
            notTaxableMinimum: result.getValue(columns[19]),
            internalid: result.getValue(columns[20]),
            catalog: result.getValue(columns[21]),
            appliesToAccount: result.getValue(columns[22]),
            key: "NT"
        }

        if (nationalTax.taxMemo) {
            nationalTax.taxMemo += " - " + "NT" + nationalTax.internalid
        } else {
            nationalTax.taxMemo = "NT" + nationalTax.internalid
        }
        nationalTaxList.push(nationalTax);
        return true;
    });
    //nationalTaxSearch = nationalTaxSearch.run().getRange({ start: 0, end: 1000 });
    return nationalTaxList;
}
function validateCreditMemo2(transaction) {
    console.log("validateCreditMemo2", "start")

    try {
        var currentRecord = transaction.currentRecord;
        var lines = currentRecord.getLineCount({ sublistId: "apply" });
        var transactionApply;
        var lineApplyTransaction = 0;
        var countApply = 0;
        var itemsPerception = 0;
        var result = {};
        var transactionOrigin = {};
        var isTotal = false;
        for (var i = 0; i < lines; i++) {
            //const contextApply = currentRecord.selectLine({ sublistId: "apply", line: i });
            var apply = currentRecord.getSublistValue({ sublistId: "apply", fieldId: "apply", line: i });
            var amount = currentRecord.getSublistValue({ sublistId: "apply", fieldId: "amount", line: i });
            var internalid = currentRecord.getSublistValue({ sublistId: "apply", fieldId: "internalid", line: i });

            if (apply === "T" || apply === true) {
                transactionApply = internalid;
                lineApplyTransaction = i;
                countApply++;
            }

        }

        console.log("lines", lines)
        console.log("countApply", countApply)
        if (1 < countApply) {
            return {
                isTotal: false,
                itemsPerception: 1
            };
        }// En caso una nota de crédito esté aplicada a más de una factura, el usuario deberá determinar si le aplica o no percepción

        // se valida con el monto de los items de la transaccion
        console.log("transactionApply", transactionApply)
        if (transactionApply) {
            transactionOrigin.load = record.load(
                {
                    id: transactionApply,
                    type: "invoice"
                }
            );

            var currentRecordOrigin = transactionOrigin.load;
            var lines = currentRecordOrigin.getLineCount({ sublistId: "item" });

            transactionOrigin.subtotal = 0;
            console.log("lines", lines)
            for (var i = 0; i < lines; i++) {
                //const contextApply = currentRecord.selectLine({ sublistId: "apply", line: i });
                var isTribute = currentRecordOrigin.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_ar_item_tributo", line: i });
                var amount = currentRecordOrigin.getSublistValue({ sublistId: "item", fieldId: "amount", line: i });
                console.log("isTribute", isTribute)

                if (!isTribute) {

                    transactionOrigin.subtotal += amount;
                } else {
                    itemsPerception++;
                }

            }

            isTotal = transactionOrigin.subtotal == transaction.subtotalCurrency;

            if (isTotal) {
                transactionOrigin.total = currentRecordOrigin.getValue("total");
                currentRecord.setSublistValue("apply", "amount", lineApplyTransaction, transactionOrigin.total);
            }
        }

        result.items = getItems(currentRecordOrigin);
        result.itemsPerception = itemsPerception;
        result.isTotal = isTotal;
        return result;
    } catch (error) {
        console.log("validateCreditMemo2 error", error)
    }

}

function getContributoryClass(transaction) {
    var contributoryClassList = [];
    var filters = [
        ['custrecord_lmry_ar_ccl_entity', 'is', [transaction.entity]],
        ['custrecord_lmry_ar_ccl_isexempt', 'is', ['F']],
        ['isinactive', 'is', ['F']],
        ['custrecord_lmry_ccl_taxtype', 'anyof', [2]],
        ['custrecord_lmry_ccl_gen_transaction', 'anyof', [4]],
        ['custrecord_lmry_ar_ccl_fechdesd', 'onorbefore', [transaction.trandate]],
        ['custrecord_lmry_ar_ccl_fechhast', 'onorafter', [transaction.trandate]],
        ['custrecord_lmry_ccl_transactiontypes', 'anyof', [transaction.type.value]]
    ];

    if (subsi_OW) filters.push(['custrecord_lmry_ar_ccl_subsidiary', 'is', transaction.subsidiary]);
    if (transaction.countryCode == "AR") filters.push(['custrecord_lmry_ar_ccl_resptype', 'anyof', [transaction.responsableType]]);

    var columns = [
        'custrecord_lmry_ar_ccl_taxitem',
        'custrecord_lmry_ar_ccl_taxrate',
        'custrecord_lmry_ar_ccl_memo',
        'custrecord_lmry_ar_ccl_taxcode',
        { name: 'subtype', join: 'custrecord_lmry_ar_ccl_taxitem' },
        'custrecord_lmry_ar_ccl_department',
        'custrecord_lmry_ar_ccl_class',
        'custrecord_lmry_ar_ccl_location',
        'custrecord_lmry_ar_normas_iibb',
        { name: 'custrecord_lmry_ar_wht_regimen', join: 'custrecord_lmry_ar_regimen' },
        'custrecord_lmry_ar_ccl_jurisdib',
        'custrecord_lmry_ccl_appliesto',
        'custrecord_lmry_amount',
        'custrecord_lmry_ccl_addratio',
        'custrecord_lmry_ccl_minamount',
        'custrecord_lmry_ccl_maxamount',
        'custrecord_lmry_ccl_set_baseretention',
        'custrecord_lmry_ccl_applies_to_item',
        'custrecord_lmry_ccl_base_amount',
        'custrecord_lmry_ccl_not_taxable_minimum',
        'internalid',
        'custrecord_lmry_br_ccl_catalog',
        'custrecord_lmry_ccl_applies_to_account',
        { name: 'custrecord_lmry_ar_jurisdiccion_percept', join: 'custrecord_lmry_ar_ccl_jurisdib' },
        { name: 'custitem_lmry_ar_percep_type', join: 'custrecord_lmry_ar_ccl_taxitem' },
    ];

    var filters = filters.map(function (filter) {
        return search.createFilter({ name: filter[0], operator: filter[1], values: filter[2] });
    });

    var columns = columns.map(function (column) {
        return (typeof column === 'string') ? search.createColumn({ name: column }) : search.createColumn(column);
    });

    var contributoryClassSearch = search.create({
        type: "customrecord_lmry_ar_contrib_class",
        filters: filters,
        columns: columns
    });

    contributoryClassSearch.run().each(function (result) {
        var columns = result.columns;

        var contributoryClass = {
            taxItem: result.getValue(columns[0]),
            taxRate: result.getValue(columns[1]),
            taxMemo: result.getValue(columns[2]),
            memo: result.getValue(columns[2]),
            taxCode: result.getValue(columns[3]),
            taxItemSubtype: result.getValue(columns[4]),
            department: result.getValue(columns[5]),
            class: result.getValue(columns[6]),
            location: result.getValue(columns[7]),
            iibbNorma: result.getValue(columns[8]),
            taxRegimen: result.getValue(columns[9]),
            jurisDib: result.getValue(columns[10]),
            appliesTo: result.getValue(columns[11]),
            amount: result.getValue(columns[12]),
            addratio: result.getValue(columns[13]),
            minAmount: result.getValue(columns[14]),
            maxAmount: result.getValue(columns[15]),
            setBaseRetention: result.getValue(columns[16]),
            appliesToItem: result.getValue(columns[17]),
            baseAmount: result.getValue(columns[18]),
            notTaxableMinimum: result.getValue(columns[19]),
            internalid: result.getValue(columns[20]),
            catalog: result.getValue(columns[21]),
            appliesToAccount: result.getValue(columns[22]),
            key: "CC",
            applyCreditMemo: isValid(result.getValue(columns[23])),
            idPerceptionTypeItem: result.getValue(columns[24]),
        }
        if (contributoryClass.taxMemo) {
            contributoryClass.taxMemo += " - " + "CC" + contributoryClass.internalid
        } else {
            contributoryClass.taxMemo = "CC" + contributoryClass.internalid
        }

        contributoryClassList.push(contributoryClass);
        return true;
    });
    return contributoryClassList;
}


function validateDocumentType(transaction) {
    try {
        var documentFound = false;
        if (transaction.type.text == "salesorder" || transaction.type.text == "estimate") {
            return true;
        }
        if (transaction.documentType == '' || transaction.documentType == null) {

            return documentFound;
        }

        var busqDocTypePerc = search.create({
            type: 'customrecord_lmry_ar_doctype_percep', columns: ['custrecord_lmry_ar_doctype_percep'],
            filters: [['custrecord_lmry_ar_doctype_percep', 'anyof', transaction.documentType]]
        });

        var resultDocTypePerc = busqDocTypePerc.run().getRange(0, 100);
        if (resultDocTypePerc && resultDocTypePerc.length) {
            documentFound = true;
        }
    } catch (errmsg) {
        // Envio de mail con errores
        //LibraryMail.sendemail('[ validateDocumentType ] ' + errmsg, Name_script);
    }



    return documentFound;
}


function setLinePerceptionCreditMemo(transaction, invoice, setupTaxSubsidiary) {
    // remover las líneas de percepciones

    try {
        console.log("setLinePerceptionCreditMemo", "start")
        /*
        var deletedPercepctions = 0;
        for (var lineuniquekey in transaction.items) {
          var item = transaction.items[lineuniquekey];
          if (item.isTribute) {
            transaction.currentRecord.removeLine({
              sublistId: 'item',
              line: item.id
            });
            deletedPercepctions++;
          }
        }
        */
        var itemsInvoice = [];
        console.log("invoice", invoice)
        for (var lineuniquekey in invoice.items) {
            var item = invoice.items[lineuniquekey];
            if (item.isTribute) {
                itemsInvoice.push(item);
            }
        }
        console.log("itemsInvoice", itemsInvoice)
        for (var i = 0; i < itemsInvoice.length; i++) {
            var item = itemsInvoice[i];
            console.log("item", item);
            console.log("numLines", numLines);
            // Agrega una linea en blanco
            transaction.currentRecord.insertLine('item', numLines);
            index = numLines

            transaction.currentRecord.setSublistValue('item', 'item', index, item.id);
            if (item.descriptionMemo) {
                transaction.currentRecord.setSublistValue('item', 'description', index, item.descriptionMemo);
            }
            transaction.currentRecord.setSublistValue('item', 'custcol_lmry_br_taxc_rsp', index, item.description);
            transaction.currentRecord.setSublistValue('item', 'quantity', index, 1);
            transaction.amountPerception += parseFloat(item.amount);
            transaction.currentRecord.setSublistValue('item', 'rate', index, parseFloat(item.amount));
            transaction.currentRecord.setSublistValue('item', 'taxcode', index, item.taxcode);
            transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_perception_percentage', index, parseFloat(item.perceptionPercentage));
            transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_item_tributo', index, true);
            transaction.currentRecord.setSublistValue('item', 'custcol_lmry_base_amount', index, item.baseAmount);
            transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_perception_account', index, item.perceptionAccount);
            transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_perception_adjustment', index, item.perceptionAdjustment);

            if (transaction.countryCode == "AR") {
                // Name: Latam Col - AR Norma IIBB - ARCIBA
                if (item.iibbArciba) {
                    transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_norma_iibb_arciba', index, item.iibbArciba);
                }
                // Name: Latam Col - AR Jurisdiccion IIBB
                if (item.iibbJuris) {
                    transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_col_jurisd_iibb', index, item.iibbJuris);
                }
                // Name: Latam Col - AR Regimen
                if (item.taxRegimen) {
                    transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_col_regimen', index, item.taxRegimen);
                }
            }

            // Department
            if (FeaDepa || FeaDepa == 'T') {
                if (item.department) {
                    transaction.currentRecord.setSublistValue('item', 'department', index, item.department);
                } else {
                    if (pref_dep || pref_dep == 'T') {
                        transaction.currentRecord.setSublistValue('item', 'department', index, setupTaxSubsidiary.department);
                    }
                }
            }

            // Class
            if (FeaClas || FeaClas == 'T') {
                if (item.class) {
                    transaction.currentRecord.setSublistValue('item', 'class', index, item.class);
                } else {
                    if (pref_clas || pref_clas == 'T') {
                        transaction.currentRecord.setSublistValue('item', 'class', index, setupTaxSubsidiary.class);
                    }
                }
            }

            // Location
            if ((FeaLoca || FeaLoca == 'T')) {
                if (item.location) {
                    transaction.currentRecord.setSublistValue('item', 'location', index, item.location);
                } else {
                    if (pref_loc || pref_loc == 'T') {
                        transaction.currentRecord.setSublistValue('item', 'location', index, setupTaxSubsidiary.location);

                    }
                }
            }
            numLines++;
        }
    } catch (error) {
        console.log("error setLinePerceptionCreditMemo",error)
    }


}

function setRevisedItem(transaction, rowPercepction) {
    var items = transaction.items
    for (var lineuniquekey in items) {
        var item = items[lineuniquekey]
        if (item.line == rowPercepction) {
            item.revised = false;
        }
    }
}

function validatePerceptionType(idPerceptionTypeItem) {

    var perceptionTypeSearch = search.create({
        type: "customrecord_lmry_ar_perception_type",
        filters: [
            ['internalid', 'anyof', idPerceptionTypeItem]
        ],
        columns: [
            'custrecord_lmry_setup_wht_perception'
        ]
    });
    var perceptionType = false;
    perceptionTypeSearch.run().each(function (result) {
        var columns = result.columns;
        perceptionType = isValid(result.getValue(columns[0]));
    });

    return perceptionType;
}

function findLinePerception(transaction, recordTax) {
    var linePerception;
    var lineuniquekePerception;
    var items = transaction.items
    var lines = transaction.currentRecord.getLineCount('item');
    for (var i = 0; i < lines; i++) {
        var memoCode = recordTax.key + recordTax.internalid
        var unikey = transaction.currentRecord.getSublistValue('item', 'lineuniquekey', i);
        var itemLine = transaction.currentRecord.getSublistValue('item', 'item', i);
        var item = items[unikey];
        if (item) {
            if (item.description.indexOf(memoCode) !== -1 && !item.check) {
                item.revised = true;
                item.check = true;
                return i;
            };
            if (item.isTribute && itemLine == recordTax.taxItem && !item.check) {
                linePerception = i;
                lineuniquekePerception = item.lineuniquekey;
                item.check = true;
            }
        }

    }

    if (transaction.createdFrom && linePerception) {
        items[lineuniquekePerception].revised = true;
        return linePerception;
    }
    return -1;
}

function setLinePerception(appliesTo, recordTaxs, transaction, setupTaxSubsidiary, item, invoice, isTotal) {
    console.log("setLinePerception", "start")
    console.log("recordTaxs", recordTaxs)
    if (recordTaxs.length) {
        var countValidation = 0;
        for (var i = 0; i < recordTaxs.length; i++) {
            var recordTax = recordTaxs[i];
            // Valida si es articulo para las ventas

            if (['Para la venta', 'For Sale', 'Para reventa', 'For Resale'].indexOf(recordTax.taxItemSubtype) == -1) continue;

            if (!recordTax.taxCode) continue;

            if (appliesTo != recordTax.appliesTo) continue;

            if (recordTax.appliesTo == '2') {
                if (transaction.countryCode == 'BR') {
                    if (recordTax.catalog != item.catalog) continue;
                } else {
                    if (recordTax.appliesToItem != item.id) continue;
                }
            }
            // (C1064) 2024.07.07 : Solo Aplica a Credit Memo
            if (transaction.type.text === 'creditmemo' && setupTaxSubsidiary.totalPerception) {
                // validacion de Juridiccion y tipo de percepcion
                if (!recordTax.applyCreditMemo || !validatePerceptionType(recordTax.idPerceptionTypeItem)) {
                    countValidation++;
                    continue;
                }
            }

            if (!recordTax.setBaseRetention || recordTax.setBaseRetention < 0) recordTax.setBaseRetention = 0;
            if (!recordTax.notTaxableMinimum || recordTax.notTaxableMinimum < 0) recordTax.notTaxableMinimum = 0;
            if (!recordTax.maxAmount || recordTax.maxAmount < 0) recordTax.maxAmount = 0;
            if (!recordTax.minAmount || recordTax.minAmount < 0) recordTax.minAmount = 0;
            if (!recordTax.addratio || recordTax.addratio <= 0) recordTax.addratio = 1;

            recordTax.minAmount = parseFloat(recordTax.minAmount);
            recordTax.maxAmount = parseFloat(recordTax.maxAmount);
            recordTax.setBaseRetention = parseFloat(recordTax.setBaseRetention);
            recordTax.notTaxableMinimum = parseFloat(recordTax.notTaxableMinimum);

            var baseAmount;

            if (recordTax.appliesTo == '1') {
                if (recordTax.amount == 1) { baseAmount = transaction.total; } //GROSS
                //TAX
                if (recordTax.amount == 2) {
                    if (transaction.taxtotal > 0) {
                        baseAmount = transaction.taxtotal;
                    } else {
                        continue;
                    }
                }
                if (recordTax.amount == 3) { baseAmount = transaction.subtotal; } //NET
            }

            if (recordTax.appliesTo == '2') {

                if (recordTax.amount == 1) { baseAmount = parseFloat(item.grossAmount) * parseFloat(transaction.exchangerate); }
                //TAX
                if (recordTax.amount == 2) {
                    if (item.taxAmount > 0) {
                        baseAmount = parseFloat(item.taxAmount) * parseFloat(transaction.exchangerate);
                    } else {
                        continue;
                    }
                }
                if (recordTax.amount == 3) { baseAmount = parseFloat(item.amount) * parseFloat(transaction.exchangerate); } //NET
            }
            baseAmount = parseFloat(baseAmount) - parseFloat(recordTax.notTaxableMinimum);

            if (baseAmount <= 0) continue;


            if (recordTax.minAmount > 0) {
                if (baseAmount > recordTax.minAmount) {
                    if (recordTax.maxAmount > 0) {
                        if (recordTax.maxAmount > recordTax.minAmount) {
                            if (recordTax.maxAmount >= baseAmount) {
                                if (recordTax.baseAmount == 2 || recordTax.baseAmount == 5) { baseAmount = parseFloat(baseAmount) - parseFloat(recordTax.minAmount); }
                                if (recordTax.baseAmount == 3) { baseAmount = recordTax.minAmount; }
                                if (recordTax.baseAmount == 4) { baseAmount = recordTax.maxAmount; }
                            } else {
                                continue;
                            }
                        } else {
                            continue;
                        }
                    } else {
                        if (recordTax.baseAmount == 2 || recordTax.baseAmount == 5) { baseAmount = parseFloat(baseAmount) - parseFloat(recordTax.minAmount); }
                        if (recordTax.baseAmount == 3) { baseAmount = recordTax.minAmount; }
                    }
                } else {
                    continue;
                }
            } else {
                if (recordTax.maxAmount > recordTax.minAmount) {
                    if (recordTax.maxAmount >= baseAmount) {
                        if (recordTax.baseAmount == 2 || recordTax.baseAmount == 5) { baseAmount = parseFloat(baseAmount) - parseFloat(recordTax.minAmount); }
                        if (recordTax.baseAmount == 3) { baseAmount = recordTax.minAmount; }
                        if (recordTax.baseAmount == 4) { baseAmount = recordTax.maxAmount; }
                    } else {
                        continue;
                    }
                }
            }

            // La alicouta de la percepcion en el credit memo debe ser igual al de factura siempre.
            var index;
            var baseAmountAddratio = 0;
            var retentionAddratio = 0;
            index = findLinePerception(transaction, recordTax);
            if (transaction.type.text == 'creditmemo' && JSON.stringify(invoice) != "{}") {
                var rowPercepction = index;
                var lineCount = 0;
                var itemId;
                if (index != -1) {
                    for (var lineuniquekey in transaction.items) {
                        var item = transaction.items[lineuniquekey];
                        if (item.line == rowPercepction) {
                            itemId = item.id;
                        }
                    }

                } else {
                    itemId = recordTax.taxItem;
                }
                for (var lineuniquekey in invoice.items) {
                    var item = invoice.items[lineuniquekey];
                    if (item.id == itemId && !item.inherited) {
                        recordTax.taxRate = item.perceptionPercentage;
                        if (isTotal) {
                            baseAmountAddratio = item.baseAmount;
                            retentionAddratio = item.amount;
                        }
                        item.inherited = true;
                        lineCount++
                        break;
                    }
                }
                if (!lineCount) {
                    setRevisedItem(transaction, rowPercepction)
                    continue;
                }
                //if (rowPercepction == -1) rowPercepction = numLines;      
            }
            //RETENCION
            var retention = parseFloat(recordTax.setBaseRetention) + parseFloat(baseAmount) * parseFloat(recordTax.addratio) * parseFloat(recordTax.taxRate);
            retention = parseFloat(Math.round(parseFloat(retention) * 1000000) / 1000000);
            retention = parseFloat(Math.round(parseFloat(retention) * 10000) / 10000);
            var retencion_peso = retention;

            var aux_cadena = retention + ";";
            retention = parseFloat(retention) / parseFloat(transaction.exchangerate);
            baseAmount = parseFloat(baseAmount) / parseFloat(transaction.exchangerate);

            if (setupTaxSubsidiary.typeRounding == '1') {
                if (parseFloat(retention) - parseInt(retention) < 0.5) {
                    retention = parseInt(retention);
                }
                else {
                    retention = parseInt(retention) + 1;
                }
            }
            if (setupTaxSubsidiary.typeRounding == '2') {
                retention = parseInt(retention);
            }

            if (recordTax.appliesToAccount != '' && recordTax.appliesToAccount != null) {
                aux_cadena += recordTax.appliesToAccount;
            }

            retention = parseFloat(Math.round(parseFloat(retention) * 100) / 100);
            var retencion_transaccion = parseFloat(retention) * parseFloat(transaction.exchangerate);
            retencion_transaccion = Math.round(parseFloat(retencion_transaccion) * 10000) / 10000;

            var adjustment = parseFloat(retencion_peso) - parseFloat(retencion_transaccion);

            adjustment = adjustment.toFixed(4);


            var memo;
            if (recordTax.taxMemo) {
                memo = recordTax.taxMemo;
                if (appliesTo == "2") {
                    memo += " - " + item.lineuniquekey;
                } else {
                    memo += " - Total";
                }

            }

            baseAmountAddratio = baseAmountAddratio && transaction.type.text == 'creditmemo' ? parseFloat(baseAmountAddratio) : baseAmount * parseFloat(recordTax.addratio);
            retention = retentionAddratio && transaction.type.text == 'creditmemo' ? retentionAddratio : retention;
            console.log("retention", retention)
            if (retention == 0) continue;
            if (index != -1) {
                // Busca la linea de percepcion a actualizar
                try {
                    transaction.currentRecord.setSublistValue('item', 'rate', index, parseFloat(retention));
                    transaction.currentRecord.setSublistValue('item', 'custcol_lmry_br_taxc_rsp', index, memo);
                    if (recordTax.memo) {
                        transaction.currentRecord.setSublistValue('item', 'description', index, recordTax.memo);
                    }
                    transaction.amountPerception += parseFloat(retention);
                    transaction.currentRecord.setSublistValue('item', 'custcol_lmry_br_taxc_rsp', index, memo);
                    transaction.currentRecord.setSublistValue('item', 'quantity', index, 1);
                    transaction.currentRecord.setSublistValue('item', 'rate', index, parseFloat(retention));
                    transaction.currentRecord.setSublistValue('item', 'taxcode', index, recordTax.taxCode);
                    transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_perception_percentage', index, parseFloat(recordTax.taxRate));
                    transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_item_tributo', index, true);
                    transaction.currentRecord.setSublistValue('item', 'custcol_lmry_base_amount', index, baseAmountAddratio);
                    transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_perception_account', index, aux_cadena);
                    transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_perception_adjustment', index, adjustment);

                    if (transaction.countryCode == "AR") {
                        // Name: Latam Col - AR Norma IIBB - ARCIBA
                        if (recordTax.iibbNorma) {
                            transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_norma_iibb_arciba', index, recordTax.iibbNorma);
                        }
                        // Name: Latam Col - AR Jurisdiccion IIBB
                        if (recordTax.jurisDib) {
                            transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_col_jurisd_iibb', index, recordTax.jurisDib);
                        }
                        // Name: Latam Col - AR Regimen
                        if (recordTax.taxRegimen) {
                            transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_col_regimen', index, recordTax.taxRegimen);
                        }
                    }

                    // Department
                    if (FeaDepa || FeaDepa == 'T') {
                        if (recordTax.department) {
                            transaction.currentRecord.setSublistValue('item', 'department', index, recordTax.department);
                        } else {
                            if (pref_dep || pref_dep == 'T') {
                                transaction.currentRecord.setSublistValue('item', 'department', index, setupTaxSubsidiary.department);
                            }
                        }
                    }

                    // Class
                    if (FeaClas || FeaClas == 'T') {
                        if (recordTax.class) {
                            transaction.currentRecord.setSublistValue('item', 'class', index, recordTax.class);
                        } else {
                            if (pref_clas || pref_clas == 'T') {
                                transaction.currentRecord.setSublistValue('item', 'class', index, setupTaxSubsidiary.class);
                            }
                        }
                    }

                    var fieldLocation = transaction.currentRecord.getSublistField({ sublistId: 'item', fieldId: 'location', line: index });
                    // Location
                    if (fieldLocation && (FeaLoca || FeaLoca == 'T')) {
                        if (recordTax.location) {

                            transaction.currentRecord.setSublistValue('item', 'location', index, recordTax.location);
                        } else {
                            if (pref_loc || pref_loc == 'T') {
                                transaction.currentRecord.setSublistValue('item', 'location', index, setupTaxSubsidiary.location);

                            }
                        }
                    }
                } catch (error) {
                    //log.error("setLinePerception : Set rate", error);
                }
            } else {

                // Agrega una linea en blanco
                transaction.currentRecord.insertLine('item', numLines);
                index = numLines

                transaction.currentRecord.setSublistValue('item', 'item', index, recordTax.taxItem);
                if (recordTax.memo) {
                    transaction.currentRecord.setSublistValue('item', 'description', index, recordTax.memo);
                }
                transaction.currentRecord.setSublistValue('item', 'custcol_lmry_br_taxc_rsp', index, memo);
                transaction.currentRecord.setSublistValue('item', 'quantity', index, 1);
                transaction.amountPerception += parseFloat(retention);
                transaction.currentRecord.setSublistValue('item', 'rate', index, parseFloat(retention));
                transaction.currentRecord.setSublistValue('item', 'taxcode', index, recordTax.taxCode);
                transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_perception_percentage', index, parseFloat(recordTax.taxRate));
                transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_item_tributo', index, true);
                transaction.currentRecord.setSublistValue('item', 'custcol_lmry_base_amount', index, baseAmountAddratio);
                transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_perception_account', index, aux_cadena);
                transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_perception_adjustment', index, adjustment);

                if (transaction.countryCode == "AR") {
                    // Name: Latam Col - AR Norma IIBB - ARCIBA
                    if (recordTax.iibbNorma) {
                        transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_norma_iibb_arciba', index, recordTax.iibbNorma);
                    }
                    // Name: Latam Col - AR Jurisdiccion IIBB
                    if (recordTax.jurisDib) {
                        transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_col_jurisd_iibb', index, recordTax.jurisDib);
                    }
                    // Name: Latam Col - AR Regimen
                    if (recordTax.taxRegimen) {
                        transaction.currentRecord.setSublistValue('item', 'custcol_lmry_ar_col_regimen', index, recordTax.taxRegimen);
                    }
                }

                // Department
                if (FeaDepa || FeaDepa == 'T') {
                    if (recordTax.department) {
                        transaction.currentRecord.setSublistValue('item', 'department', index, recordTax.department);
                    } else {
                        if (pref_dep || pref_dep == 'T') {
                            transaction.currentRecord.setSublistValue('item', 'department', index, setupTaxSubsidiary.department);
                        }
                    }
                }

                // Class
                if (FeaClas || FeaClas == 'T') {
                    if (recordTax.class) {
                        transaction.currentRecord.setSublistValue('item', 'class', index, recordTax.class);
                    } else {
                        if (pref_clas || pref_clas == 'T') {
                            transaction.currentRecord.setSublistValue('item', 'class', index, setupTaxSubsidiary.class);
                        }
                    }
                }

                var fieldLocation = transaction.currentRecord.getSublistField({ sublistId: 'item', fieldId: 'location', line: index });
                // Location
                if (fieldLocation && (FeaLoca || FeaLoca == 'T')) {
                    if (recordTax.location) {

                        transaction.currentRecord.setSublistValue('item', 'location', index, recordTax.location);
                    } else {
                        if (pref_loc || pref_loc == 'T') {
                            transaction.currentRecord.setSublistValue('item', 'location', index, setupTaxSubsidiary.location);

                        }
                    }
                }
                numLines++;
            }
        };
        // (C1064) 2024.07.07 : Solo Aplica a Credit Memo
        if (transaction.type.text == 'creditmemo' && countValidation && setupTaxSubsidiary.totalPerception) {
            transaction.currentRecord.setValue("custbody_lmry_apply_wht_code", false);
        }
    }
}

function calculatePerception(invoiceRecord, numLines, CodeCountry, event, isMassive) {
    try {
        const featjobs = runtime.isFeatureInEffect({ feature: "JOBS" });
        const transactionType = {
            'invoice': 1,
            'creditmemo': 8,
            'cashsale': 3,
            'salesorder': 2,
            'estimate': 10
        }

        var transaction = {
            applyWhtCode: isValid(invoiceRecord.getValue('custbody_lmry_apply_wht_code')),
            documentType: invoiceRecord.getValue("custbody_lmry_document_type"),
            eiStatus: {
                field: invoiceRecord.getField({ fieldId: 'custbody_psg_ei_status' }),
                value: invoiceRecord.getValue("custbody_psg_ei_status") || ""
            },
            type: {
                text: invoiceRecord.type,
                value: transactionType[invoiceRecord.type]
            },
            trandate: invoiceRecord.getValue("trandate"),
            entity: invoiceRecord.getValue("entity"),
            subsidiary: invoiceRecord.getValue("subsidiary"),
            currency: invoiceRecord.getValue("currency"),
            countryCode: CodeCountry,
            createdFrom: invoiceRecord.getValue("createdfrom"),
            unapplied: Number(invoiceRecord.getValue("unapplied")),
            validateTotalCreditMemo: true,
            amountPerception: 0
        }



        transaction.trandate = format.format({ value: transaction.trandate, type: format.Type.DATE });

        if (featjobs == "T" || featjobs) {
            const jobs = search.lookupFields({ type: search.Type.JOB, id: transaction.entity, columns: ['customer'] });
            transaction.entity = jobs && jobs.customer ? jobs.customer[0].value : transaction.entity;
        }

        var status = validateStatus(invoiceRecord.id);
        transaction.notSend = status.notSend;

        if (!status.countRegister) {
            if (transaction.eiStatus.field && transaction.eiStatus.value) {
                transaction.eiStatus.value = search.lookupFields({ type: 'customlist_psg_ei_status', id: transaction.eiStatus.value, columns: ['name'] }).name;
                transaction.notSend = (transaction.eiStatus.value != "Sent" && transaction.eiStatus.value != "Enviado")
            } else {
                transaction.notSend = true;
            }
        }
        if (!transaction.notSend) return false;
        /********************************************
        * Solo para Argentina se aplica
        * el siguiente codigo
        *******************************************/
        if (CodeCountry == "AR") {
            /********************************************
             * Campo personalizdo: Latam - AR Responsible
             * Type Code para el cliente
             ********************************************/
            var responsableType = search.lookupFields({ type: search.Type.CUSTOMER, id: transaction.entity, columns: ['custentity_lmry_ar_tiporespons'] });

            // Se valida que el campo no este vacio
            if (responsableType.custentity_lmry_ar_tiporespons.length == 0 || responsableType == '' || responsableType == null) {
                return true;
            }
            transaction.responsableType = responsableType.custentity_lmry_ar_tiporespons[0].value;
        }

        const setupTaxSubsidiary = getSetupTaxSubsidiary(transaction.subsidiary);
        if (!Object.keys(setupTaxSubsidiary).length) return true;

        transaction.items = getItems(invoiceRecord);
        // El tipo de cambio sera establecida para convertir los montos a moneda del pais
        transaction.exchangerate = getExchangeRate(setupTaxSubsidiary, transaction, invoiceRecord);

        if (transaction.type.text == "creditmemo") {
            var discountGlobal = getDiscountGlobal(invoiceRecord);

        } else {
            var discountGlobal = invoiceRecord.getValue("discountrate") || 0;
        }

        discountGlobal = parseFloat(discountGlobal);
        discountGlobal = Math.abs(discountGlobal);

        /********************************************
         * Argentina Task C1063
         * Solo reempleza el valor si la percepcion
         * es diferente en la base de calculo no se 
         * debe considerar la lienas de percepcion
         ********************************************/
        transaction.subtotalCurrency = getSubtotal(transaction);
        transaction.totalCurrency = getTotal(transaction);
        transaction.subtotal = transaction.subtotalCurrency * parseFloat(transaction.exchangerate) - discountGlobal * parseFloat(transaction.exchangerate);
        transaction.total = transaction.totalCurrency * parseFloat(transaction.exchangerate) - parseFloat(discountGlobal) * parseFloat(transaction.exchangerate);
        transaction.taxtotal = parseFloat(invoiceRecord.getValue("taxtotal")) * parseFloat(transaction.exchangerate) - parseFloat(discountGlobal) * parseFloat(transaction.exchangerate);
        //Busqueda de National Taxes
        const nationalTaxs = getNationaltaxs(transaction);
        //Busqueda de las Clases Contributiva
        const contributoryClass = getContributoryClass(transaction);
        // console.log("nationalTaxs", nationalTaxs)
        console.log("contributoryClass", contributoryClass)
        // console.log("transaction", transaction)
        transaction.currentRecord = invoiceRecord;

        /********************************************
         * Argentina Task C1064
         * Solo para el caso de Credit Memo valida 
         * Para generar la percepcion
         ********************************************/
        var invoice = {};
        var validation = {
            isTotal: false,
            itemsPerception: 0
        };

        if (transaction.type.text == 'creditmemo') {
            console.log("transaction.type.text", transaction.type.text)
            validation = validateCreditMemo2(transaction, event);
            console.log("validation", validation)
            if (setupTaxSubsidiary.totalPerception) {
                transaction.validateTotalCreditMemo = validation.isTotal
                if (!validation.isTotal) transaction.currentRecord.setValue("custbody_lmry_apply_wht_code", false);
            }
            console.log("validation.itemsPerception", validation.itemsPerception)
            if (!validation.itemsPerception) return true;
            invoice.items = validation.items;

        }

        // console.log("transaction.validateTotalCreditMemo", transaction.validateTotalCreditMemo)
        // console.log("transaction.applyWhtCode", transaction.applyWhtCode)
        // console.log("validateDocumentType(transaction)", validateDocumentType(transaction))
        if (transaction.validateTotalCreditMemo && transaction.applyWhtCode && validateDocumentType(transaction)) {

            if (transaction.type.text == 'creditmemo' && validation.isTotal && !setupTaxSubsidiary.totalPerception) {
                setLinePerceptionCreditMemo(transaction, invoice, setupTaxSubsidiary);
            } else {
                setLinePerception("1", nationalTaxs, transaction, setupTaxSubsidiary, {}, invoice, validation.isTotal);
                setLinePerception("1", contributoryClass, transaction, setupTaxSubsidiary, {}, invoice, validation.isTotal);
            }

            /*
            if (setupTaxSubsidiary.applyLine == true) {
                Object.keys(transaction.items).forEach(function (lineuniquekey) {
                var item = transaction.items[lineuniquekey];
                setLinePerception("2", nationalTaxs, transaction, setupTaxSubsidiary, item);
                setLinePerception("2", contributoryClass, transaction, setupTaxSubsidiary, item);
              })
            }
            */
        }


        removePerceptionLines(transaction);

        // if (transaction.type.text == 'creditmemo') updateApplyAmount(transaction);

        // // Graba la transaccion
        // if (!isMassive) {
        //     transaction.currentRecord.save({
        //         disableTriggers: true,
        //         enableSourcing: false,
        //         ignoreMandatoryFields: true
        //     });
        // }

    } catch (errmsg) {
        //log.error("Error [calculatePerception]", errmsg)
        // Envio de mail con errores
        //LibraryMail.sendemail('[ calculatePerception ] ' + errmsg, Name_script);
    }
}

function removePerceptionLines(transaction) {


    var items = transaction.items;
    transaction.amountRemoved = 0;

    var deletedItems = [];
    Object.keys(items).forEach(function (lineuniquekey) {
        if (!items[lineuniquekey].revised && items[lineuniquekey].isTribute) {
            deletedItems.push(items[lineuniquekey].line);
            transaction.amountRemoved += items[lineuniquekey].amount;
        }
    })

    deletedItems.sort(function (a, b) { return b - a });
    deletedItems.forEach(function (id) {
        transaction.currentRecord.removeLine({
            sublistId: 'item',
            line: id
        });
    });
}