(function() {
    "use strict";

    function toggle(event) {
        var root = event.target.parentNode;
        root.classList.toggle("collapsed");
    }
    function toggle2(event) {
        var root = event.target.parentNode.parentNode;
        root.classList.toggle("collapsed");
    }

    function createCollapsible(elem) {
        var title = document.createElement("h1");
        var titleContent = elem.getAttribute("title");

        var img = document.createElement("img");
        title.appendChild(img);

        var t = document.createTextNode(titleContent);
        title.appendChild(t);
        var content = document.createElement("div");
        while (elem.firstChild) {content.appendChild(elem.firstChild);}

        elem.appendChild(title);
        elem.appendChild(content);

        title.addEventListener("click", toggle);
        img.addEventListener("click", toggle2);
    }

    function setupCollapsible(elem) {
        var elements = document.getElementsByClassName("collapsible");
        for(var i=0; i<elements.length; i++) {
            createCollapsible(elements[i]);
        }
    }

    document.addEventListener("DOMContentLoaded", setupCollapsible);
})();
