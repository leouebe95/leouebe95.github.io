(function() {
    "use strict";
    function setData(inputString) {
        // Normalize the Japanese characters used for syntax
        var remap = {
            '（': '(',
            '〔': '(',
            '【': '(',

            '）': ')',
            '〕': ')',
            '】': ')'
        };
        for(var key in remap) {
            inputString = inputString.replace(new RegExp(key, 'g'), remap[key]);
        }

        var lines = inputString.trim().split('\n');

        var top = document.getElementById("result");

        // Empty everything first
        top.innerHTML = '';

        var area = document.createElement("div"); // Create a <div> per area
        area.classList.add("flushright");
        top.appendChild(area);

        for (var i=0 ; i<lines.length ; i++) {
            var line = lines[i].trim();
            if (line === '') {
                // Create a new section
                var sep = document.createElement("hr");
                top.appendChild(sep);
                area = document.createElement("div");
                area.classList.add("flushright");
                top.appendChild(area);
            } else {
                if (area.hasChildNodes()) {
                    var space = document.createElement("div");
                    space.classList.add("blank");
                    area.insertBefore(space, area.firstChild);
                }

                // Real practice line. X(xxx) is a kanji followed by
                // phonetics
                line = line.replace(/(.)\(([^()]+)\)/g,
                                    '<ruby><rb>$1</rb><rt>$2</rt></ruby>')

                var elem = document.createElement("span");
                elem.classList.add("practice");
                elem.innerHTML = line;
                area.insertBefore(elem, area.firstChild);
            }
        }
    }

    function refreshPage() {
        var data = document.getElementById("data");
        setData(data.value);
    }

    function refreshStyle() {
        var mode = document.getElementById("mode");
        var data = document.getElementById("result");
        data.className = mode.value;
    }

    function setup() {
        var data = document.getElementById("data");
        data.addEventListener("change", refreshPage);

        data = document.getElementById("mode");
        data.addEventListener("change", refreshStyle);
        refreshPage();
        refreshStyle();
    }

    document.addEventListener('DOMContentLoaded', setup);
})();
