/**
 * Country-level administrative territories.
 * Source GeoJSON is immutable; ownership, garrisons and economy live in game state.
 */
const COUNTRY_ISO = {
  canada:'CAN',usa:'USA',mexico:'MEX',brazil:'BRA',uk:'GBR',france:'FRA',germany:'DEU',
  poland:'POL',russia:'RUS',turkey:'TUR',egypt:'EGY',israel:'ISR',saudi:'SAU',iran:'IRN',
  india:'IND',china:'CHN',south_korea:'KOR',japan:'JPN',indonesia:'IDN',australia:'AUS'
};
const LEVELS = new Set(['ADM1','ADM2']);
const keyOf = (iso, level, feature) => {
  const p = feature.properties || {};
  return `${iso}:${level}:${p.shapeID || p.boundaryID || p.id || p.shapeName || feature.id || 'feature'}`;
};

export class AdminTerritorySystem {
  constructor(world, options = {}) {
    this.world = world;
    this.basePath = options.basePath || './data/admin-boundaries';
    this.fetcher = options.fetcher || globalThis.fetch?.bind(globalThis);
    this.layers = new Map();
    this.loading = new Map();
    this.states = new Map();
    this.activeLevel = new Map();
    this.activeLayerKey = new Map();
    this.manifest = null;
  }

  getIso(countryId) { return COUNTRY_ISO[countryId] || (/^[A-Z]{3}$/.test(countryId) ? countryId : null); }
  layerKey(iso, level, parentId = null) { return `${iso}:${level}${parentId ? ':' + parentId : ''}`; }

  async loadLevel(countryId, level = 'ADM1', parentId = null) {
    const iso = this.getIso(countryId);
    if (!iso || !LEVELS.has(level)) throw new Error('Geçersiz ülke veya idari seviye');
    const key = this.layerKey(iso, level, parentId);
    if (this.layers.has(key)) {
      this.activeLevel.set(countryId, level);
      this.activeLayerKey.set(countryId, key);
      return this.layers.get(key);
    }
    if (this.loading.has(key)) return this.loading.get(key);
    if (!this.fetcher) throw new Error('Tarayıcı fetch desteği bulunamadı');

    const task = (async () => {
      const response = await this.fetcher(`${this.basePath}/${level}/${iso}.geojson`);
      if (!response.ok) throw new Error(`${iso} ${level} verisi bulunamadı (HTTP ${response.status}). Önce indirme aracını çalıştırın.`);
      const collection = await response.json();
      if (!collection || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
        throw new Error(`${iso} ${level}: geçersiz GeoJSON FeatureCollection`);
      }
      const parentLayer = level === 'ADM2' && parentId ? this.getLayer(countryId, 'ADM1') : null;
      const parentFeature = parentLayer?.features.find(f => f.gameId === parentId);
      const parentShapeId = parentFeature?.properties?.shapeID;
      let sourceFeatures = collection.features;
      if (parentShapeId) {
        const scoped = sourceFeatures.filter(f => {
          const parent = f.properties?.shapeParent;
          return parent === parentShapeId || parent === parentId;
        });
        if (scoped.length) sourceFeatures = scoped;
      }
      const inheritedOwner = parentFeature ? this.getFeatureState(parentFeature)?.ownerId : null;
      const features = sourceFeatures.map((feature) => {
        const id = keyOf(iso, level, feature);
        if (!this.states.has(id)) {
          const country = this.world.getCountry(countryId);
          this.states.set(id, {
            id, countryId, level, ownerId: inheritedOwner || countryId,
            garrison: Math.max(4, Math.round((country?.military || 20) / 5)),
            economy: Math.max(10, Math.round((country?.economy || 40) / 2)),
            stability: country?.stability || 65,
            occupied: false
          });
        }
        return { ...feature, gameId: id, countryId, level };
      });
      const layer = { iso, countryId, level, parentId, features, loadedAt: Date.now() };
      this.layers.set(key, layer);
      this.activeLevel.set(countryId, level);
      this.activeLayerKey.set(countryId, key);
      return layer;
    })().finally(() => this.loading.delete(key));
    this.loading.set(key, task);
    return task;
  }

