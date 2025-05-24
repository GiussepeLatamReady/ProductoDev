/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Tools for Report                           ||
||                                                              ||
||  File Name: LMRY_Invoicing_Populate_CLNT.js                  ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Oct 05 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/search', './LMRY_IP_libSendingEmailsLBRY_V2.0', 'N/currentRecord', 'N/record', 'N/url', 'N/runtime', './LMRY_EI_libSendingEmailsLBRY_V2.0'],

    function (search, library, currentRecord, record, url, runtime, libraryFeature) {
        var LMRY_script = 'LatamReady - Invoicing Populate CLNT';
        var flag = true;
        var jsonTransaction = {};

        var jsonLanguage = {
            subsidiary: {
                en: 'MANDATORY SUBSIDIARY FIELD',
                es: 'EL CAMPO SUBSIDIARIA ES OBLIGATORIO',
                pt: 'O CAMPO SUBSIDIÁRIO É OBRIGATÓRIO'
            },
            datefrom: {
                en: 'MANDATORY DATE FROM FIELD',
                es: 'EL CAMPO FECHA DESDE ES OBLIGATORIO',
                pt: 'O CAMPO DATA DE É OBRIGATÓRIO'
            },
            dateto: {
                en: 'MANDATORY DATE TO FIELD',
                es: 'EL CAMPO FECHA HASTA ES OBLIGATORIO',
                pt: 'O CAMPO DATA PARA É OBRIGATÓRIA'
            },
            deploy: {
                en: 'THERE IS A PROCESS RUNNING FOR THIS COUNTRY',
                es: 'HAY UN PROCESO EJECUTÁNDOSE PARA ESTE PAÍS',
                pt: 'HÁ UM PROCESSO EM EXECUÇÃO PARA ESTE PAÍS'
            },
            deploySubsidiary: {
                en: 'THERE IS A PROCESS RUNNING FOR THIS SUBSIDIARY',
                es: 'HAY UN PROCESO EJECUTÁNDOSE PARA ESTA SUBSIDIARIA',
                pt: 'HÁ UM PROCESSO EM EXECUÇÃO PARA ESTA SUBSIDIÁRIA'
            },
            select: {
                en: 'YOU HAVE NOT SELECTED ANY TRANSACTION',
                es: 'NO HA SELECCIONADO NINGUNA TRANSACCIÓN',
                pt: 'VOCÊ NÃO SELECIONOU NENHUMA TRANSAÇÃO'
            },
            nothing: {
                en: 'THERE IS NO TRANSACTION TO PROCESS',
                es: 'NO HAY NINGUNA TRANSACCIÓN POR PROCESAR',
                pt: 'NÃO HÁ TRANSAÇÃO PARA PROCESSAR'
            },
            error: {
                en: 'AN ERROR OCCURRED, THE PROCESS CANNOT BE CONTINUED',
                es: 'OCURRIÓ UN ERROR, NO SE PUEDE CONTINUAR CON EL PROCESO',
                pt: 'OCORREU UM ERRO, O PROCESSO NÃO PODE SER CONTINUADO'
            },
            notransactions: {
                en: 'NO TRANSACTIONS',
                es: 'NO HAY TRANSACCIONES',
                pt: 'SEM TRANSAÇÕES'
            },
            thereare: {
                en: 'THERE ARE ONLY ',
                es: 'SOLO HAY ',
                pt: 'EXISTEM APENAS '
            },
            transactions: {
                en: ' TRANSACTIONS',
                es: ' TRANSACCIONES',
                pt: ' TRANSAÇÕES'
            },
            transaction: {
                en: 'MANDATORY TRANSACTION FIELD',
                es: 'EL CAMPO TRANSACCIÓN ES OBLIGATORIO',
                pt: 'O CAMPO TRANSAÇÃO É OBRIGATÓRIO'
            }
        };

        var jsonCountry = {
            AR: {
                feature: 341,
                id: 'custscript_lmry_ar_email_emp_einvoice',
                campo: 'LATAM - AR EMAIL EMPLOYEE E-INVOICE',
                deploy: 'customdeploy_lmry_invoicing_populate_mr',
                deploy3: 'customdeploy_lmry_fillrcpt_pop_ar_mr',
                idCountry: 11
            },
            BO: {
                feature: 704,
                id: 'custscript_lmry_bo_email_emp_e',
                campo: 'LATAM - BO EMAIL EMPLOYEE E-INVOICE',
                deploy: 'customdeploy_lmry_invoicing_pop_bo_mr',
                idCountry: 29
            },
            BR: {
                feature: 339,
                id: 'custscript_lmry_br_email_emp_e',
                campo: 'LATAM - BR EMAIL EMPLOYEE E-INVOICE',
                deploy: 'customdeploy_lmry_invoicing_pop_br_mr',
                deploy2: 'customdeploy_lmry_purchasing_pop_br_mr',
                deploy3: 'customdeploy_lmry_fillrcpt_pop_br_mr',
                idCountry: 30
            },
            CL: {
                feature: 342,
                id: 'custscript_lmry_cl_ei_email_employee',
                campo: 'LATAM - CL EI EMAIL EMPLOYEE',
                deploy: 'customdeploy_lmry_invoicing_pop_ch_mr',
                deploy2: 'customdeploy_lmry_purchasing_pop_ch_mr',
                deploy3: 'customdeploy_lmry_fillrcpt_pop_ch_mr',
                idCountry: 45
            },
            CO: {
                feature: 343,
                id: 'custscript_lmry_co_email_emp_e',
                campo: 'LATAM - CO EMAIL EMPLOYEE E-INVOICE',
                deploy: 'customdeploy_lmry_invoicing_pop_co_mr',
                idCountry: 48
            },
            CR: {
                feature: 523,
                id: 'custscript_lmry_cr_email_emp_einvoice',
                campo: 'LATAM - CR EMAIL EMPLOYEE E-INVOICE',
                deploy: 'customdeploy_lmry_invoicing_pop_cr_mr',
                idCountry: 49
            },
            DO: {
                feature: 860,
                id: '',
                campo: '',
                deploy: 'customdeploy_lmry_invoicing_pop_do_mr',
                idCountry: 61
            },
            EC: {
                feature: 601,
                id: 'custscript_lmry_ec_ei_email_employee',
                campo: 'LATAM - EC EI EMAIL EMPLOYEE',
                deploy: 'customdeploy_lmry_invoicing_pop_ec_mr',
                idCountry: 63
            },
            GT: {
                feature: 706,
                id: 'custscript_lmry_gt_email_emp_einvoice',
                campo: 'LATAM - GT EMAIL EMPLOYEE',
                deploy: 'customdeploy_lmry_invoicing_pop_gt_mr',
                idCountry: 91
            },
            MX: {
                feature: 338,
                id: 'custscript_lmry_mx_email_emp_einvoice',
                campo: 'LATAM - MX EMAIL EMPLOYEE E-INVOICE',
                deploy: 'customdeploy_lmry_invoicing_pop_mx_mr',
                deploy3: 'customdeploy_lmry_fillrcpt_pop_mx_mr',
                idCountry: 157
            },
            PA: {
                feature: 441,
                id: 'custscript_lmry_pa_email_emp_einvoice',
                campo: 'LATAM - PA EMAIL EMPLOYEE E-INVOICE',
                deploy: 'customdeploy_lmry_invoicing_pop_pa_mr',
                idCountry: 173
            },
            PY: {
                feature: 965,
                id: '',
                campo: '',
                deploy: 'customdeploy_lmry_invoicing_pop_py_mr',
                idCountry: 186
            },
            PE: {
                feature: 344,
                id: 'custscript_lmry_pe_email_emp_einvoice',
                campo: 'LATAM - PE EMAIL EMPLEADO E-INVOICE',
                deploy: 'customdeploy_lmry_invoicing_pop_pe_mr',
                deploy2: 'customdeploy_lmry_purchasing_pop_pe_mr',
                deploy3: 'customdeploy_lmry_fillrcpt_pop_pe_mr',
                idCountry: 174
            },
            UY: {
                feature: 647,
                id: 'custscript_lmry_uy_ei_email_employee',
                campo: 'LATAM - UY EI EMAIL  EMPLOYEE',
                deploy: 'customdeploy_lmry_invoicing_pop_uy_mr',
                deploy2: 'customdeploy_lmry_purchasing_pop_uy_mr',
                idCountry: 231
            }
        };

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            var subsi_OW = runtime.isFeatureInEffect({
                feature: 'SUBSIDIARIES'
            })
            var FEATURE_DEPT = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
            var FEATURE_LOC = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
            var FEATURE_CLASS = runtime.isFeatureInEffect({ feature: "CLASSES" });
            var Language = runtime.getCurrentScript().getParameter({
                name: 'LANGUAGE'
            });
            Language = Language.substring(0, 2)

            try {
                setLanguage(Language)

                var objRecord = scriptContext.currentRecord;
                var p_hidden = objRecord.getValue('custpage_hidden');
                var p_checkpaid = objRecord.getField('custpage_checkpaid');
                var v_checkpaid = objRecord.getValue('custpage_checkpaid');

                if (v_checkpaid == false) {
                    p_checkpaid.isVisible = false;
                    p_checkpaid.isDisplay = false;
                }
                if (v_checkpaid == true) {
                    p_checkpaid.isVisible = true;
                    p_checkpaid.isDisplay = true;
                }

                var v_Country = Number(objRecord.getValue('custpage_country_id'));

                if (FEATURE_DEPT == true || FEATURE_DEPT == 'T') {
                    var f_Department = objRecord.getField('custpage_department');
                    f_Department.isVisible = false;
                    if (v_Country == 174) {
                        f_Department.isVisible = true;
                    }
                }
                if (FEATURE_CLASS == true || FEATURE_CLASS == 'T') {
                    var f_Class = objRecord.getField('custpage_class');
                    f_Class.isVisible = false;
                    if (v_Country == 174) {
                        f_Class.isVisible = true;
                    }
                }
                if (FEATURE_LOC == true || FEATURE_LOC == 'T') {
                    var f_Location = objRecord.getField('custpage_location');
                    f_Location.isVisible = false;
                    if (v_Country == 174) {
                        f_Location.isVisible = true;
                    }
                }
                filtrarCampoAutomaticSet(scriptContext, subsi_OW);

                // P_HIDDEN ESTA LLENO EN EL SUITELET LOG
                if (p_hidden == null || p_hidden == '') {
                    if (objRecord.getValue({
                        fieldId: 'custpage_date'
                    }) == null || objRecord.getValue({
                        fieldId: 'custpage_date'
                    }) == '') {
                        var newDate = new Date();
                        objRecord.setValue({
                            fieldId: 'custpage_date',
                            value: newDate
                        });
                        objRecord.setValue({
                            fieldId: 'custpage_date_2',
                            value: newDate
                        });

                        var searchTransaction = search.create({
                            type: 'customrecord_lmry_invoicing_populate_tra',
                            filters: [{
                                name: 'isinactive',
                                operator: 'is',
                                values: 'F'
                            }],
                            columns: ['custrecord_lmry_invoicing_country', 'custrecord_lmry_invoicing_transaction', {
                                name: 'custrecord_lmry_trantype_description',
                                join: 'custrecord_lmry_invoicing_transaction'
                            }, {
                                    name: 'custrecord_lmry_trantype_api',
                                    join: 'custrecord_lmry_invoicing_transaction'
                                }]
                        });
                        var resultTransaction = searchTransaction.run().getRange({
                            start: 0,
                            end: 1000
                        });

                        if (resultTransaction != null && resultTransaction.length > 0) {
                            var columnsTransaction = resultTransaction[0].columns;
                            for (var i = 0; i < resultTransaction.length; i++) {
                                var countryTransaction = resultTransaction[i].getValue(columnsTransaction[0]);
                                var nameTransaction = resultTransaction[i].getText(columnsTransaction[2]);
                                var apiTransaction = resultTransaction[i].getValue(columnsTransaction[3]);

                                if (jsonTransaction[countryTransaction] == null || jsonTransaction[countryTransaction] == undefined) {
                                    jsonTransaction[countryTransaction] = [];
                                }

                                jsonTransaction[countryTransaction].push({
                                    name: nameTransaction,
                                    api: apiTransaction
                                });
                            }
                        }

                        if (!subsi_OW) {
                            filtrarTransaction(scriptContext, subsi_OW);
                        }
                    }
                }
            } catch (error) {
                // alert('Page Init: ' + error);
                library.sendemail(' [pageInit] ' + error, LMRY_script);
            }
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            try {
                if (scriptContext.sublistId == 'custpage_sublista' && scriptContext.fieldId == 'id_apply' && flag == true) {
                    var objRecord = scriptContext.currentRecord;

                    var cantidadSeleccionadas = objRecord.getValue('custpage_seleccionadas');
                    var selc_app = objRecord.getCurrentSublistValue({
                        sublistId: 'custpage_sublista',
                        fieldId: 'id_apply'
                    });

                    selc_app ? objRecord.setValue('custpage_seleccionadas', cantidadSeleccionadas + 1) : objRecord.setValue('custpage_seleccionadas', cantidadSeleccionadas - 1);
                }
            } catch (error) {
                // alert(error);
                library.sendemail(' [fieldChanged] ' + error, LMRY_script);
            }
        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {
            var Language = runtime.getCurrentScript().getParameter({
                name: 'LANGUAGE'
            });
            Language = Language.substring(0, 2)
            var subsi_OW = runtime.isFeatureInEffect({
                feature: 'SUBSIDIARIES'
            })
            try {
                var objRecord = scriptContext.currentRecord;
                if (scriptContext.fieldId == 'custpage_subsi') {
                    setearCountry(scriptContext);
                    filtrarTransaction(scriptContext, subsi_OW);
                    filtrarSegmentaciones(scriptContext);
                    filtrarCampoAutomaticSet(scriptContext, subsi_OW);
                }

                if (scriptContext.fieldId == 'custpage_quantity' || scriptContext.fieldId == 'custpage_select') {
                    quantityTransactions(scriptContext, scriptContext.fieldId, Language);
                }

                if (scriptContext.fieldId == 'custpage_transaction') {
                    mostrarCheckPaidInvoices(scriptContext);
                }
            } catch (error) {
                library.sendemail(' [validateField] ' + error, LMRY_script);
            }
            return true;
        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {

        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {

        }

        function setearCountry(scriptContext) {
            var objRecord = scriptContext.currentRecord;
            var subsidiary = objRecord.getValue({
                fieldId: 'custpage_subsi'
            });

            var country = objRecord.getValue({
                fieldId: 'custpage_country'
            });

            if (subsidiary == null || subsidiary == '' || subsidiary == 0) {
                objRecord.setValue({
                    fieldId: 'custpage_country',
                    value: ' '
                });
                objRecord.setValue({
                    fieldId: "custpage_country_id",
                    value: ""
                });

                return false;
            }

            var result = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: subsidiary,
                columns: ['country']
            });
            country = result.country[0].text;

            var countryCode = result.country[0].value;

            objRecord.setValue({
                fieldId: 'custpage_country',
                value: country
            });

            objRecord.setValue({
                fieldId: "custpage_country_id",
                value: jsonCountry[countryCode].idCountry || ""
            });
        }

        function filtrarTransaction(scriptContext, subsi_OW) {
            var objRecord = scriptContext.currentRecord;
            var transaction = objRecord.getField('custpage_transaction');
            var f_checkpaid = objRecord.getField('custpage_checkpaid');
            var country = objRecord.getValue({
                fieldId: 'custpage_country'
            });

            var countryId = objRecord.getValue({
                fieldId: "custpage_country_id"
            })

            transaction.removeSelectOption({
                value: null
            });
            transaction.insertSelectOption({
                value: 0,
                text: ' '
            });

            f_checkpaid.isVisible = false;
            f_checkpaid.isDisplay = false;
            objRecord.setValue({
                fieldId: 'custpage_checkpaid',
                value: false
            });

            if (subsi_OW) {
                var subsidiary = objRecord.getValue({
                    fieldId: 'custpage_subsi'
                });
                if (subsidiary == null || subsidiary == '' || subsidiary == 0) {
                    return true;
                }
            }

            for (var i = 0; i < jsonTransaction[countryId].length; i++) {
                transaction.insertSelectOption({
                    value: jsonTransaction[countryId][i].api + ';' + jsonTransaction[countryId][i].name,
                    text: jsonTransaction[countryId][i].name
                });
            }
        }

        function validarAcentos(s) {
            var AccChars = 'ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ&°–—ªº·';
            var RegChars = 'SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyyo--ao.';

            s = s.toString();
            for (var c = 0; c < s.length; c++) {
                for (var special = 0; special < AccChars.length; special++) {
                    if (s.charAt(c) == AccChars.charAt(special)) {
                        s = s.substring(0, c) + RegChars.charAt(special) + s.substring(c + 1, s.length);
                    }
                }
            }
            return s;
        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {
            var subsi_OW = runtime.isFeatureInEffect({
                feature: 'SUBSIDIARIES'
            })
            var Language = runtime.getCurrentScript().getParameter({
                name: 'LANGUAGE'
            });
            Language = Language.substring(0, 2)
            try {
                var objRecord = scriptContext.currentRecord;
                var state = objRecord.getValue({
                    fieldId: 'custpage_state'
                });
                var state_2 = '';

                var subsidiary = 1;
                if (subsi_OW) {
                    subsidiary = objRecord.getValue({
                        fieldId: 'custpage_subsi'
                    });
                }
                var date = objRecord.getValue({
                    fieldId: 'custpage_date'
                });
                var date_2 = objRecord.getValue({
                    fieldId: 'custpage_date_2'
                });
                var sv_transaction = objRecord.getValue({
                    fieldId: 'custpage_transaction'
                });
                sv_transaction = sv_transaction.split(';')[0];
                var v_Country = Number(objRecord.getValue('custpage_country_id'));
                if (state == null || state == '') {
                    if (subsi_OW) {
                        if (subsidiary == null || subsidiary == '' || subsidiary == 0) {
                            alert(jsonLanguage.subsidiary[Language]);
                            return false;
                        }
                    }

                    if (date == null || date == '' || date == 0) {
                        alert(jsonLanguage.datefrom[Language]);
                        return false;
                    }

                    if (date_2 == null || date_2 == '' || date_2 == 0) {
                        alert(jsonLanguage.dateto[Language]);
                        return false;
                    }

                    if (sv_transaction == null || sv_transaction == '' || sv_transaction == 0) {
                        alert(jsonLanguage.transaction[Language]);
                        return false;
                    }
                } else {
                    // VALIDACION DEPLOY YA EJECUTANDOSE
                    var country3country2 = {
                        ARG: 'AR',
                        BOL: 'BO',
                        BRA: 'BR',
                        CHI: 'CL',
                        COL: 'CO',
                        COS: 'CR',
                        DOM: 'DO',
                        ECU: 'EC',
                        GUA: 'GT',
                        MEX: 'MX',
                        PAN: 'PA',
                        PAR: 'PY',
                        PER: 'PE',
                        URU: 'UY'
                    }; // G.G
                    var siglasCountry = objRecord.getValue({
                        fieldId: 'custpage_country'
                    });

                    var countryId = objRecord.getValue({
                        fieldId: "custpage_country_id"
                    })

                    //Dominican Republic
                    if (countryId == 61) {
                        siglasCountry = "Dominican Republic";
                    }

                    var licenses = libraryFeature.getLicenses(subsidiary);

                    siglasCountry = siglasCountry.substring(0, 3).toUpperCase();
                    siglasCountry = validarAcentos(siglasCountry);
                    siglasCountry = country3country2[siglasCountry];

                    var searchDeploys = null;

                    if (sv_transaction == 'vendorbill' || sv_transaction == 'vendorcredit' || sv_transaction == 'vendorpayment') {
                        searchDeploys = search.create({
                            type: 'scheduledscriptinstance',
                            filters: [
                                ['scriptdeployment.scriptid', 'is', jsonCountry[siglasCountry].deploy2], 'AND', ['status', 'anyof', 'PENDING', 'PROCESSING']
                            ]
                        });
                    } else if (sv_transaction == 'itemfulfillment' || sv_transaction == 'itemreceipt') {
                        searchDeploys = search.create({
                            type: 'scheduledscriptinstance',
                            filters: [
                                ['scriptdeployment.scriptid', 'is', jsonCountry[siglasCountry].deploy3], 'AND', ['status', 'anyof', 'PENDING', 'PROCESSING']
                            ]
                        });
                    } else {
                        searchDeploys = search.create({
                            type: 'scheduledscriptinstance',
                            filters: [
                                ['scriptdeployment.scriptid', 'is', jsonCountry[siglasCountry].deploy], 'AND', ['status', 'anyof', 'PENDING', 'PROCESSING']
                            ]
                        });
                    }

                    var resultDeploys = searchDeploys.run().getRange({
                        start: 0,
                        end: 1
                    });

                    /*
                       Fecha: 09-06-2022
                       Requerimiento C0545 - D0243: Advanced Flow Multi Subsidiaria
                    */

                    // Argentina
                    if (siglasCountry == 'AR') {
                        if (sv_transaction == 'itemfulfillment') {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(899, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_fillrcpt_pop_ar_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        }
                        else {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(899, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_ar_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        }
                    }
                    // Bolivia
                    else if (siglasCountry == 'BO') {
                        // Multisubsidiaries - Features
                        if (libraryFeature.getAuthorization(900, licenses)) {
                            var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_bo_' + subsidiary;

                            var searchDeploys2 = search.create({
                                type: 'scheduledscriptinstance',
                                filters: [
                                    ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                    'AND',
                                    ['status', 'anyof', 'PENDING', 'PROCESSING']
                                ]
                            });
                            var resultDeploys2 = searchDeploys2.run().getRange({
                                start: 0,
                                end: 1
                            });

                            if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                alert(jsonLanguage.deploySubsidiary[Language]);
                                return false;
                            }
                        }
                        // 1 Subsidiary
                        else if (resultDeploys != null && resultDeploys.length > 0) {
                            alert(jsonLanguage.deploy[Language]);
                            return false;
                        }
                    }
                    // Brazil
                    if (siglasCountry == 'BR') {
                        // Compras
                        if (sv_transaction == 'vendorbill' || sv_transaction == 'vendorcredit') {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(878, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_purchasing_pop_br_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        } else if (sv_transaction == 'itemfulfillment' || sv_transaction == 'itemreceipt') {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(878, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_fillrcpt_pop_br_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        }
                        // Ventas
                        else {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(878, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_br_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        }
                    }
                    // Chile
                    else if (siglasCountry == 'CL') {
                        // Compras
                        if (sv_transaction == 'vendorbill' || sv_transaction == 'vendorcredit') {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(901, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_purchasing_pop_ch_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        }
                        else if (sv_transaction == 'itemfulfillment') {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(901, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_fillrcpt_pop_ch_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        }
                        // Ventas
                        else {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(901, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_ch_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        }
                    }
                    // Colombia
                    else if (siglasCountry == 'CO') {
                        // Multisubsidiaries - Features
                        if (libraryFeature.getAuthorization(902, licenses)) {
                            var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_co_' + subsidiary;

                            var searchDeploys2 = search.create({
                                type: 'scheduledscriptinstance',
                                filters: [
                                    ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                    'AND',
                                    ['status', 'anyof', 'PENDING', 'PROCESSING']
                                ]
                            });
                            var resultDeploys2 = searchDeploys2.run().getRange({
                                start: 0,
                                end: 1
                            });

                            if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                alert(jsonLanguage.deploySubsidiary[Language]);
                                return false;
                            }
                        }
                        // 1 Subsidiary
                        else if (resultDeploys != null && resultDeploys.length > 0) {
                            alert(jsonLanguage.deploy[Language]);
                            return false;
                        }
                    }
                    // Costa Rica
                    else if (siglasCountry == 'CR') {
                        // Multisubsidiaries - Features
                        if (libraryFeature.getAuthorization(903, licenses)) {
                            var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_cr_' + subsidiary;

                            var searchDeploys2 = search.create({
                                type: 'scheduledscriptinstance',
                                filters: [
                                    ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                    'AND',
                                    ['status', 'anyof', 'PENDING', 'PROCESSING']
                                ]
                            });
                            var resultDeploys2 = searchDeploys2.run().getRange({
                                start: 0,
                                end: 1
                            });

                            if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                alert(jsonLanguage.deploySubsidiary[Language]);
                                return false;
                            }
                        }
                        // 1 Subsidiary
                        else if (resultDeploys != null && resultDeploys.length > 0) {
                            alert(jsonLanguage.deploy[Language]);
                            return false;
                        }
                    }
                    // Dominican Republic
                    else if (siglasCountry == 'DO') {
                        // Multisubsidiaries - Features
                        if (libraryFeature.getAuthorization(912, licenses)) {
                            var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_do_' + subsidiary;

                            var searchDeploys2 = search.create({
                                type: 'scheduledscriptinstance',
                                filters: [
                                    ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                    'AND',
                                    ['status', 'anyof', 'PENDING', 'PROCESSING']
                                ]
                            });
                            var resultDeploys2 = searchDeploys2.run().getRange({
                                start: 0,
                                end: 1
                            });

                            if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                alert(jsonLanguage.deploySubsidiary[Language]);
                                return false;
                            }
                        }
                        // 1 Subsidiary
                        else if (resultDeploys != null && resultDeploys.length > 0) {
                            alert(jsonLanguage.deploy[Language]);
                            return false;
                        }
                    }
                    // Ecuador
                    else if (siglasCountry == 'EC') {
                        // Multisubsidiaries - Features
                        if (libraryFeature.getAuthorization(904, licenses)) {
                            var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_ec_' + subsidiary;

                            var searchDeploys2 = search.create({
                                type: 'scheduledscriptinstance',
                                filters: [
                                    ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                    'AND',
                                    ['status', 'anyof', 'PENDING', 'PROCESSING']
                                ]
                            });
                            var resultDeploys2 = searchDeploys2.run().getRange({
                                start: 0,
                                end: 1
                            });

                            if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                alert(jsonLanguage.deploySubsidiary[Language]);
                                return false;
                            }
                        }
                        // 1 Subsidiary
                        else if (resultDeploys != null && resultDeploys.length > 0) {
                            alert(jsonLanguage.deploy[Language]);
                            return false;
                        }
                    }
                    // Guatemala
                    else if (siglasCountry == 'GT') {
                        // Multisubsidiaries - Features
                        if (libraryFeature.getAuthorization(906, licenses)) {
                            var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_gt_' + subsidiary;

                            var searchDeploys2 = search.create({
                                type: 'scheduledscriptinstance',
                                filters: [
                                    ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                    'AND',
                                    ['status', 'anyof', 'PENDING', 'PROCESSING']
                                ]
                            });
                            var resultDeploys2 = searchDeploys2.run().getRange({
                                start: 0,
                                end: 1
                            });

                            if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                alert(jsonLanguage.deploySubsidiary[Language]);
                                return false;
                            }
                        }
                        // 1 Subsidiary
                        else if (resultDeploys != null && resultDeploys.length > 0) {
                            alert(jsonLanguage.deploy[Language]);
                            return false;
                        }
                    }
                    // Mexico
                    else if (siglasCountry == 'MX') {
                        if (sv_transaction == 'itemfulfillment') {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(907, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_fillrcpt_pop_mx_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        }
                        // Ventas
                        else {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(907, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_mx_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        }
                    }
                    // Panama
                    else if (siglasCountry == 'PA') {
                        // Multisubsidiaries - Features
                        if (libraryFeature.getAuthorization(909, licenses)) {
                            var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_pa_' + subsidiary;

                            var searchDeploys2 = search.create({
                                type: 'scheduledscriptinstance',
                                filters: [
                                    ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                    'AND',
                                    ['status', 'anyof', 'PENDING', 'PROCESSING']
                                ]
                            });
                            var resultDeploys2 = searchDeploys2.run().getRange({
                                start: 0,
                                end: 1
                            });

                            if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                alert(jsonLanguage.deploySubsidiary[Language]);
                                return false;
                            }
                        }
                        // 1 Subsidiary
                        else if (resultDeploys != null && resultDeploys.length > 0) {
                            alert(jsonLanguage.deploy[Language]);
                            return false;
                        }
                    }
                    // Paraguay
                    else if (siglasCountry == 'PY') {
                        // Multisubsidiaries - Features
                        if (libraryFeature.getAuthorization(910, licenses)) {
                            var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_py_' + subsidiary;

                            var searchDeploys2 = search.create({
                                type: 'scheduledscriptinstance',
                                filters: [
                                    ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                    'AND',
                                    ['status', 'anyof', 'PENDING', 'PROCESSING']
                                ]
                            });
                            var resultDeploys2 = searchDeploys2.run().getRange({
                                start: 0,
                                end: 1
                            });

                            if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                alert(jsonLanguage.deploySubsidiary[Language]);
                                return false;
                            }
                        }
                        // 1 Subsidiary
                        else if (resultDeploys != null && resultDeploys.length > 0) {
                            alert(jsonLanguage.deploy[Language]);
                            return false;
                        }
                    }
                    // Peru
                    else if (siglasCountry == 'PE') {
                        if (sv_transaction == 'itemfulfillment' || sv_transaction == 'itemreceipt') {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(911, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_fillrcpt_pop_pe_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        } else if (sv_transaction == 'vendorpayment') {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(911, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_purchasing_pe_' + subsidiary;
                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        } else {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(911, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_pe_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        }
                    }
                    // Uruguay
                    else if (siglasCountry == 'UY') {
                        // Multisubsidiaries - Features
                        if (sv_transaction == 'vendorbill' || sv_transaction == 'vendorcredit') {
                            // Multisubsidiaries - Features
                            if (libraryFeature.getAuthorization(913, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_purchasing_uy_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        }
                        else {
                            if (libraryFeature.getAuthorization(913, licenses)) {
                                var deploySubsidiary = 'customdeploy_lmry_invoicing_pop_uy_' + subsidiary;

                                var searchDeploys2 = search.create({
                                    type: 'scheduledscriptinstance',
                                    filters: [
                                        ['scriptdeployment.scriptid', 'is', deploySubsidiary],
                                        'AND',
                                        ['status', 'anyof', 'PENDING', 'PROCESSING']
                                    ]
                                });
                                var resultDeploys2 = searchDeploys2.run().getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (resultDeploys2 != null && resultDeploys2.length > 0) {
                                    alert(jsonLanguage.deploySubsidiary[Language]);
                                    return false;
                                }
                            }
                            // 1 Subsidiary
                            else if (resultDeploys != null && resultDeploys.length > 0) {
                                alert(jsonLanguage.deploy[Language]);
                                return false;
                            }
                        }
                    }

                    // CREACION RECORD INVOICING POPULATE
                    //Processes
                    var processObj = {
                        'automatic_set': true,
                        'e_invoicing': true
                    };
                    //Only Automatic Set
                    var checkAutomaticSet = objRecord.getValue({ fieldId: "custpage_automatic_set" });
                    if (checkAutomaticSet == true || checkAutomaticSet == "T") processObj['e_invoicing'] = false;
                    //AGIP
                    if (siglasCountry == "AR" && libraryFeature.getAuthorization(1029, licenses)) {
                        var checkAgip = objRecord.getValue({ fieldId: "custpage_agip" });
                        if (checkAgip == true || checkAgip == "T") processObj['agip'] = true;
                    }
                    var c_noselec = 0,
                        transactions = '';
                    var cantidad = objRecord.getLineCount({
                        sublistId: 'custpage_sublista'
                    });
                    var orden_invoice = [];
                    if (cantidad > 0) {
                        for (var i = 0; i < cantidad; i++) {
                            var check = objRecord.getSublistValue({
                                sublistId: 'custpage_sublista',
                                fieldId: 'id_apply',
                                line: i
                            });
                            var id_invoice = objRecord.getSublistValue({
                                sublistId: 'custpage_sublista',
                                fieldId: 'id_int',
                                line: i
                            });
                            if (check == true) {
                                state_2 = state_2 + id_invoice + '|';
                                orden_invoice.push(id_invoice);
                            } else {
                                c_noselec++;
                            }
                        }

                        orden_invoice.sort(function (a, b) {
                            return a - b;
                        });

                        for (var i = 0; i < orden_invoice.length; i++) {
                            transactions += orden_invoice[i] + '|';
                        }

                        if (cantidad == c_noselec) {
                            alert(jsonLanguage.select[Language]);
                            return false;
                        }

                        var ip = record.create({
                            type: 'customrecord_lmry_invoicing_populate',
                            isDynamic: true
                        });
                        if (subsi_OW) {
                            ip.setValue({
                                fieldId: 'custrecord_lmry_ip_subsidiary',
                                value: subsidiary
                            });
                        }

                        ip.setValue({
                            fieldId: 'custrecord_lmry_ip_country',
                            value: jsonCountry[siglasCountry].idCountry
                        });
                        ip.setValue({
                            fieldId: 'custrecord_lmry_ip_date',
                            value: date
                        });
                        ip.setValue({
                            fieldId: 'custrecord_lmry_ip_transactions',
                            value: transactions
                        });
                        ip.setValue({
                            fieldId: 'custrecord_lmry_ip_process',
                            value: JSON.stringify(processObj)
                        });
                        ip.setValue({
                            fieldId: 'custrecord_lmry_ip_date_to',
                            value: date_2
                        });
                        var id_state = ip.save({
                            disableTriggers: true,
                            ignoreMandatoryFields: true
                        });

                        objRecord.setValue({
                            fieldId: 'custpage_state',
                            value: id_state
                        });
                    } else {
                        alert(jsonLanguage.nothing[Language]);
                        return false;
                    }
                }

                return true;
            } catch (error) {
                alert(jsonLanguage.error[Language]);
                console.error(error)
                library.sendemail('[saveRecord]' + error, LMRY_script);
                return false;
            }
        }

        function markAll(cantidad, Language) {
            try {
                flag = false;

                var objRecord = currentRecord.get();
                var totalTransacciones = objRecord.getLineCount({
                    sublistId: 'custpage_sublista'
                });

                for (var i = 0; i < cantidad; i++) {
                    if (i < totalTransacciones) {
                        objRecord.selectLine({
                            sublistId: 'custpage_sublista',
                            line: i
                        });
                        var check = objRecord.setCurrentSublistValue({
                            sublistId: 'custpage_sublista',
                            fieldId: 'id_apply',
                            value: true
                        });
                    }
                }

                if (cantidad > totalTransacciones) {
                    objRecord.setValue('custpage_seleccionadas', totalTransacciones);
                    if (totalTransacciones == 0) {
                        alert(jsonLanguage.notransactions[Language]);
                    } else {
                        alert(jsonLanguage.thereare[Language] + totalTransacciones + jsonLanguage.transactions[Language]);
                    }
                } else {
                    objRecord.setValue('custpage_seleccionadas', cantidad);
                }

                flag = true;
            } catch (error) {
                library.sendemail('[MarkAll]' + error, LMRY_script);
            }
        }

        function desmarkAll() {
            try {
                flag = false;

                var objRecord = currentRecord.get();
                var cantidad = objRecord.getLineCount({
                    sublistId: 'custpage_sublista'
                });

                for (var i = 0; i < cantidad; i++) {
                    objRecord.selectLine({
                        sublistId: 'custpage_sublista',
                        line: i
                    });
                    var check = objRecord.setCurrentSublistValue({
                        sublistId: 'custpage_sublista',
                        fieldId: 'id_apply',
                        value: false
                    });
                }

                objRecord.setValue('custpage_seleccionadas', 0);

                flag = true;
            } catch (error) {
                library.sendemail('[desmarkAll]' + error, LMRY_script);
            }
        }

        function funcionCancel() {
            try {
                /* var output = url.resolveScript({
                    scriptId: 'customscript_lmry_invoicing_populat_stlt',
                    deploymentId: 'customdeploy_lmry_invoicing_populat_stl',
                    returnExternalUrl: true
                }); */

                var output = nlapiResolveURL('suitelet', 'customscript_lmry_invoicing_populat_stlt', 'customdeploy_lmry_invoicing_populat_stl', true);

                output = output.replace('forms', 'system'),
                    output = output.replace('extsystem', 'app');

                window.location.href = output;
            } catch (error) {
                library.sendemail('[funcionCancel]' + error, LMRY_script);
            }
        }

        function quantityTransactions(scriptContext, option, Language) {
            var objRecord = scriptContext.currentRecord;
            var quantity = objRecord.getValue(option);

            if (parseInt(quantity) >= 1) {
                desmarkAll();
                markAll(quantity, Language);

                objRecord.setValue({
                    fieldId: option,
                    value: ''
                });
            } else if (parseInt(quantity) == 0) {
                desmarkAll();
                objRecord.setValue({
                    fieldId: option,
                    value: ''
                });
            } else if (parseInt(quantity) < 0) {
                objRecord.setValue({
                    fieldId: option,
                    value: ''
                });
            }
        }

        function setLanguage(Language) {
            if (Language != 'es' && Language != 'pt') {
                Language = 'en';
            }
        }

        function mostrarCheckPaidInvoices(scriptContext) {
            var objRecord = scriptContext.currentRecord;
            var v_transaction = objRecord.getValue({
                fieldId: 'custpage_transaction'
            });
            v_transaction = v_transaction.split(';')[0];
            var f_checkpaid = objRecord.getField('custpage_checkpaid');
            objRecord.setValue({
                fieldId: 'custpage_checkpaid',
                value: false
            });

            if (v_transaction == 'invoice') {
                f_checkpaid.isVisible = true;
                f_checkpaid.isDisplay = true;
            } else {
                f_checkpaid.isVisible = false;
                f_checkpaid.isDisplay = false;
            }
        }

        function filtrarSegmentaciones(scriptContext) {
            try {
                var subsi_OW = runtime.isFeatureInEffect({
                    feature: 'SUBSIDIARIES'
                })
                var objRecord = scriptContext.currentRecord;
                var countryId = Number(objRecord.getValue({ fieldId: "custpage_country_id" }));

                var subsiId = objRecord.getValue({ fieldId: "custpage_subsi" });
                var segments = {
                    '1': {
                        field: 'custpage_department',
                        type: 'department',
                        feature: runtime.isFeatureInEffect({ feature: "DEPARTMENTS" })
                    },
                    '2': {
                        field: 'custpage_class',
                        type: 'classification',
                        feature: runtime.isFeatureInEffect({ feature: "CLASSES" })
                    },
                    '3': {
                        field: 'custpage_location',
                        type: 'location',
                        feature: runtime.isFeatureInEffect({ feature: "LOCATIONS" })
                    }
                };
                for (var segment in segments) {
                    var featSegmentation = segments[segment].feature;
                    if (featSegmentation == true || featSegmentation == 'T') {
                        var field = objRecord.getField(segments[segment].field);
                        field.removeSelectOption({
                            value: null
                        });
                        field.insertSelectOption({
                            value: 0,
                            text: ' '
                        });
                        if (countryId != 174) {
                            field.isVisible = false;
                            continue;
                        };
                        field.isVisible = true;
                        var searchContext = search.create({
                            type: segments[segment].type,
                            filters: [
                                ['isinactive', 'is', 'F']
                            ],
                            columns: [
                                'internalid',
                                'name'
                            ],
                        });
                        if (subsi_OW && subsiId) {
                            searchContext.filters.push(search.createFilter({
                                name: 'subsidiary', operator: 'is', values: subsiId
                            }))
                        }
                        var myPagedData = searchContext.runPaged({
                            pageSize: 1000
                        });
                        myPagedData.pageRanges.forEach(function (pageRange) {
                            var myPage = myPagedData.fetch({
                                index: pageRange.index
                            });
                            myPage.data.forEach(function (result) {
                                var id = result.getValue('internalid');
                                var name = result.getValue('name');
                                field.insertSelectOption({
                                    value: id,
                                    text: name
                                });
                                return true;
                            });
                        });

                    }
                }
            } catch (error) {
                console.log('error segmentaciones', error);
            }
        }

        function filtrarCampoAutomaticSet(scriptContext, subsi_OW) {
            try {
                var objRecord = scriptContext.currentRecord;
                var checkAutomaticSet = objRecord.getField("custpage_automatic_set");
                var subsidiary = 1;
                if (subsi_OW == true || subsi_OW == "T") {
                    subsidiary = objRecord.getValue("custpage_subsi");
                }
                if (Number(subsidiary)) {
                    var filters = [["isinactive", "is", "F"]];
                    if (subsi_OW == true || subsi_OW =="T") filters.push("AND", ['custrecord_lmry_setuptax_subsidiary', 'is', subsidiary])
                    var setuptaxSearch = search.create({
                        type: 'customrecord_lmry_setup_tax_subsidiary',
                        filters: filters,
                        columns: ['custrecord_lmry_setuptax_auto_set_create']
                    }).run().getRange(0, 1);
                    var onlyAutomaticSetCreate = setuptaxSearch[0].getValue('custrecord_lmry_setuptax_auto_set_create');
                    if (onlyAutomaticSetCreate == true || onlyAutomaticSetCreate == "T") {
                        if (checkAutomaticSet) checkAutomaticSet.isDisplay = true;
                    } else {
                        if (checkAutomaticSet) {
                            checkAutomaticSet.isDisplay = false;
                            objRecord.setValue("custpage_automatic_set", false);
                        }
                    }
                } else {
                    if (checkAutomaticSet) {
                        checkAutomaticSet.isDisplay = false;
                        objRecord.setValue("custpage_automatic_set", false);
                    }
                }
            } catch (error) {
                console.log("error filtrarCampoAutomaticSet", error);
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            /* postSourcing: postSourcing,
            sublistChanged: sublistChanged,
            lineInit: lineInit, */
            validateField: validateField,
            markAll: markAll,
            desmarkAll: desmarkAll,
            funcionCancel: funcionCancel,
            setearCountry: setearCountry,
            /* validateLine: validateLine,
            validateInsert: validateInsert,
            validateDelete: validateDelete, */
            saveRecord: saveRecord
        };
    });