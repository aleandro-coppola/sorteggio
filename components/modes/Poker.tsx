"use client";

import { useEffect, useRef, useState } from "react";
import { playCheers, playPop } from "@/lib/sound";

// Segnapunti per "Poker Penitenza Graduale" (Texas Hold'em No-Limit, max 4).
// Gioco a sé: stato solo in locale (localStorage), non tocca gli altri dati.

const KEY = "assenzio-poker";
const CAP = 10; // punti massimi a serata → poi solo acqua

type PokerState = {
  pending: Record<string, number>; // punti da "scontare" alla prossima penitenza
  earned: Record<string, number>; // totale accumulato nella serata (cap 10)
  mani: number;
  start: number;
  lastApplyMani: number;
  lastApplyTime: number;
  lastBreak: number;
};

const INGREDIENTI = [
  { cat: "🍺 Birre", voci: "Corona, Tennent's" },
  { cat: "🥃 Spiriti", voci: "Sambuca, Vodka Absolut, Gin Tanqueray, Rum, Assenzio" },
  { cat: "🥤 Mixer", voci: "ACE, Lemonsoda, Red Bull, Acqua Tonica" },
  { cat: "💧 Obbligo", voci: "Acqua naturale + ghiaccio" },
];

const freshState = (): PokerState => {
  const t = Date.now();
  return {
    pending: {},
    earned: {},
    mani: 0,
    start: t,
    lastApplyMani: 0,
    lastApplyTime: t,
    lastBreak: t,
  };
};

