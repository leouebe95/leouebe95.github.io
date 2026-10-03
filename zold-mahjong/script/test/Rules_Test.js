// For eslint
/* global QUnit:false Hand:false HandRulesInternational:false HandSamples:false */
/* exported Rules_Test */


/**
   Unit test function for Rule.
*/
function Rules_Test() {
    'use strict';

    // Check the computations for each data sample.
    QUnit.module('Rule');

    QUnit.test('basic', function(assert) {
	    var rules = new HandRulesInternational();
	    var startAt = 1-1;

	    var ignore = []; // To test later
	    for (var i = startAt ; i<HandSamples.length ; i++ ) {
	        if (ignore.indexOf(i+1) >= 0) {continue;}

	        var sample = Hand.fromSimplifiedJSON(HandSamples[i]);
	        var result = rules.compute(sample);

	        var message = 'Testing Hand sample '+String(i+1)+', '+result.nbPoints+' points\n';
	        if (result.nbPoints !== sample._valueHint) {
		        message += result.desc.join('\n');
		        message += '\n'+JSON.stringify(sample.simplifiedJSON());
	        }
	        assert.equal(result.nbPoints, sample._valueHint, message);
	    }
    });
}
