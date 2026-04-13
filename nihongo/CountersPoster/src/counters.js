/* global counterCard, counterDB, counterData */
let db;

function setPageSize(dir) {
    // Indexed by counterCard.LAYOUT
    const PAGE_SIZES = [
        {width: "28.7cm", height: "41cm"},
        {width: "41cm", height: "28.7cm"},
        {width: "28.7cm", height: "20cm"}
    ];

    var size = PAGE_SIZES[dir];

    const body = document.getElementById('body');
    body.style.width = size.width;
    body.style.height = size.height;
}

function buildTable(root, mode, dir) {
    root.innerHTML = '';
    var cards = new counterCard(mode, dir);

    // Indexed by counterCard.LAYOUT
    var TOPICS = [
        [ // VERT
            ["thing", "small", "people", "age"],
            ["floor", "frequency", "order", "animal"],
            ["flat", "long", "book", "drink"],
            ["vehicle", "house", "sock", "clothe"]
        ], [ // HORIZ
            ["thing", "small", "people", "age", "order"],
            ["floor", "frequency", "animal", "flat", "long"],
            ["book", "drink", "house", "sock", "clothe"]
        ], [ // 2xA4
            ["thing", "small", "people", "age"],
            ["floor", "frequency", "order", "animal"],
            [], // generate a page break
            ["flat", "long", "book", "drink"],
            ["vehicle", "house", "sock", "clothe"]
        ] ];
    var topics = TOPICS[dir];

    setPageSize(dir);
    var content = cards.makeCards(db, topics, dir);
    root.appendChild(content);
}

function handleChange() {
    const modeSelect = document.getElementById('modeSelect');
    const selectedModeStr = modeSelect.value;
    localStorage.setItem('CountersMode', selectedModeStr);

    const dirSelect = document.getElementById('dirSelect');
    const selectedDirStr = dirSelect.value;
    localStorage.setItem('CountersDir', selectedDirStr);

    // Update the Design explanation
    var text = {
        VERT: "one portrait A3 page",
        HORIZ: "one landscape A3 page",
        HORIZ_2PAGES: "two landscape A4 pages",
    }
    var design = document.getElementById("layoutId");
    design.innerText = text[selectedDirStr];

    var main = document.getElementById("mainId");
    buildTable(main, counterCard.MODES[selectedModeStr], counterCard.LAYOUT[selectedDirStr]);
}

function bootStrap() {
    db = new counterDB(counterData);

    // Initialize UI from local storage
    let savedModeStr = localStorage.getItem('CountersMode') || "KANA";
    if (!Object.prototype.hasOwnProperty.call(counterCard.MODES, savedModeStr)) {
        savedModeStr = "KANA";
    }
    const modeSelect = document.getElementById('modeSelect');
    modeSelect.value = savedModeStr;
    modeSelect.addEventListener('change', handleChange);

    let savedDirStr = localStorage.getItem('CountersDir') || "VERT";
    if (!Object.prototype.hasOwnProperty.call(counterCard.LAYOUT, savedDirStr)) {
        savedDirStr = "VERT";
    }
    const dirSelect = document.getElementById('dirSelect');
    dirSelect.value = savedDirStr;
    dirSelect.addEventListener('change', handleChange);

    handleChange();
}

window.addEventListener('DOMContentLoaded', bootStrap);
