/**
 * Lightweight procedural audio using Web Audio API.
 * No external files required.
 */

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.master = null;
  }

  ensure() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    } catch (e) {
      this.enabled = false;
    }
  }

  resume() {
    this.ensure();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration = 0.15, type = 'sine', volume = 0.3) {
    if (!this.enabled) return;
    this.ensure();
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // UI click
  ui() {
    this.playTone(520, 0.06, 'sine', 0.15);
  }

  // Notification
  notify() {
    this.playTone(660, 0.08, 'triangle', 0.2);
    setTimeout(() => this.playTone(880, 0.1, 'triangle', 0.15), 70);
  }

  // Alliance formed
  alliance() {
    this.playTone(392, 0.12, 'sine', 0.25);
    setTimeout(() => this.playTone(523, 0.14, 'sine', 0.22), 90);
    setTimeout(() => this.playTone(659, 0.18, 'sine', 0.2), 180);
  }

  // War declared / army sent
  war() {
    this.playTone(180, 0.2, 'sawtooth', 0.22);
    setTimeout(() => this.playTone(140, 0.25, 'sawtooth', 0.2), 100);
    setTimeout(() => this.playTone(110, 0.3, 'square', 0.15), 220);
  }

  // Battle result
  battle(win = true) {
    if (win) {
      this.playTone(440, 0.1, 'square', 0.2);
      setTimeout(() => this.playTone(554, 0.12, 'square', 0.18), 80);
      setTimeout(() => this.playTone(659, 0.2, 'square', 0.15), 160);
    } else {
      this.playTone(220, 0.25, 'sawtooth', 0.2);
      setTimeout(() => this.playTone(165, 0.3, 'sawtooth', 0.18), 120);
    }
  }

  // Nuclear
  nuclear() {
    // Rising tension then boom
    this.playTone(80, 0.4, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(60, 0.6, 'square', 0.3), 200);
    setTimeout(() => {
      this.playTone(40, 0.8, 'sawtooth', 0.35);
      this.playTone(30, 1.0, 'sine', 0.25);
    }, 400);
  }

  // Victory
  victory() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.25, 'sine', 0.25), i * 120);
    });
  }

  // Upgrade / positive
  positive() {
    this.playTone(523, 0.08, 'sine', 0.18);
    setTimeout(() => this.playTone(784, 0.12, 'sine', 0.15), 60);
  }
}

export const audio = new AudioSystem();