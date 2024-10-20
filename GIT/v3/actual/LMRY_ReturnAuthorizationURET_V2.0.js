/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_ReturnAuthorizationURET_V2.0.js		        ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 25 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */
define(['N/search', 'N/runtime', 'N/log', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', './Latam_Library/LMRY_HideView3LBRY_V2.0'],
    function (search, runtime, log, library_mail, library_HideView) {
        var LMRY_script = 'LatamReady - Return Authorization URET V2.0';
        var recordObj = '';
        function beforeLoad(context) {
            var type = context.type;
            var recordObj = context.newRecord;
            var form = context.form;
            var country = '';
            try {
                if (type != 'print' && type != 'email') {
                    var subsidiary = recordObj.getValue({
                        fieldId: 'subsidiary'
                    });
                    if (!subsidiary) {
                        subsidiary = runtime.getCurrentUser().subsidiary;
                    }

                    var LICENSES = [];

                    if (subsidiary) {
                        LICENSES = library_mail.getLicenses(subsidiary);
                    }

                    var LMRY_Result = ValidAccessRAU(subsidiary, LICENSES);
                    country = LMRY_Result.slice(0, 2);
                    var hasAccess = LMRY_Result[2];

                    hideandViewFields(context, country, hasAccess, LICENSES);

                    //Pedimentos
                    if (country[0] == 'MX') {
                        var recordID = recordObj.id;
                        if (type == 'view' && searchPediments(recordID)) {
                            form.removeButton('edit');
                        }
                    }
                }
            }
            catch (err) {
                log.error('BeforeLoad', err);
                library_mail.sendemail2(' [ BeforeLoad ] ' + err, LMRY_script, recordObj, 'transactionnumber', 'customer');
            }
        }

        function hideandViewFields(context, country, hasAccess, LICENSES) {
            var type = context.type;
            var recordObj = context.newRecord;
            var form = context.form;
            var typeTrans = recordObj.type;

            if (form) {
                var types = ['create', 'edit', 'copy', 'view'];

                if (types.indexOf(type) != -1) {


                    var functionsBySection = { '2': 'PxHide', '5': 'PxHideSubTab', '3': 'PxHideColumn' };
                    var codeCountry = "";

                    if (hasAccess) {
                        codeCountry = country[0];
                    }

                    for (var section in functionsBySection) {
                        var isActive = library_mail.getHideView(country, section, LICENSES);
                        if (isActive || (!LICENSES || !LICENSES.length)) {
                            library_HideView[functionsBySection[section]](form, codeCountry, typeTrans);
                        }

                    }
                }
            }
        }

        function ValidAccessRAU(idSubsidiary, LICENSES) {
            var LMRY_access = false;
            var LMRY_countr = [];
            var LMRY_Result = [];
            LMRY_countr = library_mail.Validate_Country(idSubsidiary);

            if (!LMRY_countr.length) {
                LMRY_Result[2] = false;
                return LMRY_Result;
            }

            LMRY_access = library_mail.getCountryOfAccess(LMRY_countr, LICENSES);
            LMRY_Result = [LMRY_countr[0], LMRY_countr[1], LMRY_access];

            return LMRY_Result;
        }

        function searchPediments(obj_ped) {

            //Busca si la transacción ya se registró en el record LatamReady - MX Pediments Detail
            var search_ped = search.create({ type: 'customrecord_lmry_mx_pedimento_details', filters: [{ name: 'custrecord_lmry_mx_ped_trans_ref', operator: 'is', values: obj_ped }], columns: ['internalid'] });

            var result_ped = search_ped.run().getRange({ start: 0, end: 1 });

            if (result_ped != null && result_ped.length > 0) {
                return true;
            } else {
                return false;
            }
        }
        
        return {
            beforeLoad: beforeLoad
        };
    });
