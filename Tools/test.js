
let runtime; require(["N/runtime"], function (runt) { runtime = runt; });
let search; require(["N/search"], function (sear) { search = sear; });
let format; require(["N/format"], function (form) { format = form; });
let record; require(["N/record"], function (recor) { record = recor; });
let currentRecord; require(["N/currentRecord"], function (current) { currentRecord = current; })
const features = {
    subsidiary: runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" }),
    multibook: runtime.isFeatureInEffect({ feature: "MULTIBOOK" }),
    accountMapping: runtime.isFeatureInEffect({ feature: "Coaclassificationmanagement" }),
    department: runtime.isFeatureInEffect({ feature: 'DEPARTMENTS' }),
    _class: runtime.isFeatureInEffect({ feature: 'CLASSES' }),
    location: runtime.isFeatureInEffect({ feature: 'LOCATIONS' })
}

const setTaxAccounts = (transactionId, type) => {

    const currentRecord = record.load({ type, id: transactionId });
    const jsonTaxAccounts = getTaxAccount(currentRecord);
    const SUBLISTS = ['expense', 'item', 'line'];
    for (let s = 0; s < SUBLISTS.length; s++) {
        let sublistId = SUBLISTS[s];
        let count = currentRecord.getLineCount({ sublistId: sublistId }) || 0;
        for (let line = 0; line < count; line++) {
            let lineuniquekey = currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: 'lineuniquekey',
                line: line
            });
            const taxAccounts = jsonTaxAccounts[lineuniquekey];
            if (taxAccounts && Object.keys(taxAccounts).length) {
                currentRecord.setSublistValue({
                    sublistId, fieldId: "custcol_lr_co_tax_accounts", line, value: JSON.stringify(taxAccounts)
                });
            }

        }
    }

    currentRecord.save({ ignoreMandatoryFields: true, enableSourcing: false, disableTriggers: true });;

}

const getTaxAccount = (transactionRecord) => {
    try {
        const transactionId = transactionRecord.id;
        console.log("transactionRecord", transactionRecord)
        console.log("features", features)
        console.log("transactionId", transactionId)
        console.log("transactionRecord.type", transactionRecord.type)
        const typeTransaction = String(transactionRecord.type || '').toLowerCase();
        const isSalesType = new Set(['invoice', 'creditmemo']).has(typeTransaction);
        console.log("isSalesType", isSalesType)
        let subsidiaryId;
        if (features?.subsidiary) {
            subsidiaryId = transactionRecord.getValue({ fieldId: 'subsidiary' });
        }
        console.log("subsidiaryId", subsidiaryId)
        const accountingBooks = features.multibook ? getAccountingBooks(subsidiaryId) : ["1"];
        console.log("accountingBooks", accountingBooks)
        let dateTransaction = transactionRecord.getValue({ fieldId: 'trandate' });
        dateTransaction = format.format({ value: dateTransaction, type: format.Type.DATE })
        console.log("dateTransaction", dateTransaction)
        console.log("dateTransaction typeof", typeof dateTransaction)
        let mappingBySource = {};
        if (features?.accountMapping) {
            mappingBySource = obtainsAccounts(subsidiaryId, dateTransaction);
        }
        console.log("mappingBySource", mappingBySource)
        // Definición simple de columnas
        const columnsSearch = [
            'item',
            'account',
            'taxcode',
            'lineuniquekey',
            'taxItem.saleaccount',
            'taxItem.purchaseaccount'
        ];

        if (features?.department) columnsSearch.push('department');
        if (features?._class) columnsSearch.push('class');
        if (features?.location) columnsSearch.push('location');

        // Búsqueda
        const jsonTaxAccounts = {};
        search.create({
            type: search.Type.TRANSACTION,
            filters: [
                ['mainline', 'is', 'F'],
                'AND',
                ['internalid', 'anyof', transactionId]
            ],
            columns: columnsSearch
        }).run().each(r => {
            const item = r.getValue('item');
            const account = r.getValue('account');
            const taxcode = r.getValue('taxcode');
            const expenseAccount = r.getValue('custcol_nondeductible_account');
            const saleAccount = r.getValue(r.columns[4]);
            const purchaseAccount = r.getValue(r.columns[5]);
            const lineuniquekey = r.getValue('lineuniquekey');

            const line = {
                item,
                account,
                expenseAccount,
                purchaseAccount,
                saleAccount,
                isSales: isSalesType,
                lineuniquekey
            };

            if (features?.department) line.department = r.getValue({ name: 'department' }) || '';
            if (features?._class) line._class = r.getValue({ name: 'class' }) || '';
            if (features?.location) line.location = r.getValue({ name: 'location' }) || '';


            if (!account || !taxcode) return true;

            if (!jsonTaxAccounts[lineuniquekey]) jsonTaxAccounts[lineuniquekey] = {};
            accountingBooks.forEach(accountingBook => {
                jsonTaxAccounts[lineuniquekey][accountingBook] = getAccount(
                    mappingBySource,
                    accountingBook,
                    line.isSales ? line.saleAccount : line.purchaseAccount,
                    line.department,
                    line._class,
                    line.location,
                    dateTransaction
                );
            })

            return true;
        });
        console.log("jsonTaxAccounts:", jsonTaxAccounts)
        return jsonTaxAccounts;
    } catch (error) {
        console.log("error: [getLineTransaction]", error)
        return {};
    }

};

