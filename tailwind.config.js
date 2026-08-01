/** @type {import('tailwindcss').Config} */

/**
 * UniClub Core Design System
 * --------------------------
 * Tema tek yerden yönetilir. Alt alan adları (farklı üniversite/kulüp temaları)
 * için `brand` ve `accent` skalalarını override etmek yeterlidir — bileşen
 * sınıfları (src/index.css) yalnızca bu semantik isimlere referans verir.
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Geriye dönük uyumluluk (eski sayfalar bg-club-* kullanıyor)
        club: {
          blue: '#1e3a8a',
          light: '#eff6ff',
          white: '#ffffff',
        },
        // Ana marka mavisi — sub-domain temalarında bu skala değişir
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Gradient ve vurgu rengi (gök mavisi / cyan)
        accent: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(30, 58, 138, 0.12)',
        'card-hover': '0 2px 4px rgba(15, 23, 42, 0.05), 0 20px 40px -16px rgba(30, 58, 138, 0.25)',
        'glow': '0 0 40px -8px rgba(59, 130, 246, 0.55)',
        'glow-lg': '0 0 80px -12px rgba(59, 130, 246, 0.6)',
        'inner-light': 'inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        // Kulüp kimlik renkleriyle eşleşen renkli kart gölgeleri
        // (src/features/clubs/clubIdentity.ts).
        'glow-violet': '0 20px 40px -16px rgba(139, 92, 246, 0.55)',
        'glow-sky': '0 20px 40px -16px rgba(14, 165, 233, 0.55)',
        'glow-rose': '0 20px 40px -16px rgba(244, 63, 94, 0.55)',
        'glow-emerald': '0 20px 40px -16px rgba(16, 185, 129, 0.55)',
        'glow-amber': '0 20px 40px -16px rgba(245, 158, 11, 0.55)',
        'glow-indigo': '0 20px 40px -16px rgba(79, 70, 229, 0.55)',
      },
      backgroundImage: {
        // İnce nokta/çizgi grid — hero ve boş alan dokusu
        'grid-fine': "linear-gradient(to right, rgba(30,58,138,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(30,58,138,0.06) 1px, transparent 1px)",
        'grid-fine-dark': "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)",
        // Canlı, hareket ettirilebilir aurora gradyanı (animate-aurora ile kullan)
        'aurora': 'linear-gradient(115deg, #1e3a8a 0%, #1d4ed8 25%, #0ea5e9 50%, #2563eb 75%, #172554 100%)',
        'hero-radial': 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(59,130,246,0.28), transparent)',
      },
      backgroundSize: {
        'grid-sm': '32px 32px',
        'grid-md': '48px 48px',
        '200%': '200% 200%',
        '300%': '300% 300%',
      },
      transitionTimingFunction: {
        // Yaylı, canlı his — hover/aktif mikro etkileşimler için
        'spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        'float-x': {
          '0%, 100%': { transform: 'translateX(0px) rotate(-2deg)' },
          '50%': { transform: 'translateX(12px) rotate(2deg)' },
        },
        'blob': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(24px, -32px) scale(1.08)' },
          '50%': { transform: 'translate(-16px, 16px) scale(0.94)' },
          '75%': { transform: 'translate(16px, 24px) scale(1.04)' },
        },
        'aurora': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'shine': {
          '0%': { transform: 'translateX(-150%) skewX(-20deg)' },
          '100%': { transform: 'translateX(250%) skewX(-20deg)' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'dropdown-in': {
          '0%': { opacity: '0', transform: 'translateY(-4px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'spin-3d': {
          '0%': { transform: 'rotateX(-18deg) rotateY(0deg)' },
          '100%': { transform: 'rotateX(-18deg) rotateY(360deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'float-x': 'float-x 7s ease-in-out infinite',
        'blob': 'blob 14s ease-in-out infinite',
        'blob-slow': 'blob 22s ease-in-out infinite',
        'aurora': 'aurora 12s ease-in-out infinite',
        'shine': 'shine 2.4s ease-in-out infinite',
        'marquee': 'marquee 32s linear infinite',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.6s ease-out both',
        'dropdown-in': 'dropdown-in 0.12s ease-out both',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'spin-3d': 'spin-3d 16s linear infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'wiggle': 'wiggle 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
