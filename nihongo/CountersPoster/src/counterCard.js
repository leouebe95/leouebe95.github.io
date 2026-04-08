
/*
  Render counter as cards
*/
class counterCard {

    static MODES = {
        ROMA: 0,
        KANA: 1,
        BOTH: 2,
    };

    static RENDAKU = {
        "が": "か", "ga": "ka",
        "げ": "け", "ge": "ke",
        "ぞ": "そ", "zo": "so",
        "び": "ひ", "ba": "ha",
        "ぴ": "ひ", "pa": "ha",
        "ば": "は", "bi": "hi",
        "ぱ": "は", "pi": "hi",
        "ぼ": "ほ", "bo": "ho",
        "ぽ": "ほ", "po": "ho"
    };

    static NUMBERS_KANA = [
        {kana: 'ゼロ',   roma: 'zero'}, // Used only to shift indices
        {kana: 'いち',   roma: 'ichi'},  // 1
        {kana: 'に',     roma: 'ni'},    // 2
        {kana: 'さん',   roma: 'san'},   // 3
        {kana: 'よん',   roma: 'yon'},   // 4
        {kana: 'ご',     roma: 'go'},    // 5
        {kana: 'ろく',   roma: 'roku'},  // 6
        {kana: 'なな',   roma: 'nana'},  // 7
        {kana: 'はち',   roma: 'hachi'}, // 8
        {kana: 'きゅう', roma: 'kyū'},   // 9
        {kana: 'じゅう', roma: 'jū'},    // 10
    ];

    /*! Constructor
     */
    constructor(mode, question) {
        if (!(mode in Object.values(counterCard.MODES))) {
            mode = counterCard.MODES.BOTH;
        }
        this._question = question; // True is we want a line for the question
        this._mode = mode;
    }

    // Add coloring to the suffix part of the text for both kana and roma
    colorSingle(text, suffix) {
        var pattern = {};
        pattern[suffix] = `<span class="suff">${suffix}</span>`;

        for (var r in counterCard.RENDAKU) {
            if (suffix.startsWith(counterCard.RENDAKU[r])) {
                var suff2 = suffix.replace(counterCard.RENDAKU[r], r);
                pattern[suff2] = `<span class="suff2">${suff2}</span>`;
            }
        }

        for (var prop in pattern) {
            if (text.endsWith(prop)) {
                return text.replace(new RegExp(prop + "$"), pattern[prop]);
            }
        }
        return text;
    }

    // Add coloring to the suffix part of the text for both kana and roma
    colorize(text, suffix, num) {
        var k = this.colorSingle(text["kana"], suffix["kana"]);
        var r = this.colorSingle(text["roma"], suffix["roma"]);

        return {
            "kana": k,
            "roma": r
        }
    }

    // return trure if the number is an exception
    isExeption(text, num) {
        var prefix = counterCard.NUMBERS_KANA[num]

        if (text["kana"].startsWith(prefix["kana"])) {
            return false;
        }
        return true;
    }

    tableLine2(text, suffix = "", size = "") {
        var k = text["kana"] + suffix;
        var r = text["roma"] + suffix;

        switch (this._mode) {
            case counterCard.MODES.KANA:
                return `<tr><td class="kana ${size}" colspan="7">${k}</td></tr>`;
            case counterCard.MODES.ROMA:
                return `<tr><td class="roma ${size}" colspan="7">${r}</td></tr>`;
            default:
                return `<tr><td></td><td class="kana ${size}" colspan="2">${k}</td>` +
                    '<td></td>' +
                    `<td class="roma ${size}" colspan="2">${r}</td><td></td></tr>`;
        }
    }

    tableLine4(cardData, num1, num2) {
        var items = [];
        var classes = [];
        var text1 = cardData[num1.toString()];
        var text2 = cardData[num2.toString()];
        var suff = cardData["suffix"];

        var except1 = "";
        var except2 = "";

        if (this.isExeption(text1, num1)) { except1 = " except"; }
        if (this.isExeption(text2, num2)) { except2 = " except"; }

        text1 = this.colorize(text1, suff, num1);
        text2 = this.colorize(text2, suff, num2);

        switch (this._mode) {
            case counterCard.MODES.KANA:
                classes = ["num", "kana"+except1, "num", "kana"+except2];
                items = [num1, text1["kana"], num2, text2["kana"]];
                break;
            case counterCard.MODES.ROMA:
                classes = ["num", "kana"+except1, "num", "kana"+except2];
                items = [num1, text1["roma"], num2, text2["roma"]];
                break
            default:
                classes = ["kana"+except1, "kana"+except2, "roma"+except1, "roma"+except2];
                items = [text1["kana"], text2["kana"], text1["roma"], text2["roma"]];
                break;
        }

        classes = ["stretch"].concat(classes.slice(0, 2), ["stretch"], classes.slice(-2), ["stretch"]);
        items = [""].concat(items.slice(0, 2), [""], items.slice(-2), [""]);
        var res = '<tr>';
        for (let i = 0; i < 7; i++) {
            res += `<td class="${classes[i]}">${items[i]}</td>`;
        }
        res += '</tr>';

        return res;
    }

    makeCard(cardData) {
        var val = `<div class="cardTitle">${cardData["title"]}</div>`;

        val += `<img class="card" src="./img/${cardData["image"]}" />`;

        val += '<table>';
        val += this.tableLine2(cardData["counter"], "", "large");

        for (let i = 1; i < 6; i++) {
            val += this.tableLine4(cardData, i, i + 5);
        }

        if (this._question) {
            val += this.tableLine2(cardData["?"], " ？");
        }
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
        for (let i = 0; i < topics.length; i++) {
            var line = topics[i];
            var row = document.createElement("tr");
            for (let j = 0; j < line.length; j++) {
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
