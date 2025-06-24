
//Credit memo
//beforeload
if (LMRY_country[0] === "MX") {
    var featPedimentos = MXPedimentos.isAutomaticPedimentos(subsidiary)
    if (featPedimentos && (runtime.executionContext == 'USERINTERFACE' && (context.type === "create" || context.type === "edit" || context.type === "copy" || context.type === "view"))) {
        MXPedimentos.showMXTransactionbyPedimentFields(form, recordObj.id, recordObj.type, type);
    }
}
//beforesubmit
if (LMRY_Result[0] == 'MX' && eventType == "delete") {
    MXPedimentos.deletePedimentoDetails(recordObj.id)
}


//aftersubmit

if (LMRY_countr[0] === 'MX') {
    const featPedimentos = MXPedimentos.isAutomaticPedimentos(subsidiary)
    if (featPedimentos) {
        if ((type === "create" || type === "edit" || type === "copy" || type === "view")) {
            MXPedimentos.createMXTransactionbyPediment(RCD_OBJ);
        }
        if (type == 'create' || type == 'edit') {

            var message = MXPedimentos.createPedimentos(RCD_OBJ.id,RCD_OBJ.id);
            if (typeof message != "object" && message.indexOf('Error')) {
                throw message;
            }
        }

    }
}