import { World } from './core/World.js';
import { Renderer } from './render/Renderer.js';
import { COUNTRIES, CHARACTERS } from './data/countries.js';
import { UPGRADES } from './core/Economy.js';

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

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

async function boot() {
  const progress = document.getElementById('loading-progress');
  const text = document.getElementById('loading-text');
  const steps = [
    { p: 15, t: 'Ülke verileri yükleniyor...' },
    { p: 35, t: 'Kişilik sistemleri hazırlanıyor...' },
    { p: 55, t: 'Savaş ve ordu sistemleri...' },
    { p: 75, t: 'Ekonomi ve olay motoru...' },
    { p: 90, t: 'Yapay zeka kişilikleri...' },
    { p: 100, t: 'Hazır.' }
  ];
  for (const step of steps) {
    progress.style.width = step.p + '%';
    text.textContent = step.t;
    await wait(160 + Math.random() * 100);
  }
  await wait(250);
  showScreen('menu');
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

document.getElementById('btn-new-game').addEventListener('click', () => {
  populateCountrySelect();
  showScreen('select');
});

document.getElementById('btn-back-menu').addEventListener('click', () => {
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
  startGame(selectedCountryId);
});

function startGame(playerId) {
  world = new World();
  world.setPlayer(playerId);

  const canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);

  setupGameUI();
  showScreen('game');

  lastTime = performance.now();
  if (animationId) cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(gameLoop);
}

function setupGameUI() {
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseInt(btn.dataset.speed);
      world.setSpeed(speed);
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const canvas = document.getElementById('game-canvas');

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = renderer.hitTest(x, y, world);
    for (const c of world.getAllCountries()) c.hover = false;
    if (hit) hit.hover = true;
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = renderer.hitTest(x, y, world);
    for (const c of world.getAllCountries()) c.selected = false;
    if (hit) {
      hit.selected = true;
      openSidePanel(hit);
    } else {
      closeSidePanel();
    }
  });

  document.getElementById('panel-close').addEventListener('click', closeSidePanel);
}

