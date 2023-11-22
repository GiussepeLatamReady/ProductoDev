/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||   This script for customer center (Time)                     ||
||                                                              ||
||  File Name: LMRY_BR_EI_Void_LBRY_V2.0.js              				||
||                                                              ||
||  Version   Date         Author        Remarks                ||
||  2.0     28 Jan 2021  LatamReady    Use Script 2.0           ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */
define(["N/record", "N/search", "N/runtime", "N/log", "N/transaction", "./LMRY_IP_libSendingEmailsLBRY_V2.0"],
  function (record, search, runtime, log, transaction, libraryEmail) {
    var LMRY_script = "LatamReady - BR EI Void Lbry";
    var FEAT_DPT = false;
    var FEAT_CLASS = false;
    var FEAT_LOC = false;
    var FEAT_APPROV_JOURNAL = false;
    var FEAT_SUBSIDIARIES = false;
    var FEAT_MULTIBOOK = false;
    var F_REVERSALVOIDING = false;
    var MEMO_JOURNAL = "Voided Latam - WHT"

    function voidBillCredit(idBillCredit) {
      var response = {
        idBillCredit: idBillCredit,
        standardvoid: false,
        idjournal: null,
        error: null
      };

      try {
        FEAT_DPT = runtime.isFeatureInEffect({ feature: "DEPARTMENTS" });
        FEAT_CLASS = runtime.isFeatureInEffect({ feature: "CLASSES" });
        FEAT_LOC = runtime.isFeatureInEffect({ feature: "LOCATIONS" });
        FEAT_APPROV_JOURNAL = runtime.getCurrentScript().getParameter({ name: 'CUSTOMAPPROVALJOURNAL' });
        FEAT_SUBSIDIARIES = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
        FEAT_MULTIBOOK = runtime.isFeatureInEffect({ feature: "MULTIBOOK" });
        F_REVERSALVOIDING = runtime.getCurrentScript().getParameter({ name: 'REVERSALVOIDING' });
        var columns = ["postingperiod", "accountingperiod.closed"];
        if (FEAT_SUBSIDIARIES == "T" || FEAT_SUBSIDIARIES == true) {
          columns.push("subsidiary");
        }

        var billCredit = search.lookupFields({
          type: "vendorcredit",
          id: idBillCredit,
          columns: columns
        });

        var idSubsidiary = billCredit["subsidiary"] || "";
        if (idSubsidiary) {
          idSubsidiary = billCredit["subsidiary"][0]["value"];
        }

        var isClosedPeriod = billCredit["accountingperiod.closed"];
        response['closedperiod'] = isClosedPeriod;
        log.error('[isClosedPeriod, F_REVERSALVOIDING]', [isClosedPeriod, F_REVERSALVOIDING].join(','));

        var taxResults = getTaxResults(idBillCredit);
        log.error("taxResults", JSON.stringify(taxResults));

        if (!isClosedPeriod && (F_REVERSALVOIDING == false || F_REVERSALVOIDING == 'F')) {
          transaction.void({
            type: transaction.Type.VENDOR_CREDIT,
            id: idBillCredit
          });
          response["standardvoid"] = true;
        } else {

          if (isThereCancellation(idBillCredit)) {
            response.error = "La transaccion ya esta anulada. El proceso se ha cancelado";
            return response;
          }
          var forms = getForms(idSubsidiary);
          log.error("forms", JSON.stringify(forms));
          var idJournal = createReverseJournal(idBillCredit, forms["journalForm"]);
          log.error("idJournal", idJournal);
          response["idjournal"] = idJournal;
          if (idJournal) {
            applyJournal(idBillCredit, idJournal);
            copyTaxResults(idJournal, taxResults);
          }

          for (var i = 0; i < taxResults.length; i++) {
            var id = taxResults[i]['id'];
            record.submitFields({
              type: 'customrecord_lmry_br_transaction',
              id: id,
              values: {
                'custrecord_lmry_base_amount': 0, //LATAM - BASE AMOUNT
                'custrecord_lmry_br_total': 0, //LATAM - TOTAL
                'custrecord_lmry_total_base_currency': 0,//LATAM - TOTAL BASE CURRENCY
                "custrecord_lmry_base_amount_local_currc": 0, //LATAM - BASE AMOUNT LOCAL CURRENCY
                "custrecord_lmry_amount_local_currency": 0,//LATAM - AMOUNT LOCAL CURRENCY
                "custrecord_lmry_gross_amt_local_curr": 0,//LATAM - GROSS AMT LOCAL CURRENCY
                "custrecord_lmry_discount_amt_local_curr": 0,//LATAM - DISCOUNT AMT LOCAL CURRENCY
                "custrecord_lmry_gross_amt": 0, //LATAM - GROSS AMOUNT ITEM
                "custrecord_lmry_discount_amt": 0 //LATAM - DISCOUNT AMOUNT
              }
            });
          }

          deleteOldJournalEntries(idBillCredit, idJournal);
        }

        log.error("response", JSON.stringify(response));
      } catch (err) {
        response['error'] = {
          name: err.name,
          message: err.message || err
        };
        log.error("[ voidBillCredit ]", err);
        libraryEmail.sendemail(' [ voidBillCredit ] ' + err, LMRY_script);

      }
      return response;
    }



    function getTransactionLines(idTransaction) {
      var lines = [];
      var columns = [
        "internalid",
        search.createColumn({
          name: "linesequencenumber",
          sort: search.Sort.ASC,
        }),
        "account",
        "creditfxamount",
        "debitfxamount",
        "memo",
        "entity",
        "signedamount"
      ];


      if (FEAT_DPT == 'T' || FEAT_DPT == true) {
        columns.push('department');
      }

      if (FEAT_CLASS == 'T' || FEAT_CLASS == true) {
        columns.push('class');
      }

      if (FEAT_LOC == 'T' || FEAT_LOC == true) {
        columns.push('location');
      }

      var search_lines = search.create({
        type: "transaction",
        filters:
          [
            ["internalid", "anyof", idTransaction], "AND",
            ["formulatext: {item.type.id}", "doesnotstartwith", "ShipItem"]
          ],
        columns: columns,
        settings: [search.createSetting({
          name: 'consolidationtype',
          value: 'NONE'
        })]
      });

      var results = search_lines.run().getRange(0, 1000);

      for (var i = 0; i < results.length; i++) {
        var internalid = results[i].getValue("internalid");
        var account = results[i].getValue("account");
        var credit = results[i].getValue("creditfxamount");
        var debit = results[i].getValue("debitfxamount");
        var amount = results[i].getValue("signedamount");
        amount = parseFloat(amount);

        var department;
        if (FEAT_DPT == 'T' || FEAT_DPT == true) {
          department = results[i].getValue('department');
        }

        var class_;
        if (FEAT_CLASS == 'T' || FEAT_CLASS == true) {
          class_ = results[i].getValue('class');
        }

        var location;
        if (FEAT_LOC == 'T' || FEAT_LOC == true) {
          location = results[i].getValue('location');
        }

        if (account && amount) {

          var line = {
            "internalid": internalid,
            "account": account,
            "department": department,
            "class": class_,
            "location": location
          }

          if (amount > 0) {
            line["debit"] = amount;
          } else {
            line["credit"] = Math.abs(amount);
          }

          lines.push(line);
        }
      }

      return lines;
    }

    function createReverseJournal(idBillCredit, journalForm) {
      var idjournal = "";
      if (journalForm) {
        var columns = [
          "entity", "subsidiary", "postingperiod",
          "exchangerate", "trandate", "currency", "accountingperiod.closed"
        ];

        if (FEAT_DPT == true || FEAT_DPT == 'T') {
          columns.push("department");
        }

        if (FEAT_CLASS == true || FEAT_CLASS == 'T') {
          columns.push("class");
        }

        if (FEAT_LOC == true || FEAT_LOC == 'T') {
          columns.push("location");
        }

        var transaction = search.lookupFields({
          type: "vendorcredit",
          id: idBillCredit,
          columns: columns
        });

        log.error('transaction', JSON.stringify(transaction));

        var vendor = transaction["entity"][0].value;
        var subsidiary = transaction["subsidiary"][0].value;
        var trandate = transaction["trandate"];
        var postingperiod = transaction["postingperiod"][0].value;
        var currency = transaction["currency"][0].value;
        var exchangerate = transaction["exchangerate"];

        var department = "";
        if (FEAT_DPT == 'T' || FEAT_DPT == true) {
          if (transaction["department"] && transaction["department"].length) {
            department = transaction["department"][0].value;
          }
        }

        var class_ = "";
        if (FEAT_CLASS == 'T' || FEAT_CLASS == true) {
          if (transaction["class"] && transaction["class"].length) {
            class_ = transaction["class"][0].value;
          }
        }

        var location = "";
        if (FEAT_LOC == 'T' || FEAT_LOC == true) {
          if (transaction["location"] && transaction["location"].length) {
            location = transaction["location"][0].value;
          }
        }


        //Se crea el Journal Entry
        var journalRecord = record.create({
          type: 'journalentry',
          isDynamic: true
        });

        journalRecord.setValue("customform", journalForm);
        journalRecord.setValue("subsidiary", subsidiary);

        journalRecord.setValue("trandate", new Date());
        journalRecord.setValue("currency", currency);
        journalRecord.setValue("exchangerate", exchangerate);
        journalRecord.setValue("memo", MEMO_JOURNAL);
        journalRecord.setValue("custbody_lmry_reference_transaction", idBillCredit);
        journalRecord.setValue("custbody_lmry_reference_transaction_id", idBillCredit);

        if (department) {
          journalRecord.setValue("department", department);
        }

        if (class_) {
          journalRecord.setValue("class", class_);
        }

        if (location) {
          journalRecord.setValue("location", location);
        }

        var lines = getTransactionLines(idBillCredit);
        log.error("transactionLines", JSON.stringify(lines));

        for (var i = 0; i < lines.length; i++) {

          var account = lines[i]["account"];
          var credit = lines[i]["credit"];
          var debit = lines[i]["debit"];

          var department_line = lines[i]["department"];
          var class_line = lines[i]["class"];
          var location_line = lines[i]["location"];


          journalRecord.selectNewLine({ sublistId: 'line' });
          journalRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: account });

          //Se invierten los montos de credit y debit.
          if (credit) {
            journalRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: credit });
          }

          if (debit) {
            journalRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: debit });
          }

          journalRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_lmry_pe_transaction_reference', value: idBillCredit });
          journalRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: vendor });
          if (department_line) {
            journalRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: department_line });
          }

          if (class_line) {
            journalRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: class_line });
          }

          if (location_line) {
            journalRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: location_line });
          }

          journalRecord.commitLine({ sublistId: 'line' });
        }


        if (FEAT_MULTIBOOK == true || FEAT_MULTIBOOK == 'T') {
          var books = getAccountingBooks(idBillCredit);
          log.error('books', JSON.stringify(books));

          var numJournalBooks = journalRecord.getLineCount({
            sublistId: "accountingbookdetail"
          });

          for (var i = 0; i < numJournalBooks; i++) {
            journalRecord.selectLine({ sublistId: 'accountingbookdetail', line: i });

            var bookId = journalRecord.getCurrentSublistValue({
              sublistId: "accountingbookdetail",
              fieldId: "bookid"
            });

            if (books[String(bookId)]) {
              journalRecord.setCurrentSublistValue({
                sublistId: "accountingbookdetail",
                fieldId: "exchangerate",
                value: books[String(bookId)]["exchangeRate"]
              });
            }
          }
        }

        idjournal = journalRecord.save({
          enableSourcing: true,
          ignoreMandatoryFields: true,
          disableTriggers: true
        });

        if (FEAT_APPROV_JOURNAL == true || FEAT_APPROV_JOURNAL == 'T') {
          record.submitFields({
            type: "journalentry",
            id: idjournal,
            values: {
              "approvalstatus": 2
            },
            options: {
              disableTriggers: true
            }
          });
        }
      }

      return idjournal;
    }

    function getForms(idSubsidiary) {
      var forms = {};
      var filters = [
        ['isinactive', 'is', 'F']
      ];
      if (idSubsidiary) {
        filters.push("AND", ["custrecord_lmry_setuptax_subsidiary", "anyof", idSubsidiary])
      }

      var search_setup = search.create({
        type: 'customrecord_lmry_setup_tax_subsidiary',
        filters: filters,
        columns: ['internalid', 'custrecord_lmry_setuptax_form_journal']
      });

      var results = search_setup.run().getRange(0, 10);
      if (results && results.length) {
        forms['journalForm'] = results[0].getValue('custrecord_lmry_setuptax_form_journal') || '';
      }

      return forms;
    }

    function getAccountingBooks(idTransaction) {
      var books = {};

      var search_books = search.create({
        type: "transaction",
        filters:
          [
            ["internalid", "anyof", idTransaction], "AND",
            ["mainline", "is", "T"]
          ],
        columns:
          [
            search.createColumn({
              name: "internalid",
              sort: search.Sort.ASC
            }),
            search.createColumn({
              name: "accountingbook",
              join: "accountingTransaction"
            }),
            search.createColumn({
              name: "exchangerate",
              join: "accountingTransaction"
            })
          ]
      });


      var results = search_books.run().getRange(0, 1000);
      for (var i = 0; i < results.length; i++) {
        var bookId = results[i].getValue({ name: "accountingbook", join: "accountingTransaction" });
        var exchangeRate = results[i].getValue({ name: "exchangerate", join: "accountingTransaction" });
        books[String(bookId)] = {
          "exchangeRate": exchangeRate
        }

      }

      return books;
    }

    function applyJournal(idBillCredit, idJournal) {

      var transactionRecord = record.load({
        type: "vendorcredit",
        id: idBillCredit,
        isDynamic: true
      });

      var total = transactionRecord.getValue("total");
      var applied = transactionRecord.getValue("applied");
      var unapplied = transactionRecord.getValue("unapplied");

      log.error("total", total);
      log.error("applied", applied);
      log.error("unapplied", unapplied);

      var numApply = transactionRecord.getLineCount({
        sublistId: 'apply'
      });

      for (var i = 0; i < numApply; i++) {
        transactionRecord.selectLine({ sublistId: "apply", line: i });
        transactionRecord.setCurrentSublistValue({
          sublistId: 'apply',
          fieldId: 'apply',
          line: i,
          value: false
        });
      }

      var applied = transactionRecord.getValue("applied");
      var unapplied = transactionRecord.getValue("unapplied");

      log.error("applied", applied);
      log.error("unapplied", unapplied);

      for (var i = 0; i < numApply; i++) {
        transactionRecord.selectLine({ sublistId: "apply", line: i });

        var lineId = transactionRecord.getSublistValue({
          sublistId: "apply",
          fieldId: "internalid",
          line: i
        });

        if (Number(lineId) == Number(idJournal)) {
          transactionRecord.setCurrentSublistValue({
            sublistId: 'apply',
            fieldId: 'apply',
            line: i,
            value: true
          });

          transactionRecord.setCurrentSublistValue({
            sublistId: 'apply',
            fieldId: 'amount',
            line: i,
            value: parseFloat(total)
          });

        }
      }

      transactionRecord.save({
        enableSourcing: true,
        ignoreMandatoryFields: true,
        disableTriggers: true
      });
    }

    function deleteOldJournalEntries(idTransaction, idCurrentJournal) {
      var filters = [
        ["custbody_lmry_reference_transaction_id", "equalto", idTransaction], "AND",
        ["memomain", "startswith", MEMO_JOURNAL]
      ];

      if (idCurrentJournal) {
        filters.push("AND", ["internalid", "noneof", idCurrentJournal]);
      }

      var search_journals = search.create({
        type: "journalentry",
        filters: filters,
        columns: ["internalid"]
      });

      var oldJournals = [];

      var results = search_journals.run().getRange(0, 1000);
      if (results && results.length) {
        for (var i = 0; i < results.length; i++) {
          var id = results[i].getValue("internalid");
          log.error("id", id);
          if (id && oldJournals.indexOf(Number(id)) == -1) {
            oldJournals.push(Number(id));
            record.delete({
              type: "journalentry",
              id: id
            });
          }
        }
      }

      log.error("oldJournals", oldJournals);
    }

    function getTaxResults(recordId) {
      var taxResults = [];
      if (recordId) {
        var searchTaxResults = search.create({
          type: 'customrecord_lmry_br_transaction',
          filters: [
            ['custrecord_lmry_br_transaction', 'anyof', recordId]
          ],
          columns: ['internalid', 'custrecord_lmry_tax_type']
        });

        var results = searchTaxResults.run().getRange(0, 1000);
        if (results) {
          for (var i = 0; i < results.length; i++) {
            taxResults.push({
              taxtype: results[i].getValue('custrecord_lmry_tax_type'),
              id: results[i].getValue('internalid')
            });
          }
        }
      }
      return taxResults;
    }

    function copyTaxResults(idTransaction, taxResults) {
      for (var i = 0; i < taxResults.length; i++) {
        var taxtype = taxResults[i]['taxtype'];
        if (Number(taxtype) == 4) { //Impuesto
          var id = taxResults[i]['id'];
          var taxResultObj = record.copy({
            type: "customrecord_lmry_br_transaction",
            id: id
          });
          taxResultObj.setValue('custrecord_lmry_br_transaction', idTransaction);
          taxResultObj.setValue('custrecord_lmry_br_related_id', parseInt(idTransaction));
          taxResultObj.save({
            ignoreMandatoryFields: true,
            disableTriggers: true,
            enableSourcing: true
          });
        }
      }
    }


    function isThereCancellation(idBillCredit){

      var idJournal = [];
      var journalentrySearchObj = search.create({
        type: "journalentry",
        filters:
        [
           ["type","anyof","Journal"], 
           "AND", 
           ["mainline","is","T"], 
           "AND", 
           ["custbody_lmry_reference_transaction_id","equalto",idBillCredit],
           "AND",
           ["memomain","startswith","Voided Latam - WHT"]
        ],
        columns:
        [
           search.createColumn({name: "internalid", label: "Internal ID"})
        ]
     });

     journalentrySearchObj.run().each(function(result){              
          idJournal.push(result.getValue("internalid"));
       });

       return idJournal.length != 0;
  }

    return {
      voidBillCredit: voidBillCredit
    }

  });