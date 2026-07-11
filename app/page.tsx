"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Fairy from "@/components/Fairy";
import SingleSpin from "@/components/modes/SingleSpin";
import Duello from "@/components/modes/Duello";
import Eliminazione from "@/components/modes/Eliminazione";
import Squadre from "@/components/modes/Squadre";
import Ordine from "@/components/modes/Ordine";
import CampoMinato from "@/components/modes/CampoMinato";
import Pallini from "@/components/modes/Pallini";
import Contabar from "@/components/modes/Contabar";
import Taverna from "@/components/modes/Taverna";
import Carte from "@/components/modes/Carte";
import Scuse from "@/components/modes/Scuse";
import Poker from "@/components/modes/Poker";
import CampoShot from "@/components/modes/CampoShot";
import SoundToggle from "@/components/SoundToggle";
import SessionBar from "@/components/SessionBar";
import { useSession } from "@/components/SessionProvider";
import {
  NOMI_SPECIALI,
  TOAST_FATA_LIBERATA,
  TOAST_NOME_DOPPIO,
  TOAST_NOME_VUOTO,
  TOAST_NOTTE_FONDA,
  TOAST_POCHI_GIOCATORI,
} from "@/lib/phrases";

const MODES = [
  { id: "classico", label: "Classico", icon: "🎯", desc: "Estrai nu nomme" },
  { id: "duello", label: "Duello", icon: "⚔️", desc: "Meglio 'e 3 o 'e 5" },
  { id: "eliminazione", label: "Eliminazione", icon: "💀", desc: "Urdemo ca resta" },
  { id: "chipaga", label: "Chi Paga?", icon: "🍻", desc: "Pe' bere e pavà" },
  { id: "mine", label: "Campo Minato", icon: "💣", desc: "Nun tuccà 'a bomba!" },
  { id: "pallini", label: "Pallini", icon: "🔮", desc: "Quant'e ne stanno?" },
  { id: "squadre", label: "Squadre", icon: "👥", desc: "Sparte 'a cumitiva" },
  { id: "ordine", label: "Ordine", icon: "🎲", desc: "Chi accumencia?" },
  { id: "contabar", label: "Contabar", icon: "🍺", desc: "Conta 'e bevute" },
  { id: "taverna", label: "Taverna", icon: "🛡️", desc: "GDR napulitano" },
  { id: "carte", label: "Carte", icon: "♠️", desc: "'A carta cchiù auta vince" },
  { id: "scuse", label: "Scuse", icon: "📋", desc: "L'albo d''e scuse" },
  { id: "poker", label: "Poker", icon: "🃏", desc: "Poker penitenza (max 4)" },
  { id: "camposhot", label: "Shot Minato", icon: "🥃", desc: "Campo 10×10 cu shot" },
] as const;

type ModeId = (typeof MODES)[number]["id"];

type Toast = { id: number; msg: string };

