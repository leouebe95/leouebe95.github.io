// -*- coding: utf-8 -*-

import { Tile, TileType, BAD_TILE } from '../../core/models/Tile.js';
import { Meld, MeldType, BAD_MELD } from '../../core/models/Meld.js';
import { eventBus, Events } from '../../utils/EventBus.js';
import { t } from '../../core/i18n/i18n.js';

/**
 * Main Hand Display component rendering regular melds + pair or 14 special tiles.
 * Supports interactive combination tile glow highlighting.
 */
export class HandDisplay {
    /**
     * @param {HTMLElement} root
     */
    constructor(root) {
        this._root = root;
        this._hand = null;
        this._selectedIndex = 0; // tile or meld slot
        this._tileSet = 'default';
        this._meldTypes = [MeldType.CHOW, MeldType.CHOW, MeldType.CHOW, MeldType.CHOW];
        this._concealedStates = [true, true, true, true];

        this._setupListeners();
    }

    _setupListeners() {
        eventBus.on(Events.HIGHLIGHT_TILES, data => this.highlightTiles(data));
        eventBus.on(Events.CLEAR_HIGHLIGHT, () => this.clearHighlights());
    }

    setTileSet(tileSet) {
        this._tileSet = tileSet;
        this.render();
    }

    setHand(hand) {
        this._hand = hand;
        if (hand.isNormal) {
            this._meldTypes = this._meldTypes.map((type, index) =>
                hand.melds[index].isValid() ? hand.melds[index].type : type
            );
            this._concealedStates = this._concealedStates.map((concealed, index) =>
                hand.melds[index].isValid() ? hand.melds[index].isConcealed : concealed
            );
        }
        this.render();
    }

    render() {
        if (!this._hand) return;

        this._root.className = 'glass-panel main-hand-container';
        this._root.innerHTML = `
            <div class="hand-header-bar">
                <div class="hand-type-toggle">
                    <button class="hand-type-btn ${this._hand.isNormal ? 'active' : ''}" id="btn-normal-hand">${t('NORMAL_HAND')}</button>
                    <button class="hand-type-btn ${!this._hand.isNormal ? 'active' : ''}" id="btn-special-hand">${t('SPECIAL_HAND')}</button>
                </div>
                <div class="hand-actions">
                    <span style="font-size: 11px; color: var(--color-text-muted);">Double-click tile to set Winning Tile</span>
                </div>
            </div>
            <div class="hand-content-area" id="hand-content-area"></div>
        `;

        // Bind hand type buttons
        this._root.querySelector('#btn-normal-hand').addEventListener('click', () => {
            if (!this._hand.isNormal) {
                this._hand.setType(true);
                eventBus.emit(Events.HAND_CHANGED, this._hand);
            }
        });

        this._root.querySelector('#btn-special-hand').addEventListener('click', () => {
            if (this._hand.isNormal) {
                this._hand.setType(false);
                eventBus.emit(Events.HAND_CHANGED, this._hand);
            }
        });

        const container = this._root.querySelector('#hand-content-area');
        if (this._hand.isNormal) {
            this._renderNormalHand(container);
        } else {
            this._renderSpecialHand(container);
        }
    }

