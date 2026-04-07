
/*
  Render counter as cards
*/
class counterCard {

    static MODES = {
        ROMA: 0,
        KANA: 1,
        BOTH: 2,
    };

    /*! Constructor
     */
    constructor(mode) {
        if (!(mode in Object.values(counterCard.MODES))) {
            mode = counterCard.MODES.BOTH;
        }

        this._mode = mode;
    }

    tableLine2(text, suffix="") {
        var k = text["kana"]+suffix;
        var r = text["roma"]+suffix;

        switch (this._mode) {
        case counterCard.MODES.KANA:
            return `<tr><td class="kana large" colspan="4">${k}</td></tr>`;
        case counterCard.MODES.ROMA:
            return `<tr><td class="roma large" colspan="4">${r}</td></tr>`;
        default:
            return `<tr><td class="kana large" colspan="2">${k}</td>`+
                `<td class="roma large" colspan="2">${r}</td></tr>`;
        }
    }

    tableLine4(cardData, num1, num2) {
        var items = [];
        var classes = [];
        var text1 = cardData[num1.toString()];
        var text2 = cardData[num2.toString()];

        switch (this._mode) {
        case counterCard.MODES.KANA:
            classes = ["num", "kana", "num", "kana"];
            items = [num1, text1["kana"], num2, text2["kana"]];
            break;
        case counterCard.MODES.ROMA:
            classes = ["num", "roma", "num", "roma"];
            items = [num1, text1["roma"], num2, text2["roma"]];
            break
        default:
            classes = ["kana", "kana", "roma", "roma"];
            items = [text1["kana"], text2["kana"],
                     text1["roma"], text2["roma"]];
            break;
        }

        var res = '<tr>';
        for (let i = 0 ; i < 4 ; i++ ) {
            res += `<td class="${classes[i]}">${items[i]}</td>`;
        }
        res += '</tr>';

        return res;
    }

    makeCard(cardData) {
        var val = `<div class="cardTitle">${cardData["title"]}</div>`;

        val += `<img class="card" src="./img/${cardData["image"]}" />`;

        val += '<table>';
        val += this.tableLine2(cardData["counter"]);

        for (let i = 1 ; i < 6 ; i++ ) {
            val += this.tableLine4(cardData, i, i+5);
        }

        val += this.tableLine2(cardData["?"], " ？");
        val += '</table>';

        var res = document.createElement("div");
        res.classList.add("card");

        // Need to compress a bit more in 'Both' mode
        if (this._mode == counterCard.MODES.BOTH) {
            res.classList.add("compact");
        }
        res.innerHTML = val;
        return res;
    }

    makeCards(db, topics) {
        var table = document.createElement("table");
        for (let i = 0 ; i < topics.length ; i++ ) {
            var line = topics[i];
            var row = document.createElement("tr");
            for (let j = 0 ; j < line.length ; j++ ) {
                var cell = document.createElement("td");
                var item = line[j];
                cell.appendChild(this.makeCard(db._data[item]));
                row.appendChild(cell);
            }
            table.appendChild(row);
        }
        return table;
    }
}
