/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @Name LMRY_CustomAddress_CLNT.js
 */
define([
    "N/search", 
    "N/currentRecord",
    "N/runtime"
], function (
    search, 
    currentRecord,
    runtime
) {
    function brCustomCity() {
        console.log("Addres script")
        
        // const urlt = new URL(window.location.href);
        const recordNow = currentRecord.get();
        validateLocalized(recordNow);
        // if (urlt.searchParams.get("country") !== "BR") return;
        const province = document.querySelector("[name=custrecord_lmry_addr_prov]");
        if (!province) return;
        const observer = new MutationObserver(async function (mutations) {
            console.log(province.value);
            const selectCity = document.querySelector("#custpage_br_city");

            selectCity.innerHTML = "<option value=''> </option>";
            if (Number(province.value)) {
                const cities = search
                    .create({
                        type: "customrecord_lmry_city",
                        filters: [["custrecord_lmry_prov_link", "anyof", province.value]],
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
        const selectCity = document.querySelector("#custpage_br_city");
        selectCity.addEventListener("change", (ev) => {
            console.log(ev.target.value);
            recordNow.setValue("custrecord_lmry_addr_city", ev.target.value);
        });
    }

    function validateLocalized(newRecord) {
        if (!runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' })) return false;
    
        const { href, searchParams } = new URL(document.referrer);
        const subsidiaryID = searchParams.get(href.includes("subsidiarytype") ? "id" : "subsidiary");
    
        if (subsidiaryID && !isLocalized(subsidiaryID)) {
            hideLatamFields();
        } else if (href.includes("entity")) {
            const entityID = searchParams.get("id");
            const subsidiaryID = search.lookupFields({
                type: search.Type.ENTITY,
                id: entityID,
                columns: ['subsidiary']
            }).subsidiary?.[0]?.value;
    
            if (subsidiaryID && !isLocalized(subsidiaryID)) hideLatamFields();
        }
    }
    
    function isLocalized(subsidiaryID) {
        let exist;
        const searchOW = search.create({
            type: 'customrecord_lmry_features_by_subsi',
            columns: [
                'custrecord_lmry_features_subsidiary.isinactive'
            ],
            filters: [
                ['isinactive', 'is', 'F'],
                "AND",
                ['custrecord_lmry_features_subsidiary.internalid', 'anyof', subsidiaryID]
            ]
        });
        //const count = searchOW.runPaged().count;
        //console.log("count :",count);
        searchOW.run().each(result => {
            const inactive = result.getValue(result.columns[0]);
            exist = inactive !== "T" && inactive !== true;
        });
        console.log("isLocalized",exist);   
        return exist;

    }

    function hideLatamFields(){
        console.log("Ocultando Campos...")

        const rowstable = document.querySelectorAll("tr");

        rowstable.forEach(row => {
            const div = row.querySelector("td>div");
            if (div && div.getAttribute("data-walkthrough")?.startsWith("Field:custrecord_lmry")) {
                console.log(div.getAttribute("data-walkthrough"))
                row.style.display = "none";
            }
        });
        console.log("Se ha ocultado los campos latam")
    }
    return {
        brCustomCity
    };
});
