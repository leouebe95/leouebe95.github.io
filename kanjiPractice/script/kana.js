// -*- coding: utf-8 -*-
/**
   @fileOverview conversions hiragana, katakana, romaji
*/

// Add a replace all method to Strings
String.prototype.replaceAll = function (find, replace) {
	"use strict";
    var str = this;
    return str.replace(new RegExp(find, "gm"), replace);
};

// Add a replace all method to Strings
String.prototype.replaceAllEscape = function (find, replace) {
	"use strict";
    var str = this;
    return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"), replace);
};


/**
   Class to handle conversions between hiragana, katakana, romaji
   Contains only static methods
*/
class Kana {
    /**
       @constructor
    */
    constructor() {}

	/**
	   Convert the input Romaji string to a canonical form.
	   @param {String} romaStr The input string to transform.
	   @return {String} A new string.
	*/
	static canonicalRomaji(romaStr) {
		romaStr = romaStr.toLowerCase();
		for(var key in Kana.__longVowels) {
			romaStr = romaStr.replaceAll(key, Kana.__longVowels[key]);
		}
		return romaStr;
	}

	/**
	   Convert the input Kana string to romaji.
	   @param {String} inStr The input string to transform.
	   @return {String} A new string.
	*/
	static toRomaji(inStr) {
		// Special "tsu" (Sokuon) case convert to hiragana
		inStr = inStr.replaceAll("ッ", "っ");


		Kana.__toRoma.map(function(item) {
			// Hiragana
			inStr = inStr.replaceAll(item[0], item[2]);
			// Katakana
			inStr = inStr.replaceAll(item[1], item[2]);
		});

		// Punctuation
		for(var key in Kana.__punct) {
			inStr = inStr.replaceAllEscape(key, Kana.__punct[key]);
		}

		// In case input string is katakana, convert double vowels
		inStr = inStr.replace(/(.)ー/g, "$1$1");

		// Finally remap long vowels
		for(key in Kana.__long) {
			inStr = inStr.replaceAll(Kana.__long[key], key);
		}
		inStr = inStr.replaceAll("oo", "ō");

		return inStr;
	}

	/**
	   Convert the input string to hiragana.
	   @param {String} inStr The input string to transform.
	   @param {Boolean} hiragana If true convert to
	   hiragana. Otherwise convert to katakana.
	   @return {String} A new string.
	*/
	static toKana(inStr, hiragana) {
		inStr = this.canonicalRomaji(inStr);

		// Expand long vowels
		for(var key in Kana.__longVowels) {
			inStr = inStr.replaceAll(key, Kana.__longVowels[key]);
		}

		var inIndx, outIndx;
		if (hiragana) {
			inIndx = 1;
			outIndx = 0;
		} else {
			inIndx = 0;
			outIndx = 1;
		}
		Kana.__toKana.map(function(item) {
			// Katakana
			inStr = inStr.replaceAll(item[inIndx], item[outIndx]);
			// Romaji
			inStr = inStr.replaceAll(item[2], item[outIndx]);
		});


		// Punctuation
		for(key in Kana.__punct) {
			inStr = inStr.replaceAllEscape(Kana.__punct[key], key);
		}

		// Special "tsu" (Sokuon) case
		if (hiragana) {
			inStr = inStr.replaceAll("ッ", "っ");
		} else {
			inStr = inStr.replaceAll("っ", "ッ");
		}

		return inStr;
	}

	static toHiragana(inStr) {
		return Kana.toKana(inStr, true);
	}

	static toKatakana(inStr) {
		return Kana.toKana(inStr, false);
	}
}


// Local constants
// Remap table for punctuation.
Kana.__proto__.__punct = {
	"。": ". ",
	"、": ", ",
	"）": ")",
	"（": "(",
	"　": " "
};

// Remap romaji long vowels
Kana.__proto__.__longVowels = {
	"ā": "aa",
	"ī": "ii",
	"ū": "uu",
	"ē": "ee",
	"ō": "ou"
};

// Remap double consonants
Kana.__proto__.__long = {
	"kk": "っk",
	"ss": "っs",
	"tt": "っt",
	"hh": "っh",
	"pp": "っp",
	"tch": "っch"
};
for (var prop in Kana.__longVowels) {
	Kana.__proto__.__long[prop] = Kana.__longVowels[prop];
}

