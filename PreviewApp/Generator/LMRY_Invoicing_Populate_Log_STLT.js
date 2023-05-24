/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for EI Avance Flow & Universal Setting         ||
||                                                              ||
||  File Name: LMRY_Invoicing_Populate_Log_STLT.js              ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 01 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/runtime', 'N/log', 'N/search', 'N/record', 'N/ui/serverWidget', 'N/url', './EI_Library/LMRY_IP_libSendingEmailsLBRY_V2.0'],

    function (runtime, log, search, record, serverWidget, url, library) {
        var LMRY_script = 'Latamready - Invoicing Log STLT';

        var subsi_OW = runtime.isFeatureInEffect({
            feature: 'SUBSIDIARIES'
        });

        var Language = runtime.getCurrentScript().getParameter({
            name: 'LANGUAGE'
        });
        Language = Language.substring(0, 2);

        var jsonStatus = {
            2: 'nothing',
            1: 'processing',
            3: 'finished',
            4: 'error'
        };

        var jsonLanguage = {
            title: {
                en: 'LatamReady - Log Advanced Sales Flow',
                es: 'LatamReady - Registro del Flujo de Ventas Avanzado',
                pt: 'Registro de Fluxo de Vendas Avançado'
            },
            back: {
                en: 'Back',
                es: 'Atrás',
                pt: 'Trás'
            },
            important: {
                en: 'Important: The transactions are being processed. ',
                es: 'Nota: Las transacciones están siendo procesadas. ',
                pt: 'As transações estão sendo processadas. '
            },
            column: {
                en: 'The [STATE] column indicates the status of the process.',
                es: 'La columna [ESTADO] indica el estado del proceso.',
                pt: 'A coluna [ESTADO] indica o status do processo.'
            },
            push: {
                en: 'Press the Refresh button to see if the process finished.',
                es: 'Presionar el botón Actualizar para ver si el proceso terminó.',
                pt: 'Pressione o botão Atualizar para ver se o processo foi concluído.'
            },
            results: {
                en: 'Results',
                es: 'Resultados',
                pt: 'Resultados'
            },
            subsidiary: {
                en: 'Subsidiary',
                es: 'Subsidiaria',
                pt: 'Subsidiária'
            },
            internalid: {
                en: 'Internal ID',
                es: 'ID Interno',
                pt: 'ID Interno'
            },
            date: {
                en: 'Created Date',
                es: 'Fecha de creación',
                pt: 'Data de criação'
            },
            employee: {
                en: 'Employee',
                es: 'Empleado',
                pt: 'Empregado'
            },
            transactions: {
                en: 'Transactions',
                es: 'Transacciones',
                pt: 'Transações'
            },
            transactions2: {
                en: ' transaction(s)',
                es: ' transaccion(es)',
                pt: ' transações'
            },
            '#transactions': {
                en: '# Transactions',
                es: '# Transacciones',
                pt: '# Transações'
            },
            percentage: {
                en: 'Percentage',
                es: 'Porcentaje',
                pt: 'Percentagem'
            },
            state: {
                en: 'State',
                es: 'Estado',
                pt: 'Estado'
            },
            link: {
                en: 'Link',
                es: 'Enlace',
                pt: 'Link'
            },
            processing: {
                en: 'Processing',
                es: 'Procesando',
                pt: 'Em processamento'
            },
            finished: {
                en: 'Finished',
                es: 'Finalizado',
                pt: 'Finalizado'
            },
            nothing: {
                en: 'An error occurred. No transaction was processed',
                es: 'Ocurrió un error. No se proceso ninguna transacción',
                pt: 'Um erro ocorreu. Nenhuma transação foi processada'
            },
            error: {
                en: 'An error occurred. The following transactions failed: ',
                es: 'Ocurrió un error. Fallaron las siguientes transaccion(es): ',
                pt: 'Um erro ocorreu. As seguintes transações falharam: '
            },
            detail: {
                en: 'Detail',
                es: 'Detalle',
                pt: 'Detalhe'
            },
            '200en200': {
                en: 'GenerateAndSend',
                es: 'GeneraciónYEnvío',
                pt: 'GeraçãoEEnvio'
            },
            country: {
                en: 'Country',
                es: 'País',
                pt: 'País'
            }
        };

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            try {
                setLanguage();

                var form = serverWidget.createForm({
                    title: jsonLanguage.title[Language]
                });

                var p_hidden = form.addField({
                    id: 'custpage_hidden',
                    label: 'HIDDEN',
                    type: serverWidget.FieldType.TEXT
                });
                p_hidden.defaultValue = 'Hidden';
                p_hidden.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                form.addButton({
                    id: 'id_home',
                    label: jsonLanguage.back[Language],
                    functionName: 'funcionCancel'
                });

                var myInlineHtml = form.addField({
                    id: 'custpage_id_message',
                    label: 'MESSAGE',
                    type: serverWidget.FieldType.INLINEHTML
                });
                myInlineHtml.layoutType = serverWidget.FieldLayoutType.OUTSIDEBELOW;
                myInlineHtml.updateBreakType({
                    breakType: serverWidget.FieldBreakType.STARTCOL
                });

                var strhtml = '<html>';
                strhtml += '<table border="0" class="table_fields" cellspacing="0" cellpadding="0">';
                strhtml += '<tr>';
                strhtml += '</tr>';
                strhtml += '<tr>';
                strhtml += '<td class="text">';
                strhtml += '<div style="color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver">';
                strhtml += jsonLanguage.important[Language];
                strhtml += jsonLanguage.column[Language] + '<br><br>';
                strhtml += jsonLanguage.push[Language] + '</div>';
                strhtml += '</td>';
                strhtml += '</tr>';
                strhtml += '</table>';
                strhtml += '</html>';

                myInlineHtml.defaultValue = strhtml;

                var sublista = form.addSublist({
                    id: 'id_sublista',
                    label: jsonLanguage.results[Language],
                    type: serverWidget.SublistType.STATICLIST
                });

                sublista.addRefreshButton();

                sublista.addField({
                    id: 'id_internalid',
                    type: serverWidget.FieldType.TEXT,
                    label: jsonLanguage.internalid[Language]
                });

                if (subsi_OW) {
                    sublista.addField({
                        id: 'id_subsidiary',
                        type: serverWidget.FieldType.TEXT,
                        label: jsonLanguage.subsidiary[Language]
                    });
                }

                sublista.addField({
                    id: 'id_country',
                    type: serverWidget.FieldType.TEXT,
                    label: jsonLanguage.country[Language]
                });
                sublista.addField({
                    id: 'id_date',
                    type: serverWidget.FieldType.TEXT,
                    label: jsonLanguage.date[Language]
                });
                sublista.addField({
                    id: 'id_employee',
                    type: serverWidget.FieldType.TEXT,
                    label: jsonLanguage.employee[Language]
                });
                sublista.addField({
                    id: 'id_transactions',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: jsonLanguage.transactions[Language]
                });
                sublista.addField({
                    id: 'id_total',
                    type: serverWidget.FieldType.TEXT,
                    label: jsonLanguage['#transactions'][Language]
                });
                sublista.addField({
                    id: 'id_percentage',
                    type: serverWidget.FieldType.TEXT,
                    label: jsonLanguage.percentage[Language]
                });
                sublista.addField({
                    id: 'id_state',
                    type: 'textarea',
                    label: jsonLanguage.state[Language]
                });

                sublista.addField({
                    id: 'id_link',
                    type: serverWidget.FieldType.TEXT,
                    label: jsonLanguage.link[Language]
                });

                var searchLog = search.create({
                    type: 'customrecord_lmry_invoicing_populate',
                    columns: [search.createColumn({
                        name: 'internalid',
                        sort: search.Sort.DESC
                    }),
                        'custrecord_lmry_ip_user',
                        'custrecord_lmry_ip_subsidiary',
                        'custrecord_lmry_ip_transactions',
                        'custrecord_lmry_ip_state',
                        'created',
                        'custrecord_lmry_ip_url',
                        'custrecord_lmry_ip_error',
                        'custrecord_lmry_ip_count',
                        'custrecord_lmry_ip_country']
                });

                var resultLog = searchLog.run().getRange({
                    start: 0,
                    end: 1000
                });

                if (resultLog != null && resultLog.length > 0) {
                    var columnas = resultLog[0].columns;
                    for (var i = 0; i < resultLog.length; i++) {
                        var id = resultLog[i].getValue(columnas[0]);
                        if (id) {
                            sublista.setSublistValue({
                                id: 'id_internalid',
                                line: i,
                                value: id
                            });
                        }

                        var employee = resultLog[i].getText(columnas[1]);
                        if (employee) {
                            sublista.setSublistValue({
                                id: 'id_employee',
                                line: i,
                                value: employee
                            });
                        }

                        if (subsi_OW) {
                            var subsidiary = resultLog[i].getText(columnas[2]);
                            if (subsidiary) {
                                sublista.setSublistValue({
                                    id: 'id_subsidiary',
                                    line: i,
                                    value: subsidiary
                                });
                            }
                        }

                        var countries = resultLog[i].getText('custrecord_lmry_ip_country');
                        if (countries) {
                            sublista.setSublistValue({
                                id: 'id_country',
                                line: i,
                                value: countries
                            });
                        }

                        var transactions = resultLog[i].getValue(columnas[3]);
                        if (transactions) {
                            var urlDetalle = url.resolveScript({
                                scriptId: 'customscript_lmry_log_details_invo_stlt',
                                deploymentId: 'customdeploy_lmry_log_details_invo_stlt',
                                returnExternalUrl: false
                            });
                            urlDetalle += '&logid=' + id;
                            sublista.setSublistValue({
                                id: 'id_transactions',
                                line: i,
                                value: '<a href="' + urlDetalle + '" target="_blank">' + jsonLanguage.detail[Language] + '</a>'
                            });
                        }

                        var lastmodified = resultLog[i].getValue(columnas[5]);
                        if (lastmodified) {
                            sublista.setSublistValue({
                                id: 'id_date',
                                line: i,
                                value: lastmodified
                            });
                        }

                        var link = resultLog[i].getValue(columnas[6]);
                        if (link) {
                            sublista.setSublistValue({
                                id: 'id_link',
                                line: i,
                                value: '<a href="' + link + '" target="_blank">' + jsonLanguage['200en200'][Language] + '</a>'
                            });
                        }

                        var count = resultLog[i].getValue(columnas[8]);
                        if (count) {
                            count = count.split('|');
                            sublista.setSublistValue({
                                id: 'id_total',
                                line: i,
                                value: parseInt(count[0]) + jsonLanguage.transactions2[Language]
                            });
                            if (count[1]) {
                                var percentage = parseInt(parseFloat(count[1]) * 100 / parseFloat(count[0])) + '%';
                                sublista.setSublistValue({
                                    id: 'id_percentage',
                                    line: i,
                                    value: percentage
                                });
                            }
                        }

                        var status = resultLog[i].getValue('custrecord_lmry_ip_state');
                        status = status.substring(0, 3000);

                        if (status) {
                            status = status.split('-');
                            if (status.length == 1) {
                                if (parseInt(status[0]) > 0) {
                                    sublista.setSublistValue({
                                        id: 'id_state',
                                        line: i,
                                        value: jsonLanguage[jsonStatus[status[0]]][Language]
                                    });
                                } else {
                                    sublista.setSublistValue({
                                        id: 'id_state',
                                        line: i,
                                        value: status[0]
                                    });
                                }
                            } else {
                                var auxStatus = status[1];
                                auxStatus = auxStatus.split('|');

                                status = jsonLanguage[jsonStatus[status[0]]][Language] + '\n';

                                for (var j = 0; j < auxStatus.length; j++) {
                                    if (j != 0 && j % 6 == 0) {
                                        status += '\n';
                                    }

                                    if (j != auxStatus.length - 1) {
                                        status += auxStatus[j] + '|';
                                    }
                                }

                                sublista.setSublistValue({
                                    id: 'id_state',
                                    line: i,
                                    value: status
                                });
                            }
                        }

                        /* var posible_error = '' + resultLog[i].getValue(columnas[7]);
                        if(posible_error != ''){
                          posible_error = posible_error.substring(0,300);
                          sublista.setSublistValue({id:'id_error',line:i,value:posible_error});
                        } */
                    }
                }

                form.clientScriptModulePath = './EI_Library/LMRY_Invoicing_Populate_CLNT.js';

                context.response.writePage(form);
            } catch (error) {
                library.sendemail(' [ onRequest ] ' + error, LMRY_script);
            }
        }

        function setLanguage() {
            if (Language != 'es' && Language != 'pt') {
                Language = 'en';
            }
        }

        return {
            onRequest: onRequest
        };
    });