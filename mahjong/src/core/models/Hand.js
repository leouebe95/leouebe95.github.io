// -*- coding: utf-8 -*-

import { Tile, TileType, BAD_TILE } from './Tile.js';
import { Meld, MeldType, BAD_MELD } from './Meld.js';

/**
 * Domain entity representing a complete or in-progress Mahjong hand.
 */
export class Hand {
    constructor() {
        this.reset();
    }

    /**
     * Resets hand to default empty state.
     */
    reset() {
        this._isNormal = true;
        this._lastTile = -1;
        this._selfDrawn = false;
        this._lastTileDrawn = false;
        this._lastExistingTile = false;
        this._robbedKong = false;
        this._replacementTile = false;

        // Riichi-specific flags
        this._tenho = false;
        this._chiho = false;
        this._renho = false;
        this._riichi = false;
        this._doubleRiichi = false;
        this._ippatsu = false;

        this._tableWind = BAD_TILE;
        this._playerWind = BAD_TILE;
        this._dora = BAD_TILE;
        this._uradora = BAD_TILE;
        this._valueHint = -1;

        this._tiles = [];
        this._melds = [];
        this._flowers = [];

        for (let i = 0; i < 14; i++) {
            this._tiles[i] = BAD_TILE;
        }
        for (let i = 0; i < 5; i++) {
            this._melds[i] = BAD_MELD;
        }
        for (let i = 0; i < 8; i++) {
            this._flowers[i] = BAD_TILE;
        }
    }

    get isNormal() { return this._isNormal; }
    set isNormal(val) { this._isNormal = Boolean(val); }

    get lastTile() { return this._lastTile; }
    set lastTile(val) { this._lastTile = Number(val); }

    get selfDrawn() { return this._selfDrawn; }
    set selfDrawn(val) { this._selfDrawn = Boolean(val); }

    get lastTileDrawn() { return this._lastTileDrawn; }
    set lastTileDrawn(val) { this._lastTileDrawn = Boolean(val); }

    get lastExistingTile() { return this._lastExistingTile; }
    set lastExistingTile(val) { this._lastExistingTile = Boolean(val); }

    get robbedKong() { return this._robbedKong; }
    set robbedKong(val) { this._robbedKong = Boolean(val); }

    get replacementTile() { return this._replacementTile; }
    set replacementTile(val) { this._replacementTile = Boolean(val); }

    get tenho() { return this._tenho; }
    set tenho(val) { this._tenho = Boolean(val); }

    get chiho() { return this._chiho; }
    set chiho(val) { this._chiho = Boolean(val); }

    get renho() { return this._renho; }
    set renho(val) { this._renho = Boolean(val); }

    get riichi() { return this._riichi; }
    set riichi(val) { this._riichi = Boolean(val); }

    get doubleRiichi() { return this._doubleRiichi; }
    set doubleRiichi(val) { this._doubleRiichi = Boolean(val); }

    get ippatsu() { return this._ippatsu; }
    set ippatsu(val) { this._ippatsu = Boolean(val); }

    get tableWind() { return this._tableWind; }
    set tableWind(tile) { this._tableWind = tile || BAD_TILE; }

    get playerWind() { return this._playerWind; }
    set playerWind(tile) { this._playerWind = tile || BAD_TILE; }

    get dora() { return this._dora; }
    set dora(tile) { this._dora = tile || BAD_TILE; }

    get uradora() { return this._uradora; }
    set uradora(tile) { this._uradora = tile || BAD_TILE; }

    get valueHint() { return this._valueHint; }
    set valueHint(val) { this._valueHint = Number(val); }

    get tiles() { return this._tiles; }
    get melds() { return this._melds; }
    get flowers() { return this._flowers; }

