/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_WebServiceArbaMasivoSTLT_V2.1.js            ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.1     Set 09 2022  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
* @NApiVersion 2.1
* @NScriptType Suitelet
*/
//@ts-check
// @ts-ignore
define(["require", "exports", "N/log", "N/record", "N/redirect", "N/runtime", "N/search", "N/task", "N/ui/serverWidget", "N/url"],
    function (require, exports, log, record, redirect, runtime, search, task, serverWidget, url) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.onRequest = void 0;
        const onRequest = (context) => {
            try {
                let Language = runtime.getCurrentScript().getParameter({ name: 'LANGUAGE' }).toString();
                Language = Language.substring(0, 2);
                let translations = {
                    "en": {
                        0: 'LatamReady - Register ARBA',
                        1: 'Data Web Service',
                        2: 'FILIARY',
                        3: 'PERIOD',
                        4: 'RESULTS',
                        5: 'INTERNAL ID',
                        6: 'CREATION DATE',
                        7: 'EMPLOYEE',
                        8: 'DESCRIPTION',
                        9: 'STATUS',
                        10: 'DETAIL',
                        11: 'RESULT',
                        12: 'LAST MODIFICATION',
                        13: 'Generate📖',
                        14: 'Register Detail ⚠️',
                        15: 'Return',
                        16: 'Details',
                        17: 'Entity',
                        18: "Problem",
                        19: "Register processes",
                        20: "Processes",
                        21: "Execution No.",
                        22: "Creation date",
                        23: "Start date",
                        24: "End date",
                        25: "Execution Instances",
                        26: "CSV Response",
                        27: 'INVALID CUIT PREFIX',
                        28: 'INVALID CUIT NUMBER',
                        29: 'The CUIT entered is not in any register',
                        30: 'UNEXPECTED ERROR',
                        31: 'Omitted for having rate with value 0 in the period',
                        32: 'Omitted for not having contributory classes in the period',
                        33: 'Update Successful',
                        34: 'Important: This service will take time depending on the ARBA web service',
                        35: 'Entity',
                        36: 'Type of person',
                        37: 'Filters',
                        'Cliente': 'Customer',
                        'Vendor': 'Vendor',
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
                        'Recargar': "Refresh",
                        "Todas las entidades": "All entities",
                        "Solo Clientes": "Clients Only",
                        "Solo Vendedores": "Only Vendors",
                        "Persona Jurídica": "Legal person",
                        "Persona Física": "Physical person",
                        "Otro Tipo de Entidad": "Other Type of Entity",
                        "Reintentar": "Retry"
                    },
                    "es": {
                        0: 'LatamReady - Padron ARBA',
                        1: 'Servicio web de datos',
                        2: 'FILIAL',
                        3: 'PERÍODO',
                        4: 'RESULTADOS',
                        5: 'ID INTERNO',
                        6: 'FECHA DE CREACIÓN',
                        7: 'EMPLEADO',
                        8: 'DESCRIPCIÓN',
                        9: 'ESTADO',
                        10: 'DETALLE',
                        11: 'RESULTADO',
                        12: 'ÚLTIMA MODIFICACIÓN',
                        13: 'Generar',
                        14: 'Detalle de registro',
                        15: 'Regresar',
                        16: 'Detalles',
                        17: 'Entidad',
                        18: "Problema",
                        19: "Registrar procesos",
                        20: "Procesos",
                        21: "Ejecución No.",
                        22: "Fecha de creación",
                        23: "Fecha de inicio",
                        24: "Fecha de finalización",
                        25: "Instancias de ejecución",
                        26: "Respuesta CSV",
                        27: 'PREFIJO DE CUIT INVALIDO',
                        28: 'NUMERO DE CUIT INVALIDO',
                        29: 'La CUIT ingresada no se encuentra en ningun padron',
                        30: 'ERROR INESPERADO',
                        31: 'Omitido por tener alicuota con valor 0 en el periodo',
                        32: 'Omitido por no tener clases contributivas en el periodo',
                        33: 'Actualizacion Correcta',
                        34: 'Importante: Este servicio tardara dependiendo del web service de ARBA',
                        35: 'Entidad',
                        36: 'Tipo de persona',
                        37: 'Filtros',
                        'Cliente': 'Cliente',
                        'Vendor': 'Vendedor',
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
                        'No existen entidades validas.': 'No existen entidades validas.',
                        'Recargar': 'Actualizar',
                        "Todas las entidades": "Todas las entidades",
                        "Solo Clientes": "Solo Clientes",
                        "Solo Vendedores": "Solo Vendedores",
                        "Persona Jurídica": "Persona Jurídica",
                        "Persona Física": "Persona Física",
                        "Otro Tipo de Entidad": "Otro Tipo de Entidad",
                        "Reintentar": "Reintentar"
                    },
                    "pt": {
                        0: 'LatamReady - Cadastro ARBA',
                        1: 'Serviço web de dados',
                        2: 'FILIAL',
                        3: 'PERÍODO',
                        4: 'RESULTADOS',
                        5: 'ID INTERNO',
                        6: 'DATA DE CRIAÇÃO',
                        7: 'FUNCIONÁRIO',
                        8: 'DESCRIÇÃO',
                        9: 'ESTADO',
                        10: 'DETALHE',
                        11: 'RESULTADO',
                        12: 'ÚLTIMA MODIFICAÇÃO',
                        13: 'Gerar',
                        14: 'Detalhe do registro',
                        15: 'Retorno',
                        16: 'Detalhes',
                        17: 'Entidade',
                        18: "Problema",
                        19: "Registrar processos",
                        20: "Processos",
                        21: "Execução nº.",
                        22: "Data de criação",
                        23: "Data de início",
                        24: "Data de término",
                        25: "Instâncias de execução",
                        26: "Resposta CSV",
                        27: 'PREFIXO DE CUITO INVÁLIDO',
                        28: 'NÚMERO DE CUIT INVÁLIDO',
                        29: 'O CUIT inserido não está em nenhum registro',
                        30: 'ERRO INESPERADO',
                        31: 'Omitido por ter taxa com valor 0 no período',
                        32: 'Omitido por não haver aulas contributivas no período',
                        33: 'Atualização bem-sucedida',
                        34: 'Importante: Este serviço levará tempo dependendo do serviço web ARBA',
                        35: 'Entidade',
                        36: 'Tipo de pessoa',
                        37: 'Filtros',
                        'Cliente': 'Cliente',
                        'Vendor': 'Fornecedor',
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
                        'Recargar': 'Atualizar',
                        "Todas las entidades": "Todas as Entidades",
                        "Solo Clientes": "Somente clientes",
                        "Solo Vendedores": "Somente vendedores",
                        "Persona Jurídica": "Pessoa Jurídica",
                        "Persona Física": "Pessoa Física",
                        "Otro Tipo de Entidad": "Outro Tipo de Entidade",
                        "Reintentar": "Tentar Novamente"
                    },
                    get: function get(lang, code) {
                        if (this.hasOwnProperty(lang)) {
                            if (this[lang].hasOwnProperty(code)) {
                                return this[lang][code];
                            }
                            else {
                                return code;
                            }
                        }
                        else {
                            if (this.en.hasOwnProperty(code)) {
                                return this.en[code];
                            }
                            else {
                                return code;
                            }
                        }
                    }
                };
                let dataArray = {
                    1: {
                        0: "Todas las entidades",
                        1: "Solo Clientes",
                        2: "Solo Vendedores",
                        undefined: "All"
                    },
                    2: {
                        1: "Persona Jurídica",
                        2: "Persona Física",
                        3: "Otro Tipo de Entidad",
                        undefined: "All",
                        "": "All"
                    },
                    3: {
                        "F": "Use invalid CUIT",
                        false: "Use invalid CUIT",
                        "T": "Use only valid CUIT",
                        true: "Use only valid CUIT"
                    },
                    4: {
                        "F": "Use all transactions",
                        false: "Use all transactions",
                        "T": "Use only open transactions",
                        true: "Use only open transactions",
                    }

                };
                if (context.request.method == 'GET') {
                    let form;

                    function cargarEntity(type, keys) {

                        let VendSearch = search.create({
                            type: type,
                            filters: ["internalid", 'anyof', keys],
                            columns: [
                                search.createColumn({ name: "internalid", sort: search.Sort.ASC }),
                                'vatregnumber',
                                'custentity_lmry_digito_verificator',
                                'companyname',
                                'firstname',
                                'lastname'
                            ],
                        });
                        /*VendSearch = VendSearch.run().getRange(0, 1000);
                        if (VendSearch != null && VendSearch != '') {
                            return VendSearch;
                        } else {
                            return null;
                        }*/
                        let vendorArray = [];
                        let pageData = VendSearch.runPaged({ pageSize: 1000 });
                        if (pageData) {
                            pageData.pageRanges.forEach(function (pageRange) {
                                let page = pageData.fetch({ index: pageRange.index });
                                let results = page.data;
                                if (results) {
                                    vendorArray = vendorArray.concat(results);
                                }
                            });
                        }
                        return vendorArray;
                    }

                    function viewMain(context) {
                        let Rd_xml = context.request.parameters.custparam_xml;
                        let form = serverWidget.createForm({
                            title: translations.get(Language, 0)
                        });
                        form.addFieldGroup({
                            id: 'group_pi',
                            label: translations.get(Language, 1)
                        });
                        let p_subsi = form.addField({
                            id: 'custpage_id_subsi',
                            label: translations.get(Language, 2),
                            type: serverWidget.FieldType.SELECT,
                            container: 'group_pi'
                        });
                        let p_period = form.addField({
                            id: 'custpage_id_period',
                            label: translations.get(Language, 3),
                            type: serverWidget.FieldType.SELECT,
                            source: 'period',
                            container: 'group_pi'
                        });
                        let p_texto = form.addField({
                            id: 'custpage_id_texto',
                            label: 'TEXTO',
                            type: serverWidget.FieldType.INLINEHTML,
                        });

                        let p_script = form.addField({
                            id: 'custpage_id_script',
                            label: 'TEXTO',
                            type: serverWidget.FieldType.INLINEHTML,
                        });
                        p_script.defaultValue = "<style>.menu-arba{text-align:center}.item-arba{border:1px solid #87ceeb;display:grid}.item-arba-retry{border:1px solid red;display:grid}.item-arba:hover{cursor:pointer;border:1px solid #00f;background-color:#87ceeb;color:blue}.item-link-arba{text-decoration:none}.item-arba-retry:hover{cursor:pointer;border:1px solid #c23b22;background-color:red;color:white}</style>";
                        let field_accounting_period = p_period;
                        field_accounting_period.addSelectOption({
                            value: '0',
                            text: ' '
                        });
                        let search_period = search.load({
                            id: 'customsearch_lmry_ar_open_acc_period'
                        });
                        let resul_period = search_period.run();
                        let lengt_period = resul_period.getRange({
                            start: 0,
                            end: 1000
                        });
                        if (lengt_period != null) {
                            for (let i = 0; i < lengt_period.length; i++) {
                                let varcolu = lengt_period[i].columns;
                                let valores = lengt_period[i].getValue(varcolu[0]);
                                let textos = lengt_period[i].getValue(varcolu[1]);
                                field_accounting_period.addSelectOption({
                                    value: valores.toString(),
                                    text: textos.toString()
                                });
                            }
                        }/**
                     * Modificacion - añadido filtro por entidad y tipo de persona juridica 
                     */
                        let p_entity = form.addField({
                            id: 'custpage_id_entity',
                            label: translations.get(Language, 35),
                            type: serverWidget.FieldType.SELECT,
                            container: 'group_pi'
                        });
                        p_entity.addSelectOption({
                            value: '0',
                            text: ' '
                        });
                        p_entity.addSelectOption({
                            value: '1',
                            text: translations.get(Language, 'Cliente')
                        });
                        p_entity.addSelectOption({
                            value: '2',
                            text: translations.get(Language, 'Vendor')
                        });
                        let p_juridic = form.addField({
                            id: 'custpage_id_juridic',
                            label: translations.get(Language, 36),
                            type: serverWidget.FieldType.SELECT,
                            source: 'customrecord_lmry_ar_cuitc_person_type',
                            container: 'group_pi'
                        });
                        const featureCheckInvalid = form.addField({
                            id: 'custpage_useinvalid',
                            label: 'Use valid CUIT',
                            type: serverWidget.FieldType.CHECKBOX,
                            container: 'group_pi'
                        });
                        featureCheckInvalid.defaultValue = 'T';
                        const featureCheckOpen = form.addField({
                            id: 'custpage_useopen',
                            label: 'Use Transaction Open',
                            type: serverWidget.FieldType.CHECKBOX,
                            container: 'group_pi'
                        });
                        /**
                         * ---------------------------------------------------------------------
                         */
                        let field_subi = p_subsi;
                        field_subi.addSelectOption({
                            value: '0',
                            text: ' '
                        });
                        let search_subsi = search.create({
                            type: 'subsidiary',
                            columns: ['internalid', 'name'],
                            filters: [['isinactive', 'is', 'F'], 'and', ['country', 'is', 'AR']]
                        });
                        let search_subsi2 = search_subsi.run().getRange({ start: 0, end: 100 });
                        if (search_subsi != null) {
                            for (let i = 0; i < search_subsi2.length; i++) {
                                let valores = search_subsi2[i].getValue('internalid');
                                let textos = search_subsi2[i].getValue('name');
                                field_subi.addSelectOption({
                                    value: valores.toString(),
                                    text: textos.toString()
                                });
                            }
                        }
                        if (Rd_xml != null && Rd_xml != '') {
                            p_texto.defaultValue = Rd_xml;
                            p_texto.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.DISABLED
                            });
                        }
                        //Creación del Log
                        let SubTabla = form.addSublist({ id: 'custpage_lst', type: serverWidget.SublistType.STATICLIST, label: translations.get(Language, 4) });
                        // Boton refrescar
                        SubTabla.addButton({
                            id: "custpage_btnrefresh",
                            label: translations.get(Language, 'Recargar'),
                            functionName: 'btnRefresh'
                        });
                        // Estructura del Log
                        SubTabla.addField({ id: 'custpage_lst_id', label: translations.get(Language, 5), type: serverWidget.FieldType.TEXT });
                        SubTabla.addField({ id: 'custpage_lst_sub', label: translations.get(Language, 2), type: serverWidget.FieldType.TEXT });
                        SubTabla.addField({ id: 'custpage_lst_per', label: translations.get(Language, 3), type: serverWidget.FieldType.TEXT });
                        SubTabla.addField({ id: 'custpage_lst_dat', label: translations.get(Language, 6), type: serverWidget.FieldType.TEXT });
                        SubTabla.addField({ id: 'custpage_lst_emp', label: translations.get(Language, 7), type: serverWidget.FieldType.TEXT });
                        SubTabla.addField({ id: 'custpage_lst_des', label: translations.get(Language, 8), type: serverWidget.FieldType.TEXTAREA });
                        SubTabla.addField({ id: 'custpage_lst_est', label: translations.get(Language, 9), type: serverWidget.FieldType.TEXT });
                        SubTabla.addField({ id: 'custpage_lst_filt', label: translations.get(Language, 37), type: serverWidget.FieldType.TEXT });
                        SubTabla.addField({ id: 'custpage_lst_detail', label: translations.get(Language, 10), type: serverWidget.FieldType.TEXTAREA });
                        SubTabla.addField({ id: 'custpage_lst_res', label: translations.get(Language, 11), type: serverWidget.FieldType.TEXT });
                        SubTabla.addField({ id: 'custpage_lst_las', label: translations.get(Language, 12), type: serverWidget.FieldType.TEXT });
                        // Busqueda Personalizada: LatamReady - AR WS Log View
                        let Search_Log = search.load({ id: 'customsearch_lmry_ar_ws_log_resumen' });
                        let Result_Log = Search_Log.run().getRange({ start: 0, end: 1000 });
                        let urlval = url.resolveScript({
                            deploymentId: 'customdeploy_lmry_ar_ws_arba_masivo_stlt',
                            scriptId: 'customscript_lmry_ar_ws_arba_masivo_stlt',
                        });
                        if (Result_Log != null) {
                            Result_Log.forEach((Result_LogItem, i) => {
                                const searchresult = Result_LogItem;
                                let colFields = Result_LogItem.columns;
                                let lg_id = "" + searchresult.getValue({ name: colFields[0].name });
                                if (lg_id != "") {
                                    SubTabla.setSublistValue({ id: 'custpage_lst_id', line: i, value: lg_id });
                                }
                                let lg_sub = "" + searchresult.getText({ name: colFields[1].name });
                                if (lg_sub != "") {
                                    SubTabla.setSublistValue({ id: 'custpage_lst_sub', line: i, value: lg_sub });
                                }
                                let lg_per = "" + searchresult.getText({ name: colFields[2].name });
                                if (lg_per != "") {
                                    SubTabla.setSublistValue({ id: 'custpage_lst_per', line: i, value: lg_per });
                                }
                                let lg_dat = "" + searchresult.getValue({ name: colFields[3].name });
                                if (lg_dat != "") {
                                    SubTabla.setSublistValue({ id: 'custpage_lst_dat', line: i, value: lg_dat });
                                }
                                let lg_emp = "" + searchresult.getText({ name: colFields[4].name });
                                if (lg_emp != "") {
                                    SubTabla.setSublistValue({ id: 'custpage_lst_emp', line: i, value: lg_emp });
                                }
                                let lg_des = "" + searchresult.getValue({ name: colFields[5].name });
                                if (lg_des != "") {
                                    SubTabla.setSublistValue({ id: 'custpage_lst_des', line: i, value: translations.get(Language, lg_des) });
                                }
                                let lg_est = "" + searchresult.getValue({ name: colFields[6].name });
                                let idEntityError = searchresult.getValue("custrecord_lmry_ar_ws_resumen_eid");
                                if (lg_est != "") {
                                    SubTabla.setSublistValue({
                                        id: 'custpage_lst_est', line: i, value: translations.get(Language, lg_est)
                                    });
                                }
                                const frases = ["Generados Correctamente", 'El periodo es inválido o inexistente', 'El padron consultado no se encuentra publicado'];

                                SubTabla.setSublistValue({
                                    id: 'custpage_lst_detail', line: i, value: `
                                <ul class='menu-arba'>
                                    <li class='item-arba'>
                                        <a class='item-link-arba' href='${urlval}&logId=${lg_id}'>${translations.get(Language, 16)}</a>
                                    </li>
                                    <li class='item-arba'>
                                        <a class='item-link-arba' href='${urlval}&status=${lg_id}'>${translations.get(Language, 25)}</a>
                                    </li>
                                    ${((idEntityError != "" && lg_est == "Finalizado" && !frases.some(palabra => lg_des.includes(palabra))) ? "<li class='item-arba-retry'> <a class='item-link-arba' href='" + urlval + "&retry=" + lg_id + "'>" + translations.get(Language, "Reintentar") + "<a></li>" : "")}
                                </ul>`
                                });
                                let lg_res = "" + searchresult.getValue({ name: colFields[7].name });
                                if (lg_res != "") {
                                    let codHtml = "<ul class='menu-arba'><li class='item-arba'><a class='item-link-arba' target='_blank' href='" + lg_res + "'>" + translations.get(Language, 26) + "</a></li></ul>";
                                    SubTabla.setSublistValue({ id: 'custpage_lst_res', line: i, value: codHtml });
                                }
                                let lg_las = "" + searchresult.getValue({ name: colFields[8].name });
                                if (lg_las != "") {
                                    SubTabla.setSublistValue({ id: 'custpage_lst_las', line: i, value: lg_las });
                                }
                                let lg_fil = "" + searchresult.getValue({ name: colFields[10].name });
                                if (lg_fil != "" && lg_fil.split("|").length > 0) {
                                    const filters = lg_fil.split("|");

                                    SubTabla.setSublistValue({
                                        id: 'custpage_lst_filt', line: i, value:
                                            (filters[0] != null ? translations.get(Language, dataArray[1][filters[0]]) + "<br>" : "")
                                            + (filters[1] != null ? translations.get(Language, dataArray[2][filters[1]]) + "<br>" : "")
                                            + (filters[2] != null ? translations.get(Language, dataArray[3][filters[2]]) + "<br>" : "")
                                            + (filters[3] != null ? translations.get(Language, dataArray[4][filters[3]]) : "")
                                    });
                                }
                            });
                        }
                        form.clientScriptModulePath = './AR_LIBRARY_MENSUAL/LMRY_WebServiceArbaMasivoCLNT_V2.1';
                        form.addSubmitButton({
                            label: translations.get(Language, 13)
                        });
                        return form;
                    }
                    function viewDetail(context) {
                        let logResumenID = context.request.parameters.logId;
                        let formLogResumen = serverWidget.createForm({
                            title: translations.get(Language, 14)
                        });
                        formLogResumen.addButton({
                            id: "custpage_btn_back",
                            label: translations.get(Language, 15),
                            functionName: 'btnBack'
                        });
                        formLogResumen.clientScriptModulePath = './AR_LIBRARY_MENSUAL/LMRY_WebServiceArbaMasivoCLNT_V2.1';
                        let translateCode = {
                            1: '<p style="color: red">' + translations.get(Language, 27) + '</p>',
                            2: '<p style="color: red">' + translations.get(Language, 28) + '</p>',
                            3: '<p style="color: orange">' + translations.get(Language, 29) + '</p>',
                            4: '<p style="color: red">' + translations.get(Language, 30) + '</p>',
                            5: '<p style="color: orange">' + translations.get(Language, 31) + '</p>',
                            6: '<p style="color: orange">' + translations.get(Language, 32) + '</p>',
                            7: '<p style="color: green">' + translations.get(Language, 33) + '</p>'
                        };

                        //construccion de la subslista
                        let sublistDetail = formLogResumen.addSublist({
                            id: "sublist_detail",
                            label: translations.get(Language, 16),
                            type: serverWidget.SublistType.STATICLIST
                        });

                        sublistDetail.addField({
                            id: "detail_entity",
                            label: translations.get(Language, 17),
                            type: serverWidget.FieldType.TEXT,
                        });
                        sublistDetail.addField({
                            id: "detail_problem",
                            label: translations.get(Language, 18),
                            type: serverWidget.FieldType.TEXT,
                        });

                        let json = search.lookupFields({
                            type: "customrecord_lmry_ar_ws_log_resumen",
                            id: logResumenID,
                            columns: ["custrecord_lmry_ar_ws_resumen_json", "custrecord_lmry_ar_ws_resumen_subsidiary", "custrecord_lmry_ar_ws_resumen_filt"]
                        });
                        let subsidiary = json.custrecord_lmry_ar_ws_resumen_subsidiary[0].value;

                        const jsonData = json.custrecord_lmry_ar_ws_resumen_json ? JSON.parse(json.custrecord_lmry_ar_ws_resumen_json) : {};
                        let filtersEntity = json.custrecord_lmry_ar_ws_resumen_filt;
                        filtersEntity = filtersEntity.split("|");
                        const jsonEntitys = {};
                        let urlCustomer = url.resolveRecord({
                            recordType: "customer",
                            recordId: ""
                        });
                        let urlVendor = url.resolveRecord({
                            recordType: "vendor",
                            recordId: ""
                        });
                        log.debug({
                            title: 'filters',
                            details: filtersEntity
                        });
                        if (Object.keys(jsonData).length > 0) {
                            if (filtersEntity[0] == 0 || filtersEntity[0] == 2) {
                                cargarEntity("vendor", Object.keys(jsonData)).forEach(function (e) {
                                    jsonEntitys[e.getValue("internalid")] = {
                                        name: (e.getValue("companyname") != "" ? e.getValue("companyname") : (e.getValue("firstname") + " " + e.getValue("lastname"))),
                                        type: "Vendor",
                                        url: urlVendor + "&id=" + e.getValue("internalid"),
                                        status: jsonData[e.getValue("internalid")] ? translateCode[jsonData[e.getValue("internalid")]] : translateCode[7]
                                    };
                                });
                            }
                            if (filtersEntity[0] == 0 || filtersEntity[0] == 1) {
                                cargarEntity("customer", Object.keys(jsonData)).forEach(function (e) {
                                    jsonEntitys[e.getValue("internalid")] = {
                                        name: (e.getValue("companyname") != "" ? e.getValue("companyname") : (e.getValue("firstname") + " " + e.getValue("lastname"))),
                                        type: "CustJob",
                                        url: urlCustomer + "&id=" + e.getValue("internalid"),
                                        status: jsonData[e.getValue("internalid")] ? translateCode[jsonData[e.getValue("internalid")]] : '-'
                                    };
                                });
                            }
                        }


                        let counter = 0;
                        for (const entity in jsonEntitys) {
                            const dataEntity = jsonEntitys[entity];
                            sublistDetail.setSublistValue({
                                id: 'detail_entity',
                                line: counter,
                                value: "<a href='" + dataEntity.url + "'>" + dataEntity.name + "</a>"
                            });
                            sublistDetail.setSublistValue({
                                id: 'detail_problem',
                                line: counter,
                                value: dataEntity.status
                            });
                            counter++;
                        }

                        return formLogResumen;
                    }
                    function viewProcesses(context) {
                        let logResumenID = context.request.parameters.status;
                        let formProcesses = serverWidget.createForm({
                            title: translations.get(Language, 19)
                        });
                        formProcesses.addButton({
                            id: "custpage_btn_back",
                            label: translations.get(Language, 15),
                            functionName: 'btnBack'
                        });
                        formProcesses.clientScriptModulePath = './AR_LIBRARY_MENSUAL/LMRY_WebServiceArbaMasivoCLNT_V2.1';
                        let date = search.lookupFields({
                            type: "customrecord_lmry_ar_ws_log_resumen",
                            id: logResumenID,
                            columns: ["created", "lastmodified"]
                        });
                        let sublistStatus = formProcesses.addSublist({
                            id: "custpage_sublist_status",
                            label: translations.get(Language, 20),
                            // tab: string,
                            type: serverWidget.SublistType.STATICLIST
                        });
                        sublistStatus.addField({
                            id: "status_index",
                            label: translations.get(Language, 21),
                            type: serverWidget.FieldType.TEXT,
                        });
                        sublistStatus.addField({
                            id: "status_datecreated",
                            label: translations.get(Language, 22),
                            type: serverWidget.FieldType.TEXT,
                        });
                        sublistStatus.addField({
                            id: "status_startdate",
                            label: translations.get(Language, 23),
                            type: serverWidget.FieldType.TEXT,
                        });
                        sublistStatus.addField({
                            id: "status_enddate",
                            label: translations.get(Language, 24),
                            type: serverWidget.FieldType.TEXT,
                        });
                        sublistStatus.addField({
                            id: "status_status",
                            label: translations.get(Language, 9),
                            type: serverWidget.FieldType.TEXT,
                        });
                        let searchSchedule = search.create({
                            type: "scheduledscriptinstance",
                            filters: [
                                [
                                    "scriptdeployment.scriptid", "is", "customdeploy_lmry_ar_ws_arba_masivo_schd"
                                ],
                                "and",
                                [
                                    "datecreated", search.Operator.ONORAFTER, date.created
                                ],
                                "and",
                                [
                                    "datecreated", search.Operator.ONORBEFORE, date.lastmodified
                                ]
                            ],
                            columns: [
                                "datecreated",
                                "startdate",
                                "enddate",
                                "status"
                            ]
                        }).run().getRange({ start: 0, end: 1000 });
                        let line = 0;
                        searchSchedule.map(function (instance) {
                            sublistStatus.setSublistValue({
                                id: "status_index",
                                line: line,
                                value: Number(line + 1).toFixed(0)
                            });
                            sublistStatus.setSublistValue({
                                id: "status_datecreated",
                                line: line,
                                value: instance.getValue("datecreated").toString()
                            });
                            sublistStatus.setSublistValue({
                                id: "status_startdate",
                                line: line,
                                value: instance.getValue("startdate").toString()
                            });
                            sublistStatus.setSublistValue({
                                id: "status_enddate",
                                line: line,
                                value: instance.getValue("enddate").toString()
                            });
                            sublistStatus.setSublistValue({
                                id: "status_status",
                                line: line,
                                value: instance.getValue("status").toString()
                            });
                            line++;
                        });
                        return formProcesses;
                    }
                    function retry(context) {
                        let nroLog = context.request.parameters.retry;
                        const dataParams = search.lookupFields({
                            type: "customrecord_lmry_ar_ws_log_resumen",
                            id: nroLog,
                            columns: ["custrecord_lmry_ar_ws_resumen_eid"]
                        });
                        let params = JSON.parse(dataParams.custrecord_lmry_ar_ws_resumen_eid);
                        let logObjPro = record.load({
                            type: 'customrecord_lmry_ar_ws_log_resumen',
                            id: nroLog
                        });
                        logObjPro.setValue({ fieldId: 'custrecord_lmry_ar_ws_resumen_descrip', value: ' ' });
                        logObjPro.setValue({ fieldId: 'custrecord_lmry_ar_ws_resumen_estado', value: 'Procesando' });
                        logObjPro.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        let redi_sche = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_lmry_ar_ws_arba_masivo_schd',
                            deploymentId: 'customdeploy_lmry_ar_ws_arba_masivo_schd',
                            params: params
                        });
                        redi_sche.submit();
                        let strhtml = "<html>";
                        strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
                            "<tr>" +
                            "</tr>" +
                            "<tr>" +
                            "<td class='text'>" +
                            "<div style=\"color: gray; font-size: 8pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">" + translations.get(Language, 34) + "</div>" +
                            "</td>" +
                            "</tr>" +
                            "</table>" +
                            "</html>";
                        redirect.toSuitelet({
                            scriptId: runtime.getCurrentScript().id,
                            deploymentId: runtime.getCurrentScript().deploymentId,
                            parameters: {
                                'custparam_xml': strhtml
                            }
                        });
                    }
                    if (context.request.parameters.logId) {
                        form = viewDetail(context);
                    }
                    else if (context.request.parameters.status) {
                        form = viewProcesses(context);
                    }
                    else if (context.request.parameters.retry) {
                        retry(context);
                    }
                    else {
                        form = viewMain(context);
                    }
                    context.response.writePage(form);
                    return;
                }
                let otherIDSave;
                let params = {};
                //En la derecha estan el id de estado y de user
                params['custscript_lmry_ar_ws_period'] = context.request.parameters.custpage_id_period;
                params['custscript_lmry_ar_ws_contador'] = 0;
                params['custscript_lmry_ar_ws_entity'] = 1;
                params['custscript_lmry_ar_ws_subsidiary'] = context.request.parameters.custpage_id_subsi;
                params['custscript_lmry_ar_ws_contador_exito'] = 0;
                // params['custscript_lmry_ar_ws_masivo'] = context.request.parameters.custpage_id_masivo;
                params['custscript_lmry_ar_ws_contador_error1'] = 0;
                params['custscript_lmry_ar_ws_contador_error2'] = 0;
                params['custscript_lmry_ar_ws_contador_error3'] = 0;
                params['custscript_lmry_ar_ws_contador_error4'] = 0;
                params['custscript_lmry_ar_ws_desc_error1'] = 'Vacio';
                params['custscript_lmry_ar_ws_desc_error2'] = 'Vacio';
                params['custscript_lmry_ar_ws_desc_error3'] = 'Vacio';
                params['custscript_lmry_ar_ws_desc_error4'] = 'Vacio';
                params['custscript_lmry_ar_ws_contador_omit'] = 0;
                params['custscript_lmry_ar_ws_desc_omit'] = 'Vacio';
                params['custscript_lmry_ar_ws_contador_vacio'] = 0;
                params['custscript_lmry_ar_ws_desc_vacio'] = 'Vacio';
                params['custscript_lmry_ar_ws_flag_e'] = context.request.parameters.custpage_id_entity;
                params['custscript_lmry_ar_ws_juridic_p'] = context.request.parameters.custpage_id_juridic;

                let searchLogPro = search.create({
                    type: 'customrecord_lmry_ar_ws_log_resumen',
                    columns: ['internalid'],
                    filters: ['custrecord_lmry_ar_ws_resumen_estado', 'is', 'Procesando']
                });
                let searchLogPro2 = searchLogPro.run().getRange({ start: 0, end: 1000 });
                if (searchLogPro2.length > 0) {
                    for (let i = 0; i < searchLogPro2.length; i++) {
                        let logObjPro = record.load({
                            type: 'customrecord_lmry_ar_ws_log_resumen',
                            id: searchLogPro2[i].getValue('internalid')
                        });
                        logObjPro.setValue({ fieldId: 'custrecord_lmry_ar_ws_resumen_descrip', value: 'Error en el proceso' });
                        logObjPro.setValue({ fieldId: 'custrecord_lmry_ar_ws_resumen_estado', value: 'Finalizado' });
                        otherIDSave = logObjPro.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                    }
                }
                let logObj = record.create({
                    type: 'customrecord_lmry_ar_ws_log_resumen',
                    isDynamic: true
                });
                logObj.setValue({ fieldId: 'custrecord_lmry_ar_ws_resumen_subsidiary', value: context.request.parameters.custpage_id_subsi });
                logObj.setValue({ fieldId: 'custrecord_lmry_ar_ws_resumen_period', value: context.request.parameters.custpage_id_period });
                logObj.setValue({ fieldId: 'custrecord_lmry_ar_ws_resumen_user', value: runtime.getCurrentUser().id });
                logObj.setValue({ fieldId: 'custrecord_lmry_ar_ws_resumen_descrip', value: '' });
                logObj.setValue({ fieldId: 'custrecord_lmry_ar_ws_resumen_estado', value: 'Procesando' });
                logObj.setValue({ fieldId: 'custrecord_lmry_ar_ws_resumen_json', value: '{}' });
                const filters = [params['custscript_lmry_ar_ws_flag_e'], params['custscript_lmry_ar_ws_juridic_p'], context.request.parameters.custpage_useinvalid, context.request.parameters.custpage_useopen];

                logObj.setValue({ fieldId: 'custrecord_lmry_ar_ws_resumen_filt', value: filters.join("|") });
                otherIDSave = logObj.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                try {
                    let redi_sche = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: 'customscript_lmry_ar_ws_arba_masivo_schd',
                        deploymentId: 'customdeploy_lmry_ar_ws_arba_masivo_schd',
                        params: params
                    });
                    redi_sche.submit();
                    let strhtml = "<html>";
                    strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
                        "<tr>" +
                        "</tr>" +
                        "<tr>" +
                        "<td class='text'>" +
                        "<div style=\"color: gray; font-size: 8pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">" + translations.get(Language, 34) + "</div>" +
                        "</td>" +
                        "</tr>" +
                        "</table>" +
                        "</html>";
                    redirect.toSuitelet({
                        scriptId: runtime.getCurrentScript().id,
                        deploymentId: runtime.getCurrentScript().deploymentId,
                        parameters: {
                            'custparam_xml': strhtml
                        }
                    });
                } catch (err) {
                    log.error('ERROR', 'Error en el Schedule - ' + err);
                }
            }
            catch (error) {
                log.error('ERROR', error);
            }
        };
        exports.onRequest = onRequest;
    });
