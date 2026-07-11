"use client";

import { useEffect, useState } from "react";
import Wheel from "@/components/Wheel";
import { pick, shuffle } from "@/lib/phrases";
import { playCheers, playFail, playJolly, playPop } from "@/lib/sound";

// Campo alcolico 10×10 (senza bombe): shot diretti, "box chiuso" (roulette e a
// scelta), "rischio bevuta" (al 2° tutti bevono) e i jolly = immunità (max 4).
// La numerazione delle tessere scala col numero dei membri.

type Contenuto =
  | "vuoto"
  | "jolly"
  | "vodka"
  | "gin"
  | "assenzio"
  | "box-roulette"
  | "box-scelta"
  | "rischio";

type Tessera = { contenuto: Contenuto; scoperta: boolean };
type Fase = "ordine" | "gioco";

const EMOJI: Record<Contenuto, string> = {
  vuoto: "🍃",
  jolly: "🃏",
  vodka: "🥃",
  gin: "🍸",
  assenzio: "🧚",
  "box-roulette": "🎰",
  "box-scelta": "📦",
  rischio: "⚠️",
};

const FRASI_VUOTO_SHOT = [
  "🍃 Niente, {n} campa n'atu ppoco.",
  "🍃 Vacante! {n} 'a scanza.",
  "🍃 Tutto buono, {n}. Pe' mo'.",
];

// Tessere speciali in base al numero di membri (griglia 10×10 = 100).
function creaGriglia(n: number): Tessera[] {
  const tipiShot: Contenuto[] = ["vodka", "gin", "assenzio"];
  const shots: Contenuto[] = Array.from(
    { length: 2 * n }, // 2 shot diretti per membro
    (_, i) => tipiShot[i % 3],
  );
  const contenuti: Contenuto[] = [
    ...shots,
    ...Array<Contenuto>(3).fill("box-roulette"),
    ...Array<Contenuto>(2).fill("box-scelta"),
    ...Array<Contenuto>(6).fill("rischio"),
    ...Array<Contenuto>(4).fill("jolly"), // solo 4 jolly totali
  ];
  while (contenuti.length < 100) contenuti.push("vuoto");
  return shuffle(contenuti).map((contenuto) => ({ contenuto, scoperta: false }));
}

type Bevuta = { chi: string; quante: number; emoji: string; titolo: string };
type Scelta = { cells: boolean[]; claimed: (string | null)[]; pickerIdx: number };

