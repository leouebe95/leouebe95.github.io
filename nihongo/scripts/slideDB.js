// -*- coding: utf-8 -*-

/* ============================================================================
   Database holding the slides data
*/
class SlideDB extends DBManager { // eslint-disable-line no-unused-vars

    /* ------------------------------------------------------------------------
       Constructor.
       cb is the callback called when the database is ready.
       Argument is the loaded database object (this)
    */
    constructor(cb, refreshCb) {
        var sheetId = '1CXgb4O6LnszuytBKeS3uOPFcygkybrm4CJhvq5VWhBI';
        var tabID = '101391935'; // Slides
        super(sheetId, tabID, 'slide_db_cache', cb, refreshCb);
    }

    /* ------------------------------------------------------------------------
       Extract the DB from the payload and store it in the current object
    */
    storeDB(csvData) {
        var rows = DBManager.parseCSV(csvData);

        if (rows.length < 2) return;

        var db = {};
        // Read each row (skip the title row.)
        for (let i = 1; i < rows.length; i++) {
            let row = rows[i];

            // Skip empty rows
            if ((row.length < 2) || (row[0].trim() === '')) continue;

            let slideName = row[0].trim();

            if (!db[slideName]) {
                db[slideName] = [];
            }
            // All elements of row[1:], with trim applied
            let elem = row.slice(1).map(val => val.trim());
            db[slideName].push(elem);
        }

        this.setDB(db);
        var dbSize = Object.keys(this._data).length;
        console.log(`Slide Database finished loading (${dbSize} slides)`);
    }

    // ------------------------------------------------------------------------
    /*
       Get data for a specific slide
    */
    getSlideData(slideName) {
        if (this._data && this._data[slideName]) {
            return this._data[slideName];
        }
        return [];
    }

    // ------------------------------------------------------------------------
    /*
       Get all available slide names
    */
    getSlideNames() {
        if (this._data) {
            return Object.keys(this._data);
        }
        return [];
    }
}
