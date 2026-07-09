// "'A Taverna d''o Destino": GDR napoletano intrecciato col Contabar.
// Personaggi generati in modo DETERMINISTICO dal nome (stesso nome → stessa
// scheda su tutti i telefoni, senza salvare niente), livello e "lucidità" che
// dipendono dalle bevute reali, e un motore di eventi con tiro di dado d20.

import { CATALOGO } from "./drinks";
import { PlayerCount } from "./bar";

export type StatKey = "fegato" | "sfaccimma" | "fortuna" | "capa" | "core";

export const STAT_INFO: { key: StatKey; label: string; emoji: string }[] = [
  { key: "fegato", label: "Fegato", emoji: "🫀" },
  { key: "sfaccimma", label: "Sfaccimma", emoji: "😏" },
  { key: "fortuna", label: "Fortuna", emoji: "🍀" },
  { key: "capa", label: "Capa", emoji: "🧠" },
  { key: "core", label: "Core", emoji: "❤️‍🔥" },
];

export type Stats = Record<StatKey, number>;

export type Archetipo = {
  id: string;
  nome: string;
  emoji: string;
  desc: string;
  abilita: string;
  mod: Partial<Stats>;
};

export const ARCHETIPI: Archetipo[] = [
  {
    id: "bevitore",
    nome: "'O Bevitore Leggendario",
    emoji: "🍺",
    desc: "Regge cchiù 'e nu vôtte. 'A birra pe' isso è acqua fresca.",
    abilita: "Reggenza: tira 'o Fegato cu vantaggio quanno 'nce sta 'a bevuta.",
    mod: { fegato: 4, capa: -2 },
  },
  {
    id: "zia",
    nome: "'A Zia Ansiosa",
    emoji: "👵",
    desc: "Tene sempe 'o fazzuletto e 'o consiglio pronto. «Mèttete 'a maglia!»",
    abilita: "Prevenzione: puó fà rifà nu tiro a n'ato, na vôta a serata.",
    mod: { capa: 3, core: -2 },
  },
  {
    id: "guappo",
    nome: "'O Guappo",
    emoji: "🕶️",
    desc: "Cammina chianu chianu, ma tutta 'a tavula 'o sape.",
    abilita: "Ommo 'e panza: quanno beve, se porta appriesso a n'ato.",
    mod: { sfaccimma: 4, fortuna: -2 },
  },
  {
    id: "vecchio",
    nome: "'O Vecchio Saggio",
    emoji: "🧓",
    desc: "Ha visto 'e serate ca tu manco t'immagine. Poche parole, buone.",
    abilita: "Esperienza: 'na vôta scanza 'na penitenza cu 'a saggezza.",
    mod: { capa: 3, fortuna: 2, fegato: -2 },
  },
  {
    id: "tirchio",
    nome: "'O Tirchio",
    emoji: "🤏",
    desc: "'O purtafoglio 'o tene cu 'e catene. Nun paga manco si more.",
    abilita: "Sicché: schiva 'o primmo giro 'e «chi paga».",
    mod: { fortuna: 3, sfaccimma: -2 },
  },
  {
    id: "sciupafemmene",
    nome: "'O Sciupafemmene",
    emoji: "💃",
    desc: "Nu surriso e t'ha fregato. Cchiù fascino ca capa.",
    abilita: "Fascino: 'na vôta passa 'na penitenza a chi vô isso.",
    mod: { sfaccimma: 3, core: 2, capa: -2 },
  },
  {
    id: "devoto",
    nome: "'O Devoto 'e San Gennaro",
    emoji: "🙏",
    desc: "Cu 'a fede spusta 'e muntagne… e 'e dadi.",
    abilita: "Miracolo: 'na vôta ritira nu dado sfortunato.",
    mod: { fortuna: 4, fegato: -2 },
  },
  {
    id: "neomelodico",
    nome: "'O Neomelodico",
    emoji: "🎤",
    desc: "Tene 'a canzone pronta pe' ogni occasione. Played by ear.",
    abilita: "Serenata: si cantà, tutt' 'a tavula brinda cu isso.",
    mod: { core: 4, capa: -2 },
  },
  {
    id: "fesso",
    nome: "'O Fesso",
    emoji: "🤡",
    desc: "Nu poco scemo, nu poco fortunato. Nun se sape maje che fa.",
    abilita: "Botta 'e culo: 'o 20 e l'1 cuntano doppio (bene o male).",
    mod: { fortuna: 2, capa: -1, core: 1 },
  },
  {
    id: "mare",
    nome: "'O Figlio d''o Mare",
    emoji: "🌊",
    desc: "Sole 'ncoppa, birra calda in mano, zero pensieri.",
    abilita: "Salsedine: regge 'o sole e 'a birra 'e miezziuorno.",
    mod: { core: 3, fegato: 2, fortuna: -2 },
  },
];

