import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SoundCard {
  name: string;
  description: string;
  tag: string;
  tagColor: string;
  bgColor: string;
  pattern: 'wind' | 'water' | 'birds' | 'floor' | 'night' | 'rain';
}

const SOUND_CARDS: SoundCard[] = [
  {
    name: 'Wind',
    description: 'Air moving through branches and grass. Filtered noise with organic frequency modulation.',
    tag: 'NOISE \u2022 LFO',
    tagColor: '#8B6914',
    bgColor: '#FAF7F1',
    pattern: 'wind',
  },
  {
    name: 'Water',
    description: 'Streams, rain, and ocean waves. White noise sculpted by velocity-responsive filters.',
    tag: 'FILTERED NOISE',
    tagColor: '#2E7D8A',
    bgColor: '#F0F6F7',
    pattern: 'water',
  },
  {
    name: 'Birds',
    description: 'FM-synthesized chirps and calls. Each bird has a unique voice that never repeats exactly.',
    tag: 'FM SYNTHESIS',
    tagColor: '#8B6914',
    bgColor: '#FAF7F1',
    pattern: 'birds',
  },
  {
    name: 'Forest Floor',
    description: 'The hum of earth. Sustained drones with microtonal beating create an endless organic texture.',
    tag: 'DRONE \u2022 OSC',
    tagColor: '#5C4033',
    bgColor: '#F5F2EC',
    pattern: 'floor',
  },
  {
    name: 'Night',
    description: 'Crickets, distant wind, and the deep silence between sounds. Sparse, patient, and vast.',
    tag: 'PULSED \u2022 SPARSE',
    tagColor: '#5C6B7A',
    bgColor: '#2C3E2D',
    pattern: 'night',
  },
  {
    name: 'Rain',
    description: 'Droplets on leaves and ground. Rapid-fire filtered noise bursts with random spatial positioning.',
    tag: 'GRANULAR',
    tagColor: '#2E7D8A',
    bgColor: '#F0F6F7',
    pattern: 'rain',
  },
];

