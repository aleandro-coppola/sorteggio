// Albo delle scuse: le giustificazioni dei membri per non bere, con voto 1-10.

export type Scusa = {
  id: string;
  nome: string;
  testo: string;
  voto: number; // 1..10
  t: string; // ISO
};

// Commento in base al voto (più è alto, più la scusa è "geniale").
export function commentoVoto(voto: number): string {
  if (voto >= 9) return "🏆 Capolavoro d'a scusa!";
  if (voto >= 7) return "😏 Bona, se regge.";
  if (voto >= 5) return "🤔 Passabile…";
  if (voto >= 3) return "🙄 Ma vattenne va'.";
  return "🤡 Vergognosa. Bevi e statte zitto.";
}