function openSidePanel(country) {
  const panel = document.getElementById('side-panel');
  panel.classList.remove('hidden');

  document.getElementById('panel-name').textContent = country.name;
  document.getElementById('panel-character').textContent = country.character.name;
  document.getElementById('panel-character').style.color = country.character.color;

  const ball = document.getElementById('panel-ball');
  ball.style.background = `linear-gradient(135deg, ${country.flagColors[0]}, ${country.flagColors[1] || country.flagColors[0]})`;

  document.getElementById('stat-military').style.width = country.military + '%';
  document.getElementById('stat-economy').style.width = country.economy + '%';
  document.getElementById('stat-stability').style.width = country.stability + '%';
  document.getElementById('stat-tech').style.width = (country.tech * 8) + '%';

  const player = world.getPlayer();
  const isPlayer = country.isPlayer;
  const isEnemy = player && player.isAtWarWith(country.id);
  const isAlly = player && player.isAlliedWith(country.id);

  const diplo = document.getElementById('diplomacy-actions');
  const mili = document.getElementById('military-actions');
  diplo.innerHTML = '';
  mili.innerHTML = '';

  // --- Player viewing own country: upgrades ---
  if (isPlayer) {
    const upgradeTitle = document.createElement('div');
    upgradeTitle.style.cssText = 'font-size:0.75rem;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em';
    upgradeTitle.textContent = 'Yatırımlar';
    diplo.appendChild(upgradeTitle);

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
          notify(`${up.name} tamamlandı.`);
          openSidePanel(country);
        }
      };
      diplo.appendChild(btn);
    }

    if (country.nuclear) {
      const nukeInfo = document.createElement('div');
      nukeInfo.style.cssText = 'color:var(--warning);font-size:0.85rem;margin-top:8px';
      nukeInfo.textContent = '☢ Nükleer kapasite mevcut';
      mili.appendChild(nukeInfo);
    }
    return;
  }

  // --- Viewing other country ---
  if (player) {
    // Diplomacy
    if (!isEnemy && !isAlly) {
      const allyBtn = document.createElement('button');
      allyBtn.className = 'btn secondary';
      allyBtn.textContent = 'İttifak Teklif Et';
      allyBtn.onclick = () => {
        const willingness = country.diplomaticWillingness(country.getRelation(player.id));
        if (Math.random() < willingness + 0.25) {
          world.formAlliance(player.id, country.id);
          notify(`${country.name} ittifakı kabul etti!`);
        } else {
          notify(`${country.name} teklifi reddetti.`);
          country.modifyRelation(player.id, -8);
        }
        openSidePanel(country);
      };
      diplo.appendChild(allyBtn);
    }

    if (isAlly) {
      const info = document.createElement('div');
      info.style.cssText = 'color:var(--success);font-size:0.85rem';
      info.textContent = '✓ Müttefik';
      diplo.appendChild(info);
    }

    // Military actions
    if (!isEnemy) {
      const warBtn = document.createElement('button');
      warBtn.className = 'btn secondary';
      warBtn.style.borderColor = 'var(--danger)';
      warBtn.style.color = 'var(--danger)';
      warBtn.textContent = 'Savaş İlan Et + Ordu Gönder';
      warBtn.onclick = () => {
        world.declareWar(player.id, country.id);
        world.combat.sendArmy(player.id, country.id, 0.4);
        country.expression = 'angry';
        player.expression = 'angry';
        notify(`${country.name} ile savaş başladı. Ordu yola çıktı.`);
        openSidePanel(country);
      };
      mili.appendChild(warBtn);
    } else {
      const info = document.createElement('div');
      info.style.cssText = 'color:var(--danger);font-size:0.85rem;margin-bottom:8px';
      info.textContent = '⚔ Savaş halinde';
      mili.appendChild(info);

      const sendBtn = document.createElement('button');
      sendBtn.className = 'btn secondary';
      sendBtn.textContent = 'Takviye Gönder';
      sendBtn.onclick = () => {
        const army = world.combat.sendArmy(player.id, country.id, 0.3);
        if (army) notify(`Takviye birlik yola çıktı (${Math.floor(army.strength)} güç).`);
        else notify('Yeterli askeri güç yok.');
      };
      mili.appendChild(sendBtn);

      // Nuclear option
      if (player.nuclear && world.events.canUseNuclear(player)) {
        const nukeBtn = document.createElement('button');
        nukeBtn.className = 'btn secondary';
        nukeBtn.style.borderColor = 'var(--warning)';
        nukeBtn.style.color = 'var(--warning)';
        nukeBtn.textContent = '☢ Nükleer Saldırı';
        nukeBtn.onclick = () => {
          if (confirm(`${country.name} hedefine nükleer saldırı başlatılsın mı?\n\nBu kararın geri dönüşü yoktur. Dünya tepkisi çok ağır olacaktır.`)) {
            const res = world.events.launchNuclear(player.id, country.id);
            if (res.ok) {
              notify(`NÜKLEER SALDIRI gerçekleşti. Dünya sarsıldı.`);
              openSidePanel(country);
            }
          }
        };
        mili.appendChild(nukeBtn);
      }
    }
  }
}

function closeSidePanel() {
  document.getElementById('side-panel').classList.add('hidden');
  if (world) for (const c of world.getAllCountries()) c.selected = false;
}

function notify(text) {
  const container = document.getElementById('notifications');
  const el = document.createElement('div');
  el.className = 'notification';
  el.textContent = text;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4500);
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

  // Consume event notifications
  if (world.events) {
    const notes = world.events.consumeNotifications();
    for (const n of notes) {
      if (n.type === 'notify') notify(n.text);
    }
  }
}

function gameLoop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  if (world) {
    world.update(dt);
    updateHUD();
    renderer.render(world);
  }

  animationId = requestAnimationFrame(gameLoop);
}

boot();