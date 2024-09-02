# [D1518 - Latam BR: Cálculo de IBPT para Facturación Electrónica](https://docs.google.com/document/d/1Qw94he6Rmw8414nKDeC3etqcm0UqhcgZYmek5I9fJqI/edit#heading=h.1mllta7bdj39)

## Description of the Requirement

Realizar conexión API con portal de De Olho No Imposto a fin de obtener el valor de IBPT.
BRAZIL

## Description of the solution


## Scripts
+ Create
   + Title: LR - BR Import IBPT STLT | LR - BR Importar IBPT STLT
        + Name: LR - BR Import IBPT STLT
        + id: _lr_br_import_ibpt_stlt
        + File: LR_BR_Import_IBPT_STLT.js

    + File: LR_BR_Import_IBPT_CLNT.js

    + Title: LR - BR Import IBPT MPRD | LR - BR Importar IBPT MPRD
        + Name: LR - BR Import IBPT MPRD
        + id: _lr_br_import_ibpt_mprd
        + File: LR_BR_Import_IBPT_MPRD.js

        + Parametros:
            + custscript_lr_br_import_ibpt_user
            + custscript_lr_br_import_ibpt_status

    + File: LR_BR_Import_IBPT_URET.js
        + Name: LR - BR Import IBPT URET
        + id: _lr_br_import_ibpt_uret
        + File: LR_BR_Import_IBPT_URET.js
            + LR - Import Log IBPT


+ Update

+ Delete


## Records Configuration
+ Create
    LR - Import Log IBPT
    customrecord_lr_import_log_ibpt
                Subsidiary	        custrecord_lr_import_log_subsidiary	        List/Record	Subsidiary
                UF                  custrecord_lr_import_log_uf	                Free-Form Text
                CNPJ                custrecord_lr_import_log_cnpj	            Free-Form Text
                Item Type	        custrecord_lr_import_log_type	            Free-Form Text
                token               custrecord_lr_import_log_token              Free-Form Text	 	 	
                Date Created	    custrecord_lr_import_log_date	            Date	 	
                User Responsible	custrecord_lr_import_log_user	            List/Record	Employee	 	
                Process details	    custrecord_lr_import_log_details	        Free-Form Text	 	 	
                Catalogs IDs	    custrecord_lr_import_log_taxes	            Long Text	 	 	
                Summary	            custrecord_lr_import_log_summary	        Free-Form Text	 	 	
                Status	            custrecord_lr_import_log_status	            Free-Form Text


    
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

    + Se ha implementado una integración automática con la API del portal "De Olho No Imposto" para obtener continuamente los valores actualizados del IBPT


+ Documento funcional ( LatamReady - BR Import IBPT D1518)

    + [LatamReady - BR Import IBPT D1518](https://docs.google.com/presentation/d/1UOykIUyeAT3_Drt-wbyijA6yAAkXUlny/edit#slide=id.g28b9f62f476_2_23)

+ Documento Tecnico:

    + [LatamReady - BR Import IBPT D1518 (Documento Técnico) ](https://docs.google.com/document/d/1azwkTlh9vdHVBf0G26PsN9EPUuGweKfFR7adNtxajdI/edit)

+ ¨Proyecto:

    + com.latamready.lmrybrlocalization























