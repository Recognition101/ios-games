const path = require('path');
const fs = require('fs');
const csv = require('csv-parse/lib/sync');

const pathCsv = path.join(__filename, '../..', 'data.csv');
const pathJson = path.join(__filename, '../..', 'data.json');

const csvContent = fs.readFileSync(pathCsv).toString();

const rows = csv(csvContent);

rows.shift();

const json = {};

for(const row of rows) {
    json[row[9].replace(/\D/g, '')] = {
        name: row[0],
        phone: row[1].trim() === 'TRUE' || undefined,
        pad:   row[2].trim() === 'TRUE' || undefined,
        tv:    row[3].trim() === 'TRUE' || undefined,
        cloud: row[4].trim() === 'TRUE' || undefined,
        mfi:   row[5].trim() === 'TRUE' || undefined,
        ends:  row[6].trim() === 'TRUE' || undefined,
        map:   row[7].trim() === 'TRUE' || undefined,
        multi: row[8].trim() === 'TRUE' || undefined
    };
}

fs.writeFileSync(pathJson, JSON.stringify(json, null, '  '));