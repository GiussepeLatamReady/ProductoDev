function getCodes(subsi) { //Obtiene Series y Preprinted 
  var subsi_OW = true;
  var stt_filters = new Array();
  stt_filters[0] = search.createFilter({ name: 'isinactive', operator: 'is', values: ['F'] });
  // stt_filters[1] = search.createFilter({name:'custrecord_lmry_ar_cxp_series',operator:'isnotempty',values:['']});
  // stt_filters[2] = search.createFilter({name:'custrecord_lmry_ar_preprinted_number',operator:'isnotempty',values:['']});
  if (subsi_OW) { //Verifica si es One World
      stt_filters[1] = search.createFilter({ name: 'custrecord_lmry_setuptax_subsidiary', operator: 'anyof', values: subsi });
  }

  var customrecord_lmry_setup_tax_subsidiarySearchObj = search.create({
      type: "customrecord_lmry_setup_tax_subsidiary",
      filters: stt_filters,
      columns:
          [
              "custrecord_lmry_ar_cxp_series",
              "custrecord_lmry_ar_preprinted_number"
          ]
  });

  var codes = customrecord_lmry_setup_tax_subsidiarySearchObj.run().getRange({ start: 0, end: 1000 });
  if (codes && codes.length) {
      return codes[0];
  } else {
      return null;
  }
}

function completeSeries(code, subs) {
  //completa series
  var codeAux = code.toString();
  if (code != null && codeAux != '') {
      var getCode =true;
      if (getCode) {
          var numSeries = "";
          if (numSeries) {
            console.log("entro")
              numSeries = parseInt(numSeries);
              while (codeAux.length < numSeries) {
                  codeAux = "0" + codeAux;
              }
          }
      }
  }

  return codeAux;
}

completeSeries("10", "49")

console.log(completeSeries("10", "49"))