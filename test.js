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