export default function Poker({
  players,
  notify,
}: {
  players: string[];
  notify: (msg: string) => void;
}) {
  const roster = players.slice(0, 4);
  const [st, setSt] = useState<PokerState>(freshState);
  const [now, setNow] = useState(Date.now());
  const [vincitore, setVincitore] = useState<string | null>(null);
  const [handPoints, setHandPoints] = useState<Record<string, number>>({});
  const [mostraPenitenze, setMostraPenitenze] = useState(false);
  const [mostraIngredienti, setMostraIngredienti] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSt(JSON.parse(raw));
    } catch {
      /* pazienza */
    }
    hydrated.current = true;
  }, []);
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch {
      /* pazienza */
    }
  }, [st]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fuori = (p: string) => (st.earned[p] ?? 0) >= CAP;

  const registraMano = () => {
    if (!vincitore) {
      notify("Scigli 'o vincitore d''a mano! 👑");
      return;
    }
    setSt((prev) => {
      const pending = { ...prev.pending };
      const earned = { ...prev.earned };
      for (const p of roster) {
        if (p === vincitore || (earned[p] ?? 0) >= CAP) continue;
        const pts = handPoints[p] ?? 1;
        pending[p] = (pending[p] ?? 0) + pts;
        earned[p] = Math.min(CAP, (earned[p] ?? 0) + pts);
      }
      return { ...prev, pending, earned, mani: prev.mani + 1 };
    });
    setVincitore(null);
    setHandPoints({});
    playPop();
  };

  const totPending = roster.reduce((a, p) => a + (st.pending[p] ?? 0), 0);

  const confermaPenitenze = () => {
    setSt((prev) => ({
      ...prev,
      pending: {},
      lastApplyMani: prev.mani,
      lastApplyTime: Date.now(),
    }));
    setMostraPenitenze(false);
    playCheers();
    notify("Penitenze scontate! E mo' mezzo bicchiere d'acqua. 💧");
  };

  const azzera = () => {
    if (!confirm("Azzero tutt' 'a partita 'e poker?")) return;
    setSt(freshState());
    setVincitore(null);
    setHandPoints({});
  };

  // Derivati temporali
  const elapsedMin = Math.floor((now - st.start) / 60000);
  const elapsedTxt =
    elapsedMin >= 60
      ? `${Math.floor(elapsedMin / 60)}h ${elapsedMin % 60}m`
      : `${elapsedMin}m`;
  const maniDaPenit = st.mani - st.lastApplyMani;
  const minDaPenit = Math.floor((now - st.lastApplyTime) / 60000);
  const penitDovuta = maniDaPenit >= 10 || minDaPenit >= 30;
  const pausaDovuta = (now - st.lastBreak) / 60000 >= 60;

  const setPunti = (p: string, v: number) =>
    setHandPoints((prev) => ({ ...prev, [p]: Math.max(0, Math.min(3, v)) }));

  // ── Troppi giocatori ──
  if (players.length > 4) {
    return (
      <div className="etichetta mx-auto max-w-md rounded-sm p-8 text-center">
        <p className="text-5xl">🃏</p>
        <p className="mt-4 text-xl italic text-etichetta">
          &rsquo;O Poker è pe&rsquo; <b>4 massimo</b>. Usa &laquo;Chi gioca?&raquo;
          ccà ncoppa pe&rsquo; arrivà a 4.
        </p>
        <p className="mt-2 text-base text-etichetta-scura">
          Mo&rsquo; site {players.length}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* Pausa obbligatoria */}
      {pausaDovuta && (
        <div className="w-full max-w-xl animate-pop-in rounded-sm border border-ottone bg-ottone/15 p-4 text-center">
          <p className="font-[family-name:var(--font-titolo)] text-lg text-ottone-chiaro">
            🚰 PAUSA OBBLIGATORIA! Acqua, aria, e po&rsquo; se ripiglia.
          </p>
          <button
            onClick={() => setSt((p) => ({ ...p, lastBreak: Date.now() }))}
            className="mt-2 rounded-sm border border-ottone/60 px-4 py-1.5 text-sm tracking-widest text-ottone-chiaro transition-all hover:bg-ottone/15"
          >
            FATTA 'A PAUSA
          </button>
        </div>
      )}

      {/* Barra sessione */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-center text-sm text-etichetta-scura">
        <span>
          🃏 Mani: <b className="text-etichetta">{st.mani}</b>
        </span>
        <span>
          ⏱️ Durata: <b className="text-etichetta">{elapsedTxt}</b>
        </span>
        <span className={penitDovuta ? "text-assenzio" : ""}>
          🎯 Penitenze: {penitDovuta ? "ORA!" : `tra ${Math.max(0, 10 - maniDaPenit)} mani`}
        </span>
      </div>

      {/* Scoreboard */}
      <div className="grid w-full gap-3 sm:grid-cols-2">
        {roster.map((p) => {
          const earned = st.earned[p] ?? 0;
          const pending = st.pending[p] ?? 0;
          const out = fuori(p);
          return (
            <div
              key={p}
              className={`etichetta rounded-sm p-4 ${out ? "border-red-500/70" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xl font-bold text-etichetta">
                  {p}
                  {out && (
                    <span className="ml-2 text-sm text-red-400">
                      🚱 SOLO ACQUA
                    </span>
                  )}
                </span>
                <div className="text-right">
                  <p className="testo-oro font-[family-name:var(--font-titolo)] text-3xl font-black leading-none">
                    {pending}
                  </p>
                  <p className="text-[10px] tracking-widest text-ottone-chiaro">
                    da scontà
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-[11px] tracking-widest text-etichetta-scura">
                  <span>SERATA</span>
                  <span>
                    {earned}/{CAP}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-abisso/60">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(earned / CAP) * 100}%`,
                      background:
                        earned >= CAP
                          ? "linear-gradient(90deg,#7f1d1d,#ef4444)"
                          : earned >= 7
                            ? "linear-gradient(90deg,#c9a227,#e5c76b)"
                            : "linear-gradient(90deg,#2e8f5f,#a8e05f)",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Registra mano */}
      <div className="etichetta w-full max-w-xl rounded-sm p-4">
        <p className="text-center font-[family-name:var(--font-titolo)] text-sm tracking-[0.3em] text-ottone-chiaro">
          REGISTRA 'A MANO
        </p>
        <p className="mt-1 text-center text-xs italic text-etichetta-scura">
          1 base · 2 all-in · +1 scala o distribuzione d&rsquo;&rsquo;o vincitore
          (max 3)
        </p>

        <p className="mt-3 mb-1 text-center text-sm text-etichetta-scura">
          👑 Chi ha vinto 'a mano?
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {roster.map((p) => (
            <button
              key={p}
              onClick={() => setVincitore(vincitore === p ? null : p)}
              className={`rounded-full border px-4 py-1 text-base transition-all ${
                vincitore === p
                  ? "border-assenzio bg-smeraldo/60 text-assenzio-pallido shadow-[0_0_12px_rgba(168,224,95,0.4)]"
                  : "border-ottone/40 text-etichetta hover:border-ottone"
              }`}
            >
              {vincitore === p ? "👑 " : ""}
              {p}
            </button>
          ))}
        </div>

        {vincitore && (
          <div className="mt-4 space-y-2">
            {roster
              .filter((p) => p !== vincitore)
              .map((p) => {
                const out = fuori(p);
                const pts = handPoints[p] ?? 1;
                return (
                  <div
                    key={p}
                    className="flex items-center justify-between gap-3 rounded-sm border border-ottone/20 bg-bottiglia/40 px-3 py-2"
                  >
                    <span className="truncate text-lg text-etichetta">
                      {p}
                      {out && (
                        <span className="ml-2 text-xs text-red-400">
                          🚱 fuori
                        </span>
                      )}
                    </span>
                    {out ? (
                      <span className="text-sm italic text-etichetta-scura">
                        nun accummula cchiù
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPunti(p, pts - 1)}
                          className="h-8 w-8 rounded-sm border border-ottone/40 text-lg text-etichetta-scura hover:border-ottone hover:text-etichetta"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-[family-name:var(--font-titolo)] text-2xl font-bold text-etichetta">
                          {pts}
                        </span>
                        <button
                          onClick={() => setPunti(p, pts + 1)}
                          className="h-8 w-8 rounded-sm border border-assenzio/50 bg-smeraldo/30 text-lg text-assenzio-pallido hover:bg-smeraldo/60"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            <button
              onClick={registraMano}
              className="mt-2 w-full rounded-sm border border-assenzio/60 bg-smeraldo/40 py-2.5 font-[family-name:var(--font-titolo)] text-lg tracking-widest text-assenzio-pallido transition-all hover:scale-[1.02] hover:bg-smeraldo/70"
            >
              ✔ REGISTRA 'A MANO
            </button>
          </div>
        )}
      </div>

      {/* Applica penitenze */}
      <button
        onClick={() =>
          totPending > 0
            ? setMostraPenitenze(true)
            : notify("Niente 'a penà, pe' mo'. 😇")
        }
        className={`rounded-sm px-8 py-3 font-[family-name:var(--font-titolo)] text-lg tracking-[0.2em] transition-all hover:scale-105 ${
          penitDovuta && totPending > 0
            ? "etichetta animate-glow-pulse text-etichetta"
            : "border border-ottone/50 text-ottone-chiaro hover:bg-ottone/10"
        }`}
      >
        🍺 APPLICA 'E PENITENZE
      </button>

      {/* Reminder sicurezza */}
      <p className="max-w-xl text-center text-xs italic text-etichetta-scura/70">
        ⚠️ Max {CAP} punti a serata (po&rsquo; solo acqua). Ogni penitenza cu
        mezzo bicchiere d&rsquo;acqua. Pausa ogni 60 min. Nisciuno obbliga
        n&rsquo;ato oltre &rsquo;o limite suoio.
      </p>

      {/* Ingredienti + azzera */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setMostraIngredienti((v) => !v)}
          className="rounded-sm border border-ottone/40 px-4 py-1.5 text-sm text-etichetta-scura hover:border-ottone hover:text-etichetta"
        >
          🧊 Ingredienti
        </button>
        <button
          onClick={azzera}
          className="rounded-sm border border-red-900/60 px-4 py-1.5 text-sm text-etichetta-scura/70 hover:border-red-500/60 hover:text-red-300"
        >
          ↺ Azzera partita
        </button>
      </div>
      {mostraIngredienti && (
        <div className="etichetta w-full max-w-xl rounded-sm p-4 text-sm">
          {INGREDIENTI.map((i) => (
            <p key={i.cat} className="text-etichetta">
              <span className="text-ottone-chiaro">{i.cat}:</span> {i.voci}
            </p>
          ))}
        </div>
      )}

      {/* Modale penitenze */}
      {mostraPenitenze && (
        <div
          className="fixed inset-0 z-[560] flex items-center justify-center bg-abisso/85 p-4 backdrop-blur-sm"
          onClick={() => setMostraPenitenze(false)}
        >
          <div
            className="etichetta w-full max-w-md animate-pop-in rounded-sm p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-[family-name:var(--font-titolo)] text-sm tracking-[0.35em] text-ottone-chiaro">
              ✦ PENITENZE ✦
            </p>
            <div className="divisorio-oro my-3" />
            <ul className="space-y-1 text-left">
              {roster
                .map((p) => ({ p, n: st.pending[p] ?? 0 }))
                .filter((r) => r.n > 0)
                .sort((a, b) => b.n - a.n)
                .map((r) => (
                  <li
                    key={r.p}
                    className="flex items-center justify-between px-2 text-lg"
                  >
                    <span className="text-etichetta">{r.p}</span>
                    <span className="font-[family-name:var(--font-titolo)] font-bold text-assenzio">
                      🍺 × {r.n}
                    </span>
                  </li>
                ))}
            </ul>
            <p className="mt-3 text-sm italic text-etichetta-scura">
              1 punto = 1 sorso/penitenza. E nun te scurdà &rsquo;o mezzo
              bicchiere d&rsquo;acqua! 💧
            </p>
            <div className="divisorio-oro my-4" />
            <div className="flex justify-center gap-3">
              <button
                onClick={confermaPenitenze}
                className="rounded-sm border border-assenzio/70 bg-smeraldo/40 px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-assenzio-pallido transition-all hover:scale-105 hover:bg-smeraldo/70"
              >
                FATTO — AZZERA 'E PUNTI
              </button>
              <button
                onClick={() => setMostraPenitenze(false)}
                className="rounded-sm border border-ottone/40 px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-etichetta-scura hover:text-etichetta"
              >
                CHIUDI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
