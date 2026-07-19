/**
 * Echoscape Audio Engine
 * All sounds are synthesized in real-time using Web Audio API.
 * No pre-recorded audio files.
 */

export interface PresetConfig {
  name: string;
  gains: Record<string, number>;
  extra?: Record<string, number>;
}

export const PRESETS: Record<string, PresetConfig> = {
  morning: {
    name: 'Morning Forest',
    gains: { drone: 1.0, wind: 0.4, birds: 0.6, water: 0.2, crickets: 0, rain: 0 },
  },
  night: {
    name: 'Deep Night',
    gains: { drone: 0.8, wind: 0.2, birds: 0, water: 0.1, crickets: 0.5, rain: 0 },
    extra: { droneDetune: -1200 },
  },
  rain: {
    name: 'Rain on Leaves',
    gains: { drone: 0.5, wind: 0, birds: 0.1, water: 0.8, crickets: 0, rain: 1.0 },
  },
  ocean: {
    name: 'Ocean Shore',
    gains: { drone: 0.6, wind: 0.3, birds: 0.2, water: 0.7, crickets: 0, rain: 0 },
  },
  whale: {
    name: 'Whale Song',
    gains: { drone: 0.75, wind: 0.2, birds: 0, water: 0.9, crickets: 0, rain: 0 },
  },
  dolphin: {
    name: 'Dolphin Drift',
    gains: { drone: 0.55, wind: 0.25, birds: 0, water: 0.8, crickets: 0, rain: 0 },
  },
  sleep: {
    name: 'Sleep Drift',
    gains: { drone: 0.35, wind: 0.1, birds: 0, water: 0.25, crickets: 0, rain: 0 },
  },
};

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let analyser: AnalyserNode | null = null;
let isMuted = false;
let masterVolume = 0.7;
let currentPreset = 'morning';

// Sound source nodes
const sources: Record<string, any> = {};
const sourceGains: Record<string, GainNode> = {};

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function ensureMasterChain(): { masterGain: GainNode; compressor: DynamicsCompressorNode; analyser: AnalyserNode } {
  const ctx = getCtx();
  if (!masterGain) {
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, ctx.currentTime);
    compressor.ratio.setValueAtTime(4, ctx.currentTime);

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVolume, ctx.currentTime);

    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    masterGain.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(ctx.destination);
  }
  return { masterGain: masterGain!, compressor: compressor!, analyser: analyser! };
}

function createPanner(): StereoPannerNode {
  return getCtx().createStereoPanner();
}

function connectToMaster(node: AudioNode, panner?: StereoPannerNode) {
  const { masterGain } = ensureMasterChain();
  if (panner) {
    node.connect(panner);
    panner.connect(masterGain);
  } else {
    node.connect(masterGain);
  }
}

// ========== DRONE (Forest Floor) ==========
function startDrone() {
  const ctx = getCtx();
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);

  const freqs = [55, 82.5, 110]; // A1, E2, A2
  const oscillators: OscillatorNode[] = [];

  freqs.forEach((f) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, ctx.currentTime);
    // Slight detune for beating
    osc.detune.setValueAtTime((Math.random() - 0.5) * 4, ctx.currentTime);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.connect(oscGain);
    oscGain.connect(gain);
    osc.start();
    oscillators.push(osc);
  });

  // Gentle lowpass
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, ctx.currentTime);
  gain.connect(filter);
  connectToMaster(filter);

  // Slow volume modulation
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(0.05, ctx.currentTime);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(0.03, ctx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  lfo.start();

  sourceGains.drone = gain;
  sources.drone = { oscillators, lfo, gain };
}

