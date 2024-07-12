# [C1115: CO Anthesis Colombia: Retenciones con Tarifa Variable por línea](https://docs.google.com/document/d/1gocg46QPqHF5Wx9ezZkpLqRAUc6ffKPTL6ICQu5C5Fk/edit)


## Description of the Requirement

Se requiere implementar tarifa variable para retenciones de linea v2

Solo aplica a Colombia

## Description of the solution

    

## Scripts
+ Create
    LMRY_WHT_Variable_Rate_popup_LBRY_V2.0.js
+ Update
    LMRY_VendorCredit_CO_URET_IMPLT.js
    LMRY_VendorCreditCLNT_V2.0.js
    LMRY_Vendorbill_CO_URET_IMPLT.js
    LMRY_VendorBillCLNT_V2.0.js
    LR_CO_New_WithholdingLines_LIB.js

    

    
+ Delete



## Records Configuration
+ Create

    + (LatamReady - Setup tax subsidiary)[https://tstdrv1774174.app.netsuite.com/app/common/custom/custreccustfield.nl?rectype=1337&e=T&id=45029]
        +   Field
            name:   Latam - Co Variable Rate
            id: custrecord_lmry_co_variable_rate  sbx: custrecord_smc_co_variable_rate  

            scripts: 
                    LR_CO_New_WithholdingLines_LIB.js
                    LMRY_WHT_Variable_Rate_popup_LBRY_V2.0.js
    + (LatamReady - National Taxes)[https://tstdrv1774174.app.netsuite.com/app/common/custom/custreccustfield.nl?rectype=1332&e=T&id=45034]
        +   Field
            name:   Latam - Variable Rate
            id:     custrecord_lmry_ntax_var_rate   sbx: custrecord_smc_ntax_var_rate

            scripts: 
                    LMRY_WHT_Variable_Rate_popup_LBRY_V2.0.js

    + (LatamReady - Setup Tax Fields View)[https://tstdrv1774174.app.netsuite.com/app/common/custom/custrecordentry.nl?id=6130&rectype=2519&whence=]
                NAME
                    custrecord_lmry_ntax_var_rate 
                ID
                    6130
                LATAM - COUNTRY
                    Colombia
                LATAM - RECORD TAX
                    National Tax
                LATAM - GENERATED TRANSACTION
                    WHT by Transaction
                LATAM - TAX TYPE
                    Retencion
                LATAM - WHT TYPE
                    Retencion CO

        + Registro (https://tstdrv1774174.app.netsuite.com/app/common/custom/custrecordentry.nl?id=6131&rectype=2519&whence=)
                NAME
                    custrecord_lmry_ntax_var_rate
                ID
                    6131
                LATAM - COUNTRY
                    Colombia
                LATAM - RECORD TAX
                    National Tax
                LATAM - GENERATED TRANSACTION
                    Journal
                LATAM - TAX TYPE
                    Retencion
                LATAM - WHT TYPE
                    Autoretencion

        
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
 
A partir de este commit haremos el apse por completoa sdf para retenciones de linea y tarifa variable 


Before load
	Ocultar campos de cabecera que contiene las retenciones - solo se deja los campos que tienen los montos de la 		retencion (main)
	
	Ocultar los campos de linea (custcol), luego crear y llenar los campos custpage	

	Si el feature esta desactivado ocultas los campos de columna (items y expense)}

	boton que establece el valor de las retenciones por defecto desde la entidad

items.sumSubtotal += items[lineuniquekey].subtotal;
            items.sumTaxtotal += items[lineuniquekey].taxtotal;
            items.sumTotal += items[lineuniquekey].total;


            me quede antes de setCOLineValueWTH
## Error