// Main table: hiragana, katakana, romaji
Kana.__proto__.__toRoma = [
	["ゐ", "ヰ", "i"],
	["ゑ", "ヱ", "e"],
	["を", "ヲ", "o"],

	["あ", "ア", "a"],
	["い", "イ", "i"],
	["う", "ウ", "u"],
	["え", "エ", "e"],
	["お", "オ", "o"],


	["ああ", "アー", "ā"],
	["いい", "イー", "ī"],
	["うう", "ウー", "ū"],
	["ええ", "エー", "ē"],
	["おお", "オー", "ō"],
	["おう", "オー", "ō"],

	// Needs to be first to avoid precedence on chi
	["ひ", "ヒ", "hi"],

	["や", "ヤ", "ya"],
	["ゆ", "ユ", "yu"],
	["よ", "ヨ", "yo"],
	["か", "カ", "ka"],
	["き", "キ", "ki"],
	["く", "ク", "ku"],
	["け", "ケ", "ke"],
	["こ", "コ", "ko"],
	["さ", "サ", "sa"],
	["し", "シ", "shi"],
	["す", "ス", "su"],
	["せ", "セ", "se"],
	["そ", "ソ", "so"],
	["た", "タ", "ta"],
	["ち", "チ", "chi"],
	["つ", "ツ", "tsu"],
	["て", "テ", "te"],
	["と", "ト", "to"],
	["な", "ナ", "na"],
	["に", "ニ", "ni"],
	["ぬ", "ヌ", "nu"],
	["ね", "ネ", "ne"],
	["の", "ノ", "no"],
	["は", "ハ", "ha"],
	// Moved up
	["ふ", "フ", "fu"],
	["へ", "ヘ", "he"],
	["ほ", "ホ", "ho"],
	["ま", "マ", "ma"],
	["み", "ミ", "mi"],
	["む", "ム", "mu"],
	["め", "メ", "me"],
	["も", "モ", "mo"],
	["や", "ヤ", "ya"],
	["ゆ", "ユ", "yu"],
	["よ", "ヨ", "yo"],
	["ら", "ラ", "ra"],
	["り", "リ", "ri"],
	["る", "ル", "ru"],
	["れ", "レ", "re"],
	["ろ", "ロ", "ro"],
	["わ", "ワ", "wa"],
	["ん", "ン", "n"],
	["が", "ガ", "ga"],
	["ぎ", "ギ", "gi"],
	["ぐ", "グ", "gu"],
	["げ", "ゲ", "ge"],
	["ご", "ゴ", "go"],
	["ざ", "ザ", "za"],
	["じ", "ジ", "ji"],
	["ず", "ズ", "zu"],
	["ぜ", "ゼ", "ze"],
	["ぞ", "ゾ", "zo"],
	["だ", "ダ", "da"],
	["ぢ", "ヂ", "ji"],
	["づ", "ヅ", "zu"],
	["で", "デ", "de"],
	["ど", "ド", "do"],
	["ば", "バ", "ba"],
	["び", "ビ", "bi"],
	["ぶ", "ブ", "bu"],
	["べ", "ベ", "be"],
	["ぼ", "ボ", "bo"],
	["ぱ", "パ", "pa"],
	["ぴ", "ピ", "pi"],
	["ぷ", "プ", "pu"],
	["ぺ", "ペ", "pe"],
	["ぽ", "ポ", "po"],

	["きゃ", "キャ", "kya"],
	["きゅ", "キュ", "kyu"],
	["きょ", "キョ", "kyo"],
	["しゃ", "シャ", "sha"],
	["しゅ", "シュ", "shu"],
	["しょ", "ショ", "sho"],
	["ちゃ", "チャ", "cha"],
	["ちゅ", "チュ", "chu"],
	["ちょ", "チョ", "cho"],
	["にゃ", "ニャ", "nya"],
	["にゅ", "ニュ", "nyu"],
	["にょ", "ニョ", "nyo"],
	["ひゃ", "ヒャ", "hya"],
	["ひゅ", "ヒュ", "hyu"],
	["ひょ", "ヒョ", "hyo"],
	["みゃ", "ミャ", "mya"],
	["みゅ", "ミュ", "myu"],
	["みょ", "ミョ", "myo"],
	["りゃ", "リャ", "rya"],
	["りゅ", "リュ", "ryu"],
	["りょ", "リョ", "ryo"],
	["ぎゃ", "ギャ", "gya"],
	["ぎゅ", "ギュ", "gyu"],
	["ぎょ", "ギョ", "gyo"],
	["じゃ", "ジャ", "ja"],
	["じゅ", "ジュ", "ju"],
	["じょ", "ジョ", "jo"],
	["ぢゃ", "ヂャ", "ja"],
	["ぢゅ", "ヂュ", "ju"],
	["ぢょ", "ヂョ", "jo"],
	["びゃ", "ビャ", "bya"],
	["びゅ", "ビュ", "byu"],
	["びょ", "ビョ", "byo"],
	["ぴゃ", "ピャ", "pya"],
	["ぴゅ", "ピュ", "pyu"],
	["ぴょ", "ピョ", "pyo"]
];

Kana.__proto__.__toKana = Kana.__toRoma.reverse();
