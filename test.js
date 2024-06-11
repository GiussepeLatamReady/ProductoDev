
var text = "Latam - WHT Reclasification RG - ReteIVA 15%";
const getRetentionName = text => {
    const match = text.match(/Latam - WHT(?: Reclasification)?\s?(\S.*)/);
    console.log("match:", match)
    return match ? match[1].trim() : "Retention name not found";
};

console.log(getRetentionName(text))