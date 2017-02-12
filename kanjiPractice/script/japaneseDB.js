// -*- coding: utf-8 -*-
/**
   @fileOverview handle the vocabulary database
*/

// For eslint
/* global Kana:false */

window.JapaneseDB = (function() {
	"use strict";

    var __dbIsKanji = false;
	var __db = [];
	var __good = [];
	var __index = 0; // Index into __db
	var __indexIndirect = []; // Indirection for filtered DB
	var __indirect = 0;
	var __fullRandom = false;
    var speech;
    var JPvoice;

	return {
        // Init the DB to display only given lessons or grades
        initDB: function(lessons) {
			var indx = __dbIsKanji ? 4 : 2;

            __good = [];
	        __indexIndirect = [];
            for (var i = 0 ; i<__db.length ; i++) {
                __good.push(0);
				var key = __db[i][indx].replace(/ {2}/g, " ");
                if (lessons.indexOf(key) >= 0) {
                    __indexIndirect.push(i);
                }
            }
            __indirect = -1;
            if (__indexIndirect.length>0) {
                __index = __indexIndirect[0];
            }

            this.shuffle();
        },

        shuffle: function() {
            for (var i = __indexIndirect.length-1 ; i>1 ; i--) {
                var j = Math.floor(Math.random() * (i+1));
                var k = __indexIndirect[i];
                __indexIndirect[i] = __indexIndirect[j];
                __indexIndirect[j] = k;
            }
        },

		// Register all entries in the array into the database
		addToDB: function(entries) {
			// Each element is an array [jap, eng, lesson, keywords]
			// The japanese string is encoded for display in kanji,
			// kana, or romaji. It is a string of kanji/kana Each
			// kanji can be followed by the kana pronumciation in
			// brakets. a Romaji override can also be added in curly
			// braces.
			// Eg.
			// すみません        (pure kana)
			// 日[に]本[ほん]語  (pure kanji)
			// 分[わか]ります    (mix of both)
			// 私[わたし]は{wa}  (mix of both, plus romaji override)
			// <明日>[あした]    (multiple Kanji phonetics)
			__db = __db.concat(entries);
		},

		addKanjiToDB: function(entries) {
			// Each element is an array [kanji, kun, on, eng, lesson]
            // Kun is typically hiragana
            // On is typically katakana
			__db = __db.concat(entries);
            __dbIsKanji = true;
		},

	    addKanjiStateToDB: function(entries) {
			// Each element is an array [kanji, object]
            // object defines levels 1 and 2 for each entries
            if (__dbIsKanji) {
                for (var i=0 ; i<entries.length ; i++ ) {
                    var key = entries[i][0];
                    for (var j=0 ; j<__db.length ; j++ ) {
                        if (__db[j][0] === key) {
                            __db[j].push(entries[i][1]);
                            break;
                        }
                    }
                }
            }
		},

		/**
			@param {String} str The input encoded string.
			@return {String} The kana version of the string.
		*/
		toKana: function(str) {
			// Remove Romaji characters
			var removeRoma = str.replace(/{[A-Za-z]+}/g, "");

			// Replace grouped kanji with kana when there is an override
			removeRoma = removeRoma.replace(/<[^<>]+>\[([^\x5D]+)\]/g, "$1");
			// Replace kanji with kana when there is an override
			return removeRoma.replace(/.\[([^\x5D]+)\]/g, "$1");
		},

		/**
			@param {String} str The input encoded string.
			@return {String} The kanji version of the string.
		*/
		toKanji: function(str) {
			// Remove Romaji characters
			var removeRoma = str.replace(/{[A-Za-z]+}/g, "");

			// Remove Kanji grouping
			removeRoma = removeRoma.replace(/[<>]/g, "");

			// Remove the Kana phonetics
			return removeRoma.replace(/\[[^\x5D]+\]/g, "");
		},

		/**
			@param {String} str The input encoded string.
			@return {String} The romaji version of the string.
		*/
		toRoma: function(str) {
			// Replace grouped kanji with kana when there is an override
			var roma = str.replace(/<[^<>]+>\[([^\x5D]+)\]/g, "$1");
			// Replace kanji with kana when there is an override
			roma = roma.replace(/.\[([^\x5D]+)\]/g, "$1");

			// Replace kana with romaji when there is an override
		    roma = roma.replace(/.{([A-Za-z]+)}/g, "$1");

			// Remove the Kana phonetics
			return Kana.toRomaji(roma);
		},

		/**
           @param {Int} [elemId] Index of the database element to
           return. If not set, the current element is returned.
		   @return {Object} The elemId'th element in the form of a
           dictionary. If elemId is not set, returns the current
           element.
		*/
		elem: function(elemId) {
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
				    kunroma: this.toRoma(elem[1]),
                    on: elem[2],
				    onhira: Kana.toKana(elem[2], true),
				    onroma: this.toRoma(elem[2]),
                    eng: elem[3],
                    grade: elem[4],
                    opt : options
                };
            }

			var jap = elem[0];
			return {
				orig: jap,
				kanj: this.toKanji(jap),
				kana: this.toKana(jap),
				roma: this.toRoma(jap),
				eng:  elem[1],

				lesson: elem[2],
				category: elem[3],
				type: elem[4]
			};
		},

		/**
			Render the current string inside the root div. The div is
			completely emptied, then the content is repalced with
			arrays to display kana or romaji phonetics on top.
            @param {DOMElement} rootDiv The div to render into.
            @param {DOMElement} [elemId] Index of the database element
			to render. If not set, the current element is rendered.
            @return {undefined}
		*/
		renderKanji: function(rootDiv, elemId) {
			elemId = elemId || __index; // Set default value
			var elem = __db[elemId];
			var jap = elem[0];
			var html = "";

			// Remove Romaji characters
			jap = jap.replace(/{[A-Za-z]+}/g, "");

			// Insert ~ around kanji with phonetics to be able to use
			// split later.

			// Simple case: One kanji E.g. 私[わたし]
			// \x5D == ]
			jap = jap.replace(/([^<>]\[[^\x5D]+\])/g, "~$1~");
			// Complex case: multiple kanji. E.g. <明日>[あした]
			jap = jap.replace(/<([^<>]+)>\[([^\x5D]+)\]/g, "~$1[$2]~");
			var parts = jap.split("~");
			// html += "!!!"+jap+"!!!"  // DEBUG
			for (var i = 0; i < parts.length; i++) {
				var token = parts[i];
				if (/\[/.test(token)) {
					// If part has phonetics, print as a vertical
					// array
					var kanji = token.replace(/\[[^\x5D]+\]/g, "");
					var phonetics = token.replace(/.*\[([^\x5D]+)\]/g, "$1");
					html += '<table class="layout"><tr class="over"><td>'+phonetics+"</td></tr><tr> <td>"+kanji+"</td></tr></table>";
				} else {
					// If part has no phonetics, print as is
					html += token;
				}
			}
			rootDiv.html('<span class="kanji">'+html+"</span>");
		},

		/**
			Use speech synthesis to pronounce it.
            @param {Int} [elemId] Index of the database element to
			pronounce. If not set, the current element is pronounced.
            @return {undefined}
		*/
		sayIt: function(elemId) {
            if (JPvoice === undefined) {
                speech = window.speechSynthesis;
                // Find a Japanese voice
                JPvoice = speech.getVoices().filter(function (voice) { return voice.lang === "ja-JP"; })[0];
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
				replace("じゃあ", "ジャア").
				replace("じゃ", "ジャ");

			var utterance = new SpeechSynthesisUtterance(phonetic);
			utterance.voice = JPvoice;
			speech.speak(utterance);
		},


		/**
		   @return {Int} The number of entries in the database.
		*/
		size: function() {
            if (__indexIndirect.length>0) {
                return __indexIndirect.length;
            }
			return __db.length;
		},

        /**
            Side effect function to move to the next entry in the DB.

            @param {Int} [nbGoodSkip] When set to a positive number, all
            entries for which the number of good answers is greater or equal
            to this number are removed from the list.
            @return {Object} The current entry.
        */
		next: function(nbGoodSkip) {
            nbGoodSkip = nbGoodSkip || 0;
            if (nbGoodSkip<1) { nbGoodSkip = 99999; }
            do {
                if (__fullRandom) {
                    __indirect = Math.floor(Math.random() *
                                            __indexIndirect.length);
                } else {
                    __indirect ++;
                    if (__indirect >= __indexIndirect.length) {
                        __indirect = 0;
                    }
                }
                __index = __indexIndirect[__indirect];
            }
            while ((__good.length>__index) && (__good[__index] >= nbGoodSkip));

			return this.elem();
		},

        markGoodBad: function(what) {
            if (what) {
                __good[__index]++;
            } else {
                __good = 0;
            }
        },

		/**
		   @return {String[]} A sorted array of all known categories.
		*/
		categories: function() {
			var array = new Array();
			for (var i = 0 ; i<__db.length ; i++) {
				var category = __db[i][3];
				if (array.indexOf(category) < 0) {
					array.push(category);
				}
			}

			array.sort();
			return array;
		},

		lessons: function() {
			var array = new Array();
			for (var i = 0 ; i<__db.length ; i++) {
				var lesson = __db[i][2];
				if (array.indexOf(lesson) < 0) {
					array.push(lesson);
				}
			}

			array.sort();
			return array;
		},

		grades: function() {
			var array = new Array();
            if (__dbIsKanji) {
			    for (var i = 0 ; i<__db.length ; i++) {
				    var grade = __db[i][4];
				    if (array.indexOf(grade) < 0) {
					    array.push(grade);
				    }
			    }
            }
			array.sort();
			for (i = 0 ; i<array.length ; i++) {
				array[i] = array[i].replace(/ {2}/g, " ");
            }
			return array;
		}
	};

})();
