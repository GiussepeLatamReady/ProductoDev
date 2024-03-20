# [C1063 - ARG Mejora facturas desde ov con Percepciones](https://docs.google.com/document/d/1Png59TUJYHZK8h_obwWwtvpcEv8ywkrI/edit)


## Description of the Requirement

Se solicita considerar como mejora al proceso de percepciones en facturas de venta asociadas a órdenes de venta, el objetivo de la mejora es que al facturar la sales order herede la línea o item de percepción desde la sales order a la factura, pues actualmente no se hereda y se agrega la línea al guardar la factura y esto hace que la sales order quede pendiente de facturar ya que ambas transacciones quedan con líneas de percepción diferentes.


Lo anterior hace que el botón “Facturar” siga apareciendo en la sales order aun cuando la sales order está facturada por completo. Esto también ocasiona que reportes de órdenes de venta por facturar sean alterados



## Description of the solution


## Scripts
+ Update
    + LMRY_RecordSalesURET_V2.0.js
    + LMRY_InvoiceURET_V2.0.js
    + WHT_library/ 
        + LMRY_AutoPercepcionDesc_LBRY_V2.0.js

    
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
 En las transacciones 
 Invoice
 Creditmemo
 Estimate
 Sales order
 Cash Sale

Se pone la logica de percepciones en el after submit y se quita del before submit

## Error
No puede cambiar el artículo en esta línea porque tiene un elemento de ingreso existente. Elimine la línea e ingrese una nueva línea para corregir el elemento.























