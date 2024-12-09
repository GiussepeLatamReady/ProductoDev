/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       20 ago 2014     LatamReady Consultor
 * File : LMRY_libSendingEmailsLBRY.js
 */
var Get_Context = nlapiGetContext();
/* Formato de las columnas de la tabla */
var colStyl = 'style=\"text-align: center; font-size: 9pt; font-weight:bold; color:white; background-color:#d50303; border: 1px solid #d50303; ';
var rowStyl = 'style=\"text-align: Left;   font-size: 9pt; font-weight:bold; border: 1px solid #d50303; ';
var errStyl = 'style=\"text-align: Left;   font-size: 9pt; font-weight:bold; color:red;border: 1px solid #d50303; ';

var width_td1 = " width:50%;\">";
var width_td2 = " width:50%;\">";

/* ------------------------------------------------------------------------------------------------------
 * Muestra los campos de columna filtrandos por el pais de la subsidiaria
 * custrecord_lmry_section = 3 va en el colummn transaction
 * --------------------------------------------------------------------------------------------------- */
function onViewColumn(Country) {
	// Cancelar Funcion
	return true;

	Country = DeleteChar(Country);

	/* Se realiza una busqueda para ver que campos se ocultan */
	var filters = new Array();
		filters[0] = new nlobjSearchFilter( 'custrecord_lmry_section', null, 'anyof', 3);
		filters[1] = new nlobjSearchFilter( 'custrecord_lmry_purchases', null, 'is', 'F');
	var columns = new Array();
		columns[0] = new nlobjSearchColumn('name');
		columns[1] = new nlobjSearchColumn('custrecord_lmry_country');
	var hidefields = nlapiSearchRecord( 'customrecord_lmry_fields', null, filters , columns );
	if (hidefields!=null && hidefields!='')
	{
		for(var i=0; i<hidefields.length; i++)
		{
			var namefield = hidefields[i].getValue('name');
			var counfield = hidefields[i].getText('custrecord_lmry_country');
				counfield = DeleteChar(counfield);
			// Valida Paises
			if ( counfield == Country )
			{
				onShowColumn( namefield );
			}
		}
	}
	return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Oculta los campos que se encuentran en el registro personalizado customrecord_lmry_fields
 * custrecord_lmry_section = 1 va en el body Entity
 * custrecord_lmry_section = 2 va en el body transaction
 * --- 			Notas importantes 			---
 * La funcion onFieldsHide() se encarga de ocultar los campos
 * personalizados LATAM (Estos campos son instalados con el bundle LatamReady
 * 37714), estos campos se encuentran configurados en el registro personalizado:
 * Name: LatamReady - Fields Hide - ID: customrecord_lmry_hide_fields
 * --------------------------------------------------------------------------------------------------- */
 function onFieldsHide(paramsection) {
	/* Se realiza una busqueda para ver que campos se ocultan */
	var filters = new Array();
		filters[0] = new nlobjSearchFilter( 'custrecord_lmry_hide_section', null, 'anyof', paramsection);
		filters[1] = new nlobjSearchFilter( 'isinactive', null, 'is', 'F');
	var columns = new Array();
		columns[0] = new nlobjSearchColumn('name');
	var hidefields = nlapiSearchRecord( 'customrecord_lmry_hide_fields', null, filters , columns );
	if (hidefields!=null && hidefields!='') {
		for(var i=0; i<hidefields.length; i++) {
			var namefield = hidefields[i].getValue('name');
			var sectfield = hidefields[i].getValue('custrecord_lmry_hide_section');
			// Oculta el campo
			if (sectfield==3){
				nlapiSetLineItemDisplay('expense',namefield, false );
				nlapiSetLineItemDisplay('item',namefield, false );
			} else {
				nlapiSetFieldDisplay(namefield, false );
			}
		}
	}

	return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Muestra los campos filtrandos por el pais de la subsidiaria
 * --- 			Notas importantes 			---
 * La funcion onFieldsDisplay() se encarga de mostrar los campos personalizados LATAM
 * (Estos campos son instalados con el bundle LatamReady 37714), estos campos se encuentran
 * configurados en el registro personalizado:
 * Name: LatamReady - Fields View - ID: customrecord_lmry_fields
 * en el segundo registro personalizado se configuran los campos a mostrar por
 * pais de subsidiaria.
 * --------------------------------------------------------------------------------------------------- */
function onFieldsDisplay(Country, paramsection) {
	Country = DeleteChar(Country);

	/* Se realiza una busqueda para ver que campos se ocultan */
	var filters = new Array();
		filters[0] = new nlobjSearchFilter( 'custrecord_lmry_section', 		null, 'anyof', 	paramsection);
	var columns = new Array();
		columns[0] = new nlobjSearchColumn('name');
		columns[1] = new nlobjSearchColumn('custrecord_lmry_country');
	var hidefields = nlapiSearchRecord( 'customrecord_lmry_fields', null, filters , columns );
	if (hidefields!=null && hidefields!='') {
		for(var i=0; i<hidefields.length; i++) {
			var namefield = hidefields[i].getValue('name');
			var counfield = hidefields[i].getText('custrecord_lmry_country');
				counfield = DeleteChar(counfield);
			// Valida Paises
			if ( counfield == Country ) {
				nlapiSetFieldDisplay(namefield, true );
			}
		}
	}
	return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Muestra los campos filtrandos por el pais de la subsidiaria en la Entidad
 * --------------------------------------------------------------------------------------------------- */
function onFieldsDisplayE(Country) {
	Country = DeleteChar(Country);

	/* Se realiza una busqueda para ver que campos se ocultan */
	var filters = new Array();
		filters[0] = new nlobjSearchFilter( 'custrecord_lmry_section', null, 'anyof', '1');
	var columns = new Array();
		columns[0] = new nlobjSearchColumn('name');
		columns[1] = new nlobjSearchColumn('custrecord_lmry_country');
	var hidefields = nlapiSearchRecord( 'customrecord_lmry_fields', null, filters , columns );
	if (hidefields!=null && hidefields!='') {
		for(var i=0; i<hidefields.length; i++) {
			var namefield = hidefields[i].getValue('name');
			var counfield = hidefields[i].getText('custrecord_lmry_country');
				counfield = DeleteChar(counfield);
			// Valida Paises
			if ( counfield == Country ) {
				nlapiSetFieldDisplay(namefield, true );
			}
		}
	}
	return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Muestra los campos filtrandos por el pais de la subsidiaria en la transaccion Cheque
 * --------------------------------------------------------------------------------------------------- */
function onFieldsDisplayBody(Country, custrecord) {
	try{
		Country = DeleteChar(Country);

		/* Se realiza una busqueda para ver que campos se ocultan */
		var filters = new Array();
			filters[0] = new nlobjSearchFilter( custrecord, null, 'is', 'T' );
		var columns = new Array();
			columns[0] = new nlobjSearchColumn('name');
			columns[1] = new nlobjSearchColumn('custrecord_lmry_country');
		var hidefields = nlapiSearchRecord( 'customrecord_lmry_fields', null, filters , columns );
		if (hidefields!=null && hidefields!='') {
			for(var i=0; i<hidefields.length; i++) {
				var namefield = hidefields[i].getValue('name');
				var counfield = hidefields[i].getText('custrecord_lmry_country');
					counfield = DeleteChar(counfield);
				// Valida Paises
				if ( counfield == Country ) {
					nlapiSetFieldDisplay(namefield, true );
				}
			}
		}
	} catch(err) {
		sendemail(' [ onFieldsDisplayBody ] ' +err, LMRY_script);
	}
}

/* ------------------------------------------------------------------------------------------------------
 * Transaction Sales Record
 * --------------------------------------------------------------------------------------------------- */
function onFieldsDisplayParent(Country, parent) {
	Country = DeleteChar(Country);

	/* Se realiza una busqueda para ver que campos se ocultan */
	var filters = new Array();
		filters[0] = new nlobjSearchFilter( 'custrecord_lmry_section', null, 'anyof', 2);
		filters[1] = new nlobjSearchFilter( 'custrecord_lmry_parent', null, 'anyof', parent);
	var columns = new Array();
		columns[0] = new nlobjSearchColumn('name');
		columns[1] = new nlobjSearchColumn('custrecord_lmry_country');
		columns[2] = new nlobjSearchColumn('custrecord_lmry_section');
	var hidefields = nlapiSearchRecord( 'customrecord_lmry_fields', null, filters , columns );
	if (hidefields!=null && hidefields!='') {
		for(var i=0; i<hidefields.length; i++) {
			var namefield = hidefields[i].getValue('name');
			var sectfield = hidefields[i].getValue('custrecord_lmry_section');
			var counfield = hidefields[i].getText('custrecord_lmry_country');
				counfield = DeleteChar(counfield);
			// Valida Paises
			if (counfield==Country) {
				nlapiSetFieldDisplay(namefield, true );
			}
		}
	}
	return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Transaction Sales Record
 * --------------------------------------------------------------------------------------------------- */
function onFieldsDisplayParent2(Country, parent) {
	Country = DeleteChar(Country);

	/* Se realiza una busqueda para ver que campos se ocultan */
	var filters = new Array();
		filters[0] = new nlobjSearchFilter( 'custrecord_lmry_section', null, 'anyof', 2);
		filters[1] = new nlobjSearchFilter( 'custrecord_lmry_parent_er', null, 'anyof', parent);
	var columns = new Array();
		columns[0] = new nlobjSearchColumn('name');
		columns[1] = new nlobjSearchColumn('custrecord_lmry_country');
	var hidefields = nlapiSearchRecord( 'customrecord_lmry_fields', null, filters , columns );
	if (hidefields!=null && hidefields!='') {
		for(var i=0; i<hidefields.length; i++) {
			var namefield = hidefields[i].getValue('name');
			var counfield = hidefields[i].getText('custrecord_lmry_country');
				counfield = DeleteChar(counfield);
			// Valida Paises
			if (counfield==Country) {
				nlapiSetFieldDisplay(namefield, true );
			}
		}
	}
	return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Transaction Sales Record
 * --------------------------------------------------------------------------------------------------- */
function onFieldsDisplayS(Country, parent) {
	Country = DeleteChar(Country);

	/* Se realiza una busqueda para ver que campos se ocultan */
	var filters = new Array();
		filters[0] = new nlobjSearchFilter( 'custrecord_lmry_section', null, 'anyof', [2,3] );
		filters[1] = new nlobjSearchFilter( 'custrecord_lmry_parent', null, 'anyof', parent);
	var columns = new Array();
		columns[0] = new nlobjSearchColumn('name');
		columns[1] = new nlobjSearchColumn('custrecord_lmry_country');
		columns[2] = new nlobjSearchColumn('custrecord_lmry_section');
	var hidefields = nlapiSearchRecord( 'customrecord_lmry_fields', null, filters , columns );
	if (hidefields!=null && hidefields!='') {
		for(var i=0; i<hidefields.length; i++) {
			var namefield = hidefields[i].getValue('name');
			var sectfield = hidefields[i].getValue('custrecord_lmry_section');
			var counfield = hidefields[i].getText('custrecord_lmry_country');
				counfield = DeleteChar(counfield);
			// Valida Paises
			if (counfield==Country) {
				nlapiSetFieldDisplay(namefield, true );
			}
		}
	}
	return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Valida que la sub subsidiaria se Peru
 * --------------------------------------------------------------------------------------------------- */
function Get_Country_STLT(subsidiari) {
var country = new Array();
	country[0] = '';
	country[1] = '-None-';

	try {
		// Valida la subsidiaira
		if ( subsidiari=='' || subsidiari==null ) {
			subsidiari = 0;
			return country;
		}

		var url = nlapiResolveURL('SUITELET', 'customscript_lmry_get_country_stlt', 'customdeploy_lmry_get_country_stlt')
				  + '&sub=' + subsidiari;
		var get = nlapiRequestURL(url);
		var bod = get.getBody();
			bod = bod.split(',');

		country[0] = _GetResult('Country Cod', bod[0] );
		country[1] = _GetResult('Country Des', bod[1] );
		country[1] = DeleteChar( country[1] );

	} catch(err) {
		sendemail(' [ Get_Country_STLT ] ' + err, LMRY_script);
	}

	nlapiLogExecution( 'ERROR', 'Get_Country_STLT', subsidiari + ',' + country);

	return country;
}

/* ------------------------------------------------------------------------------------------------------
 * Valida que la sub subsidiaria se Peru
 * --------------------------------------------------------------------------------------------------- */
function Validate_Country(subsidiari) {
var country = new Array();
	country[0] = '';
	country[1] = '-None-';

	try {
		// Valida la subsidiaria
		if ( subsidiari=='' || subsidiari==null ) {
			subsidiari = 0;
		}

		// Verifica si es One World
		var featuresubs = Get_Context.getFeature('SUBSIDIARIES');
		if ( featuresubs==true || featuresubs=='T' ) {
			if ( country!=0 ) {
				var filters = new Array();
					filters[0] = new nlobjSearchFilter( 'internalid', null, 'anyof', subsidiari );
				var columns = new Array();
					columns[0] = new nlobjSearchColumn('country');
				var getfields = nlapiSearchRecord( 'subsidiary', null, filters, columns );
				if (getfields!='' && getfields!=null) {
					country[0] = getfields[0].getValue('country');
					country[1] = getfields[0].getText('country');
				}
			}
		} else {
			country[0] = Get_Context.getSetting('SCRIPT', 'custscript_lmry_country_code_stlt');
			country[1] = Get_Context.getSetting('SCRIPT', 'custscript_lmry_country_desc_stlt');
		}
		country[1] = DeleteChar( country[1] );
	} catch(err) {
		sendemail(' [ Validate_Country ] ' + err, LMRY_script);
	}

	return country;
}

/* ------------------------------------------------------------------------------------------------------
 * Paises activos en el LatamReady Enabled Feature:
 * Custom Record : LatamReady - Setup Features ID : customrecord_latam_features
 * --------------------------------------------------------------------------------------------------- */
function getCountryOfAccess(arrCountry, licenses) {
	try {
		// Verifica que el arreglo este lleno
		if ( arrCountry.length<1 ) {
			return false;
		}

		var featureId = new Array();
		var featureAC = false;

		switch ( arrCountry[0] ) {
		case 'PE':
			// Localizacion de Peru
			featureId[0] = '1'; // Registro de Compras
			featureId[1] = '2'; // Registro de Ventas Electronico
			featureId[2] = '8'; // Numerador de comprobantes de Pago
			featureId[3] = '136'; // Localizacion de Peru
			break;
		case 'SV':
			// Localizacion de El Salvador
			featureId[0] = '6';
			break;
		case 'PA':
			// Localizacion de Panama - antes 7 Impresora fiscal ahora 137 Localizacion
			featureId[0] = '137';
			break;
		case 'MX':
			// Localizacion de Mexico
			featureId[0] = '20';
			break;
		case 'CR':
			// Localizacion de Costa Rica
			featureId[0] = '24';
			break;
		case 'CO':
			// Localizacion de Colombia
			featureId[0] = '26';
			break;
		case 'BO':
			// Localizacion de Bolivia
			featureId[0] = '37';
			break;
		case 'PY':
			// Localizacion de Paraguay
			featureId[0] = '38';
			break;
		case 'UY':
			// Localizacion de Uruguay
			featureId[0] = '39';
			break;
		case 'EC':
			// Localizacion de Ecuador
			featureId[0] = '42';
			break;
		case 'CL':
			// Localizacion de Chile
			featureId[0] = '98';
			break;
		case 'AR':
			// Localizacion de Argentina
			featureId[0] = '100';
			break;
		case 'GT':
			// Localizacion de Guatemala
			featureId[0] = '133';
			break;
		case 'BR':
			// Localizacion de Brasil
			featureId[0] = '140';
			break;
		default:
			featureId[0] = '0';
			break;
		}

		// Valida el Acceso
		if ( featureId.length>0 ) {

			// Valida varios Features de un mismo pais
			var intLength = featureId.length;
			var internali = 0;

			// Valida el arreglo
			for (var i = 0; i < intLength; i++) {
				internali = featureId[i];
				featureAC = getAuthorization( internali, licenses );

				// Si esta activo cualquiera de los Features
				if (featureAC==true){ break; }
			}
		}
	} catch(err) {
		sendemail(' [ getCountryOfAccess ] ' + err, LMRY_script);
	}

	nlapiLogExecution( 'ERROR', 'getCountryOfAccess', arrCountry[0] + ' - ' + featureId + ' - ' + featureAC);

	// Devuel si tiene acceso
	return featureAC;
}

/* ------------------------------------------------------------------------------------------------------
 * Valida el Enabled Feature y Duedate
 * --------------------------------------------------------------------------------------------------- */
function getAuthorization(featureId, licenses) {
	// Controlamos posibles errores
	try{
        if (licenses && licenses.length) {
          var type_obj = typeof licenses;

          if (type_obj != 'object') {
            var new_licenses = JSON.parse(licenses);
            return new_licenses && new_licenses.indexOf(Number(featureId)) > -1;
          } else {
            return licenses && licenses.indexOf(Number(featureId)) > -1;
          }

        } else {
          return false;
        }

	}catch(err){
		// Si se presenta erroe enviamos un mail
		sendemail(' [ getAuthorization ] ' + err);
	}
	return false;
}

/* ------------------------------------------------------------------------------------------------------
 * Extrae los valores obtenidos del arreglo
 * como se muestra a continuacion.
 * Ejemplo:
 * 			array[0]="Nombre Campo":"Valor"
 *  		field = "Nombre Campo"
 *  		strdata = array[0]
 * --------------------------------------------------------------------------------------------------- */
function _GetResult(field, strdata)
{
	try {
		var intpos = strdata.indexOf('=');
		var straux = strdata.substr(0,parseInt(intpos));
		var strcad = '';
		if (field==straux)
		{
			// Extrae la cadena desde (:) para adelante
			straux = strdata.substr(parseInt(intpos)+1);
			// Valida que el campo no de null
			if (straux=='null')
			{
				return '';
			}
			// Barre el resto de la cadena
			for (var pos=0; pos<straux.length; pos++)
			{
				if (straux[pos]!='"')
				{
					strcad += straux[pos];
				}
			}
			return strcad;
		}
	} catch(err) {
		sendemail(' [ _GetResult ] ' + err, LMRY_script);
	}
	return '';
}

/* ------------------------------------------------------------------------------------------------------
 * Borra las tildes
 * --------------------------------------------------------------------------------------------------- */
function DeleteChar(cad) {
	// Valida que el campo no este vacio
	if ( cad=='' || cad==null || cad=='undefined' ) {
		return '';
	}
	// Realiza un barrido de la cadena
	var str = cad.split('');
	var aux = '';
	for (var pos=0; pos<str.length; pos++) {
		var caden = str[pos];
		var ascii = caden.charCodeAt(0);
		switch (ascii) {
	    case 97:
	    	aux += 'a';
	        break;
	    case 225:
	    	aux += 'a';
	        break;
	    case 101:
	    	aux += 'e';
	        break;
	    case 233:
	    	aux += 'e';
	        break;
	    case 105:
	    	aux += 'i';
	        break;
	    case 237:
	    	aux += 'i';
	        break;
	    case 111:
	    	aux += 'o';
	        break;
	    case 243:
	    	aux += 'o';
	        break;
	    case 117:
	    	aux += 'u';
	        break;
	    case 250:
	    	aux += 'u';
	        break;
	    default:
	        aux += str[pos];
		}
	}

	// Devuelve la cadena
	return aux;
}

/* ------------------------------------------------------------------------------------------------------
 * Oculta los campos de columna de las transacciones
 * --------------------------------------------------------------------------------------------------- */
function onHiddenColumn() {
	// Cancelar Funcion
	return true;

	try {
	// toggle == show, hide
		if ( Get_Context.getExecutionContext() == 'userinterface' ) {
			// Oculta el detalle de la transaccion
			jQuery('.listtable')
		    .each( function( tblIdx, table ) {

		    	jQuery('.listheadertd', table )
		        .each( function( thIdx, th ) {
		            var label = jQuery( th ).attr( 'data-label' ) || ''
		              , keyword = 'LATAM - COL '
		              , regex = new RegExp( keyword, 'i' );

		            if ( label.match( regex ) ) {
		                jQuery( th ).hide();

		                jQuery( '.uir-machine-row', table ).each( function( trIdx, tr ) {
		                	jQuery( jQuery('td', tr )[ thIdx ] ).hide();
		                } );
		            }
		        } );
		    } );
			// Ingreso al procedimiento
			nlapiLogExecution('ERROR', 'onHiddenColumn', 'Oculta Columnas');
		}
	}catch(err) {
		sendemail(' [ onHiddenColumn ] ' + err, "Client Script");
	}
	return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Oculta los campos de columna de las transacciones
 * --------------------------------------------------------------------------------------------------- */
function onShowColumn(keyword) {
	// Cancelar Funcion
	return true;

	try {

		nlapiLogExecution("ERROR", 'onShowColumn', keyword);

		if ( Get_Context.getExecutionContext() == 'userinterface' ) {
			// Oculta el detalle de la transaccion
			jQuery('.listtable')
		    .each( function( tblIdx, table ) {

		    	jQuery('.listheadertd', table )
		        .each( function( thIdx, th ) {
		            var label = jQuery( th ).attr( 'data-label' ) || ''
		              , regex = new RegExp( keyword, 'i' );

		            if ( label.match( regex ) ) {
		                jQuery( th ).show();

		                jQuery( '.uir-machine-row', table ).each( function( trIdx, tr ) {
		                	jQuery( jQuery('td', tr )[ thIdx ] ).show();
		                } );
		            }
		        } );
		    } );
		}
	}catch(err) {
		sendemail(' [ onShowColumn ] ' + err, "Client Script");
	}
	return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Nota: Envio de mail al usuario.
 * 		 namereport = Nombre del reporte
 * 		 opc		= Opcion del mensaje
 * 		 msgreport  = Mensaje personalizado
 * --------------------------------------------------------------------------------------------------- */
function sendrptuser(namereport, opc, msgreport)
{
	nlapiLogExecution('ERROR', 'function sendrptuser' , namereport);

	// Dados del nlapiGetContext
	var namevers = Get_Context.getVersion();
	var namecomp = Get_Context.getCompany();
	var nameuser = Get_Context.getName();
	// Apis de Netsuite
	var namesubs = nlapiGetSubsidiary();
	// Verifica si es One World
	var featuresubs = Get_Context.getFeature('SUBSIDIARIES');
	if ( featuresubs==true || featuresubs=='T') {
		try {
			namesubs = nlapiLookupField('subsidiary', namesubs, 'name');
		}catch(err){
			namesubs = nlapiGetSubsidiary();
		}
	}

	// Datos del Usuario
	var userid = nlapiGetUser();

	nlapiLogExecution("ERROR","sendrptuser - userid", userid);

	var userfn = [ 'email', 'firstname' ];
	var employ = nlapiLookupField('employee', userid, userfn);
	if ( employ.email!='' && employ.email!=null)
	{
		var empema = employ.email;
	} else {
		nlapiLogExecution('ERROR', 'function sendrptuser' , 'Usuario no tiene correo');
		return true;
	}
	var empfir = employ.firstname;

	// Nombre Usuario y Correos
	nlapiLogExecution('ERROR', 'Param: userid, empfir, empema' , userid + ',' + empfir + ',' + empema);

	var datetime = new Date();

	var bmsg = '';
	bmsg += "<table style=\"font-family: Courier New, Courier, monospace; width:95%; border: 1px solid #d50303;\">";
		bmsg += "<tr>";
			bmsg += "<td " + colStyl + width_td1;
				bmsg += "Descripcion";
			bmsg += "</td>";
			bmsg += "<td " + colStyl + width_td2;
				bmsg += "Detalle";
			bmsg += "</td>";
		bmsg += "</tr>";
		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "Fecha y Hora";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += datetime;
			bmsg += "</td>";
		bmsg += "</tr>";
		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "NetSuite Version (Release)";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += namevers;
			bmsg += "</td>";
		bmsg += "</tr>";
		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "Codigo Cliente (Company)";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += namecomp;
			bmsg += "</td>";
		bmsg += "</tr>";
		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "Subsidiaria del Usuario (ID)";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += namesubs;
			bmsg += "</td>";
		bmsg += "</tr>";
		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "Nombre del Usuario (User) ";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += nameuser;
			bmsg += "</td>";
		bmsg += "</tr>";
	bmsg += "</table>";

	// Generacion txt y envio de email
	var subject = 'NS - Bundle Latinoamerica - Mensaje.';
	var body =  '<body text="#333333" link="#014684" vlink="#014684" alink="#014684">';
		body += '<table width="642" border="0" align="center" cellpadding="0" cellspacing="0">';
		body += '<tr>';
		body += '<td width="100%" valign="top">';
		body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
		body += '<tr>';
		body += '<td width="100%" colspan="2"><img style="display: block;" src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=921&c=TSTDRV1038915&h=c493217843d184e7f054" width="645" alt="main banner"/></td>';
		body += '</tr>';
		body += '</table>';
		body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
		body += '<tr>';
		body += '<td bgcolor="#d50303" width="15%">&nbsp;</td>';
		body += '<td bgcolor="#d50303" width="85%">';
		body += '<font style="color:#FFFFFF; line-height:130%; font-family:Arial, Helvetica, sans-serif; font-size:19px">';
		body += 'Estimado(a) ' + empfir + ':<br>';
		body += '</font>';
		body += '</td>';
		body += '</tr>';
		body += '<tr>';
		body += '<td width="100%" bgcolor="#d50303" colspan="2" align="right"><a href="http://www.latamready.com/#contac"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=923&c=TSTDRV1038915&h=3c7406d759735a1e791d" width="94" style="margin-right:45px" /></a></td>';
		body += '</tr>';
		body += '<tr>';
		body += '<td width="100%" bgcolor="#FFF" colspan="2" align="right">';
		body += '<a href="https://www.linkedin.com/company/9207808"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=924&c=TSTDRV1038915&h=c135e74bcb8d5e1ac356" width="15" style="margin:5px 1px 5px 0px" /></a>';
		body += '<a href="https://www.facebook.com/LatamReady-337412836443120/"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=919&c=TSTDRV1038915&h=9c937774d04fb76747f7" width="15" style="margin:5px 1px 5px 0px" /></a>';
		body += '<a href="https://twitter.com/LatamReady"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=928&c=TSTDRV1038915&h=fc69b39a8e7210c65984" width="15" style="margin:5px 47px 5px 0px" /></a>';
		body += '</td>';
		body += '</tr>';
		body += '</table>';
		body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
		body += '<tr>';
		body += '<td width="15%">&nbsp;</td>';
		body += '<td width="70%">';
		body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:13px">';
		body += '<p>Este es un mensaje automático de LatamReady SuiteApp.</p>';
		// Depende del parametro envia el mensaje
		if ( opc=='' || opc==null){
			body += '<p>El nombre del archivo generado es: </p>';
			body += '<p><b> - ' + namereport + '</b></p>';
		} else {
			switch (opc) {
		    case 2:
				body += '<p>' + msgreport + '</p>';
		        break;
		    case 3:
				body += '<p>' + msgreport + '</p>';
				body += '<p><b> - ' + namereport + '</b></p>';
		        break;
		    default:
			}
		}
		body += bmsg;
		body += '<p>Saludos,</p>';
		body += '<p>El Equipo de LatamReady</p>';
		body += '</font>';
		body += '</td>';
		body += '<td width="15%">&nbsp;</td>';
		body += '</tr>';
		body += '</table>';
		body += '<br>';
		body += '<table width="100%" border="0" cellspacing="0" cellpadding="2" bgcolor="#e5e6e7">';
		body += '<tr>';
		body += '<td>&nbsp;</td>';
		body += '</tr>';
		body += '<tr>';
		body += '<td width="15%">&nbsp;</td>';
		body += '<td width="70%" align="center">';
		body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:12px;" >';
		body += '<i>Este es un mensaje automático. Por favor, no responda este correo electrónico.</i>';
		body += '</font>';
		body += '</td>';
		body += '<td width="15%">&nbsp;</td>';
		body += '</tr>';
		body += '<tr>';
		body += '<td>&nbsp;</td>';
		body += '</tr>';
		body += '</table>';
		body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
		body += '<tr>';
		body += '<td width="15%">&nbsp;</td>';
		body += '<td width="70%" align="center">';
		body += '<a href="http://www.latamready.com/"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=926&c=TSTDRV1038915&h=e14f0c301f279780eb38" width="169" style="margin:15px 0px 15px 0px" /></a>';
		body += '</td>';
		body += '<td width="15%">&nbsp;</td>';
		body += '</tr>';
		body += '</table>';
		body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
		body += '<tr>';
		body += '<td width="15%">&nbsp;</td>';
		body += '<td width="70%" align="center">';
		body += '<a href="https://www.linkedin.com/company/9207808"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=925&c=TSTDRV1038915&h=41ec53b63dba135488be" width="101" style="margin:0px 5px 0px 5px" /></a>';
		body += '<a href="https://www.facebook.com/LatamReady-337412836443120/"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=920&c=TSTDRV1038915&h=7fb4d03fff9283e55318" width="101" style="margin:0px 5px 0px 5px" /></a>';
		body += '<a href="https://twitter.com/LatamReady"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=929&c=TSTDRV1038915&h=300c376863035d25c42a" width="101" style="margin:0px 5px 0px 5px" /></a>';
		body += '</td>';
		body += '<td width="15%">&nbsp;</td>';
		body += '</tr>';
		body += '</table>';
		body += '<table width="100%" border="0" cellspacing="0">';
		body += '<tr>';
		body += '<td>';
		body += '<img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=918&c=TSTDRV1038915&h=7f0198f888bdbb495497" width="642" style="margin:15px 0px 15px 0px" /></a>';
		body += '</td>';
		body += '</tr>';
		body += '</table>';
		body += '</td>';
		body += '</tr>';
		body += '</table>';
		body += '</body>';
	var bcc = new Array();
	var cco = new Array();

	// Api de Netsuite para enviar correo electronico
	nlapiSendEmail(userid, empema, subject, body, bcc, cco, null, null);

    return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Nota: Envio de mail al usuario en caso de ocurrir error.
 * --------------------------------------------------------------------------------------------------- */
function sendemail(err, LMRY_script)
{
	// Mensaje de error
	nlapiLogExecution('ERROR', LMRY_script, err);

	// Dados del nlapiGetContext
	var namevers = Get_Context.getVersion();
	var namecomp = Get_Context.getCompany();
	var nameuser = Get_Context.getName();
	var nameroce = Get_Context.getRoleCenter();
	var typeEnvironment = Get_Context.getEnvironment();
	var executionContext = Get_Context.getExecutionContext();
	var bundleId = Get_Context.getBundleId();
	var scriptId = Get_Context.getScriptId();

	// Buscar el nombre del Cliente
	// var customers = nlapiSearchRecord( 'customrecord_latam_customers' , null
	// 	  , [ new nlobjSearchFilter( 'custrecord_latam_customer_accountid', null, 'is', namecomp ) ]
	// 	  , [ new nlobjSearchColumn( 'name' )	]
	// 	);
	// if ( customers != '' && customers != null ) {
	// 	if ( customers.length > 0 ){
	// 		var customer   = customers[0];
	// 		namecomp += ' - ' + customer.getValue('name');
	// 	}
	// 	customers = null;
	// }

	// Apis de Netsuite
	var nametype = nlapiGetRecordType();
	var namerdid = nlapiGetRecordId();
	var namerole = nlapiGetRole();
	var namesubs = nlapiGetSubsidiary();

	// Verifica si es One World
	var featuresubs = Get_Context.getFeature('SUBSIDIARIES');
	var permSubsidiary = Get_Context.getPermission('LIST_SUBSIDIARY'); //Permiso para ver subsidiarias.
	if ((featuresubs==true || featuresubs=='T') && Number(permSubsidiary) > 0 ) {
			namesubs = nlapiLookupField('subsidiary', namesubs, 'name');
			namesubs = namesubs || nlapiGetSubsidiary();
	}else{
		namesubs = nlapiGetSubsidiary();
	}

	// Error
	err = '- ' + err;
	// Error por identificar
	if ( err.indexOf("object Object")>0 ) {
		// No se envia mail
		return true;
	}

	// Verificamos el tipo de error
	if ( err.indexOf("RCRD_HAS_BEEN_CHANGED")>0 ) {
		nlapiLogExecution('ERROR', LMRY_script, err);
		return true;
	}

	// Verificamos el tipo de error
	if ( err.indexOf("NetworkError: Failed to execute")>0 ) {
		// Mensaje al usuario
		err = "NetworkError: Se a produccido un error de conexion a internet ";
		err += "o se a cumplido el tiempo de espera de actividad en NetSuite. ";
		err += "Por favor vuelva ha iniciar sesion.";
	}

	// Verificamos que no sea session terminada
	if ( err.indexOf("SESSION_TIMED_OUT")>0 ) {
		// Mensaje al usuario
		err = "Session Timed Out: Se a cumplido el tiempo de espera de actividad en NetSuite. ";
		err += "Por favor vuelva ha iniciar sesion.";
	}

	// Datos del Usuario
	var userfn = [ 'email', 'firstname' ];
	var empema = Get_Context.getEmail();
	var empfir = Get_Context.getName();
	var userid = nlapiGetUser();

	if (userid < 0) {
		userid = Get_Context.getSetting('SCRIPT', 'custscript_lmry_employee_manager');
		if (userid) {
			//Se valida si tiene acceso a la tabla de empleados
			try {
				var employ = nlapiLookupField('employee', userid, userfn);
				empema = employ.email;
				empfir = empfir.firstname;
			}
			catch (msgerror) {
				nlapiLogExecution('ERROR', 'sendemail', msgerror);
				return true;
			}
		}
	}

	nlapiLogExecution("ERROR","sendemail - userid", userid);
	// Valida que el correo no este vacio
	if ( !empema )
	{
		nlapiLogExecution('ERROR', 'function sendemail' , 'Usuario no tiene correo');
		return true;
	}

	nlapiLogExecution("ERROR","sendemail - empema - empfir", empema + ' - ' + empfir);

	var datetime = new Date();

	var bmsg = '';
	bmsg += "<table style=\"font-family: Courier New, Courier, monospace; width:95%; border: 1px solid #d50303;\">";
		bmsg += "<tr>";
			bmsg += "<td " + colStyl + width_td1;
				bmsg += "Descripcion";
			bmsg += "</td>";
			bmsg += "<td " + colStyl + width_td2;
				bmsg += "Detalle";
			bmsg += "</td>";
		bmsg += "</tr>";
		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "Fecha y Hora";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += datetime;
			bmsg += "</td>";
		bmsg += "</tr>";

		//Ambiente
		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "Ambiente";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += typeEnvironment;
			bmsg += "</td>";
		bmsg += "</tr>";

		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "NetSuite Version (Release)";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += namevers;
			bmsg += "</td>";
		bmsg += "</tr>";
		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "Codigo Cliente (Company)";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += namecomp;
			bmsg += "</td>";
		bmsg += "</tr>";
		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "Subsidiaria del Usuario (ID)";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += namesubs;
			bmsg += "</td>";
		bmsg += "</tr>";
		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "Nombre de Usuario (User) ";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += nameuser;
			bmsg += "</td>";
		bmsg += "</tr>";
		// Verifica que este dentro de una transaccion
		if (nametype!='' && nametype!=null) {
			bmsg += "<tr>";
				bmsg += "<td " + rowStyl + width_td1;
					bmsg += "Tipo de Transaccion (Type) ";
				bmsg += "</td>";
				bmsg += "<td " + rowStyl + width_td2;
					bmsg += nametype;
				bmsg += "</td>";
			bmsg += "</tr>";
			bmsg += "<tr>";
				bmsg += "<td " + rowStyl + width_td1;
					bmsg += "Numero interno de la Transaccion (Internal ID) ";
				bmsg += "</td>";
				bmsg += "<td " + rowStyl + width_td2;
					bmsg += namerdid;
				bmsg += "</td>";
			bmsg += "</tr>";
		}
		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "Role Center (Role)";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += nameroce;
			bmsg += "</td>";
		bmsg += "</tr>";
		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "ID Rol del usuario (Role)";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += namerole;
			bmsg += "</td>";
		bmsg += "</tr>";

		//Execution Context
		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += "Execution Context";
			bmsg += "</td>";
			bmsg += "<td " + rowStyl + width_td2;
				bmsg += executionContext;
			bmsg += "</td>";
		bmsg += "</tr>";

		//Bundle ID
		if(bundleId){
			bmsg += "<tr>";
				bmsg += "<td " + rowStyl + width_td1;
					bmsg += "Bundle ID";
				bmsg += "</td>";
				bmsg += "<td " + rowStyl + width_td2;
					bmsg += bundleId;
				bmsg += "</td>";
			bmsg += "</tr>";
		}

		//Script ID
		if(scriptId){
			bmsg += "<tr>";
				bmsg += "<td " + rowStyl + width_td1;
					bmsg += "Script ID";
				bmsg += "</td>";
				bmsg += "<td " + rowStyl + width_td2;
					bmsg += scriptId;
				bmsg += "</td>";
			bmsg += "</tr>";
		}

		bmsg += "<tr>";
			bmsg += "<td " + rowStyl + width_td1;
				bmsg += 'Script ' + LMRY_script + '';
			bmsg += "</td>";
			bmsg += "<td " + errStyl + width_td2;
				bmsg += '<strong>' + err + '</strong>';
			bmsg += "</td>";
		bmsg += "</tr>";
	bmsg += "</table>";


	// Envio de email
	var subject = 'NS - Bundle Latinoamerica - User Error';
	var body =  '<body text="#333333" link="#014684" vlink="#014684" alink="#014684">';
		body += '<table width="642" border="0" align="center" cellpadding="0" cellspacing="0">';
		body += '<tr>';
		body += '<td width="100%" valign="top">';
		body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
		body += '<tr>';
		body += '<td width="100%" colspan="2"><img style="display: block;" src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=921&c=TSTDRV1038915&h=c493217843d184e7f054" width="645" alt="main banner"/></td>';
		body += '</tr>';
		body += '</table>';
		body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
		body += '<tr>';
		body += '<td bgcolor="#d50303" width="15%">&nbsp;</td>';
		body += '<td bgcolor="#d50303" width="85%">';
		body += '<font style="color:#FFFFFF; line-height:130%; font-family:Arial, Helvetica, sans-serif; font-size:19px">';
		body += 'Estimado(a) ' + empfir + ':<br>';
		body += '</font>';
		body += '</td>';
		body += '</tr>';
		body += '<tr>';
		body += '<td width="100%" bgcolor="#d50303" colspan="2" align="right"><a href="http://www.latamready.com/#contac"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=923&c=TSTDRV1038915&h=3c7406d759735a1e791d" width="94" style="margin-right:45px" /></a></td>';
		body += '</tr>';
		body += '<tr>';
		body += '<td width="100%" bgcolor="#FFF" colspan="2" align="right">';
		body += '<a href="https://www.linkedin.com/company/9207808"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=924&c=TSTDRV1038915&h=c135e74bcb8d5e1ac356" width="15" style="margin:5px 1px 5px 0px" /></a>';
		body += '<a href="https://www.facebook.com/LatamReady-337412836443120/"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=919&c=TSTDRV1038915&h=9c937774d04fb76747f7" width="15" style="margin:5px 1px 5px 0px" /></a>';
		body += '<a href="https://twitter.com/LatamReady"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=928&c=TSTDRV1038915&h=fc69b39a8e7210c65984" width="15" style="margin:5px 47px 5px 0px" /></a>';
		body += '</td>';
		body += '</tr>';
		body += '</table>';
		body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
		body += '<tr>';
		body += '<td width="15%">&nbsp;</td>';
		body += '<td width="70%">';
		body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:13px">';
		body += '<p>Este es un mensaje de error automático de LatamReady SuiteApp.</p>';
		body += '<p>El detalle es el siguiente:</p>';
		body += bmsg;
		body += '<p>Por favor, comunícate con nuestro departamento de Servicio al Cliente a: customer.care@latamready.com</p>';
		body += '<p>Nosotros nos encargamos.</p>';
		body += '<p>Saludos,</p>';
		body += '<p>El Equipo de LatamReady</p>';
		body += '</font>';
		body += '</td>';
		body += '<td width="15%">&nbsp;</td>';
		body += '</tr>';
		body += '</table>';
		body += '<br>';
		body += '<table width="100%" border="0" cellspacing="0" cellpadding="2" bgcolor="#e5e6e7">';
		body += '<tr>';
		body += '<td>&nbsp;</td>';
		body += '</tr>';
		body += '<tr>';
		body += '<td width="15%">&nbsp;</td>';
		body += '<td width="70%" align="center">';
		body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:12px;" >';
		body += '<i>Este es un mensaje automático. Por favor, no responda este correo electrónico.</i>';
		body += '</font>';
		body += '</td>';
		body += '<td width="15%">&nbsp;</td>';
		body += '</tr>';
		body += '<tr>';
		body += '<td>&nbsp;</td>';
		body += '</tr>';
		body += '</table>';
		body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
		body += '<tr>';
		body += '<td width="15%">&nbsp;</td>';
		body += '<td width="70%" align="center">';
		body += '<a href="http://www.latamready.com/"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=926&c=TSTDRV1038915&h=e14f0c301f279780eb38" width="169" style="margin:15px 0px 15px 0px" /></a>';
		body += '</td>';
		body += '<td width="15%">&nbsp;</td>';
		body += '</tr>';
		body += '</table>';
		body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
		body += '<tr>';
		body += '<td width="15%">&nbsp;</td>';
		body += '<td width="70%" align="center">';
		body += '<a href="https://www.linkedin.com/company/9207808"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=925&c=TSTDRV1038915&h=41ec53b63dba135488be" width="101" style="margin:0px 5px 0px 5px" /></a>';
		body += '<a href="https://www.facebook.com/LatamReady-337412836443120/"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=920&c=TSTDRV1038915&h=7fb4d03fff9283e55318" width="101" style="margin:0px 5px 0px 5px" /></a>';
		body += '<a href="https://twitter.com/LatamReady"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=929&c=TSTDRV1038915&h=300c376863035d25c42a" width="101" style="margin:0px 5px 0px 5px" /></a>';
		body += '</td>';
		body += '<td width="15%">&nbsp;</td>';
		body += '</tr>';
		body += '</table>';
		body += '<table width="100%" border="0" cellspacing="0">';
		body += '<tr>';
		body += '<td>';
		body += '<img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=918&c=TSTDRV1038915&h=7f0198f888bdbb495497" width="642" style="margin:15px 0px 15px 0px" /></a>';
		body += '</td>';
		body += '</tr>';
		body += '</table>';
		body += '</td>';
		body += '</tr>';
		body += '</table>';
		body += '</body>';
	var bcc = new Array();
	var cco = new Array();
		cco[0] = 'customer.voice@latamready.com';

	// Api de Netsuite para enviar correo electronico
	nlapiSendEmail(userid, empema, subject, body, bcc, cco, null, null);

    return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Imprime alertas en la pagina y las deja ahi. Para el ultimo paso de la secuencia
 * @param message
 * @param alert (true = muestra un icono de alerta, false = muestra en icono de confirmacion)
 * --------------------------------------------------------------------------------------------------- */
function show_on_screen_alert(message, alert)
{
	try
	{
		// Removing a specified element when knowing its parent node
/*		var element = document.getElementById("lmry_div_alert_1");
		if (element!='' && element!=null){
			while (element.firstChild) {
				  element.removeChild(element.firstChild);
				}
		}
		var element = document.getElementById("lmry_div_alert_2");
		if (element!='' && element!=null){
			while (element.firstChild) {
				  element.removeChild(element.firstChild);
				}
		}
*/
		// Mensaje dentro de la pantalla de Netsuite
	    if (alert) {
	        jQuery('<div id="lmry_div_alert_1">' +
	            '<div class="uir-alert-box warning conflictwarningdivdomid" width="undefined" style="">' +
	            '<div class="icon warning"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=576&c=TSTDRV1038915&h=afcac1eba8e3bbfc630e" alt="">' +
	            '</div><div class="content">' +
	            '<div class="title">LatamReady - Alerta:</div>' +
	            '<div class="descr">' + message + '</div></div></div></div>').insertBefore('#div__title');

	    } else {
	        jQuery('<div id="lmry_div_alert_2">' +
	            '<div class="uir-alert-box confirmation session_confirmation_alert" width="100%" style="">' +
	            '<div class="icon confirmation"><img src="https://tstdrv1038915.app.netsuite.com/core/media/media.nl?id=577&c=TSTDRV1038915&h=6fd5d72b69abf93869ab" alt="">' +
	            '</div><div class="content"><div class="title">LatamReady - Mensaje:</div>' +
	            '<div class="descr">' + message + '</div></div></div></div>').insertBefore('#div__title');
	    }
	} catch(err){
		sendemail(' [ show_on_screen_alert ] ' +err, LMRY_script);
	}
}

/* ------------------------------------------------------------------------------------------------------
 * Obtiene la lista de Features actuvo para la subsidiaria
 * @param subsidiary
 * --------------------------------------------------------------------------------------------------- */

function getLicenses(subsidiary) {
    //  var arraysalida = [];
    var arrayLicenses = [];

    // var url = nlapiResolveURL('SUITELET', 'customscript_lmry_get_enable_feat_stlt', 'customdeploy_lmry_get_enable_feat_stlt', true)
	//   + '&subsi=' + subsidiary;
    // var get = nlapiRequestURL(url);
    // var featuresEnabled = get.getBody();

	// Cambio el 2022.07.05
	var featuresEnabled = GetEnable_Feature30(subsidiary);

    var licensesFeatures;
    if (featuresEnabled != null && featuresEnabled != '') {
        licensesFeatures = JSON.parse(featuresEnabled);
        licensesFeatures.map(function (x) {
        arrayLicenses.push(parseInt(x));
        return true;
        });
    }
    return arrayLicenses;
}

/* ------------------------------------------------------------------------------------------------------
 * Obtiene la lista de Features actuvos para las subsidiarias
 * @param subsidiaries
 * --------------------------------------------------------------------------------------------------- */

function getLicensesMultiSubsi(subsidiaries) {
    if(subsidiaries.length < 1){
        return [];
    }
    //  var arraysalida = [];
    // var arrayLicenses = [];
    // var url = nlapiResolveURL('SUITELET', 'customscript_lmry_get_enable_feat_stlt', 'customdeploy_lmry_get_enable_feat_stlt', true)
	// 			  + '&subsi=' + subsidiaries.join('|');
    // var get = nlapiRequestURL(url);
    // var featuresEnabled = get.getBody();

	// Cambio el 2022.07.05
	var featuresEnabled = GetEnable_Feature30(subsidiaries.join('|'));

    var licensesFeatures;
    if (featuresEnabled != null && featuresEnabled != '') {
        licensesFeatures = JSON.parse(featuresEnabled);
        licensesFeatures.map(function (x) {
        arrayLicenses.push(parseInt(x));
        return true;
        });
    }
    return arrayLicenses;
}

function getAllLicenses() {
    var allLicenses = {};

    var filters = new Array();
		filters[0] = new nlobjSearchFilter( 'isinactive', 'custrecord_lmry_features_subsidiary', 'is', 'F');
		filters[1] = new nlobjSearchFilter( 'isinactive', null, 'is', 'F');
	var columns = new Array();
		columns[0] = new nlobjSearchColumn('custrecord_lmry_features_subsidiary');
    var features_active = nlapiSearchRecord( 'customrecord_lmry_features_by_subsi', null, filters , columns );


    var aux_feature = [];
    if (features_active && features_active.length) {
        for (var i = 0; i < features_active.length; i++) {
            var subsidiary = features_active[i].getValue('custrecord_lmry_features_subsidiary');
            aux_feature.push(subsidiary);
        }
    }

    if(aux_feature.length < 1){
        return {};
    }
    //  var arraysalida = [];

    // var url = nlapiResolveURL('SUITELET', 'customscript_lmry_get_enable_feat_stlt', 'customdeploy_lmry_get_enable_feat_stlt', true)
    //              + '&subsi=' + aux_feature.join('|') + '&json=T';
    // var get = nlapiRequestURL(url);
    // var featuresEnabled = get.getBody();

	// Cambio el 2022.07.05
	var featuresEnabled = GetEnable_Feature30(subsidiaries.join('|'), 'T');

    var licensesFeatures;
    if (featuresEnabled != null && featuresEnabled != '' && featuresEnabled != undefined) {
      licensesFeatures = JSON.parse(featuresEnabled);
      var arrayLicenses;
      for(var aux in licensesFeatures){
        arrayLicenses = [];
        licensesFeatures[aux].map(function (x) {
          arrayLicenses.push(parseInt(x));
          return true;
        });
        allLicenses[aux] = arrayLicenses;
      }

    } else{
        allLicenses = {};
    }
    return allLicenses;
}
 /* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||                                                              ||
||  Source : LMRY_libSendingEmailsLBRY_V2.0.js                 	||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 05 2022  LatamReady    Use Script 2.1           ||
||                                                              ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

/* ******************************************************
     * 2022.07.04 : Para dejar de utilizar el Suitelet
     * con la opcion VAILABLE WITHOUT LOGIN,
     *
     * ***************************************************** */
function GetEnable_Feature30(subsi, json) {
	try {

	  var Rd_Subsi = subsi;
	  var Rd_Json  = json;
	  var features;

	  nlapiLogExecution('DEBUG', '[GetEnable_Feature30] - d_Subsi',Rd_Subsi);
	  if(Rd_Subsi==null || Rd_Subsi==''){
		return JSON.stringify([]);
	  }

    if (typeof(Rd_Subsi) == "string"){
      Rd_Subsi = Rd_Subsi.split('|');
    }
	  nlapiLogExecution('DEBUG', '[GetEnable_Feature30] - Rd_Subsi2',Rd_Subsi);

      // Busqueda en 1.0
      var filters = new Array();
			filters[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
			filters[1] = new nlobjSearchFilter('custrecord_lmry_features_subsidiary', null, 'anyof', Rd_Subsi);

		var columns = new Array();
			columns[0] = new nlobjSearchColumn("custrecord_lmry_features_data");
			columns[1] = new nlobjSearchColumn("custrecord_lmry_features_crytpo");
			columns[2] = new nlobjSearchColumn('custrecord_lmry_features_subsidiary');

	  var searchFeatu = nlapiCreateSearch('customrecord_lmry_features_by_subsi',filters,columns);
	  var searchSetup = searchFeatu.runSearch().getResults(0,1000);

	  nlapiLogExecution('DEBUG', '[GetEnable_Feature30] - searchSetup',searchSetup);
	  if (searchSetup) {
		if(Rd_Json == 'T'){
		  features = {};
		  for(var i = 0 ; i < searchSetup.length; i++){
			var data = searchSetup[i].getValue('custrecord_lmry_features_data');
			var cryptoFeature = searchSetup[i].getValue('custrecord_lmry_features_crytpo');
			var subsi = searchSetup[i].getValue('custrecord_lmry_features_subsidiary');
			var createHash = encrypt('Features' + data);
			if (cryptoFeature == createHash) {
			  features[subsi] = data.split('\000');
			} else {
			  features = {};
			  break;
			}
		  }
		} else{
		  features = [];
		  for(var i = 0 ; i < searchSetup.length; i++){
			var data = searchSetup[i].getValue('custrecord_lmry_features_data');
			var cryptoFeature = searchSetup[i].getValue('custrecord_lmry_features_crytpo');
			var createHash = encrypt('Features' + data);
			if (cryptoFeature == createHash) {
			  features = features.concat(data.split('\000'));
			} else {
			  features = [];
			  break;
			}
		  }
		}


	  } else {
		if(Rd_Json == 'T'){
		  features = {};
		} else{
		  features = [];
		}
	  }

	  nlapiLogExecution('DEBUG', '[GetEnable_Feature30] - features',features);
	  // Dibuja el fomulario
	  return (JSON.stringify(features));

	} catch (err) {
		nlapiLogExecution('ERROR', '[GetEnable_Feature30] ', err);
    features = [];
	}
	return true;
}


 /* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
||                                                              ||
||  Source : LMRY_MD5_encript_LBRY_V2.0.js                    	||
||                                                              ||
||  Version Date         Author        Remarks                  ||
||  2.0     Jul 05 2022  LatamReady    Use Script 2.1           ||
||                                                              ||
 \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
    /**
     * Add integers, wrapping at 2^32.
     * This uses 16-bit operations internally to work around bugs in interpreters.
     *
     * @param {number} x First integer
     * @param {number} y Second integer
     * @returns {number} Sum
     */
	 function safeAdd(x, y) {
        var lsw = (x & 0xffff) + (y & 0xffff);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xffff);
    }

    /**
     * Bitwise rotate a 32-bit number to the left.
     *
     * @param {number} num 32-bit number
     * @param {number} cnt Rotation count
     * @returns {number} Rotated number
     */
    function bitRotateLeft(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt))
    }

    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} q q
     * @param {number} a a
     * @param {number} b b
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5cmn(q, a, b, x, s, t) {
        return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
    }
    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} a a
     * @param {number} b b
     * @param {number} c c
     * @param {number} d d
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5ff(a, b, c, d, x, s, t) {
        return md5cmn((b & c) | (~b & d), a, b, x, s, t)
    }
    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} a a
     * @param {number} b b
     * @param {number} c c
     * @param {number} d d
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5gg(a, b, c, d, x, s, t) {
        return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
    }
    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} a a
     * @param {number} b b
     * @param {number} c c
     * @param {number} d d
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5hh(a, b, c, d, x, s, t) {
        return md5cmn(b ^ c ^ d, a, b, x, s, t)
    }
    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} a a
     * @param {number} b b
     * @param {number} c c
     * @param {number} d d
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5ii(a, b, c, d, x, s, t) {
        return md5cmn(c ^ (b | ~d), a, b, x, s, t)
    }

    /**
     * Calculate the MD5 of an array of little-endian words, and a bit length.
     *
     * @param {Array} x Array of little-endian words
     * @param {number} len Bit length
     * @returns {Array<number>} MD5 Array
     */
    function binlMD5(x, len) {
        /* append padding */
        x[len >> 5] |= 0x80 << len % 32
        x[(((len + 64) >>> 9) << 4) + 14] = len

        var i
        var olda
        var oldb
        var oldc
        var oldd
        var a = 1732584193
        var b = -271733879
        var c = -1732584194
        var d = 271733878

        for (i = 0; i < x.length; i += 16) {
            olda = a
            oldb = b
            oldc = c
            oldd = d

            a = md5ff(a, b, c, d, x[i], 7, -680876936)
            d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
            c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
            b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
            a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
            d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
            c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
            b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
            a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
            d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
            c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
            b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
            a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
            d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
            c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
            b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)

            a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
            d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
            c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
            b = md5gg(b, c, d, a, x[i], 20, -373897302)
            a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
            d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
            c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
            b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
            a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
            d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
            c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
            b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
            a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
            d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
            c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
            b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)

            a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
            d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
            c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
            b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
            a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
            d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
            c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
            b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
            a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
            d = md5hh(d, a, b, c, x[i], 11, -358537222)
            c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
            b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
            a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
            d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
            c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
            b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)

            a = md5ii(a, b, c, d, x[i], 6, -198630844)
            d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
            c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
            b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
            a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
            d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
            c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
            b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
            a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
            d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
            c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
            b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
            a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
            d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
            c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
            b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)

            a = safeAdd(a, olda)
            b = safeAdd(b, oldb)
            c = safeAdd(c, oldc)
            d = safeAdd(d, oldd)
        }
        return [a, b, c, d]
    }

    /**
     * Convert an array of little-endian words to a string
     *
     * @param {Array<number>} input MD5 Array
     * @returns {string} MD5 string
     */
    function binl2rstr(input) {
        var i
        var output = ''
        var length32 = input.length * 32
        for (i = 0; i < length32; i += 8) {
            output += String.fromCharCode((input[i >> 5] >>> i % 32) & 0xff)
        }
        return output
    }

    /**
     * Convert a raw string to an array of little-endian words
     * Characters >255 have their high-byte silently ignored.
     *
     * @param {string} input Raw input string
     * @returns {Array<number>} Array of little-endian words
     */
    function rstr2binl(input) {
        var i
        var output = []
        output[(input.length >> 2) - 1] = undefined
        for (i = 0; i < output.length; i += 1) {
            output[i] = 0
        }
        var length8 = input.length * 8
        for (i = 0; i < length8; i += 8) {
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << i % 32
        }
        return output
    }

    /**
     * Calculate the MD5 of a raw string
     *
     * @param {string} s Input string
     * @returns {string} Raw MD5 string
     */
    function rstrMD5(s) {
        return binl2rstr(binlMD5(rstr2binl(s), s.length * 8))
    }

    /**
     * Calculates the HMAC-MD5 of a key and some data (raw strings)
     *
     * @param {string} key HMAC key
     * @param {string} data Raw input string
     * @returns {string} Raw MD5 string
     */
    function rstrHMACMD5(key, data) {
        var i
        var bkey = rstr2binl(key)
        var ipad = []
        var opad = []
        var hash
        ipad[15] = opad[15] = undefined
        if (bkey.length > 16) {
            bkey = binlMD5(bkey, key.length * 8)
        }
        for (i = 0; i < 16; i += 1) {
            ipad[i] = bkey[i] ^ 0x36363636
            opad[i] = bkey[i] ^ 0x5c5c5c5c
        }
        hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8)
        return binl2rstr(binlMD5(opad.concat(hash), 512 + 128))
    }

    /**
     * Convert a raw string to a hex string
     *
     * @param {string} input Raw input string
     * @returns {string} Hex encoded string
     */
    function rstr2hex(input) {
        var hexTab = '0123456789abcdef'
        var output = ''
        var x
        var i
        for (i = 0; i < input.length; i += 1) {
            x = input.charCodeAt(i)
            output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f)
        }
        return output
    }

    /**
     * Encode a string as UTF-8
     *
     * @param {string} input Input string
     * @returns {string} UTF8 string
     */
    function str2rstrUTF8(input) {
        return unescape(encodeURIComponent(input))
    }

    /**
     * Encodes input string as raw MD5 string
     *
     * @param {string} s Input string
     * @returns {string} Raw MD5 string
     */
    function rawMD5(s) {
        return rstrMD5(str2rstrUTF8(s))
    }
    /**
     * Encodes input string as Hex encoded string
     *
     * @param {string} s Input string
     * @returns {string} Hex encoded string
     */
    function hexMD5(s) {
        return rstr2hex(rawMD5(s))
    }
    /**
     * Calculates the raw HMAC-MD5 for the given key and data
     *
     * @param {string} k HMAC key
     * @param {string} d Input string
     * @returns {string} Raw MD5 string
     */
    function rawHMACMD5(k, d) {
        return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d))
    }
    /**
     * Calculates the Hex encoded HMAC-MD5 for the given key and data
     *
     * @param {string} k HMAC key
     * @param {string} d Input string
     * @returns {string} Raw MD5 string
     */
    function hexHMACMD5(k, d) {
        return rstr2hex(rawHMACMD5(k, d))
    }

    /**
     * Calculates MD5 value for a given string.
     * If a key is provided, calculates the HMAC-MD5 value.
     * Returns a Hex encoded string unless the raw argument is given.
     *
     * @param {string} string Input string
     * @param {string} [key] HMAC key
     * @param {boolean} [raw] Raw output switch
     * @returns {string} MD5 output
     */
    // 2022.07.05 - md5 x encrypt
    function encrypt(string, key, raw) {
        if (!key) {
            if (!raw) {
                return hexMD5(string)
            }
            return rawMD5(string)
        }
        if (!raw) {
            return hexHMACMD5(key, string)
        }
        return rawHMACMD5(key, string)
    }