// Classe (mestiere) derivata dalla statistica più alta.
const CLASSI: Record<StatKey, string> = {
  fegato: "Guerriero d''o Spritz",
  sfaccimma: "Bardo Neomelodico",
  fortuna: "Chierico 'e San Gennaro",
  capa: "Mago d''o Ragù",
  core: "Barbaro d''o Mare",
};

const NOMI_EPICI = [
  "'o Longa Vita",
  "Scassapallone",
  "'o Terribile",
  "Mani 'e Fata",
  "'o Sfasteriato",
  "Core 'e Mamma",
  "'o Sicco",
  "Panza 'e Ferro",
  "'o Signurino",
  "'o Malamente",
  "Capa 'e Fierro",
  "'o Guaglione",
];

const MOTTI = [
  "«Chi beve sulo, s'affoga.»",
  "«'A vita è na rota: gira e t'acchiappa.»",
  "«Nun se more maje, si 'nce sta 'o brindisi.»",
  "«Meglio nu bicchiere 'e cchiù ca nu penziero 'e meno.»",
  "«San Gennaro pensaci tu.»",
  "«'O munno è 'e chi s'o piglia.»",
  "«Salute e ammore, 'o riesto è chiacchiere.»",
  "«Tengo 'o fegato 'e nu leone.»",
];

// ── PRNG deterministico dal nome ──
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Personaggio = {
  nome: string;
  archetipo: Archetipo;
  stats: Stats;
  classe: string;
  nomeEpico: string;
  motto: string;
};

export function generaPersonaggio(nome: string): Personaggio {
  const rng = mulberry32(hashString(nome.toLowerCase().trim()));
  const archetipo = ARCHETIPI[Math.floor(rng() * ARCHETIPI.length)];
  const stats = {} as Stats;
  for (const { key } of STAT_INFO) {
    const base = 8 + Math.floor(rng() * 11); // 8..18
    const val = base + (archetipo.mod[key] ?? 0);
    stats[key] = Math.max(3, Math.min(20, val));
  }
  const topStat = STAT_INFO.map((s) => s.key).reduce((a, b) =>
    stats[b] > stats[a] ? b : a,
  );
  const nomeEpico = NOMI_EPICI[Math.floor(rng() * NOMI_EPICI.length)];
  const motto = MOTTI[Math.floor(rng() * MOTTI.length)];
  return {
    nome,
    archetipo,
    stats,
    classe: CLASSI[topStat],
    nomeEpico,
    motto,
  };
}

// Modificatore stile D&D.
export function statMod(v: number): number {
  return Math.floor((v - 10) / 2);
}

// Livello dalle unità alcoliche bevute (2 UA = 1 livello).
export function livelloDaUA(ua: number): number {
  return 1 + Math.floor(ua / 2);
}
export function progressoLivello(ua: number): number {
  return (ua % 2) / 2; // 0..1 verso il prossimo livello
}

// Lucidità (HP): parte da 100, l'alcol la cala; più Fegato = meno danno.
export function lucidita(ua: number, fegato: number): number {
  const dannoPerUA = Math.max(2, 12 - statMod(fegato) * 2);
  return Math.max(0, Math.min(100, Math.round(100 - ua * dannoPerUA)));
}

// ── Achievement / figurine della serata ──
export type Badge = { emoji: string; nome: string };

const BEER_IDS = new Set(CATALOGO.filter((d) => d.cat === "Birra").map((d) => d.id));

