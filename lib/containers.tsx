import type { ReactNode } from "react";

// Contenitori per il gioco "Indovina 'e pallini". Ognuno ha:
// - un'illustrazione SVG (viewBox 0 0 200 300)
// - un predicato `dentro(x,y)` per capire dove è lecito mettere i pallini,
//   tenuto volutamente più stretto del vetro così i pallini non toccano i bordi.

export type Container = {
  id: string;
  label: string;
  outline: ReactNode;
  dentro: (x: number, y: number) => boolean;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export const CONTAINERS: Container[] = [
  {
    id: "bicchiere",
    label: "🥃 Bicchiere",
    outline: (
      <g>
        <path
          d="M56,60 L66,250 Q68,262 82,262 L118,262 Q132,262 134,250 L144,60 Z"
          fill="rgba(30,107,71,0.18)"
          stroke="#c9a227"
          strokeWidth="2.5"
        />
        <ellipse
          cx="100"
          cy="60"
          rx="44"
          ry="9"
          fill="rgba(168,224,95,0.12)"
          stroke="#c9a227"
          strokeWidth="2.5"
        />
      </g>
    ),
    dentro: (x, y) => {
      if (y < 74 || y > 250) return false;
      const t = clamp01((y - 74) / (250 - 74));
      const half = lerp(40, 32, t) - 7;
      return Math.abs(x - 100) <= half;
    },
  },
  {
    id: "bottiglia",
    label: "🍾 Bottiglia",
    outline: (
      <g>
        <path
          d="M86,54 L86,92 C86,104 62,110 62,140 L62,244 Q62,262 80,262 L120,262 Q138,262 138,244 L138,140 C138,110 114,104 114,92 L114,54 Z"
          fill="rgba(30,107,71,0.18)"
          stroke="#c9a227"
          strokeWidth="2.5"
        />
        <rect
          x="84"
          y="38"
          width="32"
          height="17"
          rx="4"
          fill="#c9a227"
          opacity="0.85"
        />
      </g>
    ),
    dentro: (x, y) => {
      // collo
      if (y >= 62 && y <= 88) return Math.abs(x - 100) <= 11;
      // corpo (con fondo leggermente arrotondato)
      if (y >= 118 && y <= 250) {
        let half = 30;
        if (y > 236) half = lerp(30, 20, clamp01((y - 236) / 14));
        return Math.abs(x - 100) <= half;
      }
      return false;
    },
  },
  {
    id: "caraffa",
    label: "🏺 Caraffa",
    outline: (
      <g>
        <path
          d="M80,70 L80,96 C60,110 56,140 56,180 L56,236 Q56,262 84,262 L116,262 Q144,262 144,236 L144,180 C144,140 140,110 120,96 L120,70 Z"
          fill="rgba(30,107,71,0.18)"
          stroke="#c9a227"
          strokeWidth="2.5"
        />
        <polygon points="80,74 64,68 80,86" fill="rgba(30,107,71,0.4)" stroke="#c9a227" strokeWidth="2" />
        <path
          d="M144,152 c28,2 28,58 2,64"
          fill="none"
          stroke="#c9a227"
          strokeWidth="4"
        />
      </g>
    ),
    dentro: (x, y) => {
      if (y >= 78 && y <= 96) return Math.abs(x - 100) <= 15;
      if (y >= 112 && y <= 250) {
        let half: number;
        if (y < 140) half = lerp(22, 44, clamp01((y - 112) / 28));
        else if (y > 232) half = lerp(44, 26, clamp01((y - 232) / 18));
        else half = 44;
        return Math.abs(x - 100) <= half - 6;
      }
      return false;
    },
  },
];
