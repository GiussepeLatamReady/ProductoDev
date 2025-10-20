/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_BoletoBancarioLBRY_V2.0.js                  ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Dec 30 2021  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

define([
    "N/search",
    "N/record",
    "N/runtime",
    "N/url",
    "N/https",
    "N/log",
    "./LMRY_libSendingEmailsLBRY_V2.0",
    "./LMRY_BoletoBancarioBOALBRY_V2.0",
    "./LMRY_BoletoBancarioITAULBRY_V2.0",
    "./LMRY_BoletoBancarioBBLBRY_V2.0",
    "./LMRY_BoletoBancarioBRDLBRY_V2.0",
    "./LMRY_BoletoBancarioSTDLBRY_V2.0",
    "./LMRY_BoletoBancarioCitibankLBRY_V2.0",
    "./LMRY_BoletoBancarioJPMorganLBRY_V2.0"
], function (search, record, runtime, urlApi, https,log, libraryMail, libBOA, libItau, libBB, libBrad, libSant, libCity, libJPM) {

    var LMRY_script = "LMRY_BoletoBancarioLBRY_V2.0.js";

    function obtenerURLPdfBoletoBancario(idInvoice, fecha, type, transaction, idBr) {

        var type_interface = runtime.executionContext;
        var configBoleto = "", pdfBanco = "", create_br = false;
        var status = 1;
        var jsonInstallments = "";
        var licenses = [];

        // Búsqueda Invoice
        var resultInvoice = search.lookupFields({
            type: "invoice",
            id: idInvoice,
            columns: ["subsidiary", "custbody_lmry_paymentmethod"]
        });

        var subsidiary = "";
        if (resultInvoice["subsidiary"] && resultInvoice["subsidiary"].length) {
            subsidiary = resultInvoice["subsidiary"][0]["value"];
        }

        var paymentMethod = "";
        if (resultInvoice["custbody_lmry_paymentmethod"] && resultInvoice["custbody_lmry_paymentmethod"].length) {
            paymentMethod = resultInvoice["custbody_lmry_paymentmethod"][0]["value"];
        }

        licenses = libraryMail.getLicenses(subsidiary);

        var setupConfigBoleto, setupPdfBanco, setupPaymentMethod, setupDocumentEspecie;

        var isOneWorld = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
        var filters = [
            ["isinactive", "is", "F"]
        ];
        if (isOneWorld) filters.push("AND", ["custrecord_lmry_setuptax_subsidiary", "is", subsidiary]);

        // LatamReady - Setup Tax Subsidiary
        var setup_tax = search.create({
            type: "customrecord_lmry_setup_tax_subsidiary",
            filters: filters,
            columns: [
                "custrecord_lmry_setuptax_cg_bank_default",
                "custrecord_lmry_setuptax_cg_bank_ticket",
                "custrecord_lmry_setuptax_cg_bank_ticket.custrecord_lmry_pdf_bank",
                "custrecord_lmry_setuptax_br_paymt_method"
            ]
        });
        // Rango de busqueda
        var result_tax = setup_tax.run().getRange({ start: 0, end: 1 });
        //SI TIENE SETUP TAX

        if (result_tax && result_tax.length) {
            // Latam - BR Config Bank Default
            var defaultpdf = result_tax[0].getValue("custrecord_lmry_setuptax_cg_bank_default");
            if (defaultpdf == true || defaultpdf == "T") {
                // Latam - BR Config Bank Ticket
                setupConfigBoleto = result_tax[0].getValue("custrecord_lmry_setuptax_cg_bank_ticket");
                // LatamReady - BR Config Bank ticket - PDF Banco
                setupPdfBanco = result_tax[0].getValue({
                    join: "custrecord_lmry_setuptax_cg_bank_ticket", name: "custrecord_lmry_pdf_bank"
                });
            }
            setupPaymentMethod = result_tax[0].getValue("custrecord_lmry_setuptax_br_paymt_method");

            if (Number(setupConfigBoleto)) {
                //Br Config Bank Ticket
                var brConfig = search.create({
                    type: "customrecord_lmry_br_config_bank_ticket",
                    filters: [
                        ["internalid", "anyof", setupConfigBoleto], "AND",
                        ["isinactive", "is", "F"]
                    ],
                    columns: ["custrecord_lmry_bank_especie_doc"]
                });
                var result_brbbconfig = brConfig.run().getRange({ start: 0, end: 1 });
                if (result_brbbconfig && result_brbbconfig.length) {
                    setupDocumentEspecie = result_brbbconfig[0].getValue("custrecord_lmry_bank_especie_doc");;
                }
            };
        }

        if (setupPaymentMethod && Number(setupPaymentMethod) != Number(paymentMethod)) {
            return "";
        }
        if (transaction == null || transaction == undefined || transaction == "1") {

            /*=====================================================================================
              Generación de boleto desde invoice (LatamReady - Invoice URET V2.0) o a través de
              proceso OWN (Facturación Electrónica)
            ======================================================================================*/

            // LatamReady - BR Transaction Fields
            var brTransFields = search.create({
                type: "customrecord_lmry_br_transaction_fields",
                columns: ["custrecord_lmry_br_config_bank_ticket", "custrecord_lmry_br_pdf_bank", "custrecord_lmry_br_bb_status", "custrecord_lmry_br_installments"],
                filters: [
                    ["isinactive", "is", "F"], "AND",
                    ["custrecord_lmry_br_related_transaction", "anyof", idInvoice]
                ]
            }).run().getRange(0, 1);

            if (brTransFields != null && brTransFields != "" && brTransFields != undefined) {
                var estado = brTransFields[0].getValue("custrecord_lmry_br_bb_status");
                configBoleto = brTransFields[0].getValue("custrecord_lmry_br_config_bank_ticket");
                pdfBanco = brTransFields[0].getValue("custrecord_lmry_br_pdf_bank");
                jsonInstallments = brTransFields[0].getValue("custrecord_lmry_br_installments");
                idBr = brTransFields[0].id;
                create_br = true;
                if (estado != null && estado != "" && estado != 0) {
                    status = estado;
                }
            } else if (defaultpdf && (type_interface == "USERINTERFACE" || type_interface == "RESTLET")) {
                //Global amounts
                var brTF = record.create({
                    type: "customrecord_lmry_br_transaction_fields",
                    isDynamic: true
                });
                idBr = brTF;

                brTF.setValue({ fieldId: "custrecord_lmry_br_related_transaction", value: idInvoice });
                brTF.setValue({ fieldId: "custrecord_lmry_br_tf_subdidiary", value: subsidiary });
                brTF.setValue({ fieldId: "custrecord_lmry_br_config_bank_ticket", value: setupConfigBoleto });
                configBoleto = setupConfigBoleto;

                brTF.setValue({ fieldId: "custrecord_lmry_br_pdf_bank", value: setupPdfBanco });
                pdfBanco = setupPdfBanco;

                brTF.setValue({ fieldId: "custrecord_lmry_br_document_specie", value: setupDocumentEspecie });

                status = 1;
                brTF.setValue({ fieldId: "custrecord_lmry_br_bb_status", value: status });
                brTF.save();

                create_br = true;
            }
            // Solo si tiene no tiene configurado el boleto en Transaction Fields
            if (configBoleto == null || configBoleto == "" || configBoleto == undefined) {
                configBoleto = setupConfigBoleto;
                pdfBanco = setupPdfBanco;
            }

        } else if (transaction == "2") {
            /*=====================================================================================
              Generación de boleto desde Transaction Field (LatamReady - BR Trans Fields URET V2.0)
            ======================================================================================*/
            create_br = true;

            // LatamReady - BR Transaction Fields
            var br_transaction = search.lookupFields({
                type: "customrecord_lmry_br_transaction_fields",
                columns: ["custrecord_lmry_br_config_bank_ticket", "custrecord_lmry_br_pdf_bank", "custrecord_lmry_br_bb_status", "custrecord_lmry_br_installments"],
                id: idBr
            });

            // Latam - BR Config Bank Ticket
            if (br_transaction["custrecord_lmry_br_config_bank_ticket"].length > 0) {
                configBoleto = br_transaction["custrecord_lmry_br_config_bank_ticket"][0].value;
            }

            // Latam - BR PDF Bank
            if (br_transaction["custrecord_lmry_br_pdf_bank"].length > 0) {
                pdfBanco = br_transaction["custrecord_lmry_br_pdf_bank"][0].value;
            }

            // Latam - BR BB Status
            if (br_transaction["custrecord_lmry_br_bb_status"].length > 0) {
                status = br_transaction["custrecord_lmry_br_bb_status"][0].value;
            }

            jsonInstallments = br_transaction["custrecord_lmry_br_installments"];

        }

        var boleto = "";

        // Solo si tiene configurado el boleto

        if (configBoleto != null && configBoleto != "" && configBoleto != undefined) {
            switch (pdfBanco) {
                case "1":
                    //Boleto Bank Of America
                    if (libraryMail.getAuthorization(386, licenses) == true) {
                        boleto = libBOA.obtenerURLPdfBoletoBancario(idInvoice, configBoleto, status, fecha, jsonInstallments, type);
                    }
                    break;
                case "2":
                    //Boleto ITAU
                    if (libraryMail.getAuthorization(447, licenses) == true) {
                        boleto = libItau.obtenerURLPdfBoletoBancarioITAU(idInvoice, configBoleto, status, jsonInstallments, type);
                    }
                    break;
                case "3":
                    //Boleto Banco do Brasil
                    if (libraryMail.getAuthorization(446, licenses) == true && create_br == true) {
                        boleto = libBB.obtenerURLPdfBoletoBancario(idInvoice, configBoleto, status, jsonInstallments, type);
                    }
                    break;
                case "4":
                    //Boleto Banco Bradesco
                    if (libraryMail.getAuthorization(445, licenses) == true && create_br == true) {
                        boleto = libBrad.obtenerURLPDFBoletoBancario(idInvoice, configBoleto, status, jsonInstallments, type);
                    }
                    break;
                case "5":
                    //Boleto Banco Santander
                    if (libraryMail.getAuthorization(530, licenses) == true && create_br == true) {
                        boleto = libSant.obtenerURLPDFBoletoBancario(idInvoice, configBoleto, status, jsonInstallments, type);
                    }
                    
                    break;
                case "6":
                    //Boleto Banco Citibank
                    if (libraryMail.getAuthorization(531, licenses) == true) {
                        boleto = libCity.obtenerURLPDFBoletoBancario(idInvoice, configBoleto, status, jsonInstallments, type);
                    }
                    break;
                case "7":
                    //Boleto Banco JP Morgan
                    if (libraryMail.getAuthorization(743, licenses) == true) {
                        boleto = libJPM.obtenerURLPDFBoletoBancario(idInvoice, configBoleto, status, jsonInstallments, type, idBr);
                    }
                    break;
            }
        }

        return boleto;
    }

    function createPdfbankCheque(idInvoice, fecha, type, transaction, idBr) {
        try {
            https.requestRestlet({
                deploymentId: "customdeploy_lmry_br_bank_cheque_rslt",
                scriptId: "customscript_lmry_br_bank_cheque_rslt",
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                urlParams: {
                    idInvoice: idInvoice,
                    fecha: fecha,
                    type: type,
                    transaction: transaction,
                    idBr: idBr
                }
            });
        } catch (error) {
            log.error("error [createPdfbankCheque]", error)
        }

    }
    return {
        obtenerURLPdfBoletoBancario: obtenerURLPdfBoletoBancario,
        createPdfbankCheque: createPdfbankCheque
    };
});