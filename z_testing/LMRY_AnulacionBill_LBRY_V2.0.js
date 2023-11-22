/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_AnulacionBill_LBRY_V2.0.js  			        	||
||                                                              ||
||  Version   Date         Author        Remarks                ||
||  2.0     14 Nov 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */
define(['N/record', 'N/runtime', 'N/log', 'N/search', 'N/format', 'N/transaction', './LMRY_IP_libSendingEmailsLBRY_V2.0'],
    function (record, runtime, log, search, format, transaction, libraryEmail) {

        var LMRY_script = 'LMRY_AnulacionBill_LBRY_V2.0.js';

        //Features
        var F_MULTPRICE = false;
        var F_DEPARTMENTS = false;
        var F_LOCATIONS = false;
        var F_CLASSES = false;
        var F_DEPTMANDATORY = false;
        var F_CLASSMANDATORY = false;
        var F_LOCMANDATORY = false;
        var F_REVERSALVOIDING = false;
        var F_APPROVAL_BILL = false;

        function anularBill(id_bill) {
          var response = {
                idBill: id_bill,
                standardvoid: false,
                idbillcredit: null,
                error: null
            };

            try {

                F_MULTPRICE = runtime.isFeatureInEffect({feature: 'MULTPRICE'});
                F_DEPARTMENTS = runtime.isFeatureInEffect({feature: "DEPARTMENTS"});
                F_LOCATIONS = runtime.isFeatureInEffect({feature: "LOCATIONS"});
                F_CLASSES = runtime.isFeatureInEffect({feature: "CLASSES"});

                F_REVERSALVOIDING = runtime.getCurrentScript().getParameter({name: 'REVERSALVOIDING'});

                F_APPROVAL_BILL = runtime.getCurrentScript().getParameter({name: "CUSTOMAPPROVALVENDORBILL"});

                var columns = [
                    "trandate", "subsidiary", "custbody_lmry_subsidiary_country", "postingperiod", "approvalstatus",
                    "accountingperiod.closed", "tranid", "fxamount"
                ];

                var bill = search.lookupFields({
                    type: "vendorbill",
                    id: id_bill,
                    columns: columns
                });

                log.error('bill', JSON.stringify(bill));
                var approvalstatus = '';
                if (bill.approvalstatus && bill.approvalstatus.length) {
                    approvalstatus = Number(bill.approvalstatus[0].value);
                }

                var isClosedPeriod = bill["accountingperiod.closed"];
                response['closedperiod'] = isClosedPeriod;

                if ((!F_APPROVAL_BILL || F_APPROVAL_BILL == 'F') || ((F_APPROVAL_BILL == true || F_APPROVAL_BILL == 'T') && approvalstatus == 2)) {

                    log.error('[isClosedPeriod, F_REVERSALVOIDING]', [isClosedPeriod, F_REVERSALVOIDING].join(','));

                    var taxResults = getTaxResults(id_bill);
                    log.error('taxResults', JSON.stringify(taxResults));

                    //Si el periodo esta abierto y es posible la anulacion estandar
                    if (!isClosedPeriod && (F_REVERSALVOIDING == false || F_REVERSALVOIDING == 'F')) {
                        transaction.void({type: transaction.Type.VENDOR_BILL,id: id_bill});

                        response['standardvoid'] = true;
                    } else if (!isClosedPeriod && (F_REVERSALVOIDING == true || F_REVERSALVOIDING == 'T')){


                        if (isThereCancellation(id_bill)) {
                            response.error = "La transaccion ya esta anulada. El proceso se ha cancelado";
                            return response;
                        }
                        var idSubsidiary = bill.subsidiary[0].value;
                        //obtener los formularios
                        var forms = getForms(idSubsidiary);
                        log.error("forms", JSON.stringify(forms));

                        //Se crea el credit memo de anulacion
                        var idVoidBillCredit = createVoidBillCredit(id_bill, bill, forms);
                        response['idbillcredit'] = idVoidBillCredit;

                        //Se copia los tax results de impuestos pero se relaciona al bill credit
                        copyTaxResults(idVoidBillCredit, taxResults);
                    }


                    //Modificando a cero los campos BASE AMOUNT/TOTAL/TOTAL BASE CURRENCY de los records del Tax Results
                    /*for (var i = 0; i < taxResults.length; i++) {
                        var id = taxResults[i]['id'];
                        record.submitFields({
                            type: 'customrecord_lmry_br_transaction',
                            id: id,
                            values: {
                                'custrecord_lmry_base_amount': 0, //LATAM - BASE AMOUNT
                                'custrecord_lmry_br_total': 0, //LATAM - TOTAL
                                'custrecord_lmry_total_base_currency': 0,//LATAM - TOTAL BASE CURRENCY
                                "custrecord_lmry_base_amount_local_currc": 0, //LATAM - BASE AMOUNT LOCAL CURRENCY
                                "custrecord_lmry_amount_local_currency": 0,//LATAM - AMOUNT LOCAL CURRENCY
                                "custrecord_lmry_gross_amt_local_curr": 0,//LATAM - GROSS AMT LOCAL CURRENCY
                                "custrecord_lmry_discount_amt_local_curr": 0,//LATAM - DISCOUNT AMT LOCAL CURRENCY
                                "custrecord_lmry_gross_amt": 0, //LATAM - GROSS AMOUNT ITEM
                                "custrecord_lmry_discount_amt": 0 //LATAM - DISCOUNT AMOUNT
                            }
                        });
                    }*/

                }
            } catch (err) {
                response['error'] = {
                    name: err.name,
                    message: err.message || err
                };
                log.error('LMRY_AnulacionBill_LBRY_V2 - [anularBill]', err);
                libraryEmail.sendemail(' [ anularBill ] ' + err, LMRY_script);
            }

            return response;
        }

        function createVoidBillCredit(id_bill, bill, forms) {
            var idBillCredit = '';

            var form = forms["billcreditform"];

            var postingperiod = bill.postingperiod[0].value;
            var trandate = bill.trandate;
            var subsidiary = bill.subsidiary[0].value;
            var tranid = bill.tranid;
            var totalBill = parseFloat(bill.fxamount);

            var config = obtenerDatosConfigVoidBill(subsidiary);
            log.error('bill credit form', form);
            log.error('config', JSON.stringify(config));

            if (config && form) {
                //Creando el Credit Memo
                var recordBillCredit = record.transform({
                    fromType: record.Type.VENDOR_BILL,
                    fromId: id_bill,
                    toType: record.Type.VENDOR_CREDIT,
                    isDynamic: false,
                    defaultValues: {
                        'customform': form
                    }
                });

                recordBillCredit.setValue('custbody_lmry_reference_transaction', id_bill);
                recordBillCredit.setValue('custbody_lmry_reference_transaction_id', id_bill);

                //seteando el campo memo del CM el tranid y el internal id del bill
                recordBillCredit.setValue({
                    fieldId: 'memo',
                    value: 'Reference VOID ' + tranid + ' ' + '(' + id_bill + ')'
                });

                cleanBillCreditFields(recordBillCredit);

                //seteando el campo memo del CM el tranid y el internal id del bill
                recordBillCredit.setValue({
                    fieldId: 'custbody_lmry_num_preimpreso',
                    value: id_bill + '-DV'
                });

                var date = format.parse({
                    value: trandate,
                    type: format.Type.DATE
                });

                recordBillCredit.setValue({
                    fieldId: 'trandate',
                    value: date
                });

                recordBillCredit.setValue({
                    fieldId: 'postingperiod',
                    value: postingperiod
                });

                var grossItem = getAllItems(recordBillCredit, config);
                log.error('Total Items',grossItem);
                var grossExp = getAllExpenses(recordBillCredit, config);
                log.error('Total Expenses',grossExp);

                //log.error('CheckBox de remover lines ', removeLines);
                if (config['removeLines'] == true) {
                    //Removiendo las lineas del Credit Memo
                    removeAllItems(recordBillCredit);
                    removeAllExpenses(recordBillCredit);

                    if(grossItem > 0){
                      setLines(recordBillCredit,'item',parseFloat(grossItem), config);
                    }

                    if(grossExp > 0){
                      setLines(recordBillCredit,'expense',parseFloat(grossExp), config);
                    }
                }

                //bill que se aplicaran
                var billsToApply = [Number(id_bill)];

                var numApply = recordBillCredit.getLineCount({sublistId: 'apply'});

                var countApplieds = 0;

                for (var i = 0; i < numApply; i++) {
                    var lineTransaction = recordBillCredit.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'internalid',
                        line: i
                    });

                    if (billsToApply.indexOf(Number(lineTransaction)) != -1) {
                        recordBillCredit.setSublistValue({
                            sublistId: 'apply',
                            fieldId: 'apply',
                            line: i,
                            value: true
                        });

                        countApplieds++;
                    }

                    if (countApplieds == billsToApply.length) {
                        break;
                    }
                }

                var accountingbook = getAccountingBook(id_bill);
                log.debug("accountingbook", JSON.stringify(accountingbook));
                setAccountingBook(recordBillCredit, accountingbook);

                //Guardando el CreditMemo
                idBillCredit = recordBillCredit.save({
                    ignoreMandatoryFields: true,
                    disableTriggers: true,
                    enableSourcing: true
                });

                log.error('idBillCredit', idBillCredit);
            }
            return idBillCredit;
        }

        function cleanBillCreditFields(recordObj) {
            recordObj.setValue('custbody_lmry_foliofiscal', ''); //LATAM - FISCAL FOLIO
            recordObj.setValue('custbody_lmry_num_preimpreso', '') //LATAM - PREPRINTED NUMBER
            recordObj.setValue('custbody_lmry_num_doc_ref', ''); //LATAM - DOCUMENT NUMBER REF
            recordObj.setValue('custbody_lmry_doc_ref_date', ''); //LATAM - DOCUMENT DATE REF
            recordObj.setValue('custbody_lmry_doc_serie_ref', ''); //LATAM - DOCUMENT SERIES REF
            recordObj.setValue('custbody_lmry_exchange_rate_doc_ref', ''); //LATAM - TYPE CHANGE DOC REF
            recordObj.setValue('custbody_lmry_doc_ref_type', ''); //LATAM - DOCUMENT TYPE REF
            recordObj.setValue('custbody_lmry_document_type', ''); //LATAM - LEGAL DOCUMENT TYPE
            recordObj.setValue('custbody_lmry_serie_doc_cxc', ''); //LATAM - SERIE CXC
            recordObj.setValue('custbody_lmry_mx_document_design', ''); //LATAM - MX DOCUMENT DESIGN
            recordObj.setValue('custbody_lmry_paymentmethod', ''); //LATAM - PAYMENT METHOD
            recordObj.setValue('custbody_lmry_entity_bank', ''); //LATAM - ENTITY BANK
            recordObj.setValue('custbody_lmry_entity_bank_account', ''); //LATAM - ENTITY BANK ACCOUNT
            recordObj.setValue('custbody_lmry_entity_bank_code', ''); //LATAM - ENTITY BANK CODE
            recordObj.setValue('custbody_lmry_entityforeingbank', ''); //LATAM FOREIGN ENTITY BANK
            recordObj.setValue('custbody_lmry_foliofiscal_doc_ref', ''); //LATAM - FOLIO FISCAL REF
            recordObj.setValue('custbody_lmry_informacion_adicional', ''); //LATAM - ADDITIONAL INFORMATION
            recordObj.setValue('custbody_lmry_mx_uso_cfdi', ''); //LATAM - MX USECFDI
            recordObj.setValue('custbody_lmry_mx_paymentmethod', ''); //LATAM - MX EI PAYMENT METHOD
            recordObj.setValue('custbody_lmry_mx_tipo_relacion', ''); //LATAM - MX RELATIONTYPE
            recordObj.setValue('custbody_lmry_pe_estado_sf', ''); //LATAM - MX ESTADO SF
            recordObj.setValue('custbody_lmry_serie_doc_loc_cxc', ''); //LATAM - CXC LOCATION SERIES
            recordObj.setValue('custbody_lmry_carga_inicial', false); //LATAM - INITIAL LOAD?
            recordObj.setValue('custbody_lmry_apply_wht_code', false); // LATAM - APPLIED WHT CODE
            recordObj.setValue('custbody_psg_ei_template', ''); // E-DOCUMENT TEMPLATE
            recordObj.setValue('custbody_psg_ei_status', ''); // E-DOCUMENT STATUS
            recordObj.setValue('custbody_psg_ei_sending_method', ''); //E-DOCUMENT SENDING METHODS
            recordObj.setValue('custbody_psg_ei_generated_edoc', ''); //GENERATED E-DOCUMENT
        }

        function obtenerDatosConfigVoidBill(id_subsidiaria) {
            try {
                var config = {};
                //busqueda del record customrecord_lmry_config_voidtransaction para la config: Void Transaction

                var columns = ['custrecord_lmry_configvoid_sub_bill', 'custrecord_lmry_configvoid_item_bill','custrecord_lmry_configvoid_exp_bill',
                    'custrecord_lmry_configvoid_taxcode_bill', 'custrecord_lmry_configvoid_remlines_bill'
                ];

                if (F_DEPARTMENTS == true || F_DEPARTMENTS == 'T') {
                    columns.push("custrecord_lmry_configvoid_dept_bill");
                }

                if (F_CLASSES == true || F_CLASSES == 'T') {
                    columns.push("custrecord_lmry_configvoid_class_bill");
                }

                if (F_LOCATIONS == true || F_LOCATIONS == 'T') {
                    columns.push("custrecord_lmry_configvoid_lct_bill");
                }

                var searchConfigVoidTransaction = search.create({
                    type: 'customrecord_lmry_config_void_bill',
                    columns: columns,
                    filters: ['custrecord_lmry_configvoid_sub_bill', 'is', id_subsidiaria]
                });
                var searchResult = searchConfigVoidTransaction.run().getRange(0, 1);

                if (searchResult != '' && searchResult != null) {
                    config['item'] = searchResult[0].getValue({
                        name: 'custrecord_lmry_configvoid_item_bill'
                    });
                    config['expense'] = searchResult[0].getValue({
                        name: 'custrecord_lmry_configvoid_exp_bill'
                    });
                    config['taxCode'] = searchResult[0].getValue({
                        name: 'custrecord_lmry_configvoid_taxcode_bill'
                    });
                    config['department'] = searchResult[0].getValue({
                        name: 'custrecord_lmry_configvoid_dept_bill'
                    });
                    config['class'] = searchResult[0].getValue({
                        name: 'custrecord_lmry_configvoid_class_bill'
                    });
                    config['location'] = searchResult[0].getValue({
                        name: 'custrecord_lmry_configvoid_lct_bill'
                    });
                    config['removeLines'] = searchResult[0].getValue({
                        name: 'custrecord_lmry_configvoid_remlines_bill'
                    });
                }

                return config;
            } catch (err) {
                log.error('LMRY_AnulacionBill_LBRY_V2 - [obtenerDatosConfigVoidBill]', err);
                libraryEmail.sendemail(' [ obtenerDatosConfigVoidBill ] ' + err, LMRY_script);
            }
        }

        function getTaxResults(recordId) {
            var taxResults = [];
            if (recordId) {
                var searchTaxResults = search.create({
                    type: 'customrecord_lmry_br_transaction',
                    filters: [
                        ['custrecord_lmry_br_transaction', 'anyof', recordId]
                    ],
                    columns: ['internalid', 'custrecord_lmry_tax_type']
                });

                var results = searchTaxResults.run().getRange(0, 1000);
                if (results) {
                    for (var i = 0; i < results.length; i++) {
                        taxResults.push({
                            taxtype: results[i].getValue('custrecord_lmry_tax_type'),
                            id: results[i].getValue('internalid')
                        });
                    }
                }
            }
            return taxResults;
        }

        function copyTaxResults(idBillCredit, taxResults) {
            for (var i = 0; i < taxResults.length; i++) {
                var taxtype = taxResults[i]['taxtype'];
                if (Number(taxtype) == 4) { //Impuesto
                    var id = taxResults[i]['id'];
                    var taxResultObj = record.copy({
                        type: "customrecord_lmry_br_transaction",
                        id: id
                    });
                    taxResultObj.setValue('custrecord_lmry_br_transaction', idBillCredit);
                    taxResultObj.setValue('custrecord_lmry_br_related_id', parseInt(idBillCredit));
                    taxResultObj.save({
                        ignoreMandatoryFields: true,
                        disableTriggers: true,
                        enableSourcing: true
                    });
                }
            }
        }

        function validateBeforeVoidBill(idBill) {
            var search_paymts = search.create({
                type: "transaction",
                filters: [

                    ["type", "anyof", "CustPymt", "CustCred"],
                    "AND", ["mainline", "is", "T"], "AND",
                    ["appliedtotransaction", "anyof", idBill]
                ],
                columns: ["internalid", "appliedtotransaction"]
            });


            var results = search_paymts.run().getRange(0, 10);

            if (results && results.length) {
                return false;
            }
            return true;
        }


        function removeAllItems(recordObj) {
            while (true) {
                var numberItems = recordObj.getLineCount({
                    sublistId: 'item'
                });
                if (numberItems) {
                    recordObj.removeLine({
                        sublistId: 'item',
                        line: numberItems - 1
                    });
                } else {
                    break;
                }
            }
        }

        function removeAllExpenses(recordObj) {
            while (true) {
                var numberExpenses = recordObj.getLineCount({
                    sublistId: 'expense'
                });
                if (numberExpenses) {
                    recordObj.removeLine({
                        sublistId: 'expense',
                        line: numberExpenses - 1
                    });
                } else {
                    break;
                }
            }
        }

        function getAllItems(recordObj, config){
          var grossItem = 0;
          var numberItems = recordObj.getLineCount({sublistId: 'item'});
          if(numberItems){
            for (var i = 0; i < numberItems; i++) {
              var department = recordObj.getSublistValue({sublistId: 'item',fieldId: 'department',line: i});
              var class_ = recordObj.getSublistValue({sublistId: 'item',fieldId: 'class',line: i});
              var location = recordObj.getSublistValue({sublistId: 'item',fieldId: 'location',line: i});
              var grossamt = recordObj.getSublistValue({sublistId: 'item',fieldId: 'grossamt',line: i});
              grossItem = round2(grossItem) + round2(grossamt);
              getSegmentacion(department, class_, location, config, i, recordObj, 'item');
            }
          }
          return grossItem;
        }

        function getAllExpenses(recordObj, config){
          var grossExp = 0;
          var numberExpenses = recordObj.getLineCount({sublistId: 'expense'});
          if(numberExpenses){
            for (var i = 0; i < numberExpenses; i++) {
              var department = recordObj.getSublistValue({sublistId: 'expense',fieldId: 'department',line: i});
              var class_ = recordObj.getSublistValue({sublistId: 'expense',fieldId: 'class',line: i});
              var location = recordObj.getSublistValue({sublistId: 'expense',fieldId: 'location',line: i});
              var grossamt = recordObj.getSublistValue({sublistId: 'expense',fieldId: 'grossamt',line: i});
              grossExp = round2(grossExp) + round2(grossamt);
              getSegmentacion(department, class_, location, config, i, recordObj, 'expense');
            }
          }
          return grossExp;
        }

        function setLines(recordObj, type, amount, config){
          recordObj.insertLine({sublistId: type,line: 0});

          if (config[type]) {
              if(type == 'expense'){
                recordObj.setSublistValue({sublistId: type ,fieldId: 'account',line: 0,value: config[type]});
              }else{
                recordObj.setSublistValue({sublistId: type ,fieldId: type,line: 0,value: config[type]});
              }
          }

          if ((F_MULTPRICE == true || F_MULTPRICE == 'T') && type == 'item') {
              recordObj.setSublistValue({sublistId: 'item',fieldId: 'price',line: 0,value: -1});
          }

          recordObj.setSublistValue({sublistId: type,fieldId: 'rate',line: 0,value: amount});
          recordObj.setSublistValue({sublistId: type,fieldId: 'amount',line: 0,value: amount});


          if (config['taxCode']) {
              recordObj.setSublistValue({sublistId: type,fieldId: 'taxcode',line: 0,value: config['taxCode']});
          }

          recordObj.setSublistValue({sublistId: type,fieldId: 'tax1amt',line: 0,value: 0.00});

          if (F_DEPARTMENTS == true || F_DEPARTMENTS == 'T') {
              var department_line = config['department'];
              if (department_line) {
                  recordObj.setSublistValue({sublistId: type,fieldId: 'department',line: 0,value: department_line});
              }
          }

          if (F_CLASSES == true || F_CLASSES == 'T') {
              var class_line = config['class'];
              if (class_line) {
                  recordObj.setSublistValue({sublistId: type,fieldId: 'class',line: 0,value: class_line});
              }
          }

          if (F_LOCATIONS == true || F_LOCATIONS == 'T') {
              var location_line = config['location'];
              if (location_line) {
                  recordObj.setSublistValue({sublistId: type,fieldId: 'location',line: 0,value: location_line});
              }
          }
        }

        function round2(num) {
          return parseFloat(Math.round(parseFloat(num) * 1e2 + 1e-14) / 1e2);
        }

        function getSegmentacion(departmentBill, classBill, locationBill, config, i, recordOb, type){

          //Obteniendo el estado de los Features Departamento / Clase / Localización
          F_DEPTMANDATORY = runtime.getCurrentScript().getParameter({name: 'DEPTMANDATORY'});

          F_CLASSMANDATORY = runtime.getCurrentScript().getParameter({name: 'CLASSMANDATORY'});

          F_LOCMANDATORY = runtime.getCurrentScript().getParameter({name: 'LOCMANDATORY'});

          if (F_DEPTMANDATORY == 'T' || F_DEPTMANDATORY == true) {
              //Si el departamento en el bill esta vacio, entonces se coloca el valor del campo "departamento" del record personalizado
              if (!departmentBill) {
                  if (config['department']) {
                      recordOb.setSublistValue({sublistId:type,fieldId:'department',line:i,value:config['department']});
                  }
              }
          }

          if (F_CLASSMANDATORY == 'T' || F_CLASSMANDATORY == true) {
              //Si la Clase en el bill esta vacio, entonces se coloca el valor del campo "Clase" del record personalizado
              if (!classBill) {
                  if (config['class']) {
                      recordOb.setSublistValue({sublistId:type,fieldId:'class',line:i,value:config['class']});
                  }
              }
          }


          if (F_LOCMANDATORY == 'T' || F_LOCMANDATORY == true) {
              //Si la localización en el bill esta vacio, entonces se coloca el valor del campo "localización" del record personalizado
              if (!locationBill) {
                  if (config['location']) {
                    recordOb.setSublistValue({sublistId:type,fieldId:'location',line:i,value:config['location']});
                  }
              }
          }
        }

        function getForms(idSubsidiary) {
            var forms = {};
            if (idSubsidiary) {
                var search_setup = search.create({
                    type: 'customrecord_lmry_setup_tax_subsidiary',
                    filters: [
                        ['custrecord_lmry_setuptax_subsidiary', 'anyof', idSubsidiary], 'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['internalid', 'custrecord_lmry_setuptax_form_credit']
                });

                var results = search_setup.run().getRange(0, 10);
                if (results && results.length) {
                    forms['billcreditform'] = results[0].getValue('custrecord_lmry_setuptax_form_credit') || '';
                }
            }

            return forms;
        }

        function getAccountingBook(id_bill) {
            var books = {};
            F_MULTIBOOK = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });

            if (F_MULTIBOOK == true || F_MULTIBOOK == "T") {
                // Con Multibook
                var accountingObj = search.create({
                    type: "accountingtransaction",
                    filters: [
                        ["internalid", "is", id_bill]
                    ],
                    columns: [
                        search.createColumn({
                            name: "accountingbook",
                            summary: "GROUP",
                            sort: search.Sort.ASC
                        }),
                        search.createColumn({
                            name: "exchangerate",
                            summary: "GROUP"
                        })
                    ]
                });
                var resultObj = accountingObj.run().getRange(0, 1000);
                if (resultObj && resultObj.length) {
                    for (var i = 0; i < resultObj.length; i++) {
                        var accountingbook = resultObj[i].getValue({ summary: "GROUP", name: "accountingbook" });
                        var exchangerate = resultObj[i].getValue({ summary: "GROUP", name: "exchangerate" });
                        books[accountingbook] = Number(exchangerate);
                    }
                }
            } else {
                // Sin multibook
                var exchangerate = search.lookupFields({
                    type: "vendorbill",
                    id: id_bill,
                    columns: ["exchangerate"]
                }).exchangerate;

                books["1"] = Number(exchangerate);
            }

            return books;
        }

        function setAccountingBook(recordObj, books) {
            // Exchange Rate
            recordObj.setValue("exchangerate", books["1"]);

            // Accounting Book
            if (F_MULTIBOOK == true || F_MULTIBOOK == "T") {
                var lineasBook = recordObj.getLineCount({
                    sublistId: 'accountingbookdetail'
                });
                log.debug("lineasBook", lineasBook);

                for (var i = 0; i < lineasBook; i++) {
                    var lineabookMB = recordObj.getSublistValue({
                        sublistId: 'accountingbookdetail',
                        fieldId: 'accountingbook',
                        line: i
                    });

                    log.debug("lineabookMB["+i+"]", lineabookMB);
                    if (books[lineabookMB]) {
                        recordObj.setSublistValue({
                            sublistId: 'accountingbookdetail',
                            fieldId: 'exchangerate',
                            line: i,
                            value: books[lineabookMB]
                        });
                    }
                }

            }
        }


        function isThereCancellation(billId) {

            var billsId = [];
            var creditmemoSearchObj = search.create({
                type: "vendorcredit",
                filters:
                    [
                        ["type", "anyof", "VendCred"],
                        "AND",
                        ["createdfrom.internalid", "anyof", billId],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["memo", "startswith", "Reference VOID"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            sort: search.Sort.DESC,
                            label: "Internal ID"
                        })
                    ]
            });

            creditmemoSearchObj.run().each(function (result) {
                billsId.push(result.getValue("internalid"));
            });

            return billsId.length != 0;
        }

        return {
            anularBill: anularBill,
            validateBeforeVoidBill: validateBeforeVoidBill
        };

    });
