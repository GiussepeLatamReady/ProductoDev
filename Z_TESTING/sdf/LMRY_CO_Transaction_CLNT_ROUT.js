/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_CO_Transaction_CLNT_ROUT.js
 * @Author Giussepe Delgado
 * @Date 10/07/2024
 */

define([
    "../pluginImpl/invoice/LMRY_Invoice_CO_CLNT_HNDL",
    "../pluginImpl/creditmemo/LMRY_CreditMemo_CO_CLNT_HNDL",
    "../pluginImpl/vendorbill/LMRY_VendorBill_CO_CLNT_HNDL",
    "../pluginImpl/vendorcredit/LMRY_VendorCredit_CO_CLNT_HNDL",
], function (
        Invoice_CLNT_HNDL, 
        CreditMemo_CLNT_HNDL, 
        VendorBill_CLNT_HNDL, 
        VendorCredit_CLNT_HNDL
    ) {
    const clientRouter = {
        invoice: Invoice_CLNT_HNDL,
        creditmemo: CreditMemo_CLNT_HNDL,
        vendorbill: VendorBill_CLNT_HNDL,
        vendorcredit: VendorCredit_CLNT_HNDL
    };

    const getClientRouter = (transactionType) => {
        if (clientRouter.hasOwnProperty(transactionType)) {
            return clientRouter[transactionType];
        }
        return null;
    };

    return {
        getClientRouter
    };
});
