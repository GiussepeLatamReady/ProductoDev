var fieldEntity = {
   custentity_lmry_country:{
      countries: {
         CO: ["customer","vendor"],
         MX: ["customer","vendor"],
         PE: ["vendor"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_country"
   },
   custentity_lmry_country_codeiso:{
      countries: {
         CO: ["customer"],
         MX: ["customer"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_country_codeiso"
   },
   custentity_lmry_countrycode:{
      countries: {
         DO: ["customer","vendor"],
         PA: ["customer"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_countrycode"
   },
   custentity_lmry_sv_taxpayer_number:{
      isGeneral: true,
      fieldRecord:"custrecord_lmry_ef_sv_taxpayer_number"
   },
   custentity_lmry_sv_taxpayer_type:{
      isGeneral: true,
      fieldRecord:"custrecord_lmry_ef_sv_taxpayer_type"
   }, 
   custentity_lmry_actecon_sii_cl:{
      countries: {
         CL:["customer"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_actecon_sii_cl"
   },
   custentity_lmry_digito_verificator:{
      countries: {
         CL: ["customer","vendor"],
         CO: ["customer","vendor"],
         PA: ["customer","vendor"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_digito_verificator"
   },
   custentity_lmry_entityrelated:{
      countries: {
         CL:["customer"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_entityrelated"
   },
   custentity_lmry_fiscal_responsability:{
      countries: {
         PE:["customer"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_fiscal_responsability"
   },
   custentity_lmry_giro:{
      countries: {
         CL:["customer"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_giro"
   },
   custentity_lmry_legal_name_project:{
      countries: {
         MX:["customer"],
         PA:["customer"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_legal_name_project"
   },
   custentity_lmry_pa_person_code:{
      countries: {
         PA:["customer"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_pa_person_code"
   },
   custentity_lmry_pa_person_type:{
      countries: {
         CO:["customer"],
         PA:["customer"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_pa_person_type"
   },
   custentity_lmry_prefijo_prov:{
      countries: {
         CL:["customer"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_prefijo_prov"
   },
   custentity_lmry_sunat_tipo_doc_cod:{
      countries: {
         CO:["customer"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_sunat_tipo_doc_cod"
   },
   custentity_lmry_sunat_tipo_doc_id:{
      countries: {
         CO: ["customer","vendor"],
         DO: ["customer","vendor"],
         PE: ["customer","vendor"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_sunat_tipo_doc_id"
   },
   custentity_lmry_sv_taxpayer_number:{
      countries: {
         CL: ["customer","vendor"],
         MX: ["customer","vendor"],
         PA: ["vendor"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_sv_taxpayer_number"
   },
   custentity_lmry_sv_taxpayer_type:{
      countries: {
         MX: ["customer"],
         PA: ["customer"]
      },
      isGeneral: false,
      fieldRecord:"custrecord_lmry_ef_sv_taxpayer_type"
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
   

   var jsonSubsidiaries = {};
   search.create({
      type: search.Type.SUBSIDIARY, 
      columns: ['internalid', 'country','name'], 
      filters: [{ name: 'internalid', operator: 'anyof', values: subsidiaries }]
   }).run().each(function(result){
      var internalid = result.getValue("internalid");
      var nameWords = result.getValue("name").split(":");
      console.log("nameWords: ", nameWords)
      jsonSubsidiaries[internalid] = {
         country: result.getValue("country"),
         "name": nameWords[nameWords.length-1]
      }
      return true;
   });
   console.log("subsidiaries: ", subsidiaries)
   console.log("jsonSubsidiaries: ", jsonSubsidiaries)
}

getSUbsidiaries();