export default function CampoShot({ players }: { players: string[] }) {
  const [fase, setFase] = useState<Fase>("ordine");
  const [ordine, setOrdine] = useState<string[]>([]);
  const [daSorteggiare, setDaSorteggiare] = useState<string[]>(players);
  const [griglia, setGriglia] = useState<Tessera[]>([]);
  const [turno, setTurno] = useState(0);
  const [immunita, setImmunita] = useState<Record<string, number>>({});
  const [rischioCount, setRischioCount] = useState(0);
  const [evento, setEvento] = useState<string | null>(null);

  // Modali
  const [bevuta, setBevuta] = useState<Bevuta | null>(null);
  const [roulette, setRoulette] = useState<string | null>(null); // chi ha aperto
  const [scelta, setScelta] = useState<Scelta | null>(null);
  const [rischioTutti, setRischioTutti] = useState(false);

  useEffect(() => {
    setFase("ordine");
    setOrdine([]);
    setDaSorteggiare(players);
    setGriglia([]);
    setImmunita({});
    setRischioCount(0);
    setEvento(null);
    setBevuta(null);
    setRoulette(null);
    setScelta(null);
    setRischioTutti(false);
  }, [players]);

  const avvia = (ordineFinale: string[]) => {
    setOrdine(ordineFinale);
    setGriglia(creaGriglia(ordineFinale.length));
    setTurno(0);
    setImmunita({});
    setRischioCount(0);
    setEvento(null);
    setFase("gioco");
  };

  // ── Fase ordine ──
  const handleOrdineSpin = (index: number) => {
    const scelto = daSorteggiare[index];
    const nuovoOrdine = [...ordine, scelto];
    const restanti = daSorteggiare.filter((_, i) => i !== index);
    if (restanti.length === 1) avvia([...nuovoOrdine, restanti[0]]);
    else {
      setOrdine(nuovoOrdine);
      setDaSorteggiare(restanti);
    }
  };
  const ordineACaso = () => avvia([...ordine, ...shuffle(daSorteggiare)]);

  // ── Fase gioco ──
  const corrente = ordine[turno] ?? "";
  const avanza = () => {
    setTurno((t) => (t + 1) % ordine.length);
    setBevuta(null);
    setRoulette(null);
    setScelta(null);
    setRischioTutti(false);
  };
  const bloccato = !!bevuta || !!roulette || !!scelta || rischioTutti;

  const scopri = (i: number) => {
    if (fase !== "gioco" || griglia[i].scoperta || bloccato) return;
    const nome = corrente;
    const c = griglia[i].contenuto;
    setGriglia((g) => g.map((t, j) => (j === i ? { ...t, scoperta: true } : t)));
    setEvento(null);

    if (c === "vuoto") {
      setEvento(pick(FRASI_VUOTO_SHOT).replace("{n}", nome));
      playPop();
      setTurno((t) => (t + 1) % ordine.length);
      return;
    }
    if (c === "jolly") {
      setImmunita((prev) => ({ ...prev, [nome]: (prev[nome] ?? 0) + 1 }));
      setEvento(`🃏 ${nome} ha pigliato nu jolly! Immunità 'a parte.`);
      playJolly();
      setTurno((t) => (t + 1) % ordine.length);
      return;
    }
    if (c === "vodka" || c === "gin" || c === "assenzio") {
      playCheers();
      setBevuta({
        chi: nome,
        quante: 1,
        emoji: EMOJI[c],
        titolo: `SHOT 'E ${c.toUpperCase()}`,
      });
      return;
    }
    if (c === "box-roulette") {
      playPop();
      setRoulette(nome);
      return;
    }
    if (c === "box-scelta") {
      playPop();
      const n = ordine.length;
      const shotIdx = Math.floor(Math.random() * n);
      setScelta({
        cells: Array.from({ length: n }, (_, k) => k === shotIdx),
        claimed: Array(n).fill(null),
        pickerIdx: 0,
      });
      return;
    }
    if (c === "rischio") {
      const nuovo = rischioCount + 1;
      if (nuovo >= 2) {
        setRischioCount(0);
        playFail();
        setRischioTutti(true); // tutti bevono → modale
      } else {
        setRischioCount(nuovo);
        setEvento("⚠️ Rischio bevuta! (1 su 2) 'O prossimo ca 'o trova… 💀");
        playPop();
        setTurno((t) => (t + 1) % ordine.length);
      }
      return;
    }
  };

  // Box roulette: esito
  const rouletteFinita = (index: number) => {
    const opener = roulette ?? corrente;
    const n = ordine.length;
    if (index < n) {
      const m = ordine[index];
      setRoulette(null);
      playCheers();
      setBevuta({ chi: m, quante: 1, emoji: "🥃", titolo: `BEVE ${m.toUpperCase()}` });
    } else if (index === n) {
      setRoulette(null);
      playCheers();
      setBevuta({ chi: opener, quante: 2, emoji: "🥃🥃", titolo: "2 SHOT!" });
    } else {
      setEvento("🎉 Libero! Nisciuno beve, stavota.");
      avanza();
    }
  };

  // Box a scelta: un membro sceglie una casella
  const sceltaPick = (cellIdx: number) => {
    if (!scelta || scelta.claimed[cellIdx]) return;
    const picker = ordine[scelta.pickerIdx];
    const claimed = [...scelta.claimed];
    claimed[cellIdx] = picker;
    const next = scelta.pickerIdx + 1;
    if (next >= ordine.length) {
      const shotCell = scelta.cells.findIndex((x) => x);
      const chi = claimed[shotCell]!;
      setScelta(null);
      playCheers();
      setBevuta({
        chi,
        quante: 1,
        emoji: "🥃",
        titolo: `${chi.toUpperCase()} HA PIGLIATO 'O SHOT!`,
      });
    } else {
      setScelta({ ...scelta, claimed, pickerIdx: next });
    }
  };

  const bevutaFatta = () => avanza();
  const bevutaJolly = () => {
    if (!bevuta) return;
    setImmunita((prev) => ({
      ...prev,
      [bevuta.chi]: Math.max(0, (prev[bevuta.chi] ?? 0) - 1),
    }));
    setEvento(`🃏 ${bevuta.chi} ha usato 'o jolly: skippato!`);
    playJolly();
    avanza();
  };

  const reset = () => {
    setFase("ordine");
    setOrdine([]);
    setDaSorteggiare(players);
    setGriglia([]);
    setImmunita({});
    setRischioCount(0);
    setEvento(null);
    setBevuta(null);
    setRoulette(null);
    setScelta(null);
    setRischioTutti(false);
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* ── Fase ordine ── */}
      {fase === "ordine" && (
        <>
          <p className="max-w-lg text-center text-lg italic text-etichetta-scura">
            &rsquo;A rota decide l&rsquo;ordine, po&rsquo; se scava &rsquo;o
            campo 10×10: 🥃 shot diretti, 🎰 box roulette, 📦 box a scelta,
            ⚠️ rischio bevuta (ô 2° tutti bevono), 🃏 jolly = immunità (ne
            stanno sulo 4!).
          </p>
          {ordine.length > 0 && (
            <div className="flex max-w-lg flex-wrap justify-center gap-2">
              {ordine.map((n, i) => (
                <span
                  key={n}
                  className="rounded-full border border-ottone/40 bg-vetro/60 px-3 py-0.5 text-etichetta"
                >
                  {i + 1}° {n}
                </span>
              ))}
            </div>
          )}
          <Wheel
            entries={daSorteggiare}
            onFinish={handleOrdineSpin}
            spinLabel={`ESTRAI 'O ${ordine.length + 1}°`}
          />
          <button
            onClick={ordineACaso}
            className="text-sm italic text-etichetta-scura underline decoration-ottone/50 underline-offset-4 hover:text-etichetta"
          >
            va&rsquo; buò, fa&rsquo; tu: ordine a caso e se joca
          </button>
        </>
      )}

      {/* ── Fase gioco ── */}
      {fase === "gioco" && (
        <>
          <div className="flex max-w-xl flex-wrap justify-center gap-2">
            {ordine.map((n, i) => (
              <span
                key={n}
                className={`rounded-full border px-3 py-0.5 text-base transition-all ${
                  i === turno
                    ? "border-assenzio bg-smeraldo/60 text-assenzio-pallido shadow-[0_0_12px_rgba(168,224,95,0.4)]"
                    : "border-ottone/30 text-etichetta-scura"
                }`}
              >
                {n}
                {(immunita[n] ?? 0) > 0 && ` 🃏×${immunita[n]}`}
              </span>
            ))}
            <span className="rounded-full border border-ottone/30 px-3 py-0.5 text-base text-etichetta-scura">
              ⚠️ {rischioCount}/2
            </span>
          </div>

          <div className="etichetta rounded-sm px-8 py-2.5 text-center">
            <p className="text-xs tracking-[0.3em] text-ottone-chiaro">TOCCA A</p>
            <p className="font-[family-name:var(--font-titolo)] text-2xl font-bold text-assenzio">
              {corrente}
            </p>
          </div>

          {evento && (
            <p className="max-w-lg animate-pop-in text-center text-lg italic text-etichetta">
              {evento}
            </p>
          )}

          {/* Griglia 10×10 */}
          <div className="grid w-full max-w-lg grid-cols-10 gap-0.5">
            {griglia.map((t, i) => (
              <button
                key={i}
                onClick={() => scopri(i)}
                disabled={t.scoperta || bloccato}
                className={`flex aspect-square items-center justify-center rounded-[3px] border text-base transition-all ${
                  t.scoperta
                    ? t.contenuto === "jolly"
                      ? "border-ottone bg-ottone/20"
                      : t.contenuto === "rischio"
                        ? "border-red-400/60 bg-red-950/40"
                        : t.contenuto.startsWith("box")
                          ? "border-ottone/60 bg-ottone/10"
                          : t.contenuto === "vuoto"
                            ? "border-ottone/15 bg-bottiglia/40"
                            : "border-assenzio/50 bg-smeraldo/25"
                    : "etichetta cursor-pointer hover:scale-105 hover:brightness-150 active:scale-95"
                }`}
                aria-label={t.scoperta ? t.contenuto : `tessera ${i + 1}`}
              >
                {t.scoperta ? (
                  <span className={t.contenuto === "vuoto" ? "opacity-40" : ""}>
                    {EMOJI[t.contenuto]}
                  </span>
                ) : (
                  <span className="text-[10px] text-ottone/50">✦</span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={reset}
            className="rounded-sm border border-ottone/60 px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-ottone-chiaro transition-all hover:scale-105 hover:bg-ottone/15"
          >
            ↺ RICOMINCIA
          </button>
        </>
      )}

      {/* ── Modale bevuta (shot diretto / esiti box) ── */}
      {bevuta && (
        <Modale>
          <p className="text-5xl">{bevuta.emoji}</p>
          <p className="mt-2 font-[family-name:var(--font-titolo)] text-2xl font-bold text-ottone-chiaro">
            {bevuta.titolo}
          </p>
          <div className="divisorio-oro my-3" />
          <p className="text-lg italic text-etichetta">
            {bevuta.chi} beve {bevuta.quante} shot! 🥃
          </p>
          <div className="divisorio-oro my-4" />
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={bevutaFatta} className={btnPrimario}>
              ✔ FATTO!
            </button>
            {(immunita[bevuta.chi] ?? 0) > 0 && (
              <button onClick={bevutaJolly} className={btnJolly}>
                🃏 USA JOLLY ({immunita[bevuta.chi]})
              </button>
            )}
          </div>
        </Modale>
      )}

      {/* ── Modale box roulette ── */}
      {roulette && (
        <Modale wide>
          <p className="font-[family-name:var(--font-titolo)] text-2xl font-bold text-ottone-chiaro">
            🎰 BOX CHIUSO
          </p>
          <p className="mt-1 text-base italic text-etichetta-scura">
            {roulette} apre 'o box: gira 'a rota d''o destino!
          </p>
          <div className="mt-4 flex justify-center">
            <Wheel
              entries={[...ordine, "2 SHOT!", "LIBERO"]}
              onFinish={rouletteFinita}
              spinLabel="APRI 'O BOX"
            />
          </div>
        </Modale>
      )}

      {/* ── Modale box a scelta ── */}
      {scelta && (
        <Modale>
          <p className="font-[family-name:var(--font-titolo)] text-2xl font-bold text-ottone-chiaro">
            📦 BOX A SCELTA
          </p>
          <p className="mt-1 text-base italic text-etichetta">
            Tocca a{" "}
            <b className="text-assenzio">{ordine[scelta.pickerIdx]}</b>: scigli
            'na casella! Una sola tene 'o shot.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {scelta.cells.map((_, k) => {
              const by = scelta.claimed[k];
              return (
                <button
                  key={k}
                  onClick={() => sceltaPick(k)}
                  disabled={!!by}
                  className={`flex h-16 w-16 items-center justify-center rounded-sm border text-2xl transition-all ${
                    by
                      ? "border-assenzio/60 bg-smeraldo/40"
                      : "etichetta cursor-pointer hover:scale-105 hover:brightness-150"
                  }`}
                >
                  {by ? (
                    <span className="truncate px-0.5 text-[10px] text-assenzio-pallido">
                      {by.slice(0, 4)}
                    </span>
                  ) : (
                    <span className="text-ottone/50">📦</span>
                  )}
                </button>
              );
            })}
          </div>
        </Modale>
      )}

      {/* ── Modale rischio: tutti bevono ── */}
      {rischioTutti && (
        <Modale>
          <p className="text-5xl">⚠️</p>
          <p className="mt-2 font-[family-name:var(--font-titolo)] text-2xl font-bold text-red-400">
            RISCHIO ×2 — TUTTI BEVONO!
          </p>
          <div className="divisorio-oro my-3" />
          <p className="text-lg italic text-etichetta">
            È asciuto 'o secondo rischio: TUTTA 'A TAVULA se fa nu shot! 🥃
            <br />
            <span className="text-base text-etichetta-scura">
              (chi tene 'o jolly po' skippà)
            </span>
          </p>
          <div className="divisorio-oro my-4" />
          <button onClick={avanza} className={btnPrimario}>
            ✔ FATTO — S'È BEVUTO
          </button>
        </Modale>
      )}
    </div>
  );
}

// ── Piccoli helper di stile ──
const btnPrimario =
  "rounded-sm border border-assenzio/70 bg-smeraldo/40 px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-assenzio-pallido transition-all hover:scale-105 hover:bg-smeraldo/70";
const btnJolly =
  "rounded-sm border border-ottone px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-ottone-chiaro transition-all hover:scale-105 hover:bg-ottone/15";

function Modale({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[560] flex items-center justify-center bg-abisso/85 p-4 backdrop-blur-sm">
      <div
        className={`etichetta w-full animate-pop-in rounded-sm p-6 text-center ${
          wide ? "max-w-lg" : "max-w-md"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
