// -*- coding: utf-8 -*-

import { Tile, BAD_TILE } from './Tile.js';

export const MeldType = Object.freeze({
    CHOW: 0,
    PUNG: 1,
    KONG: 2,
    PAIR: 3
});

export class Meld {
    /**
     * @param {number} type MeldType (CHOW, PUNG, KONG, PAIR)
     * @param {Tile} firstTile The first/representative tile of the meld
     * @param {boolean} isConcealed Whether the meld was concealed in hand
     */
    constructor(type, firstTile, isConcealed = true) {
        this._type = type;
        this._firstTile = firstTile || BAD_TILE;
        this._isConcealed = Boolean(isConcealed);
    }

    get type() { return this._type; }
    get firstTile() { return this._firstTile; }
    get isConcealed() { return this._isConcealed; }
    set isConcealed(val) { this._isConcealed = Boolean(val); }

    static get MeldType() { return MeldType; }
    static get _kBadMeld() { return BAD_MELD; }

    clone() {
        return new Meld(this._type, this._firstTile.clone(), this._isConcealed);
    }

    /**
     * Returns an array of Tile instances in this meld.
     * @returns {Tile[]}
     */
    getTiles() {
        if (!this.isValid()) return [];
        switch (this._type) {
            case MeldType.CHOW:
                return [
                    this._firstTile.clone(),
                    this._firstTile.next(1),
                    this._firstTile.next(2)
                ];
            case MeldType.PUNG:
                return [
                    this._firstTile.clone(),
                    this._firstTile.clone(),
                    this._firstTile.clone()
                ];
            case MeldType.KONG:
                return [
                    this._firstTile.clone(),
                    this._firstTile.clone(),
                    this._firstTile.clone(),
                    this._firstTile.clone()
                ];
            case MeldType.PAIR:
                return [
                    this._firstTile.clone(),
                    this._firstTile.clone()
                ];
            default:
                return [];
        }
    }

    isValid() {
        if (!this._firstTile || !this._firstTile.isValid()) return false;
        if (this._type === MeldType.CHOW) {
            return this._firstTile.isRegular() && this._firstTile.num < 8;
        } else if (this._firstTile.isRegular() || this._firstTile.isHonor()) {
            return true;
        }
        return false;
    }

    isHonor() {
        return this.isValid() && this._firstTile.isHonor();
    }

    isTerminal() {
        return this._type !== MeldType.CHOW && this._firstTile.isTerminal();
    }

    hasTerminal() {
        if (!this.isValid()) return false;
        if (this._type === MeldType.CHOW) {
            return this._firstTile.num === 1 || this._firstTile.num === 7;
        }
        return this._firstTile.isTerminal();
    }

    toString() {
        if (this.isValid()) {
            const tileName = this._firstTile.toString();
            switch (this._type) {
                case MeldType.CHOW: return `Chow of ${tileName}`;
                case MeldType.PUNG: return `Pung of ${tileName}`;
                case MeldType.KONG: return `Kong of ${tileName}`;
                case MeldType.PAIR: return `Pair of ${tileName}`;
            }
        }
        return 'Undefined';
    }

    /**
     * Comparable interface for canonical sorting.
     * Chows first, then Pungs/Kongs, pair last.
     */
    static compare(meld1, meld2) {
        if (meld2._type !== meld1._type) {
            if (meld2._type === MeldType.CHOW) return 1;
            if (meld1._type === MeldType.CHOW) return -1;
            if (meld2._type === MeldType.PAIR) return -1;
            if (meld1._type === MeldType.PAIR) return 1;
        }
        return Tile.compare(meld1._firstTile, meld2._firstTile);
    }

    simplifiedJSON() {
        let typeName = 'CHOW';
        for (const [key, val] of Object.entries(MeldType)) {
            if (val === this._type) {
                typeName = key;
                break;
            }
        }
        return {
            type: typeName,
            firstTile: this._firstTile.simplifiedJSON(),
            isConcealed: this._isConcealed
        };
    }

    static fromSimplifiedJSON(simplified) {
        if (!simplified) return BAD_MELD;
        const type = MeldType[simplified.type] !== undefined ? MeldType[simplified.type] : MeldType.CHOW;
        const firstTile = Tile.fromSimplifiedJSON(simplified.firstTile);
        return new Meld(type, firstTile, simplified.isConcealed);
    }
}

export const BAD_MELD = Object.freeze(new Meld(MeldType.CHOW, BAD_TILE, false));
