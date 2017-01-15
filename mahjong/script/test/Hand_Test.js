// For eslint
/* global QUnit:false Hand:false HandSamples:false */
/* exported Hand_Test */

function Hand_Test() {
    "use strict";

    QUnit.module("Hand");

    QUnit.test("basic", function(assert) {
	    var sample001 = Hand.fromSimplifiedJSON(HandSamples[1-1]);
	    var sample002 = Hand.fromSimplifiedJSON(HandSamples[2-1]);
	    var sample099 = Hand.fromSimplifiedJSON(HandSamples[99-1]);

        assert.equal(sample001.valueHint, 11, "Test valueHint for sample #1");
	    assert.equal(sample002.valueHint, 22, "Test valueHint for sample #2");
	    assert.equal(sample099.valueHint, 96, "Test valueHint for sample #99");

	    // copyFrom
	    // setType
	    // setWinds

	    // countTiles
    });
}
