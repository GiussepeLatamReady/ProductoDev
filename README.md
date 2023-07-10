# [APLICACIÓN Y EMISIÓN DESCUENTOS GLOBALES Y DE LINEA C0905](https://docs.google.com/document/d/1BWdP9_P2ozs7HSTm1QFjaEu9go06aSAomP-H7BikUOA/edit)

PERSONALIZACIÓN 1: 
Crear dos campos a nivel de columna que se llenen de manera automática con el valor en porcentaje del descuento aplicado a esa línea de artículo y el precio unitario real ya con descuento. El campo 1 debe llamarse “LATAM COL - SALES DISCOUNT UNITARIO  REAL” y el otro campo se llama llamar “LATAM COL - SALES DISCOUNT PERCENTAGE “ y ambos deben ir ubicados a nivel de línea al lado del precio unitario estándar. Esta personalización estaría de la mano con la personalización, dado que allí es donde se automatizará el llenado.

PERSONALIZACIÓN 2: 
Aquí es importante mencionar que se debe realizar una automatización línea a línea, para calcular el “unit price” de la línea de artículo por el descuento de la línea y poner ese resultado en el campo “LATAM COL - SALES DISCOUNT UNITARIO REAL”. Y llevar el “unit price” de la línea de descuento, al campo nuevo llamado “LATAM COL - SALES DISCOUNT PERCENTAGE”  dentro de la línea de artículo, como lo muestra el excel de 
calculos:

[CALCULOS DESCUENTOS GLOBAL-LINEA.xlsx](https://docs.google.com/spreadsheets/d/1xAQiYDH3pcqk9vP0ZmiN7R9KsGUNLyvJ/edit#gid=593017972)
## Modified scripts



**1. User event del invoice**
- 	Nombre: LatamReady - Invoice URET V2.0
- 	id: customscript_lmry_invoice_uret_v2
- 	File: LMRY_InvoiceURET_V2.0.js

## Script guide


## Create Fields 
    
-   Name:  Latam Col - Sales Discount Unitario Real
-   id: custcol_lmry_sales_discount_unit_real

-   Name: Latam Col - Sales Discount Percentage
-   id: custcol_lmry_sales_discount_percentag
______________________________







