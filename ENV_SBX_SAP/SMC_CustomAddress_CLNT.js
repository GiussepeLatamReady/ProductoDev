/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_CustomAddress_CLNT.js
 */
define(["N/search", "N/currentRecord", "N/runtime"], function (search, currentRecord,runtime) {
    function brCustomCity() {
        try {
            // const urlt = new URL(window.location.href);
            const recordNow = currentRecord.get();
            let country = recordNow.getValue("country")
            // if (urlt.searchParams.get("country") !== "BR") return;
            NavigationHistory.saveForm();
            //console.log("recordNow 1:",recordNow)
            //console.log("country 1:",country)

            if (!country) {
                country = getCountryExt(recordNow.id)
            }
            //console.log("country 2:",country)
            validateLocalized(country);


            const province = document.querySelector("[name=custrecord_lmry_addr_prov]");
            if (!province) return;
            const observer = new MutationObserver(async function (mutations) {
                const selectCity = document.querySelector("#custpage_br_city");

                selectCity.innerHTML = "<option value=''> </option>";
                if (Number(province.value)) {
                    const cities = getCities(province);

                    cities.forEach((cityData) => {
                        selectCity.innerHTML += `<option value='${cityData.getValue("internalid")}'>${cityData.getValue("name")}</option>`;
                    });
                    if (Number(recordNow.getValue("custrecord_lmry_addr_city"))) {
                        document.querySelector("#custpage_br_city").value = recordNow.getValue("custrecord_lmry_addr_city");
                    }
                }
            });

            // Configurar las opciones del observador
            const config = { attributes: true, childList: false, subtree: false };

            // Iniciar la observación del elemento input con las opciones configuradas
            observer.observe(province, config);

            document.querySelector('[data-walkthrough="Field:custrecord_lmry_addr_city"]').style.display = "none";

            document.querySelector('[data-walkthrough="Field:custrecord_lmry_addr_city"]').parentElement.innerHTML +=
                `<div class="uir-field-wrapper" data-nsps-label="Latam - City" data-nsps-type="field" data-field-type="select" data-walkthrough="Field:custrecord_lmry_addr_prov">
    <span id="custrecord_lmry_addr_city_fs_lbl_uir_label" class="smallgraytextnolink uir-label" data-nsps-type="field_label"
        ><span id="custrecord_lmry_addr_city_fs_lbl" class="labelSpanEdit smallgraytextnolink" style="" data-nsps-type="label">
            <a
                tabindex="-1"
                title="What's this?"
                href='javascript:void("help")'
                style="cursor: help"
                onclick="return nlFieldHelp('Field Help', 'custrecord_lmry_addr_city', this)"
                class="smallgraytextnolink"
                onmouseover="this.className='smallgraytext'; return true;"
                onmouseout="this.className='smallgraytextnolink'; "
                >Latam - City</a
            >
        </span>
    </span>
    <span class="uir-field" data-nsps-type="field_input" >
        <select id='custpage_br_city' style="width: 280px;">
        </select>
    </span>
    </div>`;
            if (Number(recordNow.getValue("custrecord_lmry_addr_city"))) {
                const selectCity = document.querySelector("#custpage_br_city");
                selectCity.innerHTML = "<option value=''> </option>";
                const cities = getCities(province);
                cities.forEach((cityData) => {
                    selectCity.innerHTML += `<option value='${cityData.getValue("internalid")}'>${cityData.getValue("name")}</option>`;
                });
                document.querySelector("#custpage_br_city").value = recordNow.getValue("custrecord_lmry_addr_city");
            }
            const selectCity = document.querySelector("#custpage_br_city");
            selectCity.addEventListener("change", (ev) => {
                recordNow.setValue("custrecord_lmry_addr_city", ev.target.value);
            });
        } catch (error) {
            console.log("error",error)
            console.log("error stack",error.stack)
        }
        
    }
  
    function getCities(province){
        return search
        .create({
            type: "customrecord_lmry_city",
            filters: [
                ["custrecord_lmry_prov_link", "anyof", province.value],
                "AND",
                ["isinactive","is","F"]
            ],
            columns: [
                search.createColumn({
                    name: "name",
                    sort: search.Sort.ASC
                }),
                "internalid"
            ]
        })
        .run()
        .getRange(0, 1000);
    }
    function getCountryExt(addressID) {
        //console.log("addressID", addressID)
        var country;
        search.create({
            type: "address",
            columns: [search.createColumn({
                name: "formulatext",
                formula: "{country.id}",
                label: "country"
            })],
            filters: ['internalid', 'anyof', addressID]
        }).run().each(function (result) {
            if ("Colombia" == result.getValue(result.columns[0])) {
                country = "CO";
            } else {
                country = "US"
            }
        });
        return country;
    }
  
    function validateLocalized(country) {
        if (!runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' })) return false;
        NavigationHistory.setURL(document.referrer)
        const urlUp = NavigationHistory.findUrl();
        //console.log("urlUp",NavigationHistory.getURLS())
        if (!urlUp) {
            hideLatamFields();
            return false;
        }
        const { href, searchParams } = new URL(urlUp);

        let subsidiaryID = searchParams.get(href.includes("subsidiarytype") ? "id" : "subsidiary");

        if (subsidiaryID && !isLocalized(subsidiaryID,country)) {
            hideLatamFields();
        } else if (href.includes("entity")) {
            const entityID = searchParams.get("id");
            subsidiaryID = search.lookupFields({
                type: search.Type.ENTITY,
                id: entityID,
                columns: ['subsidiary']
            }).subsidiary?.[0]?.value;
            if (subsidiaryID && !isLocalized(subsidiaryID,country)) hideLatamFields();
        } else if (href.includes("transactions")){
            const transactionID = searchParams.get("id");
            subsidiaryID = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: transactionID,
                columns: ['subsidiary']
            }).subsidiary?.[0]?.value;
            if (subsidiaryID && !isLocalized(subsidiaryID,country)) hideLatamFields();
        }
        hideFieldsSAp(subsidiaryID,country);
    }

    function hideFieldsSAp(subsidiaryID,countryForm){
        var country = search.lookupFields({
            type: search.Type.SUBSIDIARY,
            id: subsidiaryID,
            columns: ['country']
        }).country[0].value;

        if (country === "CO" && countryForm == "CO") {
            const rowstable = document.querySelectorAll("tr");
            rowstable.forEach(row => {
                const div = row.querySelector("td>div");
                if (div && div.getAttribute("data-walkthrough")?.startsWith("Field:dropdownstate")) {
                    row.style.display = "none";
                }
                if (div && div.getAttribute("data-walkthrough")?.startsWith("Field:city")) {
                    row.style.display = "none";
                }
            });
        }
    }
  
    function isLocalized(subsidiaryID,country) {
        //console.log("subsidiaryID",subsidiaryID)
        //console.log("country",country)
        const searchOW = search.create({
            type: 'customrecord_lmry_features_by_subsi',
            columns: [
                'internalid'
            ],
            filters: [
                ['isinactive', 'is', 'F'],
                "AND",
                ['custrecord_lmry_features_subsidiary.internalid', 'anyof', subsidiaryID],
                "AND",
                ['custrecord_lmry_features_subsidiary.isinactive', 'is', 'F'],
                "AND",
                ['custrecord_lmry_features_subsidiary.country', 'anyof', country]
            ]
        });
        return searchOW.runPaged().count;
    }
    function hideLatamFields(){
        const rowstable = document.querySelectorAll("tr");
        rowstable.forEach(row => {
            const div = row.querySelector("td>div");
            if (div && div.getAttribute("data-walkthrough")?.startsWith("Field:custrecord_lmry")) {
                console.log("ocultando")
                row.style.display = "none";
            }
        });
    }
  
  
    class NavigationHistory {
        // Método para agregar una URL al historial
        static setURL(urlUnit) {
            let history = JSON.parse(sessionStorage.getItem('navigationHistory')) || [];
            history.push(urlUnit);
            sessionStorage.setItem('navigationHistory', JSON.stringify(history));
        }
    
        // Método para obtener el historial completo
        static getURLS() {
            return JSON.parse(sessionStorage.getItem('navigationHistory')) || [];
        }
    
        // Método para eliminar el historial completo
        static deleteURLS() { 
            sessionStorage.removeItem('navigationHistory');
        }
  
        static saveForm(){

            const okButton = document.querySelector('input[name="ok"]');
            if (okButton) {
                okButton.addEventListener('mousedown', function () {
                    NavigationHistory.deleteURLS();
                });
            }
  
            const okClose = document.querySelector('input[name="close"]');
            if (okClose) {
                okClose.addEventListener('mousedown', function () {
                    NavigationHistory.deleteURLS();
                });
            }
        }
    
        // Método para buscar la última URL con los parámetros específicos
        static findUrl() {
            const urls = NavigationHistory.getURLS();
            return [...urls].reverse().find(urlUnit => 
                urlUnit.includes("subsidiarytype") || urlUnit.includes("subsidiary") || urlUnit.includes("entity") || urlUnit.includes("transactions")
            );
        }
    }
  
  
    return {
        brCustomCity
    };
  });
  