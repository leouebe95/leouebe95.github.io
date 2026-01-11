// -*- coding: utf-8 -*-

/*!
  Card that can be flipped
 */
class Card {
    /*!
       Constructor
       @param root DOM root of the control
       @param getDefaultVisibility Function callback returning true (is the card
       is visible) or false (if hidden) in defuald state
     */
    constructor(root, getDefaultVisibility) {
	    // Call reset to create and init all values
        this._getDefaultVisibility = getDefaultVisibility;
        this._htmlRoot = root;
	    this.reset();
    }

	//! Reset the values to default
	reset() {
        this._visible = false;
    }

    //! Get, set the visible status
    get visible() { return this._visible; }
    set visible(vis) {
        if (this._visible != vis) {
            this.flip();
        }
    }

    //! Flip the card
    flip() {
        this._visible = ! this._visible;
        var inner = this._htmlRoot.getElementsByClassName("inner")[0];
        if (this._visible) {
            inner.classList.add("flipped");
        } else {
            inner.classList.remove("flipped");
        }
    }

    setText(front, back) {
        var frontElem = this._htmlRoot.getElementsByClassName("front")[0];
        var backElem = this._htmlRoot.getElementsByClassName("back")[0];

        frontElem.innerText = front;
        backElem.innerText = back;

        this.visible = this._getDefaultVisibility();
    }

    /*!
       Create the DOM under the card element and attach the JS object
       to it
       @param root the DOM root under which to create the control
     */
    static init(root, getDefaultVisibility) {
        root.innerHTML = `
<div class="inner">
    <div class="front">FRONT</div>
    <div class="back">BACK</div>
</div>
`;
        root._myClass = new Card(root, getDefaultVisibility);
    }
}
