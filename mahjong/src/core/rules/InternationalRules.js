// -*- coding: utf-8 -*-

import { Tile, TileType, BAD_TILE } from '../models/Tile.js';
import { Meld, MeldType } from '../models/Meld.js';
import { ScoreResult, ScoreItem } from '../models/ScoreResult.js';
import { RuleSetStrategy } from './RuleSetStrategy.js';

/**
 * Rule definition internal descriptor.
 */
class RuleDef {
    constructor(args) {
        this.indx = args.shift();
        this.score = args.shift();
        this.computeCB = args.shift();
        this.key = args.shift(); // Translation resource key
        this.special = false;
        this.normal = true;

        if (args.length > 0 && typeof args[0] === 'boolean') {
            this.special = args.shift();
            this.normal = args.shift();
        }

        this.implies = [];
        while (args.length > 0) {
            this.implies.push(args.shift());
        }
    }
}

/**
 * Knitted data helper function.
 */
function computeKnittedData(hand, count) {
    if (hand._isNormal) return { knitMatch: 0 };

    const matchMelds = function(left) {
        const c = left.slice();
        for (let i = 0; i < c.length; i++) {
            const suit = Math.floor(i / 8);
            const num = i - 8 * suit;
            switch (c[i]) {
                case 1:
                    if (suit > 3 || num > 7 || c[i + 1] === 0 || c[i + 2] === 0) {
                        return -999;
                    }
                    c[i + 1]--;
                    c[i + 2]--;
                    for (let j = i + 1; j < c.length; j++) {
                        if (c[j] === 2) return MeldType.CHOW;
                    }
                    return -999;
                case 2:
                    for (let j = i + 1; j < c.length; j++) {
                        if (c[j] === 3) return MeldType.PUNG;
                        const suitj = Math.floor(j / 8);
                        const numj = j - 8 * suitj;
                        if (suitj <= 3 && numj <= 7 && c[j] === 1 && c[j + 1] === 1 && c[j + 2] === 1) {
                            return MeldType.CHOW;
                        }
                    }
                    return -999;
                case 3:
                    if (suit <= 3 && num <= 7 && c[i + 1] === 1 && c[i + 2] === 1) {
                        return MeldType.CHOW;
                    }
                    for (let j = i + 1; j < c.length; j++) {
                        if (c[j] === 2) return MeldType.PUNG;
                    }
                    return -999;
                case 4:
                    return -999;
            }
        }
        return -999;
    };

    let nbHonors = 0;
    for (let i = 0; i < 7; i++) {
        if (count[TileType.DRAGON.offset + i] === 1) {
            nbHonors++;
        } else if (count[TileType.DRAGON.offset + i] > 1) {
            nbHonors = 0;
            break;
        }
    }

    const offsets = [TileType.BAMBOO.offset, TileType.DOT.offset, TileType.CHARACTER.offset];
    const perm = [
        [0, 1, 2], [0, 2, 1],
        [1, 0, 2], [1, 2, 0],
        [2, 0, 1], [2, 1, 0]
    ];
    const knitted = [
        [0, 0], [0, 3], [0, 6],
        [1, 1], [1, 4], [1, 7],
        [2, 2], [2, 5], [2, 8]
    ];

    for (let i = 0; i < perm.length; i++) {
        let knitMatch = 0;
        const p = perm[i];
        const left = count.slice();
        for (let j = 0; j < knitted.length; j++) {
            const i0 = knitted[j][0];
            const i1 = knitted[j][1];
            if (left[offsets[p[i0]] + i1] > 0) {
                left[offsets[p[i0]] + i1]--;
                knitMatch++;
            }
        }

        if (knitMatch + nbHonors === 14) {
            return { tiles: left, knitMatch, honors: true };
        }
        if (knitMatch === 9) {
            const what = matchMelds(left);
            if (what >= 0) {
                return { tiles: left, knitMatch, honors: false, what };
            }
        }
    }
    return { knitMatch: 0 };
}

function concealedPungs(hand) {
    if (!hand._isNormal) return 0;
    let pungs = 0;
    let kong = 0;
    for (let i = 0; i < 4; i++) {
        if (hand._melds[i]._isConcealed) {
            if (hand._melds[i]._type === MeldType.PUNG) pungs++;
            else if (hand._melds[i]._type === MeldType.KONG) kong++;
        }
    }
    if (pungs === 0 && kong < 3) return 0;
    return pungs + kong;
}

/**
 * Chinese Official Mahjong Competition Rules (MCR / International).
 */
export class InternationalRules extends RuleSetStrategy {
    constructor() {
        super();
        this._initRules();
    }

    get id() { return 'mcr'; }
    get name() { return 'RULESET_INTERNATIONAL'; }

