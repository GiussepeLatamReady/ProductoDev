# [CO WHT Cabecera genere Tax Results D1126](https://docs.google.com/document/d/1k6W6o4MdSt7BZfxOh42sngr8GIVgk1CpKUSV3UXf5HQ/edit)

Se generarán registros del record “LatamReady - Tax results” utilizando el proceso de retenciones de cabecera.


## LatamReady - WHT Type

WHT Subtype
custrecord_lmry_wht_subtype
type: LatamReady - Setup WHT Sub Type

Creación de un nuevo campo “WHT Subtype” (custrecord_lmry_wht_subtype), este campo será de tipo lista y referenciando al record “LatamReady - Setup WHT Sub Type” (customrecord_lmry_ar_wht_type) donde se guardará el subtipo de retención que será utilizado en el Tax Results.


## Script Modify

        LMRY_libWhtValidationLBRY_V2.0.js



## Create Fields 


## FEATURES


## Record modificados


## Campo de cabecera


*LATAM - RELATED ID: Internal ID de la transacción a la que se le realizó el cálculo de retenciones.
    	custrecord_lmry_br_related_id
*LATAM - RELATED TRANSACTION: Transacción a la que se le realizó el cálculo de retenciones.
    	custrecord_lmry_br_transaction
*LATAM - SUB TYPE: Se obtiene del campo “WHT Subtype” del record “LatamReady - WHT Type” relacionado al campo “WITHHOLDING TAX TYPE” del record “LatamReady - WHT Code”.
    	custrecord_lmry_br_type
*LATAM - BASE AMOUNT: Es el monto base de la retención en moneda de la transacción.
        custrecord_lmry_base_amount
LATAM - TOTAL: Es el monto de retención en moneda de la transacción.
LATAM - TOTAL BASE CURRENCY: Es el monto de retención en moneda del país  (Pesos Colombianos).
LATAM - PERCENTAGE: Es el porcentaje de retención (entre 0 y 1).
LATAM - TOTAL / LINE: “Total”.
LATAM - DESCRIPTION: Se obtiene del campo “Description” del record “LatamReady - WHT Code”.
LATAM - ACCOUNTING BOOKS: Concatenado de libros contables con sus respectivos tipos de cambio.
LATAM - TAX TYPE: “Retencion”.
LATAM - SUB TYPE LIST: Se obtiene del campo “WHT Subtype” del record “LatamReady - WHT Type” relacionado al campo “WITHHOLDING TAX TYPE” del record “LatamReady - WHT Code”.
LATAM - BASE AMOUNT LOCAL CURRENCY: Monto base de cálculo en moneda del país (Pesos Colombianos).
LATAM - AMOUNT LOCAL CURRENCY: Monto del cálculo de retenciones calculado en moneda del país (Pesos Colombianos) con todos sus decimales.
LATAM - GROSS AMT LOCAL CURRENCY: Monto gross de la factura en moneda nacional (Pesos Colombianos).
LATAM - DISCOUNT AMT LOCAL CURRENCY: Monto de descuento de la factura en moneda nacional (Pesos Colombianos).

## ids Documento

    custrecord_lmry_br_related_id
    custrecord_lmry_br_transaction
    custrecord_lmry_br_type
    custrecord_lmry_base_amount
    custrecord_lmry_br_total
    custrecord_lmry_total_base_currency
    custrecord_lmry_br_percent
    custrecord_lmry_total_item
    custrecord_lmry_tax_description
    custrecord_lmry_accounting_books
    custrecord_lmry_tax_type
    custrecord_lmry_br_type_id
    custrecord_lmry_base_amount_local_currc
    custrecord_lmry_amount_local_currency
    custrecord_lmry_gross_amt_local_curr
    custrecord_lmry_discount_amt_local_curr

## ids script libry guide

        custrecord_lmry_br_related_id
        custrecord_lmry_br_transaction
        custrecord_lmry_br_type
        custrecord_lmry_br_type_id
        custrecord_lmry_base_amount
        custrecord_lmry_br_total
        custrecord_lmry_br_percent
        custrecord_lmry_total_item
        custrecord_lmry_item
        custrecord_lmry_br_positem
        custrecord_lmry_br_ccl    
        custrecord_lmry_ccl  
        custrecord_lmry_ntax
        custrecord_lmry_accounting_books
        custrecord_lmry_tax_description
        custrecord_lmry_ec_wht_taxcode
        custrecord_lmry_ec_rate_rpt
        custrecord_lmry_total_base_currency
        custrecord_lmry_base_amount_local_currc
        custrecord_lmry_amount_local_currency
        custrecord_lmry_tax_type
        custrecord_lmry_lineuniquekey


























