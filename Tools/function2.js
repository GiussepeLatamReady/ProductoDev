var featuresubs = RUNTIME.isFeatureInEffect({
    feature: "SUBSIDIARIES"
});
var featuremult = RUNTIME.isFeatureInEffect({
    feature: "MULTIBOOK"
});

var periodName = '';

var idrpts = context.request.parameters.custpage_lmry_reporte;
var varReport = SEARCH.lookupFields({
    type: 'customrecord_lmry_co_features',
    id: idrpts,
    columns: ['custrecord_lmry_co_id_schedule', 'custrecord_lmry_co_id_deploy', 'name']
});

var TituloInforme = varReport.name;
var varIdSchedule = varReport.custrecord_lmry_co_id_schedule;
var varIdDeploy = varReport.custrecord_lmry_co_id_deploy;

//Period enddate
LOG.debug('custpage_lmry_cr_anio', context.request.parameters.custpage_lmry_cr_anio);

if (idrpts == 56) {
    var varPeriodo = SEARCH.lookupFields({
        type: 'accountingperiod',
        id: context.request.parameters.custpage_lmry_cr_anio,
        columns: ['periodname']
    });
    //Period Name
    periodName = varPeriodo.periodname;
    periodName = periodName.replace(/\D/g, '');
}


log.debug('PERIOD NAME', periodName);

// Creacion de la linea en el log de errores
var varLogRecord = RECORD.create({
    type: 'customrecord_lmry_co_rpt_generator_log'
});

varLogRecord.setValue('custrecord_lmry_co_rg_name', GLOBAL_LABELS['pending'][language]);
varLogRecord.setValue('custrecord_lmry_co_rg_transaction', TituloInforme);
varLogRecord.setValue('custrecord_lmry_co_rg_postingperiod', periodName);
varLogRecord.setValue('custrecord_lmry_co_rpt_type', 'C');

if (idrpts == 59) {
    var fecha_format = context.request.parameters.custpage_lmry_cr_fechaini;
    var aux_fecha_per = FORMAT.parse({
        value: fecha_format,
        type: FORMAT.Type.DATE
    });
    var MM = aux_fecha_per.getMonth() + 1;
    var YYYY = aux_fecha_per.getFullYear();
    var DD = aux_fecha_per.getDate();

    if (('' + MM).length == 1) {
        MM = '0' + MM;
    }
    fecha_format = DD + '/' + MM + '/' + YYYY;
    var auxiliar = fecha_format.split('/');
    fecha_format = TraePeriodo(auxiliar[1]) + ' ' + auxiliar[2];

    varLogRecord.setValue('custrecord_lmry_co_rg_postingperiod', fecha_format);

}

if (featuresubs == true || featuresubs == 'T') {
    // Trae el nombre de la subsidiaria
    var varSubsidiary = SEARCH.lookupFields({
        type: 'subsidiary',
        id: context.request.parameters.custpage_subsidiary,
        columns: ['legalname']
    });

    varLogRecord.setValue('custrecord_lmry_co_rg_subsidiary', varSubsidiary.legalname);

} else {
    var varCompanyReference = CONFIG.load({
        type: CONFIG.Type.COMPANY_INFORMATION
    });
    companyname = varCompanyReference.getValue('legalname');
    varLogRecord.setValue('custrecord_lmry_co_rg_subsidiary', companyname);

}

if (featuremult == true || featuremult == 'T') {
    // Descripcion del MultiBook
    var varIdBook = context.request.parameters.custpage_multibook;
    var varMultiBook = SEARCH.lookupFields({
        type: 'accountingbook',
        id: varIdBook,
        columns: ['name']
    });
    varLogRecord.setValue('custrecord_lmry_co_rg_multibook', varMultiBook.name);
}

var objUser = RUNTIME.getCurrentUser();

varLogRecord.setValue('custrecord_lmry_co_rg_url_file', '');
var varEmployee = SEARCH.lookupFields({
    type: 'employee',
    id: objUser.id,
    columns: ['firstname', 'lastname']
});
var varEmployeeName = varEmployee.firstname + ' ' + varEmployee.lastname;
varLogRecord.setValue('custrecord_lmry_co_rg_employee', varEmployeeName);

