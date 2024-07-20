function getVendorPaymentDetails() {
    try {
        let jsonData = {};
        let subsidiary = "15"; // Ajustar según sea necesario
        let myQuery = query.create({
            type: 'customrecord_lmry_ste_ar_wht_vp_details'
        });

        myQuery.condition = myQuery.createCondition({
            fieldId: 'custrecord_lmry_ste_ar_whtvpd_payment.subsidiary',
            operator: query.Operator.IS,
            values: [subsidiary]
        });
        const createColumnJoin = (myQuery,joinId) => myQuery.createColumn({ fieldId: joinId });
        const joinPayment = myQuery.autoJoin({ fieldId: 'custrecord_lmry_ste_ar_whtvpd_payment'});
        const joinVendor = myQuery.autoJoin({ fieldId: 'custrecord_lmry_ste_ar_whtvpd_vendor'});
        const joinStatusCode = myQuery.autoJoin({ fieldId: 'custrecord_lmry_ste_ar_whtvpd_status'});
        myQuery.columns = [
            myQuery.createColumn({ fieldId: 'custrecord_lmry_ste_ar_whtvpd_payment' }),     //0
            createColumnJoin(joinPayment,"tranid"),                                         //1
            createColumnJoin(joinPayment,"recordType"),                                     //2
            myQuery.createColumn({ fieldId: 'custrecord_lmry_ste_ar_whtvpd_vendor' }),      //3
            createColumnJoin(joinVendor,"email"),                                           //4
            createColumnJoin(joinVendor,"id"),                                              //5
            createColumnJoin(joinStatusCode,"custrecord_lmry_ste_procstatus_code"),          //6
            createColumnJoin(joinPayment,"id"), 
        ];

        let resultSet = myQuery.run();
        let results = resultSet.asMappedResults();

        results.forEach(function(result) {
            console.log(result)
            /*
            const statusCode = result[6];
            if (statusCode === "DONE") {
                const vendorID = result[5];
                const paymentID = result[7];

                if (!jsonData[vendorID]) {
                    jsonData[vendorID] = { payments: [], paymentIDs: new Set() };
                }

                if (!jsonData[vendorID].paymentIDs.has(paymentID)) {
                    jsonData[vendorID].paymentIDs.add(paymentID);
                    jsonData[vendorID].payments.push({
                        paymentID: paymentID,
                        tranID: result[0] || " - ",
                        recordType: result[2],
                        vendorID,
                        vendorName: result[3],
                        email: result[4],
                    });
                }
            }
                */
        });

        let payments = [];
        for (let vendorID in jsonData) {
            payments = payments.concat(jsonData[vendorID].payments);
        }
        return payments;
    } catch (e) {
        console.error('Error', e);
    }
}

getVendorPaymentDetails()