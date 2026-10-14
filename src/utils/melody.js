/*
 * Built-in "Happy Birthday" (public-domain tune) synthesized with the Web Audio API.
 * No audio files are bundled. The player mimics a tiny subset of HTMLAudioElement:
 * play / pause / seek / volume / rate / currentTime / duration, and loops forever.
 */

const BEAT = 0.6; // seconds per beat at rate 1 (100 bpm, 3/4 time)

function noteFreq(name) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(name);
  const semis = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]];
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  const octave = Number(m[3]);
  return 440 * 2 ** ((semis + acc + (octave - 4) * 12) / 12);
}

// [note, startBeat, lengthBeats]
const MELODY = (() => {
  const seq = [
    ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
    ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
    ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
    ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 3],
  ];
  let t = 0;
  return seq.map(([n, len]) => {
    const ev = { note: n, start: t, len, voice: 'lead' };
    t += len;
    return ev;
  });
})();

const BASS = [
  ['C3', 1, 3], ['G2', 4, 3], ['G2', 7, 3], ['C3', 10, 3],
  ['C3', 13, 3], ['F2', 16, 3], ['C3', 20, 2], ['G2', 22, 1], ['C3', 23, 3],
].map(([note, start, len]) => ({ note, start, len, voice: 'bass' }));

const TOTAL_BEATS = 28; // 26 beats of music + a short breath before looping
const EVENTS = [...MELODY, ...BASS]
  .map((e) => ({ ...e, time: e.start * BEAT, dur: e.len * BEAT, freq: noteFreq(e.note) }))
  .sort((a, b) => a.time - b.time);

export const MELODY_DURATION = TOTAL_BEATS * BEAT;

export class MelodyPlayer {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.offset = 0; // song position (seconds at rate 1) while paused
    this.playing = false;
    this.rate = 1;
    this.volume = 0.8;
    this.voices = new Set();
    this.timer = null;
  }

  get duration() {
    return MELODY_DURATION;
  }

  get currentTime() {
    if (!this.playing || !this.ctx) return this.offset;
    const elapsed = Math.max(0, this.ctx.currentTime - this.anchorCtx) * this.rate;
    return (this.anchorSong + elapsed) % MELODY_DURATION;
  }

  ensureContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('Web Audio is not supported in this browser.');
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume * 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  play() {
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') ctx.resume();
    if (this.playing) return;
    this.playing = true;
    this.anchorCtx = ctx.currentTime + 0.06;
    this.anchorSong = this.offset % MELODY_DURATION;
    this.loop = 0;
    this.cursor = EVENTS.findIndex((e) => e.time >= this.anchorSong - 1e-6);
    if (this.cursor === -1) {
      this.cursor = 0;
      this.loop = 1;
    }
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 50);
  }

  schedule() {
    if (!this.playing) return;
    const ctx = this.ctx;
    const horizon = ctx.currentTime + 0.3;
    for (let guard = 0; guard < 200; guard += 1) {
      const ev = EVENTS[this.cursor];
      const songTime = ev.time + this.loop * MELODY_DURATION;
      const when = this.anchorCtx + (songTime - this.anchorSong) / this.rate;
      if (when > horizon) break;
      if (when >= ctx.currentTime - 0.02) this.voice(ev, Math.max(when, ctx.currentTime));
      this.cursor += 1;
      if (this.cursor >= EVENTS.length) {
        this.cursor = 0;
        this.loop += 1;
      }
    }
  }

  voice(ev, when) {
    const ctx = this.ctx;
    const dur = ev.dur / this.rate;
    const gain = ctx.createGain();
    const peak = ev.voice === 'lead' ? 0.32 : 0.2;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(peak * 0.55, when + Math.min(0.25, dur * 0.5));
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur * 0.95 + 0.12);
    gain.connect(this.master);

    const oscs = [];
    const main = ctx.createOscillator();
    main.type = ev.voice === 'lead' ? 'triangle' : 'sine';
    main.frequency.setValueAtTime(ev.freq, when);
    main.connect(gain);
    oscs.push(main);

    if (ev.voice === 'lead') {
      // soft bell-like overtone
      const bellGain = ctx.createGain();
      bellGain.gain.value = 0.18;
      const bell = ctx.createOscillator();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(ev.freq * 2, when);
      bell.connect(bellGain);
      bellGain.connect(gain);
      oscs.push(bell);
    }

    const stopAt = when + dur + 0.2;
    const v = { gain, oscs };
    oscs.forEach((o) => {
      o.start(when);
      o.stop(stopAt);
    });
    main.onended = () => {
      this.voices.delete(v);
      try {
        gain.disconnect();
      } catch {
        /* already disconnected */
      }
    };
    this.voices.add(v);
  }

  silenceAll() {
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.voices.forEach(({ gain, oscs }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0.0001, now);
        oscs.forEach((o) => o.stop(now + 0.01));
      } catch {
        /* ignore */
      }
    });
    this.voices.clear();
  }

  pause() {
    if (!this.playing) return;
    this.offset = this.currentTime;
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    this.silenceAll();
  }

  seek(seconds) {
    const was = this.playing;
    if (was) this.pause();
    this.offset = Math.max(0, Math.min(MELODY_DURATION - 0.01, seconds));
    if (was) this.play();
  }

  setVolume(v) {
    this.volume = v;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v * 0.55, this.ctx.currentTime, 0.08);
  }

  setRate(r) {
    if (r === this.rate) return;
    const was = this.playing;
    if (was) this.pause();
    this.rate = r;
    if (was) this.play();
  }

  destroy() {
    this.pause();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
