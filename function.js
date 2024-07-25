const messageBody = (subsidiary, nombreVendor, subsidiaryUser, payments) => {
    const searchEmployee = search.lookupFields({ type: 'employee', id: user, columns: ['entityid'] }).entityid;

    const searchPayments = search.create({
        type: 'vendorpayment',
        columns: ['internalid', 'tranid'],
        filters: [
            { name: 'internalid', operator: 'anyof', values: payments },
            { name: 'mainline', operator: 'is', values: 'T' }
        ]
    });
    const resultPayments = searchPayments.run().getRange({ start: 0, end: 1000 });

    const arrayTranid = resultPayments && resultPayments.length > 0
        ? resultPayments.map(payment => payment.getValue('tranid'))
        : [];

    const currentDate = new Date();
    const colStyl = 'style="text-align: center; font-size: 9pt; font-weight: bold; color: white; background-color: #d50303; border: 1px solid #d50303;"';
    const rowStyl = 'style="text-align: left; font-size: 9pt; font-weight: bold; border: 1px solid #d50303;"';

    const body = `
      <body text="#333333" link="#014684" vlink="#014684" alink="#014684">
        <table width="642" border="0" align="center" cellpadding="0" cellspacing="0">
          <tr>
            <td width="100%" valign="top">
              <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="100%" colspan="2">
                    <img style="display: block;" src="https://system.na1.netsuite.com/core/media/media.nl?id=921&c=TSTDRV1038915&h=c493217843d184e7f054" width="645" alt="main banner"/>
                  </td>
                </tr>
              </table>
              <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">
                <tr>
                  <td bgcolor="#d50303" width="15%">&nbsp;</td>
                  <td bgcolor="#d50303" width="85%">
                    <font style="color:#FFFFFF; line-height:130%; font-family:Arial, Helvetica, sans-serif; font-size:19px">
                      Estimado(a) ${searchEmployee}:<br>
                    </font>
                  </td>
                </tr>
                <tr>
                  <td width="100%" bgcolor="#d50303" colspan="2" align="right">
                    <a href="http://www.latamready.com/#contac">
                      <img src="https://system.na1.netsuite.com/core/media/media.nl?id=923&c=TSTDRV1038915&h=3c7406d759735a1e791d" width="94" style="margin-right:45px" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td width="100%" bgcolor="#FFF" colspan="2" align="right">
                    <a href="https://www.linkedin.com/company/9207808">
                      <img src="https://system.na1.netsuite.com/core/media/media.nl?id=924&c=TSTDRV1038915&h=c135e74bcb8d5e1ac356" width="15" style="margin:5px 1px 5px 0px" />
                    </a>
                    <a href="https://www.facebook.com/LatamReady-337412836443120/">
                      <img src="https://system.na1.netsuite.com/core/media/media.nl?id=919&c=TSTDRV1038915&h=9c937774d04fb76747f7" width="15" style="margin:5px 1px 5px 0px" />
                    </a>
                    <a href="https://twitter.com/LatamReady">
                      <img src="https://system.na1.netsuite.com/core/media/media.nl?id=928&c=TSTDRV1038915&h=fc69b39a8e7210c65984" width="15" style="margin:5px 47px 5px 0px" />
                    </a>
                  </td>
                </tr>
              </table>
              <p>Este es un mensaje automático de LatamReady SuiteApp.</p>
              <table style="font-family: Courier New, Courier, monospace; width:95%; border: 1px solid #d50303;">
                <tr>
                  <td ${colStyl} width="50%;">Descripción</td>
                  <td ${colStyl} width="50%;">Detalle</td>
                </tr>
                <tr>
                  <td ${rowStyl} width="50%;">Fecha y Hora</td>
                  <td ${rowStyl} width="50%;">${currentDate}</td>
                </tr>
                <tr>
                  <td ${rowStyl} width="50%;">Ambiente</td>
                  <td ${rowStyl} width="50%;">${runtime.envType}</td>
                </tr>
                <tr>
                  <td ${rowStyl} width="50%;">NetSuite Version (Release)</td>
                  <td ${rowStyl} width="50%;">${runtime.version}</td>
                </tr>
                <tr>
                  <td ${rowStyl} width="50%;">Codigo Cliente (Company)</td>
                  <td ${rowStyl} width="50%;">${runtime.accountId}</td>
                </tr>
                <tr>
                  <td ${rowStyl} width="50%;">Subsidiaria del Usuario (ID)</td>
                  <td ${rowStyl} width="50%;">${subsidiaryUser}</td>
                </tr>
                <tr>
                  <td ${rowStyl} width="50%;">Nombre del Usuario (User)</td>
                  <td ${rowStyl} width="50%;">${searchEmployee}</td>
                </tr>
                <tr>
                  <td ${rowStyl} width="50%;">Subsidiaria del Proveedor</td>
                  <td ${rowStyl} width="50%;">${subsidiary}</td>
                </tr>
                <tr>
                  <td ${rowStyl} width="50%;">Proveedor</td>
                  <td ${rowStyl} width="50%;">${nombreVendor}</td>
                </tr>
                <tr>
                  <td ${rowStyl} width="50%;">Payments</td>
                  <td ${rowStyl} width="50%;">${arrayTranid.join('<br>')}</td>
                </tr>
              </table>
              <br>
              <p>Saludos,</p>
              <p>El Equipo de LatamReady</p>
              <table width="100%" border="0" cellspacing="0" cellpadding="2" bgcolor="#e5e6e7">
                <tr>
                  <td>&nbsp;</td>
                </tr>
                <tr>
                  <td width="15%">&nbsp;</td>
                  <td width="70%" align="center">
                    <font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:12px;">
                      <i>Este es un mensaje automático. Por favor, no responda este correo electrónico.</i>
                    </font>
                  </td>
                  <td width="15%">&nbsp;</td>
                </tr>
                <tr>
                  <td>&nbsp;</td>
                </tr>
              </table>
              <table width="100%" border="0" cellspacing="0" cellpadding="2">
                <tr>
                  <td width="15%">&nbsp;</td>
                  <td width="70%" align="center">
                    <a href="http://www.latamready.com/">
                      <img src="https://system.na1.netsuite.com/core/media/media.nl?id=926&c=TSTDRV1038915&h=e14f0c301f279780eb38" width="169" style="margin:15px 0px 15px 0px" />
                    </a>
                  </td>
                  <td width="15%">&nbsp;</td>
                </tr>
              </table>
              <table width="100%" border="0" cellspacing="0" cellpadding="2">
                <tr>
                  <td width="15%">&nbsp;</td>
                  <td width="70%" align="center">
                    <a href="https://www.linkedin.com/company/9207808">
                      <img src="https://system.na1.netsuite.com/core/media/media.nl?id=925&c=TSTDRV1038915&h=41ec53b63dba135488be" width="101" style="margin:0px 5px 0px 5px" />
                    </a>
                    <a href="https://www.facebook.com/LatamReady-337412836443120/">
                      <img src="https://system.na1.netsuite.com/core/media/media.nl?id=920&c=TSTDRV1038915&h=7fb4d03fff9283e55318" width="101" style="margin:0px 5
                    <a href="https://twitter.com/LatamReady">
                        <img src="https://system.na1.netsuite.com/core/media/media.nl?id=929&c=TSTDRV1038915&h=300c376863035d25c42a" width="101" style="margin:0px 5px 0px 5px" />
                    </a>
                    </td>
                    <td width="15%">&nbsp;</td>
                </tr>
                </table>
                <table width="100%" border="0" cellspacing="0">
                <tr>
                    <td>
                    <img src="https://system.na1.netsuite.com/core/media/media.nl?id=918&c=TSTDRV1038915&h=7f0198f888bdbb495497" width="642" style="margin:15px 0px 15px 0px" />
                    </td>
                </tr>
                </table>
            </td>
            </tr>
        </table>
        </body>
    `;

    return body;
}