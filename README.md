# [C1041 - C1065 : BR Mejora - Pagos solo por el Módulo Latam](https://docs.google.com/document/d/1mIRbg0fRekUGNTjgBxUO1RAYA2cyMbtVToAnTI0m9uU/edit)


## Description of the Requirement

Se requiere un nuevo Feature By Subsidiary con una funcionalidad específica para los pagos de Proveedores y cobranzas de Clientes.

Solo aplica a Brazil

## Description of the solution


## Scripts
+ Create
    LMRY_BR_Void_Inventory_Transaction_LBRY_V2.0.js

+ Update
    LMRY_InvoiceCLNT_V2.0.js
    LMRY_InvoiceURET_V2.0.js
    LMRY_BR_WHT_CustPaymnt_CLNT.js
    LMRY_BR_WHT_CustPaymnt_CLNT.js

    LMRY_BR_WHT_Purchase_CLNT_LBRY_V2.1.js
    LMRY_BR_WHT_Purchase_STLT_LBRY_V2.1.js
    
+ Delete

+ revision
    LMRY_BR_WHT_CustPaymnt_STLT.js
    LMRY_BR_WHT_Purchase_STLT_V2.1.js

    LMRY_VendorURET_V2.0.js
    LMRY_VendorCLNT_V2.0.js

    LMRY_EntityURET_V2.0.js
    LMRY_EntityCLNT_V2.0.js

    LMRY_VendorBillURET_V2.0.js
    LMRY_VendorBillCLNT_V2.0.js

    LMRY_InvoiceURET_V2.0.js
    LMRY_InvoiceCLNT_V2.0.js

## Records
+ Create
    + LatamReady - Setup Tax Subsidiary (customrecord_lmry_setup_tax_subsidiary)
    Crear el campo : PAGAMENTO LATAMREADY (custrecord_lmry_setuptax_br_pagamento_lr)
        
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
 

## Error
No puede cambiar el artículo en esta línea porque tiene un elemento de ingreso existente. Elimine la línea e ingrese una nueva línea para corregir el elemento.























