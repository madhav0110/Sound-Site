# Echoscape — Technical Specification

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.1 | UI framework |
| react-dom | ^19.1 | React DOM renderer |
| vite | ^6.3 | Build tool |
| @vitejs/plugin-react | ^4.5 | Vite React plugin |
| typescript | ^5.8 | Type safety |
| @types/react | ^19.1 | React type definitions |
| @types/react-dom | ^19.1 | React DOM type definitions |
| three | ^0.175 | 3D scene rendering |
| @types/three | ^0.175 | Three.js type definitions |
| gsap | ^3.13 | Animation engine, ScrollTrigger, SplitText |
| lenis | ^1.3 | Smooth scroll |
| tailwindcss | ^4.1 | Utility-first CSS |
| @tailwindcss/vite | ^4.1 | Tailwind Vite integration |

No shadcn/ui components needed — the entire design is bespoke procedural visuals with no standard form patterns.

---

## Component Inventory

### Layout

| Component | Source | Reuse |
|-----------|--------|-------|
| Navigation | Custom | Single — top bar with scroll-aware background, mobile hamburger overlay |
| CustomCursor | Custom | Single — RAF-based lerp follower, `data-cursor="expand"` detection |
| Footer | Custom | Single — removed from final build per user edit |

### Sections

| Component | Source | Notes |
|-----------|--------|-------|
| HeroCanvasSection | Custom | Full-viewport container for 3D canvas + all overlay UI (begin overlay, presets, mixer, scroll indicator) |
| SoundLibrarySection | Custom | 3-column card grid, each card hosts a generative Canvas 2D thumbnail |
| CreateSoundscapeSection | Custom | Two-column dark section with text + real-time frequency analyzer |
| CommunityGallerySection | Custom | Horizontal-scroll gallery with snap, 8 soundscape cards |
| AboutSection | Custom | Centered text block on dark background |

### Reusable Components

| Component | Source | Used By |
|-----------|--------|---------|
| GenerativeCanvas | Custom | 6 sound library cards + 8 community cards — accepts a `pattern` prop to select the animation type, handles IntersectionObserver start/pause |
| SoundscapeCard | Custom | CommunityGallerySection — card with generative waveform thumbnail + metadata |
| FrequencyVisualizer | Custom | CreateSoundscapeSection — AnalyserNode-driven bar visualization with idle fallback |
| SoundMixer | Custom | HeroCanvasSection — mute toggle + volume slider + preset label |
| PresetPanel | Custom | HeroCanvasSection — 4 preset buttons with active state |

### Hooks

| Hook | Purpose |
|------|---------|
| useAudioEngine | Initializes and manages the Web Audio API graph: AudioContext, master gain, compressor, all sound source nodes (noise generators, oscillators, FM synthesis), spatial panners, per-source gain nodes, AnalyserNode. Handles user-gesture resume, preset crossfades (3s linear interpolation), mute, master volume |
| useThreeScene | Sets up the Three.js renderer, camera, scene, lighting, all meshes (ground, trees, water, sky), particle systems, and raycaster. Manages camera parallax from mouse position. Returns scene ref and raycasting function |
| useCanvas2DParticles | Canvas 2D overlay for interaction burst particles — RAF loop, spawn/emit/update/draw, max 200 alive |
| useLenis | Initializes Lenis smooth scroll with GSAP ScrollTrigger integration |

---

## Animation Implementation

| Animation | Library | Implementation Approach | Complexity |
|-----------|---------|------------------------|------------|
| Custom cursor follow | Vanilla JS | RAF loop with lerp(0.12) toward mouse position. CSS transitions handle size/color change on hover targets via `data-cursor="expand"` | Low |
| Smooth scroll | Lenis | Lenis instance with `lerp: 0.08, duration: 1.2`. Wired to GSAP ScrollTrigger ticker | Low |
| Canvas scene entrance | GSAP | Timeline: renderer opacity 0→1 (2s), camera y 5→3 (3s, power2.out), tree scale elastic stagger, water opacity, sky opacity, particle fade — all sequenced | Medium |
| Camera parallax | Three.js | Per-frame lerp(0.05) of camera.position from normalized mouse coords (±3° max) | Low |
| Three.js tree sway | Custom GLSL | Vertex shader: `sin(time * 0.5 + position.x) * 0.02` displacement on canopy mesh | Medium |
| Three.js water ripples | Custom GLSL | Vertex shader: combined sin/cos displacement. Fragment shader: teal-to-transparent gradient + specular highlights. Separate ring geometry spawned on drag, scales+fade over 2s | Medium |
| Three.js atmospheric particles | Three.js | BufferGeometry Points with 500 vertices, Brownian drift per particle, additive blending, fade+respawn outside bounds | Medium |
| Canvas 2D burst particles | Vanilla JS | Separate `<canvas>` overlay with `globalCompositeOperation: 'lighter'`. 200 max particles with gravity, shrinking, fading. Tree click = burst, water drag = continuous, ground click = dust burst | Medium |
| Organic wave text | GSAP + SplitText | SplitText per-character, `staggerFrom` with rotateX/translateY on ScrollTrigger. Post-reveal: per-character float via `sin(time * 2 + index * 0.5)` in RAF | Medium |
| Scroll-triggered section reveals | GSAP ScrollTrigger | Standard fade+translateY patterns with stagger for cards/items. `start: "top 80%"`, `toggleActions: "play none none none"` | Low |
| Sound library card generative canvases | Vanilla JS | 6 distinct Canvas 2D animations (sine waves, ripples, parabolic dots, drifting particles, pulsing stars, falling streaks). Each starts/pauses via IntersectionObserver | Medium |
| Frequency analyzer bars | Web Audio API + Canvas 2D | AnalyserNode(fftSize: 256) → 128 bars, lerp(0.15) between current/target height per frame. Idle: 10% bars with traveling sine ripple | Medium |
| Community card waveforms | Vanilla JS | Hashed seed from soundscape ID drives unique multi-sine bar pattern per card. Slow horizontal drift (0.2px/frame) | Low |
| Preset crossfade | Custom | 3-second linear interpolation of all per-source gain values via requestAnimationFrame | Low |
| Begin overlay pulse | CSS / RAF | Opacity oscillates `sin(time * 2) * 0.2 + 0.8`. Click → fade out 1s → remove | Low |
| Scroll indicator bounce | GSAP | `yoyo: true, repeat: -1, duration: 2, ease: sine.inOut` on chevron. Kill on scroll > 50px | Low |
| Decorative line width | GSAP ScrollTrigger | `width: 0 → 40px` on scroll trigger | Low |
| Tree click pulse | GSAP | Canopy scale 1→1.15→1 over 0.6s total | Low |

