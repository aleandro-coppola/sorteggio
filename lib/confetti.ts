// Coriandoli fatti in casa, nei colori dell'assenzio: verde, chartreuse e oro.

const COLORI = ["#a8e05f", "#c6f16d", "#c9a227", "#e5c76b", "#2e8f5f", "#f2ead3"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vr: number;
  shape: "rect" | "circle";
};

let activeCanvas: HTMLCanvasElement | null = null;
let raf = 0;

export function fireConfetti(intensity = 160): void {
  if (typeof document === "undefined") return;

  if (!activeCanvas) {
    activeCanvas = document.createElement("canvas");
    activeCanvas.style.cssText =
      "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999";
    document.body.appendChild(activeCanvas);
  }
  const canvas = activeCanvas;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const particles: Particle[] = [];
  for (let i = 0; i < intensity; i++) {
    const fromLeft = i % 2 === 0;
    particles.push({
      x: fromLeft ? -10 : canvas.width + 10,
      y: canvas.height * (0.3 + Math.random() * 0.4),
      vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 9),
      vy: -6 - Math.random() * 8,
      size: 5 + Math.random() * 7,
      color: COLORI[i % COLORI.length],
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.4 ? "rect" : "circle",
    });
  }

  cancelAnimationFrame(raf);
  const start = performance.now();

  function tick(now: number) {
    if (!ctx) return;
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25;
      p.vx *= 0.99;
      p.rotation += p.vr;
      if (p.y < canvas.height + 20) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - elapsed / 4000);
      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (alive && elapsed < 4000) {
      raf = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  raf = requestAnimationFrame(tick);
}
