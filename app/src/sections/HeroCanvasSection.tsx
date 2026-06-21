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
          className="begin-overlay absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
          onClick={handleBegin}
          role="button"
          tabIndex={0}
          aria-label="Start audio experience"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBegin(); }}
        >
          <div
            className="px-7 py-3 rounded-3xl text-sm font-normal uppercase tracking-[0.1em] text-[#2C3E2D]"
            style={{
              background: 'rgba(245, 240, 232, 0.7)',
              backdropFilter: 'blur(8px)',
              animation: 'pulse 3s ease-in-out infinite',
            }}
          >
            Click anywhere to begin
          </div>
        </div>
      )}

      {!showFAB && (
        <>
          <div className="absolute bottom-6 left-6 z-20">
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
