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
    'N/url',
    "./LMRY_libSendingEmailsLBRY_V2.0"
], function (record, runtime, log, search,url, LibraryMail) {
    
    function redirectModulePayment(form, newRecord) {
        if (newRecord.type == "invoice" || newRecord.type == "vendorbill") {
            redirectForTransaction(form, newRecord);
        }else{
            redirectForEntity(form, newRecord);
        }
    }

    function redirectForEntity(form, newRecord){

        const subsidiary = newRecord.getValue("subsidiary");
        const pathScriptClient = newRecord.type == "customer" ? "../LMRY_EntityCLNT_V2.0.js" : "../LMRY_VendorCLNT_V2.0.js";
        const idBtn = newRecord.type == "customer" ? 'acceptpayment' : 'payment';
        var btnPayment = form.getButton({ id: idBtn });

        if (!validatePaymentLR(subsidiary) || !btnPayment) return false;
        
        btnPayment.isHidden = true;
        form.clientScriptModulePath = pathScriptClient;
        form.addButton({
            id: 'custpage_custom_button_pagamento_latam',
            label: getTranslations().LMRY_BUTTOM_PAYMENT,
            functionName: "callModulePaymentForEntity(" + subsidiary  +","+ newRecord.id+")",
        });
    }

    function redirectForTransaction(form, newRecord){
        const status = newRecord.getValue("approvalstatus");
        const subsidiary = newRecord.getValue("subsidiary");
        const pathScriptClient = newRecord.type == "invoice" ? "../LMRY_InvoiceCLNT_V2.0.js" : "../LMRY_VendorBillCLNT_V2.0.js";
        const idBtn = newRecord.type == "invoice" ? 'acceptpayment' : 'payment';
        var btnPayment = form.getButton({ id: idBtn });
        
        if (status != 2 || !validatePaymentLR(subsidiary) || !btnPayment) return false;
        
        btnPayment.isHidden = true;
        form.clientScriptModulePath = pathScriptClient;
        form.addButton({
            id: 'custpage_custom_button_pagamento_latam',
            label: getTranslations().LMRY_BUTTOM_PAYMENT,
            functionName: "callModulePayment(" + newRecord.id + ")",
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
        var applyWht;
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
            applyWht = result.getValue(columns[1]);
        });

        /*
        var translations = getTranslations();
        if (applyWht !== "T" && applyWht !== true) {
            alert(translations.LMRY_NOT_APPLY_WHT)
            return false;
        }
        */
        var newRecord = record.load({
            type: recordType,
            id: id
        });
        
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

    function callModulePaymentForEntity(subsidiaryID,entityID){

        var allLicenses = LibraryMail.getAllLicenses();
        var licenses = allLicenses[subsidiaryID];
        if (!LibraryMail.getAuthorization(141, licenses)) {
            alert(getTranslations().LMRY_FEATURE)
            return false;
        }

        var recordType;
        var searchEntity = search.create({
            type: 'entity',
            filters: [
                ['internalid', 'anyof', entityID]
            ],
            columns: [
                'type'
            ]
        });
        
        searchEntity.run().each(function (result) {
            recordType = result.getValue('type');
        });
        
        var params = { idS: subsidiaryID, idE: entityID };
        
        paramsResolveScript = {
            "Vendor":{
                scriptId: "customscript_lmry_br_wht_pur_stlt",
                deploymentId: "customdeploy_lmry_br_wht_pur_stlt",
                returnExternalUrl: false,
                params: params,
            },
            "CustJob":{
                scriptId: "customscript_lmry_br_custpayments_stlt",
                deploymentId: "customdeploy_lmry_br_custpayments_stlt",
                returnExternalUrl: false,
                params: params,
            }
        }

        var output = url.resolveScript(paramsResolveScript[recordType]);
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
                "LMRY_FEATURE": "Se debe activar la caracteristica EN PAGOS DE CLIENTES",
                "LMRY_VALIDATE": "Esta transacción debe pagarse a través del módulo de pago LatamReady"
            },
            "en": {
                "LMRY_BUTTOM_PAYMENT": "Latam Payment",
                "LMRY_FEATURE": "The feature must be activated IN CUSTOMER PAYMENTS",
                "LMRY_VALIDATE": "This transaction must be paid via the LatamReady payment module"
            },
            "pt": {
                "LMRY_BUTTOM_PAYMENT": "Pagamento Latam",
                "LMRY_FEATURE": "O recurso deve ser ativado EM PAGAMENTOS DO CLIENTE",
                "LMRY_VALIDATE": "Esta transação deve ser paga pelo módulo de pagamentos da LatamReady"
            }  
        }
        return translatedFields[language];
    }

    function validatePaymentSave(country,subsidiary,isClnt){
        
        if (country == "BR" && validatePaymentLR(subsidiary)) {
            if (isClnt) alert(getTranslations().LMRY_VALIDATE)

            return false
        }
        
        return true;
    }

    

    return {
      
        redirectModulePayment: redirectModulePayment,
        callModulePayment: callModulePayment,
        getPeriodByDate: getPeriodByDate,
        callModulePaymentForEntity: callModulePaymentForEntity,
        validatePaymentSave: validatePaymentSave,
        getTranslations: getTranslations
    };
});
