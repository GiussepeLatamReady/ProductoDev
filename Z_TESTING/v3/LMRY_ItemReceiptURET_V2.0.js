/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for Transaction Item Receipt                   ||
||                                                              ||
||  File Name: LMRY_ItemReceiptURET_V2.0.js                     ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 25 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */
define(['N/search', 'N/record', 'N/https', 'N/runtime', 'N/query', 'N/log', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0',
  './Latam_Library/LMRY_HideView3LBRY_V2.0', './Latam_Library/LMRY_GLImpact_LBRY_V2.0', "./Latam_Library/LMRY_Log_LBRY_V2.0", './Latam_Library/LMRY_UniversalSetting_Fulfillment_Receipt_LBRY', 'N/ui/serverWidget', "./WTH_Library/LMRY_ItemReceiptTaxResults_LBRY_v2.0",
  './Latam_Library/LMRY_libToolsFunctionsLBRY_V2.0'],
  function (search, record, https, runtime, query, log, library_mail, library_HideView, libraryGLImpact, lbryLog, library_Uni_Setting, serverWidget, libTaxResult, libtools) {
    var LMRY_script = 'LatamReady - Item Receipt URET V2.0';
    function beforeLoad(context) {
      var type = context.type;
      var recordObj = context.newRecord;
      var OBJ_FORM = context.form;
      try {
        if (type == 'print' || type == 'email') {
          return true;
        }
        if (type != 'print' && type != 'email') {
          var FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
          var subsidiary = 1;
          if (FEAT_SUBS == true || FEAT_SUBS == "T") {
            subsidiary = recordObj.getValue({
              fieldId: 'subsidiary'
            });
          }

          // 08.09.2021 - La logica se paso al script Cliente

          if (!subsidiary) {
            subsidiary = runtime.getCurrentUser().subsidiary;
          }

          var licences = [];

          if (subsidiary) {
            licences = library_mail.getLicenses(subsidiary);
          }

          var LMRY_Result = ValidateAccessIRU(subsidiary, licences);
          var country = LMRY_Result.slice(0, 2);
          var hasAccess = LMRY_Result[2];

          hideandViewFields(context, country, hasAccess, licences);
          if (context.type == 'create') {
            OBJ_FORM.addField({
              id: 'custpage_uni_set_status',
              label: 'Set Estatus',
              type: serverWidget.FieldType.CHECKBOX
            }).defaultValue = 'F';
          }
        }
        // Lógica GL Impact
        if (context.type == 'view') {

          // Obtiene el idioma del entorno
          var featurelang = runtime.getCurrentScript().getParameter({
            name: 'LANGUAGE'
          });
          featurelang = featurelang.substring(0, 2);

          var btnGl = libraryGLImpact.featureGLImpact(recordObj, 'itemreceipt');

          if (btnGl == 1) {
            if (featurelang == 'es') {
              OBJ_FORM.addButton({
                id: 'custpage_id_button_imp',
                label: 'IMPRIMIR GL',
                functionName: 'onclick_event_gl_impact()'
              });
            } else {
              OBJ_FORM.addButton({
                id: 'custpage_id_button_imp',
                label: 'PRINT GL',
                functionName: 'onclick_event_gl_impact()'
              });
            }
            OBJ_FORM.clientScriptModulePath = './Latam_Library/LMRY_GLImpact_CLNT_V2.0.js';
          }

          //Botón MX Pediments
          var recordID = recordObj.id;
          if (library_mail.getAuthorization(521, licences) && country[0] == 'MX') {
            if (searchPediments(recordID)) {
              OBJ_FORM.addButton({
                id: 'custpage_receipt_button_pediments',
                label: 'MX - PEDIMENTS',
                functionName: 'onclick_receipt_pediments()'
              });

              OBJ_FORM.clientScriptModulePath = './Latam_Library/LMRY_GLImpact_CLNT_V2.0.js';
            } else {
              OBJ_FORM.removeButton('edit');
            }
          }
        }



        if (context.type != 'print' && context.type != 'email') {

          //SETEO DEL CUSTBODY LATAMREADY - BR TRANSACTION TYPE PARA FILTRAR LA COLUMNA CFOP
          if (LMRY_Result[0] == 'BR' && LMRY_Result[2] == true && (context.type == 'create' || context.type == 'edit' || context.type == 'copy')) {
            var transactionType = recordObj.getValue('custbody_lmry_br_transaction_type');
            var createdFrom = recordObj.getValue('createdfrom');
            if (!transactionType || (createdFrom != '' && createdFrom != null)) {
              var typeStandard = recordObj.getValue('type');
              if (typeStandard != null && typeStandard != '') {
                var searchTransactionType = search.create({ type: 'customrecord_lmry_trantype', columns: ['internalid'], filters: [{ name: 'name', operator: 'is', values: typeStandard }] });
                var resultTransactionType = searchTransactionType.run().getRange({ start: 0, end: 1 });
                if (resultTransactionType != null && resultTransactionType.length > 0) {
                  recordObj.setValue({ fieldId: 'custbody_lmry_br_transaction_type', value: resultTransactionType[0].getValue('internalid') });
                }

              }
            }
          }

          //C0967
          var transacOrderType = recordObj.getValue({ fieldId: "ordertype" }) || "";
          if (["create"].indexOf(type) != -1 && transacOrderType == "TrnfrOrd" && LMRY_Result[0] == "BR") {
            recordObj.setValue("custbody_lmry_num_preimpreso", "");
          }
        }


      }
      catch (err) {
        log.error('BeforeLoad', err);
        library_mail.sendemail2(' [ BeforeLoad ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
        lbryLog.doLog({ title: "[ BeforeLoad ]", message: err });
      }
    }

    function beforeSubmit(context) {
      var recordObj = context.newRecord;
      try {
        var eventType = context.type;
        var type_interface = runtime.executionContext;
        var licenses = [];
        var FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
        var FEAT_LANDEDCOST = runtime.isFeatureInEffect({ feature: "LANDEDCOST" });
        var subsidiary = 1;
        if (FEAT_SUBS == true || FEAT_SUBS == "T") {
          subsidiary = recordObj.getValue("subsidiary");
        }

        if (subsidiary) {
          licenses = library_mail.getLicenses(subsidiary);
        }

        var LMRY_Result = ValidateAccessIRU(subsidiary, licenses);

        //Universal Settings se realiza solo al momento de crear
        if (eventType == 'create' && type_interface == 'USERINTERFACE') {
          var type_document = recordObj.getValue('custbody_lmry_document_type');

          if (library_Uni_Setting.auto_universal_setting(licenses, false)) {
            //Solo si el campo LATAM - LEGAL DOCUMENT TYPE se encuentra vacío

            if (recordObj.getValue('custpage_uni_set_status') == 'F' && (type_document == '' || type_document == null)) {
              //Seteo campos cabecera, numero pre impreso y template
              library_Uni_Setting.automatic_setfield(recordObj, false);
              library_Uni_Setting.set_preimpreso(recordObj, LMRY_Result, licenses);
              library_Uni_Setting.set_template(recordObj, licenses);
              recordObj.setValue('custpage_uni_set_status', 'T');
            }
          }
        }
        //C0967
        var transacOrderType = recordObj.getValue({ fieldId: "ordertype" }) || "";
        if (["edit", "create"].indexOf(eventType) != -1 && transacOrderType == "TrnfrOrd" && LMRY_Result[0] == "BR") {
          recordObj.setValue("custbody_lmry_scheduled_process", false);
          llenarPreimpresoIR(recordObj);
        }

        if (LMRY_Result[0] == "BR" && LMRY_Result[2] && (eventType == "create" || eventType == "edit")) {
          libTaxResult.setLinePosition(recordObj);
        }

        if (LMRY_Result[0] == "PE" && LMRY_Result[2] && (eventType == "create" || eventType == "edit")) {
          if (library_mail.getAuthorization(415, licenses)) {
            if (FEAT_LANDEDCOST == true || FEAT_LANDEDCOST == "T") {
              setLandedCost(recordObj);
            }
          }
        }
        if (LMRY_Result[0] == "MX" && (eventType == "create" || eventType == "edit") /*&& type_interface !== 'USERINTERFACE'*/) {
          var idPurchaseOrder = recordObj.getValue("createdfrom");
          var linesItems = getPedimentoMXtransaction(idPurchaseOrder);
          if (linesItems.length > 0) {
            var nLines = recordObj.getLineCount({
              sublistId: "item"
            });
            for (var index = 0; index < nLines; index++) {
              recordObj.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_lmry_mx_pediment",
                line: index,
                value: true
              });
            };
          }
        }

      } catch (err) {
        log.error("[ beforeSubmit ]", err);
        library_mail.sendemail2(' [ beforeSubmit ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
        lbryLog.doLog({ title: "[ beforeSubmit ]", message: err });
      }
    }

    function afterSubmit(context) {
      var recordObj = context.newRecord;
      try {
        var eventType = context.type;
        var type_interface = runtime.executionContext;
        var licenses = [];
        var FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });

        var subsidiary = 1;
        if (FEAT_SUBS == true || FEAT_SUBS == "T") {
          subsidiary = recordObj.getValue("subsidiary");
        }

        if (subsidiary) {
          licenses = library_mail.getLicenses(subsidiary);
        }

        var LMRY_Result = ValidateAccessIRU(subsidiary, licenses);
        log.debug("LMRY_Result", JSON.stringify(LMRY_Result));

        //Universal Setting se realiza solo al momento de crear
        if (eventType == 'create' && type_interface == 'USERINTERFACE') {
          var type_document = recordObj.getValue('custbody_lmry_document_type');

          //Mediante el custpage se conoce que el seteo de cabecera fue realizado por Universal Setting
          if (recordObj.getValue('custpage_uni_set_status') == 'T') {
            //Seteo de campos perteneciente a record anexado
            library_Uni_Setting.automatic_setfieldrecord(recordObj);
          }
        }
        //C0967 - Solo Importación desde Transfer Order (se valida el campo Vendor Import del BR Transaction)
        /*
          Busqueda de BR Transaction:
            Si no existe se crea.
            Si existe (Posible caso Automatic Set), verificar que tenga el campo vendor import, si no tiene, completarlo del BR Transaction del Transfer Order existente del Item Receipt.
        */
        var transacOrderType = recordObj.getValue({ fieldId: "ordertype" }) || "";
        var createdFrom = recordObj.getValue({ fieldId: "createdfrom" }) || "";
        if (["create", "edit"].indexOf(eventType) != -1 && LMRY_Result[0] == "BR" && LMRY_Result[2] && transacOrderType == "TrnfrOrd" && createdFrom) {
          //Solo al crear el Item Receipt se creará BR Transaction Fields
          var dataBRTransactionField = searchBRTransactionField(recordObj.id);
          if (!dataBRTransactionField[0]) {
            createBRTransactionField(createdFrom, recordObj);
          } else if (!dataBRTransactionField[1]) {
            updateBRTransactionField(
              createdFrom,
              recordObj,
              dataBRTransactionField
            );
          }
        }

        if (LMRY_Result[0] == "BR" && LMRY_Result[2] && (eventType == "create" || eventType == "edit") && transacOrderType == "TrnfrOrd" && createdFrom) {
          /*
            C0967
            Existe vendor import del BR Transacition:
              Crear tax result de importación (Solo Transfer Order) 
            No Existe vendor import del BR Transacition:
              Lógica actual (Copia Tax Result del Item Fulfillment - Solo Intercompany Transfer Order)
          */
          var processed = recordObj.getValue("custbody_lmry_scheduled_process");
          var dataBRTransactionField = searchBRTransactionField(recordObj.id);
          var subsidiaryTO = 1;
          if (FEAT_SUBS == true || FEAT_SUBS == "T") {
            var recordTO = search.lookupFields({
              type: search.Type.TRANSFER_ORDER,
              id: createdFrom,
              columns: ["subsidiary"],
            });
            subsidiaryTO = recordTO.subsidiary[0]
              ? recordTO.subsidiary[0].value
              : 1;
          }
          //Solo si coincide la subsidiaria del Item Receipt con la subsidiaria del Transfer Order (Caso Importación)
          if (subsidiary == subsidiaryTO && dataBRTransactionField[1] && dataBRTransactionField[0] && !processed) {
            libTaxResult.calculateII(recordObj, dataBRTransactionField[0]);
          } else if (library_mail.getAuthorization(735, licenses)) {
            libTaxResult.createItemReceiptTaxResults(recordObj);
          }
        }

        if (LMRY_Result[0] == 'MX' && (eventType == 'create' || eventType == 'edit')) {
          if (libtools.searchPediments(recordObj.id)) {
            const lifoInfo = search.create({
              type: 'customrecord_lmry_mx_transaction_fields',
              filters: [
                'custrecord_lmry_mx_transaction_related', 'anyof', recordObj.getValue('createdfrom')
              ],
              columns: ['custrecord_lmry_mx_pedimento_lifo', 'custrecord_lmry_mx_pedimento_fifo', 'custrecord_lmry_mx_pedimento']
            }).run().getRange(0, 1);
            log.debug('mxt', lifoInfo);
            if (lifoInfo.length > 0) {
              log.debug('mxdata', lifoInfo[0].getValue('custrecord_lmry_mx_pedimento_lifo'));
              if (lifoInfo[0].getValue('custrecord_lmry_mx_pedimento_lifo') == true || lifoInfo[0].getValue('custrecord_lmry_mx_pedimento_fifo') == true || lifoInfo[0].getValue('custrecord_lmry_mx_pedimento') != null) {
                var mensaje = https.requestRestlet({
                  deploymentId: "customdeploy_lmry_pedimentos_rlt",
                  scriptId: "customscript_lmry_pedimentos_rlt",
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  urlParams: {
                    idRecord: recordObj.id
                  }
                });
                log.error("mensaje",mensaje)

                if (typeof mensaje != "object" && mensaje.indexOf('Error')) {
                  throw mensaje;
                }
              }
            }
          }
        }

      } catch (err) {
        log.error("[ afterSubmit ]", err);
        library_mail.sendemail2(' [ afterSubmit ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
        lbryLog.doLog({ title: "[ afterSubmit ]", message: err });
      }
    }

    function hideandViewFields(context, country, hasAccess, licenses) {
      var type = context.type;
      var recordObj = context.newRecord;
      var form = context.form;
      var typeTrans = recordObj.type;

      if (form) {
        var types = ['create', 'edit', 'copy', 'view'];

        if (types.indexOf(type) != -1) {


          var functionsBySection = { '2': 'PxHide', '5': 'PxHideSubTab', '3': 'PxHideColumn' };
          var codeCountry = "";

          if (hasAccess) {
            codeCountry = country[0];
          }

          for (var section in functionsBySection) {
            var isActive = library_mail.getHideView(country, section, licenses);
            if (isActive || (!licenses || !licenses.length)) {
              library_HideView[functionsBySection[section]](form, codeCountry, typeTrans);
            }

          }
        }
      }
    }

    function ValidateAccessIRU(idSubsidiary, licenses) {
      var LMRY_access = false;
      var LMRY_countr = [];
      var LMRY_Result = [];

      LMRY_countr = library_mail.Validate_Country(idSubsidiary);

      if (!LMRY_countr.length) {
        LMRY_Result[2] = false;
        return LMRY_Result;
      }

      LMRY_access = library_mail.getCountryOfAccess(LMRY_countr, licenses);
      LMRY_Result = [LMRY_countr[0], LMRY_countr[1], LMRY_access]; //CountryText, CountryId, Localization

      return LMRY_Result;
    }

    function searchPediments(obj_ped) {
        //Busca si la transacción ya se registró en el record LatamReady - MX Pediments Detail
        var search_ped = search.create({ type: 'customrecord_lmry_mx_pedimento_details', filters: [{ name: 'custrecord_lmry_mx_ped_trans', operator: 'is', values: obj_ped }], columns: ['internalid'] });
        var result_ped = search_ped.run().getRange({ start: 0, end: 1 });

        if (result_ped != null && result_ped.length > 0) {
          return false;
        } else {
          return true;
        }
    }

    function setLandedCost(recordObj) {
      try {
        // Sublista Item
        var numItems = recordObj.getLineCount("item");
        var lineCost = '';
        var dataLines = [];
        var costs = [];
        for (var i = 0; i < numItems; i++) {
          lineCost = recordObj.getSublistSubrecord('item', 'landedcost', i);
          var cantCost = lineCost.getLineCount('landedcostdata');
          var dataLine = { amount: 0, landedcost: [] };
          for (var j = 0; j < cantCost; j++) {
            // Internal ID
            var costCate = lineCost.getSublistValue("landedcostdata", "costcategory", j);
            // Amount
            var costAmon = lineCost.getSublistValue("landedcostdata", "amount", j);
            // push lineas
            dataLine.landedcost.push({ category: costCate, amount: costAmon });
            dataLine.amount += costAmon;
            costs.push(costCate);
          }
          
          dataLines.push(dataLine);
        }

        if (!costs.length) return true;
        // Obtencion de los Cost categories
        var dataCostSearch = search.create({
          type: "costcategory",
          columns: ["internalid", "account"],
          filters: [
            ["internalid", "anyof", costs]
          ]
        }).run().getRange(0, 1000);

        var dataCost = {};
        if (dataCostSearch && dataCostSearch.length) {
          for (var i = 0; i < dataCostSearch.length; i++) {
            var id = dataCostSearch[i].getValue("internalid");
            var account = dataCostSearch[i].getValue("account");
            dataCost[id] = { account: account, debit: "", credit: "" };
          }
        }
        
        // Obtencion de las cuentas de los costcategories
        var categoryAccounts = search.create({
          type: "customrecord_lmry_cost_category_accounts",
          columns: ["custrecord_lmry_cost_category_id", "custrecord_lmry_cost_category_purch_acc", "custrecord_lmry_cost_category_stock_acc"],
          filters: [
            ["custrecord_lmry_cost_category_id", "anyof", costs]
          ]
        }).run().getRange(0, 1000);

        if (categoryAccounts && categoryAccounts.length) {
          for (var i = 0; i < categoryAccounts.length; i++) {
            var id = categoryAccounts[i].getValue("custrecord_lmry_cost_category_id");
            if (!dataCost[id]) continue;
            var purch = categoryAccounts[i].getValue("custrecord_lmry_cost_category_purch_acc");
            var stock = categoryAccounts[i].getValue("custrecord_lmry_cost_category_stock_acc");
            dataCost[id].debit = purch;
            dataCost[id].credit = stock;
          }
        }

        for (var i = 0; i < dataLines.length; i++) {
          var dataLine = dataLines[i];
          if (dataLine.amount) {
            for (var j = 0; j < dataLine.landedcost.length; j++) {
              if (dataCost[dataLine.landedcost[j].category]) {
                dataLine.landedcost[j].debit = dataCost[dataLine.landedcost[j].category].debit || "";
                dataLine.landedcost[j].credit = dataCost[dataLine.landedcost[j].category].credit || "";
                dataLine.landedcost[j].account = dataCost[dataLine.landedcost[j].category].account || "";
              }
            }
            recordObj.setSublistValue('item', 'custcol_lmry_br_taxc_rsp', i, JSON.stringify(dataLine));
          }
        }
      }
      catch(err) {
        log.error('setLandedCost', err);
        library_mail.sendemail2(' [ setLandedCost ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }
    }

    function actualizar_serie(recordObj) {
      var Auxserie = recordObj.getValue("custbody_lmry_serie_doc_cxc");
      var Auxnumer = recordObj.getValue("custbody_lmry_num_preimpreso");
      if (Auxserie != null && Auxserie != "" && Auxnumer != null &&  Auxnumer != "") {
        var wtax_type = search.create({
          type: "customrecord_lmry_serie_impresion_cxc",
          filters: [["internalid", "anyof", Auxserie]],
          columns: [
            search.createColumn({
              name: "formulanumeric",
              formula: "{custrecord_lmry_serie_numero_impres}",
            }),
          ],
        });
        var results = wtax_type.run().getRange(0, 1);
        if (!results || !results.length) {
          return;
        }
  
        var columns = wtax_type.columns;
  
        var nroConse = parseInt(results[0].getValue(columns[0]));
  
        if (parseFloat(Auxnumer) > parseFloat(nroConse)) {
          var id = record.submitFields({
            type: "customrecord_lmry_serie_impresion_cxc",
            id: Auxserie,
            values: {
              custrecord_lmry_serie_numero_impres: parseFloat(Auxnumer),
            },
          });
        }
      }
    }
  
    function llenarPreimpresoIR(recordObj) {
      try {
        //Preimpreso
        var prePrinted = recordObj.getValue("custbody_lmry_num_preimpreso");
        var serieCxc = recordObj.getValue("custbody_lmry_serie_doc_cxc");
        if (!prePrinted && serieCxc) {
          var dataSerie = search.create({
            type: "customrecord_lmry_serie_impresion_cxc",
            filters: [["internalid", "anyof", serieCxc]],
            columns: [
              search.createColumn({
                name: "formulanumeric",
                formula: "{custrecord_lmry_serie_numero_impres}",
              }),
              "custrecord_lmry_serie_rango_fin",
              "custrecord_lmry_serie_num_digitos",
              "name",
            ],
          });
          var resultSerie = dataSerie.run().getRange(0, 1);
          if (!resultSerie || !resultSerie.length) {
            return;
          }
          var columns = dataSerie.columns;
          var nroConse = parseInt(resultSerie[0].getValue(columns[0])) + 1;
          var maxPermi = parseInt(resultSerie[0].getValue(columns[1]));
          var digitos = parseInt(resultSerie[0].getValue(columns[2]));
          if (digitos == "" || digitos == null) {
            return true;
          }
          //Crea el numero consecutivo
          if (nroConse > maxPermi) {
            // Asigna el numero pre-impreso
            recordObj.setValue("custbody_lmry_num_preimpreso", "");
          } else {
            var longNumeroConsec = parseInt((nroConse + "").length);
            var llenarCeros = "";
            for (var i = 0; i < digitos - longNumeroConsec; i++) {
              llenarCeros += "0";
            }
            nroConse = llenarCeros + nroConse;
            // Asigna el numero pre-impreso
            recordObj.setValue("custbody_lmry_num_preimpreso", nroConse);
            //Actualizar la serie
            actualizar_serie(recordObj);
          }
        }
      } catch (error) {
        log.error("preimpreso", error);
      }
    }
  
    function createBRTransactionField(idTransferOrder, recordObj) {
      var vendorItemReceipt = "";
      var idSubsidiaryTO = "";
      var subsidiary = 1;
      var FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
      if (FEAT_SUBS == true || FEAT_SUBS == "T") {
        subsidiary = recordObj.getValue({
          fieldId: "subsidiary",
        });
      }
      var dataBRTransaction = search.create({
        type: "customrecord_lmry_br_transaction_fields",
        filters: [
          ["custrecord_lmry_br_related_transaction", "anyof", idTransferOrder],
        ],
        columns: [
          search.createColumn({ name: "custrecord_lmry_br_vendor_import" }),
        ],
      });
      if (FEAT_SUBS == true || FEAT_SUBS == "T") {
        dataBRTransaction.columns.push(
          search.createColumn({ name: "custrecord_lmry_br_tf_subdidiary" })
        );
      }
      var resultBRTO = dataBRTransaction.run().getRange(0, 1);
      if (resultBRTO.length > 0) {
        vendorItemReceipt = resultBRTO[0].getValue(
          "custrecord_lmry_br_vendor_import"
        );
        if (FEAT_SUBS == true || FEAT_SUBS == "T") {
          idSubsidiaryTO = resultBRTO[0].getValue(
            "custrecord_lmry_br_tf_subdidiary"
          );
        }
      }
      if (vendorItemReceipt) {
        if (idSubsidiaryTO == subsidiary) {
          var newBRTransaction = record.create({
            type: "customrecord_lmry_br_transaction_fields",
            isDynamic: false,
          });
          newBRTransaction.setValue({
            fieldId: "custrecord_lmry_br_related_transaction",
            value: recordObj.id,
            ignoreFieldChange: true,
          });
          newBRTransaction.setValue({
            fieldId: "custrecord_lmry_br_vendor_import",
            value: vendorItemReceipt,
            ignoreFieldChange: true,
          });
          var idBR = newBRTransaction.save({
            disableTriggers: true,
            ignoreMandatoryFields: true,
          });
        }
      }
    }
  
    function updateBRTransactionField(idTransferOrder, recordObj, dataBRTransactionField) {
      var idBRTransactionField = dataBRTransactionField[0];
      var idSubsidiaryTO = "";
      var subsidiary = 1;
      var FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
      if (FEAT_SUBS == true || FEAT_SUBS == "T") {
        subsidiary = recordObj.getValue({
          fieldId: "subsidiary",
        });
      }
      var dataBRTransaction = search.create({
        type: "customrecord_lmry_br_transaction_fields",
        filters: [
          ["custrecord_lmry_br_related_transaction", "anyof", idTransferOrder],
        ],
        columns: [
          search.createColumn({ name: "custrecord_lmry_br_vendor_import" }),
        ],
      });
      if (FEAT_SUBS == true || FEAT_SUBS == "T") {
        dataBRTransaction.columns.push(
          search.createColumn({ name: "custrecord_lmry_br_tf_subdidiary" })
        );
      }
      var resultBRTO = dataBRTransaction.run().getRange(0, 1);
      if (resultBRTO.length > 0) {
        var vendorItemReceipt = resultBRTO[0].getValue(
          "custrecord_lmry_br_vendor_import"
        );
        if (FEAT_SUBS == true || FEAT_SUBS == "T") {
          idSubsidiaryTO = resultBRTO[0].getValue(
            "custrecord_lmry_br_tf_subdidiary"
          );
        }
        if (vendorItemReceipt) {
          if (idSubsidiaryTO == subsidiary) {
            record.submitFields({
              type: "customrecord_lmry_br_transaction_fields",
              id: idBRTransactionField,
              values: { custrecord_lmry_br_vendor_import: vendorItemReceipt },
              options: {
                disableTriggers: true,
                enableSourcing: true,
                ignoreMandatoryFields: true,
              },
            });
            log.debug("si actualiza", "actualizado");
          } else {
            log.debug("no coincide la subsidiaria", "no actualiza");
          }
        }
      }
    }
  
    function searchBRTransactionField(idItemReceipt) {
      var valuesBRTransaction = new Array();
      var brTransaction = search.create({
        type: "customrecord_lmry_br_transaction_fields",
        filters: [
          ["custrecord_lmry_br_related_transaction", "anyof", idItemReceipt],
        ],
        columns: ["internalid", "custrecord_lmry_br_vendor_import"],
      });
      var resultBRTransaction = brTransaction.run().getRange(0, 1);
      if (resultBRTransaction && resultBRTransaction.length > 0) {
        var idBR = resultBRTransaction[0].getValue("internalid");
        var vendorImport = resultBRTransaction[0].getValue(
          "custrecord_lmry_br_vendor_import"
        );
        valuesBRTransaction.push(idBR);
        valuesBRTransaction.push(vendorImport);
      }
      return valuesBRTransaction;
    }

    function getPedimentoMXtransaction(idPO) {
      log.debug("idpo", idPO);
      if (Number(idPO) === 0 || idPO === undefined) return [];
      var consulta = "SELECT       CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_pedimento,        CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_pedimento_aduana      FROM        CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS       WHERE         CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_transaction_related = " + idPO + "   and      CUSTOMRECORD_LMRY_MX_TRANSACTION_FIELDS.custrecord_lmry_mx_pedimento IS NOT NULL";
      log.debug("consulta", consulta);
      var nroPedimentoandAduana = query.runSuiteQL({
        query: consulta,
      }).asMappedResults();
      return nroPedimentoandAduana;
    }

    return {
      beforeLoad: beforeLoad,
      beforeSubmit: beforeSubmit,
      afterSubmit: afterSubmit
    }
  });
