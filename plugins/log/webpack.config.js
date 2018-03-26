'use strict';

let Path = require('path');
let Webpack = require('webpack');
let ExtractTextPlugin = require('extract-text-webpack-plugin');
let BellOnBundlerErrorPlugin = require('bell-on-bundler-error-plugin');
let CleanWebpackPlugin = require('clean-webpack-plugin')


let internals = {};

internals.srcDir = Path.join(__dirname, 'client-app/src');
internals.buildDir = Path.join(__dirname, 'client-app/dist');

function getConfig(isProduction) {

    let outputFormat = isProduction ? '[name].[chunkhash:4]' : '[name]';

    let config = {

        entry: {
            'app': [
                Path.join(internals.srcDir, 'index'),
                Path.join(internals.srcDir, 'require-styles-app.js')
            ],
            'lib': [
                'jquery',
                Path.resolve('./node_modules/popper.js/dist/umd/popper.js'),
                'bootstrap',
                'datatables.net',
                'datatables.net-bs4',
                /*
                'date-fns',
                'datatables.net',
                'datatables.net-bs4',
                */
                
                Path.join(internals.srcDir, 'require-styles-lib.js'),
            ]
        },

        output: {
            path: internals.buildDir,
            filename: outputFormat + '.js',
            chunkFilename: outputFormat + '.js'
        },
     
        module: {
            rules: [

                // disable the AMD loader for everything; exceptions can be added explicitely
                // more info here: http://stackoverflow.com/questions/29302742/is-there-a-way-to-disable-amdplugin

                {
                    test: /\.js$/,
                    exclude: [],
                    use: {
                        loader: 'imports-loader',
                        options: {
                            'define': '>false'  
                        }

                        // an alternative would be to give the options directly as a query string, like this
                        // loader: 'imports-loader?define=>false',
                    }

                },

                // handle jquery plugins that are not published as a proper module; they must be imported using imports-loader
                // https://github.com/webpack/imports-loader
                
                {
                    test: [
                        Path.resolve('./node_modules/bootstrap/dist/js/bootstrap.js'),
                    ],
                    use: {
                        loader: 'imports-loader',
                        options: {
                            'jQuery': 'jquery'
                        }
                    }
                },

                // bootstrap 4 expects a global reference to Popper (from popper.js)
                
                {
                    test: [
                        Path.resolve('./node_modules/bootstrap/dist/js/bootstrap.js'),
                    ],
                    use: {
                        loader: 'imports-loader',
                        options: {
                            //'Popper': 'popper.js'  // don't use this otherwise we will be including the es module version
                            'Popper': 'popper.js/dist/umd/popper.js'
                        }
                    }
                },

                {
                    test: /\.css$/,
                    use: ExtractTextPlugin.extract({
                      fallback: 'style-loader',
                      use: 'css-loader'
                    })
                },
            ]
        },

        plugins: [
            new CleanWebpackPlugin(internals.buildDir),
            new Webpack.NamedChunksPlugin(), 
            isProduction ? new Webpack.HashedModuleIdsPlugin() : new Webpack.NamedModulesPlugin(),

            new Webpack.optimize.CommonsChunkPlugin({
                name: ['lib'],  // should be same as the key in the 'entry' section
                minChunks: Infinity
            }),
            new Webpack.optimize.CommonsChunkPlugin({
               name: 'runtime'
            }),

            new BellOnBundlerErrorPlugin,
            new ExtractTextPlugin(outputFormat + '.css' /*, { allChunks: true }*/),
        ],
    };

    return config
};

module.exports = function (env = {}) {

  return getConfig(env.production);
}

