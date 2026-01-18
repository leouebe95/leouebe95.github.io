// -*- coding: utf-8 -*-
/*!
   @fileOverview Main file for japanese vocabulary flashcards
*/

(function() {
    const filters = ['Source', 'Proficiency', 'Category', 'Date', 'isKana'];
    const __fields = ['Random', 'Kanji', 'Kana', 'Romaji', 'English'];
    const __fieldLabels = {'Kanji': '漢字', 'Kana': 'ひらがな / カタカナ'};

    var __db = null;

    /*!
     */
    function setMessage(msg) {
        document.getElementById('messageBox').innerText = msg;
    }

    /*!
       Generate all the data to print
     */
    function createPrintSheet() {
        var wordTableRoot = document.getElementById('words');
        var wordCount = document.getElementById('wordCount');
        wordCount.innerText = `Showing ${__db.numLeft} words.`;

        var wordMgr = new WordTable(__db.numLeft, 2);
        while (__db.numLeft > 0) {
            var item = __db.pickOne(true, 0);
            wordMgr.addLine(item);
        }

        wordTableRoot.innerText = '';
        wordMgr.addTable(wordTableRoot);
    }

    /*!
       Generate all the data in python format
     */
    function pythonOutput() {
        var wordTableRoot = document.getElementById('words');
        var wordCount = document.getElementById('wordCount');
        wordCount.innerText = `Showing ${__db.numLeft} words.`;

        // Output format is a dictionary, split per Date

        // First load the data in a formatted dictionary
        var prof = {
            "0": "Practice",
            "1": "Practice",
            "2": "Practice",
            "3": "Practice",
            "4": "learn",
            "5": "learn",
            "6": "new"
        };

        var outData = {};
        while (__db.numLeft > 0) {
            var item = __db.pickOne(true, 0);
            var proficiency = prof[item.Proficiency.slice(0,1)]
            var fileName = `jp_${item.Date}_${proficiency}`

            if (!outData.hasOwnProperty(fileName)) {
                outData[fileName] = [];
            }

            outData[fileName].push([item.English, item.Kana]);
        }

        // Output everything
        var text = '{\n';
        var files =  Array.from(Object.keys(outData)).sort();
        for (var fileName of files) {
            var value = outData[fileName];
            text += `  "${fileName}": [\n`;
            for (const entry of value) {
                text += `    ("${entry[0]}", "${entry[1]}"),\n`;
            }
            text += '  ],\n';
        }
        text +=
'}\n';

        var pre = document.createElement("pre");
        pre.innerText = text;
        wordTableRoot.innerText = '';
        wordTableRoot.appendChild(pre);
    }

    /*!
       callback for all UI elements
     */
    function applyFilter() {
        var filter = {}

        for (let f of filters) {
            elemDOM = document.getElementById(f);
            values = elemDOM._myClass.value;
            filter[f] = values;
        }

        __db.filterBy(filter);
        sortChanged();
        var isPython = document.getElementById('pythonOutput');
        if (isPython.checked) {
            pythonOutput();
        } else {
            createPrintSheet();
        }
    }

    /*!
        Called when the sort radio button changed
    */
    function sortChanged() {
        for (let field of __fields) {
            var input = document.getElementById(`${field}Input`);
            if (input.checked) {
                if (field == 'Random') {
                    __db.randomize(field);
                } else {
                    __db.sortBy(field);
                }
            }
        }
    }

    /*!
        Called when the font size check box changes
    */
    function setFontSize() {

        var largeDOM = document.getElementById('largeFont');
        if (largeDOM.checked) {
            document.documentElement.style.setProperty(
                "--sheet-fontsize", "18px");
            document.documentElement.style.setProperty(
                "--sheet-large-fontsize", "28px");
        } else {
            document.documentElement.style.setProperty(
                "--sheet-fontsize", "12px");
            document.documentElement.style.setProperty(
                "--sheet-large-fontsize", "18px");
        }
    }

    /*!
        Main entry point for the page.
    */
    function start() {
        // Start the app with only the 'practice' vocabulary
        var defaultFilter = {'Proficiency': new Set(['5-new'])}

        // All filters
        for (let f of filters) {
            let choiceDOM = document.getElementById(f);
            let values = Array.from(__db.labels[f]).sort();
            let choiceData = values.map(x => ({'UIname': x}));
            MultipleChoice.init(choiceDOM, f, choiceData);
            choiceDOM.addEventListener('change', applyFilter);

            // Set the UI to match the default filter
            if (f in defaultFilter) {
                choiceDOM._myClass.select(defaultFilter[f]);
            }
        }

        var sortDOM = document.getElementById('sortBy');
        for (let field of __fields) {
            var div = document.createElement("div");
            var isChecked = '';
            if (field == 'Kana') {isChecked = ' checked';}
            var labelText = field;
            if (field in __fieldLabels) {labelText = __fieldLabels[field];}
            let content = `
            <input type="radio" id="${field}Input" name="sortBy" value="${field}"${isChecked} />
		        <label for="${field}">${labelText}</label>`
            div.innerHTML = content;
            sortDOM.appendChild(div);

            var input = document.getElementById(`${field}Input`);
            input.addEventListener("input", applyFilter);
        }

        var largeDOM = document.getElementById('largeFont');
        largeDOM.addEventListener("input", setFontSize);

        var largeDOM = document.getElementById('pythonOutput');
        largeDOM.addEventListener("input", applyFilter);

        applyFilter();
    }

    /*!
        Main entry point for the page.
    */
    function main() {
        CollapsibleDiv.makeAllCollapsible();
        __db = new NihongoDB(start);
    }

    document.addEventListener('DOMContentLoaded', main);
})();

