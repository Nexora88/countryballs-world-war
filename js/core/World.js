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
    this.dayLength = 1200; // ms of real time per game day at speed 1

    this.init();
  }

  init() {
    for (const data of COUNTRIES) {
      const country = new Country(data);
      this.countries.set(country.id, country);
    }
    this.initializeRelations();
  }

  initializeRelations() {
    const list = [...this.countries.values()];

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];

        let score = 0;

        if (a.region === b.region) score += 15;
        score += this.characterAffinity(a.characterId, b.characterId);
        score += this.thematicBias(a.id, b.id);
        score += (Math.random() - 0.5) * 20;

        a.setRelation(b.id, score);
        b.setRelation(a.id, score);
      }
    }
  }

  characterAffinity(charA, charB) {
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
      'iran_israel': -45,
      'iran_saudi': -30,
      'turkey_greece': -20
    };

    const key1 = `${idA}_${idB}`;
    const key2 = `${idB}_${idA}`;
    return biases[key1] ?? biases[key2] ?? 0;
  }

  setPlayer(countryId) {
    if (this.playerId) {
      const prev = this.countries.get(this.playerId);
      if (prev) prev.isPlayer = false;
    }

    this.playerId = countryId;
    const country = this.countries.get(countryId);
    if (country) {
      country.isPlayer = true;
      country.gold += 80;
    }
  }

  getPlayer() {
    return this.countries.get(this.playerId);
  }

  getCountry(id) {
    return this.countries.get(id);
  }

  getAllCountries() {
    return [...this.countries.values()];
  }

  setSpeed(speed) {
    this.speed = Math.max(0, Math.min(3, speed));
  }

  /**
   * Advance the world. dt is real milliseconds.
   */
  update(dt) {
    if (this.speed === 0) return;

    const gameSpeed = [0, 1, 2.5, 5][this.speed];
    this.tickAccumulator += dt * gameSpeed;

    // One game day passes every dayLength ms at speed 1
    while (this.tickAccumulator >= this.dayLength) {
      this.tickAccumulator -= this.dayLength;
      this.advanceDay();
    }

    // Continuous soft updates (economy trickle etc.)
    for (const country of this.countries.values()) {
      country.tick(dt * gameSpeed / 1000);
    }
  }

  advanceDay() {
    this.day += 1;
    if (this.day > 30) {
      this.day = 1;
      this.month += 1;
      if (this.month > 12) {
        this.month = 1;
        this.year += 1;
      }
    }

    // Future: trigger AI decisions, cascade checks, random events here
  }

  getDateString() {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${this.day} ${months[this.month - 1]} ${this.year}`;
  }

  // --- Diplomacy helpers ---

  declareWar(attackerId, defenderId) {
    const attacker = this.getCountry(attackerId);
    const defender = this.getCountry(defenderId);
    if (!attacker || !defender) return false;
    if (attacker.isAtWarWith(defenderId)) return false;

    attacker.atWarWith.add(defenderId);
    defender.atWarWith.add(attackerId);

    // Relation crash
    attacker.setRelation(defenderId, -90);
    defender.setRelation(attackerId, -90);

    // Cascade seed: allies may join later
    return true;
  }

  formAlliance(aId, bId) {
    const a = this.getCountry(aId);
    const b = this.getCountry(bId);
    if (!a || !b) return false;
    if (a.isAtWarWith(bId)) return false;

    a.allies.add(bId);
    b.allies.add(aId);

    a.modifyRelation(bId, 25);
    b.modifyRelation(aId, 25);

    return true;
  }
}