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
    let reverseCancellation = (transactionMain) => {
        let transactionsResult;
        transactionMain.typeTransaction = getTypeTransaction(transactionMain.typeTransaction);
        log.error("cancellations",transactionMain)
        if (transactionMain.typeTransaction == "invoice") { 
            log.error("debug","entro al proceso de invoice")
            transactionsResult = processInvoice(transactionMain);
        } else if(transactionMain.typeTransaction == "creditmemo" || transactionMain.typeTransaction == "customerpayment"){ 
            transactionsResult = processOtherTransaction(transactionMain);
        }
        return transactionsResult;
    }

    let getTypeTransaction = (type) => {
        let typeTransaction = {
            7: "invoice",
            10: "creditmemo",
            9: "customerpayment"
        }
        return typeTransaction[type]
    }

    let processOtherTransaction = (transactionMain) => {
        const transactionVoided = getTransactionVoided(transactionMain);
        const transactionReserve = createTransactionReserve(transactionVoided, transactionMain);
        desapplyTransactionMain(transactionMain);
        updateStateTransaction(transactionMain);
        return {void: transactionVoided.id, reverse: transactionReserve };
    }

    let getTransactionVoided = (cancellations) => {
        const { idTransaction, typeTransaction } = cancellations;
        let transactionVoided = {
            debit:{},
            credit:{}
        };
        let features = getFeatures();
        let searchType = typeTransaction == "creditmemo" ? "customtransaction_lmry_ei_voided_transac" : search.Type.JOURNAL_ENTRY;
        let searchCreditMemo = search.create({
            type: searchType,
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
                    search.createColumn({ name: "entity", label: "Name" }),
                    search.createColumn({ name: "debitamount", label: "Amount (Debit)"})
                ],
            settings: []
        });

        if (features.subsidiary == 'T'|| features.subsidiary == true) {
            searchCreditMemo.settings.push(search.createSetting({ name: 'consolidationtype', value: 'NONE' }));
        }
        if (features.department == 'T' || features.department == true) {
            searchCreditMemo.columns.push(search.createColumn({ name: "department", label: "department" }))
        }
        if (features.class == 'T' || features.class == true) {
            searchCreditMemo.columns.push(search.createColumn({ name: "class", label: "class" }))
        }
        if (features.location == 'T' || features.location == true) {
            searchCreditMemo.columns.push(search.createColumn({ name: "location", label: "location" }))
        }


        searchCreditMemo.run().each(function (result) {
            log.error("result",result);
            transactionVoided.id = result.getValue('internalid');
            transactionVoided.subsidiary = result.getValue('subsidiary');
            transactionVoided.currency = result.getValue('currency');
            transactionVoided.customer = result.getValue('entity');
            transactionVoided.department = result.getValue('department') || '';
            transactionVoided.class = result.getValue('class') || '';
            transactionVoided.location = result.getValue('location') || '';
            transactionVoided.amount = Math.abs(result.getValue('fxamount'));
            transactionVoided.entity = result.getValue('entity');
            transactionVoided.debit.amount = result.getValue('debitamount');
            
            log.error("transactionVoided.debit.amoun",transactionVoided.debit.amount);
            log.error("result.getValue('debitamount')",result.getValue('debitamount'));
            log.error("result.getValue('debitamount')",typeof result.getValue('debitamount'));
            if (transactionVoided.debit.amount == '') { 
                log.error("debug","cuenta secundaria");
                transactionVoided["credit"]["account"] = result.getValue('account');   
            }else{
                transactionVoided["debit"]["account"] = result.getValue('account'); 
            }
            return true;
        });
        return transactionVoided;
    }



    
    let processInvoice = (transactionMain)=>{
        const {idTransaction} = transactionMain;
        const creditMemo = getCreditMemo(idTransaction);
        const newJournal = createTransactionReserve(creditMemo, transactionMain);
        applyAndDisapply(creditMemo, newJournal,idTransaction);
        updateStateTransaction(transactionMain);
        return {void: creditMemo.id, reverse: newJournal};
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
                    search.createColumn({ name: "entity", label: "Name" }),
                    search.createColumn({ name: "postingperiod", label: "postingperiod" })
                ],
            settings: []
        });

        if (features.subsidiary == 'T'|| features.subsidiary == true) {
            searchCreditMemo.settings.push(search.createSetting({ name: 'consolidationtype', value: 'NONE' }));
        }
        if (features.department == 'T' || features.department == true) {
            searchCreditMemo.columns.push(search.createColumn({ name: "department", label: "department" }))
        }
        if (features.class == 'T' || features.class == true) {
            searchCreditMemo.columns.push(search.createColumn({ name: "class", label: "class" }))
        }
        if (features.location == 'T' || features.location == true) {
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
            creditMemo.entity = result.getValue('entity');
            creditMemo.date = result.getValue('trandate') || '';
            creditMemo.period = result.getValue('postingperiod') || '';
            return true;
        });
        return creditMemo;

    }

    let updateStateTransaction = (cancellations) => {
        const { idTransaction, typeTransaction } = cancellations;
        record.submitFields({
            type: typeTransaction,
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
    let createTransactionReserve = (transactionVoid, cancellations) => {
        log.error("transactionVoid",transactionVoid)
        const { idTransaction, accountSetup, typeTransaction } = cancellations;
        let preference = getPreference();
        let newType = typeTransaction == "invoice" ? record.Type.JOURNAL_ENTRY : "customtransaction_lmry_ei_voided_transac";

        let newTransactionReserve = record.create({ type: newType, isDynamic: true });

        newTransactionReserve.setValue({ fieldId: 'subsidiary', value: transactionVoid.subsidiary });
        
        let dateFormat = format.parse({ value: new Date(), type: format.Type.DATE });
        
        
        let postingPeriod = getAccountingperiod(dateFormat)
        
        newTransactionReserve.setValue({ fieldId: 'trandate', value: dateFormat });
        newTransactionReserve.setValue({ fieldId: 'postingperiod', value: postingPeriod });
        newTransactionReserve.setValue({ fieldId: 'currency', value: transactionVoid.currency });
        newTransactionReserve.setValue({ fieldId: 'custbody_lmry_reference_transaction', value: idTransaction }); 
        newTransactionReserve.setValue({ fieldId: 'custbody_lmry_reference_transaction_id', value: idTransaction });
        newTransactionReserve.setValue({ fieldId: 'custbody_lmry_reference_entity', value: transactionVoid.entity});
        newTransactionReserve.setValue({ fieldId: 'memo', value: "Latam - Reversión de anulación" });
        setExchangeRateBook(transactionVoid.id, newTransactionReserve);
        let setupTaxSubsidiary = getSetupTaxSubsidiary(transactionVoid.subsidiary);
        
        if (typeTransaction == "invoice") {
            setLineNewTransactionReserve(newTransactionReserve, 'debit', transactionVoid, transactionVoid.account, setupTaxSubsidiary);
            setLineNewTransactionReserve(newTransactionReserve, 'credit', transactionVoid, accountSetup, setupTaxSubsidiary);
            if (preference.journal == 'T' ||  preference.journal == true) {
                newTransactionReserve.setValue({ fieldId: 'approvalstatus', value: 2 });
            }
        }else{
            setLineNewTransactionReserve(newTransactionReserve, 'debit', transactionVoid, transactionVoid.credit.account, setupTaxSubsidiary);
            setLineNewTransactionReserve(newTransactionReserve, 'credit', transactionVoid, transactionVoid.debit.account, setupTaxSubsidiary);
        }
        
        

        return newTransactionReserve.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
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
    * Esta funcion permite llenar los valores a cada lineas de la transaccion que revierte la anulacion con las configuraciones correspondientes.
    * --------------------------------------------------------------------------------------------------- */
    let setLineNewTransactionReserve = (newReverseTransaction, typeLine, transactionVoid, accountLine, setupTaxSubsidiary) => {
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
            value: transactionVoid.amount
        });
        newReverseTransaction.setCurrentSublistValue({
            sublistId: 'line',
            fieldId: 'entity',
            value: transactionVoid.customer
        });
        newReverseTransaction.setCurrentSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            value: 'Latam - Reversión de anulación'
        });
        // Departament, Class, Location
        if ((features.department == true || features.department == 'T')) {
            let department = transactionVoid.department;
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
            let classs = transactionVoid.class;
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
            let location = transactionVoid.location;
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
    let applyAndDisapply = (transactionVoid, transactionReverse, transactionMainId) => {
        
        const recordtransactionVoid = record.load({ type: "creditmemo", id: transactionVoid.id, isDynamic: true });
        const countTransaction = recordtransactionVoid.getLineCount({ sublistId: 'apply' });

        
        for (let i = 0; i < countTransaction; i++) {
            recordtransactionVoid.selectLine({ sublistId: 'apply', line: i });

            let isApply = recordtransactionVoid.getSublistValue('apply', 'apply', i);
            if (isApply == true || isApply == 'T') {
                recordtransactionVoid.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: false });
                break;
            }
        }

        for (let i = 0; i < countTransaction; i++) {
            recordtransactionVoid.selectLine({ sublistId: 'apply', line: i });
            if (transactionReverse) {
                let transactionId = recordtransactionVoid.getSublistValue("apply", "internalid", i);
                if (transactionId == transactionReverse) {
                    recordtransactionVoid.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                    break;
                }
            }
        }

        changeReferenceTransaction(recordtransactionVoid, transactionMainId);

        recordtransactionVoid.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });

    }

    let changeReferenceTransaction = (transactionVoid, transactionMainId) => {
        transactionVoid.setValue({ fieldId: 'custbody_lmry_reference_transaction', value: transactionMainId }); 
        transactionVoid.setValue({ fieldId: 'custbody_lmry_reference_transaction_id', value: transactionMainId });
    }

    let desapplyTransactionMain = (transactionMain) => {
        try {
            const { idTransaction, typeTransaction } = transactionMain;

            const recordtransactionVoid = record.load({ type: typeTransaction, id: idTransaction, isDynamic: true });

            const countTransaction = recordtransactionVoid.getLineCount({ sublistId: 'apply' });


            for (let i = 0; i < countTransaction; i++) {

                let isApply = recordtransactionVoid.getSublistValue('apply', 'apply', i);

                if (isApply == 'T' || isApply == true) {

                    recordtransactionVoid.selectLine({ sublistId: 'apply', line: i });
                    recordtransactionVoid.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: false });
                    break;
                }
            }

            changeReferenceTransaction(recordtransactionVoid, idTransaction);

            recordtransactionVoid.save({ enableSourcing: true, ignoreMandatoryFields: true, disableTriggers: true });
        } catch (error) {
            log.erro("error [desapplyTransactionMain]",error);
        }
        
    }
    


    return { getRecordsLog, getParameters, updateState, reverseCancellation, updateTransactionState };
});