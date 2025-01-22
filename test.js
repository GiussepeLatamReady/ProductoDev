
var fieldMultiCountry = {
   "CL":[
      "custentity_lmry_actecon_sii_cl",
      "custentity_lmry_digito_verificator",
      "custentity_lmry_entityrelated",
      "custentity_lmry_prefijo_prov",
      "custentity_lmry_sv_taxpayer_number"
   ],
   "CO":[
      "custentity_lmry_digito_verificator",
      "custentity_lmry_pa_person_type",
      "custentity_lmry_sunat_tipo_doc_cod",
      "custentity_lmry_sunat_tipo_doc_id"
   ],
   "DO":[
      "custentity_lmry_sunat_tipo_doc_id"
   ],
   "MX":[
      "custentity_lmry_legal_name_project",
      "custentity_lmry_sv_taxpayer_number",
      "custentity_lmry_sv_taxpayer_type"
   ],
   "PA":[
      "custentity_lmry_digito_verificator",
      "custentity_lmry_legal_name_project",
      "custentity_lmry_pa_person_code",
      "custentity_lmry_pa_person_type",
      "custentity_lmry_sv_taxpayer_type"
   ],
   "PE":[
      "custentity_lmry_sunat_tipo_doc_id",
      "custentity_lmry_sv_taxpayer_number"
   ]
}

{  
   custentity_lmry_actecon_sii_cl:{
      countries: ["CL"],
      isGeneral: false,
   },
   custentity_lmry_digito_verificator:{
      countries: ["CL","CO","PA"],
      isGeneral: false,
   },
   custentity_lmry_entityrelated:{
      countries: ["CL"],
      isGeneral: false,
   },
   custentity_lmry_legal_name_project:{
      countries: ["MX","PA"],
      isGeneral: false,
   },
   custentity_lmry_pa_person_code:{
      countries: ["PA"],
      isGeneral: false,
   },
   custentity_lmry_pa_person_type:{
      countries: ["CO","PA"],
      isGeneral: false,
   },
   custentity_lmry_prefijo_prov:{
      countries: ["CL"],
      isGeneral: false,
   },
   custentity_lmry_sunat_tipo_doc_cod:{
      countries: ["CO"],
      isGeneral: false,
   },
   custentity_lmry_sunat_tipo_doc_id:{
      countries: ["CO","DO","PE"],
      isGeneral: false,
   },
   custentity_lmry_sv_taxpayer_number:{
      countries: ["CL","MX","PA"],
      isGeneral: false,
   },
   custentity_lmry_sv_taxpayer_type:{
      countries: ["MX","PA"],
      isGeneral: false,
   }
}


var fieldGeneral = [
   "custentity_lmry_country",
   "custentity_lmry_country_codeiso",
   "custentity_lmry_countrycode",
   "custentity_lmry_sv_taxpayer_number",
   "custentity_lmry_sv_taxpayer_type", 
]



var fieldEntity = {
   custentity_lmry_country:{
      countries: ["CO","MX","PE","DO","PA"],
      isGeneral: false,
   },
   custentity_lmry_country_codeiso:{
      countries: ["CO","MX","PE","DO","PA"],
      isGeneral: false,
   },
   custentity_lmry_countrycode:{
      countries: ["CO","MX","PE","DO","PA"],
      isGeneral: false,
   },
   custentity_lmry_sv_taxpayer_number:{
      isGeneral: true,
   },
   custentity_lmry_sv_taxpayer_type:{
      isGeneral: true,
   }, 
   custentity_lmry_actecon_sii_cl:{
      countries: ["CL"],
      isGeneral: false,
   },
   custentity_lmry_digito_verificator:{
      countries: ["CL","CO","PA"],
      isGeneral: false,
   },
   custentity_lmry_entityrelated:{
      countries: ["CL"],
      isGeneral: false,
   },
   custentity_lmry_legal_name_project:{
      countries: ["MX","PA"],
      isGeneral: false,
   },
   custentity_lmry_pa_person_code:{
      countries: ["PA"],
      isGeneral: false,
   },
   custentity_lmry_pa_person_type:{
      countries: ["CO","PA"],
      isGeneral: false,
   },
   custentity_lmry_prefijo_prov:{
      countries: ["CL"],
      isGeneral: false,
   },
   custentity_lmry_sunat_tipo_doc_cod:{
      countries: ["CO"],
      isGeneral: false,
   },
   custentity_lmry_sunat_tipo_doc_id:{
      countries: ["CO","DO","PE"],
      isGeneral: false,
   },
   custentity_lmry_sv_taxpayer_number:{
      countries: ["CL","MX","PA"],
      isGeneral: false,
   },
   custentity_lmry_sv_taxpayer_type:{
      countries: ["MX","PA"],
      isGeneral: false,
   }
}


function getSUbsidiaries() {
   var currRecord = record.load({type:record.Type.CUSTOMER, id:currentRecord.get().id, isDynamic:true});
   console.log("currRecord: ",currRecord.id)
   //console.log("subsidiary: ",currRecord.getValue("subsidiary"))
   var countSubsidiaries = currRecord.getLineCount({
      sublistId: 'submachine'
   });
   var subsidiaries = [];
   for (var i = 0; i < countSubsidiaries; i++) {
      subsidiaries.push(currRecord.getSublistValue({sublistId:'submachine',fieldId:'subsidiary',line:i}))
   }
   
   console.log("subsidiaries: ",subsidiaries)
}

getSUbsidiaries();
