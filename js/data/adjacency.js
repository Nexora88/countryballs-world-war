/**
 * Operational adjacency for the 20 playable nations.
 * Land borders are separated from short, explicit naval corridors so the
 * game never treats arbitrary map proximity as a valid invasion route.
 */
export const LAND_NEIGHBORS = {
  canada: ['usa'],
  usa: ['canada', 'mexico'],
  mexico: ['usa'],
  brazil: [],
  uk: [],
  france: ['germany'],
  germany: ['france', 'poland'],
  poland: ['germany', 'russia'],
  russia: ['poland', 'china'],
  turkey: ['iran'],
  egypt: ['israel'],
  israel: ['egypt'],
  saudi: [],
  iran: ['turkey'],
  india: ['china'],
  china: ['russia', 'india'],
  south_korea: [],
  japan: [],
  indonesia: [],
  australia: []
};

export const NAVAL_NEIGHBORS = {
  canada: [],
  usa: [],
  mexico: ['brazil'],
  brazil: ['mexico'],
  uk: ['france'],
  france: ['uk'],
  germany: [],
  poland: [],
  russia: [],
  turkey: ['israel'],
  egypt: ['saudi'],
  israel: ['turkey'],
  saudi: ['egypt'],
  iran: ['india'],
  india: ['iran'],
  china: ['south_korea'],
  south_korea: ['china', 'japan'],
  japan: ['south_korea', 'indonesia'],
  indonesia: ['japan', 'australia'],
  australia: ['indonesia']
};

export function areCountriesAdjacent(a, b) {
  return Boolean(a && b && (
    (LAND_NEIGHBORS[a] || []).includes(b) ||
    (NAVAL_NEIGHBORS[a] || []).includes(b)
  ));
}

export function getAdjacentCountries(id) {
  return [...new Set([...(LAND_NEIGHBORS[id] || []), ...(NAVAL_NEIGHBORS[id] || [])])];
}
