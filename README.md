# [LatamReport CO : Proceso de conversión de retenciones de cabecera a retenciones de línea](https://docs.google.com/document/d/1P9MjA5JI8RvMxJUlVrZL8JGWRH1uMkadaboHXIdARrc/edit)


## Description of the Requirement

 En Colombia las retenciones se hacen por 2 procesos: retenciones por cabecera y retenciones por línea. Las retenciones de línea generan un tax result que se usa en los reportes de medios magnéticos. De estos tax result se obtiene el concepto de la cuenta, el tipo de retención y el monto de la retención. Las retenciones de cabecera no generan tax result y todo el monto de la retención recae en el WHT code que esté asociado a la transacción. Esto es un problema al momento de querer obtener los conceptos de las cuentas asociadas.

## Description of the solution


## Scripts
+ Create

    + LMRY_CO_Main_WHT_calculation_auto_MPRD_V2.1.js
        + Name: LatamReady - CO Header WHT Calc auto MPRD
        + scriptMapReduce: customscript_lmry_co_head_wht_auto_mprd
        + deployMapReduce: customdeploy_lmry_co_head_wht_calc_mprd
            log: custscript_lmry_co_head_wht_auto_file

+ Update
    + LMRY_CO_Header_WHT_calculation_URET_V2.1.js
    + LMRY_CO_Header_WHT_calculation_STLT_LOG_V2.1.js
    + LMRY_CO_Header_WHT_calculation_CLNT_V2.1.js

+ Update fix
    + LMRY_CO_Header_WHT_calculation_STLT_LOG_V2.1.js
    + LMRY_CO_Header_WHT_calculation_Auto_MPRD_V2.1.js
    + LMRY_CO_Header_WHT_calculation_MPRD_V2.1.js
    + LMRY_CO_Header_WHT_calculation_STLT_V2.1.js
        
## Scripts resumidos
    Librerias
    LMRY_CO_Header_WHT_calculation_LBRY_V2.1.js

    Scrits
    LMRY_CO_Header_WHT_calculation_CLNT_V2.1.js
    LMRY_CO_Header_WHT_calculation_MPRD_V2.1.js
        Name:
        Parametros:
        User: custscript_lmry_co_head_wht_calc_user
        State: custscript_lmry_co_head_wht_calc_state
    LMRY_CO_Header_WHT_calculation_STLT_LOG_V2.1.js
    LMRY_CO_Header_WHT_calculation_STLT_V2.1.js
    LMRY_CO_Header_WHT_calculation_URET_V2.1.js

    
+ Update

+ Delete
## Espejos
    SMC_CO_Header_WHT_calculation_STLT_V2.1.js
    SMC_CO_Header_WHT_calculation_CLNT_V2.1.js
    SMC_CO_Header_WHT_calculation_URET_V2.1.js
    SMC_CO_Header_WHT_calculation_LBRY_V2.1.js
    SMC_CO_Header_WHT_calculation_MPRD_V2.1.js
    SMC_CO_Header_WHT_calculation_STLT_LOG_V2.1.js
## Records
+ Create
    Name: LatamReady - WHT Calc CO Header Log
    id: customrecord_lmry_co_head_wht_cal_log
        Fields
            Subsidiary	                    custrecord_lmry_co_hwht_log_subsi	        List/Record	Subsidiary	 	No
 	        Process	                        custrecord_lmry_co_hwht_log_process	        Free-Form Text	 	 	    No
            withholding calculation type	custrecord_lmry_co_hwht_log_whttype	        Free-Form Text	 	 	    Yes
            Period	                        custrecord_lmry_co_hwht_log_period	        Free-Form Text	 	 	    Yes
            User Responsible	            custrecord_lmry_co_hwht_log_employee	    List/Record	Employee	 	Yes
            State	                        custrecord_lmry_co_hwht_log_state	        Free-Form Text	 	 	    Yes
            Execution Type	                custrecord_lmry_co_hwht_log_exect	        Free-Form Text	 	 	    Yes
            Process details	                custrecord_lmry_co_hwht_log_details	        Long Text	 	 	        No
            Transactions	                custrecord_lmry_co_hwht_log_transactions	Long Text	 	 	        No
        
+ Update
    + Name: LatamReady - TAX Results
    + id: customrecord_lmry_br_transaction
        + subtab : Colombia
            + Latam - Retention Applied
                id:custrecord_lmry_co_wht_applied - list/record transaction
            + Latam - Date Retention Applied
                id:custrecord_lmry_co_date_wht_applied
            + Latam - Account Exogenous Concept
                id:custrecord_lmry_co_acc_exo_concept

    + Name: LatamReady - WHT Type
    + Id: customrecord_lmry_wht_type
        Create: WHT Subtype
                custrecord_lmry_wht_subtype
    

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

























