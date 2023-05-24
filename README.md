## Automatic Set & Advanced Flow (D0952)


## Script relacionados


## Scripts Modificados


## Anotaciones 

et setting = [task.TaskType.MAP_REDUCE, 'customscript_lmry_invoicing_populate_mr', 'customscript_lmry_purchasing_populate_mr', 'customscript_lmry_fillrcpt_populate_mr'];
---verificar el ids de los scripts 
## Dcumentacion modificado







1	Rd_Transaction	    customerpayment;Payment	
2	Rd_Transaction		cashsale;Cash Sale	
3	Rd_Transaction		customtransaction_lmry_payment_complemnt;Complemento de Pago	
4	Rd_Transaction		vendorcredit;Bill Credit	
5	Rd_Transaction		invoice;Invoice	
6	Rd_Transaction		itemreceipt;Item Receipt	
7	Rd_Transaction		creditmemo;Credit Memo	
8	Rd_Transaction		itemfulfillment;Item Fulfillment	
9	Rd_Transaction		vendorbill;Bill



## Preguntas:
runtime.envType == 'SANDBOX' ??? iría
Include Paid Invoices

featureAdvanced
	LATAM EI MODULE (AUTOMATIC GENERATE AND SEND) -> para que se utiliza y porque busca al record LatamReady - EI Package 
	Linea 819
https://tstdrv1774174.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=2288&id=173 


// FEATURE RETENCIONES

var brRetenciones = libraryFeature.getAuthorization(416, licenses);
var coRetenciones = libraryFeature.getAuthorization(27, licenses);
var coRetencionesLines = libraryFeature.getAuthorization(340, licenses);


porque esta dentro de if(RD_Country){if (type_transaction == 'transaction')}

Line: 949 // BUSQUEDA AUXILIAR SIN MAINLINE PARA EL DESCUENTO -> Se utiliza
Objetos
	jsonDiscount[idInvoiceDiscount] = idInvoiceDiscount;
	
	
Line: 1400 /	libraryFeature.getAuthorization(900, licenses


## Proceso de desarrollo

Tener en cuenta que por comododidad tendras la funcion de traduccion en el propio stlt

cambiar nSearch por search




