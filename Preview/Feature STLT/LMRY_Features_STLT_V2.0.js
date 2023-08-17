/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_Features_STLT_V2.0.js                       ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Oct 30 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define(['N/record', 'N/search', 'N/runtime', 'N/https', 'N/redirect', 'N/url', 'N/ui/serverWidget', 'N/ui/message', 'N/config'],
    function (record, search, runtime, https, redirect, url, serverWidget, message, config) {

        var LMRY_script = 'LatamReady - Features STLT';
        var grppri = '';
        var msgtitle = '';
        var msgtitle1 = '';
        var msgtitle2 = '';
        var msgmessage = '';
        var lblaccount = '';
        var lblcount = '';
        var lblmanager = '';
        var lblenvtype = '';
        var subresult = '';
        var sublblsubsi = '';
        var sublblcount = '';
        var sublbllocal = '';
        var sublblname = '';
        var sublblstatus = '';
        var btnnew = '';
        var featureOW = false;

        var COUNTRIES = {
            'AR': {
                code: 11,
                name: 'Argentina'
            },
            'BO': {
                code: 29,
                name: 'Bolivia'
            },
            'BR': {
                code: 30,
                name: 'Brazil'
            },
            'CL': {
                code: 45,
                name: 'Chile'
            },
            'CO': {
                code: 48,
                name: 'Colombia'
            },
            'CR': {
                code: 49,
                name: 'Costa Rica'
            },
            'EC': {
                code: 63,
                name: 'Ecuador'
            },
            'SV': {
                code: 208,
                name: 'El Salvador'
            },
            'GT': {
                code: 91,
                name: 'Guatemala'
            },
            'MX': {
                code: 157,
                name: 'Mexico'
            },
            'NI': {
                code: 165,
                name: 'Nicaragua'
            },
            'PA': {
                code: 173,
                name: 'Panama'
            },
            'PY': {
                code: 186,
                name: 'Paraguay'
            },
            'PE': {
                code: 174,
                name: 'Peru'
            },
            'DO': {
                code: 61,
                name: 'Dominican Republic'
            },
            'UY': {
                code: 231,
                name: 'Uruguay'
            },
            'US': {
                code: 230,
                name: 'United States'
            }
        };

        function onRequest(scriptContext) {
            try {
                var Language = runtime.getCurrentScript().getParameter({
                    name: 'LANGUAGE'
                });
                Language = Language.substring(0, 2);

                switch (Language) {
                    case 'es':
                        grppri = 'Información Primaria';
                        msgtitle = 'Alerta';
                        msgtitle1 = 'Error';
                        msgtitle2 = 'Confirmación';
                        msgmessage = 'No hay cuentas disponibles<br>Por favor comunicarse con LatamReady.';
                        msgmessage1 = 'Se ha registrado la configuración de la subsidiaria "LatamReady".';
                        msgmessage2 = 'Se ha actualizado la configuración de la subsidiaria "LatamReady".';
                        lblaccount = 'CUENTA';
                        lblcount = 'CONFIGURACIONES DISPONIBLES';
                        lblmanager = 'GERENTE DE EMPLEADOS';
                        lblenvtype = 'AMBIENTE';
                        subresult = 'RESULTADO';
                        sublblsubsi = 'SUBSIDIARIA';
                        sublblcount = 'PAÍS';
                        sublbllocal = 'LOCALIZACIÓN';
                        sublblname = 'NOMBRE';
                        sublblstatus = 'ESTADO';
                        btnnew = 'Nuevo';
                        break;
                    case 'pt':
                        grppri = 'Informação Primária';
                        msgtitle = 'Alerta';
                        msgtitle1 = 'Erro';
                        msgtitle2 = 'Confirmação';
                        msgmessage = 'Não há contas disponíveis<br>Entre em contato com LatamReady.';
                        msgmessage1 = 'A configuração da subsidiária "LatamReady" foi registrada.';
                        msgmessage2 = 'A configuração da subsidiária "LatamReady" foi atualizada.';
                        lblaccount = 'CONTA';
                        lblcount = 'CONFIGURAÇÕES DISPONÍVEIS';
                        lblmanager = 'GERENTE DE FUNCIONÁRIOS';
                        lblenvtype = 'AMBIENTE';
                        subresult = 'RESULTADO';
                        sublblsubsi = 'SUBSIDIÁRIA';
                        sublblcount = 'PAÍS';
                        sublbllocal = 'LOCALIZAÇÃO';
                        sublblname = 'NAME';
                        sublblstatus = 'STATUS';
                        btnnew = 'Novo';
                        break;
                    default:
                        grppri = 'Primary Information';
                        msgtitle = 'Alert';
                        msgtitle1 = 'Error';
                        msgtitle2 = 'Confirmation';
                        msgmessage = 'There are no accounts available<br>Please contact LatamReady.';
                        msgmessage1 = 'The configuration of the subsidiary "LatamReady" has been registered.';
                        msgmessage2 = 'The configuration of the subsidiary "LatamReady" has been updated.';
                        lblaccount = 'ACCOUNT';
                        lblcount = 'CONFIGURATIONS AVAILABLE';
                        lblmanager = 'EMPLOYEE MANAGER';
                        lblenvtype = 'ENVIRONMENT';
                        subresult = 'RESULT';
                        sublblsubsi = 'SUBSIDIARY';
                        sublblcount = 'COUNTRY';
                        sublbllocal = 'LOCALIZATION';
                        sublblname = 'NAME';
                        sublblstatus = 'STATUS';
                        btnnew = 'New';
                }

                featureOW = runtime.isFeatureInEffect({feature: 'SUBSIDIARIES'});

                if (scriptContext.request.method == 'GET') {

                    var Rd_Subsi = scriptContext.request.parameters.subsi;
                    var Rd_Result = scriptContext.request.parameters.result;
                    var Rd_Nuevo = scriptContext.request.parameters.new;

                    //Formulario
                    var form = serverWidget.createForm({
                        title: 'Setup LatamReady'
                    });
                    form.addFieldGroup({
                        id: 'group_pi',
                        label: grppri
                    });

                    var p_account = form.addField({
                        id: 'custpage_id_account',
                        label: lblaccount,
                        type: serverWidget.FieldType.INLINEHTML,
                        container: 'group_pi'
                    });
                    p_account.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.DISABLED
                    });
                    p_account.defaultValue = '<p class="smallgraytextnolink" style="font-size:12px;margin: 10px 0px 0px 10px">' + lblaccount + '</p><p style="font-weight:bold;font-size:16px;margin-left:10px">' + runtime.accountId + '</p>';

                    var p_url = form.addField({
                        id: 'custpage_id_url',
                        label: 'URL',
                        type: serverWidget.FieldType.INLINEHTML,
                        container: 'group_pi'
                    });
                    p_url.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.DISABLED
                    });
                    var urlinstance = runtime.getCurrentScript().getParameter('custscript_lmry_netsuite_location');
                    var output = url.resolveDomain({
                        hostType: url.HostType.APPLICATION,
                    });
                    if (urlinstance != output) {
                        throw 'Instance URL is invalid'
                    }
                    log.error('compare stlt-instance', [urlinstance,output].join('-'));
                    p_url.defaultValue = '<p class="smallgraytextnolink" style="font-size:12px;margin: 10px 0px 0px 10px">URL</p><p style="font-weight:bold;font-size:16px;margin-left:10px">' + urlinstance + '</p>';

                    var p_manager = form.addField({
                        id: 'custpage_id_manager',
                        label: 'MANAGER',
                        type: serverWidget.FieldType.INLINEHTML,
                        container: 'group_pi'
                    });
                    p_manager.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.DISABLED
                    });
                    var manager = '';
                    var managerid = runtime.getCurrentScript().getParameter('custscript_lmry_employee_manager');
                    if (managerid != null && managerid != '') {
                        var employeedata = search.lookupFields({
                            type: 'employee',
                            id: managerid,
                            columns: ['firstname', 'lastname']
                        });
                        manager = employeedata.firstname + ' ' + employeedata.lastname;
                    }
                    
                    p_manager.defaultValue = '<p class="smallgraytextnolink" style="font-size:12px;margin: 10px 0px 0px 10px">' + lblmanager + '</p><p style="font-weight:bold;font-size:16px;margin-left:10px">' + manager + '</p>';


                    var p_envtype = form.addField({
                        id: 'custpage_id_envtype',
                        label: lblenvtype,
                        type: serverWidget.FieldType.INLINEHTML,
                        container: 'group_pi'
                    });
                    p_envtype.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.DISABLED
                    }).updateBreakType({
                        breakType: serverWidget.FieldBreakType.STARTCOL
                    });
                    p_envtype.defaultValue = '<p class="smallgraytextnolink" style="font-size:12px;margin: 10px 0px 0px 10px">' + lblenvtype + '</p><p style="font-weight:bold;font-size:16px;margin-left:10px">' + runtime.envType + '</p>';

                    var objResult = '';
                    var status = false;
                    var count = 0;
                    //  verifica que la comuncion no se caya durante 15 veces.
                    while (!status && count < 15) {

                        try {
                            var objResponse = https.post({
                                url: 'https://tstdrv1930452.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=692&deploy=2&compid=TSTDRV1930452&h=b2a77873b5cf06dd6fb3',
                                body: JSON.stringify({
                                    'country': 'AR',
                                    'language': Language.toUpperCase()
                                }),
                                headers: {
                                    "lmry-account": runtime.accountId,
                                    "lmry-action": 'getLatamSetup',
                                    "Content-Type": 'application/json'
                                }
                            });
                            objResult = JSON.parse(objResponse.body);
                            status = true;
                        } catch (err) {
                            status = false;
                            objResult = '';
                        }
                        count++;
                    }
                    log.error('objResult', objResult);
                    if (objResult.error) {
                        throw objResult.error;
                    }

                    var p_count = form.addField({
                        id: 'custpage_id_count',
                        label: lblcount,
                        type: serverWidget.FieldType.INLINEHTML,
                        container: 'group_pi'
                    });
                    if (parseInt(objResult['available_licenses']) >= 0) {
                        p_count.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                        p_count.defaultValue = '<p class="smallgraytextnolink" style="font-size:12px;margin: 10px 0px 0px 10px">' + lblcount + '</p><p style="font-weight:bold;font-size:16px;margin-left:10px">' + (objResult['available_licenses']).toFixed(0) + '</p>';
                    } else {
                        p_count.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                        //p_count.defaultValue = (objResult['available_licenses']).toFixed(0);
                    }


                    if (parseInt(objResult['available_licenses']) == 0) {
                        form.addPageInitMessage({
                            type: message.Type.WARNING,
                            title: msgtitle,
                            message: msgmessage,
                            duration: 0
                        });
                    }

                    if (Rd_Result != null && Rd_Result != '' && Rd_Result != undefined) {
                        if (Rd_Result == 0) {
                            form.addPageInitMessage({
                                type: message.Type.ERROR,
                                title: msgtitle1,
                                message: msgmessage,
                                duration: 5000
                            });
                        } else {
                            var replace = '';
                            if(featureOW){
                                var subsi = search.lookupFields({
                                    type: 'customrecord_lmry_features_by_subsi',
                                    id: Rd_Result,
                                    columns: ['custrecord_lmry_features_subsidiary']
                                });
                                replace = subsi.custrecord_lmry_features_subsidiary[0].text;
                            } else{
                                var configRecObj = config.load({
                                    type: config.Type.COMPANY_INFORMATION
                                });
                                replace = configRecObj.getValue({fieldId:'companyname'});
                            }
                            
                            if (Rd_Nuevo == 1) {
                                form.addPageInitMessage({
                                    type: message.Type.CONFIRMATION,
                                    title: msgtitle2,
                                    message: msgmessage1.replace('LatamReady', replace),
                                    duration: 10000
                                });
                            } else {
                                form.addPageInitMessage({
                                    type: message.Type.CONFIRMATION,
                                    title: msgtitle2,
                                    message: msgmessage2.replace('LatamReady', replace),
                                    duration: 10000
                                });
                            }
                        }
                    }


                    //Sublista
                    var sublist = form.addSublist({
                        id: 'custpage_lst',
                        type: serverWidget.SublistType.LIST,
                        label: subresult
                    });

                    sublist.addField({
                        id: 'id_subsi',
                        label: sublblsubsi,
                        type: serverWidget.FieldType.TEXT
                    });

                    sublist.addField({
                        id: 'id_coun',
                        label: sublblcount,
                        type: serverWidget.FieldType.TEXT
                    });

                    sublist.addField({
                        id: 'id_status',
                        label: sublblstatus,
                        type: serverWidget.FieldType.TEXT
                    });

                    //Llena la sublista
                    searchInv = searchOW();

                    if (searchInv != null && searchInv != '') {
                        if(featureOW){
                            var columnas = searchInv[0].columns;

                            for (var i = 0; i < searchInv.length; i++) {
                                var urlRedi = url.resolveScript({
                                    scriptId: 'customscript_lmry_features_subsi_stlt',
                                    deploymentId: 'customdeploy_lmry_features_subsi_stlt',
                                    returnExternalUrl: false
                                });
                                var subsicountry = searchInv[i].getValue(columnas[4]);
                                var DataFeature = searchInv[i].getValue(columnas[2]);
                                var DataParent = searchInv[i].getValue(columnas[3]);
                                var IsActive = searchInv[i].getValue(columnas[5]);
                                if (DataParent) {
                                    /*var nameParent = search.lookupFields({
                                        type: 'subsidiary',
                                        id: DataParent,
                                        columns: ['name']
                                    });*/
                                    var Datasplit = DataFeature.split(' : ');
                                    var lengthsplit = Datasplit.length;
                                    DataFeature = Datasplit[lengthsplit - 1];
                                }
                                urlRedi += '&new=0&subsi=' + searchInv[i].getValue('custrecord_lmry_features_subsidiary');
                                if (DataFeature != null && DataFeature != '') {
                                    sublist.setSublistValue({
                                        id: 'id_subsi',
                                        line: i,
                                        value: '<a href="' + urlRedi + '">' + DataFeature + '</a>'
                                    });
                                }
    
                                if (subsicountry != null && subsicountry != '') {
                                    sublist.setSublistValue({
                                        id: 'id_coun',
                                        line: i,
                                        value: COUNTRIES[subsicountry].name//name.country[0].text
                                    });
                                }
                                var statusLine = false;
                                if (IsActive == 'F' || IsActive == false) statusLine = true;
                                sublist.setSublistValue({
                                    id: 'id_status',
                                    line: i,
                                    value: statusLine ? 'Active' : 'Inactive'
                                });
    
                            }
                        } else{
                            var urlRedi = url.resolveScript({
                                scriptId: 'customscript_lmry_features_subsi_stlt',
                                deploymentId: 'customdeploy_lmry_features_subsi_stlt',
                                returnExternalUrl: false
                            });
                            urlRedi += '&new=0&subsi=1';
                            sublist.setSublistValue({
                                id: 'id_subsi',
                                line: 0,
                                value: '<a href="' + urlRedi + '">' + searchInv[0].name + '</a>'
                            });
                            sublist.setSublistValue({
                                id: 'id_coun',
                                line: 0,
                                value: COUNTRIES[searchInv[0].country].name
                            });
                            sublist.setSublistValue({
                                id: 'id_status',
                                line: 0,
                                value: 'Active'
                            });
                        }
                        
                    }

                    if (parseInt(objResult['available_licenses']) != 0) {
                        form.addSubmitButton({
                            label: btnnew
                        });
                    }


                    // Dibuja el fomulario
                    scriptContext.response.writePage(form);

                } else {
                    redirect.toSuitelet({
                        scriptId: 'customscript_lmry_features_subsi_stlt',
                        deploymentId: 'customdeploy_lmry_features_subsi_stlt',
                        parameters: {
                            'new': 1
                        }
                    });
                }

            } catch (err) {
                log.error('ERROR', err);
                var Language = runtime.getCurrentScript().getParameter({
                    name: 'LANGUAGE'
                });
                Language = Language.substring(0, 2);

                switch (Language) {
                    case 'es':
                        var important = 'Importante';
                        var msgtitle = 'Importante: Actualmente no esta configurado LatamReady.';
                        break;
                    case 'pt':
                        var important = 'Importante';
                        var msgtitle = 'Importante: LatamReady não está configurado no momento.';
                        break;
                    default:
                        var important = 'Important';
                        var msgtitle = 'Important: LatamReady is not currently configured.';
                }
                var form = serverWidget.createForm({
                    title: 'Setup LatamReady'
                });
                var myInlineHtml = form.addField({
                    id: 'custpage_lmry_v_message',
                    label: important,
                    type: serverWidget.FieldType.INLINEHTML
                });

                myInlineHtml.updateLayoutType({
                    layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
                });
                myInlineHtml.updateBreakType({
                    breakType: serverWidget.FieldBreakType.STARTCOL
                });
                // Mensaje para el cliente
                var strhtml = "<html>";
                strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
                    "<tr>" +
                    "</tr>" +
                    "<tr>" +
                    "<td class='text'>" +
                    "<div style=\"color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">" + msgtitle + "</div>" +
                    "</td>" +
                    "</tr>" +
                    "</table>" +
                    "</html>";
                myInlineHtml.defaultValue = strhtml;
                scriptContext.response.writePage(form);
            }
        }

        function searchOW(){
            if(featureOW){
                var searchOW = search.create({
                    type: 'customrecord_lmry_features_by_subsi',
                    columns: [
                        'internalid', 'custrecord_lmry_features_subsidiary', 'custrecord_lmry_features_subsidiary.name',
                        'custrecord_lmry_features_subsidiary.parent', 'custrecord_lmry_features_subsidiary.country', 'custrecord_lmry_features_subsidiary.isinactive'],
                    filters: [
                        ['isinactive', 'is', 'F']
                    ]
                });
                return searchOW.run().getRange(0, 1000);
            } else{
                var JsonSalida = [];
                var searchOW = search.create({
                    type: 'customrecord_lmry_features_by_subsi',
                    columns: ['internalid'],
                    filters: [
                        ['isinactive', 'is', 'F']
                    ]
                });
                searchOW = searchOW.run().getRange(0, 1);
                if(searchOW != null && searchOW != ''){
                    var configRecObj = config.load({
                        type: config.Type.COMPANY_INFORMATION
                    });
                    JsonSalida.push({
                        country: configRecObj.getValue({fieldId:'country'}),
                        name: configRecObj.getValue({fieldId:'companyname'})
                    });
                }
                return JsonSalida;
            }
            
        }

        return {
            onRequest: onRequest
        };

    });