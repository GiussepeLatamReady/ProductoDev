# [MX - Reversa Contable de Docs anulados incorrectamente (2da versión) C1010 - 2](https://docs.google.com/document/d/153LO2A7RervBt7Hn1hrgDwuAZyc2SxwPr-XQuU6sIHg/edit)


## Description of the Requirement

Se realizara la reversa contable para la anulacion del credit memo y custoemr payment

## Description of the solution


## Scripts
+ Create

    + Librerias
        + LMRY_MX_Reverse_Cancellation_CLNT_LBRY_V2.1.js
        + LMRY_MX_Reverse_Cancellation_LBRY_V2.1.js
        + LMRY_MX_Reverse_Cancellation_Log_LBRY_V2.1.js
        + LMRY_MX_Reverse_Cancellation_MPRD_LBRY_V2.1.js

    + LR - MX Reverse Cancellations Log STLT - Released
        + id: _lmry_mx_rever_canc_log_stlt
        + File: LMRY_MX_Reverse_Cancellation_Log_STLT_V2.1.js

    + LR - MX Reverse Cancellations MPRD - Not sheduled
        + id: _lmry_mx_rever_canc_mprd
        + File: LMRY_MX_Reverse_Cancellation_MPRD_V2.1.js
        + Parameters
            User	custscript_lmry_mx_rcd_user	    Free-Form Text	 	 
            State	custscript_lmry_mx_rcd_state	Free-Form Text

    + LR - MX Reverse Cancellations STLT - Released
        + id: _lmry_mx_rever_canc_stlt
        + File: LMRY_MX_Reverse_Cancellation_STLT_V2.1.js

    + LMRY_MX_Reverse_Cancellation_CLNT_V2.1.js

+ Update
    LMRY_VoidedCreditMemo_LBRY_V2.0.js
    LMRY_MX_EI_VOID_STLT.js

+ Delete

## Records
+ Create
    + LR - MX Canceled Documents Reversed Log
        + id: customrecord_lmry_mx_rever_cancel_log
        + Fields:
            Subsidiary	        custrecord_lmry_mx_rcd_log_subsi	    List/Record	Subsidiary	 	        Yes
 	        Transaction type	custrecord_lmry_mx_rcd_log_type	        List/Record	Transaction Type	 	Yes
 	        Account	            custrecord_lmry_mx_rcd_log_account	    List/Record	Account	 	            Yes
 	        Start Date	        custrecord_lmry_mx_rcd_log_start_date	Date	 	 	                    No
 	        End Date	        custrecord_lmry_mx_rcd_log_end_date	    Date	 	 	                    No
 	        Employee	        custrecord_lmry_mx_rcd_log_employee	    List/Record	Employee	 	        No
 	        State	            custrecord_lmry_mx_rcd_log_state	    Free-Form Text	 	 	            Yes
 	        Detalle del proceso	custrecord_lmry_mx_rcd_log_details	    Long Text	 	 	                No
 	        Transactions	    custrecord_lmry_mx_rcd_log_transact	    Long Text	 	 	                No

## Fields
+ Create
+ Update 
+ Delete

## Features
+ Create
+ Involved
+ Delete

## Bundles involved
+ 37714 (production environment)
+ 35754 (development environment)

## Observations

va pasr por el bundle de facturacion EI all


*que transaccion va referenciar la transaccion que revierte la anulacion
* Se deben respetar las cuenta de la transaccion principal

LMRY_MX_Reverse_Cancellation_LBRY_V2.1.js
LMRY_MX_Reverse_Cancellation_CLNT_LBRY_V2.1.js
























