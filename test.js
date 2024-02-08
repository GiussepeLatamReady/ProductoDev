function getRetentionName(text) {
    return text.split(/Latam - WHT Reclasification\s?/)[1]?.trim() || "Retention name not found";
}

// Example options
let option1 = "Latam - WHT ReclasificationAutoReteCREE0.4%";
let option2 = "Latam - WHT Reclasification AutoReteCREE0.4%";

console.log(getRetentionName(option1)); // Should return "AutoReteCREE0.4%"
console.log(getRetentionName(option2)); // Should return "AutoReteCREE0.4%"
