function setUnitPriceUF(currentRCD) {
    var priceUnitList = getPriceUnitList(currentRCD);
    var subsidiary = currentRCD.getValue('subsidiary');
    var currencyTransaction = currentRCD.getValue('currency');
    var jsonCurrencies = {};
    var fieldRateUF;
    var searchCurrencies = search.create({
      type: 'currency',
      columns: ['symbol', 'internalid', 'name'],
      filters: [{
        name: 'isinactive',
        operator: 'is',
        values: 'F'
      }]
    });

    searchCurrencies = searchCurrencies.run().getRange(0, 1000);
    if (searchCurrencies && searchCurrencies.length) {
      for (var i = 0; i < searchCurrencies.length; i++) {
        var idCurrency = searchCurrencies[i].getValue('internalid');
        var name = searchCurrencies[i].getValue('name');
        var symbol = searchCurrencies[i].getValue('symbol');
        symbol = symbol.toUpperCase();

        jsonCurrencies[idCurrency] = {
          'symbol': symbol,
          'name': name
        };

      }
    }


    if (Object.keys(jsonCurrencies).length) {
      //SOLO SI EL CAMPO EXISTE

      var searchSetupTax = search.create({
        type: 'customrecord_lmry_setup_tax_subsidiary',
        columns: ['custrecord_lmry_setuptax_cl_rate_uf'],
        filters: [{
          name: 'isinactive',
          operator: 'is',
          values: 'F'
        }, {
          name: 'custrecord_lmry_setuptax_subsidiary',
          operator: 'is',
          values: subsidiary
        }]
      });

      searchSetupTax = searchSetupTax.run().getRange(0, 1);

      if (searchSetupTax && searchSetupTax.length && searchSetupTax[0].getValue('custrecord_lmry_setuptax_cl_rate_uf')) {
        fieldRateUF = searchSetupTax[0].getValue('custrecord_lmry_setuptax_cl_rate_uf');
      }

      if (fieldRateUF && currentRCD.getField(fieldRateUF)) {
        
        //SOLO PARA PESO CHILENO
        if (jsonCurrencies[currencyTransaction]['symbol'] == 'CLP') {

          //SETEO DE COLUMNA

          var exchangeRateUF = currentRCD.getValue(fieldRateUF);
          var countItems = currentRCD.getLineCount({
            sublistId: 'item'
          });

          for (var i = 0; i < countItems; i++) {
            var amountUF = priceUnitList[i];
            var itemType = currentRCD.getSublistValue('item', 'itemtype', i);
            if (itemType != "Group" && itemType != "EndGroup") {
              
              if (parseFloat(exchangeRateUF) > 0 && parseFloat(amountUF) > 0) {
                var rate = parseFloat(exchangeRateUF) * parseFloat(amountUF);
                rate = parseFloat(rate).toFixed(0);
                currentRCD.setSublistValue('item', 'rate', i, rate);       
              }
              currentRCD.setSublistValue('item', 'custcol_lmry_prec_unit_so', i, amountUF);
            };
          }

        } else {
          //CUANDO NO ES MONEDA PESO CHILENO
          currentRCD.setValue({
            fieldId: fieldRateUF,
            value: 0
          });
        }
      } //SOLO SI EL CAMPO EXISTE
    }
    // FIN SOLO SI ES PESO CHILENO
  }