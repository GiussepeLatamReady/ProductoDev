/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_CO_WHT_Lines_MPRD.js                        ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Sep 14 2021  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/task', 'N/email', 'N/log', 'N/record', 'N/search', 'N/format', 'N/runtime', './Latam_Library/LMRY_libSendingEmailsLBRY_V2.0', './WTH_Library/LMRY_New_Country_WHT_Lines_LBRY', './Latam_Library/LMRY_Log_LBRY_V2.0'],

  function(task, email, log, record, search, format, runtime, libraryEmail, libraryCoLines, libraryLog) {

    var LMRY_script = 'LatamReady - CO WHT Lines MPRD';

    var scriptObj = runtime.getCurrentScript();

    /**
     * Input Data for processing
     *
     * @return Array,Object,Search,File
     *
     * @since 2016.1
     */
    function getInputData() {

      try{

        var searchCoLog = search.create({type: 'customrecord_lmry_co_wht_lines_log', filters: [{name: 'custrecord_lmry_co_wht_lines_status', operator: 'anyof', values: '4'}, {name: 'isinactive', operator: 'is', values: 'F'}],
        columns: [{name: 'internalid', sort: search.Sort.ASC}, 'custrecord_lmry_co_wht_lines_transaction', 'custrecord_lmry_co_wht_lines_type', 'custrecord_lmry_co_wht_lines_user', 'custrecord_lmry_co_wht_lines_subsidiary'] });

        searchCoLog = searchCoLog.run().getRange({start: 0, end: 1});

        var arrayLog = [];

        if(searchCoLog && searchCoLog.length){

          var idLog = searchCoLog[0].id;

          log.debug('idLog', idLog);

          var subsidiary = searchCoLog[0].getValue('custrecord_lmry_co_wht_lines_subsidiary');
          var licenses = libraryEmail.getLicenses(subsidiary);
          var idTransaction = searchCoLog[0].getValue('custrecord_lmry_co_wht_lines_transaction');
          var typeTransaction = searchCoLog[0].getValue('custrecord_lmry_co_wht_lines_type');
          var user = searchCoLog[0].getValue('custrecord_lmry_co_wht_lines_user');

          var loadTransaction = record.load({type: typeTransaction, id: idTransaction});

          var arrayDelete = libraryCoLines.newAfterSubmitTransaction({oldRecord: loadTransaction}, 'edit', idTransaction, typeTransaction, licenses, true);

          if(typeof arrayDelete != 'object'){
            return arrayLog;
          }

          //IDs a eliminar
          for(var j = 0; j < arrayDelete.length; j++){
            arrayLog.push({key: idTransaction, type: 'delete', data: arrayDelete[j], typeTransaction: typeTransaction, idLog: idLog, user: user});
          }

          //Arreglo de Retenciones
          var arrayTR = libraryCoLines.getWHT(loadTransaction, 'edit', idTransaction, typeTransaction, licenses);

          if(arrayTR.length){

            //Tax Results
            for(var j = 0; j < arrayTR.length; j++){
              arrayLog.push({key: idTransaction, type: 'createtaxresult', data: arrayTR[j], typeTransaction: typeTransaction, idLog: idLog, user: user});
            }

            //WHT O journal
            var dataTransaction = libraryCoLines.getDataTransaction(arrayTR, loadTransaction, licenses);
            var groupFeature = dataTransaction.feature;
            var groupData = dataTransaction.retenciones;

            //Retenciones agrupadas o sin
            if(groupFeature){

              for(var k in groupData){
                for(var l in groupData[k]){
                  arrayLog.push({key: idTransaction, type: 'createtransaction', featureGroup: groupFeature, typeTransaction: typeTransaction, data: groupData[k][l], idLog: idLog, user: user});
                }
              }

            }else{

              for(var k = 0; k < groupData.length; k++){
                arrayLog.push({key: idTransaction, type: 'createtransaction', featureGroup: groupFeature, typeTransaction: typeTransaction, data: [groupData[k]], idLog: idLog, user: user});
              }

            }

          }

          record.submitFields({type: 'customrecord_lmry_co_wht_lines_log', id: idLog, values: {custrecord_lmry_co_wht_lines_status: '1'} });

        }

        log.debug('arrayLog.length', arrayLog.length);

        return arrayLog;

      }catch(err){

        log.error('[getInputData]',err);
        record.submitFields({type: 'customrecord_lmry_co_wht_lines_log', id: idLog, values: {custrecord_lmry_co_wht_lines_status: '3'} });
        libraryEmail.sendemail('[getInputData]' + err, LMRY_script);
        libraryLog.doLog({title: '[ getInputData ]', message: err});

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

      try{

        var currentData = JSON.parse(context.value);

        var idTransaction = currentData.key;
        var idLog = currentData.idLog;
        var typeTransaction = currentData.typeTransaction;
        var type = currentData.type;
        var data = currentData.data;
        var user = currentData.user;

        var loadTransaction = record.load({type: typeTransaction, id: idTransaction});

        if(type == 'delete'){

          if(data.type == 'onlydelete'){

            //Delete tax results y Journal
            libraryCoLines.deleteAll(data);

          }else{

            //Desaplica y Delete Transacciones Relacionadas
            libraryCoLines.deleteAll(data, loadTransaction);

          }
        }else if(type == 'createtaxresult'){//create

          libraryCoLines.createTaxResult(data, loadTransaction);

          context.write({key: idTransaction, value: {idTransaction: idTransaction, data: data, subsidiary: loadTransaction.getText('subsidiary'), typeTransaction: typeTransaction, user: user, idLog: idLog}});

        }else{//create wht o journal

          var genera = data[0].genera;
          var subsidiary = loadTransaction.getValue('subsidiary') || 1;
          var licenses = libraryEmail.getLicenses(subsidiary);
          var forms = libraryCoLines.getForms(subsidiary);

          if(genera == '1'){
            libraryCoLines.createJournal(data, typeTransaction, loadTransaction, '', licenses, forms);
          }else{
            libraryCoLines.createTransaction(data, typeTransaction, loadTransaction, '', licenses, forms);
          }

        }

        //log.debug('Fin map');

      }catch(err){

        log.error('Error catch [MAP]', err.valueOf().toString());
        //context.write({key: idTransaction, value: {idTransaction: idTransaction, subsidiary: subsidiary, typeTransaction: typeTransaction, user: user, idLog: idLog, error: true}});
        record.submitFields({type: 'customrecord_lmry_co_wht_lines_log', id: idLog, values: {custrecord_lmry_co_wht_lines_status: '3'} });
        libraryLog.doLog({title: '[ map ]', message: err});

      }


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

        var currentData = context.values;
        var dataCabecera = JSON.parse(currentData[0]);

        var idTransaction = dataCabecera.idTransaction;
        var typeTransaction = dataCabecera.typeTransaction;
        var subsidiary = dataCabecera.subsidiary;
        var user = dataCabecera.user;
        var idLog = dataCabecera.idLog;

        var arrayTaxResult = [];

        for(var i = 0; i < currentData.length; i++){
          var taxResult = JSON.parse(currentData[i]);
          taxResult = taxResult.data;

          arrayTaxResult.push(taxResult);

        }

        //var loadTransaction = record.load({type: typeTransaction, id: idTransaction});
        //libraryCoLines.setDataBody(arrayTaxResult, loadTransaction, typeTransaction);

        context.write({key: idTransaction, value: {idTransaction: idTransaction, arrayTaxResult: arrayTaxResult, subsidiary: subsidiary, type: typeTransaction, user: user, idLog: idLog, error: false}});


      }catch(err){

        log.error('Error catch [REDUCE]',err.valueOf().toString());
        context.write({key: idTransaction, value: {idTransaction: idTransaction, subsidiary: subsidiary, type: type, user: user, idLog: idLog, error: true}});
        record.submitFields({type: 'customrecord_lmry_co_wht_lines_log', id: idLog, values: {custrecord_lmry_co_wht_lines_status: '3'} });
        libraryLog.doLog({title: '[ reduce ]', message: err});


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

        context.output.iterator().each(function(key,value){
          value = JSON.parse(value);

          var subsidiary = value.subsidiary;
          var type = value.type;
          var error = value.error;
          var idTransaction = value.idTransaction;
          var idUser = value.user;
          var idLog = value.idLog;
          var arrayTaxResult = value.arrayTaxResult;

          var loadTransaction = record.load({type: type, id: idTransaction});

          //SUBMITEO DE CAMPOS DE CABECERA
          libraryCoLines.setDataBody(arrayTaxResult, loadTransaction, type);

          //TRANID Y EMPLOYEE: CORREO
          var tranidTransaction = search.lookupFields({type: type, columns: ['tranid'], id: idTransaction});
          tranidTransaction = tranidTransaction.tranid || idTransaction;

          var employee = search.lookupFields({type: 'employee', columns: ['email','firstname'], id: idUser});

          var bodyEmail = messageBody(employee.firstname, subsidiary, tranidTransaction, error);

          email.send({author: idUser, recipients: employee.email, subject: 'LatamReady - CO WHT Lines', body: bodyEmail});

          if(!error){
            record.submitFields({type: 'customrecord_lmry_co_wht_lines_log', id: idLog, values: {custrecord_lmry_co_wht_lines_status: '2'} });
          }else{
            record.submitFields({type: 'customrecord_lmry_co_wht_lines_log', id: idLog, values: {custrecord_lmry_co_wht_lines_status: '3'} });
          }

          return true;

        });

        log.debug('Fin summarize');

        recall();


      }catch(err){

        log.error('[summarize]',err);
        libraryEmail.sendemail('[summarize]' + err, LMRY_script);
        libraryLog.doLog({title: '[ summarize ]', message: err});

      }

    }

    function messageBody(employeeName, subsidiary, tranidTransaction, error){

      var body =  '<body text="#333333" link="#014684" vlink="#014684" alink="#014684">';
      body += '<table width="642" border="0" align="center" cellpadding="0" cellspacing="0">';
      body += '<tr>';
      body += '<td width="100%" valign="top">';
      body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
      body += '<tr>';
      body += '<td width="100%" colspan="2"><img style="display: block;" src="https://system.na1.netsuite.com/core/media/media.nl?id=921&c=TSTDRV1038915&h=c493217843d184e7f054" width="645" alt="main banner"/></td>';
      body += '</tr>';
      body += '</table>';
      body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
      body += '<tr>';
      body += '<td bgcolor="#d50303" width="15%">&nbsp;</td>';
      body += '<td bgcolor="#d50303" width="85%">';
      body += '<font style="color:#FFFFFF; line-height:130%; font-family:Arial, Helvetica, sans-serif; font-size:19px">';
      body += 'Estimado(a) ' + employeeName + ':<br>';
      body += '</font>';
      body += '</td>';
      body += '</tr>';
      body += '<tr>';
      body += '<td width="100%" bgcolor="#d50303" colspan="2" align="right"><a href="http://www.latamready.com/#contac"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=923&c=TSTDRV1038915&h=3c7406d759735a1e791d" width="94" style="margin-right:45px" /></a></td>';
      body += '</tr>';
      body += '<tr>';
      body += '<td width="100%" bgcolor="#FFF" colspan="2" align="right">';
      body += '<a href="https://www.linkedin.com/company/9207808"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=924&c=TSTDRV1038915&h=c135e74bcb8d5e1ac356" width="15" style="margin:5px 1px 5px 0px" /></a>';
      body += '<a href="https://www.facebook.com/LatamReady-337412836443120/"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=919&c=TSTDRV1038915&h=9c937774d04fb76747f7" width="15" style="margin:5px 1px 5px 0px" /></a>';
      body += '<a href="https://twitter.com/LatamReady"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=928&c=TSTDRV1038915&h=fc69b39a8e7210c65984" width="15" style="margin:5px 47px 5px 0px" /></a>';
      body += '</td>';
      body += '</tr>';
      body += '</table>';
      body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
      body += '<tr>';
      body += '<td width="15%">&nbsp;</td>';
      body += '<td width="70%">';
      body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:13px">';

      body += '<p>Este es un mensaje automatico de LatamReady SuiteApp.</p>';
      body += '<p>Se ha procesado la transacción: ' + tranidTransaction + '</p>';
      body += '<p>Para la subsidiria: ' + subsidiary + '.</p>';

      if(error){
        body += '<p>Ocurrió un error al procesar la transacción.</p>';
      }else{
        body += '<p>Debe refrescar la transacción para visualizar las retenciones.</p>';
      }

      body += '<p>Saludos</p>';
      body += '<p>El Equipo de LatamReady</p>';
      body += '</font>';
      body += '</td>';
      body += '<td width="15%">&nbsp;</td>';
      body += '</tr>';
      body += '</table>';

      body += '<br>';

      body += '<table width="100%" border="0" cellspacing="0" cellpadding="2" bgcolor="#e5e6e7">';
      body += '<tr>';
      body += '<td>&nbsp;</td>';
      body += '</tr>';
      body += '<tr>';
      body += '<td width="15%">&nbsp;</td>';
      body += '<td width="70%" align="center">';
      body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:12px;" >';
      body += '<i>Este es un mensaje automatico. Por favor, no responda este correo electronico.</i>';
      body += '</font>';
      body += '</td>';
      body += '<td width="15%">&nbsp;</td>';
      body += '</tr>';
      body += '<tr>';
      body += '<td>&nbsp;</td>';
      body += '</tr>';
      body += '</table>';
      body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
      body += '<tr>';
      body += '<td width="15%">&nbsp;</td>';
      body += '<td width="70%" align="center">';
      body += '<a href="http://www.latamready.com/"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=926&c=TSTDRV1038915&h=e14f0c301f279780eb38" width="169" style="margin:15px 0px 15px 0px" /></a>';
      body += '</td>';
      body += '<td width="15%">&nbsp;</td>';
      body += '</tr>';
      body += '</table>';
      body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
      body += '<tr>';
      body += '<td width="15%">&nbsp;</td>';
      body += '<td width="70%" align="center">';
      body += '<a href="https://www.linkedin.com/company/9207808"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=925&c=TSTDRV1038915&h=41ec53b63dba135488be" width="101" style="margin:0px 5px 0px 5px" /></a>';
      body += '<a href="https://www.facebook.com/LatamReady-337412836443120/"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=920&c=TSTDRV1038915&h=7fb4d03fff9283e55318" width="101" style="margin:0px 5px 0px 5px" /></a>';
      body += '<a href="https://twitter.com/LatamReady"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=929&c=TSTDRV1038915&h=300c376863035d25c42a" width="101" style="margin:0px 5px 0px 5px" /></a>';
      body += '</td>';
      body += '<td width="15%">&nbsp;</td>';
      body += '</tr>';
      body += '</table>';
      body += '<table width="100%" border="0" cellspacing="0">';
      body += '<tr>';
      body += '<td>';
      body += '<img src="https://system.na1.netsuite.com/core/media/media.nl?id=918&c=TSTDRV1038915&h=7f0198f888bdbb495497" width="642" style="margin:15px 0px 15px 0px" /></a>';
      body += '</td>';
      body += '</tr>';
      body += '</table>';
      body += '</td>';
      body += '</tr>';
      body += '</table>';
      body += '</body>';

      return body;

    }

    function recall(){

      try{

        var searchCoLog = search.create({type: 'customrecord_lmry_co_wht_lines_log', filters: [{name: 'custrecord_lmry_co_wht_lines_status', operator: 'anyof', values: '4'}, {name: 'isinactive', operator: 'is', values: 'F'}],
        columns: [{name: 'internalid', sort: search.Sort.DESC}, 'custrecord_lmry_co_wht_lines_transaction', 'custrecord_lmry_co_wht_lines_type', 'custrecord_lmry_co_wht_lines_user', 'custrecord_lmry_co_wht_lines_subsidiary'] });

        searchCoLog = searchCoLog.run().getRange({start: 0, end: 1});

        if(searchCoLog && searchCoLog.length){

          task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: 'customscript_lmry_co_wht_lines_mprd',
            deploymentId: 'customdeploy_lmry_co_wht_lines_mprd'
          }).submit();

        }


      }catch(err){

        log.error('[recall]',err);
        libraryEmail.sendemail('[recall]' + err, LMRY_script);
        libraryLog.doLog({title: '[ recall ]', message: err});

      }


    }

    return {
      getInputData: getInputData,
      map: map,
      reduce: reduce,
      summarize: summarize
    };

  });
