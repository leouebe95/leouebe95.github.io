let db;

function buildTable(root, mode) {
    root.innerHTML = '';
    var cards = new counterCard(mode);

    var topicsV = [
        ["thing", "small", "people", "age"],
        ["floor", "order", "frequency", "animal"],
        ["flat", "long", "book", "drink"],
        ["vehicle", "house", "sock", "clothe"]
    ];

    var topicsH = [
        ["thing", "small", "people", "age", "floor", "order", "frequency", "animal"],
        ["flat", "long", "book", "drink", "vehicle", "house", "sock", "clothe"]
    ];

    var content = cards.makeCards(db, topicsV);
    root.appendChild(content);
}

function handleModeChange(event) {
    const selectedModeStr = event.target.value;
    localStorage.setItem('CountersMode', selectedModeStr);

    var main = document.getElementById("mainId");
    buildTable(main, counterCard.MODES[selectedModeStr]);
}

function bootStrap() {
    db = new counterDB(counterData);

    // Initialize UI from local storage
    let savedModeStr = localStorage.getItem('CountersMode') || "KANA";
    if (!counterCard.MODES.hasOwnProperty(savedModeStr)) {
        savedModeStr = "KANA";
    }

    const modeSelect = document.getElementById('modeSelect');
    modeSelect.value = savedModeStr;
    modeSelect.addEventListener('change', handleModeChange);

    var main = document.getElementById("mainId");
    buildTable(main, counterCard.MODES[savedModeStr]);
}

window.addEventListener('DOMContentLoaded', bootStrap);
