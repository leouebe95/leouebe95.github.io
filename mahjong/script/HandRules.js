// eslint
/* global Meld:false Tile:false strRes:false */

/**
  Scope the class definition in a function to allow declaration of
  private methods.
*/
window.HandRules = (function() {
    "use strict";

    var ruleDescriptions = {};

    /**
	   Private class used to describe one rule.
	   The constructor can use a variable number of arguments.

	   int indx, int score, String desc, [boolean special, boolean normal], int ... implies
	   if special and normal are ommited, they are set to false, true
    */
    class Rule {
	    /**
           Create a new rule.

           @param {Array} args Variable arguments:
           Int: indx The rule ID.
           Int: score How many point this rule scores.
           String: desc Name of the rule.
           Boolean: [special] This rule applies to special hands.
           Boolean: [normal]  This rule applies to normal hands.
           Int[]: [implied]  List of all rules that are automatically
           implied (cannot be counted)
        */
        constructor(args) {
	        this._indx = args.shift();	//!< int: Rule unique Id. Used to reference implied rules
	        this._score = args.shift();	//!< int: Number of points
	        this._computeCB = args.shift();  //!< function: Computation callback
	        this._special = false;      //!< boolean: Rule applies to special hands
	        this._normal = true;        //!< boolean: Rule applies to normal hands

	        if ((args.length > 0) && ((typeof args[0]) === "boolean")) {
		        this._special = args.shift();
		        this._normal = args.shift();
	        }

		    this._implies = [];		    //!< int[]: Rules automatically implied
		    for (var i = 0; i < args.length; i++) {
			    this._implies.push(args[i]);
		    }

            if (typeof this._computeCB !== "function") {
                console.error("Rule #{1} is does not have a compute function".format(this._indx));
            }
        }
    }

	/**
	  Check if we have a knitted suite. Only consider the valid HU
	  hands: The 5 other tiles are either all honors or melds.

	  @param {Hand} hand Hand to test.
	  @param {Int[]} count Count of each tiles in the hand.

	  @return {Int} The number of tiles matched
	*/
	function computeKnittedData(hand, count) {
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
	}

	/**
	  Compute the number of concealed pungs. Used for the rule 2, 3
	  or 4 concealed pungs. For those rules, kongs can be counted as
	  well except for the case of 2 concealed kongs and no pung which
	  is already covered by the 2 concealed kongs rule.

	  @param {Hand} hand Hand to test

	  @return {Int} The number of pung+kong
	*/
	function concealedPungs(hand) {
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
	}


    /**
       Base class for all rule sets.
    */
    var hr = class {
        constructor() { }

        /**
           Register descriptions associated with rule calculation callbacks
           @param {Array} data Each element is a pair
           [description (String), callback (function)]
           @return {undefined}
        */
        static registerDescriptions(data) {
            for (var i = 0 ; i<data.length ; i++ ) {
                ruleDescriptions[data[i][1]] = data[i][0];
            }
        }

        /**
           Build an array of rules.
           @param {Array} data Each element contains:
           Id, NbPoints, Description, computeCB, [special], [normal], [implied1, ...]
           @return {Rule[]} An array of Rule objects created from data
        */
        static makeRules(data) {
            var res = [];
            for (var i = 0 ; i<data.length ; i++ ) {
                res.push(new Rule(data[i]));
            }
            return res;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @return {Int} number of times this rule matches.
        */
        static pureDoubleChow(hand) {
            var res = 0;
			for (var i=0 ; i<3 ; i++) {
				if (hand._melds[i]._type !== Meld.MeldType.CHOW) {break;}
				if (hand._melds[i+1]._type !== Meld.MeldType.CHOW) {break;}

				if (hand._melds[i]._firstTile._tileId === hand._melds[i+1]._firstTile._tileId) {
					res++;
                }
				// Do not break yet, this rule may match twice.
			}
            return res;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @return {Int} number of times this rule matches
        */
        static mixedDoubleChow(hand) {
            var res = 0;
			var used = [false, false, false, false];
			for (var i=0 ; i<3 ; i++) {
				if (used[i] || (hand._melds[i]._type !== Meld.MeldType.CHOW)) {
					continue;
                }
				for (var j=i+1 ; j<4 ; j++) {
					if (used[j] || hand._melds[j]._type !== Meld.MeldType.CHOW) {
						continue;
                    }

					// Will match Rule #1
					if (hand._melds[i]._firstTile._type === hand._melds[j]._firstTile._type) {
						continue;
                    }
					if (hand._melds[i]._firstTile._num === hand._melds[j]._firstTile._num) {
						res++;
						used[i] = true;
						used[j] = true;
						// Do not break yet, this rule may match
						// twice, but neither i or j can be reused.
					}
				}
			}
            return res;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @return {Int} number of times this rule matches
        */
        static shortStraight(hand) {
            var res = 0;
			for (var i=0 ; i<3 ; i++) {
				if ((hand._melds[i]._type !== Meld.MeldType.CHOW) ||
					(hand._melds[i]._firstTile._num > 4)) {
					continue;
                }

				for (var j=i+1 ; j<4 ; j++) {
					if ((hand._melds[j]._type === Meld.MeldType.CHOW) &&
						(hand._melds[i]._firstTile._num + 3 === hand._melds[j]._firstTile._num) &&
						(hand._melds[i]._firstTile._type === hand._melds[j]._firstTile._type)) {
						res++;
                    }
				}
				// Do not break yet, this rule may match twice.
			}
            return res;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @param {Object} data Precomputed data.
            @param {Object} rulesRes current intermediate result with
            all previous rules ran.
            @return {Int} number of times this rule matches
        */
        static twoTerminalChows(hand, data, rulesRes) {
            var res = 0;
			var used = [false, false, false, false];
			for (var i=0 ; i<3 ; i++) {
				if (used[i]) {continue;}
				if ((hand._melds[i]._type !== Meld.MeldType.CHOW) ||
					(hand._melds[i]._firstTile._num !== 1)) {
					continue;
                }
				for (var j=i+1 ; j<4 ; j++) {
					if (used[j]) {continue;}
					if ((hand._melds[j]._type === Meld.MeldType.CHOW) &&
						(hand._melds[j]._firstTile._type === hand._melds[i]._firstTile._type) &&
						(hand._melds[j]._firstTile._num === 7)) {
						res++;
						used[i] = true;
						used[j] = true;
					}
				}
				// Do not break yet, this rule may match twice.
			}

			// Remove the terminal chows from the pure straight
            // FIXME
			if (rulesRes.matched[51]) {res -= 2;}
            return res;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @param {Object} data Precomputed data.
            @param {Object} rulesRes current intermediate result with
            all previous rules ran.
            @return {Int} number of times this rule matches
        */
        static pungOfTerminalsOrHonors(hand, data, rulesRes) {
            var res = 0;
			for (var i=0 ; i<4 ; i++) {
				if (hand._melds[i]._type === Meld.MeldType.CHOW) {continue;}
				if (hand._melds[i]._firstTile.isTerminal()) {
					res++;
                }

				// Skip the winds if they were already counted in
				// higher combinations.
                // FIXME
				if (rulesRes.matched[49] || rulesRes.matched[71]) {
					continue;
                }
				if ((hand._melds[i]._firstTile._type === Tile.TileType.WIND) &&
					(hand._melds[i]._firstTile._num !== hand._tableWind._num) &&
					(hand._melds[i]._firstTile._num !== hand._playerWind._num)) {
					res++;
                }
			}
            return res;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @param {Object} data Precomputed data.
            @return {Int} number of times this rule matches
        */
        static meldedKong(hand, data) {
			if ((data.kongs.concealed === 0) && (data.kongs.melded === 1)) {
				return 1;
            }
            return 0;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @param {Object} data Precomputed data.
            @return {Int} number of times this rule matches
        */
        static oneVoidedSuit(hand, data) {
			if (!(data.suits[0] && data.suits[1] && data.suits[2])) {
                return 1;
            }
            return 0;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @param {Object} data Precomputed data.
            @return {Int} number of times this rule matches
        */
        static noHonors(hand, data) {
			if (!(data.suits[3] || data.suits[4])) {
				return 1;
            }
            return 0;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @return {Int} number of times this rule matches
        */
        static edgeWait(hand) {
            var res = 0;
			// Check if we finished on the 3 of a 123 Chow, or 7
			// of 789
			// This is not valid, though, there is another way to finish.
			// For example, 12x 345 could finish with a 3 or a 6, as long
            // as 345 was concealed
			if (hand._lastTile < 0) {
				return 0;
            }

			var meld = Math.floor(hand._lastTile/3);
			var pos = hand._lastTile - meld*3;
			if ((meld >= 4) ||
				(hand._melds[meld]._type !== Meld.MeldType.CHOW)) {
				return 0;
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
				res = 1;
				for (var i = 0 ; i<4 ; i++) {
					if ((hand._melds[i]._type === Meld.MeldType.CHOW) &&
                        hand._melds[i]._isConcealed &&
						(hand._melds[i]._firstTile._tileId === lookFor)) {
						res = 0;
						break;
					}
				}
			}
            return res;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @return {Int} number of times this rule matches
        */
        static closedWait(hand) {
			if (hand._lastTile <0) {
                return 0;
            }

			// Check if we finished on the middle tile of a Chow
			// Not valid if it could be associated with another
			// combination to finish. E.g. 2444
			var meld = Math.floor(hand._lastTile/3);
			var pos = hand._lastTile - meld*3;
			if ((meld < 4) && (pos === 1) &&
				(hand._melds[meld]._type === Meld.MeldType.CHOW)) {
				var pair = hand._melds[4]._firstTile._tileId;
				// Check if we can use the pair to finish
				if ((hand._melds[meld]._firstTile._tileId === pair) ||
					(hand._melds[meld]._firstTile._tileId+2 === pair)) {
					return 0;
                }

				return 1;
			}
            return 0;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @return {Int} number of times this rule matches
        */
        static singleWait(hand) {
            var res = 0; // Check if we finished on the pair
			if (hand._lastTile >= 3*4) {

				// Only valid if the pair could not be combined
				// with a concealed suit. E.g. 1 2 3 + pair of 4
				// does not count, because we could also finish on
				// a 1
				// The pair can also be combined with a melded
				// pung: e.g 3 + 4 4 4 could end on a 3 but also
				// with a 2 or 5
				// Also: 2 2 3 4 + 2 is not valid (5 could finish)
				res = 1;
				if (hand._melds[4]._firstTile.isRegular()) {
					var pairType = hand._melds[4]._firstTile._type;
					var pairNum = hand._melds[4]._firstTile._num;

					for (var i=0 ; i<4 ; i++) {
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
								res = 0;
								break;
							}
						}

						// Does not work with a kong!
						if ((hand._melds[i]._type === Meld.MeldType.PUNG) &&
							(hand._melds[i]._firstTile._type === pairType) &&
							((hand._melds[i]._firstTile._num === pairNum+1) ||
							 (hand._melds[i]._firstTile._num === pairNum-1))) {
							res = 0;
							break;
						}
					}
				}
			}
            return res;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @return {Int} number of times this rule matches
        */
        static selfDrawn(hand) {
			if (hand._selfDrawn) {
                return 1;
            }
            return 0;
        }

        /**
           Flowers can be counted on valid hands only (>= 8 points)
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @param {Object} rulesRes current intermediate result with
           all previous rules ran.
           @return {Int} number of times this rule matches
        */
        static flowerTiles(hand, data, rulesRes) {
            if (rulesRes.nbPoints < 8) {return 0;}
            return hand.flowers();
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @return {Int} number of times this rule matches
        */
        static dragonPung(hand) {
			if (hand.dragons() === 1) {return 1;}
            return 0;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @return {Int} number of times this rule matches
        */
        static prevalentWind(hand) {
			for (var i=0 ; i<4 ; i++) {
				if (hand._melds[i]._firstTile._tileId === hand._tableWind._tileId) {
					return 1;
                }
			}
            return 0;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @return {Int} number of times this rule matches
        */
        static seatWind(hand) {
			for (var i=0 ; i<4 ; i++) {
				if (hand._melds[i]._firstTile._tileId === hand._playerWind._tileId) {
					return 1;
                }
			}
            return 0;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @return {Int} number of times this rule matches
        */
        static concealedHand(hand) {
			// if not finishing on a pair, the meld was flagged as
			// not concealed
			if (!hand._selfDrawn) {
				var target = 3;
				// If finishing on the pair.
				if (hand._lastTile >= 12) {target = 4;}
				if (hand.concealed() === target) {return 1;}
			}
            return 0;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @param {Object} data Precomputed data.
            @return {Int} number of times this rule matches
        */
        static allChows(hand, data) {
			if (hand._isNormal) {
				if (hand.chows() === 4) {
					// The pair cannot be a pair of honnors
					var type = hand._melds[4]._firstTile._type;
					if ((type !== Tile.TileType.DRAGON) &&
						(type !== Tile.TileType.WIND)) {
						return 1;
                    }
				}
			} else if ((data.knittedData.knitMatch > 0) && (!data.knittedData.honors) &&
					   (data.knittedData.what === Meld.MeldType.CHOW)) {
				// The pair cannot be a pair of honnors
				for (var i = 0; i<7 ; i++) {
					if (data.count[Tile.TileType.DRAGON.offset+i] > 0) {
						return 0;
					}
				}
                return 1;
			}
            return 0;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @param {Object} data Precomputed data.
            @return {Int} number of times this rule matches
        */
        static tileHog(hand, data) {
            var res = 0;
			// Tile Hog: 4 identical tiles scattered in
			// Pungs, Chow, and/or Pair
			for (var i=0 ; i<Tile._kNumberDifferentTiles ; i++) {
				if (data.count[i] === 4) {
					res++;
                }
            }

			// NEED TO IGNORE KONGS
			if (hand._isNormal) {
				for (i=0 ; i<5 ; i++) {
					if (hand._melds[i]._type === Meld.MeldType.KONG) {
						res--;
                    }
                }
            }
            return res;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @return {Int} number of times this rule matches
        */
        static doublePung(hand) {
            var res = 0;
			for (var i=0 ; i<3 ; i++) {
				if ((hand._melds[i]._type === Meld.MeldType.CHOW) ||
                    hand._melds[i]._firstTile.isHonor()) {
                    continue;
                }
                for (var j=i+1 ; j<4 ; j++) {
                    if ((hand._melds[j]._type === Meld.MeldType.CHOW) ||
                        hand._melds[j]._firstTile.isHonor()) {
                        continue;
                    }
					if (hand._melds[i]._firstTile._num === hand._melds[j]._firstTile._num) {
                        res++;
                    }
                }
				// Do not break yet, this rule may match twice.
			}
            return res;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @param {Object} data Precomputed data.
            @return {Int} number of times this rule matches
        */
        static twoConcealedPungs(hand, data) {
			if (data.nbConcealedPungs === 2) {return 1;}
            return 0;
        }

        /**
            @param {Hand} hand Hand to compute rules for.
            @param {Object} data Precomputed data.
            @return {Int} number of times this rule matches
        */
        static concealedKong(hand, data) {
			if (data.kongs.concealed === 1) {return 1;}
            return 0;
        }

        /**
           All Simples (no honor, no terminal)
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static allSimples(hand, data) {
			if (!(data.suits[3] || data.suits[4])) {
				// If there are no honors, check the 1 and 9's
				if ((data.count[0]  + data.count[8] +
					 data.count[9]  + data.count[9+8] +
					 data.count[18] + data.count[18+8]) === 0) {
					return 1;
                }
			}
            return 0;
        }

        /**
           Outside Hand: terminal or honor in each meld
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static outsideHand(hand) {
			for (var i=0 ; i<5 ; i++) {
				if (!(hand._melds[i].hasTerminal() ||
					  hand._melds[i].isHonor())) {
					return 0;
				}
			}
            return 1;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static fullyConcealedHand(hand) {
			if ((hand._selfDrawn) &&
				((!hand._isNormal) || (hand.concealed() === 4))) {
				return 1;
            }
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static twoMeldedKongs(hand, data) {
			if ((data.kongs.concealed=== 0) && (data.kongs.melded === 2)) {
				return 1;
            }
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static lastTile(hand) {
			if (hand._lastExistingTile) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static allPungs(hand) {
			if (hand.chows() === 0) {return 1;}
            return 0;
        }

        /**
           Half Flush (one suit + honors)
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static halfFlush(hand, data) {
            var num = 0;
			if (data.suits[0]) {num++;}
			if (data.suits[1]) {num++;}
			if (data.suits[2]) {num++;}
			if (num === 1) {
				return 1;
            }
            return 0;
        }

        /**
           Mixed Shifted Chows (E.g. 234 345 456 in 3 suits)
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static mixedShiftedChows(hand) {
			for (var i=0 ; i<4 ; i++) {
				if (hand._melds[i]._type !== Meld.MeldType.CHOW) {
					continue;
                }
				var reference = hand._melds[i]._firstTile;
				for (var j=0 ; j<4 ; j++) {
					if ((hand._melds[j]._type !== Meld.MeldType.CHOW) ||
						(reference._num+1 !== hand._melds[j]._firstTile._num) ||
						(reference._type === hand._melds[j]._firstTile._type)) {
						continue;
                    }

					for (var k=0 ; k<4 ; k++) {
						if ((hand._melds[k]._type !== Meld.MeldType.CHOW) ||
							(reference._num+2 !== hand._melds[k]._firstTile._num) ||
							(reference._type === hand._melds[k]._firstTile._type) ||
							(hand._melds[j]._firstTile._type === hand._melds[k]._firstTile._type)) {
							continue;
                        }
						return 1;
					}
				}
			}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static allTypes(hand, data) {
			if (data.suits[0] && data.suits[1] && data.suits[2] && data.suits[3] && data.suits[4]) {
                return 1;
            }
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static meldedHand(hand) {
			// All 4 melds already exposed. Finishing on the pair,
			// not self drawn
			if ((hand.concealed() === 0) &&
				(hand._lastTile >= 3*4) &&
				(!hand._selfDrawn)) {
				return 1;
            }
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static twoDragons(hand) {
			if (hand.dragons() === 2) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static oneMeldedAndOneConcealedKong(hand, data) {
			if ((data.kongs.concealed === 1) && (data.kongs.melded === 1)) {
				return 1;
            }
            return 0;
        }

        /**
           Mixed Straight 123 456 789 in 3 suits
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static mixedStraight(hand) {
            for (var i=0 ; i<4 ; i++) {
				if ((hand._melds[i]._type !== Meld.MeldType.CHOW) ||
					(hand._melds[i]._firstTile._num !== 1)) {
					continue;
                }

				var type0 = hand._melds[i]._firstTile._type;
				for (var j=0 ; j<4 ; j++) {
					if ((hand._melds[j]._type !== Meld.MeldType.CHOW) ||
						(hand._melds[j]._firstTile._num !== 4) ||
						(hand._melds[j]._firstTile._type === type0)) {
						continue;
                    }

					var type1 = hand._melds[j]._firstTile._type;
					for (var k=0 ; k<4 ; k++) {
						if ((hand._melds[k]._type !== Meld.MeldType.CHOW) ||
							(hand._melds[k]._firstTile._num !== 7) ||
							(hand._melds[k]._firstTile._type === type0) ||
							(hand._melds[k]._firstTile._type === type1)) {
							continue;
                        }
						return 1;
					}
				}
			}
            return 0;
        }

        /**
           Reversible Tiles (all tiles in Bamboo 245689, Dot 1234589, WhiteDragon)
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static reversibleTiles(hand, data) {
			var allowed = Array(Tile._kNumberDifferentTiles).fill(false);

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

			for (var i=0 ; i<Tile._kNumberDifferentTiles ; i++) {
				if ((!allowed[i]) && (data.count[i] > 0)) {
					return 0;
				}
			}
            return 1;
        }

        /**
           Mixed Triple Chow, E.g. 3.4.5 in each suit.
		   Can only be applied once.
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static mixedTripleChow(hand) {
            for (var i=0 ; i<2 ; i++) {
				if (hand._melds[i]._type !== Meld.MeldType.CHOW) {
                    continue;
                }
				var num = hand._melds[i]._firstTile._num;
				var type0 = hand._melds[i]._firstTile._type;

				for (var j=i+i ; j<3 ; j++) {
					if ((hand._melds[j]._type !== Meld.MeldType.CHOW) ||
						(hand._melds[j]._firstTile._num !== num) ||
						(hand._melds[j]._firstTile._type === type0)) {
						continue;
                    }

					var type1 = hand._melds[j]._firstTile._type;
					for (var k=j+1 ; k<4 ; k++) {
						if ((hand._melds[k]._type !== Meld.MeldType.CHOW) ||
							(hand._melds[k]._firstTile._num !== num) ||
							(hand._melds[k]._firstTile._type === type0) ||
							(hand._melds[k]._firstTile._type === type1)) {
							continue;
                        }
						return 1;
					}
				}
            }
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static mixedShiftedPungs(hand) {
			for (var i=0 ; i<4 ; i++) {
				if ((hand._melds[i]._type === Meld.MeldType.CHOW) ||
					hand._melds[i].isHonor()) {
                    continue;
                }
				var num = hand._melds[i]._firstTile._num;
				var type0 = hand._melds[i]._firstTile._type;

				for (var j=0 ; j<4 ; j++) {
					if ((hand._melds[j]._type === Meld.MeldType.CHOW) ||
						hand._melds[j].isHonor() ||
						(hand._melds[j]._firstTile._num !== num+1) ||
						(hand._melds[j]._firstTile._type === type0)) {
						continue;
                    }

					var type1 = hand._melds[j]._firstTile._type;
					for (var k=0 ; k<4 ; k++) {
						if ((hand._melds[k]._type === Meld.MeldType.CHOW) ||
							hand._melds[k].isHonor() ||
							(hand._melds[k]._firstTile._num !== num+2) ||
							(hand._melds[k]._firstTile._type === type0) ||
							(hand._melds[k]._firstTile._type === type1)) {
							continue;
                        }
						return 1;
					}
				}
			}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @param {Object} rulesRes current intermediate result with
           all previous rules ran.
           @return {Int} number of times this rule matches
        */
        static chickenHand(hand, data, rulesRes) {
            if (hand._isNormal &&
                hand.isComplete() &&
                (rulesRes.nbPoints === 0)) {
                return 1;
            }
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static lastTileDraw(hand) {
			if (hand._lastTileDrawn && hand._selfDrawn) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static lastTileClaim(hand) {
			if (hand._lastTileDrawn && !hand._selfDrawn) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static outWithReplacementTile(hand) {
			if (hand._replacementTile) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static twoConcealedKongs(hand, data) {
			if (data.kongs.concealed === 2) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static robbingTheKong(hand) {
			if (hand._robbedKong) {return 1;}
            return 0;
        }

        /**
           Lesser Honors And Knitted Tiles
		   Special hand: one of each of the 5 or 6 honors + tiles
		   from knitted tiles.
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static lesserHonorsAndKnittedTiles(hand, data) {
			if ((data.knittedData.knitMatch > 0) && data.knittedData.honors) {
                return 1;
            }
            return 0;
        }

        /**
           Knitted Straight
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static knittedStraight(hand, data) {
			if (data.knittedData.knitMatch === 9) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static upperFour(hand) {
			if (hand.minMax(6, 9)) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static lowerFour(hand) {
			if (hand.minMax(1, 4)) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static bigThreeWinds(hand) {
			if (hand.winds() === 3) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static pureStraight(hand) {
			// May only happen once.
			for (var i=0 ; i<2 ; i++) {
				if ((hand._melds[i]._type !== Meld.MeldType.CHOW) ||
					(hand._melds[i]._firstTile._num !== 1)) {
					continue;
                }

				var type0 = hand._melds[i]._firstTile._type;
				for (var j=i+1 ; j<3 ; j++) {
					if ((hand._melds[j]._type !== Meld.MeldType.CHOW) ||
						(hand._melds[j]._firstTile._num !== 4) ||
						(hand._melds[j]._firstTile._type !== type0)) {
						continue;
                    }

					for (var k=j+1 ; k<4 ; k++) {
						if ((hand._melds[k]._type !== Meld.MeldType.CHOW) ||
							(hand._melds[k]._firstTile._num !== 7) ||
							(hand._melds[k]._firstTile._type !== type0)) {
							continue;
                        }
						return 1;
					}
				}
			}
            return 0;
        }

        /**
           Three-Suited Terminal Chows 123 789 twice + pair of 5
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static threeSuitedTerminalChows(hand, data) {
			// Make sure we have 4 Chows
			if (hand.chows() !== 4) {return 0;}
			// Make sure there is no dragon nor wind
			if (data.suits[3] || data.suits[4]) {return 0;}

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
				return 1;
            }
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static pureShiftedChows(hand) {
	        for (var i=0 ; i<2 ; i++) {
				if (hand._melds[i]._type !== Meld.MeldType.CHOW) {
					continue;
                }
				var reference = hand._melds[i]._firstTile;

				for (var j=i+1 ; j<3 ; j++) {
					if ((hand._melds[j]._type !== Meld.MeldType.CHOW) ||
						(reference._tileId >= hand._melds[j]._firstTile._tileId) ||
						(reference._tileId+2 < hand._melds[j]._firstTile._tileId)) {
						continue;
                    }
					var delta = hand._melds[j]._firstTile._num - reference._num;
					if (((delta < 1) || delta > 2)) {continue;}

					for (var k=j+1 ; k<4 ; k++) {
						if ((hand._melds[k]._type !== Meld.MeldType.CHOW) ||
							(reference._tileId+2*delta !== hand._melds[k]._firstTile._tileId)) {
							continue;
                        }
						return 1;
					}
				}
			}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static allFives(hand) {
			for (var i=0 ; i<5 ; i++) {
				var t = hand._melds[i]._firstTile;
				if (!t.isRegular()) {return 0;}
				if (hand._melds[i]._type === Meld.MeldType.CHOW) {
					if ((t._num < 3) || (t._num > 5)) {return 0;}
				} else
					if (t._num !== 5) {return 0;}
			}
            return 1;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static triplePung(hand) {
			for (var i=0 ; i<2 ; i++) {
				var reference = hand._melds[i]._firstTile;
				if ((hand._melds[i]._type === Meld.MeldType.CHOW) ||
					(reference.isHonor())) {
					continue;
                }

				for (var j=i+1 ; j<3 ; j++) {
					if ((hand._melds[j]._type === Meld.MeldType.CHOW) ||
						(hand._melds[j]._firstTile.isHonor()) ||
						(reference._num !== hand._melds[j]._firstTile._num)) {
						continue;
                    }

					for (var k=j+1 ; k<4 ; k++) {
						if ((hand._melds[k]._type === Meld.MeldType.CHOW) ||
							(hand._melds[k]._firstTile.isHonor()) ||
							(reference._num !== hand._melds[k]._firstTile._num)) {
							continue;
                        }
						return 1;
					}
				}
			}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static threeConcealedPungs(hand, data) {
			if (data.nbConcealedPungs === 3) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static sevenPairs(hand) {
			// Special Hand
			for (var i = 0 ; i<14 ; i+=2) {
				if (hand._tiles[i]._tileId !== hand._tiles[i+1]._tileId) {
					return 0;
				}
			}
            return 1;
        }

        /**
           Greater Honors And Knitted Tiles
           Special hand: one of each of the 7 honors + 7 tiles
		   from knitted tiles.
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static greaterHonorsAndKnittedTiles(hand, data) {
			if (data.knittedData.knitMatch === 7) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static allEven(hand, data) {
			// Make sure there is no wind or dragon
			if (data.suits[3] || data.suits[4]) {return 0;}

			for (var i=1 ; i<=9 ; i+=2) {
				if ((data.count[Tile.TileType.BAMBOO.offset-1 + i]>0) ||
					(data.count[Tile.TileType.DOT.offset-1 + i]>0) ||
					(data.count[Tile.TileType.CHARACTER.offset-1 + i]>0)) {
					return 0;
				}
			}
			return 1;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static fullFlush(hand, data) {
			if (data.suits[3] || data.suits[4]) {return 0;}
			var nb = 0;
			if (data.suits[0]) {nb++;}
			if (data.suits[1]) {nb++;}
			if (data.suits[2]) {nb++;}
			if (nb === 1) {return 1;}

            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static pureTripleChow(hand) {
			for (var i=0 ; i<2 ; i++) {
				if ((hand._melds[i]._type !== Meld.MeldType.CHOW) ||
					(hand._melds[i+1]._type !== Meld.MeldType.CHOW) ||
					(hand._melds[i+2]._type !== Meld.MeldType.CHOW) ||

					(hand._melds[i]._firstTile._tileId !== hand._melds[i+1]._firstTile._tileId) ||
					(hand._melds[i]._firstTile._tileId !== hand._melds[i+2]._firstTile._tileId)) {
					continue;
                }
				return 1;
			}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static pureShiftedPungs(hand) {
			for (var i=0 ; i<2 ; i++) {
				if ((hand._melds[i]._type === Meld.MeldType.CHOW) ||
					(hand._melds[i+1]._type === Meld.MeldType.CHOW) ||
					(hand._melds[i+2]._type === Meld.MeldType.CHOW) ||

					(! hand._melds[i]._firstTile.isRegular()) ||
					(hand._melds[i]._firstTile._num >= 8) ||

					(hand._melds[i]._firstTile._tileId+1 !== hand._melds[i+1]._firstTile._tileId) ||
					(hand._melds[i]._firstTile._tileId+2 !== hand._melds[i+2]._firstTile._tileId)) {
					continue;
                }
				return 1;
			}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static upperTiles(hand) {
			if (hand.minMax(7, 9)) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static middleTiles(hand) {
			if (hand.minMax(4, 6)) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static lowerTiles(hand) {
			if (hand.minMax(1, 3)) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static fourShiftedChows(hand) {
			if ((hand.chows() < 4) ||
				(! hand._melds[0]._firstTile.isRegular()) ||
				(hand._melds[0]._firstTile._type !== hand._melds[3]._firstTile._type)) {
				return 0;
            }

			var tileId = hand._melds[0]._firstTile._tileId;
			var delta = hand._melds[1]._firstTile._tileId - tileId;
			if (((delta < 1) || delta > 2)) {return 0;}

			if ((hand._melds[2]._firstTile._tileId === tileId + 2*delta) &&
				(hand._melds[3]._firstTile._tileId === tileId + 3*delta)) {
				return 1;
            }
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static threeKongs(hand, data) {
			if (data.kongs.concealed + data.kongs.melded === 3) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static allTerminalsAndHonors(hand, data) {
			for (var i=2 ; i<=8 ; i++) {
				if (data.count[i-1] + data.count[9+i-1] + data.count[18+i-1] > 0) {
					return 0;
				}
			}
			return 1;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static quadrupleChow(hand) {
			if (hand.chows() < 4) {return 0;}
			var tileId = hand._melds[0]._firstTile._tileId;
			if ((hand._melds[1]._firstTile._tileId === tileId) &&
				(hand._melds[2]._firstTile._tileId === tileId) &&
				(hand._melds[3]._firstTile._tileId === tileId)) {
			    return 1;
            }
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static fourPureShiftedPungs(hand) {
			if ((hand.chows() > 0) ||
				(!hand._melds[0]._firstTile.isRegular()) ||
				(hand._melds[0]._firstTile._num >= 7)) {
				return 0;
            }

			var tileId = hand._melds[0]._firstTile._tileId;
			if ((hand._melds[1]._firstTile._tileId === tileId+1) &&
				(hand._melds[2]._firstTile._tileId === tileId+2) &&
				(hand._melds[3]._firstTile._tileId === tileId+3)) {
				return 1;
            }
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static allTerminals(hand, data) {
			if (data.suits[3] || data.suits[4]) {return 0;}
			for (var i=2 ; i<=8 ; i++) {
				if (data.count[i-1] + data.count[9+i-1] + data.count[18+i-1] > 0) {
					return 0;
				}
			}
            return 1;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static littleFourWinds(hand) {
			if ((hand.winds() === 3) &&
				(hand._melds[4]._firstTile._type === Tile.TileType.WIND)) {
				return 1;
            }
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static littleThreeDragons(hand) {
			if ((hand.dragons() === 2) &&
				(hand._melds[4]._firstTile._type === Tile.TileType.DRAGON)) {
				return 1;
            }
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static allHonors(hand, data) {
			if (!(data.suits[0] || data.suits[1] || data.suits[2])) {
				return 1;
            }
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static fourConcealedPungs(hand, data) {
			if (data.nbConcealedPungs === 4) {return 1;}
            return 0;
        }

        /**
           Pure Terminal Chows 123 789 twice + 55
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static pureTerminalChows(hand) {
            if ((hand.chows() === 4) &&
				(hand._melds[0]._firstTile._num === 1)) {
				var tileId = hand._melds[0]._firstTile._tileId;
				if ((hand._melds[1]._firstTile._tileId === tileId) &&
					(hand._melds[2]._firstTile._tileId === tileId+6) &&
					(hand._melds[3]._firstTile._tileId === tileId+6) &&
					(hand._melds[4]._firstTile._tileId === tileId+4)) {
				    return 1;
                }
			}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static bigFourWinds(hand) {
			if (hand.winds() === 4) {return 1;}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static bigThreeDragons(hand) {
			if (hand.dragons() === 3) {return 1;}
            return 0;
        }

        /**
           All Green 2-3-4-6-8 Bamboos and Green Dragon
		   Works for both normal and special hands
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static allGreen(hand, data) {
			var nbTiles = data.count[Tile.TileType.DRAGON.offset + 1];
			nbTiles += data.count[Tile.TileType.BAMBOO.offset-1 + 2];
			nbTiles += data.count[Tile.TileType.BAMBOO.offset-1 + 3];
			nbTiles += data.count[Tile.TileType.BAMBOO.offset-1 + 4];
			nbTiles += data.count[Tile.TileType.BAMBOO.offset-1 + 6];
			nbTiles += data.count[Tile.TileType.BAMBOO.offset-1 + 8];
			var target = 14 + data.kongs.concealed + data.kongs.melded;
		    if (nbTiles === target) {return 1;}
            return 0;
        }

        /**
           Nine Gates: 1112345678999 in a single suit
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static nineGates(hand) {
			// Special Hand
            if (hand._tiles[0].isRegular() &&
                (hand._tiles[0]._num === 1)) {
                var values = [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9];
			    for (var i = 1 ; i<14 ; i+=2) {
				    if (hand._tiles[i]._tileId + values[i]-1 !== hand._tiles[0]._tileId) {
					    return 0;
				    }
                }
                return 1;
			}
            return 0;
        }

        /**
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static fourKongs(hand, data) {
			if (data.kongs.concealed + data.kongs.melded === 4) {return 1;}
            return 0;
        }
        /**
           @param {Hand} hand Hand to compute rules for.
           @return {Int} number of times this rule matches
        */
        static sevenShiftedPairs(hand) {
			// Special Hand
            if (hand._tiles[0].isRegular() &&
                (hand._tiles[0]._num <= 3)) {
                var values = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7];
			    for (var i = 1 ; i<14 ; i+=2) {
				    if (hand._tiles[i]._tileId + values[i]-1 !== hand._tiles[0]._tileId) {
					    return 0;
				    }
                }
                return 1;
			}
            return 0;
        }

        /**
           Thirteen Orphans 1 & 9 of each suit, one of
		   each wind one of each dragon, last one making
		   a pair.
           @param {Hand} hand Hand to compute rules for.
           @param {Object} data Precomputed data.
           @return {Int} number of times this rule matches
        */
        static thirteenOrphans(hand, data) {

			var lookFor = [0, 8, 9+0, 9+8, 18+0, 18+8,
					   27, 28, 29,
					   30, 31, 32, 33];
			var nbOne = 0;
			var nbTwo = 0;
			for (var i=0 ; i<13 ; i++) {
				if (data.count[lookFor[i]] === 1) {nbOne++;}
				if (data.count[lookFor[i]] === 2) {nbTwo++;}
			}
			if ((nbOne === 12) && (nbTwo === 1)) {return 1;}
            return 0;
        }

	    /**
	       Compute all rules for the hand, and determines which ones score
	       @param {Hand} handIn Hand to test.
	       @param {Rule[]} rules Array of rules to check.

	       @return {Object} Number of points, matched rules, ...
	    */
	    static compute(handIn, rules) {
            // Return object
            var res = {
                nbPoints: 0,
                matched: [],
                desc : []
            };

		    // Prepare hand to make rules computation easier
		    var hand = handIn.sortedHand();
		    hand.fixConcealed();

		    // Activate all rules of the matching the hand type.
		    var ruleId;
            var active = [];
		    for (ruleId = 0 ; ruleId<rules.length ; ruleId++) {
			    active[ruleId] = hand._isNormal ?
		            rules[ruleId]._normal : rules[ruleId]._special;
			    res.matched[rules[ruleId]._indx] = false;
		    }

		    // Precompute common data useful for several rules
            var data = {
                count: hand.countTiles(),
		        suits: hand.suits(),
		        kongs: hand.kongs(),
		        flowers: hand.flowers(),
		        nbConcealedPungs: concealedPungs(hand)
            };
		    data.knittedData = computeKnittedData(hand, data.count);

		    // Try all the rules starting by the largest number of points
		    for (ruleId = rules.length-1 ; ruleId>=0 ; ruleId-- ) {
                var rule = rules[ruleId];

			    // The rule may already have been deactivated by another
			    // one taking precedence, or doe snot apply to this
			    // hand type.
			    if (!active[ruleId]) {
				    continue;
			    }

			    var matching = rule._computeCB(hand, data, res);

			    if (matching > 0) {
				    var thisScore = matching * rule._score;
				    res.nbPoints += thisScore;

				    res.matched[rule._indx] = true;
				    res.desc.push(strRes("RULES_FORMAT").format(
					    thisScore, matching, rule._indx, strRes(ruleDescriptions[rule._computeCB])));

				    // Disable implied rules
				    var impliesArray = rule._implies;
				    for (var i = 0; i<ruleId ; i++) {
                        if (impliesArray.indexOf(rules[i]._indx) >= 0) {
					        active[i] = false;
                        }
				    }
			    }
		    }

		    if (res.nbPoints === 0) {
				res.desc = [strRes("NO_VALID_HAND")];
		    }

		    if (hand._lastTile < 0) {
			    // Add a warning if the last tile is not set.
			    res.desc.push(strRes("LAST_TILE_NOT_SET"));
		    }

		    return res;
	    }
    };

    // Register the descriptions matching the rules
    hr.registerDescriptions([
	    ["PURE_DOUBLE_CHOW",    hr.pureDoubleChow],
	    ["MIXED_DOUBLE_CHOW",   hr.mixedDoubleChow],
	    ["SHORT_STRAIGHT",      hr.shortStraight],
	    ["TWO_TERMINAL_CHOWS",  hr.twoTerminalChows],
	    ["PUNG_OF_TERMINALS_OR_HONORS", hr.pungOfTerminalsOrHonors],
	    ["MELDED_KONG",         hr.meldedKong],
	    ["ONE_VOIDED_SUIT",     hr.oneVoidedSuit],
	    ["NO_HONORS",           hr.noHonors],
	    ["EDGE_WAIT",           hr.edgeWait],
	    ["CLOSED_WAIT",         hr.closedWait],
	    ["SINGLE_WAIT",         hr.singleWait],
	    ["SELF-DRAWN",          hr.selfDrawn],
	    ["FLOWER_TILES",        hr.flowerTiles],

	    ["DRAGON_PUNG",         hr.dragonPung],
	    ["PREVALENT_WIND",      hr.prevalentWind],
	    ["SEAT_WIND",           hr.seatWind],
	    ["CONCEALED_HAND",      hr.concealedHand],
	    ["ALL_CHOWS",           hr.allChows],
	    ["TILE_HOG",            hr.tileHog],
	    ["DOUBLE_PUNG",         hr.doublePung],
	    ["TWO_CONCEALED_PUNGS", hr.twoConcealedPungs],
	    ["CONCEALED_KONG",      hr.concealedKong],
	    ["ALL_SIMPLES",         hr.allSimples],

	    ["OUTSIDE_HAND",		hr.outsideHand],
	    ["FULLY_CONCEALED_HAND", hr.fullyConcealedHand],
	    ["TWO_MELDED_KONGS",	hr.twoMeldedKongs],
	    ["LAST_TILE",           hr.lastTile],

	    ["ALL_PUNGS",           hr.allPungs],
	    ["HALF_FLUSH",          hr.halfFlush],
	    ["MIXED_SHIFTED_CHOWS", hr.mixedShiftedChows],
	    ["ALL_TYPES",           hr.allTypes],
	    ["MELDED_HAND",         hr.meldedHand],
	    ["TWO_DRAGONS",         hr.twoDragons],
	    ["ONE_MELDED_AND_ONE_CONCEALED_KONG", hr.oneMeldedAndOneConcealedKong],

	    ["MIXED_STRAIGHT",      hr.mixedStraight],
	    ["REVERSIBLE_TILES",	hr.reversibleTiles],
	    ["MIXED_TRIPLE_CHOW",   hr.mixedTripleChow],
	    ["MIXED_SHIFTED_PUNGS", hr.mixedShiftedPungs],
	    ["CHICKEN_HAND",        hr.chickenHand],
	    ["LAST_TILE_DRAW",      hr.lastTileDraw],
	    ["LAST_TILE_CLAIM",     hr.lastTileClaim],
	    ["OUT_WITH_REPLACEMENT_TILE", hr.outWithReplacementTile],
	    ["TWO_CONCEALED_KONGS", hr.twoConcealedKongs],
	    ["ROBBING_THE_KONG",	hr.robbingTheKong],

	    ["LESSER_HONORS_AND_KNITTED_TILES", hr.lesserHonorsAndKnittedTiles],
	    ["KNITTED_STRAIGHT",    hr.knittedStraight],
	    ["UPPER_FOUR",          hr.upperFour],
	    ["LOWER_FOUR",          hr.lowerFour],
	    ["BIG_THREE_WINDS",     hr.bigThreeWinds],

	    ["PURE_STRAIGHT",       hr.pureStraight],
	    ["THREE-SUITED_TERMINAL_CHOWS", hr.threeSuitedTerminalChows],
	    ["PURE_SHIFTED_CHOWS",  hr.pureShiftedChows],
	    ["ALL_FIVES",           hr.allFives],
	    ["TRIPLE_PUNG",         hr.triplePung],
	    ["THREE_CONCEALED_PUNGS", hr.threeConcealedPungs],

	    ["SEVEN_PAIRS",         hr.sevenPairs],
	    ["GREATER_HONORS_AND_KNITTED_TILES",		hr.greaterHonorsAndKnittedTiles],
	    ["ALL_EVEN",            hr.allEven],
	    ["FULL_FLUSH",          hr.fullFlush],
	    ["PURE_TRIPLE_CHOW",    hr.pureTripleChow],
	    ["PURE_SHIFTED_PUNGS",  hr.pureShiftedPungs],
	    ["UPPER_TILES",         hr.upperTiles],
	    ["MIDDLE_TILES",        hr.middleTiles],
	    ["LOWER_TILES",         hr.lowerTiles],

	    ["FOUR_SHIFTED_CHOWS",  hr.fourShiftedChows],
	    ["THREE_KONGS",         hr.threeKongs],
	    ["ALL_TERMINALS_AND_HONORS", hr.allTerminalsAndHonors],

	    ["PURE_QUADRUPLE_CHOW", hr.quadrupleChow],
	    ["FOUR_PURE_SHIFTED_PUNGS", hr.fourPureShiftedPungs],

	    ["ALL_TERMINALS",       hr.allTerminals],
	    ["LITTLE_FOUR_WINDS",   hr.littleFourWinds],
	    ["LITTLE_THREE_DRAGONS", hr.littleThreeDragons],
	    ["ALL_HONORS",          hr.allHonors],
	    ["FOUR_CONCEALED_PUNGS", hr.fourConcealedPungs],
	    ["PURE_TERMINAL_CHOWS", hr.pureTerminalChows],

	    ["BIG_FOUR_WINDS",      hr.bigFourWinds],
	    ["BIG_THREE_DRAGONS",   hr.bigThreeDragons],
	    ["ALL_GREEN",           hr.allGreen],
	    ["NINE_GATES",          hr.nineGates],
	    ["FOUR_KONGS",          hr.fourKongs],
	    ["SEVEN_SHIFTED_PAIRS", hr.sevenShiftedPairs],
	    ["THIRTEEN_ORPHANS",    hr.thirteenOrphans]
    ]);

    // The public class to export
    return hr;
})();
