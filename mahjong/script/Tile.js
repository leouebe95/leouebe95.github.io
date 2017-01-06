// eslint
/* global strRes:false */

/**
  Utility class responsible to define each tiles.
*/
class Tile {
    constructor(type, num) {
	    /** Tile suit */
	    this._type = type;
	    /** Number in the suit */
	    this._num = num;
	    /** Unique Id valid for all suits */
	    this._tileId = Tile.uniqueId(type, num);
    }

	/**
       Return a unique Id for the given tile.
	   @param {Tile.TileType} type Type of the tile.
	   @param {Int} num Number in the tile suit.
	   @return {Int} The unique Id.
	*/
    static uniqueId(type, num) {
		num -= 1;				// 1-based to 0-based
		if ((num < 0) || (num >= type.len)) {
			return Tile._kBadId;
		}
        return type.offset + num;
	}

	/**
	   @return {Tile} A deep copy of the current object
	*/
	clone() {
		return new Tile(this._type, this._num);
	}

	/**
	   @param {Int} num Number of tiles to move to in this suit
	   (positive or negative).
	   @return {Tile} a new tile, next in the suit
	*/
	next(num) {
		return new Tile(this._type, this._num+num);
	}

	/**
	   @param {Tile} tile The other tile to compare with.
       @return {Boolean} True if the tile is a valid one.
	*/
	sameAs(tile) {
		if ((this._tileId !== Tile._kBadId) &&
            (this._tileId === tile._tileId)) {
			return true;
        }
		return false;
	}

	/**
       @return {Boolean} true if the tile is a valid one.
	 */
	isValid() {
		if (this._tileId === Tile._kBadId) {
			return false;
        }
		return true;
	}

	/**
        @return{Boolean} true if the tile is a flower or a season.
	 */
	isFlower() {
		if (this.isValid() &&
			((this._type === Tile.TileType.FLOWER) ||
			 (this._type === Tile.TileType.SEASON))) {
			return true;
        }
		return false;
	}

	/**
       @return{Boolean} true if the tile is a dragon or a wind.
	 */
	isHonor() {
		if (this.isValid() &&
			((this._type === Tile.TileType.DRAGON) ||
			 (this._type === Tile.TileType.WIND))) {
			return true;
        }
		return false;
	}

	/**
       @return{Boolean} true if the tile is a 1 or 9
	 */
	isTerminal() {
		if (this.isRegular() && ((this._num === 1) || (this._num === 9))) {
			return true;
        }
		return false;
	}

	/**
        @return{Boolean} true if the tile is a not dragon nor a wind.
	 */
	isRegular() {
		if (this.isValid() &&
			((this._type === Tile.TileType.BAMBOO) ||
			 (this._type === Tile.TileType.CHARACTER) ||
			 (this._type === Tile.TileType.DOT))) {
			return true;
        }
		return false;
	}

	/**
       @return{String} the name of the tile.
	   @Override
	*/
	toString() {
		if (!this.isValid()) {
			return strRes("BAD_TILE").format(this._type.name, this._num);
        }

		switch (this._type.id) {
		case Tile.TileType.DRAGON.id: return strRes(Tile._kDragons[this._num-1]);
		case Tile.TileType.WIND.id:   return strRes(Tile._kWinds  [this._num-1]);
		case Tile.TileType.FLOWER.id: return strRes(Tile._kFlowers[this._num-1]);
		case Tile.TileType.SEASON.id: return strRes(Tile._kSeasons[this._num-1]);
		}

		return strRes("TILE_FORMAT").format(this._num,
											strRes(this._type.name));
	}

	/**
	    @param {Tile.TileType} type Tile type.
	    @param {Int} num 1-based index in the tile suit.
        @return {String} the file name for the given tile. Return "empty" if the
	    tile is not valid.
	 */
	fileName(type, num) {
		if (num === undefined) {num = this._num;}
		if (type === undefined) {type = this._type;}
        var id = Tile.uniqueId(type, num);
        if (id<0) {return "empty";} // NOI18N

        return type.name+"_"+type.ext[num-1];
    }

	/**
       Comparable interface for sorting.
	   @param {Tile} tile1 First Tile to compare.
	   @param {Tile} tile2 Second Tile to compare.
	   @return {Int} -1 0 or 1.
	 */
	compare(tile1, tile2) {
		var t1 = tile2._tileId;
		var t2 = tile1._tileId;
		if (t1 < 0) {t1 = 100;}
		if (t2 < 0) {t2 = 100;}

		if (t1 < t2) {return 1;}
		if (t1 > t2) {return -1;}

		return 0;
	}

	/**
	  @return {Object} A simple object containing minimal values to recreate a tile.
	 */
	simplifiedJSON() {
		var result = new Object();
		result.type = this._type.name;
		result.num  = this._num;
		return result;
	}

	/**
	   @param {Object} simplified A simple object representing the
	   tile. Created with simplifiedJSON.
	   @return {Tile} A new Tile recreated from a simplified object.
	   The simplified object can come from a JSON conversion.
	 */
	static fromSimplifiedJSON(simplified) {
		var type;
		for (var typeId in Tile.TileType) {
			type = Tile.TileType[typeId];
			if (type.name === simplified.type) {
				break;
            }
		}
		return new Tile(type, simplified.num);
	}
}

/** Invalid tile id */
Tile._kBadId = -10;

/** Resource names of the 3 dragons */
Tile._kDragons = ["WHITE_DR", "GREEN_DR", "RED_DR"];
/** Resource names of the 4 winds */
Tile._kWinds =   ["EAST", "NORTH", "WEST", "SOUTH"];
/** Resource names of the 4 flowers */
Tile._kFlowers = ["PLUM", "ORCHID", "CHRYSANT", "BAMBOO"];
/** Resource names of the 4 seasons */
Tile._kSeasons=  ["SPRING", "SUMMER", "AUTUMN", "WINTER"];

/** Tile types */
Tile.TileType = {
	BAMBOO:		{id:0, len:9, offset: 0, name:"bamboo",    ext:"123456789"},
	CHARACTER:	{id:1, len:9, offset: 9, name:"character", ext:"123456789"},
	DOT:		{id:2, len:9, offset:18, name:"dot",       ext:"123456789"},
	DRAGON:		{id:3, len:3, offset:27, name:"dragon",    ext:"wgr"},
	WIND:		{id:4, len:4, offset:30, name:"wind",      ext:"enws"},
	FLOWER:		{id:5, len:4, offset:34, name:"flower",    ext:"1234"},
	SEASON:		{id:6, len:4, offset:38, name:"season",    ext:"1234"}};

/** Max value of _tileId */
Tile._kNumberDifferentTiles = Tile.TileType.SEASON.offset + Tile.TileType.SEASON.len;

/** Special constant to represent an invalid tile */
Tile._kBadTile = new Tile(Tile.TileType.BAMBOO, Tile._kBadId);
