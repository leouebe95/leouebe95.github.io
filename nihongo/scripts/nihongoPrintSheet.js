// -*- coding: utf-8 -*-
/**
   @fileOverview Main file for japanese vocabulary flashcards
*/

(function() {
    const filters = ['Source', 'Proficiency', 'Category', 'Date', 'isKana'];
    const __fields = ['Kanji', 'Kana', 'Romaji', 'English'];
    const __fieldLabels = {'Kanji': '漢字', 'Kana': 'ひらがな / カタカナ',
                          'Romaji': 'Romaji', 'English': 'English'};

    var __db = null;

    /**
     */
    function setMessage(msg) {
        document.getElementById('messageBox').innerText = msg;
    }

    /**
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

    /**
       Bind the callbacks to all UI elements
     */
    function applyFilter(event) {
        var filter = {}

        for (let f of filters) {
            elemDOM = document.getElementById(f);
            values = elemDOM._myClass.value;
            filter[f] = values;
        }

        __db.filterBy(filter);
        __db.sortBy('Kana');
        if (event) { // If directly called from the UI
            createPrintSheet();
        }
    }

    /**
        Called when the sort radio button changed
    */
    function sortChanged() {
        applyFilter(); // Reset the filtered data
        for (let field of __fields) {
            var input = document.getElementById(`${field}Input`);
            if (input.checked) {
                __db.sortBy(field);
            }
        }

        createPrintSheet(); // recreate the sheet
    }

    /**
        Main entry point for the page.
    */
    function start() {
        // Start the app with only the 'practice' vocabulary
        var defaultFilter = {'Proficiency': new Set(['3-practice'])}

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
            let content = `
            <input type="radio" id="${field}Input" name="sortBy" value="${field}"${isChecked} />
		        <label for="${field}">${__fieldLabels[field]}</label>`
            div.innerHTML = content;
            sortDOM.appendChild(div);

            var input = document.getElementById(`${field}Input`);
            input.addEventListener("input", sortChanged);
        }

        sortChanged();
    }

    /**
        Main entry point for the page.
    */
    function main() {
        __db = new NihongoDB(start);
    }

    document.addEventListener('DOMContentLoaded', main);
})();

