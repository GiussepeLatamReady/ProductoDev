/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_CO_ReclasificationLBRY_V2.0.js              ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jan 28 2022  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

/**
 * Si se realiza alguna cambio en LMRY_New_Country_WHT_Lines_LBRY o LMRY_Country_WHT_Lines_LBRY_V2.0
 * revizar que no afecte a esta libreria ya que hace uso de la estructura de los otros scripts 
 * y podria presentar errores durante el proceso
 */


define(['./LMRY_libSendingEmailsLBRY_V2.0', './LMRY_libNumberInWordsLBRY_V2.0', 'N/log', 'N/record', 'N/search', 'N/runtime', 'N/format', 'N/query'],

    function (Library_Mail, _Library_Number, log, record, search, runtime, format, query) {
        /**
         * 
         * @param {Number} idTransaction 
         * @param {string} typeTransaction 
         * @param {Result} period 
         * @param {string} dateContable 
         * @param {string} _dateReclasification 
         * @param {string} retention 
         * @returns 
         */
        var LMRY_script = 'LatamReady - Country WHT Lines LBRY V2.0';
        function createWHTCabecera(idTransaction, typeTransaction, period, dateContable, _dateReclasification, retention) {
            var arrayRetention = retention;
            var reteRecordType = arrayRetention[1]
            var idRetention = arrayRetention[2];
            var amountRetention = arrayRetention[3];
            var idRecordRetention = arrayRetention[0];

            var returnIDS = { retention: "", reverse: "" };

            var recordObj = record.load({
                type: typeTransaction,
                id: idTransaction
            })
            var objRetention = record.load({
                type: reteRecordType,
                id: idRecordRetention,
                isDynamic: false,
            })

            var configuration = search.create({
                type: "customrecord_lmry_setup_tax_subsidiary",
                filters: [
                    "custrecord_lmry_setuptax_subsidiary",
                    "is",
                    recordObj.getValue("subsidiary"),
                ],
                columns: [
                    "custrecord_lmry_setuptax_form_bill",
                    "custrecord_lmry_setuptax_form_journal",
                    "custrecord_lmry_setuptax_form_invoice",
                    "custrecord_lmry_setuptax_form_credit",
                    "custrecord_lmry_setuptax_form_creditmemo",
                    "custrecord_lmry_setuptax_department",
                    "custrecord_lmry_setuptax_class",
                    "custrecord_lmry_setuptax_location"
                ],
            }).run().getRange(0, 1);
            var recordRetention = search.create({
                type: reteRecordType,
                filters: ["internalid", "is", idRecordRetention],
                columns: ["memo", "fxamount", "exchangerate"],
                settings: [search.createSetting({ name: 'consolidationtype', value: 'NONE' })]
            }).run().getRange(0, 1)
            //log.debug("datos entrada", [typeTransaction, idTransaction, idRetention, amountRetention])


            var savedsearch = search.load({
                id: 'customsearch_lmry_wht_base'
            });

            savedsearch.filters.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: [idRetention],
            }));

            var searchresult = savedsearch.run();

            var objResult = searchresult.getRange(0, 1);

            // Internal ID
            var i = 0;
            var columns = objResult[i].columns;
            var Field_Transa1 = '';
            var Field_Transa2 = '';
            var Field_Formsdf = '';
            var retentionName = objResult[i].getValue('name');
            var Available_onts = '';
            var Field_taxpoint = '';
            var Field_itesales = '';
            var Field_whtkind = objResult[i].getValue('custrecord_lmry_wht_kind');
            var Field_cminbase = objResult[i].getValue('custrecord_lmry_wht_codeminbase');
            if (Field_cminbase == '' || Field_cminbase == null) {
                Field_cminbase = 0;
            }
            var Field_crediacc = objResult[i].getValue('custrecord_lmry_wht_taxcredacc');
            var Field_xliabacc = objResult[i].getValue('custrecord_lmry_wht_taxliabacc');
            var Field_Custom = objResult[i].getValue(columns[4]);
            var Field_Standar = '';
            var Field_Rate = objResult[i].getValue('custrecord_lmry_wht_coderate');
            // Variables para Ventas
            if (typeTransaction == 'invoice') {
                Field_Transa1 = 'invoice';
                Field_Transa2 = 'creditmemo';
                Field_Formsdf = configuration[0].getValue("custrecord_lmry_setuptax_form_creditmemo");

                Available_onts = objResult[i].getValue('custrecord_lmry_wht_onsales');
                Field_taxpoint = objResult[i].getValue('custrecord_lmry_wht_saletaxpoint');
                Field_itesales = objResult[i].getValue('custrecord_lmry_wht_taxitem_sales');
                Field_Standar = objResult[i].getValue(columns[12]); // custrecord_lmry_wht_salebase
            }
            // Variables para Compras
            if (typeTransaction == 'vendorbill') {
                Field_Transa1 = 'vendorbill';
                Field_Transa2 = 'vendorcredit';
                Field_Formsdf = configuration[0].getValue("custrecord_lmry_setuptax_form_credit");
                Available_onts = objResult[i].getValue('custrecord_lmry_wht_onpurchases');
                Field_taxpoint = objResult[i].getValue('custrecord_lmry_wht_purctaxpoint');
                Field_itesales = objResult[i].getValue('custrecord_lmry_wht_taxitem_purchase');
                Field_Standar = objResult[i].getValue(columns[16]); // custrecord_lmry_wht_purcbase
            }
            if (typeTransaction == 'creditmemo') {
                Field_Transa1 = 'invoice';
                Field_Formsdf = configuration[0].getValue("custrecord_lmry_setuptax_form_invoice");
                Available_onts = objResult[i].getValue('custrecord_lmry_wht_onsales');
                Field_taxpoint = objResult[i].getValue('custrecord_lmry_wht_saletaxpoint');
                Field_itesales = objResult[i].getValue('custrecord_lmry_wht_taxitem_sales');
                Field_Standar = objResult[i].getValue(columns[12]); // custrecord_lmry_wht_salebase
            }
            // Variables para Compras - Vendor Credit
            if (typeTransaction == 'vendorcredit') {
                Field_Transa1 = 'vendorbill';
                Field_Formsdf = configuration[0].getValue("custrecord_lmry_setuptax_form_bill");
                Available_onts = objResult[i].getValue('custrecord_lmry_wht_onpurchases');
                Field_taxpoint = objResult[i].getValue('custrecord_lmry_wht_purctaxpoint');
                Field_itesales = objResult[i].getValue('custrecord_lmry_wht_taxitem_purchase');
                Field_Standar = objResult[i].getValue(columns[16]); // custrecord_lmry_wht_purcbase
            }

            //buscamos las cuentas de la retencion anterior
            var savedsearch = null;
            var savedsearch = search.load({
                id: 'customsearch_lmry_wht_base'
            });
            savedsearch.filters.push(search.createFilter({
                name: 'name',
                operator: search.Operator.IS,
                values: [recordRetention[0].getValue("memo").split("WHT")[1].replace("Reclasification", "").trim()],
            }));

            var searchresult = savedsearch.run();


            //------------------------desaplicado de la retencion sobre la transaccion-------------------------------//
            // Obj_RCD, recordRetention, Field_whtname, ID, amountresult, trandate, period, configuration
            if (typeTransaction == "vendorbill" || typeTransaction == "invoice" || reteRecordType == "journalentry") {
                var process = createJournalReverse(
                    recordObj,
                    objRetention,
                    recordRetention[0].getValue("memo").split("WHT")[1],
                    idRecordRetention,
                    recordRetention[0].getValue("fxamount"),
                    format.parse({
                        value: format.format({ value: dateContable, type: format.Type.DATE }),
                        type: format.Type.DATE
                    }),
                    period[0].value,
                    configuration
                );
            } else {

                var process = createJournalReverse3(
                    recordObj,
                    objRetention,
                    recordRetention[0].getValue("memo").split("WHT")[1],
                    idRecordRetention,
                    recordRetention[0].getValue("fxamount"),
                    format.parse({
                        value: format.format({ value: dateContable, type: format.Type.DATE }),
                        type: format.Type.DATE
                    }),
                    period[0].value,
                    configuration,
                    reteRecordType
                );
            }

            if (process == null) {
                return false;
            } else {
                returnIDS.reverse = process;
            }
            if (!desApply(
                idRecordRetention,
                reteRecordType,
                [idTransaction],
                retentionName,
                true,
                process
            )) {
                return false;
            };
            var translateTypeRecord = {
                "invoice": "creditmemo",
                "creditmemo": "invoice",
                "vendorbill": "vendorcredit",
                "vendorcredit": "vendorbill"
            }
            var amountTransaction = recordObj.getValue("amount");
            deleteTaxResultsWHTMain(idTransaction);
            if (Field_whtkind == 1) {
                var formulario = Field_Formsdf;
                
                //log.debug(translateTypeRecord[typeTransaction], "creando nueva retencion " + translateTypeRecord[typeTransaction])
                // //log.debug("datos de la retencion", [retentionName, dateContable, period[0].value, amountRetention])

                try {
                    var retencionRecord = record.create({
                        type: translateTypeRecord[typeTransaction],
                        isDynamic: false
                    })
                    retencionRecord.setValue({
                        fieldId: 'trandate',
                        value: format.parse({
                            value: dateContable,
                            type: format.Type.DATE
                        })
                    });
                    retencionRecord.setValue({
                        fieldId: 'exchangerate',
                        value: objRetention.getValue("exchangerate")
                    });
                    retencionRecord.setValue({
                        fieldId: 'subsidiary',
                        value: recordObj.getValue("subsidiary")
                    });
                    /***********************************************
                * Segmentacion Contable de NetSuite
                * Campos de cabecera obligatorios
                * (Habilitados en prefencias de contabilidad)
                **********************************************/
                    var pref_loc = runtime.getCurrentUser().getPreference({ name: 'LOCMANDATORY' });
                    var pref_dep = runtime.getCurrentUser().getPreference({ name: 'DEPTMANDATORY' });
                    var pref_clas = runtime.getCurrentUser().getPreference({ name: 'CLASSMANDATORY' });

                    // //log.debug("segmentacion D-L-C", [recordObj.getValue("department"), recordObj.getValue("location"), recordObj.getValue("class")])

                    if (recordObj.getValue({ fieldId: 'department' }) != '' &&
                        recordObj.getValue({ fieldId: 'department' }) != null) {
                        retencionRecord.setValue({
                            fieldId: 'department',
                            value: recordObj.getValue({
                                fieldId: 'department'
                            })
                        });
                    } else if (pref_dep) {
                        retencionRecord.setValue({
                            fieldId: 'department',
                            value: configuration[0].getValue("custrecord_lmry_setuptax_department")
                        });
                    }
                    if (recordObj.getValue({ fieldId: 'class' }) != '' &&
                        recordObj.getValue({ fieldId: 'class' }) != null) {
                        retencionRecord.setValue({
                            fieldId: 'class',
                            value: recordObj.getValue({
                                fieldId: 'class'
                            })
                        });
                    } else if (pref_clas) {
                        retencionRecord.setValue({
                            fieldId: 'class',
                            value: configuration[0].getValue("custrecord_lmry_setuptax_class")
                        });
                    }
                    if (recordObj.getValue({ fieldId: 'location' }) != '' &&
                        recordObj.getValue({ fieldId: 'location' }) != null) {
                        retencionRecord.setValue({
                            fieldId: 'location',
                            value: recordObj.getValue({
                                fieldId: 'location'
                            })
                        });
                    } else if (pref_loc) {
                        retencionRecord.setValue({
                            fieldId: 'location',
                            value: configuration[0].getValue("custrecord_lmry_setuptax_location")
                        });
                    }

                    retencionRecord.setValue({
                        fieldId: 'entity',
                        value: recordObj.getValue("entity")
                    });
                    retencionRecord.setValue({ fieldId: "currency", value: recordObj.getValue("currency") });

                    retencionRecord.setValue({
                        fieldId: 'postingperiod',
                        value: period[0].value
                    });
                    retencionRecord.setValue({
                        fieldId: 'memo',
                        value: 'Latam - WHT Reclasification ' + retentionName
                    });
                    retencionRecord.setValue({
                        fieldId: 'custbody_lmry_reference_transaction',
                        value: idTransaction
                    });
                    retencionRecord.setValue({
                        fieldId: 'custbody_lmry_reference_transaction_id',
                        value: idTransaction
                    });
                    retencionRecord.setValue({
                        fieldId: 'custbody_lmry_apply_wht_code',
                        value: false
                    });
                    retencionRecord.setValue({
                        fieldId: 'custbody_lmry_wht_base_amount',
                        value: amountTransaction
                    });
                    retencionRecord.setValue({
                        fieldId: 'approvalstatus',
                        value: 2
                    });
                    retencionRecord.setValue('custbody_lmry_reference_transaction', idTransaction);
                    retencionRecord.setValue('custbody_lmry_reference_transaction_id', idTransaction);
                    retencionRecord.setValue('custbody_lmry_reference_entity', recordObj.getValue("entity"));
                    //sublista
                    var department_ = null;
                    if (recordObj.getValue({ fieldId: 'department' }) != '' &&
                        recordObj.getValue({ fieldId: 'department' }) != null) {
                        var department_ = recordObj.getValue({
                            fieldId: 'department'
                        })

                    }
                    if (department_ == null) {
                        var department_ = configuration[0].getValue("custrecord_lmry_setuptax_department")
                    }
                    var class_ = null;
                    if (recordObj.getValue({ fieldId: 'class' }) != '' &&
                        recordObj.getValue({ fieldId: 'class' }) != null) {
                        var class_ = recordObj.getValue({
                            fieldId: 'class'
                        })

                    }
                    if (class_ == null) {
                        var class_ = configuration[0].getValue("custrecord_lmry_setuptax_class")

                    }
                    var location_ = null;
                    if (recordObj.getValue({ fieldId: 'location' }) != '' &&
                        recordObj.getValue({ fieldId: 'location' }) != null) {
                        var location_ = recordObj.getValue({
                            fieldId: 'location'
                        })

                    }
                    if (location_ == null) {
                        var location_ = configuration[0].getValue("custrecord_lmry_setuptax_location")
                    }

                    /*log.debug("data classification", JSON.stringify({
                        class: class_,
                        location: location_,
                        department: department_
                    }))*/



                    retencionRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: 0,
                        value: Field_itesales
                    });
                    retencionRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: 0,
                        value: amountRetention
                    });
                    retencionRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'grossamt',
                        line: 0,
                        value: amountRetention
                    });
                    retencionRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: 0,
                        value: amountRetention
                    });
                    retencionRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'refamt',
                        line: 0,
                        value: amountRetention
                    });
                    retencionRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_lmry_base_amount',
                        line: 0,
                        value: amountTransaction
                    });
                    if (class_) {
                        retencionRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'class',
                            line: 0,
                            value: class_
                        });
                    }
                    if (department_) {
                        retencionRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'department',
                            line: 0,
                            value: department_
                        });
                    }
                    if (location_) {
                        retencionRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'location',
                            line: 0,
                            value: location_
                        });
                    }


                    var newrec = retencionRecord.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true })
                    //log.debug("idretencion nueva", newrec)
                    returnIDS["retention"] = newrec;
                    /**actualizacion del campo retencion amount de cabecera */
                    recordObj = record.load({
                        type: typeTransaction,
                        id: idTransaction
                    })
                    var exchangeRate = getExchangeRate(recordObj);
                    //log.debug("actualizando cabecera transaccion", [Number(amountRetention * getExchangeRate(recordObj)), idRetention])
                    recordObj.setValue({ fieldId: Field_Custom, value: Number(amountRetention * exchangeRate) })
                    recordObj.setValue({ fieldId: Field_Custom.split("_amount")[0] == "custbody_lmry_co_retecree" ? "custbody_lmry_co_autoretecree" : Field_Custom.split("_amount")[0], value: idRetention })

                    // record.submitFields({
                    //     type: translateTypeRecord[typeTransaction],
                    //     id: newrec,
                    //     values: {
                    //         'tranid': 'LWHT ' + newrec,
                    //         // 'customform': formulario
                    //     },
                    //     options: { enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true }
                    // });

                    // Abre el Credit Memo
                    var applyType = { id: "", type: "", apply: "" };
                    if (typeTransaction == "invoice" || typeTransaction == "vendorbill") {
                        applyType.type = translateTypeRecord[typeTransaction];
                        applyType.id = newrec;
                        applyType.apply = idTransaction;
                    } else {
                        applyType.type = typeTransaction;
                        applyType.id = idTransaction;
                        applyType.apply = newrec;
                        recordObj.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                    }
                    var inRec = record.load({
                        type: applyType.type,
                        id: applyType.id,
                    });
                    // Aplicado a
                    var inLin = inRec.getLineCount('apply');
                    //log.debug("nro aplicaciones", inLin)
                    for (var i = 0; i < inLin; i++) {
                        var idTran = inRec.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: i });
                        if (applyType.apply == idTran) {
                            log.error('newrec : ' + newrec, 'Doc : ' + idTran);
                            log.error('apply : ' + i, inRec.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i }));
                            if (inRec.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i }) == 'F') {
                                inRec.setSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i, value: 'T' });
                            } else {
                                inRec.setSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i, value: true });
                            }
                            inRec.setSublistValue({ sublistId: 'apply', fieldId: 'amount', line: i, value: amountRetention });
                            break;
                        }
                    }

                    // Graba el Credit Memo
                    inRec.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                    if (formulario) {
                        record.submitFields({
                            type: translateTypeRecord[typeTransaction],
                            id: newrec,
                            values: {
                                'customform': formulario,
                                'tranid': 'LWHT ' + newrec
                            },
                            options: { enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true }
                        });
                    } else {
                        record.submitFields({
                            type: translateTypeRecord[typeTransaction],
                            id: newrec,
                            values: {
                                'tranid': 'LWHT ' + newrec
                            },
                            options: { enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true }
                        });
                    }
                    if (typeTransaction == "invoice" || typeTransaction == "vendorbill") {
                        recordObj.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                    }

                    createTaxResultsWHTMain(recordObj,Field_Rate,amountTransaction,amountRetention, idRecordRetention, exchangeRate);

                } catch (error) {
                    Library_Mail.sendemail('[retention creation] ' + error, LMRY_script);
                    log.error("error [retention creation]", "error al crear retencion " + error)
                }

            } else {
                //log.debug("journal retention", "creando autoretencion")
                // //log.debug("datos de la retencion", [retentionName, dateContable, period[0].value, amountRetention])
                var retencionRecord = record.create({
                    type: "journalentry",
                    isDynamic: false
                })
                retencionRecord.setValue({
                    fieldId: 'subsidiary',
                    value: recordObj.getValue('subsidiary')
                });
                retencionRecord.setValue({
                    fieldId: 'entity',
                    value: recordObj.getValue('entity')
                });
                retencionRecord.setValue({
                    fieldId: 'trandate',
                    value: format.parse({
                        value: dateContable,
                        type: format.Type.DATE
                    })
                });
                retencionRecord.setValue({
                    fieldId: 'postingperiod',
                    value: period[0].value
                });
                retencionRecord.setValue({ fieldId: "currency", value: recordObj.getValue("currency") });
                // Campos Latam Ready
                retencionRecord.setValue({
                    fieldId: 'custbody_lmry_reference_transaction',
                    value: idTransaction
                });
                retencionRecord.setValue({
                    fieldId: 'custbody_lmry_reference_transaction_id',
                    value: idTransaction
                });
                if (retencionRecord.getField("custbody_lmry_reference_entity")) {
                    retencionRecord.setValue({
                        fieldId: 'custbody_lmry_reference_entity',
                        value: recordObj.getValue("entity")
                    });
                }

                /***********************************************
                 * Segmentacion Contable de NetSuite
                 * Campos de cabecera obligatorios
                 * (Habilitados en prefencias de contabilidad)
                 **********************************************/
                var pref_loc = runtime.getCurrentUser().getPreference({ name: 'LOCMANDATORY' });
                var pref_dep = runtime.getCurrentUser().getPreference({ name: 'DEPTMANDATORY' });
                var pref_clas = runtime.getCurrentUser().getPreference({ name: 'CLASSMANDATORY' });
                // //log.debug("segmentacion D-L-C", [recordObj.getValue("department"), recordObj.getValue("location"), recordObj.getValue("class")])
                if (recordObj.getValue({ fieldId: 'department' }) != '' &&
                    recordObj.getValue({ fieldId: 'department' }) != null) {
                    retencionRecord.setValue({
                        fieldId: 'department',
                        value: recordObj.getValue({
                            fieldId: 'department'
                        })
                    });
                } else if (pref_dep) {
                    retencionRecord.setValue({
                        fieldId: 'department',
                        value: configuration[0].getValue("custrecord_lmry_setuptax_department")
                    });
                }
                if (recordObj.getValue({ fieldId: 'class' }) != '' &&
                    recordObj.getValue({ fieldId: 'class' }) != null) {
                    retencionRecord.setValue({
                        fieldId: 'class',
                        value: recordObj.getValue({
                            fieldId: 'class'
                        })
                    });
                } else if (pref_clas) {
                    retencionRecord.setValue({
                        fieldId: 'class',
                        value: configuration[0].getValue("custrecord_lmry_setuptax_class")
                    });
                }
                if (recordObj.getValue({ fieldId: 'location' }) != '' &&
                    recordObj.getValue({ fieldId: 'location' }) != null) {
                    retencionRecord.setValue({
                        fieldId: 'location',
                        value: recordObj.getValue({
                            fieldId: 'location'
                        })
                    });
                } else if (pref_loc) {
                    retencionRecord.setValue({
                        fieldId: 'location',
                        value: configuration[0].getValue("custrecord_lmry_setuptax_location")
                    });
                }

                // Field Head Department
                var linDepar = recordObj.getValue({
                    fieldId: 'department'
                });
                if (linDepar == '' || linDepar == null) {
                    linDepar = recordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'department',
                        line: 0
                    });
                }
                if (linDepar == '' || linDepar == null) {
                    linDepar = recordObj.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'department',
                        line: 0
                    });
                }
                if ((linDepar == '' || linDepar == null) && pref_dep) {
                    linDepar = configuration[0].getValue("custrecord_lmry_setuptax_department")
                }
                // Field Head Class
                var linClass = recordObj.getValue({
                    fieldId: 'class'
                });
                if (linClass == '' || linClass == null) {
                    linClass = recordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'class',
                        line: 0
                    });
                }
                if (linClass == '' || linClass == null) {
                    linClass = recordObj.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'class',
                        line: 0
                    });
                }
                if ((linClass == '' || linClass == null) && pref_clas) {
                    linClass = configuration[0].getValue("custrecord_lmry_setuptax_class");
                };
                // Field Head Location
                var linLocat = recordObj.getValue({
                    fieldId: 'location'
                });
                if (linLocat == '' || linLocat == null) {
                    linLocat = recordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        line: 0
                    });
                };
                if (linLocat == '' || linLocat == null) {
                    linLocat = recordObj.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'location',
                        line: 0
                    });
                };
                if ((linLocat == '' || linLocat == null) && pref_loc) {
                    linLocat = configuration[0].getValue("custrecord_lmry_setuptax_location");
                };
                retencionRecord.setValue({
                    fieldId: 'exchangerate',
                    value: objRetention.getValue("exchangerate")
                });

                retencionRecord.setValue({
                    fieldId: 'memo',
                    value: 'Latam - WHT Reclasification ' + retentionName
                });
                // // Linea de debito
                retencionRecord.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    line: 0,
                    value: Field_crediacc
                });
                retencionRecord.setSublistValue({
                    sublistId: 'line',
                    fieldId: ((typeTransaction == "invoice" || typeTransaction == "vendorbill") ? 'debit' : "credit"),
                    line: 0,
                    value: amountRetention
                });
                // Segmentacion de Departament, Class, Location
                if (linDepar != '' && linDepar != null) {
                    retencionRecord.setSublistValue({
                        sublistId: 'line',
                        fieldId: 'department',
                        value: linDepar,
                        line: 0,
                    });
                }
                if (linClass != '' && linClass != null) {
                    retencionRecord.setSublistValue({
                        sublistId: 'line',
                        fieldId: 'class',
                        line: 0,
                        value: linClass
                    });
                }
                if (linLocat != '' && linLocat != null) {
                    retencionRecord.setSublistValue({
                        sublistId: 'line',
                        fieldId: 'location',
                        line: 0,
                        value: linLocat
                    });
                }
                retencionRecord.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    line: 0,
                    value: recordObj.getValue("entity")
                });


                // // Linea de credito
                retencionRecord.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'memo',
                    line: 0,
                    value: 'Latam - WHT Reclasification' + retentionName
                });


                retencionRecord.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    line: 1,
                    value: Field_xliabacc
                });
                retencionRecord.setSublistValue({
                    sublistId: 'line',
                    fieldId: ((typeTransaction == "invoice" || typeTransaction == "vendorbill") ? "credit" : 'debit'),
                    line: 1,
                    value: amountRetention
                });

                retencionRecord.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'memo',
                    line: 1,
                    value: 'Latam - WHT Reclasification ' + retentionName
                });
                // Segmentacion de Departament, Class, Location
                if (linDepar != '' && linDepar != null) {
                    retencionRecord.setSublistValue({
                        sublistId: 'line',
                        fieldId: 'department',
                        value: linDepar,
                        line: 1,
                    });
                }
                if (linClass != '' && linClass != null) {
                    retencionRecord.setSublistValue({
                        sublistId: 'line',
                        fieldId: 'class',
                        line: 1,
                        value: linClass
                    });
                }
                if (linLocat != '' && linLocat != null) {
                    retencionRecord.setSublistValue({
                        sublistId: 'line',
                        fieldId: 'location',
                        line: 1,
                        value: linLocat
                    });
                }
                retencionRecord.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    line: 1,
                    value: recordObj.getValue("entity")
                });
                var journalApprovalFeat = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALJOURNAL' });
                if ((journalApprovalFeat == 'T' || journalApprovalFeat == true) && retencionRecord.getField({ fieldId: "approvalstatus" })) {
                    retencionRecord.setValue({
                        fieldId: 'approvalstatus',
                        value: 2
                    });
                }
                /* * * * * * * * * * * * * * * * * * * * * * * * * * *
                 * Fecha : 08 de Marzo de 2022
                 * Se agrego el siguiente parametro disableTriggers:true
                 * para evita le ejecucion de users events.
                 * * * * * * * * * * * * * * * * * * * * * * * * * * */
                // Graba el Journal
                var newrec = retencionRecord.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                returnIDS["retention"] = newrec
                /**actualizacion del campo retencion amount de cabecera */
                //log.debug("actualizando cabecera transaccion", [Number(amountRetention * getExchangeRate(recordObj)), retention])
                recordObj = record.load({
                    type: typeTransaction,
                    id: idTransaction
                });
                recordObj.setValue({ fieldId: Field_Custom, value: Number(amountRetention * getExchangeRate(recordObj)) })
                recordObj.setValue({ fieldId: Field_Custom.split("_amount")[0] == "custbody_lmry_co_retecree" ? "custbody_lmry_co_autoretecree" : Field_Custom.split("_amount")[0], value: idRetention })
                recordObj.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });

                if (configuration[0].getValue("custrecord_lmry_setuptax_form_journal") != "" && configuration[0].getValue("custrecord_lmry_setuptax_form_journal") != null) {
                    var journal = record.load({
                        type: "journalentry",
                        id: newrec
                    })
                    journal.setValue({ fieldId: "customform", value: configuration[0].getValue("custrecord_lmry_setuptax_form_journal") })
                    journal.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true })
                }
                //log.debug("id autoretencion", newrec)

                createTaxResultsWHTMain(recordObj,Field_Rate,amountTransaction,amountRetention, idRecordRetention, exchangeRate);

                return returnIDS
            }

            return returnIDS



        }
        /**
         * 
         * @param {Number} idTransaction 
         * @param {string} typeTransaction 
         * @param {Result} period 
         * @param {string} dateContable 
         * @param {string} _dateReclasification 
         * @param {string} retention 
         * @returns 
         */
        function createWHTLinea(idTransaction, typeTransaction, period, dateContable, _dateReclasification, retention, generalTransactionJSON, idGROUP, anterior) {
            var arrayRetention = retention;
            var idRecordRetention = arrayRetention[0];
            var reteRecordType = arrayRetention[1];
            var itemName = arrayRetention[2];
            var amountRetention = arrayRetention[3];
            var nameRetention = arrayRetention[4];
            var taxResultId = arrayRetention[5];
            var taxid = arrayRetention[6];
            var searchPreviewTax = search.lookupFields({
                type: "customrecord_lmry_br_transaction",
                id: taxResultId,
                columns: ["custrecord_lmry_lineuniquekey", "custrecord_lmry_base_amount", "custrecord_lmry_br_type"]
            });
            var uniquekey = searchPreviewTax.custrecord_lmry_lineuniquekey;
            var baseAmount = searchPreviewTax.custrecord_lmry_base_amount;
            dateContable = format.parse({
                value: dateContable,
                type: format.Type.DATE
            })

            var recordTransaction = record.load({
                type: typeTransaction,
                id: idTransaction,
                isDynamic: false
            })

            var configuration = search.create({
                type: "customrecord_lmry_setup_tax_subsidiary",
                filters: [
                    "custrecord_lmry_setuptax_subsidiary",
                    "is",
                    recordTransaction.getValue("subsidiary"),
                ],
                columns: [
                    //configuracion por default
                    "custrecord_lmry_setuptax_department",
                    "custrecord_lmry_setuptax_class",
                    "custrecord_lmry_setuptax_location",
                    //configuracion de formularios
                    "custrecord_lmry_setuptax_form_bill",
                    "custrecord_lmry_setuptax_form_journal",
                    "custrecord_lmry_setuptax_form_invoice",
                    "custrecord_lmry_setuptax_form_credit",
                    "custrecord_lmry_setuptax_form_creditmemo",
                ],
            }).run().getRange(0, 1);


            //log.debug("type", [reteRecordType, idRecordRetention])
            var recordRetention = record.load({
                type: reteRecordType,
                id: idRecordRetention,
                isDynamic: false
            })
            var result = search.create({
                type: reteRecordType,
                columns: ["internalid", "fxamount", "amount"],
                filters: ["internalid", "anyof", idRecordRetention],
                settings: [search.createSetting({ name: 'consolidationtype', value: 'NONE' })]
            }).run().getRange(0, 1)

            //log.debug("data retencion", result)


            //log.debug("memoria 1", runtime.getCurrentScript().getRemainingUsage())

            /**
             * valores de retorno
             */
            var returnIDS = { taxResult: "", retention: "", reverse: "" };
            /************************ */
            var licenses = generalTransactionJSON["licenses"];
            var memoBase = ((Library_Mail.getAuthorization(720, licenses) || Library_Mail.getAuthorization(721, licenses)) ? 'Latam - CO WHT (Lines) ' : 'Latam - Country WHT (Lines) ')
            var approvalFeature;
            var featureSubs = generalTransactionJSON["featureSubs"];
            var featureMB = generalTransactionJSON["featureMB"];
            var recordObj = generalTransactionJSON["recordObj"];
            var filtroTransactionType = generalTransactionJSON["filtroTransactionType"];
            var formulario = generalTransactionJSON["formulario"];
            var subsidiary = generalTransactionJSON["subsidiary"];
            var entity = generalTransactionJSON["entity"];
            var accountTran = generalTransactionJSON["accountTran"];
            var exchangerateTran = generalTransactionJSON["exchangerateTran"];
            var currencyTran = generalTransactionJSON["currencyTran"];
            /*log.debug({
                title: "data general",
                details: [subsidiary, entity, accountTran, exchangerateTran, currencyTran]
            })*/
            // var departmentTran = 0;
            // var classTran = 0;
            // var locationTran = 0;
            // var trandateTran = 0;
            // var periodTran = 0;
            var classEnable = generalTransactionJSON["classEnable"];
            var deparEnable = generalTransactionJSON["deparEnable"];
            var locatEnable = generalTransactionJSON["locatEnable"];
            var currencySetup = generalTransactionJSON["currencySetup"];
            var country_code = generalTransactionJSON["country_code"];
            var datosWHT = {};
            var datosTAX = {};
            // Arreglos para el Llenado del record "LatamReady - Tax Results"
            var arreglo_SubType = generalTransactionJSON["arreglo_SubType"];
            var arreglo_SubTypeID = generalTransactionJSON["arreglo_SubTypeID"];
            var arreglo_Retencion = generalTransactionJSON["arreglo_Retencion"];
            var arreglo_InternalIdCC = generalTransactionJSON["arreglo_InternalIdCC"];
            var arreglo_TaxRate = generalTransactionJSON["arreglo_TaxRate"];
            var arreglo_Caso = generalTransactionJSON["arreglo_Caso"];
            var arreglo_Account1 = generalTransactionJSON["arreglo_Account1"];
            var arreglo_Account2 = generalTransactionJSON["arreglo_Account2"];
            var arreglo_Genera = generalTransactionJSON["arreglo_Genera"];
            var arreglo_Department = generalTransactionJSON["arreglo_Department"];
            var arreglo_Class = generalTransactionJSON["arreglo_Class"];
            var arreglo_Location = generalTransactionJSON["arreglo_Location"];
            var arreglo_DepartmentLine = generalTransactionJSON["arreglo_DepartmentLine"];
            var arreglo_ClassLine = generalTransactionJSON["arreglo_ClassLine"];
            var arreglo_LocationLine = generalTransactionJSON["arreglo_LocationLine"];
            var arreglo_Items = generalTransactionJSON["arreglo_Items"];
            var arreglo_ItemsName = generalTransactionJSON["arreglo_ItemsName"];
            var arreglo_PosicionItem = generalTransactionJSON["arreglo_PosicionItem"];
            var arreglo_Description = generalTransactionJSON["arreglo_Description"];
            var arreglo_WhtTaxcode = generalTransactionJSON["arreglo_WhtTaxcode"];
            var arreglo_RateRpt = generalTransactionJSON["arreglo_RateRpt"];
            var arreglo_ItemReference = generalTransactionJSON["arreglo_ItemReference"];
            var arreglo_TaxcodeReference = generalTransactionJSON["arreglo_TaxcodeReference"];
            var exchangeRate = getExchangeRate(recordObj)
            //log.debug("data", [idTransaction, typeTransaction, period, dateContable, dateReclasification, retention])
            try {
                recordObj = recordTransaction;
                var subsidiary = recordObj.getValue('subsidiary');
                licenses = Library_Mail.getLicenses(subsidiary)
                var country = recordObj.getValue({
                    fieldId: 'custbody_lmry_subsidiary_country'
                });
                var flag = validarPais(country, licenses);
                if (flag == false) {
                    //log.debug("validar pais", "Pais invalido");
                    return true;
                }
                if (arreglo_InternalIdCC.length == 0) {
                    log.error("no CC", "No hay contributory class")
                    return true;
                }
                if (!idGROUP || !validarFeatureAgrupacion(country, licenses)) {
                    if (typeTransaction == "vendorbill" || typeTransaction == "invoice" || reteRecordType == "journalentry") {
                        var process = createJournalReverse(
                            recordTransaction,
                            recordRetention,
                            recordRetention.getValue("memo").split("WHT")[1],
                            idRecordRetention,
                            result[0].getValue("fxamount"),
                            dateContable,
                            period[0].value,
                            configuration
                        );
                    } else {
                        var process = createJournalReverse3(
                            recordTransaction,
                            recordRetention,
                            recordRetention.getValue("memo").split("WHT")[1],
                            idRecordRetention,
                            result[0].getValue("fxamount"),
                            dateContable,
                            period[0].value,
                            configuration,
                            reteRecordType
                        );
                    }
                } else {
                    var process = anterior.reverse;
                }
                if (process == null) {
                    return false;
                } else {
                    returnIDS.reverse = process;
                }
                switch (typeTransaction) {
                    case 'invoice':
                        filtroTransactionType = 1;
                        approvalFeature = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALCUSTINVC' });
                        break;
                    case 'creditmemo':
                        filtroTransactionType = 8;
                        approvalFeature = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALCUSTINVC' });
                        break;
                    case 'vendorbill':
                        filtroTransactionType = 4;
                        approvalFeature = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALVENDORBILL' });
                        break;
                    case 'vendorcredit':
                        filtroTransactionType = 7;
                        approvalFeature = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALVENDORBILL' });
                        break;
                    default:
                        break;
                }
                // if (approvalFeature == 'T' || approvalFeature == true || approvalFeature == 't') {
                //     if (aprobado != null && aprobado != '' && aprobado != 2) {
                //         return true;
                //     }
                // }
                //Borrado tax result
                deleteTaxResult(taxResultId)
                //log.debug("memoria 2", runtime.getCurrentScript().getRemainingUsage())
                if (!idGROUP || !validarFeatureAgrupacion(country, licenses)) {
                    if(!desApply(idRecordRetention, reteRecordType, "", "", true,process)){
                        return false;
                    }
                }
                //log.debug("memoria 3", runtime.getCurrentScript().getRemainingUsage())
                //Creacion de Tax Results
                // createTaxResult(idTransaction, typeTransaction, licenses, nameRetention, dateContable, dateContable, period[0].value);
                //log.debug("memoria 4", runtime.getCurrentScript().getRemainingUsage())
                //Creacion de las Transacciones de Retencion
                getDataTransaction(idTransaction, typeTransaction, licenses, nameRetention);
                //log.debug("memoria 5", runtime.getCurrentScript().getRemainingUsage())
                //Seteo de campos cabecero
                setDataBody(typeTransaction, idTransaction, licenses);
                //log.debug("memoria 6", runtime.getCurrentScript().getRemainingUsage())
                return returnIDS
            } catch (err) {
                log.error('[General Error] ', err)
                Library_Mail.sendemail('[General Error] ' + err, LMRY_script);
            }
            /*********************************************************************************************************
                * Funcion que realiza el calculo de las retenciones o impuestos.
                * Para los 14 paises excepto BR: Llamada desde el User Event del Invoice, Credit Memo, Bill y Bill Credit
                * Para Brasil : Llamada desde el Cliente del Invoice, Sales Order y Estimate
                *               Llamada desde el User Event del Invoice, Sales Order y Estimate
                ********************************************************************************************************/
            function createTaxResult(recordId, arg_taxMax) {
                log.debug("tax result data", [recordId, arg_taxMax])
                try {
                    // Variables de Preferencias Generales
                    /********************************************************
                     * Concatena los libros contables en caso tenga Multibook
                     ********************************************************/
                    for (var index in arg_taxMax) {
                        log.debug("arreglo data", arg_taxMax[index])
                        var auxBookMB = 0;
                        var auxExchangeMB = recordObj.getValue({
                            fieldId: 'exchangerate'
                        });
                        var arg_SubType = arg_taxMax[index][0];
                        var arg_SubTypeID = arg_taxMax[index][1];
                        var arg_TaxRate = arg_taxMax[index][2];
                        var arg_Caso = arg_taxMax[index][3];
                        var arg_Items = arg_taxMax[index][4];
                        var arg_PosicionItem = arg_taxMax[index][5];
                        var arg_InternalIdCC = arg_taxMax[index][6];
                        var arg_Description = arg_taxMax[index][7];
                        var arg_WhtTaxcode = arg_taxMax[index][8];
                        var arg_RateRpt = arg_taxMax[index][9];
                        if (featureMB) {
                            var lineasBook = recordObj.getLineCount({
                                sublistId: 'accountingbookdetail'
                            });
                            if (lineasBook != null & lineasBook != '') {
                                for (var j = 0; j < lineasBook; j++) {
                                    var lineaBook = recordObj.getSublistValue({
                                        sublistId: 'accountingbookdetail',
                                        fieldId: 'accountingbook',
                                        line: j
                                    });
                                    var lineaExchangeRate = recordObj.getSublistValue({
                                        sublistId: 'accountingbookdetail',
                                        fieldId: 'exchangerate',
                                        line: j
                                    });
                                    auxBookMB = auxBookMB + '|' + lineaBook;
                                    auxExchangeMB = auxExchangeMB + '|' + lineaExchangeRate;
                                }
                            }
                        } // Fin Multibook
                        /********************************************************
                         * Agrega las lineas al record LatamReady - Tax Results *
                         ********************************************************/
                        var recordSummary = record.create({
                            type: 'customrecord_lmry_br_transaction',
                            isDynamic: false
                        });
                        var idTransaction = parseFloat(recordId);
                        idTransaction = idTransaction + "";
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_br_related_id',
                            value: idTransaction
                        });
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_br_transaction',
                            value: idTransaction
                        });
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_br_type',
                            value: arg_SubType
                        });
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_br_type_id',
                            value: arg_SubTypeID
                        });
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_base_amount',
                            value: /*arg_BaseAmount*/Number(baseAmount).toPrecision(8)
                        });
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_br_total',
                            value: Number(amountRetention).toPrecision(8)/*parseFloat(arg_Retencion)*/
                        });
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_br_percent',
                            value: parseFloat(arg_TaxRate) / 100
                        });
                        switch (arg_Caso) {
                            case '2I': // Entidad - Items
                            case '4I': // Subsidiaria - Items
                                recordSummary.setValue({
                                    fieldId: 'custrecord_lmry_total_item',
                                    value: 'Line - Item'
                                });
                                recordSummary.setValue({
                                    fieldId: 'custrecord_lmry_item',
                                    value: arg_Items
                                });
                                var depTrans = recordObj.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'department',
                                    line: arg_PosicionItem
                                });
                                var classTrans = recordObj.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'class',
                                    line: arg_PosicionItem
                                });
                                var locTrans = recordObj.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'location',
                                    line: arg_PosicionItem
                                });
                                recordSummary.setValue({
                                    fieldId: 'custrecord_lmry_br_positem',
                                    value: parseInt(arg_PosicionItem)
                                });
                                break;
                            case '2E': // Entidad - Expenses
                            case '4E': // Subsidiaria - Expenses
                                recordSummary.setValue({
                                    fieldId: 'custrecord_lmry_total_item',
                                    value: 'Line - Expense'
                                });
                                recordSummary.setValue({
                                    fieldId: 'custrecord_lmry_account',
                                    value: arg_Items
                                });
                                var depTrans = recordObj.getSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'department',
                                    line: arg_PosicionItem
                                });
                                var classTrans = recordObj.getSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'class',
                                    line: arg_PosicionItem
                                });
                                var locTrans = recordObj.getSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'location',
                                    line: arg_PosicionItem
                                });
                                recordSummary.setValue({
                                    fieldId: 'custrecord_lmry_br_positem',
                                    value: parseInt(arg_PosicionItem)
                                });
                                break;
                        }
                        if (arg_Caso == '2I' || arg_Caso == '2E') { // Entidad - Totales || Entidad - Items || Entidad - Expenses
                            recordSummary.setValue({
                                fieldId: 'custrecord_lmry_ccl',
                                value: arg_InternalIdCC
                            });
                            recordSummary.setValue({
                                fieldId: 'custrecord_lmry_br_ccl',
                                value: arg_InternalIdCC
                            });
                        } else { // Subsidiaria - Totales || Subsidiaria - Items || Subsidiaria - Expenses
                            recordSummary.setValue({
                                fieldId: 'custrecord_lmry_ntax',
                                value: arg_InternalIdCC
                            });
                            recordSummary.setValue({
                                fieldId: 'custrecord_lmry_br_ccl',
                                value: arg_InternalIdCC
                            });
                        }
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_accounting_books',
                            value: auxBookMB + '&' + auxExchangeMB
                        });
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_tax_description',
                            value: arg_Description
                        });
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_ec_wht_taxcode',
                            value: arg_WhtTaxcode
                        });
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_ec_rate_rpt',
                            value: arg_RateRpt
                        });
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_total_base_currency',
                            value: Math.round(/*arg_Retencion*/amountRetention * 100) / 100 * exchangeRate
                        });
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_base_amount_local_currc',
                            value: Math.round(/*arg_BaseAmount*/baseAmount * 100) / 100 * exchangeRate
                        });
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_amount_local_currency',
                            value: Math.round(/*arg_Retencion*/amountRetention * 100) / 100 * exchangeRate
                        });
                        recordSummary.setValue({
                            fieldId: 'custrecord_lmry_tax_type',
                            value: '1'
                        });
                        if (Number(uniquekey)) {
                            recordSummary.setValue({
                                fieldId: 'custrecord_lmry_lineuniquekey',
                                value: uniquekey
                            });
                        }
                        var save = recordSummary.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        //log.debug("Nueva Tax Result", save)
                        returnIDS["taxResult"] = save
                    }

                } catch (err) {
                    Library_Mail.sendemail('[ Create Tax Result ] ' + err, LMRY_script);
                    log.error("error al crear tax result", err)
                }
            }
            /**
             * Borrado de tax results anterior al proceso (solo el tax result de la retencion a reclasificar)
             */
            function deleteTaxResult(recordId) {
                try {

                    //log.debug("Tax result Deleted", eliminar_ccl)
                    var eliminar_ccl = record.delete({
                        type: 'customrecord_lmry_br_transaction',
                        id: recordId
                    });

                } catch (e) {
                    Library_Mail.sendemail('[Error Delete Tax Result] ' + e, LMRY_script);
                    log.error("Error Delete Tax Result", e)
                }

            }
            /********************************************************
            * Funcion que valida si el flujo debe correr en el pais
            * Parámetros :
            *      country : codigo del Pais
            *      createWHT : check "LatamReady - Applied WHT Code"
            ********************************************************/
            function validarPais(country, licenses) {
                try {
                    var val_country = country_code[country];
                    if (val_country != null && val_country != '' && val_country != undefined) {
                        if (validarFeaturePais(val_country, licenses)) {
                            //log.debug("validar pais", "Pais Valido");

                            return true;
                        }
                    }
                } catch (err) {
                    log.error('[ validarPais ] ' + err)
                    Library_Mail.sendemail('[ validarPais ] ' + err, LMRY_script);
                }
                return false;
            }
            /**************************************************************
             * Funcion que valida si los features estan activos en el pais
             * Parámetros :
             *      country : codigo del Pais
             **************************************************************/
            function validarFeaturePais(val_country, licenses) {
                try {
                    var activo = false;
                    switch (val_country) {
                        case 'AR':
                            activo = Library_Mail.getAuthorization(359, licenses);
                            break;
                        case 'BO':
                            activo = Library_Mail.getAuthorization(360, licenses);
                            break;
                        case 'BR':
                            activo = Library_Mail.getAuthorization(361, licenses);
                            break;
                        case 'CL':
                            activo = Library_Mail.getAuthorization(362, licenses);
                            break;
                        case 'CO':
                            activo = (Library_Mail.getAuthorization(340, licenses) || Library_Mail.getAuthorization(720, licenses) || Library_Mail.getAuthorization(721, licenses));
                            break;
                        case 'CR':
                            activo = Library_Mail.getAuthorization(363, licenses);
                            break;
                        case 'EC':
                            activo = Library_Mail.getAuthorization(364, licenses);
                            break;
                        case 'SV':
                            activo = Library_Mail.getAuthorization(365, licenses);
                            break;
                        case 'GT':
                            activo = Library_Mail.getAuthorization(366, licenses);
                            break;
                        case 'MX':
                            activo = Library_Mail.getAuthorization(367, licenses);
                            break;
                        case 'PA':
                            activo = Library_Mail.getAuthorization(368, licenses);
                            break;
                        case 'PY':
                            activo = Library_Mail.getAuthorization(369, licenses);
                            break;
                        case 'PE':
                            activo = Library_Mail.getAuthorization(370, licenses);
                            break;
                        case 'UY':
                            activo = Library_Mail.getAuthorization(371, licenses);
                            break;
                    }
                    return activo;
                } catch (err) {
                    Library_Mail.sendemail('[ validarFeaturePais ] ' + err, LMRY_script);
                }
                return false;
            }
            /***************************************************************
             * Funcion que valida si los features de agrupacion de
             *       retenciones estan activos en el pais
             * Parámetros :
             *      country : codigo del Pais
             **************************************************************/
            function validarFeatureAgrupacion(country, licenses) {
                try {
                    var activo = false;
                    var val_country = country_code[country];
                    switch (val_country) {
                        case 'AR':
                            activo = Library_Mail.getAuthorization(372, licenses);
                            break;
                        case 'BO':
                            activo = Library_Mail.getAuthorization(373, licenses);
                            break;
                        case 'BR':
                            activo = Library_Mail.getAuthorization(374, licenses);
                            break;
                        case 'CL':
                            activo = Library_Mail.getAuthorization(375, licenses);
                            break;
                        case 'CO':
                            activo = Library_Mail.getAuthorization(376, licenses);
                            break;
                        case 'CR':
                            activo = Library_Mail.getAuthorization(377, licenses);
                            break;
                        case 'EC':
                            activo = Library_Mail.getAuthorization(378, licenses);
                            break;
                        case 'SV':
                            activo = Library_Mail.getAuthorization(379, licenses);
                            break;
                        case 'GT':
                            activo = Library_Mail.getAuthorization(380, licenses);
                            break;
                        case 'MX':
                            activo = Library_Mail.getAuthorization(381, licenses);
                            break;
                        case 'PA':
                            activo = Library_Mail.getAuthorization(382, licenses);
                            break;
                        case 'PY':
                            activo = Library_Mail.getAuthorization(383, licenses);
                            break;
                        case 'PE':
                            activo = Library_Mail.getAuthorization(384, licenses);
                            break;
                        case 'UY':
                            activo = Library_Mail.getAuthorization(385, licenses);
                            break;
                    }
                    return activo;
                } catch (err) {
                    Library_Mail.sendemail('[ validarFeatureAgrupacion ] ' + err, LMRY_script);
                }
                return false;
            }
            function getDataTransaction(recordId, transactionType, licenses, _description) {
                try {
                    //log.debug("data transaction", [recordId, transactionType, licenses, description])
                    //log.debug("arreglo retenciones", arreglo_Description)
                    var country = recordObj.getValue({
                        fieldId: 'custbody_lmry_subsidiary_country'
                    });
                    var flag = validarPais(country, licenses);
                    if (flag == false) {
                        log.error("pais invalido", country)
                        return true;
                    }
                    //Activacion de enable features
                    deparEnable = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
                    locatEnable = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
                    classEnable = runtime.isFeatureInEffect({ feature: "CLASSES" });
                    var searchresult = search.create({
                        type: 'customrecord_lmry_ar_wht_type',
                        columns: ['name'],
                        filters: [
                            ['isinactive', 'is', 'F'], 'AND', ['custrecord_lmry_withholding_country', 'is', country]
                        ]
                    });
                    searchresult = searchresult.run().getRange(0, 1000);
                    for (var i = 0; i < searchresult.length; i++) {
                        datosWHT[searchresult[i].getValue('name') + '-Transaction'] = [0, 0];
                        datosWHT[searchresult[i].getValue('name') + '-Journal'] = [0, 0];
                        datosTAX[searchresult[i].getValue('name') + '-Transaction'] = [];
                        datosTAX[searchresult[i].getValue('name') + '-Journal'] = [];
                    }
                    var tipoResult = '';
                    //Recorrido del arreglo de Datos para LatamReady - Tax Results
                    for (var i = 0; i < arreglo_InternalIdCC.length; i++) {
                        var datosRetencion = '';
                        var datostaxresult = []
                        if (arreglo_ItemsName[i] != itemName.trim() ||
                            arreglo_SubType[i].replace("Auto", "").trim().search(nameRetention.split("-")[0].replace("Auto", "").trim()) == -1 ||
                            arreglo_InternalIdCC[i] != taxid
                        ) {
                            continue;
                        }
                        datosRetencion += amountRetention /*arreglo_Retencion[i]*/ + '|'; //0
                        datosRetencion += arreglo_Caso[i] + '|'; //1
                        datosRetencion += arreglo_Items[i] + '|'; //2
                        datosRetencion += arreglo_Department[i] + '|'; //3
                        datosRetencion += arreglo_Class[i] + '|'; //4
                        datosRetencion += arreglo_Location[i] + '|'; //5
                        datosRetencion += arreglo_Account1[i] + '|'; //6
                        datosRetencion += arreglo_Account2[i] + '|'; //7
                        datosRetencion += arreglo_ItemReference[i] + '|'; //8
                        datosRetencion += arreglo_TaxcodeReference[i] + '|'; //9
                        datosRetencion += arreglo_Description[i] + '|'; //10
                        datosRetencion += arreglo_Genera[i] + '|'; //11
                        datosRetencion += arreglo_DepartmentLine[i] + '|'; //12
                        datosRetencion += arreglo_ClassLine[i] + '|'; //13
                        datosRetencion += arreglo_LocationLine[i]; //14
                        datostaxresult.push(arreglo_SubType[i])
                        datostaxresult.push(arreglo_SubTypeID[i])
                        datostaxresult.push(arreglo_TaxRate[i])
                        datostaxresult.push(arreglo_Caso[i])
                        datostaxresult.push(arreglo_Items[i])
                        datostaxresult.push(arreglo_PosicionItem[i])
                        datostaxresult.push(arreglo_InternalIdCC[i])
                        datostaxresult.push(arreglo_Description[i])
                        datostaxresult.push(arreglo_WhtTaxcode[i])
                        datostaxresult.push(arreglo_RateRpt[i])
                        if (arreglo_Genera[i] == 5 && arreglo_SubType[i].search("Auto") == -1) {
                            tipoResult = '-Transaction';
                        } else {
                            tipoResult = '-Journal';
                        }
                        tipoResult = arreglo_SubType[i] + tipoResult;

                        for (var JSONDato in datosWHT) {
                            if (JSONDato == tipoResult) {
                                if (datosWHT[JSONDato].indexOf(datosRetencion) == -1) {
                                    datosWHT[JSONDato].push(datosRetencion);
                                    datosTAX[JSONDato].push(datostaxresult)
                                    log.debug("datosTAX", datosTAX)
                                    var acum = parseFloat(Math.round(obtenerAmount(arreglo_Retencion[i]) * 100)) / 100;
                                    datosWHT[JSONDato][1] += acum;
                                    break;
                                }
                                // datosWHT[JSONDato].push(datosRetencion);
                                // var acum = parseFloat(Math.round(obtenerAmount(arreglo_Retencion[i]) * 100)) / 100;
                                // datosWHT[JSONDato][1] += acum;
                                // break;
                            }
                        }

                    }
                    var salidaCreado = [];

                    for (var JSONData in datosWHT) {
                        var lengthArray = datosWHT[JSONData].length - 2;
                        if (lengthArray > 0) {
                            if (JSONData.split('-')[1] == 'Transaction') {
                                datosWHT[JSONData][0] = createTransaction(datosWHT[JSONData], JSONData.split('-')[0], recordId, transactionType, country, licenses);
                                createTaxResult(recordId, datosTAX[JSONData])
                            } else {
                                datosWHT[JSONData][0] = createJournal(datosWHT[JSONData], JSONData.split('-')[0], recordId, transactionType, country, licenses);
                                createTaxResult(recordId, datosTAX[JSONData])
                            }
                            salidaCreado.push(datosWHT[JSONData][0]);
                        }
                    }

                } catch (err) {
                    log.error("error generando retencion", err)
                    Library_Mail.sendemail('[ getDataTransaction ] ' + err, LMRY_script);
                }

            }

            function createTransaction(RetencionArray, subtype, recordId, transactionType, country, licenses) {
                try {
                    //log.debug("creandato retencion " + transactionType, [RetencionArray, subtype, recordId, transactionType, country])
                    var recordTypeTran;
                    switch (transactionType) {
                        case 'invoice':
                            recordTypeTran = 'creditmemo';
                            formulario = runtime.getCurrentScript().getParameter({
                                name: 'custscript_lmry_wht_credit_memo'
                            });
                            break;
                        case 'creditmemo':
                            recordTypeTran = 'invoice';
                            formulario = runtime.getCurrentScript().getParameter({
                                name: 'custscript_lmry_wht_invoice'
                            });
                            break;
                        case 'vendorbill':
                            recordTypeTran = 'vendorcredit';
                            formulario = runtime.getCurrentScript().getParameter({
                                name: 'custscript_lmry_wht_vendor_credit'
                            });
                            break;
                        case 'vendorcredit':
                            recordTypeTran = 'vendorbill';
                            formulario = runtime.getCurrentScript().getParameter({
                                name: 'custscript_lmry_wht_vendor_bill'
                            });
                            break;
                        default:
                            break;
                    }
                    //log.debug("type record retention", recordTypeTran)
                    if (validarFeatureAgrupacion(country, licenses) && idGROUP != null) {
                        //log.debug("creando grupo", [country, idGROUP])
                        var newrecordObj = record.load({
                            type: recordTypeTran,
                            id: anterior.retention,
                            isDynamic: true
                        });

                        var dept = RetencionArray[2].split('|')[12];
                        var clas = RetencionArray[2].split('|')[13];
                        var loca = RetencionArray[2].split('|')[14];

                        // newrecordObj.setValue('customform', formulario);
                        // newrecordObj.setValue('entity', entity);
                        // newrecordObj.setValue('subsidiary', subsidiary);
                        // newrecordObj.setValue('memo', 'Latam - Country WHT (Lines) Reclasification - ' + subtype);

                        // newrecordObj.setValue('trandate', dateContable);
                        // newrecordObj.setValue('postingperiod', period[0].value);

                        // newrecordObj.setValue('account', accountTran);
                        // newrecordObj.setValue('exchangerate', exchangerateTran);
                        // newrecordObj.setValue('currency', currencyTran);
                        if (deparEnable == true || deparEnable == 'T') {
                            if (dept != null && dept != '' && dept != undefined && dept != 'undefined') {
                                newrecordObj.setValue('department', dept);
                            }
                        }
                        if (classEnable == true || classEnable == 'T') {
                            if (clas != null && clas != '' && clas != undefined && clas != 'undefined') {
                                newrecordObj.setValue('class', clas);
                            }
                        }
                        if (locatEnable == true || locatEnable == 'T') {
                            if (loca != null && loca != '' && loca != undefined && loca != 'undefined') {
                                newrecordObj.setValue('location', loca);
                            }
                        }
                        newrecordObj.setValue('custbody_lmry_reference_transaction', recordId);
                        newrecordObj.setValue('custbody_lmry_reference_transaction_id', recordId);
                        newrecordObj.setValue('custbody_lmry_reference_entity', entity);

                        if (approvalFeature == 'T' || approvalFeature == true || approvalFeature == 't') {
                            if (newrecordObj.getField({ fieldId: "approvalstatus" })) {
                                newrecordObj.setValue('approvalstatus', 2);
                            }
                        }

                        for (var i = 2; i < RetencionArray.length; i++) {
                            var monto = RetencionArray[i].split('|')[0];
                            var caso = RetencionArray[i].split('|')[1];
                            /*var dep = RetencionArray[i].split('|')[3];
                            var cla = RetencionArray[i].split('|')[4];
                            var loc = RetencionArray[i].split('|')[5];*/
                            var item = parseInt(RetencionArray[i].split('|')[8]);
                            var tcode = RetencionArray[i].split('|')[9];
                            var descrip = RetencionArray[i].split('|')[10];

                            var dept = RetencionArray[i].split('|')[12];
                            var clas = RetencionArray[i].split('|')[13];
                            var loca = RetencionArray[i].split('|')[14];

                            newrecordObj.selectNewLine({ sublistId: 'item' });
                            newrecordObj.setCurrentSublistValue('item', 'item', item);
                            newrecordObj.setCurrentSublistValue('item', 'amount', /*monto*/amountRetention);
                            newrecordObj.setCurrentSublistValue('item', 'rate', /*monto*/amountRetention);
                            newrecordObj.setCurrentSublistValue('item', 'tax1amt', 0);
                            newrecordObj.setCurrentSublistValue('item', 'description', descrip);

                            if (tcode != null && tcode != '' && tcode != 0) {
                                newrecordObj.setCurrentSublistValue('item', 'taxcode', tcode);
                            }
                            if (deparEnable == true || deparEnable == 'T') {
                                if (dept != null && dept != '' && dept != undefined && dept != 'undefined') {
                                    newrecordObj.setCurrentSublistValue('item', 'department', dept);
                                }
                            }
                            if (classEnable == true || classEnable == 'T') {
                                if (clas != null && clas != '' && clas != undefined && clas != 'undefined') {
                                    newrecordObj.setCurrentSublistValue('item', 'class', clas);
                                }
                            }
                            if (locatEnable == true || locatEnable == 'T') {
                                if (loca != null && loca != '' && loca != undefined && loca != 'undefined') {
                                    newrecordObj.setCurrentSublistValue('item', 'location', loca);
                                }
                            }
                            newrecordObj.commitLine({ sublistId: 'item' })

                        }
                        var idNewRecord = newrecordObj.save({
                            ignoreMandatoryFields: true,
                            disableTriggers: true,
                            enableSourcing: true
                        });
                        //log.debug("nueva retencion", idNewRecord)
                        returnIDS["retention"] = idNewRecord
                        applyTransaction(idNewRecord, recordTypeTran, recordId, transactionType);

                    } else {
                        //log.debug("creando retenciones unitarias", country)
                        var idNewRecords = '';
                        for (var i = 2; i < RetencionArray.length; i++) {

                            var newrecordObj = record.create({
                                type: recordTypeTran,
                                isDynamic: false
                            });

                            var monto = RetencionArray[i].split('|')[0];
                            var caso = RetencionArray[i].split('|')[1];
                            /*var dep = RetencionArray[i].split('|')[3];
                            var cla = RetencionArray[i].split('|')[4];
                            var loc = RetencionArray[i].split('|')[5];*/
                            var item = parseInt(RetencionArray[i].split('|')[8]);
                            var tcode = RetencionArray[i].split('|')[9];
                            var descrip = RetencionArray[i].split('|')[10];

                            var dept = RetencionArray[i].split('|')[12];
                            var clas = RetencionArray[i].split('|')[13];
                            var loca = RetencionArray[i].split('|')[14];

                            newrecordObj.setValue('customform', formulario);
                            newrecordObj.setValue('entity', entity);
                            newrecordObj.setValue('subsidiary', subsidiary);
                            newrecordObj.setValue('memo', memoBase + 'Reclasification - ' + subtype);

                            newrecordObj.setValue('trandate', dateContable);
                            newrecordObj.setValue('postingperiod', period[0].value);

                            newrecordObj.setValue('account', accountTran);
                            newrecordObj.setValue('exchangerate', exchangerateTran);
                            newrecordObj.setValue('currency', currencyTran);
                            if (deparEnable == true || deparEnable == 'T') {
                                if (dept != null && dept != '' && dept != undefined && dept != 'undefined') {
                                    newrecordObj.setValue('department', dept);
                                }
                            }
                            if (classEnable == true || classEnable == 'T') {
                                if (clas != null && clas != '' && clas != undefined && clas != 'undefined') {
                                    newrecordObj.setValue('class', clas);
                                }
                            }
                            if (locatEnable == true || locatEnable == 'T') {
                                if (loca != null && loca != '' && loca != undefined && loca != 'undefined') {
                                    newrecordObj.setValue('location', loca);
                                }
                            }
                            newrecordObj.setValue('custbody_lmry_reference_transaction', recordId);
                            newrecordObj.setValue('custbody_lmry_reference_transaction_id', recordId);
                            newrecordObj.setValue('custbody_lmry_reference_entity', entity);
                            if (approvalFeature == 'T' || approvalFeature == true || approvalFeature == 't') {
                                if (newrecordObj.getField({ fieldId: "approvalstatus" })) {
                                    newrecordObj.setValue('approvalstatus', 2);
                                }
                            }

                            //Lineas
                            newrecordObj.setSublistValue('item', 'item', 0, item);
                            newrecordObj.setSublistValue('item', 'amount', 0, /*monto*/amountRetention);
                            newrecordObj.setSublistValue('item', 'rate', 0, /*monto*/amountRetention);
                            newrecordObj.setSublistValue('item', 'tax1amt', 0, 0);
                            newrecordObj.setSublistValue('item', 'description', 0, descrip);

                            if (tcode != null && tcode != '' && tcode != 0) {
                                newrecordObj.setSublistValue('item', 'taxcode', 0, tcode);
                            }
                            if (deparEnable == true || deparEnable == 'T') {
                                if (dept != null && dept != '' && dept != undefined && dept != 'undefined') {
                                    newrecordObj.setSublistValue('item', 'department', 0, dept);
                                }
                            }
                            if (classEnable == true || classEnable == 'T') {
                                if (clas != null && clas != '' && clas != undefined && clas != 'undefined') {
                                    newrecordObj.setSublistValue('item', 'class', 0, clas);
                                }
                            }
                            if (locatEnable == true || locatEnable == 'T') {
                                if (loca != null && loca != '' && loca != undefined && loca != 'undefined') {
                                    newrecordObj.setSublistValue('item', 'location', 0, loca);
                                }
                            }
                            var idNewRecord = newrecordObj.save({
                                ignoreMandatoryFields: true,
                                disableTriggers: true,
                                enableSourcing: true
                            });
                            idNewRecords += idNewRecord + ',';
                            returnIDS["retention"] = idNewRecord
                            applyTransaction(idNewRecord, recordTypeTran, recordId, transactionType);
                        }
                        if (idNewRecords != '') {
                            idNewRecords = idNewRecords.substring(0, idNewRecords.length - 1);
                            idNewRecord = idNewRecords;

                        } else {
                            idNewRecord = 0;
                        }
                        //log.debug("nuevas retenciones", idNewRecord)
                    }

                } catch (err) {
                    log.error("Error al crear transaccion", err)
                    Library_Mail.sendemail('[ createTransaction ] ' + err, LMRY_script);
                    var idNewRecord = 0;
                }

            }

            function createJournal(RetencionArray, subtype, recordId, _transactionType, country, licenses) {
                try {
                    //log.debug("creando journal ", [RetencionArray, subtype, recordId, transactionType, country, subsidiary, entity])
                    formulario = runtime.getCurrentScript().getParameter({
                        name: 'custscript_lmry_wht_journal_entry'
                    }); // LATAM - WHT JOURNAL ENTRY

                    var journalApprovalFeat = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALJOURNAL' });

                    if (validarFeatureAgrupacion(country, licenses) && idGROUP != null) {
                        var recordJE = record.load({
                            type: 'journalentry',
                            id: anterior.retention,
                            isDynamic: true
                        });

                        // recordJE.setValue({
                        //     fieldId: 'customform',
                        //     value: formulario
                        // });

                        // // Campos Standar de NetSuite
                        // recordJE.setValue({
                        //     fieldId: 'subsidiary',
                        //     value: subsidiary
                        // });

                        // recordJE.setValue({
                        //     fieldId: 'currency',
                        //     value: currencyTran
                        // });

                        // recordJE.setValue({
                        //     fieldId: 'exchangerate',
                        //     value: exchangerateTran
                        // });

                        // recordJE.setValue({
                        //     fieldId: 'trandate',
                        //     value: dateContable
                        // });

                        // recordJE.setValue({
                        //     fieldId: 'memo',
                        //     value: 'Latam - Country WHT (Lines) Reclasification - ' + subtype
                        // });

                        // recordJE.setValue({
                        //     fieldId: 'postingperiod',
                        //     value: period[0].value
                        // });


                        for (var i = 2; i < RetencionArray.length; i++) {
                            var monto = RetencionArray[i].split('|')[0];
                            var caso = RetencionArray[i].split('|')[1];
                            var item = RetencionArray[i].split('|')[2];
                            var acc1 = RetencionArray[i].split('|')[6];
                            var acc2 = RetencionArray[i].split('|')[7];
                            var memo = RetencionArray[i].split('|')[10];

                            var dept = RetencionArray[i].split('|')[12];
                            var clas = RetencionArray[i].split('|')[13];
                            var loca = RetencionArray[i].split('|')[14];
                            recordJE.selectNewLine({
                                sublistId: 'line'
                            });
                            if (filtroTransactionType == 1 || filtroTransactionType == 4) {
                                recordJE.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    value: acc1
                                });
                            }
                            if (filtroTransactionType == 8 || filtroTransactionType == 7) {
                                recordJE.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    value: acc2
                                });
                            }
                            recordJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'debit',
                                value: parseFloat(/*monto*/amountRetention)
                            });

                            recordJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'entity',
                                value: parseInt(entity)
                            });

                            recordJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'memo',
                                value: memoBase + 'Reclasification - ' + subtype
                            });

                            if (dept != null && dept != '' && dept != undefined && dept != 'undefined') {
                                recordJE.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'department',
                                    value: dept
                                });
                            }
                            if (clas != null && clas != '' && clas != undefined && clas != 'undefined') {
                                recordJE.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'class',
                                    value: clas
                                });
                            }
                            if (loca != null && loca != '' && loca != undefined && loca != 'undefined') {
                                recordJE.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'location',
                                    value: loca
                                });
                            }
                            recordJE.commitLine({
                                sublistId: 'line'
                            });

                            recordJE.selectNewLine({
                                sublistId: 'line'
                            });
                            if (filtroTransactionType == 1 || filtroTransactionType == 4) {
                                recordJE.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    value: acc2
                                });
                            }
                            if (filtroTransactionType == 8 || filtroTransactionType == 7) {
                                recordJE.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    value: acc1
                                });
                            }
                            recordJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'credit',
                                value: parseFloat(/*monto*/amountRetention)
                            });

                            recordJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'entity',
                                value: parseInt(entity)
                            });

                            recordJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'memo',
                                value: memoBase + 'Reclasification - ' + subtype
                            });

                            if (dept != null && dept != '' && dept != undefined && dept != 'undefined') {
                                recordJE.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'department',
                                    value: dept
                                });
                            }
                            if (clas != null && clas != '' && clas != undefined && clas != 'undefined') {
                                recordJE.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'class',
                                    value: clas
                                });
                            }
                            if (loca != null && loca != '' && loca != undefined && loca != 'undefined') {
                                recordJE.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'location',
                                    value: loca
                                });
                            }
                            recordJE.commitLine({
                                sublistId: 'line'
                            });
                        }



                        // Campos Latam Ready
                        recordJE.setValue({
                            fieldId: 'custbody_lmry_reference_transaction',
                            value: recordId
                        });
                        recordJE.setValue({
                            fieldId: 'custbody_lmry_reference_transaction_id',
                            value: recordId
                        });
                        recordJE.setValue({
                            fieldId: 'custbody_lmry_reference_entity',
                            value: entity
                        });

                        if ((journalApprovalFeat == 'T' || journalApprovalFeat == true) && recordJE.getField({ fieldId: "approvalstatus" })) {
                            recordJE.setValue({
                                fieldId: 'approvalstatus',
                                value: 2
                            });
                        }

                        var idJourn = recordJE.save({
                            ignoreMandatoryFields: true,
                            disableTriggers: true,
                            enableSourcing: true
                        });
                        //log.debug("nuevo journal", idJourn)
                        returnIDS["retention"] = idJourn

                    } else {
                        var idJournals = '';
                        for (var i = 2; i < RetencionArray.length; i++) {
                            var recordJE = record.create({
                                type: 'journalentry',
                                isDynamic: false
                            });

                            recordJE.setValue({
                                fieldId: 'customform',
                                value: formulario
                            });

                            // Campos Standar de NetSuite
                            /*if (featureSubs) {*/
                            recordJE.setValue({
                                fieldId: 'subsidiary',
                                value: subsidiary
                            });


                            recordJE.setValue({
                                fieldId: 'currency',
                                value: currencyTran
                            });

                            recordJE.setValue({
                                fieldId: 'exchangerate',
                                value: exchangerateTran
                            });

                            recordJE.setValue({
                                fieldId: 'trandate',
                                value: dateContable
                            });

                            recordJE.setValue({
                                fieldId: 'memo',
                                value: memoBase + 'Reclasification - ' + subtype
                            });

                            recordJE.setValue({
                                fieldId: 'postingperiod',
                                value: period[0].value
                            });

                            var monto = RetencionArray[i].split('|')[0];
                            var caso = RetencionArray[i].split('|')[1];
                            var item = RetencionArray[i].split('|')[2];
                            var acc1 = RetencionArray[i].split('|')[6];
                            var acc2 = RetencionArray[i].split('|')[7];
                            var memo = RetencionArray[i].split('|')[10];
                            var dept = RetencionArray[i].split('|')[12];
                            var clas = RetencionArray[i].split('|')[13];
                            var loca = RetencionArray[i].split('|')[14];

                            if (filtroTransactionType == 1 || filtroTransactionType == 4) {
                                recordJE.setSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    line: 0,
                                    value: acc1
                                });
                            }
                            if (filtroTransactionType == 8 || filtroTransactionType == 7) {
                                recordJE.setSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    line: 0,
                                    value: acc2
                                });
                            }
                            recordJE.setSublistValue({
                                sublistId: 'line',
                                fieldId: 'debit',
                                line: 0,
                                value: parseFloat(/*monto*/amountRetention)
                            });

                            recordJE.setSublistValue({
                                sublistId: 'line',
                                fieldId: 'entity',
                                line: 0,
                                value: parseInt(entity)
                            });

                            recordJE.setSublistValue({
                                sublistId: 'line',
                                fieldId: 'memo',
                                line: 0,
                                value: memoBase + 'Reclasification - ' + subtype
                            });

                            if (dept != null && dept != '' && dept != undefined && dept != 'undefined') {
                                recordJE.setSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'department',
                                    line: 0,
                                    value: dept
                                });
                            }
                            if (clas != null && clas != '' && clas != undefined && clas != 'undefined') {
                                recordJE.setSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'class',
                                    line: 0,
                                    value: clas
                                });
                            }
                            if (loca != null && loca != '' && loca != undefined && loca != 'undefined') {
                                recordJE.setSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'location',
                                    line: 0,
                                    value: loca
                                });
                            }

                            if (filtroTransactionType == 1 || filtroTransactionType == 4) {
                                recordJE.setSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    line: 1,
                                    value: acc2
                                });
                            }
                            if (filtroTransactionType == 8 || filtroTransactionType == 7) {
                                recordJE.setSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'account',
                                    line: 1,
                                    value: acc1
                                });
                            }
                            recordJE.setSublistValue({
                                sublistId: 'line',
                                fieldId: 'credit',
                                line: 1,
                                value: parseFloat(/*monto*/amountRetention)
                            });

                            recordJE.setSublistValue({
                                sublistId: 'line',
                                fieldId: 'entity',
                                line: 1,
                                value: parseInt(entity)
                            });

                            recordJE.setSublistValue({
                                sublistId: 'line',
                                fieldId: 'memo',
                                line: 1,
                                value: memoBase + 'Reclasification - ' + subtype
                            });

                            if (dept != null && dept != '' && dept != undefined && dept != 'undefined') {
                                recordJE.setSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'department',
                                    line: 1,
                                    value: dept
                                });
                            }
                            if (clas != null && clas != '' && clas != undefined && clas != 'undefined') {
                                recordJE.setSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'class',
                                    line: 1,
                                    value: clas
                                });
                            }
                            if (loca != null && loca != '' && loca != undefined && loca != 'undefined') {
                                recordJE.setSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'location',
                                    line: 1,
                                    value: loca
                                });
                            }


                            // Campos Latam Ready
                            recordJE.setValue({
                                fieldId: 'custbody_lmry_reference_transaction',
                                value: recordId
                            });
                            recordJE.setValue({
                                fieldId: 'custbody_lmry_reference_transaction_id',
                                value: recordId
                            });
                            recordJE.setValue({
                                fieldId: 'custbody_lmry_reference_entity',
                                value: entity
                            });

                            if ((journalApprovalFeat == 'T' || journalApprovalFeat == true) && recordJE.getField({ fieldId: "approvalstatus" })) {
                                recordJE.setValue({
                                    fieldId: 'approvalstatus',
                                    value: 2
                                });
                            }

                            var idJourn = recordJE.save({
                                ignoreMandatoryFields: true,
                                disableTriggers: true,
                                enableSourcing: true
                            });

                            returnIDS["retention"] = idJourn
                            idJournals += idJourn + ',';
                        }
                        if (idJournals != '') {
                            idJournals = idJournals.substring(0, idJournals.length - 1);
                            idJourn = idJournals;
                            //log.debug("nuevos journals", idJourn)
                        } else {
                            idJourn = 0;
                        }
                    }


                } catch (err) {
                    Library_Mail.sendemail('[ createJournal ] ' + err, LMRY_script);
                    var idJourn = 0;
                    log.error("Error al crear journal", err)
                }
                return idJourn;
            }

            function applyTransaction(idNewRecord, recordTypeTran, recordId, transactionType) {

                try {
                    switch (transactionType) {
                        case 'invoice':
                            /*Carga el nuevo record creado*/
                            var newrecordObj = record.load({
                                type: recordTypeTran,
                                id: idNewRecord
                            });
                            var applyCant = newrecordObj.getLineCount({
                                sublistId: 'apply'
                            });
                            var amountTran = newrecordObj.getValue({
                                fieldId: 'total'
                            });
                            for (var i = 0; i < applyCant; i++) {
                                var idTran = newrecordObj.getSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'internalid',
                                    line: i
                                });
                                if (idTran == recordId) {
                                    newrecordObj.setSublistValue({
                                        sublistId: 'apply',
                                        fieldId: 'apply',
                                        line: i,
                                        value: true
                                    });
                                    newrecordObj.setSublistValue({
                                        sublistId: 'apply',
                                        fieldId: 'amount',
                                        line: i,
                                        value: amountTran
                                    });
                                    break;
                                }
                            }
                            newrecordObj.save({
                                ignoreMandatoryFields: true,
                                disableTriggers: true,
                                enableSourcing: true
                            });

                            recordTypeTran = 'creditmemo';
                            break;
                        case 'creditmemo':
                            /*Carga el record creado*/
                            var newrecordObj = record.load({
                                type: transactionType,
                                id: recordId
                            });
                            var applyCant = newrecordObj.getLineCount({
                                sublistId: 'apply'
                            });
                            var amountTran = newrecordObj.getValue({
                                fieldId: 'total'
                            });
                            for (var i = 0; i < applyCant; i++) {
                                var idTran = newrecordObj.getSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'internalid',
                                    line: i
                                });
                                if (idTran == idNewRecord) {
                                    newrecordObj.setSublistValue({
                                        sublistId: 'apply',
                                        fieldId: 'apply',
                                        line: i,
                                        value: true
                                    });
                                    newrecordObj.setSublistValue({
                                        sublistId: 'apply',
                                        fieldId: 'amount',
                                        line: i,
                                        value: amountTran
                                    });
                                    break;
                                }
                            }
                            newrecordObj.save({
                                ignoreMandatoryFields: true,
                                disableTriggers: true,
                                enableSourcing: true
                            });
                            recordTypeTran = 'invoice';
                            break;
                        case 'vendorbill':
                            /*Carga el nuevo record creado*/
                            var newrecordObj = record.load({
                                type: recordTypeTran,
                                id: idNewRecord
                            });
                            var applyCant = newrecordObj.getLineCount({
                                sublistId: 'apply'
                            });
                            var amountTran = newrecordObj.getValue({
                                fieldId: 'usertotal'
                            });
                            for (var i = 0; i < applyCant; i++) {
                                var idTran = newrecordObj.getSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'internalid',
                                    line: i
                                });
                                if (idTran == recordId) {
                                    newrecordObj.setSublistValue({
                                        sublistId: 'apply',
                                        fieldId: 'apply',
                                        line: i,
                                        value: true
                                    });
                                    newrecordObj.setSublistValue({
                                        sublistId: 'apply',
                                        fieldId: 'amount',
                                        line: i,
                                        value: amountTran
                                    });
                                    break;
                                }
                            }
                            newrecordObj.save({
                                ignoreMandatoryFields: true,
                                disableTriggers: true,
                                enableSourcing: true
                            });
                            recordTypeTran = 'vendorcredit';
                            break;
                        case 'vendorcredit':
                            /*Carga el record creado*/
                            var newrecordObj = record.load({
                                type: transactionType,
                                id: recordId
                            });
                            var applyCant = newrecordObj.getLineCount({
                                sublistId: 'apply'
                            });
                            var amountTran = newrecordObj.getValue({
                                fieldId: 'usertotal'
                            });
                            for (var i = 0; i < applyCant; i++) {
                                var idTran = newrecordObj.getSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'internalid',
                                    line: i
                                });
                                if (idTran == idNewRecord) {
                                    newrecordObj.setSublistValue({
                                        sublistId: 'apply',
                                        fieldId: 'apply',
                                        line: i,
                                        value: true
                                    });
                                    newrecordObj.setSublistValue({
                                        sublistId: 'apply',
                                        fieldId: 'amount',
                                        line: i,
                                        value: amountTran
                                    });
                                    break;
                                }
                            }
                            newrecordObj.save({
                                ignoreMandatoryFields: true,
                                disableTriggers: true,
                                enableSourcing: true
                            });
                            recordTypeTran = 'vendorbill';
                            break;
                        default:
                            break;
                    }
                    //log.debug("aplicando retencion - linea", [idNewRecord, recordId])
                } catch (err) {
                    Library_Mail.sendemail('[ applyTransaction ] ' + err, LMRY_script);
                    log.error("error durante la aplicacion", err)
                }
                return true;
            }


            function setDataBody(transactionType, recordId, _licenses) {
                try {

                    var taxResultSearch = search.create({
                        type: "customrecord_lmry_br_transaction",
                        filters:
                            [
                                ["custrecord_lmry_tax_type", "anyof", "1"],
                                "AND",
                                ["custrecord_lmry_br_related_id", "startswith", recordId]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "custrecord_lmry_total_base_currency",
                                    summary: "SUM",
                                    label: "Latam - Total Base Currency"
                                }),
                                search.createColumn({
                                    name: "custrecord_lmry_br_type_id",
                                    summary: "GROUP",
                                    label: "Latam - Sub Type List"
                                })
                            ]
                    })
                    var customrecord_lmry_br_transaction = taxResultSearch.run().getRange(0, 1000);
                    var retecreeamount = 0;
                    var retefteamount = 0;
                    var reteicaamount = 0;
                    var reteivaeamount = 0;
                    for (var index in customrecord_lmry_br_transaction) {
                        var columns = taxResultSearch.columns;
                        if (customrecord_lmry_br_transaction[index].getText(columns[1]).toLocaleLowerCase().indexOf("retecree") != -1) {
                            retecreeamount = customrecord_lmry_br_transaction[index].getValue(columns[0]);
                        }
                        if (customrecord_lmry_br_transaction[index].getText(columns[1]).toLocaleLowerCase().indexOf("retefte") != -1) {
                            retefteamount = customrecord_lmry_br_transaction[index].getValue(columns[0]);
                        }
                        if (customrecord_lmry_br_transaction[index].getText(columns[1]).toLocaleLowerCase().indexOf("reteica") != -1) {
                            reteicaamount = customrecord_lmry_br_transaction[index].getValue(columns[0]);
                        }
                        if (customrecord_lmry_br_transaction[index].getText(columns[1]).toLocaleLowerCase().indexOf("reteiva") != -1) {
                            reteivaeamount = customrecord_lmry_br_transaction[index].getValue(columns[0]);
                        }
                    }

                    record.submitFields({
                        type: transactionType,
                        id: recordId,
                        values: {
                            'custbody_lmry_co_retecree_amount': retecreeamount,
                            'custbody_lmry_co_retefte_amount': retefteamount,
                            'custbody_lmry_co_reteica_amount': reteicaamount,
                            'custbody_lmry_co_reteiva_amount': reteivaeamount
                        },
                        options: {
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        }
                    });

                } catch (err) {
                    Library_Mail.sendemail('[ setDataBody ] ' + err, LMRY_script);
                    log.error('[ setDataBody ] ', err)
                }
            }

            function obtenerAmount(amount) {
                var amountSalida = 0;
                var currency = recordObj.getValue({
                    fieldId: 'currency'
                });

                if (featureSubs && featureMB) {
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
                        amountSalida = amount * exchangeRate;
                    }
                } else {
                    amountSalida = amount * exchangerateTran;
                }

                return amountSalida;
            }

        }



        /**
         * Obtención del ExchangeRate de la transaccion o Multibook para la conversión a moneda base
         * @param {*} recordObj 
         * @returns 
         */
        function getExchangeRate(recordObj) {

            var featureMB = runtime.isFeatureInEffect({
                feature: "MULTIBOOK"
            });
            var featureSubs = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            var exchangeRate = 1;
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
        /**
        * Funcion de desaplicado de la retencion sobre el record de origen
        * @param {*} idTransaction 
        * @param {*} typeTransaction 
        * @param {*} _transToDelete 
        * @returns 
        */
        function desApply(idTransaction, typeTransaction, _transToDelete, _Field_whtname, flag,reverseID) {
            try {
                if (typeTransaction == undefined) { return true }

                var recTransaction = record.load({ type: typeTransaction, id: idTransaction, isDynamic: true });
                if (typeTransaction != "journalentry") {
                    var numberApply = recTransaction.getLineCount({ sublistId: 'apply' });

                    for (var i = 0; i < numberApply; i++) {
                        var apply = recTransaction.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i });
                        var nowTransactionID = recTransaction.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: i });

                        if (apply == 'T' || apply == true) {
                            //Se desaplican los invoice/bills para poder eliminarlos despues
                            // if (transToDelete.indexOf(Number(recID)) != -1) {
                            recTransaction.selectLine({ sublistId: 'apply', line: i });
                            recTransaction.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: false });
                            //log.debug("desaplicando : ", recID)
                            // }
                        }
                        if(nowTransactionID==reverseID){
                            recTransaction.selectLine({ sublistId: 'apply', line: i });
                            recTransaction.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                        }
                    }
                }
                if (flag == true) {
                    // //log.debug("type journal",typeTransaction)
                    var newMemo = ((recTransaction.getValue({ fieldId: "memomain" }) || recTransaction.getValue({ fieldId: "memo" })).toString()).trim()
                    if (newMemo != "" || newMemo != null) {

                        //log.debug("Memo", "actualizando memo " + newMemo)

                        newMemo = newMemo.split("WHT")
                        newMemo = (newMemo[0] + " RE WHT " + (newMemo[1] == undefined ? "" : newMemo[1]))


                        recTransaction.setValue({
                            fieldId: 'memo',
                            value: newMemo
                        });
                    } else {
                        if ((Library_Mail.getAuthorization(340, licenses) || Library_Mail.getAuthorization(720, licenses) || Library_Mail.getAuthorization(721, licenses))) {
                            recTransaction.setValue({
                                fieldId: 'memo',
                                value: ((Library_Mail.getAuthorization(720, licenses) || Library_Mail.getAuthorization(721, licenses)) ? 'Latam - CO RE WHT (Lines) ' : 'Latam - Country RE WHT (Lines) ') + searchPreviewTax.custrecord_lmry_br_type
                            });
                        } else {
                            recTransaction.setValue({
                                fieldId: 'memo',
                                value: "Latam - RE WHT " + (searchPreviewTax.custrecord_lmry_br_type != undefined ? searchPreviewTax.custrecord_lmry_br_type : "")
                            });
                        }

                    }

                    if (typeTransaction == "journalentry") {
                        var numberLine = recTransaction.getLineCount({ sublistId: 'line' });
                        for (var j = 0; j < numberLine; j++) {
                            recTransaction.selectLine({ sublistId: 'line', line: j });
                            newMemo = recTransaction.getCurrentSublistValue({ sublistId: "line", fieldId: "memo" })
                            newMemo = newMemo.split("WHT")
                            //log.debug("Memo " + typeTransaction + " - " + idTransaction, "actualizando memo lineas " + newMemo)
                            newMemo = (newMemo[0] + " RE WHT " + (newMemo[1] == undefined ? "" : newMemo[1]))
                            // recTransaction.setValue({
                            //     fieldId: 'memo',
                            //     value: newMemo
                            // });
                            recTransaction.setCurrentSublistValue({ sublistId: "line", fieldId: "memo", value: newMemo })
                            recTransaction.commitLine({ sublistId: "line" })

                        }

                    }
                }

                /* * * * * * * * * * * * * * * * * * * * * * * * * * *
                 * Fecha : 08 de Mayo de 2020
                 * Se agrego el siguiente parametro disableTriggers:true
                 * para evita le ejecucion de users events.
                 * * * * * * * * * * * * * * * * * * * * * * * * * * */
                recTransaction.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });

                //Se eliminan las transacciones aplicadas antiguas
                // for (var i = 0; i < transToDelete.length; i++) {
                //     record.delete({
                //         type: GENERATED_TRANSACTION[typeTransaction],
                //         id: transToDelete[i]
                //     });
                // }
            } catch (err) {
                log.error('desApply - Error: ', err)
                Library_Mail.sendemail('desApply - Error: ' + err, LMRY_script);
                return false
            }

            return true;
        }

        /**
         * Funcion creadora y aplicadora del journal de reversa para la retencion 
         */
        function createJournalReverse(Obj_RCD, recordRetention, Field_whtname, ID, amountresult, trandate, period,configuration) {
            try {
                // log.debug("datos journal", [typeof Obj_RCD, typeof recordRetention, Field_whtname, ID, amountresult, trandate, period, configuration])
                var consulta
                    = 'SELECT '
                    + 'BUILTIN.DF( TransactionAccountingLine.Account ) AS Account, '
                    + 'TransactionAccountingLine.Account  AS AccountID, '
                    + 'TransactionAccountingLine.Debit, '
                    + 'TransactionAccountingLine.Credit, '
                    + 'TransactionAccountingLine.Posting, '
                    + 'TransactionLine.Memo,TransactionLine.id, '
                    + 'TransactionLine.Transaction '
                    + 'FROM '
                    + 'accountingbook, '
                    + 'TransactionLine, '
                    + 'TransactionAccountingLine '
                    + 'where '
                    + 'TransactionLine.Transaction = TransactionAccountingLine.Transaction '
                    + 'and '
                    + 'TransactionLine.taxline = \'F\' '
                    + 'and '
                    + 'TransactionLine.mainline = \'T\' '
                    + 'and '
                    + 'TransactionAccountingLine.accountingbook=accountingbook.id '
                    + 'and '
                    + 'accountingbook.isprimary= \'T\' '
                    + 'and '
                    + 'TransactionAccountingLine.Transaction = \''
                    + recordRetention.id
                    + '\' '
                    + 'and '
                    + '( '
                    + 'TransactionAccountingLine.Debit IS NOT NULL '
                    + 'or '
                    + 'TransactionAccountingLine.Credit IS NOT NULL '
                    + ') '
                    + 'ORDER BY TransactionLine.ID';
                var accountingbookdetail = query.runSuiteQL({
                    query: consulta
                }).asMappedResults();
                // log.debug("data accountingbookdetail", [accountingbookdetail[0], accountingbookdetail[1]])
    
                var pref_loc = runtime.getCurrentUser().getPreference({ name: 'LOCMANDATORY' });
                var pref_dep = runtime.getCurrentUser().getPreference({ name: 'DEPTMANDATORY' });
                var pref_clas = runtime.getCurrentUser().getPreference({ name: 'CLASSMANDATORY' });
                var jeRec = record.create({
                    type: record.Type.JOURNAL_ENTRY,
                    isDynamic: true
                });
    
                // Campos Standar de NetSuite
                jeRec.setValue({
                    fieldId: 'subsidiary',
                    value: Obj_RCD.getValue({
                        fieldId: 'subsidiary'
                    })
                });
                jeRec.setValue({
                    fieldId: 'trandate',
                    value: trandate
                });
                jeRec.setValue({
                    fieldId: 'postingperiod',
                    value: period
                });
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
                    value: 'Latam - WHT Reverse ' + Field_whtname
                });
                /***********************************************
                 * Segmentacion Contable de NetSuite
                 * Campos de cabecera obligatorios
                 * (Habilitados en prefencias de contabilidad)
                 **********************************************/
                if (
                    Obj_RCD.getValue({ fieldId: 'department' }) != '' &&
                    Obj_RCD.getValue({ fieldId: 'department' }) != null
                ) {
                    jeRec.setValue({
                        fieldId: 'department',
                        value: Obj_RCD.getValue({
                            fieldId: 'department'
                        })
                    });
                } else if (pref_dep) {
                    jeRec.setValue({
                        fieldId: 'department',
                        value: configuration[0].getValue('custrecord_lmry_setuptax_department')
                    });
                }
                if (Obj_RCD.getValue({ fieldId: 'class' }) != '' && Obj_RCD.getValue({ fieldId: 'class' }) != null) {
                    jeRec.setValue({
                        fieldId: 'class',
                        value: Obj_RCD.getValue({
                            fieldId: 'class'
                        })
                    });
                } else if (pref_clas) {
                    jeRec.setValue({
                        fieldId: 'class',
                        value: configuration[0].getValue('custrecord_lmry_setuptax_class')
                    });
                }
                if (Obj_RCD.getValue({ fieldId: 'location' }) != '' && Obj_RCD.getValue({ fieldId: 'location' }) != null) {
                    jeRec.setValue({
                        fieldId: 'location',
                        value: Obj_RCD.getValue({
                            fieldId: 'location'
                        })
                    });
                } else if (pref_loc) {
                    jeRec.setValue({
                        fieldId: 'location',
                        value: configuration[0].getValue('custrecord_lmry_setuptax_location')
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
                if ((linDepar == '' || linDepar == null) && pref_dep) {
                    linDepar = configuration[0].getValue('custrecord_lmry_setuptax_department');
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
                if ((linClass == '' || linClass == null) && pref_clas) {
                    linClass = configuration[0].getValue('custrecord_lmry_setuptax_class');
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
                if ((linLocat == '' || linLocat == null) && pref_loc) {
                    linLocat = configuration[0].getValue('custrecord_lmry_setuptax_location');
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
                accountingbookdetail.forEach(function (accountLine) {
                    log.debug('reverse line', accountLine);
                 jeRec.selectNewLine({
                     sublistId: 'line'
                 });
                 jeRec.setCurrentSublistValue({
                     sublistId: 'line',
                     fieldId: 'account',
                     value: accountLine.accountid
                 });
                 if (Number(accountLine.debit)) {
                    jeRec.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'credit',
                        value: Math.abs(accountLine.debit)
                    });
                 } else {
                    jeRec.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'debit',
                        value: Math.abs(accountLine.credit)
                    });
                 }
    
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
                     value: 'Latam - WHT Reverse' + Field_whtname
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
                });
    
                var journalApprovalFeat = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALJOURNAL' });
                if (
                    (journalApprovalFeat == 'T' || journalApprovalFeat == true) &&
                    jeRec.getField({ fieldId: 'approvalstatus' })
                ) {
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
                // for(var key in JSON.parse(JSON.stringify(jeRec)).sublists.line){
                //     //log.debug("objeto journal "+key,JSON.parse(JSON.stringify(jeRec)).sublists.line[key])
                // }
    
                // return null;
                var newrec = jeRec.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                // log.debug("reverse journal ", newrec)
    
                return newrec;
            } catch (e) {
                log.error('Error Journal Reverse', e);
                Library_Mail.sendemail('[retention creation] ' + e, LMRY_script);
                return null;
            }
        }
        function createJournalReverse3(Obj_RCD, recordRetention, Field_whtname, ID, _amountresult, trandate, period, _configuration, type) {
            try {
                var translateTypeRecord = {
                    "invoice": "creditmemo",
                    "creditmemo": "invoice",
                    "vendorbill": "vendorcredit",
                    "vendorcredit": "vendorbill"
                }
                var typeTransaction = translateTypeRecord[type];
                var idTransaction = Obj_RCD.id;
                var idRetention = recordRetention.id;
                /*log.debug({
                    title: "reversa3",
                    details: [typeTransaction, idTransaction, idRetention]
                })*/
                var recTransaction = record.load({ type: typeTransaction, id: idTransaction, isDynamic: true });
                var numberApply = recTransaction.getLineCount({ sublistId: 'apply' });

                for (var i = 0; i < numberApply; i++) {
                    var apply = recTransaction.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i });
                    var recID = recTransaction.getSublistValue({ sublistId: 'apply', fieldId: 'doc', line: i });

                    if (apply == 'T' || apply == true) {

                        if (recID == idRetention) {
                            recTransaction.selectLine({ sublistId: 'apply', line: i });
                            recTransaction.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: false });
                            //log.debug("desaplicando : ", recID)
                        }
                    }

                }
                recTransaction.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });

                var loadrecord = record.transform({
                    fromType: type,
                    fromId: ID,
                    toType: translateTypeRecord[type],
                    isDynamic: true,
                });
                loadrecord.setValue({ fieldId: "custbody_lmry_reference_transaction", value: ID })
                loadrecord.setValue({ fieldId: "trandate", value: trandate });
                loadrecord.setValue({ fieldId: "postingperiod", value: period });
                loadrecord.setValue({ fieldId: "memo", value: 'Latam - WHT Reverse' + Field_whtname });

                var newrec = loadrecord.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
                //log.debug("reverse " + type, newrec)

                return newrec;
            } catch (error) {
                log.error("Error " + type + " Reverse", error)
                return null;
            }

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
        function createTaxResultsWHTMain(recordTransaction, rateWht, amount, amountWht, idWHT, exchangeRate) {
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
                log.error("[createTaxResultsWHTMain] error:",error)
            }


        }
        /* ------------------------------------------------------------------------------------------------------
        * Funcion que permite eliminar los tax results relacionadas a retenciones de cabecera.
        * --------------------------------------------------------------------------------------------------- */
        function deleteTaxResultsWHTMain(idTransaction) {
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
            createWHTCabecera: createWHTCabecera,
            createWHTLinea: createWHTLinea
        };
    })