var rec_id = varLogRecord.save();
//Entidad del Reporte Balance Comprobacion por Terceros

/*********************************************
 * Pasa los parametros para los reportes
 ********************************************/
var params = {};

LOG.debug('idrpts', idrpts);
LOG.error('idrpts', idrpts);

if (idrpts == 56) {
    /* *************************************************************************************************************************
     * 2018/10/29 Reporte Certificado de Retencion Acumuladas script 2.0
     * ************************************************************************************************************************/
    if (featuresubs == true || featuresubs == 'T') {
        params['custscript_lmry_co_subsi_withbk_ret_acum'] = context.request.parameters.custpage_subsidiary;
    }
    params['custscript_lmry_co_par_anio_wtbk_ret_ac'] = context.request.parameters.custpage_lmry_cr_anio;
    params['custscript_lmry_co_vendor_withbk_ret_ac'] = context.request.parameters.custpage_proovedor_list;
    params['custscript_lmry_co_type_withbk_ret_acum'] = context.request.parameters.custpage_tipo_retencion;
    params['custscript_lmry_co_idrpt_wtbk_ret_acumul'] = rec_id;
    if (featuremult == true || featuremult == 'T') {
        params['custscript_lmry_co_multibook_wtbk_ret_ac'] = context.request.parameters.custpage_multibook;
    }
    params['custscript_lmry_co_group_month'] = context.request.parameters.custpage_grouping_by_months;
    params['custscript_lmry_co_city_origin'] = context.request.parameters.custpage_lmry_city_origin;
}


if (idrpts == 59) {

    if (featuresubs == true || featuresubs == 'T') {
        params['custscript_lmry_co_subsi_withbook_v2'] = context.request.parameters.custpage_subsidiary;
    }
    params['custscript_lmry_co_periodini_withbook_v2'] = context.request.parameters.custpage_lmry_cr_fechaini;
    params['custscript_lmry_co_periodfin_withbook_v2'] = context.request.parameters.custpage_lmry_cr_fechafin;
    params['custscript_lmry_co_vendor_withbook_v2'] = context.request.parameters.custpage_proovedor_list;
    params['custscript_lmry_co_type_withbook_v2'] = context.request.parameters.custpage_tipo_retencion;
    params['custscript_lmry_co_idrpt_withbook_v2'] = rec_id;
    params['custscript_lmry_co_city_origin_v2'] = context.request.parameters.custpage_lmry_city_origin;
    if (featuremult == true || featuremult == 'T') {
        params['custscript_lmry_co_multibook_withbook_v2'] = context.request.parameters.custpage_multibook;
    }
}

//************************************************************************************************************************
//*************************************************************************************************************************
LOG.debug(varIdSchedule);
LOG.debug(varIdDeploy);
LOG.debug("parameters", {
    taskType: tasktype,
    scriptId: varIdSchedule,
    deploymentId: varIdDeploy,
    params: params
});

try {
    var tasktype;

    if (idrpts == 59) {
        tasktype = TASK.TaskType.MAP_REDUCE;
    } else {
        tasktype = TASK.TaskType.SCHEDULED_SCRIPT;
    }

    var RedirecSchdl = TASK.create({
        taskType: tasktype,
        scriptId: varIdSchedule,
        deploymentId: varIdDeploy,
        params: params
    });

    RedirecSchdl.submit();

    REDIRECT.toSuitelet({

        scriptId: 'customscript_lmry_co_rpt_gen_wht_cert',
        deploymentId: 'customdeploy_lmry_co_rpt_gen_wht_cert'
    });
} catch (err) {
    var varMsgError = 'No se puede procesar dado que hay un proceso pendiente en la cola';
    LOG.error({
        title: 'Se genero un error en suitelet 1 :',
        details: err
    });

    //  LIBRARY.CreacionFormError(namereport, LMRY_script, varMsgError, err);

}