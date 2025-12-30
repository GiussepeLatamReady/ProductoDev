let search; require(["N/search"], function (sear) { search = sear; });
let runtime; require(["N/runtime"], function (runt) { runtime = runt; });
let record; require(["N/record"], function (rec) { record = rec; });
let library; require(["/SuiteBundles/Bundle 37714/Latam_Library/LMRY_libSendingEmailsLBRY_V2.0"], function (lib) { library = lib; });
let encrypt; require(["/SuiteBundles/Bundle 37714/Latam_Library/LMRY_MD5_encript_LBRY_V2.0"], function (encr) { encrypt = encr; });
let Lib_Licenses; require(['SuiteApps/com.latamready.lmrylocalizationcore/lib/licenses/LR_Licenses_LIB'], function(lib) { Lib_Licenses = lib;});
let Features_CONST; require(['SuiteApps/com.latamready.lmrylocalizationcore/lib/features/LR_Features_CONST'], function(lib) { Features_CONST = lib;});


function getSubsidiaries() {
    const subsidiaries = [];
    if (true) {
        const results = search.create({
            type: 'subsidiary',
            filters: [
                ['isinactive', 'is', 'F'], 'AND',
                ['country', 'is', 'CO']
            ],
            columns: ['internalid', 'name']
        }).run().getRange(0, 1000);
        if (results && results.length) {
            results.forEach((rs) => {
                const id = rs.getValue('internalid');
                const name = rs.getValue('name');
                const active = false;
                subsidiaries.push({ id, name, active });
            });
        }
    }
    return subsidiaries;
}

const subsidiaries = getSubsidiaries();
const featureHandlers = new Lib_Licenses.MultiSubsidiaryFeatureManager();
const CO_FEAT = {
            "LOCALIZATION": 26,
            "ONLY_MAIN_LEVEL": 27,
            "WHT_NEW_LINES_SALES": 721,
            "WHT_NEW_LINES_PURCHASE": 720,
            "WHT_SET_ACCOUNTING_PERIOD": 1022,
            "WHT_VERIFY_CM": 666,
            "ADV_HIDE_VIEW": 1107,
            "AP_LOCKED": 767,
            "AR_LOCKED": 783,
            "WHT_NEW_TOTAL_PURCHASE": 1130,
            "WHT_NEW_TOTAL_SALES": 1131
        }
function checkSubsidiaries() {
    if (true) {
        let active = false;
        for (let i = 0; i < subsidiaries.length; i++) {
            console.log("subsidiaries[i]",subsidiaries[i].id)
            const handler = featureHandlers.getHandler(subsidiaries[i].id);
            console.log("handler[i]",handler)
            if (handler && (handler.isActive(CO_FEAT.WHT_NEW_LINES_SALES) || handler.isActive(CO_FEAT.WHT_NEW_LINES_PURCHASE) || handler.isActive(CO_FEAT.ONLY_MAIN_LEVEL) || handler.isActive(CO_FEAT.WHT_NEW_TOTAL_PURCHASE) || handler.isActive(CO_FEAT.WHT_NEW_TOTAL_SALES))) {
                subsidiaries[i].active = true;
                active = true;
            }
        }
        if (active) return true;
    } 
    return false;
}

const features = new Features_CONST.features();

checkSubsidiaries();