    /**
     * Create deep copy of Hand.
     * @returns {Hand}
     */
    clone() {
        const result = new Hand();

        result._isNormal = this._isNormal;
        result._lastTile = this._lastTile;
        result._selfDrawn = this._selfDrawn;
        result._lastTileDrawn = this._lastTileDrawn;
        result._lastExistingTile = this._lastExistingTile;
        result._robbedKong = this._robbedKong;
        result._replacementTile = this._replacementTile;
        result._tenho = this._tenho;
        result._chiho = this._chiho;
        result._renho = this._renho;
        result._riichi = this._riichi;
        result._doubleRiichi = this._doubleRiichi;
        result._ippatsu = this._ippatsu;

        result._tableWind = this._tableWind.clone();
        result._playerWind = this._playerWind.clone();
        result._dora = this._dora.clone();
        result._uradora = this._uradora.clone();
        result._valueHint = this._valueHint;

        for (let i = 0; i < 14; i++) {
            result._tiles[i] = this._tiles[i].clone();
        }
        for (let i = 0; i < 5; i++) {
            result._melds[i] = this._melds[i].clone();
        }
        for (let i = 0; i < 8; i++) {
            result._flowers[i] = this._flowers[i].clone();
        }

        return result;
    }

    setType(normalHand) {
        const context = {
            selfDrawn: this._selfDrawn,
            lastTileDrawn: this._lastTileDrawn,
            lastExistingTile: this._lastExistingTile,
            robbedKong: this._robbedKong,
            replacementTile: this._replacementTile,
            tenho: this._tenho,
            chiho: this._chiho,
            renho: this._renho,
            riichi: this._riichi,
            doubleRiichi: this._doubleRiichi,
            ippatsu: this._ippatsu,
            tableWind: this._tableWind,
            playerWind: this._playerWind,
            dora: this._dora,
            uradora: this._uradora,
            flowers: this._flowers
        };
        this.reset();
        this._isNormal = Boolean(normalHand);
        this._selfDrawn = context.selfDrawn;
        this._lastTileDrawn = context.lastTileDrawn;
        this._lastExistingTile = context.lastExistingTile;
        this._robbedKong = context.robbedKong;
        this._replacementTile = context.replacementTile;
        this._tenho = context.tenho;
        this._chiho = context.chiho;
        this._renho = context.renho;
        this._riichi = context.riichi;
        this._doubleRiichi = context.doubleRiichi;
        this._ippatsu = context.ippatsu;
        this._tableWind = context.tableWind;
        this._playerWind = context.playerWind;
        this._dora = context.dora;
        this._uradora = context.uradora;
        this._flowers = context.flowers;
    }

    setWinds(tableWind, playerWind) {
        this._tableWind = tableWind || BAD_TILE;
        this._playerWind = playerWind || BAD_TILE;
    }

