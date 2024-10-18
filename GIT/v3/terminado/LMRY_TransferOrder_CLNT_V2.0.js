/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Transaction Transfer Order                 ||
||                                                              ||
||  File Name: LMRY_TransferOrder_CLNT_V2.0.js                  ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 20 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/runtime', 'N/search', 'N/record', 'N/url', 'N/https', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', './Latam_Library/LMRY_BR_ValidateDuplicate_LBRY_V2.0'],
    function (runtime, search, record, url, https, libraryMail, LbryBRDuplicate) {

        // Nombre del Script
        var LMRY_script = "LMRY Transfer Order CLNT 2.0";
        var subsi_OW = runtime.isFeatureInEffect({
            feature: "SUBSIDIARIES"
        });
        var LMRY_access = false;
        var LMRY_countr = '';
        var recordObj = '';
        var allLicenses = {};
        var licenses = [];

        var Language = '';

        function pageInit(scriptContext) {
            try {

                Language = runtime.getCurrentScript().getParameter({
                    name: 'LANGUAGE'
                });
                Language = Language.substring(0, 2);

                var type = scriptContext.mode;
                recordObj = scriptContext.currentRecord;

                allLicenses = libraryMail.getAllLicenses();
                var subsidiary = recordObj.getValue('subsidiary');
                if (allLicenses[subsidiary] != null && allLicenses[subsidiary] != '') {
                    licenses = allLicenses[subsidiary];
                } else {
                    licenses = [];
                }

                // Valida el Acceso
                if (subsi_OW == true || subsi_OW == 'T') {
                    ValidateAccessTO(recordObj.getValue({ fieldId: 'subsidiary' }));
                } else {
                    ValidateAccessTO(1);
                }
                if (Number(subsidiary)) {
                    LMRY_countr = libraryMail.Validate_Country(subsidiary);
                }
                if (LMRY_countr[0] == 'MX') {
                    recordObj.getField({
                        fieldId: 'custpage_mx_nro_pedimento'
                    }).isDisplay = true;
                    recordObj.getField({
                        fieldId: 'custpage_mx_pedimento_aduana'
                    }).isDisplay = true;
                    recordObj.getField({
                        fieldId: 'custpage_mx_pedimento_au_fifo'
                    }).isDisplay = true;
                } else {
                    recordObj.getField({
                        fieldId: 'custpage_mx_nro_pedimento'
                    }).isDisplay = false;
                    recordObj.getField({
                        fieldId: 'custpage_mx_pedimento_aduana'
                    }).isDisplay = false;
                    recordObj.getField({
                        fieldId: 'custpage_mx_pedimento_au_fifo'
                    }).isDisplay = false;
                }

            } catch (error) {
                libraryMail.sendemail(' [ pageInit ] ' + error, LMRY_script);
            }

            return true;
        }

        function saveRecord(scriptContext) {
            try {
                recordObj = scriptContext.currentRecord;

                // Valida tranid repetido
                if (LMRY_countr[0] == 'BR' && !LbryBRDuplicate.validateDuplicate(recordObj, licenses)) {
                    var tranID = recordObj.getField('tranid');
                    switch (Language) {
                        case 'es':
                            alert('El campo "' + tranID.label + '" (tranid) ingresado ya existe, por favor ingresar uno diferente.');
                            break;
                        case 'pt':
                            alert('O campo "' + tranID.label + '" (tranid) inserido já existe, digite um diferente.');
                            break;
                        default:
                            alert('The field "' + tranID.label + '" (tranid) entered already exists, please enter a different one.');
                            break;
                    }
                    return false;
                }

                // Serie de impresion BR
                if (LMRY_countr[0] == 'BR' && libraryMail.getAuthorization(669, licenses)) {

                    var Auxserie = recordObj.getValue('custbody_lmry_serie_doc_cxc');
                    var Auxnumer = recordObj.getValue('custbody_lmry_num_preimpreso');

                    if (Auxserie != null && Auxserie != '' && Auxnumer != null && Auxnumer != '') {

                        var nroConse = search.lookupFields({
                            type: 'customrecord_lmry_serie_impresion_cxc',
                            id: Auxserie,
                            columns: ['custrecord_lmry_serie_numero_impres', 'custrecord_ei_preprinted_series']
                        });

                        var actualNro = nroConse.custrecord_lmry_serie_numero_impres;
                        var isEISeries = nroConse.custrecord_ei_preprinted_series;

                        if (isEISeries == false || isEISeries == 'F') {
                            if (Number(Auxnumer) > Number(actualNro)) {
                                record.submitFields({
                                    type: 'customrecord_lmry_serie_impresion_cxc',
                                    id: Auxserie,
                                    values: {
                                        'custrecord_lmry_serie_numero_impres': Number(Auxnumer)
                                    }
                                });
                            }
                        }

                    }

                }
            } catch (error) {
                libraryMail.sendemail(' [ saveRecord ] ' + error, LMRY_script);
            }

            return true;
        }

        function validateField(scriptContext) {
            try {
                recordObj = scriptContext.currentRecord;
                var name = scriptContext.fieldId;

                if (name == "custbody_lmry_subsidiary_country") {
                    // Valida el Acceso
                    if (subsi_OW == true || subsi_OW == "T") {
                        ValidateAccessTO(recordObj.getValue({ fieldId: "subsidiary" }));
                    } else {
                        ValidateAccessTO(1);
                    }

                }

                if (name == "subsidiary") {
                    var subsidiary = recordObj.getValue("subsidiary");
                    if (Number(subsidiary)) LMRY_countr = libraryMail.Validate_Country(subsidiary);
                    if (allLicenses[subsidiary] != null && allLicenses[subsidiary] != "") {
                        licenses = allLicenses[subsidiary];
                    } else {
                        licenses = [];
                    }
                    if (Number(subsidiary)) {
                        LMRY_countr = libraryMail.Validate_Country(subsidiary);
                    }
                    if (LMRY_countr[0] == 'MX') {
                        recordObj.getField({
                            fieldId: 'custpage_mx_nro_pedimento'
                        }).isDisplay = true;
                        recordObj.getField({
                            fieldId: 'custpage_mx_pedimento_aduana'
                        }).isDisplay = true;
                        recordObj.getField({
                            fieldId: 'custpage_mx_pedimento_au_fifo'
                        }).isDisplay = true;
                    } else {
                        recordObj.getField({
                            fieldId: 'custpage_mx_nro_pedimento'
                        }).isDisplay = false;
                        recordObj.getField({
                            fieldId: 'custpage_mx_pedimento_aduana'
                        }).isDisplay = false;
                        recordObj.getField({
                            fieldId: 'custpage_mx_pedimento_au_fifo'
                        }).isDisplay = false;
                    }
                }

                //cambio numeracion preimpreso Brasil
                if (name == "custbody_lmry_serie_doc_cxc") {
                    if (LMRY_countr[0] == 'BR' && !LbryBRDuplicate.isValidate(recordObj, licenses)) {
                        GetNumberSequenceBR(recordObj, licenses);
                    }

                }

                //
                if (name == "custbody_lmry_document_type") {
                    if (LMRY_countr[0] == 'BR' && LbryBRDuplicate.isValidate(recordObj, licenses)) {
                        var fieldPreim = recordObj.getField('custbody_lmry_num_preimpreso');
                        fieldPreim.isDisabled = true;
                        recordObj.setValue('tranid', Math.round(1e6 * Math.random()));
                    } else {
                        var fieldPreim = recordObj.getField('custbody_lmry_num_preimpreso');
                        fieldPreim.isDisabled = false;
                    }
                }


                return true;
            } catch (error) {
                libraryMail.sendemail(" [ validateField ] " + error, LMRY_script);
            }

            return true;
        }

        /* ------------------------------------------------------------------------------------------------------
            * A la variable featureId se le asigna el valore que le corresponde
            * --------------------------------------------------------------------------------------------------- */
        function ValidateAccessTO(ID) {

            try {

                /* ************************************
                 * Fecha : 2022.03.17
                 * Se agrega el Hide And View
                 ************************************ */
                libraryMail.onFieldsHide([2], recordObj, false);

                if (ID == '' || ID == null) {
                    return true;
                }

                // Inicializa variables Locales y Globales
                LMRY_access = false;
                LMRY_countr = libraryMail.Get_Country_STLT(ID);

                // Verifica que el arreglo este lleno
                if (LMRY_countr.length < 1) {
                    return true;
                }
                LMRY_access = libraryMail.getCountryOfAccess(LMRY_countr, licenses);

                /* ************************************
                 * Fecha : 2022.03.17
                 * Se agrega el Hide And View
                 ************************************ */
                if (LMRY_countr[0] == '' || LMRY_countr[0] == null) {
                    return true;
                }

                // Solo si tiene acceso
                //if (LMRY_access == true) {
                //    libraryMail.onFieldsDisplayBody(recordObj, LMRY_countr[1], 'custrecord_lmry_on_trans_order, false);
                //}

            } catch (error) {
                libraryMail.sendemail(' [ ValidateAccessJE ] ' + error, LMRY_script);
            }

            return true;
        }

        function GetNumberSequenceBR(currentRCD, licenses) {
            try {

                if (LMRY_countr[0] != 'BR' || libraryMail.getAuthorization(669, licenses) == false) {
                    return true;
                }

                // Verifica que no este vacio el numero de serie
                var lmry_DocSer = currentRCD.getValue('custbody_lmry_serie_doc_cxc');
                if (lmry_DocSer != '' && lmry_DocSer != null && lmry_DocSer != -1) {

                    // Verifica que no este vacio el numero preimpreso
                    var lmry_DocNum = currentRCD.getValue('custbody_lmry_num_preimpreso');
                    if (lmry_DocNum == '' || lmry_DocNum == null) {

                        // Trae el ultimo numero pre-impreso
                        var wtax_type = search.lookupFields({
                            type: 'customrecord_lmry_serie_impresion_cxc',
                            id: lmry_DocSer,
                            columns: ['custrecord_lmry_serie_impresion', 'custrecord_lmry_serie_numero_impres', 'custrecord_lmry_serie_rango_fin', 'custrecord_lmry_serie_num_digitos', 'custrecord_ei_preprinted_series']
                        });
                        var nroConse = Number(wtax_type.custrecord_lmry_serie_numero_impres) + 1;
                        var maxPermi = Number(wtax_type.custrecord_lmry_serie_rango_fin);
                        var digitos = Number(wtax_type.custrecord_lmry_serie_num_digitos);
                        var isEISeries = wtax_type.custrecord_ei_preprinted_series;
                        var serieImp = wtax_type.custrecord_lmry_serie_impresion;


                        //Para Brazil, si la serie es de facturacion no se genera Numero Pre impreso
                        if (LMRY_countr[0] == 'BR' && (isEISeries == true || isEISeries == 'T')) {
                            return true;
                        }

                        // Valida el numero de digitos
                        if (digitos == '' || digitos == null) {
                            digitos = 0;
                        }

                        // Crea el numero consecutivo
                        if (nroConse > maxPermi) {
                            //alert(library_translator.getAlert(3, Language, [maxPermi]));
                            var alertJson = {
                                'es': 'El ultimo numero para esta serie (LatamReady) ha sido utilizado. Verificar si existen numeros disponibles en esta serie',
                                'pt': 'O último número desta série (LatamReady) foi usado. Verifique se há números disponíveis nesta série',
                                'en': 'The last number for this series (LatamReady) has been used. Check if there are numbers available in this series',
                            };
                            var alertmsg = alertJson[Language] || alertJson['en'];

                            alertmsg = alertmsg.replace('LatamReady', maxPermi);

                            alert(alertmsg);

                            // Asigna el numero pre-impero
                            currentRCD.setValue('custbody_lmry_num_preimpreso', '');
                        } else {
                            var longNumeroConsec = Number((nroConse + '').length);
                            var llenarCeros = '';
                            for (var i = 0; i < (digitos - longNumeroConsec); i++) {
                                llenarCeros += '0';
                            }
                            nroConse = llenarCeros + nroConse;

                            // Asigna el numero pre-impero
                            currentRCD.setValue('custbody_lmry_num_preimpreso', nroConse);

                            // Llama a la funcion de seteo del Tranid
                            Set_Field_tranid(currentRCD, licenses);
                        }
                    }
                }

            } catch (err) {
                libraryMail.sendemail(' [ GetNumberSequenceBR ] ' + err, LMRY_script);
            }
        }

        function Set_Field_tranid(currentRCD, licenses) {
            // var currentRCD = scriptContext.currentRecord;
            try {

                /* *********************************************
                 * Verifica que este activo el feature SET TRANID
                 **********************************************/
                if (LMRY_countr[0] != 'BR' || libraryMail.getAuthorization(10, licenses) == false) {
                    return true;
                }
                // Subsidiaria
                var subsidiaria = currentRCD.getValue('subsidiary');
                var lmry_DocTip = currentRCD.getValue('custbody_lmry_document_type');
                var lmry_DocNum = currentRCD.getValue('custbody_lmry_num_preimpreso');
                var lmry_DocSer = currentRCD.getValue('custbody_lmry_serie_doc_cxc');
                var tranprefix = '';
                var texto = '';

                // Valida el campo subsidiary
                if (subsidiaria != '' && subsidiaria != null) {
                    // Validad contenido de campos
                    if (lmry_DocTip && lmry_DocTip != -1 && lmry_DocNum &&
                        (lmry_DocSer && lmry_DocSer != -1)) {

                        // URL Del Pais
                        var urlpais = runtime.getCurrentScript().getParameter('custscript_lmry_netsuite_location');

                        // Se optiene el Pre - Fijo de la subsidiaria
                        var url_3 = url.resolveScript({
                            scriptId: 'customscript_lmry_get_country_stlt',
                            deploymentId: 'customdeploy_lmry_get_country_stlt',
                            returnExternalUrl: false
                        }) + '&sub=' + subsidiaria + '&opt=INV&cty=' + LMRY_countr[0];

                        //corregir hard code falta url
                        var get = https.get({
                            url: 'https://' + urlpais + url_3
                        });

                        // Retorna el cuero del SuiteLet
                        var tranprefix = get.body;

                        // Iniciales del tipo de documento
                        var tipini = search.lookupFields({
                            type: 'customrecord_lmry_tipo_doc',
                            id: lmry_DocTip,
                            columns: ['custrecord_lmry_doc_initials']
                        });
                        tipini = tipini.custrecord_lmry_doc_initials;
                        if (tipini == '' || tipini == null) {
                            tipini = '';
                        }

                        // Iniciales del tipo de documento
                        var serieText = search.lookupFields({
                            type: 'customrecord_lmry_serie_impresion_cxc',
                            id: lmry_DocSer,
                            columns: ['custrecord_lmry_serie_impresion']
                        });
                        serieText = serieText.custrecord_lmry_serie_impresion;
                        if (serieText == '' || serieText == null) {
                            serieText = currentRCD.getText('custbody_lmry_serie_doc_cxc');
                        }

                        var texto = currentRCD.getValue('custbody_lmry_num_preimpreso');

                        texto = serieText + '-' + currentRCD.getValue('custbody_lmry_num_preimpreso');

                        if (tipini) {
                            texto = tipini.toUpperCase() + ' ' + texto;
                        }

                        if (tranprefix) {
                            texto = tranprefix + ' ' + texto;
                        }

                        currentRCD.setValue({
                            fieldId: 'tranid',
                            value: texto
                        });

                    } // Validad contenido de campos
                } // Valida el campo subsidiary
                return true;
            } catch (err) {
                libraryMail.sendemail(' [ Set_Field_tranid ] ' + err, LMRY_script);
            }
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            validateField: validateField
            /*fieldChanged: fieldChanged,
            postSourcing: postSourcing,
            lineInit: lineInit,
            validateDelete: validateDelete,
            validateInsert: validateInsert,
            validateLine: validateLine,
            sublistChanged: sublistChanged*/
        };
    });