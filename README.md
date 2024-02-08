# [LatamReport CO : Proceso de conversión de retenciones de cabecera a retenciones de línea](https://docs.google.com/document/d/1P9MjA5JI8RvMxJUlVrZL8JGWRH1uMkadaboHXIdARrc/edit)


## Description of the Requirement

 En Colombia las retenciones se hacen por 2 procesos: retenciones por cabecera y retenciones por línea. Las retenciones de línea generan un tax result que se usa en los reportes de medios magnéticos. De estos tax result se obtiene el concepto de la cuenta, el tipo de retención y el monto de la retención. Las retenciones de cabecera no generan tax result y todo el monto de la retención recae en el WHT code que esté asociado a la transacción. Esto es un problema al momento de querer obtener los conceptos de las cuentas asociadas.

## Description of the solution


## Scripts
+ Create

    + LMRY_CO_Header_WHT_calculation_STLT_LBRY_V2.1.js
    + LMRY_CO_Header_WHT_calculation_STLT_V2.1.js
        + Name: LatamReady - CO Header WHT calc STLT
        + Id: _lmry_co_head_wht_calc_stlt

    + LMRY_CO_Header_WHT_calculation_CLNT_LBRY_V2.1.js
    + LMRY_CO_Header_WHT_calculation_CLNT_V2.1.js

    + LMRY_CO_Header_WHT_calculation_URET_V2.1.js
        + Name: LatamReady - CO Header WHT Calc URET
        + Id: _lmry_co_head_wht_calc_uret

    + LMRY_CO_Header_WHT_calculation_LBRY_V2.1.js
    + LMRY_CO_Header_WHT_calculation_MPRD_V2.1.js
        + scriptMapReduce: customscript_lmry_co_head_wht_calc_mprd
        + deployMapReduce: customdeploy_lmry_co_head_wht_calc_mprd
        + parameters: 
            + User: custscript_lmry_co_head_wht_calc_user
            + State: custscript_lmry_co_head_wht_calc_state

    + LMRY_CO_Header_WHT_calculation_STLT_LOG_LBRY_V2.1.js
    + LMRY_CO_Header_WHT_calculation_STLT_LOG_V2.1.js
        + Name: LatamReady - CO Header WHT calc STLT Log
        + Id: _lmry_co_head_calc_stlt_log
    
+ Update

+ Delete

## Records
+ Create
    Name: LatamReady - WHT Calc CO Header Log
    id: customrecord_lmry_co_head_wht_cal_log
        Fields
            Subsidiary	        custrecord_lmry_co_hwht_log_subsi	    List/Record	Subsidiary	 	        Yes
            Process          	custrecord_lmry_co_hwht_log_process	    text	 	                        Yes
            Wht Calculation type custrecord_lmry_co_hwht_log_whttype	text	 	                        Yes
            Period Type         custrecord_lmry_co_hwht_log_period_type	    text	 	                        Yes
            Period          	custrecord_lmry_co_hwht_log_period	    List/Record	Accouting period	 	Yes
            Start Date	        custrecord_lmry_co_hwht_log_start_date	Date	 	 	                    No
            End Date	        custrecord_lmry_co_hwht_log_end_date	    Date	 	 	                    No
            Employee	        custrecord_lmry_co_hwht_log_employee	    List/Record	Employee	 	        No
            State	            custrecord_lmry_co_hwht_log_state	    Free-Form Text	 	 	            Yes
            Execution Type   custrecord_lmry_co_hwht_log_exect       text
            Process details 	custrecord_lmry_co_hwht_log_details	    Long Text	 	 	                No
        
+ Update
    

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

























