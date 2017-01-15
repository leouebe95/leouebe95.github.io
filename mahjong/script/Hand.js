// For eslint
/* global Meld:false Tile:false */
/* exported Hand */

/**
  Description of a hand
 */
class Hand {
    constructor() {
	    // Call reset to create and init all values
	    this.reset();
    }

	/*!
	  @return: a deep copy of the current object
	*/
	clone() {
		var result = new Hand();

		// Copy simple values
		result._isNormal			= this._isNormal;
		result._lastTile			= this._lastTile;
		result._selfDrawn			= this._selfDrawn;
		result._lastTileDrawn		= this._lastTileDrawn;
		result._lastExistingTile	= this._lastExistingTile;
		result._robbedKong			= this._robbedKong;
		result._replacementTile		= this._replacementTile;
		result._tableWind			= this._tableWind.clone();
		result._playerWind			= this._playerWind.clone();
		result._valueHint			= this._valueHint;

		// Copy the arrays. A simple assignment will share
		// them.
		// We cannot use the simple JSON stringify/parse because it
		// does not preserve the type of objects.
		// end does not work well either...
		// So go with a brute force explicit copy
		var i;
		for (i = 0 ; i<14 ; i++) {
			result._tiles[i] = this._tiles[i].clone();
        }
		for (i = 0 ; i<5 ; i++) {
			result._melds[i] = this._melds[i].clone();
        }
		for (i = 0 ; i<8 ; i++) {
			result._flowers[i] = this._flowers[i].clone();
        }
		return result;
	}

	//! Reset the hand to an empty one.
	reset() {
		this._isNormal				= true;
		this._lastTile				= -1;
		this._selfDrawn				= false;
		this._lastTileDrawn			= false;
		this._robbedKong			= false;
		this._lastExistingTile		= false;
		this._replacementTile		= false;
		this._tableWind				= Tile._kBadTile;
		this._playerWind			= Tile._kBadTile;
		this._valueHint				= -1;
		this._tiles = [];
		this._melds = [];
		this._flowers = [];

		var i;
		for (i = 0 ; i<14 ; i++) {
			this._tiles[i] = Tile._kBadTile;
        }
		for (i = 0 ; i<5 ; i++) {
			this._melds[i] = Meld._kBadMeld;
        }
		for (i = 0 ; i<8 ; i++) {
			this._flowers[i] = Tile._kBadTile;
	    }
    }

	get valueHint() { return this._valueHint; }

	/*!
	  Defines the type of hand. This resets all tiles and melds in the hand.
	  @param[in] normalHand True for a normal one, false for a special one.
	*/
	setType(normalHand) {
		this.reset();
		this._isNormal = normalHand;
	}

	/*!
	  Set the prevalent and player winds.
	*/
	setWinds(tableWind, playerWind) {
		this._tableWind  = tableWind;
		this._playerWind = playerWind;
	}

	/*!
	  Add a tile to a special hand. No-op if the tile is a flower or if 14
	  tiles have been added already.
	  @param[in] tile Tile to add.
	*/
	addTile(tile) {
		if ((!this._isNormal) && (tile.isRegular() || tile.isHonor())) {
			// TODO: check that the tile is not already added 4 times
			for (var i = 0 ; i<14 ; i++) {
				if (!this._tiles[i].isValid()) {
					this._tiles[i] = tile;
					return;
				}
			}
		}
	}

	/*!
	  Add a flower to the hand. No-op if the tile is a not flower or if it
	  is already added.
	  @param[in] tile Flower to add.
	*/
	addFlower(tile) {
		if (!tile.isFlower()) {
			return;
        }

		for (var i = 0 ; i<8 ; i++) {
			if (!this._flowers[i].isValid()) {
				this._flowers[i] = tile;
				return;
			}
			if (this._flowers[i].sameAs(tile)) {
				// Flower already added
				return;
			}
		}
	}

