/**
 * Economy & Development System
 * 
 * Gold is the main currency.
 * Countries can invest in Military, Economy, Stability, or Technology.
 * Character influences what they prefer to upgrade.
 */

export const UPGRADES = {
  military: {
    id: 'military',
    name: 'Askeri Yatırım',
    description: 'Orduyu güçlendir, birim kalitesini artır.',
    baseCost: 45,
    effect: (c) => { c.military = Math.min(100, c.military + 4); }
  },
  economy: {
    id: 'economy',
    name: 'Ekonomik Gelişim',
    description: 'Üretim ve ticaret kapasitesini artır.',
    baseCost: 40,
    effect: (c) => { c.economy = Math.min(100, c.economy + 4.5); }
  },
  stability: {
    id: 'stability',
    name: 'İç İstikrar',
    description: 'Propaganda, reform veya güvenlik yatırımı.',
    baseCost: 35,
    effect: (c) => { c.stability = Math.min(100, c.stability + 6); }
  },
  tech: {
    id: 'tech',
    name: 'Teknoloji',
    description: 'Araştırma ve geliştirme. Uzun vadeli avantaj.',
    baseCost: 70,
    effect: (c) => { c.tech = Math.min(12, c.tech + 1); }
  },
  nuclear: {
    id: 'nuclear',
    name: 'Nükleer Program',
    description: 'Son derece pahalı ve riskli. Sadece ileri teknoloji ile mümkün.',
    baseCost: 280,
    effect: (c) => {
      if (c.tech >= 7) {
        c.nuclear = true;
        c.stability -= 8; // internal tension
      }
    },
    requirement: (c) => c.tech >= 7 && !c.nuclear
  }
};

export class EconomySystem {
  constructor(world) {
    this.world = world;
  }

  /**
   * Daily economy tick for all countries
   */
  dailyTick() {
    for (const country of this.world.getAllCountries()) {
      // Territory income and recruitment flow to its current sovereign.
      const controller = this.world.getCountry(country.controllerId || country.id) || country;
      let income = country.economy * 0.65;

      // Stability affects efficiency
      income *= (0.6 + country.stability / 200);

      // War is expensive
      if (country.atWarWith.size > 0) {
        income *= 0.75;
        controller.gold -= country.atWarWith.size * 3; // war upkeep
      }

      // Tech slightly boosts everything
      income *= (1 + country.tech * 0.015);

      controller.gold += income;
      controller.manpower = Math.min(9999, controller.manpower + country.economy * 0.018);
      // Each controlled territory maintains a small local recruitment pipeline.
      country.military = Math.min(200, country.military + 0.12 + country.economy * 0.002);

      // Soft decay if overextended
      if (country.military > 90 && country.economy < 50) {
        country.stability -= 0.3;
      }

      // Very low stability can cause economic damage
      if (country.stability < 25) {
        country.economy = Math.max(10, country.economy - 0.4);
      }
    }
  }

  canAfford(country, upgradeId) {
    const up = UPGRADES[upgradeId];
    if (!up) return false;
    if (up.requirement && !up.requirement(country)) return false;

    const cost = this.getCost(country, upgradeId);
    return country.gold >= cost;
  }

  getCost(country, upgradeId) {
    const up = UPGRADES[upgradeId];
    if (!up) return 9999;

    // Cost scales slightly with how developed you already are
    let mult = 1;
    if (upgradeId === 'military') mult += country.military / 200;
    if (upgradeId === 'economy') mult += country.economy / 200;
    if (upgradeId === 'tech') mult += country.tech * 0.08;

    return Math.floor(up.baseCost * mult);
  }

  buyUpgrade(country, upgradeId) {
    if (!this.canAfford(country, upgradeId)) return false;

    const up = UPGRADES[upgradeId];
    const cost = this.getCost(country, upgradeId);

    country.gold -= cost;
    up.effect(country);

    // Small stability boost from successful investment (feeling of progress)
    if (upgradeId !== 'nuclear') {
      country.stability = Math.min(100, country.stability + 1.5);
    }

    return true;
  }

  /**
   * AI prefers upgrades matching their character
   */
  getPreferredUpgrade(country) {
    const char = country.characterId;
    const options = [];

    if (this.canAfford(country, 'military')) options.push({ id: 'military', w: char === 'AGGRESSIVE' ? 3 : 1 });
    if (this.canAfford(country, 'economy')) options.push({ id: 'economy', w: char === 'OPPORTUNIST' || char === 'DIPLOMATIC' ? 2.5 : 1.2 });
    if (this.canAfford(country, 'stability')) options.push({ id: 'stability', w: country.stability < 60 ? 3 : 0.8 });
    if (this.canAfford(country, 'tech')) options.push({ id: 'tech', w: char === 'IDEOLOGUE' || char === 'ISOLATIONIST' ? 2.2 : 1 });
    if (this.canAfford(country, 'nuclear') && char === 'AGGRESSIVE') options.push({ id: 'nuclear', w: 1.5 });

    if (options.length === 0) return null;

    // Weighted random
    const total = options.reduce((s, o) => s + o.w, 0);
    let r = Math.random() * total;
    for (const o of options) {
      r -= o.w;
      if (r <= 0) return o.id;
    }
    return options[0].id;
  }
}