/* eslint-disable no-eq-null */
/* eslint-disable eqeqeq */
/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = \
||   This script for customer center (Time)                      ||
||                                                               ||
||  File Name: LMRY_MX_Reverse_Cancellation_MPRD_LBRY_V2.1.js     ||
||                                                               ||
||  Version Date         Author        Remarks                   ||
||  2.1     Oct 04 2023  LatamReady    Use Script 2.1            ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([
    'N/search',
    'N/runtime',
    'N/record',
    'N/log',
    'N/format',
    'N/currency'
], function (search, runtime, record, log, format, currency) {

    let getParameters = () => {

        return {
            idUser: runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_mx_rcd_user' }),
            idLog: runtime.getCurrentScript().getParameter({ name: 'custscript_lmry_mx_rcd_state' }),
            reversalVoiding: runtime.getCurrentScript().getParameter({ name: 'REVERSALVOIDING' })
        }
    }

    let getPreference = () => {

        return {
            department: runtime.getCurrentUser().getPreference({ name: 'DEPTMANDATORY' }),
            "class": runtime.getCurrentUser().getPreference({ name: 'CLASSMANDATORY' }),
            location: runtime.getCurrentUser().getPreference({ name: 'LOCMANDATORY' }),
            journal: runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALJOURNAL' })
        }
    }

    let getFeatures = () => {

        return {
            department: runtime.isFeatureInEffect({ feature: "DEPARTMENTS" }),
            "class": runtime.isFeatureInEffect({ feature: "CLASS" }),
            location: runtime.isFeatureInEffect({ feature: "LOCATIONS" }),
            multibook: runtime.isFeatureInEffect({ feature: "MULTIBOOK" }),
            subsidiary: runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' })
        }
    }

    let getRecordsLog = (parameters) => {
        let recordLog = {};
        let searchRecordLog = search.create({
            type: 'customrecord_lmry_mx_rever_cancel_log',
            filters: [
                ['internalid', 'is', parameters.idLog]
            ],
            columns: [
                'custrecord_lmry_mx_rcd_log_transact',
                'custrecord_lmry_mx_rcd_log_account',
                'custrecord_lmry_mx_rcd_log_type'
                
            ]
        })
        searchRecordLog.run().each(function (result) {
            recordLog.idTransaction = result.getValue('custrecord_lmry_mx_rcd_log_transact');
            recordLog.accountSetup = result.getValue('custrecord_lmry_mx_rcd_log_account');
            recordLog.typeTransaction = result.getValue('custrecord_lmry_mx_rcd_log_type');
        });

        return recordLog;
    }

    /* ------------------------------------------------------------------------------------------------------
    * Esta funcion permite actualiazr el estado del proceso segun la etapa del flujo del modulo.
    * --------------------------------------------------------------------------------------------------- */
    let updateState = (parameters, msgState, msgDetails) => {
        record.submitFields({
            type: 'customrecord_lmry_mx_rever_cancel_log',
            id: parameters.idLog,
            values: {
                custrecord_lmry_mx_rcd_log_state: msgState,
                custrecord_lmry_mx_rcd_log_details: msgDetails
            },
            options: { ignoreMandatoryFields: true, disableTriggers: true }
        });
    }
    let updateTransactionState = (parameters, transactions) => {
        record.submitFields({
            type: 'customrecord_lmry_mx_rever_cancel_log',
            id: parameters.idLog,
            values: {
                custrecord_lmry_mx_rcd_log_transact: JSON.stringify(transactions)
            },
            options: { ignoreMandatoryFields: true, disableTriggers: true }
        });
    }

    /* ------------------------------------------------------------------------------------------------------
    * Esta funcion permite revertir la anulacion; reservando y desaplicandolo .
    * --------------------------------------------------------------------------------------------------- */
    let reverseCancellation = (cancellations) => {
        
        if (cancellations.typeTransaction == 7) { // invoice
            processInvoice(cancellations);
        } else if(cancellations.typeTransaction == 7){ // Credit memo

        }
        

    }

    let processCreditMemo = () => {
        const { idTransaction, accountSetup } = cancellations;
        const transactionVoided = getTransactionVoided(idTransaction);
        const newTransactionReverse = createLatamTransactionVoid(transactionVoided,accountSetup,idTransaction);
        applyAndDisapply(transactionVoided, newTransactionReverse);
    }

    let getTransactionVoided = (idTransaction) => {
        let transactionVoided = {};
        let features = getFeatures();

        let searchCreditMemo = search.create({
            type: "customtransaction_lmry_ei_voided_transac",
            filters:
                [
                    ["custbody_lmry_reference_transaction", "anyof", idTransaction],
                    "AND",
                    ["mainline", "is", "T"]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internalid" }),
                    search.createColumn({ name: "subsidiary", label: "Subsidiary" }),
                    search.createColumn({ name: "currency", label: "Currency" }),
                    search.createColumn({ name: "account", label: "Account" }),
                    search.createColumn({ name: "exchangerate", label: "exchangerate" }),
                    search.createColumn({ name: "fxamount", label: "amount" }),
                    search.createColumn({ name: "mainname", label: "Internal ID" }),
                    search.createColumn({ name: "trandate", label: "trandate" }),
                    search.createColumn({ name: "postingperiod", label: "postingperiod" })
                ],
            settings: []
        });

        if (features.subsidiary == true || features.subsidiary == 'T') {
            searchCreditMemo.settings.push(search.createSetting({ name: 'consolidationtype', value: 'NONE' }));
        }
        if (features.department == true || features.department == 'T') {
            searchCreditMemo.columns.push(search.createColumn({ name: "department", label: "department" }))
        }
        if (features.class == true || features.class == 'T') {
            searchCreditMemo.columns.push(search.createColumn({ name: "class", label: "class" }))
        }
        if (features.location == true || features.location == 'T') {
            searchCreditMemo.columns.push(search.createColumn({ name: "location", label: "location" }))
        }


        searchCreditMemo.run().each(function (result) {
            transactionVoided.id = result.getValue('internalid');
            transactionVoided.subsidiary = result.getValue('subsidiary');
            transactionVoided.currency = result.getValue('currency');
            transactionVoided.account = result.getValue('account');
            transactionVoided.exchangerate = result.getValue('exchangerate');
            transactionVoided.amount = Math.abs(result.getValue('fxamount'));
            transactionVoided.customer = result.getValue('mainname');
            transactionVoided.department = result.getValue('department') || '';
            transactionVoided.class = result.getValue('class') || '';
            transactionVoided.location = result.getValue('location') || '';
            transactionVoided.date = result.getValue('trandate') || '';
            transactionVoided.period = result.getValue('postingperiod') || '';

        });
        return transactionVoided;
    }



    
    let processInvoice = (cancellations)=>{
        const { idTransaction, accountSetup } = cancellations;
        const creditMemo = getCreditMemo(idTransaction);
        const newJournal = createTransactionReverse(creditMemo, accountSetup, idTransaction, record.Type.JOURNAL_ENTRY);
        applyAndDisapply(creditMemo, newJournal);
        updateStateTransaction('invoice',idTransaction);
    }

    /* ------------------------------------------------------------------------------------------------------
    * Esta funcion permite obtener los campos necesarios de la anulación (Credit Memo)
    * --------------------------------------------------------------------------------------------------- */
    let getCreditMemo = (idInvoice) => {

        let creditMemo = {};
        let features = getFeatures();

        let searchCreditMemo = search.create({
            type: "transaction",
            filters:
                [
                    ["appliedtotransaction.internalid", "anyof", idInvoice],
                    "AND",
                    ["mainline", "is", "T"]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internalid" }),
                    search.createColumn({ name: "subsidiary", label: "Subsidiary" }),
                    search.createColumn({ name: "currency", label: "Currency" }),
                    search.createColumn({ name: "account", label: "Account" }),
                    search.createColumn({ name: "exchangerate", label: "exchangerate" }),
                    search.createColumn({ name: "fxamount", label: "amount" }),
                    search.createColumn({ name: "mainname", label: "Internal ID" }),
                    search.createColumn({ name: "trandate", label: "trandate" }),
                    search.createColumn({ name: "postingperiod", label: "postingperiod" })
                ],
            settings: []
        });

        if (features.subsidiary == true || features.subsidiary == 'T') {
            searchCreditMemo.settings.push(search.createSetting({ name: 'consolidationtype', value: 'NONE' }));
        }
        if (features.department == true || features.department == 'T') {
            searchCreditMemo.columns.push(search.createColumn({ name: "department", label: "department" }))
        }
        if (features.class == true || features.class == 'T') {
            searchCreditMemo.columns.push(search.createColumn({ name: "class", label: "class" }))
        }
        if (features.location == true || features.location == 'T') {
            searchCreditMemo.columns.push(search.createColumn({ name: "location", label: "location" }))
        }


        searchCreditMemo.run().each(function (result) {
            creditMemo.id = result.getValue('internalid');
            creditMemo.subsidiary = result.getValue('subsidiary');
            creditMemo.currency = result.getValue('currency');
            creditMemo.account = result.getValue('account');
            creditMemo.exchangerate = result.getValue('exchangerate');
            creditMemo.amount = Math.abs(result.getValue('fxamount'));
            creditMemo.customer = result.getValue('mainname');
            creditMemo.department = result.getValue('department') || '';
            creditMemo.class = result.getValue('class') || '';
            creditMemo.location = result.getValue('location') || '';
            creditMemo.date = result.getValue('trandate') || '';
            creditMemo.period = result.getValue('postingperiod') || '';
            return true;
        });
        return creditMemo;

    }

    let updateStateTransaction = (type,idTransaction) => {
        record.submitFields({
            type: type,
            id: idTransaction,
            values: {
                custbody_lmry_pe_estado_sf: "Procesando"
            },
            options: { ignoreMandatoryFields: true, disableTriggers: true }
        });
    }

    /* ------------------------------------------------------------------------------------------------------
    * Esta funcion permite obtener los tipos de cambios de los libros contables del credit memo
    * --------------------------------------------------------------------------------------------------- */

    let getAccountingBook = (idCreditMemo, features) => {
        let books = {};

        if (features.multibook == true || features.multibook == "T") {
            var searchAccoutingBook = search.create({
                type: "accountingtransaction",
                filters: [
                    ["internalid", "is", idCreditMemo]
                ],
                columns: [
                    search.createColumn({
                        name: "accountingbook",
                        summary: "GROUP",
                        sort: search.Sort.ASC
                    }),
                    search.createColumn({
                        name: "exchangerate",
                        summary: "GROUP"
                    })
                ]
            });

            searchAccoutingBook.run().each(function (result) {
                let id = result.getValue({ summary: "GROUP", name: "accountingbook" });
                let exchangerate = result.getValue({ summary: "GROUP", name: "exchangerate" });
                books[id] = Number(exchangerate);
                return true;
            });
        } else {
            let exchangerate = search.lookupFields({
                type: "creditmemo",
                id: idCreditMemo,
                columns: ["exchangerate"]
            }).exchangerate;

            books["1"] = Number(exchangerate);
        }

        return books;
    }


    /* ------------------------------------------------------------------------------------------------------
    * Esta funcion permite establecer los tipos de cambio por cada libro contable
    * --------------------------------------------------------------------------------------------------- */
    let setExchangeRateBook = (idCreditMemo, newJournal) => {
        let features = getFeatures();
        let books = getAccountingBook(idCreditMemo, features);
        newJournal.setValue({ fieldId: 'exchangerate', value: books["1"] });
        if (features.multibook == true || features.multibook == "T") {
            let bookLines = newJournal.getLineCount({ sublistId: 'accountingbookdetail' });
            for (var i = 0; i < bookLines; i++) {
                newJournal.selectLine({
                    sublistId: 'accountingbookdetail',
                    line: i
                });

                var lineabookMB = newJournal.getCurrentSublistValue({
                    sublistId: 'accountingbookdetail',
                    fieldId: 'accountingbook',
                    //line: i
                });

                if (books[lineabookMB]) {
                    newJournal.setCurrentSublistValue({
                        sublistId: 'accountingbookdetail',
                        fieldId: 'exchangerate',
                        //line: i,
                        value: books[lineabookMB]
                    });
                    newJournal.commitLine({
                        sublistId: 'accountingbookdetail'
                    });
                }
            }
        }


    }

    let getAccountingperiod = (dateCreditMemo) => {
        let internalid;
        
        let dateFormat = format.format({type: format.Type.DATE,value: dateCreditMemo});
        
        var accountingperiodSearchObj = search.create({
            type: "accountingperiod",
            filters:
                [
                    ["startdate", "onorbefore", dateFormat],
                    "AND",
                    ["enddate", "onorafter", dateFormat],
                    "AND",
                    ["isquarter", "is", "F"],
                    "AND",
                    ["isyear", "is", "F"]
                ],
            columns:
                [
                    search.createColumn({name: "internalid", label: "Internal ID"})
                ]
        });
        accountingperiodSearchObj.run().each(function (result) {
            internalid = result.getValue("internalid");
        });
        
        return internalid;
    }

    /* ------------------------------------------------------------------------------------------------------
    * Esta funcion permite crear una reserva contable de la anulación 
    * --------------------------------------------------------------------------------------------------- */
    let createTransactionReverse = (transactionVoid, accountSetup, idTransactionMain, newType) => {

        let preference = getPreference();
        let newReverseTransaction = record.create({ type: newType, isDynamic: true });

        newReverseTransaction.setValue({ fieldId: 'subsidiary', value: transactionVoid.subsidiary });

        
        let dateFormat = format.parse({ value: new Date(), type: format.Type.DATE });
        
        
        let postingPeriod = getAccountingperiod(dateFormat)
        
        newReverseTransaction.setValue({ fieldId: 'trandate', value: dateFormat });
        newReverseTransaction.setValue({ fieldId: 'postingperiod', value: postingPeriod });
        newReverseTransaction.setValue({ fieldId: 'currency', value: transactionVoid.currency });
        newReverseTransaction.setValue({ fieldId: 'custbody_lmry_reference_transaction', value: idTransactionMain });
        newReverseTransaction.setValue({ fieldId: 'memo', value: "Latam - Reversión de anulación" });
        setExchangeRateBook(transactionVoid.id, newReverseTransaction);
        let setupTaxSubsidiary = getSetupTaxSubsidiary(transactionVoid.subsidiary);

        setLineNewReverseTransaction(newReverseTransaction, 'debit', transactionVoid, transactionVoid.account, setupTaxSubsidiary);
        setLineNewReverseTransaction(newReverseTransaction, 'credit', transactionVoid, accountSetup, setupTaxSubsidiary);
        if (preference.journal == true || preference.journal == 'T') {
            newReverseTransaction.setValue({ fieldId: 'approvalstatus', value: 2 });
        }

        return newReverseTransaction.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
    }


    let getSetupTaxSubsidiary = (idSubsidiary) => {

        var configuration = search.create({
            type: "customrecord_lmry_setup_tax_subsidiary",
            filters: [
                "custrecord_lmry_setuptax_subsidiary",
                "is",
                idSubsidiary,
            ],
            columns: [
                "custrecord_lmry_setuptax_department",
                "custrecord_lmry_setuptax_class",
                "custrecord_lmry_setuptax_location"
            ],
        }).run().getRange(0, 1);
        return {
            department: configuration[0].getValue("custrecord_lmry_setuptax_department"),
            class: configuration[0].getValue("custrecord_lmry_setuptax_class"),
            location: configuration[0].getValue("custrecord_lmry_setuptax_location"),
        }
    }

    /* ------------------------------------------------------------------------------------------------------
    * Esta funcion permite llenar los valores a cada linra de un Journal con las configuraciones correspondientes.
    * --------------------------------------------------------------------------------------------------- */
    let setLineNewReverseTransaction = (newReverseTransaction, typeLine, creditMemo, accountLine, setupTaxSubsidiary) => {
        let features = getFeatures();
        let preferences = getPreference();
        newReverseTransaction.selectNewLine({
            sublistId: 'line'
        });

        newReverseTransaction.setCurrentSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            value: accountLine
        });
        newReverseTransaction.setCurrentSublistValue({
            sublistId: 'line',
            fieldId: typeLine,
            value: creditMemo.amount
        });
        newReverseTransaction.setCurrentSublistValue({
            sublistId: 'line',
            fieldId: 'entity',
            value: creditMemo.customer
        });
        newReverseTransaction.setCurrentSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            value: 'Latam - Reversión de anulación'
        });
        // Departament, Class, Location
        if ((features.department == true || features.department == 'T')) {
            let department = creditMemo.department;
            if (department == '' && (preferences.department == true || preferences.department == 'T')) {
                department = setupTaxSubsidiary.department;
            }

            newReverseTransaction.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'department',
                value: department
            });


        }
        if ((features.class == true || features.class == 'T')) {
            let classs = creditMemo.class;
            if (classs == '' && (preferences.class == true || preferences.class == 'T')) {
                classs = setupTaxSubsidiary.class;
            }

            newReverseTransaction.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'class',
                value: classs
            });


        }
        if ((features.location == true || features.location == 'T')) {
            let location = creditMemo.location;
            if (location == '' && (preferences.location == true || preferences.location == 'T')) {
                location = setupTaxSubsidiary.location;
            }

            newReverseTransaction.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'location',
                value: location
            });


        }

        newReverseTransaction.commitLine({
            sublistId: 'line'
        });

    }

    /* ------------------------------------------------------------------------------------------------------
    * Esta funcion permite desaplicar la nota de credito de la anulacion y aplicar el journal creado
    * --------------------------------------------------------------------------------------------------- */
    let applyAndDisapply = (creditmemo, newJournal) => {
        const recordCreditMemo = record.load({ type: "creditmemo", id: creditmemo.id, isDynamic: true });
        const countTransaction = recordCreditMemo.getLineCount({ sublistId: 'apply' });
        for (let i = 0; i < countTransaction; i++) {
            recordCreditMemo.selectLine({ sublistId: 'apply', line: i });

            let isApply = recordCreditMemo.getSublistValue('apply', 'apply', i);
            if (isApply == true || isApply == 'T') {
                recordCreditMemo.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: false });
                break;
            }
        }
        for (let i = 0; i < countTransaction; i++) {
            recordCreditMemo.selectLine({ sublistId: 'apply', line: i });
            if (newJournal) {
                let transactionId = recordCreditMemo.getSublistValue("apply", "internalid", i);
                if (transactionId == newJournal) {
                    recordCreditMemo.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                    break;
                }
            }
        }


        recordCreditMemo.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });

    }


    return { getRecordsLog, getParameters, updateState, reverseCancellation, updateTransactionState };
});