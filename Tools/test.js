const { parameters: p } = context.request;
const idrpts = p.custpage_lmry_reporte;

const features = {
    SUBSIDIARIES: RUNTIME.isFeatureInEffect({ feature: "SUBSIDIARIES" }),
    MULTIBOOK: RUNTIME.isFeatureInEffect({ feature: "MULTIBOOK" })
};

const reportInfo = SEARCH.lookupFields({
    type: 'customrecord_lmry_co_features',
    id: idrpts,
    columns: ['custrecord_lmry_co_id_schedule', 'custrecord_lmry_co_id_deploy', 'name']
});

let periodName = '';
if (idrpts == 56) {
    periodName = SEARCH.lookupFields({
        type: 'accountingperiod',
        id: p.custpage_lmry_cr_anio,
        columns: ['periodname']
    }).periodname.replace(/\D/g, '');
}
if (idrpts == 59) {
    const f = FORMAT.parse({ value: p.custpage_lmry_cr_fechaini, type: FORMAT.Type.DATE });
    const mm = `${f.getMonth() + 1}`.padStart(2, '0');
    periodName = `${TraePeriodo(mm)} ${f.getFullYear()}`;
}

const subsidiaryName = features.SUBSIDIARIES
    ? SEARCH.lookupFields({ type: 'subsidiary', id: p.custpage_subsidiary, columns: ['legalname'] }).legalname
    : CONFIG.load({ type: CONFIG.Type.COMPANY_INFORMATION }).getValue('legalname');

const multiBookName = features.MULTIBOOK
    ? SEARCH.lookupFields({ type: 'accountingbook', id: p.custpage_multibook, columns: ['name'] }).name
    : '';

const { firstname, lastname } = SEARCH.lookupFields({
    type: 'employee',
    id: RUNTIME.getCurrentUser().id,
    columns: ['firstname', 'lastname']
});

const logRecord = RECORD.create({ type: 'customrecord_lmry_co_rpt_generator_log' });
logRecord.setValue('custrecord_lmry_co_rg_name', GLOBAL_LABELS['pending'][language]);
logRecord.setValue('custrecord_lmry_co_rg_transaction', reportInfo.name);
logRecord.setValue('custrecord_lmry_co_rg_postingperiod', periodName);
logRecord.setValue('custrecord_lmry_co_rpt_type', 'C');
logRecord.setValue('custrecord_lmry_co_rg_subsidiary', subsidiaryName);
logRecord.setValue('custrecord_lmry_co_rg_multibook', multiBookName);
logRecord.setValue('custrecord_lmry_co_rg_employee', `${firstname} ${lastname}`);
logRecord.setValue('custrecord_lmry_co_rg_url_file', '');

const rec_id = logRecord.save();
const params = {};

const add = (k, v, c = true) => { if (v && c) params[k] = v };

if (idrpts == 56) {
    add('custscript_lmry_co_subsi_withbk_ret_acum', p.custpage_subsidiary, features.SUBSIDIARIES);
    add('custscript_lmry_co_multibook_wtbk_ret_ac', p.custpage_multibook, features.MULTIBOOK);
    add('custscript_lmry_co_par_anio_wtbk_ret_ac', p.custpage_lmry_cr_anio);
    add('custscript_lmry_co_vendor_withbk_ret_ac', p.custpage_proovedor_list);
    add('custscript_lmry_co_type_withbk_ret_acum', p.custpage_tipo_retencion);
    add('custscript_lmry_co_idrpt_wtbk_ret_acumul', rec_id);
    add('custscript_lmry_co_group_month', p.custpage_grouping_by_months);
    add('custscript_lmry_co_city_origin', p.custpage_lmry_city_origin);
}

if (idrpts == 59) {
    add('custscript_lmry_co_subsi_withbook_v2', p.custpage_subsidiary, features.SUBSIDIARIES);
    add('custscript_lmry_co_multibook_withbook_v2', p.custpage_multibook, features.MULTIBOOK);
    add('custscript_lmry_co_periodini_withbook_v2', p.custpage_lmry_cr_fechaini);
    add('custscript_lmry_co_periodfin_withbook_v2', p.custpage_lmry_cr_fechafin);
    add('custscript_lmry_co_vendor_withbook_v2', p.custpage_proovedor_list);
    add('custscript_lmry_co_type_withbook_v2', p.custpage_tipo_retencion);
    add('custscript_lmry_co_idrpt_withbook_v2', rec_id);
    add('custscript_lmry_co_city_origin_v2', p.custpage_lmry_city_origin);
}

try {
    TASK.create({
        taskType: idrpts == 59 ? TASK.TaskType.MAP_REDUCE : TASK.TaskType.SCHEDULED_SCRIPT,
        scriptId: reportInfo.custrecord_lmry_co_id_schedule,
        deploymentId: reportInfo.custrecord_lmry_co_id_deploy,
        params
    }).submit();

    REDIRECT.toSuitelet({
        scriptId: 'customscript_lmry_co_rpt_gen_wht_cert',
        deploymentId: 'customdeploy_lmry_co_rpt_gen_wht_cert'
    });
} catch (e) {
    LOG.error({ title: 'Error ejecutando tarea', details: e });
}
