"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ResultOverlay from "@/components/ResultOverlay";
import { fireConfetti } from "@/lib/confetti";
import { CONTAINERS } from "@/lib/containers";
import {
  FRASI_PALLINI_ESATTO,
  FRASI_PALLINI_LONTANO,
  FRASI_PALLINI_PAREGGIO,
  FRASI_PALLINI_VINCITORE,
  frase,
  frasi,
  pick,
} from "@/lib/phrases";
import { playBlip, playPour, playWin } from "@/lib/sound";

type Dot = { x: number; y: number; r: number; delay: number };

type Difficolta = { id: string; label: string; min: number; max: number };

const DIFFICOLTA: Difficolta[] = [
  { id: "facile", label: "Facile", min: 8, max: 20 },
  { id: "medio", label: "Medio", min: 25, max: 55 },
  { id: "tosta", label: "Tosta", min: 60, max: 120 },
];

function generaPallini(
  n: number,
  dentro: (x: number, y: number) => boolean,
): Dot[] {
  const dots: Dot[] = [];
  let tentativi = 0;
  while (dots.length < n && tentativi < n * 200) {
    tentativi++;
    const x = 50 + Math.random() * 100;
    const y = 56 + Math.random() * 200;
    if (dentro(x, y)) {
      dots.push({
        x,
        y,
        r: 3.6 + Math.random() * 1.6,
        delay: Math.random() * 2,
      });
    }
  }
  return dots;
}

