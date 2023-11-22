# [MX:EI - Validacion VOID D1214]()


## Description of the Requirement

Realizar la validacion de creacion de notas de credito al momento de anular Electronicamente, para no generar una nueva nota de credito si esta ya existe. PE BR MX

## Description of the solution

Se agregó validaciones para las anulaciones para los paises PE BR MX

## Scripts
+ Create
+ Update
  + BR
    + LMRY_AnulacionInvoice_LBRY_V2.0 anularInvoice (MX)
    + LMRY_BR_EI_Void_LBRY_V2.0.js voidBillCredit
    + LMRY_AnulacionBill_LBRY_V2.0.js anularBill
  + PE
    + LMRY_PE_AnulacionInvoice_LBRY_V2.0.js anularTransaction

+ Delete

## Records


## Fields
+ Create
+ Update 
+ Delete

## Features
+ Create
+ Involved
+ Delete

## Bundles involved
Bundle de EI
  (Desarrollo) SuiteBundles : Bundle 245636 : EI_Library
  (SuiteAPP) SuiteScripts : LatamReady2.0 : E.I. All Country : Electronic Invoicing : EI_Library

























  4 