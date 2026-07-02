"use client";

import { useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import { NOMI_SQUADRE, shuffle } from "@/lib/phrases";

type Team = {
  name: string;
  members: string[];
};

export default function Squadre({
  players,
  notify,
}: {
  players: string[];
  notify: (msg: string) => void;
}) {
  const maxTeams = Math.min(Math.floor(players.length / 2), 8);
  const [numTeams, setNumTeams] = useState(2);
  const [teams, setTeams] = useState<Team[]>([]);

  const forma = () => {
    if (players.length < 4) {
      notify("Pe' ffà 'e squadre servono almeno 4 perzone! 👥");
      return;
    }
    const n = Math.min(numTeams, maxTeams);
    const mixed = shuffle(players);
    const names = shuffle(NOMI_SQUADRE);
    const result: Team[] = Array.from({ length: n }, (_, i) => ({
      name: names[i],
      members: [],
    }));
    mixed.forEach((p, i) => result[i % n].members.push(p));
    setTeams(result);
    fireConfetti(100);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-center text-lg italic text-etichetta-scura">
        &rsquo;A rota mmescola e sparte: squadre fatte d&rsquo;&rsquo;o destino,
        senza appelli e senza chiagnimenti. 👥
      </p>

      <div className="flex items-center gap-3">
        <span className="text-lg text-etichetta-scura">Squadre:</span>
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => setNumTeams(n)}
            disabled={n > maxTeams}
            className={`h-10 w-10 rounded-full border font-[family-name:var(--font-titolo)] text-lg transition-all disabled:opacity-30 ${
              numTeams === n
                ? "border-assenzio bg-smeraldo/50 text-assenzio-pallido"
                : "border-ottone/40 text-etichetta hover:border-ottone"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        onClick={forma}
        className="etichetta rounded-sm px-10 py-3 font-[family-name:var(--font-titolo)] text-xl tracking-[0.2em] text-etichetta transition-all hover:scale-105 hover:brightness-125 active:scale-95"
      >
        FORMA &rsquo;E SQUADRE
      </button>

      {teams.length > 0 && (
        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          {teams.map((team, i) => (
            <div
              key={team.name}
              className="etichetta animate-pop-in rounded-sm p-5"
              style={{ animationDelay: `${i * 0.15}s`, opacity: 0 }}
            >
              <p className="text-center font-[family-name:var(--font-titolo)] text-xl text-ottone-chiaro">
                {team.name}
              </p>
              <div className="divisorio-oro my-3" />
              <ul className="space-y-1 text-center text-lg">
                {team.members.map((m) => (
                  <li key={m} className="text-etichetta">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
