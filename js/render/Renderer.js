/**
 * Renderer — Stylized world map + Countryballs
 * Continents are drawn procedurally so the map is always visible.
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
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Normalized 0-1 → screen, with generous padding for the top bar */
  worldToScreen(nx, ny) {
    const padL = this.width * 0.04;
    const padR = this.width * 0.04;
    const padT = 70;
    const padB = this.height * 0.06;
    return {
      x: padL + nx * (this.width - padL - padR),
      y: padT + ny * (this.height - padT - padB)
    };
  }

  clear() {
    const ctx = this.ctx;
    // Ocean
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#0b1220');
    grad.addColorStop(0.5, '#0d1526');
    grad.addColorStop(1, '#0a101c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    this.drawContinents();
  }

  /**
   * Simplified continent silhouettes (stylized, not cartographically perfect).
   * Coordinates are normalized 0-1 then mapped through worldToScreen.
   */
  drawContinents() {
    const ctx = this.ctx;
    const land = 'rgba(30, 42, 68, 0.55)';
    const edge = 'rgba(60, 85, 130, 0.25)';

    const shapes = [
      // North America
      [[0.05,0.18],[0.12,0.12],[0.22,0.14],[0.28,0.22],[0.26,0.32],[0.22,0.42],[0.18,0.48],[0.12,0.46],[0.08,0.38],[0.06,0.28]],
      // South America
      [[0.22,0.52],[0.28,0.50],[0.32,0.56],[0.34,0.68],[0.30,0.82],[0.24,0.88],[0.20,0.78],[0.18,0.62]],
      // Europe
      [[0.40,0.22],[0.48,0.18],[0.54,0.20],[0.56,0.28],[0.52,0.34],[0.46,0.36],[0.42,0.32]],
      // Africa
      [[0.44,0.40],[0.52,0.38],[0.58,0.44],[0.60,0.58],[0.56,0.72],[0.50,0.78],[0.44,0.72],[0.42,0.55]],
      // Middle East / Arabia
      [[0.56,0.40],[0.62,0.38],[0.66,0.44],[0.64,0.52],[0.58,0.54]],
      // Russia / North Asia
      [[0.55,0.16],[0.70,0.12],[0.88,0.14],[0.92,0.22],[0.85,0.28],[0.70,0.30],[0.58,0.26]],
      // India / South Asia
      [[0.66,0.42],[0.74,0.40],[0.76,0.50],[0.72,0.58],[0.66,0.54]],
      // East Asia
      [[0.76,0.28],[0.88,0.26],[0.92,0.34],[0.88,0.42],[0.78,0.40]],
      // SE Asia / Indonesia area
      [[0.78,0.52],[0.88,0.50],[0.92,0.58],[0.86,0.66],[0.78,0.62]],
      // Australia
      [[0.82,0.70],[0.94,0.68],[0.96,0.78],[0.88,0.84],[0.80,0.80]]
    ];

    for (const poly of shapes) {
      ctx.beginPath();
      const first = this.worldToScreen(poly[0][0], poly[0][1]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < poly.length; i++) {
        const p = this.worldToScreen(poly[i][0], poly[i][1]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = land;
      ctx.fill();
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Subtle grid for depth
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const y = (i / 8) * this.height;
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

    // Glow
    if (country.selected || country.hover || country.isPlayer) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r + 10, 0, Math.PI * 2);
      ctx.fillStyle = country.isPlayer
        ? 'rgba(91, 141, 239, 0.22)'
        : country.selected
          ? 'rgba(91, 141, 239, 0.3)'
          : 'rgba(255,255,255,0.08)';
      ctx.fill();
    }

    // Shadow
    ctx.beginPath();
    ctx.arc(pos.x + 2, pos.y + 4, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();

    // Body with soft shading
    const bodyGrad = ctx.createRadialGradient(
      pos.x - r * 0.3, pos.y - r * 0.35, r * 0.08,
      pos.x, pos.y, r
    );
    bodyGrad.addColorStop(0, this.lighten(country.color, 30));
    bodyGrad.addColorStop(0.6, country.color);
    bodyGrad.addColorStop(1, this.darken(country.color, 25));

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nuclear badge
    if (country.nuclear) {
      ctx.beginPath();
      ctx.arc(pos.x + r * 0.68, pos.y - r * 0.68, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f0b429';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    this.drawEyes(ctx, pos.x, pos.y, r, country);

    // Label
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(232, 236, 244, 0.92)';
    ctx.fillText(country.short, pos.x, pos.y + r + 6);

    if (country.isPlayer) {
      ctx.font = '10px Inter';
      ctx.fillStyle = '#5b8def';
      ctx.fillText('SEN', pos.x, pos.y + r + 20);
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
      ctx.strokeStyle = 'rgba(239, 91, 91, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
    } else if (type === 'ally') {
      ctx.strokeStyle = 'rgba(62, 207, 142, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
    } else if (type === 'trade') {
      ctx.strokeStyle = 'rgba(240, 180, 41, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
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
    ctx.strokeStyle = 'rgba(239, 91, 91, 0.3)';
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

    for (const country of countries) {
      this.drawCountry(country);
    }
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
      if (dx * dx + dy * dy <= (c.radius + 4) * (c.radius + 4)) return c;
    }
    return null;
  }
}