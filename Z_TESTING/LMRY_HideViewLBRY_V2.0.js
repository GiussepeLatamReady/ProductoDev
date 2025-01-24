/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_HideViewLBRY_V2.0.js					              ||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 30 2018  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

define(['N/ui/serverWidget', 'N/search', 'N/log', './LMRY_libSendingEmailsLBRY_V2.0'],

  function(serverWidget, search, log, Library_Mail) {

    var err;
    var feature = false;
    var LMRY_script = 'LatamReady -  HideView LBRY V2.0';


    function HideColumn(OBJ_FORM, Country_Hide, Type, licenses) {

      Country_Hide = Library_Mail.DeleteChar(Country_Hide);
      if (Country_Hide == 'Brasil') {
        Country_Hide = 'Brazil';
      }
      if (Country_Hide == 'Dominican Republic') {
        Country_Hide = 'República Dominicana';
      }
      if (Country_Hide == 'Estados Unidos') {
        Country_Hide = 'United States';
      }
      if (Country_Hide.indexOf('Bolivia') > -1) {
        Country_Hide = 'Bolivia';
      }

      // log.error('columna OBJ_FORM', OBJ_FORM);

      switch (Country_Hide) {
        case 'Argentina':
          feature = Library_Mail.getAuthorization(100, licenses);
          break;
        case 'Bolivia':
          feature = Library_Mail.getAuthorization(37, licenses);
          break;
        case 'Brazil':
          feature = Library_Mail.getAuthorization(140, licenses);
          break;
        case 'Chile':
          feature = Library_Mail.getAuthorization(98, licenses);
          break;
        case 'Colombia':
          feature = Library_Mail.getAuthorization(26, licenses);
          break;
        case 'Costa Rica':
          feature = Library_Mail.getAuthorization(24, licenses);
          break;
        case 'Ecuador':
          feature = Library_Mail.getAuthorization(42, licenses);
          break;
        case 'El Salvador':
          feature = Library_Mail.getAuthorization(6, licenses);
          break;
        case 'Guatemala':
          feature = Library_Mail.getAuthorization(133, licenses);
          break;
        case 'Mexico':
          feature = Library_Mail.getAuthorization(20, licenses);
          break;
        case 'Panama':
          feature = Library_Mail.getAuthorization(137, licenses);
          break;
        case 'Paraguay':
          feature = Library_Mail.getAuthorization(38, licenses);
          break;
        case 'Peru':
          feature = Library_Mail.getAuthorization(136, licenses);
          break;
        case 'Uruguay':
          feature = Library_Mail.getAuthorization(39, licenses);
          break;
        case 'Nicaragua':
          feature = Library_Mail.getAuthorization(406, licenses);
          break;
        case 'República Dominicana':
          feature = Library_Mail.getAuthorization(399, licenses);
          break;
        case 'United States':
          feature = Library_Mail.getAuthorization(1007, licenses);
          break;
        default:
          Country_Hide = '';
      }

      if (feature == false) {
        Country_Hide = '';
      }
      // log.error('columna Type', Type);

      var err;
      //var OBJ_FORM = scriptContext.form;
      var list_log_list = new Array();

      var filters = new Array();

      filters[0] = search.createFilter({
        name: 'custrecord_lmry_hide_section',
        operator: search.Operator.ANYOF,
        values: [3]
      });

      filters[1] = search.createFilter({
        name: 'isinactive',
        operator: search.Operator.IS,
        values: ['F']
      });

      var columns = new Array();

      columns[0] = search.createColumn({
        name: 'name'
      });

      var hidefields = search.create({
        type: 'customrecord_lmry_hide_fields',
        columns: columns,
        filters: filters
      });

      hidefields = hidefields.run().getRange(0, 1000);
      //log.error('hidefields', hidefields);
      //log.error('ocultar sales',hidefields);

      var filters2 = new Array();

      filters2[0] = search.createFilter({
        name: 'custrecord_lmry_section',
        operator: search.Operator.ANYOF,
        values: [3]
      });

      filters2[1] = search.createFilter({
        name: 'isinactive',
        operator: search.Operator.IS,
        values: ['F']
      });

      switch (Type) {

        // case 'invoice':
        //   filters[3] = search.createFilter({
        //     name: 'custrecord_lmry_on_opportunity',
        //     operator: search.Operator.IS,
        //     values: ['true']
        //   });
        //   break;
        case 'salesorder':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_sales_order',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'estimate':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_estimate',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'invoice':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_invoice',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'itemfulfillment':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_item_fulfillment',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'creditmemo':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_credit_memo',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'customerdeposit':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_customer_deposit',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'customerpayment':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_customer_payment',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'customerrefund':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_customer_refund',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case '':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_purchase_order',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'vendorbill':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_bill',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'itemreceipt':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_item_receipt',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'vendorpayment':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_bill_payment',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'vendorcredit':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_vendor_credit',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'returnauthorization':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_return_authorization',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'vendorreturnauthorization':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_vend_return_autho',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'expensereport':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_expense_report',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'check':
            filters2[2] = search.createFilter({
              name: 'custrecord_lmry_on_check',
              operator: search.Operator.IS,
              values: ['T']
            });
            break;
        case 'cashsale':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_cash_sale',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'journalentry':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_journal',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
          // case 'invoice':
          //   filters[3] = search.createFilter({
          //     name: 'custrecord_lmry_on_work_order',
          //     operator: search.Operator.IS,
          //     values: ['true']
          //   });
          //   break;
        case 'customer':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_customer',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'vendor':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_vendor',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'job':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_project',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'employee':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_employee',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;

      }

      var columns2 = new Array();

      columns2[0] = search.createColumn({
        name: 'name'
      });

      columns2[1] = search.createColumn({
        name: 'custrecord_lmry_country'
      });

      var hidefields2 = search.create({
        type: 'customrecord_lmry_fields',
        columns: columns2,
        filters: filters2
      });


      hidefields2 = hidefields2.run().getRange(0, 1000);

      var list_pais = new Array();
      var list_hide = new Array();
      var comp = new Boolean();

      //&& hidefields2 != null && hidefields2 != ''
      if (hidefields != null && hidefields != '') {


        for (var i = 0; i < hidefields2.length; i++) {
          var namefield2 = hidefields2[i].getValue('name');
          namefield2 = namefield2.replace(/\n/g, '');
          namefield2 = namefield2.replace(/\t/g, '');
          namefield2 = namefield2.replace(/ /g, '');
          var pais = hidefields2[i].getText('custrecord_lmry_country');

          pais = Library_Mail.DeleteChar(pais);
          if (pais == 'Brasil') {
            pais = 'Brazil';
          }
          if (pais == 'Dominican Republic') {
            pais = 'República Dominicana';
          }
          if (pais == 'Estados Unidos') {
            pais = 'United States';
          }
          if (pais.indexOf('Bolivia') > -1) {
            pais = 'Bolivia';
          }
          if (pais == Country_Hide) {
            list_pais.push(namefield2);

          }
        }

        for (var j = 0; j < hidefields.length; j++) {
          var namefield = hidefields[j].getValue('name');
          namefield = namefield.replace(/\n/g, '');
          namefield = namefield.replace(/\t/g, '');
          namefield = namefield.replace(/ /g, '');

          comp = true;

          for (var y = 0; y < list_pais.length; y++) {
            if (namefield == list_pais[y]) {
              comp = false;
              break;
            }
          }
          if (comp) {
            list_hide.push(namefield);
          }
        }

        var ListaColumna = new Array('item', 'expense', 'line');

        for (var x = 0; x < ListaColumna.length; x++) {


          var sublist = OBJ_FORM.getSublist({
            id: ListaColumna[x]
          });
          if (sublist != null && sublist != '') {
            for (var p = 0; p < list_hide.length; p++) {

              var field = sublist.getField({
                id: list_hide[p]
              });

              if (list_hide[p] != null && list_hide[p] != '') {

                try {
                  field.updateDisplayType({
                    displayType: 'hidden'
                  });
                  //log.error('columna por ocultar',list_hide[p]);
                } catch (err) {
                  //log.error('se callo script', list_hide[p] + ',' + err);
                  list_log_list.push(list_hide[p]);

                }
              }
            }
          }

        }

      }
    }

    function HideSubTab(OBJ_FORM, Country_Hide, Type, licenses) {

      // log.error('HideSubTab OBJ_FORM', OBJ_FORM);
      // log.error('HideSubTab Country_Hide', Country_Hide);
      // log.error('HideSubTab Type', Type);
      // if(Country_Hide == ' ' || Country_Hide == null || Country_Hide == ''){
      //   Country_Hide = 'Vacio';
      // }
      // log.error('HideSubTab',Country_Hide);

      Country_Hide = Library_Mail.DeleteChar(Country_Hide);
      if (Country_Hide == 'Brasil') {
        Country_Hide = 'Brazil';
      }
      if (Country_Hide == 'Dominican Republic') {
        Country_Hide = 'República Dominicana';
      }
      if (Country_Hide == 'Estados Unidos') {
        Country_Hide = 'United States';
      }
      if (Country_Hide.indexOf('Bolivia') > -1) {
        Country_Hide = 'Bolivia';
      }

      switch (Country_Hide) {
        case 'Argentina':
          feature = Library_Mail.getAuthorization(100, licenses);
          break;
        case 'Bolivia':
          feature = Library_Mail.getAuthorization(37, licenses);
          break;
        case 'Brazil':
          feature = Library_Mail.getAuthorization(140, licenses);
          break;
        case 'Chile':
          feature = Library_Mail.getAuthorization(98, licenses);
          break;
        case 'Colombia':
          feature = Library_Mail.getAuthorization(26, licenses);
          break;
        case 'Costa Rica':
          feature = Library_Mail.getAuthorization(24, licenses);
          break;
        case 'Ecuador':
          feature = Library_Mail.getAuthorization(42, licenses);
          break;
        case 'El Salvador':
          feature = Library_Mail.getAuthorization(6, licenses);
          break;
        case 'Guatemala':
          feature = Library_Mail.getAuthorization(133, licenses);
          break;
        case 'Mexico':
          feature = Library_Mail.getAuthorization(20, licenses);
          break;
        case 'Panama':
          feature = Library_Mail.getAuthorization(137, licenses);
          break;
        case 'Paraguay':
          feature = Library_Mail.getAuthorization(38, licenses);
          break;
        case 'Peru':
          feature = Library_Mail.getAuthorization(136, licenses);
          break;
        case 'Uruguay':
          feature = Library_Mail.getAuthorization(39, licenses);
          break;
        case 'Nicaragua':
          feature = Library_Mail.getAuthorization(406, licenses);
          break;
        case 'República Dominicana':
          feature = Library_Mail.getAuthorization(399, licenses);
          break;
        case 'United States':
          feature = Library_Mail.getAuthorization(1007, licenses);
          break;
        default:
          Country_Hide = '';
      }

      if (feature == false) {
        Country_Hide = '';
      }
      var err;

      var filters = new Array();

      filters[0] = search.createFilter({
        name: 'custrecord_lmry_hide_section',
        operator: search.Operator.ANYOF,
        values: [5]
      });

      filters[1] = search.createFilter({
        name: 'isinactive',
        operator: search.Operator.IS,
        values: ['F']
      });



      var columns = new Array();

      columns[0] = search.createColumn({
        name: 'name'
      });

      var hidefields = search.create({
        type: 'customrecord_lmry_hide_fields',
        columns: columns,
        filters: filters
      });

      hidefields = hidefields.run().getRange(0, 1000);

      //log.error('hidefields',hidefields);

      var filters2 = new Array();
      filters2[0] = search.createFilter({
        name: 'custrecord_lmry_section',
        operator: search.Operator.ANYOF,
        values: [5]
      });

      filters2[1] = search.createFilter({
        name: 'isinactive',
        operator: search.Operator.IS,
        values: ['F']
      });

      switch (Type) {

        // case 'invoice':
        //   filters[3] = search.createFilter({
        //     name: 'custrecord_lmry_on_opportunity',
        //     operator: search.Operator.IS,
        //     values: ['true']
        //   });
        //   break;
        case 'salesorder':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_sales_order',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'estimate':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_estimate',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'invoice':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_invoice',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'itemfulfillment':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_item_fulfillment',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'creditmemo':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_credit_memo',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'customerdeposit':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_customer_deposit',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'customerpayment':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_customer_payment',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'customerrefund':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_customer_refund',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'purchaseorder':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_purchase_order',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'vendorbill':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_bill',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'itemreceipt':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_item_receipt',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'vendorpayment':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_bill_payment',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'vendorcredit':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_vendor_credit',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'returnauthorization':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_return_authorization',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'vendorreturnauthorization':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_vend_return_autho',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'expensereport':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_expense_report',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'check':
            filters2[2] = search.createFilter({
              name: 'custrecord_lmry_on_check',
              operator: search.Operator.IS,
              values: ['T']
            });
            break;
        case 'cashsale':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_cash_sale',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'journalentry':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_journal',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
          // case 'invoice':
          //   filters[3] = search.createFilter({
          //     name: 'custrecord_lmry_on_work_order',
          //     operator: search.Operator.IS,
          //     values: ['true']
          //   });
          //   break;
        case 'customer':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_customer',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'vendor':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_vendor',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'job':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_project',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;
        case 'employee':
          filters2[2] = search.createFilter({
            name: 'custrecord_lmry_on_employee',
            operator: search.Operator.IS,
            values: ['T']
          });
          break;

      }

      var columns2 = new Array();

      columns2[0] = search.createColumn({
        name: 'name'
      });

      columns2[1] = search.createColumn({
        name: 'custrecord_lmry_country'
      });

      var hidefields2 = search.create({
        type: 'customrecord_lmry_fields',
        columns: columns2,
        filters: filters2
      });
      
      hidefields2 = hidefields2.run().getRange(0, 1000);

      var list_pais = new Array();
      var list_hide = new Array();
      var comp = new Boolean();

      //log.error('hidefields2',hidefields2);

      if (hidefields != null && hidefields != '') {


        for (var i = 0; i < hidefields2.length; i++) {
          var namefield2 = hidefields2[i].getValue('name');
          namefield2 = namefield2.replace(/\n/g, '');
          namefield2 = namefield2.replace(/\t/g, '');
          namefield2 = namefield2.replace(/ /g, '');
          var pais = hidefields2[i].getText('custrecord_lmry_country');
          pais = Library_Mail.DeleteChar(pais);
          if (pais == 'Brasil') {
            pais = 'Brazil';
          }
          if (pais == 'Dominican Republic') {
            pais = 'República Dominicana';
          }
          if (pais == 'Estados Unidos') {
            pais = 'United States';
          }
          if (pais.indexOf('Bolivia') > -1) {
            pais = 'Bolivia';
          }
          if (pais == Country_Hide) {

            list_pais.push(namefield2);

          }
        }

        //log.error('list_pais',list_pais);

        for (var j = 0; j < hidefields.length; j++) {
          var namefield = hidefields[j].getValue('name');
          namefield = namefield.replace(/\n/g, '');
          namefield = namefield.replace(/\t/g, '');
          namefield = namefield.replace(/ /g, '');
          comp = true;

          for (var y = 0; y < list_pais.length; y++) {
            if (namefield == list_pais[y]) {
              comp = false;
              break;
            }
          }
          if (comp) {
            list_hide.push(namefield);
          }
        }
        //log.error('list_hide', list_hide);
      }


      for (var p = 0; p < list_hide.length; p++) {

        if (list_hide[p] != null && list_hide[p] != '') {

          var sublist = OBJ_FORM.getSublist({
            id: list_hide[p]
          });
          try {
            sublist.displayType = serverWidget.SublistDisplayType.HIDDEN;
          } catch (err) {
            //log.error('se callo script', list_hide[p] + ',' + err);
          }
        }
      }
    }

    function HideEntityFields(OBJ_FORM, countryCode, licenses,currentRecord) {
      var featureInterCompany = true;
      var subsidiaries = []
      

      var countries = {
        "11": "AR",
        "29": "BO",
        "30": "BR",
        "45": "CL",
        "48": "CO",
        "49": "CR",
        "63": "EC",
        "208": "SV",
        "91": "GT",
        "157": "MX",
        "165": "NI",
        "173": "PA",
        "186": "PY",
        "174": "PE",
        "61": "DO",
        "231": "UY",
        "230": "US"
      }

      var authorizationCode = getFeatureByCountryCode(countryCode, licenses)

      var primaryCountryID = getCountryID(countryCode, countries)

      

      var filters = [
        ["custrecord_lmry_section", "anyof", "1"],
        "AND",
        ["isinactive", "is", "F"]
      ]
      if (featureInterCompany) {
        var uniqueCountryCodes = [];
        var seen = {}; 
        subsidiaries = getSubsidiaries(currentRecord)
        for (var subsidiaryId in subsidiaries) {
          if (subsidiaries.hasOwnProperty(subsidiaryId)) {
            var countryCode = subsidiaries[subsidiaryId].countryCode;
            if (!seen[countryCode]) {
              seen[countryCode] = true;
              uniqueCountryCodes.push(countryCode);
            }
          }
        }
        log.error("uniqueCountryCodes",uniqueCountryCodes)
        filters.push("AND", ["custrecord_lmry_country", "anyof", uniqueCountryCodes])
      }else{
        filters.push("AND", ["custrecord_lmry_country", "anyof", primaryCountryID])
      }
      
      //view
      var listSetupView = getFieldToView(countries,filters);

      var listSetupHide = getFieldToHide();

      if (authorizationCode) {
        if (!featureInterCompany) {
          listSetupHide = removeElements(listSetupHide, listSetupView[countryCode]);
        }
      }

      log.error("listSetupView", listSetupView)
      log.error("listSetupHide", listSetupHide)
      
      hideFields(listSetupHide, OBJ_FORM)
      if (featureInterCompany) {
        var entityFields = getEntityFields();
        var fieldData = assignFieldsToSubsidiaries(subsidiaries, entityFields, currentRecord.type); 
        fieldData = filterAllowedFieldsByCountry(listSetupView, fieldData);
      }
      
    }

    function getFieldToHide(){
      var listSetupHide = []

      search.create({
        type: "customrecord_lmry_hide_fields",
        filters: [
          ["isinactive", "is", "F"]
        ],
        columns:
          [
            search.createColumn({ name: "name", label: "Name" })
          ]
      }).run().each(function (result) {
        var columns = result.columns
        var setupName = result.getValue(columns[0])
        listSetupHide.push(setupName);
        return true
      })
      return listSetupHide;
    }

    function getFieldToView(countries,filters){
      var listSetupView = [];
      search.create({
        type: "customrecord_lmry_fields",
        filters: filters,
        columns:
          [
            search.createColumn({ name: "name", label: "Name" }),
            search.createColumn({ name: "custrecord_lmry_country", label: "Country" }),
            search.createColumn({ name: "custrecord_lmry_section", label: "Section" })
          ]
      }).run().each(function (result) {
        var columns = result.columns
        var setupName = result.getValue(columns[0])
        var setupCountry = countries[result.getValue(columns[1])]
        if (!listSetupView[setupCountry]) {
          listSetupView[setupCountry] = []
        }

        listSetupView[setupCountry].push(setupName)
        return true
      })
      return listSetupView;
    }

    function getSubsidiaries(currentRecord) {
      //var currRecord = record.load({type:record.Type.CUSTOMER, id:currentRecord.get().id, isDynamic:true});
      log.error("currRecord: ", currentRecord.id)
      //console.log("subsidiary: ",currRecord.getValue("subsidiary"))
      var countSubsidiaries = currentRecord.getLineCount({
        sublistId: 'submachine'
      });
      var subsidiaries = [];
      for (var i = 0; i < countSubsidiaries; i++) {
        subsidiaries.push(currentRecord.getSublistValue({ sublistId: 'submachine', fieldId: 'subsidiary', line: i }))
      }

      var jsonSubsidiaries = {};
      search.create({
        type: search.Type.SUBSIDIARY,
        columns: ['internalid', 'country', 'name'],
        filters: [{ name: 'internalid', operator: 'anyof', values: subsidiaries }]
      }).run().each(function (result) {
        var internalid = result.getValue("internalid");
        var nameWords = result.getValue("name").split(":");
        console.log("nameWords: ", nameWords)
        jsonSubsidiaries[internalid] = {
          countryCode: result.getValue("country"),
          countryName: result.getText("country"),
          "name": nameWords[nameWords.length - 1]
        }
        return true;
      });

      log.error("subsidiaries: ", jsonSubsidiaries)
      return jsonSubsidiaries;
    }

    function hideFields(listHide, OBJ_FORM) {
      listHide.forEach(function (fieldName) {
        var field = OBJ_FORM.getField({ id: fieldName })
        if (field) {
          field.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
          });
        }
      })
    }

    function removeElements(listHide, listView) {
      return listHide.filter(function (fieldName) {
        return listView.indexOf(fieldName) === -1;
      });
    }

    function getFeatureByCountryCode(countryCode, licenses) {
      var countryAuthorizationMap = {
        "AR": 100,
        "BO": 37,
        "BR": 140,
        "CL": 98,
        "CO": 26,
        "CR": 24,
        "EC": 42,
        "SV": 6,
        "GT": 133,
        "MX": 20,
        "PA": 137,
        "PY": 38,
        "PE": 136,
        "UY": 39,
        "NI": 406,
        "DO": 399,
        "US": 1007
      };
      var authorizationCode = countryAuthorizationMap[countryCode];

      if (authorizationCode !== undefined) {
        return Library_Mail.getAuthorization(authorizationCode, licenses)
      } else {
        return null
      }
    }

    function getCountryID(country, countryCodes) {
      for (var code in countryCodes) {
        if (countryCodes.hasOwnProperty(code) && countryCodes[code] === country) {
          return parseInt(code, 10);
        }
      }
      return null;
    }

    function assignFieldsToSubsidiaries(subsidiaries, entityFields, typeEntity) {
      var general = [];

      for (var fieldKey in entityFields) {
        if (entityFields.hasOwnProperty(fieldKey)) {
          var fieldConfig = entityFields[fieldKey];
          if (fieldConfig && fieldConfig.isGeneral) {
            general.push({
              fieldKey: fieldKey,
              fieldRecord: fieldConfig.fieldRecord
            });
          }
        }
      }

      for (var subsidiaryId in subsidiaries) {
        if (subsidiaries.hasOwnProperty(subsidiaryId)) {
          var subsidiary = subsidiaries[subsidiaryId];
          var countryCode = subsidiary.countryCode;
          subsidiary.fieldsEntity = [];

          for (var fieldKey in entityFields) {
            if (entityFields.hasOwnProperty(fieldKey)) {
              var fieldConfig = entityFields[fieldKey];

              if (
                fieldConfig &&
                !fieldConfig.isGeneral &&
                fieldConfig.countries &&
                fieldConfig.countries[countryCode] &&
                fieldConfig.countries[countryCode].indexOf(typeEntity) !== -1
              ) {
                subsidiary.fieldsEntity.push({
                  fieldKey: fieldKey,
                  fieldRecord: fieldConfig.fieldRecord,
                  type: fieldConfig.type
                });
              }
            }
          }
        }
      }

      return { subsidiaries: subsidiaries, general: general };
    }
  
    function filterAllowedFieldsByCountry(listSetupView, entityFields) {
      for (var subsidiaryId in entityFields.subsidiaries) {
        if (entityFields.subsidiaries.hasOwnProperty(subsidiaryId)) {
          var subsidiary = entityFields.subsidiaries[subsidiaryId];
          var countryCode = subsidiary.countryCode; 
          if (listSetupView[countryCode]) {
            var allowedFields = listSetupView[countryCode]; 

            subsidiary.fieldsEntity = subsidiary.fieldsEntity.filter(function (field) {
              return allowedFields.indexOf(field.fieldKey) !== -1;
            });
          } else {
            subsidiary.fieldsEntity = [];
          }
        }
      }
      return entityFields;
    }

    function getEntityFields() {
      return {
        custentity_lmry_country: {
          countries: {
            CO: ["customer", "vendor"],
            MX: ["customer", "vendor"],
            PE: ["vendor"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_country",
          type:"select"
        },
        custentity_lmry_country_codeiso: {
          countries: {
            CO: ["customer"],
            MX: ["customer"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_country_codeiso",
          type:"text"
        },
        custentity_lmry_countrycode: {
          countries: {
            DO: ["customer", "vendor"],
            PA: ["customer"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_countrycode",
          type:"text"
        },
        custentity_lmry_sv_taxpayer_number: {
          isGeneral: true,
          fieldRecord: "custrecord_lmry_ef_sv_taxpayer_number",
          type:"text"
        },
        custentity_lmry_sv_taxpayer_type: {
          isGeneral: true,
          fieldRecord: "custrecord_lmry_ef_sv_taxpayer_type",
          type:"select"
        },
        custentity_lmry_actecon_sii_cl: {
          countries: {
            CL: ["customer"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_actecon_sii_cl",
          type:"select"
        },
        custentity_lmry_digito_verificator: {
          countries: {
            CL: ["customer", "vendor"],
            CO: ["customer", "vendor"],
            PA: ["customer", "vendor"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_digito_verificator",
          type:"text"
        },
        custentity_lmry_entityrelated: {
          countries: {
            CL: ["customer"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_entityrelated",
          type:"text"
        },
        custentity_lmry_fiscal_responsability: {
          countries: {
            PE: ["customer"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_fiscal_responsability",
          type:"select"
        },
        custentity_lmry_giro: {
          countries: {
            CL: ["customer"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_giro",
          type:"text"
        },
        custentity_lmry_legal_name_project: {
          countries: {
            MX: ["customer"],
            PA: ["customer"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_legal_name_project",
          type:"text"
        },
        custentity_lmry_pa_person_code: {
          countries: {
            PA: ["customer"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_pa_person_code",
          type:"text"
        },
        custentity_lmry_pa_person_type: {
          countries: {
            CO: ["customer"],
            PA: ["customer"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_pa_person_type",
          type:"select"
        },
        custentity_lmry_prefijo_prov: {
          countries: {
            CL: ["customer"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_prefijo_prov",
          type:"text"
        },
        custentity_lmry_sunat_tipo_doc_cod: {
          countries: {
            CO: ["customer"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_sunat_tipo_doc_cod",
          type:"text"
        },
        custentity_lmry_sunat_tipo_doc_id: {
          countries: {
            CO: ["customer", "vendor"],
            DO: ["customer", "vendor"],
            PE: ["customer", "vendor"]
          },
          isGeneral: false,
          fieldRecord: "custrecord_lmry_ef_sunat_tipo_doc_id",
          type:"select"
        }
      }
    }


    return {
      HideColumn: HideColumn,
      HideSubTab: HideSubTab,
      HideEntityFields: HideEntityFields
    };

  });