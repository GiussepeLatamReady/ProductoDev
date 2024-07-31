
const fs = require('fs');
const path = require('path');
const { executeDelete } = require('./delete');
const data = {
    "name": "LR AR Send Email",
    "id": "custcollection_lmry_ste_ar_send_email",
    "collections": {
        "source": {
            "AR_VALIDATE_VALUES": "Enter a value for:",
            "AR_PROCESS_ACTIVATE": "Please wait a moment, the process is in progress.",
            "AR_FILTER_TRANSACTIONS": "No Filtered Transactions",
            "AR_SELECTED_TRANSACTIONS": "No Selected Transactions",
            "AR_ALERT": "Alert",
            "AR_VALIDATE_PERIODS": "Initial period can't be bigger than final period",
            "AR_DEAR": "Dear",
            "AR_MSG_SUITEAPP": "This is an automatic message from latamready suiteApp.",
            "AR_ENVIROMENT": "Environment",
            "AR_ACCOUNT_ID": "Account ID",
            "AR_E_SUBSIDIARY": "Subsidiary of the employee",
            "AR_VERSION": "Versión Netsuite",
            "AR_VENDOR_DETAILS": "Vendor details",
            "AR_VENDOR_NAME": "Vendor name",
            "AR_PROCESS_PAYMENTS": "Processed Payments",
            "AR_CORRECTS": "Corrects",
            "AR_INCORRECT": "Incorrect",
            "AR_PAYMENT": "Bill Payment",
            "AR_ORDER": "Order",
            "AR_STATUS": "Status",
            "AR_STATUS_DETAILS": "Status details",
            "AR_NOTE": "Note: The payment is being generated and journal entries are being created. The [STATUS] column indicates the process state.",
            "AR_MESSAGE_UPDATE": "Press the Update or Refresh button to see if the process has finished.",
            "AR_TITLE_STLT": "AR Wht Send Email Log",
            "AR_BACK_TO_MAIN": "Back to Main Page",
            "AR_RESULTS_LABEL": "Results",
            "AR_INTERNAL_ID_LABEL": "Internal Id",
            "AR_CREATION_DATE_LABEL": "Creation Date",
            "AR_CREATED_BY_LABEL": "Created By",
            "AR_VENDOR": "Vendor",
            "AR_DETAILS": "Details",
            "AR_MESSAGE": "Message",
            "AR_MESSAGE_LICENSE": "NOTICE: Currently the license for this module is expired, please contact the LatamReady sales team.",
            "AR_MESSAGE_CONTACT": "You can also contact us through",
            "AR_PRIMARY_INFO": "Primary information",
            "AR_SUBSIDIARY": "Subsidiary",
            "AR_FILTER": "Filter",
            "AR_SEND": "Send",
            "AR_BACK": "Back",
            "AR_RESTART": "Restart",
            "AR_APPLY": "Apply",
            "AR_DOCUMENT_NUMBER": "Document Number",
            "AR_SELECT_ALL": "Select all",
            "AR_DESELECT_ALL": "Deselect all",
            "AR_VIEW_LOG": "View Log",
            "AR_PERIOD_START": "Date From:",
            "AR_PERIOD_END": "Date To:",
            "AR_VIEW_SENT": "View Sent",
            "AR_EMAIL": "EMAIL",
            "AR_SENT": "Sent",
            "AR_WITHOUT_EMAIL": "Without Email",
            "AR_WITH_EMAIL": "With Email",
            "AR_PAYMENTS": "Bill Payments",
            "AR_NUMBER": "Position",
            "AR_BILLPAYMENT": "Bill Payment",
            "AR_PROCESING": "Processing",
            "AR_REFRESH": "Refresh",
            "AR_CERTIFICATE": "Certificate",
            "AR_SENT_STATUS": "Mailing status",
            "AR_NOT_SENT": "Not Sent"
        },
        "es": {
            "AR_VALIDATE_VALUES": "Ingrese un valor para:",
            "AR_PROCESS_ACTIVATE": "Espere un momento por favor, el proceso se encuentra en curso.",
            "AR_FILTER_TRANSACTIONS": "No hay transacciones Filtradas",
            "AR_SELECTED_TRANSACTIONS": "No hay transacciones Seleccionadas",
            "AR_ALERT": "Alerta",
            "AR_VALIDATE_PERIODS": "El período inicial no puede ser mayor que el período final",
            "AR_DEAR": "Estimado",
            "AR_MSG_SUITEAPP": "Este es un mensaje automático de latamready suiteApp.",
            "AR_ENVIROMENT": "Ambiente",
            "AR_ACCOUNT_ID": "Id de la cuenta",
            "AR_E_SUBSIDIARY": "Subsidiaria del empleado",
            "AR_VERSION": "Netsuite Released Version",
            "AR_VENDOR_DETAILS": "Detalles del proveedor",
            "AR_VENDOR_NAME": "Nombre del proveedor",
            "AR_PAYMENT": "Pago",
            "AR_PROCESS_PAYMENTS": "Pagos procesados",
            "AR_CORRECTS": "Correctos",
            "AR_INCORRECT": "Incorrectos",
            "AR_ORDER": "Orden",
            "AR_STATUS": "Estado",
            "AR_STATUS_DETAILS": "Detalle del estado",
            "AR_NOTE": "Nota: Se está generando el pago y la creación de asientos diarios. La columna [ESTADO] indica el estado del proceso.",
            "AR_MESSAGE_UPDATE": "Presione el botón Actualizar o Refresh para ver si el proceso terminó.",
            "AR_TITLE_STLT": "AR Envio de certificados de retenciones - Registro",
            "AR_BACK_TO_MAIN": "Volver a la página principal",
            "AR_RESULTS_LABEL": "Resultados",
            "AR_INTERNAL_ID_LABEL": "Id interno",
            "AR_CREATION_DATE_LABEL": "Fecha de Creación",
            "AR_CREATED_BY_LABEL": "Creado por",
            "AR_VENDOR": "Proveedor",
            "AR_DETAILS": "Detalles",
            "AR_MESSAGE": "Mensaje",
            "AR_MESSAGE_LICENSE": "AVISO: Actualmente la licencia para este módulo está vencida, por favor contacte al equipo comercial de LatamReady.",
            "AR_MESSAGE_CONTACT": "También puedes contactar con nosotros a",
            "AR_PRIMARY_INFO": "Información primaria",
            "AR_SUBSIDIARY": "Subsidiaria",
            "AR_FILTER": "Filtrar",
            "AR_SEND": "Enviar",
            "AR_BACK": "Atrás",
            "AR_RESTART": "Reiniciar",
            "AR_APPLY": "Aplicar",
            "AR_DOCUMENT_NUMBER": "Número de Documento",
            "AR_SELECT_ALL": "Seleccionar todo",
            "AR_DESELECT_ALL": "Deseleccionar todo",
            "AR_VIEW_LOG": "Ver registro",
            "AR_PERIOD_START": "Fecha desde:",
            "AR_PERIOD_END": "Fecha hasta:",
            "AR_VIEW_SENT": "Mostrar enviados",
            "AR_EMAIL": "CORREO",
            "AR_SENT": "Enviado",
            "AR_WITHOUT_EMAIL": "Sin Correo",
            "AR_WITH_EMAIL": "Con correo",
            "AR_PAYMENTS": "Pagos",
            "AR_NUMBER": "Posición",
            "AR_BILLPAYMENT": "Pago",
            "AR_PROCESING": "Procesando",
            "AR_REFRESH": "Actualizar Página",
            "AR_CERTIFICATE": "Certificado",
            "AR_SENT_STATUS": "Estado de envío",
            "AR_NOT_SENT": "No enviado"
        },
        "en": {
            "AR_VALIDATE_VALUES": "Enter a value for:",
            "AR_PROCESS_ACTIVATE": "Please wait a moment, the process is in progress.",
            "AR_FILTER_TRANSACTIONS": "No Filtered Transactions",
            "AR_SELECTED_TRANSACTIONS": "No Selected Transactions",
            "AR_ALERT": "Alert",
            "AR_VALIDATE_PERIODS": "Initial period can't be bigger than final period",
            "AR_DEAR": "Dear",
            "AR_MSG_SUITEAPP": "This is an automatic message from latamready suiteApp.",
            "AR_ENVIROMENT": "Environment",
            "AR_ACCOUNT_ID": "Account ID",
            "AR_E_SUBSIDIARY": "Subsidiary of the employee",
            "AR_VERSION": "Versión Netsuite",
            "AR_VENDOR_DETAILS": "Vendor details",
            "AR_VENDOR_NAME": "Vendor name",
            "AR_PROCESS_PAYMENTS": "Processed Payments",
            "AR_CORRECTS": "Corrects",
            "AR_INCORRECT": "Incorrect",
            "AR_PAYMENT": "Bill Payment",
            "AR_ORDER": "Order",
            "AR_STATUS": "Status",
            "AR_STATUS_DETAILS": "Status details",
            "AR_NOTE": "Note: The payment is being generated and journal entries are being created. The [STATUS] column indicates the process state.",
            "AR_MESSAGE_UPDATE": "Press the Update or Refresh button to see if the process has finished.",
            "AR_TITLE_STLT": "AR Wht Send Email Log",
            "AR_BACK_TO_MAIN": "Back to Main Page",
            "AR_RESULTS_LABEL": "Results",
            "AR_INTERNAL_ID_LABEL": "Internal Id",
            "AR_CREATION_DATE_LABEL": "Creation Date",
            "AR_CREATED_BY_LABEL": "Created By",
            "AR_VENDOR": "Vendor",
            "AR_DETAILS": "Details",
            "AR_MESSAGE": "Message",
            "AR_MESSAGE_LICENSE": "NOTICE: Currently the license for this module is expired, please contact the LatamReady sales team.",
            "AR_MESSAGE_CONTACT": "You can also contact us through",
            "AR_PRIMARY_INFO": "Primary information",
            "AR_SUBSIDIARY": "Subsidiary",
            "AR_FILTER": "Filter",
            "AR_SEND": "Send",
            "AR_BACK": "Back",
            "AR_RESTART": "Restart",
            "AR_APPLY": "Apply",
            "AR_DOCUMENT_NUMBER": "Document Number",
            "AR_SELECT_ALL": "Select all",
            "AR_DESELECT_ALL": "Deselect all",
            "AR_VIEW_LOG": "View Log",
            "AR_PERIOD_START": "Date From:",
            "AR_PERIOD_END": "Date To:",
            "AR_VIEW_SENT": "View Sent",
            "AR_EMAIL": "EMAIL",
            "AR_SENT": "Sent",
            "AR_WITHOUT_EMAIL": "Without Email",
            "AR_WITH_EMAIL": "With Email",
            "AR_PAYMENTS": "Bill Payments",
            "AR_NUMBER": "Position",
            "AR_BILLPAYMENT": "Bill Payment",
            "AR_PROCESING": "Processing",
            "AR_REFRESH": "Refresh",
            "AR_CERTIFICATE": "Certificate",
            "AR_SENT_STATUS": "Mailing status",
            "AR_NOT_SENT": "Not Sent"
        },
        "pt": {
            "AR_VALIDATE_VALUES": "Digite um valor para:",
            "AR_PROCESS_ACTIVATE": "Por favor, aguarde um momento, o processo está em andamento.",
            "AR_FILTER_TRANSACTIONS": "Nenhuma transação filtrada",
            "AR_SELECTED_TRANSACTIONS": "Nenhuma transação selecionada",
            "AR_ALERT": "Alerta",
            "AR_VALIDATE_PERIODS": "O período inicial não pode ser maior que o período final",
            "AR_DEAR": "Caro",
            "AR_MSG_SUITEAPP": "Esta é uma mensagem automática do LatamReady SuiteApp.",
            "AR_ENVIROMENT": "Ambiente",
            "AR_ACCOUNT_ID": "ID da conta",
            "AR_E_SUBSIDIARY": "Subsidiária do empregado",
            "AR_VERSION": "Versão Netsuite lançada",
            "AR_VENDOR_DETAILS": "Detalhes do fornecedor",
            "AR_VENDOR_NAME": "Nome do fornecedor",
            "AR_PAYMENT": "Pagamento",
            "AR_PROCESS_PAYMENTS": "Pagamentos processados",
            "AR_CORRECTS": "Corretos",
            "AR_INCORRECT": "Incorretos",
            "AR_ORDER": "Ordem",
            "AR_STATUS": "Status",
            "AR_STATUS_DETAILS": "Detalhes do status",
            "AR_NOTE": "Nota: O pagamento está sendo gerado e as entradas do diário estão sendo criadas. A coluna [STATUS] indica o estado do processo.",
            "AR_MESSAGE_UPDATE": "Pressione o botão Atualizar ou Refresh para ver se o processo terminou.",
            "AR_TITLE_STLT": "AR Envio de certificados de retenções - Registro",
            "AR_BACK_TO_MAIN": "Voltar à página principal",
            "AR_RESULTS_LABEL": "Resultados",
            "AR_INTERNAL_ID_LABEL": "ID interno",
            "AR_CREATION_DATE_LABEL": "Data de criação",
            "AR_CREATED_BY_LABEL": "Criado por",
            "AR_DETAILS": "Detalhes",
            "AR_MESSAGE": "Mensagem",
            "AR_MESSAGE_LICENSE": "AVISO: Atualmente a licença para este módulo está expirada, por favor contate a equipe de vendas da LatamReady.",
            "AR_MESSAGE_CONTACT": "Você também pode nos contatar através de",
            "AR_PRIMARY_INFO": "Informações primárias",
            "AR_FILTER": "Filtrar",
            "AR_SEND": "Enviar",
            "AR_BACK": "Voltar",
            "AR_RESTART": "Reiniciar",
            "AR_APPLY": "Aplicar",
            "AR_DOCUMENT_NUMBER": "Número do documento",
            "AR_SELECT_ALL": "Selecionar tudo",
            "AR_DESELECT_ALL": "Desmarcar tudo",
            "AR_VIEW_LOG": "Ver registro",
            "AR_PERIOD_START": "Data inicial:",
            "AR_PERIOD_END": "Data final:",
            "AR_VIEW_SENT": "Ver enviados",
            "AR_EMAIL": "EMAIL",
            "AR_SENT": "Enviado",
            "AR_WITHOUT_EMAIL": "Sem email",
            "AR_WITH_EMAIL": "Com email",
            "AR_PAYMENTS": "Pagamentos",
            "AR_NUMBER": "Posição",
            "AR_BILLPAYMENT": "Pagamento",
            "AR_PROCESING": "Processando",
            "AR_REFRESH": "Atualizar página",
            "AR_CERTIFICATE": "Certificado",
            "AR_SENT_STATUS": "Status de envio",
            "AR_NOT_SENT": "Não enviado"
        }
    },
    "files": {
        "xml": "custcollection_lmry_ste_ar_send_email.xml",
        "xlf": {
            "es": [
                "custcollection_lmry_ste_ar_send_email_en_es_AR.xlf",
                "custcollection_lmry_ste_ar_send_email_en_es_ES.xlf"
            ],
            "en": [
                "custcollection_lmry_ste_ar_send_email_en_en_GB.xlf",
                "custcollection_lmry_ste_ar_send_email_en_en_US.xlf"
            ],
            "pt": ["custcollection_lmry_ste_ar_send_email_en_pt_BR.xlf"]
        }
    },
    "target-language": {
        "es_AR": "es-AR",
        "es_ES": "es-ES",
        "en_GB": "en-GB",
        "en_US": "en-US",
        "pt_BR": "pt-BR"
    }
};

