var Fecha = require("fecha");

module.exports = function(env){

    env.addFilter('stringify', function(input){

        return JSON.stringify(input);
    });
    /*
    env.addFilter('shortDate', function(d){

        // d is the string representation of a date (in ISO8601)
        return Fecha.format(new Date(d), 'MMMM/YYYY');
    });

    env.addFilter('now', function(){

        // d is the string representation of a date (in ISO8601)
        return Date.now();
    });

    env.addGlobal("lang", "pt");
*/
};
