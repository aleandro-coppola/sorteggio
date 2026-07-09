// Carte collezionabili: ogni drink del catalogo è una carta. La collezioni
// bevendola (dai conteggi del Contabar). La rarità dipende dalla gradazione.

import { Serata } from "./bar";

export type Rarita =
  | "comune"
  | "noncomune"
  | "rara"
  | "epica"
  | "leggendaria";

export const RARITA_ORDINE: Rarita[] = [
  "leggendaria",
  "epica",
  "rara",
  "noncomune",
  "comune",
];

export const RARITA_LABEL: Record<Rarita, string> = {
  comune: "Comune",
  noncomune: "Non comune",
  rara: "Rara",
  epica: "Epica",
  leggendaria: "Leggendaria",
};

// Rarità dalla gradazione: più è forte, più è pregiata.
export function raritaDi(abv: number): Rarita {
  if (abv === 0) return "comune";
  if (abv < 6) return "noncomune";
  if (abv < 13) return "rara";
  if (abv < 45) return "epica";
  return "leggendaria"; // l'Assenzio 68% è il pezzo pregiato
}

// Quante volte ogni drink è stato bevuto (da un giocatore o da tutta la
// cumitiva) su tutte le serate.
export function collezione(
  serate: Serata[],
  chi: string, // nome giocatore oppure "__tutti__"
  players: string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  const nomi = chi === "__tutti__" ? players : [chi];
  for (const s of serate) {
    for (const n of nomi) {
      const pc = s.counts[n];
      if (!pc) continue;
      for (const [id, q] of Object.entries(pc)) {
        out[id] = (out[id] ?? 0) + (q ?? 0);
      }
    }
  }
  return out;
}
