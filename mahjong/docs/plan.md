# IMPLEMENTATION PLAN: Modern Modular Mahjong Scoring System

## Architecture Approach: Zero-Dependency Native Web
This application is implemented entirely using standard Web standards (modern ES6+ Native Modules, Vanilla CSS with custom properties and glassmorphism, and HTML5 Web APIs). It requires zero external npm packages and zero Node.js build steps, running directly in any modern browser and fully ready for GitHub Pages hosting, adhering to the coding style and modularity of `nihongo`.

---

## Milestone Checklist

### Milestone 1: Asset Pipeline & Directory Structure
- [x] Create directory structure under `mahjong/` (`docs/`, `img/`, `src/core/models/`, `src/core/rules/`, `src/core/i18n/`, `src/ui/components/`, `src/ui/styles/`, `src/utils/`, `tests/`).
- [x] Copy and optimize tile images from `zold-mahjong/img/` to `mahjong/img/` (both default and alt sets).

### Milestone 2: Core Domain Models (`/src/core/models/`)
- [x] Implement `Tile.js`: Suits, honors, terminals, flowers, comparison, serialization.
- [x] Implement `Meld.js`: Chow, Pung, Kong, Pair, concealed flags, comparison, validation.
- [x] Implement `Hand.js`: Melds, special tiles, flowers, winds, situational modifiers, validation, sorting.
- [x] Implement `ScoreResult.js`: Breakdown structure with points, multipliers, implied rules tracking, and combination tile mappings.

### Milestone 3: Rule Engine Strategy Pattern (`/src/core/rules/`)
- [x] Implement `RuleSetStrategy.js` abstract base class.
- [x] Port and modernize `InternationalRules.js` (MCR - Chinese Official): All 81 fan rules + flowers, implied rules suppression tracking, and combination tile attribution.
- [x] Implement `RiichiRules.js` (Japanese Modern Mahjong): Yaku, Han, Fu/Minipoints calculation.
- [x] Create Rule Exemplar Catalog: Matching examples for all MCR rules, supplementing (not altering) the 100 legacy samples.

### Milestone 4: EventBus & Internationalization (`/src/core/i18n/` & `/src/utils/`)
- [x] Implement `EventBus.js`: Lightweight Pub/Sub event emitter.
- [x] Implement `i18n.js`: Client-side localization with instant hot-swapping for English (`en`), French (`fr`), Japanese (`ja`), Simplified Chinese (`zh-CN`), and Traditional Chinese (`zh-TW`).

### Milestone 5: UI Styling & Theme System (`/src/ui/styles/`)
- [x] Implement `variables.css`: Core design tokens, layout variables, typography.
- [x] Implement `themes.css`: 5 distinct runtime themes:
  1. Imperial Emerald Glassmorphism (Default)
  2. Modern Zen
  3. Cyberpunk Riichi
  4. Tactile Neumorphic
  5. Scandinavian Bauhaus
- [x] Implement `components.css`: Glassmorphic panels, bone tiles with 3D bevels, badges, glow effects.
- [x] Implement `mobile.css`: Fluid responsive typography, container layouts, mobile bottom-sheet ergonomics, and touch-friendly controls.

### Milestone 6: UI Components (`/src/ui/components/`)
- [x] Implement `FlowersBar.js`: Dedicated top row for 8 flower and season bonus tiles.
- [x] Implement `HandDisplay.js`: Interactive display for normal (4 melds + 1 pair) and special hands, concealed status badges, winning tile marker, and glow highlight effects.
- [x] Implement `SpecialConditions.js`: Compact status bar for table winds and situational modifiers.
- [x] Implement `TilePalette.js`: On-demand tile picker for starting-tile meld construction and hand-slot tile entry.
- [x] Implement `ScoreBreakdown.js`: Scoring items list with interactive tile highlighting, total points, and implied-rule annotations.
- [x] Implement `SettingsModal.js`: Transient configuration modal for theme, language, ruleset, and tile style.
- [x] Implement `ExamplesModal.js`: Browser for all 100 legacy sample hands and a working showcase for every MCR rule.

### Milestone 7: Vision Recognition (Deferred)
- [ ] After the manual-entry app is working, design and implement local tile recognition for camera/photo input.
- [ ] Do not ship placeholder detections or claim recognition until the recognizer and correction flow are implemented and verified.

### Milestone 8: Test Harness & Verification (`tests.html`)
- [x] Implement `tests.html`: Zero-dependency, in-browser unit and integration test runner.
- [x] Add unit tests for `Tile`, `Meld`, and `Hand`.
- [x] Port and verify all 100 legacy `HandSamples` against `valueHint`.
- [x] Verify combination tile highlighting and implied rule display.