function GenerativeCanvas({ pattern }: { pattern: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isVisible = useRef(false);

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

    let time = 0;

    const drawWind = () => {
      ctx!.clearRect(0, 0, w, h);
      ctx!.strokeStyle = '#E8DFD0';
      ctx!.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx!.beginPath();
        const y = h / 2 + (i - 2) * 15;
        for (let x = 0; x < w; x++) {
          const yy = y + Math.sin(x * 0.02 + time * 0.5 + i * 0.8) * 8;
          if (x === 0) ctx!.moveTo(x, yy);
          else ctx!.lineTo(x, yy);
        }
        ctx!.stroke();
      }
    };

    const drawWater = () => {
      ctx!.clearRect(0, 0, w, h);
      ctx!.strokeStyle = '#7BA3A8';
      ctx!.lineWidth = 1;
      const cx = w / 2;
      const cy = h / 2;
      for (let i = 1; i <= 5; i++) {
        const r = ((time * 8 + i * 25) % Math.max(w, h));
        ctx!.beginPath();
        ctx!.arc(cx, cy, r, 0, Math.PI * 2);
        ctx!.globalAlpha = Math.max(0, 1 - r / Math.max(w, h));
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;
    };

    const drawBirds = () => {
      ctx!.clearRect(0, 0, w, h);
      for (let i = 0; i < 3; i++) {
        const t = ((time * 0.5 + i * 0.3) % 2);
        const x = t * w;
        const y = h / 2 - Math.sin(t * Math.PI) * 40;
        ctx!.fillStyle = '#D4A574';
        ctx!.globalAlpha = Math.sin(t * Math.PI) * 0.8;
        ctx!.beginPath();
        ctx!.arc(x, y, 3, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    };

    const drawFloor = () => {
      ctx!.clearRect(0, 0, w, h);
      ctx!.fillStyle = '#5C4033';
      for (let i = 0; i < 30; i++) {
        const x = (Math.sin(i * 1.3 + time * 0.1) * 0.5 + 0.5) * w;
        const y = ((time * 5 + i * 17) % (h + 10)) - 5;
        ctx!.globalAlpha = 0.3 + Math.sin(i + time) * 0.2;
        ctx!.beginPath();
        ctx!.arc(x, y, 2, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    };

    const drawNight = () => {
      ctx!.clearRect(0, 0, w, h);
      ctx!.fillStyle = '#F5F0E8';
      for (let i = 0; i < 18; i++) {
        const x = (i / 18) * w + 10;
        const y = (Math.sin(i * 2.7) * 0.3 + 0.5) * h;
        const pulse = 0.5 + Math.sin(time * (0.5 + i * 0.1)) * 0.5;
        ctx!.globalAlpha = pulse * 0.8;
        ctx!.beginPath();
        ctx!.arc(x, y, 2 + pulse * 2, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    };

    const drawRain = () => {
      ctx!.clearRect(0, 0, w, h);
      ctx!.strokeStyle = '#7BA3A8';
      ctx!.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        const x = (Math.sin(i * 3.1) * 0.5 + 0.5) * w;
        const y = ((time * 30 + i * 23) % (h + 20)) - 10;
        ctx!.beginPath();
        ctx!.moveTo(x - 2, y);
        ctx!.lineTo(x + 2, y + 10);
        ctx!.stroke();
      }
    };

    const patternMap: Record<string, () => void> = {
      wind: drawWind,
      water: drawWater,
      birds: drawBirds,
      floor: drawFloor,
      night: drawNight,
      rain: drawRain,
    };

    const draw = patternMap[pattern] || drawWind;

    const loop = () => {
      if (!isVisible.current) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }
      time += 0.016;
      draw();
      animRef.current = requestAnimationFrame(loop);
    };

    observerRef.current = new IntersectionObserver(
      ([entry]) => { isVisible.current = entry.isIntersecting; },
      { threshold: 0.1 }
    );
    observerRef.current.observe(canvas);

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      observerRef.current?.disconnect();
    };
  }, [pattern]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[200px] block"
    />
  );
}

export default function SoundLibrarySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    // Heading animation
    const heading = sectionRef.current.querySelector('.section-heading');
    if (heading) {
      gsap.fromTo(heading,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: heading, start: 'top 80%' },
        }
      );
    }

    // Card animations
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('.sound-card');
      gsap.fromTo(cards,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power2.out',
          stagger: 0.15,
          scrollTrigger: { trigger: cardsRef.current, start: 'top 80%' },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section
      id="library"
      ref={sectionRef}
      className="bg-[#F5F0E8] px-[4vw] py-[120px]"
    >
      <div className="max-w-[1200px] mx-auto">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[rgba(44,62,45,0.4)] mb-4 font-['Inter']">
          THE SOUND LIBRARY
        </p>
        <h2 className="section-heading text-[36px] font-light leading-[1.3] text-[#2C3E2D] mb-[60px] font-['Cormorant_Garamond'] italic">
          Every Element, a Sound
        </h2>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SOUND_CARDS.map((card) => (
            <div
              key={card.name}
              className="sound-card bg-white rounded-2xl overflow-hidden border border-[rgba(44,62,45,0.08)] transition-all duration-400 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(44,62,45,0.08)]"
            >
              <div
                className="h-[200px] relative overflow-hidden"
                style={{ background: card.pattern === 'night' ? '#2C3E2D' : card.bgColor }}
              >
                <GenerativeCanvas pattern={card.pattern} />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-[#2C3E2D] font-['Inter']">
                  {card.name}
                </h3>
                <p className="text-sm text-[rgba(44,62,45,0.6)] leading-[1.6] mt-2 font-['Inter']">
                  {card.description}
                </p>
                <span
                  className="inline-block text-[10px] font-medium uppercase tracking-[0.1em] px-2.5 py-1 rounded-[10px] mt-4"
                  style={{
                    background: card.pattern === 'night' ? 'rgba(245,240,232,0.12)' : 'rgba(212,165,116,0.12)',
                    color: card.pattern === 'night' ? 'rgba(245,240,232,0.7)' : card.tagColor,
                  }}
                >
                  {card.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
