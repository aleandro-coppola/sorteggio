"use client";

import { useState } from "react";
import { useSession } from "@/components/SessionProvider";

const ERRORI: Record<string, string> = {
  "codice-vuoto": "Miette nu codice p''a sessione! ✍️",
  "cloud-non-configurato":
    "Modalità condivisa nun configurata (manca Firebase). Vide 'o README.",
  "password-sbagliata": "Password sbagliata! Nun può trasì. 🚫",
  "errore-connessione": "Nun m'aggio pututo cunnettere… riprova! 📡",
};

export default function SessionBar() {
  const { sessionCode, status, error, cloudReady, join, leave } = useSession();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  const inSession = sessionCode !== null;

  const handleJoin = async () => {
    setBusy(true);
    const ok = await join(code, pass);
    setBusy(false);
    if (ok) {
      setOpen(false);
      setCode("");
      setPass("");
    }
  };

  return (
    <>
      {/* Pulsante in alto a sinistra */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-[700] flex h-11 items-center gap-2 rounded-full border border-ottone/50 bg-bottiglia/80 px-4 text-sm backdrop-blur transition-all hover:scale-105 hover:border-ottone active:scale-95"
        aria-label="Sessione condivisa"
      >
        {inSession ? (
          <>
            <span
              className={
                status === "connected"
                  ? "text-assenzio"
                  : "text-ottone-chiaro"
              }
            >
              {status === "connected" ? "🟢" : "🟡"}
            </span>
            <span className="max-w-[7rem] truncate font-[family-name:var(--font-titolo)] tracking-wider text-etichetta">
              {sessionCode}
            </span>
          </>
        ) : (
          <>
            <span>👥</span>
            <span className="font-[family-name:var(--font-titolo)] tracking-wider text-ottone-chiaro">
              SESSIONE
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[720] flex items-center justify-center bg-abisso/85 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="etichetta w-full max-w-md animate-pop-in rounded-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center font-[family-name:var(--font-titolo)] text-sm tracking-[0.35em] text-ottone-chiaro">
              ✦ SESSIONE CONDIVISA ✦
            </p>
            <div className="divisorio-oro my-4" />

            {!cloudReady && (
              <p className="mb-4 rounded-sm border border-ottone/40 bg-abisso/50 p-3 text-center text-sm italic text-etichetta-scura">
                Il salvataggio condiviso non è configurato: l&rsquo;app funziona
                in locale su questo dispositivo. Per attivare le sessioni serve
                una config Firebase (istruzioni nel README).
              </p>
            )}

            {inSession ? (
              <div className="text-center">
                <p className="text-lg italic text-etichetta">
                  Sì dint&rsquo; &rsquo;a sessione
                </p>
                <p className="testo-oro my-2 font-[family-name:var(--font-titolo)] text-3xl font-bold">
                  {sessionCode}
                </p>
                <p className="text-base text-etichetta-scura">
                  {status === "connected"
                    ? "🟢 In diretta: tutti vedono 'e stesse cose."
                    : "🟡 Mi sto cunnettenno…"}
                </p>
                <div className="divisorio-oro my-5" />
                <button
                  onClick={() => {
                    leave();
                    setOpen(false);
                  }}
                  className="rounded-sm border border-red-900/60 px-6 py-2 font-[family-name:var(--font-titolo)] text-sm tracking-widest text-red-300 transition-all hover:scale-105 hover:bg-red-950/40"
                >
                  ESCI D&rsquo;&rsquo;A SESSIONE
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-center text-base italic text-etichetta-scura">
                  Stesso codice + stessa password = stessa stanza. Se non esiste,
                  la crei tu (e ti porti dietro la cumitiva).
                </p>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Codice sessione (es. serata-mare)"
                  disabled={!cloudReady || busy}
                  className="rounded-sm border border-ottone/40 bg-bottiglia/80 px-4 py-2.5 text-lg text-etichetta placeholder:text-etichetta-scura/50 focus:border-assenzio focus:outline-none disabled:opacity-50"
                />
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && cloudReady && handleJoin()}
                  placeholder="Password d''a sessione"
                  disabled={!cloudReady || busy}
                  className="rounded-sm border border-ottone/40 bg-bottiglia/80 px-4 py-2.5 text-lg text-etichetta placeholder:text-etichetta-scura/50 focus:border-assenzio focus:outline-none disabled:opacity-50"
                />
                {error && (
                  <p className="text-center text-sm text-red-300">
                    {ERRORI[error] ?? "Qualcosa è ghiuto storto."}
                  </p>
                )}
                <button
                  onClick={handleJoin}
                  disabled={!cloudReady || busy}
                  className="etichetta rounded-sm px-6 py-3 font-[family-name:var(--font-titolo)] text-lg tracking-widest text-etichetta transition-all hover:scale-105 hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? "TRASENNO…" : "TRASI / CREA"}
                </button>
                <p className="text-center text-xs italic text-etichetta-scura/70">
                  Sicurezza leggera: chi ha codice e password vede e modifica
                  tutto. Buono p&rsquo;amici, no pe&rsquo; segreti. 😉
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
