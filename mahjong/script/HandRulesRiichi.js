// eslint
/* global HandRules:false */

window.HandRulesRiichi = (function(hr) {
    "use strict";

    /**
       Static array of all rules.
    */
    var data = hr.makeRules([
        [ 1, 1, "RIICHI"],
        [ 2, 1, "IPPATSU"],
        [ 3, 1, "DABURU RIICHI"],
        [ 4, 1, "Fully Concealed Hand MENZEN TSUMO"],
        [ 5, 1, "PINFU"],

        [ 3, 1, "Pure Double Chow IIPEIKOU"],
        [ 3, 1, "All Simples TANYAO CHUU"],
        [ 3, 1, "Mixed Triple Chow SAN SHOKU DOUJUN"],
        [ 3, 1, ""]
    ]);


    /**
       Description of the entire ruleset
    */
    var hrr = class {

	    /**
	       Compute all rules for the hand, and determines which ones score
	       @param {Hand} handIn Hand to test.

	       @return {Int} Number of points.
	    */
	    compute(handIn) {
            return hr.compute(handIn, data);
        }
    };

    return hrr;
})(HandRules);
