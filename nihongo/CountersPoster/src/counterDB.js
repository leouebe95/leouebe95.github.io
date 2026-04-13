
/* exported counterDB */
/*
  Read the counters data and store it in a structured object
*/
class counterDB {

    /*! Constructor
     */
    constructor(data) {
        this._data = this.convert(data);
    }

    //
    convert(data) {
        var res = {}
        var categories = Array.from(Object.keys(data["1"])).
            filter((x) => !x.endsWith("2"));

        var common = ["image", "title"];
        var rows = ["counter",
                "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
                "?"];

        for (let i = 0 ; i < categories.length ; i++ ) {
            var cat = categories[i];
            var obj = {};

            for (let j = 0 ; j < common.length ; j++ ) {
                let key = common[j]
                obj[key] = data[key][cat]
            }

            for (let j = 0 ; j < rows.length ; j++ ) {
                let key = rows[j]
                obj[key] = {
                    "kana": data[key][cat],
                    "roma": data[key][cat+"2"]
                }
            }

            // compute one mode entry. Suffix.
            var counter = obj["counter"];
            var regExp = new RegExp("[\\(（](.+)[\\)）]");
            var matchesKana = regExp.exec(counter["kana"]);
            var matchesRoma = regExp.exec(counter["roma"]);
            obj["suffix"] = {
                "kana": matchesKana ? matchesKana[1] : counter["kana"],
                "roma": matchesRoma ? matchesRoma[1] : counter["roma"],
            };

            res[cat] = obj;
        }
        return res;
    }
};