export default function Pallini({
  players,
  notify,
}: {
  players: string[];
  notify: (msg: string) => void;
}) {
  const [contIdx, setContIdx] = useState(0);
  const [diff, setDiff] = useState<Difficolta>(DIFFICOLTA[1]);
  const [count, setCount] = useState(0);
  const [dots, setDots] = useState<Dot[]>([]);
  const [tiri, setTiri] = useState<Record<string, string>>({});
  const [rivelato, setRivelato] = useState(false);
  const [mostrato, setMostrato] = useState(0); // conteggio animato
  const [overlay, setOverlay] = useState<{
    name: string;
    phrase: string;
  } | null>(null);

  const container = CONTAINERS[contIdx];

  const nuovo = useCallback(
    (idx = contIdx, d = diff) => {
      const cont = CONTAINERS[idx];
      const n = d.min + Math.floor(Math.random() * (d.max - d.min + 1));
      setCount(n);
      setDots(generaPallini(n, cont.dentro));
      setTiri({});
      setRivelato(false);
      setMostrato(0);
      setOverlay(null);
      playPour();
    },
    [contIdx, diff],
  );

  // Primo contenitore e rigenerazione quando cambia la comitiva.
  useEffect(() => {
    nuovo(contIdx, diff);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length]);

  const cambiaContenitore = (idx: number) => {
    setContIdx(idx);
    nuovo(idx, diff);
  };
  const cambiaDiff = (d: Difficolta) => {
    setDiff(d);
    nuovo(contIdx, d);
  };

  // Animazione conteggio a salire con bip.
  useEffect(() => {
    if (!rivelato) return;
    if (mostrato >= count) {
      const t = setTimeout(() => verdetto(), 400);
      return () => clearTimeout(t);
    }
    const step = Math.max(1, Math.round(count / 40));
    const t = setTimeout(() => {
      const next = Math.min(count, mostrato + step);
      setMostrato(next);
      playBlip(500 + (next / Math.max(count, 1)) * 700);
    }, 45);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rivelato, mostrato, count]);

  const verdetto = () => {
    const validi = players
      .map((nome) => ({ nome, tiro: parseInt(tiri[nome] ?? "", 10) }))
      .filter((p) => Number.isFinite(p.tiro));
    if (validi.length === 0) return;

    let best = Infinity;
    for (const p of validi) best = Math.min(best, Math.abs(p.tiro - count));
    const vincitori = validi.filter((p) => Math.abs(p.tiro - count) === best);
    const esatto = best === 0;

    fireConfetti(esatto ? 260 : 180);
    playWin();

    // Sfottò per chi ha sbagliato di più (se ci sono almeno 3 tiri).
    let coda = "";
    if (validi.length >= 3) {
      const peggiore = validi.reduce((a, b) =>
        Math.abs(b.tiro - count) > Math.abs(a.tiro - count) ? b : a,
      );
      if (!vincitori.some((v) => v.nome === peggiore.nome)) {
        coda =
          " " +
          frasi(pick(FRASI_PALLINI_LONTANO), {
            nome: peggiore.nome,
            tiro: peggiore.tiro,
          });
      }
    }

    if (vincitori.length > 1) {
      const nomi = vincitori.map((v) => v.nome).join(" e ");
      setOverlay({
        name: nomi,
        phrase: frasi(pick(FRASI_PALLINI_PAREGGIO), { nomi }) + coda,
      });
    } else {
      const v = vincitori[0];
      const base = esatto
        ? pick(FRASI_PALLINI_ESATTO)
        : pick(FRASI_PALLINI_VINCITORE);
      setOverlay({
        name: v.nome,
        phrase:
          frase(base, v.nome) +
          (esatto ? "" : ` (ha ditto ${v.tiro}, ce ne stevano ${count})`) +
          coda,
      });
    }
  };

  const rivela = () => {
    const validi = players.filter((n) =>
      Number.isFinite(parseInt(tiri[n] ?? "", 10)),
    );
    if (validi.length === 0) {
      notify("Nisciuno ha ditto nu numero! Scrivite 'e tiri! ✍️");
      return;
    }
    setRivelato(true);
    setMostrato(0);
  };

  const dotsView = useMemo(
    () =>
      dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill="url(#pallino)"
          className="animate-float"
          style={{ animationDelay: `${d.delay}s`, transformOrigin: "center" }}
        />
      )),
    [dots],
  );

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="max-w-lg text-center text-lg italic text-etichetta-scura">
        Quanti pallini stanno &rsquo;o dinto? Guarda buono, ognuno scrive
        &rsquo;a stima soja e po&rsquo; se verifica: chi va cchiù vicino vince!
        🎯
      </p>

      {/* Scelta contenitore e difficoltà */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex gap-2">
          {CONTAINERS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => cambiaContenitore(i)}
              className={`rounded-sm border px-3 py-1.5 text-sm transition-all ${
                contIdx === i
                  ? "border-assenzio bg-smeraldo/50 text-assenzio-pallido"
                  : "border-ottone/40 text-etichetta hover:border-ottone"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {DIFFICOLTA.map((d) => (
            <button
              key={d.id}
              onClick={() => cambiaDiff(d)}
              className={`rounded-sm border px-3 py-1.5 font-[family-name:var(--font-titolo)] text-xs tracking-widest transition-all ${
                diff.id === d.id
                  ? "border-assenzio bg-smeraldo/50 text-assenzio-pallido"
                  : "border-ottone/40 text-etichetta-scura hover:border-ottone"
              }`}
            >
              {d.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Il contenitore coi pallini */}
      <div className="relative animate-glow-pulse" style={{ width: 240 }}>
        <svg viewBox="0 0 200 300" className="w-full" role="img" aria-label="Contenitore coi pallini">
          <defs>
            <radialGradient id="pallino" cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#d4f59a" />
              <stop offset="55%" stopColor="#a8e05f" />
              <stop offset="100%" stopColor="#1e6b47" />
            </radialGradient>
          </defs>
          {container.outline}
          {dotsView}
        </svg>
        {rivelato && (
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
            <span className="animate-pop-in rounded-sm border border-ottone bg-abisso/85 px-6 py-2 font-[family-name:var(--font-titolo)] text-5xl font-black text-ottone-chiaro">
              {mostrato}
            </span>
          </div>
        )}
      </div>

      {/* Tiri dei giocatori */}
      <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {players.map((nome) => (
          <label
            key={nome}
            className="flex items-center gap-3 rounded-sm border border-ottone/30 bg-bottiglia/50 px-3 py-2"
          >
            <span className="flex-1 truncate text-lg text-etichetta">{nome}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              disabled={rivelato}
              value={tiri[nome] ?? ""}
              onChange={(e) =>
                setTiri((prev) => ({ ...prev, [nome]: e.target.value }))
              }
              placeholder="?"
              className="w-20 rounded-sm border border-ottone/40 bg-abisso/60 px-2 py-1 text-center text-lg text-assenzio-pallido placeholder:text-etichetta-scura/40 focus:border-assenzio focus:outline-none disabled:opacity-60"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {!rivelato ? (
          <button
            onClick={rivela}
            className="etichetta rounded-sm px-10 py-3 font-[family-name:var(--font-titolo)] text-xl tracking-[0.2em] text-etichetta transition-all hover:scale-105 hover:brightness-125 active:scale-95"
          >
            ✔ VERIFICA
          </button>
        ) : (
          <button
            onClick={() => nuovo()}
            className="rounded-sm border border-ottone/60 px-6 py-2.5 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-ottone-chiaro transition-all hover:scale-105 hover:bg-ottone/15"
          >
            🔄 NUOVO CONTENITORE
          </button>
        )}
        <button
          onClick={() => nuovo()}
          className="rounded-sm border border-ottone/40 px-5 py-2.5 text-sm italic text-etichetta-scura transition-all hover:border-ottone hover:text-etichetta"
          title="Rimescola i pallini"
        >
          🎲 rimescola
        </button>
      </div>

      {overlay && (
        <ResultOverlay
          title="'A MIRA CCHIÙ BONA"
          name={overlay.name}
          phrase={overlay.phrase}
          tone="gloria"
          onClose={() => setOverlay(null)}
          actionLabel="N'ATA PARTITA"
          onAction={() => nuovo()}
        />
      )}
    </div>
  );
}
