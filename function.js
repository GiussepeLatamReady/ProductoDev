/*
const fieldEntity = {
    custentity_lmry_sv_taxpayer_number: {
        isGeneral: true,
        fieldRecord: "custrecord_lmry_ef_sv_taxpayer_number"
    },
    custentity_lmry_sv_taxpayer_type: {
        isGeneral: true,
        fieldRecord: "custrecord_lmry_ef_sv_taxpayer_type"
    },
    custentity_lmry_country: {
        countries: {
            CO: ["customer", "vendor"],
            MX: ["customer", "vendor"],
            PE: ["vendor"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_country"
    },
    custentity_lmry_country_codeiso: {
        countries: {
            CO: ["customer"],
            MX: ["customer"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_country_codeiso"
    },
    custentity_lmry_countrycode: {
        countries: {
            DO: ["customer", "vendor"],
            PA: ["customer"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_countrycode"
    },
    
    custentity_lmry_actecon_sii_cl: {
        countries: {
            CL: ["customer"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_actecon_sii_cl"
    },
    custentity_lmry_digito_verificator: {
        countries: {
            CL: ["customer", "vendor"],
            CO: ["customer", "vendor"],
            PA: ["customer", "vendor"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_digito_verificator"
    },
    custentity_lmry_entityrelated: {
        countries: {
            CL: ["customer"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_entityrelated"
    },
    custentity_lmry_fiscal_responsability: {
        countries: {
            PE: ["customer"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_fiscal_responsability"
    },
    custentity_lmry_giro: {
        countries: {
            CL: ["customer"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_giro"
    },
    custentity_lmry_legal_name_project: {
        countries: {
            MX: ["customer"],
            PA: ["customer"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_legal_name_project"
    },
    custentity_lmry_pa_person_code: {
        countries: {
            PA: ["customer"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_pa_person_code"
    },
    custentity_lmry_pa_person_type: {
        countries: {
            CO: ["customer"],
            PA: ["customer"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_pa_person_type"
    },
    custentity_lmry_prefijo_prov: {
        countries: {
            CL: ["customer"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_prefijo_prov"
    },
    custentity_lmry_sunat_tipo_doc_cod: {
        countries: {
            CO: ["customer"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_sunat_tipo_doc_cod"
    },
    custentity_lmry_sunat_tipo_doc_id: {
        countries: {
            CO: ["customer", "vendor"],
            DO: ["customer", "vendor"],
            PE: ["customer", "vendor"]
        },
        isGeneral: false,
        fieldRecord: "custrecord_lmry_ef_sunat_tipo_doc_id"
    }
}




var subsidiaries = {
    "7": {
        "countryCode": "AR",
        "countryName": "Argentina",
        "name": " HoneyComb AR"
    },
    "10": {
        "countryCode": "CO",
        "countryName": "Colombia",
        "name": " HoneyComb CO"
    },
    "16": {
        "countryCode": "BR",
        "countryName": "Brazil",
        "name": " HoneyComb BR"
    }
}

function filterFields(subsidiaries, entityFields, typeEntity) {
    var general = [];

    for (var fieldKey in entityFields) {
        var fieldConfig = entityFields[fieldKey];
        if (fieldConfig && fieldConfig.isGeneral) {

            general.push({
                fieldKey: fieldKey,
                fieldRecord: fieldConfig.fieldRecord
            });
        }
    }

    for (var subsidiaryId in subsidiaries) {
        var subsidiary = subsidiaries[subsidiaryId]; 
        var countryCode = subsidiary.countryCode; 
        subsidiary.fieldsEntity = [];
        for (var fieldKey in entityFields) {
            var fieldConfig = entityFields[fieldKey];

            if (
                fieldConfig &&
                !fieldConfig.isGeneral &&
                fieldConfig.countries &&
                fieldConfig.countries[countryCode]?.includes(typeEntity)
            ) {
                subsidiary.fieldsEntity.push({
                    fieldKey: fieldKey,
                    fieldRecord: fieldConfig.fieldRecord
                });
            }
        }
    }
    return { subsidiaries, general }; 
}


var result= filterFields(subsidiaries, fieldEntity, "customer")
console.dir("result :")
console.dir(result,{ depth: null, colors: true })
*/

