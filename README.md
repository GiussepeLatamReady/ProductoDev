# [Integraciones Vendor Bill - WEBSERVICE C0953](https://docs.google.com/document/d/1L4vaIoN9b8voQEXyToS50t2CXdpPb8Jo_jtPEGSIj5w/edit)

Se está presentando que cuando se integran los documentos tipo bill mediante el aplicativo de KOFAX , y al registrarse en NetSuite dentro del campo reference number or invoice number no esta concatenando los campos Latam - CXP Series y Latam - Prepinted number, de acuerdo a lo requerido por cada país.

## Modified scripts




## Script guide

**1. User event del Bill**
- 	Nombre: LatamReady - Vendor Bill URET 2.0
- 	id: customscript_lmry_vendorbill_uret_2_0
- 	File: LMRY_VendorBillURET_V2.0.js

## Create Fields 

**1. STLT ESPEJO GENERAL**
- 	Nombre: SMC - Features STLT
- 	id: customscript_smc_features_stlt
- 	File: SMC_Features_STLT_V2.0.js

**2. STLT ESPEJO SUBSI**
- 	Nombre: SMC - Feature Subsidiary STLT
- 	id: customscript_smc_features_subsi_stlt
- 	File: SMC_Features_Subsi_STLT_V2.0.js

customscript_lmry_features_subsi_stlt


## FEATURES

Strict Bill Duplicity
Strict Bill Credit Duplicity


1: 08377770
2: 74724899
3: 16795903
4: 93585847
5: 48255893
6: 43560588
7: 02405663
8: 12045525
9: 82619756
10: 44546853


## Script modificados

LMRY_TranID_CSV_LBRY_V2.0.js
LMRY_VendorBillURET_V2.0.js
LMRY_VendorCreditURET_V2.0.js


    




