    _initRules() {
        const HR = InternationalRules;
        this.rules = [
            // Calculated last, but placed first in legacy array order
            new RuleDef([13, 1, HR.flowerTiles, 'FLOWER_TILES', true, true]),
            new RuleDef([39, 8, HR.chickenHand, 'CHICKEN_HAND']),

            new RuleDef([ 1, 1, HR.pureDoubleChow, 'PURE_DOUBLE_CHOW']),
            new RuleDef([ 2, 1, HR.mixedDoubleChow, 'MIXED_DOUBLE_CHOW']),
            new RuleDef([ 3, 1, HR.shortStraight, 'SHORT_STRAIGHT']),
            new RuleDef([ 4, 1, HR.twoTerminalChows, 'TWO_TERMINAL_CHOWS']),
            new RuleDef([ 5, 1, HR.pungOfTerminalsOrHonors, 'PUNG_OF_TERMINALS_OR_HONORS']),
            new RuleDef([ 6, 1, HR.meldedKong, 'MELDED_KONG']),
            new RuleDef([ 7, 1, HR.oneVoidedSuit, 'ONE_VOIDED_SUIT', true, true]),
            new RuleDef([ 8, 1, HR.noHonors, 'NO_HONORS', true, true]),
            new RuleDef([ 9, 1, HR.edgeWait, 'EDGE_WAIT']),
            new RuleDef([10, 1, HR.closedWait, 'CLOSED_WAIT']),
            new RuleDef([11, 1, HR.singleWait, 'SINGLE_WAIT']),
            new RuleDef([12, 1, HR.selfDrawn, 'SELF-DRAWN', true, true]),

            new RuleDef([14, 2, HR.dragonPung, 'DRAGON_PUNG']),
            new RuleDef([15, 2, HR.prevalentWind, 'PREVALENT_WIND']),
            new RuleDef([16, 2, HR.seatWind, 'SEAT_WIND']),
            new RuleDef([17, 2, HR.concealedHand, 'CONCEALED_HAND']),
            new RuleDef([18, 2, HR.allChows, 'ALL_CHOWS', true, true, 8]),
            new RuleDef([19, 2, HR.tileHog, 'TILE_HOG', true, true]),
            new RuleDef([20, 2, HR.doublePung, 'DOUBLE_PUNG']),
            new RuleDef([21, 2, HR.twoConcealedPungs, 'TWO_CONCEALED_PUNGS']),
            new RuleDef([22, 2, HR.concealedKong, 'CONCEALED_KONG']),
            new RuleDef([23, 2, HR.allSimples, 'ALL_SIMPLES', true, true, 8]),

            new RuleDef([24, 4, HR.outsideHand, 'OUTSIDE_HAND']),
            new RuleDef([25, 4, HR.fullyConcealedHand, 'FULLY_CONCEALED_HAND', true, true, 12]),
            new RuleDef([26, 4, HR.twoMeldedKongs, 'TWO_MELDED_KONGS']),
            new RuleDef([27, 4, HR.lastTile, 'LAST_TILE']),

            new RuleDef([28, 6, HR.allPungs, 'ALL_PUNGS']),
            new RuleDef([29, 6, HR.halfFlush, 'HALF_FLUSH', true, true, 7]),
            new RuleDef([30, 6, HR.mixedShiftedChows, 'MIXED_SHIFTED_CHOWS']),
            new RuleDef([31, 6, HR.allTypes, 'ALL_TYPES', true, true]),
            new RuleDef([32, 6, HR.meldedHand, 'MELDED_HAND', 11]),
            new RuleDef([33, 6, HR.twoDragons, 'TWO_DRAGONS']),
            new RuleDef([34, 6, HR.oneMeldedAndOneConcealedKong, 'ONE_MELDED_AND_ONE_CONCEALED_KONG', 22]),

            new RuleDef([35, 8, HR.mixedStraight, 'MIXED_STRAIGHT']),
            new RuleDef([36, 8, HR.reversibleTiles, 'REVERSIBLE_TILES', true, true, 7]),
            new RuleDef([37, 8, HR.mixedTripleChow, 'MIXED_TRIPLE_CHOW', 2]),
            new RuleDef([38, 8, HR.mixedShiftedPungs, 'MIXED_SHIFTED_PUNGS']),
            new RuleDef([40, 8, HR.lastTileDraw, 'LAST_TILE_DRAW', 12]),
            new RuleDef([41, 8, HR.lastTileClaim, 'LAST_TILE_CLAIM']),
            new RuleDef([42, 8, HR.outWithReplacementTile, 'OUT_WITH_REPLACEMENT_TILE']),
            new RuleDef([43, 8, HR.twoConcealedKongs, 'TWO_CONCEALED_KONGS']),
            new RuleDef([44, 8, HR.robbingTheKong, 'ROBBING_THE_KONG']),

            new RuleDef([45, 12, HR.lesserHonorsAndKnittedTiles, 'LESSER_HONORS_AND_KNITTED_TILES', true, false, 31]),
            new RuleDef([46, 12, HR.knittedStraight, 'KNITTED_STRAIGHT', true, false]),
            new RuleDef([47, 12, HR.upperFour, 'UPPER_FOUR', true, true, 8]),
            new RuleDef([48, 12, HR.lowerFour, 'LOWER_FOUR', true, true, 8]),
            new RuleDef([49, 12, HR.bigThreeWinds, 'BIG_THREE_WINDS']),

            new RuleDef([50, 16, HR.pureStraight, 'PURE_STRAIGHT', 3, 4]),
            new RuleDef([51, 16, HR.threeSuitedTerminalChows, 'THREE-SUITED_TERMINAL_CHOWS', 2, 4, 8, 18]),
            new RuleDef([52, 16, HR.pureShiftedChows, 'PURE_SHIFTED_CHOWS']),
            new RuleDef([53, 16, HR.allFives, 'ALL_FIVES', 8, 23]),
            new RuleDef([54, 16, HR.triplePung, 'TRIPLE_PUNG', 20]),
            new RuleDef([55, 16, HR.threeConcealedPungs, 'THREE_CONCEALED_PUNGS']),

            new RuleDef([56, 24, HR.sevenPairs, 'SEVEN_PAIRS', true, false]),
            new RuleDef([57, 24, HR.greaterHonorsAndKnittedTiles, 'GREATER_HONORS_AND_KNITTED_TILES', true, false, 31, 45]),
            new RuleDef([58, 24, HR.allEven, 'ALL_EVEN', true, true, 8, 23, 28]),
            new RuleDef([59, 24, HR.fullFlush, 'FULL_FLUSH', true, true, 7, 8, 29]),
            new RuleDef([60, 24, HR.pureTripleChow, 'PURE_TRIPLE_CHOW', 1]),
            new RuleDef([61, 24, HR.pureShiftedPungs, 'PURE_SHIFTED_PUNGS']),
            new RuleDef([62, 24, HR.upperTiles, 'UPPER_TILES', 8, 47]),
            new RuleDef([63, 24, HR.middleTiles, 'MIDDLE_TILES', 8, 23]),
            new RuleDef([64, 24, HR.lowerTiles, 'LOWER_TILES', 8, 48]),

            new RuleDef([65, 32, HR.fourShiftedChows, 'FOUR_SHIFTED_CHOWS', 52]),
            new RuleDef([66, 32, HR.threeKongs, 'THREE_KONGS']),
            new RuleDef([67, 32, HR.allTerminalsAndHonors, 'ALL_TERMINALS_AND_HONORS', true, true, 5, 24, 28]),

            new RuleDef([68, 48, HR.quadrupleChow, 'PURE_QUADRUPLE_CHOW', 1, 7, 19, 60]),
            new RuleDef([69, 48, HR.fourPureShiftedPungs, 'FOUR_PURE_SHIFTED_PUNGS', 28, 61]),

            new RuleDef([70, 64, HR.allTerminals, 'ALL_TERMINALS', true, true, 5, 8, 24, 28, 67]),
            new RuleDef([71, 64, HR.littleFourWinds, 'LITTLE_FOUR_WINDS', 49]),
            new RuleDef([72, 64, HR.littleThreeDragons, 'LITTLE_THREE_DRAGONS', 7, 33]),
            new RuleDef([73, 64, HR.allHonors, 'ALL_HONORS', true, true, 5, 7, 24, 28, 67]),
            new RuleDef([74, 64, HR.fourConcealedPungs, 'FOUR_CONCEALED_PUNGS', 28]),
            new RuleDef([75, 64, HR.pureTerminalChows, 'PURE_TERMINAL_CHOWS', 1, 7, 8, 18, 29, 59]),

            new RuleDef([76, 88, HR.bigFourWinds, 'BIG_FOUR_WINDS', 5, 7, 15, 16, 28, 49]),
            new RuleDef([77, 88, HR.bigThreeDragons, 'BIG_THREE_DRAGONS', 7, 14, 33]),
            new RuleDef([78, 88, HR.allGreen, 'ALL_GREEN', true, true, 7, 29]),
            new RuleDef([79, 88, HR.nineGates, 'NINE_GATES', true, false, 5, 17, 50]),
            new RuleDef([80, 88, HR.fourKongs, 'FOUR_KONGS', 28]),
            new RuleDef([81, 88, HR.sevenShiftedPairs, 'SEVEN_SHIFTED_PAIRS', true, false, 11, 17, 50]),
            new RuleDef([82, 88, HR.thirteenOrphans, 'THIRTEEN_ORPHANS', true, false, 31, 67])
        ];

        this.ruleMap = new Map();
        for (const r of this.rules) {
            this.ruleMap.set(r.indx, r);
        }
    }

