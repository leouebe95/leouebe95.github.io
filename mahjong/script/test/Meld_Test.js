// For eslint
/* global QUnit:false Tile:false Meld:false */
/* exported Meld_Test */

/**
   Unit test function for Meld.
*/
function Meld_Test() {
    'use strict';

    QUnit.module('Meld');

    QUnit.test('basic', function(assert) {
		var bad = Meld._kBadMeld;

		var char1   = new Tile(Tile.TileType.CHARACTER, 1);
		var char8   = new Tile(Tile.TileType.CHARACTER, 8);
		var wind3   = new Tile(Tile.TileType.WIND, 3);
		var drag1   = new Tile(Tile.TileType.DRAGON, 1);
		var char1b  = new Tile(Tile.TileType.CHARACTER, 1);
		var flower2 = new Tile(Tile.TileType.FLOWER, 2);

		var char1m   = new Meld(Meld.MeldType.CHOW, char1, true);
		var char8m   = new Meld(Meld.MeldType.CHOW, char8, false);
		var wind3m   = new Meld(Meld.MeldType.CHOW, wind3, false);
		var wind3mb  = new Meld(Meld.MeldType.PAIR, wind3, true);
		var drag1m   = new Meld(Meld.MeldType.PUNG, drag1, true);
		var char1bm  = new Meld(Meld.MeldType.KONG, char1b, false);
		var flower2m = new Meld(Meld.MeldType.PUNG, flower2, false);

		// Check each method
		assert.equal(bad.isValid(),			false);
		assert.equal(char1m.isValid(),		true);
		assert.equal(char8m.isValid(),		false);
		assert.equal(wind3m.isValid(),		false);
		assert.equal(wind3mb.isValid(),		true);
		assert.equal(drag1m.isValid(),		true);
		assert.equal(char1bm.isValid(),		true);
		assert.equal(flower2m.isValid(),	false);

		assert.equal(bad.isHonor(),			false);
		assert.equal(char1m.isHonor(),		false);
		assert.equal(char8m.isHonor(),		false);
		assert.equal(wind3m.isHonor(),		false);
		assert.equal(wind3mb.isHonor(),		true);
		assert.equal(drag1m.isHonor(),		true);
		assert.equal(char1bm.isHonor(),		false);
		assert.equal(flower2m.isHonor(),	false);

		assert.equal(bad.isTerminal(),		false);
		assert.equal(char1m.isTerminal(),	false);
		assert.equal(char8m.isTerminal(),	false);
		assert.equal(wind3m.isTerminal(),	false);
		assert.equal(wind3mb.isTerminal(),	false); // pair
		assert.equal(drag1m.isTerminal(),	false);
		assert.equal(char1bm.isTerminal(),	true);
		assert.equal(flower2m.isTerminal(),	false);

		assert.equal(bad.hasTerminal(),		false);
		assert.equal(char1m.hasTerminal(),	true);
		assert.equal(char8m.hasTerminal(),	false);
		assert.equal(wind3m.hasTerminal(),	false);
		assert.equal(wind3mb.hasTerminal(),	false); // pair
		assert.equal(drag1m.hasTerminal(),	false);
		assert.equal(char1bm.hasTerminal(),	true);
		assert.equal(flower2m.hasTerminal(), false);

		assert.equal(bad.toString(),		'Undefined');
		assert.equal(char1m.toString(),		'Chow of character-1');
		assert.equal(char8m.toString(),		'Undefined');
		assert.equal(wind3m.toString(),		'Undefined');
		assert.equal(wind3mb.toString(),	'Pair of West');
		assert.equal(drag1m.toString(),		'Pung of White Dragon');
		assert.equal(char1bm.toString(),	'Kong of character-1');
		assert.equal(flower2m.toString(),	'Undefined');
    });
}
