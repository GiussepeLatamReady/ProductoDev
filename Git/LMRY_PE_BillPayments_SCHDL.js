/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_PE_BillPayments_SCHDL.js                      ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Set 22 2017  LatamReady    Use Script 2.0           ||
\= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(['N/log', 'N/record', 'N/search', 'N/format', 'N/runtime', 'N/email', 'N/config', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', './Latam_Library/LMRY_PE_Massive_BillPayments_LBRY'],

  function(log, record, search, format, runtime, email, config, library, library_wht) {
    // Nombre del Script
    var LMRY_script = "Latamready PE Bill Payments SCHDL";

    var subsi_OW = runtime.isFeatureInEffect({
      feature: "SUBSIDIARIES"
    });

    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
      var estado='';
      try {
        // trae el parametro de WHT on Payments SCHDL
        var scriptObj = runtime.getCurrentScript();

        var param_id = scriptObj.getParameter({
          name: 'custscript_lmry_pe_payments_param01'
        });
        var users_id = scriptObj.getParameter({
          name: 'custscript_lmry_pe_payments_param02'
        });

        var separa = param_id.split("|");

        for (var i = 0; i < separa.length - 1; i++) {
          estado= separa[i];

        //cambiar el estado al registro payments log
        var id = record.submitFields({
          type: 'customrecord_lmry_pe_payments_log',
          id: estado,
          values: {
            custrecord_lmry_pe_status: 'Procesando',
            custrecord_lmry_pe_employee: users_id
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
            disableTriggers: true
          }
        });

        //Se procesa el lotes de facturas seleccionadas
        var estado_log = search.lookupFields({
          type: 'customrecord_lmry_pe_payments_log',
          id: estado,
          columns: ['custrecord_lmry_pe_subsidiary', 'custrecord_lmry_pe_vendor', 'custrecord_lmry_pe_bill', 'custrecord_lmry_pe_account', 'custrecord_lmry_pe_currency', 'custrecord_lmry_pe_bank',
            'custrecord_lmry_pe_period', 'custrecord_lmry_pe_exchangerate', 'custrecord_lmry_pe_check', 'custrecord_lmry_pe_memo', 'custrecord_lmry_pe_department', 'custrecord_lmry_pe_doc',
            'custrecord_lmry_pe_location', 'custrecord_lmry_pe_class', 'custrecord_lmry_pe_paymethod', 'custrecord_lmry_pe_date', 'custrecord_lmry_pe_multibook'
          ]
        });


        var exchange_actual = estado_log.custrecord_lmry_pe_exchangerate;
        var multib = estado_log.custrecord_lmry_pe_multibook;
        var subsidiary = estado_log.custrecord_lmry_pe_subsidiary[0].value;
        var currency_actual_text = estado_log.custrecord_lmry_pe_currency[0].text;
        var docfiscales = estado_log.custrecord_lmry_pe_doc;
        var date = estado_log.custrecord_lmry_pe_date;
        var bill= estado_log.custrecord_lmry_pe_bill;
      //  var bill = estado_log.custrecord_lmry_wht_bil;
        date = format.format({
          value: date,
          type: format.Type.DATE
        });

        //CONFIGURACION SETUPTAX, ARREGLO DOCFISCAL, ARREGLOBILL
        var arregloSetupTax = library_wht.llenado_setuptax(subsidiary, docfiscales);
        var arregloCurrencies = library_wht.multibooking(currency_actual_text, exchange_actual, multib);

        var accountingPeriod = estado_log.custrecord_lmry_pe_period[0].value;
        var vendor = estado_log.custrecord_lmry_pe_vendor[0].value;

        var location = '',
          department = '',
          clase = '';
        if (estado_log.	custrecord_lmry_pe_location.length != 0) {
          location = estado_log.custrecord_lmry_pe_location[0].value;
        }
        if (estado_log.custrecord_lmry_pe_department.length != 0) {
          department = estado_log.custrecord_lmry_pe_department[0].value;
        }
        if (estado_log.custrecord_lmry_pe_class.length != 0) {
          clase = estado_log.custrecord_lmry_pe_class[0].value;
        }

        var paymentMethod = estado_log.custrecord_lmry_pe_paymethod[0].value;
        var moneda = estado_log.custrecord_lmry_pe_currency[0].value;
        var memo = estado_log.custrecord_lmry_pe_memo;
        var ap = estado_log.custrecord_lmry_pe_account[0].value;
        var bank = estado_log.custrecord_lmry_pe_bank[0].value;
        var check = estado_log.custrecord_lmry_pe_check;

        library_wht.creadoTransacciones(estado, bill,arregloSetupTax[0], subsidiary, date, accountingPeriod, paymentMethod, moneda, memo, ap, bank, department, clase, location, exchange_actual, multib, vendor, arregloCurrencies[3], arregloCurrencies[2], check,'0');

        record.submitFields({
          type: 'customrecord_lmry_pe_payments_log',
          id: estado,
          values: {
            custrecord_lmry_pe_status: 'Finalizado'
          },
          option: {
            disableTriggers: true
          }
        });

      }

      //  var remainingUsage1 = runtime.getCurrentScript().getRemainingUsage();
      //  log.error('Memoria consumida', remainingUsage1);


      }catch (msgerr) {

        if(estado!=''&& estado!=null){
        var id = record.submitFields({
          type: 'customrecord_lmry_pe_payments_log',
          id: estado,
          values: {
            custrecord_lmry_pe_status: 'Ocurrio un error, revise su configuracion'
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
            disableTriggers: true
          }
        });
       }

        library.sendemail(' [ onRequest ] ' + msgerr, LMRY_script);
        //log.error('msgerr', msgerr);
      }
    }

    return {
      execute: execute
    };
  });