export function badges(pc: PlayerCount | undefined, ua: number): Badge[] {
  const c = pc ?? {};
  const out: Badge[] = [];
  const n = Object.values(c).reduce((a, b) => a + (b ?? 0), 0);
  if ((c["assenzio"] ?? 0) > 0) out.push({ emoji: "🧚", nome: "Domatore d'Assenzio" });
  if ((c["4-bianchi"] ?? 0) > 0) out.push({ emoji: "⚪", nome: "I 4 Bianchi" });
  const birre = Object.entries(c).reduce(
    (a, [id, q]) => a + (BEER_IDS.has(id) ? q : 0),
    0,
  );
  if (birre >= 6) out.push({ emoji: "🍺", nome: "Maratoneta" });
  if (n > 0 && ua < 0.05) out.push({ emoji: "🧃", nome: "Eroe (guida)" });
  if (ua >= 8) out.push({ emoji: "💀", nome: "Sotto 'o tavulo" });
  return out;
}

// ── Motore eventi ("Tira 'o Destino") ──
export type EventoCtx = {
  players: string[];
  ua: Record<string, number>;
  pers: Record<string, Personaggio>;
  rng: () => number;
};

export type Evento = {
  id: string;
  titolo: string;
  emoji: string;
  tipo: "solo" | "duello" | "sorte";
  stat?: StatKey;
  dc?: number;
  // Sceglie il/i bersaglio/i; ritorna [] se non applicabile.
  scegli: (ctx: EventoCtx) => string[];
  testo: (nomi: string[]) => string;
  penitenza: string; // cosa succede a chi "perde"
  premio?: string; // cosa succede se va bene
};

const pickRandom = (arr: string[], rng: () => number) =>
  arr[Math.floor(rng() * arr.length)];

const menoUbriaco = (ctx: EventoCtx) =>
  [...ctx.players].sort((a, b) => (ctx.ua[a] ?? 0) - (ctx.ua[b] ?? 0))[0];
const piuUbriaco = (ctx: EventoCtx) =>
  [...ctx.players].sort((a, b) => (ctx.ua[b] ?? 0) - (ctx.ua[a] ?? 0))[0];

