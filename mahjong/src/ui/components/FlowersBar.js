// -*- coding: utf-8 -*-

import { Tile, TileType } from '../../core/models/Tile.js';
import { eventBus, Events } from '../../utils/EventBus.js';
import { t } from '../../core/i18n/i18n.js';

/**
 * Flowers & Seasons bonus row directly above the main hand.
 */
export class FlowersBar {
    /**
     * @param {HTMLElement} root
     */
    constructor(root) {
        this._root = root;
        this._flowerTiles = [
            new Tile(TileType.FLOWER, 1), // Plum
            new Tile(TileType.FLOWER, 2), // Orchid
            new Tile(TileType.FLOWER, 3), // Chrysanthemum
            new Tile(TileType.FLOWER, 4), // Bamboo flower
            new Tile(TileType.SEASON, 1), // Spring
            new Tile(TileType.SEASON, 2), // Summer
            new Tile(TileType.SEASON, 3), // Autumn
            new Tile(TileType.SEASON, 4)  // Winter
        ];
        this._currentHand = null;
        this.render();
    }

    render() {
        this._root.className = 'glass-panel flowers-bar-container';
        this._root.innerHTML = '<div class="flowers-tiles-list" id="flowers-list"></div>';

        const list = this._root.querySelector('#flowers-list');

        this._flowerTiles.forEach((tile, index) => {
            const btn = document.createElement('div');
            btn.className = 'mj-tile flower-slot';
            btn.dataset.index = index;
            btn.title = t(tile.toString());

            const img = document.createElement('img');
            img.src = `img/${this._tileSet || 'default'}/${tile.fileName()}.png`;
            img.alt = tile.toString();
            btn.appendChild(img);

            btn.addEventListener('click', () => this._toggleFlower(tile));
            list.appendChild(btn);
        });
    }

    setHand(hand) {
        this._currentHand = hand;
        this.updateState();
    }

    setTileSet(tileSet) {
        this._tileSet = tileSet;
        this.render();
        this.updateState();
    }

    updateState() {
        if (!this._currentHand) return;
        const slots = this._root.querySelectorAll('.flower-slot');
        this._flowerTiles.forEach((tile, i) => {
            const hasIt = this._currentHand.hasFlower(tile);
            if (slots[i]) {
                if (hasIt) slots[i].classList.add('active');
                else slots[i].classList.remove('active');
            }
        });
    }

    _toggleFlower(tile) {
        if (!this._currentHand) return;
        if (this._currentHand.hasFlower(tile)) {
            this._currentHand.removeFlower(tile);
        } else {
            this._currentHand.addFlower(tile);
        }
        this.updateState();
        eventBus.emit(Events.HAND_CHANGED, this._currentHand);
    }
}
