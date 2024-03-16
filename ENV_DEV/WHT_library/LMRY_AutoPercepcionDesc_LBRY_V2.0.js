/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
  ||  This script for customer center                             ||
  ||                                                              ||
  ||  File Name:  LMRY_AutoPercepcionDesc_LBRY_V2.0.js     	      ||
  ||                                                              ||
  ||  Version Date         Author        Remarks                  ||
  ||  1.0     Mar 24 2017  LatamReady    Initial Only AR          ||
  ||  2.0     Jan 29 2018  LatamReady    Update Contries          ||
   \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

//
define(['N/record', 'N/runtime', 'N/search', 'N/log', 'N/email', 'N/format',
  './../Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'
],
  function (record, runtime, search, log, email, format, LibraryMail) {
    // Nombre del Script
    var Name_script = "LatamReady - Auto Percepcion Desc LBRY";
    // Exchange global
    var exchange_global = 1;
    var numLines = 1;
    var soloItems = 1;
    var apply_line = false;
    var filtroTransactionType = "";
    var cantidad = 0;

    // Department, Class and Location
    var FeaDepa = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
    var FeaLoca = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
    var FeaClas = runtime.isFeatureInEffect({ feature: "CLASSES" });

    //activacion de Accounting Preferences
    var userObj = runtime.getCurrentUser();
    var pref_dep = userObj.getPreference({ name: "DEPTMANDATORY" });
    var pref_loc = userObj.getPreference({ name: "LOCMANDATORY" });
    var pref_clas = userObj.getPreference({ name: "CLASSMANDATORY" });

    // One World o Mismarket
    var subsi_OW = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
    var featureMB = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });

    var seteoSuma = false;
    var sumaPercepciones = 0;

    function autoperc_beforeSubmit(paramContext, CodeCountry, evento) {

      try {

        if (evento == "create" || evento == "edit") {
          // Registro actual
          var invoiceRecord = paramContext.newRecord;

          /********************************************
           * Valida si tiene activo el feature para
           * realizar la autopercepcion y descuento
           * por pais.
           ********************************************/
          //log.error("Step [01] recordType [ open ]", contextRecord.type);

          numLines = invoiceRecord.getLineCount('item');
          soloItems = numLines;

          // Logica de Auto Percepciones por Linea
          logicaAutoPercepciones(invoiceRecord, numLines, CodeCountry);

          /*************************************
           * Logica de Descuentos por Linea solo
           * para Argentina
           *************************************/
          if (CodeCountry == "AR" && (invoiceRecord.type == 'invoice' || invoiceRecord.type == 'creditmemo' || invoiceRecord.type == 'cashsale')) {
            logicaDescuentos(invoiceRecord, numLines);
          }
        }
      } catch (msg) {
        // Envio de mail con errores
        log.error('Percepciones', msg);
        LibraryMail.sendemail('[ beforeSubmit ] ' + msg, Name_script);
      }

    }

    /**************************************************************
     * Funcion logicaAutoPercepciones si el cliente tiene
     * el campo personalizado 'Latam - AR Responsible Type Code'
     * configurado, adicionalmente tiene que estar marcado el
     * campo personalizado 'Latam - Applied WHT Code' se realizara
     * la Auto Percepcion en la transaccion.
     *********************************************************** */
    function logicaAutoPercepciones(invoiceRecord, numLines, CodeCountry) {
      try {

        var auto_wht = invoiceRecord.getValue('custbody_lmry_apply_wht_code');
        var tipo_Docum = invoiceRecord.getValue("custbody_lmry_document_type");
        var fieldStatus = invoiceRecord.getField({ fieldId: 'custbody_psg_ei_status' });
        var eDocStatus = '';
        if (fieldStatus != '' && fieldStatus != null) {
          eDocStatus = invoiceRecord.getValue("custbody_psg_ei_status");
          if (eDocStatus != null && eDocStatus != '') {
            eDocStatus = search.lookupFields({ type: 'customlist_psg_ei_status', id: eDocStatus, columns: ['name'] });
            eDocStatus = eDocStatus.name;
          }
        }

        switch (invoiceRecord.type) {
          case 'invoice': filtroTransactionType = 1; break;
          case 'creditmemo': filtroTransactionType = 8; break;
          case 'cashsale': filtroTransactionType = 3; break;
          case 'salesorder': filtroTransactionType = 2; break;
          case 'estimate': filtroTransactionType = 10; break;
        }

        if (auto_wht && validarTipoDoc(tipo_Docum,invoiceRecord.type) && (eDocStatus != "Sent" && eDocStatus != "Enviado")) {
          seteoSuma = true;
          var hayTributo = contieneTributo(invoiceRecord, numLines, cantidad);
          if (!hayTributo) {
            var tradate = invoiceRecord.getValue("trandate");
            tradate = format.format({ value: tradate, type: format.Type.DATE });
            var entity = invoiceRecord.getValue("entity");
            // Verifica si esta activo el Feature Poryectos
            var featjobs = runtime.isFeatureInEffect({ feature: "JOBS" });
            if (featjobs == true) {
              var ajobs = search.lookupFields({ type: search.Type.JOB, id: entity, columns: ['customer'] });
              if (ajobs.customer) {
                entity = ajobs.customer[0].value;
              }
            }
            var subtotal = invoiceRecord.getValue("subtotal");
            var subsidiary = invoiceRecord.getValue("subsidiary");

            /********************************************
             * Solo para Argentina se aplica
             * el siguiente codigo
             *******************************************/
            var RespType;
            if (CodeCountry == "AR") {
              /********************************************
               * Campo personalizdo: Latam - AR Responsible
               * Type Code para el cliente
               ********************************************/
              var responsableType = search.lookupFields({ type: search.Type.CUSTOMER, id: entity, columns: ['custentity_lmry_ar_tiporespons'] });

              // Se valida que el campo no este vacio
              if (responsableType.custentity_lmry_ar_tiporespons.length == 0 || responsableType == '' || responsableType == null) {
                return true;
              }
              RespType = responsableType.custentity_lmry_ar_tiporespons[0].value;
            }

            //Busqueda SetupTaxSubsidiary
            var filtros_setuptax = new Array();
            filtros_setuptax[0] = search.createFilter({ name: 'isinactive', operator: 'is', values: ['F'] });
            if (subsi_OW) {
              filtros_setuptax[1] = search.createFilter({ name: 'custrecord_lmry_setuptax_subsidiary', operator: 'is', values: subsidiary });
            }

            var search_setuptax = search.create({
              type: 'customrecord_lmry_setup_tax_subsidiary', filters: filtros_setuptax,
              columns: ['custrecord_lmry_setuptax_currency', 'custrecord_lmry_setuptax_type_rounding', 'custrecord_lmry_setuptax_apply_line',
                'custrecord_lmry_setuptax_department', 'custrecord_lmry_setuptax_class', 'custrecord_lmry_setuptax_location']
            });
            var result_setuptax = search_setuptax.run().getRange({ start: 0, end: 1 });

            var tipoRedondeo = '', apply_line = '';
            var arregloSegmentacion = [];

            if (result_setuptax != null && result_setuptax.length > 0) {

              tipoRedondeo = result_setuptax[0].getValue({ name: "custrecord_lmry_setuptax_type_rounding" });
              apply_line = result_setuptax[0].getValue({ name: "custrecord_lmry_setuptax_apply_line" });

              var setup_department = result_setuptax[0].getValue({ name: "custrecord_lmry_setuptax_department" });
              var setup_class = result_setuptax[0].getValue({ name: "custrecord_lmry_setuptax_class" });
              var setup_location = result_setuptax[0].getValue({ name: "custrecord_lmry_setuptax_location" });
              arregloSegmentacion = [setup_department, setup_class, setup_location];

              var currency_setup = result_setuptax[0].getValue({ name: 'custrecord_lmry_setuptax_currency' });
              var currency_invoice = invoiceRecord.getValue("currency");
              var currency_subsidiary = "";
              if (subsi_OW) {
                currency_subsidiary = search.lookupFields({ type: search.Type.SUBSIDIARY, id: subsidiary, columns: ['currency'] });
                currency_subsidiary = currency_subsidiary.currency[0].value;
              }

              if (currency_setup == currency_invoice) {
                exchange_global = 1;
              }
              if (currency_setup != currency_invoice && currency_setup == currency_subsidiary) {
                exchange_global = parseFloat(invoiceRecord.getValue("exchangerate"));
              }
              if (currency_setup != currency_invoice && currency_setup != currency_subsidiary && featureMB == true) {
                var lineas_book = invoiceRecord.getLineCount({ sublistId: 'accountingbookdetail' });
                if (lineas_book > 0) {
                  for (var k = 0; k < lineas_book; k++) {
                    var currency_book = invoiceRecord.getSublistValue({ sublistId: 'accountingbookdetail', fieldId: 'currency', line: k });
                    if (currency_book == currency_setup) {
                      exchange_global = parseFloat(invoiceRecord.getSublistValue({ sublistId: 'accountingbookdetail', fieldId: 'exchangerate', line: k }));
                      break;
                    }
                  }
                }
              }

            } else {
              return true;
            }


            //Busqueda de National Taxes

            var filtros_nt = new Array();
            filtros_nt[0] = search.createFilter({ name: 'custrecord_lmry_ntax_subsidiary', operator: 'is', values: [subsidiary] });
            filtros_nt[1] = search.createFilter({ name: 'custrecord_lmry_ntax_isexempt', operator: 'is', values: ['F'] });
            filtros_nt[2] = search.createFilter({ name: 'isinactive', operator: 'is', values: ['F'] });
            filtros_nt[3] = search.createFilter({ name: 'custrecord_lmry_ntax_taxtype', operator: 'anyof', values: [2] });
            filtros_nt[4] = search.createFilter({ name: 'custrecord_lmry_ntax_gen_transaction', operator: 'anyof', values: [4] });
            filtros_nt[5] = search.createFilter({ name: 'custrecord_lmry_ntax_datefrom', operator: 'onorbefore', values: tradate });
            filtros_nt[6] = search.createFilter({ name: 'custrecord_lmry_ntax_dateto', operator: 'onorafter', values: tradate });
            filtros_nt[7] = search.createFilter({ name: 'custrecord_lmry_ntax_transactiontypes', operator: 'anyof', values: [filtroTransactionType] });

            var search_nt = search.create({
              type: "customrecord_lmry_national_taxes",
              filters: filtros_nt,
              columns: [
                search.createColumn({ name: 'custrecord_lmry_ntax_taxitem' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_taxrate' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_memo' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_taxcode' }),
                search.createColumn({ name: 'subtype', join: 'custrecord_lmry_ntax_taxitem' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_department' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_class' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_location' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_iibb_norma' }),
                search.createColumn({ name: 'custrecord_lmry_ar_wht_regimen', join: 'custrecord_lmry_ntax_regimen' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_jurisdib' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_appliesto' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_amount' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_addratio' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_minamount' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_maxamount' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_set_baseretention' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_applies_to_item' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_base_amount' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_not_taxable_minimum' }),
                search.createColumn({ name: 'internalid' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_catalog' }),
                search.createColumn({ name: 'custrecord_lmry_ntax_applies_to_account' })
              ]
            });

            result_nt = search_nt.run().getRange({ start: 0, end: 1000 });

            //Busqueda de las Clases Contributiva
            var i = 8;
            var filtros_ccl = new Array();
            filtros_ccl[0] = search.createFilter({ name: 'custrecord_lmry_ar_ccl_entity', operator: 'is', values: [entity] });
            filtros_ccl[1] = search.createFilter({ name: 'custrecord_lmry_ar_ccl_isexempt', operator: 'is', values: ['F'] });
            filtros_ccl[2] = search.createFilter({ name: 'isinactive', operator: 'is', values: ['F'] });
            filtros_ccl[3] = search.createFilter({ name: 'custrecord_lmry_ccl_taxtype', operator: 'anyof', values: [2] });
            filtros_ccl[4] = search.createFilter({ name: 'custrecord_lmry_ccl_gen_transaction', operator: 'anyof', values: [4] });
            filtros_ccl[5] = search.createFilter({ name: 'custrecord_lmry_ar_ccl_fechdesd', operator: 'onorbefore', values: tradate });
            filtros_ccl[6] = search.createFilter({ name: 'custrecord_lmry_ar_ccl_fechhast', operator: 'onorafter', values: tradate });
            filtros_ccl[7] = search.createFilter({ name: 'custrecord_lmry_ccl_transactiontypes', operator: 'anyof', values: [filtroTransactionType] });
            if (CodeCountry == "AR") {
              filtros_ccl[8] = search.createFilter({ name: 'custrecord_lmry_ar_ccl_resptype', operator: 'anyof', values: [RespType] });
              i++;
            }
            filtros_ccl[i] = search.createFilter({ name: 'custrecord_lmry_ar_ccl_subsidiary', operator: 'is', values: subsidiary });

            var busqContClass = search.create({
              type: "customrecord_lmry_ar_contrib_class",
              filters: filtros_ccl,
              columns: [
                search.createColumn({ name: 'custrecord_lmry_ar_ccl_taxitem' }),
                search.createColumn({ name: 'custrecord_lmry_ar_ccl_taxrate' }),
                search.createColumn({ name: 'custrecord_lmry_ar_ccl_memo' }),
                search.createColumn({ name: 'custrecord_lmry_ar_ccl_taxcode' }),
                search.createColumn({ name: 'subtype', join: 'custrecord_lmry_ar_ccl_taxitem' }),
                search.createColumn({ name: 'custrecord_lmry_ar_ccl_department' }),
                search.createColumn({ name: 'custrecord_lmry_ar_ccl_class' }),
                search.createColumn({ name: 'custrecord_lmry_ar_ccl_location' }),
                search.createColumn({ name: 'custrecord_lmry_ar_normas_iibb' }),
                search.createColumn({ name: 'custrecord_lmry_ar_wht_regimen', join: 'custrecord_lmry_ar_regimen' }),
                search.createColumn({ name: 'custrecord_lmry_ar_ccl_jurisdib' }),
                search.createColumn({ name: 'custrecord_lmry_ccl_appliesto' }),
                search.createColumn({ name: 'custrecord_lmry_amount' }),
                search.createColumn({ name: 'custrecord_lmry_ccl_addratio' }),
                search.createColumn({ name: 'custrecord_lmry_ccl_minamount' }),
                search.createColumn({ name: 'custrecord_lmry_ccl_maxamount' }),
                search.createColumn({ name: 'custrecord_lmry_ccl_set_baseretention' }),
                search.createColumn({ name: 'custrecord_lmry_ccl_applies_to_item' }),
                search.createColumn({ name: 'custrecord_lmry_ccl_base_amount' }),
                search.createColumn({ name: 'custrecord_lmry_ccl_not_taxable_minimum' }),
                search.createColumn({ name: 'internalid' }),
                search.createColumn({ name: 'custrecord_lmry_br_ccl_catalog' }),
                search.createColumn({ name: 'custrecord_lmry_ccl_applies_to_account' })
              ]
            });

            var resultContClass = busqContClass.run().getRange(0, 1000);

            logicaLlenado("1", result_nt, invoiceRecord, CodeCountry, tipoRedondeo, arregloSegmentacion, "", "0");
            logicaLlenado("1", resultContClass, invoiceRecord, CodeCountry, tipoRedondeo, arregloSegmentacion, "", "1");

            if (apply_line == true) {
              for (var j = 0; j < soloItems; j++) {
                var gross_item = invoiceRecord.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: j });
                var tax_item = invoiceRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: j });
                var net_item = invoiceRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: j });
                var id_item = invoiceRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                var catalog_item = invoiceRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_br_service_catalog', line: j });

                if (catalog_item == null || catalog_item == '') {
                  catalog_item = "no catalogo";
                }

                var info_item = id_item + "|" + gross_item + "|" + tax_item + "|" + net_item + "|" + catalog_item;

                logicaLlenado("2", result_nt, invoiceRecord, CodeCountry, tipoRedondeo, arregloSegmentacion, info_item, "0");
                logicaLlenado("2", resultContClass, invoiceRecord, CodeCountry, tipoRedondeo, arregloSegmentacion, info_item, "1");
              }

            }

          }

          cantidad++;
          contieneTributo(invoiceRecord, invoiceRecord.getLineCount('item'), cantidad);

        }

      } catch (errmsg) {
        // Envio de mail con errores
        LibraryMail.sendemail('[ logicaAutoPercepciones ] ' + errmsg, Name_script);
      }
    }

    function logicaLlenado(appliesTo, result, invoiceRecord, CodeCountry, tipoRedondeo, segmentacion, infoItem, bySubsidiary) {

      var subtotal_invoice = parseFloat(invoiceRecord.getValue("subtotal")) * parseFloat(exchange_global);
      var total_invoice = parseFloat(invoiceRecord.getValue("total")) * parseFloat(exchange_global);
      var taxtotal_invoice = parseFloat(invoiceRecord.getValue("taxtotal")) * parseFloat(exchange_global);

      var department_setup = segmentacion[0];
      var class_setup = segmentacion[1];
      var lcoation_setup = segmentacion[2];

      if (result != null && result.length > 0) {
        for (var i = 0; i < result.length; i++) {
          var row = result[i].columns;

          var tax_item = result[i].getValue(row[0]); // Latam AR - Tax item
          var tax_rate = result[i].getValue(row[1]); // Latam AR - Tax rate
          var memo = result[i].getValue(row[2]); // Latam AR - Memo
          var tax_code = result[i].getValue(row[3]); // Latam - Tax Code
          var itmsubtype = result[i].getValue(row[4]); // Item SubType
          var iibbnorma = result[i].getValue(row[8]); // Latam AR - IIBB Norma
          var juriisibb = result[i].getValue(row[10]); // Latam AR - IIBB Jurisdiction
          var regimenen = result[i].getValue(row[9]); // Latam AR - Regimen
          var r_department = result[i].getValue(row[5]);
          var r_class = result[i].getValue(row[6]);
          var r_location = result[i].getValue(row[7]);
          var applies_to = result[i].getValue(row[11]);
          var amount_to = result[i].getValue(row[12]);
          var ratio = result[i].getValue(row[13]);
          var minimo = result[i].getValue(row[14]);
          var maximo = result[i].getValue(row[15]);
          var setbaseretention = result[i].getValue(row[16]);
          var applies_to_item = result[i].getValue(row[17]);
          var dobaseamount = result[i].getValue(row[18]);
          var minimonoimponible = result[i].getValue(row[19]);
          var internalid = result[i].getValue(row[20]);
          var catalogo = result[i].getValue(row[21]);
          var applies_account = result[i].getValue(row[22]);

          // Valida si es articulo para las ventas
          if (itmsubtype != 'Para la venta' && itmsubtype != 'For Sale' && itmsubtype != 'Para reventa' && itmsubtype != 'For Resale') {
            continue;
          }

          if (tax_code == null || tax_code == '') {
            continue;
          }

          if (appliesTo != applies_to) {
            continue;
          }

          if (applies_to == '2') {
            var aux_item = infoItem.split("|");
            if (CodeCountry == 'BR') {
              if (catalogo != aux_item[4]) {
                continue;
              }
            } else {
              if (applies_to_item != aux_item[0]) {
                continue;
              }
            }
          }

          if (setbaseretention == null || setbaseretention == '' || setbaseretention < 0) {
            setbaseretention = 0;
          }

          if (minimonoimponible == null || minimonoimponible == '' || minimonoimponible < 0) {
            minimonoimponible = 0;
          }

          if (maximo == null || maximo == '' || maximo < 0) {
            maximo = 0;
          }

          if (minimo == null || minimo == '' || minimo < 0) {
            minimo = 0;
          }

          if (ratio == null || ratio == '' || ratio <= 0) {
            ratio = 1;
          }

          minimo = parseFloat(minimo);
          maximo = parseFloat(maximo);
          setbaseretention = parseFloat(setbaseretention);
          minimonoimponible = parseFloat(minimonoimponible);

          var amount_base;

          if (applies_to == '1') {
            if (amount_to == 1) { amount_base = total_invoice; } //GROSS
            //TAX
            if (amount_to == 2) {
              if (taxtotal_invoice > 0) {
                amount_base = taxtotal_invoice;
              } else {
                continue;
              }
            }
            if (amount_to == 3) { amount_base = subtotal_invoice; } //NET
          }

          if (applies_to == '2') {
            var aux_itemg = infoItem.split("|");
            if (amount_to == 1) { amount_base = parseFloat(aux_itemg[1]) * parseFloat(exchange_global); }
            //TAX
            if (amount_to == 2) {
              if (aux_itemg[2] > 0) {
                amount_base = parseFloat(aux_itemg[2]) * parseFloat(exchange_global);
              } else {
                continue;
              }
            }
            if (amount_to == 3) { amount_base = parseFloat(aux_itemg[3]) * parseFloat(exchange_global); } //NET
          }

          amount_base = parseFloat(amount_base) - parseFloat(minimonoimponible);

          if (amount_base <= 0) {
            continue;
          }

          if (minimo > 0) {
            if (amount_base > minimo) {
              if (maximo > 0) {
                if (maximo > minimo) {
                  if (maximo >= amount_base) {
                    if (dobaseamount == 2 || dobaseamount == 5) { amount_base = parseFloat(amount_base) - parseFloat(minimo); }
                    if (dobaseamount == 3) { amount_base = minimo; }
                    if (dobaseamount == 4) { amount_base = maximo; }
                  } else {
                    continue;
                  }
                } else {
                  continue;
                }
              } else {
                if (dobaseamount == 2 || dobaseamount == 5) { amount_base = parseFloat(amount_base) - parseFloat(minimo); }
                if (dobaseamount == 3) { amount_base = minimo; }
              }
            } else {
              continue;
            }
          } else {
            if (maximo > minimo) {
              if (maximo >= amount_base) {
                if (dobaseamount == 2 || dobaseamount == 5) { amount_base = parseFloat(amount_base) - parseFloat(minimo); }
                if (dobaseamount == 3) { amount_base = minimo; }
                if (dobaseamount == 4) { amount_base = maximo; }
              } else {
                continue;
              }
            }
          }

          //RETENCION
          var retencion = parseFloat(setbaseretention) + parseFloat(amount_base) * parseFloat(ratio) * parseFloat(tax_rate);
          retencion = parseFloat(Math.round(parseFloat(retencion) * 1000000) / 1000000);
          retencion = parseFloat(Math.round(parseFloat(retencion) * 10000) / 10000);
          var retencion_peso = retencion;

          var aux_cadena = retencion + ";";
          retencion = parseFloat(retencion) / parseFloat(exchange_global);
          amount_base = parseFloat(amount_base) / parseFloat(exchange_global);

          if (tipoRedondeo == '1') {
            if (parseFloat(retencion) - parseInt(retencion) < 0.5) {
              retencion = parseInt(retencion);
            }
            else {
              retencion = parseInt(retencion) + 1;
            }
          }
          if (tipoRedondeo == '2') {
            retencion = parseInt(retencion);
          }

          if (applies_account != '' && applies_account != null) {
            aux_cadena += applies_account;
          }

          retencion = parseFloat(Math.round(parseFloat(retencion) * 100) / 100);

          var retencion_transaccion = parseFloat(retencion) * parseFloat(exchange_global);
          retencion_transaccion = Math.round(parseFloat(retencion_transaccion) * 10000) / 10000;

          var adjustment = parseFloat(retencion_peso) - parseFloat(retencion_transaccion);

          adjustment = adjustment.toFixed(4);

          // Agrega una linea en blanco
          invoiceRecord.insertLine('item', numLines);
          invoiceRecord.setSublistValue('item', 'item', numLines, tax_item);


          if (memo != null && memo != '') {
            invoiceRecord.setSublistValue('item', 'description', numLines, memo);
          }

          invoiceRecord.setSublistValue('item', 'quantity', numLines, 1);
          invoiceRecord.setSublistValue('item', 'rate', numLines, parseFloat(retencion));
          invoiceRecord.setSublistValue('item', 'taxcode', numLines, tax_code);
          invoiceRecord.setSublistValue('item', 'custcol_lmry_ar_perception_percentage', numLines, parseFloat(tax_rate));
          invoiceRecord.setSublistValue('item', 'custcol_lmry_ar_item_tributo', numLines, true);
          invoiceRecord.setSublistValue('item', 'custcol_lmry_base_amount', numLines, amount_base);
          invoiceRecord.setSublistValue('item', 'custcol_lmry_ar_perception_account', numLines, aux_cadena);
          invoiceRecord.setSublistValue('item', 'custcol_lmry_ar_perception_adjustment', numLines, adjustment);

          if (CodeCountry == "AR") {
            // Name: Latam Col - AR Norma IIBB - ARCIBA
            if (iibbnorma != '' && iibbnorma != null) {
              invoiceRecord.setSublistValue('item', 'custcol_lmry_ar_norma_iibb_arciba', numLines, iibbnorma);
            }
            // Name: Latam Col - AR Jurisdiccion IIBB
            if (juriisibb != '' && juriisibb != null) {
              invoiceRecord.setSublistValue('item', 'custcol_lmry_ar_col_jurisd_iibb', numLines, juriisibb);
            }
            // Name: Latam Col - AR Regimen
            if (regimenen != '' && regimenen != null) {
              invoiceRecord.setSublistValue('item', 'custcol_lmry_ar_col_regimen', numLines, regimenen);
            }
          }

          // Department
          if (FeaDepa || FeaDepa == 'T') {
            if (r_department != '' && r_department != null) {
              invoiceRecord.setSublistValue('item', 'department', numLines, r_department);
            } else {
              if (pref_dep || pref_dep == 'T') {
                invoiceRecord.setSublistValue('item', 'department', numLines, department_setup);
              }
            }
          }

          // Class
          if (FeaClas || FeaClas == 'T') {
            if (r_class != '' && r_class != null) {
              invoiceRecord.setSublistValue('item', 'class', numLines, r_class);
            } else {
              if (pref_clas || pref_clas == 'T') {
                invoiceRecord.setSublistValue('item', 'class', numLines, class_setup);
              }
            }
          }

          var fieldLocation = invoiceRecord.getSublistField({ sublistId: 'item', fieldId: 'location', line: numLines });
          // Location
          if (fieldLocation != '' && fieldLocation != null && (FeaLoca || FeaLoca == 'T')) {
            if (r_location != '' && r_location != null) {

              invoiceRecord.setSublistValue('item', 'location', numLines, r_location);
            } else {
              if (pref_loc || pref_loc == 'T') {
                invoiceRecord.setSublistValue('item', 'location', numLines, location_setup);

              }
            }
          }

          // Incrementa las lineas
          numLines++;

        }
      }
    }

    /* ***************************************************
     * Fecha : 2022.03.29
     * ISSUE : Nose considerba la linea de descuentos
     *         por total
     * ************************************************ */
    function logicaDescuentos(invoiceRecord, numLines) {
      try {
        var pos = 0;
        var trantype = '';
        var posgroup = 0;
        // Begin for
        for (var i = 1; i < numLines && numLines > 1; i++) {
          var type_anterior = invoiceRecord.getSublistValue('item', 'itemtype', i - 1);
          var type_actual = invoiceRecord.getSublistValue('item', 'itemtype', i);

          // log.debug("Line : " + i + " - type_anterior : " + type_anterior, "type_actual : " + type_actual);

          // Guarda la posicion inicial del ItemGroup
          if (type_actual == "Group") {
            posgroup = i;
          }

          // Discount
          if (type_actual == "Discount" && type_anterior != "Discount") {
            var disc_amount = invoiceRecord.getSublistValue('item', 'amount', i);

            // 2023-07-18 : Solo actualiza si la linea anterior no es un EndGroup
            // log.debug("Line : " + i + " - logicaDescuentos : ", 'SaleDisc : ' + disc_amount);
            if (type_anterior != "EndGroup") {
              // Valida que el campo Latam Col - Sales Discount este vacio
              var SaleDisc = invoiceRecord.getSublistValue('item', 'custcol_lmry_col_sales_discount', i - 1);
              if (SaleDisc == '' || SaleDisc == null) {
                invoiceRecord.setSublistValue('item', 'custcol_lmry_col_sales_discount', i - 1, Math.abs(disc_amount));
              }
            } else {
              // Actualiza la linea principal del ItemGroup
              // log.debug("Group : ", 'Pos : ' + posgroup);
              if (posgroup != -1) {
                // Valida que el campo Latam Col - Sales Discount este vacio
                var SaleDisc = invoiceRecord.getSublistValue('item', 'custcol_lmry_col_sales_discount', posgroup);
                if (SaleDisc == '' || SaleDisc == null) {
                  invoiceRecord.setSublistValue('item', 'custcol_lmry_col_sales_discount', posgroup, Math.abs(disc_amount));
                }
                posgroup = -1;
              }
            } // EndGroup
          } // Discount
        } // End for
      } catch (errmsg) {
        // Envio de mail con errores
        LibraryMail.sendemail('[ logicaDescuentos ] ' + errmsg, Name_script);
      }
    }

    /**************************************************************
     * Funcion contieneTributo verifica si en la lineas (item) esta
     * marcado el campo personalizado.
     * Name. : Latam Col - Item Tributo
     * ID ...: custcol_lmry_ar_item_tributo
     *********************************************************** */
    function contieneTributo(invoiceRecord, numLines, cantidad) {
      var tributo = false;

      for (var i = 0; i < numLines; i++) {
        var tiene_tributo = invoiceRecord.getSublistValue('item', 'custcol_lmry_ar_item_tributo', i);
        var perception_percentage = invoiceRecord.getSublistValue('item', 'custcol_lmry_ar_perception_percentage', i);
        if (tiene_tributo == true && (perception_percentage != null && perception_percentage != '')) {
          tributo = true;
          //log.error('rate', invoiceRecord.getSublistValue('item', 'rate', i));
          if (cantidad > 0) {
            sumaPercepciones = sumaPercepciones + parseFloat(invoiceRecord.getSublistValue('item', 'rate', i));
          }
        }
      }

      return tributo;
    }

    /**************************************************************
     * Funcion validarTipoDoc para validar si el tipo de documento
     * de la transaccion se encuentra en el registro personalizado
     * Name... : LatamReady - Doc Type Perceptions
     * ID..... : customrecord_lmry_ar_doctype_percep
     * Bundle. : 37714 - LamtamReady
     *********************************************************** */
    function validarTipoDoc(tipoDoc,typeTransaction) {
      try {
        var tipoDocEncontrado = false;
        if (typeTransaction == "salesorder" || typeTransaction == "estimate") {
          return true;
        }
        if (tipoDoc == '' || tipoDoc == null) {
          return tipoDocEncontrado;
        }

        var busqDocTypePerc = search.create({
          type: 'customrecord_lmry_ar_doctype_percep', columns: ['custrecord_lmry_ar_doctype_percep'],
          filters: [['custrecord_lmry_ar_doctype_percep', 'anyof', tipoDoc]]
        });

        var resultDocTypePerc = busqDocTypePerc.run().getRange(0, 100);
        if (resultDocTypePerc != null && resultDocTypePerc.length != 0) {
          tipoDocEncontrado = true;
        }
      } catch (errmsg) {
        // Envio de mail con errores
        LibraryMail.sendemail('[ validarTipoDoc ] ' + errmsg, Name_script);
      }

      //log.error("Step [04] validarTipoDoc:", tipoDocEncontrado);

      return tipoDocEncontrado;
    }


    /**************************************************************
     * Funcion que elimina las lineas de percepcion
     * Name. : Latam Col - Item Tributo
     * ID ...: custcol_lmry_ar_item_tributo
     *********************************************************** */

    function removePerceptionLines(recordObj) {
      var currentNumberLine = recordObj.getLineCount({
        sublistId: 'item'
      });
      var deletedTransactions = [];
      for (var i = currentNumberLine-1; i >= 0; i--) {
        
        var isItemTax = recordObj.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_lmry_ar_item_tributo',
          line: i
        });
        
        if (isItemTax || isItemTax == 'T') {
          deletedTransactions.push(i);
        }
      }
      deletedTransactions.forEach(function (id) {
        recordObj.removeLine({
          sublistId: 'item',
          line: id
        });
      });
    }

    // Regresa la funcion para el User Event
    return {
      autoperc_beforeSubmit: autoperc_beforeSubmit,
      removePerceptionLines: removePerceptionLines
    };
  });
