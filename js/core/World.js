import { COUNTRIES } from '../data/countries.js';
import { Country } from './Country.js';
import { CombatSystem } from './Army.js';
import { AIController } from './AI.js';
import { EconomySystem } from './Economy.js';
import { EventSystem } from './Events.js';
import { VictorySystem } from './Victory.js';

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
    this.victory = null;

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
    this.victory = new VictorySystem(this);
  }

  initializeRelations() {
    const list = [...this.countries.values()];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
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
    if (charA === charB) return charA === 'AGGRESSIVE' ? -10 : 12;
    const pairs = {
      'DIPLOMATIC_ISOLATIONIST': 8, 'DIPLOMATIC_OPPORTUNIST': 5,
      'AGGRESSIVE_OPPORTUNIST': 3, 'IDEOLOGUE_AGGRESSIVE': -5,
      'IDEOLOGUE_DIPLOMATIC': -8, 'ISOLATIONIST_AGGRESSIVE': -15
    };
    return pairs[`${charA}_${charB}`] ?? pairs[`${charB}_${charA}`] ?? 0;
  }

  thematicBias(idA, idB) {
    const biases = {
      'usa_china': -25, 'usa_russia': -30, 'usa_uk': 25, 'usa_canada': 35,
      'usa_japan': 20, 'usa_israel': 30, 'china_japan': -20, 'china_india': -15,
      'russia_poland': -25, 'russia_germany': -10, 'germany_france': 20,
      'uk_france': 10, 'iran_israel': -45, 'iran_saudi': -30
    };
    return biases[`${idA}_${idB}`] ?? biases[`${idB}_${idA}`] ?? 0;
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

    for (const c of this.getAllCountries()) {
      if (c.isPlayer) continue;
      if (Math.random() < 0.12) {
        const pref = this.economy.getPreferredUpgrade(c);
        if (pref) this.economy.buyUpgrade(c, pref);
      }
    }

    // Victory check every few days
    if (this.day % 5 === 0) this.victory.check();
  }

  getDateString() {
    const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    return `${this.day} ${months[this.month - 1]} ${this.year}`;
  }

  declareWar(attackerId, defenderId) {
    const attacker = this.getCountry(attackerId);
    const defender = this.getCountry(defenderId);
    if (!attacker || !defender || attacker.isAtWarWith(defenderId)) return false;
    attacker.atWarWith.add(defenderId);
    defender.atWarWith.add(attackerId);
    attacker.setRelation(defenderId, -90);
    defender.setRelation(attackerId, -90);
    // Break alliance if any
    attacker.allies.delete(defenderId);
    defender.allies.delete(attackerId);
    return true;
  }

  formAlliance(aId, bId) {
    const a = this.getCountry(aId);
    const b = this.getCountry(bId);
    if (!a || !b || a.isAtWarWith(bId)) return false;
    a.allies.add(bId);
    b.allies.add(aId);
    a.modifyRelation(bId, 25);
    b.modifyRelation(aId, 25);
    return true;
  }

  /** Ceasefire / white peace */
  makePeace(aId, bId) {
    const a = this.getCountry(aId);
    const b = this.getCountry(bId);
    if (!a || !b) return false;
    a.atWarWith.delete(bId);
    b.atWarWith.delete(aId);
    a.modifyRelation(bId, 18);
    b.modifyRelation(aId, 15);
    return true;
  }

  /** Simple trade pact: mutual small economy boost + relation */
  formTrade(aId, bId) {
    const a = this.getCountry(aId);
    const b = this.getCountry(bId);
    if (!a || !b || a.isAtWarWith(bId)) return false;
    a.modifyRelation(bId, 12);
    b.modifyRelation(aId, 12);
    a.economy = Math.min(100, a.economy + 1.5);
    b.economy = Math.min(100, b.economy + 1.5);
    a.gold += 15;
    b.gold += 15;
    return true;
  }

  /** Threat: demand relation drop or risk war */
  issueThreat(fromId, toId) {
    const from = this.getCountry(fromId);
    const to = this.getCountry(toId);
    if (!from || !to) return { success: false };

    const powerRatio = from.power / (to.power + 1);
    const fear = Math.min(0.9, powerRatio * 0.4 + from.character.aggression * 0.3);

    if (Math.random() < fear) {
      // Target backs down
      to.modifyRelation(fromId, -10);
      from.modifyRelation(toId, 5);
      to.stability -= 3;
      return { success: true, backedDown: true };
    } else {
      // Target hardens or may declare war
      to.modifyRelation(fromId, -20);
      from.modifyRelation(toId, -8);
      if (to.character.aggression > 0.6 && Math.random() < 0.35) {
        this.declareWar(toId, fromId);
        return { success: true, backedDown: false, war: true };
      }
      return { success: true, backedDown: false, war: false };
    }
  }
}