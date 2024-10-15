# [D1653 - CO Automatic Set by Subsidiary]()

## Description of the Requirement

En el siguiente requerimiento se solicita la creación de un Automatic Set a nivel general, es decir, que no funcione por entidad, si no que se haga una configuración general y que rija para las transacciones indicadas en la configuración.



## Description of the solution


## Scripts
+ Create

+ Update


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
 
+ Verificar si en el record LatamReady - Setup Automatic Set Fiel (customrecord_lmry_setup_universal_set_v2) estan todos los campos de colombia que se desan setear.

## SmartReady

+ Descripcion:

    + Se oculta los campos Latam de la direccion de la subsidiaria o Entidad si es que no esta localizada.


+ Documento funcional ( CO - Calculo de impuestos | Reclasificacion de VAT D1639)

    + []()

+ Documento Tecnico:

    + [) ]()

+ Bundle:

    + com.latamready.lmrybrlocalization


    Input
https://tstdrv1774174.app.netsuite.com/app/accounting/transactions/purchord.nl?id=4211286&whence=
https://tstdrv1774174.app.netsuite.com/app/accounting/transactions/itemrcpt.nl?id=4211287&compid=TSTDRV1774174

output

https://tstdrv1774174.app.netsuite.com/app/accounting/transactions/salesord.nl?id=4211289
https://tstdrv1774174.app.netsuite.com/app/accounting/transactions/itemship.nl?id=4211290&whence=&cmid=1728919266050_2242























