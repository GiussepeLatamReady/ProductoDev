let obj = {
    nombre: "Juan",
    edad: 30,
    profesion: "Desarrollador",
    pais: "Perú"
};

// Hacer una copia del objeto omitiendo la propiedad 'profesion'
let { profesion, ...copiaSinProfesion } = obj;

console.log(copiaSinProfesion); // { nombre: "Juan", edad: 30, pais: "Perú" }
console.log(obj); 