const generateXMLContent = (data) => {
    let strings = '';
    for (let key in data.collections.source) {
        const scriptId = key.toLowerCase();
        strings += `
    <string scriptid="${scriptId}">
      <defaulttranslation>${data.collections.source[key]}</defaulttranslation>
    </string>`;
    }

    return `<translationcollection scriptid="${data.id}">
  <defaultlanguage>en</defaultlanguage>
  <name>${data.name}</name>
  <strings>${strings}
  </strings>
</translationcollection>`;
};

const generateXLFContent = (data, targetLang, collection) => {
    let body = '';
    for (let key in collection) {
        const scriptId = key.toUpperCase();
        body += `        <trans-unit id="${scriptId}">
          <source>${data.collections.source[key]}</source>
          <target>${collection[key]}</target>
        </trans-unit>\n`;
    }

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xliff xmlns:ns="netsuite" xmlns:ns3="urn:oasis:names:tc:xliff:document:1.2" version="1.2">
  <file original="netsuite-database" source-language="en" datatype="database" target-language="${targetLang}">
    <body>
      <group ns:collection="${data.id}">
${body}      </group>
    </body>
  </file>
</xliff>`;
};




const saveFile = (filename, content) => {
    fs.writeFileSync(path.join(__dirname, filename), content, 'utf8');
};

const generateTranslationFiles = (data) => {
    // Generar archivo XML principal
    const xmlContent = generateXMLContent(data);
    saveFile(data.files.xml, xmlContent);
    console.log(`File ${data.files.xml} created successfully.`);

    // Generar archivos XLF para cada idioma
    for (let lang in data.collections) {
        if (lang !== 'source') {
            const collection = data.collections[lang];
            const filenames = data.files.xlf[lang];
            filenames.forEach(filename => {
                const langCode = filename.split('.')[0].slice(-5);
                const targetLang = data['target-language'][langCode];
                const xlfContent = generateXLFContent(data, targetLang, collection);
                saveFile(filename, xlfContent);
                console.log(`File ${filename} created successfully.`);
            });
        }
    }
};
//executeDelete();
generateTranslationFiles(data);
/*
let filename = "custcollection_lmry_ste_ar_registry_en_en_GB.xlf";
let parts = filename.split('.');
let lastPart = parts[0];
let result = lastPart.slice(-5);
console.log(result);  // en_GB

*/
