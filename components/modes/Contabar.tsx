"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Counts,
  DRINKS,
  DrinkKey,
  formatData,
  isEroe,
  labelSerata,
  loadSerate,
  nuovaSerata as creaSerata,
  saveSerate,
  Serata,
  totalePlayer,
} from "@/lib/bar";
import { playCheers, playUndo } from "@/lib/sound";

const MEDAGLIE = ["👑", "🥈", "🥉"];

export default function Contabar({
  players,
  notify,
}: {
  players: string[];
  notify: (msg: string) => void;
}) {
  const [serate, setSerate] = useState<Serata[]>([]);
  const [currentId, setCurrentId] = useState<string>("");
  const [tab, setTab] = useState<"conta" | "stat">("conta");
  const [statScope, setStatScope] = useState<"serata" | "tutte">("serata");
  const loaded = useRef(false);

  // Carica le serate salvate (o creane una nuova al primo avvio).
  useEffect(() => {
    const saved = loadSerate();
    if (saved.length > 0) {
      setSerate(saved);
      setCurrentId(saved[saved.length - 1].id);
    } else {
      const s = creaSerata();
      setSerate([s]);
      setCurrentId(s.id);
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (loaded.current) saveSerate(serate);
  }, [serate]);

  const currentIdx = serate.findIndex((s) => s.id === currentId);
  const current = serate[currentIdx];

  const modifica = (nome: string, key: DrinkKey, delta: number) => {
    setSerate((prev) =>
      prev.map((s) => {
        if (s.id !== currentId) return s;
        const pc = { ...(s.counts[nome] ?? {}) };
        const val = Math.max(0, (pc[key] ?? 0) + delta);
        if (val === 0) delete pc[key];
        else pc[key] = val;
        const counts: Counts = { ...s.counts, [nome]: pc };
        return { ...s, counts };
      }),
    );
    if (delta > 0) playCheers();
    else playUndo();
  };

  const svuotaPlayer = (nome: string) => {
    setSerate((prev) =>
      prev.map((s) =>
        s.id === currentId
          ? { ...s, counts: { ...s.counts, [nome]: {} } }
          : s,
      ),
    );
  };

  const aggiungiSerata = () => {
    const s = creaSerata();
    setSerate((prev) => [...prev, s]);
    setCurrentId(s.id);
    setTab("conta");
    notify("Nuova serata aperta! Ca vaco 'e brinnesse! 🥂");
  };

  const eliminaSerata = () => {
    if (serate.length <= 1) {
      notify("Nun può cancellà ll'unica serata! 🤷");
      return;
    }
    if (!confirm("Sicuro? 'A serata se ne va pe' sempe.")) return;
    setSerate((prev) => {
      const next = prev.filter((s) => s.id !== currentId);
      setCurrentId(next[next.length - 1].id);
      return next;
    });
  };

  // ── Statistiche ──
  const statSerata = useMemo(() => {
    if (!current) return null;
    const righe = players
      .map((nome) => ({ nome, tot: totalePlayer(current.counts[nome]) }))
      .sort((a, b) => b.tot - a.tot);
    const totale = righe.reduce((a, r) => a + r.tot, 0);
    const perTipo = DRINKS.map((d) => ({
      ...d,
      tot: players.reduce((a, n) => a + (current.counts[n]?.[d.key] ?? 0), 0),
    })).sort((a, b) => b.tot - a.tot);
    const gettonato = perTipo[0]?.tot > 0 ? perTipo[0] : null;
    return { righe, totale, gettonato };
  }, [current, players]);

  const statTutte = useMemo(() => {
    // Aggrega su tutte le serate, includendo anche nomi non più in comitiva.
    const totali: Record<string, number> = {};
    let record = { nome: "", tot: 0, serataLabel: "" };
    let totaleStorico = 0;
    serate.forEach((s, i) => {
      const nomi = new Set([...players, ...Object.keys(s.counts)]);
      nomi.forEach((nome) => {
        const t = totalePlayer(s.counts[nome]);
        totali[nome] = (totali[nome] ?? 0) + t;
        totaleStorico += t;
        if (t > record.tot) {
          record = { nome, tot: t, serataLabel: labelSerata(s, i) };
        }
      });
    });
    const classifica = Object.entries(totali)
      .map(([nome, tot]) => ({ nome, tot }))
      .filter((r) => r.tot > 0)
      .sort((a, b) => b.tot - a.tot);
    return {
      classifica,
      record: record.tot > 0 ? record : null,
      totaleStorico,
      nSerate: serate.length,
    };
  }, [serate, players]);

  if (!current) return null;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* ── Selettore serata ── */}
      <div className="etichetta flex w-full max-w-xl flex-col gap-3 rounded-sm p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="text-xs tracking-[0.3em] text-ottone-chiaro">SERATA</p>
          <select
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
            className="mt-1 w-full rounded-sm border border-ottone/40 bg-bottiglia/80 px-3 py-2 text-lg text-etichetta focus:border-assenzio focus:outline-none"
          >
            {serate.map((s, i) => (
              <option key={s.id} value={s.id} className="bg-bottiglia">
                {labelSerata(s, i)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={aggiungiSerata}
            className="rounded-sm border border-assenzio/60 bg-smeraldo/40 px-4 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-wider text-assenzio-pallido transition-all hover:scale-105 hover:bg-smeraldo/70"
          >
            ➕ SERATA
          </button>
          <button
            onClick={eliminaSerata}
            className="rounded-sm border border-red-900/60 px-3 py-2 text-sm text-etichetta-scura/70 transition-all hover:border-red-500/60 hover:text-red-300"
            aria-label="Elimina serata"
          >
            🗑
          </button>
        </div>
      </div>

      {/* ── Tab ── */}
      <div className="flex gap-2">
        {(
          [
            ["conta", "🍻 CONTA"],
            ["stat", "📊 STATISTICHE"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-sm border px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest transition-all ${
              tab === id
                ? "border-assenzio bg-smeraldo/50 text-assenzio-pallido"
                : "border-ottone/40 text-etichetta-scura hover:border-ottone"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTA ── */}
      {tab === "conta" && (
        <div className="grid w-full gap-4 sm:grid-cols-2">
          {players.map((nome) => {
            const pc = current.counts[nome];
            const tot = totalePlayer(pc);
            const eroe = isEroe(pc);
            return (
              <div key={nome} className="etichetta rounded-sm p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xl font-semibold text-etichetta">
                    {nome}
                    {eroe && (
                      <span className="ml-2 text-sm text-assenzio">
                        🧃 EROE
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-titolo)] text-3xl font-black text-ottone-chiaro">
                      {tot}
                    </span>
                    {tot > 0 && (
                      <button
                        onClick={() => svuotaPlayer(nome)}
                        className="text-sm text-etichetta-scura/60 transition-colors hover:text-red-400"
                        aria-label={`Azzera ${nome}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DRINKS.map((d) => {
                    const c = pc?.[d.key] ?? 0;
                    return (
                      <div
                        key={d.key}
                        className={`relative flex items-center overflow-hidden rounded-sm border transition-all ${
                          c > 0
                            ? "border-assenzio/60 bg-smeraldo/30"
                            : "border-ottone/25"
                        }`}
                      >
                        <button
                          onClick={() => modifica(nome, d.key, 1)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-lg transition-all hover:bg-smeraldo/40 active:scale-95"
                          title={`+1 ${d.label}`}
                        >
                          <span>{d.emoji}</span>
                          <span
                            className={
                              c > 0
                                ? "font-semibold text-assenzio-pallido"
                                : "text-etichetta-scura/50"
                            }
                          >
                            {c}
                          </span>
                        </button>
                        {c > 0 && (
                          <button
                            onClick={() => modifica(nome, d.key, -1)}
                            className="border-l border-ottone/20 px-2 py-1.5 text-sm text-etichetta-scura transition-colors hover:bg-red-950/50 hover:text-red-300"
                            aria-label={`-1 ${d.label}`}
                          >
                            −
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB STATISTICHE ── */}
      {tab === "stat" && statSerata && (
        <div className="flex w-full max-w-xl flex-col items-center gap-5">
          <div className="flex gap-2">
            {(
              [
                ["serata", "STA SERATA"],
                ["tutte", "TUTTE 'E SERATE"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setStatScope(id)}
                className={`rounded-sm border px-4 py-1.5 font-[family-name:var(--font-titolo)] text-xs tracking-widest transition-all ${
                  statScope === id
                    ? "border-assenzio bg-smeraldo/50 text-assenzio-pallido"
                    : "border-ottone/40 text-etichetta-scura hover:border-ottone"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Statistiche della serata corrente */}
          {statScope === "serata" && (
            <>
              <div className="etichetta w-full rounded-sm p-5 text-center">
                <p className="text-xs tracking-[0.3em] text-ottone-chiaro">
                  {formatData(current.date).toUpperCase()}
                </p>
                <p className="testo-oro font-[family-name:var(--font-titolo)] text-5xl font-black">
                  {statSerata.totale}
                </p>
                <p className="text-lg italic text-etichetta-scura">
                  bevute in tutto &mdash;{" "}
                  {statSerata.gettonato
                    ? `'o cchiù gettonato: ${statSerata.gettonato.emoji} ${statSerata.gettonato.label} (${statSerata.gettonato.tot})`
                    : "ancora asciutto…"}
                </p>
              </div>

              {statSerata.totale === 0 ? (
                <p className="text-center text-lg italic text-etichetta-scura">
                  Ancora nisciuno ha bevuto niente. Che serata triste! 🥱
                </p>
              ) : (
                <ol className="w-full space-y-2">
                  {statSerata.righe
                    .filter((r) => r.tot > 0)
                    .map((r, i) => (
                      <li
                        key={r.nome}
                        className={`etichetta flex items-center gap-4 rounded-sm px-5 py-3 ${
                          i === 0
                            ? "shadow-[0_0_18px_rgba(201,162,39,0.35)]"
                            : ""
                        }`}
                      >
                        <span className="w-8 text-center font-[family-name:var(--font-titolo)] text-2xl text-ottone-chiaro">
                          {MEDAGLIE[i] ?? `${i + 1}°`}
                        </span>
                        <span
                          className={`flex-1 truncate text-xl ${
                            i === 0
                              ? "testo-oro font-bold"
                              : "text-etichetta"
                          }`}
                        >
                          {r.nome}
                        </span>
                        <span className="font-[family-name:var(--font-titolo)] text-2xl font-black text-etichetta">
                          {r.tot}
                        </span>
                      </li>
                    ))}
                </ol>
              )}
            </>
          )}

          {/* Statistiche di tutte le serate */}
          {statScope === "tutte" && (
            <>
              <div className="grid w-full grid-cols-2 gap-3">
                <div className="etichetta rounded-sm p-4 text-center">
                  <p className="testo-oro font-[family-name:var(--font-titolo)] text-4xl font-black">
                    {statTutte.nSerate}
                  </p>
                  <p className="text-sm italic text-etichetta-scura">
                    serate
                  </p>
                </div>
                <div className="etichetta rounded-sm p-4 text-center">
                  <p className="testo-oro font-[family-name:var(--font-titolo)] text-4xl font-black">
                    {statTutte.totaleStorico}
                  </p>
                  <p className="text-sm italic text-etichetta-scura">
                    bevute totali
                  </p>
                </div>
              </div>

              {statTutte.record && (
                <div className="etichetta w-full animate-glow-pulse rounded-sm p-5 text-center">
                  <p className="text-xs tracking-[0.3em] text-ottone-chiaro">
                    🏆 &rsquo;A SBORNIA STORICA
                  </p>
                  <div className="divisorio-oro my-3" />
                  <p className="testo-oro font-[family-name:var(--font-titolo)] text-3xl font-bold">
                    {statTutte.record.nome}
                  </p>
                  <p className="mt-1 text-lg italic text-etichetta">
                    {statTutte.record.tot} bevute &mdash;{" "}
                    {statTutte.record.serataLabel}
                  </p>
                  <p className="mt-1 text-base text-etichetta-scura">
                    Nu record ca fa paura. 🍻
                  </p>
                </div>
              )}

              {statTutte.classifica.length === 0 ? (
                <p className="text-center text-lg italic text-etichetta-scura">
                  Archivio vacante. Cumincia a bevere! 🥂
                </p>
              ) : (
                <>
                  <p className="font-[family-name:var(--font-titolo)] text-sm tracking-[0.3em] text-ottone-chiaro">
                    👑 &rsquo;O RE D&rsquo;&rsquo;A CANTINA
                  </p>
                  <ol className="w-full space-y-2">
                    {statTutte.classifica.map((r, i) => (
                      <li
                        key={r.nome}
                        className={`etichetta flex items-center gap-4 rounded-sm px-5 py-3 ${
                          i === 0
                            ? "shadow-[0_0_18px_rgba(201,162,39,0.35)]"
                            : ""
                        }`}
                      >
                        <span className="w-8 text-center font-[family-name:var(--font-titolo)] text-2xl text-ottone-chiaro">
                          {MEDAGLIE[i] ?? `${i + 1}°`}
                        </span>
                        <span
                          className={`flex-1 truncate text-xl ${
                            i === 0 ? "testo-oro font-bold" : "text-etichetta"
                          }`}
                        >
                          {r.nome}
                        </span>
                        <span className="font-[family-name:var(--font-titolo)] text-2xl font-black text-etichetta">
                          {r.tot}
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
