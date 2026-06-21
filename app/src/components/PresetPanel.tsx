interface PresetPanelProps {
  currentPreset: string;
  onPresetChange: (key: string) => void;
}

const PRESET_DATA = [
  { key: 'morning', label: 'Morning', icon: 'sun' },
  { key: 'night', label: 'Night', icon: 'moon' },
  { key: 'rain', label: 'Rain', icon: 'rain' },
  { key: 'ocean', label: 'Ocean', icon: 'waves' },
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

export default function PresetPanel({ currentPreset, onPresetChange }: PresetPanelProps) {
  const iconMap: Record<string, React.FC<{ active: boolean }>> = {
    sun: SunIcon,
    moon: MoonIcon,
    rain: RainIcon,
    waves: WavesIcon,
  };

  return (
    <div className="flex gap-3 p-3 rounded-2xl bg-[rgba(245,240,232,0.6)] backdrop-blur-[12px] border border-[rgba(44,62,45,0.1)]">
      {PRESET_DATA.map((preset) => {
        const active = currentPreset === preset.key;
        const Icon = iconMap[preset.icon];
        return (
          <button
            key={preset.key}
            onClick={() => onPresetChange(preset.key)}
            className="relative w-[72px] h-[72px] rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-400"
            style={{
              borderColor: active ? '#D4A574' : 'rgba(44, 62, 45, 0.15)',
              background: active ? 'rgba(212, 165, 116, 0.15)' : 'transparent',
            }}
            data-cursor="expand"
          >
            {active && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#D4A574]" />
            )}
            <Icon active={active} />
            <span
              className="text-[9px] font-medium uppercase tracking-[0.1em] transition-colors duration-300"
              style={{ color: active ? '#D4A574' : 'rgba(44, 62, 45, 0.6)' }}
            >
              {preset.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
