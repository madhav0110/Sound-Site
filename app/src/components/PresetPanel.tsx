import { useEffect, useState, type ChangeEvent, type FC } from 'react';

interface PresetPanelProps {
  currentPreset: string;
  onPresetChange: (key: string) => void;
}

const PRESET_DATA = [
  { key: 'morning', label: 'Forest', description: 'Warm pines', icon: 'sun', group: 'land' },
  { key: 'night', label: 'Night', description: 'Deep hush', icon: 'moon', group: 'land' },
  { key: 'rain', label: 'Rain', description: 'Soft mist', icon: 'rain', group: 'land' },
  { key: 'ocean', label: 'Ocean', description: 'Open tide', icon: 'waves', group: 'marine' },
  { key: 'whale', label: 'Whale', description: 'Low hums', icon: 'whale', group: 'marine' },
  { key: 'dolphin', label: 'Dolphin', description: 'Bright clicks', icon: 'dolphin', group: 'marine' },
  { key: 'sleep', label: 'Sleep', description: 'Slow drift', icon: 'sleep', group: 'marine' },
];

const SCENE_OPTIONS = [
  { value: 'morning', label: 'Forest' },
  { value: 'rain', label: 'Rain' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'whale', label: 'Whale' },
  { value: 'dolphin', label: 'Dolphin' },
  { value: 'sleep', label: 'Sleep' },
];

const COMPANION_OPTIONS = [
  { value: 'none', label: 'No companion' },
  { value: 'whale', label: 'Whale' },
  { value: 'dolphin', label: 'Dolphin' },
  { value: 'sleep', label: 'Sleep drift' },
];

function SunIcon({ active }: { active: boolean }) {
  const color = active ? '#D4A574' : '#2C3E2D';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ active }: { active: boolean }) {
  const color = active ? '#D4A574' : '#2C3E2D';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function RainIcon({ active }: { active: boolean }) {
  const color = active ? '#D4A574' : '#2C3E2D';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9" />
      <line x1="8" y1="17" x2="8" y2="21" />
      <line x1="8" y1="13" x2="8" y2="13" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="16" y1="15" x2="16" y2="19" />
    </svg>
  );
}

function WavesIcon({ active }: { active: boolean }) {
  const color = active ? '#D4A574' : '#2C3E2D';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
      <path d="M2 16c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
      <path d="M2 8c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
    </svg>
  );
}

function WhaleIcon({ active }: { active: boolean }) {
  const color = active ? '#D4A574' : '#2C3E2D';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12c0-4 3-7 7-7h5c3 0 5 2 5 4 0 2-2 3-5 3h-4" />
      <path d="M18 10c2.5 0 4 1.5 4 3.5S20.5 17 18 17h-2" />
      <path d="M8 9c-1 0-2 .5-2 2 0 1.5 1 2 2 2" />
      <path d="M10 12h4" />
    </svg>
  );
}

function DolphinIcon({ active }: { active: boolean }) {
  const color = active ? '#D4A574' : '#2C3E2D';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12c2-2 4-3 7-3 2 0 5 1 7 3-2 2-5 3-7 3-3 0-5-1-7-3Z" />
      <path d="M14 9c2 0 4 1 5 3-1 2-3 3-5 3" />
      <path d="M7 12h4" />
    </svg>
  );
}

function SleepIcon({ active }: { active: boolean }) {
  const color = active ? '#D4A574' : '#2C3E2D';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8c2.5-2 5-2.5 8-1.5C13 6 12 7 12 8c0 2.2 2.2 4 5 4" />
      <path d="M5 15c2-1.5 4-2 6-2 2.5 0 4.5 1 6 2" />
      <path d="M7 19c2-1 4-1.5 6-1.5s4 .5 6 1.5" />
    </svg>
  );
}

