// -*- coding: utf-8 -*-


// Tell eslint about classes defined elsewhere
/* global Romaji */

/* ============================================================================
   Database holding the vocabulary list
*/
class NihongoDB extends DBManager { // eslint-disable-line no-unused-vars
    static filters = ['Source', 'Proficiency', 'Category', 'Date', 'isKana'];

    static defaultEntry = {
        "Kanji": "Empty",
        "Kana": "Empty",
        "Romaji": "Empty",
        "English": "No element match this filter",
    };

    /* ------------------------------------------------------------------------
       Constructor.
       cb is the callback called when the database is ready.
       Argument is the loaded database object (this)
    */
    constructor(cb, refreshCb) {
        super('1CXgb4O6LnszuytBKeS3uOPFcygkybrm4CJhvq5VWhBI', 'Vocabulary', 'nihongo_db_cache', cb, refreshCb);
    }

    /* ------------------------------------------------------------------------
       Fix and store the database
    */
    setDB(db) {
        this._data = NihongoDB.fixDB(db);
        this._filteredData = [];
        this.initLabels();
    }

    /* ------------------------------------------------------------------------
       Extract the DB from the payload and store it in the current object
    */
    storeDB(csvData) {
        var rows = DBManager.parseCSV(csvData);

        if (rows.length < 2) return;

        var colNames = rows[0];

        var db = [];
        // Read each row
        for (let i = 1; i < rows.length; i++) {
            let row = rows[i];

            // Skip empty rows
            if (row.length === 1 && row[0].trim() === '') continue;

            let elem = {};
            for (let j = 0; j < colNames.length; j++) {
                let value = j < row.length ? row[j] : '';
                elem[colNames[j]] = value;
            }

            // There is a special row with '!' and a fake date to work
            // around a google sheet API bug.
            if (elem["Romaji"] != '!') {
                db.push(elem);
            }
        }

        this.setDB(db);
        var dbSize = this._data.length;
        console.log(`Database finished loading (${dbSize} entries)`);
    }

    // ------------------------------------------------------------------------
    /*
       Fix some inconsistencies in the Database
    */
    static fixDB(data) {
        for (let entry of data) {
            if (entry['Date'] == '') { entry['Date'] = 'None' }

            if ((entry['Kanji'] == '') || (entry['Kanji'] == entry['Kana'])) {
                entry['Kanji'] = entry['Kana'];
                entry['isKana'] = true;
            } else {
                entry['isKana'] = false;
            }

            // If the Romaji field is missing, try to rebuild from Kana
            if (entry['Romaji'] == '') {
                entry['Romaji'] = Romaji.toRomaji(entry['Kana']);
            }
        }
        return data;
    }

    // ------------------------------------------------------------------------
    /*
       Compute all possible filter values
    */
    initLabels() {
        this._labels = {};
        for (let f of NihongoDB.filters) {
            this._labels[f] = new Set();
        }

        for (let entry of this._data) {
            for (let f of NihongoDB.filters) {
                this._labels[f].add(entry[f]);
            }
        }
    }

    // ------------------------------------------------------------------------
    /*
       Select all data elements matching the filter
       filter is a dictionary key: Set

       If ensureOneElem is true, then at least one element is always
       there (A default value in this case)
    */
    filterBy(filter, ensureOneElem = false) {
        this._filteredData = [];
        const filters = NihongoDB.filters;

        // isKana is passed as a string in the filter but is stored as
        // boolean in the DB. Fix the filter
        if (filter['isKana'] && filter['isKana'].size) {
            let isKana = new Set();
            for (const value of filter['isKana']) {
                if (value == 'false') { isKana.add(false); }
                else if (value == 'true') { isKana.add(true); }
                else { isKana.add(value); }
            }
            filter['isKana'] = isKana;
        }

        for (let entry of this._data) {

            // If the entry is empty
            if (!entry["English"]) continue;

            // filter by each items if dictionary is not empty
            let keep = true;
            for (let f of filters) {
                if (filter[f] && filter[f].size && (!filter[f].has(entry[f]))) {
                    keep = false;
                    continue;
                }
            }
            if (keep) {
                this._filteredData.push(entry);
            }
        }

        // If the result is empty add one elem
        if (ensureOneElem && this._filteredData.length == 0) {
            this._filteredData.push(NihongoDB.defaultEntry);

        }
    }

    // ------------------------------------------------------------------------
    // Number of items left to practice
    get numLeft() { return this._filteredData.length; }

    // ------------------------------------------------------------------------
    // Labels which can be used for filtering
    get labels() { return this._labels; }


    // ------------------------------------------------------------------------
    /*
       Sort the database by the given key.

       Useful before calling pickOne(true, 0)
    */
    sortBy(key) {
        this._filteredData.sort((a, b) => {
            return a[key].localeCompare(b[key]);
        })
    }

    // ------------------------------------------------------------------------
    /*
       Randomize the database.

       Useful before calling pickOne(true, 0)
    */
    randomize() {
        var shuffled = [];
        while (this.numLeft > 0) {
            shuffled.push(this.pickOne(true));
        }

        this._filteredData = shuffled;
    }

    // ------------------------------------------------------------------------
    /*
       Select a random element in the filtered array
       If remove is set to true, then the element is removed from the
       array

       if indx is set, return that index, else return a random element
    */
    pickOne(remove, indx = null) {
        const max = this._filteredData.length;
        if (max == 0) { return null; }

        if (indx == null) {
            indx = Math.floor(Math.random() * max);
        }

        var elem = this._filteredData[indx];

        if (remove) {
            this._filteredData.splice(indx, 1);
        }

        return elem;
    }
    // ------------------------------------------------------------------------
    /*
       Find a vocabulary entry by its English translation.
       Uses a lazy-initialized hash table for fast lookups.
    */
    findWordByEnglish(englishWord) {
        if (!this._englishIndex) {
            this._englishIndex = {};
            for (let entry of this._data) {
                if (entry['English']) {
                    this._englishIndex[entry['English']] = entry;
                }
            }
        }
        return this._englishIndex[englishWord];
    }
}
