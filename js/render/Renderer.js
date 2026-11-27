/**
 * Renderer — Original stylized-realistic world map + Countryballs
 * Continents drawn as multi-polygon silhouettes (not a clone of any game).
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.hoveredCountry = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = this.canvas.parentElement || document.body;
    const rect = parent.getBoundingClientRect();
    this.width = Math.max(rect.width, window.innerWidth) || 1200;
    this.height = Math.max(rect.height, window.innerHeight) || 800;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  worldToScreen(nx, ny) {
    const padL = this.width * 0.03;
    const padR = this.width * 0.03;
    const padT = 58;
    const padB = this.height * 0.04;
    return {
      x: padL + nx * (this.width - padL - padR),
      y: padT + ny * (this.height - padT - padB)
    };
  }

  clear() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.height);
    g.addColorStop(0, '#0a1424');
    g.addColorStop(0.45, '#0c1830');
    g.addColorStop(1, '#08101c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.width, this.height);
    this.drawWorldMap();
  }

  /**
   * Multi-part continent outlines — original simplified geography.
   * Points are normalized 0–1.
   */
  drawWorldMap() {
    const ctx = this.ctx;
    const fill = 'rgba(28, 48, 78, 0.72)';
    const stroke = 'rgba(70, 110, 160, 0.35)';
    const inner = 'rgba(20, 36, 60, 0.4)';

    const continents = [
      // Greenland-ish
      [[0.28,0.06],[0.34,0.04],[0.38,0.08],[0.36,0.14],[0.30,0.16],[0.26,0.12]],
      // North America
      [[0.04,0.14],[0.10,0.08],[0.18,0.06],[0.24,0.10],[0.28,0.18],[0.26,0.28],[0.22,0.36],[0.20,0.44],[0.14,0.48],[0.10,0.42],[0.08,0.32],[0.06,0.22]],
      // Central America bridge
      [[0.12,0.48],[0.16,0.48],[0.18,0.54],[0.14,0.56],[0.10,0.52]],
      // South America
      [[0.18,0.56],[0.24,0.52],[0.30,0.54],[0.34,0.62],[0.32,0.74],[0.28,0.86],[0.22,0.90],[0.18,0.82],[0.16,0.68],[0.16,0.58]],
      // Western Europe
      [[0.42,0.22],[0.46,0.18],[0.50,0.20],[0.52,0.26],[0.50,0.32],[0.46,0.34],[0.42,0.30],[0.40,0.26]],
      // British Isles
      [[0.40,0.22],[0.43,0.20],[0.44,0.24],[0.41,0.26]],
      // Scandinavia
      [[0.50,0.12],[0.54,0.10],[0.56,0.16],[0.54,0.22],[0.50,0.20]],
      // Eastern Europe / Balkans
      [[0.52,0.26],[0.58,0.24],[0.60,0.30],[0.58,0.36],[0.54,0.38],[0.50,0.34]],
      // Africa
      [[0.44,0.40],[0.50,0.38],[0.56,0.40],[0.60,0.48],[0.62,0.58],[0.58,0.70],[0.52,0.78],[0.46,0.76],[0.42,0.66],[0.40,0.52],[0.42,0.44]],
      // Arabian Peninsula
      [[0.56,0.44],[0.62,0.42],[0.66,0.48],[0.64,0.56],[0.58,0.56],[0.56,0.50]],
      // Russia / Siberia
      [[0.56,0.12],[0.68,0.08],[0.82,0.10],[0.92,0.14],[0.94,0.22],[0.88,0.28],[0.76,0.30],[0.64,0.28],[0.56,0.24]],
      // Central Asia
      [[0.64,0.30],[0.72,0.28],[0.76,0.34],[0.72,0.40],[0.64,0.38]],
      // Indian subcontinent
      [[0.68,0.42],[0.74,0.40],[0.78,0.48],[0.76,0.58],[0.70,0.60],[0.66,0.52]],
      // China / East Asia mainland
      [[0.74,0.28],[0.86,0.24],[0.92,0.30],[0.90,0.40],[0.84,0.44],[0.76,0.42],[0.72,0.36]],
      // Korea / Japan area blobs
      [[0.88,0.32],[0.92,0.30],[0.94,0.36],[0.90,0.38]],
      [[0.92,0.34],[0.96,0.32],[0.98,0.38],[0.94,0.40]],
      // SE Asia
      [[0.78,0.50],[0.88,0.48],[0.92,0.56],[0.86,0.64],[0.78,0.60]],
      // Indonesia archipelago hint
      [[0.80,0.62],[0.90,0.60],[0.94,0.66],[0.88,0.70],[0.80,0.68]],
      // Australia
      [[0.82,0.70],[0.94,0.68],[0.98,0.74],[0.96,0.84],[0.88,0.88],[0.80,0.82],[0.78,0.74]],
      // New Zealand hint
      [[0.96,0.86],[0.98,0.84],[0.99,0.90],[0.97,0.92]]
    ];

    for (const poly of continents) {
      if (poly.length < 3) continue;
      ctx.beginPath();
      const p0 = this.worldToScreen(poly[0][0], poly[0][1]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < poly.length; i++) {
        const p = this.worldToScreen(poly[i][0], poly[i][1]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Soft equator / latitude lines
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const y = this.worldToScreen(0, i / 6).y;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  drawCountry(country) {
    const ctx = this.ctx;
    const pos = this.worldToScreen(country.x, country.y);
    const r = country.radius;

    if (country.selected || country.hover || country.isPlayer) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r + 11, 0, Math.PI * 2);
      ctx.fillStyle = country.isPlayer
        ? 'rgba(91, 141, 239, 0.25)'
        : country.selected
          ? 'rgba(91, 141, 239, 0.32)'
          : 'rgba(255,255,255,0.09)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(pos.x + 2, pos.y + 4, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fill();

    const bodyGrad = ctx.createRadialGradient(
      pos.x - r * 0.3, pos.y - r * 0.35, r * 0.08,
      pos.x, pos.y, r
    );
    bodyGrad.addColorStop(0, this.lighten(country.color, 32));
    bodyGrad.addColorStop(0.55, country.color);
    bodyGrad.addColorStop(1, this.darken(country.color, 28));

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (country.nuclear) {
      ctx.beginPath();
      ctx.arc(pos.x + r * 0.7, pos.y - r * 0.7, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f0b429';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    this.drawEyes(ctx, pos.x, pos.y, r, country);

    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(232, 236, 244, 0.95)';
    ctx.fillText(country.short, pos.x, pos.y + r + 5);

    if (country.isPlayer) {
      ctx.font = '10px Inter';
      ctx.fillStyle = '#5b8def';
      ctx.fillText('SEN', pos.x, pos.y + r + 18);
    }
  }

  drawEyes(ctx, cx, cy, r, country) {
    const eyeY = cy - r * 0.12;
    const eyeSpacing = r * 0.32;
    const eyeR = r * 0.16;

    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath(); ctx.arc(cx - eyeSpacing, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + eyeSpacing, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();

    let pupilOffsetY = 0, pupilScale = 1;
    if (country.expression === 'angry') { pupilOffsetY = 2; pupilScale = 0.85; }
    else if (country.expression === 'happy' || country.expression === 'smug') pupilOffsetY = -1;
    else if (country.expression === 'worried') { pupilOffsetY = 1; pupilScale = 1.1; }

    const pupilR = eyeR * 0.45 * pupilScale;
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(cx - eyeSpacing, eyeY + pupilOffsetY, pupilR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + eyeSpacing, eyeY + pupilOffsetY, pupilR, 0, Math.PI * 2); ctx.fill();

    if (country.expression === 'angry' || country.atWarWith.size > 0) {
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - eyeSpacing - eyeR * 0.9, eyeY - eyeR * 1.3);
      ctx.lineTo(cx - eyeSpacing + eyeR * 0.6, eyeY - eyeR * 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + eyeSpacing + eyeR * 0.9, eyeY - eyeR * 1.3);
      ctx.lineTo(cx + eyeSpacing - eyeR * 0.6, eyeY - eyeR * 0.7);
      ctx.stroke();
    }
  }

  drawConnection(from, to, type) {
    const ctx = this.ctx;
    const a = this.worldToScreen(from.x, from.y);
    const b = this.worldToScreen(to.x, to.y);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    if (type === 'war') {
      ctx.strokeStyle = 'rgba(239, 91, 91, 0.5)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
    } else if (type === 'ally') {
      ctx.strokeStyle = 'rgba(62, 207, 142, 0.42)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawArmy(army, world) {
    const from = world.getCountry(army.fromId);
    const to = world.getCountry(army.toId);
    if (!from || !to) return;
    const a = this.worldToScreen(from.x, from.y);
    const b = this.worldToScreen(to.x, to.y);
    const t = army.progress;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const ctx = this.ctx;
    const owner = world.getCountry(army.ownerId);
    const color = owner ? owner.color : '#888';

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = 'rgba(239, 91, 91, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(x, y, 6 + army.strength * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 9px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(Math.floor(army.strength), x, y);
  }

  render(world) {
    this.clear();
    const countries = world.getAllCountries();

    for (const c of countries) {
      for (const enemyId of c.atWarWith) {
        const enemy = world.getCountry(enemyId);
        if (enemy && c.id < enemyId) this.drawConnection(c, enemy, 'war');
      }
      for (const allyId of c.allies) {
        const ally = world.getCountry(allyId);
        if (ally && c.id < allyId) this.drawConnection(c, ally, 'ally');
      }
    }

    if (world.combat) {
      for (const army of world.combat.getArmies()) {
        if (!army.retreating) this.drawArmy(army, world);
      }
    }

    for (const country of countries) this.drawCountry(country);
  }

  lighten(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
    const b = Math.min(255, (num & 0x0000FF) + percent);
    return `rgb(${r},${g},${b})`;
  }

  darken(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - percent);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - percent);
    const b = Math.max(0, (num & 0x0000FF) - percent);
    return `rgb(${r},${g},${b})`;
  }

  hitTest(sx, sy, world) {
    const countries = world.getAllCountries();
    for (let i = countries.length - 1; i >= 0; i--) {
      const c = countries[i];
      const pos = this.worldToScreen(c.x, c.y);
      const dx = sx - pos.x;
      const dy = sy - pos.y;
      if (dx * dx + dy * dy <= (c.radius + 5) * (c.radius + 5)) return c;
    }
    return null;
  }
}