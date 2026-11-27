import { COUNTRIES } from '../data/countries.js';
import { Country } from './Country.js';

/**
 * World — The living simulation
 * Holds all countries, manages time, relations initialization,
 * and will later drive cascade events & AI turns.
 */
export class World {
  constructor() {
    this.countries = new Map();
    this.playerId = null;
    this.day = 1;
    this.month = 1;
    this.year = 2026;
    this.speed = 1; // 0 = paused, 1-3 = speed levels
    this.tickAccumulator = 0;

    this.init();
  }

  init() {
    // Create country instances
    for (const data of COUNTRIES) {
      const country = new Country(data);
      this.countries.set(country.id, country);
    }

    // Initialize base relations (regional affinity + character compatibility)
    this.initializeRelations();
  }

  initializeRelations() {
    const list = [...this.countries.values()];

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];

        let score = 0;

        // Same region → slight positive
        if (a.region === b.region) score += 15;

        // Character compatibility
        score += this.characterAffinity(a.characterId, b.characterId);

        // Some historical / thematic biases (kept light & fun)
        score += this.thematicBias(a.id, b.id);

        // Small random variance so every game feels different
        score += (Math.random() - 0.5) * 20;

        a.setRelation(b.id, score);
        b.setRelation(a.id, score);
      }
    }
  }

  characterAffinity(charA, charB) {
    // Similar characters tend to get along better (except two aggressives)
    if (charA === charB) {
      if (charA === 'AGGRESSIVE') return -10;
      return 12;
    }

    const pairs = {
      'DIPLOMATIC_ISOLATIONIST': 8,
      'DIPLOMATIC_OPPORTUNIST': 5,
      'AGGRESSIVE_OPPORTUNIST': 3,
      'IDEOLOGUE_AGGRESSIVE': -5,
      'IDEOLOGUE_DIPLOMATIC': -8,
      'ISOLATIONIST_AGGRESSIVE': -15
    };

    const key1 = `${charA}_${charB}`;
    const key2 = `${charB}_${charA}`;
    return pairs[key1] ?? pairs[key2] ?? 0;
  }

  thematicBias(idA, idB) {
    // Light historical flavor (not heavy realism — this is Countryballs)
    const biases = {
      'usa_china': -25,
      'usa_russia': -30,
      'usa_uk': 25,
      'usa_canada': 35,
      'usa_japan': 20,
      'usa_israel': 30,
      'china_japan': -20,
      'china_india': -15,
      'russia_poland': -25,
      'russia_germany': -10,
      'germany_france': 20,
      'uk_france': 10,
      'india_pakistan': -40, // if we add pakistan later
      'iran_israel': -45,
      'iran_saudi': -30,
      'turkey_greece': -20
    };

    const key1 = `${idA}_${idB}`;
    const key2 = `${idB}_${idA}`;
    return biases[key1] ?? biases[key2] ?? 0;
  }

  // --- Player ---

  setPlayer(countryId) {
    // Clear previous
    if (this.playerId) {
      const prev = this.countries.get(this.playerId);
      if (prev) prev.isPlayer = false;
    }

    this.playerId = countryId;
    const country = this.countries.get(countryId);
    if (country) {
      country.isPlayer = true;
      // Player starts with a small gold bonus
      country.gold += 80;
    }
  }

  getPlayer() {
    return this.countries.get(this.playerId);
  }

  // --- Time ---

  setSpeed(speed) {
    this.speed = Math.max(0, Math.min(3, speed));
  }

  /**
   * Advance the world.
   * dt is real milliseconds.
   */
  update(dt) {
    if (this.speed === 0) return;

    const gameSpeed = [0, 1, 2.5, 5][this.speed];
    this.tickAccumulator += dt * gameSpeed;

    // One 