function cargarEntity(type, subsidiary, juridicPerson, nroID, isvalidCuit, isOpenTransactions) {
    var filters = [
        search.createFilter({
            name: 'isinactive',
            operator: search.Operator.IS,
            values: 'F'
        }), search.createFilter({
            name: 'vatregnumber',
            operator: search.Operator.ISNOTEMPTY
        }),
        search.createFilter({
            name: 'custentity_lmry_digito_verificator',
            operator: search.Operator.ISNOTEMPTY
        })];

    var FEAT_SUBS = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
    var FEAT_MULTISUBS = runtime.isFeatureInEffect({
        feature: "multisubsidiarycustomer"
    });

    if (FEAT_SUBS == true || FEAT_SUBS == "T") {
        if (type == "customer") {
            if (FEAT_MULTISUBS == true || FEAT_MULTISUBS == "T") {
                filters.push(search.createFilter({
                    name: "internalid",
                    join: "msesubsidiary",
                    operator: search.Operator.ANYOF,
                    values: subsidiary
                }));
            } else {
                filters.push(search.createFilter({
                    name: "subsidiary",
                    operator: search.Operator.ANYOF,
                    values: subsidiary
                }))

            }

        } else if (type == "vendor") {
            filters.push(search.createFilter({
                name: "internalid",
                join: "msesubsidiary",
                operator: search.Operator.ANYOF,
                values: subsidiary
            }));
        }


    }

    filters.push(search.createFilter({
        name: "custentity_lmry_ar_no_create_cc",
        operator: search.Operator.IS,
        values: false
    }));

    if (Number(juridicPerson)) {
        filters.push(search.createFilter({
            name: 'custentity_lmry_ar_cuitc_tsuj',
            operator: search.Operator.IS,
            values: juridicPerson
        }));
    }
    if (Number(nroID)) {
        filters.push(
            search.createFilter({
                name: 'internalid',
                operator: 'is',
                values: nroID
            })
        );
    }
    if (isvalidCuit === 'T') {
        filters.push(
            search.createFilter({
                name: 'custentity_lmry_arba_cuit_invalid',
                operator: 'is',
                values: false
            })
        );
    }
    if (isOpenTransactions === 'T') {
        filters.push(
            search.createFilter({
                name: 'status',
                join: 'transaction',
                operator: 'anyof',
                values: ['VendBill:A', 'CustCred:A', 'CustInvc:A']
            })
        );
    }
    if (type === 'vendor') {
        filters.push(
            search.createFilter({
                name: 'custentity_lmry_ar_cuitc',
                operator: 'is',
                values: '61'
            })
        );
        filters.push(
            search.createFilter({
                name: 'custentity_lmry_ar_tiporespons',
                operator: search.Operator.NONEOF,
                values: '5'
            })
        );
        filters.push(
            search.createFilter({
                name: 'custentity_lmry_ar_vendor_nivel',
                operator: 'anyof',
                values: ['@NONE@', '5']
            })
        );
    }
    if (type === 'customer') {
        filters.push(
            search.createFilter({
                name: 'custentity_lmry_ar_tiporespons',
                operator: search.Operator.NONEOF,
                values: ['5', '7']
            })
        );
        filters.push(
            search.createFilter({
                name: 'isdefaultbilling',
                join: "address",
                operator: search.Operator.IS,
                values: 'T'
            })
        );
    }

    filters.push(
        search.createFilter({
            name: 'formulanumeric',
            formula: 'LENGTH({vatregnumber})+LENGTH({custentity_lmry_digito_verificator})',
            operator: search.Operator.EQUALTO,
            values: 11
        })
    );
    filters.push(
        search.createFilter({
            name: 'formulanumeric',
            formula: `REGEXP_INSTR({vatregnumber} , '^([0-9]){9}\\d')`,
            operator: search.Operator.EQUALTO,
            values: 1
        })
    );
    filters.push(
        search.createFilter({
            name: 'formulanumeric',
            formula: `REGEXP_INSTR({custentity_lmry_digito_verificator} , '^([0-9]){0}\\d')`,
            operator: search.Operator.EQUALTO,
            values: 1
        })
    );
    const columns = [
        search.createColumn({
            name: 'internalid',
            sort: search.Sort.ASC
        }),
        'vatregnumber',
        'custentity_lmry_digito_verificator',
        'custentity_lmry_ar_tiporespons'
    ];
    if (type === 'customer') {
        columns.push('address.state', 'address.city', 'address.isdefaultbilling', 'address.custrecord_lmry_addr_city');
    }
    let VendSearch = search.create({
        type: type,
        columns: columns,
        filters: filters
    });
    const pagedData = VendSearch.runPaged({ pageSize: 1000 });
    const entitys = [];

    // iterate the pages
    pagedData.pageRanges.forEach((pageRange, i) => {
        const currentPage = pagedData.fetch(i);
        currentPage.data.forEach(function (result) {
            const entityParse = {
                internalid: result.getValue('internalid'),
                vatregnumber: result.getValue('vatregnumber'),
                custentity_lmry_digito_verificator: result.getValue('custentity_lmry_digito_verificator'),
                typeEntity: type,
                responsibleType: result.getValue('custentity_lmry_ar_tiporespons')
            };
            if (type === 'customer') {
                if ((result.getText('address.custrecord_lmry_addr_city') || '').trim().length > 0) {
                    entityParse.stateBuenosAires = result.getText('address.custrecord_lmry_addr_city').toUpperCase().indexOf('CIUDAD AUTONOMA BUENOS AIRES') !== -1;
                } else {
                    const useBuenosAires =
                        (result.getText({ name: 'state', join: "address" }) || '').toUpperCase().indexOf('CIUDAD AUTONOMA BUENOS AIRES') !== -1 ||
                        (result.getValue({ name: 'city', join: "address" }) || '').toUpperCase().indexOf('CIUDAD AUTONOMA BUENOS AIRES') !== -1
                    entityParse.stateBuenosAires = useBuenosAires;
                }

                // entityParse.billcity = ;
                // entityParse.isdefaultbilling = result.getValue('isdefaultbilling');
                // entityParse.state = (result.getValue('state') || '').toUpperCase();
            }
            entitys.push(entityParse);
        });
    });

    return entitys;
}

cargarEntity("vendor","7",1,3747,"F","F")