    /**
     * Compute scoring for the hand.
     * @param {Hand} handIn
     * @returns {ScoreResult}
     */
    compute(handIn) {
        const res = new ScoreResult();
        const hand = handIn.sortedHand();
        hand.fixConcealed();

        const rules = this.rules;
        const active = new Array(rules.length);
        const impliedBy = new Map(); // childIndx -> parentRule

        for (let i = 0; i < rules.length; i++) {
            active[i] = hand._isNormal ? rules[i].normal : rules[i].special;
            res.matched[rules[i].indx] = false;
        }

        const data = {
            count: hand.countTiles(),
            suits: hand.suits(),
            kongs: hand.kongs(),
            flowers: hand.flowers(),
            nbConcealedPungs: concealedPungs(hand)
        };
        data.knittedData = computeKnittedData(hand, data.count);

        // Try rules from highest points to lowest
        for (let ruleId = rules.length - 1; ruleId >= 0; ruleId--) {
            const rule = rules[ruleId];

            if (!active[ruleId]) {
                // If it was deactivated because it is implied by a higher rule, check if it would match
                // so we can display it marked as 0 points [Implied from rule XXX]
                if (impliedBy.has(rule.indx)) {
                    const wouldMatch = rule.computeCB(hand, data, res);
                    if (wouldMatch > 0) {
                        const parent = impliedBy.get(rule.indx);
                        const attribution = InternationalRules.getAttribution(rule.indx, hand, data);
                        res.addItem(new ScoreItem({
                            ruleId: rule.indx,
                            name: rule.key,
                            points: rule.score,
                            count: wouldMatch,
                            isImplied: true,
                            impliedBy: `${parent.indx}: ${parent.key}`,
                            meldIndices: attribution.meldIndices,
                            tileIndices: attribution.tileIndices
                        }));
                        res.desc.push(`0 points: Rule ${rule.indx}: ${rule.key} [Implied from rule ${parent.indx}]`);
                    }
                }
                continue;
            }

            const matching = rule.computeCB(hand, data, res);

            if (matching > 0) {
                const thisScore = matching * rule.score;
                const attribution = InternationalRules.getAttribution(rule.indx, hand, data);

                res.addItem(new ScoreItem({
                    ruleId: rule.indx,
                    name: rule.key,
                    points: rule.score,
                    count: matching,
                    isImplied: false,
                    meldIndices: attribution.meldIndices,
                    tileIndices: attribution.tileIndices
                }));

                res.desc.push(`${thisScore} points: ${matching}x Rule ${rule.indx}: ${rule.key}`);

                // Mark implied rules as inactive and record parent
                for (let i = 0; i < ruleId; i++) {
                    if (rule.implies.includes(rules[i].indx)) {
                        active[i] = false;
                        impliedBy.set(rules[i].indx, rule);
                    }
                }
            }
        }

        if (res.nbPoints === 0) {
            res.desc = ['NO_VALID_HAND'];
        }

        if (hand._lastTile < 0) {
            res.warnings.push('LAST_TILE_NOT_SET');
            res.desc.push('LAST_TILE_NOT_SET');
        }

        return res;
    }

    /**
     * Determine which melds/tiles in the hand contributed to this rule
     * for interactive visual combination highlighting.
     */
    static getAttribution(ruleIndx, hand, data) {
        const meldIndices = [];
        const tileIndices = [];

        if (!hand._isNormal) {
            for (let i = 0; i < 14; i++) {
                if (hand._tiles[i].isValid()) tileIndices.push(i);
            }
            return { meldIndices, tileIndices };
        }

        switch (ruleIndx) {
            case 1: // Pure double chow
            case 2: // Mixed double chow
            case 3: // Short straight
                for (let i = 0; i < 4; i++) {
                    if (hand._melds[i]._type === MeldType.CHOW) meldIndices.push(i);
                }
                break;
            case 14: // Dragon pung
                for (let i = 0; i < 4; i++) {
                    if (hand._melds[i]._firstTile._type === TileType.DRAGON) meldIndices.push(i);
                }
                break;
            case 15: // Prevalent wind
                for (let i = 0; i < 4; i++) {
                    if (hand._melds[i]._firstTile._tileId === hand._tableWind._tileId) meldIndices.push(i);
                }
                break;
            case 16: // Seat wind
                for (let i = 0; i < 4; i++) {
                    if (hand._melds[i]._firstTile._tileId === hand._playerWind._tileId) meldIndices.push(i);
                }
                break;
            case 9: case 10: case 11: // Waits
                if (hand._lastTile >= 0) {
                    const m = Math.floor(hand._lastTile / 3);
                    meldIndices.push(m >= 4 ? 4 : m);
                }
                break;
            default:
                // Full hand combination
                for (let i = 0; i < 5; i++) {
                    if (hand._melds[i].isValid()) meldIndices.push(i);
                }
                break;
        }

        return { meldIndices, tileIndices };
    }

