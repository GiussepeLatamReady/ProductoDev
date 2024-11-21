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
    "N/https"
],
    function (file,search, record, log, query, runtime,https) {

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
        function execute(Context) {
            try {

                Object.keys(countries).forEach(country =>{
                    createDataMandatoryFields(country);
                })
                
                
                /*
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
               log.error('Error execute',error)
            }
          
        }

        


        const deleteAllRecord = () => {
            /* Query */
            const max = 5;
            let i=0;
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
                if (i>max) return false;
                const idrecord =record.delete({
                    type: 'customrecord_lmry_br_ibpt',
                    id: internalid,
                });
                i++
                log.error("idrecord",idrecord)
                return true;
            });
        }

        const createDataMandatoryFields = (country) => {
            

            log.error("country.toUppercase()",country.toLowerCase())
            log.error("countries[country.toUppercase()]",countries[country])
            const mandatoryFields = [];
            let count = 0;
            const sections = getSection();
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
                    })
                ]
            }).run().each(function (result) {
                const { columns, getValue } = result;
                count++;
                const get = (i) => getValue(columns[i]);
                const varid = `mf_${country.toLowerCase()}_${formatNumberWithZeros(count)}`;
                //log.error("seccion encontrado",sections.find(section => section.name == get(3)).scriptid)
                mandatoryFields.push({
                    custrecord_lr_val_name: get(0),
                    isinactive: get(23),
                    scriptid:varid,
                    externalid:varid,
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
                    custrecord_lr_val_item_fulfill: get(22)
                });
                return true;
            });

            mandatoryFields.unshift(Object.keys(mandatoryFields[0]));
            //mandatoryFields.slice(0, 5);
            //log.error("mandatoryFields",mandatoryFields.slice(0, 3))

            const contentFile = generateFile(mandatoryFields);
            //log.error("contentFile",contentFile)
            log.error("generate file success",saveFile(contentFile,country))
           //return mandatoryFields;
        };

        const generateFile = (mandatoryFields) => 
            mandatoryFields.map(field => Object.values(field).join("\t")).join('\n');

        const saveFile = (fileContent,country) => {
            const fileGenerate = file.create({
                name: `customrecord_lr_validation_fields_${country}.csv`,
                fileType: file.Type.CSV,
                contents: fileContent,
                encoding: file.Encoding.UTF8,
                folder: "920172"
            });
            return fileGenerate.save();
        };

        const getSection = () => {
            const section = [];
            search.create({
                type: "customrecord_lr_advance_section",
                filters:
                [
                ],
                columns:
                [
                   search.createColumn({name: "name", label: "Name"}),
                   search.createColumn({name: "scriptid", label: "Script ID"})
                ]
             }).run().each(result =>{
                const { columns, getValue } = result;
                const get = (i) => getValue(columns[i]);

                section.push(
                    {
                        name:get(0),
                        scriptid:get(1)
                    }
                );
                return true;
             });
             log.error("section",section)
             return section;
        }

        function formatNumberWithZeros(number) {
            return number.toString().padStart(6, '0');
        }
        return {
            execute: execute
        };
    });


