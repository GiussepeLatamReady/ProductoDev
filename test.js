const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

function calculateVersion(xmlPath) {
    const xmlData = fs.readFileSync(xmlPath, 'utf8');
    const parser = new XMLParser(); // Crear una instancia del parser
    const jsonObj = parser.parse(xmlData); // Usar el parser para convertir XML a JSON

    const issues = jsonObj.Issues.Issue;

    let major = 0;
    let minor = 0;
    let patch = 0;
    let lastMajorRelease = '';

    issues.forEach((issue) => {

        const isMajor = issue.IsMajor;
        const isClienteIssue = issue.IsClienteIssue;
        const release = issue.Release;

        if (isMajor) {
            major++;
            minor = 0; // Reinicia minor
            patch = 0; // Reinicia patch
        }
         if (release !== lastMajorRelease) {
            minor++;
            patch = 0; // Reinicia patch
        }

        // Incremento de PATCH si es un issue del cliente
        if (isClienteIssue) {
            patch++;
        }

        lastMajorRelease = release;

        console.log(`card: ${issue.ID} , version: ${major}.${minor}.${patch}` )
    });

    return `${major}.${minor}.${patch}`;
}

// Ruta al archivo XML
const xmlFilePath = 'Z_TESTING/LR_CARDS_RELEASE.xml'; // Asegúrate de que la ruta sea correcta
const version = calculateVersion(xmlFilePath);
console.log('La versión calculada es:', version);
