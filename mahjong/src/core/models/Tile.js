// -*- coding: utf-8 -*-

/**
 * Tile suits and definitions for Mahjong.
 */
export const TileType = Object.freeze({
    BAMBOO:    { id: 0, len: 9, offset: 0,  name: 'bamboo',    ext: '123456789' },
    CHARACTER: { id: 1, len: 9, offset: 9,  name: 'character', ext: '123456789' },
    DOT:       { id: 2, len: 9, offset: 18, name: 'dot',       ext: '123456789' },
    DRAGON:    { id: 3, len: 3, offset: 27, name: 'dragon',    ext: 'wgr' },
    WIND:      { id: 4, len: 4, offset: 30, name: 'wind',      ext: 'eswn' },
    FLOWER:    { id: 5, len: 4, offset: 34, name: 'flower',    ext: '1234' },
    SEASON:    { id: 6, len: 4, offset: 38, name: 'season',    ext: '1234' }
});

const BAD_ID = -10;

/** Resource names for display and i18n lookup */
const DRAGON_NAMES = ['WHITE_DR', 'GREEN_DR', 'RED_DR'];
const WIND_NAMES   = ['EAST', 'SOUTH', 'WEST', 'NORTH'];
const FLOWER_NAMES = ['PLUM', 'ORCHID', 'CHRYSANT', 'BAMBOO'];
const SEASON_NAMES = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];

/**
 * Domain entity representing an individual Mahjong tile.
 */
export class Tile {
    /**
     * @param {Object} type TileType descriptor
     * @param {number} num 1-based index within suit
     */
    constructor(type, num) {
        this._type = type;
        this._num = num;
        this._tileId = Tile.uniqueId(type, num);
    }

    get type() { return this._type; }
    get num() { return this._num; }
    get tileId() { return this._tileId; }

    static get TileType() { return TileType; }
    static get _kBadId() { return BAD_ID; }
    static get _kNumberDifferentTiles() { return TileType.SEASON.offset + TileType.SEASON.len; }
    static get _kBadTile() { return BAD_TILE; }

    /**
     * Compute unique integer ID for a tile.
     * @param {Object} type TileType
     * @param {number} num 1-based index
     * @returns {number} Unique ID [0..41] or -10 if invalid
     */
    static uniqueId(type, num) {
        if (!type) return BAD_ID;
        const zeroIndex = num - 1;
        if (zeroIndex < 0 || zeroIndex >= type.len) {
            return BAD_ID;
        }
        return type.offset + zeroIndex;
    }

    /**
     * @returns {Tile} Deep copy of tile
     */
    clone() {
        return new Tile(this._type, this._num);
    }

    /**
     * Returns a tile offset by `delta` positions in the same suit (wrapping).
     * @param {number} delta Offset (+/-)
     * @returns {Tile}
     */
    next(delta) {
        const offset = ((this._num + delta - 1) % this._type.len + this._type.len) % this._type.len;
        return new Tile(this._type, offset + 1);
    }

    /**
     * Compares identity with another tile.
     * @param {Tile} other
     * @returns {boolean}
     */
    sameAs(other) {
        if (!other) return false;
        if (this._tileId !== BAD_ID && this._tileId === other._tileId) {
            return true;
        }
        return false;
    }

    /**
     * @returns {boolean} True if tile is valid
     */
    isValid() {
        return this._tileId !== BAD_ID;
    }

    /**
     * @returns {boolean} True if flower or season
     */
    isFlower() {
        return this.isValid() && (
            this._type === TileType.FLOWER ||
            this._type === TileType.SEASON
        );
    }

    /**
     * @returns {boolean} True if dragon or wind
     */
    isHonor() {
        return this.isValid() && (
            this._type === TileType.DRAGON ||
            this._type === TileType.WIND
        );
    }

    /**
     * @returns {boolean} True if regular numeric suit (bamboo, character, dot)
     */
    isRegular() {
        return this.isValid() && (
            this._type === TileType.BAMBOO ||
            this._type === TileType.CHARACTER ||
            this._type === TileType.DOT
        );
    }

    /**
     * @returns {boolean} True if regular suit and 1 or 9
     */
    isTerminal() {
        return this.isRegular() && (this._num === 1 || this._num === 9);
    }

    /**
     * Returns the asset file basename (without extension).
     * e.g. 'bamboo_1', 'dragon_w', 'empty'
     */
    static fileNameS(type, num) {
        const id = Tile.uniqueId(type, num);
        if (id < 0) return 'empty';
        return `${type.name}_${type.ext[num - 1]}`;
    }

    fileName() {
        return Tile.fileNameS(this._type, this._num);
    }

    /**
     * String representation (localized key or formatted name).
     */
    toString() {
        if (!this.isValid()) {
            return `Bad Tile (${this._num},${this._type?.name || 'unknown'})`;
        }

        switch (this._type.id) {
            case TileType.DRAGON.id: return DRAGON_NAMES[this._num - 1] || 'DRAGON';
            case TileType.WIND.id:   return WIND_NAMES[this._num - 1] || 'WIND';
            case TileType.FLOWER.id: return FLOWER_NAMES[this._num - 1] || 'FLOWER';
            case TileType.SEASON.id: return SEASON_NAMES[this._num - 1] || 'SEASON';
            default: return `${this._type.name}-${this._num}`;
        }
    }

    /**
     * Sorting comparator.
     */
    static compare(tile1, tile2) {
        let t1 = tile2._tileId;
        let t2 = tile1._tileId;
        if (t1 < 0) t1 = 100;
        if (t2 < 0) t2 = 100;

        if (t1 < t2) return 1;
        if (t1 > t2) return -1;
        return 0;
    }

    /**
     * Serialization to minimal JSON object.
     */
    simplifiedJSON() {
        return {
            type: this._type.name,
            num: this._num
        };
    }

    /**
     * Deserialization from minimal JSON object.
     */
    static fromSimplifiedJSON(simplified) {
        if (!simplified) return BAD_TILE;
        let foundType = null;
        for (const key of Object.keys(TileType)) {
            if (TileType[key].name === simplified.type) {
                foundType = TileType[key];
                break;
            }
        }
        if (!foundType) return BAD_TILE;
        return new Tile(foundType, simplified.num);
    }
}

/** Global constant invalid tile */
export const BAD_TILE = Object.freeze(new Tile(TileType.BAMBOO, BAD_ID));
