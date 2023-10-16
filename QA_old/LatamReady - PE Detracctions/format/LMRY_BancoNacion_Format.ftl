<#assign RUC = setPadding(subsidiary.custrecord_lmry_taxregnumber,"left","0",11)>
<#assign nombre = setPadding(subsidiary.legalname,"right"," ",35)>
<#function ImporteTotal transaction>
    <#assign total = 0>
    <#list transaction as tran>
        <#assign total += tran["_detractionAmount"]?number?round>
    </#list>
<#return total>
</#function>
<#assign N_lote = setPadding(number,"left","0",6)>
<#assign Importe_aux = ImporteTotal(transaction)>
<#assign Importe_total = setPadding(formatCurrency(Importe_aux,"nodec"),"left","0",15)>
*${RUC}${nombre}${N_lote}${Importe_total}
<#list transaction as tran>
    <#assign entity=tran.entity>
    <#assign RUC_proveedor = setPadding(entity.vatregnumber+''+entity.custentity_lmry_digito_verificator,"left","0",11)>
    <#assign codigo = setPadding((tran.custbody_lmry_concepto_detraccion)[0..1],"left","0",3)>
    <#assign N_cuenta = setPadding(entity.custentity_lmry_pe_ctactebn,"left","0",11)>
    <#assign monto = tran["_detractionAmount"]?number?round>
    <#assign importe = setPadding(formatCurrency(monto?round,"nodec"),"left","0",15)>
    <#assign Tipo_Op = setPadding("01","left","0",2)>
    <#assign periodo =setPadding(formatDate(tran.trandate,"yyyyMM"),"right","0",9) >
    <#assign Tipo_Comprobante = setPadding("01","left"," ",2)>
    <#assign numero_comprobante = setPadding(tran.custbody_lmry_num_preimpreso,"left","0",12)>
<#if (transaction?size-1 = tran?index) >
${RUC_proveedor}${periodo}${codigo}${N_cuenta}${importe}${Tipo_Op}6${numero_comprobante}${Tipo_Comprobante}<#t>
<#else>
${RUC_proveedor}${periodo}${codigo}${N_cuenta}${importe}${Tipo_Op}6${numero_comprobante}${Tipo_Comprobante}
</#if></#list>
