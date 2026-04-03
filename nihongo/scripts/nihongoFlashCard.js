// -*- coding: utf-8 -*-
/*!
   @fileOverview Main file for japanese vocabulary flashcards
*/

// Tell eslint about classes defined elsewhere
/* global Card MultipleChoice NihongoDB */

(function() {
    const __filters = ['Source', 'Proficiency', 'Category', 'Date', 'isKana'];
    const __UIchoices = ['Visible'].concat(__filters);
    const __cards = ['Kanji', 'Kana', 'Romaji', 'English'];
    const __cardTitles = {'Kanji': '漢字', 'Kana': 'ひらがな / カタカナ',
                          'Romaji': 'Romaji', 'English': 'English'};

    const __nextContent = '<img src="img/next.png" title="Next Card"/>Next</button>'
    const __revealContent = '<img src="img/show.png" title="Show Answers"/>Reveal</button>'
    var __db = null;

    /*!
     */
    function setMessage(msg) {
        document.getElementById('messageBox').innerText = msg;
    }

    /*!
       Get current UI configuration and return it in an object
     */
    function getUIState() {
        let state = {};
        for (let f of __UIchoices) {
            let DOM = document.getElementById(f);
            if (DOM && DOM._myClass) {
                state[f] = Array.from(DOM._myClass.value);
            }
        }
        return state;
    }

    /*!
       Set the UI configuration from values saved in an object
     */
    function setUIState(val) {
        for (let f of __UIchoices) {
            try {
                var uiState = new Set(val[f]);
                let DOM = document.getElementById(f);
                if (DOM && DOM._myClass) {
                    DOM._myClass.select(uiState);
                }
            }
            catch(e) {
                // If the UI state was not saved, just ignore
            }
        }
    }

    /*!
       Save current UI configuration to localStorage
     */
    function saveState() {
        localStorage.setItem('nihongoFlashCardState',
                             JSON.stringify(getUIState()));
    }

    /*!
       Restore last UI values if some were saved
     */
    function restoreState() {
        let savedStr = localStorage.getItem('nihongoFlashCardState');
        if (savedStr) {
            try {
                let savedUIState = JSON.parse(savedStr);
                setUIState(savedUIState);
            } catch(e) {
                // Just ignore the saved UI state are use defaults
            }
        }
    }

    /*!
       Set values to a new card
     */
    function setCard(item) {
        for (let card of __cards) {
            document.getElementById(card)._myClass.setText(item[card], __cardTitles[card]);
        }
        document.getElementById('numWords').innerText = __db.numLeft;

        var kanji = item['Kanji'];
        var link = encodeURI(`https://www.nihongomaster.com/japanese/dictionary?query=${kanji}`);
        document.getElementById('nihongomaster').setAttribute('href', link);

        link = encodeURI(`https://jisho.org/search/${kanji}`);
        document.getElementById('jisho').setAttribute('href', link);

        var conj = document.getElementById('conjugate')
        var conjSpan = document.getElementById('conjugate-span')
        if (item['Category'].startsWith('verb')) {
            var shortRef = kanji.split('・')[0]
            link = encodeURI(`https://www.japaneseverbconjugator.com/VerbDetails.asp?txtVerb=${shortRef}&Go=Conjugate`);
            conj.setAttribute('href', link);
            conjSpan.style.display = "flex";
        } else {
            conj.setAttribute('href', '');
            conjSpan.style.display = "none";
        }

        setMessage('');
    }

    /*!
       Apply the category filter
     */
    function applyVisibility() {
        var visiElem = document.getElementById('Visible');
        var checked = visiElem._myClass.value;

        for (let card of __cards) {
            var isChecked = checked.has(card);
            let cardElem = document.getElementById(card);
            cardElem._myClass.visible = isChecked;
        }

        var nextButton = document.getElementById('next');
        resetNextButton(nextButton);
        saveState();
    }

    /*!
       True if all the cards are visible
     */
    function isAllVisible() {
        var visiElem = document.getElementById('Visible');
        var checked = visiElem._myClass.value;

        for (let card of __cards) {
            if (!checked.has(card)) {
                return false;
            }
        }
        return true;
    }

    /*!
       Reveal all cards
     */
    function makeAllVisible() {
        //
        for (let card of __cards) {
            let cardElem = document.getElementById(card);
            cardElem._myClass.visible = true;
        }
    }

    /*!
       Bind the callbacks to all UI elements
     */
    function applyFilter() {
        var filter = {}

        for (let f of __filters) {
            var elemDOM = document.getElementById(f);
            var values = elemDOM._myClass.value;
            filter[f] = values;
        }

        __db.filterBy(filter, true);
        var nextButton = document.getElementById('next');
        resetNextButton(nextButton);
        setCard(__db.pickOne(true), __db);
        saveState();
    }

    /*!
       Reset the "next" button to its default state
     */
    function resetNextButton(nextButton) {
        if (isAllVisible()) {
            nextButton.innerHTML = __nextContent;
        } else {
            nextButton.innerHTML = __revealContent;
        }
        nextButton._isReveal = true;
    }

    /*!
       The next button is a two step action. First "reveal" then
       "next card"
     */
    function nextAction(/* event */) {

        // First click is a "reveal; show all answers.
        // except if all aswers are already shown
        if ((!isAllVisible()) && this._isReveal) {
            this.innerHTML = __nextContent;
            this._isReveal = false;
            makeAllVisible();
        } else {
            // Second click goes to the next card
            resetNextButton(this);
            applyVisibility();

            // Wait 0.8s, for the card animation to finish, unless all cards are visible
            var timeOutMillisec = 800;
            if (isAllVisible()) {
                timeOutMillisec = 0;
            }
            setTimeout(() => {
                if (__db.numLeft > 0) {
                    setCard(__db.pickOne(true), __db);
                } else {
                    applyFilter();
                    setMessage('All words practiced, starting over');
                }
            }, timeOutMillisec);
        }
    }

    /*!
        Main entry point for the page.
    */
    function start() {
        // Start the app with only the 'practice' vocabulary
        var defaultFilter = {'Proficiency': new Set(['3-practice'])}
        var defaultVisible = new Set(['Kana', 'Romaji', 'English']);

        // Start the app with only the 'practice' vocabulary
        __db.filterBy(defaultFilter, true);

        // Build / style the cards
        var cards = document.getElementsByClassName('flip-card');
	    for (let i=0 ; i<cards.length ; i++) {
		    Card.init(cards[i], () => {
                var visiElem = document.getElementById('Visible');
                var checked = visiElem._myClass.value;
                return checked.has(cards[i].id);
            });
	    }

        // Build / style the mutiple choices

        // Default visibility
        var visiChoice = document.getElementById('Visible');
	    MultipleChoice.init(visiChoice, 'Visible', [
            {'UIname': 'Kanji'},
            {'UIname': 'Kana', 'checked': true},
            {'UIname': 'Romaji', 'checked': true},
            {'UIname': 'English', 'checked': true}]);
        visiChoice.addEventListener('change', applyVisibility);

        // All filters
        for (let f of __filters) {
            let choiceDOM = document.getElementById(f);
            let values = Array.from(__db.labels[f]).sort();
            let choiceData = values.map(x => ({'UIname': x}));
            MultipleChoice.init(choiceDOM, f, choiceData);
            choiceDOM.addEventListener('change', applyFilter);

            // Set the UI to match the default filter
            if (f in defaultFilter) {
                choiceDOM._myClass.select(defaultFilter[f]);
            }
        }

        // Restore last UI values if some were saved
        restoreState();

        // Bind the Next button
        var nextButton = document.getElementById('next');
        resetNextButton(nextButton);
        nextButton.addEventListener('click', nextAction);
        nextButton.focus();

        // Bind the Shuffle button
        var shuffleButton = document.getElementById('shuffle');
        shuffleButton.addEventListener('click', () => {
            applyFilter();
            setMessage('Starting over again');
        });

        applyVisibility();

        setCard(__db.pickOne(true), __db);
    }

    /*!
        Main entry point for the page.
    */
    function main() {
        __db = new NihongoDB(start, applyFilter);
    }

    document.addEventListener('DOMContentLoaded', main);
})();
