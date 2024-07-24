/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_AR_Withholding_Certificate_LBRY.js
 * @Author LatamReady - Andy Quispe
 * @Date 29/02/20244
 */
define(["N/log", "N/translation", "N/query", "N/record", "../Helper/LMRY_AR_Search_Library_HELPER"], (nLog, translation, query, record, Search_HELPER) => {
    const LMRY_SCRIPT = "LMRY AR Withholding Certificate LBRY";

    const createButtonPrintWhtCertificate = (form, newRecord, subsidiaryId) => {
        try {
            const { isWhtCertificatePdf } = Search_HELPER.getSetupTaxSubsidiary(subsidiaryId);
            if (!isWhtCertificatePdf) return;
            const vendorId = newRecord.getValue({ fieldId: "entity" });
            form.addButton({
                id: "custpage_btn_ar_print_wht_cert",
                label: "Imprimir Cert. Retencion",
                functionName: `arPrintWhtPdf(${newRecord.id},${subsidiaryId},${vendorId})`
            });
            form.addField({
                id: "custpage_ar_print_wht_cert_html",
                label: "AR WHT Html",
                //type: serverWidget.FieldType.INLINEHTML
                type: "INLINEHTML"
            }).defaultValue = `<script>const arPrintWhtPdf=${btnFunctionPrintWthPdf}</script>`;
        } catch (error) {
            nLog.error(`[ ${LMRY_SCRIPT} : createButtonPrintWhtCertificate ]`, error);
        }
    };

    const inactivateVouchers = (recordId) => {
        const whtVoucherDetailsQuery = _getVoucherDetailsQuery(recordId);

        const whtVoucherDetailsResults = whtVoucherDetailsQuery.run().asMappedResults();
        if (whtVoucherDetailsResults && whtVoucherDetailsResults.length > 0) {
            const inactiveVouchers = [];
            for (let i = 0; i < whtVoucherDetailsResults.length; i++) {
                const { detailsId, voucherId } = whtVoucherDetailsResults[i];
                record.submitFields({
                    type: "customrecord_lmry_ste_ar_wht_tv_details",
                    id: detailsId,
                    values: {
                        isinactive: "T"
                    }
                });
                if (!inactiveVouchers.includes(voucherId)) {
                    record.submitFields({
                        type: "customrecord_lmry_ste_ar_wht_tax_voucher",
                        id: voucherId,
                        values: {
                            isinactive: "T"
                        }
                    });
                    inactiveVouchers.push(voucherId);
                }
            }
        }
    };

    const btnFunctionPrintWthPdf = (recordId, subsidiaryId, vendorId) => {
        const PATH = "/SuiteApps/com.latamready.stearlocalization/Latam Tools/Services/LMRY_AR_Services_HELPER";
        require([PATH, "N/url", "N/ui/message"], function (Services_API, url, message) {
            try {
                const validateProcess = Services_API.useServiceAPI({
                    processType: "GET_VALIDATION_PROCESS_WHT_PDF",
                    vendorPaymentId: recordId
                });
                if (validateProcess.status) {
                    console.log("exito");
                    const urlWhtCertificateStlt = url.resolveScript({
                        scriptId: "customscript_lmry_ste_ar_wht_cert_stlt",
                        deploymentId: "customdeploy_lmry_ste_ar_wht_cert_stlt",
                        returnExternalUrl: false
                    });
                    window.open(`${urlWhtCertificateStlt}&paymentId=${recordId}&subsidiaryId=${subsidiaryId}&vendorId=${vendorId}`);
                } else {
                    const myMsg = message.create({
                        title: "Warning: Withholding Certificate Process",
                        message: validateProcess.message,
                        type: message.Type.WARNING,
                        duration: 10000
                    });
                    myMsg.show();
                }
            } catch (error) {
                console.log(error);
                const myMsg = message.create({
                    title: `Error: ${error.name}`,
                    message: error.message,
                    type: message.Type.ERROR,
                    duration: 5000
                });
                myMsg.show();
            }
        });
    };

    const validateProcessWhtPdf = (recordId) => {
        let validateJson = {};
        validateJson = _validateProcess(recordId);
        if (!validateJson.status) return validateJson;
        validateJson = _validateVouchers(recordId);
        if (!validateJson.status) return validateJson;
        return validateJson;
    };

    function _validateProcess(recordId) {
        /* Query */
        const vendorPaymentDetailsQuery = query.create({
            type: "customrecord_lmry_ste_ar_wht_vp_details"
        });

        /* Joins */
        const processStatusJoin = vendorPaymentDetailsQuery.autoJoin({
            fieldId: "custrecord_lmry_ste_ar_whtvpd_status"
        });

        /* Conditions */
        const inactiveCondition = vendorPaymentDetailsQuery.createCondition({
            fieldId: "isinactive",
            operator: query.Operator.IS,
            values: [false]
        });

        const paymentCondition = vendorPaymentDetailsQuery.createCondition({
            fieldId: "custrecord_lmry_ste_ar_whtvpd_payment",
            operator: query.Operator.ANY_OF,
            values: [recordId]
        });

        vendorPaymentDetailsQuery.condition = vendorPaymentDetailsQuery.and(paymentCondition, inactiveCondition);

        /* Columns */
        const idDetails = vendorPaymentDetailsQuery.createColumn({
            fieldId: "id",
            alias: "detailsId"
        });

        const processStatusCode = processStatusJoin.createColumn({
            fieldId: "custrecord_lmry_ste_procstatus_code",
            alias: "statusCode"
        });

        vendorPaymentDetailsQuery.columns = [idDetails, processStatusCode];
        const vendorPaymentDetailsResults = vendorPaymentDetailsQuery.run().asMappedResults();
        if (vendorPaymentDetailsResults && vendorPaymentDetailsResults.length > 0) {
            const { statusCode } = vendorPaymentDetailsResults[0];

            if (statusCode === "DONE") return { status: true };
            //if (statusCode === "VOIDED") return { status: false, message: "El pago ha sido anulado." };
            if (statusCode === "VOIDED") return { status: false, message: "The payment has been voided." };
        }
        //return { status: false, message: "El pago no se genero por el modulo WHT On Vendor Payments" };
        return { status: false, message: "Payment not generated by module WHT On Vendor Payments" };
    }

    const _validateVouchers = (recordId) => {
        const whtVoucherDetailsQuery = _getVoucherDetailsQuery(recordId);
        const whtVoucherDetailsResults = whtVoucherDetailsQuery.run().asMappedResults();
        if (whtVoucherDetailsResults && whtVoucherDetailsResults.length > 0) {
            let hasVoucherNumbered = false;
            for (let i = 0; i < whtVoucherDetailsResults.length; i++) {
                const { isGroup, number, numberGroup } = whtVoucherDetailsResults[i];
                const numberVoucher = isGroup ? numberGroup : number;
                if (numberVoucher) hasVoucherNumbered = true;
            }
            if (hasVoucherNumbered) return { status: true };
            //return { status: false, message: "El Numero del Certificado de Retencion en el Voucher esta vacio" };
            return { status: false, message: "The Withholding Certificate Number on the Voucher is empty." };
        }
        //return { status: false, message: "No se encontraron comprobantes de retención asociados para este pago." };
        return { status: false, message: "No associated withholding vouchers were found for this payment." };
    };

    const _getVoucherDetailsQuery = (paymentId) => {
        /* Query */
        const whtVoucherDetailsQuery = query.create({
            type: "customrecord_lmry_ste_ar_wht_tv_details"
        });

        /* Joins */
        const WhtVoucherJoin = whtVoucherDetailsQuery.autoJoin({
            fieldId: "custrecord_lmry_ste_ar_wtvd_tax_voucher"
        });

        /* Conditions */
        const isInactiveCondition = whtVoucherDetailsQuery.createCondition({
            fieldId: "isinactive",
            operator: query.Operator.IS,
            values: [false]
        });

        const paymentIdCondition = WhtVoucherJoin.createCondition({
            fieldId: "custrecord_lmry_ste_ar_wtv_payment",
            operator: query.Operator.ANY_OF,
            values: [paymentId]
        });

        whtVoucherDetailsQuery.condition = whtVoucherDetailsQuery.and(paymentIdCondition, isInactiveCondition);

        /* Columns */
        const idVoucherDetails = whtVoucherDetailsQuery.createColumn({
            fieldId: "id",
            alias: "detailsId"
        });

        const number = whtVoucherDetailsQuery.createColumn({
            fieldId: "custrecord_lmry_ste_ar_wtvd_number",
            alias: "number"
        });

        const idVoucher = WhtVoucherJoin.createColumn({
            fieldId: "id",
            alias: "voucherId"
        });

        const isGroupWht = WhtVoucherJoin.createColumn({
            fieldId: "custrecord_lmry_ste_ar_wtv_is_group_wht",
            alias: "isGroup"
        });

        const numberGroup = WhtVoucherJoin.createColumn({
            fieldId: "custrecord_lmry_ste_ar_wtv_number",
            alias: "numberGroup"
        });

        whtVoucherDetailsQuery.columns = [idVoucherDetails, number, idVoucher, isGroupWht, numberGroup];
        return whtVoucherDetailsQuery;
    };

    return {
        createButtonPrintWhtCertificate,
        inactivateVouchers,
        validateProcessWhtPdf
    };
});
