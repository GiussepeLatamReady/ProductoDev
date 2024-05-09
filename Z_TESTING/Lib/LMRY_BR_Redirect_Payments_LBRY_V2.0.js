/** 
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_BR_VOID_INVENTORY_TRAN_LBRY_V2.0.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 24/04/2024
 */
define([
    'N/record',
    'N/runtime',
    'N/log',
    'N/search',
    'N/url'
], function (record, runtime, log, search,url) {

    function redirectModulePayment(form, newRecord) {

        var status = newRecord.getValue("approvalstatus");
        log.error("status",status)
        if (status!= 2) return false;
        
        var subsidiary = newRecord.getValue("subsidiary");
        if (!validatePaymentLR(subsidiary)) return false;

        log.error("type",newRecord.type)
        var pathScriptClient;
        var idBtn;
        var translations = getTranslations();
        if (newRecord.type == "invoice") {
            pathScriptClient = "../LMRY_InvoiceCLNT_V2.0.js";
            idBtn = 'acceptpayment';
        }else{
            pathScriptClient = "../LMRY_VendorBillCLNT_V2.0.js";
            idBtn = 'payment';
        }


        var btnPayment = form.getButton({
            id: idBtn
        });
        if (btnPayment) {
            btnPayment.isHidden = true;
        }
        var id = newRecord.id;
        var type = newRecord.type;
        log.error("id",typeof id)
        log.error("type",typeof type)
        form.clientScriptModulePath = pathScriptClient;
        form.addButton({
            id: 'custpage_custom_button_pagamento_latam',
            label: translations.LMRY_BUTTOM_PAYMENT,
            functionName: "callModulePayment(" + id +")",
        });
    }
    
    function validatePaymentLR(subsidiary){
        var searchSetupTaxSubsi = search.create({
            type: "customrecord_lmry_setup_tax_subsidiary",
            filters: [["custrecord_lmry_setuptax_subsidiary", "anyof", subsidiary]],
            columns: ["custrecord_lmry_setuptax_br_pagamento_lr"]
        });

        var results = searchSetupTaxSubsi.run().getRange(0, 1);
        var isActive = results[0].getValue('custrecord_lmry_setuptax_br_pagamento_lr');
        return isActive === "T" || isActive === true ;
    }

    function callModulePayment(id) {

        var recordType;
        var aplplyWht;
        var searchTransaction = search.create({
            type: 'transaction',
            filters: [
                ['internalid', 'anyof', id],
                "AND", 
                ["mainline","is","T"]
            ],
            columns: [
                'recordType',
                'custbody_lmry_document_type.custrecord_lmry_document_apply_wht'
            ]
        })

        searchTransaction.run().each(function (result) {
            var columns = result.columns;
            recordType = result.getValue(columns[0]);
            aplplyWht = result.getValue(columns[1]);
        });
        var translations = getTranslations();
        if (aplplyWht !== "T" && aplplyWht !== true) {
            alert(translations.LMRY_NOT_APPLY_WHT)
            return false;
        }

        var newRecord = record.load({
            type: recordType,
            id: id
        });
        console.log(id);
        console.log("type:", recordType);
        var parameters = {
            "invoice": {
                status: "1",
                byTransaction: 1,
                subsidiary: newRecord.getValue("subsidiary"),
                customer: newRecord.getValue("entity"),
                customer: newRecord.getValue("entity"),
                currency: newRecord.getValue("currency"),
                araccount: newRecord.getValue("account"),
                document: newRecord.getValue("custbody_lmry_document_type"),
                paymentmethod: newRecord.getValue("custbody_lmry_paymentmethod"),
                exchangerate: newRecord.getValue("exchangerate"),
                idTransaction: id
            },
            "vendorbill": {
                status: "1",
                byTransaction: 1,
                subsidiary: newRecord.getValue("subsidiary"), 
                vendor: newRecord.getValue("entity"),
                currency: newRecord.getValue("currency"),
                ap_account: newRecord.getValue("account"),
                document: newRecord.getValue("custbody_lmry_document_type"),
                paymethod: newRecord.getValue("custbody_lmry_paymentmethod"),
                idTransaction: id
            }
        };
        
        // Para cada objeto dentro del objeto parameters
        for (var transationType in parameters) {
            if (parameters.hasOwnProperty(transationType)) {
                var params = parameters[transationType];
                // Verifica si existen valores para class, location y department
                if (newRecord.getValue("class")) {
                    params["class"] = newRecord.getValue("class");
                }
                if (newRecord.getValue("location")) {
                    params["location"] = newRecord.getValue("location");
                }
                if (newRecord.getValue("department")) {
                    params["department"] = newRecord.getValue("department");
                }
            }
        }
        
        console.log("parameters: ",parameters[recordType]);
        var redirectObject = {
            "invoice": {
                scriptId: "customscript_lmry_br_custpayments_stlt",
                deploymentId: "customdeploy_lmry_br_custpayments_stlt",
                returnExternalUrl: false,
                params: parameters["invoice"],
            },
            "vendorbill":{
                scriptId: "customscript_lmry_br_wht_pur_stlt",
                deploymentId: "customdeploy_lmry_br_wht_pur_stlt",
                returnExternalUrl: false,
                params: parameters["vendorbill"],
            }
        }
        var output = url.resolveScript(redirectObject[recordType]);
        window.location.href = output;
    }


    function getAccountingPeriods() {
        var periods = [];
        var search_periods = search.load({
            id: 'customsearch_lmry_open_accounting_period'
        });

        var columns = search_periods.columns;
        var results = search_periods.run().getRange(0, 1000);
        if (results && results.length) {
            for (var i = 0; i < results.length; i++) {
                var id = results[i].getValue(columns[0]);
                var name = results[i].getValue(columns[1]);
                var startdate = results[i].getValue(columns[2]);
                startdate = format.parse({ value: startdate, type: format.Type.DATE });
                var enddate = results[i].getValue(columns[3]);
                enddate = format.parse({ value: enddate, type: format.Type.DATE });

                periods.push({
                    value: id,
                    text: name,
                    startDate: startdate,
                    endDate: enddate
                });
            }
        }
        return periods;
    }

    function getPeriodByDate(date) {
        var periods = getAccountingPeriods();
        var period = 0;
        for (var i = 0; i < periods.length; i++) {
            if (periods[i]['startDate'] <= date && date <= periods[i]['endDate'].getTime()) {
                period = periods[i]['value'];
                break;
            }
        }
        return period;
    }


    function getTranslations() {
        var language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
        if (language !== "es" && language !== "pt") language = "en";

        var translatedFields = {
            "es": {
                "LMRY_BUTTOM_PAYMENT": "Pago Latam",
                "LMRY_NOT_APPLY_WHT": "No aplica retencion para el tipo de documento fiscal",
            },
            "en": {
                "LMRY_BUTTOM_PAYMENT": "Latam Payment",
                "LMRY_NOT_APPLY_WHT": "Does not apply withholding tax for this fiscal document type",
            },
            "pt": {
                "LMRY_BUTTOM_PAYMENT": "Pagamento Latam",
                "LMRY_NOT_APPLY_WHT": "Não se aplica retenção para este tipo de documento fiscal",
            }  
        }
        return translatedFields[language];
    }

    return {
      
        redirectModulePayment: redirectModulePayment,
        callModulePayment: callModulePayment,
        getPeriodByDate:getPeriodByDate
    };
});
