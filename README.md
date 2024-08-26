# [c1126 L-  AR - Diseño AR-SICORE Retenciones y percepciones Efectuadas](https://docs.google.com/document/d/18zOqLgFNN5Bp8_b4UDvvsRBt9YQQyD6k/edit)
## Description of the Requirement

El propósito de este requerimiento es que el sistema dé al cliente la opción de elegir, cuando aún no haya presentado la DDJJ correspondiente, con qué fecha hacer el voided de una retención, es decir a qué quincena afectar, si a la primera o a la segunda, para el caso de las retenciones.


Colombia

## Description of the solution


## Scripts
+ Create
   


+ Update
    + LMRY_AR_Withholding_Certificate_LBRY.js
    + LMRY_AR_Withholding_Certificate_PDF_LBRY.js
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

    + Se ha agregado en el proceso de anulación de pagos la opción para que el cliente seleccione la fecha del voided de una retención, permitiéndole elegir si afecta la primera o segunda quincena. Además, se añadió un campo de fecha en el módulo de anulación y se incluye la identificación de retenciones de Honorarios.

+ Scripts modificados:

    + LMRY_AR_WHT_Void_Payments_STLT.js
    + LMRY_AR_WHT_Void_Payments_MPRD.js

+ Documento funcional ( LatamReady - BR WHT Reclass Customer Payment)

    + [LatamTax - AR Payment Void](https://docs.google.com/presentation/d/1h4HD8uGnY2kmtgWPwbhUOmcRz0o787GTQJaFxKZSlw8/edit#slide=id.g2f6245a453e_0_1)

+ Pruebas Internas:

    + [Diseño Técnico ](https://docs.google.com/document/d/1Atlmrtk2ZbV-xpHtNrkIv1ZFsMRZ3XbFRst0bozUdy8/edit)

+ Bundles:

    + 35754 (Development)
    + 37714 (Production)























