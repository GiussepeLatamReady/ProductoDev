const transaction = {
   id: "3906039",
   wht: {
      "ica": {},
      "iva": {},
      "fte": {},
      "cree": {}
   },
   recordtype: "vendorbill",
   items: {
      13989955: {
         id: "387",
         amount: 36,
         lineuniquekey: "13989955",
         account:205,
         itemType: "InvtPart"
      },
      13989956: {
         id: "387",
         amount: 36,
         lineuniquekey: "13989956",
         account:205,
         itemType: "InvtPart"
      }
   },
   taxResults: {
      401163: {
         id: "401163",
         subtype: "Auto ReteICA",
         lineunikey: "13989955"
      },
      401164: {
         id: "401164",
         subtype: "Auto ReteCREE",
         lineunikey: "13989955"
      },
      401165: {
         id: "401165",
         subtype: "Auto ReteIVA",
         lineunikey: "13989955"
      },
      401166: {
         id: "401166",
         subtype: "Auto ReteFTE",
         lineunikey: "13989955"
      },
      401167: {
         id: "401167",
         subtype: "Auto ReteICA",
         lineunikey: "13989956"
      },
      401168: {
         id: "401168",
         subtype: "Auto ReteCREE",
         lineunikey: "13989956"
      },
      401169: {
         id: "401169",
         subtype: "Auto ReteIVA",
         lineunikey: "13989956"
      },
      401170: {
         id: "401170",
         subtype: "Auto ReteFTE",
         lineunikey: "13989956"
      }
   },
   relatedRecords: [
      {
         id: "3906042",
         tranid: "JOU00033566",
         trandate: "2023-08-02T07:00:00.000Z",
         memo: "Latam - CO WHT (Lines) - Auto ReteICA",
         amount: "0.001044",
         subtypeKey: "Retention name not found"
      },
      {
         id: "3906043",
         tranid: "JOU00033567",
         trandate: "2023-08-02T07:00:00.000Z",
         memo: "Latam - CO WHT (Lines) - Auto ReteCREE",
         amount: "0.001044",
         subtypeKey: "Retention name not found"
      },
      {
         id: "3906044",
         tranid: "JOU00033568",
         trandate: "2023-08-02T07:00:00.000Z",
         memo: "Latam - CO WHT (Lines) - Auto ReteIVA",
         amount: "0.002088",
         subtypeKey: "Retention name not found"
      },
      {
         id: "3906045",
         tranid: "JOU00033569",
         trandate: "2023-08-02T07:00:00.000Z",
         memo: "Latam - CO WHT (Lines) - Auto ReteFTE",
         amount: "0.000522",
         subtypeKey: "Retention name not found"
      }
   ]
}


const assignRetentionToTaxResults = transaction => {
   const { taxResults, relatedRecords } = transaction;

   Object.values(taxResults).forEach(taxResult => {
       const matchingRecord = relatedRecords.find(record => record.memo.includes(taxResult.subtype));

       if (matchingRecord) {
           taxResult.retentionApplied = matchingRecord.id;
       }
   });

   return transaction;
};

console.log(assignRetentionToTaxResults(transaction));

{
   id: '3906039',
   wht: { ica: {}, iva: {}, fte: {}, cree: {} },
   recordtype: 'vendorbill',
   items: {
     '13989955': {
       id: '387',
       amount: 36,
       lineuniquekey: '13989955',
       account: 205,
       itemType: 'InvtPart'
     },
     '13989956': {
       id: '387',
       amount: 36,
       lineuniquekey: '13989956',
       account: 205,
       itemType: 'InvtPart'
     }
   },
   taxResults: {
     '401163': {
       id: '401163',
       subtype: 'Auto ReteICA',
       lineunikey: '13989955',
       retentionApplied: '3906042'
     },
     '401164': {
       id: '401164',
       subtype: 'Auto ReteCREE',
       lineunikey: '13989955',
       retentionApplied: '3906043'
     },
     '401165': {
       id: '401165',
       subtype: 'Auto ReteIVA',
       lineunikey: '13989955',
       retentionApplied: '3906044'
     },
     '401166': {
       id: '401166',
       subtype: 'Auto ReteFTE',
       lineunikey: '13989955',
       retentionApplied: '3906045'
     },
     '401167': {
       id: '401167',
       subtype: 'Auto ReteICA',
       lineunikey: '13989956',
       retentionApplied: '3906042'
     },
     '401168': {
       id: '401168',
       subtype: 'Auto ReteCREE',
       lineunikey: '13989956',
       retentionApplied: '3906043'
     },
     '401169': {
       id: '401169',
       subtype: 'Auto ReteIVA',
       lineunikey: '13989956',
       retentionApplied: '3906044'
     },
     '401170': {
       id: '401170',
       subtype: 'Auto ReteFTE',
       lineunikey: '13989956',
       retentionApplied: '3906045'
     }
   },
   relatedRecords: [
     {
       id: '3906042',
       tranid: 'JOU00033566',
       trandate: '2023-08-02T07:00:00.000Z',
       memo: 'Latam - CO WHT (Lines) - Auto ReteICA',
       amount: '0.001044',
       subtypeKey: 'Retention name not found'
     },
     {
       id: '3906043',
       tranid: 'JOU00033567',
       trandate: '2023-08-02T07:00:00.000Z',
       memo: 'Latam - CO WHT (Lines) - Auto ReteCREE',
       amount: '0.001044',
       subtypeKey: 'Retention name not found'
     },
     {
       id: '3906044',
       tranid: 'JOU00033568',
       trandate: '2023-08-02T07:00:00.000Z',
       memo: 'Latam - CO WHT (Lines) - Auto ReteIVA',
       amount: '0.002088',
       subtypeKey: 'Retention name not found'
     },
     {
       id: '3906045',
       tranid: 'JOU00033569',
       trandate: '2023-08-02T07:00:00.000Z',
       memo: 'Latam - CO WHT (Lines) - Auto ReteFTE',
       amount: '0.000522',
       subtypeKey: 'Retention name not found'
     }
   ]
 }