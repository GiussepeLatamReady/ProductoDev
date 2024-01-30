# [LatamReport CO : Proceso de conversión de retenciones de cabecera a retenciones de línea](https://docs.google.com/document/d/1P9MjA5JI8RvMxJUlVrZL8JGWRH1uMkadaboHXIdARrc/edit)


## Description of the Requirement

 En Colombia las retenciones se hacen por 2 procesos: retenciones por cabecera y retenciones por línea. Las retenciones de línea generan un tax result que se usa en los reportes de medios magnéticos. De estos tax result se obtiene el concepto de la cuenta, el tipo de retención y el monto de la retención. Las retenciones de cabecera no generan tax result y todo el monto de la retención recae en el WHT code que esté asociado a la transacción. Esto es un problema al momento de querer obtener los conceptos de las cuentas asociadas.

## Description of the solution


## Scripts
+ Create

    + LMRY_CO_Header_WHT_calculation_STLT_LBRY_V2.1.js
    + LMRY_CO_Header_WHT_calculation_STLT_V2.1.js
        + Name: LatamReady - CO Header WHT calculation STLT
        + Id: _lmry_co_head_wht_calc_stlt

    + LMRY_CO_Header_WHT_calculation_CLNT_LBRY_V2.1.js
    + LMRY_CO_Header_WHT_calculation_CLNT_V2.1.js

    + LMRY_CO_Header_WHT_calculation_LBRY_V2.1.js
    + LMRY_CO_Header_WHT_calculation_MPRD_V2.1.js
        + scriptMapReduce: customscript_lmry_co_head_wht_calc_mprd
        + deployMapReduce: customdeploy_lmry_co_head_wht_calc_mprd
        + parameters: 
            + User: custscript_lmry_co_head_wht_calc_user
            + State: custscript_lmry_co_head_wht_calc_state
    
+ Update

+ Delete

## Records
+ Create
    
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























