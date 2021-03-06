
/* eslint no-console: ["error", { allow: ["error", "log"] }] */

var tableId = 'maintable';
var modeId = 'mode';
var nbColumns = 3;
var maxGeneration = 3;

/**
    Helper method to format string from key/value objects. All
    occurrences of {xxx} are replaced with the corresponding value
    read from the 'values' object.

    @param {String} msg Message to format.
    @param {Object} values key/value object.
    @return {String} The formatted string.
*/
function formatString(msg, values) {
    'use strict';

    if (values) {
        for (var key in values) {
            if (values.hasOwnProperty(key)) {
                var val = values[key];
                if (typeof val === 'undefined') {
                    val = 'undefined';
                } else if (typeof val === 'object') {
                    val = JSON.stringify(val);
                }
                msg = msg.replace('{'+key+'}', val.toString());
            }
        }
    }
    return msg;
}

/**
   make sure all indices are set once andonly once.
  
   @param {Object} dataObj entire database
*/

function checkDB(data) {
    var max = 803;
    var found = Array(max).fill(0);
    data.species.forEach(x => {
        if (x.stages) {
            x.stages.forEach(entry => {
                if (entry.number) {
                    var indx = parseInt(entry.number);
                    if (indx <= 0) {
                        console.error('Bad index', indx);
                    } else if (indx >= max) {
                        console.error('Bad index', indx);
                    } else {
                        found[indx] ++;
                    }
                }
            });
        }
    });

    for (var i=1 ; i<max ; i++) {
        if (found[i] === 0) {
            console.error('Missing', i);
        } else if (found[i] > 1) {
            console.error('Multiple entry', i, found[i]);
        }
    }
}

/**
   Set the Generation to the proper value. Also add the MAX CP value
   to the datamodel.

   @param {Object} dataObj Global database.
*/
function setGeneration(dataObj) {
    'use strict';

    var generationMax = [1, 152, 252, 387, 494, 650, 722, 803, 99999];
    var data = dataObj.species;
    for (var i=0 ; i<data.length ; i++) {
        var stages = data[i].stages;
        for (var j=0 ; j<stages.length ; j++) {
            if (stages[j].number) {
                var id = Number(stages[j].number);
                var gen = 1;
                while (id>=generationMax[gen]) {
                    gen += 1;
                }
                stages[j].gen = gen;
                if (window.maxCP[id] === undefined) {
                    stages[j].maxCP = '?';
                } else {
                    stages[j].maxCP = window.maxCP[id];
                }
            }
        }
    }
}

/**
    Return the hyper-link to the description of this Pokemon.

    @param {String} name Pokemon name.
    @return {String} the hyper-link
*/
function pokeLink(name) {
    'use strict';
    return formatString('http://bulbapedia.bulbagarden.net/wiki/{n}_(Pok%C3%A9mon)',
                        {n: name});
}

/**
  Build the index->name table
*/
function buildIdIndex() {
    'use strict';

    window.idIndex = {};
    var data = window.maintable.species;
    for (var i=0 ; i<data.length ; i++) {
        var stages = data[i].stages;
        for (var j=0 ; j<stages.length ; j++) {
            if (stages[j].number) {
                window.idIndex[stages[j].number] = stages[j];
            }
        }
    }
}

/**
  Build the index->maxCP table
*/
function buildMaxCP() {
    'use strict';

    window.maxCP = {};
    var data = window.maxCPinputData;
    for (var i=0 ; i<data.length ; i++) {
        var id = data[i][0];
        window.maxCP[id] = data[i][4];
    }
}

/**
   Debug function to dump cleaned up stats in the console, sorted in Id order.
   @param {Boolean} [reset] When set to true, all candies values are reset.
*/
function dumpStats(reset) {
    'use strict';

    var ids = Object.keys(window.idIndex).sort();
    var res = 'window.stats = {\n';
    for (var i=0 ; i<ids.length ; i++) {
        var id = ids[i];
        var name = window.idIndex[id].name;
        var line = window.stats[name];
        if (line === undefined) { continue; }
        if (reset && (line.candies !== undefined)) {
            delete line.candies;
        }
        if (line.candies === 0) {
            delete line.candies;
        }
        res += formatString('    "{n}": {l},\n',
                            {n: name,
                             l: JSON.stringify(line)});
    }
    res += '};\n';
    console.log(res);
}

/**
   Dump stats in the console with all candies reset.
*/
function dumpResetStats() {
    'use strict';
    dumpStats(true);
}

