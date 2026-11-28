/**
 * Turkey's seven geographic regions as strategic territories.
 * Coordinates are approximate regional/city markers on the existing world map,
 * not administrative province boundary polygons.
 */
export const TURKEY_REGIONS = [
  { id:'marmara', name:'Marmara', x:0.579, y:0.267, neighbors:['aegean','central-anatolia','black-sea'], cities:['istanbul'] },
  { id:'aegean', name:'Ege', x:0.573, y:0.294, neighbors:['marmara','central-anatolia','mediterranean'], cities:['izmir'] },
  { id:'mediterranean', name:'Akdeniz', x:0.601, y:0.318, neighbors:['aegean','central-anatolia','southeastern-anatolia'], cities:['antalya'] },
  { id:'central-anatolia', name:'İç Anadolu', x:0.606, y:0.286, neighbors:['marmara','aegean','mediterranean','black-sea','eastern-anatolia','southeastern-anatolia'], cities:['ankara'] },
  { id:'black-sea', name:'Karadeniz', x:0.612, y:0.261, neighbors:['marmara','central-anatolia','eastern-anatolia'], cities:['samsun'] },
  { id:'eastern-anatolia', name:'Doğu Anadolu', x:0.642, y:0.291, neighbors:['black-sea','central-anatolia','southeastern-anatolia'], cities:['erzurum'] },
  { id:'southeastern-anatolia', name:'Güneydoğu Anadolu', x:0.633, y:0.315, neighbors:['eastern-anatolia','central-anatolia','mediterranean'], cities:['diyarbakir'] }
];

export const TURKEY_CITIES = [
  { id:'istanbul', name:'İstanbul', regionId:'marmara', x:0.574, y:0.268, strategicValue:18, capital:false },
  { id:'izmir', name:'İzmir', regionId:'aegean', x:0.568, y:0.297, strategicValue:12, capital:false },
  { id:'antalya', name:'Antalya', regionId:'mediterranean', x:0.600, y:0.319, strategicValue:10, capital:false },
  { id:'ankara', name:'Ankara', regionId:'central-anatolia', x:0.606, y:0.286, strategicValue:30, capital:true },
  { id:'samsun', name:'Samsun', regionId:'black-sea', x:0.614, y:0.264, strategicValue:10, capital:false },
  { id:'erzurum', name:'Erzurum', regionId:'eastern-anatolia', x:0.644, y:0.291, strategicValue:9, capital:false },
  { id:'diyarbakir', name:'Diyarbakır', regionId:'southeastern-anatolia', x:0.633, y:0.315, strategicValue:11, capital:false }
];

/** Iran is the only currently playable external land neighbor of Turkey. */
export const TURKEY_EXTERNAL_ENTRY = {
  iran: ['eastern-anatolia','southeastern-anatolia']
};