    // --- Static Rule Computation Methods ported from HandRules.js ---

    static pureDoubleChow(hand) {
        let res = 0;
        for (let i = 0; i < 3; i++) {
            if (hand._melds[i]._type !== MeldType.CHOW) break;
            if (hand._melds[i + 1]._type !== MeldType.CHOW) break;
            if (hand._melds[i]._firstTile._tileId === hand._melds[i + 1]._firstTile._tileId) {
                res++;
            }
        }
        return res;
    }

    static mixedDoubleChow(hand) {
        let res = 0;
        const used = [false, false, false, false];
        for (let i = 0; i < 3; i++) {
            if (used[i] || hand._melds[i]._type !== MeldType.CHOW) continue;
            for (let j = i + 1; j < 4; j++) {
                if (used[j] || hand._melds[j]._type !== MeldType.CHOW) continue;
                if (hand._melds[i]._firstTile._type === hand._melds[j]._firstTile._type) continue;
                if (hand._melds[i]._firstTile._num === hand._melds[j]._firstTile._num) {
                    res++;
                    used[i] = true;
                    used[j] = true;
                }
            }
        }
        return res;
    }

    static shortStraight(hand) {
        let res = 0;
        for (let i = 0; i < 3; i++) {
            if (hand._melds[i]._type !== MeldType.CHOW || hand._melds[i]._firstTile._num > 4) continue;
            for (let j = i + 1; j < 4; j++) {
                if (hand._melds[j]._type === MeldType.CHOW &&
                    hand._melds[i]._firstTile._num + 3 === hand._melds[j]._firstTile._num &&
                    hand._melds[i]._firstTile._type === hand._melds[j]._firstTile._type) {
                    res++;
                }
            }
        }
        return res;
    }

    static twoTerminalChows(hand, data, rulesRes) {
        let res = 0;
        const used = [false, false, false, false];
        for (let i = 0; i < 3; i++) {
            if (used[i]) continue;
            if (hand._melds[i]._type !== MeldType.CHOW || hand._melds[i]._firstTile._num !== 1) continue;
            for (let j = i + 1; j < 4; j++) {
                if (used[j]) continue;
                if (hand._melds[j]._type === MeldType.CHOW &&
                    hand._melds[j]._firstTile._type === hand._melds[i]._firstTile._type &&
                    hand._melds[j]._firstTile._num === 7) {
                    res++;
                    used[i] = true;
                    used[j] = true;
                }
            }
        }
        if (rulesRes.matched[51]) res -= 2;
        return res;
    }

    static pungOfTerminalsOrHonors(hand, data, rulesRes) {
        let res = 0;
        for (let i = 0; i < 4; i++) {
            if (hand._melds[i]._type === MeldType.CHOW) continue;
            if (hand._melds[i]._firstTile.isTerminal()) {
                res++;
            }
            if (rulesRes.matched[49] || rulesRes.matched[71]) continue;
            if (hand._melds[i]._firstTile._type === TileType.WIND &&
                hand._melds[i]._firstTile._num !== hand._tableWind._num &&
                hand._melds[i]._firstTile._num !== hand._playerWind._num) {
                res++;
            }
        }
        return res;
    }

    static meldedKong(hand, data) {
        if (data.kongs.concealed === 0 && data.kongs.melded === 1) return 1;
        return 0;
    }

    static oneVoidedSuit(hand, data) {
        if (!(data.suits[0] && data.suits[1] && data.suits[2])) return 1;
        return 0;
    }

    static noHonors(hand, data) {
        if (!(data.suits[3] || data.suits[4])) return 1;
        return 0;
    }

    static edgeWait(hand) {
        if (hand._lastTile < 0) return 0;
        const meld = Math.floor(hand._lastTile / 3);
        const pos = hand._lastTile - meld * 3;
        if (meld >= 4 || hand._melds[meld]._type !== MeldType.CHOW) return 0;

        let lookFor = 0;
        if (pos === 2 && hand._melds[meld]._firstTile._num === 1) lookFor = 2;
        if (pos === 0 && hand._melds[meld]._firstTile._num === 7) lookFor = -2;

        if (lookFor !== 0) {
            lookFor += hand._melds[meld]._firstTile._tileId;
            let res = 1;
            for (let i = 0; i < 4; i++) {
                if (hand._melds[i]._type === MeldType.CHOW &&
                    hand._melds[i]._isConcealed &&
                    hand._melds[i]._firstTile._tileId === lookFor) {
                    res = 0;
                    break;
                }
            }
            return res;
        }
        return 0;
    }

    static closedWait(hand) {
        if (hand._lastTile < 0) return 0;
        const meld = Math.floor(hand._lastTile / 3);
        const pos = hand._lastTile - meld * 3;
        if (meld < 4 && pos === 1 && hand._melds[meld]._type === MeldType.CHOW) {
            const pair = hand._melds[4]._firstTile._tileId;
            if (hand._melds[meld]._firstTile._tileId === pair ||
                hand._melds[meld]._firstTile._tileId + 2 === pair) {
                return 0;
            }
            return 1;
        }
        return 0;
    }

    static singleWait(hand) {
        if (hand._lastTile >= 3 * 4) {
            let res = 1;
            if (hand._melds[4]._firstTile.isRegular()) {
                const pairType = hand._melds[4]._firstTile._type;
                const pairNum = hand._melds[4]._firstTile._num;

                for (let i = 0; i < 4; i++) {
                    if (!hand._melds[i]._isConcealed) continue;
                    if (hand._melds[i]._type === MeldType.CHOW &&
                        hand._melds[i]._firstTile._type === pairType) {
                        const firstTile = hand._melds[i]._firstTile._num;
                        if (firstTile === pairNum + 1 ||
                            firstTile + 3 === pairNum ||
                            firstTile === pairNum ||
                            firstTile + 2 === pairNum) {
                            res = 0;
                            break;
                        }
                    }
                    if (hand._melds[i]._type === MeldType.PUNG &&
                        hand._melds[i]._firstTile._type === pairType &&
                        (hand._melds[i]._firstTile._num === pairNum + 1 ||
                         hand._melds[i]._firstTile._num === pairNum - 1)) {
                        res = 0;
                        break;
                    }
                }
            }
            return res;
        }
        return 0;
    }

    static selfDrawn(hand) {
        return hand._selfDrawn ? 1 : 0;
    }

    static flowerTiles(hand, data, rulesRes) {
        if (rulesRes.nbPoints < 8) return 0;
        return hand.flowers();
    }

    static dragonPung(hand) {
        return hand.dragons() === 1 ? 1 : 0;
    }

    static prevalentWind(hand) {
        for (let i = 0; i < 4; i++) {
            if (hand._melds[i]._firstTile._tileId === hand._tableWind._tileId) {
                return 1;
            }
        }
        return 0;
    }

    static seatWind(hand) {
        for (let i = 0; i < 4; i++) {
            if (hand._melds[i]._firstTile._tileId === hand._playerWind._tileId) {
                return 1;
            }
        }
        return 0;
    }

    static concealedHand(hand) {
        if (!hand._selfDrawn) {
            let target = 3;
            if (hand._lastTile >= 12) target = 4;
            if (hand.concealed() === target) return 1;
        }
        return 0;
    }

    static allChows(hand, data) {
        if (hand._isNormal) {
            if (hand.chows() === 4) {
                const type = hand._melds[4]._firstTile._type;
                if (type !== TileType.DRAGON && type !== TileType.WIND) {
                    return 1;
                }
            }
        } else if (data.knittedData.knitMatch > 0 && !data.knittedData.honors &&
                   data.knittedData.what === MeldType.CHOW) {
            for (let i = 0; i < 7; i++) {
                if (data.count[TileType.DRAGON.offset + i] > 0) return 0;
            }
            return 1;
        }
        return 0;
    }

    static tileHog(hand, data) {
        let res = 0;
        for (let i = 0; i < Tile._kNumberDifferentTiles; i++) {
            if (data.count[i] === 4) res++;
        }
        if (hand._isNormal) {
            for (let i = 0; i < 5; i++) {
                if (hand._melds[i]._type === MeldType.KONG) res--;
            }
        }
        return res;
    }

    static doublePung(hand) {
        let res = 0;
        for (let i = 0; i < 3; i++) {
            if (hand._melds[i]._type === MeldType.CHOW || hand._melds[i]._firstTile.isHonor()) continue;
            for (let j = i + 1; j < 4; j++) {
                if (hand._melds[j]._type === MeldType.CHOW || hand._melds[j]._firstTile.isHonor()) continue;
                if (hand._melds[i]._firstTile._num === hand._melds[j]._firstTile._num) {
                    res++;
                }
            }
        }
        return res;
    }

    static twoConcealedPungs(hand, data) {
        return data.nbConcealedPungs === 2 ? 1 : 0;
    }

    static concealedKong(hand, data) {
        return data.kongs.concealed === 1 ? 1 : 0;
    }

    static allSimples(hand, data) {
        if (!(data.suits[3] || data.suits[4])) {
            if ((data.count[0] + data.count[8] +
                 data.count[9] + data.count[9 + 8] +
                 data.count[18] + data.count[18 + 8]) === 0) {
                return 1;
            }
        }
        return 0;
    }

    static outsideHand(hand) {
        for (let i = 0; i < 5; i++) {
            if (!(hand._melds[i].hasTerminal() || hand._melds[i].isHonor())) {
                return 0;
            }
        }
        return 1;
    }

    static fullyConcealedHand(hand) {
        if (hand._selfDrawn && (!hand._isNormal || hand.concealed() === 4)) {
            return 1;
        }
        return 0;
    }

    static twoMeldedKongs(hand, data) {
        return (data.kongs.concealed === 0 && data.kongs.melded === 2) ? 1 : 0;
    }

    static lastTile(hand) {
        return hand._lastExistingTile ? 1 : 0;
    }

    static allPungs(hand) {
        return hand.chows() === 0 ? 1 : 0;
    }

    static halfFlush(hand, data) {
        let num = 0;
        if (data.suits[0]) num++;
        if (data.suits[1]) num++;
        if (data.suits[2]) num++;
        return num === 1 ? 1 : 0;
    }

    static mixedShiftedChows(hand) {
        for (let i = 0; i < 4; i++) {
            if (hand._melds[i]._type !== MeldType.CHOW) continue;
            const ref = hand._melds[i]._firstTile;
            for (let j = 0; j < 4; j++) {
                if (hand._melds[j]._type !== MeldType.CHOW ||
                    ref._num + 1 !== hand._melds[j]._firstTile._num ||
                    ref._type === hand._melds[j]._firstTile._type) {
                    continue;
                }
                for (let k = 0; k < 4; k++) {
                    if (hand._melds[k]._type !== MeldType.CHOW ||
                        ref._num + 2 !== hand._melds[k]._firstTile._num ||
                        ref._type === hand._melds[k]._firstTile._type ||
                        hand._melds[j]._firstTile._type === hand._melds[k]._firstTile._type) {
                        continue;
                    }
                    return 1;
                }
            }
        }
        return 0;
    }

    static allTypes(hand, data) {
        return (data.suits[0] && data.suits[1] && data.suits[2] && data.suits[3] && data.suits[4]) ? 1 : 0;
    }

