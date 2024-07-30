


const runtime = {
    envType: "Production",
    version: "3.0",
    accountId: "TSV-6434412"
  }
  
  const data = [
    {
      "code": "OK",
      "transaction": {
        "billPaymentID": "91762",
        "vendorID": "3831",
        "subsidiaryID": "15",
        "email": "giussepe@latamready.com",
        "userID": "3787",
        "tranid": "40",
        "vendorName": "LR STE Vendor AR -TEST 2",
        "userSubsidiary": "Parent Company",
        "userName": "Giussepe Delgado"
      },
      "certificate": {
        "id": 18,
        "pdfID": "555396"
      }
    },
    {
      "code": "OK",
      "transaction": {
        "billPaymentID": "91762",
        "vendorID": "3831",
        "subsidiaryID": "15",
        "email": "giussepe@latamready.com",
        "userID": "3787",
        "tranid": "41",
        "vendorName": "LR STE Vendor AR -TEST 2",
        "userSubsidiary": "Parent Company",
        "userName": "Giussepe Delgado"
      },
      "certificate": {
        "id": 18,
        "pdfID": "555396"
      }
    },
    {
      "code": "OK",
      "transaction": {
        "billPaymentID": "91762",
        "vendorID": "3831",
        "subsidiaryID": "15",
        "email": "giussepe@latamready.com",
        "userID": "3787",
        "tranid": "42",
        "vendorName": "LR STE Vendor AR -TEST 2",
        "userSubsidiary": "Parent Company",
        "userName": "Giussepe Delgado"
      },
      "certificate": {
        "id": 18,
        "pdfID": "555396"
      }
    },
    {
      "code": "OK",
      "transaction": {
        "billPaymentID": "91762",
        "vendorID": "3831",
        "subsidiaryID": "15",
        "email": "giussepe@latamready.com",
        "userID": "3787",
        "tranid": "45",
        "vendorName": "LR STE Vendor AR -TEST 2",
        "userSubsidiary": "Parent Company",
        "userName": "Giussepe Delgado"
      },
      "certificate": {
        "id": 18,
        "pdfID": "555396"
      }
    },
  ]
  function messageBody(data) {
    const { transaction } = data[0];
    const { subsidiaryID, vendorName, userSubsidiary, userName } = transaction;
    const tranidList = data.map(value => value.transaction.tranid);
  
    const body = `
      <body style="color: #333; font-family: Arial, sans-serif; background-color: #f0f0f0; margin: 0; padding: 20px;">
          <div style="max-width: 700px; margin: 0 auto; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <div style="width: 100%; height: 200px; background-image: url('https://system.na1.netsuite.com/core/media/media.nl?id=921&c=TSTDRV1038915&h=c493217843d184e7f054'); background-size: contain; background-position: center;">
              </div>
              <div style="padding: 20px; background-color: #d50303; color: #fff; text-align: center; margin-top: 1px">
                  <h1 style="margin: 0; font-size: 24px;">Estimado(a) ${"userName"}</h1>
              </div>
              <div style="padding: 20px; background-color: #fff;">
                  <p style="font-size: 16px;">Este es un mensaje automático de LatamReady SuiteApp.</p>
                  <div style="display: flex; flex-direction: column; gap: 10px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f9f9f9; padding: 10px; border: 1px solid #d50303;">
                          <span>Fecha y Hora</span>
                          <span>${new Date()}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #d50303;">
                          <span>Ambiente</span>
                          <span>${runtime.envType}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f9f9f9; padding: 10px; border: 1px solid #d50303;">
                          <span>NetSuite Version (Release)</span>
                          <span>${runtime.version}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #d50303;">
                          <span>Código Cliente (Company)</span>
                          <span>${runtime.accountId}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f9f9f9; padding: 10px; border: 1px solid #d50303;">
                          <span>Subsidiaria del Usuario (ID)</span>
                          <span>${userSubsidiary}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #d50303;">
                          <span>Nombre del Usuario (User)</span>
                          <span>${userName}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f9f9f9; padding: 10px; border: 1px solid #d50303;">
                          <span>Subsidiaria del Proveedor</span>
                          <span>${subsidiaryID}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #d50303;">
                          <span>Proveedor</span>
                          <span>${vendorName}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f9f9f9; padding: 10px; border: 1px solid #d50303;">
                          <span>Payments</span>
                          <span>${tranidList.join('<br>')}</span>
                      </div>
                  </div>
                  <p style="margin-top: 20px;">Saludos,</p>
                  <p>El Equipo de LatamReady</p>
              </div>
              <div style="padding: 20px; text-align: center; background-color: #e5e6e7; color: #333; font-size: 12px;">
                  <p style="margin: 0;"><i>Este es un mensaje automático. Por favor, no responda este correo electrónico.</i></p>
              </div>
              <div style="padding: 20px; text-align: center;">
                  <a href="http://www.latamready.com/" style="display: inline-block; margin: 15px 0;">
                      <img src="https://system.na1.netsuite.com/core/media/media.nl?id=926&c=TSTDRV1038915&h=e14f0c301f279780eb38" width="169" />
                  </a>
              </div>
              <div style="padding: 20px; text-align: center;">
                  <a href="https://www.linkedin.com/company/9207808" style="margin: 0 5px;">
                      <img src="https://system.na1.netsuite.com/core/media/media.nl?id=925&c=TSTDRV1038915&h=41ec53b63dba135488be" width="101"/>
                  </a>
                  <a href="https://www.facebook.com/LatamReady-337412836443120/" style="margin: 0 5px;">
                      <img src="https://system.na1.netsuite.com/core/media/media.nl?id=920&c=TSTDRV1038915&h=7fb4d03fff9283e55318" width="101"/>
                  </a>
                  <a href="https://twitter.com/LatamReady" style="margin: 0 5px;">
                      <img src="https://system.na1.netsuite.com/core/media/media.nl?id=929&c=TSTDRV1038915&h=300c376863035d25c42a" width="101"/>
                  </a>
              </div>
              <div style="padding: 0;">
                  <img src="https://system.na1.netsuite.com/core/media/media.nl?id=918&c=TSTDRV1038915&h=7f0198f888bdbb495497" width="100%" style="margin: 15px 0;"/>
              </div>
          </div>
      </body>`;
  
    return body;
  }
  
  const _emailTemplate = (paramBody) => {
    try {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                <link href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap" rel="stylesheet" />
                <style>
                    .container-body {
                        padding: 0 1.5rem;
                    }
            
                    .fontSize {
                        font-size: 16px;
                    }
            
                    .imgBanner {
                        width: 290px;
                        height: 234px;
                    }
            
                    .iconSocial {
                        width: 30px;
                        height: 30px;
                    }
            
                    @media screen and (max-width: 600px) {
                        .container-body {
                            padding: 0 10px;
                        }
            
                        .fontSize {
                            font-size: 14px;
                        }
            
                        .imgBanner {
                            width: 240px;
                            height: 184px;
                        }
            
                        .iconSocial {
                            width: 25px;
                            height: 25px;
                        }
                    }
                </style>
            </head>
            <body>
                <div style="border: 1px solid #fef3f3; border-radius: 10px; overflow: hidden; max-width: 700px; margin: auto; font-family: 'Montserrat', sans-serif;" class="fontSize">
                    <div>
                        <img width="100%" src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=921&c=TSTDRV1038915&h=c493217843d184e7f054" style="display: block" />
                        <div class="container-body" style="margin-top: 15px">
                            <table style="width: 100%">
                                <tbody>
                                    <tr>
                                        <td>
                                            <a style="border: 1px solid #d50303; color: #d50303; padding: 5px 10px; border-radius: 5px; text-decoration: none; font-weight: bold;" href="http://www.latamready.com/#contac" target="_blank">Contact us</a>
                                        </td>
                                        <td style="text-align: right">
                                            <a href="https://www.latamready.com/" target="_blank" style="text-decoration: none; margin-right: 5px">
                                                <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81019&c=TSTDRV1930452&h=cJ2X1VY4nFbUzf385R7F5olJqkVQM8nCil2SstjTV7tl7VP1" alt="" />
                                            </a>
                                            <a href="https://twitter.com/LatamReady" target="_blank" style="text-decoration: none; margin-right: 5px">
                                                <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81013&c=TSTDRV1930452&h=E96ec-7rY3GokgxHrdHLrJm-YrTH0Y_ZNfB5FetfrXV3bwQn" alt="" />
                                            </a>
                                            <a href="https://www.linkedin.com/company/9207808" target="_blank" style="text-decoration: none; margin-right: 5px">
                                                <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81012&c=TSTDRV1930452&h=vcrpc7uakujhp6v4PU71cM-SOccTb4XyWAGOqrf5FWcmTFGf" alt="" />
                                            </a>
                                            <a href="https://www.facebook.com/LatamReady-337412836443120/" target="_blank" style="text-decoration: none; margin-right: 5px">
                                                <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81010&c=TSTDRV1930452&h=7hfzz7JtKpfMxiYei9LFmIaBvSmKmolDe5EddHl7gfCXzsyx" alt="" />
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <!-- cuerpo -->
                    ${paramBody}
                    <!-- fin de cuerpo -->
                    <div>
                        <div style="margin-bottom: 16px; text-align: center">
                            <a href="https://www.latamready.com/" target="_blank" style="text-decoration: none; margin-right: 5px">
                                <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81019&c=TSTDRV1930452&h=cJ2X1VY4nFbUzf385R7F5olJqkVQM8nCil2SstjTV7tl7VP1" alt="" />
                            </a>
                            <a href="https://twitter.com/LatamReady" target="_blank" style="text-decoration: none; margin-right: 5px">
                                <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81013&c=TSTDRV1930452&h=E96ec-7rY3GokgxHrdHLrJm-YrTH0Y_ZNfB5FetfrXV3bwQn" alt="" />
                            </a>
                            <a href="https://www.linkedin.com/company/9207808" target="_blank" style="text-decoration: none; margin-right: 5px">
                                <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81012&c=TSTDRV1930452&h=vcrpc7uakujhp6v4PU71cM-SOccTb4XyWAGOqrf5FWcmTFGf" alt="" /></a>
                            <a href="https://www.facebook.com/LatamReady-337412836443120/" target="_blank" style="text-decoration: none; margin-right: 5px">
                                <img class="iconSocial" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81010&c=TSTDRV1930452&h=7hfzz7JtKpfMxiYei9LFmIaBvSmKmolDe5EddHl7gfCXzsyx" alt="" />
                            </a>
                        </div>
                        <img style="display: block" width="100%" src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=918&c=TSTDRV1038915&h=7f0198f888bdbb495497" alt="" />
                    </div>
                </div>
            </body>
            </html>
        `;
  
        return html;
    } catch (error) {
        nLog.error({ title: `[ ${LMRY_SCRIPT} : _emailTemplate ]`, details: error });
    }
  };
  
  
  
  function insertHTML() {
    // Obtén el contenedor por su id
    const contentDiv = document.getElementById('content');
  
    // Inserta el HTML generado
    contentDiv.innerHTML = messageBody(data);
  }
  
  // Ejecuta la función para insertar el HTML
  insertHTML();
  