// -*- coding: utf-8 -*-

/**
  Input primitive to select mutiple choices out of a list
 */
class MultipleChoice {
    /**
       Constructor
       @param root DOM root of the control
     */
    constructor(root) {
        this._htmlRoot = root;
    }

    /**
       Change all toggles to true or false
       @param select when true selects everything, else deselect everything
     */
    changeAll(select) {
        let inputs = this._htmlRoot.querySelectorAll('input[type="checkbox"]');
        for (let input of inputs) {
            input.checked = select;
        }

        this._htmlRoot.dispatchEvent(new Event('change'));
    }

    /**
       Reset the list of UI input for the choices
       @param title the main title for the whole multipel choice input
       @param definition of the choices to expose in the UI. Array of
       dictionary:
       UIname (mandatory) the text that is displayed in the UI
       keyName (optional) the internal name. Used to build the data
       dictionnaly keys. If missing UIname is used
       checked (optional) true/false. When set and true, the bix is
       checked by default.
     */
    reset(title, choices) {
        let that = this;
        var iconAll = '<img src="img/check.png" title="Select All"/>';
        var iconNone = '<img src="img/uncheck.png" title="Select None"/>';
        var content = `<div class="title">${title}</div><hr/><button id="all">${iconAll}</button><button id="none">${iconNone}</button><hr/>`;

        // add select all / none
        for (let choice of choices) {
            var UIname  = choice["UIname"];
            var keyName = choice["keyName"] ? choice["keyName"] : UIname;
            var checked = choice["checked"] ? ' checked="true"' : '';
		    let input = `<div><input type="checkbox" name="${keyName}"${checked}/>${UIname}</div>`;
            content = content + input
        }

        this._htmlRoot.innerHTML = content;

        // Listen to the button press events
        let allButton = this._htmlRoot.querySelector('#all');
        allButton.addEventListener('click', () => { that.changeAll(true); });
        let noneButton = this._htmlRoot.querySelector('#none');
        noneButton.addEventListener('click', () => { that.changeAll(false); });

        // listen to change event and re-fire at the container level
        let inputs = this._htmlRoot.querySelectorAll('input[type="checkbox"]');
        for (let input of inputs) {
            input.addEventListener('change', () => {
                that._htmlRoot.dispatchEvent(new Event('change'));
            });
        }
    }

    /**
       return the multiple choice values in form of a Set of all the
       checked values
    */
    get value() {
        var res = new Set();
        var inputs = this._htmlRoot.querySelectorAll('input[type="checkbox"]');
        for (let input of inputs) {
            if (input.checked) {
                res.add(inputs[i].getAttribute('name'));
            }
        }
        return res;
    }

    /**
       Select all the valuse give in the set
       checked values
    */
    select(values) {
        var inputs = this._htmlRoot.querySelectorAll('input[type="checkbox"]');
        for (let input of inputs) {
            let name = input.getAttribute('name');
            if (values.has(name)) {
                input.checked = true;
            } else {
                input.checked = false;
            }
        }
    }

    /**
       Create the DOM under the card element and attach the JS object
       to it
       @param root the DOM root under which to create the control
     */
    static init(root, title, choices) {
        root._myClass = new MultipleChoice(root);
        root._myClass.reset(title, choices)
    }
}
