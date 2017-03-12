var tableId = "maintable";
var modeId = "mode";
var nbColumns = 3;
var maxGeneration = 2;


function formatString(msg, values) {
    "use strict";
    if (values) {
        for (var key in values) {
            if(values.hasOwnProperty(key)) {
                var val = values[key];
                if (typeof val === "undefined") {
                    val = "undefined";
                } else if (typeof val === "object") {
                    val = JSON.stringify(val);
                }
                msg = msg.replace("{"+key+"}", val.toString());
            }
        }
    }
    return msg;
}

function checkGeneration(dataObj) {
    "use strict";
    var generationMax = [0, 151, 251, 386, 493, 649, 721, 802];
    var data = dataObj.species;
    for (var i=0 ; i<data.length ; i++) {
        var stages = data[i].stages;
        for (var j=0 ; j<stages.length ; j++) {
            if (stages[j].number) {
                var id = Number(stages[j].number);
                var gen = stages[j].gen || 1;
                if (id<=generationMax[gen-1]) {
                    console.error("Gen too high: "+stages[j].name);
                } else if (id>generationMax[gen]) {
                    console.error("Gen too low: "+stages[j].name);
                }
            }
        }
    }
}

function pokeLink(name) {
    "use strict";
    return formatString("http://bulbapedia.bulbagarden.net/wiki/{n}_(Pok%C3%A9mon)",
                        {n: name});
}

