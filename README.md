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
| 💣 **Campo Minato** | La ruota decide l'ordine dei tap, poi si scava su una griglia 3×3–6×6: bomba = game over, jolly = immunità, malus "clicca due volte", bonus "salta il giro" e tessera che inverte il giro. Se il jolly ti salva, la bomba si riarma altrove. |
| 🔮 **Pallini** | Un contenitore (bicchiere, bottiglia o caraffa) pieno di pallini: ognuno stima quanti sono, si preme **Verifica** e chi va più vicino vince. Tre livelli di difficoltà; chi sbaglia di più si becca lo sfottò. |
| 🛡️ **Taverna** | GDR napoletano intrecciato col Contabar. Ogni giocatore ha un **personaggio** (archetipi reali: 'O Bevitore, 'A Zia Ansiosa, 'O Guappo, 'O Devoto 'e San Gennaro…) con statistiche (Fegato, Sfaccimma, Fortuna, Capa, Core), classe, abilità e motto. Livello e **Lucidità** dipendono dalle bevute vere: più bevi, più sali di livello ma cala la lucidità. Per i **momenti morti**, il tasto **Tira 'o Destino** lancia un evento con tiro di dado d20 (basato su chi ha bevuto quanto): chi fallisce beve, e puoi segnare la penitenza direttamente nel Contabar. Achievement/badge di serata inclusi. Nella scheda **🃏 Album** ogni drink è una **carta collezionabile** con rarità in base alla gradazione (dall'Analcolico comune all'Assenzio leggendario): la sblocchi bevendola, con vista per giocatore o per tutta la cumitiva e progresso "X / N". |
| 🍺 **Contabar** | Segna i drink bevuti da ogni giocatore scegliendoli da un **catalogo ricercabile** di ~65 bevande famose (dalla Corona alla Tennent's Super, dal Mojito al Negroni, shot, vini, analcolici…), ognuna con la sua **gradazione**. Le statistiche sono in **unità alcoliche** (l'analcolico vale 0, un Negroni pesa più di una birra): classifica di chi ha bevuto più alcol, campione assoluto e **sbornia storica**. Supporta **più serate** e ha anche lo **Storico** cronologico di ogni bevuta con data e ora. |
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

## Suoni 🔊

Ogni gioco ha i suoi effetti sonori — ticchettio della ruota che rallenta,
esplosione della bomba, fanfara di vittoria, trombetta triste per chi paga,
gorgoglìo del contenitore… — tutti **sintetizzati al volo con la Web Audio
API**: nessun file audio, funzionano offline. Il pulsante 🔊/🔇 in alto a
destra li accende e spegne (la scelta viene ricordata).

## Sessioni condivise 👥 (Firebase, opzionale)

Di default l'app è **locale**: ogni telefono tiene i suoi dati in `localStorage`.
Attivando Firebase, la comitiva può entrare in una **sessione condivisa** con
un *codice + password*: tutti vedono la stessa cumitiva e lo stesso Contabar,
**aggiornati in tempo reale** (ognuno segna le sue bevute dal proprio telefono).

Il pulsante **👥 Sessione** in alto a sinistra apre l'accesso. Stesso codice +
stessa password = stessa stanza; se non esiste, la crei tu (e ti porti dietro
la cumitiva del momento). L'indicatore diventa 🟢 quando sei in diretta.

### Come attivarlo

1. Crea un progetto gratis su [console.firebase.google.com](https://console.firebase.google.com)
2. Crea un database **Firestore** (parti in *modalità test*)
3. Aggiungi un'app **Web** (`</>`) e copia i valori di `firebaseConfig`
4. Copia `.env.example` in **`.env.local`** e incolla i tuoi valori
5. Riavvia (`npm run dev`): comparirà la modalità condivisa

Le chiavi hanno prefisso `NEXT_PUBLIC_` perché sono chiavi client pubbliche
(stanno nel browser: è normale). La sicurezza vera si fa con le **Regole di
Firestore** in console.

**Avvertenze oneste:**
- La "password di sessione" è un *segreto condiviso*, non un login vero: chi ha
  codice+password vede e modifica tutto. Va benissimo per amici, non per dati
  sensibili.
- Ogni modifica (aggiungi/togli bevuta, giocatore…) viene applicata al cloud con
  una **transazione Firestore**: due telefoni che modificano insieme non si
  sovrascrivono a vicenda, quindi una bevuta tolta resta tolta anche se un altro
  sta aggiungendo la sua nello stesso momento.
- In *modalità test* Firestore è aperto in lettura/scrittura: per un uso serio
  imposta regole più restrittive (o Firebase Auth).

## Installazione come app (PWA) 📱

L'app è una **PWA installabile**: dal browser puoi aggiungerla alla home e usarla
a schermo intero come un'app vera (con la sua icona a bottiglia d'assenzio).

- **iPhone/iPad (Safari)**: tocca *Condividi* → *Aggiungi a Home*
- **Android (Chrome)**: menu ⋮ → *Installa app* / *Aggiungi a schermata Home*
- **Desktop (Chrome/Edge)**: icona *Installa* nella barra degli indirizzi

Include manifest, icone (normali e *maskable*) e un **service worker** che fa da
cache: la parte locale funziona anche **offline**. Le sessioni condivise, essendo
in cloud, richiedono connessione. Nota: in `next dev` il service worker è
disattivato apposta; si attiva nella build di produzione (`npm run build && npm
start`, o su Vercel).

## Stack

Stack: **Next.js 15 (App Router) + React 19 + Tailwind CSS 4** + **Firebase**
(Firestore, opzionale per le sessioni condivise). Per il resto nessuna
dipendenza extra: ruota e contenitori in SVG, coriandoli su canvas, suoni in
Web Audio e animazioni CSS fatte in casa. Senza Firebase, giocatori e storico
del Contabar restano in `localStorage`, così la comitiva non si riscrive a
ogni serata e le bevute di ieri sera non si perdono.

*Bere responsabilmente, perdere con dignità. Nisciuna Fata Verde è stata
maltrattata durante 'e sorteggi.*
