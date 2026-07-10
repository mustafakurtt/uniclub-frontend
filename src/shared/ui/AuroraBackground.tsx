/**
 * Dekoratif, hareketli arkaplan: yüzen ışık küreleri (orb) + ince grid dokusu.
 * `variant="dark"` koyu mavi zeminler (login sol paneli, CTA blokları),
 * `variant="light"` açık zeminler (landing hero) içindir.
 * Kapsayıcının `relative overflow-hidden` olması yeterli.
 */
export default function AuroraBackground({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";

  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {/* Grid dokusu */}
      <div
        className={`absolute inset-0 bg-grid-md ${isDark ? "bg-grid-fine-dark opacity-40" : "bg-grid-fine opacity-60"}`}
        style={{
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
        }}
      />

      {/* Yüzen ışık küreleri */}
      <div
        className={`orb w-[28rem] h-[28rem] -top-24 -left-24 animate-blob ${
          isDark ? "bg-accent-400/30" : "bg-brand-400/25"
        }`}
      />
      <div
        className={`orb w-[24rem] h-[24rem] top-1/3 -right-32 animate-blob-slow delay-1000 ${
          isDark ? "bg-brand-500/40" : "bg-accent-300/30"
        }`}
      />
      <div
        className={`orb w-[20rem] h-[20rem] -bottom-24 left-1/4 animate-blob delay-500 ${
          isDark ? "bg-white/10" : "bg-brand-300/25"
        }`}
      />
    </div>
  );
}
