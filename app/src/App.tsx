import { useCallback } from 'react';
import Navigation from '@/components/Navigation';
import CustomCursor from '@/components/CustomCursor';
import HeroCanvasSection from '@/sections/HeroCanvasSection';
import SoundLibrarySection from '@/sections/SoundLibrarySection';
import CreateSoundscapeSection from '@/sections/CreateSoundscapeSection';
import CommunityGallerySection from '@/sections/CommunityGallerySection';
import AboutSection from '@/sections/AboutSection';
import { useLenis } from '@/hooks/useLenis';

export default function App() {
  useLenis();

  const scrollTo = useCallback((id: string) => {
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="relative">
      <CustomCursor />
      <Navigation onScrollTo={scrollTo} />

      <main>
        <HeroCanvasSection />
        <SoundLibrarySection />
        <CreateSoundscapeSection />
        <CommunityGallerySection />
        <AboutSection onScrollToTop={scrollToTop} />
      </main>
    </div>
  );
}
