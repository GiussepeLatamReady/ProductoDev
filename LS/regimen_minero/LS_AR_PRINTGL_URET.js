/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([], function () {
    function beforeLoad(context) {
        const form = context.form;
        const record = context.newRecord;
        const evento = context.type;

        if(evento != 'view'){
          return true;
        }

        let country = record.getValue('custbody_lmry_subsidiary_country');

        if(country != '11'){
          return true;
        }

        const sublistApply = record.getSublist({
            sublistId: "apply"
        });
        form.addField({
            id: "custpage_ar_aux_client",
            label: "AR Aux Client",
            type: "inlinehtml"
        }).defaultValue = `
            <script>function viewPrintModal(){
                require([
                    "N/currentRecord",
                    "N/url",
                    "N/runtime",
                    "N/search",
                    "N/log"
                ], function(currentRecord, url, runtime, search, log) {
                    try {
                        var RECORD_OBJ = currentRecord.get();
                        var id = RECORD_OBJ.id;
                        var url_2 = "".concat(url.resolveScript({
                            scriptId: "customscript_ls_ar_wht_gl_impact_stlt",
                            deploymentId: "customdeploy_ls_ar_wht_gl_impact_stlt",
                            returnExternalUrl: false
                        }), "&transactionId=").concat(id);
                        var array_encabezado = [];
                        var array_tabla = [];
                        array_encabezado.push({
                            title: "Encabezado 1",
                            content: "contenido 1"
                        });
                        var array_book_ID = [];
                        var array_book_NN = [];
                        var featureMB = runtime.isFeatureInEffect({
                            feature: "MULTIBOOK"
                        });
                        if (featureMB === "F" || featureMB === false) {
                            array_book_ID.push(0);
                            array_book_NN.push("LOCAL");
                        } else {
                            var transaction_Book = search.create({
                                type: "transaction",
                                filters: [
                                    [
                                        "accountingtransaction.accounttype",
                                        "noneof",
                                        "@NONE@"
                                    ],
                                    "AND",
                                    [
                                        "accountingtransaction.amount",
                                        "notequalto",
                                        "0.00"
                                    ],
                                    "AND",
                                    [
                                        "internalidnumber",
                                        "equalto",
                                        RECORD_OBJ.id
                                    ]
                                ],
                                columns: [
                                    search.createColumn({
                                        name: "type",
                                        summary: "COUNT",
                                        label: "Type"
                                    }),
                                    search.createColumn({
                                        name: "accountingbook",
                                        join: "accountingTransaction",
                                        summary: "GROUP",
                                        label: "Accounting Book"
                                    })
                                ]
                            });
                            var resul_book = transaction_Book.run().getRange({
                                start: 0,
                                end: 1000
                            });
                            resul_book.forEach(function(resul_bookItem) {
                                var colFields = resul_bookItem.columns;
                                var book_ID = resul_bookItem.getValue(colFields[1]);
                                var book_NN = resul_bookItem.getText(colFields[1]);
                                array_book_ID.push(book_ID);
                                array_book_NN.push(book_NN);
                            });
                        }
                        var orden_array = array_book_ID.slice(0).sort();
                        orden_array.forEach(function(orden_arrayItem) {
                            var array_position = array_book_ID.indexOf(orden_arrayItem);
                            var htmlLink1 = '<a  target ="_blank" style="color:#1A5276;" href='.concat(url_2, "&multibook=").concat(array_book_ID[array_position], "&formato=1") + ">Click</a>";
                            var htmlLink3 = '<a  target ="_blank" style="color:#1A5276;" href='.concat(url_2, "&multibook=").concat(array_book_ID[array_position], "&formato=2") + ">Click</a>";
                            array_tabla.push({
                                encabezado: array_book_ID[array_position],
                                namebook: array_book_NN[array_position],
                                contentPDF: [
                                    htmlLink1
                                ],
                                contentXLS: [
                                    htmlLink3
                                ]
                            });
                        });
                        var window_popup = {
                            widht: 500,
                            height: 330
                        };
                        var popupHtml = '            <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.19/css/jquery.dataTables.css">            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">            <div class="container">              <div class="row">                <dl class="row ml-2" style="font-size:13px">                </dl>              </div>              <div class="row">                <div class="col">                  <div style="color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver">                    Select the link to print the Accounting Books.                  </div>                  <br></br>                  <table class="table table-sm table-bordered" style="font-size:13px;">                    <tr>                      <th height="010" bgcolor="#F2F4F4" style="color:#616A6B" class="thead-light" width="40" scope="row" align="middle">#Number</th>                      <td width="150">Accounting Book</td>                      <td width="090">PDF</td>                                            <td width="090">XLS</td>                    </tr>                    '.concat(array_tabla.map(function(item) {
                            return '                    <tr>                      <th height="10" bgcolor="#F2F4F4" style="color:#616A6B" class="thead-light" width="40" scope="row" align="middle">'.concat(item.encabezado, '</th>                      <td width="150">').concat(item.namebook, '</td>                      <td width="090">').concat(item.contentPDF, '</td>                                            <td width="090">').concat(item.contentXLS, "</td>                    </tr>                    ");
                        }).join(""), "                  </table>                </div>              </div>            </div>          ");
                        Ext.create({
                            xtype: "window",
                            width: window_popup.widht,
                            height: window_popup.height,
                            title: "GL Impact",
                            modal: true,
                            html: popupHtml
                        }).show();
                    } catch (err) {
                        console.error(err);
                    }
                });


            }</script>
        `;
        form.addButton({
            id: "custpage_ar_print_wht",
            label: "AR Print WHT",
            functionName: "viewPrintModal"
        });
    }

    // function beforeSubmit(context) {}

    // function afterSubmit(context) {}

    return {
        beforeLoad: beforeLoad
        // beforeSubmit: beforeSubmit,
        // afterSubmit: afterSubmit
    };
});
