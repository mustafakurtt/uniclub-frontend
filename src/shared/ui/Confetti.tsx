/**
 * Hafif, bağımlılıksız konfeti patlaması — "kazandın" anları için
 * (kayıt tamamlandı, e-posta doğrulandı, kulübe kabul edildi...).
 *
 * İmperatif API: `fireConfetti()` çağrısı tam ekran, tıklamaları engellemeyen
 * geçici bir canvas açar, parçacıklar düşünce kendini temizler. Marka
 * renklerini kullanır; `prefers-reduced-motion` tercihinde hiç çalışmaz.
 */

const COLORS = [
  "#2563eb", // brand-600
  "#3b82f6", // brand-500
  "#0ea5e9", // accent-500
  "#38bdf8", // accent-400
  "#93c5fd", // brand-300
  "#f59e0b", // amber — küçük bir sürpriz vurgusu
  "#ffffff",
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  width: number;
  height: number;
  color: string;
  /** 0..1 arası salınım fazı — kağıt parçasının havada yalpalaması */
  wobble: number;
}

interface FireOptions {
  /** Parçacık sayısı (varsayılan 160) */
  particleCount?: number;
  /** Patlama merkezi, ekran oranı olarak (0..1). Varsayılan üst-orta. */
  originX?: number;
  originY?: number;
}

export function fireConfetti({ particleCount = 160, originX = 0.5, originY = 0.3 }: FireOptions = {}): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999";
  ctx.scale(dpr, dpr);
  document.body.appendChild(canvas);

  const cx = window.innerWidth * originX;
  const cy = window.innerHeight * originY;

  const particles: Particle[] = Array.from({ length: particleCount }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 6 + Math.random() * 10;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6, // hafif yukarı itiş — havai fişek hissi
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      width: 6 + Math.random() * 6,
      height: 4 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      wobble: Math.random() * Math.PI * 2,
    };
  });

  const GRAVITY = 0.35;
  const DRAG = 0.985;
  let frame: number;

  const tick = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let alive = 0;
    for (const p of particles) {
      p.vx *= DRAG;
      p.vy = p.vy * DRAG + GRAVITY;
      p.wobble += 0.1;
      p.x += p.vx + Math.cos(p.wobble) * 0.8;
      p.y += p.vy;
      p.rotation += p.vr;

      if (p.y < window.innerHeight + 20) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // Yalpalama: genişliği faz ile daraltıp genişletmek kağıdın
        // 3B'de dönüyormuş gibi görünmesini sağlar.
        ctx.scale(1, Math.abs(Math.sin(p.wobble)) * 0.7 + 0.3);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      }
    }

    if (alive > 0) {
      frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      canvas.remove();
    }
  };

  frame = requestAnimationFrame(tick);
}
