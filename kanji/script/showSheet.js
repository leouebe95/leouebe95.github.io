(function() {
    'use strict';
    // Global constants
    var maxNbTranslate = 4;
    var maxNbLinesPerRow = 10;
    var maxNbLines = maxNbLinesPerRow * 2;

    // Global internal variables.
    var practiceLines = [];

    /**
       Convert the query string to a dictionary
       @param {String} qstr Input string from the URL
       @return {Object} The parsed dictionary
    */
    function parseQuery(qstr) {
        var query = {};
        var a = (qstr[0] === '?' ? qstr.substr(1) : qstr).split('&');
        for (var i = 0; i < a.length; i++) {
            var b = a[i].split('=');
            query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
        }
        return query;
    }

    /**
       Store the practice lines in internal variables.
       Lines are normalized before storing.
       @param {String[]} data Lines to display
       @return {undefined}
    */
    function storeLines(data) {
        // Normalize the Japanese characters used for syntax
        var remap = {
            '（': '(',
            '〔': '(',
            '【': '(',

            '）': ')',
            '〕': ')',
            '】': ')'
        };
        for (var i=0 ; i<data.length ; i++) {
            var nihongo = data[i].nihongo;
            for (var key in remap) {
                nihongo = nihongo.replace(new RegExp(key, 'g'), remap[key]);
            }
            data[i].nihongo = nihongo;
        }

        practiceLines = data.slice(0, maxNbLines);
    }

    /**
       Recompute the final sheet based on user parameters.

       @param {Object} data collected data from the UI
    */
    function recomputePage(data) {
        var shuffle = data.shuffle.checked;
        var english = data.english.checked;

        var top = document.getElementById('result');
        var eng = document.getElementById('translation');

        // Empty everything first
        top.innerHTML = '';
        eng.innerHTML = '';

        var area = document.createElement('div'); // Create a <div> per area
        area.classList.add('flushright');
        top.appendChild(area);


        if (english) {
            var engTable = document.createElement('table');
            engTable.classList.add('halfborder');
            var engRow = [];
            for (var j=0 ; j<maxNbTranslate ; j++) {
                engRow[j] = document.createElement('tr');
                engTable.appendChild(engRow[j]);
            }
            eng.appendChild(engTable);
        }

        // Compute the lines order in a separate array, to preserve
        // the original line order.
        var indirect = [];
        for (let i = 0; i<practiceLines.length; i++) {
            indirect.push(i);
        }
        if (shuffle) {
            for (var ii=practiceLines.length-1 ; ii>1 ; ii--) {
                var jj = Math.floor(Math.random()*ii);
                var tmp = indirect[ii];
                indirect[ii] = indirect[jj];
                indirect[jj] = tmp;
            }
        }

        var nbLines = 0;
        var nbEngLines = 0;
        for (let i=0 ; i<practiceLines.length ; i++) {
            var line = practiceLines[indirect[i]].nihongo.trim();
            if (line === '') {
                continue;
            }

            if (nbLines >= maxNbLinesPerRow) {
                nbLines = 0;
                // Create a new section
                var sep = document.createElement('hr');
                top.appendChild(sep);
                area = document.createElement('div');
                area.classList.add('flushright');
                top.appendChild(area);
            }
            nbLines++;

            if (area.hasChildNodes()) {
                var space = document.createElement('div');
                space.classList.add('blank');
                area.insertBefore(space, area.firstChild);
            }

            // Real practice line. X(xxx) is a kanji followed by
            // phonetics
            line = line.replace(/(.)\(([^()]+)\)/g,
                                '<ruby><rb>$1</rb><rt>$2</rt></ruby>');

            var elem = document.createElement('span');
            elem.classList.add('practice');
            elem.innerHTML = line;
            area.insertBefore(elem, area.firstChild);

            if (english) {
                var elem2 = document.createElement('span');
                elem2.classList.add('normal');
                elem2.innerHTML = (i+1)+'.';
                elem.insertBefore(elem2, elem.firstChild);

                if (nbEngLines >= maxNbTranslate) {
                    nbEngLines = 0;
                }

                var engItem = document.createElement('td');
                engItem.innerHTML = (i+1)+'. '+practiceLines[indirect[i]].english.trim();
                engRow[nbEngLines].appendChild(engItem);
                nbEngLines ++;
            }
        }
    }

    var inputs = ['shuffle', 'english'];

    /**
       Refresh the page after some input changes.
    */
    function refreshPage() {
        var data = {};
        for (var i=0 ; i<inputs.length ; i++) {
            data[inputs[i]] = document.getElementById(inputs[i]);
        }
        recomputePage(data);
        refreshStyle();
        setURLFromParams();
    }

    /**
       Load data from URL
    */
    function loadData() {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                try {
                    storeLines(JSON.parse(this.responseText));
                    refreshPage();
                } catch (e) {
                    if (e instanceof SyntaxError) {
                        console.error('Syntax Error', e);
                    } else {
                        console.error(e);
                    }
                }
            }
        };
        xmlhttp.open('GET', '../php/getData.php' + window.location.search, true);
        xmlhttp.send();
    }

    /**
       Change the practice sheet display style and refresh the page.
    */
    function refreshStyle() {
        var mode = document.getElementById('mode');
        var data = document.getElementById('result');
        data.className = mode.value;
        setURLFromParams();
    }
    /**
       Set internal values from URL paramters
       @return {undefined}
    */

    function setParamsFromURL() {
        var values = parseQuery(window.location.search);
        var i, val;
        for (i=0 ; i<inputs.length ; i++) {
            if (values.hasOwnProperty(inputs[i])) {
                val = parseInt(values[inputs[i]]);
                var data = document.getElementById(inputs[i]).checked = val;
            }
        }

        if (values.hasOwnProperty('mode')) {
            var mode = document.getElementById('mode');
            val = values.mode.trim();
            // Only assign if this is a valid keyword
            var opts = mode.options;
            for (i=0; i<opts.length; i++) {
                if (val === opts[i].value) {
                    mode.value = val;
                    break;
                }
            }
        }
    }
    /**
       Change the URL to reflect internal settings
       @return {undefined}
    */
    function setURLFromParams() {
        var values = parseQuery(window.location.search);
        for (var i=0 ; i<inputs.length ; i++) {
            values[inputs[i]] =
                document.getElementById(inputs[i]).checked ? 1 : 0;
        }
        var mode = document.getElementById('mode');
        values.mode = mode.value;

        var search = Object.keys(values).map(function(key) {
            return [key, values[key]].map(encodeURIComponent).join('=');
        }).join('&');

        var base = window.location.href.split(/[?]/)[0];
        var url = base+'?'+search;

        window.history.replaceState({}, '', url);
    }

    /**
       Setup the page: configure UI callbacks and expand the web
       components.
    */
    function setup() {
        var data;
        for (var i=0 ; i<inputs.length ; i++) {
            data = document.getElementById(inputs[i]);
            data.addEventListener('change', refreshPage);
        }

        data = document.getElementById('mode');
        data.addEventListener('change', refreshStyle);

        setParamsFromURL();

        loadData();
    }

    document.addEventListener('DOMContentLoaded', setup);
})();
