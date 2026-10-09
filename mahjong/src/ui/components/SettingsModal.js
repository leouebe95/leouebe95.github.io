// -*- coding: utf-8 -*-

import { Storage } from '../../utils/Storage.js';
import { eventBus, Events } from '../../utils/EventBus.js';
import { i18n, t } from '../../core/i18n/i18n.js';

/**
 * Transient Settings Modal for themes, rulesets, languages, and tile styles.
 */
export class SettingsModal {
    /**
     * @param {HTMLElement} root
     */
    constructor(root) {
        this._root = root;
        this._prefs = Storage.loadPreferences();
        this.render();
    }

    render() {
        this._root.className = 'modal-backdrop';
        this._root.id = 'settings-modal';
        this._root.innerHTML = `
            <div class="glass-panel modal-content">
                <div class="modal-header">
                    <h2 style="font-size: var(--font-size-lg); color: var(--color-accent-gold);">${t('SETTINGS_BUTTON')}</h2>
                    <button class="modal-close-btn" id="btn-close-settings">&times;</button>
                </div>

                <div style="display: flex; flex-direction: column; gap: var(--space-4);">
                    <!-- Theme Selector -->
                    <div>
                        <label style="display: block; font-size: var(--font-size-sm); font-weight: 600; margin-bottom: 6px;">
                            Theme
                        </label>
                        <select id="select-theme" class="wind-select" style="width: 100%; height: 38px;">
                            <option value="emerald">Imperial Emerald Glassmorphism</option>
                            <option value="zen">Modern Zen (Minimalist Nordic-Japanese)</option>
                            <option value="cyberpunk">Cyberpunk Riichi (Midnight Neon)</option>
                            <option value="neumorphic">Tactile Neumorphic (Green Felt Table)</option>
                            <option value="bauhaus">Scandinavian Bauhaus (Grid Monochrome)</option>
                        </select>
                    </div>

                    <!-- Ruleset Selector -->
                    <div>
                        <label style="display: block; font-size: var(--font-size-sm); font-weight: 600; margin-bottom: 6px;">
                            Scoring Ruleset
                        </label>
                        <select id="select-ruleset" class="wind-select" style="width: 100%; height: 38px;">
                            <option value="mcr">${t('RULESET_INTERNATIONAL')}</option>
                            <option value="riichi">${t('RULESET_RIICHI')}</option>
                        </select>
                    </div>

                    <!-- Language Selector -->
                    <div>
                        <label style="display: block; font-size: var(--font-size-sm); font-weight: 600; margin-bottom: 6px;">
                            Language
                        </label>
                        <select id="select-language" class="wind-select" style="width: 100%; height: 38px;">
                            <option value="en">English</option>
                            <option value="fr">Français</option>
                            <option value="ja">日本語</option>
                            <option value="zh-CN">简体中文</option>
                            <option value="zh-TW">繁體中文</option>
                        </select>
                    </div>

                    <!-- Tile Face Style -->
                    <div>
                        <label style="display: block; font-size: var(--font-size-sm); font-weight: 600; margin-bottom: 6px;">
                            Tile Face Style
                        </label>
                        <select id="select-tileset" class="wind-select" style="width: 100%; height: 38px;">
                            <option value="default">Classic Standard</option>
                            <option value="alt">High-Definition Textured (Alt)</option>
                        </select>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: var(--space-2);">
                    <button class="btn btn-primary" id="btn-save-settings">Save & Apply</button>
                </div>
            </div>
        `;

        this._bindEvents();
        this._applyStoredValues();
    }

    _applyStoredValues() {
        const p = this._prefs;
        const themeSel = this._root.querySelector('#select-theme');
        const ruleSel = this._root.querySelector('#select-ruleset');
        const langSel = this._root.querySelector('#select-language');
        const tileSel = this._root.querySelector('#select-tileset');

        if (p.theme) themeSel.value = p.theme;
        if (p.ruleset) ruleSel.value = p.ruleset;
        if (p.language) langSel.value = p.language;
        if (p.tileSet) tileSel.value = p.tileSet;
    }

    _bindEvents() {
        this._root.querySelector('#btn-close-settings').addEventListener('click', () => this.close());
        this._root.onclick = (e) => {
            if (e.target === this._root) this.close();
        };

        this._root.querySelector('#btn-save-settings').addEventListener('click', () => {
            const theme = this._root.querySelector('#select-theme').value;
            const ruleset = this._root.querySelector('#select-ruleset').value;
            const language = this._root.querySelector('#select-language').value;
            const tileSet = this._root.querySelector('#select-tileset').value;

            this._prefs = Storage.savePreferences({ theme, ruleset, language, tileSet });

            document.documentElement.setAttribute('data-theme', theme);
            i18n.setLanguage(language);
            eventBus.emit(Events.THEME_CHANGED, theme);
            eventBus.emit(Events.RULESET_CHANGED, ruleset);
            eventBus.emit(Events.TILE_SET_CHANGED, tileSet);
            this.close();
        });
    }

    open() {
        this._applyStoredValues();
        this._root.classList.add('open');
    }

    close() {
        this._root.classList.remove('open');
    }
}
