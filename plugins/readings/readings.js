'use strict';

const Path = require('path');
const Config = require('nconf');
const Joi = require('joi');
const _ = require('underscore')
const Hoek = require('hoek')

const Utils = require('../../common/utils');
const Db = require('../../database');

const internals = {};

internals.measurementSchema = Joi.object({
    sid: Joi.number().integer(),
    value: Joi.number().required(),
    // if more measurement types are added, we have to update here and in the sql template
    type: Joi.string().required(),
    desc: Joi.string().allow([''])
});


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


    Db.query(`select * from insert_measurements(' ${ JSON.stringify(request.query.data) } ');`)
        .then(function (result){

            // TODO: change response body if request was not authenticatd
            //return reply({ newRecords: result.length, ts: new Date().toISOString() });

            let remoteAction = 'none';
            let responsePayload = `newRecords: ${ result.length }; remoteAction: ${ remoteAction }`;

            return reply(responsePayload)
                    .type('text/plain')
                    .header('x-new-records', result.length)
                    .header('x-remote-action', remoteAction);
        })
        .catch(function (err){

            Utils.logErr(err, ['api-measurements']);
            return reply(err);
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
                origin: ['http://localhost:8001', 'http://localhost:8002', 'http://app.2adapt.pt']
            }

        },

        handler: function (request, reply) {

            let dbOptions = request.query;
            console.log(dbOptions);

            Db.query(`select * from read_measurements(' ${ JSON.stringify(dbOptions) } ');`)
                .then(function (result){

                    return reply(result);
                })
                .catch(function (err){

                    Utils.logErr(err, ['api-measurements']);
                    return reply(err);
                });
        }
    });

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: [/* */]
};
