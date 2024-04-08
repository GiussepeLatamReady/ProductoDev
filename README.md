# [C1063 - ARG Mejora facturas desde ov con Percepciones](https://docs.google.com/document/d/1Png59TUJYHZK8h_obwWwtvpcEv8ywkrI/edit)


## Description of the Requirement



## Description of the solution


## Scripts
+ Create
    + Title: LatamReady - AR Massive generation AGIP STLT | LatamReady - AR Generación Masiva AGIP STLT
        + Name: LatamReady - Massive generation AGIP STLT
        + id: _lmry_ar_mass_gene_agip_stlt
        + File: LMRY_AR_Massive_Gene_Agip_STLT_V2.1.js

    + File: LMRY_AR_Massive_Gene_Agip_CLNT_V2.1.js

    + Title: LatamReady - AR Massive generation AGIP MPRD | LatamReady - AR Generación Masiva AGIP STLT
        + Name: LatamReady - Massive generation AGIP MPRD
        + id: _lmry_ar_mass_gene_agip_mprd
        + File: LMRY_AR_Massive_Gene_Agip_MPRD_V2.1.js

        + Parametros:
            + custscript_lmry_ar_mass_gen_agip_user
            + custscript_lmry_ar_mass_gen_agip_state

    + File: LMRY_AR_Massive_Gene_Agip_URET_V2.1.js
        + Name: LatamReady - Massive generation AGIP URET
        + id: _lmry_ar_mass_gene_agip_uret
        + File: LMRY_AR_Massive_Gene_Agip_URET_V2.1.js


+ Update
    
+ Delete

## Records
+ Create
    Name: LatamReady - Massive generation AGIP Log  | LatamReady - Generación masiva AGIP
    id: customrecord_lmry_ar_massive_gener_agip

        Fields:
            Subsidiary          custrecord_lmry_ar_gen_agip_subsidiary
            Entity Type         custrecord_lmry_ar_gen_agip_entity_type
            Period              custrecord_lmry_ar_gen_agip_period
            User Responsible    custrecord_lmry_ar_gen_agip_user
            Process details     custrecord_lmry_ar_gen_agip_details
            Entities            custrecord_lmry_ar_gen_agip_entities
            summary             custrecord_lmry_ar_gen_agip_summary
            status              custrecord_lmry_ar_gen_agip_status


        
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























