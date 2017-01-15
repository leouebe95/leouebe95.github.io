// for eslint
/* global Tile:false strRes:false
 */

/**
  Description of a meld. For a Chow, the meld is (_firstTile, _firstTile+1,
  _firstTile+2). For a Pair, Pung or Kong, the meld is 2, 3 or 4 times
  _firstTile.
 */
class Meld {
    constructor(type, firstTile, isConcealed) {
	    this._type			= type;			   //!< Kind of meld
	    this._firstTile		= firstTile;	   //!< First tile of the meld
	    this._isConcealed	= isConcealed;	   //!< Was the meld concealed
    }

	/**
	  @return {Meld} a deep copy of the current object
	*/
	clone() {
		return new Meld(this._type,
						this._firstTile.clone(),
						this._isConcealed);
	}

	/**
        @return {Boolean} true if the object represents a valid meld.
	 */
	isValid() {
		if (this._type === Meld.MeldType.CHOW) {
			// There is no Chow of honors
			if (this._firstTile.isRegular() && (this._firstTile._num < 8)) {
				return true;
            }
		} else if (this._firstTile.isRegular() || this._firstTile.isHonor()) {
			return true;
		}
		return false;
	}

	/**
        @return {Boolean} true is the meld is made of dragon or wind
    */
	isHonor() {
		return this.isValid() && this._firstTile.isHonor();
	}

	/** @return {Boolean} true is the meld is made of Terminal only */
	isTerminal() {
		return ((this._type !== Meld.MeldType.CHOW) &&
				this._firstTile.isTerminal());
	}

	/** @return {Boolean} true is the meld contains at lease one Terminal tile */
	hasTerminal() {
		if (this._type === Meld.MeldType.CHOW) {
			return ((this._firstTile._num === 1) || (this._firstTile._num === 7));
		}
        return this._firstTile.isTerminal();
	}

	/** @return {Boolean} the name of the meld.
	 */
	toString() {
		if (this.isValid()) {
			var tileName = this._firstTile.toString();
			switch (this._type) {
			case Meld.MeldType.CHOW: return strRes("CHOW_OF").format(tileName);
			case Meld.MeldType.PUNG: return strRes("PUNG_OF").format(tileName);
			case Meld.MeldType.KONG: return strRes("KONG_OF").format(tileName);
			case Meld.MeldType.PAIR: return strRes("PAIR_OF").format(tileName);
			}
		}
		return strRes("UNDEFINED");
	}

	/** Comparable interface for sorting.
	  @param {Meld} meld1 First Meld to compare.
	  @param {Meld} meld2 Second Meld to compare.
	  @return {Int} -1 0 or 1.
	  Sort all chows first, then pungs and kongs.
	  Within blocks, sort per first tile
	  Leave the pair last
	 */
	static compare(meld1, meld2) {
		if (meld2._type !== meld1._type) {
			if (meld2._type === Meld.MeldType.CHOW) {return 1;}
		    if (meld1._type === Meld.MeldType.CHOW) {return -1;}
    		if (meld2._type === Meld.MeldType.PAIR) {return -1;}
            if (meld1._type === Meld.MeldType.PAIR) {return 1;}

			// Else we have a pung and kong which compare equal
		}

		return Tile.compare(meld1._firstTile, meld2._firstTile);
	}

	/*!
	  @return {Object} A simple object containign minimal values to recreate a hand
	 */
	simplifiedJSON() {
		var result = new Object();
		for (var typeId in Meld.MeldType) {
			var type = Meld.MeldType[typeId];
			if (type === this._type) {
				result.type = typeId;
				break;
			}
		}

		result.firstTile   = this._firstTile.simplifiedJSON();
		result.isConcealed = this._isConcealed;
		return result;
	}

	/*!
	  @return {Meld} A new meld recreated from a simplified object.
	  The simplified object can come from a JSON conversion.
	 */
	static fromSimplifiedJSON(simplified) {
		var type;
		for (var typeId in Meld.MeldType) {
			type = Meld.MeldType[typeId];
			if (typeId === simplified.type) {
				break;
            }
		}
		return new Meld(type,
						Tile.fromSimplifiedJSON(simplified.firstTile),
						simplified.isConcealed);
	}
}

Meld.MeldType = { CHOW: 0, PUNG: 1, KONG: 2, PAIR: 3 };
/** Global constant to represent an invalid meld */
Meld._kBadMeld = new Meld(Meld.MeldType.CHOW, Tile._kBadTile, false);
