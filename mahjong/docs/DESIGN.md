# Technical Architecture & Design Document: Mahjong Scoring System

## 1. System Architecture Overview

The application is structured into four decoupled layers following strict separation of concerns, native ES6 module architecture, and zero build tool dependencies:

```
+--------------------------------------------------------------------------+
|                               UI LAYER                                   |
|  (HandDisplay, FlowersBar, TilePalette, ScoreBreakdown, Modals, Themes)  |
+--------------------------------------------------------------------------+
                                    │
                                    ▼  EventBus (Pub/Sub)
+--------------------------------------------------------------------------+
|                             APPLICATION STATE                            |
|             (AppState: Hand, Ruleset, Theme, Lang)                        |
+--------------------------------------------------------------------------+
                  │                                         │
                  ▼
+------------------------------------+
|         CORE RULE ENGINE           |
|  - Strategy Pattern                |
|  - InternationalRules (MCR 81)     |
|  - RiichiRules                     |
+------------------------------------+
                  │
                  ▼
+--------------------------------------------------------------------------+
|                             DATA MODELS                                  |
|   (Tile, Meld, FlowerTile, Hand, ScoreResult, SpecialConditions)        |
+--------------------------------------------------------------------------+
```

---

## 2. Core Domain Data Models (`/src/core/models/`)

All models are pure, side-effect-free JavaScript ES6 classes with zero DOM dependencies.

### 2.1 `Tile.js`
* **Properties:**
  * `type`: Enum `{ BAMBOO: { id: 0, name: 'bamboo', len: 9, offset: 0 }, CHARACTER: { id: 1, name: 'character', len: 9, offset: 9 }, DOT: { id: 2, name: 'dot', len: 9, offset: 18 }, DRAGON: { id: 3, name: 'dragon', len: 3, offset: 27 }, WIND: { id: 4, name: 'wind', len: 4, offset: 30 }, FLOWER: { id: 5, name: 'flower', len: 4, offset: 34 }, SEASON: { id: 6, name: 'season', len: 4, offset: 38 } }`
  * `num`: 1-based integer index.
  * `tileId`: Global unique integer ID `[0..41]` or `-1` for invalid tile.
* **Key Methods:**
  * `isRegular()`, `isHonor()`, `isTerminal()`, `isFlower()`
  * `sameAs(otherTile)`: Identity equality based on `tileId`.
  * `clone()`, `next(delta)`: Sequential navigation in suit.
  * `getFileName()`: Image filename mapping (e.g. `'bamboo_1'`, `'wind_e'`).
  * `toSimplifiedJSON()`, `static fromSimplifiedJSON(json)`: Serialization.

### 2.2 `Meld.js`
* **Properties:**
  * `type`: Enum `{ CHOW: 0, PUNG: 1, KONG: 2, PAIR: 3 }`
  * `firstTile`: `Tile` instance.
  * `isConcealed`: boolean.
* **Key Methods:**
  * `getTiles()`: Returns array of `Tile` instances comprising the meld.
  * `isValid()`, `isHonor()`, `isTerminal()`, `hasTerminal()`.
  * `static compare(m1, m2)`: Canonical sorting order (Chows -> Pungs -> Kongs -> Pair).

### 2.3 `Hand.js`
* **Properties:**
  * `isNormal`: boolean (true = 4 melds + 1 pair; false = special 14-tile hand).
  * `melds`: Array of 5 `Meld` instances (melds 0..3 + pair at 4).
  * `tiles`: Array of 14 `Tile` instances (used when `isNormal === false`).
  * `flowers`: Array of up to 8 `Tile` instances (Plum, Orchid, Chrysant, Bamboo, Spring, Summer, Autumn, Winter).
  * `lastTile`: Integer index indicating which tile was the winning draw/claim.
  * `selfDrawn`: boolean (Tsumo vs. Ron).
  * `lastTileDrawn`: boolean (Haitei).
  * `lastExistingTile`: boolean (Houtei).
  * `robbedKong`: boolean (Chankan).
  * `replacementTile`: boolean (Rinshan Kaihou).
  * `tableWind`: `Tile` (East/South/West/North).
  * `playerWind`: `Tile` (East/South/West/North).
  * `valueHint`: Expected score for validation.
* **Key Methods:**
  * `countTiles()`: Histogram frequency map of all tiles.
  * `isComplete()`, `isValid()` (enforces <= 4 per tile, <= 1 per flower).
  * `clone()`, `sortedHand()`, `toSimplifiedJSON()`, `static fromSimplifiedJSON()`.

