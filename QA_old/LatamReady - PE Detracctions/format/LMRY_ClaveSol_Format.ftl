<#assign RUC = setPadding(subsidiary.custrecord_lmry_taxregnumber,"left","0",11)>
<#assign nombre = setPadding(subsidiary.legalname,"right"," ",35)>
<#assign N_lote = setPadding(number,"left","0",6)>
        <#--  <#function monto_entero  monto>
                <#assign entero = "">
                <#assign i=0>
            <#list (monto?string)?split(".") as x>
                <#assign i+=1>
                <#if (i==1)>
                        <#assign entero = x>
                </#if>
            </#list>
                 <#return entero?number>
        </#function>   -->
<#function ImporteTotalR transaction>
        <#assign total = 0>
        <#list transaction as tran>
            <#assign total += tran["_detractionAmount"]?number?round>
        </#list>
    <#return total>
</#function>
<#assign Importe_aux = ImporteTotalR(transaction)>
<#assign Importe_total = setPadding(formatCurrency(Importe_aux,"nodec"),"left","0",15)>
*${RUC}${nombre}${N_lote}${Importe_total}
<#list transaction as tran>
    <#assign entity=tran.entity>
    <#assign Tipo_doc_proveedor = setPadding(entity.custentity_lmry_sunat_tipo_doc_cod,"left"," ",1)>
    <#assign RUC_proveedor = setPadding(entity.vatregnumber+''+entity.custentity_lmry_digito_verificator,"left","0",11)>
    <#assign Razon_social = setPadding("","right"," ",35)>
    <#assign aux =tran.custbody_lmry_serie_doc_cxp>
    <#--  <#assign N_proforma =setPadding((aux?string)[1..]+"-"+tran.custbody_lmry_num_preimpreso,"right"," ",9)>  -->
    <#assign N_proforma =setPadding("","left","0",9)>
    <#assign codigo = setPadding((tran.custbody_lmry_concepto_detraccion)[0..1],"left","0",3)>
    <#assign N_cuenta = setPadding(entity.custentity_lmry_pe_ctactebn,"left","0",11)>
    <#assign monto =tran["_detractionAmount"]?number>
    <#assign importe = setPadding(formatCurrency(monto?round,"nodec"),"left","0",15)>
    <#assign Tipo_Op = setPadding("01","left"," ",2)>
    <#assign periodo = setPadding(formatDate(tran.trandate,"yyyyMM"),"left","0",6)>
    <#assign Tipo_Comprobante = setPadding("01","left"," ",2)>
    <#assign Serie = setPadding(tran.custbody_lmry_serie_doc_cxp,"left","0",4)>
    <#assign numero_comprobante = setPadding(tran.custbody_lmry_num_preimpreso,"left","0",8)>
<#if (transaction?size-1 = tran?index) >
${Tipo_doc_proveedor}${RUC_proveedor}${Razon_social}${N_proforma}${codigo}${N_cuenta}${importe}${Tipo_Op}${periodo}${Tipo_Comprobante}${Serie}${numero_comprobante}<#t>
<#else>
${Tipo_doc_proveedor}${RUC_proveedor}${Razon_social}${N_proforma}${codigo}${N_cuenta}${importe}${Tipo_Op}${periodo}${Tipo_Comprobante}${Serie}${numero_comprobante}
</#if></#list>