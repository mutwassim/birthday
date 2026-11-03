import gsap from "gsap";
import { MUSIC } from "../config.js";

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.hasUnlocked = false;
    this.audioElement = null;
    this.isUsingFallbackSynth = false;
    this.synthLoopTimeout = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    // Preload audio immediately on app startup so it buffers early
    this.preloadMusic();

    // Listen for tab visibility changes to keep audio playing smoothly
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && this.hasUnlocked && !this.isMuted) {
          if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => {});
          }
          if (this.audioElement && this.audioElement.paused && !this.isUsingFallbackSynth) {
            this.audioElement.play().catch(() => {});
          }
        }
      });
    }
  }

  preloadMusic() {
    if (typeof window === "undefined") return;
    try {
      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.src = MUSIC;
        this.audioElement.loop = true;
        this.audioElement.preload = "auto";
        this.audioElement.volume = 0; // Starts silent, fades in smoothly on open

        // Seamless loop fallback: in case native loop has a hitch
        this.audioElement.addEventListener("ended", () => {
          this.audioElement.currentTime = 0;
          this.audioElement.play().catch(() => {});
        });

        // Resume automatically if connection stalled temporarily
        this.audioElement.addEventListener("stalled", () => {
          if (this.hasUnlocked && !this.isMuted && this.audioElement.paused) {
            this.audioElement.play().catch(() => {});
          }
        });

        // Preload file data into browser buffer right now
        this.audioElement.load();
      }
    } catch (err) {
      console.warn("Audio preloading error:", err);
    }
  }

  init() {
    if (this.hasUnlocked) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();

      // Master, Music, and SFX gain nodes
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    }

    this.hasUnlocked = true;

    // Start background music seamlessly
    this.playExternalMusic();
  }

  playExternalMusic() {
    if (!this.audioElement) {
      this.preloadMusic();
    }
    if (!this.audioElement) return;

    if (this.isMuted) {
      this.audioElement.muted = true;
      return;
    }

    let started = false;
    const startPlayback = () => {
      if (started) return;
      started = true;
      
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Smoothly ramp up the volume over 2.5s for zero pop/crackle
            gsap.to(this.audioElement, {
              volume: 0.7,
              duration: 2.5,
              ease: "power1.out",
            });
          })
          .catch((err) => {
            console.warn("Direct play prevented, attaching tap handler:", err);
            const userTapPlay = () => {
              this.audioElement.play().then(() => {
                gsap.to(this.audioElement, { volume: 0.7, duration: 2 });
              }).catch(() => {
                this.startFallbackMusicBox();
              });
              window.removeEventListener("pointerdown", userTapPlay);
            };
            window.addEventListener("pointerdown", userTapPlay, { once: true });
          });
      }
    };

    // If audio is already loaded/buffered, play immediately
    if (this.audioElement.readyState >= 2) {
      startPlayback();
    } else {
      this.audioElement.addEventListener("canplay", startPlayback, { once: true });
      this.audioElement.addEventListener("canplaythrough", startPlayback, { once: true });
      // Call load/play directly to trigger buffering if needed
      startPlayback();
    }

    this.audioElement.addEventListener("error", (e) => {
      console.warn("Audio element error, starting fallback synth:", e);
      this.startFallbackMusicBox();
    }, { once: true });
  }

  startFallbackMusicBox() {
    if (this.isUsingFallbackSynth || !this.ctx) return;
    this.isUsingFallbackSynth = true;

    // Fade in musicGain
    gsap.to(this.musicGain.gain, { value: 0.45, duration: 2.5 });

    // Happy Birthday melody in key of C
    // Notes and durations (quarter note = 1 beat, ~0.65s)
    const tempo = 0.55;
    const melody = [
      { note: "G4", dur: 0.75 }, { note: "G4", dur: 0.25 }, { note: "A4", dur: 1.0 }, { note: "G4", dur: 1.0 }, { note: "C5", dur: 1.0 }, { note: "B4", dur: 2.0 },
      { note: "G4", dur: 0.75 }, { note: "G4", dur: 0.25 }, { note: "A4", dur: 1.0 }, { note: "G4", dur: 1.0 }, { note: "D5", dur: 1.0 }, { note: "C5", dur: 2.0 },
      { note: "G4", dur: 0.75 }, { note: "G4", dur: 0.25 }, { note: "G5", dur: 1.0 }, { note: "E5", dur: 1.0 }, { note: "C5", dur: 1.0 }, { note: "B4", dur: 1.0 }, { note: "A4", dur: 1.5 },
      { note: "F5", dur: 0.75 }, { note: "F5", dur: 0.25 }, { note: "E5", dur: 1.0 }, { note: "C5", dur: 1.0 }, { note: "D5", dur: 1.0 }, { note: "C5", dur: 2.5 },
    ];

    const noteFreqs = {
      G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99
    };

    let totalDuration = 0;
    melody.forEach(m => totalDuration += m.dur * tempo);

    const playMelodyLoop = () => {
      if (!this.ctx || this.ctx.state === "closed") return;

      let timeOffset = this.ctx.currentTime + 0.1;
      melody.forEach(({ note, dur }) => {
        const freq = noteFreqs[note];
        if (freq) {
          this.triggerChimeNote(freq, timeOffset, dur * tempo * 0.95);
        }
        timeOffset += dur * tempo;
      });

      // Repeat with a gentle pause
      this.synthLoopTimeout = setTimeout(playMelodyLoop, (totalDuration + 2.5) * 1000);
    };

    playMelodyLoop();
  }

  triggerChimeNote(freq, time, duration) {
    if (!this.ctx) return;

    // Dual oscillator bell/music box synth with subtle harmonic overtone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2.01, time); // Bell shimmer harmonic

    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.exponentialRampToValueAtTime(0.4, time + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.8);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(this.musicGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 1.0);
    osc2.stop(time + duration + 1.0);
  }

  playChime() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      this.triggerChimeNote(freq, now + i * 0.08, 0.4);
    });
  }

  playBlowout() {
    if (!this.ctx) return;
    // Whoosh / white noise puff
    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.7);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  playPop() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playCheer() {
    if (!this.ctx) return;
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chords.forEach((freq, idx) => {
      this.triggerChimeNote(freq, this.ctx.currentTime + idx * 0.07, 0.6);
    });
  }

  playFirework() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Boom sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.45);

    // Sparkle chimes
    setTimeout(() => {
      if (!this.ctx) return;
      const chimeNow = this.ctx.currentTime;
      [880, 1108, 1320, 1760].forEach((freq, i) => {
        this.triggerChimeNote(freq, chimeNow + i * 0.05, 0.3);
      });
    }, 150);
  }

  playClick() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      gsap.to(this.masterGain.gain, {
        value: this.isMuted ? 0 : 1,
        duration: 0.3
      });
    }
    if (this.audioElement) {
      this.audioElement.muted = this.isMuted;
      if (!this.isMuted && this.audioElement.paused && this.hasUnlocked) {
        this.audioElement.play().catch(() => {});
      }
    }
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
