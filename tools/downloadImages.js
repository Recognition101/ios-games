#!/usr/bin/env node
/* eslint no-console: 0 */

const fs    = require('fs');
const https = require('https');
const util  = require('util');
const csv   = require('csv-parse/lib/sync');

/**
 * Parses the CLI arguments and returns a map of them.
 * @return {{[key: string]: boolean|string}} a map of argument keys to values
 */
const parseArgs = () => {
    const result = /** @type {{[key: string]: boolean|string}} */({});
    let lastKey = '';
    for(const arg of process.argv.slice(2)) {
        const isKey = arg.startsWith('-');
        lastKey = isKey ? arg.replace(/^-*/, '') : lastKey;
        result[lastKey] = isKey ? true : arg;
    }
    return result;
};

const helpMessage = `
This command downloads the icon file for every game it can read in the local
CSV file. This script was used before the migration from CSV to JSON.

USAGE: downloadImages.js [OPTIONS]

OPTIONS:
    -h, --help  show this message and exit
    -a, --all   If given, re-download already existing images
`;

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
    // Parse Arguments, Display Help If Needed
    const args = parseArgs();
    const all  = args.a || args.all;
    const help = args.h || args.help;

    if (help) {
        console.log(helpMessage);
        return;
    }

    const data = await readFile('../data.csv');
    const rows = /** @type {string[][]} */(csv(data));

    rows.shift();

    for(const row of rows) {
        const id      = (row[row.length - 1] || '').replace(/^id/, '');
        const imageFn = '../images/id' + id + '.jpg';
        const skip    = !all && fs.existsSync(imageFn);

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