	/*!
	  True if this flower/season is in the hand
	  @param[in] tile Flower to test.
	*/
	hasFlower(tile) {
		if (!tile.isFlower()) {
			return false;
        }

		for (var i = 0 ; i<8 ; i++) {
			if (this._flowers[i].sameAs(tile)) {
				// Flower already added
				return true;
			}
		}
		return false;
	}

	/*!
	  Add a meld to a regular hand. No-op if the tile is a flower or is
	  illegal to form the meld.
	  @param[in] type Meld type.
	  @param[in] tile Tile to add.
	  @param[in] concealed True is the meld is concealed.
	*/
	addMeld(type, tile, concealed) {
		if (!this._isNormal) {
			//Globals.reporter().msg("addMeld: special hand");
			return;
		}

		var meld = new Meld(type, tile, concealed);
		if (!meld.isValid()) {
			//Globals.reporter().msg("addMeld: invalid meld");
			//Globals.reporter().msg("         tile="+tile.toString());
			return;
		}

		if (type === Meld.MeldType.PAIR) {
			this._melds[4] = meld;
		} else {
			for (var i = 0 ; i<4 ; i++) {
				if (! this._melds[i].isValid()) {
					// TODO: check that the tile is not already added 4 times
					this._melds[i] = meld;
					break;
				}
			}
		}
	}

	/*! Return an integer array couting all the tiles used in the Hand
	 */
	countTiles() {
		var len = Tile._kNumberDifferentTiles;
		var count = [];
		var i;

		for (i=0 ; i<len ; i++) {
			count[i] = 0;
        }

		if (this._isNormal) {
			for (i = 0 ; i<5 ; i++) {
				if (this._melds[i].isValid()) {
					var indx = this._melds[i]._firstTile._tileId;
					switch (this._melds[i]._type) {
					case Meld.MeldType.CHOW:
						count[indx]++;
						count[indx+1]++;
						count[indx+2]++;
						break;
					case Meld.MeldType.PUNG:
						count[indx] += 3;
						break;
					case Meld.MeldType.KONG:
						count[indx] += 4;
						break;
					case Meld.MeldType.PAIR:
						count[indx] += 2;
						break;
					}
				}
			}
		} else {
			for (i = 0 ; i<14 ; i++) {
				if (this._tiles[i].isValid()) {
					count[this._tiles[i]._tileId]++;
                }
            }
		}

		// Count the flowers
		for (i = 0 ; i<8 ; i++) {
			if (this._flowers[i]._tileId >=0 ) {
				count[this._flowers[i]._tileId] ++;
			}
		}
		return count;
	}

	//! @return True is the hand is complete.
	isComplete() {
		if (!(this._tableWind.isValid() &&
			  this._playerWind.isValid() &&
			  (this._lastTile >= 0))) {
            return false;
        }
            
		if (this._isNormal) {
            for (let i=0 ; i<5 ; i++) {
				if (!this._melds[i].isValid()) {
					return false;
                }
            }
		} else {
            for (let i=0 ; i<14 ; i++) {
				if (!this._tiles[i].isValid()) {
					return false;
                }
            }
		}

		return true;
	}

	//! @return True is the hand is valid.
	isValid() {
        var count = this.countTiles();
		for (var i=0 ; i<count.length ; i++) {
            if (i >= Tile.TileType.FLOWER.offset) {
                if (count[i] > 1) {
                    return false;
                }
            } else {
                if (count[i] > 4) {
                    return false;
                }
            }
        }

		return true;
	}

	//! Recompute the concealed flag for the last meld.
	fixConcealed() {
		if (this._isNormal && (this._lastTile >= 0)) {
			var meld = Math.floor(this._lastTile/3);
			if (meld < 4) {
				// The last meld is considered as concealed if
				// selfdrawn, melded otherwise.
				this._melds[meld]._isConcealed = this._selfDrawn;
			}
		}
	}

