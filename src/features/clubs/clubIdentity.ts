// Her kulüp adından deterministik bir "kimlik rengi" türetilir: aynı kulüp
// her sayfada aynı renkle görünür, logo yüklenmese bile tanınır. Üniversitede
// az sayıda kulüp olduğu için renk çakışması bir sorun değil — amaç hızlı
// görsel ayırt etme.
//
// Sınıflar literal string olmalı (Tailwind kaynak taraması yapar);
// bu yüzden şablon üretimi yok, tablo var.

export interface ClubIdentity {
  /** Kapak / logo karosu gradyanı */
  grad: string;
  /** Yumuşak zemin + metin — rozet ve ince vurgular için */
  soft: string;
  /** Kart hover'ında kullanılan renkli gölge */
  glow: string;
}

const IDENTITIES: ClubIdentity[] = [
  {
    grad: "from-violet-500 to-fuchsia-500",
    soft: "bg-violet-50 text-violet-700",
    glow: "hover:shadow-glow-violet",
  },
  {
    grad: "from-sky-500 to-cyan-400",
    soft: "bg-sky-50 text-sky-700",
    glow: "hover:shadow-glow-sky",
  },
  {
    grad: "from-rose-500 to-orange-400",
    soft: "bg-rose-50 text-rose-700",
    glow: "hover:shadow-glow-rose",
  },
  {
    grad: "from-emerald-500 to-teal-400",
    soft: "bg-emerald-50 text-emerald-700",
    glow: "hover:shadow-glow-emerald",
  },
  {
    grad: "from-amber-500 to-rose-500",
    soft: "bg-amber-50 text-amber-700",
    glow: "hover:shadow-glow-amber",
  },
  {
    grad: "from-indigo-600 to-blue-500",
    soft: "bg-indigo-50 text-indigo-700",
    glow: "hover:shadow-glow-indigo",
  },
];

export function clubIdentity(name: string): ClubIdentity {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return IDENTITIES[Math.abs(hash) % IDENTITIES.length];
}

/** Kapak gradyanı — logo/kapak görseli olmayan kulüpler için. */
export const coverGradient = (name: string) => clubIdentity(name).grad;

/** Kulüp adının baş harfi (Türkçe yerel ayarıyla). */
export const clubInitial = (name: string) => name.trim().charAt(0).toLocaleUpperCase("tr-TR");