/**
   Save the setting into local storage.
*/
function saveSettings() {
    'use strict';
    var settings = {};
    var modeElem = document.getElementById(modeId);
    settings.mode = modeElem.options[modeElem.selectedIndex].value;
    localStorage.pokemonUIPrefs = JSON.stringify(settings);
    localStorage.pokemonUIPrefsVersion = '1.0';
}

/**
   Load the settings from local storage if they exist
*/
function loadSettings() {
    'use strict';
    if (localStorage.pokemonUIPrefs) {
        var settings =
            JSON.parse(localStorage.pokemonUIPrefs);
        var modeElem = document.getElementById(modeId);
        modeElem.value = settings.mode;
    }
}

/**
    Helper method to create a DOM element with text.

    @param {String} tag Element TAG name.
    @param {String} text The text to add.
    @param {DOMelement} [parent] Parent element.
    @return {DOMelement} The new DOM element.
*/
function makeElem(tag, text, parent) {
    'use strict';
    var node = document.createElement(tag);
    var t = document.createTextNode(text);
    node.appendChild(t);
    if (parent) {
        parent.appendChild(node);
    }
    return node;
}

/**
   Check visibility of the whole Pokemon row based on UI settings.

   @param {Object} data Object containing all data for this row.
   @param {String} mode UI mode
   @return {Boolean} True if this row is visible based on the user filters.
*/
function isRowVisible(data, mode) {
    'use strict';
    if (mode === 'all') {
        return true;
    }

    for (var i=0 ; i<data.length ; i++) {
        var elem = data[i];
        var custom = {};
        var candy = 0;
        if (elem.skip || elem.noPokemon) {
            continue;
        }
        if (data[i+1] && data[i+1].candy) {
            candy = data[i+1].candy;
        }
        if (window.stats && window.stats[elem.name]) {
            custom = window.stats[elem.name];
        }

        switch (mode) {
        case 'have':
            if (custom.got) {return true;}
            break;
        case 'missingevolve':
            if (i===0) {
                if (!custom.got) {return false;}
                break;
            }
        case 'missing':
            if ((!custom.got) && (elem.gen <= maxGeneration)) {
                return true;
            }
            break;
        default: // case 'evolve':
            if (custom.candies >= candy) { return true;}
            break;
        }
    }
    return false;
}

/**
   Append the Pokemon to the table.
   @param {DOMelement} tr Table row to append to.
   @param {Object} elem Pokemon data.
   @param {Object} custom Pokemon custom data (caught and candies).
   @param {Number} candy Number of candies required for evolution.
   @return {Object} number of got, missing, and can evolve.
*/
function appendPokemon(tr, elem, custom, candy) {
    'use strict';

    // Generation
    var gen = elem.gen || 1;
    candy = candy || 9999999;
    var res = {evolve: 0, got:0, miss: 0};

    let td = makeElem('td', elem.name, tr);
    makeElem('div', '(#'+elem.number+')', td);
    makeElem('div', 'MaxCP '+elem.maxCP, td);
    if (custom.got) {
        td.classList.add('found');
        res.got += 1;
    } else if (gen <= maxGeneration){
        td.classList.add('missing');
        res.miss += 1;
    }
    td.classList.add('gen'+gen);

    if (gen>maxGeneration) {
        candy = 99999;
    }
    var div = document.createElement('div');
    div.classList.add('under');

    var anchor = document.createElement('a');
    anchor.setAttribute('href', pokeLink(elem.name));
    var img = document.createElement('img');
    img.classList.add('pokemon');
    img.setAttribute('src', 'img/'+elem.number+'.png');
    img.setAttribute('title', elem.name);
    anchor.appendChild(img);
    div.appendChild(anchor);
    td.insertBefore(div, td.firstChild);

    if (custom.candies >= candy) {
        var nbEvolve = Math.floor(custom.candies/candy);
        // Special case for Eevee which can eveolve to 3 kinds
        if (!elem.noevolve) {
            res.evolve += nbEvolve;
        }
        img = document.createElement('img');
        img.classList.add('over');
        img.setAttribute('src', 'img/evolve.png');
        div.appendChild(img);
        var count = makeElem('div', String(nbEvolve));
        count.classList.add('overnb');
        div.appendChild(count);
    }

    if (gen>maxGeneration) {
        anchor = document.createElement('a');
        anchor.setAttribute('href', pokeLink(elem.name));
        img = document.createElement('img');
        img.classList.add('lock');
        img.setAttribute('src', 'img/lock.png');
        anchor.appendChild(img);
        div.appendChild(anchor);
    }

    return res;
}

