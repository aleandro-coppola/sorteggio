"use client";

import { useEffect, useState } from "react";
import Wheel from "@/components/Wheel";
import ResultOverlay from "@/components/ResultOverlay";
import { fireConfetti } from "@/lib/confetti";
import {
  FRASI_BOMBA,
  FRASI_BONUS,
  FRASI_INVERTI,
  FRASI_JOLLY,
  FRASI_JOLLY_USATO,
  FRASI_MALUS,
  FRASI_ULTIMA_TESSERA,
  FRASI_VUOTO,
  frase,
  pick,
  shuffle,
} from "@/lib/phrases";
import {
  playBomb,
  playBonus,
  playInvert,
  playJolly,
  playMalus,
  playPop,
  playWin,
} from "@/lib/sound";

type Contenuto = "vuoto" | "bomba" | "jolly" | "malus" | "bonus" | "inverti" | "disinnescata";

type Tessera = {
  contenuto: Contenuto;
  scoperta: boolean;
};

type Fase = "ordine" | "gioco" | "finita";

type GridSize = 3 | 4 | 5 | 6;

// Quante tessere speciali per ogni dimensione (il resto è vuoto).
const DISTRIBUZIONE: Record<GridSize, { malus: number; bonus: number; inverti: number }> = {
  3: { malus: 1, bonus: 1, inverti: 0 },
  4: { malus: 2, bonus: 2, inverti: 1 },
  5: { malus: 3, bonus: 3, inverti: 2 },
  6: { malus: 4, bonus: 4, inverti: 2 },
};

const EMOJI: Record<Contenuto, string> = {
  vuoto: "🍃",
  bomba: "💣",
  jolly: "🃏",
  malus: "🔁",
  bonus: "🏖️",
  inverti: "🌀",
  disinnescata: "🧯",
};

function creaGriglia(size: GridSize): Tessera[] {
  const tot = size * size;
  const { malus, bonus, inverti } = DISTRIBUZIONE[size];
  const contenuti: Contenuto[] = [
    "bomba",
    "jolly",
    ...Array<Contenuto>(malus).fill("malus"),
    ...Array<Contenuto>(bonus).fill("bonus"),
    ...Array<Contenuto>(inverti).fill("inverti"),
  ];
  while (contenuti.length < tot) contenuti.push("vuoto");
  return shuffle(contenuti).map((contenuto) => ({ contenuto, scoperta: false }));
}

