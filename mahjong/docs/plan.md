# MASTER SYSTEM PROMPT: Modular Re-Architecture & Enhancement of Mahjong Scoring Application

## EXECUTIVE INSTRUCTION FOR ANTIGRAVITY
You are acting as an Autonomous Principal Software Architect and Lead Full-Stack Engineer. You are authorized and encouraged to **spawn and orchestrate sub-agents** (e.g., specialized agents for Core Domain Engine, Vision/Scanner Component, Modern UI/CSS System, and Vitest Test Suite) to execute sub-tasks in parallel or in sequence.

Your goal is to completely re-architect, modernize, and extend a legacy Mahjong scoring web application into a lightweight, modular, mobile-first, and bulletproof production codebase.

Execute the process autonomously from start to finish across **5 sequential phases**:
1. Requirements Specification (`REQUIREMENTS.md`)
2. Technical Architecture & Design Document (`DESIGN.md`)
3. Implementation Plan (`PLAN.md`)
4. Complete Modular Implementation
5. Autonomous Test Execution & Verification

The legacy source code is avaiable in the `zold-mahjong` directory. You will use it as inspiration. The new code must be placed in the `mahjong` directory. All documents must be placed in the `docs` sub-directory. You will use `nihongo` as an exmaple of coding style, modularyty, and file organization.

---

## 1. VISUAL DESIGN SPECIFICATION

Implement the application using the following visual theme system (supporting dynamic theme switching or defaulting to the selected theme below):

* **Selected Default Theme:** Imperial Emerald Glassmorphism
  * **Background:** Deep Jade / Dark Emerald (`#0B251A` with subtle ambient gradients).
  * **Panels & Cards:** Translucent frosted glass overlays (`rgba(20, 50, 35, 0.65)` with `backdrop-filter: blur(12px)` and subtle gold borders).
  * **Accents:** Imperial Gold (`#E5C158`) and Vermilion Red (`#D93829`).
  * **Tile Styling:** High-contrast ivory bone tiles with subtle tactile depth, rounded corners, drop shadows, and vibrant traditional tile glyphs.
  * **Typography:** Modern clean sans-serif (*Inter* / *Plus Jakarta Sans*) with high legibility on small screens.

The application MUST also support runtime theme switching between 5 themes:
1. Imperial Emerald Glassmorphism
2. Modern Zen (Nordic-Japanese minimalism with soft bamboo accents)
3. Cyberpunk Riichi (Midnight arcade OLED dark mode with glowing neon cyan/magenta)
4. Tactile Neumorphic (Soft 3D felt table with raised physical tiles)
5. Scandinavian Bauhaus (Ultra-clean, high-contrast structural grid layout)


---

## 2. ARCHITECTURAL & MODULARITY REQUIREMENTS

Style implementation must be modular, easy to maintain, with an effort placed on defining only a small number of reusable constants across all UI elements. 

In general, for style and the rest of the code, you will pay particular attention to factoring code when possible and elimite code duplication.

### Tech Stack Constraints
* **Zero Heavy Frameworks:** DO NOT use React, Angular, Vue, or Next.js. Use modern vanilla Web standards: **Vite + Native ES Modules (ES6+) + Web Components / Light UI Modules + Modern CSS (CSS Grid, Flexbox, Container Queries, CSS Variables)**.
* **Build & Dev Tooling:** **Vite** bundler and **Vitest** for native, fast headless unit and integration testing.
* **Strict Separation of Concerns:**
  * `DataModel` (`/src/core/models/`): Pure Javascript domain entities (`Tile`, `Hand`, `Meld`, `FlowerTile`, `ScoreResult`, `SpecialConditions`). Completely isolated from DOM, browser APIs, or UI frameworks.
  * `RuleEngine` (`/src/core/rules/`): Decoupled scoring strategy using the **Strategy Pattern** (`RuleSetStrategy` interface).
    * `InternationalRules.js` (MCR - 81 fan rules fully ported and validated against legacy unit tests).
    * Extensible interfaces for adding future rulesets (`RiichiRules.js`, `HongKongRules.js`).
  * `UI Layer` (`/src/ui/`): Modular, responsive UI components interacting via an asynchronous `EventBus` / Pub-Sub pattern.
  * `ScannerEngine` (`/src/core/scanner/`): Vision and camera processing abstraction layer.
* **Headless Testability:** 100% of core domain models and rule strategies MUST execute and pass tests in headless Node/Vitest environments without requiring a DOM window.

---

## 3. CORE FUNCTIONAL & ERGONOMIC REQUIREMENTS

### Mobile-First & Responsive Ergonomics
* **Form Factor:** Optimized for mobile phones (portrait and landscape) as well as tablets and desktop browsers.
* **Touch Targets & Layout:** Minimum touch target sizes (44x44px), collapsible options panels, bottom-sheet overlays on narrow screens, and thumb-friendly tile selection palettes.

### UI Structure & Tile Layout
1. **Flowers & Seasons Row:**
   * A dedicated row located **directly above the main hand** specifically for Flower and Season bonus tiles (Plum, Orchid, Bamboo, Chrysanthemum, Spring, Summer, Autumn, Winter).
   * Flower/Season tiles contribute to specific bonus scoring fans depending on the selected rule set.
