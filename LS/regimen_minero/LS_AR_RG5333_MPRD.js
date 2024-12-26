/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 *@description ejecucion diaria retencion iva y ganancias
 */
define(["./handler/LS_AR_RG5333_HANDLER", 'N/record'], function (RG5333, record) {
    function getInputData() {
        const RG5333Handler = new RG5333();
        return RG5333Handler.getInputData();
    }

    function map(context) {

      let wsData = context.value;
      wsData = JSON.parse(wsData);

      log.debug('wsData map', wsData);

      const RG5333Handler = new RG5333(context);
      RG5333Handler.map();
    }

    function reduce(context) {

      let wsData = context.values[0];
      wsData = JSON.parse(wsData);

      const RG5333Handler = new RG5333(context);
      RG5333Handler.reduce();
      
    }

    /*function summarize(summary) {
        const RG5333Handler = new RG5333(summary);
        return RG5333Handler.summarize();
    }*/

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce
        // summarize: summarize
    };
});
