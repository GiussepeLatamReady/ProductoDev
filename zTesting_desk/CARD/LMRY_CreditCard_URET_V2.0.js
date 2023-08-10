/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_CreditCard_URET_V2.0.js                     ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 14 2018  LatamReady    User Event 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

define(['N/record', 'N/runtime', 'N/search', 'N/log', 'N/https', 'N/url', 'N/ui/serverWidget',
    './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', './Latam_Library/LMRY_HideView3LBRY_V2.0',
    './WTH_Library/LMRY_TAX_TransactionLBRY_V2.0', './Latam_Library/LMRY_PE_Massive_BillPayments_LBRY',
    './WTH_Library/LMRY_PE_EspejoCuentas_LBRY', './Latam_Library/LMRY_PE_IGVNoDomiciliciado_LBRY',
    './Latam_Library/LMRY_ValidateClosePeriod_LBRY_V2.0', './Latam_Library/LMRY_MX_LatamTax_Purchase_LBRY_V2.0',
    './Latam_Library/LMRY_MX_STE_Sales_Tax_Transaction_LBRY_V2.0', './Latam_Library/LMRY_MX_CREATE_JsonTaxResult_LBRY_V2.0'
],

    function (record, runtime, search, log, https, url, serverWidget, library, library_hideview3,
        Library_WHT_Transaction, library_Journal, libraryPECreditCard, library_IGV, LibraryValidatePeriod,
        MX_TaxLibrary, MX_STE_TaxLibrary, libraryMxJsonResult) {

        var scriptObj = runtime.getCurrentScript();
        var type = '';
        var LMRY_script = 'LatamReady - Credit Card URET V2.0';
        var isURET = true;
        var recordObj = null;
        var licenses = [];

        var ST_FEATURE = false;


        function beforeLoad(context) {
            try {

                recordObj = context.newRecord;
                type = context.type;
                var country = new Array();
                country[0] = '';
                country[1] = '';
                var form = context.form;
                var subsidiary = recordObj.getValue({
                    fieldId: 'subsidiary'
                });

                // SuiteTax
                ST_FEATURE = runtime.isFeatureInEffect({ feature: 'tax_overhauling' });

                if (type == 'create' || type == 'copy') {
                    library.cleanFieldsTransaction(recordObj);
                }

                if (context.type != 'print' && context.type != 'email') {

                    licenses = library.getLicenses(subsidiary);
                    if (licenses == null || licenses == '') {
                        licenses = [];
                        library_hideview3.PxHide(form, '', recordObj.type);
                        // Cambio realizado el 12/08/2022
                        if (context.type != 'create') {
                            library_hideview3.PxHideSubTab(form, '', recordObj.type);
                        }
                        library_hideview3.PxHideColumn(form, '', recordObj.type);
                    }

                    var LMRY_Result = ValidateAccessVB(subsidiary);

                    if (ST_FEATURE == true || ST_FEATURE == "T") {

                        if (["copy", "xcopy"].indexOf(type) != -1) {
                            switch (LMRY_Result[0]) {
                                case "MX":
                                    MX_STE_TaxLibrary.deleteTaxDetailLines(recordObj);
                                    break;
                            }
                        }

                        if (["copy", "create"].indexOf(type) != -1) {
                            switch (LMRY_Result[0]) {
                                case "MX":
                                    MX_STE_TaxLibrary.deleteTaxDetailLines(recordObj);
                                    break;
                            }
                        }

                    }

                }

                /* Validacion 04/02/22 */
                // Campo - Valida Periodo cerrado
                var LockedPeriodField = form.addField({
                    id: 'custpage_lockedperiod',
                    label: 'Locked Period',
                    type: serverWidget.FieldType.CHECKBOX
                });
                LockedPeriodField.defaultValue = 'F';
                LockedPeriodField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                /* Fin validacion 04/02/22 */

                if (context.type != 'print' && context.type != 'email') {
                    try {
                        if (subsidiary == '' || subsidiary == null) {
                            var userS = runtime.getCurrentUser();
                            subsidiary = userS.subsidiary;
                        }
                        if (subsidiary != '' && subsidiary != null) {
                            var filters = new Array();
                            filters[0] = search.createFilter({
                                name: 'internalid',
                                operator: search.Operator.ANYOF,
                                values: [subsidiary]
                            });
                            var columns = new Array();
                            columns[0] = search.createColumn({
                                name: 'country'
                            });

                            var getfields = search.create({
                                type: 'subsidiary',
                                columns: columns,
                                filters: filters
                            });
                            getfields = getfields.run().getRange(0, 1000);

                            if (getfields != '' && getfields != null) {
                                country[0] = getfields[0].getValue('country');
                                country[1] = getfields[0].getText('country');
                            }
                        }
                    } catch (err) {
                        country[0] = runtime.getCurrentScript().getParameter({
                            name: 'custscript_lmry_country_code_stlt'
                        });
                        country[1] = runtime.getCurrentScript().getParameter({
                            name: 'custscript_lmry_country_desc_stlt'
                        });
                    }

                    if (form != '' && form != null) {
                        var hide_transaction = library.getHideView(country, 2, licenses);
                        var hide_sublist = library.getHideView(country, 5, licenses);
                        var hide_column = library.getHideView(country, 3, licenses);

                        if (library.getCountryOfAccess(country, licenses)) {
                            if (hide_transaction == true) {
                                library_hideview3.PxHide(form, country[0], recordObj.type);
                            }
                            if (hide_sublist == true) {
                                library_hideview3.PxHideSubTab(form, country[0], recordObj.type);
                            }
                            if (hide_column == true) {
                                library_hideview3.PxHideColumn(form, country[0], recordObj.type);
                            }
                        } else {
                            if (hide_transaction == true) {
                                library_hideview3.PxHide(form, '', recordObj.type);
                            }
                            if (hide_sublist == true) {
                                library_hideview3.PxHideSubTab(form, '', recordObj.type);
                            }
                            if (hide_column == true) {
                                library_hideview3.PxHideColumn(form, '', recordObj.type);
                            }
                        }
                    }

                    if (['create', 'edit', 'copy'].indexOf(context.type) != -1 && country[0] == 'BR' && (library.getAuthorization(147, licenses) || library.getAuthorization(527, licenses) || library.getAuthorization(670, licenses))) {

                        recordObj.setValue('custbody_lmry_scheduled_process', false);

                    }


                }//FIN DE !PRINT & !EMAIL
                if (ST_FEATURE == false || ST_FEATURE == "F") {
                    licenses = library.getLicenses(subsidiary);
                    var LMRY_Result = ValidateAccessVB(subsidiary);

                    if (type == 'copy') {
                        if (LMRY_Result[0] == "MX" && library.getAuthorization(671, licenses)) {
                            MX_TaxLibrary.resetLines(recordObj);
                        }
                    }
                }

            } catch (err) {
                recordObj = context.newRecord;
                library.sendemail2('[ beforeLoad ] ' + err, LMRY_script, recordObj, 'transactionnumber', 'entity');
            }
            return true;
        }

        function beforeSubmit(context) {

            try {

                recordObj = context.newRecord;
                type = context.type;

                // Subsidiaria de la transaccion
                var subsidiary = recordObj.getValue({
                    fieldId: 'subsidiary'
                });

                ST_FEATURE = runtime.isFeatureInEffect({ feature: 'tax_overhauling' });

                licenses = library.getLicenses(subsidiary);
                // Validacion de Acceso a Features
                var LMRY_Result = ValidateAccessVB(subsidiary);

                /* Validacion 04/02/22 */
                // Libreria - Valida Periodo cerrado
                if (LibraryValidatePeriod.validatePeriod(recordObj.getValue('postingperiod'), licenses, LMRY_Result[0], 'purchase')) return true;
                /* Fin validacion 04/02/22 */

                if (type == 'edit' && LMRY_Result[0] == 'BR' && (library.getAuthorization(527, licenses) || library.getAuthorization(147, licenses))) {

                    var transaction_fields = search.create({
                        type: 'customrecord_lmry_br_transaction_fields',
                        columns: 'custrecord_lmry_br_block_taxes',
                        filters: [
                            ['custrecord_lmry_br_related_transaction', 'anyof', recordObj.id], 'AND', ['custrecord_lmry_br_block_taxes', 'anyof', 1]
                        ]
                    });
                    var result_transaction_fields = transaction_fields.run().getRange(0, 1);

                    if (!result_transaction_fields.length) {
                        Library_WHT_Transaction.deleteTaxResults(recordObj);
                    }

                    var journalCreditCard = search.create({ type: 'journalentry', filters: [{ name: 'custbody_lmry_reference_transaction', operator: 'anyof', values: recordObj.id }] });
                    journalCreditCard = journalCreditCard.run().getRange({ start: 0, end: 1000 });

                    var idJournal = [];

                    if (journalCreditCard && journalCreditCard.length) {
                        var auxId = '';
                        for (var i = 0; i < journalCreditCard.length; i++) {

                            if (auxId != journalCreditCard[i].id) {
                                auxId = journalCreditCard[i].id;
                                idJournal.push(auxId);
                            }

                        }

                        if (idJournal.length) {
                            for (var i = 0; i < idJournal.length; i++) {
                                record.delete({ type: 'journalentry', id: idJournal[i] });
                            }
                        }

                    }


                }

                if (ST_FEATURE == true || ST_FEATURE == "T") {
                    if (type == "delete") {
                        switch (LMRY_Result[0]) {
                            case "MX":
                                if (library.getAuthorization(672, licenses) == true) {
                                    MX_STE_TaxLibrary.deleteTaxResult(recordObj.id);
                                }
                                break;
                        }
                    }
                } else {
                    if (LMRY_Result[0] == "MX") {
                        if (library.getAuthorization(671, licenses) && type == 'delete') {
                            libraryMxJsonResult._inactiveTaxResult(recordObj.id, taxType = 4)
                        }
                    }
                }

                //Delete Journal PE Espejo Cuentas 6-9
                if (type == 'edit' && LMRY_Result[0] == 'PE' && library.getAuthorization(500, licenses)) {
                    libraryPECreditCard.deleteJournalEspejo(recordObj.id, true);
                }


            } catch (err) {
                recordObj = context.newRecord;
                library.sendemail2('[ beforeSubmit ] ' + err, LMRY_script, recordObj, 'transactionnumber', 'entity');
            }

            return true;


        }

        function afterSubmit(context) {

            try {

                recordObj = context.newRecord;
                type = context.type;

                // Subsidiaria de la transaccion
                var subsidiary = recordObj.getValue({
                    fieldId: 'subsidiary'
                });

                licenses = library.getLicenses(subsidiary);
                // Validacion de Acceso a Features
                var LMRY_Result = ValidateAccessVB(subsidiary);

                /* Validacion 04/02/22 */
                // Libreria - Valida Periodo cerrado
                if (LibraryValidatePeriod.validatePeriod(recordObj.getValue('postingperiod'), licenses, LMRY_Result[0], 'purchase')) return true;
                /* Fin validacion 04/02/22 */

                var typeEvent = ['create', 'edit', 'copy'];

                if (typeEvent.indexOf(type) > -1 && LMRY_Result[0] == 'PE' && LMRY_Result[2] == true) {
                    var linesTrans = {};

                    if (type == 'edit') {
                        //Se elimina journals anexados a la transacción
                        library_Journal.deleteJournal(recordObj.id, true);
                    }

                    /*Proceso Cálculo de Impuesto a la Renta*/
                    //Se obtienen las líneas de la transacción
                    linesTrans = library_Journal.cargarLineasTransaccion(recordObj.id);
                    log.debug('linesTrans', linesTrans);

                    //Creación de journals
                    library_Journal.createJournal(linesTrans, recordObj);

                    /*Proceso IGV No Domicliado*/
                    //Si existe se elimina el Transaction Fields
                    // library_IGV.deleteTransactionFields(recordObj.id);

                    //Cálculo de IGV, creación de Journal, seteo en transacción y Transaction Fields
                    if (isEditAmounts(context.newRecord, context.oldRecord, context)) {
                        library_IGV.calcularIGV(recordObj);
                    }

                }

                if (type == 'edit' && LMRY_Result[0] == 'BR' && (library.getAuthorization(147, licenses) || library.getAuthorization(527, licenses) || library.getAuthorization(670, licenses))) {

                    record.submitFields({
                        type: recordObj.type,
                        id: recordObj.id,
                        values: {

                            'custbody_lmry_scheduled_process': false,
                        },
                        options: {
                            disableTriggers: true
                        }
                    });

                }

                if (['create', 'edit', 'copy'].indexOf(type) != -1 && LMRY_Result[0] == 'PE' && library.getAuthorization(500, licenses)) {
                    libraryPECreditCard.createJournalEspejo(recordObj);
                }

                if (type == 'create' || type == 'edit' || type == 'copy') {

                    if (ST_FEATURE == true || ST_FEATURE == "T") {

                        switch (LMRY_Result[0]) {
                            case "MX":
                                if (library.getAuthorization(672, licenses) == true) {
                                    MX_STE_TaxLibrary.setTaxTransaction(context);
                                }
                                break;
                        }

                    } else {

                        switch (LMRY_Result[0]) {
                            case "MX":
                                if (library.getAuthorization(671, licenses) == true) {
                                    if (type == 'create' || type == 'copy') {
                                        MX_TaxLibrary.calculateTaxPurchase(recordObj.id, recordObj.type);
                                    } else {
                                        var JSON_Search = search.create({
                                            type: "customrecord_lmry_ste_json_result",
                                            columns: ["internalid"],
                                            filters: [
                                                ["custrecord_lmry_ste_related_transaction", "IS", recordObj.id]
                                            ]
                                        }).run().getRange(0, 10);

                                        if (JSON_Search != null && JSON_Search.length > 0) {
                                            MX_TaxLibrary.calculateTaxPurchase(recordObj.id, recordObj.type);
                                        }
                                    }

                                }
                                break;
                        }

                    }
                }

            } catch (err) {
                recordObj = context.newRecord;
                library.sendemail2('[ afterSubmit ] ' + err, LMRY_script, recordObj, 'transactionnumber', 'entity');
            }
            return true;

        }

        /* ------------------------------------------------------------------
         * A la variable FeatureID se le asigna el valore que le corresponde
         *  y si tiene activo el enabled feature access.
         * --------------------------------------------------------------- */
        function ValidateAccessVB(ID) {
            var LMRY_access = false;
            var LMRY_countr = new Array();
            var LMRY_Result = new Array();

            try {

                // Inicializa variables Locales y Globales
                LMRY_countr = library.Validate_Country(ID);

                // Verifica que el arreglo este lleno
                if (LMRY_countr.length < 1) {
                    LMRY_Result[0] = '';
                    LMRY_Result[1] = '-None-';
                    LMRY_Result[2] = LMRY_access;
                    return true;
                }

                LMRY_access = library.getCountryOfAccess(LMRY_countr, licenses);

                // Asigna Valores
                LMRY_Result[0] = LMRY_countr[0]; //MX
                LMRY_Result[1] = LMRY_countr[1]; //Mexico
                LMRY_Result[2] = LMRY_access;
                LMRY_Result = activate_fe(LMRY_Result, licenses);
            } catch (err) {
                library.sendemail2('[ ValidateAccessVB ] ' + err, LMRY_script, recordObj, 'transactionnumber', 'entity');
            }

            return LMRY_Result;
        }

        /* ------------------------------------------------------------------
         * Funcion activate_fe para activar features del bill.
         * --------------------------------------------------------------- */
        function activate_fe(fe_countr, licenses) {
            var autfe = false;
            var authorizations_fe = {
                'AR': 260,
                'BO': 261,
                'BR': 262,
                'CL': 263,
                'CO': 264,
                'CR': 265,
                'EC': 266,
                'SV': 267,
                'GT': 268,
                'MX': 269,
                'PA': 270,
                'PY': 271,
                'PE': 272,
                'UY': 273,
                'NI': 408,
                'DO': 401
            };

            if (authorizations_fe[fe_countr[0]]) {
                autfe = library.getAuthorization(authorizations_fe[fe_countr[0]], licenses);
            }

            if (autfe == true) {
                fe_countr.push(true);
            } else {
                fe_countr.push(false);
            }
            return fe_countr;
        }
        function isEditAmounts(newRecord, oldRecord, context) {
            var state = false;
            if (context.type === 'create') {
                log.debug('Estado de la Transaccion1', 'En creacion')
                return true
            }
            if (!newRecord || !oldRecord) {
                log.debug('Estado de la Transaccion2', 'No comparable')
                return true
            };
            if (oldRecord.getValue('approvalstatus') !== newRecord.getValue('approvalstatus')) {
                log.debug('Estado de la Transaccion3', 'Estado de aprobacion modificado');
                return true;
            }
            const nroItemsNew = newRecord.getLineCount({
                sublistId: 'item'
            });
            const nroItemsOld = oldRecord.getLineCount({
                sublistId: 'item'
            });
            if (nroItemsNew !== nroItemsOld) {
                log.debug('Estado de la Transaccion4', 'Modificada');
                return true;
            }

            for (var index = 0; index < nroItemsNew; index++) {
                var newRecordItem = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: index
                });

                var oldRecordItem = oldRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: index
                });

                if (newRecordItem !== oldRecordItem || newRecordItem === null || oldRecordItem === null) state = true;

                var newRecordAmount = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'grossamt',
                    line: index
                });

                var oldRecordAmount = oldRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'grossamt',
                    line: index
                });

                if (newRecordAmount !== oldRecordAmount || newRecordAmount === null || oldRecordAmount === null) state = true;

            }

            const nroExpenseNew = newRecord.getLineCount({
                sublistId: 'expense'
            });

            const nroExpenseOld = oldRecord.getLineCount({
                sublistId: 'expense'
            });

            if (nroExpenseNew !== nroExpenseOld) {
                log.debug('Estado de la Transaccion5', 'Modificada');
                return true;
            }


            for (var index = 0; index < nroExpenseNew; index++) {
                var newRecordAccount = newRecord.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'account',
                    line: index
                });

                var oldRecordAccount = oldRecord.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'account',
                    line: index
                });

                if (newRecordAccount !== oldRecordAccount || newRecordAccount === null || oldRecordAccount === null) state = true;

                var newRecordAmountE = newRecord.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'grossamt',
                    line: index
                });

                var oldRecordAmountE = oldRecord.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'grossamt',
                    line: index
                });

                if (newRecordAmountE !== oldRecordAmountE || newRecordAmountE === null || oldRecordAmountE === null) state = true;

            }
            if (state === false) {
                log.debug('Estado de la Transaccion6', 'Sin modificacion');
            } else {
                log.debug('Estado de la Transaccion7', 'Modificada');
            }
            return state

        }
        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };
    });