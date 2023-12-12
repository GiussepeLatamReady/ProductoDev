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
    function (format, log, search,runtime, currencyApi, ei_library) {

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
                        } else{
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

        function getExchangeRate(currentRCD) {
            var featureSubsidiary = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
              });
            var localmoneda = localCurrency(currentRCD);
            if (featureSubsidiary) {
                var subsimoneda = subsiCurrency(currentRCD);
            } else {
                var doc_subsi = currentRCD.getValue('subsidiary');
                var objCountry = ei_library.getCountryID(doc_subsi);
                var subsimoneda = objCountry.currency;
            }
            var transactionCurrency = currentRCD.getValue('currency');
            log.error("subsi-localmoneda-subsimoneda", featureSubsidiary + '-' + localmoneda + '-' + subsimoneda)
            if (subsimoneda == transactionCurrency) {
                return 1;
            } else {
                var bookExchangeRate = '';
                if (localmoneda != '') {
                    var trandate = format.parse({
                        value: currentRCD.getValue('trandate'),
                        type: format.Type.DATE
                    });

                    bookExchangeRate = currencyApi.exchangeRate({
                        date: trandate,
                        source: currentRCD.getValue('currency'),
                        target: localmoneda
                    });
                }
                return bookExchangeRate;
            }
        }

        function localCurrency(currentRCD) {
            var localcu = search.create({
                type: "customrecord_lmry_setup_tax_subsidiary",
                columns: [
                    "custrecord_lmry_setuptax_currency"
                ],
                filters: [
                    ["custrecord_lmry_setuptax_subsidiary", "anyof", currentRCD.getValue('subsidiary')], "AND",
                    ["isinactive", "is", "F"],
                ]
            });

            localcu = localcu.run().getRange(0, 1);

            if (localcu.length > 0) {
                return localcu[0].getValue('custrecord_lmry_setuptax_currency');
            } else {
                return "";
            }
        }

        function subsiCurrency(currentRCD) {
            var subsicu = search.create({
                type: "subsidiary",
                columns: [
                    "currency"
                ],
                filters: [
                    ["internalid", "anyof", currentRCD.getValue('subsidiary')], "AND",
                    ["isinactive", "is", "F"],
                ]
            });

            subsicu = subsicu.run().getRange(0, 1);

            if (subsicu.length > 0) {
                return subsicu[0].getValue('currency');
            }
        }
        return {
            setCLAmountLines: setCLAmountLines
        };
    });