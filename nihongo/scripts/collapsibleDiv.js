// -*- coding: utf-8 -*-


/*!
  Setup div withe collapsible class as interactively collapsible
 */
class CollapsibleDiv {
    /*!
       Constructor
       @param root DOM root of the control
     */
    constructor(root) {
        this._htmlRoot = root;
        this.makeCollapsible(root);
        root._myClass = this;
    }

    /*!
       Toggle the collapsible state when clicked on the title itself.
       @param {Event} event The event which triggered the action.
    */
    static toggle(event) {
        var root = event.currentTarget.parentNode;
        root.classList.toggle('collapsed');
    }
    
    /*!
       Create a collapsible section for the givent element. The title
       of the section is taken from the title attribute of the
       div. The collapsed/expanded icon is set by the CSS file.

       @param {DOMElement} elem Web component like element where to
       create the collapsible section.

       @example
	   <div class="collapsible"><legend>Help</legend></div>
    */
    makeCollapsible(elem) {
        var content = document.createElement('div');
        content.classList.add('content');
        
        var title = document.createElement('div');
        title.classList.add('title');
        // Add the collapse / expand icon
        var img = document.createElement('img');
        img.classList.add('collapsible');
        title.appendChild(img);

        // Move all content except the legend to the content div
        var children = elem.children;
        while (children.length>0) {
            if (elem.firstChild.nodeName == "LEGEND") {
                title.appendChild(elem.firstChild);
            } else {
                // Move to the content section
                content.appendChild(elem.firstChild);
            }
        }
        // Add the title and content back
        elem.appendChild(title);
        elem.appendChild(content);

        title.addEventListener('click', CollapsibleDiv.toggle);
    }
    
    /*!
       Set up all the collapsible divs in the page to create proper
       collapsible sections.
    */
    static makeAllCollapsible() {
        var elements = document.getElementsByClassName('collapsible');
        for (var i=0; i<elements.length; i++) {
            if (elements[i].nodeName == "DIV") {
                new CollapsibleDiv(elements[i]);
            }
        }
    }
}
