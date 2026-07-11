"use client";

import { useEffect, useState } from "react";
import Wheel from "@/components/Wheel";
import { pick, shuffle } from "@/lib/phrases";
import {
  playBomb,
  playBonus,
  playCheers,
  playFail,
  playJolly,
  playPop,
} from "@/lib/sound";

// Campo minato "alcolico" 10×10: stesse regole del campo minato ma con shot,
// malus (offri) e bonus (offerti), e il jolly come immunità che il giocatore
// decide se e quando usare (per saltare uno shot o un malus).

type Contenuto =
  | "vuoto"
  | "bomba"
  | "jolly"
  | "vodka"
  | "gin"
  | "assenzio"
  | "offri-shot"
  | "offri-drink"
  | "bonus-shot"
  | "bonus-drink";

type Tessera = { contenuto: Contenuto; scoperta: boolean };
type Fase = "ordine" | "gioco" | "finita";

const EMOJI: Record<Contenuto, string> = {
  vuoto: "🍃",
  bomba: "💥",
  jolly: "🃏",
  vodka: "🥃",
  gin: "🍸",
  assenzio: "🧚",
  "offri-shot": "💸",
  "offri-drink": "💸",
  "bonus-shot": "🎁",
  "bonus-drink": "🎁",
};

// Testi e tipo di ogni tessera d'azione (mostrata in modale).
const INFO: Record<
  Contenuto,
  { titolo: string; testo: (n: string) => string; tipo: "shot" | "malus" | "bonus" }
> = {
  vodka: {
    titolo: "SHOT 'E VODKA",
    testo: (n) => `${n}, giù 'o shot 'e vodka! 🥃`,
    tipo: "shot",
  },
  gin: {
    titolo: "SHOT 'E GIN",
    testo: (n) => `${n}, shot 'e gin: senza fà 'a femmenella!`,
    tipo: "shot",
  },
  assenzio: {
    titolo: "SHOT D'ASSENZIO",
    testo: (n) => `${n}, 'a Fata Verde te chiamma: shot d'assenzio! 🧚`,
    tipo: "shot",
  },
  "offri-shot": {
    titolo: "MALUS · OFFRI NU SHOT",
    testo: (n) => `${n} adda offrì nu SHOT a chi vò isso!`,
    tipo: "malus",
  },
  "offri-drink": {
    titolo: "MALUS · OFFRI NU DRINK",
    testo: (n) => `${n} adda offrì nu DRINK a quaccheduno!`,
    tipo: "malus",
  },
  "bonus-shot": {
    titolo: "BONUS · SHOT PAVATO",
    testo: (n) => `${n} se fa offrì nu SHOT! Chi 'o paga? 🎁`,
    tipo: "bonus",
  },
  "bonus-drink": {
    titolo: "BONUS · DRINK PAVATO",
    testo: (n) => `${n} se fa offrì nu DRINK! 🎉`,
    tipo: "bonus",
  },
  // non usati in modale
  vuoto: { titolo: "", testo: () => "", tipo: "bonus" },
  bomba: { titolo: "", testo: () => "", tipo: "bonus" },
  jolly: { titolo: "", testo: () => "", tipo: "bonus" },
};

const FRASI_VUOTO_SHOT = [
  "🍃 Niente, {n} campa n'atu ppoco.",
  "🍃 Vacante! {n} 'a scanza.",
  "🍃 Tutto buono, {n}. Pe' mo'.",
];

function creaGriglia(): Tessera[] {
  const contenuti: Contenuto[] = [
    ...Array<Contenuto>(3).fill("bomba"),
    ...Array<Contenuto>(6).fill("jolly"),
    ...Array<Contenuto>(4).fill("vodka"),
    ...Array<Contenuto>(4).fill("gin"),
    ...Array<Contenuto>(4).fill("assenzio"),
    "offri-shot",
    "offri-drink",
    "bonus-shot",
    "bonus-drink",
  ];
  while (contenuti.length < 100) contenuti.push("vuoto");
  return shuffle(contenuti).map((contenuto) => ({ contenuto, scoperta: false }));
}

