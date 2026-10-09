// -*- coding: utf-8 -*-

import { describe, it, assert } from '../test-runner.js';
import { Hand } from '../../src/core/models/Hand.js';
import { MeldType } from '../../src/core/models/Meld.js';
import { InternationalRules } from '../../src/core/rules/InternationalRules.js';
import { HandSamples } from '../../src/core/rules/HandSamples.js';
import { RiichiRules } from '../../src/core/rules/RiichiRules.js';
import { RuleExemplars } from '../../src/core/rules/RuleExemplars.js';
import { Tile, TileType } from '../../src/core/models/Tile.js';

describe('Integration: MCR Scoring Engine & Legacy Sample Hands', () => {
    const rules = new InternationalRules();

    it('verifies all legacy sample hands against expected valueHints', () => {
        let passCount = 0;
        const failedSamples = [];

        HandSamples.forEach((sampleJSON, i) => {
            const sample = Hand.fromSimplifiedJSON(sampleJSON);
            const result = rules.compute(sample);

            if (result.nbPoints === sample.valueHint) {
                passCount++;
            } else {
                failedSamples.push({
                    sampleIndex: i + 1,
                    expected: sample.valueHint,
                    got: result.nbPoints,
                    desc: result.desc
                });
            }
        });

        if (failedSamples.length > 0) {
            console.error('Failed Samples:', failedSamples);
            const first = failedSamples[0];
            throw new Error(`Sample #${first.sampleIndex} failed: expected ${first.expected} pts, got ${first.got} pts. Rules: ${first.desc.join(', ')}`);
        }

        assert.equal(HandSamples.length, 100, 'The original legacy library contains 100 samples');
        assert.equal(passCount, HandSamples.length, `All ${HandSamples.length} sample hands passed with exact score match!`);
    });

    it('includes suppressed matching rules with zero points and rule attribution', () => {
        const sample = Hand.fromSimplifiedJSON(HandSamples[0]);
        const result = rules.compute(sample);
        const implied = result.items.find(item => item.isImplied);

        assert.ok(implied, 'At least one matching rule is suppressed');
        assert.equal(implied.totalPoints, 0, 'Suppressed rules do not add to the score');
        assert.ok(implied.impliedBy, 'Suppressed rule names its parent rule');
        assert.ok(Array.isArray(implied.meldIndices), 'Suppressed rules expose meld attribution');
        assert.ok(Array.isArray(implied.tileIndices), 'Suppressed rules expose tile attribution');
    });

    it('exposes all 81 MCR scoring rules plus the flower bonus rule', () => {
        assert.equal(rules.rules.length, 82);
        assert.equal(rules.rules.filter(rule => rule.indx !== 13).length, 81);
    });

    it('provides a valid matching example for every MCR rule', () => {
        const examples = [...HandSamples, ...Object.values(RuleExemplars)];
        const missingRules = rules.rules.filter(rule => !examples.some(raw => {
            const hand = Hand.fromSimplifiedJSON(raw);
            return hand.isComplete() && hand.isValid() &&
                rules.compute(hand).items.some(item => item.ruleId === rule.indx);
        }));

        assert.deepEqual(missingRules.map(rule => rule.indx), []);
    });

    it('scores Riichi and indicator dora as Han without adding Han to the point payout', () => {
        const hand = Hand.fromSimplifiedJSON(HandSamples[1]);
        hand.riichi = true;
        hand.dora = new Tile(TileType.BAMBOO, 8);
        hand.uradora = new Tile(TileType.BAMBOO, 8);

        const result = new RiichiRules().compute(hand);
        const earnedHan = result.items.reduce((total, item) => total + item.totalPoints, 0);

        assert.ok(result.han >= 4, 'Includes Riichi, Dora, Ura-dora, and hand yaku');
        assert.equal(earnedHan, result.han, 'Breakdown Han matches the total Han');
        assert.ok(result.nbPoints > result.han, 'Point payout is kept separate from Han');
        assert.ok(result.scoreSummary.includes('Fu'), 'Fu and Han are displayed together');
    });

    it('scores Renhou as yakuman even when it is the hand’s only yaku', () => {
        const hand = new Hand();
        hand.tableWind = new Tile(TileType.WIND, 1);
        hand.playerWind = new Tile(TileType.WIND, 2);
        hand.lastTile = 12;
        hand.renho = true;
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 1));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.CHARACTER, 2));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.DOT, 4));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 6));
        hand.addMeld(MeldType.PAIR, new Tile(TileType.DOT, 8));

        const result = new RiichiRules().compute(hand);

        assert.equal(result.han, 13);
        assert.ok(result.items.some(item => item.name === 'RENHO'));
    });

    it('treats special hands as closed for concealed-hand yaku values', () => {
        const hand = Hand.fromSimplifiedJSON({
            isNormal: false,
            lastTile: 0,
            selfDrawn: false,
            tableWind: { type: 'wind', num: 1 },
            playerWind: { type: 'wind', num: 2 },
            tiles: [
                { type: 'bamboo', num: 1 }, { type: 'bamboo', num: 1 },
                { type: 'bamboo', num: 2 }, { type: 'bamboo', num: 2 },
                { type: 'bamboo', num: 3 }, { type: 'bamboo', num: 3 },
                { type: 'bamboo', num: 4 }, { type: 'bamboo', num: 4 },
                { type: 'bamboo', num: 5 }, { type: 'bamboo', num: 5 },
                { type: 'wind', num: 3 }, { type: 'wind', num: 3 },
                { type: 'wind', num: 4 }, { type: 'wind', num: 4 }
            ]
        });

        const result = new RiichiRules().compute(hand);

        assert.equal(result.han, 5, 'Seven Pairs (2) plus closed Half Flush (3)');
    });

    it('scores two concealed pungs as a two-han Riichi yaku', () => {
        const hand = new Hand();
        hand.tableWind = new Tile(TileType.WIND, 1);
        hand.playerWind = new Tile(TileType.WIND, 2);
        hand.lastTile = 12;
        hand.addMeld(MeldType.PUNG, new Tile(TileType.BAMBOO, 2), true);
        hand.addMeld(MeldType.PUNG, new Tile(TileType.CHARACTER, 4), true);
        hand.addMeld(MeldType.PUNG, new Tile(TileType.DOT, 6), false);
        hand.addMeld(MeldType.PUNG, new Tile(TileType.DRAGON, 2), false);
        hand.addMeld(MeldType.PAIR, new Tile(TileType.WIND, 3));

        const result = new RiichiRules().compute(hand);
        const yaku = result.items.find(item => item.name === 'TWO_CONCEALED_PUNGS');

        assert.ok(yaku, 'Two concealed pungs are recognized');
        assert.equal(yaku.points, 2);
        assert.ok(!result.items.some(item => item.name === 'SEVEN_PAIRS'), 'Pungs are not misclassified as Seven Pairs');
    });
});
