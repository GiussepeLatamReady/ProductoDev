# [C1107 :WSP BR  / Procesar Pagos de cliente en Dólares dirigidos a cuentas bancarias en Reales](https://docs.google.com/document/d/1_RuvzoCiXF_wKNivSAMn_rzyKUq2fCKlpAYeM4_ho4A/edit)


## Description of the Requirement

Se requiere implementar tarifa variable para retenciones de linea v2

Solo aplica a Colombia

## Description of the solution

Se cambio el filtro del proceso para que se habiliten las cuentas de bancos diferentes a la moneda del modulo bajo el campo LATAM - BR MULTICURRENCY BANK ACCOUNT  del subtab de brazil en el record Setup Tax Subsidiary.

## Scripts
+ Create

+ Update
    LMRY_BR_WHT_CustPaymnt_CLNT.js
    LMRY_BR_WHT_CustPaymnt_Massive_CLNT.js

+ Delete



## Records Configuration
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


## Observations
 

## SmartReady

+ Descripcion:

    + Se cambio el filtro del proceso para que se habiliten las cuentas de bancos diferentes a la moneda del modulo bajo el campo LATAM - BR        MULTICURRENCY BANK ACCOUNT del subtab de brazil en el record Setup Tax Subsidiary.

+ Scripts modificados:

    + LMRY_BR_WHT_CustPaymnt_CLNT.js
    + LMRY_BR_WHT_CustPaymnt_Massive_CLNT.js

+ Documento funcional ( LatamReady - BR WHT Reclass Customer Payment)

    + [LatamReady - BR WHT Reclass  Customer Payment](https://docs.google.com/presentation/d/1r9W9agiJSgQsZ_jfhN7CcgqAn6mM1ORV6haLVLDJ7uE/edit#slide=id.g2e7b5d9cde0_0_8)

+ Pruebas Internas:

    + [C1107 PRUEBAS BASICAS DESARROLLO - QA](https://docs.google.com/spreadsheets/d/1bunbNINcbDdJJXmOaRak-ElvmUWKnODcgrQjJiDEbmQ/edit?gid=0#gid=0)
+ Bundles:

    + 35754 (Development)
    + 37714 (Production)























