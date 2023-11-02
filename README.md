# [JE Debit/Credit - Cuentas Redondeo Peru (Ventas y compras) C1018 y C1018 -2](https://docs.google.com/document/d/1KGKd3uSz04AfABCBtdibHk2JdjK8XxuGntnsatZLq7c/edit#heading=h.1mllta7bdj39)


## Description of the Requirement

El cliente requiere que desde el módulo de Latam - Generate Detractions (Perú) tanto para CxP y CxC se pueda seleccionar otra cuenta para redondeo, actualmente el módulo solo permite elegir una sola cuenta para redondeo.

## Description of the solution


## Scripts (Purchase)
+ Create
+ Update
    + LMRY_detrac_loader_LBRY_v2.0.js
    + LMRY_detrac_batch_object_LBRY_v2.0.js 
    + LMRY_detrac_metadata_LBRY_v2.0.js (Este file se modificó en ventas pero tuvimos suerte que tmb es valido para compras)


    + LMRY_PE_BatchDetraction_URET_v2.0.js
    + LMRY_PE_generate_detractions_CLNT_v2.0.js
    + LMRY_PE_generate_detractions_STLT_v2.0.js
    

+ Delete


## Scripts (Sales)
+ Create
+ Update
    + LMRY_detrac_batch_object_LBRY_v2.0.js
    + LMRY_detrac_metadata_LBRY_v2.0.js
    + LMRY_detrac_sales_operations_LBRY_v2.0.js
    + LMRY_detrac_sales_server_LBRY_v2.1.js
    + LMRY_detrac_ServerWidget_LBRY_v2.0.js

    + LMRY_PE_generate_SalesDetractions_STLT_v2.0.js
    + LMRY_PE_list_SalesDetractions_CLNT_v2.0.js
    + LMRY_PE_setup_SalesDetractions_STLT_v2.0.js

## Scripts (Sales and purchase)
+ Create
+ Update
    + LMRY_detrac_batch_object_LBRY_v2.0.js
    + LMRY_detrac_metadata_LBRY_v2.0.js
    + LMRY_detrac_sales_operations_LBRY_v2.0.js
    + LMRY_detrac_sales_server_LBRY_v2.1.js

    (Purchase)
    + LMRY_PE_BatchDetraction_URET_v2.0.js
    + LMRY_PE_generate_detractions_CLNT_v2.0.js
    + LMRY_PE_generate_detractions_STLT_v2.0.js

    (Sales)
    + LMRY_PE_generate_SalesDetractions_STLT_v2.0.js
    + LMRY_PE_list_SalesDetractions_CLNT_v2.0.js
    + LMRY_PE_setup_SalesDetractions_STLT_v2.0.js
    
## Records (Purchase)

+ **LatamReady - PE Detractions Account**
    + **Create** 
        + **Core:** Field record
        + **Name:** Latam - Detailed rounding deduction.
        + **id:** custrecord_lmry_pe_detailed_rounding_pur.
        + **es:** Latam - Deducción detallada por redondeo.
        + **pt:** Latam - Dedução detalhada por arredondamento.
        + **Description:** If this field is enabled, the related entity is populated in the rounding lines of the Journal Entry; otherwise, the rounding will accumulate without populating the entity.
        + **type:** chexbox
 

        + **Core:** Field record
        + **Name:** Latam - Rounding Account (credit).
        + **id:** custrecord_lmry_det_ac_account_5.
        + **es:** Latam - Cuenta de redondeo (Haber)
        + **pt:** Latam - Cuenta de redondeo (Haber).
        + **Description:** .
        + **type:** select

        
    + **Update**
        + **Core:** Field record
        + **Name:** Latam - Rounding Account (debit).
        + **id:** custrecord_lmry_det_ac_account_3.
        + **es:** Latam - Cuenta de redondeo (debe).
        + **pt:** Latam - Cuenta de redondeo (debe).
        + **Description:** .
        + **type:** select

## Records (Sales)

+ **LatamReady - PE Detrac. Account (Sales)**
    
    + **Create** 

        + **Core:** Field record
        + **Name:** Latam - Detailed rounding deduction.
        + **id:** custrecord_lmry_pe_detailed_rounding.
        + **es:** Latam - Deducción detallada por redondeo.
        + **pt:** Latam - Dedução detalhada por arredondamento.
        + **Description:** If this field is enabled, the related entity is populated in the rounding lines of the Journal Entry; otherwise, the rounding will accumulate without populating the entity.
        + **type:** chexbox


        + **Core:** Field record
        + **Name:** Latam - Rounding Account (credit).
        + **id:** custrecord_lmry_pe_dec_ac_sales_acc_4.
        + **es:** Latam - Cuenta de redondeo (Haber).
        + **pt:** Latam - Cuenta de redondeo (Haber).
        + **Description:** .
        + **type:** List/Record (Account)

        
    + **Update**
        + **Core:** Field record
        + **Name:** Latam - Rounding Account (debit).
        + **id:** custrecord_lmry_pe_dec_ac_sales_acc_2.
        + **es:** Latam - Cuenta de redondeo (debe).
        + **pt:** Latam - Cuenta de redondeo (debe).
        + **Description:** .
        + **type:** List/Record (Account)
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


## Scripts (Compilado)

+ Update
    + LMRY_detrac_batch_object_LBRY_v2.0.js
    + LMRY_detrac_loader_LBRY_v2.0.js
    + LMRY_detrac_metadata_LBRY_v2.0.js
    + LMRY_detrac_sales_operations_LBRY_v2.0.js
    + LMRY_detrac_sales_server_LBRY_v2.1.js
    + LMRY_detrac_ServerWidget_LBRY_v2.0.js

    (Purchase)
    + LMRY_PE_BatchDetraction_URET_v2.0.js
    + LMRY_PE_generate_detractions_CLNT_v2.0.js
    + LMRY_PE_generate_detractions_STLT_v2.0.js

    (Sales)
    + LMRY_PE_generate_SalesDetractions_STLT_v2.0.js
    + LMRY_PE_list_SalesDetractions_CLNT_v2.0.js
    + LMRY_PE_setup_SalesDetractions_STLT_v2.0.js























