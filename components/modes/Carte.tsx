"use client";

import { useEffect, useMemo, useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import { playFail, playPop, playWin } from "@/lib/sound";

// Carta da poker: r = valore (Asso = 1, Re = 13).
type Carta = { r: number; l: string; s: string };

const RANKS: { l: string; v: number }[] = [
  { l: "A", v: 1 },
  { l: "2", v: 2 },
  { l: "3", v: 3 },
  { l: "4", v: 4 },
  { l: "5", v: 5 },
  { l: "6", v: 6 },
  { l: "7", v: 7 },
  { l: "8", v: 8 },
  { l: "9", v: 9 },
  { l: "10", v: 10 },
  { l: "J", v: 11 },
  { l: "Q", v: 12 },
  { l: "K", v: 13 },
];
const SUITS = ["♠", "♥", "♦", "♣"];
const ROSSO = new Set(["♥", "♦"]);

// Regole "Quando fuori piove": in caso di pareggio conta il valore della carta.
const REGOLE_PIOVA: Record<string, string> = {
  A: "🌊 Cascata! Tutti attaccano a bevere a catena e nun se stacca 'a vocca fino a ca 'o primmo nun se ferma.",
  "2": "👉 Duje: scigli tu chi s'a beve.",
  "3": "🫵 Tre: 'a bevuta è 'a toia — bevi tu.",
  "4": "🖐️ Quattro: mano 'nterra! L'urdemo ca tocca 'a terra beve.",
  "5": "👍 Cinche: pollice! L'urdemo ca mette 'o dito 'ncoppa 'a tavula beve.",
  "6": "👩 Sei: 'e femmene bevono!",
  "7": "👨 Sette: 'e masculi bevono!",
  "8": "🤝 Otto: scigli nu compagno ca beve cu tico ogni vota.",
  "9": "🎵 Nove: rima! Dì 'na parola, chi nun trova 'a rima beve.",
  "10": "📚 Diece: categoria! Nomme 'na categoria, chi nun c'a fa beve.",
  J: "📜 Fante: regola nova! Miette 'na regola ca vale pe' tutta 'a serata.",
  Q: "❓ Donna: 'a domanda! Chi risponne a 'na domanda toia, beve.",
  K: "👑 Re: 'o bicchiere 'e miezzo! Tutt'e duje verzano nu poco… e chi 'o fa traboccà s'o beve.",
};

function nuovoMazzo(): Carta[] {
  const full: Carta[] = [];
  for (const s of SUITS) for (const rk of RANKS) full.push({ r: rk.v, l: rk.l, s });
  const due = [...full, ...full];
  for (let i = due.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [due[i], due[j]] = [due[j], due[i]];
  }
  return due.slice(0, 64);
}

export default function Carte({ players }: { players: string[] }) {
  const [mazzo, setMazzo] = useState<Carta[]>(nuovoMazzo);
  const [claim, setClaim] = useState<(string | null)[]>(() =>
    Array(64).fill(null),
  );
  const [fase, setFase] = useState<"scelta" | "risultato">("scelta");
  const [pickIdx, setPickIdx] = useState(0);

  const nuovaMano = () => {
    setMazzo(nuovoMazzo());
    setClaim(Array(64).fill(null));
    setFase("scelta");
    setPickIdx(0);
  };

  // Nuova mano se cambia la comitiva (players è memoizzato a monte).
  useEffect(() => {
    nuovaMano();
  }, [players]);

  const corrente = players[pickIdx];

  const esito = useMemo(() => {
    if (fase !== "risultato") return null;
    const scelte = players.map((p) => {
      const i = claim.findIndex((c) => c === p);
      return { p, i, carta: mazzo[i] };
    });
    const maxR = Math.max(...scelte.map((s) => s.carta.r));
    const top = scelte.filter((s) => s.carta.r === maxR);
    const ordinate = [...scelte].sort((a, b) => b.carta.r - a.carta.r);
    return {
      scelte: ordinate,
      top,
      maxLabel: top[0].carta.l,
      vincitore: top.length === 1 ? top[0] : null,
    };
  }, [fase, claim, players, mazzo]);

  // Suoni/coriandoli al reveal.
  useEffect(() => {
    if (fase !== "risultato" || !esito) return;
    if (esito.vincitore) {
      fireConfetti(180);
      playWin();
    } else {
      playFail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  const scegli = (i: number) => {
    if (fase !== "scelta" || claim[i]) return;
    const next = [...claim];
    next[i] = corrente;
    setClaim(next);
    playPop();
    if (pickIdx + 1 >= players.length) {
      setFase("risultato");
    } else {
      setPickIdx(pickIdx + 1);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="max-w-xl text-center text-lg italic text-etichetta-scura">
        Griglia 'e 64 carte cupèrte: ognuno ne piglia una a caso. &rsquo;A
        cchiù auta vince — l&rsquo;Asso vale 1. Pareggio? Conta &rsquo;a regola
        &laquo;Quando fuori piove&raquo;. ♠️
      </p>

      {fase === "scelta" ? (
        <div className="etichetta rounded-sm px-8 py-3 text-center">
          <p className="text-xs tracking-[0.3em] text-ottone-chiaro">
            TOCCA A — scegli 'a carta ({pickIdx + 1}/{players.length})
          </p>
          <p className="font-[family-name:var(--font-titolo)] text-3xl font-bold text-assenzio">
            {corrente}
          </p>
        </div>
      ) : (
        <button
          onClick={nuovaMano}
          className="etichetta rounded-sm px-8 py-3 font-[family-name:var(--font-titolo)] text-lg tracking-widest text-etichetta transition-all hover:scale-105 hover:brightness-125 active:scale-95"
        >
          ♻️ NOVA MANO
        </button>
      )}

      {/* Griglia 8×8 */}
      <div className="grid w-full max-w-md grid-cols-8 gap-1">
        {mazzo.map((carta, i) => {
          const by = claim[i];
          const rivelata = fase === "risultato" && by;
          const isWin = esito?.vincitore?.i === i;
          const isTie =
            esito && !esito.vincitore && esito.top.some((t) => t.i === i);
          return (
            <button
              key={i}
              onClick={() => scegli(i)}
              disabled={fase !== "scelta" || !!by}
              className={`flex aspect-square items-center justify-center rounded-sm border text-sm transition-all ${
                rivelata
                  ? `bg-etichetta ${
                      isWin
                        ? "border-assenzio shadow-[0_0_12px_rgba(168,224,95,0.7)]"
                        : isTie
                          ? "border-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]"
                          : "border-ottone/40"
                    }`
                  : by
                    ? "border-assenzio/60 bg-smeraldo/50"
                    : fase === "risultato"
                      ? "border-ottone/10 bg-bottiglia/40 opacity-25"
                      : "border-ottone/20 bg-bottiglia/60 hover:border-ottone/70 hover:bg-smeraldo/30"
              }`}
              aria-label={rivelata ? `${carta.l}${carta.s} di ${by}` : "carta coperta"}
            >
              {rivelata ? (
                <span
                  className={`font-[family-name:var(--font-titolo)] font-bold leading-none ${
                    ROSSO.has(carta.s) ? "text-red-600" : "text-abisso"
                  }`}
                >
                  {carta.l}
                  {carta.s}
                </span>
              ) : by ? (
                <span className="truncate px-0.5 text-[9px] font-semibold text-assenzio-pallido">
                  {by.slice(0, 3)}
                </span>
              ) : (
                <span className="text-ottone/40">✦</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Esito */}
      {esito && (
        <div className="etichetta w-full max-w-md animate-pop-in rounded-sm p-5 text-center">
          {esito.vincitore ? (
            <>
              <p className="text-xs tracking-[0.3em] text-ottone-chiaro">
                &rsquo;A CARTA CCHIÙ AUTA
              </p>
              <p className="testo-oro font-[family-name:var(--font-titolo)] text-4xl font-black">
                {esito.vincitore.p}
              </p>
              <p className="mt-1 text-xl text-etichetta">
                vince cu{" "}
                <span
                  className={
                    ROSSO.has(esito.vincitore.carta.s)
                      ? "font-bold text-red-400"
                      : "font-bold text-etichetta"
                  }
                >
                  {esito.vincitore.carta.l}
                  {esito.vincitore.carta.s}
                </span>
              </p>
            </>
          ) : (
            <>
              <p className="text-xs tracking-[0.3em] text-ottone-chiaro">
                🌧️ PAREGGIO &rsquo;E {esito.maxLabel}
              </p>
              <div className="divisorio-oro my-3" />
              <p className="text-lg italic text-etichetta">
                {REGOLE_PIOVA[esito.maxLabel]}
              </p>
              <p className="mt-2 text-base text-assenzio">
                Tocca a: {esito.top.map((t) => t.p).join(", ")}
              </p>
            </>
          )}

          <div className="divisorio-oro my-3" />
          <ul className="space-y-1 text-left">
            {esito.scelte.map((s, i) => (
              <li
                key={s.p}
                className="flex items-center justify-between px-2 text-lg"
              >
                <span className="text-etichetta-scura">
                  {i === 0 ? "👑" : `${i + 1}°`} {s.p}
                </span>
                <span
                  className={`font-[family-name:var(--font-titolo)] font-bold ${
                    ROSSO.has(s.carta.s) ? "text-red-400" : "text-etichetta"
                  }`}
                >
                  {s.carta.l}
                  {s.carta.s}
                </span>
              </li>
            ))}
          </ul>

          <div className="divisorio-oro my-4" />
          <button
            onClick={nuovaMano}
            className="rounded-sm border border-ottone/60 px-6 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-ottone-chiaro transition-all hover:scale-105 hover:bg-ottone/15"
          >
            ♻️ NOVA MANO
          </button>
        </div>
      )}
    </div>
  );
}
