// -*- coding: utf-8 -*-

// ============================================================================
/**
   Database holding the vocabulary list
*/
class NihongoDB {
    static filters = ['Source', 'Proficiency', 'Category', 'Date', 'isKana'];

    static defaultEntry = {
        "Kanji": "Empty",
        "Kana": "Empty",
        "Romaji": "Empty",
        "English": "No element match this filter",
    };

    // ------------------------------------------------------------------------
    constructor(data) {
        var url = 'https://docs.google.com/spreadsheets/d/1CXgb4O6LnszuytBKeS3uOPFcygkybrm4CJhvq5VWhBI/gviz/tq?sheet=Vocabulary';
        NihongoDB.getDB(url);// FIXME
        this._data = NihongoDB.fixDB(data);
        this._filteredData = [];
        this.initLabels();
    }

    
    // ------------------------------------------------------------------------
    /**
       Read the entire vocabulary database from a spreadsheet
    */
    static getDB(url) {
        fetch(url)
            .then(response => console.log(response))
            .catch(err => console.log(err));
    }
    
    // ------------------------------------------------------------------------
    /**
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
    /**
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
    /**
       Select all data elements matching the filter
       filter is a dictionary key: Set

       If ensureOneElem is true, then at least one element is always
       there (A default value in this case)
    */
    filterBy(filter, ensureOneElem=false) {
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
    /**
       Sort the database by the given key.

       Useful before calling pickOne(true, 0)
    */
    sortBy(key) {
        this._filteredData.sort( (a, b) => {
            return a[key].localeCompare(b[key]);
        })
    }

    // ------------------------------------------------------------------------
    /**
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
}
