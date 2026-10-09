// -*- coding: utf-8 -*-

import { Hand } from './core/models/Hand.js';
import { Tile, TileType } from './core/models/Tile.js';
import { Meld, MeldType } from './core/models/Meld.js';
import { InternationalRules } from './core/rules/InternationalRules.js';
import { RiichiRules } from './core/rules/RiichiRules.js';
import { HandSamples } from './core/rules/HandSamples.js';
import { i18n, t } from './core/i18n/i18n.js';
import { Storage } from './utils/Storage.js';
import { eventBus, Events } from './utils/EventBus.js';

import { FlowersBar } from './ui/components/FlowersBar.js';
import { HandDisplay } from './ui/components/HandDisplay.js';
import { SpecialConditions } from './ui/components/SpecialConditions.js';
import { TilePalette } from './ui/components/TilePalette.js';
import { ScoreBreakdown } from './ui/components/ScoreBreakdown.js';
import { SettingsModal } from './ui/components/SettingsModal.js';
import { ExamplesModal } from './ui/components/ExamplesModal.js';

/**
 * Main Application Controller orchestrating components, state, and scoring rules.
 */
export class App {
    constructor() {
        this._prefs = Storage.loadPreferences();

        // Scoring strategies
        this._strategies = {
            'mcr': new InternationalRules(),
            'riichi': new RiichiRules()
        };
        this._currentStrategy = this._strategies[this._prefs.ruleset] || this._strategies['mcr'];

        // Hand State
        this._hand = new Hand();

        this._initThemeAndLocale();
        this._initComponents();
        this._setupEventListeners();

        // Load initial default sample (Sample #1) or an empty hand
        this._loadInitialHand();
    }

    _initThemeAndLocale() {
        document.documentElement.setAttribute('data-theme', this._prefs.theme || 'emerald');
        i18n.setLanguage(this._prefs.language || 'en');
    }

    _initComponents() {
        this._flowersBar = new FlowersBar(document.getElementById('flowers-bar-root'));
        this._handDisplay = new HandDisplay(document.getElementById('hand-display-root'));
        this._specialConditions = new SpecialConditions(document.getElementById('conditions-bar-root'));
        this._tilePicker = new TilePalette(document.getElementById('modal-tile-picker-root'));
        this._scoreBreakdown = new ScoreBreakdown(document.getElementById('score-breakdown-root'));

        this._settingsModal = new SettingsModal(document.getElementById('modal-settings-root'));
        this._examplesModal = new ExamplesModal(document.getElementById('modal-examples-root'));
        // Header button binds
        document.getElementById('btn-header-examples')?.addEventListener('click', () => this._examplesModal.open());
        document.getElementById('btn-header-settings')?.addEventListener('click', () => this._settingsModal.open());
        document.getElementById('btn-clear-hand')?.addEventListener('click', () => this._clearHand());
    }

    _setupEventListeners() {
        eventBus.on(Events.HAND_CHANGED, () => {
            this._hand.valueHint = -1;
            this._recomputeScore();
            this._syncComponents();
        });

        eventBus.on(Events.LOAD_SAMPLE_HAND, (newHand) => {
            this._hand = newHand;
            this._recomputeScore();
            this._syncComponents();
        });

        eventBus.on(Events.RULESET_CHANGED, (rulesetId) => {
            this._currentStrategy = this._strategies[rulesetId] || this._strategies['mcr'];
            this._prefs.ruleset = this._currentStrategy.id;
            this._recomputeScore();
            this._syncComponents();
        });

        eventBus.on(Events.LANGUAGE_CHANGED, () => {
            this._prefs.language = i18n.currentLang;
            this._updateLocalizedUI();
            this._recomputeScore();
            this._syncComponents();
        });

        eventBus.on(Events.THEME_CHANGED, (themeName) => {
            this._prefs.theme = themeName;
            document.documentElement.setAttribute('data-theme', themeName);
        });

        eventBus.on(Events.TILE_SET_CHANGED, (tileSet) => {
            this._prefs.tileSet = tileSet;
            this._syncComponents();
        });
    }

    _loadInitialHand() {
        if (HandSamples && HandSamples.length > 0) {
            this._hand = Hand.fromSimplifiedJSON(HandSamples[0]);
        } else {
            this._hand = new Hand();
            this._hand.tableWind = new Tile(TileType.WIND, 1);
            this._hand.playerWind = new Tile(TileType.WIND, 1);
        }
        this._recomputeScore();
        this._syncComponents();
    }

    _syncComponents() {
        const tileSet = this._prefs.tileSet || 'default';
        this._flowersBar.setTileSet(tileSet);
        this._flowersBar.setHand(this._hand);
        this._handDisplay.setTileSet(tileSet);
        this._handDisplay.setHand(this._hand);
        this._specialConditions.setHand(this._hand);
        this._specialConditions.setRuleset(this._currentStrategy.id);
        this._tilePicker.setHand(this._hand);
        this._tilePicker.setTileSet(tileSet);
        this._scoreBreakdown.setHand(this._hand);
    }

    _recomputeScore() {
        if (!this._hand.isComplete() || !this._hand.isValid()) {
            this._scoreBreakdown.setHand(this._hand);
            this._scoreBreakdown.setResult(null);
            return;
        }

        const scoreResult = this._currentStrategy.compute(this._hand);
        this._scoreBreakdown.setHand(this._hand);
        this._scoreBreakdown.setResult(scoreResult);
    }

    _clearHand() {
        const isNormal = this._hand.isNormal;
        this._hand = new Hand();
        this._hand.setType(isNormal);
        this._hand.tableWind = new Tile(TileType.WIND, 1);
        this._hand.playerWind = new Tile(TileType.WIND, 1);

        this._recomputeScore();
        this._syncComponents();
    }

    _updateLocalizedUI() {
        document.title = t('APP_TITLE') + ' - ' + t('APP_SUBTITLE');
        const updateText = (id, key) => {
            const el = document.getElementById(id);
            if (el) el.textContent = t(key);
        };

        updateText('title-text', 'APP_TITLE');
        updateText('text-examples', 'EXAMPLES_BUTTON');
        updateText('text-settings', 'SETTINGS_BUTTON');
        updateText('text-clear', 'CLEAR_BUTTON');

        this._flowersBar.render();
        this._handDisplay.render();
        this._specialConditions.render();
        this._tilePicker.render();
        this._scoreBreakdown.render();
        this._settingsModal.render();
        this._examplesModal.render();
    }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.__mahjongApp = new App();
});
