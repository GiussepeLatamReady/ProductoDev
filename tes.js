const transaformIds = (ids) => {

    let idsTransform = ids.split(",")
    const jsonIdsTypes = {
        16: 'creditmemo',
        17: 'invoice',
        32: 'itemreceipt',
        20: 'itemfulfillment',
        7: 'vendorbill',
        10: 'vendorcredit'
    }

    idsTransform = idsTransform.map(id => jsonIdsTypes[id] );
    
    return idsTransform.toString();
}



console.log(transaformIds("7,10,16,17,20,32"));