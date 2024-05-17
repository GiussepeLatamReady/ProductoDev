/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_New_Country_WHT_Lines_LBRY.js               ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Sep 27 2021  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define(['N/redirect', 'N/task', 'N/search', 'N/runtime', 'N/record', 'N/log', 'N/url', 'N/format', 'N/config', '../Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', '../Latam_Library/LMRY_CO_Duplicate_Credit_Memos_LBRY_V2.0'],

    function (redirect, task, search, runtime, record, log, url, format, config, libraryMail, libraryDuplicate) {

        var LMRY_script = 'LatamReady - New Country WHT Lines LBRY';

        var subsiOW = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
        var featureMB = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });

        // Variables de Preferencias Generales
        var prefDep = runtime.getCurrentUser().getPreference({ name: "DEPTMANDATORY" });
        var prefLoc = runtime.getCurrentUser().getPreference({ name: "LOCMANDATORY" });
        var prefClas = runtime.getCurrentUser().getPreference({ name: "CLASSMANDATORY" });

        //Activacion de enable features
        var deparEnable = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
        var locatEnable = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
        var classEnable = runtime.isFeatureInEffect({ feature: "CLASSES" });

        //Variables Globales
        var arrayDelete = [];
        var filtroTransactionType = 0;
        var currencySetup = '';
        var arrayRetencion = [];
        var FEAT_EXCLUYENTE = false;
        var listApply = [];

        //Constantes
        var jsonTransform = { invoice: 'creditmemo', creditmemo: 'invoice', vendorbill: 'vendorcredit', vendorcredit: 'vendorbill' };
        var jsonApply = { invoice: 'creditmemo', creditmemo: 'creditmemo', vendorbill: 'vendorcredit', vendorcredit: 'vendorcredit' };
        var codeCountry = { 11: 'AR', 29: 'BO', 30: 'BR', 45: 'CL', 48: 'CO', 49: 'CR', 63: 'EC', 208: 'SV', 91: 'GT', 157: 'MX', 173: 'PA', 186: 'PY', 174: 'PE', 231: 'UY' };

        /**************************************************************************
         * Funcion que dibuja y valida el buton CO - WHT Lines que dispara un Map
         Reduce para Invoice y Bill
         *************************************************************************/
        function beforeLoad(recordObj, OBJ_FORM, scriptContext, typeEntity) {

            var flagEntity = searchEntity(recordObj.getValue('entity'), typeEntity);

            if (flagEntity) {

                var featurelang = runtime.getCurrentScript().getParameter({ name: 'LANGUAGE' });
                featurelang = featurelang.substring(0, 2);

                if (featurelang == 'es') {
                    OBJ_FORM.addButton({ id: 'custpage_id_button_co_wht_lines', label: 'CO - RET LÍNEAS', functionName: 'onclick_event_co_wht_lines()' });
                } else {
                    OBJ_FORM.addButton({ id: 'custpage_id_button_co_wht_lines', label: 'CO - WHT LINES', functionName: 'onclick_event_co_wht_lines()' });
                }

                if (typeEntity == 'customer') {
                    OBJ_FORM.clientScriptModulePath = '../LMRY_InvoiceCLNT_V2.0.js';
                } else {
                    OBJ_FORM.clientScriptModulePath = '../LMRY_VendorBillCLNT_V2.0.js';
                }

                //Existe el parametro, lanza el mprd
                if (scriptContext.request.parameters.cowht) {

                    var searchDeploy = search.create({
                        type: 'scheduledscriptinstance',
                        filters: [["scriptdeployment.scriptid", "is", "customdeploy_lmry_co_wht_lines_mprd"], "AND", ["status", "anyof", "PENDING", "PROCESSING"]]
                    });

                    searchDeploy = searchDeploy.run().getRange({ start: 0, end: 1 });

                    if (!searchDeploy || !searchDeploy.length) {

                        var coMprd = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_lmry_co_wht_lines_mprd',
                            deploymentId: 'customdeploy_lmry_co_wht_lines_mprd'
                        });

                        coMprd.submit();

                        //Redirect
                        redirect.toRecord({ type: recordObj.type, id: scriptContext.request.parameters.cowht });

                    }

                }


            }

        }

        function searchEntity(idEntity, typeEntity) {

            var entityCO = search.lookupFields({ type: typeEntity, id: idEntity, columns: ['custentity_lmry_es_agente_retencion'] });
            entityCO = entityCO.custentity_lmry_es_agente_retencion;

            if (!entityCO.length) {
                return false;
            }

            entityCO = entityCO[0].value;

            if (entityCO == '1') {
                return true;
            } else {
                return false;
            }

        }

        /**************************************************************************
         * Funcion que elimina los Journal y Registros del récord "LatamReady - Tax
         * Results" en caso se elimine la transacción
         * Llamada desde el User Event del Invoice, Credit Memo, Bill y Bill Credit
         *************************************************************************/

        function beforeSubmitTransaction(scriptContext, licenses) {
            try {

                if (scriptContext.type != 'delete') {
                    return;
                }

                var recordOld = scriptContext.oldRecord;
                var recordId = recordOld.id;
                var transactionType = recordOld.type;

                var country = recordOld.getValue({ fieldId: 'custbody_lmry_subsidiary_country' });
                var flagPais = validarPais(country, licenses);

                if (!flagPais) {
                    return;
                }

                getAllIdDelete(recordId, transactionType);

                var loadDelete = record.load({ type: transactionType, id: recordId });

                for (var i = 0; i < arrayDelete.length; i++) {

                    if (arrayDelete['type'] == 'onlydelete') {
                        deleteAll(arrayDelete[i]);
                    } else {
                        deleteAll(arrayDelete[i], loadDelete);
                    }

                }

            } catch (err) {
                libraryMail.sendemail('[ Before Submit ] ' + err, LMRY_script);
            }

        }

        function getAllIdDelete(recordId, typeTransaction) {

            //Busqueda Tax Results
            var searchSumary = search.create({ type: 'customrecord_lmry_br_transaction', filters: [{ name: 'custrecord_lmry_br_transaction', operator: 'anyof', values: recordId }], columns: ['internalid'] });
            var resultSearch = searchSumary.run().getRange({ start: 0, end: 1000 });

            if (resultSearch && resultSearch.length) {
                for (var i = 0; i < resultSearch.length; i++) {
                    var id = resultSearch[i].id;
                    arrayDelete.push({ record: 'customrecord_lmry_br_transaction', id: id, type: 'onlydelete' });
                }
            }

            //Busqueda JSON Results
            var searchJSON = search.create({ type: 'customrecord_lmry_ste_json_result', filters: [{ name: 'custrecord_lmry_ste_related_transaction', operator: 'anyof', values: recordId }], columns: ['internalid'] });
            var resultJSON = searchJSON.run().getRange({ start: 0, end: 1000 });

            if (resultJSON && resultJSON.length) {
                for (var i = 0; i < resultJSON.length; i++) {
                    var id = resultJSON[i].id;
                    arrayDelete.push({ record: 'customrecord_lmry_ste_json_result', id: id, type: 'onlydelete' });
                }
            }

            //Busqueda Transacciones Relacionadas
            var filterTranRelated = [];
            filterTranRelated[0] = search.createFilter({ name: 'custbody_lmry_reference_transaction', operator: search.Operator.IS, values: recordId });
            filterTranRelated[1] = search.createFilter({ name: 'mainline', operator: search.Operator.IS, values: 'T' });

            var searchTran = search.create({ type: jsonTransform[typeTransaction], filters: filterTranRelated, columns: ['internalid'] });
            searchTran = searchTran.run().getRange({ start: 0, end: 1000 });

            if (searchTran && searchTran.length) {
                for (var i = 0; i < searchTran.length; i++) {
                    arrayDelete.push({ record: jsonTransform[typeTransaction], id: searchTran[i].getValue('internalid'), type: 'applydelete' });
                }
            }

            //Busqueda de Journal
            var filtros = new Array();
            filtros[0] = search.createFilter({ name: 'mainline', operator: search.Operator.IS, values: ['T'] });
            filtros[1] = search.createFilter({ name: 'formulatext', formula: '{custbody_lmry_reference_transaction_id}', operator: search.Operator.IS, values: [recordId] });

            var searchJournal = search.create({ type: 'journalentry', filters: filtros, columns: ['internalid'] });
            var resultSJ = searchJournal.run().getRange({ start: 0, end: 1000 });

            var auxId = 0;

            if (resultSJ && resultSJ.length) {
                for (var i = 0; i < resultSJ.length; i++) {
                    var id = resultSJ[i].getValue({ name: 'internalid' });

                    //Journal aun con mainline devuelven mas de 1 linea
                    if (auxId != id) {
                        arrayDelete.push({ record: 'journalentry', id: id, type: 'onlydelete' });
                        auxId = id;
                    }

                }
            }

            return arrayDelete;

        }


        function deleteAll(jsonDelete, recordOrigen) {

            var type = jsonDelete['type'];

            if (type == 'delete') {
                record.delete({ type: jsonDelete['record'], id: jsonDelete['id'] });
            } else {
                //DESAPPLY
                if (jsonDelete['record'] == 'vendorbill' || jsonDelete['record'] == 'invoice') {

                    var recordOrigen = recordOrigen.load({ type: recordOrigen.getValue('baserecordtype'), id: recordOrigen.id });

                    var lineas = recordOrigen.getLineCount('apply');

                    for (var j = 0; j < lineas; i++) {
                        var idtran = recordOrigen.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: i });
                        if (jsonDelete['id'].indexOf(parseInt(idtran)) > -1) {
                            recordOrigen.setSublistValue({ sublistId: 'apply', fieldId: 'apply', line: j, value: false });
                        }
                    }

                    recordOrigen.save({ disableTriggers: true, ignoreMandatoryFields: true });

                }

                record.delete({ type: jsonDelete['record'], id: jsonDelete['id'] });

            }

        }

        function newAfterSubmitTransaction(scriptContext, mode, recordId, transactionType, licenses, flagMprd) {

            var recordOrigen = record.load({ type: transactionType, id: recordId });

            var country = recordOrigen.getValue({ fieldId: 'custbody_lmry_subsidiary_country' });
            var subsidiary = recordOrigen.getValue({ fieldId: 'subsidiary' });

            var flagPais = validarPais(country, licenses);

            if (flagPais == false) {
                return true;
            }

            var ORCD = scriptContext.oldRecord;
            var approvalFeature = '';

            switch (transactionType) {
                case 'invoice':
                    filtroTransactionType = 1;
                    approvalFeature = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALCUSTINVC' });
                    break;
                case 'creditmemo':
                    filtroTransactionType = 8;
                    approvalFeature = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALCUSTINVC' });
                    break;
                case 'vendorbill':
                    filtroTransactionType = 4;
                    approvalFeature = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALVENDORBILL' });
                    break;
                case 'vendorcredit':
                    filtroTransactionType = 7;
                    approvalFeature = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALVENDORBILL' });
                    break;
                default:
                    break;
            }

            var aprobado = recordOrigen.getValue({ fieldId: 'approvalstatus' });

            if (approvalFeature == 'T' || approvalFeature == true || approvalFeature == 't') {
                if (aprobado != null && aprobado != '' && aprobado != 2) {
                    return true;
                }
            }

            if (mode == 'edit' && libraryMail.getAuthorization(666, licenses) && libraryDuplicate.Validate_EIDocument(recordOrigen) && 
                libraryDuplicate.validateChangeAmounts(scriptContext) && libraryDuplicate.validateWhtSelectedChanges(scriptContext)) {
                return true;
            }

            //ELIMINAR PREVIO
            if (mode == 'edit') {
                getAllIdDelete(recordId, transactionType);

                if (flagMprd) {
                    return arrayDelete;
                }

                for (var i = 0; i < arrayDelete.length; i++) {

                    if (arrayDelete['type'] == 'delete') {
                        deleteAll(arrayDelete[i]);
                    } else {
                        deleteAll(arrayDelete[i], recordOrigen);
                    }

                }

            }

            var recordOrigen = record.load({ type: transactionType, id: recordId });

            //CREATE JSON RETENCION
            getWHT(recordOrigen, mode, recordId, transactionType, licenses);

            var flagJSONTR = libraryMail.getAuthorization(968, licenses);

            if (flagJSONTR) {
                for (var i = 0; i < arrayRetencion.length; i++) {
                    createTaxResult(arrayRetencion[i], recordOrigen);
                }
            } else {
                createJSONResult(arrayRetencion, recordOrigen);
            }

            var dataTransaction = getDataTransaction(arrayRetencion, recordOrigen, licenses);
            var groupFeature = dataTransaction.feature;
            var groupData = dataTransaction.retenciones;

            var forms = getForms(subsidiary);
            //SE PUEDE MEJORAR ESTE IF/ELSE
            if (groupFeature) {
                for (var i in groupData) {
                    for (var j in groupData[i]) {

                        if (i == '1') {
                            createJournal(groupData[i][j], transactionType, recordOrigen, '', licenses, forms);
                        } else {
                            createTransaction(groupData[i][j], transactionType, recordOrigen, '', licenses, forms);
                        }

                    }
                }
            } else {
                for (var i = 0; i < groupData.length; i++) {

                    var genera = groupData[i].genera;

                    if (genera == '1') {
                        createJournal([groupData[i]], transactionType, recordOrigen, '', licenses, forms);
                    } else {
                        createTransaction([groupData[i]], transactionType, recordOrigen, '', licenses, forms);
                    }

                }
            }

            //CAMPOS DE CABECERA
            setDataBody(arrayRetencion, recordOrigen, transactionType);

        }

        function setDataBody(taxResult, recordObj, transactionType) {

            var country = recordObj.getValue('custbody_lmry_subsidiary_country');
            country = codeCountry[country];

            var jsonSubtype = {};
            var jsonValues = {};

            for (var i = 0; i < taxResult.length; i++) {
                var subtypeTr = taxResult[i].subtypeId;
                var retencionTr = taxResult[i].retencionLocal;
                //var exchangeRateCO = taxResult[i].exchangerate;

                if (!jsonSubtype[subtypeTr]) {
                    jsonSubtype[subtypeTr] = 0;
                }

                //retencionTr = parseFloat(retencionTr) * parseFloat(exchangeRateCO);
                retencionTr = Math.round(parseFloat(retencionTr) * 100) / 100;

                jsonSubtype[subtypeTr] += parseFloat(retencionTr);

            }

            log.debug('jsonSubtype', jsonSubtype);

            var jsonIdSubtypes = {
                BO: [{ subtype: 29, custbody: 'custbody_lmry_bo_autoreteit_whtamount' }, { subtype: 30, custbody: 'custbody_lmry_bo_reteiue_whtamount' }],
                CO: [{ subtype: 18, custbody: 'custbody_lmry_co_reteiva_amount' }, { subtype: 19, custbody: 'custbody_lmry_co_reteica_amount' }, { subtype: 20, custbody: 'custbody_lmry_co_retecree_amount' }, { subtype: 21, custbody: 'custbody_lmry_co_retefte_amount' }],
                EC: [{ subtype: 27, custbody: 'custbody_lmry_ec_reteir_amount' }, { subtype: 28, custbody: 'custbody_lmry_ec_reteiva_amount' }],
                PY: [{ subtype: 37, custbody: 'custbody_lmry_py_autoreteir_amount' }, { subtype: 38, custbody: 'custbody_lmry_py_reteiva_amount' }]
            }

            if (jsonIdSubtypes[country]) {
                for (var i = 0; i < jsonIdSubtypes[country].length; i++) {
                    var idCustbody = jsonIdSubtypes[country][i]['custbody'];
                    var idSubtype = jsonIdSubtypes[country][i]['subtype'];

                    if (jsonSubtype[idSubtype]) {
                        jsonValues[idCustbody] = jsonSubtype[idSubtype];
                    }

                }
            }

            log.debug('jsonValues', jsonValues);

            if (Object.keys(jsonValues).length) {

                /*var submitRecord = record.load({type: transactionType, id: recordObj.id});
        
                for(var i in jsonValues){
                  submitRecord.setValue(i, jsonValues[i]);
                }
        
                submitRecord.save({disableTriggers: true, ignoreMandatoryFields: true});*/

                record.submitFields({ type: transactionType, id: recordObj.id, values: jsonValues, options: { ignoreMandatoryFields: true, disableTriggers: true } });
            }

            //log.debug('post submit');

        }

        function createJournal(aRetencion, transactionType, recordObj, memoText, licenses, forms) {

            var formulario = forms["journal"] || runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_wht_journal_entry' });
            var journalApprovalFeat = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALJOURNAL' });
            var memo = 'Latam - Country WHT (Lines) - ';
            if (memoText != null && memoText != '') {
                memo = memoText;
            }

            var recordJE = record.create({ type: 'journalentry', isDynamic: false });

            if (formulario) {
                recordJE.setValue('customform', formulario);
            }

            if (subsiOW) {
                recordJE.setValue('subsidiary', recordObj.getValue('subsidiary'));
            }

            recordJE.setValue('bookje', false);
            recordJE.setValue('trandate', recordObj.getValue('trandate'));
            if (!libraryMail.getAuthorization(1022, licenses)) {
                recordJE.setValue('postingperiod', recordObj.getValue('postingperiod'));
            }
            recordJE.setValue('exchangerate', recordObj.getValue('exchangerate'));
            recordJE.setValue('currency', recordObj.getValue('currency'));
            recordJE.setValue('memo', memo + aRetencion[0].subtype);

            recordJE.setValue('custbody_lmry_reference_transaction', recordObj.id);
            recordJE.setValue('custbody_lmry_reference_transaction_id', recordObj.id);
            recordJE.setValue('custbody_lmry_reference_entity', recordObj.getValue('entity'));

            if (journalApprovalFeat && recordJE.getField({ fieldId: "approvalstatus" })) {
                recordJE.setValue('approvalstatus', 2);
            }

            if (deparEnable && aRetencion[0].departmentLine) {
                recordJE.setValue('department', aRetencion[0].departmentLine);
            }

            if (classEnable && aRetencion[0].classLine) {
                recordJE.setValue('class', aRetencion[0].classLine);
            }

            if (locatEnable && aRetencion[0].locationLine) {
                recordJE.setValue('location', aRetencion[0].locationLine);
            }

            //Por cada retencion se crean 2 lineas: debit y credit
            for (var k = 0; k < aRetencion.length; k++) {

                if (transactionType == 'invoice' || transactionType == 'vendorbill') {
                    recordJE.setSublistValue('line', 'account', k * 2, aRetencion[k].account1);
                    recordJE.setSublistValue('line', 'account', k * 2 + 1, aRetencion[k].account2);
                } else {
                    recordJE.setSublistValue('line', 'account', k * 2, aRetencion[k].account2);
                    recordJE.setSublistValue('line', 'account', k * 2 + 1, aRetencion[k].account1);
                }

                recordJE.setSublistValue('line', 'debit', k * 2, parseFloat(aRetencion[k].retencion));
                recordJE.setSublistValue('line', 'credit', k * 2 + 1, parseFloat(aRetencion[k].retencion));

                recordJE.setSublistValue('line', 'entity', k * 2, recordObj.getValue('entity'));
                recordJE.setSublistValue('line', 'entity', k * 2 + 1, recordObj.getValue('entity'));
                /**
                 * Modificacion del formato del memo 22/07/2022
                 */
                // recordJE.setSublistValue('line', 'memo', k * 2, aRetencion[k].description);
                // recordJE.setSublistValue('line', 'memo', k * 2 + 1, aRetencion[k].description);
                recordJE.setSublistValue('line', 'memo', k * 2, memo + aRetencion[k].code + " - " + aRetencion[k].lineuniquekey);
                recordJE.setSublistValue('line', 'memo', k * 2 + 1, memo + aRetencion[k].code + " - " + aRetencion[k].lineuniquekey);

                if (aRetencion[k].departmentLine) {
                    recordJE.setSublistValue('line', 'department', k * 2, aRetencion[k].departmentLine);
                    recordJE.setSublistValue('line', 'department', k * 2 + 1, aRetencion[k].departmentLine);
                }

                if (aRetencion[k].classLine) {
                    recordJE.setSublistValue('line', 'class', k * 2, aRetencion[k].classLine);
                    recordJE.setSublistValue('line', 'class', k * 2 + 1, aRetencion[k].classLine);
                }

                if (aRetencion[k].locationLine) {
                    recordJE.setSublistValue('line', 'location', k * 2, aRetencion[k].locationLine);
                    recordJE.setSublistValue('line', 'location', k * 2 + 1, aRetencion[k].locationLine);
                }

            }

            var idJournal = recordJE.save({ disableTriggers: true, ignoreMandatoryFields: true });
            /*record.submitFields({
                type: "journalentry",
                id: idJournal,
                values: {
                    "memo": memo + aRetencion[0].subtype
                },
                options: {
                    ignoreMandatoryFields: true,
                    disableTriggers: true,
                    enableSourcing: true
                }
            });
            log.debug('idJournal', idJournal);*/

            return idJournal;

        }

        function createTransaction(aRetencion, transactionType, recordObj, memoText, licenses, forms) {

            var formulario = '';
            var memo = 'Latam - Country WHT (Lines) - ';
            if (memoText != null && memoText != '') {
                memo = memoText;
            }

            if (transactionType == "invoice") {
                formulario = forms["creditmemo"] || runtime.getCurrentScript().getParameter({ name: "custscript_lmry_wht_credit_memo" });
            }
            if (transactionType == "creditmemo") {
                formulario = forms["invoice"] || runtime.getCurrentScript().getParameter({ name: "custscript_lmry_wht_invoice" });
            }
            if (transactionType == "vendorbill") {
                formulario = forms["billcredit"] || runtime.getCurrentScript().getParameter({ name: "custscript_lmry_wht_vendor_credit" });
            }
            if (transactionType == "vendorcredit") {
                formulario = forms["bill"] || runtime.getCurrentScript().getParameter({ name: "custscript_lmry_wht_vendor_bill" });
            }

            var newrecordObj = record.create({ type: jsonTransform[transactionType], isDynamic: false });

            if (formulario) {
                newrecordObj.setValue('customform', formulario);
            }

            newrecordObj.setValue('entity', recordObj.getValue('entity'));
            if (subsiOW) {
                newrecordObj.setValue('subsidiary', recordObj.getValue('subsidiary'));
            }
            newrecordObj.setValue('memo', memo + aRetencion[0].subtype);

            newrecordObj.setValue('trandate', recordObj.getValue('trandate'));
            if (!libraryMail.getAuthorization(1022, licenses)) {
                newrecordObj.setValue('postingperiod', recordObj.getValue('postingperiod'));
            }

            newrecordObj.setValue('account', recordObj.getValue('account'));
            newrecordObj.setValue('exchangerate', recordObj.getValue('exchangerate'));
            newrecordObj.setValue('currency', recordObj.getValue('currency'));

            if (deparEnable && aRetencion[0].departmentLine) {
                newrecordObj.setValue('department', aRetencion[0].departmentLine);
            }

            if (classEnable && aRetencion[0].classLine) {
                newrecordObj.setValue('class', aRetencion[0].classLine);
            }

            if (locatEnable && aRetencion[0].locationLine) {
                newrecordObj.setValue('location', aRetencion[0].locationLine);
            }

            newrecordObj.setValue('custbody_lmry_reference_transaction', recordObj.id);
            newrecordObj.setValue('custbody_lmry_reference_transaction_id', recordObj.id);
            newrecordObj.setValue('custbody_lmry_reference_entity', recordObj.getValue('entity'));

            if (aRetencion[0].approvalFeature == 'T' || aRetencion[0].approvalFeature == true || aRetencion[0].approvalFeature == 't') {
                if (newrecordObj.getField({ fieldId: "approvalstatus" })) {
                    newrecordObj.setValue('approvalstatus', 2);
                }
            }

            for (var k = 0; k < aRetencion.length; k++) {

                newrecordObj.setSublistValue('item', 'item', k, aRetencion[k].itemReference);
                newrecordObj.setSublistValue('item', 'amount', k, aRetencion[k].retencion);
                newrecordObj.setSublistValue('item', 'rate', k, aRetencion[k].retencion);
                // newrecordObj.setSublistValue('item', 'description', k, aRetencion[k].description);
                newrecordObj.setSublistValue('item', 'description', k, memo + aRetencion[k].code + " - " + aRetencion[k].lineuniquekey);

                if (aRetencion[k].taxcodeReference) {
                    newrecordObj.setSublistValue('item', 'taxcode', k, aRetencion[k].taxcodeReference);
                }
                newrecordObj.setSublistValue('item', 'tax1amt', k, 0);

                if (deparEnable && aRetencion[k].departmentLine) {
                    newrecordObj.setSublistValue('item', 'department', k, aRetencion[k].departmentLine);
                }

                if (classEnable && aRetencion[k].classLine) {
                    newrecordObj.setSublistValue('item', 'class', k, aRetencion[k].classLine);
                }

                if (locatEnable && aRetencion[k].locationLine) {
                    newrecordObj.setSublistValue('item', 'location', k, aRetencion[k].locationLine);
                }

                newrecordObj.setSublistValue('item', 'custcol_lmry_apply_wht_tax', k, false);

            }

            var idNewRecord = newrecordObj.save({ ignoreMandatoryFields: true, disableTriggers: true });

            log.debug('idNewRecord', idNewRecord);

            if (transactionType == 'vendorbill' || transactionType == 'invoice') {
                applyTransaction(idNewRecord, transactionType, recordObj.id);
            } else {
                applyTransaction(recordObj.id, transactionType, idNewRecord);
            }

            return idNewRecord;

        }

        function applyTransaction(idLoadTransaction, transactionType, idApply) {

            //Siempre se carga la nota de credito, pero el id puede cambiar (transaccion creada u original)
            var newApplyObj = record.load({ type: jsonApply[transactionType], id: idLoadTransaction, isDynamic: true });

            var applyCant = newApplyObj.getLineCount({ sublistId: 'apply' });
            var amountTran = newApplyObj.getValue({ fieldId: 'total' });

            for (var k = 0; k < applyCant; k++) {
                newApplyObj.selectLine({ sublistId: "apply", line: k });
                var idTran = newApplyObj.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'internalid' });

                if (idTran == idApply) {
                    newApplyObj.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                    newApplyObj.commitLine({ sublistId: "apply" });
                    //newApplyObj.setSublistValue({sublistId: 'apply', fieldId: 'amount', line: k, value: amountTran});
                    break;
                }

            }

            newApplyObj.save({ disableTriggers: true, ignoreMandatoryFields: true });

        }

        function createJSONResult(aRetencion, recordObj) {
            var arrayJSON = [];

            for (var i = 0; i < aRetencion.length; i++) {
                var jsonAuxTemp = {};
                jsonAuxTemp["taxType"] = { text: aRetencion[i].taxType, value: aRetencion[i].taxTypeId };
                jsonAuxTemp["appliesTo"] = { text: aRetencion[i].applies_to, value: aRetencion[i].applies_toID };
                jsonAuxTemp["subType"] = { text: aRetencion[i].subtype, value: aRetencion[i].subtypeId };
                jsonAuxTemp["lineUniqueKey"] = aRetencion[i].lineuniquekey;
                jsonAuxTemp["catalog"] = {};
                jsonAuxTemp["baseAmount"] = parseFloat(aRetencion[i].baseamount);
                jsonAuxTemp["whtAmount"] = Math.round(aRetencion[i].retencion * 100) / 100;
                jsonAuxTemp["whtRate"] = parseFloat(aRetencion[i].rate / 100);
                jsonAuxTemp["referenceTransaction"] = "";
                if (aRetencion[i].isCC) {
                    jsonAuxTemp["contributoryClass"] = aRetencion[i].CCNTID;
                } else {
                    jsonAuxTemp["nationalTax"] = aRetencion[i].CCNTID;
                }
                jsonAuxTemp["generatedTransaction"] = { text: aRetencion[i].generaText, value: aRetencion[i].genera };
                if (aRetencion[i].caso.indexOf("I")) {
                    jsonAuxTemp["item"] = { text: aRetencion[i].itemName, value: aRetencion[i].item };
                } else {
                    jsonAuxTemp["expenseAccount"] = { text: aRetencion[i].itemName, value: aRetencion[i].item };
                }
                jsonAuxTemp["position"] = aRetencion[i].posicionItem;
                jsonAuxTemp["description"] = aRetencion[i].description;
                jsonAuxTemp["lc_baseAmount"] = parseFloat(aRetencion[i].baseamount * aRetencion[i].exchangerate);
                jsonAuxTemp["lc_whtAmount"] = parseFloat(aRetencion[i].retencionLocal);

                arrayJSON.push(jsonAuxTemp);
            }

            var JSON_Record = record.create({
                type: "customrecord_lmry_ste_json_result",
                isDynamic: false
            });

            JSON_Record.setValue({ fieldId: "custrecord_lmry_ste_related_transaction", value: recordObj.id });
            JSON_Record.setValue({ fieldId: "custrecord_lmry_ste_subsidiary", value: recordObj.getValue("subsidiary") });
            JSON_Record.setValue({ fieldId: "custrecord_lmry_ste_subsidiary_country", value: recordObj.getValue("custbody_lmry_subsidiary_country") });
            JSON_Record.setValue({ fieldId: "custrecord_lmry_ste_transaction_date", value: format.parse({ type: format.Type.DATE, value: recordObj.getValue({ fieldId: "trandate" }) }) });
            JSON_Record.setValue({ fieldId: "custrecord_lmry_ste_wht_transaction", value: JSON.stringify(arrayJSON) });

            var IDJson = JSON_Record.save({
                enableSourcing: true,
                ignoreMandatoryFields: true,
                disableTriggers: true
            });

            log.debug("IDJson", IDJson);
            return IDJson;
        }

        function getWHT(recordObj, type, recordId, transactionType, licenses) {

            var approvalFeature = '';
            switch (transactionType) {
                case 'invoice':
                    approvalFeature = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALCUSTINVC' });
                    break;
                case 'creditmemo':
                    approvalFeature = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALCUSTINVC' });
                    break;
                case 'vendorbill':
                    approvalFeature = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALVENDORBILL' });
                    break;
                case 'vendorcredit':
                    approvalFeature = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALVENDORBILL' });
                    break;
                default:
                    break;
            }

            var country = recordObj.getValue({ fieldId: 'custbody_lmry_subsidiary_country' });
            var subsidiary = recordObj.getValue({ fieldId: 'subsidiary' });

            FEAT_EXCLUYENTE = validarFeatureExcluyente(country, licenses);

            var flagPais = validarPais(country, licenses);

            if (flagPais == false) {
                return true;
            }

            var filtros = new Array();
            filtros[0] = search.createFilter({ name: 'isinactive', operator: 'is', values: ['F'] });
            if (subsiOW) {
                filtros[1] = search.createFilter({ name: 'custrecord_lmry_setuptax_subsidiary', operator: 'anyof', values: [subsidiary] });
            }

            var searchSetupSubsidiary = search.create({ type: "customrecord_lmry_setup_tax_subsidiary", filters: filtros, columns: ['custrecord_lmry_setuptax_restrict_round', 'custrecord_lmry_setuptax_currency'] });
            var resultSearchSub = searchSetupSubsidiary.run().getRange({ start: 0, end: 1000 });

            var restrict = false;
            if (resultSearchSub.length && resultSearchSub.length) {
                currencySetup = resultSearchSub[0].getValue({ name: 'custrecord_lmry_setuptax_currency' });
                restrict = resultSearchSub[0].getValue({ name:'custrecord_lmry_setuptax_restrict_round' });
            }

            var currency = recordObj.getValue({ fieldId: 'currency' });
            var exchangerateTran = recordObj.getValue({ fieldId: 'exchangerate' });
            var exchangeRate = 1;

            if (subsiOW && featureMB) { // OneWorld y Multibook
                var currencySubs = search.lookupFields({ type: 'subsidiary', id: subsidiary, columns: ['currency'] });
                currencySubs = currencySubs.currency[0].value;

                var lineasBook = recordObj.getLineCount({ sublistId: 'accountingbookdetail' });

                if (currencySubs != currencySetup && currencySetup != '' && currencySetup != null) {
                    if (lineasBook != null && lineasBook != '') {
                        for (var i = 0; i < lineasBook; i++) {
                            var lineaCurrencyMB = recordObj.getSublistValue({ sublistId: 'accountingbookdetail', fieldId: 'currency', line: i });

                            if (lineaCurrencyMB == currencySetup) {
                                exchangeRate = recordObj.getSublistValue({ sublistId: 'accountingbookdetail', fieldId: 'exchangerate', line: i });
                                break;
                            }
                        }
                    }
                } else { // No esta configurado Setup Tax Subsidiary
                    exchangeRate = exchangerateTran;
                }
            } else { // No es OneWorld o no tiene Multibook
                exchangeRate = exchangerateTran;
            }

            /********************************************************
             * Concatena los libros contables en caso tenga Multibook
             ********************************************************/
            var auxBookMB = 0;
            var auxExchangeMB = recordObj.getValue({ fieldId: 'exchangerate' });

            if (featureMB) {
                var lineasBook = recordObj.getLineCount({ sublistId: 'accountingbookdetail' });
                if (lineasBook != null & lineasBook != '') {
                    for (var j = 0; j < lineasBook; j++) {
                        var lineaBook = recordObj.getSublistValue({ sublistId: 'accountingbookdetail', fieldId: 'accountingbook', line: j });
                        var lineaExchangeRate = recordObj.getSublistValue({ sublistId: 'accountingbookdetail', fieldId: 'exchangerate', line: j });
                        auxBookMB = auxBookMB + '|' + lineaBook;
                        auxExchangeMB = auxExchangeMB + '|' + lineaExchangeRate;
                    }
                }
            } // Fin Multibook

            var multibook = auxBookMB + '&' + auxExchangeMB;

            var documentType = recordObj.getValue({ fieldId: 'custbody_lmry_document_type' });

            //Busqueda de CC
            var filtrosCC = [];
            filtrosCC[0] = search.createFilter({ name: 'isinactive', operator: 'is', values: ['F'] });
            filtrosCC[1] = search.createFilter({ name: 'custrecord_lmry_ar_ccl_fechdesd', operator: 'onorbefore', values: recordObj.getText('trandate') });
            filtrosCC[2] = search.createFilter({ name: 'custrecord_lmry_ar_ccl_fechhast', operator: 'onorafter', values: recordObj.getText('trandate') });
            filtrosCC[3] = search.createFilter({ name: 'custrecord_lmry_ccl_transactiontypes', operator: 'anyof', values: [filtroTransactionType] });
            filtrosCC[4] = search.createFilter({ name: 'custrecord_lmry_ar_ccl_entity', operator: 'anyof', values: recordObj.getValue('entity') });
            filtrosCC[5] = search.createFilter({ name: 'custrecord_lmry_ccl_appliesto', operator: 'anyof', values: [2] });
            filtrosCC[6] = search.createFilter({ name: 'custrecord_lmry_ccl_taxtype', operator: 'anyof', values: [1] });
            filtrosCC[7] = search.createFilter({ name: 'custrecord_lmry_ccl_gen_transaction', operator: 'anyof', values: [1, 5] });
            filtrosCC[8] = search.createFilter({ name: 'custrecord_lmry_ar_ccl_subtype', operator: 'anyof', values: [6] });
            filtrosCC[9] = search.createFilter({ name: 'custrecord_lmry_ccl_wht_tax_point', operator: 'anyof', values: ['1', '@NONE@'] });

            if (documentType) {
                filtrosCC[10] = search.createFilter({ name: 'custrecord_lmry_ccl_fiscal_doctype', operator: 'anyof', values: [documentType, '@NONE@'] });
            } else {
                filtrosCC[10] = search.createFilter({ name: 'custrecord_lmry_ccl_fiscal_doctype', operator: 'anyof', values: ['@NONE@'] });
            }

            if (subsiOW) {
                filtrosCC[11] = search.createFilter({ name: 'custrecord_lmry_ar_ccl_subsidiary', operator: 'anyof', values: [subsidiary] });
            }

            var searchCC = search.create({
                type: 'customrecord_lmry_ar_contrib_class', filters: filtrosCC,
                columns: [{ name: "custrecord_lmry_ccl_appliesto", sort: search.Sort.ASC }, 'custrecord_lmry_co_ccl_taxrate', 'custrecord_lmry_amount', 'internalid', 'custrecord_lmry_sub_type',//4
                    'custrecord_lmry_ccl_minamount', 'custrecord_lmry_br_ccl_account1', 'custrecord_lmry_br_ccl_account2',//7
                    'custrecord_lmry_ccl_gen_transaction', 'custrecord_lmry_ar_ccl_department', 'custrecord_lmry_ar_ccl_class',//10
                    'custrecord_lmry_ar_ccl_location', 'custrecord_lmry_ccl_applies_to_item', 'custrecord_lmry_ccl_applies_to_account',//13
                    'custrecord_lmry_ccl_addratio', 'custrecord_lmry_ccl_description', 'custrecord_lmry_ec_ccl_catalog', 'custrecord_lmry_ec_ccl_wht_taxcode',//17
                    'custrecord_lmry_ec_ccl_rate_rpt', 'custrecord_lmry_ccl_maxamount', 'custrecord_lmry_ccl_accandmin_with',//20
                    'custrecord_lmry_ccl_not_taxable_minimum', 'custrecord_lmry_ccl_base_amount', 'custrecord_lmry_ccl_set_baseretention',//23
                    'custrecord_lmry_br_ccl_rate_suma', 'custrecord_lmry_ar_ccl_isexempt', 'custrecord_lmry_ar_ccl_taxcode', 'custrecord_lmry_ar_ccl_taxitem',//27
                    'custrecord_lmry_ccl_taxtype'//28
                ]

            });

            var searchResultCC = searchCC.run().getRange({ start: 0, end: 1000 });

            //Busqueda de NT
            var filtrosNT = [];
            filtrosNT[0] = search.createFilter({ name: 'isinactive', operator: 'is', values: ['F'] });
            filtrosNT[1] = search.createFilter({ name: 'custrecord_lmry_ntax_datefrom', operator: 'onorbefore', values: recordObj.getText('trandate') });
            filtrosNT[2] = search.createFilter({ name: 'custrecord_lmry_ntax_dateto', operator: 'onorafter', values: recordObj.getText('trandate') });
            filtrosNT[3] = search.createFilter({ name: 'custrecord_lmry_ntax_transactiontypes', operator: 'anyof', values: [filtroTransactionType] });
            filtrosNT[4] = search.createFilter({ name: 'custrecord_lmry_ntax_appliesto', operator: 'anyof', values: [2] });
            filtrosNT[5] = search.createFilter({ name: 'custrecord_lmry_ntax_taxtype', operator: 'anyof', values: [1] });
            filtrosNT[6] = search.createFilter({ name: 'custrecord_lmry_ntax_gen_transaction', operator: 'anyof', values: [1, 5] });
            filtrosNT[7] = search.createFilter({ name: 'custrecord_lmry_ntax_subtype', operator: 'anyof', values: [6] });
            filtrosNT[8] = search.createFilter({ name: 'custrecord_lmry_ntax_wht_tax_point', operator: 'anyof', values: ['1', '@NONE@'] });

            if (documentType) {
                filtrosNT[9] = search.createFilter({ name: 'custrecord_lmry_ntax_fiscal_doctype', operator: 'anyof', values: [documentType, '@NONE@'] });
            } else {
                filtrosNT[9] = search.createFilter({ name: 'custrecord_lmry_ntax_fiscal_doctype', operator: 'anyof', values: ['@NONE@'] });
            }

            if (subsiOW) {
                filtrosNT[10] = search.createFilter({ name: 'custrecord_lmry_ntax_subsidiary', operator: 'anyof', values: [subsidiary] });
            }

            var searchNT = search.create({
                type: 'customrecord_lmry_national_taxes',
                columns: [{ name: "custrecord_lmry_ntax_appliesto", sort: search.Sort.ASC }, //0
                    'custrecord_lmry_co_ntax_taxrate', 'custrecord_lmry_ntax_amount', 'internalid', 'custrecord_lmry_ntax_sub_type',//4
                    'custrecord_lmry_ntax_minamount', 'custrecord_lmry_ntax_debit_account', 'custrecord_lmry_ntax_credit_account',//7
                    'custrecord_lmry_ntax_gen_transaction', 'custrecord_lmry_ntax_department', 'custrecord_lmry_ntax_class',//10
                    'custrecord_lmry_ntax_location', 'custrecord_lmry_ntax_applies_to_item', 'custrecord_lmry_ntax_applies_to_account',//13
                    'custrecord_lmry_ntax_addratio', 'custrecord_lmry_ntax_description', 'custrecord_lmry_ec_ntax_catalog', 'custrecord_lmry_ec_ntax_wht_taxcode',//17
                    'custrecord_lmry_ec_ntax_rate_rpt', 'custrecord_lmry_ntax_maxamount', 'custrecord_lmry_ntax_accandmin_with',//20
                    'custrecord_lmry_ntax_not_taxable_minimum', 'custrecord_lmry_ntax_base_amount', 'custrecord_lmry_ntax_set_baseretention',//23
                    'custrecord_lmry_br_ntax_rate_suma', 'custrecord_lmry_ntax_isexempt', 'custrecord_lmry_ntax_taxcode', 'custrecord_lmry_ntax_taxitem',//27
                    'custrecord_lmry_ntax_taxtype'//28
                ],
                filters: filtrosNT
            });

            var searchResultNT = searchNT.run().getRange({ start: 0, end: 1000 });

            //for(var massive = 0; massive < 50; massive ++){
            iterarWHT(searchResultCC, 'item', recordObj, true, country, licenses, multibook, exchangeRate, approvalFeature, restrict);
            iterarWHT(searchResultCC, 'expense', recordObj, true, country, licenses, multibook, exchangeRate, approvalFeature, restrict);
            iterarWHT(searchResultCC, 'time', recordObj, true, country, licenses, multibook, exchangeRate, approvalFeature, restrict);
            iterarWHT(searchResultNT, 'item', recordObj, false, country, licenses, multibook, exchangeRate, approvalFeature, restrict);
            iterarWHT(searchResultNT, 'expense', recordObj, false, country, licenses, multibook, exchangeRate, approvalFeature, restrict);
            iterarWHT(searchResultNT, 'time', recordObj, false, country, licenses, multibook, exchangeRate, approvalFeature, restrict);
            //}

            return arrayRetencion;

        }

        function iterarWHT(searchResult, sublistId, recordObj, isCC, country, licenses, multibook, exchangeRate, approvalFeature, restrict) {

            var cantidadLineas = recordObj.getLineCount({ sublistId: sublistId });

            if (cantidadLineas <= 0) {
                return;
            }

            var departmentTran = recordObj.getValue('department');
            var classTran = recordObj.getValue('class');
            var locationTran = recordObj.getValue('location');

            if (searchResult && searchResult.length) {
                var columnsSearch = searchResult[0].columns;
                for (var i = 0; i < searchResult.length; i++) {

                    var internalId = searchResult[i].id;
                    var taxrate = searchResult[i].getValue(columnsSearch[1]);
                    var amount_to = searchResult[i].getValue(columnsSearch[2]);
                    var applies_toID = searchResult[i].getValue(columnsSearch[0]);
                    var applies_to = searchResult[i].getText(columnsSearch[0]);
                    var subtype = searchResult[i].getText(columnsSearch[4]);
                    var subtypeID = searchResult[i].getValue(columnsSearch[4]);
                    var min_amount = searchResult[i].getValue(columnsSearch[5]);
                    var account1 = searchResult[i].getValue(columnsSearch[6]);
                    var account2 = searchResult[i].getValue(columnsSearch[7]);
                    var genera = searchResult[i].getValue(columnsSearch[8]);
                    var generaText = searchResult[i].getText(columnsSearch[8]);
                    var department = searchResult[i].getValue(columnsSearch[9]);
                    var classes = searchResult[i].getValue(columnsSearch[10]);
                    var location = searchResult[i].getValue(columnsSearch[11]);
                    var applies_item = searchResult[i].getValue(columnsSearch[12]);
                    var applies_account = searchResult[i].getValue(columnsSearch[13]);
                    var ratio = searchResult[i].getValue(columnsSearch[14]);
                    var description = searchResult[i].getValue(columnsSearch[15]);
                    var catalog_ec = searchResult[i].getValue(columnsSearch[16]);
                    var wht_taxcode = searchResult[i].getValue(columnsSearch[17]);
                    var rate_rpt = searchResult[i].getValue(columnsSearch[18]);
                    var max_amount = searchResult[i].getValue(columnsSearch[19]);
                    var amount_to_compare = searchResult[i].getValue(columnsSearch[20]);
                    var not_taxable_minimun = searchResult[i].getValue(columnsSearch[21]);
                    var how_base_amount = searchResult[i].getValue(columnsSearch[22]);
                    var base_retention = searchResult[i].getValue(columnsSearch[23]);
                    var isExempt = searchResult[i].getValue(columnsSearch[25]);
                    var taxCodeRef = searchResult[i].getValue(columnsSearch[26]);
                    var itemRef = searchResult[i].getValue(columnsSearch[27]);
                    var taxTypeId = searchResult[i].getValue(columnsSearch[28]);
                    var taxType = searchResult[i].getText(columnsSearch[28]);
                    var CCNTID = searchResult[i].getValue(columnsSearch[3]);

                    // Conversion de los montos de la CC a moneda de la transaccion
                    if (min_amount == null || min_amount == '') { // Entidad - Totales / Items - Minimo
                        min_amount = 0;
                    }
                    min_amount = parseFloat(parseFloat(min_amount) / exchangeRate);
                    if (max_amount == null || max_amount == '') { // Entidad - Totales / Items - Maximo
                        max_amount = 0;
                    }
                    max_amount = parseFloat(parseFloat(max_amount) / exchangeRate);
                    if (base_retention == null || base_retention == '') {
                        base_retention = 0;
                    }
                    base_retention = parseFloat(parseFloat(base_retention) / exchangeRate);
                    if (not_taxable_minimun == null || not_taxable_minimun == '') {
                        not_taxable_minimun = 0;
                    }
                    not_taxable_minimun = parseFloat(parseFloat(not_taxable_minimun) / exchangeRate);

                    if (ratio == null || ratio == '') {
                        ratio = 1;
                    }
                    if (amount_to_compare == '' || amount_to_compare == null) {
                        amount_to_compare = amount_to;
                    }

                    if (description == null || description == '') {
                        description = '';
                    }
                    // Campos de Ecuador
                    if (wht_taxcode == null || wht_taxcode == '') {
                        wht_taxcode = '';
                    }
                    if (rate_rpt == null || rate_rpt == '') {
                        rate_rpt = '';
                    }

                    for (var j = 0; j < cantidadLineas; j++) {

                        var retencion = 0;
                        var baseAmount = 0;
                        var compareAmount = 0;

                        var fieldSublist = (sublistId != 'expense') ? 'item' : 'account';
                        var appliesField = (sublistId != 'expense') ? applies_item : applies_account;

                        var idItem = recordObj.getSublistValue({ sublistId: sublistId, fieldId: fieldSublist, line: j });
                        var idItemName = recordObj.getSublistText({ sublistId: sublistId, fieldId: fieldSublist, line: j });
                        var ApplyWHT = recordObj.getSublistValue({ sublistId: sublistId, fieldId: 'custcol_lmry_apply_wht_tax', line: j });

                        if (sublistId == 'time') {
                            if (!recordObj.getSublistValue({ sublistId: sublistId, fieldId: 'apply', line: j })) continue;
                        }

                        if (ApplyWHT == 'F' || ApplyWHT == false) {
                            continue;
                        }

                        var flagItem = false;

                        if (isCC) {
                            if (idItem == appliesField || (!applies_item && !applies_account)) {
                                flagItem = true;
                            }
                        } else {
                            if ((idItem == appliesField || (!applies_item && !applies_account)) && validaExcluyente(country, sublistId, idItem, subtype, licenses)) {
                                flagItem = true;
                            }
                        }

                        if (!flagItem) {
                            continue;
                        }

                        var departmentItem = recordObj.getSublistValue({ sublistId: sublistId, fieldId: 'department', line: j });
                        var classItem = recordObj.getSublistValue({ sublistId: sublistId, fieldId: 'class', line: j });
                        var locationItem = recordObj.getSublistValue({ sublistId: sublistId, fieldId: 'location', line: j });
                        var grossamtItem = recordObj.getSublistValue({ sublistId: sublistId, fieldId: 'grossamt', line: j });
                        var taxamtItem = recordObj.getSublistValue({ sublistId: sublistId, fieldId: 'tax1amt', line: j });
                        var taxrateItem = recordObj.getSublistValue({ sublistId: sublistId, fieldId: 'taxrate1', line: j }) || 0;
                        var lineuniquekey = recordObj.getSublistValue({ sublistId: sublistId, fieldId: 'lineuniquekey', line: j });

                        var netamtItem = parseFloat(grossamtItem) - parseFloat(taxamtItem);

                        if (taxamtItem == 0 && amount_to == 2) {
                            continue;
                        }

                        // Calculo del Monto Base
                        switch (amount_to) {
                            case '1':
                                baseAmount = parseFloat(grossamtItem) - parseFloat(not_taxable_minimun);
                                break;
                            case '2':
                                baseAmount = parseFloat(taxamtItem) - parseFloat(not_taxable_minimun);
                                break;
                            case '3':
                                baseAmount = parseFloat(netamtItem) - parseFloat(not_taxable_minimun);
                                break;
                        }

                        if (restrict && ["invoice", "creditmemo"].indexOf(recordObj.type) > -1) {
                            taxrateItem = parseFloat(taxrateItem);
                            baseAmount = getBaseWht(amount_to, netamtItem, taxrateItem, exchangeRate);
                            baseAmount = parseFloat(baseAmount) - parseFloat(not_taxable_minimun);
                        }
                        baseAmount = parseFloat(baseAmount);

                        // Calculo del Monto a Comparar
                        if (amount_to_compare == amount_to) {
                            compareAmount = parseFloat(baseAmount);
                        } else {
                            switch (amount_to_compare) {
                                case '1':
                                    compareAmount = parseFloat(grossamtItem);
                                    break;
                                case '2':
                                    compareAmount = parseFloat(taxamtItem);
                                    break;
                                case '3':
                                    compareAmount = parseFloat(netamtItem);
                                    break;
                            }
                        }
                        compareAmount = Math.abs(compareAmount);

                        if (how_base_amount != null && how_base_amount != '') {
                            switch (how_base_amount) {
                                case '2': // Substrac Minimun
                                    baseAmount = parseFloat(baseAmount) - parseFloat(min_amount);
                                    break;
                                case '3': // Minimun
                                    baseAmount = parseFloat(min_amount);
                                    break;
                                case '4': // Maximun
                                    baseAmount = parseFloat(max_amount);
                                    break;

                            }
                        }
                        baseAmount = parseFloat(baseAmount);
                        /*if (baseAmount <= 0) {
                            continue;
                        }*/

                        // Calculo de retencion
                        if (max_amount != 0) {
                            if (min_amount <= parseFloat(compareAmount) && parseFloat(compareAmount) <= max_amount) {
                                retencion = (parseFloat(taxrate) / 100 * parseFloat(baseAmount) * parseFloat(ratio)) + parseFloat(base_retention);
                            }
                        } else {
                            if (min_amount <= parseFloat(compareAmount)) {
                                retencion = (parseFloat(taxrate) / 100 * parseFloat(baseAmount) * parseFloat(ratio)) + parseFloat(base_retention);
                            }
                        }

                        //LLENADO DE ARREGLO RETENCION
                        if (parseFloat(retencion) != 0 || isExempt == true) {
                            var retencionLocal = 0;
                            var retencionAux = 0;
                            if (restrict && ["invoice", "creditmemo"].indexOf(recordObj.type) > -1) {
                                retencionLocal = retencion * exchangeRate;
                                retencionAux = typeRounding(typeRounding(retencionLocal) / exchangeRate);
                            } else {
                                retencionAux = typeRounding(retencion);
                                retencionLocal = typeRounding(retencion) * exchangeRate;
                            }
                            if (parseFloat(retencionAux) != 0 || isExempt == true) {

                                var caso = '';

                                if (isCC) {
                                    sublistId != 'expense' ? caso = '2I' : caso = '2E';
                                } else {
                                    sublistId != 'expense' ? caso = '4I' : caso = '4E';
                                }

                                arrayRetencion.push({
                                    subtype: subtype,
                                    subtypeId: subtypeID,
                                    baseamount: parseFloat(baseAmount),
                                    retencion: retencionAux,
                                    internalid: internalId,
                                    isCC: isCC,
                                    sublist: sublistId,
                                    rate: taxrate,
                                    caso: caso,
                                    account1: account1,
                                    account2: account2,
                                    genera: genera,
                                    generaText: generaText,
                                    department: department,
                                    classes: classes,
                                    location: location,
                                    departmentLine: departmentTran || departmentItem,
                                    classLine: classTran || classItem,
                                    locationLine: locationTran || locationItem,
                                    item: idItem,
                                    itemName: idItemName,
                                    posicionItem: j,
                                    description: description,
                                    whtTaxCode: wht_taxcode,
                                    rateRpt: rate_rpt,
                                    taxcodeReference: taxCodeRef,
                                    itemReference: itemRef,
                                    multibook: multibook,
                                    exchangerate: exchangeRate,
                                    approvalFeature: approvalFeature,
                                    lineuniquekey: lineuniquekey,
                                    taxTypeId: taxTypeId,
                                    taxType: taxType,
                                    applies_toID: applies_toID,
                                    applies_to: applies_to,
                                    CCNTID: CCNTID,
                                    retencionLocal: retencionLocal,
                                    code: isCC ? "CC " + CCNTID : "NT " + CCNTID
                                });

                                if (isCC) {
                                    listApply.push({ subtype: subtype, value: idItem, sublist: sublistId });
                                }

                            }
                        }//FIN LLENADO ARREGLO RETENCION


                    }//FIN SUBLISTA

                }//FIN FOR
            }//FIN IF



        }

        function getBaseWht(base, amount, rate, exchangerate) {
            var result = 0;
            if (base == "3") {
                result = amount * exchangerate;
            }
            if (base == "2") {
                result = amount * exchangerate * (rate / 100);
            }
            if (base == "1") {
                result = amount * exchangerate * (1 + rate / 100);
            }
            result /= exchangerate;
            return result;
        }

        function createTaxResult(jsonTaxResult, recordObj) {

            var recordSummary = record.create({ type: 'customrecord_lmry_br_transaction', isDynamic: false });

            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_related_id', value: String(recordObj.id) });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_transaction', value: recordObj.id });

            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_type', value: jsonTaxResult.subtype });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_type_id', value: jsonTaxResult.subtypeId });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_base_amount', value: jsonTaxResult.baseamount });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_total', value: parseFloat(jsonTaxResult.retencion) });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_percent', value: parseFloat(jsonTaxResult.rate) / 100 });

            switch (jsonTaxResult.caso) {
                case '2I':
                case '4I':
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_total_item', value: 'Line - Item' });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_item', value: jsonTaxResult.item });
                    break;

                case '2E':
                case '4E':
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_total_item', value: 'Line - Expense' });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_account', value: jsonTaxResult.item });
                    break;
            }

            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_positem', value: parseInt(jsonTaxResult.posicionItem) });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_ccl', value: jsonTaxResult.internalid });

            if (jsonTaxResult.caso == '2I' || jsonTaxResult.caso == '2E') {
                recordSummary.setValue({ fieldId: 'custrecord_lmry_ccl', value: jsonTaxResult.internalid });
            } else {
                recordSummary.setValue({ fieldId: 'custrecord_lmry_ntax', value: jsonTaxResult.internalid });
            }

            recordSummary.setValue({ fieldId: 'custrecord_lmry_accounting_books', value: jsonTaxResult.multibook });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_tax_description', value: jsonTaxResult.description });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_ec_wht_taxcode', value: jsonTaxResult.whtTaxCode });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_ec_rate_rpt', value: jsonTaxResult.rateRpt });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_total_base_currency', value: jsonTaxResult.retencionLocal });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_base_amount_local_currc', value: Math.round(jsonTaxResult.baseamount * 100) / 100 * parseFloat(jsonTaxResult.exchangerate) });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_amount_local_currency', value: jsonTaxResult.retencionLocal });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_tax_type', value: '1' });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_lineuniquekey', value: jsonTaxResult.lineuniquekey });

            var idRecordSummary = recordSummary.save({ disableTriggers: true, ignoreMandatoryFields: true });

            log.debug('idRecordSummary', idRecordSummary);

        }

        function getDataTransaction(arrayTaxResult, recordObj, licenses) {

            var countrySubsidiary = recordObj.getValue({ fieldId: 'custbody_lmry_subsidiary_country' });
            var featureAgrup = validarFeatureAgrupacion(countrySubsidiary, licenses);

            if (featureAgrup) {

                var jsonAux = {};

                for (var tr = 0; tr < arrayTaxResult.length; tr++) {

                    var subtype = arrayTaxResult[tr].subtypeId;
                    var generatedTransaction = arrayTaxResult[tr].genera;

                    if (!jsonAux[generatedTransaction]) {
                        jsonAux[generatedTransaction] = {};
                    }

                    if (!jsonAux[generatedTransaction][subtype]) {
                        jsonAux[generatedTransaction][subtype] = [];
                    }

                    jsonAux[generatedTransaction][subtype].push(arrayTaxResult[tr]);

                }

                return {
                    feature: featureAgrup,
                    retenciones: jsonAux
                }


            } else {

                return {
                    feature: featureAgrup,
                    retenciones: arrayTaxResult
                };

            }

        }


        function validarPais(country, licenses) {

            try {
                var val_country = codeCountry[country];
                if (val_country != null && val_country != '' && val_country != undefined) {
                    if (validarFeaturePais(val_country, licenses)) {
                        return true;
                    }
                }
            } catch (err) {
                libraryMail.sendemail('[ validarPais ] ' + err, LMRY_script);
            }
            return false;
        }

        function validarFeaturePais(val_country, licenses) {
            try {
                var activo = false;
                switch (val_country) {
                    case 'AR':
                        activo = libraryMail.getAuthorization(359, licenses);
                        break;
                    case 'BO':
                        activo = libraryMail.getAuthorization(360, licenses);
                        break;
                    case 'BR':
                        activo = libraryMail.getAuthorization(361, licenses);
                        break;
                    case 'CL':
                        activo = libraryMail.getAuthorization(362, licenses);
                        break;
                    case 'CO':
                        activo = libraryMail.getAuthorization(340, licenses);
                        break;
                    case 'CR':
                        activo = libraryMail.getAuthorization(363, licenses);
                        break;
                    case 'EC':
                        activo = libraryMail.getAuthorization(364, licenses);
                        break;
                    case 'SV':
                        activo = libraryMail.getAuthorization(365, licenses);
                        break;
                    case 'GT':
                        activo = libraryMail.getAuthorization(366, licenses);
                        break;
                    case 'MX':
                        activo = libraryMail.getAuthorization(367, licenses);
                        break;
                    case 'PA':
                        activo = libraryMail.getAuthorization(368, licenses);
                        break;
                    case 'PY':
                        activo = libraryMail.getAuthorization(369, licenses);
                        break;
                    case 'PE':
                        activo = libraryMail.getAuthorization(370, licenses);
                        break;
                    case 'UY':
                        activo = libraryMail.getAuthorization(371, licenses);
                        break;
                }
                return activo;
            } catch (err) {
                libraryMail.sendemail('[ validarFeaturePais ] ' + err, LMRY_script);
            }
            return false;
        }

        /**************************************************************
         * Funcion que valida si los features estan activos en el pais
         * Parámetros :
         *      country : codigo del Pais
         **************************************************************/
        function validarFeatureExcluyente(country, licenses) {
            try {

                var activo = false;
                var val_country = codeCountry[country];
                switch (val_country) {
                    case 'AR':
                        activo = libraryMail.getAuthorization(345, licenses);
                        break;
                    case 'BO':
                        activo = libraryMail.getAuthorization(346, licenses);
                        break;
                    case 'BR':
                        activo = libraryMail.getAuthorization(347, licenses);
                        break;
                    case 'CL':
                        activo = libraryMail.getAuthorization(348, licenses);
                        break;
                    case 'CO':
                        activo = libraryMail.getAuthorization(349, licenses);
                        break;
                    case 'CR':
                        activo = libraryMail.getAuthorization(350, licenses);
                        break;
                    case 'EC':
                        activo = libraryMail.getAuthorization(351, licenses);
                        break;
                    case 'SV':
                        activo = libraryMail.getAuthorization(352, licenses);
                        break;
                    case 'GT':
                        activo = libraryMail.getAuthorization(353, licenses);
                        break;
                    case 'MX':
                        activo = libraryMail.getAuthorization(354, licenses);
                        break;
                    case 'PA':
                        activo = libraryMail.getAuthorization(355, licenses);
                        break;
                    case 'PY':
                        activo = libraryMail.getAuthorization(356, licenses);
                        break;
                    case 'PE':
                        activo = libraryMail.getAuthorization(357, licenses);
                        break;
                    case 'UY':
                        activo = libraryMail.getAuthorization(358, licenses);
                        break;
                }
                return activo;
            } catch (err) {
                libraryMail.sendemail('[ validarFeatureExcluyente ] ' + err, LMRY_script);
            }
            return false;
        }

        function validaExcluyente(country, sublist, value, subtype, licenses) {
            try {
                if (FEAT_EXCLUYENTE) {
                    for (var i = 0; i < listApply.length; i++) {
                        if (listApply[i]['sublist'] == sublist && listApply[i]['value'] == value && listApply[i]['subtype'] == subtype) {
                            return false;
                        }
                    }
                } else {
                    return true;
                }
            } catch (err) {
                libraryMail.sendemail('[ validaExcluyente ] ' + err, LMRY_script);
            }
            return true;
        }

        /***************************************************************
         * Funcion que valida si los features de agrupacion de
         *       retenciones estan activos en el pais
         * Parámetros :
         *      country : codigo del Pais
         **************************************************************/
        function validarFeatureAgrupacion(country, licenses) {
            try {
                var activo = false;
                var val_country = codeCountry[country];
                switch (val_country) {
                    case 'AR':
                        activo = libraryMail.getAuthorization(372, licenses);
                        break;
                    case 'BO':
                        activo = libraryMail.getAuthorization(373, licenses);
                        break;
                    case 'BR':
                        activo = libraryMail.getAuthorization(374, licenses);
                        break;
                    case 'CL':
                        activo = libraryMail.getAuthorization(375, licenses);
                        break;
                    case 'CO':
                        activo = libraryMail.getAuthorization(376, licenses);
                        break;
                    case 'CR':
                        activo = libraryMail.getAuthorization(377, licenses);
                        break;
                    case 'EC':
                        activo = libraryMail.getAuthorization(378, licenses);
                        break;
                    case 'SV':
                        activo = libraryMail.getAuthorization(379, licenses);
                        break;
                    case 'GT':
                        activo = libraryMail.getAuthorization(380, licenses);
                        break;
                    case 'MX':
                        activo = libraryMail.getAuthorization(381, licenses);
                        break;
                    case 'PA':
                        activo = libraryMail.getAuthorization(382, licenses);
                        break;
                    case 'PY':
                        activo = libraryMail.getAuthorization(383, licenses);
                        break;
                    case 'PE':
                        activo = libraryMail.getAuthorization(384, licenses);
                        break;
                    case 'UY':
                        activo = libraryMail.getAuthorization(385, licenses);
                        break;
                }
                return activo;
            } catch (err) {
                libraryMail.sendemail('[ validarFeatureAgrupacion ] ' + err, LMRY_script);
            }
            return false;
        }

        /*************************************************************************
         * Funcion que redondea a 2 digitos teniendo en cuenta los decimales
         * errados del  javascript
         * Parámetros :
         *      ret : monto a Redondear
         *************************************************************************/
        function typeRounding(ret) {
            if (ret >= 0) {
                return parseFloat(Math.round(parseFloat(ret) * 1e2 + 1e-8) / 1e2);
            } else {
                return parseFloat(Math.round(parseFloat(ret) * 1e2 - 1e-8) / 1e2);
            }
        }

        function getWHTLines(dataTran, exchangeRate, multibook, approvalFeature, restrict) {

            var arrayFiltro = [];
            var arrayRetencionLines = [];
            if (dataTran['retecree']) {
                arrayFiltro.push(dataTran['retecree']);
            }
            if (dataTran['retefte']) {
                arrayFiltro.push(dataTran['retefte']);
            }
            if (dataTran['reteiva']) {
                arrayFiltro.push(dataTran['reteiva']);
            }
            if (dataTran['reteica']) {
                arrayFiltro.push(dataTran['reteica']);
            }

            if (!arrayFiltro.length) {
                return [];
            }

            JsonType = {
                'invoice': '1',
                'creditmemo': '8',
                'vendorbill': '4',
                'vendorcredit': '7'
            }

            var fechaTran = format.parse({ type: format.Type.DATE, value: dataTran['trandate'] });
            fechaTran = format.format({ type: format.Type.DATE, value: fechaTran });

            var searchNT = search.create({
                type: 'customrecord_lmry_national_taxes',
                columns: [{ name: "custrecord_lmry_ntax_appliesto", sort: search.Sort.ASC }, //0
                    'custrecord_lmry_co_ntax_taxrate', 'custrecord_lmry_ntax_amount', 'internalid', 'custrecord_lmry_ntax_sub_type',//4
                    'custrecord_lmry_ntax_minamount', 'custrecord_lmry_ntax_debit_account', 'custrecord_lmry_ntax_credit_account',//7
                    'custrecord_lmry_ntax_gen_transaction', 'custrecord_lmry_ntax_department', 'custrecord_lmry_ntax_class',//10
                    'custrecord_lmry_ntax_location', 'custrecord_lmry_ntax_applies_to_item', 'custrecord_lmry_ntax_applies_to_account',//13
                    'custrecord_lmry_ntax_addratio', 'custrecord_lmry_ntax_description', 'custrecord_lmry_ntax_subtype', 'custrecord_lmry_ec_ntax_wht_taxcode',//17
                    'custrecord_lmry_ec_ntax_rate_rpt', 'custrecord_lmry_ntax_maxamount', 'custrecord_lmry_ntax_accandmin_with',//20
                    'custrecord_lmry_ntax_not_taxable_minimum', 'custrecord_lmry_ntax_base_amount', 'custrecord_lmry_ntax_set_baseretention',//23
                    'custrecord_lmry_br_ntax_rate_suma', 'custrecord_lmry_ntax_isexempt', 'custrecord_lmry_ntax_taxcode', 'custrecord_lmry_ntax_taxitem',//27
                    'custrecord_lmry_ntax_taxtype'//28
                ],
                filters: [
                    ['internalid', 'anyof', arrayFiltro], 'AND',
                    ['custrecord_lmry_ntax_transactiontypes', 'anyof', JsonType[dataTran['type']]], 'AND',
                    ['custrecord_lmry_ntax_datefrom', 'onorbefore', fechaTran], 'AND',
                    ['custrecord_lmry_ntax_dateto', 'onorafter', fechaTran], 'AND',
                    ['custrecord_lmry_ntax_wht_tax_point', 'anyof', ['1', '@NONE@']]
                ]
            });
            if (subsiOW) {
                searchNT.filters.push(search.createFilter({ name: 'custrecord_lmry_ntax_subsidiary', operator: 'is', values: dataTran['subsidiary'] }))
            }

            var searchResult = searchNT.run().getRange({ start: 0, end: arrayFiltro.length });

            for (var i = 0; i < searchResult.length; i++) {

                var internalId = searchResult[i].id;
                var columnsSearch = searchResult[i].columns;
                var taxrate = searchResult[i].getValue(columnsSearch[1]);
                var amount_to = searchResult[i].getValue(columnsSearch[2]);
                var applies_toID = searchResult[i].getValue(columnsSearch[0]);
                var applies_to = searchResult[i].getText(columnsSearch[0]);
                var subtype = searchResult[i].getText(columnsSearch[4]);
                var subtypeID = searchResult[i].getValue(columnsSearch[4]);
                var min_amount = searchResult[i].getValue(columnsSearch[5]);
                var account1 = searchResult[i].getValue(columnsSearch[6]);
                var account2 = searchResult[i].getValue(columnsSearch[7]);
                var genera = searchResult[i].getValue(columnsSearch[8]);
                var generaText = searchResult[i].getText(columnsSearch[8]);
                var department = searchResult[i].getValue(columnsSearch[9]);
                var classes = searchResult[i].getValue(columnsSearch[10]);
                var location = searchResult[i].getValue(columnsSearch[11]);
                var applies_item = searchResult[i].getValue(columnsSearch[12]);
                var applies_account = searchResult[i].getValue(columnsSearch[13]);
                var ratio = searchResult[i].getValue(columnsSearch[14]);
                var description = searchResult[i].getValue(columnsSearch[15]);
                var typeID = searchResult[i].getValue(columnsSearch[16]);
                var wht_taxcode = searchResult[i].getValue(columnsSearch[17]);
                var rate_rpt = searchResult[i].getValue(columnsSearch[18]);
                var max_amount = searchResult[i].getValue(columnsSearch[19]);
                var amount_to_compare = searchResult[i].getValue(columnsSearch[20]);
                var not_taxable_minimun = searchResult[i].getValue(columnsSearch[21]);
                var how_base_amount = searchResult[i].getValue(columnsSearch[22]);
                var base_retention = searchResult[i].getValue(columnsSearch[23]);
                var isExempt = searchResult[i].getValue(columnsSearch[25]);
                var taxCodeRef = searchResult[i].getValue(columnsSearch[26]);
                var itemRef = searchResult[i].getValue(columnsSearch[27]);
                var taxTypeId = searchResult[i].getValue(columnsSearch[28]);
                var taxType = searchResult[i].getText(columnsSearch[28]);
                var CCNTID = searchResult[i].getValue(columnsSearch[3]);

                var retencion = 0;
                var baseAmount = 0;
                var compareAmount = 0;

                // Conversion de los montos de la CC a moneda de la transaccion
                if (min_amount == null || min_amount == '') { // Entidad - Totales / Items - Minimo
                    min_amount = 0;
                }
                min_amount = parseFloat(parseFloat(min_amount) / exchangeRate);
                if (max_amount == null || max_amount == '') { // Entidad - Totales / Items - Maximo
                    max_amount = 0;
                }
                max_amount = parseFloat(parseFloat(max_amount) / exchangeRate);
                if (base_retention == null || base_retention == '') {
                    base_retention = 0;
                }
                base_retention = parseFloat(parseFloat(base_retention) / exchangeRate);
                if (not_taxable_minimun == null || not_taxable_minimun == '') {
                    not_taxable_minimun = 0;
                }
                not_taxable_minimun = parseFloat(parseFloat(not_taxable_minimun) / exchangeRate);

                if (ratio == null || ratio == '') {
                    ratio = 1;
                }
                if (amount_to_compare == '' || amount_to_compare == null) {
                    amount_to_compare = amount_to;
                }

                if (description == null || description == '') {
                    description = '';
                }
                // Campos de Ecuador
                if (wht_taxcode == null || wht_taxcode == '') {
                    wht_taxcode = '';
                }
                if (rate_rpt == null || rate_rpt == '') {
                    rate_rpt = '';
                }

                //for (var j = 0; j < cantidadLineas; j++) {

                var sublistId = dataTran['item'] ? 'item' : 'expense';
                var appliesField = dataTran['item'] ? applies_item : applies_account;

                var idItem = dataTran['item'] ? dataTran['item'] : dataTran['account'];
                var idItemName = dataTran['item'] ? dataTran['itemName'] : dataTran['accountName'];
                //var idItemName = recordObj.getSublistText({ sublistId: sublistId, fieldId: fieldSublist, line: j });

                var flagItem = false;
                if (idItem == appliesField || (!applies_item && !applies_account)) {
                    flagItem = true;
                }

                if (!flagItem) {
                    continue;
                }

                var departmentItem = dataTran['department'] || '';
                var classItem = dataTran['class'] || '';
                var locationItem = dataTran['location'] || '';
                var netamtItem = parseFloat(dataTran['netamount']);
                var taxamtItem = parseFloat(dataTran['taxamount']);
                var taxrateItem = dataTran['taxrate'] || 0;

                var grossamtItem = parseFloat(taxamtItem) + parseFloat(netamtItem);

                if (taxamtItem == 0 && amount_to == 2) {
                    continue;
                }

                // Calculo del Monto Base
                switch (amount_to) {
                    case '1':
                        baseAmount = parseFloat(grossamtItem) - parseFloat(not_taxable_minimun);
                        break;
                    case '2':
                        baseAmount = parseFloat(taxamtItem) - parseFloat(not_taxable_minimun);
                        break;
                    case '3':
                        baseAmount = parseFloat(netamtItem) - parseFloat(not_taxable_minimun);
                        break;
                }

                if (restrict && ["invoice", "creditmemo"].indexOf(dataTran["type"]) > -1) {
                    taxrateItem = parseFloat(taxrateItem);
                    baseAmount = getBaseWht(amount_to, netamtItem, taxrateItem, exchangeRate);
                }
                baseAmount = parseFloat(baseAmount);

                // Calculo del Monto a Comparar
                if (amount_to_compare == amount_to) {
                    compareAmount = parseFloat(baseAmount);
                } else {
                    switch (amount_to_compare) {
                        case '1':
                            compareAmount = parseFloat(grossamtItem);
                            break;
                        case '2':
                            compareAmount = parseFloat(taxamtItem);
                            break;
                        case '3':
                            compareAmount = parseFloat(netamtItem);
                            break;
                    }
                }
                compareAmount = Math.abs(compareAmount);

                if (how_base_amount != null && how_base_amount != '') {
                    switch (how_base_amount) {
                        case '2': // Substrac Minimun
                            baseAmount = parseFloat(baseAmount) - parseFloat(min_amount);
                            break;
                        case '3': // Minimun
                            baseAmount = parseFloat(min_amount);
                            break;
                        case '4': // Maximun
                            baseAmount = parseFloat(max_amount);
                            break;

                    }
                }
                baseAmount = parseFloat(baseAmount);
                /*if (baseAmount <= 0) {
                    continue;
                }*/

                // Calculo de retencion
                if (max_amount != 0) {
                    if (min_amount <= parseFloat(compareAmount) && parseFloat(compareAmount) <= max_amount) {
                        retencion = (parseFloat(taxrate) / 100 * parseFloat(baseAmount) * parseFloat(ratio)) + parseFloat(base_retention);
                    }
                } else {
                    if (min_amount <= parseFloat(compareAmount)) {
                        retencion = (parseFloat(taxrate) / 100 * parseFloat(baseAmount) * parseFloat(ratio)) + parseFloat(base_retention);
                    }
                }

                //LLENADO DE ARREGLO RETENCION
                if (parseFloat(retencion) != 0 || isExempt == true) {
                    var retencionLocal = 0;
                    var retencionAux = 0;
                    if (restrict && ["invoice", "creditmemo"].indexOf(dataTran["type"]) > -1) {
                        retencionLocal = retencion * exchangeRate;
                        retencionAux = typeRounding(typeRounding(retencionLocal) / exchangeRate);
                    } else {
                        retencionAux = typeRounding(retencion);
                        retencionLocal = typeRounding(retencion) * exchangeRate;
                    }
                    if (parseFloat(retencionAux) != 0 || isExempt == true) {

                        var caso = '';

                        sublistId == 'item' ? caso = '4I' : caso = '4E';

                        arrayRetencionLines.push({
                            subtype: subtype,
                            subtypeId: subtypeID,
                            typeId: typeID,
                            baseamount: parseFloat(baseAmount),
                            retencion: retencionAux,
                            internalid: internalId,
                            sublist: sublistId,
                            rate: taxrate,
                            caso: caso,
                            account1: account1,
                            account2: account2,
                            genera: genera,
                            generaText: generaText,
                            department: department,
                            classes: classes,
                            location: location,
                            departmentLine: departmentItem,
                            classLine: classItem,
                            locationLine: locationItem,
                            item: idItem,
                            itemName: idItemName,
                            lineuniquekey: dataTran['lineuniquekey'],
                            position: '',
                            description: description,
                            whtTaxCode: wht_taxcode,
                            rateRpt: rate_rpt,
                            taxcodeReference: taxCodeRef,
                            itemReference: itemRef,
                            multibook: multibook,
                            exchangerate: exchangeRate,
                            approvalFeature: approvalFeature,
                            taxTypeId: taxTypeId,
                            taxType: taxType,
                            applies_toID: applies_toID,
                            applies_to: applies_to,
                            CCNTID: CCNTID,
                            retencionLocal: retencionLocal,
                            code: "NT " + CCNTID
                        });

                    }
                }//FIN LLENADO ARREGLO RETENCION

            }//FIN FOR

            return arrayRetencionLines;
        }

        function createTaxResultLines(jsonTaxResult, tranObj) {

            var recordSummary = record.create({ type: 'customrecord_lmry_br_transaction', isDynamic: false });

            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_related_id', value: String(tranObj['internalid']) });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_transaction', value: tranObj['internalid'] });

            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_type', value: jsonTaxResult.subtype });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_type_id', value: jsonTaxResult.subtypeId });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_base_amount', value: jsonTaxResult.baseamount });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_total', value: parseFloat(jsonTaxResult.retencion) });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_percent', value: parseFloat(jsonTaxResult.rate) / 100 });

            switch (jsonTaxResult.caso) {
                case '2I':
                case '4I':
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_total_item', value: 'Line - Item' });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_item', value: jsonTaxResult.item });
                    break;

                case '2E':
                case '4E':
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_total_item', value: 'Line - Expense' });
                    recordSummary.setValue({ fieldId: 'custrecord_lmry_account', value: jsonTaxResult.item });
                    break;
            }

            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_positem', value: Number(jsonTaxResult.position) });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_br_ccl', value: jsonTaxResult.internalid });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_ntax', value: jsonTaxResult.internalid });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_accounting_books', value: jsonTaxResult.multibook });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_tax_description', value: jsonTaxResult.description });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_total_base_currency', value: jsonTaxResult.retencionLocal });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_base_amount_local_currc', value: Math.round(jsonTaxResult.baseamount * 100) / 100 * parseFloat(jsonTaxResult.exchangerate) });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_amount_local_currency', value: jsonTaxResult.retencionLocal });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_tax_type', value: '1' });
            recordSummary.setValue({ fieldId: 'custrecord_lmry_lineuniquekey', value: tranObj['lineuniquekey'] });


            var idRecordSummary = recordSummary.save({ disableTriggers: true, ignoreMandatoryFields: true });

            log.debug('idRecordSummary', idRecordSummary);

        }

        function getForms(subsidiary) {
            var subsiOW = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
            var setupTax = {};

            var filtros = [];
            filtros[0] = search.createFilter({ name: "isinactive", operator: "is", values: ["F"] });
            if (subsiOW) {
                filtros[1] = search.createFilter({ name: "custrecord_lmry_setuptax_subsidiary", operator: "anyof", values: [subsidiary] });
            }

            var searchSetupSubsidiary = search.create({
                type: "customrecord_lmry_setup_tax_subsidiary",
                filters: filtros,
                columns: [
                    "custrecord_lmry_setuptax_form_bill", "custrecord_lmry_setuptax_form_credit", "custrecord_lmry_setuptax_form_creditmemo",
                    "custrecord_lmry_setuptax_form_invoice", "custrecord_lmry_setuptax_form_journal"
                ]
            });
            var resultSearchSub = searchSetupSubsidiary.run().getRange({ start: 0, end: 1000 });

            if (resultSearchSub && resultSearchSub.length) {
                setupTax["bill"] = resultSearchSub[0].getValue({ name: "custrecord_lmry_setuptax_form_bill" });
                setupTax["billcredit"] = resultSearchSub[0].getValue({ name: "custrecord_lmry_setuptax_form_credit" });
                setupTax["invoice"] = resultSearchSub[0].getValue({ name: "custrecord_lmry_setuptax_form_invoice" });
                setupTax["creditmemo"] = resultSearchSub[0].getValue({ name: "custrecord_lmry_setuptax_form_creditmemo" });
                setupTax["journal"] = resultSearchSub[0].getValue({ name: "custrecord_lmry_setuptax_form_journal" });
            }

            return setupTax;
        }

        return {
            getAllIdDelete: getAllIdDelete,
            deleteAll: deleteAll,
            newAfterSubmitTransaction: newAfterSubmitTransaction,
            beforeSubmitTransaction: beforeSubmitTransaction,
            beforeLoad: beforeLoad,
            searchEntity: searchEntity,
            getWHT: getWHT,
            createTaxResult: createTaxResult,
            createJSONResult: createJSONResult,
            getDataTransaction: getDataTransaction,
            createJournal: createJournal,
            createTransaction: createTransaction,
            setDataBody: setDataBody,
            getWHTLines: getWHTLines,
            createTaxResultLines: createTaxResultLines,
            getForms: getForms
        };

    });