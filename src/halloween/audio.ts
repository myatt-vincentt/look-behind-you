// The sounds, synthesised (no files): a low drone with wind for the night,
// and for each change a thunder crack with its rumble and a flutter of bats.
// Silent until the speaker is tapped (browsers only start audio on a tap).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let on = false;

const VOLUME = { master: 0.8, drone: 0.05, wind: 0.035 };

const noiseBuffer = (c: AudioContext) => {
  const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
  return b;
};

const noiseSource = (c: AudioContext, loop = false) => {
  const s = c.createBufferSource();
  s.buffer = noise;
  s.loop = loop;
  return s;
};

/** The night: two low detuned tones and a slow howl of wind. */
const startAmbience = (c: AudioContext, out: AudioNode) => {
  const drone = c.createGain();
  drone.gain.value = VOLUME.drone;
  const low = c.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 260;
  [55, 82.4, 55.6].forEach((f) => {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = f;
    o.connect(low);
    o.start();
  });
  low.connect(drone).connect(out);

  const wind = noiseSource(c, true);
  const band = c.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 500;
  band.Q.value = 1.4;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.09;
  const depth = c.createGain();
  depth.gain.value = 280;
  lfo.connect(depth).connect(band.frequency);
  lfo.start();
  const g = c.createGain();
  g.gain.value = VOLUME.wind;
  wind.connect(band).connect(g).connect(out);
  wind.start();
};

const ensure = () => {
  if (ctx) return ctx;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  ctx = new AC();
  noise = noiseBuffer(ctx);
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  startAmbience(ctx, master);
  return ctx;
};

export const sound = {
  get on() {
    return on;
  },
  /** Turn the sound on or off (call from a tap). */
  set(next: boolean) {
    const c = ensure();
    on = next;
    if (on) c.resume().catch(() => {});
    master?.gain.setTargetAtTime(on ? VOLUME.master : 0, c.currentTime, 0.08);
  },
  /** A thunder crack and its rumble. */
  thunder() {
    if (!on || !ctx || !master) return;
    const c = ctx;
    const t = c.currentTime;
    const crack = noiseSource(c);
    const hi = c.createBiquadFilter();
    hi.type = "highpass";
    hi.frequency.value = 900;
    const cg = c.createGain();
    cg.gain.setValueAtTime(0.5, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    crack.connect(hi).connect(cg).connect(master);
    crack.start(t);
    crack.stop(t + 0.3);

    const rumble = noiseSource(c);
    const lo = c.createBiquadFilter();
    lo.type = "lowpass";
    lo.frequency.value = 140;
    const rg = c.createGain();
    rg.gain.setValueAtTime(0.0001, t);
    rg.gain.exponentialRampToValueAtTime(0.9, t + 0.12);
    rg.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
    rumble.connect(lo).connect(rg).connect(master);
    rumble.start(t);
    rumble.stop(t + 2.3);
  },
  /** A flutter of bat wings going past. */
  flutter() {
    if (!on || !ctx || !master) return;
    const c = ctx;
    const t = c.currentTime + 0.1;
    const src = noiseSource(c);
    const band = c.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 2200;
    band.Q.value = 2;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    // Wing beats: quick pulses that swell and fade as the swarm passes.
    for (let i = 0; i < 18; i += 1) {
      const at = t + i * 0.055;
      const peak = 0.22 * Math.sin((Math.PI * (i + 1)) / 19);
      g.gain.setValueAtTime(peak, at);
      g.gain.linearRampToValueAtTime(0.01, at + 0.04);
    }
    src.connect(band).connect(g).connect(master);
    src.start(t);
    src.stop(t + 1.1);
  },
};
