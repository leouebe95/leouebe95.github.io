let db;

function setPageSize(dir) {
    var width, height;
    switch (dir) {
    case "VERT":
        width  = "28.7cm";
        height = "41cm";
        break;
    default:
        height = "28.7cm";
        width  = "41cm";
        break;
    }

    const body = document.getElementById('body');
    body.style.width = width;
    body.style.height = height;
}

function buildTable(root, mode, dir) {
    root.innerHTML = '';
    var cards = new counterCard(mode);
    var topics, question;
    switch (dir) {
    case "VERT":
        topics = [
            ["thing", "small", "people", "age"],
            ["floor", "order", "frequency", "animal"],
            ["flat", "long", "book", "drink"],
            ["vehicle", "house", "sock", "clothe"]
        ];
        question = true;
        break;
    default:
        topics = [
            ["thing", "small", "people", "age", "floor", "order", "frequency", "animal"],
            ["flat", "long", "book", "drink", "vehicle", "house", "sock", "clothe"]
        ];
        topics = [
            ["thing", "small", "people", "age", "floor"],
            ["order", "frequency", "animal", "flat", "long"],
            ["book", "drink", "house", "sock", "clothe"]
        ];
        question = false;
        break;
    }

    setPageSize(dir);
    var content = cards.makeCards(db, topics, question);
    root.appendChild(content);
}

function handleChange(event) {
    const modeSelect = document.getElementById('modeSelect');
    const selectedModeStr = modeSelect.value;
    localStorage.setItem('CountersMode', selectedModeStr);

    const dirSelect = document.getElementById('dirSelect');
    const selectedDirStr = dirSelect.value;
    localStorage.setItem('CountersDir', selectedDirStr);

    var main = document.getElementById("mainId");
    buildTable(main, counterCard.MODES[selectedModeStr], selectedDirStr);
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
    modeSelect.addEventListener('change', handleChange);

    let savedDirStr = localStorage.getItem('CountersDir') || "VERT";
    const dirSelect = document.getElementById('dirSelect');
    dirSelect.value = savedDirStr;
    dirSelect.addEventListener('change', handleChange);

    var main = document.getElementById("mainId");
    buildTable(main, counterCard.MODES[savedModeStr], savedDirStr);
}

window.addEventListener('DOMContentLoaded', bootStrap);
