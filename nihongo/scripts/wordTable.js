// -*- coding: utf-8 -*-

// ============================================================================
/*!
   Formats a wordlist into a table suitable for printing
*/
class WordTable { // eslint-disable-line no-unused-vars
    static verbURL = 'https://www.japaneseverbconjugator.com/VerbDetails.asp?txtVerb=${ref}&Go=Conjugate';
    static dictURL = 'https://jisho.org/search/${ref}';
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

        // Create the single table
        this._table = document.createElement("table");
        this._table.style.width = '100%';
        this._rows = [];
        for (let i = 0; i < this._linePerCol; i++) {
            let tr = document.createElement("tr");
            this._table.appendChild(tr);
            this._rows.push(tr);
        }
    }

    // ------------------------------------------------------------------------
    /*!
       Add all the table content to the given DOM root
    */
    addTable(root) {
        var container = document.createElement("div");
        container.classList.add('wordList');
        container.appendChild(this._table);

        // Finally add everything to the DOM
        root.appendChild(container);
    }

    // ------------------------------------------------------------------------
    /*!
       Add a new item in the current Column, move the to the next
       column when it is full.
    */
    addLine(item) {
        var kanji = item['Kanji'];
        var kana = item['Kana'];
        var ref = kanji.split('・')[0];
        var link = WordTable.dictURL.replace('${ref}', ref);

        if (kanji == kana) {
            kanji = '&#12288;'; // ideographic space, invisible in print
        } else {
            kanji = `<a target="_new" href="${link}">${kanji}</a>`;
        }
        kana = `<a target="_new" href="${link}">${kana}</a>`;

        if (item['Category'] in WordTable.prefixes) {
            var prefix = WordTable.prefixes[item['Category']];
            // In the Web page, display a link to the verb conjugation page.
            // mark it as no-print.
            link = encodeURI(prefix.url.replace('${ref}', ref));
            var icon = prefix.icon;

            kanji = kanji + ` <a class="noprint" target="_new" href="${link}">${icon}</a>`;
        }

        // Apply alternating background depending on the column and row index
        let isEvenCol = (this._colIndx % 2 === 0);
        let isEvenRow = (this._rowIndx % 2 === 0);
        let needsBg = isEvenCol ? isEvenRow : !isEvenRow;
        let bgClass = needsBg ? ' bg-gray' : '';

        var html = `
		  <td class="Kanji${bgClass}">${kanji}</td>
		  <td class="English${bgClass}">${item['English']}</td>
		  <td class="Kana${bgClass}">${kana}</td>
		  <td class="Romaji${bgClass}">${item['Romaji']}</td>`;

        this._rows[this._rowIndx].insertAdjacentHTML('beforeend', html);

        this._rowIndx++;
        if (this._rowIndx >= this._linePerCol) {
            this._rowIndx = 0;
            this._colIndx++;
        }
    }
}
