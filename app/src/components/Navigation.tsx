import { useEffect, useState, useCallback } from 'react';

interface NavigationProps {
  onScrollTo: (id: string) => void;
}

export default function Navigation({ onScrollTo }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = useCallback((id: string) => {
    onScrollTo(id);
    setMobileOpen(false);
  }, [onScrollTo]);

  const navLinks = [
    { label: 'Explore', id: 'hero' },
    { label: 'Sounds', id: 'library' },
    { label: 'Create', id: 'create' },
    { label: 'About', id: 'about' },
  ];

  return (
    <>
      <nav
        className="fixed top-0 left-0 w-full h-14 flex items-center justify-between px-[4vw] z-[100] transition-all duration-[600ms]"
        style={{
          background: scrolled ? 'rgba(245, 240, 232, 0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        <button
          onClick={() => handleNav('hero')}
          className="text-sm font-medium uppercase tracking-[0.15em] text-[#2C3E2D] font-['Inter']"
        >
          echoscape
        </button>

        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNav(link.id)}
              className="text-sm font-normal uppercase tracking-[0.08em] text-[#2C3E2D] font-['Inter'] hover:opacity-60 transition-opacity duration-400"
            >
              {link.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleNav('hero')}
          className="hidden md:block text-xs font-medium uppercase tracking-[0.1em] text-[#2C3E2D] border border-[#2C3E2D] rounded-full px-5 py-1.5 hover:bg-[#2C3E2D] hover:text-[#F5F0E8] transition-all duration-400"
        >
          Start Listening
        </button>

        <button
          className="md:hidden flex flex-col gap-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-[2px] bg-[#2C3E2D] transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
          <span className={`block w-5 h-[2px] bg-[#2C3E2D] transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-[2px] bg-[#2C3E2D] transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[3px]' : ''}`} />
        </button>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-[99] bg-[#F5F0E8]/95 backdrop-blur-md flex flex-col items-center justify-center gap-8 md:hidden">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNav(link.id)}
              className="text-[28px] font-normal text-[#2C3E2D] font-['Inter']"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => handleNav('hero')}
            className="text-sm font-medium uppercase tracking-[0.1em] text-[#2C3E2D] border border-[#2C3E2D] rounded-full px-6 py-2 mt-4"
          >
            Start Listening
          </button>
        </div>
      )}
    </>
  );
}
