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
    'N/xml',
    "N/render",
    "N/encode"
],
    function (file, search, record, log, query, runtime, https, xml,nRender,nEncode) {

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

                calculateVersion()
                //createOperationType()
                //createDataMandatoryFields("CO");

                /*
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

        const compareVersions = (v1, v2) => 
            v1.split('.').map(Number).reduce((diff, num, i) => diff || num - v2.split('.')[i], 0);
        
        const getMaxVersion = (versions) => 
            versions.reduce((max, { version }) => compareVersions(version, max) > 0 ? version : max, versions[0].version);
        
        
        const calculateVersion = () => {
            const fileObj = file.load({ id: "5166567" });
            log.debug("fileObj", fileObj);
            
            const xmlData = fileObj.getContents();
            const document = xml.Parser.fromString({ text: xmlData });
            const issues = Array.from(document.getElementsByTagName('Issue')); // Convertir NodeList a Array
            log.debug("issues", issues);
        
            let major = 0, minor = 0, patch = 0;
            let lastMajorRelease = '';
            const resultVersions = [];
        
            for (const issue of issues) {
                // Extraer valores de cada etiqueta de forma limpia
                const getValue = (tag) => issue.getElementsByTagName(tag)[0]?.textContent.trim() || '';
        
                const id = getValue('ID');
                const release = getValue('Release');
                const isClienteIssue = getValue('IsClienteIssue') === 'true';
                const isMajor = getValue('IsMajor') === 'true';
                const title = getValue('Title');
                const description = getValue('Description');
        
                // Lógica de incremento de versiones
                if (isMajor) {
                    major++;
                    minor = 0;
                    patch = 0;
                } 
                if (release !== lastMajorRelease) {
                    minor++;
                    patch = 0;
                }
        
                if (isClienteIssue) patch++;
        
                lastMajorRelease = release;
        
                // Agregar al resultado
                resultVersions.push({
                    card: id,
                    version: `${major}.${minor}.${patch}`,
                    release,
                    title,
                    description
                });
        
                log.debug("card", `${id} : (${major}.${minor}.${patch})`);
            }
        
            log.debug("resultVersions", resultVersions);
            log.debug("version", getMaxVersion(resultVersions));
            const versionGruoped = groupedByVersion(resultVersions);
            log.debug("Card agrupados", versionGruoped);

            const strPDF = renderPDF(versionGruoped);
            const nameFile = "versionPDF_2.pdf"
            savePDF(nameFile,strPDF,"920172")

        };

        const groupedByVersion = (cards) =>{
            return cards.reduce((acc, { version, card, release, title, description }) => {
                acc[version] = acc[version] || [];
                acc[version].push({ card, release, title, description });
                return acc;
            }, {});
        }

        const renderPDF = (versionGruoped) => {
            var renderer = nRender.create();
            renderer.templateContent = getTemplate();
            renderer.addCustomDataSource({
                format: nRender.DataSource.OBJECT,
                alias: "input",
                data: {
                    data: JSON.stringify(versionGruoped)
                }
            });
            return renderer.renderAsPdf();
        }

        const savePDF = (nameFile,strContent,folderId) => {
            let fileRpt;
            fileRpt = strContent;
            fileRpt.name = nameFile;
            fileRpt.folder = folderId;
            const pdfID = fileRpt.save()
            log.debug("save pdfID :",pdfID)
        }
        //920172

        function getTemplate() {
            var aux = file.load("SuiteScripts/Giussepe/LR_VersionPDF_2.xml");
            return aux.getContents();
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
        return {
            execute: execute
        };
    });


