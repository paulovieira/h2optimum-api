'use strict';

const Path = require('path');
const Config = require('nconf');
const Joi = require('joi');
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

exports.register = function (server, options, next){

    // insert measurements into a test table

    // http://localhost:8000/v1/readings?mac=08:00:2b:01:02:03&data[0][sid]=1&data[0][value]=20.1&data[0][type]=t&data[0][desc]=&data[1][sid]=2&data[1][value]=300&data[1][type]=b&data[1][desc]=

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

        handler: function (request, reply) {

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


            const query = `
                select * from insert_measurements(' ${ JSON.stringify(request.query.data) } ');
            `;
            //console.log(query);

            Db.query(query)
                .then(function (result){

                    return reply({ newRecords: result.length, ts: new Date().toISOString() });
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
