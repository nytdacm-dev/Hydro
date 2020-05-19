/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const webpack = require('webpack');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const { root } = require('./utils');

const build = async (type, tag = '') => {
    function hackNodeModuleFormidable() {
        const tasks = ['incoming_form', 'file', 'json_parser', 'querystring_parser'];
        for (const task of tasks) {
            let file = fs.readFileSync(root(`node_modules/formidable/lib/${task}.js`)).toString();
            if (file.startsWith('if (global.GENTLY) require = GENTLY.hijack(require);')) {
                file = file.split('\n');
                file[0] = '';
                file = file.join('\n');
                fs.writeFileSync(root(`node_modules/formidable/lib/${task}.js`), file);
            }
        }
    }
    hackNodeModuleFormidable();

    const config = {
        mode: type,
        entry: {
            development: root('hydro/development.js'),
        },
        output: {
            filename: `[name]${tag}.js`,
            path: root('.build'),
        },
        target: 'node',
        module: {},
        plugins: [
            new webpack.ProgressPlugin(),
            new FriendlyErrorsPlugin({
                clearConsole: false,
            }),
        ],
    };
    const compiler = webpack(config);
    await new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                console.error(err.stack || err);
                if (err.details) console.error(err.details);
                reject();
            }
            if (stats.hasErrors()) process.exitCode = 1;
            resolve();
        });
    });
};

module.exports = build;
