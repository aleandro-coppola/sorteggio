# 🍾 ASSENZIO — La Ruota dei Sorteggi

> *Distillato di pura fortuna dal 1805 — 68% vol. di sfortuna altrui.*

Una ruota dei sorteggi che non è la solita ruota della fortuna: design ispirato
alla bottiglia di assenzio (verde bottiglia, smeraldo, chartreuse e ottone),
sfottò in napoletano per chi perde e qualche easter egg nascosto. Perfetta con
gli amici, al mare, per i giochi da tavolo e per i giochi alcolici.

## Modalità di sorteggio

| Modalità | Cosa fa |
|---|---|
| 🎯 **Classico** | Estrae un nome a caso. Gloria e coriandoli per l'eletto. |
| ⚔️ **Duello** | Due sfidanti, al meglio di 3 o di 5. Tabellone punti e sfottò finale per chi perde. |
| 💀 **Eliminazione** | Ogni giro elimina qualcuno: l'ultimo che resta è il campione. |
| 🍻 **Chi Paga?** | Per i giochi alcolici: la ruota decide chi paga (o chi beve). |
| 👥 **Squadre** | Divide la comitiva in 2–4 squadre con nomi a tema assenzio. |
| 🎲 **Ordine** | Sorteggia l'ordine di gioco: chi comincia e chi arriva urdemo… comme sempe. |

## Easter egg 🧚

Non li elenchiamo tutti (sennò che easter egg sono), ma qualche indizio:

- Prova a **cliccare più volte sulla bottiglia** in cima alla pagina…
- Alcuni **nomi** sono più speciali di altri (un santo, un D10S, una maschera…)
- Ogni tanto — molto raramente — la ruota compie un **miracolo**.
- Chi perde riceve uno sfottò random **in napoletano**. Sempre.
- Se giocate alle 3 di notte, l'app ha qualcosa da dirvi.

## Avvio

```bash
npm install
npm run dev       # sviluppo su http://localhost:3000
npm run build && npm start   # produzione
```

Stack: **Next.js 15 (App Router) + React 19 + Tailwind CSS 4**. Nessuna
dipendenza extra: ruota in SVG, coriandoli su canvas e animazioni CSS fatte in
casa. I giocatori restano salvati in `localStorage`, così la comitiva non si
riscrive a ogni serata.

*Bere responsabilmente, perdere con dignità. Nisciuna Fata Verde è stata
maltrattata durante 'e sorteggi.*
