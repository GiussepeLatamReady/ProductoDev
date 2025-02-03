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

  define(['N/search', 'N/log','N/record', './LMRY_libSendingEmailsLBRY_V2.0','N/runtime'],

    function( search, log,record, Library_Mail,runtime) {

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

        require(['N/ui/serverWidget'], function (serverWidget) {
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
        });
        
      }

      function getCountries(){
        return {
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
      }

      function HideEntityFields(OBJ_FORM, countryCode, licenses, currentRecord,contextType) {
        try {

          var subsidiary = currentRecord.getValue("subsidiary");
          if (!subsidiary) return false;
          
          log.error("HideEntityFields","START")
          var featureInterCompany = runtime.getCurrentScript().getParameter({ name: "custscript_lmry_all_entity_fields" });
          var subsidiaries = []
          var authorizationCode = getFeatureByCountryCode(countryCode, licenses)
          var primaryCountryID = getCountryID(countryCode)
          if (featureInterCompany) subsidiaries = getSubsidiaries(currentRecord,contextType == "view")

          //view
          var listSetupView = {};

          if (!featureInterCompany) listSetupView = getFieldToView(featureInterCompany,primaryCountryID,subsidiaries);

          var listSetupHide = getFieldToHide();

          if (authorizationCode && !featureInterCompany) {
            listSetupHide = removeElements(listSetupHide, listSetupView[countryCode]);
          }

          hideFields(listSetupHide, OBJ_FORM)
          if (featureInterCompany) {
            var entityFields = getEntityFields();
            log.error("entityFields",entityFields)
            //log.error("entityFields",entityFields)
            var fieldData = assignFieldsToSubsidiaries(subsidiaries, entityFields, currentRecord.type);
            log.error("fieldData 1",fieldData)
            //log.error("listSetupView",listSetupView)
            //fieldData = filterAllowedFieldsByCountry(listSetupView, fieldData);
            log.error("fieldData 2",fieldData)
            createGroups(OBJ_FORM, fieldData);
            assignFields(OBJ_FORM, fieldData);
            log.error("fieldData 3",fieldData)
            loadData(fieldData,currentRecord)
          }
        } catch (error) {
          log.error("[HideEntityFields] error",error);
          log.error("[HideEntityFields] error stack",error.stack);
        }

      }
      
      function showEntityFieldsIntercompany(currentRecord,mode) {
        try {

          var subsidiariesAll = []
          subsidiariesAll = getSubsidiaries(currentRecord);
          var subsidiariesView = []
          subsidiariesView = getSubsidiaries(currentRecord,true,mode);
    
          var entityFields = getEntityFields();

          //var listSetupHide = getFieldToView(true,0,subsidiariesAll);
          var fieldDataHide = assignFieldsToSubsidiaries(subsidiariesAll, entityFields, currentRecord.type);
          //fieldDataHide = filterAllowedFieldsByCountry(listSetupHide, fieldDataHide);
          createGroups(null, fieldDataHide,true)
          setCustpage(fieldDataHide,true,currentRecord,false); 
          
          if (!Object.keys(subsidiariesView).length) return false;

          //var listSetupView = getFieldToView(true,0,subsidiariesView);
          var fieldDataView = assignFieldsToSubsidiaries(subsidiariesView, entityFields, currentRecord.type);
          //fieldDataView = filterAllowedFieldsByCountry(listSetupView, fieldDataView);
          createGroups(null, fieldDataView,true)
          setCustpage(fieldDataView,true,currentRecord,true);     
          
        } catch (error) {
          console.error("[HideEntityFields] error",error);
          console.error("[HideEntityFields] error stack",error.stack);
        }

      }

      
      
      function saveEntityFields(currentRecord) {
        try {
         log.error("saveEntityFields","start")
          var subsidiaries = getSubsidiaries(currentRecord,true,"create")
          //var listSetupView = getFieldToView(true,0,subsidiaries);
          var entityFields = getEntityFields();
          var fieldData = assignFieldsToSubsidiaries(subsidiaries, entityFields, currentRecord.type);
          //fieldData = filterAllowedFieldsByCountry(listSetupView, fieldData);
          setCustpage(fieldData);
          createRecord(fieldData, currentRecord)
        } catch (error) {
          log.error("saveEntityFields", error)
          log.error("saveEntityFields stack", error.stack)
        }

      }


      function createRecord_Z(fieldData, currentRecord) {
        function getValues(config, record, prefix) {
          return config.reduce(function (values, fieldConfig) {
            var fieldValue = record.getValue(fieldConfig.custpage);
            if (fieldValue) {
              if (fieldConfig.type == "checkbox") {
                if (fieldValue === "T") {
                  values[fieldConfig.fieldRecord] = true;
                }else{
                  values[fieldConfig.fieldRecord] = false;
                }
              }else{
                values[fieldConfig.fieldRecord] = fieldValue;
              }
              
            }
            return values;
          }, prefix || {});
        }

        function findRecordId(subsidiaryId, entityId) {
          var recordID;
          search.create({
            type: "customrecord_lmry_entity_fields",
            filters: [
              ["custrecord_lmry_co_subsi_reten", "anyof", subsidiaryId],
              "AND",
              ["custrecord_lmry_co_entity", "anyof", entityId]
            ],
            columns: ["internalid"]
          }).run().each(function (result) {
            recordID = result.getValue("internalid");
          });
          return recordID;
        }

        function submitOrSaveRecord(recordID, values, subsidiaryId, entityId) {
          if (recordID) {
            record.submitFields({
              type: "customrecord_lmry_entity_fields",
              id: recordID,
              values: values,
              options: { ignoreMandatoryFields: true, enableSourcing: true, disableTriggers: true }
            });
          } else {
            var newRecord = record.create({
              type: "customrecord_lmry_entity_fields",
              isDynamic: true
            });
            newRecord.setValue("custrecord_lmry_co_entity", entityId);
            newRecord.setValue("custrecord_lmry_co_subsi_reten", subsidiaryId);
            Object.keys(values).forEach(function (key) {
              
              newRecord.setValue(key, values[key]);
            });
            newRecord.save({ ignoreMandatoryFields: true, disableTriggers: true });
          }
        }

        if (fieldData.subsidiaries) {
          Object.keys(fieldData.subsidiaries).forEach(function (subsidiaryId) {
            var subsidiaryConfig = fieldData.subsidiaries[subsidiaryId];
            if (subsidiaryConfig.fieldsEntity.length) {
              var recordID = findRecordId(subsidiaryId, currentRecord.id);
              var values = getValues(subsidiaryConfig.fieldsEntity, currentRecord);
              if (fieldData.general) {
                values = getValues(fieldData.general, currentRecord, values);
              }
              submitOrSaveRecord(recordID, values, subsidiaryId, currentRecord.id);
            }
          });
        }
      }
    

      function createRecord(fieldData, currentRecord) {
        function getValues(config, record, prefix) {
          return config.reduce(function (values, fieldConfig) {
            var fieldValue = record.getValue(fieldConfig.custpage);
            if (fieldValue) {
              if (fieldConfig.type === "checkbox") {
                values[fieldConfig.fieldRecord] = (fieldValue === "T");
              } else {
                values[fieldConfig.fieldRecord] = fieldValue;
              }
            }
            return values;
          }, prefix || {});
        }

        function findRecordId(subsidiaryId, entityId) {
          var recordID;
          search.create({
            type: "customrecord_lmry_entity_fields",
            filters: [
              ["custrecord_lmry_co_subsi_reten", "anyof", subsidiaryId],
              "AND",
              ["custrecord_lmry_co_entity", "anyof", entityId]
            ],
            columns: ["internalid"]
          }).run().each(function (result) {
            recordID = result.getValue("internalid");
          });
          return recordID;
        }

        function submitOrSaveRecord(recordID, values, subsidiaryId, entityId) {
          if (recordID) {
            record.submitFields({
              type: "customrecord_lmry_entity_fields",
              id: recordID,
              values: values,
              options: { ignoreMandatoryFields: true, enableSourcing: true, disableTriggers: true }
            });
          } else {
            var newRecord = record.create({
              type: "customrecord_lmry_entity_fields",
              isDynamic: true
            });
            newRecord.setValue("custrecord_lmry_co_entity", entityId);
            newRecord.setValue("custrecord_lmry_co_subsi_reten", subsidiaryId);
            Object.keys(values).forEach(function (key) {
              newRecord.setValue(key, values[key]);
            });
            newRecord.save({ ignoreMandatoryFields: true, disableTriggers: true });
          }
        }

        // Objeto para almacenar datos por país
        var countriesData = {};

        if (fieldData.subsidiaries) {
          // Agrupar subsidiarias por país
          Object.keys(fieldData.subsidiaries).forEach(function (subsidiaryId) {
            var subsidiaryConfig = fieldData.subsidiaries[subsidiaryId];
            var countryCode = subsidiaryConfig.countryCode;

            if (!countriesData[countryCode]) {
              countriesData[countryCode] = {
                countryCode: countryCode,
                countryName: subsidiaryConfig.countryName,
                subsidiaries: [],
                fieldsEntity: subsidiaryConfig.fieldsEntity
              };
            }
            countriesData[countryCode].subsidiaries.push(subsidiaryId);
          });

          // Procesar cada país
          Object.keys(countriesData).forEach(function (countryCode) {
            var countryConfig = countriesData[countryCode];

            // Obtener valores únicos para el país
            var values = getValues(countryConfig.fieldsEntity, currentRecord);

            // Agregar valores generales si existen
            if (fieldData.general) {
              values = getValues(fieldData.general, currentRecord, values);
            }

            // Guardar o actualizar registros por cada subsidiaria del país
            countryConfig.subsidiaries.forEach(function (subsidiaryId) {
              var recordID = findRecordId(subsidiaryId, currentRecord.id);
              submitOrSaveRecord(recordID, values, subsidiaryId, currentRecord.id);
            });
          });
        }
      }
    
      function getFieldsRecord_Z(fieldData) {
        var fieldsViewRecord = [];
        var subsidiaries = fieldData.subsidiaries || {};
        for (var id in subsidiaries) {
          if (subsidiaries.hasOwnProperty(id)) {
            (subsidiaries[id].fieldsEntity || []).forEach(function (field) {
              if (fieldsViewRecord.indexOf(field.fieldRecord) === -1) {
                fieldsViewRecord.push(field.fieldRecord);
              }
            });
          }
        }
        (fieldData.general || []).forEach(function (field) {
          fieldsViewRecord.push(field.fieldRecord);
        });
        return fieldsViewRecord;
      }
    


      function loadData_Z(fieldData,currentRecord){
        var entityFieldsRecordData = {}
        var fieldRecords = getFieldsRecord(fieldData);
        var columns = [
          "custrecord_lmry_co_subsi_reten"
        ]
        var count = 0;
        columns = columns.concat(fieldRecords);
        search.create({
          type: "customrecord_lmry_entity_fields",
          filters: [
            ["custrecord_lmry_co_entity","anyof",currentRecord.id]
          ],
          columns: columns
        }).run().each(function(result) {
          var subsidiaryID = result.getValue("custrecord_lmry_co_subsi_reten");
          var objFieldsRecord = {}
          fieldRecords.forEach(function(field){
            objFieldsRecord[field] = result.getValue(field) || "";
          });
          entityFieldsRecordData[subsidiaryID] = objFieldsRecord;
          count++;
          return true;
        });

        if (fieldData.subsidiaries) {
          var subsidiariesConfig = fieldData.subsidiaries;
          for (var subsidiaryId in subsidiariesConfig) {
            if (subsidiariesConfig.hasOwnProperty(subsidiaryId) && entityFieldsRecordData[subsidiaryId]) {
              var subsidiaryConfig = subsidiariesConfig[subsidiaryId];
              if (subsidiaryConfig["fieldsEntity"].length) {
                subsidiaryConfig["fieldsEntity"].forEach(function(fieldConfig){
                  var fieldValue = entityFieldsRecordData[subsidiaryId][fieldConfig.fieldRecord];
                  if (fieldValue) {
                    currentRecord.setValue(fieldConfig.custpage,fieldValue);
                  }
                })
              }           
            }
          }
        }   

        if (fieldData.general && count) {
          var generalConfig = fieldData.general;
          generalConfig.forEach(function (fieldConfig) {
            for (var subsidiaryID in entityFieldsRecordData) {
              var fieldValue = entityFieldsRecordData[subsidiaryID][fieldConfig.fieldRecord];
              if (fieldValue) {
                currentRecord.setValue(fieldConfig.custpage, fieldValue);
              }
            }
          });
        }
      }

      function getFieldsRecord(fieldData) {
        var fieldsViewRecord = [];

        var subsidiaries = fieldData.subsidiaries || {};
        for (var id in subsidiaries) {
          if (subsidiaries.hasOwnProperty(id)) {
            var subsidiary = subsidiaries[id];
            var fieldsEntity = subsidiary.fieldsEntity || [];

            // Agregamos los campos sin repetir
            for (var i = 0; i < fieldsEntity.length; i++) {
              var fieldRecord = fieldsEntity[i].fieldRecord;
              if (fieldsViewRecord.indexOf(fieldRecord) === -1) {
                fieldsViewRecord.push(fieldRecord);
              }
            }
          }
        }

        // Agregar los campos generales sin repetir
        var generalFields = fieldData.general || [];
        for (var j = 0; j < generalFields.length; j++) {
          var fieldRecord = generalFields[j].fieldRecord;
          if (fieldsViewRecord.indexOf(fieldRecord) === -1) {
            fieldsViewRecord.push(fieldRecord);
          }
        }

        return fieldsViewRecord;
      }
    
      function loadData(fieldData, currentRecord) {
        var entityFieldsByCountry = {}; // Almacena los valores por país (solo el primero encontrado)
        var processedCountries = {}; // Usamos un objeto en lugar de un Set
        var fieldRecords = getFieldsRecord(fieldData);

        var columns = ["custrecord_lmry_co_subsi_reten"].concat(fieldRecords);
        log.error("columns",columns)
        log.error("fieldRecords",fieldRecords)
        // Buscar los datos en NetSuite
        search.create({
          type: "customrecord_lmry_entity_fields",
          filters: [
            ["custrecord_lmry_co_entity", "anyof", currentRecord.id]
          ],
          columns: columns
        }).run().each(function (result) {
          var subsidiaryID = result.getValue("custrecord_lmry_co_subsi_reten");

          // Verificar a qué país pertenece esta subsidiaria
          var countryCode = null;
          if (fieldData.subsidiaries[subsidiaryID]) {
            countryCode = fieldData.subsidiaries[subsidiaryID].countryCode;
          }

          if (countryCode && !processedCountries[countryCode]) { // Verificamos si ya se procesó este país
            var objFieldsRecord = {};
            fieldRecords.forEach(function (field) {
              objFieldsRecord[field] = result.getValue(field) || "";
            });

            // Guardar los valores solo para el primer registro encontrado de cada país
            entityFieldsByCountry[countryCode] = objFieldsRecord;
            processedCountries[countryCode] = true; // Marcamos el país como procesado
          }

          return true;
        });

        // Asignar los valores a los campos según el país
        if (fieldData.subsidiaries) {
          var countriesConfig = {};

          // Agrupar las configuraciones de subsidiarias por país
          for (var subsidiaryId in fieldData.subsidiaries) {
            if (fieldData.subsidiaries.hasOwnProperty(subsidiaryId)) {
              var subsidiary = fieldData.subsidiaries[subsidiaryId];
              var countryCode = subsidiary.countryCode;

              if (!countriesConfig[countryCode]) {
                countriesConfig[countryCode] = subsidiary;
              }
            }
          }

          // Aplicar los valores a los campos de cada país
          for (var countryCode in countriesConfig) {
            if (entityFieldsByCountry[countryCode]) {
              var countryConfig = countriesConfig[countryCode];

              countryConfig.fieldsEntity.forEach(function (fieldConfig) {
                var fieldValue = entityFieldsByCountry[countryCode][fieldConfig.fieldRecord];
                log.error("fieldConfig",fieldConfig)
                log.error("fieldValue",fieldValue)
                if (fieldValue) {
                  log.error("seteo","success")
                  currentRecord.setValue(fieldConfig.custpage, fieldValue);
                }
              });
            }
          }
        }

        // Asignar los valores generales si existen
        if (fieldData.general && Object.keys(entityFieldsByCountry).length) {
          var generalConfig = fieldData.general;
          generalConfig.forEach(function (fieldConfig) {
            for (var countryCode in entityFieldsByCountry) {
              var fieldValue = entityFieldsByCountry[countryCode][fieldConfig.fieldRecord];
              if (fieldValue) {
                currentRecord.setValue(fieldConfig.custpage, fieldValue);
              }
            }
          });
        }
      }

      
      function createGroups_Z(OBJ_FORM, fieldData,isClient) {

        function addGroup(config, id, label) {
          config.group = { id: id, label: label };
          OBJ_FORM.addFieldGroup(config.group);
        }

        if (fieldData.general && !isClient) {
          addGroup(
            fieldData.general,
            'custpage_group_general_entity',
            'Latam - General'
          );
        }

        if (fieldData.subsidiaries) {
          Object.keys(fieldData.subsidiaries).forEach(function (subsidiaryId) {
            var subsidiaryConfig = fieldData.subsidiaries[subsidiaryId];
            if (subsidiaryConfig.fieldsEntity.length) {
              var grupoID = 'custpage_group_' + subsidiaryConfig.countryCode + '_' + subsidiaryId;
              var groupName = 'Latam - ' + subsidiaryConfig.countryName + ' : ' + subsidiaryConfig.name;
              if (isClient) {
                subsidiaryConfig.groupName = groupName;
              }else{
                addGroup(
                  subsidiaryConfig,
                  grupoID,
                  groupName
                );
              } 
            }
          });
        }
      }
      function createGroups(OBJ_FORM, fieldData, isClient) {

        function addGroup(config, id, label) {
          config.group = { id: id, label: label };
          OBJ_FORM.addFieldGroup(config.group);
        }

        // Objeto para almacenar países únicos con sus datos de grupo
        var countriesData = {};

        if (fieldData.subsidiaries) {
          Object.keys(fieldData.subsidiaries).forEach(function (subsidiaryId) {
            var subsidiaryConfig = fieldData.subsidiaries[subsidiaryId];
            var countryCode = subsidiaryConfig.countryCode;

            // Si el país aún no está registrado, creamos su entrada
            if (!countriesData[countryCode]) {
              countriesData[countryCode] = {
                countryCode: countryCode,
                countryName: subsidiaryConfig.countryName,
                fieldsEntity: [], // Lista para almacenar todos los campos de sus subsidiarias
              };
            }

            // Agregamos los campos de la subsidiaria al país
            countriesData[countryCode].fieldsEntity =
              countriesData[countryCode].fieldsEntity.concat(subsidiaryConfig.fieldsEntity);
          });
          log.error("[createGroups] countriesData",countriesData)
          // Ahora recorremos los países únicos para crear un grupo por cada uno
          Object.keys(countriesData).forEach(function (countryCode) {
            var countryConfig = countriesData[countryCode];
            var groupId = 'custpage_group_' + countryCode;
            var groupName = 'Latam - ' + countryConfig.countryName;

            if (isClient) {
              countryConfig.groupName = groupName;
            } else {
              addGroup(countryConfig, groupId, groupName);
            }
          });
        }

        // Si hay datos generales y no es cliente, se crea un grupo general
        if (fieldData.general && !isClient) {
          addGroup(
            fieldData.general,
            'custpage_group_general_entity',
            'Latam - General'
          );
        }
      }
    
      function assignFields_Z(OBJ_FORM, fieldData) {
          
          function createField(fieldConfig, containerId, subsidiaryId) {
            var fieldEntity = OBJ_FORM.getField(fieldConfig.fieldKey);
            if (fieldEntity) {
              var fieldID = fieldConfig.fieldKey.replace('custentity', 'custpage') + (subsidiaryId ? "_" + subsidiaryId : "");
              var objField = {
                id: fieldID,
                label: fieldEntity.label,
                type: fieldConfig.type,
                container: containerId
              };
              if (fieldConfig.fieldKey == "custentity_lmry_country" || fieldConfig.fieldKey == "custentity_lmry_actecon_sii_cl") objField.source = fieldConfig.source;
              fieldConfig.custpage = fieldID;
              OBJ_FORM.addField(objField).setHelpText(fieldConfig.fieldRecord);
              //fieldCreate.setHelpText(fieldConfig.fieldRecord);
          
            }
          }
          //setHelpText(fieldConfig.fieldRecord).
          if (fieldData.subsidiaries) {
           // var jsonSetup = getSetupTax(fieldData.subsidiaries)
           // log.error("jsonSetup",jsonSetup)
            for (var subsidiaryId in fieldData.subsidiaries) {
              if (fieldData.subsidiaries.hasOwnProperty(subsidiaryId)) {
                var subsidiary = fieldData.subsidiaries[subsidiaryId];
                subsidiary.fieldsEntity.forEach(function (fieldConfig) {
                  createField(fieldConfig, subsidiary.group.id, subsidiaryId);
                  loadSelect(OBJ_FORM,fieldConfig,subsidiary.countryCode)
                });
              }
            }
          }

          if (fieldData.general) {
            fieldData.general.forEach(function (fieldConfig) {
              createField(fieldConfig, fieldData.general.group.id);
            });
          }
      }

      function assignFields(OBJ_FORM, fieldData) {

        function createField(fieldConfig, containerId, countryCode) {
          var fieldEntity = OBJ_FORM.getField(fieldConfig.fieldKey);
          if (fieldEntity) {
            var fieldID = fieldConfig.fieldKey.replace('custentity', 'custpage') + "_" + countryCode.toLowerCase();
            log.error("fieldID:", fieldID);
            var objField = {
              id: fieldID,
              label: fieldEntity.label,
              type: fieldConfig.type,
              container: containerId
            };
            log.error("objField:", objField);

            if (fieldConfig.fieldKey === "custentity_lmry_country" || fieldConfig.fieldKey === "custentity_lmry_actecon_sii_cl") {
              objField.source = fieldConfig.source;
            }
            fieldConfig.custpage = fieldID;
            OBJ_FORM.addField(objField).setHelpText(fieldConfig.fieldRecord);
          }
        }

        // Objeto para almacenar los datos por país
        var countriesData = {};

        if (fieldData.subsidiaries) {
          for (var subsidiaryId in fieldData.subsidiaries) {
            if (fieldData.subsidiaries.hasOwnProperty(subsidiaryId)) {
              var subsidiary = fieldData.subsidiaries[subsidiaryId];
              var countryCode = subsidiary.countryCode;

              // Si el país aún no está registrado, crearlo
              if (!countriesData[countryCode]) {
                countriesData[countryCode] = {
                  countryCode: countryCode,
                  countryName: subsidiary.countryName,
                  fieldsEntity: [],
                  fieldSet: {}, // Se usa para evitar duplicados
                  groupId: 'custpage_group_' + countryCode
                };
              }

              // Agregar solo los campos que no han sido añadidos antes
              var fieldsEntity = subsidiary.fieldsEntity || [];
              for (var i = 0; i < fieldsEntity.length; i++) {
                var fieldRecord = fieldsEntity[i].fieldRecord;
                if (!countriesData[countryCode].fieldSet[fieldRecord]) {
                  countriesData[countryCode].fieldsEntity.push(fieldsEntity[i]);
                  countriesData[countryCode].fieldSet[fieldRecord] = true; // Marcar como agregado
                }
              }
            }
          }
        }

        // Asignar los campos al grupo de cada país
        Object.keys(countriesData).forEach(function (countryCode) {
          var countryData = countriesData[countryCode];
          countryData.fieldsEntity.forEach(function (fieldConfig) {
            createField(fieldConfig, countryData.groupId, countryCode);
            loadSelect(OBJ_FORM, fieldConfig, countryCode);
          });
        });

        // Si hay datos generales, asignarlos al grupo general
        if (fieldData.general) {
          var generalFieldSet = {}; // Evitar duplicados en campos generales
          fieldData.general.forEach(function (fieldConfig) {
            if (!generalFieldSet[fieldConfig.fieldRecord]) {
              createField(fieldConfig, fieldData.general.group.id);
              generalFieldSet[fieldConfig.fieldRecord] = true; // Marcar como agregado
            }
          });
        }
      }
    
    


      function loadSelect(OBJ_FORM,fieldConfig,countryCode){

        var countryID = getCountryID(countryCode);
        if (fieldConfig.fieldKey == "custentity_lmry_fiscal_responsability") {

          var fieldList = OBJ_FORM.getField(fieldConfig.custpage);
          fieldList.addSelectOption({
            value: "",
            text: ' '
          });
          search.create({
            type: "customrecord_lmry_fiscal_responsability",
            filters: [
              ["custrecordlmry_responsibility_country","anyof",countryID],
              "AND",
              ["isinactive","is","F"]
            ],
            columns:
              ["internalid","name"]
          }).run().each(function (result) {
            var columns = result.columns;
            fieldList.addSelectOption({
              value: result.getValue(columns[0]),
              text: result.getValue(columns[1])
            });
            return true
          });
        }

        if (fieldConfig.fieldKey == "custentity_lmry_pa_person_type") {

          var fieldList = OBJ_FORM.getField(fieldConfig.custpage);
          fieldList.addSelectOption({
            value: "",
            text: ' '
          });
          search.create({
            type: "customrecord_lmry_entity_type",
            filters: [
              ["custrecord_lmry_person_type_country","anyof",countryID],
              "AND",
              ["isinactive","is","F"]
            ],
            columns:
              ["internalid","name"]
          }).run().each(function (result) {
            var columns = result.columns;
            fieldList.addSelectOption({
              value: result.getValue(columns[0]),
              text: result.getValue(columns[1])
            });
            return true
          });
        }

        if (fieldConfig.fieldKey == "custentity_lmry_sunat_tipo_doc_id") {

          var fieldList = OBJ_FORM.getField(fieldConfig.custpage);
          fieldList.addSelectOption({
            value: "",
            text: ' '
          });
          search.create({
            type: "customrecord_lmry_tipo_doc_iden",
            filters: [
              ["custrecord_lmry_tipo_doc_country","anyof",countryID],
              "AND",
              ["isinactive","is","F"]
            ],
            columns:
              ["internalid","name"]
          }).run().each(function (result) {
            var columns = result.columns;
            fieldList.addSelectOption({
              value: result.getValue(columns[0]),
              text: result.getValue(columns[1])
            });
            return true
          });
        }

        if (fieldConfig.fieldKey == "custentity_lmry_sv_taxpayer_type") {

          var fieldList = OBJ_FORM.getField(fieldConfig.custpage);
          fieldList.addSelectOption({
            value: "",
            text: ' '
          });
          search.create({
            type: "customrecord_lmry_taxpayer_type_sv",
            filters: [
              ["custrecord_country","anyof",countryID],
              "AND",
              ["isinactive","is","F"]
            ],
            columns:
              ["internalid","name"]
          }).run().each(function (result) {
            var columns = result.columns;
            fieldList.addSelectOption({
              value: result.getValue(columns[0]),
              text: result.getValue(columns[1])
            });
            return true
          });
        }
      }


      /**
       * Asigna el custpage para cada campo temporal , en caso sea en el client muestra los valores segun la sublista
       * @param {*} fieldData Campos filtrados que se van a mostrar
       * @param {*} isClient contexto en que se ejecuta la funcion
       * @param {*} currentRecord Data de la entidad
       */
      function setCustpage_Z(fieldData,isClient,currentRecord,isVisible) {
        //console.log("currentRecord ",currentRecord.id)

        function updateFieldConfig(fields, subsidiaryId) {
          fields.forEach(function (fieldConfig) {
            var custpageValue = fieldConfig.fieldKey.replace('custentity', 'custpage');
            if (subsidiaryId) {
              custpageValue += "_" + subsidiaryId;
            }
            fieldConfig["custpage"] = custpageValue;
            if (isClient && subsidiaryId) {    
              var field = currentRecord.getField(fieldConfig.custpage);
              if (field) {
                field.isDisplay = isVisible;
              }
            }
          });
        }


        /**
         * Oculta el grupo de manera nativa con js vanilla
         * @param {*} label Nombre del grupo
         * @param {*} hide 
         */
        function toggleBlockByName(label, hide) {
          var tdElement = document.querySelector('td[data-nsps-label="' + label + '"]');
          if (tdElement) {
            var mainTr = tdElement.closest('tr');
            if (mainTr) {
              mainTr.style.display = hide ? 'none' : '';
              var relatedSiblings = mainTr.parentElement.querySelectorAll('tr');
              Array.prototype.forEach.call(relatedSiblings, function (sibling) {
                if (sibling.id === mainTr.id || sibling.id.startsWith('tr_' + mainTr.id) || sibling.className.includes('uir-field-group')) {
                  sibling.style.display = hide ? 'none' : '';
                }
              });
            }
          }
        }

        if (fieldData.subsidiaries) {
          for (var subsidiaryId in fieldData.subsidiaries) {
            if (fieldData.subsidiaries.hasOwnProperty(subsidiaryId)) {
              var subsidiaryConfig = fieldData.subsidiaries[subsidiaryId];
              if (subsidiaryConfig.fieldsEntity.length) {
                updateFieldConfig(subsidiaryConfig.fieldsEntity, subsidiaryId);
                if (isClient) {
                  toggleBlockByName(subsidiaryConfig.groupName,!isVisible)
                }
                
              }
            }
          }
        }

        if (fieldData.general) {
          updateFieldConfig(fieldData.general);
        }
      }
    

      function setCustpage(fieldData, isClient, currentRecord, isVisible) {
        //console.log("currentRecord ", currentRecord.id)
        function updateFieldConfig(fields, countryCode) {
          fields.forEach(function (fieldConfig) {
            var custpageValue = fieldConfig.fieldKey.replace('custentity', 'custpage');
            if (countryCode) {
              custpageValue += "_" + countryCode.toLowerCase();
            }
            fieldConfig["custpage"] = custpageValue;
            if (isClient && countryCode) {
              var field = currentRecord.getField(fieldConfig.custpage);
              if (field) {
                field.isDisplay = isVisible;
              }
            }
          });
        }

        /**
         * Oculta el grupo de manera nativa con js vanilla
         * @param {*} label Nombre del grupo
         * @param {*} hide 
         */
        function toggleBlockByName(label, hide) {
          // Buscar el <td> principal del grupo por su data-nsps-label

          var tdElement = document.querySelector('td[data-nsps-label="Latam - ' + label + '"]');

          if (tdElement) {
            // Buscar el <tr> contenedor principal del grupo
            var mainTr = tdElement.closest('tr.uir-field-group-row');

            if (mainTr) {
              mainTr.style.display = hide ? 'none' : '';

              // Buscar el contenido del grupo (los campos)
              var contentTr = document.getElementById('tr_' + mainTr.id);
              if (contentTr) {
                contentTr.style.display = hide ? 'none' : '';
              }

              // También ocultar separadores y filas relacionadas
              var relatedSiblings = mainTr.parentElement.querySelectorAll('tr');
              Array.prototype.forEach.call(relatedSiblings, function (sibling) {
                if (
                  sibling.classList.contains('uir-field-group-row-separator') ||
                  sibling.classList.contains('uir-fieldgroup-content') ||
                  sibling.id === 'tr_' + mainTr.id
                ) {
                  sibling.style.display = hide ? 'none' : '';
                }
              });
            }
          }
        }
      

        // Objeto para almacenar los datos por país
        var countriesData = {};
        if (fieldData.subsidiaries) {
          for (var subsidiaryId in fieldData.subsidiaries) {
            if (fieldData.subsidiaries.hasOwnProperty(subsidiaryId)) {
              var subsidiaryConfig = fieldData.subsidiaries[subsidiaryId];
              var countryCode = subsidiaryConfig.countryCode;

              // Si el país aún no está registrado, crearlo
              if (!countriesData[countryCode]) {
                countriesData[countryCode] = {
                  countryCode: countryCode,
                  countryName: subsidiaryConfig.countryName,
                  fieldsEntity: [],
                  fieldSet: {} // Para evitar duplicados
                };
              }

              // Agregar solo los campos únicos por país
              var fieldsEntity = subsidiaryConfig.fieldsEntity || [];
              for (var i = 0; i < fieldsEntity.length; i++) {
                var fieldRecord = fieldsEntity[i].fieldRecord;
                if (!countriesData[countryCode].fieldSet[fieldRecord]) {
                  countriesData[countryCode].fieldsEntity.push(fieldsEntity[i]);
                  countriesData[countryCode].fieldSet[fieldRecord] = true; // Marcar como agregado
                }
              }
            }
          }
        }

        // Asignar los campos al grupo de cada país
        Object.keys(countriesData).forEach(function (countryCode) {
          var countryData = countriesData[countryCode];
          updateFieldConfig(countryData.fieldsEntity, countryCode);
          if (isClient) {
            toggleBlockByName(countryData.countryName, !isVisible);
          }
        });

        // Si hay datos generales, asignarlos
        if (fieldData.general) {
          var generalFieldSet = {}; // Para evitar duplicados en campos generales
          fieldData.general.forEach(function (fieldConfig) {
            if (!generalFieldSet[fieldConfig.fieldRecord]) {
              updateFieldConfig([fieldConfig]);
              generalFieldSet[fieldConfig.fieldRecord] = true;
            }
          });
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

      function getFieldToView(featureInterCompany,primaryCountryID,subsidiaries){
        var filters = [
          ["custrecord_lmry_section", "anyof", "1"],
          "AND",
          ["isinactive", "is", "F"]
        ]
        if (featureInterCompany) {
          var uniqueCountryCodes = [];
          var seen = {};
          for (var subsidiaryId in subsidiaries) {
            if (subsidiaries.hasOwnProperty(subsidiaryId)) {
              var countryCode = subsidiaries[subsidiaryId].countryCode;
              if (!seen[countryCode]) {
                seen[countryCode] = true;
                uniqueCountryCodes.push(countryCode);
              }
            }
          }
          //log.error("uniqueCountryCodes", uniqueCountryCodes)
          var countryIDs = [];

          uniqueCountryCodes.forEach(function(code){
            countryIDs.push(getCountryID(code));
          })
          filters.push("AND", ["custrecord_lmry_country", "anyof", countryIDs])
        } else {
          filters.push("AND", ["custrecord_lmry_country", "anyof", primaryCountryID])
        }
        var countries = getCountries();
        var listSetupView = {};
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

      function getSubsidiaries(currentRecord,isFilterSubsidiaries,mode,isClient) {
       

        var filters = [["custrecord_lmry_features_subsidiary.isinactive","anyof","F"]];
        if (isFilterSubsidiaries) {
          //log.error("currRecord: ", currentRecord.id)
          var subsidiaries = [];
          if (mode == "create") subsidiaries.push(currentRecord.getValue("subsidiary"));
          var countSubsidiaries = currentRecord.getLineCount({
            sublistId: 'submachine'
          });
          
          for (var i = 0; i < countSubsidiaries; i++) {
            var subsidiary = currentRecord.getSublistValue({ sublistId: 'submachine', fieldId: 'subsidiary', line: i });
            if (subsidiaries.indexOf(subsidiary)==-1) {
              subsidiaries.push(subsidiary);
            }
            
          }
          
          if (!subsidiaries.length) return {};
          filters.push("AND",["custrecord_lmry_features_subsidiary.internalid","anyof",subsidiaries])
        }
        if (isClient) {
          var subsidiariesActive = []

          /*
          if (mode == "create") {
            subsidiariesActive.push(currentRecord.getValue("subsidiary"))
          }else{
            console.log("subsidiary :",currentRecord.getValue('subsidiary'))
            var recordLoad = record.load(
              {
                id: currentRecord.id,
                type: "entity"
              }
            )
            var countSubsidiaries = recordLoad.getLineCount({
              sublistId: 'submachine'
            });
            
            for (var i = 0; i < countSubsidiaries; i++) {
              var subsidiary = recordLoad.getSublistValue({ sublistId: 'submachine', fieldId: 'subsidiary', line: i });
              if (subsidiariesActive.indexOf(subsidiary)==-1) {
                subsidiariesActive.push(subsidiary);
              }
            }
          };
          */
          if (mode == "create") subsidiariesActive.push(currentRecord.getValue("subsidiary"));
          var countSubsidiaries = currentRecord.getLineCount({
            sublistId: 'submachine'
          });
          
          for (var i = 0; i < countSubsidiaries; i++) {
            var subsidiary = currentRecord.getSublistValue({ sublistId: 'submachine', fieldId: 'subsidiary', line: i });
            if (subsidiariesActive.indexOf(subsidiary)==-1) {
              subsidiariesActive.push(subsidiary);
            }
          }
        }
        var jsonSubsidiaries = {};
        search.create({
          type: "customrecord_lmry_features_by_subsi",
          columns: [
            'custrecord_lmry_features_subsidiary.internalid', 
            'custrecord_lmry_features_subsidiary.country', 
            'custrecord_lmry_features_subsidiary.name'
          ],
          filters: filters
        }).run().each(function (result) {
          //log.error("result :",result)
          var columns = result.columns;
          var internalid = result.getValue(columns[0]);
          var nameSubsidiary = result.getValue(columns[2]);
          if (nameSubsidiary && nameSubsidiary.indexOf(":") != -1) {
            var nameWords = result.getValue(columns[2]).split(":");
            nameSubsidiary = nameWords[nameWords.length - 1];
          }
          
          //console.log("nameWords: ", nameWords)
          jsonSubsidiaries[internalid] = {
            countryCode: result.getValue(columns[1]),
            countryName: result.getText(columns[1]),
            "name": nameSubsidiary || " "
          }
          return true;
        });

        if (isClient) {
          subsidiariesActive.forEach(function(subsidiaryID){
            if (jsonSubsidiaries[subsidiaryID]) {
              jsonSubsidiaries[subsidiaryID].isActive = true;
            }
          });
        }

        //log.error("subsidiaries: ", jsonSubsidiaries)
        return jsonSubsidiaries;
      }

      /*
      
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
          //console.log("nameWords: ", nameWords)
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
      */

      function hideFields(listHide, OBJ_FORM) {
        require(['N/ui/serverWidget'], function (serverWidget) {
          listHide.forEach(function (fieldName) {
            var field = OBJ_FORM.getField({ id: fieldName })
            if (field) {
              field.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
              });
            }
          })
        });
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

      function getCountryID(country) {
        var countryCodes = getCountries();
        for (var code in countryCodes) {
          if (countryCodes.hasOwnProperty(code) && countryCodes[code] === country) {
            return parseInt(code, 10);
          }
        }
        return null;
      }

      function assignFieldsToSubsidiaries(subsidiaries, entityFields, typeEntity) {
        var general = Object.keys(entityFields).filter(function (fieldKey) {
          return entityFields[fieldKey] && entityFields[fieldKey].isGeneral;
        }).map(function (fieldKey) {
          return {
            fieldKey: fieldKey,
            fieldRecord: entityFields[fieldKey].fieldRecord,
            type: entityFields[fieldKey].type,
            source: entityFields[fieldKey].source || "",
            setup: entityFields[fieldKey].setup || ""
          };
        });

        Object.keys(subsidiaries).forEach(function (subsidiaryId) {
          var subsidiary = subsidiaries[subsidiaryId];
          var countryCode = subsidiary.countryCode;
          subsidiary.fieldsEntity = Object.keys(entityFields).filter(function (fieldKey) {
            var fieldConfig = entityFields[fieldKey];
            return fieldConfig &&
              !fieldConfig.isGeneral &&
              fieldConfig.countries &&
              fieldConfig.countries[countryCode] &&
              fieldConfig.countries[countryCode].indexOf(typeEntity) !== -1;
          }).map(function (fieldKey) {
            return {
              fieldKey: fieldKey,
              fieldRecord: entityFields[fieldKey].fieldRecord,
              type: entityFields[fieldKey].type,
              source: entityFields[fieldKey].source || "",
              setup: entityFields[fieldKey].setup || ""
            };
          });
        });

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


      function changeSubsidiary(currentRCD, subsidiaries) {
        try {
          console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
          console.log("subsidiaries", subsidiaries);

          var subsidiaryID = currentRCD.getCurrentSublistValue({
            sublistId: 'submachine',
            fieldId: 'subsidiary'
          });
          console.log("subsidiaryID", subsidiaryID);
          var isClient = true;
          var entityFields = getEntityFields();

          // Mapeo de cuántas subsidiarias hay por país
          var subsidiariesByCountry = {};

          Object.keys(subsidiaries).forEach(function (subsidiaryId) {
            if (subsidiaries[subsidiaryId].isActive) {
              var countryCode = subsidiaries[subsidiaryId].countryCode;
              if (!subsidiariesByCountry[countryCode]) {
                subsidiariesByCountry[countryCode] = [];
              }
              subsidiariesByCountry[countryCode].push(subsidiaryId);
            }
          });

          console.log("subsidiariesByCountry", subsidiariesByCountry);

          // Identificar los botones específicos
          var addButton = document.getElementById("submachine_addedit");
          var removeButton = document.getElementById("submachine_remove");

          // Agregar eventos a los botones **solo si no han sido registrados**
          if (addButton) { //&& !addButton.dataset.eventAttached
            addButton.addEventListener('click', handleButtonClick);
            addButton.dataset.eventAttached = "true";  // Marcar que ya tiene evento
          }

          if (removeButton) { //&& !removeButton.dataset.eventAttached
            removeButton.addEventListener('click', handleButtonClick);
            removeButton.dataset.eventAttached = "true";  // Marcar que ya tiene evento
          }

          function handleButtonClick(event) {
            console.log("##############################");
            console.log("handleButtonClick", "click");
            
            var buttonId = event.target ? event.target.id : null;
            if (!buttonId) return;
            
          
            console.log("event.target.id", buttonId);

            var isVisible = buttonId === "submachine_addedit"; // true para agregar, false para eliminar
            

            // Obtener el país de la subsidiaria seleccionada
            var subsidiary = subsidiaries[subsidiaryID];
            if (!subsidiary) return;

            var countryCode = subsidiary.countryCode;
            console.log("countryCode :", countryCode);
            if (!countryCode) return;

            console.log("countryCode", countryCode);
            console.log("compareti 1 is active ----------------",subsidiaries[subsidiaryID].isActive);
            console.log("compareti 1 is isVisible ----------------",isVisible);

            if (isVisible && subsidiaries[subsidiaryID].isActive === isVisible) return;

            // Si la acción es eliminar
            if (!isVisible) {

              // Filtrar la subsidiaria eliminada
              subsidiariesByCountry[countryCode] = subsidiariesByCountry[countryCode].filter(function (id) {
                return id !== subsidiaryID;
              });

              // Si todavía quedan subsidiarias en el mismo país, **no ocultar el grupo**
              if (subsidiariesByCountry[countryCode].length > 0) {
                console.log("No se oculta el grupo del país porque hay más subsidiarias en", countryCode);
                return;
              }
            }

            // Crear jsonSubsidiaries solo con la subsidiaria seleccionada
            var jsonSubsidiaries = {};
            jsonSubsidiaries[subsidiaryID] = subsidiary;
            console.log("jsonSubsidiaries", jsonSubsidiaries);

            // Procesar los datos de campo
            var fieldData = assignFieldsToSubsidiaries(jsonSubsidiaries, entityFields, currentRCD.type);

            // Crear grupos y actualizar campos
            createGroups(null, fieldData, isClient);
            setCustpage(fieldData, isClient, currentRCD, isVisible);

            console.log("Botón presionado: " + buttonId.replace('submachine_', '') + ", Subsidiaria: ", subsidiaryID);

            // Actualizar el estado de la subsidiaria
            subsidiaries[subsidiaryID].isActive = isVisible;
            
            // Si se está agregando la subsidiaria, asegurar que se registre en subsidiariesByCountry
            if (isVisible) {
              // Agregar subsidiaria al país si no existe
              if (!subsidiariesByCountry[countryCode]) {
                subsidiariesByCountry[countryCode] = [];
              }
              if (subsidiariesByCountry[countryCode].indexOf(subsidiaryID) === -1) {
                subsidiariesByCountry[countryCode].push(subsidiaryID);
              }
            } 
            /*
            else {
              // Remover subsidiaria del país
              if (subsidiariesByCountry[countryCode]) {
                subsidiariesByCountry[countryCode] = subsidiariesByCountry[countryCode].filter(function (id) {
                  return id !== subsidiaryID;
                });

                // Si después de eliminar la subsidiaria no quedan más en ese país, eliminar la entrada
                if (subsidiariesByCountry[countryCode].length === 0) {
                  delete subsidiariesByCountry[countryCode];
                }
              }
            }

            */
            console.log("##############################");
          }

          console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");

        } catch (error) {
          log.error('Error', error);
        }
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
            type:"select",
            source:"customrecord_lmry_mx_country"
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
            isGeneral: false,
            fieldRecord: "custrecord_lmry_ef_sv_taxpayer_number",
            type:"text",
            setup:"custrecord_lmry_stf_sv_taxpayer_number",
            countries: {
              CL: ["customer", "vendor"],
              CO: ["customer", "vendor"],
              PA: ["customer", "vendor"],
              PE: ["customer", "vendor"],
              DO: ["customer", "vendor"],
              MX: ["customer", "vendor"],
              BO: ["customer", "vendor"],
              PY: ["customer", "vendor"],
            },
          },
          custentity_lmry_sv_taxpayer_type: {
            isGeneral: false,
            fieldRecord: "custrecord_lmry_ef_sv_taxpayer_type",
            type:"select",
            source: "customrecord_lmry_taxpayer_type_sv",
            countries: {
              CL: ["customer", "vendor"],
              CO: ["customer", "vendor"],
              PA: ["customer", "vendor"],
              PE: ["customer", "vendor"],
              DO: ["customer", "vendor"],
              MX: ["customer", "vendor"],
              BO: ["customer", "vendor"],
              PY: ["customer", "vendor"],
            },
          },
          custentity_lmry_actecon_sii_cl: {
            countries: {
              CL: ["customer"]
            },
            isGeneral: false,
            fieldRecord: "custrecord_lmry_ef_actecon_sii_cl",
            type:"select",
            source: "customrecord_lmry_actecon_sii_cl"
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
            type:"checkbox"
          },
          custentity_lmry_fiscal_responsability: {
            countries: {
              CO: ["customer"]
            },
            isGeneral: false,
            fieldRecord: "custrecord_lmry_ef_fiscal_responsability",
            type:"select",
            source: "customrecord_lmry_fiscal_responsability"
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
            type:"select",
            source: "customrecord_lmry_entity_type"
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
            type:"select",
            source: "customrecord_lmry_tipo_doc_iden",
            setup: "custrecord_lmry_stf_sunat_tipo_doc_id"
          },
          custentity_lmry_municcode: {
            countries: {
              CO: ["customer", "vendor"]
            },
            isGeneral: false,
            fieldRecord: "custrecord_lmry_ef_municcode",
            type:"text"
          },
          custentity_lmry_vinc_contri_resi_ext_cod: {
            countries: {
              PE: ["vendor"]
            },
            isGeneral: false,
            fieldRecord: "custrecord_lmry_ef_resi_ext_cod",
            type:"text"
          },

        }
      }

      return {
        HideColumn: HideColumn,
        HideSubTab: HideSubTab,
        HideEntityFields: HideEntityFields,
        saveEntityFields: saveEntityFields,
        showEntityFieldsIntercompany:showEntityFieldsIntercompany,
        changeSubsidiary: changeSubsidiary,
        getSubsidiaries:getSubsidiaries
      };

    });