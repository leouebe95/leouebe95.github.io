//
(function() {
    'use strict';
    // Global constants

    // Global internal variables.
    var practiceLines = [];

    function storeLines(data) {
        practiceLines = data;
    }

    function addCell(row, text) {
        var cell = document.createElement('td');
        cell.innerText = text;
        row.appendChild(cell);
    }

    function refreshPage() {
        var resultArea = document.getElementById('result');
        var ids = [];

        // Empty everything first
        resultArea.innerHTML = '';

        var table = document.createElement('table');
        for (var i=0 ; i<practiceLines.length ; i++) {
            var elem = practiceLines[i];
            var row = document.createElement('tr');
            //addCell(row, elem.id);
            //addCell(row, elem.grade);
            addCell(row, elem.nihongo);
            addCell(row, elem.english);
            table.appendChild(row);
            ids.push(elem.id);
        }

        var idList = ids.join('-');
        resultArea.innerHTML = '<div><a href="showSheet.html?ids='+
            idList+
            '&shuffle=0&english=0">Practice page</a> with those sentences:</div>';
        resultArea.appendChild(table);

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
        var search = window.location.search;

        //search = '?kanjis=足入円出子石空花月年雨青';
        xmlhttp.open('GET', '../php/selectData.php' + search, true);
        xmlhttp.send();
    }

    function parseQuery(qstr) {
        var query = {};
        var a = (qstr[0] === '?' ? qstr.substr(1) : qstr).split('&');
        for (var i = 0; i < a.length; i++) {
            var b = a[i].split('=');
            query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
        }
        return query;
    }

    function setParamsFromURL() {
        var values = parseQuery(window.location.search);
        var mode = document.getElementById('mode');
        var text = '';
        if (values.hasOwnProperty('incl')) {
            text = values.incl;
            mode.value = 'incl';
        } else if (values.hasOwnProperty('excl')) {
            text = values.excl;
            mode.value = 'excl';
        }
        document.getElementById('kanjies').value = text;
    }

    function setURLFromParams() {

        var mode = document.getElementById('mode').value;
        var kanjies = document.getElementById('kanjies').value;

        var search = '?' + mode + '=' + kanjies;
        if (search !== decodeURIComponent(window.location.search)) {
            window.location.search = search;
        }
    }

    /**
       Refresh the page after some input changes.
    */
    function recomputePage() {
        setURLFromParams();
        refreshPage();
    }

    function setup() {
        document.getElementById('mode').addEventListener('change', recomputePage);
        document.getElementById('kanjies').addEventListener('change', recomputePage);
        document.getElementById('refresh').addEventListener('click', loadData);
        setParamsFromURL();
        loadData();
    }

    document.addEventListener('DOMContentLoaded', setup);
})();