### 2.4 `ScoreResult.js`
* **Structure:**
  * `nbPoints`: Total scored points.
  * `items`: Array of scored items:
    * `ruleId`: MCR rule number or Riichi yaku key.
    * `name`: Localized or rule key name.
    * `points`: Points scored by this rule.
    * `count`: Multiplier (e.g. 2x for double rules).
    * `isImplied`: boolean (true if suppressed by a higher rule).
    * `impliedBy`: Name or ID of the parent rule that suppressed it.
    * `tileIndices`: Array of indices in the hand for interactive highlighting.

---

## 3. Rule Strategy Architecture (`/src/core/rules/`)

### 3.1 `RuleSetStrategy.js` Interface
```javascript
export class RuleSetStrategy {
  get id() { throw new Error('Not implemented'); }
  get name() { throw new Error('Not implemented'); }
  compute(hand) { throw new Error('Not implemented'); }
}
```

### 3.2 `InternationalRules.js` (MCR)
* Full port of Chinese Mahjong Competition Rules (81 official rules + flower bonus rule).
* **Implied Rule Matrix:** Maintained via rule definitions with `_implies` dependencies.
* **Pedagogical Enhancement:** Suppressed rules are returned with `points: 0`, `isImplied: true`, `impliedBy: parentRule.name` rather than dropped, fulfilling the pedagogical requirement.
* **Highlight Attribution:** Each rule computation maps which melds/tiles contributed to its condition.

### 3.3 `RiichiRules.js` (Japanese Modern Mahjong)
* Supports Riichi, Yaku evaluation, Han calculation, and Minipoints (Fu) calculation with rounding rules.

---

## 4. Vision Recognition (Deferred)

Camera/photo recognition is deliberately out of the current implementation scope. Manual tile entry is the supported workflow; recognition may be added after the app is working on mobile. No mock detections are shipped.

---

## 5. UI Architecture & Design System

### 5.1 Clean Modularity Emulating `nihongo`
Each UI component is an autonomous ES6 class managing its own DOM subtree and communicating through `EventBus`:

* `FlowersBar.js`: Row of 8 flower tiles toggling bonus tiles.
* `HandDisplay.js`:
  * Renders 4 melds + 1 pair or 14 special tiles.
  * Displays concealed/exposed badges.
  * Subscribes to `HIGHLIGHT_TILES` to glow matching tiles.
* `TilePalette.js`: On-demand tile picker with suit tabs; selecting a meld type opens it to choose the meld's starting tile. Pair and special-hand slots use it for tile entry or replacement.
* `SpecialConditions.js`: Single-line status bar for winds and situational modifiers.
* `ScoreBreakdown.js`:
  * Renders line items with points and implied notes.
  * Emits `HIGHLIGHT_TILES` on hover/click.
* Camera/photo recognition is deferred; users enter meld and special-hand tiles through the picker, and flowers through their dedicated row.
* `SettingsModal.js`: Modal configuration panel.
* `ExamplesModal.js`: 100 legacy sample hands browser and rule showcase loader.

### 5.2 CSS Architecture (`/src/ui/styles/`)
* `variables.css`: Design tokens (spacing, typography, transitions, tile dimensions).
* `themes.css`: The 5 theme definitions using CSS variable overrides on `[data-theme="..."]`.
* `components.css`: Frosted glass cards, ivory bone tile styling, badges, modals.
* `mobile.css`: Media queries and mobile ergonomics (44px touch targets, bottom sheets).

---

## 6. EventBus Contract
The application exports events through `src/utils/EventBus.js`:
* `HAND_CHANGED` (`hand`): Triggered whenever hand tiles, melds, or conditions change.
* `LOAD_SAMPLE_HAND` (`hand`): Loads a legacy sample or curated rule exemplar.
* `HIGHLIGHT_TILES` (`{ meldIndices, tileIndices }`): Highlights specific tiles in `HandDisplay`.
* `CLEAR_HIGHLIGHT`: Removes all glows.
* `THEME_CHANGED` (`themeName`): Applies new theme.
* `LANGUAGE_CHANGED` (`langCode`): Triggers i18n re-render.
* `RULESET_CHANGED` (`rulesetId`): Switches the scoring strategy and updates ruleset-specific controls.
* `TILE_SET_CHANGED` (`tileSet`): Selects the tile image set.

---

## 7. Zero-Dependency Test Suite (`tests.html`)
* Standalone browser test runner:
  * Executes all unit tests for `Tile`, `Meld`, and `Hand`.
  * Computes scores for all 100 `HandSamples` and validates against `valueHint`.
  * Verifies implied rule suppression and tile highlight mappings.
  * Renders visual test results with green/red status badges and execution timings.
