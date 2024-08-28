
/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_CreditMemoCLNT_V2.0.js                      ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 20 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

define(['N/currency', 'N/record', 'N/log', 'N/currentRecord', 'N/search', 'N/runtime', 'N/url', 'N/https', 'N/format', 'N/translation', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0',
  './Latam_Library/LMRY_Val_TransactionLBRY_V2.0', './Latam_Library/LMRY_libNumberInWordsLBRY_V2.0', './Latam_Library/LMRY_ExchangeRate_LBRY_V2.0',
  './Latam_Library/LMRY_AlertTraductorSale_LBRY_V2.0', './Latam_Library/LMRY_ST_Transaction_ConfigFields_LBRY_V2.0', './Latam_Library/LMRY_WebService_LBRY_v2.0.js',
  './Latam_Library/LMRY_BR_ValidateDuplicate_LBRY_V2.0', './Latam_Library/LMRY_CO_Duplicate_Credit_Memos_CLTN_LBRY_V2.0', './Latam_Library/LMRY_Custom_ExchangeRate_LBRY_V2.0.js'
],

  function (currency, record, log, currentRecord, search, runtime, url, https, format, translation, libraryMail, library_Val, libraryNumber, library_ExchRate, library_translator,
    ST_ConfigFields, LR_webService, LbryBRDuplicate, Library_Duplicate_Clnt, Library_ExchangeRate) {

    var LMRY_script = 'LatamReady - Credit Memo CLNT V2.0';
    var LMRY_access = false;
    var LMRY_countr = new Array();
    var LMRY_swsubs = false;
    var LMRY_swinit = false;
    var LMRY_swpnro = false;
    var LMRY_parent = false;
    var LMRY_SW_Nro = false;
    var boo_PageIni = false;
    var featuresubs = false;
    var fegetMatch = false;
    var licenses = [];

    var recordObj = '';
    var Val_Campos = new Array();
    var Val_Campos_Linea = new Array();
    var type = '';

    var Language = '';
    var subsidiary = '';

    var idcurrencyUSD = 0;

    // SuiteTax
    var ST_FEATURE = false;

    //CL CHANGE CURRENCY UF
    var jsonCurrencies = {};
    var fieldRateUF = '';

    //VERIFY DUPLICATE CREDIT MEMO
    var old_record = {};
    var old_record_lines = [];
    var flagReloadSubsidiary = false;
    var FEAT_MULTISUBCUSTOMER = runtime.isFeatureInEffect({
      feature: "multisubsidiarycustomer"
    });
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext - The mode in which the record is being accessed (create, copy, or edit)
     * @since 2015.2
     */

    //features camps reference transaction invoice
    var featureReferenceCamp = {
      'AR': 831,
      'BO': 832,
      'BR': 833,
      'CL': 834,
      'CO': 835,
      'CR': 836,
      'EC': 837,
      'SV': 838,
      'GU': 839,
      'MX': 840,
      'NI': 841,
      'PA': 842,
      'PY': 843,
      'PE': 844,
      'DO': 845,
      'UY': 846,
    }
    function CMClnt_PageInit(scriptContext) {

      try {

        /* MODIFICACION ,para la captura del idioma */
        Language = runtime.getCurrentScript().getParameter({
          name: 'LANGUAGE'
        });
        Language = Language.substring(0, 2);
        /*Fin Modificacion*/

        boo_PageIni = true;
        recordObj = scriptContext.currentRecord;
        subsidiary = recordObj.getValue('subsidiary');

        licenses = libraryMail.getLicenses(subsidiary);
        // Esta cargado el formulario
        LMRY_swinit = true;
        LMRY_swsubs = true;

        type = scriptContext.mode;

        // Valida el Acceso
        featuresubs = runtime.isFeatureInEffect({
          feature: 'SUBSIDIARIES'
        });
        if (featuresubs == true || featuresubs == 'T') {
          ValidateAccessCM(recordObj.getValue({
            fieldId: 'subsidiary'
          }));
        } else {
          ValidateAccessCM(1);
        }

        fegetMatch = libraryMail.getmatchfe(LMRY_countr[0], licenses);

        if (type == 'create' || type == 'copy') {
          var lmry_exchange_rate_field = recordObj.getField('custpage_lmry_exchange_rate');
          if (lmry_exchange_rate_field != null && lmry_exchange_rate_field != '') {
            lmry_exchange_rate_field.isDisplay = false;
          }
          var lmry_basecurrency = recordObj.getField('custpage_lmry_basecurrency');
          if (lmry_basecurrency != null && lmry_basecurrency != '') {
            lmry_basecurrency.isDisplay = false;
          }

          if (recordObj.getValue('entity') != '' && recordObj.getValue('entity') != null) {
            Library_ExchangeRate.ws_exchange_rate(recordObj, licenses);
          }
        }

        // Desactiva el campo
        var al_country = recordObj.getValue('custbody_lmry_subsidiary_country');

        if (al_country != '' && al_country != null) {
          recordObj.getField({
            fieldId: 'custbody_lmry_subsidiary_country'
          }).isDisabled = true;
        }

        // Colombia - Performs Manual Retention
        if (libraryMail.getAuthorization(117, licenses) == false && (LMRY_countr[0] == 'CO')) {
          recordObj.getField({
            fieldId: 'custbody_lmry_reference_transaction'
          }).isDisabled = true;
          recordObj.getField({
            fieldId: 'custbody_lmry_reference_transaction_id'
          }).isDisabled = true;
        }

        if (LMRY_countr[0] == 'CO') {
          if (scriptContext.mode == 'edit' && libraryMail.getAuthorization(666, licenses)) {

            if (libraryMail.getAuthorization(27, licenses)) {
              old_record = Library_Duplicate_Clnt.Old_Values_WHT(recordObj);
              old_record_lines = Library_Duplicate_Clnt.generate_oldrecordLines(recordObj);
            }
            if (libraryMail.getAuthorization(340, licenses)) {
              old_record_lines = Library_Duplicate_Clnt.generate_oldrecordLines(recordObj);
            }
          }
        }

        //log.debug('type', type);
        // Solo para cuando es nuevo y se copia
        if (type == 'create' || type == 'copy') {
          // Procesado por el Numerador
          recordObj.setValue({
            fieldId: 'custbody_lmry_scheduled_process',
            value: false
          });
          // Aplicar Latam WHT Code
          recordObj.setValue({
            fieldId: 'custbody_lmry_apply_wht_code',
            value: true
          });
          // Campos de Panama
          recordObj.setValue({
            fieldId: 'custbody_lmry_pa_monto_letras',
            value: ''
          });
          // Campos para El Salvador
          recordObj.setValue({
            fieldId: 'custbody_lmry_wtax_wamt',
            value: 0.00
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_sv_not_taxable_total_sal',
            value: 0.00
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_sv_exempt_total_sales',
            value: 0.00
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_sv_taxable_total_sales',
            value: 0.00
          });
          // Campos WHT Colombia
          recordObj.setValue({
            fieldId: 'custbody_lmry_co_reteica_amount',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_co_reteiva_amount',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_co_retefte_amount',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_co_retecree_amount',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_co_monto_letras',
            value: ''
          });
          // Campos WHT Bolivia
          recordObj.setValue({
            fieldId: 'custbody_lmry_bo_autoreteit_whtamount',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_bo_reteiue_whtamount',
            value: 0
          });
          // Campos WHT Paraguay
          recordObj.setValue({
            fieldId: 'custbody_lmry_total_taxamount_spy',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_total_taxamount_rpy',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_subtotal_amount_spy',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_subtotal_amount_rpy',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_subtotal_amount_epy',
            value: 0
          });
          // Tipo de Documento - Serie  - Numero - Folio
          recordObj.setValue({
            fieldId: 'custbody_lmry_document_type',
            value: ''
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_serie_doc_cxc',
            value: ''
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_num_preimpreso',
            value: ''
          });
          //Para todos los paises

          recordObj.setValue({
            fieldId: 'custbody_lmry_foliofiscal', //LATAM - FISCAL FOLIO
            value: ''
          });
          // Documentos de Referencia
          if (!libraryMail.getAuthorization(featureReferenceCamp[LMRY_countr[0]], licenses)) {
            recordObj.setValue({
              fieldId: 'custbody_lmry_doc_serie_ref',
              value: ''
            });
            recordObj.setValue({
              fieldId: 'custbody_lmry_num_doc_ref',
              value: ''
            });
            recordObj.setValue({
              fieldId: 'custbody_lmry_doc_ref_date',
              value: ''
            });
          }
          // Campos WHT Ecuador
          recordObj.setValue({
            fieldId: 'custbody_lmry_ec_base_rate0',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_ec_base_rate12',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_ec_base_rate14',
            value: 0
          });

          // Campos WHT Peru
          recordObj.setValue({
            fieldId: 'custbody_lmry_wtax_rate',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_wtax_amount',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_wbase_amount',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_wtax_code',
            value: ''
          });

          /********************** MODIFICACION DEL CLNT **********************************
           - Descripción: Se setea con espacios en blancos, para los campos de PE, MX y EC
           - Fecha:20/01/2020
          ********************************************************************************/

          //Campos de Perú
          recordObj.setValue({
            fieldId: 'custbody_lmry_pe_identificador_comfiar', // LATAM - PE IDENTIFICADOR COMFIAR
            value: ''
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_pe_num_aut_comfiar', // LATAM - PE NUM AUTORIZACIÓN COMFIAR
            value: ''
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_pe_estado_comfiar', // LATAM - PE STATUS COMFIAR
            value: ''
          });
          //Campo de México
          recordObj.setValue({
            fieldId: 'custbody_lmry_pe_estado_sf', // LATAM - MX ESTADO SF
            value: ''
          });
          //Campos de Ecuador
          recordObj.setValue({
            fieldId: 'custbody_lmry_num_aut_comfiar_ec', // LATAM - EC NUM AUTORIZACIÓN COMFIAR
            value: ''
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_identificador_comfiar_ec', // LATAM - EC IDENTIFICADOR COMFIAR
            value: ''
          });
          //********************** FIN MODIFICACION  ******************************

        }
        //Logica de Tipo de Cambio Automatico
        var subsi = recordObj.getValue({
          fieldId: 'subsidiary'
        });

        if (LMRY_countr[0] == 'AR') {
          if ((scriptContext.mode == 'create' || scriptContext.mode == 'copy') && libraryMail.getAuthorization(404, licenses)) {
            if (subsi != null && subsi != '') {
              library_ExchRate.autosetExchRate(recordObj, al_country, 'sale');
            }
          }
        }
        if (LMRY_countr[0] == 'BR') {
          if ((scriptContext.mode == 'create' || scriptContext.mode == 'copy') && libraryMail.getAuthorization(321, licenses)) {
            if (subsi != null && subsi != '') {
              library_ExchRate.autosetExchRate(recordObj, al_country, 'sale');
            }
          }
        }
        if (LMRY_countr[0] == 'CO') {
          if ((scriptContext.mode == 'create' || scriptContext.mode == 'copy') && libraryMail.getAuthorization(409, licenses)) {
            if (subsi != null && subsi != '') {
              library_ExchRate.autosetExchRate(recordObj, al_country, 'sale');
            }
          }
        }
        if (LMRY_countr[0] == 'CL') {
          if ((scriptContext.mode == 'create' || scriptContext.mode == 'copy') && libraryMail.getAuthorization(322, licenses)) {
            if (subsi != null && subsi != '') {
              library_ExchRate.autosetExchRate(recordObj, al_country, 'sale');
            }
          }
        }
        if (LMRY_countr[0] == 'MX') {
          if ((scriptContext.mode == 'create' || scriptContext.mode == 'copy') && libraryMail.getAuthorization(289, licenses)) {
            if (subsi != null && subsi != '') {
              library_ExchRate.autosetExchRate(recordObj, al_country, 'sale');
            }
          }
        }
        if (LMRY_countr[0] == 'PE') {
          if ((scriptContext.mode == 'create' || scriptContext.mode == 'copy') && libraryMail.getAuthorization(403, licenses)) {
            if (subsi != null && subsi != '') {
              library_ExchRate.autosetExchRate(recordObj, al_country, 'sale');
            }
          }
        }



        if (type == 'create' || type == 'copy') {
          // Carga los campos desde el cliente
          SetCustomField_WHT_Code_CM();
        }

        //CL CHANGE CURRENCY UF
        if (LMRY_countr[0] == 'CL' && libraryMail.getAuthorization(604, licenses) && (type == 'edit' || type == 'create' || type == 'copy')) {

          var searchCurrencies = search.create({
            type: 'currency',
            columns: ['symbol', 'internalid', 'name'],
            filters: [{ name: 'isinactive', operator: 'is', values: 'F' }]
          });

          searchCurrencies = searchCurrencies.run().getRange(0, 1000);

          for (var i = 0; i < searchCurrencies.length; i++) {
            var idCurrency = searchCurrencies[i].getValue('internalid');
            var name = searchCurrencies[i].getValue('name');
            var symbol = searchCurrencies[i].getValue('symbol');
            symbol = symbol.toUpperCase();

            jsonCurrencies[idCurrency] = { 'symbol': symbol, 'name': name };

          }

          var searchSetupTax = search.create({
            type: 'customrecord_lmry_setup_tax_subsidiary',
            columns: ['custrecord_lmry_setuptax_cl_rate_uf'],
            filters: [{ name: 'isinactive', operator: 'is', values: 'F' }, { name: 'custrecord_lmry_setuptax_subsidiary', operator: 'is', values: subsidiary }]
          });

          searchSetupTax = searchSetupTax.run().getRange(0, 1);

          if (searchSetupTax && searchSetupTax.length && searchSetupTax[0].getValue('custrecord_lmry_setuptax_cl_rate_uf')) {
            fieldRateUF = searchSetupTax[0].getValue('custrecord_lmry_setuptax_cl_rate_uf');
          }

          var currencyTransaction = recordObj.getValue('currency');

          //SOLO SI ES PESO CHILENO: CLP Y EXISTE EL CAMPO
          if (jsonCurrencies[currencyTransaction]['symbol'] == 'CLP' && fieldRateUF && recordObj.getField(fieldRateUF) && type != 'copy') {

            var rateUF = recordObj.getValue(fieldRateUF);
            var createdFrom = recordObj.getValue('createdfrom');
            var tranDate = recordObj.getValue('trandate');

            if (!(parseFloat(rateUF) > 0)) {

              var rateUF = currency.exchangeRate({ source: 'CLF', target: 'CLP', date: tranDate });
              recordObj.setValue({ fieldId: fieldRateUF, value: parseFloat(rateUF), ignoreFieldChange: true });

            }

          } // FIN SOLO SI ES PESO CHILENO

        } //FIN CL CHANGE CURRENCY UF

        //BR CFOP
        if (LMRY_countr[0] == 'BR' && LMRY_access && (type == 'create' || type == 'copy' || type == 'edit')) {

          var createdFrom = recordObj.getValue('createdfrom');
          var transactionType = recordObj.getValue('custbody_lmry_br_transaction_type');

          if (!transactionType || type == 'copy') {
            var typeStandard = recordObj.getValue('type');
            if (typeStandard) {
              var searchTransactionType = search.create({ type: 'customrecord_lmry_trantype', filters: [{ name: 'name', operator: 'is', values: typeStandard }] });
              searchTransactionType = searchTransactionType.run().getRange({ start: 0, end: 1 });

              if (searchTransactionType && searchTransactionType.length) {
                recordObj.setValue('custbody_lmry_br_transaction_type', searchTransactionType[0].id);
              }

            }
          }

        } //FIN BR CFOP

        //Populado de los valores de referencia
        if (LMRY_countr[0] == 'PE' && libraryMail.getAuthorization(136, licenses) && (!libraryMail.getAuthorization(featureReferenceCamp[LMRY_countr[0]], licenses)) && (type == 'create' || type == 'copy')) {
          var idTrans = recordObj.getValue('createdfrom');
          if (idTrans != '' && idTrans != null) {
            var transactionI = search.lookupFields({
              type: 'transaction',
              id: idTrans,
              columns: ['custbody_lmry_serie_doc_cxc', 'custbody_lmry_document_type', 'custbody_lmry_num_preimpreso', 'trandate', 'type']
            });

            if (transactionI.type[0].value == "CustInvc") {
              if (transactionI.trandate) {
                var formatDate = format.parse({ value: transactionI.trandate, type: format.Type.DATE });
                recordObj.setValue({
                  fieldId: 'custbody_lmry_doc_ref_date',
                  value: formatDate
                });
              }
              if (transactionI.custbody_lmry_serie_doc_cxc && transactionI.custbody_lmry_serie_doc_cxc.length) {
                recordObj.setValue({
                  fieldId: 'custbody_lmry_doc_serie_ref',
                  value: transactionI.custbody_lmry_serie_doc_cxc[0].text
                });
              }
              if (transactionI.custbody_lmry_document_type && transactionI.custbody_lmry_document_type.length) {
                recordObj.setValue({
                  fieldId: 'custbody_lmry_doc_ref_type',
                  value: transactionI.custbody_lmry_document_type[0].value
                });
              }
              recordObj.setValue({
                fieldId: 'custbody_lmry_num_doc_ref',
                value: transactionI.custbody_lmry_num_preimpreso
              });
            }

          }
        }
        // Termino cargado el formulario
        LMRY_swinit = false;

        boo_PageIni = false;

      } catch (err) {
        recordObj = scriptContext.currentRecord;
        libraryMail.sendemail2(' [ CMClnt_PageInit ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }

    }

    /* ------------------------------------------------------------------------------------------------------
     * Funcion para validar si esta configurado el LatamReady - Invoicing Identifier
     * por tipo de impuesto
     * --------------------------------------------------------------------------------------------------- */
    function getMatch(inv_id, taxcode) {

      try {

        var match = false;
        /* Registro Personalizado LatamReady - Tax Type by Invoicing ID */

        var country_m = recordObj.getValue('custbody_lmry_subsidiary_country');

        var busqTaxTypeByInvID = search.create({
          type: 'customrecord_lmry_taxtype_by_invoicingid',
          columns: ['custrecord_lmry_inv_id', 'custrecord_lmry_tax_code_invid'],
          filters: ['custrecord_lmry_taxtype_country', 'anyof', country_m]
        });

        var resultTaxTypeByInvID = busqTaxTypeByInvID.run().getRange(0, 100);

        if (inv_id != null && inv_id != '' && inv_id.length > 0) {

          if (resultTaxTypeByInvID != null && resultTaxTypeByInvID != '') {


            for (var j = 0; j < inv_id.length; j++) {

              for (var g = 0; g < resultTaxTypeByInvID.length; g++) {

                var rec_inv_id = resultTaxTypeByInvID[g].getValue('custrecord_lmry_inv_id');
                var rec_code_invid = resultTaxTypeByInvID[g].getValue('custrecord_lmry_tax_code_invid');

                if ((inv_id[j] == '' || inv_id[j] == null || taxcode[j] == '' || taxcode[j] == null) || (rec_inv_id == inv_id[j] && rec_code_invid == taxcode[j])) {

                  match = true;
                  break;
                } else {
                  match = false;
                }
              }
              if (!match) {
                alert(library_translator.getAlert(7, Language, [j + 1]));
                // alert("Línea " + (j + 1) + ". No se encontró relación entre 'Tax Code' y 'Latam Col - Invoicing Identifier'. Ingrese a Setup > LatamReady - Tax Code > Tax Type by Invoicing ID");
                return match;
              }
            }
          } else {
            match = true;
          }
        } else {
          match = true;
        }
      } catch (err) {
        libraryMail.sendemail2(' [ getMatch ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }
      return match;
    }

    function CMClnt_SaveRecord(scriptContext) {

      try {
        // Valida el Acceso
        recordObj = scriptContext.currentRecord;
        if (featuresubs == true || featuresubs == 'T') {
          ValidateAccessCM(recordObj.getValue({
            fieldId: 'subsidiary'
          }));
        } else {
          ValidateAccessCM(1);
        }

        /* Validacion 04/02/22 */
        var lockedPeriod = recordObj.getValue("custpage_lockedperiod");
        log.error('lockedPeriod', lockedPeriod);
        if (lockedPeriod == true || lockedPeriod == 'T') {
          return true;
        }
        /* Fin validacion 04/02/22 */

        // Valida Campos Obligatorios
        if (Val_Campos.length > 0) {
          if (library_Val.Val_Mensaje(recordObj, Val_Campos) == false)
            return false;
        }

        //Validación Items Negativos (Solo valido si son descuento)
        var urlInstancia = "" + url.resolveDomain({
            hostType: url.HostType.APPLICATION,
            accountId: runtime.accountid
        });
        var instancia = urlInstancia.split('.');
        //Lógica no debe aplicarse para ENTREVISION, se consideraron instancias SB y PROD.
        var notInstances = ['794777-sb1', '794777'];
        
        if (LMRY_countr[0] != 'PE' && LMRY_access && !notInstances.includes(instancia[0])) {
          var existItemNeg = library_Val.Val_Negative_Item(recordObj);
          if (existItemNeg.length > 0) {
            //Alerta no debe ser obligatoria para cliente SOFTLINE, se consideraron instancias SB y PROD.
            var notAllowInstans = ['5514786-sb1', '5514786']
            if (notAllowInstans.includes(instancia[0])) {
              var message = translation.get({
                collection: "custcollection_lmry_validation_process",
                key: "ALLOW_NEGATIVE_ITEM",
              })();
              alert(message);
              return true
            } else {
              var message = translation.get({
                collection: "custcollection_lmry_validation_process",
                key: "NEGATIVE_ITEM",
              })();
              var alertItemNeg = "";
              for (var i = 0; i < existItemNeg.length; i++) {
                alertItemNeg = alertItemNeg + existItemNeg[i] + message + "\n";
              }
              alert(alertItemNeg);
              return false;
            }
          }
        }

        // Inicializa campos WHT de sumatoria
        if (scriptContext.mode == 'create' || scriptContext.mode == 'copy') {
          SetCustomField_WHT_Init_CM();
        }
        // Validaciones para transferencia gratuita
        var esTTG = recordObj.getValue({
          fieldId: 'custbody_lmry_tranf_gratuita'
        });

        if (esTTG == true || esTTG == 'T') {
          if (Math.abs(parseFloat(recordObj.getValue({
            fieldId: 'discountrate'
          }))) == 100) {
            log.debug('ANTES - ValidaItemsTTG');
            if (ValidaItemsTTG() == false) {
              log.debug('DESPUES - ValidaItemsTTG');
              alert(library_translator.getAlert(8, Language, []));
              // alert('Existen item que no están configurados para ser utilizados en una transferencia gratuita.');
              return false;
            }
          } else {
            alert(library_translator.getAlert(9, Language, []));
            //alert('La transferencia gratuita debe tener un artículo de descuento al 100%.');
            return false;
          }
        }

        // Retenciones del Invoice
        CompleteWHTFields();
        // Solo para las Notas de Credito
        UpdateTotalSales();

        /* ************************************
         * Solo si tiene acceso a LamtamReady
         * se ejecutara la validacion de
         * codigos de impuesto por Linea
         ************************************ */
        if (LMRY_access == true && fegetMatch == true) {
          //var currentRecord = scriptContext.currentRecord;
          var sublistName = scriptContext.sublistId;
          var fieldName = scriptContext.fieldId;

          var numLines = recordObj.getLineCount('item');
          var inv_id = '';
          var taxcode = '';
          var inv_id_cad = new Array();
          var taxcode_cad = new Array();

          for (var i = 0; i < numLines; i++) {
            inv_id = recordObj.getSublistValue('item', 'custcol_lmry_invoicing_id', i);
            taxcode = recordObj.getSublistValue('item', 'taxcode', i);

            inv_id_cad.push(inv_id);
            taxcode_cad.push(taxcode);

          }
          if (!getMatch(inv_id_cad, taxcode_cad)) {
            return false;
          }
        }

        // Valida tranid repetido
        if (LMRY_countr[0] == 'BR' && !LbryBRDuplicate.validateDuplicate(recordObj, licenses)) {
          var tranID = recordObj.getField('tranid');
          switch (Language) {
            case 'es':
              alert('El campo "' + tranID.label + '" (tranid) ingresado ya existe, por favor ingresar uno diferente.');
              break;
            case 'pt':
              alert('O campo "' + tranID.label + '" (tranid) inserido já existe, digite um diferente.');
              break;
            default:
              alert('The field "' + tranID.label + '" (tranid) entered already exists, please enter a different one.');
              break;
          }
          return false;
        }

        /* ******************************************************************************
         * Verifica que este activo el feature Numerar Transaction Number Invoice:
         * AR - Argentina , BO - Bolivia , CL - Chile , CO - Colombia , CR - Costa Rica ,
         * EC - Ecuador , GT - Guatemala , MX - Mexico, PA - Panama , PY - Paraguay,
         * PE - Peru , SV - El Salvador , UY - Uruguay
         ****************************************************************************** */
        // Solo para subsidiaria con acceso - Transaction Number Credit Memo
        var featuresByCountry = {
          'AR': 115,
          'BO': 417,
          'BR': 668,
          'CL': 414, // Feature CL - Print Series
          'CO': 419,
          'CR': 421,
          'DO': 525,
          'EC': 104,
          'GT': 423,
          'MX': 425,
          'PA': 427,
          'PY': 110,
          'PE': 67,
          'SV': 107,
          'UY': 429
        };
        var featureId = featuresByCountry[LMRY_countr[0]];

        if (LMRY_access) {

          /* *********************************************
           * Verifica que este activo el feature Numerar
           * Transaction Number Invoice:
           **********************************************/
          var swnumber = false;
          var clnumber = false;

          if (featureId && libraryMail.getAuthorization(featuresByCountry[LMRY_countr[0]], licenses) == true) {
            swnumber = true;
          }

          // *** No lleva numero de seria ***
          if (LMRY_countr[0] == 'CL') {
            var isSeriesCLActive = libraryMail.getAuthorization(414, licenses);
            if (libraryMail.getAuthorization(113, licenses) == true && !isSeriesCLActive) {
              clnumber = true;
            }
          }

          // Actualiza el numero de serie
          if (swnumber) {
            var Auxserie = recordObj.getValue({
              fieldId: 'custbody_lmry_serie_doc_cxc'
            });
            var Auxnumer = recordObj.getValue({
              fieldId: 'custbody_lmry_num_preimpreso'
            });
            if (Auxserie != null && Auxserie != '' && Auxnumer != null && Auxnumer != '') {
              var nroConse = search.lookupFields({
                type: 'customrecord_lmry_serie_impresion_cxc',
                id: Auxserie,
                columns: ['custrecord_lmry_serie_numero_impres', 'custrecord_ei_preprinted_series']
              });
              var actualNro = nroConse.custrecord_lmry_serie_numero_impres

              var isEISeries = nroConse.custrecord_ei_preprinted_series;

              if (LMRY_countr[0] == 'BR' && (isEISeries == true || isEISeries == 'T')) {
                return true;
              }


              //log.debug('nroConse', nroConse);
              if (parseFloat(Auxnumer) > parseFloat(actualNro)) {
                record.submitFields({
                  type: 'customrecord_lmry_serie_impresion_cxc',
                  id: Auxserie,
                  values: {
                    custrecord_lmry_serie_numero_impres: parseFloat(Auxnumer)
                  }
                });
              }
            }
          }


          // Actualiza el numero de serie (CL)
          if (clnumber) {
            correlativoChile(2);
          }
        }

        if (LMRY_countr[0] == "CO") {
          if (libraryMail.getAuthorization(666, licenses) == true && type == "edit") {
            var msg = {
              "en": "You cannot make changes to withholdings since the document is already issued electronically.",
              "es": "No se puede realizar modificaciones en retenciones dado que el documento ya se encuentra emitido electrónicamente.",
              "pt": "Você não pode fazer alterações nas retenções porque o documento já foi emitido eletronicamente."
            }

            if (Library_Duplicate_Clnt.Validate_EIDocument(recordObj) && (Library_Duplicate_Clnt.Verification_Duplicate_Clnt(old_record, recordObj) || Library_Duplicate_Clnt.Verification_Duplicate_Lines_Clnt(recordObj, old_record_lines)) && libraryMail.getAuthorization(27, licenses)) {
              alert(msg[Language] || msg["en"]);
              return false;
            }
            if (Library_Duplicate_Clnt.Validate_EIDocument(recordObj) && Library_Duplicate_Clnt.Verification_Duplicate_Lines_Clnt(recordObj, old_record_lines) && libraryMail.getAuthorization(340, licenses)) {
              alert(msg[Language] || msg["en"]);
              return false;
            }
          }

        }

      } catch (err) {
        recordObj = scriptContext.currentRecord;
        libraryMail.sendemail2(' [ CMClnt_SaveRecord ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }

      return true;

    }

    function CompleteWHTFields() {
      try {
        if (LMRY_countr[0] == 'MX' && libraryMail.getAuthorization(642, licenses)) {
          var invoID = recordObj.getValue('createdfrom');
          if (invoID != null && invoID != '') {
            var wtaxcode = 0;
            var uniquetaxcode = true;
            var totalRet = 0;
            var invObj = record.load({
              type: 'invoice',
              id: invoID
            });
            var JsonInvoice = [];
            var cantLinesInv = invObj.getLineCount('item');
            for (var j = 0; j < cantLinesInv; j++) {
              JsonInvoice.push({
                item: invObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'item',
                  line: j
                }),
                amount: invObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'amount',
                  line: j
                }),
                wtaxcode: invObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_4601_witaxcode',
                  line: j
                }),
                haswtax: invObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_4601_witaxapplies',
                  line: j
                }),
                taxline: invObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_4601_witaxline',
                  line: j
                })
              });
            }
            var appliesto = invObj.getValue('custbody_4601_appliesto');
            if (appliesto == 'T') {
              var cantLines = recordObj.getLineCount('item');
              for (var i = 0; i < cantLines; i++) {
                var itemLine = recordObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'item',
                  line: i
                });
                // Validacion 2022.05.09 - JsonInvoice
                if (JsonInvoice[i]) {
                  if (itemLine == JsonInvoice[i].item) {
                    if (JsonInvoice[i].haswtax == true || JsonInvoice[i].haswtax == 'T') {
                      wtaxcode = JsonInvoice[i].wtaxcode;
                    }
                  }
                } // Validacion 2022.05.09 - JsonInvoice
                var amount = recordObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'amount',
                  line: i
                });
                if (parseFloat(amount) < 0 && JsonInvoice[i].taxline) {
                  totalRet += Math.abs(amount);
                  recordObj.selectLine({
                    sublistId: 'item',
                    line: i
                  });
                  recordObj.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_lmry_ar_item_tributo',
                    value: true,
                    ignoreFieldChange: true
                  });
                  recordObj.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_lmry_apply_wht_tax',
                    value: false,
                    ignoreFieldChange: true
                  });
                  recordObj.commitLine({
                    sublistId: 'item'
                  });
                } else {
                  recordObj.selectLine({
                    sublistId: 'item',
                    line: i
                  });
                  recordObj.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_lmry_ar_item_tributo',
                    value: false,
                    ignoreFieldChange: true
                  });
                  recordObj.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_lmry_apply_wht_tax',
                    value: true,
                    ignoreFieldChange: true
                  });
                  recordObj.commitLine({
                    sublistId: 'item'
                  });
                }
              }
            } else if (appliesto == 'F') {
              var cantLines = recordObj.getLineCount('item');
              for (var i = 0; i < cantLines; i++) {
                var itemLine = recordObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'item',
                  line: i
                });
                if (itemLine == JsonInvoice[i].item) {
                  if (JsonInvoice[i].haswtax == true || JsonInvoice[i].haswtax == 'T') {
                    if (wtaxcode != JsonInvoice[i].wtaxcode && wtaxcode != 0) {
                      uniquetaxcode = false;
                    }
                    wtaxcode = JsonInvoice[i].wtaxcode;
                  }
                } else {
                  uniquetaxcode = false;
                }
                var amount = recordObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'amount',
                  line: i
                });
                if (parseFloat(amount) < 0) {
                  totalRet += Math.abs(amount);
                  recordObj.selectLine({
                    sublistId: 'item',
                    line: i
                  });
                  recordObj.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_lmry_ar_item_tributo',
                    value: true,
                    ignoreFieldChange: true
                  });
                  recordObj.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_lmry_apply_wht_tax',
                    value: false,
                    ignoreFieldChange: true
                  });
                  recordObj.commitLine({
                    sublistId: 'item'
                  });
                } else {
                  recordObj.selectLine({
                    sublistId: 'item',
                    line: i
                  });
                  recordObj.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_lmry_ar_item_tributo',
                    value: false,
                    ignoreFieldChange: true
                  });
                  recordObj.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_lmry_apply_wht_tax',
                    value: true,
                    ignoreFieldChange: true
                  });
                  recordObj.commitLine({
                    sublistId: 'item'
                  });
                }
              }
            }
            if (uniquetaxcode) {
              if (wtaxcode) {
                recordObj.setValue('custbody_lmry_wtax_code', wtaxcode);
                var wtaxObj = search.lookupFields({
                  type: 'customrecord_4601_witaxcode',
                  id: wtaxcode,
                  columns: ['custrecord_4601_wtc_description', 'custrecord_4601_wtc_rate']
                });
                recordObj.setValue('custbody_lmry_wtax_code_des', wtaxObj.custrecord_4601_wtc_description);
                recordObj.setValue('custbody_lmry_wtax_rate', parseFloat(wtaxObj.custrecord_4601_wtc_rate));
              }
            }
            if (totalRet) recordObj.setValue('custbody_lmry_wtax_amount', totalRet);
          } else {
            var totalRet = 0;
            var cantLines = recordObj.getLineCount('item');
            for (var i = 0; i < cantLines; i++) {
              var amount = recordObj.getSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                line: i
              });
              if (parseFloat(amount) < 0) {
                totalRet += Math.abs(amount);
                recordObj.selectLine({
                  sublistId: 'item',
                  line: i
                });
                recordObj.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_lmry_ar_item_tributo',
                  value: true,
                  ignoreFieldChange: true
                });
                recordObj.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_lmry_apply_wht_tax',
                  value: false,
                  ignoreFieldChange: true
                });
                recordObj.commitLine({
                  sublistId: 'item'
                });
              } else {
                recordObj.selectLine({
                  sublistId: 'item',
                  line: i
                });
                recordObj.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_lmry_ar_item_tributo',
                  value: false,
                  ignoreFieldChange: true
                });
                recordObj.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_lmry_apply_wht_tax',
                  value: true,
                  ignoreFieldChange: true
                });
                recordObj.commitLine({
                  sublistId: 'item'
                });
              }
            }
            if (totalRet) recordObj.setValue('custbody_lmry_wtax_amount', totalRet);
          }
        }
      } catch (err) {
        log.error('err CompleteWHTFields', err);
      }
      return true;
    }

    function ValidateLine(scriptContext) {
      recordObj = scriptContext.currentRecord;
      if (scriptContext.sublistId == 'item' || scriptContext.sublistId == 'expense') {
        try {
          if (Val_Campos_Linea.length > 0) {
            if (library_Val.Val_Line(recordObj, Val_Campos_Linea, scriptContext.sublistId) == false) {
              return false;
            } else {
              return true;
            }
          } else {
            return true;
          }
        } catch (err) {
          recordObj = scriptContext.currentRecord;
          libraryMail.sendemail2(' [ validateLine ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
        }
      } else {
        return true;
      }
    }

    /********************************************************
     * Valida si todos los items de la factura corresponden *
     * a una transferencia gratuita                         *
     *********************************************************/
    function ValidaItemsTTG() {
      try {
        var recQY = recordObj.getLineCount({
          sublistId: 'item'
        });
        for ( /*var pos = 1; pos <= recQY;*/ var pos = 0; pos < recQY; pos++) {
          var linttg = recordObj.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_lmry_col_es_ttg',
            line: pos
          });
          log.debug('ValidaItemsTTG - linttg', linttg);
          if (linttg != true) {
            return false;
          }
        }
      } catch (err) {
        libraryMail.sendemail2(' [ ValidaItemsTTG ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }
      return true;
    }

    function CMClnt_ValidateField(scriptContext) {

      try {

        ST_FEATURE = runtime.isFeatureInEffect({ feature: "tax_overhauling" });

        recordObj = scriptContext.currentRecord;
        var name = scriptContext.fieldId;
        var sublistName = scriptContext.sublistId;
        // Si es verdadero el formulario esta cargando
        if (LMRY_swinit == true) {
          return true;
        }

        /* Validacion 04/02/22 */
        if (name == 'postingperiod') {

          var period = recordObj.getValue('postingperiod');
          var subsidiary = recordObj.getValue('subsidiary') ? recordObj.getValue('subsidiary') : 1;
          // Se optiene el Pre - Fijo de la subsidiaria
          var urlStlt = url.resolveScript({
            scriptId: 'customscript_lmry_get_val_period_stlt',
            deploymentId: 'customdeploy_lmry_get_val_period_stlt',
            returnExternalUrl: false
          }) + '&period=' + period + '&subsidiary=' + subsidiary + '&country=' + LMRY_countr[0] + '&typetran=sales';

          //corregir hard code falta url
          var getStlt = https.get({
            url: 'https://' + window.location.hostname + urlStlt
          });

          // Retorna el cuero del SuiteLet
          var closedPeriod = getStlt.body;

          log.error('closedPeriod', closedPeriod);
          if (closedPeriod == 'T') {
            recordObj.setValue('custpage_lockedperiod', true);
          } else {
            recordObj.setValue('custpage_lockedperiod', false);
          }

          // Sale de la funcion
          return true;
        }
        /* Fin validacion 04/02/22 */

        // Seteo de CustomField WHT
        if (name == 'entity' && boo_PageIni == false) {
          // Cambio de campo
          LMRY_swinit = true;
          var lmry_entity = recordObj.getValue({
            fieldId: 'entity'
          });
          if (lmry_entity == null || lmry_entity == '') {
            return true;
          }

          if (featuresubs == true || featuresubs == 'T') {
            var subs = search.lookupFields({
              type: 'entity',
              id: lmry_entity,
              columns: ['subsidiary']
            });
            if (subs.subsidiary == null || subs.subsidiary == '' || subs.subsidiary == undefined) {
              return true;
            }
            subs = subs.subsidiary[0].value;
            //log.debug('subs - Entity', subs);
            var user = runtime.getCurrentUser();
            //log.debug('SetCustomField_WHT_Code_CM - countryUser', user.subsidiary);

            if (user.subsidiary == subs) {
              ValidateAccessCM(subs);
              // Carga los campos desde el cliente
              SetCustomField_WHT_Code_CM();

            } else {
              ValidateAccessCM(subs);
              // Carga los campos desde el cliente
              SetCustomField_WHT_Code_CM();
            }
          } else {
            ValidateAccessCM(1);
            // Carga los campos desde el cliente
            SetCustomField_WHT_Code_CM();
          }
          LMRY_swinit = false;

          return true;
        }

        // Muestra campos LMRY por Pais
        if (name == 'custbody_lmry_document_type' && LMRY_access == true && boo_PageIni == false) {

          if (LMRY_countr[0] == 'BR' && LbryBRDuplicate.isValidate(recordObj, licenses)) {
            var fieldPreim = recordObj.getField('custbody_lmry_num_preimpreso');
            fieldPreim.isDisabled = true;
            recordObj.setValue('tranid', Math.round(1e6 * Math.random()));
          } else {
            var fieldPreim = recordObj.getField('custbody_lmry_num_preimpreso');
            fieldPreim.isDisabled = false;
          }
          // Cambio de campo
          LMRY_swinit = true;

          // Tipo de Documento - Parent
          var lmry_DocTip = recordObj.getValue('custbody_lmry_document_type');
          //log.debug('lmry_DocTip1', lmry_DocTip);
          if (lmry_DocTip != '' && lmry_DocTip != null && lmry_DocTip != -1) {
            libraryMail.onFieldsDisplayParent(recordObj, LMRY_countr[1], lmry_DocTip, false);
            LMRY_parent = true;
            if (Val_Campos.length > 0) {
              library_Val.Val_Authorization(recordObj, LMRY_countr[0], licenses);
            }
          } else {
            if (LMRY_parent == true) {
              libraryMail.onFieldsDisplayParent(recordObj, LMRY_countr[1], '', false);
              LMRY_parent = false;
              if (Val_Campos.length > 0) {
                library_Val.Val_Authorization(recordObj, LMRY_countr[0], licenses);
              }
            }
          }

          var isSeriesCLActive = libraryMail.getAuthorization(414, licenses);

          if (LMRY_countr[0] == 'CL' && !isSeriesCLActive) {
            if (libraryMail.getAuthorization(113, licenses) == true) {
              correlativoChile(1);
            }
          }

          // Cambio de campo
          LMRY_swinit = false;

          // Sale de la funcion
          return true;
        }

        // Serie de impresion
        if (name == 'custbody_lmry_serie_doc_cxc' && boo_PageIni == false) {
          // Cambio de campo
          LMRY_swinit = true;
          if (LMRY_countr[0] != 'BR' || !LbryBRDuplicate.isValidate(recordObj, licenses)) {
            CMGetNumberSequence();
          }

          // Cambio de campo
          LMRY_swinit = false;
          // Sale de la funcion
          return true;
        }

        // Tipo de Documento, Serie de impresion y Numero Preimpreso
        if ((name == 'custbody_lmry_document_type' || name == 'custbody_lmry_serie_doc_cxc' || name == 'custbody_lmry_num_preimpreso') && LMRY_swpnro == false) {
          // Cambio de campo
          LMRY_swinit = true;

          // Llama a la funcion de seteo del Tranid
          CMSet_Field_tranid();
          // Cambio de campo
          LMRY_swinit = false;

          // Sale de la funcion
          return true;
        }

        if (name == 'currency') {
          var subsi = recordObj.getValue({
            fieldId: 'subsidiary'
          });
          var al_country = recordObj.getValue({
            fieldId: 'custbody_lmry_subsidiary_country'
          });
          if (subsi != null && subsi != '') {
            if (LMRY_countr[0] == 'AR') {
              if ((type == 'create' || type == 'copy') && libraryMail.getAuthorization(404, licenses)) {
                library_ExchRate.autosetExchRate(recordObj, al_country, 'sale');
              }
            }
            if (LMRY_countr[0] == 'BR') {
              if ((type == 'create' || type == 'copy') && libraryMail.getAuthorization(321, licenses)) {
                library_ExchRate.autosetExchRate(recordObj, al_country, 'sale');
              }
            }
            if (LMRY_countr[0] == 'CO') {
              if ((type == 'create' || type == 'copy') && libraryMail.getAuthorization(409, licenses)) {
                library_ExchRate.autosetExchRate(recordObj, al_country, 'sale');
              }
            }
            if (LMRY_countr[0] == 'CL') {
              if ((type == 'create' || type == 'copy') && libraryMail.getAuthorization(322, licenses)) {
                library_ExchRate.autosetExchRate(recordObj, al_country, 'sale');
              }
            }
            if (LMRY_countr[0] == 'MX') {
              if ((type == 'create' || type == 'copy') && libraryMail.getAuthorization(289, licenses)) {
                library_ExchRate.autosetExchRate(recordObj, al_country, 'sale');
              }
            }
            if (LMRY_countr[0] == 'PE') {
              if ((type == 'create' || type == 'copy') && libraryMail.getAuthorization(403, licenses)) {
                library_ExchRate.autosetExchRate(recordObj, al_country, 'sale');
              }
            }
          }

        }


        //CL CHANGE CURRENCY UF
        if (LMRY_countr[0] == 'CL' && libraryMail.getAuthorization(604, licenses) && Object.keys(jsonCurrencies).length && boo_PageIni == false) {

          var currencyTransaction = recordObj.getValue('currency');
          var tranDate = recordObj.getValue('trandate');

          //SOLO SI EL CAMPO EXISTE
          if (fieldRateUF && recordObj.getField(fieldRateUF)) {

            //SOLO PARA PESO CHILENO
            if (jsonCurrencies[currencyTransaction]['symbol'] == 'CLP') {

              //SETEO DE COLUMNA
              if (sublistName == 'item' && name == 'custcol_lmry_prec_unit_so') {

                var exchangeRateUF = recordObj.getValue(fieldRateUF);
                var amountUF = recordObj.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_prec_unit_so' });

                if (parseFloat(exchangeRateUF) > 0 && parseFloat(amountUF) > 0) {
                  var rate = parseFloat(exchangeRateUF) * parseFloat(amountUF);
                  rate = parseFloat(rate).toFixed(0);

                  recordObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: rate });

                }

              }

              //SETEO DEL TIPO DE CAMBIO AL CAMBIAR FECHA Y/O MONEDA
              if ((name == 'currency' || name == 'trandate') && tranDate) {

                var rateUF = currency.exchangeRate({ source: 'CLF', target: 'CLP', date: tranDate });

                recordObj.setValue({ fieldId: fieldRateUF, value: parseFloat(rateUF), ignoreFieldChange: true });

              }

            } else {
              //CUANDO NO ES MONEDA PESO CHILENO
              recordObj.setValue({ fieldId: fieldRateUF, value: 0, ignoreFieldChange: true });

            }

          } //SOLO SI EL CAMPO EXISTE

        } //FIN CL CHANGE CURRENCY UF


      } catch (err) {
        recordObj = scriptContext.currentRecord;
        libraryMail.sendemail2(' [ CMClnt_ValidateField ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }

      return true;
    }

    /* ------------------------------------------------------------------------------------------------------
     * Deben tener acceso a LatamReady para las siguientes
     * Transaccion Invoice solo para los paises:
     *    Peru, El Salvador, Paraguay, Ecuador y Argentina
     * --------------------------------------------------------------------------------------------------- */
    function CMGetNumberSequence() {
      try {
        /* ******************************************************************************
         * Verifica que este activo el feature Numerar Transaction Number Invoice:
         * AR - Argentina , BO - Bolivia , CL - Chile , CO - Colombia , CR - Costa Rica ,
         * EC - Ecuador , GT - Guatemala , MX - Mexico, PA - Panama , PY - Paraguay,
         * PE - Peru , SV - El Salvador , UY - Uruguay
         ****************************************************************************** */
        // Nuevo pais Brasil
        // Solo para subsidiaria con acceso - Transaction Number Credit Memo
        var featuresByCountry = {
          'AR': 115,
          'BO': 417,
          'BR': 668,
          'CL': 414, // Feature CL - Print Series
          'CO': 419,
          'CR': 421,
          'DO': 525,
          'EC': 104,
          'GT': 423,
          'MX': 425,
          'PA': 427,
          'PY': 110,
          'PE': 67,
          'SV': 107,
          'UY': 429
        };
        var featureId = featuresByCountry[LMRY_countr[0]];

        if (featureId && LMRY_access) {

          var lmry_DocSer = recordObj.getValue({
            fieldId: 'custbody_lmry_serie_doc_cxc'
          });
          var lmry_DocNum = recordObj.getValue({
            fieldId: 'custbody_lmry_num_preimpreso'
          });

          if ((lmry_DocSer && lmry_DocSer != -1) && (!lmry_DocNum)) {

            if (libraryMail.getAuthorization(featureId, licenses) == false) {
              return true;
            }

            var rdSerie = search.lookupFields({
              type: 'customrecord_lmry_serie_impresion_cxc',
              id: lmry_DocSer,
              columns: ['custrecord_lmry_serie_numero_impres', 'custrecord_lmry_serie_rango_fin', 'custrecord_lmry_serie_num_digitos', 'custrecord_ei_preprinted_series']
            });

            var nroConse = parseInt(rdSerie.custrecord_lmry_serie_numero_impres) + 1;
            var maxPermi = parseInt(rdSerie.custrecord_lmry_serie_rango_fin);
            var digitos = parseInt(rdSerie.custrecord_lmry_serie_num_digitos);
            var isEISeries = rdSerie.custrecord_ei_preprinted_series;


            //Para Brazil, si la serie es de facturacion no se genera Numero Pre impreso
            if (LMRY_countr[0] == 'BR' && (isEISeries == true || isEISeries == 'T')) {
              return true;
            }

            // Valida el numero de digitos
            if (digitos == '' || digitos == null) {
              digitos = 0;
            }

            // SW para que no ingrese en un bucle
            LMRY_swpnro = true;
            if (nroConse > maxPermi) {
              alert(library_translator.getAlert(10, Language, [maxPermi]));
              //alert('El ultimo numero para esta serie (' + maxPermi + ') ha sido utilizado. Verificar si existen numeros disponibles en esta serie');

              // Asigna el numero pre-impeso
              recordObj.setValue({
                fieldId: 'custbody_lmry_num_preimpreso',
                value: ''
              });
            } else {
              var longNumeroConsec = parseInt((nroConse + '').length);
              var llenarCeros = '';
              for (var i = 0; i < (digitos - longNumeroConsec); i++) {
                llenarCeros += '0';
              }
              nroConse = llenarCeros + nroConse;

              //Asigna el numero pre-impreso
              recordObj.setValue({
                fieldId: 'custbody_lmry_num_preimpreso',
                value: nroConse
              });

              // Llama a la funcion de seteo del Tranid
              CMSet_Field_tranid();
            }

            LMRY_swpnro = false;
          }
        }

      } catch (err) {
        libraryMail.sendemail2(' [ CMGetNumberSequence ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }


    }

    /* ------------------------------------------------------------------------------------------------------
     * Coloca el numero correlativo de Chile
     * --------------------------------------------------------------------------------------------------- */
    function correlativoChile(opcion) {
      try {

        // Numero Correlativo para Chile
        var internalid = 0;
        var nroCorrela = 0;

        var documentType = recordObj.getValue('custbody_lmry_document_type');
        if (!documentType) {
          return true;
        }

        //  Filtros del Query
        var filtros = [];
        filtros[0] = search.createFilter({
          name: 'custrecord_lmry_cl_np_document_type',
          operator: 'anyof',
          values: documentType
        });
        if (featuresubs == true || featuresubs == 'T') {
          var subsidiary = recordObj.getValue("subsidiary");
          filtros[1] = search.createFilter({
            name: 'custrecord_lmry_cl_np_subsidiary',
            operator: 'anyof',
            values: [subsidiary]
          });
        }

        // Realiza una busqueda en las transacciones Invoice
        var search_transacdata = search.create({
          type: 'customrecord_lmry_cl_number_preprinted',
          columns: ['internalid', 'custrecord_lmry_cl_np_current_value'],
          filters: filtros
        });
        var searchResult_transacdata = search_transacdata.run().getRange({
          start: 0,
          end: 1000
        });
        //log.debug("Cantidad de transacdata", searchResult_transacdata.length);

        if (searchResult_transacdata != null && searchResult_transacdata != '') {
          if (searchResult_transacdata.length > 0) {
            internalid = searchResult_transacdata[0].getValue({
              name: 'internalid'
            });
            nroCorrela = searchResult_transacdata[0].getValue({
              name: 'custrecord_lmry_cl_np_current_value'
            });

            if (opcion == 1) {
              //nroCorrela = (parseFloat(nroCorrela)) + 1;
              nroCorrela = (parseFloat(nroCorrela)) + 1;

            }
            if (opcion == 2) {
              var AuxiNumero = recordObj.getValue({
                fieldId: 'custbody_lmry_num_preimpreso'
              });
              if (parseFloat(nroCorrela) < parseFloat(AuxiNumero)) {
                var id = record.submitFields({
                  type: 'customrecord_lmry_cl_number_preprinted',
                  id: internalid,
                  values: {
                    'custrecord_lmry_cl_np_current_value': parseFloat(AuxiNumero)
                  }
                });
              }
            }
          }
        }
        if (opcion == 1) {

          if (nroCorrela == 0) {
            alert(library_translator.getAlert(11, Language, []));
          }

          // Setea el numero correlativo
          recordObj.setValue({
            fieldId: 'custbody_lmry_num_preimpreso',
            value: nroCorrela
          });

          CMSet_Field_tranid();
        }
      } catch (err) {
        libraryMail.sendemail2(' [ correlativoChile ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }
      return true;
    }

    /* ------------------------------------------------------------------------------------------------------
     * Funcion Set_Field_tranid que setea el campo standart Tranid
     * Tipo de Documento, Serie de impresion y Numero Preimpreso
     * --------------------------------------------------------------------------------------------------- */
    function CMSet_Field_tranid() {
      try {
        // Subsidiaria
        var subsidiary = recordObj.getValue({
          fieldId: 'subsidiary'
        });
        var lmry_DocTip = recordObj.getValue({
          fieldId: 'custbody_lmry_document_type'
        });
        var lmry_DocSer = recordObj.getValue({
          fieldId: 'custbody_lmry_serie_doc_cxc'
        });
        var lmry_DocNum = recordObj.getValue({
          fieldId: 'custbody_lmry_num_preimpreso'
        });
        var tranprefix = '';
        var texto = '';

        //Feature CL - Print Series
        var isSeriesCLActive = libraryMail.getAuthorization(414, licenses);
        var hasSeries = LMRY_countr[0] != 'CL' || (LMRY_countr[0] == 'CL' && isSeriesCLActive);

        if (subsidiary && lmry_DocTip && lmry_DocTip != -1 && lmry_DocNum &&
          ((hasSeries && lmry_DocSer && lmry_DocSer != -1) || LMRY_countr[0] == 'CL')) {
          /* *********************************************
           * Verifica que este activo el feature Set TranID
           * para popular el campos standar de NetSuite
           **********************************************/
          var featuresByCountry = {
            'AR': 5,
            'BO': 49,
            'BR': 10,
            'CL': 11,
            'CO': 65,
            'CR': 3,
            'DO': 522,
            'EC': 58,
            'SV': 19,
            'GT': 23,
            'MX': 25,
            'PA': 59,
            'PY': 40,
            'PE': 9,
            'UY': 131
          };

          var featureId = featuresByCountry[LMRY_countr[0]];

          if (featureId && LMRY_access) {

            /* *********************************************
             * Verifica que este activo el feature SET TRANID
             **********************************************/
            if (libraryMail.getAuthorization(featureId, licenses) == false) {
              return true;
            }
            // Pre - Fijo de la subsidiaria
            var urlpais = runtime.getCurrentScript().getParameter('custscript_lmry_netsuite_location');

            var url_2 = url.resolveScript({
              scriptId: 'customscript_lmry_get_country_stlt',
              deploymentId: 'customdeploy_lmry_get_country_stlt',
              returnExternalUrl: false
            }) + '&sub=' + subsidiary + '&opt=CDM&cty=' + LMRY_countr[0];

            //log.debug('url_2', url_2);
            var get = https.get({
              url: 'https://' + urlpais + url_2
            });

            var tranprefix = get.body;
            // Iniciales del tipo de documento
            var tipini = search.lookupFields({
              type: 'customrecord_lmry_tipo_doc',
              id: lmry_DocTip,
              columns: ['custrecord_lmry_doc_initials']
            });
            tipini = tipini.custrecord_lmry_doc_initials;
            if (tipini == '' || tipini == null) {
              tipini = '';
            }

            var texto = recordObj.getValue('custbody_lmry_num_preimpreso');
            if (hasSeries) {
              texto = recordObj.getText('custbody_lmry_serie_doc_cxc') + '-' + recordObj.getValue('custbody_lmry_num_preimpreso');
            }

            texto = tipini.toUpperCase() + ' ' + texto;

            if (tranprefix) {
              texto = tranprefix + ' ' + texto;
            }

            recordObj.setValue({
              fieldId: 'tranid',
              value: texto
            });
            //log.debug('trainid', recordObj.getValue({
            //fieldId: 'tranid'
            //}));
          }
        }
      } catch (err) {
        libraryMail.sendemail2(' [ CMSet_Field_tranid ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
        return false;
      }

      return true;
    }

    /* ------------------------------------------------------------------------------------------------------
     * Funcion Inicializa campos WHT de sumatoria - Logica Antigua de WHT
     * --------------------------------------------------------------------------------------------------- */
    function SetCustomField_WHT_Init_CM() {
      try {
        // Solo para subsidiria de Bolivia, Colombia y Paraguay
        if (LMRY_countr[0] != 'BO' && LMRY_countr[0] != 'CO' && LMRY_countr[0] != 'PY') {
          return true;
        }

        /* ******************************************
         * 2020.06.01 : Se cambio de funcion de
         * Validate_EIDocument por Verification_Duplicate_Clnt
         * if (!Library_Duplicate_Clnt.Validate_EIDocument(recordObj)) {
         * ***************************************** */
        // Latam Colombia
        var checkDuplicateLicense = libraryMail.getAuthorization(666, licenses) && type == "edit";
        var checkDuplicate = (Library_Duplicate_Clnt.Verification_Duplicate_Clnt(old_record, recordObj) || Library_Duplicate_Clnt.Verification_Duplicate_Lines_Clnt(recordObj, old_record_lines));
        if (!(!checkDuplicate && checkDuplicateLicense)) {
          recordObj.setValue({
            fieldId: 'custbody_lmry_co_reteica_amount',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_co_reteiva_amount',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_co_retefte_amount',
            value: 0
          });
          recordObj.setValue({
            fieldId: 'custbody_lmry_co_retecree_amount',
            value: 0
          });
        }

        // Latam Bolivia
        recordObj.setValue({
          fieldId: 'custbody_lmry_bo_autoreteit_whtamount',
          value: 0
        });
        recordObj.setValue({
          fieldId: 'custbody_lmry_bo_reteiue_whtamount',
          value: 0
        });
      } catch (err) {
        libraryMail.sendemail2(' [ SetCustomField_WHT_Init_CM ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }
      return true;
    }

    /* ------------------------------------------------------------------------------------------------------
     * Funcion setea los campos de cabecera - Logica Antigua de WHT
     * --------------------------------------------------------------------------------------------------- */
    function SetCustomField_WHT_Code_CM() {

      try {
        if (LMRY_access == false) {
          return true;
        }

        // Solo para subsidiria de Bolivia, Colombia y Paraguay
        if (LMRY_countr[0] != 'BO' && LMRY_countr[0] != 'CO' && LMRY_countr[0] != 'PY') {
          return true;
        }
        var lmry_entity = recordObj.getValue({
          fieldId: 'entity'
        });

        switch (LMRY_countr[0]) {
          // Latam Colombia - Logica Antigua
          case 'CO':
            if (libraryMail.getAuthorization(27, licenses) == true) {
              recordObj.setValue({
                fieldId: 'custbody_lmry_co_reteica',
                value: ''
              });
              recordObj.setValue({
                fieldId: 'custbody_lmry_co_reteica_amount',
                value: 0.00
              });
              recordObj.setValue({
                fieldId: 'custbody_lmry_co_reteiva',
                value: ''
              });
              recordObj.setValue({
                fieldId: 'custbody_lmry_co_reteiva_amount',
                value: 0.00
              });
              recordObj.setValue({
                fieldId: 'custbody_lmry_co_retefte',
                value: ''
              });
              recordObj.setValue({
                fieldId: 'custbody_lmry_co_retefte_amount',
                value: 0.00
              });
              recordObj.setValue({
                fieldId: 'custbody_lmry_co_autoretecree',
                value: ''
              });
              recordObj.setValue({
                fieldId: 'custbody_lmry_co_retecree_amount',
                value: 0.00
              });
              if (lmry_entity != '' && lmry_entity != null) {
                // Seteo de campos
                var rec_entity = search.lookupFields({
                  type: 'entity',
                  id: lmry_entity,
                  columns: ['custentity_lmry_co_reteica', 'custentity_lmry_co_reteiva', 'custentity_lmry_co_retefte', 'custentity_lmry_co_retecree']
                });

                if (rec_entity.custentity_lmry_co_reteica != '' && rec_entity.custentity_lmry_co_reteica != null) {
                  recordObj.setValue({
                    fieldId: 'custbody_lmry_co_reteica',
                    value: rec_entity.custentity_lmry_co_reteica[0].value
                  });
                }
                if (rec_entity.custentity_lmry_co_reteiva != '' && rec_entity.custentity_lmry_co_reteiva != null) {
                  recordObj.setValue({
                    fieldId: 'custbody_lmry_co_reteiva',
                    value: rec_entity.custentity_lmry_co_reteiva[0].value
                  });
                }
                if (rec_entity.custentity_lmry_co_retefte != '' && rec_entity.custentity_lmry_co_retefte != null) {
                  recordObj.setValue({
                    fieldId: 'custbody_lmry_co_retefte',
                    value: rec_entity.custentity_lmry_co_retefte[0].value
                  });
                }
                if (rec_entity.custentity_lmry_co_retecree != '' && rec_entity.custentity_lmry_co_retecree != null) {
                  recordObj.setValue({
                    fieldId: 'custbody_lmry_co_autoretecree',
                    value: rec_entity.custentity_lmry_co_retecree[0].value
                  });
                }
              }
            }
            break;
          case 'BO':
            if (libraryMail.getAuthorization(46, licenses) == true) {
              // Latam Bolivia - Logica Antigua
              recordObj.setValue({
                fieldId: 'custbody_lmry_bo_autoreteit',
                value: ''
              });
              recordObj.setValue({
                fieldId: 'custbody_lmry_bo_autoreteit_whtamount',
                value: 0.00
              });
              recordObj.setValue({
                fieldId: 'custbody_lmry_bo_reteiue',
                value: ''
              });
              recordObj.setValue({
                fieldId: 'custbody_lmry_bo_reteiue_whtamount',
                value: 0.00
              });
              if (lmry_entity != '' && lmry_entity != null) {
                // Seteo de campos
                var rec_entity = search.lookupFields({
                  type: 'entity',
                  id: lmry_entity,
                  columns: ['custentity_lmry_bo_autoreteit', 'custentity_lmry_bo_reteiue']
                });

                if (rec_entity.custentity_lmry_bo_autoreteit != '' && rec_entity.custentity_lmry_bo_autoreteit != null) {
                  recordObj.setValue({
                    fieldId: 'custbody_lmry_bo_autoreteit',
                    value: rec_entity.custentity_lmry_bo_autoreteit[0].value
                  });
                }
                if (rec_entity.custentity_lmry_bo_reteiue != '' && rec_entity.custentity_lmry_bo_reteiue != null) {
                  recordObj.setValue({
                    fieldId: 'custbody_lmry_bo_reteiue',
                    value: rec_entity.custentity_lmry_bo_reteiue[0].value
                  });
                }
              }
            }
            break;
          case 'PY':
            // Latam Paraguay - Logica Antigua
            if (libraryMail.getAuthorization(47, licenses) == true) {
              recordObj.setValue({
                fieldId: 'custbody_lmry_py_autoreteir',
                value: ''
              });
              recordObj.setValue({
                fieldId: 'custbody_lmry_py_autoreteir_amount',
                value: 0.00
              });
              recordObj.setValue({
                fieldId: 'custbody_lmry_py_reteiva',
                value: ''
              });
              recordObj.setValue({
                fieldId: 'custbody_lmry_py_reteiva_amount',
                value: 0.00
              });
              if (lmry_entity != '' && lmry_entity != null) {
                // Seteo de campos
                var rec_entity = search.lookupFields({
                  type: 'entity',
                  id: lmry_entity,
                  columns: ['custentity_lmry_py_autoreteir', 'custentity_lmry_py_reteiva']
                });
                if (rec_entity.custentity_lmry_py_autoreteir != '' && rec_entity.custentity_lmry_py_autoreteir != null) {
                  recordObj.setValue({
                    fieldId: 'custbody_lmry_py_autoreteir',
                    value: rec_entity.custentity_lmry_py_autoreteir[0].value
                  });
                }
                if (rec_entity.custentity_lmry_py_reteiva != '' && rec_entity.custentity_lmry_py_reteiva != null) {
                  recordObj.setValue({
                    fieldId: 'custbody_lmry_py_reteiva',
                    value: rec_entity.custentity_lmry_py_reteiva[0].value
                  });
                }
              }
            }
            break;
        }
      } catch (err) {
        libraryMail.sendemail2(' [ SetCustomField_WHT_Code_CM ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }

      return true;
    }

    /* ------------------------------------------------------------------------------------------------------
     * Funcion que actualiza los campos de cabecera Totales Venta
     * --------------------------------------------------------------------------------------------------- */
    function UpdateTotalSales() {
      //log.debug('UpdateTotalSales recordObj',recordObj);
      //log.debug('LMRY_countr[0]',LMRY_countr[0]);
      try {
        // Solo si tiene acceso al enabled feature
        if (LMRY_access == false) {
          return true;
        }

        // Solo para subsidiria de Bolivia y Paraguay
        if (LMRY_countr[0] == 'BO' || LMRY_countr[0] == 'PY') {
          // Fecha en Letras Parametros: Fecha
          var deteletras = libraryNumber.stringdate(recordObj.getValue({
            fieldId: 'trandate'
          }));
          //log.debug('dataletras', dataletras);
          recordObj.setValue({
            fieldId: 'custbody_lmry_date_letter',
            value: deteletras
          });
        }

        // Solo para Sub sidiaria Paraguay
        if (LMRY_countr[0] == 'PY') {
          PY_Sum_Items();
        }

        // Subsidiaria de El Salvador
        if (LMRY_countr[0] == 'SV') {
          SV_Sum_Items();
        }

      } catch (err) {
        libraryMail.sendemail2(' [ UpdateTotalSales ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }
    }

    /* ------------------------------------------------------------------------------------------------------
     * Realiza la suma de lineas segun el impuesto - Paraguay
     * --------------------------------------------------------------------------------------------------- */
    function PY_Sum_Items() {

      try {

        // Latam Total Tax Amount S-PY
        var totaltax_spy = 0;
        // Latam Total Tax Amount R-PY
        var totaltax_rpy = 0;
        // Latam SubTotal Gross Amount S-PY
        var subtotal_spy = 0;
        // Latam SubTotal Gross Amount R-PY
        var subtotal_rpy = 0;
        // Latam SubTotal Gross Amount E-PY
        var subtotal_epy = 0;

        // Se suma los mismos codigos de impuesto
        var recQY = recordObj.getLineCount({
          sublistId: 'item'
        });
        for (var i = 0; i < recQY; i++) {
          var lintax = recordObj.getSublistText({
            sublistId: 'item',
            fieldId: 'taxcode',
            line: i
          }); //taxcode
          var linamo = recordObj.getSublistValue({
            sublistId: 'item',
            fieldId: 'grossamt',
            line: i
          }); //grossamount
          var linrte = recordObj.getSublistValue({
            sublistId: 'item',
            fieldId: 'tax1amt',
            line: i
          }); //taxamount

          switch (lintax) {
            case 'VAT_PY:S-PY':
              totaltax_spy = parseFloat(totaltax_spy) + parseFloat(linrte);
              subtotal_spy = parseFloat(subtotal_spy) + parseFloat(linamo);
              break;
            case 'VAT_PY:R-PY':
              totaltax_rpy = parseFloat(totaltax_rpy) + parseFloat(linrte);
              subtotal_rpy = parseFloat(subtotal_rpy) + parseFloat(linamo);
              break;
            case 'VAT_PY:E-PY':
              subtotal_epy = parseFloat(subtotal_epy) + parseFloat(linamo);
              break;
          }
        }

        // Asigna los valores a los campos
        recordObj.setValue({
          fieldId: 'custbody_lmry_total_taxamount_spy',
          value: totaltax_spy
        });
        recordObj.setValue({
          fieldId: 'custbody_lmry_total_taxamount_rpy',
          value: totaltax_rpy
        });
        recordObj.setValue({
          fieldId: 'custbody_lmry_subtotal_amount_spy',
          value: subtotal_spy
        });
        recordObj.setValue({
          fieldId: 'custbody_lmry_subtotal_amount_rpy',
          value: subtotal_rpy
        });
        recordObj.setValue({
          fieldId: 'custbody_lmry_subtotal_amount_epy',
          value: subtotal_epy
        });

      } catch (err) {
        libraryMail.sendemail2(' [ PY_Sum_Items ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }
    }

    /* ------------------------------------------------------------------------------------------------------
     * Realiza la suma de lineas segun el impuesto - El Salvador
     * --------------------------------------------------------------------------------------------------- */
    function SV_Sum_Items() {
      try {

        var scriptObj = runtime.getCurrentScript();
        // Item Tax Code
        var tv_tc = scriptObj.getParameter({
          name: 'custscript_lmry_item_discount_sv'
        });
        // LMRY Total Ventas No Sujetas
        var tv_ns = 0;
        // LMRY Total Ventas Exentas
        var tv_ex = 0;
        // LMRY Total Ventas Afectas
        var tv_af = 0;
        // LMRY Retenciones
        var tv_wt = 0;

        // Se suma los mismos codigos de impuesto
        var recQY = recordObj.getLineCount({
          sublistId: 'item'
        });

        for (var i = 0; i < recQY; i++) {
          var linite = recordObj.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: i
          });
          var lintax = recordObj.getSublistText({
            sublistId: 'item',
            fieldId: 'taxcode',
            line: i
          });
          var linamo = recordObj.getSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            line: i
          });
          var linqty = recordObj.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: i
          });

          switch (lintax) {
            case 'VAT_SV:NS-SV':
              tv_ns = parseFloat(tv_ns) + parseFloat(linamo);
              break;
            case 'VAT_SV:E-SV':
              if (linqty != 0) {
                tv_ex = parseFloat(tv_ex) + parseFloat(linamo);
                break;
              }
            case 'VAT_SV:UNDEF-SV':
              // Solo para Retenciones
              if (linite == tv_tc) {
                tv_wt = parseFloat(tv_wt) + parseFloat(linamo);
              } else {
                if (linqty != 0) {
                  tv_ex = parseFloat(tv_ex) + parseFloat(linamo);
                }
              }
              break;
            case 'VAT_SV:S-SV':
              tv_af = parseFloat(tv_af) + parseFloat(linamo);
              break;
            case 'VAT_SV:X-SV':
              tv_af = parseFloat(tv_af) + parseFloat(linamo);
              break;
          }
        }

        // Para las retenciones
        var wtax_wamt = 0;
        var wtax_wcod = recordObj.getText({
          fieldId: 'custpage_4601_witaxcode'
        });
        if (wtax_wcod != null && wtax_wcod != '') {
          if (wtax_wcod.substring(wtax_wcod.length - 3) == '_GC') {
            wtax_wamt = recordObj.getValue({
              fieldId: 'custpage_4601_witaxamount'
            });
          }
        }
        // Solo para Retenciones
        recordObj.setValue({
          fieldId: 'custbody_lmry_wtax_wamt',
          value: Math.abs(tv_wt)
        });

        // Asigna los valores a los campos
        recordObj.setValue({
          fieldId: 'custbody_lmry_sv_not_taxable_total_sal',
          value: tv_ns
        });
        recordObj.setValue({
          fieldId: 'custbody_lmry_sv_exempt_total_sales',
          value: tv_ex
        });
        recordObj.setValue({
          fieldId: 'custbody_lmry_sv_taxable_total_sales',
          value: tv_af
        });

        // // Se obtiene el id de la moneda
        // var currency = recordObj.getValue({
        //   fieldId: 'currency'
        // });
        // // Se realiza la busqueda de los campos symbol y name por el id de la moneda
        // var monedaTexto = search.lookupFields({
        //   type: search.Type.CURRENCY,
        //   id: currency,
        //   columns: ['name', 'symbol']
        // });
        //
        // // Restamos el custbody_lmry_wtax_wamt al monto Total por que NS despues de grabar el documento recien le
        // // Aplica la retencion.
        // var imptotal = 0.00;
        // imptotal = parseFloat(recordObj.getValue({
        //   fieldId: 'total'
        // }));
        //
        // // Monto en Letras Parametros: Importe, Moneda, Simbolo y concadenador
        // var impletras = ConvNumeroLetraESP(imptotal, monedaTexto.name, monedaTexto.symbol, 'CON');
        // recordObj.setValue({
        //   fieldId: 'custbody_lmry_pa_monto_letras',
        //   value: impletras
        // });

      } catch (err) {
        libraryMail.sendemail2(' [ SV_Sum_Items ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }

    }
    /* ------------------------------------------------------------------------------------------------------
     * Al momento de cambiar el campo entity se va hacer una recarga a la paguina pasando de datos
     * subsidiary, customform y entity.
     * --------------------------------------------------------------------------------------------------- */
    function fieldChanged(scriptContext) {

      ST_FEATURE = runtime.isFeatureInEffect({
        feature: "tax_overhauling"
      });

      recordObj = scriptContext.currentRecord;
      var name = scriptContext.fieldId;
      var sublistName = scriptContext.sublistId;

      if (name == 'currency') {

        var lmry_exchange_rate_field = recordObj.getField('custpage_lmry_exchange_rate');
        if (lmry_exchange_rate_field != null && lmry_exchange_rate_field != '') {
          Library_ExchangeRate.ws_exchange_rate(recordObj, licenses);
        }
        return true;
      }

      if (name == 'custpage_lmry_exchange_rate') {

        var lmry_exchange_rate = recordObj.getValue('custpage_lmry_exchange_rate');
        if (lmry_exchange_rate != ' ' && lmry_exchange_rate != '' && lmry_exchange_rate != null) {
          recordObj.setValue('exchangerate', lmry_exchange_rate);
        }
        return true;
      }

      if (name == 'trandate') {
        if (recordObj.getValue('entity') != '' && recordObj.getValue('entity') != null) {
          Library_ExchangeRate.ws_exchange_rate(recordObj, licenses);
        }
        return true;
      }

      if (featuresubs == true || featuresubs == 'T') {
        /* ************************************************ *
            * 2024.05.10 Se activo la validacion por entidad
            * Solo para el caso que  la subsidiaria no sea
            * una lista desplegable por el feature 
            * multisubsidiarycustomer
            * ************************************************ */
        if (FEAT_MULTISUBCUSTOMER == 'T' || FEAT_MULTISUBCUSTOMER == true) {
          if (name == 'subsidiary' && type == 'create') {
              flagReloadSubsidiary = true;
              var cf = recordObj.getValue('customform');
              var ent = recordObj.getValue('entity');
              var sub = recordObj.getValue('subsidiary');

              if (ent != '' && ent != null && ent != -1 && cf != '' && cf != null && cf != -1 && sub != '' && sub != null && sub != -1) {

                  setWindowChanged(window, false);
                  window.location.href = window.location.href.split('?')[0] + '?whence=&cf=' + cf + '&entity=' + ent + '&subsidiary=' + sub;
              }
              return true;
          }
          if (!flagReloadSubsidiary && name == 'custbody_lmry_subsidiary_country' && type == 'create') {
            var cf = recordObj.getValue('customform');
            var ent = recordObj.getValue('entity');
            var sub = recordObj.getValue('subsidiary');
            if (ent != '' && ent != null && ent != -1 && cf != '' && cf != null && cf != -1 && sub != '' && sub != null && sub != -1) {
                setWindowChanged(window, false);
                window.location.href = window.location.href.split('?')[0] + '?whence=&cf=' + cf + '&entity=' + ent + '&subsidiary=' + sub;
            }
            return true;
          }
        } else {
          if (name == 'entity' && type == 'create') {
              var cf = recordObj.getValue('customform');
              var ent = recordObj.getValue('entity');
              var sub = recordObj.getValue('subsidiary');

              if (ent != '' && ent != null && ent != -1 && cf != '' && cf != null && cf != -1 && sub != '' && sub != null && sub != -1) {

                  setWindowChanged(window, false);
                  window.location.href = window.location.href.split('?')[0] + '?whence=&cf=' + cf + '&entity=' + ent + '&subsidiary=' + sub;
              }
              return true;
          } // 2024.05.15 : Fin del cambio realizado
        }
      }

      //SETEO DE CFOP AUTOMATICO CUANDO ESTA LLENO EN EL ITEM
      if (LMRY_countr[0] == 'BR' && LMRY_access == true) {
        var flagCFOP = true;
        if (sublistName == 'item' && name == 'item') {
          var idItem = recordObj.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item'
          });
          if (idItem) {
            var typeTransaction = recordObj.getValue('type');
            var itemCFOP = search.lookupFields({
              type: 'item',
              id: idItem,
              columns: ['custitem_lmry_br_cfop_inc', 'custitem_lmry_br_cfop_display_inc', 'custitem_lmry_br_cfop_out', 'custitem_lmry_br_cfop_display_out']
            });

            var currentCFOPDisplay = recordObj.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_br_tran_outgoing_cfop_di' });
            var currentCFOP = recordObj.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lmry_br_tran_outgoing_cfop' });

            if (!currentCFOPDisplay && itemCFOP.custitem_lmry_br_cfop_display_out != null && itemCFOP.custitem_lmry_br_cfop_display_out != '') {
              recordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_lmry_br_tran_outgoing_cfop_di',
                value: itemCFOP.custitem_lmry_br_cfop_display_out,
                ignoreFieldChange: true
              });
            }
            if (!currentCFOP && itemCFOP['custitem_lmry_br_cfop_out'] && itemCFOP['custitem_lmry_br_cfop_out'].length > 0) {
              flagCFOP = false;

              var nameCFOP = search.lookupFields({
                type: 'customrecord_lmry_br_cfop_codes',
                id: itemCFOP.custitem_lmry_br_cfop_out[0].value,
                columns: ['custrecord_lmry_br_cfop_description']
              });

              nameCFOP = nameCFOP.custrecord_lmry_br_cfop_description;

              if (nameCFOP) {
                recordObj.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_lmry_br_tran_outgoing_cfop_di',
                  value: nameCFOP,
                  ignoreFieldChange: true
                });
              }

              recordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_lmry_br_tran_outgoing_cfop',
                value: itemCFOP.custitem_lmry_br_cfop_out[0].value,
                ignoreFieldChange: true
              });

            }

          }
        }

        if (sublistName == 'item' && name == 'custcol_lmry_br_tran_outgoing_cfop' && flagCFOP == true) {
          var cfop = recordObj.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_lmry_br_tran_outgoing_cfop'
          });
          if (cfop) {
            var nameCFOP = search.lookupFields({
              type: 'customrecord_lmry_br_cfop_codes',
              id: cfop,
              columns: ['custrecord_lmry_br_cfop_description']
            });
            nameCFOP = nameCFOP.custrecord_lmry_br_cfop_description;

            if (nameCFOP) {
              recordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_lmry_br_tran_outgoing_cfop_di',
                value: nameCFOP,
                ignoreFieldChange: true
              });
            }

            recordObj.setCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_lmry_br_tran_outgoing_cfop',
              value: cfop,
              ignoreFieldChange: true
            });

          }

        }

        flagCFOP = true;

      }

      if (ST_FEATURE == true || ST_FEATURE == 'T') {
        if (type != "copy") {
          ST_ConfigFields.setInvoicingIdentifier(recordObj);
        }
      }

      return true;
    }


    /* ------------------------------------------------------------------------------------------------------
     * A la variable featureId se le asigna el valore que le corresponde
     * --------------------------------------------------------------------------------------------------- */
    function ValidateAccessCM(ID) {
      try {


        if (ID == '' || ID == null) {
          return true;
        }

        // Inicializa variables Locales y Globales
        LMRY_access = false;
        LMRY_countr = libraryMail.Get_Country_STLT(ID);

        // Verifica que el arreglo este lleno
        if (LMRY_countr.length < 1) {
          return true;
        }

        LMRY_access = libraryMail.getCountryOfAccess(LMRY_countr, licenses);

        if (LMRY_countr[0] == '' || LMRY_countr[0] == null) {
          return true;
        }

        // Solo si tiene acceso
        Val_Campos = '';
        if (LMRY_access == true) {
          // Validación de campos obligatorios
          Val_Campos = library_Val.Val_Authorization(recordObj, LMRY_countr[0], licenses);
          Val_Campos_Linea = library_Val.Val_Line_Busqueda(recordObj, LMRY_countr[0], licenses);
        }

        // Ya paso por esta validacion
        LMRY_swsubs = false;

      } catch (err) {
        libraryMail.sendemail2(' [ ValidateAccessCM ] ' + err, LMRY_script, recordObj, 'tranid', 'entity');
      }

      return true;
    }

    return {
      pageInit: CMClnt_PageInit,
      saveRecord: CMClnt_SaveRecord,
      validateField: CMClnt_ValidateField,
      fieldChanged: fieldChanged,
      validateLine: ValidateLine
    };
  });