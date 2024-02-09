{
    id: "3907739",
    wht: {
       ica: {
          id: "123",
          name: "AutoReteICA10%",
          rate: 0.1,
          salesbase: "subtotal",
          puchasebase: "subtotal",
          subtype: "ReteICA",
          subtypeId: "19",
          relatedTransactionId: "3952026"
       },
       iva: {
          id: "120",
          name: "AutoReteIVA 5%",
          rate: 0.05,
          salesbase: "subtotal",
          puchasebase: "subtotal",
          subtype: "ReteIVA",
          subtypeId: "18",
          relatedTransactionId: "3952027"
       },
       fte: {
          id: "121",
          name: "AutoReteFTE25%",
          rate: 0.25,
          salesbase: "subtotal",
          puchasebase: "subtotal",
          subtype: "ReteFTE",
          subtypeId: "21",
          relatedTransactionId: "3952028"
       },
       "cree": {}
    },
    recordtype: "vendorcredit",
    total: 2010,
    taxtotal: 0,
    subtotal: 2010,
    exchangeRate: 1,
    items: {
       13995365: {
          id: "387",
          amount: 1000,
          lineuniquekey: "13995365",
          account:205,
          itemType: "InvtPart"
       },
       13995368: {
          id: "387",
          amount: 1000,
          lineuniquekey: "13995368",
          account:205,
          itemType: "InvtPart"
       }
    },
    expense: {
       14168827: {
          amount: 10,
          lineuniquekey: "14168827",
          account:1979
       }
    },
    relatedRecords: [
       {
          id: "3952026",
          tranid: "JOU04402309",
          trandate: "07/08/2023",
          memo: "Latam - WHT AutoReteICA10%",
          amount: "-201",
          subtypeKey: "ica"
       },
       {
          id: "3952027",
          tranid: "JOU04402310",
          trandate: "07/08/2023",
          memo: "Latam - WHT AutoReteIVA 5%",
          amount: "-100.5",
          subtypeKey: "iva"
       },
       {
          id: "3952028",
          tranid: "JOU04402311",
          trandate: "07/08/2023",
          memo: "Latam - WHT AutoReteFTE25%",
          amount: "-502.5",
          subtypeKey: "fte"
       }
    ]
 }