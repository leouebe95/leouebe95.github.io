// -*- coding: utf-8 -*-

/**
 * Catalog of textbook exemplar hands illustrating specific MCR (International) rules.
 * Enables the pedagogical "Rule Showcase" feature.
 */
export const RuleExemplars = {
    // 1: Pure Double Chow (1 pt)
    1: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 1 }, flowers: [],
        melds: [
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 2 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 2 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'character', num: 4 }, isConcealed: true },
            { type: 'PUNG', firstTile: { type: 'dot', num: 6 }, isConcealed: false },
            { type: 'PAIR', firstTile: { type: 'dragon', num: 1 }, isConcealed: true }
        ]
    },
    // 2: Mixed Double Chow (1 pt)
    2: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 2 }, flowers: [],
        melds: [
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 3 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'character', num: 3 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'dot', num: 5 }, isConcealed: false },
            { type: 'PUNG', firstTile: { type: 'dragon', num: 2 }, isConcealed: false },
            { type: 'PAIR', firstTile: { type: 'wind', num: 4 }, isConcealed: true }
        ]
    },
    // 3: Short Straight (1 pt)
    3: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 3 }, flowers: [],
        melds: [
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 1 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 4 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'dot', num: 2 }, isConcealed: true },
            { type: 'PUNG', firstTile: { type: 'character', num: 8 }, isConcealed: false },
            { type: 'PAIR', firstTile: { type: 'dragon', num: 3 }, isConcealed: true }
        ]
    },
    // 14: Dragon Pung (2 pts)
    14: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 1 }, flowers: [],
        melds: [
            { type: 'PUNG', firstTile: { type: 'dragon', num: 3 }, isConcealed: false },
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 2 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'dot', num: 4 }, isConcealed: true },
            { type: 'PUNG', firstTile: { type: 'character', num: 7 }, isConcealed: false },
            { type: 'PAIR', firstTile: { type: 'wind', num: 2 }, isConcealed: true }
        ]
    },
    // 18: All Chows (2 pts)
    18: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 2 }, flowers: [],
        melds: [
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 1 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 5 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'dot', num: 3 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'character', num: 6 }, isConcealed: true },
            { type: 'PAIR', firstTile: { type: 'dot', num: 8 }, isConcealed: true }
        ]
    },
    // 23: All Simples (2 pts)
    23: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 1 }, flowers: [],
        melds: [
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 2 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'dot', num: 4 }, isConcealed: true },
            { type: 'PUNG', firstTile: { type: 'character', num: 5 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'character', num: 6 }, isConcealed: true },
            { type: 'PAIR', firstTile: { type: 'bamboo', num: 8 }, isConcealed: true }
        ]
    },
    // 28: All Pungs (6 pts)
    28: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 2 }, flowers: [],
        melds: [
            { type: 'PUNG', firstTile: { type: 'bamboo', num: 2 }, isConcealed: false },
            { type: 'PUNG', firstTile: { type: 'dot', num: 4 }, isConcealed: true },
            { type: 'PUNG', firstTile: { type: 'character', num: 6 }, isConcealed: true },
            { type: 'PUNG', firstTile: { type: 'dragon', num: 1 }, isConcealed: false },
            { type: 'PAIR', firstTile: { type: 'wind', num: 3 }, isConcealed: true }
        ]
    },
    // 35: Mixed Straight (8 pts)
    35: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 1 }, flowers: [],
        melds: [
            { type: 'CHOW', firstTile: { type: 'character', num: 1 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 4 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'dot', num: 7 }, isConcealed: true },
            { type: 'PUNG', firstTile: { type: 'dragon', num: 2 }, isConcealed: false },
            { type: 'PAIR', firstTile: { type: 'wind', num: 1 }, isConcealed: true }
        ]
    },
    // 50: Pure Straight (16 pts)
    50: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 1 }, flowers: [],
        melds: [
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 1 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 4 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 7 }, isConcealed: true },
            { type: 'PUNG', firstTile: { type: 'dot', num: 5 }, isConcealed: false },
            { type: 'PAIR', firstTile: { type: 'character', num: 8 }, isConcealed: true }
        ]
    },
    // 56: Seven Pairs (24 pts)
    56: {
        isNormal: false, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 1 }, flowers: [],
        tiles: [
            { type: 'bamboo', num: 1 }, { type: 'bamboo', num: 1 },
            { type: 'bamboo', num: 5 }, { type: 'bamboo', num: 5 },
            { type: 'dot', num: 3 }, { type: 'dot', num: 3 },
            { type: 'dot', num: 8 }, { type: 'dot', num: 8 },
            { type: 'character', num: 2 }, { type: 'character', num: 2 },
            { type: 'dragon', num: 1 }, { type: 'dragon', num: 1 },
            { type: 'wind', num: 4 }, { type: 'wind', num: 4 }
        ]
    },
    // 77: Big Three Dragons (88 pts)
    77: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 1 }, flowers: [],
        melds: [
            { type: 'PUNG', firstTile: { type: 'dragon', num: 1 }, isConcealed: false },
            { type: 'PUNG', firstTile: { type: 'dragon', num: 2 }, isConcealed: true },
            { type: 'PUNG', firstTile: { type: 'dragon', num: 3 }, isConcealed: false },
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 2 }, isConcealed: true },
            { type: 'PAIR', firstTile: { type: 'dot', num: 9 }, isConcealed: true }
        ]
    },
    // 78: All Green (88 pts)
    78: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 1 }, flowers: [],
        melds: [
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 2 }, isConcealed: true },
            { type: 'PUNG', firstTile: { type: 'bamboo', num: 6 }, isConcealed: true },
            { type: 'PUNG', firstTile: { type: 'bamboo', num: 8 }, isConcealed: false },
            { type: 'PUNG', firstTile: { type: 'dragon', num: 2 }, isConcealed: false }, // Green dragon
            { type: 'PAIR', firstTile: { type: 'bamboo', num: 4 }, isConcealed: true }
        ]
    },
    // 82: Thirteen Orphans (88 pts)
    82: {
        isNormal: false, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 1 }, flowers: [],
        tiles: [
            { type: 'bamboo', num: 1 }, { type: 'bamboo', num: 9 },
            { type: 'dot', num: 1 }, { type: 'dot', num: 9 },
            { type: 'character', num: 1 }, { type: 'character', num: 9 },
            { type: 'wind', num: 1 }, { type: 'wind', num: 2 }, { type: 'wind', num: 3 }, { type: 'wind', num: 4 },
            { type: 'dragon', num: 1 }, { type: 'dragon', num: 2 }, { type: 'dragon', num: 3 },
            { type: 'bamboo', num: 1 }
        ]
    }
};

