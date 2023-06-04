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


## Script y demployments

LMRY_AdvanceFlow_STLT_V2.1.js 
	(ID: _lmry_ste_advanceflow_stlt):
LMRY_AdvanceFlow_CLNT_V2.1.js (ID: _lmry_ste_advanceflow_clnt): 
LMRY_AdvanceFlow_Log_STLT_V2.1.js (ID: _lmry_ste_advanceflow_log_stlt): 
LRMY_AdvanceFlowOnSales_MPRD_V2.1.js (ID:  _lmry_ste_af_sales_mprd)
	idDeploy:
		BR: _lmry_ste_af_sales_mprd_${id}:
LMRY_AdvanceFlowOnPurchase_MPRD_V2.1.js (ID: _lmry_ste_af_purchase_mprd): 
	idDeploy:	
		BR: _lmry_ste_af_prchs_mprd_${id}:
LMRY_AdvanceFlowOnItemFulfillment_MPRP_V2.1.js (ID: _lmry_ste_af_item_mprd):
	idDeploy:	
		BR: _lmry_ste_af_item_mprd_${id}:
LMRY_AdvanceFlow_LBRY_V2.1.js: 


# ALERT
var transIDs = idTransacciones.slice(0, idTransacciones.length - 1); ESTO PODRIA CAMBIA
	A var transIDs = idTransacciones.slice(0, idTransacciones.length);



## Proceso de desarrolllo 

features
	LOCALIZATION
	AUTOMATIC TRAN ID (A/R)


STLT

MPRD
	No se realiza automatic setting
	Campos de facturacion : E-Document Template y E-Document Sending Methods -> Si existe template y sending method se cambio el estado For generation
	Se cambia el valor de : Latam - EI Automatic
