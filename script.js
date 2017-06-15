const itunesUrl = 'https://itunes.apple.com/us/app/';

/**
 * @param {Array<string>} data 
 * @param {number} sortColumn
 * @param {boolean} sortDirection
 */
const makeHeader = (data, sortColumn, sortDirection) => {
    const row = document.createElement('div');
    row.classList.add('games-row', 'games-header');
    data.slice(0, -1).forEach((cellText, i) => {
        const cell = document.createElement('div');
        if (i === sortColumn) {
            cell.classList.add('games-header-sort');
            cellText += sortDirection ? '<br/>&#8679;' : '<br/>&#8681;';
        }
        cell.innerHTML = cellText;
        row.appendChild(cell);
    });
    return row;
};

/**
 * @param {Array<string>} data 
 * @return {Element}
 */
const makeRow = data => {
    const row = document.createElement('dl');
    row.classList.add('games-row');

    const name = document.createElement('dt');
    const link = document.createElement('a');
    link.innerHTML = data[0];
    link.href = itunesUrl + data[data.length - 1];
    name.appendChild(link);
    row.appendChild(name);

    data.slice(1,-1).forEach(cellText => {
        const cell = document.createElement('dd');
        const check = cellText.toLowerCase();
        cell.classList.add('games-check', 'games-check-' + check);
        cell.innerHTML = check === 'true' ? '&#10004;' : '&nbsp;';
        row.appendChild(cell);
    });
    return row;
};

/**
 * Makes a DOM Table from CSV data.
 * @param {Array<string>} header
 * @param {Array<Array<string>>} data 
 * @param {number} sortColumn
 * @param {boolean} sortDirection
 */
const redraw = (header, data, sortColumn, sortDirection) => {
    const container = document.createElement('div');
    container.classList.add('games');


    container.appendChild(makeHeader(header, sortColumn, sortDirection));
    data.forEach(row => container.appendChild(makeRow(row)));

    const mount = document.getElementById('games-container');
    mount.innerHTML = '';
    mount.appendChild(container);
};

fetch('./data.csv')
.then(resp => resp.text())
.then(text => {
    let sortColumn = 3;
    let sortDirection = false;

    const csv = text.split('\n').map(line => 
        line.match(/"[^"]*"|[^,]+/g)
            .map(item => item.replace(/^"|"$/g, ''))
    );
    const header = csv[0];
    const data = csv.slice(1);

    redraw(header, data, sortColumn, sortDirection);

    const mount = document.getElementById('games-container');
    mount.addEventListener('click', ({target}) => {
        /** @type {Element} */
        const parent = target.parentElement;
        if (parent.classList.contains('games-header')) {
            const newColumn = [...parent.childNodes].indexOf(target);
            sortDirection = newColumn === sortColumn ? !sortDirection : true;
            sortColumn = newColumn;

            data.sort((a, b) => (sortDirection ? 1 : -1) *
                                (a[sortColumn] < b[sortColumn] ? -1 : 1));
            
            redraw(header, data, sortColumn, sortDirection);
        }
    });
});