const getAccountingBooks = (subsidiaryId) => {

    const accountingBooks = [];
    search.create({
        type: "accountingbook",
        filters:
            [
                ["subsidiary", "anyof", subsidiaryId],
                "AND",
                ["isadjustmentonly", "is", "F"]
            ],
        columns:
            ["internalid"]
    }).run().each(result => {
        accountingBooks.push(result.id)
        return true;
    });

    return accountingBooks;
}

const obtainsAccounts = (subsidiaryId, dateTransaction) => {

    const accountingBooks = getAccountingBooks(subsidiaryId);
    const filters = [
        search.createFilter({ name: 'effectivedate', operator: search.Operator.ONORBEFORE, values: dateTransaction }),
        search.createFilter({ name: 'accountingbook', operator: search.Operator.ANYOF, values: accountingBooks }),
        features.subsidiary && subsidiaryId && search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiaryId })
    ].filter(Boolean);

    console.log("filters", filters)
    const columns = [
        'internalid',
        'destinationaccount',
        'effectivedate',
        'enddate',
        'sourceaccount',
        'accountingbook',
        ...(features.department ? ['department'] : []),
        ...(features._class ? ['class'] : []),
        ...(features.location ? ['location'] : [])
    ].map(name => search.createColumn({ name }));

    console.log("columns", columns)

    const searchObj = search.create({
        type: 'globalaccountmapping',
        filters: filters,
        columns: columns
    });

    const mappingBySource = {};
    try {

        let pageData = searchObj.runPaged({ pageSize: 1000 });
        if (pageData) {
            pageData.pageRanges.forEach(function (pageRange) {
                let page = pageData.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {
                    const sourceAccountId = result.getValue({ name: 'sourceaccount' });
                    const accountingbookId = result.getValue({ name: 'accountingbook' });
                    if (!sourceAccountId) return;
                    if (!mappingBySource[accountingbookId]) mappingBySource[accountingbookId] = {};

                    mappingBySource[accountingbookId][sourceAccountId] = {
                        destinationAccountId: result.getValue({ name: 'destinationaccount' }),
                        enddate: result.getValue({ name: 'enddate' }),
                        effectivedate: result.getValue({ name: 'effectivedate' }),
                        ...(features.department && { department: result.getValue({ name: 'department' }) }),
                        ... (features._class && { _class: result.getValue({ name: 'class' }) }),
                        ...(features.location && { location: result.getValue({ name: 'location' }) })
                    };
                });
            });
        }
        console.log("mappingBySource i", mappingBySource)
        return mappingBySource;
    } catch (err) {
        console.log("err [obtainsAccounts]:", err)
        console.log("err obtainsAccounts:", err.stack)
        return {};
    }
};


const yyymmdd = (dateString) => {
    if (!dateString) return "";
    const dateObj = format.parse({ value: dateString, type: format.Type.DATE });

    if (isNaN(dateObj.getTime())) return "";

    const year = dateObj.getFullYear();
    let month = dateObj.getMonth() + 1;
    let day = dateObj.getDate();

    month = month < 10 ? `0${month}` : month;
    day = day < 10 ? `0${day}` : day;

    return `${year}${month}${day}`;
};

const getAccount = (mappingBySource, bookId, sourceAccountId, departmentId, classId, locationId, dateTransaction) => {
    try {
        if (!(mappingBySource?.[bookId]?.[sourceAccountId])) return sourceAccountId;

        const mapEntry = mappingBySource[bookId][sourceAccountId];
        if (!mapEntry) return sourceAccountId;

        const hasValue = (v) => v !== 0 && v != null && v !== '' && v !== '0';
        if (hasValue(mapEntry.department) && mapEntry.department != departmentId) return sourceAccountId;
        if (hasValue(mapEntry["_class"]) && mapEntry["_class"] != classId) return sourceAccountId;
        if (hasValue(mapEntry.location) && mapEntry.location != locationId) return sourceAccountId;

        const { enddate, destinationAccountId } = mapEntry;
        if (!enddate) return destinationAccountId;
        const txStr = dateTransaction && yyymmdd(dateTransaction);
        const endStr = yyymmdd(enddate);

        if (txStr && endStr && txStr <= endStr) return destinationAccountId;
        return sourceAccountId;
    } catch (err) {
        log.error({ title: 'getAccount', details: err });
        return sourceAccountId;
    }
};




obtainsAccounts("10", "02/06/2025")
console.log("features", features)



let recordObj = record.load({ id: "4371129", type: "vendorbill" });
setTaxAccounts("4371129","vendorbill");