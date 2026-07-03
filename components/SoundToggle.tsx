"use client";

import { useEffect, useState } from "react";
import { isMuted, toggleMuted } from "@/lib/sound";

export default function SoundToggle() {
  const [muto, setMuto] = useState(false);

  useEffect(() => {
    setMuto(isMuted());
  }, []);

  return (
    <button
      onClick={() => setMuto(toggleMuted())}
      className="fixed right-3 top-3 z-[700] flex h-11 w-11 items-center justify-center rounded-full border border-ottone/50 bg-bottiglia/80 text-xl backdrop-blur transition-all hover:scale-110 hover:border-ottone active:scale-95"
      aria-label={muto ? "Attiva i suoni" : "Silenzia i suoni"}
      title={muto ? "Suoni: spenti" : "Suoni: accesi"}
    >
      {muto ? "🔇" : "🔊"}
    </button>
  );
}
