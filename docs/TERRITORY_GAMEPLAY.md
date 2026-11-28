# Territory Gameplay

This milestone connects the playable country layer to the country map.

## Rules
- Attacks are only accepted between pairs listed in `js/data/adjacency.js`.
- Land borders and a small set of explicit naval corridors are kept separate in the data source. The current playable roster contains only 20 countries, so some real-world borders pass through countries that are not playable; naval corridors keep the prototype strategically connected without pretending those missing countries are playable.
- Armies are deployed from a controlled neighboring territory. A source keeps a defensive garrison and contributes the selected percentage of its local military pool.
- A decisive attacker victory or attacker victory transfers the target territory's `controllerId` to the attacking sovereign. The captured country remains a territory record, preserving its economy, technology, and local identity.
- The map polygon tint follows the current controller. Countryball identity and flag details remain tied to the original country.
- Every territory contributes gold and manpower to its controller each game day and slowly replenishes its local military pool.
- A controller can recruit 10 local troops in any controlled territory for 12 gold and 5 manpower.

## Current scope and known limitations
- The playable roster remains 20 nations; the other Natural Earth country polygons are visual geography only.
- Adjacency is a hand-authored operational graph for this roster, not a fully computed shared-border graph for all 177 map features.
- Naval corridors are gameplay abstractions, not realistic ship movement or naval combat.
- Captured territories are managed as country-level regions. Province subdivision, occupation resistance, supply lines, garrisons as separate units, and liberation mechanics are not included yet.
- Browser/device playtesting is still required, especially for touch interaction, balance, and map readability after repeated captures.
