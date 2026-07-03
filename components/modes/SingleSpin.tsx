"use client";

import { useState } from "react";
import Wheel from "@/components/Wheel";
import ResultOverlay from "@/components/ResultOverlay";
import { fireConfetti } from "@/lib/confetti";
import {
  FRASI_VINCITORE,
  FRASI_PAGA,
  FRASI_BEVE,
  FRASI_MIRACOLO,
  frase,
  pick,
} from "@/lib/phrases";
import { playFail, playWin } from "@/lib/sound";

type Variant = "classico" | "chipaga";

type Result = {
  name: string;
  phrase: string;
  miracolo: string | null;
};

export default function SingleSpin({
  players,
  variant,
}: {
  players: string[];
  variant: Variant;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [penitenza, setPenitenza] = useState<"paga" | "beve">("paga");

  const handleFinish = (index: number) => {
    const name = players[index];
    const miracolo = Math.random() < 0.01 ? pick(FRASI_MIRACOLO) : null;
    if (variant === "classico") {
      fireConfetti();
      playWin();
      setResult({ name, phrase: pick(FRASI_VINCITORE), miracolo });
    } else {
      const pool = penitenza === "paga" ? FRASI_PAGA : FRASI_BEVE;
      playFail();
      setResult({ name, phrase: frase(pick(pool), name), miracolo });
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {variant === "chipaga" && (
        <div className="flex gap-2">
          {(["paga", "beve"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPenitenza(p)}
              className={`rounded-sm border px-5 py-1.5 font-[family-name:var(--font-titolo)] text-sm tracking-widest transition-all ${
                penitenza === p
                  ? "border-assenzio bg-smeraldo/50 text-assenzio-pallido"
                  : "border-ottone/40 text-etichetta-scura hover:border-ottone"
              }`}
            >
              {p === "paga" ? "💸 CHI PAGA" : "🥃 CHI BEVE"}
            </button>
          ))}
        </div>
      )}

      <Wheel
        entries={players}
        onFinish={handleFinish}
        spinLabel={variant === "classico" ? "ESTRAI 'O NOMME" : "GIRA 'A ROTA"}
      />

      {result && (
        <ResultOverlay
          title={
            variant === "classico"
              ? "L'ELETTO"
              : penitenza === "paga"
                ? "PAGA ISSO"
                : "BEVE ISSO"
          }
          name={result.name}
          phrase={result.phrase}
          miracolo={result.miracolo}
          tone={variant === "classico" ? "gloria" : "sfotto"}
          onClose={() => setResult(null)}
        />
      )}
    </div>
  );
}
