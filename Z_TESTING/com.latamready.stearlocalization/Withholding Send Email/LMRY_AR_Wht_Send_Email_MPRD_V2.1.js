/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name LMRY_AR_Wht_Send_Email_MPRD_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 18/07/2024
 */
define([
    "N/record",
    "N/runtime",
    "N/search",
    "N/log",
    "N/query",
    "../Withholding Certificate/LMRY_AR_Withholding_Certificate_LBRY",
    "../Withholding Certificate/LMRY_AR_Withholding_Certificate_PDF_LBRY"
], (
    record,
    runtime,
    search,
    log,
    query,
    WhtCertificate_LBRY,
    WthCertificatePdf_LBRY
) => {

    let recordStatus;
    const getInputData = (inputContext) => {
        try {
            setRecordStatus();
            log.error("recordStatus", recordStatus);
            const parameters = getParameters();
            log.error("parameters", parameters);
            const transactions = getTransactions(parameters);
            updateState(parameters, 'PROCESSING', 'Transactions have begun to be processed...');
            log.error("transactions", transactions);
            return transactions;
        } catch (error) {
            log.error("Error [getInputData]", error);
            //return [["isError", error.message]];

            return [{
                code: "ERROR",
                message: error.message
            }];
        }
    }

    const map = (mapContext) => {
        const value = JSON.parse(mapContext.value);
        log.error("value map", value)
        if (value.code === "ERROR") {
            mapContext.write({
                key: value.code,
                value: value
            });
        } else {
            const transaction = value;
            const { billPaymentID, vendorID } = transaction;
            try {      
                setDataAditional(transaction);
                const validationResponse = WhtCertificate_LBRY._validateVouchers(billPaymentID);
                log.error("validationResponse", validationResponse);
                let certificate;
                if (validationResponse.status) {
                    certificate = getCertificate(billPaymentID);

                    if (!certificate) {
                        certificate = createWhtCertificatePdf(transaction);
                    }
                    if (certificate.error) {
                        mapContext.write({
                            key: vendorID,
                            value: {
                                code: "VALIDATION",
                                message: certificate.message,
                                transaction
                            }
                        });
                    }else{
                        mapContext.write({
                            key: vendorID,
                            value: {
                                code:"OK",
                                transaction,
                                certificate
                            }
                        });
                    }
                }else{
                    mapContext.write({
                        key: vendorID,
                        value: {
                            code: "VALIDATION",
                            message: validationResponse.message,
                            transaction
                        }
                    });
                }      
            } catch (error) {
                log.error("Error [map]", error);
                mapContext.write({
                    key: vendorID,
                    value: {
                        code: "ERROR",
                        message: error.message,
                        transaction
                    }
                });
            }
        }

    }

    const reduce = (reduceContext) => {
        try {

            const { values } = reduceContext;
            log.error("values reduce", values)

            const paymentByvendor = values.map(payment => JSON.parse(payment));
            log.error("paymentByVendor",paymentByvendor)


            /*
            if (values.include("ERROR")) {
                context.write({
                    key: context.key,
                    value: context.values[0]
                });
            } else {

            }
            */
        } catch (error) {
            log.error("Error [reduce]", error);
            reduceContext.write({
                key: reduceContext.key,
                value: {
                    code: "ERROR",
                    message: error.message
                }
            });
        }
    }

    const summarize = summaryContext => {
        const parameters = getParameters();
        /*
        try {
            
            const results = [];
            summaryContext.output.iterator().each(function (key, value) {
                results.push(JSON.parse(value));
                return true;
            });
            const errors = results.filter(([key]) => key === 'ERROR');
    
            const transactionsData = getTransactions(parameters);
            const transactionIds = transactionsData.map(({id}) => id);
            const idsSuccess = results.filter(([key, value]) => value === 'T').map(([id]) => id);
            const idsError = transactionIds.filter(id => !idsSuccess.includes(id));
    
            const transactions = [
                ...idsSuccess.map(id => ({id, state: 'Procesada con exito'})),
                ...idsError.map(id => ({id, state: 'Error'}))
            ];
    
            
            updateTransactionState(parameters, transactions);
            
    
            if (errors.length === 0) {
                updateState(parameters, 'Finalizado', 'Las transacciones han sido procesadas con exito');
            } else {
                log.error("error Summarize [interno]", errors[0][1]);
                updateState(parameters, 'Ocurrió un error', errors[0][1]);
            }
        } catch (error) {
            
            log.error("error Summarize [interno]", error.message);
            updateState(parameters, 'Ocurrió un error', error.message);
        }
        */
    };


    const getParameters = () => {
        /*
        return {
            idUser: runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_ste_ar_wht_se_user' }),
            logIDs: JSON.parse(runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_ste_ar_wht_se_state' })),
        }
        */
        return {
            userID: "3787",
            logIDs: [
                9,
                10
            ]
        }
    }


    const setRecordStatus = () => {
        let status = {}
        const newSearchStatus = search.create({
            type: "customrecord_lmry_ste_process_status",
            filters: [],
            columns: [
                "name",
                "custrecord_lmry_ste_procstatus_code"
            ]
        });

        newSearchStatus.run().each(result => {
            const columns = result.columns;
            const code = result.getValue(columns[1]);
            status[code] = {
                id: result.id,
                name: result.getValue(columns[0])
            }
            return true;
        });

        recordStatus = status;
    }
    const getFeatures = () => {

        return {
            department: runtime.isFeatureInEffect({ feature: "DEPARTMENTS" }),
            "class": runtime.isFeatureInEffect({ feature: "CLASS" }),
            location: runtime.isFeatureInEffect({ feature: "LOCATIONS" }),
            multibook: runtime.isFeatureInEffect({ feature: "MULTIBOOK" }),
            subsidiary: runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' })
        }
    }

    const getTransactions = (parameters) => {
        const {logIDs,userID} = parameters;
        let recordLog = [];
        let billPaymentsResult = [];
        let searchRecordLog = search.create({
            type: 'customrecord_lmry_ste_ar_wht_send',
            filters: [
                ['internalid', 'anyof', logIDs]
            ],
            columns: [
                'custrecord_lmry_ste_ar_wht_se_payments',
                'custrecord_lmry_ste_ar_wht_se_vendor',
                'custrecord_lmry_ste_ar_wht_se_subsi',
                'custrecord_lmry_ste_ar_wht_se_email'
            ]
        })
        searchRecordLog.run().each(function (result) {
            recordLog.push({
                transactions: result.getValue('custrecord_lmry_ste_ar_wht_se_payments'),
                vendorID: result.getValue('custrecord_lmry_ste_ar_wht_se_vendor'),
                subsidiaryID: result.getValue('custrecord_lmry_ste_ar_wht_se_subsi'),
                email: result.getValue('custrecord_lmry_ste_ar_wht_se_email'),

            })
            return true;
        });


        recordLog.forEach(({ transactions, vendorID, subsidiaryID, email }) => {
            const billPayments = JSON.parse(transactions);
            const paymentsObject = billPayments.map(billPaymentID => ({ billPaymentID, vendorID, subsidiaryID, email, userID}));
            billPaymentsResult = billPaymentsResult.concat(paymentsObject);
        });
        return billPaymentsResult;
    }

    /* ------------------------------------------------------------------------------------------------------
    * Esta funcion permite actualiazr el estado del proceso segun la etapa del flujo del modulo.
    * --------------------------------------------------------------------------------------------------- */
    const updateState = (parameters, status, msgDetails) => {
        const { logIDs } = parameters;


        logIDs.forEach(id => {
            record.submitFields({
                type: 'customrecord_lmry_ste_ar_wht_send',
                id: id,
                values: {
                    custrecord_lmry_ste_ar_wht_se_status: recordStatus[status].id,
                    custrecord_lmry_ste_ar_wht_se_details: msgDetails
                },
                options: { ignoreMandatoryFields: true, disableTriggers: true }
            });
        })

    }

    const updateTransactionState = (parameters, transactions) => {
        record.submitFields({
            type: 'customrecord_lmry_co_head_wht_cal_log',
            id: parameters.logIDs,
            values: {
                custrecord_lmry_co_hwht_log_transactions: JSON.stringify(transactions)
            },
            options: { ignoreMandatoryFields: true, disableTriggers: true }
        });
    }

    const setDataAditional = (transaction) => {

        const {billPaymentID,userID} = transaction;
        const searchPayment = search.create({
            type: 'vendorpayment',
            columns: ['internalid', 'tranid','entity'],
            filters: [
                { name: 'internalid', operator: 'anyof', values: billPaymentID },
                { name: 'mainline', operator: 'is', values: 'T' }
            ]
        });

        searchPayment.run().each(result => {
            transaction.tranid = result.getValue("tranid");
            transaction.vendorName = result.getText("entity");
        });

        const searchEmployee = search.create({
            type: 'employee',
            columns: ['subsidiary','entityid'],
            filters: [
                { name: 'internalid', operator: 'anyof', values: userID },
                { name: 'mainline', operator: 'is', values: 'T' }
            ]
        });

        searchEmployee.run().each(result => {
            transaction.userSubsidiary = result.getText("subsidiary");
            transaction.userName = result.getValue("entityid");
        });

    }

    const createWhtCertificatePdf = (transaction) => {
        let certificate = {};
        try {
            const { billPaymentID: paymentId, subsidiaryID: subsidiaryId, vendorID: vendorId } = transaction;
            const pdfWhtCertificate = new WthCertificatePdf_LBRY.WthCertificatePdf({ paymentId, subsidiaryId, vendorId });
            pdfWhtCertificate.createPdf();
            pdfWhtCertificate.savePdf();
            certificate.pdf = pdfWhtCertificate.getWhtPdfCertificate();
            certificate.id = pdfWhtCertificate.getWhtRecordCertificate();
            return certificate;
        } catch (error) {
            certificate.error = true;
            certificate.message = error.message;
            return certificate;
        }


    }


    const getCertificate = (billpaymentID) => {
        /* Query */

        let certificate;
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
            fieldId: "custrecord_lmry_ste_ar_wht_cert_trans",
            operator: query.Operator.ANY_OF,
            values: [billpaymentID]
        });

        whtCertificateQuery.condition = whtCertificateQuery.and(transactionCondition, isInactiveCondition);

        /* Columns */
        const internalId = whtCertificateQuery.createColumn({
            fieldId: "id"
        });

        const idPdfDocument = whtCertificateQuery.createColumn({
            fieldId: "custrecord_lmry_ste_ar_wht_cert_file_id",
            alias: "pdfID"
        });

        whtCertificateQuery.columns = [internalId, idPdfDocument];

        const whtCertificateQueryResults = whtCertificateQuery.run().asMappedResults();

        if (whtCertificateQueryResults && whtCertificateQueryResults.length > 0) {
            certificate = whtCertificateQueryResults[0];
        }
        return certificate;
    }
    return { getInputData, map, reduce, summarize }

});