/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                    ||
||                                                             ||
||  File Name: LMRY_ArchivoEnvioSantander_MPRD_V2.1            ||
||                                                             ||
||  Version Date         Author        Remarks                 ||
||  2.1     Set 25 2023  LatamReady    Use Script 2.1          ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

define([
    'N/log',
    'N/record',
    'N/search',
    'N/format',
    'N/runtime',
    'N/email',
    'N/config',
    'N/file',
    './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0',
    './Latam_Library/LMRY_ArchivoEnvio_LBRY_V2.1'
], (
    log,
    record,
    search,
    format,
    runtime,
    email,
    config,
    file,
    libraryMail,
    { ValidarCaracteres, formatoFecha, formatoMonto, searchFolder }
) => {
    // Datos de la Configuracion (Subsidiaria - Banco Santander)
    let codigoBeneficiario = '';
    let codigoCartera = '';
    let aceptacion = '';
    const cuentaCobro = '';
    let agencia = '';
    let numConvenioCobranza = '';
    const numConvenioLider = '';
    const variacionCartera = ''; // Configurar en Config Bank Ticket

    // Datos del banco
    let ID_BANK = '';
    const nombreBanco = 'SANTANDER';
    let codigoBanco = '';

    // Datos de Archivo
    const file_name = '';
    let COD_EMPRESA = '';

    // Datos de la Subsidiaria/Beneficiario
    let nombreSubsidiaria = '';
    let cnpjSubsidiaria = '';
    let ID_SUB = '';

    // Datos del Customer/Pagador
    let ID_CUSTOMER = '';
    let nomCustomer = '';
    let cnpjCustomer = '';
    let addressCustomer = '';
    let tipoCustomer = '';
    let bairroCustomer = '';
    let cepCustomer = '';
    let ciudadCustomer = '';
    let ufCustomer = '';

    // Datos del Sacador/ Avalista
    let nomSacador = '';
    let ID_SACADOR = '';

    // Datos del Invoice
    let dateInvoice = '';
    let dueDateInvoice = '';
    let montoTotalInvoice = '';
    const numPreImpreso = '';
    let ID_INV = '';

    // Datos Installments
    let ID_INST = '';
    let AMOUNT_INST = '';
    let DUEDATE_INST = '';
    let RETENCION_INST = '';

    // Datos de Transaction Fields
    let NOSSO_NUMBER = '';
    let COD_OCURRENCIA = '01';
    let PROCESSING_DATE = '';
    let COD_DOCUMENT_SPECIE = '';
    let MORA_DIA = '';
    let MULTA = '';

    const complementoRegistro = '';
    let FLAG = false;

    // FEATURE SUITETAX
    let ST_FEATURE = false;

    const LMRY_script = 'LatamReady - Archivo de Envio Santander MPRD';

    function getInputData() {
        try {
            // ID record LatamReady - BR Shipping File
            const id_record_log = runtime
                .getCurrentScript()
                .getParameter({ name: 'custscript_lmry_br_recordlogid_std_mprd' });

            const record_br_log_shipping_file = search.lookupFields({
                type: 'customrecord_lmry_br_log_shipping_file',
                id: id_record_log,
                columns: [
                    'custrecord_lmry_br_log_subsidiary',
                    'custrecord_lmry_br_log_bank',
                    'custrecord_lmry_br_log_date_from',
                    'custrecord_lmry_br_log_date_to'
                ]
            });

            const subsidiaria = record_br_log_shipping_file.custrecord_lmry_br_log_subsidiary[0].value;
            const bank = record_br_log_shipping_file.custrecord_lmry_br_log_bank[0].value;
            const fecha_desde = record_br_log_shipping_file.custrecord_lmry_br_log_date_from;
            const fecha_hasta = record_br_log_shipping_file.custrecord_lmry_br_log_date_to;

            // Búsqueda de invoices
            const columns = [
                'trandate',
                'subsidiary',
                'custrecord_lmry_br_related_transaction.custrecord_lmry_br_pdf_bank',
                'custrecord_lmry_br_related_transaction.custrecord_lmry_br_document_specie',
                'custrecord_lmry_br_related_transaction.custrecord_lmry_br_nosso_numero',
                'custrecord_lmry_br_related_transaction.custrecord_lmry_br_bb_status',
                'custrecord_lmry_br_related_transaction.custrecord_lmry_br_processing_date',
                'custrecord_lmry_br_related_transaction.custrecord_lmry_br_sacador_avalista',
                'custrecord_lmry_br_related_transaction.custrecord_lmry_br_send_multa',
                'custrecord_lmry_br_related_transaction.custrecord_lmry_br_send_interes'
            ];

            // Features
            const licenses = libraryMail.getLicenses(subsidiaria);
            const FEATURE_INST = runtime.isFeatureInEffect({ feature: 'installments' });

            if ((FEATURE_INST == 'T' || FEATURE_INST == true) && libraryMail.getAuthorization(536, licenses)) {
                columns.push(search.createColumn({ name: 'internalid', sort: search.Sort.DESC }));
                columns.push(
                    search.createColumn({ name: 'installmentnumber', join: 'installment', sort: search.Sort.ASC })
                );
                columns.push('custrecord_lmry_br_related_transaction.custrecord_lmry_br_installments');
                columns.push('installment.amount');
                columns.push('installment.duedate');
            }

            return search.create({
                type: 'invoice',
                columns,
                filters: [
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['subsidiary', 'is', subsidiaria],
                    'AND',
                    ['trandate', 'within', fecha_desde, fecha_hasta],
                    'AND',
                    ['custrecord_lmry_br_related_transaction.custrecord_lmry_br_pdf_bank', 'anyof', bank],
                    'AND',
                    ['status', 'anyof', 'CustInvc:A']
                ],
                settings: [search.createSetting({ name: 'consolidationtype', value: 'NONE' })]
            });
        } catch (error) {
            log.error('ERROR', '[ getInputData ]');
            libraryMail.sendemail(` [ getInputData ] ${error}`, LMRY_script);
            return [];
        }
    }

    function map(context) {
        try {
            const searchResult = JSON.parse(context.value);
            // Key
            var trandate = searchResult.values.trandate;

            // Datos Invoice
            ID_INV = searchResult.id;
            ID_SUB = searchResult.values.subsidiary.value;
            ID_BANK = searchResult.values['custrecord_lmry_br_pdf_bank.custrecord_lmry_br_related_transaction'].value;
            NOSSO_NUMBER =
                searchResult.values['custrecord_lmry_br_nosso_numero.custrecord_lmry_br_related_transaction'];
            ID_SACADOR =
                searchResult.values['custrecord_lmry_br_sacador_avalista.custrecord_lmry_br_related_transaction'].value;
            MORA_DIA = searchResult.values['custrecord_lmry_br_send_interes.custrecord_lmry_br_related_transaction'];
            MULTA = searchResult.values['custrecord_lmry_br_send_multa.custrecord_lmry_br_related_transaction'];
            RETENCION_INST =
                searchResult.values['custrecord_lmry_br_installments.custrecord_lmry_br_related_transaction'];
            ID_INST = searchResult.values['installmentnumber.installment'];
            AMOUNT_INST = searchResult.values['amount.installment'];
            DUEDATE_INST = searchResult.values['duedate.installment'];

            // Datos Transaccion Fields
            const documentEspecie =
                searchResult.values['custrecord_lmry_br_document_specie.custrecord_lmry_br_related_transaction'].value;
            const status =
                searchResult.values['custrecord_lmry_br_bb_status.custrecord_lmry_br_related_transaction'].value;
            const processingDate =
                searchResult.values['custrecord_lmry_br_processing_date.custrecord_lmry_br_related_transaction'];

            obtenerDatosSubsidiaria();
            obtenerDatosConfigSubsidiariaBancoSantander();

            context.write({
                key: trandate,
                value: obtenerDetalleRegistroObli(documentEspecie, status, processingDate)
            });
        } catch (error) {
            log.error('invoiceID - Trandate', `${ID_INV} - ${trandate}`);

            context.write({
                key: 0,
                value: ID_INV
            });
        }
    }

    function summarize({ output }) {
        try {
            const array_file = {};
            const id_file_array = [];
            output.iterator().each((key, value) => {
                if (array_file[key]) {
                    array_file[key].push(value);
                } else {
                    array_file[key] = [value];
                }

                return true;
            });

            if (array_file.length == 0) {
                throw Error('There is not content.');
            }

            // Ruta de la carpeta contenedora
            const id_folder = searchFolder();

            let id_record_log = runtime.getCurrentScript().getParameter({
                name: 'custscript_lmry_br_recordlogid_std_mprd'
            });

            //* ****** Fecha creacion del Archivo de Envío *******
            const fechaDeCreacionArchivo = new Date();
            let horas = fechaDeCreacionArchivo.getHours();
            horas = completarInicio(horas, 2, '0');
            let minutos = fechaDeCreacionArchivo.getMinutes();
            minutos = completarInicio(minutos, 2, '0');
            let segundos = fechaDeCreacionArchivo.getSeconds();
            segundos = completarInicio(segundos, 2, '0');
            //* **************************************************

            // Se obtienen los campos necesarios para generar Cabecera de Archivo
            const record_br_log_shipping_file = search.lookupFields({
                type: 'customrecord_lmry_br_log_shipping_file',
                id: id_record_log,
                columns: ['custrecord_lmry_br_log_subsidiary', 'custrecord_lmry_br_log_bank']
            });
            ID_SUB = record_br_log_shipping_file.custrecord_lmry_br_log_subsidiary[0].value;

            ID_BANK = record_br_log_shipping_file.custrecord_lmry_br_log_bank[0].value;

            const cabecera = obtenerCabeceraArchivo();

            for (const fecha in array_file) {
                if (array_file.hasOwnProperty(fecha)) {
                    formatoFecha(fecha);
                    let cadena = cabecera;
                    let suma = 0;
                    let i;
                    for (i = 0; i < array_file[fecha].length; i++) {
                        // Se extraen los montos por línea para ser sumados
                        const linea = array_file[fecha][i];
                        let monto = linea.substring(128, 140);
                        monto = Number(monto).toFixed(2);
                        suma = parseFloat(suma) + parseFloat(monto);
                        cadena += concatenarSecuencia(array_file[fecha][i], i + 2);
                    }
                    cadena += '\n';

                    cadena += obtenerTrailerArchivo(i + 2, suma);

                    cadena = ValidarCaracteres_Especiales(cadena);

                    const fileRemesa = file.create({
                        name: `STDCollection-${file_name}-${formatoFecha(fecha, 2)}-${horas}${minutos}${segundos}.rem`,
                        fileType: file.Type.PLAINTEXT,
                        contents: cadena,
                        folder: id_folder
                    });
                    const id_file = fileRemesa.save();
                    id_file_array.push(id_file);
                }
            }

            record.submitFields({
                type: 'customrecord_lmry_br_log_shipping_file',
                id: id_record_log,
                values: {
                    custrecord_lmry_br_log_idfile: id_file_array.join('|'),
                    custrecord_lmry_br_log_status_process: 2
                },
                options: {
                    disableTriggers: true // con esto se evita que se bloquee el record, osea que no funciones los userevent
                }
            });
        } catch (error) {
            let id_record_log = runtime.getCurrentScript().getParameter({
                name: 'custscript_lmry_br_recordlogid_std_mprd'
            });
            // Cambiando el estado al registro  "LatamReady - BR Shipping File" - ERROR

            record.submitFields({
                type: 'customrecord_lmry_br_log_shipping_file',
                id: id_record_log,
                values: {
                    custrecord_lmry_br_log_status_process: 3
                },
                options: {
                    disableTriggers: true // con esto se evita que se bloquee el record, osea que no funciones los userevent
                }
            });
            libraryMail.sendemail(` [ summarize ] ${error}`, LMRY_script);
        }
    }

    // Datos de la relación Banco - Transacción
    function obtenerDetalleRegistroObli(documentEspecie, status, processingDate) {
        obtenerDatosInvoice();
        obtenerDatosCustomer();
        obtenerDatosTransactionFields(status, documentEspecie, processingDate);
        obtenerDatosSacadorAvalista();
        calcularInstallments();
        const registroObligatorio = `\n${obtenerDetalleRegistroObligatorio()}`;
        return registroObligatorio;
    }

    // Datos de la transacción
    function obtenerDatosInvoice() {
        try {
            const recordInvoice = search.lookupFields({
                type: search.Type.INVOICE,
                id: ID_INV,
                columns: [
                    'entity',
                    'trandate',
                    'duedate',
                    'total',
                    'fxamount',
                    'custbody_lmry_wtax_code_des',
                    'custbody_lmry_wtax_amount'
                ]
            });

            ID_CUSTOMER = recordInvoice.entity[0].value;

            dateInvoice = recordInvoice.trandate;
            if (dateInvoice) {
                dateInvoice = formatoFecha(dateInvoice);
            }

            dueDateInvoice = recordInvoice.duedate;
            if (dueDateInvoice) {
                dueDateInvoice = formatoFecha(dueDateInvoice);
            }

            montoTotalInvoice = recordInvoice.fxamount;

            const licenses = libraryMail.getLicenses(ID_SUB);

            /** ****************************************************************+******************************************
                  - Descripción: Si esta activo el Feature  BR - LATAM WHT TAX y el campo tax_code_des tiene la descripción
                    Latam - WHT Tax , Se resta el monto del invoice con el monto de la retencion (ID:custbody_lmry_wtax_amount)
                 *************************************************************************************************************/

            const tax_code_des = recordInvoice.custbody_lmry_wtax_code_des;

            if (libraryMail.getAuthorization(416, licenses) == true && tax_code_des == 'Latam - WHT Tax') {
                FLAG = true;
                const retencion = recordInvoice.custbody_lmry_wtax_amount;
                montoTotalInvoice -= retencion;
                montoTotalInvoice = montoTotalInvoice.toFixed(2);
            }

            // Monto concatenado
            if (montoTotalInvoice) {
                montoTotalInvoice = formatoMonto(montoTotalInvoice);
            }
        } catch (error) {
            log.error('ERROR', '[ obtenerDatosInvoice ]');
            libraryMail.sendemail(` [ obtenerDatosInvoice ] ${error}`, LMRY_script);
        }
    }

    // Datos del Customer
    function obtenerDatosCustomer() {
        try {
            if (ID_CUSTOMER != null && ID_CUSTOMER != '') {
                var firtsName = '';
                var lastName = '';

                ST_FEATURE = runtime.isFeatureInEffect({ feature: 'tax_overhauling' });

                const customer_columns = ['isperson', 'firstname', 'lastname', 'companyname'];

                /**
                 * Para SuiteTax
                 */
                if (ST_FEATURE || ST_FEATURE === 'T') {
                    const transObj = record.load({
                        type: 'invoice',
                        id: ID_INV,
                        isDynamic: true
                    });
                    var customer_cnpj = transObj.getText({ fieldId: 'entitytaxregnum' });
                } else {
                    customer_columns.push('vatregnumber');
                }

                const recordCustomer = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: ID_CUSTOMER,
                    columns: customer_columns
                });

                let nom_customer = '';
                const typeCustomer = recordCustomer.isperson;

                // Si el Customer es persona natural typeCustomer es true
                if (typeCustomer == 'T' || typeCustomer == true) {
                    firtsName = recordCustomer.firstname;
                    lastName = recordCustomer.lastname;

                    nom_customer = `${firtsName} ${lastName}`;
                    tipoCustomer = '01';
                } else {
                    nom_customer = recordCustomer.companyname;
                    tipoCustomer = '02';
                }

                // NOMBRE DEL CLIENTE
                if (nom_customer) {
                    nomCustomer = ValidarCaracteres(nom_customer);
                }

                // CNPJ DEL CLIENTE
                let cnpj_customer = '';
                if (!ST_FEATURE || ST_FEATURE === 'F') {
                    cnpj_customer = recordCustomer.vatregnumber;
                } else {
                    cnpj_customer = customer_cnpj;
                }

                if (cnpj_customer) {
                    cnpjCustomer = cnpj_customer.replace(/\.|\-|\//g, '');
                }

                // DIRECCIÓN DEL CLIENTE
                let billAdress1 = '';
                let billAdress2 = '';
                let billAdress3 = '';
                let billAdress4 = '';
                let billAdress5 = '';
                let billAdress6 = '';
                let billAdress7 = '';
                let billAdress8 = '';

                // Campos de la direccion
                const col_billadd = [
                    'billingAddress.address1',
                    'billingAddress.custrecord_lmry_address_number',
                    'billingAddress.custrecord_lmry_addr_reference',
                    'billingAddress.address2',
                    'billingAddress.custrecord_lmry_addr_city',
                    'billingAddress.custrecord_lmry_addr_prov_acronym',
                    'billingAddress.zip',
                    'billingAddress.country'
                ];

                // Busqueda en el record de direcciones
                const busqAddressRece = search.create({
                    type: 'transaction',
                    columns: col_billadd,
                    filters: [['internalid', 'anyof', ID_INV], 'AND', ['mainline', 'is', 'T']]
                });

                const resultAddress = busqAddressRece.run().getRange(0, 10);

                if (resultAddress != null && resultAddress.length != 0) {
                    const row = resultAddress[0].columns;

                    // ADDRESS 1
                    billAdress1 = resultAddress[0].getValue(row[0]);
                    if (billAdress1 == '' || billAdress1 == null) {
                        billAdress1 = '';
                    }
                    billAdress1 = ValidarCaracteres(billAdress1);

                    // LATAM - ADDRESS NUMBER
                    billAdress2 = resultAddress[0].getValue(row[1]);
                    if (billAdress2 == '' || billAdress2 == null) {
                        billAdress2 = '';
                    }

                    // LATAM - ADDRESS REFERENCE
                    billAdress3 = resultAddress[0].getValue(row[2]);
                    if (billAdress3 == '' || billAdress3 == null) {
                        billAdress3 = '';
                    }
                    billAdress3 = ValidarCaracteres(billAdress3);

                    // ADDRESS 2 (Barrio)
                    billAdress4 = resultAddress[0].getValue(row[3]);
                    if (billAdress4 == '' || billAdress4 == null) {
                        billAdress4 = '';
                    }
                    billAdress4 = ValidarCaracteres(billAdress4);
                    bairroCustomer = billAdress4;

                    // LATAM - CITY (Ciudad)
                    billAdress5 = resultAddress[0].getText(row[4]);
                    if (billAdress5 == '' || billAdress5 == null) {
                        billAdress5 = '';
                    }
                    billAdress5 = ValidarCaracteres(billAdress5);
                    ciudadCustomer = billAdress5;

                    // LATAM - PROVINCE ACRONYM
                    billAdress6 = resultAddress[0].getValue(row[5]);
                    if (billAdress6 == '' || billAdress6 == null) {
                        billAdress6 = '';
                    }
                    billAdress6 = ValidarCaracteres(billAdress6);
                    ufCustomer = billAdress6;

                    // ZIP - es el CEP del customer
                    billAdress7 = resultAddress[0].getValue(row[6]);
                    if (billAdress7 == '' || billAdress7 == null) {
                        billAdress7 = '';
                    }

                    billAdress7 = billAdress7.replace(/[^0-9]/g, '');
                    cepCustomer = billAdress7;

                    // Country
                    billAdress8 = resultAddress[0].getValue(row[7]);
                    if (billAdress8 == '' || billAdress8 == null) {
                        billAdress8 = '';
                    }
                }

                // Arma la direccion: ADDRESS 1    LATAM - ADDRESS NUMBER   LATAM - ADDRESS REFERENCE
                /* addressCustomer = billAdress1 + ' ' + billAdress2 + ' ' + billAdress3; */

                // Arma la direccion: ADDRESS 1  +  ADDRESS 2 (Barrio)  +  LATAM - ADDRESS REFERENCE  +  LATAM - CITY (Ciudad)  +  LATAM - PROVINCE ACRONYM
                const auxtemp = `${billAdress1} ${billAdress4} ${billAdress3} ${billAdress5} ${billAdress6}`;
                if (auxtemp.length > 40) {
                    addressCustomer = `${billAdress1.substring(0, 15)} ${billAdress4.substring(
                        0,
                        9
                    )} ${billAdress3.substring(0, 4)} ${billAdress5.substring(0, 6)} ${billAdress6.substring(0, 2)}`;
                } else {
                    addressCustomer = auxtemp;
                }
            }
        } catch (error) {
            log.error('ERROR', '[ obtenerDatosCustomer ]');
            libraryMail.sendemail(` [ obtenerDatosCustomer ] ${error}`, LMRY_script);
        }
    }

    function obtenerDatosTransactionFields(status, documentEspecie, processingDate) {
        try {
            let documentoEspecie = '';
            let codigo_estado_boletoBancario = '';

            // Busqueda Comando (Código de Ocurrencia)
            if (status && status != '') {
                let searchBR_BB_status = search.create({
                    type: 'customrecord_lmry_br_bb_status',
                    columns: ['custrecord_lmry_br_bb_code'],
                    filters: ['internalid', 'is', status]
                });
                const searchResult = searchBR_BB_status.run().getRange(0, 1);
                if (searchResult != '' && searchResult != null) {
                    codigo_estado_boletoBancario = searchResult[0].getValue({
                        name: 'custrecord_lmry_br_bb_code'
                    });
                }
            }

            if (codigo_estado_boletoBancario != '' && codigo_estado_boletoBancario != null) {
                COD_OCURRENCIA = codigo_estado_boletoBancario;
            }

            if (processingDate) {
                PROCESSING_DATE = formatoFecha(processingDate);
            } else {
                PROCESSING_DATE = formatoFecha(new Date());
            }
            // //////// Fin de la busqueda

            // Busqueda codigo Documento Especie
            if (documentEspecie && documentEspecie != '') {
                let searchBR_BB_status = search.create({
                    type: 'customrecord_lmry_br_document_specie',
                    columns: ['custrecord_lmry_br_docu_specie_code'],
                    filters: ['internalid', 'is', documentEspecie]
                });
                const searchResult = searchBR_BB_status.run().getRange(0, 1);
                if (searchResult != '' && searchResult != null) {
                    documentoEspecie = searchResult[0].getValue({
                        name: 'custrecord_lmry_br_docu_specie_code'
                    });
                }
            }
            if (documentoEspecie != '' && documentoEspecie != null) {
                COD_DOCUMENT_SPECIE = documentoEspecie;
            }

            // //////// Fin de la busqueda
        } catch (error) {
            log.error('ERROR', '[ obtenerDatosTransactionFields ]');
            libraryMail.sendemail(` [ obtenerDatosTransactionFields ] ${error}`, LMRY_script);
        }
    }

    // Datos de la subsidiaria
    function obtenerDatosSubsidiaria() {
        try {
            if (ID_SUB != 0) {
                ST_FEATURE = runtime.isFeatureInEffect({ feature: 'tax_overhauling' });

                const subsidiaria = record.load({
                    type: record.Type.SUBSIDIARY,
                    id: ID_SUB,
                    isDynamic: true
                });

                /**
                 * Para SuiteTax
                 */
                if (ST_FEATURE || ST_FEATURE === 'T') {
                    const subsidiary_nexus = runtime
                        .getCurrentScript()
                        .getParameter({ name: 'custscript_lmry_std_subsidiary_nexus' });
                    const taxregnum_lines_subsidiaries = subsidiaria.getLineCount({ sublistId: 'taxregistration' });
                    for (let x = 0; x < taxregnum_lines_subsidiaries; x++) {
                        const sub_nexus = subsidiaria.getSublistValue({
                            sublistId: 'taxregistration',
                            fieldId: 'nexus',
                            line: x
                        });
                        if (subsidiary_nexus === sub_nexus) {
                            var subsidiary_cnpj = subsidiaria.getSublistValue({
                                sublistId: 'taxregistration',
                                fieldId: 'taxregistrationnumber',
                                line: x
                            });
                            break;
                        }
                    }
                }

                const subsi_legalName = subsidiaria.getValue({
                    fieldId: 'legalname'
                });

                if (subsi_legalName) {
                    nombreSubsidiaria = subsi_legalName;
                } else {
                    const subsi_name = subsidiaria.getValue({
                        fieldId: 'name'
                    });
                    if (subsi_name) {
                        nombreSubsidiaria = subsi_name;
                    }
                }

                nombreSubsidiaria = ValidarCaracteres(nombreSubsidiaria);

                let subsi_cnpj = '';
                if (!ST_FEATURE || ST_FEATURE === 'F') {
                    subsi_cnpj = subsidiaria.getValue({ fieldId: 'federalidnumber' });
                } else {
                    subsi_cnpj = subsidiary_cnpj;
                }

                if (subsi_cnpj) {
                    cnpjSubsidiaria = subsi_cnpj;
                    cnpjSubsidiaria = cnpjSubsidiaria.replace(/\.|\-|\//g, '');
                }
            }
        } catch (error) {
            log.error('ERROR', '[ obtenerDatosSubsidiaria ]');
            libraryMail.sendemail(` [ obtenerDatosSubsidiaria ] ${error}`, LMRY_script);
        }
    }

    function obtenerDatosSacadorAvalista() {
        try {
            if (ID_SACADOR != 0 && ID_SACADOR != '' && ID_SACADOR != null) {
                const recordSacador = search.lookupFields({
                    type: search.Type.VENDOR,
                    id: ID_SACADOR,
                    columns: ['isperson', 'firstname', 'lastname', 'companyname']
                });

                let nom_sacador = '';
                const typeSacador = recordSacador.isperson;

                // Si el Customer es persona natural typeSacador es true
                if (typeSacador == 'T') {
                    const firtsName = recordSacador.firstname;
                    const lastName = recordSacador.lastname;
                    nom_sacador = `${firtsName} ${lastName}`;
                } else {
                    nom_sacador = recordSacador.companyname;
                }

                // NOMBRE DEL SACADOR/AVALISTA
                if (nom_sacador) {
                    nomSacador = nom_sacador.substring(0, 30);
                    nomSacador = ValidarCaracteres_Especiales(nomSacador);
                }
            }
        } catch (error) {
            log.error('ERROR', '[ obtenerDatosSacadorAvalista ]');
            libraryMail.sendemail(` [ obtenerDatosSacadorAvalista ] ${error}`, LMRY_script);
        }
    }

    function calcularInstallments() {
        try {
            if (ID_INST != '' && ID_INST != null) {
                COD_EMPRESA = `${ID_INV}_${ID_INST}`;
                if (DUEDATE_INST) {
                    dueDateInvoice = formatoFecha(DUEDATE_INST);
                }
                montoTotalInvoice = AMOUNT_INST;

                // Cálculo de retención para installments
                let jsonInstallments = [];
                if (RETENCION_INST != '' && RETENCION_INST != null) {
                    jsonInstallments = JSON.parse(RETENCION_INST);
                }

                if (Object.keys(jsonInstallments).length) {
                    for (const idInstallment in jsonInstallments) {
                        if (ID_INST == idInstallment) {
                            if (jsonInstallments[idInstallment].wht && FLAG) {
                                let retencion = Math.round(parseFloat(jsonInstallments[idInstallment].wht) * 100) / 100;
                                retencion = retencion.toFixed(2);
                                montoTotalInvoice =
                                    Math.round((parseFloat(montoTotalInvoice) - parseFloat(retencion)) * 100) / 100;
                            }
                        }
                    }
                }

                montoTotalInvoice = Number(montoTotalInvoice).toFixed(2);
                montoTotalInvoice = formatoMonto(montoTotalInvoice);
            } else {
                COD_EMPRESA = ID_INV;
            }
        } catch (error) {
            log.error('ERROR', '[ calcularInstallments ]');
            libraryMail.sendemail(` [ calcularInstallments ] ${error}`, LMRY_script);
        }
    }

    // Datos del Banco (Config Bank Ticket)
    function obtenerDatosConfigSubsidiariaBancoSantander() {
        try {
            let agency = '';
            let codBenef = '';
            // busqueda del record customrecord_lmry_br_config_bank_ticket para la config: Subsiiaria - BOA
            const searchConfigSubsiBank = search.create({
                type: 'customrecord_lmry_br_config_bank_ticket',
                columns: [
                    {
                        name: 'custrecord_lmry_beneficiary_code'
                    },
                    {
                        name: 'custrecord_lmry_code_bank'
                    },
                    {
                        name: 'custrecord_lmry_bank_code_cartera'
                    },
                    {
                        name: 'custrecord_lmry_bank_accept_bank_ticket'
                    },
                    {
                        name: 'custrecord_lmry_file_name'
                    },
                    {
                        name: 'custrecord_lmry_bank_agency'
                    },
                    {
                        name: 'custrecord_lmry_collection_number'
                    }
                ],
                filters: [
                    ['custrecord_lmry_name_subsidiary', 'is', ID_SUB],
                    'AND',
                    ['custrecord_lmry_pdf_bank', 'is', ID_BANK]
                ]
            });
            const searchResult = searchConfigSubsiBank.run().getRange(0, 1);

            if (searchResult != '' && searchResult != null) {
                const columns = searchResult[0].columns;

                // Código de Beneficiario
                codBenef = searchResult[0].getValue(columns[0]);
                if (codBenef != null && codBenef != '') {
                    codBenef = codBenef.replace('-', '');
                    codigoBeneficiario = codBenef.substring(0, 7);
                }

                // Código de Banco
                codigoBanco = searchResult[0].getValue(columns[1]);

                // Código de Cartera
                codigoCartera = searchResult[0].getValue(columns[2]);

                // Aceptación
                aceptacion = searchResult[0].getValue(columns[3]);

                if (aceptacion == 1) {
                    aceptacion = 'A';
                } else {
                    aceptacion = 'N';
                }

                agency = searchResult[0].getValue(columns[5]);
                if (agency != null && agency != '') {
                    agency = agency.replace('-', '');
                    agencia = agency.substring(0, 4);
                }

                const numeroConvenio = searchResult[0].getValue(columns[6]);
                if (numeroConvenio != null && numeroConvenio != '') {
                    numConvenioCobranza = numeroConvenio;
                }
            }
        } catch (error) {
            log.error('ERROR', '[ obtenerDatosConfigSubsidiariaBancoSantander ]');
            libraryMail.sendemail(` [ obtenerDatosConfigSubsidiariaBancoSantander ] ${error}`, LMRY_script);
        }
    }

    // Estructura de Detalle de Registro Obligatorio (Archivo de envío)
    function obtenerDetalleRegistroObligatorio() {
        let string = '';

        try {
            let agency = '';
            let identifMulta = 0;

            if (codigoCartera == 5) {
                agency = agencia;
            }

            if (MULTA) {
                identifMulta = '4';
                MULTA = parseFloat(MULTA).toFixed(2);
                MULTA = formatoMonto(MULTA);
            }

            if (MORA_DIA) {
                MORA_DIA = parseFloat(MORA_DIA).toFixed(2);
                MORA_DIA = formatoMonto(MORA_DIA);
            }

            string += '1'; // Identificación de Registro Detalhe
            string += '02'; // Tipo Inscripcion Beneficiaro CNPJ (subsidiaria) CNPJ:02
            string += completarInicio(cnpjSubsidiaria, 14, '0'); // CNPJ Subsidiaria
            string += completarInicio(agencia, 4, '0'); // Agencia N(4)
            string += completarInicio(numConvenioCobranza, 8, '0'); // Numero de Convenio Cobranza
            string += completarInicio(codigoBeneficiario, 8, '0'); // Prefijo de Código de Beneficiario N(4)
            string += completarFinal(COD_EMPRESA, 25, ' '); // Código de Control de Empresa A(25)
            string += completarInicio(NOSSO_NUMBER, 8, '0'); // Nosso Número
            string += '000000'; // Data do segundo desconto N(6)
            string += ' '; // Complemento de Registro A(1)
            string += completarInicio(identifMulta, 1, '0');
            string += completarInicio(MULTA, 4, '0');
            string += completarInicio(complementoRegistro, 15, '0');
            string += completarInicio(complementoRegistro, 4, ' ');
            string += '000000'; // Data para cobrança de multa.
            string += completarInicio(codigoCartera, 1, '0'); // Codigo Cartera
            string += completarInicio(COD_OCURRENCIA, 2, '0'); // Comando (Código de Ocurrencia)
            string += completarFinal(ID_INV, 10, ' '); // suNumero
            string += completarInicio(dueDateInvoice, 6, '0'); // Fecha de vencimiento  (invoice y/o Boleto Bancario)
            string += completarInicio(montoTotalInvoice, 13, '0'); // valorTítulo
            string += completarInicio(codigoBanco, 3, '0'); // Código de Banco
            string += completarInicio(agency, 5, '0'); // Agencia
            string += completarInicio(COD_DOCUMENT_SPECIE, 2, '0'); // Especie do Titulo
            string += completarFinal(aceptacion, 1, ' '); // Aceite do Titulo
            string += completarInicio(PROCESSING_DATE, 6, '0'); // fechaProcesamiento
            string += '00'; // Instrucción codificada
            string += '00'; // Instrucción codificada
            string += completarInicio(MORA_DIA, 13, '0'); // Juros de Mora por Dia de Atraso
            string += completarInicio(complementoRegistro, 45, '0'); // Descuentos
            string += completarInicio(tipoCustomer, 2, '0'); // tipoPagador
            string += completarInicio(cnpjCustomer, 14, '0'); // cnpjPagador
            string += completarFinal(nomCustomer, 40, ' '); // nombrePagador
            string += completarFinal(addressCustomer, 40, ' '); // direccionPagador
            string += completarFinal(bairroCustomer, 12, ' '); // Bairro Pagador
            string += completarInicio(cepCustomer, 8, '0'); // cepPagador
            string += completarFinal(ciudadCustomer, 15, ' '); // ciudadPagador
            string += completarFinal(ufCustomer, 2, ' '); // ufPagador
            string += completarFinal(nomSacador, 30, ' '); // Nome do Sacador/Avalista
            string += ' '; // Complemento de Registro A(1)
            string += '000';
            string += completarFinal(complementoRegistro, 6, ' '); // Complemento de Registro A(6)
            string += '00'; // Número de dias corridos para protesto.
            string += ' '; // Complemento de Registro A(1)
            // Seqüencial de Registro
            // string = ValidarCaracteres_Especiales(string);
        } catch (error) {
            log.error('ERROR', '[ obtenerDetalleRegistroObligatorio ]');
            libraryMail.sendemail(` [ obtenerDetalleRegistroObligatorio ] ${error}`, LMRY_script);
        }
        return string;
    }

    function ValidarCaracteres_Especiales(s) {
        const AccChars = 'ŠŽšžŸÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðñòóôõöùúûüýÿ°–—ªº·';
        const RegChars = 'SZszYAAAAAACEEEEIIIIDNOOOOOUUUUYaaaaaaceeeeiiiidnooooouuuuyyo--ao.';
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

    // Añadir secuencial de registro al final de Detalle de Registro Obligatorio
    function concatenarSecuencia(texto, numeroSecuencia) {
        const numero = completarInicio(numeroSecuencia, 6, 0); // NÚMERO SEQÜENCIAL N(6) del Registro Obligatorio
        return texto + numero;
    }

    // Cabecera del Archivo de Envío
    function obtenerCabeceraArchivo() {
        obtenerDatosConfigSubsidiariaBancoSantander();
        obtenerDatosSubsidiaria();
        let string = '';

        string += '0'; // Identificación Registro Header
        string += '1'; // Tipo de Operación
        string += 'REMESSA'; //  Identificación Tipo de Operación: "REMESSA"
        string += '01'; // Tipo de Servicio
        string += completarFinal('COBRANCA', 15, ' '); // Identificación Tipo de Servicio: "COBRANCA”
        string += completarInicio(complementoRegistro, 20, '0'); // Código de Transmissão N(20)
        string += completarFinal(nombreSubsidiaria, 30, ' '); // Nombre de Beneficiario A(30)
        string += completarInicio(codigoBanco, 3, '0'); // Código de banco
        string += completarFinal(nombreBanco, 15, ' '); // Nombre de banco
        let fechaCreacion = new Date();
        fechaCreacion = formatoFecha(fechaCreacion);
        string += completarInicio(fechaCreacion, 6, '0'); // Fecha Grabacion del archivo de Remessa
        string += completarInicio(complementoRegistro, 16, '0'); // Complemento de Registro N(16)
        string += completarFinal(complementoRegistro, 275, ' '); // Mensagem A(235) + Complemento de Registro (40)
        string += '000'; // Complemento de Registro N(3)
        string += '000001'; // Secuencial de Registro
        // string = ValidarCaracteres_Especiales(string);

        return string;
    }

    // Estructura de Trailer de Archivo (Archivo de envío)
    function obtenerTrailerArchivo(contador, suma) {
        let string = '';
        const nroDoc = contador - 2;
        string += '9'; // tipoRegistro
        string += completarInicio(nroDoc, 6, '0');
        string += completarInicio(suma, 13, '0');
        string += completarInicio(complementoRegistro, 374, '0'); // Complemento de Registro A(393)
        string += completarInicio(contador, 6, '0'); // secuencia

        return string;
    }

    // Completar Inicio con ceros para campos numéricos
    function completarInicio(dato, cantMaxima, caracter) {
        dato = dato.toString();
        while (dato.length < cantMaxima) {
            dato = caracter + dato;
        }
        if (dato.lentgh == cantMaxima) {
            return dato;
        } else {
            dato = dato.substring(0, cantMaxima);
            return dato;
        }
    }

    // Completar Final con espacios en blanco para campos alfanuméricos
    function completarFinal(dato, cantMaxima, caracter) {
        dato = dato.toString();
        while (dato.length < cantMaxima) {
            dato += caracter;
        }
        if (dato.lentgh == cantMaxima) {
            return dato;
        } else {
            dato = dato.substring(0, cantMaxima);
            return dato;
        }
    }

    return {
        getInputData,
        map,
        summarize
    };
});
