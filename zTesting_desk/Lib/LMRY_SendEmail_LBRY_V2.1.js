/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_SendEmail_LBRY_V2.1.js
 * @Author LatamReady - Gerson Sanchez
 * @Date 12/05/2023
 */
define([
    "N/log",
    "N/search",
    "N/runtime",
    "N/suiteAppInfo",
    "N/email"
], (nLog, nSearch, nRuntime, nSuiteAppInfo, nEmail) => {

    const LMRY_SCRIPT = "LR Send Email LBRY V2.1";
    const LMRY_SCRIPT_NAME = "LMRY_SendEmail_LBRY_V2.1.js";

    const sendErrorEmail = (paramMessage, paramScript) => {

        const user = {
            id: nRuntime.getCurrentUser().id,
            name: nRuntime.getCurrentUser().name,
            email: nRuntime.getCurrentUser().email,
            subsidiary: nRuntime.getCurrentUser().subsidiary
        };

        let subsidiaryName = ""
        if (user.subsidiary && user.subsidiary !== "" && user.subsidiary !== null) {
            subsidiaryName = nSearch.lookupFields({
                type: nSearch.Type.SUBSIDIARY,
                id: user.subsidiary,
                columns: ["legalname"]
            })["legalname"];
        }

        const scriptId = nRuntime.getCurrentScript().id;
        let suiteApp = nSuiteAppInfo.listSuiteAppsContainingScripts({ scriptIds: [scriptId] });
        suiteApp = suiteApp[scriptId];

        const bodyHtml = `
            <div style="color: #483838; margin-bottom: 2.5rem" class="container-body">
                <div style="text-align: center">
                    <img src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81016&c=TSTDRV1930452&h=GDs3JoPtwSo-dWnfz1L8Tk_1vFRlHpFBTq0eqakr2pnpZ3gX" alt="" class="imgBanner" />
                    <p style="font-size: 18px">
                        <strong>Dear: </strong>${user.name}
                    </p>
                </div>
                <p style="margin-bottom: 25px">
                    This is an automatic error message from latamready suiteApp
                </p>
                <div style="border-radius: 5px; border: 1px solid #dc2626; background-color: #fef2f2; padding: 16px; word-break: break-all;">
                    <img style="vertical-align: top" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81020&c=TSTDRV1930452&h=u2vzMLH9PlIftiP1wRuyWW5Zu3P52HUM4vxLo9xXtYihtu6e" alt="" />
                    <div style="width: 80%; display: inline-block; padding-left: 7px; color: #dc2626;">
                        <p style="margin: 0; margin-bottom: 5px; font-weight: bold">
                            Script: ${paramScript}
                        </p>
                        <p style="margin: 0">
                            ${paramMessage}
                        </p>
                    </div>
                </div>
                <p>More details of the error</p>
                <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                    <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                        Date and hours
                    </p>
                    <p style="margin: 0">${new Date()}</p>
                </div>
                <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                    <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                        Enviroment
                    </p>
                    <p style="margin: 0">${nRuntime.envType}</p>
                </div>
                <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                    <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                        Account ID
                    </p>
                    <p style="margin: 0">${nRuntime.accountId}</p>
                </div>
                <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                    <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                        Employee Subsidiary
                    </p>
                    <p style="margin: 0">${subsidiaryName}</p>
                </div>
                <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                    <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                        Execution Context
                    </p>
                    <p style="margin: 0">${nRuntime.executionContext}</p>
                </div>
                <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                    <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                        SuiteApp ID
                    </p>
                    <p style="margin: 0">${suiteApp}</p>
                </div>
                <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                    <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                        Script ID
                    </p>
                    <p style="margin: 0">${scriptId}</p>
                </div>
                <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                    <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                        Netsuite Released Version
                    </p>
                    <p style="margin: 0">${nRuntime.version}</p>
                </div>
            </div>
        `;

        const emailContent = _emailTemplate(bodyHtml);

        if (user.email && user.email !== "" && user.email !== null) {
            nEmail.send({
                author: user.id,
                body: emailContent,
                recipients: [user.email],
                subject: "LatamReady User Error"
            });
        }

    }

    const sendTREDetailsEmail = (paramJsonResults, paramSubsidiary, paramProcess) => {

        try {

            const user = {
                id: "",
                name: "",
                email: "",
            };

            let subsidiaryName = "";

            if (paramProcess === "Manual") {

                user.id = nRuntime.getCurrentUser().id;
                user.name = nRuntime.getCurrentUser().name;
                user.email = nRuntime.getCurrentUser().email;

                subsidiaryName = nSearch.lookupFields({
                    type: nSearch.Type.SUBSIDIARY,
                    id: paramSubsidiary,
                    columns: ["legalname"]
                })["legalname"];

            } else {

                const STS_Search = nSearch.create({
                    type: "customrecord_lmry_ste_setuptax_subsi",
                    columns: [
                        nSearch.createColumn({ name: "custrecord_lmry_ste_sts_employee_respon", label: "Latam - Employee Responsible" }),
                        nSearch.createColumn({ name: "legalname", join: "custrecord_lmry_ste_sts_subsidiary", label: "Legal Name" })
                    ],
                    filters: [
                        nSearch.createFilter({ name: "isinactive", operator: nSearch.Operator.IS, values: ["F"] }),
                        nSearch.createFilter({ name: "custrecord_lmry_ste_sts_subsidiary", operator: nSearch.Operator.ANYOF, values: paramSubsidiary })
                    ]
                }).run().getRange({ start: 0, end: 10 });

                if (STS_Search && STS_Search.length > 0) {

                    subsidiaryName = STS_Search[0].getValue({ name: "legalname", join: "custrecord_lmry_ste_sts_subsidiary" });
                    const STS_EmployeeManager = STS_Search[0].getValue({ name: "custrecord_lmry_ste_sts_employee_respon" });

                    const employeeSearch = nSearch.lookupFields({
                        type: nSearch.Type.EMPLOYEE,
                        id: STS_EmployeeManager,
                        columns: [ "entityid", "internalid", "email" ]
                    });

                    user.id = employeeSearch["internalid"][0].value;
                    user.name = employeeSearch["entityid"];
                    user.email = employeeSearch["email"];

                }

            }

            const bodyHtml = `
                <div style="color: #483838; margin-bottom: 2.5rem" class="container-body">
                    <div style="text-align: center; margin-top: 20px">
                        <img src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81014&c=TSTDRV1930452&h=EWrrMWFaywEwIVZMnWbsuJSQ-dVhaXkg3yDmIOPReHHj5EBA" alt="" class="imgBanner" />
                        <p style="font-size: 18px">
                            <strong>Dear: </strong>${user.name}
                        </p>
                    </div>
                    <p style="margin-bottom: 1.5rem">
                        ${paramJsonResults.length} transaction are being processed. These transactions belong to the following subsidiary: <strong>${subsidiaryName}</strong>
                    </p>
                    <div class="scroll" style="overflow-x: auto; margin-bottom: 2.5rem; ">
                        <table style="width: 100%; font-size: 14px; text-align: left; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #fef2f2">
                                    <th style="padding: 10px">Order</th>
                                    <th style="padding: 10px">Date</th>
                                    <th style="padding: 10px">Type</th>
                                    <th style="padding: 10px">Ref N°</th>
                                    <th style="padding: 10px">Entity</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${paramJsonResults.map((jsonResult, index) => {
                                    return `<tr>
                                        <td style="padding: 10px;">${index + 1}</td>
                                        <td style="padding: 10px;">${jsonResult.date}</td>
                                        <td style="padding: 10px;">${jsonResult.type}</td>
                                        <td style="padding: 10px;">${jsonResult.number}</td>
                                        <td style="padding: 10px;">${jsonResult.entity}</td>
                                    </tr>`  
                                }).join("")}
                            </tbody>
                        </table>
                    </div>
                    <div style="width: 95%; margin: auto; background-color: #f0f9ff; color: #003f79; padding: 10px 12px; box-sizing: border-box; margin-bottom: 2rem;">
                        <table>
                            <tr>
                                <td style="vertical-align: top">
                                    <img width="30px" height="30px" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81017&c=TSTDRV1930452&h=imFPmW2WIVmp4As_RyAyRqE_SzDHvb2QI6l8INEtVVUuwiFK" />
                                </td>
                                <td style="vertical-align: top; padding-left: 15px; line-height: 1.3rem;">
                                    Please contact our Customer Service department at:
                                    <span style="text-decoration: underline">customer.care@latamready.com</span>
                                    who will take care of the matter.
                                </td>
                            </tr>
                        </table>
                    </div>
                    <p>Regards,</p>
                    <p>The LatamReady Team</p>
                </div>
            `;

            const emailContent = _emailTemplate(bodyHtml);

            if (user.email && user.email !== "" && user.email !== null) {
                nEmail.send({
                    author: user.id,
                    body: emailContent,
                    recipients: [user.email],
                    subject: "LatamReady - Tax Result Engine (Details)"
                });
            }

        } catch (error) {
            nLog.error({ title: `[ ${LMRY_SCRIPT} : sendTREDetailsEmail ]`, details: error });
        }

    }

    const sendTRESummaryEmail = (paramSubsidiary, paramTreSummary, paramProcess) => {

        try {

            const user = {
                id: "",
                name: "",
                email: "",
            };

            let subsidiaryName = "";

            if (paramProcess === "Manual") {

                user.id = nRuntime.getCurrentUser().id;
                user.name = nRuntime.getCurrentUser().name;
                user.email = nRuntime.getCurrentUser().email;

                subsidiaryName = nSearch.lookupFields({
                    type: nSearch.Type.SUBSIDIARY,
                    id: paramSubsidiary,
                    columns: ["legalname"]
                })["legalname"];

            } else {

                const STS_Search = nSearch.create({
                    type: "customrecord_lmry_ste_setuptax_subsi",
                    columns: [
                        nSearch.createColumn({ name: "custrecord_lmry_ste_sts_employee_respon", label: "Latam - Employee Responsible" }),
                        nSearch.createColumn({ name: "legalname", join: "custrecord_lmry_ste_sts_subsidiary", label: "Legal Name" })
                    ],
                    filters: [
                        nSearch.createFilter({ name: "isinactive", operator: nSearch.Operator.IS, values: ["F"] }),
                        nSearch.createFilter({ name: "custrecord_lmry_ste_sts_subsidiary", operator: nSearch.Operator.ANYOF, values: paramSubsidiary })
                    ]
                }).run().getRange({ start: 0, end: 10 });

                if (STS_Search && STS_Search.length > 0) {

                    subsidiaryName = STS_Search[0].getValue({ name: "legalname", join: "custrecord_lmry_ste_sts_subsidiary" });
                    const STS_EmployeeManager = STS_Search[0].getValue({ name: "custrecord_lmry_ste_sts_employee_respon" });

                    const employeeSearch = nSearch.lookupFields({
                        type: nSearch.Type.EMPLOYEE,
                        id: STS_EmployeeManager,
                        columns: [ "entityid", "internalid", "email" ]
                    });

                    user.id = employeeSearch["internalid"][0].value;
                    user.name = employeeSearch["entityid"];
                    user.email = employeeSearch["email"];

                }

            }

            const bodyHtml = `
                <div style="color: #483838; margin-bottom: 2.5rem" class="container-body">
                    <div style="text-align: center ; margin-top: 20px;">
                        <img src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81015&c=TSTDRV1930452&h=58hbjHzF0ZDtq-F905Nr-8LibSvzYGEq0aTFdlmqxQL-noK9" alt="" class="imgBanner" />
                        <p style="font-size: 18px">
                            <strong>Dear: </strong>${user.name}
                        </p>
                    </div>
                    <p style="margin-bottom: 1.5rem">
                        This is summary of the transaction that were processed by the Tax Result Engine and they are belong to the following subsidiary:
                        <strong>${subsidiaryName}</strong>
                    </p>
                    <h2 style="font-size: 18px">Details</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem" role="presentation">
                        <tbody style="line-height: 24px">
                            <tr style="margin: 100px">
                                <td style="padding: 10px">Processed transactions</td>
                                <td style="padding: 10px; text-align: right">
                                    <strong>${paramTreSummary["numTrans"]}</strong>
                                </td>
                            </tr>
                            <tr style="background-color: #EBFBDF">
                                <td style="padding: 10px">Corrects</td>
                                <td style="text-align: right; padding: 10px">
                                    <strong>${paramTreSummary["correct"]}</strong>
                                </td>
                            </tr>
                            <tr style="background-color: #fef2f2">
                                <td style="padding: 10px">Incorrects</td>
                                <td style="text-align: right; padding: 10px">
                                    <strong>${paramTreSummary["incorrect"]}</strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div style="width: 95%; margin: auto; background-color: #f0f9ff; color: #003f79; padding: 10px 12px; box-sizing: border-box; margin-bottom: 2rem;">
                        <table>
                            <tr>
                                <td style="vertical-align: top">
                                    <img width="30px" height="30px" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81017&c=TSTDRV1930452&h=imFPmW2WIVmp4As_RyAyRqE_SzDHvb2QI6l8INEtVVUuwiFK" />
                                </td>
                                <td style="vertical-align: top; padding-left: 15px; line-height: 1.3rem;">
                                    Please contact our Customer Service department at:
                                    <span style="text-decoration: underline">customer.care@latamready.com</span>
                                    who will take care of the matter.
                                </td>
                            </tr>
                        </table>
                    </div>
                    <p>Regards,</p>
                    <p>The LatamReady Team</p>
                </div>
            `;

            const emailContent = _emailTemplate(bodyHtml);

            if (user.email && user.email !== "" && user.email !== null) {
                nEmail.send({
                    author: user.id,
                    body: emailContent,
                    recipients: [user.email],
                    subject: "LatamReady - Tax Result Engine (Summary)"
                });
            }

        } catch (error) {
            nLog.error({ title: `[ ${LMRY_SCRIPT} : sendTRESummaryEmail ]`, details: error });
        }

    }

    const sendAFDetailsEmail = (subsidiary, transactionDetails, states) => {

        try {

            const user = {
                id: "",
                name: "",
                email: "",
            };
            user.id = nRuntime.getCurrentUser().id;
            user.name = nRuntime.getCurrentUser().name;
            user.email = nRuntime.getCurrentUser().email;
            
            const bodyHtml = `
                <div style="color: #483838; margin-bottom: 2.5rem" class="container-body">
                    <div style="text-align: center; margin-top: 20px">
                        <img src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81015&c=TSTDRV1930452&h=58hbjHzF0ZDtq-F905Nr-8LibSvzYGEq0aTFdlmqxQL-noK9" alt="" class="imgBanner" />
                        <p style="font-size: 18px">
                            <strong>Dear: </strong>${user.name}
                        </p>
                    </div>
                    <p style="margin-bottom: 1.5rem">
                        ${transactionDetails.length} transactions have been processed. These transactions belong to the following subsidiary: <strong>${subsidiary}</strong>
                    </p>
                    <h2 style="font-size: 18px">Details</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem" role="presentation">
                        <tbody style="line-height: 24px">
                            <tr style="margin: 100px">
                                <td style="padding: 10px">Processed transactions</td>
                                <td style="padding: 10px; text-align: right">
                                    <strong>${states["numTrans"]}</strong>
                                </td>
                            </tr>
                            <tr style="background-color: #EBFBDF">
                                <td style="padding: 10px">Corrects</td>
                                <td style="text-align: right; padding: 10px">
                                    <strong>${states["corrects"]}</strong>
                                </td>
                            </tr>
                            <tr style="background-color: #fef2f2">
                                <td style="padding: 10px">Incorrects</td>
                                <td style="text-align: right; padding: 10px">
                                    <strong>${states["incorrects"]}</strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="scroll" style="overflow-x:auto; overflow-y: scroll; min-height: auto; max-height: 400px; margin-bottom: 2.5rem;">
                        <table style="width: 100%; font-size: 14px; text-align: left; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #fef2f2">
                                    <th style="padding: 10px">Order</th>
                                    <th style="padding: 10px">Reference No.</th>
                                    <th style="padding: 10px">Type</th>
                                    <th style="padding: 10px">Entity</th>
                                    <th style="padding: 10px">State</th>
                                </tr>
                            </thead>
                            <tbody >
                                ${transactionDetails.map((transaction, index) => {
                                return `<tr>
                                        <td style="padding: 10px;">${index + 1}</td>
                                        <td style="padding: 10px;">${transaction.tranid}</td>
                                        <td style="padding: 10px;">${transaction.typeName}</td>
                                        <td style="padding: 10px;">${transaction.entity}</td>
                                        <td style="padding: 10px;">${states[transaction.id]}</td>
                                    </tr>`
                                }).join("")}
                            </tbody>
                        </table>
                    </div>
                    <div style="width: 95%; margin: auto; background-color: #f0f9ff; color: #003f79; padding: 10px 12px; box-sizing: border-box; margin-bottom: 2rem;">
                        <table>
                            <tr>
                                <td style="vertical-align: top">
                                    <img width="30px" height="30px" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81017&c=TSTDRV1930452&h=imFPmW2WIVmp4As_RyAyRqE_SzDHvb2QI6l8INEtVVUuwiFK" />
                                </td>
                                <td style="vertical-align: top; padding-left: 15px; line-height: 1.3rem;">
                                    Please contact our Customer Service department at:
                                    <span style="text-decoration: underline">customer.care@latamready.com</span>
                                    who will take care of the matter.
                                </td>
                            </tr>
                        </table>
                    </div>
                    <p>Regards,</p>
                    <p>The LatamReady Team</p>
                </div>
            `;

            const emailContent = _emailTemplate(bodyHtml);

            if (user.email && user.email !== "" && user.email !== null) {
                nEmail.send({
                    author: user.id,
                    body: emailContent,
                    recipients: [user.email],
                    subject: "LatamReady - Advance Flow (Details)"
                });
            }

        } catch (error) {
            nLog.error({ title: `[ ${LMRY_SCRIPT} : sendTREDetailsEmail ]`, details: error });
        }

    }

    const _emailTemplate = (paramBody) => {

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
                        ${paramBody}
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

    }

    return {
        sendErrorEmail,
        sendTREDetailsEmail,
        sendTRESummaryEmail,
        sendAFDetailsEmail
    }

});
