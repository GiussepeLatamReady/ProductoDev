/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name LRMY_AdvanceFlowOnSales_MPRD_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 05/09/2023
 */
define(['N/runtime', 'N/search','N/config','N/record'],
    
    (runtime,search,config,record) => {
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
            getFeatures();
            getParameters()
            log.error('features:',features);
            log.error('parameters:',parameters);
            let transactions = getAdvanceFlowLogRecord();
            
            let jsonRPS = getAllRps(transactions);
            let dataList = [];

            transactions.internalIds.forEach((id,index)=>{
                 dataList.push({
                    key:index,
                    values:{
                        id:id,
                        country:transactions.country,
                        quantity: transactions.internalIds.length,
                        countCurrentTransaction: index+1,
                        rps:jsonRPS[id],
                        prePrintedNumber: ''
                    }
                 });
            });

        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {

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
            try {
                let currenData = JSON.parse(context.values.values);
                var isFact = false;
                var posible_error = 'Populado';
                setPercentage();
                if (context.isRestarted && context.executionNo > 1) {
                    posible_error = 'Reinicio';
                }
            } catch (error) {

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

        }

        const getFeatures = () =>{
            features.subsidiary = runtime.isFeatureInEffect({
                feature: 'SUBSIDIARIES'
            });
        }

        const getParameters = () =>{
            parameters = runtime.getCurrentScript().getParameter({
                name: 'custscript_lmry_ste_af_sales_log_id'
            });

            /* PARAMETERS
            {
                user,
                status
            }
            */
        }

        const getAdvanceFlowLogRecord = () =>{
            let transactions = {};
            let currentLog = search.lookupFields({
                type: 'customrecord_lmry_advance_flow_log',
                id: parameters.status,
                columns: ['custrecord_lmry_ste_af_log_trans_ids',
                    'custrecord_lmry_ste_af_log_subsidiary.country',
                    'custrecord_lmry_ste_af_log_subsidiary']
            });

            if (features.subsidiary) {
                transactions.country = currentLog['custrecord_lmry_ste_af_log_subsidiary.country'][0].text;
            } else {
                transactions.country = config.load({ type: config.Type.COMPANY_INFORMATION }).getText({fieldId: 'country'});
            }

            transactions.country = transactions.country.substring(0, 3).toUpperCase();
            transactions.subsidiaryId = currentLog['custrecord_lmry_ste_af_log_subsidiary'][0].value;
            transactions.internalIds = JSON.parse(currentLog.custrecord_lmry_ste_af_log_trans_ids);
            return transactions;

        }

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

                var searchBR = search.create({
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
                        var addressSearch = search.lookupFields({
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
                        var configCompany = config.load({
                            type: config.Type.COMPANY_INFORMATION
                        });

                        if (configCompany.hasSubrecord('mainaddress')) {
                            var mainAddress = configCompany.getSubrecord('mainaddress');

                            if (mainAddress.getValue('custrecord_lmry_addr_city_id')) {
                                cityCode = mainAddress.getValue('custrecord_lmry_addr_city_id');
                            }

                            if (mainAddress.getValue('custrecord_lmry_addr_prov_id_siafi')) {
                                siafiCode = mainAddress.getValue('custrecord_lmry_addr_prov_id_siafi');
                            }
                        }
                    }

                    // Sao Paulo, Belo Horizonte, Valinhos, Brasilia
                    var municipalitiesCode = ['3550308', '3106200', '3556206', '5300108'];

                    if (municipalitiesCode.indexOf(cityCode) != -1) {
                        if (jsonSerie.impresion) {
                            RPS += jsonSerie.impresion;
                        }

                        RPS += siafiCode;

                        applyMunicipalities = true;
                    }

                    if (applyMunicipalities) {
                        for (var i in jsonRPS) {
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
                    record.submitFields({
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
            var filtrosSerie = [];
            filtrosSerie[0] = search.createFilter({
                name: 'custrecord_lmry_ste_fdt_voucher_type_cod',
                join: 'custrecord_lmry_ste_ps_fiscal_doctype',
                operator: 'is',
                values: '99'
            });
            filtrosSerie[1] = search.createFilter({
                name: 'isinactive',
                operator: 'is',
                values: 'F'
            });
            if (features.subsidiary) {
                filtrosSerie[2] = search.createFilter({
                    name: 'custrecord_lmry_ste_ps_subsidiary',
                    operator: 'is',
                    values: subsidiary
                });
            }

            var searchSerie = search.create({
                type: 'customrecord_lmry_ste_print_serie_cxc',
                columns: [
                    {
                    name: 'internalid',
                    sort: search.Sort.ASC
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
            filtrosSetup[0] = search.createFilter({
                name: 'isinactive',
                operator: 'is',
                values: 'F'
            });
            if (features.subsidiary) {
                filtrosSetup[1] = search.createFilter({
                    name: 'custrecord_lmry_ste_sts_subsidiary',
                    operator: 'is',
                    values: subsidiary
                });
            }

            let setupBR = search.create({
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

        const setPercentage = () =>{

            var searchLog = search.lookupFields({
                type: 'customrecord_lmry_advance_flow_log',
                id: stateId,
                columns: ['custrecord_lmry_ste_af_log_summary']
            });
            let summary = JSON.parse(searchLog.custrecord_lmry_ste_af_log_summary);
            /*  
            summary:{
                total: 12,
                corrects: 10,
                incorrects: 2
            }
            */

            summary.corrects = parseInt(summary.corrects);
            summary.corrects++;
            summary = JSON.stringify(summary);

            record.submitFields({
                type: 'customrecord_lmry_advance_flow_log',
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
        

        return {getInputData, map, reduce, summarize}

    });
