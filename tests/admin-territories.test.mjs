import test from 'node:test';
import assert from 'node:assert/strict';
import { AdminTerritorySystem } from '../js/core/AdminTerritorySystem.js';

const feature = (id, coords, parent = null) => ({
  type:'Feature',
  properties:{ shapeID:id, shapeName:id, ...(parent ? { shapeParent:parent } : {}) },
  geometry:{ type:'Polygon', coordinates:[coords] }
});

function makeWorld() {
  const countries = new Map([
    ['turkey',{id:'turkey',military:100,economy:60,stability:70,tech:5,gold:100,manpower:100}],
    ['iran',{id:'iran',military:30,economy:30,stability:60,tech:1,gold:0,manpower:10}]
  ]);
  return {
    countries,
    getCountry(id){ return countries.get(id) || null; },
    declareWar(){ return true; }
  };
}

test('loads one country layer and keeps source geometry separate from game ownership', async () => {
  const world=makeWorld();
  const geojson={type:'FeatureCollection',features:[
    feature('west',[[0,0],[1,0],[1,1],[0,1],[0,0]]),
    feature('east',[[1,0],[2,0],[2,1],[1,1],[1,0]])
  ]};
  const system=new AdminTerritorySystem(world,{fetcher:async()=>({ok:true,json:async()=>geojson})});
  const layer=await system.loadLevel('turkey','ADM1');
  system.buildAdjacency(system.getLoadedFeatures('ADM1'));
  assert.equal(layer.features.length,2);
  assert.equal(layer.features[0].neighborIds.includes(layer.features[1].gameId),true);
  const state=system.getFeatureState(layer.features[0]);
  state.ownerId='iran';
  assert.equal(layer.features[0].properties.shapeName,'west');
  assert.equal(layer.features[0].properties.ownerId,undefined);
});

test('captures an adjacent administrative territory without mutating GeoJSON', async () => {
  const world=makeWorld();
  const geojson={type:'FeatureCollection',features:[
    feature('west',[[0,0],[1,0],[1,1],[0,1],[0,0]]),
    feature('east',[[1,0],[2,0],[2,1],[1,1],[1,0]])
  ]};
  const system=new AdminTerritorySystem(world,{fetcher:async()=>({ok:true,json:async()=>geojson})});
  const layer=await system.loadLevel('turkey','ADM1');
  system.buildAdjacency(layer.features);
  const [source,target]=layer.features;
  system.getFeatureState(source).garrison=40;
  system.getFeatureState(target).ownerId='iran';
  system.getFeatureState(target).garrison=3;
  const result=system.attack('turkey',source,target);
  assert.equal(result.captured,true);
  assert.equal(system.getFeatureState(target).ownerId,'turkey');
  assert.equal(target.properties.ownerId,undefined);
});

test('rejects unsupported countries and malformed GeoJSON', async () => {
  const system=new AdminTerritorySystem(makeWorld(),{fetcher:async()=>({ok:true,json:async()=>({type:'Feature'})})});
  await assert.rejects(system.loadLevel('unknown','ADM1'));
  await assert.rejects(system.loadLevel('turkey','ADM2'));
});