export default function PresetPanel({ currentPreset, onPresetChange }: PresetPanelProps) {
  const [sceneKey, setSceneKey] = useState(currentPreset);
  const [companionKey, setCompanionKey] = useState('none');

  useEffect(() => {
    const isKnownScene = PRESET_DATA.some((preset) => preset.key === currentPreset);
    setSceneKey(isKnownScene ? currentPreset : 'morning');
    setCompanionKey(currentPreset === 'whale' || currentPreset === 'dolphin' || currentPreset === 'sleep' ? currentPreset : 'none');
  }, [currentPreset]);

  const iconMap: Record<string, FC<{ active: boolean }>> = {
    sun: SunIcon,
    moon: MoonIcon,
    rain: RainIcon,
    waves: WavesIcon,
    whale: WhaleIcon,
    dolphin: DolphinIcon,
    sleep: SleepIcon,
  };

  const activePreset = PRESET_DATA.find((preset) => preset.key === currentPreset) ?? PRESET_DATA[0];
  const landPresets = PRESET_DATA.filter((preset) => preset.group === 'land');
  const marinePresets = PRESET_DATA.filter((preset) => preset.group === 'marine');

  const handleSceneChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextScene = event.target.value;
    setSceneKey(nextScene);
    onPresetChange(nextScene);
  };

  const handleCompanionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextCompanion = event.target.value;
    setCompanionKey(nextCompanion);
    onPresetChange(nextCompanion === 'none' ? sceneKey : nextCompanion);
  };

  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-[rgba(44,62,45,0.12)] bg-[rgba(245,240,232,0.7)] p-3 shadow-[0_20px_60px_rgba(44,62,45,0.12)] backdrop-blur-[14px]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[rgba(44,62,45,0.45)]">Atmospheres</p>
          <p className="text-sm font-medium text-[#2C3E2D]">{activePreset.label}</p>
          <p className="text-[12px] text-[rgba(44,62,45,0.6)]">{activePreset.description}</p>
        </div>
        <div className="rounded-full bg-[rgba(212,165,116,0.16)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#D4A574]">
          Live mix
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[rgba(44,62,45,0.55)]">
          Scene
          <select
            value={sceneKey}
            onChange={handleSceneChange}
            className="rounded-xl border border-[rgba(44,62,45,0.15)] bg-white/70 px-3 py-2 text-sm font-normal text-[#2C3E2D] outline-none"
            data-cursor="expand"
          >
            {SCENE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[rgba(44,62,45,0.55)]">
          Companion
          <select
            value={companionKey}
            onChange={handleCompanionChange}
            className="rounded-xl border border-[rgba(44,62,45,0.15)] bg-white/70 px-3 py-2 text-sm font-normal text-[#2C3E2D] outline-none"
            data-cursor="expand"
          >
            {COMPANION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-[20px] border border-[rgba(212,165,116,0.24)] bg-[linear-gradient(135deg,rgba(248,243,235,0.95),rgba(236,247,243,0.95))] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[rgba(44,62,45,0.48)]">Marine scenes</p>
          <p className="text-[11px] text-[rgba(44,62,45,0.6)]">Whale and dolphin ready</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {marinePresets.map((preset) => {
            const active = currentPreset === preset.key;
            const Icon = iconMap[preset.icon];
            return (
              <button
                key={preset.key}
                onClick={() => onPresetChange(preset.key)}
                className="relative flex min-h-[92px] flex-col items-start justify-between rounded-[18px] border px-3 py-3 text-left transition-all duration-400"
                style={{
                  borderColor: active ? '#D4A574' : 'rgba(44, 62, 45, 0.16)',
                  background: active ? 'rgba(212, 165, 116, 0.16)' : 'rgba(255,255,255,0.7)',
                }}
                data-cursor="expand"
              >
                {active && (
                  <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#D4A574]" />
                )}
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-[rgba(44,62,45,0.08)] p-2">
                    <Icon active={active} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#2C3E2D]">{preset.label}</p>
                    <p className="text-[11px] text-[rgba(44,62,45,0.64)]">{preset.description}</p>
                  </div>
                </div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em]" style={{ color: active ? '#D4A574' : 'rgba(44, 62, 45, 0.55)' }}>
                  {active ? 'Playing now' : 'Tap to play'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {landPresets.map((preset) => {
          const active = currentPreset === preset.key;
          const Icon = iconMap[preset.icon];
          return (
            <button
              key={preset.key}
              onClick={() => onPresetChange(preset.key)}
              className="relative flex min-h-[74px] items-center gap-2 rounded-[16px] border px-3 py-3 text-left transition-all duration-400"
              style={{
                borderColor: active ? '#D4A574' : 'rgba(44, 62, 45, 0.15)',
                background: active ? 'rgba(212, 165, 116, 0.16)' : 'rgba(255,255,255,0.55)',
              }}
              data-cursor="expand"
            >
              {active && (
                <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#D4A574]" />
              )}
              <div className="rounded-full bg-[rgba(44,62,45,0.08)] p-2">
                <Icon active={active} />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#2C3E2D]">{preset.label}</p>
                <p className="text-[11px] text-[rgba(44,62,45,0.64)]">{preset.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
