/**
 * Countryballs: Sovereign — Country Data
 * Positions aligned to the original stylized-realistic world map.
 */

export const CHARACTERS = {
  AGGRESSIVE: {
    id: 'aggressive', name: 'Agresif',
    description: 'Güç gösterir, zayıflığa tahammül etmez.',
    color: '#ef5b5b', aggression: 0.85, diplomacy: 0.25, riskTolerance: 0.8, expansionDesire: 0.9
  },
  DIPLOMATIC: {
    id: 'diplomatic', name: 'Diplomatik',
    description: 'İttifak ve pazarlık yoluyla kazanmayı tercih eder.',
    color: '#5b8def', aggression: 0.2, diplomacy: 0.9, riskTolerance: 0.3, expansionDesire: 0.4
  },
  OPPORTUNIST: {
    id: 'opportunist', name: 'Fırsatçı',
    description: 'Her durumu kendi lehine çevirir.',
    color: '#f0b429', aggression: 0.55, diplomacy: 0.6, riskTolerance: 0.7, expansionDesire: 0.75
  },
  IDEOLOGUE: {
    id: 'ideologue', name: 'İdeolojik',
    description: 'İlkelerine sadıktır.',
    color: '#a78bfa', aggression: 0.5, diplomacy: 0.4, riskTolerance: 0.6, expansionDesire: 0.55
  },
  ISOLATIONIST: {
    id: 'isolationist', name: 'İzolasyonist',
    description: 'Kendi işine bakar.',
    color: '#3ecf8e', aggression: 0.15, diplomacy: 0.35, riskTolerance: 0.2, expansionDesire: 0.2
  }
};

export const GOVERNMENTS = {
  DEMOCRACY: { id: 'democracy', name: 'Demokrasi', stabilityMod: 0.1, techMod: 0.15 },
  REPUBLIC: { id: 'republic', name: 'Cumhuriyet', stabilityMod: 0.05, techMod: 0.1 },
  MONARCHY: { id: 'monarchy', name: 'Monarşi', stabilityMod: 0.0, techMod: -0.05 },
  AUTHORITARIAN: { id: 'authoritarian', name: 'Otoriter', stabilityMod: -0.05, techMod: 0.05 },
  TOTALITARIAN: { id: 'totalitarian', name: 'Totaliter', stabilityMod: -0.15, techMod: 0.1 }
};

