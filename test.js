

const DATA_FOLDERS = [
    {
        name: "Latamready Documents",
        code: "LATAMREADY"
    },
    {
        name: "LR Pictures",
        code: "LR_PICTURES",
        parentCode: "LATAMREADY"
    },
    {
        name : "SDF Install Logs",
        code : "LR_SDF_INSTALL_LOGS_CORE",
        parentCode : "LATAMREADY"
    }
];

const validateFolders = createFolderJson => {
    const filtersFolder = createFolderJson.flatMap((folder, index) => 
        index > 0 ? ["OR", ["name", "is", folder.name]] : [["name", "is", folder.name]]
    );
    const folderNames = [];
    search.create({
        type: "folder",
        filters: filtersFolder,
        columns: ["name"]
    }).run().each(result => {
        folderNames.push(result.getValue("name"));
    });

    return createFolderJson.filter(folder => !folderNames.includes(folder.name));
};


console.log(validateFolder(DATA_FOLDERS))