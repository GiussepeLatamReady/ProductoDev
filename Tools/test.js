

const data = {
    "4759": "PENDINGs",
    "4443": "PENDINGs",
    "4444": "PENDINGs",
    "4445": "PENDINGs"
};
const findPendingVendor = (vendorsData) => {
    const vendors = vendorsData
    return Object.keys(vendors).find(key => vendors[key] === 'PENDING');
}

console.log(findPendingVendor(data))
