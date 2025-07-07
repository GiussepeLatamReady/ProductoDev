/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_CashSaleURET_V2.0.js                        ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 20 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

define(['N/log', 'N/ui/serverWidget', 'N/record', 'N/search', 'N/runtime', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', './Latam_Library/LMRY_HideView3LBRY_V2.0',
    './WTH_Library/LMRY_AutoPercepcionDesc_LBRY_V2.0', './Latam_Library/LMRY_GLImpact_LBRY_V2.0', './Latam_Library/LMRY_ValidateClosePeriod_LBRY_V2.0',
    './Latam_Library/LMRY_UniversalSetting_LBRY', './WTH_Library/LMRY_MX_TAX_Withholding_LBRY_V2.0', './Latam_Library/LMRY_MX_STE_Sales_Tax_Transaction_LBRY_V2.0'],

    function (log, serverWidget, record, search, runtime, libraryMail, library_HideView, Library_AutoPercepcionDesc,
        libraryGLImpact, LibraryValidatePeriod, library_Uni_Setting, libraryTaxWithholding, MX_STE_TaxLibrary) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        var LMRY_script = "LatamReady - Cash Sale URET V2.0";
        var recordObj = '';
        var isUret = true;
        var licenses = [];

        // SuiteTax
        var ST_FEATURE = false;

        function beforeLoad(scriptContext) {

            try {
                recordObj = scriptContext.newRecord;
                var type = scriptContext.type;
                var type_interface = runtime.executionContext;
                var OBJ_FORM = scriptContext.form;
                //log.error('type', type);

                // SuiteTax
                ST_FEATURE = runtime.isFeatureInEffect({ feature: 'tax_overhauling' });

                var LMRY_countr = new Array();
                var country = new Array();
                country[0] = '';
                country[1] = '';

                if (type != 'print' && type != 'email') {
                    try {
                        var subsidiari = recordObj.getValue({
                            fieldId: 'subsidiary'
                        });
                        if (subsidiari == '' || subsidiari == null) {
                            var userS = runtime.getCurrentUser();
                            subsidiari = userS.subsidiary;
                        }
                        if (subsidiari != '' && subsidiari != null) {
                            var filters = new Array();
                            filters[0] = search.createFilter({
                                name: 'internalid',
                                operator: search.Operator.ANYOF,
                                values: [subsidiari]
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
                }

                // Que el evento sea diferente de Print y Email
                if (type != 'print' && type != 'email') {

                    // Valida el Acceso
                    var featuresubs = runtime.isFeatureInEffect({
                        feature: 'SUBSIDIARIES'
                    });
                    var subsidiary = 1;
                    if (featuresubs == true || featuresubs == 'T') {
                        subsidiary = recordObj.getValue({
                            fieldId: 'subsidiary'
                        });
                    }

                    licenses = libraryMail.getLicenses(subsidiary);

                    if (licenses == null || licenses == '') {
                        licenses = [];
                        library_HideView.PxHide(OBJ_FORM, '', recordObj.type);
                        // Cambio realizado el 12/08/2022
                        if (type != 'create') {
                            library_HideView.PxHideSubTab(OBJ_FORM, '', recordObj.type);
                        }
                        library_HideView.PxHideColumn(OBJ_FORM, '', recordObj.type);
                    }

                    var LMRY_Result = Validate_Access_CS(subsidiary, OBJ_FORM, isUret, type);

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

                    /* Validacion 04/02/22 */
                    // Campo - Valida Periodo cerrado
                    var LockedPeriodField = OBJ_FORM.addField({
                        id: 'custpage_lockedperiod',
                        label: 'Locked Period',
                        type: serverWidget.FieldType.CHECKBOX
                    });
                    LockedPeriodField.defaultValue = 'F';
                    LockedPeriodField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                    /* Fin validacion 04/02/22 */

                    hideandViewFields(scriptContext, LMRY_Result[0], LMRY_Result[2]);

                    // Si es nuevo, editado o copiado
                    if (type == 'create' || type == 'edit' || type == 'copy') {

                        if (recordObj.getValue({
                            fieldId: 'custbody_lmry_subsidiary_country'
                        }) == '') {
                            recordObj.getField({
                                fieldId: 'custbody_lmry_subsidiary_country'
                            }).isDisabled = false;
                        }
                    }

                    // Lógica GL Impact
                    if (scriptContext.type == 'view') {
                        var btnGl = libraryGLImpact.featureGLImpact(recordObj, 'cashsale');
                        var featurelang = runtime.getCurrentScript().getParameter({
                            name: 'LANGUAGE'
                        });
                        featurelang = featurelang.substring(0, 2);

                        if (btnGl == 1) {
                            if (featurelang == 'es') {
                                OBJ_FORM.addButton({
                                    id: 'custpage_id_button_imp',
                                    label: 'IMPRIMIR GL',
                                    functionName: 'onclick_event_gl_impact()'
                                });
                            } else {
                                OBJ_FORM.addButton({
                                    id: 'custpage_id_button_imp',
                                    label: 'PRINT GL',
                                    functionName: 'onclick_event_gl_impact()'
                                });
                            }
                            OBJ_FORM.clientScriptModulePath = './Latam_Library/LMRY_GLImpact_CLNT_V2.0.js';
                        }
                    }

                }

              if (scriptContext.type == "copy") {
                var featuresubs = runtime.isFeatureInEffect({
                    feature: 'SUBSIDIARIES'
                  });
                var subsidiary = 1;
                if (featuresubs == true || featuresubs == 'T') {
                    subsidiary = recordObj.getValue({
                      fieldId: 'subsidiary'
                    });
                }
                licenses = libraryMail.getLicenses(subsidiary);
                var LMRY_Result = Validate_Access_CS(subsidiary, OBJ_FORM, isUret, type);
                if (LMRY_Result[0] == "MX" && libraryMail.getAuthorization(672, licenses) == true) {
                  libraryTaxWithholding.resetLines(recordObj);
                }
              }
              if (LMRY_Result[0] == 'AR') {
                if (type_interface == 'USERINTERFACE') {
                    Library_AutoPercepcionDesc.disabledSalesDiscount(OBJ_FORM,subsidiary);
                }
              }

            } catch (err) {
                libraryMail.sendemail2(' [ BeforeLoad ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
            }
        }

        function beforeSubmit(scriptContext) {

            try {
                recordObj = scriptContext.newRecord;
                var type = scriptContext.type;
                var type_interface = runtime.executionContext;
                var LMRY_Intern = recordObj.id;
                var LMRY_Result;
                var subsidiary = recordObj.getValue({
                    fieldId: 'subsidiary'
                });
                // SuiteTax
                ST_FEATURE = runtime.isFeatureInEffect({ feature: 'tax_overhauling' });
                licenses = libraryMail.getLicenses(subsidiary);

                var featuresubs = runtime.isFeatureInEffect({
                    feature: 'SUBSIDIARIES'
                });
                if (featuresubs == true || featuresubs == 'T') {
                    LMRY_Result = Validate_Access_CS(subsidiary, scriptContext.form, isUret, type);
                } else {
                    LMRY_Result = Validate_Access_CS(1, scriptContext.form, isUret, type);
                }

                /* Validacion 04/02/22 */
                // Libreria - Valida Periodo cerrado
                if (LibraryValidatePeriod.validatePeriod(recordObj.getValue('postingperiod'), licenses, LMRY_Result[0], 'sales')) return true;
                /* Fin validacion 04/02/22 */

                /*************************************
                 * Auto Percepcions para Argentina,
                 * Brasil y Paraguay
                 *************************************/

                var swAutoPe = false;
                if (LMRY_Result[0] == 'AR') {
                    swAutoPe = libraryMail.getAuthorization(142, licenses);
                }
                if (LMRY_Result[0] == 'BR') {
                    swAutoPe = libraryMail.getAuthorization(143, licenses);
                }
                if (LMRY_Result[0] == 'BO') {
                    swAutoPe = libraryMail.getAuthorization(230, licenses);
                }
                if (LMRY_Result[0] == 'PE') {
                    swAutoPe = libraryMail.getAuthorization(231, licenses);
                }
                if (LMRY_Result[0] == 'CL') {
                    swAutoPe = libraryMail.getAuthorization(232, licenses);
                }
                if (LMRY_Result[0] == 'CO') {
                    swAutoPe = libraryMail.getAuthorization(233, licenses);
                }
                if (LMRY_Result[0] == 'CR') {
                    swAutoPe = libraryMail.getAuthorization(234, licenses);
                }
                if (LMRY_Result[0] == 'EC') {
                    swAutoPe = libraryMail.getAuthorization(235, licenses);
                }
                if (LMRY_Result[0] == 'SV') {
                    swAutoPe = libraryMail.getAuthorization(236, licenses);
                }
                if (LMRY_Result[0] == 'GT') {
                    swAutoPe = libraryMail.getAuthorization(237, licenses);
                }
                if (LMRY_Result[0] == 'MX') {
                    swAutoPe = libraryMail.getAuthorization(238, licenses);
                }
                if (LMRY_Result[0] == 'PA') {
                    swAutoPe = libraryMail.getAuthorization(239, licenses);
                }
                if (LMRY_Result[0] == 'PY') {
                    swAutoPe = libraryMail.getAuthorization(240, licenses);
                }
                if (LMRY_Result[0] == 'UY') {
                    swAutoPe = libraryMail.getAuthorization(241, licenses);
                }

                if (ST_FEATURE == true || ST_FEATURE == "T") {
                    if (type == "delete") {
                        switch (LMRY_Result[0]) {
                            case "MX":
                                if (libraryMail.getAuthorization(672, licenses) == true) {
                                    MX_STE_TaxLibrary.deleteTaxResult(LMRY_Intern);
                                }
                                break;
                        }
                    }
                }else{
                  if (type == "delete" && LMRY_Result[0] == "MX" && libraryMail.getAuthorization(672, licenses) == true) {
                    var id_delete = recordObj.id;
                    log.debug("id_delete", id_delete);
                    libraryTaxWithholding._inactiveRelatedRecord(id_delete);
                  }
                }
                // Si hay acceso Procesa
                // if (swAutoPe) {
                //     // Realiza la redireccion de cuentas
                //     Library_AutoPercepcionDesc.autoperc_beforeSubmit(scriptContext, LMRY_Result[0], scriptContext.type);
                // }
                /* Inicio Universal Setting 10/03/2022 */
                if (type == 'create' && (type_interface == 'USERINTERFACE' || type_interface == 'USEREVENT' || type_interface == 'CSVIMPORT') && (ST_FEATURE == false || ST_FEATURE == "F")) {

                    var type_document = recordObj.getValue('custbody_lmry_document_type');

                    if (library_Uni_Setting.auto_universal_setting(licenses, false)) {
                        //Solo si el campo LATAM - LEGAL DOCUMENT TYPE se encuentra vacío
                        if (type_document == '' || type_document == null) {
                            library_Uni_Setting.automatic_setfield(recordObj, false);
                            library_Uni_Setting.set_preimpreso(recordObj, LMRY_Result, licenses);
                            library_Uni_Setting.set_template(recordObj, licenses);
                        }
                        //Seteo de campos perteneciente a record anexado
                        library_Uni_Setting.set_inv_identifier(recordObj);
                    }
                }
                if (type == 'edit') {
                    if (library_Uni_Setting.auto_universal_setting(licenses, false)) {
                        //Seteo de campos perteneciente a record anexado
                        library_Uni_Setting.set_inv_identifier(recordObj);
                    }
                }
                /* Fin Universal Setting 10/03/2022 */
            } catch (err) {
                log.error("[ beforeSubmit ]", err);
                libraryMail.sendemail2('[ beforeSubmit ] ' + err, LMRY_script, recordObj, 'transactionnumber', 'entity');
            }


        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {

            try {

                recordObj = scriptContext.newRecord;
                var type = scriptContext.type;
                var LMRY_Intern = recordObj.id;
                var LMRY_Result;
                // SuiteTax
                ST_FEATURE = runtime.isFeatureInEffect({
                    feature: 'tax_overhauling'
                });
                // Tipo de Contexto en el que se ejecuta, puedemn ser: USEREVENT, MAPREDUCE, USERINTERFACE, etc
                var type_interface = runtime.executionContext;

                var subsidiary = recordObj.getValue({
                    fieldId: 'subsidiary'
                });

                licenses = libraryMail.getLicenses(subsidiary);

                var featuresubs = runtime.isFeatureInEffect({
                    feature: 'SUBSIDIARIES'
                });
                if (featuresubs == true || featuresubs == 'T') {

                    LMRY_Result = Validate_Access_CS(subsidiary, scriptContext.form, isUret, type);
                } else {
                    LMRY_Result = Validate_Access_CS(1, scriptContext.form, isUret, type);
                }

                /* Validacion 04/02/22 */
                // Libreria - Valida Periodo cerrado
                if (LibraryValidatePeriod.validatePeriod(recordObj.getValue('postingperiod'), licenses, LMRY_Result[0], 'sales')) return true;
                /* Fin validacion 04/02/22 */

                /* Inicio Universal Setting 10/03/2022 */
                //Universal Setting se realiza solo al momento de crear
                if (type == 'create' && (type_interface == 'USERINTERFACE' || type_interface == 'USEREVENT' || type_interface == 'CSVIMPORT') && (ST_FEATURE == false || ST_FEATURE == "F")) {
                    if (library_Uni_Setting.auto_universal_setting(licenses, false)) {
                        library_Uni_Setting.automatic_setfieldrecord(recordObj);
                    }
                }
                /* Fin Universal Setting 10/03/2022 */

                //EC TRANSACTION FIELDS
                if ((type == 'create' || type == 'edit') && LMRY_Result[0] == 'EC' && (libraryMail.getAuthorization(630, licenses) || libraryMail.getAuthorization(639, licenses))) {
                    ECsetAmounts(LMRY_Intern);
                }
                // LatamTax - SuiteTax
                if (["create", "edit", "copy"].indexOf(scriptContext.type) != -1) {
                    if (ST_FEATURE == true || ST_FEATURE == "T") {

                        switch (LMRY_Result[0]) {
                            case "MX":
                                if (libraryMail.getAuthorization(672, licenses) == true) {
                                    MX_STE_TaxLibrary.setTaxTransaction(scriptContext);
                                }
                                break;
                        }

                    } else {
                        var currentRCD = record.load({
                            type: "cashsale",
                            id: recordObj.id,
                            isDynamic: true
                        })
                        var actionType = scriptContext.type;

                        if (["create", "edit"].indexOf(actionType) != -1) {
                            switch (LMRY_Result[0]) {
                                case "MX":
                                    var Crear_TaxResult = libraryMail.getAuthorization(969, licenses) || false;
                                    var Global_Disc = libraryMail.getAuthorization(898, licenses) || false;
                                    if (libraryMail.getAuthorization(672, licenses) == true) {
                                      if (["create", "edit"].indexOf(actionType) != -1) {
                                        libraryTaxWithholding.LatamTaxWithHoldingMX(currentRCD, Crear_TaxResult, actionType, Global_Disc);
                                      }
                                      
                                    }
                                    break;
                            }
                        }
                    }
                }
                if (LMRY_Result[0] == 'AR' && (type == 'create' || type == 'edit' || type == 'copy')) {
                    Library_AutoPercepcionDesc.processDiscount(scriptContext);
                    var swAutoPe = false;
                    if (LMRY_Result[0] == 'AR') {
                        swAutoPe = libraryMail.getAuthorization(142, licenses);
                    }
                    // Si hay acceso Procesa
                    if (ST_FEATURE == false || ST_FEATURE == "F") {
                        if (swAutoPe) {
                            // Realiza el seteo de percepciones
                            Library_AutoPercepcionDesc.processPerception(scriptContext, LMRY_Result[0], scriptContext.type);
                        }
                    }
                }

            } catch (err) {
                libraryMail.sendemail2(' [ AfterSubmit ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');

            }
        }

        /* ------------------------------------------------------------------------------------------------------
         * A la variable featureId se le asigna el valore que le corresponde
         * --------------------------------------------------------------------------------------------------- */
        function Validate_Access_CS(ID, CR, isUret, type) {

            var LMRY_access = false;
            var LMRY_countr = new Array();
            var LMRY_Result = new Array();

            try {
                // Inicializa variables Locales y Globales
                LMRY_countr = libraryMail.Validate_Country(ID);

                // Verifica que el arreglo este lleno
                if (LMRY_countr.length < 1) {
                    LMRY_Result[0] = '';
                    LMRY_Result[1] = '-None-';
                    LMRY_Result[2] = LMRY_access;
                    return LMRY_Result;
                }
                LMRY_access = libraryMail.getCountryOfAccess(LMRY_countr, licenses);

                // Asigna Valores
                LMRY_Result[0] = LMRY_countr[0];
                LMRY_Result[1] = LMRY_countr[1];
                LMRY_Result[2] = LMRY_access;
            } catch (err) {
                libraryMail.sendemail2(' [ Validate_Access_CS ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
            }

            //log.error('LMRY_Result', LMRY_Result);
            return LMRY_Result;
        }

        function hideandViewFields(context, country, hasAccess) {
            try {
                var type = context.type;
                var recordObj = context.newRecord;
                var form = context.form;
                var typeTrans = recordObj.type;

                if (form) {
                    var types = ['create', 'edit', 'copy', 'view'];

                    if (types.indexOf(type) != -1) {
                        var pcountry = (hasAccess) ? country : '';
                        var parameters = [2, 5, 3];
                        var functions = ['PxHide', 'PxHideSubTab', 'PxHideColumn'];

                        for (var i = 0; i < parameters.length; i++) {
                            var isActive = libraryMail.getHideView([country], parameters[i], licenses);

                            if (isActive || isActive == 'T') {
                                library_HideView[functions[i]](form, pcountry, typeTrans);
                            }
                        }
                    }
                }
            } catch (err) {
                throw ' [ hideandViewFields ] ' + err
            }
        }

        function ECsetAmounts(RecordID) {

            var recordObj = record.load({ type: 'cashsale', id: RecordID });

            var jsonAmounts = { 'gross': { 'field': 'custrecord_lmry_ec_gross_amount', 'amount': 0 }, 'tax': { 'field': 'custrecord_lmry_ec_tax_amount', 'amount': 0 }, 'net': { 'field': 'custrecord_lmry_ec_net_amount', 'amount': 0 } };
            var jsonLineAMounts = {};

            var cItems = recordObj.getLineCount({ sublistId: 'item' });

            if (cItems > 0) {
                for (var i = 0; i < cItems; i++) {
                    var netAmount = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
                    var grossAmount = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i });
                    var taxAmount = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i });

                    jsonAmounts['gross']['amount'] += parseFloat(grossAmount);
                    jsonAmounts['net']['amount'] += parseFloat(netAmount);
                    jsonAmounts['tax']['amount'] += parseFloat(taxAmount);

                    var applyWHT = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_apply_wht_tax', line: i });
                    var catalog = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_ec_concept_ret', line: i });
                    var lineUniqueKey = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'lineuniquekey', line: i });
                    var taxLine = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxline', line: i });
                    var itemType = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                    var item = recordObj.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    var itemText = recordObj.getSublistText({ sublistId: 'item', fieldId: 'item', line: i });

                    jsonLineAMounts[i] = { 'gross': grossAmount, 'tax': taxAmount, 'net': netAmount, 'applywht': applyWHT, 'catalog': catalog, 'lineuniquekey': lineUniqueKey, 'taxline': taxLine, 'itemtype': itemType, 'item': item, 'itemtext': itemText };

                }
            }

            var searchEC = search.create({ type: 'customrecord_lmry_ec_transaction_fields', filters: [{ name: 'custrecord_lmry_ec_related_transaction', operator: 'is', values: RecordID }, { name: 'isinactive', operator: 'is', values: 'F' }] });
            searchEC = searchEC.run().getRange(0, 1);

            if (searchEC && searchEC.length) {
                var ecTransaction = record.load({ type: 'customrecord_lmry_ec_transaction_fields', id: searchEC[0].id });
            } else {
                var ecTransaction = record.create({ type: 'customrecord_lmry_ec_transaction_fields' });
            }

            ecTransaction.setValue('custrecord_lmry_ec_related_transaction', RecordID);
            ecTransaction.setValue('custrecord_lmry_ec_lines_amount', JSON.stringify(jsonLineAMounts));

            for (var i in jsonAmounts) {
                ecTransaction.setValue(jsonAmounts[i]['field'], jsonAmounts[i]['amount']);
            }

            var idEcTransaction = ecTransaction.save({ disableTriggers: true, ignoreMandatoryFields: true });

        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });