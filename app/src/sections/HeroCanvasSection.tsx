import { useEffect, useRef, useCallback, useState } from 'react';
import {
  createScene,
  animateScene,
  updateCameraParallax,
  raycast,
  resizeScene,
  destroyScene,
  pulseTree,
  getTreeScreenPositions,
} from '@/lib/threeScene';
import {
  initParticleOverlay,
  emitBurst,
  emitWaterParticles,
  emitGroundDust,
  resizeOverlay,
  destroyOverlay,
} from '@/lib/particleOverlay';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import PresetPanel from '@/components/PresetPanel';
import SoundMixer from '@/components/SoundMixer';
import gsap from 'gsap';

export default function HeroCanvasSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneInitialized = useRef(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [scrollIndicatorVisible, setScrollIndicatorVisible] = useState(true);
  const [showFAB, setShowFAB] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const audio = useAudioEngine();

  const handleBegin = useCallback(async () => {
    if (!audio.initialized) {
      await audio.initialize();
    }
    gsap.to('.begin-overlay', { opacity: 0, duration: 1, onComplete: () => setShowOverlay(false) });
  }, [audio]);

  useEffect(() => {
    if (!containerRef.current || sceneInitialized.current) return;
    sceneInitialized.current = true;

    const container = containerRef.current;
    createScene(container);
    initParticleOverlay(container);
    animateScene();

    const sceneEl = container.querySelector('canvas');
    if (sceneEl) {
      gsap.fromTo(sceneEl, { opacity: 0 }, { opacity: 1, duration: 2 });
    }

    const onScroll = () => {
      if (window.scrollY > 50) setScrollIndicatorVisible(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      resizeScene(w, h);
      resizeOverlay(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      destroyScene();
      destroyOverlay();
    };
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      updateCameraParallax(x, -y);
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  const getPanFromClientX = (clientX: number) => clientX / window.innerWidth * 2 - 1;

  const handleExploreScenes = useCallback(() => {
    const target = document.getElementById('library');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleCanvasInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!sceneInitialized.current) return;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const ndcX = (clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(clientY / window.innerHeight) * 2 + 1;
    const hits = raycast(ndcX, ndcY);

    if (hits.length > 0) {
      const hit = hits[0];
      const objType = hit.object.name || hit.object.userData?.type;

      if (objType === 'canopy' || objType === 'tree') {
        const treePositions = getTreeScreenPositions();
        let closestIdx = -1;
        let closestDist = Infinity;
        treePositions.forEach((tp, idx) => {
          const dx = tp.x - clientX;
          const dy = tp.y - clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = idx;
          }
        });

        if (closestIdx >= 0) {
          pulseTree(closestIdx);
          const pan = getPanFromClientX(treePositions[closestIdx].x);
          audio.triggerWind(pan);
          setTimeout(() => audio.triggerBirds(pan), 300);
          emitBurst(clientX, clientY, 25);
        }
      } else if (objType === 'water') {
        audio.triggerWater(0.5);
        emitWaterParticles(clientX, clientY);
      } else if (objType === 'ground') {
        audio.playFootstep(getPanFromClientX(clientX));
        emitGroundDust(clientX, clientY);
      }
    }

    if (!audio.initialized && showOverlay) {
      handleBegin();
    }
  }, [audio, showOverlay, handleBegin]);

  const isDragging = useRef(false);
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    handleCanvasInteraction(e);
  }, [handleCanvasInteraction]);

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    let clientX: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }
    audio.triggerWater(0.3);
    emitWaterParticles(clientX, (e as React.MouseEvent).clientY);
  }, [audio]);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const checkMobile = () => setShowFAB(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{ touchAction: 'none' }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
    >
      {showOverlay && (
        <div
          className="begin-overlay absolute inset-0 z-20 flex items-center justify-center cursor-pointer px-4 sm:px-6"
          onClick={handleBegin}
          role="button"
          tabIndex={0}
          aria-label="Start audio experience"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBegin(); }}
        >
          <div className="max-w-[760px] rounded-[32px] border border-[rgba(255,255,255,0.35)] bg-[rgba(245,240,232,0.78)] px-6 py-8 text-center shadow-[0_24px_70px_rgba(44,62,45,0.16)] backdrop-blur-[16px] sm:px-10 sm:py-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[rgba(44,62,45,0.5)]">
              Echoscape • immersive ambience
            </p>
            <h1 className="mt-4 text-[clamp(2.2rem,4.5vw,3.8rem)] font-semibold leading-[0.95] text-[#2C3E2D]">
              Tune into living soundscapes from around the world.
            </h1>
            <p className="mx-auto mt-4 max-w-[620px] text-sm leading-[1.7] text-[rgba(44,62,45,0.72)] sm:text-base">
              Escape, relax, and drift through forests, oceans, whales, dolphins, and sleep scenes designed to breathe with you.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                className="rounded-full bg-[#2C3E2D] px-5 py-2.5 text-sm font-medium uppercase tracking-[0.12em] text-[#F5F0E8] transition-opacity duration-300 hover:opacity-90"
                onClick={(e) => { e.stopPropagation(); handleBegin(); }}
              >
                Start listening
              </button>
              <button
                className="rounded-full border border-[#2C3E2D] px-5 py-2.5 text-sm font-medium uppercase tracking-[0.12em] text-[#2C3E2D] transition-all duration-300 hover:bg-[#2C3E2D] hover:text-[#F5F0E8]"
                onClick={(e) => { e.stopPropagation(); handleExploreScenes(); }}
              >
                Explore scenes
              </button>
            </div>
          </div>
        </div>
      )}

      {!showFAB && (
        <>
          <div className="absolute inset-x-0 top-6 z-20 flex justify-center px-4 sm:px-6">
            <div className="max-w-[720px] rounded-[28px] border border-[rgba(255,255,255,0.28)] bg-[rgba(245,240,232,0.84)] px-4 py-3 shadow-[0_20px_60px_rgba(44,62,45,0.18)] backdrop-blur-[16px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[rgba(44,62,45,0.5)]">Echoscape</p>
                  <h3 className="text-[18px] font-semibold text-[#2C3E2D]">Forest, ocean, whale, dolphin, sleep</h3>
                </div>
                <div className="rounded-full bg-[rgba(212,165,116,0.16)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#D4A574]">
                  {audio.presetName}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 z-20 max-w-[min(92vw,420px)]">
            <PresetPanel
              currentPreset={audio.currentPreset}
              onPresetChange={audio.applyPreset}
            />
          </div>
          <div className="absolute bottom-6 right-6 z-20">
            <SoundMixer
              volume={audio.volume}
              muted={audio.muted}
              presetName={audio.presetName}
              onVolumeChange={audio.setVolume}
              onToggleMute={audio.toggleMute}
            />
          </div>
        </>
      )}

      {showFAB && (
        <>
          <button
            className="absolute bottom-6 right-6 z-20 w-12 h-12 rounded-full bg-[#2C3E2D] flex items-center justify-center shadow-lg"
            onClick={() => setFabOpen(!fabOpen)}
            data-cursor="expand"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {fabOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="8" y1="22" x2="16" y2="22" />
                </>
              )}
            </svg>
          </button>

          {fabOpen && (
            <div className="absolute bottom-20 right-6 z-20 flex flex-col gap-3">
              <div className="rounded-[20px] border border-[rgba(255,255,255,0.24)] bg-[rgba(245,240,232,0.84)] px-3 py-2 shadow-[0_20px_60px_rgba(44,62,45,0.16)] backdrop-blur-[14px]">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[rgba(44,62,45,0.5)]">Scene picker</p>
              </div>
              <PresetPanel
                currentPreset={audio.currentPreset}
                onPresetChange={(k) => { audio.applyPreset(k); setFabOpen(false); }}
              />
              <SoundMixer
                volume={audio.volume}
                muted={audio.muted}
                presetName={audio.presetName}
                onVolumeChange={audio.setVolume}
                onToggleMute={audio.toggleMute}
              />
            </div>
          )}
        </>
      )}

      {scrollIndicatorVisible && (
        <div
          className="absolute bottom-8 left-1/2 z-20 opacity-40"
          style={{ animation: 'bounce 2s ease-in-out infinite', transform: 'translateX(-50%)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C3E2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
      `}</style>
    </section>
  );
}
