// eslint
/* global Meld:false Tile:false strRes:false */

/**
	Private class used to describe one rule.
	The constructor can use a variable number of arguments.

	int indx, int score, String desc, [boolean special, boolean normal], int ... implies
	if special and normal are ommited, they are set to false, true
 */
function Rule() {
    "use strict";

	//! Reset a rule. The implied array is emptied
	Rule.prototype.reset = function(indx, score, desc, special, normal) {
		this._indx    = indx;	//!< int: Rule official Id
		this._score   = score;	//!< int: Number of points
		this._desc    = desc;	//!< string: Rule name
		this._special = special;//!< boolean: Rule applies to special hands
		this._normal  = normal;	//!< boolean: Rule applies to normal hands
		this._implies = [];		//!< int[]: Rules automatically implied
	};

	/*!
	  Add a series of implied rules. Argument is an array of integer. Each
	  element is supposed to be an integer (rule id).
	  For example:
		 rule.implies([0]);
		 rule.implies([0, 1, 6, 7]);
	 */
	Rule.prototype.implies = function(args) {
		for (var i = 0; i < args.length; i++) {
			this._implies.push(args[i]);
		}
	};

	// Convert arguments to a real Array
	var args = Array.prototype.slice.call(arguments);

	var indx = args.shift();
	var score = args.shift();
	var desc = args.shift();
	var special = false;
	var normal = true;

	if ((args.length > 0) && ((typeof args[0]) === "boolean")) {
		special = args.shift();
		normal = args.shift();
	}

	// Use reset, to create the fields
	this.reset(indx, score, desc, special, normal);
	this.implies(args);
}


/**
    Description of the entire ruleset
 */
function HandRules() {
    "use strict";

	HandRules.prototype.reset = function() {
		this._activesRules = [];			// 0-based boolean array[_nbRules]
		this._matchedRules = [];			// 1-based boolean array[_nbRules+1]
		this._rulesDescriptions = [];		// Variable length string array
	};

	this.reset();
}


