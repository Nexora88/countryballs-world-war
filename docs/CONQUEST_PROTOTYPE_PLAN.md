# Conquest Prototype — Research & Implementation Plan

## Goal

Build a clean-room, playable territorial-conquest prototype inside this repository. The first milestone should reproduce the broad *genre loop* (select a country, grow an army, send forces, fight, capture territory, react to opponents) without copying Country Balls: World War's source code, UI composition, maps, character art, audio, or other protected assets.

The long-term game identity remains original: deeper country personalities, diplomacy, economy, technology, scenarios, and a distinctive visual language.

## Repository baseline (2026-11-27)

The current `main` branch is a vanilla browser game (HTML/CSS/ES modules + Canvas 2D), not a Phaser/Vite project yet.

Existing systems discovered:
- 20 playable/selectable country records and five AI personality archetypes.
- A Canvas renderer with stylized continent silhouettes and countryball-like original procedural characters.
- World clock / speed controls.
- Army dispatch and battle resolution.
- Economy and upgrades.
- Alliances, trade, threats, ceasefires, events, nuclear mechanics, and victory conditions.

Important baseline files:
- `index.html`
- `css/style.css`
- `js/main.js`
- `js/core/World.js`
- `js/core/Country.js`
- `js/core/Army.js`
- `js/core/AI.js`
- `js/core/Economy.js`
- `js/render/Renderer.js`
- `js/data/countries.js`

The current combat system damages military/economy/stability but does not yet transfer actual territory ownership. That is the key gameplay gap for the first conquest prototype.

## Open-source research and reuse policy

### 1. OpenFrontIO — gameplay/architecture reference only
- Repository: https://github.com/openfrontio/OpenFrontIO
- It is a browser-based real-time territorial strategy game.
- Its architecture documentation separates deterministic simulation from rendering/client code and describes intent-driven state changes.
- Its source is GNU AGPL-3.0; assets have separate licensing rules and required notices.
- Decision: study high-level architecture and gameplay concepts only. Do not copy source files, UI, branding, or assets into this repository. Avoid importing AGPL code unless the project explicitly chooses to comply with its obligations.

References:
- https://github.com/openfrontio/OpenFrontIO/blob/main/docs/Architecture.md
- https://github.com/openfrontio/OpenFrontIO/blob/main/LICENSE
- https://github.com/openfrontio/OpenFrontIO/blob/main/LICENSE-ASSETS

### 2. World geography — Natural Earth-derived public-domain data
Candidate:
- https://github.com/cublya/world-atlas
- Data artifacts are derived from Natural Earth and are stated to be public domain; the repository's build code is separately ISC-licensed.
- Alternative: https://github.com/BenPortner/geojson-atlas (GeoJSON files stated to be CC0).
- Decision: use only the published map data after checking the exact file-level metadata and source version. Record the source and boundary policy in the game credits/data manifest. Do not copy map-rendering code unless its separate license is checked.

Natural Earth terms: https://www.naturalearthdata.com/about/terms-of-use/

### 3. Rendering framework
- Phaser 4 is the selected browser game framework for the planned renderer migration.
- TypeScript + Vite will provide a maintainable build and shared web/desktop bundle.
- Tauri 2 can package the same web build for Windows after the browser prototype is stable.
- Decision: do not rewrite the existing game in one risky change. First isolate gameplay simulation from the current Canvas renderer; then migrate rendering incrementally to Phaser.

References:
- https://www.phaser.io/oss/docs
- https://v2.tauri.app/

## Prototype 0.1 — required playable loop

1. Country selection and new-game start.
2. A readable world map with selectable countries/territories.
3. Clear ownership/territory state in the simulation (separate from the country identity).
4. Army production or replenishment over time.
5. Send a configurable force to an eligible target.
6. Travel/attack feedback and battle resolution.
7. Successful capture changes territory controller and map color.
8. Defeated countries can lose control; AI can expand and counterattack.
9. Pause, normal, fast, and very-fast simulation controls.
10. Save/load a local single-player game.
11. Tests for combat, capture, ownership, and AI target legality.

## Technical design guardrails

- Keep simulation rules independent of rendering.
- Use a seeded random-number generator for repeatable tests and replays.
- Represent country identity separately from territory controller/owner.
- Use explicit adjacency/attack-range rules; do not allow impossible global attacks by default.
- Validate all player actions in the simulation layer, not only in UI callbacks.
- Keep map geometry/data separate from game balance data.
- Do not add multiplayer, accounts, monetization, or a backend in Prototype 0.1.
- Preserve the existing MVP as a working baseline while the new conquest loop is developed.

## Proposed sequence

### Milestone A — Simulation foundation
- Add controller/ownership state and territory capture rules.
- Add deterministic combat tests.
- Add army production/reinforcement and valid-target rules.
- Add AI expansion decisions.

### Milestone B — Map and interaction
- Integrate an appropriately licensed Natural Earth-derived country map.
- Add pan/zoom, hover, selection, ownership coloring, and attack routes.
- Add clear HUD and country detail panel.

### Milestone C — Persistence and packaging
- Add versioned local save format and migration handling.
- Add Vite + TypeScript build.
- Migrate the renderer to Phaser 4 without rewriting simulation rules.
- Add Tauri 2 Windows packaging after web build passes.

## Acceptance criteria for 0.1

- A player can start as Türkiye, produce/replenish forces, attack an eligible neighboring territory, and capture it after winning.
- The map visibly reflects the new controller.
- AI countries can independently attack and capture territories.
- Invalid attacks (self-target, non-neighbor, insufficient force, already captured/ineligible target) are rejected by simulation rules.
- A deterministic test suite covers at least the core ownership and battle outcomes.
- `npm run build` and the test command pass once the Vite/TypeScript migration is introduced.

## Licensing note

The current repository has no root `LICENSE` file visible on `main`. Before public release or accepting external contributions, the project owner should choose and add a license for the original game code. Third-party map data, code, fonts, and assets must be tracked separately in a source/asset manifest. This document is an engineering plan, not legal advice.
