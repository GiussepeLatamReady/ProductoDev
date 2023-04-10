/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_PE_Bill_Payment_MPRD.js                     ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Set 22 2017  LatamReady    Use Script 2.0           ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
// @ts-check
define(['N/log', 'N/record', 'N/search', 'N/format', 'N/runtime', './Latam_Library/LMRY_PE_Massive_BillPayments_LBRY', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],

    function (log, record, search, format, runtime, libraryBill, libraryEmail) {

        var LMRY_script = 'LatamReady - PE Bill Massive Payments MPRD';
        var script = runtime.getCurrentScript();

        //Parámetro id usuario
        var USERID = script.getParameter({
            name: 'custscript_lmry_pe_userid'
        });

        //Parámetro id log (Record LatamReady - PE Payments Log)
        var LOGS = script.getParameter({
            name: 'custscript_lmry_pe_logid'
        });

        var EXCHANGE_ACTUAL = '';
        var EXCHANGE_ACTUAL_JOURNAL = '';
        var MULTIBOOKING = '';
        var SUBSIDIARY = '';
        var CURRENCY_ACTUAL_TEXT = '';
        var DOC_FISCALES = '';
        var DATE = '';
        var BILL = '';
        var BILL_ID = '';
        var JOURNAL_IDS;
        var DATE = '';
        var SETUP_TAX = '';
        var CURRENCIES = '';
        var ACCOUNTING_PERIOD = '';
        var VENDOR = '';
        var LOCATION = '';
        var DEPARTMENT = '';
        var CLASE = '';
        var PAYMENT_METHOD = '';
        var CURRENCY_ACTUAL_VALUE = '';
        var MEMO = '';
        var ACCOUNT_TRANS = '';
        var ACCOUNT_BANK = '';

        function getInputData() {
            try {
                log.error('USERID', USERID);
                log.error('LOGS', LOGS);
                LOGS = LOGS.split("|");
                var LOGID = '';
                var BILLID = '';
                var ArrayReturn = [];

                for (var i = 0; i < LOGS.length - 1; i++) {
                    LOGID = LOGS[i];

                    //Cambia estado "Procesando" en Record LatamReady - PE Payments Log
                    var id = record.submitFields({
                        type: 'customrecord_lmry_pe_payments_log',
                        id: LOGID,
                        values: {
                            custrecord_lmry_pe_status: 'Procesando',
                            custrecord_lmry_pe_employee: USERID
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true,
                            disableTriggers: true
                        }
                    });

                    //Retorna el id de la transaccion
                    var SearchLogBill = search.lookupFields({ type: 'customrecord_lmry_pe_payments_log', columns: ['custrecord_lmry_pe_billid'], id: LOGID });
                    BILLID = SearchLogBill.custrecord_lmry_pe_billid[0].value;

                    //Carga líneas de la Transacción que posean Impuesto a la Renta asignado
                    cargarLineasTransaccion(BILLID, LOGID, ArrayReturn);

                }

                return ArrayReturn;

            } catch (err) {
                libraryEmail.sendemail('[getInputData]' + err, LMRY_script);
                log.error('[getInputData]', err);
            }
        }

        /**
         * If this entry point is used, the map function is invoked one time for each key/value.
         *
         * @param {Object} context
         * @param {boolean} context.isRestarted - Indicates whether the current invocation represents a restart
         * @param {number} context.executionNo - Version of the bundle being installed
         * @param {Iterator} context.errors - This param contains a "iterator().each(parameters)" function
         * @param {string} context.key - The key to be processed during the current invocation
         * @param {string} context.value - The value to be processed during the current invocation
         * @param {function} context.write - This data is passed to the reduce stage
         *
         * @since 2016.1
         */

        function map(context) {
            try {
                var arrMap = JSON.parse(context.value);
                var strReturn = '';

                //Llave formada por ID log e ID Impuesto a la Renta
                const key = arrMap[0] + '|' + arrMap[4];

                for (var i = 0; i < arrMap.length; i++) {
                    strReturn += '' + arrMap[i];
                    if (i != arrMap.length - 1) {
                        strReturn += '|'
                    }
                }

                if (strReturn != '') {
                    context.write({
                        key: key,
                        value: {
                            journal: strReturn
                        }
                    });
                }

            } catch (err) {
                libraryEmail.sendemail('[map]' + err, LMRY_script);
                log.error('[map]', err);
            }

        }

        function reduce(context) {
            try {
                var DATOS_JOURNAL = [];
                var recordJournalid = '';

                for (var i = 0; i < context.values.length; i++) {
                    DATOS_JOURNAL.push(JSON.parse(context.values[i]));
                }

                var key = context.key;
                var arrTemp = key.split('|');
                //ID ESTADO LOG
                var estado = arrTemp[0];

                //Carga datos para generar Journal
                cargarDatosLog(estado);

                //Devuelve el ID del Journal Creado
                recordJournalid = libraryBill.aplicarJournal(VENDOR, SUBSIDIARY, ACCOUNT_TRANS, DATOS_JOURNAL, BILL_ID, CURRENCY_ACTUAL_VALUE, EXCHANGE_ACTUAL_JOURNAL, ACCOUNTING_PERIOD, DATE, DEPARTMENT, CLASE, LOCATION, MULTIBOOKING, CURRENCIES[3], SETUP_TAX[0], MEMO, PAYMENT_METHOD);

                if (recordJournalid != '') {
                    if (JOURNAL_IDS != '' || JOURNAL_IDS != null) {
                        JOURNAL_IDS = JOURNAL_IDS + recordJournalid + '|';
                    } else {
                        JOURNAL_IDS = recordJournalid + '|';
                    }

                    record.submitFields({
                        type: 'customrecord_lmry_pe_payments_log',
                        id: estado,
                        values: {
                            custrecord_lmry_pe_status: 'Procesando Journal',
                            custrecord_lmry_pe_journal: JOURNAL_IDS
                        },
                        option: {
                            disableTriggers: true
                        }
                    });
                }

                context.write({
                    key: BILL_ID,
                    value: {
                        estadolog: estado
                    }

                });

            } catch (err) {
                libraryEmail.sendemail('[reduce]' + err, LMRY_script);
                log.error('[reduce]', err);
            }
        }

        function summarize(context) {
            try {

                var CHECK = 1;
                var totalKeysSaved = 0;
                var ArrayLogs = [];
                context.output.iterator().each(function (key, value) {
                    var obj = JSON.parse(value);
                    ArrayLogs.push(obj.estadolog);
                    totalKeysSaved++;
                    return true;
                });

                ArrayLogs = eliminaDuplicados(ArrayLogs);
                for (var i = 0; i < ArrayLogs.length; i++) {
                    var estadoLog = ArrayLogs[i];
                    cargarDatosLog(estadoLog);
                    JOURNAL_IDS = JOURNAL_IDS.split("|");

                    if (libraryBill.creadoPayment(estadoLog, BILL, BILL_ID, JOURNAL_IDS, SETUP_TAX[0], SUBSIDIARY, DATE, ACCOUNTING_PERIOD, PAYMENT_METHOD, CURRENCY_ACTUAL_VALUE, MEMO, ACCOUNT_TRANS, ACCOUNT_BANK, DEPARTMENT, CLASE, LOCATION, EXCHANGE_ACTUAL, MULTIBOOKING, VENDOR, CURRENCIES[3], CHECK)) {

                        record.submitFields({
                            type: 'customrecord_lmry_pe_payments_log',
                            id: estadoLog,
                            values: {
                                custrecord_lmry_pe_status: 'Finalizado'
                            },
                            option: {
                                disableTriggers: true
                            }
                        });
                        CHECK++;
                    }
                }

                record.submitFields({
                    type: 'customrecord_lmry_setup_tax_subsidiary',
                    id: parseInt(SETUP_TAX[0][10]),
                    values: {
                        custrecord_lmry_setuptax_pe_correlative: parseInt(SETUP_TAX[0][9]) + CHECK - 1
                    },
                    option: {
                        disableTriggers: true
                    }
                });

            } catch (err) {
                libraryEmail.sendemail('[summarize]' + err, LMRY_script);
                log.error('[summarize]', err);
            }

        }

        function eliminaDuplicados(arr) {
            var i,
                len = arr.length,
                out = [],
                obj = {};

            for (i = 0; i < len; i++) {
                obj[arr[i]] = 0;
            }
            for (i in obj) {
                out.push(i);
            }
            return out;
        }

        function cargarLineasTransaccion(idbill, estado, ArrayReturn) {

            //Busqueda LatamReady - PE Vendor IDBILL Lines
            var searchTransaction = search.load({ id: 'customsearch_lmry_pe_bill_lines' });

            var Filter_Trans = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: idbill });

            searchTransaction.filters.push(Filter_Trans);
            searchTransaction.columns.push(search.createColumn({
                name: "formulacurrency",
                formula: "{fxamount}",
                label: "Foreign Amount Currency"
            }));


            var resultTransaction = searchTransaction.run();
            var Transactions = resultTransaction.getRange(0, 1000);

            if (Transactions != null && Transactions.length > 0) {
                for (var k = 0; k < Transactions.length; k++) {
                    var columns = Transactions[k].columns;

                    var arr = new Array();
                    //Log id del record LatamReady - PE Payments Log
                    arr[0] = estado;

                    //ID de la transaccion
                    arr[1] = idbill;

                    //Line id
                    arr[2] = Transactions[k].getValue(columns[14]);

                    //Gross amount de línea
                    //arr[3] = objResult[k].getValue(columns[8]);
                    arr[3] = Transactions[k].getValue(columns[columns.length - 1]);

                    //Impuesto a la renta (LATAM COL - PE IMP. RENTA)
                    arr[4] = Transactions[k].getValue(columns[15]);

                    //Department
                    //arr[5]= objResult[k].getValue(columns[16]);

                    //Class
                    //arr[6]= objResult[k].getValue(columns[17]);

                    //Location
                    //arr[7]= objResult[k].getValue(columns[18]);

                    ArrayReturn.push(arr);
                }
            }

        }

        function cargarDatosLog(estado) {

            //Busqueda Record LatamReady - PE Payments Log
            var estado_log = search.lookupFields({
                type: 'customrecord_lmry_pe_payments_log',
                id: estado,
                columns: [
                    'custrecord_lmry_pe_subsidiary',
                    'custrecord_lmry_pe_vendor',
                    'custrecord_lmry_pe_bill',
                    'custrecord_lmry_pe_billid',
                    'custrecord_lmry_pe_account',
                    'custrecord_lmry_pe_currency',
                    'custrecord_lmry_pe_bank',
                    'custrecord_lmry_pe_period',
                    'custrecord_lmry_pe_exchangerate',
                    'custrecord_lmry_pe_check',
                    'custrecord_lmry_pe_memo',
                    'custrecord_lmry_pe_department',
                    'custrecord_lmry_pe_doc',
                    'custrecord_lmry_pe_location',
                    'custrecord_lmry_pe_class',
                    'custrecord_lmry_pe_paymethod',
                    'custrecord_lmry_pe_date',
                    'custrecord_lmry_pe_multibook',
                    'custrecord_lmry_pe_journal',
                    'custrecord_lmry_pe_exchangerate_j'
                ]
            });

            EXCHANGE_ACTUAL = estado_log.custrecord_lmry_pe_exchangerate;
            EXCHANGE_ACTUAL_JOURNAL = estado_log.custrecord_lmry_pe_exchangerate_j;
            MULTIBOOKING = estado_log.custrecord_lmry_pe_multibook;
            SUBSIDIARY = estado_log.custrecord_lmry_pe_subsidiary[0].value;
            CURRENCY_ACTUAL_TEXT = estado_log.custrecord_lmry_pe_currency[0].text;
            DOC_FISCALES = estado_log.custrecord_lmry_pe_doc;
            DATE = estado_log.custrecord_lmry_pe_date;
            BILL = estado_log.custrecord_lmry_pe_bill;
            BILL_ID = estado_log.custrecord_lmry_pe_billid[0].value;
            JOURNAL_IDS = estado_log.custrecord_lmry_pe_journal;

            DATE = format.format({ value: DATE, type: format.Type.DATE });

            //CONFIGURACION SETUPTAX, ARREGLO DOCFISCAL, ARREGLOBILL
            SETUP_TAX = libraryBill.llenado_setuptax(SUBSIDIARY, DOC_FISCALES);
            CURRENCIES = libraryBill.multibooking(CURRENCY_ACTUAL_TEXT, EXCHANGE_ACTUAL, MULTIBOOKING);

            ACCOUNTING_PERIOD = estado_log.custrecord_lmry_pe_period[0].value;
            VENDOR = estado_log.custrecord_lmry_pe_vendor[0].value;

            if (estado_log.custrecord_lmry_pe_location.length != 0) {
                LOCATION = estado_log.custrecord_lmry_pe_location[0].value;
            }
            if (estado_log.custrecord_lmry_pe_department.length != 0) {
                DEPARTMENT = estado_log.custrecord_lmry_pe_department[0].value;
            }
            if (estado_log.custrecord_lmry_pe_class.length != 0) {
                CLASE = estado_log.custrecord_lmry_pe_class[0].value;
            }

            PAYMENT_METHOD = estado_log.custrecord_lmry_pe_paymethod[0].value;
            CURRENCY_ACTUAL_VALUE = estado_log.custrecord_lmry_pe_currency[0].value;
            MEMO = estado_log.custrecord_lmry_pe_memo;
            ACCOUNT_TRANS = estado_log.custrecord_lmry_pe_account[0].value;
            ACCOUNT_BANK = estado_log.custrecord_lmry_pe_bank[0].value;
            var CHECK = estado_log.custrecord_lmry_pe_check;
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };


    });