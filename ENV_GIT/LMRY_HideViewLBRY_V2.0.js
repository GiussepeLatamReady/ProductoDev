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

    function HideEntityFields(OBJ_FORM, Country_Hide, Type, licenses) {

      // log.error('HideEntityFields OBJ_FORM', OBJ_FORM);
      // log.error('HideEntityFields Country_Hide', Country_Hide);
      // log.error('HideEntityFields Type', Type);
      // if(Country_Hide == ' ' || Country_Hide == null || Country_Hide == ''){
      //   Country_Hide = 'Vacio';
      // }
      // log.error('HideEntityFields',Country_Hide);

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

      var filters = new Array();

      filters[0] = search.createFilter({
        name: 'custrecord_lmry_hide_section',
        operator: search.Operator.ANYOF,
        values: [1]
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
        values: [1]
      });

      filters2[1] = search.createFilter({
        name: 'isinactive',
        operator: search.Operator.IS,
        values: ['F']
      });

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

          if (list_pais.indexOf(namefield) == -1) {
            list_hide.push(namefield);
          }
        }
        //log.error('list_hide', list_hide);
      }


      for (var p = 0; p < list_hide.length; p++) {

        if (list_hide[p] != null && list_hide[p] != '') {

          var field = OBJ_FORM.getField({
            id: list_hide[p]
          });
          try {
            field.updateDisplayType({
              displayType : serverWidget.FieldDisplayType.HIDDEN
            });
          } catch (err) {
            //log.error('se callo script', list_hide[p] + ',' + err);
          }
        }
      }
    }

    return {
      HideColumn: HideColumn,
      HideSubTab: HideSubTab,
      HideEntityFields: HideEntityFields
    };

  });