export default function CampoShot({ players }: { players: string[] }) {
  const [fase, setFase] = useState<Fase>("ordine");
  const [ordine, setOrdine] = useState<string[]>([]);
  const [daSorteggiare, setDaSorteggiare] = useState<string[]>(players);
  const [griglia, setGriglia] = useState<Tessera[]>([]);
  const [turno, setTurno] = useState(0);
  const [immunita, setImmunita] = useState<Record<string, number>>({});
  const [evento, setEvento] = useState<string | null>(null);
  const [azione, setAzione] = useState<{
    contenuto: Contenuto;
    nome: string;
    gameOver?: boolean;
  } | null>(null);

  useEffect(() => {
    setFase("ordine");
    setOrdine([]);
    setDaSorteggiare(players);
    setGriglia([]);
    setImmunita({});
    setEvento(null);
    setAzione(null);
  }, [players]);

  const avvia = (ordineFinale: string[]) => {
    setOrdine(ordineFinale);
    setGriglia(creaGriglia());
    setTurno(0);
    setImmunita({});
    setEvento(null);
    setAzione(null);
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
  const avanza = () => setTurno((t) => (t + 1) % ordine.length);

  const scopri = (i: number) => {
    if (fase !== "gioco" || griglia[i].scoperta || azione) return;
    const nome = corrente;
    const c = griglia[i].contenuto;
    const nuova = griglia.map((t, j) => (j === i ? { ...t, scoperta: true } : t));
    setGriglia(nuova);

    if (c === "vuoto") {
      setEvento(pick(FRASI_VUOTO_SHOT).replace("{n}", nome));
      playPop();
      avanza();
      return;
    }
    if (c === "jolly") {
      setImmunita((prev) => ({ ...prev, [nome]: (prev[nome] ?? 0) + 1 }));
      setEvento(`🃏 ${nome} ha pigliato l'immunità! Se 'a tene 'a parte.`);
      playJolly();
      avanza();
      return;
    }
    if (c === "bomba") {
      setGriglia(nuova.map((t) => ({ ...t, scoperta: true })));
      setFase("finita");
      setEvento(null);
      playBomb();
      setAzione({ contenuto: "bomba", nome, gameOver: true });
      return;
    }
    // Tessere d'azione (shot / malus / bonus): modale
    setEvento(null);
    const tipo = INFO[c].tipo;
    if (tipo === "shot") playCheers();
    else if (tipo === "malus") playFail();
    else playBonus();
    setAzione({ contenuto: c, nome });
  };

  const chiudiAzione = () => {
    setAzione(null);
    avanza();
  };
  const usaImmunita = (nome: string) => {
    setImmunita((prev) => ({ ...prev, [nome]: Math.max(0, (prev[nome] ?? 0) - 1) }));
    setEvento(`🃏 ${nome} ha usato l'immunità: skippato!`);
    playJolly();
    setAzione(null);
    avanza();
  };

  const reset = () => {
    setFase("ordine");
    setOrdine([]);
    setDaSorteggiare(players);
    setGriglia([]);
    setImmunita({});
    setEvento(null);
    setAzione(null);
  };

  const info = azione && azione.contenuto !== "bomba" ? INFO[azione.contenuto] : null;
  const skippabile = info && (info.tipo === "shot" || info.tipo === "malus");
  const jollyDelCorrente = azione ? immunita[azione.nome] ?? 0 : 0;

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* ── Fase ordine ── */}
      {fase === "ordine" && (
        <>
          <p className="max-w-lg text-center text-lg italic text-etichetta-scura">
            &rsquo;A rota decide l&rsquo;ordine, po&rsquo; se scava &rsquo;o
            campo 10×10: 💥 bomba = fernuta, 🥃 shot (vodka/gin/assenzio),
            💸 malus (offri), 🎁 bonus (t&rsquo;offrono), 🃏 jolly =
            immunità ca decidi tu quanno usà.
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
      {(fase === "gioco" || fase === "finita") && (
        <>
          {/* Ordine + immunità */}
          <div className="flex max-w-xl flex-wrap justify-center gap-2">
            {ordine.map((n, i) => (
              <span
                key={n}
                className={`rounded-full border px-3 py-0.5 text-base transition-all ${
                  i === turno && fase === "gioco"
                    ? "border-assenzio bg-smeraldo/60 text-assenzio-pallido shadow-[0_0_12px_rgba(168,224,95,0.4)]"
                    : "border-ottone/30 text-etichetta-scura"
                }`}
              >
                {n}
                {(immunita[n] ?? 0) > 0 && ` 🃏×${immunita[n]}`}
              </span>
            ))}
          </div>

          {fase === "gioco" && (
            <div className="etichetta rounded-sm px-8 py-2.5 text-center">
              <p className="text-xs tracking-[0.3em] text-ottone-chiaro">
                TOCCA A
              </p>
              <p className="font-[family-name:var(--font-titolo)] text-2xl font-bold text-assenzio">
                {corrente}
              </p>
            </div>
          )}

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
                disabled={t.scoperta || fase !== "gioco"}
                className={`flex aspect-square items-center justify-center rounded-[3px] border text-base transition-all ${
                  t.scoperta
                    ? t.contenuto === "bomba"
                      ? "border-red-500/70 bg-red-950/60"
                      : t.contenuto === "jolly"
                        ? "border-ottone bg-ottone/20"
                        : t.contenuto.startsWith("bonus")
                          ? "border-assenzio/60 bg-smeraldo/30"
                          : t.contenuto.startsWith("offri")
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
            {fase === "finita" ? "↺ SE FA N'ATA VOTA" : "↺ RICOMINCIA"}
          </button>
        </>
      )}

      {/* ── Modale azione ── */}
      {azione && (
        <div className="fixed inset-0 z-[560] flex items-center justify-center bg-abisso/85 p-4 backdrop-blur-sm">
          <div className="etichetta w-full max-w-md animate-pop-in rounded-sm p-6 text-center">
            <p className="text-5xl">{EMOJI[azione.contenuto]}</p>
            {azione.gameOver ? (
              <>
                <p className="mt-2 font-[family-name:var(--font-titolo)] text-3xl font-bold text-red-400">
                  BOOM!
                </p>
                <div className="divisorio-oro my-3" />
                <p className="text-lg italic text-etichetta">
                  {azione.nome} ha truvato 'a bomba! Fernuta 'a partita. 💥
                </p>
                <div className="divisorio-oro my-4" />
                <button
                  onClick={reset}
                  className="rounded-sm border border-assenzio/70 bg-smeraldo/40 px-6 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-assenzio-pallido transition-all hover:scale-105 hover:bg-smeraldo/70"
                >
                  ↺ NOVA MANO
                </button>
              </>
            ) : (
              info && (
                <>
                  <p className="mt-2 font-[family-name:var(--font-titolo)] text-2xl font-bold text-ottone-chiaro">
                    {info.titolo}
                  </p>
                  <div className="divisorio-oro my-3" />
                  <p className="text-lg italic text-etichetta">
                    {info.testo(azione.nome)}
                  </p>
                  <div className="divisorio-oro my-4" />
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={chiudiAzione}
                      className="rounded-sm border border-assenzio/70 bg-smeraldo/40 px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-assenzio-pallido transition-all hover:scale-105 hover:bg-smeraldo/70"
                    >
                      {info.tipo === "bonus" ? "🎉 EVVIVA!" : "✔ FATTO!"}
                    </button>
                    {skippabile && jollyDelCorrente > 0 && (
                      <button
                        onClick={() => usaImmunita(azione.nome)}
                        className="rounded-sm border border-ottone px-5 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-ottone-chiaro transition-all hover:scale-105 hover:bg-ottone/15"
                      >
                        🃏 USA IMMUNITÀ ({jollyDelCorrente})
                      </button>
                    )}
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
