# [C1064 - ARG Mejora Percepciones en Notas crédito parciales](https://docs.google.com/document/d/1hjy0_akO8KVM5ry34YHQSHK8dyeFC6R_/edit)


## Description of the Requirement

Se solicita considerar como mejora al proceso de aplicación de percepciones de ingresos brutos en notas de crédito (Según contributory Class), una validación para que se agregue la línea (s) de percepción siempre y cuando la nota de crédito sea por el total de la factura.

Lo anterior se debe a que por norma, las percepciones sólo se aplican si la nota de crédito es por el valor total, en caso sea una Nota de crédito parcial NO debe aplicar o calcular la percepción.




## Description of the solution


## Scripts
+ Update
    + LMRY_CreditMemoURET_V2.0.js
    + WHT_library/ 
        + LMRY_AutoPercepcionDesc_LBRY_V2.0.js

    
+ Delete

## Records
+ Create
    LatamReady - Setup WHT Type 
    Crear campo https://tstdrv1774174.app.netsuite.com/app/common/custom/custrecord.nl?id=1096&e=T&whence=&cmid=1720199657991_2618
    Name: Latam - Percepcion 
    id: custrecord__lmry_setup_wht_perception
        
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
 En las transacciones 
 Invoice
 Creditmemo
 Estimate
 Sales order
 Cash Sale



Se pone la logica de percepciones en el after submit y se quita del before submit

El cambio del URET en cada transaccion solo es para asegurar donde se va ejecutar la logica, el flujo prncipal se hace en la libreria
## Error
No puede cambiar el artículo en esta línea porque tiene un elemento de ingreso existente. Elimine la línea e ingrese una nueva línea para corregir el elemento.


Invoice
https://tstdrv1774174.app.netsuite.com/app/accounting/transactions/custinvc.nl?id=3975523&whence=&cmid=1713148508938_9326
R A
https://tstdrv1774174.app.netsuite.com/app/accounting/transactions/rtnauth.nl?id=3975524&whence=&cmid=1713151317364_9362
Credit Memo
https://tstdrv1774174.app.netsuite.com/app/accounting/transactions/custcred.nl?id=3975526&whence=&cmid=1713151615306_9373






















