/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @Name LMRY_CO_Certificate_Massive_SCHDL_2.1.js
 * @NModuleScope Public
 */
define([
    'N/log',
    'N/record',
    'N/search',
    'N/format',
    'N/runtime',
    'N/task',
    'N/config',
], (
    log,
    record,
    search,
    format,
    runtime,
    task,
    config
) => {
    const features = {
        SUBSIDIARY: runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" }),
        MULTIBOOK: runtime.isFeatureInEffect({ feature: "MULTIBOOK" })
    }

    const execute = (scriptContext) => {
        try {
            const getParam = name => runtime.getCurrentScript().getParameter({ name });
            const paramRecordMassiveId = getParam('custscript_lmry_co_massive_record_id');
            const recordMassive = getRecordMassive(paramRecordMassiveId);
            const vendors = JSON.parse(recordMassive["custrecord_lmry_co_mass_vendors"]);
            const reportId = recordMassive["custrecord_lmry_co_mass_tran"];
            const pendingVendor = findPendingVendor(vendors);

            if (pendingVendor) {
                const reportInfo = getReportFeature(reportId);
                const { name, custrecord_lmry_co_id_schedule, custrecord_lmry_co_id_deploy } = reportInfo;
                const isRunning = validateExecution(custrecord_lmry_co_id_schedule, custrecord_lmry_co_id_deploy);
                if (!isRunning) {
                    const recordLogId = createRecordLog(recordMassive, name);
                    updateVendorStatus(vendors, pendingVendor, paramRecordMassiveId);
                    executeReport(recordMassive,pendingVendor,recordLogId,reportInfo);
                }
            }




            log.error("paramRecordMassiveId", paramRecordMassiveId)
            log.error("EXECUTE GADP", "start")
        } catch (error) {

        }
    }

    const getRecordMassive = (paramRecordMassiveId) => {
        const recordMassive = {};
        const columns = [
            "custrecord_lmry_co_mass_tran",
            "custrecord_lmry_co_mass_peri_year",
            "custrecord_lmry_co_mass_group_mon",
            "custrecord_lmry_co_mass_peri",
            "custrecord_lmry_co_mass_peri_end",
            "custrecord_lmry_co_mass_sub",
            "custrecord_lmry_co_mass_ibook",
            "custrecord_lmry_co_mass_wht_type",
            "custrecord_lmry_co_mass_city_origin"
        ]
        search.create({
            type: "customrecord_lmry_co_massive_cer_log",
            filters: [
                ["internalid", "anyof", paramRecordMassiveId],
                "AND",
                ["isinactive", "is", "F"]
            ],
            columns
        }).run().each(result => {
            for (let i = 0; i < columns.length; i++) {
                const nameId = columns[i];
                recordMassive[nameId] = result.getValue(nameId);
            }
        });
        recordMassive["id"] = paramRecordMassiveId;
        return recordMassive
    }

    const findPendingVendor = (vendors) => {
        return Object.keys(vendors).find(key => vendors[key] === 'PENDING');
    }

    const getReportFeature = (reportId) => {
        return search.lookupFields({
            type: 'customrecord_lmry_co_features',
            id: reportId,
            columns: ['custrecord_lmry_co_id_schedule', 'custrecord_lmry_co_id_deploy', 'name']
        });
    }

    const validateExecution = (scriptId, deployId) => {
        const results = search.create({
            type: 'scheduledscriptinstance',
            filters: [
                ['status', 'anyof', 'PENDING', 'PROCESSING'],
                'AND',
                ['script.scriptid', 'is', scriptId],
                'AND',
                ['scriptdeployment.scriptid', 'is', deployId]
            ],
            columns: [
                search.createColumn({
                    name: 'timestampcreated',
                    sort: search.Sort.DESC
                }),
                'mapreducestage',
                'status',
                'taskid'
            ]
        }).run().getRange(0, 1);

        return (results && results.length);
    }

    const createRecordLog = (recordMasive, nameReport) => {
        const translations = getTranslations();
        const {
            custrecord_lmry_co_mass_tran: tran,
            custrecord_lmry_co_mass_peri_year: periodYear,
            custrecord_lmry_co_mass_sub: subsidiaryId,
            custrecord_lmry_co_mass_peri: periodDate,
            custrecord_lmry_co_mass_ibook: bookId
        } = recordMasive;



        const logRecord = record.create({ type: 'customrecord_lmry_co_rpt_generator_log' });

        let postingPeriod = '';
        if (tran == 56) {
            const { periodname } = search.lookupFields({
                type: 'accountingperiod',
                id: periodYear,
                columns: ['periodname']
            });
            postingPeriod = periodname.replace(/\D/g, '');
        }

        logRecord.setValue('custrecord_lmry_co_rg_name', translations["PENDING"]);
        logRecord.setValue('custrecord_lmry_co_rg_transaction', nameReport);
        logRecord.setValue('custrecord_lmry_co_rg_postingperiod', postingPeriod);
        logRecord.setValue('custrecord_lmry_co_rpt_type', 'C');

        // Si el ID de reporte es 59, formatear fecha personalizada
        if (idrpts == 59 && periodDate) {
            const parsedDate = format.parse({ value: periodDate, type: format.Type.DATE });
            const formatted = `${String(parsedDate.getDate()).padStart(2, '0')}/${String(parsedDate.getMonth() + 1).padStart(2, '0')}/${parsedDate.getFullYear()}`;

            const [_, month, year] = formatted.split('/');
            const displayPeriod = `${TraePeriodo(month)} ${year}`;

            logRecord.setValue('custrecord_lmry_co_rg_postingperiod', displayPeriod);
        }

        // Subsidiary
        if (features.SUBSIDIARY) {
            const { legalname } = search.lookupFields({
                type: 'subsidiary',
                id: subsidiaryId,
                columns: ['legalname']
            });
            logRecord.setValue('custrecord_lmry_co_rg_subsidiary', legalname);
        } else {
            const companyInfo = config.load({ type: config.Type.COMPANY_INFORMATION });
            const companyName = companyInfo.getValue('legalname');
            logRecord.setValue('custrecord_lmry_co_rg_subsidiary', companyName);
        }

        // Multibook
        if (features.MULTIBOOK && bookId) {
            const { name } = search.lookupFields({
                type: 'accountingbook',
                id: bookId,
                columns: ['name']
            });
            logRecord.setValue('custrecord_lmry_co_rg_multibook', name);
        }

        // Employee info
        const currentUser = runtime.getCurrentUser();
        const { firstname, lastname } = search.lookupFields({
            type: 'employee',
            id: currentUser.id,
            columns: ['firstname', 'lastname']
        });
        logRecord.setValue('custrecord_lmry_co_rg_employee', `${firstname} ${lastname}`);
        logRecord.setValue('custrecord_lmry_co_rg_url_file', '');

        return logRecord.save();
    };


    const getTranslations = () => {
        let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
        language = language === "es" || language === "pt" ? language : "en";
        let translatedFields = {
            "en": {
                "PENDING": "Pending",
            },
            "es": {
                "PENDING": "Pendiente",
            },
            "pt": {
                "PENDING": "Pendente",
            }
        }
        return translatedFields[language];
    }

    const updateVendorStatus = (vendors, pendingVendor, paramRecordMassiveId) => {
        vendors[pendingVendor] = "PROCESS";
        record.submitFields({
            type: "customrecord_lmry_co_massive_cer_log",
            id: paramRecordMassiveId,
            values: {
                custrecord_lmry_co_mass_vendors: JSON.stringify(vendors),
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
                disableTriggers: true
            }
        });
    }

    const executeReport = (recordMasive, pendingVendor, recordLogId, reportInfo) => {
        const {
            custrecord_lmry_co_mass_tran: reportId,
            custrecord_lmry_co_mass_sub: subsidiary,
            custrecord_lmry_co_mass_ibook: multibook,
            custrecord_lmry_co_mass_peri_year: year,
            custrecord_lmry_co_mass_wht_type: whtType,
            custrecord_lmry_co_mass_group_mon: groupMon,
            custrecord_lmry_co_mass_city_origin: city,
            custrecord_lmry_co_mass_peri: startDate,
            custrecord_lmry_co_mass_peri_end: endDate
        } = recordMasive;

        const params = {};
        const addParam = (k, v, cond = true) => cond && v != null && (params[k] = v);

        if (reportId === 56) {
            addParam('custscript_lmry_co_subsi_withbk_ret_acum', subsidiary, features.SUBSIDIARY);
            addParam('custscript_lmry_co_multibook_wtbk_ret_ac', multibook, features.MULTIBOOK);
            addParam('custscript_lmry_co_par_anio_wtbk_ret_ac', year);
            addParam('custscript_lmry_co_vendor_withbk_ret_ac', pendingVendor);
            addParam('custscript_lmry_co_type_withbk_ret_acum', whtType);
            addParam('custscript_lmry_co_idrpt_wtbk_ret_acumul', recordLogId);
            addParam('custscript_lmry_co_group_month', groupMon);
            addParam('custscript_lmry_co_city_origin', city);
        }

        if (reportId === 59) {
            addParam('custscript_lmry_co_subsi_withbook_v2', subsidiary, features.SUBSIDIARY);
            addParam('custscript_lmry_co_multibook_withbook_v2', multibook, features.MULTIBOOK);
            addParam('custscript_lmry_co_periodini_withbook_v2', startDate);
            addParam('custscript_lmry_co_periodfin_withbook_v2', endDate);
            addParam('custscript_lmry_co_vendor_withbook_v2', pendingVendor);
            addParam('custscript_lmry_co_type_withbook_v2', whtType);
            addParam('custscript_lmry_co_idrpt_withbook_v2', recordLogId);
            addParam('custscript_lmry_co_city_origin_v2', city);
        }

        task.create({
            taskType: reportId === 59 ? task.TaskType.MAP_REDUCE : task.TaskType.SCHEDULED_SCRIPT,
            scriptId: reportInfo.custrecord_lmry_co_id_schedule,
            deploymentId: reportInfo.custrecord_lmry_co_id_deploy,
            params
        }).submit();
    };


    return {
        execute
    };
});
