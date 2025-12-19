// -*- coding: utf-8 -*-
/**
   @fileOverview Main file for japanese vocabulary flashcards
*/

(function() {
    const filters = ['Source', 'Proficiency', 'Category', 'Date', 'isKana'];
    var db = null;

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

        var wordMgr = new WordTable(db.numLeft, 2);
        while (db.numLeft > 0) {
            var item = db.pickOne(true, 0);
            wordMgr.addLine(item);
        }

        wordTableRoot.innerText = '';
        wordMgr.addTable(wordTableRoot);
    }

    /**
       Bind the callbacks to all UI elements
     */
    function applyFilter() {
        var filter = {}

        for (let f of filters) {
            elemDOM = document.getElementById(f);
            values = elemDOM._myClass.value;
            filter[f] = values;
        }

        db.filterBy(filter);
        db.sortBy('Kana');
        createPrintSheet();
    }

    /**
        Main entry point for the page.
    */
    function main() {
        db = new NihongoDB(__data__);

        // Start the app with only the 'practice' vocabulary
        var defaultFilter = {'Proficiency': new Set(['3-practice'])}

        db.filterBy(defaultFilter);
        db.sortBy('Kana');

        // All filters
        for (let f of filters) {
            let choiceDOM = document.getElementById(f);
            let values = Array.from(db.labels[f]).sort();
            let choiceData = values.map(x => ({'UIname': x}));
            MultipleChoice.init(choiceDOM, f, choiceData);
            choiceDOM.addEventListener('change', applyFilter);

            // Set the UI to match the default filter
            if (f in defaultFilter) {
                choiceDOM._myClass.select(defaultFilter[f]);
            }
        }

        createPrintSheet();
    }

    document.addEventListener('DOMContentLoaded', main);
})();

