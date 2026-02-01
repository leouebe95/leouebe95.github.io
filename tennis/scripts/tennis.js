
// Tell eslint about classes defined elsewhere
/* global tennisCanvas */

function bootStrap() {
    var canvas = document.getElementById('drawArea');
    var court = new tennisCanvas(canvas);
}

window.addEventListener('DOMContentLoaded', bootStrap);
