/* eslint-disable indent */
/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(["N/search", "N/ui/serverWidget", "N/xml", "N/config", "N/runtime", "N/url", "N/log", "N/file", "N/record", "N/query", "N/render", "N/format", "N/encode"], function (
    search,
    serverWidget,
    xml,
    config,
    runtime,
    url,
    nLog,
    file,
    record,
    query,
    render,
    format,
    encode
) {
    const StylTitulo = `style="font-family:  Helvetica; font-size: 25pt; color: #000000; height: 30px; margin-top: 0px"  align="right" width="100%"`;
    const StylSubT = `style="font-size: 14pt; height: 25px; " valign="middle" align="left" `;
    const Styl1 = `style="font-size: 9pt; border: 0px; height: 18px " valign="middle" align="left" `;
    const Stylcab = `style="font-size: 7pt; border: 1px solid #000000; height: 8px; color: #FFFFFF; background: #000000 " valign="middle" align="center"`;
    const Styl2 = `style="font-size: 7pt; height: 45px;  border-right:1.5px solid #000000 " valign="middle" align="center" width="40"`;
    const Styl3 = `style="text-align: justify; font-size: 7pt; height: 45px; border-right:1.5px solid #000000 " width="40"`;
    function onRequest(context) {
        try {
            const transactionID = Number(context.request.parameters.transactionId);
            const bookID = Number(context.request.parameters.multibook);
            const outputFormat = Number(context.request.parameters.formato);
            nLog.debug("parametros", [transactionID, bookID, outputFormat]);

            const featureDepartment = runtime.isFeatureInEffect("departments");
            const featureLocation = runtime.isFeatureInEffect("locations");
            const featureClass = runtime.isFeatureInEffect("classes");
            const featureGLaudit = runtime.isFeatureInEffect("glauditnumbering");
            const featureForeignCurrency = runtime.isFeatureInEffect("foreigncurrencymanagement");
            const featureSubsidiary = runtime.isFeatureInEffect("SUBSIDIARIES");

            if (!Number(transactionID)) throw "transactionID is Mandatory";
            const { username } = getUserInformation();

            const paymentRecord = record.load({
                type: "vendorpayment",
                id: transactionID,
                isdynamic: true
            });
            if (outputFormat === 1 && transactionID && bookID) {
                const form = createPDF({ username, featureGLaudit, featureForeignCurrency, featureClass, featureLocation, featureDepartment, featureSubsidiary, paymentRecord, bookID });
                // context.response.write(form);
                context.response.writeFile({ file: form, isInline: true });
            } else if (outputFormat === 2 && transactionID && bookID) {
                const form = createXLS({ username, featureGLaudit, featureForeignCurrency, featureClass, featureLocation, featureDepartment, featureSubsidiary, paymentRecord, bookID });
                context.response.writeFile(form);
            } else {
                const form = serverWidget.createForm({
                    title: "",
                    hideNavBar: false
                });
                const fieldHTML = form.addField({
                    id: "custpage_lmry_v_message",
                    label: "a",
                    type: serverWidget.FieldType.INLINEHTML
                });

                fieldHTML.defaultValue = `
                <html>
                    <table border='0' class='table_fields' cellspacing='0' cellpadding='0'>
                        <tr></tr>
                        <tr>
                            <td class='text'>
                                <div style="color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver">
                                    Importante: Actualmente no está ejecutando de la forma correcta el SuiteLet.
                                </div>
                            </td>
                        </tr>
                    </table>
                </html>`;
                context.response.writePage(form);
            }
        } catch (error) {
            nLog.error("general", error);
            // Mensaje para el cliente
            const strhtml = `
            <html>
                <br><br>
                <table border='0' class='table_fields' cellspacing='0' cellpadding='0'>
                    <tr></tr>
                    <tr>
                        <td class='text'>
                            <div style="color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver">
                                Importante: Se genero un error en el SuiteLet de impresio del PDF, por favor revisar su correo electronico.
                            </div>
                        </td>
                    </tr>
                </table>
            </html>`;

            // Dibuja el formularios
            context.response.write(strhtml);
        }
    }
    /**
     *
     * @param {*} param0
     * @returns
     */
    function createPDF({ username, featureGLaudit, featureClass, featureLocation, featureDepartment, featureSubsidiary, paymentRecord, bookID }) {
        const appliedBills = paymentRecord.getLineCount("apply");
        const listBills = [];
        let today = format.format({
            type: "date",
            value: new Date()
        });
        today = xml.escape(today);
        let idiomaS = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" });
        idiomaS = idiomaS.substring(0, 2);
        /*for (let index = 0; index < appliedBills; index++) {
            const isApply = paymentRecord.getSublistValue({
                sublistId: "apply",
                fieldId: "apply",
                line: index
            });

            if (!isApply) continue;
            const transactionsApply = paymentRecord.getSublistValue({
                sublistId: "apply",
                fieldId: "internalid",
                line: index
            });
            listBills.push(transactionsApply);

        }*/
        const { currencyName, currencyPrecision } = getCurrency({ bookID, subsidiaryID: paymentRecord.getValue("subsidiary") });
        const billCredits = getCreditBills({ paymentRecord });
        listBills.push(...billCredits);

        listBills.push(paymentRecord.id);

        const GLImpactLines = getGLImpactLines({ listBills, bookID, featureGLaudit });
        const { entityTax } = getEntityInformation(paymentRecord.getValue("entity"));
        const { companyImage, companyaddr, companyname, companyruc } = getCompanyInformation({ featureSubsidiary, subsidiaryID: paymentRecord.getValue("subsidiary") });

        const totales = {
            debit: 0,
            credit: 0
        };
        const pdfFile = `<?xml version="1.0"?>
        <!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
        <pdf>
            <head>
                <macrolist>
                    <macro id="myfooter">
                        <table width="100%" border="1">
                            <tr>
                                <td>${idiomaS === "es" ? "Creado por :" : "Created by :"}</td>
                                <td>${xml.escape(username)}</td>
                                <td>|</td>
                                <td>${idiomaS === "es" ? "Aprobado por :" : "Approved by :"}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>${idiomaS === "es" ? "Fecha de sistema :" : "Date of system :"}</td>
                                <td>${today}</td>
                                <td>|</td>
                                <td></td>
                                <td></td>
                            </tr>
                        </table>
                    </macro>
                </macrolist>
            </head>
            <body footer="myfooter" footer-height="10mm" font-size="12">
                <h3></h3>
                <div style="border: 0px; width:100% " >
                    <div style="border: 0px">
                        <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%">
                            <tr>
                                <td ${StylSubT} width="50%">
                                    <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%">
                                        <tr>
                                            <td ${StylSubT} width="85%">
                                                ${
                                                    companyImage !== "" && companyImage !== null
                                                        ? `
                                                <img width="110" height="80" src="${companyImage}" />`
                                                        : ""
                                                }
                                            </td>
                                        </tr>
                                        <tr>
                                            <td ${StylSubT} width="85%">
                                                <b>${companyname}</b>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td ${StylSubT} width="85%">
                                                <b>${companyaddr}</b>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                <td ${StylSubT} width="50%">
                                    <p ${StylTitulo}> ${idiomaS === "es" ? "Impacto Contable" : "AR WHT GL Impact"}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:170px">
                        <tr>
                            <td ${Styl1} width="10%">
                                <b>${idiomaS === "es" ? "N° Impuesto" : "Tax ID"}</b>
                            </td>
                            <td ${Styl1} width="5%">
                                <b>:</b>
                            </td>
                            <td ${Styl1} width="20%">
                                <b>${companyruc}</b>
                            </td>
                        </tr>
                        <tr>
                            <td ${Styl1} width="10%">
                                <b>${idiomaS === "es" ? "N° Interno" : "Internal ID"}</b>
                            </td>
                            <td ${Styl1} width="5%">
                                <b>:</b>
                            </td>
                            <td ${Styl1} width="20%">
                                <b>${paymentRecord.id}</b>
                            </td>
                        </tr>
                    </table>
                    <div style="border: 0px" align="right">
                        <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:270px; margin-top:-40px">
                            <tr>
                                <td ${Styl1} width="22%">
                                    <b>${idiomaS === "es" ? "Numero de Transaccion" : "Transaction Number"}</b>
                                </td>
                                <td ${Styl1} width="5%">
                                    <b>:</b>
                                </td>
                                <td ${Styl1} width="20%">
                                    <b>${xml.escape(paymentRecord.getValue("transactionnumber"))}</b>
                                </td>
                            </tr>
                            <tr>
                                <td ${Styl1} width="22%">
                                    <b>${idiomaS === "es" ? "Numero de Documento" : "Document Number"}</b>
                                </td>
                                <td ${Styl1} width="5%">
                                    <b>:</b>
                                </td>
                                <td ${Styl1} width="20%">
                                    <b>${xml.escape(paymentRecord.getValue("tranid"))}</b>
                                </td>
                            </tr>
                        ${
                            featureGLaudit === true
                                ? `
                            <tr>
                                <td ${Styl1} width="22%">
                                    <b>GL #</b>
                                </td>
                                <td ${Styl1} width="5%">
                                    <b>:</b>
                                </td>
                                <td ${Styl1} width="20%">
                                    <b>${xml.escape(GLImpactLines[0].glauditnumber ?? "")}</b>
                                </td>
                            </tr>`
                                : ""
                        }
                            <tr>
                                <td ${Styl1} width="22%">
                                    <b>${idiomaS === "es" ? "Numero Interno" : "Internal ID"}</b>
                                </td>
                                <td ${Styl1} width="5%">
                                    <b>:</b>
                                </td>
                                <td ${Styl1} width="20%">
                                    <b>${paymentRecord.id}</b>
                                </td>
                            </tr>
                            <tr>
                                <td ${Styl1} width="22%">
                                    <b>${idiomaS === "es" ? "Fecha de tramite" : "Date of processing"}</b>
                                </td>
                                <td ${Styl1} width="5%">
                                    <b>:</b>
                                </td>
                                <td ${Styl1} width="73%">
                                    <b>${xml.escape(paymentRecord.getText("trandate"))}</b>
                                </td>
                            </tr>
                        ${
                            bookID
                                ? `
                            <tr>
                                <td ${Styl1} width="22%">
                                    <b>${idiomaS === "es" ? "Libro Contable" : "Accounting Book"}</b>
                                </td>
                                <td ${Styl1} width="5%">
                                    <b>:</b>
                                </td>
                                <td ${Styl1} width="73%">
                                    <b>${xml.escape(GLImpactLines[0].accountingbookname)}</b>
                                </td>
                            </tr>
                            <tr>
                                <td ${Styl1} width="22%">
                                    <b>${idiomaS === "es" ? "Moneda del Libro" : "Currency Book"}</b>
                                </td>
                                <td ${Styl1} width="5%">
                                    <b>:</b>
                                </td>
                                <td ${Styl1} width="73%">
                                    <b>${currencyName}</b>
                                </td>
                            </tr>`
                                : ""
                        }
                            <tr>
                                <td ${Styl1} width="22%">
                                    <b>${idiomaS === "es" ? "Tipo de Cambio" : "Exchange Rate"}</b>
                                </td>
                                <td ${Styl1} width="5%">
                                    <b>:</b>
                                </td>
                                <td ${Styl1} width="73%">
                                    <b>${Number(paymentRecord.getValue("exchangerate")) < 1 ? Number(paymentRecord.getValue("exchangerate")) : paymentRecord.getValue("exchangerate")}
                                    </b>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
                <div style="border: 0px; height: 20px " >
                </div>
                <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%; border: 1.5px solid #000000 ">
                <!-- cabeceta lineas de detalle -->
                <tr>
                    ${
                        idiomaS === "es"
                            ? `
                            <td ${Stylcab} width="10">Cuenta</td>
                            <td ${Stylcab} width="10">Importe (Debito)</td>
                            <td ${Stylcab} width="10">Importe (Credito) </td>
                            <td ${Stylcab} width="10">Nota </td>
                            <td ${Stylcab} width="20%">Nombre </td>
                            <td ${Stylcab} width="10">ID Fiscal</td>
                            ${featureDepartment ? `<td ${Stylcab} width="10">Departamento </td>` : ""}
                            ${featureClass ? `<td ${Stylcab} width="10">Clase</td>` : ""}
                            ${featureLocation ? `<td ${Stylcab} width="10">Ubicación</td>` : ""}
                            `
                            : `
                            <td ${Stylcab} width="10">Account </td>
                            <td ${Stylcab} width="10">Amount (Debit) </td>
                            <td ${Stylcab} width="10">Amount (Credit) </td>
                            <td ${Stylcab} width="10">Memo </td>
                            <td ${Stylcab} width="10">Name </td>
                            <td ${Stylcab} width="10">Tax ID </td>
                            ${featureDepartment ? `<td ${Stylcab} width="10">Department </td>` : ""}
                            ${featureClass ? `<td ${Stylcab} width="10">Class </td>` : ""}
                            ${featureLocation ? `<td ${Stylcab} width="10">Location </td>` : ""}
                            `
                    }
                </tr>
                <!-- lineas de detalle -->
                ${GLImpactLines.map((GLImpactLine) => {
                    const { accountname, debit, credit, entityname, departmentname, classname, locationname, memo } = GLImpactLine;

                    const debitamount = roundByCurrency({ amount: debit, currencyPrecision });
                    const creditamount = roundByCurrency({ amount: credit, currencyPrecision });
                    totales.debit += debitamount;
                    totales.credit += creditamount;
                    return `<tr>
                        <td ${Styl3}>${xml.escape(accountname ?? "")}</td>
                        <td ${Styl2}>${debitamount}</td>
                        <td ${Styl2}>${creditamount}</td>
                        <td ${Styl3}>${xml.escape(memo ?? "")}</td>
                        <td ${Styl3}>${xml.escape(entityname ?? "")}</td>
                        <td ${Styl3}>${xml.escape(entityname === "" || entityname === null || memo === "VAT" ? entityTax : "")}</td>
                        ${featureDepartment ? `<td ${Styl3} >${xml.escape(departmentname ?? "")} </td>` : ""}
                        ${featureClass ? `<td ${Styl3} >${xml.escape(classname ?? "")}  </td>` : ""}
                        ${featureLocation ? `<td ${Styl3} >${xml.escape(locationname ?? "")}  </td>` : ""}
                        </tr>
                        `;
                }).join("")}
    <tr>
        <td ${Stylcab} width="10" >Total</td>
        <td ${Stylcab} width="10">${totales.debit}</td>
        <td ${Stylcab} width="10">${totales.credit}</td>
        <td ${Stylcab} width="10"></td>
        <td ${Stylcab} width="20%"></td>
        <td ${Stylcab} width="10"></td>
        ${featureDepartment ? `<td ${Stylcab} width="10"> </td>` : ""}
        ${featureClass ? `<td ${Stylcab} width="10"> </td>` : ""}
        ${featureLocation ? `<td ${Stylcab} width="10"> </td>` : ""}
    </tr>
            </table>

            </body>
        </pdf>`;

        return render.xmlToPdf({
            xmlString: removeXMLInvalidChars(pdfFile)
        });
        // return pdfFile;
    }
    /**
     *
     * @param {*} param0
     */
    function createXLS({ featureGLaudit, featureClass, featureLocation, featureDepartment, paymentRecord, bookID }) {
        try {
            const appliedBills = paymentRecord.getLineCount("apply");
            const listBills = [];
            // let today = format.format({
            //     type: "date",
            //     value: new Date()
            // });
            // today = xml.escape(today);
            let idiomaS = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" });
            idiomaS = idiomaS.substring(0, 2);
            /*for (let index = 0; index < appliedBills; index++) {
                const isApply = paymentRecord.getSublistValue({
                    sublistId: "apply",
                    fieldId: "apply",
                    line: index
                });

                if (!isApply) continue;
                const transactionsApply = paymentRecord.getSublistValue({
                    sublistId: "apply",
                    fieldId: "internalid",
                    line: index
                });
                listBills.push(transactionsApply);
                nLog.debug("transactionsApply", transactionsApply);
            }*/
            const { currencyName } = getCurrency({ bookID, subsidiaryID: paymentRecord.getValue("subsidiary") });
            const billCredits = getCreditBills({ paymentRecord });
            listBills.push(...billCredits);

            listBills.push(paymentRecord.id);

            const GLImpactLines = getGLImpactLines({ listBills, bookID, featureGLaudit });
            // const { companyImage, companyaddr, companylogo, companyname, companyruc } = getCompanyInformation({ featureSubsidiary, subsidiaryID: paymentRecord.getValue("subsidiary") });
            const { entityTax } = getEntityInformation(paymentRecord.getValue("entity"));

            const totales = {
                debit: 0,
                credit: 0
            };
            // Envia al log del script

            const FileBodyXLS = `
            <?xml version="1.0"?>
            <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
                xmlns:o="urn:schemas-microsoft-com:office:office"
                xmlns:x="urn:schemas-microsoft-com:office:excel"
                xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
                xmlns:html="http://www.w3.org/TR/REC-html40">
            <Styles>
                <Style ss:ID="Default" ss:Name="Normal">
                    <Alignment ss:Vertical="Bottom"/>
                    <Borders/>
                    <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
                    <Interior/>
                    <NumberFormat/>
                    <Protection/>
                </Style>
                <Style ss:ID="s76">
                    <Alignment ss:Horizontal="Center" ss:Vertical="Bottom" ss:WrapText="1"/>
                    <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
                    <Interior ss:Color="#4472C4" ss:Pattern="Solid"/>
                </Style>
            </Styles>
            <Worksheet ss:Name="Sheet1">
                <Table>
                    <Row ss:AutoFitHeight="0" ss:Height="30">
                        ${bookID ? `<Cell ss:StyleID="s76"><Data ss:Type="String">${idiomaS === "es" ? "Libro Contable" : "Accounting Book"}</Data></Cell>` : ""}
                        <Cell ss:StyleID="s76"><Data ss:Type="String">${idiomaS === "es" ? "Cuenta" : "Account"}</Data></Cell>
                        <Cell ss:StyleID="s76"><Data ss:Type="String">${idiomaS === "es" ? "Importe (debito)" : "Amount (debit)"}</Data></Cell>
                        <Cell ss:StyleID="s76"><Data ss:Type="String">${idiomaS === "es" ? "Importe (credito)" : "Amount (credit)"}</Data></Cell>
                        <Cell ss:StyleID="s76"><Data ss:Type="String">${idiomaS === "es" ? "Moneda base" : "Base Currency"}</Data></Cell>
                        <Cell ss:StyleID="s76"><Data ss:Type="String">${idiomaS === "es" ? "Contabilización" : "Posting"}</Data></Cell>
                        <Cell ss:StyleID="s76"><Data ss:Type="String">${idiomaS === "es" ? "Nota" : "Memo"}</Data></Cell>
                        <Cell ss:StyleID="s76"><Data ss:Type="String">${idiomaS === "es" ? "Nombre" : "Name"}</Data></Cell>
                        <Cell ss:StyleID="s76"><Data ss:Type="String">${idiomaS === "es" ? "ID Fiscal" : "TAX ID"}</Data></Cell>
                        <Cell ss:StyleID="s76"><Data ss:Type="String">${idiomaS === "es" ? "Subsidiaria" : "Subsidiary"}</Data></Cell>
                        ${featureDepartment ? `<Cell ss:StyleID="s76"><Data ss:Type="String">${idiomaS === "es" ? "Departmento" : "Department"}</Data></Cell>` : ""}
                        ${featureClass ? `<Cell ss:StyleID="s76"><Data ss:Type="String">${idiomaS === "es" ? "Clase" : "Class"}</Data></Cell>` : ""}
                        ${featureLocation ? `<Cell ss:StyleID="s76"><Data ss:Type="String">${idiomaS === "es" ? "Ubicación" : "Location"}</Data></Cell>` : ""}
                    </Row>
                    ${GLImpactLines.map((GLImpactLine) => {
                        totales.debit += GLImpactLine.debit;
                        totales.credit += GLImpactLine.credit;
                        return `<Row ss:AutoFitHeight="0">
                            ${bookID ? `<Cell><Data ss:Type="String">${xml.escape(GLImpactLine.accountingbookname ?? "")}</Data></Cell>` : ""}
                            <Cell><Data ss:Type="String">${xml.escape(GLImpactLine.accountname ?? "")}</Data></Cell>
                            <Cell><Data ss:Type="Number">${Math.abs(GLImpactLine.debit)}</Data></Cell>
                            <Cell><Data ss:Type="Number">${Math.abs(GLImpactLine.credit)}</Data></Cell>
                            <Cell><Data ss:Type="String">${xml.escape(currencyName ?? "")}</Data></Cell>
                            <Cell><Data ss:Type="String">${xml.escape(GLImpactLine.posting ?? "")}</Data></Cell>
                            <Cell><Data ss:Type="String">${xml.escape(GLImpactLine.memo ?? "")}</Data></Cell>
                            <Cell><Data ss:Type="String">${xml.escape(GLImpactLine.entityname ?? "")}</Data></Cell>
                            ${
                                GLImpactLine.entityname === "" || GLImpactLine.entityname === null || GLImpactLine.memo === "VAT"
                                    ? `<Cell><Data ss:Type="String"></Data></Cell>`
                                    : `<Cell><Data ss:Type="String">${xml.escape(entityTax ?? "")}</Data></Cell>`
                            }
                            <Cell><Data ss:Type="String">${xml.escape(paymentRecord.getText("subsidiary") ?? "")}</Data></Cell>
                            ${featureDepartment ? `<Cell><Data ss:Type="String">${xml.escape(GLImpactLine.departmentname ?? "")}</Data></Cell>` : ""}
                            ${featureClass ? `<Cell><Data ss:Type="String">${xml.escape(GLImpactLine.classname ?? "")}</Data></Cell>` : ""}
                            ${featureLocation ? `<Cell><Data ss:Type="String">${xml.escape(GLImpactLine.locationname ?? "")}</Data></Cell>` : ""}
                        </Row>`;
                    }).join("")}
                        <Row ss:AutoFitHeight="0" ss:Height="20">
                        ${bookID ? `<Cell ss:StyleID="s76"><Data ss:Type="String"></Data></Cell>` : ``}
                        <Cell ss:StyleID="s76"><Data ss:Type="String">Total</Data></Cell>
                        <Cell ><Data ss:Type="Number">${Math.abs(totales.debit)}</Data></Cell>
                        <Cell ><Data ss:Type="Number">${Math.abs(totales.credit)}</Data></Cell>
                        </Row>
                </Table>
            </Worksheet>
        </Workbook>

                `;

            // Formato en Base64
            const base64EncodedString = encode.convert({
                string: FileBodyXLS,

                inputEncoding: encode.Encoding.UTF_8,

                outputEncoding: encode.Encoding.BASE_64
            });
            //create file
            const myXLSName = `LS_AR_WHT_GL_Impact_${paymentRecord.id}.xls`;

            const xlsFile = file.create({
                name: myXLSName,

                fileType: "EXCEL",

                contents: base64EncodedString
            });

            return xlsFile;
        } catch (err) {
            // Log de errores
            nLog.error("createXLS", err);
        }
    }
    /**
     *
     * @param {*} param0
     * @param {*} param0.subsidiaryID
     * @param {*} param0.bookID
     * @returns
     */
    function getCurrency({ subsidiaryID, bookID }) {
        let currencyID, currencyName;
        nLog.debug("getCurrency", { subsidiaryID, bookID });
        const foreigncurrencymanagement = runtime.isFeatureInEffect({ feature: "foreigncurrencymanagement" });
        if (foreigncurrencymanagement && bookID !== 0) {
            const accountingbookCurrencySearch = search
                .create({
                    type: "accountingbook",
                    filters: [["subsidiary", "anyof", subsidiaryID], "AND", ["internalid", "anyof", bookID]],
                    columns: ["internalid", "currency"]
                })
                .run()
                .getRange(0, 1);
            nLog.debug("getCurrency2", accountingbookCurrencySearch.length);

            currencyID = accountingbookCurrencySearch[0]?.getValue("currency");
            currencyName = accountingbookCurrencySearch[0]?.getText("currency");
            nLog.debug("getCurrency3", currencyID);
        } else {
            const accountingbookCurrencySearch = search.lookupFields({
                type: "subsidiary",
                id: subsidiaryID,
                columns: ["currency"]
            }).currency[0];
            currencyID = accountingbookCurrencySearch?.value;
            currencyName = accountingbookCurrencySearch?.text;
            nLog.debug("getCurrency4", currencyID);
        }
        if (!Number(currencyID)) throw Error("[getCurrency] - Currency undefined");
        const currencyObj = record.load({
            type: "currency",
            id: currencyID
        });
        return { currencyID, currencyName, currencyPrecision: currencyObj.getValue("currencyprecision") };
    }
    /**
     *
     * @param {object} param0
     * @param {number} param0.amount
     * @param {number} param0.currencyPrecision
     * @returns {number}
     */
    function roundByCurrency({ amount, currencyPrecision }) {
        let roundedAmount = 0;
        currencyPrecision = currencyPrecision ?? 0;
        if (amount) {
            roundedAmount = parseFloat(amount).toFixed(currencyPrecision);

            if (!Number(roundedAmount)) {
                roundedAmount = "";
            }
        }

        return Number(roundedAmount);
    }
    function getGLImpactLines({ listBills, bookID, featureGLaudit }) {
        const filters = [];
        filters.push(...listBills);
        filters.push(bookID);
        const resultsGL = query
            .runSuiteQL({
                query: `
                select
                    ta.accountingBook,
                    BUILTIN.DF(ta.accountingBook) as accountingBookname,
                    ta.account,
                    BUILTIN.DF(ta.account) as accountname,
                    -- ta.amount,
                    ta.debit,
                    ta.credit,
                    ${featureGLaudit ? "ta.glAuditNumber," : ""}
                    ta.exchangeRate,
                    -- ta.transactionline,
                    tl.memo,
                    BUILTIN.DF(tl.entity) as entityname,
                    BUILTIN.DF(tl.department) as departmentname,
                    BUILTIN.DF(tl.class) as classname,
                    BUILTIN.DF(tl.location) as locationname,
                    ta.posting
                from
                    TransactionAccountingLine as ta,
                    transactionline as tl
                where
                    ta.transactionline = tl.id
                and
                    tl.transaction = any(${listBills.map(() => "?").join(",")})
                and
                    ta.transaction = tl.transaction
                and
                    ta.accountingBook = ?
                `,
                params: filters
            })
            .asMappedResults();
        return resultsGL;
    }
    function getCreditBills({ paymentRecord }) {
        return query
            .runSuiteQL({
                query: `
        select
            customrecord_lmry_wht_details.custrecord_lmry_wht_bill_credit
        from
            customrecord_lmry_wht_details
        where
            customrecord_lmry_wht_details.custrecord_lmry_wht_bill_payment = ?`,
                params: [paymentRecord.id]
            })
            .asMappedResults()
            .map((element) => element.custrecord_lmry_wht_bill_credit);
    }
    function getCompanyInformation({ featureSubsidiary, subsidiaryID }) {
        let companyImage, companyname, companyaddr, companyruc, companylogo;
        if (featureSubsidiary) {
            const subsidiaryData = search.lookupFields({
                type: "subsidiary",
                id: subsidiaryID,
                columns: ["legalname", "taxidnum", "address1", "custrecord_lmry_dig_verificador", "custrecord_lmry_gl_impact_logo"]
            });

            companyname = subsidiaryData.legalname;
            companyaddr = subsidiaryData.address1;
            companyruc = subsidiaryData.taxidnum;
            companyruc += `${subsidiaryData.custrecord_lmry_dig_verificador}` ?? "";

            const onlyLogo = record.load({
              type: 'subsidiary',
              id: subsidiaryID
            });

            companylogo = onlyLogo.getValue('pagelogo');

            //if(companylogo.length) companylogo = companylogo[0].value;

        } else {
            // Datos para mid makert edition
            const configpage = config.load({
                type: config.Type.COMPANY_INFORMATION
            });
            companyruc = configpage.getFieldValue("employerid");
            // Valida que el digito verificado no este vacio
            if (configpage.getFieldValue("custrecord_lmry_dig_verificador") && configpage.getFieldValue("custrecord_lmry_dig_verificador") !== "") {
                companyruc = `${companyruc}-${configpage.getFieldValue("custrecord_lmry_dig_verificador")}`;
            }
            companyname = xml.escape(configpage.getFieldValue("companyname"));
            companylogo = configpage.getFieldValue("pagelogo");
            //if(companylogo.length) companylogo = companylogo[0].value;

            companyaddr = xml.escape(configpage.getFieldValue("address1"));
        }

        const serverHost = url.resolveDomain({
            hostType: url.HostType.APPLICATION,
            accountId: runtime.accountId
        });

        if (Number(companylogo)) {
            companylogo = file.load({ id: companylogo });
            companylogo = companylogo.url;
            // Logo del PDF - SuiteAnswers ID 10289
            companyImage = String(`https://${serverHost}`) + companylogo;
            companyImage = xml.escape(companyImage);
        }
        return { companyImage, companyname, companyaddr, companyruc, companylogo };
    }
    function getUserInformation() {
        const userObj = runtime.getCurrentUser();
        const info = search.lookupFields({
            type: "employee",
            id: userObj.id,
            columns: ["firstname", "lastname"]
        });
        return { username: xml.escape(`${info.firstname} ${info.lastname}`) };
    }
    function removeXMLInvalidChars(str, removeDiscouragedChars) {
        // remove everything forbidden by XML 1.0 specifications, plus the unicode replacement character U+FFFD
        let regex = /((?:[\0-\x08\x0B\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/g;

        // ensure we have a string
        str = String(str || "").replace(regex, "");

        if (removeDiscouragedChars) {
            // remove everything discouraged by XML 1.0 specifications
            regex = new RegExp(
                "([\\x7F-\\x84]|[\\x86-\\x9F]|[\\uFDD0-\\uFDEF]|(?:\\uD83F[\\uDFFE\\uDFFF])|(?:\\uD87F[\\uDF" +
                    "FE\\uDFFF])|(?:\\uD8BF[\\uDFFE\\uDFFF])|(?:\\uD8FF[\\uDFFE\\uDFFF])|(?:\\uD93F[\\uDFFE\\uD" +
                    "FFF])|(?:\\uD97F[\\uDFFE\\uDFFF])|(?:\\uD9BF[\\uDFFE\\uDFFF])|(?:\\uD9FF[\\uDFFE\\uDFFF])" +
                    "|(?:\\uDA3F[\\uDFFE\\uDFFF])|(?:\\uDA7F[\\uDFFE\\uDFFF])|(?:\\uDABF[\\uDFFE\\uDFFF])|(?:\\" +
                    "uDAFF[\\uDFFE\\uDFFF])|(?:\\uDB3F[\\uDFFE\\uDFFF])|(?:\\uDB7F[\\uDFFE\\uDFFF])|(?:\\uDBBF" +
                    "[\\uDFFE\\uDFFF])|(?:\\uDBFF[\\uDFFE\\uDFFF])(?:[\\0-\\t\\x0B\\f\\x0E-\\u2027\\u202A-\\uD7FF\\" +
                    "uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|" +
                    "(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF]))",
                "g"
            );

            str = str.replace(regex, "");
        }

        return str;
    }
    function getEntityInformation(entityID) {
        const entityInfo = search.lookupFields({
            type: "vendor",
            id: entityID,
            columns: ["custentity_lmry_sv_taxpayer_number", "custentity_lmry_digito_verificator"]
        });
        return { entityTax: `${entityInfo.custentity_lmry_sv_taxpayer_number}-${entityInfo.custentity_lmry_digito_verificator}` };
    }
    return {
        onRequest: onRequest
    };
});
