import { COUNTRIES } from '../data/countries.js';
import { Country } from './Country.js';
import { CombatSystem } from './Army.js';
import { AIController } from './AI.js';
import { EconomySystem } from './Economy.js';
import { EventSystem } from './Events.js';

/**
 * World — The living simulation
 */
export class World {
  constructor() {
    this.countries = new Map();
    this.playerId = null;
    this.day = 1;
    this.month = 1;
    this.year = 2026;
    this.speed = 1;
    this.tickAccumulator = 0;
    this.dayLength = 1400;

    this.combat = null;
    this.ai = null;
    this.economy = null;
    this.events = null;

    this.init();
  }

  init() {
    for (const data of COUNTRIES) {
      const country = new Country(data);
      this.countries.set(country.id, country);
    }
    this.initializeRelations();

    this.combat = new CombatSystem(this);
    this.economy = new EconomySystem(this);
    this.events = new EventSystem(this, this.combat, this.economy);
    this.ai = new AIController(this, this.combat);
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
      'usa_china': -25, 'usa_russia': -30, 'usa_uk': 25, 'usa_canada': 35,
      'usa_japan': 20, 'usa_israel': 30, 'china_japan': -20, 'china_india': -15,
      'russia_poland': -25, 'russia_germany': -10, 'germany_france': 20,
      'uk_france': 10, 'iran_israel': -45, 'iran_saudi': -30, 'turkey_greece': -20
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
      country.gold += 100;
    }
  }

  getPlayer() { return this.countries.get(this.playerId); }
  getCountry(id) { return this.countries.get(id); }
  getAllCountries() { return [...this.countries.values()]; }

  setSpeed(speed) {
    this.speed = Math.max(0, Math.min(3, speed));
  }

  update(dt) {
    if (this.speed === 0) return;

    const gameSpeed = [0, 1, 2.5, 5][this.speed];
    this.tickAccumulator += dt * gameSpeed;

    while (this.tickAccumulator >= this.dayLength) {
      this.tickAccumulator -= this.dayLength;
      this.advanceDay();
    }

    // Continuous systems
    this.combat.update(dt * gameSpeed);
    this.ai.update(dt, gameSpeed);

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

    this.economy.dailyTick();
    this.events.update();

    // AI light economy investments
    for (const c of this.getAllCountries()) {
      if (c.isPlayer) continue;
      if (Math.random() < 0.12) {
        const pref = this.economy.getPreferredUpgrade(c);
        if (pref) this.economy.buyUpgrade(c, pref);
      }
    }
  }

  getDateString() {
    const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    return `${this.day} ${months[this.month - 1]} ${this.year}`;
  }

  declareWar(attackerId, defenderId) {
    const attacker = this.getCountry(attackerId);
    const defender = this.getCountry(defenderId);
    if (!attacker || !defender) return false;
    if (attacker.isAtWarWith(defenderId)) return false;

    attacker.atWarWith.add(defenderId);
    defender.atWarWith.add(attackerId);
    attacker.setRelation(defenderId, -90);
    defender.setRelation(attackerId, -90);
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