export default function CampoMinato({
  players,
  notify,
}: {
  players: string[];
  notify: (msg: string) => void;
}) {
  const [fase, setFase] = useState<Fase>("ordine");
  const [size, setSize] = useState<GridSize>(4);
  const [ordine, setOrdine] = useState<string[]>([]);
  const [daSorteggiare, setDaSorteggiare] = useState<string[]>(players);
  const [griglia, setGriglia] = useState<Tessera[]>([]);
  const [turno, setTurno] = useState(0);
  const [direzione, setDirezione] = useState(1);
  const [clickRimasti, setClickRimasti] = useState(1);
  const [immuni, setImmuni] = useState<string[]>([]);
  const [inFerie, setInFerie] = useState<string[]>([]);
  const [evento, setEvento] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<{
    title: string;
    name: string;
    phrase: string;
    tone: "gloria" | "sfotto";
    gameOver: boolean;
  } | null>(null);

  // Se cambia la comitiva, si ricomincia da capo.
  useEffect(() => {
    setFase("ordine");
    setOrdine([]);
    setDaSorteggiare(players);
    setGriglia([]);
    setImmuni([]);
    setInFerie([]);
    setEvento(null);
    setOverlay(null);
  }, [players]);

  const avviaGioco = (ordineFinale: string[]) => {
    setOrdine(ordineFinale);
    setGriglia(creaGriglia(size));
    setTurno(0);
    setDirezione(1);
    setClickRimasti(1);
    setImmuni([]);
    setInFerie([]);
    setEvento(null);
    setFase("gioco");
  };

  // ── Fase ordine: la ruota assegna le posizioni una a una ──
  const handleOrdineSpin = (index: number) => {
    const scelto = daSorteggiare[index];
    const nuovoOrdine = [...ordine, scelto];
    const restanti = daSorteggiare.filter((_, i) => i !== index);
    if (restanti.length === 1) {
      avviaGioco([...nuovoOrdine, restanti[0]]);
      notify(`${restanti[0]} va urdemo… comme sempe. 💀`);
    } else {
      setOrdine(nuovoOrdine);
      setDaSorteggiare(restanti);
    }
  };

  const ordineACaso = () => {
    avviaGioco([...ordine, ...shuffle(daSorteggiare)]);
  };

  // ── Fase gioco ──
  const giocatoreCorrente = ordine[turno] ?? "";

  const prossimoTurno = (da: number, dir: number, ferie: string[]): void => {
    let idx = da;
    let saltati = ferie;
    for (let i = 0; i < ordine.length + 1; i++) {
      idx = (idx + dir + ordine.length) % ordine.length;
      const nome = ordine[idx];
      if (saltati.includes(nome)) {
        saltati = saltati.filter((n) => n !== nome);
        notify(`🏖️ ${nome} chistu giro s''o salta: sta 'n ferie!`);
      } else {
        break;
      }
    }
    setInFerie(saltati);
    setTurno(idx);
    setClickRimasti(1);
  };

  const scopri = (i: number) => {
    if (fase !== "gioco" || griglia[i].scoperta || overlay) return;
    const nome = giocatoreCorrente;
    const tessera = griglia[i];
    let nuova = griglia.map((t, j) => (j === i ? { ...t, scoperta: true } : t));
    let dir = direzione;
    let click = clickRimasti - 1;
    let ferie = inFerie;

    switch (tessera.contenuto) {
      case "bomba": {
        if (immuni.includes(nome)) {
          // Il jolly paga al posto suo: bomba disinnescata e riarmata altrove.
          setImmuni(immuni.filter((n) => n !== nome));
          nuova[i] = { contenuto: "disinnescata", scoperta: true };
          const nascoste = nuova
            .map((t, j) => (!t.scoperta && t.contenuto === "vuoto" ? j : -1))
            .filter((j) => j >= 0);
          if (nascoste.length === 0) {
            // Non c'è più posto per riarmarla: finisce senza vittime.
            setGriglia(nuova.map((t) => ({ ...t, scoperta: true })));
            setFase("finita");
            setOverlay({
              title: "TUTTI SALVI",
              name: nome,
              phrase: `${frase(pick(FRASI_JOLLY_USATO), nome)} …anzi no: 'a bomba nun tene cchiù addò annasconnerse. TUTTI SALVI! 🎉`,
              tone: "gloria",
              gameOver: true,
            });
            fireConfetti(200);
            playWin();
            return;
          }
          playJolly();
          const j = pick(nascoste);
          nuova = nuova.map((t, k) =>
            k === j ? { ...t, contenuto: "bomba" as Contenuto } : t,
          );
          setGriglia(nuova);
          setOverlay({
            title: "SARVATO D''O JOLLY",
            name: nome,
            phrase: frase(pick(FRASI_JOLLY_USATO), nome),
            tone: "gloria",
            gameOver: false,
          });
          prossimoTurno(turno, dir, ferie);
          return;
        }
        setGriglia(nuova.map((t) => ({ ...t, scoperta: true })));
        setFase("finita");
        playBomb();
        setOverlay({
          title: "GAME OVER",
          name: nome,
          phrase: frase(pick(FRASI_BOMBA), nome),
          tone: "sfotto",
          gameOver: true,
        });
        return;
      }
      case "jolly":
        setImmuni([...immuni, nome]);
        setOverlay({
          title: "IMMUNITÀ",
          name: nome,
          phrase: frase(pick(FRASI_JOLLY), nome),
          tone: "gloria",
          gameOver: false,
        });
        fireConfetti(80);
        break;
      case "malus":
        click += 1;
        playMalus();
        setEvento(frase(pick(FRASI_MALUS), nome));
        break;
      case "bonus":
        ferie = [...ferie, nome];
        playBonus();
        setEvento(frase(pick(FRASI_BONUS), nome));
        break;
      case "inverti":
        dir = -dir;
        setDirezione(dir);
        playInvert();
        setEvento(pick(FRASI_INVERTI));
        break;
      default:
        playPop();
        setEvento(frase(pick(FRASI_VUOTO), nome));
    }

    setGriglia(nuova);

    const nascoste = nuova.filter((t) => !t.scoperta);
    if (nascoste.length === 1 && nascoste[0].contenuto === "bomba") {
      setEvento(FRASI_ULTIMA_TESSERA);
    }

    if (click > 0) {
      setClickRimasti(click);
      setInFerie(ferie);
    } else {
      prossimoTurno(turno, dir, ferie);
    }
  };

  const reset = () => {
    setFase("ordine");
    setOrdine([]);
    setDaSorteggiare(players);
    setGriglia([]);
    setOverlay(null);
    setEvento(null);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* ── Fase 1: l'ordine lo decide la ruota ── */}
      {fase === "ordine" && (
        <>
          <p className="max-w-lg text-center text-lg italic text-etichetta-scura">
            Primma &rsquo;a rota decide chi tocca &rsquo;e tessere e in che
            ordine. Po&rsquo; se scava: 💣 bomba = game over, 🃏 jolly =
            immunità, 🔁 clicchi n&rsquo;ata vota, 🏖️ salti &rsquo;o giro,
            🌀 s&rsquo;inverte &rsquo;o giro.
          </p>

          <div className="flex items-center gap-3">
            <span className="text-lg text-etichetta-scura">Campo:</span>
            {([3, 4, 5, 6] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`rounded-sm border px-3 py-1.5 font-[family-name:var(--font-titolo)] text-sm transition-all ${
                  size === s
                    ? "border-assenzio bg-smeraldo/50 text-assenzio-pallido"
                    : "border-ottone/40 text-etichetta hover:border-ottone"
                }`}
              >
                {s}×{s}
              </button>
            ))}
          </div>

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

      {/* ── Fase 2: il campo minato ── */}
      {(fase === "gioco" || fase === "finita") && (
        <>
          {/* Ordine di gioco con badge */}
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
                {immuni.includes(n) && " 🃏"}
                {inFerie.includes(n) && " 🏖️"}
              </span>
            ))}
            <span className="rounded-full border border-ottone/30 px-3 py-0.5 text-base text-etichetta-scura">
              {direzione === 1 ? "↻" : "↺"}
            </span>
          </div>

          {fase === "gioco" && (
            <div className="etichetta rounded-sm px-8 py-3 text-center">
              <p className="text-sm tracking-[0.3em] text-ottone-chiaro">
                TOCCA A
              </p>
              <p className="font-[family-name:var(--font-titolo)] text-3xl font-bold text-assenzio">
                {giocatoreCorrente}
              </p>
              {clickRimasti > 1 && (
                <p className="mt-1 text-base italic text-etichetta-scura">
                  ancora {clickRimasti} tap! 🔁
                </p>
              )}
            </div>
          )}

          {evento && (
            <p className="max-w-lg animate-pop-in text-center text-xl italic text-etichetta">
              {evento}
            </p>
          )}

          <div
            className="grid w-full max-w-md gap-2"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {griglia.map((t, i) => (
              <button
                key={i}
                onClick={() => scopri(i)}
                disabled={t.scoperta || fase !== "gioco"}
                className={`aspect-square rounded-sm border text-3xl transition-all sm:text-4xl ${
                  t.scoperta
                    ? t.contenuto === "bomba"
                      ? "animate-pop-in border-red-500/70 bg-red-950/60"
                      : t.contenuto === "jolly" || t.contenuto === "disinnescata"
                        ? "animate-pop-in border-ottone bg-ottone/20 shadow-[0_0_14px_rgba(201,162,39,0.4)]"
                        : "animate-pop-in border-ottone/25 bg-bottiglia/40"
                    : "etichetta cursor-pointer hover:scale-105 hover:brightness-150 active:scale-95"
                }`}
                aria-label={t.scoperta ? t.contenuto : `Tessera ${i + 1} coperta`}
              >
                {t.scoperta ? (
                  <span className={t.contenuto === "vuoto" ? "opacity-40" : ""}>
                    {EMOJI[t.contenuto]}
                  </span>
                ) : (
                  <span className="text-xl text-ottone/60">✦</span>
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

      {overlay && (
        <ResultOverlay
          title={overlay.title}
          name={overlay.name}
          phrase={overlay.phrase}
          tone={overlay.tone}
          onClose={() => setOverlay(null)}
          actionLabel={overlay.gameOver ? "SE FA N'ATA VOTA" : undefined}
          onAction={overlay.gameOver ? reset : undefined}
        />
      )}
    </div>
  );
}
