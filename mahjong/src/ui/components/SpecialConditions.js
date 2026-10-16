// -*- coding: utf-8 -*-

import { Tile, TileType, BAD_TILE } from '../../core/models/Tile.js';
import { eventBus, Events } from '../../utils/EventBus.js';
import { t } from '../../core/i18n/i18n.js';
import { TwoStatePushButton } from './TwoStatePushButton.js';

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
            <div class="condition-winds">
                <label for="table-wind-select">${t('PREVALENT_WIND_LABEL')}:</label>
                <select id="table-wind-select" class="wind-select">
                    <option value="1">${t('EAST')}</option>
                    <option value="2">${t('SOUTH')}</option>
                    <option value="3">${t('WEST')}</option>
                    <option value="4">${t('NORTH')}</option>
                </select>
                <label for="player-wind-select">${t('SEAT_WIND_LABEL')}:</label>
                <select id="player-wind-select" class="wind-select">
                    <option value="1">${t('EAST')}</option>
                    <option value="2">${t('SOUTH')}</option>
                    <option value="3">${t('WEST')}</option>
                    <option value="4">${t('NORTH')}</option>
                </select>
            </div>
            <div class="condition-toggles"></div>
            <div class="riichi-condition-group">
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

        const toggles = this._root.querySelector('.condition-toggles');
        [
            ['pill-self-drawn', 'SELF_DRAWN_LABEL', 'self-drawn.svg', 'selfDrawn'],
            ['pill-last-draw', 'LAST_TILE_DRAW_LABEL', 'last-draw.svg', 'lastTileDrawn'],
            ['pill-last-claim', 'LAST_TILE_CLAIM_LABEL', 'last-claim.svg', 'lastExistingTile'],
            ['pill-robbing-kong', 'ROBBING_KONG_LABEL', 'robbing-kong.svg', 'robbedKong'],
            ['pill-replacement-tile', 'REPLACEMENT_TILE_LABEL', 'replacement-tile.svg', 'replacementTile']
        ].forEach(([id, label, icon, prop]) => this._addToggle(toggles, id, label, icon, prop));
        const riichiGroup = this._root.querySelector('.riichi-condition-group');
        [
            ['pill-riichi', 'RIICHI', 'riichi.svg', 'riichi'],
            ['pill-double-riichi', 'DOUBLE_RIICHI', 'double-riichi.svg', 'doubleRiichi'],
            ['pill-ippatsu', 'IPPATSU', 'ippatsu.svg', 'ippatsu'],
            ['pill-tenho', 'TENHO', 'tenho.svg', 'tenho'],
            ['pill-chiho', 'CHIHO', 'chiho.svg', 'chiho'],
            ['pill-renho', 'RENHO', 'renho.svg', 'renho']
        ].forEach(([id, label, icon, prop]) => this._addToggle(riichiGroup, id, label, icon, prop));

        this._populateIndicatorOptions();
        this._bindEvents();
        this.setRuleset(this._ruleset);
    }

    _addToggle(container, id, labelKey, icon, propName) {
        const button = new TwoStatePushButton({
            label: t(labelKey),
            icon: `img/icons/${icon}`,
            className: 'condition-toggle',
            onToggle: pressed => {
                if (!this._hand) return;
                this._hand[propName] = pressed;
                eventBus.emit(Events.HAND_CHANGED, this._hand);
            }
        }).element;
        button.id = id;
        container.appendChild(button);
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

        const updateToggle = (id, active, labelKey) => {
            const el = this._root.querySelector(id);
            if (el) {
                el.setAttribute('aria-pressed', String(active));
                el.title = t(labelKey);
                el.setAttribute('aria-label', t(labelKey));
            }
        };

        updateToggle('#pill-self-drawn', this._hand.selfDrawn, 'SELF_DRAWN_LABEL');
        updateToggle('#pill-last-draw', this._hand.lastTileDrawn, 'LAST_TILE_DRAW_LABEL');
        updateToggle('#pill-last-claim', this._hand.lastExistingTile, 'LAST_TILE_CLAIM_LABEL');
        updateToggle('#pill-robbing-kong', this._hand.robbedKong, 'ROBBING_KONG_LABEL');
        updateToggle('#pill-replacement-tile', this._hand.replacementTile, 'REPLACEMENT_TILE_LABEL');
        updateToggle('#pill-riichi', this._hand.riichi, 'RIICHI');
        updateToggle('#pill-double-riichi', this._hand.doubleRiichi, 'DOUBLE_RIICHI');
        updateToggle('#pill-ippatsu', this._hand.ippatsu, 'IPPATSU');
        updateToggle('#pill-tenho', this._hand.tenho, 'TENHO');
        updateToggle('#pill-chiho', this._hand.chiho, 'CHIHO');
        updateToggle('#pill-renho', this._hand.renho, 'RENHO');
    }
}
