// -*- coding: utf-8 -*-

import { Tile, TileType, BAD_TILE } from '../models/Tile.js';
import { Meld, MeldType } from '../models/Meld.js';
import { ScoreResult, ScoreItem } from '../models/ScoreResult.js';
import { RuleSetStrategy } from './RuleSetStrategy.js';
import { InternationalRules } from './InternationalRules.js';

export class RiichiRules extends RuleSetStrategy {
    constructor() {
        super();
    }

    get id() { return 'riichi'; }
    get name() { return 'RULESET_RIICHI'; }

    static isConcealedHand(hand) {
        return !hand._isNormal ||
               (InternationalRules.concealedHand(hand) > 0) ||
               (InternationalRules.fullyConcealedHand(hand) > 0);
    }

    compute(handIn) {
        const res = new ScoreResult();
        const hand = handIn.sortedHand();
        hand.fixConcealed();

        const isConcealed = RiichiRules.isConcealedHand(hand);
        const data = {
            count: hand.countTiles(),
            suits: hand.suits(),
            kongs: hand.kongs(),
            flowers: hand.flowers(),
            nbConcealedPungs: hand.isNormal
                ? hand.melds.slice(0, 4).filter(meld =>
                    meld.isValid() &&
                    meld.isConcealed &&
                    meld.type !== MeldType.CHOW
                ).length
                : 0
        };

        let yaku = 0;
        const yakuList = [];

        // 1. Tanyao (All Simples) - 1 Han
        if (isConcealed && InternationalRules.allSimples(hand, data)) {
            yaku += 1;
            yakuList.push({ name: 'TANYAO_CHUU', han: 1 });
        }

        // 2. Pinfu (All Chows) - 1 Han
        if (isConcealed && hand.chows() === 4) {
            const pairType = hand._melds[4]._firstTile._type;
            const pairTileId = hand._melds[4]._firstTile._tileId;
            const winningMeld = Math.floor(hand._lastTile / 3);
            const winningPosition = hand._lastTile - winningMeld * 3;
            const winningChow = winningMeld < 4 ? hand._melds[winningMeld] : null;
            if (pairType !== TileType.DRAGON &&
                pairTileId !== hand._tableWind._tileId &&
                pairTileId !== hand._playerWind._tileId &&
                winningChow && winningChow._type === MeldType.CHOW &&
                (winningPosition === 0 || winningPosition === 2) &&
                winningChow._firstTile._num > 1 &&
                winningChow._firstTile._num < 7) {
                    yaku += 1;
                    yakuList.push({ name: 'PINFU', han: 1 });
            }
        }

        // 3. Iipeikou (Pure Double Chow) - 1 Han
        if (isConcealed && InternationalRules.pureDoubleChow(hand) === 1) {
            yaku += 1;
            yakuList.push({ name: 'IIPEIKOU', han: 1 });
        }

        // 4. Ryanpeikou (Two Pure Double Chows) - 3 Han
        if (isConcealed && InternationalRules.pureDoubleChow(hand) === 2) {
            yaku += 3;
            yakuList.push({ name: 'RYAN_PEIKOU', han: 3 });
        }

        // 5. Menzen Tsumo (Self-Drawn Concealed) - 1 Han
        if (hand._selfDrawn && isConcealed) {
            yaku += 1;
            yakuList.push({ name: 'FULLY_CONCEALED_HAND', han: 1 });
        }

        if (hand.doubleRiichi) {
            yaku += 2;
            yakuList.push({ name: 'DOUBLE_RIICHI', han: 2 });
        } else if (hand.riichi) {
            yaku += 1;
            yakuList.push({ name: 'RIICHI', han: 1 });
        }
        if (hand.ippatsu && (hand.riichi || hand.doubleRiichi)) {
            yaku += 1;
            yakuList.push({ name: 'IPPATSU', han: 1 });
        }

        // 6. Yakuhai (Dragons, Seat/Table Winds) - 1 Han each
        const dragonPungs = hand.dragons();
        if (dragonPungs > 0) {
            yaku += dragonPungs;
            yakuList.push({ name: 'DRAGON_PUNG', han: dragonPungs });
        }
        if (InternationalRules.prevalentWind(hand)) {
            yaku += 1;
            yakuList.push({ name: 'PREVALENT_WIND', han: 1 });
        }
        if (InternationalRules.seatWind(hand)) {
            yaku += 1;
            yakuList.push({ name: 'SEAT_WIND', han: 1 });
        }

        // 7. Chiitoitsu (Seven Pairs) - 2 Han
        if (!hand._isNormal && InternationalRules.sevenPairs(hand)) {
            yaku += 2;
            yakuList.push({ name: 'SEVEN_PAIRS', han: 2 });
        }

        // 8. Toitoi (All Pungs) - 2 Han
        if (hand.chows() === 0 && hand._isNormal) {
            yaku += 2;
            yakuList.push({ name: 'ALL_PUNGS', han: 2 });
        }

        // 9. Honitsu (Half Flush) - 2-3 Han
        if (InternationalRules.halfFlush(hand, data)) {
            const hanVal = isConcealed ? 3 : 2;
            yaku += hanVal;
            yakuList.push({ name: 'HALF_FLUSH', han: hanVal });
        }

        // 10. Chinitsu (Full Flush) - 5-6 Han
        if (InternationalRules.fullFlush(hand, data)) {
            const hanVal = isConcealed ? 6 : 5;
            yaku += hanVal;
            yakuList.push({ name: 'FULL_FLUSH', han: hanVal });
        }

        const addPatternYaku = (name, value, closedHan = 1, openHan = closedHan) => {
            if (value > 0) {
                const han = isConcealed ? closedHan : openHan;
                yaku += han * value;
                yakuList.push({ name, han: han * value });
            }
        };

        addPatternYaku('MIXED_TRIPLE_CHOW', InternationalRules.mixedTripleChow(hand), 2, 1);
        addPatternYaku('PURE_STRAIGHT', InternationalRules.pureStraight(hand), 2, 1);
        addPatternYaku('OUTSIDE_HAND', InternationalRules.outsideHand(hand), 2, 1);
        addPatternYaku('TRIPLE_PUNG', InternationalRules.triplePung(hand), 2);
        addPatternYaku('TWO_CONCEALED_PUNGS', InternationalRules.twoConcealedPungs(hand, data), 2);
        addPatternYaku('THREE_CONCEALED_PUNGS', InternationalRules.threeConcealedPungs(hand, data), 2);
        addPatternYaku('THREE_KONGS', InternationalRules.threeKongs(hand, data), 2);
        addPatternYaku('LITTLE_THREE_DRAGONS', InternationalRules.littleThreeDragons(hand), 2);
        addPatternYaku('ALL_TERMINALS_AND_HONORS', InternationalRules.allTerminalsAndHonors(hand, data), 2);

        if (InternationalRules.lastTileDraw(hand)) addPatternYaku('LAST_TILE_DRAW', 1);
        if (InternationalRules.lastTileClaim(hand)) addPatternYaku('LAST_TILE_CLAIM', 1);
        if (InternationalRules.outWithReplacementTile(hand)) addPatternYaku('OUT_WITH_REPLACEMENT_TILE', 1);
        if (InternationalRules.robbingTheKong(hand)) addPatternYaku('ROBBING_THE_KONG', 1);

        if (hand._isNormal &&
            hand._melds.slice(0, 5).every(meld =>
                meld.isValid() && !meld._firstTile.isHonor() && meld.hasTerminal())) {
            addPatternYaku('JUNCHAN', 1, 3, 2);
        }

        // Yakuman
        const isDealer = hand._playerWind._type === TileType.WIND && hand._playerWind._num === 1;
        if (hand.tenho && isDealer && hand._selfDrawn && isConcealed) {
            yaku = 13;
            yakuList.length = 0;
            yakuList.push({ name: 'TENHO', han: 13, yakuman: true });
        } else if (hand.chiho && !isDealer && hand._selfDrawn && isConcealed) {
            yaku = 13;
            yakuList.length = 0;
            yakuList.push({ name: 'CHIHO', han: 13, yakuman: true });
        } else if (hand.renho && !hand._selfDrawn && isConcealed) {
            yaku = 13;
            yakuList.length = 0;
            yakuList.push({ name: 'RENHO', han: 13, yakuman: true });
        } else if (InternationalRules.thirteenOrphans(hand, data)) {
            yaku = 13;
            yakuList.length = 0;
            yakuList.push({ name: 'THIRTEEN_ORPHANS', han: 13, yakuman: true });
        } else if (InternationalRules.allGreen(hand, data)) {
            yaku = 13;
            yakuList.length = 0;
            yakuList.push({ name: 'ALL_GREEN', han: 13, yakuman: true });
        } else if (InternationalRules.allHonors(hand, data)) {
            yaku = 13;
            yakuList.length = 0;
            yakuList.push({ name: 'ALL_HONORS', han: 13, yakuman: true });
        } else if (InternationalRules.bigThreeDragons(hand)) {
            yaku = 13;
            yakuList.length = 0;
            yakuList.push({ name: 'BIG_THREE_DRAGONS', han: 13, yakuman: true });
        } else if (InternationalRules.bigFourWinds(hand)) {
            yaku = 26;
            yakuList.length = 0;
            yakuList.push({ name: 'BIG_FOUR_WINDS', han: 26, yakuman: true });
        } else if (InternationalRules.fourConcealedPungs(hand, data)) {
            yaku = 13;
            yakuList.length = 0;
            yakuList.push({ name: 'FOUR_CONCEALED_PUNGS', han: 13, yakuman: true });
        } else if (InternationalRules.fourKongs(hand, data)) {
            yaku = 13;
            yakuList.length = 0;
            yakuList.push({ name: 'FOUR_KONGS', han: 13, yakuman: true });
        } else if (InternationalRules.nineGates(hand)) {
            yaku = 13;
            yakuList.length = 0;
            yakuList.push({ name: 'NINE_GATES', han: 13, yakuman: true });
        } else if (InternationalRules.allTerminals(hand, data)) {
            yaku = 13;
            yakuList.length = 0;
            yakuList.push({ name: 'ALL_TERMINALS', han: 13, yakuman: true });
        } else if (InternationalRules.littleFourWinds(hand)) {
            yaku = 13;
            yakuList.length = 0;
            yakuList.push({ name: 'LITTLE_FOUR_WINDS', han: 13, yakuman: true });
        }

        if (yaku > 0 && !yakuList.some(item => item.yakuman)) {
            for (const [indicator, name] of [
                [hand.dora, 'DORA'],
                [hand.uradora, 'URADORA']
            ]) {
                if (!indicator.isValid() || (name === 'URADORA' && !hand.riichi && !hand.doubleRiichi)) continue;
                const count = data.count[indicator.next(1).tileId] || 0;
                if (count > 0) {
                    yaku += count;
                    yakuList.push({ name, han: count });
                }
            }
        }

        if (yaku === 0) {
            res.desc = ['NO_YAKU'];
            res.nbPoints = 0;
            return res;
        }

        // Minipoints (Fu) calculation
        let fu = 20;
        const isSevenPairs = yakuList.some(y => y.name === 'SEVEN_PAIRS');
        const isPinfu = yakuList.some(y => y.name === 'PINFU');
        if (isSevenPairs) {
            fu = 25;
        } else {
            if (hand._isNormal) {
                if (!hand._selfDrawn && isConcealed) fu += 10;
                if (hand._selfDrawn && !isPinfu) fu += 2;

                for (let i = 0; i < 4; i++) {
                    const meld = hand._melds[i];
                    if (!meld.isValid() || meld._type === MeldType.CHOW) continue;
                    let meldFu = meld._type === MeldType.KONG ? 8 : 2;
                    if (meld._firstTile.isTerminal() || meld._firstTile.isHonor()) meldFu *= 2;
                    if (meld._isConcealed) meldFu *= 2;
                    fu += meldFu;
                }

                const pair = hand._melds[4]._firstTile;
                if (pair._type === TileType.DRAGON) fu += 2;
                if (pair._tileId === hand._tableWind._tileId) fu += 2;
                if (pair._tileId === hand._playerWind._tileId) fu += 2;
                if (InternationalRules.edgeWait(hand) ||
                    InternationalRules.closedWait(hand) ||
                    InternationalRules.singleWait(hand)) fu += 2;
                if (!isConcealed && !hand._selfDrawn && fu === 20) fu = 30;
            }
            fu = Math.ceil(fu / 10) * 10;
        }

        let totalPoints = 0;
        let limitName = '';
        let basicPoints = fu * Math.pow(2, 2 + yaku);
        if (yaku >= 26) {
            limitName = 'DOUBLE_YAKUMAN';
            basicPoints = 16000;
        } else if (yaku >= 13) {
            limitName = 'YAKUMAN';
            basicPoints = 8000;
        } else if (yaku >= 11) {
            limitName = 'SANBAIMAN';
            basicPoints = 6000;
        } else if (yaku >= 8) {
            limitName = 'BAIMAN';
            basicPoints = 4000;
        } else if (yaku >= 6) {
            limitName = 'HANEMAN';
            basicPoints = 3000;
        } else if (yaku >= 5 || basicPoints >= 2000) {
            limitName = 'MANGAN';
            basicPoints = 2000;
        }

        const roundUp100 = points => Math.ceil(points / 100) * 100;
        if (hand._selfDrawn) {
            totalPoints = isDealer
                ? 3 * roundUp100(basicPoints * 2)
                : roundUp100(basicPoints * 2) + 2 * roundUp100(basicPoints);
        } else {
            totalPoints = roundUp100(basicPoints * (isDealer ? 6 : 4));
        }

        res.han = yaku;
        res.fu = fu;
        res.nbPoints = totalPoints;
        res.scoreSummary = `${fu} Fu · ${yaku} Han${limitName ? ` · ${limitName}` : ''}`;

        for (const item of yakuList) {
            const scoreItem = new ScoreItem({
                ruleId: item.name,
                name: item.name,
                points: item.han,
                count: 1
            });
            res.items.push(scoreItem);
            res.matched[item.name] = true;
            res.desc.push(`${item.han} Han: ${item.name}`);
        }

        res.desc.push(`${res.scoreSummary} → ${totalPoints} pts`);

        return res;
    }
}
