// -*- coding: utf-8 -*-

// ============================================================================
/*!
   Formats a wordlist into a table suitable for printing
*/
class WordTable {

    // ------------------------------------------------------------------------
    constructor(wordLen, nbCol=2) {
        this._wordLen = wordLen;
        this._nbCol = nbCol;

        this.initTable();
    }

    // ------------------------------------------------------------------------
    initTable() {

        // Compute how many lines to place in each column
        this._linePerCol = Math.ceil(this._wordLen/this._nbCol);
        this._colIndx = 0;
        this._rowIndx = 0;
        let width = Math.floor(100/this._nbCol);

        // Create all columns
        this._columns = [];
        for (let i=0 ; i<this._nbCol ; i++) {

            var col = document.createElement("table");
            col.classList.add(i%2 ? 'odd' : 'even');
            col.style.borderWidth = `${width}px`;
            this._columns.push(col);
        }
    }

    // ------------------------------------------------------------------------
    /*!
       Add all the table content to the given DOM root
    */
    addTable(root) {
        var table = document.createElement("div");
        table.classList.add('wordList');
        for (const col of this._columns) {
            table.appendChild(col);
        }

        // Finally add everything to the DOM
        root.appendChild(table);
    }

    // ------------------------------------------------------------------------
    /*!
       Add a new item in the current Column, move the to the next
       column when it is full.
    */
    addLine(item) {

        var newLine = document.createElement("tr");
        var kanji = item['Kanji'];
        var kanjiElem = '';

        if (kanji == item['Kana']) {
            kanji = '&nbsp;';
            kanjiElem = kanji;
        } else {
            var link = `https://jisho.org/search/${kanji}`;
            kanjiElem = `<a target="_new" href="${link}">${kanji}</a>`;
        }

        newLine.innerHTML = `
		  <td class="Kanji">${kanjiElem}</td>
		  <td class="English">${item['English']}</td>
		  <td class="Kana">${item['Kana']}</td>
		  <td class="Romaji">${item['Romaji']}</td>
`;

        this._columns[this._colIndx].appendChild(newLine);
        this._rowIndx ++;
        if (this._rowIndx >= this._linePerCol) {
            this._rowIndx = 0;
            this._colIndx ++;
        }
    }
}