    static meldedHand(hand) {
        if (hand.concealed() === 0 && hand._lastTile >= 3 * 4 && !hand._selfDrawn) {
            return 1;
        }
        return 0;
    }

    static twoDragons(hand) {
        return hand.dragons() === 2 ? 1 : 0;
    }

    static oneMeldedAndOneConcealedKong(hand, data) {
        return (data.kongs.concealed === 1 && data.kongs.melded === 1) ? 1 : 0;
    }

    static mixedStraight(hand) {
        for (let i = 0; i < 4; i++) {
            if (hand._melds[i]._type !== MeldType.CHOW || hand._melds[i]._firstTile._num !== 1) continue;
            const t0 = hand._melds[i]._firstTile._type;
            for (let j = 0; j < 4; j++) {
                if (hand._melds[j]._type !== MeldType.CHOW ||
                    hand._melds[j]._firstTile._num !== 4 ||
                    hand._melds[j]._firstTile._type === t0) continue;
                const t1 = hand._melds[j]._firstTile._type;
                for (let k = 0; k < 4; k++) {
                    if (hand._melds[k]._type !== MeldType.CHOW ||
                        hand._melds[k]._firstTile._num !== 7 ||
                        hand._melds[k]._firstTile._type === t0 ||
                        hand._melds[k]._firstTile._type === t1) continue;
                    return 1;
                }
            }
        }
        return 0;
    }

    static reversibleTiles(hand, data) {
        const allowed = new Array(Tile._kNumberDifferentTiles).fill(false);
        let start = TileType.BAMBOO.offset - 1;
        allowed[start + 2] = true;
        allowed[start + 4] = true;
        allowed[start + 5] = true;
        allowed[start + 6] = true;
        allowed[start + 8] = true;
        allowed[start + 9] = true;
        start = TileType.DOT.offset - 1;
        allowed[start + 1] = true;
        allowed[start + 2] = true;
        allowed[start + 3] = true;
        allowed[start + 4] = true;
        allowed[start + 5] = true;
        allowed[start + 8] = true;
        allowed[start + 9] = true;
        start = TileType.DRAGON.offset - 1;
        allowed[start + 1] = true; // White dragon

        for (let i = 0; i < Tile._kNumberDifferentTiles; i++) {
            if (!allowed[i] && data.count[i] > 0) return 0;
        }
        return 1;
    }

    static mixedTripleChow(hand) {
        for (let i = 0; i < 2; i++) {
            if (hand._melds[i]._type !== MeldType.CHOW) continue;
            const num = hand._melds[i]._firstTile._num;
            const t0 = hand._melds[i]._firstTile._type;
            for (let j = i + 1; j < 3; j++) {
                if (hand._melds[j]._type !== MeldType.CHOW ||
                    hand._melds[j]._firstTile._num !== num ||
                    hand._melds[j]._firstTile._type === t0) continue;
                const t1 = hand._melds[j]._firstTile._type;
                for (let k = j + 1; k < 4; k++) {
                    if (hand._melds[k]._type !== MeldType.CHOW ||
                        hand._melds[k]._firstTile._num !== num ||
                        hand._melds[k]._firstTile._type === t0 ||
                        hand._melds[k]._firstTile._type === t1) continue;
                    return 1;
                }
            }
        }
        return 0;
    }

    static mixedShiftedPungs(hand) {
        for (let i = 0; i < 4; i++) {
            if (hand._melds[i]._type === MeldType.CHOW || hand._melds[i].isHonor()) continue;
            const num = hand._melds[i]._firstTile._num;
            const t0 = hand._melds[i]._firstTile._type;
            for (let j = 0; j < 4; j++) {
                if (hand._melds[j]._type === MeldType.CHOW ||
                    hand._melds[j].isHonor() ||
                    hand._melds[j]._firstTile._num !== num + 1 ||
                    hand._melds[j]._firstTile._type === t0) continue;
                const t1 = hand._melds[j]._firstTile._type;
                for (let k = 0; k < 4; k++) {
                    if (hand._melds[k]._type === MeldType.CHOW ||
                        hand._melds[k].isHonor() ||
                        hand._melds[k]._firstTile._num !== num + 2 ||
                        hand._melds[k]._firstTile._type === t0 ||
                        hand._melds[k]._firstTile._type === t1) continue;
                    return 1;
                }
            }
        }
        return 0;
    }

    static chickenHand(hand, data, rulesRes) {
        if (hand._isNormal && hand.isComplete() && rulesRes.nbPoints === 0) {
            return 1;
        }
        return 0;
    }

    static lastTileDraw(hand) {
        return (hand._lastTileDrawn && hand._selfDrawn) ? 1 : 0;
    }

    static lastTileClaim(hand) {
        return (hand._lastTileDrawn && !hand._selfDrawn) ? 1 : 0;
    }

    static outWithReplacementTile(hand) {
        return hand._replacementTile ? 1 : 0;
    }

    static twoConcealedKongs(hand, data) {
        return data.kongs.concealed === 2 ? 1 : 0;
    }

    static robbingTheKong(hand) {
        return hand._robbedKong ? 1 : 0;
    }

    static lesserHonorsAndKnittedTiles(hand, data) {
        return (data.knittedData.knitMatch > 0 && data.knittedData.honors) ? 1 : 0;
    }

    static knittedStraight(hand, data) {
        return data.knittedData.knitMatch === 9 ? 1 : 0;
    }

    static upperFour(hand) {
        return hand.minMax(6, 9) ? 1 : 0;
    }

    static lowerFour(hand) {
        return hand.minMax(1, 4) ? 1 : 0;
    }

    static bigThreeWinds(hand) {
        return hand.winds() === 3 ? 1 : 0;
    }

    static pureStraight(hand) {
        for (let i = 0; i < 2; i++) {
            if (hand._melds[i]._type !== MeldType.CHOW || hand._melds[i]._firstTile._num !== 1) continue;
            const t0 = hand._melds[i]._firstTile._type;
            for (let j = i + 1; j < 3; j++) {
                if (hand._melds[j]._type !== MeldType.CHOW ||
                    hand._melds[j]._firstTile._num !== 4 ||
                    hand._melds[j]._firstTile._type !== t0) continue;
                for (let k = j + 1; k < 4; k++) {
                    if (hand._melds[k]._type !== MeldType.CHOW ||
                        hand._melds[k]._firstTile._num !== 7 ||
                        hand._melds[k]._firstTile._type !== t0) continue;
                    return 1;
                }
            }
        }
        return 0;
    }

