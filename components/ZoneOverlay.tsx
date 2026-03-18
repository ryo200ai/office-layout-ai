"use client";

export type Zone = {
  label: string;
  x: number; // 0-100 (% of image width)
  y: number; // 0-100 (% of image height)
  w: number; // 0-100 (% of image width)
  h: number; // 0-100 (% of image height)
  color: string;
};

type Props = {
  zones: Zone[];
  imageWidth: number;
  imageHeight: number;
};

export default function ZoneOverlay({ zones, imageWidth, imageHeight }: Props) {
  if (!zones || zones.length === 0) return null;

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      preserveAspectRatio="none"
    >
      <defs>
        {zones.map((zone, i) => (
          <pattern key={`pat-${i}`} id={`stripe-${i}`} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke={zone.color} strokeWidth="2" strokeOpacity="0.3" />
          </pattern>
        ))}
      </defs>

      {zones.map((zone, i) => {
        const px = (zone.x / 100) * imageWidth;
        const py = (zone.y / 100) * imageHeight;
        const pw = (zone.w / 100) * imageWidth;
        const ph = (zone.h / 100) * imageHeight;
        const fontSize = Math.max(10, Math.min(16, pw / 8));

        return (
          <g key={i}>
            {/* ストライプ塗り */}
            <rect x={px} y={py} width={pw} height={ph} fill={`url(#stripe-${i})`} />
            {/* 枠線 */}
            <rect
              x={px} y={py} width={pw} height={ph}
              fill={zone.color}
              fillOpacity={0.18}
              stroke={zone.color}
              strokeWidth={2}
              strokeOpacity={0.85}
              rx={4}
            />
            {/* ラベル背景 */}
            <rect
              x={px + 4} y={py + 4}
              width={Math.min(pw - 8, fontSize * zone.label.length * 0.65 + 12)}
              height={fontSize + 8}
              fill={zone.color}
              fillOpacity={0.85}
              rx={3}
            />
            {/* ラベルテキスト */}
            <text
              x={px + 10} y={py + fontSize + 6}
              fontSize={fontSize}
              fill="white"
              fontWeight="bold"
              fontFamily="'Noto Serif JP', serif"
              style={{ userSelect: "none" }}
            >
              {zone.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