/** x,y normalized to map; tuned for geographic readability */
export const COUNTRIES = [
  { id: 'canada', name: 'Kanada', short: 'CAN', flagColors: ['#ff0000', '#ffffff'], character: 'DIPLOMATIC', government: 'DEMOCRACY', region: 'north_america', military: 45, economy: 72, stability: 92, tech: 6, manpower: 30, nuclear: false, color: '#ff0000', x: 0.2056, y: 0.1889 },
  { id: 'usa', name: 'Amerika', short: 'USA', flagColors: ['#3c3b6e', '#ffffff', '#b22234'], character: 'OPPORTUNIST', government: 'DEMOCRACY', region: 'north_america', military: 92, economy: 95, stability: 78, tech: 9, manpower: 140, nuclear: true, color: '#3c3b6e', x: 0.2278, y: 0.2833 },
  { id: 'mexico', name: 'Meksika', short: 'MEX', flagColors: ['#006847', '#ffffff', '#ce1126'], character: 'OPPORTUNIST', government: 'REPUBLIC', region: 'north_america', military: 42, economy: 55, stability: 55, tech: 3, manpower: 55, nuclear: false, color: '#006847', x: 0.2167, y: 0.3722 },
  { id: 'brazil', name: 'Brezilya', short: 'BRA', flagColors: ['#009c3b', '#ffdf00', '#002776'], character: 'DIPLOMATIC', government: 'DEMOCRACY', region: 'south_america', military: 55, economy: 60, stability: 58, tech: 4, manpower: 90, nuclear: false, color: '#009c3b', x: 0.3556, y: 0.5556 },
  { id: 'uk', name: 'Birleşik Krallık', short: 'UK', flagColors: ['#012169', '#ffffff', '#c8102e'], character: 'OPPORTUNIST', government: 'MONARCHY', region: 'europe', military: 70, economy: 73, stability: 80, tech: 7, manpower: 42, nuclear: true, color: '#012169', x: 0.4917, y: 0.1944 },
  { id: 'france', name: 'Fransa', short: 'FRA', flagColors: ['#002395', '#ffffff', '#ed2939'], character: 'DIPLOMATIC', government: 'REPUBLIC', region: 'europe', military: 72, economy: 75, stability: 72, tech: 7, manpower: 48, nuclear: true, color: '#002395', x: 0.5056, y: 0.2444 },
  { id: 'germany', name: 'Almanya', short: 'GER', flagColors: ['#000000', '#dd0000', '#ffce00'], character: 'DIPLOMATIC', government: 'DEMOCRACY', region: 'europe', military: 68, economy: 82, stability: 85, tech: 8, manpower: 55, nuclear: false, color: '#dd0000', x: 0.5278, y: 0.2167 },
  { id: 'poland', name: 'Polonya', short: 'POL', flagColors: ['#ffffff', '#dc143c'], character: 'AGGRESSIVE', government: 'DEMOCRACY', region: 'europe', military: 55, economy: 58, stability: 70, tech: 5, manpower: 35, nuclear: false, color: '#dc143c', x: 0.5528, y: 0.2111 },
  { id: 'russia', name: 'Rusya', short: 'RUS', flagColors: ['#ffffff', '#0039a6', '#d52b1e'], character: 'AGGRESSIVE', government: 'AUTHORITARIAN', region: 'europe_asia', military: 85, economy: 55, stability: 65, tech: 7, manpower: 110, nuclear: true, color: '#0039a6', x: 0.7500, y: 0.1667 },
  { id: 'turkey', name: 'Türkiye', short: 'TUR', flagColors: ['#e30a17', '#ffffff'], character: 'OPPORTUNIST', government: 'REPUBLIC', region: 'europe_asia', military: 70, economy: 58, stability: 62, tech: 5, manpower: 65, nuclear: false, color: '#e30a17', x: 0.5972, y: 0.2833 },
  { id: 'egypt', name: 'Mısır', short: 'EGY', flagColors: ['#ce1126', '#ffffff', '#000000'], character: 'OPPORTUNIST', government: 'AUTHORITARIAN', region: 'africa', military: 52, economy: 40, stability: 58, tech: 3, manpower: 60, nuclear: false, color: '#ce1126', x: 0.5833, y: 0.3500 },
  { id: 'israel', name: 'İsrail', short: 'ISR', flagColors: ['#0038b8', '#ffffff'], character: 'AGGRESSIVE', government: 'DEMOCRACY', region: 'middle_east', military: 78, economy: 68, stability: 70, tech: 8, manpower: 18, nuclear: true, color: '#0038b8', x: 0.5972, y: 0.3278 },
  { id: 'saudi', name: 'Suudi Arabistan', short: 'SAU', flagColors: ['#006c35', '#ffffff'], character: 'ISOLATIONIST', government: 'MONARCHY', region: 'middle_east', military: 58, economy: 65, stability: 75, tech: 4, manpower: 30, nuclear: false, color: '#006c35', x: 0.6250, y: 0.3667 },
  { id: 'iran', name: 'İran', short: 'IRN', flagColors: ['#239f40', '#ffffff', '#da0000'], character: 'IDEOLOGUE', government: 'AUTHORITARIAN', region: 'middle_east', military: 60, economy: 42, stability: 55, tech: 4, manpower: 55, nuclear: false, color: '#239f40', x: 0.6472, y: 0.3222 },
  { id: 'india', name: 'Hindistan', short: 'IND', flagColors: ['#ff9933', '#ffffff', '#138808'], character: 'IDEOLOGUE', government: 'DEMOCRACY', region: 'asia', military: 75, economy: 70, stability: 68, tech: 6, manpower: 280, nuclear: true, color: '#ff9933', x: 0.7167, y: 0.3778 },
  { id: 'china', name: 'Çin', short: 'CHN', flagColors: ['#de2910', '#ffde00'], character: 'IDEOLOGUE', government: 'AUTHORITARIAN', region: 'asia', military: 88, economy: 90, stability: 82, tech: 8, manpower: 320, nuclear: true, color: '#de2910', x: 0.7917, y: 0.3056 },
  { id: 'south_korea', name: 'Güney Kore', short: 'KOR', flagColors: ['#ffffff', '#cd2e3a', '#0047a0'], character: 'DIPLOMATIC', government: 'DEMOCRACY', region: 'asia', military: 65, economy: 72, stability: 84, tech: 8, manpower: 35, nuclear: false, color: '#0047a0', x: 0.8528, y: 0.3000 },
  { id: 'japan', name: 'Japonya', short: 'JPN', flagColors: ['#ffffff', '#bc002d'], character: 'ISOLATIONIST', government: 'DEMOCRACY', region: 'asia', military: 62, economy: 78, stability: 88, tech: 9, manpower: 50, nuclear: false, color: '#bc002d', x: 0.8833, y: 0.2944 },
  { id: 'indonesia', name: 'Endonezya', short: 'IDN', flagColors: ['#ff0000', '#ffffff'], character: 'ISOLATIONIST', government: 'REPUBLIC', region: 'asia', military: 48, economy: 55, stability: 65, tech: 3, manpower: 120, nuclear: false, color: '#ff0000', x: 0.8250, y: 0.5111 },
  { id: 'australia', name: 'Avustralya', short: 'AUS', flagColors: ['#00008b', '#ffffff', '#ff0000'], character: 'DIPLOMATIC', government: 'DEMOCRACY', region: 'oceania', military: 48, economy: 70, stability: 90, tech: 6, manpower: 25, nuclear: false, color: '#00008b', x: 0.8722, y: 0.6389 }
];

export function getCharacter(id) {
  return CHARACTERS[id] || CHARACTERS.OPPORTUNIST;
}

export function getGovernment(id) {
  return GOVERNMENTS[id] || GOVERNMENTS.REPUBLIC;
}