interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
}

const COLORS = ['#D4A574', '#E8C8A0', '#F5F0E8', '#7BA3A8', '#E8DFD0'];
const MAX_PARTICLES = 200;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let animFrame: number = 0;
let isRunning = false;

export function initParticleOverlay(container: HTMLElement) {
  canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '10';
  container.appendChild(canvas);

  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * Math.min(window.devicePixelRatio, 2);
  canvas.height = rect.height * Math.min(window.devicePixelRatio, 2);

  ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(Math.min(window.devicePixelRatio, 2), Math.min(window.devicePixelRatio, 2));
  }

  startLoop();
}

function startLoop() {
  if (isRunning) return;
  isRunning = true;

  const loop = () => {
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02; // gravity
      p.life--;
      p.opacity = p.life / p.maxLife;
      p.size *= 0.98;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      // Draw with radial gradient for soft edges
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, p.color + '00');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    animFrame = requestAnimationFrame(loop);
  };
  loop();
}

export function emitBurst(x: number, y: number, count: number = 25, colorSet?: string[]) {
  if (particles.length >= MAX_PARTICLES) return;
  const colors = colorSet || COLORS;
  const actualCount = Math.min(count, MAX_PARTICLES - particles.length);

  for (let i = 0; i < actualCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 1,
      life: 40 + Math.floor(Math.random() * 40),
      maxLife: 40 + Math.floor(Math.random() * 40),
    });
  }
}

export function emitWaterParticles(x: number, y: number) {
  if (particles.length >= MAX_PARTICLES) return;
  if (Math.random() > 0.5) return; // Not every frame

  particles.push({
    x: x + (Math.random() - 0.5) * 4,
    y: y + (Math.random() - 0.5) * 4,
    vx: (Math.random() - 0.5) * 0.5,
    vy: -0.5 - Math.random() * 1,
    size: 1.5 + Math.random() * 2,
    color: '#7BA3A8',
    opacity: 0.8,
    life: 20 + Math.floor(Math.random() * 20),
    maxLife: 20 + Math.floor(Math.random() * 20),
  });
}

export function emitGroundDust(x: number, y: number) {
  if (particles.length >= MAX_PARTICLES) return;
  const count = Math.min(10, MAX_PARTICLES - particles.length);
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -0.5 - Math.random() * 1.5,
      size: 2 + Math.random() * 3,
      color: '#E8DFD0',
      opacity: 0.6,
      life: 30 + Math.floor(Math.random() * 20),
      maxLife: 30 + Math.floor(Math.random() * 20),
    });
  }
}

export function resizeOverlay(width: number, height: number) {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  if (ctx) ctx.scale(dpr, dpr);
}

export function destroyOverlay() {
  if (animFrame) cancelAnimationFrame(animFrame);
  isRunning = false;
  if (canvas && canvas.parentElement) {
    canvas.parentElement.removeChild(canvas);
  }
  canvas = null;
  ctx = null;
  particles = [];
}
