export class BeepEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.volume = 0.8;
    this.muted = false;

    this.midpointAudio = new Audio(
      'https://raw.githubusercontent.com/Stepzach/testertimer/main/video-output-F6DE3527-A40B-4722-B1CE-E122F7E47551-2.mp3'
    );

    this.loudAudio = new Audio(
      'https://raw.githubusercontent.com/Stepzach/testertimer/main/video-output-812F7CAF-04AB-434E-A68C-FA2D5147695F-2.mp3'
    );

    this.midpointAudio.preload = 'auto';
    this.loudAudio.preload = 'auto';

    this.midpointAudio.volume = 0.5;
    this.loudAudio.volume = 1.0;

    this.activeAudio = new Set();
  }

  async init() {
    // Keep the AudioContext initialization so the browser user-gesture
    // requirement is satisfied.
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const AC = window.AudioContext || window.webkitAudioContext;

      if (!this.ctx) {
        this.ctx = new AC();
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      if (!this.master) {
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
      }
    }

    // Prime the HTMLAudio elements from the user's gesture.
    try {
      this.midpointAudio.load();
      this.loudAudio.load();
    } catch {}

    return true;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));

    // Preserve the relative loudness:
    // midpoint = 50%
    // start/end = 100%
    this.midpointAudio.volume = this.volume * 0.5;
    this.loudAudio.volume = this.volume;
  }

  setMuted(m) {
    this.muted = !!m;
  }

  stopAll() {
    for (const audio of this.activeAudio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    }

    this.activeAudio.clear();
  }

  beep(kind = 'mid') {
    if (this.muted) return;

    const audio =
      kind === 'mid'
        ? this.midpointAudio
        : this.loudAudio;

    if (!audio) return;

    try {
      // Cancel any currently playing copy and restart it from the beginning.
      audio.pause();
      audio.currentTime = 0;

      audio.volume =
        kind === 'mid'
          ? this.volume * 0.5
          : this.volume;

      this.activeAudio.add(audio);

      const playPromise = audio.play();

      if (playPromise?.catch) {
        playPromise.catch(() => {
          // Browser may block playback until user interaction.
        });
      }

      const cleanup = () => {
        this.activeAudio.delete(audio);
        audio.removeEventListener('ended', cleanup);
      };

      audio.addEventListener('ended', cleanup);
    } catch {}
  }
}
