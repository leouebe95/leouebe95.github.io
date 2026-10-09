// -*- coding: utf-8 -*-

import { Tile, TileType, BAD_TILE } from '../../core/models/Tile.js';
import { eventBus, Events } from '../../utils/EventBus.js';
import { t } from '../../core/i18n/i18n.js';

/**
 * Single-line compact status bar for table winds and situational scoring modifiers.
 */
export class SpecialConditions {
    /**
     * @param {HTMLElement} root
     */
    constructor(root) {
        this._root = root;
        this._hand = null;
        this._ruleset = 'mcr';
        this.render();
    }

    setHand(hand) {
        this._hand = hand;
        this.updateState();
    }

    setRuleset(rulesetId) {
        this._ruleset = rulesetId;
        this._root.dataset.ruleset = rulesetId;
    }

    render() {
        this._root.className = 'glass-panel conditions-bar';
        this._root.innerHTML = `
            <!-- Prevalent Round Wind -->
            <div style="display: inline-flex; align-items: center; gap: 6px;">
                <label for="table-wind-select" style="font-size: 12px; font-weight: 600; color: var(--color-accent-gold);">${t('PREVALENT_WIND_LABEL')}:</label>
                <select id="table-wind-select" class="wind-select">
                    <option value="1">${t('EAST')}</option>
                    <option value="2">${t('SOUTH')}</option>
                    <option value="3">${t('WEST')}</option>
                    <option value="4">${t('NORTH')}</option>
                </select>
            </div>

            <!-- Seat Wind -->
            <div style="display: inline-flex; align-items: center; gap: 6px;">
                <label for="player-wind-select" style="font-size: 12px; font-weight: 600; color: var(--color-accent-gold);">${t('SEAT_WIND_LABEL')}:</label>
                <select id="player-wind-select" class="wind-select">
                    <option value="1">${t('EAST')}</option>
                    <option value="2">${t('SOUTH')}</option>
                    <option value="3">${t('WEST')}</option>
                    <option value="4">${t('NORTH')}</option>
                </select>
            </div>

            <!-- Self-Drawn -->
            <div class="condition-pill" id="pill-self-drawn">
                <span>${t('SELF_DRAWN_LABEL')}</span>
            </div>

            <!-- Last Tile Draw -->
            <div class="condition-pill" id="pill-last-draw">
                <span>${t('LAST_TILE_DRAW_LABEL')}</span>
            </div>

            <!-- Last Tile Claim -->
            <div class="condition-pill" id="pill-last-claim">
                <span>${t('LAST_TILE_CLAIM_LABEL')}</span>
            </div>

            <!-- Robbing Kong -->
            <div class="condition-pill" id="pill-robbing-kong">
                <span>${t('ROBBING_KONG_LABEL')}</span>
            </div>

            <!-- Replacement Tile -->
            <div class="condition-pill" id="pill-replacement-tile">
                <span>${t('REPLACEMENT_TILE_LABEL')}</span>
            </div>

            <div class="riichi-condition-group">
                <div class="condition-pill" id="pill-riichi"><span>${t('RIICHI')}</span></div>
                <div class="condition-pill" id="pill-double-riichi"><span>${t('DOUBLE_RIICHI')}</span></div>
                <div class="condition-pill" id="pill-ippatsu"><span>${t('IPPATSU')}</span></div>
                <div class="condition-pill" id="pill-tenho"><span>${t('TENHO')}</span></div>
                <div class="condition-pill" id="pill-chiho"><span>${t('CHIHO')}</span></div>
                <div class="condition-pill" id="pill-renho"><span>${t('RENHO')}</span></div>
                <div class="indicator-select">
                    <label for="dora-select">${t('DORA')}</label>
                    <select id="dora-select" class="wind-select"></select>
                </div>
                <div class="indicator-select">
                    <label for="uradora-select">${t('URADORA')}</label>
                    <select id="uradora-select" class="wind-select"></select>
                </div>
            </div>
        `;

        this._populateIndicatorOptions();
        this._bindEvents();
        this.setRuleset(this._ruleset);
    }

    _populateIndicatorOptions() {
        const choices = [];
        [TileType.BAMBOO, TileType.CHARACTER, TileType.DOT, TileType.WIND, TileType.DRAGON]
            .forEach(type => {
                for (let num = 1; num <= type.len; num++) choices.push(new Tile(type, num));
            });
        ['#dora-select', '#uradora-select'].forEach(selector => {
            const select = this._root.querySelector(selector);
            const empty = document.createElement('option');
            empty.value = '';
            empty.textContent = t('NONE');
            select.appendChild(empty);
            choices.forEach(tile => {
                const option = document.createElement('option');
                option.value = String(tile.tileId);
                option.textContent = t(tile.toString());
                select.appendChild(option);
            });
        });
    }

