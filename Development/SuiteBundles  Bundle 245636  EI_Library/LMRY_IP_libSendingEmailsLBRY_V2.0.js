/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_IP_libSendingEmailsLBRY_V2.0.js				      ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jun 20 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

define(['N/search', 'N/https', 'N/log', 'N/email', 'N/runtime', 'N/record', 'N/url', 'N/format'],

  function(search, https, log, email, runtime, record, url, format, serverWidget) {
    /* Formato de las columnas de la tabla */
    var colStyl = 'style=\"text-align: center; font-size: 9pt; font-weight:bold; color:white; background-color:#d50303; border: 1px solid #d50303; ';
    var rowStyl = 'style=\"text-align: Left;   font-size: 9pt; font-weight:bold; border: 1px solid #d50303; ';
    var errStyl = 'style=\"text-align: Left;   font-size: 9pt; font-weight:bold; color:red;border: 1px solid #d50303; ';

    var width_td1 = " width:50%;\">";
    var width_td2 = " width:50%;\">";
    var LMRY_script = 'LMRY_libSendingEmailsLBRY V2.0';
    var isURET = new Boolean();

    /* ------------------------------------------------------------------------------------------------------
     * Valida el Enabled Feature y Duedate
     * --------------------------------------------------------------------------------------------------- */

    function getAuthorization(featureId, licenses) {
      if (licenses && licenses.length) {

        var type_obj = typeof licenses;

        if (type_obj != 'object') {
          var new_licenses = JSON.parse(licenses);
          return new_licenses && new_licenses.indexOf(Number(featureId)) > -1;
        } else {
          return licenses && licenses.indexOf(Number(featureId)) > -1;
        }

      } else {
        try {
          var secretPhrase = 'La venganza nunca es buena, mata el alma y la envenena';
          var resulAuthorization = false;
          var customerId = runtime.accountId;
          var busqLatamLicense = search.create({
            type: 'customrecord_latam_licenses',
            columns: ['custrecord_latam_customer', 'custrecord_latam_feature',
              'custrecord_expiration_date', 'custrecord_encrypted_data'
            ],
            filters: [
              ['custrecord_latam_feature', 'is', featureId], 'and', ['custrecord_latam_customer', 'is', customerId]
            ]
          });


          var resultLatamLicense = busqLatamLicense.run().getRange(0, 10);

          if (resultLatamLicense != null && resultLatamLicense.length != 0) {
            row = resultLatamLicense[0].columns;
            featureId = resultLatamLicense[0].getValue(row[1]);
            expiration = resultLatamLicense[0].getValue(row[2]);

            var expirationDate = format.parse({
              value: expiration,
              type: format.Type.DATE
            });

            if (new Date() < expirationDate) {
              var busqEnabledFeature = search.create({
                type: 'customrecord_latam_enabled_features',
                columns: ['custrecord_latam_enabled_feature'],
                filters: [
                  ['custrecord_latam_enabled_feature', 'is', featureId]
                ]
              });

              var resultEnabledFeature = busqEnabledFeature.run().getRange(0, 10);

              if (resultEnabledFeature && resultEnabledFeature.length > 0) {
                resulAuthorization = true;
              }
            }
          }
        } catch (err) {
          // Si se presenta erroe enviamos un mail
          sendemail(' [ getAuthorization ] ' + err);
        }
        return resulAuthorization;
      }
    }


    /* ------------------------------------------------------------------------------------------------------
     * Nota: Envio de mail al usuario en caso de ocurrir error.
     * --------------------------------------------------------------------------------------------------- */
    function sendemail(err, LMRY_script) {
      try {
        // Mensaje de error
        log.error(LMRY_script, err);

        // Dados del runtime.getCurrentUser
        var namevers = runtime.version;
        var namecomp = runtime.accountId;
        var nameuser = runtime.getCurrentUser().name;
        var nameroce = runtime.getCurrentUser().roleCenter;
        var namerole = runtime.getCurrentUser().role;
        var namesubs = runtime.getCurrentUser().subsidiary;

        var typeEnvironment = runtime.envType;
        var executionContext = runtime.executionContext;
        var bundleIds = runtime.getCurrentScript().bundleIds;
        var scriptId = runtime.getCurrentScript().id;

        log.error('record', JSON.stringify(record));
        // Apis de Netsuite
        var nametype = record.type;
        var namerdid = record.id;

        // Verifica si es One World
        var featuresubs = runtime.isFeatureInEffect({
          feature: 'SUBSIDIARIES'
        });

        var permSubsidiary = runtime.getCurrentUser().getPermission('LIST_SUBSIDIARY'); //Permiso para subsidiarias

        if ((featuresubs == true || featuresubs == 'T') && Number(permSubsidiary) > 0) {
          var namesubs = search.lookupFields({
            type: 'subsidiary',
            id: namesubs,
            columns: ['name']
          }).name;
        }

        // Error
        err = '- ' + err;
        // Error por identificar
        if (err.indexOf("object Object") > 0) {
          // No se envia mail
          return true;
        }

        // Verificamos el tipo de error
        if (err.indexOf("RCRD_HAS_BEEN_CHANGED") > 0) {
          log.error(LMRY_script, err);
          return true;
        }

        // Verificamos el tipo de error
        if (err.indexOf("NetworkError: Failed to execute") > 0) {
          // Mensaje al usuario
          err = "NetworkError: Se a produccido un error de conexion a internet ";
          err += "o se a cumplido el tiempo de espera de actividad en NetSuite. ";
          err += "Por favor vuelva ha iniciar sesion.";
        }

        // Verificamos que no sea session terminada
        if (err.indexOf("SESSION_TIMED_OUT") > 0) {
          // Mensaje al usuario
          err = "Session Timed Out: Se a cumplido el tiempo de espera de actividad en NetSuite. ";
          err += "Por favor vuelva ha iniciar sesion.";
        }

        // Datos del Usuario
        var userfn = ['email', 'firstname'];
        var empema = runtime.getCurrentUser().email;
        var empfir = runtime.getCurrentUser().name;
        var userid = runtime.getCurrentUser().id;

        if (userid < 0) {
          userid = runtime.getCurrentScript().getParameter({
            name: 'custscript_lmry_employee_manager'
          });

          if (userid) {
            try {
              var employ = search.lookupFields({
                type: 'employee',
                id: userid,
                columns: userfn
              });
              empema = employ.email;
              empfir = employ.firstname;
            } catch (msgerror) {
              log.error('sendemail - userid', msgerror);
              return true;
            }
          }
        }

        log.error('sendemail - userid', userid);

        if (!empema) {
          log.error('function sendemail ', 'Usuario no tiene correo');
          return true;
        }

        log.error('sendemail - empema - empfir', empema + ' - ' + empfir);

        var datetime = new Date();

        var bmsg = '';
        bmsg += "<table style=\"font-family: Courier New, Courier, monospace; width:98%; border: 1px solid #d50303;\">";
        bmsg += "<tr>";
        bmsg += "<td " + colStyl + width_td1;
        bmsg += "Descripcion";
        bmsg += "</td>";
        bmsg += "<td " + colStyl + width_td2;
        bmsg += "Detalle";
        bmsg += "</td>";
        bmsg += "</tr>";
        bmsg += "<tr>";
        bmsg += "<td " + rowStyl + width_td1;
        bmsg += "Fecha y Hora";
        bmsg += "</td>";
        bmsg += "<td " + rowStyl + width_td2;
        bmsg += datetime;
        bmsg += "</td>";
        bmsg += "</tr>";
        //Ambiente
        bmsg += "<tr>";
        bmsg += "<td " + rowStyl + width_td1;
        bmsg += "Ambiente";
        bmsg += "</td>";
        bmsg += "<td " + rowStyl + width_td2;
        bmsg += typeEnvironment;
        bmsg += "</td>";
        bmsg += "</tr>";

        bmsg += "<tr>";
        bmsg += "<td " + rowStyl + width_td1;
        bmsg += "NetSuite Version (Release)";
        bmsg += "</td>";
        bmsg += "<td " + rowStyl + width_td2;
        bmsg += namevers;
        bmsg += "</td>";
        bmsg += "</tr>";
        bmsg += "<tr>";
        bmsg += "<td " + rowStyl + width_td1;
        bmsg += "Codigo Cliente (Company)";
        bmsg += "</td>";
        bmsg += "<td " + rowStyl + width_td2;
        bmsg += namecomp;
        bmsg += "</td>";
        bmsg += "</tr>";
        bmsg += "<tr>";
        bmsg += "<td " + rowStyl + width_td1;
        bmsg += "Subsidiaria del Usuario (ID)";
        bmsg += "</td>";
        bmsg += "<td " + rowStyl + width_td2;
        bmsg += namesubs;
        bmsg += "</td>";
        bmsg += "</tr>";
        bmsg += "<tr>";
        bmsg += "<td " + rowStyl + width_td1;
        bmsg += "Nombre de Usuario (User) ";
        bmsg += "</td>";
        bmsg += "<td " + rowStyl + width_td2;
        bmsg += nameuser;
        bmsg += "</td>";
        bmsg += "</tr>";
        log.error('nametype', nametype);
        // Verifica que este dentro de una transaccion
        if (nametype != '' && nametype != null) {
          bmsg += "<tr>";
          bmsg += "<td " + rowStyl + width_td1;
          bmsg += "Tipo de Transaccion (Type) ";
          bmsg += "</td>";
          bmsg += "<td " + rowStyl + width_td2;
          bmsg += nametype;
          bmsg += "</td>";
          bmsg += "</tr>";
          bmsg += "<tr>";
          bmsg += "<td " + rowStyl + width_td1;
          bmsg += "Numero interno de la Transaccion (Internal ID) ";
          bmsg += "</td>";
          bmsg += "<td " + rowStyl + width_td2;
          bmsg += namerdid;
          bmsg += "</td>";
          bmsg += "</tr>";
        }
        bmsg += "<tr>";
        bmsg += "<td " + rowStyl + width_td1;
        bmsg += "Role Center (Role)";
        bmsg += "</td>";
        bmsg += "<td " + rowStyl + width_td2;
        bmsg += nameroce;
        bmsg += "</td>";
        bmsg += "</tr>";
        bmsg += "<tr>";
        bmsg += "<td " + rowStyl + width_td1;
        bmsg += "ID Rol del usuario (Role)";
        bmsg += "</td>";
        bmsg += "<td " + rowStyl + width_td2;
        bmsg += namerole;
        bmsg += "</td>";
        bmsg += "</tr>";

        //Execution Context
        bmsg += "<tr>";
        bmsg += "<td " + rowStyl + width_td1;
        bmsg += "Execution Context";
        bmsg += "</td>";
        bmsg += "<td " + rowStyl + width_td2;
        bmsg += executionContext;
        bmsg += "</td>";
        bmsg += "</tr>";

        //Bundle ID
        if (bundleIds && bundleIds.length) {
          bmsg += "<tr>";
          bmsg += "<td " + rowStyl + width_td1;
          bmsg += "Bundle ID";
          bmsg += "</td>";
          bmsg += "<td " + rowStyl + width_td2;
          bmsg += bundleIds + '';
          bmsg += "</td>";
          bmsg += "</tr>";
        }

        //Script ID
        if (scriptId) {
          bmsg += "<tr>";
          bmsg += "<td " + rowStyl + width_td1;
          bmsg += "Script ID";
          bmsg += "</td>";
          bmsg += "<td " + rowStyl + width_td2;
          bmsg += scriptId;
          bmsg += "</td>";
          bmsg += "</tr>";
        }

        bmsg += "<tr>";
        bmsg += "<td " + rowStyl + width_td1;
        bmsg += 'Script ' + LMRY_script + '';
        bmsg += "</td>";
        bmsg += "<td " + errStyl + width_td2;
        // Inicio - Detallar el error producido
        var errdecrip = err;
        var posExist1 = errdecrip.indexOf('type');
        var posExist2 = errdecrip.indexOf('message');
        var posExist3 = errdecrip.indexOf('ReferenceError');
        log.error('type , message :' + posExist1 + ' , ' + posExist2, 'ReferenceError : ' + posExist3)
        if ((parseInt(posExist1) > 0 && parseInt(posExist2) > 0) || parseInt(posExist3) > 0) {
          bmsg += '<table>';
          bmsg += '<tr>';
          bmsg += '<td>';
          bmsg += 'Type';
          bmsg += '</td>';
          bmsg += '<td>';
          bmsg += ':';
          bmsg += '</td>';
          bmsg += '<td>';
          bmsg += Latam_Get_Result(errdecrip, '"type"');
          bmsg += '</td>';
          bmsg += '</tr>';
          var msgcode = Latam_Get_Result(errdecrip, '"code"');
          if (msgcode != '' && msgcode != null && msgcode != undefined) {
            bmsg += '<tr>';
            bmsg += '<td>';
            bmsg += 'Code';
            bmsg += '</td>';
            bmsg += '<td>';
            bmsg += ':';
            bmsg += '</td>';
            bmsg += '<td>';
            bmsg += msgcode;
            bmsg += '</td>';
            bmsg += '</tr>';
          }
          bmsg += '<tr>';
          bmsg += '<td>';
          bmsg += 'Message';
          bmsg += '</td>';
          bmsg += '<td>';
          bmsg += ':';
          bmsg += '</td>';
          bmsg += '<td>';
          bmsg += Latam_Get_Result(errdecrip, '"message"');
          bmsg += '</td>';
          bmsg += '</tr>';
          var msgusev = Latam_Get_Result(errdecrip, '"userEvent"');
          if (msgusev != '' && msgusev != null && msgusev != undefined) {
            bmsg += '<tr>';
            bmsg += '<td>';
            bmsg += 'User Event:';
            bmsg += '</td>';
            bmsg += '<td>';
            bmsg += ':';
            bmsg += '</td>';
            bmsg += '<td>';
            bmsg += msgusev;
            bmsg += '</td>';
            bmsg += '</tr>';
          }
          bmsg += '</table>';
        } else {
          bmsg += errdecrip;
        }
        // Fin - Detallar el error producido
        bmsg += "</td>";
        bmsg += "</tr>";
        bmsg += "</table>";


        // Envio de email
        var subject = 'NS - Bundle Latinoamerica - User Error';
        var body = '<body text="#333333" link="#014684" vlink="#014684" alink="#014684">';
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
        body += 'Estimado(a) ' + empfir + ':<br>';
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
        body += '<p>Este es un mensaje de error automático de LatamReady SuiteApp.</p>';
        body += '<p>El detalle es el siguiente:</p>';
        body += bmsg;
        body += '<p>Por favor, comunícate con nuestro departamento de Servicio al Cliente a: customer.care@latamready.com</p>';
        body += '<p>Nosotros nos encargamos.</p>';
        body += '<p>Saludos,</p>';
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
        body += '<i>Este es un mensaje automático. Por favor, no responda este correo electrónico.</i>';
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
        var bcc = new Array();
        var cco = new Array();
        cco[0] = 'customer.voice@latamready.com';

        // Api de Netsuite para enviar correo electronico
        log.error(' [ sendemail : UserID ] ' + userid, LMRY_script);
        email.send({
          author: userid,
          recipients: empema,
          subject: subject,
          body: body,
          bcc: bcc,
          cco: cco
        });

      } catch (err) {
        log.error(' [ sendemail ] ' + err, LMRY_script);
      }
      return true;
    }

     /* ----------------------------------------------------------------------------------------------------
     * Extrae los valores obtenidos del arreglo
     * como se muestra a continuacion.
     * Ejemplo:
     * 			array[0]="Nombre Campo":"Valor"
     *  		field = "Nombre Campo"
     *  		strdata = array[0]
     * --------------------------------------------------------------------------------------------------- */
    function Latam_Get_Result(strdata, field) {
      var intpos = strdata.indexOf(field);
      var straux = strdata.substr(parseInt(intpos) + parseInt(field.length) + 1);
      var auxpos = straux.indexOf('",');
      var strcad = '';
      if (intpos > 0) {
        // Extrae la cadena hasta desde (",)
        straux = straux.substr(0, auxpos + 1);
        // Valida que el campo no de null
        if (straux == 'null' || straux == '') {
          return '';
        }
        return straux;
      }
    }


  

    return {

      getAuthorization: getAuthorization,
      sendemail: sendemail
    };
  });