	//! @return a sorted version of the hand. It returns a new copy.
	sortedHand() {
		var hand = this.clone();
		hand._tiles.sort(Tile.compare);
		hand._melds.sort(Meld.compare);
		hand._flowers.sort(Tile.compare);

		// need to remap _lastTile
		if (this._lastTile >= 0) {
			if (this._isNormal) {
				var meld = Math.floor(this._lastTile/3);
				var pos = this._lastTile - meld*3;
				if (meld < 4) {
					var tile = this._melds[meld]._firstTile;
					var concealed = this._melds[meld]._isConcealed;
					for (let i = 0 ; i<4 ; i++) {
						if (hand._melds[i]._firstTile.sameAs(tile) &&
							(hand._melds[i]._isConcealed === concealed)) {
							hand._lastTile = i*3+pos;
							break;
						}
					}
				}
			} else if ((this._lastTile >= 0) && (this._lastTile < 14)) {
				for (let i = 0 ; i<14 ; i++) {
					if (hand._tiles[i].sameAs(this._tiles[this._lastTile])) {
						hand._lastTile = i;
						break;
					}
				}
			}
		}

		return hand;
	}

	/*! @return An array of 5 booleans true for each of the suits and
	  dragon / wind present in the the hand
	*/
	suits() {
		var suits = [false, false, false, false, false];
		if (this._isNormal) {
			for (let i=0 ; i<5 ; i++) {
				switch (this._melds[i]._firstTile._type) {
				case Tile.TileType.BAMBOO:		suits[0] = true; break;
				case Tile.TileType.CHARACTER:		suits[1] = true; break;
				case Tile.TileType.DOT:   		suits[2] = true; break;
				case Tile.TileType.DRAGON:        suits[3] = true; break;
				case Tile.TileType.WIND:			suits[4] = true; break;
				}
			}
		} else {
			for (let i=0 ; i<14 ; i++) {
				switch (this._tiles[i]._type) {
				case Tile.TileType.BAMBOO:		suits[0] = true; break;
				case Tile.TileType.CHARACTER:		suits[1] = true; break;
				case Tile.TileType.DOT:   		suits[2] = true; break;
				case Tile.TileType.DRAGON:        suits[3] = true; break;
				case Tile.TileType.WIND:			suits[4] = true; break;
				}
			}
		}
		return suits;
	}

	/*!
	  @return the number of chows (excluding the pair)
	*/
	chows() {
		var chows = 0;
		if (this._isNormal) {
			for (var i=0 ; i<4 ; i++) {
				if (this._melds[i]._type === Meld.MeldType.CHOW) {
					chows++;
                }
			}
		}
		return chows;
	}

	/*!
	  @return {Object} number of concealed kongs, and
	  number of melded ones.
	*/
	kongs() {
		var kongs = {concealed: 0, melded: 0};
		if (!this._isNormal) { return kongs; }
		for (var i=0 ; i<4 ; i++) {
			if (this._melds[i]._type === Meld.MeldType.KONG) {
				if (this._melds[i]._isConcealed) {
					kongs.concealed++;
				} else {
					kongs.melded++;
                }
			}
		}
		return kongs;
	}

	/*! @return the number of dragon Pung or Kong
	 */
	dragons() {
		var dragons = 0;
		if (this._isNormal) {
			for (var i=0 ; i<4 ; i++) {
				if (this._melds[i]._firstTile._type === Tile.TileType.DRAGON) {
					dragons++;
                }
			}
		}
		return dragons;
	}

	/*! @return the number of wind Pung or Kong
	 */
	winds() {
		var winds = 0;
		if (this._isNormal) {
			for (var i=0 ; i<4 ; i++) {
				if (this._melds[i]._firstTile._type === Tile.TileType.WIND) {
					winds++;
			    }
            }
		}
		return winds;
	}

	/*! @return the number of wind Pung or Kong
	 */
	flowers() {
		var flowers = 0;
		for (var i = 0 ; i<8 ; i++ ) {
			if (this._flowers[i].isValid()) {
				flowers++;
            }
        }
		return flowers;
	}

