"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { labelSerata, nuovaSerata as creaSerata } from "@/lib/bar";
import { commentoVoto, Scusa } from "@/lib/scuse";
import { playPop, playUndo } from "@/lib/sound";

export default function Scuse({
  players,
  notify,
}: {
  players: string[];
  notify: (msg: string) => void;
}) {
  const { serate, setSerate } = useSession();
  const [currentId, setCurrentId] = useState<string>("");
  const [nome, setNome] = useState(players[0] ?? "");
  const [testo, setTesto] = useState("");
  const [voto, setVoto] = useState(5);

  const currentIdx = serate.findIndex((s) => s.id === currentId);
  const current = serate[currentIdx];
  useEffect(() => {
    if (serate.length > 0 && currentIdx === -1) {
      setCurrentId(serate[serate.length - 1].id);
    }
  }, [serate, currentIdx]);

  // ── Gestione serate (come nel Contabar) ──
  const aggiungiSerata = () => {
    const s = creaSerata();
    setSerate((prev) => [...prev, s]);
    setCurrentId(s.id);
    notify("Nuova serata aperta! 🥂");
  };
  const eliminaSerata = () => {
    if (serate.length <= 1) {
      notify("Nun può cancellà ll'unica serata! 🤷");
      return;
    }
    if (!confirm("Sicuro? 'A serata (e 'e scuse soje) se ne va pe' sempe.")) return;
    const next = serate.filter((s) => s.id !== currentId);
    setCurrentId(next[next.length - 1].id);
    setSerate((prev) => prev.filter((s) => s.id !== currentId));
  };

  const nomeValido = players.includes(nome) ? nome : players[0] ?? "";
  const scuse = current?.scuse ?? [];

  const aggiungi = () => {
    if (!current) return;
    const t = testo.trim();
    if (!nomeValido) {
      notify("Aggiungi primma nu membro d''a cumitiva! 👥");
      return;
    }
    if (!t) {
      notify("E scrivi 'a scusa, no?! ✍️");
      return;
    }
    const s: Scusa = {
      id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: nomeValido,
      testo: t,
      voto,
      t: new Date().toISOString(),
    };
    setSerate((prev) =>
      prev.map((se) =>
        se.id === currentId
          ? { ...se, scuse: [s, ...(se.scuse ?? [])] }
          : se,
      ),
    );
    setTesto("");
    setVoto(5);
    playPop();
    notify(`📋 Scusa 'e ${nomeValido} messa a verbale!`);
  };

  const elimina = (id: string) => {
    setSerate((prev) =>
      prev.map((se) =>
        se.id === currentId
          ? { ...se, scuse: (se.scuse ?? []).filter((s) => s.id !== id) }
          : se,
      ),
    );
    playUndo();
  };

  const stat = useMemo(() => {
    if (scuse.length === 0) return null;
    const media = scuse.reduce((a, s) => a + s.voto, 0) / scuse.length;
    const migliore = scuse.reduce((a, b) => (b.voto > a.voto ? b : a));
    const perNome: Record<string, number> = {};
    for (const s of scuse) perNome[s.nome] = (perNome[s.nome] ?? 0) + 1;
    const campione = Object.entries(perNome).sort((a, b) => b[1] - a[1])[0];
    return { media, migliore, campione };
  }, [scuse]);

  const votoColore = (v: number) =>
    v >= 8 ? "text-assenzio" : v >= 5 ? "text-ottone-chiaro" : "text-red-400";

  // ── Nessuna serata: invito ad aprirla ──
  if (!current) {
    return (
      <div className="etichetta mx-auto max-w-md rounded-sm p-8 text-center">
        <p className="animate-float text-5xl">📋</p>
        <p className="mt-4 text-xl italic text-etichetta">
          Ancora nisciuna serata. Aprine una pe&rsquo; accummincià a segnà
          &rsquo;e scuse!
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
      {/* ── Selettore serata (stesso del Contabar) ── */}
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

      <p className="max-w-xl text-center text-lg italic text-etichetta-scura">
        L&rsquo;Albo d&rsquo;&rsquo;e Scuse d&rsquo;a serata: ogni volta ca uno
        se scanza &rsquo;a bevuta cu &rsquo;na scusa, mettila cca e dagli nu voto
        d&rsquo;a 1 a 10. 📋
      </p>

      {/* ── Form ── */}
      <div className="etichetta w-full max-w-xl rounded-sm p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={nomeValido}
              onChange={(e) => setNome(e.target.value)}
              className="min-w-[8rem] flex-1 rounded-sm border border-ottone/40 bg-bottiglia/80 px-3 py-2.5 text-lg text-etichetta focus:border-assenzio focus:outline-none"
            >
              {players.map((p) => (
                <option key={p} value={p} className="bg-bottiglia">
                  {p}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 rounded-sm border border-ottone/40 bg-bottiglia/80 px-3">
              <span className="text-sm text-etichetta-scura">Voto</span>
              <select
                value={voto}
                onChange={(e) => setVoto(Number(e.target.value))}
                className="bg-transparent py-2.5 text-lg font-bold text-ottone-chiaro focus:outline-none"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                  <option key={v} value={v} className="bg-bottiglia">
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            placeholder="'A scusa… (es. «Nun bevo 'o tropical vodka, è troppo doce, me piglio 'na Red Bull»)"
            rows={2}
            maxLength={180}
            className="w-full resize-none rounded-sm border border-ottone/40 bg-bottiglia/80 px-3 py-2.5 text-lg text-etichetta placeholder:text-etichetta-scura/50 focus:border-assenzio focus:outline-none"
          />
          <button
            onClick={aggiungi}
            className="rounded-sm border border-assenzio/60 bg-smeraldo/40 px-6 py-2.5 font-[family-name:var(--font-titolo)] text-lg tracking-widest text-assenzio-pallido transition-all hover:scale-[1.02] hover:bg-smeraldo/70"
          >
            ＋ METTI A VERBALE
          </button>
        </div>
      </div>

      {/* ── Statistiche della serata ── */}
      {stat && (
        <div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
          <div className="etichetta rounded-sm p-3 text-center">
            <p className="testo-oro font-[family-name:var(--font-titolo)] text-3xl font-black">
              {stat.media.toFixed(1)}
            </p>
            <p className="text-xs italic text-etichetta-scura">voto medio</p>
          </div>
          <div className="etichetta rounded-sm p-3 text-center">
            <p className="truncate text-lg font-bold text-assenzio">
              🏆 {stat.migliore.nome}
            </p>
            <p className="truncate text-xs italic text-etichetta-scura">
              miglior scusa ({stat.migliore.voto})
            </p>
          </div>
          <div className="etichetta rounded-sm p-3 text-center">
            <p className="truncate text-lg font-bold text-etichetta">
              🤥 {stat.campione[0]}
            </p>
            <p className="text-xs italic text-etichetta-scura">
              re d&rsquo;&rsquo;e scuse ({stat.campione[1]})
            </p>
          </div>
        </div>
      )}

      {/* ── Tabella scuse ── */}
      {scuse.length === 0 ? (
        <p className="text-center text-lg italic text-etichetta-scura">
          Ancora nisciuna scusa &rsquo;e sta serata. Aspetta ca quaccheduno se
          tira arrèto… 😏
        </p>
      ) : (
        <div className="w-full max-w-xl overflow-x-auto">
          <div className="min-w-[360px]">
            <div className="flex items-center gap-3 border-b border-ottone/30 px-2 pb-1 text-xs tracking-widest text-ottone-chiaro">
              <span className="w-24">CHI</span>
              <span className="flex-1">SCUSA</span>
              <span className="w-12 text-center">VOTO</span>
              <span className="w-6" />
            </div>
            {scuse.map((s) => (
              <div
                key={s.id}
                className="flex items-start gap-3 border-b border-ottone/10 px-2 py-2.5"
              >
                <span className="w-24 truncate font-semibold text-etichetta">
                  {s.nome}
                </span>
                <span className="flex-1 text-etichetta">
                  &laquo;{s.testo}&raquo;
                  <span className="block text-xs italic text-etichetta-scura">
                    {commentoVoto(s.voto)}
                  </span>
                </span>
                <span
                  className={`w-12 text-center font-[family-name:var(--font-titolo)] text-2xl font-black ${votoColore(
                    s.voto,
                  )}`}
                >
                  {s.voto}
                </span>
                <button
                  onClick={() => elimina(s.id)}
                  className="w-6 shrink-0 text-etichetta-scura/50 transition-colors hover:text-red-400"
                  aria-label="Elimina scusa"
                  title="Elimina"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
