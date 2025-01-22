SELECT
    BUILTIN.DF(TransactionAccountingLine.Account) AS Account,
    TransactionAccountingLine.Account,
    TransactionAccountingLine.Debit,
    TransactionAccountingLine.Credit,
    TransactionLine.class,
    TransactionLine.department,
    TransactionLine.location
FROM
    accountingbook,
    TransactionLine,
    TransactionAccountingLine
WHERE
    TransactionLine.Transaction = TransactionAccountingLine.Transaction
    AND TransactionAccountingLine.accountingbook = accountingbook.id
    AND accountingbook.isprimary = 'T'
    AND TransactionLine.id = '0'
    AND TransactionAccountingLine.Transaction = '1198010'
    AND (
        TransactionAccountingLine.Debit IS NOT NULL
        OR TransactionAccountingLine.Credit IS NOT NULL
    )
ORDER BY
    TransactionLine.ID