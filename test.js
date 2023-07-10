function acortarNumero(num) {
    const multiplicador = Math.pow(10, 4); // Multiplicador para mover los decimales a la izquierda
    const truncado = Math.trunc(num * multiplicador); // Truncar el número multiplicado
    const resultado = truncado / multiplicador; // Dividir el número truncado para obtener el resultado final

    return resultado;
}
function acortarNumer(num) {
    const resultado = Number(num.toFixed(4));
    return resultado;
  }
// Ejemplo de uso:
const numero = 3.10;
const resultado = acortarNumero(numero);
const resultado2 = acortarNumero(numero);
console.log(resultado); // Imprime 3.1415
console.log(resultado2); // Imprime 3.1415