export const EVENTI: Evento[] = [
  {
    id: "asciutto",
    titolo: "'O Cavaliere Asciutto",
    emoji: "🌵",
    tipo: "solo",
    stat: "core",
    dc: 11,
    scegli: (ctx) => [menoUbriaco(ctx)],
    testo: ([n]) => `${n} è 'o cchiù asciutto d''a tavula. 'A vergogna! Tira 'o Core pe' nun sfigurà.`,
    penitenza: "Bevi! Nun può restà 'nfaccia a tutte accussì asciutto.",
    premio: "Reggi 'a posizione: si' sobrio e fiero.",
  },
  {
    id: "guappo",
    titolo: "'A Prova d''o Guappo",
    emoji: "🕶️",
    tipo: "solo",
    stat: "sfaccimma",
    dc: 12,
    scegli: (ctx) => [pickRandom(ctx.players, ctx.rng)],
    testo: ([n]) => `Nu guappo 'nvisibile sfida ${n}: facci 'a faccia tosta. Tira 'a Sfaccimma!`,
    penitenza: "Hê calato 'a capa: bevi tu.",
    premio: "Faccia 'e bronzo: te sî sarvato.",
  },
  {
    id: "barcollante",
    titolo: "'O Barcollante",
    emoji: "🥴",
    tipo: "solo",
    stat: "fegato",
    dc: 13,
    scegli: (ctx) => [piuUbriaco(ctx)],
    testo: ([n]) => `${n} è 'o cchiù carico d''a serata… 'a terra se move? Tira 'o Fegato pe' restà 'mpiede.`,
    penitenza: "Hê perzo l'equilibrio: n'atu sorso (o acqua, dai).",
    premio: "Reggi ancora! Fegato 'e ferro.",
  },
  {
    id: "gennaro",
    titolo: "Miracolo 'e San Gennaro",
    emoji: "🙏",
    tipo: "solo",
    stat: "fortuna",
    dc: 12,
    scegli: (ctx) => [pickRandom(ctx.players, ctx.rng)],
    testo: ([n]) => `San Gennaro guarda ${n}: tira 'a Fortuna. Si va bene, brinda tutta 'a tavula!`,
    penitenza: "Niente grazia: bevi sulo tu.",
    premio: "MIRACOLO! Brindisi generale, tutte bevono! 🥂",
  },
  {
    id: "colletta",
    titolo: "'A Colletta",
    emoji: "💸",
    tipo: "solo",
    stat: "capa",
    dc: 12,
    scegli: (ctx) => [pickRandom(ctx.players, ctx.rng)],
    testo: ([n]) => `Arriva 'o cunto! ${n}, tira 'a Capa pe' truvà 'a scusa e nun pavà.`,
    penitenza: "T'hanno fregato: offri 'a prossima o bevi.",
    premio: "Sî scappato 'a botta: stavolta paga n'ato.",
  },
  {
    id: "duello",
    titolo: "'O Duello 'e Sguardi",
    emoji: "👀",
    tipo: "duello",
    stat: "sfaccimma",
    scegli: (ctx) => {
      const mix = [...ctx.players].sort(() => ctx.rng() - 0.5);
      return mix.slice(0, 2);
    },
    testo: ([a, b]) => `${a} contro ${b}: sguardo fisso, chi ride primmo perde. Tira 'a Sfaccimma!`,
    penitenza: "Chi perde… beve. 'A legge è legge.",
  },
  {
    id: "sfortuna",
    titolo: "'A Mano d''a Sfortuna",
    emoji: "🎯",
    tipo: "sorte",
    scegli: (ctx) => [pickRandom(ctx.players, ctx.rng)],
    testo: ([n]) => `'A rota d''a scarogna gira… e s'è fermata 'ncoppa a ${n}!`,
    penitenza: "Nisciuna scusa, nisciuno tiro: bevi e statte zitto.",
  },
  {
    id: "mare",
    titolo: "'O Sole 'e Miezziuorno",
    emoji: "🌞",
    tipo: "solo",
    stat: "core",
    dc: 11,
    scegli: (ctx) => [pickRandom(ctx.players, ctx.rng)],
    testo: ([n]) => `Sole a picco 'ncoppa a ${n}: tira 'o Core pe' nun squaglià.`,
    penitenza: "T'è pigliata 'a capa 'o sole: bevi frisco.",
    premio: "Duro comme 'o scoglio: reggi 'o sole.",
  },
];

export type Esito = {
  evento: Evento;
  nomi: string[];
  tiri: { nome: string; dado: number; mod: number; totale: number }[];
  perdenti: string[]; // chi deve bere
  vincitori: string[];
  successo: boolean; // per gli eventi "solo"
};

// Risolve un evento (calcola i tiri di dado e chi beve).
export function risolviEvento(evento: Evento, ctx: EventoCtx): Esito {
  const nomi = evento.scegli(ctx);
  const tiroDi = (nome: string) => {
    const dado = 1 + Math.floor(ctx.rng() * 20);
    const mod = evento.stat ? statMod(ctx.pers[nome]?.stats[evento.stat] ?? 10) : 0;
    return { nome, dado, mod, totale: dado + mod };
  };

  if (evento.tipo === "sorte") {
    return {
      evento,
      nomi,
      tiri: [],
      perdenti: nomi,
      vincitori: [],
      successo: false,
    };
  }

  if (evento.tipo === "duello") {
    const tiri = nomi.map(tiroDi);
    const max = Math.max(...tiri.map((t) => t.totale));
    const vincitori = tiri.filter((t) => t.totale === max).map((t) => t.nome);
    const perdenti = tiri.filter((t) => !vincitori.includes(t.nome)).map((t) => t.nome);
    return { evento, nomi, tiri, perdenti, vincitori, successo: true };
  }

  // solo
  const tiro = tiroDi(nomi[0]);
  const successo = tiro.totale >= (evento.dc ?? 12);
  return {
    evento,
    nomi,
    tiri: [tiro],
    perdenti: successo ? [] : [nomi[0]],
    vincitori: successo ? [nomi[0]] : [],
    successo,
  };
}
