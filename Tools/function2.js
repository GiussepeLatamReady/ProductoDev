arregloAuxiliar[contadorAuxiliar] = tramo[0]; //0
arregloAuxiliar[contadorAuxiliar] += "|" + vendor;
arregloAuxiliar[contadorAuxiliar] += "|" + internalid;
arregloAuxiliar[contadorAuxiliar] += "|" + round(tax_rate, 6);
arregloAuxiliar[contadorAuxiliar] += "|" + ratio;
arregloAuxiliar[contadorAuxiliar] += "|" + parseFloat((parseFloat(aux_amount_remaining) * parseFloat(exchange_global)).toFixed(4)); //5
arregloAuxiliar[contadorAuxiliar] += "|" + parseFloat(Math.round(parseFloat(val) * 10000) / 10000); //6
arregloAuxiliar[contadorAuxiliar] += "|" + jurisdiccion_iib;
arregloAuxiliar[contadorAuxiliar] += "|" + tran_number[posicion];
arregloAuxiliar[contadorAuxiliar] += "|" + ccl_apli; //9
arregloAuxiliar[contadorAuxiliar] += "|" + taxcode_group_text;
arregloAuxiliar[contadorAuxiliar] += "|" + sub_type;
arregloAuxiliar[contadorAuxiliar] += "|" + acumulado_mensualmente; //12
arregloAuxiliar[contadorAuxiliar] += "|" + parseFloat((parseFloat(ccl_mini) * parseFloat(exchange_global)).toFixed(4));
arregloAuxiliar[contadorAuxiliar] += "|" + parseFloat((parseFloat(suma_global) * parseFloat(exchange_global)).toFixed(4)); //14
arregloAuxiliar[contadorAuxiliar] += "|" + amou_to_text; //15
arregloAuxiliar[contadorAuxiliar] += "|" + dobaseamount_text;
arregloAuxiliar[contadorAuxiliar] += "|" + parseFloat((parseFloat(maximo) * parseFloat(exchange_global)).toFixed(4)); //17
arregloAuxiliar[contadorAuxiliar] += "|" + parseFloat((parseFloat(setbaseretention) * parseFloat(exchange_global)).toFixed(4));
arregloAuxiliar[contadorAuxiliar] += "|" + bySubsidiary_text; //19
arregloAuxiliar[contadorAuxiliar] += "|" + parseFloat((parseFloat(minimonoimponible) * parseFloat(exchange_global)).toFixed(4)); //20
arregloAuxiliar[contadorAuxiliar] += "|" + parseFloat((parseFloat(tra_total_global_before_resta) * parseFloat(exchange_global)).toFixed(4));
arregloAuxiliar[contadorAuxiliar] += "|" + parseFloat(parseFloat(suma_retenciones_anteriores).toFixed(4)); //22
arregloAuxiliar[contadorAuxiliar] += "|" + parseFloat((parseFloat(amon_global) * parseFloat(exchange_global)).toFixed(4));
arregloAuxiliar[contadorAuxiliar] += "|" + add_accumulated_text; //24
arregloAuxiliar[contadorAuxiliar] += "|" + orden_pre; //25
arregloAuxiliar[contadorAuxiliar] += "|" + Math.round(parseFloat(val) * 100) / 100;
arregloAuxiliar[contadorAuxiliar] += "|" + taxtype; //27
arregloAuxiliar[contadorAuxiliar] += "|" + tax_item;
arregloAuxiliar[contadorAuxiliar] += "|" + subtype_ar; //29
arregloAuxiliar[contadorAuxiliar] += "|" + regimen;
arregloAuxiliar[contadorAuxiliar] += "|" + round2(parseFloat(baseAmount) * parseFloat(exchange_global)); //31
var aux_id = '';
if (bySubsidiary == '0') {
    aux_id = "NT" + internalid;
} else {
    aux_id = "CC" + internalid;
}
arregloAuxiliar[contadorAuxiliar] += '|' + aux_id;
arregloAuxiliar[contadorAuxiliar] += '|' + norma; //33
arregloAuxiliar[contadorAuxiliar] += '|' + sub_type_value;
arregloAuxiliar[contadorAuxiliar] += '|' + tax_code; //35
arregloAuxiliar[contadorAuxiliar] += '|' + round4(parseFloat(baseAmount) * parseFloat(exchange_global)); //36
arregloAuxiliar[contadorAuxiliar] += '|' + tramo[3]; //37
arregloAuxiliar[contadorAuxiliar] += '|' + jurisdiccion_iib_value; //38
arregloAuxiliar[contadorAuxiliar] += '|' + ccl_apli_value; //39
arregloAuxiliar[contadorAuxiliar] += '|' + vendorvalue;
arregloAuxiliar[contadorAuxiliar] += '|' + tax_rate_percentage;
arregloAuxiliar[contadorAuxiliar] += '|' + pagoDeBill; //42
arregloAuxiliar[contadorAuxiliar] += '|' + parseFloat(Math.round(parseFloat(val) * 10000) / 10000); //43
arregloAuxiliar[contadorAuxiliar] += '|' + Math.round(parseFloat(minimum_retention) * parseFloat(exchange_global) * 10000) / 10000; //44
arregloAuxiliar[contadorAuxiliar] += '|' + parseFloat(baseAmount) * parseFloat(exchange_global); //45
arregloAuxiliar[contadorAuxiliar] += '|' + tipo_renta;
arregloAuxiliar[contadorAuxiliar] += '|' + subtype_ar_text; //47
arregloAuxiliar[contadorAuxiliar] += '|' + ((isIncomeType) ? "T" : "F");//48
arregloAuxiliar[contadorAuxiliar] += '|' + (tra_total_global * parseFloat(exchange_global));//49

contadorAuxiliar++;