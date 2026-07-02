"use client";

import { useCallback, useRef, useState } from "react";

// Palette dei segmenti: vetro di bottiglia, smeraldo e lampi di chartreuse.
const SEGMENT_COLORS = ["#143523", "#1e6b47", "#0d2417", "#2e8f5f", "#0f2e1e"];
const TEXT_COLORS = ["#d4f59a", "#f2ead3", "#a8e05f", "#f2ead3", "#c6f16d"];

const SIZE = 420;
const C = SIZE / 2;
const R = C - 14;

function polar(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [C + Math.cos(rad) * radius, C + Math.sin(rad) * radius];
}

function segmentPath(startDeg: number, endDeg: number): string {
  const [x1, y1] = polar(startDeg, R);
  const [x2, y2] = polar(endDeg, R);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
}

function colorIndex(i: number, total: number): number {
  // Evita che l'ultimo segmento abbia lo stesso colore del primo.
  const idx = i % SEGMENT_COLORS.length;
  if (i === total - 1 && idx === 0 && total > 1) return 2;
  return idx;
}

type WheelProps = {
  entries: string[];
  onFinish: (index: number) => void;
  spinLabel?: string;
  disabled?: boolean;
};

export default function Wheel({
  entries,
  onFinish,
  spinLabel = "GIRA 'A ROTA",
  disabled = false,
}: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const targetIndex = useRef(0);

  const n = Math.max(entries.length, 1);
  const seg = 360 / n;

  const spin = useCallback(() => {
    if (spinning || disabled || entries.length < 2) return;
    const index = Math.floor(Math.random() * entries.length);
    targetIndex.current = index;

    // Angolo (rispetto alla ruota ferma) del centro del segmento scelto,
    // misurato dall'alto in senso orario. Per portarlo sotto il puntatore
    // la ruota deve ruotare di (360 - angolo), più qualche giro completo.
    const jitter = (Math.random() - 0.5) * seg * 0.7;
    const centerAngle = index * seg + seg / 2 + jitter;
    const current = ((rotation % 360) + 360) % 360;
    const delta = (360 - centerAngle - current + 720) % 360;
    const fullTurns = 5 + Math.floor(Math.random() * 4);
    setRotation(rotation + fullTurns * 360 + delta);
    setSpinning(true);
  }, [spinning, disabled, entries.length, seg, rotation]);

  const handleEnd = () => {
    if (!spinning) return;
    setSpinning(false);
    onFinish(targetIndex.current);
  };

  const fontSize =
    n <= 4 ? 24 : n <= 6 ? 21 : n <= 8 ? 18 : n <= 12 ? 15 : 12;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative animate-glow-pulse" style={{ maxWidth: SIZE }}>
        {/* Puntatore in ottone */}
        <svg
          viewBox="0 0 40 48"
          className="absolute left-1/2 -top-3 z-10 w-9 -translate-x-1/2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
          aria-hidden
        >
          <path
            d="M20 46 L4 10 Q20 -6 36 10 Z"
            fill="url(#brass)"
            stroke="#8a6d14"
            strokeWidth="1.5"
          />
          <defs>
            <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e5c76b" />
              <stop offset="1" stopColor="#c9a227" />
            </linearGradient>
          </defs>
        </svg>

        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full select-none"
          role="img"
          aria-label="Ruota del sorteggio"
        >
          {/* Bordo esterno in ottone */}
          <circle cx={C} cy={C} r={R + 10} fill="#0d2417" />
          <circle
            cx={C}
            cy={C}
            r={R + 10}
            fill="none"
            stroke="#c9a227"
            strokeWidth="3"
          />
          <circle
            cx={C}
            cy={C}
            r={R + 4}
            fill="none"
            stroke="#c9a227"
            strokeWidth="1"
            opacity="0.5"
          />

          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${C}px ${C}px`,
              transition: spinning
                ? "transform 4.4s cubic-bezier(0.12, 0, 0.08, 1)"
                : "none",
            }}
            onTransitionEnd={handleEnd}
          >
            {entries.map((name, i) => {
              // Il segmento 0 parte dall'alto (ore 12) e si va in senso orario.
              const start = -90 + i * seg;
              const end = start + seg;
              const mid = start + seg / 2;
              const ci = colorIndex(i, n);
              const label =
                name.length > 14 ? name.slice(0, 13) + "…" : name;
              const [tx, ty] = polar(mid, R * 0.62);
              // Sul lato sinistro il testo si capovolge di 180° per restare leggibile.
              const norm = ((mid % 360) + 360) % 360;
              const textAngle =
                norm > 90 && norm < 270 ? mid + 180 : mid;
              return (
                <g key={`${name}-${i}`}>
                  <path
                    d={segmentPath(start, end)}
                    fill={SEGMENT_COLORS[ci]}
                    stroke="#c9a227"
                    strokeWidth="1"
                    strokeOpacity="0.45"
                  />
                  <text
                    x={tx}
                    y={ty}
                    fill={TEXT_COLORS[ci]}
                    fontSize={fontSize}
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${textAngle} ${tx} ${ty})`}
                    style={{ fontFamily: "var(--font-corpo)" }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Mozzo centrale */}
          <circle
            cx={C}
            cy={C}
            r={30}
            fill="#0d2417"
            stroke="#c9a227"
            strokeWidth="2.5"
          />
          <text
            x={C}
            y={C + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="26"
            fill="#c9a227"
          >
            ✦
          </text>
        </svg>
      </div>

      <button
        onClick={spin}
        disabled={spinning || disabled || entries.length < 2}
        className="etichetta rounded-sm px-10 py-3 font-[family-name:var(--font-titolo)] text-xl tracking-[0.2em] text-etichetta transition-all hover:scale-105 hover:brightness-125 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
      >
        {spinning ? "GIRA…" : spinLabel}
      </button>
    </div>
  );
}
