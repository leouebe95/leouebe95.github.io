(function() {
    'use strict';

    /**
       Toggle the collapsible state when clicked on the title itself.
       @param {Event} event  The event which triggered the action.
    */
    function toggle(event) {
        var root = event.target.parentNode;
        root.classList.toggle('collapsed');
    }

    /**
       Toggle the collapsible state when clicked on the imahe of the
       title.

       @param {Event} event The event which triggered the action.
    */
    function toggle2(event) {
        var root = event.target.parentNode.parentNode;
        root.classList.toggle('collapsed');
    }

    /**
       Create a collapsible section for the givent element. The title
       of the section is taken from the title attribute of the
       div. The collapsed/expanded icon is set by the CSS file.

       @param {DOMElement} elem Web component like element where to
       create the collapsible section.

       @example
	   <div class="collapsible" title="Help">
    */
    function createCollapsible(elem) {
        var title = document.createElement('h1');
        var titleContent = elem.getAttribute('title');

        var img = document.createElement('img');
        title.appendChild(img);

        var t = document.createTextNode(titleContent);
        title.appendChild(t);
        var content = document.createElement('div');
        while (elem.firstChild) {content.appendChild(elem.firstChild);}

        elem.appendChild(title);
        elem.appendChild(content);

        title.addEventListener('click', toggle);
        img.addEventListener('click', toggle2);
    }

    /**
       Expand all the collapsible divs in the page to create proper
       collapsible sections.
    */
    function setupCollapsible() {
        var elements = document.getElementsByClassName('collapsible');
        for (var i=0; i<elements.length; i++) {
            createCollapsible(elements[i]);
        }
    }

    document.addEventListener('DOMContentLoaded', setupCollapsible);
})();
