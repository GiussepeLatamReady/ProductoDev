# [MX - Reversa Contable de Docs anulados incorrectamente (2da versión) C1010 - 2]()


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

    + LR - MX Reverse Cancellations Log STLT
        + id: _lmry_mx_rever_canc_log_stlt
        + File: LMRY_MX_Reverse_Cancellation_Log_STLT_V2.1.js

    + LR - MX Reverse Cancellations MPRD
        + id: _lmry_mx_rever_canc_mprd
        + File: LMRY_MX_Reverse_Cancellation_MPRD_V2.1.js

    + LR - MX Reverse Cancellations STLT
        + id: _lmry_mx_rever_canc_stlt
        + File: LMRY_MX_Reverse_Cancellation_STLT_V2.1.js

    + LMRY_MX_Reverse_Cancellation_CLNT_V2.1.js

+ Update

+ Delete

## Records
+ Create
    + LR - MX Canceled Documents Reversed Log
        + id: customrecord_lmry_mx_rever_cancel_log
        + Fields:
            Subsidiary	        custrecord_lmry_mx_rcd_log_subsi	        List/Record	Subsidiary	 	        Yes
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

























