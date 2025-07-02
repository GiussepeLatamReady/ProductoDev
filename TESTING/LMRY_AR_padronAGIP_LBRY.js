/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_AR_padronAGIP_LBRY.js
 */
define(['N/file', 'N/search', 'N/runtime', 'N/record', 'N/log', 'N/query', 'N/format'], function (file, search, runtime, record, log, query, format) {
    class AGIPTXT {
        constructor(fileID, listEntitys, period, subsidiary) {            
            if (!Number(fileID) || typeof listEntitys !== 'object' || listEntitys.length !== 1) {
                throw new Error('Incorrect Parameters');
            }
            if (Number(period) === 0) throw new Error('Period undefined');
            if (Number(subsidiary) === 0) throw new Error('Subsidiary undefined');
            this.listContributoryClass = [];
            this.file = null;
            this.subsidiaryID = subsidiary;
            this.period = search.lookupFields({
                type: 'accountingperiod',
                id: period,
                columns: ['startdate', 'enddate']
            });
            this.typeEntity = listEntitys[0].typeEntity;
            this.loadFile(fileID);
            // this.config = getConfigAGIP();
            const ccConfig = getConfigContributoryClass(this.subsidiaryID, this.period, this.typeEntity === 'customer');
            if (ccConfig.length === 0) throw new Error('No hay configfuracion de AGIP Contributory class disponible');

            this.configCC = ccConfig[0];
            // if (listEntitys.length > 1) this.updateTaxMulti(listEntitys);
            if (listEntitys.length === 1) this.updateTaxUnit(listEntitys);
        }
        loadFile(fileID) {
            this.file = file.load({
                id: fileID
            });
        }
        updateTaxMulti(listCuitsByEntity) {
            /** @type {Array<number>} */
            const entityIDS = listCuitsByEntity.map((result) => {
                return Number(String(result.vatregnumber) + result.custentity_lmry_digito_verificator);
            });           
            const iterator = this.file.lines.iterator();
            let contador = 0;
            let conx = 0;
            let auxContributory = [];
            iterator.each((line) => {
                const lineValues = line.value.split(';');
                const index = entityIDS.indexOf(Number(lineValues[3]));
                if (conx < 50) {                   
                    conx++;
                }
                const isPerception = this.typeEntity === 'customer';
                const rate = isPerception ? Number(lineValues[7].replace(',', '.')) : Number(lineValues[8].replace(',', '.'));
                if (index >= 0) {
                    if (rate > 0) {
                        auxContributory.push({
                            // publicacion: lineValues[0],
                            // desde: lineValues[1],
                            // hasta: lineValues[2],
                            // cuit: Number(lineValues[3]),
                            // contrato: lineValues[4],
                            // estado: lineValues[5],
                            // alicuota: lineValues[6],
                            // apercepcion: Number(lineValues[7].replace(',', '.')),
                            // aretencion: Number(lineValues[8].replace(',', '.')),
                            // grupopercepcion: lineValues[9],
                            // gruporetencion: lineValues[10],
                            // rsocial: lineValues[11],
                            // config: this.config,
                            // configCC: this.configCC
    
                            custrecord_lmry_ar_ccl_subsidiary: this.configCC.custrecord_lmry_ar_agip_subsidiary_cc,
                            custrecord_lmry_ccl_subsidiary_country: 11,
                            custrecord_lmry_ar_ccl_entity: Number(listCuitsByEntity[index].internalid),
                            custrecord_lmry_ccl_transactiontypes: this.configCC.getValue('custrecord_lmry_ar_agip_tran_types'),
                            custrecord_lmry_ccl_gen_transaction: this.configCC.getValue('custrecord_lmry_ar_agip_gen_transaction'),
                            custrecord_lmry_ccl_taxtype: this.configCC.getValue('custrecord_lmry_ar_agip_taxtype'),
                            custrecord_lmry_ar_ccl_subtype: this.configCC.getValue('custrecord_lmry_ar_agip_ws_type'),
                            custrecord_lmry_sub_type: this.configCC.getValue('custrecord_lmry_ar_agip_subtype'),
                            custrecord_lmry_ccl_appliesto: this.configCC.getValue('custrecord_lmry_ar_agip_appliesto'),
                            custrecord_lmry_ar_ccl_taxrate_pctge: rate,
                            custrecord_lmry_ar_ccl_taxrate: rate / 100,
                            custrecord_lmry_ccl_taxcode_group: this.configCC.getValue('custrecord_lmry_ar_agip_tax_code_group'),
                            custrecord_lmry_ccl_minamount: this.configCC.getValue('custrecord_lmry_ar_agip_minimun_amount'),
                            custrecord_lmry_ar_ccl_taxitem: this.configCC.getValue('custrecord_lmry_ar_agip_tax_item'),
                            custrecord_lmry_ar_ccl_taxcode: this.configCC.getValue('custrecord_lmry_ar_agip_taxcode'),
                            custrecord_lmry_ar_ccl_fechdesd: ddmmyyToDate(lineValues[1]),
                            custrecord_lmry_ar_ccl_fechhast: ddmmyyToDate(lineValues[2]),
                            custrecord_lmry_ar_ccl_fechpubl: ddmmyyToDate(lineValues[0]),
                            custrecord_lmry_ar_ccl_resptype: listCuitsByEntity[index].responsibleType || this.configCC.getValue('custrecord_lmry_ar_agip_resptype'),
                            custrecord_lmry_ar_ccl_jurisdib: this.configCC.getValue('custrecord_lmry_ar_agip_jurisdiccion'),
                            custrecord_lmry_ar_normas_iibb: this.configCC.getValue('custrecord_lmry_ar_agip_normas_iibb'),
                            custrecord_lmry_amount: this.configCC.getValue('custrecord_lmry_ar_agip_amountto'),
                            isRetention: true
                        });
                    }
                    listCuitsByEntity.splice(index, 1);
                }
                if (auxContributory.length === 200) {
                    this.listContributoryClass.push({ key: contador, values: auxContributory });
                    auxContributory = [];
                    contador++;
                }
                return true;
            });
            listCuitsByEntity.forEach((entity) => {
                if (this.typeEntity === 'customer' && entity.stateBuenosAires) {
                    this.listContributoryClass.push({
                        key: contador,
                        values: [
                            {
                                custrecord_lmry_ar_ccl_subsidiary: this.configCC.custrecord_lmry_ar_agip_subsidiary_cc,
                                custrecord_lmry_ccl_subsidiary_country: 11,
                                custrecord_lmry_ar_ccl_entity: Number(entity.internalid),
                                custrecord_lmry_ccl_transactiontypes: this.configCC.custrecord_lmry_ar_agip_tran_types,
                                custrecord_lmry_ccl_gen_transaction: this.configCC.custrecord_lmry_ar_agip_gen_transaction,
                                custrecord_lmry_ccl_taxtype: this.configCC.custrecord_lmry_ar_agip_taxtype,
                                custrecord_lmry_ar_ccl_subtype: this.configCC.custrecord_lmry_ar_agip_ws_type,
                                custrecord_lmry_sub_type: this.configCC.custrecord_lmry_ar_agip_subtype,
                                custrecord_lmry_ccl_appliesto: this.configCC.custrecord_lmry_ar_agip_appliesto,
                                custrecord_lmry_ar_ccl_taxrate_pctge: Number(this.configCC.custrecord_lmry_ar_agip_tax_rate.replace('%', '')),
                                custrecord_lmry_ar_ccl_taxrate: Number(this.configCC.custrecord_lmry_ar_agip_tax_rate.replace('%', '')) / 100,
                                custrecord_lmry_ccl_taxcode_group: this.configCC.custrecord_lmry_ar_agip_tax_code_group,
                                custrecord_lmry_ccl_minamount: this.configCC.custrecord_lmry_ar_agip_minimun_amount,
                                custrecord_lmry_ar_ccl_taxitem: this.configCC.custrecord_lmry_ar_agip_tax_item,
                                custrecord_lmry_ar_ccl_taxcode: this.configCC.custrecord_lmry_ar_agip_taxcode,
                                custrecord_lmry_ar_ccl_fechdesd: format.parse({
                                    value: this.configCC.custrecord_lmry_ar_agip_date_from,
                                    type: format.Type.DATE
                                }),
                                custrecord_lmry_ar_ccl_fechhast: format.parse({
                                    value: this.configCC.custrecord_lmry_ar_agip_date_to,
                                    type: format.Type.DATE
                                }),
                                custrecord_lmry_ar_ccl_fechpubl: format.parse({
                                    value: this.configCC.custrecord_lmry_ar_agip_date_publi,
                                    type: format.Type.DATE
                                }),
                                custrecord_lmry_ar_ccl_resptype: entity.responsibleType || this.configCC.custrecord_lmry_ar_agip_resptype,
                                custrecord_lmry_ar_ccl_jurisdib: this.configCC.custrecord_lmry_ar_agip_jurisdiccion,
                                custrecord_lmry_ar_normas_iibb: this.configCC.custrecord_lmry_ar_agip_normas_iibb,
                                custrecord_lmry_amount: this.configCC.custrecord_lmry_ar_agip_amountto,
                                // extras
                                custrecord_lmry_ccl_accandmin_with: this.configCC.custrecord_lmry_ar_agip_accandmin_with,
                                custrecord_lmry_ccl_add_accumulated: this.configCC.custrecord_lmry_ar_agip_add_accumulated,
                                custrecord_lmry_ccl_applies_to_account: this.configCC.custrecord_lmry_ar_agip_applies_account,
                                custrecord_lmry_ccl_applies_to_item: this.configCC.custrecord_lmry_ar_agip_applies_item,
                                custrecord_lmry_ccl_base_amount: this.configCC.custrecord_lmry_ar_agip_base_amount,
                                custrecord_lmry_ar_ccl_class: this.configCC.custrecord_lmry_ar_agip_class,
                                custrecord_lmry_br_ccl_account1: this.configCC.custrecord_lmry_ar_agip_debit_account,
                                custrecord_lmry_ar_ccl_department: this.configCC.custrecord_lmry_ar_agip_department,
                                custrecord_lmry_ar_ccl_location: this.configCC.custrecord_lmry_ar_agip_location,
                                custrecord_lmry_ccl_maxamount: this.configCC.custrecord_lmry_ar_agip_maximun_amount,
                                custrecord_lmry_ccl_montaccum: this.configCC.custrecord_lmry_ar_agip_month_accum,
                                custrecord_lmry_ccl_not_taxable_minimum: this.configCC.custrecord_lmry_ar_agip_non_taxable_min,
                                custrecord_lmry_ccl_set_baseretention: this.configCC.custrecord_lmry_ar_agip_set_ret_base,
                                custrecord_lmry_ccl_new_logic: this.configCC.custrecord_lmry_ar_agip_sub_last_ret
                            }
                        ]
                    });
                    contador++;
                }
            });
            if (auxContributory.length > 0) {
                this.listContributoryClass.push({ key: contador, values: auxContributory });
            }
        }
        /**
         *
         * @param {Array} listCuitsByEntity
         */
        updateTaxUnit(listCuitsByEntity) {
            const entityIDS = listCuitsByEntity.map((result) => {
                return Number(String(result.vatregnumber) + result.custentity_lmry_digito_verificator);
            });           
            const iterator = this.file.lines.iterator();
            let contador = 0;
            
            iterator.each((/** @type {{value:string}} */ line) => {
                const lineValues = line.value.split(';');
                const index = entityIDS.indexOf(Number(lineValues[3]));
                const isPerception = this.typeEntity === 'customer';
                const rate = isPerception ? Number(lineValues[7].replace(',', '.')) : Number(lineValues[8].replace(',', '.'));
                if (index >= 0) {
                    if (rate > 0) {                       
                        this.listContributoryClass.push({
                            key: contador,
                            values: [
                                {
                                    // entityID: Number(entityID),
                                    // publicacion: lineValues[0],
                                    // desde: lineValues[1],
                                    // hasta: lineValues[2],
                                    // cuit: Number(lineValues[3]),
                                    // contrato: lineValues[4],
                                    // estado: lineValues[5],
                                    // alicuota: lineValues[6],
                                    // apercepcion: Number(lineValues[7].replace(',', '.')),
                                    // aretencion: Number(lineValues[8].replace(',', '.')),
                                    // grupopercepcion: lineValues[9],
                                    // gruporetencion: lineValues[10],
                                    // rsocial: lineValues[11],
                                    // config: this.config,
                                    // configCC: this.configCC
                                    createSetup:0,
                                    isRetention: !isPerception,
                                    custrecord_lmry_ar_ccl_subsidiary: this.configCC.custrecord_lmry_ar_agip_subsidiary_cc,
                                    custrecord_lmry_ccl_subsidiary_country: 11,
                                    custrecord_lmry_ar_ccl_entity: Number(listCuitsByEntity[0].internalid),
                                    custrecord_lmry_ccl_transactiontypes: this.configCC.custrecord_lmry_ar_agip_tran_types.split(','),
                                    custrecord_lmry_ccl_gen_transaction: this.configCC.custrecord_lmry_ar_agip_gen_transaction,
                                    custrecord_lmry_ccl_taxtype: this.configCC.custrecord_lmry_ar_agip_taxtype,
                                    custrecord_lmry_ar_ccl_subtype: this.configCC.custrecord_lmry_ar_agip_ws_type,
                                    custrecord_lmry_sub_type: this.configCC.custrecord_lmry_ar_agip_subtype,
                                    custrecord_lmry_ccl_appliesto: this.configCC.custrecord_lmry_ar_agip_appliesto,
                                    custrecord_lmry_ar_ccl_taxrate_pctge: rate,
                                    custrecord_lmry_ar_ccl_taxrate: rate / 100,
                                    custrecord_lmry_ccl_taxcode_group: this.configCC.custrecord_lmry_ar_agip_tax_code_group,
                                    custrecord_lmry_ccl_minamount: this.configCC.custrecord_lmry_ar_agip_minimun_amount,
                                    custrecord_lmry_ar_ccl_taxitem: this.configCC.custrecord_lmry_ar_agip_tax_item,
                                    custrecord_lmry_ar_ccl_taxcode: this.configCC.custrecord_lmry_ar_agip_taxcode,
                                    custrecord_lmry_ar_ccl_fechdesd: ddmmyyToDate(lineValues[1]),
                                    custrecord_lmry_ar_ccl_fechhast: ddmmyyToDate(lineValues[2]),
                                    custrecord_lmry_ar_ccl_fechpubl: ddmmyyToDate(lineValues[0]),
                                    custrecord_lmry_ar_ccl_resptype: listCuitsByEntity[index].responsibleType || this.configCC.custrecord_lmry_ar_agip_resptype,
                                    custrecord_lmry_ar_ccl_jurisdib: this.configCC.custrecord_lmry_ar_agip_jurisdiccion,
                                    custrecord_lmry_ar_normas_iibb: this.configCC.custrecord_lmry_ar_agip_normas_iibb,
                                    custrecord_lmry_amount: this.configCC.custrecord_lmry_ar_agip_amountto,
                                    // extras
                                    custrecord_lmry_ccl_accandmin_with: this.configCC.custrecord_lmry_ar_agip_accandmin_with,
                                    custrecord_lmry_ccl_add_accumulated: this.configCC.custrecord_lmry_ar_agip_add_accumulated,
                                    custrecord_lmry_ccl_applies_to_account: this.configCC.custrecord_lmry_ar_agip_applies_account,
                                    custrecord_lmry_ccl_applies_to_item: this.configCC.custrecord_lmry_ar_agip_applies_item,
                                    custrecord_lmry_ccl_base_amount: this.configCC.custrecord_lmry_ar_agip_base_amount,
                                    custrecord_lmry_ar_ccl_class: this.configCC.custrecord_lmry_ar_agip_class,
                                    custrecord_lmry_br_ccl_account1: this.configCC.custrecord_lmry_ar_agip_debit_account,
                                    custrecord_lmry_ar_ccl_department: this.configCC.custrecord_lmry_ar_agip_department,
                                    custrecord_lmry_ar_ccl_location: this.configCC.custrecord_lmry_ar_agip_location,
                                    custrecord_lmry_ccl_maxamount: this.configCC.custrecord_lmry_ar_agip_maximun_amount,
                                    custrecord_lmry_ccl_montaccum: this.configCC.custrecord_lmry_ar_agip_month_accum,
                                    custrecord_lmry_ccl_not_taxable_minimum: this.configCC.custrecord_lmry_ar_agip_non_taxable_min,
                                    custrecord_lmry_ccl_set_baseretention: this.configCC.custrecord_lmry_ar_agip_set_ret_base,
                                    custrecord_lmry_ccl_new_logic: this.configCC.custrecord_lmry_ar_agip_sub_last_ret
                                }
                            ]
                        });
                        contador++;
                    }
                    listCuitsByEntity.splice(index, 1);
                }

                return true;
            });           
            listCuitsByEntity.forEach((entity) => {
                if ((this.typeEntity === 'customer' && entity.stateBuenosAires) || this.typeEntity === 'vendor') {
                    this.listContributoryClass.push({
                        key: contador,
                        values: [
                            {
                                createSetup:1,
                                isRetention: this.typeEntity === 'vendor',
                                custrecord_lmry_ar_ccl_subsidiary: this.configCC.custrecord_lmry_ar_agip_subsidiary_cc,
                                custrecord_lmry_ccl_subsidiary_country: 11,
                                custrecord_lmry_ar_ccl_entity: Number(entity.internalid),
                                custrecord_lmry_ccl_transactiontypes: this.configCC.custrecord_lmry_ar_agip_tran_types.split(','),
                                custrecord_lmry_ccl_gen_transaction: this.configCC.custrecord_lmry_ar_agip_gen_transaction,
                                custrecord_lmry_ccl_taxtype: this.configCC.custrecord_lmry_ar_agip_taxtype,
                                custrecord_lmry_ar_ccl_subtype: this.configCC.custrecord_lmry_ar_agip_ws_type,
                                custrecord_lmry_sub_type: this.configCC.custrecord_lmry_ar_agip_subtype,
                                custrecord_lmry_ccl_appliesto: this.configCC.custrecord_lmry_ar_agip_appliesto,
                                custrecord_lmry_ar_ccl_taxrate_pctge: this.configCC.custrecord_lmry_ar_agip_tax_rate.replace('%', ''),
                                custrecord_lmry_ar_ccl_taxrate: this.configCC.custrecord_lmry_ar_agip_tax_rate.replace('%', '') / 100,
                                custrecord_lmry_ccl_taxcode_group: this.configCC.custrecord_lmry_ar_agip_tax_code_group,
                                custrecord_lmry_ccl_minamount: this.configCC.custrecord_lmry_ar_agip_minimun_amount,
                                custrecord_lmry_ar_ccl_taxitem: this.configCC.custrecord_lmry_ar_agip_tax_item,
                                custrecord_lmry_ar_ccl_taxcode: this.configCC.custrecord_lmry_ar_agip_taxcode,
                                custrecord_lmry_ar_ccl_fechdesd: format.parse({
                                    value: this.configCC.custrecord_lmry_ar_agip_date_from,
                                    type: format.Type.DATE
                                }),
                                custrecord_lmry_ar_ccl_fechhast: format.parse({
                                    value: this.configCC.custrecord_lmry_ar_agip_date_to,
                                    type: format.Type.DATE
                                }),
                                custrecord_lmry_ar_ccl_fechpubl: format.parse({
                                    value: this.configCC.custrecord_lmry_ar_agip_date_publi,
                                    type: format.Type.DATE
                                }),
                                custrecord_lmry_ar_ccl_resptype: entity.responsibleType || this.configCC.custrecord_lmry_ar_agip_resptype,
                                custrecord_lmry_ar_ccl_jurisdib: this.configCC.custrecord_lmry_ar_agip_jurisdiccion,
                                custrecord_lmry_ar_normas_iibb: this.configCC.custrecord_lmry_ar_agip_normas_iibb,
                                custrecord_lmry_amount: this.configCC.custrecord_lmry_ar_agip_amountto,
                                // extras
                                custrecord_lmry_ccl_accandmin_with: this.configCC.custrecord_lmry_ar_agip_accandmin_with,
                                custrecord_lmry_ccl_add_accumulated: this.configCC.custrecord_lmry_ar_agip_add_accumulated,
                                custrecord_lmry_ccl_applies_to_account: this.configCC.custrecord_lmry_ar_agip_applies_account,
                                custrecord_lmry_ccl_applies_to_item: this.configCC.custrecord_lmry_ar_agip_applies_item,
                                custrecord_lmry_ccl_base_amount: this.configCC.custrecord_lmry_ar_agip_base_amount,
                                custrecord_lmry_ar_ccl_class: this.configCC.custrecord_lmry_ar_agip_class,
                                custrecord_lmry_br_ccl_account1: this.configCC.custrecord_lmry_ar_agip_debit_account,
                                custrecord_lmry_ar_ccl_department: this.configCC.custrecord_lmry_ar_agip_department,
                                custrecord_lmry_ar_ccl_location: this.configCC.custrecord_lmry_ar_agip_location,
                                custrecord_lmry_ccl_maxamount: this.configCC.custrecord_lmry_ar_agip_maximun_amount,
                                custrecord_lmry_ccl_montaccum: this.configCC.custrecord_lmry_ar_agip_month_accum,
                                custrecord_lmry_ccl_not_taxable_minimum: this.configCC.custrecord_lmry_ar_agip_non_taxable_min,
                                custrecord_lmry_ccl_set_baseretention: this.configCC.custrecord_lmry_ar_agip_set_ret_base,
                                custrecord_lmry_ccl_new_logic: this.configCC.custrecord_lmry_ar_agip_sub_last_ret
                            }
                        ]
                    });
                    contador++;
                }
            });
        }
        getListContributoryClass() {
            return this.listContributoryClass.map((CC) => {
                return createTax(CC);
            });
        }
    }
    /**
     *
     * @param {string} type
     * @param {number} subsidiary
     * @param {number} juridicPerson
     * @param {number} nroID
     * @param {string} isvalidCuit
     * @param {string} isOpenTransactions
     * @returns {Array<any>} Arreglo de objetos Result
     */
    function cargarEntity(type, subsidiary, juridicPerson, nroID, isvalidCuit, isOpenTransactions) {        
        let filters = [
            search.createFilter({
                name: 'isinactive',
                operator: search.Operator.IS,
                values: 'F'
            }), search.createFilter({
                name: 'vatregnumber',
                operator: search.Operator.ISNOTEMPTY
            }),
            search.createFilter({
                name: 'custentity_lmry_digito_verificator',
                operator: search.Operator.ISNOTEMPTY
            })];

        var FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
        var FEAT_MULTISUBS = runtime.isFeatureInEffect({
            feature: "multisubsidiarycustomer"
        });

        if (FEAT_SUBS == true || FEAT_SUBS == "T") {
            if (type == "customer") {
                if (FEAT_MULTISUBS == true || FEAT_MULTISUBS == "T") {
                    filters.push(search.createFilter({
                        name: "internalid",
                        join: "msesubsidiary",
                        operator: search.Operator.ANYOF,
                        values: subsidiary
                    }));
                } else {
                    filters.push(search.createFilter({
                        name: "subsidiary",
                        operator: search.Operator.ANYOF,
                        values: subsidiary
                    }))
                    
                }
                
            } else if (type == "vendor") {
                filters.push(search.createFilter({
                    name: "internalid",
                    join: "msesubsidiary",
                    operator: search.Operator.ANYOF,
                    values: subsidiary
                }));
            }

            
        }

        filters.push(search.createFilter({
            name: "custentity_lmry_ar_no_create_cc",
            operator: search.Operator.IS,
            values: false
        }));

        if (Number(juridicPerson)) {
            filters.push(search.createFilter({
                name: 'custentity_lmry_ar_cuitc_tsuj',
                operator: search.Operator.IS,
                values: juridicPerson
            }));
        }
        if (Number(nroID)) {
            filters.push(
                search.createFilter({
                    name: 'internalid',
                    operator: 'is',
                    values: nroID
                })
            );
        }
        if (isvalidCuit === 'T') {
            filters.push(
                search.createFilter({
                    name: 'custentity_lmry_arba_cuit_invalid',
                    operator: 'is',
                    values: false
                })
            );
        }
        if (isOpenTransactions === 'T') {
            filters.push(
                search.createFilter({
                    name: 'status',
                    join: 'transaction',
                    operator: 'anyof',
                    values: ['VendBill:A', 'CustCred:A', 'CustInvc:A']
                })
            );
        }
        if (type === 'vendor') {
            filters.push(
                search.createFilter({
                    name: 'custentity_lmry_ar_cuitc',
                    operator: 'is',
                    values: '61'
                })
            );
            filters.push(
                search.createFilter({
                    name: 'custentity_lmry_ar_tiporespons',
                    operator: search.Operator.NONEOF,
                    values: '5'
                })
            );
            filters.push(
                search.createFilter({
                    name: 'custentity_lmry_ar_vendor_nivel',
                    operator: 'anyof',
                    values: ['@NONE@', '5']
                })
            );
        }
        if (type === 'customer') {
            filters.push(
                search.createFilter({
                    name: 'custentity_lmry_ar_tiporespons',
                    operator: search.Operator.NONEOF,
                    values: ['5', '7']
                })
            );
            filters.push(
                search.createFilter({
                    name: 'isdefaultbilling',
                    join: "address",
                    operator: search.Operator.IS,
                    values: 'T'
                })
            );
        }

        filters.push(
            search.createFilter({
                name: 'formulanumeric',
                formula: 'LENGTH({vatregnumber})+LENGTH({custentity_lmry_digito_verificator})',
                operator: search.Operator.EQUALTO,
                values: 11
            })
        );
        filters.push(
            search.createFilter({
                name: 'formulanumeric',
                formula: `REGEXP_INSTR({vatregnumber} , '^([0-9]){9}\\d')`,
                operator: search.Operator.EQUALTO,
                values: 1
            })
        );
        filters.push(
            search.createFilter({
                name: 'formulanumeric',
                formula: `REGEXP_INSTR({custentity_lmry_digito_verificator} , '^([0-9]){0}\\d')`,
                operator: search.Operator.EQUALTO,
                values: 1
            })
        );
        const columns = [
            search.createColumn({
                name: 'internalid',
                sort: search.Sort.ASC
            }),
            'vatregnumber',
            'custentity_lmry_digito_verificator',
            'custentity_lmry_ar_tiporespons'
        ];
        if (type === 'customer') {
            columns.push('address.state', 'address.city', 'address.isdefaultbilling', 'address.custrecord_lmry_addr_city');
        }
        let VendSearch = search.create({
            type: type,
            columns: columns,
            filters: filters
        });
        const pagedData = VendSearch.runPaged({ pageSize: 1000 });
        const entitys = [];

        // iterate the pages
        pagedData.pageRanges.forEach((pageRange, i) => {
            const currentPage = pagedData.fetch(i);
            currentPage.data.forEach(function (result) {
                const entityParse = {
                    internalid: result.getValue('internalid'),
                    vatregnumber: result.getValue('vatregnumber'),
                    custentity_lmry_digito_verificator: result.getValue('custentity_lmry_digito_verificator'),
                    typeEntity: type,
                    responsibleType: result.getValue('custentity_lmry_ar_tiporespons')
                };
                if (type === 'customer') {
                    if ((result.getText('address.custrecord_lmry_addr_city') || '').trim().length > 0) {
                        entityParse.stateBuenosAires = result.getText('address.custrecord_lmry_addr_city').toUpperCase().indexOf('CIUDAD AUTONOMA BUENOS AIRES') !== -1;
                    } else {
                        const useBuenosAires =
                            (result.getText({ name: 'state', join: "address" }) || '').toUpperCase().indexOf('CIUDAD AUTONOMA BUENOS AIRES') !== -1 ||
                            (result.getValue({ name: 'city', join: "address" }) || '').toUpperCase().indexOf('CIUDAD AUTONOMA BUENOS AIRES') !== -1
                        entityParse.stateBuenosAires = useBuenosAires;
                    }

                    // entityParse.billcity = ;
                    // entityParse.isdefaultbilling = result.getValue('isdefaultbilling');
                    // entityParse.state = (result.getValue('state') || '').toUpperCase();
                }
                entitys.push(entityParse);
            });
        });

        return entitys;
    }
    /**
     * Funcion de creacion del contributory class
     * @param {any} param0 objeto con datos para la creacion del cc
     */
    function createTax({ values }) {
        const newValues = values.map((value) => {
            const idResult = searchRecordContributoryClass(value, true);
            if (idResult === null) {
                value.idRetention = createContributory(value, true);
                value.status = 'Create';
            } else {
                value.idRetention = updateRecordContributoryClass(value, idResult);
                value.status = 'Update';
            }

            return value;
        });
        return newValues;
    }
    function createContributory(value) {        

        const contributoryClassRecord = record.create({
            type: 'customrecord_lmry_ar_contrib_class',
            isDynamic: false
        });
        for (const key in value) {
            if (Object.hasOwnProperty.call(value, key)) {
                const element = value[key];
                if (element !== null && element !== '') {
                    contributoryClassRecord.setValue({
                        fieldId: key,
                        value: element
                    });
                }
            }
        }      
        return contributoryClassRecord.save();
    }
    // const fields = {
    /**
     * Funcion para convertir string a tipo Date
     * @param {string} stringDate string en formato ddmmyyyy
     */
    function ddmmyyToDate(stringDate) {
        const day = Number(stringDate.slice(0, 2));
        const month = Number(stringDate.slice(2, 4));
        const year = Number(stringDate.slice(4, 8));
        return new Date(`${month}/${day}/${year}`);
    }
    /**
     * Funcion de formateo de string agip a string date record
     * @param {string} pFecha string en formato ddmmyyyy
     * @param {any} context objeto del contexto de ejecucion
     */
    function formatDateStringToString(pFecha, context) {
        const _dateformat = context.getPreference('DATEFORMAT');
        let _FechaReturn = '';

        switch (_dateformat) {
            case 'DD/MM/YYYY':
                _FechaReturn = pFecha.substring(0, 2) + '/' + pFecha.substring(2, 4) + '/' + pFecha.substring(4, 8);
                break;
            case 'MM/DD/YYYY':
                _FechaReturn = pFecha.substring(2, 4) + '/' + pFecha.substring(0, 2) + '/' + pFecha.substring(4, 8);
                break;
            case 'YYYY-MM-DD':
                _FechaReturn = pFecha.substring(4, 8) + '-' + pFecha.substring(2, 4) + '-' + pFecha.substring(0, 2);
                break;
            case 'YYYY/MM/DD':
                _FechaReturn = pFecha.substring(4, 8) + '/' + pFecha.substring(2, 4) + '/' + pFecha.substring(0, 2);
                break;
            default:
                _FechaReturn = pFecha.substring(0, 2) + '/' + pFecha.substring(2, 4) + '/' + pFecha.substring(4, 8);
                break;
        }
        return _FechaReturn;
    }
    /**
     * Funcion de busqueda de configuracion para el proceso de AGIP
     */
    function getConfigAGIP() {
        const columns = [
            'custrecord_lmry_ar_carga_padron_folder',
            'custrecord_lmry_ar_cp_percepcion_agip',
            'custrecord_lmry_ar_cp_retencion_agip',
            'custrecord_lmry_ar_iibb_jurisdic_agip',
            'custrecord_latam_ar_tax_code',
            'custrecord_lmry_ar_memo_retencion_agip',
            'custrecord_lmry_ar_memo_percepcion_agip'
        ];

        const searchresults = search
            .create({
                type: 'customrecord_lmry_ar_enable_feature_padr',
                columns: columns
            })
            .run()
            .getRange(0, 1);

        if (searchresults.length < 0) throw new Error('AgipSetup Not Configurated');
        const p = 0;
        const agipConfig = {
            folder: searchresults[p].getValue('custrecord_lmry_ar_carga_padron_folder'),
            itemPercepcion: searchresults[p].getValue('custrecord_lmry_ar_cp_percepcion_agip'),
            itemRetencion: searchresults[p].getValue('custrecord_lmry_ar_cp_retencion_agip'),
            jurisdiction: searchresults[p].getValue('custrecord_lmry_ar_iibb_jurisdic_agip'),
            taxCode: searchresults[p].getValue('custrecord_latam_ar_tax_code'),
            memoRetencion: searchresults[p].getValue('custrecord_lmry_ar_memo_retencion_agip'),
            memoPercepcion: searchresults[p].getValue('custrecord_lmry_ar_memo_percepcion_agip')
        };
        return agipConfig;
    }
    function updateRecordContributoryClass(CCObject, idCC) {
        const auxCCObject = {};
        for (const key in CCObject) {
            if (Object.hasOwnProperty.call(CCObject, key)) {
                const element = CCObject[key];
                if (element !== null && element !== '') {
                    auxCCObject[key] = element;
                }
            }
        }
        return record.submitFields({
            type: 'customrecord_lmry_ar_contrib_class',
            id: idCC,
            values: auxCCObject
        });
    }
    function searchRecordContributoryClass(CCObject) {
        const filters = [
            ['custrecord_lmry_ar_ccl_entity', 'anyof', CCObject.custrecord_lmry_ar_ccl_entity],
            'AND',
            ['custrecord_lmry_ar_ccl_fechdesd', 'on', format.format({ value: new Date(CCObject.custrecord_lmry_ar_ccl_fechdesd), type: format.Type.DATE })],
            'AND',
            ['custrecord_lmry_ar_ccl_fechhast', 'on', format.format({ value: new Date(CCObject.custrecord_lmry_ar_ccl_fechhast), type: format.Type.DATE })],
            'AND',
            ['custrecord_lmry_ar_ccl_fechpubl', 'on', format.format({ value: new Date(CCObject.custrecord_lmry_ar_ccl_fechpubl), type: format.Type.DATE })],
            'AND',
            ['isinactive', 'is', 'F'],
            'AND',
            ['custrecord_lmry_ccl_taxtype', 'is', CCObject.custrecord_lmry_ccl_taxtype],
            'AND',
            ['custrecord_lmry_ar_ccl_taxrate', 'is', CCObject.custrecord_lmry_ar_ccl_taxrate],
            'AND',
            ['custrecord_lmry_ccl_minamount', 'is', CCObject.custrecord_lmry_ccl_minamount],
            'AND',
            ['custrecord_lmry_ar_ccl_arba_padron', 'is', 'F']
        ];
        if (CCObject.isRetention) {
            filters.push('AND', ['custrecord_lmry_ar_ccl_subtype', 'is', CCObject.custrecord_lmry_ar_ccl_subtype]);
            filters.push('AND', ['custrecord_lmry_sub_type', 'is', CCObject.custrecord_lmry_sub_type]);
        }        
        const idResult = search
            .create({
                type: 'customrecord_lmry_ar_contrib_class',
                filters: filters,
                columns: ['internalid']
            })
            .run()
            .getRange(0, 1);
        if (idResult.length > 0) {
            return Number(idResult[0].getValue('internalid'));
        } else {
            return null;
        }
    }
    function getConfigContributoryClass(subsidiaryID, { startdate, enddate }, isPerception) {        
        const parsedResults = [];
        const columns = [
            'custrecord_lmry_ar_agip_subsidiary_cc',
            'custrecord_lmry_ar_agip_tran_types',
            'custrecord_lmry_ar_agip_gen_transaction',
            'custrecord_lmry_ar_agip_taxtype',
            'custrecord_lmry_ar_agip_ws_type',
            'custrecord_lmry_ar_agip_subtype',
            'custrecord_lmry_ar_agip_appliesto',
            'custrecord_lmry_ar_agip_tax_rate',
            'custrecord_lmry_ar_agip_tax_code_group',
            'custrecord_lmry_ar_agip_minimun_amount',
            'custrecord_lmry_ar_agip_tax_item',
            'custrecord_lmry_ar_agip_taxcode',
            'custrecord_lmry_ar_agip_date_from',
            'custrecord_lmry_ar_agip_date_to',
            'custrecord_lmry_ar_agip_date_publi',
            'custrecord_lmry_ar_agip_resptype',
            'custrecord_lmry_ar_agip_jurisdiccion',
            'custrecord_lmry_ar_agip_normas_iibb',
            'custrecord_lmry_ar_agip_amountto',
            // datos extra para la retecion
            'custrecord_lmry_ar_agip_accandmin_with',
            'custrecord_lmry_ar_agip_add_accumulated',
            'custrecord_lmry_ar_agip_applies_account',
            'custrecord_lmry_ar_agip_applies_item',
            'custrecord_lmry_ar_agip_base_amount',
            'custrecord_lmry_ar_agip_class',
            'custrecord_lmry_ar_agip_debit_account',
            'custrecord_lmry_ar_agip_default_percent',
            'custrecord_lmry_ar_agip_department',
            'custrecord_lmry_ar_agip_location',
            'custrecord_lmry_ar_agip_maximun_amount',
            'custrecord_lmry_ar_agip_month_accum',
            'custrecord_lmry_ar_agip_non_taxable_min',
            'custrecord_lmry_ar_agip_set_ret_base',
            'custrecord_lmry_ar_agip_sub_last_ret'
        ];
        const filters = [
            ['isinactive', 'is', 'F'],
            'AND',
            ['custrecord_lmry_ar_agip_date_from', search.Operator.ONORBEFORE, startdate],
            'AND',
            ['custrecord_lmry_ar_agip_date_to', search.Operator.ONORAFTER, enddate],
            'AND',
            ['custrecord_lmry_ar_agip_subsidiary_cc', search.Operator.IS, subsidiaryID]
        ];
        if (isPerception) {            
            filters.push('AND', ['custrecord_lmry_ar_agip_taxtype', 'equalto', '2']);
        } else {
            filters.push('AND', ['custrecord_lmry_ar_agip_taxtype', 'equalto', '1']);
        }
        const configurations = search
            .create({
                type: 'customrecord_lmry_ar_agip_setup',
                filters: filters,
                columns: columns
            })
            .run()
            .getRange(0, 1);
        configurations.forEach((setting) => {
            parsedResults.push({
                custrecord_lmry_ar_agip_subsidiary_cc: setting.getValue('custrecord_lmry_ar_agip_subsidiary_cc'),
                custrecord_lmry_ar_agip_tran_types: setting.getValue('custrecord_lmry_ar_agip_tran_types'),
                custrecord_lmry_ar_agip_gen_transaction: setting.getValue('custrecord_lmry_ar_agip_gen_transaction'),
                custrecord_lmry_ar_agip_taxtype: setting.getValue('custrecord_lmry_ar_agip_taxtype'),
                custrecord_lmry_ar_agip_ws_type: setting.getValue('custrecord_lmry_ar_agip_ws_type'),
                custrecord_lmry_ar_agip_subtype: setting.getValue('custrecord_lmry_ar_agip_subtype'),
                custrecord_lmry_ar_agip_appliesto: setting.getValue('custrecord_lmry_ar_agip_appliesto'),
                custrecord_lmry_ar_agip_tax_rate: setting.getValue('custrecord_lmry_ar_agip_tax_rate'),
                custrecord_lmry_ar_agip_tax_code_group: setting.getValue('custrecord_lmry_ar_agip_tax_code_group'),
                custrecord_lmry_ar_agip_minimun_amount: setting.getValue('custrecord_lmry_ar_agip_minimun_amount'),
                custrecord_lmry_ar_agip_tax_item: setting.getValue('custrecord_lmry_ar_agip_tax_item'),
                custrecord_lmry_ar_agip_taxcode: setting.getValue('custrecord_lmry_ar_agip_taxcode'),
                custrecord_lmry_ar_agip_date_from: setting.getValue('custrecord_lmry_ar_agip_date_from'),
                custrecord_lmry_ar_agip_date_to: setting.getValue('custrecord_lmry_ar_agip_date_to'),
                custrecord_lmry_ar_agip_date_publi: setting.getValue('custrecord_lmry_ar_agip_date_publi'),
                custrecord_lmry_ar_agip_resptype: setting.getValue('custrecord_lmry_ar_agip_resptype'),
                custrecord_lmry_ar_agip_jurisdiccion: setting.getValue('custrecord_lmry_ar_agip_jurisdiccion'),
                custrecord_lmry_ar_agip_normas_iibb: setting.getValue('custrecord_lmry_ar_agip_normas_iibb'),
                custrecord_lmry_ar_agip_amountto: setting.getValue('custrecord_lmry_ar_agip_amountto'),
                //
                custrecord_lmry_ar_agip_accandmin_with: setting.getValue('custrecord_lmry_ar_agip_accandmin_with'),
                custrecord_lmry_ar_agip_add_accumulated: setting.getValue('custrecord_lmry_ar_agip_add_accumulated'),
                custrecord_lmry_ar_agip_applies_account: setting.getValue('custrecord_lmry_ar_agip_applies_account'),
                custrecord_lmry_ar_agip_applies_item: setting.getValue('custrecord_lmry_ar_agip_applies_item'),
                custrecord_lmry_ar_agip_base_amount: setting.getValue('custrecord_lmry_ar_agip_base_amount'),
                custrecord_lmry_ar_agip_class: setting.getValue('custrecord_lmry_ar_agip_class'),
                custrecord_lmry_ar_agip_debit_account: setting.getValue('custrecord_lmry_ar_agip_debit_account'),
                custrecord_lmry_ar_agip_default_percent: setting.getValue('custrecord_lmry_ar_agip_default_percent'),
                custrecord_lmry_ar_agip_department: setting.getValue('custrecord_lmry_ar_agip_department'),
                custrecord_lmry_ar_agip_location: setting.getValue('custrecord_lmry_ar_agip_location'),
                custrecord_lmry_ar_agip_maximun_amount: setting.getValue('custrecord_lmry_ar_agip_maximun_amount'),
                custrecord_lmry_ar_agip_month_accum: setting.getValue('custrecord_lmry_ar_agip_month_accum'),
                custrecord_lmry_ar_agip_non_taxable_min: setting.getValue('custrecord_lmry_ar_agip_non_taxable_min'),
                custrecord_lmry_ar_agip_set_ret_base: setting.getValue('custrecord_lmry_ar_agip_set_ret_base'),
                custrecord_lmry_ar_agip_sub_last_ret: setting.getValue('custrecord_lmry_ar_agip_sub_last_ret')
            });
        });
        return parsedResults;
    }
    return {
        AGIPTXT,
        cargarEntity,
        createTax,
        formatDateStringToString,
        ddmmyyToDate,
        getConfigAGIP
    };
});
