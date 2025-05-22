# [C1252 - Enhancement - Automatic Set & Mass E-Invoicing by MX](https://docs.google.com/document/d/1frsCfSXOEXE7q4hN3dSMUK8lnUq6HVhDmivLA10ZS8Q/edit?tab=t.0#heading=h.1mllta7bdj39)

## Description of the Requirement
En facturación electrónica masiva para México (MX), se requiere modificar los criterios actuales utilizados por el módulo LatamReady - Advance Flow según especificaciones proporcionadas por ISP. Estas modificaciones buscan optimizar el reconocimiento y procesamiento correcto de documentos como Facturas, Notas de Crédito y Pagos de Cliente

## Description of the solution


## Scripts
+ Create
 
+ Update
    

+ Delete


## Records Configuration
+ Create
    +   Latam - Entity
        +   Descripcion : Este record almacena las entidades existentes en el ambiente.
        +   Type : Custom record (customrecord)
        +   Name : Latam - Entity
        +   ID : customrecord_cseg_lmry_sg_entity
        +   Fields:
            +   Latam - Entity ID : custrecord_lr_entity_id
            +   Latam - Entity Name : custrecord_lr_entity_name

+ Update
    
## Fields
+ Create
    +   Latam - Entity
        +   Descripcion : Creación de custom segment [Latam - Entity] relacionado al custom record [Latam - Entity]
        +   Type : Custom Segment (customsegment)
        +   Name : Latam - Entity
        +   ID : cseg_lmry_sg_entity
+ Update 
+ Delete

## Features
+ Create
+ Involved
+ Delete

## Bundles involved


## Observations
 
## Configuration


## SmartReady

+ Descripcion:

    + 


+ Documento funcional ( )

    + []()

+ Documento Tecnico:

    + [Documento Técnico - PE Rentas No Domiciliadas incluir Bill Credit](https://docs.google.com/document/d/1fJ8PHYwBPUpw6ort3cpPIGCNqw3zx-8XaS5HuZeZfhU/edit?tab=t.0)

+ Bundle:

    + 37714 Manager

























