"use client";

import { useState } from "react";
import Wheel from "@/components/Wheel";
import ResultOverlay from "@/components/ResultOverlay";
import { fireConfetti } from "@/lib/confetti";
import {
  FRASI_ROUND_DUELLO,
  FRASI_VITTORIA_DUELLO,
  FRASI_PERDENTE,
  frase,
  pick,
  shuffle,
} from "@/lib/phrases";
import { playPop, playWin } from "@/lib/sound";

type Result = {
  name: string;
  phrase: string;
  finale: boolean;
};

export default function Duello({
  players,
  notify,
}: {
  players: string[];
  notify: (msg: string) => void;
}) {
  const [sfidanti, setSfidanti] = useState<string[]>([]);
  const [bestOf, setBestOf] = useState<3 | 5>(3);
  const [score, setScore] = useState<Record<string, number>>({});
  const [inCorso, setInCorso] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const target = Math.ceil(bestOf / 2);

  const toggleSfidante = (name: string) => {
    if (inCorso) return;
    setSfidanti((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : prev.length < 2
          ? [...prev, name]
          : [prev[1], name],
    );
  };

  const sorteggiaSfidanti = () => {
    if (players.length < 2) return;
    setSfidanti(shuffle(players).slice(0, 2));
  };

  const start = () => {
    if (sfidanti.length !== 2) {
      notify("Nu duello se fa in duje! Scegli 'e sfidanti! ⚔️");
      return;
    }
    setScore({ [sfidanti[0]]: 0, [sfidanti[1]]: 0 });
    setInCorso(true);
  };

  const reset = () => {
    setInCorso(false);
    setScore({});
    setResult(null);
  };

  // Ruota scenografica: i due nomi alternati su 6 spicchi.
  const wheelEntries = inCorso
    ? [0, 1, 2].flatMap(() => sfidanti)
    : sfidanti.length === 2
      ? [0, 1, 2].flatMap(() => sfidanti)
      : players;

  const handleFinish = (index: number) => {
    const winner = wheelEntries[index];
    const newScore = { ...score, [winner]: (score[winner] ?? 0) + 1 };
    setScore(newScore);
    if (newScore[winner] >= target) {
      const loser = sfidanti.find((s) => s !== winner)!;
      fireConfetti(220);
      playWin();
      setResult({
        name: winner,
        phrase: `${frase(pick(FRASI_VITTORIA_DUELLO), winner)} — E pe' ${loser}: ${pick(FRASI_PERDENTE)}`,
        finale: true,
      });
    } else {
      playPop();
      setResult({
        name: winner,
        phrase: frase(pick(FRASI_ROUND_DUELLO), winner),
        finale: false,
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {!inCorso && (
        <>
          <p className="text-center text-lg italic text-etichetta-scura">
            Scegli duje sfidanti (o falli scegliere d&rsquo;&rsquo;a sorte) e
            decide &rsquo;o destino: se vence a&hellip;
          </p>
          <div className="flex gap-2">
            {([3, 5] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBestOf(b)}
                className={`rounded-sm border px-5 py-1.5 font-[family-name:var(--font-titolo)] text-sm tracking-widest transition-all ${
                  bestOf === b
                    ? "border-assenzio bg-smeraldo/50 text-assenzio-pallido"
                    : "border-ottone/40 text-etichetta-scura hover:border-ottone"
                }`}
              >
                MEGLIO &rsquo;E {b}
              </button>
            ))}
          </div>
          <div className="flex max-w-lg flex-wrap justify-center gap-2">
            {players.map((p) => (
              <button
                key={p}
                onClick={() => toggleSfidante(p)}
                className={`rounded-full border px-4 py-1 text-lg transition-all ${
                  sfidanti.includes(p)
                    ? "border-assenzio bg-smeraldo/60 text-assenzio-pallido shadow-[0_0_12px_rgba(168,224,95,0.4)]"
                    : "border-ottone/40 text-etichetta hover:border-ottone"
                }`}
              >
                {sfidanti.includes(p) ? "⚔️ " : ""}
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={sorteggiaSfidanti}
              className="rounded-sm border border-ottone/60 px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-ottone-chiaro transition-all hover:scale-105 hover:bg-ottone/15"
            >
              🎲 SCEGLIE &rsquo;A SORTE
            </button>
            <button
              onClick={start}
              disabled={sfidanti.length !== 2}
              className="etichetta rounded-sm px-6 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-etichetta transition-all hover:scale-105 hover:brightness-125 disabled:opacity-40"
            >
              ⚔️ CHE &rsquo;O DUELLO ABBIA INIZIO
            </button>
          </div>
        </>
      )}

      {inCorso && (
        <>
          {/* Tabellone */}
          <div className="etichetta flex items-center gap-6 rounded-sm px-8 py-4">
            {sfidanti.map((s, i) => (
              <div key={s} className="flex items-center gap-6">
                {i === 1 && (
                  <span className="font-[family-name:var(--font-titolo)] text-2xl text-ottone">
                    ⚔️
                  </span>
                )}
                <div className="text-center">
                  <p className="max-w-32 truncate text-xl font-semibold text-etichetta">
                    {s}
                  </p>
                  <div className="mt-1 flex justify-center gap-1.5">
                    {Array.from({ length: target }).map((_, j) => (
                      <span
                        key={j}
                        className={`inline-block h-3 w-3 rounded-full border ${
                          j < (score[s] ?? 0)
                            ? "border-assenzio bg-assenzio shadow-[0_0_8px_rgba(168,224,95,0.8)]"
                            : "border-ottone/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Wheel
            entries={wheelEntries}
            onFinish={handleFinish}
            spinLabel="GIRA — ROUND!"
          />

          <button
            onClick={reset}
            className="text-sm italic text-etichetta-scura underline decoration-ottone/50 underline-offset-4 hover:text-etichetta"
          >
            Annulla &rsquo;o duello
          </button>
        </>
      )}

      {result && (
        <ResultOverlay
          title={result.finale ? "VINCITORE D''O DUELLO" : "PUNTO!"}
          name={result.name}
          phrase={result.phrase}
          tone={result.finale ? "gloria" : "sfotto"}
          onClose={() => {
            if (result.finale) reset();
            else setResult(null);
          }}
          actionLabel={result.finale ? "NUOVO DUELLO" : "PROSSIMO ROUND"}
          onAction={() => {
            if (result.finale) reset();
            else setResult(null);
          }}
        />
      )}
    </div>
  );
}
