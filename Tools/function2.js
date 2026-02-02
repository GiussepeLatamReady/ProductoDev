let search; require(["N/search"], function (sear) { search = sear; });
let runtime; require(["N/runtime"], function (runt) { runtime = runt; });
let format; require(["N/format"], function (form) { format = form; });
let record; require(["N/record"], function (rec) { record = rec; });
let filel; require(["N/file"], function (fil) { filel = fil; });

let query; require(["N/file"], function (quer) { query = quer; });
getEntities("3");

let entities = [
    "134367",
    "196090",
    "198920",
    "198924",
    "213384",
    "254726",
    "255643",
    "260478",
    "263000",
    "269249",
    "270001",
    "272726",
    "276888",
    "284076",
    "288673",
    "288932",
    "296425",
    "306037",
    "308785",
    "312272",
    "324650",
    "328618",
    "334937",
    "346906",
    "352671",
    "364313",
    "134586",
    "371548",
    "374663",
    "487662",
    "699016",
    "727429",
    "735139",
    "754212",
    "854653",
    "934380",
    "1065674",
    "1327590",
    "1361750",
    "1464325",
    "1474456",
    "1499344",
    "1667902",
    "1707040",
    "1746886",
    "1769661",
    "2047532",
    "2113940",
    "2200922",
    "2223887",
    "2272997",
    "2278019",
    "2360235",
    "2361655",
    "2426076",
    "2426378",
    "2484528",
    "2505105",
    "2506419",
    "2575383",
    "2848090",
    "2888205",
    "2929087",
    "2968756",
    "2972390",
    "3016278",
    "3098784",
    "134626",
    "3105606",
    "3114796",
    "3117134",
    "3477278",
    "3865028",
    "3986922",
    "4028252",
    "134643",
    "134659",
    "134660",
    "134376",
    "134483",
    "134664",
    "134671",
    "134674",
    "134745",
    "134377",
    "134789",
    "134821",
    "134827",
    "134850",
    "134854",
    "134855",
    "134932",
    "134951",
    "134952",
    "134968",
    "134379",
    "135009",
    "135115",
    "135160",
    "134380",
    "134524",
    "135244",
    "135305",
    "135315",
    "135344",
    "135430",
    "135443",
    "135451",
    "135474",
    "135489",
    "135512",
    "135516",
    "135577",
    "135581",
    "135587",
    "135589",
    "135596",
    "135600",
    "134388",
    "135623",
    "135629",
    "135631",
    "134545",
    "135660",
    "135676",
    "135692",
    "135710",
    "135869",
    "135871",
    "135923",
    "135936",
    "135990",
    "136016",
    "191858"
]


let getEntities = (idLog) => {
    let period;
    let subsidiary;
    let entityType;
    let entities;
    let searchRecordLog = search.create({
        type: 'customrecord_lmry_ar_massive_gener_agip',
        filters: [
            ['internalid', 'is', idLog]
        ],
        columns: [
            'custrecord_lmry_ar_gen_agip_period',
            'custrecord_lmry_ar_gen_agip_subsidiary',
            'custrecord_lmry_ar_gen_agip_entity_type',
            "custrecord_lmry_ar_gen_agip_entities"
        ]
    })
    searchRecordLog.run().each(function (result) {
        period = result.getValue('custrecord_lmry_ar_gen_agip_period');
        subsidiary = result.getValue('custrecord_lmry_ar_gen_agip_subsidiary');
        entityType = result.getValue('custrecord_lmry_ar_gen_agip_entity_type');
        entities = result.getValue('custrecord_lmry_ar_gen_agip_entities');
    });

    let lisEntities = JSON.parse(entities);


    return lisEntities.map(entity => {

        if (entity[1] == "n") {
            return entity[0];
        }
    }).filter(entity => entity != null);



    // const entities = lbryAGIP.cargarEntity(entityType, subsidiary);
    // return { entityType, list: entities.map(entity => ({ entity, period, subsidiary })) };
}


updateTaxUnit(entities);

function updateTaxUnit(listCuitsByEntity) {
    const entityIDS = listCuitsByEntity.map((result) => {
        return Number(String(result.vatregnumber) + result.custentity_lmry_digito_verificator);
    });
    const iterator = file.lines.iterator();
    let contador = 0;

    iterator.each((/** @type {{value:string}} */ line) => {
        const lineValues = line.value.split(';');
        const index = entityIDS.indexOf(Number(lineValues[3]));
        if (index < 0) return true;

        const isPerception = true;
        const rate = isPerception ? Number(lineValues[7].replace(',', '.')) : Number(lineValues[8].replace(',', '.'));
        if (index >= 0) {

        }

        return true;
    });
}

cargarEntity("customer", 49, null, entities, null, null)
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
    if (nroID.length) {
        filters.push(
            search.createFilter({
                name: 'internalid',
                operator: 'anyof',
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
        columns.push('address.state', 'address.city', 'address.isdefaultbilling', 'address.custrecord_lmry_addr_city', "companyname");
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
                responsibleType: result.getValue('custentity_lmry_ar_tiporespons'),
                name: result.getValue('companyname')
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

    // entitys.forEach(entity => {
    //     createContributoryclass({
    //         entity,period:"1363",subsidiary: "49"
    //     })
    // })

    return entitys;
}



let createContributoryclass = ({ entity, period, subsidiary }) => {

    const fileResults = query
        .runSuiteQL({
            query: `
                    SELECT TOP 1
                        file.id, file.name,
                        REGEXP_SUBSTR(file.name, '([0-9]{11,})',8),  REGEXP_SUBSTR(file.name, '([0-9]{11,})',17) 
                    FROM 
                        file 
                    WHERE
                        file.name LIKE '${subsidiary};${period};%'
                    AND 
                        REGEXP_SUBSTR(file.name, '([0-9]{11,})',LENGTH('${subsidiary};${period};%'))<= ${entity.vatregnumber + entity.custentity_lmry_digito_verificator}
                    AND
                        ${entity.vatregnumber + entity.custentity_lmry_digito_verificator}  <=  REGEXP_SUBSTR(file.name, '([0-9]{11,})',LENGTH('${subsidiary};${period};${entity.vatregnumber + entity.custentity_lmry_digito_verificator}')) 
                    ORDER BY file.id DESC
                        `
        })
        .asMappedResults();
    if (fileResults.length <= 0) {
        return { message: "LMRY_NOT_LIST" };
    }

    fileResults

}

function mape(entities) {
    for (let i = 0; i < entities.length; i++) {
        const element = array[i];

    }
}

let file;

function loadFile(fileID) {
    file = filel.load({
        id: fileID
    });
}

function updateTaxUnit(listCuitsByEntity) {
    const entityIDS = listCuitsByEntity.map((result) => {
        return Number(String(result.vatregnumber) + result.custentity_lmry_digito_verificator);
    });
    const iterator = this.file.lines.iterator();
    let contador = 0;

    iterator.each((/** @type {{value:string}} */ line) => {
        const lineValues = line.value.split(';');
        const index = entityIDS.indexOf(Number(lineValues[3]));
        if (index < 0) return true;

        const isPerception = this.typeEntity === 'customer';
        const rate = isPerception ? Number(lineValues[7].replace(',', '.')) : Number(lineValues[8].replace(',', '.'));
        if (index >= 0) {
            if (rate >= 0) {
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
                            createSetup: 0,
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
                            //custrecord_lmry_ar_regimen: this.configCC.custrecord_lmry_ar_regimen,
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
                        createSetup: 1,
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
                        //custrecord_lmry_ar_regimen: this.configCC.custrecord_lmry_ar_regimen,
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