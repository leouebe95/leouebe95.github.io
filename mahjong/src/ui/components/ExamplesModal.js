// -*- coding: utf-8 -*-

import { HandSamples } from '../../core/rules/HandSamples.js';
import { RuleExemplars } from '../../core/rules/RuleExemplars.js';
import { Hand } from '../../core/models/Hand.js';
import { InternationalRules } from '../../core/rules/InternationalRules.js';
import { eventBus, Events } from '../../utils/EventBus.js';
import { t } from '../../core/i18n/i18n.js';

/**
 * Examples Modal allowing users to load all legacy sample hands
 * or select specific MCR rules to inspect illustrative textbook hands.
 */
export class ExamplesModal {
    /**
     * @param {HTMLElement} root
     */
    constructor(root) {
        this._root = root;
        this._currentSampleIndex = 0;
        this._rules = new InternationalRules();
        this.render();
    }

    render() {
        this._root.className = 'modal-backdrop';
        this._root.id = 'examples-modal';
        this._root.innerHTML = `
            <div class="glass-panel modal-content" style="max-width: 650px;">
                <div class="modal-header">
                    <h2 style="font-size: var(--font-size-lg); color: var(--color-accent-gold);">${t('EXAMPLES_BUTTON')}</h2>
                    <button class="modal-close-btn" id="btn-close-examples">&times;</button>
                </div>

                <!-- Section 1: Legacy Sample Hands Browser -->
                <div style="display: flex; flex-direction: column; gap: var(--space-3); padding-bottom: var(--space-4); border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h3 style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase;">
                        Sample Hands Library (1 - ${HandSamples.length})
                    </h3>
                    <div style="display: flex; gap: var(--space-2); align-items: center;">
                        <button class="btn btn-secondary" id="btn-prev-sample">&larr; Prev</button>
                        <select id="select-sample-index" class="wind-select" style="flex: 1; height: 38px;"></select>
                        <button class="btn btn-secondary" id="btn-next-sample">Next &rarr;</button>
                    </div>
                    <button class="btn btn-primary" id="btn-load-sample">Load Selected Sample</button>
                </div>

                <!-- Section 2: Rule Showcase (Exemplar hands for specific rules) -->
                <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-2);">
                    <h3 style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase;">
                        Rule Exemplars (Textbook Hands)
                    </h3>
                    <select id="select-rule-exemplar" class="wind-select" style="width: 100%; height: 38px;"></select>
                    <button class="btn btn-primary" id="btn-load-exemplar">Load Rule Exemplar</button>
                    <p id="rule-exemplar-status" role="status"></p>
                </div>
            </div>
        `;

        this._populateSampleOptions();
        this._populateRuleOptions();
        this._bindEvents();
    }

    _populateRuleOptions() {
        const select = this._root.querySelector('#select-rule-exemplar');
        this._rules.rules.forEach(rule => {
            const option = document.createElement('option');
            option.value = rule.indx;
            option.textContent = `Rule ${rule.indx}: ${t(rule.key)} (${rule.score} pt${rule.score === 1 ? '' : 's'})`;
            select.appendChild(option);
        });
    }

    _populateSampleOptions() {
        const select = this._root.querySelector('#select-sample-index');
        select.innerHTML = '';
        HandSamples.forEach((sample, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `Sample #${i + 1} (${sample.isNormal ? 'Normal' : 'Special'}, Expected: ${sample.valueHint} pts)`;
            select.appendChild(opt);
        });
    }

    _bindEvents() {
        this._root.querySelector('#btn-close-examples').addEventListener('click', () => this.close());
        this._root.onclick = (e) => {
            if (e.target === this._root) this.close();
        };

        const select = this._root.querySelector('#select-sample-index');
        this._root.querySelector('#btn-prev-sample').addEventListener('click', () => {
            let idx = parseInt(select.value, 10);
            if (idx > 0) {
                select.value = idx - 1;
                this._loadSample(idx - 1);
            }
        });

        this._root.querySelector('#btn-next-sample').addEventListener('click', () => {
            let idx = parseInt(select.value, 10);
            if (idx < HandSamples.length - 1) {
                select.value = idx + 1;
                this._loadSample(idx + 1);
            }
        });

        this._root.querySelector('#btn-load-sample').addEventListener('click', () => {
            const idx = parseInt(select.value, 10);
            this._loadSample(idx);
            this.close();
        });

        this._root.querySelector('#btn-load-exemplar').addEventListener('click', () => {
            const ruleId = parseInt(this._root.querySelector('#select-rule-exemplar').value, 10);
            const rawExemplar = RuleExemplars[ruleId] || HandSamples.find(sample => {
                const result = this._rules.compute(Hand.fromSimplifiedJSON(sample));
                return result.items.some(item => item.ruleId === ruleId);
            });
            const status = this._root.querySelector('#rule-exemplar-status');
            if (!rawExemplar) {
                status.textContent = t('NO_RULE_EXEMPLAR');
                return;
            }

            status.textContent = '';
            eventBus.emit(Events.LOAD_SAMPLE_HAND, Hand.fromSimplifiedJSON(rawExemplar));
            this.close();
        });
    }

    _loadSample(index) {
        const raw = HandSamples[index];
        if (raw) {
            const hand = Hand.fromSimplifiedJSON(raw);
            eventBus.emit(Events.LOAD_SAMPLE_HAND, hand);
        }
    }

    open() {
        this._root.classList.add('open');
    }

    close() {
        this._root.classList.remove('open');
    }
}
