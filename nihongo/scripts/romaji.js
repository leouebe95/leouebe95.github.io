// -*- coding: utf-8 -*-

// ============================================================================
/*!
 * Converts Hiragana and Katakana to Romaji.
 * Use as a custom function: =ROMAJI(A1)
 * or via the custom menu "Romaji Converter".
 */

class Romaji {

    // Mapping for compound sounds (Yoon) - Must be checked first
    static compounds = {
        'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
        'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
        'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
        'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
        'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
        'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
        'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
        'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
        'じゃ': 'ja',  'じゅ': 'ju',  'じょ': 'jo',
        'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
        'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
        // Katakana Compounds
        'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
        'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
        'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
        'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
        'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
        'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
        'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
        'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
        'ジャ': 'ja',  'ジュ': 'ju',  'ジョ': 'jo',
        'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
        'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
        // Foreign sounds
        'シェ': 'she', 'ジェ': 'je',
        'ティ': 'ti', 'ディ': 'di',
        'チェ': 'che',
        'トゥ': 'tu',
        'ファ': 'fa', 'フィ': 'fi', 'フェ': 'fe', 'フォ': 'fo',
        'ウィ': 'wi', 'ウェ': 'we', 'ウォ': 'wo',
        'ヴァ': 'va', 'ヴィ': 'vi', 'ヴェ': 've', 'ヴォ': 'vo'
    };

    // Mapping for basic chars
    static basic = {
        'あ':'a', 'い':'i', 'う':'u', 'え':'e', 'お':'o',
        'か':'ka', 'き':'ki', 'く':'ku', 'け':'ke', 'こ':'ko',
        'さ':'sa', 'し':'shi', 'す':'su', 'せ':'se', 'そ':'so',
        'た':'ta', 'ち':'chi', 'つ':'tsu', 'て':'te', 'と':'to',
        'な':'na', 'に':'ni', 'ぬ':'nu', 'ね':'ne', 'の':'no',
        'は':'ha', 'ひ':'hi', 'ふ':'fu', 'へ':'he', 'ほ':'ho',
        'ま':'ma', 'み':'mi', 'む':'mu', 'め':'me', 'も':'mo',
        'や':'ya', 'ゆ':'yu', 'よ':'yo',
        'ら':'ra', 'り':'ri', 'る':'ru', 'れ':'re', 'ろ':'ro',
        'わ':'wa', 'を':'wo', 'ん':'n',
        'が':'ga', 'ぎ':'gi', 'ぐ':'gu', 'げ':'ge', 'ご':'go',
        'ざ':'za', 'じ':'ji', 'ず':'zu', 'ぜ':'ze', 'ぞ':'zo',
        'だ':'da', 'ぢ':'ji', 'づ':'zu', 'で':'de', 'ど':'do',
        'ば':'ba', 'び':'bi', 'ぶ':'bu', 'べ':'be', 'ぼ':'bo',
        'ぱ':'pa', 'ぴ':'pi', 'ぷ':'pu', 'ぺ':'pe', 'ぽ':'po',
        // Katakana
        'ア':'a', 'イ':'i', 'ウ':'u', 'エ':'e', 'オ':'o',
        'カ':'ka', 'キ':'ki', 'ク':'ku', 'ケ':'ke', 'コ':'ko',
        'サ':'sa', 'シ':'shi', 'ス':'su', 'セ':'se', 'ソ':'so',
        'タ':'ta', 'チ':'chi', 'ツ':'tsu', 'テ':'te', 'ト':'to',
        'ナ':'na', 'ニ':'ni', 'ヌ':'nu', 'ネ':'ne', 'ノ':'no',
        'ハ':'ha', 'ヒ':'hi', 'フ':'fu', 'ヘ':'he', 'ホ':'ho',
        'マ':'ma', 'ミ':'mi', 'ム':'mu', 'メ':'me', 'モ':'mo',
        'ヤ':'ya', 'ユ':'yu', 'ヨ':'yo',
        'ラ':'ra', 'リ':'ri', 'ル':'ru', 'レ':'re', 'ロ':'ro',
        'ワ':'wa', 'ヲ':'wo', 'ン':'n',
        'ガ':'ga', 'ギ':'gi', 'グ':'gu', 'ゲ':'ge', 'ゴ':'go',
        'ザ':'za', 'ジ':'ji', 'ズ':'zu', 'ゼ':'ze', 'ゾ':'zo',
        'ダ':'da', 'ヂ':'ji', 'ヅ':'zu', 'デ':'de', 'ド':'do',
        'バ':'ba', 'ビ':'bi', 'ブ':'bu', 'ベ':'be', 'ボ':'bo',
        'パ':'pa', 'ピ':'pi', 'プ':'pu', 'ペ':'pe', 'ポ':'po',
        'ヴ':'vu'
    };

    // Display long vowels as macron accent. This is a post process
    // after the romaji was generated.
    static vowels = {
        'aa': 'ā',
        'ii': 'ī',
        'uu': 'ū',
        'ee': 'ē', 'ei': 'ē',
        'oo': 'ō', 'ou': 'ō'
    };

    /*!
     * Replace long vowels with macron accents
     */
    static normalizeRomaji(text) {
        if (!text) return "";

        var res = text;
        for (const [key, value] of Object.entries(Romaji.vowels)) {
            res = res.replaceAll(key, value);
        }

        return res;
    }

    static toRomaji(text) {
        if (!text) return "";

        let res = "";
        let i = 0;

        while (i < text.length) {
            let char = text[i];
            let nextChar = text[i+1];

            // 1. Check for long vowels, using the katakana notation
            if (char === 'ー') {
                res += res.slice(-1);
                i++;
                continue;
            }

            // 1. Check for small Tsu (Sokuon) - っ or ッ
            if (char === 'っ' || char === 'ッ') {
                if (nextChar) {
                    // Look ahead to see what the next char maps to
                    let nextRomaji = "";

                    // Check if next is a compound
                    let compoundCheck = text.substring(i+1, i+3);
                    if (Romaji.compounds[compoundCheck]) {
                        nextRomaji = Romaji.compounds[compoundCheck];
                        // Double the first letter
                        res += nextRomaji.charAt(0) + nextRomaji;
                        i += 3; // Skip tsu + 2 compound chars
                        continue;
                    } else if (Romaji.basic[nextChar]) {
                        nextRomaji = Romaji.basic[nextChar];
                        // Double the first letter
                        res += nextRomaji.charAt(0) + nextRomaji;
                        i += 2; // Skip tsu + next char
                        continue;
                    }
                }
                // If tsu is at the end or not followed by valid char, ignore or treat as 't' (rare)
                i++;
                continue;
            }

            // 2. Check for Compounds (2 characters)
            let twoChars = text.substring(i, i+2);
            if (Romaji.compounds[twoChars]) {
                res += Romaji.compounds[twoChars];
                i += 2;
                continue;
            }

            // 3. Check Basic Chars (1 character)
            if (Romaji.basic[char]) {
                res += Romaji.basic[char];
            } else {
                // If it's a kanji, number, or symbol not in map, leave it as is
                res += char;
            }
            i++;
        }
        res = Romaji.normalizeRomaji(res);
        return res;
    }
}
