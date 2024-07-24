/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_AR_Withholding_Certificate_PDF_LBRY.js
 * @Author LatamReady - Andy Quispe
 * @Date 13/03/2024
 */
define(["N/log", "N/error", "N/record", "N/search", "N/query", "N/xml", "N/file", "N/format", "N/url", "N/render", "../Latam Tools/Router/LMRY_AR_Library_ROUT"], (
    nLog,
    error,
    record,
    search,
    query,
    xml,
    file,
    format,
    url,
    render,
    Library_ROUT
) => {
    const LMRY_SCRIPT = "LR AR Withholding Certificate PDF";
    const TEMPLATE_PATH = "../Public/Templates/Withholding Certificate/LMRY_AR_Withholding_Certificate_PDF.xml";

    class WthCertificatePdf {
        #paymentId;
        #subsidiaryId;
        #vendorId;
        #paymentDate = {};
        #setupTaxSubsidiaryDataJson = {};
        #subsidiaryDataJson = {};
        #vendorDataJson = {};
        #voucherDetailsList = [];
        #folderId;
        #folderPath;
        #pdf;

        constructor({ paymentId, subsidiaryId, vendorId }) {
            this.#paymentId = paymentId;
            this.#subsidiaryId = subsidiaryId;
            this.#vendorId = vendorId;
        }

        createPdf() {
            nLog.debug("paymentId", this.#paymentId);
            nLog.debug("subsidiaryId", this.#subsidiaryId);
            nLog.debug("vendorId", this.#vendorId);
            this.#getSetupTaxSubsidiaryData();
            this.#getSubsidiaryData();
            this.#getVendorData();
            this.#getVoucherDetails();
            nLog.debug("setupTaxSubsidiaryData", this.#setupTaxSubsidiaryDataJson);
            nLog.debug("subsidiaryData", this.#subsidiaryDataJson);
            nLog.debug("vendorData", this.#vendorDataJson);
            nLog.debug("paymentDate", this.#paymentDate);
            nLog.debug("voucherDetailsList", this.#voucherDetailsList);
            this.#renderPdf();
        }

        savePdf() {
            const hasCertificateCreated = this.#validateCertificateExistence();
            if (!hasCertificateCreated) {
                this.#validateFolder();
                this.#saveCertificate();
            }
        }

        #getSetupTaxSubsidiaryData() {
            /* Query */
            const setupTaxSubsidiaryQuery = query.create({
                type: "customrecord_lmry_ste_setuptax_subsi"
            });

            /* Conditions */
            const subsidiaryIdCondition = setupTaxSubsidiaryQuery.createCondition({
                fieldId: "custrecord_lmry_ste_sts_subsidiary",
                operator: query.Operator.ANY_OF,
                values: [this.#subsidiaryId]
            });

            setupTaxSubsidiaryQuery.condition = subsidiaryIdCondition;

            /* Columns */
            const stsAddCheckDigit = setupTaxSubsidiaryQuery.createColumn({
                fieldId: "custrecord_lmry_ste_sts_ar_add_check_dig",
                alias: "addCheckDigit"
            });

            const stsIncludePaidDocuments = setupTaxSubsidiaryQuery.createColumn({
                fieldId: "custrecord_lmry_ste_sts_ar_inc_pay_docs",
                alias: "includePaidDocuments"
            });

            const stsIsUnrestrictedLogo = setupTaxSubsidiaryQuery.createColumn({
                fieldId: "custrecord_lmry_ste_sts_ar_unrestri_logo",
                alias: "isUnrestrictedLogo"
            });

            const stsSignatureOnPayment = setupTaxSubsidiaryQuery.createColumn({
                fieldId: "custrecord_lmry_ste_sts_ar_sign_payment",
                alias: "signatureOnPayment"
            });

            const stsWhtCertificateFolder = setupTaxSubsidiaryQuery.createColumn({
                fieldId: "custrecord_lmry_ste_sts_ar_cer_folder_id",
                alias: "whtCertificateFolder"
            });

            setupTaxSubsidiaryQuery.columns = [stsAddCheckDigit, stsIncludePaidDocuments, stsIsUnrestrictedLogo, stsSignatureOnPayment, stsWhtCertificateFolder];

            const stsQueryResults = setupTaxSubsidiaryQuery.run().asMappedResults();

            if (stsQueryResults && stsQueryResults.length > 0) {
                this.#setupTaxSubsidiaryDataJson = stsQueryResults[0];
            }
        }

        #getSubsidiaryData() {
            /* Query */
            const subsidiaryQuery = query.create({
                type: query.Type.SUBSIDIARY
            });

            /* Joins */
            const taxregistrationJoin = subsidiaryQuery.autoJoin({
                fieldId: "taxregistration"
            });

            /* Conditions */
            const subsidiaryQueryCondition = subsidiaryQuery.createCondition({
                fieldId: "id",
                operator: query.Operator.ANY_OF,
                values: [this.#subsidiaryId]
            });

            subsidiaryQuery.condition = subsidiaryQueryCondition;

            /* Columns */
            const legalNameSubsidiary = subsidiaryQuery.createColumn({
                fieldId: "legalname",
                alias: "legalName"
            });

            const taxRegistrationNumber = taxregistrationJoin.createColumn({
                fieldId: "taxregistrationnumber",
                alias: "taxRegNumber"
            });

            const checkDigitSubsidiary = subsidiaryQuery.createColumn({
                fieldId: "custrecord_lmry_ste_check_digit",
                alias: "checkDigit"
            });

            const logoPages = subsidiaryQuery.createColumn({
                fieldId: "custrecord_lmry_ste_subsid_pagelogo_id",
                alias: "logoPagesId"
            });

            const arSignature = subsidiaryQuery.createColumn({
                fieldId: "custrecord_lmry_ste_ar_sign_wht_cert_id",
                alias: "signatureWhtId"
            });

            const mainaddress = subsidiaryQuery.createColumn({
                fieldId: "mainaddress",
                context: query.FieldContext.DISPLAY,
                alias: "address"
            });

            subsidiaryQuery.columns = [legalNameSubsidiary, taxRegistrationNumber, checkDigitSubsidiary, logoPages, arSignature, mainaddress];

            const subsidiaryQueryResults = subsidiaryQuery.run().asMappedResults();

            if (subsidiaryQueryResults && subsidiaryQueryResults.length > 0) {
                const { legalName, taxRegNumber, checkDigit, logoPagesId, signatureWhtId, address } = subsidiaryQueryResults[0];
                const { addCheckDigit, signatureOnPayment } = this.#setupTaxSubsidiaryDataJson;

                this.#subsidiaryDataJson.legalName = legalName ? xml.escape(legalName) : "";
                let taxRegNumberTemp = taxRegNumber || "";
                const checkDigitTemp = checkDigit || "";
                if (addCheckDigit && checkDigitTemp) taxRegNumberTemp = `${taxRegNumberTemp}-${checkDigitTemp}`;
                this.#subsidiaryDataJson.taxRegNumber = taxRegNumberTemp;
                this.#subsidiaryDataJson.pagelogoUrl = this.#getUrl(logoPagesId);
                this.#subsidiaryDataJson.signatureWhtUrl = signatureOnPayment ? this.#getUrl(signatureWhtId) : "";
                const addressTemp = address || "";
                this.#subsidiaryDataJson.address = xml.escape(addressTemp);
            }
        }

        #getUrl(fileId) {
            if (!fileId) return "";
            const netsuiteAccountId = url.resolveDomain({ hostType: url.HostType.APPLICATION });
            const fileObject = file.load({
                id: fileId
            });
            let urlFileImagen = `https://${netsuiteAccountId}${fileObject.url}`;
            urlFileImagen = urlFileImagen.replace(/&/gi, "&amp;");
            return urlFileImagen;
        }

        #getVendorData() {
            const { addCheckDigit } = this.#setupTaxSubsidiaryDataJson;

            const columns = ["isperson", "firstname", "lastname", "companyname", "defaulttaxreg", "address", "custentity_lmry_ste_check_digit"];
            const result = search.lookupFields({
                type: "vendor",
                id: this.#vendorId,
                columns: columns
            });

            const isPerson = result.isperson;
            const lastName = result.lastname || "";
            const firstName = result.firstname || "";

            if (isPerson === true || isPerson === "T") {
                this.#vendorDataJson.name = xml.escape(`${lastName} ${firstName}`);
            } else {
                const companynameTemp = result.companyname || "";
                this.#vendorDataJson.name = xml.escape(companynameTemp);
            }

            let taxRegNumberTemp = result.defaulttaxreg || "";
            const checkDigitTemp = result.custentity_lmry_ste_check_digit || "";
            if (addCheckDigit && checkDigitTemp) taxRegNumberTemp = `${taxRegNumberTemp}-${checkDigitTemp}`;
            this.#vendorDataJson.taxRegNumber = taxRegNumberTemp;

            const addressTemp = result.address || "";
            this.#vendorDataJson.address = xml.escape(addressTemp);
        }

        #getVoucherDetails() {
            /* Query */
            const whtTaxVoucherDetailsQuery = query.create({
                type: "customrecord_lmry_ste_ar_wht_tv_details"
            });

            /* Joins */
            const whtTaxVoucherJoin = whtTaxVoucherDetailsQuery.autoJoin({
                fieldId: "custrecord_lmry_ste_ar_wtvd_tax_voucher"
            });

            const billTransactionJoin = whtTaxVoucherDetailsQuery.autoJoin({
                fieldId: "custrecord_lmry_ste_ar_wtvd_transaction^transaction"
            });

            /* Conditions */
            const isInactiveVoucherDetails = whtTaxVoucherDetailsQuery.createCondition({
                fieldId: "isinactive",
                operator: query.Operator.IS,
                values: [false]
            });

            const isInactiveVoucher = whtTaxVoucherJoin.createCondition({
                fieldId: "isinactive",
                operator: query.Operator.IS,
                values: [false]
            });

            const vendorPayment = whtTaxVoucherJoin.createCondition({
                fieldId: "custrecord_lmry_ste_ar_wtv_payment",
                operator: query.Operator.ANY_OF,
                values: [this.#paymentId]
            });

            whtTaxVoucherDetailsQuery.condition = whtTaxVoucherDetailsQuery.and(vendorPayment, isInactiveVoucher, isInactiveVoucherDetails);

            /* Columns */
            const whtTaxVoucherDetailsId = whtTaxVoucherDetailsQuery.createColumn({
                fieldId: "id",
                alias: "voucherDetailsId"
            });

            const whtTaxVoucherId = whtTaxVoucherJoin.createColumn({
                fieldId: "id",
                alias: "voucherId"
            });
            const groupWht = whtTaxVoucherJoin.createColumn({
                fieldId: "custrecord_lmry_ste_ar_wtv_is_group_wht",
                alias: "isGroupWht"
            });

            const voucherNumber = whtTaxVoucherJoin.createColumn({
                fieldId: "custrecord_lmry_ste_ar_wtv_number",
                alias: "numberGroup"
            });

            const voucherDetailsNumber = whtTaxVoucherDetailsQuery.createColumn({
                fieldId: "custrecord_lmry_ste_ar_wtvd_number",
                alias: "number"
            });

            const whtTaxSubtype = whtTaxVoucherJoin.createColumn({
                fieldId: "custrecord_lmry_ste_ar_wtv_tax_type",
                context: query.FieldContext.DISPLAY,
                alias: "taxSubtype"
            });

            const iibbJurisdiction = whtTaxVoucherJoin.createColumn({
                fieldId: "custrecord_lmry_ste_ar_wtv_jurisdiction",
                context: query.FieldContext.DISPLAY,
                alias: "jurisdiction"
            });

            const whtRegimen = whtTaxVoucherJoin.createColumn({
                fieldId: "custrecord_lmry_ste_ar_wtv_regimen",
                context: query.FieldContext.DISPLAY,
                alias: "regimen"
            });

            const taxRatePorcentual = whtTaxVoucherJoin.createColumn({
                fieldId: "custrecord_lmry_ste_ar_wtv_tax_rate",
                alias: "taxRate"
            });

            const vendorPaymentDate = whtTaxVoucherJoin.createColumn({
                fieldId: "custrecord_lmry_ste_ar_wtv_pay_date",
                alias: "paymentDate"
            });

            const billTransaction = billTransactionJoin.createColumn({
                fieldId: "id",
                alias: "billId"
            });

            const billFiscalDocumentType = billTransactionJoin.createColumn({
                fieldId: "custbody_lmry_ste_fiscal_doctype",
                context: query.FieldContext.DISPLAY,
                alias: "fiscalDocumentType"
            });

            const billSerieCxP = billTransactionJoin.createColumn({
                fieldId: "custbody_lmry_ste_serie_doc_cxp",
                alias: "serieCxP"
            });

            const billPreprintNumber = billTransactionJoin.createColumn({
                fieldId: "custbody_lmry_ste_preprinted_number",
                alias: "preprintNumber"
            });

            const billLocalTotalAmount = whtTaxVoucherDetailsQuery.createColumn({
                fieldId: "custrecord_lmry_ste_ar_wtvd_local_tt_amt",
                alias: "billTotalAmount"
            });

            const localBasePaymentAmount = whtTaxVoucherJoin.createColumn({
                fieldId: "custrecord_lmry_ste_ar_wtv_local_bpa",
                alias: "basePaymentAmount"
            });

            const localWhtAmount = whtTaxVoucherDetailsQuery.createColumn({
                fieldId: "custrecord_lmry_ste_ar_wtvd_local_wa",
                alias: "whtAmount"
            });

            whtTaxVoucherDetailsQuery.columns = [
                whtTaxVoucherDetailsId,
                whtTaxVoucherId,
                groupWht,
                voucherNumber,
                voucherDetailsNumber,
                whtTaxSubtype,
                iibbJurisdiction,
                whtRegimen,
                taxRatePorcentual,
                vendorPaymentDate,
                billTransaction,
                billFiscalDocumentType,
                billSerieCxP,
                billPreprintNumber,
                billLocalTotalAmount,
                localBasePaymentAmount,
                localWhtAmount
            ];

            const voucherDetailsQueryResults = whtTaxVoucherDetailsQuery.run().asMappedResults();
            if (voucherDetailsQueryResults && voucherDetailsQueryResults.length > 0) {
                const voucherDataJson = {};
                this.#setupTaxSubsidiaryDataJson.isGroupWht = voucherDetailsQueryResults[0].isGroupWht;
                const date = format.parse({ value: voucherDetailsQueryResults[0].paymentDate, type: format.Type.DATE });
                this.#paymentDate.day = String(date.getDate()).padStart(2, "0"); // Día de Retención
                this.#paymentDate.month = String(date.getMonth() + 1).padStart(2, "0"); // Mes de Retención
                this.#paymentDate.monthText = this.#getMonthInText(this.#paymentDate.month);
                this.#paymentDate.monthTextParcial = this.#paymentDate.monthText.substring(0, 3);
                this.#paymentDate.year = date.getFullYear(); // Anio de Retención
                voucherDetailsQueryResults.forEach(
                    ({
                        voucherDetailsId,
                        voucherId,
                        numberGroup,
                        number,
                        taxSubtype,
                        jurisdiction,
                        regimen,
                        taxRate,
                        billId,
                        fiscalDocumentType,
                        serieCxP,
                        preprintNumber,
                        billTotalAmount,
                        basePaymentAmount,
                        whtAmount
                    }) => {
                        if (this.#setupTaxSubsidiaryDataJson.isGroupWht) {
                            if (!numberGroup) return;
                            if (!voucherDataJson.hasOwnProperty(voucherId)) {
                                const taxSubtypeTemp = taxSubtype || "";
                                const jurisdictionTemp = jurisdiction || "";
                                let taxName = taxSubtypeTemp + jurisdictionTemp;
                                if (taxSubtypeTemp && jurisdictionTemp) taxName = `${taxSubtypeTemp} / ${jurisdictionTemp}`;
                                const regimenTemp = regimen || "";
                                const taxRateTemp = this.roundAmount(taxRate * 100);
                                voucherDataJson[voucherId] = {
                                    number: numberGroup,
                                    taxName: xml.escape(taxName),
                                    regimen: xml.escape(regimenTemp),
                                    taxRate: `${taxRateTemp} %`,
                                    paidBills: `${billId}`,
                                    billTotalAmount: this.roundAmount(billTotalAmount),
                                    basePaymentAmount,
                                    whtAmount
                                };
                            } else {
                                voucherDataJson[voucherId]["paidBills"] += `, ${billId}`;
                                voucherDataJson[voucherId]["billTotalAmount"] += this.roundAmount(billTotalAmount);
                                voucherDataJson[voucherId]["whtAmount"] += whtAmount;
                            }
                        } else {
                            if (!number) return;
                            const taxSubtypeTemp = taxSubtype || "";
                            const jurisdictionTemp = jurisdiction || "";
                            let taxName = taxSubtypeTemp + jurisdictionTemp;
                            if (taxSubtypeTemp && jurisdictionTemp) taxName = `${taxSubtypeTemp} / ${jurisdictionTemp}`;
                            const regimenTemp = regimen || "";
                            const taxRateTemp = this.roundAmount(taxRate * 100);
                            let billOriginDescription = "";
                            if (fiscalDocumentType) billOriginDescription += fiscalDocumentType;
                            if (serieCxP) billOriginDescription += ` ${serieCxP}`;
                            if (preprintNumber) billOriginDescription += `-${preprintNumber}`;
                            voucherDataJson[voucherDetailsId] = {
                                number,
                                taxName: xml.escape(taxName),
                                regimen: xml.escape(regimenTemp),
                                taxRate: `${taxRateTemp} %`,
                                billOriginDescription,
                                billTotalAmount: this.roundAmount(billTotalAmount),
                                basePaymentAmount,
                                whtAmount
                            };
                        }
                    }
                );

                this.#voucherDetailsList = Object.values(voucherDataJson).map(({ billTotalAmount, basePaymentAmount, whtAmount, ...otherValues }) => {
                    return {
                        billTotalAmount: format.format({ value: billTotalAmount, type: format.Type.CURRENCY2 }),
                        basePaymentAmount: format.format({ value: basePaymentAmount, type: format.Type.CURRENCY2 }),
                        whtAmount: format.format({ value: whtAmount, type: format.Type.CURRENCY2 }),
                        ...otherValues
                    };
                });
            }
        }

        #getMonthInText(month) {
            const monthInText = {
                "01": "enero",
                "02": "febrero",
                "03": "marzo",
                "04": "abril",
                "05": "mayo",
                "06": "junio",
                "07": "julio",
                "08": "agosto",
                "09": "setiembre",
                "10": "octubre",
                "11": "noviembre",
                "12": "diciembre"
            };
            return monthInText[month];
        }

        #renderPdf() {
            const xmlFile = file.load(TEMPLATE_PATH);
            const renderer = render.create();
            renderer.templateContent = xmlFile.getContents();
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "data",
                data: {
                    setupTaxSubsidiary: this.#setupTaxSubsidiaryDataJson,
                    paymentDate: this.#paymentDate,
                    subsidiary: this.#subsidiaryDataJson,
                    vendor: this.#vendorDataJson,
                    voucherList: this.#voucherDetailsList,
                    paymentId: this.#paymentId
                }
            });

            this.#pdf = renderer.renderAsPdf();
        }

        #validateCertificateExistence() {
            /* Query */
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
                values: [this.#paymentId]
            });

            whtCertificateQuery.condition = whtCertificateQuery.and(transactionCondition, isInactiveCondition);

            /* Columns */
            const internalId = whtCertificateQuery.createColumn({
                fieldId: "id"
            });

            whtCertificateQuery.columns = [internalId];

            const whtCertificateQueryResults = whtCertificateQuery.run().asMappedResults();

            if (whtCertificateQueryResults && whtCertificateQueryResults.length > 0) return true;
            return false;
        }

        #validateFolder() {
            const { Document_LBRY } = Library_ROUT;
            //this.#folderId = 11620;
            //let nameFolderDefault = "LatamReady - AR WHT Certificate";
            const { whtCertificateFolder } = this.#setupTaxSubsidiaryDataJson;

            if (whtCertificateFolder) {
                this.#folderId = whtCertificateFolder;
            } else {
                this.#folderId = Document_LBRY.getFolderId("AR_WHT_CERTIFICATE_PDF");
                //this.#folderId = folder_handler.getDocumentFolderId("AR_WHT_CERTIFICATE_PDF");
            }
            this.#validateFolderExistence(this.#folderId);
        }

        #validateFolderExistence(folderId) {
            /* Query */
            const itemFolderQuery = query.create({
                type: query.Type.MEDIA_ITEM_FOLDER
            });

            /* Conditions */
            const folderIdCondition = itemFolderQuery.createCondition({
                fieldId: "id",
                operator: query.Operator.ANY_OF,
                values: [folderId]
            });

            itemFolderQuery.condition = folderIdCondition;

            /* Columns */
            const itemFolderId = itemFolderQuery.createColumn({
                fieldId: "id"
            });

            const itemFolderName = itemFolderQuery.createColumn({
                fieldId: "name"
            });

            const itemAppFolder = itemFolderQuery.createColumn({
                fieldId: "appfolder",
                alias: "folderPath"
            });

            itemFolderQuery.columns = [itemFolderId, itemFolderName, itemAppFolder];

            const itemFolderQueryResults = itemFolderQuery.run().asMappedResults();

            if (itemFolderQueryResults && itemFolderQueryResults.length > 0) {
                const { folderPath } = itemFolderQueryResults[0];
                this.#folderPath = folderPath;
            } else {
                throw error.create({
                    name: "AR_WHT_CERTIFICATE_INVALID_FOLDER",
                    message: "No folder has been found to save the withholding certificate. Please check the folder ID set in the Setup Tax Subsidiary record exists in the File Cabinet."
                });
            }
        }

        #saveCertificate() {
            this.#pdf.name = `AR_Certificado_Retencion_${this.#paymentId}.pdf`;
            this.#pdf.folder = this.#folderId;

            const idFile = this.#pdf.save();
            const whtCertificate = record.create({
                type: "customrecord_lmry_ste_ar_wht_certificate",
                isDynamic: true
            });
            whtCertificate.setValue("custrecord_lmry_ste_ar_wht_cert_trans", this.#paymentId);
            whtCertificate.setValue("custrecord_lmry_ste_ar_wht_cert_file", idFile);
            whtCertificate.setValue("custrecord_lmry_ste_ar_wht_cert_size", parseInt(this.#pdf.size / 1000));
            whtCertificate.setValue("custrecord_lmry_ste_ar_wht_cert_path", this.#folderPath);

            whtCertificate.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
        }

        getWhtPdfCertificate() {
            return this.#pdf;
        }

        /**
         * Rounds a given number to a specified number of decimal places.
         * @param {Number} amount - The number that you want to round to a specific number of decimal places.
         * @param {Number} decimals - Optional parameter that specifies the number of decimal places to round.
         * @returns the rounded value of the input amount.
         */
        roundAmount(amount, decimals = 2) {
            try {
                if (typeof amount !== "number") {
                    amount = parseFloat(amount);
                }

                const q = Math.pow(10, decimals);
                const e = amount >= 0 ? 1e-6 : -1e-6;

                return Math.round(amount * q + e) / q;
            } catch (error) {
                nLog.error({ title: `[ ${LMRY_SCRIPT} : _round ]`, details: error });
            }
        }
    }

    return { WthCertificatePdf };
});
