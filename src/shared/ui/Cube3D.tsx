import { useCallback, useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "@/shared/ui/Icon";

/** Küpün bir yüzüne oturan gezilebilir öğe (kulüp). */
export interface CubeItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

interface Cube3DProps {
  /** Kenar uzunluğu (px) */
  size?: number;
  /** Her yüze sırayla basılacak ikon (dekoratif mod; merkezi Icon kaydından adlar) */
  faces?: IconName[];
  /**
   * Verilirse küp DEKOR olmaktan çıkıp gezinilebilir hale gelir: yüzler
   * kulüpleri taşır, tıklanınca `onPick` çağrılır. Boş/verilmezse eski
   * dekoratif davranış aynen korunur (Landing, Login, Register bozulmaz).
   */
  items?: CubeItem[];
  /** Bir yüz seçildiğinde (tıklama veya zar atışı sonucu). */
  onPick?: (item: CubeItem) => void;
  className?: string;
}

const DEFAULT_FACES: IconName[] = ["faculty", "music", "sports", "theatre", "robotics", "literature"];
const FACE_COUNT = 6;

/** Yüz i'yi öne getiren gövde dönüşü. Yüz transformlarının tersi. */
const FACE_HOME_ROTATION = [
  { x: -18, y: 0 },
  { x: -18, y: -90 },
  { x: -18, y: -180 },
  { x: -18, y: 90 },
  { x: -90, y: 0 },
  { x: 90, y: 0 },
];

/**
 * Saf CSS 3D küp.
 *
 * İki modu var:
 *  - **Dekoratif** (varsayılan): kategori ikonları taşır, sürekli döner,
 *    `aria-hidden`. Landing/Login/Register bu modu kullanır.
 *  - **Gezinilebilir**: `items` verilince yüzler kulüplere dönüşür. Üzerine
 *    gelince dönüş durur ve yüzler tıklanabilir; "zar at" rastgele bir kulübe
 *    döner. Klavyeyle de kullanılabilir.
 *
 * Zar atışı gerçek bir keşif aracı — sahte puan/rozet değil, var olan kulüp
 * listesinden rastgele bir öneri.
 */
export default function Cube3D({
  size = 120,
  faces = DEFAULT_FACES,
  items,
  onPick,
  className = "",
}: Cube3DProps) {
  const half = size / 2;
  const interactive = !!items && items.length > 0 && !!onPick;

  // Zar atışında dönüş birikerek artar; geri sarmak yerine hep ileri döner.
  const [rotation, setRotation] = useState<{ x: number; y: number } | null>(null);
  const [rolling, setRolling] = useState(false);
  const turnsRef = useRef(0);

  const faceTransforms = useMemo(
    () => [
      `rotateY(0deg) translateZ(${half}px)`,
      `rotateY(90deg) translateZ(${half}px)`,
      `rotateY(180deg) translateZ(${half}px)`,
      `rotateY(-90deg) translateZ(${half}px)`,
      `rotateX(90deg) translateZ(${half}px)`,
      `rotateX(-90deg) translateZ(${half}px)`,
    ],
    [half]
  );

  /** Rastgele bir yüze döner ve o yüzün kulübünü seçer. */
  const roll = useCallback(() => {
    if (!items || items.length === 0 || !onPick || rolling) return;
    const faceIndex = Math.floor(Math.random() * Math.min(FACE_COUNT, items.length));
    const home = FACE_HOME_ROTATION[faceIndex];
    turnsRef.current += 2; // en az iki tam tur dönsün ki "atış" hissi olsun
    setRolling(true);
    setRotation({ x: home.x, y: home.y - turnsRef.current * 360 });
    window.setTimeout(() => {
      setRolling(false);
      onPick(items[faceIndex % items.length]);
    }, 900);
  }, [items, onPick, rolling]);

  const bodyStyle: React.CSSProperties = {
    width: size,
    height: size,
    ...(rotation
      ? {
          animation: "none",
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
        }
      : {}),
  };

  // ---- Dekoratif mod: eski davranış, hiç değişmedi ----
  if (!interactive) {
    return (
      <div aria-hidden className={`cube-scene ${className}`}>
        <div className="cube" style={{ width: size, height: size }}>
          {faceTransforms.map((transform, i) => (
            <div key={i} className="cube-face" style={{ transform }}>
              <Icon
                name={faces[i % faces.length]}
                size={Math.round(size * 0.34)}
                strokeWidth={1.75}
                className="text-white/90"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- Gezinilebilir mod ----
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* group/cube: üzerine gelince dönüşü durdurup yüzleri tıklanabilir yapar */}
      <div className="cube-scene group/cube">
        <div className="cube group-hover/cube:[animation-play-state:paused]" style={bodyStyle}>
          {faceTransforms.map((transform, i) => {
            const item = items![i % items!.length];
            return (
              <button
                key={i}
                type="button"
                className="cube-face cursor-pointer transition-shadow hover:shadow-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ transform }}
                onClick={() => onPick!(item)}
                title={item.name}
              >
                {item.logoUrl ? (
                  <img
                    src={item.logoUrl}
                    alt=""
                    className="h-2/3 w-2/3 rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="font-display font-extrabold text-white/95"
                    style={{ fontSize: Math.round(size * 0.3) }}
                  >
                    {item.name.trim().charAt(0).toLocaleUpperCase("tr-TR")}
                  </span>
                )}
                <span className="sr-only">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={roll}
        disabled={rolling}
        className="glass-dark inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white transition-transform hover:scale-105 disabled:opacity-60"
      >
        <Icon name="explore" size={13} className={rolling ? "animate-spin" : ""} />
        {rolling ? "Dönüyor…" : "Zar at — rastgele topluluk"}
      </button>
    </div>
  );
}
