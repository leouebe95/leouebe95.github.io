// -*- coding: utf-8 -*-

import { describe, it, assert } from '../test-runner.js';
import { Hand } from '../../src/core/models/Hand.js';
import { Tile, TileType } from '../../src/core/models/Tile.js';
import { Meld, MeldType } from '../../src/core/models/Meld.js';
import { HandSamples } from '../../src/core/rules/HandSamples.js';

describe('Unit: Hand Domain Model', () => {
    it('loads simplified sample hands correctly and verifies valueHints', () => {
        const sample001 = Hand.fromSimplifiedJSON(HandSamples[0]);
        const sample002 = Hand.fromSimplifiedJSON(HandSamples[1]);
        const sample099 = Hand.fromSimplifiedJSON(HandSamples[98]);

        assert.equal(sample001.valueHint, 11, 'Sample #1 valueHint');
        assert.equal(sample002.valueHint, 22, 'Sample #2 valueHint');
        assert.equal(sample099.valueHint, 96, 'Sample #99 valueHint');
    });

    it('correctly counts tiles and checks validity', () => {
        const hand = new Hand();
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 1), true);
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 4), true);
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 7), true);
        hand.addMeld(MeldType.PUNG, new Tile(TileType.DRAGON, 1), false);
        hand.addMeld(MeldType.PAIR, new Tile(TileType.WIND, 1), true);

        const counts = hand.countTiles();
        // Bamboo 1..9 should each have count 1
        for (let i = 0; i < 9; i++) {
            assert.equal(counts[i], 1, `Bamboo ${i + 1} count`);
        }

        // Dragon 1 (White) has 3
        assert.equal(counts[TileType.DRAGON.offset], 3);
        // Wind 1 (East) has 2
        assert.equal(counts[TileType.WIND.offset], 2);

        assert.isTrue(hand.isValid(), 'Hand does not exceed 4 tiles per kind');
    });

    it('adds and removes flowers and seasons', () => {
        const hand = new Hand();
        const flower1 = new Tile(TileType.FLOWER, 1);
        const season2 = new Tile(TileType.SEASON, 2);

        assert.isTrue(hand.addFlower(flower1));
        assert.isTrue(hand.hasFlower(flower1));
        assert.equal(hand.flowersCount(), 1);

        // Cannot add duplicate flower
        assert.isFalse(hand.addFlower(flower1));
        assert.equal(hand.flowersCount(), 1);

        assert.isTrue(hand.addFlower(season2));
        assert.equal(hand.flowersCount(), 2);

        assert.isTrue(hand.removeFlower(flower1));
        assert.isFalse(hand.hasFlower(flower1));
        assert.equal(hand.flowersCount(), 1);
    });

    it('preserves table context and bonus tiles when changing hand structure', () => {
        const hand = new Hand();
        const flower = new Tile(TileType.FLOWER, 2);
        hand.tableWind = new Tile(TileType.WIND, 2);
        hand.playerWind = new Tile(TileType.WIND, 3);
        hand.selfDrawn = true;
        hand.riichi = true;
        hand.addFlower(flower);

        hand.setType(false);

        assert.isFalse(hand.isNormal);
        assert.equal(hand.tableWind.num, 2);
        assert.equal(hand.playerWind.num, 3);
        assert.isTrue(hand.selfDrawn);
        assert.isTrue(hand.riichi);
        assert.isTrue(hand.hasFlower(flower));
        assert.equal(hand.lastTile, -1, 'The old winning-tile position is cleared');
    });

    it('clones and serializes hands losslessly', () => {
        const sample = Hand.fromSimplifiedJSON(HandSamples[0]);
        const cloned = sample.clone();
        assert.deepEqual(cloned.simplifiedJSON(), sample.simplifiedJSON());
    });
});
