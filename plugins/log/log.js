'use strict';

let Path = require('path');
let ChildProcess = require('child_process');
let Fs = require('fs-extra');
let Config = require('nconf');
let Promise = require('bluebird');
let Nunjucks = require('nunjucks');
let Boom = require('boom');
let Glob = require('glob');
//let Fecha = require('fecha');
//var Converter = require("csvtojson").Converter;
//let Utils = require('../../common/utils');
//let Db = require('../../database');

let internals = {};

// the path of the page that has the form for the login data
//internals.loginPath = '/login';
internals.clientAppBuildDir = Path.join(__dirname, 'client-app/dist');




exports.register = function(server, options, next){

    let pluginName = exports.register.attributes.name;

    // configure nunjucks
    let env = Nunjucks.configure(__dirname, { 
        autoescape: false,
    });
    
    // the build command for the client app (webpack) is executed in production mode only; 
    // in dev mode we should open a console and call the build command directly: 
    //   'npm run build', or if the cwd is the base directory,
    //   'npm run build --prefix ./plugins/log/'
    if (Config.get('env') === 'production'){
        // internals.buildProduction();
    }

    internals.addNunjucksFilters(env);
    internals.addNunjucksGlobals(env);

    server.views({
        path: __dirname,
        engines: {
            html: {
                compile: (src, options) => {

                    var template = Nunjucks.compile(src, options.env);

                    return context => template.render(context)
                },
            }
        },

        compileOptions: {
            env,
        },

    });

    server.route({ 
        method: 'GET',
        path: '/log',
        handler: function (request, reply) {

            let templateFile = 'templates/log.html';
            let ctx = {
                title: 'hello ' + request.server.version,
                message: 'Index - Hello World!',
                data: {
                    x: 123,
                    y: 456
                }
            };

            reply.view(templateFile, {
                ctx
            });
        }
    });
       

    // static files 
    
    server.route({
        path: "/log/dist/{anyPath*}",
        method: "GET",
        config: {
            handler: {
                directory: { 
                    path: Path.join(__dirname, 'client-app/dist'),
                    index: false,
                    listing: false,
                    showHidden: false,
                    lookupCompressed: true
                }
            },
            cache: {
                privacy: "public",
                expiresIn: 3600000
            },
            auth: false,
        }
    });


    return next();
};

internals.addNunjucksFilters = function(env){

     env.addFilter('stringify', function(obj) {

         return JSON.stringify(obj);
     });
/*
     env.addFilter('getDomainLogo', function(array, elem) {

         if(typeof array !== "object"){
             return "";
         }

         for(var i=0; i<array.length; i++){
             if(array[i] === elem){
                 return "fa-check-square-o";
             }
         }

         return "fa-square-o";
     });

     env.addFilter('getDefinitionClass', function(array, elem) {

         if(typeof array !== "object"){
             return "";
         }

         for(var i=0; i<array.length; i++){
             if(array[i] === elem){
                 return "has-definition";
             }
         }

         return "";
     });


    env.addFilter('toFixed', function(num, precision) {

        if(typeof num === "string"){
            num = Number(num);
        }

        return num.toFixed(precision);
    });
*/
};


internals.addNunjucksGlobals = function(env){

    env.addGlobal("NODE_ENV", Config.get('env'));
    //env.addGlobal("pluginTemplatesPath", Path.join(__dirname, "templates"));
    //env.addGlobal("commonTemplatesPath", Path.join(Config.get("rootDir"), "templates"));

    // in production mode the chunks names are dynamic because it includes a hash of the file
    // in dev mode the names are static (see internals.findChunkNames)

    internals.findChunkNames();
    env.addGlobal("runtimeBuildJs", Path.basename(internals.runtimeBuild[0]));
    env.addGlobal("libBuildJs", Path.basename(internals.libBuild[0]));
    env.addGlobal("libBuildCss", Path.basename(internals.libBuild[1]));
    env.addGlobal("appBuildJs", Path.basename(internals.appBuild[0]));
    env.addGlobal("appBuildCss", Path.basename(internals.appBuild[1]));

};


// call webpack to build the client side application; the chuncks will be saved to
// app/_buildTemp and have a hashname; we then copy all of them to app/build;

// TODO: make sure that server-side caching is working well with these static files 
// even when the file is the same (and has the same name), but the timestamp changes;
// if not we have have use FileJanitor to copy from app/buildTemp to app/build only when
// the file has actually changed


internals.buildProduction = function(){

    let buildCommand = `npm run build-prod --prefix ${ __dirname }`;

    try {
        console.log('execSync: ' + buildCommand);
        ChildProcess.execSync(buildCommand);
        console.log('xyz');

        // TODO: check if webpack failed (the output will say "error", but beter yet is to check the exit status code)
    }
    catch(err){
        throw err;
    }

/*
    try {

        Fs.removeSync(Path.join(internals.clientAppBuildDir));

        const webpackConfig = Path.join(__dirname, "webpack.config.js");
        const buildCommand = `node ./node_modules/webpack/bin/webpack --config ${ webpackConfig }`;
        ChildProcess.execSync(buildCommand);

        // TODO: check if webpack failed (the output will say "error", but beter yet is to check the exit status code)
    }
    catch(err){
        throw err;
    }
*/
    process.stdout.write("Client app: build successful!");
};

internals.findChunkNames = function(){

    let buildDir = internals.clientAppBuildDir;

    // output in dev mode: runtime.js; output in production mode: runtime.7r35.js
    internals.runtimeBuild = Glob.sync(Path.join(buildDir, 'runtime*.js'));
    internals.libBuild = Glob.sync(Path.join(buildDir, 'lib*.js')).concat(Glob.sync(Path.join(buildDir, 'lib*.css')));
    internals.appBuild = Glob.sync(Path.join(buildDir, 'app*.js')).concat(Glob.sync(Path.join(buildDir, 'app*.css')));

/*
    if (Config.get('env') === 'production'){
        internals.runtimeBuild = Glob.sync(Path.join(internals.clientAppBuildDir, "runtime.*.js"));
        internals.appBuild = Glob.sync(Path.join(internals.clientAppBuildDir, "app.*.js"));
        internals.libBuild = Glob.sync(Path.join(internals.clientAppBuildDir, "lib.*.js"));
    }
    else {
        internals.runtimeBuild = Glob.sync(Path.join(internals.clientAppBuildDir, "runtime.js"));
        internals.appBuild = Glob.sync(Path.join(internals.clientAppBuildDir, "app.js"));
        internals.libBuild = Glob.sync(Path.join(internals.clientAppBuildDir, "lib.js"));
    }
*/
    if (internals.runtimeBuild.length !== 1 || internals.appBuild.length !== 2 || internals.libBuild.length !== 2){
        console.log('runtimeBuild: ', internals.runtimeBuild);
        console.log('libBuild: ', internals.libBuild);
        console.log('appBuild: ', internals.appBuild);
        throw Boom.badImplementation('Client app: build files are missing');
    }

};


exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: ['vision', 'inert']
};


