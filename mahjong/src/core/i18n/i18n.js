// -*- coding: utf-8 -*-

import { en } from './locales/en.js';
import { fr } from './locales/fr.js';
import { ja } from './locales/ja.js';
import { zh } from './locales/zh.js';
import { zhTW } from './locales/zh-TW.js';
import { eventBus, Events } from '../../utils/EventBus.js';

export class I18nManager {
    constructor() {
        this._locales = {
            'en': en,
            'fr': fr,
            'ja': ja,
            'zh-CN': zh,
            'zh': zh,
            'zh-TW': zhTW
        };
        this._currentLang = 'en';
    }

    get currentLang() {
        return this._currentLang;
    }

    get availableLanguages() {
        return [
            { code: 'en', label: 'English' },
            { code: 'fr', label: 'Français' },
            { code: 'ja', label: '日本語' },
            { code: 'zh-CN', label: '简体中文' },
            { code: 'zh-TW', label: '繁體中文' }
        ];
    }

    setLanguage(langCode) {
        if (langCode === 'zh') langCode = 'zh-CN';
        if (this._locales[langCode]) {
            this._currentLang = langCode;
            eventBus.emit(Events.LANGUAGE_CHANGED, langCode);
        }
    }

    /**
     * Translate key with optional parameter substitution {0}, {1}...
     * @param {string} key
     * @param  {...any} args
     * @returns {string}
     */
    t(key, ...args) {
        const dict = this._locales[this._currentLang] || this._locales['en'];
        let text = dict[key] || this._locales['en'][key] || key;

        if (args.length > 0) {
            for (let i = 0; i < args.length; i++) {
                text = text.replace(new RegExp(`\\{${i}\\}`, 'g'), args[i]);
            }
        }
        return text;
    }
}

export const i18n = new I18nManager();
export const t = (key, ...args) => i18n.t(key, ...args);