export default function Home() {
  const { players, setPlayers } = useSession();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ModeId>("classico");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [fairy, setFairy] = useState(false);
  const [shakeInput, setShakeInput] = useState(false);
  const titleClicks = useRef(0);
  const toastId = useRef(0);
  const [esclusi, setEsclusi] = useState<string[]>([]);
  const esclusiHydrated = useRef(false);

  // Chi è escluso dai giochi resta memorizzato (per dispositivo).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("assenzio-esclusi");
      if (raw) setEsclusi(JSON.parse(raw));
    } catch {
      /* pazienza */
    }
    esclusiHydrated.current = true;
  }, []);
  useEffect(() => {
    if (!esclusiHydrated.current) return;
    try {
      localStorage.setItem("assenzio-esclusi", JSON.stringify(esclusi));
    } catch {
      /* pazienza */
    }
  }, [esclusi]);

  const notify = (msg: string) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-2), { id, msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Battuta notturna alla prima apertura.
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 2 && hour < 6) {
      setTimeout(() => notify(TOAST_NOTTE_FONDA), 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPlayer = () => {
    const name = input.trim();
    if (!name) {
      notify(TOAST_NOME_VUOTO);
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 600);
      return;
    }
    if (players.some((p) => p.toLowerCase() === name.toLowerCase())) {
      notify(TOAST_NOME_DOPPIO);
      return;
    }
    const special = NOMI_SPECIALI[name.toLowerCase()];
    if (special) notify(special);
    setPlayers((prev) => [...prev, name]);
    setInput("");
  };

  const removePlayer = (name: string) => {
    setPlayers((prev) => prev.filter((p) => p !== name));
  };

  // Easter egg: 5 tocchi sulla bottiglia liberano la Fata Verde.
  const handleTitleClick = () => {
    titleClicks.current += 1;
    if (titleClicks.current >= 5) {
      titleClicks.current = 0;
      setFairy(true);
      notify(TOAST_FATA_LIBERATA);
    }
  };

  const toggleEscluso = (nome: string) =>
    setEsclusi((prev) =>
      prev.includes(nome) ? prev.filter((n) => n !== nome) : [...prev, nome],
    );

  // Memoizzato: riferimento stabile finché non cambiano davvero cumitiva o
  // esclusi, altrimenti i giochi che si resettano su [players] ripartirebbero
  // a ogni render (es. a ogni toast).
  const attivi = useMemo(
    () => players.filter((p) => !esclusi.includes(p)),
    [players, esclusi],
  );
  // Contabar e Taverna riguardano tutta la cumitiva; i giochi solo chi gioca.
  const usaTutti =
    mode === "contabar" || mode === "taverna" || mode === "scuse";
  const partecipanti = usaTutti ? players : attivi;
  const mostraPartecipanti = !usaTutti && players.length >= 2;
  const needed = mode === "contabar" || mode === "scuse" ? 1 : 2;
  const enough = partecipanti.length >= needed;
  const troppiEsclusi = !usaTutti && players.length >= 2 && attivi.length < 2;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center gap-8 px-4 py-8 sm:py-12">
      <SoundToggle />
      <SessionBar />

      {/* ── Etichetta della bottiglia ── */}
      <header className="etichetta w-full rounded-sm px-6 py-8 text-center">
        <p className="font-[family-name:var(--font-titolo)] text-xs tracking-[0.5em] text-ottone-chiaro">
          ✦ DISTILLERIA D&rsquo;&rsquo;A FORTUNA ✦
        </p>
        <button
          onClick={handleTitleClick}
          className="mt-3 inline-block cursor-pointer select-none text-5xl transition-transform hover:rotate-6 active:scale-90"
          title="…"
          aria-label="Bottiglia di assenzio"
        >
          🍾
        </button>
        <h1 className="testo-oro mt-2 font-[family-name:var(--font-titolo)] text-5xl font-black tracking-wider sm:text-6xl">
          ASSENZIO
        </h1>
        <p className="mt-2 text-xl italic text-etichetta-scura">
          La Ruota dei Sorteggi &mdash; distillato di pura fortuna dal 1805
        </p>
        <div className="divisorio-oro mx-auto my-4 max-w-xs" />
        <p className="text-sm tracking-[0.3em] text-ottone-chiaro">
          68% VOL. DI SFORTUNA ALTRUI
        </p>
      </header>

      {/* ── La comitiva ── */}
      <section className="w-full">
        <h2 className="mb-3 text-center font-[family-name:var(--font-titolo)] text-lg tracking-[0.3em] text-ottone-chiaro">
          &rsquo;A CUMITIVA
        </h2>
        <div
          className={`mx-auto flex max-w-md gap-2 ${shakeInput ? "animate-shake" : ""}`}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPlayer()}
            placeholder="Nomme d''o giocatore…"
            maxLength={20}
            className="flex-1 rounded-sm border border-ottone/40 bg-bottiglia/80 px-4 py-2.5 text-lg text-etichetta placeholder:text-etichetta-scura/50 focus:border-assenzio focus:outline-none focus:shadow-[0_0_12px_rgba(168,224,95,0.25)]"
          />
          <button
            onClick={addPlayer}
            className="rounded-sm border border-ottone/60 bg-smeraldo/30 px-5 font-[family-name:var(--font-titolo)] text-xl text-ottone-chiaro transition-all hover:scale-105 hover:bg-smeraldo/60"
            aria-label="Aggiungi giocatore"
          >
            +
          </button>
        </div>

        {players.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {players.map((p) => (
              <span
                key={p}
                className="group flex items-center gap-2 rounded-full border border-ottone/40 bg-vetro/60 px-4 py-1 text-lg text-etichetta"
              >
                {p}
                <button
                  onClick={() => removePlayer(p)}
                  className="text-etichetta-scura/60 transition-colors hover:text-red-400"
                  aria-label={`Rimuovi ${p}`}
                >
                  ✕
                </button>
              </span>
            ))}
            <button
              onClick={() => setPlayers([])}
              className="rounded-full border border-red-900/60 px-3 py-1 text-sm italic text-etichetta-scura/70 transition-colors hover:border-red-500/60 hover:text-red-300"
            >
              svuota tutto
            </button>
          </div>
        )}
      </section>

      {/* ── Modalità ── */}
      <nav className="grid w-full grid-cols-3 gap-2 sm:grid-cols-6">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-sm border px-2 py-3 text-center transition-all ${
              mode === m.id
                ? "border-assenzio bg-smeraldo/40 shadow-[0_0_14px_rgba(168,224,95,0.25)]"
                : "border-ottone/30 bg-bottiglia/50 hover:border-ottone/70"
            }`}
          >
            <span className="block text-2xl">{m.icon}</span>
            <span
              className={`mt-1 block font-[family-name:var(--font-titolo)] text-[13px] tracking-wider ${
                mode === m.id ? "text-assenzio-pallido" : "text-etichetta-scura"
              }`}
            >
              {m.label.toUpperCase()}
            </span>
          </button>
        ))}
      </nav>
      <p className="-mt-5 text-center italic text-etichetta-scura">
        {MODES.find((m) => m.id === mode)?.desc}
      </p>

      {/* ── Chi gioca (esclude/reintegra per i giochi) ── */}
      {mostraPartecipanti && (
        <section className="w-full">
          <p className="mb-2 text-center font-[family-name:var(--font-titolo)] text-sm tracking-[0.3em] text-ottone-chiaro">
            CHI GIOCA? {attivi.length}/{players.length}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {players.map((p) => {
              const dentro = !esclusi.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => toggleEscluso(p)}
                  className={`rounded-full border px-4 py-1 text-lg transition-all ${
                    dentro
                      ? "border-assenzio bg-smeraldo/50 text-assenzio-pallido"
                      : "border-ottone/30 text-etichetta-scura/60 line-through"
                  }`}
                  title={dentro ? "Tocca pe' escludere" : "Tocca pe' fà rientrà"}
                >
                  {dentro ? p : `${p} 💤`}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Il gioco ── */}
      <section className="w-full">
        {troppiEsclusi ? (
          <div className="etichetta mx-auto max-w-md rounded-sm p-8 text-center">
            <p className="animate-float text-5xl">💤</p>
            <p className="mt-4 text-xl italic text-etichetta">
              Hê escluso troppa gente! Ce vonno almeno duje pe&rsquo; giocà —
              fà rientrà quaccheduno. 🎮
            </p>
          </div>
        ) : !enough ? (
          <div className="etichetta mx-auto max-w-md rounded-sm p-8 text-center">
            <p className="animate-float text-5xl">🧚</p>
            <p className="mt-4 text-xl italic text-etichetta">
              {players.length === 0
                ? "'A rota è vacante… scrivi 'e nomme d''a cumitiva!"
                : TOAST_POCHI_GIOCATORI}
            </p>
          </div>
        ) : (
          <>
            {mode === "classico" && (
              <SingleSpin players={partecipanti} variant="classico" />
            )}
            {mode === "duello" && (
              <Duello players={partecipanti} notify={notify} />
            )}
            {mode === "eliminazione" && (
              <Eliminazione players={partecipanti} notify={notify} />
            )}
            {mode === "chipaga" && (
              <SingleSpin players={partecipanti} variant="chipaga" />
            )}
            {mode === "squadre" && (
              <Squadre players={partecipanti} notify={notify} />
            )}
            {mode === "ordine" && <Ordine players={partecipanti} />}
            {mode === "carte" && <Carte players={partecipanti} />}
            {mode === "poker" && (
              <Poker players={partecipanti} notify={notify} />
            )}
            {mode === "camposhot" && <CampoShot players={partecipanti} />}
            {mode === "mine" && (
              <CampoMinato players={partecipanti} notify={notify} />
            )}
            {mode === "pallini" && (
              <Pallini players={partecipanti} notify={notify} />
            )}
            {mode === "contabar" && (
              <Contabar players={players} notify={notify} />
            )}
            {mode === "taverna" && (
              <Taverna players={players} notify={notify} />
            )}
            {mode === "scuse" && (
              <Scuse players={players} notify={notify} />
            )}
          </>
        )}
      </section>

      {/* ── Retro-etichetta ── */}
      <footer className="mt-auto w-full pt-6 text-center">
        <div className="divisorio-oro mx-auto mb-4 max-w-sm" />
        <p className="text-sm italic text-etichetta-scura/70">
          Bere responsabilmente, perdere con dignità. 🧚
          <br />
          Nisciuna Fata Verde è stata maltrattata durante &rsquo;e sorteggi.
        </p>
      </footer>

      {/* ── Toast ── */}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[600] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="etichetta animate-pop-in rounded-sm px-5 py-3 text-center text-lg text-etichetta"
          >
            {t.msg}
          </div>
        ))}
      </div>

      {fairy && <Fairy onDone={() => setFairy(false)} />}
    </main>
  );
}
