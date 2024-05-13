/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_BR_WHT_Purchase_MPRD_V2.1.js                ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Oct 31 2022  LatamReady    Use Script 2.1           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/log', 'N/record', 'N/search', 'N/format', 'N/runtime', 'require'/*, './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'*/, './Latam_Library/LMRY_BR_WHT_Purchase_MPRD_LBRY_V2.1', 'N/task', './Latam_Library/LMRY_Log_LBRY_V2.0'],

    function (log, record, search, format, runtime, require/*, libraryEmail*/, libraryPurchase, task, libraryLog) {

        let LMRY_script = 'LatamReady - BR WHT Purchase MPRD';

        function getInputData() {
            try {
                let scriptObj = runtime.getCurrentScript();
                let userid = scriptObj.getParameter({ name: 'custscript_lmry_br_wht_pur_user' });
                let logid = scriptObj.getParameter({ name: 'custscript_lmry_br_wht_pur_state' });
                log.debug('userid y logid', userid + "-" + logid);

                let jsonLog = {};
                let jsonTaxRecord = {};

                logid = logid.split('|');
                log.debug('logid split', logid);
                logid.pop();
                log.debug('logid pop', logid);

                let subsiLog = search.lookupFields({ type: 'customrecord_lmry_br_wht_purchase_log', id: logid[0], columns: ['custrecord_lmry_br_wht_log_subsi'] });
                subsiLog = subsiLog.custrecord_lmry_br_wht_log_subsi[0].value || 1;

                log.debug('subsiLog', subsiLog);
                let jsonSetupTax = libraryPurchase.setupTaxSubsidiary(subsiLog);
                log.debug('jsonSetupTax', jsonSetupTax);
                libraryPurchase.setLog(jsonLog, logid, userid, jsonSetupTax, jsonTaxRecord, subsiLog);

                log.debug('jsonLog', jsonLog);
                let jsonPayment = {};
                for (var i = 0; i < logid.length; i++) {
                    jsonPayment = libraryPurchase.iteracionBill(jsonLog, logid[i], jsonTaxRecord);
                }

                log.debug('jsonPayment', jsonPayment);

                return jsonPayment;

            } catch (err) {
                log.error('[getInputData]', err);
                let scriptObj = runtime.getCurrentScript();
                let logid = scriptObj.getParameter({ name: 'custscript_lmry_br_wht_pur_state' });
                let userid = scriptObj.getParameter({ name: 'custscript_lmry_br_wht_pur_user' });
                logid = logid.split('|');
                logid.pop();
                libraryPurchase.setError(logid);
                /*record.submitFields({ type: 'customrecord_lmry_br_wht_purchase_log', id: logid, values: { custrecord_lmry_br_wht_log_state: 'Ocurrio un error' }, options: { ignoreMandatoryFields: true, disableTriggers: true } });
                libraryEmail.sendemail('[ getInputData ] ' + err, LMRY_script);*/
                libraryLog.doLog({ title: '[ getInputData ]', message: err, userId: userid });
                return [];
            }

        }

        /**
         * If this entry point is used, the map function is invoked one time for each key/value.
         *
         * @param {Object} context
         * @param {boolean} context.isRestarted - Indicates whether the current invocation represents a restart
         * @param {number} context.executionNo - Version of the bundle being installed
         * @param {Iterator} context.errors - This param contains a "iterator().each(parameters)" function
         * @param {string} context.key - The key to be processed during the current invocation
         * @param {string} context.value - The value to be processed during the current invocation
         * @param {function} context.write - This data is passed to the reduce stage
         *
         * @since 2016.1
         */
        function map(context) {

        }

        /**
         * If this entry point is used, the reduce function is invoked one time for
         * each key and list of values provided..
         *
         * @param {Object} context
         * @param {boolean} context.isRestarted - Indicates whether the current invocation represents a restart
         * @param {number} context.executionNo - Version of the bundle being installed
         * @param {Iterator} context.errors - This param contains a "iterator().each(parameters)" function
         * @param {string} context.key - The key to be processed during the current invocation
         * @param {string} context.value - The value to be processed during the current invocation
         * @param {function} context.write - This data is passed to the reduce stage
         *
         * @since 2016.1
         */
        function reduce(context) {

            try {

                let currentLog = context.values;
                currentLog = JSON.parse(currentLog[0]);

                let idLog = context.key;

                libraryPurchase.creadoTransacciones(currentLog, idLog);


            } catch (err) {
                log.error('Reduce', err);
                let scriptObj = runtime.getCurrentScript();
                let logid = scriptObj.getParameter({ name: 'custscript_lmry_br_wht_pur_state' });
                let userid = scriptObj.getParameter({ name: 'custscript_lmry_br_wht_pur_user' });
                logid = logid.split('|');
                logid.pop();
                libraryPurchase.setError(logid);
                /*record.submitFields({ type: 'customrecord_lmry_br_wht_purchase_log', id: logid, values: { custrecord_lmry_br_wht_log_state: 'Ocurrio un error' }, options: { ignoreMandatoryFields: true, disableTriggers: true } });
                libraryEmail.sendemail('[ getInputData ] ' + err, LMRY_script);*/
                libraryLog.doLog({ title: '[ reduce ]', message: err, userId: userid });
            }

        }

        /**
         * If this entry point is used, the reduce function is invoked one time for
         * each key and list of values provided..
         *
         * @param {Object} context
         * @param {boolean} context.isRestarted - Indicates whether the current invocation of the represents a restart.
         * @param {number} context.concurrency - The maximum concurrency number when running the map/reduce script.
         * @param {Date} context.datecreated - The time and day when the script began running.
         * @param {number} context.seconds - The total number of seconds that elapsed during the processing of the script.
         * @param {number} context.usage - TThe total number of usage units consumed during the processing of the script.
         * @param {number} context.yields - The total number of yields that occurred during the processing of the script.
         * @param {Object} context.inputSummary - Object that contains data about the input stage.
         * @param {Object} context.mapSummary - Object that contains data about the map stage.
         * @param {Object} context.reduceSummary - Object that contains data about the reduce stage.
         * @param {Iterator} context.ouput - This param contains a "iterator().each(parameters)" function
         *
         * @since 2016.1
         */
        function summarize(context) {

            updatePayment();

            executeBatchPayment();
        }

        /*--------------------------------------------------------------------------------
            July 6, 2020 (Richard Galvez)
            - updatePayment()
              actualiza la relacion del pago con respecto a un archivo de transferencia
      
            - executeBatchPayment()
              la siguiente funcion ejecuta un scheduled el cual actualiza
              el pago, verificando si este pertenece o no a un transer file. En caso no este
              instalado el bundle Electronic Bank Payments by LatamReady, no hara nada.
          --------------------------------------------------------------------------------*/

        function getIntegrationObject() {

            let object = null;

            let filePath = '/integration/LMRY_EPAY_INTEGRATION_LBRY_V2.0.js';

            try {
                require(['/SuiteApps/Bundle - LatamReady Electronic Bank Payment' + filePath], function (module) {
                    object = module;
                });
            } catch (e) {
                log.debug('Epayment.Integration', e);

                try {
                    require(['/SuiteBundles/Bundle 337228' + filePath], function (module) {
                        object = module;
                    });

                } catch (e) {

                    log.debug('Epayment.Integration', e);

                    require(['/SuiteBundles/Bundle 338570' + filePath], function (module) {
                        object = module;
                    });
                }

            }
            return object;
        }

        function updatePayment() {

            try {

                if (logid) {

                    let recordType = 'customrecord_lmry_br_wht_purchase_log';

                    let _WHT = record.load({ type: recordType, id: logid });

                    let _PAYMENT = _WHT.getValue('custrecord_lmry_br_wht_log_payment');

                    log.debug('payment', _PAYMENT);

                    if (_PAYMENT) {

                        let epay = '';
                        search.create({
                            type: 'customrecord_lmry_e_batch_rcd',
                            columns: ['custrecord_lmry_batch_tf'],
                            filters: [
                                ['custrecord_lmry_batch_rcd', 'is', recordType]
                                , 'and'
                                , ['custrecord_lmry_batch_internalid', 'is', logid]
                            ]
                        }).run().each(function (line) {
                            epay = line.getValue('custrecord_lmry_batch_tf');
                            return false;
                        });


                        if (epay) {
                            record.submitFields(
                                {
                                    type: 'vendorpayment',
                                    id: _PAYMENT,
                                    values: {
                                        custbody_lmry_epay_tranfer_file: epay,
                                    },
                                    options: { ignoreMandatoryFields: true, disableTriggers: true }
                                });

                            let epaymentModuleIntegration = getIntegrationObject();

                            epaymentModuleIntegration.generateMessage(epay, _PAYMENT);

                        }

                    }



                }

            } catch (err) {
                log.error('err', err);
                log.error('E. Payment (udpatePayment)', 'It do not found');
                //libraryLog.doLog({ title: '[ updatePayment ]', message: err, userId: runtime.getCurrentUser().id });
            }

        }

        function executeBatchPayment() {

            try {

                let wht_br_log_id = '';
                let wht_br_log_entity = '';
                search.create({
                    type: 'customrecord_lmry_br_wht_purchase_log',
                    columns: [{
                        name: 'internalid',
                        sort: search.Sort.ASC
                    }, {
                        name: 'custrecord_lmry_br_wht_log_employee'
                    }],
                    filters: [
                        ['custrecord_lmry_br_wht_log_state', 'is', 'Preview (EBP)']
                    ]
                }).run().each(function (line) {
                    wht_br_log_id = line.getValue('internalid');
                    wht_br_log_entity = line.getValue('custrecord_lmry_br_wht_log_employee');
                });

                if (wht_br_log_id) {

                    task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_lmry_br_wht_purchase_mprd',
                        deploymentId: 'customdeploy_lmry_br_wht_purchase_mprd',
                        params: {
                            'custscript_lmry_br_wht_user': wht_br_log_entity,
                            'custscript_lmry_br_wht_state': wht_br_log_id
                        }
                    }).submit();

                }

            } catch (err) {
                log.error('E. Payment (executeBatchPayment)', err);
                //libraryLog.doLog({ title: '[ executeBatchPayment ]', message: JSON.stringify(err) });
            }

        }

        /*-------------------------------------------------------------------------------*/


        return {
            getInputData: getInputData,
            //map: map,
            reduce: reduce,
            //summarize: summarize
        };

    });