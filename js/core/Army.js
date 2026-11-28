/**
 * Army & Combat System
 * 
 * Units are not endless blobs. They have strength, morale, and travel time.
 * Battles are resolved with power ratios + character modifiers + randomness.
 */

export class Army {
  constructor({ id, ownerId, strength, fromId, toId, progress = 0 }) {
    this.id = id;
    this.ownerId = ownerId;
    this.strength = strength;       // current fighting power
    this.originalStrength = strength;
    this.fromId = fromId;
    this.toId = toId;
    this.progress = progress;      // 0 → 1 (travel progress)
    this.speed = 0.00035;          // base travel speed per ms
    this.morale = 1.0;             // 0.5 – 1.2
    this.arrived = false;
    this.retreating = false;
  }

  update(dt) {
    if (this.arrived || this.retreating) return;

    this.progress += this.speed * dt;
    if (this.progress >= 1) {
      this.progress = 1;
      this.arrived = true;
    }
  }

  get position() {
    // Will be interpolated by renderer using from/to country positions
    return this.progress;
  }
}

export class CombatSystem {
  constructor(world) {
    this.world = world;
    this.armies = [];
    this.nextArmyId = 1;
    this.battleLog = [];
  }

  /**
   * Player or AI sends an army from one country to another.
   * Strength is taken from the sender's military pool.
   */
  sendArmy(fromId, toId, strengthPercent = 0.4) {
    const from = this.world.getCountry(fromId);
    const to = this.world.getCountry(toId);
    if (!from || !to) return null;
    if (fromId === toId) return null;
    if (!this.world.areAdjacent(fromId, toId)) return null;
    if (from.controllerId !== fromId && from.controllerId !== this.world.playerId) return null;
    if (to.controllerId === from.controllerId) return null;

    // Can't send more than available
    const maxSend = Math.floor(from.military * 0.7); // leave some home defense
    const strength = Math.max(5, Math.floor(from.military * strengthPercent));
    const actual = Math.min(strength, maxSend);

    if (actual < 5) return null;

    // Deduct from sender (temporary commitment)
    from.military = Math.max(10, from.military - actual * 0.6);

    const army = new Army({
      id: this.nextArmyId++,
      ownerId: from.controllerId,
      strength: actual,
      fromId,
      toId
    });

    // Character influences travel speed & morale
    const char = from.character;
    army.speed *= (0.85 + char.aggression * 0.3);
    army.morale = 0.85 + char.aggression * 0.25 + (from.stability / 200);

    this.armies.push(army);
    return army;
  }

  update(dt) {
    for (const army of this.armies) {
      army.update(dt);

      if (army.arrived && !army.retreating) {
        this.resolveArrival(army);
      }
    }

    // Cleanup dead/finished armies
    this.armies = this.armies.filter(a => !a.retreating || a.progress > 0);
  }

  resolveArrival(army) {
    const attacker = this.world.getCountry(army.ownerId);
    const defender = this.world.getCountry(army.toId);
    if (!attacker || !defender) {
      army.retreating = true;
      return;
    }

    // Already at war? Or is this a surprise attack?
    const wasAtWar = attacker.isAtWarWith(defender.id);

    if (!wasAtWar) {
      // Declaring war by sending army
      this.world.declareWar(attacker.id, defender.id);
    }

    // Calculate combat power
    const atkPower = this.calculatePower(attacker, army.strength, army.morale, true);
    const defPower = this.calculatePower(defender, defender.military * 0.7, 1.0, false);

    const ratio = atkPower / (defPower + 1);

    // Battle result
    let result;
    if (ratio > 1.45) {
      result = 'decisive_attacker';
    } else if (ratio > 1.1) {
      result = 'attacker_win';
    } else if (ratio > 0.85) {
      result = 'pyrrhic';
    } else if (ratio > 0.6) {
      result = 'defender_win';
    } else {
      result = 'decisive_defender';
    }

    this.applyBattleResult(attacker, defender, army, result, ratio);
    army.retreating = true;
    army.progress = 0.99; // will be cleaned
  }

  calculatePower(country, unitStrength, morale, isAttacker) {
    let power = unitStrength * morale;

    // Tech advantage
    power *= (1 + country.tech * 0.04);

    // Stability penalty
    if (country.stability < 40) {
      power *= 0.75 + (country.stability / 160);
    }

    // Character modifiers
    const char = country.character;
    if (isAttacker) {
      power *= (0.9 + char.aggression * 0.25);
    } else {
      // Defenders get slight bonus if diplomatic/isolationist (home advantage mindset)
      if (char.id === 'diplomatic' || char.id === 'isolationist') {
        power *= 1.12;
      }
    }

    // Nuclear deterrence soft effect (not actual nuke)
    if (country.nuclear && isAttacker) {
      power *= 1.05; // slight confidence
    }

    // Randomness (war is never pure math)
    power *= 0.88 + Math.random() * 0.24;

    return power;
  }

  applyBattleResult(attacker, defender, army, result, ratio) {
    const log = {
      time: `${this.world.day}/${this.world.month}/${this.world.year}`,
      attacker: attacker.name,
      defender: defender.name,
      result,
      ratio: ratio.toFixed(2)
    };

    switch (result) {
      case 'decisive_attacker':
        defender.military = Math.max(8, defender.military * 0.45);
        defender.stability -= 12;
        attacker.military += army.strength * 0.25;
        attacker.modifyRelation(defender.id, -15);
        defender.modifyRelation(attacker.id, -25);
        // Chance of territory pressure (future: actual province system)
        if (Math.random() < 0.4) defender.economy = Math.max(15, defender.economy - 6);
        log.message = `${attacker.name} ezici zafer kazandı.`;
        if (this.world.captureTerritory(attacker.id, defender.id)) log.message += ` ${defender.name} ele geçirildi!`;
        break;

      case 'attacker_win':
        defender.military = Math.max(10, defender.military * 0.7);
        defender.stability -= 7;
        attacker.military += army.strength * 0.15;
        attacker.modifyRelation(defender.id, -10);
        defender.modifyRelation(attacker.id, -18);
        log.message = `${attacker.name} zafer kazandı.`;
        if (this.world.captureTerritory(attacker.id, defender.id)) log.message += ` ${defender.name} ele geçirildi!`;
        break;

      case 'pyrrhic':
        defender.military = Math.max(12, defender.military * 0.85);
        attacker.military = Math.max(12, attacker.military * 0.9);
        defender.stability -= 4;
        attacker.stability -= 3;
        log.message = `Kanlı bir muharebe. İki taraf da yıprandı.`;
        break;

      case 'defender_win':
        attacker.military = Math.max(10, attacker.military * 0.75);
        attacker.stability -= 5;
        defender.military += 3;
        log.message = `${defender.name} saldırıyı püskürttü.`;
        break;

      case 'decisive_defender':
        attacker.military = Math.max(8, attacker.military * 0.55);
        attacker.stability -= 9;
        defender.stability += 3;
        log.message = `${defender.name} büyük bir zafer kazandı.`;
        break;
    }

    // Expression updates
    if (result.includes('attacker')) {
      attacker.expression = 'smug';
      defender.expression = 'angry';
    } else {
      attacker.expression = 'worried';
      defender.expression = 'smug';
    }

    this.battleLog.push(log);
    if (this.battleLog.length > 30) this.battleLog.shift();

    // Return remaining strength to attacker (survivors)
    const survivors = army.strength * (result.includes('attacker') ? 0.55 : 0.25);
    attacker.military += survivors * 0.5;

    return log;
  }

  getArmies() {
    return this.armies;
  }
}