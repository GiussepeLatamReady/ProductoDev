function getVendorPaymentDetails() {
    try {
        let jsonData = {};
        let filters = [];
        if (true) {
            //const { subsidiary } = this.params;
            filters = [
                ['custrecord_lmry_ste_ar_whtvpd_payment.subsidiary', 'is', "15"]
            ];
        }

        let columns = [
            search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_payment.id}' }),         //.0
            search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_payment}' }),   //.1
            search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_payment.recordType}' }), //.2
            search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_vendor}' }),           //.3
            search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_vendor.email}' }),       //.4
            search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_vendor.id}' }),
            search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_status.custrecord_lmry_ste_procstatus_code}' }),
        ];
        console.log("antes de la busqueda")
        const searchBillPayments = search.create({
            type: "customrecord_lmry_ste_ar_wht_vp_details",
            filters: filters,
            columns: columns
        });

        let pageData = searchBillPayments.runPaged({ pageSize: 1000 });
        if (pageData) {
            pageData.pageRanges.forEach(function (pageRange) {
                let page = pageData.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {

                    const columns = result.columns;
                    const statusCode = result.getValue(columns[6]);
                    if (statusCode === "DONE") {
                        const vendorID = result.getValue(columns[5]);
                        const paymentID = result.getValue(columns[0]);
                        if (!jsonData[vendorID]) {
                            jsonData[vendorID] = { payments: [], paymentIDs: new Set() };
                        }

                        // Añadir solo si el paymentID no está ya en el Set
                        if (!jsonData[vendorID].paymentIDs.has(paymentID)) {
                            jsonData[vendorID].paymentIDs.add(paymentID);
                            jsonData[vendorID].payments.push({
                                paymentID: paymentID,
                                tranID: result.getValue(columns[1]) || " - ",
                                recordType: result.getValue(columns[2]),
                                vendorID,
                                vendorName: result.getValue(columns[3]),
                                email: result.getValue(columns[4]),
                            });
                        }
                    }
                });
            });
        }

        let payments = [];
        for (let vendorID in jsonData) {
            payments = payments.concat(jsonData[vendorID].payments);
        }
        return payments;
    } catch (error) {
        console.error('Error', error.stack)
    }

}



getVendorPaymentDetails()

getVendors(subsidiary){

    let vendors = [];
    const newSearchVendor = search.create({
        type: "vendor",
        filters: [
            ['subsidiary', 'is', subsidiary]
        ],
        columns: [
            search.createColumn({
                name: "formulatext",
                formula: "CASE WHEN {isperson} = 'T' THEN {firstname} ELSE '' END",
                label: "0. Nombres"
            }),
            search.createColumn({
                name: "formulatext",
                formula: "CASE WHEN {isperson} = 'T' THEN {middlename} ELSE '' END",
                label: "1. Segundo nombre"
            }),
            search.createColumn({
                name: "formulatext",
                formula: "CASE WHEN {isperson} = 'T' THEN {lastname} ELSE '' END",
                label: "2. Apellidos"
            }),    
            search.createColumn({
                name: "formulatext",
                formula: "CASE WHEN {isperson} = 'F' THEN {companyname} ELSE '' END",
                label: "3. Razón Social"
            }),
            search.createColumn({
                name: "formulatext",
                formula: "{isperson}",
                label: "4. tipo de entidad"
            }),                        
        ]
    }); 

    newSearchVendor.run().each(result =>{
        const columns = result.columns;

        const isPerson = result.getValue(columns[4]);

        if (isPerson ==="T" || isPerson === true) {
            const firstname = result.getValue(columns[0]);
            const middlename = result.getValue(columns[1]);
            const lastname = result.getValue(columns[2]);
            const fullname = `${firstname} ${middlename} ${lastname}`;
            vendors.push({
                id:result.id,
                text:fullname
            });
        }else{
            const companyname = result.getValue(columns[3]);
            vendors.push({
                id:result.id,
                text:companyname
            });
        }
        return true;
    });

    return vendors;
}