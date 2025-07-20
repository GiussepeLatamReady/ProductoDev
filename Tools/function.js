var idrpts = context.request.parameters.custpage_lmry_reporte;
var p = context.request.parameters;

var features = {
    SUBSIDIARIES: RUNTIME.isFeatureInEffect({ feature: "SUBSIDIARIES" }),
    MULTIBOOK: RUNTIME.isFeatureInEffect({ feature: "MULTIBOOK" })
};

var reportInfo = SEARCH.lookupFields({
    type: 'customrecord_lmry_co_features',
    id: idrpts,
    columns: ['custrecord_lmry_co_id_schedule', 'custrecord_lmry_co_id_deploy', 'name']
});

var periodName = '';
if (idrpts == 56) {
    var periodData = SEARCH.lookupFields({
        type: 'accountingperiod',
        id: p.custpage_lmry_cr_anio,
        columns: ['periodname']
    });
    periodName = periodData.periodname.replace(/\D/g, '');
}

if (idrpts == 59) {
    var fechaIni = FORMAT.parse({ value: p.custpage_lmry_cr_fechaini, type: FORMAT.Type.DATE });
    var m = fechaIni.getMonth() + 1;
    if (m < 10) m = '0' + m;
    periodName = TraePeriodo(m) + ' ' + fechaIni.getFullYear();
}

var subsidiaryName = features.SUBSIDIARIES
    ? SEARCH.lookupFields({
        type: 'subsidiary',
        id: p.custpage_subsidiary,
        columns: ['legalname']
    }).legalname
    : CONFIG.load({ type: CONFIG.Type.COMPANY_INFORMATION }).getValue('legalname');

var multiBookName = features.MULTIBOOK
    ? SEARCH.lookupFields({
        type: 'accountingbook',
        id: p.custpage_multibook,
        columns: ['name']
    }).name
    : '';

var empData = SEARCH.lookupFields({
    type: 'employee',
    id: RUNTIME.getCurrentUser().id,
    columns: ['firstname', 'lastname']
});
var employeeName = empData.firstname + ' ' + empData.lastname;

var logRecord = RECORD.create({ type: 'customrecord_lmry_co_rpt_generator_log' });
logRecord.setValue('custrecord_lmry_co_rg_name', GLOBAL_LABELS['pending'][language]);
logRecord.setValue('custrecord_lmry_co_rg_transaction', reportInfo.name);
logRecord.setValue('custrecord_lmry_co_rg_postingperiod', periodName);
logRecord.setValue('custrecord_lmry_co_rpt_type', 'C');
logRecord.setValue('custrecord_lmry_co_rg_subsidiary', subsidiaryName);
logRecord.setValue('custrecord_lmry_co_rg_multibook', multiBookName);
logRecord.setValue('custrecord_lmry_co_rg_employee', employeeName);
logRecord.setValue('custrecord_lmry_co_rg_url_file', '');

var rec_id = logRecord.save();

var params = {};
function addParam(k, v, cond) {
    if ((typeof cond === 'undefined' || cond) && v) params[k] = v;
}

if (idrpts == 56) {
    addParam('custscript_lmry_co_subsi_withbk_ret_acum', p.custpage_subsidiary, features.SUBSIDIARIES);
    addParam('custscript_lmry_co_multibook_wtbk_ret_ac', p.custpage_multibook, features.MULTIBOOK);
    addParam('custscript_lmry_co_par_anio_wtbk_ret_ac', p.custpage_lmry_cr_anio);
    addParam('custscript_lmry_co_vendor_withbk_ret_ac', p.custpage_proovedor_list);
    addParam('custscript_lmry_co_type_withbk_ret_acum', p.custpage_tipo_retencion);
    addParam('custscript_lmry_co_idrpt_wtbk_ret_acumul', rec_id);
    addParam('custscript_lmry_co_group_month', p.custpage_grouping_by_months);
    addParam('custscript_lmry_co_city_origin', p.custpage_lmry_city_origin);
}

if (idrpts == 59) {
    addParam('custscript_lmry_co_subsi_withbook_v2', p.custpage_subsidiary, features.SUBSIDIARIES);
    addParam('custscript_lmry_co_multibook_withbook_v2', p.custpage_multibook, features.MULTIBOOK);
    addParam('custscript_lmry_co_periodini_withbook_v2', p.custpage_lmry_cr_fechaini);
    addParam('custscript_lmry_co_periodfin_withbook_v2', p.custpage_lmry_cr_fechafin);
    addParam('custscript_lmry_co_vendor_withbook_v2', p.custpage_proovedor_list);
    addParam('custscript_lmry_co_type_withbook_v2', p.custpage_tipo_retencion);
    addParam('custscript_lmry_co_idrpt_withbook_v2', rec_id);
    addParam('custscript_lmry_co_city_origin_v2', p.custpage_lmry_city_origin);
}

try {
    var task = TASK.create({
        taskType: (idrpts == 59) ? TASK.TaskType.MAP_REDUCE : TASK.TaskType.SCHEDULED_SCRIPT,
        scriptId: reportInfo.custrecord_lmry_co_id_schedule,
        deploymentId: reportInfo.custrecord_lmry_co_id_deploy,
        params: params
    });
    task.submit();

    REDIRECT.toSuitelet({
        scriptId: 'customscript_lmry_co_rpt_gen_wht_cert',
        deploymentId: 'customdeploy_lmry_co_rpt_gen_wht_cert'
    });
} catch (e) {
    LOG.error({ title: 'Error ejecutando tarea', details: e });
}
