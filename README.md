## Modulo Pago No Domiciliado (Tipo de Cambio en Asiento Diario) (C0847)
Resumen :
    Al momento de realizar los pagos a proveedores no domiciliados, el asiento de diario que se crea en automático por los impuestos retenidos deben de tomar el mismo tipo de cambio de la factura, y no debe de asignarse uno general para todos los asientos diarios generados por el módulo de pagos a proveedores no domiciliados.

Documento del requerimiento [https://docs.google.com/document/d/1f1q3q9UXwlH382gpvdRzDCmT8naudFhU/edit]
PPT del proceso involucrado [https://docs.google.com/presentation/d/1ey6imOtrDRQAp8AKoln9LyV86CW0wRKz/edit#slide=id.g74d4510483_0_145]

## Script relacionados


LMRY_PE_BillPayment_STLT.js
LMRY_PE_BillPayment_CLNT.js
LMRY_PE_Bill_Payment_MPRD.js
LMRY_PE_Log_BillPayments_STLT.js
LMRY_PE_BillPayments_SCHDL.js

## Scripts Modificados
LMRY_PE_BillPayment_CLNT.js
LMRY_PE_BillPayment_STLT.js

## Anotaciones 

Si el tipo_de_cambio es 1 
    el tipo_de_cambio_Journal es 1
Sino
    Si el tipo_de_cambio_Journal esta vacio
        tipo_de_cambio_Journal es igual al tipo_de_cambio
    Sino
        tipo_de_cambio_Journal es el valor que pone el usuario


Para ver la conversion segun el modulo a partir de la linea 252 de CLNT

Porque se creo el tipo de cambio para Journal y no se utlizo el tipo de cambio normal?


## Dcumentacion modificado

LatamReady - PE Rentas No Domiciliadas (56-58) [https://docs.google.com/presentation/d/1ey6imOtrDRQAp8AKoln9LyV86CW0wRKz/edit#slide=id.g2141fea1627_0_15]
STLT
Name:LatamReady - PE Bill Payment STLT V2.0
Id:customscript_lmry_pe_billpayment
File:LMRY_PE_BillPayment_STLT.js

CLNT
File:LMRY_PE_BillPayment_CLNT.js