Object.assign(RuleExemplars, {
    // 13: Flower Tiles (1 pt per flower; added to an already-valid hand)
    13: {
        ...RuleExemplars[77],
        flowers: [{ type: 'flower', num: 1 }]
    },
    // 32: Melded Hand (all four melds exposed; pair completed by discard)
    32: {
        isNormal: true, lastTile: 12, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 2 }, flowers: [],
        melds: [
            { type: 'PUNG', firstTile: { type: 'bamboo', num: 2 }, isConcealed: false },
            { type: 'PUNG', firstTile: { type: 'dot', num: 4 }, isConcealed: false },
            { type: 'PUNG', firstTile: { type: 'character', num: 6 }, isConcealed: false },
            { type: 'PUNG', firstTile: { type: 'dragon', num: 1 }, isConcealed: false },
            { type: 'PAIR', firstTile: { type: 'wind', num: 3 }, isConcealed: true }
        ]
    },
    // 38: Mixed Shifted Pungs (three suits, consecutive ranks)
    38: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 2 }, flowers: [],
        melds: [
            { type: 'PUNG', firstTile: { type: 'bamboo', num: 2 }, isConcealed: false },
            { type: 'PUNG', firstTile: { type: 'character', num: 3 }, isConcealed: false },
            { type: 'PUNG', firstTile: { type: 'dot', num: 4 }, isConcealed: false },
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 6 }, isConcealed: true },
            { type: 'PAIR', firstTile: { type: 'wind', num: 4 }, isConcealed: true }
        ]
    },
    // 40: Last Tile Draw (self-drawn from the last tile of the wall)
    40: {
        ...RuleExemplars[77],
        selfDrawn: true,
        lastTileDrawn: true
    },
    // 42: Out With Replacement Tile (self-drawn after a kong)
    42: {
        ...RuleExemplars[77],
        selfDrawn: true,
        replacementTile: true
    },
    // 69: Four Pure Shifted Pungs (four consecutive pungs in one suit)
    69: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 2 }, flowers: [],
        melds: [
            { type: 'PUNG', firstTile: { type: 'bamboo', num: 1 }, isConcealed: false },
            { type: 'PUNG', firstTile: { type: 'bamboo', num: 2 }, isConcealed: false },
            { type: 'PUNG', firstTile: { type: 'bamboo', num: 3 }, isConcealed: false },
            { type: 'PUNG', firstTile: { type: 'bamboo', num: 4 }, isConcealed: false },
            { type: 'PAIR', firstTile: { type: 'bamboo', num: 5 }, isConcealed: true }
        ]
    },
    // 75: Pure Terminal Chows (123/789 in each of two suits)
    75: {
        isNormal: true, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 2 }, flowers: [],
        melds: [
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 1 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 1 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 7 }, isConcealed: true },
            { type: 'CHOW', firstTile: { type: 'bamboo', num: 7 }, isConcealed: true },
            { type: 'PAIR', firstTile: { type: 'bamboo', num: 5 }, isConcealed: true }
        ]
    },
    // 79: Nine Gates (1112345678999 plus a duplicate within one suit)
    79: {
        isNormal: false, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 1 }, flowers: [],
        tiles: [
            { type: 'bamboo', num: 1 }, { type: 'bamboo', num: 1 }, { type: 'bamboo', num: 1 },
            { type: 'bamboo', num: 2 }, { type: 'bamboo', num: 3 }, { type: 'bamboo', num: 4 },
            { type: 'bamboo', num: 5 }, { type: 'bamboo', num: 6 }, { type: 'bamboo', num: 7 },
            { type: 'bamboo', num: 8 }, { type: 'bamboo', num: 9 }, { type: 'bamboo', num: 9 },
            { type: 'bamboo', num: 9 }, { type: 'bamboo', num: 5 }
        ]
    },
    // 81: Seven Shifted Pairs (seven consecutive pairs in one suit)
    81: {
        isNormal: false, lastTile: 0, selfDrawn: false, lastTileDrawn: false, lastExistingTile: false, robbedKong: false, replacementTile: false,
        tableWind: { type: 'wind', num: 1 }, playerWind: { type: 'wind', num: 1 }, flowers: [],
        tiles: [
            { type: 'dot', num: 1 }, { type: 'dot', num: 1 },
            { type: 'dot', num: 2 }, { type: 'dot', num: 2 },
            { type: 'dot', num: 3 }, { type: 'dot', num: 3 },
            { type: 'dot', num: 4 }, { type: 'dot', num: 4 },
            { type: 'dot', num: 5 }, { type: 'dot', num: 5 },
            { type: 'dot', num: 6 }, { type: 'dot', num: 6 },
            { type: 'dot', num: 7 }, { type: 'dot', num: 7 }
        ]
    }
});
