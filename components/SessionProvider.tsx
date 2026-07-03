"use client";

// Stato condiviso della "sessione": cumitiva (giocatori) + Contabar (serate).
// Senza Firebase configurato → tutto in locale (localStorage), come prima.
// Con Firebase → entri in una stanza con codice+password e i dati si
// sincronizzano in tempo reale tra tutti i telefoni (last-write-wins).

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
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { cloudConfigured, getDb } from "@/lib/firebase";
import { Serata } from "@/lib/bar";

const PLAYERS_KEY = "assenzio-giocatori";
const BAR_KEY = "assenzio-bar";
const SESSION_KEY = "assenzio-sessione";

export type SessionStatus = "local" | "joining" | "connected" | "error";

type Ctx = {
  players: string[];
  setPlayers: Dispatch<SetStateAction<string[]>>;
  serate: Serata[];
  setSerate: Dispatch<SetStateAction<Serata[]>>;
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

export function SessionProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<string[]>([]);
  const [serate, setSerate] = useState<Serata[]>([]);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("local");
  const [error, setError] = useState<string | null>(null);

  const hydrated = useRef(false);
  const applyingRemote = useRef(false);
  const unsub = useRef<null | (() => void)>(null);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function subscribe(code: string) {
    const db = getDb();
    if (!db) return;
    unsub.current?.();
    unsub.current = onSnapshot(
      doc(db, "sessioni", code),
      (snap) => {
        if (!snap.exists()) return;
        if (snap.metadata.hasPendingWrites) return; // ignora l'eco locale
        const data = snap.data();
        applyingRemote.current = true;
        setPlayers(Array.isArray(data.players) ? data.players : []);
        setSerate(Array.isArray(data.serate) ? data.serate : []);
        setStatus("connected");
      },
      () => setStatus("error"),
    );
  }

  // Avvio: carica il locale e, se c'era una sessione, riconnettiti.
  useEffect(() => {
    setPlayers(readLocal<string[]>(PLAYERS_KEY, []));
    setSerate(readLocal<Serata[]>(BAR_KEY, []));
    const savedCode = readLocal<string | null>(SESSION_KEY, null);
    hydrated.current = true;
    if (savedCode && cloudConfigured && getDb()) {
      setSessionCode(savedCode);
      setStatus("joining");
      subscribe(savedCode);
    }
    return () => unsub.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistenza: locale se fuori sessione, Firestore se connesso.
  useEffect(() => {
    if (!hydrated.current) return;
    if (applyingRemote.current) {
      applyingRemote.current = false;
      return;
    }
    if (sessionCode) {
      if (status !== "connected") return; // aspetta la connessione
      const db = getDb();
      if (!db) return;
      if (writeTimer.current) clearTimeout(writeTimer.current);
      writeTimer.current = setTimeout(() => {
        updateDoc(doc(db, "sessioni", sessionCode), {
          players,
          serate,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }, 400);
    } else {
      try {
        localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
        localStorage.setItem(BAR_KEY, JSON.stringify(serate));
      } catch {
        /* pazienza */
      }
    }
  }, [players, serate, sessionCode, status]);

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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      try {
        localStorage.setItem(SESSION_KEY, code);
      } catch {
        /* pazienza */
      }
      applyingRemote.current = true; // niente clobber sul cambio sessione
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
    setSessionCode(null);
    setStatus("local");
    setError(null);
    // Torna ai dati locali salvati prima della sessione.
    setPlayers(readLocal<string[]>(PLAYERS_KEY, []));
    setSerate(readLocal<Serata[]>(BAR_KEY, []));
  }

  return (
    <SessionCtx.Provider
      value={{
        players,
        setPlayers,
        serate,
        setSerate,
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
