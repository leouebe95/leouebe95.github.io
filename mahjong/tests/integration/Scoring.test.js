// -*- coding: utf-8 -*-

import { describe, it, assert } from '../test-runner.js';
import { Hand } from '../../src/core/models/Hand.js';
import { MeldType } from '../../src/core/models/Meld.js';
import { InternationalRules } from '../../src/core/rules/InternationalRules.js';
import { HandSamples } from '../../src/core/rules/HandSamples.js';
import { RiichiRules } from '../../src/core/rules/RiichiRules.js';
import { RuleExemplars } from '../../src/core/rules/RuleExemplars.js';
import { Tile, TileType } from '../../src/core/models/Tile.js';
import { ScoreBreakdown } from '../../src/ui/components/ScoreBreakdown.js';
import { HandDisplay } from '../../src/ui/components/HandDisplay.js';
import { t } from '../../src/core/i18n/i18n.js';

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

    it('attributes repeated pure double chows to each exact chow occurrence', () => {
        const hand = new Hand();
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 1));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 1));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.CHARACTER, 4));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.CHARACTER, 4));
        hand.addMeld(MeldType.PAIR, new Tile(TileType.DOT, 9));

        const item = rules.compute(hand).items.find(scoreItem => scoreItem.ruleId === 1);

        assert.ok(item, 'Pure double chow is scored');
        assert.equal(item.highlightGroups.length, item.count, 'Each scored occurrence has its own highlight group');
        assert.deepEqual(item.highlightGroups.map(group => group.meldIndices), [[0, 1], [2, 3]]);
    });

    it('attributes flower bonus to only the selected flower tiles', () => {
        const hand = new Hand();
        hand.addFlower(new Tile(TileType.FLOWER, 1));
        hand.addFlower(new Tile(TileType.SEASON, 2));

        const attribution = InternationalRules.getAttribution(13, hand, {});

        assert.deepEqual(attribution.flowerIndices, [0, 5]);
        assert.deepEqual(attribution.meldIndices, []);
    });

    it('keeps mixed triple chow attribution off the unrelated pair', () => {
        const hand = Hand.fromSimplifiedJSON(HandSamples[0]);
        const item = rules.compute(hand).items.find(scoreItem => scoreItem.ruleId === 37);

        assert.ok(item, 'Mixed triple chow is scored in the sample hand');
        assert.equal(item.highlightGroups.length, 1);
        assert.equal(item.highlightGroups[0].meldIndices.length, 3);
        assert.ok(!item.highlightGroups[0].meldIndices.includes(4), 'The unrelated pair is not highlighted');
    });

    it('exposes every repeated mixed double chow occurrence', () => {
        const hand = Hand.fromSimplifiedJSON(HandSamples[0]);
        const item = rules.compute(hand).items.find(scoreItem => scoreItem.ruleId === 2);

        assert.ok(item, 'Mixed double chow is present in the sample hand');
        assert.equal(item.highlightGroups.length, item.count);
    });

    it('counts only disjoint short-straight chow pairs', () => {
        const hand = new Hand();
        hand.tableWind = new Tile(TileType.WIND, 1);
        hand.playerWind = new Tile(TileType.WIND, 2);
        hand.lastTile = 12;
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 1));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 1));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 4));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 4));
        hand.addMeld(MeldType.PAIR, new Tile(TileType.DOT, 9));

        const item = rules.compute(hand).items.find(scoreItem => scoreItem.ruleId === 3);

        assert.ok(item, 'Short Straight is present');
        assert.equal(item.count, 2, 'Each chow contributes to at most one counted pair');
    });

    it('does not award All Chows to knitted-straight special hands', () => {
        const hand = new Hand();
        hand.setType(false);
        hand.tableWind = new Tile(TileType.WIND, 1);
        hand.playerWind = new Tile(TileType.WIND, 2);
        hand.lastTile = 13;
        [
            [TileType.BAMBOO, 1], [TileType.BAMBOO, 4], [TileType.BAMBOO, 7],
            [TileType.CHARACTER, 2], [TileType.CHARACTER, 5], [TileType.CHARACTER, 8],
            [TileType.DOT, 3], [TileType.DOT, 6], [TileType.DOT, 9],
            [TileType.BAMBOO, 2], [TileType.BAMBOO, 3], [TileType.BAMBOO, 4],
            [TileType.DOT, 5], [TileType.DOT, 5]
        ].forEach(([type, num]) => hand.addTile(new Tile(type, num)));

        const result = rules.compute(hand);

        assert.ok(result.items.some(item => item.ruleId === 46), 'Knitted Straight is recognized');
        assert.ok(!result.items.some(item => item.ruleId === 18), 'A knitted straight is not four chows');
        assert.ok(!result.items.some(item => item.ruleId === 8 && item.isImplied),
            'No Honors is not implied by the absent All Chows pattern');
    });

    it('does not award All Chows or No Honors when the pair is a dragon', () => {
        const hand = new Hand();
        hand.tableWind = new Tile(TileType.WIND, 1);
        hand.playerWind = new Tile(TileType.WIND, 2);
        hand.lastTile = 12;
        [
            [TileType.BAMBOO, 1], [TileType.CHARACTER, 2],
            [TileType.DOT, 4], [TileType.BAMBOO, 6]
        ].forEach(([type, num]) => hand.addMeld(MeldType.CHOW, new Tile(type, num)));
        hand.addMeld(MeldType.PAIR, new Tile(TileType.DRAGON, 1));

        const result = rules.compute(hand);

        assert.ok(!result.items.some(item => item.ruleId === 18), 'A dragon pair is not All Chows');
        assert.ok(!result.items.some(item => item.ruleId === 8), 'A dragon pair is an honor');
    });

    it('scores seven pairs regardless of tile entry order and without requiring a winning-tile marker', () => {
        const hand = new Hand();
        hand.setType(false);
        hand.tableWind = new Tile(TileType.WIND, 1);
        hand.playerWind = new Tile(TileType.WIND, 2);
        [
            [TileType.BAMBOO, 1], [TileType.CHARACTER, 1],
            [TileType.DOT, 1], [TileType.DRAGON, 1],
            [TileType.BAMBOO, 9], [TileType.CHARACTER, 9],
            [TileType.DOT, 9]
        ].forEach(([type, num]) => {
            hand.addTile(new Tile(type, num));
            hand.addTile(new Tile(type, num));
        });

        assert.equal(hand.lastTile, -1, 'The hand has no winning-tile selection');
        assert.isTrue(hand.isComplete(), 'A complete special hand does not require a winning-tile marker');
        const result = rules.compute(hand);
        const sevenPairs = result.items.find(item => item.ruleId === 56);
        assert.ok(sevenPairs, 'Seven Pairs scores from unordered pair tiles');
        assert.equal(sevenPairs.totalPoints, 24, 'Seven Pairs receives its 24-fan value');
        assert.isTrue(result.isValid, 'The complete special hand is eligible for scoring');
    });

    it('recognizes Nine Gates in a concealed regular-hand decomposition', () => {
        const hand = new Hand();
        hand.tableWind = new Tile(TileType.WIND, 1);
        hand.playerWind = new Tile(TileType.WIND, 2);
        hand.lastTile = 12;
        hand.addMeld(MeldType.PUNG, new Tile(TileType.BAMBOO, 1));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 2));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 5));
        hand.addMeld(MeldType.PUNG, new Tile(TileType.BAMBOO, 9));
        hand.addMeld(MeldType.PAIR, new Tile(TileType.BAMBOO, 8));

        const result = rules.compute(hand);

        assert.ok(result.items.some(item => item.ruleId === 79), 'Nine Gates is recognized');

        const selfDrawnHand = hand.clone();
        selfDrawnHand.selfDrawn = true;
        const selfDrawnResult = rules.compute(selfDrawnHand);
        assert.ok(selfDrawnResult.items.some(item => item.ruleId === 79),
            'A concealed self-drawn Nine Gates hand is recognized');

        hand.melds[0].isConcealed = false;
        const openResult = rules.compute(hand);
        assert.ok(!openResult.items.some(item => item.ruleId === 79),
            'Nine Gates requires the normal-hand sets to be concealed');
    });

    it('rejects MCR hands below 8 fan and does not let flowers reach the minimum', () => {
        const hand = new Hand();
        hand.tableWind = new Tile(TileType.WIND, 1);
        hand.playerWind = new Tile(TileType.WIND, 2);
        hand.lastTile = 12;
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 1));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 4));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.CHARACTER, 2));
        hand.addMeld(MeldType.CHOW, new Tile(TileType.DOT, 6));
        hand.addMeld(MeldType.PAIR, new Tile(TileType.BAMBOO, 5));
        hand.addFlower(new Tile(TileType.FLOWER, 1));

        const result = rules.compute(hand);

        assert.equal(result.nbPoints, 6, 'Flower fan is not added below the threshold');
        assert.isFalse(result.isValid, 'A sub-eight-fan hand cannot win under MCR');
        assert.ok(result.warnings.includes('MCR_MINIMUM_NOT_MET'));
        assert.ok(!result.items.some(item => item.ruleId === 13), 'Flower points are omitted');

        const root = document.createElement('section');
        document.body.appendChild(root);
        const breakdown = new ScoreBreakdown(root);
        breakdown.setHand(hand);
        breakdown.setResult(result);
        assert.equal(
            root.querySelector('.score-validity-warning').textContent,
            t('MCR_MINIMUM_NOT_MET'),
            'The score area explains why the hand cannot win'
        );
        const totalCard = root.querySelector('.total-score-card');
        assert.ok(totalCard.querySelector('.total-score-value').classList.contains('total-score-invalid'),
            'A below-minimum total is styled as invalid');
        assert.equal(
            totalCard.firstElementChild.className,
            'score-validity-warning',
            'The invalid-hand message appears to the left of the total points'
        );
        root.remove();
    });

    it('highlights tiles without changing their layout dimensions or position', () => {
        const tile = document.createElement('button');
        tile.className = 'mj-tile';
        tile.style.width = '40px';
        tile.style.height = '60px';
        document.body.appendChild(tile);
        const before = {
            width: tile.offsetWidth,
            height: tile.offsetHeight,
            transform: getComputedStyle(tile).transform
        };

        tile.classList.add('combination-highlight', 'combination-highlight-color-0');

        assert.equal(tile.offsetWidth, before.width, 'Highlight does not change tile width');
        assert.equal(tile.offsetHeight, before.height, 'Highlight does not change tile height');
        assert.equal(getComputedStyle(tile).transform, before.transform,
            'Highlight does not translate or scale the tile');
        tile.remove();
    });

    it('does not reflow meld rows when a score combination is highlighted', () => {
        const hand = new Hand();
        [
            [TileType.BAMBOO, 1], [TileType.CHARACTER, 2],
            [TileType.DOT, 4], [TileType.BAMBOO, 6]
        ].forEach(([type, num]) => hand.addMeld(MeldType.CHOW, new Tile(type, num)));
        hand.addMeld(MeldType.PAIR, new Tile(TileType.DOT, 8));

        const root = document.createElement('section');
        root.style.width = '420px';
        document.body.appendChild(root);
        const display = new HandDisplay(root);
        display.setHand(hand);
        const groups = [...root.querySelectorAll('.meld-group')];
        const measure = () => groups.map(group => {
            const { x, y, width, height } = group.getBoundingClientRect();
            return [x, y, width, height];
        });
        const before = measure();

        display.highlightTiles({
            meldIndices: [],
            tileIndices: [],
            highlightGroups: [{ meldIndices: [0, 1, 2], tileIndices: [] }]
        });

        assert.deepEqual(measure(), before, 'Highlight does not change meld position or wrapping');
        assert.equal(
            getComputedStyle(root.querySelector('.combination-highlight')).transform,
            'none',
            'Highlighted tiles do not scale or translate'
        );
        root.remove();
    });

    it('displays a keyboard-accessible rule explanation popup for score rows', () => {
        const hand = new Hand();
        hand.tableWind = new Tile(TileType.WIND, 1);
        hand.playerWind = new Tile(TileType.WIND, 2);
        hand.lastTile = 0;
        hand.addMeld(MeldType.CHOW, new Tile(TileType.BAMBOO, 2), false);
        hand.addMeld(MeldType.CHOW, new Tile(TileType.CHARACTER, 4), false);
        hand.addMeld(MeldType.CHOW, new Tile(TileType.DOT, 6), false);
        hand.addMeld(MeldType.PUNG, new Tile(TileType.BAMBOO, 8), false);
        hand.addMeld(MeldType.PAIR, new Tile(TileType.DRAGON, 1));
        const result = rules.compute(hand);
        const root = document.createElement('section');
        document.body.appendChild(root);
        const breakdown = new ScoreBreakdown(root);
        breakdown.setHand(hand);
        breakdown.setResult(result);
        const row = root.querySelector('.score-item-row');

        assert.ok(row, 'The score row is rendered');
        row.dispatchEvent(new FocusEvent('focus'));
        const tooltip = document.getElementById('score-rule-tooltip');
        assert.ok(tooltip, 'Focusing the row opens a tooltip');
        assert.equal(tooltip.getAttribute('role'), 'tooltip');
        assert.equal(tooltip.textContent, t(`${result.items[0].name}_DESCRIPTION`));
        assert.equal(row.getAttribute('aria-describedby'), tooltip.id);

        row.dispatchEvent(new FocusEvent('blur'));
        row.dispatchEvent(new MouseEvent('mouseenter'));
        assert.ok(document.getElementById('score-rule-tooltip'), 'Hovering over the row opens the tooltip');
        row.dispatchEvent(new MouseEvent('mouseleave'));
        root.remove();
        assert.ok(!document.getElementById('score-rule-tooltip'), 'The tooltip is removed when the pointer leaves');
    });

    it('provides English explanations for every MCR and implemented Riichi rule row', () => {
        const riichiRuleKeys = [
            'TANYAO_CHUU', 'PINFU', 'IIPEIKOU', 'RYAN_PEIKOU', 'FULLY_CONCEALED_HAND',
            'DOUBLE_RIICHI', 'RIICHI', 'IPPATSU', 'DRAGON_PUNG', 'PREVALENT_WIND',
            'SEAT_WIND', 'SEVEN_PAIRS', 'ALL_PUNGS', 'HALF_FLUSH', 'FULL_FLUSH',
            'MIXED_TRIPLE_CHOW', 'PURE_STRAIGHT', 'OUTSIDE_HAND', 'TRIPLE_PUNG',
            'TWO_CONCEALED_PUNGS', 'THREE_CONCEALED_PUNGS', 'THREE_KONGS',
            'LITTLE_THREE_DRAGONS', 'ALL_TERMINALS_AND_HONORS', 'LAST_TILE_DRAW',
            'LAST_TILE_CLAIM', 'OUT_WITH_REPLACEMENT_TILE', 'ROBBING_THE_KONG',
            'JUNCHAN', 'TENHO', 'CHIHO', 'RENHO', 'THIRTEEN_ORPHANS', 'ALL_GREEN',
            'ALL_HONORS', 'BIG_THREE_DRAGONS', 'BIG_FOUR_WINDS', 'FOUR_CONCEALED_PUNGS',
            'FOUR_KONGS', 'NINE_GATES', 'ALL_TERMINALS', 'LITTLE_FOUR_WINDS',
            'DORA', 'URADORA'
        ];
        const allRuleKeys = [
            ...rules.rules.map(rule => rule.key),
            ...riichiRuleKeys
        ];

        allRuleKeys.forEach(key => {
            assert.ok(t(`${key}_DESCRIPTION`) !== `${key}_DESCRIPTION`,
                `Missing explanation for ${key}`);
        });
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