    _renderNormalHand(container) {
        const wrapper = document.createElement('div');
        wrapper.className = 'melds-wrapper';

        // 4 Melds (0..3)
        for (let meldIdx = 0; meldIdx < 4; meldIdx++) {
            const meld = this._hand.melds[meldIdx];
            const group = document.createElement('div');
            group.className = 'meld-group';
            group.dataset.meldIndex = meldIdx;

            const tilesRow = document.createElement('div');
            tilesRow.className = 'meld-tiles';

            if (meld.isValid()) {
                const meldTiles = meld.getTiles();
                meldTiles.forEach((tile, subIdx) => {
                    const tileGlobalIdx = meldIdx * 3 + subIdx;
                    const tileEl = this._createTileElement(tile, tileGlobalIdx, meldIdx);
                    tilesRow.appendChild(tileEl);
                });
            } else {
                // Empty placeholder slots for unpopulated meld
                for (let subIdx = 0; subIdx < 3; subIdx++) {
                    const tileGlobalIdx = meldIdx * 3 + subIdx;
                    const emptyEl = this._createEmptySlotElement(tileGlobalIdx, meldIdx);
                    tilesRow.appendChild(emptyEl);
                }
            }

            const controls = document.createElement('div');
            controls.className = 'meld-controls';
            const concealedButton = document.createElement('button');
            concealedButton.type = 'button';
            concealedButton.className = 'concealed-toggle-btn';
            concealedButton.setAttribute('aria-pressed', String(this._concealedStates[meldIdx]));
            concealedButton.setAttribute('aria-label', t(this._concealedStates[meldIdx] ? 'CONCEALED' : 'MELDED'));
            concealedButton.title = t(this._concealedStates[meldIdx] ? 'CONCEALED' : 'MELDED');
            concealedButton.textContent = this._concealedStates[meldIdx] ? '✓' : '';
            concealedButton.addEventListener('click', () => {
                this._concealedStates[meldIdx] = !this._concealedStates[meldIdx];
                if (meld.isValid()) meld.isConcealed = this._concealedStates[meldIdx];
                this.render();
                eventBus.emit(Events.HAND_CHANGED, this._hand);
            });
            const typeSelector = document.createElement('select');
            typeSelector.className = 'meld-type-select';
            typeSelector.setAttribute('aria-label', `${t('MELD_TYPE')} ${meldIdx + 1}`);
            [
                [MeldType.CHOW, t('CHOW_SHORT')],
                [MeldType.PUNG, t('PUNG_SHORT')],
                [MeldType.KONG, t('KONG_SHORT')]
            ].forEach(([type, label]) => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = label;
                option.selected = this._meldTypes[meldIdx] === type;
                typeSelector.appendChild(option);
            });
            typeSelector.addEventListener('change', () => {
                this._meldTypes[meldIdx] = Number(typeSelector.value);
                this._selectedIndex = meldIdx * 3;
                eventBus.emit(Events.TILE_SELECTED, {
                    globalIdx: meldIdx * 3,
                    meldIdx,
                    meldType: this._meldTypes[meldIdx],
                    isConcealed: this._concealedStates[meldIdx]
                });
                eventBus.emit(Events.OPEN_TILE_PICKER);
            });

            controls.append(concealedButton, typeSelector);
            group.appendChild(tilesRow);
            group.appendChild(controls);
            wrapper.appendChild(group);
        }

        // Pair (Eye) at index 4
        const pairMeld = this._hand.melds[4];
        const pairGroup = document.createElement('div');
        pairGroup.className = 'meld-group';
        pairGroup.dataset.meldIndex = 4;

        const pairTilesRow = document.createElement('div');
        pairTilesRow.className = 'meld-tiles';

        if (pairMeld.isValid()) {
            const pairTiles = pairMeld.getTiles();
            pairTiles.forEach((tile, subIdx) => {
                const tileGlobalIdx = 12 + subIdx;
                const tileEl = this._createTileElement(tile, tileGlobalIdx, 4);
                pairTilesRow.appendChild(tileEl);
            });
        } else {
            for (let subIdx = 0; subIdx < 2; subIdx++) {
                const emptyEl = this._createEmptySlotElement(12 + subIdx, 4);
                pairTilesRow.appendChild(emptyEl);
            }
        }

        const pairControls = document.createElement('div');
        pairControls.className = 'meld-controls';
        const pairType = document.createElement('span');
        pairType.className = 'meld-type-chip';
        pairType.textContent = t('PAIR_SHORT');
        pairControls.appendChild(pairType);
        pairGroup.append(pairTilesRow, pairControls);

