search.create({
    type: "location",
    filters:
        [
            ["internalid", "anyof", locationIDs]
        ],
    columns:
        ["internalid", "name"]
}).run().each(result => {
    const internalid = result.getValue("internalid");
    jsonLotes[internalid] = result.getValue("name") || "";
    return true;
});