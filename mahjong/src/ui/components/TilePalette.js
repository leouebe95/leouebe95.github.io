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
        this._selectedSlot = { globalIdx: 0, meldIdx: 0 };
        this._activeMeldType = MeldType.CHOW;
        this._tileSet = 'default';
        this._error = '';
        this._openPosition = { x: 16, y: 16 };
        this._setupListeners();
        this._root.addEventListener('click', event => {
            if (event.target === this._root) this.close();
        });
        this._root.addEventListener('keydown', event => this._handleNavigationKey(event));
        this.render();
    }

    _setupListeners() {
        eventBus.on(Events.TILE_SELECTED, slot => {
            this._selectedSlot = slot;
            if (slot.meldType !== null && slot.meldType !== undefined) {
                this._activeMeldType = slot.meldType;
            }
        });
        eventBus.on(Events.OPEN_TILE_PICKER, position => this.open(position));
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
            <div class="glass-panel modal-content tile-picker-content" role="dialog" aria-modal="true" aria-label="${t('SELECT_TILE')}">
                <div class="modal-header">
                    <span class="tile-picker-shortcuts">← ↑ ↓ →</span>
                </div>
                <div class="palette-tiles-grid" id="palette-tiles-grid"></div>
                <p class="palette-error" id="palette-error" role="alert">${this._error}</p>
            </div>
        `;
        this._renderTilesGrid();
    }

    _renderTilesGrid() {
        const grid = this._root.querySelector('#palette-tiles-grid');
        grid.innerHTML = '';
        let tileIndex = 0;
        [TileType.CHARACTER, TileType.BAMBOO, TileType.DOT, TileType.WIND, TileType.DRAGON]
            .forEach(type => {
                const row = document.createElement('div');
                row.className = 'palette-suit-row';
                row.dataset.suit = type.name;
                for (let num = 1; num <= type.len; num++) {
                    const tile = new Tile(type, num);
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'mj-tile';
                    button.dataset.tileIndex = tileIndex++;
                    button.dataset.tileId = tile.tileId;
                    button.dataset.tileType = tile.type.name;
                    button.dataset.tileNum = tile.num;
                    button.title = t(tile.toString());
                    button.setAttribute('aria-label', t(tile.toString()));
                    const isInvalidChowStart = this._hand?.isNormal &&
                        this._selectedSlot.meldIdx !== 4 &&
                        this._activeMeldType === MeldType.CHOW &&
                        (!tile.isRegular() || tile.num > 7);
                    const isCopyLimitReached = this._hand && !this._hand.isNormal &&
                        this._hand.countTiles()[tile.tileId] -
                            (this._hand.tiles[this._selectedSlot.globalIdx]?.sameAs(tile) ? 1 : 0) >= 4;
                    button.disabled = isInvalidChowStart || isCopyLimitReached;
                    const image = document.createElement('img');
                    image.src = `img/${this._tileSet}/${tile.fileName()}.png`;
                    image.alt = t(tile.toString());
                    button.appendChild(image);
                    button.addEventListener('click', () => this._handleTilePick(tile));
                    row.appendChild(button);
                }
                grid.appendChild(row);
            });
    }

    _handleNavigationKey(event) {
        if (!this._root.classList.contains('open')) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
            return;
        }

        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const current = document.activeElement;
        const row = current.closest('.palette-suit-row');
        if (!row) {
            this._root.querySelector('#palette-tiles-grid .mj-tile:not(:disabled)')
                ?.focus({ preventScroll: true });
            return;
        }

        const currentRow = [...this._root.querySelectorAll('.palette-suit-row')].indexOf(row);
        const rows = [...this._root.querySelectorAll('.palette-suit-row')];
        const rowButtons = [...row.querySelectorAll('.mj-tile')];
        const currentColumn = rowButtons.indexOf(current);

        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            const step = event.key === 'ArrowLeft' ? -1 : 1;
            for (let column = currentColumn + step; column >= 0 && column < rowButtons.length; column += step) {
                if (!rowButtons[column].disabled) {
                    rowButtons[column].focus({ preventScroll: true });
                    return;
                }
            }
            return;
        }

        const step = event.key === 'ArrowUp' ? -1 : 1;
        for (let rowIndex = currentRow + step; rowIndex >= 0 && rowIndex < rows.length; rowIndex += step) {
            const candidates = [...rows[rowIndex].querySelectorAll('.mj-tile:not(:disabled)')];
            candidates.sort((left, right) =>
                Math.abs([...rows[rowIndex].children].indexOf(left) - currentColumn) -
                Math.abs([...rows[rowIndex].children].indexOf(right) - currentColumn)
            );
            if (candidates.length) {
                candidates[0].focus({ preventScroll: true });
                return;
            }
        }
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

    open(position = {}) {
        this._error = '';
        this._renderTilesGrid();
        const error = this._root.querySelector('#palette-error');
        if (error) error.textContent = '';
        const { x, y, anchorRect } = position || {};
        const fallbackRect = anchorRect || { left: 8, bottom: 8 };
        this._openPosition = {
            x: Number.isFinite(x) && x > 0 ? x : fallbackRect.left,
            y: Number.isFinite(y) && y > 0 ? y : fallbackRect.bottom,
            anchorRect: fallbackRect
        };
        const content = this._root.querySelector('.tile-picker-content');
        content.style.visibility = 'hidden';
        this._root.classList.add('open');
        requestAnimationFrame(() => {
            if (!this._root.classList.contains('open')) return;
            const bounds = content.getBoundingClientRect();
            const margin = 8;
            const desiredX = this._openPosition.x;
            const belowY = this._openPosition.y + 8;
            const top = belowY + bounds.height <= window.innerHeight - margin
                ? belowY
                : Math.max(margin, this._openPosition.y - bounds.height - 8);
            content.style.left = `${Math.max(margin, Math.min(desiredX, window.innerWidth - bounds.width - margin))}px`;
            content.style.top = `${top}px`;
            content.style.visibility = '';
            const firstTile = this._root.querySelector('#palette-tiles-grid .mj-tile:not(:disabled)');
            firstTile?.focus({ preventScroll: true });
        });
    }

    close() {
        this._root.classList.remove('open');
    }
}
