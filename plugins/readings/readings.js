'use strict';

let Path = require('path');
let Config = require('nconf');
let Joi = require('joi');
let _ = require('underscore')
let Hoek = require('hoek')
let Boom = require('boom')

let Utils = require('../../common/utils');
let Db = require('../../database');

let internals = {};

internals.measurementSchema = Joi.object({
    sid: Joi.number().integer(),
    value: Joi.number().required(),
    // if more measurement types are added, we have to update here and in the sql template
    type: Joi.string().required(),
    desc: Joi.string().allow([''])
});

internals.batteryModes = {
    battery_normal: "0",
    battery_eco: "1",
    battery_standby: "2"
};

internals.insertMeasurementsHandler = function (request, reply) {

    console.log(request.query);
    //return reply("xyz");

    let mac = request.query.mac, version = request.query.version;

    request.query.data.forEach((obj) => {

        // the mac address is not part of the data objects
        obj.device_id = mac;
        obj.version = version
        // some keys in the query string do not match the names of the columns
        obj.description = obj.desc;  
        obj.val = obj.value;
        
        // correct the version value (sometimes given as 0.x)
        if (obj.version > 0 && obj.version < 1) {
            obj.version = obj.version * 10;
        }
        else {
            delete obj.version;
        }
        

        // the remaining keys in the query string match the names of the columns
    });

    let result1
    Db.query(`select * from insert_measurements(' ${ JSON.stringify(request.query.data) } ');`)
        .then(function (result){

            result1 = result;

            // temporary code to obtain the remote action
            // TODO: we should be sending also the activation key
            let query2 = { 
                mac: mac,
            };

            return Db.query(`select * from read_devices_by_mac('${ JSON.stringify(query2) }');`)
        })
        .then((result2) => {

            // TBD: fetch the device with the given mac and output the current battery mode

            console.log(result2)

            // default battery mode
            let remoteAction = '0';

            if (result2.length > 0) {

                // if there is more the 1 device in the table, use the last one
                let device = result2[result2.length - 1];
                remoteAction = internals.batteryModes[device['battery_mode_code']];


                Db.query(`
                    update t_devices
                    set last_reading = now()
                    where id = ${device.id}
                `)
                .then(() => { console.log('last reading was updated') })
                .catch((err) => { console.log(err) })

            }
            
            let responsePayload = `newRecords: ${ result1.length }; remoteAction: ${ remoteAction }`;

            return reply(responsePayload)
                    .type('text/plain')
                    .header('x-new-records', result1.length)
                    .header('x-remote-action', remoteAction);            
        })
        .catch(function (err){

            let outputErr = err;

            // check all errors from pg constraints
            if (false) {}

            // check for PL/pgSQL error "invalid_text_representation"; 
            // this will happen when the we try to insert a mac address that is now well formed
            else if (err.code === '22P02' && err.message.indexOf('macaddr') >= 0){
                outputErr = Boom.badRequest('mac_invalid_text_representation');
            }

            // log the original error, but reply with the outputErr
            Utils.logErr(err, ['api-measurements']);
            return reply(outputErr);
        });
};

exports.register = function (server, options, next){


    server.route({
        path: '/v1/insert-measurements',
        method: 'GET',
        config: {
            validate: {
                query: {
                    mac: Joi.string().required(),
                    version: Joi.number(),
                    data: Joi.array().items(internals.measurementSchema).min(1).required()
                },

                options: {
                    stripUnknown: true
                }
            }
        },

        handler: internals.insertMeasurementsHandler
    });

    // exactly the same as the previous route above (this is the old url)
    server.route({
        path: '/v1/readings',
        method: 'GET',
        config: {
            validate: {
                query: {
                    mac: Joi.string().required(),
                    version: Joi.number(),
                    data: Joi.array().items(internals.measurementSchema).min(1).required()
                },

                options: {
                    stripUnknown: true
                }
            }
        },

        handler: internals.insertMeasurementsHandler
    });


    server.route({
        path: '/v1/get-measurements',
        method: 'GET',
        config: {
            validate: {

                query: {
                    period: Joi.number(),
                    fromDate: Joi.date(),
                    toDate: Joi.date(),
                    deviceMac: Joi.string().required(),
                    order: Joi.string().valid('asc', 'desc'),
                },

                options: {
                    stripUnknown: true
                }
            },

            cors: {
                origin: [
                    '*',
                    // 'http://localhost:8001',
                    // 'http://localhost:8002',
                    // 'http://app.2adapt.pt',
                    // 'https://app.2adapt.pt'
                ]
            }

        },

        handler: function (request, reply) {

            let dbOptions = request.query;
            console.log(dbOptions);

//            let YYYY = dbOptions.fromDate.getFullYear();
//            let MM = dbOptions.fromDate.getMonth();
//            let DD = dbOptions.fromDate.getDate();
//            let dateTemp = new Date(YYYY, MM, DD);
//            dbOptions.fromDate = dateTemp.toISOString();

//            YYYY = dbOptions.toDate.getFullYear();
//            MM = dbOptions.toDate.getMonth();
//            DD = dbOptions.toDate.getDate();
//            dateTemp = new Date(YYYY, MM, DD);
//            dbOptions.toDate = dateTemp.toISOString();


            console.log('stringify:\n: ', JSON.stringify(dbOptions))


            Db.query(`select * from read_measurements(' ${ JSON.stringify(dbOptions) } ');`)
                .then(function (result){

                    return reply(result);
                })
                .catch(function (err){

                    let outputErr = err;

                    // check all errors from pg constraints
                    if (false) {}

                    // check for PL/pgSQL error "invalid_text_representation"; 
                    // this will happen when the we try to insert a mac address that is now well formed
                    else if (err.code === '22P02' && err.message.indexOf('macaddr') >= 0){
                        outputErr = Boom.badRequest('mac_invalid_text_representation');
                    }

                    // log the original error, but reply with the outputErr
                    Utils.logErr(err, ['api-measurements']);
                    return reply(outputErr);
                });
        }
    });

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: [/* */]
};
