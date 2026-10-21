/**
 * Web Audio API synthesized sound generator.
 * Eliminates fragile external MP3/WAV network dependencies.
 */

class SoundController {
  private ctx: AudioContext | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenActive = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Pleasant confirmation chime for check-in success.
   */
  playCheckinSuccess() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25); // G5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio chime playback omitted:', e);
    }
  }

  /**
   * Warning beep when check-in is due soon.
   */
  playWarningChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Warning chime playback omitted:', e);
    }
  }

  /**
   * High-urgency simulated alarm siren with pitch modulation.
   */
  startSiren() {
    if (this.isSirenActive) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      this.sirenOsc = ctx.createOscillator();
      this.sirenGain = ctx.createGain();

      this.sirenOsc.type = 'sawtooth';
      this.sirenOsc.frequency.setValueAtTime(600, now);

      // Pitch LFO modulation
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(2.5, now); // 2.5 cycles per sec

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(300, now); // swing between 300Hz and 900Hz

      lfo.connect(this.sirenOsc.frequency);
      lfo.start(now);

      this.sirenGain.gain.setValueAtTime(0.18, now);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(ctx.destination);

      this.sirenOsc.start(now);
      this.isSirenActive = true;
    } catch (e) {
      console.warn('Siren audio error:', e);
    }
  }

  stopSiren() {
    if (!this.isSirenActive) return;
    try {
      if (this.sirenGain && this.ctx) {
        this.sirenGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
      }
      setTimeout(() => {
        if (this.sirenOsc) {
          try {
            this.sirenOsc.stop();
            this.sirenOsc.disconnect();
          } catch {}
          this.sirenOsc = null;
        }
        this.isSirenActive = false;
      }, 150);
    } catch {
      this.isSirenActive = false;
    }
  }
}

export const soundController = new SoundController();