    _bindEvents() {
        const tableSelect = this._root.querySelector('#table-wind-select');
        const playerSelect = this._root.querySelector('#player-wind-select');

        tableSelect.addEventListener('change', () => {
            if (!this._hand) return;
            this._hand.tableWind = new Tile(TileType.WIND, parseInt(tableSelect.value, 10));
            eventBus.emit(Events.HAND_CHANGED, this._hand);
        });

        playerSelect.addEventListener('change', () => {
            if (!this._hand) return;
            this._hand.playerWind = new Tile(TileType.WIND, parseInt(playerSelect.value, 10));
            eventBus.emit(Events.HAND_CHANGED, this._hand);
        });

        const bindIndicator = (selector, propName) => {
            this._root.querySelector(selector).addEventListener('change', event => {
                if (!this._hand) return;
                const tileId = Number(event.target.value);
                this._hand[propName] = event.target.value === ''
                    ? BAD_TILE
                    : this._tileFromId(tileId);
                eventBus.emit(Events.HAND_CHANGED, this._hand);
            });
        };

        bindIndicator('#dora-select', 'dora');
        bindIndicator('#uradora-select', 'uradora');

        const bindToggle = (pillId, propName) => {
            const pill = this._root.querySelector(pillId);
            pill.addEventListener('click', () => {
                if (!this._hand) return;
                this._hand[propName] = !this._hand[propName];
                this.updateState();
                eventBus.emit(Events.HAND_CHANGED, this._hand);
            });
        };

        bindToggle('#pill-self-drawn', 'selfDrawn');
        bindToggle('#pill-last-draw', 'lastTileDrawn');
        bindToggle('#pill-last-claim', 'lastExistingTile');
        bindToggle('#pill-robbing-kong', 'robbedKong');
        bindToggle('#pill-replacement-tile', 'replacementTile');
        bindToggle('#pill-riichi', 'riichi');
        bindToggle('#pill-double-riichi', 'doubleRiichi');
        bindToggle('#pill-ippatsu', 'ippatsu');
        bindToggle('#pill-tenho', 'tenho');
        bindToggle('#pill-chiho', 'chiho');
        bindToggle('#pill-renho', 'renho');
    }

    _tileFromId(tileId) {
        const types = [TileType.BAMBOO, TileType.CHARACTER, TileType.DOT, TileType.DRAGON, TileType.WIND];
        for (const type of types) {
            if (tileId >= type.offset && tileId < type.offset + type.len) {
                return new Tile(type, tileId - type.offset + 1);
            }
        }
        return BAD_TILE;
    }

    updateState() {
        if (!this._hand) return;

        const tableSelect = this._root.querySelector('#table-wind-select');
        const playerSelect = this._root.querySelector('#player-wind-select');

        if (this._hand.tableWind.isValid()) {
            tableSelect.value = String(this._hand.tableWind.num);
        }
        if (this._hand.playerWind.isValid()) {
            playerSelect.value = String(this._hand.playerWind.num);
        }
        this._root.querySelector('#dora-select').value =
            this._hand.dora.isValid() ? String(this._hand.dora.tileId) : '';
        this._root.querySelector('#uradora-select').value =
            this._hand.uradora.isValid() ? String(this._hand.uradora.tileId) : '';

        const updatePill = (id, active) => {
            const el = this._root.querySelector(id);
            if (el) {
                if (active) el.classList.add('active');
                else el.classList.remove('active');
            }
        };

        updatePill('#pill-self-drawn', this._hand.selfDrawn);
        updatePill('#pill-last-draw', this._hand.lastTileDrawn);
        updatePill('#pill-last-claim', this._hand.lastExistingTile);
        updatePill('#pill-robbing-kong', this._hand.robbedKong);
        updatePill('#pill-replacement-tile', this._hand.replacementTile);
        updatePill('#pill-riichi', this._hand.riichi);
        updatePill('#pill-double-riichi', this._hand.doubleRiichi);
        updatePill('#pill-ippatsu', this._hand.ippatsu);
        updatePill('#pill-tenho', this._hand.tenho);
        updatePill('#pill-chiho', this._hand.chiho);
        updatePill('#pill-renho', this._hand.renho);
    }
}
