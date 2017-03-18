(function() {
    'use strict';
    
    /**
       Recompute the final sheet based on user parameters.

       @param {Object} data collected data from the UI
    */
    function setData(data) {
        var inputString = data.data.value;
        var shuffle = data.shuffle.checked;
        var maxlines = data.maxlines.value;

        // Normalize the Japanese characters used for syntax
        var remap = {
            '（': '(',
            '〔': '(',
            '【': '(',

            '）': ')',
            '〕': ')',
            '】': ')'
        };
        for(var key in remap) {
            inputString = inputString.replace(new RegExp(key, 'g'), remap[key]);
        }

        var lines = inputString.trim().split('\n');

        var top = document.getElementById('result');

        // Empty everything first
        top.innerHTML = '';

        var area = document.createElement('div'); // Create a <div> per area
        area.classList.add('flushright');
        top.appendChild(area);
        var nbLines = 0;
        var indirect = [];
        for (let i = 0; i<lines.length; i++) {
            indirect.push(i);
        }

        if (shuffle) {
            for (var ii=lines.length-1 ; ii>1 ; ii--) {
                var jj = Math.floor(Math.random()*ii);
                var tmp = indirect[ii];
                indirect[ii] = indirect[jj];
                indirect[jj] = tmp;
            }
        }

        for (let i=0 ; i<lines.length ; i++) {
            var line = lines[indirect[i]].trim();
            if (line === '') {
                continue;
            }

            if (nbLines >= maxlines) {
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
        }
    }

    var inputs = ['data', 'shuffle', 'maxlines'];

    /**
       Refresh the page after someinput changes.
    */
    function refreshPage() {
        var data = {};
        for (var i=0 ; i<inputs.length ; i++) {
            data[inputs[i]] = document.getElementById(inputs[i]);
        }
        setData(data);
    }

    /**
       Switch to one predefined set and refresh the page.
    */
    function updatePredefinedSet() {
        var predef = document.getElementById('predef');
        var set = predef.value;
        var inString = window.inputData[set];
        if (inString) {
            inString = inString.replace(/ /g, '');
            inString = inString.replace(/^\n/g, '');
            var data = document.getElementById('data');
            data.value = inString;
            refreshPage();
        }
    }

    /**
       Change the practice sheep display style and refresh the page.
    */
    function refreshStyle() {
        var mode = document.getElementById('mode');
        var data = document.getElementById('result');
        data.className = mode.value;
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

        data = document.getElementById('predef');
        data.addEventListener('change', updatePredefinedSet);

        updatePredefinedSet();
        refreshPage();
        refreshStyle();
    }

    document.addEventListener('DOMContentLoaded', setup);
})();
