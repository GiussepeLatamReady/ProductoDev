/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @Name LMRY_BR_Boleto_bancario_RSLT.js
 * @Author giussepe@latamready.com
 */
define([
    'N/search', 'N/record', 'N/log',
    './Latam_Library/LMRY_BoletoBancarioLBRY_V2.0'
],

    (
        search, record, log,
        Lib_Bank_Cheque
    ) => {
        const get = (requestParams) => {
            try {
                const { idInvoice, fecha, type, transaction, idBr } = requestParams;
                Lib_Bank_Cheque.obtenerURLPdfBoletoBancario(idInvoice, fecha, type, transaction, idBr)
            } catch (error) {
                log.error("GET [error]", error)
            }
        }
        

        const put = (requestBody) => { }


        const post = (context) => {}
        
        return {get}

    });
