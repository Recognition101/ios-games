const urls = {
    itunes: 'https://itunes.apple.com/us/app/',
    img: 'http://cdn.appshopper.com/icons/'
};

/**
 * @typedef {Object} Game
 * @prop {string} name
 * @prop {string} id 
 * @prop {string} itunesUrl
 * @prop {string} imgUrl
 * @prop {Array<boolean>} features
 */

/**
 * @typedef {Element|string} Child
 * 
 * @param {string} tag 
 * @param {{[name: string]: string}} attrs 
 * @param {Array<Child>|Child} children 
 * @return {Element}
 */
const h = (tag, attrs, children=[]) => {
    const tagData = tag.match(/(^|[#.])[^#.]*/g) || [];
    const el = document.createElement(tagData.shift());
    tagData.forEach(str =>
        str[0] === '.' ? el.classList.add(str.substr(1)) :
        str[0] === '#' ? el.setAttribute('id', str.substr(1)) : '');

    Object.entries(attrs).forEach(([name, value]) => el[name] = value);

    const kids = children instanceof Array ? children : [ children ];

    kids.forEach(kid => (typeof kid === 'string' || kid instanceof String)
        ? el.appendChild(document.createTextNode(kid))
        : el.appendChild(kid));

    return el;
};

/**
 * 
 * @param {Array<boolean>} featureSet 
 * @param {Array<string>} featureNames 
 * @return {string}
 */
const getFeatureDesc = (featureSet, featureNames) => {
    return featureSet.reduce((str, feature, i) => {
        const featureName = (str ? '' : ' ') + featureNames[i];
        return str + (feature ? featureName : '');
    }, '');
};

/**
 * @param {Array<Game>} games
 * @param {Array<boolean>} featureSet 
 * @param {Array<boolean>} doMatch
 * @param {Array<string>} featureNames
 * @return {Element}
 */
const createFolder = (games, featureSet, doMatch, featureNames) => {
    const matches = games.filter(game =>
        game.features.reduce((accept, feature, i) =>
            accept && (!doMatch[i] || (feature === featureSet[i])),
        true)
    ).sort((a, b) => {
        const sumFeatures = (total, feature) => total + (feature ? 1 : 0);
        const aFeatures = a.features.reduce(sumFeatures, 0);
        const bFeatures = b.features.reduce(sumFeatures, 0);

        return bFeatures - aFeatures;
    });

    return h('div.games-folder', {}, [
        h('h2', {}, getFeatureDesc(featureSet, featureNames)),
        h('ul.games-list', {}, matches.map(game => h('li', {}, [
            h('div.games-list-features', {},
                getFeatureDesc(game.features, featureNames)),
            h('a', { href: game.itunesUrl }, h('img', {src: game.imgUrl})),
            h('h3', {}, h('a', { href: game.itunesUrl }, game.name))
        ])))
    ]);
};

/**
 * Sets up the application.
 * @param {string} csvText the text of the CSV games file
 */
const main = csvText => {
    const isTextTrue = v => v.toLocaleLowerCase() === 'true';

    const csv = csvText.split('\n').map(line => 
        line.match(/"[^"]*"|[^,]+/g)
            .map(item => item.replace(/^"|"$/g, ''))
    );

    const key = csv.shift();
    const featureNames = key.slice(1, -1);

    /** @type {Array<Game>} */
    const games = csv.map(row => {
        const name      = row[0];
        const id        = row[row.length - 1];
        const imgName   = id.substr(2, 3) + '/' + id.substr(5) + '_larger.png';
        const itunesUrl = urls.itunes + id;
        const imgUrl    = urls.img + imgName;
        const features  = row.slice(1, -1).map(isTextTrue);

        return { id, name, itunesUrl, imgUrl, features };
    });

    const featureSets = [0, 1, 2, 3, 4, 5, 6, 7].map(x => [
        false, false, false, (x & 4) === 0, (x & 2) === 0, (x & 1) === 0, false
    ]);

    const folders = document.getElementById('games-folders');

    featureSets.forEach(featureSet => {
        const folder = createFolder(games, featureSet, [
            false, false, false, true, true, true, false
        ], featureNames);

        folders.appendChild(folder);
    });
};

fetch('./data.csv')
    .then(resp => resp.text())
    .then(main);