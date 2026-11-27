/**
 * Renderer — Draws the world on canvas
 * Clean, readable Countryball style with soft shading and expressions.
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;

    this.camera = { x: 0, y: 0, zoom: 1 };
    this.hoveredCountry = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * Convert normalized country position (0-1) to screen coordinates
   */
  worldToScreen(nx, ny) {
    // Simple mapping with padding
    const padX = 80;
    const padY = 80;
    const usableW = this.width - padX * 2;
    const usableH = this.height - padY * 2 - 52; // account for top bar

    return {
      x: padX + nx * usableW,
      y: 52 + padY + ny * usableH
    };
  }

  clear() {
    const ctx = this.ctx;
    // Deep background with subtle gradient
    const grad = ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.4, 0,
      this.width * 0.5, this.height * 0.4, this.width * 0.7
    );
    grad.addColorStop(0, '#12151e');
    grad.addColorStop(1, '#0a0c12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Very subtle grid / atmosphere
    ctx.strokeStyle = 'rgba(255,255,255,0.015)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const y = (i / 11) * this.height;
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

    // Hover / selected glow
    if (country.selected || country.hover || country.isPlayer) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r + 8, 0, Math.PI * 2);
      ctx.fillStyle = country.isPlayer
        ? 'rgba(91, 141, 239, 0.18)'
        : country.selected
          ? 'rgba(91, 141, 239, 0.25)'
          : 'rgba(255,255,255,0.06)';
      ctx.fill();
    }

    // Soft shadow
    ctx.beginPath();
    ctx.arc(pos.x + 2, pos.y + 4, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();

    // Main ball body
    const bodyGrad = ctx.createRadialGradient(
      pos.x - r * 0.3, pos.y - r * 0.35, r * 0.1,
      pos.x, pos.y, r
    );
    bodyGrad.addColorStop(0, this.lighten(country.color, 25));
    bodyGrad.addColorStop(0.7, country.color);
    bodyGrad.addColorStop(1, this.darken(country.color, 20));

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    this.drawEyes(ctx, pos.x, pos.y, r, country);

    // Name label
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(232, 236, 244, 0.85)';
    ctx.fillText(country.short, pos.x, pos.y + r + 6);

    // Player indicator
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

    // Left eye white
    ctx.beginPath();
    ctx.arc(cx - eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fillStyle = '#f5f5f5';
    ctx.fill();

    // Right eye white
    ctx.beginPath();
    ctx.arc(cx + eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fillStyle = '#f5f5f5';
    ctx.fill();

    // Pupils — expression based
    let pupilOffsetX = 0;
    let pupilOffsetY = 0;
    let pupilScale = 1;

    if (country.expression === 'angry') {
      pupilOffsetY = 2;
      pupilScale = 0.85;
    } else if (country.expression === 'happy') {
      pupilOffsetY = -1;
    } else if (country.expression === 'worried') {
      pupilOffsetY = 1;
      pupilScale = 1.1;
    }

    const pupilR = eyeR * 0.45 * pupilScale;

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx - eyeSpacing + pupilOffsetX, eyeY + pupilOffsetY, pupilR, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + eyeSpacing + pupilOffsetX, eyeY + pupilOffsetY, pupilR, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyebrows
    if (country.expression === 'angry' || country.isAtWarWith.size > 0) {
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      // Left brow
      ctx.beginPath();
      ctx.moveTo(cx - eyeSpacing - eyeR * 0.9, eyeY - eyeR * 1.3);
      ctx.lineTo(cx - eyeSpacing + eyeR * 0.6, eyeY - eyeR * 0.7);
      ctx.stroke();

      // Right brow
      ctx.beginPath();
      ctx.moveTo(cx + eyeSpacing + eyeR * 0.9, eyeY - eyeR * 1.3);
      ctx.lineTo(cx + eyeSpacing - eyeR * 0.6, eyeY - eyeR * 0.7);
      ctx.stroke();
    }
  }

  drawConnection(from, to, type = 'relation') {
    const ctx = this.ctx;
    const a = this.worldToScreen(from.x, from.y);
    const b = this.worldToScreen(to.x, to.y);

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);

    if (type === 'war') {
      ctx.strokeStyle = 'rgba(239, 91, 91, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
    } else if (type === 'ally') {
      ctx.strokeStyle = 'rgba(62, 207, 142, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }

  render(world) {
    this.clear();

    const countries = world.getAllCountries();

    // Draw war / alliance lines first (under balls)
    for (const c of countries) {
      for (const enemyId of c.atWarWith) {
        const enemy = world.getCountry(enemyId);
        if (enemy && c.id < enemyId) { // draw once
          this.drawConnection(c, enemy, 'war');
        }
      }
      for (const allyId of c.allies) {
        const ally = world.getCountry(allyId);
        if (ally && c.id < allyId) {
          this.drawConnection(c, ally, 'ally');
        }
      }
    }

    // Draw countries
    for (const country of countries) {
      this.drawCountry(country);
    }
  }

  // --- Helpers ---

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

  /**
   * Hit test: return country under screen coordinates, or null
   */
  hitTest(sx, sy, world) {
    const countries = world.getAllCountries();
    // Check in reverse so larger/overlapping prefer top
    for (let i = countries.length - 1; i >= 0; i--) {
      const c = countries[i];
      const pos = this.worldToScreen(c.x, c.y);
      const dx = sx - pos.x;
      const dy = sy - pos.y;
      if (dx * dx + dy * dy <= c.radius * c.radius) {
        return c;
      }
    }
    return null;
  }
}