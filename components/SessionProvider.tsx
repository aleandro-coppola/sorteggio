"use client";

// Stato condiviso della "sessione": cumitiva (giocatori) + Contabar (serate).
// Senza Firebase configurato → tutto in locale (localStorage), come prima.
// Con Firebase → entri in una stanza con codice+password e i dati si
// sincronizzano in tempo reale tra tutti i telefoni.
//
// Ogni modifica viene applicata al cloud con una TRANSAZIONE Firestore: la
// funzione di aggiornamento (es. "togli 1 birra a Ciro") viene rieseguita sullo
// stato più fresco del server, così due telefoni che modificano insieme non si
// sovrascrivono a vicenda (niente più bevute che "riappaiono").

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { cloudConfigured, getDb } from "@/lib/firebase";
import { Serata } from "@/lib/bar";
import { Scusa } from "@/lib/scuse";

const PLAYERS_KEY = "assenzio-giocatori";
const BAR_KEY = "assenzio-bar";
const SCUSE_KEY = "assenzio-scuse";
const SESSION_KEY = "assenzio-sessione";

export type SessionStatus = "local" | "joining" | "connected" | "error";

type Ctx = {
  players: string[];
  setPlayers: Dispatch<SetStateAction<string[]>>;
  serate: Serata[];
  setSerate: Dispatch<SetStateAction<Serata[]>>;
  scuse: Scusa[];
  setScuse: Dispatch<SetStateAction<Scusa[]>>;
  sessionCode: string | null;
  status: SessionStatus;
  error: string | null;
  cloudReady: boolean;
  join: (code: string, password: string) => Promise<boolean>;
  leave: () => void;
};

const SessionCtx = createContext<Ctx | null>(null);

