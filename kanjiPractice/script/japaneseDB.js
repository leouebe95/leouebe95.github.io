// -*- coding: utf-8 -*-
/**
   @fileOverview handle the vocabulary database
*/

// For eslint
/* global Kana JapaneseDB:true */
/* exported JapaneseDB */
/* eslint no-console: ["error", { allow: ["error"] }] */

JapaneseDB = (function() {
	'use strict';

    // True if the DB is made of single Kanji, false if it is made of
    // sentences
    var __dbIsKanji = false;
    // Global database of all concatenated entries.
	var __db = [];

	var __index = 0; // Index into __db
	var __indirect = 0;
	var __fullRandom = false;
    var speech;
    var JPvoice;

	return class {

        // Init the DB to display only given lessons or grades
        constructor(lessons) {
			var indx = __dbIsKanji ? 4 : 2;

            // Tracks good/bad answers
            this.__good = [];
            // Indirection into DB. Used for filtering and shuffling
	        this.__indexIndirect = [];
            for (var i = 0 ; i<__db.length ; i++) {
                this.__good.push(0);
				var key = __db[i][indx].replace(/ {2}/g, ' ');
                if (lessons.indexOf(key) >= 0) {
                    this.__indexIndirect.push(i);
                }
            }
            __indirect = -1;
            if (this.__indexIndirect.length>0) {
                __index = this.__indexIndirect[0];
            }

            this.shuffle();
        }

        /**
           Shuffle the indirect array. Allows to access the DB in a
           repetable random order with next()
           @return {undefined}
        */
        shuffle() {
            for (var i = this.__indexIndirect.length-1 ; i>1 ; i--) {
                var j = Math.floor(Math.random() * (i+1));
                var k = this.__indexIndirect[i];
                this.__indexIndirect[i] = this.__indexIndirect[j];
                this.__indexIndirect[j] = k;
            }
        }

        /**
           Register all entries of the array into the global
           database. Need to be called before any JapaneseDB object
           is created.

		   Each element in entries is an array [jap, eng, lesson, keywords]

		   The japanese string is encoded for display in kanji,
		   kana, or romaji. It is a string of kanji/kana Each
		   kanji can be followed by the kana pronunciation in
		   brakets. A Romaji override can also be added in curly
		   braces.

		   @example
		   すみません        (pure kana)
		   日[に]本[ほん]語  (pure kanji)
		   分[わか]ります    (mix of both)
		   私[わたし]は{wa}  (mix of both, plus romaji override)
		   <明日>[あした]    (multiple Kanji phonetics)

           @param {Object[]} entries Array of objects to be added to
           the data base
           @return {undefined}
        */
        static addToDB(entries) {
            if (__dbIsKanji) {
                console.error('Cannot add normal entries to Kanjies');
                return;
            }
			__db = __db.concat(entries);
		}

        /**
           Register all entries of the array into the global
           database. Need to be called before any JapaneseDB object
           is created.

		   Each element is an array [kanji, kun, on, eng, lesson].

           Kun is typically hiragana.

           On is typically katakana.

           @param {Object[]} entries entries Array of objects to be
           added to the data base
           @return {undefined}
        */
		static addKanjiToDB(entries) {
            if ((__db.length>0) && (!__dbIsKanji)) {
                console.error('Cannot add Kanji entries to a normal database');
                return;
            }
			__db = __db.concat(entries);
            __dbIsKanji = true;
		}

		/**
		   @param {String} str The input encoded string.
		   @return {String} The kana version of the string.
		*/
		static toKana(str) {
			// Remove Romaji characters
			var removeRoma = str.replace(/{[A-Za-z]+}/g, '');

			// Replace grouped kanji with kana when there is an override
			removeRoma = removeRoma.replace(/<[^<>]+>\[([^\x5D]+)\]/g, '$1');
			// Replace kanji with kana when there is an override
			return removeRoma.replace(/.\[([^\x5D]+)\]/g, '$1');
		}

		/**
		   @param {String} str The input encoded string.
		   @return {String} The kanji version of the string.
		*/
		static toKanji(str) {
			// Remove Romaji characters
			var removeRoma = str.replace(/{[A-Za-z]+}/g, '');

			// Remove Kanji grouping
			removeRoma = removeRoma.replace(/[<>]/g, '');

			// Remove the Kana phonetics
			return removeRoma.replace(/\[[^\x5D]+\]/g, '');
		}

		/**
		   @param {String} str The input encoded string.
		   @return {String} The romaji version of the string.
		*/
		static toRoma(str) {
			// Replace grouped kanji with kana when there is an override
			var roma = str.replace(/<[^<>]+>\[([^\x5D]+)\]/g, '$1');
			// Replace kanji with kana when there is an override
			roma = roma.replace(/.\[([^\x5D]+)\]/g, '$1');

			// Replace kana with romaji when there is an override
		    roma = roma.replace(/.{([A-Za-z]+)}/g, '$1');

			// Remove the Kana phonetics
			return Kana.toRomaji(roma);
		}

		/**
           @param {Int} [elemId] Index of the database element to
           return. If not set, the current element is returned.
		   @return {Object} The elemId'th element in the form of a
           dictionary. If elemId is not set, returns the current
           element.
		*/
		elem(elemId) {
			elemId = elemId || __index; // Set default value
			var elem = __db[elemId];

            if (__dbIsKanji) {
                var options = {};
                if (elem.length>5) {
                    options = elem[5];
                }
                return {
                    kanji: elem[0],
                    kun: elem[1],
				    kunkata: Kana.toKana(elem[1], false),
				    kunroma: this.constructor.toRoma(elem[1]),
                    on: elem[2],
				    onhira: Kana.toKana(elem[2], true),
				    onroma: this.constructor.toRoma(elem[2]),
                    eng: elem[3],
                    grade: elem[4],
                    opt : options
                };
            }

			var jap = elem[0];
			return {
				orig: jap,
				kanj: this.constructor.toKanji(jap),
				kana: this.toKana(jap),
				roma: this.constructor.toRoma(jap),
				eng:  elem[1],

				lesson: elem[2],
				category: elem[3],
				type: elem[4]
			};
		}

		/**
		   Render the current string inside the root div. The div is
		   completely emptied, then the content is repalced with
		   arrays to display kana or romaji phonetics on top.
           @param {DOMElement} rootDiv The div to render into.
           @param {DOMElement} [elemId] Index of the database element
		   to render. If not set, the current element is rendered.
           @return {undefined}
		*/
		static renderKanji(rootDiv, elemId) {
			elemId = elemId || __index; // Set default value
			var elem = __db[elemId];
			var jap = elem[0];
			var html = '';

			// Remove Romaji characters
			jap = jap.replace(/{[A-Za-z]+}/g, '');

			// Insert ~ around kanji with phonetics to be able to use
			// split later.

			// Simple case: One kanji E.g. 私[わたし]
			// \x5D == ]
			jap = jap.replace(/([^<>]\[[^\x5D]+\])/g, '~$1~');
			// Complex case: multiple kanji. E.g. <明日>[あした]
			jap = jap.replace(/<([^<>]+)>\[([^\x5D]+)\]/g, '~$1[$2]~');
			var parts = jap.split('~');
			// html += "!!!"+jap+"!!!"  // DEBUG
			for (var i = 0; i < parts.length; i++) {
				var token = parts[i];
				if (/\[/.test(token)) {
					// If part has phonetics, print as a vertical
					// array
					var kanji = token.replace(/\[[^\x5D]+\]/g, '');
					var phonetics = token.replace(/.*\[([^\x5D]+)\]/g, '$1');
					html += '<table class="layout"><tr class="over"><td>'+phonetics+'</td></tr><tr> <td>'+kanji+'</td></tr></table>';
				} else {
					// If part has no phonetics, print as is
					html += token;
				}
			}
			rootDiv.html('<span class="kanji">'+html+'</span>');
		}

		/**
		   Use speech synthesis to pronounce it.
           @param {Int} [elemId] Index of the database element to
		   pronounce. If not set, the current element is pronounced.
           @return {undefined}
		*/
		sayIt(elemId) {
            if (JPvoice === undefined) {
                speech = window.speechSynthesis;
                // Find a Japanese voice
                JPvoice = speech.getVoices().filter(function (voice) { return voice.lang === 'ja-JP'; })[0];
            }

			elemId = elemId || __index; // Set default value
			var elem = __db[elemId];
			var jap = elem[0];
			// var phonetic = this.toKanji(jap);
			// var phonetic = this.toRoma(jap);
			// There are different bugs in JP speech, depending on what
			// representation is used. Kanji are too ambiguous. Romaji
			// is buggy (e.g. ja -> jei). In hiragana, the major issue
			// is that じゃis not recognized and pronounced
			// ji-ya. Katakana does not have the issue for some
			// reason... So fix up the string a little bit
			var phonetic = this.toKana(jap).
				replace('じゃあ', 'ジャア').
				replace('じゃ', 'ジャ');

			var utterance = new SpeechSynthesisUtterance(phonetic);
			utterance.voice = JPvoice;
			speech.speak(utterance);
		}

		/**
		   @return {Int} The number of valid entries in the database.
		*/
		size() {
            return this.__indexIndirect.length;
		}

        /**
           Side effect function to move to the next entry in the DB.

           @param {Int} [nbGoodSkip] When set to a positive number, all
           entries for which the number of good answers is greater or equal
           to this number are removed from the list.
           @return {Object} The current entry.
        */
		next(nbGoodSkip) {
            nbGoodSkip = nbGoodSkip || 0;
            if (nbGoodSkip<1) { nbGoodSkip = 99999; }
            do {
                if (__fullRandom) {
                    __indirect = Math.floor(Math.random() *
                                            this.__indexIndirect.length);
                } else {
                    __indirect ++;
                    if (__indirect >= this.__indexIndirect.length) {
                        __indirect = 0;
                    }
                }
                __index = this.__indexIndirect[__indirect];
            }
            while ((this.__good.length>__index) && (this.__good[__index] >= nbGoodSkip));

			return this.elem();
		}

        markGoodBad(what) {
            if (what) {
                this.__good[__index]++;
            } else {
                this.__good[__index] = 0;
            }
        }

		/**
		   @return {String[]} A sorted array of all known categories.
		*/
		static categories() {
			var array = [];
			for (var i = 0 ; i<__db.length ; i++) {
				var category = __db[i][3];
				if (array.indexOf(category) < 0) {
					array.push(category);
				}
			}

			array.sort();
			return array;
		}

		static lessons() {
			var array = [];
			for (var i = 0 ; i<__db.length ; i++) {
				var lesson = __db[i][2];
				if (array.indexOf(lesson) < 0) {
					array.push(lesson);
				}
			}

			array.sort();
			return array;
		}

		static grades() {
			var array = [];
            if (__dbIsKanji) {
			    for (let i = 0 ; i<__db.length ; i++) {
				    var grade = __db[i][4];
				    if (array.indexOf(grade) < 0) {
					    array.push(grade);
				    }
			    }
            }
			array.sort();
			for (let i = 0 ; i<array.length ; i++) {
				array[i] = array[i].replace(/ {2}/g, ' ');
            }
			return array;
		}
	};

})();
