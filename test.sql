SELECT
    BUILTIN.DF(TransactionAccountingLine.Account) AS Account,
    TransactionAccountingLine.Account,
    TransactionAccountingLine.Debit / Transaction.ExchangeRate AS DebitInTransactionCurrency,
    TransactionAccountingLine.Credit / Transaction.ExchangeRate AS CreditInTransactionCurrency,
    TransactionAccountingLine.Posting,
    TransactionLine.Memo,
    TransactionLine.id,
    TransactionLine.Transaction
FROM
    accountingbook,
    TransactionLine,
    TransactionAccountingLine,
    Transaction
WHERE
    TransactionLine.Transaction = TransactionAccountingLine.Transaction
    AND TransactionAccountingLine.Transaction = Transaction.ID
    AND accountingbook.isprimary = 'T'
    AND TransactionAccountingLine.accountingbook = accountingbook.id
    AND TransactionLine.id = '0'
    AND TransactionAccountingLine.Transaction = '" + recordId + "'
    AND (
        TransactionAccountingLine.Debit IS NOT NULL
        OR TransactionAccountingLine.Credit IS NOT NULL
    )
ORDER BY
    TransactionLine.ID;

SELECT
    BUILTIN.DF(TransactionAccountingLine.Account) AS Account,
    TransactionAccountingLine.Account,
    TransactionAccountingLine.Debit / Transaction.ExchangeRate AS DebitInTransactionCurrency,
    TransactionAccountingLine.Credit / Transaction.ExchangeRate AS CreditInTransactionCurrency,
    TransactionAccountingLine.Posting,
    TransactionLine.Memo,
    TransactionLine.id,
    TransactionLine.Transaction,
    accountingbook.id AS book,
    Transaction.Currency AS TransactionCurrency,
    Transaction.ExchangeRate AS ExchangeRate
FROM
    accountingbook,
    TransactionLine,
    TransactionAccountingLine,
    Transaction
WHERE
    TransactionLine.Transaction = TransactionAccountingLine.Transaction
    AND TransactionAccountingLine.Transaction = Transaction.ID
    AND accountingbook.isprimary = 'T'
    AND TransactionAccountingLine.accountingbook = accountingbook.id
    AND TransactionLine.id = '0'
    AND TransactionAccountingLine.Transaction = '" + recordId + "'
    AND (
        TransactionAccountingLine.Debit IS NOT NULL
        OR TransactionAccountingLine.Credit IS NOT NULL
    )
ORDER BY
    TransactionLine.ID;