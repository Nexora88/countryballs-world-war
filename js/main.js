import { World } from './core/World.js';
import { Renderer } from './render/Renderer.js';
import { COUNTRIES, CHARACTERS } from './data/countries.js';

/**
 * Countryballs: Sovereign — Entry Point
 */

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

// ---------- Screen Management ----------

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ---------- Loading ----------

async function boot() {
  const progress = document.getElementById('loading-progress');
  const text = document.getElementById('loading-text');

  const steps = [
    { p: 20, t: 'Ülke verileri yükleniyor...' },
    { p: 45, t: 'Kişilik sistemleri hazırlanıyor...' },
    { p: 70, t: 'Dünya haritası oluşturuluyor...' },
    { p: 90, t: 'Diplomatik ilişkiler kuruluyor...' },
    { p: 100, t: 'Hazır.' }
  ];

  for (const step of steps) {
    progress.style.width = step.p + '%';
    text.textContent = step.t;
    await wait(180 + Math.random() * 120);
  }

  await wait(300);
  showScreen('menu');
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ---------- Main Menu ----------

document.getElementById('btn-new-game').addEventListener('click', () => {
  populateCountrySelect();
  showScreen('select');
});

document.getElementById('btn-back-menu').addEventListener('click', () => {
  showScreen('menu');
});

// ---------- Country Select ----------

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

// ---------- Game Start ----------

function startGame(playerId) {
  world = new World();
  world.setPlayer(playerId);

  const canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);

  setupGameUI();
  showScreen('game');

  lastTime = performance.now();
  animationId = requestAnimationFrame(gameLoop);
}

// ---------- Game UI ----------

function setupGameUI() {
  // Speed buttons
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseInt(btn.dataset.speed);
      world.setSpeed(speed);
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Canvas interaction
  const canvas = document.getElementById('game-canvas');

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = renderer.hitTest(x, y, world);
    for (const c of world.getAllCountries()) c.hover = false;
    if (hit) hit.hover = true;
    renderer.hoveredCountry = hit;
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

  // Ball preview
  const ball = document.getElementById('panel-ball');
  ball.style.background = `linear-gradient(135deg, ${country.flagColors[0]}, ${country.flagColors[1] || country.flagColors[0]})`;

  // Stats
  document.getElementById('stat-military').style.width = country.military + '%';
  document.getElementById('stat-economy').style.width = country.economy + '%';
  document.getElementById('stat-stability').style.width = country.stability + '%';
  document.getElementById('stat-tech').style.width = (country.tech * 10) + '%';

  // Actions
  const player = world.getPlayer();
  const isPlayer = country.isPlayer;
  const isEnemy = player && player.isAtWarWith(country.id);
  const isAlly = player && player.isAlliedWith(country.id);

  const diplo = document.getElementById('diplomacy-actions');
  const mili = document.getElementById('military-actions');
  diplo.innerHTML = '';
  mili.innerHTML = '';

  if (!isPlayer && player) {
    if (!isEnemy && !isAlly) {
      const allyBtn = document.createElement('button');
      allyBtn.className = 'btn secondary';
      allyBtn.textContent = 'İttifak Teklif Et';
      allyBtn.onclick = () => {
        // Simple acceptance based on character + relation
        const willingness = country.diplomaticWillingness(country.getRelation(player.id));
        if (Math.random() < willingness + 0.2) {
          world.formAlliance(player.id, country.id);
          notify(`${country.name} ittifakı kabul etti!`);
          openSidePanel(country); // refresh
        } else {
          notify(`${country.name} teklifi reddetti.`);
          country.modifyRelation(player.id, -8);
        }
      };
      diplo.appendChild(allyBtn);

      const warBtn = document.createElement('button');
      warBtn.className = 'btn secondary';
      warBtn.style.borderColor = 'var(--danger)';
      warBtn.style.color = 'var(--danger)';
      warBtn.textContent = 'Savaş İlan Et';
      warBtn.onclick = () => {
        world.declareWar(player.id, country.id);
        country.expression = 'angry';
        player.expression = 'angry';
        notify(`${country.name} ile savaş başladı!`);
        openSidePanel(country);
      };
      mili.appendChild(warBtn);
    }

    if (isAlly) {
      const info = document.createElement('div');
      info.style.color = 'var(--success)';
      info.style.fontSize = '0.85rem';
      info.textContent = 'Müttefik';
      diplo.appendChild(info);
    }

    if (isEnemy) {
      const info = document.createElement('div');
      info.style.color = 'var(--danger)';
      info.style.fontSize = '0.85rem';
      info.textContent = 'Savaş halinde';
      mili.appendChild(info);
    }
  }

  if (isPlayer) {
    const info = document.createElement('div');
    info.style.color = 'var(--text-secondary)';
    info.style.fontSize = '0.85rem';
    info.textContent = 'Bu senin ülken.';
    diplo.appendChild(info);
  }
}

function closeSidePanel() {
  document.getElementById('side-panel').classList.add('hidden');
  for (const c of world.getAllCountries()) c.selected = false;
}

function notify(text) {
  const container = document.getElementById('notifications');
  const el = document.createElement('div');
  el.className = 'notification';
  el.textContent = text;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ---------- Resource / Date UI ----------

function updateHUD() {
  if (!world) return;
  const player = world.getPlayer();
  if (!player) return;

  document.getElementById('res-gold').textContent = Math.floor(player.gold);
  document.getElementById('res-manpower').textContent = Math.floor(player.manpower);
  document.getElementById('res-stability').textContent = Math.floor(player.stability) + '%';
  document.getElementById('res-tech').textContent = player.tech;
  document.getElementById('game-date').textContent = world.getDateString();
}

// ---------- Main Loop ----------

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

// ---------- Boot ----------
boot();