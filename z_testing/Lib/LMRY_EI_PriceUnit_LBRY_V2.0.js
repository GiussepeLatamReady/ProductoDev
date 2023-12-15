/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_EI_PRICE_UNIT_LBRY_V2.0.js                  ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Oct 02 2023  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define([
    'N/format',
    'N/log',
    'N/search',
    'N/runtime',
    'N/currency',
    './LMRY_EI_libSendingEmailsLBRY_V2.0',

],
    function (format, log, search, runtime, currencyApi, ei_library) {

        /**
         * Funcion que permite calcular el precio unitario y mnto taotal de una linea de transaccion
         * @param {currentRecord} scriptContext.newRecord
         */

        function setCLAmountLines(currentRecord) {
            try {
                log.error("Type Transaction", currentRecord.type)
                log.error("debug", "Start transaction")


                var numberItems = currentRecord.getLineCount({
                    sublistId: "item"
                });
                if (numberItems) {
                    for (var i = 0; i < numberItems; i++) {
                        var unitPrice = 0;
                        if (currentRecord.type == 'itemfulfillment') {
                            unitPrice = currentRecord.getSublistValue({
                                sublistId: "item",
                                fieldId: "itemunitprice",
                                line: i
                            }) || 0;
                        } else {
                            unitPrice = currentRecord.getSublistValue({
                                sublistId: "item",
                                fieldId: "rate",
                                line: i
                            }) || 0;
                        }

                        var quantity = currentRecord.getSublistValue({
                            sublistId: "item",
                            fieldId: "quantity",
                            line: i
                        }) || 0;
                        var amount = quantity * unitPrice * getExchangeRate(currentRecord);
                        var roundedAmount = Math.round(amount);
                        log.error("amount", amount);
                        log.error("roundedAmount", roundedAmount);
                        currentRecord.setSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_lmry_prec_unit_so",
                            value: unitPrice,
                            line: i
                        });
                        currentRecord.setSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_lmry_local_amount",
                            value: roundedAmount,
                            line: i
                        });
                    }
                }
            } catch (error) {
                log.error("roundedDecimalUnitPrice [error]", error);
            }
        }

        function getExchangeRate(recordObj) {
            var exchangerate = 1;
            var exchangerateTransaction = recordObj.getValue({ fieldId: 'exchangerate' })
            var FEAT_SUBSIDIARY = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
            var FEAT_MULTIBOOK = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
            if (FEAT_SUBSIDIARY && FEAT_MULTIBOOK) {

                var subsidiary = recordObj.getValue('subsidiary');
                var currencySetup = getCurrencySetupTaxSubsidiary(subsidiary);
                var currencySubs = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['currency']
                }).currency[0].value;

                var numLines = recordObj.getLineCount({
                    sublistId: 'accountingbookdetail'
                });

                if (currencySetup != "" && currencySetup != currencySubs) {
                    if (numLines) {
                        for (var i = 0; i < numLines; i++) {
                            var currencyMB = recordObj.getSublistValue({
                                sublistId: 'accountingbookdetail',
                                fieldId: 'currency',
                                line: i
                            });

                            if (currencyMB == currencySetup) {
                                exchangerate = recordObj.getSublistValue({
                                    sublistId: 'accountingbookdetail',
                                    fieldId: 'exchangerate',
                                    line: i
                                });
                                break;
                            }
                        }
                    }
                } else {
                    exchangerate = exchangerateTransaction
                }
            } else {
                exchangerate = exchangerateTransaction
            }

            return exchangerate;
        }


        function getCurrencySetupTaxSubsidiary(subsidiary) {
            try {
      
              var filters = [['isinactive', 'is', 'F'], 'AND'];
              if (FEAT_SUBSIDIARY) {
                filters.push(['custrecord_lmry_setuptax_subsidiary', 'anyof', subsidiary]);
              }
      
              var searchSetupTaxSub = search.create({
                type: 'customrecord_lmry_setup_tax_subsidiary',
                filters: filters,
                columns: [
                  'custrecord_lmry_setuptax_currency'
                ]
              });
      
              var resultSetupTaxSub = searchSetupTaxSub.run().getRange(0, 1);
              if (resultSetupTaxSub && resultSetupTaxSub.length > 0) {
                returm = resultSetupTaxSub[0].getValue('custrecord_lmry_setuptax_currency') || "";
              }
      
              return "";
            } catch (err) {
              log.error('[setupTaxSubsidiary]', err);
            }
          }

        return {
            setCLAmountLines: setCLAmountLines
        };
    });