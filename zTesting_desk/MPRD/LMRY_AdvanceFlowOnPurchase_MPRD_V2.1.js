/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name LMRY_AdvanceFlowOnPurchase_MPRD_V2.1.js
 * @Author LatamReady - Jose Navarro
 * @Date 05/29/2023
 */
define([
    'N/log',
    'N/record',
    'N/search',
    'N/runtime',
    '../Send Email/LMRY_SendEmail_LBRY_V2.1',
    '../Handlers/LMRY_HandlerTax_LBRY_V2.1',
    '../Handlers/LMRY_HandlerWht_LBRY_V.2.1',
    './LMRY_AdvanceFlow_LBRY_V2.1'
], (nLog, nRecord, nSearch, nRuntime , SendEmail_LBRY, HandlerTax_LBRY, HandlerWht_LBRY, AdvanceFlow_LBRY ) => {

    const { sendErrorEmail, sendAFDetailsEmail } = SendEmail_LBRY;

    const LMRY_SCRIPT = 'LR Advance Flow On Purchase MPRD V2.1';

    /**
     * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
     * @param {Object} inputContext
     * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {Object} inputContext.ObjectRef - Object that references the input data
     * @typedef {Object} ObjectRef
     * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
     * @property {string} ObjectRef.type - Type of the record instance that contains the input data
     * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
     * @since 2015.2
     */
    const getInputData = (inputContext) => {

        const { afStsProcessing, afStsUnprocessed } = AdvanceFlow_LBRY.getFieldTranslations();

        const { status: STATE_ID, user: USER_ID} =  JSON.parse(nRuntime.getCurrentScript().getParameter({ name: 'custscript_lmry_ste_af_purch_log_id' }));

        try {

            const jsonInformation = [];

            const currentLog = nSearch.lookupFields({
                type: 'customrecord_lmry_ste_advance_flow_log',
                id: STATE_ID,
                columns: [
                    'custrecord_lmry_ste_af_log_trans_ids',
                    'custrecord_lmry_ste_af_log_subsidiary',
                    'custrecord_lmry_ste_af_log_subsidiary.country'
                ]
            });

            const subsidiaryId = currentLog['custrecord_lmry_ste_af_log_subsidiary'][0].value;
            const transactionsIds = JSON.parse(currentLog['custrecord_lmry_ste_af_log_trans_ids']);
            const country = currentLog['custrecord_lmry_ste_af_log_subsidiary.country'][0].value;

            for ( let i = 0; i < transactionsIds.length; i++ ) {
                jsonInformation.push({
                    key: i,
                    values: {
                        transactionId: transactionsIds[i],
                        country: country,
                        subsidiary: subsidiaryId,
                        stateId: STATE_ID,
                        userId: USER_ID,
                        numberTransactions: transactionsIds.length,
                        transactionPosition: i
                    }
                });
            }

            const summary = { corrects: 0, incorrects: 0 }
            _updateStatus( STATE_ID, afStsProcessing, USER_ID, summary )

            return jsonInformation;

        } catch (error) {

            const summary = { corrects: 0, incorrects: 0 }
            _updateStatus( STATE_ID, afStsUnprocessed, USER_ID, summary )

            sendErrorEmail( `[ getInputData ] : ${error}`, LMRY_SCRIPT );
            nLog.error( `[ ${LMRY_SCRIPT} : getInputData ]`, error );

        }

    }

    /**
     * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
     * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
     * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
     *     provided automatically based on the results of the map stage.
     * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
     *     reduce function on the current group
     * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
     * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {string} reduceContext.key - Key to be processed during the reduce stage
     * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
     *     for processing
     * @since 2015.2
     */
    const reduce = (reduceContext) => {

        const { transactionId, country, stateId, userId, numberTransactions, transactionPosition } = JSON.parse(reduceContext.values[0]).values;
        let possibleError = '';

        try {

            _setCorrectTransactionsCount( stateId );

            if (reduceContext.isRestarted && reduceContext.executionNo > 1) {

                possibleError = 'Reinicio';

                reduceContext.write({
                    key: transactionId,
                    value: ['R', country, possibleError, numberTransactions, stateId]
                });

            }

            const transactionSearch = nSearch.lookupFields({ type: nSearch.Type.TRANSACTION, columns: ['type'], id: transactionId }).type[0].value;
            let transactionType = '';
            let hasPrePrintedFeature = false;

            if ( transactionSearch === 'VendBill' ) {
                transactionType = 'vendorbill';
            }

            if ( transactionSearch === 'VendCred' ) {
                transactionType = 'vendorcredit';
            }

            const currentTransaction = nRecord.load({ type: transactionType, id: transactionId });

            const fiscalDocType = currentTransaction.getValue({ fieldId: 'custbody_lmry_ste_fiscal_doctype' });
            const serieCxc = currentTransaction.getValue({ fieldId: 'custbody_lmry_ste_print_series_cxc' });

            if ( fiscalDocType && fiscalDocType !== '') {

                let docTypeCode = ''

                if( country === 'BR' ) {

                    docTypeCode = nSearch.lookupFields({
                        type: 'customrecord_lmry_ste_fiscal_docume_type',
                        id: fiscalDocType,
                        columns: ['custrecord_lmry_ste_fdt_voucher_type_cod']
                    }).custrecord_lmry_ste_fdt_voucher_type_cod;

                    if ( docTypeCode === '55' || docTypeCode === '57' ) {
                        hasPrePrintedFeature = true
                    }

                }

            }

            if ( hasPrePrintedFeature === true && serieCxc !== null && serieCxc !== '' && serieCxc !== -1 ) {
                possibleError = 'Set PrePrinted';
                _setPrePrinted( currentTransaction, country );
            }

            if ( country === 'BR' && transactionType === 'vendorbill' ) {

                possibleError = 'Set Settings To Tax Calculation and WHT Calculation';

                _settingsToTaxCalculation( currentTransaction );
                _settingsToWhtCalculation( currentTransaction );
            }

            currentTransaction.save({ enableSourcing: false, ignoreMandatoryFields: true, disableTriggers: true });

            const scriptContext = {
                type: 'edit',
                newRecord: {
                    id: transactionId,
                    type: transactionType
                }
            };

            if ( country === 'BR' && transactionType === 'vendorbill' ) {

                possibleError = 'Execute Tax and WHT Calculation';

                const { setTaxTransaction } = HandlerTax_LBRY.getHandlerTax( country, "Purchase", transactionType);
                setTaxTransaction(scriptContext);

                const transactionAppliesTo = currentTransaction.getValue({ fieldId: 'custbody_lmry_ste_whttax_appliesto' }) || '';

                const appliestoCode = nSearch.lookupFields({
                    type: "customrecord_lmry_ste_applies_to",
                    id: transactionAppliesTo,
                    columns: [ "custrecord_lmry_ste_appliesto_code" ]
                }).custrecord_lmry_ste_appliesto_code;

                const { setWhtTransaction } = HandlerWht_LBRY.getHandlerWht( country, "Purchase", appliestoCode);
                setWhtTransaction( scriptContext );

            }

            possibleError = '';

            reduceContext.write({
                key: transactionId,
                value: ['T', country, possibleError, numberTransactions, stateId]
            });

        } catch (error) {

            const incorrectTransactions = Number(numberTransactions) - Number(transactionPosition);

            const summary = { corrects: transactionPosition, incorrects: incorrectTransactions }
            _updateStatus( stateId, 'ERROR', userId, summary );

            if ( !error.valueOf().toString().includes('SSS_REQUEST_TIME_EXCEEDED') ) {
                reduceContext.write({
                    key: transactionId,
                    value: ['F', country, possibleError, numberTransactions, stateId]
                });
            } else {
                reduceContext.write({
                    key: transactionId,
                    value: ['T', country, possibleError, numberTransactions, stateId]
                });
            }

            sendErrorEmail( `[ reduce ] : ${error}`, LMRY_SCRIPT );
            nLog.error( `[ ${LMRY_SCRIPT} : reduce ]`, error );

        }

    }

    /**
     * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
     * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
     * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
     * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
     *     script
     * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
     * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
     * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
     * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
     *     script
     * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
     * @param {Object} summaryContext.inputSummary - Statistics about the input stage
     * @param {Object} summaryContext.mapSummary - Statistics about the map stage
     * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
     * @since 2015.2
     */
    const summarize = (summaryContext) => {

        try {

            const { afStsFinished,afCommentOne,afCommentTwo,afCommentThree } = AdvanceFlow_LBRY.getFieldTranslations();
            const { getJsonState, getTransactionsDetail } = AdvanceFlow_LBRY;
            const transactionsErrors = [];

            let country = '';
            let possibleError = '';
            let numberTransactions = 0;
            let status = '';
            let stateId = '';

            summaryContext.output.iterator().each( (key, value) => {

                [status, country, possibleError, numberTransactions, stateId] = JSON.parse(value);

                if ( status === 'F' || status === 'R') {
                    transactionsErrors.push({ id: key, error: possibleError });
                }

                return true;

            });

            const currentAdvanceFlowLog = nRecord.load({ type: 'customrecord_lmry_ste_advance_flow_log', id: stateId });
            const correctTransactions = numberTransactions - transactionsErrors.length;

            const advanceFlowSummary = {
                corrects: correctTransactions,
                incorrects: transactionsErrors.length>0 ? `${transactionsErrors.length}|${JSON.stringify(transactionsErrors)}` : 0
            }

            currentAdvanceFlowLog.setValue({ fieldId: 'custrecord_lmry_ste_af_log_summary', value: JSON.stringify( advanceFlowSummary )});
            currentAdvanceFlowLog.setValue({ fieldId: 'custrecord_lmry_ste_af_log_comments', value: `${afCommentOne} ${correctTransactions} ${afCommentTwo} ${transactionsErrors.length} ${afCommentThree}` });
            currentAdvanceFlowLog.setValue({ fieldId: 'custrecord_lmry_ste_af_log_status', value: afStsFinished });

            currentAdvanceFlowLog.save({ disableTriggers: true, ignoreMandatoryFields: true });

            const subsidiary = currentAdvanceFlowLog.getText('custrecord_lmry_ste_af_log_subsidiary');
            const transactionIds = JSON.parse(currentAdvanceFlowLog.getValue('custrecord_lmry_ste_af_log_trans_ids'));

            const transactionDetails = getTransactionsDetail(transactionIds);
            const states = getJsonState(summary, transactionIds);


            sendAFDetailsEmail(subsidiary,transactionDetails,states);
        } catch (error) {
            sendErrorEmail( `[ summarize ] : ${error}`, LMRY_SCRIPT );
            nLog.error( `[ ${LMRY_SCRIPT} : summarize ]`, error );
        }

    }

    const _updateStatus = (paramStateId, paramStatus, paramUserId, paramSummary) =>{

        nRecord.submitFields({
            type: 'customrecord_lmry_ste_advance_flow_log',
            id: paramStateId,
            values: {
                custrecord_lmry_ste_af_log_status: paramStatus,
                custrecord_lmry_ste_af_log_user: paramUserId,
                custrecord_lmry_ste_af_log_summary: JSON.stringify(paramSummary)
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
                disableTriggers: true
            }
        });

    }

    const _setCorrectTransactionsCount = ( paramStateId ) => {

        const advanceFlowSearch = nSearch.lookupFields({
            type: 'customrecord_lmry_ste_advance_flow_log',
            id: paramStateId,
            columns: ['custrecord_lmry_ste_af_log_summary']
        }).custrecord_lmry_ste_af_log_summary;

        let advanceFlowSummary = JSON.parse( advanceFlowSearch );

        advanceFlowSummary.corrects = parseInt( advanceFlowSummary.corrects );
        advanceFlowSummary.corrects++;
        advanceFlowSummary = JSON.stringify( advanceFlowSummary );

        nRecord.submitFields({
            type: 'customrecord_lmry_ste_advance_flow_log',
            id: paramStateId,
            values: {
                custrecord_lmry_ste_af_log_summary: advanceFlowSummary
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
                disableTriggers: true
            }
        });

    }

    const _setPrePrinted = ( paramTransaction, paramCountry ) => {

        const prePrintedNumber = paramTransaction.getValue('custbody_lmry_ste_preprinted_number');
        const seriesCxc = paramTransaction.getValue('custbody_lmry_ste_print_series_cxc');

        if ( paramCountry === 'BR' && ( prePrintedNumber === null || prePrintedNumber === '' ) ) {

            const printSeriesSearch = nSearch.create({
                type: 'customrecord_lmry_ste_print_serie_cxc',
                filters: [ ['internalid', 'anyof', seriesCxc] ],
                columns: [
                    nSearch.createColumn({
                        name: 'formulanumeric',
                        formula: '{custrecord_lmry_ste_ps_numb_serie}'
                    }),
                    'custrecord_lmry_ste_ps_end_range',
                    'custrecord_lmry_ste_ps_numb_digits'
                ]
            }).run().getRange({ start: 0, end: 1 });

            const columnsSearch = printSeriesSearch.columns;

            const numberSeries = parseInt(printSeriesSearch.getValue(columnsSearch[0])) + 1;
            const endRange = parseInt(printSeriesSearch[0].getValue(columnsSearch[1]));
            const numberOfDigits = parseInt(printSeriesSearch[0].getValue(columnsSearch[2]));

            if ( numberOfDigits && numberOfDigits !== 0 && numberSeries <= endRange) {

                let fillZeros = '';
                const lengthNumberSeries = String(numberSeries).length;

                for (let i = 0; i < (numberOfDigits - lengthNumberSeries ); i++) {
                    fillZeros += '0';
                }

                if ( numberSeries && numberSeries !== 0 ) {

                    paramTransaction.setValue({
                        fieldId: 'custbody_lmry_ste_preprinted_number',
                        value: ( fillZeros + numberSeries )
                    });

                    nRecord.submitFields({
                        type: 'customrecord_lmry_ste_print_serie_cxc',
                        id: seriesCxc,
                        values: {
                            custrecord_lmry_ste_ps_numb_serie: numberSeries
                        },
                        options: {
                            ignoreMandatoryFields: true,
                            disableTriggers: true,
                            enableSourcing: false
                        }
                    });

                }

                _setTranId( paramTransaction, seriesCxc, prePrintedNumber );

            }

        }

    }

    const _setTranId = ( paramTransaction, paramSeriesCxc, paramPrePrintedNumber ) => {

        const tranPrefix = _getTranPrefix( paramTransaction );
        const seriesCxcName = _getSeriesCxCName( paramSeriesCxc );
        const documentTypeInitials = _getDocumentTypeInitials( paramTransaction );

        const textTranId = ( tranPrefix && tranPrefix !== '' )
            ? tranPrefix + ' ' + documentTypeInitials.toUpperCase() + ' ' + seriesCxcName + '-' + paramPrePrintedNumber
            : documentTypeInitials.toUpperCase() + ' ' + seriesCxcName + '-' + paramPrePrintedNumber

        if ( textTranId && textTranId !== '' ) {
            paramTransaction.setValue({ fieldId: 'tranid', value: textTranId });
        }

    }

    const _getSeriesCxCName = ( paramSeriesCxc ) =>{

        let seriesCxcName = '';

        if ( paramSeriesCxc  && paramSeriesCxc !== '' ) {

            seriesCxcName = nSearch.lookupFields({
                type: 'customrecord_lmry_ste_print_serie_cxc',
                id: paramSeriesCxc,
                columns: ['name']
            }).name;

        }

        return seriesCxcName;

    }

    const _getTranPrefix = ( paramTransaction ) => {

        const FEATURE_SUBSIDIARY = nRuntime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
        let tranPrefix = '';

        if ( FEATURE_SUBSIDIARY ) {

            const transactionSubsidiaryId = paramTransaction.getValue({ fieldId: 'subsidiary' });

            tranPrefix = nSearch.lookupFields({
                type: 'subsidiary',
                id: transactionSubsidiaryId,
                columns: ['tranprefix']
            }).tranprefix;

        }

        return tranPrefix;

    }

    const _getDocumentTypeInitials = ( paramTransaction ) => {

        let documentTypeInitials = '';
        const documentType = paramTransaction.getValue({ fieldId: 'custbody_lmry_ste_fiscal_doctype' });

        if ( documentType && documentType !== '' ) {

            documentTypeInitials = nSearch.lookupFields({
                type: 'customrecord_lmry_ste_fiscal_docume_type',
                id: documentType,
                columns: ['custrecord_lmry_doc_initials']
            }).custrecord_lmry_doc_initials;

        }

        return documentTypeInitials;

    }

    const _settingsToWhtCalculation = ( paramTransaction ) => {

        _settingApprovalStatus( paramTransaction );
        _settingAppliesToField( paramTransaction );
        _settingApplyWhtColum( paramTransaction );

    }

    const _settingApprovalStatus = ( paramTransaction ) => {

            const approvalStatus = paramTransaction.getValue({ fieldId: 'approvalstatus' });
            if ( Number(approvalStatus) !== 2 ) paramTransaction.setValue({ fieldId: 'approvalstatus', value: 2 })

    }

    const _settingAppliesToField = ( paramTransaction ) => {

        const appliesToSearch = nSearch.create({
            type: 'customrecord_lmry_ste_applies_to',
            filters: ['custrecord_lmry_ste_appliesto_code', 'is', 'lines'],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        const appliesToId = appliesToSearch[0].getValue('internalid');

        paramTransaction.setValue({
            fieldId: 'custbody_lmry_ste_whttax_appliesto',
            value: appliesToId
        })

    }

    const _settingApplyWhtColum = ( paramTransaction ) => {

        const itemLines = paramTransaction.getLineCount({ sublistId: 'item' });

        for ( let i = 0; i < itemLines; i++ ) {

            const itemType = paramTransaction.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
            const appliesToWht = paramTransaction.getSublistValue({ sublistId: "item", fieldId: "custcol_lmry_ste_apply_wht", line: i });

            if (['Group', 'EndGroup', 'Discount'].includes(itemType)) continue;

            if ( appliesToWht === false ) {
                paramTransaction.setSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_ste_apply_wht', line: i, value: true });
            }
        }

    }

    const _settingsToTaxCalculation = ( paramTransaction ) => {

        const taxDetailOverride = paramTransaction.getValue({ fieldId: 'taxdetailsoverride' });
        if ( !taxDetailOverride || taxDetailOverride === false || taxDetailOverride === 'F' ) paramTransaction.setValue({ fieldId: 'taxdetailsoverride', value: true });

    }

    return {getInputData, reduce, summarize}

});
