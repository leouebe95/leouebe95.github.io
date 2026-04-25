// -*- coding: utf-8 -*-

/* ============================================================================
   Database manager base class for fetching and parsing CSV data from Google Sheets
*/
class DBManager {

    /* ------------------------------------------------------------------------
       Constructor.
       cb is the callback called when the database is ready.
       Argument is the loaded database object (this)
    */
    constructor(sheetId, tabName, cacheKey, cb, refreshCb) {
        this.cacheKey = cacheKey;
        // We use the CSV export API because gviz/tq respects the user's basic 
        // filter on the spreadsheet, leading to missing rows. CSV export downloads the 
        // whole sheet bypassing the filter.
        var url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=${tabName}`;

        this.getDB(url, cb, refreshCb);
    }

    static parseCSV(text) {
        let ret = [];
        let curRow = [];
        let curVal = '';
        let inQuote = false;
        for (let i = 0; i < text.length; i++) {
            let c = text[i];
            if (inQuote) {
                if (c === '"') {
                    if (i + 1 < text.length && text[i + 1] === '"') {
                        curVal += '"';
                        i++;
                    } else {
                        inQuote = false;
                    }
                } else {
                    curVal += c;
                }
            } else {
                if (c === '"') {
                    inQuote = true;
                } else if (c === ',') {
                    curRow.push(curVal);
                    curVal = '';
                } else if (c === '\n') {
                    curRow.push(curVal);
                    ret.push(curRow);
                    curRow = [];
                    curVal = '';
                } else if (c === '\r') {
                    // ignore
                } else {
                    curVal += c;
                }
            }
        }
        if (curVal !== '' || curRow.length > 0) {
            curRow.push(curVal);
            ret.push(curRow);
        }
        return ret;
    }

    showCacheMessage(msg) {
        let div = document.getElementById('localCacheMsg');
        if (!div) {
            div = document.createElement('div');
            div.id = 'localCacheMsg';
            div.className = 'noprint message';
            document.body.appendChild(div);
        }
        div.innerText = msg;
        div.style.display = 'block';
    }

    hideCacheMessage() {
        let div = document.getElementById('localCacheMsg');
        if (div) {
            div.style.display = 'none';
        }
    }

    // ------------------------------------------------------------------------
    /*!
       Read the entire database from a spreadsheet
    */
    getDB(url, cb, refreshCb) {
        let cached = localStorage.getItem(this.cacheKey);

        // Clear old JSON cache format
        if (cached && (cached.includes('setResponse(') || cached.includes('google.visualization'))) {
            localStorage.removeItem(this.cacheKey);
            cached = null;
        }

        if (cached) {
            this.showCacheMessage("Using local cached data");
            this.storeDB(cached);
            setTimeout(() => { if (cb) cb(); }, 0);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        fetch(url, { signal: controller.signal })
            .then(response => response.text())
            .then(data => {
                clearTimeout(timeoutId);
                let isFirstLoad = !cached;
                if (!isFirstLoad) {
                    if (cached === data) {
                        this.hideCacheMessage();
                        return; // No change
                    }
                }
                localStorage.setItem(this.cacheKey, data);
                
                if (isFirstLoad) {
                    this.storeDB(data);
                    if (cb) cb();
                } else {
                    this.storeDB(data);
                    if (refreshCb) refreshCb();
                    this.hideCacheMessage();
                }
            })
            .catch(err => {
                clearTimeout(timeoutId);
                console.log(err);
                if (cached) {
                    this.showCacheMessage("no network access, using local cache");
                }
            });
    }

    // ------------------------------------------------------------------------
    /*
       Extract the DB from the payload and store it in the current object.
       Must be implemented by derived classes.
    */
    storeDB(csvData) {
        throw new Error("storeDB must be implemented by subclasses");
    }

    // ------------------------------------------------------------------------
    /*
       Set the internal database storage.
       Can be overridden by derived classes.
    */
    setDB(db) {
        this._data = db;
    }
}
