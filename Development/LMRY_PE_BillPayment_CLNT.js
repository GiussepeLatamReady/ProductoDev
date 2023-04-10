/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_PE_BillPayment_CLNT.js                      ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Nov 02 2022  LatamReady    Use Script 2.1           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define(['N/log', 'N/currency', 'N/record', 'N/format', 'N/search', 'N/runtime', 'N/currentRecord', 'N/url',
    'SuiteScripts/LatamReady2.1_SDF/LatamReady_37714/LatamReady_MainScripts/LMRY_libSendingEmailsLBRY_V2.0'],
    (log, currency, record, format, search, runtime, currentRecord, url, library) => {

        const LMRY_script = "LatamReady - PE BILL PAYMENT CLNT";
        /********************************
         * Variables de validacion para
         * los campos del tipo lista
         *******************************/
        let validar_payee = 0;
        let validar_depar = 0;
        let validar_class = 0;
        let validar_locat = 0;
        let validar_payme = 0;
        let validar_vendo = 0;
        let LANGUAGE;
        let isOneWorld;
        let isEnableDep;
        let isEnableLoc;
        let isEnableCLass;
        //Mensajes de alerta
        switch (LANGUAGE) {
            case 'es':
                var Mensaje1 = 'Campo "Subsidiaria" obligatorio';
                var Mensaje2 = 'Todos los impuestos aplicados a los items de la transacción deben tener una cuenta configurada en el record "LatamReady - PE Cuenta No Domiciliado"';
                var Mensaje3 = 'Campo "Tipo de Cambio" obligatorio';
                var Mensaje4 = 'Campo "Cuenta A/P" obligatorio';
                var Mensaje5 = 'Campo "Cuenta Bancaria" obligatorio';
                var Mensaje6 = 'Campo "Periodo Contable" obligatorio';
                var Mensaje7 = 'Campo "Proveedor" obligatorio';
                var Mensaje8 = 'Campo "Moneda" obligatorio';
                var Mensaje9 = 'Campo "Departamento" obligatorio';
                var Mensaje10 = 'Campo "Clase" obligatorio';
                var Mensaje11 = 'Campo "Ubicación" obligatorio';
                var Mensaje12 = 'Campo "LATAM - Método de Pago" obligatorio';
                var Mensaje13 = 'La cuenta bancaria elegida posee restricción de libros';
                var Mensaje14 = 'El campo "Cuenta Bancaria" no pertenece a la moneda escogida';
                var Mensaje15 = 'Debe tener configurado un registro en el record "LatamReady - Setup Tax Subsidiary" para poder continuar';
                var Mensaje16 = 'Seleccionar transacción: ';
                var Mensaje17 = 'Debe ingresar al menos una transacción por pagar. ';
                var Mensaje18 = "No hay transacciones por pagar, no se puede continuar con el proceso";
                var Mensaje19 = 'Transacción: ';
                var Mensaje20 = ' ,importe ';
                var Mensaje21 = ' es mayor a ';
                var Mensaje22 = ' ,ingresar importe mayor a 0 \n';
                var Mensaje23 = 'Hay un pago posterior a la fecha ingresada, no se puede continuar';
                var Mensaje24 = 'Debe tener un libro con la moneda configurada en el record LatamReady - Setup Tax Subsidiary para poder continuar';
                break;

            case 'pt':
                var Mensaje1 = 'Campo "Subsidiária" obrigatório';
                var Mensaje2 = 'Todos os impostos aplicados aos itens da transação devem ter uma conta configurada no registro "LatamReady - PE Cuenta No Domiciliado"';
                var Mensaje3 = 'Campo "Taxa de Câmbio" obrigatório';
                var Mensaje4 = 'Campo "Conta A/P" obrigatório';
                var Mensaje5 = 'Campo "Conta Bancária" obrigatório';
                var Mensaje6 = 'Campo "Período Contábil" obrigatório';
                var Mensaje7 = 'Campo "Beneficiário" obrigatório';
                var Mensaje8 = 'Campo "Moeda" obrigatório';
                var Mensaje9 = 'Campo "Departamento" obrigatório';
                var Mensaje10 = 'Campo "Classe" obrigatório';
                var Mensaje11 = 'Campo "Localização" obrigatório';
                var Mensaje12 = 'Campo "LATAM - Forma de Pagamento" Obligatorio';
                var Mensaje13 = 'A conta bancária escolhida tem uma restrição de livro';
                var Mensaje14 = 'O campo "Conta Bancária" não pertence à moeda escolhida';
                var Mensaje15 = 'Você deve ter configurado um registro no registro "LatamReady - Setup Tax Subsidiary" para continuar';
                var Mensaje16 = 'Selecione a transação: ';
                var Mensaje17 = 'Você deve inserir pelo menos uma transação para pagar. ';
                var Mensaje18 = "Não há transações a pagar, o processo não pode ser continuado";
                var Mensaje19 = 'Transação: ';
                var Mensaje20 = ' ,quantia ';
                var Mensaje21 = ' é melhor que ';
                var Mensaje22 = ' ,insira um valor maior que 0 \n';
                var Mensaje23 = 'Há um pagamento após a data inserida, você não pode continuar';
                var Mensaje24 = 'Você deve ter um livro com a moeda configurada no registro LatamReady - Setup Tax Subsidiary para continuar';
                break;

            default:
                var Mensaje1 = 'Mandatory "Subsidiary" field';
                var Mensaje2 = 'All taxes applied to the transaction items must have an account configured in the record "LatamReady - PE Cuenta No Domiciliado"';
                var Mensaje3 = 'Mandatory "Exchange Rate" field';
                var Mensaje4 = 'Mandatory "A/P Account" field';
                var Mensaje5 = 'Mandatory "Bank Account" field';
                var Mensaje6 = 'Mandatory "Accounting Period" field';
                var Mensaje7 = 'Mandatory "Payee" field';
                var Mensaje8 = 'Mandatory "Currency" field';
                var Mensaje9 = 'Mandatory "Department" field';
                var Mensaje10 = 'Mandatory "Class" field';
                var Mensaje11 = 'Mandatory "Location" field';
                var Mensaje12 = 'Mandatory "LATAM - Payment Method" field';
                var Mensaje13 = 'The chosen bank account has a book restriction';
                var Mensaje14 = 'The Bank Account field does not belong to the chosen currency';
                var Mensaje15 = 'You must have configured a record in the "LatamReady - Setup Tax Subsidiary" record in order to continue';
                var Mensaje16 = 'Select transaction: ';
                var Mensaje17 = 'You must enter at least one transaction to pay. ';
                var Mensaje18 = "There are no transactions to pay, the process cannot be continued";
                var Mensaje19 = 'Transaction: ';
                var Mensaje20 = ' ,amount ';
                var Mensaje21 = ' is greater than ';
                var Mensaje22 = ' ,enter amount greater than 0 \n';
                var Mensaje23 = 'There is a payment after the date entered, you can not continue';
                var Mensaje24 = 'You must have a book with the currency configured in the LatamReady - Setup Tax Subsidiary record in order to continue';
        }

        function pageInit(scriptContext) {
            isOneWorld = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });

            //activacion de enable features
            isEnableDep = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
            isEnableLoc = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
            isEnableCLass = runtime.isFeatureInEffect({ feature: "CLASSES" });

            LANGUAGE = runtime.getCurrentScript().getParameter({ name: 'LANGUAGE' });
            LANGUAGE = LANGUAGE.substring(0, 2);
            const objRecord = scriptContext.currentRecord;
            if (objRecord.getValue({ fieldId: 'custpage_id_date' }) == null || objRecord.getValue({ fieldId: 'custpage_id_date' }) == '') {
                const newDate = new Date();
                objRecord.setValue({ fieldId: 'custpage_id_date', value: newDate });
                const date = objRecord.getField({ fieldId: 'custpage_id_date' });
                /**
                 * Modificacion - Habilitacion campo date 
                 */
                const isFeatureEnable = true;
                if (!isFeatureEnable) {
                    date.isDisabled = true;
                }


            }
        }

        function funcionCancel() {
            try {
                const output = url.resolveScript({
                    scriptId: 'customscript_lmry_pe_billpayment',
                    deploymentId: 'customdeploy_lmry_pe_billpayment',
                    returnExternalUrl: false
                    //antes estaba en true y se hacia el replace
                });


                //output = output.replace('forms', 'system'),
                window.location.href = output;
            } catch (msgerr) {
                // Envio de mail al clientes
                library.sendemail(` [ LatamReady - BILL PAYMENT CLNT ] ${msgerr}`, LMRY_script);
            }

        }

        function fieldChanged(scriptContext) {

            try {
                const objRecord = scriptContext.currentRecord;
                if (scriptContext.sublistId == 'custpage_id_sublista' && scriptContext.fieldId == 'id_appl') {

                    const selc_app = objRecord.getCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_appl' });
                    if (selc_app == true) {
                        const internalid = objRecord.getCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_int' });

                        const amt_due = objRecord.getCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_amou' });
                        objRecord.setCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_pay', value: amt_due });

                        const curren_cuenta = validarCuenta(scriptContext, internalid);
                        if (curren_cuenta == false) {
                            alert(Mensaje2);
                            objRecord.setCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_appl', value: false });
                            return false;
                        }

                    } else {
                        objRecord.setCurrentSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_pay', value: '' });
                    }
                }

            }
            catch (msgerr) {
                library.sendemail(` [ LatamReady - BILL PAYMENT CLNT ] ${msgerr}`, LMRY_script);
            }

            return true;
        }



        function validateField(scriptContext) {

            try {
                if (scriptContext.fieldId == 'custpage_id_subsi') {
                    validaraccountpayable(scriptContext);
                    if (isEnableDep == true) { validardepartamento(scriptContext); }
                    if (isEnableCLass == true) { validarclass(scriptContext); }
                    if (isEnableLoc == true) { validarlocation(scriptContext); }
                    validarpaymethod(scriptContext);
                    validarVendorSubsidiaria(scriptContext);
                }

                if (scriptContext.fieldId == 'custpage_id_payee') {
                    validarcurrency(scriptContext);
                }

                if (scriptContext.fieldId == 'custpage_id_curren') {
                    validarbank(scriptContext);
                    validarSubsidiariaCurrency(scriptContext);
                }

                if (scriptContext.fieldId == 'custpage_id_date') {
                    validaraccountingperiod(scriptContext);
                    validarSubsidiariaCurrency(scriptContext);
                }
                if (scriptContext.fieldId == 'custpage_id_rate_journal') {
                    // return validarExchangeRate(scriptContext);
                }

            } catch (msgerr) {
                // Envio de mail al clientes
                library.sendemail(` [ LatamReady - BILL PAYMENT CLNT ] ${msgerr}`, LMRY_script);
            }
            return true;
        }

        function validarSubsidiariaCurrency(scriptContext) {

            if (isOneWorld) {
                var objRecord = scriptContext.currentRecord;
                const sub = objRecord.getValue({ fieldId: 'custpage_id_subsi' });
                var cur = objRecord.getValue({ fieldId: 'custpage_id_curren' });
                var date = objRecord.getValue({ fieldId: 'custpage_id_date' });

                var c_currency = objRecord.getField({ fieldId: 'custpage_id_rate' });
                if (sub != null && sub != '' && sub != 0 && cur != null && cur != '' && cur != 0) {
                    const subicurr = search.lookupFields({ type: search.Type.SUBSIDIARY, id: sub, columns: ['currency'] });
                    if (subicurr.currency[0].value == cur) {
                        objRecord.setValue({ fieldId: 'custpage_id_rate', value: 1 });
                        if (!c_currency.isDisabled) {
                            c_currency.isDisabled = true;
                        }
                    } else {
                        var isocode_sub = search.lookupFields({ type: search.Type.CURRENCY, id: subicurr.currency[0].value, columns: ['symbol'] });
                        isocode_sub = isocode_sub.symbol;
                        var isocode_curr = search.lookupFields({ type: search.Type.CURRENCY, id: cur, columns: ['symbol'] });
                        isocode_curr = isocode_curr.symbol;

                        var rate = currency.exchangeRate({ source: isocode_curr, target: isocode_sub, date });

                        objRecord.setValue({ fieldId: 'custpage_id_rate', value: rate });
                        if (c_currency.isDisabled) {
                            c_currency.isDisabled = false;
                        }
                    }
                } else {
                    objRecord.setValue({ fieldId: 'custpage_id_rate', value: '' });
                    c_currency.isDisabled = false;
                }
                return;
            }
            var objRecord = scriptContext.currentRecord;
            var cur = objRecord.getValue({ fieldId: 'custpage_id_curren' });
            var date = objRecord.getValue({ fieldId: 'custpage_id_date' });
            //var main_currency = search.lookupFields({ type: search.Type.VENDOR, id: payee, columns: ['currency'] });
            const main_currency = objRecord.getValue({ fieldId: 'custpage_mm_currency' });

            var c_currency = objRecord.getField({ fieldId: 'custpage_id_rate' });
            //if (main_currency.currency[0].value == cur) {
            if (main_currency == cur) {
                objRecord.setValue({ fieldId: 'custpage_id_rate', value: 1 });
                if (!c_currency.isDisabled) {
                    c_currency.isDisabled = true;
                }
                return;
            }
            //var isocode_sub = search.lookupFields({ type: search.Type.CURRENCY, id: main_currency.currency[0].value, columns: ['symbol'] });
            var isocode_sub = search.lookupFields({ type: search.Type.CURRENCY, id: main_currency, columns: ['symbol'] });
            isocode_sub = isocode_sub.symbol;
            var isocode_curr = search.lookupFields({ type: search.Type.CURRENCY, id: cur, columns: ['symbol'] });
            isocode_curr = isocode_curr.symbol;

            var rate = currency.exchangeRate({ source: isocode_curr, target: isocode_sub, date });

            objRecord.setValue({ fieldId: 'custpage_id_rate', value: rate });
            if (c_currency.isDisabled) {
                c_currency.isDisabled = false;
            }
        }

        function validardepartamento(scriptContext) {

            if (isOneWorld) {
                return new Promise(() => {
                    const objRecord = scriptContext.currentRecord;
                    const subs = objRecord.getValue({ fieldId: 'custpage_id_subsi' });
                    const field_depart = objRecord.getField({ fieldId: 'custpage_id_depart' });

                    if (validar_depar > 0) {
                        field_depart.removeSelectOption({ value: null });
                    }

                    const Search_depart = search.create({
                        type: search.Type.DEPARTMENT,
                        columns: ['internalid', 'name'],
                        filters: [{ name: 'subsidiary', operator: 'anyof', values: [subs] },
                        { name: 'isinactive', operator: 'is', values: 'F' }]
                    });
                    const searchResult = Search_depart.run().getRange({ start: 0, end: 1000 });

                    validar_depar = searchResult.length;
                    if (searchResult != null && searchResult.length > 0) {
                        field_depart.insertSelectOption({ value: 0, text: ' ' });

                        for (const element of searchResult) {
                            field_depart.insertSelectOption({
                                value: element.getValue({ name: 'internalid' }),
                                text: element.getValue({ name: 'name' })
                            });
                        }
                    }
                });
            }
        }

        function validarclass(scriptContext) {

            if (isOneWorld) {
                return new Promise(() => {
                    const objRecord = scriptContext.currentRecord;
                    const subs = objRecord.getValue({ fieldId: 'custpage_id_subsi' });
                    const field_clas = objRecord.getField({ fieldId: 'custpage_id_class' });

                    if (validar_class > 0) {
                        field_clas.removeSelectOption({ value: null });
                    }

                    const Search_clas = search.create({
                        type: search.Type.CLASSIFICATION,
                        columns: ['internalid', 'name'],
                        filters: [{ name: 'subsidiary', operator: 'anyof', values: [subs] },
                        { name: 'isinactive', operator: 'is', values: 'F' }]
                    });
                    const Result_class = Search_clas.run().getRange({ start: 0, end: 1000 });

                    validar_class = Result_class.length;
                    if (Result_class != null && Result_class.length > 0) {
                        field_clas.insertSelectOption({ value: 0, text: ' ' });
                        for (const resultClas of Result_class) {
                            field_clas.insertSelectOption({
                                value: resultClas.getValue({ name: 'internalid' }),
                                text: resultClas.getValue({ name: 'name' })
                            });
                        }
                    }
                });
            }
        }

        function validarlocation(scriptContext) {

            if (isOneWorld) {
                return new Promise(() => {
                    const objRecord = scriptContext.currentRecord;
                    const subs = objRecord.getValue({ fieldId: 'custpage_id_subsi' });
                    const field_loc = objRecord.getField({ fieldId: 'custpage_id_location' });

                    if (validar_locat > 0) {
                        field_loc.removeSelectOption({ value: null });
                    }

                    const Search_loc = search.create({
                        type: search.Type.LOCATION,
                        columns: ['internalid', 'name'],
                        filters: [{ name: 'subsidiary', operator: 'anyof', values: [subs] },
                        { name: 'isinactive', operator: 'is', values: 'F' }]
                    });

                    const searchResult = Search_loc.run().getRange({ start: 0, end: 1000 });

                    validar_locat = searchResult.length;
                    if (searchResult != null && searchResult.length > 0) {
                        field_loc.insertSelectOption({ value: 0, text: ' ' });

                        for (const element of searchResult) {
                            field_loc.insertSelectOption({
                                value: element.getValue({ name: 'internalid' }),
                                text: element.getValue({ name: 'name' })
                            });
                        }
                    }
                });
            }
        }

        function validaraccountingperiod(scriptContext) {

            const objRecord = scriptContext.currentRecord;
            const fecha = objRecord.getValue({ fieldId: 'custpage_id_date' });

            const field_accounting = objRecord.getField({ fieldId: 'custpage_id_period' });

            field_accounting.removeSelectOption({ value: null });
            field_accounting.insertSelectOption({ value: 0, text: ' ' });

            const x = format.parse({ value: fecha, type: format.Type.DATE });
            const search_period = search.load({ id: 'customsearch_lmry_pe_accounting_period' });

            search_period.filters.push(search.createFilter({ name: 'isinactive', operator: 'is', values: 'F' }));

            const resul_period = search_period.run();
            const lengt_period = resul_period.getRange({ start: 0, end: 1000 });

            let period_actua = 0;

            if (lengt_period != null && lengt_period.length > 0) {
                for (const element of lengt_period) {
                    const perID = element.getValue('internalid');
                    const perNM = element.getValue('periodname');
                    field_accounting.insertSelectOption({ value: perID, text: perNM });

                    const a = format.parse({ value: element.getValue('startdate'), type: format.Type.DATE });
                    const b = format.parse({ value: element.getValue('enddate'), type: format.Type.DATE });

                    if (x >= a && x <= b) {
                        period_actua = element.getValue('internalid');
                    } else if (x <= b) {
                        /**
                         * Modificacion - Seteo ultimo periodo abierto, cuando se setee una fecha de periodo cerrado
                         */
                        period_actua = element.getValue('internalid');
                    }
                }

                //Seteo por defecto con el record defrente, modo cliente
                objRecord.setValue({ fieldId: 'custpage_id_period', value: period_actua, ignoreFieldChange: false });

            }

        }

        function validarbank(scriptContext) {
            if (isOneWorld) {
                const objRecord = scriptContext.currentRecord;

                const subsidiaria = objRecord.getValue({ fieldId: 'custpage_id_subsi' });
                const field_bank = objRecord.getField({ fieldId: 'custpage_id_bank' });

                field_bank.removeSelectOption({ value: null });
                field_bank.insertSelectOption({ value: 0, text: ' ' });

                const search_bank = search.load({ id: 'customsearch_lmry_pe_bank_account' });

                search_bank.filters.push(search.createFilter({ name: 'subsidiary', operator: 'anyof', values: subsidiaria }));
                search_bank.filters.push(search.createFilter({ name: 'isinactive', operator: 'is', values: 'F' }));

                const result_bank = search_bank.run().getRange({ start: 0, end: 1000 });

                if (result_bank != null && result_bank.length > 0) {
                    const columns_bank = result_bank[0].columns;
                    for (const element of result_bank) {
                        const valores = element.getValue(columns_bank[0]);
                        const textos = element.getValue(columns_bank[1]);

                        if (textos != null && textos != '') {
                            field_bank.insertSelectOption({ value: valores, text: textos });
                        }

                    }
                }
            }
        }

        function validaraccountpayable(scriptContext) {
            if (isOneWorld) {
                return new Promise(() => {
                    const objRecord = scriptContext.currentRecord;
                    const subsidiaria = objRecord.getValue({ fieldId: 'custpage_id_subsi' });
                    const field_acc_payable = objRecord.getField({ fieldId: 'custpage_id_account_pay' });

                    if (validar_payee > 0) {
                        field_acc_payable.removeSelectOption({ value: null });
                    }

                    const search_acc_payable = search.load({ id: 'customsearch_lmry_pe_account_payable' });
                    search_acc_payable.filters.push(search.createFilter({ name: 'subsidiary', operator: 'anyof', values: subsidiaria }));
                    search_acc_payable.filters.push(search.createFilter({ name: 'isinactive', operator: 'is', values: 'F' }));

                    const result_acc_payable = search_acc_payable.run().getRange({ start: 0, end: 1000 });

                    validar_payee = result_acc_payable.length;
                    if (result_acc_payable != null && result_acc_payable.length > 0) {
                        field_acc_payable.insertSelectOption({ value: 0, text: ' ' });
                        const columns_payable = result_acc_payable[0].columns;

                        for (const element of result_acc_payable) {
                            const valores = element.getValue(columns_payable[0]);
                            const textos = element.getValue(columns_payable[1]);

                            if (textos != '' && textos != null) {
                                field_acc_payable.insertSelectOption({ value: valores, text: textos });
                            }

                        }
                    }
                });
            }
        }

        function validarcurrency(scriptContext) {

            const objRecord = scriptContext.currentRecord;
            const vendor = objRecord.getValue({ fieldId: 'custpage_id_payee' });
            const field_currency = objRecord.getField({ fieldId: 'custpage_id_curren' });

            field_currency.removeSelectOption({ value: null });
            field_currency.insertSelectOption({ value: 0, text: ' ' });

            const array_currency = new Array();
            const b = search.createFilter({ name: 'internalid', operator: 'anyof', values: [vendor] });
            const d = search.createFilter({ name: 'isinactive', operator: 'is', values: 'F' });
            const a = search.create({
                type: search.Type.VENDOR,
                filters: [b, d],
                columns: [{ name: 'currency' }, { name: 'currency', join: 'vendorcurrencybalance' }]
            });
            const run_search = a.run().getRange({ start: 0, end: 1000 });

            //Agrega la moneda principal
            if (run_search.length > 0) {
                var col = run_search[0].columns;
                array_currency.push(run_search[0].getText(col[0]));
            }
            //Agrega las monedas secundarias
            for (var i = 0; i < run_search.length; i++) {
                var col = run_search[i].columns;
                if (array_currency[0] != run_search[i].getValue(col[1])) {
                    array_currency.push(run_search[i].getValue(col[1]));
                }
            }

            const array_currency_internal = new Array();

            //Sort: porque al leer la busqueda lo iteraba por nombre no por id
            const c = search.create({
                type: search.Type.CURRENCY,
                columns: [{ name: 'internalid', sort: search.Sort.ASC }, { name: 'name' }]
            });
            const run_c = c.run().getRange({ start: 0, end: 1000 });

            if (run_c != null && run_c.length > 0) {
                for (var i = 0; i < array_currency.length; i++) {
                    for (const element of run_c) {
                        if (element.getValue({ name: 'name' }) == array_currency[i]) {
                            array_currency_internal.push(element.getValue({ name: 'internalid' }));
                        }
                    }
                }
            }

            for (let k = 0; k < array_currency_internal.length; k++) {
                field_currency.insertSelectOption({ value: array_currency_internal[k], text: array_currency[k] });
            }
        }


        function validarpaymethod(scriptContext) {

            if (isOneWorld) {
                return new Promise(() => {
                    const objRecord = scriptContext.currentRecord;
                    const subs = objRecord.getValue({ fieldId: 'custpage_id_subsi' });
                    const rcd_country = search.lookupFields({ type: search.Type.SUBSIDIARY, id: subs, columns: ['country'] });
                    const country = rcd_country.country[0].text;

                    const field_met = objRecord.getField({ fieldId: 'custpage_id_method' });

                    if (validar_payme > 0) {
                        field_met.removeSelectOption({ value: null });
                    }

                    const Search_met = search.create({
                        type: 'customrecord_lmry_paymentmethod',
                        columns: ['internalid', 'name', 'custrecord_lmry_country_pm'],
                        filters: [{ name: 'isinactive', operator: 'is', values: 'F' }]
                    });

                    const searchResult = Search_met.run().getRange({ start: 0, end: 1000 });

                    validar_payme = searchResult.length;
                    if (searchResult != null && searchResult.length > 0) {
                        field_met.insertSelectOption({ value: 0, text: ' ' });
                        for (const element of searchResult) {
                            const res_cont = element.getText({ name: 'custrecord_lmry_country_pm' });
                            if (country == res_cont) {
                                field_met.insertSelectOption({
                                    value: element.getValue({ name: 'internalid' }),
                                    text: element.getValue({ name: 'name' })
                                });
                            }
                        }
                    }
                });
            }
        }

        function validarVendorSubsidiaria(scriptContext) {

            if (isOneWorld) {
                return new Promise(() => {
                    const objRecord = scriptContext.currentRecord;
                    const subs = objRecord.getValue({ fieldId: 'custpage_id_subsi' });
                    const field_vendor = objRecord.getField({ fieldId: 'custpage_id_payee' });

                    if (validar_vendo > 0) {
                        field_vendor.removeSelectOption({ value: null });
                    }

                    const filtros_payee = new Array();
                    filtros_payee[0] = search.createFilter({ name: 'isinactive', operator: 'is', values: 'F' });
                    filtros_payee[1] = search.createFilter({ name: 'formulanumeric', formula: '{msesubsidiary.internalid}', operator: search.Operator.EQUALTO, values: subs });

                    const m1 = search.create({
                        type: search.Type.VENDOR,
                        filters: filtros_payee,
                        columns: ['internalid', 'entityid', 'companyname', 'firstname', 'lastname', 'isperson', 'middlename']
                    });

                    const m2 = m1.run();
                    let m3 = m2.getRange({ start: 0, end: 1000 });

                    let contador = 0;
                    let bandera = true;

                    validar_vendo = m3.length;
                    if (m3 != null && m3.length > 0) {
                        field_vendor.insertSelectOption({ value: 0, text: ' ' });
                        while (bandera) {
                            m3 = m2.getRange({ start: contador, end: contador + 1000 });

                            for (const element of m3) {
                                let valores1;
                                var textos1 = "";
                                valores1 = element.getValue({ name: 'internalid' });
                                if (element.getValue({ name: 'isperson' })) {
                                    textos1 = `${element.getValue({ name: 'firstname' })} `;
                                    if (element.getValue({ name: 'middlename' }) != null && element.getValue({ name: 'middlename' }) != '') {
                                        textos1 = `${textos1 + element.getValue({ name: 'middlename' }).substring(0, 1)} `;
                                    }
                                    textos1 += element.getValue({ name: 'lastname' });
                                } else {
                                    textos1 = element.getValue({ name: 'companyname' }) != null && element.getValue({ name: 'companyname' }) != "" ? element.getValue({ name: 'companyname' }) : element.getValue({ name: 'entityid' });
                                }
                                field_vendor.insertSelectOption({ value: valores1, text: textos1 });

                            }
                            if (m3.length == 1000) {
                                contador += 1000;
                            } else {
                                bandera = false;
                                contador += m3.length;
                            }
                        }
                    }
                });
            }
        }

        function validarCuenta(scriptContext, internalid) {
            const objRecord = scriptContext.currentRecord;
            if (isOneWorld) {
                /**@type {number} */
                var subsidiary = objRecord.getValue({ fieldId: 'custpage_id_subsi' });
            } else {
                var subsidiary = 1;
            }

            const search_transac = search.load({
                id: 'customsearch_lmry_pe_bill_lines'
            });

            const Filter_Trans = search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: internalid
            });

            search_transac.filters.push(Filter_Trans);

            const resul_transac = search_transac.run();
            const lengt_transac = resul_transac.getRange({
                start: 0,
                end: 1000
            });


            if (lengt_transac != null && lengt_transac.length > 0) {
                for (const element of lengt_transac) {
                    const colFields = element.columns;

                    const impuestoRenta = element.getValue(colFields[15]);

                    const searchCuenta = search.create({
                        type: 'customrecord_lmry_pe_cuenta_nodomicilio',
                        columns: [{
                            name: "custrecord_lmry_pe_cuenta"
                        }],
                        filters: [
                            ['custrecord_lmry_pe_impuesto_renta', 'is', impuestoRenta], 'AND',
                            ['custrecord_lmry_pe_subsidiaria', 'is', subsidiary], 'AND',
                            ['isinactive', 'is', 'F']
                        ]

                    });
                    const searchResultCuenta = searchCuenta.run().getRange(0, 1);
                    if (searchResultCuenta == null || searchResultCuenta == '') {
                        //mensaje = "No posee una cuenta configurada en el record 'LatamReady - PE Cuenta No Domiciliado'";
                        return false;
                    }

                }

            }
        }

        // function validarExchangeRate(scriptContext) {
        //     var objRecord = scriptContext.currentRecord;
        //     var journalExchangeRate = objRecord.getValue({ fieldId: 'custpage_id_rate_journal' });
        //     if (!isNaN(Number(journalExchangeRate.toString().trim()))) {
        //         return false;
        //     }
        //     return true;
        // }

        function saveRecord(scriptContext) {
            try {
                // Objetos del Formulario
                const viewRecord = scriptContext.currentRecord;
                const subsidiaryID = isOneWorld ? viewRecord.getValue({ fieldId: 'custpage_id_subsi' }) : "Mismarket Edition";
                const payeeID = viewRecord.getValue({ fieldId: 'custpage_id_payee' });
                const bankID = viewRecord.getValue({ fieldId: 'custpage_id_bank' });

                const exchangeRate = viewRecord.getValue({ fieldId: 'custpage_id_rate' });

                const exchangeRateJournal = viewRecord.getValue({ fieldId: 'custpage_id_rate_journal' });

                const accountID = viewRecord.getValue({ fieldId: 'custpage_id_account_pay' });

                const currencyID = viewRecord.getValue({ fieldId: 'custpage_id_curren' });

                const periodID = viewRecord.getValue({ fieldId: 'custpage_id_period' });

                const date = viewRecord.getValue({ fieldId: 'custpage_id_date' });

                const memo = viewRecord.getValue({ fieldId: 'id_memo' });

                const departmentID = viewRecord.getValue({ fieldId: 'custpage_id_depart' });

                const locationID = viewRecord.getValue({ fieldId: 'custpage_id_location' });

                const classID = viewRecord.getValue({ fieldId: 'custpage_id_class' });

                const methodID = viewRecord.getValue({ fieldId: 'custpage_id_method' });

                // Variable Estado
                const status = viewRecord.getValue({ fieldId: 'id_state' });


                if (status == '' || status == null) {
                    //activacion de enable features
                    const isEnableDep = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
                    const isEnableLoc = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
                    const isEnableCLass = runtime.isFeatureInEffect({ feature: "CLASSES" });

                    //activacion de Accounting Preferences
                    const user = runtime.getCurrentUser();
                    const userPrefDepartment = user.getPreference({ name: "DEPTMANDATORY" });
                    const userPrefLocation = user.getPreference({ name: "LOCMANDATORY" });
                    const userPrefClass = user.getPreference({ name: "CLASSMANDATORY" });

                    // Validar campos
                    if (subsidiaryID == null || subsidiaryID == '' || subsidiaryID == 0) {
                        alert(Mensaje1);
                        return false;
                    }
                    if (accountID == 0) {
                        alert(Mensaje4);
                        return false;
                    }
                    if (payeeID == null || payeeID == '') {
                        alert(Mensaje7);
                        return false;
                    }
                    if (currencyID == null || currencyID == '' || currencyID == 0) {
                        alert(Mensaje8);
                        return false;
                    }
                    if (bankID == 0) {
                        alert(Mensaje5);
                        return false;
                    }
                    if (periodID == 0) {
                        alert(Mensaje6);
                        return false;
                    }
                    if (exchangeRate == null || exchangeRate == '') {
                        alert(Mensaje3);
                        return false;
                    }

                    if (isEnableDep == true && userPrefDepartment == true && departmentID == 0) {
                        alert(Mensaje9);
                        return false;
                    }
                    if (isEnableCLass == true && userPrefClass == true && classID == 0) {
                        alert(Mensaje10);
                        return false;
                    }
                    if (isEnableLoc == true && (userPrefLocation == true && locationID == 0)) {
                        alert(Mensaje11);
                        return false;
                    }

                    if (methodID == 0) {
                        alert(Mensaje12);
                        return false;
                    }

                    //valida que la cuenta no tenga restricción de accounting book
                    if (bankID != null && bankID != '') {
                        var accountRecord = record.load({ type: record.Type.ACCOUNT, id: bankID, isDynamic: true });
                        const restrictBook = accountRecord.getValue('restricttoaccountingbook');

                        if (restrictBook && restrictBook != 0) {
                            alert(Mensaje13);
                            return false;
                        }
                    }

                    // valida que currency pertenezca a bank account
                    if ((bankID != null && bankID != '') && (currencyID != null && currencyID != '') && isOneWorld) {
                        var accountRecord = record.load({ type: record.Type.ACCOUNT, id: bankID, isDynamic: true });
                        const axcur = accountRecord.getValue('currency');

                        let subsidiaryCurrency = search.lookupFields({ type: search.Type.SUBSIDIARY, id: subsidiaryID, columns: ['currency'] });
                        subsidiaryCurrency = subsidiaryCurrency.currency[0].value;

                        if (currencyID == subsidiaryCurrency) {
                            if (axcur != currencyID) {
                                alert(Mensaje14);
                                return false;
                            }
                        } else if (axcur != currencyID && axcur != subsidiaryCurrency) {
                            alert(Mensaje14);
                            return false;
                        }

                    }

                    //VALIDACION QUE NO HALLA UN PAGO POSTERIOR A LA FECHA INGRESADA EN EL MISMO PERIODO CONTABLE
                    const aux_date = format.format({ value: date, type: format.Type.DATE });
                    const valid_fecha_pago = search.create({
                        type: "customrecord_lmry_pe_payments_log",
                        filters: [["formulatext: {custrecord_lmry_pe_payment}", "isnotempty", ""], "AND",
                        ["custrecord_lmry_pe_payment.trandate", "after", aux_date], "AND",
                        ["custrecord_lmry_pe_period", "anyof", periodID], "AND", ["custrecord_lmry_pe_vendor", "anyof", payeeID]],
                        columns: [search.createColumn({ name: "internalid", sort: search.Sort.DESC, label: "Internal ID" })]
                    });

                    const result_fecha_pago = valid_fecha_pago.run().getRange({ start: 0, end: 1 });

                    if (result_fecha_pago.length > 0) {
                        alert(Mensaje23);
                        return false;
                    }

                    //VALIDACION DEBE TENER UN REGISTRO EN EL RECORD SETUP TAX SUBSIDIARY
                    const filtros_setup = new Array();
                    filtros_setup[0] = search.createFilter({ name: 'isinactive', operator: 'is', values: ['F'] });
                    if (isOneWorld) {
                        filtros_setup[1] = search.createFilter({ name: 'custrecord_lmry_setuptax_subsidiary', operator: 'anyof', values: subsidiaryID });
                    }

                    var search_setup = search.create({ type: 'customrecord_lmry_setup_tax_subsidiary', columns: ['internalid'], filters: filtros_setup });
                    const result_setup = search_setup.run().getRange({ start: 0, end: 1 });

                    if (result_setup.length == 0) {
                        alert(Mensaje15);
                        return false;
                    }


                } else {
                    // Para el segundo Proceso

                    //VALIDAR MULTIBOOKING
                    const isMultibook = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
                    if (isOneWorld && isMultibook) {

                        var filtros = new Array();
                        filtros[0] = search.createFilter({ name: 'isinactive', operator: 'is', values: ['F'] });
                        if (isOneWorld) {
                            filtros[1] = search.createFilter({ name: 'custrecord_lmry_setuptax_subsidiary', operator: 'is', values: subsidiaryID });
                        }

                        const search_multibooking = search.create({ type: 'customrecord_lmry_setup_tax_subsidiary', columns: ['custrecord_lmry_setuptax_currency'], filters: filtros });
                        const result_multibooking = search_multibooking.run().getRange({ start: 0, end: 1 });

                        const currency_setup = result_multibooking[0].getValue({ name: 'custrecord_lmry_setuptax_currency' });
                        const currency_setup_text = result_multibooking[0].getText({ name: 'custrecord_lmry_setuptax_currency' });

                        let currency_sub = search.lookupFields({ type: search.Type.SUBSIDIARY, id: subsidiaryID, columns: ['currency'] });
                        currency_sub = currency_sub.currency[0].value;

                        let multibooking_flag = false;
                        if (currency_setup != currency_sub && currency_setup != currencyID) {
                            multibooking_flag = true;
                        }

                        if (multibooking_flag) {

                            var mbook = "";
                            let flag_libro = false;

                            const row_mbook = viewRecord.getLineCount({ sublistId: 'custpage_id_sublista_book' });

                            if (row_mbook > 0) {
                                for (let r = 0; r < row_mbook; r++) {
                                    const currency_book = viewRecord.getSublistText({ sublistId: 'custpage_id_sublista_book', fieldId: 'custpage_id_currency', line: r });
                                    const exrate_book = viewRecord.getSublistValue({ sublistId: 'custpage_id_sublista_book', fieldId: 'custpage_id_rate_book', line: r });
                                    if (currency_setup_text == currency_book) {
                                        flag_libro = true;
                                    }
                                    mbook = `${mbook + currency_book};${exrate_book}|`;
                                }
                            }

                            if (!flag_libro) {
                                alert(Mensaje24);
                                return false;
                            }
                        }
                    }

                    // VALIDAR SELECCION
                    const row = viewRecord.getLineCount({ sublistId: 'custpage_id_sublista' });

                    let totalApply = 0;
                    if (row > 0) {
                        let isMandatory = false;
                        var filtros = new Array();
                        filtros[0] = search.createFilter({ name: 'isinactive', operator: 'is', values: ['F'] });
                        if (isOneWorld) {
                            filtros[1] = search.createFilter({ name: 'custrecord_lmry_setuptax_subsidiary', operator: 'is', values: subsidiaryID });
                        }
                        var search_setup = search.create({ type: 'customrecord_lmry_setup_tax_subsidiary', filters: filtros, columns: ['custrecord_lmry_setuptax_check'] });
                        const result_search_setup = search_setup.run().getRange({ start: 0, end: 1 });
                        if (result_search_setup != null && result_search_setup.length > 0) {
                            isMandatory = result_search_setup[0].getValue({ name: 'custrecord_lmry_setuptax_check' });

                        }


                        for (let j = 0; j < row; j++) {
                            const isApply = viewRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_appl', line: j });
                            if (isApply == false) {
                                totalApply++;
                            }
                            const pay = viewRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_pay', line: j });
                            const tran = viewRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_int', line: j });

                            var desa = ' ';
                            if ((pay != null && pay != '') && (isApply == false)) {
                                desa += `${Mensaje16 + tran}\n`;
                                alert(desa);
                                return false;
                            }
                        }

                        const resul = validarpayment(scriptContext);

                        if (!resul) {
                            return false;
                        }

                        if (totalApply == row) {
                            let mens = ' ';
                            mens += `${Mensaje17 + mens}\n`;
                            alert(mens);
                            return false;
                        }
                    } else {
                        alert(Mensaje18);
                        return false;
                    }

                    let _bil = '';
                    let _doc = '';
                    let _state = '';
                    const totalLinesSublist = viewRecord.getLineCount({ sublistId: 'custpage_id_sublista' });

                    if (totalLinesSublist > 0) {
                        for (let i = 0; i < totalLinesSublist; i++) {
                            const s_appl = viewRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_appl', line: i });
                            const s_intr = viewRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_int', line: i });
                            const s_doc = viewRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_doc', line: i });
                            const s_am_rem = viewRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_amou', line: i });
                            const s_paym = viewRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_pay', line: i });
                            const s_montobill = viewRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_tota', line: i });

                            if (s_appl == true) {
                                // Internal ID y Importe
                                _bil = `${s_intr};${s_paym};${s_am_rem};${s_montobill}|`;
                                _doc = `${s_intr};${s_doc}|`;

                                // validar para poder guardar los datos
                                var logWHTaxRecord = record.create({
                                    type: 'customrecord_lmry_pe_payments_log',
                                    isDynamic: true
                                });

                                if (mbook != null && mbook != '') {
                                    logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_multibook', value: mbook });
                                }

                                if (isOneWorld) {
                                    if (subsidiaryID != null && subsidiaryID != '') {
                                        logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_subsidiary', value: subsidiaryID });
                                    }
                                } else {
                                    logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_subsidiary', value: 1 });
                                }

                                logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_status', value: 'Preview' });

                                logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_vendor', value: payeeID });

                                logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_bill', value: _bil });

                                logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_billid', value: s_intr });

                                logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_doc', value: _doc });

                                logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_account', value: accountID });

                                logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_currency', value: currencyID });

                                logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_bank', value: bankID });

                                logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_date', value: date });

                                logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_period', value: periodID });

                                logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_exchangerate', value: exchangeRate });

                                logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_exchangerate_j', value: exchangeRateJournal });


                                if (memo != null && memo != '') {
                                    logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_memo', value: memo });
                                }

                                if (departmentID != null && departmentID != '' && departmentID != 0) {
                                    logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_department', value: departmentID });
                                }

                                if (locationID != null && locationID != '' && locationID != 0) {
                                    logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_location', value: locationID });
                                }

                                if (classID != null && classID != '' && classID != 0) {
                                    logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_class', value: classID });
                                }

                                logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_paymethod', value: methodID });

                                if (s_montobill != '' && s_montobill != null) {
                                    logWHTaxRecord.setValue({ fieldId: 'custrecord_lmry_pe_amount', value: s_montobill });
                                }

                                // Graba Log
                                var logid = logWHTaxRecord.save();
                                _state = `${_state + logid}|`;

                            }
                        }
                    }

                    viewRecord.setValue({ fieldId: 'id_state', value: _state });
                }

                // Para poder realizar el siguiente proceso
                return true;

            } catch (msgerr) {

                alert('Se presentó un error. No se puedo continuar con el proceso.');
                // Envio de mail al clientes
                library.sendemail(` [ LatamReady - BILL PAYMENT CLNT ] ${msgerr}`, LMRY_script);

                return false;
            }
        }

        function validarpayment(scriptContext) {
            const objRecord = scriptContext.currentRecord;
            const row = objRecord.getLineCount({ sublistId: 'custpage_id_sublista' });

            let sw = true;
            for (let i = 0; i < row; i++) {
                const appl = objRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_appl', line: i });

                if (appl == true) {
                    var pay = objRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_pay', line: i });
                    var amou = objRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_amou', line: i });
                    var tran = objRecord.getSublistValue({ sublistId: 'custpage_id_sublista', fieldId: 'id_int', line: i });

                    var desa = '';
                    if ((amou != null && amou != '') && (pay != null && pay != '')) {
                        if (amou < pay) {
                            desa += `${Mensaje19 + tran + Mensaje20 + pay + Mensaje21 + amou}\n`;
                            alert(desa);
                            sw = false;
                        }
                    } else if (pay == 0 || pay == null || pay == '' || pay < 0) {
                        desa += Mensaje19 + tran + Mensaje22;
                        alert(desa);
                        sw = false;
                    }
                }
            }
            return sw;
        }
        function markAll() {

            try {

                const objRecord = currentRecord.get();
                const cantidad = objRecord.getLineCount({ sublistId: 'custpage_id_sublista' });

                for (let i = 0; i < cantidad; i++) {
                    objRecord.selectLine({ sublistId: 'custpage_id_sublista', line: i });
                }


            } catch (error) {
                library.sendMail(LMRY_script, error);
                //library.sendemail('[MarkAll]' + error, LMRY_script);
            }

        }

        function desmarkAll() {
            try {

                const objRecord = currentRecord.get();
                const cantidad = objRecord.getLineCount({ sublistId: 'custpage_id_sublista' });

                for (let i = 0; i < cantidad; i++) {
                    objRecord.selectLine({ sublistId: 'custpage_id_sublista', line: i });
                }


            } catch (error) {
                library.sendMail(LMRY_script, error);
                //library.sendemail('[desmarkAll]' + error, LMRY_script);
            }
        }

        return {
            pageInit,
            fieldChanged,
            validateField,
            funcionCancel,
            saveRecord,
            markAll,
            desmarkAll
        };

    });