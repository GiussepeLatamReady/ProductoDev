
const fs = require('fs');
const path = require('path');
const { executeDelete } = require('./delete');
const data = {
    "name": "LatamReady BR IBPT",
    "id": "custcollection_lr_br_ibpt",
    "collections": {
        "source": {
            "BR_ALERT_TITLE": "Alert",
            "BR_ALERT_MESSAGE": "Please wait a moment, the process is in progress.",
            "BR_INPUT_DATA": "Enter a value for ",
            "BR_COMPLETE_MPRD": "Completed",
            "BR_PROCESSING_MPRD": "Processing",
            "BR_ERROR_MPRD": "An error has occurred",
            "BR_COMPLETE_MSG_MPRD": "The process has finished",
            "BR_PROCESSING_MSG_MPRD": "Processing of items has started...",
            "BR_MESSAGE": "Message",
            "BR_MESSAGE_LICENSE": "NOTICE: Currently the license for this module is expired, please contact the LatamReady sales team.",
            "BR_MESSAGE_CONTACT": "You can also contact us through",
            "BR_PRIMARY_INFO": "Primary information",
            "BR_SUBSIDIARY": "Subsidiary",
            "BR_SERVICES": "Services",
            "BR_PRODUCT": "Product",
            "BR_TITLE_FORM": "LR - BR Import IBPT",
            "BR_RESTART": "Restart",
            "BR_GENERATE": "Generate",
            "BR_RESULTS": "Results",
            "BR_RESULT": "Result",
            "BR_INTERNALID": "Internal ID",
            "BR_CREATION_DATE_LABEL": "Creation Date",
            "BR_CREATED_BY_LABEL": "Created By",
            "BR_TYPE": "Type",
            "BR_SUMMARY": "Summary",
            "BR_STATUS": "Status",
            "BR_REFRESH": "Refresh",
            "BR_FINISH": "Finished",
            "BR_LOADING_DATA": "Loading Data",
            "BR_ERROR": "An Error Occurred",
            "BR_PROCESING": "Processing",
            "BR_DETAILS": "Details",
            "BR_NUMBER": "Position",
            "BR_SUCESS": "successful",
            "BR_RAW": "unprocessed",
            "BR_WITH_ERROR": "with error",
            "BR_CODE_FOUND": "Processed catalog item",
            "BR_CATALOGS": "Catalog",
            "BR_CODE": "code",
            "BR_NOT_PROCESING": "Not Processed",
            "BR_PROCESING_CHECK": "Successfully Processed",
            "BR_CALCULO_IBPT": "IBPT calculation",
            "BR_EXIST": "The time period is interfering with another.",
            "BR_CREDENTIALS": "The credentials de the application are wrong.",
            "BR_CODE_EXIST": "The catalog item does not have Latam - BR Law Item"
        },
        "es": {
            "BR_ALERT_TITLE": "Alerta",
            "BR_ALERT_MESSAGE": "Espere un momento por favor, el proceso se encuentra en curso.",
            "BR_INPUT_DATA": "Ingrese un valor para ",
            "BR_COMPLETE_MPRD": "Completado",
            "BR_PROCESSING_MPRD": "Procesando",
            "BR_ERROR_MPRD": "Se ha producido un error",
            "BR_COMPLETE_MSG_MPRD": "El proceso ha finalizado",
            "BR_PROCESSING_MSG_MPRD": "Ha comenzado a procesar a las Items...",
            "BR_MESSAGE": "Mensaje",
            "BR_MESSAGE_LICENSE": "AVISO: Actualmente la licencia para este módulo está vencida, por favor contacte al equipo comercial de LatamReady.",
            "BR_MESSAGE_CONTACT": "También puedes contactar con nosotros a",
            "BR_PRIMARY_INFO": "Informacion primaria",
            "BR_SUBSIDIARY": "Subsidiaria",
            "BR_SERVICES": "Servicios",
            "BR_PRODUCT": "Producto",
            "BR_TITLE_FORM": "LR - BR Importar IBPT",
            "BR_RESTART": "Reiniciar",
            "BR_GENERATE": "Generar",
            "BR_RESULTS": "Resultados",
            "BR_RESULT": "Resultado",
            "BR_INTERNALID": "ID Interno",
            "BR_CREATION_DATE_LABEL": "Fecha de Creación",
            "BR_CREATED_BY_LABEL": "Creado por",
            "BR_TYPE": "Tipo",
            "BR_SUMMARY": "Resumen",
            "BR_STATUS": "Estado",
            "BR_REFRESH": "Actualizar",
            "BR_FINISH": "Finalizado",
            "BR_LOADING_DATA": "Cargando datos",
            "BR_ERROR": "Ocurrió un error",
            "BR_PROCESING": "Procesando",
            "BR_DETAILS": "Detalles",
            "BR_NUMBER": "Posicion",
            "BR_SUCESS": "con éxito",
            "BR_RAW": "sin procesar",
            "BR_WITH_ERROR": "con error",
            "BR_CODE_FOUND": "Item de catalogo procesados",
            "BR_CATALOGS": "Catalogo",
            "BR_CODE": "Codigo",
            "BR_NOT_PROCESING": "No procesada",
            "BR_PROCESING_CHECK": "Procesada con éxito",
            "BR_CALCULO_IBPT": "Cálculo IBPT",
            "BR_EXIST": "El periodo de tiempo está interferiendo con otro.",
            "BR_CREDENTIALS": "Las credenciales de la solicitud son erroneas",
            "BR_CODE_EXIST": "El item del catalogo no tiene Latam - BR Law Item"
        },
        "en": {
            "BR_ALERT_TITLE": "Alert",
            "BR_ALERT_MESSAGE": "Please wait a moment, the process is in progress.",
            "BR_INPUT_DATA": "Enter a value for ",
            "BR_COMPLETE_MPRD": "Completed",
            "BR_PROCESSING_MPRD": "Processing",
            "BR_ERROR_MPRD": "An error has occurred",
            "BR_COMPLETE_MSG_MPRD": "The process has finished",
            "BR_PROCESSING_MSG_MPRD": "Processing of items has started...",
            "BR_MESSAGE": "Message",
            "BR_MESSAGE_LICENSE": "NOTICE: Currently the license for this module is expired, please contact the LatamReady sales team.",
            "BR_MESSAGE_CONTACT": "You can also contact us through",
            "BR_PRIMARY_INFO": "Primary information",
            "BR_SUBSIDIARY": "Subsidiary",
            "BR_SERVICES": "Services",
            "BR_PRODUCT": "Product",
            "BR_TITLE_FORM": "LR - BR Import IBPT",
            "BR_RESTART": "Restart",
            "BR_GENERATE": "Generate",
            "BR_RESULTS": "Results",
            "BR_RESULT": "Result",
            "BR_INTERNALID": "Internal ID",
            "BR_CREATION_DATE_LABEL": "Creation Date",
            "BR_CREATED_BY_LABEL": "Created By",
            "BR_TYPE": "Type",
            "BR_SUMMARY": "Summary",
            "BR_STATUS": "Status",
            "BR_REFRESH": "Refresh",
            "BR_FINISH": "Finished",
            "BR_LOADING_DATA": "Loading Data",
            "BR_ERROR": "An Error Occurred",
            "BR_PROCESING": "Processing",
            "BR_DETAILS": "Details",
            "BR_NUMBER": "Position",
            "BR_SUCESS": "successful",
            "BR_RAW": "unprocessed",
            "BR_WITH_ERROR": "with error",
            "BR_CODE_FOUND": "Processed catalog item",
            "BR_CATALOGS": "Catalog",
            "BR_CODE": "code",
            "BR_NOT_PROCESING": "Not Processed",
            "BR_PROCESING_CHECK": "Successfully Processed",
            "BR_CALCULO_IBPT": "IBPT calculation",
            "BR_EXIST": "The time period is interfering with another.",
            "BR_CREDENTIALS": "The credentials de the application are wrong.",
            "BR_CODE_EXIST": "The catalog item does not have Latam - BR Law Item"
        },
        "pt": {
            "BR_ALERT_TITLE": "Alerta",
            "BR_ALERT_MESSAGE": "Por favor, aguarde um momento, o processo está em andamento.",
            "BR_INPUT_DATA": "Insira um valor para ",
            "BR_COMPLETE_MPRD": "Concluído",
            "BR_PROCESSING_MPRD": "Processando",
            "BR_ERROR_MPRD": "Ocorreu um erro",
            "BR_COMPLETE_MSG_MPRD": "O processo foi finalizado",
            "BR_PROCESSING_MSG_MPRD": "O processamento dos itens começou...",
            "BR_MESSAGE": "Mensagem",
            "BR_MESSAGE_LICENSE": "AVISO: Atualmente, a licença para este módulo está vencida. Por favor, entre em contato com a equipe comercial da LatamReady.",
            "BR_MESSAGE_CONTACT": "Você também pode nos contactar através de",
            "BR_PRIMARY_INFO": "Informações primárias",
            "BR_SUBSIDIARY": "Subsidiária",
            "BR_SERVICES": "Serviços",
            "BR_PRODUCT": "Produto",
            "BR_TITLE_FORM": "LR - BR Importar IBPT",
            "BR_RESTART": "Reiniciar",
            "BR_GENERATE": "Gerar",
            "BR_RESULTS": "Resultados",
            "BR_RESULT": "Resultado",
            "BR_INTERNALID": "ID Interno",
            "BR_CREATION_DATE_LABEL": "Data de Criação",
            "BR_CREATED_BY_LABEL": "Criado por",
            "BR_TYPE": "Tipo",
            "BR_SUMMARY": "Resumo",
            "BR_STATUS": "Estado",
            "BR_REFRESH": "Atualizar",
            "BR_FINISH": "Finalizado",
            "BR_LOADING_DATA": "Carregando dados",
            "BR_ERROR": "Ocorreu um erro",
            "BR_PROCESING": "Processando",
            "BR_DETAILS": "Detalhes",
            "BR_NUMBER": "Posição",
            "BR_SUCESS": "com sucesso",
            "BR_RAW": "não processado",
            "BR_WITH_ERROR": "com erro",
            "BR_CODE_FOUND": "Item de catálogo processado",
            "BR_CATALOGS": "Catálogo",
            "BR_CODE": "Código",
            "BR_NOT_PROCESING": "Não processado",
            "BR_PROCESING_CHECK": "Processado com sucesso",
            "BR_CALCULO_IBPT": "Cálculo IBPT",
            "BR_EXIST": "O período de tempo está interferindo com outro.",
            "BR_CREDENTIALS": "As credenciais da solicitação estão incorretas.",
            "BR_CODE_EXIST": "O item do catálogo não tem Latam - BR Law Item"
        }
    },
    "files": {
        "xml": "custcollection_lr_br_ibpt.xml",
        "xlf": {
            "es": [
                "custcollection_lr_br_ibpt_es_AR.xlf",
                "custcollection_lr_br_ibpt_es_ES.xlf"
            ],
            "en": [
                "custcollection_lr_br_ibpt_en_GB.xlf",
                "custcollection_lr_br_ibpt_en_US.xlf"
            ],
            "pt": ["custcollection_lr_br_ibpt_pt_BR.xlf"]
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
executeDelete();
generateTranslationFiles(data);
/*
let filename = "custcollection_lmry_ste_ar_registry_en_en_GB.xlf";
let parts = filename.split('.');
let lastPart = parts[0];
let result = lastPart.slice(-5);
console.log(result);  // en_GB

*/
