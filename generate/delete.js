const fs = require('fs');
const path = require('path');

// Función para eliminar un archivo
const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Error al eliminar el archivo ${filePath}:`, err);
    } else {
      console.log(`Archivo ${filePath} eliminado exitosamente`);
    }
  });
};

// Función para eliminar múltiples archivos
const deleteFiles = (fileNames) => {
  fileNames.forEach(fileName => {
    const filePath = path.join(__dirname, fileName);
    deleteFile(filePath);
  });
};

// Ejemplo de uso: pasando un arreglo con los nombres de los archivos

const executeDelete = () => {
    const filesToDelete = [
        'custcollection_lmry_ste_ar_send_email_en_en_GB.xlf', 
        'custcollection_lmry_ste_ar_send_email_en_en_US.xlf', 
        'custcollection_lmry_ste_ar_send_email_en_es_AR.xlf',
        'custcollection_lmry_ste_ar_send_email_en_es_ES.xlf',
        'custcollection_lmry_ste_ar_send_email_en_pt_BR.xlf',
        'custcollection_lmry_ste_ar_send_email.xml'
    ];
    deleteFiles(filesToDelete);
  };
module.exports = {
    executeDelete,
};
