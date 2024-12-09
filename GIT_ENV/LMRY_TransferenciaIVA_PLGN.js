/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       Jul 2018        LatamReady
 * File : LMRY_TransferenciaIVA_PLGN.js
 */
var objContext = nlapiGetContext();

var LMRY_script = 'LatamReady - Transferencia de IVA Plug-in';
var subsidiary = '';


function customizeGlImpact(transactionRecord, standardLines, customLines, book) {

    try {

        var country = transactionRecord.getFieldText("custbody_lmry_subsidiary_country") || '';

        if (country != '' && country != null) {
            country = country.substring(0, 3).toUpperCase();
        }
        country = country.substring(0, 1) + country.substring(2, 3);

        if (country == '' || country == null) {
            country = nlapiLookupField('subsidiary', transactionRecord.getFieldValue("subsidiary"), 'country') || '';
        }
        nlapiLogExecution('DEBUG', 'country', country);
        if (country != 'MX') {
            return true;
        }

        //Fixed To Transaction Discount
        var transactionType = transactionRecord.getRecordType().toLowerCase();
        var purchasesTransaction = ['vendorpayment', 'vendorprepaymentapplication'];
        var salesTransaction = ['customerpayment', 'customerrefund', 'depositapplication'];

        var licenses = getLicenses(transactionRecord.getFieldValue("subsidiary"));
        nlapiLogExecution('DEBUG', 'FEATURE 914', getAuthorization(914, licenses));

        if (getAuthorization(914, licenses)) {
            transferenciaIvabyCode(transactionRecord, standardLines, customLines, book, licenses);
        } else if (getAuthorization(243, licenses)) {
            nlapiLogExecution('DEBUG', 'transactionType', transactionType);
            if ((salesTransaction.indexOf(transactionType) !== -1 && getAuthorization(672, licenses)) || 
                (purchasesTransaction.indexOf(transactionType) !== -1 && getAuthorization(671, licenses))) {
                transferenciaIvabySubType(transactionRecord, standardLines, customLines, book, licenses);
            } else if ((purchasesTransaction.indexOf(transactionType) !== -1) && getAuthorization(814, licenses)) {
                discountWithHolding(transactionRecord, standardLines, customLines, book, licenses);
            } else {
                transferenciaIva(transactionRecord, standardLines, customLines, book, licenses);
            }
        }




    } catch (err) {
        //nlapiLogExecution('ERROR', 'customizeGlImpact', err);
        sendemail(' [ customizeGlImpact ] ' + err, LMRY_script);
        doLog({ title : "[ customizeGlImpact ]", message : err });
    }
}