/**
   Append an entire row of Pokemons to the table.

   @param {DOMelement} tr Table row to append to.
   @param {Object} data Pokemon row data
   @return {Object} number of got, missing, and can evolve.
*/
function appendRow(tr, data) {
    'use strict';
    // skip all rows with no evolution
    var res = {evolve: 0, got:0, miss: 0};
    var itemName = {
        rock: "King's rock",
        sun: 'Sun stone',
        metal: 'Metal coat',
        dragon: 'Dragon scale',
        upgrade: 'Upgrade'
    };

    for (var i=0 ; i<3 ; i++) {
        if (i>=data.length) {
            let td = makeElem('td', '', tr);
            td.classList.add('empty');
            td = makeElem('td', '', tr);
            td.classList.add('empty');
            continue;
        }

        var elem = data[i];
        if (elem.skip) {
            if (i>0) {
                let td = makeElem('td', '', tr);
                td.classList.add('empty');
            }
            let td = makeElem('td', '', tr);
            td.classList.add('empty');
            let img = document.createElement('img');
            img.setAttribute('src', 'img/arrow.png');
            img.classList.add('pokemon');
            td.appendChild(img);
            continue;
        }

        if (elem.noPokemon) {
            let td = makeElem('td', '', tr);
            td.classList.add('empty');
            td = makeElem('td', '', tr);
            td.classList.add('empty');
            let img = document.createElement('img');
            img.classList.add('pokemon');
            img.setAttribute('src', 'img/noPokemon.png');
            td.appendChild(img);
            continue;
        }

        var custom = {};
        var candy = 0;
        if (data[i+1] && data[i+1].candy) {
            candy = data[i+1].candy;
        }

        if (window.stats && window.stats[elem.name]) {
            custom = window.stats[elem.name];
        }

        if (elem.candy>0) {
            let td = makeElem('td', elem.candy, tr);
            if (elem.item) {
                var br = document.createElement('br');
                td.appendChild(br);
                var img = document.createElement('img');
                img.classList.add('item');
                img.setAttribute('src', 'img/'+elem.item+'.png');
                img.setAttribute('title', itemName[elem.item]);
                td.appendChild(img);
            }
            td.classList.add('large');
        }
        if (elem.candy<0) {
            let td = makeElem('td', '?', tr);
            td.classList.add('large');
        }
        var tmpRes = appendPokemon(tr, elem, custom, candy);
        res.evolve += tmpRes.evolve;
        res.got += tmpRes.got;
        res.miss += tmpRes.miss;
    }
    return res;
}

/**
   Make a flat sorted chart of pokemon, from the id list.

   @param {DOMElement} root whre to build the table
   @param {IntArray} toDisplay List of IDs to display
   @param {Strinf} feedback Lne ti display with the number of pokemon found
   @return {undefined}
*/
function makeSortedChart(root, toDisplay, feedback) {
    'use strict';

    var t = document.createElement('table');
    var h = document.createElement('thead');
    var tr = document.createElement('tr');
    var nbCol = nbColumns*4;
    for (var i = 0 ; i<nbCol ; i++ ) {
        makeElem('th', 'Pokemon', tr);
    }
    h.appendChild(tr);
    t.appendChild(h);

    var nbRows = Math.ceil(toDisplay.length/nbCol);
    var b = document.createElement('tbody');
    var indx = 0;
    for (let i=0 ; i<nbRows ; i++) {
        tr = document.createElement('tr');
        for (var j=0 ; j<nbCol ; j++ ) {
            if (indx >= toDisplay.length) {
                break;
            }
            let id = toDisplay[indx];
            let name = window.idIndex[id].name;
            var custom = {};
            if (window.stats && window.stats[name]) {
                custom = window.stats[name];
            }
            appendPokemon(tr, window.idIndex[id], custom);

            indx++;
        }
        b.appendChild(tr);
    }
    t.appendChild(b);

    makeElem('div', formatString(feedback, {l: toDisplay.length}), root);

    root.appendChild(t);
}

/**
   Make a simplified chart with only the caught Pokemons sorted per
   max CP.
   @param {DOMelement} root DOM element where to construct the table.
   @param {Boolean} all when true, all pokemons are displayed, no just
   the caught ones.
*/
function makeHaveCPChart(root, all) {
    'use strict';
    // Find the missing pokemons
    var toDisplay = [];
    var ids = Object.keys(window.idIndex);
    for (let i=0 ; i<ids.length ; i++) {
        let id = ids[i];
        let name = window.idIndex[id].name;
        if (window.stats[name] &&
            (all || window.stats[name].got) &&
            (window.idIndex[id].gen <= maxGeneration)) {
            toDisplay.push(id);
        }
    }

    toDisplay.sort(function(x, y) {
        // swap x, y to do a reverse sort
        return window.maxCP[Number(y)] - window.maxCP[Number(x)];
    });
    var feedback = all ? 'All {l}' : 'Caught {l}';
    makeSortedChart(root, toDisplay, feedback);
}

