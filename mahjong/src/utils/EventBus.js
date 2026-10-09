/**
 * Lightweight, zero-dependency event bus for decoupled application modules.
 */
export class EventBus {
    constructor() {
        this._listeners = new Map();
    }

    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (this._listeners.has(event)) {
            this._listeners.get(event).delete(callback);
            if (this._listeners.get(event).size === 0) {
                this._listeners.delete(event);
            }
        }
    }

    emit(event, data) {
        if (this._listeners.has(event)) {
            this._listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[EventBus] Error handling event "${event}":`, error);
                }
            });
        }
    }

    clear() {
        this._listeners.clear();
    }
}

export const Events = Object.freeze({
    HAND_CHANGED: 'hand:changed',
    CLOSE_TILE_PICKER: 'tile-picker:close',
    MELD_SELECTED: 'meld:selected',
    TILE_SELECTED: 'tile:selected',
    OPEN_TILE_PICKER: 'tile-picker:open',
    SPECIAL_CONDITIONS_CHANGED: 'conditions:changed',
    TILE_SET_CHANGED: 'tileset:changed',
    RULESET_CHANGED: 'ruleset:changed',
    THEME_CHANGED: 'theme:changed',
    LANGUAGE_CHANGED: 'language:changed',
    HIGHLIGHT_TILES: 'tiles:highlight',
    CLEAR_HIGHLIGHT: 'tiles:clear_highlight',
    REQUEST_OPEN_SETTINGS: 'modal:open_settings',
    REQUEST_OPEN_EXAMPLES: 'modal:open_examples',
    LOAD_SAMPLE_HAND: 'hand:load_sample'
});

export const eventBus = new EventBus();
