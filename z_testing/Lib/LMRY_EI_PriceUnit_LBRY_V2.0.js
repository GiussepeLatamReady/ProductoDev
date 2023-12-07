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
        'N/currency',
        './EI_Library/LMRY_EI_libSendingEmailsLBRY_V2.0'
    ],
    function (format, log, search, currencyApi, ei_library) {

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
                        var rate = currentRecord.getSublistValue({
                            sublistId: "item",
                            fieldId: "rate",
                            line: i
                        }) || 0;
                        var quantity = currentRecord.getSublistValue({
                            sublistId: "item",
                            fieldId: "quantity",
                            line: i
                        }) || 0;
                        var amount = quantity * rate * getExchangeRate(currentRecord);
                        var roundedAmount = Math.round(rate * 100) / 100;
                        log.error("amount", amount);
                        log.error("roundedAmount", roundedAmount);
                        currentRecord.setSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_lmry_prec_unit_so",
                            value: rate,
                            line: i
                        });
                        currentRecord.setSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_lmry_sales_discount_unit_real",
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

            var localmoneda = localCurrency(currentRCD);
            if (subsi) {
                var subsimoneda = subsiCurrency(currentRCD);
            } else {
                var doc_subsi = currentRCD.getValue('subsidiary');
                var objCountry = ei_library.getCountryID(doc_subsi);
                var subsimoneda = objCountry.currency;
            }
            log.error("subsi-localmoneda-subsimoneda", subsi + '-' + localmoneda + '-' + subsimoneda)
            if (subsimoneda == localmoneda) {
                return 1;
            } else if (currentRCD.getValue('currency') == localmoneda) {
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