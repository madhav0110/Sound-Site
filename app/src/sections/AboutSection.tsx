import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AboutSectionProps {
  onScrollToTop: () => void;
}

export default function AboutSection({ onScrollToTop }: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const decor = sectionRef.current.querySelector('.decor-line');
    const quote = sectionRef.current.querySelector('.quote-text');
    const manifesto = sectionRef.current.querySelector('.manifesto');
    const bottom = sectionRef.current.querySelector('.bottom-text');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
      },
    });

    if (decor) {
      tl.fromTo(decor, { width: 0 }, { width: 40, duration: 1, ease: 'power2.out' }, 0);
    }
    if (quote) {
      tl.fromTo(quote, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 0.3);
    }
    if (manifesto) {
      tl.fromTo(manifesto, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.6);
    }
    if (bottom) {
      tl.fromTo(bottom, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1);
    }

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="bg-[#2C3E2D] px-[4vw] py-[160px] md:py-[160px]"
    >
      <div className="max-w-[720px] mx-auto text-center">
        <div className="decor-line h-[1px] bg-[#D4A574] mx-auto mb-8" style={{ width: 0 }} />

        <p className="quote-text text-xl md:text-2xl font-light italic text-[#F5F0E8] leading-[1.6] font-['Inter'] opacity-0">
          "Remember forests? This is a place to breathe, rest, and protect what keeps us alive."
        </p>

        <div className="manifesto mt-12 opacity-0">
          <p className="text-base font-normal text-[rgba(245,240,232,0.6)] leading-[1.8] font-['Inter']">
            Echoscape is an experiment in generative sound design. Every tone you hear is synthesized in real-time — no recordings, no loops, no repetition. The wind is filtered noise. The birds are FM oscillators. The water is sculpted static.
          </p>
          <p className="text-base font-normal text-[rgba(245,240,232,0.6)] leading-[1.8] font-['Inter'] mt-5">
            We believe that sound, like nature, should be alive. It should breathe, shift, and surprise. This is not background noise. This is a landscape you can walk through, touch, and reshape.
          </p>
        </div>

        <div className="bottom-text mt-20 opacity-0">
          <p className="text-xs font-normal text-[rgba(245,240,232,0.3)] font-['Inter']">
            Built with Web Audio API, Three.js, and a lot of patience.
          </p>

          <button
            onClick={onScrollToTop}
            className="mt-10 text-sm font-medium uppercase tracking-[0.1em] text-[#D4A574] border-b border-[#D4A574] pb-0.5 hover:text-[#F5F0E8] hover:border-[#F5F0E8] transition-all duration-400 font-['Inter']"
            data-cursor="expand"
          >
            Return to the landscape
          </button>
        </div>
      </div>
    </section>
  );
}
