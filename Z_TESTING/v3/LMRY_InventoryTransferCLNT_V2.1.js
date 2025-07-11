/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define([
    './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0',
    './Latam_Library/LMRY_MX_Pedimentos_LBRY_2.0',
    './Latam_Library/LMRY_libToolsFunctionsLBRY_V2.0'
], (
    Lib_sendEmail,
    Lib_pedimento,
    Lib_tools
) => {

    // Global variables
   // const { executionContext } = runtime;
    let type;
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    const pageInit = (scriptContext) => {
        type = scriptContext.mode;
        console.log("type",type)
    };
    const saveRecord = (scriptContext) => {
        try {
            const {currentRecord} = scriptContext;  
            const subsidiaryId = currentRecord.getValue("subsidiary");
            const countryCode = Lib_sendEmail.Validate_Country(subsidiaryId)[0];
            if (countryCode == "MX") {
                var featPedimentos = Lib_pedimento.isAutomaticPedimentos(subsidiaryId)
                if (featPedimentos && (type == "create" || type == 'edit' || type == 'copy')) {
                    var mxTransaction = Lib_pedimento.getPedimentoMXtransaction(currentRecord.id);
                    if (mxTransaction.length > 0) {
                        if (Number(currentRecord.id) != 0) {
                            if (!Lib_tools.searchPediments(currentRecord.id)) {
                                return true;
                            }
                        }
                        const mensaje = Lib_pedimento.isValidItemsTransaction(currentRecord);
                        if (mensaje !== "ok") {
                            Lib_pedimento.translateAlert(mensaje);
                            console.log(mensaje)
                            if (mensaje.indexOf('Error') !== -1) {
                                return false;
                            }
                        }
                    }
                }
            }
            return true;
        } catch (err) {
            alert("error [Saverecord]: "+err)
        }
    };

    const validateAccess = (idSubsidiary) => {
	 var isAccess = false;
	 var countryInfo = [];
	 var credentials = [];
	 try {
	   countryInfo = Lib_sendEmail.Validate_Country(idSubsidiary);

	   if (!countryInfo.length) {
		 credentials[0] = '';
		 credentials[1] = '';
		 credentials[2] = false;
		 return credentials;
	   }

	   isAccess = Lib_sendEmail.getCountryOfAccess(countryInfo, licenses);

	   credentials = [countryInfo[0], countryInfo[1], isAccess];
	 }
	 catch (err) {
	   throw ' [ ValidateAccessTO ] ' + err;
	 }

	 return credentials;
   }

    return {
        pageInit,
        saveRecord
    };
});
