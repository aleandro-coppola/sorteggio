"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Counts,
  formatData,
  formatOra,
  isEroe,
  labelSerata,
  LogEvent,
  nuovaSerata as creaSerata,
  totalePlayer,
  uaPlayer,
} from "@/lib/bar";
import {
  CATALOGO,
  Categoria,
  CATEGORIE,
  Drink,
  drinkById,
  uaById,
} from "@/lib/drinks";
import { playCheers, playUndo } from "@/lib/sound";
import { useSession } from "@/components/SessionProvider";

const MEDAGLIE = ["👑", "🥈", "🥉"];
const fmtUA = (n: number) => n.toFixed(1);

// Nome + emoji di un drink dal suo id, con fallback se non è in catalogo.
function drinkInfo(id: string): { nome: string; emoji: string } {
  const d = drinkById(id);
  if (d) return { nome: d.nome, emoji: d.emoji };
  return { nome: id, emoji: "🥤" };
}

export default function Contabar({
  players,
  notify,
}: {
  players: string[];
  notify: (msg: string) => void;
}) {
  // Le serate vivono nella sessione: locali o condivise nel cloud.
  const { serate, setSerate } = useSession();
  const [currentId, setCurrentId] = useState<string>("");
  const [tab, setTab] = useState<"conta" | "stat" | "storico">("conta");
  const [statScope, setStatScope] = useState<"serata" | "tutte">("serata");
  const [picker, setPicker] = useState<string | null>(null); // giocatore che aggiunge
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<Categoria | "tutte">("tutte");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (picker) setTimeout(() => searchRef.current?.focus(), 50);
  }, [picker]);

  // Tieni valida la serata selezionata quando l'elenco cambia (anche da remoto).
  const currentIdx = serate.findIndex((s) => s.id === currentId);
  const current = serate[currentIdx];
  useEffect(() => {
    if (serate.length > 0 && currentIdx === -1) {
      setCurrentId(serate[serate.length - 1].id);
    }
  }, [serate, currentIdx]);

  const modifica = (nome: string, id: string, delta: number) => {
    setSerate((prev) =>
      prev.map((s) => {
        if (s.id !== currentId) return s;
        const pc = { ...(s.counts[nome] ?? {}) };
        const cur = pc[id] ?? 0;
        const val = Math.max(0, cur + delta);
        if (val === cur) return s;
        if (val === 0) delete pc[id];
        else pc[id] = val;
        const counts: Counts = { ...s.counts, [nome]: pc };
        const log: LogEvent[] = s.log ? [...s.log] : [];
        if (delta > 0) {
          log.push({ t: new Date().toISOString(), nome, drink: id });
        } else {
          for (let i = log.length - 1; i >= 0; i--) {
            if (log[i].nome === nome && log[i].drink === id) {
              log.splice(i, 1);
              break;
            }
          }
        }
        return { ...s, counts, log };
      }),
    );
    if (delta > 0) playCheers();
    else playUndo();
  };

  const svuotaPlayer = (nome: string) => {
    setSerate((prev) =>
      prev.map((s) =>
        s.id === currentId
          ? {
              ...s,
              counts: { ...s.counts, [nome]: {} },
              log: (s.log ?? []).filter((e) => e.nome !== nome),
            }
          : s,
      ),
    );
  };

  // Elimina UNA riga dello storico e scala il conteggio corrispondente, così
  // sparisce anche dalle statistiche (utile per ripulire dati sfasati).
  const eliminaDalLog = (serataId: string, ev: LogEvent) => {
    setSerate((prev) =>
      prev.map((s) => {
        if (s.id !== serataId) return s;
        const log = [...(s.log ?? [])];
        const idx = log.findIndex(
          (e) => e.t === ev.t && e.nome === ev.nome && e.drink === ev.drink,
        );
        if (idx !== -1) log.splice(idx, 1);
        const pc = { ...(s.counts[ev.nome] ?? {}) };
        const val = Math.max(0, (pc[ev.drink] ?? 0) - 1);
        if (val === 0) delete pc[ev.drink];
        else pc[ev.drink] = val;
        return { ...s, counts: { ...s.counts, [ev.nome]: pc }, log };
      }),
    );
    playUndo();
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
    const next = serate.filter((s) => s.id !== currentId);
    setCurrentId(next[next.length - 1].id);
    setSerate((prev) => prev.filter((s) => s.id !== currentId));
  };

  // ── Statistiche serata corrente (per UNITÀ ALCOLICHE) ──
  const statSerata = useMemo(() => {
    if (!current) return null;
    const righe = players
      .map((nome) => ({
        nome,
        n: totalePlayer(current.counts[nome]),
        ua: uaPlayer(current.counts[nome]),
      }))
      .sort((a, b) => b.ua - a.ua || b.n - a.n);
    const totN = righe.reduce((a, r) => a + r.n, 0);
    const totUA = righe.reduce((a, r) => a + r.ua, 0);
    // Drink più gettonato (per quantità).
    const perDrink: Record<string, number> = {};
    players.forEach((nome) => {
      const pc = current.counts[nome] ?? {};
      for (const [id, q] of Object.entries(pc)) perDrink[id] = (perDrink[id] ?? 0) + q;
    });
    const top = Object.entries(perDrink).sort((a, b) => b[1] - a[1])[0];
    const gettonato = top ? { ...drinkInfo(top[0]), q: top[1] } : null;
    return { righe, totN, totUA, gettonato };
  }, [current, players]);

  // ── Statistiche di tutte le serate ──
  const statTutte = useMemo(() => {
    const totUA: Record<string, number> = {};
    let record = { nome: "", ua: 0, serataLabel: "" };
    let totaleUA = 0;
    serate.forEach((s, i) => {
      const nomi = new Set([...players, ...Object.keys(s.counts)]);
      nomi.forEach((nome) => {
        const u = uaPlayer(s.counts[nome]);
        totUA[nome] = (totUA[nome] ?? 0) + u;
        totaleUA += u;
        if (u > record.ua) {
          record = { nome, ua: u, serataLabel: labelSerata(s, i) };
        }
      });
    });
    const classifica = Object.entries(totUA)
      .map(([nome, ua]) => ({ nome, ua }))
      .filter((r) => r.ua > 0.05)
      .sort((a, b) => b.ua - a.ua);
    return {
      classifica,
      record: record.ua > 0 ? record : null,
      totaleUA,
      nSerate: serate.length,
    };
  }, [serate, players]);

  // ── Catalogo filtrato per il picker ──
  const risultati = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CATALOGO.filter(
      (d) =>
        (catFilter === "tutte" || d.cat === catFilter) &&
        (q === "" ||
          d.nome.toLowerCase().includes(q) ||
          d.cat.toLowerCase().includes(q)),
    );
  }, [search, catFilter]);

  const risultatiPerCat = useMemo(() => {
    const map = new Map<Categoria, Drink[]>();
    for (const d of risultati) {
      if (!map.has(d.cat)) map.set(d.cat, []);
      map.get(d.cat)!.push(d);
    }
    return map;
  }, [risultati]);

  if (!current) {
    return (
      <div className="etichetta mx-auto max-w-md rounded-sm p-8 text-center">
        <p className="animate-float text-5xl">🍾</p>
        <p className="mt-4 text-xl italic text-etichetta">
          Ancora nisciuna serata. Aprine una e cumincia a cuntà &rsquo;e bevute!
        </p>
        <button
          onClick={aggiungiSerata}
          className="mt-5 rounded-sm border border-assenzio/60 bg-smeraldo/40 px-8 py-3 font-[family-name:var(--font-titolo)] text-lg tracking-widest text-assenzio-pallido transition-all hover:scale-105 hover:bg-smeraldo/70"
        >
          ➕ APRI &rsquo;A PRIMMA SERATA
        </button>
      </div>
    );
  }

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
            ["storico", "📜 STORICO"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-sm border px-4 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest transition-all ${
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
        <>
          <p className="max-w-xl text-center text-sm italic text-etichetta-scura">
            UA = unità alcoliche (~12 g d&rsquo;alcol puro). Chi guida e beve
            analcolico vale 0. Cerca &rsquo;o drink giusto: nu Negroni pesa cchiù
            &rsquo;e na Corona! 🚗
          </p>
          <div className="grid w-full gap-4 sm:grid-cols-2">
            {players.map((nome) => {
              const pc = current.counts[nome];
              const n = totalePlayer(pc);
              const ua = uaPlayer(pc);
              const eroe = isEroe(pc);
              const voci = Object.entries(pc ?? {}).filter(([, q]) => q > 0);
              return (
                <div key={nome} className="etichetta rounded-sm p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-xl font-semibold text-etichetta">
                      {nome}
                      {eroe && (
                        <span className="ml-2 text-sm text-assenzio">
                          🧃 EROE
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <p className="testo-oro font-[family-name:var(--font-titolo)] text-3xl font-black leading-none">
                          {fmtUA(ua)}
                        </p>
                        <p className="text-[10px] tracking-widest text-ottone-chiaro">
                          UA · {n} drink
                        </p>
                      </div>
                      {n > 0 && (
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

                  {voci.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {voci.map(([id, q]) => {
                        const info = drinkInfo(id);
                        return (
                          <div
                            key={id}
                            className="flex items-center overflow-hidden rounded-sm border border-assenzio/50 bg-smeraldo/25"
                          >
                            <button
                              onClick={() => modifica(nome, id, 1)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-base transition-all hover:bg-smeraldo/50 active:scale-95"
                              title={`+1 ${info.nome}`}
                            >
                              <span>{info.emoji}</span>
                              <span className="max-w-[9rem] truncate text-etichetta">
                                {info.nome}
                              </span>
                              <span className="font-semibold text-assenzio-pallido">
                                ×{q}
                              </span>
                            </button>
                            <button
                              onClick={() => modifica(nome, id, -1)}
                              className="border-l border-ottone/20 px-2 py-1.5 text-sm text-etichetta-scura transition-colors hover:bg-red-950/50 hover:text-red-300"
                              aria-label={`-1 ${info.nome}`}
                            >
                              −
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setPicker(nome);
                      setSearch("");
                      setCatFilter("tutte");
                    }}
                    className="mt-3 w-full rounded-sm border border-ottone/50 bg-bottiglia/60 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-ottone-chiaro transition-all hover:border-ottone hover:bg-smeraldo/30"
                  >
                    ➕ AGGIUNGI DRINK
                  </button>
                </div>
              );
            })}
          </div>
        </>
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

          {statScope === "serata" && (
            <>
              <div className="etichetta w-full rounded-sm p-5 text-center">
                <p className="text-xs tracking-[0.3em] text-ottone-chiaro">
                  {formatData(current.date).toUpperCase()}
                </p>
                <p className="testo-oro font-[family-name:var(--font-titolo)] text-5xl font-black">
                  {fmtUA(statSerata.totUA)}
                </p>
                <p className="text-lg italic text-etichetta-scura">
                  unità alcoliche &mdash; {statSerata.totN} drink in tutto
                  {statSerata.gettonato
                    ? ` · 'o cchiù gettonato: ${statSerata.gettonato.emoji} ${statSerata.gettonato.nome} (${statSerata.gettonato.q})`
                    : ""}
                </p>
              </div>

              {statSerata.totN === 0 ? (
                <p className="text-center text-lg italic text-etichetta-scura">
                  Ancora nisciuno ha bevuto niente. Che serata triste! 🥱
                </p>
              ) : (
                <>
                  <p className="font-[family-name:var(--font-titolo)] text-sm tracking-[0.3em] text-ottone-chiaro">
                    🍺 CHI HA BEVUTO CCHIÙ ALCOL
                  </p>
                  <ol className="w-full space-y-2">
                    {statSerata.righe
                      .filter((r) => r.n > 0)
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
                              i === 0 ? "testo-oro font-bold" : "text-etichetta"
                            }`}
                          >
                            {r.nome}
                            {r.ua < 0.05 && (
                              <span className="ml-2 text-sm text-assenzio">
                                🧃
                              </span>
                            )}
                          </span>
                          <span className="text-right">
                            <span className="font-[family-name:var(--font-titolo)] text-2xl font-black text-etichetta">
                              {fmtUA(r.ua)}
                            </span>
                            <span className="ml-1 text-xs text-ottone-chiaro">
                              UA
                            </span>
                            <p className="text-[11px] text-etichetta-scura">
                              {r.n} drink
                            </p>
                          </span>
                        </li>
                      ))}
                  </ol>
                </>
              )}
            </>
          )}

          {statScope === "tutte" && (
            <>
              <div className="grid w-full grid-cols-2 gap-3">
                <div className="etichetta rounded-sm p-4 text-center">
                  <p className="testo-oro font-[family-name:var(--font-titolo)] text-4xl font-black">
                    {statTutte.nSerate}
                  </p>
                  <p className="text-sm italic text-etichetta-scura">serate</p>
                </div>
                <div className="etichetta rounded-sm p-4 text-center">
                  <p className="testo-oro font-[family-name:var(--font-titolo)] text-4xl font-black">
                    {fmtUA(statTutte.totaleUA)}
                  </p>
                  <p className="text-sm italic text-etichetta-scura">
                    UA totali
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
                    {fmtUA(statTutte.record.ua)} UA &mdash;{" "}
                    {statTutte.record.serataLabel}
                  </p>
                  <p className="mt-1 text-base text-etichetta-scura">
                    Nu record ca fa paura. 🍻
                  </p>
                </div>
              )}

              {statTutte.classifica.length === 0 ? (
                <p className="text-center text-lg italic text-etichetta-scura">
                  Archivio asciutto. Cumincia a bevere! 🥂
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
                        <span>
                          <span className="font-[family-name:var(--font-titolo)] text-2xl font-black text-etichetta">
                            {fmtUA(r.ua)}
                          </span>
                          <span className="ml-1 text-xs text-ottone-chiaro">
                            UA
                          </span>
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

      {/* ── TAB STORICO ── */}
      {tab === "storico" && (
        <div className="flex w-full max-w-xl flex-col gap-6">
          {serate.every((s) => (s.log ?? []).length === 0) ? (
            <p className="text-center text-lg italic text-etichetta-scura">
              Ancora niente storico. Ogni bevuta ca aggiungi resta segnata cca
              cu data e ora! 🕰️
            </p>
          ) : (
            serate
              .map((s, i) => ({ s, i }))
              .filter(({ s }) => (s.log ?? []).length > 0)
              .reverse()
              .map(({ s, i }) => {
                const log = [...(s.log ?? [])].reverse();
                return (
                  <div key={s.id} className="etichetta rounded-sm p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-[family-name:var(--font-titolo)] text-lg text-ottone-chiaro">
                        {labelSerata(s, i)}
                      </p>
                      <span className="text-sm italic text-etichetta-scura">
                        {log.length} bevute
                      </span>
                    </div>
                    <div className="divisorio-oro my-3" />
                    <div className="overflow-x-auto">
                      <div className="min-w-[340px]">
                        <div className="flex items-center gap-3 border-b border-ottone/30 px-2 pb-1 text-xs tracking-widest text-ottone-chiaro">
                          <span className="w-28">DATA / ORA</span>
                          <span className="flex-1">CHI</span>
                          <span>DRINK</span>
                          <span className="w-6" />
                        </div>
                        {log.map((e, k) => {
                          const info = drinkInfo(e.drink);
                          return (
                            <div
                              key={`${e.t}-${k}`}
                              className="flex items-center gap-3 border-b border-ottone/10 px-2 py-1.5 text-base"
                            >
                              <span className="w-28 text-sm text-etichetta-scura">
                                {formatOra(e.t)}
                              </span>
                              <span className="flex-1 truncate text-etichetta">
                                {e.nome}
                              </span>
                              <span className="truncate text-right">
                                <span className="text-lg">{info.emoji}</span>{" "}
                                <span className="text-etichetta-scura">
                                  {info.nome}
                                </span>
                              </span>
                              <button
                                onClick={() => eliminaDalLog(s.id, e)}
                                className="w-6 shrink-0 text-etichetta-scura/50 transition-colors hover:text-red-400"
                                aria-label={`Elimina ${info.nome} di ${e.nome}`}
                                title="Elimina questa bevuta (scala anche le statistiche)"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* ── Picker: cerca e seleziona il drink ── */}
      {picker && (
        <div
          className="fixed inset-0 z-[550] flex items-end justify-center bg-abisso/85 p-3 backdrop-blur-sm sm:items-center"
          onClick={() => setPicker(null)}
        >
          <div
            className="etichetta flex max-h-[85vh] w-full max-w-lg animate-pop-in flex-col rounded-sm p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-[family-name:var(--font-titolo)] text-lg text-ottone-chiaro">
                Che t&rsquo;e bevuto, {picker}?
              </p>
              <button
                onClick={() => setPicker(null)}
                className="rounded-sm border border-ottone/50 px-3 py-1 text-sm text-etichetta-scura hover:text-etichetta"
              >
                FATTO
              </button>
            </div>

            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca… (mojito, corona, shot, spritz…)"
              className="mt-3 w-full rounded-sm border border-ottone/40 bg-abisso/60 px-3 py-2.5 text-lg text-etichetta placeholder:text-etichetta-scura/50 focus:border-assenzio focus:outline-none"
            />

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(["tutte", ...CATEGORIE.map((c) => c.cat)] as const).map((c) => {
                const emoji =
                  c === "tutte"
                    ? "🍸"
                    : CATEGORIE.find((x) => x.cat === c)?.emoji;
                return (
                  <button
                    key={c}
                    onClick={() => setCatFilter(c as Categoria | "tutte")}
                    className={`rounded-full border px-3 py-1 text-sm transition-all ${
                      catFilter === c
                        ? "border-assenzio bg-smeraldo/50 text-assenzio-pallido"
                        : "border-ottone/40 text-etichetta-scura hover:border-ottone"
                    }`}
                  >
                    {emoji} {c === "tutte" ? "Tutti" : c}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex-1 overflow-y-auto pr-1">
              {risultati.length === 0 && (
                <p className="py-6 text-center italic text-etichetta-scura">
                  Nun tenimmo &rsquo;stu drink… pruova n&rsquo;atu nomme! 🤷
                </p>
              )}
              {[...risultatiPerCat.entries()].map(([cat, drinks]) => (
                <div key={cat} className="mb-3">
                  <p className="mb-1 text-xs tracking-[0.3em] text-ottone-chiaro">
                    {CATEGORIE.find((c) => c.cat === cat)?.emoji} {cat.toUpperCase()}
                  </p>
                  <div className="space-y-1.5">
                    {drinks.map((d) => {
                      const q = current.counts[picker]?.[d.id] ?? 0;
                      const ua = uaById(d.id);
                      return (
                        <button
                          key={d.id}
                          onClick={() => modifica(picker, d.id, 1)}
                          className={`flex w-full items-center gap-3 rounded-sm border px-3 py-2 text-left transition-all active:scale-[0.98] ${
                            q > 0
                              ? "border-assenzio/60 bg-smeraldo/30"
                              : "border-ottone/25 hover:border-ottone/70 hover:bg-smeraldo/20"
                          }`}
                        >
                          <span className="text-2xl">{d.emoji}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-lg text-etichetta">
                              {d.nome}
                            </span>
                            <span className="text-xs text-etichetta-scura">
                              {d.abv > 0
                                ? `${d.abv}% · ${d.ml} ml · ${fmtUA(ua)} UA`
                                : "analcolico · 0 UA"}
                            </span>
                          </span>
                          {q > 0 && (
                            <span className="rounded-full bg-assenzio/20 px-2 py-0.5 text-sm font-semibold text-assenzio-pallido">
                              ×{q}
                            </span>
                          )}
                          <span className="font-[family-name:var(--font-titolo)] text-xl text-ottone-chiaro">
                            +
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
