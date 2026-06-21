interface SoundMixerProps {
  volume: number;
  muted: boolean;
  presetName: string;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
}

export default function SoundMixer({ volume, muted, presetName, onVolumeChange, onToggleMute }: SoundMixerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-[20px] bg-[rgba(245,240,232,0.6)] backdrop-blur-[12px] border border-[rgba(44,62,45,0.1)]">
      <button
        onClick={onToggleMute}
        className="flex items-center justify-center"
        aria-label={muted ? 'Unmute' : 'Mute'}
        data-cursor="expand"
      >
        {muted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C3E2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C3E2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={muted ? 0 : volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="volume-slider"
        aria-label="Master volume"
      />

      <span className="text-[10px] font-normal text-[rgba(44,62,45,0.5)] hidden sm:block">
        {presetName}
      </span>
    </div>
  );
}
