/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_WebServiceArbaMasivoCLNT_V2.1.js            ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Set 09 2022  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
//@ts-check
// @ts-ignore
define(["require", "exports", "N/log", "N/runtime", "N/search", "N/url"], function (require, exports, log, runtime, search, url) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.btnRefresh = exports.btnBack = exports.saveRecord = exports.pageInit = void 0;
    // Nombre del Script
    let Language = '';
    let user = '';
    let password = '';
    let pageInit = () => {
        Language = runtime.getCurrentScript().getParameter({ name: 'LANGUAGE' }).toString();
        Language = Language.substring(0, 2);
        let scriptObj = runtime.getCurrentScript();
        user = scriptObj.getParameter({ name: 'custscript_lmry_ar_ws_user' }).toString();
        password = scriptObj.getParameter({ name: 'custscript_lmry_ar_ws_password' }).toString();
        let translations = {
            "es": {
                'Generado correctamente': 'Generado correctamente',
                'Usuario y/o contraseña inválidos': 'Usuario y/o contraseña inválidos',
                'Finalizado': 'Finalizado',
                'Usuario y/o contraseña inválidos - reintentando': 'Usuario y/o contraseña inválidos - reintentando',
                'Error Interno del Servidor': 'Error Interno del Servidor',
                'Error Interno del Servidor - reintentando': 'Error Interno del Servidor - reintentando',
                'No se ha configurado el setup': 'No se ha configurado el setup',
                'El periodo es inválido o inexistente': 'El periodo es inválido o inexistente',
                'Error al intentar conectar con el web service': 'Error al intentar conectar con el web service',
                'El padron consultado no se encuentra publicado': 'El padron consultado no se encuentra publicado',
                'No existen entidades validas.': 'No existen entidades validas.'
            },
            "en": {
                'Generado correctamente': 'Generated successfully',
                'Usuario y/o contraseña inválidos': 'Invalid username and/or password',
                'Finalizado': 'Finalized',
                'Usuario y/o contraseña inválidos - reintentando': 'Invalid username and/or password - retrying',
                'Error Interno del Servidor': 'Internal Server Error',
                'Error Interno del Servidor - reintentando': 'Internal Server Error - retrying',
                'No se ha configurado el setup': 'The setup has not been configured',
                'El periodo es inválido o inexistente': 'The period is invalid or nonexistent',
                'Error al intentar conectar con el web service': 'Error trying to connect to the web service',
                'El padron consultado no se encuentra publicado': 'The padron consulted is not published',
                'No existen entidades validas.': 'There are no valid entities.',
            },
            "pt": {
                'Generado correctamente': 'Gerado com sucesso',
                'Usuario y/o contraseña inválidos': 'Nome de usuário e/ou senha inválidos',
                'Finalizado': 'Finalizado',
                'Usuario y/o contraseña inválidos - reintentando': 'Nome de usuário e/ou senha inválidos - tentando novamente',
                'Error Interno del Servidor': 'Erro do Servidor Interno',
                'Error Interno del Servidor - reintentando': 'Erro do servidor interno - tentando novamente',
                'No se ha configurado el setup': 'A instalação não foi configurada',
                'El periodo es inválido o inexistente': 'O período é inválido ou inexistente',
                'Error al intentar conectar con el web service': 'Erro ao tentar se conectar ao serviço web',
                'El padron consultado no se encuentra publicado': 'O padron consultado não está publicado',
                'No existen entidades validas.': 'Não há entidades válidas.',
            },
            get: function get(lang, code, element) {
                if (this.hasOwnProperty(lang)) {
                    if (this[lang].hasOwnProperty(code)) {
                        element.innerText = this[lang][code];
                    }
                    else {
                        this.set(code, element);
                    }
                }
                else {
                    if (this.en.hasOwnProperty(code)) {
                        element.innerText = this.en[code];
                    }
                    else {
                        this.set(code, element);
                    }
                }
            },
            set: function translateAlert(textInit, element) {
                fetch("https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=auto&tl=" + Language + "&q=" + textInit)
                    .then(function (response) {
                    return response.text();
                })
                    .then(function (text) {
                    element.innerText = JSON.parse(text)[0][0][0];
                });
            }
        };
        try {
            let table = document.getElementById("custpage_lst_splits");
            table = table.childNodes[0].childNodes;
            let nrlines = (table.length - 2) / 2;
            console.log(nrlines);
            let btnrefres = document.getElementById("tr_custpage_btnrefresh");
            btnrefres.setAttribute("class", "pgBntG pgBntB");
            for (let index = 0; index < nrlines; index++) {
                let element1 = document.getElementById("custpage_lstrow" + index);
                let etext1 = element1.childNodes[5];
                translations.get(Language, etext1.innerText, etext1);
                let etext2 = element1.childNodes[6];
                translations.get(Language, etext2.innerText, etext2);
            }
            let values = document.getElementById("inpt_custpage_lstrange3").title;
            setInterval(function () {
                let aux = document.getElementById("inpt_custpage_lstrange3").title;
                // console.debug([aux, values])
                if (values != aux) {
                    values = aux;
                    let values1 = values.split("to").map(function (e) { return e.trim().split("of"); });
                    let indexes = [];
                    values1.map(function (e) {
                        e.map(function (e1) { indexes.push(Number(e1.trim())); });
                    });
                    console.log(indexes);
                    for (let index = (indexes[0] - 1); index < indexes[1]; index++) {
                        let element1 = document.getElementById("custpage_lstrow" + index);
                        let etext1 = element1.childNodes[5];
                        translations.get(Language, etext1.innerText, etext1);
                        let etext2 = element1.childNodes[6];
                        translations.get(Language, etext2.innerText, etext2);
                    }
                }
            }, 2000);
        }
        catch (error) {
            console.debug("Error vista no main");
        }
    };
    exports.pageInit = pageInit;
    // export let validateField: EntryPoints.Client.validateField = (context: EntryPoints.Client.validateFieldContext) => {
    //     return true;
    // }
    let saveRecord = (context) => {
        try {
            let recordObj = context.currentRecord;
            if (user == '' || user == null || password == '' || password == null) {
                if (Language == 'es') {
                    alert('No se ha configurado el usuario y/o contraseña');
                }
                else {
                    alert('The user and/or password have not been configured');
                }
                return false;
            }
            let period = recordObj.getValue({ fieldId: 'custpage_id_period' });
            let subsi = recordObj.getValue({ fieldId: 'custpage_id_subsi' });
            if (subsi == 0 || subsi == null || subsi == '') {
                if (Language == 'es') {
                    alert('Ingresar la subsidiaria');
                }
                else {
                    alert('Enter the subsidiary');
                }
                return false;
            }
            else {
                let filterDatos = new Array();
                filterDatos[0] = search.createFilter({
                    name: 'custrecord_lmry_ar_ws_tipo_padron',
                    operator: search.Operator.IS,
                    values: 'ARBA'
                });
                filterDatos[1] = search.createFilter({
                    name: 'custrecord_lmry_ar_ws_subsidiary_cc',
                    operator: search.Operator.ANYOF,
                    values: subsi
                });
                filterDatos[2] = search.createFilter({
                    name: 'isinactive',
                    operator: search.Operator.IS,
                    values: 'F'
                });
                let datosDefault = search.create({
                    type: 'customrecord_lmry_ar_ws_setup',
                    columns: ['internalid'],
                    filters: filterDatos
                });
                let datosDefault2 = datosDefault.run().getRange({ start: 0, end: 10 });
                if (datosDefault2.length == 0) {
                    let entitySubsi = search.lookupFields({
                        type: 'subsidiary',
                        id: subsi,
                        columns: ['name']
                    });
                    let name = '';
                    if (entitySubsi != null && entitySubsi != '') {
                        name = entitySubsi.name.toString();
                    }
                    if (Language == 'es') {
                        alert('Configurar el setup para la subsidiaria "' + name + '"');
                    }
                    else {
                        alert('Configure the setup for the subsidiary "' + name + '"');
                    }
                    return false;
                }
            }
            if (period == 0 || period == null || period == '') {
                if (Language == 'es') {
                    alert('Ingresar el periodo');
                }
                else {
                    alert('Enter the period');
                }
                return false;
            }
        }
        catch (error) {
            log.error('ERROR - SaveRecord', error);
        }
        return true;
    };
    exports.saveRecord = saveRecord;
    let btnBack = () => {
        window.location.href = url.resolveScript({
            deploymentId: 'customdeploy_lmry_ar_ws_arba_masivo_stlt',
            scriptId: 'customscript_lmry_ar_ws_arba_masivo_stlt',
        });
    };
    exports.btnBack = btnBack;
    let btnRefresh = () => {
        window.location.reload();
    };
    exports.btnRefresh = btnRefresh;
});
