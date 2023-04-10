/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_PE_Log_BillPayments_STLT.js  			      		||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Set 22 2017  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/error', 'N/redirect', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/email'],
  /**
   * @param {error} error
   * @param {redirect} redirect
   * @param {runtime} runtime
   * @param {search} search
   * @param {serverWidget} serverWidget
   */
  function(error, redirect, record, runtime, search, serverWidget, email) {
    // Nombre del Script
    var LMRY_script = "LatamReady - PE Payment Log STLT";
    //Nombre Script
    var nameScript = "LatamReady - PE Payment Log STLT";
    var LANGUAGE = '';
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
      try {
        LANGUAGE = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" });
        LANGUAGE = LANGUAGE.substring(0, 2);
        // Nombre del formulario
        var form = serverWidget.createForm({title: getText('title')});

        var myInlineHtml = form.addField({
          id: 'custpage_id_message',
          label: getText('titlemsg'),
          type: serverWidget.FieldType.INLINEHTML
        });
        myInlineHtml.layoutType = serverWidget.FieldLayoutType.OUTSIDEBELOW;
        myInlineHtml.updateBreakType({
          breakType: serverWidget.FieldBreakType.STARTCOL
        });

        var strhtml = "<html>";
        strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>";
        strhtml += "<tr>";
        strhtml += "</tr>";
        strhtml += "<tr>";
        strhtml += "<td class='text'>";
        strhtml += "<div style=\"color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">";
        strhtml += getText('alert3');
        strhtml += getText('alert1');
        strhtml += getText('alert2');
        strhtml += "</td>";
        strhtml += "</tr>";
        strhtml += "</table>";
        strhtml += "</html>";

        myInlineHtml.defaultValue = strhtml;


        // Currrent Script Options
        var scriptObj = runtime.getCurrentScript();
        // Varibales para el URL del Bill Payment
        var urlweb_NS = scriptObj.getParameter({
          name: 'custscript_lmry_netsuite_location'
        });

        // Sub lista log que contiene al registro personalizado LatamReady - WHT Payments log
        var SubTabla = form.addSublist({
          id: 'custpage_lst',
          type: serverWidget.SublistType.STATICLIST,
          label: getText('results')
        });
        // Boton refrescar
        SubTabla.addRefreshButton();

        // Estructura del Log
        SubTabla.addField({
          id: 'custpage_lst_id',
          label: getText('internalid'),
          type: serverWidget.FieldType.TEXT
        });
        SubTabla.addField({
          id: 'custpage_lst_sub',
          label: getText('subsidiary'),
          type: serverWidget.FieldType.TEXT
        });
        SubTabla.addField({
          id: 'custpage_lst_dat',
          label: getText('datecreated'),
          type: serverWidget.FieldType.TEXT
        });
        SubTabla.addField({
          id: 'custpage_lst_emp',
          label: getText('employee'),
          type: serverWidget.FieldType.TEXT
        });
        SubTabla.addField({
          id: 'custpage_lst_ven',
          label: getText('vendor'),
          type: serverWidget.FieldType.TEXT
        });
        SubTabla.addField({
          id: 'custpage_lst_tra',
          label: getText('payment'),
          type: serverWidget.FieldType.TEXT
        });
        SubTabla.addField({
          id: 'custpage_lst_sta',
          label: getText('status'),
          type: serverWidget.FieldType.TEXT
        });
        SubTabla.addField({
          id: 'custpage_lst_las',
          label: getText('lastmodified'),
          type: serverWidget.FieldType.TEXT
        });
        SubTabla.addField({
          id: 'custpage_lst_mas',
          label: getText('process'),
          type: serverWidget.FieldType.TEXT
        });

        // Busqueda del Log - LatamReady - WHT Payments log
        var Search_Log = search.load({
          id: 'customsearch_lmry_pe_payments_log'
        });
        var Result_Log = Search_Log.run().getRange({
          start: 0,
          end: 1000
        });

        if (Result_Log != null && Result_Log.length > 0) {

          for (var i = 0; i < Result_Log.length; i++) {

            searchresult = Result_Log[i];
            // para usar campos de tipo formula
            var colFields = Result_Log[i].columns;

            var lg_id = "" + searchresult.getValue({
              name: colFields[0]
            });
            if (lg_id != "") {
              SubTabla.setSublistValue({
                id: 'custpage_lst_id',
                line: i,
                value: lg_id
              });
            }

            var lg_sub = "" + searchresult.getText({
              name: colFields[1]
            });
            if (lg_sub != "") {
              SubTabla.setSublistValue({
                id: 'custpage_lst_sub',
                line: i,
                value: lg_sub
              });
            }

            var lg_dat = "" + searchresult.getValue({
              name: colFields[7]
            });
            if (lg_dat != "") {
              SubTabla.setSublistValue({
                id: 'custpage_lst_dat',
                line: i,
                value: lg_dat
              });
            }

            var lg_emp = "" + searchresult.getText({
              name: colFields[2]
            });
            if (lg_emp != "") {
              SubTabla.setSublistValue({
                id: 'custpage_lst_emp',
                line: i,
                value: lg_emp
              });
            }

            var lg_ven = "" + searchresult.getText({
              name: colFields[3]
            });
            if (lg_ven != "") {
              SubTabla.setSublistValue({
                id: 'custpage_lst_ven',
                line: i,
                value: lg_ven
              });
            }

            var lg_tra = "" + searchresult.getValue({
              name: colFields[4]
            });
            if (lg_tra != "") {
              // Asigna Valores
              var linktext = ' ';
              var url = ' ';
              if (urlweb_NS != '' && urlweb_NS != null) {
                url += 'https://' + urlweb_NS
                url += '/app/accounting/transactions';
                url += '/transaction.nl';
                url += '?id=' + lg_tra;
                if (url != null && url != '') {
                  linktext = '<a target="_blank" href="' + url + '">' + searchresult.getText({
                    name: colFields[4]
                  }); + '</a>';
                }
                SubTabla.setSublistValue({
                  id: 'custpage_lst_tra',
                  line: i,
                  value: linktext
                });
              }
            }

            var lg_sta = "" + searchresult.getValue({
              name: colFields[5]
            });
            if (lg_sta != "") {
              SubTabla.setSublistValue({
                id: 'custpage_lst_sta',
                line: i,
                value: lg_sta
              });
            }

            var lg_las = "" + searchresult.getValue({
              name: colFields[8]
            });
            if (lg_las != "") {
              SubTabla.setSublistValue({
                id: 'custpage_lst_las',
                line: i,
                value: lg_las
              });
            }

            var lg_mas = '' + searchresult.getValue({
              name: colFields[9]
            });
            if (lg_mas != '') {
              SubTabla.setSublistValue({
                id: 'custpage_lst_mas',
                line: i,
                value: 'Massive'
              });
            } else {
              SubTabla.setSublistValue({
                id: 'custpage_lst_mas',
                line: i,
                value: 'Individual'
              });
            }
          }
        }



        // Dibuja el Formulario
        context.response.writePage(form);
      } catch (err) {

        var form = serverWidget.createForm({label: getText('title')});
        var myInlineHtml = form.addField({
          id: 'custpage_id_message',
          label: getText('titlemsg'),
          type: serverWidget.FieldType.INLINEHTML
        });
        myInlineHtml.layoutType = serverWidget.FieldLayoutType.OUTSIDEBELOW;
        myInlineHtml.updateBreakType({
          breakType: serverWidget.FieldBreakType.STARTCOL
        });

        var strhtml = "<html>";
        strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
          "<tr>" +
          "</tr>" +
          "<tr>" +
          "<td class='text'>" +
          "<div style=\"color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">"+getText('alert') +
          "</td>" +
          "</tr>" +
          "</table>" +
          "</html>";

        myInlineHtml.defaultValue = strhtml;

        // Dibuja el Formulario
        context.response.writePage(form);
        log.error({
          title: 'Se generó un error en suitelet',
          details: err
        });

        // Envio de mail al clientes
        sendMail(LMRY_script, ' [ onRequest ] ' + err);
      }

      /**************************************************************
       * Funcion para enviar correo en el caso que se presente
       * un error en el script.
       *********************************************************** */
      function sendMail(namescript, errdecrip) {
        /* Formato de las columnas de la tabla */
        var colStyl = 'style=\"text-align: center; font-size: 9pt; font-weight:bold; color:white; background-color:#d50303; border: 1px solid #d50303; ';
        var rowStyl = 'style=\"text-align: Left;   font-size: 9pt; font-weight:bold; border: 1px solid #d50303; ';
        var errStyl = 'style=\"text-align: Left;   font-size: 9pt; font-weight:bold; color:red;border: 1px solid #d50303; ';

        var width_td1 = " width:40%;\">";
        var width_td2 = " width:60%;\">";

        // ID del usuario a consultar
        var user_emp = runtime.getCurrentUser().id;;
        // Datos del empleado
        var recEmp = search.lookupFields({
          type: search.Type.EMPLOYEE,
          id: user_emp,
          columns: ['firstname', 'email']
        });
        // Datos del Usuario
        var nameUser = recEmp.firstname;
        var emailUser = recEmp.email;

        var empfir = recEmp.firstname;

        log.error("nameUser - emailUser", nameUser + " - " + emailUser);

        // Datos de la Empresa
        var namevers = runtime.version;
        var namecomp = runtime.accountId;
        var nametype = 'Suite Script SuiteLet';
        var namerdid = '-none-';
        // Datos del Usuario
        var userObj = runtime.getCurrentUser();
        var nameuser = userObj.name;
        var namerole = userObj.roleId;
        var nameroce = userObj.roleCenter;
        var namesubs = userObj.subsidiary;
        var datetime = new Date();

        var bmsg = '';
        bmsg += "<table style=\"font-family: Courier New, Courier, monospace; width:580px; border: 1px solid #d50303;\">";
        bmsg += "<tr>";
        bmsg += "<td " + colStyl + width_td1 + "Descripcion </td>";
        bmsg += "<td " + colStyl + width_td2 + "Detalle </td>";
        bmsg += "</tr>";
        bmsg += "<tr>";
        bmsg += "<td " + rowStyl + width_td1;
        bmsg += "Fecha y Hora";
        bmsg += "</td>";
        bmsg += "<td " + rowStyl + width_td2;
        bmsg += datetime;
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
        bmsg += "<tr>";
        bmsg += "<td " + rowStyl + width_td1;
        bmsg += 'Script ' + namescript + '';
        bmsg += "</td>";
        bmsg += "<td " + errStyl + width_td2;
        bmsg += '<strong>' + errdecrip + '</strong>';
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

        // Correos
        var bcc = new Array();
        var cco = new Array();
        cco[0] = 'customer.voice@latamready.com';

        // Envio de mail
        email.send({
          author: user_emp,
          recipients: emailUser,
          bcc: cco,
          subject: subject,
          body: body
        });

        log.error("email - cco", cco);
      }

    }

    var TEXT_BY_LANG = {
        'title': { 'en': 'LatamReady - PE Payment Log', 'es': 'LatamReady - PE Registro de Pago', 'pt': 'LatamReady - PE Registro de Pagamento' },
        'results': { 'en': 'Results', 'es': 'Resutados', 'pt': 'Resutados' },
        'titlemsg': { 'en': 'Message', 'es': 'Mensaje', 'pt': 'Mensagem' },
        'submit': { 'en': 'Void Process', 'es': 'Proceso de Anulación', 'pt': 'Processo de Anulação' },
        'internalid': { 'en': 'Internal ID', 'es': 'ID Interno', 'pt': 'ID Interna'  },
        'subsidiary': { 'en': 'Subsidiary', 'es': 'Subsidiaria', 'pt': 'Subsidiária' },
        'datecreated': { 'en': 'Date Created', 'es': 'Fecha de Creación', 'pt': 'Data de Criação' },
        'employee': { 'en': 'Employee', 'es': 'Empleado', 'pt': 'Empregado' },
        'vendor': { 'en': 'Vendor', 'es': 'Proveedor', 'pt': 'Fornecedor' },
        'payment': { 'en': 'Payment', 'es': 'Pago', 'pt': 'Pagamento' },
        'status': { 'en': 'Status', 'es': 'Estado', 'pt': 'Estado' },
        'lastmodified': { 'en': 'Last Modified', 'es': 'Última Modificación', 'pt': 'Última Modificação' },
        'process': { 'en': 'Process', 'es': 'Proceso', 'pt': 'Processar' },
        'alert': {
            'en': "Important: Access is not allowed.</div>",
            'es': "Importante: El acceso no está permitido.</div>",
            'pt': "Importante: O acesso não é permitido.</div>"
        },
        'alert1': {
            'en': "The [STATUS] column indicates the status of the process.<br><br>",
            'es': "La columna [ESTADO] indica el estado del proceso.<br><br>",
            'pt': "A coluna [ESTADO] indica o estado do processo.<br><br>"
        },
        'alert2': {
            'en': "Press the refresh button to see if the process finished.</div>",
            'es': "Presionar el boton Actualizar para ver si el proceso terminó.</div>",
            'pt': "Pressione o botão de atualização para ver se o processo terminou.</div>"
        },
        'alert3': {
            'en': " Note: The payment is being generated. ",
            'es': "	Nota: Se está generando el pago. ",
            'pt': " Nota: O pagamento está sendo gerado. "
        }
    }

    function getText(key) {
        if (TEXT_BY_LANG[key]) {
            return TEXT_BY_LANG[key][LANGUAGE] || TEXT_BY_LANG[key]['en'];
        }
        return '';
    }

    return {
      onRequest: onRequest
    };


  });