HandRules.prototype = {
	_data: [
		new Rule( 1, 1, "PURE_DOUBLE_CHOW"),
		new Rule( 2, 1, "MIXED_DOUBLE_CHOW"),
		new Rule( 3, 1, "SHORT_STRAIGHT"),
		new Rule( 4, 1, "TWO_TERMINAL_CHOWS"),
		new Rule( 5, 1, "PUNG_OF_TERMINALS_OR_HONORS"),
		new Rule( 6, 1, "MELDED_KONG"),
		new Rule( 7, 1, "ONE_VOIDED_SUIT",		true, true),
		new Rule( 8, 1, "NO_HONORS",			true, true),
		new Rule( 9, 1, "EDGE_WAIT"),
		new Rule(10, 1, "CLOSED_WAIT"),
		new Rule(11, 1, "SINGLE_WAIT"),
		new Rule(12, 1, "SELF-DRAWN",			true, true),
		new Rule(13, 1, "FLOWER_TILES",			true, true),

		new Rule(14, 2, "DRAGON_PUNG"),
		new Rule(15, 2, "PREVALENT_WIND"),
		new Rule(16, 2, "SEAT_WIND"),
		new Rule(17, 2, "CONCEALED_HAND"),
		new Rule(18, 2, "ALL_CHOWS", 			true, true, 8),
		new Rule(19, 2, "TILE_HOG",				true, true),
		new Rule(20, 2, "DOUBLE_PUNG"),
		new Rule(21, 2, "TWO_CONCEALED_PUNGS"),
		new Rule(22, 2, "CONCEALED_KONG"),
		new Rule(23, 2, "ALL_SIMPLES",          true, true,		8),

		new Rule(24, 4, "OUTSIDE_HAND"),
		new Rule(25, 4, "FULLY_CONCEALED_HAND", true, true,		12),
		new Rule(26, 4, "TWO_MELDED_KONGS"),
		new Rule(27, 4, "LAST_TILE"),

		new Rule(28, 6, "ALL_PUNGS"),
		new Rule(29, 6, "HALF_FLUSH",			true, true,		7),
		new Rule(30, 6, "MIXED_SHIFTED_CHOWS"),
		new Rule(31, 6, "ALL_TYPES",			true, true),
		new Rule(32, 6, "MELDED_HAND",				11),
		new Rule(33, 6, "TWO_DRAGONS"),
		new Rule(34, 6, "ONE_MELDED_AND_ONE_CONCEALED_KONG", 22),

		new Rule(35, 8, "MIXED_STRAIGHT"),
		new Rule(36, 8, "REVERSIBLE_TILES",		true, true, 7),
		new Rule(37, 8, "MIXED_TRIPLE_CHOW",         2),
		new Rule(38, 8, "MIXED_SHIFTED_PUNGS"),
		new Rule(39, 8, "CHICKEN_HAND"),
		new Rule(40, 8, "LAST_TILE_DRAW"),
		new Rule(41, 8, "LAST_TILE_CLAIM"),
		new Rule(42, 8, "OUT_WITH_REPLACEMENT_TILE"),
		new Rule(43, 8, "TWO_CONCEALED_KONGS"),
		new Rule(44, 8, "ROBBING_THE_KONG"),

		new Rule(45, 12, "LESSER_HONORS_AND_KNITTED_TILES", true, false, 31),
		new Rule(46, 12, "KNITTED_STRAIGHT",	true, false),
		new Rule(47, 12, "UPPER_FOUR",          true, true,     8),
		new Rule(48, 12, "LOWER_FOUR",          true, true,     8),
		new Rule(49, 12, "BIG_THREE_WINDS"),

		new Rule(50, 16, "PURE_STRAIGHT",            3),
		new Rule(51, 16, "THREE-SUITED_TERMINAL_CHOWS", 2, 4, 8, 18),
		new Rule(52, 16, "PURE_SHIFTED_CHOWS"),
		new Rule(53, 16, "ALL_FIVES",                8, 23),
		new Rule(54, 16, "TRIPLE_PUNG",             20),
		new Rule(55, 16, "THREE_CONCEALED_PUNGS"),

		new Rule(56, 24, "SEVEN_PAIRS",			true, false),
		new Rule(57, 24, "GREATER_HONORS_AND_KNITTED_TILES", true, false, 31, 45),
		new Rule(58, 24, "ALL_EVEN",            true, true,     8, 23, 28),
		new Rule(59, 24, "FULL_FLUSH",          true, true,     7, 8, 29),
		new Rule(60, 24, "PURE_TRIPLE_CHOW",         1),
		new Rule(61, 24, "PURE_SHIFTED_PUNGS"),
		new Rule(62, 24, "UPPER_TILES",              8, 47),
		new Rule(63, 24, "MIDDLE_TILES",             8, 23),
		new Rule(64, 24, "LOWER_TILES",              8, 48),

		new Rule(65, 32, "FOUR_SHIFTED_CHOWS",      52),
		new Rule(66, 32, "THREE_KONGS"),
		new Rule(67, 32, "ALL_TERMINALS_AND_HONORS", true, true, 5, 24, 28),

		new Rule(68, 48, "PURE_QUADRUPLE_CHOW",      1, 7, 19, 60),
		new Rule(69, 48, "FOUR_PURE_SHIFTED_PUNGS", 28, 61),

		new Rule(70, 64, "ALL_TERMINALS",       true, true, 5,  8, 24, 28, 67),
		new Rule(71, 64, "LITTLE_FOUR_WINDS",       49),
		new Rule(72, 64, "LITTLE_THREE_DRAGONS",     7, 33),
		new Rule(73, 64, "ALL_HONORS",          true, true, 5,  7, 24, 28, 67),
		new Rule(74, 64, "FOUR_CONCEALED_PUNGS",     28),
		new Rule(75, 64, "PURE_TERMINAL_CHOWS",      1,  7,  8, 18, 29, 59),

		new Rule(76, 88, "BIG_FOUR_WINDS",           5,  7, 15, 16, 28, 49),
		new Rule(77, 88, "BIG_THREE_DRAGONS",        7, 14, 33),
		new Rule(78, 88, "ALL_GREEN",           true, true, 7, 29),
		new Rule(79, 88, "NINE_GATES",			true, false),
		new Rule(80, 88, "FOUR_KONGS",              28),
		new Rule(81, 88, "SEVEN_SHIFTED_PAIRS", true, false),
		new Rule(82, 88, "THIRTEEN_ORPHANS",	true, false, 31, 67)
	],


	/*!
	  Return a descrition of all rules that have been applied.
	  array of strings
	 */
	getDescription: function() { return this._rulesDescriptions; },


	/*!
	  Check if we have a knitted suite. Only consider the valid HU
	  hands: The 5 other tiles are either all honors or melds.

	  @param[in] hand (Hand)
	  @param[in] count (int[]) Count of each tiels in the hand

	  @return The number of tiles matched
	*/
	computeKnittedData: function(hand, count) {
        "use strict";

		// Private function to match remaining tiles to melds
		var matchMelds = function(left) {
			var count = left.slice(); // make a copy of the array
			for (var i = 0; i<count.length ; i++ ) {
				var suit = Math.floor(i/8);
				var num = i-8*suit;
				switch(count[i]) {
				case 1: // Can only match a CHOW
					if ((suit>3) || (num>7) ||
						(count[i+1]===0) || (count[i+2]===0)) {
						return -999;
                    }
					count[i+1]--;
					count[i+2]--;

					// look for a pair
					for (let j = i+1 ; j<count.length ; j++ ) {
						if (count[j] === 2) {
							return Meld.MeldType.CHOW;
                        }
                    }
					return -999;

				case 2: // Can match only a PAIR
					// Look for a CHOW or PUNG
					for (let j = i+1 ; j<count.length ; j++ ) {
						if (count[j] === 3) {
							return Meld.MeldType.PUNG;
                        }
						var suitj = Math.floor(j/8);
						var numj = j-8*suitj;
						if ((suitj<=3) && (numj <= 7) &&
							(count[j] === 1) &&
							(count[j+1] === 1) && (count[j+2] === 1)) {
							return Meld.MeldType.CHOW;
                        }
					}
					return -999;

				case 3: // Can match a CHOW + PAIR or PUNG
					// Chow + pair
					if ((suit<=3) && (num <= 7) &&
						(count[i+1] === 1) && (count[i+2] === 1)) {
						return Meld.MeldType.CHOW;
                    }

					// Got a pung, look for a pair
					for (var j = i+1 ; j<count.length ; j++ ) {
						if (count[j] === 2) {
							return Meld.MeldType.PUNG;
                        }
                    }
					return -999;

				case 4:
					return -999;
				}
			}
		};

		if (hand._isNormal) {return false;}

		// See if all honors are different, if so, compute the number of them.
		var nbHonors = 0;
		for (i = 0; i<7 ; i++) {
			if (count[Tile.TileType.DRAGON.offset+i] === 1) {
				nbHonors++;
            } else if (count[Tile.TileType.DRAGON.offset+i] > 1) {
				nbHonors = 0;
				break;
			}
		}

		// Try all 6 suit permutations
		var offsets = [Tile.TileType.BAMBOO.offset,
					   Tile.TileType.DOT.offset,
					   Tile.TileType.CHARACTER.offset];
		var perm = [[0, 1, 2], [0, 2, 1],
					[1, 0, 2], [1, 2, 0],
					[2, 0, 1], [2, 1, 0]];
		var knitted = [[0, 0], [0, 3], [0, 6],
					   [1, 1], [1, 4], [1, 7],
					   [2, 2], [2, 5], [2, 8]];
		for (var i=0 ; i<perm.length ; i++ ) {
			var knitMatch = 0;
			var p = perm[i];
			var left = count.slice();		// Make a copy of the array
			for (var j=0 ; j<knitted.length ; j++ ) {
				var i0 = knitted[j][0];
				var i1 = knitted[j][1];
				if (left[offsets[p[i0]] + i1] > 0) {
					left[offsets[p[i0]] + i1]--;
					knitMatch++;
				}
			}

			// Check if all tiles left are honors, and different
			if (knitMatch + nbHonors === 14) {
				return {"tiles": left, "knitMatch": knitMatch, "honors": true};
            }
			// Else, see if we have melds. This is only valid if we
			// have a full suit, one meld and one pair
			if (knitMatch === 9) {
				var what = matchMelds(left);
				if (what >= 0) {
					return {"tiles": left, "knitMatch": knitMatch,
							"honors": false,"what": what };
                }
			}
		}
		return {"knitMatch": 0};
	},

	/*!
	  Compute the number of concealed pungs. Used for the rule 2, 3
	  or 4 concealed pungs. For those rules, kongs can me counted as
	  well except for the case of 2 concealed kongs and no pung which
	  is already covered by the 2 concealed kongs rule.

	  @param[in] hand hand to test

	  @return the number pf pung+kong
	*/
	concealedPungs: function( hand) {
        "use strict";

		if (!hand._isNormal) {return 0;}

		var pungs = 0;
		var kong = 0;
		for (var i=0 ; i<4 ; i++) {
			if (hand._melds[i]._isConcealed) {
				if (hand._melds[i]._type === Meld.MeldType.PUNG) {
					pungs++;
                } else if (hand._melds[i]._type === Meld.MeldType.KONG) {
					kong++;
                }
			}
		}
		if ((pungs === 0) && (kong<3)) {return 0;}
		return pungs+kong;
	},

	/*!
	  Compute all rules for the hand, and determines which ones score
	  @param[in] handIn Hand to test

	  @return number of points
	*/
	compute: function(handIn) {
        "use strict";

		// Prepare hand to make rules computation easier
		var hand = handIn.sortedHand();
		hand.fixConcealed();

		// Reset the rule counters
		this.reset();

		// By default all rules may apply
		var ruleId;
		for (ruleId = 0 ; ruleId<this._nbRules ; ruleId++) {
			this._activesRules[ruleId] = true;
			this._matchedRules[ruleId+1] = false;
		}

		// Precompute common data
		var count = hand.countTiles();
		var suits = hand.suits();
		var kongs = hand.kongs();
		var nbConcealedPungs = this.concealedPungs(hand);
		var knittedData = this.computeKnittedData(hand, count);

		// Try all the rules starting by the largest number of points
		var nbRules = 0;
		var nbPoints = 0;
		var nbFlowerPoints = 0;
		var i, j, k;
        var used;
		for (ruleId = this._nbRules-1 ; ruleId>=0 ; ruleId-- ) {
			var isFlower = false;

			// Make sure the rule matches the normal / special hands.
			var active = true;
			if (hand._isNormal) {
				active = this._data[ruleId]._normal;
            } else {
				active = this._data[ruleId]._special;
            }
			this._activesRules[ruleId] = this._activesRules[ruleId] && active;

			// The rule may already have been deactivated by another
			// one taking precedence.
			if (! this._activesRules[ruleId]) {
				continue;
			}

			var matching = 0;
			// 0-based to user friendly 1-based
			switch (this._data[ruleId]._indx) {

			case 1: // Pure Double Chow
				for (i=0 ; i<3 ; i++) {
					if (hand._melds[i]._type !== Meld.MeldType.CHOW) {break;}
					if (hand._melds[i+1]._type !== Meld.MeldType.CHOW) {break;}

					if (hand._melds[i]._firstTile._tileId ===
						hand._melds[i+1]._firstTile._tileId) {
						matching++;
                    }
					// Do not break yet, this rule may match twice.
				}
				break;

			case 2: // Mixed Double Chow
			    used = [ false, false, false, false];
				for (i=0 ; i<3 ; i++) {
					if (used[i] || (hand._melds[i]._type !== Meld.MeldType.CHOW)) {
						continue;
                    }
					for (j=i+1 ; j<4 ; j++) {
						if (used[j] || hand._melds[j]._type !== Meld.MeldType.CHOW) {
							continue;
                        }

						// Will match Rule #1
						if (hand._melds[i]._firstTile._type === hand._melds[j]._firstTile._type) {
							continue;
                        }
						if (hand._melds[i]._firstTile._num === hand._melds[j]._firstTile._num) {
							matching++;
							used[i] = true;
							used[j] = true;
							// Do not break yet, this rule may match
							// twice, but neither i or j can be reused.
						}
					}
				}
				break;

			case 3: // Short Straight
				for (i=0 ; i<3 ; i++) {
					if ((hand._melds[i]._type !== Meld.MeldType.CHOW) ||
						(hand._melds[i]._firstTile._num > 4)) {
						continue;
                    }

					for (j=i+1 ; j<4 ; j++) {
						if ((hand._melds[j]._type === Meld.MeldType.CHOW) &&
							(hand._melds[i]._firstTile._num + 3 === hand._melds[j]._firstTile._num) &&
							(hand._melds[i]._firstTile._type === hand._melds[j]._firstTile._type)) {
							matching++;
                        }
					}
					// Do not break yet, this rule may match twice.
				}
				break;

			case 4: // Two Terminal Chows
			    used = [false, false, false, false];
				for (i=0 ; i<3 ; i++) {
					if (used[i]) {continue;}
					if ((hand._melds[i]._type !== Meld.MeldType.CHOW) ||
						(hand._melds[i]._firstTile._num !== 1)) {
						continue;
                    }
					for (j=i+1 ; j<4 ; j++) {
						if (used[j]) {continue;}
						if ((hand._melds[j]._type === Meld.MeldType.CHOW) &&
							(hand._melds[j]._firstTile._type === hand._melds[i]._firstTile._type) &&
							(hand._melds[j]._firstTile._num === 7)) {
							matching++;
							used[i] = true;
							used[j] = true;
						}
					}
					// Do not break yet, this rule may match twice.
				}
				// Remove the terminal chows from the pure straight
				if (this._matchedRules[50]) {matching -= 2;}
				break;

			case 5: // Pung Of Terminals Or Honors
				for (i=0 ; i<4 ; i++) {
					if (hand._melds[i]._type === Meld.MeldType.CHOW) {continue;}
					if (hand._melds[i]._firstTile.isTerminal()) {
						matching++;
                    }

					// Skip the winds if they were already counted in
					// higher combinations.
					if (this._matchedRules[49] || this._matchedRules[71]) {
						continue;
                    }
					if ((hand._melds[i]._firstTile._type === Tile.TileType.WIND) &&
						(hand._melds[i]._firstTile._num !== hand._tableWind._num) &&
						(hand._melds[i]._firstTile._num !== hand._playerWind._num)) {
						matching++;
                    }
				}
				break;

			case 6: // Melded Kong
				if ((kongs[0] === 0) && (kongs[1] === 1)) {
					matching = 1;
                }
				break;

			case 7: // One Voided Suit
				if (!(suits[0] && suits[1] && suits[2])) {
					matching = 1;
                }
				break;

			case 8: // No Honors
				if (!(suits[3] || suits[4])) {
					matching = 1;
                }
				break;

			case 9: // Edge Wait
				// Check if we finished on the 3 of a 123 Chow, or 7
				// of 789
				// This is not valid, though, there is another way to finish.
				// For example, 12x 345 could finish with a 3 or a 6, as long
                // as 345 was concealed
				if (hand._lastTile < 0) {
					continue;
                }

				var meld = Math.floor(hand._lastTile/3);
				var pos = hand._lastTile - meld*3;
				if ((meld >= 4) ||
					(hand._melds[meld]._type !== Meld.MeldType.CHOW)) {
					continue;
                }
				var lookFor = 0;
				if ((pos === 2) && (hand._melds[meld]._firstTile._num===1)) {
					lookFor = 2;
                }
				if ((pos === 0) && (hand._melds[meld]._firstTile._num===7)) {
					lookFor = -2;
                }
				if (lookFor !== 0) {
					lookFor += hand._melds[meld]._firstTile._tileId;
					matching = 1;
					for (i = 0 ; i<4 ; i++) {
						if ((hand._melds[i]._type === Meld.MeldType.CHOW) &&
                             hand._melds[i]._isConcealed &&
							(hand._melds[i]._firstTile._tileId === lookFor)) {
							matching = 0;
							break;
						}
					}
				}
				break;

			case 10: // Closed Wait
				if (hand._lastTile <0) {continue;}
				// Check if we finished on the middle tile of a Chow
				// Not valid if it could be associated with another
				// combination to finish. E.g. 2444
			    meld = Math.floor(hand._lastTile/3);
			    pos = hand._lastTile - meld*3;
				if ((meld < 4) && (pos === 1) &&
					(hand._melds[meld]._type === Meld.MeldType.CHOW)) {
					var pair = hand._melds[4]._firstTile._tileId;
					// Check if we cn use the pain to finish
					if ((hand._melds[meld]._firstTile._tileId === pair) ||
						(hand._melds[meld]._firstTile._tileId+2 === pair)) {
						continue;
                    }

					matching = 1;
				}
				break;

			case 11: // Single Wait
				// Check if we finished on the pair
				if (hand._lastTile >= 3*4) {

					// Only valid if the pair could not be combined
					// with a concealed suit. E.g. 1 2 3 + pair of 4
					// does not count, because we could also finish on
					// a 1
					// The pair can also be combined with a melded
					// pung: e.g 3 + 4 4 4 could end on a 3 but also
					// with a 2 or 5
					// Also: 2 2 3 4 + 2 is not valid (5 could finish)
					matching = 1;
					if (hand._melds[4]._firstTile.isRegular()) {
						var pairType = hand._melds[4]._firstTile._type;
						var pairNum = hand._melds[4]._firstTile._num;

						for (i=0 ; i<4 ; i++) {
							if (!hand._melds[i]._isConcealed) {
								continue;
                            }

							if ((hand._melds[i]._type === Meld.MeldType.CHOW) &&
								(hand._melds[i]._firstTile._type === pairType)) {
								var firstTile = hand._melds[i]._firstTile._num;
								if ((firstTile === pairNum+1) ||
									(firstTile+3 === pairNum) ||
									(firstTile === pairNum) ||
									(firstTile+2 === pairNum)) {
									matching = 0;
									break;
								}
							}

							// Does not work with a kong!
							if ((hand._melds[i]._type === Meld.MeldType.PUNG) &&
								(hand._melds[i]._firstTile._type === pairType) &&
								((hand._melds[i]._firstTile._num === pairNum+1) ||
								 (hand._melds[i]._firstTile._num === pairNum-1))) {
								matching = 0;
								break;
							}
						}
					}
				}
				break;

			case 12: // Self-Drawn
				if (hand._selfDrawn) {matching = 1;}
				break;

			case 13: // Flower Tiles
				for (i = 0 ; i<8 ; i++ ) {
					if (hand._flowers[i].isValid()) {
						matching++;
                    }
                }
				isFlower = true;
				break;

			case 14: // Dragon Pung
				if (hand.dragons() === 1) {matching = 1;}
				break;

			case 15: // Prevalent Wind
				for (i=0 ; i<4 ; i++) {
					if (hand._melds[i]._firstTile._tileId === hand._tableWind._tileId) {
						matching = 1;
                    }
				}
				break;

			case 16: // Seat Wind
				for (i=0 ; i<4 ; i++) {
					if (hand._melds[i]._firstTile._tileId === hand._playerWind._tileId) {
						matching = 1;
                    }
				}
				break;

			case 17: // Concealed Hand
				// if not finishing on a pair, the meld was flagged as
				// not concealed
				if (!hand._selfDrawn) {
					var target = 3;
					// If finishing on the pair.
					if (hand._lastTile >= 12) {target = 4;}
					if (hand.concealed() === target) {matching = 1;}
				}
				break;

			case 18: // All Chows
				if (hand._isNormal) {
					if (hand.chows() === 4) {
						// The pair cannot be a pair of honnors
						var type = hand._melds[4]._firstTile._type;
						if ((type !== Tile.TileType.DRAGON) &&
							(type !== Tile.TileType.WIND)) {
							matching = 1;
                        }
					}
				} else {
					if ((knittedData.knitMatch > 0) && (!knittedData.honors) &&
						(knittedData.what === Meld.MeldType.CHOW)) {
						// The pair cannot be a pair of honnors
						matching = 1;
						for (i = 0; i<7 ; i++) {
							if (count[Tile.TileType.DRAGON.offset+i] > 0) {
								matching = 0;
								break;
							}
						}
					}
				}
				break;

			case 19:
				// Tile Hog: 4 identical tiles scattered in
				// Pungs, Chow, and/or Pair
				for (i=0 ; i<Tile._kNumberDifferentTiles ; i++) {
					if (count[i] === 4) {
						matching++;
                    }
                }

				// NEED TO IGNORE KONGS
				if (hand._isNormal) {
					for (i=0 ; i<5 ; i++) {
						if (hand._melds[i]._type === Meld.MeldType.KONG) {
							matching--;
                        }
                    }
                }
				break;

			case 20: // Double Pung
				for (i=0 ; i<3 ; i++) {
					if ((hand._melds[i]._type === Meld.MeldType.CHOW) ||
                         hand._melds[i]._firstTile.isHonor()) {
                        continue;
                    }
                    for (j=i+1 ; j<4 ; j++) {
                        if ((hand._melds[j]._type === Meld.MeldType.CHOW) ||
                             hand._melds[j]._firstTile.isHonor()) {
                            continue;
                        }
						if (hand._melds[i]._firstTile._num === hand._melds[j]._firstTile._num) {
                            matching++;
                        }
                    }
					// Do not break yet, this rule may match twice.
				}
				break;

			case 21: // Two Concealed Pungs
				if (nbConcealedPungs === 2) {matching = 1;}
				break;

			case 22: // Concealed Kong
				if (kongs[0] === 1) {
					matching = 1;
                }
				break;

			case 23: // All Simples (no honor, no terminal)
				if (!(suits[3] || suits[4])) {
					// If there are no honors, check the 1 and 9's
					if ((count[0]  + count[8] +
						 count[9]  + count[9+8] +
						 count[18] + count[18+8]) === 0) {
						matching = 1;
                    }
				}
				break;

			case 24:  // Outside Hand (terminal or honor in each meld
				matching = 1;
				for (i=0 ; i<5 ; i++) {
					if (!(hand._melds[i].hasTerminal() ||
						  hand._melds[i].isHonor())) {
						matching = 0;
						break;
					}
				}
				break;

			case 25:  // Fully Concealed Hand
				if ((hand._selfDrawn) &&
					((!hand._isNormal) || (hand.concealed() === 4))) {
					matching = 1;
                }
				break;

			case 26: // Two Melded Kongs
				if ((kongs[0] === 0) && (kongs[1] === 2)) {
					matching = 1;
                }
				break;

			case 27: // Last Tile
				if (hand._lastExistingTile) {matching = 1;}
				break;

			case 28: // All Pungs
				if (hand.chows() === 0) {matching = 1;}
				break;

			case 29: // HALF FLUSH (one suit + honors)
				var num = 0;
				if (suits[0]) {num++;}
				if (suits[1]) {num++;}
				if (suits[2]) {num++;}
				if (num === 1) {
					matching = 1;
                }
				break;

			case 30: // Mixed SHIFTED Chows (E.g. 234 345 456 in 3 suits)
				for (i=0 ; i<4 ; i++) {
					if (hand._melds[i]._type !== Meld.MeldType.CHOW) {
						continue;
                    }
					var reference = hand._melds[i]._firstTile;
					for (j=0 ; j<4 ; j++) {
						if ((hand._melds[j]._type !== Meld.MeldType.CHOW) ||
							(reference._num+1 !== hand._melds[j]._firstTile._num) ||
							(reference._type === hand._melds[j]._firstTile._type)) {
							continue;
                        }

						for (k=0 ; k<4 ; k++) {
							if ((hand._melds[k]._type !== Meld.MeldType.CHOW) ||
								(reference._num+2 !== hand._melds[k]._firstTile._num) ||
								(reference._type === hand._melds[k]._firstTile._type) ||
								(hand._melds[j]._firstTile._type === hand._melds[k]._firstTile._type)) {
								continue;
                            }
							matching = 1;
						}
					}
				}
				break;

			case 31: // All TYPES
				if (suits[0] && suits[1] && suits[2] && suits[3] && suits[4]) {
					matching = 1;
                }
				break;

			case 32: // Melded Hand
				// All 4 melds already exposed. Finishing on the pair,
				// not self drawn
				if ((hand.concealed() === 0) &&
					(hand._lastTile >= 3*4) &&
					(!hand._selfDrawn)) {
					matching = 1;
                }
				break;

			case 33: // Two Dragons
			    if (hand.dragons() === 2) {matching = 1;}
				break;

			case 34: // One Melded and one Concealed Kong
				if ((kongs[0] === 1) && (kongs[1] === 1)) {
					matching = 1;
                }
				break;

			case 35: // Mixed Straight 123 456 789 in 3 suits
				for (i=0 ; i<4 ; i++) {
					if ((hand._melds[i]._type !== Meld.MeldType.CHOW) ||
						(hand._melds[i]._firstTile._num !== 1)) {
						continue;
                    }

					var type0 = hand._melds[i]._firstTile._type;
					for (j=0 ; j<4 ; j++) {
						if ((hand._melds[j]._type !== Meld.MeldType.CHOW) ||
							(hand._melds[j]._firstTile._num !== 4) ||
							(hand._melds[j]._firstTile._type === type0)) {
							continue;
                        }

						var type1 = hand._melds[j]._firstTile._type;
						for (k=0 ; k<4 ; k++) {
							if ((hand._melds[k]._type !== Meld.MeldType.CHOW) ||
								(hand._melds[k]._firstTile._num !== 7) ||
								(hand._melds[k]._firstTile._type === type0) ||
								(hand._melds[k]._firstTile._type === type1)) {
								continue;
                            }
							matching = 1;
						}
					}
				}
				break;

			case 36: // REVERSIBLE Tiles (all tiles in Bamboo
					   // 245689, Dot 1234589, WhiteDragon)
				var allowed = [];
				for (i=0 ; i<Tile._kNumberDifferentTiles ; i++) {
					allowed.push(false);
                }

				var start = Tile.TileType.BAMBOO.offset;
				allowed[start-1 + 2] = true;
				allowed[start-1 + 4] = true;
				allowed[start-1 + 5] = true;
				allowed[start-1 + 6] = true;
				allowed[start-1 + 8] = true;
				allowed[start-1 + 9] = true;
				start = Tile.TileType.DOT.offset;
				allowed[start-1 + 1] = true;
				allowed[start-1 + 2] = true;
				allowed[start-1 + 3] = true;
				allowed[start-1 + 4] = true;
				allowed[start-1 + 5] = true;
				allowed[start-1 + 8] = true;
				allowed[start-1 + 9] = true;
				start = Tile.TileType.DRAGON.offset;
				allowed[start-1 + 1] = true;

				matching = 1;
				for (i=0 ; i<Tile._kNumberDifferentTiles ; i++) {
					if ((!allowed[i]) && (count[i] !== 0)) {
						matching = 0;
						break;
					}
				}
				break;

			case 37: // Mixed TRIPLE Chow, E.g. 3.4.5 in each suit
				// Can only be applied once
				for (i=0 ; i<2 ; i++) {
					if (hand._melds[i]._type !== Meld.MeldType.CHOW) {continue;}
					num = hand._melds[i]._firstTile._num;
					type0 = hand._melds[i]._firstTile._type;

					for (j=i+i ; j<3 ; j++) {
						if ((hand._melds[j]._type !== Meld.MeldType.CHOW) ||
							(hand._melds[j]._firstTile._num !== num) ||
							(hand._melds[j]._firstTile._type === type0)) {
							continue;
                        }

						type1 = hand._melds[j]._firstTile._type;
						for (k=j+1 ; k<4 ; k++) {
							if ((hand._melds[k]._type !== Meld.MeldType.CHOW) ||
								(hand._melds[k]._firstTile._num !== num) ||
								(hand._melds[k]._firstTile._type === type0) ||
								(hand._melds[k]._firstTile._type === type1)) {
								continue;
                            }
							matching = 1;
							break;
						}
					}
				}
				break;

			case 38: // Mixed SHIFTED Pungs
				for (i=0 ; i<4 ; i++) {
					if ((hand._melds[i]._type === Meld.MeldType.CHOW) ||
						hand._melds[i].isHonor()) {continue;}
					num = hand._melds[i]._firstTile._num;
					type0 = hand._melds[i]._firstTile._type;

					for (j=0 ; j<4 ; j++) {
						if ((hand._melds[j]._type === Meld.MeldType.CHOW) ||
							hand._melds[j].isHonor() ||
							(hand._melds[j]._firstTile._num !== num+1) ||
							(hand._melds[j]._firstTile._type === type0)) {
							continue;
                        }

					    type1 = hand._melds[j]._firstTile._type;
						for (k=0 ; k<4 ; k++) {
							if ((hand._melds[k]._type === Meld.MeldType.CHOW) ||
								hand._melds[k].isHonor() ||
								(hand._melds[k]._firstTile._num !== num+2) ||
								(hand._melds[k]._firstTile._type === type0) ||
								(hand._melds[k]._firstTile._type === type1)) {
								continue;
                            }
							matching = 1;
						}
					}
				}
				break;

			case 39: // CHICKEN Hand
				// Needs to be dealt with last
				break;

			case 40: // LAST TILE DRAW
				if (hand._lastTileDrawn && hand._selfDrawn) {matching = 1;}
				break;

			case 41: // LAST TILE CLAIM
				if (hand._lastTileDrawn && (!hand._selfDrawn)) {matching = 1;}
				break;

			case 42: // OUT WITH REPLACEMENT Tile
				if (hand._replacementTile) {matching = 1;}
				break;

			case 43: // Two CONCEALED Kongs
				if (kongs[0] === 2) {
					matching = 1;
                }
				break;

			case 44: // ROBBING The Kong
				if (hand._robbedKong) {matching = 1;}
				break;

			case 45: // LESSER Honors And Knitted Tiles
				// Special hand: one of each of the 5 or 6 honors + tiles
				// from knitted tiles.
				if ((knittedData.knitMatch > 0) && knittedData.honors) {
					matching = 1;
                }
				break;

			case 46: // KNITTED Straight
				if (knittedData.knitMatch === 9) {
					matching = 1;
                }
				break;

			case 47: // UPPER FOUR
				if (hand.minMax(6, 9)) {matching = 1;}
				break;

			case 48: // LOWER FOUR
				if (hand.minMax(1, 4)) {matching = 1;}
				break;

			case 49: // BIG THREE Winds
				if (hand.winds() === 3) {matching = 1;}
				break;

			case 50: // Pure Straight
				// May only happen once.
				for (i=0 ; i<2 ; i++) {
					if ((hand._melds[i]._type !== Meld.MeldType.CHOW) ||
						(hand._melds[i]._firstTile._num !== 1)) {
						continue;
                    }

				    type0 = hand._melds[i]._firstTile._type;
					for (j=i+1 ; j<3 ; j++) {
						if ((hand._melds[j]._type !== Meld.MeldType.CHOW) ||
							(hand._melds[j]._firstTile._num !== 4) ||
							(hand._melds[j]._firstTile._type !== type0)) {
							continue;
                        }

					    type1 = hand._melds[j]._firstTile._type;
						for (k=j+1 ; k<4 ; k++) {
							if ((hand._melds[k]._type !== Meld.MeldType.CHOW) ||
								(hand._melds[k]._firstTile._num !== 7) ||
								(hand._melds[k]._firstTile._type !== type0)) {
								continue;
                            }
							matching = 1;
						}
					}
				}
				break;

			case 51: // THREE-Suited Terminal Chows 123 789 twice + pair of 5
				// Make sure we have 4 Chows
				if (hand.chows() !== 4) {break;}
				// Make sure there is no dragon nor wind
				if (suits[3] || suits[4]) {break;}

				if ((hand._melds[0]._firstTile._num === 1) &&
					(hand._melds[1]._firstTile._num === 7) &&
					(hand._melds[2]._firstTile._num === 1) &&
					(hand._melds[3]._firstTile._num === 7) &&
					(hand._melds[4]._firstTile._num === 5) &&

					(hand._melds[1]._firstTile._type === hand._melds[0]._firstTile._type) &&
					(hand._melds[2]._firstTile._type === hand._melds[3]._firstTile._type) &&

					(hand._melds[2]._firstTile._type !== hand._melds[0]._firstTile._type) &&

					(hand._melds[4]._firstTile._type !== hand._melds[0]._firstTile._type) &&
					(hand._melds[4]._firstTile._type !== hand._melds[2]._firstTile._type)) {
					matching = 1;
                }
				break;

			case 52: // Pure SHIFTED Chows
				for (i=0 ; i<2 ; i++) {
					if (hand._melds[i]._type !== Meld.MeldType.CHOW) {
						continue;
                    }
					reference = hand._melds[i]._firstTile;

					for (j=i+1 ; j<3 ; j++) {
						if ((hand._melds[j]._type !== Meld.MeldType.CHOW) ||
							(reference._tileId >= hand._melds[j]._firstTile._tileId) ||
							(reference._tileId+2 < hand._melds[j]._firstTile._tileId)) {
							continue;
                        }
						delta = hand._melds[j]._firstTile._num - reference._num;
						if (((delta < 1) || delta > 2)) {continue;}

						for (k=j+1 ; k<4 ; k++) {
							if ((hand._melds[k]._type !== Meld.MeldType.CHOW) ||
								(reference._tileId+2*delta !== hand._melds[k]._firstTile._tileId)) {
								continue;
                            }
							matching = 1;
						}
					}
				}
				break;

			case 53: // All FIVES
				matching = 1;
				for (i=0 ; i<5 ; i++) {
					var t = hand._melds[i]._firstTile;
					if (!t.isRegular()) {matching = 0;}
					if (hand._melds[i]._type === Meld.MeldType.CHOW) {
						if ((t._num < 3) || (t._num > 5)) {matching = 0;}
					} else
						if (t._num !== 5) {matching = 0;}
				}
				break;

			case 54: // TRIPLE Pung
				for (i=0 ; i<2 ; i++) {
					reference = hand._melds[i]._firstTile;
					if ((hand._melds[i]._type === Meld.MeldType.CHOW) ||
						(reference.isHonor())) {
						continue;
                    }

					for (j=i+1 ; j<3 ; j++) {
						if ((hand._melds[j]._type === Meld.MeldType.CHOW) ||
							(hand._melds[j]._firstTile.isHonor()) ||
							(reference._num !== hand._melds[j]._firstTile._num)) {
							continue;
                        }

						for (k=j+1 ; k<4 ; k++) {
							if ((hand._melds[k]._type === Meld.MeldType.CHOW) ||
								(hand._melds[k]._firstTile.isHonor()) ||
								(reference._num !== hand._melds[k]._firstTile._num)) {
								continue;
                            }
							matching = 1;
						}
					}
				}

				break;

			case 55: // THREE Concealed Pungs
				if (nbConcealedPungs === 3) {matching = 1;}
				break;

			case 56: // Seven Pairs
				// Special Hand
				var valid = true;
				for (i = 0 ; i<14 ; i+=2) {
					if (hand._tiles[i]._tileId !== hand._tiles[i+1]._tileId) {
						valid = false;
						break;
					}
				}
				if (valid) {matching = 1;}
				break;

			case 57: // Greater Honors And Knitted Tiles
				// Special hand: one of each of the 7 honors + 7 tiles
				// from knitted tiles.
				if (knittedData.knitMatch === 7) {
					matching = 1;
                }
				break;

			case 58: // All Even
				// Make sure there is no wind or dragon
				if (suits[3] || suits[4]) {break;}

				matching = 1;
				for (i=1 ; i<=9 ; i+=2) {
					if ((count[Tile.TileType.BAMBOO.offset-1 + i]>0) ||
						(count[Tile.TileType.DOT.offset-1 + i]>0) ||
						(count[Tile.TileType.CHARACTER.offset-1 + i]>0)) {
						matching = 0;
						break;
					}
				}
				break;

			case 59: // Full Flush
				if (suits[3] || suits[4]) {break;}
				var nb = 0;
				if (suits[0]) {nb++;}
				if (suits[1]) {nb++;}
				if (suits[2]) {nb++;}
			    if (nb === 1) {matching = 1;}
				break;

			case 60: // Pure Triple Chow
				for (i=0 ; i<2 ; i++) {
					if ((hand._melds[i]._type !== Meld.MeldType.CHOW) ||
						(hand._melds[i+1]._type !== Meld.MeldType.CHOW) ||
						(hand._melds[i+2]._type !== Meld.MeldType.CHOW) ||

						(hand._melds[i]._firstTile._tileId !== hand._melds[i+1]._firstTile._tileId) ||
						(hand._melds[i]._firstTile._tileId !== hand._melds[i+2]._firstTile._tileId)) {
						continue;
                    }
					matching = 1;
					break;
				}
				break;

			case 61: // Pure Shifted Pungs
				for (i=0 ; i<2 ; i++) {
					if ((hand._melds[i]._type === Meld.MeldType.CHOW) ||
						(hand._melds[i+1]._type === Meld.MeldType.CHOW) ||
						(hand._melds[i+2]._type === Meld.MeldType.CHOW) ||

						(! hand._melds[i]._firstTile.isRegular()) ||
						(hand._melds[i]._firstTile._num >= 8) ||

						(hand._melds[i]._firstTile._tileId+1 !== hand._melds[i+1]._firstTile._tileId) ||
						(hand._melds[i]._firstTile._tileId+2 !== hand._melds[i+2]._firstTile._tileId)) {
						continue;
                    }
					matching = 1;
					break;
				}
				break;

			case 62: // Upper Tiles
				if (hand.minMax(7, 9)) {matching = 1;}
				break;

			case 63: // Middle Tiles
				if (hand.minMax(4, 6)) {matching = 1;}
				break;

			case 64: // Lower Tiles
				if (hand.minMax(1, 3)) {matching = 1;}
				break;

			case 65: // Four Shifted Chows
				if ((hand.chows() < 4) ||
					(! hand._melds[0]._firstTile.isRegular()) ||
					(hand._melds[0]._firstTile._type !== hand._melds[3]._firstTile._type)) {
					break;
                }

				var tileId = hand._melds[0]._firstTile._tileId;
				var delta = hand._melds[1]._firstTile._tileId - tileId;
				if (((delta < 1) || delta > 2)) {break;}

				if ((hand._melds[2]._firstTile._tileId === tileId + 2*delta) &&
					(hand._melds[3]._firstTile._tileId === tileId + 3*delta)) {
					matching = 1;
                }
				break;

			case 66: // Three Kongs
				if (kongs[0] + kongs[1] === 3) {
					matching = 1;
                }
				break;

			case 67: // All Terminals And Honors
				valid = true;
				for (i=2 ; i<=8 ; i++) {
					if (count[i-1] + count[9+i-1] + count[18+i-1] > 0) {
						valid = false;
						break;
					}
				}
				if (valid) {matching = 1;}
				break;

			case 68: // Quadruple Chow
				if (hand.chows() < 4) {break;}
				tileId = hand._melds[0]._firstTile._tileId;
				if ((hand._melds[1]._firstTile._tileId === tileId) &&
					(hand._melds[2]._firstTile._tileId === tileId) &&
					(hand._melds[3]._firstTile._tileId === tileId)) {
					matching = 1;
                }
				break;

			case 69: // Four Pure Shifted Pungs
				if ((hand.chows() > 0) ||
					(! hand._melds[0]._firstTile.isRegular()) ||
					(hand._melds[0]._firstTile._num >= 7)) {
					break;
                }

				tileId = hand._melds[0]._firstTile._tileId;
				if ((hand._melds[1]._firstTile._tileId === tileId+1) &&
					(hand._melds[2]._firstTile._tileId === tileId+2) &&
					(hand._melds[3]._firstTile._tileId === tileId+3)) {
					matching = 1;
                }
				break;

			case 70: // All Terminals
				if (suits[3] || suits[4]) {break;}

				valid = true;
				for (i=2 ; i<=8 ; i++) {
					if (count[i-1] + count[9+i-1] + count[18+i-1] > 0) {
						valid = false;
						break;
					}
				}
				if (valid) {matching = 1;}
				break;

			case 71: // Little Four Winds
				if ((hand.winds() === 3) &&
					(hand._melds[4]._firstTile._type === Tile.TileType.WIND)) {
				    matching = 1;
                }
				break;

			case 72: // Little Three Dragons
				if ((hand.dragons() === 2) &&
					(hand._melds[4]._firstTile._type === Tile.TileType.DRAGON)) {
					matching = 1;
                }
				break;

			case 73: // All Honors
				if (!(suits[0] || suits[1] || suits[2])) {
					matching = 1;
                }
				break;

			case 74: // Four Concealed Pungs
				if (nbConcealedPungs === 4) {matching = 1;}
				break;

			case 75: // Pure Terminal Chows 123 789 twice + 55
				if ((hand.chows() === 4) &&
					(hand._melds[0]._firstTile._num === 1)) {
				    tileId = hand._melds[0]._firstTile._tileId;
					if ((hand._melds[1]._firstTile._tileId === tileId) &&
						(hand._melds[2]._firstTile._tileId === tileId+6) &&
						(hand._melds[3]._firstTile._tileId === tileId+6) &&
						(hand._melds[4]._firstTile._tileId === tileId+4)) {
						matching = 1;
                    }
				}
				break;

			case 76: // Big Four Winds
				if (hand.winds() === 4) {
					matching = 1;
                }
				break;

			case 77: // Big Three Dragons
				if (hand.dragons() === 3) {
					matching = 1;
                }
				break;

			case 78: // All Green 2-3-4-6-8 Bamboos and Green Dragon
				// Works for both normal and special hands
				var nbTiles = count[Tile.TileType.DRAGON.offset + 1];
				nbTiles += count[Tile.TileType.BAMBOO.offset-1 + 2];
				nbTiles += count[Tile.TileType.BAMBOO.offset-1 + 3];
				nbTiles += count[Tile.TileType.BAMBOO.offset-1 + 4];
				nbTiles += count[Tile.TileType.BAMBOO.offset-1 + 6];
				nbTiles += count[Tile.TileType.BAMBOO.offset-1 + 8];
				target = 14 + kongs[0] + kongs[1];
				if (nbTiles === target) {
					matching = 1;
                }
				break;

			case 79: // Nine Gates
				// FIXME: Special
				break;

			case 80: // Four Kongs
				if (kongs[0] + kongs[1] === 4) {
					matching = 1;
                }
				break;

			case 81: // Seven Shifted Pairs
				// FIXME: Special
				break;
			case 82: //
					 // Thirteen Orphans 1 & 9 of each suit, one of
					 // each wind one of each dragon, last one making
					 // a pair.
				lookFor = [0, 8, 9+0, 9+8, 18+0, 18+8,
						   27, 28, 29,
						   30, 31, 32, 33];
				var nbOne = 0;
				var nbTwo = 0;
				for (i=0 ; i<13 ; i++) {
					if (count[lookFor[i]] === 1) {nbOne++;}
					if (count[lookFor[i]] === 2) {nbTwo++;}
				}
				if ((nbOne === 12) && (nbTwo === 1)) {
					matching = 1;
                }
				break;
			}

			if (matching > 0) {
				nbRules += matching;
				var thisScore = matching * this._data[ruleId]._score;
				nbPoints += thisScore;

				this._matchedRules[ruleId+1] = true;
				this._rulesDescriptions.push(strRes("RULES_FORMAT").format(
					thisScore, matching, ruleId+1, strRes(this._data[ruleId]._desc)));
				// Disable implied rules
				var impliesArray = this._data[ruleId]._implies;
				for (i = 0; i<impliesArray.length ; i++) {
					this._activesRules[impliesArray[i]-1] = false;
				}

				if (isFlower) {
					nbFlowerPoints += thisScore;
                }
			}
		}

		if (hand._isNormal && (nbFlowerPoints === nbPoints)) {
			// No point scored, this is a Chicken hand.
			ruleId = 39;
			matching = 1;
			thisScore = matching * this._data[ruleId]._score;
			nbPoints += thisScore;
			this._rulesDescriptions.push(strRes("RULES_FORMAT").format(
				thisScore, matching, ruleId, strRes(this._data[ruleId-1]._desc)));
		}

		if (!hand._isNormal) {
			// We need to make sure that there is at least one valid
			// Hu combinaison
			valid = false;
			for (i = 0 ; i < this._nbRules ; i++ ) {
				if (this._data[i]._special && (!this._data[i]._normal) &&
					(this._matchedRules[this._data[i]._indx])) {
					valid = true;
					break;
				}
			}

			if (!valid) {
				nbPoints = 0;
				this._rulesDescriptions = [];
				this._rulesDescriptions.push(strRes("NO_VALID_HAND"));
			}
		}

		if (hand._lastTile < 0) {
			// Add a warning if the last tile is not set.
			this._rulesDescriptions.push(strRes("LAST_TILE_NOT_SET"));
		}

		return nbPoints;
	}
};

HandRules.prototype._nbRules = HandRules.prototype._data.length;
