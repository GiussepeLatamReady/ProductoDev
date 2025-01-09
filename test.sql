SELECT
    BUILTIN.DF(TransactionAccountingLine.Account) AS Account,
    TransactionAccountingLine.Account,
    TransactionAccountingLine.Debit,
    TransactionAccountingLine.Credit,
    TransactionAccountingLine.Posting,
    TransactionLine.Memo,
    TransactionLine.id,
    TransactionLine.Transaction,
FROM
    accountingbook,
    TransactionLine,
    TransactionAccountingLine
where
    TransactionLine.Transaction = TransactionAccountingLine.Transaction
    and TransactionAccountingLine.accountingbook = accountingbook.id
    and accountingbook.isprimary = 'T'
    and TransactionLine.id = "0"
    and TransactionAccountingLine.Transaction = '4286427'
    and (
        TransactionAccountingLine.Debit IS NOT NULL
        or TransactionAccountingLine.Credit IS NOT NULL
    )
ORDER BY
    TransactionLine.ID