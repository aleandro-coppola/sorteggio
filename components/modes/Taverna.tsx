"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { uaPlayer } from "@/lib/bar";
import { fireConfetti } from "@/lib/confetti";
import { playFail, playPop, playSpin, playWin } from "@/lib/sound";
import {
  badges,
  EVENTI,
  Esito,
  EventoCtx,
  generaPersonaggio,
  livelloDaUA,
  lucidita,
  Personaggio,
  progressoLivello,
  risolviEvento,
  STAT_INFO,
} from "@/lib/taverna";

export default function Taverna({
  players,
  notify,
}: {
  players: string[];
  notify: (msg: string) => void;
}) {
  const { serate, setSerate } = useSession();

  // Serata attiva = la più recente (quella "'e stasera").
  const attiva = serate.length > 0 ? serate[serate.length - 1] : null;

  const pers = useMemo(() => {
    const m: Record<string, Personaggio> = {};
    for (const p of players) m[p] = generaPersonaggio(p);
    return m;
  }, [players]);

  const ua = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of players) m[p] = uaPlayer(attiva?.counts[p]);
    return m;
  }, [players, attiva]);

  const [esito, setEsito] = useState<Esito | null>(null);
  const [rolling, setRolling] = useState(false);
  const [dadoMostrato, setDadoMostrato] = useState<Record<string, number>>({});
  const [rivelato, setRivelato] = useState(false);
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (rollTimer.current) clearInterval(rollTimer.current);
  }, []);

  const tiraDestino = () => {
    if (players.length < 2) {
      notify("Servono almeno duje pe' 'stu destino! 👥");
      return;
    }
    const ctx: EventoCtx = { players, ua, pers, rng: Math.random };
    // Scegli un evento applicabile (quasi tutti lo sono).
    const disponibili = EVENTI.filter((e) => e.scegli(ctx).length >= (e.tipo === "duello" ? 2 : 1));
    const evento = disponibili[Math.floor(Math.random() * disponibili.length)];
    const risultato = risolviEvento(evento, ctx);

    setEsito(risultato);
    setRivelato(false);
    setDadoMostrato({});
    setRolling(true);
    playSpin(1400);

    // Animazione dei dadi che girano.
    const start = Date.now();
    rollTimer.current = setInterval(() => {
      const fake: Record<string, number> = {};
      for (const t of risultato.tiri) fake[t.nome] = 1 + Math.floor(Math.random() * 20);
      setDadoMostrato(fake);
      if (Date.now() - start > 1300) {
        if (rollTimer.current) clearInterval(rollTimer.current);
        const finali: Record<string, number> = {};
        for (const t of risultato.tiri) finali[t.nome] = t.dado;
        setDadoMostrato(finali);
        setRolling(false);
        setRivelato(true);
        if (risultato.perdenti.length === 0) {
          fireConfetti(140);
          playWin();
        } else {
          playFail();
        }
      }
    }, 70);
  };

  const chiudi = () => {
    setEsito(null);
    setRivelato(false);
  };

  // Segna la penitenza come bevuta reale sul Contabar (serata attiva).
  const segnaPenitenza = (nome: string) => {
    if (!attiva) {
      notify("Apri 'na serata int' 'o Contabar pe' segnà 'a bevuta! 🍺");
      return;
    }
    setSerate((prev) =>
      prev.map((s) => {
        if (s.id !== attiva.id) return s;
        const pc = { ...(s.counts[nome] ?? {}) };
        pc["penitenza"] = (pc["penitenza"] ?? 0) + 1;
        return {
          ...s,
          counts: { ...s.counts, [nome]: pc },
          log: [
            ...(s.log ?? []),
            { t: new Date().toISOString(), nome, drink: "penitenza" },
          ],
        };
      }),
    );
    playPop();
    notify(`🎲 Penitenza segnata pe' ${nome}!`);
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <p className="max-w-xl text-center text-lg italic text-etichetta-scura">
        Ogni guaglione tene 'o personaggio suoio. Cchiù bevi, cchiù sagli 'e
        livello… ma cala 'a lucidità! Quanno 'nce sta nu mumento muorto, tira
        &rsquo;o destino. 🎲
      </p>

      <button
        onClick={tiraDestino}
        disabled={rolling}
        className="etichetta animate-glow-pulse rounded-sm px-10 py-4 font-[family-name:var(--font-titolo)] text-2xl tracking-[0.2em] text-etichetta transition-all hover:scale-105 hover:brightness-125 active:scale-95 disabled:opacity-50"
      >
        🎲 TIRA &rsquo;O DESTINO
      </button>

      {!attiva && (
        <p className="text-center text-sm italic text-etichetta-scura/70">
          (Nisciuna serata aperta: 'e livelli stanno a 1. Apri 'o Contabar pe'
          fà festa!)
        </p>
      )}

      {/* ── Schede personaggio ── */}
      <div className="grid w-full gap-4 sm:grid-cols-2">
        {players.map((nome) => {
          const p = pers[nome];
          const u = ua[nome] ?? 0;
          const liv = livelloDaUA(u);
          const luc = lucidita(u, p.stats.fegato);
          const prog = progressoLivello(u);
          const bs = badges(attiva?.counts[nome], u);
          return (
            <div key={nome} className="etichetta rounded-sm p-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{p.archetipo.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-bold text-etichetta">
                    {nome}{" "}
                    <span className="text-base font-normal text-ottone-chiaro">
                      {p.nomeEpico}
                    </span>
                  </p>
                  <p className="truncate text-sm text-assenzio-pallido">
                    {p.archetipo.nome} · {p.classe}
                  </p>
                </div>
                <div className="text-center">
                  <p className="testo-oro font-[family-name:var(--font-titolo)] text-2xl font-black leading-none">
                    Lv{liv}
                  </p>
                </div>
              </div>

              {/* Lucidità (HP) e progresso livello */}
              <div className="mt-3 space-y-1.5">
                <div>
                  <div className="flex justify-between text-[11px] tracking-widest text-etichetta-scura">
                    <span>LUCIDITÀ</span>
                    <span>{luc}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-abisso/60">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${luc}%`,
                        background:
                          luc > 50
                            ? "linear-gradient(90deg,#2e8f5f,#a8e05f)"
                            : luc > 20
                              ? "linear-gradient(90deg,#c9a227,#e5c76b)"
                              : "linear-gradient(90deg,#7f1d1d,#ef4444)",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] tracking-widest text-etichetta-scura">
                    <span>PE (bevute)</span>
                    <span>{u.toFixed(1)} UA</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-abisso/60">
                    <div
                      className="h-full rounded-full bg-assenzio/70"
                      style={{ width: `${prog * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Statistiche */}
              <div className="mt-3 grid grid-cols-5 gap-1 text-center">
                {STAT_INFO.map((s) => (
                  <div key={s.key} className="rounded-sm bg-abisso/40 py-1">
                    <p className="text-base leading-none">{s.emoji}</p>
                    <p className="font-[family-name:var(--font-titolo)] text-lg font-bold text-etichetta">
                      {p.stats[s.key]}
                    </p>
                    <p className="text-[9px] tracking-wider text-etichetta-scura">
                      {s.label.slice(0, 4).toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-sm italic text-etichetta-scura">
                ⚔️ {p.archetipo.abilita}
              </p>

              {bs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {bs.map((b) => (
                    <span
                      key={b.nome}
                      className="rounded-full border border-ottone/40 bg-vetro/50 px-2 py-0.5 text-xs text-etichetta"
                      title={b.nome}
                    >
                      {b.emoji} {b.nome}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-2 text-center text-sm italic text-ottone-chiaro/80">
                {p.motto}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Modale evento ── */}
      {esito && (
        <div
          className="fixed inset-0 z-[560] flex items-center justify-center bg-abisso/85 p-4 backdrop-blur-sm"
          onClick={rivelato ? chiudi : undefined}
        >
          <div
            className="etichetta w-full max-w-md animate-pop-in rounded-sm p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-5xl">{esito.evento.emoji}</p>
            <p className="mt-2 font-[family-name:var(--font-titolo)] text-2xl font-bold text-ottone-chiaro">
              {esito.evento.titolo}
            </p>
            <div className="divisorio-oro my-3" />
            <p className="text-lg italic text-etichetta">
              {esito.evento.testo(esito.nomi)}
            </p>

            {/* Dadi */}
            {esito.tiri.length > 0 && (
              <div className="my-5 flex justify-center gap-4">
                {esito.tiri.map((t) => {
                  const val = dadoMostrato[t.nome] ?? t.dado;
                  const isLoser = rivelato && esito.perdenti.includes(t.nome);
                  const isWinner = rivelato && esito.vincitori.includes(t.nome);
                  return (
                    <div key={t.nome} className="text-center">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 font-[family-name:var(--font-titolo)] text-3xl font-black transition-all ${
                          rolling
                            ? "border-ottone/60 text-etichetta"
                            : isLoser
                              ? "border-red-500 bg-red-950/50 text-red-300"
                              : isWinner
                                ? "border-assenzio bg-smeraldo/40 text-assenzio-pallido shadow-[0_0_14px_rgba(168,224,95,0.5)]"
                                : "border-ottone text-etichetta"
                        }`}
                      >
                        {val}
                      </div>
                      <p className="mt-1 max-w-16 truncate text-sm text-etichetta">
                        {t.nome}
                      </p>
                      {rivelato && esito.evento.stat && (
                        <p className="text-[11px] text-etichetta-scura">
                          {t.dado}
                          {t.mod >= 0 ? `+${t.mod}` : t.mod} = {t.totale}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {rivelato && (
              <>
                <div className="divisorio-oro my-3" />
                {esito.perdenti.length === 0 ? (
                  <p className="testo-oro font-[family-name:var(--font-titolo)] text-xl font-bold">
                    ✅ {esito.evento.premio ?? "Sarvo!"}
                  </p>
                ) : (
                  <>
                    <p className="font-[family-name:var(--font-titolo)] text-xl font-bold text-assenzio">
                      🍻 {esito.perdenti.join(" e ")} BEVE!
                    </p>
                    <p className="mt-1 text-base italic text-etichetta">
                      {esito.evento.penitenza}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {esito.perdenti.map((n) => (
                        <button
                          key={n}
                          onClick={() => segnaPenitenza(n)}
                          className="rounded-sm border border-assenzio/60 bg-smeraldo/30 px-4 py-1.5 text-sm text-assenzio-pallido transition-all hover:scale-105 hover:bg-smeraldo/60"
                        >
                          🎲 Segna 'a penitenza {esito.perdenti.length > 1 ? `(${n})` : ""}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div className="divisorio-oro my-4" />
                <div className="flex justify-center gap-3">
                  <button
                    onClick={tiraDestino}
                    className="rounded-sm border border-ottone/60 px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-ottone-chiaro transition-all hover:scale-105 hover:bg-ottone/15"
                  >
                    N&rsquo;ATU TIRO
                  </button>
                  <button
                    onClick={chiudi}
                    className="rounded-sm border border-ottone/40 px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-etichetta-scura transition-all hover:text-etichetta"
                  >
                    CHIUDI
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