	/*!
	  @param[in] min Min value for the the tiles.
	  @param[in] max Max value for the the tiles.
	  @return True if all tiles are regular and between min and max inclusive.
	 */
	minMax(min, max) {
        if (this._isNormal) {
            for (let i=0 ; i<5 ; i++) {
                var t = this._melds[i]._firstTile;
                if (!t.isRegular()) {return false;}

                if (this._melds[i]._type === Meld.MeldType.CHOW) {
                    if ((t._num < min) || (t._num+2 > max)) {
                        return false;
                    }
                } else {
                    if ((t._num < min) || (t._num > max)) {
                        return false;
                    }
                }
            }
		} else {
            for (let i=0 ; i<14 ; i++) {
                if (!this._tiles[i].isRegular()) {return false;}
                if ((this._tiles[i]._num < min) || (this._tiles[i]._num > max)) {
                    return false;
                }
            }
        }
		return true;
	}

	/*! @return the number of concealed melds (excluding the pair)
	 */
	concealed() {
		var concealed = 0;
		if (this._isNormal) {
			for (var i=0 ; i<4 ; i++) {
				if (this._melds[i]._isConcealed) {
					concealed++;
                }
			}
		}
		return concealed;
	}

	/*!
	  @return A simple object containing minimal values to recreate
	  a hand. Suitable for a JSON conversion.
	 */
	simplifiedJSON() {
		var result = new Object();

		// Copy simple values
		result.isNormal			= this._isNormal;
		result.lastTile			= this._lastTile;
		result.selfDrawn		= this._selfDrawn;
		result.lastTileDrawn	= this._lastTileDrawn;
		result.lastExistingTile	= this._lastExistingTile;
		result.robbedKong		= this._robbedKong;
		result.replacementTile	= this._replacementTile;

		result.tableWind		= this._tableWind.simplifiedJSON();
		result.playerWind		= this._playerWind.simplifiedJSON();
		result.valueHint		= this._valueHint;

		result.flowers = [];
		var i;
		for (i = 0 ; i<8 ; i++) {
			if (this._flowers[i].isValid()) {
				result.flowers.push(this._flowers[i].simplifiedJSON());
            }
        }
		if (this._isNormal) {
			result.melds = [];
			for (i = 0 ; i<5 ; i++) {
				result.melds[i] = this._melds[i].simplifiedJSON();
            }
		} else {
			result.tiles = [];
			for (i = 0 ; i<14 ; i++) {
				result.tiles[i] = this._tiles[i].simplifiedJSON();
            }
		}

		return result;
	}

	/*!
	  @return A new hand recreated from a simplified object.
	  The simplified object can come from a JSON conversion.
	 */
	static fromSimplifiedJSON(simplified) {
		var result = new Hand();

		// Copy simple values
		result._isNormal		= simplified.isNormal;
		result._lastTile		= simplified.lastTile;
		result._selfDrawn		= simplified.selfDrawn;
		result._lastTileDrawn	= simplified.lastTileDrawn;
		result._lastExistingTile= simplified.lastExistingTile;
		result._robbedKong		= simplified.robbedKong;
		result._replacementTile	= simplified.replacementTile;

		result._tableWind		= Tile.fromSimplifiedJSON(simplified.tableWind);
		result._playerWind		= Tile.fromSimplifiedJSON(simplified.playerWind);
		result._valueHint		= simplified.valueHint;

		var i;
		for (i = 0 ; i<simplified.flowers.length ; i++) {
			result._flowers[i] = Tile.fromSimplifiedJSON(simplified.flowers[i]);
        }
		if (simplified.isNormal) {
			for (i = 0 ; i<5 ; i++) {
				result._melds[i] = Meld.fromSimplifiedJSON(simplified.melds[i]);
            }
		} else {
			for (i = 0 ; i<14 ; i++) {
				result._tiles[i] = Tile.fromSimplifiedJSON(simplified.tiles[i]);
            }
		}

		return result;
	}
}