    /**
     * Add tile to special hand.
     */
    addTile(tile) {
        if (!this._isNormal && (tile.isRegular() || tile.isHonor())) {
            const counts = this.countTiles();
            if (counts[tile.tileId] >= 4) return false;
            for (let i = 0; i < 14; i++) {
                if (!this._tiles[i].isValid()) {
                    this._tiles[i] = tile;
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Add flower tile to hand.
     */
    addFlower(tile) {
        if (!tile || !tile.isFlower()) return false;
        for (let i = 0; i < 8; i++) {
            if (!this._flowers[i].isValid()) {
                this._flowers[i] = tile;
                return true;
            }
            if (this._flowers[i].sameAs(tile)) {
                return false; // Already present
            }
        }
        return false;
    }

    /**
     * Remove flower tile from hand.
     */
    removeFlower(tile) {
        if (!tile || !tile.isFlower()) return false;
        for (let i = 0; i < 8; i++) {
            if (this._flowers[i].isValid() && this._flowers[i].sameAs(tile)) {
                this._flowers[i] = BAD_TILE;
                // Compact remaining flowers
                const remaining = this._flowers.filter(f => f.isValid());
                for (let j = 0; j < 8; j++) {
                    this._flowers[j] = remaining[j] || BAD_TILE;
                }
                return true;
            }
        }
        return false;
    }

    hasFlower(tile) {
        if (!tile || !tile.isFlower()) return false;
        for (let i = 0; i < 8; i++) {
            if (this._flowers[i].sameAs(tile)) return true;
        }
        return false;
    }

    /**
     * Add meld to normal hand.
     */
    addMeld(type, tile, concealed = true) {
        if (!this._isNormal) return false;
        const meld = new Meld(type, tile, concealed);
        if (!meld.isValid()) return false;

        if (type === MeldType.PAIR) {
            if (this._melds[4].isValid()) return false;
            this._melds[4] = meld;
            if (this.isValid()) return true;
            this._melds[4] = BAD_MELD;
            return false;
        } else {
            for (let i = 0; i < 4; i++) {
                if (!this._melds[i].isValid()) {
                    this._melds[i] = meld;
                    if (this.isValid()) return true;
                    this._melds[i] = BAD_MELD;
                    return false;
                }
            }
        }
        return false;
    }

    /**
     * Return histogram count array of all tiles in hand.
     * @returns {number[]}
     */
    countTiles() {
        const len = Tile._kNumberDifferentTiles;
        const count = new Array(len).fill(0);

        if (this._isNormal) {
            for (let i = 0; i < 5; i++) {
                if (this._melds[i].isValid()) {
                    const indx = this._melds[i]._firstTile._tileId;
                    switch (this._melds[i]._type) {
                        case MeldType.CHOW:
                            count[indx]++;
                            count[indx + 1]++;
                            count[indx + 2]++;
                            break;
                        case MeldType.PUNG:
                            count[indx] += 3;
                            break;
                        case MeldType.KONG:
                            count[indx] += 4;
                            break;
                        case MeldType.PAIR:
                            count[indx] += 2;
                            break;
                    }
                }
            }
        } else {
            for (let i = 0; i < 14; i++) {
                if (this._tiles[i].isValid()) {
                    count[this._tiles[i]._tileId]++;
                }
            }
        }

        // Count flowers
        for (let i = 0; i < 8; i++) {
            if (this._flowers[i]._tileId >= 0) {
                count[this._flowers[i]._tileId]++;
            }
        }

        return count;
    }

    isComplete() {
        if (!(this._tableWind.isValid() && this._playerWind.isValid() && this._lastTile >= 0)) {
            return false;
        }

        if (this._isNormal) {
            for (let i = 0; i < 5; i++) {
                if (!this._melds[i].isValid()) return false;
            }
        } else {
            for (let i = 0; i < 14; i++) {
                if (!this._tiles[i].isValid()) return false;
            }
        }
        return true;
    }

    isValid() {
        const count = this.countTiles();
        for (let i = 0; i < count.length; i++) {
            if (i >= TileType.FLOWER.offset) {
                if (count[i] > 1) return false;
            } else {
                if (count[i] > 4) return false;
            }
        }
        return true;
    }

    fixConcealed() {
        if (this._isNormal && this._lastTile >= 0) {
            const meld = Math.floor(this._lastTile / 3);
            if (meld < 4 && this._melds[meld].isValid()) {
                this._melds[meld]._isConcealed = this._selfDrawn;
            }
        }
    }

    sortedHand() {
        const hand = this.clone();
        hand._tiles.sort(Tile.compare);
        hand._melds.sort(Meld.compare);
        hand._flowers.sort(Tile.compare);

        // Remap _lastTile to keep winning tile pointer accurate
        if (this._lastTile >= 0) {
            if (this._isNormal) {
                const meld = Math.floor(this._lastTile / 3);
                const pos = this._lastTile - meld * 3;
                if (meld < 4 && this._melds[meld].isValid()) {
                    const tile = this._melds[meld]._firstTile;
                    const concealed = this._melds[meld]._isConcealed;
                    for (let i = 0; i < 4; i++) {
                        if (hand._melds[i]._firstTile.sameAs(tile) &&
                            hand._melds[i]._isConcealed === concealed) {
                            hand._lastTile = i * 3 + pos;
                            break;
                        }
                    }
                }
            } else if (this._lastTile < 14 && this._tiles[this._lastTile].isValid()) {
                for (let i = 0; i < 14; i++) {
                    if (hand._tiles[i].sameAs(this._tiles[this._lastTile])) {
                        hand._lastTile = i;
                        break;
                    }
                }
            }
        }

        return hand;
    }

    /**
     * @returns {boolean[]} Array of 5 booleans indicating presence of [bamboo, character, dot, dragon, wind]
     */
    suits() {
        const suits = [false, false, false, false, false];
        if (this._isNormal) {
            for (let i = 0; i < 5; i++) {
                if (this._melds[i].isValid()) {
                    switch (this._melds[i]._firstTile._type.id) {
                        case TileType.BAMBOO.id:    suits[0] = true; break;
                        case TileType.CHARACTER.id: suits[1] = true; break;
                        case TileType.DOT.id:       suits[2] = true; break;
                        case TileType.DRAGON.id:    suits[3] = true; break;
                        case TileType.WIND.id:      suits[4] = true; break;
                    }
                }
            }
        } else {
            for (let i = 0; i < 14; i++) {
                if (this._tiles[i].isValid()) {
                    switch (this._tiles[i]._type.id) {
                        case TileType.BAMBOO.id:    suits[0] = true; break;
                        case TileType.CHARACTER.id: suits[1] = true; break;
                        case TileType.DOT.id:       suits[2] = true; break;
                        case TileType.DRAGON.id:    suits[3] = true; break;
                        case TileType.WIND.id:      suits[4] = true; break;
                    }
                }
            }
        }
        return suits;
    }

    chows() {
        let count = 0;
        if (this._isNormal) {
            for (let i = 0; i < 4; i++) {
                if (this._melds[i]._type === MeldType.CHOW && this._melds[i].isValid()) {
                    count++;
                }
            }
        }
        return count;
    }

    kongs() {
        const result = { concealed: 0, melded: 0 };
        if (!this._isNormal) return result;
        for (let i = 0; i < 4; i++) {
            if (this._melds[i]._type === MeldType.KONG && this._melds[i].isValid()) {
                if (this._melds[i]._isConcealed) {
                    result.concealed++;
                } else {
                    result.melded++;
                }
            }
        }
        return result;
    }

    dragons() {
        let count = 0;
        if (this._isNormal) {
            for (let i = 0; i < 4; i++) {
                if (this._melds[i].isValid() && this._melds[i]._firstTile._type.id === TileType.DRAGON.id) {
                    count++;
                }
            }
        }
        return count;
    }

    winds() {
        let count = 0;
        if (this._isNormal) {
            for (let i = 0; i < 4; i++) {
                if (this._melds[i].isValid() && this._melds[i]._firstTile._type.id === TileType.WIND.id) {
                    count++;
                }
            }
        }
        return count;
    }

    flowersCount() {
        let count = 0;
        for (let i = 0; i < 8; i++) {
            if (this._flowers[i].isValid()) count++;
        }
        return count;
    }

    flowers() {
        return this.flowersCount();
    }

    minMax(min, max) {
        if (this._isNormal) {
            for (let i = 0; i < 5; i++) {
                if (!this._melds[i].isValid()) return false;
                const t = this._melds[i]._firstTile;
                if (!t.isRegular()) return false;

                if (this._melds[i]._type === MeldType.CHOW) {
                    if (t._num < min || t._num + 2 > max) return false;
                } else {
                    if (t._num < min || t._num > max) return false;
                }
            }
        } else {
            for (let i = 0; i < 14; i++) {
                if (!this._tiles[i].isValid() || !this._tiles[i].isRegular()) return false;
                if (this._tiles[i]._num < min || this._tiles[i]._num > max) return false;
            }
        }
        return true;
    }

    concealed() {
        let count = 0;
        if (this._isNormal) {
            for (let i = 0; i < 4; i++) {
                if (this._melds[i].isValid() && this._melds[i]._isConcealed) {
                    count++;
                }
            }
        }
        return count;
    }

    simplifiedJSON() {
        const result = {
            isNormal: this._isNormal,
            lastTile: this._lastTile,
            selfDrawn: this._selfDrawn,
            lastTileDrawn: this._lastTileDrawn,
            lastExistingTile: this._lastExistingTile,
            robbedKong: this._robbedKong,
            replacementTile: this._replacementTile,
            tenho: this._tenho,
            chiho: this._chiho,
            renho: this._renho,
            riichi: this._riichi,
            doubleRiichi: this._doubleRiichi,
            ippatsu: this._ippatsu,
            tableWind: this._tableWind.simplifiedJSON(),
            playerWind: this._playerWind.simplifiedJSON(),
            dora: this._dora.simplifiedJSON(),
            uradora: this._uradora.simplifiedJSON(),
            valueHint: this._valueHint,
            flowers: []
        };

        for (let i = 0; i < 8; i++) {
            if (this._flowers[i].isValid()) {
                result.flowers.push(this._flowers[i].simplifiedJSON());
            }
        }

        if (this._isNormal) {
            result.melds = [];
            for (let i = 0; i < 5; i++) {
                result.melds[i] = this._melds[i].simplifiedJSON();
            }
        } else {
            result.tiles = [];
            for (let i = 0; i < 14; i++) {
                result.tiles[i] = this._tiles[i].simplifiedJSON();
            }
        }

        return result;
    }

    static fromSimplifiedJSON(simplified) {
        if (!simplified) return new Hand();
        const result = new Hand();

        result._isNormal = Boolean(simplified.isNormal);
        result._lastTile = simplified.lastTile !== undefined ? simplified.lastTile : -1;
        result._selfDrawn = Boolean(simplified.selfDrawn);
        result._lastTileDrawn = Boolean(simplified.lastTileDrawn);
        result._lastExistingTile = Boolean(simplified.lastExistingTile);
        result._robbedKong = Boolean(simplified.robbedKong);
        result._replacementTile = Boolean(simplified.replacementTile);

        result._tableWind = Tile.fromSimplifiedJSON(simplified.tableWind);
        result._playerWind = Tile.fromSimplifiedJSON(simplified.playerWind);
        result._valueHint = simplified.valueHint !== undefined ? simplified.valueHint : -1;

        result._tenho = Boolean(simplified.tenho);
        result._chiho = Boolean(simplified.chiho);
        result._renho = Boolean(simplified.renho);
        result._riichi = Boolean(simplified.riichi);
        result._doubleRiichi = Boolean(simplified.doubleRiichi);
        result._ippatsu = Boolean(simplified.ippatsu);

        if (simplified.dora) {
            result._dora = Tile.fromSimplifiedJSON(simplified.dora);
        }
        if (simplified.uradora) {
            result._uradora = Tile.fromSimplifiedJSON(simplified.uradora);
        }

        if (Array.isArray(simplified.flowers)) {
            for (let i = 0; i < simplified.flowers.length && i < 8; i++) {
                result._flowers[i] = Tile.fromSimplifiedJSON(simplified.flowers[i]);
            }
        }

        if (simplified.isNormal && Array.isArray(simplified.melds)) {
            for (let i = 0; i < simplified.melds.length && i < 5; i++) {
                result._melds[i] = Meld.fromSimplifiedJSON(simplified.melds[i]);
            }
        } else if (Array.isArray(simplified.tiles)) {
            for (let i = 0; i < simplified.tiles.length && i < 14; i++) {
                result._tiles[i] = Tile.fromSimplifiedJSON(simplified.tiles[i]);
            }
        }

        return result;
    }
}
