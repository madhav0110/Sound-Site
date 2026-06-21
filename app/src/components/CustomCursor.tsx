import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const expanded = useRef(false);

  useEffect(() => {
    // Hide on touch devices
    if ('ontouchstart' in window) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const onEnterInteractive = () => {
      expanded.current = true;
      if (cursor) {
        cursor.style.width = '40px';
        cursor.style.height = '40px';
        cursor.style.background = 'rgba(212, 165, 116, 0.15)';
        cursor.style.borderColor = '#D4A574';
      }
    };

    const onLeaveInteractive = () => {
      expanded.current = false;
      if (cursor) {
        cursor.style.width = '8px';
        cursor.style.height = '8px';
        cursor.style.background = 'transparent';
        cursor.style.borderColor = 'rgba(44, 62, 45, 0.4)';
      }
    };

    const setupListeners = () => {
      document.addEventListener('mousemove', onMove);

      const interactiveEls = document.querySelectorAll('[data-cursor="expand"], button, a, [role="button"]');
      interactiveEls.forEach((el) => {
        el.addEventListener('mouseenter', onEnterInteractive);
        el.addEventListener('mouseleave', onLeaveInteractive);
      });

      return () => {
        document.removeEventListener('mousemove', onMove);
        interactiveEls.forEach((el) => {
          el.removeEventListener('mouseenter', onEnterInteractive);
          el.removeEventListener('mouseleave', onLeaveInteractive);
        });
      };
    };

    let cleanup = setupListeners();

    // Re-setup when DOM changes
    const observer = new MutationObserver(() => {
      cleanup();
      cleanup = setupListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12;
      pos.current.y += (target.current.y - pos.current.y) * 0.12;
      if (cursor) {
        cursor.style.transform = `translate(${pos.current.x - (expanded.current ? 20 : 4)}px, ${pos.current.y - (expanded.current ? 20 : 4)}px)`;
      }
      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      cleanup();
    };
  }, []);

  // Don't render on touch devices
  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 w-2 h-2 rounded-full border border-[rgba(44,62,45,0.4)] pointer-events-none z-[9999] transition-[width,height,background,border-color] duration-300 hidden md:block"
      style={{ willChange: 'transform' }}
    />
  );
}
