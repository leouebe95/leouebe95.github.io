// -*- coding: utf-8 -*-

/**
 * Score line item representing a single evaluated fan / yaku rule.
 */
export class ScoreItem {
    constructor({
        ruleId,
        name,
        points = 0,
        count = 1,
        isImplied = false,
        impliedBy = null,
        tileIndices = [],
        meldIndices = []
    }) {
        this.ruleId = ruleId;
        this.name = name;
        this.points = points;
        this.count = count;
        this.isImplied = isImplied;
        this.impliedBy = impliedBy;
        this.tileIndices = tileIndices;
        this.meldIndices = meldIndices;
    }

    get totalPoints() {
        return this.isImplied ? 0 : this.points * this.count;
    }
}

/**
 * Score calculation result container.
 */
export class ScoreResult {
    constructor() {
        this.nbPoints = 0;
        this.han = 0;
        this.fu = 0;
        this.scoreSummary = '';
        this.items = [];
        this.desc = [];
        this.matched = {};
        this.isValid = true;
        this.warnings = [];
    }

    /**
     * Add a scored rule.
     * @param {ScoreItem|Object} item
     */
    addItem(item) {
        const scoreItem = item instanceof ScoreItem ? item : new ScoreItem(item);
        this.items.push(scoreItem);
        if (!scoreItem.isImplied) {
            this.nbPoints += scoreItem.totalPoints;
            this.matched[scoreItem.ruleId] = true;
        }
    }
}