        wrapper.appendChild(pairGroup);
        container.appendChild(wrapper);
    }

    _renderSpecialHand(container) {
        const wrapper = document.createElement('div');
        wrapper.className = 'special-hand-tiles';

        for (let i = 0; i < 14; i++) {
            const tile = this._hand.tiles[i];
            let el;
            if (tile.isValid()) {
                el = this._createTileElement(tile, i, null);
            } else {
                el = this._createEmptySlotElement(i, null);
            }
            wrapper.appendChild(el);
        }

        container.appendChild(wrapper);
    }

    _createTileElement(tile, globalIdx, meldIdx) {
        const div = document.createElement('div');
        div.className = 'mj-tile';
        div.dataset.tileIndex = globalIdx;
        if (meldIdx !== null) div.dataset.meldIndex = meldIdx;

        // Winning tile indicator
        if (this._hand.lastTile === globalIdx) {
            div.classList.add('winning-tile');
        }

        const img = document.createElement('img');
        img.src = `img/${this._tileSet}/${tile.fileName()}.png`;
        img.alt = tile.toString();
        div.appendChild(img);

        div.addEventListener('click', () => {
            this._selectTileSlot(globalIdx, meldIdx);
            eventBus.emit(Events.OPEN_TILE_PICKER);
        });

        div.addEventListener('dblclick', () => {
            eventBus.emit(Events.CLOSE_TILE_PICKER);
            this._setWinningTile(globalIdx);
        });

        return div;
    }

    _createEmptySlotElement(globalIdx, meldIdx) {
        const div = document.createElement('div');
        div.className = 'mj-tile empty-slot';
        div.dataset.tileIndex = globalIdx;
        if (meldIdx !== null) div.dataset.meldIndex = meldIdx;

        div.addEventListener('click', () => {
            this._selectTileSlot(globalIdx, meldIdx);
            eventBus.emit(Events.OPEN_TILE_PICKER);
        });

        return div;
    }

    _selectTileSlot(globalIdx, meldIdx) {
        this._root.querySelectorAll('.mj-tile').forEach(t => t.classList.remove('selected'));
        const target = this._root.querySelector(`[data-tile-index="${globalIdx}"]`);
        if (target) target.classList.add('selected');
        this._selectedIndex = globalIdx;

        const meldType = meldIdx === 4
            ? MeldType.PAIR
            : meldIdx === null
                ? null
                : this._meldTypes[meldIdx];
        eventBus.emit(Events.TILE_SELECTED, {
            globalIdx,
            meldIdx,
            meldType,
            isConcealed: meldIdx === null ? undefined : meldIdx === 4 ? true : this._concealedStates[meldIdx]
        });
    }

    _setWinningTile(globalIdx) {
        this._hand.lastTile = globalIdx;
        this.render();
        eventBus.emit(Events.HAND_CHANGED, this._hand);
    }

    /**
     * Visually highlight specific melds or tiles associated with a combination.
     * @param {{ meldIndices: number[], tileIndices: number[] }} data
     */
    highlightTiles(data) {
        this.clearHighlights();
        if (!data) return;

        if (Array.isArray(data.meldIndices)) {
            data.meldIndices.forEach(meldIdx => {
                const meldEl = this._root.querySelector(`.meld-group[data-meld-index="${meldIdx}"]`);
                if (meldEl) {
                    meldEl.querySelectorAll('.mj-tile').forEach(t => t.classList.add('combination-highlight'));
                }
            });
        }

        if (Array.isArray(data.tileIndices)) {
            data.tileIndices.forEach(tileIdx => {
                const tileEl = this._root.querySelector(`.mj-tile[data-tile-index="${tileIdx}"]`);
                if (tileEl) {
                    tileEl.classList.add('combination-highlight');
                }
            });
        }
    }

    clearHighlights() {
        this._root.querySelectorAll('.combination-highlight').forEach(t => {
            t.classList.remove('combination-highlight');
        });
    }
}
