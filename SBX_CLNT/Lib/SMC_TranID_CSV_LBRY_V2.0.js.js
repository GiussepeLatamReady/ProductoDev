/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_TranID_CSV_LBRY_V2.0.js                     ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Dec 30 2021  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

define(['N/log', './LMRY_libSendingEmailsLBRY_V2.0', 'N/search', 'N/runtime', './LMRY_libToolsFunctionsLBRY_V2.0', './LMRY_Validate_TranID_LBRY'],

    function (log, libraryMail, search, runtime, libtools, libraryVaTranId) {

        const LMRY_script = 'LMRY_TranID_CSV_LBRY_V2.0';

        function generateTranID(recordObj, LMRY_countr, licenses) {
            try {

                log.debug('[generateTranID]', 'START');

                var docType = recordObj.getValue('custbody_lmry_document_type');
                var docCxp = recordObj.getValue('custbody_lmry_serie_doc_cxp');
                var numPre = recordObj.getValue('custbody_lmry_num_preimpreso');
                var idsubsi = recordObj.getValue({ fieldId: 'subsidiary' });

                if (LMRY_countr == 'AR' && libraryMail.getAuthorization(707, licenses) == true) {
                    docCxp = libtools.completeSeries(docCxp, idsubsi);
                    numPre = libtools.completePreprinted(numPre, idsubsi);
                    recordObj.setValue({ fieldId: 'custbody_lmry_serie_doc_cxp', value: docCxp });
                    recordObj.setValue({ fieldId: 'custbody_lmry_num_preimpreso', value: numPre });
                }

                log.debug('docType - docCxp - numPre', docType + ' - ' + docCxp + ' - ' + numPre);

                if (docType != '' && docType != null) {
                    var textIni = search.lookupFields({
                        type: 'customrecord_lmry_tipo_doc',
                        id: docType,
                        columns: ['custrecord_lmry_doc_initials']
                    });

                    var textIni = textIni.custrecord_lmry_doc_initials || '';
                    var text = ''

                    text += textIni.toUpperCase() + ' ' + docCxp + '-' + numPre;

                    log.debug('text', text);

                    recordObj.setValue({
                        fieldId: 'tranid',
                        value: text
                    });

                    var validate = libraryVaTranId.validateTranID(recordObj, LMRY_countr, licenses)
                    log.debug('validate', validate);
                    if (!validate) {
                        return false;
                    }
                }
                log.debug('[generateTranID]', 'END');
            } catch (error) {
                log.error('generateTranID error', error);
                //libraryMail.sendemail('[generateTranID] ' + error, LMRY_script);
            }
            return true;
        }

        return {
            generateTranID: generateTranID
        };

    });