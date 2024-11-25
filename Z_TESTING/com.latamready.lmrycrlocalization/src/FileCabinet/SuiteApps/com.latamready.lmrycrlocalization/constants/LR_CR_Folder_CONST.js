/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LR_CR_Folder_CONST.js
 * @Author giussepe@latamready.com
 * @Date 09/11/2024
 */
define([], () => {
    const DATA_FOLDERS = [
        {
            name: "Latamready Documents",
            code: "LATAMREADY"
        },
        {
            name : "SDF Install Logs Costa Rica",
            code : "LR_SDF_INSTALL_LOGS_CR",
            parentCode : "LATAMREADY"
        }
    ];

    return {
        DATA_FOLDERS
    };
});
