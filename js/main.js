import { World } from './core/World.js';
import { Renderer } from './render/Renderer.js';
import { COUNTRIES, CHARACTERS } from './data/countries.js';
import { UPGRADES } from './core/Economy.js';
import { audio } from './core/Audio.js';

const screens = {
  loading: document.getElementById('loading-screen'),
  menu: document.getElementById('main-menu'),
  select: document.getElementById('country-select'),
  game: document.getElementById('game-screen')
};

let world = null;
let renderer = null;
let selectedCountryId = null;
let animationId = null;
let lastTime = 0;
let victoryShown = false;

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

async function boot() {
  const progress = document.getElementById('loading-progress');
  const text = document.getElementById('loading-text');
  const steps = [
    { p: 20, t: 'Ülke verileri...' },
    { p: 40, t: 'Harita ve konumlandırma...' },
    { p: 60, t: 'Savaş & ekonomi sistemleri...' },
    { p: 80, t: 'Yapay zeka kişilikleri...' },
    { p: 100, t: 'Hazır.' }
  ];
  for (const step of steps) {
    progress.style.width = step.p + '%';
    text.textContent = step.t;
    await wait(140 + Math.random() * 80);
  }
  await wait(200);
  showScreen('menu');
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

document.getElementById('btn-new-game').addEventListener('click', () => {
  audio.resume();
  audio.ui();
  populateCountrySelect();
  showScreen('select');
});

document.getElementById('btn-back-menu').addEventListener('click', () => {
  audio.ui();
  showScreen('menu');
});

function populateCountrySelect() {
  const grid = document.getElementById('country-grid');
  grid.innerHTML = '';
  selectedCountryId = null;
  document.getElementById('btn-start-game').disabled = true;

  for (const data of COUNTRIES) {
    const char = CHARACTERS[data.character];
    const card = document.createElement('div');
    card.className = 'country-card';
    card.dataset.id = data.id;
    card.innerHTML = `
      <div class="ball" style="background: linear-gradient(135deg, ${data.flagColors[0]}, ${data.flagColors[1] || data.flagColors[0]})"></div>
      <div class="name">${data.name}</div>
      <div class="character" style="color:${char.color}">${char.name}</div>
    `;
    card.addEventListener('click', () => {
      audio.ui();
      document.querySelectorAll('.country-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedCountryId = data.id;
      document.getElementById('btn-start-game').disabled = false;
    });
    grid.appendChild(card);
  }
}

document.getElementById('btn-start-game').addEventListener('click', () => {
  if (!selectedCountryId) return;
  audio.ui();
  startGame(selectedCountryId);
});

function startGame(playerId) {
  world = new World();
  world.setPlayer(playerId);
  victoryShown = false;

  const canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);
  // Force resize after screen is visible
  setTimeout(() => renderer.resize(), 50);

  setupGameUI();
  showScreen('game');

  lastTime = performance.now();
  if (animationId) cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(gameLoop);
}

function setupGameUI() {
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.onclick = () => {
      audio.ui();
      const speed = parseInt(btn.dataset.speed);
      world.setSpeed(speed);
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  const canvas = document.getElementById('game-canvas');

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const hit = renderer.hitTest(e.clientX - rect.left, e.clientY - rect.top, world);
    for (const c of world.getAllCountries()) c.hover = false;
    if (hit) hit.hover = true;
  };

  canvas.onclick = (e) => {
    audio.resume();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const provinceHit = renderer.hitTestProvince(x, y, world);
    const hit = provinceHit ? null : renderer.hitTest(x, y, world);
    for (const c of world.getAllCountries()) c.selected = false;
    if (provinceHit) {
      openProvincePanel(provinceHit);
    } else if (hit) {
      hit.selected = true;
      openSidePanel(hit);
    } else {
      closeSidePanel();
    }
  };

  document.getElementById('panel-close').onclick = () => {
    audio.ui();
    closeSidePanel();
  };
}

function openSidePanel(country) {
  const panel = document.getElementById('side-panel');
  panel.classList.remove('hidden');

  document.getElementById('panel-name').textContent = country.name;
  document.getElementById('panel-character').textContent = country.character.name;
  document.getElementById('panel-character').style.color = country.character.color;

  const ball = document.getElementById('panel-ball');
  ball.style.background = `linear-gradient(135deg, ${country.flagColors[0]}, ${country.flagColors[1] || country.flagColors[0]})`;

  document.getElementById('stat-military').style.width = Math.min(100, country.military) + '%';
  document.getElementById('stat-economy').style.width = Math.min(100, country.economy) + '%';
  document.getElementById('stat-stability').style.width = Math.min(100, country.stability) + '%';
  document.getElementById('stat-tech').style.width = Math.min(100, country.tech * 8) + '%';

  const player = world.getPlayer();
  const isPlayer = player && country.controllerId === player.id;
  const isEnemy = player && player.isAtWarWith(country.id);
  const isAlly = player && player.isAlliedWith(country.id);

  const diplo = document.getElementById('diplomacy-actions');
  const mili = document.getElementById('military-actions');
  diplo.innerHTML = '';
  mili.innerHTML = '';

  if (isPlayer) {
    // Upgrades
    for (const key of ['military', 'economy', 'stability', 'tech', 'nuclear']) {
      const up = UPGRADES[key];
      if (key === 'nuclear' && (country.nuclear || country.tech < 7)) continue;
      const cost = world.economy.getCost(country, key);
      const can = world.economy.canAfford(country, key);
      const btn = document.createElement('button');
      btn.className = 'btn secondary';
      btn.disabled = !can;
      btn.innerHTML = `${up.name} <span style="opacity:0.6;font-size:0.8em">(${cost}◈)</span>`;
      btn.onclick = () => {
        if (world.economy.buyUpgrade(country, key)) {
          audio.positive();
          notify(`${up.name} tamamlandı.`);
          openSidePanel(country);
        }
      };
      diplo.appendChild(btn);
    }
    const territoryInfo = document.createElement('div');
    territoryInfo.style.cssText = 'font-size:0.82rem;color:var(--text-secondary);margin:8px 0';
    territoryInfo.textContent = `Yönetilen bölge • Seviye ${country.territoryLevel || 1} • Yerel asker: ${Math.floor(country.military)}`;
    mili.appendChild(territoryInfo);
    addBtn(mili, 'Bu bölgede 10 asker üret (12◈)', () => {
      if (world.recruit(player.id, country.id, 10)) {
        audio.positive(); notify(`${country.name}: 10 asker üretildi.`);
      } else notify('Üretim için yeterli altın veya insan gücü yok.');
      openSidePanel(country);
    });
    if (country.nuclear) {
      const info = document.createElement('div');
      info.style.cssText = 'color:var(--warning);font-size:0.85rem;margin-top:8px';
      info.textContent = '☢ Nükleer kapasite mevcut';
      mili.appendChild(info);
    }
    return;
  }

  // Other country
  if (!player) return;

  // Relation display
  const rel = country.getRelation(player.id);
  const relDiv = document.createElement('div');
  relDiv.style.cssText = 'font-size:0.85rem;margin-bottom:10px;color:var(--text-secondary)';
  relDiv.textContent = `İlişki: ${rel > 0 ? '+' : ''}${Math.floor(rel)}`;
  diplo.appendChild(relDiv);

  if (!isEnemy && !isAlly) {
    addBtn(diplo, 'İttifak Teklif Et', () => {
      const w = country.diplomaticWillingness(rel);
      if (Math.random() < w + 0.25) {
        world.formAlliance(player.id, country.id);
        audio.alliance();
        notify(`${country.name} ittifakı kabul etti!`);
      } else {
        audio.ui();
        notify(`${country.name} teklifi reddetti.`);
        country.modifyRelation(player.id, -8);
      }
      openSidePanel(country);
    });

    addBtn(diplo, 'Ticaret Anlaşması', () => {
      if (world.formTrade(player.id, country.id)) {
        audio.positive();
        notify(`${country.name} ile ticaret anlaşması yapıldı.`);
      }
      openSidePanel(country);
    });

    addBtn(diplo, 'Tehdit Et', () => {
      const res = world.issueThreat(player.id, country.id);
      if (res.backedDown) {
        audio.ui();
        notify(`${country.name} geri adım attı.`);
      } else if (res.war) {
        audio.war();
        notify(`${country.name} tehdide savaşla karşılık verdi!`);
      } else {
        audio.ui();
        notify(`${country.name} tehdidi önemsemedi.`);
      }
      openSidePanel(country);
    }, true);
  }

  if (isAlly) {
    const info = document.createElement('div');
    info.style.cssText = 'color:var(--success);font-size:0.85rem;margin-bottom:8px';
    info.textContent = '✓ Müttefik';
    diplo.appendChild(info);
  }

  if (isEnemy) {
    const info = document.createElement('div');
    info.style.cssText = 'color:var(--danger);font-size:0.85rem;margin-bottom:8px';
    info.textContent = '⚔ Savaş halinde';
    mili.appendChild(info);

    addBtn(mili, 'Takviye Gönder', () => {
      const source = world.getControlledTerritories(player.id).find(t => world.areAdjacent(t.id, country.id) && t.military >= 10);
      const army = source ? world.combat.sendArmy(source.id, country.id, 0.3) : null;
      if (army) {
        audio.war();
        notify(`Takviye yola çıktı (${Math.floor(army.strength)} güç).`);
      } else notify('Yeterli güç yok.');
    });

    addBtn(mili, 'Ateşkes Teklif Et', () => {
      // Acceptance based on relative power + character
      const ratio = player.power / (country.power + 1);
      const chance = 0.3 + country.character.diplomacy * 0.35 + (ratio > 1.2 ? 0.2 : 0);
      if (Math.random() < chance) {
        world.makePeace(player.id, country.id);
        audio.alliance();
        notify(`${country.name} ateşkesi kabul etti.`);
      } else {
        audio.ui();
        notify(`${country.name} ateşkesi reddetti.`);
      }
      openSidePanel(country);
    });

    if (player.nuclear && world.events.canUseNuclear(player)) {
      addBtn(mili, '☢ Nükleer Saldırı', () => {
        if (confirm(`${country.name} hedefine nükleer saldırı?\n\nDünya tepkisi çok ağır olacaktır.`)) {
          const res = world.events.launchNuclear(player.id, country.id);
          if (res.ok) {
            audio.nuclear();
            notify('NÜKLEER SALDIRI gerçekleşti. Dünya sarsıldı.');
            openSidePanel(country);
          }
        }
      }, true);
    }
  } else {
    addBtn(mili, 'Komşu bölgeden saldır + savaş ilan et', () => {
      const source = world.getControlledTerritories(player.id).find(t => world.areAdjacent(t.id, country.id) && t.military >= 10);
      if (!source) { notify('Bu ülkeye kara/deniz komşuluğun yok veya sınırda yeterli asker bulunmuyor.'); return; }
      world.declareWar(player.id, country.id);
      world.combat.sendArmy(source.id, country.id, 0.4);
      country.expression = 'angry';
      player.expression = 'angry';
      audio.war();
      notify(`${country.name} ile savaş başladı.`);
      openSidePanel(country);
    }, true);
  }
}


function openProvincePanel(hit) {
  const { kind, data } = hit;
  const panel = document.getElementById('side-panel');
  const player = world.getPlayer();
  const diplo = document.getElementById('diplomacy-actions');
  const mili = document.getElementById('military-actions');
  const ball = document.getElementById('panel-ball');
  panel.classList.remove('hidden');
  diplo.innerHTML = '';
  mili.innerHTML = '';
  ball.style.background = 'linear-gradient(135deg,#e30a17,#ffffff)';
  document.getElementById('panel-name').textContent = data.name;
  document.getElementById('panel-character').textContent = kind === 'city'
    ? (data.capital ? 'BAŞKENT • STRATEJİK ŞEHİR' : 'STRATEJİK ŞEHİR')
    : 'TÜRKİYE • BÖLGE YÖNETİMİ';
  document.getElementById('panel-character').style.color = data.capital ? '#e6b84b' : '#75c7ff';

  const owner = world.getCountry(data.ownerId);
  const region = kind === 'region' ? data : world.provinces.getRegion(data.regionId);
  const troops = kind === 'region' ? data.troops : data.garrison;
  document.getElementById('stat-military').style.width = Math.min(100, troops) + '%';
  document.getElementById('stat-economy').style.width = Math.min(100, region.economy || 0) + '%';
  document.getElementById('stat-stability').style.width = Math.min(100, region.stability || 0) + '%';
  document.getElementById('stat-tech').style.width = Math.min(100, owner?.tech * 8 || 0) + '%';
  const ownerInfo = document.createElement('div');
  ownerInfo.style.cssText = 'font-size:.85rem;color:var(--text-secondary);margin-bottom:8px';
  ownerInfo.textContent = 'Kontrol: ' + (owner?.name || 'Bağımsız');
  diplo.appendChild(ownerInfo);

  if (!player) return;
  if (kind === 'region' && data.ownerId === player.id) {
    addBtn(mili, 'Bu bölgede 5 asker üret (10 altın)', () => {
      if (world.provinces.recruit(player.id, data.id, 5)) {
        audio.positive(); notify(data.name + ': 5 asker üretildi.');
      } else notify('Yeterli altın veya insan gücü yok.');
      openProvincePanel(hit);
    });
  }

  if (kind === 'region' && data.ownerId !== player.id) {
    const source = world.provinces.getControlledRegions(player.id).find(r => world.provinces.areAdjacent(r.id, data.id));
    if (source) {
      addBtn(mili, source.name + ' üzerinden bölgeye saldır', () => {
        const result = world.provinces.attackRegion(player.id, source.id, data.id);
        notify(result.captured ? data.name + ' ele geçirildi!' : result.ok ? 'Saldırı püskürtüldü.' : 'Saldırı yapılamadı.');
        openProvincePanel(hit);
      }, true);
    } else if (world.provinces.canEnterFromCountry(player.id, data.id)) {
      addBtn(mili, 'Sınırdan bölgeye saldır', () => {
        const result = world.provinces.attackFromCountry(player.id, data.id);
        notify(result.captured ? data.name + ' ele geçirildi!' : result.ok ? 'Saldırı püskürtüldü.' : 'Saldırı yapılamadı.');
        openProvincePanel(hit);
      }, true);
    }
  }

  if (kind === 'city' && data.ownerId !== player.id) {
    const source = world.provinces.getControlledRegions(player.id).find(r => r.id === data.regionId || world.provinces.areAdjacent(r.id, data.regionId));
    if (source) {
      addBtn(mili, source.name + ' üzerinden şehre saldır', () => {
        const result = world.provinces.attackCity(player.id, data.id, source.id);
        notify(result.captured ? (result.capital ? 'BAŞKENT ' : 'ŞEHİR ') + data.name + ' ele geçirildi!' : result.ok ? 'Şehir savunması direndi.' : 'Şehre ulaşılamıyor.');
        openProvincePanel(hit);
      }, true);
    } else {
      const info = document.createElement('div');
      info.style.cssText = 'font-size:.8rem;color:var(--text-secondary)';
      info.textContent = 'Bu şehre saldırmak için komşu bir bölgeyi kontrol etmelisin.';
      mili.appendChild(info);
    }
  }

  if (kind === 'region') {
    const cityNames = data.cities.map(id => world.provinces.getCity(id)?.name).filter(Boolean);
    const info = document.createElement('div');
    info.style.cssText = 'font-size:.8rem;color:var(--text-secondary);margin-top:8px';
    info.textContent = 'Şehir hedefleri: ' + (cityNames.join(', ') || 'Yok');
    mili.appendChild(info);
  }
}

function addBtn(parent, label, onClick, danger = false) {
  const btn = document.createElement('button');
  btn.className = 'btn secondary';
  if (danger) {
    btn.style.borderColor = 'var(--danger)';
    btn.style.color = 'var(--danger)';
  }
  btn.textContent = label;
  btn.onclick = onClick;
  parent.appendChild(btn);
}

function closeSidePanel() {
  document.getElementById('side-panel').classList.add('hidden');
  if (world) for (const c of world.getAllCountries()) c.selected = false;
}

function notify(text) {
  audio.notify();
  const container = document.getElementById('notifications');
  const el = document.createElement('div');
  el.className = 'notification';
  el.textContent = text;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

function showVictory(type) {
  if (victoryShown) return;
  victoryShown = true;
  world.setSpeed(0);

  const modal = document.getElementById('event-modal');
  const title = document.getElementById('event-title');
  const desc = document.getElementById('event-description');
  const choices = document.getElementById('event-choices');

  if (type === 'defeat') {
    title.textContent = 'Yenilgi';
    audio.battle(false);
  } else {
    title.textContent = 'Zafer!';
    audio.victory();
  }
  desc.textContent = world.victory.getMessage();
  choices.innerHTML = '';

  const btn = document.createElement('button');
  btn.className = 'btn primary';
  btn.textContent = 'Ana Menüye Dön';
  btn.onclick = () => {
    modal.classList.add('hidden');
    showScreen('menu');
  };
  choices.appendChild(btn);
  modal.classList.remove('hidden');
}

function updateHUD() {
  if (!world) return;
  const player = world.getPlayer();
  if (!player) return;

  document.getElementById('res-gold').textContent = Math.floor(player.gold);
  document.getElementById('res-manpower').textContent = Math.floor(player.manpower);
  document.getElementById('res-stability').textContent = Math.floor(player.stability) + '%';
  document.getElementById('res-tech').textContent = player.tech;
  document.getElementById('game-date').textContent = world.getDateString();

  if (world.events) {
    for (const n of world.events.consumeNotifications()) {
      if (n.type === 'notify') notify(n.text);
    }
  }

  // Victory check
  const result = world.victory.check();
  if (result && !victoryShown) {
    showVictory(world.victory.victoryType);
  }
}

function gameLoop(timestamp) {
  const dt = Math.min(timestamp - lastTime, 100);
  lastTime = timestamp;

  if (world) {
    world.update(dt);
    updateHUD();
    if (renderer) renderer.render(world);
  }

  animationId = requestAnimationFrame(gameLoop);
}

// Ensure canvas fills on load
window.addEventListener('resize', () => {
  if (renderer) renderer.resize();
});

boot();