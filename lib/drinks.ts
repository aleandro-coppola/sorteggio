// Catalogo statico dei drink più famosi, con gradazione (ABV %) e porzione
// tipica (ml). Da qui si calcolano le "unità alcoliche": così un analcolico
// vale 0 e un mojito o una Tennent's Super pesano il giusto.
// Valori indicativi (fonti varie tipo Wikipedia): servono per fare classifica,
// non per la patente.

export type Categoria =
  | "Birra"
  | "Cocktail"
  | "Shot & Liquori"
  | "Vino & Bolle"
  | "Analcolici";

export const CATEGORIE: { cat: Categoria; emoji: string }[] = [
  { cat: "Birra", emoji: "🍺" },
  { cat: "Cocktail", emoji: "🍹" },
  { cat: "Shot & Liquori", emoji: "🥃" },
  { cat: "Vino & Bolle", emoji: "🍷" },
  { cat: "Analcolici", emoji: "🧃" },
];

const CAT_EMOJI: Record<Categoria, string> = Object.fromEntries(
  CATEGORIE.map((c) => [c.cat, c.emoji]),
) as Record<Categoria, string>;

export type Drink = {
  id: string;
  nome: string;
  cat: Categoria;
  abv: number; // gradazione %
  ml: number; // porzione tipica
  emoji: string;
};

// [nome, categoria, abv, ml, emoji?]
const RAW: [string, Categoria, number, number, string?][] = [
  // ── Birra (dalla più leggera alla più tosta) ──
  ["Radler", "Birra", 2.5, 330],
  ["Corona", "Birra", 4.5, 330],
  ["Corona col collo (gin)", "Birra", 8.7, 350, "🍸"],
  ["Corona col collo (vodka)", "Birra", 8.7, 350, "🍸"],
  ["Guinness", "Birra", 4.2, 500],
  ["Moretti", "Birra", 4.6, 330],
  ["Ichnusa", "Birra", 4.7, 330],
  ["Peroni", "Birra", 4.7, 330],
  ["Heineken", "Birra", 5.0, 330],
  ["Nastro Azzurro", "Birra", 5.1, 330],
  ["Weiss (Weizen)", "Birra", 5.4, 500],
  ["Birra artigianale", "Birra", 6.0, 400],
  ["Leffe", "Birra", 6.6, 330],
  ["IPA", "Birra", 6.5, 400],
  ["Ceres", "Birra", 7.7, 330],
  ["Chimay Blu", "Birra", 9.0, 330],
  ["Tennent's Super", "Birra", 9.0, 330],
  ["Tennent's col collo (gin)", "Birra", 12.7, 360, "🍸"],
  ["Tennent's col collo (vodka)", "Birra", 12.7, 360, "🍸"],
  // ── Cocktail ──
  ["Aperol Spritz", "Cocktail", 8.0, 150, "🍊"],
  ["Spritz Campari", "Cocktail", 9.0, 150, "🍊"],
  ["Mimosa", "Cocktail", 6.0, 150],
  ["Sex on the Beach", "Cocktail", 10.0, 200],
  ["Moscow Mule", "Cocktail", 10.0, 200],
  ["Tequila Sunrise", "Cocktail", 11.0, 200],
  ["Cuba Libre", "Cocktail", 12.0, 200],
  ["Gin Tonic", "Cocktail", 12.0, 200],
  ["Bloody Mary", "Cocktail", 12.0, 180, "🍅"],
  ["Mojito", "Cocktail", 13.0, 200, "🍸"],
  ["Piña Colada", "Cocktail", 13.0, 200],
  ["Gin Lemon", "Cocktail", 14.0, 200],
  ["Vodka Lemon", "Cocktail", 14.0, 200],
  ["Americano", "Cocktail", 15.0, 120],
  ["Mai Tai", "Cocktail", 20.0, 150],
  ["Caipirinha", "Cocktail", 20.0, 150],
  ["Daiquiri", "Cocktail", 22.0, 100, "🍸"],
  ["Long Island Iced Tea", "Cocktail", 22.0, 220],
  ["Negroni", "Cocktail", 24.0, 90, "🍸"],
  ["Margarita", "Cocktail", 25.0, 100, "🍸"],
  ["Cosmopolitan", "Cocktail", 25.0, 100, "🍸"],
  // ── Shot & Liquori ──
  ["Baileys", "Shot & Liquori", 17.0, 50],
  ["Limoncello", "Shot & Liquori", 28.0, 40],
  ["Amaro", "Shot & Liquori", 30.0, 40],
  ["B52", "Shot & Liquori", 30.0, 60],
  ["Jägermeister", "Shot & Liquori", 35.0, 40],
  ["Sambuca", "Shot & Liquori", 38.0, 40],
  ["Tequila Boom", "Shot & Liquori", 38.0, 40],
  ["Fernet", "Shot & Liquori", 39.0, 40],
  ["Shot Vodka", "Shot & Liquori", 40.0, 40],
  ["Rum", "Shot & Liquori", 40.0, 40],
  ["Whisky", "Shot & Liquori", 40.0, 40],
  ["Gin liscio", "Shot & Liquori", 40.0, 40],
  ["Grappa", "Shot & Liquori", 42.0, 40],
  ["Assenzio", "Shot & Liquori", 68.0, 30, "🧚"],
  // ── Vino & Bolle ──
  ["Lambrusco", "Vino & Bolle", 11.0, 125],
  ["Prosecco", "Vino & Bolle", 11.0, 100, "🥂"],
  ["Vino Bianco", "Vino & Bolle", 12.0, 125, "🥂"],
  ["Champagne", "Vino & Bolle", 12.0, 100, "🥂"],
  ["Rosé", "Vino & Bolle", 12.0, 125],
  ["Vino della casa", "Vino & Bolle", 12.5, 150],
  ["Vino Rosso", "Vino & Bolle", 13.0, 125],
  ["Passito", "Vino & Bolle", 15.0, 75],
  // ── Analcolici (valgono 0) ──
  ["Acqua", "Analcolici", 0, 500, "💧"],
  ["Coca Cola", "Analcolici", 0, 330, "🥤"],
  ["Chinotto", "Analcolici", 0, 200, "🥤"],
  ["Tè freddo", "Analcolici", 0, 330, "🧋"],
  ["Succo di frutta", "Analcolici", 0, 200, "🧃"],
  ["Crodino", "Analcolici", 0, 100, "🍊"],
  ["Red Bull", "Analcolici", 0, 250, "🥤"],
  ["Caffè", "Analcolici", 0, 40, "☕"],
];

const slug = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // via i segni diacritici
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const CATALOGO: Drink[] = RAW.map(([nome, cat, abv, ml, emoji]) => ({
  id: slug(nome),
  nome,
  cat,
  abv,
  ml,
  emoji: emoji ?? CAT_EMOJI[cat],
}));

const BY_ID: Record<string, Drink> = Object.fromEntries(
  CATALOGO.map((d) => [d.id, d]),
);

export function drinkById(id: string): Drink | undefined {
  return BY_ID[id];
}

// Grammi di alcol puro in una porzione: ml × abv% × densità(0.789).
export function grammiAlcol(d: Drink): number {
  return d.ml * (d.abv / 100) * 0.789;
}

// Unità alcoliche: 1 UA ≈ 12 g di alcol puro (standard italiano).
export function unitaAlcoliche(d: Drink): number {
  return grammiAlcol(d) / 12;
}

// UA di un drink dato l'id (0 se sconosciuto/analcolico).
export function uaById(id: string): number {
  const d = BY_ID[id];
  return d ? unitaAlcoliche(d) : 0;
}
