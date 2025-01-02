/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =*\
||  This script for Report - Chile                                      ||
||                                                                      ||
||  File Name: TEST_GADP_SCHDL_V2.0.js                       ||
||                                                                      ||
||  Version Date           Author            Remarks                    ||
||  2.0     April 01 2023  Giussepe Delgado  Use Script 2.0             ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define([
    'N/file',
    "N/search",
    "N/record",
    "N/log",
    "N/query",
    "N/runtime",
    "N/https",
    '/SuiteBundles/Bundle 243159/EI_Library/LMRY_AnulacionInvoice_LBRY_V2.0'
],
    function (file, search, record, log, query, runtime, https,library_AnulacionInvoice) {

        const countries = {
            "AR": 11,
            "BO": 29,
            "BR": 30,
            "CL": 45,
            "CO": 48,
            "CR": 49,
            "EC": 63,
            "GT": 91,
            "MX": 157,
            "PA": 173,
            "PE": 174
        };


        const deleteTransaction =[
            "4283253",
            "4283252",
            "4283251",
            "4283250",
            "4283249",
            "4283248",
            "4283247",
            "4283246",
            "4283239",
            "4283238",
            "4283237",
            "4283236",
            "4283137",
            "4283136"
        ]
        function execute(Context) {
            try {
                
                //createOperationType()
                //createDataMandatoryFields("CO");
                
                Remove_Trans("4286738","customerpayment",true)

                /*
                const newInvoices = [];
                for (let i = 0; i < 2; i++) {
                    newInvoices.push(makeCopyInvoice("4283443"));
                }
                log.error("newInvoices", newInvoices)
                deleteInvoices(deleteTransaction);
                const newInvoices = [];
                for (let i = 0; i < 4; i++) {
                    newInvoices.push(makeCopyInvoice("4283443"));
                }
                log.error("newInvoices", newInvoices)

                Object.keys(countries).forEach(country => {
                    createDataMandatoryFields(country);
                })

                
                let response = https.requestSuitelet({
                    scriptId: "customscript_lr_loadvalidate_stlt",
                    deploymentId: "customdeploy_lr_loadvalidate_stlt",
                    headers: {
                      "Content-Type": "application/json",
                      "User-Agent": "Mozilla/5.0"
                    },
                    method: "POST",
                    body: JSON.stringify({
                        recordType: "customer",
                        country: 48
                    })
                  });
                log.error("response",response.body)
                response = JSON.parse(response.body);

                const {fieldValidations,status,code} = response;
                log.error("status",status)
                log.error("code",code)
                const arraytemp = []
                fieldValidations.forEach(({nameFieldID,section}) =>{
                    arraytemp.push({nameFieldID,section});
                }) 
                log.error("fieldValidations",arraytemp)
                */
            } catch (error) {
                log.error('Error execute', error)
            }

        }


        const makeCopyInvoice = (originalInvoiceId) => {

            if (!originalInvoiceId) {
                log.error('ERROR', 'El ID del Invoice a copiar es requerido.');
                return;
            }

            log.audit('INICIO', `Iniciando copia del Invoice con ID: ${originalInvoiceId}`);

            // Copiar el registro Invoice
            const newInvoice = record.copy({
                type: record.Type.INVOICE,
                id: originalInvoiceId,
                isDynamic: true
            });

            // Actualizar campos en el nuevo registro si es necesario
            newInvoice.setValue({
                fieldId: 'postingperiod',
                value: 200
            });

            newInvoice.setValue({
                fieldId: 'custbody_lmry_pe_estado_sf',
                value: ""
            });

            newInvoice.setValue({
                fieldId: 'approvalstatus',
                value: "2"
            });

            const dateStr = "16/07/2012"; // Formato inicial
            const [day, month, year] = dateStr.split('/'); // Desglosa la fecha
            const formattedDate = new Date(`${year}-${month}-${day}`); // Convierte a formato YYYY-MM-DD

            // Setear la fecha en el campo 'trandate'
            newInvoice.setValue({
                fieldId: 'trandate',
                value: formattedDate
            });

            newInvoice.setValue({
                fieldId: 'memo',
                value: `D1738`
            });

            // Guardar el nuevo Invoice
            return newInvoice.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });
        }


        const deleteInvoices = (Ids) => {
            Ids.forEach(element => {
                record.delete({
                    type: 'invoice',
                    id: element,
                });
                log.audit("invoice eliminado",element)
            });
        }

        const deleteAllRecord = () => {
            /* Query */
            const max = 5;
            let i = 0;
            search.create({
                type: "customrecord_lmry_br_ibpt",
                filters: [],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    })
                ]
            }).run().each(result => {
                const internalid = result.getValue("internalid");
                if (i > max) return false;
                const idrecord = record.delete({
                    type: 'customrecord_lmry_br_ibpt',
                    id: internalid,
                });
                i++
                log.error("idrecord", idrecord)
                return true;
            });
        }

        const createDataMandatoryFields = (country) => {


            log.error("country.toUppercase()", country.toLowerCase())
            log.error("countries[country.toUppercase()]", countries[country])
            const mandatoryFields = [];
            let count = 0;
            const sections = getSection();
            const operationsType = getOperationType();
            search.create({
                type: "customrecord_lmry_validation_fields",
                filters: [
                    ["custrecord_lmry_validation_country", "anyof", countries[country]]
                ],
                columns: [
                    search.createColumn({ name: "name", label: "Name" }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_validation_country.id}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_mandatory}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_section}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_invoice}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_credit_memo}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_bill}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_bill_credit}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_cust_payment}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_vend_payment}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_customer}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_vendor}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_project}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_employee}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_prospect}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_lead}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_expensereport}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_vendretaut}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_cashsale}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_fiscal_doc_type.id}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_column_name_sp}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_column_name_en}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_item_fulfill}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{isinactive}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custrecord_lmry_val_ope_type}",
                        label: "Formula (Text)"
                    }),
                ]
            }).run().each(function (result) {
                const { columns, getValue, getText } = result;
                count++;
                const get = (i) => getValue(columns[i]);
                const varid = `lr_sdf_validation_fields_${country.toLowerCase()}_${formatNumberWithZeros(count)}`;
                //log.error("seccion encontrado",sections.find(section => section.name == get(3)).scriptid)
                let operationType = get(24).replace(/\t/g, "");
                mandatoryFields.push({
                    custrecord_lr_val_name: get(0),
                    isinactive: get(23),
                    scriptid: varid,
                    externalid: varid,
                    custrecord_lr_validation_country: get(1),
                    custrecord_lr_mandatory: get(2),
                    custrecord_lr_val_section: sections.find(section => section.name == get(3)).scriptid,
                    custrecord_lr_val_invoice: get(4),
                    custrecord_lr_val_credit_memo: get(5),
                    custrecord_lr_val_bill: get(6),
                    custrecord_lr_val_bill_credit: get(7),
                    custrecord_lr_val_cust_payment: get(8),
                    custrecord_lr_val_vend_payment: get(9),
                    custrecord_lr_val_customer: get(10),
                    custrecord_lr_val_vendor: get(11),
                    custrecord_lr_val_project: get(12),
                    custrecord_lr_val_employee: get(13),
                    custrecord_lr_val_prospect: get(14),
                    custrecord_lr_val_lead: get(15),
                    custrecord_lr_val_expensereport: get(16),
                    custrecord_lr_val_vendretaut: get(17),
                    custrecord_lr_val_cashsale: get(18),
                    custrecord_lr_val_fiscal_doc_type: get(19),
                    custrecord_lr_column_name_sp: get(20),
                    custrecord_lr_column_name_en: get(21),
                    custrecord_lr_val_item_fulfill: get(22),
                    custrecord_lr_val_ope_type: operationsType.find(operation => operation.name == operationType)?.scriptid || "",
                });
                return true;
            });

            const nameFile = `customrecord_lr_validation_fields_${country}.csv`;
            const FolderID = "98360";

            buildFile(mandatoryFields, nameFile, FolderID);
        };

        const buildFile = (values, nameFile, FolderID) => {
            values.unshift(Object.keys(values[0]));
            const contentFile = generateFile(values);
            log.error("generate file success", saveFile(contentFile, nameFile, FolderID))
        }

        const generateFile = (values) =>
            values.map(field => Object.values(field).join("\t")).join('\n');

        const saveFile = (fileContent, nameFile, FolderID) => {

            //`customrecord_lr_validation_fields_${country}.csv` "920172"
            const fileGenerate = file.create({
                name: nameFile,
                fileType: file.Type.CSV,
                contents: fileContent,
                encoding: file.Encoding.UTF8,
                folder: FolderID
            });
            return fileGenerate.save();
        };

        const createOperationType = () => {
            let count = 0;
            const operationType = [];
            search.create({
                type: "customrecord_lmry_operation_type",
                filters:
                    [
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{custrecord_lmry_operation_type_code}",
                            label: "Formula (Text)"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{custrecord_lmry_operation_type_country.id}",
                            label: "Formula (Text)"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{custrecord_lmry_sales_status}",
                            label: "Formula (Text)"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{custrecord_lmry_operation_type_doc.id}",
                            label: "Formula (Text)"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{custrecord_lmry_operation_type_ref}",
                            label: "Formula (Text)"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{isinactive}",
                            label: "Formula (Text)"
                        }),
                    ]
            }).run().each(result => {
                const { columns, getValue } = result;
                count++;
                const get = (i) => getValue(columns[i]);
                const varid = `lr_sdf_operation_type_${formatNumberWithZeros(count)}`;
                //log.error("seccion encontrado",sections.find(section => section.name == get(3)).scriptid)
                operationType.push({
                    id: count,
                    custrecord_lr_operation_type_name: get(0).replace(/\t/g, ""),
                    isinactive: get(6),
                    scriptid: varid,
                    externalid: varid,
                    custrecord_lr_operation_type_code: get(1),
                    custrecord_lr_operation_type_country: get(2),
                    custrecord_lr_sales_status: get(3) || "F",
                    custrecord_lr_operation_type_doc: get(4),
                    custrecord_lr_operation_type_ref: get(5) || "F",
                    name: get(0).replace(/\t/g, ""),
                });

                return true;
            });

            const nameFile = `customrecord_lr_operation_type.csv`;
            const FolderID = "98360";

            buildFile(operationType, nameFile, FolderID);
        }

        const getOperationType = () => {
            const operationType = [];
            search.create({
                type: "customrecord_lr_operation_type",
                filters:
                    [
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "formulatext",
                            formula: "{custrecord_lr_operation_type_name}",
                            label: "Formula (Text)"
                        }),
                        search.createColumn({ name: "scriptid", label: "Script ID" })
                    ]
            }).run().each(result => {
                const { columns, getValue } = result;
                const get = (i) => getValue(columns[i]);

                operationType.push(
                    {
                        name: get(0).replace(/\t/g, ""),
                        scriptid: get(1)
                    }
                );
                return true;
            });
            log.error("operationType", operationType)
            return operationType;
        }
        const getSection = () => {
            const section = [];
            search.create({
                type: "customrecord_lr_advance_section",
                filters:
                    [
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "scriptid", label: "Script ID" })
                    ]
            }).run().each(result => {
                const { columns, getValue } = result;
                const get = (i) => getValue(columns[i]);

                section.push(
                    {
                        name: get(0),
                        scriptid: get(1)
                    }
                );
                return true;
            });
            log.error("section", section)
            return section;
        }

        function formatNumberWithZeros(number) {
            return number.toString().padStart(6, '0');
        }

        function Remove_Trans(_recordId, recordType, void_feature) {
            let jsonEnableFeat = getEnableFeatures();
            if (recordType == 'customtransaction_lmry_payment_complemnt') {
                _rec = record.load({
                    type: recordType,
                    id: _recordId,
                    isDynamic: false
                });

                var count_invoice = _rec.getLineCount({
                    sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_cust'
                });
                for (var i = 0; i < count_invoice; i++) {
                    _rec.setSublistValue({
                        sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_cust',
                        fieldId: 'custrecord_lmry_factoring_apply_compensa',
                        line: i,
                        value: false
                    });
                    _rec.setSublistValue({
                        sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_cust',
                        fieldId: 'custrecord_lmry_factoring_apply_invoice',
                        line: i,
                        value: false
                    });
                }

                var count_bills = _rec.getLineCount({
                    sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_vend'
                });
                for (var i = 0; i < count_bills; i++) {
                    _rec.setSublistValue({
                        sublistId: 'recmachcustrecord_lmry_factoring_rel_pymnt_vend',
                        fieldId: 'custrecord_lmry_factoring_apply_bill',
                        line: i,
                        value: false
                    });
                }
                _rec.setValue('custpage_amount_deposited', 0)
                _rec.setValue('custpage_vendor_subtotal', 0);
                _rec.setValue('custpage_vendor_total', 0);
                _rec.setValue('custpage_apply_total', 0);

                var count_accounts = _rec.getLineCount({
                    sublistId: 'line'
                });
                for (var i = 0; i < count_accounts; i++) {
                    _rec.setSublistValue('line', 'credit', i, 0);
                    _rec.setSublistValue('line', 'debit', i, 0);
                }
                _rec.save({
                    ignoreMandatoryFields: true,
                    enableSourcing: true
                });

            } else if (recordType == 'customerpayment') {
                var validJournal = true,
                    journalId = "";
                if (void_feature == true || void_feature == 'T') {
                    if (!jsonEnableFeat.voidOnlyTransaction.includes("payments")) {
                        var resultJournal = library_AnulacionInvoice.reversalJournal(_recordId);
                        log.debug('resultJournal', resultJournal);
                        validJournal = (resultJournal.fields.length == 0);
                        journalId = resultJournal.trans || "";
                    }
                }

                if (validJournal) {
                    var _rec = record.load({
                        type: "customerpayment",
                        id: _recordId
                    });

                    var count_invoice = _rec.getLineCount({
                        sublistId: 'apply'
                    });
                    for (i = 0; i < count_invoice; i++) {
                        if (_rec.getSublistValue('apply', 'apply', i)) {
                            _rec.setSublistValue({
                                sublistId: 'apply',
                                fieldId: 'apply',
                                line: i,
                                value: false
                            });
                        }
                        if (journalId) {
                            var transactionId = _rec.getSublistValue("apply", "internalid", i);
                            if (transactionId == journalId) {
                                _rec.setSublistValue({
                                    sublistId: "apply",
                                    fieldId: "apply",
                                    line: i,
                                    value: true
                                })
                            }
                        }
                    }
                    _rec.save({
                        ignoreMandatoryFields: true,
                        enableSourcing: true,
                    });
                }
            }
        }

        function getEnableFeatures() {
            /* Registro Personalizado LatamReady - MX FEL Enable Feature */
            let jsonResult = {};

            search.create({
                type: "customrecord_lmry_mx_fel_enable_feature",
                columns: [
                    'custrecord_lmry_mx_fel_host',
                    'custrecord_lmry_mx_fel_sendtype',
                    'custrecord_lmry_mx_fel_user',
                    'custrecord_lmry_mx_fel_password',
                    'custrecord_lmry_mx_fel_email',
                    'custrecord_lmry_mx_fel_mail_cancel',
                    'custrecord_lmry_mx_fel_void_only_current',
                    'custrecord_lmry_mx_fel_void_pay_wo_jrnl',
                    'custrecord_lmry_mx_fel_void_transactions'
                ],
                filters: [
                    ['custrecord_lmry_mx_fel_subsi', 'anyof', "6"]
                ]
            }).run().each(function(obj) {
                jsonResult = {
                    host: obj.getValue('custrecord_lmry_mx_fel_host'),
                    sendType: obj.getValue('custrecord_lmry_mx_fel_sendtype'),
                    user: obj.getValue('custrecord_lmry_mx_fel_user'),
                    password: obj.getValue('custrecord_lmry_mx_fel_password'),
                    emailSubsi: obj.getValue('custrecord_lmry_mx_fel_email'),
                    sendEmailCancel: obj.getValue('custrecord_lmry_mx_fel_mail_cancel'),
                    voidOnlyCurrent: obj.getValue('custrecord_lmry_mx_fel_void_only_current'),
                    voidPayWithoutJournal: obj.getValue('custrecord_lmry_mx_fel_void_pay_wo_jrnl'),
                    voidOnlyTransaction: JSON.parse(obj.getValue('custrecord_lmry_mx_fel_void_transactions') || "[]")
                };

                if (jsonResult.password) {
                    jsonResult.password = jsonResult.password.replace(/&/g, "&amp;");
                }

                return false;
            });

            return jsonResult;
        }
        return {
            execute: execute
        };
    });