/**
   Make a simplified chart with only the missing Pokemons sorted per
   ID.
   @param {DOMelement} root DOM element where to construct the table.
*/
function makeSortedMissingChart(root) {
    'use strict';
    // Find the missing pokemons
    var toDisplay = [];
    var ids = Object.keys(window.idIndex).sort();
    for (let i=0 ; i<ids.length ; i++) {
        let id = ids[i];
        let name = window.idIndex[id].name;
        if (window.stats[name] &&
            (!window.stats[name].got) &&
            (window.idIndex[id].gen <= maxGeneration)) {
            toDisplay.push(id);
        }
    }
    makeSortedChart(root, toDisplay, 'Missing {l}');
}


/**
   Create the actual chart.

   @param {String} id Unique id of the main table.
   @param {Object} dataObj Global database.
*/
function makechart(id, dataObj) {
    'use strict';
    var mode = 'all';
    var modeElem = document.getElementById(modeId);
    if (modeElem) {
        mode = modeElem.options[modeElem.selectedIndex].value;
    }

    var root = document.getElementById(id);
    if (!root) {
        var body = document.getElementsByTagName('body')[0];
        var error = 'Could not find element with ID "'+id+'"';
        console.error(error);

        var d = makeElem('div', error);
        d.classList.add('error');
        body.insertBefore(d, body.firstChild);
        return;
    }

    if (mode === 'sortedMissing') {
        makeSortedMissingChart(root);
        return;
    }
    if (mode === 'allCP') {
        makeHaveCPChart(root, true);
        return;
    }
    if (mode === 'haveCP') {
        makeHaveCPChart(root);
        return;
    }

    var t = document.createElement('table');
    var h = document.createElement('thead');
    var tr = document.createElement('tr');
    for (let i = 0 ; i<nbColumns ; i++ ) {
        makeElem('th', 'Stage 1', tr);
        makeElem('th', 'Candies', tr);
        makeElem('th', 'Stage 2', tr);
        makeElem('th', 'Candies', tr);
        makeElem('th', 'Stage 3', tr);
        if (i<nbColumns-1) {
            var sep = makeElem('th', '', tr);
            sep.setAttribute('style', 'width: 2em;');
        }
    }
    h.appendChild(tr);
    t.appendChild(h);

    var data = dataObj.species;

    // Find the rows to display
    var rowToDisplay = [];
    for (let i=0 ; i<data.length ; i++) {
        if (isRowVisible(data[i].stages, mode)) {
            rowToDisplay.push(i);
        }
    }
    var nbRows = Math.ceil(rowToDisplay.length/nbColumns);

    var b = document.createElement('tbody');
    var total = {evolve: 0, got:0, miss: 0};
    for (let i=0 ; i<nbRows ; i++) {
        tr = document.createElement('tr');
        for (var j=0 ; j<nbColumns ; j++ ) {
            if (i + j*nbRows >= rowToDisplay.length) {
                break;
            }
            var indx = rowToDisplay[i + j*nbRows];
            if (j>0) {
                var td = makeElem('td', '', tr);
                td.classList.add('separate');
            }
            var res = appendRow(tr, data[indx].stages);
            total.evolve += res.evolve;
            total.got    += res.got;
            total.miss   += res.miss;
        }
        b.appendChild(tr);
    }
    total.total = total.got+total.miss;

    t.appendChild(b);

    makeElem('div', formatString('Total: {total}, missing {miss}, can evolve {evolve} (aim at 70)', total), root);

    root.appendChild(t);
}

/**
   Recompute the whole chart

   @param {String} id Unique id of the main table.
*/
function refreshChart(id) {
    'use strict';
    var root = document.getElementById(id);
    if (root) {
        root.innerHTML = '';
        makechart(id, window.maintable);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    buildMaxCP();
    buildIdIndex();
    setGeneration(window.maintable);
    loadSettings();
    makechart(tableId, window.maintable);
    // dumpStats();
    checkDB(window.maintable);
    
    var modeElem = document.getElementById(modeId);
    if (modeElem) {
        modeElem.addEventListener('change', function() {
            saveSettings();
            refreshChart(tableId);
        });
    }

    document.getElementById('reset').addEventListener('click', dumpResetStats);
});
