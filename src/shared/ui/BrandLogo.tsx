import { useId } from "react";

/**
 * UniClub marka işareti — hero'lardaki 3D küpün (Cube3D) düz, izometrik hali.
 * Üç yüz üç marka tonu taşır (üst: açık accent, sol: koyu brand, sağ:
 * brand→accent gradyanı); sağ üstteki minik amber parıltı, streak/ödül
 * dilindeki turuncu vurguyla aynı ailedendir.
 *
 * `BrandMark` yalnız işaret, `BrandLogo` işaret + "UNICLUB" sözcük markası.
 * Favicon (public/favicon.svg) bu çizimin statik kopyasıdır — geometri
 * değişirse ikisini birlikte güncelle.
 */

export function BrandMark({ size = 26, className = "" }: { size?: number; className?: string }) {
  // Aynı sayfada birden çok logo olabilir; gradyan id'leri çakışmasın.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const top = `bm-top-${uid}`;
  const left = `bm-left-${uid}`;
  const right = `bm-right-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id={top} x1="7" y1="4" x2="41" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id={left} x1="7" y1="13" x2="24" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e40af" />
          <stop offset="1" stopColor="#172554" />
        </linearGradient>
        <linearGradient id={right} x1="24" y1="23" x2="41" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>

      {/* Kenarlar: dolgu rengiyle aynı kalın stroke + round join = yumuşak köşe */}
      {/* Üst yüz */}
      <path
        d="M24 4 L41 13.5 L24 23 L7 13.5 Z"
        fill={`url(#${top})`}
        stroke={`url(#${top})`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Sol yüz (gölge tarafı) */}
      <path
        d="M7 13.5 L24 23 L24 43 L7 33.5 Z"
        fill={`url(#${left})`}
        stroke={`url(#${left})`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Sağ yüz */}
      <path
        d="M41 13.5 L24 23 L24 43 L41 33.5 Z"
        fill={`url(#${right})`}
        stroke={`url(#${right})`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Üst yüze ışık vurgusu */}
      <path d="M24 4 L41 13.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />

      {/* Amber parıltı — dört uçlu yıldız */}
      <path
        d="M42.5 1.5 Q43.3 5.2 47 6 Q43.3 6.8 42.5 10.5 Q41.7 6.8 38 6 Q41.7 5.2 42.5 1.5 Z"
        fill="#f59e0b"
      />
    </svg>
  );
}

interface BrandLogoProps {
  /** Koyu zemin (aurora panelleri) üstünde beyaz + accent sözcük markası */
  onDark?: boolean;
  /** Sözcük markasının boyut sınıfları (ör. "text-lg sm:text-xl") */
  textClass?: string;
  /** Küp işaretinin kenarı (px) */
  markSize?: number;
  className?: string;
}

export default function BrandLogo({
  onDark = false,
  textClass = "text-xl",
  markSize = 26,
  className = "",
}: BrandLogoProps) {
  return (
    <span className={`group/brand inline-flex items-center gap-2 ${className}`}>
      <BrandMark
        size={markSize}
        className="transition-transform duration-300 ease-spring group-hover/brand:-rotate-12 group-hover/brand:scale-110"
      />
      <span className={`font-display font-extrabold tracking-wide ${textClass} ${onDark ? "text-white" : "text-brand-900"}`}>
        UNI<span className={onDark ? "text-accent-300" : "text-gradient"}>CLUB</span>
      </span>
    </span>
  );
}
