// -*- coding: utf-8 -*-

/**
 * Persistence manager using localStorage with safe fallbacks.
 */
export class Storage {
    static get KEY_PREFERENCES() {
        return 'mahjong_preferences';
    }

    static getDefaults() {
        return {
            theme: 'emerald',      // 'emerald' | 'zen' | 'cyberpunk' | 'neumorphic' | 'bauhaus'
            ruleset: 'mcr',        // 'mcr' | 'riichi'
            language: 'en',        // 'en' | 'fr' | 'ja' | 'zh-CN' | 'zh-TW'
            tileSet: 'default',    // 'default' | 'alt'
            soundEnabled: false
        };
    }

    /**
     * Load stored preferences or defaults.
     * @returns {Object} Stored preferences object.
     */
    static loadPreferences() {
        try {
            const raw = localStorage.getItem(Storage.KEY_PREFERENCES);
            if (raw) {
                return { ...Storage.getDefaults(), ...JSON.parse(raw) };
            }
        } catch (e) {
            console.warn('[Storage] Could not load preferences from localStorage:', e);
        }
        return Storage.getDefaults();
    }

    /**
     * Save user preferences to localStorage.
     * @param {Object} prefs Partial or complete preferences object.
     */
    static savePreferences(prefs) {
        try {
            const current = Storage.loadPreferences();
            const updated = { ...current, ...prefs };
            localStorage.setItem(Storage.KEY_PREFERENCES, JSON.stringify(updated));
            return updated;
        } catch (e) {
            console.warn('[Storage] Could not save preferences to localStorage:', e);
        }
    }
}
