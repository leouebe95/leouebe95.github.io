// For eslint
/* global QUnit:false Tile:false */
/* exported Tile_Test */

function Tile_Test() {
    "use strict";

    QUnit.module("Tile");

    QUnit.test("basic", function(assert) {
	    // FIXME: Any shorter way to access _kBadTile and TileType?
	    var bad = Tile._kBadTile;
	    var char1 = new Tile(Tile.TileType.CHARACTER, 1);
	    var char3 = new Tile(Tile.TileType.CHARACTER, 3);
	    var wind3 = new Tile(Tile.TileType.WIND, 3);
	    var drag1 = new Tile(Tile.TileType.DRAGON, 1);
	    var char1b = new Tile(Tile.TileType.CHARACTER, 1);
	    var flower2 = new Tile(Tile.TileType.FLOWER, 2);

	    // Check each method
	    assert.equal(bad.isValid(), false);
	    assert.equal(char1.isValid(), true);

	    // Warning: all "kBadTile" are considered different
	    assert.equal(bad.sameAs(Tile._kBadTile), false);
	    assert.equal(char1.sameAs(bad), false);
	    assert.equal(char1.sameAs(drag1), false);
	    assert.equal(char1.sameAs(char1b), true);

	    assert.equal(bad.isFlower(), false);
	    assert.equal(char1.isFlower(), false);
	    assert.equal(char1.isFlower(), false);
	    assert.equal(wind3.isFlower(), false);
	    assert.equal(drag1.isFlower(), false);
	    assert.equal(flower2.isFlower(), true);

	    assert.equal(bad.isHonor(), false);
	    assert.equal(char1.isHonor(), false);
	    assert.equal(wind3.isHonor(), true);
	    assert.equal(drag1.isHonor(), true);
	    assert.equal(flower2.isHonor(), false);

	    assert.equal(bad.isTerminal(), false);
	    assert.equal(char1.isTerminal(), true);
	    assert.equal(char3.isTerminal(), false);
	    assert.equal(wind3.isTerminal(), false);
	    assert.equal(drag1.isTerminal(), false);
	    assert.equal(flower2.isTerminal(), false);

	    assert.equal(bad.isRegular(), false);
	    assert.equal(char1.isRegular(), true);
	    assert.equal(char3.isRegular(), true);
	    assert.equal(wind3.isRegular(), false);
	    assert.equal(drag1.isRegular(), false);
	    assert.equal(flower2.isRegular(), false);

	    assert.equal(bad.toString(),	 "Bad Tile (-10,bamboo)");
	    assert.equal(char1.toString(),   "character-1");
	    assert.equal(char3.toString(),   "character-3");
	    assert.equal(wind3.toString(),   "West");
	    assert.equal(drag1.toString(),   "White Dragon");
	    assert.equal(flower2.toString(), "Orchid");
    });
}
