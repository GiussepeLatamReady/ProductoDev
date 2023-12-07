# [CL - Ludipek Chile - Redondeo de montos a nivel de línea en XML de FEL - Guia Electrónica C1040](https://docs.google.com/document/d/1hnVVs4NZ1Y-Iee3Ow-BAYRael2XuykRdsVTbuPsHr6E/edit)


## Description of the Requirement

 En el user events LatamReady - EI Main URET popular la columna Latam Col - Sales Discount Unitario Real (custcol_lmry_sales_discount_unit_real) con el valor de la columna Amount, aplicar el User evemts a Estimate y Sales Order, el campo se debe ver para Estimate, Sales Order, en el Item Fulfillment solo se mostrara el campos con el importe previamente cargado en las trasacciones Sales Order y Estimate

## Description of the solution


## Scripts
+ Create
}
+ Update

+ Delete

## Records
+ Create
    + LatamReady - Setup Fields View
        + Name: custcol_lmry_sales_discount_unit_real
        + ON ESTIMATE : Check
        + ON SALES ORDER : check
        + ON ITEM FULLFILMENT : check
+ Update
    + Transaction Line Field
        + Latam Col - Sales Discount Unitario Real (custcol_lmry_sales_discount_unit_real)
        + ITEM FULFILLMENT : check activado

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