    static threeSuitedTerminalChows(hand, data) {
        if (hand.chows() !== 4) return 0;
        if (data.suits[3] || data.suits[4]) return 0;

        if (hand._melds[0]._firstTile._num === 1 &&
            hand._melds[1]._firstTile._num === 7 &&
            hand._melds[2]._firstTile._num === 1 &&
            hand._melds[3]._firstTile._num === 7 &&
            hand._melds[4]._firstTile._num === 5 &&
            hand._melds[1]._firstTile._type === hand._melds[0]._firstTile._type &&
            hand._melds[2]._firstTile._type === hand._melds[3]._firstTile._type &&
            hand._melds[2]._firstTile._type !== hand._melds[0]._firstTile._type &&
            hand._melds[4]._firstTile._type !== hand._melds[0]._firstTile._type &&
            hand._melds[4]._firstTile._type !== hand._melds[2]._firstTile._type) {
            return 1;
        }
        return 0;
    }

    static pureShiftedChows(hand) {
        for (let i = 0; i < 2; i++) {
            if (hand._melds[i]._type !== MeldType.CHOW) continue;
            const ref = hand._melds[i]._firstTile;
            for (let j = i + 1; j < 3; j++) {
                if (hand._melds[j]._type !== MeldType.CHOW ||
                    ref._tileId >= hand._melds[j]._firstTile._tileId ||
                    ref._tileId + 2 < hand._melds[j]._firstTile._tileId) continue;
                const delta = hand._melds[j]._firstTile._num - ref._num;
                if (delta < 1 || delta > 2) continue;

                for (let k = j + 1; k < 4; k++) {
                    if (hand._melds[k]._type !== MeldType.CHOW ||
                        ref._tileId + 2 * delta !== hand._melds[k]._firstTile._tileId) continue;
                    return 1;
                }
            }
        }
        return 0;
    }

    static allFives(hand) {
        for (let i = 0; i < 5; i++) {
            const t = hand._melds[i]._firstTile;
            if (!t.isRegular()) return 0;
            if (hand._melds[i]._type === MeldType.CHOW) {
                if (t._num < 3 || t._num > 5) return 0;
            } else {
                if (t._num !== 5) return 0;
            }
        }
        return 1;
    }

    static triplePung(hand) {
        for (let i = 0; i < 2; i++) {
            const ref = hand._melds[i]._firstTile;
            if (hand._melds[i]._type === MeldType.CHOW || ref.isHonor()) continue;
            for (let j = i + 1; j < 3; j++) {
                if (hand._melds[j]._type === MeldType.CHOW ||
                    hand._melds[j]._firstTile.isHonor() ||
                    ref._num !== hand._melds[j]._firstTile._num) continue;
                for (let k = j + 1; k < 4; k++) {
                    if (hand._melds[k]._type === MeldType.CHOW ||
                        hand._melds[k]._firstTile.isHonor() ||
                        ref._num !== hand._melds[k]._firstTile._num) continue;
                    return 1;
                }
            }
        }
        return 0;
    }

    static threeConcealedPungs(hand, data) {
        return data.nbConcealedPungs === 3 ? 1 : 0;
    }

    static sevenPairs(hand) {
        for (let i = 0; i < 14; i += 2) {
            if (hand._tiles[i]._tileId !== hand._tiles[i + 1]._tileId) return 0;
        }
        return 1;
    }

    static greaterHonorsAndKnittedTiles(hand, data) {
        return data.knittedData.knitMatch === 7 ? 1 : 0;
    }

    static allEven(hand, data) {
        if (data.suits[3] || data.suits[4]) return 0;
        for (let i = 1; i <= 9; i += 2) {
            if (data.count[TileType.BAMBOO.offset - 1 + i] > 0 ||
                data.count[TileType.DOT.offset - 1 + i] > 0 ||
                data.count[TileType.CHARACTER.offset - 1 + i] > 0) {
                return 0;
            }
        }
        return 1;
    }

    static fullFlush(hand, data) {
        if (data.suits[3] || data.suits[4]) return 0;
        let nb = 0;
        if (data.suits[0]) nb++;
        if (data.suits[1]) nb++;
        if (data.suits[2]) nb++;
        return nb === 1 ? 1 : 0;
    }

    static pureTripleChow(hand) {
        for (let i = 0; i < 2; i++) {
            if (hand._melds[i]._type !== MeldType.CHOW ||
                hand._melds[i + 1]._type !== MeldType.CHOW ||
                hand._melds[i + 2]._type !== MeldType.CHOW ||
                hand._melds[i]._firstTile._tileId !== hand._melds[i + 1]._firstTile._tileId ||
                hand._melds[i]._firstTile._tileId !== hand._melds[i + 2]._firstTile._tileId) {
                continue;
            }
            return 1;
        }
        return 0;
    }

    static pureShiftedPungs(hand) {
        for (let i = 0; i < 2; i++) {
            if (hand._melds[i]._type === MeldType.CHOW ||
                hand._melds[i + 1]._type === MeldType.CHOW ||
                hand._melds[i + 2]._type === MeldType.CHOW ||
                !hand._melds[i]._firstTile.isRegular() ||
                hand._melds[i]._firstTile._num >= 8 ||
                hand._melds[i]._firstTile._tileId + 1 !== hand._melds[i + 1]._firstTile._tileId ||
                hand._melds[i]._firstTile._tileId + 2 !== hand._melds[i + 2]._firstTile._tileId) {
                continue;
            }
            return 1;
        }
        return 0;
    }

    static upperTiles(hand) {
        return hand.minMax(7, 9) ? 1 : 0;
    }

    static middleTiles(hand) {
        return hand.minMax(4, 6) ? 1 : 0;
    }

    static lowerTiles(hand) {
        return hand.minMax(1, 3) ? 1 : 0;
    }

