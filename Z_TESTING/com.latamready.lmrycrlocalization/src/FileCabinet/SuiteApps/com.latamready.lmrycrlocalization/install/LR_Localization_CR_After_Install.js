/**
 * @NAPIVersion 2.1
 * @NScriptType SDFInstallationScript
 * @Name LR_Localization_CR_After_Install.js
 * @Author giussepe@latamready.com
 */
define([
    "N/log", 
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/error/LR_Error_LIB",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/Document Folders/LMRY_Document_Folders_LBRY",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/SDF Installation/LR_Install_SDF_LBRY",
    "SuiteApps/com.latamready.lmrylocalizationcore/lib/Loading Data/LR_LoadData_Handler_LBRY",
    "../constants/LR_CR_Folder_CONST",
    "../constants/LR_CR_GeneralConstants_LBRY"
],
    function (
        nLog, 
        Lib_Error, 
        Document_LBRY,
        Install_LBRY,
        Load_Data_LBRY,
        Folder_Constants,
        General_Constants 
    ) {
        /**
         * Defines what is executed when the script is specified by the SDF deployment(in the deploy.xml file of an SDF project).
         * @param {Object} scriptContext
         * @param {fromVersion} scriptContext.fromVersion - The version of the SuiteApp currently installed on the account. Specify null
         *     if this is a new installation.
         * @param {toVersion} scriptContext.toVersion - The version of the SuiteApp that will be installed on the account.
         * @since 2015.2
         */
        const run = (scriptContext) => {
            try {
                const {APP_ID} = General_Constants
                const [domain, company, projectName] = APP_ID.split('.');
                const { DATA_FOLDERS } = Folder_Constants;
                const {code} = DATA_FOLDERS[1];
                Document_LBRY.saveFolders(DATA_FOLDERS);
                const logId = Install_LBRY.createSdfInstallLog(scriptContext,APP_ID,code);
                Load_Data_LBRY.executeDataLoadProcess(logId,projectName);

            } catch (err) {
                nLog.error("LR_Localization_CR_After_Install error",err);
                Lib_Error.handleError({ title: "[run]", err });
            }
        }
        return { run }
    });

