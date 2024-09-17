# [D1639 - Documento Diseño CO Name GL Impact ajuste  DIAN](https://docs.google.com/document/d/1VgY94IcqjxbkoDOWSpe9WSMmMqTZOMSM1im8ALemxfM/edit)

## Description of the Requirement

El presente desarrollo realizará la reclasificación del VAT el GL Impact de la transacción.


## Description of the solution


## Scripts
+ Create

+ Update
    + LMRY_CO_VAT_Reclass_PLGN.js

+ Delete


## Records Configuration
+ Create
    + LatamReady - Setup Tax Subsidiary (customrecord_lmry_setup_tax_subsidiary)
        + Field: Latam - CO Name GL Impact Reclass VAT
            + id: custrecord_lmry_setuptax_co_set_name_gl
            + type: CHECKBOX
            + Subtab: Colombia


    
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

    + Este desarrollo responde a la necesidad de mostrar la entidad de la cabecera de la transacción en el campo "Name" del GL Impact. Para ello, se implementó la función "Latam - CO Name GL Impact Reclass VAT" en el registro "LatamReady - Setup Tax Subsidiary", que asigna la entidad a las líneas del impacto contable cuando está activada. Si está desactivada, la columna de entidad permanece vacía.


+ Documento funcional ( CO - Calculo de impuestos | Reclasificacion de VAT D1639)

    + [CO - Calculo de impuestos | Reclasificacion de VAT](https://docs.google.com/presentation/d/17bQ78lTi3ho71-XOJuZ1c7vPSzz4U6naqaDVbm6nhN0/edit#slide=id.g2fff4e12215_1_0)

+ Documento Tecnico:

    + [LatamReady - BR Import IBPT D1518 (Documento Técnico) ](https://docs.google.com/document/d/1azwkTlh9vdHVBf0G26PsN9EPUuGweKfFR7adNtxajdI/edit)

+ ¨Proyecto:

    + com.latamready.lmrybrlocalization























