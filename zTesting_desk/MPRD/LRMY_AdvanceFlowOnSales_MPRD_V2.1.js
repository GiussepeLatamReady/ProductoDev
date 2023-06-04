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
        './LMRY_AdvanceFlow_LBRY_V2.1.js',
        '../Send Email/LMRY_SendEmail_LBRY_V2.1.js'
    ],
    
    (nLog,nRuntime,nSearch,nConfig,nRecord,HandlerTax_LBRY,HandlerWht_LBRY,AF_Library,SendEmail_LBRY) => {

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

            const translatedFields = AF_Library.getFieldTranslations();
            getParameters();
            try {
                getFeatures();
                nLog.error('features:', features);
                nLog.error('parameters:', parameters);

                const transactions = getAdvanceFlowLogRecord();
                const jsonRPS = getAllRps(transactions);

                let dataList = [];

                transactions.internalIds.forEach((id, index) => {
                    dataList.push({
                        key: index,
                        values: {
                            id: id,
                            country: transactions.country,
                            quantity: transactions.internalIds.length,
                            countCurrentTransaction: index + 1,
                            rps: jsonRPS[id],
                            prePrintedNumber: ''
                        }
                    });
                });

                const summary = {
                    corrects: 0,
                    incorrects: 0
                }
                updateStatus(translatedFields.afStsProcessing, parameters.user, summary);

                return dataList;
            } catch (error) {
                
                const summary = {
                    corrects: 0,
                    incorrects: 0
                }

                updateStatus(translatedFields.afStsUnprocessed, parameters.user, summary);
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
            let possibleError;
            try {
                getFeatures();
                getParameters();
                const currenData = JSON.parse(reduceContext.values[0].values);
                let isSetPrePrinted = true;
                let numberCodeType;
                possibleError = 'Populado';
                setPercentage();
                 
                if (context.isRestarted && context.executionNo > 1) {
                    possibleError = 'Reinicio';
                    reduceContext.write({
                        key: currenData.id,
                        value: ['R', currenData.country, possibleError,currenData.quantity]
                    });
                }
                
                const search_transaction = nSearch.lookupFields({
                    type: nSearch.Type.TRANSACTION,
                    columns: ['type'],
                    id: currenData.id
                });
                const transactionTypeRecord = search_transaction.type[0].value;
                let transactionType;

                if (transactionTypeRecord == 'CustInvc') {
                    transactionType = 'invoice';
                }
                if (transactionTypeRecord == 'CustCred') {
                    transactionType = 'creditmemo';
                }

                let transactionsRecord = nRecord.load({
                    type: transactionType,
                    id: currenData.id
                });

                const documentType = transactionsRecord.getValue({ fieldId: 'custbody_lmry_ste_fiscal_doctype' });
                

                if (documentType != null && documentType != '') {
                    if (currenData.country == 'BRA') {
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

                const serieCxC = transactionsRecord.getValue({
                    fieldId: 'custbody_lmry_ste_print_series_cxc'
                });

                if (serieCxC != null && serieCxC != '' && serieCxC != -1 && isSetPrePrinted) {
                    possibleError = 'set Preprinted';
                    setPrePrinted(transactionsRecord);
                }

                const scriptContext = {
                    type: 'edit',
                    newRecord: {
                        id: transactionType,
                        type: currenData.id
                    }
                };
                
                if (currenData.country == 'BRA') {
                    transactionsRecord.setValue({
                        fieldId: 'custbody_lmry_ste_apply_wht', //OBS
                        value: true
                    });

                    if (transactionType == 'invoice') {
                        possibleError = 'Tax Result Servicio';
                        const { setTaxTransaction } = HandlerTax_LBRY.getHandlerTax(currenData.country, "Sales", transactionType);
                        
                        if (setTaxTransaction) {
                            setTaxTransaction(scriptContext);
                        }
                    }

                }
                transactionsRecord.save({
                    ignoreMandatoryFields: true,
                    disableTriggers: true
                });

                if (currenData.country == 'BRA' && transactionType == 'invoice') {
                    possibleError = 'set wht Service';
                    let transAppliesTo = transactionsRecord.getValue({ fieldId: "custbody_lmry_ste_whttax_appliesto" }) || "";
                    const { setWhtTransaction } = HandlerWht_LBRY.getHandlerWht(currenData.country, "Sales", transAppliesTo);
                    if (setWhtTransaction) {
                        setWhtTransaction(scriptContext);
                    }
                }
                possibleError = '';

                reduceContext.write({
                    key: currenData.id,
                    value: ['T', currenData.country, possibleError,currenData.quantity]
                });
                

            } catch (error) {

                const currenData = JSON.parse(reduceContext.values[0].values);
                const incorrects = parseInt(currenData.quantity) - parseInt(currenData.countCurrentTransaction);
                const summary = {
                    corrects: currenData.countCurrentTransaction,
                    incorrects: incorrects
                }
                updateStatus('ERROR', parameters.user, summary);

                if (error.valueOf().toString().indexOf('SSS_REQUEST_TIME_EXCEEDED') == -1) {
                    reduceContext.write({
                        key: currenData.id,
                        value: ['F', currenData.country, possibleError,currenData.quantity]
                    });
                } else {
                    reduceContext.write({
                        key: currenData.id,
                        value: ['T', currenData.country, possibleError,currenData.quantity]
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
                let country;
                let totalTransactions;
                let transactionsError = []; 
                const translatedFields = AF_Library.getFieldTranslations();
                summaryContext.output.iterator().each(function (key, value) {
                    value = JSON.parse(value);
                    country = value[1];
                    totalTransactions = value[3]
                    if (value[0] == 'F' || value[0] == 'R') {
                        transactionsError.push({ id:key, error:value[2] });
                    }
                    return true;
                });

                let transactionRecord = nRecord.load({ type: 'customrecord_lmry_ste_advance_flow_log', id: parameters.status });

                if (transactionsError.length>0) {
                    const searchLog = nSearch.lookupFields({
                        type: 'customrecord_lmry_ste_advance_flow_log',
                        id: stateId,
                        columns: ['custrecord_lmry_ste_af_log_summary']
                    });
                    let summary = JSON.parse(searchLog.custrecord_lmry_ste_af_log_summary);
                    summary.incorrects = `${summary.incorrects} : ${transactionsError.toString()}`;

                    transactionRecord.setValue({ fieldId: 'custrecord_lmry_ste_af_log_summary', value: JSON.stringify(summary)});
                }

                transactionRecord.setValue({ 
                    fieldId: 'custrecord_lmry_ste_af_log_comments', 
                    value: `The process has finished and ${totalTransactions} were processed successfully and ${transactionsError.length} were not.`
                });
                transactionRecord.setValue({ 
                    fieldId: 'custrecord_lmry_ste_af_log_status', 
                    value: translatedFields.afStsFinished
                });

                transactionRecord.save({ disableTriggers: true, ignoreMandatoryFields: true });

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
                parameters = nRuntime.getCurrentScript().getParameter({
                    name: 'custscript_lmry_ste_af_sales_log_id'
                });
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

            transactions.country = transactions.country.substring(0, 3).toUpperCase();
            transactions.subsidiaryId = currentLog['custrecord_lmry_ste_af_log_subsidiary'][0].value;
            transactions.internalIds = JSON.parse(currentLog.custrecord_lmry_ste_af_log_trans_ids);
            return transactions;

        }


        /**
         * The information of the RPS (Recibo Provisório de Serviços) identified
         * by the internal id of the transaction is constructed in an object.
         * @param {Object} transactions - Information from the transaction filtering process obtained through the record
         */
        const getAllRps = (transactions) =>{
            
            let jsonRPS = {};
            let RPS = {}
            let applyMunicipalities = true;
            let isSetRPS = true;
            let currentNumber = 0;
            transactions.internalIds.forEach(id=> {
                jsonRPS[id] = '';
            });
            if (transactions.country == 'BRA') {

                let searchBR = nSearch.create({
                    type: 'customrecord_lmry_ste_br_trans_fields',
                    columns: ['internalid', 'custrecord_lmry_ste_brtf_rps', 'custrecord_lmry_ste_brtf_related_transac'],
                    filters: [{
                        name: 'custrecord_lmry_ste_brtf_related_transac',
                        operator: 'anyof',
                        values: transactions.internalIds
                    }]
                });


                let pagedData = searchBR.runPaged({
                    pageSize: 1000
                });
                let page;
                pagedData.pageRanges.forEach( pageRange => {
                    page = pagedData.fetch({
                        index: pageRange.index
                    });
                    page.data.forEach( result => {
                        let idInvoice = result.getValue('custrecord_lmry_ste_brtf_related_transac');
                        let rps = result.getValue('custrecord_lmry_ste_brtf_rps') || '';
                        jsonRPS[idInvoice] = rps;      
                    });
                });

                let jsonSerie = getPrintSeries(transactions.subsidiaryId);

                if (jsonSerie.numberRPS<jsonSerie.rangeEnd) {
                    let cityCode = '';
                    let siafiCode = '';

                    if (features.subsidiary) {
                        let addressSearch = nSearch.lookupFields({
                            type: 'subsidiary',
                            id: subsidiaria,
                            columns: ['address.custrecord_lmry_addr_city', 'address.custrecord_lmry_addr_city_id', 'address.custrecord_lmry_addr_prov_id_siafi']
                        });

                        if (addressSearch['address.custrecord_lmry_addr_city_id']) {
                            cityCode = addressSearch['address.custrecord_lmry_addr_city_id'];
                        }

                        if (addressSearch['address.custrecord_lmry_addr_prov_id_siafi']) {
                            siafiCode = addressSearch['address.custrecord_lmry_addr_prov_id_siafi'];
                        }

                    } else {
                        let configCompany = nConfig.load({
                            type: nConfig.Type.COMPANY_INFORMATION
                        });

                        if (configCompany.hasSubrecord('mainaddress')) {
                            let mainAddress = configCompany.getSubrecord('mainaddress');

                            if (mainAddress.getValue('custrecord_lmry_addr_city_id')) {
                                cityCode = mainAddress.getValue('custrecord_lmry_addr_city_id');
                            }

                            if (mainAddress.getValue('custrecord_lmry_addr_prov_id_siafi')) {
                                siafiCode = mainAddress.getValue('custrecord_lmry_addr_prov_id_siafi');
                            }
                        }
                    }

                    // Sao Paulo, Belo Horizonte, Valinhos, Brasilia
                    let municipalitiesCode = ['3550308', '3106200', '3556206', '5300108'];

                    if (municipalitiesCode.indexOf(cityCode) != -1) {
                        if (jsonSerie.impresion) {
                            RPS += jsonSerie.impresion;
                        }

                        RPS += siafiCode;

                        applyMunicipalities = true;
                    }

                    if (applyMunicipalities) {
                        for (let i in jsonRPS) {
                            if (!jsonRPS[i]) {
                                jsonSerie.numberRPS++;
                                isSetRPS = true;
    
                                isConcatenedRps(transactions.subsidiaryId) ? jsonRPS[i] = RPS + jsonSerie.numberRPS : jsonRPS[i] = jsonSerie.numberRPS;
                            }
                        }
                    }
                }

                // ACTUALIZACION DE SERIE
                if (isSetRPS) {
                    nRecord.submitFields({
                        type: 'customrecord_lmry_ste_print_serie_cxc',
                        id: jsonSerie.internalId,
                        values: {
                            custrecord_lmry_ste_rps_number: jsonSerie.numberRPS
                        },
                        options: {
                            ignoreMandatoryFields: true,
                            disableTriggers: true
                        }
                    });
                }

            }

            return jsonRPS;

        }

        const getPrintSeries = (subsidiary) =>{
            let jsonSerie = {};
            let filtrosSerie = [];
            filtrosSerie[0] = nSearch.createFilter({
                name: 'custrecord_lmry_ste_fdt_voucher_type_cod',
                join: 'custrecord_lmry_ste_ps_fiscal_doctype',
                operator: 'is',
                values: '99'
            });
            filtrosSerie[1] = nSearch.createFilter({
                name: 'isinactive',
                operator: 'is',
                values: 'F'
            });
            if (features.subsidiary) {
                filtrosSerie[2] = nSearch.createFilter({
                    name: 'custrecord_lmry_ste_ps_subsidiary',
                    operator: 'is',
                    values: subsidiary
                });
            }

            let searchSerie = nSearch.create({
                type: 'customrecord_lmry_ste_print_serie_cxc',
                columns: [
                    {
                    name: 'internalid',
                    sort: nSearch.Sort.ASC
                    }, 
                    'custrecord_lmry_ste_ps_initial_range',
                    'custrecord_lmry_ste_ps_end_range',
                    'custrecord_lmry_ste_rps_number',
                    'custrecord_lmry_ste_ps_print_serie'],
                filters: filtrosSerie
            });

            searchSerie.run().each(function (result) {
                jsonSerie.internalId = result.getValue('internalid');
                jsonSerie.impresion = result.getValue('custrecord_lmry_ste_ps_print_serie');
                jsonSerie.numberRPS = parseInt(result.getValue('custrecord_lmry_ste_rps_number'));
                jsonSerie.rangeEnd = parseInt(result.getValue('custrecord_lmry_ste_ps_end_range'));
            });
            
            return jsonSerie;
            
        }

        const isConcatenedRps = (subsidiary) =>{
            let filtrosSetup = [];
            filtrosSetup[0] = nSearch.createFilter({
                name: 'isinactive',
                operator: 'is',
                values: 'F'
            });
            if (features.subsidiary) {
                filtrosSetup[1] = nSearch.createFilter({
                    name: 'custrecord_lmry_ste_sts_subsidiary',
                    operator: 'is',
                    values: subsidiary
                });
            }

            let setupBR = nSearch.create({
                type: 'customrecord_lmry_ste_setuptax_subsi',
                columns: ['custrecord_lmry_ste_sts_is_rps_concat'],
                filters: filtrosSetup
            });

            setupBR = setupBR.run().getRange(0, 1);

            if (setupBR && setupBR.length) {
                return setupBR[0].getValue('custrecord_lmry_ste_sts_is_rps_concat');
            }else {
                return false;
            }
        }

        const updateStatus = (status, user, summary) =>{
            nRecord.submitFields({
                type: 'customrecord_lmry_ste_advance_flow_log',
                id: stateId,
                values: {
                    custrecord_lmry_ste_af_log_status: status,
                    custrecord_lmry_ste_af_log_user: user,
                    custrecord_lmry_ste_af_log_summary: JSON.stringify(summary)
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true,
                    disableTriggers: true
                }
            });
        }

        const setPercentage = (stateId) =>{

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
                const numberSerieStatic = numberSerie;
                const endRange = parseInt(results[0].getValue(columns[1]));
                const numberOfDigits = parseInt(results[0].getValue(columns[2]));
                let numberSerie = parseInt(results[0].getValue(columns[0])) + 1;

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

                    setTranId(transactionRecord);
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

            if (textTrandId != '' && textTrandId != null) {
                transactionRecord.setValue({ fieldId: 'tranid', value: textTrandId });
            }

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

        return {getInputData, reduce, summarize}

    });
