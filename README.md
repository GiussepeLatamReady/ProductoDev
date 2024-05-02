# [BO: Modificacion wht C0995](https://docs.google.com/document/d/1I3NvteDPiYfCXt80L4dz7rQPSiD29Yfm/edit)


## Description of the Requirement

Se necesita modificar la tarifa de retención en la etiqueta del Libro de retenciones para el campo IUE Servicios al ser mostrado en el reporte, en la que actualmente se indica “Retenciones IUE - Servicios 12.5%” por lo siguiente “Retenciones IVA - Servicios 13%”.

## Description of the solution



## Scripts
+ Create
  LMRY_WhtValidattionEntity_LBRY_V2.0.js
  
  
+ Update
  LMRY_BO_libWhtLines_LMRY_V2.0.js



  LMRY_VendorCreditURET_V2.0.js
  LMRY_VendorBillURET_V2.0.js

  LMRY_VendorURET_V2.0.js

+ Delete

## Records
+ Create
  + LatamReady - WHT Type (customrecord_lmry_wht_type)
    + NAME                    : ReteIVA BO
    + INACTIVE                : false
    + NAME                    : ReteIVA
    + DESCRIPTION             : Withholding tax of the IVA Tax
    + ENTITY CUSTOM FIELD     : custpage_lmry_ety_bo_reteiva
    + TRANSACTION CUSTOM FIELD: custpage_lmry_bo_reteiva
    + WHT AMOUNT CUSTOM FIELD : custpage_lmry_bo_reteiva_whtamount
    + COUNTRY                 : Bolivia (Plurinational State of)
    + WHT SUBTYPE             :

  + LatamReady - Setup Fields View (customrecord_lmry_fields)
    + NAME      : recmachcustrecord_lmry_co_entity
    + COUNTRY   : Bolivia (Plurinational State of)
    + SECTION   : Cust Record
    + ON VENDOR : TRUE

  + LatamReady - Setup Fields View
    + recmachcustrecord_lmry_co_entity : Se creo un registro para que se vea el record relacionado en la entidad
+ Update
    + LatamReady - Entity Fields (customrecord_lmry_entity_fields) "setup"
      + Se creo el subtabs "Bolivia".
      + Creacion del campo "Latam - BO IVA" (custrecord_lmry_bo_reteiva) y se ubica en el subtab bolivia.

    + LatamReady - BO Transaction Fields (customrecord_lmry_bo_transaction_fields) "setup"
      + Se creo el subtabs "LatamReady - WHT".
      + Latam - BO IVA (custrecord_lmry_bo_reteiva) de tipo LatamReady - WHT Code.
      + Latam - BO IVA Amount (custrecord_lmry_bo_reteiva_whtamount) de tipo currency.

    + LatamReady - Setup Fields View
      + recmachcustrecord_lmry_bo_transaction : En la seccion Purchase Information (Only Transactions) se agregar para on bill y on vendor credit.


## Fields
+ Create
+ Update 
+ Delete

## Features
+ Create
+ Involved
+ Delete

## Bundles involved


## others
items purchase - LatamReady - WHT Code
https://tstdrv1774174.app.netsuite.com/app/common/item/item.nl?id=4247&whence=&cmid=1701041834085_720


LatamReady - WHT Code
https://tstdrv1774174.app.netsuite.com/app/common/custom/custrecordentry.nl?id=139&rectype=1069&whence=


qa fix 
Se realiza el cambio y se agrega una funcion en la libreria LMRY_BO_libWhtLines_LMRY_V2.0.js

Se agrega dicha funcion en el vendor y vendor credit que poermite setear el valor de la retencion antes de guardar su monto

Se modifica el id del feature para bolivia de 27 a 46 en la libreria LMRY_KofaxIntegrations_LBRY_V2.0.js

Se cambio como parametro el objrecord por newrecord en el vendorcredit



























  4 