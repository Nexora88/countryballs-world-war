import { getCharacter, getGovernment } from '../data/countries.js';

/**
 * Country — A living political entity
 * 
 * Not just a territory. Has personality, internal state,
 * memory of relations, and agency.
 */
export class Country {
  constructor(data) {
    this.id = data.id;
    this.controllerId = data.id; // sovereign controller; changes when territory is conquered
    this.originalOwnerId = data.id;
    this.territoryLevel = 1;
    this.name = data.name;
    this.short = data.short;
    this.flagColors = data.flagColors;
    this.color = data.color;
    this.region = data.region;

    // Position on map (normalized 0-1)
    this.x = data.x;
    this.y = data.y;

    // Core stats (mutable)
    this.military = data.military;
    this.economy = data.economy;
    this.stability = data.stability;
    this.tech = data.tech;
    this.manpower = data.manpower;
    this.nuclear = data.nuclear || false;

    // Character & Government
    this.characterId = data.character;
    this.character = getCharacter(data.character);
    this.governmentId = data.government;
    this.government = getGovernment(data.government);

    // Runtime state
    this.isPlayer = false;
    this.gold = Math.floor(data.economy * 8 + Math.random() * 40);
    this.influence = 50;

    // Relations: Map<countryId, relationScore (-100 to 100)>
    this.relations = new Map();

    // Alliances & Wars
    this.allies = new Set();
    this.atWarWith = new Set();

    // Visual
    this.radius = 22 + (data.military + data.economy) / 20;
    this.selected = false;
    this.hover = false;

    // Animation state
    this.pulse = 0;
    this.expression = 'neutral'; // neutral | angry | happy | worried | smug
  }

  // --- Derived values ---

  get power() {
    return (this.military * 0.4 + this.economy * 0.3 + this.tech * 8 + this.manpower * 0.15);
  }

  get isStable() {
    return this.stability >= 50;
  }

  get isCollapsing() {
    return this.stability < 25;
  }

  // --- Relations ---

  getRelation(otherId) {
    return this.relations.get(otherId) ?? 0;
  }

  setRelation(otherId, value) {
    this.relations.set(otherId, Math.max(-100, Math.min(100, value)));
  }

  modifyRelation(otherId, delta) {
    const current = this.getRelation(otherId);
    this.setRelation(otherId, current + delta);
  }

  isAlliedWith(otherId) {
    return this.allies.has(otherId);
  }

  isAtWarWith(otherId) {
    return this.atWarWith.has(otherId);
  }

  // --- Character-driven decision helpers ---

  /**
   * How likely is this country to accept a diplomatic proposal?
   * Returns 0-1 probability modifier based on character + relations
   */
  diplomaticWillingness(targetRelation) {
    const char = this.character;
    const base = char.diplomacy;
    const relationBonus = targetRelation / 200; // -0.5 to +0.5
    return Math.max(0, Math.min(1, base + relationBonus));
  }

  /**
   * How aggressive is this country toward a target?
   */
  aggressionToward(targetRelation, targetPower) {
    const char = this.character;
    let score = char.aggression;

    // Weaker targets look more attractive to aggressives
    if (targetPower < this.power * 0.7) {
      score += 0.15 * char.expansionDesire;
    }

    // Bad relations fuel aggression
    if (targetRelation < -30) {
      score += 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  // --- Tick / Update ---

  tick(dt) {
    // Soft regeneration / decay
    if (this.stability < 100 && this.isStable) {
      this.stability = Math.min(100, this.stability + 0.002 * dt);
    }

    // Economy generates gold
    this.gold += (this.economy / 100) * 0.8 * dt;

    // Pulse animation
    this.pulse += dt * 0.003;
  }

  // --- Serialization helpers ---

  toJSON() {
    return {
      id: this.id,
      controllerId: this.controllerId,
      originalOwnerId: this.originalOwnerId,
      territoryLevel: this.territoryLevel,
      military: this.military,
      economy: this.economy,
      stability: this.stability,
      tech: this.tech,
      manpower: this.manpower,
      gold: this.gold,
      influence: this.influence,
      nuclear: this.nuclear,
      relations: Object.fromEntries(this.relations),
      allies: [...this.allies],
      atWarWith: [...this.atWarWith]
    };
  }
}