'use strict';

let Path = require('path');
let GoodConsole = require('good-console');
let GoodSqueeze = require('good-squeeze');

let internals = {};

internals.rootDir = Path.resolve(__dirname, '..');






module.exports = {

    rootDir: internals.rootDir,
    applicationTitle: 'h2optimum-api',
    port: '',
    publicUrl: '',

    // configuration for each database is entirely defined the mode configuration file
    db: {
        // should be redefined in some other configuration file (that should be present in .gitignore)
        postgres: {
            host: '',
            port: 0,
            database: '',
            username: '',
            password: ''
        }
    },

    // configuration for each plugin is entirely defined the mode configuration file
    plugins: {

        // external plugins

        'blipp': { 
        },

        'good': {
        },

        // internal plugins

    }

};
