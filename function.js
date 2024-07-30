


const runtime = {
  envType: "Production",
  version: "3.0",
  accountId: "TSV-6434412",
  executionContext:"View"
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

const transactionDetails = [
  {
      tranid: 'PAY12345',
      status: 'sent',
      message: 'successful mailing'
  },
  {
      tranid: 'PAY12346',
      status: 'not sent',
      message: 'The Withholding Certificate Number on the Voucher is empty.'
  },
  {
      tranid: 'PAY12347',
      status: 'not sent',
      message: 'No associated withholding vouchers were found for this payment.'
  },
  {
      tranid: 'PAY12348',
      status: 'sent',
      message: 'successful mailing'
  },
  {
      tranid: 'PAY12349',
      status: 'not sent',
      message: 'No folder has been found to save the withholding certificate. Please check the folder ID set in the Setup Tax Subsidiary record exists in the File Cabinet.'
  },
  {
      tranid: 'PAY12350',
      status: 'not sent',
      message: 'error de script'
  },
  {
      tranid: 'PAY12351',
      status: 'sent',
      message: 'successful mailing'
  },
  {
      tranid: 'PAY12352',
      status: 'not sent',
      message: 'The Withholding Certificate Number on the Voucher is empty.'
  },
  {
      tranid: 'PAY12353',
      status: 'not sent',
      message: 'No associated withholding vouchers were found for this payment.'
  },
  {
      tranid: 'PAY12354',
      status: 'sent',
      message: 'successful mailing'
  },
  {
      tranid: 'PAY12355',
      status: 'not sent',
      message: 'No folder has been found to save the withholding certificate. Please check the folder ID set in the Setup Tax Subsidiary record exists in the File Cabinet.'
  },
  {
      tranid: 'PAY12356',
      status: 'not sent',
      message: 'error de script'
  }
];

function messageBody(data) {
  const { transaction } = data[0];
  const { subsidiaryID, vendorName, userSubsidiary, userName } = transaction;
  const tranidList = data.map(value => value.transaction.tranid);

  const body = `

          <div style="color: #483838; margin-bottom: 2.5rem" class="container-body">
            <div style="text-align: center">
              <img src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81015&c=TSTDRV1930452&h=58hbjHzF0ZDtq-F905Nr-8LibSvzYGEq0aTFdlmqxQL-noK9" alt="" class="imgBanner" />
              <p style="font-size: 18px">
                  <strong>Dear: </strong>${userName}
              </p>
            </div>
            <p style="margin-bottom: 25px">
              This is an automatic error message from latamready suiteApp
            </p>
            <br/>
            <p style="font-weight: bold;">General details</p>
            <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                    Enviroment
                </p>
              <p style="margin: 0">${runtime.envType}</p>
            </div>
            <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                    Account ID
                </p>
                <p style="margin: 0">${runtime.accountId}</p>
            </div>
            <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                    Employee Subsidiary
                </p>
                <p style="margin: 0">${userSubsidiary}</p>
            </div>
            
            <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                    Netsuite Released Version
                </p>
                <p style="margin: 0">${runtime.version}</p>
            </div>
            <br/>
            <p style="font-weight: bold;">Vendor details</p>
            <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
                <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                    Proveedor name
                </p>
                <p style="margin: 0">${vendorName}</p>
            </div>
            <br/>
            <p style="font-weight: bold;">Payments</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem" role="presentation">
              <tbody style="line-height: 24px">
                <tr style="margin: 100px">
                  <td style="padding: 10px">Processed Payments</td>
                  <td style="padding: 10px; text-align: right">
                    <strong>${12}</strong>
                  </td>
                  </tr>
                    <tr style="background-color: #EBFBDF">
                      <td style="padding: 10px">Corrects</td>
                      <td style="text-align: right; padding: 10px">
                        <strong>${4}</strong>
                      </td>
                  </tr>
                    <tr style="background-color: #fef2f2">
                      <td style="padding: 10px">Incorrects</td>
                      <td style="text-align: right; padding: 10px">
                        <strong>${8}</strong>
                      </td>
                    </tr>
              </tbody>
            </table>
            <div class="scroll" style="overflow-x:auto; overflow-y: scroll; min-height: auto; max-height: 400px; margin-bottom: 2.5rem;">
                        <table style="width: 100%; font-size: 14px; text-align: left; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #fef2f2">
                                    <th style="padding: 10px">Order</th>
                                    <th style="padding: 10px">Payment</th>
                                    <th style="padding: 10px">Status</th>
                                    <th style="padding: 10px">Details status</th>
                                </tr>
                            </thead>
                            <tbody >
                              ${transactionDetails
                                .map((transaction, index) => {
                                    const textColor = transaction.status === 'sent' ? '#6ed613' : '#ff0000';
                                    return `<tr>
                                        <td style="padding: 10px; color: ${textColor}; font-weight: bold;">${index + 1}</td>
                                        <td style="padding: 10px; color: ${textColor}; font-weight: bold;">${transaction.tranid}</td>
                                        <td style="padding: 10px; color: ${textColor}; font-weight: bold;">${transaction.status}</td>
                                        <td style="padding: 10px; color: ${textColor}; font-weight: bold;">${transaction.message}</td>
                                    </tr>`;
                                })
                                .join("")}
                            </tbody>
                        </table>
                    </div>
          </div>`;

  return _emailTemplate(body);
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


const sendErrorEmail = () => {
  

  const bodyHtml = `
      <div style="color: #483838; margin-bottom: 2.5rem" class="container-body">
          <div style="text-align: center">
              <img src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81015&c=TSTDRV1930452&h=58hbjHzF0ZDtq-F905Nr-8LibSvzYGEq0aTFdlmqxQL-noK9" alt="" class="imgBanner" />
              <p style="font-size: 18px">
                  <strong>Dear: </strong>${"Giussepe Delgado"}
              </p>
          </div>
          <p style="margin-bottom: 25px">
              This is an automatic error message from latamready suiteApp
          </p>
          <div style="border-radius: 5px; border: 1px solid #dc2626; background-color: #fef2f2; padding: 16px; word-break: break-all;">
              <img style="vertical-align: top" src="https://tstdrv1930452.app.netsuite.com/core/media/media.nl?id=81020&c=TSTDRV1930452&h=u2vzMLH9PlIftiP1wRuyWW5Zu3P52HUM4vxLo9xXtYihtu6e" alt="" />
              <div style="width: 80%; display: inline-block; padding-left: 7px; color: #dc2626;">
                  <p style="margin: 0; margin-bottom: 5px; font-weight: bold">
                      Script: ${"paramScript"}
                  </p>
                  <p style="margin: 0">
                      ${"paramMessage"}
                  </p>
              </div>
          </div>
          <p>More details of the error</p>
          <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
              <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                  Date and hours
              </p>
              <p style="margin: 0">${new Date()}</p>
          </div>
          <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
              <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                  Enviroment
              </p>
              <p style="margin: 0">${runtime.envType}</p>
          </div>
          <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
              <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                  Account ID
              </p>
              <p style="margin: 0">${runtime.accountId}</p>
          </div>
          <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
              <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                  Employee Subsidiary
              </p>
              <p style="margin: 0">${"Parent Name"}</p>
          </div>
          <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
              <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                  Execution Context
              </p>
              <p style="margin: 0">${runtime.executionContext}</p>
          </div>
          <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
              <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                  SuiteApp ID
              </p>
              <p style="margin: 0">${"TSV-234234"}</p>
          </div>
          <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
              <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                  Script ID
              </p>
              <p style="margin: 0">${"function.js"}</p>
          </div>
          <div style="border-radius: 5px; border: 1px solid #64748b; background-color: #f8fafc; padding: 16px; color: #64748b; word-break: break-all; margin-bottom: 16px;">
              <p style="font-weight: bold; margin: 0; margin-bottom: 5px">
                  Netsuite Released Version
              </p>
              <p style="margin: 0">${runtime.version}</p>
          </div>
      </div>
  `;

  const emailContent = _emailTemplate(bodyHtml);

  return emailContent;

};
function insertHTML() {
  // Obtén el contenedor por su id
  const contentDiv = document.getElementById('content');

  // Inserta el HTML generado
  contentDiv.innerHTML = messageBody(data);
}

// Ejecuta la función para insertar el HTML
insertHTML();
