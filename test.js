const params = {
    token:"hiv-u-Sblr2a9WPlW3FfLj308ITEQafc1xihB_yjs0qUBnYjIsja-U1sDUqGb7rs",
    cnpj:"00636794001075",
    codigo:"0108",
    uf:"SP",
    descricao:"",
    unidadeMedida:"",
    valor:0
}

const url = `https://apidoni.ibpt.org.br/api/v1/servicos?${new URLSearchParams(params).toString()}`;

fetch(url)
    .then(response => response.json())
    .then(data => console.log("Response :",data))
    .catch(error => console.error("Error",error))