// ========== WIND ==========
function startWind() {
  const ctx = getCtx();
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5;
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.setValueAtTime(1, ctx.currentTime);

  // LFO modulating filter frequency
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(300, ctx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  filter.frequency.setValueAtTime(500, ctx.currentTime);
  connectToMaster(filter, createPanner());

  sources.wind = { noiseBuffer, gain, filter, lfo, playing: false };
  sourceGains.wind = gain;
}
let lastOut = 0;

// ========== BIRDS (FM Synthesis) ==========
let birdInterval: ReturnType<typeof setInterval> | null = null;
function startBirds() {
  stopBirds();
  const chirp = () => {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const ctx = audioCtx;
    const numChirps = 1 + Math.floor(Math.random() * 3);
    for (let c = 0; c < numChirps; c++) {
      const delay = c * (0.1 + Math.random() * 0.2);
      const carrierFreq = 2000 + Math.random() * 4000;
      const modFreq = 100 + Math.random() * 300;
      const modIndex = 2 + Math.random() * 3;

      const carrier = ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(carrierFreq, ctx.currentTime + delay);

      const modulator = ctx.createOscillator();
      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(modFreq, ctx.currentTime + delay);

      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(modFreq * modIndex, ctx.currentTime + delay);

      const env = ctx.createGain();
      const attack = 0.01;
      const decay = 0.3 + Math.random() * 0.9;
      env.gain.setValueAtTime(0, ctx.currentTime + delay);
      env.gain.linearRampToValueAtTime(0.08, ctx.currentTime + delay + attack);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + attack + decay);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(env);

      const panner = createPanner();
      panner.pan.setValueAtTime((Math.random() - 0.5) * 2, ctx.currentTime + delay);
      connectToMaster(env, panner);

      carrier.start(ctx.currentTime + delay);
      modulator.start(ctx.currentTime + delay);
      carrier.stop(ctx.currentTime + delay + attack + decay + 0.1);
      modulator.stop(ctx.currentTime + delay + attack + decay + 0.1);
    }
  };

  // Schedule random intervals
  const scheduleNext = () => {
    const interval = 5000 + Math.random() * 10000;
    birdInterval = setTimeout(() => {
      chirp();
      scheduleNext();
    }, interval);
  };
  scheduleNext();
  sources.birds = { active: true };
}

function stopBirds() {
  if (birdInterval) {
    clearTimeout(birdInterval);
    birdInterval = null;
  }
  sources.birds = { active: false };
}

// ========== WATER ==========
let waterSource: AudioBufferSourceNode | null = null;
function startWater() {
  const ctx = getCtx();
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);

  // Create looping white noise for water
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  waterSource = ctx.createBufferSource();
  waterSource.buffer = buffer;
  waterSource.loop = true;
  waterSource.connect(filter);
  filter.connect(gain);
  connectToMaster(gain, createPanner());
  waterSource.start();

  sources.water = { source: waterSource, filter, gain };
  sourceGains.water = gain;
}

// ========== CRICKETS ==========
let cricketInterval: ReturnType<typeof setInterval> | null = null;
function startCrickets() {
  stopCrickets();
  const chirp = () => {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const ctx = audioCtx;
    const numChirps = 2 + Math.floor(Math.random() * 2);
    for (let c = 0; c < numChirps; c++) {
      const delay = c * 0.08;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(8000, ctx.currentTime + delay);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, ctx.currentTime + delay);
      env.gain.linearRampToValueAtTime(0.04, ctx.currentTime + delay + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.06);
      osc.connect(env);
      connectToMaster(env);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.08);
    }
  };
  const scheduleNext = () => {
    const interval = 3000 + Math.random() * 5000;
    cricketInterval = setTimeout(() => {
      chirp();
      scheduleNext();
    }, interval);
  };
  scheduleNext();
  sources.crickets = { active: true };
}

function stopCrickets() {
  if (cricketInterval) {
    clearTimeout(cricketInterval);
    cricketInterval = null;
  }
  sources.crickets = { active: false };
}

// ========== RAIN ==========
let rainInterval: ReturnType<typeof setInterval> | null = null;
function startRain() {
  stopRain();
  const drop = () => {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const ctx = audioCtx;
    const count = 10 + Math.floor(Math.random() * 20);
    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 0.1;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2000 + Math.random() * 4000, ctx.currentTime + delay);
      filter.Q.setValueAtTime(2 + Math.random() * 3, ctx.currentTime + delay);

      const duration = 0.01 + Math.random() * 0.02;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let s = 0; s < data.length; s++) {
        data[s] = (Math.random() * 2 - 1) * Math.sin((s / data.length) * Math.PI);
      }

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.02 + Math.random() * 0.03, ctx.currentTime + delay);
      src.connect(filter);
      filter.connect(env);
      connectToMaster(env);
      src.start(ctx.currentTime + delay);
    }
  };
  rainInterval = setInterval(drop, 100);
  sources.rain = { active: true };
}

