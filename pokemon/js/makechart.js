var tableId = 'maintable';
var modeId = 'mode';
var nbColumns = 3;

function formatString(msg, values) {
    if (values) {
        for (var key in values) {
            if(values.hasOwnProperty(key)) {
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

function makeElem(tag, text, parent) {
    var node = document.createElement(tag);
    var t = document.createTextNode(text);
    node.appendChild(t);
    if (parent) {
        parent.appendChild(node);
    }
    return node;
}

function isRowVisible(data, mode) {
    if (mode == 'all') {
        return true;
    }

    for (var i=0 ; i<data.length ; i++) {
        var elem = data[i];
        var custom = {};
        var candy = 0;
        if (data[i+1] && data[i+1].candy) {
            candy = data[i+1].candy;
        }
        if (window.stats && window.stats[elem.name]) {
            custom = window.stats[elem.name];
        }

        if ((mode == 'have' && custom.got) ||
            (mode == 'missing' && (!custom.got)) ||
            (mode == 'evolve' && custom.candies >= candy)) {
            return true;
        }
    }
    return false;
}

function appendRow(tr, data, mode) {
    // skip all rows with no evolution
    res = {evolve: 0, got:0, miss: 0};

    for (var i=0 ; i<3 ; i++) {
        if (i>=data.length) {
            var td = makeElem('td', '', tr);
            td.classList.add('empty');
            td = makeElem('td', '', tr);
            td.classList.add('empty');
            continue;
        }

        var elem = data[i];
        var custom = {};
        var candy = 0;
        if (data[i+1] && data[i+1].candy) {
            candy = data[i+1].candy;
        }

        if (window.stats && window.stats[elem.name]) {
            custom = window.stats[elem.name];
        }

        if (elem.candy>0) {
            var td = makeElem('td', elem.candy, tr);
            td.classList.add('large');
        }

        var td = makeElem('td', elem.name, tr);
        makeElem('div', '(#'+elem.number+')', td);
        if (custom.got) {
            td.classList.add('found');
            res.got += 1;
        } else {
            td.classList.add('missing');
            res.miss += 1;
        }
        var div = document.createElement('div');
        div.classList.add('under');

        var anchor = document.createElement('a');
        anchor.setAttribute('href', 'https://en.wikipedia.org/wiki/'+elem.name);
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
            var img = document.createElement('img');
            img.classList.add('over');
            img.setAttribute('src', 'img/evolve.png');
            div.appendChild(img);
            var count = makeElem('div', String(nbEvolve));
            count.classList.add('overnb');
            div.appendChild(count);

        }
    }
    return res;
}

function makechart(id, dataObj) {
    var mode = "all";
    var modeElem = document.getElementById(modeId);
    if (modeElem) {
        mode = modeElem.options[modeElem.selectedIndex].value;
    }

    var root = document.getElementById(id);
    if (!root) {
        var body = document.getElementsByTagName('body')[0];
        var error = 'Could not find element with ID "'+id+'"';
        console.error(error);

        var h = makeElem('div', error);
        h.classList.add('error');
        body.insertBefore(h, body.firstChild);
        return;
    }

    var t = document.createElement('table');
    var h = document.createElement('thead');
    var tr = document.createElement('tr');
    for (var i = 0 ; i<nbColumns ; i++ ) {
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
    for (var i=0 ; i<data.length ; i++) {
        if (isRowVisible(data[i].stages, mode)) {
            rowToDisplay.push(i);
        }
    }
    var nbRows = Math.ceil(rowToDisplay.length/nbColumns);

    var b = document.createElement('tbody');
    var total = {evolve: 0, got:0, miss: 0};
    for (var i=0 ; i<nbRows ; i++) {
        var tr = document.createElement('tr');
        for (var j=0 ; j<nbColumns ; j++ ) {
            if (i + j*nbRows >= rowToDisplay.length) {
                break;
            }
            var indx = rowToDisplay[i + j*nbRows];
            if (j>0) {
                var td = makeElem('td', '', tr);
                td.classList.add('separate');
            }
            var res = appendRow(tr, data[indx].stages, mode);
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

function refreshChart(id) {
    var root = document.getElementById(id);
    if (root) {
        root.innerHTML = '';
        makechart(id, window.maintable);
    }
}

document.addEventListener('DOMContentLoaded', function(event) {
    makechart(tableId, window.maintable);

    var modeElem = document.getElementById(modeId);
    if (modeElem) {
        modeElem.addEventListener("change", function(changeEvent) {
            refreshChart(tableId);
        });
    }
});