    static fourShiftedChows(hand) {
        if (hand.chows() < 4 ||
            !hand._melds[0]._firstTile.isRegular() ||
            hand._melds[0]._firstTile._type !== hand._melds[3]._firstTile._type) {
            return 0;
        }
        const tileId = hand._melds[0]._firstTile._tileId;
        const delta = hand._melds[1]._firstTile._tileId - tileId;
        if (delta < 1 || delta > 2) return 0;

        if (hand._melds[2]._firstTile._tileId === tileId + 2 * delta &&
            hand._melds[3]._firstTile._tileId === tileId + 3 * delta) {
            return 1;
        }
        return 0;
    }

    static threeKongs(hand, data) {
        return (data.kongs.concealed + data.kongs.melded === 3) ? 1 : 0;
    }

    static allTerminalsAndHonors(hand, data) {
        for (let i = 2; i <= 8; i++) {
            if (data.count[i - 1] + data.count[9 + i - 1] + data.count[18 + i - 1] > 0) {
                return 0;
            }
        }
        return 1;
    }

    static quadrupleChow(hand) {
        if (hand.chows() < 4) return 0;
        const tileId = hand._melds[0]._firstTile._tileId;
        if (hand._melds[1]._firstTile._tileId === tileId &&
            hand._melds[2]._firstTile._tileId === tileId &&
            hand._melds[3]._firstTile._tileId === tileId) {
            return 1;
        }
        return 0;
    }

    static fourPureShiftedPungs(hand) {
        if (hand.chows() > 0 ||
            !hand._melds[0]._firstTile.isRegular() ||
            hand._melds[0]._firstTile._num >= 7) {
            return 0;
        }
        const tileId = hand._melds[0]._firstTile._tileId;
        if (hand._melds[1]._firstTile._tileId === tileId + 1 &&
            hand._melds[2]._firstTile._tileId === tileId + 2 &&
            hand._melds[3]._firstTile._tileId === tileId + 3) {
            return 1;
        }
        return 0;
    }

    static allTerminals(hand, data) {
        if (data.suits[3] || data.suits[4]) return 0;
        for (let i = 2; i <= 8; i++) {
            if (data.count[i - 1] + data.count[9 + i - 1] + data.count[18 + i - 1] > 0) {
                return 0;
            }
        }
        return 1;
    }

    static littleFourWinds(hand) {
        return (hand.winds() === 3 && hand._melds[4]._firstTile._type === TileType.WIND) ? 1 : 0;
    }

    static littleThreeDragons(hand) {
        return (hand.dragons() === 2 && hand._melds[4]._firstTile._type === TileType.DRAGON) ? 1 : 0;
    }

    static allHonors(hand, data) {
        return !(data.suits[0] || data.suits[1] || data.suits[2]) ? 1 : 0;
    }

    static fourConcealedPungs(hand, data) {
        return data.nbConcealedPungs === 4 ? 1 : 0;
    }

    static pureTerminalChows(hand) {
        if (hand.chows() === 4 && hand._melds[0]._firstTile._num === 1) {
            const tileId = hand._melds[0]._firstTile._tileId;
            if (hand._melds[1]._firstTile._tileId === tileId &&
                hand._melds[2]._firstTile._tileId === tileId + 6 &&
                hand._melds[3]._firstTile._tileId === tileId + 6 &&
                hand._melds[4]._firstTile._tileId === tileId + 4) {
                return 1;
            }
        }
        return 0;
    }

    static bigFourWinds(hand) {
        return hand.winds() === 4 ? 1 : 0;
    }

    static bigThreeDragons(hand) {
        return hand.dragons() === 3 ? 1 : 0;
    }

    static allGreen(hand, data) {
        let nbTiles = data.count[TileType.DRAGON.offset + 1];
        nbTiles += data.count[TileType.BAMBOO.offset - 1 + 2];
        nbTiles += data.count[TileType.BAMBOO.offset - 1 + 3];
        nbTiles += data.count[TileType.BAMBOO.offset - 1 + 4];
        nbTiles += data.count[TileType.BAMBOO.offset - 1 + 6];
        nbTiles += data.count[TileType.BAMBOO.offset - 1 + 8];
        const target = 14 + data.kongs.concealed + data.kongs.melded;
        return nbTiles === target ? 1 : 0;
    }

    static nineGates(hand) {
        if (hand._isNormal) return 0;

        const counts = hand.countTiles();
        const offsets = [
            TileType.BAMBOO.offset,
            TileType.CHARACTER.offset,
            TileType.DOT.offset
        ];
        return offsets.some(offset =>
            counts[offset] >= 3 &&
            counts[offset + 8] >= 3 &&
            counts.slice(offset + 1, offset + 8).every(count => count >= 1) &&
            counts.reduce((total, count, index) =>
                total + (index >= offset && index <= offset + 8 ? count : 0), 0) === 14
        ) ? 1 : 0;
    }

    static fourKongs(hand, data) {
        return (data.kongs.concealed + data.kongs.melded === 4) ? 1 : 0;
    }

    static sevenShiftedPairs(hand) {
        if (hand._isNormal) return 0;

        const counts = hand.countTiles();
        const offsets = [
            TileType.BAMBOO.offset,
            TileType.CHARACTER.offset,
            TileType.DOT.offset
        ];
        return offsets.some(offset =>
            [0, 1, 2].some(start =>
                counts.slice(offset + start, offset + start + 7).every(count => count === 2) &&
                counts.every((count, index) =>
                    index >= offset + start && index < offset + start + 7
                        ? count === 2
                        : count === 0
                )
            )
        ) ? 1 : 0;
    }

    static thirteenOrphans(hand, data) {
        const lookFor = [
            0, 8, 9, 9 + 8, 18, 18 + 8,
            27, 28, 29,
            30, 31, 32, 33
        ];
        let nbOne = 0;
        let nbTwo = 0;
        for (let i = 0; i < 13; i++) {
            if (data.count[lookFor[i]] === 1) nbOne++;
            if (data.count[lookFor[i]] === 2) nbTwo++;
        }
        return (nbOne === 12 && nbTwo === 1) ? 1 : 0;
    }
}