var resultado = {
    subsidiaries: {
        '7': {
            countryCode: 'AR',
            countryName: 'Argentina',
            name: ' HoneyComb AR',
            fieldsEntity: []
        },
        '10': {
            countryCode: 'CO',
            countryName: 'Colombia',
            name: ' HoneyComb CO',
            fieldsEntity: [
                {
                    fieldKey: 'custentity_lmry_country',
                    fieldRecord: 'custrecord_lmry_ef_country'
                },
                {
                    fieldKey: 'custentity_lmry_country_codeiso',
                    fieldRecord: 'custrecord_lmry_ef_country_codeiso'
                },
                {
                    fieldKey: 'custentity_lmry_digito_verificator',
                    fieldRecord: 'custrecord_lmry_ef_digito_verificator'
                },
                {
                    fieldKey: 'custentity_lmry_pa_person_type',
                    fieldRecord: 'custrecord_lmry_ef_pa_person_type'
                },
                {
                    fieldKey: 'custentity_lmry_sunat_tipo_doc_cod',
                    fieldRecord: 'custrecord_lmry_ef_sunat_tipo_doc_cod'
                },
                {
                    fieldKey: 'custentity_lmry_sunat_tipo_doc_id',
                    fieldRecord: 'custrecord_lmry_ef_sunat_tipo_doc_id'
                }
            ]
        },
        '16': {
            countryCode: 'BR',
            countryName: 'Brazil',
            name: ' HoneyComb BR',
            fieldsEntity: []
        }
    },
    general: [
        {
            fieldKey: 'custentity_lmry_sv_taxpayer_number',
            fieldRecord: 'custrecord_lmry_ef_sv_taxpayer_number'
        },
        {
            fieldKey: 'custentity_lmry_sv_taxpayer_type',
            fieldRecord: 'custrecord_lmry_ef_sv_taxpayer_type'
        }
    ]
}

var listSetupView = {
    CO: [
        "custentity_lmry_affectation_type",
        "custentity_lmry_country",
        "custentity_lmry_country_codeiso",
        "custentity_lmry_co_actividad_economica",
        "custentity_lmry_co_act_econm_cod",
        "custentity_lmry_co_addrss_prjt",
        "custentity_lmry_co_cntry_prjt",
        "custentity_lmry_co_cod_doc_prjt",
        "custentity_lmry_co_doc_typ_prjt",
        "custentity_lmry_co_leg_nam_prjt",
        "custentity_lmry_co_matric_mercant",
        "custentity_lmry_co_muni_prjt",
        "custentity_lmry_co_prjt_dig_ver",
        "custentity_lmry_co_retecree",
        "custentity_lmry_co_retefte",
        "custentity_lmry_co_reteica",
        "custentity_lmry_co_reteiva",
        "custentity_lmry_digito_verificator",
        "custentity_lmry_es_agente_retencion",
        "custentity_lmry_fiscal_responsability",
        "custentity_lmry_legal_name_project",
        "custentity_lmry_municcode",
        "custentity_lmry_municipality",
        "custentity_lmry_paymentmethod",
        "custentity_lmry_pa_person_code",
        "custentity_lmry_pa_person_type",
        "custentity_lmry_prefijo_prov",
        "custentity_lmry_reg_num_prjt",
        "custentity_lmry_sunat_tipo_doc_cod",
        //"custentity_lmry_sunat_tipo_doc_id",
        "custentity_lmry_sv_taxpayer_number",
        "custentity_lmry_sv_taxpayer_type",
        "custentity_lmry_vatregnumber_project",
        "custrecord_lmry_municcode",
        "custrecord_lmry_municipality"
    ]
}

function getViewFields(listSetupView, resultado) {
    // Iterar sobre las subsidiarias en el resultado
    for (var subsidiaryId in resultado.subsidiaries) {
        if (resultado.subsidiaries.hasOwnProperty(subsidiaryId)) {
            var subsidiary = resultado.subsidiaries[subsidiaryId];
            var countryCode = subsidiary.countryCode; // Obtener el código del país

            // Verificar si el país existe en listSetupView
            if (listSetupView[countryCode]) {
                var allowedFields = listSetupView[countryCode]; // Campos permitidos para este país

                // Filtrar fieldsEntity para incluir solo los campos que están en allowedFields
                subsidiary.fieldsEntity = subsidiary.fieldsEntity.filter(function (field) {
                    return allowedFields.indexOf(field.fieldKey) !== -1;
                });
            } else {
                // Si el país no está en listSetupView, eliminar todos los fieldsEntity
                subsidiary.fieldsEntity = [];
            }
        }
    }

    return resultado; // Retornar el resultado modificado
}

/*
getViewFields(listSetupView, resultado)

var result= filterFields(subsidiaries, fieldEntity, "customer")
console.dir("result :")
console.dir(result,{ depth: null, colors: true })
*/