# Turkish regional conquest prototype

This branch adds the first sub-national strategic layer to Countryballs: Sovereign.

## Included

- Seven Turkish geographic regions are modeled independently: Marmara, Aegean, Mediterranean, Central Anatolia, Black Sea, Eastern Anatolia and Southeastern Anatolia.
- Region-to-region movement is restricted to an explicit adjacency graph.
- Regions have separate owners, troop pools, stability and economic values.
- Regional battles can transfer control without requiring the whole country to fall.
- Strategic cities are independent objectives: Istanbul, Izmir, Antalya, Ankara, Samsun, Erzurum and Diyarbakir.
- Ankara is flagged as the capital. Capturing it causes a major Turkish stability penalty.
- City control is intentionally independent from region control, so a city can remain contested after its surrounding region changes hands.
- Regional troops can be recruited through the region panel.
- The map renders clickable region and city markers for players selecting Turkey or Iran.
- Iran can launch an abstract border entry into Eastern Anatolia or Southeastern Anatolia.

## Current model boundaries

- These are the seven geographic regions of Turkey, not all 81 administrative provinces.
- Markers use approximate map coordinates. They are not true region polygons and do not replace the Natural Earth country geometry.
- Cities are strategic objectives represented by markers and garrisons, not detailed urban maps.
- Only Turkey has this regional layer in this iteration. Other playable countries continue using country-level territories.
- The only external playable land entry currently modeled is Iran. Other neighboring states are not playable in the current roster.
- AI regional campaigns, logistics/supply, occupation resistance, peace settlement, and capital-based surrender conditions are not implemented yet.
- Regional combat is a lightweight immediate resolution separate from the existing animated country-to-country army convoy system.

## Next technical milestones

1. Replace approximate markers with licensed admin-1 GeoJSON polygons and polygon hit-testing.
2. Extend the same province schema to every playable country.
3. Connect regional armies to the existing timed convoy/combat system.
4. Add AI regional targeting, supply lines, occupation and capitulation rules.
5. Add automated simulation tests and browser/mobile playtesting before merging.
