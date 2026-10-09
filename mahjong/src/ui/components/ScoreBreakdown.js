// -*- coding: utf-8 -*-

import { eventBus, Events } from '../../utils/EventBus.js';
import { t } from '../../core/i18n/i18n.js';

/**
 * Score breakdown panel with total points and interactive combination tile highlighting.
 * Displays implied/suppressed rules with 0 points and pedagogical explanation notes.
 */
export class ScoreBreakdown {
    /**
     * @param {HTMLElement} root
     */
    constructor(root) {
        this._root = root;
        this._scoreResult = null;
        this._hand = null;
        this.render();
    }

    setHand(hand) {
        this._hand = hand;
    }

    setResult(scoreResult) {
        this._scoreResult = scoreResult;
        this.render();
    }

    render() {
        this._root.className = 'glass-panel score-panel';

        if (!this._hand || !this._hand.isComplete()) {
            this._root.innerHTML = `
                <div class="total-score-card">
                    <span class="total-score-value" style="font-size: var(--font-size-xl); color: var(--color-text-muted);">
                        ${t('INCOMPLETE')}
                    </span>
                </div>
                <p style="font-size: var(--font-size-xs); color: var(--color-text-muted);">
                    Fill all 14 tiles (4 melds + 1 pair) and set table conditions to compute scoring.
                </p>
            `;
            return;
        }

        if (!this._hand.isValid()) {
            this._root.innerHTML = `
                <div class="total-score-card">
                    <span class="total-score-value" style="font-size: var(--font-size-xl); color: var(--color-accent-red);">
                        ${t('INVALID_HAND')}
                    </span>
                </div>
            `;
            return;
        }

        if (!this._scoreResult) return;

        let expectedText = '';
        if (this._hand.valueHint && this._hand.valueHint > 0 && this._scoreResult.nbPoints !== this._hand.valueHint) {
            expectedText = t('EXPECTED', this._hand.valueHint);
        }

        this._root.innerHTML = `
            <div class="total-score-card">
                <span class="total-score-value">${this._scoreResult.nbPoints}</span>
                <span style="font-size: var(--font-size-base); color: var(--color-text-secondary); font-weight: 600;">pts ${expectedText}</span>
            </div>
            ${this._scoreResult.scoreSummary ? `<p class="score-summary">${this._scoreResult.scoreSummary}</p>` : ''}
            <div class="score-items-list" id="score-items-list"></div>
        `;

        const listContainer = this._root.querySelector('#score-items-list');

        if (this._scoreResult.items.length === 0) {
            const emptyNotice = document.createElement('div');
            emptyNotice.style.fontSize = 'var(--font-size-sm)';
            emptyNotice.style.color = 'var(--color-text-muted)';
            emptyNotice.textContent = t('NO_VALID_HAND');
            listContainer.appendChild(emptyNotice);
            return;
        }

        this._scoreResult.items.forEach(item => {
            const row = document.createElement('div');
            row.className = `score-item-row ${item.isImplied ? 'score-item-implied' : ''}`;

            const left = document.createElement('div');
            left.className = 'score-item-left';

            const name = document.createElement('span');
            name.className = 'score-item-name';
            name.textContent = t(item.name);
            left.appendChild(name);

            if (item.count > 1) {
                const countBadge = document.createElement('span');
                countBadge.style.fontSize = '11px';
                countBadge.style.color = 'var(--color-accent-gold)';
                countBadge.textContent = `(${item.count}x)`;
                left.appendChild(countBadge);
            }

            if (item.isImplied) {
                const impliedTag = document.createElement('span');
                impliedTag.className = 'score-item-implied-tag';
                impliedTag.textContent = t('IMPLIED_FROM', item.impliedBy);
                left.appendChild(impliedTag);
            }

            const right = document.createElement('div');
            const points = document.createElement('span');
            points.className = 'score-item-points';
            const unit = this._scoreResult.han > 0 ? 'Han' : 'pts';
            points.textContent = item.isImplied ? `0 ${unit}` : `+${item.totalPoints} ${unit}`;
            right.appendChild(points);

            row.appendChild(left);
            row.appendChild(right);

            // Interactive Tile Highlighting Event Dispatchers
            const emitHighlight = () => {
                eventBus.emit(Events.HIGHLIGHT_TILES, {
                    meldIndices: item.meldIndices,
                    tileIndices: item.tileIndices
                });
            };

            const clearHighlight = () => {
                eventBus.emit(Events.CLEAR_HIGHLIGHT);
            };

            row.addEventListener('mouseenter', emitHighlight);
            row.addEventListener('mouseleave', clearHighlight);
            row.addEventListener('click', emitHighlight);

            listContainer.appendChild(row);
        });
    }
}
