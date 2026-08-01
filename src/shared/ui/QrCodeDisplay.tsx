import QRCode from "react-qr-code";

interface QrCodeDisplayProps {
  value: string;
  /** Piksel — projeksiyon için büyük değerler kullanılabilir. */
  size?: number;
  className?: string;
  /** Baskı/ekran için beyaz kenar boşluğu. */
  quietZone?: boolean;
}

/** SVG tabanlı QR — ölçeklenebilir, baskıda net. */
export default function QrCodeDisplay({
  value,
  size = 200,
  className = "",
  quietZone = true,
}: QrCodeDisplayProps) {
  return (
    <div
      className={`inline-block ${quietZone ? "rounded-2xl bg-white p-4 shadow-card" : ""} ${className}`}
      role="img"
      aria-label="QR kod"
    >
      <QRCode value={value} size={size} level="M" />
    </div>
  );
}
