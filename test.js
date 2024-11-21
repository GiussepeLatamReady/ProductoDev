const tickets = [
  { id: "C20319", type: "MAJOR", description: "Rediseño completo del sistema de autenticación" },
  { id: "C2020", type: "MINOR", description: "Optimización del rendimiento del módulo de reportes" },
  { id: "C1956", type: "PATCH", description: "Corrección menor en el mensaje de error del login" },
  { id: "C20450", type: "MINOR", description: "Añadido soporte para exportación de datos en formato CSV" },
  { id: "C20111", type: "MAJOR", description: "Implementación de un nuevo motor de búsqueda" },
  { id: "C20678", type: "PATCH", description: "Corrección de ortografía en los mensajes del sistema" },
  { id: "C20987", type: "MINOR", description: "Actualización de la biblioteca de gráficos a la última versión" },
  { id: "C20320", type: "PATCH", description: "Corrección de un bug en el formulario de contacto" },
  { id: "C20500", type: "MAJOR", description: "Migración completa del sistema a una arquitectura basada en microservicios" },
  { id: "C20745", type: "PATCH", description: "Pequeña mejora en los logs de depuración" },
  { id: "C20988", type: "MINOR", description: "Añadido soporte para autenticación multifactor (MFA)" }
];

function calculateVersionByOrder(tickets) {
  let major = 0, minor = 0, patch = 0;
  const versions = []; // Almacenar versiones en cada paso

  tickets.forEach(ticket => {
    switch (ticket.type) {
      case "MAJOR":
        major++;
        minor = 0; // Reiniciar minor
        patch = 0; // Reiniciar patch
        break;
      case "MINOR":
        minor++;
        patch = 0; // Reiniciar patch
        break;
      case "PATCH":
        patch++;
        break;
    }
    // Registrar la versión actual después de procesar cada ticket
    versions.push(`${major}.${minor}.${patch}`);
  });

  return versions;
}


https.requestSuitelet({
  scriptId: "customscript_lr_loadvalidate_stlt",
  deploymentId: "customdeploy_lr_loadvalidate_stlt",
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0"
  },
  method: "POST",
  body: JSON.stringify({
      recordType: "customer",
      country: 48
  })
});


search.lookupFields({
  type: "subsidiary",
  id: "7",
  columns: ['country'] //
})['country'][0].value;