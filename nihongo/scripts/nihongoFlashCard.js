// -*- coding: utf-8 -*-
/**
   @fileOverview Main file for japanese vocabulary flashcards
*/

(function() {
    const filters = ['Source', 'Proficiency', 'Category', 'Date', 'isKana'];
    const nextContent = '<img src="img/next.png" title="Next Card"/>Next</button>'
    const revealContent = '<img src="img/show.png" title="Show Answers"/>Reveal</button>'
    var db = null;

    /**
     */
    function setMessage(msg) {
        document.getElementById('messageBox').innerText = msg;
    }

    /**
       Set values to a new card
     */
    function setCard(item) {
        document.getElementById('Kanji')._myClass.setText(item['Kanji'], '漢字');
        document.getElementById('Kana')._myClass.setText(item['Kana'], 'ひらがな / カタカナ');
        document.getElementById('Romaji')._myClass.setText(item['Romaji'], 'Romaji');
        document.getElementById('English')._myClass.setText(item['English'], 'English');

        document.getElementById('numWords').innerText = db.numLeft;

        var kanji = item['Kanji'];
        var link1 = `https://www.nihongomaster.com/japanese/dictionary?query=${kanji}`;
        var link2 = `https://jisho.org/search/${kanji}`;
        document.getElementById('nihongomaster').setAttribute('href', encodeURI(link1));
        document.getElementById('jisho').setAttribute('href', encodeURI(link2));

        setMessage('');
    }

    /**
       Apply the category filter
     */
    function applyVisibility() {
        var visiElem = document.getElementById('VisibleChoice');
        var checked = visiElem._myClass.value;

        for (let card of ['Kana', 'Romaji', 'Kanji', 'English']) {
            var isChecked = checked.has(card);
            let cardElem = document.getElementById(card);
            cardElem._myClass.visible = isChecked;
        }
    }

    /**
       Reveal all cards
     */
    function makeAllVisible() {
        //
        for (let card of ['Kana', 'Romaji', 'Kanji', 'English']) {
            let cardElem = document.getElementById(card);
            cardElem._myClass.visible = true;
        }
    }

    /**
       Bind the callbacks to all UI elements
     */
    function applyFilter() {
        var filter = {}

        for (let f of filters) {
            elemDOM = document.getElementById(f);
            values = elemDOM._myClass.value;
            filter[f] = values;
        }

        db.filterBy(filter, true);
        var nextButton = document.getElementById('next');
        resetNextButton(nextButton);
        setCard(db.pickOne(true), db);
    }

    /**
       Reset the "next" button to its default state
     */
    function resetNextButton(nextButton) {
        nextButton.innerHTML = revealContent;
        nextButton._isReveal = true;
    }

    /**
       The next button is a two step action. First "reveal" then
       "next card"
     */
    function nextAction(event) {

        // First click is a "reveal; show all answers
        if (this._isReveal) {
            this.innerHTML = nextContent;
            this._isReveal = false;
            makeAllVisible();
        } else {
            // Second click goes to the next card
            resetNextButton(this);
            applyVisibility();

            // Wait 1s, for the card animation to finish
            setTimeout(() => {
                if (db.numLeft > 0) {
                    setCard(db.pickOne(true), db);
                } else {
                    applyFilter();
                    setMessage('All words practiced, starting over');
                }
            }, 800);
        }
    }

    /**
        Main entry point for the page.
    */
    function main() {
        db = new NihongoDB(__data__);

        // Start the app with only the 'practice' vocabulary
        var defaultFilter = {'Proficiency': new Set(['3-practice'])}

        // Start the app with only the 'practice' vocabulary
        db.filterBy(defaultFilter, true);

        // Build / style the cards
        var cards = document.getElementsByClassName('flip-card');
	    for (let i=0 ; i<cards.length ; i++) {
		    Card.init(cards[i], () => {
                var visiElem = document.getElementById('VisibleChoice');
                var checked = visiElem._myClass.value;
                return checked.has(cards[i].id);
            });
	    }

        // Build / style the mutiple choices

        // Default visibility
        var visiChoice = document.getElementById('VisibleChoice');
	    MultipleChoice.init(visiChoice, 'Visible', [
            {'UIname': 'Kanji'},
            {'UIname': 'Kana', 'checked': true},
            {'UIname': 'Romaji', 'checked': true},
            {'UIname': 'English', 'checked': true}]);
        visiChoice.addEventListener('change', applyVisibility);

        // All filters
        for (let f of filters) {
            let choiceDOM = document.getElementById(f);
            let values = Array.from(db.labels[f]).sort();
            let choiceData = values.map(x => ({'UIname': x}));
            MultipleChoice.init(choiceDOM, f, choiceData);
            choiceDOM.addEventListener('change', applyFilter);

            // Set the UI to match the default filter
            if (f in defaultFilter) {
                choiceDOM._myClass.select(defaultFilter[f]);
            }
        }

        // Bind the Next button
        var nextButton = document.getElementById('next');
        resetNextButton(nextButton)
        nextButton.addEventListener('click', nextAction)

        // Bind the Shuffle button
        var nextButton = document.getElementById('shuffle');
        nextButton.addEventListener('click', () => {
            applyFilter();
            setMessage('Starting over again');
        });

        applyVisibility();

        setCard(db.pickOne(true), db);
    }

    document.addEventListener('DOMContentLoaded', main);
})();

