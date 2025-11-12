let auxBody = { "period": '102025', "cuits": ['20005810788'], "type": 'P' }
auxBody = JSON.stringify(auxBody)
let responsePadron = http.post({
    body: auxBody,
    url: "http://149.130.171.192:3000/padron/Arba",
    headers: {
        "User-Agent": "Mozilla/5.0",
        "lmry-account": runtime.accountId,
        "Content-Type": "application/json"
    }
});
JSON.parse(responsePadron.body)