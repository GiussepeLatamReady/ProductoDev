var array = [1, 2, 3, 4, 5];

array.forEach(function(element) {
    if (element === 3) {
        return true; // Salta la iteración cuando element es igual a 3
    }
    console.log(element);
});