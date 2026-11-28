import { TURKEY_REGIONS, TURKEY_CITIES, TURKEY_EXTERNAL_ENTRY } from '../data/turkey-regions.js';

export class ProvinceSystem {
  constructor(world) {
    this.world = world;
    this.regions = new Map();
    this.cities = new Map();
    this.initialize();
  }

  initialize() {
    for (const data of TURKEY_REGIONS) {
      this.regions.set(data.id, {
        ...data, countryId:'turkey', ownerId:'turkey',
        troops: data.id === 'central-anatolia' ? 18 : 12,
        stability: 75, economy: data.id === 'marmara' ? 82 : 55,
        occupied:false
      });
    }
    for (const data of TURKEY_CITIES) {
      this.cities.set(data.id, { ...data, ownerId:'turkey', garrison: data.capital ? 14 : 8 });
    }
  }

  getRegion(id) { return this.regions.get(id) || null; }
  getCity(id) { return this.cities.get(id) || null; }
  getRegions() { return [...this.regions.values()]; }
  getCities() { return [...this.cities.values()]; }
  getControlledRegions(ownerId) { return this.getRegions().filter(r => r.ownerId === ownerId); }
  areAdjacent(a, b) { return Boolean(this.getRegion(a)?.neighbors.includes(b)); }

  canEnterFromCountry(attackerId, regionId) {
    return (TURKEY_EXTERNAL_ENTRY[attackerId] || []).includes(regionId);
  }

  attackRegion(attackerId, sourceRegionId, targetRegionId) {
    const attacker = this.world.getCountry(attackerId);
    const source = this.getRegion(sourceRegionId);
    const target = this.getRegion(targetRegionId);
    if (!attacker || !source || !target || source.ownerId !== attackerId) return { ok:false, reason:'invalid-source' };
    if (!this.areAdjacent(sourceRegionId, targetRegionId)) return { ok:false, reason:'not-adjacent' };
    if (target.ownerId === attackerId) return { ok:false, reason:'already-owned' };
    if (source.troops < 8) return { ok:false, reason:'insufficient-troops' };
    this.world.declareWar(attackerId, target.ownerId);
    return this.resolveRegionBattle(attackerId, source, target, source.troops);
  }

  attackFromCountry(attackerId, targetRegionId) {
    const attacker = this.world.getCountry(attackerId);
    const target = this.getRegion(targetRegionId);
    if (!attacker || !target || !this.canEnterFromCountry(attackerId, targetRegionId)) {
      return { ok:false, reason:'no-border-access' };
    }
    if (target.ownerId === attackerId) return { ok:false, reason:'already-owned' };
    const committed = Math.floor(attacker.military * 0.3);
    if (committed < 8) return { ok:false, reason:'insufficient-troops' };
    attacker.military -= committed;
    this.world.declareWar(attackerId, 'turkey');
    return this.resolveRegionBattle(attackerId, null, target, committed);
  }

  resolveRegionBattle(attackerId, source, target, committed) {
    const defender = this.world.getCountry(target.ownerId);
    const attacker = this.world.getCountry(attackerId);
    const attackPower = committed * (0.85 + attacker.tech * 0.035) * (0.9 + attacker.character.aggression * 0.2);
    const defensePower = target.troops *
      (0.85 + (defender?.tech || 0) * 0.035) * (0.9 + target.stability / 500);
    const ratio = attackPower / Math.max(1, defensePower);
    const won = ratio > 1.08;
    if (source) source.troops = Math.max(3, source.troops - Math.ceil(committed * 0.35));
    if (!won) {
      target.troops = Math.max(4, Math.floor(target.troops * 0.78));
      target.stability = Math.max(10, target.stability - 5);
      return { ok:true, captured:false, ratio };
    }
    target.ownerId = attackerId;
    target.occupied = true;
    target.troops = Math.max(4, Math.floor(committed * 0.25));
    target.stability = Math.max(20, target.stability - 18);
    attacker.gold += 12;
    return { ok:true, captured:true, ratio, region:target.name };
  }

  attackCity(attackerId, cityId, sourceRegionId) {
    const attacker = this.world.getCountry(attackerId);
    const city = this.getCity(cityId);
    const source = this.getRegion(sourceRegionId);
    if (!attacker || !city || !source || source.ownerId !== attackerId) return { ok:false, reason:'invalid-source' };
    const targetRegion = this.getRegion(city.regionId);
    if (!targetRegion || city.ownerId === attackerId || (sourceRegionId !== targetRegion.id && !this.areAdjacent(sourceRegionId, targetRegion.id))) {
      return { ok:false, reason:'city-not-reachable' };
    }
    if (source.troops < 5) return { ok:false, reason:'insufficient-troops' };
    this.world.declareWar(attackerId, city.ownerId);
    const attackPower = source.troops * (0.9 + attacker.tech * 0.03);
    const defensePower = city.garrison * (city.capital ? 1.5 : 1.1);
    if (attackPower <= defensePower) {
      source.troops = Math.max(3, source.troops - 3);
      city.garrison = Math.max(3, city.garrison - 2);
      return { ok:true, captured:false, city:city.name };
    }
    city.ownerId = attackerId;
    city.garrison = Math.max(3, Math.floor(source.troops * 0.2));
    source.troops = Math.max(3, Math.floor(source.troops * 0.65));
    if (city.capital) {
      const country = this.world.getCountry('turkey');
      if (country) country.stability = Math.max(0, country.stability - 25);
    }
    return { ok:true, captured:true, city:city.name, capital:city.capital };
  }

  recruit(ownerId, regionId, amount = 5) {
    const owner = this.world.getCountry(ownerId);
    const region = this.getRegion(regionId);
    const cost = amount * 2;
    if (!owner || !region || region.ownerId !== ownerId || owner.gold < cost || owner.manpower < amount) return false;
    owner.gold -= cost;
    owner.manpower -= amount;
    region.troops = Math.min(80, region.troops + amount);
    return true;
  }

  tick() {
    for (const region of this.regions.values()) {
      if (region.troops < 80) region.troops += 0.08;
    }
  }

  getCapitalController() { return this.getCity('ankara')?.ownerId || null; }
}
