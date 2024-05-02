


function getPeriod(){
    var period = search.lookupFields({
        type: 'accountingperiod',
        id: "419",
        columns: ['startdate', 'enddate']
    });


    return period
}
function getConfigContributoryClass(subsidiaryID, { startdate, enddate }, isPerception) {       
    
    console.log("subsidiaryID : ",subsidiaryID)
    console.log("startdate :",startdate)
    console.log("enddate :",enddate)
    console.log("isPerception :",isPerception)
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

var result = getConfigContributoryClass("13", getPeriod(), true);


console.log(result)