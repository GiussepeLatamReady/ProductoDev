

let json = [
    {
        id:'15',
        error:'stx'
    },
    {
        id:'16',
        error:'stx'
    },
    {
        id:'17',
        error:'stx'
    },

];


let incorrects =`${json.length}|${JSON.stringify(json)}`

let summary ={
    corrects :0,
    incorrects:0
}
summary=JSON.stringify(summary);
console.log('summary 1:',summary)
console.log('-----------------')
summary = JSON.parse(summary);
console.log('summary 2:',summary)
console.log('-----------------')
let summaryDetails = summary.incorrects.split('|');

let number = summaryDetails[0];
let array = JSON.parse(summaryDetails[1]);

console.log('incorrects :',incorrects)
console.log('-----------------')
console.log('summaryDetails :',summaryDetails)
console.log('-----------------')
console.log('number :',number)
console.log('-----------------')
console.log('array :',array)
console.log('-----------------')