2. **Main Hand Display (14+ Tiles):**
   * Clear separation of concealed hand tiles, called melds (Chii, Pon, Kan), and the winning draw/discard tile.
   * Typically 14 tiles, grouped in a pair and 4 melds for regular hands. Additional tiles for Kan.
   * Special hands do not use the meld structure for display
3. **Special Conditions Panel:**
   * Toggles for situational scoring modifiers: **Robbing a Kong**, **Last Tile Draw (Haitei/Houtei)**, **Self-Draw (Tsumo)**, **Seat Wind**, **Prevailing/Round Wind**, and **Replacement Tile after Kong**.
   * displayed in a single line in the UI.
   * Table contition is displayed somewhere in the UI: prevalent wind and player cardinal point.
4. **Camera / Photo Input Button & Automated Tile Scanner:**
   * Prominent **Camera / Photo Scan button** in the UI header/action bar.
   * Supports device camera stream (via WebRTC `getUserMedia`) AND static image file upload.
   * **Photo Recognition Orientation Rules:**
     * **Horizontal Tile Orientation:** Interpreted as **Concealed / Hidden** tiles.
     * **Vertical Tile Orientation:** Interpreted as **Exposed / Called Melds** ().
   * **Interactive Correction Overlay:** If detection confidence is low or misclassifies a tile, display detected bounding boxes over the photo image so the user can tap and edit tiles manually before submitting to the scorer.
5. **Manual Tile Entry Mode:**
   * Ergonomic suit picker (Dots, Bamboo, Characters, Winds, Dragons, Flowers).
   * Drag-and-drop or tap-to-place tile management with undo/redo capabilities.
   * user first selects Chii, Pon, Kan, the only enters the first tile of a meld.
6. **Interactive Combination Tile Highlighting (CRITICAL FEATURE):**
   * In the Score & Combination Breakdown list, clicking or hovering over any scoring line item (e.g., *"Pure Straight - 16 pts"* or *"Robbing a Kong - 8 pts"*) MUST emit an event that **visually highlights/glows the exact corresponding tiles** in the hand display that formed that specific combination.
7. **Internationalization (i18n):**
   * Decoupled dictionary system (`i18n.js`). Instant UI language switching (English, Chinese Simplified, Chinese Traditional, Japanese, French) without page reloads.
8. **ignored rules:**
   * When a rule is ignored, because it is implied by a rule of higher score, It is displayed in the score area, marked as 0 points, with a comment [Implied from rule XXX]
9. **Preferences:** 
   * User preferences (display style, ruleset, ...) are edited in a transient, modal settings panel, to avoid clutter.
10. **Example hands: **
   * User can load example hands from the predefined list implemented in the legacy application.
   * In addition, user can select any rule of the ruleset, and load a pre-defined (to be implemented) hand that illustrates that rule

---

## 4. WORKFLOW & DELIVERABLE PIPELINE

Work step-by-step through the following 5 phases. Output each document cleanly as you proceed. You must be as autonomous as possible, but when in doubt, ask the human supervisor.

### Phase 1: Requirements Specification Document (`REQUIREMENTS.md`)
* Audit legacy JS/CSS/HTML app structure.
* Document precise functional rules, i18n key mappings, scoring fan definitions, mobile UX boundaries, and camera orientation specifications.

### Phase 2: Technical Design Document (`DESIGN.md`)
* Document class structure, domain data interfaces, state management event streams, rule strategy interfaces, vision processing pipeline, and CSS component hierarchy.
* Use simple preference storage (no database nor authentication) for the ruleset to use, the style, ...
* Detail the exact sub-agent delegation strategy if spawning sub-agents.

### Phase 3: Implementation Plan (`PLAN.md`)
* Detail a step-by-step task checklist broken into milestones:
  * Milestone 1: Project setup & Vitest harness
  * Milestone 2: Domain models (`Tile`, `Meld`, `FlowerTile`, `Hand`)
  * Milestone 3: International Rules Strategy & porting legacy tests
  * Milestone 4: EventBus & i18n system
  * Milestone 5: Responsive UI Components & Theme system
  * Milestone 6: Camera Scanner engine & orientation detection logic
  * Milestone 7: Combination line-item highlight system
  * Milestone 8: Full test suite verification

### Phase 4: Full Codebase Implementation
Produce the complete, fully implemented file structure without placeholder comments or missing logic:
```text
/src
  /core
    /models      (Tile.js, Hand.js, Meld.js, FlowerTile.js, ScoreResult.js)
    /rules       (RuleSetStrategy.js, InternationalRules.js, RiichiRules.js)
    /i18n        (i18n.js, locales/en.json, locales/zh.json, locales/ja.json, etc.)
    /scanner     (TileScannerEngine.js, OrientationDetector.js)
  /ui
    /components  (FlowersBar.js, HandDisplay.js, TilePalette.js, SpecialConditions.js, ScoreBreakdown.js, CameraModal.js, ThemePicker.js)
    /styles      (variables.css, themes.css, mobile.css, components.css)
  /utils         (EventBus.js, Helper.js)
/tests
  /unit          (Models, ScoringRules, i18n tests)
  /integration   (CameraInputToHand, ScoringToHighlighting tests)
index.html
tests.html
package.json
vite.config.js