import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface CommunitySoundscape {
  name: string;
  creator: string;
  sounds: string[];
  createdAgo: string;
  colorSeed: number;
}

const COMMUNITY_DATA: CommunitySoundscape[] = [
  { name: 'Morning Mist', creator: 'elara', sounds: ['#D4A574', '#7BA3A8', '#4A7C59', '#E8DFD0'], createdAgo: '2 hours ago', colorSeed: 1 },
  { name: 'Midnight Crickets', creator: 'forest_walker', sounds: ['#E8DFD0', '#D4A574', '#5C4033'], createdAgo: '1 day ago', colorSeed: 2 },
  { name: 'Ocean Breeze', creator: 'seaside', sounds: ['#7BA3A8', '#D4A574', '#4A7C59', '#E8DFD0'], createdAgo: '3 days ago', colorSeed: 3 },
  { name: 'Thunder Waiting', creator: 'stormchaser', sounds: ['#5C4033', '#7BA3A8'], createdAgo: '5 days ago', colorSeed: 4 },
  { name: 'Pine Ridge', creator: 'mountain_dew', sounds: ['#4A7C59', '#D4A574', '#E8DFD0', '#5C4033', '#7BA3A8'], createdAgo: '1 week ago', colorSeed: 5 },
  { name: 'Dawn Chorus', creator: 'earlybird', sounds: ['#D4A574', '#7BA3A8', '#E8DFD0'], createdAgo: '1 week ago', colorSeed: 6 },
  { name: 'Still Pond', creator: 'zen_master', sounds: ['#7BA3A8', '#E8DFD0'], createdAgo: '2 weeks ago', colorSeed: 7 },
  { name: 'Wind Cathedral', creator: 'airy', sounds: ['#D4A574', '#E8C8A0', '#F5F0E8', '#7BA3A8'], createdAgo: '3 weeks ago', colorSeed: 8 },
];

const PALETTE = ['#D4A574', '#7BA3A8', '#5C4033', '#4A7C59', '#C8D8E4'];

function getColorFromSeed(seed: number, index: number): string {
  return PALETTE[(seed + index) % PALETTE.length];
}

function WaveformCanvas({ seed }: { seed: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    const numBars = 50;
    const barW = (w - (numBars - 1) * 2) / numBars;

    const draw = () => {
      ctx!.clearRect(0, 0, w, h);
      offsetRef.current += 0.2;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barW + 2);
        // Unique multi-sine pattern per card
        let heightNorm = 0;
        for (let s = 0; s < 3; s++) {
          const freq = (0.03 + s * 0.02) * (1 + seed * 0.1);
          const phase = seed * 0.5 + s * 1.3 + offsetRef.current * (0.01 + s * 0.005);
          heightNorm += Math.sin(i * freq + phase) * (0.3 + s * 0.2);
        }
        heightNorm = (heightNorm / 1.5 + 1) * 0.5; // normalize to 0-1
        heightNorm = 0.2 + heightNorm * 0.8; // clamp to 20-100%

        const bh = heightNorm * h * 0.8;
        const by = (h - bh) / 2;

        const color = getColorFromSeed(seed, i % PALETTE.length);
        ctx!.fillStyle = color + '60';
        ctx!.beginPath();
        ctx!.roundRect(x, by, barW, bh, [2, 2, 0, 0]);
        ctx!.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [seed]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
    />
  );
}

export default function CommunityGallerySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (!sectionRef.current) return;

    const header = sectionRef.current.querySelector('.gallery-header');
    if (header) {
      gsap.fromTo(header,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const handleScroll = () => {
    if (showHint) setShowHint(false);
  };

  return (
    <section
      id="community"
      ref={sectionRef}
      className="bg-[#F5F0E8] pl-[4vw] pr-0 py-[120px]"
    >
      <div className="gallery-header pr-[4vw] mb-[60px]">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[rgba(44,62,45,0.4)] mb-4 font-['Inter']">
          COMMUNITY
        </p>
        <h2 className="text-[36px] font-light leading-[1.3] text-[#2C3E2D] font-['Cormorant_Garamond'] italic">
          Soundscapes Made by Listeners
        </h2>
        <p className="text-base font-normal text-[rgba(44,62,45,0.5)] max-w-[500px] mt-4 font-['Inter']">
          Explore combinations created by the community. Each link opens a living, breathing soundscape.
        </p>
      </div>

      <div
        ref={galleryRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-5 pr-[4vw]"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        onScroll={handleScroll}
      >
        {COMMUNITY_DATA.map((item) => (
          <div
            key={item.name}
            className="w-[280px] md:w-[280px] sm:w-[240px] flex-shrink-0 scroll-snap-align-start bg-white rounded-2xl overflow-hidden border border-[rgba(44,62,45,0.08)] cursor-pointer transition-all duration-400 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_16px_48px_rgba(44,62,45,0.1)]"
            data-cursor="expand"
            onClick={() => { /* Demo - no real navigation */ }}
          >
            <div className="h-[140px] bg-[#F8F5EF] relative overflow-hidden">
              <WaveformCanvas seed={item.colorSeed} />
            </div>
            <div className="p-5">
              <h3 className="text-base font-medium text-[#2C3E2D] font-['Inter']">
                {item.name}
              </h3>
              <p className="text-xs font-normal text-[rgba(44,62,45,0.4)] mt-1 font-['Inter']">
                by {item.creator}
              </p>
              <div className="flex items-center gap-1.5 mt-3">
                {item.sounds.map((color, i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <span className="text-[11px] font-medium text-[rgba(44,62,45,0.4)] ml-1 font-['Inter']">
                  {item.sounds.length} sounds
                </span>
              </div>
              <p className="text-[11px] font-normal text-[rgba(44,62,45,0.3)] mt-2 font-['Inter']">
                Created {item.createdAgo}
              </p>
            </div>
          </div>
        ))}
      </div>

      {showHint && (
        <div className="pr-[4vw] mt-4 text-right">
          <span
            className="text-[11px] font-normal text-[rgba(44,62,45,0.3)] tracking-[0.05em] font-['Inter'] inline-flex items-center gap-1"
            style={{ animation: 'arrowShift 1.5s ease-in-out infinite' }}
          >
            Scroll to explore
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(44,62,45,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </div>
      )}

      <style>{`
        @keyframes arrowShift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
      `}</style>
    </section>
  );
}
