

function buildTable(root, db) {

    //var cards = new counterCard(counterCard.MODES.ROMA);
    var cards = new counterCard(counterCard.MODES.KANA);
    //var cards = new counterCard(counterCard.MODES.BOTH);

    topics = [
        ["thing", "small", "people", "age"],
        ["floor", "order", "frequency", "animal"],
        ["flat", "long", "book", "drink"],
        ["vehicle", "house", "sock", "clothe"]
    ];

    var content = cards.makeCards(db, topics);
    root.appendChild(content);
}


function bootStrap() {
    db = new counterDB(counterData);

    var main = document.getElementById("mainId");
    buildTable(main, db);
}

window.addEventListener('DOMContentLoaded', bootStrap);
