import { useRef } from "react";
import type { ReactNode, CSSProperties } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Maksimum eğilme açısı (derece) */
  maxTilt?: number;
  style?: CSSProperties;
}

/**
 * Fare hareketini takip eden 3D eğilme (tilt) kartı.
 * Kütüphanesiz, saf CSS transform ile çalışır; kart içindeki
 * `[data-tilt-glow]` elemanı fareyi izleyen parlama olarak konumlanır.
 */
export default function TiltCard({ children, className = "", maxTilt = 10, style }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * maxTilt;
    const ry = (px - 0.5) * maxTilt;
    el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
    el.style.setProperty("--glow-x", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--glow-y", `${(py * 100).toFixed(1)}%`);
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`relative transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={style}
    >
      {children}
      {/* Fareyi izleyen ışık parlaması */}
      <div
        data-tilt-glow
        aria-hidden
        className="absolute inset-0 rounded-[inherit] opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            "radial-gradient(320px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(59,130,246,0.14), transparent 65%)",
        }}
      />
    </div>
  );
}
