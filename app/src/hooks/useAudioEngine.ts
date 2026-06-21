import { useCallback, useRef, useState } from 'react';
import {
  initAudio,
  resumeAudio,
  setMasterVolume,
  toggleMute,
  applyPreset,
  getCurrentPresetName,
  triggerWind,
  triggerWater,
  triggerBirdBurst,
  playFootstep,
  getAnalyser,
  cleanupAudio,
  PRESETS,
} from '@/lib/audioEngine';

export function useAudioEngine() {
  const [initialized, setInitialized] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentPreset, setCurrentPreset] = useState('morning');
  const [volume, setVolume] = useState(0.7);
  const [presetName, setPresetName] = useState('Morning Forest');
  const initRef = useRef(false);

  const initialize = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;
    await resumeAudio();
    const ok = initAudio();
    if (ok) {
      setInitialized(true);
      setPresetName(getCurrentPresetName());
    }
  }, []);

  const handleSetVolume = useCallback((vol: number) => {
    setVolume(vol);
    setMasterVolume(vol);
  }, []);

  const handleToggleMute = useCallback(() => {
    const newMuted = toggleMute();
    setMuted(newMuted);
  }, []);

  const handleApplyPreset = useCallback((key: string) => {
    applyPreset(key);
    setCurrentPreset(key);
    setPresetName(PRESETS[key]?.name ?? 'Custom');
  }, []);

  const handleTriggerWind = useCallback((pan: number = 0) => {
    triggerWind(pan);
  }, []);

  const handleTriggerWater = useCallback((intensity: number = 0.5) => {
    triggerWater(intensity);
  }, []);

  const handleTriggerBirds = useCallback((pan: number = 0) => {
    triggerBirdBurst(pan);
  }, []);

  const handlePlayFootstep = useCallback((pan: number = 0) => {
    playFootstep(pan);
  }, []);

  const getFrequencyData = useCallback(() => {
    const analyser = getAnalyser();
    if (!analyser) return new Uint8Array(128);
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    return data;
  }, []);

  const cleanup = useCallback(() => {
    cleanupAudio();
    initRef.current = false;
    setInitialized(false);
  }, []);

  return {
    initialized,
    muted,
    currentPreset,
    volume,
    presetName,
    initialize,
    setVolume: handleSetVolume,
    toggleMute: handleToggleMute,
    applyPreset: handleApplyPreset,
    triggerWind: handleTriggerWind,
    triggerWater: handleTriggerWater,
    triggerBirds: handleTriggerBirds,
    playFootstep: handlePlayFootstep,
    getFrequencyData,
    cleanup,
  };
}
