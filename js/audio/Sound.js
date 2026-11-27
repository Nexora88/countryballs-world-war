/**
 * Procedural Sound System (Web Audio API)
 * No external files — zero-install and lightweight.
 */

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Audio not available', e);
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Core tone helpers ---

  tone(freq, duration, type = 'sine', gain = 0.3, attack = 0.02, release = 0.15) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    const now = this.ctx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + attack);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  noise(duration, gain = 0.15) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const now = this.ctx.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    source.start(now);
  }

  // --- Game sounds ---

  play(name) {
    if (!this.enabled) return;
    this.init();

    switch (name) {
      case 'click':
        this.tone(600, 0.06, 'sine', 0.15, 0.005, 0.04);
        break;

      case 'select':
        this.tone(440, 0.08, 'triangle', 0.18, 0.01, 0.06);
        this.tone(660, 0.1, 'sine', 0.1, 0.02, 0.07);
        break;

      case 'alliance':
        this.tone(392, 0.12, 'sine', 0.22, 0.02, 0.1);
        setTimeout(() => this.tone(523, 0.15, 'sine', 0.2, 0.02, 0.12), 90);
        setTimeout(() => this.tone(659, 0.2, 'sine', 0.18, 0.02, 0.15), 180);
        break;

      case 'war':
        this.noise(0.18, 0.2);
        this.tone(180, 0.25, 'sawtooth', 0.15, 0.01, 0.2);
        setTimeout(() => this.tone(120, 0.3, 'square', 0.12, 0.01, 0.25), 80);
        break;

      case 'battle':
        this.noise(0.12, 0.18);
        this.tone(220, 0.15, 'square', 0.12, 0.005, 0.1);
        break;

      case 'upgrade':
        this.tone(523, 0.08, 'sine', 0.2, 0.01, 0.06);
        setTimeout(() => this.tone(659, 0.1, 'sine', 0.18, 0.01, 0.08), 70);
        setTimeout(() => this.tone(784, 0.14, 'sine', 0.15, 0.01, 0.1), 140);
        break;

      case 'nuclear':
        // Deep rumble + rising tension + impact
        this.tone(60, 0.6, 'sawtooth', 0.25, 0.05, 0.5);
        this.noise(0.5, 0.22);
        setTimeout(() => {
          this.tone(40, 0.8, 'sine', 0.3, 0.02, 0.7);
          this.noise(0.7, 0.28);
        }, 200);
        setTimeout(() => this.tone(90, 0.4, 'square', 0.15, 0.01, 0.35), 500);
        break;

      case 'notify':
        this.tone(880, 0.07, 'sine', 0.12, 0.005, 0.05);
        setTimeout(() => this.tone(1100, 0.09, 'sine', 0.1, 0.005, 0.06), 60);
        break;

      case 'victory':
        const notes = [523, 659, 784, 1046];
        notes.forEach((f, i) => {
          setTimeout(() => this.tone(f, 0.25, 'sine', 0.22, 0.02, 0.2), i * 120);
        });
        break;

      case 'defeat':
        this.tone(300, 0.3, 'sawtooth', 0.18, 0.02, 0.25);
        setTimeout(() => this.tone(200, 0.4, 'sawtooth', 0.15, 0.02, 0.35), 150);
        setTimeout(() => this.tone(120, 0.5, 'sine', 0.12, 0.02, 0.4), 320);
        break;

      case 'peace':
        this.tone(349, 0.15, 'sine', 0.18, 0.02, 0.12);
        setTimeout(() => this.tone(440, 0.2, 'sine', 0.16, 0.02, 0.15), 100);
        break;

      case 'threat':
        this.tone(150, 0.2, 'square', 0.14, 0.01, 0.15);
        setTimeout(() => this.tone(130, 0.25, 'square', 0.12, 0.01, 0.2), 100);
        break;

      default:
        break;
    }
  }

  setVolume(v) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, v));
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// Singleton
export const sound = new SoundManager();