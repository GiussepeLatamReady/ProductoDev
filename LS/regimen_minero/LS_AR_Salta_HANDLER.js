/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LS_AR_Salta_HANDLER.js
 * @Author anthony@latamready.com
 */
define(["N/http", "N/log", "N/search", "N/query", "N/record", "N/format"], function (http, log, search, query, record, format) {
    class PadronSalta {
        #context;
        constructor(context) {
            this.#context = context;
        }
        // standar functions
        getInputData() {
            try {
                const config = this.getWSContributorySetup();
                log.debug("config", config);

                if(!config.length){
                  return [];
                }

                const vendors = this.getVendorsBySaltaActive();
                log.debug("vendors", vendors);

                if(!vendors.length){
                  return [];
                }

                const risks = this.getRiesgoFiscal();

                log.debug('risks', risks);

                const saltaResponse = this.getWSInformation({ WSConfig: config, vendorsData: vendors, risk: risks });
                log.debug("www", saltaResponse);

                return saltaResponse;
            } catch (error) {
                log.error("getInputData", error);
                return [];
            }
        }
        map() {
            try {

                let wsData = this.#context.value;
                wsData = JSON.parse(wsData ?? "{}");
                log.debug("map", wsData);

                //Si está en el ws
                wsData.wsResults.forEach((wsResult, index) => {

                    const activityId = wsData.activities[wsResult["ACTIVIDADESECONOMICAS"]].id;

                    const recordID = this.getExistSaltaRecord({ economicActivity: activityId, entityID: wsData.id })[0];

                    log.debug('recordID', recordID);

                    const iibbsalta = this.createSaltaRecords({
                        entityID: wsData.id,
                        ecomicActivity: activityId,
                        refExento: wsResult.ACTEXENTAS,
                        certNoRet: wsResult.CERTNORETENCIONPERCEPCION ? true : false,
                        recordID: recordID ? recordID.id : ''
                    });
                    wsData.wsResults[index].iibbsalta = iibbsalta;
                });

                //No está en el ws
                /*if(!wsData.wsResults.length){

                }*/

                this.#context.write({ key: wsData.id, value: wsData });
            } catch (error) {
                log.debug("map-error", error);
            }
        }
        reduce() {
            try {
                this.#context.values.forEach((wsData) => {
                    wsData = JSON.parse(wsData ?? "{}");

                    log.debug('reduce', wsData);

                    let defRisk = wsData.custentity_ls_ar_riesgo_fiscal ? wsData.risk[wsData.custentity_ls_ar_riesgo_fiscal]['alicuota'] : 1;

                    //Si está en el ws
                    wsData.wsResults.forEach((wsResult) => {

                        if (wsResult.CERTNORETENCIONPERCEPCION) return;

                        if (wsResult["ACTIVIDADESECONOMICAS"] === "EX" || wsResult["ACTIVIDADESECONOMICAS"] === "EXC") return;

                        wsData.items.forEach((itemData) => {

                            const contributoryClassId = this.getContributoryAvailable({taxtype: 1, type: 2, vendorID: wsData.id, subsidiary: wsData.subsidiary, concepto: itemData.id});

                            log.debug('contributoryClassId', contributoryClassId);

                            let actividadProveedor = wsResult["ACTIVIDADESECONOMICAS"];
                            actividadProveedor = wsData.activities[actividadProveedor].alicuota;

                            let ratio = parseFloat(defRisk) * parseFloat(actividadProveedor);

                            this.createOrUpdateContributoryClass({
                                config: wsData.wsSetup[0],
                                contributoryClassId,
                                entity: wsData.id,
                                itemData,
                                entityRisk: wsData.custentity_ls_ar_riesgo_fiscal,
                                itemConcept: itemData.id,
                                iibbsalta: wsResult.iibbsalta,
                                ratio: ratio
                            });
                        });
                    });

                    //No está en el ws
                    if(!wsData.wsResults.length){
                      log.debug('No esta en el ws');

                      wsData.items.forEach((itemData) => {

                          const contributoryClassId = this.getContributoryAvailable({taxtype: 1, type: 2, vendorID: wsData.id, subsidiary: wsData.subsidiary, concepto: itemData.id});

                          log.debug('contributoryClassId', contributoryClassId);

                          let ratio = parseFloat(defRisk) * 3;

                          this.createOrUpdateContributoryClass({
                              config: wsData.wsSetup[0],
                              contributoryClassId,
                              entity: wsData.id,
                              ratio: ratio,
                              itemData,
                              entityRisk: wsData.custentity_ls_ar_riesgo_fiscal,
                              itemConcept: itemData.id,
                              iibbsalta: ''
                          });
                      });

                    }

                });
            } catch (error) {
                log.error("reduce-error", error);
            }

            // const timeNow = new Date();
            // const startMonth = new Date(timeNow.getFullYear(), timeNow.getMonth(), 1);
            // const endMonth = new Date(timeNow.getFullYear(), timeNow.getMonth() + 1, 0);

            //this.#context.write({ key: 1, value: 1 });
        }
        summarize() {}

        // methods
        getWSInformation({ WSConfig, vendorsData, risk }) {
            try {
                /**
                 * {
                    "30712350527": [
                        {
                        "CUIT": "30712350527",
                        "DENOMINACION": "AGV FALCON DRILLING S.R.L.",
                        "ACTIVIDADESECONOMICAS": "CM",
                        "ACTEXENTAS": "",
                        "CERTNORETENCIONPERCEPCION": ""
                        }
                    ]
                    }
                 */
                const activities = this.getSaltaEconomicActivities();

                log.debug('activities', activities);

                const itemsWithSalta = this.getItemsWithDGRSalta();

                log.debug('itemsWithSalta', itemsWithSalta);

                const conceptosSalta = this.getConceptosSalta(itemsWithSalta);

                log.debug('conceptosSalta', conceptosSalta);

                let getCuits = vendorsData.map((vendorData) => {
                  return vendorData.taxnumber;
                });

                getCuits = getCuits.filter((element, index) => {
                    return getCuits.indexOf(element) === index;
                });

                const WSResult = http.post({
                    //body: JSON.stringify(['20048192204']),
                    //body: JSON.stringify(['23049919069']),
                    body: JSON.stringify(vendorsData.map((vendorData) => vendorData.taxnumber)),
                    //url: "http://servicecuit.us-east-2.elasticbeanstalk.com/cuits/padron",
                    //url: "http://149.130.170.175/cuits/padron",
                    url: "http://149.130.171.192:3003/cuits/padron",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                /**@type {string:[{}]} */
                const informationByCUIT = JSON.parse(WSResult.body);

                log.debug('informationByCUIT', informationByCUIT);

                vendorsData = vendorsData.map((vendorData) => {
                    vendorData.activities = activities;
                    vendorData.items = conceptosSalta;
                    vendorData.wsSetup = WSConfig?.filter((config) => config.custrecord_lmry_ar_ws_subsidiary_cc === vendorData.subsidiary);
                    vendorData.wsResults = informationByCUIT[vendorData.taxnumber] || [];
                    vendorData.risk = risk;
                    return vendorData;
                });
                return vendorsData;
            } catch (error) {
                log.error("getWSInformation-error", error);
                return [];
            }
        }

        getConceptosSalta(itemsWithSalta){

          let jsonConceptos = [];
          let conceptosUsados = {};

          for(let i = 0; i < itemsWithSalta.length; i++){
            let idConcepto = itemsWithSalta[i].custitem_ls_ar_item_concept_salta;

            if(!conceptosUsados[idConcepto]){
              conceptosUsados[idConcepto] = idConcepto;

              jsonConceptos.push({
                'id': idConcepto,
                'alicuota': itemsWithSalta[i].alicuota,
                'custrecord_ls_ar_act_econ_startdate': itemsWithSalta[i].custrecord_ls_ar_act_econ_startdate,
                'custrecord_ls_ar_act_econ_enddate': itemsWithSalta[i].custrecord_ls_ar_act_econ_enddate,
                'custrecord_ls_ar_act_econ_minimun_amount': itemsWithSalta[i].custrecord_ls_ar_act_econ_minimun_amount
              })

            }

          }

          return jsonConceptos;

        }

        getWSContributorySetup() {
            return query
                .runSuiteQL({
                    query: `
                SELECT
                    id,
                    custrecord_lmry_ar_ws_accandmin_with,
                    custrecord_lmry_ar_ws_add_accumulated,
                    custrecord_lmry_ar_ws_additional_ratio,
                    custrecord_lmry_ar_ws_amountto,
                    custrecord_lmry_ar_ws_applies_account,
                    custrecord_lmry_ar_ws_applies_item,
                    custrecord_lmry_ar_ws_arba_padron,
                    custrecord_lmry_ar_ws_base_amount,
                    custrecord_lmry_ar_ws_tipo_padron,
                    custrecord_lmry_ar_ws_class,
                    custrecord_lmry_ar_ws_credit_account,
                    custrecord_lmry_ar_ws_debit_account,
                    custrecord_lmry_ar_ws_default_cc,
                    custrecord_lmry_ar_ws_default_percent,
                    custrecord_lmry_ar_ws_department,
                    custrecord_lmry_ar_ws_fiscal_doctype,
                    custrecord_lmry_ar_ws_tran_types,
                    custrecord_lmry_ar_ws_subsidiary_cc,
                    custrecord_lmry_ar_ws_taxtype,
                    custrecord_lmry_ar_ws_gen_transaction,
                    custrecord_lmry_ar_ws_sub_last_ret,
                    custrecord_lmry_ar_ws_normas_iibb,
                    custrecord_lmry_ar_ws_location,
                    custrecord_lmry_ar_ws_maximun_amount,
                    custrecord_lmry_ar_ws_minimun_amount,
                    custrecord_lmry_ar_ws_ccl_convmult,
                    custrecord_lmry_ar_ws_non_taxable_min,
                    custrecord_lmry_ar_ws_type,
                    custrecord_lmry_ar_ws_appliesto,
                    custrecord_lmry_ar_ws_tax_item,
                    custrecord_lmry_ar_ws_taxcode,
                    custrecord_lmry_ar_ws_month_accum,
                    custrecord_lmry_ar_ws_resptype,
                    custrecord_lmry_ar_ws_set_ret_base,
                    custrecord_lmry_ar_ws_jurisdiccion,
                    custrecord_lmry_ar_ws_tax_code_group,
                    custrecord_lmry_ar_ws_subtype,
                    custrecord_lmry_ar_ws_vat_included,
                    custrecord_lmry_ar_ws_minimum_retention
                FROM
                    CUSTOMRECORD_LMRY_AR_WS_SETUP
                WHERE
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.isinactive = 'F'
                AND
                    CUSTOMRECORD_LMRY_AR_WS_SETUP.custrecord_lmry_ar_ws_tipo_padron = ANY('SALTA-INGRESOS-BRUTOS')
                `,
                    params: []
                })
                .asMappedResults()
                .map((setupws) => {
                    setupws.custrecord_lmry_ar_ws_tran_types = setupws.custrecord_lmry_ar_ws_tran_types.split(",");
                    return setupws;
                });
        }
        getVendorsBySaltaActive() {
            return query
                .runSuiteQL({
                    query: `
                SELECT
                    Vendor.id,
                    Vendor.altname,
                    CONCAT(
                        Vendor.custentity_lmry_sv_taxpayer_number,
                        Vendor.custentity_lmry_digito_verificator
                    ) as taxnumber,
                    VendorSubsidiaryRelationship.subsidiary,
                    Vendor.custentity_ls_ar_riesgo_fiscal
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
                            subsidiary.custrecord_ls_ar_iibb_salta_inscr = 'T'
                            and subsidiary.isinactive = 'F'
                            and subsidiary.country = 'AR'
                    )
                    and (
                        Vendor.custentity_lmry_sv_taxpayer_number IS NOT NULL
                        and Vendor.custentity_lmry_digito_verificator IS NOT NULL
                        

                    )
                    and Vendor.isinactive = 'F'
            `,
                    params: []
                })
                .asMappedResults();

                //and (Vendor.id = 29050 OR Vendor.id = 29051)

        }

        createSaltaRecords({ entityID, ecomicActivity, refExento, certNoRet, recordID }) {

            const newSaltaRecord = recordID
                ? record.load({ type: "customrecord_ls_ar_padron_salta", isDynamic: true, id: recordID })
                : record.create({ type: "customrecord_ls_ar_padron_salta", isDynamic: true });
            newSaltaRecord.setValue("custrecord_ls_ar_padron_salta_proveedor", entityID);
            newSaltaRecord.setValue("custrecord_ls_ar_padron_salta_act_econ", ecomicActivity);
            newSaltaRecord.setValue("custrecord_ls_ar_padron_salta_act_exen", refExento);
            newSaltaRecord.setValue("custrecord_ls_ar_padron_salta_cert_no_re", certNoRet);
            return newSaltaRecord.save();
        }
        getExistSaltaRecord({ entityID, economicActivity }) {
            const saltaRecordResults = query
                .runSuiteQL({
                    query: `
                    SELECT
                        id
                    FROM
                        customrecord_ls_ar_padron_salta
                    WHERE
                        custrecord_ls_ar_padron_salta_proveedor = ?
                    and
                        isinactive = 'F'

                    `,
                    params: [entityID]
                })
                .asMappedResults();
            return saltaRecordResults;
        }
        createOrUpdateContributoryClass({ config, entity, itemData = {}, contributoryClassId, entityRisk, itemConcept, iibbsalta, ratio }) {

          const { alicuota, custrecord_ls_ar_act_econ_enddate, custrecord_ls_ar_act_econ_minimun_amount, custrecord_ls_ar_act_econ_startdate } = itemData;

            let newContributoryClass;
            if (Number(contributoryClassId)) {
                newContributoryClass = record.load({
                    type: "customrecord_lmry_ar_contrib_class",
                    id: contributoryClassId,
                    isDynamic: true
                });
            } else {
                newContributoryClass = record.create({
                    type: "customrecord_lmry_ar_contrib_class",
                    isDynamic: true
                });

                newContributoryClass.setValue("custrecord_lmry_ar_ccl_entity", entity);
                newContributoryClass.setValue("custrecord_lmry_ar_ccl_subsidiary", config.custrecord_lmry_ar_ws_subsidiary_cc);
                newContributoryClass.setValue("custrecord_lmry_ccl_subsidiary_country", 11);
                newContributoryClass.setValue("custrecord_lmry_ccl_taxtype", config.custrecord_lmry_ar_ws_taxtype || '');

            }

            newContributoryClass.setValue("custrecord_lmry_ccl_transactiontypes", config.custrecord_lmry_ar_ws_tran_types || []);
            newContributoryClass.setValue("custrecord_lmry_ccl_gen_transaction", config.custrecord_lmry_ar_ws_gen_transaction || '');
            newContributoryClass.setValue("custrecord_lmry_ar_ccl_subtype", config.custrecord_lmry_ar_ws_type || '');
            newContributoryClass.setValue("custrecord_lmry_sub_type", config.custrecord_lmry_ar_ws_subtype || '');
            newContributoryClass.setValue("custrecord_lmry_ccl_appliesto", config.custrecord_lmry_ar_ws_appliesto || '');
            newContributoryClass.setValue("custrecord_lmry_ar_ccl_taxitem", config.custrecord_lmry_ar_ws_tax_item || '');

            newContributoryClass.setValue("custrecord_lmry_ar_ccl_taxrate", parseFloat(alicuota));
            newContributoryClass.setValue("custrecord_lmry_ar_ccl_taxrate_pctge", alicuota * 100);
            newContributoryClass.setValue("custrecord_lmry_ccl_addratio", ratio || '');

            newContributoryClass.setValue("custrecord_lmry_ccl_minimum_retention", config.custrecord_lmry_ar_ws_minimum_retention || '');


            newContributoryClass.setValue(
                "custrecord_lmry_ar_ccl_fechdesd",
                format.parse({
                    value: custrecord_ls_ar_act_econ_startdate,
                    type: "date"
                })
            );
            newContributoryClass.setValue(
                "custrecord_lmry_ar_ccl_fechhast",
                format.parse({
                    value: custrecord_ls_ar_act_econ_enddate,
                    type: "date"
                })
            );
            newContributoryClass.setValue(
                "custrecord_lmry_ar_ccl_fechpubl",
                format.parse({
                    value: custrecord_ls_ar_act_econ_startdate,
                    type: "date"
                })
            );
            newContributoryClass.setValue("custrecord_lmry_ar_ccl_taxcode", config.custrecord_lmry_ar_ws_taxcode || '');
            newContributoryClass.setValue("custrecord_lmry_ccl_minamount", custrecord_ls_ar_act_econ_minimun_amount || '');
            newContributoryClass.setValue("custrecord_lmry_ccl_montaccum", config.custrecord_lmry_ar_ws_month_accum === "T" ? true : false);
            newContributoryClass.setValue("custrecord_lmry_ccl_applies_to_item", config.custrecord_lmry_ar_ws_applies_item || '');
            newContributoryClass.setValue("custrecord_lmry_ar_ccl_resptype", config.custrecord_lmry_ar_ws_resptype || '');
            newContributoryClass.setValue("custrecord_lmry_ar_ccl_jurisdib", config.custrecord_lmry_ar_ws_jurisdiccion || '');
            newContributoryClass.setValue("custrecord_lmry_ccl_taxcode_group", config.custrecord_lmry_ar_ws_tax_code_group || '');
            //newContributoryClass.setValue("custrecord_ls_ar_padron_salta", iibbsalta || '');
            //newContributoryClass.setValue("	custrecord_ls_ar_padron_salta_riesgo", entityRisk || '');
            newContributoryClass.setValue("custrecord_ls_salta_ib_concept", itemConcept || '');
            newContributoryClass.setValue('custrecord_ls_padron_salta', true);

            newContributoryClass.setValue('custrecord_lmry_ccl_not_taxable_minimum', config.custrecord_lmry_ar_ws_non_taxable_min || '');
            newContributoryClass.setValue('custrecord_lmry_ccl_new_logic', config.custrecord_lmry_ar_ws_sub_last_ret === "T" ? true : false);
            newContributoryClass.setValue('custrecord_lmry_ccl_maxamount', config.custrecord_lmry_ar_ws_maximun_amount || '');
            

            return newContributoryClass.save();
        }
        getContributoryAvailable({ vendorID, taxtype, type, subsidiary, concepto }) {
            return query
                .runSuiteQL({
                    query: `
                    SELECT TOP 1
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
                    and
                      custrecord_ls_salta_ib_concept = ?
                    and
                        isinactive = 'F'
                    and
                      custrecord_ls_padron_salta = 'T'
                    `,
                    params: [vendorID, taxtype, type, subsidiary, concepto]
                })
                .asMappedResults()[0]?.id;
        }

        //Valores como ju, cm, ex, exc por proveedor

        getSaltaEconomicActivities() {
            const list = {};
            query
                .runSuiteQL({
                    query: `
                SELECT
                    id,
                    name,
                    custrecord_ls_ar_eco_pad_rate_amount_b
                FROM
                    CUSTOMRECORD_LS_AR_ECON_PADRON_SALTA
                `,
                    params: []
                })
                .asMappedResults()
                .forEach((result) => {
                    list[result.name] = {
                      'id': result.id,
                      'alicuota': result.custrecord_ls_ar_eco_pad_rate_amount_b
                    };
                });
            return list;
        }

        getRiesgoFiscal(){
          const list = {};
          query.runSuiteQL({
            query: `
            SELECT
              id,
              name,
              custrecord_ls_fiscal_risk_dgr_salta_code,
              custrecord_ls_ar_fiscal_risk_dgr_salta_r
            FROM
              customrecord_ls_ar_fiscal_risk_dgr_salta
            WHERE
              isinactive = 'F'
            `
            }).asMappedResults()
            .forEach((result) => {
                list[result.id] =
                {
                  'name': result.name,
                  'code': result.custrecord_ls_fiscal_risk_dgr_salta_code,
                  'alicuota': result.custrecord_ls_ar_fiscal_risk_dgr_salta_r
                };
            });

            return list;
        }

        getItemsWithDGRSalta() {
            return query
                .runSuiteQL({
                    query: `
                SELECT
                    item.id,
                    item.custitem_ls_ar_item_concept_salta,
                    dgr.custrecord_ls_ar_act_econ_alicuota as alicuota,
                    dgr.custrecord_ls_ar_act_econ_startdate,
                    dgr.custrecord_ls_ar_act_econ_enddate,
                    dgr.custrecord_ls_ar_act_econ_minimun_amount
                FROM
                    item,
                    CUSTOMRECORD_LS_AR_ECON_ACT_DGR_SALTA as dgr
                WHERE
                    item.custitem_ls_ar_item_concept_salta IS NOT NULL
                and
                    item.isInactive='F'
                and
                    dgr.id = item.custitem_ls_ar_item_concept_salta
                and
                    dgr.isInactive = 'F'
                `
                })
                .asMappedResults();
        }
    }
    return PadronSalta;
});
