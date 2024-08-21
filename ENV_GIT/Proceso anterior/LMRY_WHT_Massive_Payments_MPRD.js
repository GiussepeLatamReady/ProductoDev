/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Name LMRY_WHT_Massive_Payments_MPRD.js
 */
define(['N/log','N/record','N/search','N/format','N/runtime','./WTH_Library/LMRY_WHT_Massive_Payments_LBRY','./Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', "./Latam_Library/LMRY_Log_LBRY_V2.0"],

  function(log,record,search,format,runtime,library_wht,library_email, lbryLog) {

    var LMRY_script = 'LatamReady - WHT Massive Payments MPRD';

    var scriptObj = runtime.getCurrentScript();
    var userid = scriptObj.getParameter({name: 'custscript_lmry_wht_massive_useid'});
    var logid = scriptObj.getParameter({name: 'custscript_lmry_wht_massive_logid'});
    var cform_id = scriptObj.getParameter({name: 'custscript_lmry_wht_vendor_credit'});

    /**
     * Input Data for processing
     *
     * @return Array,Object,Search,File
     *
     * @since 2016.1
     */
    function getInputData() {

      try{
        log.error('userid y logid',userid + "-" + logid);

        var id_massive = record.load({type:'customrecord_lmry_wht_massive_payments', id: logid});

        var subsidiary = id_massive.getValue('custrecord_lmry_wht_massive_subsi');
        var docfiscales = id_massive.getValue('custrecord_lmry_wht_massive_document');
        var date = id_massive.getValue('custrecord_lmry_wht_massive_date');
        var exchange_actual = id_massive.getValue('custrecord_lmry_wht_massive_rate');
        var currency_actual_text = id_massive.getText('custrecord_lmry_wht_massive_currency');
        var multib = id_massive.getValue('custrecord_lmry_wht_massive_multibooking');
        var search_massive = id_massive.getValue('custrecord_lmry_wht_massive_payments_log');
        var noretention = id_massive.getValue('custrecord_lmry_wht_massive_apply_reten');
        var manual = id_massive.getValue('custrecord_lmry_wht_massive_manual');

        id_massive.setValue({fieldId:'custrecord_lmry_wht_massive_employee',value:userid});
        id_massive.setValue({fieldId:'custrecord_lmry_wht_massive_status',value:'Procesando'});

        id_massive.save();

        var pais = search.lookupFields({type:'subsidiary',columns:['country'],id:subsidiary});
        pais = pais.country[0].text;
        pais = (pais.toUpperCase()).substring(0,3);

        //CONFIGURACION SETUPTAX, ARREGLO DOCFISCAL, ARREGLOBILL
        var arreglo_setuptax = library_wht.llenado_setuptax(subsidiary,docfiscales);
        var arreglo_currencies = library_wht.multibooking(currency_actual_text,exchange_actual,multib);

        date = format.format({value:date,type:format.Type.DATE});

        var split_log = search_massive.split('|');
        var id_log = [];

        for(var i=0; i<split_log.length-1; i++){
          id_log.push(split_log[i]);
        }

        var search_log = search.create({type:'customrecord_lmry_wht_payments_log',
        columns:[{name:'internalid',sort: search.Sort.ASC},'custrecord_lmry_wht_sub','custrecord_lmry_wht_ven','custrecord_lmry_wht_per','custrecord_lmry_wht_dat',
        'custrecord_lmry_wht_met','custrecord_lmry_wht_cur','custrecord_lmry_wht_mem','custrecord_lmry_wht_acc','custrecord_lmry_wht_ban',
        'custrecord_lmry_wht_dep','custrecord_lmry_wht_loc','custrecord_lmry_wht_cla','custrecord_lmry_wht_eft'],
        filters:[{name:'internalid',operator:'anyof',values:id_log},{name:'custrecord_lmry_wht_sta',operator:'isnot',values:'Finalizado'}]
        });

        var result_log = search_log.run().getRange({start:0,end:1000});
        log.error('result_log map',result_log.length);

        var prueba_json = [];
        var contador = 0;

        for(var i=0;i<result_log.length;i++){

          var location = '',clase = '', department = '';
          if(result_log[i].getValue('custrecord_lmry_wht_loc') != null && result_log[i].getValue('custrecord_lmry_wht_loc') != ''){
            location = result_log[i].getValue('custrecord_lmry_wht_loc');
          }

          if(result_log[i].getValue('custrecord_lmry_wht_dep') != null && result_log[i].getValue('custrecord_lmry_wht_dep') != ''){
            department = result_log[i].getValue('custrecord_lmry_wht_dep');
          }

          if(result_log[i].getValue('custrecord_lmry_wht_cla')  != null && result_log[i].getValue('custrecord_lmry_wht_cla') != ''){
            clase = result_log[i].getValue('custrecord_lmry_wht_cla');
          }

          prueba_json.push({
            key: contador,
            values: {
              paymentlog: result_log[i].getValue('internalid'),
              subsidiary: result_log[i].getValue('custrecord_lmry_wht_sub'),
              vendor: result_log[i].getValue('custrecord_lmry_wht_ven'),
              accountingperiod: result_log[i].getValue('custrecord_lmry_wht_per'),
              date: result_log[i].getValue('custrecord_lmry_wht_dat'),
              setuptax: arreglo_setuptax[0],
              docfiscalid: arreglo_setuptax[1],
              docfiscalbill: arreglo_setuptax[2],
              currencies: arreglo_currencies,
              country: pais,
              moneda: result_log[i].getValue('custrecord_lmry_wht_cur'),
              paymentmethod: result_log[i].getValue('custrecord_lmry_wht_met'),
              memo: result_log[i].getValue('custrecord_lmry_wht_mem'),
              ap: result_log[i].getValue('custrecord_lmry_wht_acc'),
              bank: result_log[i].getValue('custrecord_lmry_wht_ban'),
              department: department,
              clase: clase,
              location: location,
              rate: exchange_actual,
              accountingbook: multib,
              noretention: noretention,
              manual: manual,
              eft: result_log[i].getValue('custrecord_lmry_wht_eft')
            }
          });
          contador++;
        }

        return prueba_json;

      }catch(err){
        log.error('[getInputData]',err);
        library_email.sendemail('[getInputData]' + err,LMRY_script);
        lbryLog.doLog({ title : "[ getInputData ]", message : err });
      }

    }

    /**
     * If this entry point is used, the map function is invoked one time for each key/value.
     *
     * @param {Object} context
     * @param {boolean} context.isRestarted - Indicates whether the current invocation represents a restart
     * @param {number} context.executionNo - Version of the bundle being installed
     * @param {Iterator} context.errors - This param contains a "iterator().each(parameters)" function
     * @param {string} context.key - The key to be processed during the current invocation
     * @param {string} context.value - The value to be processed during the current invocation
     * @param {function} context.write - This data is passed to the reduce stage
     *
     * @since 2016.1
     */
    function map(context) {

    }

    /**
     * If this entry point is used, the reduce function is invoked one time for
     * each key and list of values provided..
     *
     * @param {Object} context
     * @param {boolean} context.isRestarted - Indicates whether the current invocation represents a restart
     * @param {number} context.executionNo - Version of the bundle being installed
     * @param {Iterator} context.errors - This param contains a "iterator().each(parameters)" function
     * @param {string} context.key - The key to be processed during the current invocation
     * @param {string} context.value - The value to be processed during the current invocation
     * @param {function} context.write - This data is passed to the reduce stage
     *
     * @since 2016.1
     */
    function reduce(context) {
      try{
        var massive_log = context.values;
        massive_log = JSON.parse(massive_log[0]);

        var accountingPeriod = massive_log.values.accountingperiod;
        var vendor = massive_log.values.vendor;
        var fechaIngresada = massive_log.values.date;
        var arregloCurrencies = massive_log.values.currencies;
        var arregloSetupTax = massive_log.values.setuptax;
        var subsidiary = massive_log.values.subsidiary;
        var arregloDocFiscalId = massive_log.values.docfiscalid;
        var arregloDocFiscalBill = massive_log.values.docfiscalbill;
        var id_log = massive_log.values.paymentlog;
        var paymentMethod = massive_log.values.paymentmethod;
        var moneda = massive_log.values.moneda;
        var ap = massive_log.values.ap;
        var bank = massive_log.values.bank;
        var department = massive_log.values.department;
        var memo = massive_log.values.memo;
        var clase = massive_log.values.clase;
        var location = massive_log.values.location;
        var rate = massive_log.values.rate;
        var accountingbook = massive_log.values.multib;
        var country = massive_log.values.country;
        var noretention = massive_log.values.noretention;
        var manual = massive_log.values.manual;
        var eft = massive_log.values.eft;

        record.submitFields({type:'customrecord_lmry_wht_payments_log',id:id_log,values:{custrecord_lmry_wht_sta:'procesando',custrecord_lmry_wht_emp:userid}});

        library_wht.payment_log('1',id_log, accountingPeriod, vendor, fechaIngresada, arregloCurrencies, arregloSetupTax, subsidiary, arregloDocFiscalId, arregloDocFiscalBill, arregloCurrencies[2],noretention,manual);
        library_wht.creadoTransacciones(id_log,arregloSetupTax,subsidiary,fechaIngresada,accountingPeriod,paymentMethod,moneda,memo,ap,bank,department,clase,location,rate,accountingbook,cform_id,country,vendor,arregloCurrencies[3],arregloCurrencies[2],eft,'','1');
        library_wht.reseteo();

        record.submitFields({type:'customrecord_lmry_wht_payments_log',id:id_log,values:{custrecord_lmry_wht_sta:'Finalizado'}});

        var remainingUsage1 = runtime.getCurrentScript().getRemainingUsage();
        log.error('Memoria consumida', remainingUsage1);
        context.write({key:id_log,value:['T']});

      }catch(err){
        log.error('[map]',err);
        record.submitFields({type:'customrecord_lmry_wht_payments_log',id:id_log,values:{custrecord_lmry_wht_sta:'Ocurrio un error'}});
        context.write({key:id_log,value:['F']});
        library_email.sendemail('[reduce]' + err,LMRY_script);
        lbryLog.doLog({ title : "[ reduce ]", message : err });
      }
    }

    /**
     * If this entry point is used, the reduce function is invoked one time for
     * each key and list of values provided..
     *
     * @param {Object} context
     * @param {boolean} context.isRestarted - Indicates whether the current invocation of the represents a restart.
     * @param {number} context.concurrency - The maximum concurrency number when running the map/reduce script.
     * @param {Date} context.datecreated - The time and day when the script began running.
     * @param {number} context.seconds - The total number of seconds that elapsed during the processing of the script.
     * @param {number} context.usage - TThe total number of usage units consumed during the processing of the script.
     * @param {number} context.yields - The total number of yields that occurred during the processing of the script.
     * @param {Object} context.inputSummary - Object that contains data about the input stage.
     * @param {Object} context.mapSummary - Object that contains data about the map stage.
     * @param {Object} context.reduceSummary - Object that contains data about the reduce stage.
     * @param {Iterator} context.ouput - This param contains a "iterator().each(parameters)" function
     *
     * @since 2016.1
     */
    function summarize(context) {

      try{

        log.error('Llego al Summarize');

        var transaction = '';
        context.output.iterator().each(function(key,value){
          value = JSON.parse(value);
          if(value[0] == 'F'){
            transaction = key + "|";
          }

          return true;
        })

        if(transaction != ''){
          record.submitFields({type:'customrecord_lmry_wht_massive_payments',id:logid,values:{	custrecord_lmry_wht_massive_status:'Transacciones fallidas: '+transaction}});
        }else{
          record.submitFields({type:'customrecord_lmry_wht_massive_payments',id:logid,values:{	custrecord_lmry_wht_massive_status:'Finalizado'}});
        }
      }catch(err){
        log.error('[summarize]',err);
        library_email.sendemail('[summarize]' + err,LMRY_script);
        lbryLog.doLog({ title : "[ summarize ]", message : err });
      }

    }

    return {
      getInputData: getInputData,
      //map: map
      reduce: reduce
      //summarize: summarize
    };

  });
