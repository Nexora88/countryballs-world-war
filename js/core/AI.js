/**
 * AI System — Character-driven decision making
 * 
 * Every country evaluates the world through the lens of its National Character.
 * No two countries behave the same way in the same situation.
 */

export class AIController {
  constructor(world, combat) {
    this.world = world;
    this.combat = combat;
    this.decisionCooldown = 0;
    this.decisionInterval = 4500; // ms between AI evaluation cycles at speed 1
  }

  update(dt, gameSpeed) {
    if (gameSpeed === 0) return;

    this.decisionCooldown += dt * gameSpeed;
    if (this.decisionCooldown < this.decisionInterval) return;
    this.decisionCooldown = 0;

    const countries = this.world.getAllCountries().filter(c => !c.isPlayer);

    // Shuffle so order is not deterministic
    for (let i = countries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [countries[i], countries[j]] = [countries[j], countries[i]];
    }

    for (const country of countries) {
      this.evaluate(country);
    }
  }

  evaluate(country) {
    // Low stability → focus inward
    if (country.stability < 35) {
      this.handleInternalCrisis(country);
      return;
    }

    // Already at war → manage wars
    if (country.atWarWith.size > 0) {
      this.manageWars(country);
      return;
    }

    // Peace time: character decides priority
    const char = country.character;

    if (Math.random() < char.aggression * 0.55) {
      this.considerAggression(country);
    } else if (Math.random() < char.diplomacy * 0.7) {
      this.considerDiplomacy(country);
    } else if (Math.random() < 0.35) {
      this.considerInternal(country);
    }
  }

  // ---------- Aggression ----------

  considerAggression(country) {
    const targets = this.findPotentialTargets(country);
    if (targets.length === 0) return;

    // Score targets by opportunity
    const scored = targets.map(t => {
      const relation = country.getRelation(t.id);
      const powerRatio = country.power / (t.power + 1);
      const aggression = country.aggressionToward(relation, t.power);

      let score = aggression * 40;
      score += (powerRatio - 0.7) * 30;          // prefer weaker
      score -= Math.max(0, relation) * 0.3;      // dislike friends
      score += (100 - t.stability) * 0.15;       // unstable looks vulnerable

      // Character specific
      if (country.characterId === 'AGGRESSIVE') score += 15;
      if (country.characterId === 'OPPORTUNIST' && powerRatio > 1.3) score += 20;
      if (country.characterId === 'IDEOLOGUE' && relation < -20) score += 12;

      return { target: t, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    if (best && best.score > 28 && Math.random() < 0.45) {
      // Decide to attack
      const strength = 0.3 + country.character.aggression * 0.25;
      this.combat.sendArmy(country.id, best.target.id, strength);
      country.expression = 'angry';
    }
  }

  findPotentialTargets(country) {
    return this.world.getAllCountries().filter(t => {
      if (t.id === country.id) return false;
      if (country.isAlliedWith(t.id)) return false;
      if (country.isAtWarWith(t.id)) return false;
      // Prefer somewhat nearby (simple distance check)
      const dx = country.x - t.x;
      const dy = country.y - t.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < 0.45; // not across the whole world for now
    });
  }

  // ---------- Diplomacy ----------

  considerDiplomacy(country) {
    const candidates = this.world.getAllCountries().filter(t => {
      if (t.id === country.id) return false;
      if (country.isAlliedWith(t.id)) return false;
      if (country.isAtWarWith(t.id)) return false;
      return true;
    });

    if (candidates.length === 0) return;

    // Prefer high relation + compatible character
    const scored = candidates.map(t => {
      let score = country.getRelation(t.id);
      score += this.characterCompatibility(country.characterId, t.characterId) * 20;

      if (country.characterId === 'DIPLOMATIC') score += 15;
      if (country.characterId === 'ISOLATIONIST') score -= 25;

      return { target: t, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    if (best && best.score > 15 && Math.random() < country.character.diplomacy * 0.5) {
      // Propose alliance
      const willingness = best.target.diplomaticWillingness(best.target.getRelation(country.id));
      if (Math.random() < willingness + 0.15) {
        this.world.formAlliance(country.id, best.target.id);
        country.expression = 'happy';
        best.target.expression = 'happy';
      } else {
        // Rejection hurts a bit
        country.modifyRelation(best.target.id, -6);
      }
    }
  }

  characterCompatibility(a, b) {
    if (a === b) return a === 'AGGRESSIVE' ? -0.3 : 0.6;
    const good = [
      ['DIPLOMATIC', 'ISOLATIONIST'],
      ['DIPLOMATIC', 'OPPORTUNIST'],
      ['OPPORTUNIST', 'AGGRESSIVE']
    ];
    for (const [x, y] of good) {
      if ((a === x && b === y) || (a === y && b === x)) return 0.4;
    }
    return 0;
  }

  // ---------- War Management ----------

  manageWars(country) {
    for (const enemyId of country.atWarWith) {
      const enemy = this.world.getCountry(enemyId);
      if (!enemy) continue;

      const powerRatio = country.power / (enemy.power + 1);

      // If winning and aggressive → keep pressure
      if (powerRatio > 1.2 && country.character.aggression > 0.5) {
        if (Math.random() < 0.4) {
          this.combat.sendArmy(country.id, enemyId, 0.25 + Math.random() * 0.2);
        }
      }

      // If losing badly → consider peace (especially diplomatic types)
      if (powerRatio < 0.65 && country.stability < 55) {
        if (Math.random() < (0.3 + country.character.diplomacy * 0.4)) {
          this.tryPeace(country, enemy);
        }
      }
    }
  }

  tryPeace(country, enemy) {
    // Simple white peace for now
    country.atWarWith.delete(enemy.id);
    enemy.atWarWith.delete(country.id);
    country.modifyRelation(enemy.id, 20);
    enemy.modifyRelation(country.id, 15);
    country.expression = 'worried';
    enemy.expression = 'smug';
  }

  // ---------- Internal ----------

  handleInternalCrisis(country) {
    // Spend gold to stabilize
    if (country.gold > 40) {
      country.gold -= 25;
      country.stability = Math.min(70, country.stability + 8);
    }

    // Isolationists and diplomats try harder to recover
    if (country.characterId === 'ISOLATIONIST' || country.characterId === 'DIPLOMATIC') {
      country.stability = Math.min(75, country.stability + 3);
    }
  }

  considerInternal(country) {
    // Light investment
    if (country.gold > 60 && Math.random() < 0.4) {
      country.gold -= 20;
      if (Math.random() < 0.5) {
        country.economy = Math.min(100, country.economy + 1.5);
      } else {
        country.military = Math.min(100, country.military + 1.2);
      }
    }
  }
}