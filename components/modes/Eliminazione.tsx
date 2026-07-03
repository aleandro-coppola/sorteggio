"use client";

import { useEffect, useState } from "react";
import Wheel from "@/components/Wheel";
import ResultOverlay from "@/components/ResultOverlay";
import { fireConfetti } from "@/lib/confetti";
import {
  FRASI_ELIMINATO,
  FRASI_VINCITORE,
  frase,
  pick,
} from "@/lib/phrases";
import { playOut, playWin } from "@/lib/sound";

type Result = {
  name: string;
  phrase: string;
  campione: boolean;
};

export default function Eliminazione({
  players,
  notify,
}: {
  players: string[];
  notify: (msg: string) => void;
}) {
  const [remaining, setRemaining] = useState<string[]>(players);
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  // Se la lista dei giocatori cambia, il torneo riparte.
  useEffect(() => {
    setRemaining(players);
    setEliminated([]);
  }, [players]);

  useEffect(() => {
    if (players.length === 2) {
      notify("Site sulo duje? E che d'è, nu duello? Va' a ⚔️ Duello! 😄");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length]);

  const handleFinish = (index: number) => {
    const out = remaining[index];
    const next = remaining.filter((_, i) => i !== index);
    setRemaining(next);
    setEliminated((prev) => [...prev, out]);

    if (next.length === 1) {
      fireConfetti(240);
      playWin();
      setResult({
        name: next[0],
        phrase: `${pick(FRASI_VINCITORE)} — E ${out}? ${frase(
          pick(FRASI_ELIMINATO),
          out,
        )}`,
        campione: true,
      });
    } else {
      playOut();
      setResult({
        name: out,
        phrase: frase(pick(FRASI_ELIMINATO), out),
        campione: false,
      });
    }
  };

  const reset = () => {
    setRemaining(players);
    setEliminated([]);
    setResult(null);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-center text-lg italic text-etichetta-scura">
        &rsquo;A rota elimina uno a uno. L&rsquo;urdemo ca resta è
        &rsquo;o campione. 💀
      </p>

      {eliminated.length > 0 && (
        <div className="flex max-w-lg flex-wrap justify-center gap-2">
          {eliminated.map((name, i) => (
            <span
              key={name}
              className="rounded-full border border-ottone/25 px-3 py-0.5 text-etichetta-scura/60 line-through"
            >
              {i + 1}° fore: {name}
            </span>
          ))}
        </div>
      )}

      {remaining.length > 1 ? (
        <Wheel
          entries={remaining}
          onFinish={handleFinish}
          spinLabel="CHI ESCE?"
        />
      ) : (
        <div className="etichetta animate-pop-in rounded-sm p-8 text-center">
          <p className="text-lg text-etichetta-scura">Campione in carica</p>
          <p className="testo-oro font-[family-name:var(--font-titolo)] text-4xl font-bold">
            👑 {remaining[0]}
          </p>
        </div>
      )}

      {eliminated.length > 0 && (
        <button
          onClick={reset}
          className="rounded-sm border border-ottone/60 px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-ottone-chiaro transition-all hover:scale-105 hover:bg-ottone/15"
        >
          ↺ SE FA N&rsquo;ATA VOTA
        </button>
      )}

      {result && (
        <ResultOverlay
          title={result.campione ? "URDEMO CA RESTA" : "ELIMINATO"}
          name={result.name}
          phrase={result.phrase}
          tone={result.campione ? "gloria" : "sfotto"}
          onClose={() => setResult(null)}
        />
      )}
    </div>
  );
}
