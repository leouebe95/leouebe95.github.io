// -*- coding: utf-8 -*-

/**
 * Abstract strategy class for Mahjong scoring rulesets (Strategy Pattern).
 */
export class RuleSetStrategy {
    constructor() {
        if (new.target === RuleSetStrategy) {
            throw new TypeError('Cannot construct RuleSetStrategy instances directly.');
        }
    }

    /**
     * Unique string identifier for the ruleset.
     * @returns {string} e.g. 'mcr', 'riichi'
     */
    get id() {
        throw new Error('Getter "id" must be implemented by subclass');
    }

    /**
     * Localized name key for the ruleset.
     * @returns {string}
     */
    get name() {
        throw new Error('Getter "name" must be implemented by subclass');
    }

    /**
     * Evaluate scoring for a given hand.
     * @param {Hand} hand Hand instance to evaluate.
     * @returns {ScoreResult} Detailed score result.
     */
    compute(hand) {
        throw new Error('Method "compute" must be implemented by subclass');
    }
}
