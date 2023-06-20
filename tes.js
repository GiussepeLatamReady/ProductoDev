const getJsonState =(summary,transactionIds)=>{
  
    let states = {};
    transactionIds.forEach(id => {
        states[id] = 'PROCESSING'
    });
    console.log("summary",summary);
    if (summary !== null && summary !== '' && summary !== ' ') {
        let incorrectsDetails = JSON.parse(summary).incorrects;
        console.log("incorrectsDetails",incorrectsDetails);
        if (incorrectsDetails !== 0) {
            incorrectsDetails = incorrectsDetails.split('|');
            const errorList = JSON.parse(incorrectsDetails[1]);
            errorList.forEach(item => {
                const { id } = item;
                states[id] = 'ERROR';
            });
        }else{
            transactionIds.forEach(id => {
                states[id] = 'SUCCESS';
            });
        }
    }    
    return states;  



}


const summary = {"corrects":1,"incorrects":"0|[]"};
const id = ['5211'];

console.log(getJsonState(JSON.stringify(summary),id));