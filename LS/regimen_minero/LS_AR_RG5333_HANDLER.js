/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LS_AR_RG5333_HANDLER.js
 * @Author anthony@latamready.com
 */
define(["N/http", "N/log", "N/search", "N/query", "N/record", "N/format"], function (http, nLog, search, query, record, format) {
    //https://regimen-rg5333-salta.dry-voice-c04e.workers.dev/

    class RG5333 {
        #context;
        constructor(context) {
            this.#context = context;
        }
        getInputData() {

            /*const subsidiaries = this.getSubsidiaries();

            log.debug('subsidiaries', subsidiaries);*/

            const sections = this.getSections();

            log.debug('sections', sections);

            const fiscalStatus = this.getFiscalActivities();

            log.debug('fiscalStatus', fiscalStatus);

            const WSConfig = this.getWSContributorySetup();

            if(!WSConfig.length){
              return true;
            }

            log.debug('WSConfig', WSConfig);

            const vendorsData = this.getVendorsByRGActive();

            if(!vendorsData.length){
              return true;
            }

            log.debug('vendorsData.length', vendorsData.length);

            const itemsWithConcept = this.getItemsWithRegimen();

            log.debug('itemsWithConcept', itemsWithConcept);

            const RG5333ConceptsGananacias = this.getRG5333Concepts();

            log.debug('RG5333ConceptsGananacias', RG5333ConceptsGananacias);

            const rg5333GananciasAvailables = RG5333ConceptsGananacias.filter((concept) => itemsWithConcept.find((item) => item.custitem_ls_ar_item_concept_rg5333 === concept.id));

            log.debug('rg5333GananciasAvailables', rg5333GananciasAvailables);

            return this.getWSInformation({ WSConfig, vendorsData, sections, fiscalStatus, rg5333GananciasAvailables });
        }
        map() {
            // PROCESO IVA
            try {
                let wsData = this.#context.value;
                wsData = JSON.parse(wsData ?? "{}");

                const { wsResults, id, sections, fiscalStatus, wsSetup } = wsData;

                wsResults.forEach((wsResult) => {
                    const valuesObject = {};

                    log.debug('wsResult', wsResult);
                    
                    if(wsResult.Estado == 'EXCLUIDO' && wsResult['Fecha de exclusion']){
                        let auxYear = wsResult['Fecha de exclusion'].split('/')[2];
                        auxYear = auxYear.substring(2,4);
        
                        if(auxYear == 19){
                            wsResult.Estado += auxYear;
                        }
        
                    }

                    //Devuelve la sección
                    const section = this.getElementByName({ list: sections, name: wsResult.Seccion });

                    log.debug('section', section);

                    const duplicates = this.duplicateValidatorMinerActivities({ vendorID: id, sectionID: section.id });

                    log.debug('duplicates', duplicates);

                    if (id) valuesObject.custrecord_ls_ar_tax_record_vendor = id;

                    valuesObject.custrecord_ls_ar_tax_record_date_beggin = wsResult["Fecha de alta"] ? this.formatDateTextToDate(wsResult["Fecha de alta"]) : '';
                    valuesObject.custrecord_ls_ar_tax_record_date_end = wsResult["Fecha de exclusion"] ? this.formatDateTextToDate(wsResult["Fecha de exclusion"]) : '';

                    const status = this.getElementByName({ list: fiscalStatus, name: wsResult.Estado });

                    if (status) valuesObject.custrecord_ls_ar_tax_record_status = status.id;

                    if (section) valuesObject.custrecord_ls_ar_tax_record_section = section.id;

                    //log.debug('valuesObject', valuesObject);

                    if (duplicates.length > 0) {

                        this.updateMinerActivities({
                            id: duplicates[0].id,
                            values: valuesObject
                        });

                        //Si pertenece al regimen de iva, se crea cc
                        if(wsData.custentity_ls_ar_tax_record_cert_no_iva == 'F' || wsData.custentity_ls_ar_tax_record_cert_no_iva == false){
                          const listContributories = this.getContributoryAvailable({ vendorID: id, taxtype: 1, type: 3, subsidiary: wsData.subsidiary});

                          log.debug('listContributories', listContributories);

                          this.manageContributoryClass({
                              config: wsSetup.filter((setup) => setup.custrecord_lmry_ar_ws_tipo_padron === "RG5333-IVA"),
                              minerActivity: wsResult,
                              entity: id,
                              contributoryClassId: listContributories,
                              taxrate: status.custrecord_ls_ar_act_status_alicuota
                          });
                        }


                    } else {

                      log.debug('no duplicates');

                        this.createRecordMinerActivities(valuesObject);

                        if(wsData.custentity_ls_ar_tax_record_cert_no_iva == 'F' || wsData.custentity_ls_ar_tax_record_cert_no_iva == false){

                          const listContributories = this.getContributoryAvailable({ vendorID: id, taxtype: 1, type: 3, subsidiary: wsData.subsidiary});

                          log.debug('listContributories', listContributories);

                          this.manageContributoryClass({
                              config: wsSetup.filter((setup) => setup.custrecord_lmry_ar_ws_tipo_padron === "RG5333-IVA"),
                              minerActivity: wsResult,
                              entity: id,
                              contributoryClassId: listContributories,
                              taxrate: status.custrecord_ls_ar_act_status_alicuota
                          });

                        }


                    }
                });

                if (wsResults.length === 0) {
                    const listContributories = this.getContributoryAvailable({ vendorID: id, taxtype: 1, type: 3, subsidiary: wsData.subsidiary });

                    this.manageContributoryClass({
                        config: wsSetup.filter((setup) => setup.custrecord_lmry_ar_ws_tipo_padron === "RG5333-IVA"),
                        minerActivity: { Estado: "SINREGISTRO" },
                        entity: id,
                        contributoryClassId: listContributories,
                        taxrate: 1
                    });
                }

                this.#context.write({ key: id, value: this.#context.value });
            } catch (error) {
                nLog.error("map-error", error);
            }
        }
        reduce() {
            try {

              //let dataReduce = JSON.parse(this.#context.values[0]);

              log.debug('comenzo reduce');

              for(let i = 0; i < this.#context.values.length; i++){

                let dataReduce = JSON.parse(this.#context.values[i]);

                const { id, wsSetup, rg5333GananciasAvailables, wsResults } = dataReduce;

                if(dataReduce.custentity_ls_ar_tax_cert_no_rg5333 == true || dataReduce.custentity_ls_ar_tax_cert_no_rg5333 == 'T'){
                  return true;
                }
  
                log.debug('wsResults', wsResults);
  
                //Si está en el padrón
                wsResults.forEach((wsResult) => {
                      rg5333GananciasAvailables.forEach((rg5333Ganancias) => {
                          this.manageCCGananciasByStatus({
                              config: wsSetup.filter((setup) => setup.custrecord_lmry_ar_ws_tipo_padron === "RG5333-GANANCIAS"),
                              whtInfo: wsResult,
                              rg5333Ganancias,
                              vendor: id,
                              subsidiary: dataReduce.subsidiary
                          });
                      });
                  });
  
                  //No está en el padrón
                  if (wsResults.length === 0) {
  
                      rg5333GananciasAvailables.forEach((rg5333Ganancias) => {
                          this.manageCCGananciasByStatus({
                              config: wsSetup.filter((setup) => setup.custrecord_lmry_ar_ws_tipo_padron === "RG5333-GANANCIAS"),
                              whtInfo: { Estado: "SINREGISTRO" },
                              rg5333Ganancias,
                              vendor: id,
                              subsidiary: dataReduce.subsidiary
                          });
                      });
                  }


              }  


            } catch (error) {
                nLog.error("stage-reduce", error);
            }
        }
        summarize() {}

        // ------------- OTHER FUNCTIONS-------------
        getWSInformation({ WSConfig, vendorsData, sections, fiscalStatus, rg5333GananciasAvailables }) {

            try {

              let getCuits = vendorsData.map((vendorData) => {
                return vendorData.taxnumber;
              });

              getCuits = getCuits.filter((element, index) => {
                  return getCuits.indexOf(element) === index;
              });

              log.debug('getCuits', getCuits);

                const WSResult = http.post({
                    //body: JSON.stringify(vendorsData.map((vendorData) => vendorData.taxnumber)),
                    body: JSON.stringify(getCuits),
                    //url: "http://servicecuit.us-east-2.elasticbeanstalk.com/cuits/mining",
                    //url: "http://149.130.170.175/cuits/mining",
                    url: "http://149.130.171.192:3003/cuits/mining",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                /**@type {string:[{}]} */
                const informationByCUIT = JSON.parse(WSResult.body);

                log.debug('informationByCUIT', informationByCUIT);

                vendorsData = vendorsData.map((vendorData) => {
                    vendorData.wsSetup = WSConfig?.filter((config) => config.custrecord_lmry_ar_ws_subsidiary_cc === vendorData.subsidiary);

                    if(!vendorData.wsSetup.length){
                      return undefined;
                    }

                    vendorData.wsResults = informationByCUIT[vendorData.taxnumber] ?? [];
                    vendorData.wsResults = vendorData.wsResults.filter(
                        (wsResult) => wsResult.Seccion === "REGISTRO FISCAL DE PROVEEDORES DE EMPRESAS MINERAS" || wsResult.Seccion === "REGISTRO FISCAL DE EMPRESAS MINERAS"
                    );

                    vendorData.sections = sections;
                    vendorData.fiscalStatus = fiscalStatus;
                    vendorData.rg5333GananciasAvailables = rg5333GananciasAvailables;
                    return vendorData;

                });

                //Elimina del arreglo Vendors sin record setup
                vendorsData = vendorsData.filter((vendorData) => vendorData !== undefined);

                return vendorsData;
            } catch (error) {
                nLog.error("getWSInformation-error", error);
                return [];
            }
        }
        getWSContributorySetup() {
            return query
                .runSuiteQL({
                    query: `
                SELECT
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.id,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_accandmin_with,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_add_accumulated,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_additional_ratio,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_amountto,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_appliesto,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_applies_account,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_applies_item,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_arba_padron,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_base_amount,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_tipo_padron,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_class,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_credit_account,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_debit_account,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_default_cc,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_default_percent,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_department,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_fiscal_doctype,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_gen_transaction,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_normas_iibb,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_jurisdiccion,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_location,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_maximun_amount,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_minimun_amount,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_month_accum,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_ccl_convmult,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_non_taxable_min,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_resptype,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_set_ret_base,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_subsidiary_cc,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_sub_last_ret,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_subtype,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_taxcode,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_tax_code_group,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_tax_item,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_taxtype,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_tran_types,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_type,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_vat_included,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.name,
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_minimum_retention
                FROM
                    CUSTOMRECORD_LMRY_AR_WS_SETUP
                WHERE
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.isinactive = 'F'
                AND
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_tipo_padron = ANY('RG5333-IVA','RG5333-GANANCIAS')
                `,
                    params: []
                })
                .asMappedResults()
                .map((setupws) => {
                    setupws.custrecord_lmry_ar_ws_tran_types = setupws.custrecord_lmry_ar_ws_tran_types.split(",");
                    return setupws;
                });
        }
        getVendorsByRGActive() {
            //and Vendor.custentity_ls_ar_tax_record_cert_no_iva = 'F'
            return query
                .runSuiteQL({
                    query: `
                SELECT
                    Vendor.id,
                    Vendor.altname,
                    Vendor.custentity_ls_ar_tax_record_cert_no_iva,
                    Vendor.custentity_ls_ar_tax_cert_no_rg5333,
                    CONCAT(
                        Vendor.custentity_lmry_sv_taxpayer_number,
                        Vendor.custentity_lmry_digito_verificator
                    ) as taxnumber,
                    VendorSubsidiaryRelationship.subsidiary
                FROM
                    Vendor,
                    VendorSubsidiaryRelationship
                WHERE
                    Vendor.id = VendorSubsidiaryRelationship.entity
                    and VendorSubsidiaryRelationship.subsidiary = ANY(
                        SELECT
                            subsidiary.id
                        FROM
                            subsidiary
                        WHERE
                            subsidiary.custrecord_ls_ar_reg_miner_rg5333_inscr = 'T'
                            and subsidiary.isinactive = 'F'
                            and subsidiary.country = 'AR'
                    )
                    and (
                        Vendor.custentity_lmry_sv_taxpayer_number IS NOT NULL
                        and Vendor.custentity_lmry_digito_verificator IS NOT NULL
                    )
                    and Vendor.isinactive = 'F'

                    AND (
                      (Vendor.custentity_ls_ar_tax_record_cert_no_iva = 'F')
                      OR (Vendor.custentity_ls_ar_tax_cert_no_rg5333 = 'F')
                    )
            `,
                    params: []
                })
                .asMappedResults();

                /*and (Vendor.id = 29050 OR Vendor.id = 29279)*/
                //AND subsidiary.id = any(${listsubsidiary.join()})

        }
        manageContributoryClass({ minerActivity, config, entity, contributoryClassId, taxrate }) {

          //log.debug('minerActivity', minerActivity);
          //log.debug('contributoryClassId', contributoryClassId);

          let class1 = contributoryClassId[0] ? contributoryClassId[0].id : '';
          let class2 = contributoryClassId[1] ? contributoryClassId[1].id : '';

            // estado ACTIVO
            if (minerActivity.Estado === "ACTIVO") {
                /**
                 * alicuota 100%
                 * desde 1/1/2000
                 * hasta - valor del padron inicio -1
                 */
                const aux1Config = config;

                this.createOrUpdateContributoryClass({
                    config: aux1Config[0],
                    entity,
                    contributoryClassId: class1,
                    datefrom: new Date("1/1/2000"),
                    datepublic: new Date("1/1/2000"),
                    dateto: this.discountDayFromDate(this.formatDateTextToDate(minerActivity["Fecha de alta"]), 1),
                    taxrate: 100,
                    idIvaGanancias: 'custrecord_ls_iva_rg_5333'
                });
                /**
                 * alicuota 50%
                 * desde - valor del padron inicio
                 * hasta - vacio
                 */
                const aux2Config = config;
                this.createOrUpdateContributoryClass({
                    config: aux2Config[0],
                    entity,
                    contributoryClassId: class2,
                    datefrom: this.formatDateTextToDate(minerActivity["Fecha de alta"]),
                    datepublic: this.formatDateTextToDate(minerActivity["Fecha de alta"]),
                    dateto: new Date("1/1/2099"),
                    taxrate: 50,
                    idIvaGanancias: 'custrecord_ls_iva_rg_5333'
                });
            }

            // estado EXCLUIDO
            if (minerActivity.Estado == "EXCLUIDO" || minerActivity.Estado == "EXCLUIDO19") {
                /**
                 * alicuota 100%
                 * desde - valor del padron fin + 1
                 * hasta vacio
                 */

                const aux1Config = config;
                this.createOrUpdateContributoryClass({
                    config: aux1Config[0],
                    entity,
                    contributoryClassId: class1,
                    datefrom: this.addDayFromDate(this.formatDateTextToDate(minerActivity["Fecha de exclusion"]), 1),
                    dateto: new Date("1/1/2099"),
                    datepublic: this.formatDateTextToDate(minerActivity["Fecha de exclusion"]),
                    taxrate: 100,
                    idIvaGanancias: 'custrecord_ls_iva_rg_5333'
                });
                /**
                 * alicuota 50%
                 * desde - valor del padron inicio
                 * hasta - valor del padron fin
                 */
                const aux2Config = config;
                this.createOrUpdateContributoryClass({
                    config: aux2Config[0],
                    entity,
                    contributoryClassId: class2,
                    datefrom: this.formatDateTextToDate(minerActivity["Fecha de alta"]),
                    datepublic: this.formatDateTextToDate(minerActivity["Fecha de alta"]),
                    dateto: this.formatDateTextToDate(minerActivity["Fecha de exclusion"]),
                    //datefrom: new Date("1/1/2000"),
                    //datepublic: new Date("1/1/2000"),
                    //dateto: new Date("1/1/2099"),
                    taxrate: 50,
                    idIvaGanancias: 'custrecord_ls_iva_rg_5333'
                });
            }

            // no esta en el registro - SINREGISTRO
            if (minerActivity.Estado === "SINREGISTRO") {
                /**
                 * alicuota 100%
                 * desde vacio
                 * hasta vacio
                 */
                const aux1Config = config;
                this.createOrUpdateContributoryClass({
                  config: aux1Config[0],
                  entity,
                  contributoryClassId: class1,
                  datefrom: new Date("1/1/2000"),
                  datepublic: new Date("1/1/2000"),
                  dateto: new Date("1/1/2099"),
                  taxrate: 100,
                  idIvaGanancias: 'custrecord_ls_iva_rg_5333'
                });
            }
        }
        createOrUpdateContributoryClass({ config, entity, taxrate, datefrom, dateto, datepublic, ratio, contributoryClassId, concepto, idIvaGanancias, minimo, baseamount, baseretention, maximo }) {

            let newContributoryClass;
            if (Number(contributoryClassId)) {

                newContributoryClass = record.load({
                    type: "customrecord_lmry_ar_contrib_class",
                    isDynamic: true,
                    id: contributoryClassId
                });
            } else {

                newContributoryClass = record.create({
                    type: "customrecord_lmry_ar_contrib_class",
                    isDynamic: true
                });

                if (entity) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_entity", value: entity });
                if (config.custrecord_lmry_ar_ws_subsidiary_cc) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_subsidiary", value: config.custrecord_lmry_ar_ws_subsidiary_cc });
                if (config.custrecord_lmry_ar_ws_taxtype) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_taxtype", value: config.custrecord_lmry_ar_ws_taxtype });

            }

            if (config.custrecord_lmry_ar_ws_tran_types) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_transactiontypes", value: config.custrecord_lmry_ar_ws_tran_types });
            if (config.custrecord_lmry_ar_ws_gen_transaction) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_gen_transaction", value: config.custrecord_lmry_ar_ws_gen_transaction });
            // tax information
            if (config.custrecord_lmry_ar_ws_type) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_subtype", value: config.custrecord_lmry_ar_ws_type });
            if (config.custrecord_lmry_ar_ws_subtype) newContributoryClass.setValue({ fieldId: "custrecord_lmry_sub_type", value: config.custrecord_lmry_ar_ws_subtype });
            if (config.custrecord_lmry_ar_ws_appliesto) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_appliesto", value: config.custrecord_lmry_ar_ws_appliesto });

            if(taxrate) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_taxrate", value: parseFloat(taxrate)/100 })

            if (taxrate) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_taxrate_pctge", value: taxrate });

            let defRatio = ratio || (config.custrecord_lmry_ar_ws_additional_ratio || '');

            if (defRatio) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_addratio", value: defRatio });
            if (config.custrecord_lmry_ar_ws_tax_code_group) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_taxcode_group", value: config.custrecord_lmry_ar_ws_tax_code_group });
            // dates
            if (datefrom) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_fechdesd", value: format.parse({ value: datefrom, type: "date" }) });
            if (dateto) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_fechhast", value: format.parse({ value: dateto, type: "date" }) });
            if (datepublic) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_fechpubl", value: format.parse({ value: datepublic, type: "date" }) });
            // segmentation
            if (config.custrecord_lmry_ar_ws_class) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_class", value: config.custrecord_lmry_ar_ws_class });
            if (config.custrecord_lmry_ar_ws_location) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_department", value: config.custrecord_lmry_ar_ws_location });
            if (config.custrecord_lmry_ar_ws_department) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_department", value: config.custrecord_lmry_ar_ws_department });
            // additional information
            if (config.custrecord_lmry_ar_ws_resptype) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_resptype", value: config.custrecord_lmry_ar_ws_resptype });
            if (config.custrecord_lmry_ar_ws_jurisdiccion) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_jurisdib", value: config.custrecord_lmry_ar_ws_jurisdiccion });

            if(config.custrecord_lmry_ar_ws_tax_item) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_taxitem", value: config.custrecord_lmry_ar_ws_tax_item });

            if(concepto) newContributoryClass.setValue({ fieldId: "custrecord_ls_ar_rg5333_ganancias_concep", value: concepto });
            if(config.custrecord_lmry_ar_ws_taxcode) newContributoryClass.setValue({ fieldId: "custrecord_lmry_ar_ccl_taxcode", value: config.custrecord_lmry_ar_ws_taxcode });

            newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_minamount", value: config.custrecord_lmry_ar_ws_minimun_amount || ''});
            newContributoryClass.setValue({ fieldId: idIvaGanancias, value: true});

            //Ganancias
            if(idIvaGanancias == 'custrecord_ls_ganancias_rg_5333'){
                newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_not_taxable_minimum", value: config.custrecord_lmry_ar_ws_minimun_amount || ''});
                newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_minamount", value: minimo || ''});
                newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_base_amount", value: baseamount || ''});
                newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_set_baseretention", value: baseretention || ''});
                newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_maxamount", value: maximo || ''});
            }else{
                newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_not_taxable_minimum", value: config.custrecord_lmry_ar_ws_non_taxable_min || ''});
                newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_minamount", value: config.custrecord_lmry_ar_ws_minimun_amount || ''});
                newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_maxamount", value: config.custrecord_lmry_ar_ws_maximun_amount || ''});
            }

            newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_minimum_retention", value: config.custrecord_lmry_ar_ws_minimum_retention || ''});

            newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_montaccum", value: config.custrecord_lmry_ar_ws_month_accum === 'T' ? true : false});
            newContributoryClass.setValue({ fieldId: "custrecord_lmry_ccl_new_logic", value: config.custrecord_lmry_ar_ws_sub_last_ret === 'T' ? true : false});


            return newContributoryClass.save({ ignoreMandatoryFields: true, disabledTriggers: true });
        }

        getContributoryAvailableGanancias({ vendorID, taxtype, type, subsidiary, concepto }){

          return query
              .runSuiteQL({
                  query: `
                  SELECT
                      id
                  FROM
                      customrecord_lmry_ar_contrib_class
                  WHERE
                      custrecord_lmry_ar_ccl_entity = ?
                  AND
                      custrecord_lmry_ccl_taxtype = ?
                  AND
                      custrecord_lmry_ar_ccl_subtype = ?
                  AND
                      custrecord_lmry_ar_ccl_subsidiary = ?
                  AND
                      custrecord_ls_ar_rg5333_ganancias_concep = ?
                  AND
                    isinactive = 'F'
                  AND
                    custrecord_ls_ganancias_rg_5333 = 'T'
                  `,
                  params: [vendorID, taxtype, type, subsidiary, concepto]
              })
              .asMappedResults();


        }

        getContributoryAvailable({ vendorID, taxtype, type, subsidiary }) {

            return query
                .runSuiteQL({
                    query: `
                    SELECT
                        id
                    FROM
                        customrecord_lmry_ar_contrib_class
                    WHERE
                        custrecord_lmry_ar_ccl_entity = ?
                    AND
                        custrecord_lmry_ccl_taxtype = ?
                    AND
                        custrecord_lmry_ar_ccl_subtype = ?
                    AND
                        custrecord_lmry_ar_ccl_subsidiary = ?
                    AND
                        custrecord_ls_iva_rg_5333 = 'T'
                    AND
                      isinactive = 'F'
                    `,
                    params: [vendorID, taxtype, type, subsidiary]
                })
                .asMappedResults();
        }
        createRecordMinerActivities(minerActivityData) {
            const newRecordMinerActivities = record.create({
                type: "customrecord_ls_ar_miner_activities_tax",
                isDynamic: true
            });
            newRecordMinerActivities.setValue("custrecord_ls_ar_tax_record_vendor", minerActivityData.custrecord_ls_ar_tax_record_vendor);
            newRecordMinerActivities.setValue("custrecord_ls_ar_tax_record_date_beggin", minerActivityData.custrecord_ls_ar_tax_record_date_beggin);
            if (minerActivityData.custrecord_ls_ar_tax_record_date_end)
                newRecordMinerActivities.setValue("custrecord_ls_ar_tax_record_date_end", minerActivityData.custrecord_ls_ar_tax_record_date_end);
            newRecordMinerActivities.setValue("custrecord_ls_ar_tax_record_status", minerActivityData.custrecord_ls_ar_tax_record_status);
            newRecordMinerActivities.setValue("custrecord_ls_ar_tax_record_section", minerActivityData.custrecord_ls_ar_tax_record_section);
            return newRecordMinerActivities.save();
        }
        /**
         *
         * @returns {Array<{
         * id,
         * custrecord_ls_ar_tax_record_vendor,
         * custrecord_ls_ar_tax_record_date_beggin,
         * custrecord_ls_ar_tax_record_date_end,
         * custrecord_ls_ar_tax_record_status,
         * custrecord_ls_ar_tax_record_section
         * }>}
         */
        duplicateValidatorMinerActivities({ vendorID, sectionID }) {
            return query
                .runSuiteQL({
                    query: `
            SELECT
                id,
                custrecord_ls_ar_tax_record_vendor,
                custrecord_ls_ar_tax_record_date_beggin,
                custrecord_ls_ar_tax_record_date_end,
                custrecord_ls_ar_tax_record_status,
                custrecord_ls_ar_tax_record_section
            FROM
                customrecord_ls_ar_miner_activities_tax
            WHERE
                custrecord_ls_ar_tax_record_vendor = ?
            AND
                custrecord_ls_ar_tax_record_section = ?
            `,
                    params: [vendorID, sectionID]
                })
                .asMappedResults();
        }
        /**
         * Funcion de actualizacion de un registro del record Registro Fiscal de Actividades Mineras
         * @param {number} param0.id ID del record
         * @param {object} param0.values Objecto con los valores a actualizar
         * @returns {number} ID del record
         */
        updateMinerActivities({ id, values }) {
            return record.submitFields({
                type: "customrecord_ls_ar_miner_activities_tax",
                id: id,
                values: values
            });
        }
        getFiscalActivities() {
            return query
                .runSuiteQL({
                    query: `
                    select
                        id,
                        name,
                        custrecord_ls_ar_act_status_alicuota
                    from
                        customrecord_ls_ar_miner_act_status`
                })
                .asMappedResults();
        }
        getSections() {
            return query
                .runSuiteQL({
                    query: `
                    select
                        id,
                        name
                    from
                        customlist_ls_ar_section`
                })
                .asMappedResults();
        }
        /**
         *
         * @returns {Array<{
         * id:number,
         * custrecord_ls_ar_retener_inscritos:number,
         * custrecord_ls_ar_retener_no_inscritos:number
         * custrecord_ls_ar_retener_no_rg5333:number
         * custrecord_ls_ar_monto_no_retencion:number
         * custrecord_ls_ar_concepto_related:number
         * }>}
         */
        getRG5333Concepts() {
            return query
                .runSuiteQL({
                    query: `
            SELECT
                id,
                custrecord_ls_ar_retener_inscritos,
                custrecord_ls_ar_retener_no_inscritos,
                custrecord_ls_ar_retener_no_rg5333,
                custrecord_ls_ar_monto_no_retencion,
                custrecord_ls_ar_concepto_related,
                custrecord_ls_ar_monto_minimo,
                custrecord_ls_base_amount,
                custrecordls_set_base_retention,
                custrecord_ls_ar_monto_maximo
            FROM
                CUSTOMRECORD_LS_AR_PERCENT_GANANCIAS
            `,
                    params: []
                })
                .asMappedResults();
        }
        manageCCGananciasByStatus({ vendor, config, whtInfo, rg5333Ganancias, subsidiary }) {
            let status = whtInfo["Estado"];

            //log.debug('status', status);

            const contributoryClassId = this.getContributoryAvailableGanancias({ vendorID: vendor, taxtype: 1, type: 1, subsidiary: subsidiary, concepto: rg5333Ganancias.id});
            let idCC = contributoryClassId[0] ? contributoryClassId[0].id : '';

            if(status == 'EXCLUIDO' && whtInfo['Fecha de exclusion']){
                let auxYear = whtInfo['Fecha de exclusion'].split('/')[2];
                auxYear = auxYear.substring(2,4);

                if(auxYear == 19){
                    status += auxYear;
                }

            }

            //log.debug('statusFinalGanancias', status);

            if (status === "ACTIVO" || status === "EXCLUIDO") {

                config[0].custrecord_lmry_ar_ws_minimun_amount = rg5333Ganancias.custrecord_ls_ar_monto_no_retencion || '';

                this.createOrUpdateContributoryClass({
                    config: config[0],
                    contributoryClassId: idCC,
                    taxrate: parseFloat(rg5333Ganancias.custrecord_ls_ar_retener_inscritos) * 100,
                    ratio: '',
                    entity: vendor,
                    datefrom: new Date(),
                    dateto: new Date(),
                    datepublic: new Date(),
                    concepto: rg5333Ganancias.id,
                    idIvaGanancias: 'custrecord_ls_ganancias_rg_5333',
                    minimo: parseFloat(rg5333Ganancias.custrecord_ls_ar_monto_minimo),
                    baseamount: rg5333Ganancias.custrecord_ls_base_amount,
                    baseretention: parseFloat(rg5333Ganancias.custrecordls_set_base_retention),
                    maximo: parseFloat(rg5333Ganancias.custrecord_ls_ar_monto_maximo)

                });
            }

            if (status === "EXCLUIDO19") {

              config[0].custrecord_lmry_ar_ws_minimun_amount = '';

                this.createOrUpdateContributoryClass({
                    config: config[0],
                    contributoryClassId: idCC,
                    taxrate: parseFloat(rg5333Ganancias.custrecord_ls_ar_retener_no_rg5333) * 100,
                    ratio: '',
                    entity: vendor,
                    datefrom: new Date(),
                    dateto: new Date(),
                    datepublic: new Date(),
                    concepto: rg5333Ganancias.id,
                    idIvaGanancias: 'custrecord_ls_ganancias_rg_5333',
                    minimo: parseFloat(rg5333Ganancias.custrecord_ls_ar_monto_minimo),
                    baseamount: rg5333Ganancias.custrecord_ls_base_amount,
                    baseretention: parseFloat(rg5333Ganancias.custrecordls_set_base_retention),
                    maximo: parseFloat(rg5333Ganancias.custrecord_ls_ar_monto_maximo)
                });
            }

            if (status === "SINREGISTRO") {

              log.debug('SINREGISTRO');

              config[0].custrecord_lmry_ar_ws_minimun_amount = '';

                this.createOrUpdateContributoryClass({
                    config: config[0],
                    contributoryClassId: idCC,
                    taxrate: parseFloat(rg5333Ganancias.custrecord_ls_ar_retener_no_rg5333) * 100,
                    ratio: '',
                    entity: vendor,
                    datefrom: new Date(),
                    dateto: new Date(),
                    datepublic: new Date(),
                    concepto: rg5333Ganancias.id,
                    idIvaGanancias: 'custrecord_ls_ganancias_rg_5333',
                    minimo: parseFloat(rg5333Ganancias.custrecord_ls_ar_monto_minimo),
                    baseamount: rg5333Ganancias.custrecord_ls_base_amount,
                    baseretention: parseFloat(rg5333Ganancias.custrecordls_set_base_retention),
                    maximo: parseFloat(rg5333Ganancias.custrecord_ls_ar_monto_maximo)
                });
            }
        }
        /**
         *
         * @returns {Array<{
         * itemid:string,
         * id:number,
         * custitem_ls_ar_item_concept_rg5333:number
         * }>}
         */
        getItemsWithRegimen() {

            return query
                .runSuiteQL({
                    query: `
                    SELECT
                        item.itemid,
                        item."ID",
                        item.custitem_ls_ar_item_concept_rg5333
                    FROM
                        item
                    WHERE
                        NOT(
                            item.custitem_ls_ar_item_concept_rg5333 IS NULL
                            )
                    `
                })
                .asMappedResults();
        }
        // general functions
        getElementByName({ list, name }) {
            const uniqueElement = list.filter((element) => element.name === name);
            if (uniqueElement.length > 0) {
                return uniqueElement[0];
            } else {
                return null;
            }
        }
        formatDateTextToDate(dateText) {

          if(dateText){
            const components = dateText.split("/");
            return new Date(`${components[1]}/${components[0]}/${components[2]}`);
          }

          return '';

        }
        /**
         *
         * @param {Date} date
         * @param {Number} days
         * @returns
         */
        discountDayFromDate(date, days = 0) {

          if(date){

            const t = date.getTime();
            const timeinmiliseconds = days * 86400000;
            return new Date(t - timeinmiliseconds);

          }

          return '';

        }
        addDayFromDate(date, days = 0) {

          if(date){

            const t = date.getTime();
            const timeinmiliseconds = days * 86400000;
            return new Date(t + timeinmiliseconds);

          }

          return '';


        }

        getSubsidiaries(){

          return query.runSuiteQL({
              query: `
              SELECT
                  subsidiary.id,
              FROM
                  subsidiary
              WHERE
                  country = 'AR'
              AND
                  isinactive = 'F'
              `
          })
          .asMappedResults()
          .map(({ id }) => id);

        }

    }

    return RG5333;
});
