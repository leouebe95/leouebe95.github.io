// eslint
/* global HandRules:false */

window.HandRulesInternational = (function(hr) {
    'use strict';

    /**
       Private array of all rules.
       Id, NbPoints, Description, computeCB, [special], [normal], [implied1, ...]
    */
    var data = hr.makeRules([
        // Needs to be first to ensure it is computed last.
	    [13, 1, hr.flowerTiles,         true, true],
	    [39, 8, hr.chickenHand], // Compute after all rules except flower tiles

	    [ 1, 1, hr.pureDoubleChow],
	    [ 2, 1, hr.mixedDoubleChow],
	    [ 3, 1, hr.shortStraight],
	    [ 4, 1, hr.twoTerminalChows],
	    [ 5, 1, hr.pungOfTerminalsOrHonors],
	    [ 6, 1, hr.meldedKong],
	    [ 7, 1, hr.oneVoidedSuit,       true, true],
	    [ 8, 1, hr.noHonors,            true, true],
	    [ 9, 1, hr.edgeWait],
	    [10, 1, hr.closedWait],
	    [11, 1, hr.singleWait],
	    [12, 1, hr.selfDrawn,           true, true],

	    [14, 2, hr.dragonPung],
	    [15, 2, hr.prevalentWind],
	    [16, 2, hr.seatWind],
	    [17, 2, hr.concealedHand],
	    [18, 2, hr.allChows,            true, true, 8],
	    [19, 2, hr.tileHog,             true, true],
	    [20, 2, hr.doublePung],
	    [21, 2, hr.twoConcealedPungs],
	    [22, 2, hr.concealedKong],
	    [23, 2, hr.allSimples,          true, true,		8],

	    [24, 4, hr.outsideHand],
	    [25, 4, hr.fullyConcealedHand,  true, true,		12],
	    [26, 4, hr.twoMeldedKongs],
	    [27, 4, hr.lastTile],

	    [28, 6, hr.allPungs],
	    [29, 6, hr.halfFlush,           true, true,		7],
	    [30, 6, hr.mixedShiftedChows],
	    [31, 6, hr.allTypes,            true, true],
	    [32, 6, hr.meldedHand,          11],
	    [33, 6, hr.twoDragons],
	    [34, 6, hr.oneMeldedAndOneConcealedKong, 22],

	    [35, 8, hr.mixedStraight],
	    [36, 8, hr.reversibleTiles,     true, true, 7],
	    [37, 8, hr.mixedTripleChow,     2],
	    [38, 8, hr.mixedShiftedPungs],
	    [40, 8, hr.lastTileDraw,        12],
	    [41, 8, hr.lastTileClaim],
	    [42, 8, hr.outWithReplacementTile],
	    [43, 8, hr.twoConcealedKongs],
	    [44, 8, hr.robbingTheKong],

	    [45, 12, hr.lesserHonorsAndKnittedTiles, true, false, 31],
	    [46, 12, hr.knittedStraight,    true, false],
	    [47, 12, hr.upperFour,          true, true,     8],
	    [48, 12, hr.lowerFour,          true, true,     8],
	    [49, 12, hr.bigThreeWinds],

	    [50, 16, hr.pureStraight,       3, 4],
	    [51, 16, hr.threeSuitedTerminalChows, 2, 4, 8, 18],
	    [52, 16, hr.pureShiftedChows],
	    [53, 16, hr.allFives,           8, 23],
	    [54, 16, hr.triplePung,         20],
	    [55, 16, hr.threeConcealedPungs],

	    [56, 24, hr.sevenPairs,         true, false],
	    [57, 24, hr.greaterHonorsAndKnittedTiles, true, false, 31, 45],
	    [58, 24, hr.allEven,            true, true,     8, 23, 28],
	    [59, 24, hr.fullFlush,          true, true,     7, 8, 29],
	    [60, 24, hr.pureTripleChow,     1],
	    [61, 24, hr.pureShiftedPungs],
	    [62, 24, hr.upperTiles,         8, 47],
	    [63, 24, hr.middleTiles,        8, 23],
	    [64, 24, hr.lowerTiles,         8, 48],

	    [65, 32, hr.fourShiftedChows,   52],
	    [66, 32, hr.threeKongs],
	    [67, 32, hr.allTerminalsAndHonors, true, true, 5, 24, 28],

	    [68, 48, hr.quadrupleChow,      1, 7, 19, 60],
	    [69, 48, hr.fourPureShiftedPungs, 28, 61],

	    [70, 64, hr.allTerminals,       true, true, 5,  8, 24, 28, 67],
	    [71, 64, hr.littleFourWinds,    49],
	    [72, 64, hr.littleThreeDragons, 7, 33],
	    [73, 64, hr.allHonors,          true, true, 5,  7, 24, 28, 67],
	    [74, 64, hr.fourConcealedPungs, 28],
	    [75, 64, hr.pureTerminalChows,  1,  7,  8, 18, 29, 59],

	    [76, 88, hr.bigFourWinds,       5,  7, 15, 16, 28, 49],
	    [77, 88, hr.bigThreeDragons,    7, 14, 33],
	    [78, 88, hr.allGreen,           true, true, 7, 29],
	    [79, 88, hr.nineGates,          true, false, 5, 17, 50 ],
	    [80, 88, hr.fourKongs,          28],
	    [81, 88, hr.sevenShiftedPairs,  true, false, 11, 17, 50],
	    [82, 88, hr.thirteenOrphans,	true, false, 31, 67]
    ]);


    /**
       Description of the entire ruleset
    */
    var hri = class {
        constructor() {
        }

	    /**
	       Compute all rules for the hand, and determines which ones score
	       @param {Hand} handIn Hand to test.
	       @param {Rule[]} rules Array of rules to check.

	       @return {Object} Number of points, matched rules, ...
	    */
	    compute(handIn) {
            return hr.compute(handIn, data);
        }

    };

    return hri;
})(HandRules);