---

## State & Logic Plan

### Web Audio API Architecture

The audio system is the core differentiator — all sounds are synthesized in real-time. Key architectural decisions:

**Node graph:** Each sound type has a reusable node-chain factory (oscillator/filter/gain/panner). Short sounds (birds, footsteps) use `AudioBufferSourceNode` to avoid oscillator overhead. Sustained sounds (drone, wind) keep oscillators running and modulate gain for on/off. A `DynamicsCompressorNode` sits before the master gain to prevent clipping during heavy layering.

**Spatial audio:** All sounds route through `StereoPannerNode` with x-position normalized [-1, 1]. Tree clicks position wind/birds at the tree's screen-x. Water drag pans to cursor x. Ground click pans to click x.

**Preset crossfade:** Presets define gain values per source. Switching presets triggers a 3s RAF loop that lerps each source's gain node from current to target value. During crossfade, a "mixing..." label is displayed.

**Audio context lifecycle:** Context starts in `suspended`. User click/tap calls `resume()`. The begin overlay must have `tabindex="0"` and keyboard handler for accessibility.

### Three.js ↔ Audio Bridge

The 3D scene and audio engine must share interaction events. The raycaster fires on click; the hit object name/ID determines which sound to trigger and where to pan it. This coupling requires both the Three.js scene ref and audio engine to be accessible from the same interaction handler. A shared event bus (custom callback pattern) is cleaner than React state for 60fps click-to-sound latency.

### Canvas 2D Overlay Synchronization

Two canvas overlays coexist on the hero: the Canvas 2D particle burst layer and the individual generative canvases in sound library cards. The burst canvas must convert Three.js 3D positions to 2D screen space using `Vector3.project(camera)` to spawn particles at the correct tree/water/ground location. This requires the camera reference from the Three.js scene.

### Generative Canvas Lifecycle

Each generative canvas (sound library cards + community cards) runs its own RAF loop. IntersectionObserver (threshold 0.1) starts/pauses the loop to avoid off-screen rendering. The 8 community card waveforms derive their unique pattern from a seeded hash of the soundscape ID — deterministic but distinct per card.

### Responsive Strategy

Three distinct breakpoints with feature degradation:
- **Desktop (>1024px):** Full particles (500 Three.js + 200 Canvas 2D), all UI visible
- **Tablet (768-1024px):** Reduced particles (300), preset labels hidden
- **Mobile (<768px):** Minimal particles (150), FAB replaces separate UI panels, no custom cursor
- **Small mobile (<480px):** 0.75x renderer resolution, 80 particles

Renderer pixel ratio and particle counts must be reactive to resize events and stored in a ref (not state) to avoid React re-renders.

---

## Other Key Decisions

### Raw Three.js over React Three Fiber

The design specifies imperative animation patterns (raycaster hit → sound trigger, per-frame vertex shader uniforms, camera parallax lerp) that map more naturally to raw Three.js with useRef than to R3F's declarative model. The scene is a single fixed-viewport canvas with no complex scene graph changes — raw Three.js avoids the R3F reconciliation overhead for this use case.

### No Image Assets

The entire visual experience is procedural. All visuals are Three.js geometry/shaders, Canvas 2D animations, or inline SVG icons. No raster images are loaded — this eliminates the need for an image asset pipeline and loading states.

### Sound Engine as Module, Not Service

The audio engine is a self-contained module exposing methods (playWind, playBird, setPreset, setMasterVolume, etc.) rather than a background service. This keeps it testable and avoids global singleton complexity. The `useAudioEngine` hook wraps this module in React lifecycle management.

### Accessibility: prefers-reduced-motion

When `prefers-reduced-motion: reduce` is active: disable all particle animations, camera parallax, and text float. Show a static Three.js scene. Sound still works on manual interaction but does not auto-play. The frequency visualizer shows static bars instead of animated.