  getLayer(countryId, level = this.activeLevel.get(countryId) || 'ADM1') {
    const iso = this.getIso(countryId);
    if (!iso) return null;
    const activeKey = this.activeLayerKey.get(countryId);
    return (activeKey && this.layers.get(activeKey)?.level === level)
      ? this.layers.get(activeKey)
      : this.layers.get(this.layerKey(iso, level)) || null;
  }

  getFeatureState(feature) { return this.states.get(feature.gameId) || null; }

  getLoadedFeatures(level = null) {
    return [...this.layers.values()]
      .filter(layer => !level || layer.level === level)
      .flatMap(layer => layer.features);
  }

  getVisibleFeatures() {
    const result = [];
    for (const [countryId, level] of this.activeLevel) {
      const key = this.activeLayerKey.get(countryId);
      const layer = key ? this.layers.get(key) : this.getLayer(countryId, level);
      if (layer) result.push(...layer.features);
    }
    return result;
  }

  buildAdjacency(features) {
    const edges = new Map();
    const neighbors = new Map(features.map(f => [f.gameId, new Set()]));
    const addRing = (feature, ring) => {
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1], b = ring[i];
        const point = p => `${Number(p[0]).toFixed(5)},${Number(p[1]).toFixed(5)}`;
        const pair = [point(a), point(b)].sort().join('|');
        if (edges.has(pair)) {
          const other = edges.get(pair);
          if (other !== feature.gameId) {
            neighbors.get(feature.gameId)?.add(other);
            neighbors.get(other)?.add(feature.gameId);
          }
        } else edges.set(pair, feature.gameId);
      }
    };
    for (const feature of features) {
      const g = feature.geometry;
      if (!g) continue;
      const polygons = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      for (const polygon of polygons) for (const ring of polygon) addRing(feature, ring);
    }
    for (const feature of features) feature.neighborIds = [...(neighbors.get(feature.gameId) || [])];
    return neighbors;
  }

  attack(attackerId, sourceFeature, targetFeature) {
    const source = this.getFeatureState(sourceFeature);
    const target = this.getFeatureState(targetFeature);
    const attacker = this.world.getCountry(attackerId);
    if (!attacker || !source || !target || source.ownerId !== attackerId) return { ok:false, reason:'invalid-source' };
    if (!(sourceFeature.neighborIds || []).includes(targetFeature.gameId)) return { ok:false, reason:'not-adjacent' };
    if (target.ownerId === attackerId) return { ok:false, reason:'already-owned' };
    if (source.garrison < 5) return { ok:false, reason:'insufficient-garrison' };
    this.world.declareWar(attackerId, target.ownerId);
    const attackPower = source.garrison * (0.85 + attacker.tech * 0.035);
    const defender = this.world.getCountry(target.ownerId);
    const defensePower = target.garrison * (0.9 + target.stability / 500) * (0.9 + (defender?.tech || 0) * 0.035);
    const won = attackPower / Math.max(1, defensePower) > 1.08;
    source.garrison = Math.max(2, Math.floor(source.garrison * (won ? 0.62 : 0.72)));
    if (!won) {
      target.garrison = Math.max(2, Math.floor(target.garrison * 0.8));
      target.stability = Math.max(10, target.stability - 5);
      return { ok:true, captured:false };
    }
    target.ownerId = attackerId;
    target.occupied = true;
    target.garrison = Math.max(2, Math.floor(source.garrison * 0.35));
    target.stability = Math.max(15, target.stability - 18);
    attacker.gold += 8;
    return { ok:true, captured:true };
  }

  recruit(ownerId, feature, amount = 5) {
    const state = this.getFeatureState(feature);
    const owner = this.world.getCountry(ownerId);
    const cost = amount * 2;
    if (!state || !owner || state.ownerId !== ownerId || owner.gold < cost || owner.manpower < amount) return false;
    owner.gold -= cost;
    owner.manpower -= amount;
    state.garrison = Math.min(100, state.garrison + amount);
    return true;
  }

  dailyTick() {
    const visibleIds = new Set(this.getVisibleFeatures().map(feature => feature.gameId));
    for (const state of this.states.values()) {
      if (!visibleIds.has(state.id)) continue;
      const controller = this.world.getCountry(state.ownerId);
      if (!controller) continue;
      controller.gold += state.economy * 0.008;
      state.garrison = Math.min(100, state.garrison + 0.04);
      if (state.occupied) state.stability = Math.min(100, state.stability + 0.08);
    }
  }
}