function stopRain() {
  if (rainInterval) {
    clearInterval(rainInterval);
    rainInterval = null;
  }
  sources.rain = { active: false };
}

// ========== MARINE SOUND LAYERS ==========
let marineVoiceInterval: ReturnType<typeof setInterval> | null = null;
let marinePulseInterval: ReturnType<typeof setInterval> | null = null;

function stopMarineLayers() {
  if (marineVoiceInterval) {
    clearInterval(marineVoiceInterval);
    marineVoiceInterval = null;
  }
  if (marinePulseInterval) {
    clearInterval(marinePulseInterval);
    marinePulseInterval = null;
  }
}

function startWhaleLayer() {
  stopMarineLayers();
  const ctx = getCtx();

  const voice = () => {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const baseFreq = 90 + Math.random() * 40;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.detune.setValueAtTime((Math.random() - 0.5) * 10, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, ctx.currentTime);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.2);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.4);

    osc.connect(filter);
    filter.connect(env);
    connectToMaster(env, createPanner());

    osc.start();
    osc.stop(ctx.currentTime + 2.5);
  };

  marineVoiceInterval = setInterval(voice, 2800);
  voice();

  marinePulseInterval = setInterval(() => {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const pulse = ctx.createOscillator();
    pulse.type = 'triangle';
    pulse.frequency.setValueAtTime(110, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.008, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    pulse.connect(gain);
    connectToMaster(gain, createPanner());
    pulse.start();
    pulse.stop(ctx.currentTime + 1);
  }, 5000);
}

function startDolphinLayer() {
  stopMarineLayers();
  const ctx = getCtx();

  const chirp = () => {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1800 + Math.random() * 1200, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, ctx.currentTime);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.03);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(filter);
    filter.connect(env);
    connectToMaster(env, createPanner());

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  };

  marineVoiceInterval = setInterval(chirp, 700);
  chirp();

  marinePulseInterval = setInterval(() => {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.006, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    noise.connect(filter);
    filter.connect(gain);
    connectToMaster(gain, createPanner());
    noise.start();
    noise.stop(ctx.currentTime + 0.2);
  }, 1300);
}

function startSleepLayer() {
  stopMarineLayers();
  const ctx = getCtx();
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(220, ctx.currentTime);
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(110, ctx.currentTime);
  osc.connect(filter);
  filter.connect(gain);
  connectToMaster(gain);
  osc.start();
  sources.sleep = { osc, gain, filter };
}

// ========== FOOTSTEPS ==========
export function playFootstep(_panValue: number = 0) {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const ctx = audioCtx;
  const duration = 0.2;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(150 + Math.random() * 250, ctx.currentTime);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.15, ctx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  src.connect(filter);
  filter.connect(env);
  const panner = createPanner();
  panner.pan.setValueAtTime(_panValue, ctx.currentTime);
  connectToMaster(env, panner);
  src.start();
}

// ========== PUBLIC API ==========

export function initAudio(): boolean {
  try {
    ensureMasterChain();
    startDrone();
    startWind();
    startWater();
    // Birds, crickets, rain are started by preset
    applyPreset('morning');
    return true;
  } catch (e) {
    console.error('Audio init failed:', e);
    return false;
  }
}

export async function resumeAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

export function getAudioContext(): AudioContext | null {
  return audioCtx;
}

export function getAnalyser(): AnalyserNode | null {
  return analyser;
}

export function setMasterVolume(vol: number) {
  masterVolume = vol;
  if (masterGain) {
    masterGain.gain.setValueAtTime(isMuted ? 0 : vol, getCtx().currentTime);
  }
}

export function toggleMute(): boolean {
  isMuted = !isMuted;
  if (masterGain) {
    masterGain.gain.setValueAtTime(isMuted ? 0 : masterVolume, getCtx().currentTime);
  }
  return isMuted;
}

