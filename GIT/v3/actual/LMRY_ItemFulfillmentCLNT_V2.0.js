/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Transaction Item Fulfillment               ||
||                                                              ||
||  File Name: LMRY_ItemFulfillmentCLNT_V2.0.js                 ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 25 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/log', 'N/search', 'N/query', 'N/url', 'N/https', 'N/runtime', 'N/record', 'N/format', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', './Latam_Library/LMRY_BR_ValidateDuplicate_LBRY_V2.0', './Latam_Library/LMRY_libToolsFunctionsLBRY_V2.0', './Latam_Library/LMRY_Val_TransactionLBRY_V2.0','./Latam_Library/LMRY_AR_Unit_Price_LBRY_V2.0'],
    function (log, search, query, url, https, runtime, record, format, library_mail, LbryBRDuplicate, libTools, library_Val , libraryUnitPrice) {
        var featureSubs = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
        var LMRY_script = 'LatamReady - Item Fulfillment CLNT V2.0';
        var LMRY_access = false;
        var LMRY_countr = [];
        var recordObj = null;
        var type = '';
        var licenses = [];
        var Val_Campos = new Array();
        function pageInit(context) {
            recordObj = context.currentRecord;
            type = context.mode;
            try {
                var idSubsidiary = recordObj.getValue({
                    fieldId: 'subsidiary'
                });

                licenses = library_mail.getLicenses(idSubsidiary);
                if (type != 'print' && type != 'email') {
                    // ***********************************************
                    // 08.09.2021 - La logica se paso al script Cliente
                    // para popular el campo Latam - Subsidiary Country
                    // ***********************************************
                    if (featureSubs == true || featureSubs == 'T') {
                        var filters = new Array();
                        filters[0] = search.createFilter({
                            name: 'custrecord_lmry_setuptax_subsidiary',
                            operator: search.Operator.ANYOF,
                            values: [idSubsidiary]
                        });
                        var columns = new Array();
                        columns[0] = search.createColumn({
                            name: 'custrecord_lmry_setuptax_sub_country'
                        });
                        var getfields = search.create({
                            type: 'customrecord_lmry_setup_tax_subsidiary',
                            columns: columns,
                            filters: filters
                        });
                        getfields = getfields.run().getRange(0, 1000);

                        /* *************************************************
                         * 2022.04.07 - Se agrego el campo type != 'edit'
                         * ********************************************** */
                        if (type != 'edit' && getfields != '' && getfields != null) {
                            var ST_County = '';
                            ST_County = getfields[0].getText('custrecord_lmry_setuptax_sub_country');
                            // Latam - Subsidiary Country
                            recordObj.setText("custbody_lmry_subsidiary_country", ST_County);
                        }
                    } // 08.09.2021

                    cleanAndDisableFields();
                    ValidateAccessIFC(); //LLena las variables de LMRY_access,LMRY_countr
                    hideandViewFields();

                    // ***********************************************
                    // 08.09.2021 - Si el campo esta vacio lo habilita
                    // ***********************************************
                    var al_country = recordObj.getValue('custbody_lmry_subsidiary_country');
                    if (al_country == '' || al_country == null) {
                        recordObj.getField({
                            fieldId: 'custbody_lmry_subsidiary_country'
                        }).isDisabled = false;
                    } // 08.09.2021

                    if (LMRY_countr[0] == 'PY' && LMRY_access) {
                        var address1 = recordObj.getValue({
                            fieldId: 'shipaddress'
                        });

                        var field_des = recordObj.getField({
                            fieldId: 'custbody_lmry_guia_direccion_local_des'
                        });

                        var field_doc_ref = recordObj.getField({
                            fieldId: 'custbody_lmry_doc_ref'
                        });

                        if (field_des) {
                            recordObj.setValue({
                                fieldId: 'custbody_lmry_guia_direccion_local_des',
                                value: address1,
                                ignoreFieldChange: true
                            });
                            field_des.isDisabled = true;
                        }

                        if (field_doc_ref) {
                            field_doc_ref.isDisabled = true;
                        }
                    }

                    if (LMRY_countr[0] == 'CL' && LMRY_access) {
                        if (library_mail.getAuthorization(414, licenses)) {
                            var fieldSerie = recordObj.getField({
                                fieldId: 'custbody_lmry_serie_doc_cxc'
                            });

                            if (fieldSerie) {
                                fieldSerie.isDisplay = true;
                            }
                        }
                    }
                }

                //BR CFOP
                if (LMRY_countr[0] == 'BR' && LMRY_access && (context.mode == 'create' || context.mode == 'copy' || context.mode == 'edit')) {

                    var createdFrom = recordObj.getValue('createdfrom');
                    var transactionType = recordObj.getValue('custbody_lmry_br_transaction_type');

                    if (!transactionType || context.mode == 'copy') {
                        var typeStandard = recordObj.getValue('type');
                        if (typeStandard) {
                            var searchTransactionType = search.create({ type: 'customrecord_lmry_trantype', filters: [{ name: 'name', operator: 'is', values: typeStandard }] });
                            searchTransactionType = searchTransactionType.run().getRange({ start: 0, end: 1 });

                            if (searchTransactionType && searchTransactionType.length) {
                                recordObj.setValue('custbody_lmry_br_transaction_type', searchTransactionType[0].id);
                            }

                        }
                    }

                }//FIN BR CFOP

                /***************************************************************************** 
                   Fill in location fields in the Item Fulfillment.
                   Countries: Peru
                   Feature: A/R UBICATION (ITEM FULLFILLMENT)
                   13/12/21
                ******************************************************************************/
                if (LMRY_countr[0] == 'PE') {
                    if (library_mail.getAuthorization(732, licenses)) {
                        libTools.setUbicationItemFulfillment(recordObj);
                    }

                    //POPULADO DEL LATAM - LOCALIDAD GUIA
                    var idsalesorder = recordObj.getValue({
                        fieldId: 'createdfrom'
                    });

                    var country = recordObj.getValue({
                        fieldId: 'custbody_lmry_subsidiary_country'
                    });
                    if (country == 174 && idsalesorder && library_mail.getAuthorization(830, licenses)) {
                        var salesorderSearchObj = search.create({
                            type: "salesorder",
                            filters:
                                [
                                    ["type", "anyof", "SalesOrd"],
                                    "AND",
                                    ["internalidnumber", "equalto", idsalesorder],
                                    "AND",
                                    ["mainline", "is", "T"]
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "location", label: "Location" })
                                ]
                        });
                        var searchResult = salesorderSearchObj.run().getRange(0, 1000);

                        for (var i = 0; i < searchResult.length; i++) {
                            var location = searchResult[i].getValue('location');
                        }

                        if (location != '' && location != null) {

                            log.debug('entro');

                            recordObj.setValue({
                                fieldId: 'custbody_lmry_guia_localidad_origen',
                                value: location
                            });
                            var MyFieldSearch = search.lookupFields({
                                type: 'location',
                                id: location,
                                columns: ['custrecord_lmry_guia_direccion_localidad']
                            });

                            var direccion = MyFieldSearch.custrecord_lmry_guia_direccion_localidad;

                            if (direccion != '' && direccion != null)
                                recordObj.setValue({
                                    fieldId: 'custbody_lmry_guia_direccion_local_ori',
                                    value: direccion
                                });
                        }
                    }
                    //FIN POPULADO DEL LATAM - LOCALIDAD GUIA

                }/*****************************************************************************/

                /**
                 * Code: C0642
                 * Summary: Lock item fields
                 * Date: 07/09/2022
                 */

                if (library_mail.getAuthorization(521, licenses) && LMRY_countr[0] == 'MX' && type == 'edit') {
                    var pediments = libTools.searchPediments(recordObj.id);
                    var cartaPorte = libTools.cartaPorteLock(recordObj.id);
                    if (!pediments && !cartaPorte) {
                        libTools.lockItemFields(recordObj);
                    }
                }

                //SETEO AUTOMATICO DE COLUMNAS PARA FACTURACION
                var OrigType =  recordObj.getValue('ordertype')
                if (LMRY_countr[0] == 'CL' && OrigType == 'TrnfrOrd') {
                    var lineas = recordObj.getLineCount('item')

                    var InvSearch = search.create({
                        type: "customrecord_lmry_invoicing_id",
                        filters:
                        [
                           ["scriptid","is","val_391585_t1038906_586"]
                        ],
                        columns:
                        [
                           search.createColumn({name: "internalid", label: "Internal ID"})
                        ]
                     });

                    var Results = InvSearch.run().getRange(0,100);
                    if(!Results.length) id_iden = ''
                    var columns =  Results[0].columns;
                    var id_iden =  Results[0].getValue(columns[0]);
                    for(var i = 0;i<lineas;i++){
                        var linea =  recordObj.selectLine({
                            sublistId: 'item',
                            line: i
                        });

                        var monto =  recordObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemfxamount',
                            line: i
                        });
                        var idinv =  recordObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_lmry_invoicing_id',
                            line: i
                        });
                        if(!Number(monto) && !idinv){
                            linea.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_lmry_invoicing_id',
                                value: id_iden,
                                ignoreFieldChange: false,
                                forceSyncSourcing: true
                            });
                        }
                        linea.commitLine({
                            sublistId: 'item'
                        });
                    }
                }

                if (LMRY_countr[0] == 'AR') {
                    
                    libraryUnitPrice.disabledField();
                    
                }

            } catch (err) {
                log.error('Error pageInit', err);
                library_mail.sendemail2(' [ pageInit ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
            }
        }

        function cleanAndDisableFields() {
            var disableFields = ['custbody_lmry_subsidiary_country', 'custbody_lmry_ref_guia_numero', 'custbody_lmry_ref_guia_fecha'];

            var cleanFields = [
                'custbody_lmry_document_type', 'custbody_lmry_serie_doc_cxc', 'custbody_lmry_num_preimpreso', //Documentos de impresion
                'custbody_lmry_doc_ref_type', 'custbody_lmry_doc_serie_ref', 'custbody_lmry_num_doc_ref', //Documentos de Referencia
                'custbody_lmry_ref_guia_numero', 'custbody_lmry_ref_guia_fecha'];


            //Disable fields
            for (var i = 0; i < disableFields.length; i++) {
                var field_to_dis = recordObj.getField({
                    fieldId: disableFields[i]
                });

                if (field_to_dis) {
                    field_to_dis.isDisabled = true;
                }
            }

            if (type == 'create' || type == 'copy') {
                for (var i = 0; i < cleanFields.length; i++) {
                    recordObj.setValue({
                        fieldId: cleanFields[i],
                        value: '',
                        ignoreFieldChange: true
                    });
                }
            }
        }


        function validateField(context) {
            recordObj = context.currentRecord;
            try {
                var fieldId = context.fieldId;
                // *********************************
                // 08.09.2021 se campo subsidiary
                // *********************************
                if (fieldId == 'custbody_lmry_subsidiary_country') {
                    ValidateAccessIFC();
                    hideandViewFields();
                }

                /* Validacion 04/02/22 */
                if (fieldId == 'postingperiod') {

                    var period = recordObj.getValue('postingperiod');
                    var subsidiary = recordObj.getValue('subsidiary') ? recordObj.getValue('subsidiary') : 1;
                    // Se optiene el Pre - Fijo de la subsidiaria
                    var urlStlt = url.resolveScript({
                        scriptId: 'customscript_lmry_get_val_period_stlt',
                        deploymentId: 'customdeploy_lmry_get_val_period_stlt',
                        returnExternalUrl: false
                    }) + '&period=' + period + '&subsidiary=' + subsidiary + '&country=' + LMRY_countr[0] + '&typetran=sales';

                    //corregir hard code falta url
                    var getStlt = https.get({
                        url: 'https://' + window.location.hostname + urlStlt
                    });

                    // Retorna el cuero del SuiteLet
                    var closedPeriod = getStlt.body;

                    log.error('closedPeriod', closedPeriod);
                    if (closedPeriod == 'T') {
                        recordObj.setValue('custpage_lockedperiod', true);
                    } else {
                        recordObj.setValue('custpage_lockedperiod', false);
                    }

                    // Sale de la funcion
                    return true;
                }
                /* Fin validacion 04/02/22 */

                var doc_serie = recordObj.getValue({
                    fieldId: 'custbody_lmry_serie_doc_cxc'
                });

                if (fieldId == 'custbody_lmry_document_type' && LMRY_access == true) {
                    if (LMRY_countr[0] == 'BR' && LbryBRDuplicate.isValidate(recordObj, licenses)) {
                        var fieldPreim = recordObj.getField('custbody_lmry_num_preimpreso');
                        fieldPreim.isDisabled = true;
                        recordObj.setValue('tranid', Math.round(1e6 * Math.random()));
                    } else {
                        var fieldPreim = recordObj.getField('custbody_lmry_num_preimpreso');
                        fieldPreim.isDisabled = false;
                    }
                  // Tipo de Documento - Parent
                   var lmry_DocTip = recordObj.getValue("custbody_lmry_document_type");
                   if (lmry_DocTip != "" && lmry_DocTip != null && lmry_DocTip != -1) {                     
                     if (Val_Campos.length > 0) {                       
                       library_Val.Val_Authorization(recordObj, LMRY_countr[0], licenses);                       
                     }
                   }
                }

                if (fieldId == 'custbody_lmry_document_type' && LMRY_countr[0] == 'CL') {
                    correlativoChile(1);
                } else {


                    if (fieldId == 'custbody_lmry_serie_doc_cxc') {
                        if (LMRY_countr[0] != 'BR' || !LbryBRDuplicate.isValidate(recordObj, licenses)) {
                            setNumeroConsecutivo(doc_serie);
                        }
                        return true;
                    }

                    if (fieldId == 'custbody_lmry_document_type' || fieldId == 'custbody_lmry_serie_doc_cxc' || fieldId == 'custbody_lmry_num_preimpreso') {
                        setTranID();
                        return true;
                    }

                }
            } catch (err) {
                library_mail.sendemail2(' [ validateField ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
            }

            return true;
        }

        function fieldChanged(context) {
            recordObj = context.currentRecord;
            try {
                var fieldId = context.fieldId;
                var sublistId = context.sublistId;
                if (LMRY_countr[0] == 'PY' && LMRY_access) {
                    if (fieldId == 'custbody_lmry_num_doc_ref' || fieldId == 'custbody_lmry_doc_serie_ref' || fieldId == 'custbody_lmry_doc_ref_type') {
                        var typeDocRef = recordObj.getValue({
                            fieldId: 'custbody_lmry_doc_ref_type'
                        });

                        if (typeDocRef) {
                            var initials = search.lookupFields({
                                type: 'customrecord_lmry_tipo_doc',
                                id: typeDocRef,
                                columns: 'custrecord_lmry_doc_initials'
                            }).custrecord_lmry_doc_initials;

                            var num_doc_ref = recordObj.getValue({
                                fieldId: 'custbody_lmry_num_doc_ref'
                            });

                            var doc_serie_ref = recordObj.getValue({
                                fieldId: 'custbody_lmry_doc_serie_ref'
                            });

                            var doc_ref = doc_serie_ref + '-' + num_doc_ref;

                            if (initials) {
                                doc_ref = initials + ' ' + doc_ref;
                            }

                            recordObj.setValue({
                                fieldId: 'custbody_lmry_doc_ref',
                                value: doc_ref,
                                ignoreFieldChange: true
                            });
                        }
                    } else if (fieldId == 'shipaddress') {
                        var address1 = recordObj.getValue({
                            fieldId: 'shipaddress'
                        });

                        recordObj.setValue({
                            fieldId: 'custbody_lmry_guia_direccion_local_des',
                            value: address1,
                            ignoreFieldChange: true
                        });
                    }
                }

                if (LMRY_countr[0] == "BR" && LMRY_access) {
                    if (sublistId == "item" && (fieldId == "quantity" || fieldId == "custcol_lmry_prec_unit_so")) {
                        var quantity = recordObj.getCurrentSublistValue({ sublistId: "item", fieldId: "quantity" }) || 0.00;
                        var precUnit = recordObj.getCurrentSublistValue({ sublistId: "item", fieldId: "custcol_lmry_prec_unit_so" }) || 0.00;

                        var newRate = parseFloat(quantity) * parseFloat(precUnit) || "";
                        if (newRate) {
                            newRate = round2(newRate);
                        }
                        recordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_lmry_base_amount", value: newRate });
                    }
                }


                if (sublistId == 'item' && fieldId == 'item') {
                    if (LMRY_countr[0] == 'AR') {
                        libraryUnitPrice.disabledFieldLine(context.line);
                    }
                }
            } catch (err) {
                //alert("[ fieldChanged ] \n" + err.message);
                console.log(err);
                library_mail.sendemail2(' [ fieldChanged ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
            }

            return true;
        }

        function saveRecord(context) {
            recordObj = context.currentRecord;
            try {

                /* Validacion 04/02/22 */
                var lockedPeriod = recordObj.getValue("custpage_lockedperiod");
                log.error('lockedPeriod', lockedPeriod);
                if (lockedPeriod == true || lockedPeriod == 'T') {
                    return true;
                }
                /* Fin validacion 04/02/22 */
                ValidateAccessIFC();
                if (Val_Campos.length > 0) {
                   if (library_Val.Val_Mensaje(recordObj, Val_Campos) == false)
                       return false;
                }

                var JSON_auth = {
                    'AR': 116,
                    'BR': 526,
                    'BO': 418,
                    'CL': 112,
                    'CO': 420,
                    'CR': 422,
                    'EC': 103,
                    'GT': 424,
                    'MX': 426,
                    'PA': 428,
                    'PE': 68,
                    'PY': 109,
                    'SV': 106,
                    'UY': 430
                };

                //Se actualiza el numero de serie
                if (JSON_auth[LMRY_countr[0]] != null && JSON_auth[LMRY_countr[0]] != '' && JSON_auth[LMRY_countr[0]] !== undefined) {
                    if (library_mail.getAuthorization(JSON_auth[LMRY_countr[0]], licenses) == true) {
                        var id_serie = recordObj.getValue({
                            fieldId: 'custbody_lmry_serie_doc_cxc'
                        });
                        if (id_serie) {
                            var num_preimp = recordObj.getValue({
                                fieldId: 'custbody_lmry_num_preimpreso'
                            });
                            var rdSerie = search.lookupFields({
                                type: 'customrecord_lmry_serie_impresion_cxc',
                                id: id_serie,
                                columns: 'custrecord_lmry_serie_numero_impres'
                            }).custrecord_lmry_serie_numero_impres;

                            if (parseFloat(rdSerie) < parseFloat(num_preimp)) {
                                record.submitFields({
                                    type: 'customrecord_lmry_serie_impresion_cxc',
                                    id: id_serie,
                                    values: {
                                        'custrecord_lmry_serie_numero_impres': parseFloat(num_preimp)
                                    }
                                });
                            }
                        }
                    }
                }
                if (LMRY_countr[0] == 'CL' && library_mail.getAuthorization(112, licenses) == true) {
                    var id_serie = recordObj.getValue({
                        fieldId: 'custbody_lmry_serie_doc_cxc'
                    });
                    if (id_serie) {
                        var num_preimp = recordObj.getValue({
                            fieldId: 'custbody_lmry_num_preimpreso'
                        });
                        var rdSerie = search.lookupFields({
                            type: 'customrecord_lmry_serie_impresion_cxc',
                            id: id_serie,
                            columns: 'custrecord_lmry_serie_numero_impres'
                        }).custrecord_lmry_serie_numero_impres;

                        if (parseFloat(rdSerie) < parseFloat(num_preimp)) {
                            record.submitFields({
                                type: 'customrecord_lmry_serie_impresion_cxc',
                                id: id_serie,
                                values: {
                                    'custrecord_lmry_serie_numero_impres': parseFloat(num_preimp)
                                }
                            });
                        }
                    } else {
                        correlativoChile(2);
                    }
                }

                // Valida tranid repetido
                if (LMRY_countr[0] == 'BR' && !LbryBRDuplicate.validateDuplicate(recordObj, licenses)) {
                    var tranID = recordObj.getField('tranid');
                    var Language = runtime.getCurrentScript().getParameter({
                        name: 'LANGUAGE'
                    });
                    Language = Language.substring(0, 2);
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

                //Se actualizan los campos para la factura
                // var tranid = recordObj.getValue({
                //     fieldId: 'tranid'
                // });
                // var trandate = recordObj.getValue({
                //     fieldId: 'trandate'
                // });
                // trandate = format.format({ value: trandate, type: format.Type.DATE });

                // recordObj.setValue({
                //     fieldId: 'custbody_lmry_ref_guia_numero',
                //     value: tranid,
                //     ignoreFieldChange: true
                // });

                // recordObj.setValue({
                //     fieldId: 'custbody_lmry_ref_guia_fecha',
                //     value: trandate,
                //     ignoreFieldChange: true
                // });

                if (LMRY_countr[0] == "BR") {
                    updateBRBaseAmount(recordObj);
                }

            } catch (err) {
                //alert("[ saveRecord ] \n" + err.message);
                console.log(err);
                library_mail.sendemail2(' [ saveRecord ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
            }
            return true;
        }


        function correlativoChile(option) {
            var document_type = recordObj.getValue({ fieldId: 'custbody_lmry_document_type' });
            var isSeriesCLActive = library_mail.getAuthorization(414, licenses);

            if (document_type && LMRY_countr[0] == 'CL' && !isSeriesCLActive && library_mail.getAuthorization(112, licenses) == true) {

                var filters = [['custrecord_lmry_cl_np_document_type', 'anyof', document_type]];
                if (featureSubs == true || featureSubs == 'T') {
                    var subsidiary = recordObj.getValue("subsidiary");
                    filters.push('AND', ['custrecord_lmry_cl_np_subsidiary', 'anyof', subsidiary]);
                }

                var search_num_pr = search.create({
                    type: 'customrecord_lmry_cl_number_preprinted',
                    filters: filters,
                    columns: ['internalid', 'custrecord_lmry_cl_np_current_value']
                });

                var rec_nums = search_num_pr.run().getRange(0, 10);

                var nroCorrelat = 0;
                var internalid = 0;

                //Se obtiene un correlativo configurado en el record
                if (option == 1) {

                    if (rec_nums && rec_nums.length) {
                        nroCorrelat = rec_nums[0].getValue({ name: 'custrecord_lmry_cl_np_current_value' });
                        nroCorrelat = parseInt(nroCorrelat) + 1;
                    }

                    //si no se encontro correlativo
                    if (!nroCorrelat) {
                        alert('No se encuentra configurado el numero correlativo para el campo [Latam - Numero Preimpreso]');
                    }

                    recordObj.setValue({
                        fieldId: 'custbody_lmry_num_preimpreso',
                        value: nroCorrelat
                    });
                    setTranID();

                } else if (option == 2) { //Se actualiza el correlativo


                    if (rec_nums && rec_nums.length) {
                        internalid = rec_nums[0].getValue({ name: 'internalid' });
                        nroCorrelat = rec_nums[0].getValue({ name: 'custrecord_lmry_cl_np_current_value' });

                        var actual_num_pre = recordObj.getValue({
                            fieldId: 'custbody_lmry_num_preimpreso'
                        });

                        if (parseFloat(nroCorrelat) < parseFloat(actual_num_pre)) {
                            record.submitFields({
                                type: 'customrecord_lmry_cl_number_preprinted',
                                id: internalid,
                                values: {
                                    'custrecord_lmry_cl_np_current_value': parseFloat(actual_num_pre)
                                }
                            });
                        }
                    }
                }
            }
        }

        function setNumeroConsecutivo(doc_serie) {

            /* *********************************************
                    * Verifica que este activo el feature Numerar
                    * Transaction Number Item Fullfillment
                    **********************************************/
            var JSON_auth = {
                'AR': 116,
                'BR': 526,
                'BO': 418,
                'CL': 112,
                'CO': 420,
                'CR': 422,
                'EC': 103,
                'GT': 424,
                'MX': 426,
                'PA': 428,
                'PE': 68,
                'PY': 109,
                'SV': 106,
                'UY': 430
            };
            var featureID = JSON_auth[LMRY_countr[0]];
            if (featureID && library_mail.getAuthorization(featureID, licenses) == true) {

                var doc_num = recordObj.getValue({
                    fieldId: 'custbody_lmry_num_preimpreso'
                });

                if (doc_serie && doc_serie != -1) {
                    if (!doc_num) {
                        var rec_serie = search.lookupFields({
                            type: 'customrecord_lmry_serie_impresion_cxc',
                            id: doc_serie,
                            columns: ['custrecord_lmry_serie_numero_impres', 'custrecord_lmry_serie_rango_fin', 'custrecord_lmry_serie_num_digitos', 'custrecord_ei_preprinted_series']
                        });

                        var num_consec = rec_serie.custrecord_lmry_serie_numero_impres;
                        var isEISeries = rec_serie.custrecord_ei_preprinted_series;

                        if (LMRY_countr[0] == 'BR' && (isEISeries == true || isEISeries == 'T')) {
                            return true;
                        }

                        if (num_consec) {
                            num_consec = parseInt(num_consec) + 1;
                        }

                        var max_serie = parseInt(rec_serie.custrecord_lmry_serie_rango_fin);
                        var num_digitos = parseInt(rec_serie.custrecord_lmry_serie_num_digitos);

                        if (num_consec > max_serie) {
                            alert('El utimo numero para esta serie (' + max_serie + ') ha sido utilizado. Verificar si existen numeros disponibles en esta serie.');
                            recordObj.setValue({
                                fieldId: 'custbody_lmry_num_preimpreso',
                                value: '',
                                ignoreFieldChange: true
                            });
                        } else {
                            var longNumSerie = parseInt((num_consec + '').length);
                            var llenarCeros = '';
                            for (var i = 0; i < (num_digitos - longNumSerie); i++) {
                                llenarCeros += '0';
                            }

                            num_consec = llenarCeros + num_consec;
                            recordObj.setValue({
                                fieldId: 'custbody_lmry_num_preimpreso',
                                value: num_consec,
                                ignoreFieldChange: true
                            });
                            setTranID();
                        }
                    }
                }
            }
        }


        function setTranID() {

            var subsidiary = recordObj.getValue({
                fieldId: 'subsidiary'
            });

            var doc_type = recordObj.getValue({
                fieldId: 'custbody_lmry_document_type'
            });

            //deberia ser un getValue y luego hacer un lookupFields
            var doc_serie = recordObj.getValue({
                fieldId: 'custbody_lmry_serie_doc_cxc'
            });

            var doc_num = recordObj.getValue({
                fieldId: 'custbody_lmry_num_preimpreso'
            });

            if (subsidiary && doc_type && doc_type != -1 && doc_num) {

                var featuresByCountry = {
                    'AR': 5,
                    'BO': 49,
                    'BR': 10,
                    'CL': 11,
                    'CO': 65,
                    'CR': 3,
                    'EC': 58,
                    'SV': 19,
                    'GT': 23,
                    'MX': 25,
                    'PA': 59,
                    'PY': 40,
                    'PE': 9,
                    'UY': 131
                };

                var featureId = featuresByCountry[LMRY_countr[0]];

                if (featureId && LMRY_access && library_mail.getAuthorization(featureId, licenses) == true) {
                    var isSeriesCLActive = library_mail.getAuthorization(414, licenses);
                    var hasSeries = LMRY_countr[0] != 'CL' || (LMRY_countr[0] == 'CL' && isSeriesCLActive);


                    if ((hasSeries && doc_serie && doc_serie != -1) || LMRY_countr[0] == 'CL') {

                        var suitelet_url = url.resolveScript({
                            scriptId: 'customscript_lmry_get_country_stlt',
                            deploymentId: 'customdeploy_lmry_get_country_stlt',
                            params: {
                                sub: subsidiary,
                                opt: 'ISP',
                                cty: LMRY_countr[0]
                            }
                        });

                        var response = https.get({
                            url: suitelet_url
                        });

                        var tranprefix = response.body;

                        var initials = search.lookupFields({
                            type: 'customrecord_lmry_tipo_doc',
                            id: doc_type,
                            columns: 'custrecord_lmry_doc_initials'
                        }).custrecord_lmry_doc_initials;

                        initials = initials || '';

                        var tranid = initials.toUpperCase();
                        var tranid = doc_num;

                        var serie_text = recordObj.getText('custbody_lmry_serie_doc_cxc');

                        if (hasSeries) {
                            tranid = serie_text + '-' + doc_num;
                        }
                        tranid = initials.toUpperCase() + ' ' + tranid;

                        if (tranprefix) {
                            tranid = tranprefix + ' ' + tranid;
                        }

                        recordObj.setValue({
                            fieldId: 'tranid',
                            value: tranid,
                            ignoreFieldChange: true
                        });
                    }
                }
            }
        }

        function hideandViewFields() {

            try {
                library_mail.onFieldsHide(2, recordObj, false);

                if (LMRY_access) {
                    library_mail.onFieldsDisplayBody(recordObj, LMRY_countr[1], 'custrecord_lmry_on_item_fulfillment', false);
                }
            } catch (err) {
                throw ' [ hideandViewFields ] ' + err;
            }
        }

        function ValidateAccessIFC() {
            try {
                LMRY_access = false;
                LMRY_countr = [];

                var idSubsidiary = recordObj.getValue({
                    fieldId: 'subsidiary'
                });

                if (idSubsidiary) {
                    LMRY_countr = library_mail.Get_Country_STLT(idSubsidiary);
                }

                if (!LMRY_countr.length) {
                    return;
                }

                LMRY_access = library_mail.getCountryOfAccess(LMRY_countr, licenses);
              if (LMRY_countr[0] == "" || LMRY_countr[0] == null) {
                  return true;
                }
                // Solo si tiene acceso
                Val_Campos = "";
                if (LMRY_access == true) {
                  // Validación de campos obligatorios
                  Val_Campos = library_Val.Val_Authorization(
                    recordObj,
                    LMRY_countr[0],
                    licenses
                  );                  
                }
            }
            catch (err) {
                throw '[ ValidateAccessIFC ]' + err;
            }
        }

        function round2(num) {
            if (num >= 0) {
                return parseFloat(Math.round(parseFloat(num) * 1e2 + 1e-3) / 1e2);
            } else {
                return parseFloat(Math.round(parseFloat(num) * 1e2 - 1e-3) / 1e2);
            }
        }

        function updateBRBaseAmount(recordObj) {
            var numItems = recordObj.getLineCount({ sublistId: "item" });
            for (var i = 0; i < numItems; i++) {
                recordObj.selectLine({ sublistId: "item", line: i });
                var quantity = recordObj.getCurrentSublistValue({ sublistId: "item", fieldId: "quantity" }) || 0.00;
                var precUnit = recordObj.getCurrentSublistValue({ sublistId: "item", fieldId: "custcol_lmry_prec_unit_so" }) || 0.00;

                var newRate = parseFloat(quantity) * parseFloat(precUnit) || "";
                if (newRate) {
                    newRate = round2(newRate);
                }
                recordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_lmry_base_amount", value: newRate });
            }
        }

        return {
            pageInit: pageInit,
            localizationContextEnter: pageInit,
            validateField: validateField,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };
    });