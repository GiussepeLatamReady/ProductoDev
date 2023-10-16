/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @NAmdConfig ./config.json
 */

define(['N/url'],

  function(url) {

    function pageInit(scriptContext) {

    }

    function openList() {

      var scriptContext = {
        scriptId: 'customscript_lmry_pe_det_sales_list_stlt',
        deploymentId: 'customdeploy_lmry_pe_det_sales_list_stlt'
      };

      var path = url.resolveScript(scriptContext);

      window.location.href = path;


    }

    return {
      pageInit: pageInit,
      openList : openList

    };

  });
