/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name LRMY_AdvanceFlowOnSales_MPRD_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 05/09/2023
 */
define(['N/log',
        'N/runtime', 
        'N/search',
        'N/config',
        'N/record',
        "../../Latam Tools/Handlers/LMRY_HandlerTax_LBRY_V2.1",
        "../../Latam Tools/Handlers/LMRY_HandlerWht_LBRY_V.2.1",
        './LMRY_AdvanceFlow_LBRY_V2.1',
        '../Send Email/LMRY_SendEmail_LBRY_V2.1'
    ],
    
    (nLog,nRuntime,nSearch,nConfig,nRecord,HandlerTax_LBRY,HandlerWht_LBRY,AdvanceFlow_LBRY,SendEmail_LBRY) => {

        // Script information
        const LMRY_SCRIPT = "LR Advance Flow Sales MPRD";
        const LMRY_SCRIPT_NAME = "LRMY_AdvanceFlowOnSales_MPRD_V2.1.js";
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

        let features = {};
        let parameters = {};
        const getInputData = (inputContext) => {

            const translatedFields = AdvanceFlow_LBRY.getFieldTranslations();
            getParameters();
            try {
                getFeatures();

                const transactions = getAdvanceFlowLogRecord();

                let dataList = [];

                transactions.internalIds.forEach((id, index) => {
                    dataList.push({
                        key: index,
                        values: {
                            transactionId: id,
                            country: transactions.country,
                            numberTransactions: transactions.internalIds.length,
                            transactionPosition: index + 1
                        }
                    });
                });

                const summary = {
                    corrects: 0,
                    incorrects: 0
                }
                updateStatus(translatedFields.afStsProcessing, summary);

                return dataList;
            } catch (error) {
                
                const summary = {
                    corrects: 0,
                    incorrects: 0
                }

                updateStatus(translatedFields.afStsUnprocessed, summary);
                nLog.error({ title: `[${LMRY_SCRIPT} : getInputData]`, details: error });
                SendEmail_LBRY.sendErrorEmail(`[ getInputData ] : ${error}`, LMRY_SCRIPT);
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
            getParameters();
            let possibleError;  
            const { transactionId, country, numberTransactions, transactionPosition } = JSON.parse(reduceContext.values[0]).values;
            try {

                getFeatures();
                
                let isSetPrePrinted = true;
                let numberCodeType;
                possibleError = 'Populado';
                setCorrectTransactionsCount(parameters.status);

                if (reduceContext.isRestarted && reduceContext.executionNo > 1) {
                    possibleError = 'Reinicio';
                    reduceContext.write({
                        key: transactionId,
                        value: ['R', country, possibleError,numberTransactions]
                    });
                }
                
                const search_transaction = nSearch.lookupFields({
                    type: nSearch.Type.TRANSACTION,
                    columns: ['type'],
                    id: transactionId
                });
                const transactionTypeRecord = search_transaction.type[0].value;
                let transactionType;

                if (transactionTypeRecord == 'CustInvc') {
                    transactionType = 'invoice';
                }
                if (transactionTypeRecord == 'CustCred') {
                    transactionType = 'creditmemo';
                }

                const currentTransaction = nRecord.load({
                    type: transactionType,
                    id: transactionId
                });

                const documentType = currentTransaction.getValue({ fieldId: 'custbody_lmry_ste_fiscal_doctype' });
                

                if (documentType != null && documentType != '') {
                    if (country == 'BR') {
                        let search_doc_cod = nSearch.lookupFields({
                            type: 'customrecord_lmry_ste_fiscal_docume_type',
                            id: documentType,
                            columns: ['custrecord_lmry_ste_fdt_voucher_type_cod']
                        });
                        numberCodeType = search_doc_cod.custrecord_lmry_ste_fdt_voucher_type_cod;
                        if (numberCodeType != '55' && numberCodeType != '57') {
                            isSetPrePrinted = false;
                        }
                    }
                }

                const serieCxC = currentTransaction.getValue({
                    fieldId: 'custbody_lmry_ste_print_series_cxc'
                });

                if (serieCxC != null && serieCxC != '' && serieCxC != -1 && isSetPrePrinted) {
                    possibleError = 'set Preprinted';
                    setPrePrinted(currentTransaction);
                }

                const scriptContext = {
                    type: 'edit',
                    newRecord: {
                        id: transactionId,
                        type: transactionType
                    }
                };

                if ( country === 'BR' && transactionType === 'invoice' ) {

                    possibleError = 'Set Settings To Tax Calculation and WHT Calculation';
    
                    settingsToTaxCalculation( currentTransaction );
                    settingsToWhtCalculation( currentTransaction );
                }
                
                currentTransaction.save({
                    ignoreMandatoryFields: true,
                    disableTriggers: true
                });


                if (country == 'BR' && transactionType == 'invoice') {
                    possibleError = 'Execute Tax calculation and WHT Calculation';


                    const { setTaxTransaction } = HandlerTax_LBRY.getHandlerTax(country, "Sales", transactionType);

                    if (setTaxTransaction) {
                        setTaxTransaction(scriptContext);
                    }

                    const transAppliesTo = currentTransaction.getValue({ fieldId: "custbody_lmry_ste_whttax_appliesto" }) || "";
                    const appliestoCode = nSearch.lookupFields({
                        type: "customrecord_lmry_ste_applies_to",
                        id: transAppliesTo,
                        columns: [ "custrecord_lmry_ste_appliesto_code" ]
                    }).custrecord_lmry_ste_appliesto_code;
                    

                    const { setWhtTransaction } = HandlerWht_LBRY.getHandlerWht(country, "Sales", appliestoCode);
                    if (setWhtTransaction) {
                        setWhtTransaction(scriptContext);
                    }

                   
                }
                possibleError = '';
                reduceContext.write({
                    key: transactionId,
                    value: ['T', country, possibleError,numberTransactions]
                });
                

            } catch (error) {

                nLog.error({ title: `[${LMRY_SCRIPT} : reduce]`, details: error });
                if (error.valueOf().toString().indexOf('SSS_REQUEST_TIME_EXCEEDED') == -1) {
                    reduceContext.write({
                        key: transactionId,
                        value: ['F', country, possibleError,numberTransactions]
                    });
                } else {
                    reduceContext.write({
                        key: transactionId,
                        value: ['T', country, possibleError,numberTransactions]
                    });
                }
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
                getParameters();

                const { afStsFinished,afCommentOne,afCommentTwo,afCommentThree } = AdvanceFlow_LBRY.getFieldTranslations();
                const { getJsonState, getTransactionsDetail } = AdvanceFlow_LBRY;

                let transactionsErrors = [];
                let statusError = '';
                let country = '';
                let possibleError = '';
                let numberTransactions = 0; 
                
                summaryContext.output.iterator().each( (key, value) => {

                    [statusError, country, possibleError, numberTransactions] = JSON.parse(value);
    
                    if ( statusError === 'F' || statusError === 'R') {
                        transactionsErrors.push({ id: key, error: possibleError });
                    }
    
                    return true;
    
                });

                const transactionRecord = nRecord.load({ type: 'customrecord_lmry_ste_advance_flow_log', id: parameters.status });
                const correctsTransacctions = numberTransactions - transactionsErrors.length;

                const summary = JSON.stringify({
                    corrects: correctsTransacctions,
                    incorrects: transactionsErrors.length>0 ? `${transactionsErrors.length}|${JSON.stringify(transactionsErrors)}` : 0
                });
                transactionRecord.setValue({ fieldId: 'custrecord_lmry_ste_af_log_summary', value: summary});

                transactionRecord.setValue({ 
                    fieldId: 'custrecord_lmry_ste_af_log_comments', 
                    value: `${afCommentOne} ${correctsTransacctions} ${afCommentTwo} ${transactionsErrors.length} ${afCommentThree}`
                });
                
                transactionRecord.setValue({ 
                    fieldId: 'custrecord_lmry_ste_af_log_status', 
                    value: afStsFinished
                });

                transactionRecord.save({ disableTriggers: true, ignoreMandatoryFields: true });

                const subsidiary = transactionRecord.getText('custrecord_lmry_ste_af_log_subsidiary');
                const transactionIds = JSON.parse(transactionRecord.getValue('custrecord_lmry_ste_af_log_trans_ids'));

                const transactionDetails = getTransactionsDetail(transactionIds);
                const states = getJsonState(summary,transactionIds);
                

                SendEmail_LBRY.sendAFDetailsEmail(subsidiary,transactionDetails,states);

            } catch (error) {
                nLog.error({ title: `[${LMRY_SCRIPT} : summarize]`, details: error });
                SendEmail_LBRY.sendErrorEmail(`[ summarize ] : ${error}`, LMRY_SCRIPT);
            }
        }

        const getFeatures = () =>{
            features.subsidiary = nRuntime.isFeatureInEffect({
                feature: 'SUBSIDIARIES'
            });
        }

        const getParameters = () =>{
            try {
                parameters = JSON.parse(nRuntime.getCurrentScript().getParameter({
                    name: 'custscript_lmry_ste_af_sales_log_id'
                }));
            } catch (error) {
                SendEmail_LBRY.sendErrorEmail(`[ getParameters ] : ${error}`, LMRY_SCRIPT);
            }
            /* PARAMETERS
            {
                user,
                status
            }
            */
        }

        const getAdvanceFlowLogRecord = () =>{
            let transactions = {};
            let currentLog = nSearch.lookupFields({
                type: 'customrecord_lmry_ste_advance_flow_log',
                id: parameters.status,
                columns: ['custrecord_lmry_ste_af_log_trans_ids',
                    'custrecord_lmry_ste_af_log_subsidiary.country',
                    'custrecord_lmry_ste_af_log_subsidiary']
            });

            if (features.subsidiary) {
                transactions.country = currentLog['custrecord_lmry_ste_af_log_subsidiary.country'][0].text;
            } else {
                transactions.country = nConfig.load({ type: nConfig.Type.COMPANY_INFORMATION }).getText({fieldId: 'country'});
            }

            transactions.country = transactions.country.substring(0, 2).toUpperCase();
            transactions.subsidiaryId = currentLog['custrecord_lmry_ste_af_log_subsidiary'][0].value;
            transactions.internalIds = JSON.parse(currentLog.custrecord_lmry_ste_af_log_trans_ids);
            return transactions;

        }


        /**
         * The information of the RPS (Recibo Provisório de Serviços) identified
         * by the internal id of the transaction is constructed in an object.
         * @param {Object} transactions - Information from the transaction filtering process obtained through the record
         */

        const updateStatus = (status, summary) =>{

            nRecord.submitFields({
                type: 'customrecord_lmry_ste_advance_flow_log',
                id: parameters.status,
                values: {
                    custrecord_lmry_ste_af_log_status: status,
                    custrecord_lmry_ste_af_log_user: parameters.user,
                    custrecord_lmry_ste_af_log_summary: JSON.stringify(summary)
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true,
                    disableTriggers: true
                }
            });
        }

        const setCorrectTransactionsCount = (stateId) =>{

            let searchLog = nSearch.lookupFields({
                type: 'customrecord_lmry_ste_advance_flow_log',
                id: stateId,
                columns: ['custrecord_lmry_ste_af_log_summary']
            });
            let summary = JSON.parse(searchLog.custrecord_lmry_ste_af_log_summary);
            
            summary.corrects = parseInt(summary.corrects);
            summary.corrects++;
            summary = JSON.stringify(summary);

            nRecord.submitFields({
                type: 'customrecord_lmry_ste_advance_flow_log',
                id: stateId,
                values: {
                    custrecord_lmry_ste_af_log_summary: summary
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true,
                    disableTriggers: true
                }
            });
        }

        const setPrePrinted = (transactionRecord) => {
            let prePrint = transactionRecord.getValue('custbody_lmry_ste_preprinted_number');
            const serieCxc = transactionRecord.getValue('custbody_lmry_ste_print_series_cxc');

            if (prePrint == null || prePrint == '') {

                let wtax_type = nSearch.create({
                    type: 'customrecord_lmry_ste_print_serie_cxc',
                    filters: [
                        ['internalid', 'anyof', serieCxc]
                    ],
                    columns: [
                        nSearch.createColumn({
                            name: 'formulanumeric',
                            formula: '{custrecord_lmry_ste_ps_numb_serie}'
                        }),
                        'custrecord_lmry_ste_ps_end_range',
                        'custrecord_lmry_ste_ps_numb_digits'
                    ]
                });

                const results = wtax_type.run().getRange(0, 1);
                const columns = wtax_type.columns; 
                let numberSerie = parseInt(results[0].getValue(columns[0])) + 1;                  
                const numberSerieStatic = numberSerie;
                const endRange = parseInt(results[0].getValue(columns[1]));
                const numberOfDigits = parseInt(results[0].getValue(columns[2]));
                

                if (numberOfDigits != null && numberOfDigits != '' && numberSerie <= endRange) {
                    const longNumberConsec = parseInt(String(numberSerie).length);
                    let fillZeros = '';

                    for (let i = 0; i < (numberOfDigits - longNumberConsec); i++) {
                        fillZeros += '0';
                    }
                    numberSerie = fillZeros + numberSerie;
                    if (numberSerie != null && numberSerie != '') {
                        transactionRecord.setValue({
                            fieldId: 'custbody_lmry_ste_preprinted_number',
                            value: numberSerie
                        });

                        // Actualiza el numero Correlativo en las series de impresion
                        nRecord.submitFields({
                            type: 'customrecord_lmry_ste_print_serie_cxc',
                            id: serieCxc,
                            values: {
                                custrecord_lmry_ste_ps_numb_serie: numberSerieStatic
                            },
                            options: {
                                disableTriggers: true,
                                ignoreMandatoryFields: true
                            }
                        });
                    }

                    const tranid = setTranId(transactionRecord);
                    transactionRecord.setValue({ fieldId: 'tranid', value: tranid });
                }
            }

        }

        const setTranId = (transactionRecord) => {

            const transPrefix = getPrefix(transactionRecord);
            const documentType = getLegalDocumentType(transactionRecord);
            const printSeries = getPrintSeriesCxC(transactionRecord);  
            const preprintedNumber = transactionRecord.getValue({ fieldId: 'custbody_lmry_ste_preprinted_number' });

            let textTrandId = '';
            if (transPrefix != '' && transPrefix != null) {

                textTrandId = transPrefix + ' ' + documentType.toUpperCase() + ' ' + printSeries + '-' + preprintedNumber;
            } else {

                textTrandId = documentType.toUpperCase() + ' ' + printSeries + '-' + preprintedNumber;
            }
            return textTrandId;

        }

        const getLegalDocumentType = (transactionRecord) =>{
            let documentType = transactionRecord.getValue({ fieldId: 'custbody_lmry_ste_fiscal_doctype' });
            if (documentType != null && documentType != '') {
                const searchDocumentType = nSearch.lookupFields({
                    type: 'customrecord_lmry_ste_fiscal_docume_type',
                    id: documentType,
                    columns: ['custrecord_lmry_doc_initials']
                });
                documentType = searchDocumentType.custrecord_lmry_doc_initials;
            }
            if (documentType == '' || documentType == null) {
                documentType = '';
            }
            return documentType;
        }

        const getPrintSeriesCxC = (transactionRecord) =>{
            let printSeries = '';
            printSeries = transactionRecord.getValue({ fieldId: 'custbody_lmry_ste_print_series_cxc'});
            if (printSeries != null && printSeries != '') {
                const seachPrintSeries = nSearch.lookupFields({
                    type: 'customrecord_lmry_ste_print_serie_cxc',
                    id: printSeries,
                    columns: ['name']
                });
                printSeries = seachPrintSeries.name;
            }
            return printSeries;
        }
        

        const getPrefix =(transactionRecord) =>{
            let prefix = '';
            if (features.subsidiary) {
                let subsidiary = transactionRecord.getValue({ fieldId: 'subsidiary'});
                const searchSubsidiary = nSearch.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['tranprefix']
                });
                prefix = searchSubsidiary.tranprefix;
            }
            return prefix;
        }

        const settingsToTaxCalculation = ( paramTransaction ) => {

            const taxDetailOverride = paramTransaction.getValue({ fieldId: 'taxdetailsoverride' });
            if ( !taxDetailOverride || taxDetailOverride === false || taxDetailOverride === 'F' ) paramTransaction.setValue({ fieldId: 'taxdetailsoverride', value: true });
    
        }

        const settingsToWhtCalculation = ( paramTransaction ) => {

            settingApprovalStatus( paramTransaction );
            settingAppliesToField( paramTransaction );
            settingApplyWhtColum( paramTransaction );
    
        }
    
        const settingApprovalStatus = ( paramTransaction ) => {
    
                const approvalStatus = paramTransaction.getValue({ fieldId: 'approvalstatus' });
                if ( Number(approvalStatus) !== 2 ) paramTransaction.setValue({ fieldId: 'approvalstatus', value: 2 })
    
        }
    
        const settingAppliesToField = ( paramTransaction ) => {
    
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
    
        const settingApplyWhtColum = ( paramTransaction ) => {
    
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

        return {getInputData, reduce, summarize}

    });