/*
  Build the index->name table
*/
function buildIdIndex() {
    "use strict";
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

/*
   Debug function to dump cleaned up stats sorted in Id order
*/
function dumpStats() {
    var ids = Object.keys(window.idIndex).sort();
    var res = 'window.stats = {\n';
    for (var i=0 ; i<ids.length ; i++) {
        var id = ids[i];
        var name = window.idIndex[id].name;
        var line = window.stats[name];
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


function makeElem(tag, text, parent) {
    "use strict";
    var node = document.createElement(tag);
    var t = document.createTextNode(text);
    node.appendChild(t);
    if (parent) {
        parent.appendChild(node);
    }
    return node;
}

function isRowVisible(data, mode) {
    "use strict";
    if (mode === "all") {
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

        if ((mode === "have" && custom.got) ||
            (mode === "missing" && (!custom.got) && (elem.gen <= maxGeneration)) ||
            (mode === "evolve" && custom.candies >= candy)) {
            return true;
        }
    }
    return false;
}

function appendPokemon(tr, elem, custom, candy) {
    // Generation
    var gen = elem.gen || 1;
    candy = candy || 0;
    var res = {evolve: 0, got:0, miss: 0};

    let td = makeElem("td", elem.name, tr);
    makeElem("div", "(#"+elem.number+")", td);
    if (custom.got) {
        td.classList.add("found");
        res.got += 1;
    } else if (gen <= maxGeneration){
        td.classList.add("missing");
        res.miss += 1;
    }
    td.classList.add("gen"+gen);

    if (gen>maxGeneration) {
        candy = 99999
    }
    var div = document.createElement("div");
    div.classList.add("under");

    var anchor = document.createElement("a");
    anchor.setAttribute("href", pokeLink(elem.name));
    var img = document.createElement("img");
    img.classList.add("pokemon");
    img.setAttribute("src", "img/"+elem.number+".png");
    img.setAttribute("title", elem.name);
    anchor.appendChild(img);
    div.appendChild(anchor);
    td.insertBefore(div, td.firstChild);

    if (custom.candies >= candy) {
        var nbEvolve = Math.floor(custom.candies/candy);
        // Special case for Eevee which can eveolve to 3 kinds
        if (!elem.noevolve) {
            res.evolve += nbEvolve;
        }
        img = document.createElement("img");
        img.classList.add("over");
        img.setAttribute("src", "img/evolve.png");
        div.appendChild(img);
        var count = makeElem("div", String(nbEvolve));
        count.classList.add("overnb");
        div.appendChild(count);
    }
    
    if (gen>maxGeneration) {
        var anchor = document.createElement("a");
        anchor.setAttribute("href", pokeLink(elem.name));
        img = document.createElement("img");
        img.classList.add("lock");
        img.setAttribute("src", "img/lock.png");
        anchor.appendChild(img);
        div.appendChild(anchor);
    }

    return res;
}

function appendRow(tr, data) {
    "use strict";
    // skip all rows with no evolution
    var res = {evolve: 0, got:0, miss: 0};

    for (var i=0 ; i<3 ; i++) {
        if (i>=data.length) {
            let td = makeElem("td", "", tr);
            td.classList.add("empty");
            td = makeElem("td", "", tr);
            td.classList.add("empty");
            continue;
        }

        var elem = data[i];
        if (elem.skip) {
            if (i>0) {
                let td = makeElem("td", "", tr);
                td.classList.add("empty");
            }
            let td = makeElem("td", "", tr);
            td.classList.add("empty");
            var img = document.createElement("img");
            img.setAttribute("src", "img/arrow.png");
            img.classList.add("pokemon");
            td.appendChild(img);
            continue;
        }

        if (elem.noPokemon) {
            let td = makeElem("td", "", tr);
            td.classList.add("empty");
            td = makeElem("td", "", tr);
            td.classList.add("empty");
            var img = document.createElement("img");
            img.classList.add("pokemon");
            img.setAttribute("src", "img/noPokemon.png");
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
            let td = makeElem("td", elem.candy, tr);
            td.classList.add("large");
        }
        if (elem.candy<0) {
            let td = makeElem("td", "?", tr);
            td.classList.add("large");
        }
        var tmpRes = appendPokemon(tr, elem, custom, candy);
        res.evolve += tmpRes.evolve;
        res.got += tmpRes.got;
        res.miss += tmpRes.miss;
    }
    return res;
}

/*
 */
function makeSortedMissingChart(root, dataObj) {
    var ids = Object.keys(window.idIndex).sort();
    var t = document.createElement("table");
    var h = document.createElement("thead");
    var tr = document.createElement("tr");
    var nbCol = nbColumns*4;
    for (var i = 0 ; i<nbCol ; i++ ) {
        makeElem("th", "Pokemon", tr);
    }
    h.appendChild(tr);
    t.appendChild(h);

    // Find the missing pokemons
    var toDisplay = [];
    for (var i=0 ; i<ids.length ; i++) {
        var id = ids[i];
        var name = window.idIndex[id].name;
        if (window.stats[name] &&
            (!window.stats[name].got) &&
            (window.idIndex[id].gen <= maxGeneration)) {
            toDisplay.push(id);
        }
    }
    var nbRows = Math.ceil(toDisplay.length/nbCol);
    var b = document.createElement("tbody");
    var indx = 0;
    for (i=0 ; i<nbRows ; i++) {
        tr = document.createElement("tr");
        for (var j=0 ; j<nbCol ; j++ ) {
            if (indx >= toDisplay.length) {
                break;
            }
            var id = toDisplay[indx];
            var name = window.idIndex[id].name;
            var custom = {};
            if (window.stats && window.stats[name]) {
                custom = window.stats[name];
            }
            var res = appendPokemon(tr, window.idIndex[id], custom);

            indx++;
        }
        b.appendChild(tr);
    }
    t.appendChild(b);
    makeElem("div", formatString("Missing {m}", {m: toDisplay.length}), root);

    root.appendChild(t);

}

/*
*/
function makechart(id, dataObj) {
    "use strict";
    var mode = "all";
    var modeElem = document.getElementById(modeId);
    if (modeElem) {
        mode = modeElem.options[modeElem.selectedIndex].value;
    }

    var root = document.getElementById(id);
    if (!root) {
        var body = document.getElementsByTagName("body")[0];
        var error = 'Could not find element with ID "'+id+'"';
        console.error(error);

        var d = makeElem("div", error);
        d.classList.add("error");
        body.insertBefore(d, body.firstChild);
        return;
    }

    if (mode == 'sortedMissing') {
        makeSortedMissingChart(root, dataObj);
        return;
    }

    var t = document.createElement("table");
    var h = document.createElement("thead");
    var tr = document.createElement("tr");
    for (var i = 0 ; i<nbColumns ; i++ ) {
        makeElem("th", "Stage 1", tr);
        makeElem("th", "Candies", tr);
        makeElem("th", "Stage 2", tr);
        makeElem("th", "Candies", tr);
        makeElem("th", "Stage 3", tr);
        if (i<nbColumns-1) {
            var sep = makeElem("th", "", tr);
            sep.setAttribute("style", "width: 2em;");
        }
    }
    h.appendChild(tr);
    t.appendChild(h);

    var data = dataObj.species;

    // Find the rows to display
    var rowToDisplay = [];
    for (i=0 ; i<data.length ; i++) {
        if (isRowVisible(data[i].stages, mode)) {
            rowToDisplay.push(i);
        }
    }
    var nbRows = Math.ceil(rowToDisplay.length/nbColumns);

    var b = document.createElement("tbody");
    var total = {evolve: 0, got:0, miss: 0};
    for (i=0 ; i<nbRows ; i++) {
        tr = document.createElement("tr");
        for (var j=0 ; j<nbColumns ; j++ ) {
            if (i + j*nbRows >= rowToDisplay.length) {
                break;
            }
            var indx = rowToDisplay[i + j*nbRows];
            if (j>0) {
                var td = makeElem("td", "", tr);
                td.classList.add("separate");
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

    makeElem("div", formatString("Total: {total}, missing {miss}, can evolve {evolve} (aim at 70)", total), root);

    root.appendChild(t);
}

function refreshChart(id) {
    "use strict";
    var root = document.getElementById(id);
    if (root) {
        root.innerHTML = "";
        makechart(id, window.maintable);
    }
}

document.addEventListener("DOMContentLoaded", function(event) {
    "use strict";

    buildIdIndex();
    checkGeneration(window.maintable);
    makechart(tableId, window.maintable);
    // dumpStats();

    var modeElem = document.getElementById(modeId);
    if (modeElem) {
        modeElem.addEventListener("change", function(changeEvent) {
            refreshChart(tableId);
        });
    }
});
