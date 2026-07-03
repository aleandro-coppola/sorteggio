// Dati e persistenza del "Contabar": drink bevuti per giocatore, divisi per
// serata (perché la comitiva magari si vede più giorni). Tutto in localStorage.
// I drink sono identificati dall'id del catalogo (lib/drinks.ts), così ognuno
// porta con sé la sua gradazione e il conto in unità alcoliche.

import { uaById } from "./drinks";

export type PlayerCount = Record<string, number>; // drinkId -> quantità
export type Counts = Record<string, PlayerCount>;
// Registro cronologico: ogni bevuta aggiunta lascia una riga con data/ora.
export type LogEvent = { t: string; nome: string; drink: string };
export type Serata = {
  id: string;
  date: string;
  counts: Counts;
  log?: LogEvent[];
};

const KEY = "assenzio-bar";

export function loadSerate(): Serata[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Serata[]) : [];
  } catch {
    return [];
  }
}

export function saveSerate(list: Serata[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* pazienza */
  }
}

export function nuovaSerata(): Serata {
  return {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString(),
    counts: {},
    log: [],
  };
}

// Numero di bevute (di qualsiasi tipo).
export function totalePlayer(c: PlayerCount | undefined): number {
  if (!c) return 0;
  return Object.values(c).reduce((a, b) => a + (b ?? 0), 0);
}

// Unità alcoliche totali: ogni drink pesa per la sua gradazione.
export function uaPlayer(c: PlayerCount | undefined): number {
  if (!c) return 0;
  return Object.entries(c).reduce(
    (a, [id, qty]) => a + uaById(id) * (qty ?? 0),
    0,
  );
}

// Un "eroe" beve solo analcolici (probabilmente guida): almeno un drink, zero alcol.
export function isEroe(c: PlayerCount | undefined): boolean {
  return totalePlayer(c) > 0 && uaPlayer(c) < 0.05;
}

export function formatData(iso: string): string {
  const d = new Date(iso);
  const s = d.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function labelSerata(s: Serata, index: number): string {
  return `Serata #${index + 1} — ${formatData(s.date)}`;
}

// Data + ora compatte di una singola bevuta, es. "3 lug, 23:41".
export function formatOra(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
