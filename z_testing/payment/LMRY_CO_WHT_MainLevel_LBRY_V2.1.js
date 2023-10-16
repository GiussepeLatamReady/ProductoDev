/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_CO_WHT_MainLevel_LBRY_V2.1.js               ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Aug 08 2022  LatamReady    Use Script 2.1           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/log', 'N/record', 'N/search', 'N/runtime', 'N/format'],

    function (log, record, search, runtime, format) {

        const LMRY_script = 'LMRY_CO_WHT_MainLevel_LBRY_V2.1';
        const MEMO_WHT = 'Latam - WHT';
        const GENERATED_TRANSACTION = {
            'invoice': 'creditmemo', 'vendorbill': 'vendorcredit',
            'creditmemo': 'invoice', 'vendorcredit': 'vendorbill'
        };

        /* ------------------------------------------------------------------------------------------------------
         * Creacion del WHT Latam
         * --------------------------------------------------------------------------------------------------- */
        function Create_WHT_Latam(Transaction, ID, Payment, params) {

            let resultWHT = { 'reteamountToDiscount': 0 };

            // Abre el Invoice y actualiza campos
            let Obj_RCD = record.load({
                type: Transaction,
                id: ID
            });
            // Verifica si se va a generar WHT
            let createWHT = Obj_RCD.getValue({
                fieldId: 'custbody_lmry_apply_wht_code'
            });
            if (createWHT === 'F' || createWHT === false) {
                createWHT = null;
                return resultWHT;
            }

            // Verifica si se va a generar WHT
            let approvalstatus = Obj_RCD.getValue({
                fieldId: 'approvalstatus'
            });
            if (approvalstatus != null && approvalstatus !== "" && approvalstatus !== "2") {
                return resultWHT;
            }
            
            // Custom Field for Colombia

            let prorateo = 0;

            if (Payment != null) {
                prorateo = Payment['amountpaid'] / Payment['totalamount'];
                log.debug('prorateo', prorateo);
            }

            log.debug('params', params);

            if (params === '' || params == null) {
                return resultWHT;
            }

            if (typeof (params) === 'string') {
                params = JSON.parse(params);
            }

            //Elimina tax result antes de volver a calcular las retenciones
            deleteTaxResults(ID);

            let reteamountToDiscount = 0;

            let RETEICA = Payment['reteica'] || '';
            let RETEIVA = Payment['reteiva'] || '';
            let RETEFTE = Payment['retefte'] || '';

            let resultRETEICA = Search_WHT(Transaction, ID, Obj_RCD, RETEICA, prorateo, params);
            log.debug('resultRETEICA', resultRETEICA);

            if (resultRETEICA !== '' && resultRETEICA != null) {
                reteamountToDiscount += parseFloat(resultRETEICA['amountToDiscount'])
            }

            let resultRETEIVA = Search_WHT(Transaction, ID, Obj_RCD, RETEIVA, prorateo, params);
            log.debug('resultRETEIVA', resultRETEIVA);

            if (resultRETEIVA !== '' && resultRETEIVA != null) {
                reteamountToDiscount += parseFloat(resultRETEIVA['amountToDiscount'])
            }

            let resultRETEFTE = Search_WHT(Transaction, ID, Obj_RCD, RETEFTE, prorateo, params);
            log.debug('resultRETEFTE', resultRETEFTE);

            if (resultRETEFTE !== '' && resultRETEFTE != null) {
                reteamountToDiscount += parseFloat(resultRETEFTE['amountToDiscount']);
            }

            resultWHT['reteamountToDiscount'] = reteamountToDiscount;

            // let RETECRE = Obj_RCD.getValue({ fieldId: 'custbody_lmry_co_autoretecree' });
            // Search_WHT(Transaction, ID, Obj_RCD, RETECRE);

            // Crea Transacciones solo para Invoice y Vendor Bill
            if (Transaction === 'invoice' || Transaction === 'vendorbill') {

                // Custom Field for Colombia
                //    Create_WHT_1(ID, Obj_RCD, RETECRE);
                Create_WHT_1(ID, Obj_RCD, RETEICA, prorateo, params);
                Create_WHT_1(ID, Obj_RCD, RETEIVA, prorateo, params);
                Create_WHT_1(ID, Obj_RCD, RETEFTE, prorateo, params);

            }

            // Crea Transacciones solo para Credit Memo y Vendor Credit
            if (Transaction === 'creditmemo' || Transaction === 'vendorcredit') {
                //Se obtienen los invoices/bills que se deben eliminar antes de generar las nuevas transacciones
                let transToDelete = getTransactionsToDelete(ID, GENERATED_TRANSACTION[Transaction]);

                // Captura facturas creadas
                let arApply = [];

                // Custom Field for Colombia
                // arApply[0] = Create_WHT_2(ID, Obj_RCD, RETEICA);
                // arApply[1] = Create_WHT_2(ID, Obj_RCD, RETEIVA);
                // arApply[2] = Create_WHT_2(ID, Obj_RCD, RETEFTE);
                // arApply[3] = Create_WHT_2(ID, Obj_RCD, RETECRE);

                // // Custom Field for Bolivia
                // arApply[4] = Create_WHT_2(ID, Obj_RCD, RETEIT);
                // arApply[5] = 0;

                // // Solo en Vendor
                // if (Transaction === 'vendorcredit') {
                //   arApply[5] = Create_WHT_2(ID, Obj_RCD, RETEIU);
                // }

                // // Custom Field for Paraguay
                // arApply[6] = Create_WHT_2(ID, Obj_RCD, RETEIR);
                // arApply[7] = Create_WHT_2(ID, Obj_RCD, RETEIV);

                // Aplica la Bill y Invoice
                ApplyInvoice(ID, Transaction, arApply, transToDelete);
            }

            // Libera variable
            Obj_RCD = null;

            return resultWHT;
        }

        /* ------------------------------------------------------------------------------------------------------
         * Realiza la busqueda en LatamReady WHT
         * --------------------------------------------------------------------------------------------------- */
        function Search_WHT(Transaction, ID, Obj_RCD, WHTID, Prorateo, params) {
            try {

                let resultJson = { 'amount_base': 0, 'amountToDiscount': 0 };

                if (WHTID === '' || WHTID == null) {
                    return resultJson;
                }


                // Transaccion
                let savedsearch = search.load({
                    id: 'customsearch_lmry_wht_base'
                });

                //filters
                savedsearch.filters.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: [WHTID],
                }));

                let searchresult = savedsearch.run();

                //resultados
                let objResult = searchresult.getRange(0, 10);
                if (objResult.length > 0) {
                    // Trae todos los campos
                    let i = 0;
                    let columns = objResult[i].columns;
                    // Tipo de Transaccion
                    let typetran = Obj_RCD.getValue({
                        fieldId: 'type'
                    });

                    // Internal ID
                    let Field_whtname = objResult[i].getValue('name');
                    let Field_Rate = 0;
                    // rate
                    if (objResult[i].getValue('custrecord_lmry_wht_coderate') !== '' &&
                        objResult[i].getValue('custrecord_lmry_wht_coderate') != null) {
                        Field_Rate = parseFloat(objResult[i].getValue('custrecord_lmry_wht_coderate'));
                    }
                    //efective Form
                    let Field_datfrom = objResult[i].getValue(columns[6]);
                    //valid until
                    let Field_datuntil = objResult[i].getValue(columns[7]);
                    // tax type: WHT amount custom field
                    let Field_Custom = objResult[i].getValue(columns[4]);

                    // wht tax type
                    let Field_type = objResult[i].getValue('custrecord_lmry_wht_types');
                    log.debug('Field_type', Field_type);

                    // WHT kind
                    let Field_whtkind = String(objResult[i].getValue('custrecord_lmry_wht_kind'));
                    log.debug('Field_whtkind', Field_whtkind);

                    // log.debug('Field_Custom 257', Field_Custom);
                    let Field_cminbase = 0;
                    // minimo amount of base
                    if (objResult[i].getValue('custrecord_lmry_wht_codeminbase') !== '' &&
                        objResult[i].getValue('custrecord_lmry_wht_codeminbase') != null) {
                        Field_cminbase = parseFloat(objResult[i].getValue('custrecord_lmry_wht_codeminbase'));
                    }

                    //Exchange RATE
                    let exchangeRate = getExchangeRate(Obj_RCD, params);

                    let date_ = params['date'];
                    date_ = format.parse({
                        value: date_,
                        type: format.Type.DATE
                    });
                    // Formato de Fechas
                    let Field_DateTran = yyymmdd(date_);

                    // Variables para Ventas
                    let Field_Standar = '';
                    if (typetran === 'custinvc' || typetran === 'custcred') {
                        Field_Standar = objResult[i].getValue(columns[12]); // custrecord_lmry_wht_salebase
                    }
                    // Variables para Compras
                    if (typetran === 'vendbill' || typetran === 'vendcred') {
                        Field_Standar = objResult[i].getValue(columns[16]); // custrecord_lmry_wht_purcbase
                    }

                    // Valida si el campo standar esta configurado
                    if (Field_Standar === '' || Field_Standar == null) {
                        return resultJson;
                    }

                    // Importe del campo Standart
                    let amount;
                    let auximp;

                    log.debug('Field_Standar', Field_Standar);

                    if (Field_Standar === 'subtotal' && (typetran === 'vendbill' || typetran === 'vendcred')) {
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
                    //!! validación del monto con el base amount min
                    let tmpAmount = parseFloat(amount) * exchangeRate;

                    amount = amount * Prorateo;
                    auximp = parseFloat(amount);

                    // log.debug('amount 309 - 320', amount);
                    // log.debug('auximp 322', auximp);

                    // Calculo de Campos
                    let amountresult = 0;
                    let amount_base = 0;
                    if (amount !== '' && amount != null) {
                        // Sin tipo de cambio
                        amount_base = parseFloat(auximp) * parseFloat(Field_Rate);
                        amount_base = parseFloat(amount_base) / 100;
                        amount_base = round2(amount_base);

                        // Con tipo de cambio
                        amountresult = parseFloat(amount) * parseFloat(Field_Rate);
                        amountresult = parseFloat(amountresult) / 100;
                        amountresult = round2(amountresult);
                        amountresult = amountresult * exchangeRate;
                        amountresult = round2(amountresult);
                    }
                    // log.debug('amountbase - 335', amount_base);
                    // log.debug('amountresult - 341', amountresult);

                    // Debe estar dentro del rango
                    // El importe debe ser mayor al minimo y mayor a cero
                    // log.debug('tmpAmount - 324', tmpAmount);
                    log.debug('Search_WHT - ' + typetran + ' : ' + Field_datfrom + ' <= ' + Field_DateTran + ' <= ' + Field_datuntil,
                        'Search_WHT - Solo si es mayor o igual ' + tmpAmount + ' >= ' + Field_cminbase +
                        ' y ' + amountresult + ' > 0');

                    // Valida resultados
                    if ((Field_DateTran >= Field_datfrom && Field_DateTran <= Field_datuntil) &&
                        (Field_datfrom !== '' && Field_datfrom != null) &&
                        (Field_datuntil !== '' && Field_datuntil != null) &&
                        (tmpAmount >= parseFloat(Field_cminbase) && tmpAmount > 0) &&
                        parseFloat(amountresult) > 0) {

                        resultJson['amountresult'] = amountresult;
                        let amountCreditM = getAmountsPrevius(ID, Field_whtname, Field_type, Obj_RCD);
                        // log.debug('amountCreditM', amountCreditM);
                        amountresult += amountCreditM;

                        let arrJSon = {};

                        arrJSon[Field_Custom] = amountresult;
                        if (Field_type === '1') {
                            arrJSon['custbody_lmry_co_reteica'] = WHTID;
                        } else if (Field_type === '2') {
                            arrJSon['custbody_lmry_co_reteiva'] = WHTID;
                        } else if (Field_type === '3') {
                            arrJSon['custbody_lmry_co_retefte'] = WHTID;
                        }

                        // let arrJSon = '{"' + Field_Custom + '":"' + amountresult + '"}';
                        // arrJSon = JSON.parse(arrJSon);
                        log.debug('arrJSon', arrJSon);

                        /* * * * * * * * * * * * * * * * * * * * * * * * * * *
                         * Fecha : 08 de Mayo de 2020
                         * Se agrego el siguiente parametro disableTriggers:true
                         * para evita le ejecucion de users events.
                         * * * * * * * * * * * * * * * * * * * * * * * * * * */
                        // Busqueda de credit memos o journals

                        // Actualiza el campo WHT Amout
                        record.submitFields({
                            type: Transaction,
                            id: ID,
                            values: arrJSon,
                            options: { enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true }
                        });

                    } else {
                        let arrJSon = '{"' + Field_Custom + '":"0"}';
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

                    // Devuelve calculo
                    resultJson['amount_base'] = amount_base;
                    if (Field_whtkind !== "2") {
                        resultJson['amountToDiscount'] = amount_base;
                    }

                    return resultJson;
                }
            } catch (err) {

                log.error(LMRY_script, 'Search_WHT - Error: ' + err);
                // Devuelve
                return resultJson;
            }
        }

        /* ------------------------------------------------------------------------------------------------------
         * Applied to Invoice - Bill
         * Crea Transacciones en LatamReady WHT
         * --------------------------------------------------------------------------------------------------- */
        function Create_WHT_1(ID, Obj_RCD, WHTID, Prorateo, params) {

            try {
                if (WHTID === '' || WHTID == null) {
                    return null;
                }

                // TaxCode para la linea
                let idtaxgparam = '';

                let idCountry = Obj_RCD.getValue({
                    fieldId: 'custbody_lmry_subsidiary_country'
                });

                //Exchange RATE
                let exchangeRate = getExchangeRate(Obj_RCD, params);

                if (Number(idCountry) === 48) { //Colombia
                    // Realiza la una busqueda en el registro personalizado
                    // LatamReady - Setup Tax Subsidiary para validar
                    // La configuracion de la subsidiaria
                    let id_subsidiary = Obj_RCD.getValue({
                        fieldId: 'subsidiary'
                    });
                    let search_lsts = search.create({
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
                    let result_lsts = search_lsts.run();
                    let object_lsts = result_lsts.getRange(0, 10);
                    if (object_lsts.length > 0) {
                        // Trae todos los campos
                        let row_lsts = 0;
                        idtaxgparam = object_lsts[row_lsts].getValue('custrecord_lmry_setuptax_tax_code');
                    }
                }

                // Transaccion
                let savedsearch = search.load({
                    id: 'customsearch_lmry_wht_base'
                });
                savedsearch.filters.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: [WHTID]
                }));
                let searchresult = savedsearch.run();
                let objResult = searchresult.getRange(0, 10);
                if (objResult.length > 0) {
                    // Trae todos los campos
                    let i = 0;
                    let columns = objResult[i].columns;

                    // Tipo de Transaccion
                    let typetran = Obj_RCD.getValue({
                        fieldId: 'type'
                    });
                    // Internal ID
                    let Field_Transa2 = '';
                    let Field_Formsdf = '';
                    let Field_whtname = objResult[i].getValue('name');
                    let Available_onts = '';
                    let Field_taxpoint = '';
                    let Field_itesales = '';
                    let Field_whtkind = objResult[i].getValue('custrecord_lmry_wht_kind');
                    let Field_Rate = objResult[i].getValue('custrecord_lmry_wht_coderate');
                    let Field_datfrom = objResult[i].getValue(columns[6]);
                    let Field_datuntil = objResult[i].getValue(columns[7]);
                    let Field_cminbase = objResult[i].getValue('custrecord_lmry_wht_codeminbase');
                    if (Field_cminbase === '' || Field_cminbase == null) {
                        Field_cminbase = 0;
                    }
                    let Field_crediacc = objResult[i].getValue('custrecord_lmry_wht_taxcredacc');
                    let Field_xliabacc = objResult[i].getValue('custrecord_lmry_wht_taxliabacc');
                    let Field_Standar = '';

                    // Variables para Ventas
                    if (typetran === 'custinvc') {
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
                    if (typetran === 'vendbill') {
                        Field_Transa2 = 'vendorcredit';
                        Field_Formsdf = runtime.getCurrentScript().getParameter({
                            name: 'custscript_lmry_wht_vendor_credit'
                        });
                        Available_onts = objResult[i].getValue('custrecord_lmry_wht_onpurchases');
                        Field_taxpoint = objResult[i].getValue('custrecord_lmry_wht_purctaxpoint');
                        Field_itesales = objResult[i].getValue('custrecord_lmry_wht_taxitem_purchase');
                        Field_Standar = objResult[i].getValue(columns[16]); // custrecord_lmry_wht_purcbase
                    }

                    log.debug('Field_Standar', Field_Standar);

                    // Valida si el campo standar va a popular estan configurado
                    if (Field_Standar === '' || Field_Standar == null ||
                        Available_onts === false || Available_onts === 'F') {
                        return null;
                    }

                    // Importe del campo Standart
                    let amount;
                    if (Field_Standar === 'subtotal' && typetran === 'vendbill') {
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
                    //!! validación del monto con el base amount min
                    let tmpAmount = parseFloat(amount) * exchangeRate;

                    amount = amount * Prorateo;

                    // Calculo de Campos
                    let amountresult = 0;
                    if (amount !== 0 && amount != null) {
                        amountresult = parseFloat(amount) * parseFloat(Field_Rate);
                        amountresult = parseFloat(amountresult) / 100;
                        //amountresult = amountresult.toFixed(2);
                        amountresult = round2(amountresult);
                        amountresult = Math.abs(amountresult);
                    }

                    let date_ = params['date'];
                    date_ = format.parse({
                        value: date_,
                        type: format.Type.DATE
                    });
                    // Formato de Fechas
                    let Field_DateTran = yyymmdd(date_);

                    // Validate Create Journal or Credit Memo
                    if (Field_taxpoint === "2") {
                        if ((Field_DateTran >= Field_datfrom && Field_datfrom !== '' && Field_datfrom != null) &&
                            (Field_DateTran <= Field_datuntil && Field_datuntil !== '' && Field_datuntil != null) &&
                            ((tmpAmount) >= parseFloat(Field_cminbase) &&
                                (tmpAmount) > 0) && parseFloat(amountresult) > 0) {

                            /* ---------------------------------------------
                             * Create Credit Memo si Field_whtkind = 1
                             * ------------------------------------------ */
                            if (Field_whtkind === "1") {
                                // Valida si el item que se va a popular estan configurado
                                if (Field_itesales === '' || Field_itesales == null) {
                                    return null;
                                }

                                // Crea la transaccion para la retencion
                                let inRec = record.create({
                                    type: Field_Transa2
                                });

                                // Formulario Personalizado
                                if (Field_Formsdf !== '' && Field_Formsdf != null) {
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
                                if (Field_whtname !== '' && Field_whtname != null) {
                                    inRec.setValue({
                                        fieldId: 'memo',
                                        value: 'Latam - WHT ' + Field_whtname
                                    });
                                }
                                inRec.setValue({
                                    fieldId: 'tranid',
                                    value: 'LTMP-' + ID
                                });

                                let FormatoIn = params['date'];

                                let FormatoFecha = format.parse({
                                    value: FormatoIn,
                                    type: format.Type.DATE
                                });

                                inRec.setValue({
                                    fieldId: 'trandate',
                                    value: FormatoFecha
                                });

                                /*inRec.setValue({
                                    fieldId: 'postingperiod',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'postingperiod'
                                    })
                                });*/

                                inRec.setValue({
                                    fieldId: 'currency',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'currency'
                                    })
                                });
                                inRec.setValue({
                                    fieldId: 'exchangerate',
                                    value: params['exchangerate']
                                });

                                // Validacion si el Sales Rep esta acitvo
                                if (Obj_RCD.getValue({ fieldId: 'salesrep' }) != null &&
                                    Obj_RCD.getValue({ fieldId: 'salesrep' }) !== '') {
                                    let booActive = search.lookupFields({
                                        type: 'employee',
                                        id: Obj_RCD.getValue({ fieldId: 'salesrep' }),
                                        columns: ['isinactive', 'issalesrep']
                                    });
                                    let isinactive = booActive.isinactive;
                                    let issalesrep = booActive.issalesrep

                                    // Valida si esta activo el empleado
                                    if ((isinactive === 'F' || isinactive === false) &&
                                        (issalesrep === 'T' || issalesrep === true)) {
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
                                if (Obj_RCD.getValue({ fieldId: 'department' }) !== '' &&
                                    Obj_RCD.getValue({ fieldId: 'department' }) != null) {
                                    inRec.setValue({ fieldId: 'department', value: Obj_RCD.getValue({ fieldId: 'department' }) });
                                }
                                // Class
                                if (Obj_RCD.getValue({ fieldId: 'class' }) !== '' &&
                                    Obj_RCD.getValue({ fieldId: 'class' }) != null) {
                                    inRec.setValue({ fieldId: 'class', value: Obj_RCD.getValue({ fieldId: 'class' }) });
                                }
                                // Location
                                if (Obj_RCD.getValue({ fieldId: 'location' }) !== '' &&
                                    Obj_RCD.getValue({ fieldId: 'location' }) != null) {
                                    inRec.setValue({ fieldId: 'location', value: Obj_RCD.getValue({ fieldId: 'location' }) });
                                }

                                // Field Head Department
                                let linDepar = Obj_RCD.getValue({
                                    fieldId: 'department'
                                });
                                if (linDepar === '' || linDepar == null) {
                                    linDepar = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'department',
                                        line: 0
                                    });
                                }
                                // Field Head Class

                                let linClass = Obj_RCD.getValue({
                                    fieldId: 'class'
                                });
                                if (linClass === '' || linClass == null) {
                                    linClass = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'class',
                                        line: 0
                                    });
                                }
                                // Field Head Location
                                let linLocat = Obj_RCD.getValue({
                                    fieldId: 'location'
                                });
                                if (linLocat === '' || linLocat == null) {
                                    linLocat = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
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

                                // Lineas
                                if (Field_itesales !== '' && Field_itesales != null) {
                                    inRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                        line: 0,
                                        value: Field_itesales
                                    });
                                }
                                inRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: 0,
                                    value: 1
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
                                // Importe a insertaar
                                // Custom
                                if (amountresult !== 0 && amountresult != null) {
                                    inRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        line: 0,
                                        value: amountresult
                                    });
                                }

                                // 2019-08-09 Transaction Line TaxCode
                                if (idtaxgparam !== '' && idtaxgparam != null) {
                                    inRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'taxcode',
                                        line: 0,
                                        value: idtaxgparam
                                    });
                                }
                                // Campos de cabecera obligatorios (Habilitados en prefencias de contabilidad)
                                if (linDepar !== '' && linDepar != null) {
                                    inRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'department',
                                        line: 0,
                                        value: linDepar
                                    });
                                }
                                if (linClass !== '' && linClass != null) {
                                    inRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'class',
                                        line: 0,
                                        value: linClass
                                    });
                                }
                                if (linLocat !== '' && linLocat != null) {
                                    inRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'location',
                                        line: 0,
                                        value: linLocat
                                    });
                                }

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
                                let newrec = inRec.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });

                                /************************************
                                 * Abre el Credit Memo para aplicar
                                 * a la transaccion que se le genero
                                 * la retencion.
                                 ***********************************/

                                let applyRec = record.load({ type: Field_Transa2, id: newrec, isDynamic: true });
                                // let applyRec = record.load({ type: Field_Transa2, id: newrec });

                                // Aplicado a
                                let inLin = applyRec.getLineCount({ sublistId: 'apply' });

                                // = = = = = = = = = = = = = = = = = = = = = = = = = = =
                                // 2021.02.26 : Desmarca el apply se ubiera uno asignado
                                // =  = = = = = = = = = = = = = = = = = = = = = = = = = =
                                /*for (let i = 0; i < inLin; i++) {
                                    applyRec.selectLine({ sublistId: 'apply', line: i });
                                    let idTran = applyRec.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply' });
                                    if (idTran) {
                                        applyRec.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: false });
                                    }
                                }*/

                                // 2021.02.25 : Se aplica la retencion a la transaccion
                                for (let i = 0; i < inLin; i++) {
                                    applyRec.selectLine({ sublistId: 'apply', line: i });
                                    let idTran = applyRec.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'internalid' });
                                    if (String(ID) === String(idTran)) {
                                        if (applyRec.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply' }) === 'F') {
                                            applyRec.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: 'T' });
                                        } else {
                                            applyRec.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                                        }
                                        applyRec.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: amountresult });
                                        break;
                                    }
                                }

                                if (Object.keys(params['books']).length) {
                                    let FEAT_MULTIBOOK = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
                                    if (FEAT_MULTIBOOK) {
                                        // log.debug('test_multibook - credit');
                                        let accountingBooks = params["books"];
                                        let numBooks = applyRec.getLineCount({ sublistId: "accountingbookdetail" });
                                        // log.debug('numBooks', numBooks);
                                        for (let i = 0; i < numBooks; i++) {
                                            // jeRec.selectLine({ sublistId: "accountingbookdetail", line: i });
                                            applyRec.selectLine({ sublistId: 'accountingbookdetail', line: i });
                                            let bookId = applyRec.getCurrentSublistValue({ sublistId: "accountingbookdetail", fieldId: "bookid" });
                                            bookId = String(bookId);
                                            if (accountingBooks.hasOwnProperty(bookId) && accountingBooks[bookId].exchangeRate) {
                                                let bookExchangeRate = accountingBooks[bookId].exchangeRate;
                                                bookExchangeRate = parseFloat(bookExchangeRate);
                                                applyRec.setCurrentSublistValue({ sublistId: "accountingbookdetail", fieldId: "exchangerate", value: bookExchangeRate });
                                            }
                                        }
                                    }
                                }



                                applyRec.setValue({
                                    fieldId: 'tranid',
                                    value: 'LWHT ' + newrec
                                });

                                // applyRec.setValue({
                                //   fieldId: 'account',
                                //   value: Obj_RCD.getValue({ fieldId: 'account' })
                                // })

                                /* * * * * * * * * * * * * * * * * * * * * * * * * * *
                                 * Fecha : 08 de Mayo de 2020
                                 * Se agrego el siguiente parametro disableTriggers:true
                                 * para evita le ejecucion de users events.
                                 * * * * * * * * * * * * * * * * * * * * * * * * * * */

                                // Graba el Credit Memo
                                applyRec.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });

                                // Actualiza campos de cabecera
                                // record.submitFields({
                                //   type: Field_Transa2,
                                //   id: newrec,
                                //   values: {
                                //     'tranid': 'LWHT ' + newrec,
                                //     'account': Obj_RCD.getValue({ fieldId: 'account' })
                                //   },
                                //   options: { enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true }
                                // });
                            }

                            /* ---------------------------------------------
                             * Create Journal si Field_whtkind = 2
                             * ------------------------------------------ */
                            if (Field_whtkind === "2") {
                                let jeRec = record.create({
                                    type: record.Type.JOURNAL_ENTRY,
                                    isDynamic: true
                                })
                                // Formulario Personalizado
                                Field_Formsdf = runtime.getCurrentScript().getParameter({
                                    name: 'custscript_lmry_wht_journal_entry'
                                });
                                if (Field_Formsdf !== '' && Field_Formsdf != null) {
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

                                let FormatoIn = params['date'];

                                let FormatoFecha = format.parse({
                                    value: FormatoIn,
                                    type: format.Type.DATE
                                });

                                jeRec.setValue({
                                    fieldId: 'trandate',
                                    value: FormatoFecha
                                });
                                /*jeRec.setValue({
                                    fieldId: 'postingperiod',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'postingperiod'
                                    })
                                });*/

                                // Tipo de cambio de la transaccion Origen
                                jeRec.setValue({
                                    fieldId: 'currency',
                                    value: Obj_RCD.getValue({
                                        fieldId: 'currency'
                                    })
                                });
                                jeRec.setValue({
                                    fieldId: 'exchangerate',
                                    value: params['exchangerate']
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
                                let linDepar = Obj_RCD.getValue({
                                    fieldId: 'department'
                                });
                                if (linDepar === '' || linDepar == null) {
                                    linDepar = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'department',
                                        line: 0
                                    });

                                }
                                // Field Head Class
                                let linClass = Obj_RCD.getValue({
                                    fieldId: 'class'
                                });
                                if (linClass === '' || linClass == null) {
                                    linClass = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'class',
                                        line: 0
                                    });
                                }
                                // Field Head Location
                                let linLocat = Obj_RCD.getValue({
                                    fieldId: 'location'
                                });
                                if (linLocat === '' || linLocat == null) {
                                    linLocat = Obj_RCD.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'location',
                                        line: 0
                                    });
                                }

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

                                if (!(Object.keys(params['books']).length === 0)) {
                                    let FEAT_MULTIBOOK = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
                                    if (FEAT_MULTIBOOK === true) {
                                        // log.debug('test_multibook - journal');
                                        let accountingBooks = params["books"];
                                        let numBooks = jeRec.getLineCount({ sublistId: "accountingbookdetail" });
                                        // log.debug('numBooks', numBooks);
                                        for (let i = 0; i < numBooks; i++) {
                                            jeRec.selectLine({ sublistId: "accountingbookdetail", line: i });
                                            let bookId = jeRec.getCurrentSublistValue({ sublistId: "accountingbookdetail", fieldId: "bookid" });
                                            bookId = String(bookId);
                                            if (accountingBooks.hasOwnProperty(bookId) && accountingBooks[bookId].exchangeRate) {
                                                let bookExchangeRate = accountingBooks[bookId].exchangeRate;
                                                bookExchangeRate = parseFloat(bookExchangeRate);
                                                jeRec.setCurrentSublistValue({ sublistId: "accountingbookdetail", fieldId: "exchangerate", value: bookExchangeRate });
                                            }
                                        }
                                    }
                                }

                                let journalApprovalFeat = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALJOURNAL' });
                                if ((journalApprovalFeat === 'T' || journalApprovalFeat === true) && jeRec.getField({ fieldId: "approvalstatus" })) {
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
                                jeRec.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                            }
                            /* ---------------------------------------------
                             * Create Tax result main
                             * ------------------------------------------ */
                            if (Number(idCountry) == 48){ // Colombia
                                createTaxResult(Obj_RCD,Field_Rate,amount,amountresult, WHTID,exchangeRate);
                            }
                        }
                        
                    }
                    
                }
            } catch (err) {
                // Debug
                log.error(LMRY_script, 'Create_WHT_1 - Error: ' + err);
            }
        }
        /* ------------------------------------------------------------------------------------------------------
         * Aplica la Bill y Invoice => Credit Memo / Vendor Credit
         * --------------------------------------------------------------------------------------------------- */
        function ApplyInvoice(idTransaction, typeTransaction, transToApply, transToDelete) {
            try {

                let recTransaction = record.load({ type: typeTransaction, id: idTransaction, isDynamic: true });
                let numberApply = recTransaction.getLineCount({ sublistId: 'apply' });

                for (let i = 0; i < numberApply; i++) {
                    let apply = recTransaction.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i });
                    let recID = recTransaction.getSublistValue({ sublistId: 'apply', fieldId: 'doc', line: i });
                    if (apply === 'T' || apply === true) {
                        //Se desaplican los invoice/bills para poder eliminarlos despues
                        if (transToDelete.indexOf(Number(recID)) !== -1) {
                            recTransaction.selectLine({ sublistId: 'apply', line: i });
                            recTransaction.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: false });
                        }
                    }

                    //se aplican las nuevas transacciones
                    if (transToApply.indexOf(Number(recID)) !== -1) {
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
                for (let i = 0; i < transToDelete.length; i++) {
                    record.delete({
                        type: GENERATED_TRANSACTION[typeTransaction],
                        id: transToDelete[i]
                    });
                }
            } catch (err) {

                log.error(LMRY_script, 'ApplyInvoice - Error: ' + err);
            }

            return true;
        }

        function getTransactionsToDelete(idTransaction, typeTransaction) {
            let transactions = [];
            let searchTransactions = search.create({
                type: typeTransaction,
                filters: [
                    ['mainline', 'is', 'T'], 'AND',
                    ['custbody_lmry_reference_transaction_id', 'equalto', idTransaction], 'AND',
                    ['memo', 'startswith', MEMO_WHT]
                ],
                columns: ['internalid']
            });

            let results = searchTransactions.run().getRange(0, 1000);

            if (results && results.length) {
                for (let i = 0; i < results.length; i++) {
                    let internalid = results[i].getValue('internalid');
                    transactions.push(Number(internalid));
                }
            }
            return transactions;
        }

        /* ------------------------------------------------------------------------------------------------------
         * Formatea el campo fecha en YYYYMMDD
         * --------------------------------------------------------------------------------------------------- */
        function yyymmdd(date) {

            if (date === '' || date == null) {
                return '';
            }

            let year = date.getFullYear();

            let month = "" + (date.getMonth() + 1);

            if (month.length < 2)
                month = "0" + month;

            let newdate = "" + date.getDate();
            if (newdate.length < 2)
                newdate = "0" + newdate;

            return year + "" + month + "" + newdate;
        }

        function getExchangeRate(recordObj, params) {
            /*******************************************************************************************
             * Obtención del ExchangeRate de la transaccion o Multibook para la conversión a moneda base
             *******************************************************************************************/
            let featureMB = runtime.isFeatureInEffect({
                feature: "MULTIBOOK"
            });
            let featureSubs = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            let exchangeRate = 1;
            let exchangerateTran = params['exchangerate'];

            let subsidiary = params['subsidiary'];

            let currencySetup = 0;
            let searchSetupSubsidiary = search.create({
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

            //Setup Tax Subsidiary
            if (searchSetupSubsidiary.length != null && searchSetupSubsidiary.length !== '') {
                currencySetup = searchSetupSubsidiary[0].getValue({
                    name: 'custrecord_lmry_setuptax_currency'
                });
            }

            if (featureSubs && featureMB) { // OneWorld y Multibook
                let currencySubs = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['currency']
                });
                currencySubs = currencySubs.currency[0].value;
                //Moneda de la Subsidiaria

                let lineasBook = recordObj.getLineCount({
                    sublistId: 'accountingbookdetail'
                });
                // log.debug( currencySubs, currencySubs );
                // log.debug( currencySetup, currencySetup );
                if (currencySubs !== currencySetup  && currencySetup != null) {

                    if (params['currency'] === currencySetup) {
                        exchangeRate = 1;
                    }

                    else if (lineasBook != null && lineasBook !== '') {
                        for (let i = 0; i < lineasBook; i++) {

                            if (!(Object.keys(params['books']).length === 0)) {
                                let lineaBookID = recordObj.getSublistValue({
                                    sublistId: 'accountingbookdetail',
                                    fieldId: 'bookid',
                                    line: i
                                });

                                if (params['books'][lineaBookID]['currency'] === currencySetup) {
                                    exchangeRate = params['books'][lineaBookID]['exchangeRate'];
                                    break;
                                }
                            } else {
                                let lineaCurrencyMB = recordObj.getSublistValue({
                                    sublistId: 'accountingbookdetail',
                                    fieldId: 'currency',
                                    line: i
                                });

                                if (lineaCurrencyMB === currencySetup) {
                                    exchangeRate = recordObj.getSublistValue({
                                        sublistId: 'accountingbookdetail',
                                        fieldId: 'exchangerate',
                                        line: i
                                    });
                                    break;
                                }
                            }
                        }
                    }
                    // log.debug(currencySetup, currencySetup);
                    // log.debug(params['books'][currencySetup], params['books'][currencySetup]['exchangeRate']);


                } else { // No esta configurado Setup Tax Subsidiary
                    exchangeRate = exchangerateTran;
                }
            } else { // No es OneWorld o no tiene Multibook
                exchangeRate = exchangerateTran;
            }
            return exchangeRate;
        }

        function round2(num) {
            if (num >= 0) {
                return parseFloat(Math.round(parseFloat(num) * 1e2 + 1e-3) / 1e2);
            } else {
                return parseFloat(Math.round(parseFloat(num) * 1e2 - 1e-3) / 1e2);
            }
        }

        function getAmountsPrevius(ID, WHT, typeWHT, recordObj) {

            let previousAmount = 0;

            if (typeWHT === '1') {
                previousAmount = recordObj.getValue({ fieldId: 'custbody_lmry_co_reteica_amount' }) || 0;
            } else if (typeWHT === '2') {
                previousAmount = recordObj.getValue({ fieldId: 'custbody_lmry_co_reteiva_amount' }) || 0;
            } else if (typeWHT === '3') {
                previousAmount = recordObj.getValue({ fieldId: 'custbody_lmry_co_retefte_amount' }) || 0;
            }
            log.debug('typeWHT - previousAmount', typeWHT + ' - ' + previousAmount);
            log.debug('number', Number(previousAmount))

            return previousAmount;
        }

         /* ------------------------------------------------------------------------------------------------------
        * Funcion que obtiene el subtype del tipo de retencion que se aplica a la transaccion.
        * --------------------------------------------------------------------------------------------------- */
         function getSubTypeWHT(WHTID) {

            let setupWhtSubType = {
                text: "",
                value: 0,
                description: ""
            };
            let whtCodeSearch = search.create({
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
                let columns = result.columns;
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
            let auxBookMB = 0;
            let auxExchangeMB = recordObj.getValue({ fieldId: "exchangerate" });
            let featureMB = runtime.isFeatureInEffect({
                feature: "MULTIBOOK"
            });
            if (featureMB) {
                let lineasBook = recordObj.getLineCount({ sublistId: "accountingbookdetail" });
                if (lineasBook != null && lineasBook !== "") {
                    for (let j = 0; j < lineasBook; j++) {
                        let lineaBook = recordObj.getSublistValue({ sublistId: "accountingbookdetail", fieldId: "accountingbook", line: j });
                        let lineaExchangeRate = recordObj.getSublistValue({ sublistId: "accountingbookdetail", fieldId: "exchangerate", line: j });
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
                let subtype = getSubTypeWHT(idWHT);
                let multibook = getAccountingBooks(recordTransaction);
                let recordSummary = record.create({ type: 'customrecord_lmry_br_transaction', isDynamic: false });
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

                let idRecordSummary = recordSummary.save({ disableTriggers: true, ignoreMandatoryFields: true });

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

            let searchTaxResult = search.create({
                type: 'customrecord_lmry_br_transaction',
                filters: [
                    ["custrecord_lmry_br_related_id","is",String(idTransaction)]
                ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            let searchResultCount = searchTaxResult.runPaged().count;
            log.debug("searchResultCount", searchResultCount)
            searchTaxResult.run().each(function (result) {
                let columns = result.columns;
                let internalid = result.getValue(columns[0]);

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
            Create_WHT_Latam: Create_WHT_Latam
        };

    });