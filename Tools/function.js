

let query; require(["N/query"], function (que) { query = que; });


const logResults = query
    .runSuiteQL({
        query: `
                SELECT * FROM
customfield cf
WHERE LOWER(cf.scriptid) = 'custrecord_country'
                `
    })
    .asMappedResults();

    logResults