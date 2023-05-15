/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_seriesObject_LBRY_v2.0.js  				          ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Feb 09 2021  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define(["N/search", "N/record", "N/runtime", "N/format", "N/log", "./LMRY_EI_libSendingEmailsLBRY_V2.0"], function (
  search,
  record,
  runtime,
  format,
  log,
  ei_library
) {
  var standarTransactionsKeys = {
    CustCred: "creditmemo",
    CustInvc: "invoice",
    CustPymt: "customerpayment",
    ItemShip: "itemfulfillment",
    ItemRcpt: "itemreceipt",
    VendBill: "vendorbill",
    VendCred: "vendorcredit",
    CashSale: "cashsale"
  };

  var transactionById = {
    "10": "creditmemo",
    "7": "invoice",
    "9": "customerpayment",
    "32": "itemfulfillment",
    "16": "itemreceipt",
    "17": "vendorbill",
    "20": "vendorcredit",
    "5": "cashsale"
  };

  function objectSeriesList(arraySeries) {
    var values = {};
    var length = 0;

    if (arraySeries.length > 0) {
      search
        .create({
          type: "customrecord_lmry_serie_impresion_cxc",
          filters: [
            {
              name: "internalid",
              operator: "anyof",
              values: arraySeries,
            },
            {
              name: "isinactive",
              operator: "is",
              values: "F",
            },
          ],
          columns: [
            {
              name: "custrecord_lmry_serie_rango_ini",
            },
            {
              name: "custrecord_lmry_serie_rango_fin",
            },
            {
              name: "custrecord_lmry_serie_num_digitos",
            },
            {
              name: "custrecord_lmry_serie_numero_impres",
            },
          ],
        })
        .run()
        .each(function (line) {
          var column = line.columns;

          var idSerie = line.id;
          var start = line.getValue(column[0]);
          var end = line.getValue(column[1]);
          var digit = line.getValue(column[2]);
          var currentNumber = line.getValue(column[3]);

          values[idSerie] = {
            start: parseInt("" + start),
            end: parseInt("" + end),
            digit: parseInt("" + digit),
            current: parseInt(currentNumber + ""),
          };

          length++;

          return true;
        });
    }

    this.values = values;
    this.length = length;
  }

  objectSeriesList.prototype.generateNumber = function (idSerie) {
    var number = "";

    var jsonSerie = this.values[idSerie];

    if (jsonSerie) {
      var start = jsonSerie.start;
      var end = jsonSerie.end;
      var digit = jsonSerie.digit;
      var current = jsonSerie.current;

      var newNumber = current + 1;
      if (start <= newNumber && newNumber <= end) {
        var strNewNumber = "";

        for (var i = 0; i < digit - ("" + newNumber).length; i++) {
          strNewNumber += "0";
        }
        strNewNumber = strNewNumber + newNumber;

        var number = strNewNumber;

        jsonSerie.current = newNumber;
      }
    }

    return number;
  };

  objectSeriesList.prototype.commit = function () {
    for (var i in this.values) {
      record.submitFields({
        type: "customrecord_lmry_serie_impresion_cxc",
        id: i,
        values: {
          custrecord_lmry_serie_numero_impres: this.values[i].current,
        },
        options: {
          disableTriggers: true,
          ignoreMandatoryFields: true,
        },
      });
    }
  };

  function getSeries(arrayTrasactions, subsidiary, featuresPreImpreso) {
    var transactionByEntities = {};

    var entities = [];

    var entitiesBySerie = {};

    var transactionBySerie = {};

    var arraySerie = [];

    var objSearch = search.create({
      type: "transaction",
      filters: [
        { name: "mainline", operator: "is", values: ["T"] },
        { name: "internalid", operator: "anyof", values: arrayTrasactions },
      ],
      columns: ["entity", "custbody_lmry_num_preimpreso", "type"],
    });

    objSearch = objSearch.run();
    var resultTest = objSearch.getRange({ start: 0, end: 1 });
    if (resultTest[0].getValue("type") == "Custom") {
      var pymtCompCustomers = search.create({
        type: "customrecord_lmry_complem_paymnt_fields",
        filters: [
          {
            name: "custrecord_lmry_related_complmnt_paym",
            operator: "anyof",
            values: arrayTrasactions,
          },
        ],
        columns: [
          "custrecord_lmry_complm_customer",
          "custrecord_lmry_related_complmnt_paym",
        ],
      });
      pymtCompCustomers = pymtCompCustomers.run();
    }

    var flagSearch = true,
      cSearch = 0;

    while (flagSearch) {
      var resultSearch = objSearch.getRange({
        start: cSearch,
        end: cSearch + 1000,
      });
      var countLines = resultSearch.length;

      if (countLines == 0) {
        break;
      }

      var columnsSearch = resultSearch[0].columns;
      if (resultTest[0].getValue("type") == "Custom") {
        var resultCustomers = pymtCompCustomers.getRange({
          start: cSearch,
          end: cSearch + 1000,
        });
        countLines = resultCustomers.length;
      }
      //  log.debug('resultCustomers',resultCustomers);

      for (var i = 0; i < countLines; i++) {
        var _transId = "";
        var _entity = "";
        var _preImpreso = "";
        var _type = "";
        if (resultTest[0].getValue("type") == "Custom") {
          //  log.debug('resultCustomers[i]',resultCustomers[i]);
          _transId = resultCustomers[i].getValue(
            "custrecord_lmry_related_complmnt_paym"
          );
          _entity = resultCustomers[i].getValue(
            "custrecord_lmry_complm_customer"
          );
          // _preImpreso = getPreprited(_transId,objSearch);
          _preImpreso = search.lookupFields({
            type: search.Type.TRANSACTION,
            id: _transId,
            columns: ["custbody_lmry_num_preimpreso"],
          }).custbody_lmry_num_preimpreso;
          // _type = resultTest[0].getValue('type');
          _type = resultSearch[i].recordType;
        } else {
          _transId = resultSearch[i].id;
          _entity = resultSearch[i].getValue(columnsSearch[0]);
          _preImpreso = resultSearch[i].getValue(columnsSearch[1]);
          _type =
            standarTransactionsKeys[resultSearch[i].getValue(columnsSearch[2])];
        }
        //  log.debug('_preImpreso',_preImpreso);

        if (!_preImpreso) {
          if (
            (_type == "invoice" && featuresPreImpreso[0]) ||
            (_type == "creditmemo" && featuresPreImpreso[1]) ||
            (_type == "customerpayment" && featuresPreImpreso[2]) ||
            (_type == "cashsale" && featuresPreImpreso[3]) ||
            (_type == "customtransaction_lmry_payment_complemnt" && featuresPreImpreso[4]) ||
            (_type == "itemfulfillment" && featuresPreImpreso[0]) ||
            (_type == "itemreceipt" && featuresPreImpreso[1]) ||
            (_type == "vendorbill" && featuresPreImpreso[0]) ||
            (_type == "vendorcredit" && featuresPreImpreso[1])
          ) {
            transactionByEntities[_transId] = {
              entity: _entity,
              type: _type,
            };
          }
        }

        entities.push(_entity);
      }

      if (resultSearch.length == 1000) {
        cSearch += 1000;
      } else {
        flagSearch = false;
      }
    }

    if (!Object.keys(transactionByEntities).length) {
      return {
        series: arraySerie,
      };
    }

    var transactionTypes = [7, 10, 9, 32, 16, 5, 17, 20];
    var complementoPagoId = getComplementoPagoTransactionId();
    if (complementoPagoId) {
      transactionTypes.push(complementoPagoId);
      transactionById[complementoPagoId] = "customtransaction_lmry_payment_complemnt";
    }

    //BUSQUEDA DE US
    var filtrosUS = [];
    filtrosUS[0] = search.createFilter({
      name: "custrecord_lmry_us_entity",
      operator: "anyof",
      values: entities,
    });
    filtrosUS[1] = search.createFilter({
      name: "custrecord_lmry_us_transaction",
      operator: "anyof",
      values: transactionTypes,
    });
    filtrosUS[2] = search.createFilter({
      name: "isinactive",
      operator: "is",
      values: "F",
    });
    if (subsidiary) {
      filtrosUS[3] = search.createFilter({
        name: "custrecord_lmry_us_subsidiary",
        operator: "anyof",
        values: subsidiary,
      });
    }

    var objEntitySearch = search.create({
      type: "customrecord_lmry_universal_setting_v2",
      columns: [
        "custrecord_lmry_serie_doc_cxc",
        "custrecord_lmry_us_entity",
        "custrecord_lmry_us_transaction"
      ],
      filters: filtrosUS,
    });

    objEntitySearch = objEntitySearch.run();

    var flagEntity = true,
      cEntity = 0;

    while (flagEntity) {
      var resultEntity = objEntitySearch.getRange({
        start: cEntity,
        end: cEntity + 1000,
      });

      if (resultEntity.length == 0) {
        break;
      }

      var entityColumns = resultEntity[0].columns;
      for (var i = 0; i < resultEntity.length; i++) {
        var id = resultEntity[i].getValue("custrecord_lmry_us_entity");
        var serie = resultEntity[i].getValue("custrecord_lmry_serie_doc_cxc");
        var transType = resultEntity[i].getValue("custrecord_lmry_us_transaction");

        if (!entitiesBySerie[id]) {
          entitiesBySerie[id] = {};
        }

        if (transactionById.hasOwnProperty(transType)) {
          entitiesBySerie[id][transactionById[transType]] = serie;
        }
      }

      if (resultEntity.length == 1000) {
        cEntity += 1000;
      } else {
        flagEntity = false;
      }
    }
    var serie_AS = getSerieAutoSetSubsidiary(subsidiary);

    for (var x in transactionByEntities) {
      var transactionID = x;

      transactionBySerie[transactionID] = "";

      var entityContext = transactionByEntities[x];

      var idEntity = entityContext.entity;
      var transType = entityContext.type;

      if (transType =='customtransaction_lmry_payment_complemnt') {
        transType ='customerpayment';
      }
      if (idEntity != "") {
        if (entitiesBySerie[idEntity]) {
          var serieContext = entitiesBySerie[idEntity];

          if (serieContext[transType]) {
            var idSerie = serieContext[transType];

            transactionBySerie[transactionID] = idSerie;

            arraySerie.push(idSerie);
          } else {
            if (serie_AS[transType]) {
              var idSerieSubsidiary = serie_AS[transType];
              transactionBySerie[transactionID] = idSerieSubsidiary;

              arraySerie.push(idSerieSubsidiary);
            }
          }
        } else {
          if (serie_AS[transType]) {
            var idSerieSubsidiary = serie_AS[transType];
            transactionBySerie[transactionID] = idSerieSubsidiary;

            arraySerie.push(idSerieSubsidiary);
          }
        }
      }
    }

    return {
      series: arraySerie,
      transactions: transactionBySerie,
    };
  }

  function getSerieAutoSetSubsidiary(subsidiary) {
    var licenses = ei_library.getLicenses(subsidiary);
    var country = ei_library.getCountryID(subsidiary).code;
    var serieBySubsidiaria = {};
    /*C0665 - Features Automatic Set Field Subsidiary
    'MX': 975
    */
    if (country == 'MX' && ei_library.getAuthorization(975, licenses)) {
      var setupTaxSubsidiarySearch = search.create({
        type: "customrecord_lmry_setup_tax_subsidiary",
        filters:
          [
            ["isinactive", "is", "F"], "AND",
            ["custrecord_lmry_setuptax_subsidiary", "anyof", subsidiary]
          ],
        columns: ["internalid"]
      });
      setupTaxSubsidiarySearch = setupTaxSubsidiarySearch.run().getRange(0, 1);
      var setupTaxSubsid = setupTaxSubsidiarySearch[0].getValue('internalid');

      var filtrosUS = [];
      filtrosUS[0] = search.createFilter({
        name: "custrecord_lmry_us_entity",
        operator: "anyof",
        values: "@NONE@",
      });
      filtrosUS[1] = search.createFilter({
        name: 'custrecord_lmry_us_setuptax',
        operator: "anyof",
        values: setupTaxSubsid
      });
      filtrosUS[2] = search.createFilter({
        name: "isinactive",
        operator: "is",
        values: "F",
      });
      if (subsidiary) {
        filtrosUS[3] = search.createFilter({
          name: "custrecord_lmry_us_subsidiary",
          operator: "anyof",
          values: subsidiary,
        });
      }

      var objSubsidSearch = search.create({
        type: "customrecord_lmry_universal_setting_v2",
        columns: [
          "custrecord_lmry_serie_doc_cxc",
          "custrecord_lmry_us_transaction"
        ],
        filters: filtrosUS,
      });
      objSubsidSearch = objSubsidSearch.run().getRange(0, 1000);
      if (objSubsidSearch != '' && objSubsidSearch != null && objSubsidSearch.length > 0) {
        var searchColumns = objSubsidSearch[0].columns;
        for (var i = 0; i < objSubsidSearch.length; i++) {
          var serie = objSubsidSearch[i].getValue("custrecord_lmry_serie_doc_cxc");
          var transType = objSubsidSearch[i].getValue("custrecord_lmry_us_transaction");
          if (transactionById.hasOwnProperty(transType)) {
            serieBySubsidiaria[transactionById[transType]] = serie;
          }
        }
      }
    }
    return serieBySubsidiaria;
  }

  function getComplementoPagoTransactionId() {
    const CUSTOM_TRANSACTION_FEAT = runtime.isFeatureInEffect({ feature: "customtransactions" });
    if (CUSTOM_TRANSACTION_FEAT == "T" || CUSTOM_TRANSACTION_FEAT == true) {
      var complementoPagoRecord = record.create({
        type: "customtransaction_lmry_payment_complemnt"
      });

      return complementoPagoRecord.getValue("ntype");
    }
    return "";
  }

  return {
    load: function (arraySeries) {
      return new objectSeriesList(arraySeries);
    },
    getSeries: getSeries,
  };
});