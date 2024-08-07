/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =*\
||  This script for Report - Chile                                      ||
||                                                                      ||
||  File Name: TEST_GADP_SCHDL_V2.0.js                       ||
||                                                                      ||
||  Version Date           Author            Remarks                    ||
||  2.0     April 01 2023  Giussepe Delgado  Use Script 2.0             ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define([
    'N/file',
    "N/search", 
    "N/record", 
    "N/log", 
    "N/query", 
    "N/runtime"
],
    function (file,search, record, log, query, runtime,libryVoidItemReceipt) {

        function execute(Context) {
            // ID de la transacción que deseas duplicar
            try {
                const certificate = getCertificate();
                log.error("certificate",certificate)
            } catch (error) {
                log.error("error", error)
            }

        }

        
        function updateRecord(){

        }


        const getCertificate = () => {
            /* Query */
    
            const certificate = [];
            const whtCertificateQuery = query.create({
                type: "customrecord_lmry_ste_ar_wht_certificate"
            });
    
            /* Conditions */
            const isInactiveCondition = whtCertificateQuery.createCondition({
                fieldId: "isinactive",
                operator: query.Operator.IS,
                values: [false]
            });
            
            const transactionCondition = whtCertificateQuery.createCondition({
                fieldId: "custrecord_lmry_ste_ar_wht_cert_file_id",
                operator: query.Operator.EMPTY
            });
            
            whtCertificateQuery.condition = whtCertificateQuery.and(isInactiveCondition,transactionCondition);
            //whtCertificateQuery.condition = whtCertificateQuery.and(isInactiveCondition);
            /* Columns */
            const internalId = whtCertificateQuery.createColumn({
                fieldId: "id"
            });
    
            whtCertificateQuery.columns = [internalId];
    
            const whtCertificateQueryResults = whtCertificateQuery.run().asMappedResults();
    
            if (whtCertificateQueryResults && whtCertificateQueryResults.length > 0) {

                whtCertificateQueryResults.forEach(element => {
                    log.error("element",element)
                    let pdf = record.load({
                        type: "customrecord_lmry_ste_ar_wht_certificate",
                        id: element.id
                    }).getValue("custrecord_lmry_ste_ar_wht_cert_file");
                    log.error("pdf",pdf)
                    log.error("pdf",typeof pdf)

                    if (pdf) {
                        updateCertificate(element.id, pdf)
                    }
                });

            }


            return certificate;
        }

        const updateCertificate = (certificateID,pdfID) => {

            if (pdfID) {
                record.submitFields({
                    type: 'customrecord_lmry_ste_ar_wht_certificate',
                    id: certificateID,
                    values: {
                        custrecord_lmry_ste_ar_wht_cert_file_id: pdfID
                    },
                    options: { ignoreMandatoryFields: true, disableTriggers: true }
                });
                log.error("updateCertificate","pdf actualizado")
            } 
        }

        return {
            execute: execute
        };
    });


