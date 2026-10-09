// -*- coding: utf-8 -*-

import { Tile, TileType } from '../../core/models/Tile.js';
import { Meld, MeldType } from '../../core/models/Meld.js';
import { eventBus, Events } from '../../utils/EventBus.js';
import { t } from '../../core/i18n/i18n.js';

/**
 * Popup tile picker used to enter the first tile of a meld or a special hand tile.
 */
export class TilePalette {
    constructor(root) {
        this._root = root;
        this._hand = null;
        this._activeSuit = 'character';
        this._selectedSlot = { globalIdx: 0, meldIdx: 0 };
        this._activeMeldType = MeldType.CHOW;
        this._tileSet = 'default';
        this._error = '';
        this._setupListeners();
        this._root.addEventListener('click', event => {
            if (event.target === this._root) this.close();
        });
        this.render();
    }

    _setupListeners() {
        eventBus.on(Events.TILE_SELECTED, slot => {
            this._selectedSlot = slot;
            if (slot.meldType !== null && slot.meldType !== undefined) {
                this._activeMeldType = slot.meldType;
            }
        });
        eventBus.on(Events.OPEN_TILE_PICKER, () => this.open());
        eventBus.on(Events.CLOSE_TILE_PICKER, () => this.close());
    }

    setTileSet(tileSet) {
        this._tileSet = tileSet;
        this.render();
    }

    setHand(hand) {
        this._hand = hand;
    }

    render() {
        this._root.className = 'modal-backdrop tile-picker-backdrop';
        this._root.innerHTML = `
            <div class="glass-panel modal-content tile-picker-content" role="dialog" aria-modal="true" aria-labelledby="tile-picker-title">
                <div class="modal-header">
                    <h2 id="tile-picker-title">${t('SELECT_TILE')}</h2>
                    <button class="modal-close-btn" id="btn-close-tile-picker" aria-label="Close">&times;</button>
                </div>
                <div class="palette-tabs" id="palette-suit-tabs">
                    <button class="palette-tab-btn ${this._activeSuit === 'character' ? 'active' : ''}" data-suit="character">${t('CHARACTER')}</button>
                    <button class="palette-tab-btn ${this._activeSuit === 'bamboo' ? 'active' : ''}" data-suit="bamboo">${t('BAMBOO')}</button>
                    <button class="palette-tab-btn ${this._activeSuit === 'dot' ? 'active' : ''}" data-suit="dot">${t('DOT')}</button>
                    <button class="palette-tab-btn ${this._activeSuit === 'honor' ? 'active' : ''}" data-suit="honor">${t('DRAGON')} & ${t('WIND')}</button>
                </div>
                <div class="palette-tiles-grid" id="palette-tiles-grid"></div>
                <p class="palette-error" id="palette-error" role="alert">${this._error}</p>
            </div>
        `;
        this._root.querySelector('#btn-close-tile-picker').addEventListener('click', () => this.close());
        this._root.querySelectorAll('#palette-suit-tabs .palette-tab-btn').forEach(button => {
            button.addEventListener('click', () => {
                this._activeSuit = button.dataset.suit;
                this._error = '';
                this.render();
                this.open();
            });
        });
        this._renderTilesGrid();
    }

    _renderTilesGrid() {
        const grid = this._root.querySelector('#palette-tiles-grid');
        grid.innerHTML = '';
        const tiles = [];
        if (this._activeSuit === 'character') {
            for (let i = 1; i <= 9; i++) tiles.push(new Tile(TileType.CHARACTER, i));
        } else if (this._activeSuit === 'bamboo') {
            for (let i = 1; i <= 9; i++) tiles.push(new Tile(TileType.BAMBOO, i));
        } else if (this._activeSuit === 'dot') {
            for (let i = 1; i <= 9; i++) tiles.push(new Tile(TileType.DOT, i));
        } else {
            for (let i = 1; i <= 4; i++) tiles.push(new Tile(TileType.WIND, i));
            for (let i = 1; i <= 3; i++) tiles.push(new Tile(TileType.DRAGON, i));
        }

        tiles.forEach(tile => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'mj-tile';
            button.title = t(tile.toString());
            button.setAttribute('aria-label', t(tile.toString()));
            const isInvalidChowStart = this._hand?.isNormal &&
                this._selectedSlot.meldIdx !== 4 &&
                this._activeMeldType === MeldType.CHOW &&
                (!tile.isRegular() || tile.num > 7);
            button.disabled = isInvalidChowStart;
            const image = document.createElement('img');
            image.src = `img/${this._tileSet}/${tile.fileName()}.png`;
            image.alt = t(tile.toString());
            button.appendChild(image);
            button.addEventListener('click', () => this._handleTilePick(tile));
            grid.appendChild(button);
        });
    }

    _handleTilePick(tile) {
        if (!this._hand) return;
        this._error = '';

        if (this._hand.isNormal) {
            const { meldIdx } = this._selectedSlot;
            if (meldIdx === null || meldIdx === undefined) return;
            const type = meldIdx === 4 ? MeldType.PAIR : this._activeMeldType;
            const previousMeld = this._hand.melds[meldIdx];
            const concealed = meldIdx === 4
                ? true
                : this._selectedSlot.isConcealed ?? previousMeld.isConcealed;
            const meld = new Meld(type, tile, concealed);
            if (!meld.isValid()) return;
            this._hand.melds[meldIdx] = meld;
            if (!this._hand.isValid()) {
                this._hand.melds[meldIdx] = previousMeld;
                this._showError(t('TILE_LIMIT_REACHED'));
                return;
            }
        } else {
            const targetIdx = this._selectedSlot.globalIdx;
            const previousTile = this._hand.tiles[targetIdx];
            this._hand.tiles[targetIdx] = tile;
            if (!this._hand.isValid()) {
                this._hand.tiles[targetIdx] = previousTile;
                this._showError(t('TILE_LIMIT_REACHED'));
                return;
            }
        }

        this.close();
        eventBus.emit(Events.HAND_CHANGED, this._hand);
    }

    _showError(message) {
        this._error = message;
        const error = this._root.querySelector('#palette-error');
        if (error) error.textContent = message;
    }

    open() {
        this._error = '';
        this._renderTilesGrid();
        const error = this._root.querySelector('#palette-error');
        if (error) error.textContent = '';
        this._root.classList.add('open');
    }

    close() {
        this._root.classList.remove('open');
    }
}
