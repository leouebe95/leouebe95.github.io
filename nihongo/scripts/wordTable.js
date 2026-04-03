// -*- coding: utf-8 -*-

// ============================================================================
/*!
   Formats a wordlist into a table suitable for printing
*/
class WordTable { // eslint-disable-line no-unused-vars
    static verbURL = 'https://www.japaneseverbconjugator.com/VerbDetails.asp?txtVerb=${shortRef}&Go=Conjugate';
    static prefixes =
        {
            'verb (1 dan)': { icon: '&#x2460;', url: WordTable.verbURL }, // ①
            'verb (5 dan)': { icon: '&#x2464;', url: WordTable.verbURL }, // ⑤
            'verb (irreg)': { icon: '&#x24CB;', url: WordTable.verbURL }, // Ⓥ
        };

    // ------------------------------------------------------------------------
    constructor(wordLen, nbCol = 2) {
        this._wordLen = wordLen;
        this._nbCol = nbCol;

        this.initTable();
    }

    // ------------------------------------------------------------------------
    initTable() {

        // Compute how many lines to place in each column
        this._linePerCol = Math.ceil(this._wordLen / this._nbCol);
        this._colIndx = 0;
        this._rowIndx = 0;
        let width = Math.floor(100 / this._nbCol);

        // Create all columns
        this._columns = [];
        for (let i = 0; i < this._nbCol; i++) {

            var col = document.createElement("table");
            col.classList.add(i % 2 ? 'odd' : 'even');
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
        var kana = item['Kana'];
        var ref = kanji;
        var link = null;

        if (kanji == kana) {
            kanji = '&nbsp;';
            ref = kana;
            link = `https://jisho.org/search/${kana}`;
        } else {
            link = `https://jisho.org/search/${kanji}`;
            kanji = `<a target="_new" href="${link}">${kanji}</a>`;
        }

        if (item['Category'] in WordTable.prefixes) {
            var prefix = WordTable.prefixes[item['Category']];
            // In the Web page, display a link to the verb conjugation page.
            // mark it as no-print.
            var shortRef = ref.split('・')[0]
            link = encodeURI(prefix.url.replace('${shortRef}', shortRef));
            var icon = prefix.icon;

            kanji = `<a class="noprint" target="_new" href="${link}">${icon}</a> ` + kanji;
        }

        newLine.innerHTML = `
		  <td class="Kanji">${kanji}</td>
		  <td class="English">${item['English']}</td>
		  <td class="Kana">${kana}</td>
		  <td class="Romaji">${item['Romaji']}</td>
`;

        this._columns[this._colIndx].appendChild(newLine);
        this._rowIndx++;
        if (this._rowIndx >= this._linePerCol) {
            this._rowIndx = 0;
            this._colIndx++;
        }
    }
}
