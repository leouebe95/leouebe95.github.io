// eslint
/* global HandRules:false Meld:false Tile:false strRes:false */

window.HandRulesRiichi = (function(hr) {
    'use strict';

    /**
       Array of all the rules scoring a yaku
    */
    var yaku;

    function concealedHand(hand) {
        return (hr.concealedHand(hand) > 0) ||
            (hr.fullyConcealedHand(hand) > 0);
    }

    function formatRule(count, message) {
        return strRes('RULES_FORMAT_MINI').format(count, message);
    }

    function computePoints(yaku, mini) {
        var points = {
            20:  [  0,  400, 700, 1300],
            25:  [  0,    0, 800, 1600],
            30:  [300,  500, 1000, 2000],
            40:  [400,  700, 1300, 2000],
            50:  [400,  800, 1600, 2000],
            60:  [500, 1000, 2000, 2000],
            70:  [600, 1200, 2000, 2000],
            80:  [700, 1300, 2000, 2000],
            90:  [800, 1500, 2000, 2000],
            100: [800, 1600, 2000, 2000],
            110: [900, 1800, 2000, 2000]};

        var total = mini << (2+yaku);
        var totalRound = 100*Math.ceil(total/100);
        console.log(total, totalRound, points[mini][yaku-1]);
        // FIXME
        return totalRound;
    }

    function computeMinipoints(hand, yakuRes) {
        var res = {
            nbPoints: 0,
            desc : []
        };

        if (yakuRes.matched[19]) { // 7 pairs
            res.nbPoints = 25;
            res.desc = [strRes('SEVEN_PAIRS_MINI')];
            return res;
        }
        res.nbPoints = 20; // Default
        res.desc = [formatRule(20, strRes('DEFAULT_MINI'))];
        if ((!hand._selfDrawn) && concealedHand(hand)) {
            // 30 minipoints for Concealed on a discard
            res.nbPoints = 30;
            res.desc = [formatRule(res.nbPoints, strRes('CONCEALED_ON_DISCARD'))];
        }

        if (hand._isNormal) {
            // Add minipoints for PUNG and KONG
            for (var i = 0 ; i<4 ; i++) {
                var count = 0;
                var message;
                if (hand._melds[i]._type === Meld.MeldType.PUNG) {
                    message = strRes('PUNG_MINI');
                    count = 2;
                } else if (hand._melds[i]._type === Meld.MeldType.KONG) {
                    message = strRes('KONG_MINI');
                    count = 8;
                } else {
                    continue;
                }

                if (hand._melds[i]._firstTile.isTerminal() ||
                    hand._melds[i]._firstTile.isHonor()) {
                    if (hand._melds[i]._type === Meld.MeldType.PUNG) {
                        message = strRes('PUNG_HONOR_MINI');
                    } else {
                        message = strRes('KONG_HONOR_MINI');
                    }
                    count *= 2;
                }

                if (hand._melds[i]._isConcealed) {
                    message += strRes('CONCEALED_MINI');
                    count *= 2;
                }

                res.nbPoints += count;
                res.desc.push(formatRule(count, message));
            }

            // Add minipoints for special pairs
            if (hand._melds[4]._firstTile._type === Tile.TileType.DRAGON) {
                res.desc.push(formatRule(2, strRes('PAIR_DRAGON')));
                res.nbPoints += 2;
            }
            if (hand._melds[4]._firstTile._tileId === hand._tableWind._tileId) {
                res.desc.push(formatRule(2, strRes('PAIR_TABLE_WIND')));
                res.nbPoints += 2;
            }
            if (hand._melds[4]._firstTile._tileId === hand._playerWind._tileId) {
                res.desc.push(formatRule(2, strRes('PAIR_PLAYER_WIND')));
                res.nbPoints += 2;
            }

            if (hr.edgeWait(hand)) {
                res.desc.push(formatRule(2, strRes('EDGE_WAIT_MINI')));
                res.nbPoints += 2;
            }
            if (hr.closedWait(hand)) {
                res.desc.push(formatRule(2, strRes('CLOSED_WAIT_MINI')));
                res.nbPoints += 2;
            }
            if (hr.singleWait(hand)) {
                res.desc.push(formatRule(2, strRes('SINGLE_WAIT_MINI')));
                res.nbPoints += 2;
            }

            if (!yakuRes.matched[7]) { // Pinfu
                if (hr.selfDrawn(hand)) {
                    res.desc.push(formatRule(2, strRes('SELF_DRAWN_MINI')));
                    res.nbPoints += 2;
                }

                if (hrr.openPinfu(hand)) {
                    res.desc.push(formatRule(2, strRes('OPEN_PINFU')));
                    res.nbPoints += 2;
                }
            }
        }
        return res;
    }

    function computeDora(tile, data, rulesRes) {
        if (rulesRes.nbPoints < 1) {return 0;}

        var doraTile = tile.next(1);
        return data.count[doraTile._tileId];
    }

    /**
       Description of the entire ruleset
    */
    var hrr = class {

	    /**
	       Compute all rules for the hand, and determines which ones score
	       @param {Hand} handIn Hand to test.

	       @return {Int} Number of points.
	    */
	    compute(handIn) {
            var yakuRes =  hr.compute(handIn, yaku);
            if (yakuRes.nbPoints === 0) {
				yakuRes.desc = [strRes('NO_YAKU')];
                return yakuRes;
            }

            yakuRes.desc.unshift(strRes('YAKU_POINTS'));
            // Limit hands, no need to compute mini points
            if (yakuRes.nbPoints >= 5) {
                var total;
                var totalPoint;
                if (yakuRes.nbPoints === 5) {
                    total = 'MANGAN';
                    totalPoint = 2000;
                } else if (yakuRes.nbPoints <= 7) {
                    total = 'HANEMAN';
                    totalPoint = 3000;
                } else if (yakuRes.nbPoints <= 10) {
                    total = 'BAIMAN';
                    totalPoint = 4000;
                } else if (yakuRes.nbPoints <= 12) {
                    total = 'SANBAIMAN';
                    totalPoint = 6000;
                } else if (yakuRes.nbPoints <= 25) {
                    total = 'YAKUMAN';
                    totalPoint = 8000;
                } else  {
                    total = 'DOUBLE_YAKUMAN';
                    totalPoint = 16000;
                }
                yakuRes.desc.push(strRes(total).format(yakuRes.nbPoints));
                yakuRes.nbPoints = totalPoint;
                return yakuRes;
            }

            yakuRes.desc.push(strRes('YAKU').format(yakuRes.nbPoints));
            yakuRes.desc.push('');
            yakuRes.desc.push(strRes('MINIPOINTS'));
            var miniRes = computeMinipoints(handIn, yakuRes);
            yakuRes.desc = yakuRes.desc.concat(miniRes.desc);
            var miniPoints = Math.ceil(miniRes.nbPoints/10) * 10;
            if (miniRes.nbPoints == 25) {
                miniPoints = 25;
            }
            yakuRes.desc.push(strRes('MINIPOINTS_TOTAL').format(miniRes.nbPoints, miniPoints));

            yakuRes.nbPoints = computePoints(yakuRes.nbPoints, miniPoints);

            return yakuRes;
        }

        /**
           Concealed waiting hand declared.

           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static riichi(hand) {
            if (hand.riichi && concealedHand(hand)) {return 1;}
            return 0;
        }

        /**
           Winning within the first uninterrupted set of turns after
           declaring riichi, including the next draw by the riichi
           declarer. If the set of turns is interrupted by claims for
           kong, pung or chow, including concealed kongs, the chance
           for IPPATSU is gone.

           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @param {Object} rulesRes current intermediate result with
           all previous rules ran.
           @return {Int} number of times this rule matches
        */
        static ippatsu(hand, data, rulesRes) {
            if (hand.ippatsu && rulesRes.matched[1]) {return 1;}
            return 0;
        }

        /**
           An extra yaku, DABURU RIICHI, is awarded for declaring
           riichi in the first set of turns of the hand, i.e. in the
           player's very first turn. The first set of turns must be
           uninterrupted, i.e. if any claims for kong, pung or how,
           including concealed kongs, has occurred before the riichi
           declaration, DABURU RIICHI is not possible.

           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @param {Object} rulesRes current intermediate result with
           all previous rules ran.
           @return {Int} number of times this rule matches
        */
        static daburuRiichi(hand, data, rulesRes) {
            if (hand.daburuRiichi && rulesRes.matched[1]) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @param {Object} rulesRes current intermediate result with
           all previous rules ran.
           @return {Int} number of times this rule matches
        */
        static concealedBonus(hand, data, rulesRes) {
            var res = 0;
            if (concealedHand(hand)) {
                var ruleIds = [9, 10, 14, 24, 27];
                for (var i=0 ; i<ruleIds.length ; i++) {
                    if (rulesRes.matched[ruleIds[i]]) {
                        res ++;
                    }
                }
            }
            return res;
        }

        /**
           Hand contains all simple tiles. Hand must be concealed.
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static tanyaoChuu(hand, data) {
            if (concealedHand(hand)) {return hr.allSimples(hand, data);}
            return 0;
        }

        /**
           All chows hand with valueless pairs. The hand must be
           completed on a chow with a two-sided wait.

           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static openPinfu(hand) {
            if ((hand.chows() === 4)) {
				// The pair must be value-less
				var type = hand._melds[4]._firstTile._type;
				var tileId = hand._melds[4]._firstTile._tileId;
				if ((type !== Tile.TileType.DRAGON) &&
                    (tileId !== hand._tableWind._tileId) &&
                    (tileId !== hand._playerWind._tileId)) {
					return 1;
                }
            }
			return 0;
        }

        /**
           All chows hand with valueless pairs. The hand must be
           completed on a chow with a two-sided wait. Hand must be
           concealed.

           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static pinfu(hand) {
            if (concealedHand(hand)&& hrr.openPinfu(hand)) {
                // Two-sided wait
			    var meld = Math.floor(hand._lastTile/3);
			    var pos = hand._lastTile - meld*3;
			    if (meld >= 4) {return 0;}
                if ((pos === 0) &&
			        (hand._melds[meld]._firstTile._num < 7-1)) {
                    // last tile was the first of CHOW, it cannot be a '7'
                    return 1;
                }
                if ((pos === 2) &&
			        (hand._melds[meld]._firstTile._num > 0)) {
                    // last tile was the first of CHOW, it cannot be a '1'
                    return 1;
                }
            }
            return 0;
        }

        /**
           Two identical chows. Hand must be concealed.
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static iipeikou(hand) {
            if (concealedHand(hand)) {return hr.pureDoubleChow(hand);}
            return 0;
        }

        /**
           Hand contains sets with terminal tiles. Hand must contain
           one terminal chow. +1 if concealed.
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static junchan(hand) {
			for (var i=0 ; i<5 ; i++) {
				if (!hand._melds[i].hasTerminal()) {
					return 0;
				}
			}
            return 1;
        }

        /**
           Two identical chows. Hand must be concealed.
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static ryanPeikou(hand) {
            if (concealedHand(hand) &&
                (hr.pureDoubleChow(hand) === 2)) {
                return 1;
            }
            return 0;
        }

        /**
           East goes out on the initial draw. Hand must be concealed.
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static tenho(hand) {
            if (!concealedHand(hand)) {return 0;}
            if (hand._tenho) {return 1;}
            return 0;
        }

        /**
           Player goes out in the draw. Hand must be concealed.
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static chiho(hand) {
            if (!concealedHand(hand)) {return 0;}
            if (hand._chiho) {return 1;}
            return 0;
        }

        /**
           Player goes out on a discard in the first go around. Hand must be concealed.
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static renho(hand) {
            if ((!concealedHand(hand)) || hand._selfDrawn) {return 0;}
            if (hand._renho) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @param {Object} rulesRes current intermediate result with
           all previous rules ran.
           @return {Int} number of times this rule matches
        */
        static dora(hand, data, rulesRes) {
            return computeDora(hand._dora, data, rulesRes);
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @param {Object} rulesRes current intermediate result with
           all previous rules ran.
           @return {Int} number of times this rule matches
        */
        static uradora(hand, data, rulesRes) {
            return computeDora(hand._uradora, data, rulesRes);
        }
    };

    yaku = hr.makeRules([

        // 1 fan special yaku. Count only if one normal yaku. First in
        // the array to be computed last.
        [50, 1, hrr.dora],              // Dora
        [51, 1, hrr.uradora],           // Uradora

        // 1 fan yaku
        [ 2, 1, hrr.ippatsu],           // One Shot IPPATSU
        [ 3, 1, hrr.daburuRiichi],      // DABURU RIICHI
        [ 1, 1, hrr.riichi],            // Ready RIICHI (compute before IPPATSU & DABURU RIICHI)

        [ 4, 1, hrr.concealedBonus],    // Some hands have additional points when concealed
        [ 5, 1, hr.fullyConcealedHand], // Fully Concealed Hand MENZEN TSUMO
        [ 6, 1, hrr.tanyaoChuu],        // All Simples TANYAO CHUU
        [ 7, 1, hrr.pinfu],             // All Chows PINFU
        [ 8, 1, hrr.iipeikou],          // Pure Double Chow IIPEIKOU
        [ 9, 1, hr.mixedTripleChow],    // Mixed Triple Chow SAN SHOKU DOUJUN
        [10, 1, hr.pureStraight],       // Pure Straight ITSU
        [11, 1, hr.dragonPung],         // Dragon Pung FANPAI/YAKUHAI
        [12, 1, hr.seatWind],           // Seat Wind FANPAI/YAKUHAI
        [13, 1, hr.prevalentWind],      // Prevalent Wind FANPAI/YAKUHAI
        [14, 1, hr.outsideHand],        // Outside Hand CHANTA
        [15, 1, hr.outWithReplacementTile], // After a kong RINSHAN KAIHOU
        [16, 1, hr.robbingTheKong],     // Robbing the kong CHAN KAN
        [17, 1, hr.lastTileDraw],       // Under the Sea HAITEI
        [18, 1, hr.lastTileClaim],      // Under the Sea HOUTEI

        // 2 fan yaku
        [19, 2, hr.sevenPairs, true, false], // Seven pairs CHI TOITSU
        [20, 2, hr.triplePung],         // Triple Pung SAN SHOKU DOKOU
        [21, 2, hr.threeConcealedPungs], // Three Concealed Pungs SAN ANKOU
        [22, 2, hr.threeKongs],         // Three Kongs SAN KAN TSU
        [23, 2, hr.allPungs],           // All Pungs TOI-TOI HOU
        [24, 2, hr.halfFlush, true, true], // Half Flush HONITSU
        [25, 2, hr.littleThreeDragons], // Little Three Dragons SHOU SANGEN
        [26, 2, hr.allTerminalsAndHonors, true, true], // All Terminals and Honors HONROUTOU
        [27, 2, hrr.junchan],           // Terminals in All Sets JUNCHAN

        // 3 fan yaku
        [28, 3, hrr.ryanPeikou, 8],     // Twice Pure Double Chows RYAN PEIKOU

        // 5 fan yaku
        [29, 5, hr.fullFlush],          // Full Flush CHINITSU
        //FIXME [30, 5, ],      // Nagashi Mangan Only discarding terminal/honor tiles (none claimed). Game ends in a draw.

        // Yakuman
        [31, 13, hr.thirteenOrphans, true, false, 26], // Thirteen Orphans KOKUSHI MUSOU
        [32, 13, hr.nineGates, true, false], // Nine Gates CHUUREN POOTO
        [33, 13, hrr.tenho],            // Blessing of Heaven TENHO
        [34, 13, hrr.chiho],            // Blessing of Earth CHIHO
        [35, 13, hrr.renho],            // Blessing of Man RENHO
        [36, 13, hr.fourConcealedPungs], // Four Concealed Pungs SUU ANKOU
        [37, 13, hr.fourKongs],         // Four kongs SUU KAN TSU
        [38, 13, hr.allGreen, true, true], // All Green RYUU IISOU
        [39, 13, hr.allTerminals, true, true, 26, 27], // All Terminals CHINROUTO
        [40, 13, hr.allHonors, true, true], // All Honours TSUU IISOU
        [41, 13, hr.bigThreeDragons],   // Big Three Dragons DAI SANGEN
        [42, 13, hr.littleFourWinds],   // Little Four Winds SHOU SUUSHII

        [43, 26, hr.bigFourWinds]       // Big Four Winds DAI SUUSHII
    ]);

    hr.registerDescriptions([
        ['IPPATSU',         hrr.ippatsu],
        ['DABURU_RIICHI',   hrr.daburuRiichi],
        ['RIICHI',          hrr.riichi],
        ['CONCEALED_BONUS', hrr.concealedBonus],
        ['TANYAO_CHUU',     hrr.tanyaoChuu],
        ['PINFU',           hrr.pinfu],
        ['IIPEIKOU',        hrr.iipeikou],
        ['JUNCHAN',         hrr.junchan],
        ['RYAN_PEIKOU',     hrr.ryanPeikou],
        ['TENHO',           hrr.tenho],
        ['CHIHO',           hrr.chiho],
        ['RENHO',           hrr.renho],
        ['DORA',            hrr.dora],
        ['URADORA',         hrr.uradora]
    ]);

    return hrr;
})(HandRules);
