/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_libWhtValidationLBRY_V2.0.js                ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 20 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define(['./LMRY_libSendingEmailsLBRY_V2.0', './LMRY_libNumberInWordsLBRY_V2.0', 'N/log', 'N/record', 'N/search', 'N/runtime', 'N/format', './LMRY_CO_Duplicate_Credit_Memos_LBRY_V2.0'],

    function (Library_Mail, Library_Number, log, record, search, runtime, format, Library_Duplicate) {

        var LMRY_script = 'LMRY_libWhtValidationLBRY V2.0';
        var MEMO_WHT = 'Latam - WHT';
        var GENERATED_TRANSACTION = {
            'invoice': 'creditmemo', 'vendorbill': 'vendorcredit',
            'creditmemo': 'invoice', 'vendorcredit': 'vendorbill'
        };

        /* ------------------------------------------------------------------------------------------------------
         * Creacion del WHT Latam
         * -------------------------------------
         * -------------------------------------------------------------- */
        function Create_WHT_Latam(Transaction, ID, ORCD) {

            var result = Library_Duplicate.Verification_Duplicate(Transaction, ID, ORCD, Search_WHT, getExchangeRate);
            //  log.debug('result', result);
            log.error("result.state",result.state)
            if (result.state == true) {
                //  log.debug('Son iguales');
                return true;
            }

            // Delete Journal
            Delete_JE(ID);

            if (Transaction == 'invoice') {
                // Delete Credit Memo
                Delete_CM('creditmemo', ID);
            }
            if (Transaction == 'vendorbill') {
                // Delete Vendor Credit
                Delete_CM('vendorcredit', ID);
            }

            // Para restar retenciones
            var reteamout = 0;

            // Abre el Invoice y actualiza campos
            var Obj_RCD = record.load({
                type: Transaction,
                id: ID
            });
            // Custom Form
            var cform = Obj_RCD.getValue({
                fieldId: 'customform'
            });
            // Verifica si se va a generar WHT
            var createWHT = Obj_RCD.getValue({
                fieldId: 'custbody_lmry_apply_wht_code'
            });

            log.error("createWHT",createWHT)

            if (createWHT == 'F' || createWHT == false) {
                createWHT = null;
                return true;
            }

            // Feature Set Period
            var licenses = Library_Mail.getLicenses(Obj_RCD.getValue({fieldId: 'subsidiary'}));
            var fAccPeriod = Library_Mail.getAuthorization(1022, licenses);

            var RETEICA = Obj_RCD.getValue({
                fieldId: 'custbody_lmry_co_reteica'
            });

            var RETEIVA = Obj_RCD.getValue({
                fieldId: 'custbody_lmry_co_reteiva'
            });

            var RETEFTE = Obj_RCD.getValue({
                fieldId: 'custbody_lmry_co_retefte'
            });

            var RETECRE = Obj_RCD.getValue({
                fieldId: 'custbody_lmry_co_autoretecree'
            });

            if (result.rete_amount > 0) {
                reteamout = result.rete_amount;
            } else {

                // Custom Field for Colombia
                var reteica_amount = parseFloat(Search_WHT(Transaction, ID, Obj_RCD, RETEICA));
                reteamout = reteamout + reteica_amount;

                var reteiva_amount = parseFloat(Search_WHT(Transaction, ID, Obj_RCD, RETEIVA));
                reteamout = reteamout + reteiva_amount;

                var retefte_amount = parseFloat(Search_WHT(Transaction, ID, Obj_RCD, RETEFTE));
                reteamout = reteamout + retefte_amount;

                //log.error('impuestos', RETEICA + ',' + RETEIVA + ',' + RETEFTE + ',' + RETECRE);
                var retecre_amount = Search_WHT(Transaction, ID, Obj_RCD, RETECRE);

            }

            var nameCountry = Obj_RCD.getText({fieldId: 'custbody_lmry_subsidiary_country'});

            if (nameCountry == 'Colombia') {
                deleteTaxResults(ID);
                log.debug('deleteTaxResults', "deleteTaxResults sali");
            }
            // Importe en Letras
            if (nameCountry == 'Colombia' &&
                (Transaction == 'invoice' || Transaction == 'creditmemo')) {
                var monedaTexto = search.lookupFields({
                    type: search.Type.CURRENCY,
                    id: Obj_RCD.getValue({
                        fieldId: 'currency'
                    }),
                    columns: ['name']
                });
                var imptotal = Obj_RCD.getValue({
                    fieldId: 'total'
                });
                imptotal = parseFloat(imptotal) - parseFloat(reteamout);
                var impletras = Library_Number.ConvNumeroLetraESP(imptotal, monedaTexto.name, '', 'Y');

                /* * * * * * * * * * * * * * * * * * * * * * * * * * *
                 * Fecha : 08 de Mayo de 2020
                 * Se agrego el siguiente parametro disableTriggers:true
                 * para evita le ejecucion de users events.
                 * * * * * * * * * * * * * * * * * * * * * * * * * * */
                // Asigna el resultado del monto en letras
                record.submitFields({
                    type: Transaction,
                    id: ID,
                    values: { 'custbody_lmry_pa_monto_letras': impletras },
                    options: { enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true }
                });
            }
            // Custom Field for Bolivia
            var RETEIT = Obj_RCD.getValue({
                fieldId: 'custbody_lmry_bo_autoreteit'
            });
            Search_WHT(Transaction, ID, Obj_RCD, RETEIT);
            // Solo en Vendor
            var RETEIU = '';
            if (Transaction == 'vendorbill' || Transaction == 'vendorcredit') {
                RETEIU = Obj_RCD.getValue({
                    fieldId: 'custbody_lmry_bo_reteiue'
                });
                Search_WHT(Transaction, ID, Obj_RCD, RETEIU);
            }

            // Custom Field for Paraguay
            var RETEIR = Obj_RCD.getValue({
                fieldId: 'custbody_lmry_py_autoreteir'
            });
            Search_WHT(Transaction, ID, Obj_RCD, RETEIR);
            var RETEIV = Obj_RCD.getValue({
                fieldId: 'custbody_lmry_py_reteiva'
            });
            Search_WHT(Transaction, ID, Obj_RCD, RETEIV);

            // Custom Field for Ecuador
            var ECREIR = Obj_RCD.getValue({
                fieldId: 'custbody_lmry_ec_reteir'
            });
            Search_WHT(Transaction, ID, Obj_RCD, ECREIR);
            var ECREIV = Obj_RCD.getValue({
                fieldId: 'custbody_lmry_ec_reteiva'
            });
            Search_WHT(Transaction, ID, Obj_RCD, ECREIV);
            log.debug("Transaction type ",Transaction)
            // Crea Transacciones solo para Invoice y Vendor Bill
            if (Transaction == 'invoice' || Transaction == 'vendorbill') {

                // Custom Field for Colombia
                log.debug("comenzamos create wht 1 - 4","create eht 4")
                Create_WHT_1(ID, Obj_RCD, RETECRE, fAccPeriod);
                Create_WHT_1(ID, Obj_RCD, RETEICA, fAccPeriod);
                Create_WHT_1(ID, Obj_RCD, RETEIVA, fAccPeriod);
                Create_WHT_1(ID, Obj_RCD, RETEFTE, fAccPeriod);

                // Custom Field for Bolivia
                Create_WHT_1(ID, Obj_RCD, RETEIT, fAccPeriod);
                // Solo en Vendor
                if (Transaction == 'vendorbill') {
                    Create_WHT_1(ID, Obj_RCD, RETEIU, fAccPeriod);
                }

                // Custom Field for Paraguay
                Create_WHT_1(ID, Obj_RCD, RETEIR, fAccPeriod);
                Create_WHT_1(ID, Obj_RCD, RETEIV, fAccPeriod);

                // Custom Field for Ecuador
                Create_WHT_1(ID, Obj_RCD, ECREIR, fAccPeriod);
                Create_WHT_1(ID, Obj_RCD, ECREIV, fAccPeriod);
            }

            // Crea Transacciones solo para Credit Memo y Vendor Credit
            if (Transaction == 'creditmemo' || Transaction == 'vendorcredit') {
                //Se obtienen los invoices/bills que se deben eliminar antes de generar las nuevas transacciones
                var transToDelete = getTransactionsToDelete(ID, GENERATED_TRANSACTION[Transaction]);

                // Captura facturas creadas
                var arApply = new Array();

                // Custom Field for Colombia
                arApply[0] = Create_WHT_2(ID, Obj_RCD, RETEICA, fAccPeriod);
                arApply[1] = Create_WHT_2(ID, Obj_RCD, RETEIVA, fAccPeriod);
                arApply[2] = Create_WHT_2(ID, Obj_RCD, RETEFTE, fAccPeriod);
                arApply[3] = Create_WHT_2(ID, Obj_RCD, RETECRE, fAccPeriod);

                // Custom Field for Bolivia
                arApply[4] = Create_WHT_2(ID, Obj_RCD, RETEIT, fAccPeriod);
                arApply[5] = 0;

                // Solo en Vendor
                if (Transaction == 'vendorcredit') {
                    arApply[5] = Create_WHT_2(ID, Obj_RCD, RETEIU, fAccPeriod);
                }

                // Custom Field for Paraguay
                arApply[6] = Create_WHT_2(ID, Obj_RCD, RETEIR, fAccPeriod);
                arApply[7] = Create_WHT_2(ID, Obj_RCD, RETEIV, fAccPeriod);

                // Aplica la Bill y Invoice
                ApplyInvoice(ID, Transaction, arApply, transToDelete);
            }

            // Libera variable
            Obj_RCD = null;
        }

        /* ------------------------------------------------------------------------------------------------------
         * Realiza la busqueda en LatamReady WHT
         * --------------------------------------------------------------------------------------------------- */
        function Search_WHT(Transaction, ID, Obj_RCD, WHTID) {
            try {
                if (WHTID == '' || WHTID == null) {
                    return 0;
                }

                // Transaccion
                var savedsearch = search.load({
                    id: 'customsearch_lmry_wht_base'
                });

                savedsearch.filters.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: [WHTID],
                }));

                var searchresult = savedsearch.run();

                var objResult = searchresult.getRange(0, 10);
                if (objResult.length > 0) {
                    // Trae todos los campos
                    var i = 0;
                    var columns = objResult[i].columns;
                    // Tipo de Transaccion
                    var typetran = Obj_RCD.getValue({
                        fieldId: 'type'
                    });

                    // Internal ID
                    var Field_whtname = objResult[i].getValue('name');
                    var Field_Rate = 0;
                    if (objResult[i].getValue('custrecord_lmry_wht_coderate') != '' &&
                        objResult[i].getValue('custrecord_lmry_wht_coderate') != null) {
                        Field_Rate = parseFloat(objResult[i].getValue('custrecord_lmry_wht_coderate'));
                    }
                    var Field_datfrom = objResult[i].getValue(columns[6]);
                    var Field_datuntil = objResult[i].getValue(columns[7]);
                    var Field_Custom = objResult[i].getValue(columns[4]);
                    var Field_cminbase = 0;
                    if (objResult[i].getValue('custrecord_lmry_wht_codeminbase') != '' &&
                        objResult[i].getValue('custrecord_lmry_wht_codeminbase') != null) {
                        Field_cminbase = parseFloat(objResult[i].getValue('custrecord_lmry_wht_codeminbase'));
                    }

                    //Exchange RATE
                    var exchangeRate = getExchangeRate(Obj_RCD);
                    log.error('exchangeRateSearch', exchangeRate);

                    // Formato de Fechas
                    var Field_DateTran = yyymmdd(Obj_RCD.getValue({
                        fieldId: 'trandate'
                    }));

                    // Variables para Ventas
                    var Field_Standar = '';
                    if (typetran == 'custinvc' || typetran == 'custcred') {
                        Field_Standar = objResult[i].getValue(columns[12]); // custrecord_lmry_wht_salebase
                    }
                    // Variables para Compras
                    if (typetran == 'vendbill' || typetran == 'vendcred') {
                        Field_Standar = objResult[i].getValue(columns[16]); // custrecord_lmry_wht_purcbase
                    }

                    // Valida si el campo standar esta configurado
                    if (Field_Standar == '' || Field_Standar == null) {
                        return 0;
                    }

                    // Importe del campo Standart
                    var amount = 0;
                    var auximp = 0;


                    if (Field_Standar == 'subtotal' && (typetran == 'vendbill' || typetran == 'vendcred')) {
                        amount = parseFloat(Obj_RCD.getValue({
                            fieldId: 'total'
                        })) - parseFloat(Obj_RCD.getValue({
                            fieldId: 'taxtotal'
                        }));
                        amount = round2(amount);
                    } else {
                        amount = parseFloat(Obj_RCD.getValue({
                            fieldId: Field_Standar
                        }));
                    }
                    auximp = parseFloat(amount);

                    // Calculo de Campos
                    var amountresult = 0;
                    var amount_base = 0;
                    if (amount != '' && amount != null) {
                        // Sin tipo de cambio
                        amount_base = parseFloat(auximp) * parseFloat(Field_Rate);
                        amount_base = parseFloat(amount_base) / 100;
                        amount_base = round2(amount_base);

                        // Con tipo de cambio
                        amountresult = parseFloat(amount) * parseFloat(Field_Rate);
                        amountresult = parseFloat(amountresult) / 100;
                        //amountresult = amountresult.toFixed(2);
                        amountresult = round2(amountresult);
                        amountresult = amountresult * exchangeRate;
                        amountresult = round2(amountresult);
                    }

                    // Debe estar dentro del rango
                    // El importe debe ser mayor al minimo y mayor a cero
                    var tmpAmount = parseFloat(amount) * exchangeRate;
                    log.error('Search_WHT - ' + typetran + ' : ' + Field_datfrom + ' <= ' + Field_DateTran + ' <= ' + Field_datuntil,
                        'Search_WHT - Solo si es mayor o igual ' + tmpAmount + ' >= ' + Field_cminbase +
                        ' y ' + amountresult + ' > 0');

                    // Valida resultados
                    if ((Field_DateTran >= Field_datfrom && Field_DateTran <= Field_datuntil) &&
                        (Field_datfrom != '' && Field_datfrom != null) &&
                        (Field_datuntil != '' && Field_datuntil != null) &&
                        (tmpAmount >= parseFloat(Field_cminbase) && tmpAmount > 0) &&
                        parseFloat(amountresult) > 0) {

                        log.error('amountresult1 : ' + amountresult, 'amountresult2 : ' + amountresult);

                        var arrJSon = '{"' + Field_Custom + '":"' + amountresult + '"}';
                        arrJSon = JSON.parse(arrJSon);

                        /* * * * * * * * * * * * * * * * * * * * * * * * * * *
                         * Fecha : 08 de Mayo de 2020
                         * Se agrego el siguiente parametro disableTriggers:true
                         * para evita le ejecucion de users events.
                         * * * * * * * * * * * * * * * * * * * * * * * * * * */
                        // Actualiza el campo WHT Amout
                        record.submitFields({
                            type: Transaction,
                            id: ID,
                            values: arrJSon,
                            options: { enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true }
                        });

                    } else {
                        var arrJSon = '{"' + Field_Custom + '":"0"}';
                        arrJSon = JSON.parse(arrJSon);

                        /* * * * * * * * * * * * * * * * * * * * * * * * * * *
                         * Fecha : 08 de Mayo de 2020
                         * Se agrego el siguiente parametro disableTriggers:true
                         * para evita le ejecucion de users events.
                         * * * * * * * * * * * * * * * * * * * * * * * * * * */
                        // Actualiza el campo WHT Amout
                        record.submitFields({
                            type: Transaction,
                            id: ID,
                            values: arrJSon,
                            options: { enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true }
                        });
                        amount_base = 0;
                    }

                    // var usage = runtime.getCurrentScript().getRemainingUsage();
                    // log.error('Head : getRemainingUsage ', usage);

                    // Devuelve calculo
                    return amount_base;
                }
            } catch (err) {

                Library_Mail.sendemail('Search_WHT - Error: ' + err, LMRY_script);

                // Devuelve cero
                return 0;
            }
        }

        /* ------------------------------------------------------------------------------------------------------
         * Applied to Invoice - Bill
         * Crea Transacciones en LatamReady WHT
         * --------------------------------------------------------------------------------------------------- */
        function Create_WHT_1(ID, Obj_RCD, WHTID, fAccPeriod) {

            try {
                log.debug("Create_WHT_1 START",WHTID)
                if (WHTID == '' || WHTID == null) {
                    return true;
                }
                var scriptObj = runtime.getCurrentScript();
                // TaxCode para la linea
                var idtaxgparam = '';

                var idCountry = Obj_RCD.getValue({
                    fieldId: 'custbody_lmry_subsidiary_country'
                });

                //Exchange RATE
                var exchangeRate = getExchangeRate(Obj_RCD);

                if (Number(idCountry) == 48 || Number(idCountry) == 29) { //Colombia
                    // Realiza la una busqueda en el registro personalizado
                    // LatamReady - Setup Tax Subsidiary para validar
                    // La configuracion de la subsidiaria
                    var id_subsidiary = Obj_RCD.getValue({
                        fieldId: 'subsidiary'
                    });
                    var search_lsts = search.create({
                        type: "customrecord_lmry_setup_tax_subsidiary",
                        filters:
                            [
                                ["isinactive", "is", "F"], "AND",
                                ["custrecord_lmry_setuptax_subsidiary", "anyof", id_subsidiary]
                            ],
                        columns:
                            [
                                "custrecord_lmry_setuptax_tax_code"
                            ]
                    });
                    var result_lsts = search_lsts.run();
                    var object_lsts = result_lsts.getRange(0, 10);
                    if (object_lsts.length > 0) {
                        // Trae todos los campos
                        var row_lsts = 0;
                        idtaxgparam = object_lsts[row_lsts].getValue('custrecord_lmry_setuptax_tax_code');
                    }
                }

                // Transaccion
                var savedsearch = search.load({
                    id: 'customsearch_lmry_wht_base'
                });
                savedsearch.filters.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: [WHTID]
                }));
                var searchresult = savedsearch.run();
                var objResult = searchresult.getRange(0, 10);
                if (objResult.length > 0) {
                    // Trae todos los 
                    log.debug("iteracion ",WHTID)
                    var i = 0;
                    var columns = objResult[i].columns;

                    //log.error('columns', columns);

                    // Tipo de Transaccion
                    var typetran = Obj_RCD.getValue({
                        fieldId: 'type'
                    });
                    // Internal ID
                    var Field_Transa1 = '';
                    var Field_Transa2 = '';
                    var Field_Formsdf = '';
                    var Field_whtname = objResult[i].getValue('name');
                    var Available_onts = '';
                    var Field_taxpoint = '';
                    var Field_itesales = '';
                    var Field_whtkind = objResult[i].getValue('custrecord_lmry_wht_kind');
                    var Field_Rate = objResult[i].getValue('custrecord_lmry_wht_coderate');
                    var Field_datfrom = objResult[i].getValue(columns[6]);
                    var Field_datuntil = objResult[i].getValue(columns[7]);
                    var Field_cminbase = objResult[i].getValue('custrecord_lmry_wht_codeminbase');
                    if (Field_cminbase == '' || Field_cminbase == null) {
                        Field_cminbase = 0;
                    }
                    var Field_crediacc = objResult[i].getValue('custrecord_lmry_wht_taxcredacc');
                    var Field_xliabacc = objResult[i].getValue('custrecord_lmry_wht_taxliabacc');
                    var Field_Custom = objResult[i].getValue(columns[4]);
                    var Field_Standar = '';

                    // Variables para Ventas
                    if (typetran == 'custinvc') {
                        Field_Transa1 = 'invoice';
                        Field_Transa2 = 'creditmemo';
                        Field_Formsdf = runtime.getCurrentScript().getParameter({
                            name: 'custscript_lmry_wht_credit_memo'
                        });
                        Available_onts = objResult[i].getValue('custrecord_lmry_wht_onsales');
                        Field_taxpoint = objResult[i].getValue('custrecord_lmry_wht_saletaxpoint');
                        Field_itesales = objResult[i].getValue('custrecord_lmry_wht_taxitem_sales');
                        Field_Standar = objResult[i].getValue(columns[12]); // custrecord_lmry_wht_salebase
                    }
                    // Variables para Compras
                    if (typetran == 'vendbill') {
                        Field_Transa1 = 'vendorbill';
                        Field_Transa2 = 'vendorcredit';
                        Field_Formsdf = runtime.getCurrentScript().getParameter({
                            name: 'custscript_lmry_wht_vendor_credit'
                        });
                        Available_onts = objResult[i].getValue('custrecord_lmry_wht_onpurchases');
                        Field_taxpoint = objResult[i].getValue('custrecord_lmry_wht_purctaxpoint');
                        Field_itesales = objResult[i].getValue('custrecord_lmry_wht_taxitem_purchase');
                        Field_Standar = objResult[i].getValue(columns[16]); // custrecord_lmry_wht_purcbase
                    }

                    // Valida si el campo standar va a popular estan configurado
                    if (Field_Standar == '' || Field_Standar == null ||
                        Available_onts == false || Available_onts == 'F') {
                        log.error('Create_WHT_1 - WHTID - Field Standar - Available_onts', WHTID + ' - ' + Field_Standar + ' - ' + Available_onts);
                        return true;
                    }

                    // Importe del campo Standart
                    var amount = 0;
                    if (Field_Standar == 'subtotal' && typetran == 'vendbill') {
                        amount = parseFloat(Obj_RCD.getValue({
                            fieldId: 'total'
                        })) - parseFloat(Obj_RCD.getValue({
                            fieldId: 'taxtotal'
                        }));
                        amount = round2(amount);
                    } else {
                        amount = parseFloat(Obj_RCD.getValue({
                            fieldId: Field_Standar
                        }));
                    }

                    // Calculo de Campos
                    var amountresult = 0;
                    if (amount != '' && amount != null) {
                        amountresult = parseFloat(amount) * parseFloat(Field_Rate);
                        amountresult = parseFloat(amountresult) / 100;
                        //amountresult = amountresult.toFixed(2);
                        amountresult = round2(amountresult);
                        amountresult = Math.abs(amountresult);
                    }

                    // Formato de Fechas
                    var Field_DateTran = yyymmdd(Obj_RCD.getValue({
                        fieldId: 'trandate'
                    }));
                    // log.error('Create_WHT_1 - ' + typetran + ' : ' + 'Field_DateTran, Field_datfrom , Field_datuntil , Field_taxpoint', Field_DateTran + ' - ' + Field_datfrom + ' - ' + Field_datuntil + ' - ' + Field_taxpoint);
                    // log.error('Create_WHT_1 - Solo si el resultado es mayor o igual ', (parseFloat(amount) * parseFloat(Obj_RCD.getValue({
                    //   fieldId: 'exchangerate'
                    // }))) + ' >= ' + Field_cminbase + ' y ' + amountresult + '>0');

                    // Validate Create Journal or Credit Memo
                    if (Field_taxpoint == 1) {
                        if ((Field_DateTran >= Field_datfrom && Field_datfrom != '' && Field_datfrom != null) &&
                            (Field_DateTran <= Field_datuntil && Field_datuntil != '' && Field_datuntil != null) &&
                            ((parseFloat(amount) * exchangeRate) >= parseFloat(Field_cminbase) &&
                                (parseFloat(amount) * exchangeRate) > 0) && parseFloat(amountresult) > 0) {

                            /* ---------------------------------------------
                             * Create Credit Memo si Field_whtkind = 1
                             * ------------------------------------------ */
                            if (Field_whtkind == 1) {
                                // Valida si el item que se va a popular estan configurado
                                if (Field_itesales == '' || Field_itesales == null) {
                                    log.debug("Field_itesales",Field_itesales);
                                    return true;
                                }

                                // Crea la transaccion para la retencion
                                var inRec = record.create({
                                    type: Field_Transa2
                                });
                                // Cuenta Contable
                                // log.error('Create_WHT_1 - ' + Field_Transa2 + '- Account', Obj_RCD.getValue({
                                //   fieldId: 'account'
                                // }));

                                // Formulario Personalizado
                                if (Field_Formsdf != '' && Field_Formsdf != null) {
                                    inRec.setValue({
                                        fieldId: 'customform',
                                        value: Field_Formsdf
                                    });
                                }
                                // Campos Standar de NetSuite
                                inRec.setValue({
                                    fieldId: 'entity',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'entity'
                                    })
                                });
                                inRec.setValue({
                                    fieldId: 'subsidiary',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'subsidiary'
                                    })
                                });
                                inRec.setValue({
                                    fieldId: 'account',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'account'
                                    })
                                });
                                if (Field_whtname != '' && Field_whtname != null) {
                                    inRec.setValue({
                                        fieldId: 'memo',
                                        value: 'Latam - WHT ' + Field_whtname
                                    });
                                }
                                inRec.setValue({
                                    fieldId: 'tranid',
                                    value: 'LTMP-' + ID
                                });

                                var FormatoIn = Obj_RCD.getValue({
                                    fieldId: 'trandate'
                                });

                                var FormatoFecha = format.parse({
                                    value: FormatoIn,
                                    type: format.Type.DATE
                                });

                                inRec.setValue({
                                    fieldId: 'trandate',
                                    value: FormatoFecha
                                });

                                if (!fAccPeriod) {
                                    inRec.setValue({
                                        fieldId: 'postingperiod',
                                        value: Obj_RCD.getValue({
                                            fieldId: 'postingperiod'
                                        })
                                    });
                                }

                                inRec.setValue({
                                    fieldId: 'currency',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'currency'
                                    })
                                });
                                inRec.setValue({
                                    fieldId: 'exchangerate',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'exchangerate'
                                    })
                                });

                                // Validacion si el Sales Rep esta acitvo
                                if (Obj_RCD.getValue({ fieldId: 'salesrep' }) != null &&
                                    Obj_RCD.getValue({ fieldId: 'salesrep' }) != '') {
                                    var booActive = search.lookupFields({
                                        type: 'employee',
                                        id: Obj_RCD.getValue({ fieldId: 'salesrep' }),
                                        columns: ['isinactive', 'issalesrep']
                                    });
                                    var isinactive = booActive.isinactive;
                                    var issalesrep = booActive.issalesrep

                                    // Valida si esta activo el empleado
                                    if ((isinactive == 'F' || isinactive == false) &&
                                        (issalesrep == 'T' || issalesrep == true)) {
                                        inRec.setValue({
                                            fieldId: 'salesrep',
                                            value: Obj_RCD.getValue({ fieldId: 'salesrep' })
                                        });
                                    }
                                }

                                /***********************************************
                                 * Segmentacion Contable de NetSuite
                                 * Campos de cabecera obligatorios
                                 * (Habilitados en prefencias de contabilidad)
                                 **********************************************/

                                // Deparment
                                if (Obj_RCD.getValue({ fieldId: 'department' }) != '' &&
                                    Obj_RCD.getValue({ fieldId: 'department' }) != null) {
                                    inRec.setValue({ fieldId: 'department', value: Obj_RCD.getValue({ fieldId: 'department' }) });
                                }
                                // Class
                                if (Obj_RCD.getValue({ fieldId: 'class' }) != '' &&
                                    Obj_RCD.getValue({ fieldId: 'class' }) != null) {
                                    inRec.setValue({ fieldId: 'class', value: Obj_RCD.getValue({ fieldId: 'class' }) });
                                }
                                // Location
                                if (Obj_RCD.getValue({ fieldId: 'location' }) != '' &&
                                    Obj_RCD.getValue({ fieldId: 'location' }) != null) {
                                    inRec.setValue({ fieldId: 'location', value: Obj_RCD.getValue({ fieldId: 'location' }) });
                                }

                                // Field Head Department
                                var linDepar = Obj_RCD.getValue({
                                    fieldId: 'department'
                                });
                                if (linDepar == '' || linDepar == null) {
                                    linDepar = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'department',
                                        line: 0
                                    });
                                }
                                if (linDepar == '' || linDepar == null) {
                                    linDepar = Obj_RCD.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'department',
                                        line: 0
                                    });
                                }
                                // Field Head Class

                                var linClass = Obj_RCD.getValue({
                                    fieldId: 'class'
                                });
                                if (linClass == '' || linClass == null) {
                                    linClass = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'class',
                                        line: 0
                                    });
                                }
                                if (linClass == '' || linClass == null) {
                                    linClass = Obj_RCD.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'class',
                                        line: 0
                                    });
                                }
                                // Field Head Location
                                var linLocat = Obj_RCD.getValue({
                                    fieldId: 'location'
                                });
                                if (linLocat == '' || linLocat == null) {
                                    linLocat = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'location',
                                        line: 0
                                    });
                                }
                                if (linLocat == '' || linLocat == null) {
                                    linLocat = Obj_RCD.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'location',
                                        line: 0
                                    });
                                }

                                // Flag para ejecutar WHT
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_apply_wht_code',
                                    value: false
                                });
                                // Campos con los tipos de Retencion
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_reteica',
                                    value: ""
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_reteiva',
                                    value: ''
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_retefte',
                                    value: ''
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_autoretecree',
                                    value: ''
                                });
                                // Campos para los importes te retencion
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_reteica_amount',
                                    value: 0
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_reteiva_amount',
                                    value: 0
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_retefte_amount',
                                    value: 0
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_retecree_amount',
                                    value: 0
                                });

                                // Actualiza el campo transaccion de referencia
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_reference_transaction',
                                    value: ID
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_reference_transaction_id',
                                    value: ID
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_reference_entity',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'entity'
                                    })
                                });

                                inRec.setValue({
                                    fieldId: 'custbody_lmry_wht_base_amount',
                                    value: amount
                                });
                                log.debug("Field_itesales",Field_itesales);
                                // Lineas
                                if (Field_itesales != '' && Field_itesales != null) {
                                    inRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                        line: 0,
                                        value: Field_itesales
                                    });
                                }
                                log.debug("Field_itesales paso","passooooo");
                                inRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: 0,
                                    value: 1
                                });
                                log.debug("flag","quantit");
                                /*inRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                line: 0,
                                value: Obj_RCD.getValue({
                                  fieldId: 'location'
                                })
                              });*/
                                inRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'price',
                                    line: 0,
                                    value: -1
                                });
                                log.debug("flag","quantit 1");
                                // Importe a insertaar
                                //log.error('item : amountresult', amountresult);
                                // Custom
                                if (amountresult != '' && amountresult != null) {
                                    inRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        line: 0,
                                        value: amountresult
                                    });
                                }
                                log.debug("flag","quantit 2");
                                // 2019-08-09 Transaction Line TaxCode
                                if (idtaxgparam != '' && idtaxgparam != null) {
                                    inRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'taxcode',
                                        line: 0,
                                        value: idtaxgparam
                                    });
                                }
                                log.debug("flag","quantit 3");
                                // Campos de cabecera obligatorios (Habilitados en prefencias de contabilidad)
                                if (linDepar != '' && linDepar != null) {
                                    inRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'department',
                                        line: 0,
                                        value: linDepar
                                    });
                                }
                                log.debug("flag","quantit 4");
                                if (linClass != '' && linClass != null) {
                                    inRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'class',
                                        line: 0,
                                        value: linClass
                                    });
                                }
                                log.debug("flag","quantit 5");
                                if (linLocat != '' && linLocat != null) {
                                    inRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'location',
                                        line: 0,
                                        value: linLocat
                                    });
                                }
                                log.debug("flag","quanti 6");
                                inRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_lmry_base_amount',
                                    line: 0,
                                    value: amount
                                });

                                /* * * * * * * * * * * * * * * * * * * * * * * * * * *
                                 * Fecha : 08 de Mayo de 2020
                                 * Se agrego el siguiente parametro disableTriggers:true
                                 * para evita le ejecucion de users events.
                                 * * * * * * * * * * * * * * * * * * * * * * * * * * */
                                // Graba el Credit Memo
                                log.debug("flag","quantit 7");
                                try {
                                    var newrec = inRec.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                                    log.debug("flag","quantit save");
                                } catch (error) {
                                    log.error("error",error)
                                }
                                
                                /************************************
                                 * Abre el Credit Memo para aplicar
                                 * a la transaccion que se le genero
                                 * la retencion.
                                 ***********************************/

                                //var applyRec = record.load({ type: Field_Transa2, id: newrec, isDynamic: true });
                                var applyRec = record.load({ type: Field_Transa2, id: newrec });
                                log.debug("flag","quantit antes de aplicar");
                                // Aplicado a
                                var inLin = applyRec.getLineCount({ sublistId: 'apply' });

                                // = = = = = = = = = = = = = = = = = = = = = = = = = = =
                                // 2021.02.26 : Desmarca el apply se ubiera uno asignado
                                // =  = = = = = = = = = = = = = = = = = = = = = = = = = =
                                log.debug("flag","aplicado");
                                for (var i = 0; i < inLin; i++) {
                                    var idTran = applyRec.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i });
                                    if (idTran) {
                                        applyRec.setSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i, value: false });
                                        log.error('newrec : ' + ID, 'Doc : ' + idTran);
                                        log.error('apply : ' + i, applyRec.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: i }));
                                    }
                                }
                                log.debug("flag","paso aplicado");
                                // 2021.02.25 : Se aplica la retencion a la transaccion
                                for (var i = 0; i < inLin; i++) {
                                    var idTran = applyRec.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: i });
                                    if (ID == idTran) {
                                        log.error('newrec : ' + ID, 'Doc : ' + idTran);
                                        log.error('apply : ' + i, applyRec.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i }));
                                        if (applyRec.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i }) == 'F') {
                                            applyRec.setSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i, value: 'T' });
                                        } else {
                                            applyRec.setSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i, value: true });
                                        }
                                        applyRec.setSublistValue({ sublistId: 'apply', fieldId: 'amount', line: i, value: amountresult });
                                        break;
                                    }
                                }

                                /* * * * * * * * * * * * * * * * * * * * * * * * * * *
                                 * Fecha : 08 de Mayo de 2020
                                 * Se agrego el siguiente parametro disableTriggers:true
                                 * para evita le ejecucion de users events.
                                 * * * * * * * * * * * * * * * * * * * * * * * * * * */

                                // Graba el Credit Memo
                                var newrec = applyRec.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });

                                // Actualiza campos de cabecera
                                record.submitFields({
                                    type: Field_Transa2,
                                    id: newrec,
                                    values: {
                                        'tranid': 'LWHT ' + newrec,
                                        'account': Obj_RCD.getValue({ fieldId: 'account' })
                                    },
                                    options: { enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true }
                                });
                            }

                            /* ---------------------------------------------
                             * Create Journal si Field_whtkind = 2
                             * ------------------------------------------ */
                            if (Field_whtkind == 2) {
                                var jeRec = record.create({
                                    type: record.Type.JOURNAL_ENTRY,
                                    isDynamic: true
                                })
                                // Formulario Personalizado
                                Field_Formsdf = runtime.getCurrentScript().getParameter({
                                    name: 'custscript_lmry_wht_journal_entry'
                                });
                                if (Field_Formsdf != '' && Field_Formsdf != null) {
                                    jeRec.setValue({
                                        fieldId: 'customform',
                                        value: Field_Formsdf
                                    });
                                }
                                // Campos Standar de NetSuite
                                jeRec.setValue({
                                    fieldId: 'subsidiary',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'subsidiary'
                                    })
                                });
                                jeRec.setValue({
                                    fieldId: 'trandate',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'trandate'
                                    })
                                });
                                if (!fAccPeriod) {
                                    jeRec.setValue({
                                        fieldId: 'postingperiod',
                                        value: Obj_RCD.getValue({
                                            fieldId: 'postingperiod'
                                        })
                                    });
                                }
                                // Tipo de cambio de la transaccion Origen
                                jeRec.setValue({
                                    fieldId: 'currency',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'currency'
                                    })
                                });
                                jeRec.setValue({
                                    fieldId: 'exchangerate',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'exchangerate'
                                    })
                                });

                                /***********************************************
                                 * Segmentacion Contable de NetSuite
                                 * Campos de cabecera obligatorios
                                 * (Habilitados en prefencias de contabilidad)
                                 **********************************************/
                                jeRec.setValue({
                                    fieldId: 'department',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'department'
                                    })
                                });
                                jeRec.setValue({
                                    fieldId: 'class',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'class'
                                    })
                                });
                                jeRec.setValue({
                                    fieldId: 'location',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'location'
                                    })
                                });

                                // Field Head Department
                                var linDepar = Obj_RCD.getValue({
                                    fieldId: 'department'
                                });
                                if (linDepar == '' || linDepar == null) {
                                    linDepar = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'department',
                                        line: 0
                                    });
                                }
                                if (linDepar == '' || linDepar == null) {
                                    linDepar = Obj_RCD.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'department',
                                        line: 0
                                    });
                                }
                                // Field Head Class
                                var linClass = Obj_RCD.getValue({
                                    fieldId: 'class'
                                });
                                if (linClass == '' || linClass == null) {
                                    linClass = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'class',
                                        line: 0
                                    });
                                }
                                if (linClass == '' || linClass == null) {
                                    linClass = Obj_RCD.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'class',
                                        line: 0
                                    });
                                }
                                // Field Head Location
                                var linLocat = Obj_RCD.getValue({
                                    fieldId: 'location'
                                });
                                if (linLocat == '' || linLocat == null) {
                                    linLocat = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'location',
                                        line: 0
                                    });
                                }
                                if (linLocat == '' || linLocat == null) {
                                    linLocat = Obj_RCD.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'location',
                                        line: 0
                                    });
                                }
                                jeRec.setValue('bookje', false);
                                // Campos Latam Ready
                                jeRec.setValue({
                                    fieldId: 'custbody_lmry_reference_transaction',
                                    value: ID
                                });
                                jeRec.setValue({
                                    fieldId: 'custbody_lmry_reference_transaction_id',
                                    value: ID
                                });
                                jeRec.setValue({
                                    fieldId: 'custbody_lmry_reference_entity',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'entity'
                                    })
                                });

                                // Linea de debito
                                jeRec.selectNewLine({
                                    sublistId: 'line'
                                });

                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    value: Field_crediacc
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'debit',
                                    value: amountresult
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'entity',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'entity'
                                    })
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'memo',
                                    value: 'Latam - WHT ' + Field_whtname
                                });
                                // Departament, Class, Location
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'department',
                                    value: linDepar
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'class',
                                    value: linClass
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'location',
                                    value: linLocat
                                });
                                jeRec.commitLine({
                                    sublistId: 'line'
                                });

                                //Linea de credito
                                jeRec.selectNewLine({
                                    sublistId: 'line'
                                });

                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    value: Field_xliabacc
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'credit',
                                    value: amountresult
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'entity',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'entity'
                                    })
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'memo',
                                    value: 'Latam - WHT ' + Field_whtname
                                });
                                // Departament, Class, Location
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'department',
                                    value: linDepar
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'class',
                                    value: linClass
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'location',
                                    value: linLocat
                                });

                                jeRec.commitLine({
                                    sublistId: 'line'
                                });

                                var journalApprovalFeat = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALJOURNAL' });
                                if ((journalApprovalFeat == 'T' || journalApprovalFeat == true) && jeRec.getField({ fieldId: "approvalstatus" })) {
                                    jeRec.setValue({
                                        fieldId: 'approvalstatus',
                                        value: 2
                                    });
                                }
                                /* * * * * * * * * * * * * * * * * * * * * * * * * * *
                                 * Fecha : 08 de Mayo de 2020
                                 * Se agrego el siguiente parametro disableTriggers:true
                                 * para evita le ejecucion de users events.
                                 * * * * * * * * * * * * * * * * * * * * * * * * * * */
                                // Graba el Journal
                                var newrec = jeRec.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                                record.submitFields({
                                    type: record.Type.JOURNAL_ENTRY,
                                    id: newrec,
                                    values: { memo: 'Latam - WHT ' + Field_whtname },
                                })
                            }
                        }
                    }
 
                    if (Number(idCountry) == 48){ // Colombia
                        createTaxResult(Obj_RCD,Field_Rate,amount,amountresult, WHTID,exchangeRate);
                    }
                    var usage = runtime.getCurrentScript().getRemainingUsage();
                    //log.error('Create_WHT_1 - getRemainingUsage ', usage);
                }
                log.debug("Create_WHT_1","end")
            } catch (err) {
                // Debug
                //log.error('Create_WHT_1 - Error: ', err);
                Library_Mail.sendemail('Create_WHT_1 - Error: ' + err, LMRY_script);
            }
        }

        /* ------------------------------------------------------------------------------------------------------
         * Applied to Credit Memo - Vendor Credit
         * Crea Transacciones en LatamReady WHT
         * --------------------------------------------------------------------------------------------------- */
        function Create_WHT_2(ID, Obj_RCD, WHTID, fAccPeriod) {
            var newObj_RCD = 0;
            try {
                if (WHTID == '' || WHTID == null) {
                    return newObj_RCD;
                }

                var idtaxgparam = '';

                var exchangeRate = getExchangeRate(Obj_RCD);
                log.error('Create_WHT_2 : exchangeRate', exchangeRate);
                var idCountry = Obj_RCD.getValue({
                    fieldId: 'custbody_lmry_subsidiary_country'
                });
                var scriptObj = runtime.getCurrentScript();

                if (Number(idCountry) == 48 || Number(idCountry) == 29) { //Colombia
                    // Realiza la una busqueda en el registro personalizado
                    // LatamReady - Setup Tax Subsidiary para validar
                    // La configuracion de la subsidiaria
                    var id_subsidiary = Obj_RCD.getValue({
                        fieldId: 'subsidiary'
                    });
                    var search_lsts = search.create({
                        type: "customrecord_lmry_setup_tax_subsidiary",
                        filters:
                            [
                                ["isinactive", "is", "F"], "AND",
                                ["custrecord_lmry_setuptax_subsidiary", "anyof", id_subsidiary]
                            ],
                        columns:
                            [
                                "custrecord_lmry_setuptax_tax_code"
                            ]
                    });
                    var result_lsts = search_lsts.run();
                    var object_lsts = result_lsts.getRange(0, 10);
                    if (object_lsts.length > 0) {
                        // Trae todos los campos
                        var row_lsts = 0;
                        idtaxgparam = object_lsts[row_lsts].getValue('custrecord_lmry_setuptax_tax_code');
                    }
                }

                // Transaccion
                var savedsearch = search.load({
                    id: 'customsearch_lmry_wht_base'
                });
                savedsearch.filters.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: [WHTID]

                }));
                var searchresult = savedsearch.run();
                var objResult = searchresult.getRange(0, 10);
                if (objResult.length > 0) {
                    // Trae todos los campos
                    var i = 0;
                    var columns = objResult[i].columns;

                    // Tipo de Transaccion
                    var typetran = Obj_RCD.getValue({
                        fieldId: 'type'
                    });

                    // Internal ID
                    var Field_Transa1 = '';
                    var Field_Formsdf = '';
                    var Field_whtname = objResult[i].getValue('name');
                    var Available_onts = '';
                    var Field_taxpoint = '';
                    var Field_itesales = '';
                    var Field_whtkind = objResult[i].getValue('custrecord_lmry_wht_kind');
                    var Field_Rate = objResult[i].getValue('custrecord_lmry_wht_coderate');
                    var Field_datfrom = objResult[i].getValue(columns[6]);
                    var Field_datuntil = objResult[i].getValue(columns[7]);
                    var Field_cminbase = objResult[i].getValue('custrecord_lmry_wht_codeminbase');
                    if (Field_cminbase == '' || Field_cminbase == null) {
                        Field_cminbase = 0;
                    }
                    var Field_crediacc = objResult[i].getValue('custrecord_lmry_wht_taxcredacc');
                    var Field_xliabacc = objResult[i].getValue('custrecord_lmry_wht_taxliabacc');
                    var Field_Custom = objResult[i].getValue(columns[4]);
                    var Field_Standar = '';

                    // Variables para Ventas - Credit Memo
                    if (typetran == 'custcred') {
                        Field_Transa1 = 'invoice';
                        Field_Formsdf = runtime.getCurrentScript().getParameter({
                            name: 'custscript_lmry_wht_invoice'
                        });
                        Available_onts = objResult[i].getValue('custrecord_lmry_wht_onsales');
                        Field_taxpoint = objResult[i].getValue('custrecord_lmry_wht_saletaxpoint');
                        Field_itesales = objResult[i].getValue('custrecord_lmry_wht_taxitem_sales');
                        Field_Standar = objResult[i].getValue(columns[12]); // custrecord_lmry_wht_salebase
                    }
                    // Variables para Compras - Vendor Credit
                    if (typetran == 'vendcred') {
                        Field_Transa1 = 'vendorbill';
                        Field_Formsdf = runtime.getCurrentScript().getParameter({
                            name: 'custscript_lmry_wht_vendor_bill'
                        });
                        Available_onts = objResult[i].getValue('custrecord_lmry_wht_onpurchases');
                        Field_taxpoint = objResult[i].getValue('custrecord_lmry_wht_purctaxpoint');
                        Field_itesales = objResult[i].getValue('custrecord_lmry_wht_taxitem_purchase');
                        Field_Standar = objResult[i].getValue(columns[16]); // custrecord_lmry_wht_purcbase
                    }
                    // Valida si el campo standar esta configurado
                    if (Field_Standar == '' || Field_Standar == null || Available_onts == false || Available_onts == 'F') {
                        //log.error('Create_WHT_2 - WHTID - Field Standar - Available_onts ', WHTID + ' - ' + Field_Standar + ' - ' + Available_onts);
                        return newObj_RCD;
                    }

                    // Importe del campo Standart
                    var amount = 0;
                    if ((Field_Standar == 'subtotal' && typetran == 'vendcred') || (Available_onts == false || Available_onts == 'F')) {
                        amount = parseFloat(Obj_RCD.getValue({
                            fieldId: 'total'
                        })) - parseFloat(Obj_RCD.getValue({
                            fieldId: 'taxtotal'
                        }));
                        amount = round2(amount);
                    } else {
                        amount = parseFloat(Obj_RCD.getValue({
                            fieldId: Field_Standar
                        }));
                    }

                    // Calculo de Campos
                    var amountresult = 0;
                    if (amount != '' && amount != null) {
                        amountresult = parseFloat(amount) * parseFloat(Field_Rate);
                        amountresult = parseFloat(amountresult) / 100;
                        //amountresult = amountresult.toFixed(2);
                        amountresult = round2(amountresult)
                        amountresult = Math.abs(amountresult);
                    }

                    // Formato de Fechas
                    var Field_DateTran = yyymmdd(Obj_RCD.getValue({
                        fieldId: 'trandate'
                    }));

                    // log.error('Create_WHT_2 - ' + typetran + ' : ' + 'Field_DateTran, Field_datfrom , Field_datuntil, Field_taxpoint', Field_DateTran + ' - ' + Field_datfrom + ' - ' + Field_datuntil + ' - ' + Field_taxpoint);
                    // log.error('Create_WHT_2 - Solo si el resultado es mayor o igual ', (parseFloat(amount) * parseFloat(Obj_RCD.getValue({
                    //   fieldId: 'exchangerate'
                    // }))) + ' >= ' + Field_cminbase + ' y ' + amountresult + '>0');

                    // Validate Create Journal or Credit Memo
                    if (Field_taxpoint == 1) {
                        if ((Field_DateTran >= Field_datfrom && Field_datfrom != '' && Field_datfrom != null) &&
                            (Field_DateTran <= Field_datuntil && Field_datuntil != '' && Field_datuntil != null) &&
                            ((parseFloat(amount) * exchangeRate) >= parseFloat(Field_cminbase) &&
                                (parseFloat(amount) * exchangeRate) > 0) &&
                            parseFloat(amountresult) > 0) {

                            /* ---------------------------------------------
                             * Create Credit Memo si Field_whtkind = 1
                             * ------------------------------------------ */
                            if (Field_whtkind == 1) {
                                var inRec = record.create({
                                    type: Field_Transa1
                                });
                                // Cuenta Contable
                                // log.error('Create_WHT_2 - ' + Field_Transa1 + '- Account', Obj_RCD.getValue({
                                //   fieldId: 'account'
                                // }));

                                // Formulario Personalizado
                                if (Field_Formsdf != '' && Field_Formsdf != null) {
                                    inRec.setValue({
                                        fieldId: 'customform',
                                        value: Field_Formsdf
                                    });
                                }

                                // Campos Standar de NetSuite

                                //********************************* Modificacion 8 de Setiembre 2019  *******************************
                                /* Decripcion: Si el feature Feature Approval Routing:Invoice esta activo, el invoice WHT al crearse
                                 se setea con el estado aprobado*/

                                //Obteniendo el estado del Feature Approval Routing: Invoice
                                var featureApprovalInvoice = runtime.getCurrentScript().getParameter({
                                    name: 'CUSTOMAPPROVALCUSTINVC'
                                });

                                //Si esta activo el feature Approval Routing Invoice
                                if (featureApprovalInvoice == 'T' && Field_Transa1 == 'invoice') {
                                    log.error('FEATURE ACTIVO INVOICE');
                                    //Se setea el campo approvalstatus del Invoice WHT como aprobado
                                    inRec.setValue({
                                        fieldId: 'approvalstatus',
                                        value: 2
                                    });
                                }

                                /* Decripcion: Si el feature Feature Approval Routing:Vendor Bill esta activo, el Bill WHT al crearse
                                se setea con el estado aprobado */

                                //Obteniendo el estado del Feature Approval Routing: Vendor Bill
                                /* var featureApprovalBill = runtime.getCurrentScript().getParameter({
                                   name: 'CUSTOMAPPROVALVENDORBILL'
                                 });*/

                                //si esta activo el feature Approval Routing Vendor Bill
                                if (/*featureApprovalBill == 'T' && */Field_Transa1 == 'vendorbill') {
                                    // log.error('sin FEATURE ACTIVO BILL');
                                    //Se setea el campo approvalstatus del Bill WHT como aprobado
                                    inRec.setValue({
                                        fieldId: 'approvalstatus',
                                        value: 2
                                    });
                                }
                                //***************************** Fin de Modificacion 8 de Setiembre 2019 ****************************
                                inRec.setValue({
                                    fieldId: 'entity',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'entity'
                                    })
                                });
                                inRec.setValue({
                                    fieldId: 'subsidiary',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'subsidiary'
                                    })
                                });
                                inRec.setValue({
                                    fieldId: 'account',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'account'
                                    })
                                });
                                inRec.setValue({
                                    fieldId: 'trandate',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'trandate'
                                    })
                                });
                                if (!fAccPeriod) {
                                    inRec.setValue({
                                        fieldId: 'postingperiod',
                                        value: Obj_RCD.getValue({
                                            fieldId: 'postingperiod'
                                        })
                                    });
                                }
                                // Tipo de cambio de la transaccion Origen
                                inRec.setValue({
                                    fieldId: 'currency',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'currency'
                                    })
                                });
                                inRec.setValue({
                                    fieldId: 'exchangerate',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'exchangerate'
                                    })
                                });
                                inRec.setValue({
                                    fieldId: 'memo',
                                    value: 'Latam - WHT ' + Field_whtname
                                });
                                inRec.setValue({
                                    fieldId: 'tranid',
                                    value: 'LTMP-' + ID
                                });

                                /***********************************************
                                 * Segmentacion Contable de NetSuite
                                 * Campos de cabecera obligatorios
                                 * (Habilitados en prefencias de contabilidad)
                                 **********************************************/
                                if (Obj_RCD.getValue({ fieldId: 'department' }) != '' &&
                                    Obj_RCD.getValue({ fieldId: 'department' }) != null) {
                                    inRec.setValue({
                                        fieldId: 'department',
                                        value: Obj_RCD.getValue({ fieldId: 'department' })
                                    });
                                }
                                if (Obj_RCD.getValue({ fieldId: 'class' }) != '' &&
                                    Obj_RCD.getValue({ fieldId: 'class' }) != null) {
                                    inRec.setValue({
                                        fieldId: 'class',
                                        value: Obj_RCD.getValue({ fieldId: 'class' })
                                    });
                                }
                                if (Obj_RCD.getValue({ fieldId: 'location' }) != '' &&
                                    Obj_RCD.getValue({ fieldId: 'location' }) != null) {
                                    inRec.setValue({
                                        fieldId: 'location',
                                        value: Obj_RCD.getValue({ fieldId: 'location' })
                                    });
                                }

                                // Field Head Department
                                var linDepar = Obj_RCD.getValue({
                                    fieldId: 'department'
                                });
                                if (linDepar == '' || linDepar == null) {
                                    linDepar = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'department',
                                        line: 0
                                    });
                                }
                                if (linDepar == '' || linDepar == null) {
                                    linDepar = Obj_RCD.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'department',
                                        line: 0
                                    });
                                }
                                // Field Head Class
                                var linClass = Obj_RCD.getValue({
                                    fieldId: 'class'
                                });
                                if (linClass == '' || linClass == null) {
                                    linClass = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'class',
                                        line: 0
                                    });
                                }
                                if (linClass == '' || linClass == null) {
                                    linClass = Obj_RCD.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'class',
                                        line: 0
                                    });
                                }
                                // Field Head Location
                                var linLocat = Obj_RCD.getValue({
                                    fieldId: 'location'
                                });
                                if (linLocat == '' || linLocat == null) {
                                    linLocat = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'location',
                                        line: 0
                                    });
                                }
                                if (linLocat == '' || linLocat == null) {
                                    linLocat = Obj_RCD.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'location',
                                        line: 0
                                    });
                                }

                                // Campos Latam Ready
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_reference_transaction',
                                    value: ID
                                });

                                inRec.setValue({
                                    fieldId: 'custbody_lmry_reference_transaction_id',
                                    value: ID
                                });

                                // Campos WHT
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_reteica',
                                    value: ''
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_reteiva',
                                    value: ''
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_retefte',
                                    value: ''
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_autoretecree',
                                    value: ''
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_reteica_amount',
                                    value: 0
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_reteiva_amount',
                                    value: 0
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_retefte_amount',
                                    value: 0
                                });
                                inRec.setValue({
                                    fieldId: 'custbody_lmry_co_retecree_amount',
                                    value: 0
                                });

                                inRec.setValue({
                                    fieldId: 'custbody_lmry_wht_base_amount',
                                    value: amount
                                });

                                // Lineas
                                inRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: 0,
                                    value: 1
                                });
                                inRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    line: 0,
                                    value: Field_itesales
                                });
                                /*inRec.setSublistValue({
                                  sublistId: 'item',
                                  fieldId: 'location',
                                  line: 0,
                                  value: Obj_RCD.getValue({
                                    fieldId: 'location'
                                  })
                                });*/
                                inRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'price',
                                    line: 0,
                                    value: -1
                                });
                                inRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    line: 0,
                                    value: amountresult
                                });

                                // 2019-08-09 Transaction Line TaxCode
                                if (idtaxgparam != '' && idtaxgparam != null) {
                                    inRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'taxcode',
                                        line: 0,
                                        value: idtaxgparam
                                    });
                                }

                                // Campos de cabecera obligatorios (Habilitados en prefencias de contabilidad)
                                inRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'department',
                                    line: 0,
                                    value: linDepar
                                });
                                inRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'class',
                                    line: 0,
                                    value: linClass
                                });
                                inRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'location',
                                    line: 0,
                                    value: linLocat
                                });

                                inRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_lmry_base_amount',
                                    line: 0,
                                    value: amount
                                });

                                /* * * * * * * * * * * * * * * * * * * * * * * * * * *
                                 * Fecha : 08 de Mayo de 2020
                                 * Se agrego el siguiente parametro disableTriggers:true
                                 * para evita le ejecucion de users events.
                                 * * * * * * * * * * * * * * * * * * * * * * * * * * */

                                // Graba la transaccion
                                var newrec = inRec.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                                newObj_RCD = newrec;

                                // Actualiza el TranId
                                record.submitFields({
                                    type: Field_Transa1,
                                    id: newrec,
                                    values: {
                                        'tranid': 'LWHT ' + newrec,
                                        'account': Obj_RCD.getValue({
                                            fieldId: 'account'
                                        })
                                    },
                                    options: { enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true }
                                });
                            }

                            /* ---------------------------------------------
                             * Create Journal si Field_whtkind = 2
                             * ------------------------------------------ */
                            if (Field_whtkind == 2) {
                                var jeRec = record.create({
                                    type: record.Type.JOURNAL_ENTRY,
                                    isDynamic: true
                                });
                                // Formulario Personalizado
                                Field_Formsdf = runtime.getCurrentScript().getParameter({
                                    name: 'custscript_lmry_wht_journal_entry'
                                });
                                if (Field_Formsdf != '' && Field_Formsdf != null) {
                                    jeRec.setValue({
                                        fieldId: 'customform',
                                        value: Field_Formsdf
                                    });

                                }
                                // Campos Standar de NetSuite
                                jeRec.setValue({
                                    fieldId: 'subsidiary',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'subsidiary'
                                    })
                                });
                                jeRec.setValue({
                                    fieldId: 'trandate',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'trandate'
                                    })
                                });
                                if (!fAccPeriod) {
                                    jeRec.setValue({
                                        fieldId: 'postingperiod',
                                        value: Obj_RCD.getValue({
                                            fieldId: 'postingperiod'
                                        })
                                    });
                                }
                                jeRec.setValue({
                                    fieldId: 'currency',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'currency'
                                    })
                                });
                                jeRec.setValue({
                                    fieldId: 'exchangerate',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'exchangerate'
                                    })
                                });
                                jeRec.setValue({
                                    fieldId: 'memo',
                                    value: 'Latam - WHT ' + Field_whtname
                                });
                                /***********************************************
                                 * Segmentacion Contable de NetSuite
                                 * Campos de cabecera obligatorios
                                 * (Habilitados en prefencias de contabilidad)
                                 **********************************************/
                                if (Obj_RCD.getValue({ fieldId: 'department' }) != '' &&
                                    Obj_RCD.getValue({ fieldId: 'department' }) != null) {
                                    jeRec.setValue({
                                        fieldId: 'department',
                                        value: Obj_RCD.getValue({
                                            fieldId: 'department'
                                        })
                                    });
                                }
                                if (Obj_RCD.getValue({ fieldId: 'class' }) != '' &&
                                    Obj_RCD.getValue({ fieldId: 'class' }) != null) {
                                    jeRec.setValue({
                                        fieldId: 'class',
                                        value: Obj_RCD.getValue({
                                            fieldId: 'class'
                                        })
                                    });
                                }
                                if (Obj_RCD.getValue({ fieldId: 'location' }) != '' &&
                                    Obj_RCD.getValue({ fieldId: 'location' }) != null) {
                                    jeRec.setValue({
                                        fieldId: 'location',
                                        value: Obj_RCD.getValue({
                                            fieldId: 'location'
                                        })
                                    });
                                }

                                // Field Head Department
                                var linDepar = Obj_RCD.getValue({
                                    fieldId: 'department'
                                });
                                if (linDepar == '' || linDepar == null) {
                                    linDepar = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'department',
                                        line: 0
                                    });
                                }
                                if (linDepar == '' || linDepar == null) {
                                    linDepar = Obj_RCD.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'department',
                                        line: 0
                                    });
                                }
                                // Field Head Class
                                var linClass = Obj_RCD.getValue({
                                    fieldId: 'class'
                                });
                                if (linClass == '' || linClass == null) {
                                    linClass = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'class',
                                        line: 0
                                    });
                                }
                                if (linClass == '' || linClass == null) {
                                    linClass = Obj_RCD.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'class',
                                        line: 0
                                    });
                                }
                                // Field Head Location
                                var linLocat = Obj_RCD.getValue({
                                    fieldId: 'location'
                                });
                                if (linLocat == '' || linLocat == null) {
                                    linLocat = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'location',
                                        line: 0
                                    });
                                }
                                if (linLocat == '' || linLocat == null) {
                                    linLocat = Obj_RCD.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'location',
                                        line: 0
                                    });
                                }
                                jeRec.setValue('bookje', false);
                                // Campos Latam Ready
                                jeRec.setValue({
                                    fieldId: 'custbody_lmry_reference_transaction',
                                    value: ID
                                });
                                jeRec.setValue({
                                    fieldId: 'custbody_lmry_reference_transaction_id',
                                    value: ID
                                });
                                jeRec.setValue({
                                    fieldId: 'custbody_lmry_reference_entity',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'entity'
                                    })
                                });

                                // Linea de debito
                                jeRec.selectNewLine({
                                    sublistId: 'line'
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    value: Field_crediacc
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'credit',
                                    value: amountresult
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'entity',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'entity'
                                    })
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'memo',
                                    value: 'Latam - WHT ' + Field_whtname
                                });
                                // Segmentacion de Departament, Class, Location
                                if (linDepar != '' && linDepar != null) {
                                    jeRec.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'department',
                                        value: linDepar
                                    });
                                }
                                if (linClass != '' && linClass != null) {
                                    jeRec.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'class',
                                        value: linClass
                                    });
                                }
                                if (linLocat != '' && linLocat != null) {
                                    jeRec.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'location',
                                        value: linLocat
                                    });
                                }
                                jeRec.commitLine({
                                    sublistId: 'line'
                                });

                                // Linea de credito
                                jeRec.selectNewLine({
                                    sublistId: 'line'
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    value: Field_xliabacc
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'debit',
                                    value: amountresult
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'entity',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'entity'
                                    })
                                });
                                jeRec.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'memo',
                                    value: 'Latam - WHT ' + Field_whtname
                                });
                                // Segmentacion de Departament, Class, Location
                                if (linDepar != '' && linDepar != null) {
                                    jeRec.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'department',
                                        value: linDepar
                                    });
                                }
                                if (linClass != '' && linClass != null) {
                                    jeRec.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'class',
                                        value: linClass
                                    });
                                }
                                if (linLocat != '' && linLocat != null) {
                                    jeRec.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'location',
                                        value: linLocat
                                    });
                                }

                                jeRec.commitLine({
                                    sublistId: 'line'
                                });

                                var journalApprovalFeat = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALJOURNAL' });
                                if ((journalApprovalFeat == 'T' || journalApprovalFeat == true) && jeRec.getField({ fieldId: "approvalstatus" })) {
                                    jeRec.setValue({
                                        fieldId: 'approvalstatus',
                                        value: 2
                                    });
                                }
                                /* * * * * * * * * * * * * * * * * * * * * * * * * * *
                                 * Fecha : 08 de Mayo de 2020
                                 * Se agrego el siguiente parametro disableTriggers:true
                                 * para evita le ejecucion de users events.
                                 * * * * * * * * * * * * * * * * * * * * * * * * * * */
                                // Graba el Journal
                                var newrec = jeRec.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                                record.submitFields({
                                    type: record.Type.JOURNAL_ENTRY,
                                    id: newrec,
                                    values: { memo: 'Latam - WHT ' + Field_whtname },
                                })
                            }
                        }
                    }
                    var usage = runtime.getCurrentScript().getRemainingUsage();
                }

                if (Number(idCountry) == 48){ // Colombia
                    createTaxResult(Obj_RCD,Field_Rate,amount,amountresult, WHTID,exchangeRate);
                }
            } catch (err) {
                // Debug
                Library_Mail.sendemail('Create_WHT_2 - Error: ' + err, LMRY_script);
            }
            return Number(newObj_RCD);
        }

        /* ------------------------------------------------------------------------------------------------------
         * Aplica la Bill y Invoice => Credit Memo / Vendor Credit
         * --------------------------------------------------------------------------------------------------- */
        function ApplyInvoice(idTransaction, typeTransaction, transToApply, transToDelete) {
            try {
                log.error('ApplyInvoice : idTransaction - ' + idTransaction, 'typeTransaction - ' + typeTransaction);

                var recTransaction = record.load({ type: typeTransaction, id: idTransaction, isDynamic: true });
                var numberApply = recTransaction.getLineCount({ sublistId: 'apply' });

                for (var i = 0; i < numberApply; i++) {
                    var apply = recTransaction.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i });
                    var recID = recTransaction.getSublistValue({ sublistId: 'apply', fieldId: 'doc', line: i });
                    if (apply == 'T' || apply == true) {
                        //Se desaplican los invoice/bills para poder eliminarlos despues
                        if (transToDelete.indexOf(Number(recID)) != -1) {
                            recTransaction.selectLine({ sublistId: 'apply', line: i });
                            recTransaction.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: false });
                        }
                    }

                    //se aplican las nuevas transacciones
                    if (transToApply.indexOf(Number(recID)) != -1) {
                        recTransaction.selectLine({ sublistId: 'apply', line: i });
                        recTransaction.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                    }
                }

                /* * * * * * * * * * * * * * * * * * * * * * * * * * *
                 * Fecha : 08 de Mayo de 2020
                 * Se agrego el siguiente parametro disableTriggers:true
                 * para evita le ejecucion de users events.
                 * * * * * * * * * * * * * * * * * * * * * * * * * * */
                recTransaction.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });

                //Se eliminan las transacciones aplicadas antiguas
                for (var i = 0; i < transToDelete.length; i++) {
                    record.delete({
                        type: GENERATED_TRANSACTION[typeTransaction],
                        id: transToDelete[i]
                    });
                }
            } catch (err) {

                Library_Mail.sendemail('ApplyInvoice - Error: ' + err, LMRY_script);
            }

            return true;
        }

        function getTransactionsToDelete(idTransaction, typeTransaction) {
            var transactions = [];
            var searchTransactions = search.create({
                type: typeTransaction,
                filters: [
                    ['mainline', 'is', 'T'], 'AND',
                    ['custbody_lmry_reference_transaction_id', 'equalto', idTransaction], 'AND',
                    ['memo', 'startswith', MEMO_WHT]
                ],
                columns: ['internalid']
            });

            var results = searchTransactions.run().getRange(0, 1000);

            if (results && results.length) {
                for (var i = 0; i < results.length; i++) {
                    var internalid = results[i].getValue('internalid');
                    transactions.push(Number(internalid));
                }
            }
            return transactions;
        }

        /* ------------------------------------------------------------------------------------------------------
         * Elimina los Journal Entry creados
         * --------------------------------------------------------------------------------------------------- */
        function Delete_JE(ID) {

            try {
                // Valida que el Internal ID no este vacio
                if (ID == '' || ID == null) {
                    return true;
                }
                // Filtros
                var filters = new Array();
                filters[0] = search.createFilter({
                    name: 'mainline',
                    operator: search.Operator.IS,
                    values: ['T']
                });
                filters[1] = search.createFilter({
                    name: 'custbody_lmry_reference_transaction_id',
                    operator: search.Operator.EQUALTO,
                    values: [ID]
                });

                // Columnas
                var columns = new Array();
                columns[0] = search.createColumn({
                    name: 'internalid',
                });
                // Realiza un busqueda para mostrar los campos
                var searchjournal = search.create({
                    type: search.Type.JOURNAL_ENTRY,
                    columns: columns,
                    filters: filters
                });
                searchjournal = searchjournal.run().getRange(0, 1000);
                if (searchjournal != null && searchjournal != '') {
                    if (searchjournal.length == 0) {
                        return true;
                    }
                    // Auxiliar ID
                    var aux = 0;
                    for (var i = 0; i < searchjournal.length; i++) {
                        var idjournal = searchjournal[i].getValue('internalid');
                        if (idjournal != aux) {
                            aux = idjournal;
                            record.delete({
                                type: record.Type.JOURNAL_ENTRY,
                                id: idjournal
                            });

                            // Mensaje usuario
                            var usage = runtime.getCurrentScript().getRemainingUsage();
                            //log.error('Delete_JE - getRemainingUsage', idjournal + ' , ' + usage);
                        }
                    }
                }
            } catch (err) {
                Library_Mail.sendemail('Delete_JE - Error: ' + err, LMRY_script);
            }
        }

        /* ------------------------------------------------------------------------------------------------------
         * Elimina los Credit Memos creados
         * --------------------------------------------------------------------------------------------------- */
        function Delete_CM(type, ID) {
            try {
                // Valida que el Internal ID no este vacio
                if (ID == '' || ID == null) {
                    return true;
                }
                /* Se realiza una busqueda para ver que campos se ocultan */
                // Filtros
                var filters = new Array();
                filters[0] = search.createFilter({
                    name: 'mainline',
                    operator: search.Operator.IS,
                    values: ['T']
                });
                filters[1] = search.createFilter({
                    name: 'custbody_lmry_reference_transaction_id',
                    operator: search.Operator.EQUALTO,
                    values: [ID]
                });
                filters[2] = search.createFilter({
                    name: 'memo',
                    operator: search.Operator.STARTSWITH,
                    values: ['Latam - WHT']
                });

                // Columnas
                var columns = new Array();
                columns[0] = search.createColumn({
                    name: 'internalid'
                });

                // Realiza un busqueda para mostrar los campos
                var searchcremem = search.create({
                    type: type,
                    columns: columns,
                    filters: filters
                });
                searchcremem = searchcremem.run().getRange(0, 1000);
                if (searchcremem != null && searchcremem != '') {
                    if (searchcremem.length == 0) {
                        return true;
                    }
                    // Auxiliar ID
                    var aux = 0;
                    for (var i = 0; i < searchcremem.length; i++) {
                        var idcremem = searchcremem[i].getValue('internalid');
                        record.delete({
                            type: type,
                            id: idcremem
                        });

                        // Mensaje usuario
                        var usage = runtime.getCurrentScript().getRemainingUsage();
                        //log.error('Delete_CM - ' + type + ' - getRemainingUsage', idcremem + ' , ' + usage);
                    }
                }
            } catch (err) {
                // Debug
                //log.error('Delete_CM - ' + type + ' - Error: ', err);
                Library_Mail.sendemail('Delete_CM - ' + type + ' - Error: ' + err, LMRY_script);
            }
        }
        /* ------------------------------------------------------------------------------------------------------
         * Raliza una busqueda de dato2 en el arreglo dato1
         * --------------------------------------------------------------------------------------------------- */
        function seekarray(dato1, dato2) {
            var swresult = false;
            for (var i = 0; i < dato1.length; i++) {
                if (parseInt(dato1[i]) == parseInt(dato2)) {
                    swresult = true;
                    break;
                }
            }
            return swresult;
        }
        /* ------------------------------------------------------------------------------------------------------
         * Formatea el campo fecha en YYYYMMDD
         * --------------------------------------------------------------------------------------------------- */
        function yyymmdd(date) {

            if (date == '' || date == null) {
                return '';
            }

            //log.error('yyymmdd date', date);

            var year = date.getFullYear();

            var month = "" + (date.getMonth() + 1);

            if (month.length < 2)
                month = "0" + month;

            var date = "" + date.getDate();
            if (date.length < 2)
                date = "0" + date;

            var fe = '' + year + "" + month + "" + date;

            return fe;
        }

        function getExchangeRate(recordObj) {
            /*******************************************************************************************
             * Obtención del ExchangeRate de la transaccion o Multibook para la conversión a moneda base
             *******************************************************************************************/
            var featureMB = runtime.isFeatureInEffect({
                feature: "MULTIBOOK"
            });
            var featureSubs = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            var exchangeRate = 1;
            var currency = recordObj.getValue({
                fieldId: 'currency'
            });
            var exchangerateTran = recordObj.getValue({
                fieldId: 'exchangerate'
            });
            var subsidiary = recordObj.getValue({
                fieldId: 'subsidiary'
            });

            var currencySetup = 0;
            var searchSetupSubsidiary = search.create({
                type: "customrecord_lmry_setup_tax_subsidiary",
                filters: [['isinactive', 'is', 'F']],
                columns: ['custrecord_lmry_setuptax_subsidiary', 'custrecord_lmry_setuptax_currency']
            });
            if (featureSubs) {
                searchSetupSubsidiary.filters.push(search.createFilter({
                    name: 'custrecord_lmry_setuptax_subsidiary',
                    operator: 'is',
                    values: subsidiary
                }));
            }
            searchSetupSubsidiary = searchSetupSubsidiary.run().getRange({
                start: 0,
                end: 1000
            });


            if (searchSetupSubsidiary.length != null && searchSetupSubsidiary.length != '') {
                currencySetup = searchSetupSubsidiary[0].getValue({
                    name: 'custrecord_lmry_setuptax_currency'
                });
            }

            if (featureSubs && featureMB) { // OneWorld y Multibook
                var currencySubs = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['currency']
                });
                currencySubs = currencySubs.currency[0].value;

                var lineasBook = recordObj.getLineCount({
                    sublistId: 'accountingbookdetail'
                });

                if (currencySubs != currencySetup && currencySetup != '' && currencySetup != null) {
                    if (lineasBook != null && lineasBook != '') {
                        for (var i = 0; i < lineasBook; i++) {
                            var lineaCurrencyMB = recordObj.getSublistValue({
                                sublistId: 'accountingbookdetail',
                                fieldId: 'currency',
                                line: i
                            });

                            if (lineaCurrencyMB == currencySetup) {
                                exchangeRate = recordObj.getSublistValue({
                                    sublistId: 'accountingbookdetail',
                                    fieldId: 'exchangerate',
                                    line: i
                                });
                                break;
                            }
                        }
                    }
                } else { // No esta configurado Setup Tax Subsidiary
                    exchangeRate = exchangerateTran;
                }
            } else { // No es OneWorld o no tiene Multibook
                exchangeRate = exchangerateTran;
            }
            return exchangeRate;
        }

        function obtenerAmount(recordObj, amount) {
            var amountSalida = 1;
            var featureSubs = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            var currency = recordObj.getValue({
                fieldId: 'currency'
            });
            var subsidiary = recordObj.getValue({
                fieldId: 'subsidiary'
            });

            var currencySub = search.lookupFields({
                type: 'subsidiary',
                id: subsidiary,
                columns: ['currency']
            });
            currencySub = currencySub.currency[0].value;

            var currencySetup = 0;
            var searchSetupSubsidiary = search.create({
                type: "customrecord_lmry_setup_tax_subsidiary",
                filters: [['isinactive', 'is', 'F']],
                columns: ['custrecord_lmry_setuptax_subsidiary', 'custrecord_lmry_setuptax_currency']
            });
            if (featureSubs) {
                searchSetupSubsidiary.filters.push(search.createFilter({
                    name: 'custrecord_lmry_setuptax_subsidiary',
                    operator: 'is',
                    values: subsidiary
                }));
            }
            searchSetupSubsidiary = searchSetupSubsidiary.run().getRange({
                start: 0,
                end: 1000
            });

            if (searchSetupSubsidiary.length != null && searchSetupSubsidiary.length != '') {
                currencySetup = searchSetupSubsidiary[0].getValue({
                    name: 'custrecord_lmry_setuptax_currency'
                });
            }

            if (currency == currencySetup) {
                amountSalida = amount;
            } else {
                var cm_book = recordObj.getLineCount({
                    sublistId: 'accountingbookdetail'
                });

                var exchangeRate = 1;
                for (var j = 0; j < cm_book; j++) {
                    var curr = recordObj.getSublistValue({
                        sublistId: 'accountingbookdetail',
                        fieldId: 'currency',
                        line: j
                    });
                    if (currencySetup == curr) {
                        exchangeRate = recordObj.getSublistValue({
                            sublistId: 'accountingbookdetail',
                            fieldId: 'exchangerate',
                            line: j
                        });
                        break;
                    }
                }
                amountSalida = amount / exchangeRate;
            }
            return amountSalida;
        }


        function round2(num) {
            if (num >= 0) {
                return parseFloat(Math.round(parseFloat(num) * 1e2 + 1e-3) / 1e2);
            } else {
                return parseFloat(Math.round(parseFloat(num) * 1e2 - 1e-3) / 1e2);
            }
        }

        /* ------------------------------------------------------------------------------------------------------
        * Funcion que obtiene el subtype del tipo de retencion que se aplica a la transaccion.
        * --------------------------------------------------------------------------------------------------- */
        function getSubTypeWHT(WHTID) {

            var setupWhtSubType = {
                text: "",
                value: 0,
                description: ""
            };
            var whtCodeSearch = search.create({
                type: "customrecord_lmry_wht_code",
                filters:
                    [
                        ["internalid", "anyof", WHTID]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "formulatext",
                            formula: "{custrecord_lmry_wht_types.custrecord_lmry_wht_subtype}",
                            label: "subtype"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{custrecord_lmry_wht_types.custrecord_lmry_wht_subtype.id}",
                            label: "subtype"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{custrecord_lmry_wht_codedesc}",
                            label: "description"
                        })
                    ]
            });

            whtCodeSearch.run().each(function (result) {
                var columns = result.columns;
                setupWhtSubType.text = result.getValue(columns[0]);
                setupWhtSubType.value = result.getValue(columns[1]);
                setupWhtSubType.description = result.getValue(columns[2]);
            });
            return setupWhtSubType;
        }

        /* ------------------------------------------------------------------------------------------------------
        * Funcion que estructura el campo LATAM - ACCOUNTING BOOKS de un tax results
        * --------------------------------------------------------------------------------------------------- */
        function getAccountingBooks(recordObj) {
            var auxBookMB = 0;
            var auxExchangeMB = recordObj.getValue({ fieldId: "exchangerate" });
            var featureMB = runtime.isFeatureInEffect({
                feature: "MULTIBOOK"
            });
            if (featureMB) {
                var lineasBook = recordObj.getLineCount({ sublistId: "accountingbookdetail" });
                if (lineasBook != null && lineasBook !== "") {
                    for (var j = 0; j < lineasBook; j++) {
                        var lineaBook = recordObj.getSublistValue({ sublistId: "accountingbookdetail", fieldId: "accountingbook", line: j });
                        var lineaExchangeRate = recordObj.getSublistValue({ sublistId: "accountingbookdetail", fieldId: "exchangerate", line: j });
                        auxBookMB = auxBookMB + "|" + lineaBook;
                        auxExchangeMB = auxExchangeMB + "|" + lineaExchangeRate;
                    }
                }
            } // Fin Multibook

            return auxBookMB + "&" + auxExchangeMB;
        }

        /* ------------------------------------------------------------------------------------------------------
        * Funcion que crea tax result relacionado a las retenciones de cabecera para el pais de Colombia.
        * --------------------------------------------------------------------------------------------------- */
        function createTaxResult(recordTransaction, rateWht, amount, amountWht, idWHT, exchangeRate) {
            try {
                var subtype = getSubTypeWHT(idWHT);
                var multibook = getAccountingBooks(recordTransaction);
                var recordSummary = record.create({ type: 'customrecord_lmry_br_transaction', isDynamic: false });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_br_related_id', value: String(recordTransaction.id) });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_br_transaction', value: recordTransaction.id });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_br_type', value: subtype.text });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_br_type_id', value: subtype.value });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_base_amount', value: amount });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_br_total', value: amountWht });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_br_percent', value: parseFloat(rateWht) / 100 });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_total_item', value: 'Total' });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_accounting_books', value: multibook });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_tax_description', value: subtype.description });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_total_base_currency', value: amountWht * exchangeRate });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_base_amount_local_currc', value: amount * exchangeRate });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_amount_local_currency', value: amountWht * exchangeRate });
                recordSummary.setValue({ fieldId: 'custrecord_lmry_tax_type', value: '1' });

                var idRecordSummary = recordSummary.save({ disableTriggers: true, ignoreMandatoryFields: true });

                log.debug('tax result creado', idRecordSummary);
            } catch (error) {
                log.error("[createTaxResult] error:",error)
            }


        }
        /* ------------------------------------------------------------------------------------------------------
        * Funcion que permite eliminar los tax results.
        * --------------------------------------------------------------------------------------------------- */
        function deleteTaxResults(idTransaction) {
            log.debug('deleteTaxResults', "deleteTaxResults");
            log.debug('deleteTaxResults idTransaction', idTransaction);
            log.debug('deleteTaxResults idTransaction typeof ', typeof idTransaction);

            var searchTaxResult = search.create({
                type: 'customrecord_lmry_br_transaction',
                filters: [
                    ["custrecord_lmry_br_related_id","is",String(idTransaction)]
                ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var searchResultCount = searchTaxResult.runPaged().count;
            log.debug("searchResultCount", searchResultCount)
            searchTaxResult.run().each(function (result) {
                var columns = result.columns;
                var internalid = result.getValue(columns[0]);

                record.delete({
                    type: 'customrecord_lmry_br_transaction',
                    id: internalid
                });
                log.debug('Registro eliminado', 'ID del registro eliminado: ' + internalid);
                return true;
            });
            log.debug('deleteTaxResults', "deleteTaxResults end");
        }

        return {
            Create_WHT_Latam: Create_WHT_Latam,
            Search_WHT: Search_WHT,
            Create_WHT_1: Create_WHT_1,
            Create_WHT_2: Create_WHT_2,
            ApplyInvoice: ApplyInvoice,
            Delete_JE: Delete_JE,
            Delete_CM: Delete_CM,
            seekarray: seekarray,
            yyymmdd: yyymmdd,
            getExchangeRate: getExchangeRate,
            getTransactionsToDelete: getTransactionsToDelete,
            round2: round2
        };

    });