export function isAudioMuted(): boolean {
  return isMuted;
}

let crossfadeRaf: number | null = null;

export function applyPreset(presetKey: string) {
  currentPreset = presetKey;
  const preset = PRESETS[presetKey];
  if (!preset) return;

  // Stop/start intermittent sources
  if (preset.gains.birds > 0) startBirds(); else stopBirds();
  if (preset.gains.crickets > 0) startCrickets(); else stopCrickets();
  if (preset.gains.rain > 0) startRain(); else stopRain();

  if (presetKey === 'whale') {
    startWhaleLayer();
  } else if (presetKey === 'dolphin') {
    startDolphinLayer();
  } else if (presetKey === 'sleep') {
    startSleepLayer();
  } else {
    stopMarineLayers();
  }

  // Crossfade all gain nodes over 3 seconds
  const ctx = getCtx();
  const duration = 3;
  const startTime = ctx.currentTime;

  if (crossfadeRaf) cancelAnimationFrame(crossfadeRaf);

  const startValues: Record<string, number> = {};
  Object.keys(preset.gains).forEach((key) => {
    if (sourceGains[key]) {
      startValues[key] = sourceGains[key].gain.value;
    }
  });

  const animate = () => {
    const elapsed = ctx.currentTime - startTime;
    const t = Math.min(elapsed / duration, 1);

    Object.keys(preset.gains).forEach((key) => {
      const gainNode = sourceGains[key];
      if (gainNode) {
        const target = preset.gains[key] * 0.3; // Scale down to avoid clipping
        const start = startValues[key] ?? 0;
        gainNode.gain.setValueAtTime(start + (target - start) * t, ctx.currentTime);
      }
    });

    if (t < 1) {
      crossfadeRaf = requestAnimationFrame(animate);
    }
  };
  crossfadeRaf = requestAnimationFrame(animate);
}

export function getCurrentPreset(): string {
  return currentPreset;
}

export function getCurrentPresetName(): string {
  return PRESETS[currentPreset]?.name ?? 'Custom';
}

// Trigger sounds interactively
export function triggerWind(_panValue: number = 0) {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const ctx = audioCtx;
  // Brief wind gust
  const { gain } = sources.wind || {};
  if (gain) {
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3);
  }
}

export function triggerWater(intensity: number = 0.5) {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const { gain, filter } = sources.water || {};
  if (gain && filter) {
    const ctx = audioCtx;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, intensity * 0.2), ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1);
    filter.frequency.setValueAtTime(400 + intensity * 800, ctx.currentTime);
  }
}

export function triggerBirdBurst(panValue: number = 0) {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const ctx = audioCtx;
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      if (!audioCtx) return;
      const carrierFreq = 2000 + Math.random() * 4000;
      const modFreq = 100 + Math.random() * 300;
      const carrier = ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(carrierFreq, ctx.currentTime);
      const modulator = ctx.createOscillator();
      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(modFreq, ctx.currentTime);
      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(modFreq * (2 + Math.random() * 3), ctx.currentTime);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(env);
      const panner = createPanner();
      panner.pan.setValueAtTime(panValue + (Math.random() - 0.5) * 0.5, ctx.currentTime);
      connectToMaster(env, panner);
      carrier.start();
      modulator.start();
      carrier.stop(ctx.currentTime + 0.6);
      modulator.stop(ctx.currentTime + 0.6);
    }, i * 200);
  }
}

export function cleanupAudio() {
  if (birdInterval) clearTimeout(birdInterval);
  if (cricketInterval) clearTimeout(cricketInterval);
  if (rainInterval) clearInterval(rainInterval);
  if (crossfadeRaf) cancelAnimationFrame(crossfadeRaf);
  if (waterSource) { try { waterSource.stop(); } catch {} }
  Object.values(sources).forEach((s: any) => {
    if (s.oscillators) s.oscillators.forEach((o: OscillatorNode) => { try { o.stop(); } catch {} });
    if (s.lfo) { try { s.lfo.stop(); } catch {} }
    if (s.source) { try { s.source.stop(); } catch {} }
  });
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
  masterGain = null;
  compressor = null;
  analyser = null;
}
