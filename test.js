var jsonAxiliar = {
  "company": {
    "title": globalLabels.title[language],
    "mlb": scriptParams.multibook ? globalLabels.book[language] + scriptParams.multibookName.replace(/&/g, '&amp;') : '',
    "razon": globalLabels.companyName[language] + subsidiaryData.companyName.replace(/&/g, '&amp;'),
    "ruc": 'NIT: ' + subsidiaryData.ruc + ' - ' + subsidiaryData.dig_verificador,
    "date": globalLabels.period[language] + periodData.startDate + ' ' + globalLabels.to[language] + ' ' + periodData.endDate,
  },
  "traslate": JsonTraslate,
  "movements": arrLine,
  "total": arrTotals,
  "pdfStandard": {
    "origin": globalLabels.origin[language] + "Netsuite",
    "todays": globalLabels.date[language] + timeData.todays,
    "currentTime": globalLabels.time[language] + timeData.currentTime,
    "page": globalLabels.page[language],
    "of": globalLabels.of[language]
  }
}
var renderer = nRender.create();
renderer.templateContent = getTemplate();
renderer.addCustomDataSource({
  format: nRender.DataSource.OBJECT,
  alias: "input",
  data: {
    data: JSON.stringify(jsonAxiliar)
  }
});
return renderer.renderAsPdf();


function getTemplate() {
  var aux = nFile.load("./CO_MayorBalance2.0_TemplatePDF.xml");
  return aux.getContents();
}


// IMPORTAR "N/render" -  nRender