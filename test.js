console.log('Prueba [activate_fe]');

function activate_fe_optimizado(fe_countr, licenses) {
    var authorizations_fe = {
        'AR': 246,
        'BO': 247,
        'BR': 248,
        'CL': 249,
        'CO': 250,
        'CR': 251,
        'EC': 252,
        'SV': 253,
        'GT': 254,
        'MX': 255,
        'PA': 256,
        'PY': 257,
        'PE': 258,
        'UY': 259,
        'NI': 407,
        'DO': 400
    };

    var autfe = authorizations_fe[fe_countr[0]] ? Library_Mail.getAuthorization(authorizations_fe[fe_countr[0]], licenses) : false;
    fe_countr.push(autfe);
    return fe_countr;
}


function activate_fe_original(fe_countr, licenses) {
    var autfe = false;
    var authorizations_fe = {
        'AR': 246,
        'BO': 247,
        'BR': 248,
        'CL': 249,
        'CO': 250,
        'CR': 251,
        'EC': 252,
        'SV': 253,
        'GT': 254,
        'MX': 255,
        'PA': 256,
        'PY': 257,
        'PE': 258,
        'UY': 259,
        'NI': 407,
        'DO': 400
    };

    if (authorizations_fe[fe_countr[0]]) {
        autfe = Library_Mail.getAuthorization(authorizations_fe[fe_countr[0]], licenses);
    }

    if (autfe == true) {
        fe_countr.push(true);
    } else {
        fe_countr.push(false);
    }
    return fe_countr;
}

console('[activate_fe]:',activate_fe_optimizado())