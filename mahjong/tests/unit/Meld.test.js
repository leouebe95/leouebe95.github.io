// -*- coding: utf-8 -*-

import { describe, it, assert } from '../test-runner.js';
import { Tile, TileType } from '../../src/core/models/Tile.js';
import { Meld, MeldType, BAD_MELD } from '../../src/core/models/Meld.js';

describe('Unit: Meld Domain Model', () => {
    it('evaluates validity of melds correctly', () => {
        const bad = BAD_MELD;
        const char1 = new Tile(TileType.CHARACTER, 1);
        const char8 = new Tile(TileType.CHARACTER, 8);
        const wind3 = new Tile(TileType.WIND, 3);
        const drag1 = new Tile(TileType.DRAGON, 1);
        const char1b = new Tile(TileType.CHARACTER, 1);
        const flower2 = new Tile(TileType.FLOWER, 2);

        const char1m = new Meld(MeldType.CHOW, char1, true);
        const char8m = new Meld(MeldType.CHOW, char8, false); // invalid chow (start 8)
        const wind3m = new Meld(MeldType.CHOW, wind3, false); // invalid chow of honors
        const wind3mb = new Meld(MeldType.PAIR, wind3, true);
        const drag1m = new Meld(MeldType.PUNG, drag1, true);
        const char1bm = new Meld(MeldType.KONG, char1b, false);
        const flower2m = new Meld(MeldType.PUNG, flower2, false); // invalid meld of flowers

        assert.isFalse(bad.isValid());
        assert.isTrue(char1m.isValid());
        assert.isFalse(char8m.isValid());
        assert.isFalse(wind3m.isValid());
        assert.isTrue(wind3mb.isValid());
        assert.isTrue(drag1m.isValid());
        assert.isTrue(char1bm.isValid());
        assert.isFalse(flower2m.isValid());
    });

    it('identifies honors and terminals', () => {
        const char1 = new Tile(TileType.CHARACTER, 1);
        const char8 = new Tile(TileType.CHARACTER, 8);
        const wind3 = new Tile(TileType.WIND, 3);
        const drag1 = new Tile(TileType.DRAGON, 1);

        const char1m = new Meld(MeldType.CHOW, char1, true);
        const wind3mb = new Meld(MeldType.PAIR, wind3, true);
        const drag1m = new Meld(MeldType.PUNG, drag1, true);
        const char1bm = new Meld(MeldType.KONG, char1, false);

        assert.isFalse(char1m.isHonor());
        assert.isTrue(wind3mb.isHonor());
        assert.isTrue(drag1m.isHonor());

        assert.isFalse(char1m.isTerminal());
        assert.isTrue(char1bm.isTerminal());
        assert.isFalse(drag1m.isTerminal());

        assert.isTrue(char1m.hasTerminal());
        assert.isTrue(char1bm.hasTerminal());
    });

    it('extracts tiles array matching meld definition', () => {
        const char2 = new Tile(TileType.CHARACTER, 2);
        const chow = new Meld(MeldType.CHOW, char2, true);
        const tiles = chow.getTiles();

        assert.equal(tiles.length, 3);
        assert.equal(tiles[0].num, 2);
        assert.equal(tiles[1].num, 3);
        assert.equal(tiles[2].num, 4);

        const pung = new Meld(MeldType.PUNG, char2, false);
        assert.equal(pung.getTiles().length, 3);

        const kong = new Meld(MeldType.KONG, char2, false);
        assert.equal(kong.getTiles().length, 4);

        const pair = new Meld(MeldType.PAIR, char2, true);
        assert.equal(pair.getTiles().length, 2);
    });

    it('serializes to and from simplified JSON', () => {
        const dot3 = new Tile(TileType.DOT, 3);
        const meld = new Meld(MeldType.CHOW, dot3, false);
        const json = meld.simplifiedJSON();

        assert.equal(json.type, 'CHOW');
        assert.equal(json.isConcealed, false);

        const restored = Meld.fromSimplifiedJSON(json);
        assert.equal(restored.type, MeldType.CHOW);
        assert.isTrue(restored.firstTile.sameAs(dot3));
        assert.equal(restored.isConcealed, false);
    });
});
