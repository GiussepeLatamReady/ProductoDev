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
    'N/file',
    'N/email',
    "../Withholding Certificate/LMRY_AR_Withholding_Certificate_LBRY",
    "../Withholding Certificate/LMRY_AR_Withholding_Certificate_PDF_LBRY"
], (
    record,
    runtime,
    search,
    log,
    query,
    file,
    email,
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
        if (value.code === "ERROR") {
            mapContext.write({
                key: value.code,
                value: value
            });
        } else {
            const transaction = value;
            const { billPaymentID, vendorID } = transaction;
            log.error("billPaymentID",billPaymentID)
            try {
                setDataAditional(transaction);
                const validationResponse = WhtCertificate_LBRY._validateVouchers(billPaymentID);
                log.error("validationResponse", validationResponse);
                let certificate;
                if (validationResponse.status) {
                    certificate = getCertificate(billPaymentID);

                    if (!(certificate?.pdfID)) certificate = createWhtCertificatePdf(transaction);

                    if (certificate.error) {
                        transaction.status = "no sent";
                        transaction.message = certificate.message;
                        mapContext.write({
                            key: vendorID,
                            value: {
                                code: "VALIDATION",
                                message: certificate.message,
                                transaction
                            }
                        });
                    } else {
                        transaction.status = "sent";
                        transaction.message = "successful mailing";
                        mapContext.write({
                            key: vendorID,
                            value: {
                                code: "OK",
                                transaction,
                                certificate
                            }
                        });
                    }
                } else {
                    transaction.status = "no sent";
                    transaction.message = validationResponse.message;
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
                transaction.status = "Script Error";
                transaction.message = error.message;
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

        setRecordStatus();
        const { values } = reduceContext;
        const payments = values.map(payment => JSON.parse(payment));
        const parameters = getParameters();
        try {
            const errors = payments.filter(payment => payment.code === "ERROR");
            const { userID, email: emailVendor } = payments[0].transaction;

            /*
            const certifiedPaymentsPDF = payments.reduce((acc, payment) => {
                if (payment.code === "OK") acc.push(payment.certificate.pdf);
                return acc;
            }, []);
            */
            const certifiedPaymentsPDF = payments.reduce((acc, payment) => {
                if (payment.code === "OK") acc.push(file.load({ id: payment.certificate.pdfID }));
                return acc;
            }, []);

            log.error("certifiedPaymentsPDF", certifiedPaymentsPDF.length);
            payments.certifiedCount = certifiedPaymentsPDF.length;
            const emailBodyContent = buildMailBody(payments);

            

            if (certifiedPaymentsPDF.length) {
                email.send(
                    {
                        author: userID,
                        recipients: [emailVendor],
                        attachments: certifiedPaymentsPDF,
                        subject: 'LatamReady - WHT Send Email',
                        body: emailBodyContent
                    }
                );
                log.error("responseEmail","se envio el email");
                updateState(parameters,"DONE","payments sent", payments[0].transaction.logID);
            }else{
                log.error("responseEmail","no hay certificaciones para enviar");
                updateState(parameters,"DONE","no certification was sent", payments[0].transaction.logID);
            }

            const paymentsDetail = payments.map(payment => {
                const {billPaymentID, message} = payment.transaction;
                const certificate = payment.certificate ?  payment.certificate.pdfID : "0";
                return {billPaymentID,message,code:payment.code,certificate};
            });

            updatePaymentsState(payments[0].transaction.logID,paymentsDetail);
            if (errors.length) {
                log.error("responseEmail","errores reduce");
                updateState(parameters,"ERROR",errors[0].message, errors[0].transaction.logID);
            }


        } catch (error) {
            log.error("Error [reduce]", error);
            updateState(parameters,"ERROR",error.message, payments[0].transaction.logID);
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
        const { logIDs, userID } = parameters;
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
                logID: result.id

            })
            return true;
        });


        recordLog.forEach(({ transactions, vendorID, subsidiaryID, email, logID }) => {
            const billPayments = JSON.parse(transactions);
            const paymentsObject = billPayments.map(billPaymentID => ({ billPaymentID, vendorID, subsidiaryID, email, userID, logID }));
            billPaymentsResult = billPaymentsResult.concat(paymentsObject);
        });
        return billPaymentsResult;
    }

    /* ------------------------------------------------------------------------------------------------------
    * Esta funcion permite actualiazr el estado del proceso segun la etapa del flujo del modulo.
    * --------------------------------------------------------------------------------------------------- */
    const updateState = (parameters, status, msgDetails, logID) => {
        const { logIDs } = parameters;


        if (logID) {
            record.submitFields({
                type: 'customrecord_lmry_ste_ar_wht_send',
                id: logID,
                values: {
                    custrecord_lmry_ste_ar_wht_se_status: recordStatus[status].id,
                    custrecord_lmry_ste_ar_wht_se_details: msgDetails
                },
                options: { ignoreMandatoryFields: true, disableTriggers: true }
            });
        }else{
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

        

    }

    const updatePaymentsState = (logID, billPayments) => {
        record.submitFields({
            type: 'customrecord_lmry_ste_ar_wht_send',
            id: logID,
            values: {
                custrecord_lmry_ste_ar_wht_se_payments: JSON.stringify(billPayments)
            },
            options: { ignoreMandatoryFields: true, disableTriggers: true }
        });
    }

    const setDataAditional = (transaction) => {

        const { billPaymentID, userID } = transaction;
        const searchPayment = search.create({
            type: 'vendorpayment',
            columns: ['internalid', 'tranid', 'entity'],
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
            columns: ['subsidiary', 'entityid'],
            filters: [
                { name: 'internalid', operator: 'anyof', values: userID }
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
        /*
        log.error("get certificate", certificate);
        if (certificate?.pdfID) {
            certificate.pdf = file.load({ id: certificate.pdfID });
        }
            */
        return certificate;
    }

    const buildMailBody = (data) => {
        const { transaction } = data[0];
        const { vendorName, userSubsidiary, userName } = transaction;

        
        const body = `
      
                <div style="color: #483838; margin-bottom: 2.5rem" class="container-body">
                  <div style="text-align: center">
                    <img src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81015&c=TSTDRV1930452&h=58hbjHzF0ZDtq-F905Nr-8LibSvzYGEq0aTFdlmqxQL-noK9" alt="" class="imgBanner" />
                    <p style="font-size: 18px">
                        <strong>Dear: </strong>${userName}
                    </p>
                  </div>
                  <p style="margin-bottom: 25px">
                    This is an automatic error message from latamready suiteApp
                  </p>
                  <br/>
                  <p style="font-weight: bold;">General details</p>
                  <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                      <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                          Enviroment
                      </p>
                    <p style="margin: 0">${runtime.envType}</p>
                  </div>
                  <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                      <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                          Account ID
                      </p>
                      <p style="margin: 0">${runtime.accountId}</p>
                  </div>
                  <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                      <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                          Employee Subsidiary
                      </p>
                      <p style="margin: 0">${userSubsidiary}</p>
                  </div>
                  
                  <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                      <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                          Netsuite Released Version
                      </p>
                      <p style="margin: 0">${runtime.version}</p>
                  </div>
                  <br/>
                  <p style="font-weight: bold;">Vendor details</p>
                  <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                      <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                          Proveedor name
                      </p>
                      <p style="margin: 0">${vendorName}</p>
                  </div>
                  <br/>
                  <p style="font-weight: bold;">Payments</p>
                  
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem" role="presentation">
                    <tbody style="line-height: 24px">
                      <tr style="margin: 100px">
                        <td style="padding: 10px">Processed Payments</td>
                        <td style="padding: 10px; text-align: right">
                          <strong>${data.length}</strong>
                        </td>
                        </tr>
                          <tr style="background-color: #EBFBDF">
                            <td style="padding: 10px">Corrects</td>
                            <td style="text-align: right; padding: 10px">
                              <strong>${data.certifiedCount}</strong>
                            </td>
                        </tr>
                          <tr style="background-color: #fef2f2">
                            <td style="padding: 10px">Incorrects</td>
                            <td style="text-align: right; padding: 10px">
                              <strong>${data.length - data.certifiedCount}</strong>
                            </td>
                          </tr>
                    </tbody>
                  </table>
                  <div class="scroll" style="overflow-x:auto; overflow-y: scroll; min-height: auto; max-height: 400px; margin-bottom: 2.5rem;">
                              <table style="width: 100%; font-size: 14px; text-align: left; border-collapse: collapse;">
                                  <thead>
                                      <tr style="background-color: #fef2f2">
                                          <th style="padding: 10px">Order</th>
                                          <th style="padding: 10px">Payment</th>
                                          <th style="padding: 10px">Status</th>
                                          <th style="padding: 10px">Details status</th>
                                      </tr>
                                  </thead>
                                  <tbody >
                                    ${data
                                        .map((payment, index) => {
                                            const textColor = payment.code === 'OK' ? '#6ed613' : '#ff0000';
                                            const { transaction } = payment;
                                            return `<tr>
                                                                    <td style="padding: 10px; color: ${textColor}; font-weight: bold;">${index + 1}</td>
                                                                    <td style="padding: 10px; color: ${textColor}; font-weight: bold;">${transaction.tranid}</td>
                                                                    <td style="padding: 10px; color: ${textColor}; font-weight: bold;">${transaction.status}</td>
                                                                    <td style="padding: 10px; color: ${textColor}; font-weight: bold;">${transaction.message}</td>
                                                                </tr>`;
                                        })
                                        .join("")
                                    }
                                  </tbody>
                              </table>
                          </div>
                </div>`;

        return _emailTemplate(body);
    }

    const _emailTemplate = (body) => {
        try {
            const html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                    <link href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap" rel="stylesheet" />
                    <style>
                        .container-body {
                            padding: 0 1.5rem;
                        }
                
                        .fontSize {
                            font-size: 16px;
                        }
                
                        .imgBanner {
                            width: 290px;
                            height: 234px;
                        }
                
                        .iconSocial {
                            width: 30px;
                            height: 30px;
                        }
                
                        @media screen and (max-width: 600px) {
                            .container-body {
                                padding: 0 10px;
                            }
                
                            .fontSize {
                                font-size: 14px;
                            }
                
                            .imgBanner {
                                width: 240px;
                                height: 184px;
                            }
                
                            .iconSocial {
                                width: 25px;
                                height: 25px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div style="border: 1px solid #fef3f3; border-radius: 10px; overflow: hidden; max-width: 700px; margin: auto; font-family: 'Montserrat', sans-serif;" class="fontSize">
                        <div>
                            <img width="100%" src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=921&c=TSTDRV1038915&h=c493217843d184e7f054" style="display: block" />
                            <div class="container-body" style="margin-top: 15px">
                                <table style="width: 100%">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <a style="border: 1px solid #d50303; color: #d50303; padding: 5px 10px; border-radius: 5px; text-decoration: none; font-weight: bold;" href="http://www.latamready.com/#contac" target="_blank">Contact us</a>
                                            </td>
                                            <td style="text-align: right">
                                                <a href="https://www.latamready.com/" target="_blank" style="text-decoration: none; margin-right: 5px">
                                                    <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81019&c=TSTDRV1930452&h=cJ2X1VY4nFbUzf385R7F5olJqkVQM8nCil2SstjTV7tl7VP1" alt="" />
                                                </a>
                                                <a href="https://twitter.com/LatamReady" target="_blank" style="text-decoration: none; margin-right: 5px">
                                                    <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81013&c=TSTDRV1930452&h=E96ec-7rY3GokgxHrdHLrJm-YrTH0Y_ZNfB5FetfrXV3bwQn" alt="" />
                                                </a>
                                                <a href="https://www.linkedin.com/company/9207808" target="_blank" style="text-decoration: none; margin-right: 5px">
                                                    <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81012&c=TSTDRV1930452&h=vcrpc7uakujhp6v4PU71cM-SOccTb4XyWAGOqrf5FWcmTFGf" alt="" />
                                                </a>
                                                <a href="https://www.facebook.com/LatamReady-337412836443120/" target="_blank" style="text-decoration: none; margin-right: 5px">
                                                    <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81010&c=TSTDRV1930452&h=7hfzz7JtKpfMxiYei9LFmIaBvSmKmolDe5EddHl7gfCXzsyx" alt="" />
                                                </a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <!-- cuerpo -->
                        ${body}
                        <!-- fin de cuerpo -->
                        <div>
                            <div style="margin-bottom: 16px; text-align: center">
                                <a href="https://www.latamready.com/" target="_blank" style="text-decoration: none; margin-right: 5px">
                                    <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81019&c=TSTDRV1930452&h=cJ2X1VY4nFbUzf385R7F5olJqkVQM8nCil2SstjTV7tl7VP1" alt="" />
                                </a>
                                <a href="https://twitter.com/LatamReady" target="_blank" style="text-decoration: none; margin-right: 5px">
                                    <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81013&c=TSTDRV1930452&h=E96ec-7rY3GokgxHrdHLrJm-YrTH0Y_ZNfB5FetfrXV3bwQn" alt="" />
                                </a>
                                <a href="https://www.linkedin.com/company/9207808" target="_blank" style="text-decoration: none; margin-right: 5px">
                                    <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81012&c=TSTDRV1930452&h=vcrpc7uakujhp6v4PU71cM-SOccTb4XyWAGOqrf5FWcmTFGf" alt="" /></a>
                                <a href="https://www.facebook.com/LatamReady-337412836443120/" target="_blank" style="text-decoration: none; margin-right: 5px">
                                    <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81010&c=TSTDRV1930452&h=7hfzz7JtKpfMxiYei9LFmIaBvSmKmolDe5EddHl7gfCXzsyx" alt="" />
                                </a>
                            </div>
                            <img style="display: block" width="100%" src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=918&c=TSTDRV1038915&h=7f0198f888bdbb495497" alt="" />
                        </div>
                    </div>
                </body>
                </html>
            `;

            return html;
        } catch (error) {
            nLog.error({ title: `[ ${LMRY_SCRIPT} : _emailTemplate ]`, details: error });
        }
    };

    return { getInputData, map, reduce, summarize }

});