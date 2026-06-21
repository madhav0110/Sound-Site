import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getAnalyser } from '@/lib/audioEngine';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    title: 'Touch to Activate',
    desc: 'Tap any element in the scene to add its sound to the mix. Tap again to remove it.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4A574" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
        <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
      </svg>
    ),
  },
  {
    title: 'Drag to Modulate',
    desc: 'Dragging across water or ground changes the sound in real-time. Speed affects pitch and intensity.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4A574" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
        <path d="M2 16c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
      </svg>
    ),
  },
  {
    title: 'Save & Share',
    desc: 'Capture your current mix as a shareable link. Anyone can open it and hear what you created.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4A574" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
];

function FrequencyVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const barHeights = useRef<number[]>(new Array(128).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    let idlePhase = 0;

    const draw = () => {
      const analyser = getAnalyser();
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx!.clearRect(0, 0, w, h);

      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);

        const barCount = 128;
        const barW = (w - barCount + 1) / barCount;

        for (let i = 0; i < barCount; i++) {
          const targetH = (data[i] / 255) * h * 0.9;
          barHeights.current[i] += (targetH - barHeights.current[i]) * 0.15;
          const bh = barHeights.current[i];

          // Gradient color
          const t = i / barCount;
          let r: number, g: number, b: number;
          if (t < 0.33) {
            const lt = t / 0.33;
            r = Math.round(212 * (1 - lt) + 123 * lt);
            g = Math.round(165 * (1 - lt) + 163 * lt);
            b = Math.round(116 * (1 - lt) + 168 * lt);
          } else if (t < 0.66) {
            const lt = (t - 0.33) / 0.33;
            r = Math.round(123 * (1 - lt) + 245 * lt);
            g = Math.round(163 * (1 - lt) + 240 * lt);
            b = Math.round(168 * (1 - lt) + 232 * lt);
          } else {
            const lt = (t - 0.66) / 0.34;
            r = 245;
            g = 240;
            b = Math.round(232 + (232 - 232) * lt);
          }

          ctx!.fillStyle = `rgba(${r},${g},${b},0.7)`;
          ctx!.fillRect(i * (barW + 1), h - bh, barW, bh);
        }
      } else {
        // Idle animation
        idlePhase += 0.01;
        const barCount = 128;
        const barW = (w - barCount + 1) / barCount;

        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(idlePhase + i * 0.05) * 0.5 + 0.5;
          const bh = h * 0.1 + wave * h * 0.05;

          const t = i / barCount;
          let r: number, g: number, b: number;
          if (t < 0.33) {
            r = 212; g = 165; b = 116;
          } else if (t < 0.66) {
            r = 123; g = 163; b = 168;
          } else {
            r = 245; g = 240; b = 232;
          }

          ctx!.fillStyle = `rgba(${r},${g},${b},0.2)`;
          ctx!.fillRect(i * (barW + 1), h - bh, barW, bh);
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="w-full h-[400px] md:h-[400px] rounded-2xl bg-[rgba(245,240,232,0.05)] border border-[rgba(245,240,232,0.1)] overflow-hidden relative">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <span className="absolute bottom-3 left-3 text-[10px] font-normal text-[rgba(245,240,232,0.3)] font-['Inter']">
        Live frequency analysis
      </span>
    </div>
  );
}

export default function CreateSoundscapeSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const leftCol = sectionRef.current.querySelector('.left-col');
    const rightCol = sectionRef.current.querySelector('.right-col');
    const features = sectionRef.current.querySelectorAll('.feature-item');

    if (leftCol) {
      gsap.fromTo(leftCol,
        { opacity: 0, x: -30 },
        {
          opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
        }
      );
    }

    if (rightCol) {
      gsap.fromTo(rightCol,
        { opacity: 0, x: 30 },
        {
          opacity: 1, x: 0, duration: 1, ease: 'power2.out', delay: 0.2,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
        }
      );
    }

    if (features.length) {
      gsap.fromTo(features,
        { opacity: 0, y: 15 },
        {
          opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.15,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section
      id="create"
      ref={sectionRef}
      className="bg-[#2C3E2D] px-[4vw] py-[120px]"
    >
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[45%_55%] gap-[60px] items-center">
        <div className="left-col">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[rgba(245,240,232,0.4)] mb-4 font-['Inter']">
            CREATE
          </p>
          <h2 className="text-[36px] font-light leading-[1.3] text-[#F5F0E8] font-['Cormorant_Garamond'] italic">
            Shape the Sound Around You
          </h2>
          <p className="text-base font-normal text-[rgba(245,240,232,0.7)] leading-[1.7] mt-6 max-w-[420px] font-['Inter']">
            Click a tree to invite the wind. Drag across water to create ripples. Every interaction layers a new sound into your personal soundscape. There are no wrong combinations — only new atmospheres waiting to emerge.
          </p>

          <div className="mt-10 flex flex-col gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-item flex gap-4 items-start">
                <div className="w-9 h-9 rounded-full bg-[rgba(212,165,116,0.15)] border border-[rgba(212,165,116,0.3)] flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#F5F0E8] font-['Inter']">
                    {f.title}
                  </h4>
                  <p className="text-[13px] font-normal text-[rgba(245,240,232,0.5)] mt-1 font-['Inter']">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="right-col">
          <FrequencyVisualizer />
        </div>
      </div>
    </section>
  );
}
