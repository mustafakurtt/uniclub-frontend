import { Icon, type IconName } from "@/shared/ui/Icon";

interface Cube3DProps {
  /** Kenar uzunluğu (px) */
  size?: number;
  /** Her yüze sırayla basılacak ikon (6 yüz; merkezi Icon kaydından adlar) */
  faces?: IconName[];
  className?: string;
}

const DEFAULT_FACES: IconName[] = ["faculty", "music", "sports", "theatre", "robotics", "literature"];

/**
 * Saf CSS ile dönen 3D küp. Kulüp kategorilerini ikon olarak yüzlerinde taşır;
 * hero ve yan panellerde dekor olarak kullanılır. İkonlar merkezi kayıttan gelir.
 */
export default function Cube3D({ size = 120, faces = DEFAULT_FACES, className = "" }: Cube3DProps) {
  const half = size / 2;
  const transforms = [
    `rotateY(0deg) translateZ(${half}px)`,
    `rotateY(90deg) translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
    `rotateY(-90deg) translateZ(${half}px)`,
    `rotateX(90deg) translateZ(${half}px)`,
    `rotateX(-90deg) translateZ(${half}px)`,
  ];

  return (
    <div aria-hidden className={`cube-scene ${className}`}>
      <div className="cube" style={{ width: size, height: size }}>
        {transforms.map((transform, i) => (
          <div key={i} className="cube-face" style={{ transform }}>
            <Icon name={faces[i % faces.length]} size={Math.round(size * 0.34)} strokeWidth={1.75} className="text-white/90" />
          </div>
        ))}
      </div>
    </div>
  );
}
