// -*- coding: utf-8 -*-

import { describe, it, assert } from '../test-runner.js';
import { Tile, TileType, BAD_TILE } from '../../src/core/models/Tile.js';

describe('Unit: Tile Domain Model', () => {
    it('validates bad and regular tiles correctly', () => {
        const bad = BAD_TILE;
        const char1 = new Tile(TileType.CHARACTER, 1);
        const char3 = new Tile(TileType.CHARACTER, 3);
        const wind3 = new Tile(TileType.WIND, 3);
        const drag1 = new Tile(TileType.DRAGON, 1);
        const char1b = new Tile(TileType.CHARACTER, 1);
        const flower2 = new Tile(TileType.FLOWER, 2);

        assert.isFalse(bad.isValid(), 'BAD_TILE is not valid');
        assert.isTrue(char1.isValid(), 'Character 1 is valid');

        assert.isFalse(bad.sameAs(BAD_TILE), 'Bad tiles are not sameAs');
        assert.isFalse(char1.sameAs(bad), 'char1 is not sameAs bad');
        assert.isFalse(char1.sameAs(drag1), 'char1 is not sameAs drag1');
        assert.isTrue(char1.sameAs(char1b), 'char1 is sameAs char1b');
    });

    it('identifies flower, honor, terminal, and regular tiles', () => {
        const bad = BAD_TILE;
        const char1 = new Tile(TileType.CHARACTER, 1);
        const char3 = new Tile(TileType.CHARACTER, 3);
        const wind3 = new Tile(TileType.WIND, 3);
        const drag1 = new Tile(TileType.DRAGON, 1);
        const flower2 = new Tile(TileType.FLOWER, 2);

        assert.isFalse(bad.isFlower());
        assert.isFalse(char1.isFlower());
        assert.isFalse(wind3.isFlower());
        assert.isTrue(flower2.isFlower());

        assert.isFalse(bad.isHonor());
        assert.isFalse(char1.isHonor());
        assert.isTrue(wind3.isHonor());
        assert.isTrue(drag1.isHonor());
        assert.isFalse(flower2.isHonor());

        assert.isFalse(bad.isTerminal());
        assert.isTrue(char1.isTerminal());
        assert.isFalse(char3.isTerminal());
        assert.isFalse(wind3.isTerminal());

        assert.isFalse(bad.isRegular());
        assert.isTrue(char1.isRegular());
        assert.isTrue(char3.isRegular());
        assert.isFalse(wind3.isRegular());
        assert.isFalse(flower2.isRegular());
    });

    it('formats file names accurately', () => {
        const char1 = new Tile(TileType.CHARACTER, 1);
        const wind1 = new Tile(TileType.WIND, 1);
        const drag2 = new Tile(TileType.DRAGON, 2);
        const flower3 = new Tile(TileType.FLOWER, 3);

        assert.equal(char1.fileName(), 'character_1');
        assert.equal(wind1.fileName(), 'wind_e');
        assert.equal(drag2.fileName(), 'dragon_g');
        assert.equal(flower3.fileName(), 'flower_3');
        assert.equal(BAD_TILE.fileName(), 'empty');
    });

    it('wraps negative offsets within a suit', () => {
        const tile = new Tile(TileType.BAMBOO, 1).next(-1);
        assert.equal(tile.num, 9);
    });

    it('serializes to and from simplified JSON', () => {
        const original = new Tile(TileType.BAMBOO, 7);
        const json = original.simplifiedJSON();
        assert.equal(json.type, 'bamboo');
        assert.equal(json.num, 7);

        const restored = Tile.fromSimplifiedJSON(json);
        assert.isTrue(restored.sameAs(original));
    });
});
