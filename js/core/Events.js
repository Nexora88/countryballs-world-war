/**
 * Events & Cascade System + Nuclear
 * 
 * Actions create ripples. Wars drag allies. Economic shocks spread.
 * Nuclear is a high-stakes last resort with severe consequences.
 */

export class EventSystem {
  constructor(world, combat, economy) {
    this.world = world;
    this.combat = combat;
    this.economy = economy;
    this.pendingEvents = [];
    this.worldTension = 0; // 0-100, rises with wars and nukes
    this.lastEventDay = 0;
  }

  update() {
    // Called on day advance
    this.checkCascades();
    this.checkRandomEvents();
    this.updateTension();
  }

  // ---------- Cascade ----------

  checkCascades() {
    // Ally join wars
    for (const country of this.world.getAllCountries()) {
      for (const enemyId of [...country.atWarWith]) {
        // Check if any ally of the defender should join
        const enemy = this.world.getCountry(enemyId);
        if (!enemy) continue;

        for (const allyId of enemy.allies) {
          const ally = this.world.getCountry(allyId);
          if (!ally || ally.isPlayer) continue;
          if (ally.isAtWarWith(country.id)) continue;

          // Character decides willingness to honor alliance
          const honorChance = 0.35 + ally.character.diplomacy * 0.4;
          if (Math.random() < honorChance) {
            this.world.declareWar(ally.id, country.id);
            this.queueNotification(`${ally.name}, müttefiki ${enemy.name} için savaşa girdi!`);
            this.worldTension += 4;
          }
        }
      }
    }
  }

  // ---------- Random / Systemic Events ----------

  checkRandomEvents() {
    if (this.world.day === this.lastEventDay) return;
    this.lastEventDay = this.world.day;

    // Low chance per day
    if (Math.random() > 0.08) return;

    const roll = Math.random();

    if (roll < 0.25) {
      this.eventEconomicShock();
    } else if (roll < 0.45) {
      this.eventStabilityCrisis();
    } else if (roll < 0.6) {
      this.eventTechBreakthrough();
    } else if (roll < 0.75) {
      this.eventDiplomaticOpportunity();
    } else {
      this.eventBorderTension();
    }
  }

  eventEconomicShock() {
    const victims = this.world.getAllCountries()
      .filter(c => c.economy > 40)
      .sort(() => Math.random() - 0.5)
      .slice(0, 1 + Math.floor(Math.random() * 2));

    for (const c of victims) {
      c.economy = Math.max(20, c.economy - 5);
      c.gold *= 0.92;
      c.stability -= 4;
      this.queueNotification(`${c.name} ekonomik sarsıntı yaşıyor.`);
    }
  }

  eventStabilityCrisis() {
    const candidates = this.world.getAllCountries().filter(c => c.stability < 70);
    if (candidates.length === 0) return;
    const c = candidates[Math.floor(Math.random() * candidates.length)];

    c.stability = Math.max(15, c.stability - 10);
    this.queueNotification(`${c.name} içinde istikrar krizi patlak verdi.`);

    if (c.stability < 30 && Math.random() < 0.3) {
      c.military = Math.max(15, c.military * 0.85);
      this.queueNotification(`${c.name}'de iç karışıklık orduyu da etkiledi.`);
    }
  }

  eventTechBreakthrough() {
    const candidates = this.world.getAllCountries().filter(c => c.tech < 11);
    if (candidates.length === 0) return;
    const c = candidates[Math.floor(Math.random() * candidates.length)];
    c.tech = Math.min(12, c.tech + 1);
    this.queueNotification(`${c.name} teknolojik bir atılım gerçekleştirdi.`);
  }

  eventDiplomaticOpportunity() {
    // Slight relation boost between two non-warring countries
    const list = this.world.getAllCountries();
    const a = list[Math.floor(Math.random() * list.length)];
    const b = list[Math.floor(Math.random() * list.length)];
    if (a.id === b.id || a.isAtWarWith(b.id)) return;

    a.modifyRelation(b.id, 8);
    b.modifyRelation(a.id, 8);
  }

  eventBorderTension() {
    const list = this.world.getAllCountries();
    const a = list[Math.floor(Math.random() * list.length)];
    const nearby = list.filter(t => {
      if (t.id === a.id) return false;
      const dx = a.x - t.x, dy = a.y - t.y;
      return Math.sqrt(dx*dx + dy*dy) < 0.35 && !a.isAlliedWith(t.id);
    });
    if (nearby.length === 0) return;
    const b = nearby[Math.floor(Math.random() * nearby.length)];

    a.modifyRelation(b.id, -12);
    b.modifyRelation(a.id, -12);
    this.queueNotification(`${a.name} ile ${b.name} arasında sınır gerilimi arttı.`);
    this.worldTension += 2;
  }

  // ---------- Nuclear ----------

  /**
   * Extremely high cost and consequence.
   * Only usable if country has nuclear = true.
   */
  canUseNuclear(country) {
    return country.nuclear && country.stability > 40;
  }

  launchNuclear(attackerId, targetId) {
    const attacker = this.world.getCountry(attackerId);
    const target = this.world.getCountry(targetId);
    if (!attacker || !target) return { ok: false, reason: 'invalid' };
    if (!this.canUseNuclear(attacker)) return { ok: false, reason: 'cannot' };

    // Massive damage to target
    target.military = Math.max(5, target.military * 0.25);
    target.economy = Math.max(8, target.economy * 0.4);
    target.stability = Math.max(5, target.stability - 35);
    target.manpower = Math.max(5, target.manpower * 0.5);

    // Attacker also pays heavy price (sanctions, internal shock, world hatred)
    attacker.stability -= 18;
    attacker.economy = Math.max(15, attacker.economy * 0.85);

    // World reaction
    this.worldTension = Math.min(100, this.worldTension + 35);

    for (const c of this.world.getAllCountries()) {
      if (c.id === attackerId || c.id === targetId) continue;
      c.modifyRelation(attackerId, -40);
      // Many will want to pile on
      if (c.character.aggression > 0.5 && Math.random() < 0.35) {
        if (!c.isAtWarWith(attackerId)) {
          this.world.declareWar(c.id, attackerId);
        }
      }
    }

    // Guarantee war
    if (!attacker.isAtWarWith(targetId)) {
      this.world.declareWar(attackerId, targetId);
    }

    attacker.expression = 'smug';
    target.expression = 'angry';

    this.queueNotification(`NÜKLEER SALDIRI: ${attacker.name} → ${target.name}. Dünya sarsıldı.`);

    return { ok: true };
  }

  // ---------- Helpers ----------

  queueNotification(text) {
    this.pendingEvents.push({ type: 'notify', text, time: Date.now() });
  }

  consumeNotifications() {
    const list = [...this.pendingEvents];
    this.pendingEvents = [];
    return list;
  }

  updateTension() {
    // Natural slow decay
    if (this.worldTension > 0) {
      this.worldTension = Math.max(0, this.worldTension - 0.08);
    }
    // Wars keep it elevated
    let wars = 0;
    for (const c of this.world.getAllCountries()) {
      wars += c.atWarWith.size;
    }
    this.worldTension = Math.min(100, this.worldTension + wars * 0.02);
  }
}