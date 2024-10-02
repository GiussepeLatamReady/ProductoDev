/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_Features_Subsi_CLNT_V2.0.js                 ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Oct 30 2019  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/search', 'N/url', 'N/https', 'N/runtime', 'N/translation'],
    function (search, url, https, runtime, translation) {


        var LMRY_script = 'LatamReady - Subsidiary Features CLNT';
        var recordObj = '';
        var type = '';
        var Language = '';
        var msgSubsi = '';
        var msgInst = '';
        var Mensaje1 = '';
        var Mensaje2 = '';
        var msgFeat = '';
        var msgFeat2 = '';
        var msgMB = "";
        var featureOW = false;
        var featureMB = false;
        var OWData = '';


        var translationList = [];
        var fieldTranslation = translation.load({
            collections: [
                {
                    alias: "CollectionValidationProcess",
                    collection: "custcollection_lmry_validation_process",
                    keys: [
                        "MESSAGE_BRSUSBI",
                        "MESSAGE_SALES",
                        "MESSAGE_PURCHASE"


                    ],
                },
            ],
        });
        translationList.push({
            validBr: fieldTranslation.CollectionValidationProcess.MESSAGE_BRSUSBI(),
            validSales: fieldTranslation.CollectionValidationProcess.MESSAGE_SALES(),
            validPurchase: fieldTranslation.CollectionValidationProcess.MESSAGE_PURCHASE(),


        });


        function pageInit(scriptContext) {
            try {
                recordObj = scriptContext.currentRecord;
                var mode = scriptContext.mode;


                featureOW = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
                featureMB = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });


                Language = runtime.getCurrentScript().getParameter({ name: 'LANGUAGE' });
                Language = Language.substring(0, 2);


                switch (Language) {
                    case 'es':
                        msgSubsi = 'La subsidiaria "LatamReady" se encuenta desactivada';
                        msgInst = 'La instancia "LatamReady" ya se encuentra configurada';
                        Mensaje1 = 'País vacío';
                        Mensaje2 = 'Subsidiaria vacía';
                        msgFeat = 'Las funciones "LR1" y "LR2" no pueden estar activas al mismo tiempo';
                        msgFeat2 = 'Para activar la función "LR1", deberá estar activa al menos una de estas funciones: "LR2" y "LR3"';
                        msgMB = 'La función "LR1" no puede ser activada, si no esta activa la función de Netsuite: "LIBROS DE AJUSTE ÚNICAMENTE" (MULTILIBRO)';
                        break;
                    case 'pt':
                        msgSubsi = 'A subsidiária "LatamReady" está desativada';
                        msgInst = 'A instância "LatamReady" já está configurada';
                        Mensaje1 = 'País vazio';
                        Mensaje2 = 'Subsidiária vazia';
                        msgFeat = 'Os recursos "LR1" e "LR2" não podem estar ativos ao mesmo tempo';
                        msgFeat2 = 'Para activar a recurso "LR1", pelo menos uma destas recursos deve estar activa: "LR2" e "LR3"';
                        msgMB = 'O recurso "LR1" não pode estar ativo se o recurso " LIVROS SOMENTE DE AJUSTE" (MULTILIVRO) não estiver ativo.'
                        break;
                    default:
                        msgSubsi = 'The "LatamReady" subsidiary is inactivated';
                        msgInst = 'The "LatamReady" instance is already configured';
                        Mensaje1 = 'Country empty';
                        Mensaje2 = 'Subsidiary empty';
                        msgFeat = 'The features "LR1" and "LR2" cannot be active at the same time';
                        msgFeat2 = 'To activate feature "LR1", at least one of these features must be active: "LR2" and "LR3"';
                        msgMB = "The feature 'LR1' cannot be active, if 'ADJUSTMENT ONLY BOOKS' (MULTIBOOK) feature is not active";
                        break;
                }

                var subsi = recordObj.getValue('custpage_id_subsi');
                var nuevo = recordObj.getValue('custpage_id_new');
                var paramsubsi = recordObj.getValue('custpage_param_subsi');
                OWData = recordObj.getValue('custpage_id_ow');


                console.log('subsi: ' + subsi);
                if ((subsi != null && subsi != '' && subsi != 0) && nuevo == 0) {
                    var searchConfig = search.create({
                        type: 'customrecord_lmry_features_by_subsi',
                        columns: ['custrecord_lmry_features_data'],
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
                        var data = searchConfig[0].getValue('custrecord_lmry_features_data').split('\x00');
                        for (var j = 0; j < data.length; j++) {
                            var custpage = '';
                            if (parseInt(data[j]) > 0) {
                                custpage = 'custpage_f' + parseInt(data[j]);
                            } else {
                                custpage = 'custpage_f_' + Math.abs(parseInt(data[j]));
                            }
                            var fieldexist = recordObj.getField(custpage);
                            if (fieldexist) {
                                recordObj.setValue(custpage, true);
                            }
                        }
                    }
                }
                if ((subsi == null || subsi == '' || subsi == 0) && nuevo == 0) {
                    var subsiSearch = search.lookupFields({
                        type: 'subsidiary',
                        id: paramsubsi,
                        columns: ['name']
                    });
                    alert(msgSubsi.replace('LatamReady', subsiSearch.name));
                    var urldetalle = url.resolveScript({
                        scriptId: 'customscript_lmry_features_stlt',
                        deploymentId: 'customdeploy_lmry_features_stlt',
                        returnExternalUrl: false
                    });
                    setWindowChanged(window, false);
                    window.location.href = 'https://' + window.location.hostname + urldetalle;
                }


                if (nuevo == 1) {
                    var searchConfig = search.create({
                        type: 'customrecord_lmry_features_by_subsi',
                        columns: ['custrecord_lmry_features_subsidiary'],
                        filters: [
                            ['isinactive', 'is', 'F']
                        ]
                    });
                    searchConfig = searchConfig.run().getRange(0, 1);
                    if (searchConfig != null && searchConfig != '') {
                        if (!featureOW) {
                            var OWArray = OWData.split('|');
                            var name = OWArray[1];
                            alert(msgInst.replace('LatamReady', name));
                            var urldetalle = url.resolveScript({
                                scriptId: 'customscript_lmry_features_stlt',
                                deploymentId: 'customdeploy_lmry_features_stlt',
                                returnExternalUrl: false
                            });
                            setWindowChanged(window, false);
                            window.location.href = 'https://' + window.location.hostname + urldetalle;
                            return false;
                        }


                    }
                }


            } catch (err) {
                alert('[pageInit] ' + err);
            }
            return true;
        }


        function validateField(scriptContext) {
            try {
                recordObj = scriptContext.currentRecord;
                var name = scriptContext.fieldId;


                if (name == 'custpage_id_country') {
                    var country = recordObj.getValue('custpage_id_country');


                    if (country != null && country != '') {


                        if (featureOW) {
                            var subsiConfig = getConfigSubsi();


                            var subsiField = recordObj.getField('custpage_id_subsi');
                            subsiField.removeSelectOption({
                                value: null
                            });


                            var subsiSearch = search.create({
                                type: 'subsidiary',
                                columns: ['internalid', 'name'],
                                filters: [
                                    ['country', 'is', country], 'AND',
                                    ['isinactive', 'is', 'F']
                                ]
                            });
                            if (subsiConfig.length > 0) {
                                subsiSearch.filters.push(search.createFilter({ name: 'internalid', operator: 'noneof', values: subsiConfig }));
                            }
                            subsiSearch = subsiSearch.run().getRange(0, 1000);
                            subsiField.insertSelectOption({
                                value: 0,
                                text: ' '
                            });
                            if (subsiSearch != null && subsiSearch != '') {


                                for (var i = 0; i < subsiSearch.length; i++) {
                                    subsiField.insertSelectOption({
                                        value: subsiSearch[i].getValue('internalid'),
                                        text: subsiSearch[i].getValue('name')
                                    });
                                }
                            }
                        } else {
                            var subsiField = recordObj.getField('custpage_id_subsi');
                            subsiField.removeSelectOption({
                                value: null
                            });
                            var OWArray = OWData.split('|');
                            var coun = OWArray[0];
                            var name = OWArray[1];


                            if (country == coun) {
                                subsiField.insertSelectOption({
                                    value: 1,
                                    text: name
                                });
                            }


                        }


                    }


                }


            } catch (err) {
                alert('[validateField] ' + err);
                return false;
            }
            return true;
        }


        function saveRecord(scriptContext) {
            try {
                recordObj = scriptContext.currentRecord;




                var subsidiaria = recordObj.getValue({ fieldId: 'custpage_id_subsi' });
                var country = recordObj.getValue({ fieldId: 'custpage_id_country' });


                if (country == null || country == '' || country == 0) {
                    alert(Mensaje1);
                    return false;
                }


                if (subsidiaria == null || subsidiaria == '' || subsidiaria == 0) {
                    alert(Mensaje2);
                    return false;
                }


                if (!validateActiveFeature(46, 152, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(41, 153, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(27, 150, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(27, 340, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(150, 340, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(47, 213, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(27, 720, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(27, 721, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(340, 720, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(340, 721, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(568, 750, recordObj)) {
                    return false;
                }

                if (!validateActiveFeature(1082, 750, recordObj)) {
                    return false;
                }

                if (!validateActiveFeature(1082, 568, recordObj)) {
                    return false;
                }

                if (!validateActiveFeature(552, 811, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(141, 847, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(416, 921, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(670, 922, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(671, 914, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(672, 914, recordObj)) {
                    return false;
                }


                if (!validateActiveFeature(877, 999, recordObj)) {
                    return false;
                }


                //AUTOMATIC FIELDS BY SUBSIDIARY
                //MX
                if (!validateActiveFeatureAutomaticSet(975, 332, 436, recordObj)) {
                    return false;
                }
                //CO D1653
                if (!validateActiveFeatureAutomaticSet(1110, 327, 435, recordObj)) {
                    return false;
                }

                //Valida Feature Multibook
                if (!validateMultibook(919, recordObj) || !validateMultibook(920, recordObj)) {
                    return false;
                }
                if (!validateFetureBR()) {
                    return false;
                }
                if (!validateAdvanceExchange()) {
                    return false;
                }
               




            } catch (err) {
                alert('[saveRecord] ' + err);
                return false;
            }
            return true;
        }


        function getConfigSubsi() {
            var subsi = [];
            var searchConfig = search.create({
                type: 'customrecord_lmry_features_by_subsi',
                columns: ['custrecord_lmry_features_subsidiary'],
                filters: [
                    ['isinactive', 'is', 'F']
                ]
            });
            searchConfig = searchConfig.run().getRange(0, 1000);
            if (searchConfig) {
                for (var i = 0; i < searchConfig.length; i++) {
                    subsi.push(searchConfig[i].getValue('custrecord_lmry_features_subsidiary'));
                }
            }


            return subsi;
        }


        function validateActiveFeature(id1, id2, recordObj) {
            var result = true;
            var field1 = recordObj.getField('custpage_f' + id1);
            var field2 = recordObj.getField('custpage_f' + id2);
            if (field1 != null && field1 != '' && field2 != null && field2 != '') {
                var value1 = recordObj.getValue('custpage_f' + id1);
                var value2 = recordObj.getValue('custpage_f' + id2);
                if ((value1 == true || value1 == 'T') && (value2 == true || value2 == 'T')) {
                    var alertAux = msgFeat.replace('LR1', field1.label);
                    alertAux = alertAux.replace('LR2', field2.label);
                    alert(alertAux);
                    return false;
                }
            }
            return result;
        }


        function validateFetureBR() {


            var valueTaxCal;
            var valueSpecialTax
            try {
                valueTaxCal = recordObj.getValue('custpage_f' + 681);
                valueSpecialTax = recordObj.getValue('custpage_f' + 682);
                var country = recordObj.getValue('custpage_id_country');
                if (country == "BR") {
                    if (valueSpecialTax == true || valueSpecialTax == "T") {
                        if (valueTaxCal === true || valueTaxCal === "T") {
                        } else {
                            alert(translationList[0].validBr);
                            return false;
                        }
                    }
                }
            } catch (error) {
                console.error("No existe los feature");


            }
            return true;


        }


        function validateAdvanceExchange() {
            var erPurchase;
            var erSales;
            var AdvanceEcRate;
            try {
                var jsonCountryFeature = {
                    'BR': {
                        'featureErPurcha': 529,
                        'featureErSales': 321,
                        'featureAdvEcRa': 612
                    },
                    'AR': {
                        'featureErPurcha': 532,
                        'featureErSales': 404,
                        'featureAdvEcRa': 610
                    },
                    'CO': {
                        'featureErPurcha': 533,
                        'featureErSales': 409,
                        'featureAdvEcRa': 614
                    },
                    'PE': {
                        'featureErPurcha': 531,
                        'featureErSales': 403,
                        'featureAdvEcRa': 623
                    },
                    'MX': {
                        'featureErPurcha': 528,
                        'featureErSales': 289,
                        'featureAdvEcRa': 619
                    },
                    'CL': {
                        'featureErPurcha': 530,
                        'featureErSales': 322,
                        'featureAdvEcRa': 613
                    }
                };
                var country = recordObj.getValue('custpage_id_country');
                if (country in jsonCountryFeature) {
                    var features = jsonCountryFeature[country];
       
                    erPurchase = recordObj.getValue('custpage_f' + features.featureErPurcha);
                    erSales = recordObj.getValue('custpage_f' + features.featureErSales);
                    AdvanceEcRate = recordObj.getValue('custpage_f' + features.featureAdvEcRa);
       
                    if (AdvanceEcRate == true || erPurchase == "T") {
                        if (erSales === true || erSales === "T") {
                            alert(translationList[0].validSales);
                            return false;
                        }
                        if (erPurchase === true || erPurchase === "T") {
                            alert(translationList[0].validPurchase);
                            return false;
                        }
                    }
                }
            } catch (error) {
                console.error("No existen los features");
            }
            return true;
        }


        function validateActiveFeatureAutomaticSet(id1, id2, id3, recordObj) {
            var result = true;
            var field1 = recordObj.getField('custpage_f' + id1);
            var field2 = recordObj.getField('custpage_f' + id2);
            var field3 = recordObj.getField('custpage_f' + id3);
            if (field1 != null && field1 != '' && field2 != null && field2 != '' && field3 != null && field3 != '') {
                var value1 = recordObj.getValue('custpage_f' + id1);
                var value2 = recordObj.getValue('custpage_f' + id2);
                var value3 = recordObj.getValue('custpage_f' + id3);
                if ((value1 == true || value1 == 'T') && (value2 == false || value2 == 'F') && (value3 == false || value3 == 'F')) {
                    var alertAux = msgFeat2.replace('LR1', field1.label);
                    alertAux = alertAux.replace('LR2', field2.label);
                    alertAux = alertAux.replace('LR3', field3.label);
                    alert(alertAux);
                    return false;
                }
            }
            return result;
        }


        function requestnewfeatures(subsidiary) {
            var urldetalle = url.resolveScript({
                scriptId: 'customscript_lmry_features_request_stlt',
                deploymentId: 'customdeploy_lmry_features_request_stlt',
                returnExternalUrl: false
            });
            console.log(urldetalle);
            window.open('https://' + window.location.hostname + urldetalle + '&subsidiary=' + subsidiary);


        }


        function backToMain() {
            var urldetalle = url.resolveScript({
                scriptId: 'customscript_lmry_features_stlt',
                deploymentId: 'customdeploy_lmry_features_stlt',
                returnExternalUrl: false
            });
            setWindowChanged(window, false);
            window.location.href = 'https://' + window.location.hostname + urldetalle;


        }


        function validateMultibook(feature, recordObj) {
            var result = true;
            if (!featureMB) {
                var field = recordObj.getField('custpage_f' + feature);
                if (field) {
                    var value = recordObj.getValue('custpage_f' + feature);
                    if (value == true || value == 'T') {
                        var alertAux = msgMB.replace('LR1', field.label);
                        alert(alertAux);
                        return false;
                    }
                }
            }
            return result;
        }


        return {
            pageInit: pageInit,
            validateField: validateField,
            saveRecord: saveRecord,
            requestnewfeatures: requestnewfeatures,
            backToMain: backToMain
        }
    });

