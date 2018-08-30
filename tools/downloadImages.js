#!/usr/bin/env node
/* eslint no-console: 0 */

const fs    = require('fs');
const https = require('https');
const util  = require('util');
const csv   = require('csv-parse/lib/sync');
const argv  = require('yargs')
    .option('all', {
        alias: 'a',
        describe: 'If given, re-download already existing images.'
    })
    .help('h')
    .argv;

const iTunesApi = 'https://itunes.apple.com/lookup?id=';
const readFile  = util.promisify(fs.readFile);

const fetchJson = url => new Promise((yes, no) => {
    let data = '';
    https.get(url, response => {
        response.on('data', chunk => data += chunk);
        response.on('error', e => no(e));
        response.on('end', () => yes(JSON.parse(data)));
    });
});

const downloadFile = (url, path) => new Promise((yes, no) => {
    https.get(url, response => {
        const file = fs.createWriteStream(path);
        response.pipe(file).on('error', e => no(e));
        file.on('error',  e => no(e));
        file.on('finish', () => { file.close(yes); });
    }).on('error', e => no(e));
});

const main = async () => {
    const data = await readFile('../data.csv');
    const rows = /** @type {Array<Array<string>>} */(csv(data));

    rows.shift();

    for(const row of rows) {
        const id      = (row[row.length - 1] || '').replace(/^id/, '');
        const imageFn = '../images/id' + id + '.jpg';
        const skip    = !argv.all && fs.existsSync(imageFn);

        if (id && !skip) {
            const json = await fetchJson(iTunesApi + id);
            const app  = json && json.results && json.results[0];
            if (app) {
                console.log('Downloading Image For: ' + row[0]);
                await downloadFile(app.artworkUrl512, imageFn);
            }
        } else {
            console.log('Skipping Image For: ' + row[0]);
        }
    }
};

main();