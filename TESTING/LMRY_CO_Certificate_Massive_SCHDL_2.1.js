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
    'N/file',
], (
    log,
    record,
    search,
    format,
    runtime,
    task,
    config,
    file
) => {


    const execute = (scriptContext) => {
        try {
            const getParam = name => runtime.getCurrentScript().getParameter({ name });
            const paramRecordMassiveId = getParam('custscript_lmry_co_massive_record_id');
            const recordMassive = getRecordMassive(paramRecordMassiveId);
            const vendors = JSON.parse(recordMassive["custrecord_lmry_co_mass_vendors"]);
            const summary = JSON.parse(recordMassive["custrecord_lmry_co_mass_summary"]);
            const reportId = recordMassive["custrecord_lmry_co_mass_tran"];
            const pendingVendor = findPendingVendor(vendors);
            if (pendingVendor) {
                const reportInfo = getReportFeature(reportId);
                const { name, custrecord_lmry_co_id_schedule, custrecord_lmry_co_id_deploy } = reportInfo;
                const isRunning = validateExecution(custrecord_lmry_co_id_schedule, custrecord_lmry_co_id_deploy);
                if (!isRunning) {
                    const recordLogId = createRecordLog(recordMassive, name);
                    updateVendorStatus(vendors, pendingVendor, paramRecordMassiveId, summary);
                    executeReport(recordMassive, pendingVendor, recordLogId, reportInfo);
                }
            }
            log.error("pendingVendor",pendingVendor)
            log.error("vendors",vendors)
            log.error("summary",summary)
            if (summary.n == 0 && summary.p == 0) { // No hay entidades por procesar
                setFileReport(vendors, recordMassive)
            }
        } catch (error) {
            log.error("error [execute]", error)
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
            "custrecord_lmry_co_mass_city_origin",
            "custrecord_lmry_co_mass_summary",
            "custrecord_lmry_co_mass_vendors"
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
                const nameId = columns[i].name;
                recordMassive[nameId] = result.getValue(nameId);
            }
        });
        recordMassive["id"] = paramRecordMassiveId;
        return recordMassive
    }

    const findPendingVendor = (vendors) => {
        return Object.keys(vendors).find(key => vendors[key].status === 'PENDING');
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
        const features = {
            SUBSIDIARY: runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" }),
            MULTIBOOK: runtime.isFeatureInEffect({ feature: "MULTIBOOK" })
        }
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
        logRecord.setValue('custrecord_lmry_co_rpt_massive', recordMasive.id);
        logRecord.setValue('custrecord_lmry_co_rpt_massive_id', recordMasive.id);
        // Si el ID de reporte es 59, formatear fecha personalizada
        if (tran == 59 && periodDate) {
            const parsedDate = format.parse({ value: periodDate, type: format.Type.DATE });
            const formatted = `${String(parsedDate.getDate()).padStart(2, '0')}/${String(parsedDate.getMonth() + 1).padStart(2, '0')}/${parsedDate.getFullYear()}`;

            const [_, month, year] = formatted.split('/');
            const displayPeriod = `${getMonthAbbreviation(month)} ${year}`;

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

    const updateVendorStatus = (vendors, pendingVendor, paramRecordMassiveId, summary) => {
        vendors[pendingVendor].status = "PROCESS"; //Update_vendor

        summary.n--;
        summary.p++;

        record.submitFields({
            type: "customrecord_lmry_co_massive_cer_log",
            id: paramRecordMassiveId,
            values: {
                custrecord_lmry_co_mass_vendors: JSON.stringify(vendors),
                custrecord_lmry_co_mass_summary: JSON.stringify(summary), //error
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
                disableTriggers: true
            }
        });
    }

    const executeReport = (recordMasive, pendingVendor, recordLogId, reportInfo) => {
        const features = {
            SUBSIDIARY: runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" }),
            MULTIBOOK: runtime.isFeatureInEffect({ feature: "MULTIBOOK" })
        }
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
        const whtTypeFormat = whtType.split("\n").join('\u0005');
        if (reportId == 56) {
            addParam('custscript_lmry_co_subsi_withbk_ret_acum', subsidiary, features.SUBSIDIARY);
            addParam('custscript_lmry_co_multibook_wtbk_ret_ac', multibook, features.MULTIBOOK);
            addParam('custscript_lmry_co_par_anio_wtbk_ret_ac', year);
            addParam('custscript_lmry_co_vendor_withbk_ret_ac', pendingVendor);
            addParam('custscript_lmry_co_type_withbk_ret_acum', whtTypeFormat);
            addParam('custscript_lmry_co_idrpt_wtbk_ret_acumul', recordLogId);
            addParam('custscript_lmry_co_group_month', groupMon);
            addParam('custscript_lmry_co_city_origin', city);
        }

        if (reportId == 59) {
            addParam('custscript_lmry_co_subsi_withbook_v2', subsidiary, features.SUBSIDIARY);
            addParam('custscript_lmry_co_multibook_withbook_v2', multibook, features.MULTIBOOK);
            addParam('custscript_lmry_co_periodini_withbook_v2', startDate);
            addParam('custscript_lmry_co_periodfin_withbook_v2', endDate);
            addParam('custscript_lmry_co_vendor_withbook_v2', pendingVendor);
            addParam('custscript_lmry_co_type_withbook_v2', whtTypeFormat);
            addParam('custscript_lmry_co_idrpt_withbook_v2', recordLogId);
            addParam('custscript_lmry_co_city_origin_v2', city);
        }

        task.create({
            taskType: reportId == 59 ? task.TaskType.MAP_REDUCE : task.TaskType.SCHEDULED_SCRIPT,
            scriptId: reportInfo.custrecord_lmry_co_id_schedule,
            deploymentId: reportInfo.custrecord_lmry_co_id_deploy,
            params
        }).submit();
    };

    const setFileReport = (vendors, massiveRecord) => {
        log.error("setFileReport","start")
        const { folderId, nameFile } = createFolder(massiveRecord);
        const objContext = runtime.getCurrentScript();
        const baseUrl = objContext.getParameter({
            name: 'custscript_lmry_netsuite_location'
        });
        let existReport = false;
        const fileUrl = baseUrl
            ? `https://${baseUrl}/core/media/downloadfolder.nl?id=${folderId}`
            : `/core/media/downloadfolder.nl?id=${folderId}`;
        for (const vendorId in vendors) {
            const vendor = vendors[vendorId];
            if (!vendor.fileId) continue;
            if (vendor.fileType === 'file') {
                const fileObj = file.load({ id: vendor.fileId });
                fileObj.folder = folderId;
                fileObj.save();
                existReport = true;
            }
            if (vendor.fileType === 'folder') {
                const folderRec = record.load({
                    type: record.Type.FOLDER,
                    id: vendor.fileId
                });
                folderRec.setValue({
                    fieldId: 'parent',
                    value: folderId
                });
                folderRec.save();
                existReport = true;
            }
        }
        if (existReport) {
            const logRecord = record.load({
                type: 'customrecord_lmry_co_massive_cer_log',
                id: massiveRecord.id
            });

            logRecord.setValue({
                fieldId: 'custrecord_lmry_co_mass_name',
                value: nameFile
            });

            logRecord.setValue({
                fieldId: 'custrecord_lmry_co_mass_file',
                value: fileUrl
            });

            logRecord.save();
        }

    };

    const createFolder = (massiveRecord) => {
        const { getParameter } = runtime.getCurrentScript();
        const nameFile = getNameFile(massiveRecord);
        const rootFolderId = getParameter({ name: 'custscript_lmry_file_cabinet_rg_co' });
        const folderId = prepareCleanFolder(nameFile, rootFolderId);

        return { nameFile, folderId };
    };


    const getNameFile = (recordMassive) => {
        const {
            custrecord_lmry_co_mass_tran: reportId,
            custrecord_lmry_co_mass_sub: subsidiary,
            custrecord_lmry_co_mass_ibook: multibook,
            custrecord_lmry_co_mass_peri_year: yearId,
            custrecord_lmry_co_mass_peri: startDate,
            custrecord_lmry_co_mass_peri_end: endDate
        } = recordMassive;

        const features = {
            SUBSIDIARY: runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' }),
            MULTIBOOK: runtime.isFeatureInEffect({ feature: 'MULTIBOOK' })
        };

        let name = '';
        const { companyRuc, companyDv } = getSubsidiaryData(features, subsidiary);

        if (reportId == 56) {
            const year = calculateYear(yearId);
            name = `CRA_Massive_${companyRuc}${companyDv}_${year}_${subsidiary}`;
        }

        if (reportId == 59) {
            const startDateFormat = formatDate(startDate, '_');
            const endDateFormat = formatDate(endDate, '_');
            name = `CR_Massive_${companyRuc}${companyDv}_${startDateFormat}_${endDateFormat}`;
        }

        if (features.MULTIBOOK) {
            name += `_${multibook}`;
        }
        //name += `.zip`
        return name;
    };


    const calculateYear = (yearId) => {
        const periodData = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: yearId,
            columns: ['startdate', 'enddate']
        });

        const endDate = format.parse({
            value: periodData.enddate,
            type: format.Type.DATE
        });

        return endDate.getFullYear();
    };

    const getSubsidiaryData = (features, subsidiaryId) => {
        const companyConfig = config.load({
            type: config.Type.COMPANY_INFORMATION
        });

        let companyRuc, companyDv;

        if (features.SUBSIDIARY) {
            const subsidiaryData = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: subsidiaryId,
                columns: [
                    'taxidnum',
                    'custrecord_lmry_dig_verificador'
                ]
            });

            companyRuc = cleanNit(String(subsidiaryData.taxidnum));
            companyDv = subsidiaryData.custrecord_lmry_dig_verificador;

        } else {
            companyRuc = cleanNit(String(companyConfig.getValue('employerid')));
            companyDv = companyConfig.getValue('custrecord_lmry_dig_verificador');
        }

        return { companyRuc, companyDv };
    };


    const cleanNit = (str) => {
        return str
            .replace(/,/g, '')
            .replace(/-/g, '')
            .replace(/\s/g, '')
            .replace(/\./g, '')
            .replace(/[^0-9]/g, '');
    };

    const formatDate = (date, separator) => {
        const parsedDate = format.parse({
            value: date,
            type: format.Type.DATE
        });

        let day = parsedDate.getDate();
        let month = parsedDate.getMonth() + 1;
        const year = parsedDate.getFullYear();

        day = day < 10 ? `0${day}` : `${day}`;
        month = month < 10 ? `0${month}` : `${month}`;

        return `${day}${separator}${month}${separator}${year}`;
    };

    const prepareCleanFolder = (folderName, parentFolderId) => {
        let folderId;

        const folderSearch = search.create({
            type: 'folder', 
            filters: [
                ['name', 'is', folderName],
                'AND',
                ['parent', 'anyof', parentFolderId]
            ],
            columns: ['internalid']
        });

        const results = folderSearch.run().getRange({ start: 0, end: 1 });

        if (results && results.length > 0) {
            folderId = results[0].getValue('internalid');
            cleanFolderContents(folderId); // empty it
        } else {
            // Create folder if it does not exist
            const folderRec = record.create({
                type: record.Type.FOLDER,
                isDynamic: true
            });
            folderRec.setValue({ fieldId: 'name', value: folderName });
            folderRec.setValue({ fieldId: 'parent', value: parentFolderId });
            folderId = folderRec.save();
        }

        return folderId;
    };

    const cleanFolderContents = (folderId) => {
        if (!folderId) {
            log.error('cleanFolderContents', 'folderId is missing or invalid');
            return;
        }

        const fileSearch = search.create({
            type: 'file', 
            filters: [['folder', 'anyof', folderId]],
            columns: ['internalid']
        });

        fileSearch.run().each((res) => {
            const fileId = res.getValue({ name: 'internalid' });
            try {
                file.delete({ id: fileId });
                log.debug('Deleted file', String(fileId));
            } catch (e) {
                log.error('File delete error', `${fileId} - ${e.message}`);
            }
            return true;
        });

        const subFolderSearch = search.create({
            type: 'folder', // <- use string literal
            filters: [['parent', 'anyof', folderId]],
            columns: ['internalid']
        });

        subFolderSearch.run().each((res) => {
            const subFolderId = res.getValue({ name: 'internalid' });

            cleanFolderContents(subFolderId);
            try {
                record.delete({ type: record.Type.FOLDER, id: subFolderId });
                log.debug('Deleted folder', String(subFolderId));
            } catch (e) {
                log.error('Folder delete error', `${subFolderId} - ${e.message}`);
            }
            return true;
        });
    };

    const getMonthAbbreviation = (period) => {
        const paddedPeriod = period.padStart(2, '0');

        const monthMap = {
            '01': 'Jan',
            '02': 'Feb',
            '03': 'Mar',
            '04': 'Apr',
            '05': 'May',
            '06': 'Jun',
            '07': 'Jul',
            '08': 'Aug',
            '09': 'Sep',
            '10': 'Oct',
            '11': 'Nov',
            '12': 'Dec'
        };

        return monthMap[paddedPeriod] || '';
    };


    return {
        execute
    };
});
