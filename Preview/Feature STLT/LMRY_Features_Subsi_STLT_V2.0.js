/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_Features_Subsi_STLT_V2.0.js                 ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Oct 30 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define(['N/record', 'N/search', 'N/runtime', 'N/crypto', 'N/redirect', 'N/ui/serverWidget', 'N/https', 'N/encode', 'N/config', './Latam_Library/LMRY_MD5_encript_LBRY_V2.0.js'],
    function (record, search, runtime, crypto, redirect, serverWidget, https, encode, config, libraryMD5) {

        var LMRY_script = 'LatamReady - Subsidiary Features STLT';
        var grppri = '';
        var lblsubs = '';
        var lblcount = '';
        var subresult = '';
        var sublblappl = '';
        var sublblinid = '';
        var sublbldesc = '';
        var sublblname = '';
        var btnsave = '';
        var btnrequest = '';
        var btnback = '';
        var noinfo = '';
        var featureOW = false;
        var OWName = '';
        var OWCountry = '';

        var IDCountry = 0;
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
                        lblsubs = 'SUBSIDIARIA';
                        lblcount = 'PAÍS';
                        subresult = 'RESULTADO';
                        sublblappl = 'APLICAR';
                        sublblinid = 'ID INTERNO';
                        sublbldesc = 'DESCRIPCIÓN';
                        sublblname = 'NOMBRE';
                        btnsave = 'Guardar';
                        btnrequest = 'Solicitar Nuevas Funciones';
                        btnback = 'Atrás';
                        tabfeatures = 'Características';
                        tabinfo = 'Información';
                        lblinfo = 'Este formulario muestra las características propias de este país.';
                        noinfo = 'Sin información';
                        break;
                    case 'pt':
                        grppri = 'Informação Primária';
                        lblsubs = 'SUBSIDIÁRIA';
                        lblcount = 'PAÍS';
                        subresult = 'RESULTADO';
                        sublblappl = 'APLICAR';
                        sublblinid = 'ID INTERNA';
                        sublbldesc = 'DESCRIÇÃO';
                        sublblname = 'NAME';
                        btnsave = 'Salvar';
                        btnrequest = 'Solicitar Novos Recursos';
                        btnback = 'Atrás';
                        tabfeatures = 'Recursos';
                        tabinfo = 'Informação';
                        lblinfo = 'Este formulário mostra as próprias características deste país.';
                        noinfo = 'Sem informação';
                        break;
                    default:
                        grppri = 'Primary Information';
                        lblsubs = 'SUBSIDIARY';
                        lblcount = 'COUNTRY';
                        subresult = 'RESULT';
                        sublblappl = 'APPLY';
                        sublblinid = 'INTERNAL ID';
                        sublbldesc = 'DESCRIPTION';
                        sublblname = 'NAME';
                        btnsave = 'Save';
                        btnrequest = 'Request New Features';
                        btnback = 'Back';
                        tabfeatures = 'Features';
                        tabinfo = 'Information';
                        lblinfo = 'This form shows the own characteristics of this country';
                        noinfo = 'No information';
                }

                featureOW = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });

                if (scriptContext.request.method == 'GET') {

                    var Rd_Subsi = scriptContext.request.parameters.subsi;
                    var Rd_Count = scriptContext.request.parameters.count;
                    var Rd_New = scriptContext.request.parameters.new;

                    var status = false;
                    var count = 0;
                    var objResult = '';

                    var configRecObj = config.load({
                        type: config.Type.COMPANY_INFORMATION
                    });
                    OWCountry = configRecObj.getValue({ fieldId: 'country' });
                    OWName = configRecObj.getValue({ fieldId: 'companyname' });

                    //Formulario
                    var form = serverWidget.createForm({
                        title: 'LatamReady - Enable Features by Subsidiary'
                    });
                    form.addFieldGroup({
                        id: 'group_pi',
                        label: grppri
                    });

                    var p_country = form.addField({
                        id: 'custpage_id_country',
                        label: lblcount,
                        type: serverWidget.FieldType.SELECT,
                        container: 'group_pi'
                    });
                    p_country.addSelectOption({
                        value: 0,
                        text: ''
                    });
                    for (var i in COUNTRIES) {
                        p_country.addSelectOption({
                            value: i,
                            text: COUNTRIES[i]['name']
                        });
                    }

                    p_country.updateBreakType({
                        breakType: serverWidget.FieldBreakType.STARTCOL
                    });

                    var p_new = form.addField({
                        id: 'custpage_id_new',
                        label: 'NEW',
                        type: serverWidget.FieldType.TEXT,
                        container: 'group_pi'
                    });
                    p_new.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                    p_new.defaultValue = Rd_New;

                    var p_paramsubsi = form.addField({
                        id: 'custpage_param_subsi',
                        label: 'Subsi Param',
                        type: serverWidget.FieldType.TEXT,
                        container: 'group_pi'
                    });
                    p_paramsubsi.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                    p_paramsubsi.defaultValue = Rd_Subsi;

                    var p_ow = form.addField({
                        id: 'custpage_id_ow',
                        label: 'OW',
                        type: serverWidget.FieldType.TEXT,
                        container: 'group_pi'
                    });
                    p_ow.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                    p_ow.defaultValue = [OWCountry, OWName].join('|');

                    var p_subsi = form.addField({
                        id: 'custpage_id_subsi',
                        label: lblsubs,
                        type: serverWidget.FieldType.SELECT,
                        container: 'group_pi'
                    });
                    p_subsi.updateBreakType({
                        breakType: serverWidget.FieldBreakType.STARTCOL
                    }).updateLayoutType({
                        layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
                    });

                    //log.error('Rd_Subsi,Rd_New',Rd_Subsi+','+Rd_New);
                    if ((Rd_Subsi != null && Rd_Subsi != '' && Rd_Subsi != 0) && (Rd_New == 2 || Rd_New == 0)) {
                        if (featureOW) {
                            var country = search.lookupFields({
                                type: 'subsidiary',
                                id: parseInt(Rd_Subsi),
                                columns: ['country']
                            }).country[0].value;
                            var subsiSearch = search.create({
                                type: 'subsidiary',
                                columns: ['internalid', 'name'],
                                filters: [
                                    ['country', 'is', country], 'AND',
                                    ['isinactive', 'is', 'F']
                                ]
                            });
                            subsiSearch = subsiSearch.run().getRange(0, 1000);

                            p_subsi.addSelectOption({
                                value: 0,
                                text: ''
                            });

                            if (subsiSearch != null && subsiSearch != '') {

                                for (var i = 0; i < subsiSearch.length; i++) {
                                    p_subsi.addSelectOption({
                                        value: subsiSearch[i].getValue('internalid'),
                                        text: subsiSearch[i].getValue('name')
                                    });
                                }
                            }
                            p_subsi.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.DISABLED
                            });
                            p_subsi.defaultValue = Rd_Subsi;

                            p_country.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.DISABLED
                            });
                            p_country.defaultValue = country;

                            //  verifica que la comuncion no se caya durante 15 veces.
                            while (!status && count < 15) {

                                try {
                                    var objResponse = https.post({
                                        url: 'https://tstdrv1930452.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=692&deploy=2&compid=TSTDRV1930452&h=b2a77873b5cf06dd6fb3',
                                        body: JSON.stringify({
                                            'country': country,
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

                        } else {

                            p_country.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.DISABLED
                            });
                            p_country.defaultValue = OWCountry;

                            p_subsi.addSelectOption({
                                value: 1,
                                text: OWName
                            });
                            p_subsi.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.DISABLED
                            });
                            p_subsi.defaultValue = 1;

                            while (!status && count < 15) {

                                try {
                                    var objResponse = https.post({
                                        url: 'https://tstdrv1930452.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=692&deploy=2&compid=TSTDRV1930452&h=b2a77873b5cf06dd6fb3',
                                        body: JSON.stringify({
                                            'country': OWCountry,
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
                        }

                    }

                    //if (Rd_New == 1) {
                    form.addButton({
                        id: 'buttonBackToMain',
                        label: btnback,
                        functionName: 'backToMain()'
                    });
                    //}

                    log.error('objResult', objResult);

                    if (objResult != null && objResult != '') {
                        var tabs = objResult['enabled_features'];

                        if (tabs == 'Does not have features') {
                            throw { message: 'Does not have features' };
                        }

                        var tab1 = form.addTab({
                            id: 'custpage_t',
                            label: tabfeatures
                        });


                        var tab2 = form.addTab({
                            id: 'custpage_t2',
                            label: tabinfo
                        });
                        var fieldObj = form.addField({
                            id: 'custpage_dsfdg',
                            type: serverWidget.FieldType.INLINEHTML,
                            label: 'value',
                            container: 'custpage_t2'
                        });
                        fieldObj.defaultValue = '<p class="smallgraytextnolink" style="font-size:12px;margin: 10px 0px 0px 10px">' + lblinfo + '</p>';

                        for (var i = 0; i < tabs.length; i++) {
                            var idTab = 'custpage_g' + i;
                            var fg = form.addFieldGroup({
                                id: idTab,
                                label: tabs[i]['tab'],
                                tab: 'custpage_t'
                            });
                            fg.isBorderHidden = false;
                            fg.isSingleColumn = true;
                            var featuresEnabled = tabs[i]['features'];
                            for (var j = 0; j < featuresEnabled.length; j++) {
                                var idField = 'custpage_f' + featuresEnabled[j]['code'];
                                idField = idField.replace('-', '_');
                                var fieldObj = form.addField({
                                    id: idField,
                                    type: serverWidget.FieldType.CHECKBOX,
                                    label: featuresEnabled[j]['name'],
                                    container: idTab
                                });
                                if (featuresEnabled[j]['description'] != '' && featuresEnabled[j]['description'] != null) {
                                    fieldObj.setHelpText({
                                        help: featuresEnabled[j]['description']
                                    });
                                } else {
                                    fieldObj.setHelpText({
                                        help: noinfo
                                    });
                                }

                            }
                        }

                    }

                    form.addSubmitButton({
                        label: btnsave
                    });

                    if ((Rd_Subsi != null && Rd_Subsi != '' && Rd_Subsi != 0) && (Rd_New == 2 || Rd_New == 0)) {
                        form.addButton({
                            id: 'buttonAvailableFeatures',
                            label: btnrequest,
                            functionName: 'requestnewfeatures(' + Rd_Subsi + ')'
                        });
                    }


                    // Script Cliente
                    form.clientScriptModulePath = './Latam_Library/LMRY_Features_Subsi_CLNT_V2.0.js';
                    // Dibuja el fomulario
                    scriptContext.response.writePage(form);

                } else {
                    var subsi = scriptContext.request.parameters.custpage_id_subsi;
                    var nuevo = scriptContext.request.parameters.custpage_id_new;
                    var parametros = scriptContext.request.parameters;
                    var features = [];

                    if (nuevo == 0) {
                        //actualiza
                        var idConfig = 0;
                        var searchConfig = search.create({
                            type: 'customrecord_lmry_features_by_subsi',
                            columns: ['internalid'],
                            filters: [
                                ['isinactive', 'is', 'F']
                            ]
                        });
                        if (featureOW) {
                            searchConfig.filters.push(search.createFilter({
                                name: 'custrecord_lmry_features_subsidiary',
                                operator: 'is',
                                values: subsi
                            }));
                        }
                        searchConfig = searchConfig.run().getRange(0, 1);
                        if (searchConfig) {
                            idConfig = searchConfig[0].getValue('internalid');
                        }

                        //Valores
                        for (var i in parametros) {
                            if ('custpage_f' == i.substring(0, 10)) {
                                var value = scriptContext.request.parameters[i];
                                if (value == true || value == 'T') {
                                    var id = i.substring(10, i.length);
                                    if (i.substring(10, 11) == '_') {
                                        id = -1 * parseInt(id.substring(1, id.length));
                                    } else {
                                        id = parseInt(id);
                                    }
                                    features.push(id);
                                }
                            }
                        }
                        var featureArray = features;
                        if (features.length > 0) {
                            features = features.join('\000');
                        } else {
                            throw { message: 'No features active' };
                        }
                        //LatamReady - Log Enable Features
                        var logObj = record.create({
                            type: 'customrecord_lmry_log_enable_feature'
                        });
                        logObj.setValue('custrecord_lmry_log_feat_user', runtime.getCurrentUser().id);
                        logObj.setValue('custrecord_lmry_log_feat_role', runtime.getCurrentUser().role);
                        logObj.setValue('custrecord_lmry_log_feat_features', JSON.stringify(featureArray));
                        if (featureOW) {
                            logObj.setValue('custrecord_lmry_log_feat_subsidiary', subsi);
                        } else {
                            logObj.setValue('custrecord_lmry_log_feat_subsidiary', 1);
                        }
                        logObj.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true,
                            dissableTriggers: true
                        });

                        record.submitFields({
                            type: 'customrecord_lmry_features_by_subsi',
                            id: idConfig,
                            values: {
                                custrecord_lmry_features_data: features,
                                custrecord_lmry_features_crytpo: libraryMD5.encrypt('Features' + features)
                            },
                            options: {
                                enablesourcing: true,
                                ignoreMandatoryFields: true
                            }
                        });

                        updateWS(subsi);

                        redirect.toSuitelet({
                            scriptId: 'customscript_lmry_features_stlt',
                            deploymentId: 'customdeploy_lmry_features_stlt',
                            parameters: {
                                'result': idConfig,
                                'new': 0
                            }
                        });

                    } else if (nuevo == 1) {

                        redirect.toSuitelet({
                            scriptId: runtime.getCurrentScript().id,
                            deploymentId: runtime.getCurrentScript().deploymentId,
                            parameters: {
                                'subsi': subsi,
                                'new': 2
                            }
                        });

                    } else {
                        //Valores
                        for (var i in parametros) {
                            if ('custpage_f' == i.substring(0, 10)) {
                                //log.error('parametros[i]', parametros[i]);
                                var value = scriptContext.request.parameters[i];
                                if (value == true || value == 'T') {
                                    var id = i.substring(10, i.length);
                                    if (i.substring(10, 11) == '_') {
                                        id = -1 * parseInt(id.substring(1, id.length));
                                    } else {
                                        id = parseInt(id);
                                    }
                                    features.push(id);
                                }
                            }
                        }
                        var featureArray = features;
                        if (features.length > 0) {
                            features = features.join('\000');
                        } else {
                            throw { message: 'No features active' };
                        }

                        //LatamReady - Log Enable Features
                        var logObj = record.create({
                            type: 'customrecord_lmry_log_enable_feature'
                        });
                        logObj.setValue('custrecord_lmry_log_feat_user', runtime.getCurrentUser().id);
                        logObj.setValue('custrecord_lmry_log_feat_role', runtime.getCurrentUser().role);
                        logObj.setValue('custrecord_lmry_log_feat_features', JSON.stringify(featureArray));
                        if (featureOW) {
                            logObj.setValue('custrecord_lmry_log_feat_subsidiary', subsi);
                        } else {
                            logObj.setValue('custrecord_lmry_log_feat_subsidiary', 1);
                        }
                        logObj.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true,
                            dissableTriggers: true
                        });

                        //Nuevo
                        var recordObj = record.create({
                            type: 'customrecord_lmry_features_by_subsi'
                        });
                        if (features.length > 0) {
                            recordObj.setValue('custrecord_lmry_features_data', features);
                            recordObj.setValue('custrecord_lmry_features_crytpo', libraryMD5.encrypt('Features' + features));
                        }
                        recordObj.setValue('custrecord_lmry_features_subsidiary', subsi);

                        var idConfig = recordObj.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true,
                            dissableTriggers: true
                        });

                        updateWS(subsi);

                        redirect.toSuitelet({
                            scriptId: 'customscript_lmry_features_stlt',
                            deploymentId: 'customdeploy_lmry_features_stlt',
                            parameters: {
                                'result': idConfig,
                                'new': 1
                            }
                        });
                    }


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
                /*// Mensaje para el cliente
                var strhtml = "<html>";
                strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
                    "<tr>" +
                    "</tr>" +
                    "<tr>" +
                    "<td class='text'>" +
                    "<div style=\"color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">" + err.message + "</div>" +
                    "</td>" +
                    "</tr>" +
                    "</table>" +
                    "</html>";*/
                myInlineHtml.defaultValue = '<p class="smallgraytextnolink" style="font-size:12px;margin: 10px 0px 0px 10px">ERROR</p><p style="font-weight:bold;font-size:16px;margin-left:10px">' + err.message + '</p>';;

                form.addButton({
                    id: 'buttonBackToMain',
                    label: btnback,
                    functionName: 'backToMain()'
                });

                // Script Cliente
                form.clientScriptModulePath = './Latam_Library/LMRY_Features_Subsi_CLNT_V2.0.js';

                scriptContext.response.writePage(form);


            }
        }

        function createMd5Hash(inputString) {
            var hash = crypto.createHash({
                algorithm: crypto.HashAlg.MD5
            });
            var hashUpdated = hash.update({
                input: inputString,
                inputEncoding: encode.Encoding.UTF_8
            });
            var hashDigested = hash.digest({
                outputEncoding: encode.Encoding.HEX
            });
            return hashDigested;
        }

        function updateWS(subsi) {
            var ObjResultWS = '';
            var status = false;
            var count = 0;
            //  verifica que la comuncion no se caya durante 15 veces.
            while (!status && count < 15) {

                try {
                    var JsonBody = {};
                    if (featureOW) {
                        var data = search.lookupFields({
                            type: 'subsidiary',
                            id: subsi,
                            columns: ['country', 'name']
                        });
                        JsonBody = {
                            'country': data.country[0].value,
                            'subsidiary': {
                                'id': subsi,
                                'name': data.name
                            }
                        }
                    } else {
                        var configRecObj = config.load({
                            type: config.Type.COMPANY_INFORMATION
                        });
                        var coun = configRecObj.getValue({ fieldId: 'country' });
                        var name = configRecObj.getValue({ fieldId: 'companyname' });

                        JsonBody = {
                            'country': coun,
                            'subsidiary': {
                                'id': 1,
                                'name': name
                            }
                        }
                    }

                    var objResponse = https.post({
                        url: 'https://tstdrv1930452.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=692&deploy=2&compid=TSTDRV1930452&h=b2a77873b5cf06dd6fb3',
                        body: JSON.stringify(JsonBody),
                        headers: {
                            "lmry-account": runtime.accountId,
                            "lmry-action": 'updateLatamSetup',
                            "Content-Type": 'application/json'
                        }
                    });
                    ObjResultWS = JSON.parse(objResponse.body);
                    status = true;
                } catch (err) {
                    status = false;
                    ObjResultWS = '';
                }
                count++;
            }

            return true;
        }

        return {
            onRequest: onRequest
        };

    });