/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_CO_Header_WHT_calculation_STLT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */
define([],(runtime) => {
    

    const beforeLoad = (scriptContext) => {
        
    };


    class SuiteletFormManager {
        constructor(options) {
            this.params = options.params || {};
            this.method = options.method;
            this.FEAT_SUBS = this.isValid(runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' }));
            this.translations = this.getTranslations(language);
            this.subsidiaries = [];
            this.deploy = runtime.getCurrentScript().deploymentId;
            this.names = this.getNames(this.deploy);
            log.debug('this.names', this.names);
        }


    }

    return { beforeLoad };
});