export function useSession(): Ctx {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("useSession fuori da SessionProvider");
  return c;
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(s),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const readLocal = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const toUpdater = <T,>(action: SetStateAction<T>): ((prev: T) => T) =>
  typeof action === "function" ? (action as (prev: T) => T) : () => action;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [players, setPlayersState] = useState<string[]>([]);
  const [serate, setSerateState] = useState<Serata[]>([]);
  const [scuse, setScuseState] = useState<Scusa[]>([]);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("local");
  const [error, setError] = useState<string | null>(null);

  const hydrated = useRef(false);
  const unsub = useRef<null | (() => void)>(null);
  const codeRef = useRef<string | null>(null);

  useEffect(() => {
    codeRef.current = sessionCode;
  }, [sessionCode]);

  function subscribe(code: string) {
    const db = getDb();
    if (!db) return;
    unsub.current?.();
    unsub.current = onSnapshot(
      doc(db, "sessioni", code),
      (snap) => {
        if (!snap.exists()) return;
        if (snap.metadata.hasPendingWrites) return; // solo stato confermato dal server
        const data = snap.data();
        setPlayersState(Array.isArray(data.players) ? data.players : []);
        setSerateState(Array.isArray(data.serate) ? data.serate : []);
        setScuseState(Array.isArray(data.scuse) ? data.scuse : []);
        setStatus("connected");
      },
      () => setStatus("error"),
    );
  }

  // Applica un aggiornamento al cloud in modo atomico (transazione).
  function commitField(
    field: "players" | "serate" | "scuse",
    updater: (cur: unknown[]) => unknown[],
  ) {
    const code = codeRef.current;
    const db = getDb();
    if (!code || !db) return;
    const ref = doc(db, "sessioni", code);
    runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const cur =
        snap.exists() && Array.isArray(snap.data()[field])
          ? (snap.data()[field] as unknown[])
          : [];
      tx.set(
        ref,
        { [field]: updater(cur), updatedAt: serverTimestamp() },
        { merge: true },
      );
    }).catch((e) => console.warn(`sync ${field} fallita:`, e));
  }

  // Setter "intelligenti": aggiornano subito il locale (reattività) e, se sei in
  // sessione, applicano la stessa modifica al cloud con una transazione.
  const setPlayers: Dispatch<SetStateAction<string[]>> = (action) => {
    const updater = toUpdater(action);
    setPlayersState(updater);
    if (codeRef.current) {
      commitField("players", (cur) => updater(cur as string[]));
    }
  };

  const setSerate: Dispatch<SetStateAction<Serata[]>> = (action) => {
    const updater = toUpdater(action);
    setSerateState(updater);
    if (codeRef.current) {
      commitField("serate", (cur) => updater(cur as Serata[]));
    }
  };

  const setScuse: Dispatch<SetStateAction<Scusa[]>> = (action) => {
    const updater = toUpdater(action);
    setScuseState(updater);
    if (codeRef.current) {
      commitField("scuse", (cur) => updater(cur as Scusa[]));
    }
  };

  // Avvio: carica il locale e, se c'era una sessione, riconnettiti.
  useEffect(() => {
    setPlayersState(readLocal<string[]>(PLAYERS_KEY, []));
    setSerateState(readLocal<Serata[]>(BAR_KEY, []));
    setScuseState(readLocal<Scusa[]>(SCUSE_KEY, []));
    let savedCode: string | null = null;
    try {
      savedCode = localStorage.getItem(SESSION_KEY);
    } catch {
      savedCode = null;
    }
    hydrated.current = true;
    if (savedCode && cloudConfigured && getDb()) {
      codeRef.current = savedCode;
      setSessionCode(savedCode);
      setStatus("joining");
      subscribe(savedCode);
    }
    return () => unsub.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fuori sessione: persisti in locale. In sessione: ci pensano le transazioni.
  useEffect(() => {
    if (!hydrated.current || sessionCode) return;
    try {
      localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
      localStorage.setItem(BAR_KEY, JSON.stringify(serate));
      localStorage.setItem(SCUSE_KEY, JSON.stringify(scuse));
    } catch {
      /* pazienza */
    }
  }, [players, serate, scuse, sessionCode]);

  async function join(codeRaw: string, password: string): Promise<boolean> {
    const code = codeRaw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!code) {
      setError("codice-vuoto");
      return false;
    }
    const db = getDb();
    if (!cloudConfigured || !db) {
      setError("cloud-non-configurato");
      return false;
    }
    setStatus("joining");
    setError(null);
    try {
      const ref = doc(db, "sessioni", code);
      const snap = await getDoc(ref);
      const hash = await sha256(password);
      if (snap.exists()) {
        const remoteHash = snap.data().pass as string | undefined;
        if (remoteHash && remoteHash !== hash) {
          setStatus("error");
          setError("password-sbagliata");
          return false;
        }
      } else {
        // Nuova stanza: la seminiamo con la cumitiva/serate attuali.
        await setDoc(ref, {
          pass: hash,
          players,
          serate,
          scuse,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      try {
        localStorage.setItem(SESSION_KEY, code);
      } catch {
        /* pazienza */
      }
      codeRef.current = code;
      subscribe(code);
      setSessionCode(code);
      return true;
    } catch {
      setStatus("error");
      setError("errore-connessione");
      return false;
    }
  }

  function leave() {
    unsub.current?.();
    unsub.current = null;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* pazienza */
    }
    codeRef.current = null;
    setSessionCode(null);
    setStatus("local");
    setError(null);
    // Torna ai dati locali salvati prima della sessione.
    setPlayersState(readLocal<string[]>(PLAYERS_KEY, []));
    setSerateState(readLocal<Serata[]>(BAR_KEY, []));
    setScuseState(readLocal<Scusa[]>(SCUSE_KEY, []));
  }

  return (
    <SessionCtx.Provider
      value={{
        players,
        setPlayers,
        serate,
        setSerate,
        scuse,
        setScuse,
        sessionCode,
        status,
        error,
        cloudReady: cloudConfigured,
        join,
        leave,
      }}
    >
      {children}
    </SessionCtx.Provider>
  );
}
