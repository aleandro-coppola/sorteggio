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
  ["Tennent's Lager", "Birra", 4.0, 330],
  ["Corona", "Birra", 4.6, 330],
  ["Corona col collo (gin)", "Birra", 8.8, 302, "🍸"],
  ["Corona col collo (vodka)", "Birra", 8.8, 302, "🍸"],
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
  ["Tennent's col collo (gin)", "Birra", 8.3, 302, "🍸"],
  ["Tennent's col collo (vodka)", "Birra", 8.3, 302, "🍸"],
  // ── Cocktail (ABV e UA dalla lista fornita) ──
  ["Negroni", "Cocktail", 27.0, 90, "🍸"],
  ["Negroni Sbagliato", "Cocktail", 15.8, 91, "🍸"],
  ["Americano", "Cocktail", 11.5, 139],
  ["Milano-Torino", "Cocktail", 20.5, 100],
  ["Boulevardier", "Cocktail", 26.5, 89, "🥃"],
  ["Martini Cocktail", "Cocktail", 36.5, 75, "🍸"],
  ["Manhattan", "Cocktail", 29.5, 88, "🍸"],
  ["Old Fashioned", "Cocktail", 32.5, 77, "🥃"],
  ["Margarita", "Cocktail", 28.0, 84, "🍸"],
  ["Daiquiri", "Cocktail", 24.0, 86, "🍸"],
  ["Cosmopolitan", "Cocktail", 19.5, 94, "🍸"],
  ["Espresso Martini", "Cocktail", 20.5, 100, "☕"],
  ["White Russian", "Cocktail", 18.5, 103, "🥛"],
  ["Aperol Spritz", "Cocktail", 9.8, 147, "🍊"],
  ["Spritz Campari", "Cocktail", 10.2, 149, "🍊"],
  ["Aperol Sour", "Cocktail", 14.0, 92, "🍊"],
  ["Campari Soda", "Cocktail", 9.5, 104],
  ["French 75", "Cocktail", 16.5, 106, "🥂"],
  ["Limoncello Spritz", "Cocktail", 12.5, 134, "🍋"],
  ["Hugo", "Cocktail", 8.2, 139, "🌿"],
  ["Bellini", "Cocktail", 8.5, 125, "🍑"],
  ["Rossini", "Cocktail", 8.5, 125, "🍓"],
  ["Mimosa", "Cocktail", 6.0, 140],
  ["Mojito", "Cocktail", 14.5, 131, "🍸"],
  ["Caipirinha", "Cocktail", 16.0, 150],
  ["Long Island Iced Tea", "Cocktail", 22.0, 142],
  ["Gin Tonic", "Cocktail", 13.8, 127],
  ["Gin Lemon", "Cocktail", 11.0, 200],
  ["Vodka Lemon", "Cocktail", 12.5, 128],
  ["Moscow Mule", "Cocktail", 13.8, 127],
  ["Cuba Libre", "Cocktail", 13.2, 127],
  ["Tequila Sunrise", "Cocktail", 11.8, 129],
  ["Piña Colada", "Cocktail", 12.5, 128],
  ["Sex on the Beach", "Cocktail", 14.0, 120],
  ["Bloody Mary", "Cocktail", 10.0, 180, "🍅"],
  ["Mai Tai", "Cocktail", 18.0, 150],
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
  ["4 Bianchi", "Shot & Liquori", 31.5, 109, "⚪"],
  ["4 Bianchi con Baileys", "Shot & Liquori", 28.0, 125, "🥛"],
  ["Penitenza", "Shot & Liquori", 40.0, 40, "🎲"],
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
