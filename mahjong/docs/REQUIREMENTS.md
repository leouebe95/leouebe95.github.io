# Requirements Specification: Modular Mahjong Scoring System

## 1. Executive Summary & Objectives
The goal of this project is to re-architect and modernize the legacy Mahjong scoring web application (`zold-mahjong`) into a modular, responsive, mobile-first, zero-dependency native web application located in `mahjong/`.

The application runs directly in any modern browser without requiring Node.js, npm, or build tools (fully compatible with GitHub Pages hosting). Its coding style, modularity, and file organization emulate the clean patterns established in the sibling `nihongo` project.

---

## 2. Visual Design & Theming Specification

### 2.1 Default Theme: Imperial Emerald Glassmorphism
* **Canvas Background:** Deep Jade / Dark Emerald (`#0B251A` with radial atmospheric gradients).
* **Panels & Cards:** Translucent frosted glass (`rgba(20, 50, 35, 0.70)` with `backdrop-filter: blur(14px)` and subtle metallic gold borders `rgba(229, 193, 88, 0.3)`).
* **Accents:** Imperial Gold (`#E5C158`) and Vermilion Red (`#D93829`).
* **Tile Rendering:** High-contrast ivory bone tiles with realistic tactile bevels, rounded corners, soft drop shadows, and crisp traditional tile glyphs.
* **Typography:** Clean, modern geometric sans-serif (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Plus Jakarta Sans`, `Inter`, `sans-serif`) ensuring maximum legibility on mobile viewports.

### 2.2 Theme Switching (5 Themes)
The application must dynamically switch themes without page reload by updating CSS variables and classes on the root element:
1. **Imperial Emerald Glassmorphism** (Default): Jade green frosted glass, imperial gold & vermilion accents.
2. **Modern Zen:** Nordic-Japanese minimalism with soft bamboo whites, charcoal ink typography, warm wood borders, and muted earth tones.
3. **Cyberpunk Riichi:** Midnight OLED black (`#07080d`), glowing neon cyan (`#00f0ff`), and hot neon magenta (`#ff007b`) with futuristic HUD borders.
4. **Tactile Neumorphic:** Soft 3D green felt mahjong table (`#1c6b3e`), subtle dual shadows (pressed & raised), and physical tile textures.
5. **Scandinavian Bauhaus:** Ultra-clean structural monochrome grid layout with stark primary color accents (canary yellow, cobalt blue, vivid red).

---

## 3. Core Functional Requirements

### 3.1 Flowers & Seasons Row
* A dedicated bar located directly above the main hand.
* Displays 8 bonus tiles:
  * 4 Flowers: Plum (1), Orchid (2), Chrysanthemum (3), Bamboo (4)
  * 4 Seasons: Spring (1), Summer (2), Autumn (3), Winter (4)
* Clicking a flower toggles its presence in the hand and updates the scoring fan calculation.

### 3.2 Main Hand Display & Melds
* Supports 14+ tiles (14 standard tiles, up to 18 with 4 Kongs).
* Supports two distinct hand structures:
  1. **Regular Hand (Normal Hand):** 4 Melds (Chow, Pung, Kong) + 1 Pair. Clear visual separation between melds, exposed/concealed indicator badge, and winning tile indicator.
  2. **Special Hand:** Irregular 14-tile structure (e.g. Thirteen Orphans, Seven Pairs, Knitted hands) without the 4-meld + 1-pair constraint.
* Visual indicators for:
  * Winning tile (Last Tile / Agari-hai) with distinct badge/glow.
  * Concealed vs. Melded (exposed) state per meld.

### 3.3 Special Conditions & Table Context
* A single, compact, responsive status row:
  * **Prevalent (Round) Wind:** East, South, West, North selector.
  * **Seat Wind:** East, South, West, North selector.
  * **Self-Drawn (Tsumo):** Win by drawing one's own tile vs. win by discard (Ron).
  * **Last Tile Draw (Haitei):** Drawn from the last tile of the wall.
  * **Last Tile Claim (Houtei):** Claimed from the last discard.
  * **Robbing a Kong (Chankan):** Winning on a tile used by an opponent to extend a Pung into a Kong.
  * **Replacement Tile (Rinshan Kaihou):** Out on the replacement tile drawn after declaring a Kong.
* All modifiers immediately trigger re-scoring.

### 3.4 Manual Tile Entry Mode
* **Meld Helper:** Each meld slot offers Chow, Pung, or Kong; choosing a type opens a tile picker where the user selects only the starting tile and the full meld is populated automatically.
* Clicking a meld, pair, or special-hand tile slot opens the tile picker for replacement or entry. Pair remains a separate pair slot.
* Flowers and seasons are entered from their dedicated row.
* Concealed/Melded toggle button per meld slot.
* Tile limit enforcement: Maximum 4 identical standard tiles across the hand, maximum 1 of each flower tile.

### 3.5 Manual Tile Entry (Current Scope)
* Manual entry uses an on-demand tile picker with suit tabs for Dots, Bamboo, Characters, and Honors; flowers and seasons remain on their dedicated row.
* Selecting a meld type and a starting tile populates a Chow, Pung, or Kong; the pair slot and special-hand slots open the picker when selected.
* Tile limits are enforced and invalid placements are rejected with visible feedback.
* Camera/photo tile recognition is explicitly deferred until after the manual-entry application is working. It is not part of the current release and must not be represented by fabricated detections.

### 3.6 Interactive Combination Tile Highlighting
* In the Score & Combination Breakdown, clicking or hovering over any scoring line item (e.g., *"Pure Straight - 16 pts"* or *"Robbing a Kong - 8 pts"* or *"All Chows - 2 pts"*) emits an event.
* The application responds by highlighting/glowing the exact corresponding tiles in the hand display that produced that score.

### 3.7 Implied / Suppressed Rules Display
* Under standard Mahjong Competition Rules (MCR), higher-tier rules suppress lower-tier component rules.
* When a rule is suppressed, it MUST still be displayed in the scoring breakdown, formatted as:
  `[0 pts] Rule Name [Implied by Rule XXX]` with muted/grayed styling, providing full transparent scoring pedagogy to the player.

### 3.8 Ruleset Strategy Pattern & Extensibility
* Default Ruleset: **Chinese Mahjong Competition Rules (MCR / International Rules)** with all 81 official fan rules + flower points.
* Extensible strategy interface supporting:
  * **Riichi Rules (Japanese Mahjong):** Yaku, Han, Minipoints (Fu), Dora, Uradora, Tenhou, Chiihou, Renhou.
  * Future rulesets (e.g., Hong Kong, Classical).

### 3.9 Example Hands & Educational Rule Sampler
* **Preset Sample Hands:** Complete library of 100 sample hands ported from the legacy `HandSamples.js`. The reference library contains 100 entries; the app does not invent a 101st hand.
* **Rule Showcase:** User can select any of the 81 MCR rules from a dropdown/modal and instantly load an exemplar hand demonstrating that rule. Curated examples supplement but do not alter the 100-hand legacy library.

### 3.10 Internationalization (i18n)
* Pure client-side dictionary system supporting 5 languages:
  * English (`en`)
  * French (`fr`)
  * Japanese (`ja`)
  * Simplified Chinese (`zh-CN`)
  * Traditional Chinese (`zh-TW`)
* Instant language switching without page reload.

### 3.11 User Preferences Modal
* Settings modal to configure:
  * Active Theme (Imperial Emerald, Modern Zen, Cyberpunk, Neumorphic, Bauhaus)
  * Active Ruleset (MCR International, Riichi)
  * Active Language
  * Tile Face Set (Default / Alt High-Res)
* Stored in `localStorage` for immediate persistence.

---

## 4. Mobile-First Ergonomic Boundaries
* Minimum touch targets: 44px × 44px.
* Single-hand thumb-accessible bottom actions on mobile viewports (< 768px).
* CSS Container queries and flex-wrap layouts ensuring tiles shrink proportionally on narrow smartphone screens (360px - 430px) without horizontal body scrolling.
* Bottom-sheet style modal overlays on small viewports.

---

## 5. Architectural Quality Attributes
* **Zero Dependencies:** No npm package dependencies, no build or bundler step required. Native ES6 modules (`import`/`export`) loaded directly via browser.
* **Separation of Concerns:** Core domain models and scoring rule engines contain zero DOM/UI references and are 100% testable in isolation.
* **Headless & Browser Testability:** A standalone `tests.html` runs the complete test harness against all 100 sample hands, unit tests, and edge cases.
