# [ACCES /CL-  Change currency UF CSV](https://docs.google.com/document/d/1CMGQxfk_lk7Q7p5gNY0_5bHEaCxUI3JtsoOpovF0Q3o/edit)


## Description of the Requirement

Se requeire que el proceso tambien funcione en csv

Chile

## Description of the solution


## Scripts
+ Create
    + Name:     LR AR Wht Send Email
    + File:     LMRY_AR_Wht_Send_Email_STLT_V2.1.js
    + idScript: customscript_lmry_ste_ar_wht_se_stlt
    + idDeploy: customdeploy_lmry_ste_ar_wht_se_stlt

    + Name:     LR AR Wht Send Email Log
    + File:     LMRY_AR_Wht_Send_Email_STLT_Log_V2.1.js
    + idScript: customscript_lmry_ste_ar_wht_se_log_stlt
    + idDeploy: customdeploy_lmry_ste_ar_wht_se_log_stlt

    + Name:     LR AR Wht Send Email
    + file:     LMRY_AR_Wht_Send_Email_MPRD_V2.1.js
    + idScript: customscript_lmry_ste_ar_wht_se_mprd
    + idDeploy: customdeploy_lmry_ste_ar_wht_se_mprd
        params:
        +   user: custscript_lmry_ste_ar_wht_se_user
        +   state: custscript_lmry_ste_ar_wht_se_state

    + Name:     LR AR Wht Send Email
    + file:     LMRY_AR_Wht_Send_Email_URET_V2.1.js
    + idScript: customscript_lmry_ste_ar_wht_se_uret
    + idDeploy: customdeploy_lmry_ste_ar_wht_se_uret

    + Name:
    + file: LMRY_AR_Wht_Send_Email_CLNT_V2.1.js 
    + idScript: --
    + idDeploy: --


+ Update

+ Delete


## Records Configuration
+ Create
    Name: LR AR Wht Send Email
    id: customrecord_lmry_ste_ar_wht_send
        Fields
            Subsidiary	                    custrecord_lmry_ste_ar_wht_se_subsi	        List/Record	Subsidiary	 	Yes
 	        Vendor	                        custrecord_lmry_ste_ar_wht_se_vendor	    List/Record	Vendor	 	    Yes
            email	                        custrecord_lmry_ste_ar_wht_se_email	        Free-Form Text	 	 	    Yes
            Date From	                    custrecord_lmry_ste_ar_wht_se_dfrom	        Free-Form Text	 	 	    No
            Date To	                        custrecord_lmry_ste_ar_wht_se_dto	        Free-Form Text	 	 	    No
            Responsible user	            custrecord_lmry_ste_ar_wht_se_employee	    List/Record	Employee	 	No
            Status	                        custrecord_lmry_ste_ar_wht_se_status	    List record LR Process Status	 	 	    Yes
            Mailing details	                custrecord_lmry_ste_ar_wht_se_details	    Long Text	 	 	        No
            Bill Payments	                custrecord_lmry_ste_ar_wht_se_payments	    Long Text	 	 	        No
        
    
+ Update
    LR AR Withholding Certificate
        create field
            Latam - AR File ID - custrecord_lmry_ste_ar_wht_cert_file_id - free form text
            Latam - AR Was Sent? - custrecord_lmry_ste_ar_was_sent - checkbox

## Fields
+ Create
+ Update 
+ Delete

## Features
+ Create
+ Involved
+ Delete

## Bundles involved


## Observations
 

## SmartReady

+ Descripcion:

    + Se modificó el proceso para que el desarrollo soporte ejecucion por csv.

+ Scripts modificados:

    + LMRY_CreditMemoURET_V2.0.js
    + LMRY_InvoiceURET_V2.0.js
    + LMRY_RecordSalesURET_V2.0.js

+ Documento funcional ( LatamReady - BR WHT Reclass Customer Payment)

    + [LatamReady - CL Change Currency UF](https://docs.google.com/presentation/d/1Nhre8mz61wOCHXLHcROws2d8vQ_nfX_Lg7TAmGtn9J8/edit#slide=id.gcbabfb6a1e_0_30)

+ Pruebas Internas:

    + [C1124 PRUEBAS BASICAS DESARROLLO - QA](https://docs.google.com/spreadsheets/d/1VlV1m9wqrZc1934xInAfaDBUiQO-1WA_TAuX9KHwXzg/edit?gid=0#gid=0)

+ Bundles:

    + 35754 (Development)
    + 37714 (Production)























