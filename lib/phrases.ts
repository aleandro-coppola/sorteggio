// 'O core napoletano dell'app: tutte le frasi, gli sfottò e gli easter egg.

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Sfottò per chi perde ──
export const FRASI_PERDENTE = [
  "Uè uè, hê perzo! Mo' paghe tu! 💸",
  "Che sfurtuna, guagliò! 'A prossima vota va meglio… forse. 😏",
  "'A Fata Verde t'ha vutato 'e spalle! 🧚",
  "Mannaggia 'a Marina! Hê perzo n'ata vota!",
  "Tiene 'a stessa fortuna 'e chi accatta 'o pesce 'o lunnerì. 🐟",
  "Nun t'abbattere: pure Maradona sbagliava… ogni tanto. ⚽",
  "Hê perzo. Statte buono e paga 'a bevuta. 🥂",
  "'O munno se divide 'ntra chi vence e chi… tu. 🤷",
  "Iamme bell', 'a sfurtuna è n'arte e tu si' n'artista! 🎨",
  "San Gennaro ogge teneva 'a jurnata libera. 🙏",
  "Chi perde paga, chi vence se ne va! 🏃💨",
  "T'è ghiuta male, frate'. Assaje male. 💀",
  "Nu poco 'e core: APPLAUSI P''O PERDENTE! 👏👏",
  "'A rota ha parlato: si' tu 'o ciuccio 'e Fechella! 🫏",
  "Nun è colpa toja… è colpa d''a scarogna ca te cammina appriesso. 🌧️",
  "Perdiste! Ma cu stile, questo va detto. 🎩",
] as const;

// ── Gloria per chi vince ──
export const FRASI_VINCITORE = [
  "VINCISTE! 'A Fata Verde t'ha vasato 'nfronte! 🧚✨",
  "Campione! Ogge se magna a gratis! 🏆",
  "'A fortuna è cecata, ma a te t'ha visto buono! 👁️✨",
  "Vincitore! Comme 'o sole 'ncopp' 'o Vesuvio! 🌋",
  "Hê vinciuto! Mo' nun fa' 'o splendido, però. 😎",
  "Grande! San Gennaro t'ha fatto 'a grazia! 🙏✨",
  "'A rota nun sbaglia maje: si' tu 'o meglio! 👑",
  "Vittoria! Stasera se brinda a salute toja! 🥂",
] as const;

// ── Eliminazione diretta ──
export const FRASI_ELIMINATO = [
  "Fore! {nome} se ne va a casa! 🚪",
  "{nome}, 'a porta è chella llà! 👉🚪",
  "Eliminato! Salutammo, {nome}! 👋",
  "{nome} è asciuto. Nisciuno 'o chiagne. 💀",
  "Game over pe' {nome}! Arrivederci e grazie! 🎮",
  "{nome}, 'a rota t'ha scartato comme 'a figurina doppia. 🃏",
  "Se n'è gghiuto {nome}: 'a fatica 'e campà era troppa. ⚰️",
  "{nome} torna a casa cu 'e mmane 'int' 'e sacche. 🫱",
] as const;

// ── Chi paga / giochi alcolici ──
export const FRASI_PAGA = [
  "{nome} PAGA TUTTO! Aprite 'e purtafogli… anzi no, sulo 'o suoio! 💸",
  "{nome}, 'o cunto è 'o tuoio! Salute! 🍻",
  "Stasera offre {nome}! Uè, che signore! 🎩",
  "{nome} paga. 'A legge d''a rota è legge! ⚖️",
  "{nome}, caccia 'e sorde: 'a rota ha deciso! 💰",
  "'O bancomat 'e stasera se chiamma {nome}! 🏧",
] as const;

export const FRASI_BEVE = [
  "{nome} se fa 'o shot! Giù giù giù! 🥃",
  "{nome} BEVE! E nun fa' 'a femmenella! 🍹",
  "Cin cin, {nome}: 'a rota vo' ca tu bive! 🍸",
  "{nome}, aizate 'o gomito: è n'ordine d''a Fata Verde! 🧚🥂",
  "Tutti guardano {nome} ca beve. Uno! Duje! Tre! 🍺",
] as const;

// ── Frasi per il duello ──
export const FRASI_ROUND_DUELLO = [
  "Punto pe' {nome}! 'A lotta continua! ⚔️",
  "{nome} segna! L'ato sta tremmanno! 😤",
  "Round pe' {nome}! Che spettacolo, signò! 🎭",
  "{nome} avanza! 'A rota lo ama! 💚",
] as const;

export const FRASI_VITTORIA_DUELLO = [
  "{nome} VENCE 'O DUELLO! L'avversario può ghì a chiagnere 'int' 'o bagno. 🏆",
  "È fernuta! {nome} è 'o gladiatore d''a serata! ⚔️👑",
  "{nome} trionfa! L'ato se ne torna a casa a piere. 🚶",
] as const;

// ── Easter egg: miracolo (1% di probabilità a ogni giro) ──
export const FRASI_MIRACOLO = [
  "⚡ MIRACOLO 'E SAN GENNARO! 'A rota s'è fermata addò vuleva essa! ⚡",
  "⚡ 'A FATA VERDE È APPARSA! Chistu giro era destino! ⚡",
] as const;

// ── Easter egg: nomi speciali ──
export const NOMI_SPECIALI: Record<string, string> = {
  assenzio: "🧚 'A Fata Verde riconosce 'o nomme suoio… che coraggio!",
  "fata verde": "🧚 Ma tu si' essa?! Benvenuta, maestà!",
  gennaro: "🙏 Uè Genna'! Cu 'stu nomme 'a fortuna è assicurata!",
  ciro: "😎 Ciro! 'O nomme cchiù bello 'e Napule!",
  maradona: "⚽ D10S in persona! 'A rota s'inchina!",
  diego: "⚽ Diego! Ah, che ricordi… 'a mano de Dios!",
  pulcinella: "🎭 Pulcinella! 'A maschera ha truvato 'a rota soja!",
  "san gennaro": "🙏 IL SANTO IN PERSONA! Facite 'a fila p''a grazia!",
};

// ── Nomi delle squadre a tema assenzio ──
export const NOMI_SQUADRE = [
  "Fata Verde 🧚",
  "Anice Stellato ⭐",
  "Artemisia 🌿",
  "Distillato 🥃",
  "Ora Verde 🕰️",
  "Boemia 🎭",
  "Louche 💫",
  "Vesuvio 🌋",
] as const;

// ── Toast di sistema, con sale ──
export const TOAST_POCHI_GIOCATORI =
  "Cu chi vuo' pazzià, sulo sulo? Aggiungi ll'amice! 👥";
export const TOAST_NOME_VUOTO = "Uagliò, 'o nomme addò sta? ✍️";
export const TOAST_NOME_DOPPIO =
  "Chistu nomme già ce sta! Che d'è, 'o clone? 👯";
export const TOAST_NOTTE_FONDA =
  "Ma nun tenite 'a casa? Songo 'e tre 'a notte! 🌙";
export const TOAST_FATA_LIBERATA =
  "Hê liberato 'a Fata Verde! Mo' vola pe' tutta 'a pagina! 🧚✨";

export function frase(template: string, nome: string): string {
  return template.replaceAll("{nome}", nome);
}
