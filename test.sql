CASE WHEN {customermain.isdefaultbilling}='T' THEN       CASE WHEN NVL({customermain.billaddress},'')='' THEN         0         ELSE        CASE WHEN NVL({billaddress},'')='' THEN             0             ELSE 1 END      END  ELSE 0 END



CASE WHEN (NVL({customermain.custentity_lmry_sunat_tipo_doc_cod},'') = 'CPF' AND {customermain.isperson} = 'T') OR (NVL({customermain.custentity_lmry_sunat_tipo_doc_cod},'') = 'CNPJ' AND {customermain.isperson} = 'F') THEN     1 ELSE     0 END


{customermain.custentity_lmry_sunat_tipo_doc_cod}
{customer.vatregnumber}