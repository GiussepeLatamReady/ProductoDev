/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LS_AR_Assign_Concept_STLT.js
 * @Author anthony@latamready.com
 */
define(['N/redirect', 'N/record', 'N/runtime', "N/ui/serverWidget", "N/url", "N/search", '/SuiteBundles/Bundle 37714/Latam_Library/LMRY_libSendingEmailsLBRY_V2.0'],
function (redirect, record, runtime, serverWidget, url, search, libraryMail) {

  const LMRY_script = 'LS - AR Assign Concept STLT';

  const jsonTranslate = {
    es: {
        'bills': 'Facturas',
        'bill': 'Transacción de Origen (ID Interna)',
        'order': 'Orden',
        'whtid': 'ID Retención',
        'appliesto': 'Se aplica a',
        'concept': 'Concepto',
        'assignconcept': 'Asignar Concepto',
        'form': 'LatamReady - Asignar Conceptos',
        'save': 'Asignar',
        'primary': 'Información Primaria',
        'subsidiary': 'Subsidiaria',
        'date': 'Fecha',
        'assign': 'Asignar',
        'vendor': 'Proveedor',
        'tranid': 'Número de Referencia',
        'item': 'Artículo',
        'ganancias': 'Concepto RG-5333',
        'salta': 'Concepto Salta',
        'back': 'Volver'
    },
    en: {
        'bills': 'Bills',
        'bill': 'Source Transaction (Internal ID)',
        'order': 'Order',
        'whtid': 'WHT ID',
        'appliesto': 'Applies to',
        'concept': 'Concept',
        'assignconcept': 'Assign Concept',
        'form': 'LatamReady - Assign Concepts',
        'save': 'Assign',
        'primary': 'Primary Information',
        'subsidiary': 'Subsidiary',
        'date': 'Date',
        'assign': 'Assign',
        'vendor': 'Vendor',
        'tranid': 'Reference Number',
        'item': 'Ítem',
        'ganancias': 'RG-5333 Concept',
        'salta': 'Salta Concept',
        'back': 'Back'
    }
  };

    const onRequest = (scriptContext) => {

        let language = runtime.getCurrentUser().getPreference({ name: "LANGUAGE" }).substring(0, 2);
        language = getLanguage(language);

        try{    

            if(scriptContext.request.method === "GET"){

            //Parameters
            let idLog = scriptContext.request.parameters.param_logid;

            let {bills, vendor, date, subsidiary} = getLog(idLog);
            let dataBills = getBills(bills);

            let arrayCC = getCC(vendor, date, subsidiary);

            //Form
            let form = serverWidget.createForm({title: jsonTranslate[language]['form']});

            form.addFieldGroup({id: 'group_pi', label: jsonTranslate[language]['primary']});

            form.addField({id: 'subsidiary', label: jsonTranslate[language]['subsidiary'], type: 'select', source: 'subsidiary', container: 'group_pi'}).updateDisplayType({displayType: 'disabled'}).defaultValue = subsidiary;
            form.addField({id: 'vendor', label: jsonTranslate[language]['vendor'], type: 'select', source: 'vendor', container: 'group_pi'}).updateDisplayType({displayType: 'disabled'}).defaultValue = vendor;
            form.addField({id: 'date', label: jsonTranslate[language]['date'], type: 'date', container: 'group_pi'}).updateDisplayType({displayType: 'disabled'}).defaultValue = date;

            form.addField({id: 'log', label: 'log', type: 'text'}).updateDisplayType({displayType: 'hidden'}).defaultValue = idLog;

            let sublista = form.addSublist({id: 'custpage_bills',type: serverWidget.SublistType.LIST, label: jsonTranslate[language]['bills']});

            sublista.addField({id: 'bill', type: 'text', label: jsonTranslate[language]['bill']});
            sublista.addField({id: 'tranid', type: 'text', label: jsonTranslate[language]['tranid']});
            sublista.addField({id: 'item', type: 'select', label: jsonTranslate[language]['item'], source: 'item'}).updateDisplayType({displayType: 'disabled'});
            sublista.addField({id: 'lineuniquekey', type: 'text', label: 'lineUniqueKey'}).updateDisplayType({displayType: 'hidden'});
            sublista.addField({id: 'ganancias_id', type: 'text', label: 'Ganancias ID'}).updateDisplayType({displayType: 'hidden'});
            sublista.addField({id: 'ganancias', type: 'text', label: jsonTranslate[language]['ganancias']});
            sublista.addField({id: 'assign_ganancias', type: 'select', label: jsonTranslate[language]['assignconcept']}).updateDisplayType({displayType: 'entry'});
            sublista.addField({id: 'salta_id', type: 'text', label: 'Salta ID'}).updateDisplayType({displayType: 'hidden'});
            sublista.addField({id: 'salta', type: 'text', label: jsonTranslate[language]['salta']});
            sublista.addField({id: 'assign_salta', type: 'select', label: jsonTranslate[language]['assignconcept']}).updateDisplayType({displayType: 'entry'});

            setConcepts(arrayCC, sublista);

            let contador = 0;

            //Json vacío, redirect al preview
            if(!Object.keys(dataBills).length){
                redirect.toSuitelet({
                    scriptId: "customscript_lmry_wht_details_stlt",
                    deploymentId: "customdeploy_lmry_wht_details_stlt",
                    parameters: { param_logid: idLog, param_useid: runtime.getCurrentUser().id },
                  });
            }

            for(let i in dataBills){
                for(let j = 0; j < dataBills[i].length; j++){

                    let urlBill = url.resolveRecord({recordType: 'vendorbill', recordId: i});
                    sublista.setSublistValue({id: 'bill', line: contador, value: '<a href="' + urlBill + '" target="_blank">' + i + '</a>'});

                    sublista.setSublistValue({id: 'tranid', line: contador, value: dataBills[i][j]['tranid']});
                    sublista.setSublistValue({id: 'item', line: contador, value: dataBills[i][j]['idItem']});
                    sublista.setSublistValue({id: 'lineuniquekey', line: contador, value: dataBills[i][j]['lineuniquekey']});

                    if(dataBills[i][j]['idGanancias']){
                        sublista.setSublistValue({id: 'ganancias', line: contador, value: dataBills[i][j]['nameGanancias']});
                        sublista.setSublistValue({id: 'assign_ganancias', line: contador, value: dataBills[i][j]['idGanancias']});
                        sublista.setSublistValue({id: 'ganancias_id', line: contador, value: dataBills[i][j]['idGanancias']});
                    }

                    if(dataBills[i][j]['idSalta']){
                        sublista.setSublistValue({id: 'salta', line: contador, value: dataBills[i][j]['nameSalta']});
                        sublista.setSublistValue({id: 'assign_salta', line: contador, value: dataBills[i][j]['idSalta']});
                        sublista.setSublistValue({id: 'salta_id', line: contador, value: dataBills[i][j]['idSalta']});
                    }

                    contador ++;

                }

            }

            form.addSubmitButton({label: jsonTranslate[language]['assign']});

            form.addButton({id: 'custpage_back', label: jsonTranslate[language]['back'], functionName: 'back'});

            goBack(form);

            scriptContext.response.writePage(form);

        }else{
            //POST

            let idLog = scriptContext.request.parameters.log;

            let jsonBills = {};
            let cLineas = scriptContext.request.getLineCount({group: 'custpage_bills'});

            for(let i = 0; i < cLineas; i++){

                let idBill = getId(scriptContext.request.getSublistValue({group: 'custpage_bills', name: 'bill', line: i}));
                let idItem = scriptContext.request.getSublistValue({group: 'custpage_bills', name: 'item', line: i});
                let lineUniqueKey = scriptContext.request.getSublistValue({group: 'custpage_bills', name: 'lineuniquekey', line: i});
                let gananciasConcept = scriptContext.request.getSublistValue({group: 'custpage_bills', name: 'ganancias_id', line: i}) || '';
                let saltaConcept = scriptContext.request.getSublistValue({group: 'custpage_bills', name: 'salta_id', line: i}) || '';
                let newGanancias = scriptContext.request.getSublistValue({group: 'custpage_bills', name: 'assign_ganancias', line: i}) || '';
                let newSalta = scriptContext.request.getSublistValue({group: 'custpage_bills', name: 'assign_salta', line: i}) || '';

                jsonBills[idBill] = jsonBills[idBill] || {};
                jsonBills[idBill][idItem] = jsonBills[idBill][idItem] || {};

                jsonBills[idBill][idItem] = {
                    lineUniqueKey, gananciasConcept, saltaConcept, newGanancias, newSalta
                };

            }

            if(Object.keys(jsonBills).length){

                record.submitFields({
                    type: 'customrecord_lmry_wht_payments_log',
                    id: idLog,
                    values: {custrecord_ls_assign_concepts: JSON.stringify(jsonBills)}
                });

            } 

            redirect.toSuitelet({
                scriptId: 'customscript_lmry_wht_details_stlt',
                deploymentId: 'customdeploy_lmry_wht_details_stlt',
                parameters: {'param_logid': idLog, 'param_useid': runtime.getCurrentUser().id}
            });

        }


      }catch (err){

        log.error('onRequest', err);
        libraryMail.sendemail('[onRequest] ' + err, LMRY_script);
        drawFormError(scriptContext, language);

      }


    }

    const getLog = (idLog) => {

        let dataLog = search.lookupFields({
            type: 'customrecord_lmry_wht_payments_log',
            id: idLog,
            columns: ['custrecord_lmry_wht_bil', 'custrecord_lmry_wht_ven', 'custrecord_lmry_wht_dat', 'custrecord_lmry_wht_sub']
        });

        let bills = dataLog.custrecord_lmry_wht_bil;
        let vendor = dataLog.custrecord_lmry_wht_ven[0].value;
        let date = dataLog.custrecord_lmry_wht_dat;
        let subsidiary = dataLog.custrecord_lmry_wht_sub[0].value;

        return {bills, vendor, date, subsidiary};

    }

    const getCC = (vendor, date, subsidiary) => {

        let arrayCC = [];

        let searchCC = search.create({
            type: 'customrecord_lmry_ar_contrib_class',
            filters: [
                ["custrecord_lmry_ar_ccl_entity", "is", vendor], "AND",
                ["isinactive", "anyof", 'F'], "AND",
                ["custrecord_lmry_ar_ccl_isexempt", "is", 'F'], "AND",
                ["custrecord_lmry_ccl_taxtype", "anyof", [1]], "AND",
                ["custrecord_lmry_ar_ccl_fechdesd", "onorbefore", date], "AND",
                ["custrecord_lmry_ar_ccl_fechhast", "onorafter", date], "AND",
                ["custrecord_lmry_ccl_transactiontypes", "anyof", [4]], "AND",
                ["custrecord_lmry_ccl_gen_transaction", "anyof", [3]], "AND",
                ["custrecord_lmry_ar_ccl_subsidiary", "is", subsidiary], "AND",
                [[["custrecord_ls_padron_salta", "is", "T"]],"OR",[["custrecord_ls_ganancias_rg_5333", "is", "T"]]]
            ],
            columns: ['custrecord_ls_ar_rg5333_ganancias_concep', 'custrecord_ls_salta_ib_concept', 'custrecord_lmry_ccl_appliesto']
        });

        searchCC = searchCC.run().getRange(0, 1000);

        if(searchCC && searchCC.length){
            for(let i = 0; i < searchCC.length; i++){

                arrayCC.push({
                    'gananciasValue': searchCC[i].getValue('custrecord_ls_ar_rg5333_ganancias_concep') || '',
                    'gananciasText': searchCC[i].getText('custrecord_ls_ar_rg5333_ganancias_concep') || '',
                    'saltaValue': searchCC[i].getValue('custrecord_ls_salta_ib_concept') || '',
                    'saltaText': searchCC[i].getText('custrecord_ls_salta_ib_concept') || '',
                    'appliesTo': searchCC[i].getValue('custrecord_lmry_ccl_appliesto'),
                    'id': searchCC[i].id
                });

            }
        }

        log.debug('arrayCC', arrayCC);

        return arrayCC;

    }

    const getBills = (bills) => {

        let idBills = [];
        let jsonBill = {};

        bills = bills.split('|');

        for(let i = 0; i < bills.length - 1; i++){

            let idBill = (bills[i].split(';'))[0];

            idBills.push(idBill);

        }

        //log.debug('idBills', idBills);

        let searchBills = search.create({
            type: 'vendorbill',
            filters: [
              ["internalid", "anyof", idBills], "AND",
              ["mainline","is","F"], "AND",
              [[["item.custitem_ls_ar_item_concept_salta","noneof","@NONE@"]],"OR",[["item.custitem_ls_ar_item_concept_rg5333","noneof","@NONE@"]]]
            ],
            columns: ['tranid', 'transactionnumber', 'item', 'lineuniquekey', {name: 'custitem_ls_ar_item_concept_salta', join: 'item'}, {name: 'custitem_ls_ar_item_concept_rg5333', join: 'item'}]
          });

        searchBills = searchBills.run().getRange(0, 1000);

        if(searchBills && searchBills.length){
            for(let i = 0; i < searchBills.length; i++){

                let idBill = searchBills[i].id;
                jsonBill[idBill] = jsonBill[idBill] || [];

                jsonBill[idBill].push({
                    'idItem': searchBills[i].getValue('item'),
                    'nameItem': searchBills[i].getText('item'),
                    'idSalta': searchBills[i].getValue({name: 'custitem_ls_ar_item_concept_salta', join: 'item'}) || '',
                    'nameSalta': searchBills[i].getText({name: 'custitem_ls_ar_item_concept_salta', join: 'item'}) || '',
                    'idGanancias': searchBills[i].getValue({name: 'custitem_ls_ar_item_concept_rg5333', join: 'item'}) || '',
                    'nameGanancias': searchBills[i].getText({name: 'custitem_ls_ar_item_concept_rg5333', join: 'item'}) || '',
                    'lineuniquekey': searchBills[i].getValue({name: 'lineuniquekey'}),
                    'tranid': searchBills[i].getValue('tranid') || searchBills[i].getValue('transactionnumber')
                });


            }
        }

        //log.debug('jsonBill', jsonBill);

        return jsonBill;


    }

    const getLanguage = (Language) => {
         
        if (Language != 'es') {
            Language = 'en';
        }

        return Language;

    }

    const setConcepts = (arrayCC, sublista) => {

        let fGanancias = sublista.getField('assign_ganancias');
        let fSalta = sublista.getField('assign_salta');

        fGanancias.addSelectOption({value: '', text: '&nbsp;'});
        fSalta.addSelectOption({value: '', text: '&nbsp;'});

        for(let i = 0; i < arrayCC.length; i++){

            let appliesTo = arrayCC[i]['appliesTo'];

            if(appliesTo == 5){

                fGanancias.addSelectOption({
                    value: arrayCC[i]['gananciasValue'],
                    text: arrayCC[i]['gananciasText']
                });

            }else if(appliesTo == 6){

                fSalta.addSelectOption({
                    value: arrayCC[i]['saltaValue'],
                    text: arrayCC[i]['saltaText']
                });

            }

        }

    }

    const goBack = (form) => {

        // Añadir un campo oculto que contiene el script para abrir el popup con el iframe
        let scriptField = form.addField({
            id: 'custpage_popup_script',
            type: 'inlinehtml',
            label: 'back'
        });

        let suiteletUrl = url.resolveScript({
            scriptId: 'customscript_lmry_wht_on_payments_sltl',
            deploymentId: 'customdeploy_lmry_wht_on_payments_stlt'
        });

        // Contenido HTML del popup
        let redirectStlt = `
        <script>
            function back() {
                var suiteletUrl = '${suiteletUrl}';
                window.location = suiteletUrl;
            }
        </script>
        `;

        scriptField.defaultValue = redirectStlt;

    }

    const drawFormError = (scriptContext, language) => {

        let form = serverWidget.createForm({title: jsonTranslate[language]['form']});
        let myInlineHtml = form.addField({id: 'custpage_id_message', label: 'Message', type: serverWidget.FieldType.INLINEHTML});
        myInlineHtml.layoutType = serverWidget.FieldLayoutType.OUTSIDEBELOW;
        myInlineHtml.updateBreakType({breakType : serverWidget.FieldBreakType.STARTCOL});

        let strhtml = "<html>";
        strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
        "<tr>" +
        "</tr>" +
        "<tr>" +
        "<td class='text'>" +
        "<div style=\"color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">"+ 'Important: Access is not allowed' +".</div>" +
        "</td>" +
        "</tr>" +
        "</table>" +
        "</html>";

        myInlineHtml.defaultValue = strhtml;

        // Dibuja el Formulario
        scriptContext.response.writePage(form);

    }

    const getId = (url) => {

        url = url.split('id=')[1];
        url = url.split('&')[0];

        return url;

    }

    return { onRequest }
});
