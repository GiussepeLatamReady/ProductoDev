/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_AdvanceFlow_STLT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 05/09/2023
 */
define(['N/runtime'],
    
    (runtime) => {

        let subsiOW = runtime.isFeatureInEffect({
            feature: 'SUBSIDIARIES'
        });

        let Language = runtime.getCurrentScript().getParameter({
            name: 'LANGUAGE'
        });
        Language = Language.substring(0, 2);

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                if (context.request.method == 'GET') {
                    let form = serverWidget.createForm({
                        title: jsonLanguage.title[Language]
                    });

                    let Rd_Subsi = context.request.parameters.custparam_subsi;
                    let Rd_Date = context.request.parameters.custparam_date;
                    let Rd_Date_2 = context.request.parameters.custparam_date_2;
                    let Rd_Country = context.request.parameters.custparam_country;
                    let Rd_Transaction = context.request.parameters.custparam_transaction;
                    let Rd_CheckPaid = context.request.parameters.custparam_checkpaid;
                    let allLicenses = libraryFeature.getAllLicenses();

                    let idFeature = {
                        AR: 341,
                        BO: 704,
                        BR: 339,
                        CL: 342,
                        CO: 343,
                        CR: 523,
                        EC: 601,
                        GT: 706,
                        MX: 338,
                        PA: 441,
                        PE: 344,
                        UY: 647,
                        DO: 860,
                        PY: 965
                    };

                    // Primary Information
                    form.addFieldGroup({
                        id: 'group_pi',
                        label: jsonLanguage.primary[Language]
                    });

                    if (subsiOW) {
                        let f_subsi = form.addField({
                            id: 'custpage_subsi',
                            type: 'select',
                            label: jsonLanguage.subsidiary[Language],
                            container: 'group_pi'
                        });
                        f_subsi.isMandatory = true;

                        let searchSub = search.create({
                            type: 'subsidiary',
                            columns: ['name', 'internalid'],
                            filters: [{
                                name: 'isinactive',
                                operator: 'is',
                                values: 'F'
                            }, {
                                name: 'country',
                                operator: 'anyof',
                                values: Object.keys(idFeature)
                            }]
                        });
                        let resultSub = searchSub.run().getRange({
                            start: 0,
                            end: 1000
                        });

                        if (resultSub != null && resultSub.length > 0) {
                            f_subsi.addSelectOption({
                                value: 0,
                                text: ' '
                            });
                            for (let i = 0; i < resultSub.length; i++) {
                                let subsi_id = resultSub[i].getValue('internalid');
                                let subsi_name = resultSub[i].getValue('name');

                                f_subsi.addSelectOption({
                                    value: subsi_id,
                                    text: subsi_name
                                });
                            }
                        }
                    }

                    let p_country = form.addField({
                        id: 'custpage_country',
                        type: serverWidget.FieldType.TEXT,
                        label: jsonLanguage.country[Language],
                        container: 'group_pi'
                    });
                    p_country.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.DISABLED
                    });
                    p_country.updateDisplaySize({
                        height: 60,
                        width: 30
                    });

                    if (!subsiOW) {
                        let countryConfig = config.load({
                            type: config.Type.COMPANY_INFORMATION
                        });
                        countryConfig = countryConfig.getText({
                            fieldId: 'country'
                        });

                        p_country.defaultValue = countryConfig;
                    }

                    let p_transaction = form.addField({
                        id: 'custpage_transaction',
                        type: 'select',
                        label: jsonLanguage.transaction[Language],
                        container: 'group_pi'
                    });
                    p_transaction.isMandatory = true;

                    // Modificacion 02-03-2022: Checkbox - Include Paid Transactions
                    let p_checkpaid = form.addField({
                        id: 'custpage_checkpaid',
                        type: 'checkbox',
                        label: jsonLanguage.checkpaid[Language],
                        container: 'group_pi'
                    });

                    p_checkpaid.defaultValue = 'F';

                    // Modificacion 26.03-2020 : Grupo - Date Ranges
                    form.addFieldGroup({
                        id: 'group_rg',
                        label: jsonLanguage.dateranges[Language]
                    });

                    let f_date = form.addField({
                        id: 'custpage_date',
                        type: serverWidget.FieldType.DATE,
                        label: jsonLanguage.datefrom[Language],
                        container: 'group_rg',
                        source: 'date'
                    });
                    f_date.updateDisplaySize({
                        height: 60,
                        width: 30
                    });
                    f_date.isMandatory = true;

                    let f_date_2 = form.addField({
                        id: 'custpage_date_2',
                        type: serverWidget.FieldType.DATE,
                        label: jsonLanguage.dateto[Language],
                        container: 'group_rg',
                        source: 'date'
                    });
                    f_date_2.updateDisplaySize({
                        height: 60,
                        width: 30
                    });
                    f_date_2.isMandatory = true;

                    // CONTEO DE TRANSACCIONES
                    if (Rd_Country) {
                        form.addFieldGroup({
                            id: 'group_count',
                            label: jsonLanguage.transactioncount[Language]
                        });

                        let fNumber = form.addField({
                            id: 'custpage_number',
                            type: serverWidget.FieldType.INTEGER,
                            label: jsonLanguage.numbertransactions[Language],
                            container: 'group_count'
                        });
                        fNumber.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                        fNumber.updateDisplaySize({
                            height: 60,
                            width: 30
                        });

                        let fSeleccionadas = form.addField({
                            id: 'custpage_seleccionadas',
                            type: serverWidget.FieldType.INTEGER,
                            label: jsonLanguage.numberselectedtransactions[Language],
                            container: 'group_count'
                        });
                        fSeleccionadas.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                        fSeleccionadas.updateDisplaySize({
                            height: 60,
                            width: 30
                        });
                        fSeleccionadas.defaultValue = 0;

                        let fSelectTransaction = form.addField({
                            id: 'custpage_select',
                            type: serverWidget.FieldType.SELECT,
                            label: jsonLanguage.selecttransactions[Language],
                            container: 'group_count'
                        });
                        fSelectTransaction.addSelectOption({
                            value: '',
                            text: ' '
                        });
                        fSelectTransaction.addSelectOption({
                            value: 500,
                            text: '500 ' + jsonLanguage.transactions[Language]
                        });
                        fSelectTransaction.addSelectOption({
                            value: 1000,
                            text: '1000 ' + jsonLanguage.transactions[Language]
                        });
                        fSelectTransaction.addSelectOption({
                            value: 2000,
                            text: '2000 ' + jsonLanguage.transactions[Language]
                        });

                        fSelectTransaction.updateBreakType({
                            breakType: serverWidget.FieldBreakType.STARTCOL
                        });

                        let fQuantity = form.addField({
                            id: 'custpage_quantity',
                            type: serverWidget.FieldType.INTEGER,
                            label: jsonLanguage.transactionstoselect[Language],
                            container: 'group_count'
                        });
                        fQuantity.updateDisplaySize({
                            height: 60,
                            width: 30
                        });
                    }

                    if (runtime.envType == 'SANDBOX' || runtime.accountId.indexOf('TSTDRV') == 0) {
                        let myInlineHtml = form.addField({
                            id: 'custpage_id_message',
                            label: 'MESSAGE',
                            type: serverWidget.FieldType.INLINEHTML
                        });
                        myInlineHtml.layoutType = serverWidget.FieldLayoutType.OUTSIDEBELOW;
                        // myInlineHtml.updateBreakType({breakType : serverWidget.FieldBreakType.STARTCOL});

                        let strhtml = '<html>';
                        strhtml += '<table border="0" class="table_fields" cellspacing="0" cellpadding="0">';
                        strhtml += '<tr>';
                        strhtml += '</tr>';
                        strhtml += '<tr>';
                        strhtml += '<td class="text">';
                        strhtml += '<div style="color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver">';
                        strhtml += jsonLanguage.autentification[Language] + '</div>';
                        strhtml += '</td>';
                        strhtml += '</tr>';
                        strhtml += '</table>';
                        strhtml += '</html>';

                        myInlineHtml.defaultValue = strhtml;
                    }

                    let f_sublist = form.addSublist({
                        id: 'custpage_sublista',
                        label: jsonLanguage.invoices[Language],
                        type: serverWidget.SublistType.LIST
                    });
                    f_sublist.addField({
                        id: 'id_apply',
                        type: serverWidget.FieldType.CHECKBOX,
                        label: jsonLanguage.apply[Language]
                    });
                    f_sublist.addField({
                        id: 'id_int',
                        type: serverWidget.FieldType.TEXT,
                        label: jsonLanguage.internalid[Language]
                    });
                    f_sublist.addField({
                        id: 'id_tran',
                        type: serverWidget.FieldType.TEXT,
                        label: jsonLanguage.tranid[Language]
                    });
                    f_sublist.addField({
                        id: 'id_type',
                        type: serverWidget.FieldType.TEXT,
                        label: jsonLanguage.transaction[Language]
                    });
                    f_sublist.addField({
                        id: 'id_date',
                        type: serverWidget.FieldType.DATE,
                        label: jsonLanguage.date[Language]
                    });
                    f_sublist.addField({
                        id: 'id_ent',
                        type: serverWidget.FieldType.TEXT,
                        label: jsonLanguage.customer[Language]
                    });
                    f_sublist.addField({
                        id: 'id_doc',
                        type: serverWidget.FieldType.TEXT,
                        label: jsonLanguage.documenttype[Language]
                    });
                    f_sublist.addField({
                        id: 'id_memo',
                        type: serverWidget.FieldType.TEXT,
                        label: jsonLanguage.memo[Language]
                    });
                    f_sublist.addField({
                        id: 'id_amount',
                        type: serverWidget.FieldType.TEXT,
                        label: jsonLanguage.amount[Language]
                    });

                    if (Rd_Country) {
                        p_country.defaultValue = Rd_Country;

                        Rd_Country = Rd_Country.substring(0, 3).toUpperCase();
                        let country_acento = Rd_Country;
                        Rd_Country = validarAcentos(Rd_Country);

                        let featureAdvanced = false;

                        if (subsiOW) {
                            let licenses = libraryFeature.getLicenses(Rd_Subsi);

                            featureAdvanced = advanced(licenses, Rd_Country, idFeature);
                        } else {
                            let key = Object.keys(allLicenses)[0];

                            let licenses = libraryFeature.getLicenses(key);

                            featureAdvanced = advanced(licenses, Rd_Country, idFeature);
                        }

                        // VALIDACION EI - PACKAGE
                        if (featureAdvanced) {
                            let filtrosPackage = [];

                            filtrosPackage[0] = search.createFilter({
                                name: 'isinactive',
                                operator: 'is',
                                values: 'F'
                            });
                            filtrosPackage[1] = search.createFilter({
                                name: 'custrecord_lmry_ei_pckg_sm',
                                operator: 'noneof',
                                values: '@NONE@'
                            });
                            filtrosPackage[2] = search.createFilter({
                                name: 'custrecord_lmry_ei_pckg_template',
                                operator: 'noneof',
                                values: '@NONE@'
                            });
                            filtrosPackage[3] = search.createFilter({
                                name: 'custrecord_lmry_ei_pckg_doc_type',
                                operator: 'isnotempty',
                                values: ''
                            });
                            if (subsiOW) {
                                filtrosPackage[4] = search.createFilter({
                                    name: 'custrecord_lmry_ei_pckg_subsi',
                                    operator: 'anyof',
                                    values: Rd_Subsi
                                });
                            }

                            let searchPackage = search.create({
                                type: 'customrecord_lmry_ei_pckg',
                                filters: filtrosPackage,
                                columns: ['custrecord_lmry_ei_pckg_doc_type', 'custrecord_lmry_ei_pckg_trans_type']
                            });
                            let resultPackage = searchPackage.run().getRange({
                                start: 0,
                                end: 1000
                            });

                            let jsonPackage = {};
                            if (resultPackage != null && resultPackage.length > 0) {
                                for (let i = 0; i < resultPackage.length; i++) {
                                    let documento = resultPackage[i].getValue('custrecord_lmry_ei_pckg_doc_type');
                                    let transaccion = resultPackage[i].getValue('custrecord_lmry_ei_pckg_trans_type');

                                    if (Rd_Country == 'BRA' && transaccion) {
                                        if (transaccion == '7') {
                                            transaccion = 'custinvc';
                                        } else if (transaccion == '32') {
                                            transaccion = 'itemship';
                                        } else if (transaccion == '17') {
                                            transaccion = 'vendbill';
                                        } else if (transaccion == '16') {
                                            transaccion = 'itemrcpt';
                                        } else if (transaccion == '20') {
                                            transaccion = 'vendcred';
                                        } else if (transaccion == '10') {
                                            transaccion = 'custcred';
                                        }
                                        jsonPackage[documento + ';' + transaccion] = documento;
                                    } else {
                                        jsonPackage[documento] = documento;
                                    }
                                }
                            }
                        }

                        let f_state = form.addField({
                            id: 'custpage_state',
                            label: jsonLanguage.state[Language],
                            type: serverWidget.FieldType.TEXT,
                            container: 'group_pi'
                        });
                        f_state.defaultValue = 'PENDIENTE';

                        // Campo para verificar CONEXION DIAN solo para Colombia
                        if (Rd_Country == 'COL') {
                            let sendType = '';
                            let busqEnabFeat = search.create({
                                type: 'customrecord_lmry_co_ei_enable_features',
                                columns: ['custrecord_lmry_co_ei_sendtype'],
                                filters: ['custrecord_lmry_co_ei_subsi', 'anyof', Rd_Subsi]
                            });
                            let resultEnabFet = busqEnabFeat.run().getRange(0, 10);
                            if (resultEnabFet != null && resultEnabFet.length != 0) {
                                row = resultEnabFet[0].columns;
                                let sendType = resultEnabFet[0].getValue(row[0]);
                            }
                            log.error('Send Type', sendType);
                            let authCode = '';
                            try {
                                if (sendType == '1') {
                                    let objStatus = http.get({
                                        url: 'http://test.comfiar.co/FormSemaforos.aspx'
                                        // ,headers: soapHeaders
                                    });
                                }
                                if (sendType == '2') {
                                    let objStatus = https.get({
                                        url: 'https://app.comfiar.co/FormSemaforos.aspx'
                                        // ,headers: soapHeaders
                                    });
                                }
                                authCode = objStatus.code;
                            } catch (e) {
                                authCode = '';
                                log.error('error de conexion del semaforo', e);
                                log.debug('error de conexion del semaforo', e);
                            }
                            let dian_status = form.addField({
                                id: 'custpage_dian',
                                type: serverWidget.FieldType.TEXT,
                                label: 'DIAN STATUS',
                                container: 'group_pi'
                            });
                            dian_status.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.DISABLED
                            });
                            dian_status.updateDisplaySize({
                                height: 60,
                                width: 30
                            });
                            // let authCode = objStatus.code;
                            if (authCode == '200') {
                                let estado = objStatus.body.split('Conexión DIAN')[1];
                                let dianEstado = '';
                                if (estado != null && estado != '') {
                                    dianEstado = estado.split('alt="')[1].split('style')[0];
                                    dianEstado = dianEstado.substring(0, dianEstado.length - 2);
                                    dian_status.defaultValue = dianEstado;
                                } else {
                                    dian_status.defaultValue = 'CONEXION NO DISPONIBLE';
                                }
                            } else {
                                dian_status.defaultValue = 'CONEXION NO DISPONIBLE';
                            }
                        }
                        // FIN de MODIFICACIONES

                        // BUSQUEDA TIPO DE DOCUMENTO
                        let filtros_document = [],
                            json_document = {};
                        filtros_document[0] = search.createFilter({
                            name: 'isinactive',
                            operator: 'is',
                            values: 'F'
                        });
                        filtros_document[1] = search.createFilter({
                            name: 'custrecord_lmry_fact_electronica',
                            operator: 'is',
                            values: 'T'
                        });
                        filtros_document[2] = search.createFilter({
                            name: 'formulatext',
                            formula: '{custrecord_lmry_country_applied}',
                            operator: 'startswith',
                            values: country_acento
                        });

                        let search_document = search.create({
                            type: 'customrecord_lmry_tipo_doc',
                            columns: ['internalid'],
                            filters: filtros_document
                        });
                        let result_document = search_document.run().getRange({
                            start: 0,
                            end: 1000
                        });

                        if (result_document != null && result_document.length > 0) {
                            for (let i = 0; i < result_document.length; i++) {
                                json_document[result_document[i].getValue('internalid')] = result_document[i].getValue('internalid');
                            }
                        }

                        let type_transaction = 'transaction';

                        if (Rd_Transaction != null && Rd_Transaction != '' && Rd_Transaction != '0') {
                            Rd_Transaction = Rd_Transaction.split(';');
                            type_transaction = Rd_Transaction[0];
                        }

                        // FEATURE RETENCIONES
                        let brRetenciones = libraryFeature.getAuthorization(416, licenses);
                        let coRetenciones = libraryFeature.getAuthorization(27, licenses);
                        let coRetencionesLines = libraryFeature.getAuthorization(340, licenses);

                        // BUSQUEDA INVOICE
                        let filtros_invoice = [];
                        filtros_invoice[0] = search.createFilter({
                            name: 'mainline',
                            operator: 'is',
                            values: 'T'
                        });
                        filtros_invoice[1] = search.createFilter({
                            name: 'trandate',
                            operator: 'onorbefore',
                            values: Rd_Date_2
                        });
                        filtros_invoice[2] = search.createFilter({
                            name: 'trandate',
                            operator: 'onorafter',
                            values: Rd_Date
                        });
                        // filtros_invoice[4] = [["type","anyof","CustCred"],"OR",[["type","anyof","CustInvc"],"AND",["amountpaid","equalto","0.00"]]];
                        // filtros_invoice[4] = search.createFilter({name:'amountpaid',operator:'equalto',values:0});
                        // filtros_invoice[4] = search.createFilter({name:'status',operator:'anyof',values:['CustInvc:A','CustCred:A']});

                        let i = 3;
                        if (subsiOW) {
                            filtros_invoice[i] = search.createFilter({
                                name: 'subsidiary',
                                operator: 'is',
                                values: Rd_Subsi
                            });
                            i++;
                        }

                        if (type_transaction == 'transaction') {
                            if (Rd_Country == 'BRA') {
                                // Modificacion 02-12-2021 Se agregó para Bill e Item Receipt
                                filtros_invoice[i] = search.createFilter({
                                    name: 'type',
                                    operator: 'anyof',
                                    values: ['ItemShip', 'CustInvc', 'VendBill', 'ItemRcpt', 'CustCred', 'VendCred']
                                });
                            } else if (Rd_Country == 'MEX') {
                                filtros_invoice[i] = search.createFilter({
                                    name: 'type',
                                    operator: 'anyof',
                                    values: ['CustCred', 'CustInvc', 'CustPymt', 'ItemShip', 'PymtCmpt']
                                });
                            } else if (Rd_Country == 'ECU') {
                                filtros_invoice[i] = search.createFilter({
                                    name: 'type',
                                    operator: 'anyof',
                                    values: ['CustCred', 'CustInvc']
                                });
                            } else if (Rd_Country == 'PER') {
                                filtros_invoice[i] = search.createFilter({
                                    name: 'type',
                                    operator: 'anyof',
                                    values: ['CustCred', 'CustInvc', 'CashSale', 'ItemShip']
                                });
                            } else if (Rd_Country == 'URU') {
                                filtros_invoice[i] = search.createFilter({
                                    name: 'type',
                                    operator: 'anyof',
                                    values: ['CustCred', 'CustInvc', 'CustPymt']
                                });
                            } else if (Rd_Country == 'CHI') {
                                filtros_invoice[i] = search.createFilter({
                                    name: 'type',
                                    operator: 'anyof',
                                    values: ['CustCred', 'CustInvc', 'ItemShip']
                                });
                            } else {
                                filtros_invoice[i] = search.createFilter({
                                    name: 'type',
                                    operator: 'anyof',
                                    values: ['CustCred', 'CustInvc']
                                });
                            }
                            i++;
                        }

                        // Tipo de documento vacio
                        if (featureAdvanced == false) {
                            filtros_invoice[i] = search.createFilter({
                                name: 'custbody_lmry_document_type',
                                operator: 'anyof',
                                values: ['@NONE@']
                            });
                            i++;
                        }

                        // Solo para colombia excluye las retenciones Latam - WHT
                        if (Rd_Country == 'COL') {
                            filtros_invoice[i] = search.createFilter({
                                name: 'memo',
                                operator: 'doesnotstartwith',
                                values: ['Latam - WHT']
                            });
                            i++;
                            filtros_invoice[i] = search.createFilter({
                                name: 'memo',
                                operator: 'doesnotstartwith',
                                values: ['Latam - Country WHT']
                            });
                            i++;
                        }

                        if (Rd_Country == 'MEX') {
                            filtros_invoice[i] = search.createFilter({
                                name: 'memo',
                                operator: 'doesnotcontain',
                                values: ['void']
                            });
                            i++;

                            if (Rd_Transaction.indexOf('itemfulfillment') > -1) {
                                filtros_invoice[i] = search.createFilter({
                                    name: 'custbody_lmry_carga_inicial',
                                    operator: 'is',
                                    values: ['T']
                                });
                                i++;
                            }
                        }

                        if (Rd_Country == 'PER') {
                            filtros_invoice[i] = search.createFilter({
                                name: 'memo',
                                operator: 'doesnotcontain',
                                values: ['VOID']
                            });
                            i++;
                        }

                        if (Rd_Country == 'BRA') {
                            filtros_invoice[i] = search.createFilter({
                                name: 'custbody_lmry_carga_inicial',
                                operator: 'is',
                                values: ['F']
                            });
                            i++;
                        }

                        // Crea la busqueda segun los filtros seleccionados
                        if (subsiOW) {
                            let search_invoice = search.create({
                                type: type_transaction,
                                filters: filtros_invoice,
                                columns: [search.createColumn({
                                    name: 'type',
                                    sort: search.Sort.ASC
                                }),
                                search.createColumn({
                                    name: 'trandate',
                                    sort: search.Sort.ASC
                                }),
                                search.createColumn({
                                    name: 'tranid',
                                    sort: search.Sort.ASC
                                }),
                                    'entity',
                                    'internalid',
                                    'status',
                                    'fxamount',
                                    'externalid',
                                    'custbody_lmry_document_type',
                                    'amountpaid',
                                    'memo',
                                    'total',
                                    'memomain',
                                    'custbody_lmry_processed_transaction'],
                                settings: [search.createSetting({
                                    name: 'consolidationtype',
                                    value: 'NONE'
                                })]
                            });
                        } else {
                            let search_invoice = search.create({
                                type: type_transaction,
                                filters: filtros_invoice,
                                columns: [search.createColumn({
                                    name: 'type',
                                    sort: search.Sort.ASC
                                }),
                                search.createColumn({
                                    name: 'trandate',
                                    sort: search.Sort.ASC
                                }),
                                search.createColumn({
                                    name: 'tranid',
                                    sort: search.Sort.ASC
                                }),
                                    'entity',
                                    'internalid',
                                    'status',
                                    'fxamount',
                                    'externalid',
                                    'custbody_lmry_document_type',
                                    'amountpaid',
                                    'memo',
                                    'total',
                                    'memomain',
                                    'custbody_lmry_processed_transaction']
                            });
                        }

                        let result_invoice = search_invoice.run();
                        let result_invoice3 = result_invoice.getRange({
                            start: 0,
                            end: 900
                        });

                        // BUSQUEDA AUXILIAR SIN MAINLINE PARA EL DESCUENTO
                        let jsonDiscount = {};
                        if (Rd_Country == 'BRA') {
                            filtros_invoice.splice(0, 1);
                            filtros_invoice.push(search.createFilter({
                                name: 'transactiondiscount',
                                operator: 'is',
                                values: 'T'
                            }));
                            let cDiscount = 0,
                                banderaDiscount = true;
                            let searchDiscount = search.create({
                                type: type_transaction,
                                filters: filtros_invoice,
                                columns: ['rate', 'internalid'],
                                settings: [search.createSetting({
                                    name: 'consolidationtype',
                                    value: 'NONE'
                                })]
                            });
                            let resultDiscount = searchDiscount.run();
                            let resultDiscountIt = resultDiscount.getRange({
                                start: cDiscount,
                                end: cDiscount + 1000
                            });

                            if (resultDiscountIt != null && resultDiscountIt.length) {
                                while (banderaDiscount) {
                                    resultDiscountIt = resultDiscount.getRange({
                                        start: cDiscount,
                                        end: cDiscount + 1000
                                    });
                                    for (let i = 0; i < resultDiscountIt.length; i++) {
                                        let rate = resultDiscountIt[i].getValue('rate');
                                        let idInvoiceDiscount = resultDiscountIt[i].getValue('internalid');

                                        if (rate == -100) {
                                            jsonDiscount[idInvoiceDiscount] = idInvoiceDiscount;
                                        }
                                    }

                                    if (resultDiscountIt.length == 1000) {
                                        cDiscount += 1000;
                                    } else {
                                        banderaDiscount = false;
                                    }
                                }
                            }
                        }

                        // BUSQUEDA PRINCIPAL
                        let status_countries = ['Aprobado', 'Observado', 'EMITIDO', 'APROBADO POR SII', 'APROBADO', 'AUTORIZADO', 'Procesando', 'PROCESANDO', 'Autorizado', 'Generado', 'ACEPTADO', 'Cancelada', 'Cancelado', 'Denegada', 'Cancelando', 'No Cancelado', 'No Cancelada', 'EMILOCAL', 'Caida por Intermitencia'];
                        let bandera = true;
                        let contador = 0;
                        let c = 0;

                        let arregloFinal = [];

                        if (result_invoice3 != null && result_invoice3.length > 0) {
                            while (bandera) {
                                result_invoice2 = result_invoice.getRange({
                                    start: contador,
                                    end: contador + 900
                                });

                                if (result_invoice2 != null && result_invoice2.length > 0) {
                                    let transacciones = [];
                                    for (let j = 0; j < result_invoice2.length; j++) {
                                        transacciones.push(result_invoice2[j].getValue('internalid'));
                                        // arregloFinal.push(result_invoice2[j].getValue('internalid'));
                                    }
                                    let json_response = status_invoice(Rd_Country, transacciones, Rd_Subsi);
                                    let transactionsId = [];
                                    let pymntCompFields = [];
                                    let tranFields = [];
                                    let pymntCompDoc = {};
                                    let sublistLines = result_invoice2.length;

                                    if (type_transaction == 'customtransaction_lmry_payment_complemnt') {
                                        for (let i = 0; i < result_invoice2.length; i++) {
                                            transactionsId.push(result_invoice2[i].getValue('internalid'));
                                        }
                                        pymntCompFields = search.create({
                                            type: 'customrecord_lmry_complem_paymnt_fields',
                                            columns: [
                                                'custrecord_lmry_complm_document_type',
                                                'custrecord_lmry_related_complmnt_paym',
                                                'custrecord_lmry_complm_customer',
                                                'custrecord_lmry_complm_amt_dep_gross_lc',
                                                'custrecord_lmry_complm_totalcommis_lc'
                                            ],
                                            filters: [{
                                                name: 'custrecord_lmry_related_complmnt_paym',
                                                operator: 'anyof',
                                                values: transactionsId
                                            }]
                                        });
                                        pymntCompFields = pymntCompFields.run().getRange({
                                            start: 0,
                                            end: 1000
                                        });
                                        for (let i = 0; i < pymntCompFields.length; i++) {
                                            tranFields = getTranFieldPymtComp(pymntCompFields[i].getValue('custrecord_lmry_related_complmnt_paym'), result_invoice2);
                                            pymntCompDoc[pymntCompFields[i].getValue('custrecord_lmry_related_complmnt_paym')] = {
                                                tranid: tranFields.tranid,
                                                externalid: tranFields.externalid,
                                                memomain: tranFields.memomain,
                                                status: tranFields.status,
                                                type: tranFields.type,
                                                trandate: tranFields.trandate
                                            };
                                        }

                                        sublistLines = pymntCompFields.length;
                                    }
                                    for (let i = 0; i < sublistLines; i++) {
                                        let id_doc = '';
                                        let id_doc_value = '';
                                        let id_invoice = '';
                                        let id_entity = '';
                                        let id_entity_value = '';
                                        let id_tran = '';
                                        let id_amount = '';
                                        let id_date = '';
                                        let id_type = '';
                                        let id_amountpaid = '';
                                        let id_status = '';
                                        let id_memo = '';
                                        let id_total = '';
                                        if (type_transaction == 'customtransaction_lmry_payment_complemnt') {
                                            id_invoice = pymntCompFields[i].getValue('custrecord_lmry_related_complmnt_paym');
                                            if (pymntCompDoc[id_invoice]) {
                                                id_entity = pymntCompFields[i].getText('custrecord_lmry_complm_customer');
                                                id_entity_value = pymntCompFields[i].getValue('custrecord_lmry_complm_customer');
                                                id_tran = pymntCompDoc[id_invoice].tranid;
                                                id_amount = pymntCompFields[i].getValue('custrecord_lmry_complm_amt_dep_gross_lc');

                                                id_doc = pymntCompFields[i].getText('custrecord_lmry_complm_document_type');
                                                id_doc_value = pymntCompFields[i].getValue('custrecord_lmry_complm_document_type');
                                                id_date = pymntCompDoc[id_invoice].trandate;
                                                id_type = pymntCompDoc[id_invoice].type;
                                                id_type = id_type.toLowerCase();
                                                id_amountpaid = pymntCompFields[i].getValue('custrecord_lmry_complm_totalcommis_lc');
                                                id_status = pymntCompDoc[id_invoice].status;
                                                id_status = id_status.toLowerCase();
                                                id_memo = pymntCompDoc[id_invoice].memomain;
                                                id_total = pymntCompFields[i].getValue('custrecord_lmry_complm_totalcommis_lc');
                                            }
                                        } else {
                                            id_invoice = result_invoice2[i].getValue('internalid');
                                            id_entity = result_invoice2[i].getText('entity');
                                            id_entity_value = result_invoice2[i].getValue('entity');
                                            id_tran = result_invoice2[i].getValue('tranid');
                                            id_amount = result_invoice2[i].getValue('fxamount');

                                            id_doc = result_invoice2[i].getText('custbody_lmry_document_type');
                                            id_doc_value = result_invoice2[i].getValue('custbody_lmry_document_type');
                                            id_date = result_invoice2[i].getValue('trandate');
                                            id_type = result_invoice2[i].getValue('type');
                                            id_type = id_type.toLowerCase();
                                            id_amountpaid = result_invoice2[i].getValue('amountpaid');
                                            id_status = result_invoice2[i].getValue('status');
                                            id_status = id_status.toLowerCase();
                                            id_memo = result_invoice2[i].getValue('memo');
                                            id_total = result_invoice2[i].getValue('total');
                                            id_process_transact = result_invoice2[i].getValue('custbody_lmry_processed_transaction');
                                        }

                                        // ESTADOS DE FACTURACION
                                        if (status_countries.indexOf(json_response[id_invoice][0]) != -1) {
                                            continue;
                                        }

                                        // VALIDACIONES CUANDO ES INVOICE
                                        if (id_type == 'custinvc') {
                                            if (id_status != 'open' && id_status != 'paidinfull') {
                                                continue;
                                            }

                                            if (id_status == 'paidinfull' && Rd_CheckPaid == 'F') {
                                                continue;
                                            }

                                            if (Rd_Country == 'BRA') {
                                                // Si tiene pago parcial, sigue siendo open
                                                if (id_amountpaid > 0 && id_amountpaid < id_total && brRetenciones == false) {
                                                    continue;
                                                }
                                            } else if (Rd_Country == 'COL') {
                                                if (id_amountpaid > 0 && id_amountpaid < id_total && coRetenciones == false && coRetencionesLines == false) {
                                                    continue;
                                                }
                                            }
                                        }

                                        // VALIDACIONES CUANDO ES CASH SALE
                                        if (id_type == 'cashsale') {
                                            if (Rd_Country == 'PER') {
                                                if (id_process_transact != 2) {
                                                    continue;
                                                }
                                            }
                                        }
                                        // VIP
                                        if (featureAdvanced) {
                                            if (id_doc != null && id_doc != '') {
                                                // SI EL DOC NO ES DE FACTURACION
                                                if (json_document[id_doc_value] == undefined || json_document[id_doc_value] == null) {
                                                    continue;
                                                }

                                                // SI EL DOCUMENTO NO TIENE EI-PACKAGE, NO LO MUESTRA
                                                if (Rd_Country != 'BRA') {
                                                    if (jsonPackage[id_doc_value] == null || jsonPackage[id_doc_value] == undefined) {
                                                        continue;
                                                    }
                                                } else if (jsonPackage[id_doc_value + ';' + id_type] == null || jsonPackage[id_doc_value + ';' + id_type] == undefined) {
                                                    continue;
                                                }
                                            }
                                        }

                                        if (id_doc == null || id_doc == '') {
                                            id_doc = ' ';
                                        }

                                        f_sublist.setSublistValue({
                                            id: 'id_type',
                                            line: c,
                                            value: result_invoice2[i].getText('type')
                                        });
                                        f_sublist.setSublistValue({
                                            id: 'id_int',
                                            line: c,
                                            value: id_invoice
                                        });

                                        if (id_entity) {
                                            f_sublist.setSublistValue({
                                                id: 'id_ent',
                                                line: c,
                                                value: id_entity
                                            });
                                        } else {
                                            f_sublist.setSublistValue({
                                                id: 'id_ent',
                                                line: c,
                                                value: ' '
                                            });
                                        }

                                        if (id_tran == null || id_tran == '') {
                                            id_tran = ' ';
                                        }

                                        f_sublist.setSublistValue({
                                            id: 'id_tran',
                                            line: c,
                                            value: id_tran
                                        });

                                        if (id_type != 'itemship' && id_type != 'itemrcpt') {
                                            f_sublist.setSublistValue({
                                                id: 'id_amount',
                                                line: c,
                                                value: id_amount
                                            });
                                        } else {
                                            f_sublist.setSublistValue({
                                                id: 'id_amount',
                                                line: c,
                                                value: ' '
                                            });
                                        }

                                        f_sublist.setSublistValue({
                                            id: 'id_doc',
                                            line: c,
                                            value: id_doc
                                        });
                                        f_sublist.setSublistValue({
                                            id: 'id_date',
                                            line: c,
                                            value: id_date
                                        });

                                        if (id_memo == null || id_memo == '') {
                                            id_memo = ' ';
                                        } else {
                                            id_memo = id_memo.substring(0, 50) + '...';
                                        }

                                        f_sublist.setSublistValue({
                                            id: 'id_memo',
                                            line: c,
                                            value: id_memo
                                        });

                                        c++;
                                    } // FOR
                                } // LLENADO SUBLISTA IF

                                if (result_invoice2.length == 900) {
                                    contador += 900;
                                } else {
                                    bandera = false;
                                }
                            } // WHILE
                        }

                        f_sublist.addButton({
                            id: 'id_mark',
                            label: jsonLanguage.markall[Language],
                            functionName: 'markAll(' + c + ')'
                        });
                        f_sublist.addButton({
                            id: 'id_desmark',
                            label: jsonLanguage.desmarkall[Language],
                            functionName: 'desmarkAll'
                        });

                        fNumber.defaultValue = c;

                        if (subsiOW) {
                            f_subsi.defaultValue = Rd_Subsi;
                            f_subsi.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.DISABLED
                            });
                        }

                        f_date.defaultValue = Rd_Date;
                        f_date_2.defaultValue = Rd_Date_2;
                        p_checkpaid.defaultValue = Rd_CheckPaid;

                        if (Rd_Transaction != null && Rd_Transaction != '' && Rd_Transaction != '0') {
                            p_transaction.addSelectOption({
                                value: Rd_Transaction[0],
                                text: Rd_Transaction[1]
                            });
                        }

                        f_date.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                        f_date_2.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                        f_state.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                        p_transaction.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                        p_checkpaid.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });

                        form.addButton({
                            id: 'id_cancel',
                            label: jsonLanguage.back[Language],
                            functionName: 'funcionCancel'
                        });
                    }

                    form.clientScriptModulePath = './EI_Library/LMRY_Invoicing_Populate_CLNT.js';

                    if (Rd_Subsi != null && Rd_Subsi != '') {
                        form.addSubmitButton({
                            label: jsonLanguage.save[Language]
                        });
                    } else {
                        form.addSubmitButton({
                            label: jsonLanguage.filter[Language]
                        });
                        // form.addResetButton({label: jsonLanguage['reset'][Language]});
                    }

                    context.response.writePage(form);
                }else {
                    let p_state = context.request.parameters.custpage_state;

                    let auxSubsi = subsiOW ? context.request.parameters.custpage_subsi : 1;

                    if (p_state == null || p_state == '') {
                        redirect.toSuitelet({
                            scriptId: 'customscript_lmry_invoicing_populat_stlt',
                            deploymentId: 'customdeploy_lmry_invoicing_populat_stl',
                            parameters: {
                                custparam_subsi: auxSubsi,
                                custparam_doctype: context.request.parameters.custpage_doctype,
                                custparam_date: context.request.parameters.custpage_date,
                                custparam_date_2: context.request.parameters.custpage_date_2,
                                custparam_country: context.request.parameters.custpage_country,
                                custparam_transaction: context.request.parameters.custpage_transaction,
                                custparam_checkpaid: context.request.parameters.custpage_checkpaid
                            }
                        });
                    } else {
                        let usuario = runtime.getCurrentUser().id;
                        let transaction = context.request.parameters.custpage_transaction;
                        let subsidiary_id = auxSubsi;
                        let licenses = libraryFeature.getLicenses(subsidiary_id);
                        let params = {};
                        if (transaction == 'vendorbill' || transaction == 'vendorcredit') {
                            params.custscript_lmry_ip_params_state_purchase = context.request.parameters.custpage_state;
                            params.custscript_lmry_ip_params_user_purchase = usuario;
                        } else if (transaction == 'itemfulfillment' || transaccion == 'itemreceipt') {
                            params.custscript_lmry_ip_params_state_fillrcpt = context.request.parameters.custpage_state;
                            params.custscript_lmry_ip_params_user_fillrcpt = usuario;
                        } else {
                            params.custscript_lmry_ip_params_state = context.request.parameters.custpage_state;
                            params.custscript_lmry_ip_params_user = usuario;
                        }

                        let country = context.request.parameters.custpage_country;
                        let country2 = country.substring(0, 3).toUpperCase();
                        country2 = validarAcentos(country2);

                        let setting = [task.TaskType.MAP_REDUCE, 'customscript_lmry_invoicing_populate_mr', 'customscript_lmry_purchasing_populate_mr', 'customscript_lmry_fillrcpt_populate_mr'];

                        let redMPRD = '';

                        switch (country2) {

                            case 'ARG':
                                // Multisubsidiaria - Internal ID /
                                if (libraryFeature.getAuthorization(899, licenses)) {
                                    let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_ar_' + subsidiary_id;
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: deploySubsidiary,
                                        params: params
                                    });
                                }
                                // 1 Subsidiaria
                                else {
                                    // feature
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: 'customdeploy_lmry_invoicing_populate_mr',
                                        params: params
                                    });
                                }
                                break;
                            case 'BOL':
                                // Multisubsidiaria - Internal ID /
                                if (libraryFeature.getAuthorization(900, licenses)) {
                                    let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_bo_' + subsidiary_id;
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: deploySubsidiary,
                                        params: params
                                    });
                                }
                                // 1 Subsidiaria
                                else {
                                    // feature
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: 'customdeploy_lmry_invoicing_pop_bo_mr',
                                        params: params
                                    });
                                }
                                break;
                            case 'BRA':
                                // Compras
                                if (transaction == 'vendorbill' || transaction == 'vendorcredit') {
                                    if (libraryFeature.getAuthorization(878, licenses)) {
                                        let deploySubsidiary = 'customdeploy_lmry_purchasing_pop_br_' + subsidiary_id;
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[2],
                                            deploymentId: deploySubsidiary,
                                            params: params
                                        });
                                    }
                                    // 1 Subsidiaria
                                    else {
                                        // feature
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[2],
                                            deploymentId: 'customdeploy_lmry_purchasing_pop_br_mr',
                                            params: params
                                        });
                                    }
                                } else if (transaction == 'itemfulfillment' || transaccion == 'itemreceipt') {
                                    if (libraryFeature.getAuthorization(878, licenses)) {
                                        let deploySubsidiary = 'customdeploy_lmry_fillrcpt_pop_br_' + subsidiary_id;
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[3],
                                            deploymentId: deploySubsidiary,
                                            params: params
                                        });
                                    }
                                    // 1 Subsidiaria
                                    else {
                                        // feature
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[3],
                                            deploymentId: 'customdeploy_lmry_fillrcpt_pop_br_mr',
                                            params: params
                                        });
                                    }
                                }
                                // Ventas
                                else {
                                    // Multisubsidiaria - Internal ID /
                                    if (libraryFeature.getAuthorization(878, licenses)) {
                                        let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_br_' + subsidiary_id;
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[1],
                                            deploymentId: deploySubsidiary,
                                            params: params
                                        });
                                    }
                                    // 1 Subsidiaria
                                    else {
                                        // feature
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[1],
                                            deploymentId: 'customdeploy_lmry_invoicing_pop_br_mr',
                                            params: params
                                        });
                                    }
                                }
                                break;
                            case 'CHI':
                                if (transaction == 'itemfulfillment') {
                                    if (libraryFeature.getAuthorization(901, licenses)) {
                                        let deploySubsidiary = 'customdeploy_lmry_fillrcpt_pop_ch_' + subsidiary_id;
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[3],
                                            deploymentId: deploySubsidiary,
                                            params: params
                                        });
                                    }
                                    // 1 Subsidiaria
                                    else {
                                        // feature
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[3],
                                            deploymentId: 'customdeploy_lmry_fillrcpt_pop_ch_mr',
                                            params: params
                                        });
                                    }
                                }
                                // Ventas
                                else {
                                    // Multisubsidiaria - Internal ID /
                                    if (libraryFeature.getAuthorization(901, licenses)) {
                                        let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_ch_' + subsidiary_id;
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[1],
                                            deploymentId: deploySubsidiary,
                                            params: params
                                        });
                                    }
                                    // 1 Subsidiaria
                                    else {
                                        // feature
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[1],
                                            deploymentId: 'customdeploy_lmry_invoicing_pop_ch_mr',
                                            params: params
                                        });
                                    }
                                }
                                break;
                            case 'COL':
                                // Multisubsidiaria - Internal ID /
                                if (libraryFeature.getAuthorization(902, licenses)) {
                                    let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_co_' + subsidiary_id;
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: deploySubsidiary,
                                        params: params
                                    });
                                }
                                // 1 Subsidiaria
                                else {
                                    // feature
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: 'customdeploy_lmry_invoicing_pop_co_mr',
                                        params: params
                                    });
                                }
                                break;
                            case 'MEX':
                                if (transaction == 'itemfulfillment') {
                                    if (libraryFeature.getAuthorization(907, licenses)) {
                                        let deploySubsidiary = 'customdeploy_lmry_fillrcpt_pop_mx_' + subsidiary_id;
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[3],
                                            deploymentId: deploySubsidiary,
                                            params: params
                                        });
                                    }
                                    // 1 Subsidiaria
                                    else {
                                        // feature
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[3],
                                            deploymentId: 'customdeploy_lmry_fillrcpt_pop_mx_mr',
                                            params: params
                                        });
                                    }
                                }
                                // Ventas
                                else {
                                    // Multisubsidiaria - Internal ID /
                                    if (libraryFeature.getAuthorization(907, licenses)) {
                                        let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_mx_' + subsidiary_id;
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[1],
                                            deploymentId: deploySubsidiary,
                                            params: params
                                        });
                                    }
                                    // 1 Subsidiaria
                                    else {
                                        // feature
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[1],
                                            deploymentId: 'customdeploy_lmry_invoicing_pop_mx_mr',
                                            params: params
                                        });
                                    }
                                }
                                break;
                            case 'PER':
                                if (transaction == 'itemfulfillment') {
                                    // Multisubsidiaria - Internal ID /
                                    if (libraryFeature.getAuthorization(911, licenses)) {
                                        let deploySubsidiary = 'customdeploy_lmry_fillrcpt_pop_pe_' + subsidiary_id;
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[3],
                                            deploymentId: deploySubsidiary,
                                            params: params
                                        });
                                    }
                                    // 1 Subsidiaria
                                    else {
                                        // feature
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[3],
                                            deploymentId: 'customdeploy_lmry_fillrcpt_pop_pe_mr',
                                            params: params
                                        });
                                    }
                                }
                                // Ventas
                                else {
                                    // Multisubsidiaria - Internal ID /
                                    if (libraryFeature.getAuthorization(911, licenses)) {
                                        let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_pe_' + subsidiary_id;
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[1],
                                            deploymentId: deploySubsidiary,
                                            params: params
                                        });
                                    }
                                    // 1 Subsidiaria
                                    else {
                                        // feature
                                        redMPRD = task.create({
                                            taskType: setting[0],
                                            scriptId: setting[1],
                                            deploymentId: 'customdeploy_lmry_invoicing_pop_pe_mr',
                                            params: params
                                        });
                                    }
                                }
                                break;
                            case 'PAN':
                                // Multisubsidiaria - Internal ID /
                                if (libraryFeature.getAuthorization(909, licenses)) {
                                    let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_pa_' + subsidiary_id;
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: deploySubsidiary,
                                        params: params
                                    });
                                }
                                // 1 Subsidiaria
                                else {
                                    // feature
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: 'customdeploy_lmry_invoicing_pop_pa_mr',
                                        params: params
                                    });
                                }
                                break;
                            case 'COS':
                                // Multisubsidiaria - Internal ID /
                                if (libraryFeature.getAuthorization(903, licenses)) {
                                    let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_cr_' + subsidiary_id;
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: deploySubsidiary,
                                        params: params
                                    });
                                }
                                // 1 Subsidiaria
                                else {
                                    // feature
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: 'customdeploy_lmry_invoicing_pop_cr_mr',
                                        params: params
                                    });
                                }
                                break;
                            case 'ECU':
                                // Multisubsidiaria - Internal ID /
                                if (libraryFeature.getAuthorization(904, licenses)) {
                                    let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_ec_' + subsidiary_id;
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: deploySubsidiary,
                                        params: params
                                    });
                                }
                                // 1 Subsidiaria
                                else {
                                    // feature
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: 'customdeploy_lmry_invoicing_pop_ec_mr',
                                        params: params
                                    });
                                }
                                break;
                            case 'URU':
                                // Multisubsidiaria - Internal ID /
                                if (libraryFeature.getAuthorization(913, licenses)) {
                                    let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_uy_' + subsidiary_id;
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: deploySubsidiary,
                                        params: params
                                    });
                                }
                                // 1 Subsidiaria
                                else {
                                    // feature
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: 'customdeploy_lmry_invoicing_pop_uy_mr',
                                        params: params
                                    });
                                }
                                break;
                            case 'GUA':
                                // Multisubsidiaria - Internal ID /
                                if (libraryFeature.getAuthorization(906, licenses)) {
                                    let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_gt_' + subsidiary_id;
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: deploySubsidiary,
                                        params: params
                                    });
                                }
                                // 1 Subsidiaria
                                else {
                                    // feature
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: 'customdeploy_lmry_invoicing_pop_gt_mr',
                                        params: params
                                    });
                                }
                                break;
                            case 'DOM':
                                // Multisubsidiaria - Internal ID /
                                if (libraryFeature.getAuthorization(912, licenses)) {
                                    let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_do_' + subsidiary_id;
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: deploySubsidiary,
                                        params: params
                                    });
                                }
                                // 1 Subsidiaria
                                else {
                                    // feature
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: 'customdeploy_lmry_invoicing_pop_do_mr',
                                        params: params
                                    });
                                }
                                break;
                            case 'PAR':
                                // Multisubsidiaria - Internal ID /
                                if (libraryFeature.getAuthorization(910, licenses)) {
                                    let deploySubsidiary = 'customdeploy_lmry_invoicing_pop_py_' + subsidiary_id;
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: deploySubsidiary,
                                        params: params
                                    });
                                }
                                // 1 Subsidiaria
                                else {
                                    // feature
                                    redMPRD = task.create({
                                        taskType: setting[0],
                                        scriptId: setting[1],
                                        deploymentId: 'customdeploy_lmry_invoicing_pop_py_mr',
                                        params: params
                                    });
                                }
                                break;
                        }

                        redMPRD.submit();
                        redirect.toSuitelet({
                            scriptId: 'customscript_lmry_invoicing_log_stlt',
                            deploymentId: 'customdeploy_lmry_invoicing_log_stlt',
                            params: params
                        });
                    }
                }
            } catch (error) {
                
            }
        }


        const setLanguage = () => {
            if (Language != 'es' && Language != 'pt') {
                Language = 'en';
            }
        }

        const advanced = (licenses, country, idFeature) => {
            const IPS = {
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
                PER: 'PE',
                URU: 'UY',
                PAR: 'PY'
            }; // G.G

            return libraryFeature.getAuthorization(idFeature[IPS[country]], licenses);
        }

        const validarAcentos = (s) => {
            let AccChars = 'ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ&°–—ªº·';
            let RegChars = 'SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyyo--ao.';

            s = s.toString();
            for (let c = 0; c < s.length; c++) {
                for (let special = 0; special < AccChars.length; special++) {
                    if (s.charAt(c) == AccChars.charAt(special)) {
                        s = s.substring(0, c) + RegChars.charAt(special) + s.substring(c + 1, s.length);
                    }
                }
            }
            return s;
        }

        const status_invoice = (country, arrayInvoiceIds, subsidiary) => {
            // STATUS, STATUS-COUNTRY, HORA-COUNTRY, STATUS-GLOBAL, HORA-GLOBAL
            let json_full = {};

            arrayInvoiceIds.forEach(id => {
                if (json_full[id] == null || json_full[id] == undefined) {
                    json_full[id] = [];
                    json_full[id].push('No');
                    json_full[id].push('No');
                    json_full[id].push(0);
                    json_full[id].push('No');
                    json_full[id].push(0);
                }
            });

            let position = getPosition(country);

            // ARGENTINA,BRAZIL,CHILE Y COLOMBIA;
            
            // STATUS: OTROS-MEXICO-PERU
            let columnas = ['custrecord_lmry_ei_ds_doc_status', 'custbody_lmry_pe_estado_sf', 'custbody_lmry_pe_estado_comfiar'];                 

            if (country == 'MEX') {
                let mxTypes = ['CustInvc', 'CustCred', 'CustPymt', 'ItemShip'];

                let licenses = libraryFeature.getLicenses(subsidiary);
                if (libraryFeature.getAuthorization(703, licenses) == true) {
                    let mxRcd = recordApi.create({ type: 'customtransaction_lmry_payment_complemnt' });
                    mxTypes.push(mxRcd.getValue('type'));
                }

                let search_custbody = search.create({
                    type: search.Type.TRANSACTION,
                    columns: [columnas[position], 'internalid'],
                    filters: [{
                        name: 'internalid',
                        operator: 'anyof',
                        values: arrayInvoiceIds
                    },
                    {
                        name: 'mainline',
                        operator: 'is',
                        values: 'T'
                    },
                    {
                        name: 'type',
                        operator: 'anyof',
                        values: mxTypes
                    }]
                });
                let result_custbody = search_custbody.run().getRange({
                    start: 0,
                    end: 1000
                });

                if (result_custbody != null && result_custbody.length > 0) {
                    for (let i = 0; i < result_custbody.length; i++) {
                        json_full[result_custbody[i].getValue('internalid')][0] = result_custbody[i].getValue(columnas[position]);
                    }
                }
            } else if (country == 'PER') {
                let search_custbody = search.create({
                    type: search.Type.TRANSACTION,
                    columns: [columnas[position], 'internalid'],
                    filters: [{
                        name: 'internalid',
                        operator: 'anyof',
                        values: arrayInvoiceIds
                    },
                    {
                        name: 'mainline',
                        operator: 'is',
                        values: 'T'
                    },
                    {
                        name: 'type',
                        operator: 'anyof',
                        values: ['CustInvc', 'CustCred', 'CashSale', 'ItemShip']
                    }]
                });
                let result_custbody = search_custbody.run().getRange({
                    start: 0,
                    end: 1000
                });

                if (result_custbody != null && result_custbody.length > 0) {
                    for (let i = 0; i < result_custbody.length; i++) {
                        json_full[result_custbody[i].getValue('internalid')][0] = result_custbody[i].getValue(columnas[position]);
                    }
                }
            } else {
                // RECORD COUNTRY
                let search_r_status = search.create({
                    type: 'customrecord_lmry_ei_docs_status',
                    columns: [{
                        name: 'internalid',
                        sort: search.Sort.DESC
                    }, 'custrecord_lmry_ei_ds_doc_status', 'custrecord_lmry_ei_ds_doc', 'lastmodified'],
                    filters: [{
                        name: 'custrecord_lmry_ei_ds_doc',
                        operator: 'anyof',
                        values: arrayInvoiceIds
                    }]
                });

                let result_r_status = search_r_status.run().getRange({
                    start: 0,
                    end: 1000
                });

                if (result_r_status != null && result_r_status.length > 0) {
                    for (let i = 0; i < result_r_status.length; i++) {
                        json_full[result_r_status[i].getValue('custrecord_lmry_ei_ds_doc')][0] = result_r_status[i].getValue('custrecord_lmry_ei_ds_doc_status');
                    }
                }
            }

            return json_full;
        }

        const getPosition = (country) =>{
            switch (country) {
                case 'ARG':
                    return 0;
                case 'BOL':
                    return 0;
                case 'BRA':
                    return 0;
                case 'CHI':
                    return 0;
                case 'COL':
                    return 0;
                case 'MEX':
                    return 1;
                case 'PER':
                    return 2;
                case 'PAN':
                    return 0;
                case 'COS':
                    return 0;
                case 'ECU':
                    return 0;
                case 'URU':
                    return 0;
                case 'GUA':
                    return 0;
                case 'DOM':
                    return 0;
                case 'PAR':
                    return 0;
                default:
                    return -1;
            }
        }

        const getTranFieldPymtComp = (idPymtComp, transactions) => { 
            try {
                let result = {
                    tranid: '',
                    externalid: '',
                    memomain: '',
                    status: '',
                    type: '',
                    trandate: ''
                };
                if (idPymtComp && transactions.length > 0) {
                    for (let index = 0; index < transactions.length; index++) {
                        if (idPymtComp == transactions[index].getValue('internalid')) {
                            if (transactions[index].getValue('tranid')) {
                                result.tranid = transactions[index].getValue('tranid');
                            } else if (transactions[index].getValue('externalid')) {
                                result.externalid = transactions[index].getValue('externalid');
                            } else if (transactions[index].getValue('status')) {
                                result.status = transactions[index].getValue('status');
                            } else if (transactions[index].getValue('type')) {
                                result.type = transactions[index].getValue('type');
                            }
                            result.memomain = transactions[index].getValue('memomain');
                            result.trandate = transactions[index].getValue('trandate');

                            if (index + 1 == transactions.length ||
                                idPymtComp != transactions[index + 1].getValue('internalid')) {
                                break;
                            }
                        }
                    }
                }
                return result;
            } catch (error) {
                log.error('getTranFieldPymtComp', error);
                library.sendemail(' [ getTranFieldPymtComp ] ' + error, LMRY_script);
            }
        }

        return {onRequest}

    });
